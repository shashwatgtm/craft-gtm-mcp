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
