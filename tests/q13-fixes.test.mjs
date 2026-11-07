import test from 'node:test';
import assert from 'node:assert/strict';
import { softwareQuestions, SOFTWARE_REFERRAL } from '../src/software-policy.ts';
import { generatePartnerArchitect } from '../src/partner-architect.ts';
import { writeLaunchPlan, writeRetentionPlaybook, writeCrisisPlan } from '../src/rw-launch.ts';
import { fact } from '../src/reader-case.ts';
import { analyzeCRAFTDimensions, lowerFirstIfCommon } from '../src/utils.ts';
import { analyzeCRAFTGTM } from '../src/craft-analyzer.ts';
import { readPMFMetrics } from '../src/pmf-metrics.ts';

test('RC-01 and RC-02: softwareQuestions routes pure software stack asks and stays silent on CRM/tool mentions in normal GTM context', () => {
  assert.ok(softwareQuestions({ current_metrics: 'Which CRM and analytics stack should we buy, HubSpot or Salesforce?' }).includes(SOFTWARE_REFERRAL));
  assert.equal(softwareQuestions({ current_metrics: 'MRR $85K; Salesforce CRM syncs cleanly; HubSpot marketing list has 4,000 leads.' }), '');
});

test('RC-03 and RC-07 and RC-15: partner_architect Silver tier has no SOFTWARE_REFERRAL, uses "an agency si", keeps compound partner phrases, and matches plural verb agreement', () => {
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

test('RC-07 and RC-22: writeLaunchPlan and writeRetentionPlaybook respect negated channels/reasons/signals and split comma-separated churn reasons', () => {
  const launch = writeLaunchPlan({
    product_feature: 'GridFlow: automated dispatch board for regional carriers',
    launch_type: 'major_feature',
    target_segments: 'Mid-market freight brokers',
    launch_goals: 'Win 15 new fleet accounts in 90 days',
    available_channels: 'We do not use paid ads, webinars, or cold email; our only active channel is founder referrals',
  });
  assert.ok(!launch.includes('We do not use paid ads'));
  assert.ok(launch.includes('founder referrals'));

  const ret = writeRetentionPlaybook({
    customer_segment: 'Regional freight carriers',
    business_model: 'saas_subscription',
    current_churn_rate: '2.5% monthly',
    churn_reasons: 'slow TMS integration, dispatcher turnover at hubs; price is not a reason customers leave',
    available_data_signals: 'We do not track logins or NPS; uptime per site',
  });
  assert.ok(ret.includes('### Reason 1: "slow TMS integration"'));
  assert.ok(ret.includes('### Reason 2: "dispatcher turnover at hubs"'));
  assert.ok(ret.includes('Unestablished causes: "price is not a reason customers leave"'));
  assert.equal((ret.match(/you track "uptime per site"/g) || []).length, 1);
});

test('RC-09 and RC-15 and RC-22: writeCrisisPlan and reader-case handle descriptive company names, negated crises, enterprise team article, and underscore lists', () => {
  const crisis = writeCrisisPlan({
    company: 'A mid-market SaaS company ($18M ARR, 85 employees, $120K ACV)',
    industry: 'saas',
    customer_base: 'b2b_enterprise',
    data_sensitivity: 'moderate_business',
    company_size: 'enterprise_1000_plus',
    potential_crises: 'Not a data breach, not a service outage; only a routine planned maintenance window with 48 hours notice',
  });
  assert.ok(crisis.includes('# Crisis response plan: your company'));
  assert.ok(crisis.includes('85 employees'));
  assert.ok(crisis.includes('an enterprise (1,000+) team'));
  assert.ok(!crisis.includes('### Security incident'));
  assert.ok(fact({ potential_crises: 'service_outage, sla_breach' }, 'potential_crises', 'fallback').includes('service outage, sla breach'));
});

test('RC-06 and RC-09 and RC-19: utils and craft-analyzer preserve brand names, match plural Weeks 1-4 and plural CIOs/VPs, and parse word-number goals', () => {
  assert.equal(lowerFirstIfCommon('Chargebee and Infosys compete here'), 'Chargebee and Infosys compete here');
  const dims = analyzeCRAFTDimensions('Plan led by VP Marketing. Goal is to sign twelve enterprise subscriptions in Weeks 1-4. 48-month CAC payback.');
  assert.ok(dims.character.groupsFound.includes('an owner or responsible party'));
  assert.ok(dims.result.groupsFound.includes('a target with a number'));
  assert.ok(dims.timeline.found.some((x) => /Weeks 1-4/i.test(x)));
  assert.ok(!dims.timeline.found.some((x) => /48-month/i.test(x)));

  const gtm = analyzeCRAFTGTM({
    content_type: 'gtm_strategy',
    industry: 'software',
    content_to_analyze: 'Target buyers: CIOs and VPs of IT Operations at enterprise accounts. Goal: 20 enterprise deals in Weeks 1-4. Owner: VP Sales.',
  });
  assert.ok(!gtm.includes('chief information officer and the VP IT operations'));
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
});
