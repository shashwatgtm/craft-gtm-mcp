# Discovery report: craft-gtm-mcp

Source work is closed on codex/discovery-20261111. Nothing was deployed or published.

Before: Acronym title, eight tool facts and weak next routes.

Why it matters: Buyers need a clear PMF and paid acquisition entry point.

Now in the draft: Buyer title and answer, ninth Scale Paid page and current counts, guide routes, current ChatGPT setup, and a typed CRAFT reference.

Checks: build passed; changed HTML has one h1, valid JSON-LD, titles at most 65 characters, extensionless canonicals, full raw text and resolving local targets. Browser source review passed at 375 and 1280 px with JavaScript disabled. Exact, same meaning and opposite buyer questions are retained in the hub acceptance cases. Runtime tool code, descriptions, schemas, tests and assistant JSON were left untouched.

Full suite: 8347 tests, 8258 passed, 22 failed, 67 skipped. The suite is not clean.

Already failing on main:

- `13. data/*.json files run without error and echo the rows received`
- `14. Firstwork churn_reasons produce three '### Reason' headings in the playbook text matching the three interview hypotheses`
- `Spec Section 10 (rt18: metric definitions missing fields and churn vs retention disagreement)`
- `Spec Section 11 (rt10: churn_reasons splitting with commas in numbers, semicolons, and newlines)`
- `Spec Section 2 (rt07: row checks rejecting zero and negative monthly_fee)`
- `Spec Section 2 (rt08: row checks rejecting duplicate customer IDs after first occurrence)`
- `Spec Section 2 (rt09: row checks rejecting invalid date formats and date ordering violations)`
- `Spec Section 2 and Section 4 (rt02: duplicate customer ID row rejection and paused/resumed status)`
- `Spec Section 3 and Section 5 (rt01: leap day 29 Feb date arithmetic and cohort checkpoints)`
- `Spec Section 4 and Section 5 (rt17: customers stopped before month 6 and resumed before month 9)`
- `Spec Section 4 and Section 6 (rt06: annual billing shape test skip and 89-day vs 90-day stop boundary)`
- `Spec Section 5 and Section 6 (rt05: cohort maturity boundary with only one mature cohort)`
- `Spec Section 5 and Section 6 (rt16: month-12 revenue kept diverging from logo retention)`
- `Spec Section 6 (rt13: stop rule shape test tie between months 1 to 6 and months 7 to 12)`
- `Spec Section 7 (rt14: seasonal tag boundary at exactly half of max monthly_starts and untagged rows)`
- `Spec Section 7 and Section 8 (rt03: single segment untagged group and whole base money block)`
- `Spec Section 7 and Section 9 (rt04: group boundary at 5 customers vs under 5 too few to read)`
- `Spec Section 8 (rt12: test_cap smaller than one opportunity cost warning)`
- `Spec Section 8 (rt15: zero window churn where kept equals base and monthly churn c equals 0)`
- `Spec Section 8 and Section 9 (rt11: blended CAC contrast vs paid-only CAC payback verdict)`
- `scripts/test-in-field.mjs`

The additional full-run escape speed assertion passed when its entire file was rerun separately: 11 passed, 0 failed. No code or test was changed.

Files changed:

- `discovery-20261111/REPORT.md`
- `discovery-20261111/state.json`
- `public/connect/index.html`
- `public/docs/index.html`
- `public/index.html`
- `public/llms.txt`
- `public/sitemap.xml`
- `public/tools/competitive-intel/index.html`
- `public/tools/craft-gtm-analyzer/index.html`
- `public/tools/crisis-planner/index.html`
- `public/tools/customer-interview-kit/index.html`
- `public/tools/launch-commander/index.html`
- `public/tools/partner-architect/index.html`
- `public/tools/pmf-scorecard/index.html`
- `public/tools/retention-playbook/index.html`
- `public/tools/scale-paid-check/index.html`

Owner questions: no additional question for this source branch. Cross-site blockers and the release sequence are in the hub discovery-20261111/OWNER-QUESTIONS.md and REPORT.md. Claude reviews the assembled draft, the owner approves release, then Fable checks the live result.
