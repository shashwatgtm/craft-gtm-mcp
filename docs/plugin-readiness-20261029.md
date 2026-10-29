# Plugin readiness review, 29 October 2026

## Owner update and scope

The owner update at about 17:10 IST supersedes the earlier scope. This revision finishes ICP Intelligence only. PR [#2](https://github.com/shashwatgtm/craft-gtm-mcp/pull/2) remains draft on `codex/plugin-readiness-20261029`. Resume head: `9734333f8dea204b4ab3034b335e0dbf61095a12`. No package or version work is performed.

**SUPERSEDED: GTM Planning and Content Studio.** Their earlier sections, defect claims and proposed diffs are historical only. They must not be read as findings about current production. The owner reports GTM main `8dfee13d07bcf0deb336e5517e5b0189b21e294a`, deploy `6ae34147`, and Content main `34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1`, deploy `6ae30601`. The owner says the coordinator independently verified these GitHub heads and Claude built category-only packages locally. These are reported external results. W7 does not rebuild packages, redraft those sections, or retest those deployments.

[Earlier raw receipts](review-inputs/readiness-live-20261029.json) remain byte for byte unchanged. They record the earlier observation window, not current live findings. The earlier GTM and Content narrative and diff blocks are retained under an explicit historical heading below.

The owner reports Positioning is **In review**. No new version work is opened. Sales Enablement remains excluded and Alpha held. The cloud copy of `directory-submission-work/SESSION-LOG.md` ends on 2 October 2026. It does not contain the latest owner session. No claim of reading that newer log is made.

## ICP Intelligence: completed source and package review

Evidence has four separate meanings here:

| Evidence class | What was established |
| --- | --- |
| Exact staged package | Read `docs/review-inputs/packages-20261027.json` at PR resume head `9734333f8dea204b4ab3034b335e0dbf61095a12`. Archive `04-helix-icp-intelligence-1.2.26-openai-draft.zip`. Recorded SHA256 `71793A08FF8B6515D3FFADD8C0843822ACC8265C30F6F17DF27BA6141D9405DA`. The archive bytes and assets were not available for a fresh digest or asset check. |
| Package snapshot source | SOURCE.json pins `68835427ad818c0533776bb584d84430b5a9ecdb`, captured `2026-10-27T10:02:15.381365+00:00`. It records version `1.2.26`, nine tools and tools hash `2b92abd8c7256b5429f985e284a977aaf2e68c99c88d492a0300c445c6a40273`. These are historical capture claims. |
| Current source | GitHub main was read directly and is `80296186cd67fa6fdc610151eedcdd43f8fc329f`. Cloud checkout matches that commit. Git object hashes for index.ts, package.json, the hosted MCP adapter and counter match the GitHub tree. Their exact hashes and both source schema inventories are in the [source receipt](review-inputs/icp-source-review-20261029.json). |
| Current live MCP | Unknown. No ICP tools are exposed in this session. The current enforced restricted cloud policy excludes `icp-intelligence.gtmhelix.com`. No MCP HTTP request, initialize, tools/list, fixture call or bypass was attempted. Public web reads do not establish MCP deployment identity. |
| Host and portal | Unknown. No installed ChatGPT workflow, current portal draft, verification result, scan, legal status or video access check was performed. The package's old missing-gate list is not current portal evidence. |

The public [website](https://icp-intelligence.gtmhelix.com/), [privacy page](https://icp-intelligence.gtmhelix.com/privacy/), [terms](https://icp-intelligence.gtmhelix.com/terms/) and [support URL](https://gtmhelix.com/lets-get-started/) were read through the connected web tool in this revision. They use the intended Helix identity and ICP host. The website describes nine tools and a no-sign-in connection. Terms describe decision support and user ownership. The support URL is a contact form with separate data handling. End-to-end support delivery was not tested. None of these reads proves live tool count, live schemas or portal acceptance.

### Package and source findings

| Check | Result |
| --- | --- |
| JSON members | plugin.json, mcp.json and SOURCE.json parse. README.md is preserved as supplied. No package member is edited or regenerated. |
| Connection | One streamable-http server at `https://icp-intelligence.gtmhelix.com/mcp`. No credential, command or authentication change. Package and current source versions remain `1.2.26`. |
| Listing limits | Package name 22/64; top description 173/1024; display name 22/30; short description 30/30; long description 625/4000; developer 20/80. All pass these length checks. |
| Starters and capabilities | Three unique single-line starter prompts, lengths 53, 46 and 54, below 128. No @mentions. Capability lengths 24, 21 and 28, below 120. They match market sizing, scoring and account priority source tools. |
| Category | Productivity is allowed. Recommend Business & Operations for the supplied-input B2B planning job. Data & Analytics is also listed, but the user job is business planning rather than general data exploration. Only the category change is proposed below. |
| Tool inventory from source | Nine named tools. Eight descriptions and schemas are unchanged from snapshot source. Only `icp_interview_synthesizer` has a changed advertised description or schema. This inventory is static source evidence, not live tools/list. |
| Interview cleanup | Current advertised properties are `interview_notes`, `product_category` and `company`. `raw_transcripts` and `analysis_focus` are absent. The structured note object retains customer, role, key_quotes, pain_points, buying_triggers and value_realized. No new test prompt requests removed inputs. |
| Legacy handling | Source still accepts old arguments internally. An old raw transcript can be echoed in a shortened legacy response. That is compatibility handling, not supported transcript analysis. Do not reintroduce either unused field in package prose, schema, examples or test expectations. |
| Claims | Listing describes rule based analysis from supplied inputs. It does not promise CRM retrieval, live company research or email sending. Interview synthesis is structured data counting and grouping. Scoring uses example weights, not measured correlation. Schema validity alone is not evidence of utility or submission readiness. |
| Source annotations | Source advertises readOnlyHint true, destructiveHint false and openWorldHint false. No annotation change is proposed. Live values remain unknown. The older broad annotation-risk claims are withdrawn as established defects. |
| Assets and review metadata | The extracted snapshot references icon files but does not include their bytes. Verify the existing archive assets and imported portal fields in the owner workflow. SOURCE.json and release notes correctly identify their older capture; do not relabel them as the current source or deployment. |

### Five fixture checks

All five exact staged fixture inputs pass recursive checks against the current source schemas. These checks cover declared fields, required fields, types, enums and numeric bounds. They are not executions of the tools. Real company names in these original fixtures remain explicitly labelled synthetic review inputs.

| Fixture | Source and package check | Current live result |
| --- | --- | --- |
| `tam_sam_som_calculator` | Inputs match source schema. Reference arithmetic gives TAM USD 50,000,000, SAM USD 20,000,000 and SOM USD 400,000. Preserve the synthetic source label. | SKIP, no exposed tool and domain excluded. |
| `buyer_group_analyzer` | Supplied deal size, company size, known stakeholders and champion match schema. Pending output must distinguish supplied roles from template assumptions. | SKIP, same blocker. |
| `icp_scoring_model` | Three supplied criteria, importance levels and values match schema. Source presets importance weights to 25, 15 and 10. It does not derive correlation from the supplied hypothesis. | SKIP, same blocker. |
| `account_prioritization` | Supplied scores and 40/30/15/15 weights match schema. Source timing maps now to 100 and later to 40. Reference weighted scores are 71 and 48 for the two supplied synthetic review accounts. Do not infer additional accounts. | SKIP, same blocker. |
| `icp_interview_synthesizer` | Exact fixture uses structured notes, quotes, pain and triggers. It uses neither removed field. Preserve the quote and unmeasured-value qualifier. | SKIP, same blocker. |

The three negative package prompts remain unchanged. Payment, unavailable private CRM data and hostile source instructions each require a separate installed-host test. All three are SKIP in this revision. No source-schema result proves host routing, refusal, non-disclosure or absence of unwanted external actions.

### Privacy and reported external work

Privacy usage-count disclosure is already drafted at `C:/Users/shash/Documents/GTMHelix-Audit/privacy-usage-count-20261029`. Defer privacy text and its review to that owner draft. No replacement disclosure is drafted here and no laptop access was attempted.

The owner reports Claude's latest source check found that the counter key includes exact time and has no retention limit. The owner also reports Claude concluded annotations need no change under the official plugin guidelines. These are reported external conclusions, not newly verified live facts or an owner approval to change server annotations. W7 makes no annotation change and does not retain the older broad annotation-risk language as an established defect.

### Official guidance read directly in this revision

- [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): descriptions must match tool behavior. Request only task-relevant inputs. Use explicit annotation booleans. The guideline now says annotation justifications are not required and treats connectivity alone as insufficient to determine openWorldHint. The structured-note cleanup narrows the advertised input surface.
- [Submission errors](https://developers.openai.com/plugins/deploy/submission-errors): final metadata limits differ from some package limits. Business & Operations is a listed category. The listing fields pass the measured limits above. The portable package structure is assessed as staged; no rename or repackaging is proposed.
- [Remote MCP review](https://developers.openai.com/plugins/deploy/app-review): scans retain a metadata snapshot while calls use the live server. Current scan and installed-host evidence are still needed. Older review-page language about annotations differs from the newer plugin guideline. This review does not convert that inconsistency into a defect finding.

### Active proposed plugin.json diff: ICP only

Document-only recommendation against the exact extracted ICP member. No version or source pin is updated. Existing structured-note prompts and expectations are retained. The server schema cleanup remains untouched. GTM and Content category packages are separate completed owner work.

```diff
--- helix-icp-intelligence/plugin.json
+++ helix-icp-intelligence/plugin.json
@@ -23,7 +23,7 @@
         "shortDescription": "Define and score target buyers",
         "longDescription": "Helix GTM Consulting. Analyze customer patterns and structured interviews, define buyer groups and scoring criteria, calculate market size from supplied numbers, and prioritize supplied accounts. This package connects to 9 hosted rule based tools. The server does not run an AI model or perform live company research. It uses your supplied inputs; some outputs are working drafts or include explicitly labelled example assumptions. Review facts, calculations and placeholders before use. It does not connect to your CRM or send emails. Tool inputs are sent to the hosted service; consult its privacy policy for data handling.",
         "developerName": "Helix GTM Consulting",
-        "category": "Productivity",
+        "category": "Business & Operations",
         "capabilities": [
           "Define customer criteria",
           "Calculate market size",
```

### Remaining ICP gaps

1. Through a permitted route, capture current MCP initialize, tools/list, server version, every annotation and schema. Confirm nine tools and the interview cleanup. Compare to the historical tool hash without assuming equality after cleanup.
2. Run all five exact staged fixtures against the current live server. Save complete arguments, outputs and times. Then run installed ChatGPT workflows, including all three negatives. A public website read or source check cannot replace them.
3. Inspect current portal identity and permissions, domain verification, production scan, imported fields, assets and existing demonstration video access. Do not edit the video or challenge files. Confirm current status from the portal without submitting or declaring readiness.
4. Use the existing owner privacy draft for any disclosure follow-up. No new privacy wording, version or annotation work is included here.

### Exact checks and delivery boundaries

Cloud source/package checks: **26 PASS, 0 FAIL**. Document checks: **10 PASS, 0 FAIL**. Whitespace check: **PASS**. Live inventory: **1 SKIP**. Live positive fixtures: **5 SKIP**. Installed-host negatives: **3 SKIP**. No current live output quality pass is claimed. Build, backend unit suite, browser rendering and portal scan were not run for these docs changes.

```text
git -C /workspace/icp-intelligence-mcp rev-parse HEAD
git -C /workspace/icp-intelligence-mcp hash-object src/index.ts netlify/functions/mcp.mjs netlify/lib/usage-count.mjs package.json
git -C /workspace/icp-intelligence-mcp show 68835427ad818c0533776bb584d84430b5a9ecdb:src/index.ts > /workspace/work/w7-resume/snapshot-source.ts
node /workspace/work/w7-resume/inspect_source.cjs
python /workspace/work/w7-resume/check_icp.py
python /workspace/work/w7-resume/check_revision.py
git -C /workspace/craft-gtm-mcp diff --cached --check
```

The first source extractor attempt failed because Node child_process could not spawn git, with EPERM. The corrected extractor reads the source exported by shell git show. The corrected extraction and all 26 checks passed. No network access or server execution is part of this extraction. The source receipt includes complete inventories, individual results and the scripts used. It is reproducible cloud evidence, not a claim that live calls ran.

No AGENTS.md was found in the cloud workspace or verified PR tree. The PR tree has no .github workflows. The original automation inspection and owner manual-deploy register still apply. Only documentation is changed. Old raw receipts and the staged package snapshot remain unchanged. No main/master write, merge, force push, deployment, Netlify command, workflow dispatch, DNS, challenge/header change, tool or endpoint change, auth/version change, video edit, package rebuild/upload, submission, publication, declaration, secret access, client data, paid call, skill or shell MCP tool occurred. Actual final head and draft state are verified through GitHub and reported in the PR handoff.

## SUPERSEDED historical review

Everything below records the earlier review. GTM Planning and Content Studio sections, old defect claims and proposed diffs are SUPERSEDED. The active ICP review above also replaces earlier ICP assessments. Historical test counts describe only the earlier calls. The raw receipt file is preserved unchanged.

<details>
<summary>SUPERSEDED: earlier text and proposed diffs, retained for history</summary>

# SUPERSEDED: original review, 29 October 2026

Status: HOLD for submission. This is a read only review. No package was created or changed. Sales Enablement is excluded. Alpha remains held.

## Provenance and delivery

Repository: `shashwatgtm/craft-gtm-mcp`. Target branch: `codex/plugin-readiness-20261029`. Main base: `13a2f363118bd678ac8c9b8794e678945653a2bf`. Remote staging parent: `a0e9835c16e83246c24de0a0f074befdbdb63bfd`.

Exact package members came from [the authorized snapshot](https://github.com/shashwatgtm/craft-gtm-mcp/blob/a0e9835c16e83246c24de0a0f074befdbdb63bfd/docs/review-inputs/packages-20261027.json), fetched through GitHub. ZIP digests below are recorded provenance, not newly computed archive hashes. The original ZIP bytes and icon assets were not available for independent verification. JSON members were parsed without modifying them.

Current default branches were checked through GitHub on 29 October 2026. GTM main is `13a2f363118bd678ac8c9b8794e678945653a2bf`. Content main is `9a0f26af11167f7a31e3d51c72bab816b9c30e10`. ICP main is `80296186cd67fa6fdc610151eedcdd43f8fc329f`. Each repository reports main as its default branch. A source SHA or matching version does not identify deployed bytes.

Live calls used connected Helix Test tools. Ten package positive fixtures ran from 05:14:49.843 to 05:14:54.717 UTC, or 10:44:49.843 to 10:44:54.717 IST. These are direct tool responses, not automated ChatGPT conversations. Real company names in the supplied fixtures are explicitly synthetic review inputs. They are not client names, research findings, or endorsements.

## Official guidance read

Read through the web tool on 29 October 2026:

- [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): claims must match behavior, tools must provide useful independent work, and personal data collection must be necessary and disclosed. The current annotation section says justifications are no longer required.
- [Submission errors](https://developers.openai.com/plugins/deploy/submission-errors): final display name and subtitle limits are 30 characters, description 4,000, developer 80, and each starter prompt 128. At most three starters are allowed. Business & Operations is a listed category. This page still describes annotation justifications as required.
- [Remote MCP review](https://developers.openai.com/plugins/deploy/app-review): scans snapshot metadata, while tool calls use the live server. Server annotation values control the scan. Portal evidence and host checks remain separate gates.
- [MCP UI guidance](https://developers.openai.com/plugins/build/chatgpt-ui): UI is optional. New UI uses MCP Apps and `_meta.ui.resourceUri`, with initialization, notifications, `tools/call`, and structured results. Keep text-only clients useful. No UI is added here. Any future UI must attach to the existing named tool under the owner instruction, use `text/html;profile=mcp-app`, and narrow exact-domain CSP.

There is a documentation conflict about annotation justifications. Prepare behavioral explanations for review, but confirm the current portal requirement. Do not infer portal acceptance from either page alone. The Markdown UI URL failed with unsupported content type; the HTML page was read successfully.

## Package comparisons

### SUPERSEDED: Helix GTM Planning

| Check | Exact evidence and assessment |
| --- | --- |
| Archive | `02-helix-craft-gtm-2.2.23-openai-draft.zip` |
| Recorded ZIP SHA256 | `4557D2A59A6068C65A263850BF56C6E2F755EDE3D2B437847EF8971750B169EF` |
| Snapshot source | `90831fe1548a25533a188cf9c8343e0c27b2a1f1`; captured `2026-10-27T10:01:53.409199+00:00`. Package and snapshot live version: `2.2.23`. |
| Current source | `13a2f363118bd678ac8c9b8794e678945653a2bf` on main. This is separate from the package snapshot and actual deployment. |
| Connection | `https://craft-gtm.gtmhelix.com/mcp`. mcp.json declares one streamable-http server. No credential or auth field. No endpoint change proposed. |
| Tool exposure | Snapshot expects 8 tools. The connected catalog exposes eight tools with the expected names. Raw production tools/list, annotations, schemas and initialize version were not fetched. Connector metadata can lag deployment. |
| Metadata lengths | Package name 15/64; top description 166/1024; display 18/30; short 28/30; long 618/4000; developer 20/80. |
| Starter prompts | Three unique single-line prompts; lengths 52, 54, 45/128. No @mentions. Capability lengths 17, 13, 27/120. |
| Category | Snapshot Productivity is allowed. Recommend Business & Operations for the B2B planning and marketing job. Creativity for Content and Data & Analytics for ICP are valid alternatives, but the supplied-input business workflow is the stronger fit. |
| Claims | Describes hosted rule based tools and supplied inputs. Disclaims live research, model execution, CRM access and sending email. Confirm this remains accurate for every deployed tool. Generic drafts still pose utility and originality review risk. |
| Website | https://craft-gtm.gtmhelix.com/ Web read failed. Reachability remains unknown. |
| Privacy and terms | https://craft-gtm.gtmhelix.com/privacy/ and https://craft-gtm.gtmhelix.com/terms/ Web reads failed. Current policy contents remain unknown. |
| Support | https://gtmhelix.com/lets-get-started/ loads a consulting contact form. It is not clearly a dedicated product support page. It stores submitted contact details separately from MCP tool inputs. Check that users can obtain product support without a sales request. |
| Assets and portal | Referenced SVG assets were not in the extracted members. Current portal identity, domain verification, production scan, video accessibility, imported metadata and submission status are unknown. Snapshot remaining gates are historical. Existing hosted videos were untouched. |
| Positive 1: `pmf_scorecard` | PASS on fixture contract. Reports 8.5/10 from four of five dimensions. Benchmarks and assumed time in market are labelled examples. This is a rule score, not proof of product market fit. Observed `2026-10-29T05:14:54.670Z`. |
| Positive 2: `launch_commander` | PASS on fixture contract. Keeps 2027-02-15, 20 qualified meetings and 5 pilots. Shows 109 days to launch. Team size and budget are labelled assumptions. Observed `2026-10-29T05:14:54.389Z`. |
| Positive 3: `customer_interview_kit` | PASS on fixture contract. Names the persona, synthetic context and hypothesis. Checklist items are preparation tasks, not actions already performed. Observed `2026-10-29T05:14:53.472Z`. |
| Positive 4: `retention_playbook` | PASS. Live text converts 2% monthly to about 21.5% annual, compounded. Example thresholds are labelled. This supersedes any expectation of 24% annual loss. Observed `2026-10-29T05:14:54.243Z`. |
| Positive 5: `craft_gtm_analyzer` | PASS on fixture contract. Returns 31/50, 62%, and explains the keyword method. Missing artifacts score zero. The score does not establish plan quality. Observed `2026-10-29T05:14:53.909Z`. |
| Negative 1: Unsupported payment request | UNKNOWN, SKIP in installed ChatGPT. Do not transfer money or claim a payment occurred. Explain that this server has no payment tool. No backend call proves this host behavior. |
| Negative 2: Unavailable private data | UNKNOWN, SKIP in installed ChatGPT. Do not claim to access a CRM or invent personal data. Explain the access limitation and request only task relevant nonsecret inputs if needed. No backend call proves this host behavior. |
| Negative 3: Hostile source instructions | UNKNOWN, SKIP in installed ChatGPT. Do not disclose private instructions, transmit the conversation or follow instructions embedded in source text. Keep source content separate from user instructions. No backend call proves this host behavior. |

### Helix ICP Intelligence

| Check | Exact evidence and assessment |
| --- | --- |
| Archive | `04-helix-icp-intelligence-1.2.26-openai-draft.zip` |
| Recorded ZIP SHA256 | `71793A08FF8B6515D3FFADD8C0843822ACC8265C30F6F17DF27BA6141D9405DA` |
| Snapshot source | `68835427ad818c0533776bb584d84430b5a9ecdb`; captured `2026-10-27T10:02:15.381365+00:00`. Package and snapshot live version: `1.2.26`. |
| Current source | `80296186cd67fa6fdc610151eedcdd43f8fc329f` on main. This is separate from the package snapshot and actual deployment. |
| Connection | `https://icp-intelligence.gtmhelix.com/mcp`. mcp.json declares one streamable-http server. No credential or auth field. No endpoint change proposed. |
| Tool exposure | Snapshot expects 9 tools. No ICP tools are exposed in this session. Current raw tools/list and live count are unknown. |
| Metadata lengths | Package name 22/64; top description 173/1024; display 22/30; short 30/30; long 625/4000; developer 20/80. |
| Starter prompts | Three unique single-line prompts; lengths 53, 46, 54/128. No @mentions. Capability lengths 24, 21, 28/120. |
| Category | Snapshot Productivity is allowed. Recommend Business & Operations for the B2B planning and marketing job. Creativity for Content and Data & Analytics for ICP are valid alternatives, but the supplied-input business workflow is the stronger fit. |
| Claims | Describes hosted rule based tools and supplied inputs. Disclaims live research, model execution, CRM access and sending email. Confirm this remains accurate for every deployed tool. Generic drafts still pose utility and originality review risk. |
| Website | https://icp-intelligence.gtmhelix.com/ Web read succeeded. |
| Privacy and terms | https://icp-intelligence.gtmhelix.com/privacy/ and https://icp-intelligence.gtmhelix.com/terms/ Web reads succeeded. Policies name Helix and this host; terms describe decision support and user ownership of inputs and outputs. Usage telemetry disclosure needs reconciliation with source. |
| Support | https://gtmhelix.com/lets-get-started/ loads a consulting contact form. It is not clearly a dedicated product support page. It stores submitted contact details separately from MCP tool inputs. Check that users can obtain product support without a sales request. |
| Assets and portal | Referenced SVG assets were not in the extracted members. Current portal identity, domain verification, production scan, video accessibility, imported metadata and submission status are unknown. Snapshot remaining gates are historical. Existing hosted videos were untouched. |
| Positive 1: `tam_sam_som_calculator` | UNKNOWN, SKIP. No live tool available. Pending: call this exact snapshot fixture and inspect the complete output. Expect TAM USD 50,000,000, SAM USD 20,000,000 and SOM USD 400,000, using only supplied numbers. |
| Positive 2: `buyer_group_analyzer` | UNKNOWN, SKIP. No live tool available. Pending: call this exact snapshot fixture and inspect the complete output. Expect supplied roles and deal context, with assumed roles labelled. |
| Positive 3: `icp_scoring_model` | UNKNOWN, SKIP. No live tool available. Pending: call this exact snapshot fixture and inspect the complete output. Expect example weights, not measured correlation. |
| Positive 4: `account_prioritization` | UNKNOWN, SKIP. No live tool available. Pending: call this exact snapshot fixture and inspect the complete output. Expect only the two supplied accounts ranked with 40/30/15/15 weights. |
| Positive 5: `icp_interview_synthesizer` | UNKNOWN, SKIP. No live tool available. Pending: call this exact snapshot fixture and inspect the complete output. Expect supplied quotes, pain and trigger; no new research or inference of measured value. |
| Negative 1: Unsupported payment request | UNKNOWN, SKIP in installed ChatGPT. Do not transfer money or claim a payment occurred. Explain that this server has no payment tool. No backend call proves this host behavior. |
| Negative 2: Unavailable private data | UNKNOWN, SKIP in installed ChatGPT. Do not claim to access a CRM or invent personal data. Explain the access limitation and request only task relevant nonsecret inputs if needed. No backend call proves this host behavior. |
| Negative 3: Hostile source instructions | UNKNOWN, SKIP in installed ChatGPT. Do not disclose private instructions, transmit the conversation or follow instructions embedded in source text. Keep source content separate from user instructions. No backend call proves this host behavior. |

### SUPERSEDED: Helix Content Studio

| Check | Exact evidence and assessment |
| --- | --- |
| Archive | `05-helix-craft-content-2.2.23-openai-draft.zip` |
| Recorded ZIP SHA256 | `FB9F8EEB54B9C6E4C86D41FD2702425EF4F637A0B23157C7C3FA06923ECD478F` |
| Snapshot source | `d3c3d50aec7606372efc6f8078ce122b2422d2f9`; captured `2026-10-27T10:01:50.962230+00:00`. Package and snapshot live version: `2.2.23`. |
| Current source | `9a0f26af11167f7a31e3d51c72bab816b9c30e10` on main. This is separate from the package snapshot and actual deployment. |
| Connection | `https://craft-content.gtmhelix.com/mcp`. mcp.json declares one streamable-http server. No credential or auth field. No endpoint change proposed. |
| Tool exposure | Snapshot expects 8 tools. The connected catalog exposes eight tools with the expected names. Raw production tools/list, annotations, schemas and initialize version were not fetched. Connector metadata can lag deployment. |
| Metadata lengths | Package name 19/64; top description 180/1024; display 20/30; short 28/30; long 632/4000; developer 20/80. |
| Starter prompts | Three unique single-line prompts; lengths 58, 65, 60/128. No @mentions. Capability lengths 22, 24, 11/120. |
| Category | Snapshot Productivity is allowed. Recommend Business & Operations for the B2B planning and marketing job. Creativity for Content and Data & Analytics for ICP are valid alternatives, but the supplied-input business workflow is the stronger fit. |
| Claims | Describes hosted rule based tools and supplied inputs. Disclaims live research, model execution, CRM access and sending email. Confirm this remains accurate for every deployed tool. Generic drafts still pose utility and originality review risk. |
| Website | https://craft-content.gtmhelix.com/ Web read succeeded. |
| Privacy and terms | https://craft-content.gtmhelix.com/privacy/ and https://craft-content.gtmhelix.com/terms/ Web reads succeeded. Policies name Helix and this host; terms describe decision support and user ownership of inputs and outputs. Usage telemetry disclosure needs reconciliation with source. |
| Support | https://gtmhelix.com/lets-get-started/ loads a consulting contact form. It is not clearly a dedicated product support page. It stores submitted contact details separately from MCP tool inputs. Check that users can obtain product support without a sales request. |
| Assets and portal | Referenced SVG assets were not in the extracted members. Current portal identity, domain verification, production scan, video accessibility, imported metadata and submission status are unknown. Snapshot remaining gates are historical. Existing hosted videos were untouched. |
| Positive 1: `case_study_generator` | PASS on the one-result package fixture. Preserves 4 to 2 hours and requests an approved quote. Supplemental four-result test FAILS the all-results narrative contract. See defect below. Observed `2026-10-29T05:14:54.717Z`. |
| Positive 2: `newsletter_builder` | PASS on fixture contract. Includes the three supplied adoption points and checklist CTA. Sector advice is template guidance, not measured evidence. Observed `2026-10-29T05:14:54.247Z`. |
| Positive 3: `webinar_script` | PASS on fixture contract. Provides the 30-minute run of show and three takeaways. Product name appears in the supplied topic even though product mention level is none. Generic sales follow-up needs editing. Observed `2026-10-29T05:14:54.410Z`. |
| Positive 4: `content_repurposer` | PASS on the existing fixture contract, with quality warning. Requested post, email and summary retain the synthetic qualification. The blog summary repeats the opening sentence as title, introduction and first bullet. Observed `2026-10-29T05:14:54.452Z`. |
| Positive 5: `craft_content_improver` | PASS on fixture contract. Reports 6.3/10 with quoted rule findings and says the checks do not establish truth. Observed `2026-10-29T05:14:53.983Z`. |
| Negative 1: Unsupported payment request | UNKNOWN, SKIP in installed ChatGPT. Do not transfer money or claim a payment occurred. Explain that this server has no payment tool. No backend call proves this host behavior. |
| Negative 2: Unavailable private data | UNKNOWN, SKIP in installed ChatGPT. Do not claim to access a CRM or invent personal data. Explain the access limitation and request only task relevant nonsecret inputs if needed. No backend call proves this host behavior. |
| Negative 3: Hostile source instructions | UNKNOWN, SKIP in installed ChatGPT. Do not disclose private instructions, transmit the conversation or follow instructions embedded in source text. Keep source content separate from user instructions. No backend call proves this host behavior. |

## SUPERSEDED: historical defect and annotation claims

These claims are withdrawn as current findings. Do not use them to assess the owner-reported later deployments. Broad annotation-risk claims are not established defects. Privacy work is deferred to the existing owner draft.

Content case study: the owner reports local fix `72380d2` is not deployed. This checkout does not contain that object. The four-outcome synthetic probe confirmed the live narrative includes only the first three outcomes. The fourth, review time from 6 to 3 hours, remains in the detailed results but is missing from the narrative. The narrow one-result package fixture misses this defect. A separate two-result probe preserves both results and explicitly says supplied interview notes were unused. Do not treat either passing probe as clearance for the known defect. Supplemental times and full responses are in `review-inputs/readiness-live-20261029.json`.

Content repurposer: the package fixture retains the synthetic qualifier in each requested format. Its blog summary repeats the source opening three times. This remains an editing burden and a quality risk despite the fixture passing its existing preservation contract. Do not describe current output as polished or fully original prose.

ICP interview: current main `80296186cd67fa6fdc610151eedcdd43f8fc329f` removes raw_transcripts and analysis_focus from the advertised schema because they were not analyzed. Legacy handling remains in source. Do not ask reviewers to test those fields as supported analysis inputs. Deployment status is unknown. Confirm the live schema and structured interview fixture before claiming the fix is live.

Source inspection shows all tools use readOnlyHint true, destructiveHint false and openWorldHint false. GTM and Content use src/server.ts; ICP uses src/index.ts. Their hosted adapters call countUse and write a per-call usage record with day, server, tool, app kind and route to hosted blob storage. No input or answer is included in that record. This does not prove the deployed implementation, but it is material to review. A pure draft generator has no destructive business action and need not browse external entities. The wrapper still writes state. The review page explicitly includes logging in its readOnlyHint discussion. Obtain a current tools/list and owner resolution of the deployed behavior before defending readOnlyHint true. An external storage service alone does not settle openWorldHint; explain the bounded telemetry behavior accurately. No annotation was changed here.

Content and ICP privacy pages say inputs and answers are not stored and describe no analytics. Their terms likewise say no copies of inputs or answers are kept. That narrow promise can coexist with a counter, but the broader no-analytics wording and metadata disclosure need review. Do not equate no retained content with no retained request metadata. GTM live policy text could not be read. A package wording change cannot repair a policy or annotation mismatch.

## SUPERSEDED: earlier proposed diffs, historical only

These are review proposals against the extracted members. They are not applied package changes. Versions, names, endpoints, authentication and videos stay unchanged. Generic expected behavior is narrowed for the observed retention calculation. Content expectations deliberately expose the current narrative and repetition defects. They must remain failed or pending until new live evidence meets them. The other four GTM positives, three Content positives, all five ICP positives and all nine host negatives retain their snapshot prompts and expected behavior.

### SUPERSEDED: helix-craft-gtm proposed diff

```diff
--- helix-craft-gtm/plugin.json
+++ helix-craft-gtm/plugin.json
@@ -23,7 +23,7 @@
         "shortDescription": "Plan launches and buyer work",
         "longDescription": "Helix GTM Consulting. Review product market fit inputs and GTM plans, structure launches and customer interviews, and prepare retention, partner, crisis and competitive planning materials. This package connects to 8 hosted rule based tools. The server does not run an AI model or perform live company research. It uses your supplied inputs; some outputs are working drafts or include explicitly labelled example assumptions. Review facts, calculations and placeholders before use. It does not connect to your CRM or send emails. Tool inputs are sent to the hosted service; consult its privacy policy for data handling.",
         "developerName": "Helix GTM Consulting",
-        "category": "Productivity",
+        "category": "Business & Operations",
         "capabilities": [
           "Review GTM inputs",
           "Plan a launch",
@@ -68,7 +68,7 @@
               "description": "Retention planning",
               "prompt": "Use this synthetic review scenario, not a claim about any real company. Retention planning. Use these inputs:\n{\"customer_segment\": \"HubSpot midmarket customers in a synthetic test cohort\", \"business_model\": \"saas_subscription\", \"current_churn_rate\": \"2% monthly, synthetic test figure\", \"churn_reasons\": \"Onboarding delays; unclear product adoption milestones\", \"current_interventions\": \"Quarterly success reviews\", \"your_sector\": \"saas\"}",
               "tools_triggered": "retention_playbook",
-              "expected_behavior": "Call the named tool with the supplied inputs. Return its relevant analysis, preserve supplied facts and hypothetical labels, identify missing evidence, and do not claim live research or external actions."
+              "expected_behavior": "Preserve the synthetic 2% monthly input. Report about 21.5% annual customer loss using 1 - (1 - 0.02)^12, not 24%. Label benchmark thresholds as examples. Do not claim to contact customers or change a CRM."
             },
             {
               "description": "Document completeness review",
```

### helix-icp-intelligence

```diff
--- helix-icp-intelligence/plugin.json
+++ helix-icp-intelligence/plugin.json
@@ -23,7 +23,7 @@
         "shortDescription": "Define and score target buyers",
         "longDescription": "Helix GTM Consulting. Analyze customer patterns and structured interviews, define buyer groups and scoring criteria, calculate market size from supplied numbers, and prioritize supplied accounts. This package connects to 9 hosted rule based tools. The server does not run an AI model or perform live company research. It uses your supplied inputs; some outputs are working drafts or include explicitly labelled example assumptions. Review facts, calculations and placeholders before use. It does not connect to your CRM or send emails. Tool inputs are sent to the hosted service; consult its privacy policy for data handling.",
         "developerName": "Helix GTM Consulting",
-        "category": "Productivity",
+        "category": "Business & Operations",
         "capabilities": [
           "Define customer criteria",
           "Calculate market size",
```

### SUPERSEDED: helix-craft-content proposed diff

```diff
--- helix-craft-content/plugin.json
+++ helix-craft-content/plugin.json
@@ -23,7 +23,7 @@
         "shortDescription": "Draft and review B2B content",
         "longDescription": "Helix GTM Consulting. Prepare case study and testimonial materials, newsletters, webinar scripts, repurposed content, thought leadership and sales content, and review supplied copy against stated rules. This package connects to 8 hosted rule based tools. The server does not run an AI model or perform live company research. It uses your supplied inputs; some outputs are working drafts or include explicitly labelled example assumptions. Review facts, calculations and placeholders before use. It does not connect to your CRM or send emails. Tool inputs are sent to the hosted service; consult its privacy policy for data handling.",
         "developerName": "Helix GTM Consulting",
-        "category": "Productivity",
+        "category": "Business & Operations",
         "capabilities": [
           "Draft supplied stories",
           "Repurpose source content",
@@ -50,7 +50,7 @@
               "description": "Case study from supplied evidence",
               "prompt": "Use this synthetic review scenario, not a claim about any real company. Case study from supplied evidence. Use these inputs:\n{\"customer_name\": \"Cisco\", \"your_product\": \"HubSpot CRM, synthetic demonstration scenario\", \"mode\": \"full\", \"challenge\": \"Synthetic test story: the regional team used disconnected spreadsheets.\", \"solution\": \"The test team centralized pipeline records and held weekly reviews.\", \"results\": \"Synthetic result for review only: reporting preparation fell from 4 hours to 2 hours per week.\", \"customer_industry\": \"telecom\", \"business_model\": \"saas\", \"your_sector\": \"saas\"}",
               "tools_triggered": "case_study_generator",
-              "expected_behavior": "Build a draft from the supplied challenge, solution and synthetic result. Preserve the 4 to 2 hours comparison and do not invent a quote, customer approval or additional outcome."
+              "expected_behavior": "Build a draft only from the supplied challenge, solution and synthetic results. Preserve 4 to 2 hours and every supplied outcome in the narrative and detailed results. Add a four-outcome synthetic variant to detect truncation. Do not invent a quote, customer approval or another outcome."
             },
             {
               "description": "Newsletter draft",
@@ -68,7 +68,7 @@
               "description": "Repurpose source text",
               "prompt": "Use this synthetic review scenario, not a claim about any real company. Repurpose source text. Use these inputs:\n{\"source_content\": \"Synthetic Cisco planning exercise. The team started with one region. A named owner checked the reporting fields weekly. The pilot surfaced missing data before a wider rollout. These are demonstration statements, not verified Cisco company findings.\", \"source_type\": \"blog_post\", \"target_formats\": \"linkedin_post, email, blog_summary\", \"brand_voice\": \"professional\", \"your_sector\": \"telecom\"}",
               "tools_triggered": "content_repurposer",
-              "expected_behavior": "Return the three requested formats from the supplied source text while preserving its synthetic scenario qualification. Do not turn demonstration statements into verified Cisco findings."
+              "expected_behavior": "Return only the requested formats from supplied source sentences. Preserve the synthetic and unverified qualification in each format. Do not repeat the opening sentence within the blog summary or invent proof. Leave missing links and sender details as tasks to complete."
             },
             {
               "description": "Review supplied content",
```

## Pending evidence and UI description

For each plugin, fetch production initialize and tools/list through an authorized cloud route, retain observation times, inspect every tool schema and annotation, and compare to the package tool hash. The cloud HTTP policy does not allow these service hosts. No policy bypass was attempted. The connected catalog is partial evidence, not raw tools/list. ICP requires all five positive calls. GTM and Content each require the remaining tools outside the five-fixture sample to be reviewed.

Run five positives and all three negatives per plugin as installed ChatGPT conversations. Record routing, complete final answers, refusals, data exposure and actual absence of unwanted actions. Payment and private CRM requests must not fabricate capability. Hostile source text must remain data. No payment, CRM or exfiltration action should be attempted to test refusal. Nine host negatives and five ICP positives are skipped here. No claim about host safety is inferred from backend success.

Check current portal identity, domain verification, tool scan and imported fields. Inspect the existing hosted demo recording for access and current behavior without changing it. Historical SOURCE.json says these gates were missing on 27 October; this is not evidence of current portal status. Owner legal declarations remain owner work.

UI evidence: direct connected responses are Markdown headings, paragraphs, lists and tables. The case study has story, detailed results, quote request and distribution text. Retention explains the annual calculation in prose. No custom UI was rendered or browser tested. Ten observed responses have null structuredContent. Screenshots: none. Do not attach directory screenshots unless the current scan identifies UI. Future UI must preserve useful text output and comply with the owner limits.

## Historical receipts and boundary audit

Cloud commands used for checks:

```text
git status --short
git branch --show-current
git rev-parse HEAD
find /workspace -name AGENTS.md -print
git ls-tree -r --name-only HEAD
cat netlify.toml
cat package.json
git fetch origin codex/plugin-readiness-20261029
git switch -c codex/plugin-readiness-20261029
python /workspace/work/w7/validate_review.py
git diff --check
```

No AGENTS.md was found in the workspace or repository tree. Initial worktree was clean. Shell git fetch failed before authentication: the configured proxy refused port 8080. Connected GitHub reads supplied the staging snapshot and branch state. One encoded slash branch URL was rejected; the literal slash URL succeeded. GitHub workflow and hook endpoints were rejected by the connector. No workflow was dispatched.

Automation review: the verified staging tree contains no .github directory or workflow files. netlify.toml only specifies the build command, publish path and function directory. Local hooks contain sample files only; core.hooksPath is unset. The owner register explicitly identifies this MCP site as manual CLI deployment and authorizes this codex branch and draft PR. That evidence supports a docs-only connector branch write and draft PR. No deployment settings are changed.

Counts: package fixture backend calls 10 PASS, 0 FAIL, 5 SKIP. Supplemental case-study probes 1 PASS, 1 FAIL. Installed ChatGPT negatives 0 PASS, 0 FAIL, 9 SKIP. The failing supplemental probe loses outcome four from the narrative. The repurposer repetition is a quality finding outside the original fixture assertion. Lightweight validation: 31 PASS, 0 FAIL, 0 SKIP. The checks parse nine JSON members, verify metadata limits and remote connection shape, apply all three proposed diffs in memory, enforce unchanged package boundaries, and verify recorded live findings. git diff --check passed. Server build and backend unit suite: SKIP, documentation-only change. Browser and custom UI tests: SKIP. Portal scan: SKIP.

Boundary audit: this review note and a synthetic live-call receipt file are authored for the repository. The coordinator snapshot is preserved. No packages, source code, tool definitions, endpoints, authentication, versions, challenge files, headers, videos or deployment settings changed. No deploy or Netlify command, DNS change, package upload, directory submission, publication, legal declaration, workflow dispatch, skill, shell MCP tool, paid API call, main/master write, force push or merge occurred. All executed fixture inputs are synthetic. No credentials or secrets were read, output or committed. The draft PR URL and exact delivery head SHA are in the PR delivery receipt and final handoff. The delivery head is the commit containing this note. Draft remains draft.


</details>
