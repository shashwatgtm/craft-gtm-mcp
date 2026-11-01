/** A list typed by the user: one item per line or per semicolon; a comma run of short items is split too. A long clause with commas stays whole. */
export declare function typedList(text: unknown): string[];
/** The product text read as a name and a description. A name is found only where the text names it ("Name: what it does", "Name, a description"); otherwise the product is "your solution". */
export declare function productParts(text: string): {
    name: string | null;
    desc: string;
    wrapped: boolean;
};
export declare function writeLaunchPlan(args: {
    product_feature: string;
    launch_type: string;
    target_segments: string;
    goals: string;
    launch_date?: string;
    available_channels?: string;
    team_size?: string;
    budget_level?: string;
    business_model?: string;
    industry?: string;
    your_sector?: string;
}): string;
export declare function writeRetentionPlaybook(args: {
    customer_segment: string;
    business_model: string;
    current_churn_rate: string;
    churn_reasons?: string;
    available_data_signals?: string;
    cs_team_size?: string;
    current_interventions?: string;
    product?: string;
    industry?: string;
    your_sector?: string;
}): string;
export declare function writeCrisisPlan(args: {
    company: string;
    industry: string;
    your_sector?: string;
    customer_base: string;
    data_sensitivity: string;
    potential_crises?: string;
    company_size?: string;
    compliance_requirements?: string;
    business_model?: string;
}): string;
//# sourceMappingURL=rw-launch.d.ts.map