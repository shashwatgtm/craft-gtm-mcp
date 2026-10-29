# Keeping interview questions neutral in host replies

29 October 2026. Design note only. Helix GTM Planning 2.2.23 is In review. No server, tool metadata, package or version change is included.

## Finding

A result format can make exact quotation easier to request and check. It cannot guarantee that a model-written host reply will preserve every question word for word. I found no documented verbatim-output enforcement field in the OpenAI pages read below. This is a conclusion from those documented interfaces, not a promise about every host implementation.

The owner's 29 October rerun record reports a neutral tool question, "What, if anything, slowed it down or went wrong?" The host rewrote questions into forms such as "What caused the delay?" The latter assumes a delay. The live tool comparison reported that this wording did not come from the server. Treat the host reply and raw result as separate evidence. This note does not reopen the fixed interview writer.

## What the documentation supports

The [tool result reference](https://developers.openai.com/plugins/reference#tool-results) says content and structuredContent reach both the model and component. A declared outputSchema constrains structured data. Result _meta is component-only. The reference's wording about the model reading structured fields does not define a requirement that its final prose copy them.

The [UI guide](https://developers.openai.com/plugins/build/chatgpt-ui) describes components rendering returned structured results through the MCP Apps bridge. The component can show exact strings with a controlled renderer. That is a distinct surface from the host's surrounding prose.

The [metadata guide](https://developers.openai.com/plugins/guides/optimize-metadata) recommends a labelled prompt set, observed tool-call outcomes and one change at a time. It offers an evaluation process rather than a verbatim guarantee.

These pages were read directly on 29 October 2026. The result visibility rules, bridge behavior and evaluation advice are documented. The recommendations below are design judgments.

## Options

| Option | Useful effect | Remaining limit | Recommendation |
| --- | --- | --- | --- |
| Numbered questions under an Ask as written label | Gives stable boundaries for copying and comparison. | A host can still omit, reorder or paraphrase. | Lowest-cost future experiment. Keep neutral conditions adjacent to each question. |
| structuredContent questions with IDs | Makes order, exact text and conditions explicit. Supports a component and deterministic comparisons. | Machine-readable data does not force a model's final wording. | Add only in a later authorized implementation. Preserve current text. |
| Short note for the user | Tells an interviewer to use the original wording and check conditions. | A note can be omitted from a summary. | Useful now as owner-authored test guidance. No server change required. |
| Component with exact question text and Copy question | The implementation can render and copy the returned string without model paraphrasing. | It controls only the component. UI failures, escaping and copy fidelity still need tests. | Strongest option when exact delivery matters. Separate future scope. |
| Ask the host to quote the numbered questions exactly | Makes the current user's intent clear. | Instruction following still needs observation. It is not an API guarantee. | Compare in a separately authorized host test. |
| Put instructions in hidden result _meta | Can support a component. | The model cannot see these fields, so they cannot steer its prose. | Do not use this as a host-rewording remedy. |

## Minimal future result contract

This is a proposed shape, not applied code. A later schema can make conditions first-class data.

```json
{
  "schemaVersion": 1,
  "questions": [
    {
      "id": "discovery-02",
      "order": 2,
      "text": "What, if anything, slowed it down or went wrong?",
      "askWhen": "Always",
      "purpose": "Explore whether a problem occurred without assuming one"
    }
  ],
  "presentationNote": "Ask each question as written. Keep its condition. Label any adaptation separately."
}
```

Do not mix a respondent's supplied quote with trusted presentation guidance. Quotes remain untrusted source data. Use ordinary inert text rendering. If literal fidelity requires a component-only representation after shared escaping, test that path explicitly rather than disabling output safety.

For text-only hosts, retain the full interview guide. A proposed additional instruction is: "Use the original numbered questions for the interview. A summary can omit conditions." It should remain advice to the user, not an attempted override of host instructions.

## Evaluation plan

No tests were run for this design note. After owner approval for a separate host test:

1. Use the same synthetic discovery fixture. Capture exact tool arguments and the complete raw result.
2. Save the host reply separately. Compare each question's ID, wording, order and askWhen condition.
3. Score exact preservation separately from neutrality. A harmless paraphrase can fail exact matching without becoming a leading question.
4. Flag any assumption of a delay, problem, cost or failed process before the respondent confirms it. Keep "if anything", "if at all" and conditional follow-ups in the comparison.
5. Compare the current result, a numbered label experiment and a structured result experiment using the same prompts. Do not claim causation from a single reply.
6. For a future component, test visible text and clipboard output byte for byte, escaped punctuation, untrusted markup, missing fields and text-only fallback. Confirm no result is silently replaced by a canned question.

A finite passing sample supports the observed runs only. It cannot establish that every later host reply will copy the wording.

## Release boundary

Current [MCP review guidance](https://developers.openai.com/plugins/deploy/app-review) distinguishes live result changes from reviewed tool metadata and plugin information changes. The owner's review hold is stricter than the minimum documented update mechanism. Keep GTM Planning unchanged during this run. Consider any implementation in a later owner-approved release and version decision.

Only this Markdown note is delivered on codex/interactive-shortlist-20261029 in draft GTM #4. No host chat, build, deployment, submission or new version was run or prepared.
