import { generateRetentionPlaybook } from "./retention-playbook.js";
import { generateCustomerInterviewKit } from "./interview-kit.js";

export interface ScalePaidCustomerRow {
  id: string;
  signed: string;
  segment: string;
  monthly_fee: number;
  stopped?: string;
  resumed?: string;
  monthly_starts?: number[];
}

export interface ScalePaidMetricItem {
  name: string;
  value: number;
  counts?: "customers" | "revenue" | string;
  period?: "month" | "year" | string;
}

export interface ScalePaidCheckInput {
  product: string;
  business_model: string;
  billing_term: "monthly" | "annual";
  as_of: string;
  customers: ScalePaidCustomerRow[];
  metrics?: ScalePaidMetricItem[];
  stop_line?: number;
  payback_line_months?: number;
  gross_margin?: number;
  paid_cac?: number;
  blended_cac?: number;
  test_cap?: number;
  win_rate_floor?: number;
  win_rate_target?: number;
  churn_reasons: string;
  interview_persona: string;
}

export type GroupVerdict = "SCALE" | "CAPPED_TEST" | "HOLD" | "NO_VERDICT";
export type BaseVerdict = "PASS" | "HOLD" | "NOT_ENOUGH_HISTORY";

export interface RejectedRowInfo {
  id: string;
  index: number;
  reason: string;
}

export interface PendingCustomerInfo {
  id: string;
  stopped: string;
  days_since_stopped: number;
  status: "pending: stopped under 90 days ago";
}

export interface PausedCustomerInfo {
  id: string;
  stopped: string;
  resumed: string;
  status: "pause: came back";
}

export interface CohortCell {
  reached: boolean;
  k: number | null;
  n: number;
  pct: number | null;
  display: string;
}

export interface CohortRow {
  quarter: string;
  n: number;
  mature: boolean;
  one_customer_points: number;
  month_3: CohortCell;
  month_6: CohortCell;
  month_9: CohortCell;
  month_12: CohortCell;
  revenue_kept_month_12: {
    reached: boolean;
    kept_fee: number | null;
    starting_fee: number;
    share: number | null;
    pct: number | null;
    label: "revenue kept at starting fees, no expansion";
  };
}

export interface EvaluatedCohortRule {
  quarter: string;
  n: number;
  k6: number;
  k12: number;
  kept_share_m12: number;
  kept_pct_m12: number;
  line_pass: boolean;
  lost_1_6: number;
  lost_7_12: number;
  shape_pass: boolean | null;
  one_customer_points: number;
}

export interface GroupSummary {
  name: string;
  kind: "segment" | "tag";
  total_rows: number;
  base: number;
  lost: number;
  kept: number;
  kept_share: number;
  kept_pct: number;
  share_of_losses: number;
  share_of_losses_pct: number;
  share_of_base: number;
  share_of_base_pct: number;
  loses_more_than_share: boolean;
  line_pass: boolean | null;
  losses_to_fail: number | null;
  lead_not_proof: boolean;
  too_few_customers: boolean;
  verdict: GroupVerdict;
  verdict_note: string;
}

export interface MoneySummary {
  name: string;
  base: number;
  kept: number;
  lost: number;
  average_monthly_fee: number;
  monthly_margin: number;
  monthly_churn: number;
  months_seen: number;
  capped_ltv: number;
  required_paid_cac: number;
  payback_months: number | null;
  ltv_to_paid_cac: number | null;
  ltv_to_blended_cac: number | null;
  go_count: number | null;
  stop_count: number | null;
}

export interface ScalePaidCheckResult {
  text: string;
  structuredContent: Record<string, unknown>;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  toString(): string;
}

/** Pure calendar check: returns the number of days in (year, month) where month is 1..12. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

/** Checks whether s is a real calendar YYYY-MM-DD date without calling new Date(). */
export function isRealDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (!Number.isInteger(year) || year < 1000 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  const maxDay = daysInMonth(year, month);
  return Number.isInteger(day) && day >= 1 && day <= maxDay;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Spec Section 3:
 * add_months(d, m): the same day number m calendar months later.
 * If that day does not exist, use the last day of that month.
 */
export function addMonths(d: string, m: number): string {
  const year = Number(d.slice(0, 4));
  const month = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  const totalMonths = year * 12 + (month - 1) + m;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12 + 1;
  const maxDay = daysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(day, maxDay);
  return `${targetYear}-${pad2(targetMonth)}-${pad2(targetDay)}`;
}

/**
 * Spec Section 3:
 * Quarter of a date: YYYY-Qn. The quarter ends on 31 Mar, 30 Jun, 30 Sep or 31 Dec.
 */
export function quarterOf(d: string): string {
  const year = d.slice(0, 4);
  const month = Number(d.slice(5, 7));
  const q = Math.floor((month - 1) / 3) + 1;
  return `${year}-Q${q}`;
}

/**
 * Spec Section 3:
 * months_between(a, b): whole calendar months from a to b, counted by add_months, with a <= b.
 */
export function monthsBetween(a: string, b: string): number {
  if (a > b) return 0;
  let m = 0;
  while (addMonths(a, m + 1) <= b) {
    m += 1;
  }
  return m;
}

/** Pure proleptic Gregorian day number from YYYY-MM-DD (never calls Date.now() or new Date()). */
export function toDayNumber(d: string): number {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  return Math.floor(Date.UTC(y, m - 1, day) / 86400000);
}

export function daysBetween(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

/** Adds whole days to a YYYY-MM-DD string using pure calendar arithmetic. */
export function addDays(d: string, deltaDays: number): string {
  let year = Number(d.slice(0, 4));
  let month = Number(d.slice(5, 7));
  let day = Number(d.slice(8, 10)) + deltaDays;
  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += daysInMonth(year, month);
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Remove any em-dash or en-dash from chained tool text so buyer-facing output has no dashes. */
function stripDashes(s: string): string {
  return s.replace(/\s*[\u2014\u2013]\s*/g, ", ");
}

/** Split churn_reasons (comma, semicolon or line separated, without splitting commas inside numbers like 1,200) while preserving each reason word for word. */
function splitChurnReasons(raw: string): string[] {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];
  return trimmed
    .split(/(?:\r?\n|;|,(?!\d))+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

interface ValidatedCustomer {
  row: ScalePaidCustomerRow;
  id: string;
  signed: string;
  segment: string;
  monthly_fee: number;
  stopped?: string;
  resumed?: string;
  monthly_starts?: number[];
  confirmed_stop: boolean;
  is_pending: boolean;
  is_paused: boolean;
  days_since_stopped?: number;
  seasonal_tag: "seasonal" | "steady" | "untagged";
}

function isPayingOn(c: ValidatedCustomer, dateStr: string): boolean {
  if (!c.stopped || !c.confirmed_stop) return true;
  if (c.resumed) {
    return dateStr < c.stopped || dateStr >= c.resumed;
  }
  return dateStr < c.stopped;
}

export function generateScalePaidCheck(input: ScalePaidCheckInput): ScalePaidCheckResult {
  const rawCustomers = Array.isArray(input?.customers) ? input.customers : [];
  const rowsReceived = rawCustomers.length;
  if (rowsReceived > 2000) {
    const refusalText = `Your list has ${rowsReceived} rows. This check takes up to 2,000 customers. Split the list by segment and run each part.`;
    return {
      text: refusalText,
      structuredContent: {},
      content: [{ type: "text", text: refusalText }],
      isError: true,
      toString() {
        return refusalText;
      },
    };
  }

  const asOf = typeof input.as_of === "string" ? input.as_of.trim() : "";
  if (!isRealDate(asOf)) {
    throw new Error("as_of must be a real YYYY-MM-DD date.");
  }

  const billingTerm: "monthly" | "annual" = input.billing_term === "annual" ? "annual" : "monthly";
  const stopLineIsDefault = input.stop_line === undefined || input.stop_line === null;
  const stopLine = stopLineIsDefault ? 0.80 : Number(input.stop_line);
  const paybackLineIsDefault = input.payback_line_months === undefined || input.payback_line_months === null;
  const paybackLineMonths = paybackLineIsDefault ? 12 : Number(input.payback_line_months);

  // Section 2: Row checks (before any sum)
  const rejectedRows: RejectedRowInfo[] = [];
  const validRows: ScalePaidCustomerRow[] = [];
  const seenIds = new Set<string>();

  rawCustomers.forEach((row, idx) => {
    const rawId = typeof row?.id === "string" ? row.id.trim() : String(row?.id ?? `row_${idx + 1}`);
    const signed = typeof row?.signed === "string" ? row.signed.trim() : "";
    const stopped = row?.stopped !== undefined && row?.stopped !== null && String(row.stopped).trim() !== ""
      ? String(row.stopped).trim()
      : undefined;
    const resumed = row?.resumed !== undefined && row?.resumed !== null && String(row.resumed).trim() !== ""
      ? String(row.resumed).trim()
      : undefined;
    const fee = typeof row?.monthly_fee === "number" ? row.monthly_fee : Number(row?.monthly_fee);

    if (!rawId) {
      rejectedRows.push({ id: `row_${idx + 1}`, index: idx, reason: "id is missing" });
      return;
    }
    if (seenIds.has(rawId)) {
      rejectedRows.push({ id: rawId, index: idx, reason: "id repeats (duplicate id)" });
      return;
    }
    seenIds.add(rawId);

    if (!isRealDate(signed)) {
      rejectedRows.push({ id: rawId, index: idx, reason: `signed (${String(row?.signed ?? "")}) is not a real YYYY-MM-DD date` });
      return;
    }
    if (stopped !== undefined && !isRealDate(stopped)) {
      rejectedRows.push({ id: rawId, index: idx, reason: `stopped (${stopped}) is not a real YYYY-MM-DD date` });
      return;
    }
    if (resumed !== undefined && !isRealDate(resumed)) {
      rejectedRows.push({ id: rawId, index: idx, reason: `resumed (${resumed}) is not a real YYYY-MM-DD date` });
      return;
    }
    if (signed > asOf) {
      rejectedRows.push({ id: rawId, index: idx, reason: `signed (${signed}) is after as_of (${asOf})` });
      return;
    }
    if (stopped !== undefined && stopped > asOf) {
      rejectedRows.push({ id: rawId, index: idx, reason: `stopped (${stopped}) is after as_of (${asOf})` });
      return;
    }
    if (resumed !== undefined && resumed > asOf) {
      rejectedRows.push({ id: rawId, index: idx, reason: `resumed (${resumed}) is after as_of (${asOf})` });
      return;
    }
    if (stopped !== undefined && stopped < signed) {
      rejectedRows.push({ id: rawId, index: idx, reason: `stopped (${stopped}) is before signed (${signed})` });
      return;
    }
    if (resumed !== undefined && (stopped === undefined || resumed < stopped)) {
      rejectedRows.push({ id: rawId, index: idx, reason: `resumed (${resumed}) is before stopped (${stopped ?? "none"})` });
      return;
    }
    if (!Number.isFinite(fee) || fee <= 0) {
      rejectedRows.push({ id: rawId, index: idx, reason: `monthly_fee (${String(row?.monthly_fee)}) is <= 0` });
      return;
    }

    validRows.push({
      ...row,
      id: rawId,
      signed,
      segment: typeof row.segment === "string" && row.segment.trim() ? row.segment.trim() : "Unsegmented",
      monthly_fee: fee,
      stopped,
      resumed,
    });
  });

  // Check if at least one valid row has monthly_starts
  const hasAnyMonthlyStarts = validRows.some(
    (r) => Array.isArray(r.monthly_starts) && r.monthly_starts.length > 0 && r.monthly_starts.every((n) => typeof n === "number" && Number.isFinite(n))
  );

  // Section 4: Lost, paused, pending
  const pendingCustomers: PendingCustomerInfo[] = [];
  const pausedCustomers: PausedCustomerInfo[] = [];

  const customers: ValidatedCustomer[] = validRows.map((row) => {
    let confirmedStop = false;
    let isPending = false;
    let isPaused = false;
    let daysSinceStopped: number | undefined;

    if (row.stopped) {
      daysSinceStopped = daysBetween(row.stopped, asOf);
      if (daysSinceStopped >= 90) {
        confirmedStop = true;
      } else {
        isPending = true;
        pendingCustomers.push({
          id: row.id,
          stopped: row.stopped,
          days_since_stopped: daysSinceStopped,
          status: "pending: stopped under 90 days ago",
        });
      }
      if (row.resumed) {
        isPaused = true;
        pausedCustomers.push({
          id: row.id,
          stopped: row.stopped,
          resumed: row.resumed,
          status: "pause: came back",
        });
      }
    }

    let seasonalTag: "seasonal" | "steady" | "untagged" = "untagged";
    if (
      hasAnyMonthlyStarts &&
      Array.isArray(row.monthly_starts) &&
      row.monthly_starts.length > 0 &&
      row.monthly_starts.every((n) => typeof n === "number" && Number.isFinite(n))
    ) {
      const minStarts = Math.min(...row.monthly_starts);
      const maxStarts = Math.max(...row.monthly_starts);
      seasonalTag = minStarts < 0.5 * maxStarts ? "seasonal" : "steady";
    }

    return {
      row,
      id: row.id,
      signed: row.signed,
      segment: row.segment,
      monthly_fee: row.monthly_fee,
      stopped: row.stopped,
      resumed: row.resumed,
      monthly_starts: row.monthly_starts,
      confirmed_stop: confirmedStop,
      is_pending: isPending,
      is_paused: isPaused,
      days_since_stopped: daysSinceStopped,
      seasonal_tag: seasonalTag,
    };
  });

  // Echo calculations (Section 2)
  const rowsUsed = customers.length;
  const payingOnAsOfList = customers.filter((c) => isPayingOn(c, asOf));
  const payingOnAsOfCount = payingOnAsOfList.length;
  const mrrOnAsOf = payingOnAsOfList.reduce((sum, c) => sum + c.monthly_fee, 0);
  const signedDates = customers.map((c) => c.signed).sort();
  const earliestSigned = signedDates.length > 0 ? signedDates[0] : null;
  const latestSigned = signedDates.length > 0 ? signedDates[signedDates.length - 1] : null;

  // Section 5: Cohort table
  const cohortsMap = new Map<string, ValidatedCustomer[]>();
  for (const c of customers) {
    const q = quarterOf(c.signed);
    const list = cohortsMap.get(q);
    if (list) list.push(c);
    else cohortsMap.set(q, [c]);
  }
  const sortedQuarters = Array.from(cohortsMap.keys()).sort();

  const buildCell = (members: ValidatedCustomer[], m: number): CohortCell => {
    const n = members.length;
    const reached = n > 0 && members.every((c) => addMonths(c.signed, m) <= asOf);
    if (!reached) {
      return { reached: false, k: null, n, pct: null, display: "not reached" };
    }
    const k = members.filter((c) => isPayingOn(c, addMonths(c.signed, m))).length;
    const pct = Math.round((k / n) * 100);
    return {
      reached: true,
      k,
      n,
      pct,
      display: `${k} of ${n} (${pct}%)`,
    };
  };

  const cohortRows: CohortRow[] = sortedQuarters.map((q) => {
    const members = cohortsMap.get(q) ?? [];
    const n = members.length;
    const m3 = buildCell(members, 3);
    const m6 = buildCell(members, 6);
    const m9 = buildCell(members, 9);
    const m12 = buildCell(members, 12);
    const startingFee = members.reduce((sum, c) => sum + c.monthly_fee, 0);
    let keptFee: number | null = null;
    let revShare: number | null = null;
    let revPct: number | null = null;
    if (m12.reached) {
      keptFee = members
        .filter((c) => isPayingOn(c, addMonths(c.signed, 12)))
        .reduce((sum, c) => sum + c.monthly_fee, 0);
      revShare = startingFee > 0 ? keptFee / startingFee : 0;
      revPct = Math.round(revShare * 100);
    }
    const oneCustomerPoints = Number((100 / n).toFixed(1));
    return {
      quarter: q,
      n,
      mature: m12.reached,
      one_customer_points: oneCustomerPoints,
      month_3: m3,
      month_6: m6,
      month_9: m9,
      month_12: m12,
      revenue_kept_month_12: {
        reached: m12.reached,
        kept_fee: keptFee,
        starting_fee: startingFee,
        share: revShare,
        pct: revPct,
        label: "revenue kept at starting fees, no expansion",
      },
    };
  });

  // Section 6: Stop rule (the base)
  const matureCohorts = cohortRows.filter((c) => c.mature);
  const latestTwoMature = matureCohorts.slice(-2);
  const shapeTestSkipped = billingTerm === "annual";

  const evaluatedCohorts: EvaluatedCohortRule[] = latestTwoMature.map((c) => {
    const n = c.n;
    const k6 = c.month_6.k ?? n;
    const k12 = c.month_12.k ?? 0;
    const keptShareM12 = k12 / n;
    const keptPctM12 = Math.round(keptShareM12 * 100);
    const linePass = keptShareM12 >= stopLine - 1e-12;
    const lost1To6 = n - k6;
    const lost7To12 = k6 - k12;
    const shapePass = shapeTestSkipped ? null : !(lost7To12 > 0 && lost7To12 >= lost1To6);
    return {
      quarter: c.quarter,
      n,
      k6,
      k12,
      kept_share_m12: keptShareM12,
      kept_pct_m12: keptPctM12,
      line_pass: linePass,
      lost_1_6: lost1To6,
      lost_7_12: lost7To12,
      shape_pass: shapePass,
      one_customer_points: c.one_customer_points,
    };
  });

  let baseVerdict: BaseVerdict;
  if (matureCohorts.length < 2) {
    baseVerdict = "NOT_ENOUGH_HISTORY";
  } else {
    const anyFailed = evaluatedCohorts.some((c) => !c.line_pass || c.shape_pass === false);
    baseVerdict = anyFailed ? "HOLD" : "PASS";
  }

  // Section 7: Groups & Window
  const windowStart = addMonths(asOf, -12);
  const inWindowBase = (c: ValidatedCustomer): boolean => c.signed <= windowStart && isPayingOn(c, windowStart);
  const wholeBaseMembers = customers.filter(inWindowBase);
  const wholeBase = wholeBaseMembers.length;
  const wholeLostMembers = wholeBaseMembers.filter((c) => !isPayingOn(c, asOf));
  const wholeLost = wholeLostMembers.length;
  const wholeKept = wholeBase - wholeLost;
  const wholeKeptShare = wholeBase > 0 ? wholeKept / wholeBase : 0;
  const wholeLossShare = wholeBase > 0 ? wholeLost / wholeBase : 0;

  const distinctSegments: string[] = [];
  for (const c of customers) {
    if (!distinctSegments.includes(c.segment)) {
      distinctSegments.push(c.segment);
    }
  }

  const groupDefs: Array<{ name: string; kind: "segment" | "tag"; members: ValidatedCustomer[] }> = [];
  for (const seg of distinctSegments) {
    groupDefs.push({
      name: seg,
      kind: "segment",
      members: customers.filter((c) => c.segment === seg),
    });
  }
  if (hasAnyMonthlyStarts) {
    groupDefs.push({
      name: "seasonal",
      kind: "tag",
      members: customers.filter((c) => c.seasonal_tag === "seasonal"),
    });
    groupDefs.push({
      name: "steady",
      kind: "tag",
      members: customers.filter((c) => c.seasonal_tag === "steady"),
    });
    const untaggedMembers = customers.filter((c) => c.seasonal_tag === "untagged");
    if (untaggedMembers.length > 0) {
      groupDefs.push({
        name: "untagged",
        kind: "tag",
        members: untaggedMembers,
      });
    }
  }

  // Section 8: Money helper (computed alongside groups so Section 9 can use payback_months)
  const moneyEnabled = input.gross_margin !== undefined && input.gross_margin !== null && Number.isFinite(Number(input.gross_margin));
  const grossMargin = moneyEnabled ? Number(input.gross_margin) : null;
  const paidCac = input.paid_cac !== undefined && input.paid_cac !== null && Number.isFinite(Number(input.paid_cac))
    ? Number(input.paid_cac)
    : null;
  const blendedCac = input.blended_cac !== undefined && input.blended_cac !== null && Number.isFinite(Number(input.blended_cac))
    ? Number(input.blended_cac)
    : null;
  const testCap = input.test_cap !== undefined && input.test_cap !== null && Number.isFinite(Number(input.test_cap))
    ? Number(input.test_cap)
    : null;
  const winRateFloor = input.win_rate_floor !== undefined && input.win_rate_floor !== null && Number.isFinite(Number(input.win_rate_floor))
    ? Number(input.win_rate_floor)
    : null;
  const winRateTarget = input.win_rate_target !== undefined && input.win_rate_target !== null && Number.isFinite(Number(input.win_rate_target))
    ? Number(input.win_rate_target)
    : null;

  const monthsSeen = earliestSigned ? monthsBetween(earliestSigned, asOf) : 0;

  const computeMoneyForMembers = (name: string, baseMembers: ValidatedCustomer[]): MoneySummary | null => {
    if (!moneyEnabled || grossMargin === null || baseMembers.length === 0) return null;
    const base = baseMembers.length;
    const lost = baseMembers.filter((c) => !isPayingOn(c, asOf)).length;
    const kept = base - lost;
    const avgMonthlyFee = baseMembers.reduce((sum, c) => sum + c.monthly_fee, 0) / base;
    const monthlyMargin = avgMonthlyFee * grossMargin;
    const c = kept === base ? 0 : 1 - Math.pow(kept / base, 1 / 12);
    let cappedLtv = 0;
    if (monthsSeen > 0) {
      if (c === 0) {
        cappedLtv = monthlyMargin * monthsSeen;
      } else {
        cappedLtv = (monthlyMargin * (1 - Math.pow(1 - c, monthsSeen))) / c;
      }
    }
    const requiredPaidCac = monthlyMargin * paybackLineMonths;
    const paybackMonths = paidCac !== null && monthlyMargin > 0 ? paidCac / monthlyMargin : null;
    const ltvToPaidCac = paidCac !== null && paidCac > 0 ? cappedLtv / paidCac : null;
    const ltvToBlendedCac = blendedCac !== null && blendedCac > 0 ? cappedLtv / blendedCac : null;

    let goCount: number | null = null;
    let stopCount: number | null = null;
    if (
      testCap !== null &&
      winRateFloor !== null &&
      winRateFloor > 0 &&
      winRateTarget !== null &&
      winRateTarget > 0 &&
      requiredPaidCac > 0
    ) {
      goCount = Math.ceil(testCap / (requiredPaidCac * winRateFloor));
      stopCount = Math.floor(testCap / (requiredPaidCac * winRateTarget));
    }

    return {
      name,
      base,
      kept,
      lost,
      average_monthly_fee: avgMonthlyFee,
      monthly_margin: monthlyMargin,
      monthly_churn: c,
      months_seen: monthsSeen,
      capped_ltv: cappedLtv,
      required_paid_cac: requiredPaidCac,
      payback_months: paybackMonths,
      ltv_to_paid_cac: ltvToPaidCac,
      ltv_to_blended_cac: ltvToBlendedCac,
      go_count: goCount,
      stop_count: stopCount,
    };
  };

  const wholeBaseMoney = computeMoneyForMembers("All customers (whole base)", wholeBaseMembers);
  const groupMoneyMap: Record<string, MoneySummary | null> = {};

  // Section 7 & Section 9: Group figures and verdicts
  const groups: GroupSummary[] = groupDefs.map((def) => {
    const baseMembers = def.members.filter(inWindowBase);
    const base = baseMembers.length;
    const lost = baseMembers.filter((c) => !isPayingOn(c, asOf)).length;
    const kept = base - lost;
    const keptShare = base > 0 ? kept / base : 0;
    const keptPct = base > 0 ? Math.round(keptShare * 100) : 0;
    const shareOfLosses = wholeLost > 0 ? lost / wholeLost : 0;
    const shareOfLossesPct = wholeLost > 0 ? Math.round(shareOfLosses * 100) : 0;
    const shareOfBase = wholeBase > 0 ? base / wholeBase : 0;
    const shareOfBasePct = wholeBase > 0 ? Math.round(shareOfBase * 100) : 0;
    const losesMoreThanShare = wholeLost > 0 && (shareOfLosses - shareOfBase) * 100 >= 10 - 1e-9;

    const money = computeMoneyForMembers(def.name, baseMembers);
    groupMoneyMap[def.name] = money;

    const tooFew = base < 5;
    let linePass: boolean | null = null;
    let lossesToFail: number | null = null;
    let leadNotProof = false;

    if (!tooFew) {
      linePass = keptShare >= stopLine - 1e-12;
      if (linePass) {
        let j = 1;
        while ((kept - j) / base >= stopLine - 1e-12) {
          j += 1;
        }
        lossesToFail = j;
        leadNotProof = j <= 3;
      } else {
        lossesToFail = 0;
      }
    }

    // Section 9: Verdict per group (in exact order)
    let verdict: GroupVerdict;
    let verdictNote: string;
    if (tooFew) {
      verdict = "NO_VERDICT";
      verdictNote = "too few customers to read";
    } else if (!linePass) {
      verdict = "HOLD";
      verdictNote = `fails the group line test (${kept} of ${base} kept, ${keptPct}% vs ${Math.round(stopLine * 100)}% stop line)`;
    } else if (baseVerdict === "NOT_ENOUGH_HISTORY" || leadNotProof) {
      verdict = "CAPPED_TEST";
      const reasons: string[] = [];
      if (baseVerdict === "NOT_ENOUGH_HISTORY") reasons.push("base has NOT_ENOUGH_HISTORY");
      if (leadNotProof) reasons.push(`lead, not proof (${lossesToFail} loss${lossesToFail === 1 ? "" : "es"} to fail)`);
      verdictNote = `${reasons.join("; ")}; measure cost per opportunity, not growth`;
    } else if (money !== null && money.payback_months !== null && money.payback_months <= paybackLineMonths + 1e-12) {
      verdict = "SCALE";
      verdictNote = "rerun the cohorts every quarter, and stop if payback passes the line";
    } else {
      verdict = "CAPPED_TEST";
      verdictNote = "measure cost per opportunity, not growth";
    }

    return {
      name: def.name,
      kind: def.kind,
      total_rows: def.members.length,
      base,
      lost,
      kept,
      kept_share: keptShare,
      kept_pct: keptPct,
      share_of_losses: shareOfLosses,
      share_of_losses_pct: shareOfLossesPct,
      share_of_base: shareOfBase,
      share_of_base_pct: shareOfBasePct,
      loses_more_than_share: losesMoreThanShare,
      line_pass: linePass,
      losses_to_fail: lossesToFail,
      lead_not_proof: leadNotProof,
      too_few_customers: tooFew,
      verdict,
      verdict_note: verdictNote,
    };
  });

  // Section 10: Metric definitions
  const rawMetrics = Array.isArray(input.metrics) ? input.metrics : [];
  const metricNotes = rawMetrics.map((m) => {
    const hasCounts = m.counts === "customers" || m.counts === "revenue";
    const hasPeriod = m.period === "month" || m.period === "year";
    if (!hasCounts || !hasPeriod) {
      return {
        name: m.name,
        value: m.value,
        counts: m.counts ?? null,
        period: m.period ?? null,
        status: "not_read" as const,
        note: `${m.name} (${m.value}): not read: give whether it counts customers or revenue, and over what period`,
      };
    }
    return {
      name: m.name,
      value: m.value,
      counts: m.counts,
      period: m.period,
      status: "ok" as const,
      note: `${m.name}: ${m.value} (counts ${m.counts}, period ${m.period})`,
    };
  });

  const monthlyCustomerChurnMetric = rawMetrics.find(
    (m) => m.counts === "customers" && m.period === "month" && /churn/i.test(m.name) && typeof m.value === "number"
  );
  const yearlyCustomerRetentionMetric = rawMetrics.find(
    (m) => m.counts === "customers" && m.period === "year" && /retention|kept/i.test(m.name) && typeof m.value === "number"
  );

  let metricDisagreement = false;
  let impliedAnnualRetentionPct: number | null = null;
  let reportedAnnualRetentionPct: number | null = null;
  let metricDisagreementNote: string | null = null;

  if (monthlyCustomerChurnMetric && yearlyCustomerRetentionMetric) {
    const rVal = yearlyCustomerRetentionMetric.value;
    const cVal = monthlyCustomerChurnMetric.value;
    const churnFraction = rVal > 1 ? cVal / 100 : cVal <= 1 ? cVal : cVal / 100;
    reportedAnnualRetentionPct = rVal > 1 ? rVal : rVal * 100;
    impliedAnnualRetentionPct = Math.pow(1 - churnFraction, 12) * 100;
    if (Math.abs(impliedAnnualRetentionPct - reportedAnnualRetentionPct) > 2) {
      metricDisagreement = true;
      metricDisagreementNote = `Monthly customer churn of ${cVal}% compounds to ${impliedAnnualRetentionPct.toFixed(1)}% yearly retention ((1 - churn)^12), compared with reported yearly customer retention of ${reportedAnnualRetentionPct}%. These two figures measure different things or disagree: write the definition next to each.`;
    }
  }

  // Section 11: The chain
  const segmentGroups = groups.filter((g) => g.kind === "segment");
  let largestSegment = "Customers";
  if (segmentGroups.length > 0) {
    const sortedSegments = [...segmentGroups].sort((a, b) => {
      if (b.base !== a.base) return b.base - a.base;
      return b.total_rows - a.total_rows;
    });
    largestSegment = sortedSegments[0].name;
  }

  const wholeBaseMonthlyChurn =
    wholeBase > 0 && wholeKept < wholeBase ? 1 - Math.pow(wholeKept / wholeBase, 1 / 12) : 0;
  const currentChurnRateString = `${(wholeBaseMonthlyChurn * 100).toFixed(1)}% monthly`;
  const availableDataSignalsString = "monthly starts, stop dates, monthly fee";
  const churnReasonsWordForWord = input.churn_reasons;
  const individualReasons = splitChurnReasons(churnReasonsWordForWord);
  const playbookChurnReasons = individualReasons.join("\n");

  const playbookArgs = {
    customer_segment: largestSegment,
    business_model: input.business_model,
    current_churn_rate: currentChurnRateString,
    churn_reasons: playbookChurnReasons,
    available_data_signals: availableDataSignalsString,
  };
  const rawPlaybookText = generateRetentionPlaybook(playbookArgs);
  const playbookText = stripDashes(rawPlaybookText);

  // Compare retention_playbook's yearly loss figure against server's whole-base window loss share
  const serverLossSharePct = wholeBase > 0 ? (wholeLost / wholeBase) * 100 : 0;
  const pbMatch = playbookText.match(/about\s+(\d+(?:\.\d+)?)%\s+of\s+(?:customers|volume|revenue)\s+lost\s+in\s+a\s+year/i);
  const roundedMonthlyRate = parseFloat((wholeBaseMonthlyChurn * 100).toFixed(1));
  const fallbackPbYearlyLoss = (1 - Math.pow(1 - roundedMonthlyRate / 100, 12)) * 100;
  const playbookYearlyLossPct = pbMatch ? parseFloat(pbMatch[1]) : fallbackPbYearlyLoss;
  let useServerFigureNote: string | null = null;
  if (wholeBase > 0 && Math.abs(playbookYearlyLossPct - serverLossSharePct) >= 1) {
    useServerFigureNote = `The server's figure, from your list, is ${Math.round(serverLossSharePct)}%; use it.`;
  }

  // customer_interview_kit
  const prefixedHypothesesList = individualReasons.map((r) => `Customers leave because ${r}`);
  const keyHypothesesString = prefixedHypothesesList.join("; ");

  const interviewKitArgs = {
    interview_type: "churn",
    product_context: input.product,
    target_persona: input.interview_persona,
    key_hypotheses: keyHypothesesString,
  };
  const rawInterviewKitText = generateCustomerInterviewKit(interviewKitArgs);
  const interviewKitText = stripDashes(rawInterviewKitText);

  // Section 12: Dated next steps (from as_of)
  const day7 = addDays(asOf, 7);
  const day28 = addDays(asOf, 28);
  const day35 = addDays(asOf, 35);
  const day90 = addDays(asOf, 90);
  const cappedTestGroups = groups.filter((g) => g.verdict === "CAPPED_TEST").map((g) => g.name);
  const scaleGroups = groups.filter((g) => g.verdict === "SCALE").map((g) => g.name);
  const holdGroups = groups.filter((g) => g.verdict === "HOLD").map((g) => g.name);

  // Section 13: Build output text in exact section 1..10 order
  const lines: string[] = [];

  // 1. The answer card (the verdict per group, one line each)
  lines.push("# Scale Paid Check: Answer Card");
  lines.push("");
  for (const g of groups) {
    if (g.verdict === "NO_VERDICT") {
      lines.push(`- **${g.name} (${g.kind}):** NO_VERDICT (${g.base} of ${wholeBase} customers in window base: too few customers to read)`);
    } else if (g.verdict === "SCALE") {
      const m = groupMoneyMap[g.name];
      const pbText = m && m.payback_months !== null ? `, paid payback ${m.payback_months.toFixed(1)} months` : "";
      lines.push(`- **${g.name} (${g.kind}):** SCALE (${g.kept} of ${g.base} kept, ${g.kept_pct}%${pbText}; ${g.verdict_note})`);
    } else if (g.verdict === "CAPPED_TEST") {
      lines.push(`- **${g.name} (${g.kind}):** CAPPED_TEST (${g.kept} of ${g.base} kept, ${g.kept_pct}%; ${g.verdict_note})`);
    } else {
      lines.push(`- **${g.name} (${g.kind}):** HOLD (${g.kept} of ${g.base} kept, ${g.kept_pct}%; ${g.verdict_note})`);
    }
  }
  lines.push("");

  // 2. "Check this first" (the echo, rejected rows, pending and paused customers, and which defaults were used)
  lines.push("## Check this first");
  lines.push("");
  lines.push("### Upload echo");
  lines.push(`- Rows received: ${rowsReceived}`);
  lines.push(`- Rows used: ${rowsUsed}`);
  lines.push(`- Rows rejected: ${rejectedRows.length}`);
  lines.push(`- Customers paying on ${asOf}: ${payingOnAsOfCount} of ${rowsUsed} used rows`);
  lines.push(`- MRR on ${asOf}: ${formatMoney(mrrOnAsOf)} across ${payingOnAsOfCount} paying customers`);
  lines.push(`- Earliest signed: ${earliestSigned ?? "none"}`);
  lines.push(`- Latest signed: ${latestSigned ?? "none"}`);
  lines.push("");

  lines.push("### Rejected rows");
  if (rejectedRows.length === 0) {
    lines.push("- None (0 of " + rowsReceived + " rows rejected).");
  } else {
    for (const r of rejectedRows) {
      lines.push(`- ${r.id} (row ${r.index + 1}): rejected because ${r.reason}.`);
    }
  }
  lines.push("");

  lines.push("### Pending and paused customers");
  if (pendingCustomers.length === 0) {
    lines.push(`- Pending stops: 0 of ${rowsUsed} used customers stopped under 90 days before ${asOf}.`);
  } else {
    for (const p of pendingCustomers) {
      lines.push(`- ${p.id} (stopped ${p.stopped}, ${p.days_since_stopped} days before ${asOf}): ${p.status} (counted as paying everywhere).`);
    }
  }
  if (pausedCustomers.length === 0) {
    lines.push(`- Paused and resumed customers: 0 of ${rowsUsed} used customers.`);
  } else {
    for (const p of pausedCustomers) {
      lines.push(`- ${p.id} (stopped ${p.stopped}, resumed ${p.resumed}): ${p.status} (counted as kept from ${p.resumed}).`);
    }
  }
  lines.push("");

  lines.push("### Decision lines and defaults used");
  if (stopLineIsDefault && paybackLineIsDefault) {
    lines.push(
      `- Both lines used defaults: stop_line = ${stopLine.toFixed(2)} (${Math.round(stopLine * 100)}% kept at month 12) and payback_line_months = ${paybackLineMonths} months. The stop_line of 0.80 and payback line of 12 are Shashwat's example lines for a $36,000 contract, not a benchmark.`
    );
  } else if (stopLineIsDefault) {
    lines.push(
      `- Default stop_line = ${stopLine.toFixed(2)} (${Math.round(stopLine * 100)}% kept at month 12) was used; payback_line_months = ${paybackLineMonths} months was supplied by you. The stop_line of 0.80 is Shashwat's example line for a $36,000 contract, not a benchmark.`
    );
  } else if (paybackLineIsDefault) {
    lines.push(
      `- Default payback_line_months = ${paybackLineMonths} months was used; stop_line = ${stopLine.toFixed(2)} (${Math.round(stopLine * 100)}% kept at month 12) was supplied by you. The payback line of 12 months is Shashwat's example line for a $36,000 contract, not a benchmark.`
    );
  } else {
    lines.push(
      `- No defaults used: you supplied stop_line = ${stopLine.toFixed(2)} (${Math.round(stopLine * 100)}% kept at month 12) and payback_line_months = ${paybackLineMonths} months.`
    );
  }
  lines.push("");

  if (metricNotes.length > 0) {
    lines.push("### Metric definitions");
    for (const mn of metricNotes) {
      lines.push(`- ${mn.note}`);
    }
    if (metricDisagreementNote) {
      lines.push(`- ${metricDisagreementNote}`);
    }
    lines.push("");
  }

  // 3. The stop rule with its counts
  lines.push("## Stop rule");
  lines.push("");
  if (shapeTestSkipped) {
    lines.push("Annual billing: losses land at renewal, so the shape test does not apply; read month 12 as the first renewal.");
    lines.push("");
  }
  if (matureCohorts.length < 2) {
    lines.push(
      `Base verdict: **NOT_ENOUGH_HISTORY** (${matureCohorts.length} of ${cohortRows.length} signing cohorts have reached month 12 by ${asOf}; fewer than 2 mature cohorts, so the base has not enough history and every group is at most CAPPED_TEST).`
    );
    if (matureCohorts.length === 1) {
      const only = matureCohorts[0];
      lines.push(`- Mature cohort ${only.quarter}: ${only.month_12.display} kept at month 12. One customer moves this cohort ${only.one_customer_points.toFixed(1)} points.`);
    }
  } else {
    lines.push(`Base verdict: **${baseVerdict}** (evaluated on the two latest mature cohorts: ${evaluatedCohorts.map((c) => c.quarter).join(" and ")}).`);
    for (const ec of evaluatedCohorts) {
      lines.push(`- **Cohort ${ec.quarter}** (${ec.n} customers):`);
      lines.push(`  - Line test: ${ec.k12} of ${ec.n} (${ec.kept_pct_m12}%) still paying at month 12 against ${Math.round(stopLine * 100)}% stop line: **${ec.line_pass ? "PASS" : "FAIL"}**.`);
      if (!shapeTestSkipped) {
        lines.push(
          `  - Shape test: lost_1_6 = ${ec.lost_1_6} (${ec.n} at start to ${ec.k6} at month 6), lost_7_12 = ${ec.lost_7_12} (${ec.k6} at month 6 to ${ec.k12} at month 12): **${ec.shape_pass ? "PASS" : "FAIL"}**.`
        );
      }
      lines.push(`  - One customer moves this cohort ${ec.one_customer_points.toFixed(1)} points.`);
    }
  }
  lines.push("");

  // 4. The cohort table
  lines.push("## Cohort table");
  lines.push("");
  lines.push("| Signing quarter | Customers | Month 3 | Month 6 | Month 9 | Month 12 | Revenue kept at month 12 (revenue kept at starting fees, no expansion) | Cohort sensitivity |");
  lines.push("|---|---:|---|---|---|---|---|---|");
  for (const c of cohortRows) {
    const revDisplay = c.revenue_kept_month_12.reached && c.revenue_kept_month_12.kept_fee !== null && c.revenue_kept_month_12.pct !== null
      ? `${c.revenue_kept_month_12.pct}% (${formatMoney(c.revenue_kept_month_12.kept_fee)} of ${formatMoney(c.revenue_kept_month_12.starting_fee)}, revenue kept at starting fees, no expansion)`
      : "not reached";
    lines.push(
      `| ${c.quarter} | ${c.n} | ${c.month_3.display} | ${c.month_6.display} | ${c.month_9.display} | ${c.month_12.display} | ${revDisplay} | One customer moves this cohort ${c.one_customer_points.toFixed(1)} points |`
    );
  }
  lines.push("");

  // 5. The groups table
  lines.push("## Groups table");
  lines.push("");
  lines.push(`12-month window: ${windowStart} to ${asOf}. Whole window base: ${wholeBase} customers paying on ${windowStart}; ${wholeLost} of ${wholeBase} lost in window; ${wholeKept} of ${wholeBase} (${wholeBase > 0 ? Math.round(wholeKeptShare * 100) : 0}%) kept on ${asOf}.`);
  lines.push("");
  if (baseVerdict === "HOLD") {
    lines.push("The base fails the stop rule. Nothing beyond a capped test goes to paid, except to a group that passes on its own.");
    lines.push("");
  }
  lines.push("| Group | Type | Window base | Lost in window | Kept in window | Kept share | Share of window losses | Share of window base | Group line test | Losses to fail | Verdict |");
  lines.push("|---|---|---:|---:|---:|---|---|---|---|:---:|---|");
  for (const g of groups) {
    if (g.too_few_customers) {
      lines.push(
        `| ${g.name} | ${g.kind} | ${g.base} | ${g.lost} | ${g.kept} | ${g.kept} of ${g.base} (${g.kept_pct}%) | ${g.lost} of ${wholeLost} (${g.share_of_losses_pct}%) | ${g.base} of ${wholeBase} (${g.share_of_base_pct}%) | too few customers to read | n/a | **NO_VERDICT** (too few customers to read) |`
      );
    } else {
      const lineTestLabel = g.line_pass ? "PASS" : "FAIL";
      const lossesLabel = g.line_pass
        ? `${g.losses_to_fail}${g.lead_not_proof ? " (lead, not proof)" : ""}`
        : "0 (already below line)";
      lines.push(
        `| ${g.name} | ${g.kind} | ${g.base} | ${g.lost} | ${g.kept} | ${g.kept} of ${g.base} (${g.kept_pct}%) | ${g.lost} of ${wholeLost} (${g.share_of_losses_pct}%) | ${g.base} of ${wholeBase} (${g.share_of_base_pct}%) | ${lineTestLabel} | ${lossesLabel} | **${g.verdict}** |`
      );
    }
  }
  lines.push("");

  for (const g of groups) {
    if (g.too_few_customers) {
      lines.push(`- **${g.name}:** ${g.base} customers in window base (under 5): too few customers to read, no verdict.`);
    } else {
      const leadNote = g.lead_not_proof ? ` (${g.losses_to_fail} losses to fail: lead, not proof)` : g.line_pass ? ` (${g.losses_to_fail} losses to fail)` : "";
      lines.push(
        `- **${g.name}:** ${g.kept} of ${g.base} (${g.kept_pct}%) kept, ${g.lost} of ${wholeLost} (${g.share_of_losses_pct}%) of window losses from ${g.base} of ${wholeBase} (${g.share_of_base_pct}%) of window base${leadNote}. Verdict: **${g.verdict}** (${g.verdict_note}).`
      );
    }
    if (g.loses_more_than_share) {
      lines.push(`  - This group loses more than its share: ${g.share_of_losses_pct}% of losses from ${g.share_of_base_pct}% of customers.`);
    }
  }
  lines.push("");

  // 6. Money
  lines.push("## Money");
  lines.push("");
  if (!moneyEnabled || grossMargin === null) {
    lines.push("Gross margin was not provided, so monthly margin, capped LTV, paid payback and capped test opportunity counts are skipped.");
  } else {
    lines.push(`Months seen across all ${rowsUsed} used rows (from ${earliestSigned ?? asOf} to ${asOf}): ${monthsSeen} months. Gross margin: ${Math.round(grossMargin * 100)}%. Payback line: ${paybackLineMonths} months.`);
    lines.push("");
    const moneyRows: MoneySummary[] = [];
    if (groups.length === 1 && groups[0].base === wholeBase) {
      if (wholeBaseMoney) {
        moneyRows.push({ ...wholeBaseMoney, name: "Whole base (one group)" });
      }
    } else {
      if (wholeBaseMoney) moneyRows.push(wholeBaseMoney);
      for (const g of groups) {
        const gm = groupMoneyMap[g.name];
        if (gm) moneyRows.push(gm);
      }
    }

    for (const mr of moneyRows) {
      lines.push(`### ${mr.name} (${mr.kept} of ${mr.base} kept in window)`);
      lines.push(`- Average monthly fee: ${formatMoney(mr.average_monthly_fee)} across ${mr.base} window-base customers`);
      lines.push(`- Monthly margin: ${formatMoney(mr.monthly_margin)} (${formatMoney(mr.average_monthly_fee)} x ${Math.round(grossMargin * 100)}% gross margin)`);
      lines.push(`- Monthly churn (c): ${(mr.monthly_churn * 100).toFixed(2)}% per month (from ${mr.kept} of ${mr.base} kept)`);
      lines.push(`- Months seen: ${mr.months_seen} months`);
      lines.push(`- Capped LTV (${mr.months_seen}-month cap): ${formatMoney(mr.capped_ltv)}`);
      lines.push(`- Required paid CAC for ${paybackLineMonths}-month payback line: ${formatMoney(mr.required_paid_cac)}`);
      if (paidCac !== null && mr.payback_months !== null && mr.ltv_to_paid_cac !== null) {
        lines.push(`- Paid-only CAC: ${formatMoney(paidCac)}; payback months: ${mr.payback_months.toFixed(1)} months; capped LTV to paid CAC: ${mr.ltv_to_paid_cac.toFixed(2)}x`);
      }
      if (blendedCac !== null && mr.ltv_to_blended_cac !== null) {
        lines.push(`- Blended CAC (shown for contrast only, do not use for paid budget decisions): ${formatMoney(blendedCac)}; capped LTV to blended CAC: ${mr.ltv_to_blended_cac.toFixed(2)}x`);
      }
      if (mr.go_count !== null && mr.stop_count !== null && testCap !== null && winRateFloor !== null && winRateTarget !== null) {
        if (mr.stop_count === 0) {
          lines.push(
            `- Capped test opportunity lines: Your test cap of ${formatMoney(testCap)} is too small to read: it pays for fewer than one opportunity at the required paid CAC of ${formatMoney(mr.required_paid_cac)} and the ${Math.round(winRateTarget * 100)}% target win rate. Raise the cap to at least ${formatMoney(mr.required_paid_cac * winRateTarget)} or skip the test.`
          );
        } else {
          lines.push(
            `- Capped test opportunity lines (on ${formatMoney(testCap)} budget at ${Math.round(winRateFloor * 100)}% floor and ${Math.round(winRateTarget * 100)}% target win rates): ${mr.go_count} or more opportunities: run a second capped quarter. ${mr.stop_count} or fewer: stop. In between: fix the list or the message and repeat once.`
          );
        }
      }
      lines.push("");
    }
  }
  lines.push("");

  // 7. The two first drafts
  lines.push("## First draft: responses to each churn reason");
  lines.push("");
  if (useServerFigureNote) {
    lines.push(useServerFigureNote);
    lines.push("");
  }
  lines.push(playbookText);
  lines.push("");

  lines.push("## First draft: churn interview guide");
  lines.push("");
  lines.push(`Call every customer lost in the window: ${wholeLost} customers.`);
  lines.push("");
  lines.push(interviewKitText);
  lines.push("");

  // 8. The handoff strings
  lines.push("## Handoff");
  lines.push("");
  lines.push("Exact strings passed from step 1 (server arithmetic) to step 2 (retention_playbook) and step 3 (customer_interview_kit):");
  lines.push(`- retention_playbook.customer_segment: "${playbookArgs.customer_segment}"`);
  lines.push(`- retention_playbook.business_model: "${playbookArgs.business_model}"`);
  lines.push(`- retention_playbook.current_churn_rate: "${playbookArgs.current_churn_rate}"`);
  lines.push(`- retention_playbook.churn_reasons: "${playbookArgs.churn_reasons}"`);
  lines.push(`- retention_playbook.available_data_signals: "${playbookArgs.available_data_signals}"`);
  lines.push(`- customer_interview_kit.interview_type: "${interviewKitArgs.interview_type}"`);
  lines.push(`- customer_interview_kit.product_context: "${interviewKitArgs.product_context}"`);
  lines.push(`- customer_interview_kit.target_persona: "${interviewKitArgs.target_persona}"`);
  lines.push(`- customer_interview_kit.key_hypotheses: "${interviewKitArgs.key_hypotheses}"`);
  for (let i = 0; i < prefixedHypothesesList.length; i++) {
    lines.push(`- hypothesis_${i + 1}: "${prefixedHypothesesList[i]}"`);
  }
  lines.push("");

  // 9. Dated next steps (from as_of)
  lines.push("## Dated next steps");
  lines.push("");
  lines.push(`- Week 1, by ${day7} (${asOf} + 7 days): share the table and the stop line with whoever signs the paid budget.`);
  lines.push(`- By ${day28} (${asOf} + 28 days): finish the interviews (${wholeLost} customers lost in the window).`);
  lines.push(
    `- At ${day35} (${asOf} + 35 days): start a capped test, but only for a group with CAPPED_TEST (${cappedTestGroups.length > 0 ? cappedTestGroups.join(", ") : "none currently"}).`
  );
  lines.push(`- At ${day90} (${asOf} + 90 days): decide again, and someone signs for keeping any hold.`);
  lines.push("");

  // 10. "Your next action" lines for founder, CEO, CMO, CRO and demand generation head
  lines.push("## Your next action");
  lines.push("");
  lines.push(
    `Founder: By ${day7}, put the cohort table and the ${Math.round(stopLine * 100)}% month-12 stop line in front of everyone who approves budget, and book the ${wholeLost} churn and pause interviews yourself before ${day28}.`
  );
  lines.push(
    `CEO: Hold paid expansion on ${holdGroups.length > 0 ? holdGroups.join(", ") : "any group below the stop line"}, require a named executive signature at ${day90} to keep or lift any hold, and approve paid scale only where the group passes (${scaleGroups.length > 0 ? scaleGroups.join(", ") : "no group passes paid payback today"}).`
  );
  lines.push(
    `CMO: Keep paid acquisition off ${holdGroups.length > 0 ? holdGroups.join(", ") : "groups that fail the stop line"}, and if ${cappedTestGroups.length > 0 ? cappedTestGroups.join(", ") : "a group"} runs a capped test at ${day35}, judge it on cost per sales-accepted opportunity rather than top-line lead volume.`
  );
  lines.push(
    `CRO: Have sales acceptance check every opportunity against the passing group profile, log why each of the ${wholeLost} lost window accounts left by ${day28}, and keep seasonal or failing-group deals out of the capped test count.`
  );
  lines.push(
    `Demand generation head: Build the targeting list for ${cappedTestGroups.length > 0 ? cappedTestGroups.join(", ") : scaleGroups.length > 0 ? scaleGroups.join(", ") : "the passing group only"} from pre-signup signals before ${day35}, track all-in cost per opportunity against the payback line, and stop the test if opportunity counts land at or below the stop count.`
  );
  lines.push("");
  lines.push("## Reading the answer");
  lines.push("");
  lines.push(
    `The conclusion needs review if younger cohorts cross 12 months of history after ${asOf}, if paused or stopped accounts resume payment, or if audited paid CAC and gross margin differ from the figures supplied (${rowsUsed} of ${rowsReceived} customer rows used).`
  );

  const finalText = stripDashes(lines.join("\n"));

  const structuredContent: Record<string, unknown> = {
    as_of: asOf,
    billing_term: billingTerm,
    stop_line: stopLine,
    stop_line_is_default: stopLineIsDefault,
    payback_line_months: paybackLineMonths,
    payback_line_is_default: paybackLineIsDefault,
    echo: {
      rows_received: rowsReceived,
      rows_used: rowsUsed,
      rows_rejected: rejectedRows.length,
      paying_on_as_of: payingOnAsOfCount,
      mrr_on_as_of: mrrOnAsOf,
      earliest_signed: earliestSigned,
      latest_signed: latestSigned,
    },
    rejected_rows: rejectedRows,
    pending_customers: pendingCustomers,
    paused_customers: pausedCustomers,
    stop_rule: {
      base_verdict: baseVerdict,
      mature_cohort_count: matureCohorts.length,
      shape_test_skipped: shapeTestSkipped,
      evaluated_cohorts: evaluatedCohorts,
    },
    cohorts: cohortRows,
    window: {
      start: windowStart,
      end: asOf,
      base: wholeBase,
      lost: wholeLost,
      kept: wholeKept,
      kept_share: wholeKeptShare,
      loss_share: wholeLossShare,
    },
    groups,
    money: {
      enabled: moneyEnabled,
      gross_margin: grossMargin,
      months_seen: monthsSeen,
      paid_cac: paidCac,
      blended_cac: blendedCac,
      test_cap: testCap,
      win_rate_floor: winRateFloor,
      win_rate_target: winRateTarget,
      whole_base: wholeBaseMoney,
      by_group: groupMoneyMap,
    },
    metrics_check: {
      items: metricNotes,
      disagreement: metricDisagreement,
      implied_annual_retention_pct: impliedAnnualRetentionPct,
      reported_annual_retention_pct: reportedAnnualRetentionPct,
      note: metricDisagreementNote,
    },
    handoff: {
      retention_playbook: {
        ...playbookArgs,
        server_loss_share_pct: serverLossSharePct,
        playbook_yearly_loss_pct: playbookYearlyLossPct,
        use_server_figure_note: useServerFigureNote,
      },
      customer_interview_kit: {
        ...interviewKitArgs,
        hypotheses_list: prefixedHypothesesList,
        lost_to_call: wholeLost,
      },
    },
    next_steps: {
      week_1_date: day7,
      interviews_done_date: day28,
      capped_test_start_date: day35,
      decide_again_date: day90,
      capped_test_groups: cappedTestGroups,
    },
  };

  return {
    text: finalText,
    structuredContent,
    content: [{ type: "text", text: finalText }],
    toString() {
      return finalText;
    },
  };
}

export const scalePaidCheck = generateScalePaidCheck;
export const scale_paid_check = generateScalePaidCheck;
export default generateScalePaidCheck;
