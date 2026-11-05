// M105: a fraction is one unsupported number. It is never scored as its numerator, in any sector or market.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readPMFMetrics} from '../dist/pmf-metrics.js';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const products=[
 ['logistics-tech','Warehouse management software for warehouse operators','India'],
 ['fintech','Lending software for banks','Singapore'],
 ['vertical-saas','Hotel property management software for hotel owners','United Arab Emirates'],
 ['ai-native','Voice AI agents for contact centres','United Kingdom'],
 ['ites','IT outsourcing and managed engineering services','Germany'],
 ['telecom','CPaaS SMS messaging platform for operators','United States'],
 ['cybersecurity','Managed SOC detection and response services','Canada'],
 ['software','Application observability and tracing platform','France'],
 ['saas','Customer service helpdesk software','Mexico'],
];
const fractions=['Observed monthly churn: 1/2%','Observed monthly churn: 2/4%','Observed monthly churn: 1 / 2%','Monthly churn rate = 3/6 %','Observed NPS: 40/100','Observed activation rate: 3/4%','Retention: 9/10%','LTV: 100000/2; CAC: 20000','The churn is not 1/2%.'];
const scalars=[['Observed monthly churn: 2%','churn',2],['Monthly churn rate = 2 %','churn',2],['Observed NPS: 40','nps',40],['Observed activation rate: 35%','activationRate',35]];
for(const [vertical,product,country] of products){
 test('M105 fractions are held, '+vertical+' '+country,()=>{
  for(const text of fractions){
   const reading=readPMFMetrics(text);
   assert.ok(reading.issues.length,text);assert.deepEqual(reading.values,{},text);
   assert.match(reading.issues.join(' '),/fraction/i,text);
   const args={product:product+' sold in '+country,target_market:vertical,current_metrics:text};
   const first=generatePMFScorecard(args);
   assert.match(first,/Cannot score these metrics/,text);
   assert.equal(generatePMFScorecard(args),first);assert.equal(generatePMFScorecard(args),first);
  }
 });
 test('M105 supported scalars and dates still score, '+vertical,()=>{
  for(const [text,key,value] of scalars){const r=readPMFMetrics(text);assert.equal(r.values[key],value,text);assert.deepEqual(r.issues,[],text);}
  for(const text of ['Observed monthly churn: 2%. Assessment date: 31/10/2026','Observed monthly churn: 2%. Assessment date: 2026-10-31','Observed NPS: 40. Reviewed 3/11/2026']){
   const r=readPMFMetrics(text);assert.deepEqual(r.issues,[],text);assert.ok(Object.keys(r.values).length,text);
  }
 });
}
