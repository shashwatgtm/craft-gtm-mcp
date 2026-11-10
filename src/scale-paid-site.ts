// Site adapter only. The connector and its contract remain unchanged.
import { generateScalePaidCheck, addMonths, daysBetween, isRealDate, type ScalePaidCheckInput, type ScalePaidCustomerRow, type GroupSummary, type MoneySummary } from './scale-paid-check.js';

type Verdict = 'SCALE' | 'CAPPED_TEST' | 'HOLD' | 'NO_VERDICT';
export const ROLE_TEXT: Record<Verdict, Record<string, string>> = {
  SCALE: {
    founder: 'Approve more paid budget only for the groups that pass. Review the cohorts each quarter and stop expansion if payback crosses your line.',
    cmo: 'Keep targeting within the groups that pass. Review paid cost and customer staying power before adding budget.',
    performance: 'Increase spend only for the groups that pass. Track paid acquisition cost for each group and stop expansion if payback crosses your line.',
    finance: 'Release budget only for the groups that pass. Check the paid cost and margin inputs against billing records before approving the increase.',
  },
  CAPPED_TEST: {
    founder: 'Approve a small fixed test budget. Name who will review the evidence before any further spend.',
    cmo: 'Keep the test within a group that passes the keep line. Judge it on cost per accepted opportunity and the agreed budget cap.',
    performance: 'Set the spend cap before starting. Count accepted opportunities in the chosen group and stop at the agreed limit.',
    finance: 'Approve a fixed test cap, with a review date. Do not treat a small sample as proof that more spend will pay back.',
  },
  HOLD: {
    founder: 'Hold the paid increase for this group. Review why customers leave before approving more acquisition spend.',
    cmo: 'Keep more paid budget out of this group. Check the reasons customers leave and review the next mature cohorts.',
    performance: 'Hold the paid increase for this group. Check the targeting and the reasons customers leave before running another test.',
    finance: 'Hold the additional paid budget for this group. Check the customer counts and the payback inputs before the next review.',
  },
  NO_VERDICT: {
    founder: 'Collect more customer history before approving a paid increase. Agree when the next review will happen.',
    cmo: 'Gather enough customer history to read this group. Keep any learning budget fixed until the evidence improves.',
    performance: 'Do not increase spend from this result. Collect more customer history and agree a fixed learning budget if needed.',
    finance: 'Do not approve a paid increase from this result. Ask for enough customer history and verified cost inputs for another review.',
  },
};
const positive = (v: unknown, label: string, max = Infinity) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > max) throw new Error(`Give ${label} as a number above zero${max === 1 ? ' and at most one' : ''}.`);
  return v;
};
export function calculateScalePaidSite(raw: Record<string, unknown>) {
  if (!raw || !['payback','stay','value'].includes(String(raw.measure))) throw new Error('Choose the measure to check.');
  const measure = String(raw.measure);
  const input = (raw.input ?? {}) as Omit<ScalePaidCheckInput, 'customers'> & { average_arr?: number; required_ratio?: number; customers: (ScalePaidCustomerRow & { one_time_fee?: number; current_monthly_fee?: number })[] };
  const line = input.payback_line_months == null ? 12 : positive(input.payback_line_months, 'your payback line');
  const cac = input.paid_cac == null ? null : positive(input.paid_cac, 'paid acquisition cost');
  const arr = input.average_arr == null ? null : positive(input.average_arr, 'average annual recurring revenue');
  const margin = input.gross_margin == null ? null : positive(input.gross_margin, 'gross margin', 1);
  const payback = { paid_cac: cac, average_arr: arr, before_margin_months: cac && arr ? cac / (arr / 12) : null,
    after_margin_months: cac && arr && margin ? cac / (arr / 12 * margin) : null, line_months: line };
  const notes: string[] = [];
  if (input.payback_line_months == null) notes.push("Using Shashwat's example payback line of 12 months. This is an example, not a benchmark. Set your own line and run again.");
  if (measure === 'payback') {
    if (!cac || !arr) throw new Error('Give paid acquisition cost and average annual recurring revenue.');
    const months = payback.after_margin_months ?? payback.before_margin_months!;
    // Arithmetic alone never authorizes Scale.
    return { measure, notes, payback, verdict: months <= line ? 'CAPPED_TEST' : 'HOLD',
      line_pass: months <= line, roles: ROLE_TEXT[months <= line ? 'CAPPED_TEST' : 'HOLD'],
      scope: 'CAC and ARR payback. This does not check whether customers stay or tell you where to spend the budget.' };
  }
  if (!isRealDate(input.as_of)) throw new Error('Give a real check date in year month day order.');
  if (!['monthly','annual'].includes(input.billing_term)) throw new Error('Choose monthly or annual billing.');
  if (!Array.isArray(input.customers) || !input.customers.length || input.customers.length > 2000) throw new Error('Give between 1 and 2,000 customer rows.');
  for (const key of ['product','churn_reasons'] as const) if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 6000) throw new Error(`Give ${key === 'product' ? 'a short product description' : 'the reasons customers leave'}.`);
  if (input.win_rate_floor != null && input.win_rate_target != null && input.win_rate_floor > input.win_rate_target) throw new Error('The floor win rate cannot exceed the target win rate.');
  if (measure === 'value') {
    if (!cac || !margin) throw new Error('Give paid acquisition cost and gross margin for the value check.');
    positive(input.required_ratio, 'the value to cost ratio you require');
    for (const row of input.customers) {
      if (row.one_time_fee != null && (typeof row.one_time_fee !== 'number' || !Number.isFinite(row.one_time_fee) || row.one_time_fee < 0)) throw new Error('One time fees must be zero or a positive number.');
      if (row.current_monthly_fee != null) positive(row.current_monthly_fee, 'the current monthly fee');
    }
  }
  const calculated = generateScalePaidCheck({ ...input, interview_persona: 'Marketing operations head' });
  if (calculated.isError) throw new Error(calculated.text);
  const c = calculated.structuredContent as any;
  if (c.stop_line_is_default) notes.push("Using Shashwat's example keep line of 80% at month 12. This is an example, not a benchmark. Set your own line and run again.");
  const rejected = new Set<number>(c.rejected_rows.map((r: any) => r.index));
  const rows = input.customers.filter((_, index) => !rejected.has(index));
  // New payback checkpoint, using the connector's calendar and pending stop rules.
  const paying = (r: ScalePaidCustomerRow, date: string) => !r.stopped || daysBetween(r.stopped, input.as_of) < 90 || date < r.stopped || !!(r.resumed && r.resumed <= date);
  const canon = new Map<string,string>();
  for (const r of rows) { const label = r.segment?.trim() || 'Unsegmented'; if (!canon.has(label.toLowerCase())) canon.set(label.toLowerCase(),label); }
  const members = (name: string, kind: string) => rows.filter(r => {
    if (kind === 'all') return true;
    if (kind === 'segment') return canon.get((r.segment?.trim() || 'Unsegmented').toLowerCase()) === name;
    const a = r.monthly_starts;
    const tag = Array.isArray(a) && a.length && a.every(n => Number.isFinite(n)) ? Math.min(...a) < .5 * Math.max(...a) ? 'seasonal' : 'steady' : 'untagged';
    return tag === name;
  });
  const checkpointMonths = payback.after_margin_months ?? payback.before_margin_months;
  const checkpoint = (name: string, kind: string) => {
    if (checkpointMonths == null) return { name, kind, months: null, reached: 0, kept: 0, share: null };
    // A fraction of a month rounds up to the next complete billing month.
    const months = Math.ceil(checkpointMonths);
    const reached = members(name,kind).filter(r => addMonths(r.signed,months) <= input.as_of);
    const kept = reached.filter(r => paying(r,addMonths(r.signed,months))).length;
    return { name, kind, months, reached: reached.length, kept, share: reached.length ? kept / reached.length : null };
  };
  const result: any = { measure, notes, payback, echo: c.echo, rejected_rows: c.rejected_rows,
    pending_customers: c.pending_customers, paused_customers: c.paused_customers,
    stop_rule: c.stop_rule, cohorts: c.cohorts, window: c.window, groups: c.groups, money: c.money,
    keep_line: c.stop_line, roles: ROLE_TEXT,
    payback_checkpoints: [checkpoint('Whole list','all'),...c.groups.map((g: GroupSummary) => checkpoint(g.name,g.kind))],
    scope: 'Customer staying power with CAC and ARR payback. The keep test reads month 12. The payback checkpoint reads each customer at the next whole billing month. This does not choose where the budget goes.' };
  if (measure === 'value') {
    // Reuse the exact capped value function through its public entrypoint. Current
    // fees form a run rate scenario, not a claim about past expansion timing.
    const expanded = generateScalePaidCheck({ ...input, interview_persona: 'Marketing operations head', customers: rows.map(r => ({ ...r, monthly_fee: r.current_monthly_fee ?? r.monthly_fee })) }).structuredContent as any;
    const valueFor = (name: string, kind: string, baseMoney: MoneySummary | null, currentMoney: MoneySummary | null, group: GroupSummary | null) => {
      const baseRows = members(name,kind).filter(r => r.signed <= c.window.start && paying(r,c.window.start));
      const feeMargin = baseRows.length ? baseRows.reduce((s,r) => s + (r.one_time_fee ?? 0),0) / baseRows.length * margin! : 0;
      const total = currentMoney ? currentMoney.capped_ltv + feeMargin : null;
      const ratio = total == null ? null : total / cac!;
      const verdict: Verdict = !baseMoney || baseRows.length < 5 ? 'NO_VERDICT' : (group && group.line_pass === false) || c.stop_rule.base_verdict === 'HOLD' && !group || ratio! < input.required_ratio! ? 'HOLD' : c.stop_rule.base_verdict !== 'PASS' || (group?.lead_not_proof ?? baseRows.length < 15) ? 'CAPPED_TEST' : currentMoney!.payback_months! <= line ? 'SCALE' : 'CAPPED_TEST';
      return { name, kind, base: baseRows.length, starting_capped_value: baseMoney?.capped_ltv ?? null,
        expansion_value: baseMoney && currentMoney ? currentMoney.capped_ltv - baseMoney.capped_ltv : null,
        one_time_fee_margin: feeMargin, total_value: total, ratio, required_ratio: input.required_ratio, verdict };
    };
    result.value = [valueFor('Whole list','all',c.money.whole_base,expanded.money.whole_base,null),...c.groups.map((g: GroupSummary) => valueFor(g.name,g.kind,c.money.by_group[g.name],expanded.money.by_group[g.name],g))];
    result.scope = 'Lifetime value capped at the months observed, with current recurring fees and one time fees after margin. Current fees are a run rate scenario for the same horizon, not a record of past expansion. The required ratio is yours. This does not choose where the budget goes.';
  }
  return result;
}
