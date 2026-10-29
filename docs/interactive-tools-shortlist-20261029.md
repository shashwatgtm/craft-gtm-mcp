# Next interactive tools shortlist

Design review note for Helix GTM Consulting. 29 October 2026.

## Recommendation

Select these three existing tools, in this order:

| Rank | Existing tool | What the user types | What they need to see and change | What they take away |
| --- | --- | --- | --- | --- |
| 1 | `account_prioritization` | A synthetic account list, their scores and optional weights | A ranked table, default values, factor contributions and tier boundaries. Change a score or weight and compare the new order. | A defensible order for account work, with reasons and gaps. |
| 2 | `pmf_scorecard` | Product, market segment and metrics as text | Which figures were read, which were scored, missing dimensions and example benchmarks. Correct the metrics text and recalculate. | A qualified scorecard and a short list of missing evidence. |
| 3 | `content_repurposer` | Source text, source type and optional formats, voice and key message | Source beside each channel draft. Inspect proof, missing links and caveats. Edit inputs and regenerate. Edit a local copy before taking it away. | A reviewed set of channel drafts with source qualifications intact. |

These choices cover ranking, metric inspection and content review. They extend the Market Sizing and Positioning prototypes without selecting another version of the same job. This ranking is a design judgment. It is not a measured demand result.

Sales Enablement and Positioning are excluded from near-term implementation while their versions are in OpenAI review. The Sales hold includes the revenue repository tools and `sales_enablement_content` in the content repository. The Positioning hold covers the IMPACT tools. This batch does not alter either reviewed integration. Alpha remains held out of OpenAI. Its inclusion in the evidence review implies no launch readiness.

## Evidence and limits

All inspection and compilation happened in the attached Codex Cloud environment under `/workspace`. No owner laptop was used. No AGENTS.md file was found under `/workspace`, excluding dependencies and Git metadata. The original six snapshots started clean on local branch `work`. The refreshed CRAFT GTM and Content source sets were assembled in isolated cloud scratch directories. No other workstream branch was changed.

| Repository under `shashwatgtm` | Inspected snapshot SHA | Definition and execution paths |
| --- | --- | --- |
| revenue-enablement-mcp | `740897982e3807aa43aa5420336eaf6804eeda5d` | `src/index.ts`, `src/rw1-account.ts`, `src/rw1-roi.ts` |
| craft-gtm-mcp | `8dfee13d07bcf0deb336e5517e5b0189b21e294a` | `src/tools.ts`, `src/server.ts`, `src/pmf-scorecard.ts`, `src/utils.ts`, `src/launch-commander.ts`, `src/rw-launch.ts` |
| impact-mcp | `765730ad684365b1da444d77768b9803c8d49491` | `src/index.ts`, `src/rw-impact.ts`, `src/rw-impact2.ts` |
| icp-intelligence-mcp | `80296186cd67fa6fdc610151eedcdd43f8fc329f` | `src/index.ts`, `src/rw-icp.ts` |
| craft-content-mcp | `34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1` | `src/tools.ts`, `src/server.ts`, `src/content-repurposer.ts`, `src/sector.ts`, `src/draft.ts` |
| gtm-alpha-secure | `e9b5a61786ab84b4405017b2726231432a8e4d5d` | `netlify/functions/mcp-sse.js`, `netlify/lib/epic-advanced.js` |

The owner supplied updated CRAFT GTM and Content main heads at 18:50 IST on 29 October 2026. I independently confirmed both through connected GitHub branch reads. The other four rows retain the coordinator-verified snapshots from the first inspection. Alpha uses master. The new documentation commit has current CRAFT GTM main as its sole parent. It does not include the earlier local documentation commits.

Refreshed source links:

- [PMF writer at the current base](https://github.com/shashwatgtm/craft-gtm-mcp/blob/8dfee13d07bcf0deb336e5517e5b0189b21e294a/src/pmf-scorecard.ts)
- [CRAFT GTM tool schemas](https://github.com/shashwatgtm/craft-gtm-mcp/blob/8dfee13d07bcf0deb336e5517e5b0189b21e294a/src/tools.ts)
- [Content repurposer at the current source head](https://github.com/shashwatgtm/craft-content-mcp/blob/34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1/src/content-repurposer.ts)
- [Content tool schemas](https://github.com/shashwatgtm/craft-content-mcp/blob/34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1/src/tools.ts)
- [Case study writer](https://github.com/shashwatgtm/craft-content-mcp/blob/34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1/src/case-study-generator.ts)

The ranking remains unchanged. PMF now explains that its result is a rule score rather than proof. That improves its text fallback, but users still need to inspect parsing, example ranges and the scored basis. The blog summary now avoids repeating the title as its opening. The separate case study writer retains a fourth supplied outcome. Those fixes improve generated prose. They do not replace the source-to-draft review job or make Content Repurposer a lossless conversion of every supplied result.

Paths above refer to each repository's own root. The five TypeScript servers were compiled from source into scratch directories. Their actual `tools/list` schemas were inspected through the SDK's in-memory transport. There were 45 listed tools: 12 revenue, 8 CRAFT GTM, 8 IMPACT, 9 ICP and 8 content. Alpha's three definitions were read directly. Its deterministic scoring function was called locally. No hosted endpoint was called.

The current selected tools return Markdown in `content[].text`. They do not currently supply the proposed UI resource or `structuredContent` contract below. Do not parse Markdown into a claimed authoritative scoring model. A later implementation would need structured results from the same calculation path.

### Official documentation

Required exact URLs:

1. https://developers.openai.com/plugins/build/chatgpt-ui
2. https://developers.openai.com/plugins/deploy/app-review

The attempted Markdown variants were https://developers.openai.com/plugins/build/chatgpt-ui.md and https://developers.openai.com/plugins/deploy/app-review.md.

I directly read both official HTML pages through the connected web tool on 29 October 2026. The UI page confirms MCP Apps metadata, the host bridge, text fallback, structured results, inert rendering and exact-domain CSP. The review page says scanned schemas and UI metadata form part of the review snapshot. Positioning and Sales remain held out of near-term changes under the owner's review instruction. No submission or publication step is authorized here.

Use MCP Apps `ui/initialize`, notifications, `tools/call` and `structuredContent`. Associate the resource with `_meta.ui.resourceUri` on the existing named tool. Serve `text/html;profile=mcp-app`. The page also shows a separate render-tool pattern. The owner explicitly requires attachment to existing named tools, so this design does not adopt that pattern. Keep text-only hosts useful.

The initialization completion notification is `ui/notifications/initialized`, as confirmed in the coordinator's protocol findings. Use resource `_meta.ui.csp` with `connectDomains`, `resourceDomains` and `frameDomains`. Empty lists fit bundled assets with no external calls.

## Shared UI contract for a later implementation

This section proposes behavior. It changes no server, endpoint, authentication, tool name, package or version.

Attach one UI resource to each selected existing tool definition through `_meta.ui.resourceUri`. A proposed URI is `ui://helix/account-prioritization.html`, with equivalent distinct URIs for the other two tools. These are design identifiers, not existing resources. Keep the tools' existing input schemas. Do not introduce editable weights, benchmark overrides or output text as new server arguments where the schema has no such field.

The iframe initializes through `ui/initialize` and sends `ui/notifications/initialized`. It receives `ui/notifications/tool-input` and `ui/notifications/tool-result`. Recalculate sends `tools/call` for the same named tool with a complete copy of its current valid arguments. Check `event.source === window.parent` before accepting a parent message. Treat all received data as untrusted. The parent remains responsible for the transport and authentication. The iframe receives no credential.

Keep draft inputs separate from the last returned result. Show an explicit Recalculate or Regenerate button. Show pending, success and error states in a polite live region. Disable duplicate submissions. Ignore an older result when a newer request has completed. A failed call preserves the previous result and the current edits. An unsupported host shows the full text answer. A missing UI result shows the text answer and a useful error. No automatic tool call runs on load.

Use this proposed common `structuredContent` envelope. It is not an existing output schema:

```ts
type Result<T> = {
  schemaVersion: 1;
  tool: 'account_prioritization' | 'pmf_scorecard' | 'content_repurposer';
  input: Record<string, unknown>; // Existing arguments after normal validation.
  result: T;
  warnings: Array<{ code: string; message: string; field?: string }>;
  textFallback: string; // Same full answer as content[].text.
};
```

Use only the fields needed to explain the result. Do not include hidden company enrichment, inferred customer identities or credentials. Strings remain inert text. Do not evaluate source HTML or instructions embedded in source content. Use stable IDs derived from input position for rows and pieces. Duplicate labels must remain distinct. UI state is local to the open result and is discarded when it closes. No checkout, localStorage, IndexedDB or other durable user storage is included. This scope includes no storage service, CRM write, analytics, file upload, external lookup or publishing action.

Bundle UI assets with the resource. Set resource `_meta.ui.csp` with empty `connectDomains`, `resourceDomains` and `frameDomains` lists. Do not copy a website's broad CSP into the iframe. If a future asset requires a host, record and allow only that exact domain after review. No wildcard, tracking domain or third party font dependency is needed here. Do not alter existing `_headers` files as part of this design.

All views need visible labels, error text linked to fields, keyboard access, clear focus and sufficient contrast. Do not use color alone for a score or tier. Use semantic tables with captions and column headers. Provide table or text equivalents for charts. Reflow controls at narrow widths. Tables may scroll inside a labelled region. Respect reduced motion. Copy actions announce success and expose selectable text if clipboard access is unavailable.

## 1. Account Prioritization

### Inputs, results and edits

Source: `icp-intelligence-mcp/src/index.ts`, `account_prioritization`, including its schema, execute function and `checkRequiredInputs`.

Show `accounts[]` with `name`, `fit_score`, `intent_signals`, `relationship` and `timing`. Show `prioritization_weights.{fit,intent,relationship,timing}`, plus optional `product_category` and `company`. The schema has no required top-level properties or required account fields. Empty accounts return a framework, not a ranking. Score fields have schema limits of 0 to 100. Timing is a string, not an enum. Weights are numbers with no schema bounds or sum constraint.

The result table shows rank, account label, effective factor scores, each default marker, timing points, total score and tier. Selecting a row reveals exact contributions and the returned reason and next action. Show the sum of weights and tier cutoffs beside the weight controls. Do not label caller-supplied intent as detected external buying behavior. The tool does no enrichment.

Permit editing every existing input. Add and remove rows locally. Recalculate replaces the ranking only after a successful same-tool call. A comparison column may show rank movement against the previous result. Sorting for inspection must not change the underlying calculated rank. Keep all account rows visible in the result data. The existing text supplies detailed next actions for only the first five accounts. Do not invent actions for the rest.

### Exact deterministic rules

- Missing or null numeric scores use 50. An explicit zero remains zero.
- Missing or null weights use 40, 30, 15 and 15. Explicit zero weights remain zero.
- Timing is lowercased without trimming. `now` gives 100, `soon` 70 and `later` 40. Unknown, omitted and other strings give 50. For example, ` now ` gives 50. Show the effective points even when the raw label is unfamiliar.
- Total is `Math.round(sum(score * weight / 100))`. No normalization is applied. A sum of weights of 200 permits a maximum score of 200.
- Let `W = Number(sum(weights).toPrecision(12))`. A, B and C start at `ceil(W * 80 / 100)`, `ceil(W * 60 / 100)` and `ceil(W * 40 / 100)`. D is below C. Compare the rounded total to these cutoffs.
- Sort by total descending. Equal scores retain input order under the current stable JavaScript sort. Factor contribution ties retain fit, intent, relationship, timing order.
- Reasons use the greatest positive-weight contribution. The opening label can still say Strong ICP fit when a different factor contributes most. Show both parts accurately.
- Four explicit zero weights are refused. The current server does not reject every negative-weight combination. Do not silently clamp, normalize or claim stronger server validation. Flag a negative weight or a nonpositive effective maximum as unsuitable for interpretation. Require the user to correct it in the UI before recalculation. This is a proposed UI guard, not a server fix.

The arithmetic is computed. Weights, timing mappings and suggested actions are examples or heuristics. Scores are caller assessments. A rank is not a win probability, forecast or recommendation to contact a real prospect.

### Proposed result shape

```ts
type AccountResult = {
  mode: 'framework' | 'ranking';
  weights: Record<'fit' | 'intent' | 'relationship' | 'timing', number>;
  defaultWeights: string[];
  maximum: number;
  cutoffs: { A: number; B: number; C: number };
  accounts: Array<{
    id: string; inputIndex: number; name: string; rank: number;
    scores: { fit: number; intent: number; relationship: number; timing: number };
    timingInput: string | null;
    defaults: string[];
    contributions: { fit: number; intent: number; relationship: number; timing: number };
    total: number; tier: 'A' | 'B' | 'C' | 'D';
    reason: string | null; nextAction: string | null;
  }>;
};
```

The fallback retains weights, default markers, the full ranked table, tiers and the available next actions. Empty input retains the existing framework and example labels.

### UI description, dependencies and scope

At wide widths, a factor editor sits above the ranked table. A row details panel appears below the selected row. At narrow widths, labelled numeric fields stack above a horizontally scrollable table. All actions have buttons. Arrow keys are not required to discover any edit. Announce the changed rank after recalculation without moving focus away from the button.

Depends on shared server validation, `cleanDeep` and `escapeDeep`, context reading and the existing ranking function. A later structured adapter must share that function's numbers and defaults. No inferred ICP score, bulk import, saved scenario service or cross-tool connection is included. In particular, do not wire ICP Scoring Model output into `fit_score` without a separate design.

## 2. PMF Scorecard

### Inputs, results and edits

Sources: `craft-gtm-mcp/src/tools.ts`, `src/pmf-scorecard.ts`, `src/utils.ts` and `src/server.ts`.

Required inputs are `product`, `target_market` and `current_metrics`. Optional inputs are `time_in_market`, `customer_feedback`, `business_model` and `your_sector`. Use the actual schema enum choices. Do not substitute a free-text market selector. Preserve the metrics text exactly while showing the parsed figures next to it.

Show the overall score, stage, scored count, applicable count and data sufficiency caveat together. Show each parsed value, score, status and labelled example benchmark. Show extra metrics separately from scored dimensions. Show unscored figures, feedback responses, recommendations and missing data. Do not let a prominent stage hide a sparse basis.

Edit the existing input fields and recalculate. A metric row can focus the metrics text field. Do not add independent numeric controls that silently change the parser's result or introduce new arguments. Benchmark replacement is outside this scope because the current tool has no override input. Time in market is descriptive only.

### Exact deterministic rules

- `parseMetrics` reads the first regex match for each supported metric. MRR, ARR and ACV support K or M suffixes. CAC and LTV use their numeric captures without those suffix multipliers. Show the parsed amount before interpreting it.
- LTV:CAC is computed only when LTV and CAC are truthy and CAC is positive. A zero LTV does not produce a zero ratio. This is current behavior, not a proposed fix.
- Scored dimensions are churn, NPS, LTV:CAC, retention and activation. Activation is excluded for services, connectivity and investment. Other detected metrics do not raise the score.
- Higher-is-better dimensions score 9 at or above high, 7 at or above medium, 5 at or above low and 3 below low. Churn reverses the comparisons: at or below low gives 9, medium 7, high 5 and above high 3. Missing dimensions have a displayed zero but are excluded from the average.
- Overall score is the mean of included scores, rounded to one decimal. No matched dimensions gives zero with Not scored yet. Fewer than three scored dimensions gives Too few metrics to judge fit yet. Preserve that warning even if the returned stage is Strong PMF.
- Stage cutoffs are 8, 6 and 4 for Strong PMF, Emerging PMF and Searching for PMF. Below 4 is Pre-PMF. These are framework labels, not verified business outcomes.
- Enterprise SaaS churn low, medium and high are 1, 3 and 5. Its NPS values are 30, 50 and 70. LTV:CAC values are 2, 3 and 5. Retention values are 85, 90 and 95. Activation values are 40, 60 and 80. All are examples.
- Other named market choices use their own source table or the explicit `RANGE_FOR` alias. Logistics tech, vertical SaaS, AI native, software and cybersecurity reuse enterprise SaaS ranges. IT services and telecom reuse generic other ranges. Show the actual range key.
- The churn parser does not convert annual churn to monthly churn. The result labels churn as monthly. Expose that limitation beside the source text. Do not convert a period silently. NRR is labelled only when a retention number is parsed and the text contains a recognized net retention term.
- Feedback is classified by fixed text rules. It does not change the numeric score. Company claims, recognition and quotes require provenance. They do not verify product-market fit.

The updated assessment explicitly calls this a rule score, not proof of product-market fit. A strong but incomplete assessment asks for missing data before scaling. A complete one asks for history and customer evidence. Preserve those exact qualifications in the UI and fallback.

A residual source limitation remains: with only NPS, LTV:CAC and activation supplied at excellent values, the result is based on 3 of 5 dimensions and has the missing-data warning, but Priority Actions falls back to All dimensions scoring well: focus on scaling. The focused check reproduced this. Keep the rule-score and completeness caveats adjacent to any action text. Do not present the fallback as an independent endorsement. This docs-only change does not fix the writer.

The score arithmetic is computed. Benchmarks and action text are example content. The analysis date depends on the system clock. A later parity test must freeze or ignore that date rather than call the whole string timelessly deterministic.

### Proposed result shape

```ts
type PmfResult = {
  market: string; rangeKey: string; businessModel: string | null;
  analysisDate: string;
  overall: { score: number; stage: string; scoredCount: number; applicableCount: number; caveat: string | null };
  dimensions: Array<{
    id: 'churn' | 'nps' | 'ltvCac' | 'retention' | 'activation';
    value: number | null; applicable: boolean; includedInAverage: boolean;
    score: number; status: string;
    benchmark: { low: number; medium: number; high: number; example: true };
    analysis: string;
  }>;
  parsedMetrics: Record<string, number | boolean | string>;
  unscoredFigures: string[];
  feedback: Array<{ text: string; classification: string; nextStep: string }>;
  recommendations: string[]; missingData: string[];
};
```

The fallback keeps the complete existing scorecard. It must retain sparse-data warnings, excluded activation, example ranges, unscored figures and data gaps. A text-only user can edit `current_metrics` and call `pmf_scorecard` again.

### UI description, dependencies and scope

Place a labelled metrics text area next to a parsed-value table. Put a compact assessment above the dimension table. Expand feedback and recommendations with native disclosure controls. On a small screen, inputs precede results in reading order. Status text accompanies every score. Announce the basis and score together after recalculation.

Depends on `parseMetrics`, `scoreMetric`, context reading, `MODEL_MEASURES` and the existing validation and escaping path. A later result adapter must expose these exact calculations. No new benchmark data, financial advice, survey service, period conversion or parser correction is included.

## 3. Content Repurposer

### Inputs, results and edits

Sources: `craft-content-mcp/src/tools.ts`, `src/server.ts`, `src/content-repurposer.ts`, `src/sector.ts` and `src/draft.ts`.

Required inputs are `source_content` and `source_type`. Optional inputs are `target_formats`, `brand_voice`, `key_message` and `your_sector`. Formats remain a comma-separated string when calling the existing tool. A UI checklist may serialize to that string. Keep unrecognized requested names visible. Use the source type and voice enums from the actual schema.

Show the source and one selected output side by side. Offer a labelled format selector, source notes and proof review. Show removed claims and missing source links before the copy action. The existing default formats are LinkedIn post, X thread, email, blog summary and quote cards. The ten supported formats also include infographic outline, video script, podcast talking points, slide deck outline and newsletter section.

Inputs can be edited and regenerated through `content_repurposer`. A local draft editor can alter output copy. Label it Edited locally. Local edits are not server results and are not accepted server arguments. Warn before regeneration replaces a dirty draft. Keep an explicit reset to generated copy. Recompute only local character and word counts after a local edit. Do not call those counts a quality, compliance or factual accuracy score. Copying does not publish anything.

### Exact deterministic rules

- The writer applies `fixNumbers` and `cleanClaims` to source and key message. It records removed superlatives for the user to source. It does not check external evidence.
- Proof paragraphs begin with Proof, Result, Results, Evidence or Customer results followed by a colon. Other paragraphs provide key points. A figure somewhere in a source is not automatically verified proof.
- `pickKeyPoints` considers sentences of at least 25 characters, excluding the title. It adds 4 for ordinal language, 2 for a recognized name, 3 for a vendor verb, 2 for a digit, 1 for result language and 1 for at least two long-word matches with the key message. It subtracts 1 below 40 characters and 2 above 300 characters. It selects up to five, then restores source order. Helper regexes define these cues.
- The writer removes near duplicates when the shared long-word count divided by the smaller word-set size exceeds 0.6. It can shorten long source sentences. The UI must not imply all source sentences survive unchanged.
- Proof selection excludes partner statements from customer proof. It prefers a result, quote or story with a figure, then specified result language, then other eligible proof. Labels and source caveats travel with the output. This remains a heuristic on supplied text.
- Format names are lowercased and whitespace becomes underscores. Unknown names are reported and produce no piece. No supported formats means no generated pieces, with a useful explanation.
- The current blog summary omits an opening equal to its title and filters points already shown above it. It falls back to the full points list when filtering leaves no points. Do not claim universal duplicate removal. The separate case study writer includes up to six own outcomes in its story, then points to the remaining Outcomes section. This fixes the fourth-result case in that writer, not in every repurposed channel.
- Voice changes greeting, sign-off and closing lines. It does not promise a full rewrite of the source in that voice.
- Source caveat detection carries up to two qualifying sentences, such as synthetic or unverified, into each piece. Retain these in generated and copied content. User edits can still remove them, so show a visible warning if a local draft drops an original caveat.
- Thread splitting targets short posts, but the writer can still emit an over-280-character warning. Preserve it. Do not claim automatic platform validation.

Outputs are deterministic transformations and fixed format prose. They are not generated research, verified customer testimony, a fresh performance claim or publishing approval. Local character counts are computed UI values and must stay separate from server provenance.

### Proposed result shape

```ts
type ContentResult = {
  requestedFormats: string[]; unknownFormats: string[];
  sourceNotes: { sourceType: string; wordCount: number; voice: string; coreMessage: string };
  keyPoints: string[];
  proof: Array<{ id: string; text: string; kind: string; sourceLabel: string; used: boolean }>;
  claimsToSource: string[]; caveats: string[]; missingInputs: string[];
  pieces: Array<{ id: string; format: string; text: string; warnings: string[] }>;
  sectorNotes: string;
};
```

Local state adds `draftText` and a dirty flag per piece. It does not overwrite the returned `pieces[].text`. The fallback keeps all generated pieces, source notes, unsupported formats, proof qualifications and missing-input guidance. A text-only user can ask for one format or change the source and call the same tool again.

### UI description, dependencies and scope

At wide widths, the source panel is left and the selected channel draft is right. Under the draft, show Copy draft, Reset draft and a character count. Proof and caveats are adjacent to those actions. Use a native select for format choice, or a correctly implemented keyboard tab pattern. At narrow widths, source, controls, draft and proof appear in that order. Regeneration preserves focus and announces the changed formats. A source claim is rendered as text, including attempted HTML.

Depends on the source selection and proof helpers, `neutraliseDeep`, `reshapeLists`, `closeDanglingBrackets` and the shared writer path. A later structured adapter must return the final safe text after the same finishing steps. No social integration, email sending, hosted video change, scheduling, paid model call or content publication is included.

## Alternatives and why they wait

| Candidate | Actual behavior observed in code or synthetic output | Decision |
| --- | --- | --- |
| `launch_commander` | `src/tools.ts` requires product_feature, launch_type, target_segments and goals. Optional date, channels, team, budget, business model and sector shape a plan through `src/rw-launch.ts`. Exact dates offset preset phases. TBD keeps relative weeks. Month and quarter modes use an assumed middle date for the countdown. Goals are classified by text rules. Ten meetings across two segments becomes five per segment. Team changes role labels. Budget changes tactic prose. | Close fourth. Date inspection is useful, but task completion, owner assignment, capacity, dependencies and budget optimization are not current input fields or calculations. A credible editable planning board needs a separate local-state design. Do not present it as a scheduling engine. |
| `icp_scoring_model` | `icp-intelligence-mcp/src/index.ts` creates a template. Custom importance gives 25, 15 or 10 points. Missing importance displays important but currently follows the 10-point fallback branch. Named target values get the full weight, with a closing other or none at zero. Ordered ranges use stepped points. Maximum is the weight sum. Tier lower bounds are ceilings at 80%, 60% and 40%. Success text matching does not learn weights. | Useful later, but it does not score supplied accounts. In the synthetic output both named target segments received 25 points. A shared word also matched the success statement to both segments. A calibration UI could otherwise imply evidence-based fitting that does not exist. It also overlaps the first choice. |
| IMPACT tools | `impact_full_audit` produced 45/100 for the supplied short synthetic inputs and explicitly called it input completeness. `impact_craft_message` constructs positioning text from inputs. `impact_get_framework` returns method content and sector patterns. | Excluded from near-term implementation because Positioning is now In review. It also overlaps the earlier prototype area. Completeness must not become a persuasive positioning quality gauge. |
| Other ICP tools | The actual list includes TAM/SAM/SOM, buyer groups, gap analysis, evolution, interview synthesis, lookalike signals and deep dive. Their schemas are in `src/index.ts`. | TAM overlaps Market Sizing. Buyer maps, text synthesis and heuristic gap reports have a weaker immediate recalculation case than supplied account scores. No external lookalike discovery is implied. |
| Other CRAFT GTM tools | Interview, retention, partner, crisis, competitive and document analysis return guides, draft tables or rubric results from inputs. | Several deserve later comparison views. None beats transparent ranking or metric parsing for this batch. Crisis content also needs careful review of example response times before any action-board design. |
| Other content tools | Case study, newsletter, webinar, thought leadership, testimonial and content improvement have input-specific writers. Sales enablement content is explicitly excluded. | Repurposer has the strongest repeated source-to-many-drafts review loop. This decision does not authorize publication or validate claims in the other writers. |
| Revenue Enablement | `account_plan_builder` returned one row for each of the two synthetic contacts. ARR-based tiers and a dated 90-day narrative came from rules. ROI paths distinguish buyer figures from missing-data guidance in `src/index.ts` and `src/rw1-roi.ts`. | Excluded by the review hold, regardless of potential UI value. No contact map, ROI editor or sales tool is selected. |
| Alpha `epic_audit`, `gtm_consultation`, `generate_roadmap` | Definitions are in `netlify/functions/mcp-sse.js`. EPIC uses `netlify/lib/epic-advanced.js`, stage defaults, threshold adjustments, clamps and explicit tie rules. Seed-only input returned E3, P4, I5, C2 and preliminary true. Roadmap is preset action content by motion, time horizon and business model. | Held out of OpenAI. Scenarios could be useful, but no launch readiness or submission is implied. The coordinator verified this retained Alpha snapshot against master during the first inspection. Do not mix the advanced MCP score scale with the separate audit functions. |

## Planned acceptance tests for future implementation

These are test requirements, not tests run for a UI in this workstream.

| Area | Cases and expected behavior |
| --- | --- |
| Account arithmetic | Default 80/60/40/now gives 71 and B. Explicit zeros remain zero. Missing values are visibly 50. Unknown timing gets 50. Four zero weights are refused. Weights summing to 200 stay unnormalized. Fractional weights, equal ranks, threshold rounding and duplicate names retain parity. Negative weights expose the proposed UI guard. |
| PMF arithmetic | Five excellent enterprise SaaS dimensions give 9/10. One excellent NPS keeps the sparse warning. Services exclude activation. Missing dimensions do not dilute the average. Check every threshold boundary, zero CAC, zero LTV, alias ranges, negative NPS, unsupported metrics, repeated metrics and annual churn wording. |
| Content provenance | Missing proof creates no claimed customer result. Unknown format creates no piece. Synthetic and unverified caveats survive each supported format. Partner words are not customer testimony. Removed superlatives remain listed. Check source order, long sentences, no key points, duplicates and long thread warnings. |
| Contract parity | Compare structured numbers and text fallback against the same writer output. Validate proposed output schemas. Preserve exact tool names and argument schemas. No render tool appears in tools/list. Freeze dates where necessary. Test failure and text-only hosts. |
| UI behavior | Initialization, input notification, result notification, repeated recalculation, out-of-order replies, tool error, malformed structured result and reconnect preserve useful state. Dirty local content is not overwritten without an explicit choice. |
| Access and safety | Keyboard-only edit and copy, screen reader field errors and result announcements, narrow layout, zoom, contrast and reduced motion. Markup remains inert. Empty external CSP lists load bundled assets. No external request or credential appears in the iframe. |

## Executed checks and receipts

Delivery base: `8dfee13d07bcf0deb336e5517e5b0189b21e294a`, current CRAFT GTM main confirmed through the GitHub connector. Content source: `34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1`.

Delivery branch: `codex/interactive-shortlist-20261029`. The GitHub commit has the delivery base as its sole parent. The PR is opened as draft against main. The final handoff reports the verified PR URL and actual GitHub head. Only `docs/interactive-tools-shortlist-20261029.md` changes. No runtime code from scratch validation is included in the branch.

### Current refresh checks

Only changed source assumptions and cited schemas were revalidated. The source comparisons showed four changed TypeScript files in CRAFT GTM and two in Content. All six were fetched at the pinned SHAs and replaced in scratch copies. Other source files and installed dependencies were reused. Neither repository's input schema file changed. No package installation occurred.

Exact cloud compilation commands, each from the stated scratch directory:

```sh
# CWD /workspace/work/interactive-shortlist/resume/craft-gtm-mcp
./node_modules/.bin/tsc --outDir dist
# CWD /workspace/work/interactive-shortlist/resume/craft-content-mcp
./node_modules/.bin/tsc --outDir dist
```

Compilation: 2 passed, 0 failed. These compile the current source sets for validation only. They run no package lifecycle or deployment command.

Exact focused check command:

```sh
node /workspace/work/interactive-shortlist/resume/changed-assumptions.test.mjs
```

| Check | Actual result |
| --- | --- |
| PMF incomplete strong score | 4 of 5, rule-score caveat, missing-data warning and no old Focus on scaling sentence for the missing-activation fixture |
| PMF complete strong score | 5 of 5 and history/customer evidence check before scaling |
| PMF residual fallback | 3 of 5 with churn and retention absent; assessment warns, but Priority Actions still contains the scaling fallback. Recorded as a limitation, not a fix. |
| Blog summary repetition | Synthetic title occurs once in the blog section; synthetic qualifier remains |
| Fourth case study result | Rework fell by 40% remains in the story for four supplied synthetic outcomes |
| PMF input schema | Exactly equal to the schema from the earlier inspected tool list |
| Content Repurposer input schema | Exactly equal to the schema from the earlier inspected tool list |

Focused checks: 7 passed, 0 failed, 0 skipped. These call the source writers and compare schemas in cloud. They are not hosted MCP tests or UI tests. The earlier `node --test` invocation reported one file-level pass. The direct command above reports all seven assertions and is the receipt count used here.

Exact note validation command:

```sh
python /workspace/work/interactive-shortlist/resume/validate-refresh.py
```

Note checks cover plain punctuation, current source provenance and review holds, explicit source limitations, direct documentation citations, cited paths, unchanged input schema source files, source snapshot hashes and the one-file delivery plan. Final result: 8 passed, 0 failed, 0 skipped. The initial note check returned 7 passed and 1 failed because its literal phrase differed from the note's equivalent wording about lossless conversion. The check was corrected. No source or design behavior changed.

GitHub delivery verification reads the created commit, branch and draft PR. It checks the parent base, actual head, draft state and the single changed filename. No workflow is dispatched. The PR is not marked ready.

No browser suite ran. UI remains design only. No screenshots are claimed. Precise proposed UI descriptions are in the three tool sections. Full repository regression suites were not repeated. Unchanged account arithmetic, Alpha, revenue and IMPACT runtime tests were not repeated.

### Earlier evidence retained without rerunning

The first inspection compiled five source snapshots and passed 13 focused synthetic checks. They covered account defaults, explicit zeros, weights summing to 200, four-zero-weight refusal, PMF complete/sparse/services behavior, ICP template points, launch planning mode, content unknown format, revenue contact rows, IMPACT completeness and Alpha seed defaults. Six document checks also passed at those original snapshots. Those are historical receipts, not fresh results against the new heads. The current checks above replace the changed PMF and Content assumptions.

The earlier exact command was `node /workspace/work/interactive-shortlist/inspect.mjs`. The five earlier builds used `./node_modules/.bin/tsc --outDir /workspace/work/interactive-shortlist/<repository>/dist`, from each corresponding repository root. Their original logs remain in cloud. No unchanged test was rerun merely to inflate the refreshed count.

## Automation and boundary audit

Before remote writes, I inspected the current CRAFT GTM recursive Git tree and `netlify.toml`. There is no AGENTS.md or GitHub workflow file in that tree. The configuration specifies TypeScript build output and the public directory. The owner's register confirms manual CLI deployment. This authorizes the requested GitHub branch and draft PR delivery without running a hosting command. No deployment settings are changed. The connector confirmed no remote branch of this name before creation.

The GitHub tree is based on current main and adds only this note. Earlier local documentation commits are preserved locally and excluded from the delivered commit ancestry. Existing source, tests, packages, authentication, endpoints, versions, tool names, challenge files, headers and hosted videos are preserved.

No client or prospect is named. Inputs are synthetic. No secret, token or credential value was read, output or committed. No deployment, hosting command, workflow dispatch, DNS change, submission, publication, package upload, skill packaging, legal declaration or paid API call occurred. No main/master write, merge, force push, ready-for-review action or other workstream branch change is included. The official review page is evidence for this design, not authorization to submit, publish or package skills. This work ends at a draft PR.
