import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { MODEL_CHOICES, SECTOR_CHOICES } from "./context.js";

// Run 19 (D80): the optional business_model input is the same in every tool that reads a business model from the inputs.
const businessModelProp = {
  type: "string",
  description: "Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it",
  enum: MODEL_CHOICES
};

// Run 19 (D80, problem 8): the sector can be named, so the answer uses that sector's buyers, measures and objections.
const industryProp = {
  type: "string",
  description: "Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read",
  enum: [...Object.keys(SECTOR_CHOICES), "other"]
};

export const tools: Tool[] = [
  {
    name: "pmf_scorecard",
    description: "Takes your product, target market and current metrics (MRR, ACV, churn, NPS, CAC, LTV, retention, activation and similar) and returns a product-market fit scorecard that scores each dimension against example benchmark ranges. Reads the business model from your inputs and leaves the activation score out for services, connectivity and investment businesses. Quotes your customer feedback and answers it.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name and brief description" },
        target_market: {
          type: "string",
          description: "Target market segment (for example enterprise SaaS, telecom or logistics tech)",
          enum: ["enterprise_saas", "smb_saas", "consumer", "marketplace", "fintech", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"]
        },
        current_metrics: {
          type: "string",
          description: "Your current metrics, written as text (the tool reads the figures from it). Include any of: MRR, ARR, ACV, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%'. A figure that no rule scores is listed as not scored"
        },
        time_in_market: {
          type: "string",
          description: "How long the product has been in market (shown in the scorecard)",
          enum: ["pre_launch", "0_6_months", "6_12_months", "1_2_years", "2_plus_years"]
        },
        customer_feedback: {
          type: "string",
          description: "Optional: Qualitative feedback themes, one per line or separated by semicolons (for example 'Customers like X; they struggle with Y'). Each theme is quoted and answered"
        },
        business_model: businessModelProp
      },
      required: ["product", "target_market", "current_metrics"]
    }
  },
  {
    name: "launch_commander",
    description: "Takes what you are launching, the launch type, your target segments and your goals, and returns a phased launch plan with tasks, a messaging table and success metrics. Give a date for a dated timeline, or enter 'TBD' or a quarter such as 'Q2 2027' for a flexible plan. Tasks and the messaging table follow the sector and business model read from your inputs, and each goal is filed under its own metric.",
    inputSchema: {
      type: "object",
      properties: {
        product_feature: { type: "string", description: "What you're launching (product/feature name and description)" },
        launch_date: { type: "string", description: "Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2027', 'March 2027', or 'TBD' for planning mode" },
        launch_type: {
          type: "string",
          description: "Type of launch determines plan complexity",
          enum: ["major_release", "feature_launch", "beta_launch", "product_update", "market_expansion"]
        },
        target_segments: { type: "string", description: "Target customer segments (comma-separated)" },
        goals: { type: "string", description: "Launch success metrics (for example '40 qualified meetings, $300K pipeline, 5 reference customers')" },
        available_channels: {
          type: "string",
          description: "Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community'"
        },
        team_size: {
          type: "string",
          description: "Marketing/GTM team size affects task distribution",
          enum: ["solo", "small_2_5", "medium_6_15", "large_15_plus"]
        },
        budget_level: {
          type: "string",
          description: "Budget affects recommended tactics",
          enum: ["bootstrap", "moderate", "well_funded"]
        },
        business_model: businessModelProp,
        industry: industryProp
      },
      required: ["product_feature", "launch_type", "target_segments", "goals"]
    }
  },
  {
    name: "customer_interview_kit",
    description: "Takes the interview type, the product context and the person you are interviewing, and returns an interview guide that fits the interview type, the sector (chosen, or read from your inputs) and the product complexity. Questions use the sector's own language, your hypotheses are kept whole, and synthesis templates are included.",
    inputSchema: {
      type: "object",
      properties: {
        interview_type: {
          type: "string",
          enum: ["discovery", "validation", "feedback", "churn", "win_loss", "persona_research"],
          description: "Type of interview determines question focus"
        },
        product_context: { type: "string", description: "Product/service being researched" },
        industry: {
          type: "string",
          description: "Industry affects terminology and context. Leave it out and the sector is read from your other inputs",
          enum: ["saas", "fintech", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "ecommerce", "marketplace", "enterprise_software", "consumer", "other"]
        },
        product_complexity: {
          type: "string",
          description: "Affects technical depth of questions",
          enum: ["simple", "moderate", "complex", "highly_technical"]
        },
        target_persona: { type: "string", description: "Who you're interviewing (role/title)" },
        key_hypotheses: { type: "string", description: "Optional: Hypotheses to validate during interview, one per line or separated by semicolons" },
        business_model: businessModelProp
      },
      required: ["interview_type", "product_context", "target_persona"]
    }
  },
  {
    name: "retention_playbook",
    description: "Takes your customer segment, business model and current churn rate, and returns a retention playbook with health signals, interventions and an email draft for each churn reason. If you do not know why customers leave, leave the churn reasons out and you get a churn discovery kit with a framework for finding out. Health signals and interventions follow the business model, each churn reason gets its own answer, and your current interventions and data signals are used.",
    inputSchema: {
      type: "object",
      properties: {
        customer_segment: { type: "string", description: "Customer segment to focus on" },
        business_model: {
          type: "string",
          description: "Business model affects health score weighting. enterprise_contract is read further from your text when it names services, connectivity or investment",
          enum: ["saas_subscription", "usage_based", "marketplace", "transactional", "freemium", "enterprise_contract", "services_contract", "connectivity_contract", "investment_mandate"]
        },
        current_churn_rate: { type: "string", description: "Current churn rate (e.g., '5%' or '5% monthly')" },
        churn_reasons: {
          type: "string",
          description: "Optional: known churn reasons, comma-separated. If you do not know them, leave this blank and you get a churn discovery kit with a framework for finding the reasons"
        },
        available_data_signals: {
          type: "string",
          description: "What you can track (comma-separated). E.g., 'login frequency, support tickets, SLA attainment, QBR attendance'"
        },
        cs_team_size: {
          type: "string",
          description: "CS team capacity affects intervention strategy",
          enum: ["no_dedicated_cs", "small_1_3", "medium_4_10", "large_10_plus"]
        },
        current_interventions: { type: "string", description: "Optional: What retention tactics you already do (listed and compared with the playbook)" },
        product: { type: "string", description: "Optional: Your product or company name, used in the title and the email drafts" },
        industry: industryProp
      },
      required: ["customer_segment", "business_model", "current_churn_rate"]
    }
  },
  {
    name: "partner_architect",
    description: "Takes your company, product, partner model, partner goal and deal size, and returns a partner program with tiers, example commission amounts and KPIs, with a different structure for resellers, referrals, integrations, agencies, affiliates and white label. Uses your stated goal, existing partners and deal size, and names the partner types that fit your sector's buying committee.",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Your company name" },
        product: { type: "string", description: "Product partners will sell/integrate" },
        partner_model: {
          type: "string",
          description: "Partner type determines program structure",
          enum: ["reseller", "referral", "integration_tech", "agency_si", "affiliate", "oem_white_label"]
        },
        partner_goals: { type: "string", description: "Revenue/growth targets from partners (shown as the target of the first KPI row)" },
        your_deal_size: {
          type: "string",
          description: "Average deal size as one amount (e.g., '$5000 ACV', '$5K' or '$500/month'; a range is refused). It scales the example commission amounts; the example rates are fixed"
        },
        partner_support_capacity: {
          type: "string",
          description: "How much partner support can you provide?",
          enum: ["minimal_self_serve", "moderate", "high_touch"]
        },
        existing_partners: { type: "string", description: "Optional: Current partner types/count, one per line or separated by semicolons (listed in the plan)" },
        business_model: businessModelProp,
        industry: industryProp
      },
      required: ["company", "product", "partner_model", "partner_goals", "your_deal_size"]
    }
  },
  {
    name: "crisis_planner",
    description: "Takes your company, industry, customer base and data sensitivity, and returns crisis playbooks with a response team and notification steps for each crisis. Name the crises you know of to get those playbooks. If you leave them out, the tool uses a default set of common crises for your sector (not ranked by likelihood). Each compliance item you list is used in the notification steps.",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Company name" },
        industry: {
          type: "string",
          description: "Industry affects which crises to prioritize",
          enum: ["fintech", "saas", "logistics_tech", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "ecommerce", "enterprise", "consumer", "other"]
        },
        customer_base: {
          type: "string",
          description: "Customer type affects communication approach",
          enum: ["b2b_enterprise", "b2b_smb", "b2c_consumer", "mixed"]
        },
        data_sensitivity: {
          type: "string",
          description: "Data sensitivity affects security protocols",
          enum: ["high_pii_financial", "medium_business_data", "low_general"]
        },
        potential_crises: {
          type: "string",
          description: "Optional: crisis types to plan for, comma-separated. If not provided, the tool uses a default set of common crises for your sector (not ranked by likelihood). Options: data_breach, service_outage, sla_breach, regulatory_action, fraud_incident, ai_wrong_action, pr_incident, executive_departure, security_vulnerability, customer_data_exposure, product_safety"
        },
        company_size: {
          type: "string",
          description: "Affects response team structure",
          enum: ["startup_under_50", "scaleup_50_200", "midsize_200_1000", "enterprise_1000_plus"]
        },
        compliance_requirements: { type: "string", description: "Optional: Relevant compliance, comma-separated (for example ISO 27001, SOC 2, GDPR). Each item is named in the notification steps" },
        business_model: businessModelProp
      },
      required: ["company", "industry", "customer_base", "data_sensitivity"]
    }
  },
  {
    name: "competitive_intel",
    description: "Takes your product and the competitors you name, and returns one battle card per competitor built from your strengths, weaknesses, competitor details, objections, wins and losses. Each competitor detail goes to the competitor it names, each objection gets its own answer, and strengths and gaps taken from wins and losses are your own words.",
    inputSchema: {
      type: "object",
      properties: {
        your_product: { type: "string", description: "Your product name and brief description" },
        competitors: {
          type: "string",
          description: "Competitor names, comma-separated. You get one battle card for each competitor named"
        },
        your_strengths: {
          type: "string",
          description: "Optional: what you do better, comma-separated. Taken from your wins, in your own words, if not provided"
        },
        your_weaknesses: {
          type: "string",
          description: "Optional: where competitors beat you, comma-separated. Taken from your losses, in your own words, if not provided"
        },
        competitor_details: {
          type: "string",
          description: "Optional: Any known details about competitors, one per line or separated by semicolons. E.g., 'Competitor A is cheaper; Competitor B targets enterprise'. Each detail goes to the competitor it names"
        },
        common_objections: {
          type: "string",
          description: "Sales objections you hear (comma-separated). E.g., 'too expensive, missing X feature, competitor has better Y'"
        },
        recent_wins: { type: "string", description: "Why customers chose you over competitors: used as your strengths when none are given" },
        recent_losses: { type: "string", description: "Why you lost deals to competitors: used as your gaps when none are given" },
        business_model: businessModelProp,
        industry: industryProp
      },
      required: ["your_product", "competitors"]
    }
  },
  {
    name: "craft_gtm_analyzer",
    description: "Takes the text of a GTM document or plan and returns an analysis against the CRAFT framework, with a score for each dimension. Each dimension is scored only on what the plan contains (Timeline counts real dates, durations and quarters), the tool shows the plan's own line for each, names only the elements that are missing and suggests sections to add.",
    inputSchema: {
      type: "object",
      properties: {
        document_content: {
          type: "string",
          description: "The GTM document or plan to analyze. Paste the full text: the tool reads it and scores it against the framework"
        },
        document_type: {
          type: "string",
          description: "Type of document (shown in the analysis)",
          enum: ["gtm_strategy", "launch_plan", "campaign_brief", "quarterly_plan", "project_proposal", "marketing_plan"]
        },
        intended_audience: { type: "string", description: "Optional: Who will read/approve this document" },
        desired_outcome: { type: "string", description: "Optional: What action should this document drive" },
        industry: industryProp
      },
      required: ["document_content", "document_type"]
    }
  }
];
