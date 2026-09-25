import { parseListItems, describeChoice, readableChoice, EXAMPLE_FIGURE, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';

// Default crises by industry
const DEFAULT_CRISES: Record<string, string[]> = {
  fintech: ['data_breach', 'service_outage', 'regulatory_action', 'fraud_incident'],
  healthtech: ['data_breach', 'hipaa_violation', 'service_outage', 'clinical_safety'],
  saas: ['service_outage', 'data_breach', 'security_vulnerability', 'customer_data_exposure'],
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
}): string {
  const companySize = args.company_size || 'scaleup_50_200';
  const customerBase = args.customer_base;
  const dataSensitivity = args.data_sensitivity;
  const compliance = args.compliance_requirements || '';
  
  // Use provided crises or suggest defaults based on industry
  let crises: string[];
  let crisesNote = '';
  
  if (args.potential_crises) {
    crises = parseListItems(args.potential_crises);
  } else {
    // A copy, so adding data_breach below never changes the shared default list for later calls on the same server.
    crises = [...(DEFAULT_CRISES[args.industry] || DEFAULT_CRISES.other)];
    // Add data breach as priority if high sensitivity
    if (dataSensitivity === 'high_pii_financial' && !crises.includes('data_breach')) {
      crises.unshift('data_breach');
    }
    crisesNote = `\n⚠️ **NOTE:** You didn't specify crises to plan for. Based on your industry (${args.industry}) and your data sensitivity, ${readableChoice(dataSensitivity)}, we've generated playbooks for a default set of common crises for this industry.\n`;
  }
  
  // Team structure based on company size
  const teamStructure: Record<string, { lead: string; core: string[]; extended: string[] }> = {
    startup_under_50: { lead: 'CEO/Founder', core: ['CTO (if tech issue)', 'Head of Customer'], extended: ['Legal counsel (external)', 'PR consultant (external)'] },
    scaleup_50_200: { lead: 'CEO or designated VP', core: ['CTO', 'VP Customer Success', 'VP Marketing/Comms', 'Legal'], extended: ['HR', 'Engineering Lead', 'Support Lead'] },
    midsize_200_1000: { lead: 'CCO/COO or designated crisis lead', core: ['CTO', 'CISO', 'VP Comms', 'General Counsel', 'VP Customer Success'], extended: ['HR', 'Engineering', 'Support', 'Regional leads'] },
    enterprise_1000_plus: { lead: 'Chief Communications Officer or Crisis Team Lead', core: ['CEO (briefed)', 'CISO', 'General Counsel', 'VP Comms', 'VP Customer', 'Regional VPs'], extended: ['PR Agency', 'Legal external', 'HR', 'All department heads'] }
  };
  
  const team = teamStructure[companySize] || teamStructure.scaleup_50_200;
  
  // Generate specific playbook for each crisis type
  // (response times, severity thresholds and phase windows are example figures, labelled in the output)
  const generateCrisisPlaybook = (crisisType: string): string => {
    const crisisLower = crisisType.toLowerCase();
    const crisisName = crisisType.replace(/_/g, ' ');

    // Data breach / Security incident
    if (crisisLower.includes('breach') || crisisLower.includes('security') || crisisLower.includes('hack')) {
      // The legal notification deadline differs by law and country, so no deadline is stated as fact.
      const regulatoryBody = compliance.toLowerCase().includes('hipaa') ? 'HHS' :
                            compliance.toLowerCase().includes('gdpr') ? 'relevant DPA' : 'applicable authorities';

      return `### 🔐 SECURITY INCIDENT: ${crisisName}

**Severity Assessment:** ${EXAMPLE_FIGURES}
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Data exposed | PII, financial, health | Business data | No customer data |
| Customers affected | >1000 or enterprise | 100-1000 | <100 |
| Attack ongoing | Yes | Unknown | Contained |

**Immediate Response (0-4 hours):** ${EXAMPLE_FIGURE}
1. ⚡ **Activate incident response team** - ${team.lead} as incident commander
2. 🔒 **Contain the threat** - Isolate affected systems, revoke compromised credentials
3. 📸 **Preserve evidence** - Forensic images before remediation
4. 📝 **Start incident log** - Document timeline, actions, decisions
5. 🔇 **Internal communication only** - No external statements yet

**Investigation Phase (4-24 hours):** ${EXAMPLE_FIGURE}
1. Determine scope: What data, how many customers, how long exposed
2. Identify attack vector and close vulnerability
3. Engage forensics (internal or external)
4. Prepare regulatory notification for ${regulatoryBody} by the deadline that applies to you (it differs by law and country)
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
      return `### ⚠️ SERVICE OUTAGE: ${crisisName}

**Severity Levels:** ${EXAMPLE_FIGURES}
| Level | Definition | Response Time | Escalation |
|-------|------------|---------------|------------|
| SEV-1 | Complete outage, all customers | <15 min | ${team.lead} + CEO |
| SEV-2 | Major feature down, >50% affected | <30 min | ${team.core[0]} |
| SEV-3 | Degraded performance | <1 hour | Engineering lead |

**Immediate Response (0-15 minutes):** ${EXAMPLE_FIGURE}
1. 🚨 **Acknowledge in status page** - "Investigating reports of [issue]"
2. 👥 **Assemble war room** - Engineering, Support, Comms
3. 🔍 **Diagnose** - Root cause identification started
4. 📢 **Notify support team** - Prepare for volume

**Active Incident (15 min - resolution):** ${EXAMPLE_FIGURES}
| Time | Status Update | Channel |
|------|---------------|---------|
| 15 min | "Identified: [description]" | Status page |
| 30 min | "Working on fix, ETA [X]" | Status + Twitter |
| 60 min | Progress update or revised ETA | Status + Email to affected |
| Every 30 min | Continued updates until resolved | Status |

---
`;
    }
    
    // PR/Reputation incident
    if (crisisLower.includes('pr') || crisisLower.includes('reputation') || crisisLower.includes('media') || crisisLower.includes('social')) {
      return `### 📰 PR/REPUTATION INCIDENT: ${crisisName}

**Severity Assessment:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Media coverage | National/major tech | Trade/industry | Social only |
| Factual accuracy | Claims are true | Partially true | Misinformation |
| Viral potential | Trending | Spreading | Contained |

**Immediate Response (0-2 hours):** ${EXAMPLE_FIGURE}
1. 📊 **Assess situation** - What's being said, by whom, how widely spread
2. 🔇 **Pause scheduled content** - No tone-deaf marketing
3. 👥 **Brief crisis team** - Align on facts and stance
4. 📝 **Draft holding statement** - Review with legal
5. 🎯 **Identify key stakeholders to notify** - Investors, board, partners

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
      return `### 👔 EXECUTIVE DEPARTURE: ${crisisName}

**Scenario Types:** ${EXAMPLE_FIGURES}
| Type | Response Approach | Timeline |
|------|-------------------|----------|
| Planned departure | Controlled announcement, successor named | 2-4 weeks prep |
| Sudden resignation | Quick succession plan, stabilization messaging | 1-3 days |
| Termination for cause | Legal review, minimal details, forward-focused | Same day |

**Immediate Actions:**
1. 📋 **Access management** - Revoke systems access immediately (if unplanned/termination)
2. 👥 **Internal announcement first** - Employees hear from leadership, not media
3. 📧 **Prepare external communications** - Customers, investors, partners
4. 🎯 **Identify interim leadership** - Clear chain of command
5. 📞 **Personal outreach to key accounts** - ${customerBase === 'b2b_enterprise' ? 'Call top 20 accounts' : 'Prepare customer FAQ'}

---
`;
    }
    
    // Competitor attack
    if (crisisLower.includes('competitor') || crisisLower.includes('attack') || crisisLower.includes('market')) {
      return `### ⚔️ COMPETITIVE THREAT: ${crisisName}

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
    return `### ⚠️ CRISIS: ${crisisName}

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

  let output = `# 🚨 Crisis Response Playbook
## ${args.company}
${crisesNote}
**Industry:** ${args.industry}
**Company Size:** ${describeChoice(args.company_size, companySize)}
**Customer Base:** ${readableChoice(customerBase)}
**Data Sensitivity:** ${readableChoice(dataSensitivity)}
${compliance ? `**Compliance Requirements:** ${compliance}` : ''}

---

## 👥 Crisis Response Team

**Incident Commander:** ${team.lead}

**Core Team (Always Activated):**
${team.core.map(member => `- ${member}`).join('\n')}

**Extended Team (As Needed):**
${team.extended.map(member => `- ${member}`).join('\n')}

---

## 📞 Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Crisis Lead | [Add] | [Add] | [Add] |
| Legal Counsel | [Add] | [Add] | [Add] |
| PR Contact | [Add] | [Add] | [Add] |
| IT Security | [Add] | [Add] | [Add] |

---

## 🎯 Crisis-Specific Playbooks

`;

  // Generate specific playbook for each identified crisis
  for (const crisis of crises) {
    output += generateCrisisPlaybook(crisis);
  }

  output += `
---

## 📋 General Crisis Principles

### Communication Principles
1. **Speed matters** - First mover shapes narrative
2. **Honesty is non-negotiable** - Never lie or mislead
3. **Empathy first** - Acknowledge impact before explaining
4. **Specificity builds trust** - Vague statements erode confidence
5. **Consistent voice** - Single spokesperson, aligned messaging

---

*Crisis playbook generated using CRAFT GTM Framework v2.0*
*Customized for ${args.industry} industry with data sensitivity: ${readableChoice(dataSensitivity)}*

${SUGGESTION_FOOTER}`;

  return output;
}
