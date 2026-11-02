import {checkReader} from './overnight-reader-helper.mjs';
checkReader("craft_gtm_analyzer", [{"index": 0, "key": "desired_outcome", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "document_content", "a": "The onboarding capacity is six delayed approvals in one reviewed batch.", "b": "The onboarding capacity is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "document_content", "a": "The budget is six delayed approvals in one reviewed batch.", "b": "The budget is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "document_content", "a": "The conversion evidence is six delayed approvals in one reviewed batch.", "b": "The conversion evidence is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "document_content", "a": "The customer target is six delayed approvals in one reviewed batch.", "b": "The customer target is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('analyzer keeps timeline fixes in Timeline and buyer roles within a statement',async()=>{
 const document_content='Plan for network incident escalations. Budget: $18000 for outreach. Customer target: 12 paid customers. Product can onboard three accounts monthly. The team can run six demos weekly. Current conversion from demo to sale is 10 percent across 20 completed demos.';
 for(const your_sector of ['fintech','telecom']){
  const r=await call('craft_gtm_analyzer',{document_content,document_type:'launch_plan',your_sector});
  const s=r.content.map(c=>c.text||'').join('\n');const fix=s.split('## What to fix first')[1].split('## Sector Check')[0];const sector=s.split('## Sector Check')[1].split('## Risks')[0];
  assert.match(fix,/Dated milestone needed\.\*\* \(Timeline 6\/10\)/);
  assert.doesNotMatch(fix,/Dated milestone needed\.\*\* \(Frame/);
  assert.match(fix,/Name who owns "12 paid customers"/);
  assert.doesNotMatch(sector,/The roles in your plan match/);
 }
 const explicit=await call('craft_gtm_analyzer',{document_content:document_content+' Buyer roles: Product and engineering teams.',document_type:'launch_plan',your_sector:'fintech'});
 assert.match(explicit.content.map(c=>c.text||'').join('\n').split('## Sector Check')[1],/roles in your plan match Head of Product/);
});
test('CRO action retains equivalent conversion evidence and holds zero or unmeasured rates',async()=>{
 for(const conversion of ['Ten percent of the 20 completed demos became sales.','Conversion from demo to sale is zero percent.','Conversion from demo to sale is not measured.']){
  const r=await call('craft_gtm_analyzer',{document_content:'Customer target: 12 paid customers. '+conversion,document_type:'launch_plan'});
  const s=r.content.map(c=>c.text||'').join('\n');const cro=s.split('CRO:')[1].split('Demand generation head:')[0];
  assert.match(cro,/positive, usable conversion rate/);assert.match(cro,/zero or unmeasured rate does not support a finite demo target/);
  assert.doesNotMatch(cro,/verify the conversion evidence in the plan/);
 }
});
