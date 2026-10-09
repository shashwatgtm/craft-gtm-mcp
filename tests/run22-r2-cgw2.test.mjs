// Run 22 round 2 (writer cg-w2), test first. The judges of round 1 found: features handed to segments in list order, the goal not broken down, the named buyer
// only echoed, sector measures and questions rotated onto segments they do not fit (launch_commander); an enterprise contract read as people-delivered services and
// case-by-case AI reasons given to a search product (retention_playbook); sector measures that are not crisis measures, an assumed per-site connectivity business and
// two overlapping outage playbooks (crisis_planner). Invented companies only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { call, repeats, placeholders, count, sharpen, poolArgs, POOL_AVAILABLE } from "./run22-cgw2-helpers.mjs";

const seg = (out, name) => { const i = out.indexOf(`### ${name}\n`); assert.ok(i >= 0, `no segment ${name}`); return out.slice(i).split("\n\n").slice(0, 2).join("\n\n"); };

test("launch: each part of the product goes to the segment it fits, named in full", async () => {
  const args = { product_feature: "Buildfleet: build caching and test splitting, self-hosted runners with config policies and SSO, GPU and Arm build machines, a hosted dashboard for build times", launch_type: "feature_launch", launch_date: "2027-03-01",
    target_segments: "Finance, Gaming, E-commerce", goals: "30 qualified meetings with VP Engineering", industry: "software", business_model: "saas" };
  const out = await call("launch_commander", args);
  assert.doesNotMatch(out, /the part of Buildfleet that/);
  assert.match(seg(out, "Finance"), /lead with[^\n]*(self-hosted runners with config policies and SSO)/i);
  assert.doesNotMatch(seg(out, "Finance"), /build caching/);
  assert.match(seg(out, "Gaming"), /lead with[^\n]*GPU and Arm build machines/i);
  assert.doesNotMatch(seg(out, "Gaming"), /self-hosted runners/);
  assert.deepEqual(repeats(out), []);
});

test("launch: the goal is turned into what the plan needs, only from the user's figures", async () => {
  const args = { product_feature: "Linkbank: bank account connection, balance checks and payment initiation for fintech apps", launch_type: "feature_launch", launch_date: "Q1 2027", target_segments: "Fintech and digital banking, Lending, Auto, Property management",
    goals: "a hypothetical pipeline of $1,200,000, which is ten deals at a hypothetical $120,000 annual contract value, with SVP Product (title of a customer quoted on a page) as the buyer", industry: "fintech" };
  const out = await call("launch_commander", args);
  assert.match(out, /Ten deals need at least ten buying conversations in all, about 3 in each of 4 segments/);
  assert.match(out, /win rate/i);
  // the named buyer is used and not asked for again
  assert.match(out, /SVP Product/);
  assert.doesNotMatch(sharpen(out) ?? "", /who the buyer is/i);
  assert.match(out, /Write to the SVP Product first/);
  // no figure that was not given
  for (const a of [...out.matchAll(/\$[\d,]+/g)].map((m) => m[0])) assert.ok(args.goals.includes(a), `invented amount ${a}`);
});

test("launch: a count goal is shared over the segments, and meetings are not turned into deals", async () => {
  const args = { product_feature: "Lanehop: route planning for delivery fleets", launch_type: "feature_launch", launch_date: "2027-03-01", target_segments: "Regional couriers, Grocery delivery operators, Furniture retailers",
    goals: "40 qualified meetings with Heads of Operations; 12 pilots started; 5 reference customers", industry: "logistics_tech" };
  const out = await call("launch_commander", args);
  assert.match(out, /40 qualified meetings[^\n]*14 in each of 3 segments/);
  assert.match(out, /12 pilots[^\n]*4 in each of 3 segments/);
  assert.doesNotMatch(out, /\bdeals\b[^\n]*qualified meetings|meetings[^\n]* into deals/);
});

test("launch: sector measures are not handed to a segment they do not fit", async () => {
  const args = { product_feature: "Lendbridge: loan origination and underwriting software with credit decisions and collections", launch_type: "feature_launch", launch_date: "2027-03-01", target_segments: "Banks, Property management", goals: "20 qualified meetings", industry: "fintech" };
  const out = await call("launch_commander", args);
  assert.doesNotMatch(seg(out, "Property management"), /originate a loan|delinquency|fair lending/i);
});

test("launch: a buyer named as VP Engineering is not listed twice as VP of Engineering", async () => {
  const args = { product_feature: "Buildfleet: build caching for CI", launch_type: "feature_launch", launch_date: "2027-03-01", target_segments: "Finance", goals: "20 qualified meetings with VP Engineering", industry: "software" };
  const out = await call("launch_commander", args);
  assert.doesNotMatch(out, /VP Engineering[^\n.]*VP of Engineering|VP of Engineering[^\n.]*VP Engineering/);
});

test("launch: a nested list in the product text stays whole (labor, materials and equipment)", async () => {
  const args = { product_feature: "Buildsite: project management, job costs for labor, materials and equipment, change orders and RFIs, analytics", launch_type: "feature_launch", launch_date: "2027-03-01", target_segments: "Residential, Commercial", goals: "20 qualified meetings", industry: "vertical_saas" };
  const out = await call("launch_commander", args);
  assert.doesNotMatch(out, /"materials and equipment"/);
  assert.match(out, /job costs for labor, materials and equipment/);
});

test("launch: the sharpen list does not ask for a product that was described", async () => {
  const args = { product_feature: "Buildfleet: build caching and test splitting, self-hosted runners, GPU and Arm build machines, a hosted dashboard", launch_type: "feature_launch", launch_date: "2027-03-01", target_segments: "Finance", goals: "20 qualified meetings", industry: "software" };
  const out = await call("launch_commander", args);
  assert.doesNotMatch(sharpen(out) ?? "", /sells, in the product_feature input/);
});

// ---- crisis_planner
test("crisis: a hotel software company gets hotel words, crisis measures and no adoption measures", async () => {
  const args = { company: "Stayhaven, property management and payments software for hotels", industry: "vertical_saas", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial" };
  const out = await call("crisis_planner", args);
  assert.match(out, /front desk/i);
  assert.match(out, /time to detect/i);
  assert.match(out, /time to restore/i);
  assert.doesNotMatch(out, /adoption by role|hours of admin|time to onboard|field and office/i);
  assert.deepEqual(repeats(out), []);
});

test("crisis: a vertical SaaS company with only a name gets crisis measures, not field and office words", async () => {
  const out = await call("crisis_planner", { company: "Nightowl", industry: "vertical_saas", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(out, /adoption by role|hours of admin|time to onboard|field and office|mobile app/i);
  assert.match(out, /customers affected/i);
});

test("crisis: a messaging platform has message delivery and one outage playbook, no per-site connectivity wording", async () => {
  const args = { company: "Pingrail, a messaging API that sends SMS and chat messages to end users through operator routes", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" };
  const out = await call("crisis_planner", args);
  assert.match(out, /message/i);
  assert.match(out, /route/i);
  assert.doesNotMatch(out, /field engineering|per site|regional link|sites?\b.*starting with sites/i);
  const outageHeads = out.split("\n").filter((l) => /^### /.test(l) && /outage|delayed|lost|delivery/i.test(l));
  assert.ok(outageHeads.length <= 1, "one playbook for the outage: " + outageHeads.join(" | "));
  assert.deepEqual(repeats(out), []);
});

test("crisis: a telecom company with only a name does not get a per-site connectivity business, and has one outage playbook", async () => {
  const out = await call("crisis_planner", { company: "Nightowl", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(out, /field engineering|regional link/i);
  const outageHeads = out.split("\n").filter((l) => /^### /.test(l) && /outage/i.test(l));
  assert.ok(outageHeads.length <= 1, outageHeads.join(" | "));
});

test("crisis: an IT services firm has one playbook for a missed delivery and service level, not two", async () => {
  const out = await call("crisis_planner", { company: "Cobaltdesk", industry: "ites", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  const heads = out.split("\n").filter((l) => /^### /.test(l) && /delivery|SLA/i.test(l));
  assert.ok(heads.length <= 1, heads.join(" | "));
  assert.match(out, /service credits/i);
});

test("crisis: an outage playbook measures the incident (detect, restore, customers affected)", async () => {
  const out = await call("crisis_planner", { company: "Quillnet", industry: "software", customer_base: "b2b_smb", data_sensitivity: "low_general", potential_crises: "service_outage" });
  assert.match(out, /time to detect, time to restore, customers affected and messages sent/);
});

// ---- retention_playbook
test("retention: an enterprise contract is not read as people-delivered services for a freight company", async () => {
  const args = { customer_segment: "shippers and importers served by Cargohaul", business_model: "enterprise_contract", current_churn_rate: "12% annually (hypothetical)", product: "Cargohaul, freight forwarding by ocean, air and road with customs and a tracking platform", industry: "logistics_tech" };
  const out = await call("retention_playbook", args);
  assert.doesNotMatch(out, /per FTE|people-delivered|offshore|key people|statement of work/i);
  assert.match(out, /enterprise contract/i);
  assert.deepEqual(repeats(out), []);
});

test("retention: an enterprise search subscription is not given reasons about cost per case", async () => {
  const args = { customer_segment: "financial services firms using Findwise", business_model: "saas_subscription", current_churn_rate: "1% monthly (hypothetical)", product: "Findwise", industry: "ai_native" };
  const out = await call("retention_playbook", args);
  assert.doesNotMatch(out, /cost per case|per case or per decision|human review switched on/i);
  assert.match(out, /Findwise/);
});

test("retention and launch: the closing list does not name kinds of company that have nothing to do with the product", async () => {
  const r = await call("retention_playbook", { customer_segment: "contractors using Buildsite", business_model: "saas_subscription", current_churn_rate: "1% monthly", product: "Buildsite", industry: "vertical_saas" });
  assert.doesNotMatch(r, /FMCG retail execution/);
  assert.match(sharpen(r), /what Buildsite sells/);
});

test("crisis: a telecom company with only a name is not told it sells per-site connectivity", async () => {
  const out = await call("crisis_planner", { company: "Nightowl", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(out, /per site, per link or bandwidth/);
  assert.match(out, /Business model: not given/);
});

test("crisis: an AI product is not told that an outage stops scoring and review queues", async () => {
  const out = await call("crisis_planner", { company: "Findwise", industry: "ai_native", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", potential_crises: "service_outage" });
  assert.doesNotMatch(out, /scoring|review queues/);
});

test("pool: the pairs the round 1 judges named", { skip: !POOL_AVAILABLE }, async () => {
  const get = async (tool, id) => { const [x] = await poolArgs(tool, [id]); return { args: x.args, out: await call(tool, x.args) }; };
  const q2 = await get("retention_playbook", "Q2");
  assert.doesNotMatch(q2.out, /per FTE|people-delivered|offshore|key people/i);
  const q7 = await get("crisis_planner", "Q7");
  assert.doesNotMatch(q7.out, /adoption by role|hours of admin|time to onboard|field and office/i);
  const p7 = await get("crisis_planner", "P7");
  assert.doesNotMatch(p7.out, /field engineering|regional link|per site, per link/);
  assert.ok(p7.out.split("\n").filter((l) => /^### /.test(l) && /outage/i.test(l)).length <= 1);
  const p2 = await get("launch_commander", "P2");
  assert.match(p2.out, /Write to the SVP Product first/);
  assert.doesNotMatch(sharpen(p2.out) ?? "", /who the buyer is/i);
  assert.doesNotMatch(seg(p2.out, "Property management"), /originate a loan|fair lending|delinquency/i);
  const q15 = await get("launch_commander", "Q15");
  assert.doesNotMatch(q15.out, /the part of CircleCI/);
  assert.doesNotMatch(q15.out, /VP of Engineering[^\n.]*VP Engineering|VP Engineering[^\n.]*VP of Engineering/);
  const p5 = await get("retention_playbook", "P5");
  assert.doesNotMatch(p5.out, /cost per case|per case or per decision|human review switched on/i);
});
