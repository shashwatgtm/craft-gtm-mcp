// Run 21c job 2 (test first): three leftovers of run 21b.
// 1. partner_architect printed "typically 50-70% discount" for the OEM tier: a benchmark figure with no source (B82). It now says the discount is the user's own and not given.
// 2. The interview questions of the neutral cybersecurity entry asked "which clouds" of every security company (an email or identity security company has none in scope).
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21c-leftovers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  return j.result.content.map((c) => c.text).join("\n");
}

test("partner_architect: the OEM tier carries no discount figure of ours", async () => {
  const t = await call("partner_architect", { company: "Plain Co", product: "a business tool", partner_model: "oem_white_label", partner_goals: "partner-sourced pipeline; no numeric target given", your_deal_size: "$40,000 ACV (hypothetical)", industry: "saas" });
  assert.doesNotMatch(t, /50-70%|typically \d+/i);
  assert.match(t, /your own OEM discount \(not given\)/);
});

test("customer_interview_kit: an email security company is not asked which clouds are in scope; a cloud security company still is", async () => {
  const kit = (product_context, industry, target_persona) => call("customer_interview_kit", { interview_type: "discovery", product_context, industry, target_persona });
  const email = await kit("an email security gateway that stops phishing and business email compromise", "cybersecurity", "CISO");
  const plain = await kit("Brightline, security tools for IT teams", "cybersecurity", "Head of IT");
  const cloud = await kit("a cloud security posture management platform for cloud accounts and containers", "cybersecurity", "CISO");
  assert.doesNotMatch(email, /\bclouds\b/i);
  assert.doesNotMatch(plain, /\bclouds\b/i);
  assert.match(cloud, /cloud/i);
});

test("customer_interview_kit: a statement about the seller marked as a page claim is not turned into a question for the buyer", async () => {
  const t = await call("customer_interview_kit", { interview_type: "discovery", product_context: "a shipment visibility platform for shippers", industry: "logistics_tech", target_persona: "Head of Supply Chain", key_hypotheses: "supply chains break in the gaps between systems; 1,000+ enterprise brands use the platform (page claim)" });
  assert.doesNotMatch(t, /Is this true for you: '1,000\+/);
  assert.match(t, /1,000\+ enterprise brands use the platform/);
  assert.match(t, /Is this true for you: 'supply chains break in the gaps between systems'/);
});

test("customer_interview_kit: the IT leader block does not ask a payments or software buyer about sites and links; a connectivity buyer still gets it", async () => {
  const kit = (product_context, industry, target_persona) => call("customer_interview_kit", { interview_type: "discovery", product_context, industry, target_persona });
  const pay = await kit("a payments platform for online merchants: accept cards, payouts and reconciliation", "fintech", "Head of Technology");
  const net = await kit("managed SD-WAN and business internet for companies with many branches", "telecom", "Head of IT");
  assert.doesNotMatch(pay, /sites, links, applications or vendors/);
  assert.match(net, /sites, links, applications or vendors/);
});
