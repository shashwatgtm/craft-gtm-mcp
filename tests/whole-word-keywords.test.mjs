// Run 16 R16-13 (D46): craft_gtm_analyzer matches keywords as whole words, and each distinct word is counted and listed once per area.
// The inputs are the run 15 matrix cases O3 (mytest, minimal, emptyopt, longtext) plus inputs where the whole word is present.
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: npm run build, then node --test tests/whole-word-keywords.test.mjs
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

// The score and the "Words matched" list of one area, read from the answer text.
const area = (text, title) => {
  const block = text.split(`### ${title}`)[1].split("\n---")[0];
  const score = Number(block.match(/\*\*Score: (\d+)\/10\*\*/)[1]);
  const list = block.split("**Words matched:**\n")[1].split("\n\n")[0].split("\n");
  const words = list[0] === "- None" ? [] : list.map((l) => l.replace(/^- "(.*)"$/, "$1"));
  return { score, words };
};

const PLAN = "Q1 plan: grow pipeline 30% by launching two webinars and an outbound sequence to mid-market finance leaders. Owner: marketing lead. Budget: $20K. Success metric: 40 qualified opportunities.";
for (const [name, extra] of [["mytest", {}], ["minimal", {}], ["emptyopt", { intended_audience: "", desired_outcome: "" }]]) {
  test(`craft_gtm_analyzer ${name}: "market" and "marketing" are not Timeline words, and "Owner" is listed once`, async () => {
    const r = await call("craft_gtm_analyzer", { document_content: PLAN, document_type: "quarterly_plan", ...extra });
    assert.equal(r.isError, false);
    const t = area(r.text, "T: TIMELINE");
    assert.deepEqual(t.words, ["Q1", "by", "plan"]);
    assert.equal(t.score, 10);
    const c = area(r.text, "C: CHARACTER");
    assert.deepEqual(c.words, ["marketing lead", "Owner", "lead"]);
    assert.equal(c.score, 10);
  });
}

test("craft_gtm_analyzer longtext: a repeated word is counted and listed once", async () => {
  const sentence = "Our buyers are operations leaders at mid-size clinic groups who lose revenue to missed appointments and manual rescheduling. They have tried reminder tools before, but the front desk still spends hours on the phone every week. ";
  const r = await call("craft_gtm_analyzer", { document_content: sentence.repeat(100).slice(0, 3990), document_type: "quarterly_plan" });
  assert.equal(r.isError, false);
  const t = area(r.text, "T: TIMELINE");
  assert.deepEqual(t.words, ["week"]);
  assert.equal(t.score, 6);
});

test("craft_gtm_analyzer: parts of longer words do not count", async () => {
  const r = await call("craft_gtm_analyzer", { document_content: "Weekly planning of the marketplace decision, yearly reviews and daytime calls for enterprises.", document_type: "campaign_brief" });
  const t = area(r.text, "T: TIMELINE");
  assert.deepEqual(t.words, []);
  assert.equal(t.score, 0);
  const f = area(r.text, "F: FRAME");
  assert.deepEqual(f.words, []);
  assert.equal(f.score, 0);
});

test("craft_gtm_analyzer: whole words still count, in any letter case, each once", async () => {
  const r = await call("craft_gtm_analyzer", { document_content: "Timeline: the plan starts in March and runs one Week per phase. Every week the owner reviews it. Plan B is for enterprise buyers.", document_type: "campaign_brief" });
  const t = area(r.text, "T: TIMELINE");
  assert.deepEqual(t.words, ["Week", "phase", "March", "Timeline", "plan"]);
  assert.equal(t.score, 10);
  const f = area(r.text, "F: FRAME");
  assert.deepEqual(f.words, ["for enterprise"]);
  assert.equal(f.score, 5);
});

test("craft_gtm_analyzer: full and short month names still count as whole words", async () => {
  const r = await call("craft_gtm_analyzer", { document_content: "Deadline: 15 January. Review in Sept 2026 and again in Dec.", document_type: "campaign_brief" });
  const t = area(r.text, "T: TIMELINE");
  assert.deepEqual(t.words, ["Deadline", "January", "Sept 2026", "Dec"]);
  assert.equal(t.score, 10);
});
