import test from 'node:test';import assert from 'node:assert/strict';
import {readPMFMetrics} from '../dist/pmf-metrics.js';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
for(const input of ['LTV: INR 1 lakh; CAC: INR 20000','LTV: 2 lakhs; CAC: 40000','LTV: 1 crore; CAC: 2000000','LTV: 1 million USD; CAC: 200000','LTV: 1e6; CAC: 200000','LTV: 100000 to 200000; CAC: 20000','LTV: 100000-200000; CAC: 20000','Observed monthly churn: 100 basis points.','Observed monthly churn: 100 bps.','Observed monthly churn: 1% to 3%.'])test('M105 hold complete notation '+input,()=>{
 const reading=readPMFMetrics(input);assert.ok(reading.issues.length);assert.deepEqual(reading.values,{});
 const args={product:'Lending software',target_market:'fintech',current_metrics:input};const first=generatePMFScorecard(args);assert.match(first,/Cannot score these metrics/);assert.doesNotMatch(first,/0\.0x|100%.*CRITICAL/);assert.equal(generatePMFScorecard(args),first);assert.equal(generatePMFScorecard(args),first);
});
test('M105 supported scalar controls remain available',()=>{const a=readPMFMetrics('LTV: $100000; CAC: $20000; Monthly churn: 1%');assert.equal(a.values.ltv,100000);assert.equal(a.values.cac,20000);assert.equal(a.values.churn,1);assert.deepEqual(a.issues,[]);});

test('M105 a supplied ISO assessment date is not a numeric interval',()=>{
 const args={product:'Lending software',target_market:'fintech',current_metrics:'Observed NPS: 40; Assessment date: 2026-10-31'};const text=generatePMFScorecard(args);assert.doesNotMatch(text,/Cannot score/);assert.match(text,/Analysis Date:\*\* 2026-10-31/);
});
