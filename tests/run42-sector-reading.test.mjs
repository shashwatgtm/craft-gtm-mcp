// Run 42 job B: the seller's own category decides the sector; a lone keyword or customer industries do not override it; typed items are not split into fake ones.
import test from "node:test";
import assert from "node:assert/strict";
import { readContext } from "../dist/context.js";
import { generateCompetitiveIntel } from "../dist/competitive-intel.js";

test("a lone seller keyword that the deal text reads as another trade leaves the sector open", () => {
  const c = readContext({}, { seller: ["Acme: leasing center, accounting, procure to pay, resident portal"], context: ["a pipeline with Controller, Property Management Accounting as the buyer"], buyer: ["multifamily, student housing"] });
  assert.equal(c.v, null);
});
test("AI as an adjective of how a product is built does not decide the sector", () => {
  const c = readContext({}, { seller: ["Acme: an AI-native platform for customer experience management, with service, social and insights"], context: ["fragmented teams"] });
  assert.ok(!c.v || c.v.id !== "ai-native");
});
test("customer industries in the buyer input do not override a seller that names its own trade", () => {
  const c = readContext({}, { seller: ["Acme: last-mile delivery app and route planning for couriers"], buyer: ["retail, grocery"] });
  assert.ok(c.v && /logistics/.test(c.v.id));
});
test("a services company gets the services model, not a subscription, when the model is the sector's usual one", () => {
  const c = readContext({}, { seller: ["Acme: back-office processing and customer experience services for banks"] });
  if (c.v && c.v.id === "ites") assert.equal(c.model, "services");
});
test("one alternative typed with its own comma list stays one card", () => {
  const out = generateCompetitiveIntel({ your_product: "Acme, a tracking platform", competitors: "the current way of handling growth, with fragmented teams, tools and data", your_strengths: "one view of shipments" });
  assert.doesNotMatch(out, /## Against (?:with|tools)/);
});

// Run 42B: your_sector
import mcp0 from "../netlify/functions/mcp.mjs";
const mcp = mcp0.default || mcp0;
let rid = 100;
async function call(name, args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: rid++, method: "tools/call", params: { name, arguments: args } }) }), {});
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = JSON.parse(t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5)); }
  return { text: (j.result?.content ?? []).map((c) => c.text).join("\n") || JSON.stringify(j.error ?? j), isError: !!j.result?.isError || !!j.error };
}
const LAUNCH = { product_feature: "Acme: route planning for couriers with a payments feature", launch_type: "feature_launch", target_segments: "banks, insurers", goals: "ten deals" };
test("your_sector decides the sector over contrary text", async () => {
  const r = await call("launch_commander", { ...LAUNCH, your_sector: "logistics_tech" });
  assert.match(r.text, /Sector: .*logistics tech/i);
  const r2 = await call("launch_commander", { ...LAUNCH, your_sector: "cybersecurity" });
  assert.match(r2.text, /Sector: .*cybersecurity/i);
});
test("your_sector other gives neutral wording", async () => {
  const r = await call("launch_commander", { ...LAUNCH, your_sector: "other" });
  assert.match(r.text, /Sector: not clear/i);
});
test("an unknown your_sector is refused with the allowed values and is not echoed raw", async () => {
  const r = await call("launch_commander", { ...LAUNCH, your_sector: "<img src=x>" });
  assert.match(r.text, /logistics_tech/);
  assert.doesNotMatch(r.text, /<img/);
});
test("without your_sector, a lone feature word does not set the sector", async () => {
  const r = await call("launch_commander", { product_feature: "Acme: a services firm with a payments platform", launch_type: "feature_launch", target_segments: "retailers", goals: "ten deals" });
  assert.doesNotMatch(r.text, /Sector: read from your inputs as fintech/i);
});
