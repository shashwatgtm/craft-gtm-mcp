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

import {generateRetentionPlaybook} from '../dist/retention-playbook.js';
const retentionBase={customer_segment:'Regional logistics fleets',business_model:'saas_subscription',current_churn_rate:'3% monthly logo churn',product:'Dispatch planning software'};
test('aggregate reasons do not become invented personal feedback and each reason keeps its owner',()=>{
 const s=generateRetentionPlaybook({...retentionBase,churn_reasons:'Two customers said dispatchers bypass the tool during peak hours; another said the price is too high. No price change experiment has run.'});
 const reasons=s.split('### Reason ').slice(1).map(x=>x.split('## Health score')[0]);
 assert.equal(reasons.length,2);
 for(const r of reasons){assert.match(r,/\*\*First step:\*\*/);assert.match(r,/\*\*Owner and timing:\*\*/);assert.match(r,/```\nSubject:/);}
 assert.match(reasons[0],/Observe one recent task/);
 assert.match(reasons[1],/A value review/);
 const emails=[...s.matchAll(/```\n([\s\S]*?)\n```/g)].map(x=>x[1]).join('\n');
 assert.doesNotMatch(emails,/You told us|Two customers|another said|I have reviewed|I noticed your/);
 assert.match(emails,/before proposing a change/);
 const denied=generateRetentionPlaybook({...retentionBase,churn_reasons:'Dispatchers do not bypass the tool. Price is not the problem.'});
 assert.doesNotMatch(denied,/Observe one recent task|A value review/);
});
test('deduplication preserves owner and complete draft when two reasons use the same action',()=>{
 const s=generateRetentionPlaybook({...retentionBase,churn_reasons:'A customer reported confusing handoffs; another customer asked about unclear ownership'});
 const reasons=s.split('### Reason ').slice(1).map(x=>x.split('## Health score')[0]);
 for(const r of reasons){assert.match(r,/\*\*First step:\*\*/);assert.match(r,/\*\*Owner and timing:\*\*/);assert.match(r,/Could you describe a recent experience/);}
 assert.match(s,/0 through 30 as red, above 30 through 70 as yellow/);
 assert.match(s,/Missing signals do not establish a healthy account/);
});
