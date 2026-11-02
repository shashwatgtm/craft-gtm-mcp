import { SOFTWARE_REFERRAL } from './software-policy.js';
import { readableChoice } from './utils.js';
import { readContext, splitItems, q, cleanCompanyName, lcFirst } from './context.js';
import { playbookFor, kindsNote } from './sector-playbooks.js';
import { stripEnd, lc, listAnd, productLabel, closing, finalise, segmentsOfGoal, productKinds, MODEL_KINDS } from './rw-gtm.js';
// Run 19 (D80): a one-line definition for every KPI the program structures list (no figure).
const KPI_DEFINITION = {
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
const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
export function generatePartnerArchitect(args) {
    const partnerModel = args.partner_model;
    const supportCapacity = args.partner_support_capacity || 'moderate';
    // Run 19 (D80): the sector and the business model are read from the inputs; the stated goal and the existing partners are used.
    const ctx = readContext({ model: args.business_model, vertical: args.industry, sector: args.your_sector }, { seller: [cleanCompanyName(args.company), args.product], context: [args.existing_partners], buyer: [args.partner_goals] });
    const existingText = (args.existing_partners || '').trim();
    const absentPartners = /^(?:no\b|none\b|not (?:yet )?any\b|we (?:do not|don't) have\b|without\b)/i.test(existingText);
    const existingPartners = absentPartners ? [] : splitItems(args.existing_partners);
    const rate = args.partner_goals.match(/(?:Confirmed rate|Approved commission):\s*(\d+(?:\.\d+)?)%/i)?.[1];
    const margin = args.partner_goals.match(/(?:Minimum retained margin|Margin constraint):\s*(\d+(?:\.\d+)?)%/i)?.[1];
    const termsConfirmed = !!rate && !!margin && Number(rate) <= 100 && Number(margin) <= 100 && !/\b(?:not|unconfirmed|proposed)\b[^;\n]{0,30}(?:rate|commission|margin)/i.test(args.partner_goals);
    const terms = termsConfirmed ? `Owner supplied commission ${rate}%; minimum retained margin ${margin}%. Verify actual unit costs and partner acceptance before agreeing terms.` : 'Commission rate and margin constraint are unconfirmed. No payment terms are proposed.';
    // Parse deal size for commission calculations
    const dealSizeRead = readAmount(args.your_deal_size);
    const dealSizeMatch = dealSizeRead !== null;
    const dealSize = dealSizeRead ?? 5000;
    const programStructures = {
        reseller: {
            overview: 'Partners purchase licenses/subscriptions at discount and resell to end customers. Full sales cycle ownership.',
            tiers: [
                { name: 'Authorized', requirements: ['Sign partner agreement', 'Complete basic certification', '0 deals closed'], benefits: ['Partner portal access', 'Basic sales materials', 'Deal registration'], commission: `${money(dealSize * 0.15)} (15% discount)`, support: 'Email support, monthly newsletter' },
                { name: 'Silver', requirements: ['3+ deals/quarter', '1 certified seller', 'Demo environment active'], benefits: ['Co-marketing funds ($500/q)', 'Lead sharing', 'Priority support'], commission: `${money(dealSize * 0.20)} (20% discount)`, support: SOFTWARE_REFERRAL },
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
                { name: 'OEM License', requirements: ['Volume commitment', 'Technical integration', 'Support capability'], benefits: ['White-label rights', 'API access', 'Volume pricing'], commission: 'N/A: volume-based pricing (your own OEM discount (not given))', support: 'Integration support, SLA' },
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
    const productText = `${args.company} ${args.product}`;
    const { found: goalSegments, unknown: unknownSegments } = segmentsOfGoal(args.partner_goals, productText, partnerModel);
    const prodKinds = productKinds(productText, productText);
    const goalClean = stripEnd(args.partner_goals.replace(/;?\s*no numeric target given\.?/i, ''));
    const goalInEmail = /^(?:find|recruit|sign|build|generate|reach|win|grow|create|qualify)\b/i.test(goalClean) ? `to ${lc(goalClean)}` : lc(goalClean);
    // a figure is a number that is not part of a word (3PL, 4G and CPaaS hold no target)
    const goalHasFigure = /(?<![A-Za-z0-9])\d[\d,.]*(?![A-Za-z0-9])/.test(args.partner_goals.replace(/\bno numeric target given\b/gi, ''));
    const exampleDeals = 10;
    const pm = partnerModel.replace(/_/g, ' ');
    const company = stripEnd(args.company);
    const label = productLabel(args.product, args.company);
    const startsWithCompany = label.name !== null && label.name.toLowerCase() === company.toLowerCase();
    // the offer as a noun phrase: the product as typed when it carries the company name or is a short name, else the company's own description of it
    const offer = startsWithCompany || (args.product.trim().split(/\s+/).length <= 3 && /^[A-Z]/.test(args.product.trim())) ? stripEnd(args.product) : `${company}'s ${lc(stripEnd(args.product).replace(/^(?:an?|the)\s+/i, ''))}`;
    // in the email the offer follows "about": "our managed SD-WAN for branch offices"
    const offerInEmail = startsWithCompany && label.rest ? `our ${lc(label.rest.replace(/^(?:an?|the)\s+/i, ''))}` : startsWithCompany ? 'our offer' : /^(?:an?|the)\s/i.test(args.product.trim()) ? stripEnd(args.product) : args.product.trim().split(/\s+/).length <= 3 && /^[A-Z]/.test(args.product.trim()) ? stripEnd(args.product) : `our ${lc(stripEnd(args.product))}`;
    // what a reseller or OEM partner buys, by business model (a services firm has no licences, a connectivity seller no seats)
    const thing = { saas: 'licences or subscriptions', services: 'your services', connectivity: 'your connectivity services', transactions: 'your product on its usual per-transaction terms', marketplace: 'access to your marketplace', hardware_software: 'your hardware and software', investment: 'access to your strategies' };
    const buys = (ctx.model && thing[ctx.model]) || 'your product';
    const overview = {
        reseller: `Partners buy ${buys} from you at a discount and resell them to end customers, so they own the whole sales cycle.`,
        referral: 'Partners introduce leads and your own team runs the sale, which asks less of a partner and reaches further.',
        integration_tech: 'Technology partners build integrations with your product; the value comes from the extra capability and the customers you share.',
        agency_si: `Services partners implement, customise and support ${ctx.model === 'saas' || !ctx.model ? 'your product' : buys}, and earn implementation fees as well as referral fees.`,
        affiliate: 'Performance based partners bring traffic and conversions through their own tracked links.',
        oem_white_label: 'Partners embed your product inside their own, which means deep integration and significant volume.',
    };
    const capacityWords = { minimal_self_serve: 'minimal, self serve', moderate: 'moderate', high_touch: 'high touch' };
    const capacity = args.partner_support_capacity ? capacityWords[args.partner_support_capacity] ?? readableChoice(args.partner_support_capacity) : 'moderate';
    const supportAdjustments = {
        minimal_self_serve: 'With minimal support capacity, put the effort into self serve onboarding, thorough documentation and automated reporting, and keep the program to two tiers at most.',
        moderate: 'With moderate capacity, give your top partners one to one support and put the others on self serve with office hours.',
        high_touch: 'With high touch capacity, you can offer white glove onboarding and dedicated partner managers across the tiers.',
    };
    const contractBasis = ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment';
    const annualPrice = /\b(?:annual(?:ly)?|yearly|per year|a year|ACV)\b/i.test(args.your_deal_size);
    const oneOffPrice = /\b(?:one[ -]off|one[ -]time|upfront|project price)\b/i.test(args.your_deal_size);
    const monthlyPrice = /\b(?:monthly|per month|a month)\b/i.test(args.your_deal_size);
    const priceBasis = Number(annualPrice) + Number(oneOffPrice) + Number(monthlyPrice) !== 1 ? null : annualPrice ? 'annual contract value' : oneOffPrice ? 'one-off contract value' : 'monthly contract value';
    const dealLine = dealSizeMatch
        ? `A typical deal is ${stripEnd(args.your_deal_size)}.${priceBasis ? '' : ' The billing period is not established; this plan does not treat the amount as annual revenue.'}`
        : `You gave ${q(args.your_deal_size)} as the deal size, which holds no amount, so every figure below assumes ${money(dealSize)}.`;
    let out = `# Partner program for ${company}

## First referral pilot
${absentPartners ? 'No existing partner evidence was supplied.' : existingPartners.length ? 'Named partners still need qualification and agreement for this pilot.' : 'Existing partner evidence is unknown.'}
Qualify one introduction: the buyer confirms an approval or workflow problem, the relevant decision role and permission for contact. Record the introduction source, date and CRM owner; agree attribution before outreach. Review the pilot after the first introduction with the partner and owner, using acceptance, buyer response and support time. Continue only when qualification and attribution are agreed.

**Commercial confirmation:** ${terms}

This is a ${pm} partner program for ${offer}. ${dealLine} You can support partners at a ${capacity} level.

**Your stated goal:** ${q(args.partner_goals)}

${ctx.line}${kindsNote(ctx.v, company, 'product')}

## How the program works

${overview[partnerModel] ?? overview.referral}${(partnerModel === 'affiliate' || partnerModel === 'referral') && ctx.v && /enterprise/i.test(ctx.v.salesMotion) ? ` Deals in ${ctx.v.name} run as enterprise sales with a buying committee, so ${pm} partners usually bring leads rather than closed deals: measure qualified opportunities, not only referrals.` : ''}${contractBasis ? ` A fee or discount on a contract that runs for several years needs a rule: decide whether it is paid on the first year only or on each year of the term, and check how your notice period changes what a partner should earn.` : ''}

${supportAdjustments[args.partner_support_capacity ?? 'moderate'] ?? supportAdjustments.moderate}

## ${ctx.v ? 'Partners That Fit This Sector' : 'Partners That Reach Your Segments'}

`;
    const kindsKey = { referral: 'refer', affiliate: 'refer', reseller: 'resell', integration_tech: 'integrate', oem_white_label: 'integrate', agency_si: 'implement' };
    const lines = [];
    if (existingPartners.length)
        lines.push(`Start with the partners you already have: ${listAnd(existingPartners.map((x) => q(x)))}. Check each partner's qualifying closed deals and period against the example tier requirements. Until that check, use the first tier (${program.tiers[0].name}) as a provisional planning position, not an earned status.`);
    if (pb && ctx.v) {
        lines.push(`In ${ctx.v.name}, ${pm} partners are usually ${listAnd(pb.partners[kindsKey[partnerModel] ?? 'refer'])}. ${pb.partnerWhy}`);
        lines.push(`Between them they reach the people who decide: ${lcFirst(ctx.v.committee)}`);
    }
    if (!pb)
        lines.push(`${cap1(pm)} partners are usually ${MODEL_KINDS[partnerModel] ?? MODEL_KINDS.referral}.`);
    for (const k of prodKinds)
        lines.push(k.fromName ? `The name suggests ${k.does}; if that is right, also look for ${k.partners}. Say what the product does in the product input to confirm it.` : `Your product works with ${k.does}, so also look for ${k.partners}.`);
    if (goalSegments.length)
        lines.push(`To reach the segments in your goal (keep the kinds whose clients already buy a product like yours):\n${goalSegments.map((g) => `- **${cap1(g.name)}:** ${prodKinds.length ? `reach it through the kinds above that already work with these buyers, and through ${g.partners.split(', ')[0]}.` : `look for ${g.partners}.`}${g.buying ? ` ${g.buying}` : ''}`).join('\n')}`);
    if (unknownSegments.length)
        lines.push(`This tool has no partner kinds for ${listAnd(unknownSegments)}. To find them, ask five of your best customers in ${unknownSegments.length > 1 ? 'each of those segments' : 'that segment'} who advised them on the purchase and who set the product up, and recruit from those answers.`);
    if ((pb && /investment/i.test(ctx.v.name)) || goalSegments.some((g) => g.name === 'investment institutions'))
        lines.push('Independence matters here: investment consultants who advise allocators on suppliers may not be paid to recommend one. Use a non-commission relationship with them (shared research, introductions on request), and a referral fee only where compliance allows it, in writing and disclosed.');
    if (!pb && !prodKinds.some((k) => !k.fromName))
        lines.push(`These kinds come from the partner model${goalSegments.length ? ' and the segments in your goal' : ''}, not from what the product does: your product input does not say what it does.`);
    if (ctx.v)
        lines.push(`Words your buyers use, for partner materials: ${ctx.v.vocabulary.join(', ')}. A joint proof point that lands: ${lc(ctx.v.proofShape)}`);
    out += `These are kinds of company, not names: pick the ones that already advise or sell to your buyers.\n\n${lines.join('\n\n')}\n\n`;
    out += `## Partner tiers

Every rate, amount, deal count and fund size in the tiers and tables below is an example to replace with your own.${goalSegments.some((g) => g.motion) ? `\n\nIn your segments a partner is judged on how it runs the first account: ${goalSegments.filter((g) => g.motion).map((g) => `${g.name}: ${g.motion}`).join('; ')}. Qualify partners on that, not only on the count of referrals.` : ''}

${program.tiers.map((tier, i) => `### Tier ${i + 1}: ${tier.name}

- **To qualify:** ${tier.requirements.map(lc).join('; ')}.
- **Benefits:** ${tier.benefits.map((b) => lc(b.replace(/\badvisory board seat\b/i, 'a place on the partner advisory board'))).join('; ')}.
- **Partner earns:** Terms for ${tier.name} await commercial confirmation
- **Support:** ${lc(tier.support)}.`).join('\n\n')}

## Commercial terms to confirm

Review the commercial confirmation above.
A deal amount alone does not establish margin or support capacity. Confirm the payment basis, unit cost, retained margin and attribution window before proposing commission.

## Targets and KPIs

${goalHasFigure ? 'Your goal holds figures. Confirm what each counts and the period before assigning it to a KPI; recruiting partners does not establish won revenue.' : 'No closed partner deal target was supplied. Keep a partner recruitment goal separate from a won revenue target.'} A worked example at your deal size: ${exampleDeals} closed partner-sourced deals are ${money(dealSize * exampleDeals)} in ${priceBasis || 'contract value on the supplied price basis, with the billing period still to confirm'}, as an example. This multiplication does not predict wins or cash collected.

| Metric | What it measures |
|--------|------------------|
${program.kpis.map((kpi) => `| ${kpi} | ${KPI_DEFINITION[kpi] || 'The measure for this program'} |`).join('\n')}

Track all of them in your CRM or partner portal.

## The first 90 days

Proposed milestones, subject to partner agreement and pilot evidence. Dates do not promise a signed agreement, a launch or a sale.

- **Days 0 to 7, welcome and set up:** the partner signs the agreement, gets portal access and a digital welcome kit, and has a kickoff call (${supportCapacity === 'minimal_self_serve' ? 'top tier only' : 'where it applies'}).
- **Days 7 to 30, enable:** ${partnerModel === 'reseller' || partnerModel === 'agency_si' ? 'certification is started or completed' : 'training materials are reviewed'}, ${partnerModel === 'integration_tech' ? 'integration development begins' : 'sales materials are in use'}${ctx.v ? `, and the partner walks through the objections buyers in ${ctx.v.name} raise: ${listAnd(ctx.v.objections.slice(0, 3).map((o) => lcFirst(o.objection)))}` : ''}. The first ${partnerModel === 'affiliate' ? 'campaign goes live' : partnerModel === 'integration_tech' ? 'API calls are made' : 'prospect is identified'}.
- **Days 30 to 60, activate:** the first ${partnerModel === 'referral' || partnerModel === 'affiliate' ? 'referral or lead is submitted' : 'deal is registered'}, ${partnerModel === 'integration_tech' ? 'the integration goes live in the marketplace' : 'a pipeline starts to build'} and a regular cadence is set.${goalSegments.some((g) => g.motion) ? ` Agree how a first referred account would run in ${listAnd(goalSegments.filter((g) => g.motion).map((g) => g.name))}: ${goalSegments.find((g) => g.motion).motion} comes first.` : ''}
- **Days 60 to 90, review:** check whether a qualified deal has closed, then reconcile attribution, collected payment and agreed terms before any commission. Review buyer response and support time even if no deal has closed. Expand only if the pilot evidence supports it.

## Recruitment email

\`\`\`
Subject: ${cap1(pm)} partnership with ${company}

Hello,

${startsWithCompany && !label.rest ? `I am writing from ${company} to ask whether you would partner with us.` : `I am writing from ${company} about ${offerInEmail}.`}${goalClean && goalClean.length <= 240 ? ` Our goal is ${goalInEmail}.` : goalSegments.length ? ` We are looking for partners whose clients include ${listAnd(goalSegments.map((g) => g.name))}.` : ''}${goalSegments.length ? ` We are looking for partners such as ${listAnd(goalSegments[0].partners.split(', ').slice(0, 2))} that already serve clients in ${listAnd(goalSegments.map((g) => g.name.replace(/public sector/, 'public bodies')))}.${goalSegments.find((g) => g.risks) ? ` Clients in ${goalSegments.find((g) => g.risks).name} are often dealing with ${goalSegments.find((g) => g.risks).risks}.` : ''}` : ''}${prodKinds.some((k) => !k.fromName) ? ` ${cap1(startsWithCompany && !label.rest ? 'our product' : offerInEmail)} works with ${listAnd(prodKinds.filter((k) => !k.fromName).map((k) => k.does))}, which is the part your clients would use.` : pb && ctx.v && pb.pains[0] ? ` Many buyers in ${ctx.v.name} are dealing with ${lc(stripEnd(pb.pains[0]))}, and we think ${startsWithCompany && !label.rest ? 'our product' : offerInEmail} can help your clients with that.` : ''}${pb && ctx.v ? ` The people who decide on this are usually ${listAnd(ctx.v.buyerRoles.slice(0, 3))}.` : ''} ${{
        reseller: 'As a partner you can grow your revenue by offering it alongside your own services.',
        referral: 'Our team would run the sale after an accepted introduction. Before any referral, we would agree qualification, attribution and any fee in writing.',
        integration_tech: 'A deeper integration would add to the value of both products for the customers we share.',
        agency_si: 'As an implementation partner you would deliver the work, supported by our team.',
        affiliate: 'Before any affiliate campaign, we would agree eligible leads or sales, attribution, any payment and the terms in writing.',
        oem_white_label: 'As an OEM partner you would build it into your own product under your own brand.',
    }[partnerModel] ?? 'We think there is a strong opportunity to work together.'}

Would you be open to a 15-minute call to explore fit?

The ${company} partnerships team
\`\`\`
`;
    const asks = [];
    if (!args.partner_support_capacity)
        asks.push([`partner support capacity, which this plan assumes is ${capacity}`, 'the number of tiers and who supports partners']);
    if (!existingPartners.length)
        asks.push(['existing partners, with the deals each has closed', 'which tier each partner starts in']);
    // one line each in both cases, so the layout does not depend on whether a figure was typed
    asks.push(goalHasFigure ? ['the period your partner target covers, such as the year or a quarter', `the pace of ${program.kpis[0].toLowerCase()}`] : ['a numeric partner target, such as deals or pipeline for the year', `the target of ${program.kpis[0].toLowerCase()}`]);
    if (!dealSizeMatch || !priceBasis)
        asks.push(dealSizeMatch ? ['whether your deal size is a one-off price or a yearly or monthly amount', 'the payment basis for any agreed commission'] : ['your deal size as one amount, such as $50K', 'every example amount']);
    if (!ctx.v && !prodKinds.some((k) => !k.fromName))
        asks.push(['product: one line on what it does and who uses it', 'the partner kinds in this plan and what the recruitment email says about the product']);
    if (contractBasis)
        asks.push(['your contract term and notice period', 'how long a partner fee should run']);
    if (ctx.how === 'sector' || ctx.how === 'unknown')
        asks.push(['how you charge, which this plan reads from your sector or text', 'the wording of price and contract terms']);
    out += `\n${closing(asks)}`;
    return finalise(out);
}
// Reads one amount from text: "$5,000", "$50K" and "$1.5M" give 5000, 50000 and 1500000 (run 7, T5).
function readAmount(text) {
    const m = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([kmb])?\b/i);
    if (!m)
        return null;
    const mult = { k: 1e3, m: 1e6, b: 1e9 };
    return Math.round(parseFloat(m[1]) * (mult[(m[2] || '').toLowerCase()] ?? 1));
}
//# sourceMappingURL=partner-architect.js.map