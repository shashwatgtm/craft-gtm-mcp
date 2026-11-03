import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const run=current_metrics=>generatePMFScorecard({product:'Workflow software',target_market:'enterprise_saas',current_metrics});
for(const current_metrics of [
 'LTV: 100000 INR; CAC: 20000 USD',
 'LTV: 100000 USD; CAC: 20000 SGD',
 'LTV: 100000 EUR; CAC: 20000 GBP',
 'LTV: 100000 INR; CAC: 20000 USD. The figures are in different currencies and have not been converted.',
 'LTV: INR 100000; CAC: USD 20000',
 'LTV: ₹100000; CAC: $20000',
 'LTV: 100000; CAC: 20000 USD',
 'LTV: 100000; CAC: 20000',
 'LTV: 100000 INR; LTV: 100000 USD; CAC: 20000 USD'
])test('M101 incompatible or missing currencies hold the ratio: '+current_metrics,()=>{
 const out=run(current_metrics);assert.match(out,/Cannot score these metrics/);assert.match(out,/currenc|conversion/i);assert.doesNotMatch(out,/5\.0x/);
});
for(const currency of ['USD','INR','SGD','EUR','GBP'])for(const prefix of [false,true])test('M101 same stated currency keeps units and a dimensionless ratio: '+currency+' prefix '+prefix,()=>{
 const amount=n=>prefix?currency+' '+n:n+' '+currency;
 const out=run('LTV: '+amount(100000)+'; CAC: '+amount(20000));
 assert.doesNotMatch(out,/Cannot score/);assert.match(out,/LTV:CAC Ratio \| 5.0x/);
 assert.ok(out.includes('| LTV | '+currency+' 100,000'));assert.ok(out.includes('| CAC | '+currency+' 20,000'));
 assert.doesNotMatch(out,/\| (?:LTV|CAC) \| \$/);
});
test('M101 stated currency symbols and dollar notation retain meaning',()=>{
 const rupee=run('LTV: ₹100000; CAC: ₹20000');assert.match(rupee,/LTV \| INR 100,000/);assert.match(rupee,/5.0x/);
 const dollar=run('LTV: $100000; CAC: $20000');assert.match(dollar,/LTV \| \$100,000/);assert.match(dollar,/5.0x/);
});
test('M101 reference money metrics do not acquire an invented currency',()=>{
 const out=run('NPS: 60; MRR: 50000 INR; ARR: EUR 600000; ACV: 24000 GBP');
 assert.match(out,/MRR \| INR 50,000/);assert.match(out,/ARR \| EUR 600,000/);assert.match(out,/ACV \| GBP 24,000/);
 const bare=run('NPS: 60; MRR: 50000');assert.match(bare,/MRR \| 50,000 \(currency not supplied\)/);
});
