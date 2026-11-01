import { type Row } from "./reserve-common.js";
export declare function motionScore(a: Row): {
    mode: string;
    scores: Row;
    scoreLabel: string;
    primary: string | null;
    primaryLabel: any;
    secondaryTies: string[];
    secondary: string | null;
    topTies: string[];
    tieDecision: string;
    clustered: boolean;
    referralOverride: boolean;
    industryCap: boolean;
    trace: Row[];
    missing: string[];
    warnings: string[];
    actions: any[];
    stopReview: any;
    ruleNote: string;
};
//# sourceMappingURL=motion.d.ts.map