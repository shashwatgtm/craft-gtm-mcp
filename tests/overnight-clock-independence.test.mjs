import test from 'node:test';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {generateLaunchCommander} from '../dist/launch-commander.js';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const RealDate=Date;
function at(now,fn){
 class ClockDate extends RealDate {constructor(...args){super(...(args.length?args:[now]));}static now(){return +new RealDate(now);}}
 globalThis.Date=ClockDate;try{return fn();}finally{globalThis.Date=RealDate;}
}
const launch={product_feature:'Workflow approval service',target_segments:'Operations heads',launch_type:'feature_launch',launch_date:'2027-01-15',goals:'Five qualified pilot commitments'};
const pmf={product:'Workflow approval software',target_market:'enterprise_saas',current_metrics:'MRR: $50000; monthly logo churn: 2%; NPS: 35; activation: 60%; annual logo retention: 78%'};
for(const [name,fn]of [['launch',()=>generateLaunchCommander(launch)],['PMF',()=>generatePMFScorecard(pmf)]])test(name+' is identical across wall clock dates',()=>{
 assert.equal(at('2026-11-02T12:00:00Z',fn),at('2030-01-01T12:00:00Z',fn));
});
test('an explicit assessment date controls overdue tasks without using the wall clock',()=>{
 const args={...launch,goals:launch.goals+'\nAssessment date: 2027-01-10\nConfirmed capacity: 2 tasks per day'};
 const run=()=>generateLaunchCommander(args);
 const first=at('2026-11-02T12:00:00Z',run);assert.equal(first,at('2030-01-01T12:00:00Z',run));
 assert.match(first,/Assessment date: 2027-01-10/);assert.match(first,/Overdue if unfinished/);assert.match(first,/proposed remaining date/);
});
test('an undated assessment cannot mark tasks overdue or choose a remaining-work start date',()=>{
 const s=generateLaunchCommander({...launch,goals:launch.goals+'\nConfirmed capacity: 2 tasks per day'});
 assert.doesNotMatch(s,/Overdue if unfinished|proposed remaining date:/);assert.match(s,/assessment date.*not supplied/i);
});
test('conflicting or impossible assessment dates are not silently chosen',()=>{
 for(const extra of ['Assessment date: 2027-02-30','Assessment date: 2027-01-10\nAssessment date: 2027-01-12']){
  const s=generateLaunchCommander({...launch,goals:launch.goals+'\n'+extra});assert.doesNotMatch(s,/Overdue if unfinished|proposed remaining date:/);assert.match(s,/assessment date.*not supplied|assessment date.*not confirmed/i);
 }
});

test('launch schedule is the same across host timezones and daylight saving transitions',()=>{
 const source=`import {generateLaunchCommander} from './dist/launch-commander.js';process.stdout.write(generateLaunchCommander(${JSON.stringify({...launch,launch_date:'2027-03-20'})}));`;
 const outputs=['UTC','America/New_York','Asia/Tokyo'].map(TZ=>{const r=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8',env:{...process.env,TZ}});assert.equal(r.status,0,r.stderr);return r.stdout;});
 assert.equal(outputs[0],outputs[1]);assert.equal(outputs[0],outputs[2]);
});
test('an impossible ISO launch date is not normalised into a different date',()=>{
 const s=generateLaunchCommander({...launch,launch_date:'2027-02-30'});assert.doesNotMatch(s,/due 2027-|2027-03-02/);
});
