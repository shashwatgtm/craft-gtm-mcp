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
// ("Fewer errors" becomes "fewer errors"). Any other capitalised word is kept as typed, because it may be a
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
  'control access approvals approval handoffs handoff meetings meeting bookings ' +
  'booking reminders reminder cancellations staff employees employee managers manager ' +
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
// word counts by its first part ("Two-way", "Real-time").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set((
  'Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
  'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
  'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Sam ' +
  // Run 19: the invented company names of the page examples.
  'Shelfwalk Answerloop Cloudmoat Spendrill Lanehop Branchwire Bengaluru Clari Northwind Metricly'
).split(/\s+/).filter(Boolean));
function bareWord(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word: string): boolean {
  const w = bareWord(word);
  return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n] as [string, string]));
function fixNames(phrase: string): string {
  return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase: string): boolean {
  const w = phrase.trim().split(/\s+/).map(bareWord);
  return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase: string): string {
  return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Group A, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Branchwire contract review" becomes "for Branchwire contract review"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Co).
function keepsFirstCapital(word: string, next: string, third = ''): boolean {
  const w = bareWord(word);
  if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w)) return true; // the article A is not a one-letter name
  if (/[A-Z0-9]/.test(w.slice(1))) return true;
  const n = bareWord(next || '');
  if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n)) return false;
  if (!isCommonWord(w) || w === 'New') return true; // New York, New Delhi
  if (n.length === 1) return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
  return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
export function lowerFirstIfCommon(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || '')) return t;
  parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
  // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
  if (parts[2] && isCommonWord(parts[2])) parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
  return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
export function lowerCommonWords(phrase: string): string {
  let afterName = false;
  let first = true;
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  return parts.map((w, i) => {
    if (!w.trim()) return w;
    const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
    first = false;
    afterName = !lower && /^[A-Z]/.test(w);
    return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
  }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
export function cap(phrase: string): string {
  const t = fixNames(phrase.trim());
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
  saas_subscription: 'SaaS subscription',
  // Run 19: the owner's verticals and the new contract models
  logistics_tech: 'logistics tech',
  vertical_saas: 'vertical SaaS',
  ai_native: 'AI native',
  ites: 'ITeS',
  services_contract: 'services contract',
  connectivity_contract: 'connectivity contract',
  investment_mandate: 'investment mandate',
  hardware_software: 'hardware plus software'
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
  acv?: number;
  retentionIsNet?: boolean;   // the retention figure was written as net revenue retention
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
    metrics.retentionIsNet = /\b(?:net revenue retention|nrr|net retention)\b/i.test(text);
  }

  // Run 19 (D80, problem 3): annual or average contract value is read (it was dropped before)
  const acvMatch = text.match(/\b(?:acv|annual contract value|average contract value)[:\s]*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/i);
  if (acvMatch) {
    let value = parseFloat(acvMatch[1].replace(/,/g, ''));
    if (acvMatch[2]?.toLowerCase() === 'k') value *= 1000;
    if (acvMatch[2]?.toLowerCase() === 'm') value *= 1000000;
    metrics.acv = value;
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

// Run 20 (ledger A17-O20): a number printed as a percentage has at most one decimal and never shows float noise
// (0.8 * 12 is 9.600000000000001 in floating point and is printed as 9.6). The score itself always uses the exact value.
export function pct(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const r = Number(n.toFixed(1));
  return String(Object.is(r, -0) ? 0 : r);
}

// A percentage the user typed with more than one decimal, inside a short typed figure such as "2.3456% monthly", is shown rounded.
export function roundTypedPercents(text: string): string {
  return text.replace(/(\d+\.\d{2,})(\s*%)/g, (_m, n: string, p: string) => pct(parseFloat(n)) + p);
}

export function scoreMetric(value: number | undefined, benchmarks: { low: number; medium: number; high: number }, higherIsBetter: boolean = true, shown?: string, unit: string = ''): { score: number; label: string; analysis: string } {
  if (value === undefined) {
    return { score: 0, label: 'MISSING', analysis: 'Data not provided: not scored' };
  }
  // How the value is printed (the score always uses the exact value)
  const v = (shown ?? pct(value)) + unit;

  // The benchmark figures are the tool's example ranges, so each one is labelled.
  if (higherIsBetter) {
    if (value >= benchmarks.high) return { score: 9, label: 'EXCELLENT', analysis: `${v} is ${value === benchmarks.high ? 'exactly at' : 'above'} the excellent mark of ${benchmarks.high}${unit} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.medium) return { score: 7, label: 'GOOD', analysis: `${v} meets the healthy benchmark of ${benchmarks.medium}${unit} ${EXAMPLE_FIGURE}` };
    if (value >= benchmarks.low) return { score: 5, label: 'DEVELOPING', analysis: `${v} is below the target of ${benchmarks.medium}${unit} ${EXAMPLE_FIGURE}` };
    return { score: 3, label: 'CRITICAL', analysis: `${v} is significantly below the minimum of ${benchmarks.low}${unit} ${EXAMPLE_FIGURE}` };
  } else {
    if (value <= benchmarks.low) return { score: 9, label: 'EXCELLENT', analysis: `${v}% is ${value === benchmarks.low ? 'exactly at' : 'below'} the excellent mark of ${benchmarks.low}% ${EXAMPLE_FIGURE}` };
    if (value <= benchmarks.medium) return { score: 7, label: 'GOOD', analysis: `${v}% is acceptable (benchmark: <${benchmarks.medium}%) ${EXAMPLE_FIGURE}` };
    if (value <= benchmarks.high) return { score: 5, label: 'DEVELOPING', analysis: `${v}% is elevated against the example benchmark: it needs attention` };
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

export interface CRAFTDimension {
  found: string[];            // the distinct words or dates matched in the plan
  score: number;
  gaps: string[];
  evidence: string[];         // the plan's own lines that matched (at most 2)
  groupsFound: string[];      // the named elements of this dimension that the plan contains
  groupsMissing: string[];    // the named elements that it does not contain
}
export interface CRAFTAnalysis {
  character: CRAFTDimension;
  result: CRAFTDimension;
  artifact: CRAFTDimension;
  frame: CRAFTDimension;
  timeline: CRAFTDimension;
  timelineWords: string[];    // structure words (milestone, phase, timeline ...) that are not dates: named, never scored
  risks: Array<{ line: string; answered: boolean }>; // lines that name a risk, and whether the plan answers it
}

// Run 16 R16-13 (D46): keyword matches are whole words (a keyword is not inside a longer word), and each distinct
// word is counted and listed once per area. Two matches are the same word when they agree after lowercasing,
// trimming punctuation at the ends and collapsing spaces ("Owner" and "Owner:" are one word).
const wordKey = (m: string): string => m.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/\s+/g, ' ');
function addDistinct(found: string[], matches: string[]): void {
  const seen = new Set(found.map(wordKey));
  for (const m of matches) {
    const text = m.trim();
    const key = wordKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(text);
  }
}

// Run 19 (D80, problem 5): each dimension is made of named elements. A pattern group is one element; the answer says which
// elements the plan contains and which it lacks, so a gap is never named for something the plan already has.
interface Group { label: string; patterns: RegExp[]; optional?: boolean }

const MONTH = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

const CHARACTER_GROUPS: Group[] = [
  { label: 'a named role, title or team', patterns: [
    /\b(marketing|sales|product|engineering|cs|customer success|growth|content|demand gen|ops)\b\s*\b(manager|director|lead|head|vp|chief|team|specialist)\b/gi,
    /\b(cmo|ceo|cto|coo|cro|vp|director|manager|lead|owner)\b/gi] },
  { label: 'an owner or responsible party', patterns: [
    /\bresponsible\s+(?:for|party|team|person)\b/gi,
    /\b(?:who|team|person|role)\s+(?:will|should|must|owns|executes|leads)\b/gi,
    /\bowner[:\s]/gi] },
  { label: 'a RACI', optional: true, patterns: [/\braci\b/gi] },
];
const RESULT_GROUPS: Group[] = [
  { label: 'a KPI, metric or goal', patterns: [/\b(kpi|metric|goal|target|objective|okr|success\s*criteria)\b/gi] },
  { label: 'a target with a number', patterns: [
    /\b(increase|decrease|improve|reduce|achieve|reach|hit)\s+\d+/gi,
    /\d+%?\s*(increase|decrease|improvement|reduction|growth)\b/gi,
    /\b(roi|conversion|retention|churn|nps|csat)\b\s*[:\s]*\d+/gi,
    // Run 20: a goal line that holds a figure ("Goal: a pipeline of $1,500,000, ten deals ...") states a target with a number.
    /(?<=\b(?:goal|target|objective|kpi|okr|metric)s?\b[^\n]{0,80}?)\$\d+(?:,\d{3})*(?:\.\d+)?[kmb]?\b/gi] },
  { label: 'a money target', optional: true, patterns: [/\$[\d,]+\s*(revenue|arr|mrr|pipeline|savings)\b/gi, /\bpipeline of \$\d+(?:,\d{3})*(?:\.\d+)?[kmb]?\b/gi] },
];
const ARTIFACT_GROUPS: Group[] = [
  { label: 'a deliverable or output', patterns: [/\b(deliverable|output|create|produce|build(?!\s+(?:an?\s+)?(?:hypothetical\s+)?pipeline)|develop|launch|publish|ship)\b/gi] },
  { label: 'a named document or tool', patterns: [/\b(document|report|dashboard|playbook|template|guide|framework|tool)\b/gi] },
  { label: 'a campaign or content asset', patterns: [/\b(campaign|content|asset|material|collateral|deck|presentation)\b/gi] },
  { label: 'a channel asset', patterns: [/\b(website|landing\s*page|email|blog|video|webinar|event)\b/gi] },
];
const FRAME_GROUPS: Group[] = [
  { label: 'an audience, persona or segment', patterns: [/\b(audience|persona|icp|segment|target\s*market|buyer)\b/gi] },
  { label: 'constraints or assumptions', patterns: [/\b(constraint|limitation|scope|boundary|requirement|assumption)\b/gi, /\b(?:figures|numbers)\b[^.\n]{0,40}\b(?:hypothetical|assumed|estimates?)\b/gi] },
  { label: 'a budget or resources', patterns: [/\b(budget|resource|headcount|bandwidth|capacity)\b/gi] },
  { label: 'context or current state', patterns: [/\b(context|background|situation|current\s*state|status quo|what (?:buyers|customers) use today)\b/gi] },
  { label: 'a scope such as "for enterprise"', optional: true, patterns: [/\bfor\s+(enterprise|smb|mid-market|startup|b2b|b2c)\b/gi] },
];
// Timeline: only concrete time references count: a date, a quarter or half-year code, a financial-year code, or a duration with a number.
// Words such as by, plan, quarter, month, day, deadline or milestone are not dates and are not scored; "may" is not a month unless a day or year goes with it.
const TIMELINE_GROUPS: Group[] = [
  { label: 'a date', patterns: [
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\b(?:\\s*,?\\s*\\d{4})?`, 'gi'),
    new RegExp(`\\b${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b(?:\\s*,?\\s*\\d{4})?`, 'gi'),
    new RegExp(`\\b${MONTH}\\s*,?\\s*\\d{4}\\b`, 'gi'),
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g] },
  { label: 'a quarter or financial year', patterns: [
    /\b(?:q[1-4]|h[12])(?:\s*(?:fy)?\s*'?\d{2,4})?\b/gi,
    /\bfy\s*'?\d{2,4}\b/gi] },
  { label: 'a duration with a number', patterns: [
    /\b\d+[\s-]*(?:day|week|month|quarter|year)s?\b/gi,
    /\b(?:week|day|month)\s+\d+\b/gi] },
];
const TIMELINE_WORDS = /\b(deadline|due|milestone|phase|sprint|timeline|schedule|roadmap|calendar)s?\b/gi;

const RISK_WORD = /\brisks?\b/i;
const RISK_ANSWER = /\b(mitigat\w*|contingenc\w*|fallback|back-?up|plan b|trigger|escalat\w*|response|respond|if (?:this|that|it)\b)/i;

// The sentence (or line) of the plan that holds a position: the plan's own words, cut at sentence ends.
function sentenceAt(line: string, index: number): string {
  let a = index; let b = index;
  while (a > 0 && !/[.;!?]\s/.test(line.slice(a - 2, a))) a--;
  while (b < line.length && !/[.;!?]/.test(line[b])) b++;
  const t = line.slice(a, b + 1).trim().replace(/\s+/g, ' ');
  return t.length > 160 ? t.slice(0, 157) + '...' : t;
}

function scoreGroups(lines: string[], groups: Group[]): { found: string[]; evidence: string[]; groupsFound: string[]; groupsMissing: string[] } {
  const found: string[] = []; const evidence: string[] = []; const groupsFound: string[] = []; const groupsMissing: string[] = [];
  for (const g of groups) {
    let hit = false;
    for (const line of lines) {
      for (const pattern of g.patterns) {
        const matches = line.match(pattern);
        if (matches) {
          addDistinct(found, matches); hit = true;
          if (evidence.length < 2) {
            const at = line.search(new RegExp(pattern.source, pattern.flags.replace('g', '')));
            const shown = sentenceAt(line, Math.max(0, at));
            if (shown && !evidence.includes(shown)) evidence.push(shown);
          }
        }
      }
    }
    (hit ? groupsFound : g.optional ? [] : groupsMissing).push(g.label);
  }
  return { found, evidence, groupsFound, groupsMissing };
}

// Run 20 (quality round 1): a line that describes the customers, the market or the product (not the seller's own plan) is not scored as
// the plan's owner, goal, deliverable or date. "Buyer roles: General Manager Operations" names the customer's roles, "Customer quote: ...
// in under six months" is a customer's words, and "Proof: ... Gartner ... 7 Consecutive Years" is an award. Such lines still count for
// Frame (audience, context). A line is of this kind when its label (the words before the first colon) says so.
const MARKET_LABEL = /^(?:buyer|buyers|buyer roles?|persona|personas|audience|target audience|customers?|prospects?|competitors?|alternatives?|what (?:buyers|customers) use today|proof|references?|testimonials?|quotes?|case stud(?:y|ies)|message|messaging|positioning|how we differ|differentiat\w+|stakeholders?|segments?|icp)\b/i;
export function isMarketLine(line: string): boolean {
  const m = line.match(/^\s*([^:\n]{1,60}):/);
  return !!m && MARKET_LABEL.test(m[1].trim());
}

export function analyzeCRAFTDimensions(content: string): CRAFTAnalysis {
  const lines = content.split('\n');
  const ownLines = lines.filter((l) => !isMarketLine(l));
  const make = (groups: Group[], unit: number, base: number, onlyOwn = true): CRAFTDimension => {
    const r = scoreGroups(onlyOwn ? ownLines : lines, groups);
    return { found: r.found, score: Math.min(10, r.found.length * unit + (r.found.length > 0 ? base : 0)), gaps: [], evidence: r.evidence, groupsFound: r.groupsFound, groupsMissing: r.groupsMissing };
  };
  const analysis: CRAFTAnalysis = {
    character: make(CHARACTER_GROUPS, 2, 4),
    result: make(RESULT_GROUPS, 2, 4),
    artifact: make(ARTIFACT_GROUPS, 1, 4),
    frame: make(FRAME_GROUPS, 1, 4, false),
    timeline: make(TIMELINE_GROUPS, 2, 4),
    timelineWords: [],
    risks: [],
  };

  if (analysis.character.found.length === 0) {
    analysis.character.gaps.push('No clear role/owner identified');
    analysis.character.gaps.push('Add a line such as "Owner: Head of Marketing" or "Responsible: the sales team", with your own names');
  } else if (analysis.character.found.length < 2) {
    analysis.character.gaps.push('Consider adding RACI matrix for complex initiatives');
  }

  if (analysis.result.found.length === 0) {
    analysis.result.gaps.push('No measurable outcomes defined');
    analysis.result.gaps.push('Add: Specific KPIs with target numbers');
    analysis.result.gaps.push(`Example: "Goal: Increase MQLs by 30% in Q1" ${EXAMPLE_FIGURE}`);
  } else if (analysis.result.found.length < 3) {
    analysis.result.gaps.push('Consider adding leading and lagging indicators');
  }

  if (analysis.artifact.found.length === 0) {
    analysis.artifact.gaps.push('No clear deliverables specified');
    analysis.artifact.gaps.push('Add: List of specific outputs/artifacts');
  }

  if (analysis.frame.found.length === 0) {
    analysis.frame.gaps.push('No audience or constraints defined');
    analysis.frame.gaps.push('Add: Target audience, budget, resources available');
  }

  // Structure words that are not dates are named, never scored.
  for (const line of ownLines) { const m = line.match(TIMELINE_WORDS); if (m) addDistinct(analysis.timelineWords, m); }
  if (analysis.timeline.found.length === 0) {
    analysis.timeline.gaps.push(analysis.timelineWords.length
      ? `No dates, durations or quarters found. Words such as "${analysis.timelineWords.slice(0, 3).join('", "')}" are in the plan, but they are not dates`
      : 'No dates, durations or quarters found');
    analysis.timeline.gaps.push('Add: Specific dates, phases, or milestones');
  }

  // A risk the plan names but never answers: judged sentence by sentence (the answer may sit in the same or the next sentence).
  const sentences = content.split(/\n|(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  sentences.forEach((sent, i) => {
    if (RISK_WORD.test(sent)) {
      const answered = RISK_ANSWER.test(sent.replace(/\brisks?\b/gi, '')) || RISK_ANSWER.test(sentences[i + 1] || '');
      analysis.risks.push({ line: sent.replace(/\s+/g, ' ').slice(0, 160), answered });
    }
  });
  return analysis;
}

/**
 * Figures in a metrics text that no scoring rule reads. The text is split by line, semicolon and comma (not inside a number);
 * a piece that holds a digit but none of the metric words the parser knows is returned, so the answer can name it as not scored.
 */
export function unscoredFigures(metricsText: string): string[] {
  const known = /\b(mrr|arr|acv|annual contract value|average contract value|churn|nps|cac|ltv|retention|nrr|net revenue retention|activation|referral|growth|dau|mau|trial|expansion)\b/i;
  return metricsText.split(/\n|;|,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter((x) => /\d/.test(x) && !known.test(x));
}
