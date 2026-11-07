// q13 fixes. Imports the built modules: run npm run build first, then node --test tests/q13-fixes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { softwareAdvice, SOFTWARE_REFERRAL } from '../dist/software-policy.js';
import { generatePartnerArchitect } from '../dist/partner-architect.js';
import { writeRetentionPlaybook, writeCrisisPlan } from '../dist/rw-launch.js';
import { fact } from '../dist/reader-case.js';
import { analyzeCRAFTDimensions } from '../dist/utils.js';
import { generateCRAFTAnalyzer } from '../dist/craft-analyzer.js';
import { readPMFMetrics } from '../dist/pmf-metrics.js';

test('RC-01 and RC-02: a software buying question still routes; a GTM motion question that mentions a CRM does not', () => {
  assert.equal(softwareAdvice({ current_metrics: 'Which CRM and analytics stack should we buy, HubSpot or Salesforce?' }), SOFTWARE_REFERRAL);
  assert.equal(softwareAdvice({ current_metrics: 'MRR $85K; Salesforce CRM syncs cleanly; HubSpot marketing list has 4,000 leads.' }), undefined);
  assert.equal(softwareAdvice({ gtm_challenge: 'Our CRM data is messy, so how do we decide which GTM motion to run first?' }), undefined);
  // buyer objections stay evidence to answer, not a software request
  assert.equal(softwareAdvice({ common_objections: 'Why should we replace our existing TMS?' }), undefined);
});

test('RC-03 and RC-08: partner_architect Silver tier has no referral, uses "an agency si", keeps compound partner phrases, and matches plural verbs', () => {
  const res = generatePartnerArchitect({
    company: 'DispatchGrid',
    product: 'Cloud TMS for mid-market freight brokers',
    partner_model: 'reseller',
    partner_goals: 'Recruit 12 regional logistics and ERP implementation partners in 12 months',
    your_deal_size: '$48,000 ACV',
    industry: 'logistics_tech',
  });
  assert.ok(!res.includes(SOFTWARE_REFERRAL));
  assert.ok(res.includes('partner portal, deal registration desk, quarterly review'));
  assert.ok(res.includes('transport, warehouse and ERP integrators'));
  assert.ok(res.includes('freight brokers works with'));

  const si = generatePartnerArchitect({
    company: 'AlphaQuant',
    product: 'Active equity and multi-asset strategies for institutional mandates',
    partner_model: 'agency_si',
    partner_goals: 'Add 6 institutional consultants in 12 months',
    your_deal_size: '$250,000 annual fee',
    industry: 'ai_native',
    business_model: 'investment',
  });
  assert.ok(si.includes('This is an agency si partner program'));
  assert.ok(si.includes('fit the work your clients need to do'));
});

test('RC-07 and RC-22: retention_playbook keeps negated reasons and untracked signals out of the active lists', () => {
  const ret = writeRetentionPlaybook({
    customer_segment: 'Regional freight carriers',
    business_model: 'saas_subscription',
    current_churn_rate: '2.5% monthly',
    churn_reasons: 'slow TMS integration; price is not a reason customers leave',
    available_data_signals: 'We do not track logins or NPS; uptime per site',
  });
  assert.ok(ret.includes('### Reason 1: "slow TMS integration"'));
  assert.ok(ret.includes('Unestablished causes: "price is not a reason customers leave"'));
  assert.ok(!ret.includes('you track "We do not track logins or NPS"'));
});

test('RC-09 and RC-22: crisis_planner drops negated crises and uses the right article; reader-case reads underscore lists', () => {
  const crisis = writeCrisisPlan({
    company: 'A mid-market SaaS company ($18M ARR, 85 employees, $120K ACV)',
    industry: 'saas',
    customer_base: 'b2b_enterprise',
    data_sensitivity: 'moderate_business',
    company_size: 'enterprise_1000_plus',
    potential_crises: 'Not a data breach, not a service outage; only a routine planned maintenance window with 48 hours notice',
  });
  assert.ok(crisis.includes('an enterprise (1,000+) team'));
  assert.ok(!crisis.includes('### Crisis: Not a data breach'));
  assert.ok(fact({ potential_crises: 'service_outage, sla_breach' }, 'potential_crises', 'fallback').includes('service outage, sla breach'));
  // a company name that starts with "The" is still used as the name
  const named = writeCrisisPlan({ company: 'The Hartford Logistics Group', industry: 'saas', customer_base: 'b2b_enterprise', data_sensitivity: 'moderate_business' });
  assert.ok(named.includes('# Crisis response plan: The Hartford Logistics Group'));
});

test('RC-06 and RC-19: CRAFT check reads "led by", word-number targets and Weeks 1-4, and not a payback period as a timeline', () => {
  const dims = analyzeCRAFTDimensions('Plan led by VP Marketing. Goal is to sign twelve enterprise subscriptions in Weeks 1-4. 48-month CAC payback.');
  assert.ok(dims.character.groupsFound.includes('an owner or responsible party'));
  assert.ok(dims.result.groupsFound.includes('a target with a number'));
  assert.ok(dims.timeline.found.some((x) => /Weeks 1-4/i.test(x)));
  assert.ok(!dims.timeline.found.some((x) => /48-month/i.test(x)));

  const plural = generateCRAFTAnalyzer({ document_type: 'gtm_strategy', industry: 'software', document_content: 'Target buyers: CIOs and VPs of IT Operations at enterprise software accounts. Goal: 20 enterprise deals in Weeks 1-4. Owner: VP Sales.' });
  assert.ok(!plural.includes('No role in your plan matches'));
  // "its" is not read as "IT"
  const its = generateCRAFTAnalyzer({ document_type: 'gtm_strategy', industry: 'software', document_content: 'Audience: mid-market SaaS firms. Goal: 10 deals in Q3. Owner: Head of Sales owns its pipeline.' });
  assert.ok(its.includes('No role in your plan matches'));
});

test('RC-19 and RC-22: readPMFMetrics parses word-number metrics and parenthetical actual values after negated bounds', () => {
  const r1 = readPMFMetrics('Twelve-month gross retention is ninety-two percent; ninety-four out of a hundred accounts renew each year; monthly logo churn is zero point five percent; net promoter score is fifty-eight; lifetime value is four times customer acquisition cost ($140,000 vs $35,000).');
  assert.equal(r1.issues.length, 0);
  assert.equal(r1.values.retentionRate, 92);
  assert.equal(r1.values.churn, 0.5);
  assert.equal(r1.values.nps, 58);
  assert.equal(r1.values.ltv, 140000);
  assert.equal(r1.values.cac, 35000);

  const r2 = readPMFMetrics('Monthly churn is not above 1% (it is 0.5% per month); logo retention is not below 94% (it is 95% annual); NPS is not bad at 58; LTV is $180,000; CAC is $36,000.');
  assert.equal(r2.issues.length, 0);
  assert.equal(r2.values.churn, 0.5);
  assert.equal(r2.values.retentionRate, 95);
  assert.equal(r2.values.nps, 58);

  // ordinary digit input is unchanged
  const r3 = readPMFMetrics('Monthly churn 2%; NPS 45; LTV $120,000; CAC $30,000');
  assert.deepEqual({ churn: r3.values.churn, nps: r3.values.nps, ltv: r3.values.ltv, cac: r3.values.cac }, { churn: 2, nps: 45, ltv: 120000, cac: 30000 });
});
