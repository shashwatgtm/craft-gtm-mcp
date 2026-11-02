import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
for(const c of cases)test('Round 5 reader contract: '+c.tool,async()=>{
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:c.args}})}));
 const r=(await response.json()).result;assert.ok(r&&!r.isError);
 const text=r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
 assert.match(text,/## Reading the answer/);
 assert.match(text,/The conclusion needs review if|Change scope if/);
 for(const role of ['Founder','CEO','CMO','CRO','Demand generation head'])assert.match(text,new RegExp('(?:^|\\n)'+role+':'));
 assert.doesNotMatch(text,/_{3,}|icp firmographics\.(?:industries|company sizes|locations)|\[(?:Your name|Competitor A|YOUR WHITESPACE|target customer)\]/);
});


test('Round 5: ordinary planning sentences retain the stated owner, goal, resources and audience',async()=>{
 const {analyzeCRAFTDimensions}=await import('../dist/utils.js');
 const r=analyzeCRAFTDimensions('Launch dispatch planning software to regional logistics fleets on 1 December. The CMO owns the launch. Two account executives can run six demos weekly. We have $18000 for events and outreach. We need 12 paid customers at $24000 ACV by March. Current conversion from demo to sale is 10 percent across 20 completed demos.');
 assert.ok(r.character.groupsFound.includes('an owner or responsible party'));
 assert.ok(r.result.groupsFound.includes('a target with a number'));
 assert.ok(r.frame.groupsFound.includes('an audience, persona or segment'));
 assert.ok(r.frame.groupsFound.includes('a budget or resources'));
 assert.ok(r.frame.groupsFound.includes('context or current state'));
});
test('Round 5: denied planning facts do not establish ownership, target or budget',async()=>{
 const {analyzeCRAFTDimensions}=await import('../dist/utils.js');
 const r=analyzeCRAFTDimensions('The CMO does not own the launch. We do not have $18000 for events. We do not need 12 paid customers by March.');
 assert.ok(!r.character.groupsFound.includes('an owner or responsible party'));
 assert.ok(!r.result.groupsFound.includes('a target with a number'));
 assert.ok(!r.frame.groupsFound.includes('a budget or resources'));
});
