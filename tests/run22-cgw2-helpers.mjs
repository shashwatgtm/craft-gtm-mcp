// Run 22 (writer cg-w2): shared helpers of the rewrite tests of launch_commander, retention_playbook and crisis_planner.
// The tools are called through the hosted handler (netlify/functions/mcp.mjs), exactly as a client would call them.
// Pool scenarios (the real companies of the private tuning pools) are loaded at run time from the private work folder when it is present;
// no real name is written in this repository.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
export async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  if (j.result?.isError) throw new Error("tool error: " + j.result.content.map((c) => c.text).join(" "));
  return j.result.content.map((c) => c.text).join("\n");
}

/** Sentences and table rows of an answer, trimmed, with markup marks removed. */
export function units(text) {
  return text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, "")).split(/\n+|(?<=[.!?])\s+(?=[A-Z"(])/).map((x) => x.replace(/[*_`>#|]/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
}
/** A sentence of 6 or more words that occurs twice or more in the answer. */
export function repeats(text) {
  const seen = new Map();
  for (const u of units(text)) {
    if (/^[-: ]+$/.test(u) || u.split(" ").length < 6) continue;
    seen.set(u.toLowerCase(), (seen.get(u.toLowerCase()) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([u]) => u);
}
/** Bracket prompts, double braces, empty slots and undefined/NaN markers (a check box "[ ]" is fine). */
export function placeholders(text) {
  const out = [];
  for (const re of [/\[(?!\s?\]|x\])[^\]\n]{1,80}\]/g, /\{\{|\}\}/g, /\bundefined\b|\bNaN\b|\[object Object\]/g, /\b(?:against|about|on|of|for|to|with|by|in|at|than|from|between|is|are|the|a|an)\s+[.,;:!?](?=\s|$)/g, /\(\s*\)|“”|""/g, /<[^>\n]{1,40}>/g, /\bXX\b|\bTBD\b|Lorem|\bfill (?:this )?in\b|\binsert\b/gi]) {
    for (const m of text.matchAll(re)) out.push(m[0]);
  }
  return out;
}
/** An ellipsis that is not part of what the user typed. */
export function cutText(text, inputs) {
  const typed = Object.values(inputs).filter((x) => typeof x === "string").join(" ");
  return [...text.matchAll(/[^\s]{0,30}\.\.\.[^\s]{0,30}/g)].map((m) => m[0]).filter((m) => !typed.includes(m));
}
/** Whether the end of a line (text before a word) sits inside quotes: an odd number of straight quotes, or an opened curly quote that is not closed. */
export function inQuotes(line) {
  return (line.match(/"/g) ?? []).length % 2 === 1 || (line.match(/\u201C/g) ?? []).length > (line.match(/\u201D/g) ?? []).length;
}
/** Every place a word occurs, with the text of its line before it. */
export function hostileLines(text, word) {
  const out = [];
  for (const m of text.matchAll(new RegExp(word, "g"))) { const before = text.slice(0, m.index); out.push(before.slice(before.lastIndexOf("\n") + 1)); }
  return out;
}
export const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");
export const count = (text, re) => (text.match(re) ?? []).length;
/** The text after the last "To sharpen this, give" heading (null when absent). */
export function sharpen(text) {
  const i = text.lastIndexOf("To sharpen this, give");
  return i < 0 ? null : text.slice(i);
}

// ---- the pool scenarios (private) ----
const WORK = "/home/user/directory-submission-work/work";
export const POOL_AVAILABLE = existsSync(`${WORK}/run20/eval/builders20.mjs`) && existsSync(`${WORK}/run21/eval/common21.mjs`);
let poolCache = null;
/** Arguments of one tool for the pool scenarios (T6 to T9, H1 to H9, P1 to P9, Q1 to Q18), built by the run 20 builders from fetched pages. */
export async function poolArgs(tool, ids) {
  if (!POOL_AVAILABLE) return [];
  if (!poolCache) {
    const { BUILD20 } = await import(pathToFileURL(`${WORK}/run20/eval/builders20.mjs`).href);
    const { loadSet } = await import(pathToFileURL(`${WORK}/run21/eval/common21.mjs`).href);
    const sets = []; for (const s of ["T", "H", "P", "Q"]) { try { sets.push(...(await loadSet(s))); } catch { /* a set may be missing */ } }
    poolCache = { BUILD20, sets };
  }
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/list" }) }));
  const schema = (await r.json()).result.tools.find((t) => t.name === tool).inputSchema;
  const out = [];
  for (const id of ids) {
    const sc = poolCache.sets.find((s) => s.id === id);
    if (!sc || /^T[1-5]$/.test(sc.id)) continue;
    out.push({ id, args: await poolCache.BUILD20["craft-gtm"][tool](sc, 0, schema) });
  }
  return out;
}
export const POOL_IDS = ["T6", "T7", "T8", "T9", "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", ...Array.from({ length: 18 }, (_, i) => `Q${i + 1}`)];
