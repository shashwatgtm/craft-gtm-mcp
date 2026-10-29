# Timing patch compatibility, 29 October 2026

Current main checkpoint: `8dfee13d07bcf0deb336e5517e5b0189b21e294a`. Verified directly through the connected GitHub branch API. This matches the coordinator's 18:50 IST checkpoint.

Existing draft patch head tested: `93d9d0c038e8f43b2faed9150abaa6e0496e7f4c` on `codex/timing-tests-20261029`.

This is a compatibility overlay check. No history rewrite or merge was performed. The original draft base stays unchanged. No current-main production file is added to the timing branch.

## Exact overlay

Export the local verified original base with `git archive HEAD`. Replace only the changed main files using connected GitHub blob reads. Verify every base blob against the complete current-main Git tree. Copy the two timing files from the actual draft patch. Verify their Git blob hashes against that patch head. Build inside the isolated cloud overlay using existing cloud dependencies.

The timing files are `tests/helpers/cpu-budget.mjs` and `tests/run40s-escape.test.mjs`. Both hashes are recorded in the archive metadata. The timing helper and production escape/neutralise modules are unchanged from the earlier checked patch. A source comparison confirms every deterministic correctness assertion and adversarial value is preserved. No retry, sleep, skipped timing test or larger CPU ceiling was added.

The archive includes complete argv, working directories, exit codes, log hashes, full logs, base and patch metadata, and the exact cloud harness. Initial workstream mutant evidence remains in the ICP archive. It was not repeated because this base does not change the timing helper or the production escape/neutralise functions.

## Results

| Check | Exit | Pass | Fail | Existing skip |
| --- | --- | --- | --- | --- |
| build | 0 | n/a | n/a | n/a |
| suite | 0 | 1124 | 0 | 67 |
| review-score | 0 | n/a | n/a | n/a |
| busy-targeted | 0 | 12 | 0 | 0 |
| busy-host-review | 0 | 5 | 0 | 0 |

Busy checks ran on CPU 0 with two bounded Python CPU workers on that same CPU. Each worker had a 120 second maximum. Both were stopped in a finally block. The affected test file and all host-review tests passed under that contention. The full isolated suite passed. Existing suite skips were preserved. No new skip was introduced.

Accepted commands in the isolated overlay:

```sh
npm run build
node --test --test-isolation=none --test-reporter=tap tests/*.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/run40s-escape.test.mjs
taskset -c 0 node --test --test-isolation=none --test-reporter=tap tests/host-review-20261029.test.mjs
```

The JSON receipt retains the exact expanded suite argv. Node 24.19.0 uses `--test-isolation=none` here because this cloud restricts nested Node child-process execution. All heavy computation stayed in the cloud. No live endpoint was called.

## Host review preservation

All five new host-review tests passed in the full suite and under CPU contention. They preserve the rule-score-not-proof PMF caveat, the request for missing evidence before scaling, nonleading discovery questions, and label-aware analyzer behavior. The direct synthetic review fixture check also passed with score 39/50:

```sh
node w5c-score.mjs
```

The exact synthetic fixture and assertion are in the evidence archive. No company or prospect data was used.

## Alpha delivery decision

No Alpha remote branch or PR was created. Master remains `e9b5a61786ab84b4405017b2726231432a8e4d5d`. The existing offline patch is provided as `alpha-timing-tests-20261029.patch` beside this note. It is byte-identical to the complete patch already preserved in the ICP evidence archive. It changes only the escape test, timing helper and review note. No new Alpha test run or version change is claimed.

Observed through connected GitHub reads:

- The complete master tree has no tracked GitHub workflow or applicable AGENTS.md file.
- `netlify.toml` defines the static build, publish directory, functions and a redirect. It does not expose a Deploy Preview disable flag or branch-build allowlist.
- The master branch API reports `protected: false`. Rulesets returns an empty list.
- The branch-protection endpoint returns 403, `Resource not accessible by integration`.
- The deployment-history endpoint is rejected by the connector URL allowlist.

What cannot be observed is whether Netlify Deploy Previews are enabled for pull requests or whether the codex branch is included in Netlify branch deployments. GitHub branch protection and the absence of workflows do not answer those questions. No available connected tool exposes those Netlify site settings. The owner confirms master is git linked. Creating a branch or PR could therefore trigger a deployment. Remote Alpha delivery is held under the no-deployment boundary. No settings were changed and no Netlify command was run. This is a preview-safety blocker, not a generic proxy blocker.

## Documentation and boundaries

Read directly again through the connected web reader:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The UI guide keeps tools useful without a UI and uses MCP Apps resource attachment and bridge messages. The review page requires exact CSP domains. This work adds no UI, render tool, checkout or durable storage. No browser check was run because no UI changed.

Current-main and draft Git trees contain no workflow files. The coordinator's existing register confirms these two sites deploy manually. Only documentation and review evidence are appended to the existing draft branch. No production file, dependency, version, tool name, endpoint, authentication, hosted video, challenge or header changed. No main/master write, force push, merge, deployment, Netlify command, workflow dispatch, DNS change, submission, package upload, publication, declaration, credential access, client/prospect data, paid API call, OpenAI skill or shell MCP tool. IMPACT, ICP and Revenue are untouched in this follow-up.
