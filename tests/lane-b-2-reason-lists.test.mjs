import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateRetentionPlaybook} from '../dist/retention-playbook.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const base={customer_segment:f.audience,product:f.product,business_model:{saas:'saas_subscription',services:'services_contract',connectivity:'connectivity_contract'}[f.model],current_churn_rate:'3% monthly'};
 test(`${f.id}: real lists split and ordinary sentences stay whole`,()=>{
  for(const churn_reasons of ['High prices, poor support and missing features','High prices and poor support and missing features']){
   const out=generateRetentionPlaybook({...base,churn_reasons});
   assert.equal((out.match(/### Reason \d/g)||[]).length,3);
   for(const phrase of ['High prices','poor support','missing features'])assert.ok(out.includes(phrase));
   assert.equal(out,generateRetentionPlaybook({...base,churn_reasons}));
  }
  for(const churn_reasons of ['Hiring is slow, so they pause','Support is slow, so they pause']){
   const out=generateRetentionPlaybook({...base,churn_reasons});assert.equal((out.match(/### Reason \d/g)||[]).length,1);assert.ok(out.includes(churn_reasons));
  }
  const denied=generateRetentionPlaybook({...base,churn_reasons:'Pricing and support are not established causes'});assert.equal((denied.match(/### Reason \d/g)||[]).length,0);
 });
}
