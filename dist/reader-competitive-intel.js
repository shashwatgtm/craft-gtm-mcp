import { fact } from './reader-case.js';
export function case_competitive_intel(args) {
    const alternatives = fact(args, "competitors", "the buyer's current alternatives");
    const strength = fact(args, "your_strengths", "the proposed strength");
    const objection = fact(args, "common_objections", "the buyer's objection");
    const product = fact(args, "your_product", "the proposed product");
    return {
        meaning: `This comparison supports buyer tests of ${alternatives}. The proposed strengths remain claims, including any explicitly unmeasured result. A comparison table does not establish superiority.`,
        change: `the buyer observes a different result under the same workload or confirms a different switching constraint`,
        roles: [
            `Founder: ask the product owner to demonstrate ${strength} with a recorded before and after task; hold any advantage claim without that evidence.`,
            `CEO: ask the delivery owner to cost the disruption in ${objection}; agree a reversible trial before approving a switch.`,
            `CMO: compare ${strength} with the original source and its measurement limits before putting the claim in copy.`,
            `CRO: ask the buyer to test each option in ${alternatives} separately on the same task and acceptance measure; record where the current option wins.`,
            `Demand generation head: use ${objection} to screen a small account sample with sales; check whether the objection recurs before changing targeting.`,
        ],
    };
}
//# sourceMappingURL=reader-competitive-intel.js.map