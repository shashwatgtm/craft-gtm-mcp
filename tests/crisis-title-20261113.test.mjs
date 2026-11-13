import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCrisisPlanner} from '../dist/crisis-planner.js';

// 13 Nov 2026: with a described (not named) company, the title read "Crisis response plan: your company".
// It now reads "Crisis response plan for your company"; a real name still follows the colon.
const base = {industry: 'saas', customer_base: 'b2b_enterprise', data_sensitivity: 'medium_business_data', company_size: 'scaleup_50_200', your_sector: 'vertical_saas'};
const title = (company) => generateCrisisPlanner({...base, company}).split('\n')[0];

test('exact: the public example description gets the neutral title', () => {
  assert.equal(title('a field sales software company that sells annual subscriptions to consumer goods brands'), '# Crisis response plan for your company');
});

test('same meaning: other descriptions without a name get the same title', () => {
  for (const company of ['our field sales app business', 'The company runs order capture for consumer goods distributors', 'B2B SaaS for distributor billing, sold per seat'])
    assert.equal(title(company), '# Crisis response plan for your company', company);
});

test('opposite: a named company keeps its name after the colon', () => {
  for (const [company, name] of [['Routewise', 'Routewise'], ['Routewise, a route planning platform for third-party logistics firms', 'Routewise'], ['FieldPulse: field sales app for consumer goods brands', 'FieldPulse']])
    assert.equal(title(company), `# Crisis response plan: ${name}`, company);
  for (const company of ['Routewise', 'a field sales software company that sells annual subscriptions to consumer goods brands'])
    assert.doesNotMatch(generateCrisisPlanner({...base, company}), /: your company|plan for your company, a/);
});
