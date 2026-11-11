export interface SegmentInput {
    name: string;
    acv?: number;
    sales_cycle_days?: number;
    accounts?: number;
    deal_source?: string;
    cac?: number;
    logo_retention_percent?: number;
    gross_retention_percent?: number;
    net_retention_percent?: number;
    monthly_logo_churn_percent?: number;
    pricing_unit_in_writing?: string;
    pricing_unit?: "seat" | "usage" | "hybrid";
    seat_share_of_acv_percent?: number;
    what_customers_can_cut?: string;
    icp_match_percent?: number;
    year_one_share_percent?: number;
    win_rate_percent?: number;
    year_one_customer_target?: number;
    seller_ramp_months?: number;
    seller_loaded_cost_per_year?: number;
    ramped_deals_per_seller_per_year?: number;
    monthly_qualified_demand?: number;
    seat_cut_percent?: number;
    arr_share_cutting_percent?: number;
    seats_per_account?: number;
    work_units_per_seat_per_year?: number;
    buyer_cost_per_seat_per_year?: number;
    usage_price_per_unit?: number;
    run_cost_per_unit?: number;
    gross_retention_gate_percent?: number;
    net_retention_gate_percent?: number;
    logo_retention_gate_percent?: number;
    churn_reasons?: string;
    motion_lead?: string;
    motion_score?: number;
    motion_reason?: string;
    sizing_tam?: number;
    sizing_sam?: number;
    sizing_som?: number;
    sizing_year_one_customers?: number;
}
export interface SegmentCheckInput {
    product: string;
    gross_margin_percent?: number;
    tracks_expansion?: boolean;
    business_stage?: string;
    industry?: string;
    segments: SegmentInput[];
    confirmed?: {
        segment_split?: boolean;
        win_rate?: boolean;
        seat_cut?: boolean;
    };
}
export interface SegmentCheckResult {
    text: string;
    structuredContent: Record<string, unknown>;
    isError?: boolean;
}
export type PricingUnit = "seat" | "usage" | "hybrid" | "unclear";
/** Payback months on CAC and ARR: CAC over one month of the contract's yearly revenue. The owner's lead measure. */
export declare function paybackMonths(cac: number, arr: number): number;
/** The same payback on gross profit: CAC over one month of yearly revenue times gross margin. Shown second. */
export declare function paybackMonthsOnGrossProfit(cac: number, arr: number, marginShare: number): number;
/** Sum of r^t for t = 0 to years - 1: how many "first years" of revenue a customer gives over the period. */
export declare function retainedYears(retentionShare: number, years: number): number;
/** Cumulative gross profit per dollar of CAC by the end of a year, undiscounted, at one flat yearly retention. */
export declare function grossProfitPerCacDollar(acv: number, marginShare: number, cac: number, retentionShare: number, years: number): number;
/** The first year (2 to maxYears) in which the year one leader no longer leads. Null when the lead holds. */
export declare function leadChangeYear(valueA: (years: number) => number, valueB: (years: number) => number, maxYears?: number): {
    firstLeader: "a" | "b" | "tie";
    changeYear: number | null;
};
/** The CAC at which a segment's cumulative gross profit per CAC dollar falls to another figure. */
export declare function cacWhereLeadIsGone(acv: number, marginShare: number, retentionShare: number, years: number, otherValue: number): number;
export interface SellerCapacity {
    cycleMonths: number;
    sellingMonths: number;
    dealsYearOne: number | null;
    acvBooked: number | null;
    paybackOnSellerCostMonths: number | null;
}
/** What one new seller closes in year one after ramp and one sales cycle (guide 01's sum). */
export declare function sellerCapacity(rampMonths: number, cycleDays: number, rampedDealsPerYear: number | undefined, acv: number | undefined, loadedCost: number | undefined, marginShare: number | undefined): SellerCapacity;
/** Renewal value of one account after a share of seats is cut. seatShare is the part of the contract billed on seats. */
export declare function renewalAfterSeatCut(acv: number, seatCutShare: number, seatShare: number): number;
/** Points of gross (and net) retention lost when accounts holding a share of ARR each cut a share of seats. */
export declare function retentionPointsLost(arrShareCutting: number, seatCutShare: number, seatShare: number): number;
/** Read seat, usage or hybrid from a written pricing sentence. A unit that is only mentioned to deny it does not count. */
export declare function readPricingUnit(sentence: string | undefined): PricingUnit;
export declare function generateSegmentCheck(input: SegmentCheckInput): SegmentCheckResult;
//# sourceMappingURL=segment-check.d.ts.map