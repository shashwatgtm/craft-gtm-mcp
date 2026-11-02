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
