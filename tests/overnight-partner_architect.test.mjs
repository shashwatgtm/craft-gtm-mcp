import {checkReader} from './overnight-reader-helper.mjs';
checkReader("partner_architect", [{"index": 0, "key": "partner_goals", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "partner_support_capacity", "a": "The onboarding capacity is six delayed approvals in one reviewed batch.", "b": "The onboarding capacity is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "existing_partners", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "existing_partners", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {case_partner_architect} from '../dist/reader-partner-architect.js';
test('successful introductions are not described as stalled',()=>{
 const c=case_partner_architect({existing_partners:'One integrator made two introductions and both became paid accounts.'});
 assert.match(c.roles[3],/both became paid accounts/);assert.doesNotMatch(c.roles[3],/stalled/);
});
