# @shashwatgtmalpha/craft-gtm-mcp v2.2.0
🚀 **CRAFT GTM Framework MCP Server** - A complete redesign with intelligent analysis, metric parsing, and context-aware outputs.

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

Generated on 26 September 2026 from the server's own tool list (`tools/list` of craft-gtm-mcp 2.2.0, the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `pmf_scorecard` | PMF Scorecard | Generate a Product-Market Fit scorecard. Parses the metrics you provide (MRR, churn, NPS, CAC, LTV, retention, activation and similar) and scores each dimension against built-in benchmark ranges. |
| 2 | `launch_commander` | Launch Commander | Generate a context-aware launch plan. Have a date? Get a detailed timeline. Still planning? Enter 'TBD' or a quarter such as 'Q2 2027' for a flexible plan. |
| 3 | `customer_interview_kit` | Customer Interview Kit | Generate interview guides that ADAPT based on interview type, industry, and product complexity. Includes synthesis templates. |
| 4 | `retention_playbook` | Retention Playbook | Generate retention strategies. Has DISCOVERY MODE - if you don't know WHY people churn, get a churn analysis framework first. |
| 5 | `partner_architect` | Partner Architect | Design partner programs that ADAPT based on partner model type. Different structures for resellers vs referrals vs integrations vs affiliates. |
| 6 | `crisis_planner` | Crisis Planner | Generate crisis playbooks. Know your risks? Get specific playbooks. Not sure what to plan for? The tool uses a default set of common crises for your industry (not ranked by likelihood). |
| 7 | `competitive_intel` | Competitive Intel | Generate battle cards. If you know your strengths/weaknesses, get complete battle cards. If you only know competitors and win/loss stories, we'll derive your positioning. |
| 8 | `craft_gtm_analyzer` | CRAFT GTM Analyzer | Analyze a GTM document against the CRAFT framework. Parses the content, identifies gaps, scores each dimension and suggests sections to add. |

### Inputs of each tool

#### 1. PMF Scorecard (`pmf_scorecard`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product` | Yes | string | Product name and brief description |
| `target_market` | Yes | one of: `enterprise_saas`, `smb_saas`, `consumer`, `marketplace`, `fintech`, `healthtech`, `other` | Target market segment (e.g., 'Enterprise SaaS', 'SMB', 'Consumer') |
| `current_metrics` | Yes | string | Your current metrics (will be PARSED). Include any of: MRR, ARR, churn rate, NPS, CAC, LTV, retention rate, activation rate, DAU/MAU, trial conversion, revenue growth. Example: 'MRR: $50K, Churn: 3%, NPS: 45, CAC: $500, LTV: $3000, Retention: 92%' |
| `time_in_market` | No | one of: `pre_launch`, `0_6_months`, `6_12_months`, `1_2_years`, `2_plus_years` | How long the product has been in market (shown in the scorecard) |
| `customer_feedback` | No | string | Optional: Qualitative feedback themes (e.g., 'Users love X but struggle with Y') |

#### 2. Launch Commander (`launch_commander`)

| Input | Required | Type | Description |
|---|---|---|---|
| `product_feature` | Yes | string | What you're launching (product/feature name and description) |
| `launch_type` | Yes | one of: `major_release`, `feature_launch`, `beta_launch`, `product_update`, `market_expansion` | Type of launch determines plan complexity |
| `target_segments` | Yes | string | Target customer segments (comma-separated) |
| `goals` | Yes | string | Launch success metrics (e.g., '500 signups, $50k pipeline, 10% trial conversion, 1000 downloads') |
| `launch_date` | No | string | Target launch date. Accepts: 'YYYY-MM-DD', 'Q1 2027', 'March 2027', or 'TBD' for planning mode |
| `available_channels` | No | string | Optional: Marketing channels available (comma-separated). E.g., 'email, linkedin, blog, webinar, PR, paid_ads, community' |
| `team_size` | No | one of: `solo`, `small_2_5`, `medium_6_15`, `large_15_plus` | Marketing/GTM team size affects task distribution |
| `budget_level` | No | one of: `bootstrap`, `moderate`, `well_funded` | Budget affects recommended tactics |

#### 3. Customer Interview Kit (`customer_interview_kit`)

| Input | Required | Type | Description |
|---|---|---|---|
| `interview_type` | Yes | one of: `discovery`, `validation`, `feedback`, `churn`, `win_loss`, `persona_research` | Type of interview determines question focus |
| `product_context` | Yes | string | Product/service being researched |
| `target_persona` | Yes | string | Who you're interviewing (role/title) |
| `industry` | No | one of: `saas`, `fintech`, `healthtech`, `ecommerce`, `marketplace`, `enterprise_software`, `consumer`, `other` | Industry affects terminology and context |
| `product_complexity` | No | one of: `simple`, `moderate`, `complex`, `highly_technical` | Affects technical depth of questions |
| `key_hypotheses` | No | string | Optional: Hypotheses to validate during interview |

#### 4. Retention Playbook (`retention_playbook`)

| Input | Required | Type | Description |
|---|---|---|---|
| `customer_segment` | Yes | string | Customer segment to focus on |
| `business_model` | Yes | one of: `saas_subscription`, `usage_based`, `marketplace`, `transactional`, `freemium`, `enterprise_contract` | Business model affects health score weighting |
| `current_churn_rate` | Yes | string | Current churn rate (e.g., '5%' or '5% monthly') |
| `churn_reasons` | No | string | OPTIONAL: Known churn reasons (comma-separated). If you don't know, leave blank to get discovery mode with churn analysis framework |
| `available_data_signals` | No | string | What usage data you can track (comma-separated). E.g., 'login frequency, feature usage, support tickets, NPS responses' |
| `cs_team_size` | No | one of: `no_dedicated_cs`, `small_1_3`, `medium_4_10`, `large_10_plus` | CS team capacity affects intervention strategy |
| `current_interventions` | No | string | Optional: What retention tactics you already do |

#### 5. Partner Architect (`partner_architect`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Your company name |
| `product` | Yes | string | Product partners will sell/integrate |
| `partner_model` | Yes | one of: `reseller`, `referral`, `integration_tech`, `agency_si`, `affiliate`, `oem_white_label` | Partner type determines program structure |
| `partner_goals` | Yes | string | Revenue/growth targets from partners |
| `your_deal_size` | Yes | string | Average deal size, as a full amount (e.g., '$5000 ACV' or '$500/month'; shorthand such as '$5K' is read as 5). It scales the example commission amounts; the example rates are fixed |
| `partner_support_capacity` | No | one of: `minimal_self_serve`, `moderate`, `high_touch` | How much partner support can you provide? |
| `existing_partners` | No | string | Optional: Current partner types/count |

#### 6. Crisis Planner (`crisis_planner`)

| Input | Required | Type | Description |
|---|---|---|---|
| `company` | Yes | string | Company name |
| `industry` | Yes | one of: `fintech`, `healthtech`, `saas`, `ecommerce`, `enterprise`, `consumer`, `other` | Industry affects which crises to prioritize |
| `customer_base` | Yes | one of: `b2b_enterprise`, `b2b_smb`, `b2c_consumer`, `mixed` | Customer type affects communication approach |
| `data_sensitivity` | Yes | one of: `high_pii_financial`, `medium_business_data`, `low_general` | Data sensitivity affects security protocols |
| `potential_crises` | No | string | OPTIONAL: Crisis types to plan for (comma-separated). If not provided, the tool uses a default set of common crises for your industry (not ranked by likelihood). Options: data_breach, service_outage, pr_incident, executive_departure, security_vulnerability, regulatory_action, product_safety, customer_data_exposure |
| `company_size` | No | one of: `startup_under_50`, `scaleup_50_200`, `midsize_200_1000`, `enterprise_1000_plus` | Affects response team structure |
| `compliance_requirements` | No | string | Optional: Relevant compliance (GDPR, HIPAA, SOC2, etc.) |

#### 7. Competitive Intel (`competitive_intel`)

| Input | Required | Type | Description |
|---|---|---|---|
| `your_product` | Yes | string | Your product name and brief description |
| `competitors` | Yes | string | Competitor names (comma-separated). Will generate battle card for EACH |
| `your_strengths` | No | string | OPTIONAL: What you do better (comma-separated). Will be DERIVED from wins/losses if not provided |
| `your_weaknesses` | No | string | OPTIONAL: Where competitors beat you (comma-separated). Will be DERIVED from wins/losses if not provided |
| `competitor_details` | No | string | Optional: Any known details about competitors. E.g., 'Competitor A is cheaper, Competitor B targets enterprise' |
| `common_objections` | No | string | Sales objections you hear (comma-separated). E.g., 'too expensive, missing X feature, competitor has better Y' |
| `recent_wins` | No | string | Why customers chose you over competitors - will be used to DERIVE strengths |
| `recent_losses` | No | string | Why you lost deals to competitors - will be used to DERIVE weaknesses |

#### 8. CRAFT GTM Analyzer (`craft_gtm_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `document_content` | Yes | string | The GTM document/plan to analyze. Paste full content - it will be PARSED and EVALUATED |
| `document_type` | Yes | one of: `gtm_strategy`, `launch_plan`, `campaign_brief`, `quarterly_plan`, `project_proposal`, `marketing_plan` | Type of document (shown in the analysis) |
| `intended_audience` | No | string | Optional: Who will read/approve this document |
| `desired_outcome` | No | string | Optional: What action should this document drive |

## Design Principles (v2.0)

1. **No blank outputs** - Every `___` or `[Define]` replaced with generated content
2. **Context-aware** - Outputs adapt based on inputs provided
3. **Discovery mode** - If info missing, tools ask smart questions
4. **Actionable outputs** - Ready-to-use, not templates to fill
5. **Progressive enhancement** - More input = richer output

## Author

**Shashwat Ghosh** - [Helix GTM Consulting](https://helixgtm.com)

## License

MIT


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://craft-gtm.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://craft-gtm.gtmhelix.com/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http craft-gtm https://craft-gtm.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/server.ts`.

## Privacy Policy

Full policy: https://craft-gtm.gtmhelix.com/privacy.html (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). The web pages load fonts from Google Fonts.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
