import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(name,args)=>{const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
const fixture={"customer_segment": "SaaS operations teams", "business_model": "saas_subscription", "current_churn_rate": "2% monthly", "product": "SaaS software for approval handoffs", "churn_reasons": "Customers find the price too expensive"};
for(const v of verticals)test('C12 '+v+' churn period follows meaning',async()=>{
 for(const [rate,severity]of [['6% monthly','HIGH'],['6% monthly, not annual','HIGH'],['6% over twelve months','LOW'],['6% per year','LOW'],['6% over three months','LOW']]){
 const t=await call('retention_playbook',{...fixture,product:v+' vendor',current_churn_rate:rate});assert.ok(t.includes('It reads '+severity),rate);assert.ok(t.includes(rate));
 }
 for(const rate of ['200% monthly','-2% monthly','6% monthly and 6% annual']){const t=await call('retention_playbook',{...fixture,product:v+' vendor',current_churn_rate:rate});assert.match(t,/no severity is shown/);assert.doesNotMatch(t,/It reads (?:LOW|HIGH|MODERATE|CRITICAL)/)}
});
