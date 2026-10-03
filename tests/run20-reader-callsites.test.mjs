// Run 20 round 1 (quality), step 1: the eight tools read the sector with the grouped reader (seller first, then deal text, job titles, buyer).
// Invented companies only (Lanehop, Branchwire, Vaultline). Run: npm run build && node --test tests/run20-reader-callsites.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const body = await r.text();
  const json = body.startsWith("event:") || body.includes("\ndata:") ? JSON.parse(body.split("\n").find((l) => l.startsWith("data:")).slice(5)) : JSON.parse(body);
  return json.result.content[0].text;
}
const sectorLine = (t) => (t.match(/\*Sector: ([^.]*)\./) || [])[1] || "";

test("launch_commander: a managed SD-WAN product sold to banks is read as telecom (the seller's words), not fintech (the buyer's)", async () => {
  const t = await call("launch_commander", { product_feature: "Branchwire managed SD-WAN over MPLS and broadband", launch_type: "feature_launch", target_segments: "Banking and financial services, Manufacturing", goals: "ten hypothetical deals" });
  assert.match(sectorLine(t), /telecom/);
});
test("launch_commander: a brand name only, with a CISO in the goals and banks as segments, is read from the deal text and the job title before the buyer industry", async () => {
  const t = await call("launch_commander", { product_feature: "Vaultline", launch_type: "feature_launch", target_segments: "Fintech and lending", goals: "meetings with the CISO about attack surface and cloud security exposure" });
  assert.match(sectorLine(t), /cybersecurity/);
});
test("customer_interview_kit: the persona's title names the sector when the product text does not", async () => {
  const t = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Lanehop", target_persona: "Head of last-mile operations" });
  assert.match(sectorLine(t), /logistics tech/);
});
test("competitive_intel: your_strengths are read as the seller's words", async () => {
  const t = await call("competitive_intel", { your_product: "Lanehop", competitors: "manual spreadsheets", your_strengths: "route planning that re-plans when orders change" });
  assert.match(sectorLine(t), /logistics tech/);
});
test("craft_gtm_analyzer: a broad industry choice (saas) does not hide a trade the plan names", async () => {
  const plan = "Plan for Vaultline. Owner: head of marketing. Goal: cloud security posture management for CISOs, Q1 2027.";
  const t = await call("craft_gtm_analyzer", { document_content: plan, document_type: "gtm_strategy", industry: "saas" });
  assert.doesNotMatch(sectorLine(t), /^$/);
});
