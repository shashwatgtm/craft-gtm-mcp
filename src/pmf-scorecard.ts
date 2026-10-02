import { parseMetrics, scoreMetric, describeChoice, readableChoice, cap, unscoredFigures, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, sectorNotes, answerFor, splitItems, q, andList, capEcho, type BusinessModel } from './context.js';

export function generatePMFScorecard(args: {
  product: string;
  target_market: string;
  current_metrics: string;
  time_in_market?: string;
  customer_feedback?: string;
  business_model?: string;
}): string {
  const metrics = parseMetrics(args.current_metrics);
  const marketType = args.target_market || 'other';
  const maturity = args.time_in_market || '1_2_years';
  
  // Define benchmarks by market type
  const benchmarks: Record<string, Record<string, { low: number; medium: number; high: number }>> = {
    enterprise_saas: {
      churn: { low: 1, medium: 3, high: 5 },
      nps: { low: 30, medium: 50, high: 70 },
      ltvCac: { low: 2, medium: 3, high: 5 },
      retention: { low: 85, medium: 90, high: 95 },
      activation: { low: 40, medium: 60, high: 80 }
    },
    smb_saas: {
      churn: { low: 3, medium: 5, high: 8 },
      nps: { low: 25, medium: 40, high: 60 },
      ltvCac: { low: 2, medium: 3, high: 4 },
      retention: { low: 75, medium: 85, high: 92 },
      activation: { low: 30, medium: 50, high: 70 }
    },
    consumer: {
      churn: { low: 5, medium: 8, high: 12 },
      nps: { low: 20, medium: 35, high: 55 },
      ltvCac: { low: 1.5, medium: 2.5, high: 4 },
      retention: { low: 60, medium: 75, high: 85 },
      activation: { low: 20, medium: 40, high: 60 }
    },
    marketplace: {
      churn: { low: 4, medium: 7, high: 10 },
      nps: { low: 25, medium: 40, high: 55 },
      ltvCac: { low: 2, medium: 3, high: 5 },
      retention: { low: 65, medium: 80, high: 90 },
      activation: { low: 25, medium: 45, high: 65 }
    },
    fintech: {
      churn: { low: 2, medium: 4, high: 6 },
      nps: { low: 35, medium: 50, high: 70 },
      ltvCac: { low: 2.5, medium: 4, high: 6 },
      retention: { low: 80, medium: 90, high: 95 },
      activation: { low: 35, medium: 55, high: 75 }
    },
    other: {
      churn: { low: 3, medium: 5, high: 8 },
      nps: { low: 25, medium: 40, high: 60 },
      ltvCac: { low: 2, medium: 3, high: 4 },
      retention: { low: 70, medium: 82, high: 90 },
      activation: { low: 30, medium: 50, high: 70 }
    }
  };
  
  // Run 19 (D80, rule B82): a market choice with no example range of its own reuses an existing labelled range; no new benchmark
  // number is added. The answer says which range was used.
  const RANGE_FOR: Record<string, string> = { logistics_tech: 'enterprise_saas', vertical_saas: 'enterprise_saas', ai_native: 'enterprise_saas', software: 'enterprise_saas', cybersecurity: 'enterprise_saas', ites: 'other', telecom: 'other' };
  const rangeKey = benchmarks[marketType] ? marketType : (RANGE_FOR[marketType] || 'other');
  const b = benchmarks[rangeKey];
  const rangeNote = rangeKey === marketType
    ? `Benchmark ranges: the example ranges for the ${readableChoice(marketType)} market segment.`
    : `Benchmark ranges: the tool has no example ranges of its own for ${readableChoice(marketType)}, so it uses its ${rangeKey === 'other' ? 'generic (other)' : readableChoice(rangeKey)} example ranges. Replace them with your own.`;

  // The business model and the sector, read from the inputs (the hint from the market choice comes after business_model).
  const HINT: Record<string, BusinessModel> = { enterprise_saas: 'saas', smb_saas: 'saas', marketplace: 'marketplace', ites: 'services', telecom: 'connectivity' };
  const hint: BusinessModel | null = HINT[marketType] ?? (/\bmrr\b/i.test(args.current_metrics) ? 'saas' : null);
  const ctx = readContext({ model: args.business_model, hintModel: hint, vertical: marketType }, args.product, args.current_metrics, args.customer_feedback);
  // Activation measures the first use of a software subscription: it is not scored for services, connectivity or investment.
  const activationApplies = !(ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment');
  const dimensionCount = activationApplies ? 5 : 4;
  
  // Score each dimension
  const churnScore = scoreMetric(metrics.churn, b.churn, false);
  const npsScore = scoreMetric(metrics.nps, b.nps, true);
  const ltvCacScore = scoreMetric(metrics.ltvCacRatio, b.ltvCac, true, metrics.ltvCacRatio?.toFixed(1), 'x');
  const retentionScore = scoreMetric(metrics.retentionRate, b.retention, true, undefined, '%');
  const activationScore = scoreMetric(metrics.activationRate, b.activation, true, undefined, '%');
  
  // Calculate overall PMF score
  const scoredDimensions = [churnScore, npsScore, ltvCacScore, retentionScore, ...(activationApplies ? [activationScore] : [])]
    .filter(s => s.label !== 'MISSING');
  const overallScore = scoredDimensions.length > 0 
    ? Math.round(scoredDimensions.reduce((sum, s) => sum + s.score, 0) / scoredDimensions.length * 10) / 10
    : 0;
  
  // Determine PMF stage
  let pmfStage = 'Pre-PMF';
  let pmfAnalysis = '';
  if (overallScore >= 8) {
    pmfStage = 'Strong PMF';
    pmfAnalysis = 'Metrics indicate solid product-market fit. Focus on scaling.';
  } else if (overallScore >= 6) {
    pmfStage = 'Emerging PMF';
    pmfAnalysis = 'Good foundation but gaps to address before aggressive scaling.';
  } else if (overallScore >= 4) {
    pmfStage = 'Searching for PMF';
    pmfAnalysis = 'Significant gaps remain. Focus on product-market alignment.';
  } else {
    pmfAnalysis = 'Early stage: more data is needed, or a pivot if the numbers you have are weak.';
  }
  // Run 12 (R12-21): say how many dimensions the score rests on; with fewer than 3, the stage sentence becomes a caveat.
  // The stage name, the score and the thresholds above are unchanged.
  const basis = `Based on ${scoredDimensions.length} of ${dimensionCount} dimensions${activationApplies ? '' : ' (Activation is not applicable to this business model and is left out)'}.`;
  if (scoredDimensions.length === 0) {
    pmfAnalysis = 'Not scored yet: none of your metrics matched. Add the missing ones listed below.';
  } else if (scoredDimensions.length < 3) {
    pmfAnalysis = 'Too few metrics to judge fit yet: add the missing ones listed below.';
  }
  
  // Build actionable recommendations
  const recommendations: string[] = [];
  let suggestsCounts = false; // true when a recommendation suggests a count (needs the suggestion footer)
  const contract = ctx.model === 'services' || ctx.model === 'connectivity' || ctx.model === 'investment';
  if (churnScore.label === 'CRITICAL' || churnScore.label === 'DEVELOPING') {
    recommendations.push(contract
      ? 'CHURN: Interview the buyers of recent non-renewals, check service-level misses before each renewal, and name the owner of every at-risk contract'
      : 'CHURN: Implement churn prediction model, conduct exit interviews, improve onboarding');
  }
  if (npsScore.label === 'MISSING') {
    recommendations.push('NPS: Start measuring NPS now, a critical PMF signal');
  } else if (npsScore.score < 6) {
    recommendations.push('NPS: Focus on detractor feedback, address top 3 pain points');
    suggestsCounts = true;
  }
  if (ltvCacScore.label === 'MISSING') {
    recommendations.push('LTV:CAC: Calculate unit economics, essential for scaling decisions');
  } else if (ltvCacScore.score < 6) {
    recommendations.push(contract
      ? 'UNIT ECONOMICS: Either reduce the cost of winning a contract (shorter cycles, better qualification) or raise the value per contract (scope, renewals)'
      : 'UNIT ECONOMICS: Either reduce CAC (improve conversion) or increase LTV (upsell/retention)');
  }
  if (!activationApplies) {
    const sectorMetrics = ctx.v ? ` The sector's own measures include ${andList(ctx.v.metrics.slice(0, 3))}.` : '';
    recommendations.push(`ADOPTION: Activation is a software sign-up measure and does not apply to a ${readableChoice(ctx.model === 'investment' ? 'investment mandate' : ctx.model === 'connectivity' ? 'connectivity contract' : 'services contract')}. Track how much of the contracted service the customer uses and how fast it goes live.${sectorMetrics}`);
  } else if (activationScore.label === 'MISSING') {
    recommendations.push('ACTIVATION: Define and track the first action that shows a customer got value (your activation event)');
  } else if (activationScore.score < 6) {
    recommendations.push('ACTIVATION: Improve time-to-value, simplify onboarding, remove friction');
  }
  
  // Run 19 (D80, problem 3): every feedback theme you give is quoted and answered; none is only scanned for keywords.
  const feedbackItems = splitItems(args.customer_feedback);
  const POSITIVE = /\b(love|loves|loved|like|likes|liked|great|essential|happy|praise|trust|reliable|fast)\b/i;
  const NEGATIVE = /\b(but|however|wish|struggle|struggles|struggled|late|slow|confus\w*|difficult|complex|missing|lack|lacks|problem|problems|issue|issues|frustrat\w*|longer|not synced|will not|won't|cannot|can't|hard)\b/i;
  const feedbackRows = feedbackItems.map((item) => {
    const pos = POSITIVE.test(item); const neg = NEGATIVE.test(item);
    const signal = pos && neg ? 'Mixed' : neg ? 'Friction' : pos ? 'Positive' : 'Note';
    const next = signal === 'Positive'
      ? `Turn it into proof: ask for a number or a reference. ${ctx.v ? 'A proof point that lands here: ' + ctx.v.proofShape : ''}`.trim()
      : answerFor(item, ctx.v);
    return `| ${q(item)} | ${signal} | ${next} |`;
  });
  const feedbackAnalysis = feedbackRows.length
    ? `| Feedback (as you wrote it) | Signal | Next step |\n|---|---|---|\n${feedbackRows.join('\n')}`
    : '';
  const unscored = unscoredFigures(args.current_metrics);
  const productHead = capEcho(args.product, 120);

  // Every benchmark below is an example figure: the column header carries the block label.
  const dimensionHeader = `| Metric | Your Value | Score | Benchmark (${EXAMPLE_FIGURES.replace(/\.$/, '')}) | Status |`;

  return `# Product-Market Fit Scorecard
## ${productHead.short}

${productHead.capped ? `**Product (as you wrote it):** ${args.product.trim()}\n\n` : ''}**Market Segment:** ${cap(readableChoice(marketType))}
**Time in Market:** ${describeChoice(args.time_in_market, maturity)}
**Analysis Date:** ${new Date().toISOString().split('T')[0]}

${ctx.line}

---

## Overall PMF Assessment

| Stage | Score | Status |
|-------|-------|--------|
| **${pmfStage}** | **${overallScore}/10** | ${overallScore >= 7 ? 'Yes' : overallScore >= 5 ? 'Note' : 'No'} |

${basis}
${pmfAnalysis}
The score is the average of the dimensions scored below (missing data is left out), each judged against an example benchmark.

---

## Dimension Scores

Each score and status compares your value with an example benchmark. ${rangeNote}

### 1. Customer Retention (Churn)
${dimensionHeader}
|--------|-----------|-------|-----------|--------|
| Monthly Churn | ${metrics.churn !== undefined ? metrics.churn + '%' : 'NOT PROVIDED'} | ${churnScore.score}/10 | <${b.churn.medium}% target | ${churnScore.label} |

**Analysis:** ${churnScore.analysis}

---

### 2. Customer Satisfaction (NPS)
${dimensionHeader}
|--------|-----------|-------|-----------|--------|
| NPS Score | ${metrics.nps !== undefined ? metrics.nps : 'NOT PROVIDED'} | ${npsScore.score}/10 | >${b.nps.medium} target | ${npsScore.label} |

**Analysis:** ${npsScore.analysis}

---

### 3. Unit Economics (LTV:CAC)
${dimensionHeader}
|--------|-----------|-------|-----------|--------|
| LTV | ${metrics.ltv !== undefined ? '$' + metrics.ltv.toLocaleString('en-US') : 'NOT PROVIDED'} | - | - | - |
| CAC | ${metrics.cac !== undefined ? '$' + metrics.cac.toLocaleString('en-US') : 'NOT PROVIDED'} | - | - | - |
| LTV:CAC Ratio | ${metrics.ltvCacRatio !== undefined ? metrics.ltvCacRatio.toFixed(1) + 'x' : 'NOT PROVIDED'} | ${ltvCacScore.score}/10 | >${b.ltvCac.medium}x target | ${ltvCacScore.label} |

**Analysis:** ${ltvCacScore.analysis}

---

### 4. Revenue Retention
${dimensionHeader}
|--------|-----------|-------|-----------|--------|
| ${metrics.retentionIsNet ? 'Net Revenue Retention' : 'Retention Rate'} | ${metrics.retentionRate !== undefined ? metrics.retentionRate + '%' : 'NOT PROVIDED'} | ${retentionScore.score}/10 | >${b.retention.medium}% target | ${retentionScore.label} |

**Analysis:** ${retentionScore.analysis}

---

### 5. Activation
${activationApplies ? `${dimensionHeader}
|--------|-----------|-------|-----------|--------|
| Activation Rate | ${metrics.activationRate !== undefined ? metrics.activationRate + '%' : 'NOT PROVIDED'} | ${activationScore.score}/10 | >${b.activation.medium}% target | ${activationScore.label} |

**Analysis:** ${activationScore.analysis}` : `**Not applicable to this business model.** Activation measures how soon a new software customer reaches first value. It is not scored here and is left out of the average.${metrics.activationRate !== undefined ? ` You gave an activation figure of ${metrics.activationRate}%: it is shown but not scored.` : ''}`}

---

## Additional Metrics Detected

${(() => { const rows = `${metrics.mrr !== undefined ? `| MRR | $${metrics.mrr.toLocaleString('en-US')} | Monthly Recurring Revenue |\n` : ''}${metrics.arr !== undefined ? `| ARR | $${metrics.arr.toLocaleString('en-US')} | Annual Recurring Revenue |\n` : ''}${metrics.acv !== undefined ? `| ACV | $${metrics.acv.toLocaleString('en-US')} | Annual contract value (your figure; not scored, shown for reference) |\n` : ''}${metrics.dau !== undefined ? `| DAU | ${metrics.dau.toLocaleString('en-US')} | Daily Active Users |\n` : ''}${metrics.mau !== undefined ? `| MAU | ${metrics.mau.toLocaleString('en-US')} | Monthly Active Users |\n` : ''}${metrics.dauMauRatio !== undefined ? `| DAU/MAU | ${(metrics.dauMauRatio * 100).toFixed(1)}% | Stickiness ratio |\n` : ''}${metrics.trialConversion !== undefined ? `| Trial Conversion | ${metrics.trialConversion}% | Trial to paid rate |\n` : ''}${metrics.revenueGrowth !== undefined ? `| Revenue Growth | ${metrics.revenueGrowth}% | MoM or YoY growth |\n` : ''}`; return rows.trim() ? `| Metric | Value | Notes |\n|--------|-------|-------|\n${rows}` : 'None found in your text (MRR, ARR, ACV, DAU, MAU, trial conversion or revenue growth).\n'; })()}

${unscored.length ? `**Not scored (no rule reads these figures):** ${unscored.map((x) => q(x)).join('; ')}. This scorecard scores ${andList(['churn', 'NPS', 'LTV:CAC', 'retention', ...(activationApplies ? ['activation'] : [])])} only: compare these figures with your own targets.\n` : ''}
${feedbackAnalysis ? `---\n\n## Customer Feedback You Gave\n\n${feedbackAnalysis}\n` : ''}
---

## Priority Actions

${recommendations.length > 0 ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n') : 'All dimensions scoring well: focus on scaling.'}

---

${ctx.v ? `## Sector Reading\n\n${sectorNotes(ctx.v, 'metrics')}\n\n---\n\n` : ''}## Data Gaps to Fill

${[
  metrics.churn === undefined ? '- [ ] Churn rate (monthly or annual)' : null,
  metrics.nps === undefined ? '- [ ] NPS score (survey customers)' : null,
  metrics.ltv === undefined ? '- [ ] Customer LTV calculation' : null,
  metrics.cac === undefined ? '- [ ] Customer Acquisition Cost' : null,
  metrics.retentionRate === undefined ? '- [ ] Retention/renewal rate' : null,
  activationApplies && metrics.activationRate === undefined ? '- [ ] Activation rate (the first action that shows a customer got value)' : null
].filter(Boolean).join('\n') || 'All critical metrics provided!'}

---

*Scorecard generated using the CRAFT GTM framework*
*${rangeNote} Time in market${args.time_in_market ? ` (${readableChoice(args.time_in_market)})` : ''} does not change the benchmarks or scores.*${suggestsCounts ? `\n\n${SUGGESTION_FOOTER}` : ''}`;
}
