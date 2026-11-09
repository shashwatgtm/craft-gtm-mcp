import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateScalePaidCheck,
  addMonths,
} from "../dist/scale-paid-check.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, "./fixtures/scale-paid-check");
const redteamSourceDir = path.resolve(__dirname, "../../out/redteam-inputs");

const REDTEAM_CASES = [
  {
    file: "rt01-stop-on-feb29-leap-day.json",
    section: "Spec Section 3 and Section 5 (rt01: leap day 29 Feb date arithmetic and cohort checkpoints)",
  },
  {
    file: "rt02-stopped-and-resumed-twice.json",
    section: "Spec Section 2 and Section 4 (rt02: duplicate customer ID row rejection and paused/resumed status)",
  },
  {
    file: "rt03-single-segment-all-customers.json",
    section: "Spec Section 7 and Section 8 (rt03: single segment untagged group and whole base money block)",
  },
  {
    file: "rt04-group-exactly-five-customers.json",
    section: "Spec Section 7 and Section 9 (rt04: group boundary at 5 customers vs under 5 too few to read)",
  },
  {
    file: "rt05-only-one-mature-cohort.json",
    section: "Spec Section 5 and Section 6 (rt05: cohort maturity boundary with only one mature cohort)",
  },
  {
    file: "rt06-annual-stop-89-days-pending.json",
    section: "Spec Section 4 and Section 6 (rt06: annual billing shape test skip and 89-day vs 90-day stop boundary)",
  },
  {
    file: "rt07-monthly-fee-zero-and-negative.json",
    section: "Spec Section 2 (rt07: row checks rejecting zero and negative monthly_fee)",
  },
  {
    file: "rt08-duplicate-customer-ids.json",
    section: "Spec Section 2 (rt08: row checks rejecting duplicate customer IDs after first occurrence)",
  },
  {
    file: "rt09-invalid-date-formats.json",
    section: "Spec Section 2 (rt09: row checks rejecting invalid date formats and date ordering violations)",
  },
  {
    file: "rt10-churn-reasons-numbers-semicolons.json",
    section: "Spec Section 11 (rt10: churn_reasons splitting with commas in numbers, semicolons, and newlines)",
  },
  {
    file: "rt11-blended-cac-below-paid-cac.json",
    section: "Spec Section 8 and Section 9 (rt11: blended CAC contrast vs paid-only CAC payback verdict)",
  },
  {
    file: "rt12-test-cap-smaller-than-one-cac.json",
    section: "Spec Section 8 (rt12: test_cap smaller than one opportunity cost warning)",
  },
  {
    file: "rt13-shape-test-tie-months-7-to-12.json",
    section: "Spec Section 6 (rt13: stop rule shape test tie between months 1 to 6 and months 7 to 12)",
  },
  {
    file: "rt14-seasonal-boundary-exact-half.json",
    section: "Spec Section 7 (rt14: seasonal tag boundary at exactly half of max monthly_starts and untagged rows)",
  },
  {
    file: "rt15-zero-window-churn-c-equals-zero.json",
    section: "Spec Section 8 (rt15: zero window churn where kept equals base and monthly churn c equals 0)",
  },
  {
    file: "rt16-revenue-vs-logo-retention-skew.json",
    section: "Spec Section 5 and Section 6 (rt16: month-12 revenue kept diverging from logo retention)",
  },
  {
    file: "rt17-resumed-between-checkpoints.json",
    section: "Spec Section 4 and Section 5 (rt17: customers stopped before month 6 and resumed before month 9)",
  },
  {
    file: "rt18-metrics-missing-fields-and-disagreement.json",
    section: "Spec Section 10 (rt18: metric definitions missing fields and churn vs retention disagreement)",
  },
];

for (const { file, section } of REDTEAM_CASES) {
  test(section, () => {
    const fixturePath = path.join(fixturesDir, file);
    const sourcePath = path.join(redteamSourceDir, file);
    assert.equal(
      Buffer.compare(readFileSync(fixturePath), readFileSync(sourcePath)),
      0,
      `${file} must match out/redteam-inputs/${file} byte for byte`
    );

    const parsed = JSON.parse(readFileSync(fixturePath, "utf8"));
    const input = parsed.input ?? parsed;
    const expectedRows = input.customers.length;

    const run1 = generateScalePaidCheck(structuredClone(input));
    const run2 = generateScalePaidCheck(structuredClone(input));

    assert.equal(run1.isError, undefined, `${file} should return without error`);
    assert.equal(typeof run1.text, "string", `${file} should return text`);
    assert.equal(
      run1.structuredContent.echo.rows_received,
      expectedRows,
      `${file} structuredContent echo should count rows received`
    );
    assert.match(
      run1.text,
      new RegExp(`- Rows received: ${expectedRows}\\b`),
      `${file} text echo should count rows received`
    );
    assert.equal(run1.text, run2.text, `${file} running twice must give identical text`);
    assert.deepEqual(run1.structuredContent, run2.structuredContent);
  });
}

test("Spec Section 4 (Fix 1): a customer stopped 51 days before as_of who resumed 10 days before as_of is listed as pending and as pause, and counts as paying on as_of", () => {
  // Hand-worked figures for as_of = "2026-06-30":
  // - Customer P1: signed "2025-01-15", segment "core", monthly_fee = $2,000,
  //   stopped "2026-05-10" (21 days left in May + 30 days in June = 51 days before 2026-06-30, < 90 days),
  //   resumed "2026-06-20" (30 - 20 = 10 days before 2026-06-30).
  //   * Because 51 < 90, confirmed_stop = false and P1 is pending:
  //     listed in pending_customers with days_since_stopped = 51 and status "pending: stopped under 90 days ago",
  //     and counts as paying everywhere (including on 2026-06-30).
  //   * Because P1 has a resumed date ("2026-06-20"), P1 is also listed in paused_customers
  //     with status "pause: came back".
  // - Customer P2: signed "2025-01-15", segment "core", monthly_fee = $1,500, no stop date.
  // - Expected echo:
  //   rows_received = 2, rows_used = 2, rows_rejected = 0,
  //   paying_on_as_of = 2, mrr_on_as_of = 2000 + 1500 = 3500 ($3,500).
  const res = generateScalePaidCheck({
    product: "Dispatch workflow tool",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-06-30",
    customers: [
      {
        id: "P1",
        signed: "2025-01-15",
        segment: "core",
        monthly_fee: 2000,
        stopped: "2026-05-10",
        resumed: "2026-06-20",
      },
      {
        id: "P2",
        signed: "2025-01-15",
        segment: "core",
        monthly_fee: 1500,
      },
    ],
    churn_reasons: "seasonal volume pause",
    interview_persona: "Head of Operations",
  });

  assert.equal(res.structuredContent.echo.rows_received, 2);
  assert.equal(res.structuredContent.echo.rows_used, 2);
  assert.equal(res.structuredContent.echo.rows_rejected, 0);
  assert.equal(res.structuredContent.echo.paying_on_as_of, 2);
  assert.equal(res.structuredContent.echo.mrr_on_as_of, 3500);

  assert.equal(res.structuredContent.pending_customers.length, 1);
  assert.deepEqual(res.structuredContent.pending_customers[0], {
    id: "P1",
    stopped: "2026-05-10",
    days_since_stopped: 51,
    status: "pending: stopped under 90 days ago",
  });

  assert.equal(res.structuredContent.paused_customers.length, 1);
  assert.deepEqual(res.structuredContent.paused_customers[0], {
    id: "P1",
    stopped: "2026-05-10",
    resumed: "2026-06-20",
    status: "pause: came back",
  });

  assert.match(
    res.text,
    /- P1 \(stopped 2026-05-10, 51 days before 2026-06-30\): pending: stopped under 90 days ago \(counted as paying everywhere\)\./
  );
  assert.match(
    res.text,
    /- P1 \(stopped 2026-05-10, resumed 2026-06-20\): pause: came back \(counted as kept from 2026-06-20\)\./
  );
});

test("Spec Section 2 (Fix 2): a resume date after as_of and a stop date after as_of are each rejected with the exact reason text", () => {
  // Hand-worked figures for as_of = "2026-06-30":
  // - Row 1 (VALID_01): signed "2025-01-15", monthly_fee = $1,000 -> valid and paying on 2026-06-30.
  // - Row 2 (BAD_STOP_AFTER): signed "2025-01-15", stopped "2026-07-05" > as_of "2026-06-30"
  //   -> rejected with exact reason: "stopped (2026-07-05) is after as_of (2026-06-30)".
  // - Row 3 (BAD_RESUME_AFTER): signed "2025-01-15", stopped "2026-03-01", resumed "2026-07-10" > as_of "2026-06-30"
  //   -> rejected with exact reason: "resumed (2026-07-10) is after as_of (2026-06-30)".
  // - Expected echo:
  //   rows_received = 3, rows_used = 1, rows_rejected = 2,
  //   paying_on_as_of = 1, mrr_on_as_of = 1000 ($1,000).
  const res = generateScalePaidCheck({
    product: "Dispatch workflow tool",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-06-30",
    customers: [
      {
        id: "VALID_01",
        signed: "2025-01-15",
        segment: "core",
        monthly_fee: 1000,
      },
      {
        id: "BAD_STOP_AFTER",
        signed: "2025-01-15",
        segment: "core",
        monthly_fee: 1500,
        stopped: "2026-07-05",
      },
      {
        id: "BAD_RESUME_AFTER",
        signed: "2025-01-15",
        segment: "core",
        monthly_fee: 2000,
        stopped: "2026-03-01",
        resumed: "2026-07-10",
      },
    ],
    churn_reasons: "budget freeze",
    interview_persona: "VP of Operations",
  });

  assert.equal(res.structuredContent.echo.rows_received, 3);
  assert.equal(res.structuredContent.echo.rows_used, 1);
  assert.equal(res.structuredContent.echo.rows_rejected, 2);
  assert.equal(res.structuredContent.echo.paying_on_as_of, 1);
  assert.equal(res.structuredContent.echo.mrr_on_as_of, 1000);

  assert.deepEqual(res.structuredContent.rejected_rows, [
    {
      id: "BAD_STOP_AFTER",
      index: 1,
      reason: "stopped (2026-07-05) is after as_of (2026-06-30)",
    },
    {
      id: "BAD_RESUME_AFTER",
      index: 2,
      reason: "resumed (2026-07-10) is after as_of (2026-06-30)",
    },
  ]);
  assert.ok(
    res.text.includes(
      "- BAD_STOP_AFTER (row 2): rejected because stopped (2026-07-05) is after the check date (2026-06-30)."
    )
  );
  assert.ok(
    res.text.includes(
      "- BAD_RESUME_AFTER (row 3): rejected because resumed (2026-07-10) is after the check date (2026-06-30)."
    )
  );
});

test("Spec Section 8 (Fix 3): a test cap below one customer's cost prints the new warning and not '0 or fewer: stop'", () => {
  // Hand-worked figures:
  // - 5 customers signed "2025-01-15", segment "core", monthly_fee = $2,000, 0 stopped, as_of = "2026-06-30".
  // - Window start = "2025-06-30": base = 5, lost = 0, kept = 5.
  // - gross_margin = 0.75 -> monthly_margin = $2,000 * 0.75 = $1,500.
  // - payback_line_months = 12 -> required_paid_cac = $1,500 * 12 = $18,000.
  // - win_rate_floor = 0.15, win_rate_target = 0.25 (25%).
  // - Cost of 1 opportunity at target win rate = $18,000 * 0.25 = $4,500.
  // - Cost of 1 opportunity at floor win rate = $18,000 * 0.15 = $2,700.
  // - With test_cap = $3,000 (< $4,500):
  //   go_count = ceil(3000 / 2700) = 2,
  //   stop_count = floor(3000 / 4500) = 0.
  // - Because stop_count === 0, the capped test line prints:
  //   "Your test cap of $3,000 is too small to read: it pays for fewer than one opportunity at the required paid CAC of $18,000 and the 25% target win rate. Raise the cap to at least $4,500 or skip the test."
  //   and never prints "0 or fewer: stop".
  const res = generateScalePaidCheck({
    product: "Dispatch workflow tool",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-06-30",
    gross_margin: 0.75,
    paid_cac: 18000,
    test_cap: 3000,
    win_rate_floor: 0.15,
    win_rate_target: 0.25,
    churn_reasons: "pilot ended",
    interview_persona: "VP of Operations",
    customers: [
      { id: "T1", signed: "2025-01-15", segment: "core", monthly_fee: 2000 },
      { id: "T2", signed: "2025-01-15", segment: "core", monthly_fee: 2000 },
      { id: "T3", signed: "2025-01-15", segment: "core", monthly_fee: 2000 },
      { id: "T4", signed: "2025-01-15", segment: "core", monthly_fee: 2000 },
      { id: "T5", signed: "2025-01-15", segment: "core", monthly_fee: 2000 },
    ],
  });

  assert.equal(res.structuredContent.money.whole_base.monthly_margin, 1500);
  assert.equal(res.structuredContent.money.whole_base.required_paid_cac, 18000);
  assert.equal(res.structuredContent.money.whole_base.go_count, 2);
  assert.equal(res.structuredContent.money.whole_base.stop_count, 0);

  const expectedWarning =
    "Your test cap of $3,000 is too small to read: it pays for fewer than one opportunity at the required paid CAC of $18,000 and the 25% target win rate. Raise the cap to at least $4,500 or skip the test.";
  assert.ok(res.text.includes(expectedWarning));
  assert.doesNotMatch(res.text, /0 or fewer: stop/);
});

test("Spec Section 1 and Section 4 (Fix 4): 2,000 rows run; 2,001 rows return only the refusal", () => {
  // Hand-worked figures from the loop rule (for n = 2,000 rows, r = 1..2000, as_of = "2026-06-30"):
  // - id: "R" + r padded to 4 digits ("R0001" .. "R2000"), all 2,000 unique.
  // - segment: ["core", "scale", "edge"][r % 3].
  // - signed: add_months("2024-01-15", r % 18), ranging from "2024-01-15" (m = 0) to "2025-06-15" (m = 17),
  //   all valid YYYY-MM-DD dates <= as_of ("2026-06-30").
  // - monthly_fee: 1000 + 500 * (r % 3), which is 1000, 1500, or 2000 (all > 0).
  // - stopped:
  //   * Every 9th row (r % 9 === 0) has a stop date: floor(2000 / 9) = 222 rows (r = 9, 18, ..., 1998).
  //     For all such rows, r % 18 is either 0 (signed "2024-01-15") or 9 (signed "2024-10-15"),
  //     so signed is always before both stop dates ("2025-09-15" and "2026-05-10").
  //   * Odd multiples of 9 (r % 9 === 0 && r % 18 !== 0): 222 - 111 = 111 rows stopped on "2025-09-15".
  //     Days from "2025-09-15" to "2026-06-30" = 15 + 31 + 30 + 31 + 31 + 28 + 31 + 30 + 31 + 30 = 288 days (>= 90 -> confirmed stop).
  //   * Every 18th row (r % 18 === 0): floor(2000 / 18) = 111 rows (r = 18, 36, ..., 1998) stopped on "2026-05-10".
  //     Days from "2026-05-10" to "2026-06-30" = (31 - 10) + 30 = 51 days (< 90 -> pending stop).
  // - resumed:
  //   * Every 45th row (r % 45 === 0): floor(2000 / 45) = 44 rows (r = 45, 90, ..., 1980) resumed on "2026-06-20".
  //     Since 45 is a multiple of 9, every 45th row has stopped ("2025-09-15" or "2026-05-10") < "2026-06-20" <= "2026-06-30".
  //     22 of those 44 rows (multiples of 90: r = 90, 180, ..., 1980) have stopped = "2026-05-10" (51 days < 90),
  //     and by Fix 1 they still count as pending as well as paused.
  // - Expected for 2,000 rows:
  //   * rows_received = 2000
  //   * rows_rejected = 0 (rows_used = 2000)
  //   * pending count = 111 (all floor(2000 / 18) = 111 rows stopped on "2026-05-10").
  // - Expected for 2,001 rows:
  //   * Refusal text only: "Your list has 2,001 rows. This check takes up to 2,000 customers. Split the list by segment and run each part."
  //   * No figures returned.
  const segments = ["core", "scale", "edge"];
  function buildRows(count) {
    const list = [];
    for (let r = 1; r <= count; r++) {
      const row = {
        id: `R${String(r).padStart(4, "0")}`,
        segment: segments[r % 3],
        signed: addMonths("2024-01-15", r % 18),
        monthly_fee: 1000 + 500 * (r % 3),
      };
      if (r % 18 === 0) {
        row.stopped = "2026-05-10";
      } else if (r % 9 === 0) {
        row.stopped = "2025-09-15";
      }
      if (r % 45 === 0) {
        row.resumed = "2026-06-20";
      }
      list.push(row);
    }
    return list;
  }

  const baseInput = {
    product: "Fleet operations platform",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-06-30",
    churn_reasons: "seasonal pause, dispatcher turnover",
    interview_persona: "VP of Operations",
  };

  const res2000 = generateScalePaidCheck({
    ...baseInput,
    customers: buildRows(2000),
  });
  assert.equal(res2000.isError, undefined);
  assert.equal(res2000.structuredContent.echo.rows_received, 2000);
  assert.equal(res2000.structuredContent.echo.rows_rejected, 0);
  assert.equal(res2000.structuredContent.echo.rows_used, 2000);
  assert.equal(res2000.structuredContent.pending_customers.length, 111);
  assert.equal(res2000.structuredContent.paused_customers.length, 44);
  assert.match(res2000.text, /- Rows received: 2000\b/);
  assert.match(res2000.text, /- Rows rejected: 0\b/);

  const res2001 = generateScalePaidCheck({
    ...baseInput,
    customers: buildRows(2001),
  });
  const expectedRefusal =
    "Your list has 2,001 rows. This check takes up to 2,000 customers. Split the list by segment and run each part.";
  assert.equal(res2001.isError, true);
  assert.equal(res2001.text, expectedRefusal);
  assert.equal(res2001.content[0].text, expectedRefusal);
  assert.deepEqual(res2001.structuredContent, {});
});

test("Spec Section 8 (Fix 5): one group prints exactly one '### Whole base (one group)' block in the Money section", () => {
  // Hand-worked figures for 1 group ("core") on as_of = "2026-06-30":
  // - 6 customers signed "2025-01-15", segment "core", monthly_fee = $1,500, no monthly_starts.
  // - Customer G6 stopped "2026-01-15" (166 days before 2026-06-30, >= 90 -> confirmed stop).
  // - Window start = "2025-06-30": all 6 signed <= "2025-06-30" and paying on "2025-06-30" -> wholeBase = 6.
  // - Lost in window = 1 (G6), kept in window = 5.
  // - Only 1 group ("core") with base = 6 === wholeBase.
  // - With gross_margin = 0.80 and paid_cac = $12,000:
  //   average_monthly_fee = $1,500, monthly_margin = $1,500 * 0.80 = $1,200,
  //   months_seen = months_between("2025-01-15", "2026-06-30") = 17 months,
  //   required_paid_cac = $1,200 * 12 = $14,400,
  //   payback_months = 12000 / 1200 = 10.0 months.
  // - The Money section must print a single "### Whole base (one group)" block and not duplicate the group block.
  const res = generateScalePaidCheck({
    product: "Dispatch workflow tool",
    business_model: "saas_subscription",
    billing_term: "monthly",
    as_of: "2026-06-30",
    gross_margin: 0.8,
    paid_cac: 12000,
    churn_reasons: "consolidated tools",
    interview_persona: "VP of Operations",
    customers: [
      { id: "G1", signed: "2025-01-15", segment: "core", monthly_fee: 1500 },
      { id: "G2", signed: "2025-01-15", segment: "core", monthly_fee: 1500 },
      { id: "G3", signed: "2025-01-15", segment: "core", monthly_fee: 1500 },
      { id: "G4", signed: "2025-01-15", segment: "core", monthly_fee: 1500 },
      { id: "G5", signed: "2025-01-15", segment: "core", monthly_fee: 1500 },
      { id: "G6", signed: "2025-01-15", segment: "core", monthly_fee: 1500, stopped: "2026-01-15" },
    ],
  });

  const moneySection = res.text
    .split("## Money")[1]
    .split("## First draft: responses to each churn reason")[0];

  const subheadings = [...moneySection.matchAll(/^### .+$/gm)].map((m) => m[0]);
  assert.equal(subheadings.length, 1, "Money section must contain only one ### block when there is one group");
  assert.equal(subheadings[0], "### Whole base (one group) (5 of 6 kept in window)");
  assert.doesNotMatch(moneySection, /^### All customers \(whole base\)/m);
  assert.doesNotMatch(moneySection, /^### core\b/m);
});
