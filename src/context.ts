// Run 19 (owner decision D80): shared helpers that read the sector and the business model from what the user typed, and
// that keep typed text out of broken sentences. The sector knowledge itself is in src/verticals.ts (rule B82).
// splitItems, q, readContext, sectorNotes and answerFor follow the helpers of Revenue Enablement (the lead's version).
import { BILLING_NOTES } from './sector-playbooks.js';
import { detectVertical, detectModel, explainSector, profileFor, MODEL_NAME, BUSINESS_MODELS, SECTOR_MODEL, SUBTYPES, VERTICALS, type Vertical, type VerticalId, type BusinessModel, type ReaderInput } from './verticals.ts';

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

// The model names of the shared reader, with "payments" taken out of the per-transaction label: a shipping or marketplace seller is per-transaction too.
const MODEL_LABEL: Record<BusinessModel, string> = { ...MODEL_NAME, transactions: 'per-transaction (volume based)' };

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
// A product description that lists several trades (network, cloud, cyber security ...) is about the one it names first, when that trade has
// two or more of its own words: the shared reader scores by count, so a long list of security words can outvote the network named first.
function headTrade(input: ReaderInput, r: ReturnType<typeof explainSector>): ReturnType<typeof explainSector> {
  if (r.source !== 'seller' || !r.vertical) return r;
  const text = (input.seller ?? []).filter((x): x is string => typeof x === 'string').join(' \n ');
  let best: { v: Vertical; at: number; n: number; words: string[] } | null = null;
  for (const v of VERTICALS) {
    if (v.id === 'saas' || v.id === 'ai-native' || v.id === 'software') continue;
    const g = new RegExp(v.match.source, 'gi');
    const found = new Set<string>(); let first = -1; let m: RegExpExecArray | null;
    while ((m = g.exec(text))) { found.add(m[0].toLowerCase()); if (first < 0) first = m.index; }
    if (found.size >= 2 && (!best || first < best.at)) best = { v, at: first, n: found.size, words: [...found] };
  }
  if (best && best.v.id !== r.vertical.id && (r.vertical.id === 'cybersecurity' || r.vertical.id === 'fintech' || r.vertical.id === 'ites')) {
    return { vertical: best.v, source: 'seller', strong: best.words, weak: [] };
  }
  return r;
}
// A billing platform (billing, dunning, proration, revenue recognition) also says "invoicing" and "payments"; those fintech words must not outvote it.
function billingPlatform(input: ReaderInput, r: ReturnType<typeof explainSector>): ReturnType<typeof explainSector> {
  if (!(r.vertical && r.vertical.id === 'fintech' && r.source === 'seller')) return r;
  const text = (input.seller ?? []).filter((x): x is string => typeof x === 'string').join(' ');
  const n = new Set((text.match(/\b(billing|dunning|prorat\w+|revenue recogni\w+|subscription management|quote-to-cash)\b/gi) ?? []).map((w) => w.toLowerCase())).size;
  const saas = VERTICALS.find((x) => x.id === 'saas');
  if (n >= 2 && saas && !/\b(expense|cards?|spend|payroll|reimburs\w+|lending|loans?|banking)\b/i.test(text)) return { vertical: saas, source: 'seller', strong: ['billing'], weak: [] };
  return r;
}
function readSector(input: ReaderInput): ReturnType<typeof explainSector> {
  // Run 21b: when the product category noun named a sub-type (customer service software, a messaging platform, construction management software ...) no local layer below overrides it.
  const first = explainSector(input);
  if (first.vertical && first.vertical.subtype && first.vertical.id !== 'ai-native' && (first.source === 'seller' || first.source === 'context')) return first;   // AI words stay with the local AI rules below
  const r = billingPlatform(input, headTrade(input, first));
  if (!(r.vertical && r.vertical.id === 'ai-native' && r.source === 'seller')) return r;
  const maskedSeller = (input.seller ?? []).map((t) => (typeof t === 'string' ? t.replace(AI_WORDS, ' ') : t));
  const m = explainSector({ ...input, seller: maskedSeller });
  if (m.vertical && m.vertical.id !== 'ai-native' && m.source === 'seller' && m.strong.length >= 2) return m;
  if (r.strong.every((w) => w === 'ai')) return explainSector({ ...input, seller: [] });
  // AI words say how it is built; a CISO or a SOC analyst as the buyer, or deal text about attack surfaces, says it is a security product.
  const rest = explainSector({ ...input, seller: [] });
  if (rest.vertical && rest.vertical.id === 'cybersecurity' && (rest.source === 'role' || rest.source === 'context')) return rest;
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
// Developer tooling and AI words the shared reader does not hold. Used only when the shared reader names no sector from the seller's words.
const DEV_WORDS = /\b(api catalog|api network|mock servers?|openapi|swagger|spec hub|api governance|api lifecycle|apis?|sdks?|cli|ci pipelines?|collections? run in ci|developer workspaces?|monitors?)\b/gi;
const AI_BUILD_WORDS = /\b(deep learning|knowledge graphs?|neural networks?|machine learning models?|predictive models?|forecast models?)\b/i;
function supplementSector(v: Vertical | null, sellerTexts: string[]): Vertical | null {
  if (v) return v;
  const t = sellerTexts.join(' \n ');
  if (!t.trim()) return v;
  const dev = new Set((t.match(DEV_WORDS) ?? []).map((w) => w.toLowerCase()));
  if (dev.size >= 3) return VERTICALS.find((x) => x.id === 'software') ?? null;
  if (AI_BUILD_WORDS.test(t)) return VERTICALS.find((x) => x.id === 'ai-native') ?? null;
  return v;
}
// The shared file words two objections as if the seller were the challenger ("price per site is higher than the national operator", "your rates are
// higher than an offshore-only firm"). They are worded neutrally here, because the seller may be that operator or that firm.
function neutralWording(v: Vertical | null): Vertical | null {
  if (!v) return v;
  const fix = (t: string): string => t.replace(/higher than the national operator/gi, 'higher than another provider\'s').replace(/than an offshore-only firm/gi, 'than another provider\'s').replace(/\bnational operator\b/gi, 'larger provider').replace(/\boffshore-only firm\b/gi, 'lower-cost provider');
  return { ...v, objections: v.objections.map((o) => ({ objection: fix(o.objection), response: fix(o.response) })) };
}
// A SaaS-sector seller whose own words are billing words is sold to finance and revenue operations (see BILLING_NOTES in src/sector-playbooks.ts).
function overlayBilling(v: Vertical | null, sellerTexts: string[], contextTexts: string[]): Vertical | null {
  if (!v || v.id !== 'saas') return v;
  const t = sellerTexts.join(' ');
  const strong = (t.match(/\b(billing|invoic\w*|dunning|proration|prorat\w*|revenue recogni\w*|quote-to-cash|subscription management)\b/gi) ?? []).length;
  const anyW = (`${t} ${contextTexts.join(' ')}`.match(/\b(billing|invoic\w*|dunning|proration|revenue recogni\w*|quote-to-cash|collections|payments?)\b/gi) ?? []).length;
  if (strong >= 1 || anyW >= 3) return { ...v, ...BILLING_NOTES, name: 'SaaS, billing and revenue operations' };
  return v;
}

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
  const v0 = chosen ?? (fromBuyerOnly ? null : (read.source === 'buyer' ? wholeTrade : read.vertical));
  const v = chosen ? v0 : supplementSector(v0, sellerTexts);
  const buyerV = fromBuyerOnly ? read.vertical : null;
  let model: BusinessModel | null; let how: Context['how'];
  const explicit = typeof opts.model === 'string' && (BUSINESS_MODELS as string[]).includes(opts.model) ? (opts.model as BusinessModel) : null;
  if (explicit) { model = explicit; how = 'input'; }
  else if (opts.hintModel) { model = opts.hintModel; how = 'hint'; }
  else {
    const m = detectModel(undefined, input);
    model = m.model; how = m.how === 'read' ? 'read' : m.how === 'sector' ? 'sector' : 'unknown';
    // Run 21b: a sub-type with its own usual model (a messaging or payments API sold to a chosen telecom or fintech sector) keeps it; the chosen sector's usual model is the fallback.
    if (how !== 'read' && chosen) { const st = profileFor(chosen, null, input)?.subtype; model = (st && SUBTYPES.find((x) => x.id === st)?.model) || SECTOR_MODEL[chosen.id]; how = 'sector'; }
    // The word "software" in a company name or "platform" in a playbook name does not make a services firm a software subscription:
    // when the sector is ITeS and the seller's words name services work, the model is services.
    // A seller read as AI native whose words are about portfolios, securities and forecasts for investors manages or advises on money: the investment model.
    if (v && v.id === 'ai-native' && how !== 'read' || (v && v.id === 'ai-native' && model === 'saas' && how === 'read')) {
      const t = sellerTexts.join(' ');
      const tb = `${t} ${(input.buyer ?? []).filter((x): x is string => typeof x === 'string').join(' ')}`;
      if ((tb.match(/\b(?:portfolios?|securities|forecast ranges?|investment|asset allocators?|pensions?|endowments?|wealth managers?|alpha|factor exposures?)\b/gi) ?? []).length >= 2 && !/\b(?:platform|software|saas|subscription|api)\b/i.test(t)) { model = 'investment'; how = 'read'; }
    }
    if (v && v.id === 'ites' && model === 'saas' && how === 'read') {
      const sellerText = (input.seller ?? []).filter((x): x is string => typeof x === 'string').join(' ');
      if (/\b(?:managed services?|it services|engineering services|consulting|outsourc\w*|systems? integrat\w*|contact cent(?:re|er)s?|service desk|back[- ]office|business process|collections services|customer experience(?: and \w+)? services|designs?,? builds?,? and runs?)\b/i.test(sellerText) && !/\b(?:saas|subscriptions?|per seat|per user)\b/i.test(sellerText)) { model = 'services'; how = 'read'; }
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
  const vAdj0 = overlayBilling(profileFor(v, model, input), sellerTexts, (input.context ?? []).filter((x): x is string => typeof x === 'string'));
  // "Seats" is a software subscription word: a sector sentence that holds it is reworded for a model that is not a subscription.
  const vAdj = vAdj0 && model && model !== 'saas' ? { ...vAdj0, committee: vAdj0.committee.replace(/\bseats\b/gi, 'licences') } : vAdj0;
  const sector = vAdj ? `${chosen ? `${vAdj!.name} (from your choice)` : `read from your inputs as ${vAdj!.name}`}` : `not clear from your inputs${buyerSide || ' (name the industry for sector notes)'}`;
  const mtxt = model
    ? `${MODEL_LABEL[model]} (${how === 'input' ? 'from business_model' : how === 'hint' ? 'from your market choice; set business_model to change it' : how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})`
    : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v: vAdj, model, how, sector, line: `*Sector: ${sector}. Business model: ${mtxt}.*`, buyerV };
}

/** Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82). */
export function sectorNotes(v: Vertical | null, what: 'committee' | 'metrics' | 'objections' | 'all' = 'all'): string {
  if (!v) return '';
  const out = [`### Sector notes: ${v.name}`];
  if (what === 'committee' || what === 'all') out.push(`- **Who usually decides:** ${v.committee}`);
  if (what === 'metrics' || what === 'all') out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
  if (what === 'objections' || what === 'all') out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => lcFirst(o.objection)).join('; ')}.`);
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
  const lines = text.replace(/\?\s*,\s*(?=[A-Za-z])/g, '?\n').split(/\n|;/).map((x) => x.trim()).filter(Boolean);
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
      // "and integration with an existing ERP" is a strength of its own, not a tail of the one before; a run of Title Case names ("Modern Trade, Rural GT, Van Sales and hybrid sales models") continues a list of names
      const titleRun = merged.length > 0 && !/[?!]$/.test(merged[merged.length - 1]) && !/[?!]$/.test(piece) && /^[A-Z][a-z]+$/.test(words[0]) && /^[A-Z]/.test(prevLast) && /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(merged[merged.length - 1]);
      if (merged.length && /^(?:and|or)\s/i.test(piece) && words.length >= 5 && !titleRun) merged.push(piece.replace(/^(?:and|or)\s+/i, ''));
      else if (merged.length && (joins || nameOnly || acronymRun || titleRun)) merged[merged.length - 1] += `, ${piece}`;
      else if (!merged.length && words.length <= 2 && pieces.length > 1) carry = piece;
      else merged.push(piece);
    }
    if (carry) merged.push(carry);
    out.push(...merged);
  }
  return out;
}

/** A company name without trailing corporate words (Software, Technologies, Systems, Inc, Ltd ...): "Brightfield Software" is read as "Brightfield", so the word Software does not set a business model. */
export function cleanCompanyName(name: string | undefined): string {
  return (name ?? '').replace(/\s+(?:software|technologies|technology|systems|solutions|labs|group|inc\.?|ltd\.?|limited|llc|pvt\.?|private limited|corp\.?|corporation)\b\.?/gi, '').trim();
}

/** A user text in double quotes, capped at a word boundary; a cut ends with "..." inside the quotes (q() would strip a final dot). */
export function qc(text: string, max = 140): string {
  return `"${capEcho(text.trim().replace(/[.]$/, ''), max).short.replace(/^"|"$/g, '')}"`;
}

/** The first letter lower case, unless the text opens with an acronym ("SLA and cost outcomes" stays, "A before and after" becomes "a before and after"). */
export function lcFirst(t: string): string {
  return /^[A-Z]{2,}\b/.test(t) || /^[A-Z][a-z]*[A-Z]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}
