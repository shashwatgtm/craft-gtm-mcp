import { parseListItems, pct, roundTypedPercents, describeChoice, readableChoice, lowerFirstIfCommon, cap, EXAMPLE_FIGURE, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, q, answerFor, sectorNotes, shortName, capEcho, andList, lcFirst, type BusinessModel } from './context.js';
import { playbookFor, MODEL_LANGUAGE, segmentNotes } from './sector-playbooks.js';

// Run 19 (D80): the business model chosen is mapped to the model class the tool reasons with. enterprise_contract is read further
// from the typed text (services, connectivity or investment) when it can be.
const MODEL_OF_CHOICE: Record<string, BusinessModel | undefined> = {
  saas_subscription: 'saas', usage_based: 'saas', freemium: 'saas', marketplace: 'marketplace', transactional: 'transactions',
  services_contract: 'services', connectivity_contract: 'connectivity', investment_mandate: 'investment',
};

// Signals for a contract that is not a software subscription. No weights are invented for them: the answer splits 100% equally.
const CONTRACT_SIGNALS: Record<string, string[]> = {
  services: ['sla_attainment', 'ticket_backlog_trend', 'service_review_attendance', 'executive_engagement', 'renewal_sentiment'],
  connectivity: ['uptime_and_repair_time', 'incident_trend', 'executive_engagement', 'new_sites_or_links_requested', 'renewal_sentiment'],
  investment: ['reporting_engagement', 'mandate_size_trend', 'sponsor_engagement', 'risk_review_attendance', 'renewal_sentiment'],
};

export function generateRetentionPlaybook(args: {
  customer_segment: string;
  business_model: string;
  current_churn_rate: string;
  churn_reasons?: string;
  available_data_signals?: string;
  cs_team_size?: string;
  current_interventions?: string;
  product?: string;
  industry?: string;
}): string {
  const businessModel = args.business_model;
  const csTeamSize = args.cs_team_size || 'small_1_3';
  const churnReasons = args.churn_reasons ? parseListItems(args.churn_reasons) : [];
  const dataSignals = args.available_data_signals ? parseListItems(args.available_data_signals) : [];
  const currentInterventions = splitItems(args.current_interventions);
  const product = args.product ? (shortName(args.product) ?? args.product.trim()) : '';
  const productRef = product || 'your service';
  const accountRef = product || 'your account';
  const segNote = segmentNotes(args.customer_segment);
  const sign = product ? `The ${product} team` : 'Your account team';

  // The model class and the sector, read from the inputs
  const ctx = readContext({ model: MODEL_OF_CHOICE[businessModel], vertical: args.industry }, { seller: [args.product], context: [args.churn_reasons, args.available_data_signals], buyer: [args.customer_segment] });
  // enterprise_contract is the user's own choice: say so, instead of "not clear", when the text does not name services, connectivity or investment.
  const ctxLine = !ctx.model && businessModel === 'enterprise_contract'
    ? ctx.line.replace(/Business model: [^]*$/, 'Business model: enterprise contract (from your business_model input; name your offer in the product input and a services, connectivity or investment contract is read from it).*')
    : ctx.line;
  const contractModel = ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment' ? ctx.model : null;
  // Product-led wording (login and feature signals, in-app messages, day-based lifecycle) only when the model is a software or
  // product relationship; a contract whose kind is not clear gets the contract wording.
  const subscription = !contractModel && (['saas_subscription', 'usage_based', 'freemium', 'marketplace', 'transactional'].includes(businessModel) || (businessModel === 'enterprise_contract' && ctx.model === 'saas'));
  
  // Parse churn rate
  const churnMatch = args.current_churn_rate.match(/(\d+(?:\.\d+)?)/);
  const churnRate = churnMatch ? parseFloat(churnMatch[1]) : 0;
  
  // Determine severity
  const churnSeverity = churnRate > 8 ? 'CRITICAL' : churnRate > 5 ? 'HIGH' : churnRate > 3 ? 'MODERATE' : 'LOW';
  // CS team size as shown to the user (readable, and marked when it is the assumed default)
  const csTeamShown = describeChoice(args.cs_team_size, csTeamSize);

  // DISCOVERY MODE: If no churn reasons provided
  if (churnReasons.length === 0) {
    return generateChurnDiscoveryKit(args.customer_segment, businessModel, churnRate, churnSeverity, csTeamShown, contractModel, subscription, product, ctxLine, ctx.v, ctx.model);
  }
  
  // Business model-specific health score weights
  const healthScoreWeights: Record<string, Record<string, number>> = {
    saas_subscription: { login_frequency: 25, feature_adoption: 30, support_tickets: 15, billing_health: 10, engagement_trend: 20 },
    usage_based: { usage_volume: 40, usage_trend: 25, feature_breadth: 15, billing_health: 10, support_tickets: 10 },
    marketplace: { transaction_frequency: 35, gmv_trend: 25, seller_buyer_ratio: 15, review_score: 15, support_tickets: 10 },
    transactional: { purchase_frequency: 30, aov_trend: 25, category_breadth: 20, engagement: 15, support: 10 },
    freemium: { feature_engagement: 30, upgrade_signals: 30, viral_actions: 20, time_in_product: 10, support: 10 },
    enterprise_contract: { executive_engagement: 25, feature_adoption: 25, support_nps: 20, expansion_signals: 15, renewal_sentiment: 15 }
  };
  
  // Run 19 (D80, problem 4): a contract for services, connectivity or investment gets its own signals with an equal split of 100%
  // (computed from the list, no invented weights).
  const weights: Record<string, number> = contractModel
    ? Object.fromEntries(CONTRACT_SIGNALS[contractModel].map((s) => [s, Math.round((100 / CONTRACT_SIGNALS[contractModel].length) * 10) / 10]))
    : (healthScoreWeights[businessModel] || healthScoreWeights.saas_subscription);
  const equalWeights = contractModel !== null;
  
  // CS team capacity determines intervention approach
  const interventionCapacity: Record<string, { highTouch: number; automated: number; scaledTouch: number }> = {
    no_dedicated_cs: { highTouch: 0, automated: 90, scaledTouch: 10 },
    small_1_3: { highTouch: 20, automated: 50, scaledTouch: 30 },
    medium_4_10: { highTouch: 40, automated: 30, scaledTouch: 30 },
    large_10_plus: { highTouch: 60, automated: 20, scaledTouch: 20 }
  };
  
  const capacity = interventionCapacity[csTeamSize] || interventionCapacity.small_1_3;
  
  // Run 19 (D80, problem 5): a reason is matched on whole words (before, "use" matched "because" and "ready" matched "already").
  const has = (text: string, re: RegExp): boolean => re.test(text.toLowerCase());
  const adoptionTrigger = subscription
    ? `Low login frequency OR <30% feature adoption ${EXAMPLE_FIGURE}`
    : contractModel === 'connectivity' ? 'Sites not live in the planned wave, or the same incident again and again'
    : contractModel === 'investment' ? 'Falling attendance at reviews or fewer reports opened'
    : 'Fewer requests raised, fewer service reviews attended, or reports unread';

  // Generate specific intervention for each churn reason
  const generateIntervention = (reason: string): { trigger: string; action: string; owner: string; timing: string; email: string } => {
    const sector = answerFor(reason, ctx.v);

    if (has(reason, /\b(bundl\w*|consolidat\w*|one vendor|single vendor|suite)\b/)) {
      return {
        trigger: 'A bundled or consolidated offer from another vendor appears in the account',
        action: `Outcome comparison, not a feature list. ${sector}`,
        owner: capacity.highTouch > 30 ? 'CSM with the account executive' : 'CS team, with the account executive',
        timing: 'Within 1 week of the signal',
        email: `Subject: Comparing the outcome, not the bundle\n\nHello,\n\nI understand another vendor has offered a bundled package. That can look simpler on paper.\n\nBefore you decide, I'd like to compare what each option delivers for the results you care about, and what the bundle leaves to manual work.\n\nWould a 20-minute comparison with your team help?\n\n${sign}`
      };
    }

    if (has(reason, /\b(price|prices|pricing|cost|costs|expensive|cheaper|discount\w*|rates?)\b/)) {
      return {
        trigger: 'Price objection identified (survey, support ticket, or cancellation reason)',
        action: 'Value demonstration call + ROI analysis',
        owner: capacity.highTouch > 30 ? 'CSM' : 'CS team, after an automated email',
        timing: 'Within 24 hours of signal',
        email: `Subject: Getting more value from ${accountRef}\n\nHello,\n\nI noticed you mentioned concerns about cost. I'd love to show you what ${productRef} could deliver for your team at the price you pay.\n\nWould you be open to a quick 15-minute call to go through what ${productRef} delivers for you and what it costs?\n\n${sign}`
      };
    }
    
    if (has(reason, /\b(features?|missing|capabilit\w*)\b/)) {
      return {
        trigger: 'Feature gap mentioned in support/feedback/survey',
        action: 'Feature request logging + workaround education + roadmap preview (if applicable)',
        owner: capacity.highTouch > 30 ? 'CSM with Product input' : 'Support with escalation',
        timing: 'Within 48 hours',
        email: `Subject: About what you told us was missing\n\nHello,\n\nThanks for sharing your feedback about what ${productRef} is missing. I wanted to follow up personally.\n\nWhile I can't promise timelines, I can walk you through what ${productRef} does today for this need and the options we have\n\nWould it help to walk through this together?\n\n${sign}`
      };
    }
    
    if (has(reason, /\b(sla|service levels?|service credits?|credits?|uptime|outages?|incidents?|repair\w*|downtime)\b/)) {
      return {
        trigger: 'Service levels missed, credits claimed or disputed, or the same incident again',
        action: `Service recovery review: root cause, a recovery plan with dates, and a report the customer can check. ${sector}`,
        owner: 'Service owner + CSM',
        timing: 'Within 48 hours of the signal, then at the next review',
        email: `Subject: Service levels for ${accountRef}\n\nHello,\n\nI saw that service levels have not met what we agreed. I'd like to walk you through the cause and a recovery plan with dates.\n\nCould we find 30 minutes this week with your service owner?\n\n${sign}`
      };
    }

    if (has(reason, /\b(key \w+ left|champion|sponsor|contact left|attrition|turnover|resign\w*)\b/)) {
      return {
        trigger: 'A key person on either side leaves or changes role',
        action: `Name a backup for each key role, show the knowledge transfer, and find the new champion. ${sector}`,
        owner: capacity.highTouch > 30 ? 'CSM with the account executive' : 'CS team, with the account executive',
        timing: 'Within 1 week of the change',
        email: `Subject: Continuity for ${accountRef}\n\nHello,\n\nI know there has been a change in the team. I'd like to confirm who covers each key role and how knowledge is being passed on, so nothing slips.\n\nCould we meet this week to go through it?\n\n${sign}`
      };
    }

    if (has(reason, /\b(support|help|response|tickets?)\b/)) {
      return {
        trigger: 'Multiple support tickets OR low CSAT on support interaction',
        action: 'Executive escalation + dedicated support channel + satisfaction recovery',
        owner: 'Support Manager + CSM',
        timing: 'Same day',
        email: `Subject: Making things right\n\nHello,\n\nI saw that your recent support experience wasn't up to our standards. I'm sorry about that.\n\nI've personally reviewed your case and want to make sure we resolve this properly. I would like to set up a direct escalation path for you.\n\nCan we schedule a call to address your concerns directly?\n\n${sign}`
      };
    }
    
    if (has(reason, /\b(competitors?|switch\w*|alternatives?|rivals?|incumbents?)\b/)) {
      return {
        trigger: 'Competitor mention in any customer touchpoint',
        action: `Competitive win-back campaign + differentiation call. ${sector}`,
        owner: capacity.highTouch > 30 ? 'CSM or Account Exec' : 'CS team, with automated comparison content',
        timing: 'Within 4 hours if identified',
        email: `Subject: Before you decide...\n\nHello,\n\nI understand you're evaluating other options. That's smart: you should always explore what's best for your team.\n\nBefore you make a final decision, I'd love to share some context. \n\nWorth a quick call?\n\n${sign}`
      };
    }
    
    if (has(reason, /\b(adopt\w*|usage|engagement|unused|not using|low use|(?:do|does|did|will|would) not use|won't use)\b/)) {
      return {
        trigger: adoptionTrigger,
        action: subscription ? 'Onboarding reset + use case discovery call + quick-win identification' : 'Service review + use case discovery call + quick-win identification',
        owner: capacity.highTouch > 30 ? 'CSM' : 'CS team, after an automated nurture',
        timing: subscription ? 'When pattern detected (Day 7, 14, 21 of low engagement)' : 'At the next service review, or within 2 weeks of the signal',
        email: `Subject: Getting more out of ${accountRef}\n\nHello,\n\nI noticed your team hasn't been using ${productRef} as much recently. Sometimes that means we didn't nail the initial setup.\n\nI'd love to understand your goals better and show you a quick win that might change how you see the service.\n\nCould we take 15 minutes this week?\n\n${sign}`
      };
    }
    
    // Default intervention: the reason is quoted, and the sector's answer pattern is given when one fits
    return {
      trigger: `${q(capEcho(reason, 120).short)} identified in customer feedback`,
      action: `Personalized outreach + root cause analysis. ${sector}`,
      owner: capacity.highTouch > 30 ? 'CSM' : 'CS team, after an automated check-in',
      timing: 'Within 48 hours of signal',
      email: `Subject: Quick check-in\n\nHello,\n\nI wanted to reach out personally because your feedback matters to us.\n\nYou told us: ${q(capEcho(reason, 200).short)}. I'd love to understand this better and see if there's anything we can do.\n\nDo you have 10 minutes this week?\n\n${sign}`
    };
  };

  // Which of the user's data signals each model signal can use (a signal word of 4 or more letters found in what the user typed)
  const signalWords = (key: string): string[] => key.split('_').filter((w) => w.length >= 4 && !['trend', 'rate', 'requested', 'sentiment'].includes(w));
  const trackedFor = (key: string): string | null => dataSignals.find((ds) => signalWords(key).some((w) => ds.toLowerCase().includes(w.slice(0, 4)))) ?? null;
  const usedSignals = new Set<string>();
  const signalLabel = (signal: string): string => (!subscription && signal === 'feature_adoption' ? 'service adoption' : signal.replace(/_/g, ' '));
  const signalRows = Object.entries(weights).map(([signal, weight]) => {
    const tracked = trackedFor(signal);
    if (tracked) usedSignals.add(tracked);
    return `| ${signalLabel(signal)} | ${pct(weight)}% | ${tracked ? `Available: you track ${q(tracked)}` : 'Need to add'} | Red < 30, Yellow 30-70, Green > 70 |`;
  }).join('\n');
  const unusedSignals = dataSignals.filter((ds) => !usedSignals.has(ds));

  const segmentHead = capEcho(args.customer_segment, 100);
  const heading = `${product ? `${product}: ` : ''}${cap(lowerFirstIfCommon(segmentHead.short))}`;
  let output = `# Retention Playbook
## ${heading}

**Business Model:** ${readableChoice(businessModel)}${ctx.model === 'investment' && businessModel === 'enterprise_contract' ? ' (an investment mandate)' : ''}
**Current Churn Rate:** ${roundTypedPercents(args.current_churn_rate)} (${churnSeverity} against the example thresholds, which are illustrations: set your own)
**CS Team Capacity:** ${csTeamShown}
${segmentHead.capped ? `**Customer segment (as you wrote it):** ${args.customer_segment.trim()}\n` : ''}
${ctxLine}
${segNote ? `\n**In this segment:** a ${subscription ? 'purchase' : 'renewal'} usually involves ${segNote.review}. Check each churn reason below against these steps.\n` : ''}${ctx.v ? `\n**In ${ctx.v.name}:** ${playbookFor(ctx.v).renewal}\n` : ''}
---

## Churn Severity Assessment

| Metric | Value | Status (against example benchmarks) |
|--------|-------|--------|
| Monthly Churn | ${pct(churnRate)}% | ${churnSeverity} against the example thresholds |
| Annual Revenue at Risk (your monthly churn, annualized) | ~${pct(churnRate * 12)}% (monthly churn times twelve, not compounded) | ${churnRate * 12 > 50 ? 'Urgent' : 'Monitor'} |
| Benchmark (${readableChoice(businessModel)}) | ${contractModel ? 'No example benchmark for this model: set your own' : `${businessModel === 'saas_subscription' ? '3-5%' : businessModel === 'consumer' ? '5-8%' : '4-6%'} ${EXAMPLE_FIGURE}`} | - |

---

## Health Score Model (${readableChoice(businessModel)})

${equalWeights ? `The signals below are for ${contractModel === 'services' ? 'a services' : contractModel === 'connectivity' ? 'a connectivity' : 'an investment'} contract. The weights are an equal split of 100%, computed from the number of signals: set your own weights from your data.` : `${EXAMPLE_FIGURES} The weights and thresholds below are illustrations to adapt to your data.`}
| Signal | Weight | How to Track | Threshold |
|--------|--------|--------------|-----------|
${signalRows}
${dataSignals.length ? `\n**Signals you said you can track:** ${dataSignals.map((d) => q(d)).join(', ')}.${unusedSignals.length ? ` Not matched to a signal above: ${unusedSignals.map((d) => q(d)).join(', ')}. They are not in the weights; add them as signals, or use them in your reviews.` : ' Every one is matched to a signal above.'}\n` : '\nNo data signals were given: every row above says "Need to add" until you name what you can track.\n'}
### Health Score Calculation

${EXAMPLE_FIGURES}
\`\`\`
Health Score = ${Object.entries(weights).map(([signal, weight]) => `(${signal} × ${weight / 100})`).join(' + ')}

Risk Levels (${EXAMPLE_FIGURES.replace(/\.$/, '')}):
- Critical (0-30): Immediate intervention required
- At Risk (31-50): Proactive outreach needed  
- Monitor (51-70): Nurture and optimize
- Healthy (71-100): Expand and advocate
\`\`\`

---

${currentInterventions.length ? `## What You Already Do\n\n${currentInterventions.map((x) => `- ${q(x)}`).join('\n')}\n\nCheck each one against the churn reasons below: keep what answers a reason, and use the playbook for the reasons nothing you do answers yet.\n\n---\n\n` : ''}## Churn Reason Interventions

`;

  // Generate specific intervention for each churn reason
  for (let i = 0; i < churnReasons.length; i++) {
    const reason = churnReasons[i];
    const intervention = generateIntervention(reason);
    
    output += `### ${i + 1}. "${reason}"

**Trigger:** ${intervention.trigger}

**Intervention Protocol:**
| Element | Detail |
|---------|--------|
| Action | ${intervention.action} |
| Owner | ${intervention.owner} |
| Timing | ${intervention.timing} |
| Success Metric | Retention rate of triggered customers |

**Ready-to-Use Email Template:**

\`\`\`
${intervention.email}
\`\`\`

**Before you send:** add a result only if you hold it${ctx.v ? `. In ${ctx.v.name} the proof that lands is: ${lcFirst(ctx.v.proofShape)}` : ': a figure from a similar customer that you can show'}

---

`;
  }

  output += `## Intervention Mix (Based on Team Capacity)

${EXAMPLE_FIGURES} The allocation is a starting split for this team size.
| Intervention Type | Allocation | Description |
|-------------------|------------|-------------|
| High-Touch | ${capacity.highTouch}% | Personal calls, custom solutions, executive involvement |
| Scaled Touch | ${capacity.scaledTouch}% | 1:many webinars, office hours, community |
| Automated | ${capacity.automated}% | ${subscription ? 'Email sequences, in-app messages, self-serve' : 'Email sequences, scheduled reports, portal updates'} |

---

## ${subscription ? 'Lifecycle Intervention Timing' : 'Contract Lifecycle Timing'}

${subscription ? `| Touchpoint | Timing | Action | Goal |
|------------|--------|--------|------|
| Onboarding Check | Day 7 | Adoption check + quick win | Activate |
| First Value Review | Day 30 | Success metrics review | Confirm value |
| Expansion Probe | Day 60 | Use case expansion | Deepen |
| QBR (if applicable) | Day 90 | Business review | Renew signal |
| Pre-Renewal | 60 days before renewal | Renewal conversation | Retain |
| At-Risk Intervention | When triggered | Health score-based | Save |` : `| Touchpoint | Timing | Action | Goal |
|------------|--------|--------|------|
| Go-live check | When the service goes live | Confirm it is live as contracted | Activate |
| First service review | After go-live, at the first review | Review service levels and open issues with the owner | Confirm value |
| Regular review | On the schedule in your contract | Review reports, incidents and requests | Deepen |
| Pre-renewal | Early enough to act (your contract's notice period decides) | Renewal conversation with the sponsor | Retain |
| At-risk intervention | When triggered | Health score or incident based | Save |`}

---

## Metrics & Monitoring

| Metric | Target (${EXAMPLE_FIGURES.replace(/\.$/, '')}) | Current | Tracking |
|--------|--------|---------|----------|
| Monthly Churn Rate | ${contractModel ? 'Set your own' : `<${businessModel === 'saas_subscription' ? '3' : '5'}%`} | ${pct(churnRate)}% | Billing system |
| Health Score Coverage | 100% | - | CS platform |
| Intervention Response Rate | >50% | - | Email/call tracking |
| Save Rate (at-risk to retained) | >30% | - | CS platform |
| ${subscription ? 'Time to First Value' : 'Time to go-live'} | ${subscription ? `<${businessModel === 'enterprise_contract' ? '30' : '7'} days` : 'Set your own'} | - | ${subscription ? 'Product analytics' : 'Project plan'} |

${ctx.v ? `---\n\n${sectorNotes(ctx.v, 'objections')}\n\n` : ''}---

*Retention playbook generated for ${product ? `${product}, ` : ''}${lowerFirstIfCommon(segmentHead.short)} using the CRAFT GTM framework*
*Optimized for ${readableChoice(businessModel)} business model with ${csTeamShown} CS team*

${SUGGESTION_FOOTER}`;

  return output;
}

// DISCOVERY MODE: Help user identify churn reasons
function generateChurnDiscoveryKit(
  segment: string,
  businessModel: string,
  churnRate: number,
  severity: string,
  csTeamShown: string,
  contractModel: 'services' | 'connectivity' | 'investment' | null,
  subscription: boolean,
  product: string,
  contextLine: string,
  v: import('./context.js').Vertical | null,
  model: BusinessModel | null
): string {
  const commonReasons: Record<string, string[]> = {
    saas_subscription: ['Price/value mismatch', 'Missing features', 'Poor support', 'Competitor switch', 'Low usage/adoption', 'Champion left', 'Budget cuts', 'Poor onboarding'],
    usage_based: ['Unpredictable billing', 'Usage dropped', 'Better pricing elsewhere', 'Feature gaps', 'Integration issues'],
    marketplace: ['Low supply/demand', 'Trust issues', 'Fee concerns', 'Better platform', 'Quality issues'],
    transactional: ['Price sensitivity', 'Product quality', 'Delivery issues', 'Customer service', 'Found alternatives'],
    freemium: ['Never converted', 'Feature limits frustrating', 'Found free alternative', 'Not enough value to pay'],
    enterprise_contract: ['Executive sponsor left', 'Failed implementation', 'Poor ROI', 'Vendor consolidation', 'Contract terms'],
    services: ['Service level misses', 'Key people left', 'Price or rate pressure', 'Competitor or offshore alternative', 'Scope changed', 'Governance or reporting gaps', 'Transition problems', 'Vendor consolidation'],
    connectivity: ['Outages and slow repairs', 'Price per site', 'Migration or cut-over pain', 'Competitor or operator switch', 'Contract end and re-tender', 'Security overlay gaps'],
    investment: ['Performance against the agreed benchmark', 'Fee pressure', 'Reporting or explainability gaps', 'Mandate or allocation change', 'Key contact left', 'Risk concerns'],
  };

  const baseReasons = (contractModel && commonReasons[contractModel]) || commonReasons[businessModel] || commonReasons[businessModel === 'services_contract' ? 'services' : businessModel === 'connectivity_contract' ? 'connectivity' : businessModel === 'investment_mandate' ? 'investment' : 'saas_subscription'];
  // Run 20: the sector's own reasons come first (they carry their own signal and intervention); the base list for the model follows.
  const pb = v ? playbookFor(v) : null;
  const sectorReasons = pb ? pb.churnReasons : [];
  const reasons = [...sectorReasons.map((r) => r.reason), ...baseReasons.filter((r) => !sectorReasons.some((x) => x.reason.toLowerCase().split(' ').filter((w) => w.length > 4).some((w) => r.toLowerCase().includes(w))))].slice(0, 9);
  const sectorSignal = (r: string): string | null => sectorReasons.find((x) => x.reason === r)?.signal ?? null;
  const sectorAction = (r: string): string | null => sectorReasons.find((x) => x.reason === r)?.action ?? null;
  const lang = MODEL_LANGUAGE[model ?? (subscription ? 'saas' : 'services')];
  const leave = subscription ? 'churned' : 'ended or did not renew';
  const seg = segmentNotes(segment);
  const sign = product ? `The ${product} team` : 'Your account team';

  return `# Churn Discovery Kit: ${capEcho(segment, 100).short}${product ? ` (${product})` : ''}

## Current Situation

| Metric | Value | Assessment (against example benchmarks) |
|--------|-------|------------|
| **Churn Rate** | ${pct(churnRate)}% | ${severity} against the example thresholds |
| **Business Model** | ${readableChoice(businessModel)}${model === 'investment' && businessModel === 'enterprise_contract' ? ' (an investment mandate)' : ''} | |
| **CS Team** | ${csTeamShown} | |

${contextLine}

**You haven't provided churn reasons.** To build an effective retention playbook, you need to understand WHY customers leave.
${seg ? `\n**In this segment:** a ${subscription ? 'purchase' : 'renewal'} usually involves ${seg.review}. For each account that left, check whether it failed one of these steps, not only the product or the price.\n` : ''}${pb ? `\n**In ${v!.name}:** ${pb.renewal}\n` : ''}

Here's a framework to discover your churn reasons:

---

## Step 1: Churn Survey Template

Send this to customers who recently ${leave}, within 7 days (Example figure: replace with your own):

**Subject:** ${subscription ? 'Quick question: we\'d love your feedback' : 'A short request: what should we have done differently?'}

**Body:**
> Hello,
>
> ${subscription ? 'We\'re sorry to see you go. To help us improve, would you mind sharing the main reason you decided to leave?' : `Thank you for the time we worked together${product ? ` on ${product}` : ''}. To help us improve, would you share the main reason the contract ${leave === 'ended or did not renew' ? 'ended or was not renewed' : leave}?`}
>
> Please pick the one that fits best:
${reasons.map((r) => `> - ${r}`).join('\n')}
> - Other (please say what)
>
> Any additional feedback is greatly appreciated.
>
> Thank you,
> ${sign}

---

## Step 2: Churn Interview Questions

For high-value churns, do a 15-minute call:

### Opening (2 min)
1. "Thanks for taking the time. I'm trying to understand what we could have done better."

### Discovery (10 min)
2. "Walk me through your decision to leave: when did you first start thinking about it?"
3. "What was the final trigger that made you decide?"
4. "If you could change ONE thing about us, what would it be?"
5. "Did you evaluate alternatives? What did they offer that we didn't?"
6. "Was there a moment when you felt most frustrated with us?"
${subscription ? '' : `7. "Who else took part in the decision, and what did they need to see?"\n`}
### Future (3 min)
${subscription ? 7 : 8}. "Is there anything that would bring you back?"
${subscription ? 8 : 9}. "What would you tell someone considering ${product ? product : 'our service'}?"

---

## Step 3: Data Analysis Checklist

Before customers tell you why they left, your data might already show patterns:

### ${subscription ? 'Usage Signals to Check' : 'Service Signals to Check'}
${subscription ? `- [ ] Login frequency trend (30/60/90 days before churn) ${EXAMPLE_FIGURE}
- [ ] Feature adoption (which features did churns NOT use?)
- [ ] Support ticket volume and sentiment
- [ ] Time since last meaningful action
- [ ] NPS or CSAT scores` : `- [ ] Service-level reports in the months before the contract ended ${EXAMPLE_FIGURE}
- [ ] Incidents, repair times or missed targets
- [ ] Support ticket volume and sentiment
- [ ] Changes of contact or sponsor on the customer side
- [ ] NPS or CSAT scores`}

### Correlation Analysis
- [ ] Churn by customer size (SMB vs Enterprise)
- [ ] Churn by acquisition channel
${subscription ? '- [ ] Churn by first feature used\n- [ ] Churn by onboarding completion rate' : '- [ ] Churn by contract term and renewal date\n- [ ] Churn by how long go-live took'}
- [ ] Churn by CSM assignment

---

## Common churn reasons for ${/^[aeiou]/i.test(readableChoice(businessModel)) ? 'an' : 'a'} ${readableChoice(businessModel)} model

Here are common churn reasons to check for your model (a starting checklist, not ranked by likelihood):

${reasons.map((r, i) => `### ${i + 1}. ${r}

**Signals to look for:**
- ${sectorSignal(r) ?? getSignalsForReason(r)}

**Typical intervention:**
- ${sectorAction(r) ?? getInterventionForReason(r)}`).join('\n\n')}

---

${v ? `${sectorNotes(v, 'objections')}\n\n---\n\n` : ''}## Next Steps

1. **Send churn survey** to the last 20 customers who ${leave} ${EXAMPLE_FIGURE}
2. **Conduct 5 churn interviews** with highest-value losses ${EXAMPLE_FIGURE}
3. **Pull data** on the signals above
4. **Come back to this tool** with your top 3-5 churn reasons ${EXAMPLE_FIGURE}

**Once you have churn reasons, run this tool again with:**
\`\`\`
churn_reasons: "reason 1, reason 2, reason 3"
\`\`\`

You'll get a complete playbook with specific interventions for each reason.

---

*Churn Discovery Kit generated using the CRAFT GTM framework*
*For ${lowerFirstIfCommon(capEcho(segment, 100).short)} in ${readableChoice(businessModel)} model*

${SUGGESTION_FOOTER}`;
}

function getSignalsForReason(reason: string): string {
  const signals: Record<string, string> = {
    'Price/value mismatch': 'Mentions "expensive" or "cost" in support tickets, requests for discounts',
    'Missing features': 'Feature request tickets, "can\'t do X" mentions, integration requests',
    'Poor support': 'Low CSAT on tickets, multiple escalations, long resolution times',
    'Competitor switch': 'Competitor mentions in calls, "saw that X can do Y" comments',
    'Low usage/adoption': 'Login frequency dropping, few features used, short sessions',
    'Champion left': 'Primary contact changed, new stakeholder questions basics',
    'Budget cuts': 'Delayed payments, contract negotiation requests, downgrade inquiries',
    'Poor onboarding': `Churns within 30 days ${EXAMPLE_FIGURE}, incomplete setup, never hit first milestone`,
    'Service level misses': 'Service-level reports below target, credits requested, escalations to your management',
    'Key people left': 'Requests to keep named people, complaints about changes in the team, more rework',
    'Price or rate pressure': 'Rate-card comparisons, requests for a cheaper scope, procurement asking for a re-tender',
    'Competitor or offshore alternative': 'Questions about other providers, requests for a rate benchmark',
    'Scope changed': 'Change requests, work outside the statement of work, unclear ownership',
    'Governance or reporting gaps': 'Missed reviews, reports not read, no named service owner on either side',
    'Transition problems': 'Delays against the transition plan, knowledge gaps, parallel run extended',
    'Vendor consolidation': 'Procurement talking about fewer vendors, a rival offering a wider package',
    'Outages and slow repairs': 'Repeated incidents on the same sites, long repair times, service credits paid',
    'Price per site': 'Rate-card comparisons by site, requests to cut low-use sites',
    'Migration or cut-over pain': 'Sites slipping from their wave, rollback requests, branch complaints',
    'Competitor or operator switch': 'Questions about another operator, requests for site-by-site quotes',
    'Contract end and re-tender': 'A tender or RFP announced, procurement contact replaces the network owner',
    'Security overlay gaps': 'Security team raising findings the service does not cover',
    'Performance against the agreed benchmark': 'Performance below the agreed reference for several review periods',
    'Fee pressure': 'Requests to renegotiate fees, comparison with other managers',
    'Reporting or explainability gaps': 'Questions the reports cannot answer, requests for more detail on how decisions are made',
    'Mandate or allocation change': 'Reallocation by the client, a new investment committee, a changed policy',
    'Key contact left': 'Primary contact changed, new stakeholder asks for basics again',
    'Risk concerns': 'Risk or compliance asking for more documentation or limits',
    'Executive sponsor left': 'The sponsor changes role or leaves, the new owner asks for the basics again, meetings with executives stop',
    'Failed implementation': 'Go-live dates slipping, sites or teams never switched over, an open list of issues from the start of the contract',
    'Poor ROI': 'The customer cannot name a result the service delivered, finance asks what the contract is worth',
    'Contract terms': 'Requests to shorten the term, change the notice period or remove a minimum commitment',
    'Unpredictable billing': 'Disputed invoices, questions about how usage is counted, requests for caps',
    'Usage dropped': 'Volume falling month after month with no change on the customer side',
    'Better pricing elsewhere': 'Requests for a price match, quotes from other providers mentioned',
    'Feature gaps': 'Requests for capabilities you do not have, workarounds built outside the product',
    'Integration issues': 'Repeated tickets about data not arriving, manual re-entry, delays in connected systems',
    'Low supply/demand': 'Fewer listings or fewer requests on one side, slower matching',
    'Trust issues': 'Disputes, complaints about quality or fraud, requests to take the transaction outside',
    'Fee concerns': 'Participants asking about the fee or moving repeat deals off the platform',
    'Better platform': 'Participants mention another platform with better reach or lower fees',
    'Quality issues': 'Rising returns, low ratings, repeat complaints about the same participants',
    'Price sensitivity': 'Orders fall after a price change, discount code use rises',
    'Product quality': 'Returns and complaints about the same items',
    'Delivery issues': 'Late or failed deliveries, repeat contacts about the same order',
    'Customer service': 'Long response times, low satisfaction on contacts',
    'Found alternatives': 'Orders move to another seller, mentions of a cheaper alternative',
    'Never converted': 'Accounts that sign up and never take the paid step',
    'Feature limits frustrating': 'Many contacts about a limit, upgrades started and not finished',
    'Found free alternative': 'Mentions of a free tool that does most of the job',
    'Not enough value to pay': 'Heavy use of the free plan but no upgrade, no clear paid-only need',
  };
  return signals[reason] || 'Check support tickets and usage data for mentions';
}

function getInterventionForReason(reason: string): string {
  const interventions: Record<string, string> = {
    'Price/value mismatch': 'ROI review call, value demonstration, usage optimization',
    'Missing features': 'Workaround education, roadmap preview, feature request escalation',
    'Poor support': 'Executive escalation, dedicated support channel, satisfaction recovery',
    'Competitor switch': 'Competitive differentiation call, switching cost analysis, special offer',
    'Low usage/adoption': 'Reactivation campaign, training session, success milestone push',
    'Champion left': 'New champion discovery, executive sponsorship renewal, value resell',
    'Budget cuts': 'Downgrade options, payment flexibility, value justification for leadership',
    'Poor onboarding': 'Onboarding restart, dedicated implementation support, quick win focus',
    'Service level misses': 'Root-cause review with the service owner, a recovery plan with dates, a report the client can check',
    'Key people left': 'Name the backup for each key role, show the knowledge transfer, agree a team review',
    'Price or rate pressure': 'Compare the total cost of the outcome, not the rate; offer a scope or term option instead of a cut',
    'Competitor or offshore alternative': 'Total-cost comparison on the outcome, staged transition proof, references from similar clients',
    'Scope changed': 'Re-baseline the scope, agree the change process, name the owner on both sides',
    'Governance or reporting gaps': 'Reset the review cadence, name the owners, agree the reports the client reads',
    'Transition problems': 'Recovery plan against the transition milestones, extra knowledge transfer, exit criteria for each stage',
    'Vendor consolidation': 'Compare the outcome the buyer needs from each option, not the size of the bundle',
    'Outages and slow repairs': 'Incident review per site, a repair-time commitment you can meet, a fallback link plan',
    'Price per site': 'Total cost per site including outages and management time',
    'Migration or cut-over pain': 'Wave plan with a rollback rule for each wave, fallback links, a named owner per region',
    'Competitor or operator switch': 'Start with the sites where service is worst; let the results make the case',
    'Contract end and re-tender': 'Open the renewal early with the network owner and procurement together, and bring service records',
    'Security overlay gaps': 'Show how network and security controls are managed together and who responds to an incident',
    'Performance against the agreed benchmark': 'A review of the drivers of the gap with the sponsor, and what changes next',
    'Fee pressure': 'Agree reporting and scope instead of a fee cut',
    'Reporting or explainability gaps': 'Add the explanation the client asks for to every report',
    'Mandate or allocation change': 'Meet the new decision makers early and restate the agreed purpose',
    'Key contact left': 'New champion discovery, executive sponsorship renewal',
    'Risk concerns': 'Prepare the documentation and limits risk and compliance ask for, before they ask',
    'Executive sponsor left': 'Meet the new owner in the first weeks, restate the agreed goals and bring the results so far',
    'Failed implementation': 'A recovery plan with dates for the sites or teams not yet live, and a named owner on both sides',
    'Poor ROI': 'A value review that puts the results the contract delivered next to what it costs, in the customer\'s own measures',
    'Contract terms': 'Offer terms that keep the value (scope, phasing, notice) instead of a discount',
    'Unpredictable billing': 'Explain how usage is counted, offer a cap or an alert, and agree a forecast',
    'Usage dropped': 'Find what changed on the customer side and restart with the team that used it most',
    'Better pricing elsewhere': 'Compare the total cost of the outcome, not the unit price',
    'Feature gaps': 'Log the request with the customer, share what the product does today for the need, and agree a workaround',
    'Integration issues': 'Name the owner of each integration on both sides and fix the failing data first',
    'Low supply/demand': 'Focus the effort on the side that is short, in one category or area first',
    'Trust issues': 'Show the checks you run, handle each dispute personally, and report back to those affected',
    'Fee concerns': 'Show what the fee pays for and what repeat participants get for it',
    'Better platform': 'Compare reach and outcomes for the participant, and fix the gaps they name',
    'Quality issues': 'Remove or coach the repeat offenders and publish the quality bar',
    'Price sensitivity': 'Offer value-based options instead of discounts across the board',
    'Product quality': 'Fix the repeat issues and tell the buyers who raised them',
    'Delivery issues': 'Review the carrier or route behind the late orders and tell affected customers',
    'Customer service': 'Review response times and give repeat contacts a named owner',
    'Found alternatives': 'Win back with the reason the customer first chose you, and ask what is missing',
    'Never converted': 'Find the first action that shows value and guide users to it',
    'Feature limits frustrating': 'Review where the limit bites and offer the paid step that removes it',
    'Found free alternative': 'Show what the paid plan does that the free tool does not',
    'Not enough value to pay': 'Ask what would make the paid plan worth it for them, and test it',
  };
  return interventions[reason] || 'Direct outreach to understand and address concern';
}
