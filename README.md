# CRAFT GTM MCP Server

**8 Strategic GTM Execution Tools** powered by the CRAFT Framework.

Created by [Shashwat Ghosh](https://gtmexpert.com) | Top 30 PLG Creator Worldwide

---

## 🎯 What is CRAFT GTM?

CRAFT GTM provides strategic GTM tools for **founders, CMOs, and strategy leaders** who need comprehensive frameworks for:

- Product-Market Fit Assessment
- Launch Planning & Execution
- Customer Research
- Retention Strategy
- Partner Programs
- Crisis Management
- Competitive Intelligence

**Typical use:** Quarterly planning, major initiatives, strategy development (1+ hour deep work)

---

## 🛠️ Tools Included

| Tool | Purpose | Output |
|------|---------|--------|
| `pmf_scorecard` | Assess Product-Market Fit | 5-dimension scorecard (0-100), gap analysis, 90-day plan |
| `launch_commander` | Plan product launches | 12-week timeline, RACI matrix, contingency plans |
| `customer_interview_kit` | Research customers | Interview scripts, question bank, synthesis templates |
| `retention_playbook` | Reduce churn | Health score model, intervention playbooks, alerts |
| `partner_architect` | Build partner programs | 4-tier structure, economics, enablement curriculum |
| `crisis_planner` | Prepare for crises | Severity levels, response templates, playbooks |
| `competitive_intel` | Win competitive deals | Battle cards, feature matrix, objection handlers |
| `craft_gtm_analyzer` | Improve strategy docs | CRAFT score, gap analysis, recommendations |

---

## 📦 Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "craft-gtm": {
      "command": "npx",
      "args": ["-y", "@shashwatah/craft-gtm-mcp"]
    }
  }
}
```

### Manual Installation

```bash
npm install -g @shashwatah/craft-gtm-mcp
craft-gtm-mcp
```

---

## 💡 Example Usage

### PMF Assessment
```
"Assess PMF for our product [name] targeting [market].
Current metrics: $50K MRR, 8% monthly churn, NPS 35, 6 months in market.
Customer feedback: Users love feature X but struggle with onboarding."
```

### Launch Planning
```
"Create a launch plan for [feature] launching [date].
Target: Enterprise IT managers in healthcare.
Goals: 500 signups, 50 demos, 10 closed deals in 30 days."
```

### Retention Strategy
```
"Build a retention playbook for our SMB segment.
Current churn: 5% monthly. Main reasons: Poor onboarding, missing integrations.
CS team: 2 people, using Intercom."
```

---

## 🔗 Related

- **[CRAFT Content MCP](https://github.com/anthropics/craft-content-mcp)** - 8 content creation tools (case studies, newsletters, webinars)
- **[IMPACT MCP](https://github.com/shashwatgtm/impact-mcp)** - Positioning framework
- **[EPIC MCP](https://github.com/shashwatgtm/epic-mcp)** - GTM strategy framework

---

## 📚 The CRAFT Framework

**C**haracter - Who executes this?
**R**esult - What's the desired outcome?
**A**rtifact - What gets produced?
**F**rame - What's the context?
**T**imeline - What are the steps?

---

## 📄 License

MIT License - Created by Shashwat Ghosh

---

*Part of the GTM Alpha Toolkit | [gtmexpert.com](https://gtmexpert.com)*
