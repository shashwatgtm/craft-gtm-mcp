// Run 22 round 5 (cg-w1): craft_gtm_analyzer proof line and measure names. Written before the change; it failed on the starting head.
// The proof check tells a customer result (a customer or case named, or an outcome with a number and a source) from a company fact (users, funding,
// awards); it says "company facts" only when no result is on the line, and otherwise says what is missing around the result. The sector check also
// names the measures the plan itself states, in the plan's words, with no benchmark added. All plans below are INVENTED.
import { test } from "node:test";
import assert from "node:assert/strict";
import { text } from "./run22-cg-w1-helpers.mjs";

const BASE = `Lanehop go-to-market plan for next quarter. All figures in this plan are hypothetical.
Goal: build a hypothetical pipeline of $500,000 from last mile fleets, which is ten deals at a hypothetical contract value of $50,000.
Audience: delivery fleets with more than 50 vehicles.
Buyer roles: Head of Last Mile Operations, Fleet Manager.
Message: Lanehop re-plans routes live when orders change.`;
const A = (proof, extra = "") => text("craft_gtm_analyzer", { document_content: `${BASE}${extra}\nProof: ${proof}`, document_type: "quarterly_plan" });
const fixesOf = (out) => out.split("## What to fix first")[1].split("## Sector Check")[0];

test("r5: a proof line with customer results, numbers and sources is not called company facts", async () => {
  const out = await A("9,000+ customers use Lanehop (page claim); Brightfleet cut dispatch planning time by 35% (case study title, page claim); Norvale Freight reduced late deliveries by 18% (customer story, page claim).");
  const fix = fixesOf(out);
  assert.doesNotMatch(fix, /company fact/);
  assert.doesNotMatch(fix, /gives facts about the company/);
});
test("r5: an unnamed customer with an outcome, a number and a source counts as a result; the missing second customer is named", async () => {
  const out = await A("A leading regional carrier achieved a 22% cost reduction over 2 years without a new depot (client spotlight on the customer page)");
  const fix = fixesOf(out);
  assert.doesNotMatch(fix, /company fact/);
  assert.match(fix, /second customer/);
  assert.match(fix, /22% cost reduction/);
});
test("r5: a result with no source is told to name its source", async () => {
  const out = await A("Brightfleet cut dispatch planning time by 35%; Norvale Freight reduced late deliveries by 18%");
  const fix = fixesOf(out);
  assert.doesNotMatch(fix, /company fact/);
  assert.match(fix, /Brightfleet cut dispatch planning time by 35%/);
  assert.match(fix, /source/);
  assert.doesNotMatch(fix, /second customer/);
});
test("r5: when one result on the line carries a source, no result is called unsourced", async () => {
  const out = await A("Brightfleet cut dispatch planning time by 35%; Norvale Freight reduced late deliveries by 18% (customer story)");
  assert.doesNotMatch(fixesOf(out), /no source named|company fact/);
});
test("r5: a semicolon inside a customer quotation does not split the item", async () => {
  const out = await A("Brightfleet says: 'We cut planning from 4 hours to 20 minutes; the routes are better too.' (customer quote); Norvale Freight reduced late deliveries by 18% (customer story)");
  assert.doesNotMatch(fixesOf(out), /company fact|names a customer but gives no number|second customer/);
});
test("r5: facts only (users, funding, awards) are still called company facts", async () => {
  const out = await A("a $40 million Series B in 2022; 3M users worldwide; named a leader in 2023.");
  const fix = fixesOf(out);
  assert.match(fix, /The proof is a company fact, not a result/);
  assert.match(fix, /a \$40 million Series B in 2022/);
});
test("r5: a proof line with a result and no fix to make adds no proof item at all", async () => {
  const out = await A("3M users worldwide (page claim); Brightfleet cut dispatch planning time by 35% (case study title); Norvale Freight reduced late deliveries by 18% (customer story)");
  const fix = fixesOf(out);
  assert.doesNotMatch(fix, /proof|Proof/);
});
test("r5: a fix title does not end in two full stops", async () => {
  const out = await A("a $40 million Series B in 2022; 3M users worldwide.", "\nAudience: fleets, depots, couriers, retailers, grocers and parcel networks.");
  assert.doesNotMatch(out, /\.\.\*\*/);
  assert.doesNotMatch(out, /\.\./);
});
test("r5: the sector check names the measures the plan states itself, in the plan's words, and adds no figure", async () => {
  const plan = `Linkly go-to-market plan for next quarter. All figures in this plan are hypothetical.
Goal: build a hypothetical pipeline of $900,000, which is ten deals at a hypothetical annual contract value of $90,000, from Fintech and digital banking.
Audience: companies that build fintech and digital financial products, plus banks and credit unions.
Buyer roles: SVP Product, developers and engineering teams, fraud and risk teams.
Message: Linkly connects bank accounts through one API: link checking and savings accounts in as little as 7 seconds, 25% higher onboarding conversion, and save an average of 40% on processing fees with pay by bank (page claims).
Proof: Brightpay raised signup completion 5X in 12 months (story title, page claim); Norvale Bank cut manual review time by 60% (story title, page claim).
Risks: How much does Linkly cost?`;
  const out = await text("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan" });
  const sector = out.split("## Sector Check")[1].split("## Risks")[0];
  assert.match(sector, /measures of its own/i);
  assert.match(sector, /onboarding conversion/);
  assert.match(sector, /processing fees/);
  const figures = (sector.match(/\d[\d,.]*\s?%/g) ?? []);
  assert.deepEqual(figures, [], "no percentage appears in the sector check: " + figures.join(","));
});
test("r5: a plan that states no measure of its own gets no such sentence", async () => {
  const out = await A("one fleet cut dispatch planning time (hypothetical)");
  const sector = out.split("## Sector Check")[1].split("## Risks")[0];
  assert.doesNotMatch(sector, /measures of its own/i);
});
