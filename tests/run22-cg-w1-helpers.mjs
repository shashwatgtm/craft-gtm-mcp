// Run 22 writer cg-w1: shared helpers of the rewrite tests of competitive_intel, partner_architect and craft_gtm_analyzer.
// Not a test file itself (no .test in the name). Real company names are never written here; the pool scenarios (private repo only) are read
// at run time from the project work folder when it exists, and those tests are skipped when it does not.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
export const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
export const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
export const text = async (name, args) => { const r = await call(name, args); assert.equal(r.isError, false, r.text.slice(0, 200)); return r.text; };

// ---- the generic quality checks of the rewrite brief (run 22) ----
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9% ]+/g, " ").replace(/\s+/g, " ").trim();
/** sentences and lines of an answer, for the repeated sentence check (code fences and table rules are skipped) */
export function sentencesOf(out) {
  const res = [];
  for (const line of out.split("\n")) {
    const l = line.trim();
    if (!l || /^[|\-:\s]+$/.test(l) || l.startsWith("```")) continue;
    for (const s of l.replace(/^[-*>#\d.)\s]+/, "").split(/(?<=[.!?])\s+(?=[A-Z"])/)) res.push(s);
  }
  return res;
}
export function repeatedSentences(out, minLen = 45) {
  const seen = new Map(); const dup = [];
  for (const s of sentencesOf(out)) {
    const n = norm(s);
    if (n.length < minLen) continue;
    if (seen.has(n)) dup.push(s); else seen.set(n, true);
  }
  return dup;
}
const BAD = [
  [/\[(?:Your|Insert|Company|Name|Competitor|X|Product|Role|Date|Owner)[^\]]*\]/i, "bracket prompt"],
  [/\{\{|\bundefined\b|\bNaN\b|\[object Object\]|\bLorem\b|\bTBD\b/, "template residue"],
  [/\(\s*\)|\[\s*\]|""/, "empty brackets or quotes"],
  [/\|\s*\|\s*\|/, "empty table cells"],
  [/^\s*[-*]\s*$/m, "empty bullet"],
  [/\bnot known yet\b|\bNot specified\b|\bnone of your competitor details\b|\bfill the empty cells\b/i, "scaffold filler"],
  [/\.\.\./, "cut text (three dots)"],
  [/\b(?:clinics?|patients?|hospitals?|healthcare|hipaa|ehr|dental|physio\w*)\b/i, "healthcare word"],
];
/** throws when the answer has a placeholder, a cut, a repeated sentence or a second "To sharpen this" */
export function assertClean(out, label = "", { allow = [] } = {}) {
  for (const [re, name] of BAD) {
    if (allow.includes(name)) continue;
    const m = out.match(re);
    assert.ok(!m, `${label}: ${name}: "${m && out.slice(Math.max(0, m.index - 60), m.index + 80).replace(/\n/g, " ")}"`);
  }
  const dup = repeatedSentences(out);
  assert.deepEqual(dup, [], `${label}: repeated sentence(s): ${JSON.stringify(dup.slice(0, 3))}`);
  assert.ok((out.match(/To sharpen this, give:/g) || []).length <= 1, `${label}: "To sharpen this" more than once`);
}
/** the closing block, if any, must be the last section of the answer */
export function closingOf(out) {
  const i = out.indexOf("To sharpen this, give:");
  return i < 0 ? "" : out.slice(i);
}
/** an input phrase is used when most of its words of 4 letters or more appear in the answer (any case) */
export function usesInput(out, phrase, share = 0.8) {
  const o = norm(out);
  const words = [...new Set(norm(phrase).split(" ").filter((w) => w.length >= 4))];
  if (!words.length) return o.includes(norm(phrase));
  const hit = words.filter((w) => o.includes(w)).length;
  return hit / words.length >= share;
}
export function assertUses(out, phrases, label = "") {
  const missing = phrases.filter((p) => !usesInput(out, p));
  assert.deepEqual(missing, [], `${label}: inputs not used in the answer`);
}
export const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;

// ---- the pool scenarios (private work folder) ----
const WORK = process.env.HELIX_WORK || "/home/user/directory-submission-work/work";
export const POOL_OK = existsSync(`${WORK}/run20/eval/builders20.mjs`) && existsSync(`${WORK}/run22/eval/pool2.mjs`);
let builders = null; let scenarios = null; let schemas = null;
async function load() {
  if (builders) return;
  const mod = await import(`${WORK}/run20/eval/builders20.mjs`);
  builders = mod.BUILD20["craft-gtm"];
  scenarios = {};
  for (const [file, key] of [["run20/eval/tuning20.mjs", "TUNING20"], ["run20/eval/holdout-check20.mjs", "HOLDOUT_CHECK20"], ["run21/eval/pool.mjs", "POOL21"], ["run22/eval/pool2.mjs", "POOL22"]]) {
    for (const s of (await import(`${WORK}/${file}`))[key]) scenarios[s.id] = s;
  }
  const tl = await rpc("tools/list", {});
  schemas = Object.fromEntries(tl.result.tools.map((t) => [t.name, t.inputSchema]));
}
/** the arguments the run 20 builder makes for a pool scenario (T6 to T9, H1 to H9, P1 to P9, Q1 to Q18; never T1 to T5) */
export async function poolArgs(tool, id) {
  assert.ok(!/^T[1-5]$/.test(id), "T1 to T5 are never used");
  await load();
  return builders[tool](scenarios[id], 0, schemas[tool]);
}
