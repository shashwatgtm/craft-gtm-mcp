import {checkReader} from './overnight-reader-helper.mjs';
checkReader("customer_interview_kit", [{"index": 0, "key": "product_context", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "interview_type", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "target_persona", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "target_persona", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "target_persona", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight interview: approval hypothesis gets workflow questions without billing detours',async()=>{
 const r=await call('customer_interview_kit',{interview_type:'discovery',product_context:'Invoice processing service. We think exception approvals are the bottleneck; only two interviews.',target_persona:'Accounts payable head'});
 const t=r.content.map(c=>c.text||'').join('\n');assert.match(t,/Which observation would show that approval is not the bottleneck/);assert.match(t,/when the exception arrived, changed owner and was resolved/);assert.doesNotMatch(t,/How are plan and price changes turned into invoices|How long after month end is revenue closed|Which systems must billing connect/);
});

test('full discovery and validation guides seek counterevidence without coaching enthusiasm',async()=>{
 for(const interview_type of ['discovery','validation','feedback','churn','win_loss']){
  const r=await call('customer_interview_kit',{interview_type,product_context:'Invoice processing service for regional insurers',target_persona:'Accounts payable head'});
  const s=r.content.map(c=>c.text||'').join('\n');
  assert.doesNotMatch(s,/How excited|make you excited|raving fan|What would need to change for that to be a 10|For a win: why|For a loss: why|What made that option better/);
  assert.equal((s.match(/Is there anything I should have asked but didn't\?/g)||[]).length,1);
  if(interview_type==='validation')assert.match(s,/poor fit or not worth changing/);
  if(interview_type==='discovery')assert.match(s,/keep the current approach/);
 }
});

test('equivalent interview hypotheses retain their source and uncertainty',async()=>{
 const cases=['Workflow support for approvals. We suspect approval delays are the bottleneck based on two interviews, but have no timing study.','Two interviews suggest that approval delays constrain the workflow. No timing study has tested this hypothesis.','Two interviews suggest approvals are prompt and missing source records cause delays. No timing study has been run.'];
 for(const product_context of cases){
  const r=await call('customer_interview_kit',{interview_type:'discovery',product_context,target_persona:'Operations head'});
  const s=r.content.map(c=>c.text||'').join('\n');const lead=s.split('## Optional full interview guide')[0];
  assert.match(lead,/Hypothesis to test, not a fact:/);assert.doesNotMatch(lead,/No hypothesis supplied/);
  assert.match(lead,/two interviews|Two interviews/);assert.match(lead,/no timing study|No timing study/);
 }
});
test('missing or denied evidence begins discovery instead of pretending a hypothesis exists',async()=>{
 for(const args of [{product_context:'Workflow support for approvals.'},{product_context:'The two interviews do not establish approval delays as the bottleneck. No timing study has been run.'},{product_context:'Workflow support for approvals.',key_hypotheses:'No hypothesis supplied'}]){
  const r=await call('customer_interview_kit',{interview_type:'discovery',target_persona:'Operations head',...args});
  const s=r.content.map(c=>c.text||'').join('\n');const lead=s.split('## Optional full interview guide')[0];
  assert.match(lead,/Five questions to discover the current work/);assert.match(lead,/No hypothesis supplied/);
  assert.doesNotMatch(lead,/Hypothesis to test, not a fact:|does not fit this hypothesis|Supports the hypothesis/);
  assert.match(lead,/comparable case that went differently/);assert.match(s,/permits recording and how notes may be used/);
 }
});
