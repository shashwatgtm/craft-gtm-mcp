import { parseListItems, describeChoice, readableChoice, EXAMPLE_FIGURE, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, q, andList, cleanCompanyName } from './context.js';
import { playbookFor } from './sector-playbooks.js';
import type { VerticalId } from './verticals.ts';

// Run 20: extra people on the response team by sector (roles, never names).
const SECTOR_ROLES: Partial<Record<VerticalId, string[]>> = {
  'logistics-tech': ['Head of Operations (customer hubs and dispatch)', 'Driver app support lead'],
  fintech: ['Finance operations lead', 'Head of Compliance'],
  'vertical-saas': ['Head of Customer Operations', 'Distributor integrations lead'],
  'ai-native': ['Data and AI lead', 'Head of Model Evaluation'],
  ites: ['Delivery head', 'Account owners for the affected clients'],
  telecom: ['Network operations centre lead', 'Field engineering lead'],
  cybersecurity: ['Head of Threat Research', 'Product security lead'],
  software: ['Engineering on-call lead', 'Developer relations lead'],
}

// Default crises by industry (run 19, D80: the owner's verticals; no health-sector crisis types)
const DEFAULT_CRISES: Record<string, string[]> = {
  fintech: ['data_breach', 'service_outage', 'fraud_incident', 'regulatory_action'],
  saas: ['service_outage', 'data_breach', 'security_vulnerability', 'customer_data_exposure'],
  logistics_tech: ['service_outage', 'data_breach', 'sla_breach', 'regulatory_action'],
  vertical_saas: ['service_outage', 'data_breach', 'customer_data_exposure', 'regulatory_action'],
  ai_native: ['ai_wrong_action', 'data_breach', 'service_outage', 'regulatory_action'],
  ites: ['sla_breach', 'data_breach', 'service_outage', 'executive_departure'],
  telecom: ['service_outage', 'sla_breach', 'security_vulnerability', 'regulatory_action'],
  software: ['security_vulnerability', 'service_outage', 'data_breach', 'pr_incident'],
  cybersecurity: ['security_vulnerability', 'data_breach', 'service_outage', 'pr_incident'],
  ecommerce: ['service_outage', 'payment_breach', 'supply_chain_failure', 'pr_incident'],
  enterprise: ['data_breach', 'service_outage', 'executive_departure', 'regulatory_action'],
  consumer: ['pr_incident', 'product_safety', 'data_breach', 'service_outage'],
  other: ['service_outage', 'data_breach', 'pr_incident', 'executive_departure']
};

export function generateCrisisPlanner(args: {
  company: string;
  industry: string;
  customer_base: string;
  data_sensitivity: string;
  potential_crises?: string;
  company_size?: string;
  compliance_requirements?: string;
  business_model?: string;
}): string {
  const companySize = args.company_size || 'scaleup_50_200';
  const customerBase = args.customer_base;
  const dataSensitivity = args.data_sensitivity;
  const compliance = args.compliance_requirements || '';
  // Run 19 (D80): each compliance item you list is named in the steps that need it; the tool names no authority of its own.
  const complianceItems = parseListItems(compliance);
  const complianceText = complianceItems.length ? andList(complianceItems) : '';
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [cleanCompanyName(args.company)], context: [args.potential_crises, compliance] });
  const pb = ctx.v ? playbookFor(ctx.v) : null;
  
  // Use provided crises or suggest defaults based on industry
  let crises: string[];
  let crisesNote = '';
  
  if (args.potential_crises) {
    crises = parseListItems(args.potential_crises);
  } else {
    // A copy, so adding data_breach below never changes the shared default list for later calls on the same server.
    crises = [...(DEFAULT_CRISES[args.industry] || DEFAULT_CRISES.other)];
    // Run 20: the sector's own crises come first (a dispatch outage with vehicles on the road, a missed detection, a client delivery failure ...)
    if (pb) for (const c of pb.crises.slice(0, 2)) if (!crises.includes(c.key)) crises.unshift(c.key);
    crises = crises.slice(0, 5);
    // Add data breach as priority if high sensitivity
    if (dataSensitivity === 'high_pii_financial' && !crises.includes('data_breach')) {
      crises.unshift('data_breach');
    }
    crisesNote = `\n**NOTE:** You didn't specify crises to plan for. Based on your industry (${readableChoice(args.industry)}) and your data sensitivity, ${readableChoice(dataSensitivity)}, we've generated playbooks for a default set of common crises for this industry.\n`;
  }
  
  // Team structure based on company size
  const teamStructure: Record<string, { lead: string; core: string[]; extended: string[] }> = {
    startup_under_50: { lead: 'CEO/Founder', core: ['CTO (if tech issue)', 'Head of Customer'], extended: ['Legal counsel (external)', 'PR consultant (external)'] },
    scaleup_50_200: { lead: 'CEO or designated VP', core: ['CTO', 'VP Customer Success', 'VP Marketing/Comms', 'Legal'], extended: ['HR', 'Engineering Lead', 'Support Lead'] },
    midsize_200_1000: { lead: 'CCO/COO or designated crisis lead', core: ['CTO', 'CISO', 'VP Comms', 'General Counsel', 'VP Customer Success'], extended: ['HR', 'Engineering', 'Support', 'Regional leads'] },
    enterprise_1000_plus: { lead: 'Chief Communications Officer or Crisis Team Lead', core: ['CEO (briefed)', 'CISO', 'General Counsel', 'VP Comms', 'VP Customer', 'Regional VPs'], extended: ['PR Agency', 'Legal external', 'HR', 'All department heads'] }
  };
  
  const baseTeam = teamStructure[companySize] || teamStructure.scaleup_50_200;
  // Run 19 (D80): with personal or financial data at stake, the core team has a security lead and a data protection lead.
  const team = { ...baseTeam, core: [...baseTeam.core], extended: [...baseTeam.extended, ...(ctx.v ? SECTOR_ROLES[ctx.v.id] ?? [] : [])] };
  if (dataSensitivity === 'high_pii_financial') {
    if (!team.core.some((m) => /CISO|security/i.test(m))) team.core.push('CISO or security lead');
    if (!team.core.some((m) => /data protection|DPO/i.test(m))) team.core.push('Data protection lead (DPO)');
  }

  // Run 12 (R12-21): a heading names the kind of crisis once ("Service outage"), and the crisis as typed only when it differs.
  // Acronyms in the default crisis names are written in capitals ("pr incident" is the PR heading itself).
  const heading = (kind: string, name: string): string => {
    const shown = name.trim().replace(/\bpr\b/gi, 'PR');
    const same = shown.toLowerCase() === kind.toLowerCase() || (kind.startsWith('PR ') && shown === 'PR incident');
    return same ? kind : `${kind}: ${shown}`;
  };
  // The first security crisis gets the full steps; a later one points back to them.
  let securityDone = '';
  
  // Generate specific playbook for each crisis type
  // (response times, severity thresholds and phase windows are example figures, labelled in the output)
  const generateCrisisPlaybook = (crisisType: string): string => {
    const crisisLower = crisisType.toLowerCase();
    const crisisName = crisisType.replace(/_/g, ' ');

    // Run 20: a crisis the sector data names (dispatch outage, missed detection, delivery failure ...) gets its own steps and its own audiences.
    const own = pb ? pb.crises.find((c) => crisisLower.includes(c.key) || crisisLower.includes(c.key.replace(/_/g, ' '))) : undefined;
    if (own) {
      return `### ${own.title}

**What this is:** ${own.what}. ${ctx.v && (ctx.v.id !== 'saas' || /billing/i.test(ctx.v.name)) ? `In ${ctx.v.name} the first measures to move are ${andList(ctx.v.metrics.slice(0, 3))}: tell customers which of them you see affected.` : ''}

**First hour:** ${EXAMPLE_FIGURE}
1. **Name the owner**: ${team.lead} as incident commander, with ${team.core[0]}
${own.first.map((x, i) => `${i + 2}. ${x}`).join('\n')}

**Who to tell:**
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
${own.tell.map((t) => `| ${t.who} | ${t.how} | ${t.focus} | ${customerBase === 'b2b_enterprise' ? 'Account team' : 'Customer comms'} |`).join('\n')}
| Employees | Internal brief | Facts, roles, what not to promise | ${team.lead} |

---
`;
    }

    // Security vulnerability (run 20): its own steps, not a pointer to the breach steps
    if (/vulnerab/.test(crisisLower)) {
      return `### ${heading('Security vulnerability', crisisName)}

**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. **Confirm and rate it**: reproduce the flaw and rate it by real exposure (who can reach it, what it gives access to), not by label alone
2. **Check for use**: search logs for signs it was already used; if it was, switch to the data breach steps
3. **Decide the stop-gap**: a feature switch, a rule, an access change or a patch, and who approves it
4. **Name the owner**: ${team.lead} as sponsor, with ${team.core.find((m) => /CTO|CISO|security/i.test(m)) ?? team.core[0]} as technical owner

**Fix and advisory (4-72 hours):** ${EXAMPLE_FIGURE}
1. Fix, test and release; keep the rating the same in the advisory as in your internal record
2. Write the advisory: what is affected, what is fixed, how a customer checks and what they do
3. ${complianceItems.length ? `Check which of the items you listed (${complianceText}) require notice of a vulnerability or a fix` : 'Check which of your contracts or compliance duties require notice of a vulnerability or a fix'}

**Notification Phase:**
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
| Reporter (if a researcher found it) | Direct reply | Receipt, owner, timing of the fix | Security lead |
| Affected customers | ${customerBase === 'b2b_enterprise' ? 'Call from the account owner, then the advisory' : 'Email and advisory'} | What is affected, the fix, how to check | ${customerBase === 'b2b_enterprise' ? 'Account team' : 'Customer comms'} |
| Employees | Internal brief | Facts, what not to say outside | ${team.lead} |

---
`;
    }

    // Customer data exposure (run 20)
    if (/data[ _]exposure|customer_data/.test(crisisLower)) {
      return `### ${heading('Customer data exposure', crisisName)}

${pb ? `**What could be exposed here:** ${pb.breach}.\n\n` : ''}**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. **Close the access**: the open storage, link, permission or report that exposed the data
2. **Preserve the access logs** before any clean-up, so you can say who looked
3. **Size it**: which customers, which fields, which period, and whether anyone outside looked at it
4. **Name the owner**: ${team.lead} with ${team.core.find((m) => /CISO|security|Legal/i.test(m)) ?? team.core[0]}

**Notification Phase:**
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
| Affected customers | ${customerBase === 'b2b_enterprise' ? 'Call from the account owner, then a written note' : 'Email'} | What was exposed, for how long, what you have done, what they should do | ${customerBase === 'b2b_enterprise' ? 'Account team' : 'Customer comms'} |
| Regulators | Per the duty that applies${complianceItems.length ? ` (you listed ${complianceText})` : ''} | Counsel-approved notification | Legal |
| Employees | Internal brief | Facts, what not to say outside | ${team.lead} |

---
`;
    }

    // SLA breach (run 19): checked before the breach test below, because the words "sla_breach" hold "breach"
    if (/\bsla\b|sla_|service[ _]level/.test(crisisLower)) {
      return `### ${heading('SLA breach', crisisName)}

**What counts as a breach:** read the service-level clauses of each affected contract first; the credits and the notice duties differ by contract.

**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. **Confirm the breach**: which contracts, which service-level clause, which period
2. **Name an incident owner**: ${team.lead} as sponsor, the delivery head as owner
3. **Tell the account owner first**: no client hears it from a report before they hear it from a person
4. **Start the incident log**: facts, times, decisions

**Recovery (4-24 hours):** ${EXAMPLE_FIGURE}
1. Find the root cause and what restores the service level
2. Work out the service credits owed under each contract
3. Agree a recovery plan with dates the client can check

**Notification Phase:**
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
| Client service owner | Call from the account owner | What happened, the recovery plan with dates | Account team |
| Client leadership | Executive call | Impact, credits, what changes | ${team.lead} |
| Delivery teams | Internal brief | Facts, roles, what not to promise | Delivery head |
${ctx.v && (ctx.v.id !== 'saas' || /billing/i.test(ctx.v.name)) ? `\n**Sector note:** in ${ctx.v.name} the usual measures are ${andList(ctx.v.metrics.slice(0, 3))}: put the ones in your contracts on the recovery plan.\n` : ''}
---
`;
    }

    // Regulatory action (run 19): uses the compliance items you listed
    if (/regulat/.test(crisisLower)) {
      return `### ${heading('Regulatory action', crisisName)}

**Compliance items you listed:** ${complianceText ? complianceText : 'none (add compliance_requirements to name them here)'}

**Immediate Response (0-24 hours):** ${EXAMPLE_FIGURE}
1. **Log the notice**: who received it, when, and what it asks for
2. **Legal counsel owns the response**: ${team.lead} sponsors it
3. **Preserve records**: stop routine deletion of anything the notice may cover
4. **One channel to the authority**: one named person, no side conversations
${complianceItems.length ? `5. **Map the notice to each item you listed** (${complianceText}): which requirement it touches and which control or report answers it` : '5. **Map the notice to each requirement you have**: which control or report answers it'}

**Response Timeline:** ${EXAMPLE_FIGURES}
| Phase | Timing | Actions |
|-------|--------|---------|
| Acknowledge | As the notice requires | Confirm receipt through counsel |
| Facts | First week | Collect facts only; do not speculate |
| Respond | By the date in the notice | Counsel-approved answer with evidence |
| Review | After closure | Fix the control gap and update the register |

---
`;
    }

    // Fraud incident (run 19)
    if (/fraud/.test(crisisLower)) {
      return `### ${heading('Fraud incident', crisisName)}

**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. **Contain**: block the affected credentials, accounts or instruments; hold payouts under review
2. **Preserve evidence**: logs and transaction records before any clean-up
3. **Size the exposure**: which customers, which amounts, which period
4. **Name the owner**: ${team.lead} as incident commander, with the security lead

**Notification Phase:**
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
| Affected customers | ${customerBase === 'b2b_enterprise' ? 'Call from the account owner' : 'Email'} | What happened, what is held, what they should do | ${customerBase === 'b2b_enterprise' ? 'Account team' : 'Customer comms'} |
| Banking and payment partners | Formal notice per your agreements | Facts and actions taken | Legal |
| Regulators | Per the duty that applies to you${complianceItems.length ? ` (you listed ${complianceText})` : ''} | Counsel-approved notification | Legal |

---
`;
    }

    // AI wrong action (run 19)
    if (/ai_wrong|wrong[ _]action|ai[ _]error|hallucinat/.test(crisisLower)) {
      return `### ${heading('AI wrong action', crisisName)}

**Immediate Response (0-2 hours):** ${EXAMPLE_FIGURE}
1. **Pause the automation** that took the action; send the affected action type to human review
2. **Find the affected cases** from the audit trail: what the AI did, on whose request, with what data
3. **Stop anything that moves money or changes a record** until a person approves it
4. **Name the owner**: ${team.lead} with the data or AI lead

**Correction (2-24 hours):** ${EXAMPLE_FIGURE}
1. Reverse or correct each affected case, and record who approved it
2. Tell each affected customer what happened and what was fixed
3. Add the failing cases to your evaluation set before the automation is switched back on
4. Re-enable in stages with a person approving each action until the evaluation passes

---
`;
    }

    // Data breach / Security incident
    if (crisisLower.includes('breach') || crisisLower.includes('security') || crisisLower.includes('hack') || crisisLower.includes('exposure')) {
      // The legal notification deadline differs by law and country, so no deadline is stated as fact, and no authority is named.
      const regulatoryBody = 'the authorities that apply to you';

      if (securityDone) {
        return `### ${heading('Security incident', crisisName)}

Use the ${securityDone} steps above.

---
`;
      }
      securityDone = crisisName;
      return `### ${heading('Security incident', crisisName)}

${pb ? `**What could be exposed here:** ${pb.breach}.\n\n` : ''}**Severity Assessment:** ${EXAMPLE_FIGURES}
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Data exposed | PII, financial, credentials | Business data | No customer data |
| Customers affected | >1000 or enterprise | 100-1000 | <100 |
| Attack ongoing | Yes | Unknown | Contained |

**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. **Activate incident response team**: ${team.lead} as incident commander
2. **Contain the threat**: Isolate affected systems, revoke compromised credentials
3. **Preserve evidence**: Forensic images before remediation
4. **Start incident log**: Document timeline, actions, decisions
5. **Internal communication only**: No external statements yet

**Investigation Phase (4-24 hours):** ${EXAMPLE_FIGURE}
1. Determine scope: What data, how many customers, how long exposed
2. Identify attack vector and close vulnerability
3. Engage forensics (internal or external)
4. ${complianceItems.length ? `Check the notification duty and deadline of each item you listed (${complianceText}); they differ by law and country, and counsel confirms them` : `Prepare regulatory notification for ${regulatoryBody} by the deadline that applies to you (it differs by law and country)`}
5. Draft customer communication (DO NOT SEND YET)

**Notification Phase (24-72 hours):** ${EXAMPLE_FIGURE}
| Audience | Channel | Message Focus | Owner |
|----------|---------|---------------|-------|
| Regulators | Formal filing | Compliance notification | Legal |
| ${customerBase === 'b2b_enterprise' ? 'Enterprise accounts' : 'Customers'} | ${customerBase === 'b2b_enterprise' ? 'Personal call from CS' : 'Email'} | What happened, what we're doing, what they should do | ${customerBase === 'b2b_enterprise' ? 'Account team' : 'Customer comms'} |
| All customers | Email | Security update | Marketing |
| Media (if needed) | Press release | Factual statement | PR |
| Employees | All-hands | Full transparency | CEO |

---
`;
    }
    
    // Service outage
    if (crisisLower.includes('outage') || crisisLower.includes('downtime') || crisisLower.includes('down')) {
      const levels = ctx.model === 'connectivity'
        ? [['SEV-1', 'Core network, or the sites of several customers, down', '<15 min', /CEO/.test(team.lead) ? team.lead : `${team.lead} + CEO`], ['SEV-2', 'One customer\'s sites down, or a regional link failing', '<30 min', team.core[0]], ['SEV-3', 'Degraded performance at some sites', '<1 hour', 'Network operations lead']]
        : ctx.model === 'services'
        ? [['SEV-1', 'Service desk or managed service stopped for a client', '<15 min', /CEO/.test(team.lead) ? team.lead : `${team.lead} + CEO`], ['SEV-2', 'Service levels missed for a client', '<30 min', team.core[0]], ['SEV-3', 'Degraded service for some users', '<1 hour', 'Delivery lead']]
        : [['SEV-1', 'Complete outage, all customers', '<15 min', /CEO/.test(team.lead) ? team.lead : `${team.lead} + CEO`], ['SEV-2', 'Major feature down, >50% affected', '<30 min', team.core[0]], ['SEV-3', 'Degraded performance', '<1 hour', 'Engineering lead']];
      return `### ${heading('Service outage', crisisName)}

${pb ? `**What it looks like here:** ${pb.outage}.\n\n` : ''}**Severity Levels:** ${EXAMPLE_FIGURES}
| Level | Definition | Response Time | Escalation |
|-------|------------|---------------|------------|
${levels.map((l) => `| ${l[0]} | ${l[1]} | ${l[2]} | ${l[3]} |`).join('\n')}

**Immediate Response (0-15 minutes):** ${EXAMPLE_FIGURE}
1. **Acknowledge on the status page** or to your customers' service owners: "Investigating reports of a problem with ${args.company}'s service"
2. **Assemble the incident room**: ${ctx.model === 'connectivity' ? 'network operations, field engineering, account owners' : ctx.model === 'services' ? 'delivery, the service desk, account owners' : 'engineering, support, comms'}
3. **Diagnose**: root cause identification started
4. **Brief the support and account teams**: prepare for volume

${ctx.v && (ctx.v.id !== 'saas' || /billing/i.test(ctx.v.name)) ? `**Sector impact check:** the first measures to move in ${ctx.v.name} are ${andList(ctx.v.metrics.slice(0, 3))}: tell customers which of them you see affected.\n\n` : ''}**Active Incident (15 minutes to resolution):** ${EXAMPLE_FIGURES}
| Time | Status Update | Channel |
|------|---------------|---------|
| 15 min | "Identified" and a one-line plain description of the cause | ${customerBase === 'b2b_enterprise' ? 'Status page + direct update from the account owner' : 'Status page'} |
| 30 min | "Working on a fix" with the next update time | ${customerBase === 'b2c_consumer' || customerBase === 'mixed' ? 'Status page + social channels' : 'Status page + direct update from the account owner'} |
| 60 min | Progress update or revised time | Status + Email to affected |
| Every 30 min | Continued updates until resolved | Status |

---
`;
    }
    
    // PR/Reputation incident
    if (/(^|[^a-z])pr([^a-z]|$)/.test(crisisLower) || crisisLower.includes('reputation') || crisisLower.includes('media') || crisisLower.includes('social')) {
      return `### ${heading('PR or reputation incident', crisisName)}

**Severity Assessment:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Media coverage | National/major tech | Trade/industry | Social only |
| Factual accuracy | Claims are true | Partially true | Misinformation |
| Viral potential | Trending | Spreading | Contained |

**Immediate Response (0-2 hours):** ${EXAMPLE_FIGURE}
1. **Assess situation**: What's being said, by whom, how widely spread
2. **Pause scheduled content**: No tone-deaf marketing
3. **Brief crisis team**: Align on facts and stance
4. **Draft holding statement**: Review with legal
5. **Identify key stakeholders to notify**: Investors, board, partners

**Response Strategy Matrix:** ${EXAMPLE_FIGURES}
| Scenario | Recommended Response | Timing |
|----------|---------------------|--------|
| Factual error about us | Correct publicly with evidence | <4 hours |
| Legitimate criticism | Acknowledge, explain actions/changes | <24 hours |
| Employee misconduct | Investigate first, then statement | 24-48 hours |
| Competitive attack | Usually ignore unless legal issue | Assess |
| Customer complaint viral | Personal outreach + public acknowledgment | <2 hours |

---
`;
    }
    
    // Executive departure
    if (crisisLower.includes('executive') || crisisLower.includes('departure') || crisisLower.includes('fired') || crisisLower.includes('resign')) {
      return `### ${heading('Executive departure', crisisName)}

**Scenario Types:** ${EXAMPLE_FIGURES}
| Type | Response Approach | Timeline |
|------|-------------------|----------|
| Planned departure | Controlled announcement, successor named | 2-4 weeks prep |
| Sudden resignation | Quick succession plan, stabilization messaging | 1-3 days |
| Termination for cause | Legal review, minimal details, forward-focused | Same day |

**Immediate Actions:**
1. **Access management**: Revoke systems access immediately (if unplanned/termination)
2. **Internal announcement first**: Employees hear from leadership, not media
3. **Prepare external communications**: Customers, investors, partners
4. **Identify interim leadership**: Clear chain of command
5. **Personal outreach to key accounts**: ${customerBase === 'b2b_enterprise' ? 'Call your top accounts' : 'Prepare customer FAQ'}

---
`;
    }
    
    // Competitor attack
    if (crisisLower.includes('competitor') || crisisLower.includes('attack') || crisisLower.includes('market')) {
      return `### ${heading('Competitive threat', crisisName)}

**Assessment Framework:** ${EXAMPLE_FIGURES}
| Threat Type | Response Level | Timeline |
|-------------|----------------|----------|
| Competitive FUD campaign | Monitor + selective response | Ongoing |
| Direct customer poaching | Proactive retention outreach | Immediate |
| Major competitor launch | Market positioning update | 1-2 weeks |
| Price war initiation | Strategic decision required | 1 week |

**Response Playbook:**

**1. For FUD Campaigns:**
- Document claims being made
- Prepare factual counter-evidence
- Arm sales team with battle cards
- Consider direct response only if claims are provably false

**2. For Customer Poaching:**
- Identify at-risk accounts
- Proactive executive outreach
- Customer appreciation programs
- Win-back playbook for lost deals

---
`;
    }
    
    // Default playbook
    return `### ${heading('Crisis', crisisName)}

**Your crisis, in your words:** ${q(crisisType)}

**Initial Assessment (First 30 minutes):** ${EXAMPLE_FIGURE}
1. What happened? (Facts only, no speculation)
2. Who is affected? (Customers, employees, partners)
3. What's the current status? (Ongoing vs. contained)
4. What are the legal/compliance implications?
5. What's the reputational risk?

**Response Team:**
- Incident Commander: ${team.lead}
- Core Team: ${team.core.join(', ')}
- Extended (as needed): ${team.extended.join(', ')}

**Communication Timeline:** ${EXAMPLE_FIGURES}
| Phase | Timing | Actions |
|-------|--------|---------|
| Acknowledge | <2 hours | Internal brief, holding statement ready |
| Respond | 2-24 hours | Stakeholder communications |
| Resolve | 24-72 hours | Full resolution or clear plan |
| Review | 1-2 weeks | Post-incident review |

---
`;
  };

  let output = `# Crisis Response Playbook
## ${args.company}
${crisesNote}
**Industry:** ${readableChoice(args.industry)}
**Company Size:** ${describeChoice(args.company_size, companySize)}
**Customer Base:** ${readableChoice(customerBase)}
**Data Sensitivity:** ${readableChoice(dataSensitivity)}
${compliance ? `**Compliance Requirements:** ${compliance}\n` : ''}
${ctx.line}

---

## Crisis Response Team
${ctx.v && (ctx.v.id !== 'saas' || /billing/i.test(ctx.v.name)) ? `\n*In ${ctx.v.name} the words your customers use are ${andList(ctx.v.vocabulary.slice(0, 6))}: use them in customer messages, and name the measures they watch (${andList(ctx.v.metrics.slice(0, 3))}).*\n` : ''}
**Incident Commander:** ${team.lead}

**Core Team (Always Activated):**
${team.core.map(member => `- ${member}`).join('\n')}

**Extended Team (As Needed):**
${team.extended.map(member => `- ${member}`).join('\n')}

---

## Emergency Contacts

Fill these in before a crisis, not during one.

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Crisis lead (${team.lead}) | | | |
| Legal counsel | | | |
| Communications lead | | | |
| Security lead | | | |

---

## Crisis-Specific Playbooks

`;

  // Generate specific playbook for each identified crisis
  for (const crisis of crises) {
    output += generateCrisisPlaybook(crisis);
  }

  output += `
## General Crisis Principles

### Communication Principles
1. **Speed matters**: First mover shapes narrative
2. **Honesty is non-negotiable**: Never lie or mislead
3. **Empathy first**: Acknowledge impact before explaining
4. **Specificity builds trust**: Vague statements erode confidence
5. **Consistent voice**: Single spokesperson, aligned messaging

---

*Crisis playbook generated using the CRAFT GTM framework*
*Customized for ${readableChoice(args.industry)} industry with data sensitivity: ${readableChoice(dataSensitivity)}*

${SUGGESTION_FOOTER}`;

  return output;
}
