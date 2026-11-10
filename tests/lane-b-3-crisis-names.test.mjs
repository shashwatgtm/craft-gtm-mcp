import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateCrisisPlanner} from '../dist/crisis-planner.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const base={industry:f.id,customer_base:'enterprise',data_sensitivity:'high',potential_crises:'Service outage',business_model:f.model};
 test(`${f.id}: a supplied name beginning with The stays as typed`,()=>{
  for(const name of ['The Anonymous Logistics Group','The Anonymous Regional Logistics Operations Group']){
   for(const company of [name,`${name}: ${f.product}`]){
    const out=generateCrisisPlanner({...base,company});assert.ok(out.startsWith(`# Crisis response plan: ${name}\n`));
    assert.equal(out,generateCrisisPlanner({...base,company}));
   }
  }
  const out=generateCrisisPlanner({...base,company:'The company handles branch network outages'});assert.ok(out.startsWith('# Crisis response plan: your company\n'));
 });
}
