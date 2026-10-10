// Run 22 round 5 (cg-w1): launch_commander for an integration product read in a neutral regulated finance sector, and retention_playbook for a product
// given as a description. Written before the change; it failed on the starting head. All companies below are INVENTED.
import { test } from "node:test";
import assert from "node:assert/strict";
import { text } from "./run22-cg-w1-helpers.mjs";

const LINKLY = "Linkly: bank account connection through one API, account and routing number verification, real-time balance checks, bank payments over ACH and instant rails, income verification for lenders, and an open banking layer for banks";
const L = (extra = {}) => text("launch_commander", {
  product_feature: LINKLY, launch_date: "Q1 2027", launch_type: "feature_launch",
  target_segments: "Fintech and digital banking, Lending and mortgage, Property management",
  goals: "a hypothetical pipeline of $600,000, which is ten deals at a hypothetical $60,000 annual contract value", ...extra,
});

test("r5 launch: problems to test come from the product's own parts, not the generic finance lines", async () => {
  const out = await L();
  const line = out.split("\n").find((l) => l.startsWith("Problems to test in the first conversations"));
  assert.ok(line, "problems line exists");
  assert.doesNotMatch(line, /reporting and reconciliation that take too many manual steps/);
  assert.match(line, /bank account connection through one API/);
  assert.match(line, /engineering/);
});
test("r5 launch: the channels name the teams that integrate the product, not a finance leaders roundtable", async () => {
  const out = await L();
  const ch = out.split("## Channels and budget")[1].split("## Timeline")[0];
  assert.doesNotMatch(ch, /finance leaders roundtable/);
  assert.match(ch, /engineering/);
});
test("r5 launch: the go-live task is built around the first integration, not the buyer's reporting dates", async () => {
  const out = await L();
  assert.doesNotMatch(out, /Plan the go-live around the buyer's reporting dates/);
  assert.match(out, /\*\*Plan the go-live of the first integration[^*]*bank account connection through one API[^*]*\*\*/);
  assert.doesNotMatch(out, /Go-live date agreed around the buyer's reporting dates/);
});
test("r5 launch: each segment keeps its own feature lead, and the measure is in the product's words", async () => {
  const out = await L();
  assert.match(out, /### Lending and mortgage\n\nFor Lending and mortgage, lead with[^\n]*income verification for lenders/);
  assert.match(out, /Measure the result by how many of the buyer's flows use [^\n]*(?:bank account connection|income verification|account and routing)/);
});
test("r5 launch: a finance product that is not an integration product keeps the sector lines", async () => {
  const out = await text("launch_commander", {
    product_feature: "Ledgerly: month end close, reconciliation and audit reports for finance teams",
    launch_date: "Q1 2027", launch_type: "feature_launch", target_segments: "Banks and credit unions, Insurance carriers",
    goals: "a hypothetical pipeline of $600,000, which is ten deals at a hypothetical $60,000 annual contract value",
  });
  assert.match(out, /Plan the go-live around the buyer's reporting dates/);
});

test("r5 retention: the product description is used once in the reasons, with no 'fit any company' note", async () => {
  const out = await text("retention_playbook", { customer_segment: "luxury retail (customers of Brightlane)", business_model: "enterprise_contract", current_churn_rate: "1% monthly (hypothetical)", product: "Brightlane AI-powered digital freight forwarding platform", industry: "logistics_tech" });
  const reasons = out.split("## The likely reasons to test")[1].split("###")[0];
  assert.match(reasons, /AI-powered digital freight forwarding platform/);
  assert.equal((out.match(/digital freight forwarding platform/g) ?? []).length, 2, "title once, reasons once");
  assert.doesNotMatch(out, /now fit any company in the sector/);
});
test("r5 retention: the departing customer email and the interview say 'our service', not 'your service'", async () => {
  const out = await text("retention_playbook", { customer_segment: "luxury retail (customers of Brightlane)", business_model: "enterprise_contract", current_churn_rate: "1% monthly (hypothetical)", product: "Brightlane AI-powered digital freight forwarding platform", industry: "logistics_tech" });
  assert.match(out, /Thank you for the time you spent with our service\./);
  assert.doesNotMatch(out, /your service/);
});
test("r5 retention: health score role and signal names are written as words", async () => {
  const out = await text("retention_playbook", { customer_segment: "luxury retail (customers of Brightlane)", business_model: "enterprise_contract", current_churn_rate: "1% monthly (hypothetical)", product: "Brightlane AI-powered digital freight forwarding platform", industry: "logistics_tech" });
  assert.doesNotMatch(out, /chief Operating Officer|support nps/);
  assert.match(out, /contact with the chief operating officer and the people who signed/);
  assert.match(out, /\| support NPS \|/);
});
test("r5 retention: a short product name keeps the note asking what the product sells", async () => {
  const out = await text("retention_playbook", { customer_segment: "luxury retail", business_model: "enterprise_contract", current_churn_rate: "1% monthly (hypothetical)", product: "Brightlane", industry: "logistics_tech" });
  assert.match(out, /what Brightlane sells, said in a few words after its name/);
});
