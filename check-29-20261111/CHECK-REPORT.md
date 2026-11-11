# Independent check of guide 29

Completed 2026-11-11T13:38:30+05:30. Both repositories use `codex/check-29-20261111`.

The check is complete. The pricing reader, confirmation claims, retention model and arithmetic edge cases needed fixes. All 45 focused tests now pass. The full suite has 8,418 tests: 8,323 pass, 28 fail and 67 skip. The 28 failing tests are exactly the same failures as the untouched builder branch. There are no new checker failures. The release inventory pins still need the release owner's attention, so this is not a claim that the full suite is green.

No merge, pull request, deploy, publish, release or live change was made.

## Sources and scope

Read `codex-run-20261110/COMMON.md`, `CHECK-BRIEF.md`, and all five builder notes: `BRIEF.md`, `CHALLENGE.md`, `README.md`, `REPORT.md` and `CODEX-CHECK.md`.

Code starts at Fable's `3c94ae8a103ca0d429701ba39ae037a7489cdfb6`, on top of deployed `9c91a26`. The checked implementation is [0a846c1](https://github.com/shashwatgtm/craft-gtm-mcp/commit/0a846c16e5bc298b39458798d8b68b0f015d147c), following checker commit `0dd1c27`. [Code branch](https://github.com/shashwatgtm/craft-gtm-mcp/tree/codex/check-29-20261111). Main was exported read only at `513882bd7e38aaf58bed7e38fa99fcbd6c4d376f` to identify pre-existing failures. No main checkout or main write was used.

The guide text referred to as `inputs/GUIDE-29.txt` is not present in these checkouts. The known answer was checked against the supplied guide input fixture, printed guide figures in the existing test, and builder notes. The external motion and sizing results are recorded builder evidence, not fresh live calls by this checker. Their arithmetic is not copied into this wrapper.

Changes stay in the new wrapper, its page, tests, compiled files and checker records. All ten tool definitions, including the new tool, are byte identical to the Fable list. The nine established definitions also equal the frozen production contract. Nine complete existing responses match hashes captured from an untouched Fable export. See [contract evidence](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/contract-check.json) and `tests/fixtures/segment-check/existing-tool-responses.json` in the code branch.

## Findings and fixes

All test names below are in `tests/segment-check-independent.test.mjs`, unless stated otherwise. The original `tests/segment-check.test.mjs` remains the guide and three worked-set check. No owner production pins were changed.

| Finding | Severity | Failing input and actual behavior before | Expected behavior and fix | Regression evidence |
|---|---|---|---|---|
| 1. A mention or future plan became a pricing contract | High | “Seat based today, moving to usage next year” read as hybrid. “We bill per shipment; seats are unlimited” read as hybrid. “Seat pricing is not used; we bill per API call” read as hybrid. “We switched from per seat to usage” read as seat. | Read the present billed unit, exclude denied or free units and feature mentions, use the destination of a completed switch, and hold questions, ambiguous AI agents and uncertain transitions as not clear. A fixed platform fee alone does not prove seats. | Nine named `pricing adversarial exact, same meaning and opposite` tests, plus `pricing mentions, uncertain plans, free units and questions never invent a current contract`. Original 27 sector sentences also pass. |
| 2. The pauses overstated what the server knows | High | One first call with all three flags true ran the sums without any prior call or a human message. Output said “confirmed by you”; the page promised no sum until the person said yes. | Keep each strict boolean gate, but call it a caller attestation. Every answer and the page now say the server cannot verify that a person said yes. The chat must ask and ask again when inputs change. No claim that a two-call token would prove human consent. | `all three pauses and strict booleans are honest caller attestations, not proof of a human yes`, all eight boolean combinations and text/number impostors. |
| 3. Seat cuts already in retention were subtracted again | High | Regional carriers: ACV 48,000, gross 88%, net 104%, cut 20%, affected share 50%; writing says the cuts are already included. The old result still took another 10 points off, to 78% and 94%. | Aggregate projections stay Missing when the cut is already counted or its basis is unknown. A separate prospective account renewal remains available, explicitly based on a pre-cut ACV. | `retention basis: exact and equivalent fresh cut work; cuts already counted are never counted again`, with exact, equivalent and opposite statements. |
| 4. The retention denominator and expansion assumption were unstated | High | The same 10 points were subtracted whether affected share meant current revenue or opening ARR, and net always lost the same points even if expansion changed. | Gross projection needs a written additional cut outside reported retention and affected revenue measured against opening ARR. Net also needs expansion revenue held unchanged. Unknown, denied and uncertain assertions hold the affected projection. One loss is applied once to gross and once to net; net is not reduced a second time after reducing gross. | `retention cohort denominator and expansion assumptions cannot be supplied by missing, opposite or uncertain text`; bridge check: 78 gross + 16 expansion = 94 net. |
| 5. Impossible and contradictory retention drove decisions | High | Gross 5%, net 10%, cut 50%, affected share 100% produced gross -45% and net -40%. Gross 92%, net 88% produced expansion -4 points and still fed planning sums despite a warning. | An additional loss greater than retained revenue holds the projection with a reason. Net below gross remains visible as reported evidence, but expansion, later retention-based comparisons and cut projections are Missing; it does not trigger acquisition spending advice. | `retention cannot become negative; exact and equivalent boundary gates still work` and `contradictory gross and net retention remain evidence, but cannot drive projections or expansion`. |
| 6. Real percentages of 1% or less were rejected | Medium | A 1% win rate or seat cut failed the old `<= 1` guard. Zero cut and zero revenue affected also failed. | Percent fields are interpreted literally within their published ranges. 0.5 means 0.5%, never a guessed 50%. Bounds still apply. A zero win rate is refused with a specific explanation because it cannot plan wins through division. | `literal small percentages and zero losses are data; invalid percentages and zero win rates are refused`; 0, 0.5, 1, 100 and invalid edges. |
| 7. Zero and no payback were confused with missing data | Medium | Zero demand, CAC, usage price or cycle was rejected. With six months of ramp and a 240-day cycle, all inputs could be present but seller payback still said it needed those inputs. | Valid zeros are retained. No closes means no seller payback in this plan, not missing evidence. Zero gross margin has no profit payback. Zero usage price does not divide by zero. Zero accounts, target, buyer saving and seller cost remain literal. | `zero demand, no selling window and zero margin are distinguished from missing input`, `zero accounts, target, buyer saving and seller cost preserve their literal meaning`, and usage rate tests. |
| 8. A sizing draft silently became a hiring target | Medium | With sizing customers 100, no own target, and 12 closes per seller, the tool planned 8.3 sellers and a CAC budget from the market-share draft. | Require the buyer's own target for hiring, opportunity, pipeline and budget sums. Sizing figures remain separate borrowed evidence. The guide fixture now states the guide's 30-customer operating target explicitly. | `a sizing first draft never silently becomes a hiring target`, with absent, 24 and 36 customer targets. |
| 9. Small usage rates rounded to zero | Medium | 9,600 lost revenue / 400 million shifted work units = 0.000024. Old structured output rounded it to 0 and the displayed rate to $0.00. | Keep rate precision in structured output and show meaningful decimal rates. At 75% margin the profit floor is 0.000018 before run cost. Zero run cost and prices below run cost are calculated honestly. | `usage rates retain micro prices, zero run costs and loss making prices; zero prices do not divide by zero`. |
| 10. Missing data looked reassuring or became a fake zero | Medium | Missing cut figures could produce “No segment showed a seat cut loss”. Missing gross retention could be formatted as “gross stayed at 0%”. A usage-only case with no affected share could print an invalid percentage. | Missing never establishes safe pricing. No coercion of missing retention into zero. Zero seat loss without an affected share uses plain words instead of a made-up percentage. | `missing values never produce a reassuring safety conclusion or a fake zero` and `zero base loss with missing affected share never prints an invented percentage`. |
| 11. Bad numbers and malformed rows were not safely explained | Medium | A null segment could throw a property error. Non-finite or overflowing sums could become Missing in structured output while formatted text still exposed invalid arithmetic. | Named-segment checks, finite input checks and a finite intermediate-result check produce plain refusals. Numeric strings continue through the existing server reader; a percent sign in a numeric field is refused, not guessed. | `numeric strings use the shared number reader, bad numbers and malformed segments fail in plain words`, with equivalent comma-formatted amounts, invalid values and huge target/ACV cases. |
| 12. A tied year was described as a lead | Low | With year-one profit per CAC 2 versus 1, retention 0% versus 100%, year two ties at 2. Old prose claimed the first segment led through year two. | State year-one leader and the first year of a strict opposite lead; explicitly exclude intervening ties. The calculation and guide's lead-change years remain intact. | `later-years comparison never claims a leader through a tied year`, with scaled equivalent inputs and no-change opposite case. |
| 13. Retention signals dropped the supplied industry | Low | Generic product “Operations platform” with industry telecom omitted that industry when calling the retention playbook and returned generic adoption signals. | Pass industry through the existing sector reader and then into the existing playbook. No copied sector rules and no change to the playbook itself. | `retention signal extracts carry the supplied industry without changing the playbook`, with telecom, telecommunications and cybersecurity inputs. |

## Arithmetic checked by hand

Every calculation uses unrounded inputs; rounding is for display or the documented structured figures. Money shares and rates are not inferred from an omitted input. The tests use exact inputs, equivalent inputs and opposite inputs where a semantic decision is involved. I read the passing guide answer and the changed output lines, in addition to checking assertions.

| Formula or bridge | Hand check |
|---|---|
| CAC / monthly ARR, leading measure | 45,000 / (60,000 / 12) = 9 months; 9,000 / (18,000 / 12) = 6 months. |
| CAC / monthly gross profit, second line | 45,000 / (60,000 × 0.72 / 12) = 12.5 months; digital = 8.3333 months. |
| Expansion points | 108 - 92 = 16; 92 - 82 = 10. Inconsistent net below gross is held. |
| Retained revenue sum | For three years at 50% retention: 1 + 0.5 + 0.25 = 1.75. Also checked 0%, 100% and 150%. |
| Finite gross profit per CAC | 20,000 × 0.5 / 10,000 × 1.75 = 1.75. Guide's eight printed figures reproduce as 0.96, 1.44, 4.09, 5.03, 5.63, 6.14, 8.57, 7.96. |
| Lead change and CAC threshold | Guide changes at year 7 on net and 11 on gross. Five-year digital CAC limit is about 11,000, about 23% above 9,000. Independent threshold: 20,000 × 0.5 × 1.75 / 2 = 8,750. Ties tested separately. |
| Selling months | max(0, 12 - ramp - cycle days / 30). Guide 01: 8.5 and 6 months. This is a stated 30-day-month model, not a calendar forecast. |
| Deals, booked ACV and seller cost payback | 8.5 × 24 / 12 = 17 deals; 17 × 36,000 = 612,000; 200,000 / 17 / 1,800 = 6.5359 months. Second guide seller: 3.5 deals, 315,000 and 19.0476 months. |
| Target, CAC budget, opportunities and pipeline | Carrier set: 24 customers / 6 closes = 4 seller equivalents; 24 × 30,000 = 720,000; 24 / 0.25 = 96 opportunities; 96 × 48,000 = 4,608,000 pipeline. Guide operating target: 30 × 45,000 = 1,350,000 and 30 / (1/3) = 90 opportunities. |
| Demand capacity and wins | A ramped carrier seller closes 12 / 12 = 1 per month and needs 1 / 0.25 = 4 opportunities. Demand 16 carries 4 seller equivalents; 16 × 6 selling months × 0.25 = 24 wins. |
| Account renewal, seat and hybrid | 60,000 × (1 - 0.25) = 45,000. Hybrid: 80,000 × (1 - 0.6 × 0.25) = 68,000. Usage assumes unchanged volume and rates, not immunity to contraction. |
| Cohort cut and retention gates | 0.32 × 0.25 × 1 × 100 = 8 points. Gross 92 - 8 = 84; net 108 - 8 = 100; unchanged expansion 16 bridges 84 to 100. Gross gate 90 fails, net gate 100 passes. Exact boundary, above and below are tested. |
| Seat price, seats cut and work shifted | 60,000 / 100 = 600 per seat; 100 × 0.25 = 25 cut; lost revenue 15,000; 25 × 6,000 = 150,000 work units. |
| Revenue and profit floor | 15,000 / 150,000 = 0.10; × 0.72 = 0.072 before run cost. Adding 0.06 run cost would give a 0.132 profit-preserving floor. |
| Buyer saving, tested price and margin | 25 × 6,000 = 150,000 saving; / 150,000 units = 1 per unit. At 0.20: 30,000 revenue, twice the cut seat revenue, 20% of saving, and (0.20 - 0.06) / 0.20 = 70% margin. Negative margin and undefined zero-price margin are tested. |
| Missing and limits | Missing sources stay null or Missing; no zero substitution. Zero selling window, zero margin, zero prices, tiny prices, maximum percentages, absent assumptions and overflow each have explicit checks. |

Three complete hand-worked input sets cover logistics seats, payments usage and security hybrid pricing. The guide answer is computed from inputs, not stored as output constants. [Computed guide evidence](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/guide-computed.json).

## Payback rule and the later-years table

Keep `tracks_expansion` as an optional, explicitly finite-horizon planning table. It is not an estimate over a customer's entire lifetime. It has a fixed retention rate, fixed margin and no discounting, and it never leads the answer. CAC against ARR remains the lead, gross-profit payback stays second. The guide's finite-year example is preserved and tested. No lifetime value or lifetime multiple is introduced into the new tool's output.

The switch does not establish the quality of expansion data. The caller must have the account-level evidence. The table is absent when the switch is false or omitted. A later owner decision to forbid all multi-year CAC ratios, rather than lifetime metrics specifically, would mean removing it; this check does not assume that broader rule.

## Full suite and release holds

| Checkout | Tests | Pass | Fail | Skip |
|---|---:|---:|---:|---:|
| Current main, `513882b`, read only export | 8,374 | 8,285 | 22 | 67 |
| Untouched Fable, `3c94ae8` | 8,391 | 8,296 | 28 | 67 |
| Checked code, `0a846c1` | 8,418 | 8,323 | 28 | 67 |

`npm run build` passes. `npm run check:current-dist` passes: all 228 committed compiled files equal a fresh current build. Focused tests: 45 of 45 pass. [Focused test output](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/focused-tests.txt). [Full suite comparison, exact failing names and counts](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/suite-comparison.json).

Twenty-one failures are **already failing on main**:

- `scripts/test-in-field.mjs`: private in-field fixtures are not present.
- `tests/scale-paid-check-redteam.test.mjs`: rt01 through rt18, each individually named in the comparison JSON; the external `out/redteam-inputs` files are absent.
- `tests/scale-paid-check.test.mjs`: test 13, “data/*.json files run without error and echo the rows received”, and test 14, “Firstwork churn_reasons produce three '### Reason' headings in the playbook text matching the three interview hypotheses”. The external data fixture is absent.

Main also failed `tests/run40s-escape.test.mjs`, “the escape pass: every escaped value is inert by itself (unit)”, under parallel load. That timing-sensitive test passed in both the untouched Fable run and the checked full run. It was not changed.

Seven failures exist on the builder branch because adding the tenth tool conflicts with owner pins. COMMON.md says not to change those pins, so all seven remain open for the release owner:

1. `tests/release-contract.test.mjs`: complete tools/list bytes equal the pinned reviewed production contract over HTTP.
2. Same file: complete tools/list bytes equal the pinned reviewed production contract over compiled stdio.
3. `tests/helix-results.test.mjs`: tool names, descriptions and input schemas equal the pinned production contract; only the widget tool gains metadata.
4. `tests/p1-regions-integration.test.mjs`: all tool names, descriptions, schemas, annotations and lists stay unchanged.
5. `tests/release-answer-structure.test.mjs`: structural fixtures cover the complete frozen and actual tools inventory exactly once.
6. `tests/qfix-input-evidence.test.mjs`: RTM12 every listed tool with free text has a fixture and field coverage.
7. `tests/required-text.test.mjs`: the tools with a required text field are counted for the built profile.

These are actual failures, not waived passing tests. They were reproduced on the clean Fable export, not attributed to it by assumption.

## What remains and why

- A stateless caller-supplied boolean cannot authenticate a person's yes. The corrected output is honest about that limit. Genuine enforcement would need a trusted host confirmation mechanism; a phrase a model can echo would not solve it.
- The schema and descriptions are frozen by COMMON.md. The new retention basis therefore uses the existing `what_customers_can_cut` text. It is a conservative wording gate, not a proof of cohort accounting. Unrecognized wording holds the projection; the person must check that ARR and retention use the same cohort and period. A later schema revision could make additional versus already counted cuts, ARR denominator and expansion assumptions explicit fields.
- Useful wording for that existing text is: “Agent seats at yearly renewal. Additional seat cuts not included in reported retention. Affected revenue is a share of opening ARR. Expansion revenue stays unchanged.” State the person's facts, not an example copied to satisfy a check.
- Natural-language pricing is not a universal contract reader. Unsupported, uncertain and hours-based pricing stays not clear; the existing explicit pricing choice remains available, with disagreement warnings. The tool adds no hours enum or new software advice.
- Usage pricing is a fixed-volume, fixed-rate counterfactual. There is no usage-volume-drop input, so a volume contraction is explicitly outside this scenario. It is not presented as safe pricing.
- Motion and sizing are borrowed results typed by the caller. The wrapper does not authenticate them or call the network. Handoff context can change a motion result; it should be rerun for the actual product and buyer. No software or client names were added.
- The playbook is still a separate illustrative signal framework. Its extracted headings and existing sector rules remain dependencies. The wrapper labels those signals as illustrations, not spending gates.
- New listing descriptions were not edited. Proposed release wording for the confirmation sentence: “The calling chat must ask the person to confirm the split, their own win rate and the additional cut scenario. This server uses the caller's flags and cannot verify a person's yes. Retention projections need an additional cut outside reported retention, a share of opening ARR and, for net retention, unchanged expansion revenue.” Also describe the optional table as finite-horizon rather than promising it on every run.
- No widget, indexing, site inventory, release version, live host or listing changes were made. Those remain in the coordinator's release lane.

## Page and final state

Chromium and Playwright used actual 375 × 900 and 1440 × 900 viewports. At 375, the document width is exactly 375 and the 520-pixel table scrolls inside a 333-pixel container. At 1440, the document is 1440 wide with no horizontal overflow. There are no page script errors. Both full-page screenshots were inspected: [375 pixels](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/page-375.png), [1440 pixels](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/page-1440.png), [measurements](https://github.com/shashwatgtm/gtmhelix-tools-hub/blob/codex/check-29-20261111/check-29-20261111/evidence/browser-check.json).

The generated guide answer and waiting page were checked for plain English, em/en dashes, exclamation marks, internal labels and named software recommendations. The existing software-purchase question still routes to the owner's 45-minute booking. Same inputs return the same text and structured data.

`state.json` is closed in both checker branches. No owner answer is needed to finish this check. The remaining actions above belong to a future contract or release decision and do not change anything live.
