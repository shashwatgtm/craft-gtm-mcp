import test from 'node:test';import assert from 'node:assert/strict';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const {analyzeCRAFTDimensions:read}=await import(home+'/dist/utils.js');
const rules=[['character','Owner: the sales lead','The person in charge is the revenue lead','No owner is assigned'],['result','Goal: increase qualified trials','We aim to increase qualified trials','No goal is agreed'],['artifact','Build a dashboard','Put together written instructions','We will not build a dashboard'],['frame','Budget: funds approved','Money set aside for this work','No budget is available'],['timeline','By Q3','During the third quarter of 2027','Not in Q3']];
for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])for(const [dim,exact,same,opposite] of rules)test('C12 '+v+' '+dim+' counts affirmed facts only',()=>{
 for(const t of [exact,same]){const r=read(v+' plan\n'+t)[dim];assert.ok(r.score>0,t);assert.ok(r.evidence.some(e=>e.includes(t)),JSON.stringify(r))}
 assert.equal(read(v+' plan\n'+opposite)[dim].score,0,opposite);
});
