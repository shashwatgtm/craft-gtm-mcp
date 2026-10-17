// Run 42B addendum 8 and 9: sub industry notes only when the seller's own words match; a typed phrase is never split on its commas.
// Invented names only. All figures hypothetical.
import test from "node:test";
import assert from "node:assert/strict";
import mcp0 from "../netlify/functions/mcp.mjs";
import { splitPhrases, splitItems, readContext } from "../dist/context.js";

const mcp = mcp0.default || mcp0;
let rid = 500;
async function call(name, args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: rid++, method: "tools/call", params: { name, arguments: args } }) }), {});
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = JSON.parse(t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5)); }
  return (j.result?.content ?? []).map((c) => c.text).join("\n");
}
const DECISION = /cost per case|case review|investment committee|regulator|cases or decisions/i;

test("ai_native with marketing words gets no decision AI lines (launch_commander)", async () => {
  const t = await call("launch_commander", { product_feature: "Acme: an AI content platform with brand voices, style guides and campaign drafts", launch_type: "feature_launch", target_segments: "content marketers, PR and communications teams", goals: "ten deals", your_sector: "ai_native" });
  assert.match(t, /Sector: AI native/);
  assert.doesNotMatch(t, DECISION);
  assert.doesNotMatch(t, /network and platform teams|very large estates/);
});
test("ai_native with marketing words gets no decision AI lines (retention_playbook)", async () => {
  const t = await call("retention_playbook", { customer_segment: "content marketers (customers of Acme)", business_model: "saas", current_churn_rate: "2% monthly (hypothetical)", product: "Acme: an AI content platform with brand voices and style guides", your_sector: "ai_native" });
  assert.doesNotMatch(t, DECISION);
});
test("craft_gtm_analyzer: communications teams are not telecom buyers, and no decision AI measures for a content tool", async () => {
  const plan = "Acme go-to-market plan\nAudience: marketing teams: performance, brand, content, PR and communications and field marketers.\nGoal: a hypothetical pipeline of $100,000 from content marketers.\nMessage: an AI content platform with brand voices and style guides.";
  const t = await call("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan", your_sector: "ai_native" });
  assert.doesNotMatch(t, /in telecom and media/i);
  assert.doesNotMatch(t, DECISION);
});
test("a seller that names case work keeps the decision AI notes", () => {
  const c = readContext({ sector: "ai_native" }, { seller: ["Acme: AI for claims review and case triage"] });
  assert.match(c.v.metrics.join(" "), /cost per case/);
});
test("a seller that names a telecom network provider as the customer's industry still gets the telecom segment note", async () => {
  const t = await call("launch_commander", { product_feature: "Acme: an AI content platform", launch_type: "feature_launch", target_segments: "telecom operators", goals: "ten deals", your_sector: "ai_native" });
  assert.match(t, /network and platform teams/);
});

test("one typed phrase is one alternative, not a comma list (competitive_intel)", async () => {
  const t = await call("competitive_intel", { your_product: "Acme, a design tool", competitors: "design, review and handoff in one place", your_strengths: "fast setup" });
  assert.doesNotMatch(t, /## Against design\n/);
  assert.match(t, /## Against design, review and handoff in one place/);
});
test("a long description with a short tail is one alternative", async () => {
  const t = await call("competitive_intel", { your_product: "Acme, a planning tool", competitors: "the current way of handling alignment is hard across product, design, engineering and business stakeholders", your_strengths: "fast setup" });
  assert.doesNotMatch(t, /## Against design\n/);
  assert.doesNotMatch(t, /## Against engineering and business/);
});
test("two typed alternatives are still two", async () => {
  const t = await call("competitive_intel", { your_product: "Acme, a planning tool", competitors: "manual spreadsheets kept by finance teams, a generic add-on bundled with the ERP", your_strengths: "fast setup" });
  assert.match(t, /## Against manual spreadsheets/);
  assert.match(t, /## Against a generic add-on|## Against generic add-on/i);
});
test("a list of sources with a label stays one strength: G2 and TrustRadius", () => {
  const s = splitPhrases("enterprise security with SSO, regional hosting in the EU and US, and 20,000+ reviews on Capterra, G2 and TrustRadius (page claim)");
  assert.equal(s.length, 3);
  assert.match(s[2], /Capterra, G2 and TrustRadius/);
  assert.ok(!s.some((x) => /^g2 and trustradius/i.test(x)));
});
test("splitPhrases and splitItems keep 'x, y and z in one place' whole", () => {
  assert.deepEqual(splitPhrases("design, review and handoff in one place"), ["design, review and handoff in one place"]);
  assert.deepEqual(splitItems("design, review and handoff in one place"), ["design, review and handoff in one place"]);
  assert.deepEqual(splitItems("slow setup, high price"), ["slow setup", "high price"]);
});
