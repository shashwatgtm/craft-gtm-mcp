import { analyzeCRAFTDimensions, EXAMPLE_FIGURE } from './utils.js';

export function generateCRAFTAnalyzer(args: {
  document_content: string;
  document_type: string;
  intended_audience?: string;
  desired_outcome?: string;
}): string {
  const content = args.document_content;
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
  let ratingEmoji = '';
  if (percentage >= 80) { rating = 'EXCELLENT'; ratingEmoji = '🟢'; }
  else if (percentage >= 60) { rating = 'GOOD'; ratingEmoji = '🟡'; }
  else if (percentage >= 40) { rating = 'NEEDS WORK'; ratingEmoji = '🟠'; }
  else { rating = 'SIGNIFICANT GAPS'; ratingEmoji = '🔴'; }
  
  // Generate improved sections for gaps
  const generateImprovement = (dimension: string, gaps: string[]): string => {
    if (gaps.length === 0) return '✅ No improvements needed';
    
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
| Phase 1 | [Milestone] | [Date] | ⬜ |
| Phase 2 | [Milestone] | [Date] | ⬜ |
| Phase 3 | [Milestone] | [Date] | ⬜ |

Key Deadlines:
- [Date]: [Deliverable/milestone]
- [Date]: [Deliverable/milestone]
\`\`\``;
      
      default:
        return 'Review and enhance this section';
    }
  };
  
  // Build the analysis output
  let output = `# 📋 CRAFT Document Analysis
## ${docType.replace(/_/g, ' ').toUpperCase()}

**Document Length:** ${content.length} characters
**Words (estimate):** ~${Math.round(content.length / 5)}, from the character count ${EXAMPLE_FIGURE}
**Intended Audience:** ${audience}
**Desired Outcome:** ${outcome}

---

## 🎯 Overall Score: ${totalScore}/${maxScore} (${percentage}%)

| Rating | ${ratingEmoji} ${rating} |
|--------|-------------|

---

## 📊 Dimension Scores

| Dimension | Score | Status | Assessment |
|-----------|-------|--------|------------|
| **C**haracter (Who) | ${analysis.character.score}/10 | ${analysis.character.score >= 7 ? '✅' : analysis.character.score >= 4 ? '⚠️' : '❌'} | ${analysis.character.score >= 7 ? 'Clear ownership' : analysis.character.score >= 4 ? 'Partial ownership' : 'Missing ownership'} |
| **R**esult (What success) | ${analysis.result.score}/10 | ${analysis.result.score >= 7 ? '✅' : analysis.result.score >= 4 ? '⚠️' : '❌'} | ${analysis.result.score >= 7 ? 'Clear goals' : analysis.result.score >= 4 ? 'Vague goals' : 'No measurable goals'} |
| **A**rtifact (What's produced) | ${analysis.artifact.score}/10 | ${analysis.artifact.score >= 7 ? '✅' : analysis.artifact.score >= 4 ? '⚠️' : '❌'} | ${analysis.artifact.score >= 7 ? 'Clear deliverables' : analysis.artifact.score >= 4 ? 'Some deliverables' : 'Unclear outputs'} |
| **F**rame (Context) | ${analysis.frame.score}/10 | ${analysis.frame.score >= 7 ? '✅' : analysis.frame.score >= 4 ? '⚠️' : '❌'} | ${analysis.frame.score >= 7 ? 'Clear context' : analysis.frame.score >= 4 ? 'Partial context' : 'Missing context'} |
| **T**imeline (When) | ${analysis.timeline.score}/10 | ${analysis.timeline.score >= 7 ? '✅' : analysis.timeline.score >= 4 ? '⚠️' : '❌'} | ${analysis.timeline.score >= 7 ? 'Clear timeline' : analysis.timeline.score >= 4 ? 'Vague timeline' : 'No timeline'} |

---

## 🔍 Detailed Analysis

### C - CHARACTER (Who executes?)
**Score: ${analysis.character.score}/10**

**Found in document:**
${analysis.character.found.length > 0 
  ? analysis.character.found.slice(0, 5).map(f => `- "${f}"`).join('\n')
  : '- ❌ No clear roles or owners identified'}

**Gaps identified:**
${analysis.character.gaps.length > 0 
  ? analysis.character.gaps.map(g => `- ${g}`).join('\n')
  : '- ✅ Character dimension is well-defined'}

${analysis.character.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement('character', analysis.character.gaps)}` : ''}

---

### R - RESULT (What does success look like?)
**Score: ${analysis.result.score}/10**

**Found in document:**
${analysis.result.found.length > 0 
  ? analysis.result.found.slice(0, 5).map(f => `- "${f}"`).join('\n')
  : '- ❌ No measurable outcomes defined'}

**Gaps identified:**
${analysis.result.gaps.length > 0 
  ? analysis.result.gaps.map(g => `- ${g}`).join('\n')
  : '- ✅ Results are well-defined'}

${analysis.result.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement('result', analysis.result.gaps)}` : ''}

---

### A - ARTIFACT (What gets produced?)
**Score: ${analysis.artifact.score}/10**

**Found in document:**
${analysis.artifact.found.length > 0 
  ? analysis.artifact.found.slice(0, 5).map(f => `- "${f}"`).join('\n')
  : '- ❌ No clear deliverables specified'}

**Gaps identified:**
${analysis.artifact.gaps.length > 0 
  ? analysis.artifact.gaps.map(g => `- ${g}`).join('\n')
  : '- ✅ Artifacts are well-defined'}

${analysis.artifact.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement('artifact', analysis.artifact.gaps)}` : ''}

---

### F - FRAME (Context & constraints)
**Score: ${analysis.frame.score}/10**

**Found in document:**
${analysis.frame.found.length > 0 
  ? analysis.frame.found.slice(0, 5).map(f => `- "${f}"`).join('\n')
  : '- ❌ No context or constraints defined'}

**Gaps identified:**
${analysis.frame.gaps.length > 0 
  ? analysis.frame.gaps.map(g => `- ${g}`).join('\n')
  : '- ✅ Frame/context is well-defined'}

${analysis.frame.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement('frame', analysis.frame.gaps)}` : ''}

---

### T - TIMELINE (When does it happen?)
**Score: ${analysis.timeline.score}/10**

**Found in document:**
${analysis.timeline.found.length > 0 
  ? analysis.timeline.found.slice(0, 5).map(f => `- "${f}"`).join('\n')
  : '- ❌ No timeline or deadlines specified'}

**Gaps identified:**
${analysis.timeline.gaps.length > 0 
  ? analysis.timeline.gaps.map(g => `- ${g}`).join('\n')
  : '- ✅ Timeline is well-defined'}

${analysis.timeline.gaps.length > 0 ? `\n**Recommended improvement:**\n${generateImprovement('timeline', analysis.timeline.gaps)}` : ''}

---

## 🎯 Priority Improvements

`;

  // Prioritize improvements by lowest scores
  const dimensions = [
    { name: 'Character', score: analysis.character.score, gaps: analysis.character.gaps },
    { name: 'Result', score: analysis.result.score, gaps: analysis.result.gaps },
    { name: 'Artifact', score: analysis.artifact.score, gaps: analysis.artifact.gaps },
    { name: 'Frame', score: analysis.frame.score, gaps: analysis.frame.gaps },
    { name: 'Timeline', score: analysis.timeline.score, gaps: analysis.timeline.gaps }
  ].filter(d => d.score < 7).sort((a, b) => a.score - b.score);
  // The recommended action for a dimension: its first gap, or the generic action when it lists none
  // (a dimension can score below 7 with no gap listed, for example Frame with one match).
  const actionFor = (d: { gaps: string[] }): string => d.gaps[0] || 'Enhance this section';

  if (dimensions.length === 0) {
    output += `✅ **Document is well-structured!** All CRAFT dimensions score 7/10 or higher.\n\n`;
  } else {
    output += `| Priority | Dimension | Current Score | Action |\n|----------|-----------|---------------|--------|\n`;
    dimensions.forEach((d, i) => {
      output += `| ${i + 1} | ${d.name} | ${d.score}/10 | ${actionFor(d)} |\n`;
    });
  }

  output += `
---

## 📝 Document Excerpt Analyzed

\`\`\`
${content.substring(0, 500)}${content.length > 500 ? '...\n\n[Document continues - ' + (content.length - 500) + ' more characters]' : ''}
\`\`\`

---

## ✅ Next Steps

1. ${dimensions[0] ? `Address ${dimensions[0].name}: ${actionFor(dimensions[0])}` : 'Document is well-structured - ready for review'}
2. ${dimensions[1] ? `Improve ${dimensions[1].name}: ${actionFor(dimensions[1])}` : 'Consider adding more detail to strongest sections'}
3. Review with ${audience !== 'Not specified' ? audience : 'intended stakeholders'}
4. ${outcome !== 'Not specified' ? `Ensure document drives: ${outcome}` : 'Define desired outcome from this document'}

---

*Analysis performed using CRAFT GTM Framework v2.0*
*Document type: ${docType.replace(/_/g, ' ')}*`;

  return output;
}
