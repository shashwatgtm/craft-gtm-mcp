// Run 19 R19-35 (owner decision D80): the 8 problems of the real-world test, fixed in every CRAFT GTM tool.
// Written before the fixes (B43); the tests below failed on the starting head (see evidence/run19/after-review/craft-gtm/tests-before.txt).
// Companies are the invented ones of independent-audit/run19/cloud/examples-new.json (Shelfwalk, Answerloop, Cloudmoat, Spendrill,
// Lanehop, Branchwire, Example Logistics Co, Example Manufacturing Co, Example IT Services Co, Example Food Delivery Co).
// Real companies are tested only in the private project repo (rule B81).
// Run: npm run build && node --test tests/run19-d80.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

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
const B75 = /\b(clinics?|patients?|hospitals?|healthcare|hipaa|ehr|appointments?|no-shows?|dental|physio\w*|ExampleCo|Example Co|Acme Notes|Clausewise|ClinicFlow|legal tech)\b/i;
const PROMISES = /guaranteed|price protection|no long-term commitment/i;
const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
const UNFILLED = /\[Your (?!name\])|\[Insert|\{\{|\bundefined\b|\bNaN\b|\bnull\b/;

// ---------------------------------------------------------------------------------------------------------------------
// Problem 1: no clinic text anywhere in the tool code or the tool descriptions
test("problem 1: no clinic or dummy-company word in src/ or in tools/list", async () => {
  for (const f of readdirSync(new URL("../src/", import.meta.url)).filter((x) => x.endsWith(".ts"))) {
    const src = readFileSync(new URL("../src/" + f, import.meta.url), "utf8");
    assert.doesNotMatch(src, B75, "src/" + f);
  }
  const tl = await rpc("tools/list", {});
  assert.doesNotMatch(JSON.stringify(tl.result.tools), B75);
  assert.doesNotMatch(JSON.stringify(tl.result.tools), /healthtech/i);
});

// Problem 8 and 4: the choices name the owner's verticals, and every tool that reads a business model can be told it
test("tools/list: the owner's verticals are choices; business_model is an optional input where the model cannot be read", async () => {
  const tl = (await rpc("tools/list", {})).result.tools;
  const by = Object.fromEntries(tl.map((t) => [t.name, t.inputSchema]));
  for (const v of ["logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity"]) {
    assert.ok(by.pmf_scorecard.properties.target_market.enum.includes(v), "pmf " + v);
    assert.ok(by.customer_interview_kit.properties.industry.enum.includes(v), "interview " + v);
    assert.ok(by.crisis_planner.properties.industry.enum.includes(v), "crisis " + v);
  }
  for (const name of ["pmf_scorecard", "launch_commander", "customer_interview_kit", "partner_architect", "crisis_planner", "competitive_intel"]) {
    const p = by[name].properties.business_model;
    assert.ok(p && p.enum.includes("services") && p.enum.includes("connectivity") && p.enum.includes("investment"), name + " business_model");
    assert.ok(!(by[name].required || []).includes("business_model"), name + " business_model is optional");
  }
  for (const v of ["services_contract", "connectivity_contract", "investment_mandate"]) assert.ok(by.retention_playbook.properties.business_model.enum.includes(v), v);
  assert.ok(by.retention_playbook.properties.product, "retention product");
  for (const name of ["launch_commander", "retention_playbook", "partner_architect", "competitive_intel", "craft_gtm_analyzer"]) {
    const p = by[name].properties.industry;
    assert.ok(p && p.enum.includes("telecom") && p.enum.includes("logistics_tech") && p.enum.includes("other"), name + " industry");
    assert.ok(!(by[name].required || []).includes("industry"), name + " industry is optional");
  }
});
test("an old health choice is refused with the list of choices; a new one is accepted", async () => {
  const bad = await call("crisis_planner", { company: "Example IT Services Co", industry: "healthtech", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.equal(bad.isError, true);
  assert.match(bad.text, /must be one of/);
  const ok = await call("crisis_planner", { company: "Example IT Services Co", industry: "ites", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.equal(ok.isError, false);
});

// ---------------------------------------------------------------------------------------------------------------------
// The common assertions (E1 to E7 and problems 1, 4, 7) for every tool and several invented companies
const COS = {
  shelfwalk: { name: "Shelfwalk", saas: true, desc: "a field sales app for consumer goods brands and their distributors", buyer: "Head of Sales Operations", segments: "packaged food brands, personal care brands" },
  branchwire: { name: "Branchwire", saas: false, desc: "managed SD-WAN and business internet for companies with many branches", buyer: "Head of IT Infrastructure", segments: "banks with many branches, retail chains" },
  itsvc: { name: "Example IT Services Co", saas: false, desc: "a managed service desk for mid-size banks, priced per employee", buyer: "Chief Information Officer", segments: "mid-size banks, insurers" },
  cloudmoat: { name: "Cloudmoat", saas: true, desc: "cloud security monitoring that ranks misconfigurations by real exposure", buyer: "CISO", segments: "mid-size fintech companies, SaaS companies" },
  answerloop: { name: "Answerloop", saas: true, desc: "AI agents that resolve customer support tickets inside the help desk", buyer: "Head of Customer Experience", segments: "consumer apps, SaaS companies" },
  lanehop: { name: "Lanehop", saas: true, desc: "last-mile delivery routing and dispatch software", buyer: "Head of Last-Mile Operations", segments: "third-party logistics providers, e-commerce brands" },
};
const metrics = (c) => c.saas ? "MRR: $60K, Churn: 1.5%, NPS: 44, CAC: $9000, LTV: $72000, Retention: 95%" : "Annual contract value: $240,000, logo churn: 1% monthly, NPS: 38, net revenue retention 108%";
const argsFor = (tool, c) => ({
  pmf_scorecard: { product: `${c.name}, ${c.desc}`, target_market: "other", current_metrics: metrics(c), customer_feedback: "buyers like the reports but rollout takes longer than promised" },
  launch_commander: { product_feature: `${c.name}: ${c.desc}`, launch_date: "2026-11-15", launch_type: "feature_launch", target_segments: c.segments, goals: "40 qualified meetings, $300K pipeline, 5 reference customers" },
  customer_interview_kit: { interview_type: "discovery", product_context: `${c.name}, ${c.desc}`, target_persona: c.buyer, key_hypotheses: "the buyer cannot see the problem weekly; the current vendor is good enough" },
  retention_playbook: { customer_segment: c.segments.split(",")[0], business_model: c.saas ? "saas_subscription" : "enterprise_contract", current_churn_rate: "1.2% monthly", churn_reasons: "a rival bundled the service with other products, low adoption after rollout", product: c.name },
  partner_architect: { company: c.name, product: c.desc, partner_model: "agency_si", partner_goals: "20% of new revenue from partners", your_deal_size: "$24000 ACV", existing_partners: "two implementation partners" },
  crisis_planner: { company: c.name, industry: "other", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data", compliance_requirements: "ISO 27001, SOC 2" },
  competitive_intel: { your_product: `${c.name}, ${c.desc}`, competitors: "Competitor A, Competitor B", your_strengths: "quick rollout, clear reporting", competitor_details: "Competitor A is slow to roll out; Competitor B has weak reporting", common_objections: "we already have a tool for this, too expensive", recent_wins: "won where the buyer felt the problem every week", recent_losses: "lost where a bundled incumbent was preferred" },
  craft_gtm_analyzer: { document_content: `${c.name} quarterly plan. Goal: 40 qualified opportunities by 31 March. Owner: marketing lead. Budget: $25K. Channels: webinars and outbound to ${c.buyer}. Risks: slow rollout.`, document_type: "quarterly_plan" },
}[tool]);
const TOOLS = ["pmf_scorecard", "launch_commander", "customer_interview_kit", "retention_playbook", "partner_architect", "crisis_planner", "competitive_intel", "craft_gtm_analyzer"];

for (const [key, c] of Object.entries(COS)) {
  for (const tool of TOOLS) {
    test(`common checks: ${tool} for ${c.name}`, async () => {
      const args = argsFor(tool, c);
      const r = await call(tool, args);
      assert.equal(r.isError, false, r.text.slice(0, 200));
      const given = JSON.stringify(args).toLowerCase();
      assert.match(r.text.toLowerCase(), new RegExp(c.name.toLowerCase().replace(/[^a-z ]/g, ".")), "names the company");
      const b75 = (r.text.match(new RegExp(B75.source, "gi")) || []).filter((w) => !given.includes(w.toLowerCase()));
      assert.deepEqual(b75, [], "no B75 word");
      assert.doesNotMatch(r.text, PROMISES);
      assert.doesNotMatch(r.text, UNFILLED);
      if (!c.saas) {
        const saas = (r.text.match(new RegExp(SAAS_ONLY.source, "gi")) || []).filter((w) => !given.includes(w.toLowerCase()));
        assert.deepEqual(saas, [], "no SaaS-only term for a business that is not a software subscription");
      }
      assert.doesNotMatch(r.text, /[\u2013\u2014]/, "no em or en dash");
      // every supplied text input is used: one distinctive word of each reaches the answer (or the answer names it as not used)
      for (const [k, v] of Object.entries(args)) {
        if (typeof v !== "string" || /^(pmf_scorecard|crisis_planner)$/.test(tool) && /target_market|industry|customer_base|data_sensitivity/.test(k)) continue;
        if (["launch_type", "interview_type", "partner_model", "document_type", "business_model"].includes(k)) continue;
        const words = [...new Set(v.toLowerCase().match(/[a-z]{6,}/g) || [])];
        if (!words.length) continue;
        assert.ok(words.some((w) => r.text.toLowerCase().includes(w)) || /not used/i.test(r.text), `${tool}.${k} is used or named as not used`);
      }
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// pmf_scorecard: problems 3, 4, 8 and the activation rule
test("pmf_scorecard: a connectivity business gets no activation score and no aha moment; ACV and feedback are used", async () => {
  const r = await call("pmf_scorecard", { product: "Branchwire, managed SD-WAN and business internet for companies with many branches", target_market: "telecom",
    current_metrics: "Annual contract value: $240,000, logo churn: 1% monthly, NPS: 38, net revenue retention 108%", customer_feedback: "branches love the uptime; installs run late at remote sites" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, SAAS_ONLY);
  assert.match(r.text, /Activation[^\n]*not applicable/i);
  assert.match(r.text, /Based on 3 of 4 dimensions/);
  assert.match(r.text, /\$240,000/); // the ACV given is shown
  assert.match(r.text, /installs run late at remote sites/); // the feedback is quoted and answered
  assert.match(r.text, /uptime|site survey|latency|network operations/i); // sector words the input did not spell out
  assert.match(r.text, /read from your inputs as telecom|business model/i);
});
test("pmf_scorecard: a subscription business keeps the activation score; the missing activation action has no aha moment", async () => {
  const r = await call("pmf_scorecard", { product: "Shelfwalk, a field sales app for consumer goods brands", target_market: "enterprise_saas",
    current_metrics: "MRR: $60K, Churn: 1.5%, NPS: 44, CAC: $9000, LTV: $72000, Retention: 95%", business_model: "saas" });
  assert.match(r.text, /Based on 5 of 5|Based on 4 of 5/);
  assert.match(r.text, /ACTIVATION:[^\n]*first action/i);
  assert.doesNotMatch(r.text, /aha moment/i);
  assert.match(r.text, /\| MRR \| \$60,000/);
});
test("pmf_scorecard: a figure that no rule scores is named as not used", async () => {
  const r = await call("pmf_scorecard", { product: "Lanehop, last-mile routing", target_market: "logistics_tech", current_metrics: "Churn: 2%, NPS: 41, deliveries per driver per day 38" });
  assert.match(r.text, /not scored/i);
  assert.match(r.text, /deliveries per driver per day 38/);
});

// ---------------------------------------------------------------------------------------------------------------------
// launch_commander: problems 3, 4, 8 and the goal filing rule
test("launch_commander: a managed network launch has no consumer or software-only tasks; goals are filed one by one", async () => {
  const r = await call("launch_commander", { product_feature: "Branchwire managed SD-WAN and business internet for bank branches", launch_type: "major_release", launch_date: "TBD",
    target_segments: "banks with many branches, retail chains", goals: "40 branch-rollout demos, $300K pipeline, 5 reference customers", available_channels: "email, linkedin, webinar" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /in-app|product hunt|influencer|waitlist/i);
  const row = (name) => r.text.split("\n").find((l) => l.startsWith(`| ${name} |`)) || "";
  assert.match(row("Revenue"), /\$300K pipeline/);
  assert.doesNotMatch(row("Revenue"), /branch-rollout demos/);
  assert.match(row("Engagement"), /40 branch-rollout demos/);
  assert.match(r.text, /5 reference customers/);
  assert.doesNotMatch(r.text, /\[Define for|\[Case study|\[Specific action|\[set a target\]/);
  assert.match(r.text, /uptime|site survey|latency|network operations/i);
});
test("launch_commander: a goal that mentions sales heads is not filed under Revenue", async () => {
  const r = await call("launch_commander", { product_feature: "Shelfwalk order suggestions", launch_type: "feature_launch", target_segments: "packaged food brands",
    goals: "40 qualified meetings with National Sales Heads, $360,000 pipeline" });
  const row = (name) => r.text.split("\n").find((l) => l.startsWith(`| ${name} |`)) || "";
  assert.match(row("Engagement"), /40 qualified meetings with National Sales Heads/);
  assert.match(row("Revenue"), /\$360,000 pipeline/);
});

// ---------------------------------------------------------------------------------------------------------------------
// customer_interview_kit: problems 2, 4, 8
test("customer_interview_kit: a QA lead is not asked about subscriptions or churn; the hypothesis stays whole", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "an API testing platform for engineering teams", target_persona: "QA Lead",
    key_hypotheses: "regression suites take too long, but teams already own too many tools" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /handling churn|software subscriptions|IT and Finance/i);
  assert.match(r.text, /regression suites take too long, but teams already own too many tools/);
  assert.doesNotMatch(r.text, /Hypothesis 2/);
  assert.doesNotMatch(r.text, /\[problem area\]|\[problem\]|\[Show solution\]|\[reaction\]/);
  assert.match(r.text, /release|test|pipeline/i);
});
test("customer_interview_kit: a security persona gets the sector's own questions", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Cloudmoat, cloud security monitoring that ranks misconfigurations by real exposure",
    target_persona: "Cloud Security Lead", industry: "cybersecurity" });
  assert.match(r.text, /How many alerts does the team handle in a week/);
  const section = r.text.split("### Industry-Specific Questions")[1].split("## Probing Questions")[0];
  assert.doesNotMatch(section, /subscription|churn/i);
});
test("customer_interview_kit: a churn interview of a managed service says end or renew, not cancel a subscription", async () => {
  const r = await call("customer_interview_kit", { interview_type: "churn", product_context: "Example IT Services Co managed service desk", target_persona: "Chief Information Officer", industry: "ites" });
  assert.doesNotMatch(r.text, /cancel|subscription/i);
  assert.match(r.text, /renew/i);
});

// ---------------------------------------------------------------------------------------------------------------------
// retention_playbook: problems 2, 3, 4, 5
test("retention_playbook: a service contract gets service signals, its own reasons, and uses current interventions and signals", async () => {
  const r = await call("retention_playbook", { customer_segment: "mid-size banks", business_model: "enterprise_contract", current_churn_rate: "0.8% monthly",
    churn_reasons: "service credits were disputed every month, a rival bundled the service desk with its cloud contract, key engineers left", product: "Example IT Services Co managed service desk",
    current_interventions: "quarterly business reviews", available_data_signals: "ticket backlog age, SLA attainment, QBR attendance" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /feature adoption|in-app|login frequency|product analytics|self-serve/i);
  assert.doesNotMatch(r.text, /Getting more value from mid-size banks/);
  assert.match(r.text, /Example IT Services Co/);
  assert.match(r.text, /quarterly business reviews/);
  assert.match(r.text, /sla attainment[^\n]*Available/i);
  for (const reason of ["service credits were disputed every month", "a rival bundled the service desk with its cloud contract", "key engineers left"]) assert.ok(r.text.includes(reason), reason);
  assert.match(r.text, /bundle|outcome the buyer needs/i);
  assert.doesNotMatch(r.text, /\[the problem, in the customer's words\]/);
});
test("retention_playbook: 'because' does not trigger the adoption answer; whole words only", async () => {
  const r = await call("retention_playbook", { customer_segment: "retail chains", business_model: "saas_subscription", current_churn_rate: "2% monthly", churn_reasons: "they left because nothing changed after the first quarter" });
  assert.doesNotMatch(r.text, /Onboarding reset/);
  assert.match(r.text, /nothing changed after the first quarter/);
});
test("retention_playbook: weights for a services contract are an equal split of its signals (no new invented figure)", async () => {
  const r = await call("retention_playbook", { customer_segment: "mid-size banks", business_model: "services_contract", current_churn_rate: "1% monthly", churn_reasons: "key engineers left" });
  const weights = [...r.text.matchAll(/^\| [a-z ]+ \| (\d+(?:\.\d+)?)% \|/gm)].map((m) => Number(m[1]));
  assert.ok(weights.length >= 4);
  assert.ok(weights.every((w) => w === weights[0]), "equal weights: " + weights.join(","));
  assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 100) < 0.6);
});

// ---------------------------------------------------------------------------------------------------------------------
// partner_architect: problems 2, 3, 8
test("partner_architect: existing partners and the goal are used; no value-prop bracket", async () => {
  const r = await call("partner_architect", { company: "Shelfwalk", product: "Field sales app for consumer goods brands", partner_model: "agency_si",
    partner_goals: "20% of new revenue from partners in 12 months", your_deal_size: "$24000 ACV", existing_partners: "two implementation partners in Pune and Dubai" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /\[value prop\]|\[Define measurement\]/);
  assert.match(r.text, /two implementation partners in Pune and Dubai/);
  const goalLine = r.text.split("\n").find((l) => l.includes("20% of new revenue from partners in 12 months") && l.startsWith("|")) || "";
  assert.ok(goalLine, "the goal sits in a table row");
  assert.doesNotMatch(goalLine, /Expansion revenue influenced/);
  assert.match(r.text, /Head of Sales Operations|distributor|National Sales Head/i);
  assert.match(r.text, /Field sales app for consumer goods brands/);
});

test("partner_architect: a named industry gives the sector's buyers and words; without it the answer says the sector was not clear", async () => {
  const withIndustry = await call("partner_architect", { company: "Branchwire", product: "Branchwire", partner_model: "agency_si", partner_goals: "15 branch rollouts a year through partners", your_deal_size: "$60K", industry: "telecom" });
  assert.match(withIndustry.text, /Partners That Fit This Sector/);
  assert.match(withIndustry.text, /Sector: telecom \(from your choice\)/);
  assert.match(withIndustry.text, /uptime|SD-WAN|site survey/);
  const without = await call("partner_architect", { company: "Branchwire", product: "Branchwire", partner_model: "agency_si", partner_goals: "15 branch rollouts a year through partners", your_deal_size: "$60K" });
  assert.doesNotMatch(without.text, /Partners That Fit This Sector/);
  assert.match(without.text, /not clear from your inputs/);
});
test("craft_gtm_analyzer: a named industry gives the sector check for a short plan", async () => {
  const t = await analyze("Owner: marketing lead. Goal: 12 pilots by 31 March.", { industry: "cybersecurity" });
  assert.match(t, /## Sector Check/);
  assert.match(t, /Sector: cybersecurity \(from your choice\)/);
  assert.match(t, /CISO/);
});

// ---------------------------------------------------------------------------------------------------------------------
// crisis_planner: problems 1, 3, 8
test("crisis_planner: a telecom company gets an SLA breach playbook, its compliance items and no X (Twitter) line", async () => {
  const r = await call("crisis_planner", { company: "Branchwire", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data",
    company_size: "midsize_200_1000", compliance_requirements: "ISO 27001, SOC 2" });
  assert.equal(r.isError, false);
  assert.match(r.text, /SLA breach/i);
  assert.doesNotMatch(r.text, /X \(Twitter\)/);
  assert.ok((r.text.match(/ISO 27001/g) || []).length >= 2, "the compliance item is used beyond the header");
  assert.ok((r.text.match(/SOC 2/g) || []).length >= 2);
  assert.doesNotMatch(r.text, /clinical|hipaa|HHS/i);
});
test("crisis_planner: a typed HIPAA is echoed but no health authority is named by the tool", async () => {
  const r = await call("crisis_planner", { company: "Spendrill", industry: "fintech", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", compliance_requirements: "HIPAA" });
  assert.doesNotMatch(r.text, /HHS/);
});
test("crisis_planner: high personal or financial data adds a security lead and a data protection lead to the core team", async () => {
  const r = await call("crisis_planner", { company: "Spendrill", industry: "fintech", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", company_size: "scaleup_50_200" });
  const core = r.text.split("**Core Team (Always Activated):**")[1].split("**Extended Team")[0];
  assert.match(core, /CISO|security lead/i);
  assert.match(core, /data protection/i);
  assert.match(r.text, /fraud/i);
});
test("crisis_planner: an AI company gets a wrong-action playbook", async () => {
  const r = await call("crisis_planner", { company: "Answerloop", industry: "ai_native", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial" });
  assert.match(r.text, /wrong action|AI error|incorrect action/i);
  assert.match(r.text, /human/i);
});

// ---------------------------------------------------------------------------------------------------------------------
// competitive_intel: problems 3, 7
test("competitive_intel: each competitor gets its own intel; strengths are the user's words; objections answered on their own", async () => {
  const r = await call("competitive_intel", { your_product: "Shelfwalk", competitors: "Competitor A (a global field-sales suite), Competitor B (a regional DMS app)",
    competitor_details: "Competitor A is strong on enterprise reporting but slow to roll out; Competitor B bundles a free sales app with its distributor system",
    common_objections: "our distributor system has a free sales app, we already use a sales tool, reps will not use another app",
    recent_wins: "offline order capture on low-end phones, rollout in six weeks", recent_losses: "buyers wanted billing and sales in one system" });
  assert.equal(r.isError, false);
  const cards = r.text.split(/\n### \d\. Competitor /).slice(1);
  assert.equal(cards.length, 2);
  const [a, b] = cards.map((c) => c.split("## Objection Handlers")[0]);
  assert.match(a, /slow to roll out/); assert.doesNotMatch(a, /bundles a free sales app/);
  assert.match(b, /bundles a free sales app/); assert.doesNotMatch(b, /slow to roll out/);
  assert.match(r.text, /offline order capture on low-end phones/i);
  assert.doesNotMatch(r.text, /Superior customer support|Faster implementation|More comprehensive features|Better value/);
  assert.doesNotMatch(r.text, /\[Your rating\]|\[Your example\]|\[how it helps with this\]|\[your key strength\]/i);
  const handlers = r.text.split("## Objection Handlers")[1].split("## Win/Loss Analysis")[0];
  const counters = [...handlers.matchAll(/\*\*Counter:\*\* "([^\n]*)"/g)].map((m) => m[1]);
  assert.equal(counters.length, 3);
  assert.equal(new Set(counters).size, 3, "three objections, three different counters");
  assert.doesNotMatch(handlers, /Timing is definitely important/); // "already" is not a timing word
});
test("competitive_intel: a win phrase is never turned into a claim the user did not make", async () => {
  const r = await call("competitive_intel", { your_product: "Cloudmoat", competitors: "Competitor A", recent_wins: "won where the security team was small and busy" });
  assert.doesNotMatch(r.text, /Superior customer support/);
  assert.match(r.text, /won where the security team was small and busy/);
});

// ---------------------------------------------------------------------------------------------------------------------
// craft_gtm_analyzer: problem 5 (honest scores)
const analyze = async (document_content, extra = {}) => (await call("craft_gtm_analyzer", { document_content, document_type: "quarterly_plan", ...extra })).text;
const dim = (text, name) => Number((text.match(new RegExp(`### ${name}[^\\n]*\\n\\*\\*Score: (\\d+)/10`)) || [])[1]);
test("craft_gtm_analyzer: a plan with no dates gets Timeline 0, not 10", async () => {
  const t = await analyze("Plan: win 10 new brands by running two distributor meets and a LinkedIn campaign. Owner: marketing lead. Budget: $25K. The plan is to hit 40 qualified opportunities. Timeline and milestones to follow.");
  assert.equal(dim(t, "T: TIMELINE"), 0);
  assert.doesNotMatch(t, /Timeline is well-defined/);
  assert.match(t, /No (concrete )?dates/i);
});
test("craft_gtm_analyzer: a plan with dates, a duration and a quarter gets a Timeline score for them", async () => {
  const t = await analyze("Q1 2027 plan. Kick-off on 15 January. Pilot within 30 days. Review by 31 March.");
  assert.ok(dim(t, "T: TIMELINE") >= 6, "timeline " + dim(t, "T: TIMELINE"));
  assert.match(t, /15 January/);
});
test("craft_gtm_analyzer: 'may', 'by', 'plan', 'quarter' and 'day' alone are not dates", async () => {
  const t = await analyze("We may add webinars by the end of the quarter, one day at a time, as the plan allows.");
  assert.equal(dim(t, "T: TIMELINE"), 0);
});
test("craft_gtm_analyzer: a budget that is given is not asked for again; only what is missing is named", async () => {
  const t = await analyze("Audience: heads of sales operations at consumer goods brands. Budget: $60,000. Constraint: two people.");
  assert.doesNotMatch(t, /Partly covered: few Frame terms found \(budget/);
  const frame = t.split("### F: FRAME")[1].split("### T: TIMELINE")[0];
  assert.doesNotMatch(frame, /add budget|Add: .*budget/i);
});
test("craft_gtm_analyzer: each dimension points at the plan's own line", async () => {
  const t = await analyze("Plan for Q1 2027.\nOwner: marketing lead.\nBudget: $25K for the quarter.");
  const frame = t.split("### F: FRAME")[1].split("### T: TIMELINE")[0];
  assert.match(frame, /> Budget: \$25K for the quarter/);
  assert.match(t.split("### T: TIMELINE")[1], /> Plan for Q1 2027/);
});
test("craft_gtm_analyzer: a risk named without any response is flagged", async () => {
  const t = await analyze("Owner: marketing lead. Risks: the sales team may not follow up on leads. Target: 40 meetings by 31 March.");
  assert.match(t, /risk[^\n]*(no response|no mitigation|without)/i);
});

// ---------------------------------------------------------------------------------------------------------------------
// Ledger B15-L1 (approved): a long pasted text never fills a heading or a table; it is quoted once in full
test("a 3,000 character product text is capped in the heading and the table, and printed once in full", async () => {
  const long = "Shelfwalk is a field sales app for consumer goods brands and their distributors. ".repeat(40).trim();
  for (const [tool, args, field] of [
    ["pmf_scorecard", { product: long, target_market: "vertical_saas", current_metrics: "Churn: 2%, NPS: 41" }, "product"],
    ["launch_commander", { product_feature: long, launch_type: "feature_launch", target_segments: "packaged food brands", goals: "40 qualified meetings" }, "product_feature"],
    ["competitive_intel", { your_product: long, competitors: "Competitor A", your_strengths: "offline order capture" }, "your_product"],
  ]) {
    const r = await call(tool, args);
    assert.equal(r.isError, false, tool);
    const heading = r.text.split("\n").find((l) => l.startsWith("## "));
    assert.ok(heading.length < 220, `${tool}: heading is ${heading.length} characters`);
    assert.equal(r.text.split(long).length - 1, 1, `${tool}: the full text appears once`);
    assert.ok(r.text.length < long.length * 3, `${tool}: the answer does not repeat the text`);
  }
});
