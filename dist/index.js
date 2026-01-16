#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const server = new index_js_1.Server({ name: "craft-gtm-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "pmf_scorecard",
            description: "Product-Market Fit Assessment: Generate comprehensive PMF scorecard with 5-dimension analysis (Market Demand 25%, Customer Satisfaction 25%, Competitive Position 20%, Product Performance 20%, Market Validation 10%), weighted scoring 0-100, gap identification, and 90-day action plan.",
            inputSchema: {
                type: "object",
                properties: {
                    product: { type: "string", description: "Product/service name and brief description" },
                    target_market: { type: "string", description: "Specific market segment you're targeting" },
                    current_metrics: { type: "string", description: "Key metrics: MRR, churn, NPS, CAC, LTV, growth rate" },
                    time_in_market: { type: "string", description: "How long since launch" },
                    customer_feedback: { type: "string", description: "Qualitative insights from customers" }
                },
                required: ["product", "target_market", "current_metrics"]
            }
        },
        {
            name: "launch_commander",
            description: "Launch Sequence Planner: Generate complete 12-week launch plan with week-by-week timeline (6 weeks pre-launch, launch week, 4 weeks post), hour-by-hour launch day schedule, channel coordination, RACI matrix, contingency plans, and success metrics dashboard.",
            inputSchema: {
                type: "object",
                properties: {
                    product_feature: { type: "string", description: "Product/feature being launched" },
                    launch_date: { type: "string", description: "Target launch date" },
                    target_segments: { type: "string", description: "Primary and secondary audience segments" },
                    channels: { type: "string", description: "Available channels: marketing, sales, PR, partners" },
                    goals: { type: "string", description: "Launch objectives and success metrics" },
                    budget: { type: "string", description: "Available budget" },
                    team: { type: "string", description: "Team members and roles" }
                },
                required: ["product_feature", "launch_date", "target_segments", "goals"]
            }
        },
        {
            name: "customer_interview_kit",
            description: "Customer Research Framework: Generate complete interview kit with 5-phase script, question bank by category (JTBD, pain points, value, competition, decisions), follow-up prompts, insight synthesis template, and cross-interview pattern analysis framework.",
            inputSchema: {
                type: "object",
                properties: {
                    research_objective: { type: "string", description: "What you're trying to learn" },
                    interview_type: { type: "string", description: "Type: discovery, validation, feedback, churn" },
                    customer_segment: { type: "string", description: "Specific persona/segment to interview" },
                    key_questions: { type: "string", description: "Primary research questions (2-3)" },
                    duration: { type: "string", description: "Target interview length" }
                },
                required: ["research_objective", "interview_type", "customer_segment"]
            }
        },
        {
            name: "retention_playbook",
            description: "Retention Strategy Framework: Generate comprehensive retention system with customer health score model (5 components, 100 points), intervention playbooks by segment (healthy/at-risk/critical), early warning alerts, save playbooks with email templates, and success metrics.",
            inputSchema: {
                type: "object",
                properties: {
                    customer_segment: { type: "string", description: "Customer segment to focus on" },
                    current_churn_rate: { type: "string", description: "Current churn rate and timeframe" },
                    churn_reasons: { type: "string", description: "Known primary churn factors" },
                    customer_lifecycle: { type: "string", description: "Typical journey stages" },
                    resources: { type: "string", description: "CS team size and tools" }
                },
                required: ["customer_segment", "current_churn_rate", "churn_reasons"]
            }
        },
        {
            name: "partner_architect",
            description: "Partner Program Framework: Design complete partner program with 4-tier structure (Registered→Silver→Gold→Platinum), commission model, enablement curriculum, recruitment playbook, joint business planning template, and success metrics.",
            inputSchema: {
                type: "object",
                properties: {
                    company: { type: "string", description: "Your company name" },
                    product: { type: "string", description: "Product/service for partnership" },
                    partner_goals: { type: "string", description: "What you want to achieve via partners" },
                    partner_types: { type: "string", description: "Types: resellers, integrations, referrals, agencies" },
                    current_partnerships: { type: "string", description: "Existing partnerships" },
                    resources: { type: "string", description: "Team and budget for partner program" }
                },
                required: ["company", "product", "partner_goals", "partner_types"]
            }
        },
        {
            name: "crisis_planner",
            description: "Crisis Response Framework: Generate crisis playbook with 4 severity levels, stakeholder communication matrix, response team structure, crisis-specific playbooks (security breach, outage, PR), statement templates, FAQ bank, and post-crisis review process.",
            inputSchema: {
                type: "object",
                properties: {
                    company: { type: "string", description: "Company name" },
                    industry: { type: "string", description: "Industry/sector" },
                    potential_crises: { type: "string", description: "Types: product issues, security, PR, operational" },
                    stakeholders: { type: "string", description: "Key stakeholders" },
                    spokesperson: { type: "string", description: "Who speaks for company" }
                },
                required: ["company", "industry", "potential_crises"]
            }
        },
        {
            name: "competitive_intel",
            description: "Competitive Intelligence Package: Generate battle cards per competitor, feature comparison matrix, win/loss framework, positioning map, trap questions, objection handlers, competitive response playbook, and monitoring system.",
            inputSchema: {
                type: "object",
                properties: {
                    your_product: { type: "string", description: "Your product name and description" },
                    market: { type: "string", description: "Target market" },
                    competitors: { type: "string", description: "3-5 key competitors (comma-separated)" },
                    your_differentiators: { type: "string", description: "Your unique value propositions" },
                    common_objections: { type: "string", description: "Objections in competitive deals" }
                },
                required: ["your_product", "market", "competitors", "your_differentiators"]
            }
        },
        {
            name: "craft_gtm_analyzer",
            description: "CRAFT Strategy Analyzer: Analyze any GTM strategy document against CRAFT principles (Character, Result, Artifact, Frame, Timeline). Returns CRAFT score 0-100, dimension assessment, gap analysis, and improvement recommendations.",
            inputSchema: {
                type: "object",
                properties: {
                    document_content: { type: "string", description: "Strategy document to analyze" },
                    document_type: { type: "string", description: "Type: GTM plan, launch plan, positioning" },
                    intended_audience: { type: "string", description: "Who will use this document" },
                    desired_outcome: { type: "string", description: "What it should achieve" }
                },
                required: ["document_content", "document_type"]
            }
        }
    ]
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = args;
    const tools = {
        pmf_scorecard: () => generatePMFScorecard(a),
        launch_commander: () => generateLaunchPlan(a),
        customer_interview_kit: () => generateInterviewKit(a),
        retention_playbook: () => generateRetentionPlaybook(a),
        partner_architect: () => generatePartnerProgram(a),
        crisis_planner: () => generateCrisisResponse(a),
        competitive_intel: () => generateCompetitiveIntel(a),
        craft_gtm_analyzer: () => analyzeCRAFT(a)
    };
    const output = tools[name]?.() || `Unknown tool: ${name}`;
    return { content: [{ type: "text", text: output }] };
});
function generatePMFScorecard(a) {
    return `# 🎯 PRODUCT-MARKET FIT SCORECARD

## Assessment: ${a.product}
**Target Market:** ${a.target_market}
**Time in Market:** ${a.time_in_market || "Not specified"}
**Date:** ${new Date().toISOString().split('T')[0]}

---

## CURRENT METRICS
${a.current_metrics}

## CUSTOMER FEEDBACK
${a.customer_feedback || "Not provided"}

---

# PMF ASSESSMENT (5 Dimensions)

## DIMENSION 1: MARKET DEMAND (Weight: 25%)

| Metric | Score (1-10) | Evidence | Benchmark |
|--------|--------------|----------|-----------|
| Organic Growth Rate | ___ | | >20% MoM = 9-10 |
| CAC Trend | ___ | | Decreasing = 9-10 |
| Referral % | ___ | | >40% = 9-10 |
| Inbound vs Outbound | ___ | | >60% inbound = 9-10 |
| Sales Cycle Trend | ___ | | Shortening = 9-10 |

**Dimension Score: ___ / 10**

---

## DIMENSION 2: CUSTOMER SATISFACTION (Weight: 25%)

| Metric | Score (1-10) | Evidence | Benchmark |
|--------|--------------|----------|-----------|
| NPS | ___ | | >50 = 9-10, >30 = 7-8 |
| Logo Retention | ___ | | >95% = 9-10 |
| Net Revenue Retention | ___ | | >120% = 9-10 |
| DAU/MAU | ___ | | >40% = 9-10 |
| Sean Ellis Test (Very Disappointed %) | ___ | | >40% = 9-10 |

**Dimension Score: ___ / 10**

---

## DIMENSION 3: COMPETITIVE POSITION (Weight: 20%)

| Metric | Score (1-10) | Evidence | Benchmark |
|--------|--------------|----------|-----------|
| Win Rate | ___ | | >50% = 9-10 |
| Differentiation Clarity | ___ | | Clear & valued = 9-10 |
| Pricing Power | ___ | | Can raise = 9-10 |
| Market Share Trend | ___ | | Growing = 9-10 |

**Dimension Score: ___ / 10**

---

## DIMENSION 4: PRODUCT PERFORMANCE (Weight: 20%)

| Metric | Score (1-10) | Evidence | Benchmark |
|--------|--------------|----------|-----------|
| Core Feature Adoption | ___ | | >70% = 9-10 |
| Time to Value | ___ | | <7 days = 9-10 |
| Activation Rate | ___ | | >80% = 9-10 |
| Expansion Revenue % | ___ | | >30% = 9-10 |

**Dimension Score: ___ / 10**

---

## DIMENSION 5: MARKET VALIDATION (Weight: 10%)

| Metric | Score (1-10) | Evidence | Benchmark |
|--------|--------------|----------|-----------|
| TAM Clarity | ___ | | Well-defined = 9-10 |
| Willingness to Pay | ___ | | Strong = 9-10 |
| LTV:CAC | ___ | | >5:1 = 9-10 |
| Scalable Channel | ___ | | Found & proven = 9-10 |

**Dimension Score: ___ / 10**

---

# PMF SUMMARY

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Market Demand | 25% | ___/10 | ___ |
| Customer Satisfaction | 25% | ___/10 | ___ |
| Competitive Position | 20% | ___/10 | ___ |
| Product Performance | 20% | ___/10 | ___ |
| Market Validation | 10% | ___/10 | ___ |
| **TOTAL** | **100%** | | **___/100** |

### Interpretation
- **80-100:** 🟢 Strong PMF - Scale aggressively
- **60-79:** 🟡 Emerging PMF - Optimize & accelerate
- **40-59:** 🟠 Early PMF - Focus on retention
- **20-39:** 🔴 Pre-PMF - Iterate value prop
- **0-19:** ⚫ No PMF - Pivot needed

---

# 90-DAY ACTION PLAN

## Days 1-30: Quick Wins
- [ ] 
- [ ] 
- [ ] 

## Days 31-60: Core Improvements
- [ ] 
- [ ] 

## Days 61-90: Strategic Initiatives
- [ ] 
- [ ] 

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generateLaunchPlan(a) {
    return `# 🚀 LAUNCH COMMANDER

## Launch: ${a.product_feature}
**Date:** ${a.launch_date} | **Segments:** ${a.target_segments}
**Channels:** ${a.channels || "Marketing, Sales, PR"}
**Budget:** ${a.budget || "TBD"} | **Team:** ${a.team || "TBD"}

## Goals
${a.goals}

---

# PRE-LAUNCH (Weeks -6 to -1)

## Week -6: Foundation
| Day | Task | Owner | Status |
|-----|------|-------|--------|
| Mon | Kickoff meeting, align team | PM | ☐ |
| Tue | Finalize messaging | Marketing | ☐ |
| Wed | Define success metrics | Analytics | ☐ |
| Thu | Sales enablement plan | Sales | ☐ |
| Fri | Stakeholder notifications | PM | ☐ |

## Week -5: Content Creation
| Task | Owner | Status |
|------|-------|--------|
| Landing page wireframe | Marketing | ☐ |
| Blog post draft | Content | ☐ |
| Email sequences (5) | Marketing | ☐ |
| Social posts (15) | Social | ☐ |
| Sales deck update | Sales | ☐ |

## Week -4: Finalization
| Task | Owner | Status |
|------|-------|--------|
| Landing page live (staging) | Dev | ☐ |
| Demo script finalized | Sales | ☐ |
| PR media list (50+) | PR | ☐ |
| Press release draft | PR | ☐ |
| Legal review | Legal | ☐ |

## Week -3: Enablement
| Task | Owner | Status |
|------|-------|--------|
| Sales training | Sales | ☐ |
| CS training | CS | ☐ |
| Product QA | Product | ☐ |
| Beta soft launch | PM | ☐ |
| Iterate on feedback | Product | ☐ |

## Week -2: Final Prep
| Task | Owner | Status |
|------|-------|--------|
| Press release final | PR | ☐ |
| Analyst briefings | PR | ☐ |
| Customer previews | CS | ☐ |
| All content approved | Marketing | ☐ |
| Launch rehearsal | PM | ☐ |

## Week -1: Ready
| Task | Owner | Status |
|------|-------|--------|
| All systems check | PM | ☐ |
| Exec update | PM | ☐ |
| Social scheduled | Social | ☐ |
| Emails armed | Marketing | ☐ |
| GO/NO-GO decision | PM | ☐ |

---

# LAUNCH DAY SCHEDULE

| Time | Activity | Owner | Channel |
|------|----------|-------|---------|
| 6 AM | Final systems check | Eng | Internal |
| 7 AM | Landing page live | Marketing | Web |
| 8 AM | Internal announcement | CEO | Slack |
| 9 AM | Customer email blast | Marketing | Email |
| 10 AM | Social media GO | Social | LinkedIn/Twitter |
| 10:30 AM | Press release | PR | Wire |
| 11 AM | Blog post live | Content | Blog |
| 12 PM | Partner notifications | Partners | Email |
| 2 PM | Founder LinkedIn post | CEO | LinkedIn |
| 4 PM | Paid campaigns ON | Marketing | Ads |
| 6 PM | Day 1 metrics review | PM | Internal |

---

# POST-LAUNCH (Weeks +1 to +4)

## Week +1: Monitor & Optimize
- Daily metrics review
- A/B testing
- User feedback collection
- Sales pipeline review

## Week +2: Amplify
- Case study development
- Customer testimonials
- Content repurposing
- Paid optimization

## Week +3: Expand
- New channel testing
- Segment expansion
- Feature feedback integration

## Week +4: Report
- Full retrospective
- ROI calculation
- Playbook documentation
- Executive report

---

# SUCCESS METRICS

| Metric | Goal | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|------|--------|--------|--------|--------|
| Website visits | | | | | |
| Sign-ups | | | | | |
| Demos booked | | | | | |
| Pipeline created | | | | | |
| Deals closed | | | | | |

---

# CONTINGENCY PLANS

| Risk | Trigger | Response | Owner |
|------|---------|----------|-------|
| Product bugs | Critical issues | Rollback + hotfix | Eng |
| Low engagement | <50% targets | Activate backup channels | Marketing |
| Negative PR | Bad coverage | Prepared statement | PR |
| Sales not ready | Low conversion | Emergency training | Sales |

---

# RACI MATRIX

| Activity | PM | Marketing | Sales | CS | Product | PR |
|----------|-----|-----------|-------|-----|---------|-----|
| Strategy | A | R | C | C | C | C |
| Messaging | C | A | C | I | R | I |
| Enablement | I | C | A | C | R | I |
| Press | C | C | I | I | I | A |
| Customer comms | C | R | I | A | I | I |

**R**=Responsible **A**=Accountable **C**=Consulted **I**=Informed

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generateInterviewKit(a) {
    return `# 🎤 CUSTOMER INTERVIEW KIT

## Research Overview
**Objective:** ${a.research_objective}
**Type:** ${a.interview_type}
**Segment:** ${a.customer_segment}
**Duration:** ${a.duration || "45 minutes"}

## Key Questions
${a.key_questions || "To be defined"}

---

# PRE-INTERVIEW CHECKLIST

- [ ] Research customer's company (website, LinkedIn)
- [ ] Review previous interactions (support, NPS)
- [ ] Note their usage/plan level
- [ ] Prepare 2-3 hypotheses to test
- [ ] Recording consent ready
- [ ] Note template ready

---

# INTERVIEW SCRIPT

## PHASE 1: OPENING (5 min)

**Rapport:**
> "Hi [Name], thank you for taking time to speak with me today."

**Context:**
> "We're trying to learn: **${a.research_objective}**. There are no right or wrong answers - honest feedback helps us improve."

**Consent:**
> "May I record this for my notes? It won't be shared externally."

---

## PHASE 2: BACKGROUND (10 min)

| Question | Notes |
|----------|-------|
| "Tell me about your role. What does a typical day look like?" | |
| "What are your main goals or KPIs?" | |
| "Walk me through how you currently handle [relevant process]." | |
| "What tools do you use today?" | |

---

## PHASE 3: ${a.interview_type.toUpperCase()} DEEP DIVE (20 min)

${a.interview_type === 'discovery' ? `
### Problem Exploration
| Question | Notes |
|----------|-------|
| "What's the most frustrating part about [area]?" | |
| "Tell me about a recent time this problem impacted you." | |
| "If you could wave a magic wand, what would you fix?" | |
| "How much time do you spend on [problem] weekly?" | |
| "What have you tried before? Why didn't it work?" | |

### Solution Exploration
| Question | Notes |
|----------|-------|
| "Describe your ideal solution." | |
| "What would success look like?" | |
| "What constraints would you work within?" | |
| "Who else would be involved in a decision?" | |
` : a.interview_type === 'validation' ? `
### Concept Reaction
| Question | Notes |
|----------|-------|
| "Based on what I described, what's your reaction?" | |
| "What excites you? What concerns you?" | |
| "On 1-10, how interested are you? Why?" | |
| "What would make it a 10?" | |
| "Would you use this if it existed today?" | |
` : a.interview_type === 'feedback' ? `
### Product Experience
| Question | Notes |
|----------|-------|
| "How would you describe your experience with [product]?" | |
| "What's working well?" | |
| "What's not working as hoped?" | |
| "Which features do you use most? Least?" | |
| "What's missing that would add value?" | |
` : `
### Churn Understanding
| Question | Notes |
|----------|-------|
| "Walk me through your decision to leave." | |
| "When did you first think about leaving?" | |
| "What was the final trigger?" | |
| "What are you using instead?" | |
| "What would have made you stay?" | |
`}

---

## PHASE 4: WRAP-UP (5 min)

| Question | Notes |
|----------|-------|
| "Anything else helpful to know?" | |
| "Questions for me?" | |
| "Know anyone else who'd chat with us?" | |

**Close:** "Thank you! I'll follow up with [next step]."

---

# FOLLOW-UP PROMPTS

Use when you need more depth:

- "Tell me more about that..."
- "Can you give a specific example?"
- "What do you mean by [term]?"
- "How did that make you feel?"
- "What happened next?"
- "How often does that happen?"

---

# QUESTION BANK

## Jobs-to-be-Done
- "When you [task], what are you trying to achieve?"
- "What triggers you to start this?"
- "What does success look like?"

## Pain Points
- "What's the hardest part?"
- "What workarounds have you created?"
- "What do you dread?"

## Value
- "What would it be worth to solve this?"
- "How would solving this impact you?"

## Competition
- "What alternatives have you tried?"
- "What do you like about [competitor]?"

## Decisions
- "Who's involved in decisions like this?"
- "What's your evaluation process?"
- "What would make this a no-brainer?"

---

# SYNTHESIS TEMPLATE

## Interview Details
**Participant:** 
**Company:** 
**Role:** 
**Date:** 

## Top 3 Insights
1. **Finding:** / **Evidence:** / **Implication:**
2. **Finding:** / **Evidence:** / **Implication:**
3. **Finding:** / **Evidence:** / **Implication:**

## Key Quotes
| Quote | Context | Theme |
|-------|---------|-------|
| | | |
| | | |

## Pain Points
| Pain | Severity (1-5) | Frequency | Quote |
|------|----------------|-----------|-------|
| | | | |

## Opportunities
1. 
2. 
3. 

## Actions
- [ ] 
- [ ] 

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generateRetentionPlaybook(a) {
    return `# 🔄 RETENTION PLAYBOOK

## Overview
**Segment:** ${a.customer_segment}
**Current Churn:** ${a.current_churn_rate}
**Resources:** ${a.resources || "Not specified"}

## Known Churn Factors
${a.churn_reasons}

## Lifecycle
${a.customer_lifecycle || "Onboarding → Adoption → Expansion → Renewal"}

---

# CUSTOMER HEALTH SCORE (100 Points)

| Component | Weight | Healthy (8-10) | At-Risk (4-7) | Critical (1-3) |
|-----------|--------|----------------|---------------|----------------|
| **Usage** | 30% | >60% DAU/MAU | 30-60% | <30% |
| **Engagement** | 25% | Weekly+ logins | Monthly | <Monthly |
| **Support** | 15% | Low/Positive | Moderate | High/Negative |
| **Value** | 20% | Exceeding goals | Meeting | Below |
| **Relationship** | 10% | NPS 9-10 | NPS 7-8 | NPS <7 |

**Formula:** (Usage×0.30) + (Engagement×0.25) + (Support×0.15) + (Value×0.20) + (Relationship×0.10)

### Score Interpretation
| Score | Status | Action |
|-------|--------|--------|
| 80-100 | 🟢 Healthy | Expansion opportunity |
| 60-79 | 🟡 Stable | Monitor & nurture |
| 40-59 | 🟠 At-Risk | Intervention needed |
| 20-39 | 🔴 Critical | Immediate action |
| 0-19 | ⚫ Emergency | Executive escalation |

---

# 🟢 HEALTHY PLAYBOOK (80-100)

**Goal:** Expand & Create Advocates

| Trigger | Action | Owner | Timeline |
|---------|--------|-------|----------|
| Score >80 for 30 days | Expansion discovery call | CSM | 2 weeks |
| NPS 9-10 | Request testimonial | Marketing | 1 week |
| Power user | Invite to beta/advisory | Product | Ongoing |
| Renewal T-90 | Early renewal discussion | CSM | At T-90 |

### Expansion Actions
1. Review usage for upsell opportunities
2. Identify adjacent use cases
3. Calculate & present ROI
4. Propose multi-year expansion

---

# 🟠 AT-RISK PLAYBOOK (40-59)

**Goal:** Re-engage & Recover

| Trigger | Action | Owner | Timeline |
|---------|--------|-------|----------|
| Score <60 | Alert to CSM | System | Immediate |
| No login 14 days | Re-engagement email | CSM | 24 hours |
| Tickets increasing | Proactive call | CSM | 48 hours |
| Adoption <40% | Training session | CSM | 1 week |

### 14-Day Recovery Plan
- **Day 1:** Assess account, identify root cause
- **Day 2:** Personalized outreach
- **Day 3-5:** Discovery call, document issues
- **Day 7:** Present recovery plan
- **Day 10:** Progress check
- **Day 14:** Re-assess score

### Re-engagement Email
> Subject: Quick check-in, [Name]
> 
> I noticed your team's usage has dropped, and wanted to reach out personally.
> 
> I'm here to help - whether it's training, workflow optimization, or connecting you with resources.
> 
> 15 minutes this week?

---

# 🔴 CRITICAL PLAYBOOK (20-39)

**Goal:** Save the Account

| Trigger | Action | Owner | Timeline |
|---------|--------|-------|----------|
| Score <40 | Escalate to Manager | System | Immediate |
| No login 30 days | Executive outreach | VP CS | 24 hours |
| Cancellation mentioned | Save Team activated | Save Team | Immediate |
| NPS <7 | Director call | Director | 24 hours |

### Save Protocol
- **Hour 1:** Emergency account review
- **Hour 4:** Internal war room
- **Day 1:** Executive outreach
- **Day 2:** Crisis meeting with customer
- **Day 3:** Execute rescue plan
- **Day 7:** Progress review
- **Day 14:** Decision point

### Executive Save Email
> Subject: Personal note from [Title]
> 
> I understand your experience hasn't met expectations. Your success matters to me personally.
> 
> I'd like 20 minutes to understand what went wrong and how we can make it right.
> 
> [Time options]?

---

# EARLY WARNING ALERTS

| Alert | Trigger | Priority | SLA |
|-------|---------|----------|-----|
| Usage Drop | >30% decrease WoW | 🔴 High | 24hr |
| Login Absence | 14+ days | 🔴 High | 24hr |
| Support Spike | >3 tickets/week | 🟠 Medium | 48hr |
| NPS Decline | Passive/Detractor | 🔴 High | 24hr |
| Champion Exit | Contact departed | 🔴 Critical | 4hr |
| Renewal Risk | T-60 + score <70 | 🔴 Critical | 4hr |

---

# ONBOARDING EXCELLENCE (Days 1-30)

| Day | Milestone | Action | Success Metric |
|-----|-----------|--------|----------------|
| 0 | Signed | Welcome email | Kickoff scheduled |
| 3 | Kickoff | Live call | Goals documented |
| 7 | First Win | Guide to value | Feature activated |
| 14 | Progress | Check-in | On track |
| 21 | Training | Session | Adoption >50% |
| 30 | Review | Completion | Score >70 |

---

# SUCCESS METRICS

## Leading (Weekly)
| Metric | Target | Current |
|--------|--------|---------|
| Avg Health Score | >75 | |
| % Healthy | >70% | |
| % At-Risk | <15% | |
| % Critical | <5% | |

## Lagging (Monthly)
| Metric | Target | Current |
|--------|--------|---------|
| Logo Retention | >90% | |
| Net Revenue Retention | >110% | |
| Time to Value | <14 days | |

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generatePartnerProgram(a) {
    return `# 🤝 PARTNER PROGRAM

## Overview
**Company:** ${a.company}
**Product:** ${a.product}
**Goals:** ${a.partner_goals}
**Types:** ${a.partner_types}
**Current:** ${a.current_partnerships || "None"}
**Resources:** ${a.resources || "TBD"}

---

# TIER STRUCTURE

## 🥉 REGISTERED
| Aspect | Details |
|--------|---------|
| Requirements | Agreement signed, basic cert (2-4 hrs), first opportunity |
| Commission | 10% first-year |
| Deal Protection | 14 days |
| Support | Partner email |
| Marketing | Standard kit |

## 🥈 SILVER
| Aspect | Details |
|--------|---------|
| Requirements | 3+ deals, $50K revenue, 2 certified staff, business plan |
| Commission | 15% first-year |
| Deal Protection | 30 days |
| Co-Marketing | $2,500/quarter |
| Support | Dedicated desk |
| Leads | Qualified sharing |

## 🥇 GOLD
| Aspect | Details |
|--------|---------|
| Requirements | 10+ deals, $200K revenue, 5 certified, named PAM |
| Commission | 20% first-year |
| Deal Protection | 60 days |
| Co-Marketing | $10,000/quarter |
| MDF | Access granted |
| Support | Named PAM |
| Events | Speaking opportunities |

## 💎 PLATINUM
| Aspect | Details |
|--------|---------|
| Requirements | 25+ deals, $500K revenue, 10 certified, exec sponsor |
| Commission | 25% + accelerators |
| Deal Protection | 90 days |
| Co-Marketing | Custom programs |
| MDF | Dedicated budget |
| Support | Exec sponsor + PAM |
| Product | Early access + roadmap input |

---

# ECONOMICS

## Commission Table
| Tier | New | Renewal | Upsell | Multi-Year |
|------|-----|---------|--------|------------|
| Registered | 10% | 5% | 8% | +2% |
| Silver | 15% | 8% | 12% | +3% |
| Gold | 20% | 10% | 15% | +5% |
| Platinum | 25% | 12% | 20% | +7% |

## Accelerators
| Achievement | Bonus |
|-------------|-------|
| Exceed quota 25%+ | +5% all deals |
| New vertical logo | +10% that deal |
| Enterprise (>$100K) | +3% |
| 3-year contract | +5% |
| Reference secured | $500 |
| Case study | $1,000 |

---

# ENABLEMENT

## Sales Certification (Required)
| Module | Duration |
|--------|----------|
| Product Overview | 45 min |
| ICP & Value Prop | 45 min |
| Discovery | 1 hr |
| Demo Certification | 2 hrs |
| Competitive | 45 min |
| Pricing | 30 min |
| **Assessment** | 1 hr (80% pass) |

## Technical Certification
| Module | Duration |
|--------|----------|
| Architecture | 2 hrs |
| Implementation | 3 hrs |
| Integrations | 2 hrs |
| Troubleshooting | 1 hr |
| **Assessment** | 2 hrs practical |

---

# RECRUITMENT

## Ideal Partner Profile
| Criteria | Priority |
|----------|----------|
| Complementary focus | Must-have |
| Access to ICP | Must-have |
| 10-500 employees | Preferred |
| Target geography | Must-have |
| Technical capability | Important |

## Process
| Stage | Timeline | Exit Criteria |
|-------|----------|---------------|
| Prospect | Ongoing | Meets IPP |
| Outreach | Day 1 | Response |
| Discovery | Day 7 | Mutual interest |
| Evaluation | Day 14 | Capability confirmed |
| Proposal | Day 21 | Terms agreed |
| Contract | Day 35 | Signed |
| Onboarding | Day 45 | First cert |
| Activation | Day 60 | First deal |

---

# JOINT BUSINESS PLAN

## Annual Template

| Goal | Metric | Target | ${a.company} Support |
|------|--------|--------|---------------------|
| Revenue | Influenced | $ | |
| Deals | Closed | # | |
| Pipeline | Generated | $ | |
| Certs | Staff | # | |
| Marketing | Activities | # | |

## Review Cadence
- **Weekly:** Pipeline review (PAM + Partner Sales)
- **Monthly:** Business review (PAM + Partner Lead)
- **Quarterly:** Executive review
- **Annual:** Planning session

---

# SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Active Partners | |
| Partner-Sourced Pipeline | 30% |
| Partner-Influenced Revenue | 40% |
| Partner NPS | >50 |
| Certification Rate | >80% |
| Partner Retention | >85% |

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generateCrisisResponse(a) {
    return `# 🚨 CRISIS RESPONSE PLANNER

## Overview
**Company:** ${a.company}
**Industry:** ${a.industry}
**Spokesperson:** ${a.spokesperson || "CEO"}
**Stakeholders:** ${a.stakeholders || "Customers, employees, investors, media"}

## Potential Crises
${a.potential_crises}

---

# SEVERITY LEVELS

| Level | Name | Definition | Response Time | Authority |
|-------|------|------------|---------------|-----------|
| 1 | 🟢 Minor | Isolated, limited impact | 4 hours | Team lead |
| 2 | 🟡 Moderate | Notable, growing attention | 1 hour | Director |
| 3 | 🔴 Severe | Major, widespread impact | 15 minutes | Executive |
| 4 | ⚫ Critical | Existential threat | Immediate | CEO + Board |

---

# STAKEHOLDER MATRIX

| Stakeholder | Channel | Timeline | Owner | Key Message |
|-------------|---------|----------|-------|-------------|
| Employees | Slack + Email | First (15 min) | CEO | Facts, guidance |
| Affected Customers | Email + In-app | 30 min | CS | Impact, actions |
| All Customers | Email | 2 hours | Marketing | What we know/doing |
| Investors | Phone + Email | 1 hour | CEO | Situation, outlook |
| Partners | Email + Call | 2 hours | Partners | Impact, support |
| Media | Press release | After internal | PR | Official statement |
| Regulators | Formal notice | As required | Legal | Compliance |

---

# RESPONSE TEAM

| Role | Primary | Backup | Responsibility |
|------|---------|--------|----------------|
| Crisis Commander | CEO | COO | Decisions, board comms |
| Comms Lead | PR | Marketing | External messaging |
| Ops Lead | CTO | VP Eng | Technical response |
| Customer Lead | VP CS | CS Director | Customer comms |
| Legal | GC | Outside counsel | Legal guidance |
| People Lead | VP HR | HR Director | Employee support |

---

# ACTIVATION PROTOCOL

## First 15 Minutes
1. ☐ Confirm incident (not false alarm)
2. ☐ Determine severity (1-4)
3. ☐ Identify impact scope
4. ☐ Document initial facts
5. ☐ Alert Crisis Commander
6. ☐ Activate team
7. ☐ Open war room
8. ☐ Begin containment

---

# TEMPLATES

## Initial Acknowledgment (30 min)

### Internal
> Team,
> 
> We're aware of [issue] and actively working to resolve it.
> 
> **What we know:** [facts]
> **What we're doing:** [actions]
> **What we need:** Direct inquiries to [Comms Lead], no social posts
> 
> Update by [time].

### External
> We're aware of [issue] and working to resolve it.
> 
> **Status:** [status]
> **Expected resolution:** [timeline]
> 
> We apologize for any inconvenience. Updates at [status page].

## Status Update
> **Status:** [Investigating/Identified/Fixing/Resolved]
> **What we know:** [updated info]
> **What we've done:** [actions]
> **Next update:** [time]

## Resolution
> [Issue] has been **resolved** as of [time].
> 
> **What happened:** [explanation]
> **Impact:** [scope, duration]
> **Prevention:** [measures]
> 
> Thank you for your patience.

## Executive Apology (Severe)
> I'm writing personally regarding [issue].
> 
> I sincerely apologize. [acknowledgment]
> 
> **What happened:** [honest explanation]
> **What we're doing:** [immediate/short-term/long-term]
> 
> I take personal responsibility. [commitment]
> 
> [Name], [Title]

---

# CRISIS PLAYBOOKS

## 🔐 Security Breach
**Hour 0-1:** Contain, notify legal, preserve evidence
**Hour 1-4:** Assess scope, brief execs, prep notifications
**Day 1:** Customer notification, support surge
**Day 2-7:** Ongoing comms, remediation

**Must Include:** What happened, data affected, what we're doing, what you should do, how to get help

## ⚠️ Service Outage
**0-15 min:** Confirm scope, activate eng, update status page
**15-60 min:** Root cause, customer notification
**Ongoing:** Updates every 30 min, social monitoring
**Post:** RCA, post-mortem, prevention

## 📰 Negative PR
**Assess:** Source credibility, accuracy, spread potential
**Options:** Request correction (if false), provide context (if unfair), acknowledge (if true), ignore (if minor)
**Protocol:** Don't rush, gather facts, legal review, one voice

---

# FAQ BANK

| Question | Answer Framework |
|----------|------------------|
| What happened? | [Factual, honest, appropriate detail] |
| When did you know? | [Timeline - be honest] |
| How many affected? | [Numbers when known] |
| What are you doing? | [Concrete actions] |
| How prevent future? | [Specific measures] |
| Who do I contact? | [Dedicated channel] |

---

# POST-CRISIS

## Debrief (Within 72 hrs)
1. Timeline reconstruction (20 min)
2. Response effectiveness (15 min)
3. Communication review (15 min)
4. What worked/didn't (20 min)
5. Action items (15 min)

## Documentation
- [ ] Complete timeline
- [ ] All communications
- [ ] Customer feedback
- [ ] Media coverage
- [ ] Lessons learned
- [ ] Updated procedures

---

# READINESS CHECKLIST

## Quarterly
- [ ] Contact lists updated
- [ ] Templates reviewed
- [ ] Team confirmed
- [ ] Channels tested
- [ ] Legal requirements reviewed

## Annual
- [ ] Crisis simulation
- [ ] Full playbook review
- [ ] Team training
- [ ] Board briefing

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function generateCompetitiveIntel(a) {
    const competitors = a.competitors.split(',').map(c => c.trim()).slice(0, 5);
    return `# ⚔️ COMPETITIVE INTELLIGENCE

## Overview
**Your Product:** ${a.your_product}
**Market:** ${a.market}
**Differentiators:** ${a.your_differentiators}
**Competitors:** ${competitors.join(', ')}

## Common Objections
${a.common_objections || "Not specified"}

---

# POSITIONING MAP

\`\`\`
              ENTERPRISE
                  │
    ${competitors[0] || 'Comp A'}    │    ${competitors[1] || 'Comp B'}
         ★        │        ★
                  │
  LOW PRICE ──────┼────── HIGH PRICE
                  │
         ★        │        ★
    ${competitors[2] || 'Comp C'}    │    YOUR PRODUCT
                  │
                SMB
\`\`\`

---

# BATTLE CARDS

${competitors.map((comp, i) => `
## ${comp.toUpperCase()}

### Quick Facts
| Attribute | Details |
|-----------|---------|
| Company | ${comp} |
| Founded | [Research] |
| Funding | [Research] |
| Employees | [Research] |
| Pricing | [Research] |

### Strengths ✅
1. 
2. 
3. 

### Weaknesses ❌
1. 
2. 
3. 

### When We WIN
| Scenario | Why |
|----------|-----|
| | |
| | |

### When We LOSE
| Scenario | Why |
|----------|-----|
| | |

### Trap Questions
> Ask prospects these to expose ${comp}'s weaknesses:

1. "Have you asked ${comp} about [weakness area]?"
2. "How important is [your strength] to your decision?"
3. "What's ${comp}'s approach to [your advantage area]?"

### Objection Handlers
| They Say | You Say |
|----------|---------|
| "${comp} is cheaper" | "Let's compare TCO including [hidden costs]. Plus [your value]." |
| "${comp} is market leader" | "Often means legacy tech. We're chosen for [modern advantage]." |
| "${comp} has feature X" | "Have you seen how [your approach] delivers [better outcome]?" |
`).join('\n')}

---

# FEATURE MATRIX

| Capability | ${a.your_product.split(' ')[0]} | ${competitors.slice(0, 3).join(' | ')} |
|------------|---|${competitors.slice(0, 3).map(() => '---|').join('')}
| Core Feature 1 | ✅ | | | |
| Core Feature 2 | ✅ | | | |
| ${a.your_differentiators.split(',')[0]?.trim() || 'Differentiator'} | ✅ | ❌ | ❌ | ❌ |

✅ = Full | ⚠️ = Partial | ❌ = None

---

# WIN/LOSS ANALYSIS

## Track Every Deal
| Date | Opportunity | Competitor | Result | Primary Reason |
|------|-------------|------------|--------|----------------|
| | | | Win/Loss | |

## Patterns
**We Win When:**
1. 
2. 
3. 

**We Lose When:**
1. 
2. 
3. 

---

# COMPETITIVE RESPONSE

## When They Launch Feature
1. Assess actual vs. marketed capability
2. Update battle cards
3. Brief sales team
4. Prepare talking points

## When They Drop Price
1. Analyze sustainability
2. Emphasize value, not price
3. ROI calculation ready

## When They Get Funding
1. Monitor strategy changes
2. Customer retention outreach
3. Prepare for increased competition

---

# SALES TALK TRACKS

## Opening Differentiator
> "What sets us apart is ${a.your_differentiators}. Unlike [competitors], we [specific difference]."

## Competitive Pivot
> "I know you're looking at [Competitor]. Many customers evaluated them too. They found [key differentiator]. Want to understand our approach?"

## Price Response
> "Budget matters. Consider total value: [ROI factors, hidden costs, time savings]. Want an ROI analysis?"

---

# MONITORING

## Weekly
- [ ] Competitor website changes
- [ ] New case studies
- [ ] Job postings (indicates priorities)
- [ ] Social activity

## Monthly
- [ ] Pricing changes
- [ ] Feature releases
- [ ] Customer wins/losses
- [ ] Executive changes

## Tools
- Google Alerts (company names)
- LinkedIn (company follows)
- G2/Capterra (reviews)
- BuiltWith (customer tracking)

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
function analyzeCRAFT(a) {
    return `# 🔍 CRAFT STRATEGY ANALYZER

## Document Analyzed
**Type:** ${a.document_type}
**Audience:** ${a.intended_audience || "Not specified"}
**Desired Outcome:** ${a.desired_outcome || "Not specified"}

---

## DOCUMENT EXCERPT
\`\`\`
${a.document_content.substring(0, 500)}${a.document_content.length > 500 ? '...' : ''}
\`\`\`

---

# CRAFT ASSESSMENT

## C - CHARACTER (Who executes?)
| Criteria | Score (1-10) | Notes |
|----------|--------------|-------|
| Role clarity | ___ | Is the executor defined? |
| Responsibilities | ___ | Are tasks assigned? |
| Expertise level | ___ | Is skill level appropriate? |

**C Score: ___ / 10**

**Assessment:**
- [ ] Executor role defined
- [ ] Skills specified
- [ ] Accountability clear

**Recommendations:**


---

## R - RESULT (What's the outcome?)
| Criteria | Score (1-10) | Notes |
|----------|--------------|-------|
| Goal specificity | ___ | Are goals specific? |
| Measurability | ___ | Can success be measured? |
| Success criteria | ___ | Is success defined? |

**R Score: ___ / 10**

**Assessment:**
- [ ] Goals are specific
- [ ] KPIs identified
- [ ] Success defined

**Recommendations:**


---

## A - ARTIFACT (What gets produced?)
| Criteria | Score (1-10) | Notes |
|----------|--------------|-------|
| Deliverables | ___ | Are outputs defined? |
| Format | ___ | Is format specified? |
| Quality standards | ___ | Are standards set? |

**A Score: ___ / 10**

**Assessment:**
- [ ] Deliverables listed
- [ ] Formats specified
- [ ] Quality criteria set

**Recommendations:**


---

## F - FRAME (What's the context?)
| Criteria | Score (1-10) | Notes |
|----------|--------------|-------|
| Audience | ___ | Is audience defined? |
| Constraints | ___ | Are limitations noted? |
| Context | ___ | Is background sufficient? |

**F Score: ___ / 10**

**Assessment:**
- [ ] Audience clear
- [ ] Constraints documented
- [ ] Context complete

**Recommendations:**


---

## T - TIMELINE (What are the steps?)
| Criteria | Score (1-10) | Notes |
|----------|--------------|-------|
| Sequence | ___ | Is there a clear flow? |
| Milestones | ___ | Are checkpoints defined? |
| Iteration | ___ | Is review planned? |

**T Score: ___ / 10**

**Assessment:**
- [ ] Sequence clear
- [ ] Milestones defined
- [ ] Iteration approach set

**Recommendations:**


---

# CRAFT SUMMARY

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Character | ___/10 | 20% | ___ |
| Result | ___/10 | 25% | ___ |
| Artifact | ___/10 | 20% | ___ |
| Frame | ___/10 | 20% | ___ |
| Timeline | ___/10 | 15% | ___ |
| **TOTAL** | | **100%** | **___/100** |

### Interpretation
- **80-100:** Excellent - Ready for execution
- **60-79:** Good - Minor refinements
- **40-59:** Fair - Significant gaps
- **20-39:** Poor - Major rework
- **0-19:** Incomplete - Start over

---

# GAP ANALYSIS

## Critical Gaps (Must Fix)
1. 
2. 
3. 

## Important Gaps (Should Fix)
1. 
2. 

---

# RECOMMENDED STRUCTURE

## 1. CHARACTER Section
[Add: Who executes, skills needed, accountability]

## 2. RESULT Section
[Add: Specific goals, KPIs, success definition]

## 3. ARTIFACT Section
[Add: Deliverables list, formats, quality criteria]

## 4. FRAME Section
[Add: Audience, constraints, context]

## 5. TIMELINE Section
[Add: Sequence, milestones, review points]

---
*Generated by CRAFT GTM MCP | gtmexpert.com*`;
}
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("CRAFT GTM MCP Server running");
}
main().catch(console.error);
//# sourceMappingURL=index.js.map