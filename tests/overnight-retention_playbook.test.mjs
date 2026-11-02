import {checkReader} from './overnight-reader-helper.mjs';
checkReader("retention_playbook", [{"index": 0, "key": "customer_segment", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "current_churn_rate", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "customer_segment", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "customer_segment", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "available_data_signals", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {readingGuide} from '../dist/reader-actions.js';
test('Overnight retention: workflow bypass changes the task, denial does not',()=>{
 const a={customer_segment:'Regional fleet dispatch teams'};
 const yes=readingGuide('retention_playbook','Report',{...a,churn_reasons:'Dispatchers bypass the tool during peak hours.'});
 const no=readingGuide('retention_playbook','Report',{...a,churn_reasons:'Dispatchers do not bypass the tool during peak hours.'});
 assert.match(yes,/test a workflow correction/);assert.doesNotMatch(no,/test a workflow correction/);
});
