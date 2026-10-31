import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const base={product:'User supplied product',target_market:'enterprise_saas',current_metrics:''};
const metrics=retention=>`monthly churn 1%, NPS 60, LTV 90000, CAC 10000, retention ${retention}%, activation 70%`;
const actions=text=>text.split('## Priority Actions')[1].split('---')[0];
// Existing pct() rounds display to one decimal, while scoring uses the unrounded value.
for(const [value,status,display]of [[0,'CRITICAL','0'],[40,'CRITICAL','40'],[84.99,'CRITICAL','85'],[85,'DEVELOPING','85'],[89.99,'DEVELOPING','90']])test(`weak retention ${value}% has an action, not all-well reassurance`,()=>{
 const text=generatePMFScorecard({...base,current_metrics:metrics(value)});
 assert.match(text,new RegExp(`Retention Rate \\| ${display}% \\| [35]/10 \\|[^\\n]+${status}`));
 assert.match(actions(text),/RETENTION: Review the customers or revenue lost/);
 assert.match(actions(text),/Confirm the period/);
 assert.doesNotMatch(text,/Every dimension scores well/);
});
test('healthy retention does not add an unsupported weak-retention action',()=>{const text=generatePMFScorecard({...base,current_metrics:metrics(90)});assert.match(text,/Retention Rate \| 90% \| 7\/10/);assert.doesNotMatch(actions(text),/RETENTION:/);assert.match(actions(text),/Every dimension scores well/);});
test('missing retention still requests the missing figure',()=>{const text=generatePMFScorecard({...base,current_metrics:metrics(40).replace('retention 40%, ','')});assert.match(actions(text),/RETENTION: not given/);assert.doesNotMatch(actions(text),/RETENTION: Review/);});
test('services gets a contract-specific weak-retention action',()=>{const text=generatePMFScorecard({...base,business_model:'services',current_metrics:metrics(40)});assert.match(actions(text),/RETENTION: Review the contract value not renewed/);assert.match(actions(text),/Confirm the period/);assert.doesNotMatch(text,/Every dimension scores well/);});
test('net revenue retention retains its definition and weak action',()=>{const text=generatePMFScorecard({...base,current_metrics:metrics(40).replace('retention 40%','net revenue retention: 40%')});assert.match(text,/Net Revenue Retention \| 40%/);assert.match(actions(text),/net revenue/);assert.doesNotMatch(text,/Every dimension scores well/);});
test('standalone NRR remains unparsed under the unchanged parser',()=>{const text=generatePMFScorecard({...base,current_metrics:metrics(40).replace('retention 40%','NRR: 40%')});assert.match(actions(text),/RETENTION: not given/);assert.doesNotMatch(text,/Every dimension scores well/);});
test('all example ranges add retention actions below their healthy thresholds',()=>{for(const [market,retention]of [['enterprise_saas',89],['smb_saas',84],['consumer',74],['marketplace',79],['fintech',89],['other',81],['ai_native',89]]){const text=generatePMFScorecard({...base,target_market:market,current_metrics:metrics(retention)});assert.match(actions(text),/RETENTION:/,market);assert.doesNotMatch(text,/Every dimension scores well/,market);}});
