# GTM timing compatibility after PMF fixes, 29 October 2026

Tested source checkpoint: `3cfe331d0f436e5e858f02ae39b6ebc29c5c968f`.

Actual existing timing patch head tested: `5c144513efc354956d66425b2b37472a6a0c6ee4`, draft PR #3, branch `codex/timing-tests-20261029`.

GitHub main was read directly as `db9582491725d1765768c4c0d6566761305ebca7`. Complete nontruncated Git tree comparison confirms its only addition after the tested checkpoint is `public/walkthrough/helix-gtm-planning-chatgpt-walkthrough-20261029.mp4`, blob `5d8e1893f0a24be476cfcc58edb9cd3b567a9e00`. No files were removed. The video was not fetched, edited or copied into this timing branch. This source check therefore covers the executable code at current main. The owner's deployment report was not independently inspected. No deployment was run.

The prior `8dfee13` compatibility note is historical. This note adds current-source receipts without rebasing, merging or replacing that history.

## Exact cloud overlay

Copy the saved isolated `8dfee13` source overlay. Replace the three changed files using connected GitHub blob reads: `src/pmf-scorecard.ts`, `src/utils.ts`, and `tests/host-review-20261029.test.mjs`. Verify every tracked source blob against the complete `3cfe331` Git tree. Overlay only the actual PR's `tests/helpers/cpu-budget.mjs` and `tests/run40s-escape.test.mjs`. Verify both against the draft head's Git blob hashes. Use existing cloud dependencies. Build and test inside the new isolated overlay. No repository source file is edited by this work.

The deterministic inertness test body, hostile VALUES and LIVE lists remain identical to the original base. All 14 adversarial atoms retain their original minimum 200000-character inputs. The CPU ceiling stays 250 ms per full input. The relative growth factor stays 8, with a 5 ms small-sample floor. The worker wall bound stays 15000 ms. The helper SHA256 stays `a43f7307041df7d600f197c4857a8a4b39c269df09e7232b73c27675a194f66c`. No skip, retry, sleep or relaxed budget was added. The production escape module and timing files are unchanged. There is no new reason to repeat the earlier mutation suites, so none was rerun.

## Actual results

| Check | Exit | Pass | Fail | Existing skip |
| --- | --- | --- | --- | --- |
| build | 0 | n/a | n/a | n/a |
| full-suite | 0 | 1127 | 0 | 67 |
| five-saved-host-fixtures | 0 | n/a | n/a | n/a |
| busy-timing | 0 | 12 | 0 | 0 |
| busy-host-review | 0 | 8 | 0 | 0 |
| metadata-smoke | 0 | n/a | n/a | n/a |

The build passes. The full suite includes all eight current host-review cases. Three are new PMF cases: rate syntax parses into the activation, churn and retention rows; missing churn and retention do not yield scaling advice; and the closing action asks for evidence before scaling. The existing PMF rule-score-not-proof caveat, nonleading discovery questions and label-aware analyzer tests also pass.

Busy checks used two bounded Python CPU workers and the tests on CPU 0. Each load worker had a 120 second maximum. Both were stopped in a finally block. The affected file passed all 12 tests. All eight host-review tests passed. No failure was hidden or retried. The full suite's 67 skips are existing skips. No live endpoint was called.

Commands run inside the isolated overlay:

```sh
npm run build
node --test --test-isolation=none --test-reporter=tap tests/*.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/run40s-escape.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/host-review-20261029.test.mjs
```

Commands run in the cloud evidence folder:

```sh
node review-compare.mjs
node metadata-smoke.mjs
```

The receipt JSON records exact expanded argv, working directories, exit codes and log hashes. The archive contains the complete logs, harnesses, source and patch blob metadata, comparison fixtures and rendered synthetic outputs. Node 24.19.0 uses in-process test isolation here because the cloud restricts nested Node child execution. No Node or package version changed. The metadata smoke check confirms version 2.2.23 and eight unchanged tool names.

## Five saved fixture outputs

The owner's five golden review outputs are not saved in W5c, so their exact identity and equality cannot be certified here. The saved prior host-review file does define five reproducible synthetic fixtures. Those exact inputs were run through the preserved `8dfee13` overlay and the new `3cfe331` overlay. Full output hashes and text are in the archive.

| Saved W5c fixture | Byte-identical output |
| --- | --- |
| pmf-missing-dimension | Yes |
| pmf-complete | No, expected PMF closing-action change |
| discovery | Yes |
| labeled-plan | Yes |
| numeric-target | Yes |

Four outputs are byte-identical. For the complete PMF fixture, the only changed line is:

```diff
-All dimensions scoring well: focus on scaling.
+Every dimension scores well against the example benchmarks. Check the figures against your own history and customer evidence before you scale.
```

This is the intended PMF fix. It is not reported as an unchanged output. The same synthetic labeled-plan fixture still scores 39/50. Discovery and both analyzer fixture outputs are byte-identical. All inputs are synthetic review fixture inputs, not client or prospect data.

## Automation, documentation and boundaries

Inspected the complete current-source and draft Git trees, package scripts and netlify.toml. No applicable AGENTS.md or workflow files exist. The build script is TypeScript only. The coordinator's existing register confirms this site deploys manually. Only this note and its receipt archive are appended to the existing draft branch as a fast-forward documentation commit. No settings or PR readiness state change.

Official sources read directly through the connected web reader:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The existing MCP Apps and exact-domain CSP findings remain unchanged. This compatibility check adds no UI and runs no browser check.

No main/master write, merge, rebase, force push, deployment, Netlify command, workflow dispatch, DNS change, challenge or protected-header edit, runtime or schema change, tool-name or endpoint or authentication change, version change, hosted video edit, submission, package upload, publication, declaration, credential read, paid API call, OpenAI package skill or shell MCP tool. No other repository or workstream was changed. No Alpha branch or PR was created. All heavy work stayed in the cloud.
