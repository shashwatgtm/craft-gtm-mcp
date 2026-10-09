// Run 22 (writer cg-w1): helpers of the rewritten competitive_intel, partner_architect and craft_gtm_analyzer. Plain text helpers only: clean
// sentences from typed phrases, the name of a product that is not cut, the one closing block that asks for what was not given, and the partner
// kinds of a customer segment. Sector knowledge itself stays in src/verticals.ts and src/sector-playbooks.ts (rule B82); the lines here are kinds
// of company and ways of working, never a figure, a market size or a named company.
import { shortName } from './context.js';
import { segmentKinds } from './sector-playbooks.js';

/** A typed phrase without its trailing full stop, comma, colon or semicolon and with single spaces. */
export const stripEnd = (t: string): string => t.trim().replace(/\s+/g, ' ').replace(/[\s.;,:]+$/, '');

/** A typed phrase as a sentence: first letter in capitals, one full stop at the end (a question or exclamation mark stays). */
export function sentence(t: string): string {
  const x = stripEnd(t);
  if (!x) return '';
  const s = x.charAt(0).toUpperCase() + x.slice(1);
  return /[?!]$/.test(s) ? s : `${s}.`;
}

/** The first letter in lower case, unless the text opens with an acronym or a name written with inner capitals ("SLA", "iOS", "SD-WAN"). */
export function lc(t: string): string {
  return /^[A-Z]{2,}\b/.test(t) || /^[A-Z][a-z]*[A-Z]/.test(t) || /^[A-Z][a-z]+[A-Z]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}

/** A list in one sentence: "a, b and c". */
export function listAnd(list: string[]): string {
  return list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** The text in full when it fits; otherwise cut at the last clause break (comma, semicolon, colon, dash or opening bracket) that leaves at least half of it. Never cuts inside a clause when no break exists. */
export function clauseCut(text: string, max: number): string {
  const t = stripEnd(text);
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  // the strongest break first: a semicolon or colon, then a dash or an opening bracket, then a comma; each must leave at least half of the room used
  for (const marks of [[';', ':'], [' - ', ' ('], [',']]) {
    const at = Math.max(...marks.map((m) => head.lastIndexOf(m)));
    if (at >= max * 0.5) return head.slice(0, at).trim();
  }
  return t;
}

/** The name of a seller's product and what is left of its description. A plain description with no clear name has no name: the answers say "your solution" or use the description (never its first word). */
export interface ProductLabel { name: string | null; rest: string; whole: string }
const JOIN_WORD = /^(?:that|which|who|where|for|with|by|from|connects?|helps?|lets?|gives?|makes?|builds?|runs?|designs?|turns?|unifies?|joins?|uses?)$/i;
export function productLabel(product: string, company?: string): ProductLabel {
  const whole = stripEnd(product);
  const co = company ? stripEnd(company) : '';
  // a text that opens with a bracket or a quote mark (the echo safeguard quotes odd text) has no name: it is shown as typed
  if (/^\s*[\[\u201C"'\u2018]/.test(whole) && !(co && whole.toLowerCase().startsWith(co.toLowerCase()))) return { name: null, rest: whole, whole };
  const dropRepeat = (rest: string, name: string): string => rest.replace(new RegExp(`^${name.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b\\s*[,:\\-\\u2013]?\\s*`, 'i'), '');
  if (co && whole.toLowerCase().startsWith(co.toLowerCase()) && (whole.length === co.length || /[\s,:\-–]/.test(whole.charAt(co.length)))) {
    return { name: co, rest: whole.slice(co.length).replace(/^[\s,:\-–]+/, ''), whole };
  }
  // a name followed by a bracket: "Gnani.ai Voice AI platform (voice agents, analytics ...)"
  const br = whole.indexOf('(');
  if (br > 0) {
    const before = whole.slice(0, br).trim();
    if (before.split(/\s+/).length >= 1 && before.split(/\s+/).length <= 6) return { name: before, rest: whole.slice(br), whole };
  }
  const sn = shortName(whole);
  if (sn) return { name: sn, rest: dropRepeat(whole.slice(sn.length).replace(/^[\s,:\-–]+/, ''), sn), whole };
  const words = whole.split(/\s+/);
  const joinAt = words.findIndex((w, i) => i >= 1 && JOIN_WORD.test(w));
  if (joinAt >= 2 && joinAt <= 4) return { name: words.slice(0, joinAt).join(' '), rest: whole, whole };
  if (words.length <= 6) return { name: whole, rest: '', whole };
  // a clause that ends at a comma, colon or dash and holds 2 to 8 words is the name ("Zencargo AI-powered digital freight forwarding platform, the AI Freight Forwarder: ...")
  const clause = whole.split(/[,:]|\s[-\u2013]\s/)[0].trim();
  const cw = clause.split(/\s+/);
  if (cw.length >= 2 && cw.length <= 8 && clause.length < whole.length && !JOIN_WORD.test(cw[cw.length - 1]) && !/^(?:an?|the|our|my|your)\b/i.test(clause)) return { name: clause, rest: whole.slice(clause.length).replace(/^[\s,:\-\u2013]+/, ''), whole };
  return { name: null, rest: whole, whole };
}

/** The closing block: what was not given, each with what it would change. One block, at the end, never a placeholder inside the text. */
export function closing(items: Array<[string, string]>): string {
  if (!items.length) return '';
  return `---\n\nTo sharpen this, give:\n${items.map(([give, change]) => `- ${give} (it would change ${change})`).join('\n')}`;
}

/** Final tidy: blank lines collapsed, and a line that repeats an earlier line of 40 characters or more is dropped. */
export function finalise(out: string): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const line of out.replace(/\r/g, '').split('\n')) {
    const key = line.trim().toLowerCase().replace(/\s+/g, ' ');
    if (key.length >= 40 && !/^[|\-#>`\s]/.test(key) && seen.has(key)) continue;
    if (key.length >= 40) seen.add(key);
    kept.push(line);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Page claims: a strength that carries a "(page claim)" label keeps it wherever the strength is quoted. */
export const isClaim = (t: string): boolean => /\((?:page )?claims?\)\s*\.?\s*$/i.test(t);

/** A strength that is a popularity or award claim (nothing a buyer can test). */
export const POPULARITY = /\b(?:used by|world's|leading|trusted by|award\w*|named|ranked|recogni[sz]ed|market share|magic quadrant|visionary|founded|employees|investors?|backed by|headquarter\w*|offices?)\b|\d[\d,]*\+?\s*(?:companies|customers|users|teams|telcos)/i;

// ---------------------------------------------------------------------------------------------------------------------
// Partner kinds by customer segment (partner_architect). The shared list in src/sector-playbooks.ts reads "energy" and "utilities" as manufacturing;
// the kinds below are for the segment as the user typed it. Kinds of company, never names.
interface SegmentKinds { kind: string; partners: string; review: string }
const OWN_SEGMENTS: Array<SegmentKinds & { re: RegExp }> = [
  { re: /\b(?:energy|utilit(?:y|ies)|power (?:generation|distribution)|oil and gas|renewables?)\b/i, kind: 'energy and utilities', partners: 'engineering and technical consultancies that advise utilities, operational technology and grid systems integrators, billing and customer information system integrators', review: 'regulated operators with long approval cycles, where operations, security and finance must all agree' },
];
/** The partner kinds of every customer segment a partner goal names; each piece of the goal (split at commas) is read on its own. */
export function segmentsOfGoal(goal: string): SegmentKinds[] {
  const g = goal.replace(/;?\s*no numeric target given\.?/i, '').trim();
  const after = g.match(/\bamong(?:st)?\s+(.+)$/i);
  const pieces = (after ? after[1] : g).split(/,|;/).map((x) => x.trim()).filter(Boolean);
  const out: SegmentKinds[] = [];
  const add = (s: SegmentKinds): void => { if (!out.some((o) => o.kind === s.kind)) out.push(s); };
  for (const piece of pieces) {
    for (const o of OWN_SEGMENTS) if (o.re.test(piece)) add(o);
    const rest = OWN_SEGMENTS.reduce((t, o) => t.replace(new RegExp(o.re.source, 'gi'), ' '), piece);
    for (const k of segmentKinds(rest)) add({ kind: k.kind, partners: k.partners, review: k.review });
  }
  return out;
}
