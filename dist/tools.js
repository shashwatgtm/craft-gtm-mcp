import { MODEL_CHOICES, SECTOR_CHOICES } from "./context.js";
// Run 19 (D80): the optional business_model input is the same in every tool that reads a business model from the inputs.
const businessModelProp = {
    type: "string",
    description: "Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it. Format is text using one of the listed labels. For example, \"saas\".",
    enum: MODEL_CHOICES
};
// Run 42B: the seller's own industry, named by the user. It decides the sector notes; no reading of the text can override it.
const yourSectorProp = {
    type: "string",
    description: "Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. Format is text using one of the listed labels. For example, \"logistics_tech\".",
    enum: [...Object.keys(SECTOR_CHOICES), "other"]
};
// Run 19 (D80, problem 8): the sector can be named, so the answer uses that sector's buyers, measures and objections.
const industryProp = {
    type: "string",
    description: "Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read. Format is text using one of the listed labels. For example, \"logistics_tech\".",
    enum: [...Object.keys(SECTOR_CHOICES), "other"]
};
export const tools = [
    {
        name: "pmf_scorecard",
        description: "Helps you decide whether you have product market fit and whether to scale: it takes your product, target market and current metrics (MRR, ACV, churn, NPS, CAC, LTV, retention, activation and similar) and returns a scorecard that scores each dimension against example benchmark ranges. It also gives priority actions and the data gaps to fill, reads the business model from your inputs, leaves the activation score out for services, connectivity and investment businesses, and quotes and answers your customer feedback. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of scale_paid_check when you need a broad PMF assessment against the tool's example benchmarks.",
        inputSchema: {
            type: "object",
            properties: {
                product: { type: "string", description: "Product name and brief description. Format is text. For example, \"invoice review service\"." },
                target_market: {
                    type: "string",
                    description: "Benchmark segment for scoring (for example enterprise SaaS, telecom or logistics tech). Ask the user to confirm it when it differs from the product description. The selected benchmark and its stated fallback ranges are used; the output explains conflicts. The separate sector choice controls sector notes. Format is text using one of the listed labels.",
                    enum: ["enterprise_saas", "smb_saas", "consumer", "marketplace", "fintech", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"]
                },
                current_metrics: {
                    type: "string",
                    description: "Your current metrics, written as text (the tool reads the figures from it). Include any of: MRR, ARR, ACV, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%'. A figure that no rule scores is listed as not scored. Format is text."
                },
                time_in_market: {
                    type: "string",
                    description: "How long the product has been in market (shown in the scorecard). Format is text using one of the listed labels. For example, \"pre_launch\".",
                    enum: ["pre_launch", "0_6_months", "6_12_months", "1_2_years", "2_plus_years"]
                },
                customer_feedback: {
                    type: "string",
                    description: "Optional: Qualitative feedback themes, one per line or separated by semicolons (for example 'Customers like X; they struggle with Y'). Each theme is quoted and answered. Format is text."
                },
                business_model: businessModelProp,
                your_sector: yourSectorProp
            },
            required: ["product", "target_market", "current_metrics"]
        }
    },
    {
        name: "launch_commander",
        description: "Helps you decide your launch plan: it takes what you are launching, the launch type, your target segments and your goals, and returns a phased launch plan with tasks, a messaging table and success metrics. Give a date for a dated timeline, or 'TBD' or a quarter such as 'Q2 2027' for a flexible plan. Tasks and messaging follow the sector and business model read from your inputs, and each goal is filed under its own metric. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of craft_gtm_analyzer when you need to create a launch plan from a product, segments and goals.",
        inputSchema: {
            type: "object",
            properties: {
                product_feature: { type: "string", description: "What you're launching (product/feature name and description). Format is text. For example, \"invoice review service\"." },
                launch_date: { type: "string", description: "Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2027', 'March 2027', or 'TBD' for planning mode. Format is text in YYYY-MM-DD form. For example, \"2026-11-17\"." },
                launch_type: {
                    type: "string",
                    description: "Type of launch determines plan complexity. Format is text using one of the listed labels. For example, \"major_release\".",
                    enum: ["major_release", "feature_launch", "beta_launch", "product_update", "market_expansion"]
                },
                target_segments: { type: "string", description: "Target customer segments (comma-separated). Format is text. For example, \"manufacturers with 200 to 500 employees\"." },
                goals: { type: "string", description: "Launch success metrics (for example '40 qualified meetings, $300K pipeline, 5 reference customers'). Format is text." },
                available_channels: {
                    type: "string",
                    description: "Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community'. Format is text."
                },
                team_size: {
                    type: "string",
                    description: "Marketing/GTM team size affects task distribution. Format is text using one of the listed labels. For example, \"solo\".",
                    enum: ["solo", "small_2_5", "medium_6_15", "large_15_plus"]
                },
                budget_level: {
                    type: "string",
                    description: "Budget affects recommended tactics. Format is text using one of the listed labels. For example, \"bootstrap\".",
                    enum: ["bootstrap", "moderate", "well_funded"]
                },
                business_model: businessModelProp,
                industry: industryProp,
                your_sector: yourSectorProp
            },
            required: ["product_feature", "launch_type", "target_segments", "goals"]
        }
    },
    {
        name: "customer_interview_kit",
        description: "Helps you decide what to ask customers to test your hunch: it takes the interview type, the product context and the person you are interviewing, and returns an interview guide that fits the interview type, the sector and the product complexity. Questions use the sector's own language (the sector is chosen, or read from your inputs), your hypotheses are kept whole, and synthesis templates are included. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of icp_interview_synthesizer when you need questions and synthesis templates before conducting interviews.",
        inputSchema: {
            type: "object",
            properties: {
                interview_type: {
                    type: "string",
                    enum: ["discovery", "validation", "feedback", "churn", "win_loss", "persona_research"],
                    description: "Type of interview determines question focus. Format is text using one of the listed labels. For example, \"discovery\"."
                },
                product_context: { type: "string", description: "Product/service being researched. Format is text. For example, \"checks invoice exceptions before approval\"." },
                industry: {
                    type: "string",
                    description: "Industry affects terminology and context. Leave it out and the sector is read from your other inputs. Format is text using one of the listed labels. For example, \"saas\".",
                    enum: ["saas", "fintech", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "ecommerce", "marketplace", "enterprise_software", "consumer", "other"]
                },
                product_complexity: {
                    type: "string",
                    description: "Affects technical depth of questions. Format is text using one of the listed labels. For example, \"simple\".",
                    enum: ["simple", "moderate", "complex", "highly_technical"]
                },
                target_persona: { type: "string", description: "Who you're interviewing (role/title). Format is text. For example, \"finance director\"." },
                key_hypotheses: { type: "string", description: "Optional: Hypotheses to validate during interview, one per line or separated by semicolons. Format is text. For example, \"confirm who approves invoice exceptions\"." },
                business_model: businessModelProp,
                your_sector: yourSectorProp
            },
            required: ["interview_type", "product_context", "target_persona"]
        }
    },
    {
        name: "retention_playbook",
        description: "Helps you decide why customers leave and what to do about each reason: it takes your customer segment, business model and current churn rate, and returns a retention playbook with health signals, interventions and an email draft for each churn reason. If you do not know why customers leave, leave the churn reasons out and you get a churn discovery kit instead. Your current interventions and data signals are used when you give them. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of scale_paid_check when you need interventions and email drafts for supplied churn reasons.",
        inputSchema: {
            type: "object",
            properties: {
                customer_segment: { type: "string", description: "Customer segment to focus on. Format is text. For example, \"manufacturers with 200 to 500 employees\"." },
                business_model: {
                    type: "string",
                    description: "Business model affects health score weighting. enterprise_contract is read further from your text when it names services, connectivity or investment. Format is text using one of the listed labels. For example, \"saas_subscription\".",
                    enum: ["saas_subscription", "usage_based", "marketplace", "transactional", "freemium", "enterprise_contract", "services_contract", "connectivity_contract", "investment_mandate"]
                },
                current_churn_rate: { type: "string", description: "Current churn rate (e.g., '5%' or '5% monthly'). Format is text." },
                churn_reasons: {
                    type: "string",
                    description: "Optional: known churn reasons, comma-separated. If you do not know them, leave this blank and you get a churn discovery kit with a framework for finding the reasons. Format is text. For example, \"implementation delays and unclear ownership\"."
                },
                available_data_signals: {
                    type: "string",
                    description: "What you can track (comma-separated). E.g., 'login frequency, support tickets, SLA attainment, QBR attendance'. Format is text."
                },
                cs_team_size: {
                    type: "string",
                    description: "CS team capacity affects intervention strategy. Format is text using one of the listed labels. For example, \"no_dedicated_cs\".",
                    enum: ["no_dedicated_cs", "small_1_3", "medium_4_10", "large_10_plus"]
                },
                current_interventions: { type: "string", description: "Optional: What retention tactics you already do (listed and compared with the playbook). Format is text. For example, \"schedule an exception review with the finance owner\"." },
                product: { type: "string", description: "Optional: Your product or company name, used in the title and the email drafts. Format is text. For example, \"invoice review service\"." },
                industry: industryProp,
                your_sector: yourSectorProp
            },
            required: ["customer_segment", "business_model", "current_churn_rate"]
        }
    },
    {
        name: "partner_architect",
        description: "Helps you decide what partner program to run and how to start it: it takes your company, product, partner model, partner goal and deal size, and returns a partner program with tiers, example commission amounts and KPIs. The structure differs for resellers, referrals, integrations, agencies, affiliates and white label, uses your existing partners when given, and names the partner types that fit your sector's buying committee. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of launch_commander when you need a partner program with tiers, commissions and KPIs.",
        inputSchema: {
            type: "object",
            properties: {
                company: { type: "string", description: "Your company name. Format is text. For example, \"invoice review service\"." },
                product: { type: "string", description: "Product partners will sell/integrate. Format is text. For example, \"invoice review service\"." },
                partner_model: {
                    type: "string",
                    description: "Partner type determines program structure. Format is text using one of the listed labels. For example, \"reseller\".",
                    enum: ["reseller", "referral", "integration_tech", "agency_si", "affiliate", "oem_white_label"]
                },
                partner_goals: { type: "string", description: "Revenue/growth targets from partners (shown as the target of the first KPI row). Format is text. For example, \"recruit three implementation partners in six months\"." },
                your_deal_size: {
                    type: "string",
                    description: "Average deal size as one amount (e.g., '$5000 ACV', '$5K' or '$500/month'; a range is refused). It scales the example commission amounts; the example rates are fixed. Format is text."
                },
                partner_support_capacity: {
                    type: "string",
                    description: "How much partner support can you provide? Format is text using one of the listed labels. For example, \"minimal_self_serve\".",
                    enum: ["minimal_self_serve", "moderate", "high_touch"]
                },
                existing_partners: { type: "string", description: "Optional: Current partner types/count, one per line or separated by semicolons (listed in the plan). Format is text. For example, \"regional implementation partners\"." },
                business_model: businessModelProp,
                industry: industryProp,
                your_sector: yourSectorProp
            },
            required: ["company", "product", "partner_model", "partner_goals", "your_deal_size"]
        }
    },
    {
        name: "crisis_planner",
        description: "Helps you decide who does what when a crisis hits: it takes your company, industry, customer base and data sensitivity, and returns crisis playbooks with a response team and notification steps for each crisis. Name the crises you know of to get those playbooks; without them it uses a default set of common crises for your sector, not ranked by likelihood. Each compliance item you list is used in the notification steps. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of retention_playbook when you need response roles and notification steps for operational crises.",
        inputSchema: {
            type: "object",
            properties: {
                company: { type: "string", description: "Company name. Format is text. For example, \"invoice review service\"." },
                industry: {
                    type: "string",
                    description: "Industry affects which crises to prioritize. Format is text using one of the listed labels. For example, \"fintech\".",
                    enum: ["fintech", "saas", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "ecommerce", "enterprise", "consumer", "other"]
                },
                customer_base: {
                    type: "string",
                    description: "Customer type affects communication approach. Format is text using one of the listed labels. For example, \"b2b_enterprise\".",
                    enum: ["b2b_enterprise", "b2b_smb", "b2c_consumer", "mixed"]
                },
                data_sensitivity: {
                    type: "string",
                    description: "Data sensitivity affects security protocols. Format is text using one of the listed labels. For example, \"high_pii_financial\".",
                    enum: ["high_pii_financial", "medium_business_data", "low_general"]
                },
                potential_crises: {
                    type: "string",
                    description: "Optional: crisis types to plan for, comma-separated. If not provided, the tool uses a default set of common crises for your sector (not ranked by likelihood). Options: data_breach, service_outage, sla_breach, regulatory_action, fraud_incident, ai_wrong_action, pr_incident, executive_departure, security_vulnerability, customer_data_exposure, product_safety. Format is text. For example, \"service outage during month-end close\"."
                },
                company_size: {
                    type: "string",
                    description: "Affects response team structure. Format is text using one of the listed labels. For example, \"startup_under_50\".",
                    enum: ["startup_under_50", "scaleup_50_200", "midsize_200_1000", "enterprise_1000_plus"]
                },
                compliance_requirements: { type: "string", description: "Optional: Relevant compliance, comma-separated (for example ISO 27001, SOC 2, GDPR). Each item is named in the notification steps. Format is text." },
                business_model: businessModelProp,
                your_sector: yourSectorProp
            },
            required: ["company", "industry", "customer_base", "data_sensitivity"]
        }
    },
    {
        name: "competitive_intel",
        description: "Helps you decide how to win against each competitor: it takes your product and the competitors you name, and returns one battle card per competitor built from your strengths, weaknesses, competitor details, objections, wins and losses. Each competitor detail goes to the competitor it names, each objection gets its own answer, and strengths and gaps taken from wins and losses stay in your own words. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of competitive_trap_setter when you need complete battle cards across the competitors you supply.",
        inputSchema: {
            type: "object",
            properties: {
                your_product: { type: "string", description: "Your product name and brief description. Format is text. For example, \"invoice review service\"." },
                competitors: {
                    type: "string",
                    description: "Competitor names, comma-separated. You get one battle card for each competitor named. Format is text. For example, \"the current manual review process\"."
                },
                your_strengths: {
                    type: "string",
                    description: "Optional: what you do better, comma-separated. Taken from your wins, in your own words, if not provided. Format is text. For example, \"checks invoice exceptions before approval\"."
                },
                your_weaknesses: {
                    type: "string",
                    description: "Optional: where competitors beat you, comma-separated. Taken from your losses, in your own words, if not provided. Format is text. For example, \"handoffs require manual reconciliation\"."
                },
                competitor_details: {
                    type: "string",
                    description: "Optional: Any known details about competitors, one per line or separated by semicolons. E.g., 'Competitor A is cheaper; Competitor B targets enterprise'. Each detail goes to the competitor it names. Format is text."
                },
                common_objections: {
                    type: "string",
                    description: "Sales objections you hear (comma-separated). E.g., 'too expensive, missing X feature, competitor has better Y'. Format is text."
                },
                recent_wins: { type: "string", description: "Why customers chose you over competitors: used as your strengths when none are given. Format is text. For example, \"finance teams chose the documented exception process\"." },
                recent_losses: { type: "string", description: "Why you lost deals to competitors: used as your gaps when none are given. Format is text. For example, \"two deals paused after budget review\"." },
                business_model: businessModelProp,
                industry: industryProp,
                your_sector: yourSectorProp
            },
            required: ["your_product", "competitors"]
        }
    },
    {
        name: "craft_gtm_analyzer",
        description: "Helps you decide whether a GTM plan is clear enough to run: it takes the text of a GTM document or plan and returns a score for each CRAFT dimension, based only on what the plan contains. Timeline counts real dates, durations and quarters; the answer shows the plan's own line for each dimension, names only the elements that are missing and suggests sections to add. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of launch_commander when you already have a GTM document to assess against CRAFT.",
        inputSchema: {
            type: "object",
            properties: {
                document_content: {
                    type: "string",
                    description: "The GTM document or plan to analyze. Paste the full text: the tool reads it and scores it against the framework. Format is text. For example, \"Launch invoice review services for manufacturers over six weeks, with a finance owner and weekly exception reviews.\"."
                },
                document_type: {
                    type: "string",
                    description: "Type of document (shown in the analysis). Format is text using one of the listed labels. For example, \"gtm_strategy\".",
                    enum: ["gtm_strategy", "launch_plan", "campaign_brief", "quarterly_plan", "project_proposal", "marketing_plan"]
                },
                intended_audience: { type: "string", description: "Optional: Who will read/approve this document. Format is text. For example, \"finance leaders at manufacturers\"." },
                desired_outcome: { type: "string", description: "Optional: What action should this document drive. Format is text. For example, \"resolve invoice exceptions before month-end\"." },
                industry: industryProp,
                your_sector: yourSectorProp
            },
            required: ["document_content", "document_type"]
        }
    },
    {
        name: "scale_paid_check",
        description: "Helps you decide whether to scale paid now: it takes your customer list (signing date, segment, monthly fee and any stop or return dates) and your churn reasons, and returns, for each customer group, scale, run a capped test, or hold, with the counts behind it, the stop rule, payback, a first draft response to each churn reason and a churn interview guide. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of pmf_scorecard when you need a paid-growth decision grounded in customer cohorts and unit economics.",
        inputSchema: {
            type: "object",
            properties: {
                product: { type: "string", description: "Product in one line. Format is text. For example, \"invoice review service\"." },
                business_model: {
                    type: "string",
                    description: "Business model, passed on to retention_playbook. Format is text using one of the listed labels. For example, \"saas_subscription\".",
                    enum: ["saas_subscription", "usage_based", "marketplace", "transactional", "freemium", "enterprise_contract", "services_contract", "connectivity_contract", "investment_mandate"]
                },
                billing_term: {
                    type: "string",
                    description: "How customers are billed. Format is text using one of the listed labels. For example, \"monthly\".",
                    enum: ["monthly", "annual"]
                },
                as_of: { type: "string", description: "The date the list was pulled (YYYY-MM-DD). Format is text in YYYY-MM-DD form. For example, \"2026-11-17\"." },
                customers: {
                    type: "array",
                    description: "One row per customer (1 to 2000 items). Format is a JSON array. For example, [{\"id\":\"account-001\",\"signed\":\"2026-11-17\",\"segment\":\"manufacturers with 200 to 500 employees\",\"monthly_fee\":24000}].",
                    minItems: 1,
                    maxItems: 2000,
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "An ID, never a name. Format is text. For example, \"account-001\"." },
                            signed: { type: "string", description: "Signing date (YYYY-MM-DD). Format is text in YYYY-MM-DD form. For example, \"2026-11-17\"." },
                            segment: { type: "string", description: "Segment label. Format is text. For example, \"manufacturers with 200 to 500 employees\"." },
                            monthly_fee: { type: "number", description: "Monthly fee at signing (annual contracts: the yearly fee divided by 12). Format is a JSON number. For example, 24000." },
                            stopped: { type: "string", description: "Optional: the first date a payment was due and not paid (for annual contracts, the renewal date they did not renew), YYYY-MM-DD. Format is text in YYYY-MM-DD form. For example, \"2026-11-17\"." },
                            resumed: { type: "string", description: "Optional: date they paid again, if they came back (YYYY-MM-DD). Format is text in YYYY-MM-DD form. For example, \"2026-11-17\"." },
                            monthly_starts: {
                                type: "array",
                                description: "Optional: activity in each of the 12 months before as_of (or before stopped), for the seasonal tag. Format is a JSON array. For example, [12,11,14,13,12,15,14,13,12,14,15,13].",
                                items: { type: "number", description: "Format is a JSON number. For example, 12." }
                            }
                        },
                        required: ["id", "signed", "segment", "monthly_fee"],
                        description: "Format is a JSON object. For example, {\"id\":\"account-001\",\"signed\":\"2026-11-17\",\"segment\":\"manufacturers with 200 to 500 employees\",\"monthly_fee\":24000}."
                    }
                },
                metrics: {
                    type: "array",
                    description: "Optional: each metric with its name, value, whether it counts customers or revenue, and its period. Format is a JSON array. For example, [{\"name\":\"an approved anonymous manufacturer\",\"value\":12}].",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Metric name. Format is text. For example, \"an approved anonymous manufacturer\"." },
                            value: { type: "number", description: "Metric value. Format is a JSON number. For example, 12." },
                            counts: {
                                type: "string",
                                description: "Optional: whether the metric counts customers or revenue. Format is text using one of the listed labels. For example, \"customers\".",
                                enum: ["customers", "revenue"]
                            },
                            period: {
                                type: "string",
                                description: "Optional: period over which the metric is measured. Format is text using one of the listed labels. For example, \"month\".",
                                enum: ["month", "year"]
                            }
                        },
                        required: ["name", "value"],
                        description: "Format is a JSON object. For example, {\"name\":\"an approved anonymous manufacturer\",\"value\":12}."
                    }
                },
                stop_line: { type: "number", description: "Optional (default 0.80): share of a cohort that must still pay at month 12. 0.80 is Shashwat's example line for a $36,000 contract, not a benchmark. Format is a JSON number." },
                payback_line_months: { type: "number", description: "Optional (default 12): the longest acceptable paid payback in months. 12 is Shashwat's example line for a $36,000 contract, not a benchmark. Format is a JSON number." },
                gross_margin: { type: "number", minimum: 0, maximum: 1, description: "Optional (0 to 1): gross margin needed for the money section. Format is a JSON number. For example, 0.8." },
                paid_cac: { type: "number", description: "Optional: paid-only CAC. Format is a JSON number. For example, 24000." },
                blended_cac: { type: "number", description: "Optional: blended CAC, shown for contrast only. Format is a JSON number. For example, 24000." },
                test_cap: { type: "number", description: "Optional: all-in budget for a capped test. Format is a JSON number. For example, 12." },
                win_rate_floor: { type: "number", minimum: 0, maximum: 1, description: "Optional (0 to 1): a win rate the buyer is confident paid can reach. Format is a JSON number. For example, 0.8." },
                win_rate_target: { type: "number", minimum: 0, maximum: 1, description: "Optional (0 to 1): the highest win rate the buyer would believe. Format is a JSON number. For example, 0.8." },
                churn_reasons: { type: "string", description: "Reasons in customers' words, comma or line separated. Format is text. For example, \"implementation delays and unclear ownership\"." },
                interview_persona: { type: "string", description: "Role to interview, for the interview kit. Format is text. For example, \"finance director\"." }
            },
            required: ["product", "business_model", "billing_term", "as_of", "customers", "churn_reasons", "interview_persona"]
        }
    },
    {
        "name": "segment_and_seat_cut_check",
        "description": "Helps you decide which customer segment to back, and whether your pricing is safe if AI cuts seats: it takes each segment's ACV, sales cycle, accounts, deal source and CAC, its logo, gross and net retention, how you charge in your own words, and your seller ramp, cost and qualified demand, and returns one page per segment with payback, gross profit per dollar of CAC, seller capacity after ramp and cycle, and the renewal if customers cut a share of seats. Ask the person to confirm the segment split, their own win rate and what customers can cut before marking each as confirmed; anything not confirmed or not given is shown as missing, never guessed. Read-only for business data. It needs no sign-in and stores no inputs or outputs. Hosted usage metadata is recorded. Missing required fields or invalid values return an error naming what to supply or correct. Use this instead of scale_paid_check when you need segment economics, seller capacity and seat-reduction scenarios.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product": {
                    "type": "string",
                    "description": "What you sell, in one line. Format is text. For example, \"invoice review service\"."
                },
                "gross_margin_percent": {
                    "type": "number",
                    "description": "Gross margin as a percent (for example 72). Needed for payback and every profit sum. Format is a JSON number.",
                    "minimum": 0,
                    "maximum": 100
                },
                "tracks_expansion": {
                    "type": "boolean",
                    "description": "Optional: true only if the company tracks expansion account by account. It adds a later years table below the pages. Payback on CAC and ARR always leads. Format is true or false. For example, true."
                },
                "business_stage": {
                    "type": "string",
                    "description": "Optional: funding stage, passed to the motion first draft (for example series-a). Format is text."
                },
                "industry": {
                    "type": "string",
                    "description": "Optional: your industry, passed to the motion first draft. Format is text. For example, \"manufacturing\"."
                },
                "segments": {
                    "type": "array",
                    "description": "One item per customer segment (1 to 4). Split by who signs, how they find you, sales cycle and contract value. Format is a JSON array. For example, [{\"name\":\"an approved anonymous manufacturer\"}].",
                    "minItems": 1,
                    "maxItems": 4,
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The segment in your own words (for example 'banks and insurers with 200 to 2,000 contact centre agents'). Format is text."
                            },
                            "acv": {
                                "type": "number",
                                "description": "Average contract value per year, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "sales_cycle_days": {
                                "type": "number",
                                "description": "Days from first meeting to signature. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "accounts": {
                                "type": "number",
                                "description": "Number of accounts that could buy in this segment. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "deal_source": {
                                "type": "string",
                                "description": "Where most deals in this segment come from (for example inbound, outbound, referrals, partnerships or mixed). Format is text."
                            },
                            "cac": {
                                "type": "number",
                                "description": "Cost to win one customer in this segment, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "logo_retention_percent": {
                                "type": "number",
                                "description": "Share of customers still paying after a year, as a percent (for example 89). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "gross_retention_percent": {
                                "type": "number",
                                "description": "Gross revenue retention as a percent: opening revenue less churn and downgrades, over opening revenue (for example 92). It cannot pass 100. Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "net_retention_percent": {
                                "type": "number",
                                "description": "Net revenue retention as a percent: gross retention plus expansion (for example 108). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 300
                            },
                            "monthly_logo_churn_percent": {
                                "type": "number",
                                "description": "Optional: share of customers lost in a month, as a percent (for example 2.5). Used for the simple lifetime sum; left out, yearly logo retention is used. Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "pricing_unit_in_writing": {
                                "type": "string",
                                "description": "What you bill on, in your own words (for example 'per agent seat, billed yearly' or 'per resolved contact'). Format is text."
                            },
                            "pricing_unit": {
                                "type": "string",
                                "description": "Optional: the pricing unit, if you want to state it directly. It overrides the reading of your sentence. Format is text using one of the listed labels. For example, \"seat\".",
                                "enum": [
                                    "seat",
                                    "usage",
                                    "hybrid"
                                ]
                            },
                            "seat_share_of_acv_percent": {
                                "type": "number",
                                "description": "Optional, for a mix of seats and usage: the percent of the contract billed on seats (for example 60). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "what_customers_can_cut": {
                                "type": "string",
                                "description": "What a customer can cut, and when, in your own words (for example 'seats, at each yearly renewal'). Format is text."
                            },
                            "icp_match_percent": {
                                "type": "number",
                                "description": "Optional: percent of accounts that match your ideal customer profile, passed to the sizing first draft. Format is a JSON number. For example, 30.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "year_one_share_percent": {
                                "type": "number",
                                "description": "Optional: the year one share you assume, as a percent, passed to the sizing first draft. Format is a JSON number. For example, 30.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "win_rate_percent": {
                                "type": "number",
                                "description": "Your own win rate: the percent of qualified opportunities you win in this segment, from your closed deals (for example 33). Used only when the person has confirmed it. Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "year_one_customer_target": {
                                "type": "number",
                                "description": "Optional: new customers you want from this segment in year one. Left out, the customer count from the sizing first draft is used. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "seller_ramp_months": {
                                "type": "number",
                                "description": "Months before a new seller carries a full pipeline. Format is a JSON number. For example, 12.",
                                "minimum": 0,
                                "maximum": 24
                            },
                            "seller_loaded_cost_per_year": {
                                "type": "number",
                                "description": "Full yearly cost of one seller, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "ramped_deals_per_seller_per_year": {
                                "type": "number",
                                "description": "Deals a fully ramped seller closes in a year in this segment, from your own record. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "monthly_qualified_demand": {
                                "type": "number",
                                "description": "Qualified opportunities assigned to sellers each month in this segment. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "seat_cut_percent": {
                                "type": "number",
                                "description": "Optional: the percent of seats a customer could cut if AI does more of the work (for example 25). Used only when the person has confirmed it. Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "arr_share_cutting_percent": {
                                "type": "number",
                                "description": "Optional: the percent of this segment's revenue held by accounts that would make that cut (for example 32). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "seats_per_account": {
                                "type": "number",
                                "description": "Optional: seats in an average account. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "work_units_per_seat_per_year": {
                                "type": "number",
                                "description": "Optional: units of work one seat handles in a year (for example contacts, shipments or claims). Format is a JSON number.",
                                "minimum": 0
                            },
                            "buyer_cost_per_seat_per_year": {
                                "type": "number",
                                "description": "Optional: what one seat costs the buyer in a year, in salary and overhead, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "usage_price_per_unit": {
                                "type": "number",
                                "description": "Optional: a price per unit of work you want to test, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "run_cost_per_unit": {
                                "type": "number",
                                "description": "Optional: your cost to run one unit of work, in dollars. Format is a JSON number. For example, 24000.",
                                "minimum": 0
                            },
                            "gross_retention_gate_percent": {
                                "type": "number",
                                "description": "Optional: your own gross retention line for releasing more money (for example 90). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "net_retention_gate_percent": {
                                "type": "number",
                                "description": "Optional: your own net retention line (for example 100). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 300
                            },
                            "logo_retention_gate_percent": {
                                "type": "number",
                                "description": "Optional: your own logo retention line (for example 85). Format is a JSON number.",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "churn_reasons": {
                                "type": "string",
                                "description": "Optional: why customers in this segment leave or shrink, in their words, separated by semicolons. Format is text. For example, \"implementation delays and unclear ownership\"."
                            },
                            "motion_lead": {
                                "type": "string",
                                "description": "Optional: the lead motion from the EPIC audit on GTM Alpha, as it came back. Format is text. For example, \"E\"."
                            },
                            "motion_score": {
                                "type": "number",
                                "description": "Optional: the score of that lead motion, 1 to 10. Format is a JSON number. For example, 10.",
                                "minimum": 0,
                                "maximum": 10
                            },
                            "motion_reason": {
                                "type": "string",
                                "description": "Optional: the audit's reason line for the lead motion, as it came back. Format is text. For example, \"buyers rely on partner referrals\"."
                            },
                            "sizing_tam": {
                                "type": "number",
                                "description": "Optional: TAM in dollars from the sizing calculator on ICP Intelligence. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "sizing_sam": {
                                "type": "number",
                                "description": "Optional: SAM in dollars from the sizing calculator. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "sizing_som": {
                                "type": "number",
                                "description": "Optional: year one SOM in dollars from the sizing calculator. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            },
                            "sizing_year_one_customers": {
                                "type": "number",
                                "description": "Optional: customers needed in year one, from the sizing calculator. Format is a JSON number. For example, 12.",
                                "minimum": 0
                            }
                        },
                        "required": [
                            "name"
                        ],
                        description: "Format is a JSON object. For example, {\"name\":\"an approved anonymous manufacturer\"}."
                    }
                },
                "confirmed": {
                    "type": "object",
                    "description": "What the person has confirmed. Set each to true only after asking them. Until the segment split is confirmed no sum runs. Format is a JSON object. For example, {\"segment_split\":true,\"win_rate\":true,\"seat_cut\":true}.",
                    "properties": {
                        "segment_split": {
                            "type": "boolean",
                            "description": "The person confirmed the segments are how their closed deals really divide. Format is true or false. For example, true."
                        },
                        "win_rate": {
                            "type": "boolean",
                            "description": "The person confirmed the win rates are their own, from closed deals. Format is true or false. For example, true."
                        },
                        "seat_cut": {
                            "type": "boolean",
                            "description": "The person confirmed what customers can cut, and the share of seats to test. Format is true or false. For example, true."
                        }
                    }
                }
            },
            "required": [
                "product",
                "segments"
            ]
        }
    }
];
//# sourceMappingURL=tools.js.map