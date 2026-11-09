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
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
    toString(): string;
}
/** Pure calendar check: returns the number of days in (year, month) where month is 1..12. */
export declare function daysInMonth(year: number, month: number): number;
/** Checks whether s is a real calendar YYYY-MM-DD date without calling new Date(). */
export declare function isRealDate(s: unknown): s is string;
/**
 * Spec Section 3:
 * add_months(d, m): the same day number m calendar months later.
 * If that day does not exist, use the last day of that month.
 */
export declare function addMonths(d: string, m: number): string;
/**
 * Spec Section 3:
 * Quarter of a date: YYYY-Qn. The quarter ends on 31 Mar, 30 Jun, 30 Sep or 31 Dec.
 */
export declare function quarterOf(d: string): string;
/**
 * Spec Section 3:
 * months_between(a, b): whole calendar months from a to b, counted by add_months, with a <= b.
 */
export declare function monthsBetween(a: string, b: string): number;
/** Pure proleptic Gregorian day number from YYYY-MM-DD (never calls Date.now() or new Date()). */
export declare function toDayNumber(d: string): number;
export declare function daysBetween(a: string, b: string): number;
/** Adds whole days to a YYYY-MM-DD string using pure calendar arithmetic. */
export declare function addDays(d: string, deltaDays: number): string;
export declare function generateScalePaidCheck(input: ScalePaidCheckInput): ScalePaidCheckResult;
export declare const scalePaidCheck: typeof generateScalePaidCheck;
export declare const scale_paid_check: typeof generateScalePaidCheck;
export default generateScalePaidCheck;
//# sourceMappingURL=scale-paid-check.d.ts.map