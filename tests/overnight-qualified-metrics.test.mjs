import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
import {readPMFMetrics} from '../dist/pmf-metrics.js';
const run=current_metrics=>generatePMFScorecard({product:'Workflow software',target_market:'enterprise_saas',current_metrics});
for(const current_metrics of [
 'NPS: 70 is a forecast. No customer survey has been completed.',
 'Forecast NPS: 70. No customer survey has been completed.',
 'Projected NPS: 70. No customer survey has been completed.',
 'NPS: 70 is projected. No customer survey has been completed.',
 'NPS: 70 is incorrect. No confirmed survey result is available.',
 'NPS: 70 was wrong. No confirmed survey result is available.',
 'NPS: 70 has been withdrawn because the survey sample was invalid.',
 'Assumed NPS: 70. No customer survey has been completed.',
 'NPS: 70 is an illustrative example, not a measured customer result.',
 'Target NPS: 70. No customer survey has been completed.',
 'NPS: 70 is the goal. No customer survey has been completed.',
 'Monthly churn: 1% expected after rollout. No observed churn is available.',
 'Expected monthly churn: 1%. No observed churn is available.',
 'Projected monthly churn: 1%. No observed churn is available.',
 'NPS: 70. This value has been withdrawn.',
 'NPS: 70. The NPS result is incorrect.',
 'NPS: 70 is not a measured customer result.',
 'NPS: 70 is not an observed customer result.',
 'NPS: 70 is not the actual customer result.'
])test('M100 nonobserved or invalidated metric is not scored: '+current_metrics,()=>{
 const out=run(current_metrics);assert.match(out,/Cannot score these metrics/);assert.doesNotMatch(out,/Overall PMF Assessment/);
 const m=readPMFMetrics(current_metrics);assert.equal(Object.keys(m.values).length,0);
});
for(const [current_metrics,key,value] of [
 ['Observed NPS: 70 from the completed customer survey.','nps',70],
 ['Observed monthly churn: 1%.','churn',1],
 ['Observed NPS: 70. The unrelated revenue forecast is not approved.','nps',70],
 ['Observed NPS: 70. The churn result is projected.','nps',70]
])test('M100 observed control stays scorable: '+current_metrics,()=>{
 assert.doesNotMatch(run(current_metrics),/Cannot score/);assert.equal(readPMFMetrics(current_metrics).values[key],value);
});
