import { type Row } from "./reserve-common.js";
export declare function eventPortfolio(a: Row): {
    rows: any;
    plannedAccepted: number | null;
    totalCost: number | null;
    neededFromEvents: number | null;
    gap: number | null;
    blendedCost: number | null;
    backward: Row | null;
    missing: string[];
    timeline: any;
    stage: any;
    currency: any;
    period: any;
    decision: string;
    sharedPlan: {
        phase: string;
        task: string;
        owner: string;
        date: string;
    }[];
    unverified: string[];
    handoffs: string[];
};
//# sourceMappingURL=event.d.ts.map