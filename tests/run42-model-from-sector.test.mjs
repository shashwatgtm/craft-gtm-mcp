// Run 42B: with your_sector given and no stated model, every tool follows that sector's default model wording; words such as "connect", "network" or "API" in the
// product text never decide it. Buyer habits of software teams appear only for software and cybersecurity sellers. competitive_intel: one phrase is one card,
// a page claim is said once, the user's own advantage stays on the user's side. Invented names only; all figures hypothetical.
import test from "node:test";
import assert from "node:assert/strict";
import mcp0 from "../netlify/functions/mcp.mjs";
import { SECTOR_MODEL, MODEL_NAME } from "../dist/verticals.js";
import { SECTOR_CHOICES, statedCharge } from "../dist/context.js";

const mcp = mcp0.default || mcp0;
let rid = 5000;
async function call(name, args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: rid++, method: "tools/call", params: { name, arguments: args } }) }), {});
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = JSON.parse(t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5)); }
  return (j.result?.content ?? []).map((c) => c.text).join("\n");
}
const label = (m) => (m === "transactions" ? "per-transaction (volume based)" : MODEL_NAME[m]);
const PRODUCT = "Zentra: a connected network platform with an API and connectivity to many sites and links, with uptime dashboards for teams that connect their tools";
function argsFor(tool, sector) {
  const base = { your_sector: sector };
  switch (tool) {
    case "pmf_scorecard": return { ...base, product: PRODUCT, target_market: "other", current_metrics: "Hypothetical test figures. NPS: 40" };
    case "launch_commander": return { ...base, product_feature: PRODUCT, launch_date: "Q1 2027", launch_type: "feature_launch", target_segments: "mid sized teams", goals: "a hypothetical pipeline of $60,000" };
    case "customer_interview_kit": return { ...base, interview_type: "discovery", product_context: PRODUCT, target_persona: "operations lead", key_hypotheses: "Teams lose time on manual work" };
    case "retention_playbook": return { ...base, customer_segment: "mid sized teams", current_churn_rate: "hypothetical 2% monthly", product: PRODUCT };
    case "partner_architect": return { ...base, company: "Zentra", product: PRODUCT, partner_model: "referral", partner_goals: "reach more teams", your_deal_size: 6000 };
    case "crisis_planner": return { ...base, company: "Zentra", customer_base: "b2b_enterprise", data_sensitivity: "medium" };
    case "competitive_intel": return { ...base, your_product: PRODUCT, competitors: "Alpha Tools; Beta Works", your_strengths: "live in 30 days; one owner for every integration" };
    case "craft_gtm_analyzer": return { ...base, document_content: `Zentra plan. Goal: a hypothetical pipeline of $60,000 by Q1 2027.\nAudience: operations leads at mid sized teams who have outgrown spreadsheets or smaller software.\nMessage: ${PRODUCT}.`, document_type: "quarterly_plan" };
    default: throw new Error(tool);
  }
}
const TOOLS = ["pmf_scorecard", "launch_commander", "customer_interview_kit", "retention_playbook", "partner_architect", "crisis_planner", "competitive_intel", "craft_gtm_analyzer"];

for (const [sector, vid] of Object.entries(SECTOR_CHOICES)) {
  test(`your_sector ${sector} without a stated model gets the default model wording in every tool`, async () => {
    const want = label(SECTOR_MODEL[vid]);
    for (const tool of TOOLS) {
      const out = await call(tool, argsFor(tool, sector));
      const lines = out.split("\n").filter((l) => /Business model:/.test(l));
      for (const l of lines) {
        assert.ok(l.includes(`Business model: ${want} (the usual model in this sector`), `${tool} ${sector}: ${l}`);
      }
      if (SECTOR_MODEL[vid] !== "connectivity") assert.ok(!/per site, per link or bandwidth/i.test(out), `${tool} ${sector}: telecom model wording`);
      if (!["software", "cybersecurity"].includes(sector) && tool === "craft_gtm_analyzer") assert.ok(!/trial first|developers usually try/i.test(out), `${sector}: developer trial habits`);
    }
  });
}

test("a stated charge in the seller's words decides the model; the product's connect words do not", () => {
  assert.equal(statedCharge("a platform that connects banks over an API and a network"), null);
  assert.equal(statedCharge("priced per transaction"), "transactions");
  assert.equal(statedCharge("billed per site on a term contract"), "connectivity");
  assert.equal(statedCharge("automated management fees for property managers"), null);
});

test("an explicit business_model still wins over the sector default", async () => {
  const out = await call("competitive_intel", { ...argsFor("competitive_intel", "fintech"), business_model: "services" });
  assert.match(out, /Business model: services[^\n]*\(from business_model\)/);
});

test("competitive_intel: one sentence is one card, a page claim is said once, the user's own advantage is not the alternative's", async () => {
  const out = await call("competitive_intel", {
    your_product: "Zentra, a workspace for finance teams across many banks",
    competitors: "the current way of handling finance teams that juggle many bank accounts, ERPs, tax systems and spreadsheets, so reconciliation, collections and vendor payments are slow",
    your_strengths: "40+ banks connected (page claims); 50,000+ finance teams (page claims)",
    your_sector: "fintech",
  });
  assert.equal((out.match(/^## Against /gm) ?? []).length, 1);
  assert.ok(!/Against so reconciliation|Against collections/.test(out));
  const out2 = await call("competitive_intel", {
    your_product: "Zentra, a unified system for freight teams",
    competitors: "fragmented systems; custom integrations; separate tools to pay for",
    competitor_details: "One system is cheaper to pay for, learn and maintain",
    your_strengths: "over 17,000 teams trust Zentra (page claims); built with centuries of combined expertise (page claims)",
    your_sector: "logistics_tech",
  });
  for (const claim of ["over 17,000 teams trust Zentra (page claims)", "built with centuries of combined expertise (page claims)"]) {
    const at = out2.split(claim).length - 1;
    assert.ok(at <= 2, `${claim} repeated ${at} times`);   // once in "You win on" and at most once on a card
  }
  assert.ok(!/may be ahead:[^\n]*one system is cheaper/i.test(out2));
  assert.ok(!/What you know about [^\n]*one system is cheaper/i.test(out2));
});
