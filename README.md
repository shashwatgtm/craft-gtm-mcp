# @shashwatgtmalpha/craft-gtm-mcp v2.2.24
**CRAFT GTM Framework MCP Server**: a complete redesign with metric parsing, context-aware outputs, and a structured draft with placeholders where your inputs give no fact.

## Use it hosted (no install)

Add `https://craft-gtm.gtmhelix.com/mcp` as a Streamable HTTP connector. It needs no sign in. The hosted endpoint always runs the newest version (2.2.24) available on this site. It listed 10 tools on 15 November 2026. [Connection instructions](https://craft-gtm.gtmhelix.com/connect/). You can also open the [web app](https://craft-gtm.gtmhelix.com/).

For a local stdio connection, run `npx -y @shashwatgtmalpha/craft-gtm-mcp`. On 15 November 2026 the latest published npm version was 2.2.23. Check the available version with `npm view @shashwatgtmalpha/craft-gtm-mcp version`.


## What's New in v2.0.0

This is a **major redesign** addressing all critical issues from v1.x:

| Issue | v1.x | v2.0.0 |
|-------|------|--------|
| PMF Scorecard | Blank `___` outputs | **Actually parses and scores your metrics** |
| Launch Commander | Same 12-week template for all | **Adapts to launch type, team size, budget** |
| Retention Playbook | Generic health scores | **Parses churn reasons, creates specific interventions** |
| Competitive Intel | `[Research]` placeholders | **Uses your competitor data, generates battle cards** |
| CRAFT Analyzer | Blank scorecard output | **Actually analyzes documents, finds gaps** |

## Installation

```bash
npm install -g @shashwatgtmalpha/craft-gtm-mcp
```

Or add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "craft-gtm": {
      "command": "npx",
      "args": ["-y", "@shashwatgtmalpha/craft-gtm-mcp"]
    }
  }
}
```

## Tools and inputs

The 10 tools below come from `tools/list` in the 2.2.24 source build, checked on 15 November 2026. Each table shows the accepted fields. A dot marks a field inside an object and `[]` marks an array item. A nested field marked required is required when its parent is supplied.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `pmf_scorecard` | PMF Scorecard | Helps you decide whether you have product market fit and whether to scale: it takes your product, target market and current metrics (MRR, ACV, churn, NPS, CAC, LTV, retention, activation and similar) and returns a scorecard that scores each dimension against example benchmark ranges. It also gives priority actions and the data gaps to fill, reads the business model from your inputs, leaves the activation score out for services, connectivity and investment businesses, and quotes and answers your customer feedback. |
| 2 | `launch_commander` | Launch Commander | Helps you decide your launch plan: it takes what you are launching, the launch type, your target segments and your goals, and returns a phased launch plan with tasks, a messaging table and success metrics. Give a date for a dated timeline, or 'TBD' or a quarter such as 'Q2 2027' for a flexible plan. Tasks and messaging follow the sector and business model read from your inputs, and each goal is filed under its own metric. |
| 3 | `customer_interview_kit` | Customer Interview Kit | Helps you decide what to ask customers to test your hunch: it takes the interview type, the product context and the person you are interviewing, and returns an interview guide that fits the interview type, the sector and the product complexity. Questions use the sector's own language (the sector is chosen, or read from your inputs), your hypotheses are kept whole, and synthesis templates are included. |
| 4 | `retention_playbook` | Retention Playbook | Helps you decide why customers leave and what to do about each reason: it takes your customer segment, business model and current churn rate, and returns a retention playbook with health signals, interventions and an email draft for each churn reason. If you do not know why customers leave, leave the churn reasons out and you get a churn discovery kit instead. Your current interventions and data signals are used when you give them. |
| 5 | `partner_architect` | Partner Architect | Helps you decide what partner program to run and how to start it: it takes your company, product, partner model, partner goal and deal size, and returns a partner program with tiers, example commission amounts and KPIs. The structure differs for resellers, referrals, integrations, agencies, affiliates and white label, uses your existing partners when given, and names the partner types that fit your sector's buying committee. |
| 6 | `crisis_planner` | Crisis Planner | Helps you decide who does what when a crisis hits: it takes your company, industry, customer base and data sensitivity, and returns crisis playbooks with a response team and notification steps for each crisis. Name the crises you know of to get those playbooks; without them it uses a default set of common crises for your sector, not ranked by likelihood. Each compliance item you list is used in the notification steps. |
| 7 | `competitive_intel` | Competitive Intel | Helps you decide how to win against each competitor: it takes your product and the competitors you name, and returns one battle card per competitor built from your strengths, weaknesses, competitor details, objections, wins and losses. Each competitor detail goes to the competitor it names, each objection gets its own answer, and strengths and gaps taken from wins and losses stay in your own words. |
| 8 | `craft_gtm_analyzer` | CRAFT GTM Analyzer | Helps you decide whether a GTM plan is clear enough to run: it takes the text of a GTM document or plan and returns a score for each CRAFT dimension, based only on what the plan contains. Timeline counts real dates, durations and quarters; the answer shows the plan's own line for each dimension, names only the elements that are missing and suggests sections to add. |
| 9 | `scale_paid_check` | Scale Paid Check | Helps you decide whether to scale paid now: it takes your customer list (signing date, segment, monthly fee and any stop or return dates) and your churn reasons, and returns, for each customer group, scale, run a capped test, or hold, with the counts behind it, the stop rule, payback, a first draft response to each churn reason and a churn interview guide. |
| 10 | `segment_and_seat_cut_check` | Segment and Seat Cut Check | Helps you decide which customer segment to back, and whether your pricing is safe if AI cuts seats: it takes each segment's ACV, sales cycle, accounts, deal source and CAC, its logo, gross and net retention, how you charge in your own words, and your seller ramp, cost and qualified demand, and returns one page per segment with payback, gross profit per dollar of CAC, seller capacity after ramp and cycle, and the renewal if customers cut a share of seats. Ask the person to confirm the segment split, their own win rate and what customers can cut before marking each as confirmed; anything not confirmed or not given is shown as missing, never guessed. |

### Inputs of each tool

#### 1. PMF Scorecard (`pmf_scorecard`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product name and brief description |
| `target_market` | Yes | one of `enterprise_saas`, `smb_saas`, `consumer`, `marketplace`, `fintech`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Benchmark segment for scoring (for example enterprise SaaS, telecom or logistics tech). Ask the user to confirm it when it differs from the product description. The selected benchmark and its stated fallback ranges are used; the output explains conflicts. The separate sector choice controls sector notes. |
| `current_metrics` | Yes | string | Your current metrics, written as text (the tool reads the figures from it). Include any of: MRR, ARR, ACV, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%'. A figure that no rule scores is listed as not scored |
| `time_in_market` | No | one of `pre_launch`, `0_6_months`, `6_12_months`, `1_2_years`, `2_plus_years` | How long the product has been in market (shown in the scorecard) |
| `customer_feedback` | No | string | Optional: Qualitative feedback themes, one per line or separated by semicolons (for example 'Customers like X; they struggle with Y'). Each theme is quoted and answered |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 2. Launch Commander (`launch_commander`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product_feature` | Yes | string | What you're launching (product/feature name and description) |
| `launch_date` | No | string | Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2027', 'March 2027', or 'TBD' for planning mode |
| `launch_type` | Yes | one of `major_release`, `feature_launch`, `beta_launch`, `product_update`, `market_expansion` | Type of launch determines plan complexity |
| `target_segments` | Yes | string | Target customer segments (comma-separated) |
| `goals` | Yes | string | Launch success metrics (for example '40 qualified meetings, $300K pipeline, 5 reference customers') |
| `available_channels` | No | string | Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community' |
| `team_size` | No | one of `solo`, `small_2_5`, `medium_6_15`, `large_15_plus` | Marketing/GTM team size affects task distribution |
| `budget_level` | No | one of `bootstrap`, `moderate`, `well_funded` | Budget affects recommended tactics |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 3. Customer Interview Kit (`customer_interview_kit`)

| Input | Required | Type | Description |
|---|---|---|---|
| `interview_type` | Yes | one of `discovery`, `validation`, `feedback`, `churn`, `win_loss`, `persona_research` | Type of interview determines question focus |
| `product_context` | Yes | string | Product/service being researched |
| `industry` | No | one of `saas`, `fintech`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `ecommerce`, `marketplace`, `enterprise_software`, `consumer`, `other` | Industry affects terminology and context. Leave it out and the sector is read from your other inputs |
| `product_complexity` | No | one of `simple`, `moderate`, `complex`, `highly_technical` | Affects technical depth of questions |
| `target_persona` | Yes | string | Who you're interviewing (role/title) |
| `key_hypotheses` | No | string | Optional: Hypotheses to validate during interview, one per line or separated by semicolons |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 4. Retention Playbook (`retention_playbook`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_segment` | Yes | string | Customer segment to focus on |
| `business_model` | Yes | one of `saas_subscription`, `usage_based`, `marketplace`, `transactional`, `freemium`, `enterprise_contract`, `services_contract`, `connectivity_contract`, `investment_mandate` | Business model affects health score weighting. enterprise_contract is read further from your text when it names services, connectivity or investment |
| `current_churn_rate` | Yes | string | Current churn rate (e.g., '5%' or '5% monthly') |
| `churn_reasons` | No | string | Optional: known churn reasons, comma-separated. If you do not know them, leave this blank and you get a churn discovery kit with a framework for finding the reasons |
| `available_data_signals` | No | string | What you can track (comma-separated). E.g., 'login frequency, support tickets, SLA attainment, QBR attendance' |
| `cs_team_size` | No | one of `no_dedicated_cs`, `small_1_3`, `medium_4_10`, `large_10_plus` | CS team capacity affects intervention strategy |
| `current_interventions` | No | string | Optional: What retention tactics you already do (listed and compared with the playbook) |
| `product` | No | string | Optional: Your product or company name, used in the title and the email drafts |
| `industry` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 5. Partner Architect (`partner_architect`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Your company name |
| `product` | Yes | string | Product partners will sell/integrate |
| `partner_model` | Yes | one of `reseller`, `referral`, `integration_tech`, `agency_si`, `affiliate`, `oem_white_label` | Partner type determines program structure |
| `partner_goals` | Yes | string | Revenue/growth targets from partners (shown as the target of the first KPI row) |
| `your_deal_size` | Yes | string | Average deal size as one amount (e.g., '$5000 ACV', '$5K' or '$500/month'; a range is refused). It scales the example commission amounts; the example rates are fixed |
| `partner_support_capacity` | No | one of `minimal_self_serve`, `moderate`, `high_touch` | How much partner support can you provide? |
| `existing_partners` | No | string | Optional: Current partner types/count, one per line or separated by semicolons (listed in the plan) |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 6. Crisis Planner (`crisis_planner`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Company name |
| `industry` | Yes | one of `fintech`, `saas`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `ecommerce`, `enterprise`, `consumer`, `other` | Industry affects which crises to prioritize |
| `customer_base` | Yes | one of `b2b_enterprise`, `b2b_smb`, `b2c_consumer`, `mixed` | Customer type affects communication approach |
| `data_sensitivity` | Yes | one of `high_pii_financial`, `medium_business_data`, `low_general` | Data sensitivity affects security protocols |
| `potential_crises` | No | string | Optional: crisis types to plan for, comma-separated. If not provided, the tool uses a default set of common crises for your sector (not ranked by likelihood). Options: data_breach, service_outage, sla_breach, regulatory_action, fraud_incident, ai_wrong_action, pr_incident, executive_departure, security_vulnerability, customer_data_exposure, product_safety |
| `company_size` | No | one of `startup_under_50`, `scaleup_50_200`, `midsize_200_1000`, `enterprise_1000_plus` | Affects response team structure |
| `compliance_requirements` | No | string | Optional: Relevant compliance, comma-separated (for example ISO 27001, SOC 2, GDPR). Each item is named in the notification steps |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 7. Competitive Intel (`competitive_intel`)

| Input | Required | Type | Description |
|---|---|---|---|
| `your_product` | Yes | string | Your product name and brief description |
| `competitors` | Yes | string | Competitor names, comma-separated. You get one battle card for each competitor named |
| `your_strengths` | No | string | Optional: what you do better, comma-separated. Taken from your wins, in your own words, if not provided |
| `your_weaknesses` | No | string | Optional: where competitors beat you, comma-separated. Taken from your losses, in your own words, if not provided |
| `competitor_details` | No | string | Optional: Any known details about competitors, one per line or separated by semicolons. E.g., 'Competitor A is cheaper; Competitor B targets enterprise'. Each detail goes to the competitor it names |
| `common_objections` | No | string | Sales objections you hear (comma-separated). E.g., 'too expensive, missing X feature, competitor has better Y' |
| `recent_wins` | No | string | Why customers chose you over competitors: used as your strengths when none are given |
| `recent_losses` | No | string | Why you lost deals to competitors: used as your gaps when none are given |
| `business_model` | No | one of `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 8. CRAFT GTM Analyzer (`craft_gtm_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `document_content` | Yes | string | The GTM document or plan to analyze. Paste the full text: the tool reads it and scores it against the framework |
| `document_type` | Yes | one of `gtm_strategy`, `launch_plan`, `campaign_brief`, `quarterly_plan`, `project_proposal`, `marketing_plan` | Type of document (shown in the analysis) |
| `intended_audience` | No | string | Optional: Who will read/approve this document |
| `desired_outcome` | No | string | Optional: What action should this document drive |
| `industry` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your own company's sector, so the answer uses the usual buyers, measures and objections for what you sell. Leave it out and the tool reads the sector from your other inputs and names what it read |
| `your_sector` | No | one of `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear. |

#### 9. Scale Paid Check (`scale_paid_check`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product in one line |
| `business_model` | Yes | one of `saas_subscription`, `usage_based`, `marketplace`, `transactional`, `freemium`, `enterprise_contract`, `services_contract`, `connectivity_contract`, `investment_mandate` | Business model, passed on to retention_playbook |
| `billing_term` | Yes | one of `monthly`, `annual` | How customers are billed |
| `as_of` | Yes | string | The date the list was pulled (YYYY-MM-DD) |
| `customers` | Yes | array of object (minimum items 1, maximum items 2000) | One row per customer (1 to 2000 items) |
| `customers[].id` | Yes | string | An ID, never a name |
| `customers[].signed` | Yes | string | Signing date (YYYY-MM-DD) |
| `customers[].segment` | Yes | string | Segment label |
| `customers[].monthly_fee` | Yes | number | Monthly fee at signing (annual contracts: the yearly fee divided by 12) |
| `customers[].stopped` | No | string | Optional: the first date a payment was due and not paid (for annual contracts, the renewal date they did not renew), YYYY-MM-DD |
| `customers[].resumed` | No | string | Optional: date they paid again, if they came back (YYYY-MM-DD) |
| `customers[].monthly_starts` | No | array of number | Optional: activity in each of the 12 months before as_of (or before stopped), for the seasonal tag |
| `metrics` | No | array of object | Optional: each metric with its name, value, whether it counts customers or revenue, and its period |
| `metrics[].name` | Yes | string | Metric name |
| `metrics[].value` | Yes | number | Metric value |
| `metrics[].counts` | No | one of `customers`, `revenue` | Optional: whether the metric counts customers or revenue |
| `metrics[].period` | No | one of `month`, `year` | Optional: period over which the metric is measured |
| `stop_line` | No | number | Optional (default 0.80): share of a cohort that must still pay at month 12. 0.80 is Shashwat's example line for a $36,000 contract, not a benchmark. |
| `payback_line_months` | No | number | Optional (default 12): the longest acceptable paid payback in months. 12 is Shashwat's example line for a $36,000 contract, not a benchmark. |
| `gross_margin` | No | number (minimum 0, maximum 1) | Optional (0 to 1): gross margin needed for the money section |
| `paid_cac` | No | number | Optional: paid-only CAC |
| `blended_cac` | No | number | Optional: blended CAC, shown for contrast only |
| `test_cap` | No | number | Optional: all-in budget for a capped test |
| `win_rate_floor` | No | number (minimum 0, maximum 1) | Optional (0 to 1): a win rate the buyer is confident paid can reach |
| `win_rate_target` | No | number (minimum 0, maximum 1) | Optional (0 to 1): the highest win rate the buyer would believe |
| `churn_reasons` | Yes | string | Reasons in customers' words, comma or line separated |
| `interview_persona` | Yes | string | Role to interview, for the interview kit |

#### 10. Segment and Seat Cut Check (`segment_and_seat_cut_check`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | What you sell, in one line |
| `gross_margin_percent` | No | number (minimum 0, maximum 100) | Gross margin as a percent (for example 72). Needed for payback and every profit sum |
| `tracks_expansion` | No | boolean | Optional: true only if the company tracks expansion account by account. It adds a later years table below the pages. Payback on CAC and ARR always leads |
| `business_stage` | No | string | Optional: funding stage, passed to the motion first draft (for example series-a) |
| `industry` | No | string | Optional: your industry, passed to the motion first draft |
| `segments` | Yes | array of object (minimum items 1, maximum items 4) | One item per customer segment (1 to 4). Split by who signs, how they find you, sales cycle and contract value |
| `segments[].name` | Yes | string | The segment in your own words (for example 'banks and insurers with 200 to 2,000 contact centre agents') |
| `segments[].acv` | No | number (minimum 0) | Average contract value per year, in dollars |
| `segments[].sales_cycle_days` | No | number (minimum 0) | Days from first meeting to signature |
| `segments[].accounts` | No | number (minimum 0) | Number of accounts that could buy in this segment |
| `segments[].deal_source` | No | string | Where most deals in this segment come from (for example inbound, outbound, referrals, partnerships or mixed) |
| `segments[].cac` | No | number (minimum 0) | Cost to win one customer in this segment, in dollars |
| `segments[].logo_retention_percent` | No | number (minimum 0, maximum 100) | Share of customers still paying after a year, as a percent (for example 89) |
| `segments[].gross_retention_percent` | No | number (minimum 0, maximum 100) | Gross revenue retention as a percent: opening revenue less churn and downgrades, over opening revenue (for example 92). It cannot pass 100 |
| `segments[].net_retention_percent` | No | number (minimum 0, maximum 300) | Net revenue retention as a percent: gross retention plus expansion (for example 108) |
| `segments[].monthly_logo_churn_percent` | No | number (minimum 0, maximum 100) | Optional: share of customers lost in a month, as a percent (for example 2.5). Used for the simple lifetime sum; left out, yearly logo retention is used |
| `segments[].pricing_unit_in_writing` | No | string | What you bill on, in your own words (for example 'per agent seat, billed yearly' or 'per resolved contact') |
| `segments[].pricing_unit` | No | one of `seat`, `usage`, `hybrid` | Optional: the pricing unit, if you want to state it directly. It overrides the reading of your sentence |
| `segments[].seat_share_of_acv_percent` | No | number (minimum 0, maximum 100) | Optional, for a mix of seats and usage: the percent of the contract billed on seats (for example 60) |
| `segments[].what_customers_can_cut` | No | string | What a customer can cut, and when, in your own words (for example 'seats, at each yearly renewal') |
| `segments[].icp_match_percent` | No | number (minimum 0, maximum 100) | Optional: percent of accounts that match your ideal customer profile, passed to the sizing first draft |
| `segments[].year_one_share_percent` | No | number (minimum 0, maximum 100) | Optional: the year one share you assume, as a percent, passed to the sizing first draft |
| `segments[].win_rate_percent` | No | number (minimum 0, maximum 100) | Your own win rate: the percent of qualified opportunities you win in this segment, from your closed deals (for example 33). Used only when the person has confirmed it |
| `segments[].year_one_customer_target` | No | number (minimum 0) | Optional: new customers you want from this segment in year one. Left out, the customer count from the sizing first draft is used |
| `segments[].seller_ramp_months` | No | number (minimum 0, maximum 24) | Months before a new seller carries a full pipeline |
| `segments[].seller_loaded_cost_per_year` | No | number (minimum 0) | Full yearly cost of one seller, in dollars |
| `segments[].ramped_deals_per_seller_per_year` | No | number (minimum 0) | Deals a fully ramped seller closes in a year in this segment, from your own record |
| `segments[].monthly_qualified_demand` | No | number (minimum 0) | Qualified opportunities assigned to sellers each month in this segment |
| `segments[].seat_cut_percent` | No | number (minimum 0, maximum 100) | Optional: the percent of seats a customer could cut if AI does more of the work (for example 25). Used only when the person has confirmed it |
| `segments[].arr_share_cutting_percent` | No | number (minimum 0, maximum 100) | Optional: the percent of this segment's revenue held by accounts that would make that cut (for example 32) |
| `segments[].seats_per_account` | No | number (minimum 0) | Optional: seats in an average account |
| `segments[].work_units_per_seat_per_year` | No | number (minimum 0) | Optional: units of work one seat handles in a year (for example contacts, shipments or claims) |
| `segments[].buyer_cost_per_seat_per_year` | No | number (minimum 0) | Optional: what one seat costs the buyer in a year, in salary and overhead, in dollars |
| `segments[].usage_price_per_unit` | No | number (minimum 0) | Optional: a price per unit of work you want to test, in dollars |
| `segments[].run_cost_per_unit` | No | number (minimum 0) | Optional: your cost to run one unit of work, in dollars |
| `segments[].gross_retention_gate_percent` | No | number (minimum 0, maximum 100) | Optional: your own gross retention line for releasing more money (for example 90) |
| `segments[].net_retention_gate_percent` | No | number (minimum 0, maximum 300) | Optional: your own net retention line (for example 100) |
| `segments[].logo_retention_gate_percent` | No | number (minimum 0, maximum 100) | Optional: your own logo retention line (for example 85) |
| `segments[].churn_reasons` | No | string | Optional: why customers in this segment leave or shrink, in their words, separated by semicolons |
| `segments[].motion_lead` | No | string | Optional: the lead motion from the EPIC audit on GTM Alpha, as it came back |
| `segments[].motion_score` | No | number (minimum 0, maximum 10) | Optional: the score of that lead motion, 1 to 10 |
| `segments[].motion_reason` | No | string | Optional: the audit's reason line for the lead motion, as it came back |
| `segments[].sizing_tam` | No | number (minimum 0) | Optional: TAM in dollars from the sizing calculator on ICP Intelligence |
| `segments[].sizing_sam` | No | number (minimum 0) | Optional: SAM in dollars from the sizing calculator |
| `segments[].sizing_som` | No | number (minimum 0) | Optional: year one SOM in dollars from the sizing calculator |
| `segments[].sizing_year_one_customers` | No | number (minimum 0) | Optional: customers needed in year one, from the sizing calculator |
| `confirmed` | No | object | What the person has confirmed. Set each to true only after asking them. Until the segment split is confirmed no sum runs |
| `confirmed.segment_split` | No | boolean | The person confirmed the segments are how their closed deals really divide |
| `confirmed.win_rate` | No | boolean | The person confirmed the win rates are their own, from closed deals |
| `confirmed.seat_cut` | No | boolean | The person confirmed what customers can cut, and the share of seats to test |

## Design Principles (v2.0)

1. **No blank `___` lines**: where your inputs give no fact, the output shows a placeholder in brackets to fill in
2. **Context-aware**: outputs adapt based on inputs provided
3. **Discovery mode**: if information is missing, tools ask questions to find it
4. **A structured draft with placeholders**: each tool returns a structured draft to edit, with placeholders where your inputs gave no fact
5. **Progressive enhancement**: more input gives a richer output

## Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, [Helix GTM Consulting](https://tools.gtmhelix.com), with 24+ years in B2B and 10+ years of fractional experience

## License

MIT


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://craft-gtm.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://craft-gtm.gtmhelix.com/connect/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http craft-gtm https://craft-gtm.gtmhelix.com/mcp`

The repository defines the stdio and hosted entry points using `createServer()` in `src/server.ts`.

## Privacy Policy

Full policy: <https://craft-gtm.gtmhelix.com/privacy/> (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Inputs and answers are not stored: no database, no files, no cache, no logging of inputs or outputs by our code. Each call adds one anonymous usage record (date and time, site and tool name, app kind, web form or assistant); see the privacy page.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
