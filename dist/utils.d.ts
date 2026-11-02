/** Inline label: on the same line as the example figure. */
export declare const EXAMPLE_FIGURE = "(Example figure: replace with your own)";
/** Block label: a line of its own directly above a table or list of example figures. */
export declare const EXAMPLE_FIGURES = "Example figures: replace with your own.";
/** Footer for any output that suggests timings, lengths or counts. */
export declare const SUGGESTION_FOOTER = "Suggested timings, lengths and counts: adjust them to your own.";
export declare function lowerFirstIfCommon(phrase: string): string;
export declare function lowerCommonWords(phrase: string): string;
export declare function cap(phrase: string): string;
/** Readable form of an enum value: "small_2_5" becomes "small (2 to 5)"; other values lose their underscores. */
export declare function readableChoice(value: string): string;
/** The user's choice in readable form or, when it was not supplied, the value the tool assumes, marked as assumed. */
export declare function describeChoice(supplied: string | undefined, assumed: string): string;
export interface ParsedMetrics {
    mrr?: number;
    arr?: number;
    churn?: number;
    nps?: number;
    cac?: number;
    ltv?: number;
    ltvCacRatio?: number;
    retentionRate?: number;
    activationRate?: number;
    referralRate?: number;
    revenueGrowth?: number;
    dau?: number;
    mau?: number;
    dauMauRatio?: number;
    trialConversion?: number;
    expansionRevenue?: number;
    timeToValue?: number;
    acv?: number;
    retentionIsNet?: boolean;
    raw: string;
}
export declare function parseMetrics(metricsText: string): ParsedMetrics;
export declare function pct(n: number): string;
export declare function roundTypedPercents(text: string): string;
export declare function scoreMetric(value: number | undefined, benchmarks: {
    low: number;
    medium: number;
    high: number;
}, higherIsBetter?: boolean, shown?: string, unit?: string): {
    score: number;
    label: string;
    analysis: string;
};
export declare function calculateDaysUntil(targetDate: string): number;
export declare function formatDate(date: Date): string;
export declare function addDays(date: Date, days: number): Date;
export declare function parseListItems(text: string): string[];
export interface CRAFTDimension {
    found: string[];
    score: number;
    gaps: string[];
    evidence: string[];
    groupsFound: string[];
    groupsMissing: string[];
}
export interface CRAFTAnalysis {
    character: CRAFTDimension;
    result: CRAFTDimension;
    artifact: CRAFTDimension;
    frame: CRAFTDimension;
    timeline: CRAFTDimension;
    timelineWords: string[];
    risks: Array<{
        line: string;
        answered: boolean;
    }>;
}
export declare function isAudienceTarget(label: string, text: string): boolean;
export declare function isCustomerCountGoal(label: string, text: string): boolean;
export declare function isMarketLine(line: string): boolean;
export declare function planSegments(content: string): string[];
export declare function analyzeCRAFTDimensions(content: string): CRAFTAnalysis;
/**
 * Figures in a metrics text that no scoring rule reads. The text is split by line, semicolon and comma (not inside a number);
 * a piece that holds a digit but none of the metric words the parser knows is returned, so the answer can name it as not scored.
 */
export declare function unscoredFigures(metricsText: string): string[];
//# sourceMappingURL=utils.d.ts.map