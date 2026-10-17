// Run 42B: a "buyers your plan aims at are in <industry>" paragraph needs two of that industry's own words in the buyer lines; the owner as buyer is said plainly.
import test from "node:test";
import assert from "node:assert/strict";
import { generateCRAFTAnalyzer } from "../dist/craft-analyzer.js";

const run = (aud, buyer, sector) => generateCRAFTAnalyzer({ document_content: `Acme go-to-market plan for next quarter. All figures hypothetical.\nGoal: build a hypothetical pipeline of $24,000 from lawn care.\nAudience: ${aud}\nBuyer roles: ${buyer}\nMessage: Acme saves hours of paperwork and scheduling.`, document_type: "quarterly_plan", ...(sector ? { your_sector: sector } : {}) });
const FOREIGN = /buyers your plan aims at are in (?:telecom|media|games|financial|public|manufacturing|education|construction|consumer|retail)/i;

test("a home services plan gets no telecom paragraph and names the owner as the customer's role", () => {
  const out = run("owner-led home service and field service businesses, from solo operators to crews of 15 or more, in over 50 industries.", "business owners, office schedulers, field crews.", "vertical_saas");
  assert.doesNotMatch(out, FOREIGN);
  assert.doesNotMatch(out, /telecom and media/i);
  assert.doesNotMatch(out, /No role in your plan matches/);
  assert.match(out, /names "business owners, office schedulers, field crews" as the buyer/);
});
test("a logistics plan with fleet operators and live network words gets no foreign buyer industry", () => {
  const out = run("fleet operators and live delivery network managers across the field.", "dispatch heads, depot managers.");
  assert.doesNotMatch(out, FOREIGN);
});
test("a fintech seller whose buyers are retailers is not told its buyers are in financial services", () => {
  const out = run("online retailers and merchants, payment technology for checkout.", "founders, heads of operations.");
  assert.doesNotMatch(out, /buyers your plan aims at are in financial services/);
});
test("a plan whose buyer lines name the industry with two of its words still gets the paragraph", () => {
  const out = run("telecom operators and communications service providers.", "network heads, IT security leads.", "vertical_saas");
  assert.match(out, /buyers your plan aims at are in telecom and media/);
});
