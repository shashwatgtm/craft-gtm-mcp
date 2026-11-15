# Weak-retention text fix

OWNER_GATE for deployment. This is a separate draft from the additive PMF widget. Based on current main `dc32735a239d90066bcaf9b69de1f783f847d913`. GTM Planning remains In review. No merge, version, deployment or submission change is included.

With monthly churn 1%, NPS 60, LTV 90000, CAC 10000, retention 40% and activation 70%, the existing tool reports retention as CRITICAL at 3/10, then says every dimension scores well. Its recommendation builder handled missing retention but omitted weak retention.

This fix adds a retention action for CRITICAL and DEVELOPING results. Contract-based businesses get a renewal-value action; other models get a cohort-loss action. Both ask the user to confirm period and retention definition. Existing scores, benchmarks, parser, tool names, schemas, metadata and version stay unchanged. Healthy retention keeps the existing behavior. No UI files are included.

## Validation

Windows Node 24.19.0, TypeScript 5.9.3, MCP SDK 1.32.2. All 145 cached dependency versions were checked against this repository's lockfile before ordinary copy into the isolated snapshot.

| Check | Result |
| --- | --- |
| TypeScript build | PASS |
| Focused retention regression file | 11 PASS, 0 FAIL |
| Complete candidate suite | 1204 total, 1137 PASS, 0 FAIL, 67 existing SKIP |
| Unchanged main comparison suite | 1193 total, 1126 PASS, 0 FAIL, 67 existing SKIP |
| Local Streamable HTTP handler and real SDK before/after | PASS: reproduces the baseline defect, returns the new action, preserves all text outside Priority Actions |
| Actual ChatGPT with this fix | NOT_TESTED |
| Deployed candidate | NOT_TESTED, no deployment authorized |

Commands: `npm run build`; `node --test --test-isolation=none tests/pmf-retention-regression.test.mjs`; `node --test --test-isolation=none`. Local HTTP verification uses the existing handler directly without a network request. The coordinator also independently reproduced the original defect through the existing GTM Planning test connection, which is evidence about the current server, not this candidate.

The first focused run was 7 PASS and 3 FAIL because newly written expectations assumed unrounded display values and standalone NRR recognition. Existing pct() rounds 84.99 to 85 and 89.99 to 90 for display while preserving exact values for scoring. The corrected tests explicitly assert those displayed values and their weak statuses. The net-retention fixture now uses the supported full phrase. A separate test records that standalone NRR remains unparsed. No parser, rounding or scoring code was changed to make these tests pass. Original failure logs were retained locally.

## Owner decision and later acceptance

Review this fix independently of the widget. Decide when a server change is permissible during the current In-review hold. If approved later, merge/deploy are separate actions, then repeat the exact regression in the real ChatGPT connection and verify the returned Priority Actions, critical status and unchanged overall score. No release or deployment is implied by this draft.
