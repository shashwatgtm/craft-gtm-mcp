// Host review, 29 October 2026: a high PMF score is not called proof, discovery questions do not assume the problem, and a plan pasted
// as one paragraph with inline labels is read in its labelled parts. Synthetic inputs only.
// Run: npm run build, then node --no-warnings --test tests/host-review-20261029.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};

const pmf = (metrics) => call("pmf_scorecard", { product: "Northwind CRM, synthetic review scenario only", target_market: "smb_saas", current_metrics: metrics, business_model: "saas" });

test("pmf_scorecard: a strong score is a rule score, not proof, and with a dimension missing it does not advise scaling", async () => {
  const t = await pmf("Synthetic figures only: monthly churn 3%; NPS 45; CAC $500; LTV $3000; retention 92%");
  assert.match(t, /\*\*Strong PMF\*\*/);
  assert.match(t, /It is a rule score from the figures you supplied, not proof of product-market fit\./);
  assert.match(t, /Fill the missing data below before treating this as a reason to scale\./);
  assert.doesNotMatch(t, /Focus on scaling|indicate solid product-market fit/);
});

test("pmf_scorecard: with every dimension scored, a strong score still asks for a check before scaling", async () => {
  const t = await pmf("Synthetic figures only: monthly churn 2%; NPS 65; CAC $500; LTV $3000; retention 95%; activation 75%");
  assert.match(t, /Check them against your own history and customer evidence before you scale\./);
});

test("customer_interview_kit: discovery questions and the hypothesis table do not assume the problem", async () => {
  const t = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Synthetic research exercise about Northwind CRM administration", target_persona: "Revenue operations director", key_hypotheses: "Manual data entry delays pipeline reporting." });
  assert.doesNotMatch(t, /last time you hit this problem|Confirm it is true|How are you solving this problem today|on your team's list/);
  assert.match(t, /What, if anything, slowed it down or went wrong\?/);
  const table = t.split('### Hypothesis 1')[1].split('\n\n---')[0];
  const rows = table.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| To Validate'));
  assert.match(rows[0], /^\| Open without the hypothesis \|/);
  assert.match(rows[1], /Some teams say: 'Manual data entry delays pipeline reporting'\. How close is that to your experience, if at all\?/);
  assert.match(rows[3], /only if they confirm it/);
});

const PLAN = "Synthetic Northwind planning exercise. Target: revenue operations directors at firms with 200 to 1000 employees. Outcome: 20 discovery meetings. Owner: marketing director. Timeline: 1 January to 31 March 2027. Budget: USD 15000. Channels: customer webinars and partner referrals. Review progress weekly.";

test("craft_gtm_analyzer: a one-paragraph plan is read in its labelled parts", async () => {
  const t = await call("craft_gtm_analyzer", { document_content: PLAN, document_type: "quarterly_plan", intended_audience: "CMO" });
  const result = t.split("### R: RESULT")[1].split("### A:")[0];
  assert.match(result, /"20 discovery meetings"/);
  assert.match(result, /> Outcome: 20 discovery meetings\./);
  assert.doesNotMatch(result, /Not found:\*\* a target with a number/);
  assert.doesNotMatch(result, /Target: revenue operations/);
  const frame = t.split("### F: FRAME")[1].split("### T:")[0];
  assert.match(frame, /> Target: revenue operations directors at firms with 200 to 1000 employees\./);
  assert.doesNotMatch(frame, /Not found:\*\*[^\n]*an audience, persona or segment/);
  assert.match(t.split("### A: ARTIFACT")[1].split("### F:")[0], /"webinars"/);
  assert.doesNotMatch(t, /The plan has no labelled lines/);
  assert.match(t, /Counted toward Frame only, because they describe your customers and market: "Target"\./);
  assert.doesNotMatch(t, /The goal is not traced to activity/);
});

test("craft_gtm_analyzer: a Target line with a number is still a goal", async () => {
  const t = await call("craft_gtm_analyzer", { document_content: "Owner: sales director.\nTarget: 40 qualified meetings by 31 March 2027.", document_type: "quarterly_plan" });
  const result = t.split("### R: RESULT")[1].split("### A:")[0];
  assert.match(result, /"40 qualified meetings"/);
});
