// Run 21b step 2 (test first): stock text of crisis_planner. The crisis, outage and exposure lines of a sector were written for one kind of
// company (dispatch with vehicles on the road, postings to a ledger, orders to distributors, links at customer sites). Now the neutral entry
// of each vertical holds lines true for every company in it, and the lines of one kind sit under its sub-type (src/sector-playbooks.ts).
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21-stock-crisis_planner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function plan(company, industry, extra = {}) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "crisis_planner", arguments: { company, industry, customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", ...extra } } }),
  }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  return j.result.content.map((c) => c.text).join("\n");
}
const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

test("fintech: a card and expense company gets the posting crisis, a payments platform gets its own, a company with no kind named gets neither", async () => {
  const spend = await plan("a corporate card and expense management company", "fintech", { data_sensitivity: "high_pii_financial" });
  const pay = await plan("a payments API platform that moves money through partner banks", "fintech", { data_sensitivity: "high_pii_financial" });
  const neutral = await plan("Brightline Group", "fintech", { data_sensitivity: "high_pii_financial" });
  assert.match(spend, /### Wrong postings, payments or reconciliation errors/);
  assert.match(spend, /Prepare the corrected entries/);
  assert.match(spend, /an outage stops approvals, card or payment processing or ERP posting/);
  assert.match(spend, /Finance operations lead/);
  assert.match(pay, /### Failed, duplicated or delayed payments/);
  assert.match(pay, /an outage stops payments, payouts or account data calls/);
  assert.doesNotMatch(pay, /corrected entries|month-end|ledger|ERP posting|Finance operations lead/i);
  assert.match(neutral, /### Wrong transactions or records reaching customers/);
  assert.doesNotMatch(neutral, /month-end|ledger|ERP posting|corrected entries|Finance operations lead|### Failed, duplicated or delayed payments/i);
  for (const t of [spend, pay, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("logistics tech: last mile delivery gets dispatch with vehicles on the road, freight visibility gets tracking data, a plain logistics company gets neither", async () => {
  const lm = await plan("a last mile delivery company with courier fleets", "logistics_tech");
  const fv = await plan("a freight visibility company with shipment tracking across carriers", "logistics_tech");
  const neutral = await plan("Brightline Group", "logistics_tech");
  assert.match(lm, /### Dispatch or routing outage with vehicles on the road/);
  assert.match(lm, /Driver app support lead/);
  assert.match(fv, /### Tracking data stops or goes wrong while shipments are moving/);
  assert.match(fv, /Mark each shipment's status as of the last good update/);
  assert.doesNotMatch(fv, /driver|hub manager|dispatch|vehicles/i);
  assert.match(neutral, /### Planning or tracking outage while shipments are moving/);
  assert.doesNotMatch(neutral, /driver|hub|dispatch|vehicles|Tracking data stops or goes wrong/i);
  for (const t of [lm, fv, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("telecom: a connectivity provider gets the outage at customer sites, a messaging platform gets delayed or lost messages, a plain telecom company gets a service outage", async () => {
  const net = await plan("a managed SD-WAN and network services provider", "telecom");
  const msg = await plan("a business messaging API platform", "telecom");
  const neutral = await plan("Brightline Group", "telecom");
  assert.match(net, /### Network outage across customer sites/);
  assert.match(net, /Customer network owners and CIOs/);
  assert.match(net, /a link or core network failure takes sites offline/);
  assert.match(msg, /### Messages delayed, lost or sent twice/);
  assert.match(msg, /one time codes, alerts and notices fail/);
  assert.doesNotMatch(msg, /sites|field engineer|backup path|Network operations centre lead/i);
  assert.match(neutral, /### Service outage across several customers/);
  assert.doesNotMatch(neutral, /Network outage across customer sites|Customer network owners and CIOs|takes sites offline|Messages delayed|Network operations centre lead|Field engineering lead/i);
  for (const t of [net, msg, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("vertical SaaS: a field sales and distributor company gets the distributor sync crisis, a plain one gets a neutral sync failure", async () => {
  const fmcg = await plan("field sales automation and distributor management software for consumer brands", "vertical_saas");
  const neutral = await plan("Brightline Group", "vertical_saas");
  assert.match(fmcg, /### Order or distributor data sync failure/);
  assert.match(fmcg, /Distributor integrations lead/);
  assert.match(neutral, /### Data sync or integration failure/);
  assert.doesNotMatch(neutral, /distributor|orders|reps\b|outlets?|beat plan|Distributor integrations lead/i);
});

test("ITeS and AI native: no service desk or offshore wording for a customer experience outsourcing firm, and an AI wrong action does not assume money moves", async () => {
  const bpo = await plan("a customer experience outsourcing company", "ites");
  assert.doesNotMatch(bpo, /service desk|offshore/i);
  const ai = await plan("Brightline Group", "ai_native", { potential_crises: "ai_wrong_action" });
  assert.match(ai, /### AI wrong action/);
  assert.doesNotMatch(ai, /moves money/i);
});

test("a company with no kind named is told which kinds have steps of their own and where to say it; a named kind is not", async () => {
  const neutral = await plan("Brightline Group", "logistics_tech");
  assert.match(neutral, /\*For Brightline Group: the sector lines below fit any company in logistics tech\. Lines written for one kind of company exist for these kinds: freight visibility; last mile delivery\. Say what it sells in the company input to get them\.\*/);
  const named = await plan("a freight visibility company with shipment tracking across carriers", "logistics_tech");
  assert.doesNotMatch(named, /Lines written for one kind of company exist for/);
  const none = await plan("Brightline Group", "saas");
  assert.doesNotMatch(none, /Lines written for one kind of company exist for/);
});
