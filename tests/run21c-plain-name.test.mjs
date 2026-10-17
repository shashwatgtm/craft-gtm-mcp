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
  assert.doesNotMatch(out, /Meshlink connects branch offices, cloud apps and sensors is launched|# Launch plan: Meshlink connects/);
  assert.match(out, /# Launch plan: Meshlink\n/);
  assert.match(out, /Meshlink is launched as a feature launch/);
});

test("a named product keeps its name", async () => {
  const out = await call("launch_commander", { ...base, product_feature: "Lanehop, a route planning platform for delivery fleets: live re-planning and a driver app" });
  assert.match(out, /Lanehop/);
  assert.doesNotMatch(out, /Lanehop, a route planning platform for delivery fleets is launched/);
  assert.match(out, /# Launch plan: Lanehop\n/);
});

// Run 21c round 3 (test first, found by the E11 name cut at a clause check): the Quick Reference Card of competitive_intel cut a plain description at 40 characters
// ("Quick guide: Billing and monetization platform for... against the competition").
test("competitive_intel names a plain description by its noun phrase", async () => {
  const out = await call("competitive_intel", { your_product: "Freight visibility platform for shippers that tracks every load across carriers and modes", competitors: "legacy tracking portals with weekly manual updates, spreadsheets kept by each planner", your_strengths: "one view of every load across carriers and modes (page claim)", competitor_details: "a portal built for one carrier shows only that carrier" });
  assert.doesNotMatch(out, /\.\.\./);
  assert.match(out, /^# Battle cards: Freight visibility platform\n/);
});
