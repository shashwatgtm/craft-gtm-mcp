// Run 21b step 2 (test first): stock text of customer_interview_kit. The sector's deeper questions were written for one kind of company
// (drivers and hub staff, approvals checked by hand at close, links at customer sites). The neutral entry of each vertical now holds questions
// true for every company in it, and the questions of one kind sit under its sub-type (src/sector-playbooks.ts).
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21-stock-customer_interview_kit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function kit(product_context, industry, target_persona, extra = {}) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "customer_interview_kit", arguments: { interview_type: "discovery", product_context, industry, target_persona, ...extra } } }),
  }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  return j.result.content.map((c) => c.text).join("\n");
}
const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

test("logistics tech: last mile delivery is asked about drivers and hubs, freight visibility about carrier status, a plain logistics company about neither", async () => {
  const lm = await kit("a last mile delivery platform for courier fleets", "logistics_tech", "Head of Last-mile");
  const fv = await kit("a freight visibility platform with shipment tracking across carriers", "logistics_tech", "Head of Supply Chain");
  const neutral = await kit("Brightline, tools for logistics teams", "logistics_tech", "Head of Logistics");
  assert.match(lm, /How do drivers and hub staff get their plan for the day/);
  assert.match(fv, /What happens to a shipment record when a carrier changes its status code or goes silent\?/);
  assert.doesNotMatch(fv, /drivers and hub staff|failed deliveries recorded/i);
  assert.match(neutral, /How is an exception recorded today/);
  assert.doesNotMatch(neutral, /drivers and hub staff|failed deliveries recorded|status code or goes silent/i);
  for (const t of [lm, fv, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("fintech: a card and expense company is asked about approvals checked by hand, a payments platform about a payment sent twice, a plain one about neither", async () => {
  const spend = await kit("a corporate card and expense management platform", "fintech", "CFO");
  const pay = await kit("a payments API platform that moves money through partner banks", "fintech", "Head of Payments");
  const neutral = await kit("Brightline, tools for regulated finance teams", "fintech", "Head of Product");
  assert.match(spend, /Which approvals or policy checks are done by hand today, and who signs them\?/);
  assert.match(pay, /What happens to a payment that is sent twice, or sent and never confirmed\?/);
  assert.doesNotMatch(pay, /approvals or policy checks|at close, or at audit/i);
  assert.doesNotMatch(neutral, /approvals or policy checks|sent twice|at close, or at audit/i);
  assert.match(neutral, /How are exceptions found today/);
  for (const t of [spend, pay, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("telecom and vertical SaaS: sites and links, beat plans and distributors come only with the kinds of company they were written for", async () => {
  const net = await kit("a managed SD-WAN and network services provider", "telecom", "Head of IT Infrastructure");
  const msg = await kit("a business messaging API platform", "telecom", "Head of Product");
  assert.match(net, /Which sites cost the most when they go down, and how do you know\?/);
  assert.doesNotMatch(msg, /Which sites cost the most when they go down|Which sites have a second link/);
  assert.match(msg, /Who decides which route or provider carries each kind of message/);
  const fmcg = await kit("field sales automation and distributor management software for consumer brands", "vertical_saas", "National Sales Head");
  const plain = await kit("Brightline, tools for operations teams", "vertical_saas", "Head of Operations");
  assert.match(fmcg, /How does a rep decide which outlets to visit/);
  assert.doesNotMatch(plain, /rep decide which outlets|distributors receive and confirm orders|order captured in an outlet/i);
  assert.match(plain, /What happens to work in progress when the system or the network is not available\?/);
});

test("a product with no kind named is told which kinds have questions of their own; a named kind is not", async () => {
  const neutral = await kit("Brightline, tools for operations teams", "vertical_saas", "Head of Operations");
  assert.match(neutral, /Lines written for one kind of company exist for these kinds: FMCG retail execution\. Say what it sells in the product_context input to get them\./);
  const named = await kit("field sales automation and distributor management software for consumer brands", "vertical_saas", "National Sales Head");
  assert.doesNotMatch(named, /Lines written for one kind of company exist for/);
});
