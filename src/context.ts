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

export interface Context { v: Vertical | null; model: BusinessModel | null; how: 'input' | 'hint' | 'read' | 'sector' | 'unknown'; sector: string; line: string; buyerV: Vertical | null }

// Words that the shared reader takes for a sector word but that mean something else in these phrases: "per security" and "securities"
// are financial instruments, and "SOC 1" is an audit report (not a security operations centre). They are replaced before reading.
function cleanForReader(t: unknown): unknown {
  if (typeof t !== 'string') return t;
  return t.replace(/\b(?:per|each|every|a single|one)\s+security\b/gi, 'per holding').replace(/\bSOC\s*1\b/gi, 'audit report 1').replace(/\bsecurity\s+(selection|prices?|returns?|master)\b/gi, 'holding $1');
}
function cleanInput(input: ReaderInput): ReaderInput {
  const f = (list?: unknown[]) => (Array.isArray(list) ? list.map(cleanForReader) : list);
  return { seller: f(input.seller), context: f(input.context), role: f(input.role), buyer: f(input.buyer) };
}

// AI words (AI, AI agents, LLM ...) say how a product is built, not what trade it serves. When the seller's text also holds two or more
// words of one trade (attack surface and dark web: cybersecurity), that trade is the sector; a lone "AI" (as in "AI test generation")
// does not decide the sector by itself.
const AI_WORDS = /\b(?:ai agents?|agents? that|agentic|autonomous agents?|voice agents?|ai assistants?|ai copilots?|copilots?|llms?|genai|gen ai|generative ai|ai[- ]native|ai[- ]first|foundation models?|large language models?|conversational ai|ai platform|ai models?|adaptive ai|ai[- ]powered|ai[- ]led|ai[- ]driven|ai)\b/gi;
function readSector(input: ReaderInput): ReturnType<typeof explainSector> {
  const r = explainSector(input);
  if (!(r.vertical && r.vertical.id === 'ai-native' && r.source === 'seller')) return r;
  const maskedSeller = (input.seller ?? []).map((t) => (typeof t === 'string' ? t.replace(AI_WORDS, ' ') : t));
  const m = explainSector({ ...input, seller: maskedSeller });
  if (m.vertical && m.vertical.id !== 'ai-native' && m.source === 'seller' && m.strong.length >= 2) return m;
  if (r.strong.every((w) => w === 'ai')) return explainSector({ ...input, seller: [] });
  return r;
}

/**
 * The sector and the business model read from the inputs, with one line that says how they were read.
 * Run 20 (D92): the texts are given in groups, `{ seller, context, role, buyer }` (see ReaderInput in src/verticals.ts): the seller's own
 * words (product, category, strengths) are read first, then free text about the deal, then job titles, then who the buyer is.
 * A sector read only from the buyer's industry is NOT used as the seller's sector (a telecom provider selling to banks is not
 * fintech): it is kept in `buyerV` and named in the line, and the tools use no sector notes for it.
 * Order for the model: the business_model input, then a hint from another input (for example a market choice), then the
 * typed text (the seller's words only), then the usual model of the sector (said to be assumed).
 */
export function readContext(opts: { model?: unknown; hintModel?: BusinessModel | null; vertical?: string | null }, rawInput: ReaderInput): Context {
  const input = cleanInput(rawInput);
  let chosen = opts.vertical && SECTOR_CHOICES[opts.vertical] ? VERTICALS.find((x) => x.id === SECTOR_CHOICES[opts.vertical!]) ?? null : null;
  const read = readSector(input);
  // The shared reader cuts a seller text at "for ..." and counts the rest as the buyer's words, so "software for consumer brands: sales
  // force automation, distributor management ..." reads as a buyer. When the seller's own description, read whole, names one trade with
  // several of its words, that trade is the seller's sector.
  const sellerTexts = (input.seller ?? []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  const whole = sellerTexts.length ? explainSector({ role: [sellerTexts.join(' \n ')] }) : null;
  const wholeTrade = whole && whole.vertical && whole.strong.length >= 2 && whole.vertical.id !== 'saas' && whole.vertical.id !== 'software' ? whole.vertical : null;
  // A broad choice (saas, software) does not hide a trade the seller's own words name (a CNAPP tool is cybersecurity, not "saas").
  if (chosen && (chosen.id === 'saas' || chosen.id === 'software')) {
    if (read.vertical && read.source === 'seller' && read.vertical.id !== chosen.id && read.vertical.id !== 'saas' && read.vertical.id !== 'software') chosen = null;
    else if (wholeTrade && whole!.strong.length >= 3) chosen = null;
  }
  const fromBuyerOnly = !chosen && read.source === 'buyer' && !wholeTrade;
  const v = chosen ?? (fromBuyerOnly ? null : (read.source === 'buyer' ? wholeTrade : read.vertical));
  const buyerV = fromBuyerOnly ? read.vertical : null;
  let model: BusinessModel | null; let how: Context['how'];
  const explicit = typeof opts.model === 'string' && (BUSINESS_MODELS as string[]).includes(opts.model) ? (opts.model as BusinessModel) : null;
  if (explicit) { model = explicit; how = 'input'; }
  else if (opts.hintModel) { model = opts.hintModel; how = 'hint'; }
  else {
    const m = detectModel(undefined, input);
    model = m.model; how = m.how === 'read' ? 'read' : m.how === 'sector' ? 'sector' : 'unknown';
    if (how !== 'read' && chosen) { model = SECTOR_MODEL[chosen.id]; how = 'sector'; }
    // The word "software" in a company name or "platform" in a playbook name does not make a services firm a software subscription:
    // when the sector is ITeS and the seller's words name services work, the model is services.
    if (v && v.id === 'ites' && model === 'saas' && how === 'read') {
      const sellerText = (input.seller ?? []).filter((x): x is string => typeof x === 'string').join(' ');
      if (/\b(?:managed services?|it services|engineering services|consulting|outsourc\w*|systems? integrat\w*|contact cent(?:re|er)s?|service desk)\b/i.test(sellerText) && !/\b(?:saas|subscriptions?|per seat|per user)\b/i.test(sellerText)) { model = 'services'; how = 'read'; }
    }
    if (v && v.id === 'telecom' && model === 'saas' && how === 'read') {
      const sellerText = (input.seller ?? []).filter((x): x is string => typeof x === 'string').join(' ');
      if (/\b(?:sd-?wan|mpls|leased lines?|connectivity|bandwidth|managed network|broadband|business internet)\b/i.test(sellerText) && !/\b(?:saas|subscriptions?|per seat|per user)\b/i.test(sellerText)) { model = 'connectivity'; how = 'read'; }
    }
  }
  // No sector of the seller's own is known (the sector read from the buyer's industry is not used), so there is no usual model to assume either.
  if (!v && how === 'sector') { model = null; how = 'unknown'; }
  const buyerSide = buyerV ? ` (name it with the industry input for sector notes)` : '';
  // A seller that manages money (the investment model) is not sold to like the sector the shared reader named (support-automation buyers for "AI native",
  // finance-function buyers for "fintech"): the committee, roles, measures and discovery questions are those of an investment decision.
  const vAdj = v && model === 'investment' ? investmentView(v) : v;
  const sector = vAdj ? `${chosen ? `${vAdj!.name} (from your choice)` : `read from your inputs as ${vAdj!.name}`}` : `not clear from your inputs${buyerSide || ' (name the industry for sector notes)'}`;
  const mtxt = model
    ? `${MODEL_NAME[model]} (${how === 'input' ? 'from business_model' : how === 'hint' ? 'from your market choice; set business_model to change it' : how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})`
    : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v: vAdj, model, how, sector, line: `*Sector: ${sector}. Business model: ${mtxt}.*`, buyerV };
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


/** A comma list that keeps a comma inside brackets or inside a number: "Competitor A (a global suite, strong on reports), Competitor B". New lines also separate items; semicolons do unless `semicolons` is false. */
export function splitTopLevel(text: unknown, semicolons = true): string[] {
  if (typeof text !== 'string') return [];
  const out: string[] = []; let depth = 0; let cur = '';
  const t = text.replace(semicolons ? /\n|;/g : /\n/g, ',');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    // a comma inside a number (1,500,000) is not a separator
    if (ch === ',' && depth === 0 && !(/\d/.test(t[i - 1] || '') && /^\d{3}(?!\d)/.test(t.slice(i + 1, i + 4)))) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim().replace(/^[-*\u2022]\s*/, '')).filter(Boolean);
}

const ACRONYM = /^[A-Z][A-Z0-9+&/.-]+$/;
/**
 * A list typed as one sentence with commas (strengths, objections, goals): items separated by new lines or semicolons are kept as typed.
 * In a comma run, a piece that opens with a joining word (which, with, and, or, but, so, that, where, from, because, including, plus),
 * a piece made only of names or acronyms ("APAC and ANZ"), and a piece that continues a list of acronyms
 * ("FMS or TMS in weeks" after "WMS") are joined back onto the piece before them, so no item starts or ends mid-phrase. A first piece
 * of one or two words is joined forward.
 */
export function splitPhrases(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const lines = text.split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const pieces = splitTopLevel(line, false);
    const merged: string[] = [];
    let carry = '';
    for (let piece of pieces) {
      if (carry) { piece = `${carry}, ${piece}`; carry = ''; }
      const words = piece.split(/\s+/);
      const prevLast = merged.length ? merged[merged.length - 1].replace(/\s*\(.*\)\s*$/, '').split(/\s+/).pop() ?? '' : '';
      const joins = /^(?:which|with|and|or|but|so|that|where|from|because|including|plus|while|then)\b/i.test(piece);
      const nameOnly = words.length <= 4 && words.every((w) => /^(?:and|or|&)$/i.test(w) || /^[A-Z][A-Za-z0-9+&/.-]*$/.test(w));
      const acronymRun = ACRONYM.test(words[0].replace(/[,;]$/, '')) && ACRONYM.test(prevLast.replace(/[,;]$/, '')) && words.length <= 8;
      if (merged.length && (joins || nameOnly || acronymRun)) merged[merged.length - 1] += `, ${piece}`;
      else if (!merged.length && words.length <= 2 && pieces.length > 1) carry = piece;
      else merged.push(piece);
    }
    if (carry) merged.push(carry);
    out.push(...merged);
  }
  return out;
}

/** A company name without trailing corporate words (Software, Technologies, Systems, Inc, Ltd ...): "Sonata Software" is read as "Sonata", so the word Software does not set a business model. */
export function cleanCompanyName(name: string | undefined): string {
  return (name ?? '').replace(/\s+(?:software|technologies|technology|systems|solutions|labs|group|inc\.?|ltd\.?|limited|llc|pvt\.?|private limited|corp\.?|corporation)\b\.?/gi, '').trim();
}

/** A user text in double quotes, capped at a word boundary; a cut ends with "..." inside the quotes (q() would strip a final dot). */
export function qc(text: string, max = 140): string {
  return `"${capEcho(text.trim().replace(/[.]$/, ''), max).short.replace(/^"|"$/g, '')}"`;
}

/** The sector's reader data with the buying side replaced for a seller that manages money. Words and objections of the sector stay. */
function investmentView(v: Vertical): Vertical {
  return {
    ...v,
    committee: 'The chief investment officer or the investment committee decides; portfolio managers and quant researchers evaluate the models and data; risk and compliance review data use and explainability; investment operations run it day to day.',
    buyerRoles: ['Chief Investment Officer', 'Head of Quant Research', 'Head of Risk', 'Head of Compliance', 'Head of Investment Operations'],
    metrics: ['performance against the agreed benchmark', 'risk-adjusted return', 'tracking error', 'turnover', 'how well each signal can be explained'],
    proofShape: 'Results against the agreed benchmark over a stated period, with the explanation of each signal that a committee can defend to trustees or clients.',
    discovery: ['How do you decide which signals or data sources to trust, and who signs off?', 'What does your committee need to see before it accepts a model-based input?', 'How do you judge whether a signal has added value: against which benchmark, over what period?', 'Which data may not leave your environment?', 'How do you document the reasoning behind a decision for clients, trustees or regulators?'],
  };
}

/** The first letter lower case, unless the text opens with an acronym ("SLA and cost outcomes" stays, "A before and after" becomes "a before and after"). */
export function lcFirst(t: string): string {
  return /^[A-Z]{2,}\b/.test(t) || /^[A-Z][a-z]*[A-Z]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}
