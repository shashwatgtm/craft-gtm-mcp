import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
const alpha=pkg.name.includes('gtm-alpha'),revenue=pkg.name.includes('revenue-enablement');
const baselineName=['icp-intelligence','impact-mcp','craft-gtm'].some(n=>pkg.name.includes(n))?'round5-reader-cases':'regions-baseline';
const baseline=JSON.parse(readFileSync(new URL(`./fixtures/${baselineName}.json`,import.meta.url)));
const seeds=(Array.isArray(baseline)?baseline:baseline.cases).filter(x=>x.tool==='crisis_planner');
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const fields={case_study_generator:'your_product',newsletter_builder:'your_product',webinar_script:'your_product',content_repurposer:'source_content',thought_leadership_series:'your_take',testimonial_capture:'your_product',sales_enablement_content:'product',craft_content_improver:'content',pmf_scorecard:'product',launch_commander:'product_feature',customer_interview_kit:'product_context',retention_playbook:'product',partner_architect:'product',crisis_planner:'potential_crises',competitive_intel:'your_product',craft_gtm_analyzer:'document_content',impact_get_framework:'sector',impact_identify_champions:'product_description',impact_map_alternatives:'your_product',impact_pinpoint_value:'category',impact_anchor_market:'product_description',impact_craft_message:'product_category',impact_translate_execution:'positioning_statement',impact_full_audit:'product_description'};
const rpc=async(tool,args)=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));const b=await r.json();assert.ok(!b.error,JSON.stringify(b));assert.ok(!b.result?.isError,JSON.stringify(b));return b.result;};
const notes=r=>r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n').split('## Region and industry context')[1]||'';

import {REGION_DATA} from '../dist/regions.js';
const countries=REGION_DATA.flatMap(r=>r.reader_hints.countries.map(c=>({code:c.code,name:c.name==='Viet Nam'?'Vietnam':c.name,region:r.region_name})));
const seed=seeds[0];
const heading=text=>[...notes(text).matchAll(/^### (.+)$/gm)].map(m=>m[1]);
const crisis=text=>rpc('crisis_planner',{...seed.args,industry:'fintech',potential_crises:text});
for(const [ci,c] of countries.entries()){
 const d=countries.filter(x=>x.region!==c.region)[ci%countries.filter(x=>x.region!==c.region).length];
 test('RFIX M087 crisis subtype kept, '+c.code,async()=>{
  const control=await crisis('We sell payment gateway software in '+c.name+'.'),want=heading(control);
  assert.equal(want.length,1);
  assert.match(notes(control),/payment|Payment/);
  for(const text of [
   'We sell payment gateway software in '+c.name+' but do not sell wealth management software in '+d.name+'.',
   'We do not sell wealth management software in '+d.name+'. We sell payment gateway software in '+c.name+'.',
   'In '+c.name+' we sell payment gateway software.',
   'We sell payment gateway software in '+c.name+'. We are unable to sell wealth management software in '+d.name+'.',
   'Our headquarters is in '+d.name+'. We sell payment gateway software in '+c.name+'.',
   'We sell payment gateway software in '+c.name+'. We do not sell lending software in '+c.name+'.',
  ]){const got=await crisis(text);assert.deepEqual(heading(got),want,text);assert.equal(notes(got),notes(control),text);assert.deepEqual(await crisis(text),got);}
  const opposite=await crisis('We do not sell payment gateway software in '+c.name+'.');
  assert.deepEqual(heading(opposite),[]);
 });
}
