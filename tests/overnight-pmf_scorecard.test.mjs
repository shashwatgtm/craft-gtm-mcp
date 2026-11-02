import {checkReader} from './overnight-reader-helper.mjs';
checkReader("pmf_scorecard", [{"index": 0, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 1, "key": "current_metrics", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 2, "key": "target_market", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}, {"index": 3, "key": "current_metrics", "a": "The retention measure is six delayed approvals in one reviewed batch.", "b": "The retention measure is nine delayed approvals in one reviewed batch."}, {"index": 4, "key": "product", "a": "The supplied operational observation is six delayed approvals in one reviewed batch.", "b": "The supplied operational observation is nine delayed approvals in one reviewed batch."}]);

import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePMFScorecard} from '../dist/pmf-scorecard.js';
const pmfArgs={product:'Workflow software',target_market:'enterprise_saas'};
test('Overnight PMF: logo and revenue retention keep their supplied basis',()=>{
 const logo=generatePMFScorecard({...pmfArgs,current_metrics:'Annual logo retention: 78%'});assert.match(logo,/### 4. Logo Retention/);assert.match(logo,/\| Logo Retention \| 78%/);assert.doesNotMatch(logo,/### 4. Revenue Retention/);
 const net=generatePMFScorecard({...pmfArgs,current_metrics:'NRR: 120%'});assert.match(net,/Net Revenue Retention \| 120%/);
 const gross=generatePMFScorecard({...pmfArgs,current_metrics:'Gross revenue retention: 90%'});assert.match(gross,/Gross Revenue Retention \| 90%/);
});
test('Overnight PMF: equal numbers with different retention bases are not merged',()=>{
 const s=generatePMFScorecard({...pmfArgs,current_metrics:'Logo retention: 90%; NRR: 90%'});assert.match(s,/Cannot score/);assert.match(s,/different retention bases/);
});
