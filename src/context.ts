// Run 19 (owner decision D80): shared helpers that read the sector and the business model from what the user typed, and
// that keep typed text out of broken sentences. The sector knowledge itself is in src/verticals.ts (rule B82).
// splitItems, q, readContext, sectorNotes and answerFor follow the helpers of Revenue Enablement (the lead's version).
import { detectVertical, detectModel, explainSector, MODEL_NAME, BUSINESS_MODELS, SECTOR_MODEL, VERTICALS, type Vertical, type VerticalId, type BusinessModel, type ReaderInput } from './verticals.ts';

export { BUSINESS_MODELS, VERTICALS };
export type { Vertical, BusinessModel, ReaderInput };

/** The choices of the optional business_model input (the same words in every tool). */
export const MODEL_CHOICES: string[] = [...BUSINESS_MODELS];
/** Sector choices that name one of the owner's verticals. */
export const SECTOR_CHOICES: Record<string, VerticalId> = {
  logistics_tech: 'logistics-tech', fintech: 'fintech', saas: 'saas', vertical_saas: 'vertical-saas', ai_native: 'ai-native',
  ites: 'ites', telecom: 'telecom', software: 'software', cybersecurity: 'cybersecurity',
};

// A list typed by the user: one item per line or per semicolon. Commas are kept inside an item, so a phrase such as
// "regression suites take too long, but teams already own too many tools" is never cut into a fragment. A plain comma list of
// short items (each 1 to 6 words, none opening with a joining word) is split too.
export function splitItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  const parts = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (parts.length === 1 && /,/.test(parts[0])) {
    const c = parts[0].split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
    if (c.length > 1 && c.every((x) => x.split(/\s+/).length <= 6) && !c.some((x) => /^(not|but|and|or|so|which|that)\b/i.test(x))) return c;
  }
  return parts;
}

/** Text typed by the user, quoted when it sits inside one of the tool's own sentences, so a clause never breaks the grammar. */
export function q(s: string): string {
  return `"${s.trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}

export interface Context { v: Vertical | null; model: BusinessModel | null; how: 'input' | 'hint' | 'read' | 'sector' | 'unknown'; sector: string; line: string }

/**
 * The sector and the business model read from the inputs, with one line that says how they were read.
 * Run 20 (D92): the texts are given in groups, `{ seller, context, role, buyer }` (see ReaderInput in src/verticals.ts): the seller's own
 * words (product, category, strengths) are read first, then free text about the deal, then job titles, then who the buyer is.
 * Order for the model: the business_model input, then a hint from another input (for example a market choice), then the
 * typed text (the seller's words only), then the usual model of the sector (said to be assumed).
 */
export function readContext(opts: { model?: unknown; hintModel?: BusinessModel | null; vertical?: string | null }, input: ReaderInput): Context {
  let chosen = opts.vertical && SECTOR_CHOICES[opts.vertical] ? VERTICALS.find((x) => x.id === SECTOR_CHOICES[opts.vertical!]) ?? null : null;
  const read = explainSector(input);
  // A broad choice (saas, software) does not hide a trade the seller's own words name (a CNAPP tool is cybersecurity, not "saas").
  if (chosen && (chosen.id === 'saas' || chosen.id === 'software') && read.vertical && read.source === 'seller' && read.vertical.id !== chosen.id && read.vertical.id !== 'saas' && read.vertical.id !== 'software') chosen = null;
  const v = chosen ?? read.vertical;
  let model: BusinessModel | null; let how: Context['how'];
  const explicit = typeof opts.model === 'string' && (BUSINESS_MODELS as string[]).includes(opts.model) ? (opts.model as BusinessModel) : null;
  if (explicit) { model = explicit; how = 'input'; }
  else if (opts.hintModel) { model = opts.hintModel; how = 'hint'; }
  else {
    const m = detectModel(undefined, input);
    model = m.model; how = m.how === 'read' ? 'read' : m.how === 'sector' ? 'sector' : 'unknown';
    if (how !== 'read' && chosen) { model = SECTOR_MODEL[chosen.id]; how = 'sector'; }
  }
  const sector = v ? `${chosen ? `${v.name} (from your choice)` : `read from your inputs as ${v.name}`}` : 'not clear from your inputs (name the industry for sector notes)';
  const mtxt = model
    ? `${MODEL_NAME[model]} (${how === 'input' ? 'from business_model' : how === 'hint' ? 'from your market choice; set business_model to change it' : how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})`
    : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v, model, how, sector, line: `*Sector: ${sector}. Business model: ${mtxt}.*` };
}

/** Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82). */
export function sectorNotes(v: Vertical | null, what: 'committee' | 'metrics' | 'objections' | 'all' = 'all'): string {
  if (!v) return '';
  const out = [`### Sector notes: ${v.name}`];
  if (what === 'committee' || what === 'all') out.push(`- **Who usually decides:** ${v.committee}`);
  if (what === 'metrics' || what === 'all') out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
  if (what === 'objections' || what === 'all') out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.`);
  out.push(`- **Words this buyer uses:** ${v.vocabulary.join(', ')}.`);
  out.push(`- **A proof point that lands:** ${v.proofShape}`);
  return out.join('\n');
}

/** The answer pattern for one objection or blocker typed by the user: the sector's pattern when it matches, else a pattern by kind. */
export function answerFor(text: string, v: Vertical | null): string {
  const t = text.toLowerCase();
  if (v) {
    for (const o of v.objections) {
      const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
      if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length)) return o.response;
    }
  }
  if (/\b(price|prices|cost|costs|budget|expensive|cheaper|cheap|discount|margins?)\b/.test(t)) return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it; trade any concession for something of equal value.';
  if (/\b(already (?:have|has|does|use|uses|own)|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built)\b/.test(t)) return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
  if (/\b(adopt|adoption|use a new|use another|will not use|won't use|resist|change|training)\b/.test(t)) return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
  if (/\b(integrat\w*|migrat\w*|cut-?over|disrupt\w*|setup|set-up|implementation|rollout|roll out|install\w*)\b/.test(t)) return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
  if (/\b(security|privacy|compliance|audit|regulat\w*|legal|risk)\b/.test(t)) return 'Bring the security and compliance answers before they are asked, and map each requirement to the control that meets it.';
  if (/\b(bundle|bundled|bundles|bundling|one vendor|single vendor|suite|consolidat\w*)\b/.test(t)) return 'Compare the outcome the buyer needs from each option, not the size of the bundle; show what the bundled tool leaves to manual work.';
  if (/\b(timing|not now|next year|later|priority)\b/.test(t)) return 'Find the event that makes this urgent (a renewal, an audit, a season, a target) and plan back from it.';
  if (/\b(black box|explain\w*|trust|wrong|accuracy|track record)\b/.test(t)) return 'Offer evidence the buyer can check: an evaluation on their own data, and references they can call.';
  return 'Ask what lies behind it and what would change their mind, then answer with evidence from a similar customer only if you have it.';
}

/** Names the inputs a tool read but could not use, with the reason, so no supplied input is dropped silently. */
export function notUsedNote(items: Array<[string, string]>): string {
  const rows = items.filter(([, text]) => text);
  if (!rows.length) return '';
  return `**Inputs not used, and why:**\n${rows.map(([name, why]) => `- ${name}: ${why}`).join('\n')}`;
}

/** A short plain-English list: "a, b and c". */
export function andList(list: string[]): string {
  return list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** The short name at the start of a product description ("Shelfwalk, a field sales app" gives "Shelfwalk"), or null when the text starts with a long phrase. */
export function shortName(text: string | undefined): string | null {
  if (!text) return null;
  // Run 20 (D086): a text that starts with a bracket or an opening quote, such as the "[image removed: alt]" or the quoted instruction the echo safeguard writes, is not cut at its colon.
  if (/^\s*[\[\u201C]/.test(text)) return null;
  const head = text.split(/[,:]|\s[-\u2013]\s/)[0].trim();
  const words = head.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 4 || /^(a|an|the|our|my|your)\b/i.test(head)) return null;
  return head;
}

/**
 * A user text placed in a heading, a table or a repeated sentence (ledger B15-L1): capped at a word boundary, so a long pasted text
 * never fills a heading. The full text is printed once elsewhere in the answer.
 */
export function capEcho(text: string, max = 140): { short: string; capped: boolean } {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return { short: t, capped: false };
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return { short: (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:\s]+$/, '') + '...', capped: true };
}
