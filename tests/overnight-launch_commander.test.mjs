import {checkReader} from './overnight-reader-helper.mjs';
checkReader("launch_commander", [{"index": 0, "key": "target_segments", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "team_size", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "available_channels", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "target_segments", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "available_channels", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {readingGuide} from '../dist/reader-actions.js';
test('Overnight launch: numeric goal changes the capacity question without repeating the full brief',()=>{
 const a=readingGuide('launch_commander','Report',{goals:'40 qualified meetings with Heads of Operations',target_segments:'Regional fleet leaders'});
 const b=readingGuide('launch_commander','Report',{goals:'20 qualified meetings with Heads of Operations',target_segments:'Regional fleet leaders'});
 assert.match(a,/40 qualified meetings as a target/);assert.match(b,/20 qualified meetings as a target/);assert.notEqual(a,b);assert.doesNotMatch(a,/40 qualified meetings with Heads of Operations/);
 const no=readingGuide('launch_commander','Report',{goals:'We do not need 40 qualified meetings with Heads of Operations'});assert.doesNotMatch(no,/40 qualified meetings as a target/);
});

import {generateLaunchCommander} from '../dist/launch-commander.js';
test('pilot commitments retain acceptance evidence and are not labelled active adoption',()=>{
 const s=generateLaunchCommander({product_feature:'Weekend alert triage service',launch_date:'2026-12-01',launch_type:'major_release',target_segments:'Midmarket SaaS companies',goals:'Five qualified pilot commitments',available_channels:'Founder outreach',team_size:'small_2_5',budget_level:'bootstrap',business_model:'services'});
 assert.match(s,/Five qualified pilot commitments \| Pilot commitments \| CRM or written buyer acceptance/);
 assert.match(s,/The target is five qualified pilot commitments, all in/);
 assert.match(s,/Check written pilot commitments against agreed scope/);
 assert.doesNotMatch(s,/Five qualified pilot is|spends on prepare|Five qualified pilot commitments \| Adoption/);
 const r=readingGuide('launch_commander','Report',{goals:'Five qualified pilot commitments',team_size:'small_2_5',launch_date:'2026-12-01'});
 assert.match(r,/available hours for a team of 2 to 5/);
 assert.doesNotMatch(r,/small 2 5.*hours|reschedule overdue work/);
});

test('an explicit acquisition pause produces a readiness review and no outreach schedule',()=>{
 const args={product_feature:'Exception review workflow',target_segments:'Operations teams',launch_type:'major_release',launch_date:'2026-12-01',available_channels:'Founder outreach',goals:'Zero qualified pilot commitments; pause acquisition until delivery is ready'};
 const s=generateLaunchCommander(args);
 assert.match(s,/Launch acquisition on hold/);assert.match(s,/No new pilot commitment or outreach task is assigned/);
 assert.doesNotMatch(s,/### Launch Week|Early-access list|Customer and peer advocate outreach/);
 const r=readingGuide('launch_commander',s,args);
 assert.match(r,/Acquisition is paused/);assert.match(r,/scheduled acquisition messages respect the pause/);
 assert.doesNotMatch(r,/qualify.*for 0|reachable volume.*against 0/);
 const live=generateLaunchCommander({...args,goals:'Five qualified pilot commitments; do not pause acquisition'});
 assert.doesNotMatch(live,/Launch acquisition on hold/);assert.match(live,/## Timeline/);
});
test('an undecided launch outcome is a decision to resolve and known sector is not requested again',()=>{
 const args={product_feature:'Workflow for hotel booking exceptions',target_segments:'Hotel operations teams',launch_type:'major_release',your_sector:'vertical_saas',goals:'We do not need five qualified pilot commitments; the launch outcome is still undecided'};
 const s=generateLaunchCommander(args);const r=readingGuide('launch_commander',s,args);
 assert.doesNotMatch(s,/\n- your industry|\.\?/);
 assert.doesNotMatch(r,/Plan for the launch outcome still to confirm as a target|qualify.*outcome still to confirm/);
 assert.match(r,/agree an observable outcome/);
 for(const work of ['hotel booking exceptions','contract review exceptions']){
  const denied=generateLaunchCommander({...args,goals:`We do not need five qualified pilot commitments for ${work}; the launch outcome is still undecided`});
  assert.doesNotMatch(denied,/\| Revenue \||\| Awareness \||Inspect reach within|Check signed contracts/);
  assert.match(denied,/Agree the launch outcome and its evidence source/);
 }
});
