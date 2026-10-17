// Run 22 round 3 (writer cg-w2), test first. The round 2 judge found: the signer read from the sector instead of the buyer named in the goal, buyer roles that repeat each other,
// thin segment sections (launch_commander); reasons 5 to 8, the health score and the cadence canned, a competitor switch answered with a special offer, a cost reason written as a
// conditional question (retention_playbook); a vulnerability playbook that sends the reader to breach steps the plan does not contain, an outage playbook that says the same thing
// twice and has nobody to tell, overlapping breach and exposure playbooks, nothing on a model provider outage or permission leakage for an AI company (crisis_planner). Invented companies only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { call, repeats, count, sharpen, poolArgs, POOL_AVAILABLE } from "./run22-cgw2-helpers.mjs";

const para = (out, heading) => { const i = out.indexOf(heading); assert.ok(i >= 0, `no ${heading}`); const rest = out.slice(i); return rest.split("\n\n").slice(0, 2).join("\n\n"); };
const section = (out, heading) => { const i = out.indexOf(heading); assert.ok(i >= 0, `no ${heading}`); const rest = out.slice(i + heading.length); const m = rest.search(/\n#{2,3} /); return m < 0 ? rest : rest.slice(0, m); };

test("launch: the buyer named in the goal is the signer, not the sector's usual signer", async () => {
  const args = { product_feature: "Tillbridge: bank account connection, balance checks and payment initiation for fintech apps", launch_type: "feature_launch", launch_date: "Q1 2027", target_segments: "Fintech and digital banking, Lending, Auto, Property management",
    goals: "a hypothetical pipeline of $1,200,000, which is ten deals at a hypothetical $120,000 annual contract value, with SVP Product (title of a customer quoted on a page) as the buyer", industry: "fintech" };
  const out = await call("launch_commander", args);
  assert.match(out, /the SVP Product signs/);
  assert.doesNotMatch(out, /(?:business owner|Risk Officer|Chief Executive)[^.;]{0,60} signs/);
  assert.doesNotMatch(out, /a group decides \((?!the SVP Product)/);
  const line = out.split("\n").find((l) => l.startsWith("Write to the SVP Product first")) ?? "";
  assert.ok(line, "the buyer line");
  assert.doesNotMatch((line.split("the other roles in the group:")[1] ?? "").split(".")[0], /Head of Product|Chief Product Officer|Product/);   // the same function under another rank is the same role
});

test("launch: buyer roles do not repeat the named buyer under another title", async () => {
  const args = { product_feature: "Slabwright: construction project management with change orders, RFIs and submittals, daily logs, job cost and subcontractor payments", launch_type: "feature_launch", launch_date: "2027-03-01",
    target_segments: "Residential, Commercial", goals: "a hypothetical pipeline of $1,000,000, which is ten deals at a hypothetical $100,000 annual contract value, with President and CFO as the buyer", industry: "vertical_saas" };
  const out = await call("launch_commander", args);
  const line = out.split("\n").find((l) => l.startsWith("Write to the President and CFO first")) ?? "";
  assert.ok(line, "the buyer line");
  const others = (line.split("the other roles in the group:")[1] ?? "").split(".")[0];
  assert.doesNotMatch(others, /President|Chief Financial Officer|CFO/);
});

test("launch: every segment section says more than the names of two features", async () => {
  const args = { product_feature: "Cranefleet: build caching and test splitting, self-hosted runners with config policies and SSO, 30x concurrency on Free, 80x on Performance and unlimited on Scale, GPU and Arm build machines, a hosted dashboard for build times, private orbs for shared steps", launch_type: "feature_launch", launch_date: "2027-03-01",
    target_segments: "Finance, Gaming, E-commerce, Education", goals: "30 qualified meetings with VP Engineering", industry: "software", business_model: "saas" };
  const out = await call("launch_commander", args);
  for (const s of ["Finance", "Gaming", "E-commerce", "Education"]) {
    const p = para(out, `### ${s}\n`).split("\n\n")[1];
    assert.ok(count(p, /[.?]\s|[.?]$/g) >= 3, `${s} is thin: ${p}`);
  }
  assert.deepEqual(repeats(out), []);
  // a part that has no noun of its own ("80x on Performance and unlimited on Scale") is never offered alone
  assert.doesNotMatch(out, /"80x on Performance and unlimited on Scale"/);
});

// ---- retention
const BUILD = { customer_segment: "contractors and civil engineers using Slabwright", business_model: "saas_subscription", current_churn_rate: "1% monthly (hypothetical)", product: "Slabwright", industry: "vertical_saas" };
test("retention: reasons 5 to 8 come from the sector's own concerns, not from a canned list", async () => {
  const out = await call("retention_playbook", BUILD);
  const heads = out.split("\n").filter((l) => /^### \d+\. /.test(l));
  assert.ok(heads.length >= 6, heads.join("|"));
  for (const h of heads) assert.doesNotMatch(h, /^### \d+\. (?:Missing features|Poor support|Competitor switch|Low usage\/adoption|Budget cuts|Champion left|Poor onboarding|Price\/value mismatch)$/);
  assert.doesNotMatch(out, /special offer/i);
  assert.deepEqual(repeats(out), []);
  // every reason has its own signal line (a repeated line is dropped, so a shared signal would leave the later reasons without one)
  const blocks = out.split(/\n(?=### \d+\. )/).slice(1).map((b) => b.split(/\n(?=## )/)[0]);
  for (const b of blocks) assert.match(b, /\*\*Signal:\*\*/, b.split("\n")[0]);
});

test("retention: a competitor switch is answered with the outcome and the cost of moving, not an offer", async () => {
  // no sector given: the general list of reasons is used, and its competitor switch step must not be a special offer
  const out = await call("retention_playbook", { customer_segment: "small studios using Daubrik", business_model: "saas_subscription", current_churn_rate: "1% monthly (hypothetical)", product: "Daubrik", industry: "other" });
  assert.doesNotMatch(out, /special offer/i);
  const s = section(out, "### 4. Competitor switch");
  assert.doesNotMatch(s, /offer|discount|price match/i);
  assert.match(s, /cost of moving/i);
});

test("retention: the health score and the cadence are read in the product's own words", async () => {
  const out = await call("retention_playbook", { ...BUILD, churn_reasons: "reps went back to paper" });
  const health = section(out, "## Health score");
  assert.match(health, /\| Read it as \|/);
  assert.match(health, /adoption by role|time to onboard|teams and sites live|share of the daily work/i);
  const cadence = section(out, "## When to reach out");
  assert.match(cadence, /adoption by role|time to onboard|hours of admin|errors and rework|data accuracy|sponsor|Owner|Head of Operations/i);
  assert.doesNotMatch(cadence, /\| Adoption check and one quick win \|/);
});

test("retention: an AI product's cost reason is a plain reason, not a conditional question", async () => {
  const out = await call("retention_playbook", { customer_segment: "financial services firms using Quorvane", business_model: "saas_subscription", current_churn_rate: "1% monthly (hypothetical)", product: "Quorvane", industry: "ai_native" });
  assert.doesNotMatch(out, /Did the cost grow|If the price follows/);
  assert.match(out, /Cost grew faster than the value as use grew/);
  assert.doesNotMatch(out, /cost per case|human review switched on|special offer/i);
});

test("retention: a long product name is not repeated in full in the drafts, and the grammar is right", async () => {
  const product = "Cargohaul AI-powered digital freight forwarding platform for importers";
  const out = await call("retention_playbook", { customer_segment: "luxury retail (customers of Cargohaul)", business_model: "enterprise_contract", current_churn_rate: "1% monthly (hypothetical)", product, industry: "logistics_tech" });
  assert.ok(count(out, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) <= 2);
  assert.doesNotMatch(out, /\ba enterprise\b/);
});

// ---- crisis
test("crisis: a vulnerability playbook does not send the reader to breach steps that the plan does not contain", async () => {
  const base = { company: "Quillnet", industry: "software", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" };
  const alone = await call("crisis_planner", { ...base, potential_crises: "security_vulnerability; service_outage" });
  assert.doesNotMatch(alone, /move to the data breach steps|data breach steps/);
  assert.match(alone, /treat it as a data breach/i);
  const both = await call("crisis_planner", { ...base, potential_crises: "security_vulnerability; data_breach" });
  assert.match(both, /data breach steps/);
});

test("crisis: an outage playbook says what an outage is once and names who to tell", async () => {
  const out = await call("crisis_planner", { company: "Pingrail, a messaging API that sends SMS and chat messages to end users through operator routes", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(out, /What an outage looks like here/);
  const out2 = await call("crisis_planner", { company: "Quillnet", industry: "software", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", potential_crises: "service_outage" });
  const s = section(out2, "### Service outage");
  assert.match(s, /\*\*Who to tell\*\*/);
});

test("crisis: a breach and a customer data exposure are one playbook with both sets of steps", async () => {
  const out = await call("crisis_planner", { company: "Nightowl", industry: "vertical_saas", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", potential_crises: "data_breach; customer_data_exposure" });
  const heads = out.split("\n").filter((l) => /^### /.test(l) && /breach|exposure|security incident/i.test(l));
  assert.equal(heads.length, 1, heads.join(" | "));
  assert.match(out, /Close the access if customer data was open to others/);
  assert.match(out, /Contain the threat/);
});

test("crisis: a pointer to the data breach steps is written only when the plan has them", async () => {
  const base = { company: "Nightowl", industry: "vertical_saas", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" };
  const withBreach = await call("crisis_planner", { ...base, potential_crises: "security_vulnerability; data_breach" });
  assert.match(withBreach, /### Security incident/);
  assert.match(withBreach, /move to the data breach steps/);
  const exposureOnly = await call("crisis_planner", { ...base, potential_crises: "security_vulnerability; customer_data_exposure" });
  assert.match(exposureOnly, /### Customer data exposure/);
  assert.doesNotMatch(exposureOnly, /move to the data breach steps/);
  const slaOnly = await call("crisis_planner", { ...base, potential_crises: "security_vulnerability; sla_breach" });
  assert.doesNotMatch(slaOnly, /move to the data breach steps/);
  assert.match(slaOnly, /### SLA breach/);
});

test("crisis: the measures customers watch read one way, and one measure is not 'which of them'", async () => {
  const ai = await call("crisis_planner", { company: "Quorvane", industry: "ai_native", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(ai, /also watch accuracy[^.]*which of them/);
  assert.match(ai, /also watch accuracy on the buyer's own data: say whether you see it affected/);
  const saas = await call("crisis_planner", { company: "Nightowl", industry: "vertical_saas", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(saas, /errors and rework and /);
});

test("crisis: an AI company gets a model provider outage and permission leakage", async () => {
  const out = await call("crisis_planner", { company: "Quorvane", industry: "ai_native", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", potential_crises: "service_outage; data_breach" });
  assert.match(out, /model provider|hosting provider/i);
  assert.match(out, /permission/i);
  const plain = await call("crisis_planner", { company: "Nightowl", industry: "software", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", potential_crises: "service_outage; data_breach" });
  assert.doesNotMatch(plain, /model provider|permission leakage/i);
});

test("pool: the pairs the round 2 judge named", { skip: !POOL_AVAILABLE }, async () => {
  const get = async (tool, id) => { const [x] = await poolArgs(tool, [id]); return await call(tool, x.args); };
  const p2 = await get("launch_commander", "P2");
  assert.match(p2, /the SVP Product signs/);
  assert.doesNotMatch(p2, /Chief Risk Officer or Head of Credit signs|business owner[^.;]{0,60} signs/);
  const p4 = await get("launch_commander", "P4");
  const line = p4.split("\n").find((l) => l.startsWith("Write to the President and CFO first")) ?? "";
  assert.doesNotMatch((line.split("the other roles in the group:")[1] ?? "").split(".")[0], /President|Chief Financial Officer/);
  for (const [tool, id] of [["retention_playbook", "P4"], ["retention_playbook", "P5"]]) {
    const out = await get(tool, id);
    assert.doesNotMatch(out, /special offer|Did the cost grow/i, id);
    assert.match(out, /\| Read it as \|/, id);
  }
  const q2 = await get("retention_playbook", "Q2");
  assert.doesNotMatch(q2, /\ba enterprise\b/);
  const p7 = await get("crisis_planner", "P7");
  assert.doesNotMatch(p7, /move to the data breach steps/);
  const p5 = await get("crisis_planner", "P5");
  assert.match(p5, /permission/i);
});
