// Run 21b step 2 (test first): stock text of retention_playbook. The reasons customers leave, the signals and the renewal sentence of a sector
// were written for one kind of company (an ERP module closing the gap, drivers leaving an app, reps going back to paper, sites failing again).
// The neutral entry of each vertical holds reasons true for every company in it; the reasons of one kind sit under its sub-type.
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21-stock-retention_playbook.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function retain(product, industry, extra = {}) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "retention_playbook", arguments: { customer_segment: "mid-size companies", business_model: "saas_subscription", current_churn_rate: "1% monthly (hypothetical)", product, industry, ...extra } } }),
  }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  return j.result.content.map((c) => c.text).join("\n");
}
const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

test("fintech: a card and expense company is asked about the ERP module and the ledger, a payments platform about success rates and settlement, a plain one about neither", async () => {
  const spend = await retain("a corporate card and expense management platform", "fintech");
  const pay = await retain("a payments API platform that moves money through partner banks", "fintech");
  const neutral = await retain("Brightline", "fintech");
  assert.match(spend, /The ERP module closed the gap/);
  assert.match(spend, /Integration with the ledger kept needing fixes/);
  assert.match(spend, /bring the reconciliation and close results for the period/);
  assert.match(pay, /Payment success rates did not improve/);
  assert.match(pay, /Settlement or reconciliation questions kept coming/);
  assert.match(pay, /bring the record for the period/);
  assert.doesNotMatch(pay, /ERP module|ledger|month end|close results/i);
  assert.match(neutral, /A control or audit finding the product did not cover/);
  assert.match(neutral, /A provider the buyer already had was judged good enough/);
  assert.doesNotMatch(neutral, /ERP module|ledger|month end|close results|success rates|Settlement or reconciliation/i);
  for (const t of [spend, pay, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("logistics tech: a last mile delivery company is asked about drivers and hubs, a freight visibility company about carrier data, a plain one about neither", async () => {
  const lm = await retain("a last mile delivery platform for courier fleets", "logistics_tech");
  const fv = await retain("a freight visibility platform with shipment tracking across carriers", "logistics_tech");
  const neutral = await retain("Brightline", "logistics_tech");
  assert.match(lm, /Drivers stopped using the app/);
  assert.match(lm, /Renewals often follow peak season/);
  assert.match(fv, /Carrier data stayed patchy/);
  assert.match(fv, /Alerts were not acted on/);
  assert.doesNotMatch(fv, /driver|hub|dispatch|peak season/i);
  assert.match(neutral, /Daily users stopped using the product/);
  assert.doesNotMatch(neutral, /driver|hub|dispatch|Carrier data stayed patchy/i);
  for (const t of [lm, fv, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("vertical SaaS and telecom: reasons about distributors and customer sites appear only for field sales and connectivity companies", async () => {
  const fmcg = await retain("field sales automation and distributor management software for consumer brands", "vertical_saas");
  const vplain = await retain("Brightline", "vertical_saas");
  assert.match(fmcg, /Distributor data stayed out of sync/);
  assert.match(vplain, /People went back to their old way of working/);
  assert.doesNotMatch(vplain, /distributor|reps\b|outlets?|beat plan/i);
  const net = await retain("a managed SD-WAN and network services provider", "telecom");
  const tplain = await retain("Brightline", "telecom");
  assert.match(net, /Repeated outages at the same sites/);
  assert.match(tplain, /Repeated outages of the same services/);
  assert.doesNotMatch(tplain, /Repeated outages at the same sites|Cut-over of sites slipped|Price per site against the national operator|fallback link plan/i);
});

test("with churn reasons typed, the renewal sentence still follows the kind of company", async () => {
  const pay = await retain("a payments API platform that moves money through partner banks", "fintech", { churn_reasons: "price; missing integration" });
  const spend = await retain("a corporate card and expense management platform", "fintech", { churn_reasons: "price; missing integration" });
  assert.match(pay, /bring the record for the period/);
  assert.doesNotMatch(pay, /reconciliation and close results/);
  assert.match(spend, /bring the reconciliation and close results for the period/);
});

test("a product with no kind named is told which kinds have reasons of their own; a named kind is not", async () => {
  const neutral = await retain("Brightline", "fintech");
  assert.match(neutral, /\*For Brightline: the sector lines below fit any company in fintech\. Lines written for one kind of company exist for these kinds: payments and banking APIs; spend and expense\. Say what it sells in the product input to get them\.\*/);
  const named = await retain("a payments API platform that moves money through partner banks", "fintech");
  assert.doesNotMatch(named, /Lines written for one kind of company exist for/);
  const full = await retain("Brightline", "fintech", { churn_reasons: "price; missing integration" });
  assert.match(full, /Lines written for one kind of company exist for/);
});
