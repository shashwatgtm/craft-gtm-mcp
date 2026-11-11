import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateScalePaidSite, ROLE_TEXT } from '../dist/scale-paid-site.js';
import { generateScalePaidCheck } from '../dist/scale-paid-check.js';
import { createServer } from '../dist/server.js';
import handler, { MAX_BYTES } from '../netlify/functions/scale-paid-site.mjs';
const sample=JSON.parse(readFileSync(new URL('./fixtures/scale-paid-site/sample.json',import.meta.url)));
const run=(measure,changes={})=>calculateScalePaidSite({measure,input:{...structuredClone(sample),average_arr:36000,...changes}});
const request=(body,method='POST',type='application/json')=>new Request('https://review.invalid/api/scale-paid-check',{method,headers:{'Content-Type':type},...(method==='GET'?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});

test('payback hand calculations: sample, same direction, opposite side of the chosen line',()=>{
  for(const [cac,arr,margin,before,after,pass] of [[35000,36000,.7,35/3,50/3,false],[6000,24000,.75,3,4,true],[48000,24000,.5,24,48,false]]){
    const r=run('payback',{paid_cac:cac,average_arr:arr,gross_margin:margin,payback_line_months:12,customers:undefined});
    assert.ok(Math.abs(r.payback.before_margin_months-before)<1e-10);assert.ok(Math.abs(r.payback.after_margin_months-after)<1e-10);assert.equal(r.line_pass,pass);assert.notEqual(r.verdict,'SCALE');
  }
  assert.equal(run('payback',{gross_margin:undefined}).payback.before_margin_months.toFixed(1),'11.7');
});
test('route preserves the connector row checks, counts, cohorts, verdicts and money byte for byte',async()=>{
  const direct=generateScalePaidCheck(sample).structuredContent;
  const connector=await createServer()._requestHandlers.get('tools/call')({method:'tools/call',params:{name:'scale_paid_check',arguments:sample}});
  const response=await handler(request({measure:'stay',input:{...sample,average_arr:36000}}));assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  const {result:r}=await response.json();
  for(const key of ['echo','rejected_rows','pending_customers','paused_customers','cohorts','stop_rule','window','groups','money']){
    assert.deepEqual(r[key],direct[key],key);assert.deepEqual(r[key],connector.structuredContent[key],key);
  }
  assert.equal(JSON.stringify(r),JSON.stringify(run('stay')));
});
test('the same row checks reject bad rows and leave them out of expansion too',()=>{
  const input={customers:[...sample.customers,{id:'bad',signed:'2024-01-01',segment:'New group',monthly_fee:0,current_monthly_fee:9000}]};
  const r=run('value',{...input,required_ratio:2});assert.equal(r.echo.rows_rejected,1);assert.equal(r.echo.rows_used,56);assert.equal(r.value.find(g=>g.name==='New group'),undefined);
});
test('two hand worked rows: current recurring fees, one time fees, and a fee reduction',()=>{
  const r=run('value',{as_of:'2025-04-15',customers:[{id:'A1',signed:'2024-01-15',segment:'Group A',monthly_fee:100,current_monthly_fee:150,one_time_fee:200},{id:'A2',signed:'2024-04-15',segment:'Group B',monthly_fee:200,current_monthly_fee:180,one_time_fee:100}],paid_cac:500,gross_margin:.5,required_ratio:2});
  const a=r.value.find(v=>v.name==='Group A'),b=r.value.find(v=>v.name==='Group B');
  assert.equal(a.starting_capped_value,750);assert.equal(a.expansion_value,375);assert.equal(a.one_time_fee_margin,100);assert.equal(a.total_value,1225);assert.equal(a.ratio,2.45);
  assert.equal(b.starting_capped_value,1500);assert.equal(b.expansion_value,-150);assert.equal(b.one_time_fee_margin,50);assert.equal(b.total_value,1400);assert.equal(b.ratio,2.8);
  assert.equal(r.value[0].total_value,1312.5);assert.equal(r.value[0].verdict,'NO_VERDICT');
});
test('value ratio has no default, accepts own ratio, and refuses zero or negative optional amounts',()=>{
  for(const required_ratio of [undefined,0,-2,NaN])assert.throws(()=>run('value',{required_ratio}));
  assert.equal(run('value',{required_ratio:1.2}).value[0].required_ratio,1.2);
  for(const row of [{one_time_fee:-1},{current_monthly_fee:0},{current_monthly_fee:-1}])assert.throws(()=>run('value',{required_ratio:2,customers:[{...sample.customers[0],...row}]}));
});
test('payback checkpoint uses whole billing months and excludes unreached customers',()=>{
  const r=run('stay',{paid_cac:35000,average_arr:36000,gross_margin:undefined});
  assert.equal(r.payback_checkpoints[0].months,12);assert.equal(r.payback_checkpoints[0].reached,56);
  const s=run('stay',{paid_cac:75000,average_arr:36000,gross_margin:undefined});assert.equal(s.payback_checkpoints[0].months,25);assert.equal(s.payback_checkpoints[0].reached,0);assert.equal(s.payback_checkpoints[0].share,null);
});
test('missing money never yields Scale and example lines stay explicit',()=>{
  const r=run('stay',{gross_margin:undefined,paid_cac:undefined,average_arr:undefined});assert.equal(r.money.enabled,false);assert.ok(r.groups.every(g=>g.verdict!=='SCALE'));assert.equal(r.notes.length,2);
  assert.equal(run('stay',{stop_line:.75,payback_line_months:18}).notes.length,0);
});
test('exactly four fixed role lines for every verdict; no model or user prose in role text',()=>{
  for(const roles of Object.values(ROLE_TEXT)){
    assert.deepEqual(Object.keys(roles),['founder','cmo','performance','finance']);
    for(const text of Object.values(roles))assert.doesNotMatch(text,/[\u2013\u2014!]|\bCRO\b|demand generation|customer success|_/i);
  }
});
test('HTTP boundary handles exact JSON, equivalent content type and opposite malformed input',async()=>{
  assert.equal((await handler(request({measure:'payback',input:{paid_cac:1000,average_arr:12000}}))).status,200);
  assert.equal((await handler(request({measure:'payback',input:{paid_cac:1000,average_arr:12000}},'POST','application/json; charset=utf-8'))).status,200);
  for(const body of ['{',null,[],{measure:'other'}, {measure:'stay',input:{...sample,as_of:'2025-02-30'}}])assert.equal((await handler(request(body))).status,422);
  assert.equal((await handler(request({},'GET'))).status,405);assert.equal((await handler(request({},'POST','text/plain'))).status,415);
  assert.equal((await handler(request(' '.repeat(MAX_BYTES+1)))).status,413);
});

// The nine seller verticals used by the existing owner suite. Text is evidence,
// not a source of guessed customer counts, margin or payback.
const verticals=[
 ['logistics tech',['Shipment alerts for dispatch teams','Delivery exception alerts for dispatchers','We do not provide shipment alerts'],['Dispatchers leave because delivery alerts arrive late','Customers leave when shipment notices arrive too late','Customers stay because delivery alerts arrive on time']],
 ['fintech',['Recurring payment collection for lenders','Loan repayment collection for lenders','We do not collect loan payments'],['Borrowers leave because repayments are posted late','Customers leave when payment posting is delayed','Customers stay because repayments post on time']],
 ['SaaS',['Subscription reporting for finance teams','Recurring revenue reports for finance teams','We do not provide subscription reports'],['Finance teams leave because reports miss refunds','Customers leave when refund figures are missing','Customers stay because reports include refunds']],
 ['vertical SaaS',['Appointment scheduling for clinics','Clinic appointment booking for reception teams','We do not schedule clinic appointments'],['Clinics leave because reminders fail to reach patients','Customers leave when appointment notices are missed','Clinics stay because reminders reach patients']],
 ['AI native',['Document extraction agents for claims teams','Automated claim document extraction for reviewers','We do not extract claim documents'],['Reviewers leave because fields are extracted incorrectly','Customers leave when claim fields are read wrongly','Reviewers stay because extracted fields are accurate']],
 ['ITeS',['Managed payroll processing for employers','Payroll operations service for employers','We do not process payroll'],['Employers leave because payroll corrections take weeks','Customers leave when wage corrections are delayed','Employers stay because payroll corrections are prompt']],
 ['telecom',['Business connectivity for regional offices','Office connectivity service for business branches','We do not connect business offices'],['Offices leave because outages interrupt calls','Customers leave when network failures disrupt calls','Offices stay because calls are uninterrupted']],
 ['software',['Database monitoring for engineering teams','Database health monitoring for engineers','We do not monitor databases'],['Engineers leave because alerts miss slow queries','Customers leave when slow query notices are absent','Engineers stay because alerts catch slow queries']],
 ['cybersecurity',['Incident triage for security teams','Security incident review for analysts','We do not triage security incidents'],['Analysts leave because false alerts consume their shift','Customers leave when noisy alerts waste analyst time','Analysts stay because alerts are precise']],
];
for(const [vertical,products,reasons]of verticals)for(const field of ['product','churn_reasons'])test(`${vertical}: ${field} exact, same meaning and opposite sentences`,()=>{
  const inputs=field==='product'?products:reasons;
  const baseline=run('stay');
  for(const sentence of inputs){const r=run('stay',{[field]:sentence});for(const key of ['echo','groups','money','cohorts'])assert.deepEqual(r[key],baseline[key]);assert.equal(JSON.stringify(r),JSON.stringify(run('stay',{[field]:sentence})));}
});
