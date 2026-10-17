// Run 20 round 1, task B (ledger row A17-O20): plain sentence-case tool text, and clean printed percentages.
// Written before the changes (B43). Companies are invented (Lanehop, Branchwire). Every figure here is hypothetical test input.
// Run: npm run build && node --test tests/run20-text-numbers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};

// ---------------------------------------------------------------------------------------------------------------------
// Part 1: tool text in plain sentence case
// Real acronyms stay in capitals. Anything else of three or more capital letters is an ALL-CAPS word and fails.
const ACRONYMS = new Set(["MRR", "ARR", "ACV", "NPS", "CAC", "LTV", "DAU", "MAU", "GTM", "SLA", "QBR", "TBD", "ISO", "SOC", "GDPR", "CRAFT", "PMF", "ICP", "PII", "CRM", "KPI", "ROI", "YYYY"]);
const textsOf = (tools) => {
  const out = [];
  for (const t of tools) {
    out.push([t.name + " (description)", t.description]);
    for (const [k, p] of Object.entries(t.inputSchema.properties || {})) out.push([t.name + "." + k, p.description || ""]);
  }
  return out;
};

test("tools/list: no ALL-CAPS word in any tool description or field hint (real acronyms excepted)", async () => {
  const tl = await rpc("tools/list", {});
  const bad = [];
  for (const [where, text] of textsOf(tl.result.tools)) {
    for (const m of text.matchAll(/\b[A-Z]{3,}\b(?:\s+[A-Z]{3,}\b)*/g)) {
      const words = m[0].split(/\s+/);
      if (words.length > 1 || !ACRONYMS.has(words[0])) bad.push(where + ": " + m[0]);
    }
  }
  assert.deepEqual(bad, []);
});

test("tools/list: the named ALL-CAPS words are gone", async () => {
  const tl = await rpc("tools/list", {});
  const all = JSON.stringify(tl.result.tools);
  for (const w of ["ADAPT", "DISCOVERY MODE", "WHY", "DERIVED", "PARSED", "EVALUATED", "EACH", "OPTIONAL"]) {
    assert.ok(!all.includes(w), w + " is still in tools/list");
  }
});

test("tools/list: every tool description is one rich first sentence that says what the tool needs and what it returns", async () => {
  const tl = await rpc("tools/list", {});
  for (const t of tl.result.tools) {
    const first = t.description.split(/(?<=\.)\s+/)[0];
    assert.ok(first.split(/\s+/).length >= 14, t.name + " first sentence is too short: " + first);
    assert.match(first, /\b(needs?|takes?|from your|from the|using|given)\b/i, t.name + " first sentence does not say what it needs: " + first);
    assert.match(first, /\b(returns?|gives?|produces?|builds?|writes?|scores?|lists?)\b/i, t.name + " first sentence does not say what it returns: " + first);
    assert.doesNotMatch(t.description, /guarantee|proven|best-in-class|\d+\s*%/i, t.name + " promises or adds a figure");
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// Part 2: percentages in answers have at most one decimal and never show float noise
const PCT = /(\d+(?:\.\d+)?)\s*%/g;
const assertCleanPercents = (text, label) => {
  for (const m of text.matchAll(PCT)) {
    const dec = (m[1].split(".")[1] || "").length;
    assert.ok(dec <= 1, label + ": percentage with more than one decimal: " + m[0]);
  }
  assert.doesNotMatch(text, /\d\.\d{4,}/, label + ": float noise");
  assert.doesNotMatch(text, /\b(?:NaN|undefined|Infinity)\b/, label + ": bad number");
};
const tenths = (i) => { const s = (i / 10).toFixed(1); return s.endsWith(".0") ? s.slice(0, -2) : s; };

test("retention_playbook: churn 0.8 a month times twelve prints 9.6%, not 9.600000000000001% and not a rounded 10%", async () => {
  const r = await call("retention_playbook", { customer_segment: "Lanehop carrier accounts", business_model: "enterprise_contract", current_churn_rate: "0.8% monthly", churn_reasons: "price, support", cs_team_size: "small_1_3" });
  assert.equal(r.isError, false);
  assert.match(r.text, /about 9\.6% of customers lost in a year/);
  assert.doesNotMatch(r.text, /9\.60+\d/);
  assertCleanPercents(r.text, "0.8");
});

test("retention_playbook: monthly churn from 0.1 to 6.0 times twelve is clean, with and without churn reasons", async () => {
  for (let i = 1; i <= 60; i++) {
    const monthly = tenths(i);
    const expected = tenths(i * 12);
    for (const reasons of ["price, support", ""]) {
      const r = await call("retention_playbook", { customer_segment: "Branchwire shippers", business_model: "saas_subscription", current_churn_rate: monthly + "%", ...(reasons ? { churn_reasons: reasons } : {}) });
      assert.equal(r.isError, false, monthly);
      // run 22: the playbook and the discovery kit both state the annual figure
      assert.match(r.text, new RegExp("about " + expected.replace(".", "\\.") + "% of customers lost in a year"), "churn " + monthly + " should print about " + expected + "%");
      assertCleanPercents(r.text, "churn " + monthly + (reasons ? "" : " discovery"));
    }
  }
});

test("retention_playbook: a churn typed with many decimals is shown with one", async () => {
  const r = await call("retention_playbook", { customer_segment: "Lanehop carrier accounts", business_model: "saas_subscription", current_churn_rate: "2.3456% monthly", churn_reasons: "price" });
  assert.match(r.text, /You report churn of 2\.3% monthly/);
  assert.match(r.text, /about 28\.1% of customers lost in a year/);
  assertCleanPercents(r.text, "2.3456");
});

test("retention_playbook: equal signal weights for a services contract are clean", async () => {
  for (const n of ["services_contract", "connectivity_contract", "investment_mandate"]) {
    const r = await call("retention_playbook", { customer_segment: "Branchwire accounts", business_model: n, current_churn_rate: "1.1%", churn_reasons: "price" });
    assertCleanPercents(r.text, n);
  }
});

test("pmf_scorecard: typed metric percentages are shown with at most one decimal", async () => {
  const r = await call("pmf_scorecard", {
    product: "Lanehop freight visibility", target_market: "logistics_tech",
    current_metrics: "MRR: $50K, Churn: 0.8%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92.34%, Activation: 61.456%, Trial conversion: 12.34%, Revenue growth: 7.777%, DAU: 333, MAU: 1000",
  });
  assert.equal(r.isError, false);
  assertCleanPercents(r.text, "pmf");
  assert.match(r.text, /92\.3%/);
  assert.match(r.text, /61\.5%/);
  assert.match(r.text, /12\.3%/);
  assert.match(r.text, /7\.8%/);
  assert.match(r.text, /33\.3%/);
});

test("pmf_scorecard: churn values 0.1 to 9.9 are printed as typed, with no noise", async () => {
  for (let i = 1; i <= 99; i++) {
    const v = tenths(i);
    const r = await call("pmf_scorecard", { product: "Branchwire", target_market: "enterprise_saas", current_metrics: `Churn: ${v}%, Retention: 90%, NPS: 40` });
    assert.match(r.text, new RegExp("\\| " + v.replace(".", "\\.") + "% \\|"), v);
    assertCleanPercents(r.text, "pmf churn " + v);
  }
});
