// Run 42B addendum 8 and 9b: regional shipping notes only when the seller's words name the region; a typed status quo sentence is one card.
// Invented names only. All figures hypothetical.
import test from "node:test";
import assert from "node:assert/strict";
import mcp0 from "../netlify/functions/mcp.mjs";

const mcp = mcp0.default || mcp0;
let rid = 900;
async function call(name, args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: rid++, method: "tools/call", params: { name, arguments: args } }) }), {});
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = JSON.parse(t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5)); }
  return (j.result?.content ?? []).map((c) => c.text).join("\n");
}
const REGIONAL = /cash on delivery|pin code|return to origin|non delivery report|\bindia/i;
const PRODUCT = "Zipship: multi-carrier shipping software, an app and an API to compare rates across carriers, buy and print labels, validate addresses and track shipments";
const STATUS_QUO = "the current way of handling shipping when merchants grow: many carriers, rates to compare, labels to print and tracking to send to customers";

test("competitive_intel: a status quo sentence is one card with natural wording", async () => {
  const t = await call("competitive_intel", { your_product: PRODUCT, competitors: STATUS_QUO, your_strengths: "fast setup", your_sector: "logistics_tech" });
  assert.doesNotMatch(t, /alternative 1|## Against rates to compare|## Against labels to print/i);
  assert.equal((t.match(/^## Against /gm) || []).length, 1);
  assert.match(t, /You described one alternative/);
  assert.doesNotMatch(t, /The alternatives you named: the current approach/);
  assert.doesNotMatch(t, REGIONAL);
});
test("competitive_intel: a clear list of named or kind-named alternatives still splits", async () => {
  const t = await call("competitive_intel", { your_product: PRODUCT, competitors: "Acme Ship, Parcelio, spreadsheets", your_strengths: "fast setup" });
  assert.match(t, /## Against Acme Ship/);
  assert.match(t, /## Against Parcelio/);
  const u = await call("competitive_intel", { your_product: PRODUCT, competitors: "manual spreadsheets kept by finance teams, a generic add-on bundled with the ERP", your_strengths: "fast setup" });
  assert.equal((u.match(/^## Against /gm) || []).length, 2);
});
test("no tool leaks India courier notes for a global shipping seller", async () => {
  const sector = "logistics_tech";
  const outs = await Promise.all([
    call("competitive_intel", { your_product: PRODUCT, competitors: "spreadsheets, a carrier portal", your_strengths: "fast setup", your_sector: sector }),
    call("launch_commander", { product_feature: PRODUCT, launch_type: "feature_launch", target_segments: "online merchants", goals: "ten deals", your_sector: sector }),
    call("retention_playbook", { customer_segment: "online merchants (customers of Zipship)", business_model: "saas", current_churn_rate: "2% monthly (hypothetical)", product: PRODUCT, your_sector: sector }),
    call("customer_interview_kit", { interview_type: "discovery", product_context: PRODUCT, industry: "logistics_tech", target_persona: "operations manager", your_sector: sector }),
    call("partner_architect", { company: "Zipship", product: PRODUCT, partner_model: "referral", partner_goals: "partner-sourced pipeline for mid-size companies; no numeric target given", your_deal_size: "$40,000 ACV (hypothetical)", industry: "logistics_tech", your_sector: sector }),
    call("crisis_planner", { company: "Zipship", industry: "logistics_tech", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", your_sector: sector }),
    call("craft_gtm_analyzer", { document_content: "Zipship go-to-market plan\nAudience: online merchants.\nMessage: " + PRODUCT, document_type: "quarterly_plan", your_sector: sector }),
  ]);
  outs.forEach((t, i) => { assert.ok(t.length > 200, `tool ${i} answered: ${t.slice(0, 300)}`); assert.doesNotMatch(t, REGIONAL, `tool ${i}`); });
});
test("a seller that names the Indian courier practices keeps the regional notes", async () => {
  const t = await call("competitive_intel", { your_product: "Zipship: shipping aggregator for Indian sellers with cash on delivery remittance and pin code serviceability", competitors: "spreadsheets, a courier portal", your_strengths: "fast setup" });
  assert.match(t, /cash on delivery|pin code/i);
});
