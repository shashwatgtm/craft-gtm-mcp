import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {capacityCheck} from '../dist/plan-capacity.js';
const exact='Customer target: 12 paid customers. The team can run six demos weekly. Current conversion from demo to sale is 10 percent across 20 completed demos. Product can onboard three accounts monthly.';
test('supplied customer target is reconciled with demo and onboarding capacity',()=>{
 const s=capacityCheck(exact); assert.match(s,/120 completed demos/);assert.match(s,/20 selling weeks/);assert.match(s,/4 onboarding months/);assert.match(s,/do not add them/);assert.match(s,/No completion date is inferred/);
});
test('equivalent words and digits preserve the scenario',()=>{
 const s=capacityCheck('Our goal is twelve paid customers. Weekly demo capacity is 6. Ten percent of the 20 completed demos became sales. We onboard 3 accounts per month.');
 assert.match(s,/120 completed demos/);assert.match(s,/20 selling weeks/);assert.match(s,/4 onboarding months/);
});
test('changed conversion changes the calculation, not only the copied statement',()=>{assert.match(capacityCheck(exact.replace('10 percent','20 percent')),/60 completed demos/);assert.match(capacityCheck(exact.replace('10 percent','20 percent')),/10 selling weeks/)});
test('zero rates and capacities do not divide by zero or invent a forecast',()=>{
 assert.match(capacityCheck(exact.replace('10 percent','0 percent')),/No finite demo volume/);
 assert.match(capacityCheck(exact.replace('six demos','zero demos')),/cannot reach a positive customer target/);
 assert.match(capacityCheck(exact.replace('three accounts','zero accounts')),/Resolve delivery capacity/);
});
test('denials, uncertainty and conflicting conversions suspend the calculation',()=>{
 for(const rate of ['Conversion is not 10 percent.','Conversion might be 10 percent.','Conversion is 10 percent. Conversion is 20 percent.','Conversion is between 10 and 20 percent.','Conversion is 150 percent.']){
  const s=capacityCheck(exact.replace('Current conversion from demo to sale is 10 percent across 20 completed demos.',rate));
  assert.match(s,/Required demos are not calculated/);assert.doesNotMatch(s,/120 completed demos/);
 }
});
test('per-person capacity is not silently treated as a team total',()=>{const s=capacityCheck(exact.replace('The team can run six demos weekly.','Each rep can run six demos weekly.'));assert.match(s,/Selling weeks are not calculated/);assert.doesNotMatch(s,/20 selling weeks/)});
test('missing units, negative values and missing targets do not manufacture arithmetic',()=>{
 assert.equal(capacityCheck('Customer target unknown. Conversion unknown. Capacity unknown.'),'');
 assert.doesNotMatch(capacityCheck('Customer target: -12 paid customers. Conversion is 10 percent.'),/120 completed demos/);
 assert.match(capacityCheck(exact.replace('six demos weekly','six demos')),/Selling weeks are not calculated/);
});

test('the supplied overnight launch plan produces the capacity calculation',()=>{
 const args=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url))).find(x=>x.tool==='craft_gtm_analyzer').args;
 const s=capacityCheck(args.document_content);assert.match(s,/120 completed demos/);assert.match(s,/20 selling weeks/);assert.match(s,/4 onboarding months/);
});
