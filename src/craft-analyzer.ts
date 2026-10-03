import { analyzeCRAFTDimensions, isMarketLine, type CRAFTDimension } from './utils.js';
import { andList, readContext, q, qc, splitPhrases } from './context.js';
import { answerFor } from './context.js';

export function generateCRAFTAnalyzer(args: {
  document_content: string;
  document_type: string;
  intended_audience?: string;
  desired_outcome?: string;
  industry?: string;
}): string {
  // Run 18 (R18-26, P05-WS-01): leading and trailing whitespace is not part of the document, so it is not measured or shown
  // (the web form already trims it in netlify/functions/api.mjs). Interior whitespace is kept exactly.
  const content = args.document_content.trim();
  const docType = args.document_type;
  // Run 20: when audience or outcome is not given as an input, the plan's own Audience and Goal lines are read and shown (before, the answer said
  // "Not specified" for a plan that states both).
  const labelled = content.split('\n').map((l) => { const m = l.match(/^\s*([A-Za-z][A-Za-z /&'-]{1,40}):\s*(.+)$/); return m ? { label: m[1].trim(), text: m[2].trim() } : null; }).filter((x): x is { label: string; text: string } => !!x);
  const planAudience = labelled.find((x) => /^(?:target )?audience$|^icp$|^segments?$/i.test(x.label));
  const planGoal = labelled.find((x) => /^(?:goals?|objectives?|targets?|outcomes?|success(?: criteria| metrics?)?)$/i.test(x.label));
  const audience = args.intended_audience || 'Not specified';
  const outcome = args.desired_outcome || 'Not specified';
  const audienceShown = args.intended_audience || (planAudience ? `not given as an input; your plan's own Audience line says: ${qc(planAudience.text, 160)}` : 'not given, and the plan has no Audience line');
  const outcomeShown = args.desired_outcome || (planGoal ? `not given as an input; your plan's own ${planGoal.label} line says: ${qc(planGoal.text, 200)}` : 'not given, and the plan has no Goal line');
  
  // The plan is read in its parts when it is labelled (Message and How we differ are the seller's words; Buyer roles are job titles; Audience is the buyer);
  // a plan with no such lines is read whole, as deal text. Its Goal line is not read: it often lists the segments, which are the buyer's sector, not yours.
  const byLabel = (re: RegExp): string[] => labelled.filter((x) => re.test(x.label)).map((x) => x.text);
  const sellerLines = byLabel(/^(?:message|messaging|positioning|how we differ|differentiat\w+|what we sell|offer|product)$/i);
  const readInput = sellerLines.length || planAudience
    ? { seller: [content.split('\n')[0], ...sellerLines], role: byLabel(/^buyer(?:s| roles?)?$|^personas?$/i), buyer: [args.intended_audience, planAudience?.text] }
    : { context: [content, args.desired_outcome], buyer: [args.intended_audience] };
  const sectorCtx = readContext({ vertical: args.industry }, readInput);
  const sectorCtx0 = sectorCtx;
  // Perform CRAFT analysis
  const analysis = analyzeCRAFTDimensions(content);
  
  // Calculate overall score
  const totalScore = analysis.character.score + analysis.result.score + analysis.artifact.score + analysis.frame.score + analysis.timeline.score;
  const maxScore = 50;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Determine rating
  let rating = '';
  if (percentage >= 80) { rating = 'EXCELLENT'; }
  else if (percentage >= 60) { rating = 'GOOD'; }
  else if (percentage >= 40) { rating = 'NEEDS WORK'; }
  else { rating = 'SIGNIFICANT GAPS'; }
  
  // Run 12 (R12-21): the terms each dimension looks for, named when a dimension scores under 7 with no gap listed.
  // Run 19 (D80, problem 5): the answer names only what the plan lacks and says what it does have.
  const TERMS: Record<string, string> = {
    character: 'owners, roles and teams',
    result: 'measurable goals and targets',
    artifact: 'deliverables and outputs',
    frame: 'budget, constraints and assumptions',
    timeline: 'dates, deadlines and milestones',
  };
  const noGap = (key: string, d: CRAFTDimension, strong: string): string => {
    if (d.score >= 7) return `- ${strong}`;
    const have = d.groupsFound.length ? `found ${andList(d.groupsFound)}` : 'found little';
    return d.groupsMissing.length
      ? `- Partly covered: ${have}; not found: ${andList(d.groupsMissing)}`
      : `- Partly covered: ${have}, but only ${d.found.length} term${d.found.length === 1 ? '' : 's'} matched; add more detail`;
  };
  // The body of one dimension: what the plan contains (its own line), the gaps, the recommended section.
  const body = (key: string, d: CRAFTDimension, strong: string, foundLabel: string): string => `**${foundLabel}:**
${d.found.length > 0 ? d.found.slice(0, 5).map(f => `- "${f}"`).join('\n') : '- None'}
${d.evidence.length > 0 ? `\n**Your plan's own line${d.evidence.length > 1 ? 's' : ''}:**\n${d.evidence.map(e => `> ${e}`).join('\n')}\n` : ''}
**Gaps identified:**
${d.gaps.length > 0 ? d.gaps.map(g => `- ${g}`).join('\n') : noGap(key, d, strong)}

${d.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement(key, d.gaps)}` : ''}`;

  // Generate improved sections for gaps
  const generateImprovement = (dimension: string, gaps: string[]): string => {
    if (gaps.length === 0) return 'No improvements needed';
    
    switch (dimension) {
      case 'character':
        return `**Add this section (fill the empty cells):**
\`\`\`
## Roles & Responsibilities

| Role | Responsibility | Name/Team |
|------|---------------|-----------|
| Owner | Overall accountability |  |
| Executor | Day-to-day execution |  |
| Approver | Sign-off authority |  |
| Consulted | Input needed |  |
| Informed | Keep updated |  |
\`\`\``;
      
      case 'result':
        return `**Add this section (fill the empty cells):**
\`\`\`
## Success Metrics

| KPI | Current | Target | Timeline |
|-----|---------|--------|----------|
| Primary metric |  |  |  |
| Secondary metric |  |  |  |
| Leading indicator |  |  |  |

Success Definition (one measurable outcome, with a date):
\`\`\``;
      
      case 'artifact':
        return `**Add this section (fill the empty cells):**
\`\`\`
## Deliverables

| Deliverable | Description | Owner | Due Date |
|-------------|-------------|-------|----------|
|  |  |  |  |
|  |  |  |  |
\`\`\``;
      
      case 'frame':
        return `**Add this section (fill the empty cells):**
\`\`\`
## Context & Constraints

**Target Audience:** (use the audience line of your plan)
**Budget:** 
**Resources Available:** 
**Constraints:** 
**Assumptions:** 
\`\`\``;
      
      case 'timeline':
        return `**Add this section (fill the empty cells):**
\`\`\`
## Timeline & Milestones

| Phase | Milestone | Date | Status |
|-------|-----------|------|--------|
| Phase 1 |  |  |  |
| Phase 2 |  |  |  |
| Phase 3 |  |  |  |

Key Deadlines:
- : 
- : 
\`\`\``;
      
      default:
        return 'Review and enhance this section';
    }
  };
  
  // Run 20: what the plan states, line by line, and the gaps that matter for a go-to-market plan (read from the plan's own lines).
  const countsFor = (label: string, text: string): string => {
    if (isMarketLine(`${label}: ${text}`)) return /^(?:message|messaging|positioning|how we differ|differentiat\w+|proof|references?|testimonials?|quotes?|case stud)/i.test(label) ? 'Not scored (describes your product or your customers)' : 'Frame only (describes your customers and market, not who runs the plan)';
    if (/^(?:goals?|objectives?|targets?|outcomes?|success|kpis?|okrs?)/i.test(label)) return 'Result';
    if (/^(?:owner|owners|responsible|accountable|lead|team|raci)/i.test(label)) return 'Character';
    if (/^(?:budget|resources?|headcount|constraints?|assumptions?)/i.test(label)) return 'Frame';
    if (/^(?:timeline|dates?|schedule|milestones?|deadline)/i.test(label)) return 'Timeline';
    if (/^risks?/i.test(label)) return 'Risks section';
    return 'Read for all five areas';
  };
  const stated = labelled.slice(0, 10).map((x) => ({ ...x, counts: countsFor(x.label, x.text) }));
  const ownText = content.split('\n').filter((l) => !isMarketLine(l)).join('\n');
  const buyerLine = labelled.find((x) => /^buyer(?:s| roles?)?$/i.test(x.label));
  const matters: Array<{ title: string; detail: string }> = [];
  if (analysis.character.found.length === 0) matters.push({ title: 'Nobody on your side is named to run the plan', detail: `${buyerLine ? `The line ${qc(`${buyerLine.label}: ${buyerLine.text}`, 140)} names the customer's roles, which are not owners. ` : ''}Name who owns the goal and who does each piece of the work.` });
  if (!/\b(email|e-mail|linkedin|outbound|inbound|webinars?|events?|conferences?|roundtables?|partners?|referrals?|paid|ads|seo|abm|account-based|sdrs?|cold|calls?|social|community|press|field|direct|content|newsletter)\b/i.test(ownText)) matters.push({ title: 'No channel is named', detail: 'Say where the first conversations come from (outbound, events, partners, referrals, paid, content), and who is reached first.' });
  const hasNumberGoal = planGoal && /\d/.test(planGoal.text);
  if (hasNumberGoal && !/\b(win rate|close rate|conversion|meetings?|opportunit\w*|funnel|demos?|mqls?|sqls?|stage)\b/i.test(ownText.replace(planGoal!.text, ''))) matters.push({ title: 'The goal is not traced to activity', detail: `${qc(planGoal!.text, 150)} is a result, but no win rate, meeting count or stage conversion is stated, so it cannot be traced back to the work that would produce it. Work backwards from the goal: deals needed, opportunities needed, meetings needed.` });
  if (analysis.timeline.found.length === 0) matters.push({ title: 'No dates', detail: `${analysis.timelineWords.length ? `Only the words ${andList(analysis.timelineWords.slice(0, 3).map((w) => q(w)))} appear` : 'No period or date appears'}${/\bnext quarter\b/i.test(ownText) ? ' (the plan says "next quarter")' : ''}. Put a date on the first meeting, the pilot or first delivery, and the review.` });
  if (!analysis.frame.groupsFound.includes('a budget or resources')) matters.push({ title: 'No budget or headcount', detail: 'State what money and people the plan has, so the goal can be checked against what it costs.' });
  if (!/\b(weekly|monthly|fortnightly|review|check-?in|cadence|stand-?up|steering)\b/i.test(ownText)) matters.push({ title: 'No review rhythm', detail: 'Say when the plan is reviewed and by whom, and which number is looked at first.' });
  if (analysis.artifact.found.length === 0) matters.push({ title: 'No deliverables', detail: 'List what gets made (deck, one-pager, email sequence, event, case study) and who makes it.' });

  // A "Risks:" line holds several risks: each one is judged and answered on its own.
  const riskItems: Array<{ line: string; answered: boolean; pattern: string }> = [];
  for (const r of analysis.risks) {
    const m = r.line.match(/^\s*risks?\s*:\s*(.+)$/i);
    if (m) for (const item of splitPhrases(m[1])) riskItems.push({ line: item, answered: false, pattern: answerFor(item, sectorCtx0.v) });
    else riskItems.push({ ...r, pattern: r.answered ? '' : answerFor(r.line, sectorCtx0.v) });
  }
  // Build the analysis output
  let output = `# CRAFT Document Analysis
## ${docType.replace(/_/g, ' ').toUpperCase()}

**Document Length:** ${content.length} characters
**Words (estimate):** ~${Math.round(content.length / 5)}, from the character count
**Intended Audience:** ${audienceShown}
**Desired Outcome:** ${outcomeShown}

---

## Overall Score: ${totalScore}/${maxScore} (${percentage}%)

| Rating | ${rating} |
|--------|-------------|

Scores come from a keyword check of the lines that describe your own plan, not a reading of the whole plan: check each gap against your document. Lines that describe your customers, market or product (Audience, Buyer roles, Message, Proof, How we differ ...) are shown below but are not scored as your owner, goal, deliverables or dates; they count only toward Frame.

---

## Dimension Scores

| Dimension | Score | Status | Assessment |
|-----------|-------|--------|------------|
| **C**haracter (Who) | ${analysis.character.score}/10 | ${analysis.character.score >= 7 ? 'Yes' : analysis.character.score >= 4 ? 'Note' : 'No'} | ${analysis.character.score >= 7 ? 'Clear ownership' : analysis.character.score >= 4 ? 'Partial ownership' : 'Missing ownership'} |
| **R**esult (What success) | ${analysis.result.score}/10 | ${analysis.result.score >= 7 ? 'Yes' : analysis.result.score >= 4 ? 'Note' : 'No'} | ${analysis.result.score >= 7 ? 'Clear goals' : analysis.result.score >= 4 ? 'Vague goals' : 'No measurable goals'} |
| **A**rtifact (What's produced) | ${analysis.artifact.score}/10 | ${analysis.artifact.score >= 7 ? 'Yes' : analysis.artifact.score >= 4 ? 'Note' : 'No'} | ${analysis.artifact.score >= 7 ? 'Clear deliverables' : analysis.artifact.score >= 4 ? 'Some deliverables' : 'Unclear outputs'} |
| **F**rame (Context) | ${analysis.frame.score}/10 | ${analysis.frame.score >= 7 ? 'Yes' : analysis.frame.score >= 4 ? 'Note' : 'No'} | ${analysis.frame.score >= 7 ? 'Clear context' : analysis.frame.score >= 4 ? 'Partial context' : 'Missing context'} |
| **T**imeline (When) | ${analysis.timeline.score}/10 | ${analysis.timeline.score >= 7 ? 'Yes' : analysis.timeline.score >= 4 ? 'Note' : 'No'} | ${analysis.timeline.score >= 7 ? 'Clear timeline' : analysis.timeline.score >= 4 ? 'Vague timeline' : 'No timeline'} |

---

## Detailed Analysis

### C: CHARACTER (Who executes?)
**Score: ${analysis.character.score}/10**

${body('character', analysis.character, 'Character dimension is well-defined', 'Words matched')}

---

### R: RESULT (What does success look like?)
**Score: ${analysis.result.score}/10**

${body('result', analysis.result, 'Results are well-defined', 'Words matched')}

---

### A: ARTIFACT (What gets produced?)
**Score: ${analysis.artifact.score}/10**

${body('artifact', analysis.artifact, 'Artifacts are well-defined', 'Words matched')}

---

### F: FRAME (Context & constraints)
**Score: ${analysis.frame.score}/10**

${body('frame', analysis.frame, 'Frame/context is well-defined', 'Words matched')}

---

### T: TIMELINE (When does it happen?)
**Score: ${analysis.timeline.score}/10**

${body('timeline', analysis.timeline, 'Timeline is well-defined', 'Words matched')}

*Timeline scores dates, quarters (such as Q1) and durations with a number (such as 30 days). Words such as by, plan, quarter, month or milestone are not dates and are not scored.*

---

## What Your Plan States

${stated.length ? `| Your plan's line | Counted toward |\n|---|---|\n${stated.map((x) => `| ${qc(`${x.label}: ${x.text}`, 170)} | ${x.counts} |`).join('\n')}` : 'The plan has no labelled lines (such as "Goal:" or "Owner:"), so the tool read it as running text.'}

---

## Gaps That Matter For This Plan

*These are not part of the score. Each is read from your plan's own lines.*

${matters.length ? matters.map((m) => `- **${m.title}:** ${m.detail}`).join('\n') : '- No structural gap found by this check. Read the plan once for sense before you send it.'}

---

## Priority Improvements

`;

  // Prioritize improvements by lowest scores
  const dimensions = [
    { name: 'Character', key: 'character', score: analysis.character.score, gaps: analysis.character.gaps, missing: analysis.character.groupsMissing },
    { name: 'Result', key: 'result', score: analysis.result.score, gaps: analysis.result.gaps, missing: analysis.result.groupsMissing },
    { name: 'Artifact', key: 'artifact', score: analysis.artifact.score, gaps: analysis.artifact.gaps, missing: analysis.artifact.groupsMissing },
    { name: 'Frame', key: 'frame', score: analysis.frame.score, gaps: analysis.frame.gaps, missing: analysis.frame.groupsMissing },
    { name: 'Timeline', key: 'timeline', score: analysis.timeline.score, gaps: analysis.timeline.gaps, missing: analysis.timeline.groupsMissing }
  ].filter(d => d.score < 7).sort((a, b) => a.score - b.score);
  // The recommended action for a dimension: its first gap, or the generic action when it lists none
  // (a dimension can score below 7 with no gap listed, for example Frame with one match).
  const actionFor = (d: { key: string; gaps: string[]; missing: string[] }): string => d.gaps[0] || (d.missing.length ? `Add ${andList(d.missing)}` : `Add ${TERMS[d.key]}`);

  if (dimensions.length === 0) {
    output += `**Document is well-structured!** All CRAFT dimensions score 7/10 or higher.\n\n`;
  } else {
    output += `| Priority | Dimension | Current Score | Action |\n|----------|-----------|---------------|--------|\n`;
    dimensions.forEach((d, i) => {
      output += `| ${i + 1} | ${d.name} | ${d.score}/10 | ${actionFor(d)} |\n`;
    });
  }

  // Run 19 (D80, problem 8): a sector check from the sector data file. It is not a score: it names the deciders and the measures
  // of the sector that the plan itself names, and those it does not.
  const planLower = content.toLowerCase();
  const roleNamed = (role: string): boolean => {
    const acronym = /^Chief .* Officer$/.test(role) ? role.split(' ').filter((w) => /^[A-Z]/.test(w) && w !== 'Officer').map((w) => w[0]).join('') + 'O' : '';
    // the same words in another order count ("IT Infrastructure Head" names the "Head of IT Infrastructure"), all in one line of the plan
    const roleWords = role.toLowerCase().split(/\s+/).filter((w) => !['of', 'and', 'the'].includes(w));
    const sameWords = content.split('\n').some((line) => { const l = line.toLowerCase(); return roleWords.every((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(l)); });
    return planLower.includes(role.toLowerCase()) || sameWords || (acronym.length >= 3 && new RegExp(`\\b${acronym}\\b`, 'i').test(content));
  };
  const sectorCheck = sectorCtx.v
    ? (() => {
        const v = sectorCtx.v!;
        const rolesNamed = v.buyerRoles.filter(roleNamed);
        const rolesMissing = v.buyerRoles.filter((r) => !roleNamed(r));
        const keyOf = (m: string): string => m.split(/\s+/).find((w) => w.length >= 6 && !['percent', 'number'].includes(w.toLowerCase())) ?? m;
        const metricsNamed = v.metrics.filter((m) => planLower.includes(m.toLowerCase()) || new RegExp(`\\b${keyOf(m).toLowerCase().replace(/[^a-z-]/g, '')}\\b`).test(planLower));
        return `## Sector Check

*Sector: ${sectorCtx.sector}. This is not part of the score.*

- **Who usually decides:** ${v.committee}
- **Deciders your plan names:** ${rolesNamed.length ? andList(rolesNamed) : 'none of the usual roles'}. **Not named:** ${rolesMissing.length ? andList(rolesMissing) : 'none'}.
- **What this sector measures:** ${v.metrics.join(', ')}. **Your plan names:** ${metricsNamed.length ? andList(metricsNamed) : 'none of them'}.
- **A proof point that lands:** ${v.proofShape}
- **Words this buyer uses:** ${v.vocabulary.join(', ')}.
`;
      })()
    : `## Sector Check

The sector was not clear from your plan. Name the buyer's industry in the plan to get a check against that sector's deciders and measures.
`;
  output += `
---

${sectorCheck}`;

  // Run 19: a risk the plan names without any response is flagged; a plan that names none is asked for two.
  output += `
---

## Risks in Your Plan

${riskItems.length === 0
  ? 'No risk is named in the plan: name the top two and how you would respond to each.'
  : riskItems.map(r => r.answered ? `- Risk with a response: "${r.line.replace(/[.]$/, '')}"` : `- Risk named without a response: "${r.line.replace(/[.]$/, '')}". Add a response, an owner and the signal that triggers it.${r.pattern && !/^Ask what lies behind it/.test(r.pattern) ? ` A usual response: ${r.pattern}` : ''}`).join('\n')}
`;

  output += `
---

## Document Excerpt Analyzed

\`\`\`
${content.substring(0, 500)}${content.length > 500 ? '...\n\n(The document continues: ' + (content.length - 500) + ' more characters.)' : ''}
\`\`\`

---

## Next Steps

1. ${matters[0] ? `${matters[0].title}. ${matters[0].detail}` : dimensions[0] ? `Address ${dimensions[0].name}: ${actionFor(dimensions[0])}` : 'Document is well-structured: ready for review'}
2. ${matters[1] ? `${matters[1].title}. ${matters[1].detail}` : dimensions[1] ? `Improve ${dimensions[1].name}: ${actionFor(dimensions[1])}` : 'Consider adding more detail to strongest sections'}
3. ${matters[2] ? `${matters[2].title}. ${matters[2].detail}` : `Review with ${audience !== 'Not specified' ? audience : planAudience ? qc(planAudience.text, 90) : 'intended stakeholders'}`}
4. ${outcome !== 'Not specified' ? `Ensure the document drives: ${outcome}` : planGoal ? `Check that the plan drives its own goal: ${qc(planGoal.text, 120)}` : 'Define the desired outcome of this document'}

---

*Analysis performed using the CRAFT GTM framework*
*Document type: ${docType.replace(/_/g, ' ')}*`;

  return output;
}
