// Run 21c round 3 (test first): launch_commander read the first comma segment of a plain sentence as the product name, so a key message said
// Show Banking how "Meshlink connects branch offices" deals with ... (a clause fragment in quotes). The name now ends before the first verb or joining word.
// Run: npm run build && node --no-warnings --test tests/run21c-plain-name.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const base = { launch_type: "feature_launch", launch_date: "Q1 2027", target_segments: "Retail, Banking", goals: "a hypothetical pipeline of $1,000,000" };

test("a product written as a sentence is named by its noun phrase, not a clause fragment", async () => {
  const out = await call("launch_commander", { ...base, product_feature: "Meshlink connects branch offices, cloud apps and sensors: managed SD-WAN, secure access and sensor connectivity" });
  assert.doesNotMatch(out, /"Meshlink connects/);
  assert.match(out, /"Meshlink"/);
});

test("a named product keeps its name", async () => {
  const out = await call("launch_commander", { ...base, product_feature: "Lanehop, a route planning platform for delivery fleets: live re-planning and a driver app" });
  assert.match(out, /Lanehop/);
  assert.doesNotMatch(out, /"Lanehop, a/);
});
