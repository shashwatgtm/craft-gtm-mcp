// Run 20 round 2 (quality, D92): findings of the fresh judges on head b652454. Invented companies only. All figures hypothetical.
// Run: npm run build && node --test tests/run20-quality-r2.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
}
const { splitPhrases } = await import(new URL("../dist/context.js", import.meta.url));

// (0) shared file
test("the shared sector file is the round 2 copy (profileFor exists; billing words name SaaS)", async () => {
  const v = await import(new URL("../dist/verticals.js", import.meta.url));
  assert.equal(typeof v.profileFor, "function");
  assert.equal(v.detectVertical("Dunning and proration for subscription invoices").id, "saas");
});

// (1) competitive_intel
const CI = { your_product: "Ledgerline, billing platform for subscription companies: invoicing, payments and revenue recognition", competitors: "manual spreadsheets kept by finance teams, a generic billing add-on bundled with the ERP",
  your_strengths: "supports usage and hybrid pricing models, SOC 2 Type II reports, implementations that go live in weeks, and integration with an existing ERP, CRM or tax tool in days (page claims)",
  competitor_details: "spreadsheets break when pricing changes; the ERP add-on only handles flat fees",
  common_objections: "Does Ledgerline integrate with NetSuite?, Why Ledgerline over the ERP add-on?, How long does it take to go live?" };
test("splitPhrases: 'and ...' with its own subject is a separate strength; a run of names stays one item", () => {
  assert.deepEqual(splitPhrases("supports General Trade, Modern Trade, Rural GT, Van Sales and hybrid sales models, and integrates with ERP and DMS systems"),
    ["supports General Trade, Modern Trade, Rural GT, Van Sales and hybrid sales models", "integrates with ERP and DMS systems"]);
  const t = splitPhrases("enterprise grade scalability, 99.97% uptime, and integration with an existing ERP, OMS, WMS, FMS or TMS in weeks (page claims)");
  assert.equal(t.length, 3);
  assert.match(t[2], /^integration with an existing ERP, OMS, WMS, FMS or TMS in weeks/);
});
test("competitive_intel: an objection with no supporting strength says exactly which fact the user must supply and why", async () => {
  const r = await call("competitive_intel", { ...CI, your_strengths: "supports usage and hybrid pricing models, SOC 2 Type II reports" });
  const h = r.text.split("## Objection handlers")[1];
  const netsuite = h.split('### "Does Ledgerline integrate with NetSuite?"')[1].split("###")[0];
  assert.match(netsuite, /accurate answer than a guess/);
  assert.match(r.text, /a fact that answers "Does Ledgerline integrate with NetSuite\?": a yes or no to this exact question/);
  assert.match(r.text, /\(it would change this answer, which now gives a pattern of answer instead of a fact\)/);
  assert.doesNotMatch(r.text, /Ask what lies behind it/);
  assert.match(r.text, /a fact that answers "How long does it take to go live\?": the real elapsed time from signature to go-live/);
});
test("competitive_intel: a comparison objection is answered from the strengths and the weak point of the alternative it names", async () => {
  const r = await call("competitive_intel", CI);
  const h = r.text.split("## Objection handlers")[1];
  const cmp = h.split('### "Why Ledgerline over the ERP add-on?"')[1].split("###")[0];
  assert.match(cmp, /(?:I can point to|our own materials say):/);
  assert.match(cmp, /only handles flat fees/);
  assert.doesNotMatch(cmp, /accurate answer than a guess/);
});
test("competitive_intel: discovery questions are about the buyer's situation, not 'how does the competitor handle our strength'", async () => {
  const r = await call("competitive_intel", CI);
  assert.doesNotMatch(r.text, /Ask how this approach handles|Ask how .* handles "/);
  assert.match(r.text, /How often does it happen that spreadsheets break when pricing changes\?/);
});
test("competitive_intel: with one strength, the cards do not repeat it; a card with nothing of its own says so", async () => {
  const r = await call("competitive_intel", { your_product: "Probetool API platform", competitors: "disconnected tools for design, a Slack thread for API discovery, separate frameworks for tests", your_strengths: "used by 500,000 companies (page claims)",
    competitor_details: "each stage is its own project with its own source of truth and drift accumulates" });
  const cards = r.text.split("## Objection handlers")[0].split(/\n(?=## Against )/).slice(1).join("\n");
  assert.equal(r.text.split(/\n(?=## Against )/).length - 1, 3, "three cards");
  assert.ok((cards.match(/used by 500,000 companies/gi) || []).length <= 1, "the popularity claim is not repeated on every card");
  assert.doesNotMatch(cards, /test for "used by/i);
  assert.match(r.text, /your_strengths that a buyer can test/);
});
test("competitive_intel: a note that names no alternative is labelled so, not attached to one card as its own", async () => {
  const r = await call("competitive_intel", { your_product: "Branchwire SD-WAN", competitors: "legacy WAN built on hardware, traditional VPNs", your_strengths: "managed SD-WAN with 24x7 support", competitor_details: "a single congested highway prone to jams" });
  assert.match(r.text, /Across the alternatives:\*\* A single congested highway prone to jams/);
});
test("competitive_intel: no 'resolution rate' or 'inference cost' words for an investment seller", async () => {
  const r = await call("competitive_intel", { your_product: "Quantara, systematic investment strategies powered by adaptive AI for institutions", competitors: "traditional quant strategies with static factor exposures", your_strengths: "signals explained in plain language" });
  assert.doesNotMatch(r.text, /resolution rate|inference cost|hallucination|automation rate/i);
});

// (2) launch_commander
test("launch_commander: a billing platform's pains are billing pains, and its channels reach finance", async () => {
  const r = await call("launch_commander", { product_feature: "Ledgerline Billing: billing and revenue recognition platform for subscription companies: invoicing, dunning, proration and collections", launch_type: "feature_launch", target_segments: "B2B SaaS, Gen AI", goals: "ten hypothetical deals, with CFO as the buyer" });
  assert.match(r.text, /billing errors and manual corrections/);
  assert.doesNotMatch(r.text, /take too long to reach first value|influencer|retargeting|content syndication/i);
  assert.match(r.text, /account-based email to CFOs/);
});
test("launch_commander: institutional buyers get consultant, due diligence and reference channels, not influencer posts", async () => {
  const r = await call("launch_commander", { product_feature: "Quantara: deep learning and knowledge graph models score hundreds of signals per security across thousands of securities and add forecast ranges with confidence", launch_type: "feature_launch", target_segments: "Asset allocators (pensions; insurers), Investment banks", goals: "ten hypothetical meetings, with CIO as the buyer" });
  assert.match(r.text, /Sector: read from your inputs as AI native, investment management/);
  assert.match(r.text, /consultant and adviser relations/);
  assert.doesNotMatch(r.text, /influencer|retargeting|content syndication/i);
});
test("launch_commander: an API platform (spec hub, mock servers, API catalog) is read as software and led by a platform leader", async () => {
  const r = await call("launch_commander", { product_feature: "Probetool: Spec Hub, mock servers, collections run in CI with the CLI, API Catalog and governance rules", launch_type: "feature_launch", target_segments: "Financial services, Retail", goals: "ten hypothetical deals, with platform leader as the buyer" });
  assert.match(r.text, /Sector: read from your inputs as software/);
  assert.doesNotMatch(r.text, /influencer|retargeting|content syndication/i);
});

// (3) craft_gtm_analyzer
test("craft_gtm_analyzer: 'Asset allocators' is not a content asset; the role in another order is named; a measure named by its key word counts", async () => {
  const plan = "Branchwire plan for next quarter.\nGoal: ten hypothetical deals.\nAudience: Asset allocators, investment managers.\nBuyer roles: CIO, IT Infrastructure Head, network manager.\nProof: 99.5% uptime across 2000 branches (hypothetical).";
  const t = (await call("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan", industry: "telecom" })).text;
  assert.match(t, /### A: ARTIFACT[^\n]*\n\*\*Score: 0\/10/);
  assert.match(t, /roles in your plan match [^.\n]*Head of IT Infrastructure/);
  assert.doesNotMatch(t, /none matches [^.\n]*Head of IT Infrastructure/);
  assert.match(t, /your plan uses the words for uptime\b/);   // run 21b: the neutral telecom entry names "uptime"; "uptime per site" belongs to the connectivity sub-type
});
test("craft_gtm_analyzer: a long risk line is not cut inside a word", async () => {
  const t = (await call("craft_gtm_analyzer", { document_content: "Plan.\nRisks: How is it different from a corporate credit card?; How is it different from a bank debit card?; How long does it take to set up my account and connect it to the ledger?", document_type: "quarterly_plan" })).text;
  assert.match(t, /How long does it take to set up my account and connect it to the ledger/);
});
test("craft_gtm_analyzer: a billing plan is not given expense-management answers", async () => {
  const plan = "Ledgerline go-to-market plan.\nGoal: ten hypothetical deals.\nBuyer roles: CFO.\nMessage: Ledgerline handles billing, invoicing, dunning and revenue recognition.\nRisks: Does Ledgerline integrate with Salesforce and NetSuite?";
  const t = (await call("craft_gtm_analyzer", { document_content: plan, document_type: "quarterly_plan" })).text;
  assert.match(t, /Sector: read from your inputs as SaaS, billing and revenue operations/);
  assert.doesNotMatch(t, /approvals, receipts, cards/);
});

// (4) partner_architect
test("partner_architect: no 'offers \"X\"' when the product is the company name; no 'use the figures' for a goal with 3PL and no number; media is not telecom", async () => {
  const r = await call("partner_architect", { company: "Ledgerline", product: "Ledgerline", partner_model: "referral", partner_goals: "Partner-sourced pipeline for Ledgerline among 3PL operators, Digital media and publishing; no numeric target given", your_deal_size: "$60,000" });
  assert.doesNotMatch(r.text, /offers "Ledgerline"/);
  assert.doesNotMatch(r.text, /Use the figures in your goal/);
  assert.match(r.text, /Your goal holds no number/);
  assert.doesNotMatch(r.text, /OSS and BSS/);
  assert.match(r.text, /agency and ad-tech integrators/);
});
test("partner_architect: a billing platform's recruitment email speaks to finance, not product and growth", async () => {
  const r = await call("partner_architect", { company: "Ledgerline", product: "Ledgerline Billing, billing and revenue recognition platform", partner_model: "referral", partner_goals: "Partner-sourced pipeline", your_deal_size: "$60,000" });
  assert.match(r.text, /Chief Financial Officer/);
  assert.doesNotMatch(r.text, /VP Product, Head of Growth/);
});

// (5) customer_interview_kit
test("customer_interview_kit: pieces that are not claims are kept inside the claim before them", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Shelfwalk, field sales software for consumer brands", target_persona: "National Sales Head",
    key_hypotheses: "missed visits hurt field sales and are a priority for national brands; sales and distribution teams; the about page says most revenue comes from large brands" });
  const n = (r.text.match(/### Hypothesis \d/g) || []).length;
  assert.equal(n, 1);
  assert.match(r.text, /sales and distribution teams; the about page says/);
});
test("customer_interview_kit: a billing platform buyer is asked about invoices and close, and the severity question has no sector measure pasted in", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Ledgerline Billing, billing and revenue recognition platform for subscription companies", target_persona: "Head of Product", industry: "saas",
    key_hypotheses: "billing systems break when pricing changes, so finance reconciles by hand" });
  assert.match(r.text, /How are plan and price changes turned into invoices/);
  assert.doesNotMatch(r.text, /activation rate|net revenue retention/i);
  assert.match(r.text, /What does it cost you \(time, rework, money or risk\)/);
});
test("customer_interview_kit: an API platform buyer is asked about specs, collections and governance", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Probetool, an API platform for building and using APIs", target_persona: "Platform Engineer", industry: "software",
    key_hypotheses: "specs, collections and docs drift apart and API discovery happens in a chat thread" });
  assert.match(r.text, /Where do your API specs, collections and docs live today/);
});

// (6) retention_playbook
test("retention_playbook: a billing platform gets billing churn reasons, and the verdict says it is against example thresholds", async () => {
  const r = await call("retention_playbook", { customer_segment: "B2B SaaS and software (customers of Ledgerline)", business_model: "saas_subscription", current_churn_rate: "1.5% monthly (hypothetical)", product: "Ledgerline Billing", industry: "saas" });
  assert.match(r.text, /Integration with the CRM or ERP kept breaking/);
  assert.doesNotMatch(r.text, /Customers never reached first value/);
  assert.match(r.text, /LOW against the example thresholds/);
});

// (7) crisis_planner
test("crisis_planner: a billing platform (named by its product text in the potential crises) is not given 'activation rate' as an outage measure, and a notification table has no 'Example figures' tag", async () => {
  const r = await call("crisis_planner", { company: "Ledgerline", industry: "saas", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", potential_crises: "service_outage, data_breach" });
  assert.doesNotMatch(r.text, /activation rate/);
  assert.doesNotMatch(r.text, /\*\*Notification Phase:\*\* (Example|\()/);
});

// (8) pmf_scorecard
test("pmf_scorecard: awards, success stories and usage counts get their own next step; none gets a security or pilot answer", async () => {
  const r = await call("pmf_scorecard", { product: "Vaultline, cloud security posture monitoring", target_market: "cybersecurity", current_metrics: "Churn: 1%, NPS: 40",
    customer_feedback: "More than 1,000 security teams use Vaultline (page claim); Success story: a bank closed its exposed storage in a day; Featured in an analyst report on risk platforms; Excellence Award for Security Product 2020" });
  assert.match(r.text, /\| Usage claim \|/);
  assert.match(r.text, /\| Customer story \|/);
  assert.match(r.text, /\| Recognition \|/);
  assert.doesNotMatch(r.text, /Agree a small pilot|Bring the security and compliance answers/);
  assert.match(r.text, /Turn it into a case study/);
});

// shared wording
test("sector objections are worded neutrally (the seller may be the national operator or the offshore firm)", async () => {
  const r = await call("launch_commander", { product_feature: "Branchwire managed SD-WAN over MPLS and broadband", launch_type: "feature_launch", target_segments: "Banking", goals: "ten hypothetical deals" });
  assert.doesNotMatch(r.text, /national operator|offshore-only/i);
});
