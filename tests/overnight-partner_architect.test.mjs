import {checkReader} from './overnight-reader-helper.mjs';
checkReader("partner_architect", [{"index": 0, "key": "partner_goals", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "partner_support_capacity", "a": "The onboarding capacity is six delayed approvals in one reviewed batch.", "b": "The onboarding capacity is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "existing_partners", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "existing_partners", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {case_partner_architect} from '../dist/reader-partner-architect.js';
test('successful introductions are not described as stalled',()=>{
 const c=case_partner_architect({existing_partners:'One integrator made two introductions and both became paid accounts.'});
 assert.match(c.roles[3],/both became paid accounts/);assert.doesNotMatch(c.roles[3],/stalled/);
});

import {generatePartnerArchitect} from '../dist/partner-architect.js';
const partnerBase={company:'Exampleco',product:'Invoice approval tracking',partner_model:'referral',partner_goals:'Find three qualified referral partners.',your_deal_size:'$48,000 annual',existing_partners:'One integrator made two introductions; neither became a paid customer.'};
test('recruitment does not promise unconfirmed fees or guaranteed sales',()=>{
 for(const partner_model of ['referral','affiliate']){
  const s=generatePartnerArchitect({...partnerBase,partner_model});
  const email=s.split('## Recruitment email')[1].split('```')[1];
  assert.match(email,/agree.*attribution.*(?:fee|payment).*in writing/);
  assert.doesNotMatch(email,/would earn|earn a fee/);
  assert.match(email,/Our goal is to find three/);
  assert.doesNotMatch(s,/first deal closes|first commission is paid|You gave no deal counts/);
  assert.match(s,/even if no deal has closed/);
  assert.doesNotMatch(s,/whether your deal size is a one-off/);
 }
});
test('worked deal value preserves billing period instead of assuming annual revenue',()=>{
 for(const [your_deal_size,basis] of [['$48,000 annual','annual contract value'],['$48,000 one-off','one-off contract value'],['$48,000 monthly','monthly contract value']]){
  const s=generatePartnerArchitect({...partnerBase,your_deal_size});
  assert.ok(s.includes('$480,000 in '+basis));
 }
 const unknown=generatePartnerArchitect({...partnerBase,your_deal_size:'$48,000',business_model:'services'});
 assert.match(unknown,/does not treat the amount as annual revenue/);
 assert.doesNotMatch(unknown,/\$480,000 in annual contract value/);
 const mixed=generatePartnerArchitect({...partnerBase,your_deal_size:'$48,000 annual or monthly'});
 assert.match(mixed,/billing period still to confirm/);
});
