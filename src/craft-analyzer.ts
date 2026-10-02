import { analyzeCRAFTDimensions, type CRAFTDimension } from './utils.js';
import { andList, readContext } from './context.js';

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
  const audience = args.intended_audience || 'Not specified';
  const outcome = args.desired_outcome || 'Not specified';
  
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
        return `**Add this section:**
\`\`\`
## Roles & Responsibilities

| Role | Responsibility | Name/Team |
|------|---------------|-----------|
| Owner | Overall accountability | [Add name] |
| Executor | Day-to-day execution | [Add team] |
| Approver | Sign-off authority | [Add name] |
| Consulted | Input needed | [Add names] |
| Informed | Keep updated | [Add groups] |
\`\`\``;
      
      case 'result':
        return `**Add this section:**
\`\`\`
## Success Metrics

| KPI | Current | Target | Timeline |
|-----|---------|--------|----------|
| Primary metric | [Baseline] | [Goal] | [Date] |
| Secondary metric | [Baseline] | [Goal] | [Date] |
| Leading indicator | [Baseline] | [Goal] | [Date] |

Success Definition: [Specific, measurable outcome]
\`\`\``;
      
      case 'artifact':
        return `**Add this section:**
\`\`\`
## Deliverables

| Deliverable | Description | Owner | Due Date |
|-------------|-------------|-------|----------|
| [Output 1] | [What it is] | [Who] | [When] |
| [Output 2] | [What it is] | [Who] | [When] |
\`\`\``;
      
      case 'frame':
        return `**Add this section:**
\`\`\`
## Context & Constraints

**Target Audience:** [Who this is for]
**Budget:** [$X or resource allocation]
**Resources Available:** [Team, tools, budget]
**Constraints:** [Limitations to work within]
**Assumptions:** [What we're assuming to be true]
\`\`\``;
      
      case 'timeline':
        return `**Add this section:**
\`\`\`
## Timeline & Milestones

| Phase | Milestone | Date | Status |
|-------|-----------|------|--------|
| Phase 1 | [Milestone] | [Date] | [ ] |
| Phase 2 | [Milestone] | [Date] | [ ] |
| Phase 3 | [Milestone] | [Date] | [ ] |

Key Deadlines:
- [Date]: [Deliverable/milestone]
- [Date]: [Deliverable/milestone]
\`\`\``;
      
      default:
        return 'Review and enhance this section';
    }
  };
  
  // Build the analysis output
  let output = `# CRAFT Document Analysis
## ${docType.replace(/_/g, ' ').toUpperCase()}

**Document Length:** ${content.length} characters
**Words (estimate):** ~${Math.round(content.length / 5)}, from the character count
**Intended Audience:** ${audience}
**Desired Outcome:** ${outcome}

---

## Overall Score: ${totalScore}/${maxScore} (${percentage}%)

| Rating | ${rating} |
|--------|-------------|

Scores come from a keyword check, not a reading of the plan: check each gap against your document.

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
  const sectorCtx = readContext({ vertical: args.industry }, content, args.intended_audience, args.desired_outcome);
  const planLower = content.toLowerCase();
  const roleNamed = (role: string): boolean => {
    const acronym = /^Chief .* Officer$/.test(role) ? role.split(' ').filter((w) => /^[A-Z]/.test(w) && w !== 'Officer').map((w) => w[0]).join('') + 'O' : '';
    return planLower.includes(role.toLowerCase()) || (acronym.length >= 3 && new RegExp(`\\b${acronym}\\b`, 'i').test(content));
  };
  const sectorCheck = sectorCtx.v
    ? (() => {
        const v = sectorCtx.v!;
        const rolesNamed = v.buyerRoles.filter(roleNamed);
        const rolesMissing = v.buyerRoles.filter((r) => !roleNamed(r));
        const metricsNamed = v.metrics.filter((m) => planLower.includes(m.toLowerCase()));
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

${analysis.risks.length === 0
  ? 'No risk is named in the plan: name the top two and how you would respond to each.'
  : analysis.risks.map(r => r.answered ? `- Risk with a response: "${r.line.replace(/[.]$/, '')}"` : `- Risk named without a response: "${r.line.replace(/[.]$/, '')}". Add a response, an owner and the signal that triggers it.`).join('\n')}
`;

  output += `
---

## Document Excerpt Analyzed

\`\`\`
${content.substring(0, 500)}${content.length > 500 ? '...\n\n[Document continues: ' + (content.length - 500) + ' more characters]' : ''}
\`\`\`

---

## Next Steps

1. ${dimensions[0] ? `Address ${dimensions[0].name}: ${actionFor(dimensions[0])}` : 'Document is well-structured: ready for review'}
2. ${dimensions[1] ? `Improve ${dimensions[1].name}: ${actionFor(dimensions[1])}` : 'Consider adding more detail to strongest sections'}
3. Review with ${audience !== 'Not specified' ? audience : 'intended stakeholders'}
4. ${outcome !== 'Not specified' ? `Ensure document drives: ${outcome}` : 'Define desired outcome from this document'}

---

*Analysis performed using the CRAFT GTM framework*
*Document type: ${docType.replace(/_/g, ' ')}*`;

  return output;
}
