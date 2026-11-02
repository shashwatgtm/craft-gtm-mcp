import {checkReader} from './overnight-reader-helper.mjs';
checkReader("crisis_planner", [{"index": 0, "key": "potential_crises", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "customer_base", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight crisis: elapsed time does not establish a verified cause or a started fix',async()=>{
 const r=await call('crisis_planner',{company:'Payments provider',industry:'fintech',customer_base:'b2b_enterprise',data_sensitivity:'high_pii_financial',potential_crises:'A settlement outage prevents two customers from closing their books. The cause is unknown.'});
 const s=r.content.map(c=>c.text||'').join('\n');assert.match(s,/Use "Identified" only after the incident lead verifies the cause/);assert.match(s,/Do not imply a fix has started unless it has/);
});

test('service unavailability and outage preserve the same response despite unknown exposure',async()=>{
 for(const potential_crises of ['An outage prevents two customers from resolving dispatch exceptions. There is no evidence of data exposure.','Two customers cannot resolve dispatch exceptions because service is unavailable. Data exposure has not been established.']){
  const r=await call('crisis_planner',{company:'Workflow provider',industry:'logistics_tech',customer_base:'b2b_enterprise',data_sensitivity:'high_pii_financial',potential_crises});
  const s=r.content.map(c=>c.text||'').join('\n');
  assert.match(s,/### Service outage:/);assert.match(s,/First fifteen minutes/);
  assert.doesNotMatch(s,/Not treated as a confirmed incident|### Customer data exposure/);
 }
});
test('restoration starts verification while denied incidents remain unconfirmed',async()=>{
 const base={company:'Workflow provider',industry:'logistics_tech',customer_base:'b2b_enterprise',data_sensitivity:'high_pii_financial'};
 const text=async potential_crises=>(await call('crisis_planner',{...base,potential_crises})).content.map(c=>c.text||'').join('\n');
 const recovery=await text('Service has been restored and the two customers can resolve dispatch exceptions. There is no evidence of data exposure.');
 assert.match(recovery,/Recovery verification/);assert.match(recovery,/check the backlog before closing/);assert.doesNotMatch(recovery,/First fifteen minutes|Your note denies/);
 const denied=await text('No outage has been confirmed. We do not know whether customers cannot resolve dispatch exceptions. There is no evidence of data exposure.');
 assert.match(denied,/Not treated as a confirmed incident/);assert.doesNotMatch(denied,/### Service outage|Recovery verification/);
 const notRestored=await text('Service has not been restored. An outage continues. There is no evidence of data exposure.');
 assert.match(notRestored,/### Service outage/);assert.doesNotMatch(notRestored,/Recovery verification/);
});

test('unconfirmed and restored incidents use neutral customer checks and no company placeholder in status copy',async()=>{
 for(const potential_crises of ['No outage has been confirmed. There is no evidence of data exposure.','Service has been restored. There is no evidence of data exposure.','An outage prevents two customers from finishing their work. There is no evidence of data exposure.']){
 const r=await call('crisis_planner',{company:'Workflow for dispatch exceptions used by the depot supervisor',industry:'logistics_tech',customer_base:'b2b_enterprise',data_sensitivity:'high_pii_financial',potential_crises});
 const s=r.content.map(c=>c.text||'').join('\n');
 assert.match(s,/verify whether any customer is still unable.*or has recovered/);
 assert.match(s,/B2B enterprise customers/);assert.doesNotMatch(s,/service of your company|customers in “b2b enterprise”/);
 if(potential_crises.startsWith('No outage'))assert.match(s,/check availability logs/);
 }
});
