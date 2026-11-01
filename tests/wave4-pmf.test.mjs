import test from 'node:test';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import path from 'node:path';
const home=process.env.WAVE4_TEST_HOME||path.resolve('.');
const {generatePMFScorecard:score}=await import(pathToFileURL(home+'/dist/pmf-scorecard.js'));
const markets=['logistics_tech','fintech','enterprise_saas','vertical_saas','ai_native','ites','telecom','software','cybersecurity'];
const healthy='Churn: 0.5%, NPS: 80, LTV: $300000, CAC: $30000, Retention: 98%, Activation: 90%';
for(const market of markets){
 const run=text=>score({product:market+' vendor',target_market:market,current_metrics:text,business_model:'saas'});
 test('F1/F2 '+market+': every critical dimension creates action and caps verdict',()=>{
  for(const [from,to,action] of [['Churn: 0.5%','Churn: 30%','CHURN'],['NPS: 80','NPS: -70','NPS'],['Retention: 98%','Retention: 0%','RETENTION'],['LTV: $300000','LTV: $3000','UNIT ECONOMICS'],['Activation: 90%','Activation: 1%','ACTIVATION']]){
   const out=run(healthy.replace(from,to));assert.match(out,/CRITICAL/);assert.match(out,new RegExp('\\d+\\. '+action+':'));assert.doesNotMatch(out,/Strong PMF|Emerging PMF|\| Yes \||Every dimension scores well/);
  }
 });
 test('F2 '+market+': healthy control remains strong',()=>{assert.match(run(healthy),/Strong PMF/);assert.match(run(healthy),/\| Yes \|/)});
 test('F2 '+market+': bare NRR is scored and blocks fit when weak',()=>{const out=run(healthy.replace('Retention: 98%','NRR: 60%'));assert.match(out,/Net Revenue Retention \| 60%/);assert.doesNotMatch(out,/Strong PMF|Emerging PMF/)});
}
const run=text=>score({product:'SaaS approval software',target_market:'enterprise_saas',current_metrics:text});
for(const bad of ['Churn: 200%','Churn: -2%','NPS: 101','Retention: 120%','Activation: 101%','CAC: 0','Churn: 1%; Churn: 9%','Churn: 2% was our target, actual is far higher'])test('F2 refuse '+bad,()=>{const out=run(bad);assert.match(out,/Cannot score/);assert.doesNotMatch(out,/Overall PMF Assessment/)});
for(const [text,ratio] of [['LTV: $300K, CAC: $30,000','10.0x'],['LTV: $1.2M, CAC: $100K','12.0x'],['LTV is $300,000 and CAC is $30,000','10.0x'],['LTV: $0, CAC: $30,000','0.0x']])test('R6 money '+text,()=>assert.ok(run(text).includes(ratio)));
test('F2 net retention may exceed 100 without impossible-value refusal',()=>{assert.match(run('NRR: 120%'),/Net Revenue Retention \| 120%/)});
