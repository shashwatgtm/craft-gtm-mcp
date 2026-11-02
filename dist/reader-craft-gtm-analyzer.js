import { fact } from './reader-case.js';
export function case_craft_gtm_analyzer(args) {
    const goal = fact(args, "desired_outcome", "the proposed decision");
    const target = fact(args, "document_content", "the customer target in the plan", new RegExp("paid customers|customer target", 'i'));
    const capacity = fact(args, "document_content", "the delivery capacity in the plan", new RegExp("onboard|capacity", 'i'));
    const conversion = fact(args, "document_content", "the conversion evidence in the plan", new RegExp("conversion|demo to sale", 'i'));
    const budget = fact(args, "document_content", "the budget in the plan", new RegExp("budget|\\$.*(?:events|outreach)", 'i'));
    return {
        meaning: `This review supports a list of planning gaps, not approval of the growth target. Compare sales throughput and onboarding capacity over the same agreed period before choosing ${goal}.`,
        change: `the observed conversion, available selling weeks, delivery capacity or pilot acceptance condition changes`,
        roles: [
            `Founder: resolve ${goal} by asking the plan owner to show which assumption makes the customer target feasible; keep approval open until that calculation is reviewed.`,
            `CEO: ask the delivery owner to reconcile ${capacity} with ${target}; approve only the volume that can be onboarded in the agreed period.`,
            `CMO: check ${budget} with the budget owner against the cost and timing of the proposed channels before committing spend.`,
            `CRO: verify ${conversion} against completed deals, then calculate demos needed for ${target}; a small sample is not a forecast.`,
            `Demand generation head: work backwards from ${target} to required qualified demos; compare with the sales team's accepted weekly capacity before adding outreach.`,
        ],
    };
}
//# sourceMappingURL=reader-craft-gtm-analyzer.js.map