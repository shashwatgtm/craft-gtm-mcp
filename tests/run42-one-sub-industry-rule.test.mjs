// Run 42B (addendum 8, root fix): ONE function (src/sub-industry.ts, subIndustryFor) decides a sub industry; every tool uses it. For every sector, a seller
// description with no words of a sub industry gets no sub industry specific line in any of the eight tools, even when the deal text, the job title or
// your_sector point at that kind. Invented names only. All figures hypothetical.
import test from "node:test";
import assert from "node:assert/strict";
import mcp0 from "../netlify/functions/mcp.mjs";
import { SUBTYPES, VERTICALS } from "../dist/verticals.js";
import { SECTOR_CHOICES } from "../dist/context.js";
import { subIndustryFor } from "../dist/sub-industry.js";
import { SOFTWARE_GENERAL_NOTES, AI_GENERAL_NOTES } from "../dist/sector-playbooks.js";

const mcp = mcp0.default || mcp0;
let rid = 900;
async function call(name, args) {
  const r = await mcp(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: rid++, method: "tools/call", params: { name, arguments: args } }) }), {});
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = JSON.parse(t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5)); }
  return (j.result?.content ?? []).map((c) => c.text).join("\n");
}
const PRODUCT = "Acme: a tool that helps teams get their work done";
const strings = (n) => [...(n.buyerRoles ?? []), ...(n.metrics ?? []), ...(n.vocabulary ?? []), n.committee, n.proofShape, n.salesMotion, ...(n.objections ?? []).map((o) => o.objection), ...(n.discovery ?? [])].filter((x) => typeof x === "string" && x.length > 8);
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");

function sentinels(vid) {
  const base = VERTICALS.find((x) => x.id === vid);
  const corpus = norm([...VERTICALS.flatMap((x) => strings(x)), ...strings(SOFTWARE_GENERAL_NOTES), ...strings(AI_GENERAL_NOTES)].join(" | "));
  const baseOwn = { has: (x) => corpus.includes(x) };
  const general = vid === "software" ? SOFTWARE_GENERAL_NOTES : vid === "ai-native" ? AI_GENERAL_NOTES : null;
  const generalSet = new Set(general ? strings(general).map(norm) : []);
  const out = new Set();
  for (const st of SUBTYPES.filter((x) => x.vertical === vid)) for (const s of strings(st.notes)) if (!baseOwn.has(norm(s)) && !generalSet.has(norm(s)) && norm(s).split(" ").length >= 3) out.add(norm(s));
  // the entries of software and AI native that hold lines for one kind of company
  if (general) for (const s of strings(base)) if (!generalSet.has(norm(s)) && norm(s).split(" ").length >= 3) out.add(norm(s));
  return [...out];
}
// a deal text and a job title that hold the words of the first sub industry of the sector: they must not choose it
function dealWords(vid) {
  const st = SUBTYPES.find((x) => x.vertical === vid);
  return st ? `${st.name}, ${(st.notes.vocabulary ?? []).slice(0, 4).join(", ")}` : "the work of the team";
}
const argsFor = (sector, vid) => {
  const deal = dealWords(vid);
  return {
    pmf_scorecard: { product: PRODUCT, target_market: "b2b", your_sector: sector, customer_feedback: deal },
    craft_gtm_analyzer: { document_content: `Plan\nProduct: ${PRODUCT}\nAudience: ${deal}\nGoal: a hypothetical pipeline of $100,000.\nMessage: help teams get their work done.`, document_type: "quarterly_plan", your_sector: sector },
    competitive_intel: { your_product: PRODUCT, competitors: `spreadsheets, ${deal}`, your_strengths: "fast setup", your_sector: sector },
    launch_commander: { product_feature: PRODUCT, launch_type: "feature_launch", target_segments: deal, goals: "ten deals (hypothetical)", your_sector: sector },
    customer_interview_kit: { interview_type: "discovery", product_context: PRODUCT, key_hypotheses: deal, target_persona: "operations manager", your_sector: sector },
    partner_architect: { company: "Acme", product: PRODUCT, partner_model: "referral", partner_goals: `partner-sourced pipeline among ${deal}`, your_sector: sector },
    retention_playbook: { customer_segment: "mid-size teams (customers of Acme)", business_model: "saas", current_churn_rate: "2% monthly (hypothetical)", product: PRODUCT, churn_reasons: deal, your_sector: sector },
    crisis_planner: { company: "Acme, a tool that helps teams get their work done", potential_crises: deal, customer_base: "b2b_enterprise", data_sensitivity: "medium_business", your_sector: sector },
  };
};

test("the function: a description with no sub industry words gives null for every sector", () => {
  for (const vid of Object.values(SECTOR_CHOICES)) assert.equal(subIndustryFor(vid, [PRODUCT, "Acme"]), null, vid);
  assert.equal(subIndustryFor("saas", ["Meeting scheduling software with booking links"]), null);
  assert.equal(subIndustryFor("software", ["An automated data movement platform with managed connectors into warehouses"]), null);
});

for (const [sector, vid] of Object.entries(SECTOR_CHOICES)) {
  test(`no sub industry specific lines in any tool for a neutral ${sector} seller (deal text with kind words does not choose one)`, async () => {
    const marks = sentinels(vid);
    const calls = argsFor(sector, vid);
    for (const [tool, args] of Object.entries(calls)) {
      const t = norm(await call(tool, args));
      assert.doesNotMatch(t, /error|invalid/i.test(t.slice(0, 80)) ? /^$/ : /^\u0000$/);
      const typed = norm(JSON.stringify(args));
      for (const m of marks) if (!typed.includes(m)) assert.ok(!t.includes(m), `${sector} / ${tool}: sub industry line used without the seller's words: ${m}`);
    }
  });
}

test("a seller that names its own kind still gets that kind's lines", () => {
  assert.equal(subIndustryFor("logistics-tech", ["Lanehop, route planning for delivery fleets"])?.id, "last-mile");
  assert.equal(subIndustryFor("telecom", ["Linkpoint, managed SD-WAN and broadband for bank branches"])?.id, "operators-connectivity");
});

test("the two judged cases: a data movement platform gets no DevOps lines, a scheduling SaaS gets no project management lines", async () => {
  const p = await call("partner_architect", { company: "Fivetran", product: "Fivetran", partner_model: "referral", partner_goals: "partner-sourced pipeline among retail and CPG; no numeric target given", your_deal_size: "$40,000 ACV (hypothetical)", your_sector: "software" });
  assert.doesNotMatch(p, /VP Engineering|release frequency|DevOps|faster releases/i);
  const k = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Calendly, Meeting scheduling software that handles the work around meetings: booking links and routing forms, an AI scheduling assistant, notes, follow-ups, contacts and built-in payments", industry: "saas", target_persona: "(not given)", key_hypotheses: "The back-and-forth of finding a time to meet is a priority", your_sector: "saas" });
  assert.doesNotMatch(k, /collaboration and work management|boards|status meetings/i);
});
