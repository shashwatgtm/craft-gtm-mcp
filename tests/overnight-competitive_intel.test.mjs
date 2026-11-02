import {checkReader} from './overnight-reader-helper.mjs';
checkReader("competitive_intel", [{"index": 0, "key": "your_strengths", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "common_objections", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "your_strengths", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "competitors", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "common_objections", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight competitive: explicit TMS and spreadsheet alternatives stay separate',async()=>{
 const r=await call('competitive_intel',{your_product:'Dispatch planning software',competitors:'Existing TMS; spreadsheets',your_strengths:'Reassign a failed delivery; time saved is unmeasured.'});
 const t=r.content.map(c=>c.text||'').join('\n');
 assert.match(t,/## Against Existing TMS\n/);assert.match(t,/## Against [Ss]preadsheets\n/);assert.doesNotMatch(t,/## Against Existing TMS; spreadsheets/);
});

test('a card without its own evidence still offers a fair comparison conversation',async()=>{
 const r=await call('competitive_intel',{your_product:'Dispatch planning software for regional fleets',competitors:'Existing TMS; spreadsheets',common_objections:'Our TMS already assigns routes. Switching will disrupt peak season.',your_strengths:'Dispatcher can reassign a failed delivery and notify the depot in one view. Time saved is not measured.'});
 const s=r.content.map(c=>c.text||'').join('\n');
 const card=s.split('## Against spreadsheets')[1].split('## Objection handlers')[0];
 assert.match(card,/not established an advantage over spreadsheets/);
 assert.match(card,/same inputs and acceptance measure/);
 assert.match(card,/record where spreadsheets works well/);
 assert.doesNotMatch(s,/Which of that|On "Our TMS/);
 assert.match(s,/Time saved is not measured/);
});

test('migration continuity objections require their own test instead of a related-word capability claim',async()=>{
 for(const common_objections of ['We cannot interrupt dispatch exceptions during migration','Migration will disrupt the dispatch workflow','We require zero downtime during the switch']){
  const r=await call('competitive_intel',{your_product:'Dispatch workflow',competitors:'Current internal workflow; spreadsheets',your_strengths:'The workflow can operate offline during dispatch exceptions. No time reduction was measured.',common_objections,your_sector:'logistics_tech'});
  const s=r.content.map(c=>c.text||'').join('\n').split('## Objection handlers')[1].split('### Objections')[0];
  assert.match(s,/read-only copy or isolated simulation/);assert.match(s,/stop conditions and rollback/);
  assert.match(s,/No live switch is agreed until the owner accepts/);
  assert.doesNotMatch(s,/What I can tell you today is: the workflow can operate offline/);
 }
 const r=await call('competitive_intel',{your_product:'Dispatch workflow',competitors:'Current workflow',common_objections:'We are not concerned that migration will disrupt dispatch work'});
 assert.doesNotMatch(r.content.map(c=>c.text||'').join('\n'),/No live switch is agreed until the owner accepts/);
});
