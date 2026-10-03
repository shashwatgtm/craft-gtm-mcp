# @shashwatgtmalpha/craft-gtm-mcp v2.2.15
**CRAFT GTM Framework MCP Server**: a complete redesign with metric parsing, context-aware outputs, and a structured draft with placeholders where your inputs give no fact.

## Use it hosted (no install)

Add `https://craft-gtm.gtmhelix.com/mcp` to Claude or ChatGPT as a custom connector. It needs no sign-in and always runs the newest version (2.2.15). The same tools run as a free web app with a form per tool at https://craft-gtm.gtmhelix.com/, and the setup steps are at https://craft-gtm.gtmhelix.com/connect/.

The npm package below is an older version (2.0.1 on npm on 27 September 2026) until the next npm release. Use it only if you need a local stdio server.


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

Generated on 27 September 2026 from the server's own tool list and checked again on 2 October 2026 against `tools/list` of craft-gtm-mcp 2.2.15 (the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `pmf_scorecard` | PMF Scorecard | Takes your product, target market and current metrics (MRR, ACV, churn, NPS, CAC, LTV, retention, activation and similar) and returns a product-market fit scorecard that scores each dimension against example benchmark ranges. Reads the business model from your inputs and leaves the activation score out for services, connectivity and investment businesses. Quotes your customer feedback and answers it. |
| 2 | `launch_commander` | Launch Commander | Takes what you are launching, the launch type, your target segments and your goals, and returns a phased launch plan with tasks, a messaging table and success metrics. Give a date for a dated timeline, or enter 'TBD' or a quarter such as 'Q2 2027' for a flexible plan. Tasks and the messaging table follow the sector and business model read from your inputs, and each goal is filed under its own metric. |
| 3 | `customer_interview_kit` | Customer Interview Kit | Takes the interview type, the product context and the person you are interviewing, and returns an interview guide that fits the interview type, the sector (chosen, or read from your inputs) and the product complexity. Questions use the sector's own language, your hypotheses are kept whole, and synthesis templates are included. |
| 4 | `retention_playbook` | Retention Playbook | Takes your customer segment, business model and current churn rate, and returns a retention playbook with health signals, interventions and an email draft for each churn reason. If you do not know why customers leave, leave the churn reasons out and you get a churn discovery kit with a framework for finding out. Health signals and interventions follow the business model, each churn reason gets its own answer, and your current interventions and data signals are used. |
| 5 | `partner_architect` | Partner Architect | Takes your company, product, partner model, partner goal and deal size, and returns a partner program with tiers, example commission amounts and KPIs, with a different structure for resellers, referrals, integrations, agencies, affiliates and white label. Uses your stated goal, existing partners and deal size, and names the partner types that fit your sector's buying committee. |
| 6 | `crisis_planner` | Crisis Planner | Takes your company, industry, customer base and data sensitivity, and returns crisis playbooks with a response team and notification steps for each crisis. Name the crises you know of to get those playbooks. If you leave them out, the tool uses a default set of common crises for your sector (not ranked by likelihood). Each compliance item you list is used in the notification steps. |
| 7 | `competitive_intel` | Competitive Intel | Takes your product and the competitors you name, and returns one battle card per competitor built from your strengths, weaknesses, competitor details, objections, wins and losses. Each competitor detail goes to the competitor it names, each objection gets its own answer, and strengths and gaps taken from wins and losses are your own words. |
| 8 | `craft_gtm_analyzer` | CRAFT GTM Analyzer | Takes the text of a GTM document or plan and returns an analysis against the CRAFT framework, with a score for each dimension. Each dimension is scored only on what the plan contains (Timeline counts real dates, durations and quarters), the tool shows the plan's own line for each, names only the elements that are missing and suggests sections to add. |

### Inputs of each tool

#### 1. PMF Scorecard (`pmf_scorecard`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product name and brief description |
| `target_market` | Yes | one of: `enterprise_saas`, `smb_saas`, `consumer`, `marketplace`, `fintech`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Target market segment (for example enterprise SaaS, telecom or logistics tech) |
| `current_metrics` | Yes | string | Your current metrics, written as text (the tool reads the figures from it). Include any of: MRR, ARR, ACV, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%'. A figure that no rule scores is listed as not scored |
| `time_in_market` | No | one of: `pre_launch`, `0_6_months`, `6_12_months`, `1_2_years`, `2_plus_years` | How long the product has been in market (shown in the scorecard) |
| `customer_feedback` | No | string | Optional: Qualitative feedback themes, one per line or separated by semicolons (for example 'Customers like X; they struggle with Y'). Each theme is quoted and answered |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |

#### 2. Launch Commander (`launch_commander`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product_feature` | Yes | string | What you're launching (product/feature name and description) |
| `launch_type` | Yes | one of: `major_release`, `feature_launch`, `beta_launch`, `product_update`, `market_expansion` | Type of launch determines plan complexity |
| `target_segments` | Yes | string | Target customer segments (comma-separated) |
| `goals` | Yes | string | Launch success metrics (for example '40 qualified meetings, $300K pipeline, 5 reference customers') |
| `launch_date` | No | string | Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2027', 'March 2027', or 'TBD' for planning mode |
| `available_channels` | No | string | Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community' |
| `team_size` | No | one of: `solo`, `small_2_5`, `medium_6_15`, `large_15_plus` | Marketing/GTM team size affects task distribution |
| `budget_level` | No | one of: `bootstrap`, `moderate`, `well_funded` | Budget affects recommended tactics |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of: `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read |

#### 3. Customer Interview Kit (`customer_interview_kit`)

| Input | Required | Type | Description |
|---|---|---|---|
| `interview_type` | Yes | one of: `discovery`, `validation`, `feedback`, `churn`, `win_loss`, `persona_research` | Type of interview determines question focus |
| `product_context` | Yes | string | Product/service being researched |
| `target_persona` | Yes | string | Who you're interviewing (role/title) |
| `industry` | No | one of: `saas`, `fintech`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `ecommerce`, `marketplace`, `enterprise_software`, `consumer`, `other` | Industry affects terminology and context. Leave it out and the sector is read from your other inputs |
| `product_complexity` | No | one of: `simple`, `moderate`, `complex`, `highly_technical` | Affects technical depth of questions |
| `key_hypotheses` | No | string | Optional: Hypotheses to validate during interview, one per line or separated by semicolons |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |

#### 4. Retention Playbook (`retention_playbook`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_segment` | Yes | string | Customer segment to focus on |
| `business_model` | Yes | one of: `saas_subscription`, `usage_based`, `marketplace`, `transactional`, `freemium`, `enterprise_contract`, `services_contract`, `connectivity_contract`, `investment_mandate` | Business model affects health score weighting. enterprise_contract is read further from your text when it names services, connectivity or investment |
| `current_churn_rate` | Yes | string | Current churn rate (e.g., '5%' or '5% monthly') |
| `churn_reasons` | No | string | Optional: known churn reasons, comma-separated. If you do not know them, leave this blank and you get a churn discovery kit with a framework for finding the reasons |
| `available_data_signals` | No | string | What you can track (comma-separated). E.g., 'login frequency, support tickets, SLA attainment, QBR attendance' |
| `cs_team_size` | No | one of: `no_dedicated_cs`, `small_1_3`, `medium_4_10`, `large_10_plus` | CS team capacity affects intervention strategy |
| `current_interventions` | No | string | Optional: What retention tactics you already do (listed and compared with the playbook) |
| `product` | No | string | Optional: Your product or company name, used in the title and the email drafts |
| `industry` | No | one of: `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read |

#### 5. Partner Architect (`partner_architect`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Your company name |
| `product` | Yes | string | Product partners will sell/integrate |
| `partner_model` | Yes | one of: `reseller`, `referral`, `integration_tech`, `agency_si`, `affiliate`, `oem_white_label` | Partner type determines program structure |
| `partner_goals` | Yes | string | Revenue/growth targets from partners (shown as the target of the first KPI row) |
| `your_deal_size` | Yes | string | Average deal size as one amount (e.g., '$5000 ACV', '$5K' or '$500/month'; a range is refused). It scales the example commission amounts; the example rates are fixed |
| `partner_support_capacity` | No | one of: `minimal_self_serve`, `moderate`, `high_touch` | How much partner support can you provide? |
| `existing_partners` | No | string | Optional: Current partner types/count, one per line or separated by semicolons (listed in the plan) |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of: `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read |

#### 6. Crisis Planner (`crisis_planner`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Company name |
| `industry` | Yes | one of: `fintech`, `saas`, `logistics_tech`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `ecommerce`, `enterprise`, `consumer`, `other` | Industry affects which crises to prioritize |
| `customer_base` | Yes | one of: `b2b_enterprise`, `b2b_smb`, `b2c_consumer`, `mixed` | Customer type affects communication approach |
| `data_sensitivity` | Yes | one of: `high_pii_financial`, `medium_business_data`, `low_general` | Data sensitivity affects security protocols |
| `potential_crises` | No | string | Optional: crisis types to plan for, comma-separated. If not provided, the tool uses a default set of common crises for your sector (not ranked by likelihood). Options: data_breach, service_outage, sla_breach, regulatory_action, fraud_incident, ai_wrong_action, pr_incident, executive_departure, security_vulnerability, customer_data_exposure, product_safety |
| `company_size` | No | one of: `startup_under_50`, `scaleup_50_200`, `midsize_200_1000`, `enterprise_1000_plus` | Affects response team structure |
| `compliance_requirements` | No | string | Optional: Relevant compliance, comma-separated (for example ISO 27001, SOC 2, GDPR). Each item is named in the notification steps |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |

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
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you earn revenue, so the advice fits it (saas, services, connectivity, transactions, marketplace, hardware_software or investment). Leave it out and the tool reads it from your other inputs and says how it read it |
| `industry` | No | one of: `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read |

#### 8. CRAFT GTM Analyzer (`craft_gtm_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `document_content` | Yes | string | The GTM document or plan to analyze. Paste the full text: the tool reads it and scores it against the framework |
| `document_type` | Yes | one of: `gtm_strategy`, `launch_plan`, `campaign_brief`, `quarterly_plan`, `project_proposal`, `marketing_plan` | Type of document (shown in the analysis) |
| `intended_audience` | No | string | Optional: Who will read/approve this document |
| `desired_outcome` | No | string | Optional: What action should this document drive |
| `industry` | No | one of: `logistics_tech`, `fintech`, `saas`, `vertical_saas`, `ai_native`, `ites`, `telecom`, `software`, `cybersecurity`, `other` | Optional: the sector you sell into, so the answer uses that sector's buyers, measures and objections. Leave it out and the tool reads the sector from your other inputs and names what it read |

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

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/server.ts`.

## Privacy Policy

Full policy: https://craft-gtm.gtmhelix.com/privacy/ (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
