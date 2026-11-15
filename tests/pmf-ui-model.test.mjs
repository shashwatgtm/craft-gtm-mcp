import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatePMFScorecard, buildPMFScorecard } from '../dist/pmf-scorecard.js';
import { pmfWidgetResult } from '../dist/pmf-result.js';
import { cleanDeep,escapeDeep } from '../dist/escape-inputs.js';
import { tools } from '../dist/tools.js';
const OriginalDate=Date;
class FixedDate extends OriginalDate { constructor(...args){super(...(args.length?args:['2026-10-30T12:00:00.000Z']));}static now(){return OriginalDate.parse('2026-10-30T12:00:00.000Z');}}
const base={product:'User supplied product',target_market:'enterprise_saas',current_metrics:'Churn: 1%, NPS: 70, LTV: 5000, CAC: 1000, Retention: 95%, Activation: 80%'};
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/pmf-ui-baseline.json',import.meta.url),'utf8'));
for(const entry of fixture.cases)test('legacy text parity: '+entry.name,()=>{
 globalThis.Date=FixedDate;
 try {
 const input=escapeDeep(cleanDeep(entry.input));
 assert.equal(generatePMFScorecard(input),entry.text);
 assert.equal(buildPMFScorecard(input).text,entry.text);
 } finally { globalThis.Date=OriginalDate; }
});
test('independent complete score and basis',()=>{const r=buildPMFScorecard(base).result;assert.equal(r.overall.score,9);assert.equal(r.overall.scoredCount,5);assert.equal(r.overall.applicableCount,5);assert.equal(r.missingData.length,0);assert.match(r.overall.caveat,/history and customer evidence/);});
test('sparse score retains insufficiency beside high stage',()=>{const r=buildPMFScorecard({...base,current_metrics:'NPS: 80'}).result;assert.equal(r.overall.score,9);assert.equal(r.overall.scoredCount,1);assert.match(r.overall.caveat,/Too few metrics/);assert.ok(r.missingData.length>=4);});
test('missing churn and retention actions preserve deployed fixes',()=>{const r=buildPMFScorecard({...base,current_metrics:'NPS: 80, LTV: 6000, CAC: 1000, Activation rate: 90%'}).result;assert.ok(r.recommendations.some(x=>x.startsWith('CHURN: not given')));assert.ok(r.recommendations.some(x=>x.startsWith('RETENTION: not given')));assert.match(r.overall.caveat,/Fill the missing data/);});
test('excluded activation stays visible but is not scored',()=>{const r=buildPMFScorecard({...base,business_model:'services'}).result;assert.equal(r.overall.applicableCount,4);assert.equal(r.dimensions[4].applicable,false);assert.equal(r.dimensions[4].includedInAverage,false);assert.equal(r.dimensions[4].value,80);});
test('aliases disclose actual example range',()=>{const r=buildPMFScorecard({...base,target_market:'ai_native'}).result;assert.equal(r.rangeKey,'enterprise_saas');assert.match(r.rangeNote,/no example ranges/);});
test('zero LTV and CAC preserve parser semantics',()=>{for(const text of ['LTV: 0, CAC: 1000','LTV: 5000, CAC: 0']){const r=buildPMFScorecard({...base,current_metrics:text}).result;assert.equal(r.dimensions[2].value,null);assert.equal(r.dimensions[2].includedInAverage,false);}});
test('zero churn is supplied, annual churn is not converted',()=>{assert.equal(buildPMFScorecard({...base,current_metrics:'Churn: 0%'}).result.dimensions[0].value,0);const r=buildPMFScorecard({...base,current_metrics:'Annual churn: 12%'}).result;assert.equal(r.dimensions[0].value,12);assert.ok(r.limitations.some(x=>/not converted/.test(x)));});
test('first match and suffix behavior are visible',()=>{const r=buildPMFScorecard({...base,current_metrics:'NPS: 30; NPS: 90; MRR: $5K; ARR: $2M'}).result;assert.equal(r.parsedMetrics.nps,30);assert.equal(r.parsedMetrics.mrr,5000);assert.equal(r.parsedMetrics.arr,2000000);});
for(const [id,text,values,scores]of [
 ['churn','Churn: ',[0,1,1.1,3,3.1,5,5.1],[9,9,7,7,5,5,3]],
 ['nps','NPS: ',[29,30,49,50,69,70],[3,5,5,7,7,9]],
 ['retention','Retention: ',[84,85,89,90,94,95],[3,5,5,7,7,9]],
 ['activation','Activation: ',[39,40,59,60,79,80],[3,5,5,7,7,9]]
])test('independent threshold boundary '+id,()=>{values.forEach((v,i)=>{const r=buildPMFScorecard({...base,current_metrics:text+v+(id==='nps'?'':'%')}).result;assert.equal(r.dimensions.find(d=>d.id===id).score,scores[i]);});});
test('feedback preserves source classification and next action',()=>{const r=buildPMFScorecard({...base,customer_feedback:'Setup is slow; Revenue grew 30%'}).result;assert.equal(r.feedback.length,2);assert.equal(r.feedback[0].classification,'Friction');assert.equal(r.feedback[1].classification,'Company claim');assert.match(r.feedback[1].nextStep,/not present it as a measured result/);});
test('model-visible input remains escaped; component roundtrip stays literal',()=>{const input={...base,product:'<b>& é</b>',unknown:'not allowed'};const typed=cleanDeep(input),safe=escapeDeep(typed),score=buildPMFScorecard(safe),response=pmfWidgetResult(score.result,safe,typed,score.text);assert.equal(response.structuredContent.input.product,safe.product);assert.equal(response.structuredContent.input.unknown,undefined);const decoded=JSON.parse(Buffer.from(response._meta.helixPmfScorecard.inputsBase64,'base64').toString());assert.equal(decoded.product,typed.product);assert.equal(decoded.unknown,undefined);assert.equal(response.structuredContent.textFallback,generatePMFScorecard(safe));});
test('all tool names and input schemas remain identical',()=>assert.deepEqual(tools.map(({name,inputSchema})=>({name,inputSchema})),fixture.tools));
test('only selected tool receives additive metadata in source',()=>{const source=fs.readFileSync(new URL('../src/server.ts',import.meta.url),'utf8');assert.match(source,/tool\.name === 'pmf_scorecard' \? \{ _meta:/);assert.match(source,/content: \[\s*\{\s*type: "text",\s*text: result,/);assert.match(source,/pmf \? pmfWidgetResult/);assert.doesNotMatch(source,/SERVER_VERSION = "(?!2\.2\.23)/);});
test('resource MIME and empty CSP allowlists',()=>{const source=fs.readFileSync(new URL('../src/pmf-ui.ts',import.meta.url),'utf8');assert.match(source,/text\/html;profile=mcp-app/);assert.match(source,/connectDomains: \[\], resourceDomains: \[\], frameDomains: \[\]/);});
test('empty UI and inert rendering source',()=>{const html=fs.readFileSync(new URL('../ui/pmf-scorecard.html',import.meta.url),'utf8');assert.doesNotMatch(html,/Northstar|LedgerLoop|\.innerHTML|localStorage|indexedDB|fetch\(/);assert.match(html,/id="results" class="panel" hidden/);assert.match(html,/id="calculate" type="button"/);assert.match(html,/event\.source!==parent/);});
