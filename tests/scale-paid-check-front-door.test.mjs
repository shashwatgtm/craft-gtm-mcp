import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {generateScalePaidCheck} from '../dist/scale-paid-check.js';
import {createServer} from '../dist/server.js';
const fixture = file => JSON.parse(readFileSync(new URL('./fixtures/scale-paid-check/'+file,import.meta.url)));
const base = changes => ({product:'Dispatch planning software',business_model:'saas_subscription',billing_term:'monthly',as_of:'2026-09-30',customers:rows(40),churn_reasons:'dispatchers return to spreadsheets',interview_persona:'Head of dispatch',stop_line:0.8,payback_line_months:12,gross_margin:0.8,paid_cac:4000,...changes});
function rows(n, segment='Dispatch teams') { return Array.from({length:n},(_,i)=>({id:`C${i+1}`,signed:i%2?'2025-04-10':'2025-07-10',segment,monthly_fee:2000})); }
const run=changes=>generateScalePaidCheck(base(changes));
const call=async args=>createServer()._requestHandlers.get('tools/call')({method:'tools/call',params:{name:'scale_paid_check',arguments:args}});

test('W1: zero and negative paid costs refuse; a positive paid cost can scale',async()=>{
 for(const paid_cac of [0,-5000]){
  const r=run({paid_cac}); assert.equal(r.isError,true); assert.equal(r.text,'Give your paid customer acquisition cost as a number above 0.'); assert.deepEqual(r.structuredContent,{});
  assert.equal((await call(base({paid_cac}))).structuredContent?.groups,undefined);
 }
 assert.equal(run({paid_cac:5000}).structuredContent.groups[0].verdict,'SCALE');
});
test('W1: every decision range rejects equivalent bad limits and accepts the boundary',()=>{
 for(const key of ['stop_line','gross_margin','win_rate_floor','win_rate_target','payback_line_months','test_cap','blended_cac']){
  for(const value of [0,-1,NaN,Infinity]) assert.equal(run({[key]:value}).isError,true,`${key}: ${value}`);
  assert.equal(run({[key]:1}).isError,undefined,key);
 }
 for(const key of ['gross_margin','win_rate_floor','win_rate_target']) for(const value of [1.01,80]) assert.equal(run({[key]:value}).isError,true);
 for(const value of [80,85]) assert.equal(run({stop_line:value}).text,'Give your keep line as a share, for example 0.8 for 80%');
 assert.equal(run({stop_line:0.85}).isError,undefined);
 assert.equal(run({stop_line:101}).isError,true);
});
test('W2: shape-only base holds cap passing groups; early losses and annual billing are opposite controls',()=>{
 for(const stopMonth of ['2026-02-10','2026-03-10']){
  const customers=rows(80).map((r,i)=>({...r,segment:i<40?'Fleet teams':'Dispatch teams',...(i%20===0?{stopped:stopMonth}:{})}));
  const r=run({customers});
  assert.equal(r.structuredContent.stop_rule.base_verdict,'HOLD');
  assert.ok(r.structuredContent.groups.every(g=>g.verdict==='CAPPED_TEST'));
  assert.match(r.text.split('\n')[2],/Base verdict: \*\*Hold/);
  assert.ok(run({customers,billing_term:'annual'}).structuredContent.groups.every(g=>g.verdict==='SCALE'));
 }
 const early=rows(80).map((r,i)=>({...r,...(i%20===0?{stopped:'2025-10-01'}:{})}));
 assert.equal(run({customers:early}).structuredContent.stop_rule.base_verdict,'PASS');
});
test('W3: eight and fourteen customers passing a lower line are leads; fifteen can scale',()=>{
 for(const n of [8,14,15]){
  const g=run({customers:rows(n),stop_line:0.6}).structuredContent.groups[0];
  assert.equal(g.lead_not_proof,n<15); assert.equal(g.verdict,n<15?'CAPPED_TEST':'SCALE');
 }
});
test('rounded failing shares show a decimal; an exact keep line still passes',()=>{
 for(const [n,lost] of [[49,10],[44,9],[50,10]]){
  const customers=rows(n).map((r,i)=>({...r,...(i<lost?{stopped:'2026-02-10'}:{})}));
  const r=run({customers,billing_term:'annual'});
  const g=r.structuredContent.groups[0];
  assert.equal(g.line_pass,n===50);
  if(n===49) assert.match(r.text,/39 of 49 kept, 79\.6% vs 80%/);
  if(n===44) assert.match(r.text,/35 of 44 kept, 79\.5% vs 80%/);
  if(n===50) assert.match(r.text,/40 of 50 still paying \(80%\)/);
 }
});
test('return without stop has a truthful reason; earlier return and valid pause stay distinct',()=>{
 for(const resumed of ['2026-04-01','2026-05-01']){
  const r=run({customers:[{...rows(1)[0],resumed}]});
  assert.equal(r.structuredContent.rejected_rows[0].reason,'has a return date but no stop date');
 }
 const r=run({customers:[{...rows(1)[0],stopped:'2026-03-01',resumed:'2026-04-01'}]});
 assert.equal(r.structuredContent.rejected_rows.length,0); assert.equal(r.structuredContent.paused_customers.length,1);
});
test('capitalization merges equivalent group labels; distinct groups remain separate',()=>{
 for(const label of ['dispatch teams','DISPATCH TEAMS','Fleet teams']){
  const r=run({customers:rows(40).map((x,i)=>({...x,segment:i%2?label:'Dispatch teams'}))});
  assert.equal(r.structuredContent.groups.length,label==='Fleet teams'?2:1);
  assert.equal(r.text.includes('Segment labels that differ only in capital letters were merged'),label!=='Fleet teams');
 }
});
test('zero losses and no window never print zero denominators or zero interviews; real losses do',()=>{
 for(const customers of [rows(40),rows(40).map(r=>({...r,signed:'2026-05-01'})),rows(40).map((r,i)=>({...r,...(i===0?{stopped:'2026-02-01'}:{})}))]){
  const r=run({customers}); assert.doesNotMatch(r.text,/0 of 0 \(0%\)|book the 0 interviews|book the 0 churn|each of the 0 lost/);
  if(r.structuredContent.window.lost) assert.match(r.text,/book the 1 churn/);
 }
});

// Captured by running main ec13f3f through its compiled public exports.
const baseline=fixture('main-ec13f3f-figures.json');
function stable(value){
 if(Array.isArray(value)) return value.map(stable);
 if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([k])=>!['verdict_note','note','display'].includes(k)).map(([k,v])=>[k,stable(v)]));
 return value;
}
test('all eighteen fixtures retain main figures with only W2/W3 verdict changes',()=>{
 for(const [file,expectedRaw] of Object.entries(baseline)){
  const raw=fixture(file);const actual=generateScalePaidCheck(raw.input??raw).structuredContent;
  const expected=structuredClone(expectedRaw);
  for(const g of expected.groups){
   if(g.line_pass&&g.base<15) g.lead_not_proof=true;
   if(g.verdict==='SCALE'&&(expected.stop_rule.base_verdict==='HOLD'||g.lead_not_proof)) g.verdict='CAPPED_TEST';
  }
  assert.deepEqual(stable(actual),stable(expected),file);
 }
});
test('the other eight tools preserve full main response bytes for absent, affirmative and denied regions',async()=>{
 const cases=fixture('main-ec13f3f-other-tools.json');
 assert.equal(new Set(cases.map(c=>c.tool)).size,8);
 const handler=createServer()._requestHandlers.get('tools/call');
 for(const c of cases){
  const result=await handler({method:'tools/call',params:{name:c.tool,arguments:c.args}});
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),c.sha256,c.tool);
 }
});

test('readable labels replace code words in exact, equivalent and failing buyer inputs',()=>{
 for (const changes of [{}, {customers:rows(8),stop_line:0.6}, {customers:rows(40).map((r,i)=>({...r,...(i<20?{stopped:'2026-02-01'}:{})}))}]) {
  const r=run(changes);
  assert.doesNotMatch(r.text,/\b(?:SCALE|CAPPED_TEST|HOLD|NO_VERDICT|NOT_ENOUGH_HISTORY|PASS|FAIL)\b|\b[a-z]+(?:_[a-z0-9]+)+\b/);
  assert.match(r.text,/Your keep line: (?:80|60)% of customers still paying at month 12/);
  assert.ok(['SCALE','CAPPED_TEST','HOLD'].includes(r.structuredContent.groups[0].verdict));
 }
});

test('Answer Card leads with the base and one short decision per group; details follow in buyer order',()=>{
 for(const file of Object.keys(baseline)){
  const raw=fixture(file),r=generateScalePaidCheck(raw.input??raw);
  assert.ok(r.text.startsWith('# Scale Paid Check: Answer Card\n\nBase verdict:'));
  const card=r.text.split('## Check this first')[0];
  assert.equal(card.split('\n').filter(x=>x.startsWith('- **')).length,r.structuredContent.groups.length);
  assert.ok(card.split('\n').every(line=>line.length<260),file);
  const headings=['## Check this first','## Cohort table','## Groups table','## Money','## Stop rule','## First draft: responses'];
  for(let i=1;i<headings.length;i++) assert.ok(r.text.indexOf(headings[i-1])<r.text.indexOf(headings[i]),file);
  assert.equal(r.text,r.content[0].text);assert.equal(r.toString(),r.text);
 }
});
