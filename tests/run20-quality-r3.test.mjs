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
  const small = (await P("$2,400 ACV")).text.split("### Commission Viability Check")[1].split("---")[0];
  assert.match(small, /example commission of \$240/);
  assert.match(small, /not justified|self-serve/i);
  assert.doesNotMatch(small, /named partner manager and tailored onboarding/);
  const mid = (await P("$24,000 ACV")).text.split("### Commission Viability Check")[1].split("---")[0];
  assert.match(mid, /example commission of \$2,400/);
  assert.match(mid, /shared partner manager|pooled/i);
  assert.doesNotMatch(mid, /named partner manager and tailored onboarding/);
  const big = (await P("$250,000 ACV")).text.split("### Commission Viability Check")[1].split("---")[0];
  assert.match(big, /example commission of \$25,000/);
  assert.match(big, /named partner manager/);
});
test("partner_architect: investment consultants carry the independence caution; no sector read says what is assumed", async () => {
  const t = (await P("$250,000 ACV", { partner_goals: "Partner-sourced pipeline among asset allocators (pensions; endowments)" })).text;
  assert.match(t, /may not be paid to recommend/);
  assert.match(t, /referral fee only where compliance allows/);
  assert.match(t, /sector is not clear from your inputs, so the partner kinds below come from the segments in your goal/);
});

const CI = { your_product: "Ledgerline billing platform", competitors: "legacy billing systems, manual spreadsheets kept by finance teams", your_strengths: "supports usage pricing, SOC 2 Type II reports, a 99.9% uptime SLA on the hosted service (page claims)",
  competitor_details: "legacy billing systems take many months to implement; the whole category is slow to change", common_objections: "How is a prepaid plan different from a postpaid plan?, How long does it take to go live?" };
test("competitive_intel: a category-wide note is not shown as a note about each alternative, and a supplied detail is used on its card", async () => {
  const r = await call("competitive_intel", CI);
  const cards = r.text.split("## Objection Handlers")[0].split("## Competitor Battle Cards")[1];
  const c2 = cards.split(/\n### 2\. /)[1];
  assert.doesNotMatch(c2, /take many months to implement/);
  assert.doesNotMatch(c2, /the whole category is slow to change/);
  assert.match(cards.split(/\n### 1\. /)[1].split(/\n### 2\. /)[0], /take many months to implement/);
  assert.doesNotMatch(cards.split(/\n### 1\. /)[1].split(/\n### 2\. /)[0], /None of the strengths you listed is tied to this alternative/);
});
test("competitive_intel: a claim in a spoken script keeps its page-claim label, and a strength is not stretched beyond what it says", async () => {
  const r = await call("competitive_intel", CI);
  const scripts = [...r.text.matchAll(/"That's a fair question[\s\S]*?```/g)].map((m) => m[0]).join("\n");
  assert.doesNotMatch(scripts, /99\.9% uptime SLA on the hosted service\./, "label dropped");
  assert.doesNotMatch(r.text, /what customers tell us:\n1\. The world's leading/i);
});
test("competitive_intel: a comparison objection that names no alternative says which difference the user must state", async () => {
  const r = await call("competitive_intel", CI);
  const h = r.text.split("## Objection Handlers")[1].split("## Win/Loss Analysis")[0].split("### 1.")[1].split("### 2.")[0];
  assert.match(h, /Fact needed from you: two or three concrete differences/);
  assert.doesNotMatch(h, /What I can point to:/);
});

// craft_gtm_analyzer
const A = (plan, extra = {}) => call("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan", ...extra }).then((r) => r.text);
test("craft_gtm_analyzer: an abbreviation (Sr.) does not end the quoted line; GM-IT and a platform leader are read as deciders", async () => {
  const t = await A("Plan for Shelfwalk, field sales software for consumer brands.\nGoal: ten hypothetical deals.\nBuyer roles: GM-IT, Sr. Sales Automation Manager, sales reps.\nMessage: Shelfwalk captures orders offline, with DMS and ERP integration.", { industry: "vertical_saas" });
  assert.doesNotMatch(t, /> Buyer roles: GM-IT, Sr\.\s*$/m);
  assert.match(t, /Deciders your plan names:\*\*[^\n]*(Chief Information Officer|Managing Director|CIO)/);
  const u = await A("Plan.\nGoal: ten hypothetical deals.\nBuyer roles: platform leader, IT / Security.\nMessage: Probetool is an API platform with a CLI, mock servers and an API catalog.");
  assert.doesNotMatch(u, /Deciders your plan names:\*\* none of the usual roles/);
});
test("craft_gtm_analyzer: a plan for asset allocators with a CIO and portfolio managers gets an investment sector check", async () => {
  const t = await A("Quantara plan.\nGoal: ten hypothetical deals.\nAudience: asset allocators, investment managers.\nBuyer roles: CIO, portfolio manager, compliance committees.\nMessage: Quantara gives forecast ranges with explanations.");
  assert.match(t, /## Sector Check/);
  assert.doesNotMatch(t, /The sector was not clear from your plan/);
  assert.match(t, /investment committee|Investment Committee/);
});
