import { describeChoice, readableChoice, EXAMPLE_FIGURE, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, q, andList, capEcho, cleanCompanyName, lcFirst } from './context.js';
import { playbookFor, segmentKinds } from './sector-playbooks.js';

// Every rate, fee, deal count and staff count in the tier definitions is an example figure.
const hasFigure = (text: string): boolean => /\d/.test(text);
// Run 19 (D80): a one-line definition for every KPI the program structures list (no figure).
const KPI_DEFINITION: Record<string, string> = {
  'Partner-sourced revenue': 'Revenue from deals a partner sourced',
  'Deals registered': 'Deals a partner registered with you',
  'Certification completion': 'Share of partner staff who finish certification',
  'Partner NPS': 'Partner satisfaction score',
  'Referrals submitted': 'Referrals partners send you',
  'Referral-to-opportunity rate': 'Share of referrals that become qualified opportunities',
  'Referral revenue': 'Revenue from closed referred deals',
  'Active referrers': 'Partners who referred at least once in the period',
  'Integration usage': 'Customers actively using the integration',
  'Joint customers': 'Customers you share with the partner',
  'Co-marketing leads': 'Leads from joint campaigns',
  'Integration NPS': 'Satisfaction of customers using the integration',
  'Implementations delivered': 'Projects the partner delivered',
  'Customer satisfaction': 'Satisfaction of customers the partner served',
  'Expansion revenue influenced': 'Expansion revenue where the partner took part',
  'Certified consultants': 'Partner staff who hold your certification',
  'Clicks': 'Visits from partner links',
  'Conversions': 'Sales or leads from those visits',
  'Revenue': 'Revenue from partner-driven sales',
  'EPC (earnings per click)': 'Partner earnings divided by clicks',
  'Fraud rate': 'Share of partner sales that are reversed or invalid',
  'Volume usage': 'Volume the partner runs through your product',
  'Revenue per partner': 'Revenue divided by active partners',
  'Partner customer satisfaction': 'Satisfaction of the partner\'s own customers',
  'Contract value': 'Total value of partner contracts',
};
// Run 12 (R12-21): money with thousands commas; the amount itself is unchanged.
const cap1 = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
const money = (n: number): string => '$' + Math.round(n).toLocaleString('en-US');

export function generatePartnerArchitect(args: {
  company: string;
  product: string;
  partner_model: string;
  partner_goals: string;
  your_deal_size: string;
  partner_support_capacity?: string;
  existing_partners?: string;
  business_model?: string;
  industry?: string;
}): string {
  const partnerModel = args.partner_model;
  const supportCapacity = args.partner_support_capacity || 'moderate';
  // Run 19 (D80): the sector and the business model are read from the inputs; the stated goal and the existing partners are used.
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [cleanCompanyName(args.company), args.product], context: [args.existing_partners], buyer: [args.partner_goals] });
  const existingPartners = splitItems(args.existing_partners);
  
  // Parse deal size for commission calculations
  const dealSizeRead = readAmount(args.your_deal_size);
  const dealSizeMatch = dealSizeRead !== null;
  const dealSize = dealSizeRead ?? 5000;
  // When no amount is found in the deal size, the figures below use an assumed one: say so.
  const dealSizeShown = dealSizeMatch
    ? args.your_deal_size
    : `${args.your_deal_size} (no amount found, so ${money(dealSize)} is assumed) ${EXAMPLE_FIGURE}`;
  const dealSizeBasis = dealSizeMatch
    ? `${args.your_deal_size} deal size`
    : `an assumed ${money(dealSize)} deal size ${EXAMPLE_FIGURE}`;
  
  interface PartnerTier {
    name: string;
    requirements: string[];
    benefits: string[];
    commission: string;
    support: string;
  }
  
  const programStructures: Record<string, { overview: string; tiers: PartnerTier[]; kpis: string[] }> = {
    reseller: {
      overview: 'Partners purchase licenses/subscriptions at discount and resell to end customers. Full sales cycle ownership.',
      tiers: [
        { name: 'Authorized', requirements: ['Sign partner agreement', 'Complete basic certification', '0 deals closed'], benefits: ['Partner portal access', 'Basic sales materials', 'Deal registration'], commission: `${money(dealSize * 0.15)} (15% discount)`, support: 'Email support, monthly newsletter' },
        { name: 'Silver', requirements: ['3+ deals/quarter', '1 certified seller', 'Demo environment active'], benefits: ['Co-marketing funds ($500/q)', 'Lead sharing', 'Priority support'], commission: `${money(dealSize * 0.20)} (20% discount)`, support: 'Dedicated Slack channel, QBRs' },
        { name: 'Gold', requirements: ['10+ deals/quarter', '3 certified staff', 'Joint business plan'], benefits: ['Co-marketing funds ($2K/q)', 'Exec sponsor', 'Product roadmap input', 'Event sponsorship'], commission: `${money(dealSize * 0.25)} (25% discount)`, support: 'Dedicated partner manager, weekly syncs' },
        { name: 'Platinum', requirements: ['25+ deals/quarter', '5 certified staff', 'Exclusivity in territory (optional)'], benefits: ['Custom pricing', 'Co-development opportunities', 'Advisory board seat', 'First access to features'], commission: `${money(dealSize * 0.30)} (30% discount)`, support: 'Strategic partnership team, exec alignment' }
      ],
      kpis: ['Partner-sourced revenue', 'Deals registered', 'Certification completion', 'Partner NPS']
    },
    referral: {
      overview: 'Partners refer leads; your team handles sales. Lower commitment, broader reach.',
      tiers: [
        { name: 'Referrer', requirements: ['Sign referral agreement', 'Submit first referral'], benefits: ['Unique referral link', 'Basic tracking dashboard'], commission: `${money(dealSize * 0.10)} per closed deal (10%)`, support: 'Self-serve portal' },
        { name: 'Advocate', requirements: ['3+ qualified referrals/quarter', 'Optional: brief training'], benefits: ['Priority referral processing', 'Monthly reports', 'Swag kit'], commission: `${money(dealSize * 0.15)} per closed deal (15%)`, support: 'Monthly email updates, annual appreciation event' }
      ],
      kpis: ['Referrals submitted', 'Referral-to-opportunity rate', 'Referral revenue', 'Active referrers']
    },
    integration_tech: {
      overview: 'Technology partners build integrations. Value comes from expanded capabilities and shared customers.',
      tiers: [
        { name: 'Listed', requirements: ['Basic integration built', 'Documentation provided', 'Support process defined'], benefits: ['Marketplace listing', 'Integration badge', 'API access'], commission: 'No direct commission: mutual value', support: 'Technical documentation, community forum' },
        { name: 'Certified', requirements: ['Deep integration', 'Joint customers', 'Co-marketing commitment'], benefits: ['Featured placement', 'Co-marketing funds', 'Joint webinars', 'Shared leads'], commission: 'Revenue share on joint deals (10-15%)', support: 'Integration engineer, monthly syncs' },
        { name: 'Strategic', requirements: ['Native integration', 'Significant joint revenue', 'Exec sponsorship'], benefits: ['Product integration', 'Joint GTM motion', 'Roadmap alignment', 'Co-selling'], commission: 'Custom revenue share based on deal structure', support: 'Dedicated partnership team, exec alignment' }
      ],
      kpis: ['Integration usage', 'Joint customers', 'Co-marketing leads', 'Integration NPS']
    },
    agency_si: {
      overview: 'Services partners implement, customize, and support your product. Revenue from implementation fees.',
      tiers: [
        { name: 'Registered', requirements: ['Sign partner agreement', 'Complete implementation certification', '1 project delivered'], benefits: ['Partner portal', 'Implementation guides', 'Referral fees for leads'], commission: `${money(dealSize * 0.10)} referral fee + implementation revenue`, support: 'Documentation, community' },
        { name: 'Certified', requirements: ['3+ implementations', '2 certified consultants', 'Case study'], benefits: ['Lead sharing', 'Co-marketing', 'Listed as certified partner'], commission: `${money(dealSize * 0.15)} referral + premium implementation rates`, support: 'Partner manager, monthly office hours' },
        { name: 'Premier', requirements: ['10+ implementations', '5 certified consultants', 'Dedicated practice'], benefits: ['Exclusive territories', 'Joint sales', 'Product influence', 'Premier badge'], commission: `${money(dealSize * 0.20)} referral + exclusive implementation rights`, support: 'Strategic partner manager, weekly syncs, exec access' }
      ],
      kpis: ['Implementations delivered', 'Customer satisfaction', 'Expansion revenue influenced', 'Certified consultants']
    },
    affiliate: {
      overview: 'Performance-based marketing partners. Drive traffic and conversions via unique links.',
      tiers: [
        { name: 'Affiliate', requirements: ['Sign affiliate agreement', 'Have relevant audience'], benefits: ['Unique tracking links', 'Creative assets', 'Real-time dashboard'], commission: `${money(dealSize * 0.10)} per sale or ${money(dealSize * 0.05)}/lead`, support: 'Self-serve portal, email support' },
        { name: 'Super Affiliate', requirements: ['$5K+ monthly revenue', 'Quality traffic only'], benefits: ['Custom landing pages', 'Higher commission', 'Priority support', 'Exclusive promotions'], commission: `${money(dealSize * 0.15)} per sale (15%)`, support: 'Dedicated affiliate manager' }
      ],
      kpis: ['Clicks', 'Conversions', 'Revenue', 'EPC (earnings per click)', 'Fraud rate']
    },
    oem_white_label: {
      overview: 'Partners embed your product within theirs. Deep integration, significant volume.',
      tiers: [
        { name: 'OEM License', requirements: ['Volume commitment', 'Technical integration', 'Support capability'], benefits: ['White-label rights', 'API access', 'Volume pricing'], commission: 'N/A: volume-based pricing (typically 50-70% discount)', support: 'Integration support, SLA' },
        { name: 'Strategic OEM', requirements: ['Significant volume', 'Co-development', 'Multi-year commitment'], benefits: ['Custom development', 'Roadmap influence', 'Exclusivity options'], commission: 'Custom pricing, revenue share options', support: 'Dedicated team, exec alignment' }
      ],
      kpis: ['Volume usage', 'Revenue per partner', 'Partner customer satisfaction', 'Contract value']
    }
  };
  
  const program = programStructures[partnerModel] || programStructures.referral;
  // Run 20: a deal of this size is sold through relationships, so a referral or affiliate partner is given a person in your sales team, status
  // updates on each referred account and joint account planning, not a self-serve portal and a swag kit. The commission amounts do not change.
  const relationshipSale = dealSize >= 20000 || (ctx.model !== null && ctx.model !== 'saas' && ctx.model !== 'marketplace');
  if (relationshipSale && partnerModel === 'referral') {
    program.tiers[0] = { ...program.tiers[0], benefits: ['A named contact in your sales team', 'Referral registration with a status update on every referred account'], support: 'A partner manager call on each referred opportunity' };
    program.tiers[1] = { ...program.tiers[1], benefits: ['Joint account planning for referred accounts', 'Invitations to customer and executive events', 'Priority referral processing'], support: 'Quarterly review with a partner manager, annual partner event' };
  }
  const pb = ctx.v ? playbookFor(ctx.v) : null;
  const goalSegments = segmentKinds(args.partner_goals);
  const sameName = args.product.trim().toLowerCase() === args.company.trim().toLowerCase() || args.product.trim().split(/\s+/).length <= 3 && args.product.toLowerCase().includes(args.company.toLowerCase());
  // a figure is a number that is not part of a word (3PL, 4G and CPaaS hold no target)
  const goalHasFigure = /(?<![A-Za-z0-9])\d[\d,.]*(?![A-Za-z0-9])/.test(args.partner_goals.replace(/\bno numeric target given\b/gi, ''));
  const firstKind = pb ? ({ referral: pb.partners.refer, affiliate: pb.partners.refer, reseller: pb.partners.resell, integration_tech: pb.partners.integrate, oem_white_label: pb.partners.integrate, agency_si: pb.partners.implement } as Record<string, string[]>)[partnerModel]?.[0] ?? '' : '';
  const exampleDeals = 10;
  
  const supportAdjustments: Record<string, string> = {
    minimal_self_serve: `Note: With minimal support capacity, prioritize self-serve onboarding, comprehensive documentation, and automated reporting. Consider limiting to 2 tiers max. ${EXAMPLE_FIGURE}`,
    moderate: 'With moderate capacity, balance 1:1 support for top partners with self-serve for others. Consider office hours model.',
    high_touch: 'With high-touch capacity, you can offer white-glove onboarding and dedicated partner managers across tiers.'
  };

  return `# Partner Program Architecture
## ${args.company}: ${partnerModel.replace(/_/g, ' ')} program

**Partner Model:** ${partnerModel.replace(/_/g, ' ')}
**Product:** ${args.product}
**Average Deal Size:** ${dealSizeShown}
**Support Capacity:** ${describeChoice(args.partner_support_capacity, supportCapacity)}

${ctx.line}

---

## Program Overview

${program.overview}
${partnerModel === 'affiliate' || partnerModel === 'referral' ? (ctx.v && /enterprise/i.test(ctx.v.salesMotion) ? `\n*Sector note: deals in ${ctx.v.name} run as enterprise sales with a buying committee, so ${partnerModel} partners usually bring leads, not closed deals. Measure qualified opportunities, not only referrals.*\n` : '') : ''}${ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment' ? `\n*The deal size you gave is treated as the annual contract value. Check how your contract term and notice period change what a partner should earn.*\n` : ''}

${supportAdjustments[supportCapacity] || ''}

---

## Partner Tiers

${program.tiers.map((tier, i) => `
### Tier ${i + 1}: ${tier.name}

**Requirements to Qualify:**${tier.requirements.some(hasFigure) ? ` ${EXAMPLE_FIGURES}` : ''}
${tier.requirements.map(r => `- ${r}`).join('\n')}

**Benefits:**${tier.benefits.some(hasFigure) ? ` ${EXAMPLE_FIGURES}` : ''}
${tier.benefits.map(b => `- ${b}`).join('\n')}

**Commission/Economics:**
\`${tier.commission}\`${hasFigure(tier.commission) ? ` ${EXAMPLE_FIGURE}` : ''}

**Support Level:**
${tier.support}

---
`).join('')}

## Economic Model

### Partner Economics Calculator

${EXAMPLE_FIGURES} The commission rates and deal counts in this table are illustrations, applied to ${dealSizeMatch ? 'your' : 'the assumed'} deal size.
| Scenario | Partner Effort | Partner Earnings | Your Revenue |
|----------|---------------|------------------|--------------|
| ${program.tiers[0].name} (1 deal) | Low | ${money(dealSize * 0.10)} | ${money(dealSize * 0.90)} |
| ${program.tiers.length > 1 ? program.tiers[1].name : program.tiers[0].name} (5 deals) | Medium | ${money(dealSize * 0.15 * 5)} | ${money(dealSize * 0.85 * 5)} |
| Top partner (20 deals, example 25% rate) | High | ${money(dealSize * 0.25 * 20)} | ${money(dealSize * 0.75 * 20)} |

### Commission Viability Check

Based on ${dealSizeBasis} (checked against example deal-size thresholds):
- ${dealSize > 1000 ? 'Deal size supports meaningful partner commissions' : 'Note: Deal size may be too small for reseller model, so consider affiliate or referral'}
- ${dealSize > 5000 ? 'Can support dedicated partner manager at scale' : 'Note: May need to rely on self-serve until partner volume justifies support'}
- ${dealSize > 10000 ? 'At this deal size a named partner manager and tailored onboarding for each partner are justified' : 'Consider pooled partner support model'}

---

## Program KPIs

**Your stated goal:** ${q(capEcho(args.partner_goals, 220).short)}

${goalHasFigure ? 'Use the figures in your goal as the targets of the first rows below.' : 'Your goal holds no number, so each target below is set from your first quarter of data.'} A worked example at your deal size: ${exampleDeals} closed partner-sourced deals are ${money(dealSize * exampleDeals)} in annual contract value ${EXAMPLE_FIGURE}

| Metric | Definition | Target | Tracking |
|--------|------------|--------|----------|
${program.kpis.map((kpi, i) => `| ${kpi} | ${KPI_DEFINITION[kpi] || 'The measure for this program'} | ${i === 0 ? (goalHasFigure ? 'From your goal above' : 'Set from your first quarter of data') : 'Set from your first quarter of data'} | Your CRM or partner portal |`).join('\n')}

---

${existingPartners.length ? `## Your Existing Partners

${existingPartners.map((x) => `- ${q(x)}`).join('\n')}

You gave no details beyond this, so none is placed in a tier. Check each against the tier requirements above: until a partner meets them it sits in the first tier (${program.tiers[0].name}).

---

` : ''}## ${ctx.v ? 'Partners That Fit This Sector' : 'Partners That Reach Your Segments'}

*Kinds of company, not names. Pick the ones that already advise or sell to your buyers.*

${(() => {
  const kindsKey: Record<string, keyof NonNullable<typeof pb>['partners']> = { referral: 'refer', affiliate: 'refer', reseller: 'resell', integration_tech: 'integrate', oem_white_label: 'integrate', agency_si: 'implement' };
  const key = kindsKey[partnerModel] ?? 'refer';
  const lines: string[] = [];
  if (pb && ctx.v) {
    lines.push(`**In ${ctx.v.name}** (${partnerModel.replace(/_/g, ' ')} partners): ${andList(pb.partners[key])}.`);
    lines.push(`**Why:** ${pb.partnerWhy}`);
    lines.push(`**Who they reach:** ${ctx.v.committee}`);
  }
  if (goalSegments.length) lines.push(`**For the segments in your goal:** ${goalSegments.map((g) => `for ${g.kind}, ${g.partners}`).join('; ')}.`);
  if (!lines.length) lines.push('The sector is not clear from your inputs, and your goal names no segment this tool knows: name the industry (the industry input) or the segments you aim at to get partner kinds.');
  if (ctx.v) lines.push(`**Words this buyer uses, for partner materials:** ${ctx.v.vocabulary.join(', ')}. **A joint proof point that lands:** ${ctx.v.proofShape}`);
  return lines.join('\n\n');
})()}

---

## Onboarding Flow

### Day 0-7: Welcome & Setup
- [ ] Partner agreement signed
- [ ] Portal access provisioned
- [ ] Welcome kit sent (digital)
- [ ] Kickoff call scheduled (if ${supportCapacity === 'minimal_self_serve' ? 'top tier only' : 'applicable'})

### Day 7-30: Enable
- [ ] ${partnerModel === 'reseller' || partnerModel === 'agency_si' ? 'Certification started/completed' : 'Training materials reviewed'}
- [ ] ${partnerModel === 'integration_tech' ? 'Integration development started' : 'Sales materials accessed'}${ctx.v ? `\n- [ ] Walk through the objections buyers in ${ctx.v.name} raise: ${andList(ctx.v.objections.slice(0, 3).map((o) => lcFirst(o.objection)))}` : ''}
- [ ] First ${partnerModel === 'affiliate' ? 'campaigns launched' : partnerModel === 'integration_tech' ? 'API calls made' : 'prospect identified'}

### Day 30-60: Activate
- [ ] First ${partnerModel === 'referral' || partnerModel === 'affiliate' ? 'referral/lead submitted' : 'deal registered'}
- [ ] ${partnerModel === 'integration_tech' ? 'Integration live in marketplace' : 'Pipeline developing'}
- [ ] Regular cadence established

### Day 60-90: Optimize
- [ ] First ${partnerModel === 'affiliate' ? 'commission paid' : 'deal closed'}
- [ ] Performance review completed
- [ ] Expansion plan discussed

---

## Partner Communications

### Recruitment Email Template

\`\`\`
Subject: ${cap1(partnerModel.replace(/_/g, ' '))} partnership with ${args.company}

Hello,

I am writing from ${args.company}.${sameName ? '' : ` In short, ${args.company} offers ${q(capEcho(args.product, 160).short)}.`}${pb ? ` Your clients include the people who decide on this: ${andList(ctx.v!.buyerRoles.slice(0, 3))}.` : ''} I think there is a strong opportunity for us to work together. Partners ${partnerModel === 'reseller' ? 'can expand their revenue by offering our solution alongside their services' : partnerModel === 'referral' ? 'earn a commission on each closed deal (see the tiers above)' : partnerModel === 'integration_tech' ? 'can increase their product value through deep integration' : 'can grow their business with our tools'}.
${partnerModel === 'reseller' ? `\nWith deals averaging ${args.your_deal_size}, partners at the Silver tier would earn about ${money(dealSize * 0.20 * 5)} a quarter. ${EXAMPLE_FIGURE}\n` : ''}
Would you be open to a 15-minute call to explore fit?

The ${args.company} partnerships team
\`\`\`

---

*Partner program architecture generated using the CRAFT GTM framework*
*Customized for ${partnerModel.replace(/_/g, ' ')} model with ${readableChoice(supportCapacity)} support capacity*

${SUGGESTION_FOOTER}`;
}

// Reads one amount from text: "$5,000", "$50K" and "$1.5M" give 5000, 50000 and 1500000 (run 7, T5).
function readAmount(text: string): number | null {
  const m = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([kmb])?\b/i);
  if (!m) return null;
  const mult: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
  return Math.round(parseFloat(m[1]) * (mult[(m[2] || '').toLowerCase()] ?? 1));
}
