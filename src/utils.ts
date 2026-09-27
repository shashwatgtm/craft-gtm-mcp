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

// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer no-shows" becomes "fewer no-shows"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set((
  'a an the this that these those our your their my its his her we you they it me us them all any each every ' +
  'both either neither no not none some many much more most less least fewer few several other another such ' +
  'same own only just even also still very too so as than then there here what which who whom whose when where ' +
  'why how whether if because while until unless though although since once after before during about above ' +
  'across against along among around at by for from in into inside near of off on onto out outside over past ' +
  'per through throughout to toward towards under underneath up upon via with within without is are was were be ' +
  'been being am do does did done doing have has had having can could will would shall should may might must ' +
  'need needs needed get gets got getting give gives gave make makes made let lets keep keeps put puts take ' +
  'takes took see sees show shows find finds know knows think go goes going come comes one two three four five ' +
  'six seven eight nine ten first second third last next new old big small large tiny long short high low full ' +
  'half whole top bottom early late fast faster fastest quick quicker quickest slow slower easy easier easiest ' +
  'simple simpler hard harder better best good great strong stronger weak weaker clear clearer real true right ' +
  'wrong free open closed live smart smarter lean cheaper cheap safe safer secure accurate reliable consistent ' +
  'predictable visible instant instantly automatic automatically manual custom modern legacy digital online ' +
  'offline mobile remote local global central single multiple multi daily weekly monthly quarterly yearly ' +
  'annual real-time realtime end self self-serve self-service one-tap one-click two-way no-code low-code always ' +
  'never often sometimes usually now today tomorrow soon yet again ever already almost nearly exactly directly ' +
  'fully truly entirely highly deeply readily cut cuts reduce reduces reduction lower lowers raise raises boost ' +
  'boosts grow grows growth increase increases improve improves save saves saving savings win wins earn earns ' +
  'drive drives drove speed speeds scale scales help helps support supports enable enables deliver delivers ' +
  'offer offers provide provides build builds create creates launch launches ship ships track tracks measure ' +
  'measures manage manages plan plans run runs start starts stop stops ends avoid avoids prevent prevents ' +
  'remove removes replace replaces fix fixes solve solves close closes book books send sends share shares sync ' +
  'syncs connect connects integrate integrates automate automates simplify simplifies streamline streamlines ' +
  'centralise centralize unify unifies align aligns turn turns spend spends lose loses miss misses waste wastes ' +
  'struggle struggles fail fails hit hits meet meets reach reaches use uses sell sells buy buys pay pays charge ' +
  'charges hire hires onboard onboards train trains coach coaches forecast forecasts prioritise prioritize ' +
  'qualify qualifies convert converts retain retains renew renews expand expands upsell engage engages nurture ' +
  'nurtures personalise personalize target targets segment segments score scores rank ranks route routes assign ' +
  'assigns approve approves review reviews report reports alert alerts notify notifies remind reminds schedule ' +
  'schedules reschedule reschedules capture captures collect collects clean cleans enrich enriches verify ' +
  'verifies protect protects comply complies audit audits monitor monitors test tests learn learns understand ' +
  'understands explain explains answer answers ask asks call calls email emails text texts chat message ' +
  'messages post posts publish publishes write writes read reads edit edits search searches data insights ' +
  'insight analytics reporting dashboards dashboard pipeline pipelines revenue revenues sales marketing success ' +
  'service services product products platform platforms software tool tools app apps system systems process ' +
  'processes workflow workflows team teams people customers customer clients client users user buyers buyer ' +
  'prospects prospect leads lead accounts account deals deal opportunities opportunity contracts contract ' +
  'renewals renewal churn retention onboarding adoption activation engagement conversion conversions demand ' +
  'cost costs price prices pricing budget budgets value roi time times hours days weeks months minutes setup ' +
  'set-up implementation integration integrations security compliance privacy risk risks errors error mistakes ' +
  'issues issue problems problem pain pains gaps gap delays delay bottlenecks friction complexity visibility ' +
  'control access approvals approval handoffs handoff meetings meeting appointments appointment bookings ' +
  'booking reminders reminder no-shows cancellations patients patient staff employees employee managers manager ' +
  'leaders leader executives reps rep agents agent partners partner vendors vendor suppliers supplier companies ' +
  'company businesses business organisations organizations enterprises enterprise startups startup founders ' +
  'founder owners owner operations operators finance hr legal procurement engineering developers developer ' +
  'admins admin inbound outbound content campaigns campaign ads events event webinars webinar messaging ' +
  'positioning brand trust quality accuracy efficiency productivity performance results outcomes outcome impact ' +
  'coverage capacity forecasting planning scheduling tracking billing invoicing payments payment payroll hiring ' +
  'recruiting training coaching selling buying spending waiting missing losing paper spreadsheets spreadsheet ' +
  'phone inboxes inbox documents document files file forms form tasks task projects project orders order ' +
  'inventory shipping delivery deliveries returns tickets ticket cases case questions question requests request ' +
  'feedback surveys survey notes note records record lists list numbers number figures figure metrics metric ' +
  'goals goal quotas quota territory territories regions region markets market industry industries verticals ' +
  'vertical category categories competitors competitor alternatives alternative options option features feature ' +
  'modules module add-ons tiers tier seats seat licenses license usage traffic visits visitors signups signup ' +
  'trials trial demos demo proposals proposal quotes quote invoices invoice common key main core major minor ' +
  'basic advanced practical proven essential critical important urgent hidden obvious step steps step-by-step ' +
  'approach approaches guide guides framework frameworks strategy strategies playbook playbooks checklist ' +
  'checklists practice practices trend trends future state lesson lessons tip tips way ways idea ideas reason ' +
  'reasons sign signs rule rules example examples mistake myth myths truth truths secret secrets habit habits ' +
  'principle principles pattern patterns everything nothing something anything everyone nobody someone work ' +
  'world life thing things part parts point points story stories change changes shift shifts move moves loss ' +
  'losses level levels stage stages phase phases week month year day higher bigger smaller larger shorter ' +
  'longer greater happier healthier cleaner smooth smoother seamless effortless painless hassle-free ' +
  'frictionless repeatable scalable flexible affordable transparent unified zero unlimited endless entire ' +
  'complete total actionable measurable shorten shortens stay stays handle handles prove proves focus focuses ' +
  'switch switches eliminate eliminates minimise minimize maximise maximize accelerate accelerates ensure ' +
  'ensures empower empowers unlock unlocks discover discovers spot spots catch catches detect detects predict ' +
  'predicts recover recovers resolve resolves respond responds reply replies follow follows hear hears worst ' +
  'lost won '
).split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "No-shows").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// An input phrase placed mid-sentence: its first word is lowered only when it is a common word.
export function lowerFirstIfCommon(phrase: string): string {
  const t = phrase.trim();
  const first = t.split(/\s+/)[0] || '';
  return isCommonWord(first) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
// The same for every word of a phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms).
// A capitalised word straight after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
export function lowerCommonWords(phrase: string): string {
  let afterName = false;
  return phrase.trim().split(/(\s+)/).map(w => {
    if (!w.trim()) return w;
    const lower = !afterName && isCommonWord(w);
    afterName = !lower && /^[A-Z]/.test(w);
    return lower ? w.charAt(0).toLowerCase() + w.slice(1) : w;
  }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
export function cap(phrase: string): string {
  const t = phrase.trim();
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
  win_loss: 'win/loss',
  // Text only (run 9): acronyms keep their capitals.
  saas: 'SaaS',
  enterprise_saas: 'enterprise SaaS',
  smb_saas: 'SMB SaaS',
  saas_subscription: 'SaaS subscription'
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
  const mrrMatch = text.match(/\bmrr[:\s]*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/i);
  if (mrrMatch) {
    let value = parseFloat(mrrMatch[1].replace(/,/g, ''));
    if (mrrMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (mrrMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.mrr = value;
  }
  
  const arrMatch = text.match(/\barr[:\s]*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/i);
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
  // Run 7: also read the figure when it comes first, as in "-12% revenue growth".
  const growthMatch = text.match(/(?:revenue\s*)?growth[:\s]*([-\u2212]?\s*[\d.]+)\s*%?/i) || text.match(/([-\u2212]?\d[\d.]*)\s*%\s*(?:revenue\s*)?growth/i);
  if (growthMatch) {
    metrics.revenueGrowth = parseFloat(growthMatch[1].replace(/[\u2212\s]/g, (c) => (c === '\u2212' ? '-' : '')));
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
    if (value >= benchmarks.high) return { score: 9, label: 'EXCELLENT', analysis: `${v} is at or above the excellent mark of ${benchmarks.high} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.medium) return { score: 7, label: 'GOOD', analysis: `${v} meets healthy benchmark of ${benchmarks.medium} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.low) return { score: 5, label: 'DEVELOPING', analysis: `${v} is below target of ${benchmarks.medium} ${EXAMPLE_FIGURE}` };
    return { score: 3, label: 'CRITICAL', analysis: `${v} is significantly below minimum of ${benchmarks.low} ${EXAMPLE_FIGURE}` };
  } else {
    if (value <= benchmarks.low) return { score: 9, label: 'EXCELLENT', analysis: `${v}% is at or below the excellent mark of ${benchmarks.low}% ${EXAMPLE_FIGURE}` };
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
    .split(/\n|,(?!\d{3}(?!\d))/)
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
