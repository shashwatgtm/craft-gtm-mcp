// Run 15 R15-32: fixes from the edge-case matrix (evidence/run15/matrix/, triage independent-audit/run15/matrix-triage.md).
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: npm run build, then node --test tests/matrix-fixes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};

test("retention_playbook: the product-team email makes no unbracketed claim that the feedback was shared", async () => {
  const r = await call("retention_playbook", { customer_segment: "SMB accounts", business_model: "saas_subscription", current_churn_rate: "4% monthly", churn_reasons: "missing feature" });
  assert.doesNotMatch(r.text, /(^|[^:] )I've shared your use case with our product team\./m);
  if (/shared your use case/.test(r.text)) assert.match(r.text, /\[Only if true and provable: I've shared your use case with our product team\.\]/);
});

test("pmf_scorecard: no empty 'Additional Metrics Detected' table when no extra metric is found", async () => {
  const r = await call("pmf_scorecard", { product: "ExampleCo Scheduler", target_market: "smb_saas", current_metrics: "Our buyers are operations leaders at mid-size clinic groups." });
  if (/## Additional Metrics Detected/.test(r.text)) {
    const sec = r.text.split("## Additional Metrics Detected")[1].split("\n---")[0];
    assert.doesNotMatch(sec, /\|--------\|-------\|-------\|\s*$/);
  }
});
