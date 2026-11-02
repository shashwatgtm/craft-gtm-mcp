import {checkReader} from './overnight-reader-helper.mjs';
checkReader("pmf_scorecard", [{"index": 0, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "current_metrics", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "target_market", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "current_metrics", "a": "The retention measure is six delayed approvals in one reviewed batch.", "b": "The retention measure is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const pmfArgs={product:'Workflow software',target_market:'enterprise_saas'};
test('Overnight PMF: logo and revenue retention keep their supplied basis',()=>{
 const logo=generatePMFScorecard({...pmfArgs,current_metrics:'Annual logo retention: 78%'});assert.match(logo,/### 4. Logo Retention/);assert.match(logo,/\| Logo Retention \| 78%/);assert.doesNotMatch(logo,/### 4. Revenue Retention/);
 const net=generatePMFScorecard({...pmfArgs,current_metrics:'NRR: 120%'});assert.match(net,/Net Revenue Retention \| 120%/);
 const gross=generatePMFScorecard({...pmfArgs,current_metrics:'Gross revenue retention: 90%'});assert.match(gross,/Gross Revenue Retention \| 90%/);
});
test('Overnight PMF: equal numbers with different retention bases are not merged',()=>{
 const s=generatePMFScorecard({...pmfArgs,current_metrics:'Logo retention: 90%; NRR: 90%'});assert.match(s,/Cannot score/);assert.match(s,/different retention bases/);
});

test('Overnight PMF: expanded money metrics retain the same values and unit economics',()=>{
 for (const current_metrics of [
  'MRR: $50000; ARR: $600000; ACV: $24000; CAC: $18000; LTV: $54000',
  'Monthly recurring revenue is $50000; annual recurring revenue is $600000; annual contract value is $24000; customer acquisition cost is $18000; customer lifetime value is $54000',
 ]) {
  const s=generatePMFScorecard({...pmfArgs,current_metrics});
  for(const row of ['MRR | $50,000','ARR | $600,000','ACV | $24,000','CAC | $18,000','LTV | $54,000','LTV:CAC Ratio | 3.0x'])assert.ok(s.includes(row),row);
  assert.doesNotMatch(s,/Not scored \(no rule reads these figures\):/);
 }
});
test('Overnight PMF: money aliases preserve uncertainty and reject conflicts and zero acquisition cost',()=>{
 for(const current_metrics of ['Target monthly recurring revenue is $50000','Customer acquisition cost is $18000; CAC: $19000','Monthly recurring revenue is $50000; MRR: $60000','Customer acquisition cost is $0']) {
  assert.match(generatePMFScorecard({...pmfArgs,current_metrics}),/Cannot score/,current_metrics);
 }
 assert.match(generatePMFScorecard({...pmfArgs,current_metrics:'Annual recurring revenue is $-5'}),/Cannot score/);
 const denied=generatePMFScorecard({...pmfArgs,current_metrics:'Monthly recurring revenue is not $50000; customer acquisition cost is not $18000'});
 assert.doesNotMatch(denied,/\| MRR \| \$50,000|\| CAC \| \$18,000/);
 assert.match(denied,/No confirmed values were read/);
});
test('Overnight PMF: a following word is not a currency multiplier',()=>{
 const s=generatePMFScorecard({...pmfArgs,current_metrics:'MRR: $50000 monthly; CAC: $18000 before the review; LTV: $54000 measured from records'});
 assert.match(s,/\| MRR \| \$50,000/);assert.match(s,/\| CAC \| \$18,000/);assert.match(s,/\| LTV \| \$54,000/);
 const scaled=generatePMFScorecard({...pmfArgs,current_metrics:'MRR: $50k; CAC: $18k; LTV: $54k'});
 assert.match(scaled,/\| LTV:CAC Ratio \| 3.0x/);assert.match(scaled,/\| MRR \| \$50,000/);
});


import {call} from './overnight-reader-helper.mjs';
test('unscorable PMF inputs use readable metric names and retain the score hold in the reader',async()=>{
 for(const current_metrics of ['Retention: 89%; GRR: 92%; NRR: 108%','Activation: 40%; Activation: 60%','MRR: $50000','Churn: 2%']){
 const r=await call('pmf_scorecard',{...pmfArgs,current_metrics});const s=r.content.map(c=>c.text||'').join('\n');
 const reading=s.split('## Reading the answer')[1];
 assert.match(reading,/These inputs do not yet support a score/);assert.doesNotMatch(reading,/This score supports a comparison/);
 assert.doesNotMatch(s,/retentionRate:|activationRate:|ltvCacRatio:/);
 if(current_metrics.startsWith('Retention'))assert.match(s,/- Retention: conflicting values or bases/);
 if(current_metrics.startsWith('Activation'))assert.match(s,/- Activation: conflicting values or bases/);
 }
});
