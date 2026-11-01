/** Deterministic metric reader. Never score a target, negation or conflicting pair as an observed fact. */
export interface MetricReading {
    values: Record<string, number>;
    evidence: string[];
    issues: string[];
    retentionIsNet: boolean;
    churnMonths?: number;
}
export declare function readPMFMetrics(raw: string): MetricReading;
//# sourceMappingURL=pmf-metrics.d.ts.map