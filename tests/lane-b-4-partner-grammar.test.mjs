import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generatePartnerArchitect} from '../dist/partner-architect.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const base={company:'Anonymous pilot vendor',product:f.product,business_model:f.model,partner_model:'agency_si',your_deal_size:'$48000 annual'};
 test(`${f.id}: articles, tier support and outreach follow the supplied program`,()=>{
  for(const partner_goals of ['Find implementation partners serving banks and retail chains','Find implementation partners serving retail chains and banks']){
   const out=generatePartnerArchitect({...base,partner_goals});assert.match(out,/This is an agency and systems integration partner program/);
   const email=out.slice(out.indexOf('Subject:'));assert.match(email,/risk and compliance consultancies/);assert.match(email,/retail technology integrators/);
   assert.equal(out,generatePartnerArchitect({...base,partner_goals}));
  }
  const bank=generatePartnerArchitect({...base,partner_goals:'Find implementation partners serving banks'});assert.doesNotMatch(bank.slice(bank.indexOf('Subject:')),/retail technology integrators/);
  const reseller=generatePartnerArchitect({...base,partner_model:'reseller',partner_goals:'Find three resellers serving banks'});
  assert.match(reseller,/This is a reseller partner program/);const silver=reseller.split('### Tier 2: Silver')[1].split('### Tier 3:')[0];assert.match(silver,/Partner manager, monthly pipeline review/i);assert.doesNotMatch(silver,/calendly/);
 });
}
