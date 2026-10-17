// Run 21b step 2 (test first): stock text of partner_architect. The partner kinds and the reason for them were written for one kind of company
// per vertical (ERP and HRMS partners for finance teams, telematics and driver app vendors, route to market consultants for consumer brands).
// The neutral entry of each vertical now names the kinds true for every company in it; the kinds of one sub-type sit under it.
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21-stock-partner_architect.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function partners(company, product, industry, partner_model = "referral", extra = {}) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "partner_architect", arguments: { company, product, partner_model, partner_goals: "partner-sourced pipeline for mid-size companies; no numeric target given", your_deal_size: "$40,000 ACV (hypothetical)", industry, ...extra } } }),
  }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  const text = j.result.content.map((c) => c.text).join("\n");
  return text.split("## Partners That Fit This Sector")[1]?.split("## Onboarding Flow")[0] ?? "";
}
const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

test("fintech: a card and expense company is pointed to ERP and HRMS partners, a payments platform to payments consultancies and platforms, a plain one to neither", async () => {
  const spend = await partners("Brightline", "corporate cards and expense management for finance teams", "fintech");
  const pay = await partners("Brightline", "a payments API platform that moves money through partner banks", "fintech");
  const neutral = await partners("Brightline", "Brightline", "fintech");
  assert.match(spend, /ERP and HRMS implementation partners/);
  assert.match(spend, /The CFO and Finance Controller take advice from auditors, accountants and the ERP partner/);
  assert.match(pay, /payments and banking consultancies/);
  assert.match(pay, /The head of payments and the technology head follow the advice/);
  assert.doesNotMatch(pay, /ERP and HRMS|Finance Controller/i);
  assert.match(neutral, /advisory and audit firms that advise finance, risk and compliance leaders/);
  assert.doesNotMatch(neutral, /ERP and HRMS|Finance Controller|payments and banking consultancies/i);
  for (const t of [spend, pay, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("logistics tech: integration partners for last mile delivery name driver app vendors, for freight visibility carrier data providers, for a plain logistics company neither", async () => {
  const lm = await partners("Brightline", "last mile delivery software for courier fleets", "logistics_tech", "integration_tech");
  const fv = await partners("Brightline", "freight visibility with shipment tracking across carriers", "logistics_tech", "integration_tech");
  const neutral = await partners("Brightline", "Brightline", "logistics_tech", "integration_tech");
  assert.match(lm, /telematics and driver app vendors/);
  assert.match(fv, /carrier connectivity and data providers/);
  assert.doesNotMatch(fv, /driver app|address and map data/i);
  assert.doesNotMatch(neutral, /driver app|address and map data|carrier connectivity and data providers/i);
  assert.match(neutral, /TMS, WMS, ERP and order management vendors/);
});

test("vertical SaaS and telecom: route to market consultants and site installers come only with the kinds of company they were written for", async () => {
  const fmcg = await partners("Brightline", "field sales automation and distributor management software for consumer brands", "vertical_saas");
  const plain = await partners("Brightline", "Brightline", "vertical_saas");
  assert.match(fmcg, /route-to-market and sales consultancies/);
  assert.doesNotMatch(plain, /route-to-market|DMS|trade marketing/i);
  assert.match(plain, /industry consultants and advisers who sit with the owner or the head of operations/);
  const net = await partners("Brightline", "managed SD-WAN and network services", "telecom", "agency_si");
  const tplain = await partners("Brightline", "Brightline", "telecom", "agency_si");
  assert.match(net, /network integrators for site installation and cut-over/);
  assert.doesNotMatch(tplain, /site installation|sites outside your coverage/i);
});

test("a product with no kind named is told which kinds have partner kinds of their own; a named kind is not", async () => {
  const neutral = await (async () => {
    const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "partner_architect", arguments: { company: "Brightline", product: "Brightline", partner_model: "referral", partner_goals: "partner-sourced pipeline for mid-size companies; no numeric target given", your_deal_size: "$40,000 ACV (hypothetical)", industry: "telecom" } } }) }));
    return (await r.json()).result.content.map((c) => c.text).join("\n");
  })();
  assert.match(neutral, /\*For Brightline: the sector lines below fit any company in telecom\. Lines written for one kind of company exist for these kinds: operators and enterprise connectivity; CPaaS and messaging\. Say what it sells in the product input to get them\.\*/);
});
