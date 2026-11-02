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
