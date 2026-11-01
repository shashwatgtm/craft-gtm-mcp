import { type Row } from "./reserve-common.js";
export declare function eventPortfolio(a: Row): {
    capacity: any;
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
    decision: any;
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