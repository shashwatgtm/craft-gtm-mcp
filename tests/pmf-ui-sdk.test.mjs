import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer} from '../dist/server.js';
import {PMF_UI_URI,PMF_UI_HTML} from '../dist/pmf-ui.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/pmf-ui-baseline.json',import.meta.url),'utf8'));
const server=createServer(),client=new Client({name:'pmf-ui-test',version:'1.0.0'});
before(async()=>{const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);});
after(async()=>{await client.close();await server.close();});
const OriginalDate=Date;
class FixedDate extends OriginalDate{constructor(...args){super(...(args.length?args:[fixture.fixedDate||'2026-10-30T12:00:00.000Z']));}static now(){return OriginalDate.parse('2026-10-30T12:00:00.000Z');}}
for(const entry of fixture.cases)test('SDK legacy text parity: '+entry.name,async()=>{
 globalThis.Date=FixedDate;
 try{const response=await client.callTool({name:'pmf_scorecard',arguments:entry.input});assert.equal(response.isError,undefined);assert.deepEqual(response.content,[{type:'text',text:entry.text}]);assert.equal(response.structuredContent.tool,'pmf_scorecard');assert.equal(response.structuredContent.textFallback,entry.text);}finally{globalThis.Date=OriginalDate;}
});
test('SDK tools/list preserves all names and schemas, adds UI only to PMF',async()=>{const {tools}=await client.listTools();assert.deepEqual(tools.map(({name,inputSchema})=>({name,inputSchema})),fixture.tools);for(const tool of tools)assert.equal(tool._meta?.ui?.resourceUri,tool.name==='pmf_scorecard'?PMF_UI_URI:undefined);});
test('SDK lists and reads the exact generated resource with restrictive CSP',async()=>{const list=await client.listResources();assert.equal(list.resources.length,1);assert.equal(list.resources[0].uri,PMF_UI_URI);const {contents}=await client.readResource({uri:PMF_UI_URI});assert.equal(contents.length,1);assert.equal(contents[0].mimeType,'text/html;profile=mcp-app');assert.equal(contents[0].text,PMF_UI_HTML);assert.equal(PMF_UI_HTML,fs.readFileSync(new URL('../ui/pmf-scorecard.html',import.meta.url),'utf8'));assert.deepEqual(contents[0]._meta.ui.csp,{connectDomains:[],resourceDomains:[],frameDomains:[]});});
test('SDK rejects an unknown UI resource',async()=>{await assert.rejects(()=>client.readResource({uri:'ui://helix/unknown'}),/Unknown resource/);});
test('SDK missing required input returns unchanged text error without structured result',async()=>{const r=await client.callTool({name:'pmf_scorecard',arguments:{product:'User supplied product'}});assert.equal(r.isError,true);assert.match(r.content[0].text,/Missing required input/);assert.equal(r.structuredContent,undefined);assert.equal(r._meta,undefined);});
test('SDK literal metadata allowlist preserves repeated edits without model markup',async()=>{const input={product:'<b>Literal & input</b>',target_market:'enterprise_saas',current_metrics:'NPS: 40',unknown:'excluded'};for(let i=0;i<3;i++){const r=await client.callTool({name:'pmf_scorecard',arguments:input});const literal=JSON.parse(Buffer.from(r._meta.helixPmfScorecard.inputsBase64,'base64').toString('utf8'));assert.equal(literal.product,input.product);assert.equal(literal.unknown,undefined);assert.equal(r.structuredContent.input.unknown,undefined);assert.match(r.structuredContent.input.product,/\\</);assert.match(r.content[0].text,/\\</);}});
test('SDK weak-retention calculation remains visible and legacy text is intentionally separate',async()=>{const r=await client.callTool({name:'pmf_scorecard',arguments:{product:'User supplied product',target_market:'enterprise_saas',current_metrics:'monthly churn 1%, NPS 60, LTV 90000, CAC 10000, retention 40%, activation 70%'}});const retention=r.structuredContent.result.dimensions.find(d=>d.id==='retention');assert.equal(retention.value,40);assert.equal(retention.status,'CRITICAL');assert.equal(retention.score,3);assert.deepEqual(r.structuredContent.result.recommendations,[]);assert.match(r.content[0].text,/Every dimension scores well/);});
