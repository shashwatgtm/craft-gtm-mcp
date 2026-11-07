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
