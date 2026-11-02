import {checkReader} from './overnight-reader-helper.mjs';
checkReader("crisis_planner", [{"index": 0, "key": "potential_crises", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "customer_base", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "company", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {call} from './overnight-reader-helper.mjs';
test('Overnight crisis: elapsed time does not establish a verified cause or a started fix',async()=>{
 const r=await call('crisis_planner',{company:'Payments provider',industry:'fintech',customer_base:'b2b_enterprise',data_sensitivity:'high_pii_financial',potential_crises:'A settlement outage prevents two customers from closing their books. The cause is unknown.'});
 const s=r.content.map(c=>c.text||'').join('\n');assert.match(s,/Use "Identified" only after the incident lead verifies the cause/);assert.match(s,/Do not imply a fix has started unless it has/);
});
