// Run 20 round 3 (quality, D92): findings of the fresh judges on 7592f4c. Invented companies only; figures hypothetical.
import { test } from "node:test";
import assert from "node:assert/strict";
const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
}
const P = (deal, extra = {}) => call("partner_architect", { company: "Ledgerline", product: "Ledgerline", partner_model: "referral", partner_goals: "Partner-sourced pipeline among banks", your_deal_size: deal, ...extra });

test("partner_architect: the viability text follows the commission at the deal size", async () => {
  const verdict = async (deal) => (await P(deal)).text.split("**What the economics support:**")[1].split("\n\n")[0];
  const small = await verdict("$2,400 ACV");
  assert.match(small, /earns \$240 on one closed deal/);
  assert.match(small, /not justified|self.serve/i);
  assert.doesNotMatch(small, /named partner manager and tailored onboarding/);
  const mid = await verdict("$24,000 ACV");
  assert.match(mid, /earns \$2,400 on one closed deal/);
  assert.match(mid, /shared partner manager|pooled/i);
  assert.doesNotMatch(mid, /named partner manager and tailored onboarding/);
  const big = await verdict("$250,000 ACV");
  assert.match(big, /earns \$25,000 on one closed deal/);
  assert.match(big, /named partner manager/);
});
test("partner_architect: investment consultants carry the independence caution; no sector read says what is assumed", async () => {
  const t = (await P("$250,000 ACV", { partner_goals: "Partner-sourced pipeline among asset allocators (pensions; endowments)" })).text;
  assert.match(t, /may not be paid to recommend/);
  assert.match(t, /referral fee only where compliance allows/);
  assert.match(t, /not clear from your inputs/);
  assert.match(t, /come from the partner model and the segments in your goal, not from what the product does/);
});

const CI = { your_product: "Ledgerline billing platform", competitors: "legacy billing systems, manual spreadsheets kept by finance teams", your_strengths: "supports usage pricing, SOC 2 Type II reports, a 99.9% uptime SLA on the hosted service (page claims)",
  competitor_details: "legacy billing systems take many months to implement; the whole category is slow to change", common_objections: "How is a prepaid plan different from a postpaid plan?, How long does it take to go live?" };
test("competitive_intel: a category-wide note is not shown as a note about each alternative, and a supplied detail is used on its card", async () => {
  const r = await call("competitive_intel", CI);
  const all = r.text.split("## Objection handlers")[0].split(/\n(?=## Against )/).slice(1);
  const cards = all.join("\n");
  assert.equal(all.length, 2);
  const c2 = all[1];
  assert.doesNotMatch(c2, /take many months to implement/);
  assert.doesNotMatch(c2, /the whole category is slow to change/);
  assert.match(all[0], /take many months to implement/);
  assert.doesNotMatch(all[0], /None of the strengths you listed is tied to this alternative/);
});
test("competitive_intel: a claim in a spoken script keeps its page-claim label, and a strength is not stretched beyond what it says", async () => {
  const r = await call("competitive_intel", CI);
  const scripts = [...r.text.matchAll(/> "Comparing us with[^\n]*"/g)].map((m) => m[0]).join("\n");
  assert.ok(scripts.length > 0, "a spoken script is present");
  assert.match(scripts, /99\.9% uptime SLA on the hosted service \(page claims\)/);
  assert.doesNotMatch(scripts, /99\.9% uptime SLA on the hosted service\./, "label dropped");
  assert.doesNotMatch(r.text, /what customers tell us:\n1\. The world's leading/i);
});
test("competitive_intel: a comparison objection that names no alternative says which difference the user must state", async () => {
  const r = await call("competitive_intel", CI);
  const h = r.text.split("## Objection handlers")[1].split('### "How is a prepaid plan different from a postpaid plan?"')[1].split("###")[0];
  assert.match(r.text, /a fact that answers "How is a prepaid plan different from a postpaid plan\?": two or three concrete differences/);
  assert.doesNotMatch(h, /I can point to:/);
});

// craft_gtm_analyzer
const A = (plan, extra = {}) => call("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan", ...extra }).then((r) => r.text);
test("craft_gtm_analyzer: an abbreviation (Sr.) does not end the quoted line; GM-IT and a platform leader are read as deciders", async () => {
  const t = await A("Plan for Shelfwalk, field sales software for consumer brands.\nGoal: ten hypothetical deals.\nBuyer roles: GM-IT, Sr. Sales Automation Manager, sales reps.\nMessage: Shelfwalk captures orders offline, with DMS and ERP integration.", { industry: "vertical_saas" });
  assert.doesNotMatch(t, /> Buyer roles: GM-IT, Sr\.\s*$/m);
  assert.match(t, /roles in your plan match [^.\n]*(Chief Information Officer|Managing Director|CIO)/);
  const u = await A("Plan.\nGoal: ten hypothetical deals.\nBuyer roles: platform leader, IT / Security.\nMessage: Probetool is an API platform with a CLI, mock servers and an API catalog.");
  assert.doesNotMatch(u, /No role in your plan matches the usual deciders/);
});
test("craft_gtm_analyzer: a plan for asset allocators with a CIO and portfolio managers gets an investment sector check", async () => {
  const t = await A("Quantara plan.\nGoal: ten hypothetical deals.\nAudience: asset allocators, investment managers.\nBuyer roles: CIO, portfolio manager, compliance committees.\nMessage: Quantara gives forecast ranges with explanations.");
  assert.match(t, /## Sector Check/);
  assert.doesNotMatch(t, /The sector was not clear from your plan/);
  assert.match(t, /investment committee|Investment Committee/);
});

// pmf_scorecard
test("pmf_scorecard: a recognition and a growth claim get their own next step as company claims, and every proof line is counted", async () => {
  const r = await call("pmf_scorecard", { product: "Lanehop", target_market: "logistics_tech", current_metrics: "Churn: 2%, NPS: 41",
    customer_feedback: "Cut cost per delivery by a fifth at one hub (hypothetical); Market recognition from an analyst for 7 consecutive years; Revenue grew 30% year on year (page claim); Won the 2024 industry award" });
  assert.doesNotMatch(r.text.split("## Customer Feedback You Gave")[1].split("## Priority Actions")[0], /\| Note \|/);
  assert.match(r.text, /Cite it as a company claim/);
  assert.match(r.text, /PROOF: you gave 4 customer results or recognitions/);
});

// retention_playbook
test("retention_playbook: a low churn is 'low against the example thresholds', not 'healthy'", async () => {
  const r = await call("retention_playbook", { customer_segment: "Platform teams", business_model: "saas_subscription", current_churn_rate: "1.5% monthly (hypothetical)" });
  assert.doesNotMatch(r.text, /HEALTHY/);
  assert.match(r.text, /low against the example thresholds/i);
});
test("retention_playbook: an investment mandate seller gets investment wording, not cost per resolved case", async () => {
  const r = await call("retention_playbook", { customer_segment: "Asset allocators (pensions; endowments)", business_model: "enterprise_contract", current_churn_rate: "0.3% monthly (hypothetical)", product: "Quantara, systematic investment strategies built with institutions", churn_reasons: "cost grew, explanations were weak" });
  assert.doesNotMatch(r.text, /cost per resolved case|how often a person steps in/i);
  assert.match(r.text, /investment mandate/i);
});

// crisis_planner
test("crisis_planner: a billing platform read from the company's product gets billing crises, and a leaked-key playbook has no pasted release sentence", async () => {
  const r = await call("crisis_planner", { company: "Ledgerline Billing, billing and revenue recognition platform", industry: "saas", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.match(r.text, /wrong invoice run or a failed billing run/i);
  assert.match(r.text, /revenue recognition or tax error/i);
  const s = await call("crisis_planner", { company: "Probetool", industry: "software", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", potential_crises: "leaked_keys" });
  assert.doesNotMatch(s.text, /lead time for changes|escaped defects/);
});

test("an AI native seller whose customers are asset allocators and pensions is read on the investment model, in retention and in the analyzer", async () => {
  const r = await call("retention_playbook", { customer_segment: "Asset allocators (pensions; endowments) (customers of Quantara)", business_model: "enterprise_contract", current_churn_rate: "0.3% monthly (hypothetical)", industry: "ai_native" });
  assert.match(r.text, /Business model: investment management/);
  assert.doesNotMatch(r.text, /cost per resolved case/);
  const t = await A("Quantara plan.\nGoal: ten hypothetical deals.\nAudience: asset allocators, pensions.\nBuyer roles: CIO, portfolio manager.\nMessage: forecast ranges with explanations.");
  assert.match(t, /Sector: read from the buyers your plan names as AI native, investment management/);
});
