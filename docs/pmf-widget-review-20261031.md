# PMF Scorecard widget draft

Prepared from main `dc32735a239d90066bcaf9b69de1f783f847d913`. Draft only. GTM Planning remains In review. No release, version, deployment or submission change is included.

The existing `pmf_scorecard` call now supplies an additive MCP Apps resource and a structured result from the same calculation as its text response. All eight tool names and input schemas stay unchanged. The form starts empty, uses only existing arguments, and calls only the existing tool. It preserves missing-data, example-benchmark, business-model and parser qualifications. Rendering uses inert text nodes. No external requests or persistent browser storage are introduced.

The widget's empty action list uses neutral wording. The existing text response still contains the known weak-retention fallback defect because this branch preserves legacy text. Separate draft [#6](https://github.com/shashwatgtm/craft-gtm-mcp/pull/6) on `codex/pmf-retention-fix-20261031` prepares the server text correction. Do not treat this widget as a fix to deployed text. Resolving that defect before any widget release is an owner gate.

## Final local validation

Windows Node 24.19.0, TypeScript 5.9.3, MCP SDK 1.32.2. All 145 installed package versions match this repository's lockfile. Dependencies were copied ordinarily from the existing craft-gtm-mcp cache into the isolated candidate. No junction or elevation was used. A prior npm ci attempt was interrupted without output after registry access failed in coordinator preflight.

* `npm run build`: PASS.
* `node --test --test-isolation=none tests/pmf-ui-model.test.mjs tests/pmf-ui-sdk.test.mjs`: 70 PASS, 0 FAIL. Includes 23 frozen legacy-text fixtures checked directly and again through the real in-memory MCP SDK, complete names/schema parity, resource read/list, error behavior and literal input handling.
* Complete suite: 1263 total, 1196 PASS, 0 FAIL, 67 SKIP. Main comparison: 1193 total, 1126 PASS, 0 FAIL, 67 SKIP.
* Simulated browser: 28 PASS, 0 FAIL. Real local Chrome and in-memory MCP SDK tools/call behind a simulated parent; not ChatGPT. Empty and populated captures at 320, 768 and 1280 pixels. Final capture waits for fonts and iframe height.
* The 67 skips are 63 private-pool cases with external scenario modules/data absent from the repository, plus 4 tests of tools absent from GTM. See pmf-widget-validation-20261031.json.
* The first browser run failed a newly added label regex that treated parentheses as grouping. It now checks the literal Retention (%) label; no product change. The original failure output was retained.
* Actual ChatGPT host: NOT_TESTED. No candidate endpoint or connection was created.

Raw logs and screenshots remain in the local audit folder `heavy-run-20261029/widget-builds-20261030/pmf-scorecard`; the JSON receipt records their hashes. The workspace search found none of the required private pool modules, so those 63 checks could not be enabled. The test runner reports are overlapping checks, not additive test totals.

Final delivery verification detected that the first PowerShell console transfer to GitHub replaced some non-ASCII characters. The tested local UTF-8 files were unchanged. The draft was corrected using ASCII-escaped JSON transport, followed by Git blob comparison of every changed file. Validation applies to those exact local bytes, not the earlier incorrectly encoded draft commits.

## Later host test pack and release gate

An owner-approved isolated HTTPS endpoint must serve this exact candidate with dependencies and the existing transport. An owner-approved ChatGPT test connection must discover the eight tools and PMF UI resource. This run does not create or deploy either.

1. Open a fresh PMF result and confirm the branded inline widget loads, with no external asset request and a complete text fallback.
2. Start with empty fields. Confirm no automatic calculation and useful required-field errors. Enter a business chosen by the tester, its market and its own metrics. Verify parsed values, example range, score basis and dimension statuses against the text.
3. Enter only NPS 80. Confirm missing-data warnings and the insufficient-evidence qualification remain beside the high score.
4. Test zero churn, annual churn, a market alias and a services business. Confirm zero is supplied, annual churn is not silently converted, the actual example range is named, and services excludes activation from the average.
5. Use the regression figures: monthly churn 1%, NPS 60, LTV 90000, CAC 10000, retention 40%, activation 70%. Confirm retention is CRITICAL and the widget action panel is neutral. The legacy text issue remains until the separate fix is approved and integrated; record it as a release blocker.
6. Edit and recalculate repeatedly, including literal markup in a product description. Check preserved literal fields, inert rendering, stale success/error suppression, reset during a pending call, host errors and unrelated host notifications.
7. Check keyboard operation and widths 320, 768 and 1280. The dimensions table scrolls within its region and does not overflow the page.
8. Save actual host receipts for resource load, tools/call, recalculation, errors and the exact candidate SHA. Simulated browser results are not host acceptance.

A later widget release needs owner approval after the In-review hold, actual host acceptance, regression reconciliation with the separate retention fix, and a separately authorized plugin version/package/metadata update if the publisher workflow requires one. No such change is part of this draft.
