import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateScalePaidCheck,
  addMonths,
  monthsBetween,
  quarterOf,
} from "../dist/scale-paid-check.js";
import { createServer } from "../dist/server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");

async function callServerTool(args) {
  const server = createServer();
  const handler = server._requestHandlers.get("tools/call");
  return handler({
    method: "tools/call",
    params: { name: "scale_paid_check", arguments: args },
  });
}

function makeBaseInput(overrides = {}) {
  return {
    product: "Workflow automation software for logistics dispatch teams",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-09-30",
    customers: [],
    churn_reasons: "dispatchers go back to spreadsheets, volume drops in quiet months",
    interview_persona: "Head of Dispatch Operations",
    ...overrides,
  };
}

test("1. add_months from 31 January and cohort checkpoint boundaries", () => {
  // Hand-worked calendar arithmetic from 2025-01-31 (non-leap year 2025, leap year 2024):
  // - 2025-01-31 + 1 month: Feb 2025 has 28 days -> 2025-02-28
  // - 2024-01-31 + 1 month: Feb 2024 is a leap year (2024 % 4 === 0) with 29 days -> 2024-02-29
  // - 2025-01-31 + 3 months: Apr 2025 has 30 days -> 2025-04-30
  // - 2025-01-31 + 6 months: Jul 2025 has 31 days -> 2025-07-31
  // - 2025-01-31 + 9 months: Oct 2025 has 31 days -> 2025-10-31
  // - 2025-01-31 + 12 months: Jan 2026 has 31 days -> 2026-01-31
  assert.equal(addMonths("2025-01-31", 1), "2025-02-28");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2025-01-31", 3), "2025-04-30");
  assert.equal(addMonths("2025-01-31", 6), "2025-07-31");
  assert.equal(addMonths("2025-01-31", 9), "2025-10-31");
  assert.equal(addMonths("2025-01-31", 12), "2026-01-31");
  assert.equal(quarterOf("2025-01-31"), "2025-Q1");
  assert.equal(monthsBetween("2025-01-31", "2025-02-28"), 1);

  // Build 1 customer signed 2025-01-31 who stopped on 2025-04-30 (confirmed: 2026-09-30 - 2025-04-30 = 518 days >= 90).
  // Checkpoint M3 is add_months("2025-01-31", 3) = "2025-04-30".
  // Since paying on c requires c < stopped ("2025-04-30" < "2025-04-30" is false), customer is lost at M3 (0 of 1, 0%).
  const res = generateScalePaidCheck(
    makeBaseInput({
      customers: [
        { id: "C01", signed: "2025-01-31", segment: "Core", monthly_fee: 1000, stopped: "2025-04-30" },
      ],
    })
  );
  assert.equal(res.structuredContent.cohorts[0].month_3.k, 0);
  assert.equal(res.structuredContent.cohorts[0].month_3.n, 1);
  assert.match(res.text, /2025-Q1 \| 1 \| 0 of 1 \(0%\)/);
});

test("2. stops at 89 and at 90 days before as_of (pending, then confirmed)", () => {
  // Hand-worked day counts before as_of = "2026-09-30":
  // - July has 31 days, August has 31 days, September has 30 days.
  // - Stop date "2026-07-03":
  //   Days in July after Jul 3 = 31 - 3 = 28
  //   Days in August = 31
  //   Days in September = 30
  //   Total = 28 + 31 + 30 = 89 days (< 90 days) -> PENDING ("pending: stopped under 90 days ago"), counts as paying everywhere.
  // - Stop date "2026-07-02":
  //   Days in July after Jul 2 = 31 - 2 = 29
  //   Total = 29 + 31 + 30 = 90 days (>= 90 days) -> CONFIRMED STOP, not paying on as_of.
  // With 2 customers (monthly_fee = $1,000 each):
  // - C89 (stopped 2026-07-03, 89 days ago) counts as paying on 2026-09-30 -> MRR includes $1,000.
  // - C90 (stopped 2026-07-02, 90 days ago) is confirmed lost on 2026-09-30 -> MRR excludes $1,000.
  // Expected paying_on_as_of = 1, mrr_on_as_of = 1000.
  const res = generateScalePaidCheck(
    makeBaseInput({
      as_of: "2026-09-30",
      customers: [
        { id: "C89", signed: "2025-05-01", segment: "Fleet", monthly_fee: 1000, stopped: "2026-07-03" },
        { id: "C90", signed: "2025-05-01", segment: "Fleet", monthly_fee: 1000, stopped: "2026-07-02" },
      ],
    })
  );

  assert.equal(res.structuredContent.echo.paying_on_as_of, 1);
  assert.equal(res.structuredContent.echo.mrr_on_as_of, 1000);
  assert.equal(res.structuredContent.pending_customers.length, 1);
  assert.equal(res.structuredContent.pending_customers[0].id, "C89");
  assert.equal(res.structuredContent.pending_customers[0].days_since_stopped, 89);
  assert.match(res.text, /C89.*89 days before 2026-09-30.*pending: stopped under 90 days ago/);
});

test("3. a resumed customer counts as paused while stopped and kept from the resume date", () => {
  // Hand-worked timeline for customer CR1:
  // - signed: "2025-01-10", monthly_fee: $2,000
  // - stopped: "2025-05-01"
  // - resumed: "2025-08-01"
  // - as_of: "2026-09-30"
  // Checkpoints from signed "2025-01-10":
  // - Month 3 ("2025-04-10"): before stopped ("2025-05-01") -> paying (1 of 1, 100%)
  // - Month 6 ("2025-07-10"): >= stopped ("2025-05-01") and < resumed ("2025-08-01") -> NOT paying (0 of 1, 0%)
  // - Month 9 ("2025-10-10"): >= resumed ("2025-08-01") -> paying (1 of 1, 100%)
  // - Month 12 ("2026-01-10"): >= resumed ("2025-08-01") -> paying (1 of 1, 100%)
  // - On as_of ("2026-09-30"): >= resumed -> paying (MRR = $2,000)
  // - Listed as "pause: came back".
  const res = generateScalePaidCheck(
    makeBaseInput({
      as_of: "2026-09-30",
      customers: [
        {
          id: "CR1",
          signed: "2025-01-10",
          segment: "Carriers",
          monthly_fee: 2000,
          stopped: "2025-05-01",
          resumed: "2025-08-01",
        },
      ],
    })
  );

  const cohort = res.structuredContent.cohorts[0];
  assert.equal(cohort.month_3.k, 1);
  assert.equal(cohort.month_6.k, 0);
  assert.equal(cohort.month_9.k, 1);
  assert.equal(cohort.month_12.k, 1);
  assert.equal(res.structuredContent.echo.paying_on_as_of, 1);
  assert.equal(res.structuredContent.echo.mrr_on_as_of, 2000);
  assert.equal(res.structuredContent.paused_customers.length, 1);
  assert.equal(res.structuredContent.paused_customers[0].id, "CR1");
  assert.match(res.text, /CR1.*pause: came back/);
});

test("4. each rejected-row reason is caught, listed and excluded from sums", () => {
  // Hand-worked rows (8 received):
  // 1. VALID1: signed "2025-03-01", monthly_fee 1500 -> USED (paying on 2026-09-30, MRR = $1,500)
  // 2. BAD_DATE_SIGNED: signed "2025-02-29" (2025 is not a leap year) -> REJECTED (not a real YYYY-MM-DD date)
  // 3. BAD_DATE_STOPPED: signed "2025-03-01", stopped "2025-04-31" (April has 30 days) -> REJECTED (not a real YYYY-MM-DD date)
  // 4. AFTER_AS_OF: signed "2026-10-01" > as_of "2026-09-30" -> REJECTED (signed is after as_of)
  // 5. STOP_BEFORE_SIGN: signed "2025-05-10", stopped "2025-05-09" -> REJECTED (stopped is before signed)
  // 6. RESUME_BEFORE_STOP: signed "2025-05-10", stopped "2025-08-10", resumed "2025-08-09" -> REJECTED (resumed is before stopped)
  // 7. ZERO_FEE: signed "2025-05-10", monthly_fee 0 -> REJECTED (monthly_fee <= 0)
  // 8. VALID1 (duplicate id): signed "2025-06-01", monthly_fee 2000 -> REJECTED (id repeats)
  // Expected: rows_received = 8, rows_used = 1, rows_rejected = 7, paying_on_as_of = 1, mrr_on_as_of = 1500.
  const res = generateScalePaidCheck(
    makeBaseInput({
      as_of: "2026-09-30",
      customers: [
        { id: "VALID1", signed: "2025-03-01", segment: "Core", monthly_fee: 1500 },
        { id: "BAD_DATE_SIGNED", signed: "2025-02-29", segment: "Core", monthly_fee: 1500 },
        { id: "BAD_DATE_STOPPED", signed: "2025-03-01", segment: "Core", monthly_fee: 1500, stopped: "2025-04-31" },
        { id: "AFTER_AS_OF", signed: "2026-10-01", segment: "Core", monthly_fee: 1500 },
        { id: "STOP_BEFORE_SIGN", signed: "2025-05-10", segment: "Core", monthly_fee: 1500, stopped: "2025-05-09" },
        { id: "RESUME_BEFORE_STOP", signed: "2025-05-10", segment: "Core", monthly_fee: 1500, stopped: "2025-08-10", resumed: "2025-08-09" },
        { id: "ZERO_FEE", signed: "2025-05-10", segment: "Core", monthly_fee: 0 },
        { id: "VALID1", signed: "2025-06-01", segment: "Core", monthly_fee: 2000 },
      ],
    })
  );

  assert.equal(res.structuredContent.echo.rows_received, 8);
  assert.equal(res.structuredContent.echo.rows_used, 1);
  assert.equal(res.structuredContent.echo.rows_rejected, 7);
  assert.equal(res.structuredContent.echo.paying_on_as_of, 1);
  assert.equal(res.structuredContent.echo.mrr_on_as_of, 1500);
  const reasons = res.structuredContent.rejected_rows.map((r) => `${r.id}: ${r.reason}`).join("\n");
  assert.match(reasons, /BAD_DATE_SIGNED.*not a real YYYY-MM-DD date/);
  assert.match(reasons, /BAD_DATE_STOPPED.*not a real YYYY-MM-DD date/);
  assert.match(reasons, /AFTER_AS_OF.*after as_of/);
  assert.match(reasons, /STOP_BEFORE_SIGN.*before signed/);
  assert.match(reasons, /RESUME_BEFORE_STOP.*before stopped/);
  assert.match(reasons, /ZERO_FEE.*<= 0/);
  assert.match(reasons, /VALID1.*repeats/);
});

test("5. shape test with 0 and 0 losses must not fail", () => {
  // Hand-worked cohorts:
  // - Cohort 2025-Q2: 5 customers signed 2025-04-10, 0 stopped -> k6 = 5, k12 = 5.
  //   lost_1_6 = 5 - 5 = 0; lost_7_12 = 5 - 5 = 0.
  //   Shape test fails only when lost_7_12 > 0 && lost_7_12 >= lost_1_6. Since lost_7_12 === 0, shape_pass is true.
  //   Line test: 5/5 = 100% >= 80% -> line_pass is true.
  // - Cohort 2025-Q3: 5 customers signed 2025-07-10, 0 stopped -> k6 = 5, k12 = 5.
  //   lost_1_6 = 0, lost_7_12 = 0 -> shape_pass is true, line_pass is true.
  // Base verdict must be PASS.
  const customers = [
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `Q2_${i + 1}`,
      signed: "2025-04-10",
      segment: "SteadyOps",
      monthly_fee: 1000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `Q3_${i + 1}`,
      signed: "2025-07-10",
      segment: "SteadyOps",
      monthly_fee: 1000,
    })),
  ];

  const res = generateScalePaidCheck(makeBaseInput({ customers }));
  assert.equal(res.structuredContent.stop_rule.base_verdict, "PASS");
  for (const ec of res.structuredContent.stop_rule.evaluated_cohorts) {
    assert.equal(ec.lost_1_6, 0);
    assert.equal(ec.lost_7_12, 0);
    assert.equal(ec.shape_pass, true);
    assert.equal(ec.line_pass, true);
  }
});

test("6. annual billing skips the shape test even when losses land at month 12 renewal", () => {
  // Hand-worked cohorts with annual billing:
  // - Cohort 2025-Q2: 5 customers signed 2025-04-10; 1 customer does not renew on 2026-04-10 (month 12 renewal).
  //   k6 = 5 (lost_1_6 = 0), k12 = 4 (lost_7_12 = 1).
  //   Under monthly billing, lost_7_12 = 1 >= lost_1_6 = 0 would fail the shape test.
  //   Under annual billing, the shape test is skipped (shape_pass = null) and k12/n = 4/5 = 80% >= 80% passes the line test.
  // - Cohort 2025-Q3: 5 customers signed 2025-07-01; 1 customer does not renew on 2026-06-15 (confirmed: 107 days before 2026-09-30).
  //   k6 = 5 (lost_1_6 = 0), k12 = 4 (lost_7_12 = 1), k12/n = 4/5 = 80% >= 80% passes the line test.
  // Expected: shape_test_skipped = true, base_verdict = "PASS", and exact annual billing sentence printed.
  const customers = [
    { id: "A_Q2_1", signed: "2025-04-10", segment: "Enterprise", monthly_fee: 3000, stopped: "2026-04-10" },
    { id: "A_Q2_2", signed: "2025-04-10", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q2_3", signed: "2025-04-10", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q2_4", signed: "2025-04-10", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q2_5", signed: "2025-04-10", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q3_1", signed: "2025-07-01", segment: "Enterprise", monthly_fee: 3000, stopped: "2026-06-15" },
    { id: "A_Q3_2", signed: "2025-07-01", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q3_3", signed: "2025-07-01", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q3_4", signed: "2025-07-01", segment: "Enterprise", monthly_fee: 3000 },
    { id: "A_Q3_5", signed: "2025-07-01", segment: "Enterprise", monthly_fee: 3000 },
  ];

  const res = generateScalePaidCheck(
    makeBaseInput({
      billing_term: "annual",
      customers,
    })
  );

  assert.equal(res.structuredContent.stop_rule.shape_test_skipped, true);
  assert.equal(res.structuredContent.stop_rule.base_verdict, "PASS");
  assert.match(
    res.text,
    /Annual billing: losses land at renewal, so the shape test does not apply; read month 12 as the first renewal\./
  );
});

test("7. 'lead, not proof' at exactly 3 losses to fail", () => {
  // Hand-worked group arithmetic for stop_line = 0.80:
  // - Suppose group "Steady" has window base = 30, lost = 4, kept = 26 (26 / 30 = 86.67% >= 80%).
  // - Check losses to fail j:
  //   j = 1: (26 - 1) / 30 = 25 / 30 = 0.8333... >= 0.80
  //   j = 2: (26 - 2) / 30 = 24 / 30 = 0.8000... >= 0.80
  //   j = 3: (26 - 3) / 30 = 23 / 30 = 0.7666... < 0.80
  // - Smallest whole number j >= 1 with (kept - j) / base < 0.80 is j = 3.
  // - Because j <= 3, the group is labelled "lead, not proof" and gets verdict CAPPED_TEST even when payback <= 12 months!
  const customers = [
    // 15 customers in 2025-Q2 (2 stopped in month 2 -> lost_1_6 = 2, lost_7_12 = 0, k12 = 13/15 = 87%)
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `S_Q2_${i + 1}`,
      signed: "2025-04-10",
      segment: "Steady",
      monthly_fee: 3000,
      ...(i < 2 ? { stopped: "2025-10-15" } : {}),
    })),
    // 15 customers in 2025-Q3 (2 stopped in month 2 -> lost_1_6 = 2, lost_7_12 = 0, k12 = 13/15 = 87%)
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `S_Q3_${i + 1}`,
      signed: "2025-07-10",
      segment: "Steady",
      monthly_fee: 3000,
      ...(i < 2 ? { stopped: "2025-11-15" } : {}),
    })),
  ];

  // All 30 signed <= 2025-09-30 and all 4 stops happened after 2025-09-30 (in Oct/Nov 2025),
  // so window base on 2025-09-30 is 30, lost in window is 4, kept is 26.
  // Even with gross_margin = 0.80 (monthly_margin = $2,400) and paid_cac = $12,000 (payback = 5.0 months <= 12),
  // Rule 3 ("or the group is a lead, not proof: CAPPED_TEST") fires before Rule 4 (SCALE).
  const res = generateScalePaidCheck(
    makeBaseInput({
      customers,
      gross_margin: 0.8,
      paid_cac: 12000,
    })
  );

  const grp = res.structuredContent.groups.find((g) => g.name === "Steady");
  assert.equal(grp.base, 30);
  assert.equal(grp.kept, 26);
  assert.equal(grp.losses_to_fail, 3);
  assert.equal(grp.lead_not_proof, true);
  assert.equal(grp.verdict, "CAPPED_TEST");
  assert.match(res.text, /lead, not proof/);
});

test("8. a group base under 5 gets 'too few customers to read' and NO_VERDICT", () => {
  // Hand-worked input:
  // - Segment "SmallGroup" has 4 customers in the window base (signed 2025-04-10, all 4 kept).
  // - Segment "LargeGroup" has 10 customers across 2025-Q2 and 2025-Q3 (all 10 kept).
  // Expected: SmallGroup has base = 4 (< 5) -> too_few_customers = true, verdict = "NO_VERDICT", prints "too few customers to read".
  const customers = [
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `SM_${i + 1}`,
      signed: "2025-04-10",
      segment: "SmallGroup",
      monthly_fee: 1000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `LG_Q2_${i + 1}`,
      signed: "2025-04-10",
      segment: "LargeGroup",
      monthly_fee: 1000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `LG_Q3_${i + 1}`,
      signed: "2025-07-10",
      segment: "LargeGroup",
      monthly_fee: 1000,
    })),
  ];

  const res = generateScalePaidCheck(makeBaseInput({ customers }));
  const small = res.structuredContent.groups.find((g) => g.name === "SmallGroup");
  assert.equal(small.base, 4);
  assert.equal(small.too_few_customers, true);
  assert.equal(small.verdict, "NO_VERDICT");
  assert.match(res.text, /SmallGroup.*too few customers to read/);
});

test("9. fewer than two mature cohorts produces NOT_ENOUGH_HISTORY and caps group at CAPPED_TEST", () => {
  // Hand-worked cohorts on as_of = "2026-09-30":
  // - Cohort 2025-Q3: 20 customers signed "2025-07-10" -> month 12 checkpoint is "2026-07-10" <= "2026-09-30" (mature, 1st mature cohort).
  //   All 20 kept -> kept = 20 of 20 (100%), losses_to_fail = 5 (> 3, not a lead).
  // - Cohort 2025-Q4: 5 customers signed "2025-11-10" -> month 12 checkpoint is "2026-11-10" > "2026-09-30" (not mature).
  // Only 1 mature cohort (< 2 required) -> base_verdict = "NOT_ENOUGH_HISTORY".
  // Even with gross_margin = 0.80, monthly_fee = $2,000 (margin = $1,600) and paid_cac = $8,000 (payback = 5.0 months <= 12),
  // Rule 3 caps the group verdict at CAPPED_TEST.
  const customers = [
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `M_${i + 1}`,
      signed: "2025-07-10",
      segment: "Core",
      monthly_fee: 2000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `Y_${i + 1}`,
      signed: "2025-11-10",
      segment: "Core",
      monthly_fee: 2000,
    })),
  ];

  const res = generateScalePaidCheck(
    makeBaseInput({
      customers,
      gross_margin: 0.8,
      paid_cac: 8000,
    })
  );

  assert.equal(res.structuredContent.stop_rule.mature_cohort_count, 1);
  assert.equal(res.structuredContent.stop_rule.base_verdict, "NOT_ENOUGH_HISTORY");
  const core = res.structuredContent.groups.find((g) => g.name === "Core");
  assert.equal(core.verdict, "CAPPED_TEST");
});

test("10. metric definitions check and metric disagreement note", () => {
  // Hand-worked metrics:
  // - Monthly customer churn = 2% (0.02 per month).
  //   Compounded over 12 months: (1 - 0.02)^12 = 0.98^12 = 0.7847167... -> 78.5% yearly retention.
  // - Reported yearly customer retention = 94%.
  //   Difference = |78.47 - 94| = 15.53 points (> 2 points) -> triggers disagreement note:
  //   "These two figures measure different things or disagree: write the definition next to each."
  // - Third metric "NPS" = 45 with no counts and no period -> triggers missing definition note:
  //   "not read: give whether it counts customers or revenue, and over what period".
  const res = generateScalePaidCheck(
    makeBaseInput({
      customers: [
        { id: "C1", signed: "2025-04-10", segment: "Core", monthly_fee: 1000 },
      ],
      metrics: [
        { name: "Monthly churn", value: 2, counts: "customers", period: "month" },
        { name: "Annual retention", value: 94, counts: "customers", period: "year" },
        { name: "NPS", value: 45 },
      ],
    })
  );

  assert.equal(res.structuredContent.metrics_check.disagreement, true);
  assert.match(
    res.text,
    /These two figures measure different things or disagree: write the definition next to each\./
  );
  assert.match(
    res.text,
    /NPS \(45\): not read: give whether it counts customers or revenue, and over what period/
  );
});

test("11. a SCALE path and a HOLD path with full money and payback arithmetic", () => {
  // Hand-worked input with two segments ("Enterprise" -> SCALE, "SelfServe" -> HOLD) on as_of = "2026-09-30":
  // Earliest signed is "2024-09-30", so months_between("2024-09-30", "2026-09-30") = 24 months seen.
  //
  // Segment 1: "Enterprise" (20 customers, monthly_fee = $2,000, all 20 kept):
  // - 10 signed "2024-09-30" (2024-Q3), 5 signed "2025-04-10" (2025-Q2), 5 signed "2025-07-10" (2025-Q3).
  // - Window base on "2025-09-30": 20, lost = 0, kept = 20 (100% >= 80%).
  // - Losses to fail j: (20 - j) / 20 < 0.80 -> 20 - j < 16 -> j = 5 (> 3, so NOT lead, not proof).
  // - Monthly margin at gross_margin = 0.75: $2,000 * 0.75 = $1,500.
  // - Monthly churn c = 0; 24-month capped LTV = $1,500 * 24 = $36,000.
  // - With paid_cac = $12,000: payback_months = 12000 / 1500 = 8.0 months (<= 12-month line); LTV:CAC = 36000 / 12000 = 3.00x.
  // - Required paid CAC for 12-month line = $1,500 * 12 = $18,000.
  // - Verdict for "Enterprise": SCALE ("rerun the cohorts every quarter, and stop if payback passes the line").
  //
  // Segment 2: "SelfServe" (10 customers, monthly_fee = $500, 5 lost in window -> 5 of 10 = 50% < 80%):
  // - All 10 signed "2024-09-30" (2024-Q3, so latest two mature cohorts 2025-Q2 and 2025-Q3 are unaffected and base_verdict is PASS).
  // - 5 stopped on "2026-02-15" (in window).
  // - Window base on "2025-09-30": 10, lost = 5, kept = 5 (50% < 80% stop line).
  // - Share of losses = 5/5 = 100%, share of base = 10/30 = 33% (diff 67 points >= 10 -> signal line printed).
  // - Verdict for "SelfServe": HOLD.
  const customers = [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `ENT_24Q3_${i + 1}`,
      signed: "2024-09-30",
      segment: "Enterprise",
      monthly_fee: 2000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `ENT_25Q2_${i + 1}`,
      signed: "2025-04-10",
      segment: "Enterprise",
      monthly_fee: 2000,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `ENT_25Q3_${i + 1}`,
      signed: "2025-07-10",
      segment: "Enterprise",
      monthly_fee: 2000,
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `SS_24Q3_${i + 1}`,
      signed: "2024-09-30",
      segment: "SelfServe",
      monthly_fee: 500,
      ...(i < 5 ? { stopped: "2026-02-15" } : {}),
    })),
  ];

  const res = generateScalePaidCheck(
    makeBaseInput({
      customers,
      gross_margin: 0.75,
      paid_cac: 12000,
      blended_cac: 6000,
      test_cap: 36000,
      win_rate_floor: 0.2,
      win_rate_target: 0.4,
    })
  );

  assert.equal(res.structuredContent.stop_rule.base_verdict, "PASS");
  const ent = res.structuredContent.groups.find((g) => g.name === "Enterprise");
  const ss = res.structuredContent.groups.find((g) => g.name === "SelfServe");
  assert.equal(ent.verdict, "SCALE");
  assert.equal(ss.verdict, "HOLD");
  assert.equal(ss.loses_more_than_share, true);

  const entMoney = res.structuredContent.money.by_group.Enterprise;
  assert.equal(entMoney.months_seen, 24);
  assert.equal(entMoney.monthly_margin, 1500);
  assert.equal(entMoney.capped_ltv, 36000);
  assert.equal(entMoney.payback_months, 8);
  assert.equal(entMoney.ltv_to_paid_cac, 3);
  assert.equal(entMoney.required_paid_cac, 18000);
  // Capped test counts on Enterprise:
  // go_count = ceil(36000 / (18000 * 0.2)) = ceil(36000 / 3600) = 10
  // stop_count = floor(36000 / (18000 * 0.4)) = floor(36000 / 7200) = 5
  assert.equal(entMoney.go_count, 10);
  assert.equal(entMoney.stop_count, 5);

  assert.match(res.text, /rerun the cohorts every quarter, and stop if payback passes the line/);
  assert.match(res.text, /This group loses more than its share: 100% of losses from 33% of customers\./);
  assert.match(res.text, /These are examples, not benchmarks/);
  assert.doesNotMatch(res.text, /you have product[- ]market fit/i);
  assert.doesNotMatch(res.text, /[\u2014\u2013]/);
});

test("12. calling scale_paid_check twice with the same input produces identical output", async () => {
  const input = makeBaseInput({
    customers: [
      { id: "D1", signed: "2025-04-10", segment: "Core", monthly_fee: 1200 },
      { id: "D2", signed: "2025-04-15", segment: "Core", monthly_fee: 1200, stopped: "2026-01-10" },
      { id: "D3", signed: "2025-07-10", segment: "Core", monthly_fee: 1200 },
    ],
    gross_margin: 0.7,
    paid_cac: 10000,
  });

  const direct1 = generateScalePaidCheck(structuredClone(input));
  const direct2 = generateScalePaidCheck(structuredClone(input));
  assert.equal(direct1.text, direct2.text);
  assert.deepEqual(direct1.structuredContent, direct2.structuredContent);

  const mcp1 = await callServerTool(structuredClone(input));
  const mcp2 = await callServerTool(structuredClone(input));
  assert.equal(mcp1.isError, undefined);
  assert.equal(mcp1.content[0].text, mcp2.content[0].text);
  assert.deepEqual(mcp1.structuredContent, mcp2.structuredContent);
});

test("13. data/*.json files run without error and echo the rows received", async () => {
  const files = [
    "firstwork.json",
    "emergent.json",
    "shipsy.json",
    "cloudsek.json",
    "juspay.json",
  ];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));
    const input = raw.input ?? raw;
    const expectedRows = input.customers.length;

    const res = generateScalePaidCheck(structuredClone(input));
    assert.equal(typeof res.text, "string", `${file} should return text`);
    assert.equal(res.structuredContent.echo.rows_received, expectedRows, `${file} structured echo should match rows received`);
    assert.match(res.text, new RegExp(`Rows received: ${expectedRows}\\b`), `${file} text echo should print rows received`);
    assert.doesNotMatch(res.text, /you have product[- ]market fit/i, `${file} must never claim PMF`);
    assert.doesNotMatch(res.text, /[\u2014\u2013]/, `${file} must not contain em/en dashes`);

    const serverRes = await callServerTool(structuredClone(input));
    assert.equal(serverRes.isError, undefined, `${file} via MCP server should not error`);
    assert.match(serverRes.content[0].text, new RegExp(`Rows received: ${expectedRows}\\b`));
  }
});

test("14. Firstwork churn_reasons produce three '### Reason' headings in the playbook text matching the three interview hypotheses", () => {
  const raw = JSON.parse(readFileSync(path.join(dataDir, "firstwork.json"), "utf8"));
  const input = raw.input ?? raw;
  const res = generateScalePaidCheck(structuredClone(input));

  const playbookSection = res.text
    .split("## First draft: responses to each churn reason")[1]
    .split("## First draft: churn interview guide")[0];

  const reasonMatches = [...playbookSection.matchAll(/^### Reason \d+: "([^"]+)"$/gm)];
  assert.equal(reasonMatches.length, 3, "Firstwork playbook text must contain three '### Reason' headings");

  const playbookReasons = reasonMatches.map((m) => m[1]);
  const expectedReasons = [
    "hiring volume is seasonal and the agency pauses in quiet months",
    "recruiters go back to chasing documents by phone",
    "the background check vendor is not connected",
  ];
  assert.deepEqual(playbookReasons, expectedReasons);

  const hypotheses = res.structuredContent.handoff.customer_interview_kit.hypotheses_list;
  assert.equal(hypotheses.length, 3);
  const hypothesesWithoutPrefix = hypotheses.map((h) =>
    h.replace(/^Customers leave because /, "")
  );
  assert.deepEqual(playbookReasons, hypothesesWithoutPrefix);

  assert.equal(
    res.structuredContent.handoff.retention_playbook.churn_reasons,
    expectedReasons.join("\n")
  );
  assert.ok(
    res.text.includes(`- Churn reasons: "${expectedReasons.join("\n")}"`),
    "Handoff section must show the newline-joined churn_reasons string"
  );

  // Also verify commas inside a number such as 1,200 are not split
  const numericCommaRes = generateScalePaidCheck(
    makeBaseInput({
      customers: [
        { id: "N1", signed: "2025-04-10", segment: "Core", monthly_fee: 1000 },
      ],
      churn_reasons: "monthly price of $1,200 is too high, onboarding took 5 weeks",
    })
  );
  assert.equal(
    numericCommaRes.structuredContent.handoff.retention_playbook.churn_reasons,
    "monthly price of $1,200 is too high\nonboarding took 5 weeks"
  );
});
