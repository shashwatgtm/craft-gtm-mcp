import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateLaunchCommander} from '../dist/launch-commander.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const base={product_feature:f.product,target_segments:f.audience,business_model:f.model,launch_type:'major_release',goals:'Five qualified pilot commitments'};
 for(const channels of ['We do not use paid ads, webinars, or cold email','We never use paid ads, webinars and cold email']){
  test(`${f.id}: excludes the whole list: ${channels}`,()=>{
   const out=generateLaunchCommander({...base,available_channels:channels});
   assert.match(out,/The channels you named are excluded/);
   assert.doesNotMatch(out,/You can use|prepare and verify the message for (?:webinars|cold email)|\|[^\n]*(?:Webinar|Paid campaigns|Email blast)/i);
   assert.equal(out,generateLaunchCommander({...base,available_channels:channels}));
  });
 }
 test(`${f.id}: positive list and contrast retain available channels`,()=>{
  const yes=generateLaunchCommander({...base,available_channels:'paid ads, webinars, cold email'});
  assert.match(yes,/You can use paid ads, webinars and cold email/);
  const contrast=generateLaunchCommander({...base,available_channels:'We use webinars, not cold email'});
  assert.match(contrast,/You can use webinars\./);
  assert.doesNotMatch(contrast,/cold email/);
 });
}
