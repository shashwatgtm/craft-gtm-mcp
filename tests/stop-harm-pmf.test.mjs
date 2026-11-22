import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePMFScorecard } from '../dist/pmf-scorecard.js';
const base = {product: 'B2B subscription product', target_market: 'enterprise_saas', time_in_market: '1_2_years'};
const pmf = (metrics, args = {}) => generatePMFScorecard({...base, current_metrics: metrics, ...args});
const status = text => {
  const m = text.match(/\| \*\*[^\n]+\*\* \| \*\*[^\n]+\/10\*\* \| ([^|]+) \|/);
  assert.ok(m, 'Verdict row must be present'); return m[1].trim();
};
for (const metrics of ['NPS 60', 'NRR 112%', 'annual churn 2.5%', 'NRR 118%', 'NRR 92%', 'annual churn 4%', 'NPS 65', '52% very disappointed']) {
  test(`S3 T1-T4: one dimension cannot grant fit (${metrics})`, () => {
    assert.equal(status(pmf(metrics)), 'Too early to call');
  });
}
const strong = 'NRR 121%, monthly churn 0.5%, NPS 64, activation 80%, LTV:CAC 5x';
test('S3 T5-T6: fewer than 30 customers never grants fit', () => {
  for (const count of ['14 customers, ARR $180k', 'nine cybersecurity customers', '29 customers']) {
    assert.equal(status(pmf(strong+', '+count)), 'Too early to call');
  }
});
test('S3 T7-T9: the full 35-45 survey band has one verdict and a borderline label', () => {
  const verdicts = new Set();
  for (let pct = 35; pct <= 45; pct++) {
    const text = pmf(strong+`, ${pct}% very disappointed`);
    assert.match(text, /BORDERLINE/); verdicts.add(status(text));
  }
  assert.equal(verdicts.size, 1); assert.ok(!verdicts.has('No'));
});
test('S4 T1-T2: contradictory churn and annual retention prevent a verdict', () => {
  for (const [monthly, annual, loss] of [[2,95,'21.5'],[3,90,'30.6']]) {
    const text = pmf(`monthly churn ${monthly}%, annual retention ${annual}%`);
    assert.match(text, /These two facts disagree/); assert.equal(status(text), 'No verdict');
    assert.ok(text.includes(loss+'%'));
  }
});
test('S4 T3: pre-launch recurring revenue is a contradiction', () => {
  assert.match(pmf('ARR $1.2M, '+strong, {time_in_market: 'pre_launch'}), /These two facts disagree/);
});
test('S4 T4-T5: GRR is scored independently and NRR below 100 is capped', () => {
  const pair = pmf('GRR 81%, NRR 96%');
  assert.match(pair, /Gross Revenue Retention \| 81%/);
  assert.doesNotMatch(pair, /Gross Revenue Retention \| NOT PROVIDED/);
  assert.match(pmf('NRR 92%'), /Net Revenue Retention \| 92% \| 5\/10[^\n]+BELOW 100%/);
});
test('S4 T6-T7: monthly churn above 1.5% is not excellent and shows annual loss', () => {
  for (const [target_market, pct, yearly] of [['telecom',1.9,'20.6'],['marketplace',4,'38.7']]) {
    const text = pmf(`monthly churn ${pct}%`, {target_market});
    assert.ok(text.includes(yearly+'%')); assert.doesNotMatch(text, /\| Monthly Churn[^\n]+\| EXCELLENT \|/i);
  }
});
test('S4 T8: short and long retention names receive identical scoring', () => {
  const a = pmf('NRR 104%, GRR 88%'), b = pmf('net revenue retention is 104%, gross retention is 88%');
  assert.doesNotMatch(b, /Cannot score these metrics/); assert.equal(status(a), status(b));
  const rows = text => text.split('\n').filter(line => /^\|.*\|$/.test(line));
  assert.deepEqual(rows(a), rows(b));
});
test('S3-S4 preserved: deterministic output and plain digit ratio', () => {
  const first = pmf(strong); assert.equal(pmf(strong), first); assert.equal(pmf(strong), first);
  assert.match(pmf('LTV USD 1500000, CAC USD 420000'), /3\.6x/);
  assert.match(pmf('LTV 1500000, CAC 420000'), /currency units are not supplied/);
});
