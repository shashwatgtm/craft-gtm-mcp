// ============================================================================
// UTILITY FUNCTIONS - Metric Parsing & Analysis
// ============================================================================

// ----------------------------------------------------------------------------
// Output labels. A figure that is neither the user's input nor computed only
// from it is labelled as an example, so no invented figure reads as a fact.
// ----------------------------------------------------------------------------

/** Inline label: on the same line as the example figure. */
export const EXAMPLE_FIGURE = '(Example figure: replace with your own)';
/** Block label: a line of its own directly above a table or list of example figures. */
export const EXAMPLE_FIGURES = 'Example figures: replace with your own.';
/** Footer for any output that suggests timings, lengths or counts. */
export const SUGGESTION_FOOTER = 'Suggested timings, lengths and counts: adjust them to your own.';

// Readable forms of enum values that carry digits or abbreviations.
const READABLE_CHOICES: Record<string, string> = {
  pre_launch: 'pre-launch',
  '0_6_months': '0 to 6 months',
  '6_12_months': '6 to 12 months',
  '1_2_years': '1 to 2 years',
  '2_plus_years': '2+ years',
  small_2_5: 'small (2 to 5)',
  medium_6_15: 'medium (6 to 15)',
  large_15_plus: 'large (15+)',
  well_funded: 'well funded',
  no_dedicated_cs: 'no dedicated CS',
  small_1_3: 'small (1 to 3)',
  medium_4_10: 'medium (4 to 10)',
  large_10_plus: 'large (10+)',
  startup_under_50: 'startup (under 50)',
  scaleup_50_200: 'scale-up (50 to 200)',
  midsize_200_1000: 'mid-size (200 to 1,000)',
  enterprise_1000_plus: 'enterprise (1,000+)',
  b2b_enterprise: 'B2B enterprise',
  b2b_smb: 'B2B SMB',
  b2c_consumer: 'B2C consumer',
  high_pii_financial: 'high (PII, financial)',
  medium_business_data: 'medium (business data)',
  low_general: 'low (general)',
  minimal_self_serve: 'minimal (self-serve)',
  high_touch: 'high touch',
  win_loss: 'win/loss'
};

/** Readable form of an enum value: "small_2_5" becomes "small (2 to 5)"; other values lose their underscores. */
export function readableChoice(value: string): string {
  return READABLE_CHOICES[value] ?? value.replace(/_/g, ' ');
}

/** The user's choice in readable form or, when it was not supplied, the value the tool assumes, marked as assumed. */
export function describeChoice(supplied: string | undefined, assumed: string): string {
  if (supplied) return readableChoice(supplied);
  const shown = readableChoice(assumed);
  return /\d/.test(shown)
    ? `${shown} (assumed, not supplied) ${EXAMPLE_FIGURE}`
    : `${shown} (assumed, not supplied)`;
}

export interface ParsedMetrics {
  mrr?: number;
  arr?: number;
  churn?: number;
  nps?: number;
  cac?: number;
  ltv?: number;
  ltvCacRatio?: number;
  retentionRate?: number;
  activationRate?: number;
  referralRate?: number;
  revenueGrowth?: number;
  dau?: number;
  mau?: number;
  dauMauRatio?: number;
  trialConversion?: number;
  expansionRevenue?: number;
  timeToValue?: number;
  raw: string;
}

export function parseMetrics(metricsText: string): ParsedMetrics {
  const metrics: ParsedMetrics = { raw: metricsText };
  const text = metricsText.toLowerCase();
  
  // MRR/ARR parsing
  const mrrMatch = text.match(/mrr[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(k|m)?/i);
  if (mrrMatch) {
    let value = parseFloat(mrrMatch[1].replace(/,/g, ''));
    if (mrrMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (mrrMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.mrr = value;
  }
  
  const arrMatch = text.match(/arr[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(k|m)?/i);
  if (arrMatch) {
    let value = parseFloat(arrMatch[1].replace(/,/g, ''));
    if (arrMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (arrMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.arr = value;
  }
  
  // Churn rate
  const churnMatch = text.match(/churn[:\s]*([\d.]+)\s*%?/i);
  if (churnMatch) {
    metrics.churn = parseFloat(churnMatch[1]);
  }
  
  // NPS
  const npsMatch = text.match(/nps[:\s]*([+-]?\d+)/i);
  if (npsMatch) {
    metrics.nps = parseInt(npsMatch[1]);
  }
  
  // CAC
  const cacMatch = text.match(/cac[:\s]*\$?([\d,]+(?:\.\d+)?)/i);
  if (cacMatch) {
    metrics.cac = parseFloat(cacMatch[1].replace(/,/g, ''));
  }
  
  // LTV
  const ltvMatch = text.match(/ltv[:\s]*\$?([\d,]+(?:\.\d+)?)/i);
  if (ltvMatch) {
    metrics.ltv = parseFloat(ltvMatch[1].replace(/,/g, ''));
  }
  
  // Calculate LTV:CAC ratio if both present
  if (metrics.ltv && metrics.cac && metrics.cac > 0) {
    metrics.ltvCacRatio = metrics.ltv / metrics.cac;
  }
  
  // Retention rate
  const retentionMatch = text.match(/retention[:\s]*([\d.]+)\s*%?/i);
  if (retentionMatch) {
    metrics.retentionRate = parseFloat(retentionMatch[1]);
  }
  
  // Activation rate
  const activationMatch = text.match(/activation[:\s]*([\d.]+)\s*%?/i);
  if (activationMatch) {
    metrics.activationRate = parseFloat(activationMatch[1]);
  }
  
  // Referral rate
  const referralMatch = text.match(/referral[:\s]*([\d.]+)\s*%?/i);
  if (referralMatch) {
    metrics.referralRate = parseFloat(referralMatch[1]);
  }
  
  // Revenue growth
  const growthMatch = text.match(/(?:revenue\s*)?growth[:\s]*([\d.]+)\s*%?/i);
  if (growthMatch) {
    metrics.revenueGrowth = parseFloat(growthMatch[1]);
  }
  
  // DAU/MAU
  const dauMatch = text.match(/dau[:\s]*([\d,]+)/i);
  if (dauMatch) {
    metrics.dau = parseInt(dauMatch[1].replace(/,/g, ''));
  }
  
  const mauMatch = text.match(/mau[:\s]*([\d,]+)/i);
  if (mauMatch) {
    metrics.mau = parseInt(mauMatch[1].replace(/,/g, ''));
  }
  
  if (metrics.dau && metrics.mau && metrics.mau > 0) {
    metrics.dauMauRatio = metrics.dau / metrics.mau;
  }
  
  // Trial conversion
  const trialMatch = text.match(/trial\s*(?:conversion|to\s*paid)[:\s]*([\d.]+)\s*%?/i);
  if (trialMatch) {
    metrics.trialConversion = parseFloat(trialMatch[1]);
  }
  
  // Expansion revenue
  const expansionMatch = text.match(/expansion[:\s]*([\d.]+)\s*%?/i);
  if (expansionMatch) {
    metrics.expansionRevenue = parseFloat(expansionMatch[1]);
  }
  
  return metrics;
}

export function scoreMetric(value: number | undefined, benchmarks: { low: number; medium: number; high: number }, higherIsBetter: boolean = true, shown?: string): { score: number; label: string; analysis: string } {
  if (value === undefined) {
    return { score: 0, label: 'MISSING', analysis: 'Data not provided - unable to score' };
  }
  // How the value is printed (the score always uses the exact value)
  const v = shown ?? String(value);

  // The benchmark figures are the tool's example ranges, so each one is labelled.
  if (higherIsBetter) {
    if (value >= benchmarks.high) return { score: 9, label: 'EXCELLENT', analysis: `${v} exceeds benchmark of ${benchmarks.high} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.medium) return { score: 7, label: 'GOOD', analysis: `${v} meets healthy benchmark of ${benchmarks.medium} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.low) return { score: 5, label: 'DEVELOPING', analysis: `${v} is below target of ${benchmarks.medium} ${EXAMPLE_FIGURE}` };
    return { score: 3, label: 'CRITICAL', analysis: `${v} is significantly below minimum of ${benchmarks.low} ${EXAMPLE_FIGURE}` };
  } else {
    if (value <= benchmarks.low) return { score: 9, label: 'EXCELLENT', analysis: `${v}% is below target of ${benchmarks.low}% ${EXAMPLE_FIGURE}` };
    if (value <= benchmarks.medium) return { score: 7, label: 'GOOD', analysis: `${v}% is acceptable (benchmark: <${benchmarks.medium}%) ${EXAMPLE_FIGURE}` };
    if (value <= benchmarks.high) return { score: 5, label: 'DEVELOPING', analysis: `${v}% is elevated against the example benchmark - needs attention` };
    return { score: 3, label: 'CRITICAL', analysis: `${v}% significantly exceeds maximum of ${benchmarks.high}% ${EXAMPLE_FIGURE}` };
  }
}

export function calculateDaysUntil(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function parseListItems(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map(item => item.replace(/^[-•*]\s*/, '').trim())
    .filter(item => item.length > 0);
}

export interface CRAFTAnalysis {
  character: { found: string[]; score: number; gaps: string[] };
  result: { found: string[]; score: number; gaps: string[] };
  artifact: { found: string[]; score: number; gaps: string[] };
  frame: { found: string[]; score: number; gaps: string[] };
  timeline: { found: string[]; score: number; gaps: string[] };
}

export function analyzeCRAFTDimensions(content: string): CRAFTAnalysis {
  const analysis: CRAFTAnalysis = {
    character: { found: [], score: 0, gaps: [] },
    result: { found: [], score: 0, gaps: [] },
    artifact: { found: [], score: 0, gaps: [] },
    frame: { found: [], score: 0, gaps: [] },
    timeline: { found: [], score: 0, gaps: [] }
  };
  
  const lines = content.split('\n');
  
  // CHARACTER patterns
  const rolePatterns = [
    /\b(marketing|sales|product|engineering|cs|customer success|growth|content|demand gen|ops)\s*(manager|director|lead|head|vp|chief|team|specialist)/gi,
    /\b(cmo|ceo|cto|coo|cro|vp|director|manager|lead|owner)\b/gi,
    /\bresponsible\s+(?:for|party|team|person)\b/gi,
    /\b(?:who|team|person|role)\s+(?:will|should|must|owns|executes|leads)\b/gi,
    /\bowner[:\s]/gi,
    /\braci\b/gi
  ];
  
  for (const line of lines) {
    for (const pattern of rolePatterns) {
      const matches = line.match(pattern);
      if (matches) {
        analysis.character.found.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  analysis.character.score = Math.min(10, analysis.character.found.length * 2 + (analysis.character.found.length > 0 ? 4 : 0));
  if (analysis.character.found.length === 0) {
    analysis.character.gaps.push('No clear role/owner identified');
    analysis.character.gaps.push('Add: "Owner: [Role/Name]" or "Responsible: [Team]"');
  } else if (analysis.character.found.length < 2) {
    analysis.character.gaps.push('Consider adding RACI matrix for complex initiatives');
  }
  
  // RESULT patterns
  const resultPatterns = [
    /\b(kpi|metric|goal|target|objective|okr|success\s*criteria)\b/gi,
    /\b(increase|decrease|improve|reduce|achieve|reach|hit)\s+\d+/gi,
    /\d+%?\s*(increase|decrease|improvement|reduction|growth)/gi,
    /\$[\d,]+\s*(revenue|arr|mrr|pipeline|savings)/gi,
    /\b(roi|conversion|retention|churn|nps|csat)\s*[:\s]*\d+/gi
  ];
  
  for (const line of lines) {
    for (const pattern of resultPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        analysis.result.found.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  analysis.result.score = Math.min(10, analysis.result.found.length * 2 + (analysis.result.found.length > 0 ? 4 : 0));
  if (analysis.result.found.length === 0) {
    analysis.result.gaps.push('No measurable outcomes defined');
    analysis.result.gaps.push('Add: Specific KPIs with target numbers');
    analysis.result.gaps.push(`Example: "Goal: Increase MQLs by 30% in Q1" ${EXAMPLE_FIGURE}`);
  } else if (analysis.result.found.length < 3) {
    analysis.result.gaps.push('Consider adding leading and lagging indicators');
  }
  
  // ARTIFACT patterns
  const artifactPatterns = [
    /\b(deliverable|output|create|produce|build|develop|launch|publish|ship)\b/gi,
    /\b(document|report|dashboard|playbook|template|guide|framework|tool)\b/gi,
    /\b(campaign|content|asset|material|collateral|deck|presentation)\b/gi,
    /\b(website|landing\s*page|email|blog|video|webinar|event)\b/gi
  ];
  
  for (const line of lines) {
    for (const pattern of artifactPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        analysis.artifact.found.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  analysis.artifact.score = Math.min(10, analysis.artifact.found.length + (analysis.artifact.found.length > 0 ? 4 : 0));
  if (analysis.artifact.found.length === 0) {
    analysis.artifact.gaps.push('No clear deliverables specified');
    analysis.artifact.gaps.push('Add: List of specific outputs/artifacts');
  }
  
  // FRAME patterns
  const framePatterns = [
    /\b(audience|persona|icp|segment|target\s*market|buyer)\b/gi,
    /\b(constraint|limitation|scope|boundary|requirement|assumption)\b/gi,
    /\b(budget|resource|headcount|bandwidth|capacity)\b/gi,
    /\b(context|background|situation|current\s*state)\b/gi,
    /\bfor\s+(enterprise|smb|mid-market|startup|b2b|b2c)/gi
  ];
  
  for (const line of lines) {
    for (const pattern of framePatterns) {
      const matches = line.match(pattern);
      if (matches) {
        analysis.frame.found.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  analysis.frame.score = Math.min(10, analysis.frame.found.length + (analysis.frame.found.length > 0 ? 4 : 0));
  if (analysis.frame.found.length === 0) {
    analysis.frame.gaps.push('No audience or constraints defined');
    analysis.frame.gaps.push('Add: Target audience, budget, resources available');
  }
  
  // TIMELINE patterns
  const timelinePatterns = [
    /\b(q[1-4]|quarter|month|week|day|year)\s*\d*/gi,
    /\b(deadline|due|by|until|milestone|phase|sprint)\b/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d*/gi,
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
    /\b(timeline|schedule|roadmap|plan|calendar)\b/gi
  ];
  
  for (const line of lines) {
    for (const pattern of timelinePatterns) {
      const matches = line.match(pattern);
      if (matches) {
        analysis.timeline.found.push(...matches.map(m => m.trim()));
      }
    }
  }
  
  analysis.timeline.score = Math.min(10, analysis.timeline.found.length * 2 + (analysis.timeline.found.length > 0 ? 4 : 0));
  if (analysis.timeline.found.length === 0) {
    analysis.timeline.gaps.push('No timeline or deadlines specified');
    analysis.timeline.gaps.push('Add: Specific dates, phases, or milestones');
  }
  
  return analysis;
}
