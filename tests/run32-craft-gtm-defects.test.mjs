// Run 32D (connector safety run 2), the three CRAFT GTM defects of the Codex cloud audit (12 October 2026):
// F010 retention_playbook: a churn rate keeps its minus sign, and a churn rate with no number is reported as missing,
//      never as 0% HEALTHY.
// F011 competitive_intel: "support was not needed" (a negated win reason) never becomes "Superior customer support";
//      meaning is not decided by a substring.
// F012 launch_commander: an impossible calendar date such as 2027-02-30 is refused, never rolled over to 2 March 2027.
// Ordinary inputs keep their answers (parity is checked separately on the repo's existing inputs).
// Run: npm run build && node --test tests/run32-craft-gtm-defects.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../dist/server.js";

const server = createServer();
const client = new Client({ name: "helix-run32d", version: "1" });
const [ct, st] = InMemoryTransport.createLinkedPair();
await Promise.all([server.connect(st), client.connect(ct)]);
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return { isError: !!r.isError, text: r.content.map((c) => c.text).join("\n") };
};

const RET = { customer_segment: "Regional carriers on annual plans", business_model: "saas_subscription", churn_reasons: "price, missing integrations", available_data_signals: "login frequency, support tickets", cs_team_size: "small_1_3" };

test("F010: a missing churn rate is reported as missing, never 0% or HEALTHY", async () => {
  for (const churn of ["not tracked yet", "unknown", "we do not measure it"]) {
    for (const extra of [{}, { churn_reasons: undefined }]) {
      const args = { ...RET, ...extra, current_churn_rate: churn };
      if (args.churn_reasons === undefined) delete args.churn_reasons;
      const r = await call("retention_playbook", args);
      assert.equal(r.isError, false, r.text.slice(0, 300));
      assert.doesNotMatch(r.text, /HEALTHY/, `missing churn shown as healthy (${churn})`);
      assert.doesNotMatch(r.text, /\|\s*0%\s*\|/, `missing churn shown as 0% (${churn})`);
      assert.doesNotMatch(r.text, /~0%/, `missing churn annualised as 0% (${churn})`);
      assert.match(r.text, /not given|missing|no churn rate/i, `missing churn not called missing (${churn})`);
    }
  }
});

test("F010: a negative churn rate keeps its minus sign", async () => {
  for (const churn of ["-2% monthly (net, hypothetical)", "−2% net revenue churn"]) {
    const r = await call("retention_playbook", { ...RET, current_churn_rate: churn });
    assert.equal(r.isError, false, r.text.slice(0, 300));
    assert.match(r.text, /\|\s*-2%\s*\|/, `minus sign dropped (${churn})`);
    assert.doesNotMatch(r.text, /\|\s*2%\s*\|/, `shown as plus 2% (${churn})`);
  }
});

test("F010: an ordinary churn rate is read as before", async () => {
  const r = await call("retention_playbook", { ...RET, current_churn_rate: "6.5% monthly" });
  assert.match(r.text, /\|\s*6\.5%\s*\|\s*HIGH\s*\|/);
});

// No your_strengths: the tool derives strengths from recent_wins only when the user gave none (src/competitive-intel.ts).
const CI = { your_product: "our route planner", competitors: "Competitor A, Competitor B", your_weaknesses: "smaller partner network", common_objections: "too expensive" };

test("F011: a negated win reason never becomes a strength it denies", async () => {
  for (const win of ["support was not needed", "no support team involved", "they never contacted our service desk", "the team did not matter"]) {
    const r = await call("competitive_intel", { ...CI, recent_wins: win, recent_losses: "price" });
    assert.equal(r.isError, false, r.text.slice(0, 300));
    assert.doesNotMatch(r.text, /Superior customer support/, `negated win read as support strength: ${win}`);
  }
});

test("F011: an ordinary support win is still read as a support strength", async () => {
  const r = await call("competitive_intel", { ...CI, recent_wins: "their support team answered within an hour", recent_losses: "price" });
  assert.match(r.text, /Superior customer support/);
});

const LC = { product_feature: "our route planner", launch_type: "feature_launch", target_segments: "regional carriers, 3PL operators", goals: "40 qualified meetings" };

test("F012: an impossible calendar date is refused, never rolled over", async () => {
  for (const d of ["2027-02-30", "2027-02-29", "2027-04-31", "2027-13-01", "February 30, 2027", "30 February 2027", "02/30/2027"]) {
    const r = await call("launch_commander", { ...LC, launch_date: d });
    assert.doesNotMatch(r.text, /March 2027|Mar 2027|2 March|1 May 2027|May 1, 2027|January 2028/, `rolled over: ${d}`);
    assert.match(r.text, /not a real calendar date|not a valid date/i, `not refused: ${d}`);
  }
});

test("F012: real dates, a leap day and planning formats are still accepted", async () => {
  for (const d of ["2028-02-29", "2027-03-15", "March 15, 2027", "Q2 2027", "March 2027", "TBD"]) {
    const r = await call("launch_commander", { ...LC, launch_date: d });
    assert.equal(r.isError, false, `${d}: ${r.text.slice(0, 200)}`);
    assert.doesNotMatch(r.text, /not a real calendar date/i, `refused a real date: ${d}`);
  }
});
