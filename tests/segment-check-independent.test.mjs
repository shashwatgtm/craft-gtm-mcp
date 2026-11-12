import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {generateSegmentCheck,readPricingUnit,readSeatCutBasis,retainedYears,grossProfitPerCacDollar,leadChangeYear,cacWhereLeadIsGone} from '../dist/segment-check.js';
import {createServer,listedTools} from '../dist/server.js';

const BASIS = 'Additional seat cuts not included in reported retention. Affected revenue is a share of opening ARR. Expansion revenue stays unchanged.';
const SAME_BASIS = 'Future seat reductions are outside our reported retention. Revenue at risk is measured against beginning ARR. Expansion stays fixed.';
const INCLUDED = 'These seat cuts are already included in reported retention. Affected revenue is a share of opening ARR. Expansion revenue stays unchanged.';
const base = (s = {}, extra = {}) => ({product:'Dispatch planning for regional carriers',gross_margin_percent:75,confirmed:{segment_split:true,win_rate:true,seat_cut:true},segments:[{name:'Regional carriers',acv:48000,cac:30000,gross_retention_percent:88,net_retention_percent:104,logo_retention_percent:90,pricing_unit:'seat',what_customers_can_cut:BASIS,seat_cut_percent:20,arr_share_cutting_percent:50,seats_per_account:40,work_units_per_seat_per_year:2500,...s}],...extra});
const result = (s={},extra={}) => generateSegmentCheck(base(s,extra));
const seg = (s={},extra={}) => {const r=result(s,extra);assert.ok(!r.isError,r.text);return r.structuredContent.segments[0];};
const call = args => createServer()._requestHandlers.get('tools/call')({method:'tools/call',params:{name:'segment_and_seat_cut_check',arguments:args}});
const close = (a,b) => {assert.equal(typeof a,'number');assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);};

// Every sector has an exact current contract, an equivalent contract and the opposite billing unit.
const sectors = [
 ['logistics tech','We bill per dispatcher seat; shipments are unlimited','Seat based today, moving to usage next year','Seat pricing is not used; we bill per shipment'],
 ['fintech','We bill per transaction; seats are unlimited','We charge for each successful payment, with seat management included','Transactions are unlimited; we charge per analyst seat'],
 ['vertical SaaS','We bill per stylist seat; bookings are unlimited','Each stylist needs a paid licence, with booking management included','Stylist seats are free; we bill per booking'],
 ['AI native','We bill per AI agent resolution','We charge for each task the AI agent completes','Resolutions are unlimited; we bill per named user'],
 ['ITeS','We bill per agent seat; tickets are unlimited','We charge by headcount, with ticket management included','Agent seats are not charged; we bill per ticket'],
 ['telecom','We bill per SIM connected; seats are unlimited','We charge by the gigabyte, with user management included','Data usage is not charged; we bill per operator seat'],
 ['cybersecurity','We bill per analyst seat; endpoints are unlimited','We charge for each named analyst, with endpoint management included','Analyst licences are free; we bill per endpoint'],
 ['software','We bill per developer seat; build minutes are unlimited','Every engineer needs a paid licence, with usage reporting included','Developer seats are free; we bill per build minute'],
 ['SaaS','We bill per user; API calls are unlimited','We charge for every person who has a login, with usage reporting included','User licences are free; we bill per API call'],
];
for (const [sector,exact,same,opposite] of sectors) test(`pricing adversarial exact, same meaning and opposite: ${sector}`,async()=>{
 const unit = ['fintech','AI native','telecom'].includes(sector)?'usage':'seat';
 for(const [sentence,expected] of [[exact,unit],[same,unit],[opposite,unit==='seat'?'usage':'seat']]){
  assert.equal(readPricingUnit(sentence),expected,sentence);
  const input=base({pricing_unit:undefined,pricing_unit_in_writing:sentence});
  const r=await call(input);assert.ok(!r.isError,JSON.stringify(r));
  const s=r.structuredContent.segments[0];assert.equal(s.pricing_unit.read_as,expected,sentence);
  assert.equal(s.seat_cut.gross_retention_after_percent,expected==='seat'?78:88,sentence);
 }
});

test('pricing mentions, uncertain plans, free units and questions never invent a current contract',()=>{
 for(const sentence of ['Our usage dashboard helps customers manage seats','Do we charge per seat or per transaction?','We may charge per seat next year','We are moving from per seat to per API call','We switched from seats to usage but reverted to per seat','We bill a flat platform fee','We charge per AI agent','We bill on usage, not without seats','We bill per seat unless usage rises','Billed by hours worked','We sell a block of credits']) assert.equal(readPricingUnit(sentence),'unclear',sentence);
 for(const sentence of ['We billed per seat last year; now we bill per shipment','Seat pricing was retired; we bill per shipment','We switched from per seat to usage','We moved from seat pricing to usage billing','We charge per shipment with seat management included','We license software per shipment','We licence the platform per shipment','We bill per shipment and manage seats','We bill per shipment, with seat management included','Customers can cut seats, but we bill per shipment']) assert.equal(readPricingUnit(sentence),'usage',sentence);
 for(const sentence of ['We charge per seat with unlimited usage','We bill for seats and include usage analytics','We bill per seat, but the usage fee is waived','We bill per seat and no transaction fee']) assert.equal(readPricingUnit(sentence),'seat',sentence);
 for(const sentence of ['We charge per seat plus per API call','Not only per seat but also per API call','We charge per seat plus a platform fee']) assert.equal(readPricingUnit(sentence),'hybrid',sentence);
 for(const sentence of ['We do not charge per seat and per user','Neither seats nor usage: a fixed yearly subscription','We never bill by headcount']) assert.equal(readPricingUnit(sentence),'unclear',sentence);
});

test('all three pauses and strict booleans are honest caller attestations, not proof of a human yes',async()=>{
 for(const split of [false,true]) for(const win of [false,true]) for(const cut of [false,true]){
  const input=base({win_rate_percent:25,year_one_customer_target:24},{confirmed:{segment_split:split,win_rate:win,seat_cut:cut}});
  const r=await call(input),out=r.structuredContent;
  assert.equal(out.confirmation_evidence,'caller_attestation_only');
  assert.match(r.content[0].text,/cannot verify that a person said yes/);
  if(!split){assert.equal(out.stage,'waiting_for_confirmation');assert.equal(out.segments[0].seat_cut,undefined);continue;}
  assert.equal(out.segments[0].seller_capacity.opportunities_for_target,win?96:null);
  assert.equal(out.segments[0].seat_cut.state,cut?'worked':'waiting');
 }
 for(const value of ['true',1,'yes']){
  const r=await call(base({}, {confirmed:{segment_split:value,win_rate:value,seat_cut:value}}));
  assert.equal(r.structuredContent.stage,'waiting_for_confirmation');
 }
});

test('retention basis: exact and equivalent fresh cut work; cuts already counted are never counted again',()=>{
 for(const sentence of [BASIS,SAME_BASIS]){
  assert.deepEqual(readSeatCutBasis(sentence),{additional:true,openingArr:true,expansionUnchanged:true,alreadyIncluded:false});
  const s=seg({what_customers_can_cut:sentence}).seat_cut;
  close(s.retention_points_lost,10);close(s.gross_retention_after_percent,78);close(s.net_retention_after_percent,94);
  // Gross 78 + unchanged expansion 16 = net 94. The loss was not subtracted twice from net.
  close(s.gross_retention_after_percent+16,s.net_retention_after_percent);
 }
 for(const sentence of [INCLUDED,'Current retention already includes these seat cuts. Affected revenue is a share of opening ARR. Expansion remains constant.','Seats at renewal']){
  const r=result({what_customers_can_cut:sentence});const s=r.structuredContent.segments[0].seat_cut;
  assert.equal(s.retention_points_lost,null);assert.equal(s.gross_retention_after_percent,null);assert.equal(s.net_retention_after_percent,null);
  assert.equal(s.renewal_per_account.on_your_pricing,38400); // Separate prospective per-account scenario still works.
  assert.match(r.text,/Missing/);assert.doesNotMatch(r.text,/-\d+%|null%/);
 }
});

test('retention cohort denominator and expansion assumptions cannot be supplied by missing, opposite or uncertain text',()=>{
 for(const sentence of [BASIS.replace('opening ARR','current ARR'),BASIS.replace('share of opening ARR','not a share of opening ARR'),BASIS.replace('Additional seat cuts','Could additional seat cuts'),BASIS.replace('not included in','not outside'),BASIS.replace('Additional seat cuts','There are no additional cuts')]){
  const s=seg({what_customers_can_cut:sentence}).seat_cut;assert.equal(s.gross_retention_after_percent,null);assert.equal(s.net_retention_after_percent,null);
 }
 for(const sentence of [BASIS.replace('Expansion revenue stays unchanged.',''),BASIS.replace('Expansion revenue stays unchanged.','Expansion revenue is not unchanged.'),BASIS.replace('Expansion revenue stays unchanged.','Expansion revenue might stay unchanged.')]){
  const s=seg({what_customers_can_cut:sentence}).seat_cut;assert.equal(s.gross_retention_after_percent,78);assert.equal(s.net_retention_after_percent,null);assert.equal(s.gates.net_after,null);
 }
});

test('retention cannot become negative; exact and equivalent boundary gates still work',()=>{
 for(const input of [{gross_retention_percent:5,net_retention_percent:10,seat_cut_percent:50,arr_share_cutting_percent:100},{gross_retention_percent:8,net_retention_percent:12,seat_cut_percent:40,arr_share_cutting_percent:50}]){
  const r=result(input),s=r.structuredContent.segments[0].seat_cut;assert.equal(s.retention_points_lost,null);assert.equal(s.gross_retention_after_percent,null);assert.equal(s.net_retention_after_percent,null);assert.match(r.text,/cut exceeds what remains/);assert.doesNotMatch(r.text,/-\d+%/);
 }
 for(const [gate,expected] of [[78,'pass'],[77.999,'pass'],[78.001,'fail']]) assert.equal(seg({gross_retention_gate_percent:gate}).seat_cut.gates.gross_after,expected);
 const s=seg({gross_retention_percent:10,net_retention_percent:10}).seat_cut;assert.equal(s.gross_retention_after_percent,0);assert.equal(s.net_retention_after_percent,0);
});

test('literal small percentages and zero losses are data; invalid percentages and zero win rates are refused',async()=>{
 for(const percent of [0,0.5,1,100]){
  const r=await call(base({seat_cut_percent:percent,arr_share_cutting_percent:1,logo_retention_percent:0.89}));assert.ok(!r.isError,JSON.stringify(r));
  const s=r.structuredContent.segments[0];close(s.seat_cut.retention_points_lost,percent/100);assert.equal(s.retention_and_payback.logo_retention_percent,0.89);
 }
 for(const percent of [-1,101]) assert.equal(result({seat_cut_percent:percent}).isError,true);
 for(const percent of [0.5,1,100]) assert.equal(seg({win_rate_percent:percent,year_one_customer_target:1}).seller_capacity.opportunities_for_target,100/percent);
 assert.equal(result({win_rate_percent:0}).isError,true);
 for(const percent of [0,0.5,1,100]) assert.ok(!result({}, {gross_margin_percent:percent}).isError);
});

test('zero demand, no selling window and zero margin are distinguished from missing input',()=>{
 const seller={seller_ramp_months:6,sales_cycle_days:240,ramped_deals_per_seller_per_year:12,seller_loaded_cost_per_year:180000,year_one_customer_target:24,win_rate_percent:25,monthly_qualified_demand:0};
 const r=result(seller);const c=r.structuredContent.segments[0].seller_capacity;
 assert.equal(c.selling_months_year_one,0);assert.equal(c.deals_per_seller_year_one,0);assert.equal(c.acv_booked_per_seller_year_one,0);assert.equal(c.sellers_for_target,null);assert.equal(c.sellers_demand_carries,0);assert.equal(c.wins_from_demand_year_one,0);
 assert.match(r.text,/No payback in this plan: no deals close/);assert.match(r.text,/target cannot be met/);
 const active=seg({...seller,seller_ramp_months:0,sales_cycle_days:0});assert.equal(active.seller_capacity.deals_per_seller_year_one,12);assert.equal(active.seller_capacity.sellers_for_target,2);
 const missing=seg({seller_ramp_months:0,sales_cycle_days:0});assert.equal(missing.seller_capacity.deals_per_seller_year_one,null);
 const zero=seg({cac:0},{gross_margin_percent:0,tracks_expansion:true});assert.equal(zero.retention_and_payback.payback_months_on_cac_and_arr,0);assert.equal(zero.retention_and_payback.payback_months_on_gross_profit,null);assert.equal(zero.retention_and_payback.gross_profit_per_cac_dollar.on_gross_retention,null);
});

test('a sizing first draft never silently becomes a hiring target',()=>{
 const seller={sizing_year_one_customers:100,seller_ramp_months:0,sales_cycle_days:0,ramped_deals_per_seller_per_year:12,win_rate_percent:25};
 const a=seg(seller).seller_capacity;assert.equal(a.year_one_customer_target,null);assert.equal(a.sellers_for_target,null);assert.equal(a.cac_budget_for_target,null);
 for(const target of [24,36]){const c=seg({...seller,year_one_customer_target:target}).seller_capacity;assert.equal(c.year_one_customer_target,target);assert.equal(c.sellers_for_target,target/12);assert.equal(c.opportunities_for_target,target*4);}
});

test('usage rates retain micro prices, zero run costs and loss making prices; zero prices do not divide by zero',()=>{
 // 8 seats x 50 million work units = 400 million units; $9,600 lost / 400m = $0.000024, profit floor = $0.000018.
 const s={work_units_per_seat_per_year:50000000,usage_price_per_unit:0.00003,run_cost_per_unit:0};
 const r=result(s),c=r.structuredContent.segments[0].seat_cut;
 close(c.usage_rate_that_recovers_revenue,0.000024);close(c.usage_rate_that_keeps_gross_profit_before_run_cost,0.000018);
 assert.match(r.text,/\$0\.000024 a unit recovers/);assert.equal(c.usage_margin_after_run_cost,1);
 assert.equal(seg({...s,run_cost_per_unit:0.00006}).seat_cut.usage_margin_after_run_cost,-1);
 const free=seg({...s,usage_price_per_unit:0}).seat_cut;assert.equal(free.revenue_at_your_usage_price,0);assert.equal(free.usage_margin_after_run_cost,null);
});

test('hand-worked later-years helpers handle flat, shrinking and growing cohorts, ties and CAC thresholds',()=>{
 for(const [r,years,sum] of [[1,3,3],[0.5,3,1.75],[1.5,3,4.75],[0,3,1]]){
  close(retainedYears(r,years),sum);close(grossProfitPerCacDollar(20000,0.5,10000,r,years),sum);
  close(cacWhereLeadIsGone(20000,0.5,r,years,2),5000*sum);
 }
 assert.deepEqual(leadChangeYear(y=>2*y,y=>y*y),{firstLeader:'a',changeYear:3});
 assert.deepEqual(leadChangeYear(y=>y,y=>y),{firstLeader:'tie',changeYear:null});
 const r=result({}, {tracks_expansion:false});assert.equal(r.structuredContent.comparison.later_years,null);assert.doesNotMatch(r.text,/Later years/);
 const shown=result({}, {tracks_expansion:true});assert.match(shown.text,/no discounting/);assert.doesNotMatch(shown.text+JSON.stringify(shown.structuredContent),/lifetime|\bLTV\b/i);
});

test('missing values never produce a reassuring safety conclusion or a fake zero',()=>{
 for(const s of [{name:'Carriers'},{name:'Carriers',gross_retention_percent:88},{name:'Carriers',net_retention_percent:104}]){
  const r=generateSegmentCheck({product:'Dispatch planning',confirmed:{segment_split:true,seat_cut:true},segments:[s]});
  assert.match(r.text,/Missing does not establish that pricing is safe/);assert.doesNotMatch(r.text,/null%|NaN|Infinity|gross stayed at 0%/);
 }
 const r=result({gross_retention_percent:undefined});assert.doesNotMatch(r.text,/gross stayed at 0%/);assert.match(r.text,/Missing until gross retention is supplied/);
});

test('numeric strings use the shared number reader, bad numbers and malformed segments fail in plain words',async()=>{
 const r=await call(base({acv:'48,000',cac:'30,000',seat_cut_percent:'20',gross_retention_percent:'88'}));assert.ok(!r.isError);assert.equal(r.structuredContent.segments[0].retention_and_payback.payback_months_on_cac_and_arr,7.5);
 const wrong=await call(base({logo_retention_percent:'89%'}));assert.equal(wrong.isError,true);assert.match(wrong.content[0].text,/digits only/);
 for(const acv of [NaN,Infinity,-100]) assert.equal(result({acv}).isError,true);
 for(const segment of [null,12,'Carriers',[]]) assert.equal(generateSegmentCheck({product:'Dispatch planning',segments:[segment]}).isError,true);
 for(const input of [{acv:1e308,seat_cut_percent:20,year_one_customer_target:1e308,sizing_tam:1e308},{year_one_customer_target:1e308}]) {const tooLarge=result(input);assert.equal(tooLarge.isError,true);assert.match(tooLarge.text,/too large/);}
});

test('all existing tool definitions and all nine answers remain byte identical to the builder baseline',async()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/segment-check/existing-tool-responses.json',import.meta.url)));
 assert.equal(new Set(fixture.cases.map(c=>c.tool)).size,9);
 const frozen=JSON.parse(readFileSync(new URL('./fixtures/release-production-tools.json',import.meta.url))).tools_list.tools;
 assert.deepEqual(listedTools.filter(t=>t.name!=='segment_and_seat_cut_check'),frozen.filter(t=>t.name!=='segment_and_seat_cut_check'));
 for(const c of fixture.cases){const r=await createServer()._requestHandlers.get('tools/call')({method:'tools/call',params:{name:c.tool,arguments:structuredClone(c.args)}});assert.equal(createHash('sha256').update(JSON.stringify(r)).digest('hex'),c.sha256,c.tool);}
});


test('zero base loss with missing affected share never prints an invented percentage',()=>{
 for(const s of [{pricing_unit:'usage',arr_share_cutting_percent:undefined},{seat_cut_percent:0,arr_share_cutting_percent:undefined},{arr_share_cutting_percent:0}]) {
  const r=result(s);assert.doesNotMatch(r.text,/NaN|Infinity|null%/);assert.equal(r.structuredContent.segments[0].seat_cut.retention_points_lost,0);
 }
});

test('zero accounts, target, buyer saving and seller cost preserve their literal meaning',()=>{
 for(const s of [{accounts:0,year_one_share_percent:0},{year_one_customer_target:0,seller_ramp_months:6,sales_cycle_days:240,ramped_deals_per_seller_per_year:12},{buyer_cost_per_seat_per_year:0},{seller_loaded_cost_per_year:0,seller_ramp_months:0,sales_cycle_days:0,ramped_deals_per_seller_per_year:12}]) assert.ok(!result(s).isError);
 assert.equal(seg({year_one_customer_target:0}).seller_capacity.sellers_for_target,0);
 assert.equal(seg({seller_loaded_cost_per_year:0,seller_ramp_months:0,sales_cycle_days:0,ramped_deals_per_seller_per_year:12}).seller_capacity.payback_on_seller_cost_months,0);
 assert.equal(seg({buyer_cost_per_seat_per_year:0}).seat_cut.buyer_saving,0);
 assert.equal(seg({buyer_cost_per_seat_per_year:0}).seat_cut.share_of_buyer_saving,null);
});

test('retention signal extracts carry the supplied industry without changing the playbook',()=>{
 const extract=industry=>generateSegmentCheck({product:'Operations platform',industry,confirmed:{segment_split:true,seat_cut:true},segments:[{name:'Operations teams',logo_retention_percent:89,monthly_logo_churn_percent:1,pricing_unit:'seat'}]}).text;
 for(const industry of ['telecom','telecommunications']) assert.match(extract(industry),/service quality and repair time/);
 assert.match(extract('cybersecurity'),/findings or threats handled/);
 assert.doesNotMatch(extract('cybersecurity'),/service quality and repair time/);
});

test('later-years comparison never claims a leader through a tied year',()=>{
 for(const scale of [1,2]){
  const r=generateSegmentCheck({product:'Dispatch planning',gross_margin_percent:50,tracks_expansion:true,confirmed:{segment_split:true},segments:[{name:'Large carriers',acv:20000*scale,cac:5000*scale,gross_retention_percent:0,net_retention_percent:0},{name:'Regional carriers',acv:20000*scale,cac:10000*scale,gross_retention_percent:100,net_retention_percent:100}]});
  assert.match(r.text,/Regional carriers first leads at year 3. Any intervening ties do not count as a lead/);
  assert.doesNotMatch(r.text,/Large carriers.*through year 2/);
 }
 const same=result({}, {tracks_expansion:true});assert.doesNotMatch(same.text,/first leads at year/);
});


test('contradictory gross and net retention remain evidence, but cannot drive projections or expansion',()=>{
 for(const [gross,net] of [[92,88],[91,87]]){
  const r=result({gross_retention_percent:gross,net_retention_percent:net},{tracks_expansion:true});
  const s=r.structuredContent.segments[0];
  assert.equal(s.retention_and_payback.gross_retention_percent,gross);assert.equal(s.retention_and_payback.net_retention_percent,net);
  assert.equal(s.retention_and_payback.expansion_points,null);
  assert.equal(s.retention_and_payback.gross_profit_per_cac_dollar.on_net_retention,null);
  assert.equal(s.seat_cut.gross_retention_after_percent,null);assert.equal(s.seat_cut.net_retention_after_percent,null);assert.equal(s.seat_cut.gates.net_before,null);
  assert.match(r.text,/net retention .* is below gross retention/);assert.doesNotMatch(r.text,/Keep new acquisition spend off/);
 }
 const s=seg({gross_retention_percent:88,net_retention_percent:104});assert.equal(s.retention_and_payback.expansion_points,16);assert.equal(s.seat_cut.net_retention_after_percent,94);
});
