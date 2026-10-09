// Run 20 round 1 (quality, D92): the planning tools use every input they are given and build sentences from parts.
// All companies are invented (Lanehop, Branchwire, Vaultline, Shelfwalk, Ledgerline, Quantara). All figures are hypothetical test figures.
// Run: npm run build && node --test tests/run20-quality-r1.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function call(name, args) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
}
const BRACKET = /\[(?!x\]| \])[A-Za-z][^\]\n]{0,60}\]/;   // a bracket placeholder such as [Define for X] or [Your name] (a markdown checkbox is not one)

// ---------------------------------------------------------------------------------------------------------------------
// launch_commander
const SDWAN = { product_feature: "Branchwire managed SD-WAN: one control centre, path control and managed security, over MPLS, 4G and broadband under one managed service", launch_type: "feature_launch", launch_date: "Q1 2027",
  target_segments: "Banking, Manufacturing, Retail", goals: "a hypothetical pipeline of $900,000, which is ten deals at a hypothetical $90,000 annual contract value, with CIO as the buyer" };
test("launch_commander: the messaging matrix has no bracket placeholder and every segment has a pain, a proof point and a next step", async () => {
  const r = await call("launch_commander", SDWAN);
  assert.equal(r.isError, false);
  const m = r.text.split("## Segment Messaging Matrix")[1].split("## Success Metrics")[0];
  assert.doesNotMatch(m, BRACKET);
  assert.doesNotMatch(m, /Not supplied/);
  for (const seg of ["Banking", "Manufacturing", "Retail"]) assert.match(m, new RegExp(`### ${seg}`));
  assert.match(m, /site survey and a pilot/i);          // the telecom next step
  assert.match(m, /uptime and repair time/i);           // the telecom proof shape
});
test("launch_commander: a connectivity launch has no landing page, blog or in-app task", async () => {
  const r = await call("launch_commander", SDWAN);
  const tl = r.text.split("## Launch Timeline")[1].split("## Segment Messaging Matrix")[0];
  assert.doesNotMatch(tl, /in-app|landing page update|\| Blog post|influencer|waitlist|Product Hunt/i);
  assert.match(tl, /pilot sites|site survey/i);
});
test("launch_commander: 'with CIO as the buyer' stays inside the goal and is used as the buyer; it is not a goal of its own", async () => {
  const r = await call("launch_commander", SDWAN);
  const goals = r.text.split("## Launch Goals")[1].split("---")[0].trim().split("\n").filter((l) => l.startsWith("- "));
  assert.equal(goals.length, 1);
  assert.match(goals[0], /with CIO as the buyer/);
  assert.match(r.text, /Write it for the CIO/);
  assert.doesNotMatch(r.text, /\| Other goal \|/);
  assert.doesNotMatch(r.text, /Chief Information Officer, Head of IT/);   // the CIO is not listed twice
});
test("launch_commander: a long product description is quoted whole at a word boundary, never cut inside a phrase or doubled", async () => {
  const r = await call("launch_commander", { ...SDWAN, product_feature: `Branchwire managed SD-WAN: ${"path control, one control centre and managed security, ".repeat(12)}and one managed service` });
  const line = r.text.split("\n").find((l) => l.startsWith("**The product, in your words:**"));
  assert.ok(line, "the product line");
  assert.doesNotMatch(line, /\.\.\.\./);
  assert.match(line, /\.\.\."$/);   // a cut ends with three dots inside the quotes
});
test("launch_commander: with no sector in the words, the matrix still has no bracket and names the segment's buying steps", async () => {
  const r = await call("launch_commander", { product_feature: "Quantara", launch_type: "feature_launch", launch_date: "TBD", target_segments: "Asset allocators (pensions; insurers), Investment banks", goals: "10 hypothetical meetings" });
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /investment or risk committee/);
});

// ---------------------------------------------------------------------------------------------------------------------
// customer_interview_kit
test("customer_interview_kit: an investment decision maker gets investment questions, not customer-experience measures", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Quantara, AI agents that score investment signals with confidence ranges", target_persona: "portfolio manager" });
  assert.equal(r.isError, false);
  assert.match(r.text, /investment decision maker/);
  assert.doesNotMatch(r.text, /resolution rate|Head of Customer Experience|handling time/i);
  assert.doesNotMatch(r.text, /churn|software subscriptions|tool sprawl/i);
});
test("customer_interview_kit: a head of last-mile operations is asked about the day, not about generic enterprise software", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Lanehop, route planning and dispatch for delivery fleets", target_persona: "Head of Last-mile", industry: "enterprise_software" });
  assert.match(r.text, /operations leader/);
  assert.doesNotMatch(r.text, /How much of a challenge is long implementation|tool sprawl/i);
  assert.doesNotMatch(r.text, BRACKET);
});
test("customer_interview_kit: an objection to test is not turned into a claim, and a hypothesis is quoted whole", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Shelfwalk, field sales software for consumer brands", target_persona: "National Sales Head",
    key_hypotheses: "missed visits and duplicate outlet data hurt field sales; objections to test: Will it work offline?; Does it work for all types of trade?" });
  assert.match(r.text, /### Hypothesis 1: "missed visits and duplicate outlet data hurt field sales"/);
  assert.match(r.text, /### Objection 2: "Will it work offline\?"/);
  assert.match(r.text, /### Objection 3: "Does it work for all types of trade\?"/);
  assert.doesNotMatch(r.text, /Hypothesis \d: "objections to test/i);
});

// ---------------------------------------------------------------------------------------------------------------------
// craft_gtm_analyzer
const PLAN = `Lanehop go-to-market plan for next quarter. All figures in this plan are hypothetical.
Goal: build a hypothetical pipeline of $1,500,000, which is ten deals at a hypothetical annual contract value of $150,000, from retail.
Audience: Retail, FMCG and 3PL operators.
Buyer roles: Chief Operating Officer, Head of Last-mile, General Manager Operations, Group Logistics Manager.
Message: Lanehop plans routes faster; a customer quote says it launched in two months.
How we differ: agents act and humans govern, and the customer team owns the agents.
Proof: Customer quote: expanded from 500 to 4,000 trucks in under six months; Named a leader for 7 Consecutive Years (home page).
Risks: drivers will not use a new app; integration effort.`;
const analyze = async (document_content, extra = {}) => (await call("craft_gtm_analyzer", { document_content, document_type: "quarterly_plan", ...extra })).text;
const dim = (text, name) => Number((text.match(new RegExp(`### ${name}[^\\n]*\\n\\*\\*Score: (\\d+)/10`)) || [])[1]);
test("craft_gtm_analyzer: customer job titles and customer quotes are not the plan's owner or dates", async () => {
  const t = await analyze(PLAN);
  assert.equal(dim(t, "C: CHARACTER"), 0);
  assert.equal(dim(t, "T: TIMELINE"), 0);
  assert.match(t, /Nobody on your side is named to run the plan/);
  assert.match(t, /Counted toward Frame only, because they describe your customers and market/);
});
test("craft_gtm_analyzer: audience and outcome are read from the plan's own lines instead of 'Not specified'", async () => {
  const t = await analyze(PLAN);
  assert.doesNotMatch(t, /Not specified/);
  assert.match(t, /\*\*Written for:\*\* "Retail, FMCG and 3PL operators" \(the plan's own Audience line\)/);
  assert.match(t, /\*\*Meant to drive:\*\* "build a hypothetical pipeline of \$1,500,000/);
});
test("craft_gtm_analyzer: a goal with a figure is a target with a number, and the answer says what the goal is not traced to", async () => {
  const t = await analyze(PLAN);
  assert.ok(dim(t, "R: RESULT") >= 8, "result " + dim(t, "R: RESULT"));
  assert.match(t, /The goal is not traced to activity/);
  assert.match(t, /No channel is named/);
});
test("craft_gtm_analyzer: each item of a Risks line gets its own line and a usual response", async () => {
  const t = await analyze(PLAN);
  assert.match(t, /A risk without a response: "drivers will not use a new app"/);
  assert.match(t, /A risk without a response: "integration effort"/);
  assert.match(t, /A usual response:/);
});
test("craft_gtm_analyzer: the add-this-section templates hold no bracket placeholder", async () => {
  const t = await analyze("Short plan with nothing in it.");
  assert.doesNotMatch(t, BRACKET);
});
test("craft_gtm_analyzer: a plan that does name an owner, a channel, a date and a budget gets credit and no false gap", async () => {
  const t = await analyze("Owner: head of marketing. Goal: 40 qualified meetings by 31 March. Channels: webinars and outbound email. Budget: $20K. Weekly review of meetings booked. Deliverables: a deck and a case study.");
  assert.ok(dim(t, "C: CHARACTER") >= 6);
  assert.ok(dim(t, "T: TIMELINE") >= 4);
  const gaps = t.split("## What to fix first")[1].split("## Sector Check")[0];
  assert.doesNotMatch(gaps, /No channel is named|No dates|No budget|No review rhythm|No deliverables|Nobody on your side/);
});

// ---------------------------------------------------------------------------------------------------------------------
// the reader, as the tools call it
test("a lone AI word does not make a product AI native, and a trade with two words beats the AI words", async () => {
  const a = await call("launch_commander", { product_feature: "Vaultline: continuous monitoring of the dark web and the external attack surface, with AI agents that validate and prioritize exposures", launch_type: "feature_launch", target_segments: "Banks, Telecom", goals: "ten hypothetical meetings" });
  assert.match(a.text, /Sector: read from your inputs as cybersecurity/);
  const b = await call("launch_commander", { product_feature: "Lanehop: spec hub, mock servers and AI test generation", launch_type: "feature_launch", target_segments: "Banks, Telecom", goals: "ten hypothetical meetings" });
  assert.doesNotMatch(b.text, /read from your inputs as AI native/);
});
test("a sector read only from the buyer's industry is not used as the seller's sector", async () => {
  const r = await call("retention_playbook", { customer_segment: "Banking and financial services (customers of Branchwire)", business_model: "enterprise_contract", current_churn_rate: "0.3% monthly (hypothetical)" });
  assert.doesNotMatch(r.text, /read from your inputs as fintech/);
  assert.match(r.text, /Sector: not clear from your inputs/);
  assert.doesNotMatch(r.text, /Sector notes: fintech/);
});
test("a product text that lists its features after 'for consumer brands:' is read as the seller's own description", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Shelfwalk, AI led sales and distribution software for consumer brands: sales force automation, distributor management system (DMS), van sales, retail merchandising and trade promotion management", target_persona: "National Sales Head", industry: "saas" });
  assert.match(r.text, /Sector: read from your inputs as vertical SaaS/);
});
test("per security and SOC 1 are not security-vendor words", async () => {
  const r = await call("launch_commander", { product_feature: "Quantara: models assess hundreds of signals per security across 50,000 securities and add forecast ranges", launch_type: "feature_launch", target_segments: "Asset managers", goals: "ten hypothetical meetings" });
  assert.doesNotMatch(r.text, /read from your inputs as cybersecurity/);
  const c = await call("competitive_intel", { your_product: "Ledgerline billing platform", competitors: "legacy billing", your_strengths: "SOC 1 and SOC 2 Type II reports, hybrid pricing models" });
  assert.doesNotMatch(c.text, /read from your inputs as cybersecurity/);
});
test("a company name that ends in Software does not make a services firm a software subscription", async () => {
  const r = await call("crisis_planner", { company: "Branchwire Software", industry: "ites", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(r.text, /Business model: software subscription/);
});

// ---------------------------------------------------------------------------------------------------------------------
// competitive_intel
const CI = { your_product: "Ledgerline billing platform for subscription companies: invoicing, payments and revenue recognition", competitors: "legacy billing systems with long implementation timelines, spreadsheets kept by finance teams",
  your_strengths: "supports hybrid and usage pricing models, SOC 2 Type II reports, a 99.9% uptime SLA and implementations that go live in weeks (page claims)",
  competitor_details: "legacy billing systems take many months to implement; spreadsheets break when pricing changes",
  common_objections: "Does it integrate with our ERP?, How long does it take to go live?, Is it secure?" };
test("competitive_intel: a strengths sentence is split into phrases, never into fragments that start with 'and'", async () => {
  const r = await call("competitive_intel", CI);
  assert.equal(r.isError, false);
  const items = r.text.split("**You win on:** ")[1].split("\n")[0].replace(/\.$/, "").split("; ");
  assert.ok(items.length >= 2);
  for (const it of items) assert.doesNotMatch(it, /^(and|or|but|with|which)\b/i, it);
});
test("competitive_intel: a competitor detail reaches the competitor it describes, and is used in the trap question", async () => {
  const r = await call("competitive_intel", CI);
  const cards = r.text.split(/\n(?=## Against )/).slice(1).map((c) => c.split("## Objection handlers")[0]);
  assert.equal(cards.length, 2);
  assert.match(cards[0], /take many months to implement/);
  assert.doesNotMatch(cards[0], /spreadsheets break/);
  assert.match(cards[1], /spreadsheets break when pricing changes/);
  assert.match(cards[0], /How often does this happen in your operation: legacy billing systems take many months to implement\?/);
});
test("competitive_intel: a weak point of the alternative is not listed as where it is ahead", async () => {
  const r = await call("competitive_intel", CI);
  const card = r.text.split(/\n(?=## Against )/)[1];
  assert.match(card, /take many months to implement/);
  assert.doesNotMatch(card, /may be ahead[^\n]*take many months to implement/);
});
test("competitive_intel: an objection is answered with the strength that answers it, or says plainly that none does; no bracket placeholder", async () => {
  const r = await call("competitive_intel", CI);
  assert.doesNotMatch(r.text, BRACKET);
  const h = r.text.split("## Objection handlers")[1];
  const golive = h.split('### "How long does it take to go live?"')[1].split("###")[0];
  assert.match(golive, /implementations that go live in weeks/);
  const erp = h.split('### "Does it integrate with our ERP?"')[1].split("###")[0];
  assert.match(erp, /accurate answer than a guess/);
  assert.match(r.text, /a fact that answers "Does it integrate with our ERP\?": a yes or no to this exact question/);
  const secure = h.split('### "Is it secure?"')[1].split("###")[0];
  assert.match(secure, /SOC 2 Type II/);
});
test("competitive_intel: the win rate table is not a table of 'not supplied'", async () => {
  const r = await call("competitive_intel", CI);
  assert.doesNotMatch(r.text, /\| not supplied \|/);
});

// ---------------------------------------------------------------------------------------------------------------------
// retention_playbook
test("retention_playbook: an enterprise contract with no reasons gets reasons that each have their own signal and intervention", async () => {
  const r = await call("retention_playbook", { customer_segment: "Banking and financial services (customers of Branchwire)", business_model: "enterprise_contract", current_churn_rate: "0.4% monthly (hypothetical)" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Check support tickets and usage data for mentions|Direct outreach to understand and address concern/);
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /Login frequency|We're sorry to see you go|Business model: software subscription/);
  assert.match(r.text, /\*\*In this segment:\*\* a renewal usually involves a vendor risk and security review/);
  const sig = [...r.text.matchAll(/\*\*Signals to look for:\*\*\n- (.*)/g)].map((m) => m[1]);
  assert.ok(sig.length >= 5);
  assert.equal(new Set(sig).size, sig.length, "no two reasons share a signal");
});
test("retention_playbook: the emails carry no bracket placeholder and the sector's proof is a note outside the email", async () => {
  const r = await call("retention_playbook", { customer_segment: "FMCG brands", business_model: "saas_subscription", current_churn_rate: "2% monthly", churn_reasons: "reps went back to paper, too expensive", product: "Shelfwalk", industry: "vertical_saas" });
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /Before you send:\*\* add a result only if you hold it/);
});
test("retention_playbook: a vertical SaaS sector gets its own churn reasons with their own signals", async () => {
  // run 21b: the reasons about reps and distributors are those of a field sales and distributor company, so the product names that kind of company
  const r = await call("retention_playbook", { customer_segment: "FMCG brands", business_model: "saas_subscription", current_churn_rate: "2% monthly", industry: "vertical_saas", product: "Shelfwalk, field sales automation and distributor management software" });
  assert.match(r.text, /Reps went back to old ways of capturing orders/);
  assert.match(r.text, /Orders captured in the app fall while distributors report orders by phone or paper/);
});

// ---------------------------------------------------------------------------------------------------------------------
// partner_architect
test("partner_architect: a referral program for large deals has no swag kit or self-serve portal, and names partner kinds for the sector", async () => {
  const r = await call("partner_architect", { company: "Vaultline", product: "Vaultline, cloud security posture management for CISOs", partner_model: "referral", partner_goals: "Partner-sourced pipeline among banks and government; no numeric target given", your_deal_size: "$80,000 ACV (hypothetical)", industry: "cybersecurity" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Swag kit|Self-serve portal/);
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /## Partners That Fit This Sector/);
  assert.match(r.text, /managed security service providers/);
  assert.doesNotMatch(r.text, /Enterprise deals justify white-glove/);
});
test("partner_architect: the goal is on a line of its own, not pasted into a KPI cell", async () => {
  const r = await call("partner_architect", { company: "Vaultline", product: "Vaultline", partner_model: "referral", partner_goals: "Partner-sourced pipeline among banks and government; no numeric target given", your_deal_size: "$80,000" });
  assert.match(r.text, /\*\*Your stated goal:\*\* "Partner-sourced pipeline among banks and government; no numeric target given"/);
  assert.doesNotMatch(r.text, /\| Set your target \|/);
  assert.match(r.text, /## Partners That Reach Your Segments/);
  assert.match(r.text, /risk and compliance consultancies/);
});

// ---------------------------------------------------------------------------------------------------------------------
// crisis_planner
test("crisis_planner: a sector's own crisis gets its own steps and audiences, and an outage is described for that sector", async () => {
  // run 21b: the outage at customer sites is the crisis of a connectivity provider, so the company text names that kind of company
  const r = await call("crisis_planner", { company: "Branchwire managed SD-WAN and network services", industry: "telecom", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.equal(r.isError, false);
  assert.match(r.text, /### Network outage across customer sites/);
  assert.match(r.text, /Customer network owners and CIOs/);
  assert.match(r.text, /a link or core network failure takes sites offline/);
  assert.doesNotMatch(r.text, BRACKET);
});
test("crisis_planner: a vulnerability and a customer data exposure each have their own steps, not a pointer to another section", async () => {
  const r = await call("crisis_planner", { company: "Vaultline", industry: "cybersecurity", customer_base: "b2b_enterprise", data_sensitivity: "high_pii_financial", potential_crises: "data_breach, security_vulnerability, customer_data_exposure" });
  assert.doesNotMatch(r.text, /Use the .* steps above/);
  assert.match(r.text, /### Security vulnerability/);
  assert.match(r.text, /Confirm and rate it/);
  assert.match(r.text, /### Customer data exposure/);
  assert.match(r.text, /Close the access/);
});
test("crisis_planner: the contacts table is blank cells to fill, not [Add]", async () => {
  const r = await call("crisis_planner", { company: "Vaultline", industry: "cybersecurity", customer_base: "b2b_enterprise", data_sensitivity: "medium_business_data" });
  assert.doesNotMatch(r.text, /\[Add\]/);
  assert.match(r.text, /Fill these in before a crisis/);
});

// ---------------------------------------------------------------------------------------------------------------------
// pmf_scorecard
test("pmf_scorecard: a services firm is not asked for an aha moment, and the next steps use its own figures", async () => {
  const r = await call("pmf_scorecard", { product: "Lanehop Services, managed IT services and a service desk for banks", target_market: "ites", current_metrics: "Annual contract value: $400,000, logo churn: 0.3% monthly, NPS: 35", customer_feedback: "Cut ticket backlog by 40% (hypothetical case result); the onboarding was slow" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /aha moment|activation event/i);
  assert.match(r.text, /does not apply to a services contract/);
  assert.match(r.text, /You gave an annual contract value of \$400,000/);
  assert.match(r.text, /\| Result \|/);
  assert.match(r.text, /FEEDBACK: fix the friction you named first/);
});
test("pmf_scorecard: the benchmark cell gives both marks, and a value on the mark says so", async () => {
  const r = await call("pmf_scorecard", { product: "Shelfwalk", target_market: "vertical_saas", current_metrics: "Churn: 1%, NPS: 41" });
  assert.match(r.text, /healthy up to 3%, excellent up to 1%/);
  assert.match(r.text, /1% is exactly at the excellent mark of 1%/);
  assert.doesNotMatch(r.text, /at or below the excellent mark of 1%/);
});
test("pmf_scorecard: an asset manager is not scored with customer-support automation measures", async () => {
  const r = await call("pmf_scorecard", { product: "Quantara, systematic investment strategies built with institutions", target_market: "other", current_metrics: "Annual contract value: $250,000, churn: 0.3% monthly, NPS: 40" });
  assert.doesNotMatch(r.text, /automated resolution rate|escalation rate|handling time/i);
  assert.doesNotMatch(r.text, /a investment/);
  assert.match(r.text, /assets under mandate|performance against the agreed benchmark/);
});

// ---------------------------------------------------------------------------------------------------------------------
// small text rules
test("acronyms keep their capitals when a sector objection or proof is lower-cased into a sentence", async () => {
  const r = await call("launch_commander", { product_feature: "Lanehop: last mile delivery route planning and dispatch for delivery fleets", launch_type: "feature_launch", target_segments: "Retail", goals: "ten hypothetical meetings", industry: "logistics_tech" });   // run 21b: the TMS objection belongs to the last mile sub-type, so the product names it
  assert.match(r.text, /we already have a TMS/);
  assert.doesNotMatch(r.text, /we already have a tms/);
  const p = await call("partner_architect", { company: "Vaultline", product: "Vaultline cloud security posture management", partner_model: "referral", partner_goals: "pipeline", your_deal_size: "$80,000", industry: "cybersecurity" });   // run 21b: the SIEM objection belongs to the cloud security sub-type, so the product is named
  assert.match(p.text, /integration with our SIEM and ticketing/);
  assert.match(p.text, /Subject: Referral partnership with Vaultline\n/);
});
test("a proof claim in the feedback is classified as proof, a quote as a quote, and friction as friction", async () => {
  const r = await call("pmf_scorecard", { product: "Lanehop", target_market: "logistics_tech", current_metrics: "Churn: 2%, NPS: 41", customer_feedback: "Cut cost per delivery by a fifth at one hub (hypothetical result); CIO of a retailer: the rollout was on time (customer quote); drivers say the app is slow to open" });
  assert.match(r.text, /\| Result \|/);
  assert.match(r.text, /\| Customer quote \|/);
  assert.match(r.text, /\| Friction \|/);
});

// ---------------------------------------------------------------------------------------------------------------------
// the reader as the tools use it: several trades in one product description, AI words with a security buyer
test("a product that lists network first and security later is read as the network trade (the one it names first, with two words of its own)", async () => {
  const r = await call("launch_commander", { product_feature: "Branchwire Fabric: network (SD-WAN, MPLS, private line), cloud, cyber security (managed detection and response, SOC, firewalls, zero trust), interactions (CPaaS, UCaaS)", launch_type: "feature_launch", target_segments: "Manufacturing, Banking", goals: "ten hypothetical meetings" });
  assert.match(r.text, /Sector: read from your inputs as telecom/);
});
test("a plan whose message uses AI words and whose buyer is a CISO with SOC analysts is a security plan, not an AI native one", async () => {
  const plan = "Vaultline go-to-market plan.\nGoal: ten hypothetical deals.\nAudience: security teams at global enterprises.\nBuyer roles: CISO, analysts in SOC and security operations.\nMessage: Vaultline uses AI agents that validate and prioritize findings.";
  const t = await call("craft_gtm_analyzer", { document_content: plan, document_type: "gtm_strategy" });
  assert.match(t.text, /Sector: read from your inputs as cybersecurity/);
});
test("a sector sentence with the word seats is reworded for a seller that is not a subscription", async () => {
  const r = await call("customer_interview_kit", { interview_type: "discovery", product_context: "Lanehop Engineering, software engineering services and managed services for developer teams", target_persona: "VP Engineering", business_model: "services" });
  assert.doesNotMatch(r.text, /\bseats\b/i);
});
