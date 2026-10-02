// Run 18 R18-26 (P05-WS-01, owner decision D68): craft_gtm_analyzer measures the document the user meant, not the padding around it.
// Leading and trailing whitespace of document_content must not change the length, the words estimate, the excerpt or any score line.
// Interior whitespace (double spaces, newlines, CRLF) is kept exactly. Tested in-process through netlify/functions/mcp.mjs (no network).
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
const analyze = (document_content) => call("craft_gtm_analyzer", { document_content, document_type: "gtm_strategy" });

const DOC = "Q3 GTM plan for Shelfwalk. Target: mid-market SaaS finance teams. Channel: outbound plus webinars. Budget 40k. Goal: 30 SQLs per month by September. Owner: VP Marketing.";
const LONG = (DOC + " ").repeat(5).trim();
const PADS = {
  "trailing space": ["", "   "],
  "trailing newline": ["", "\n"],
  "trailing CRLF": ["", "\r\n"],
  "trailing tab": ["", "\t"],
  "leading space": ["   ", ""],
  "leading newline": ["\n", ""],
  "leading CRLF": ["\r\n", ""],
  "leading and trailing blank lines": ["\n\n\n", "\n\n\n"],
  "mixed padding": [" \r\n\t ", "\t \r\n\n  "],
};

for (const [label, [pre, post]] of Object.entries(PADS)) {
  for (const [dlabel, doc] of [["short", DOC], ["long (over 500 characters)", LONG]]) {
    test(`craft_gtm_analyzer: ${label} gives the same answer as the unpadded ${dlabel} document`, async () => {
      const plain = await analyze(doc);
      const padded = await analyze(pre + doc + post);
      assert.equal(plain.isError, false);
      assert.equal(padded.isError, false);
      assert.match(plain.text, new RegExp(`\\*\\*Document Length:\\*\\* ${doc.length} characters`));
      assert.equal(padded.text, plain.text);
    });
  }
}

test("craft_gtm_analyzer: Document Length, Words estimate and every score line are the same with padding", async () => {
  const plain = (await analyze(DOC)).text.split("\n");
  const padded = (await analyze("\n  " + DOC + "  \r\n\n")).text.split("\n");
  const pick = (ls) => ls.filter((l) => /Document Length|Words \(estimate\)|[Ss]core|\/10|Overall|\d+%/.test(l));
  assert.ok(pick(plain).length >= 6, "score lines found");
  assert.deepEqual(pick(padded), pick(plain));
});

test("craft_gtm_analyzer: interior double spaces and interior newlines are kept exactly (excerpt and length)", async () => {
  const doc = "Goal:  30 SQLs per month.\n\nChannel:  outbound\nplus webinars.\r\nOwner: VP Marketing.";
  const r = await analyze("  \n" + doc + "\n  ");
  assert.ok(r.text.includes("```\n" + doc + "\n```"), "excerpt holds the document with its interior whitespace");
  assert.match(r.text, new RegExp(`\\*\\*Document Length:\\*\\* ${doc.length} characters`));
  assert.match(r.text, new RegExp(`~${Math.round(doc.length / 5)}, from the character count`));
});

test("craft_gtm_analyzer: a document that is only whitespace is still refused as missing", async () => {
  const r = await analyze(" \n\t ");
  assert.equal(r.isError, true);
  assert.match(r.text, /Missing required input for craft_gtm_analyzer: document_content/);
});
