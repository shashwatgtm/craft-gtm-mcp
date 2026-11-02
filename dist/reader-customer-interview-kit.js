import { fact } from './reader-case.js';
export function case_customer_interview_kit(args) {
    const hypothesis = fact(args, "product_context", "the proposed customer hypothesis");
    const persona = fact(args, "target_persona", "the intended interview participant");
    const type = fact(args, "interview_type", "the interview purpose");
    return {
        meaning: `These questions support testing ${hypothesis}. They are not customer observations, and a small interview sample cannot establish prevalence.`,
        change: `a recent customer example contradicts the hypothesis or identifies a different owner of the work`,
        roles: [
            `Founder: ask the researcher to seek an example that contradicts ${hypothesis}; decide what evidence would end this investigation before collecting more favourable stories.`,
            `CEO: confirm the decision and research time allowed for ${type} with the research owner; review evidence before funding a wider intervention.`,
            `CMO: recruit people matching ${persona} and people who rejected the approach; check that the sample is not only enthusiastic customers.`,
            `CRO: ask ${persona} to walk through the last relevant case and who approved it; record the actual step that stalled, not a suggested answer.`,
            `Demand generation head: test invitations for ${persona} with the researcher; check role and recent experience before counting a completed interview.`,
        ],
    };
}
//# sourceMappingURL=reader-customer-interview-kit.js.map