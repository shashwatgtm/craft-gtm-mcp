/** Deterministic metric reader. Never score a target, negation or conflicting pair as an observed fact. */
export interface MetricReading {
    values: Record<string, number>;
    currencies: Record<string, string>;
    evidence: string[];
    issues: string[];
    retentionIsNet: boolean;
    retentionBasis?: 'logo' | 'gross_revenue' | 'net_revenue' | 'unspecified';
    churnMonths?: number;
}
export declare function readPMFMetrics(rawInput: string): MetricReading;
//# sourceMappingURL=pmf-metrics.d.ts.map