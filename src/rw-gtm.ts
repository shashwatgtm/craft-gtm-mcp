// Run 22 (writer cg-w1): helpers of the rewritten competitive_intel, partner_architect and craft_gtm_analyzer. Plain text helpers only: clean
// sentences from typed phrases, the name of a product that is not cut, the one closing block that asks for what was not given, and the partner
// kinds of a customer segment. Sector knowledge itself stays in src/verticals.ts and src/sector-playbooks.ts (rule B82); the lines here are kinds
// of company and ways of working, never a figure, a market size or a named company.
import { shortName } from './context.js';
import { segmentKinds } from './sector-playbooks.js';
import { BUYER_CONTEXTS } from './verticals.ts';

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
    // a comma inside a number (60,000) is not a break
    const lastBreak = (m: string): number => { let i = head.lastIndexOf(m); while (i > 0 && m === ',' && /\d/.test(head[i - 1] ?? '') && /\d/.test(t[i + 1] ?? '')) i = head.lastIndexOf(m, i - 1); return i; };
    const at = Math.max(...marks.map(lastBreak));
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
  if (co && whole.toLowerCase().startsWith(co.toLowerCase()) && (whole.length === co.length || /[\s,:\-\u2013]/.test(whole.charAt(co.length)))) {
    return { name: co, rest: whole.slice(co.length).replace(/^[\s,:\-\u2013]+/, ''), whole };
  }
  // a name followed by a bracket: "Voxa.ai Voice AI platform (voice agents, analytics ...)"
  const br = whole.indexOf('(');
  if (br > 0) {
    const before = whole.slice(0, br).trim();
    if (before.split(/\s+/).length >= 1 && before.split(/\s+/).length <= 6) return { name: before, rest: whole.slice(br), whole };
  }
  const sn = shortName(whole);
  if (sn) return { name: sn, rest: dropRepeat(whole.slice(sn.length).replace(/^[\s,:\-\u2013]+/, ''), sn), whole };
  const words = whole.split(/\s+/);
  const joinAt = words.findIndex((w, i) => i >= 1 && JOIN_WORD.test(w));
  if (joinAt >= 2 && joinAt <= 4) return { name: words.slice(0, joinAt).join(' '), rest: whole, whole };
  if (words.length <= 6) return { name: whole, rest: '', whole };
  // a clause that ends at a comma, colon or dash and holds 2 to 8 words is the name ("Lanehop AI-powered route planning platform, the dispatch assistant: ...")
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
export const POPULARITY = /\b(?:used by|world's|leading|trusted by|award\w*|named|ranked|recogni[sz]ed|market share|magic quadrant|visionary|founded|employees|investors?|backed by|headquarter\w*|offices?)\b|\bseries [a-e]\b|\bfunding\b|\braised\b|\$\s?\d[\d.,]*\s*(?:million|billion|m|bn)\b|\d[\d,.]*\s?(?:k|m|bn|b|lakh|crore|million|billion)?\+?\s*(?:companies|customers|users|teams|telcos|businesses|sellers|merchants|brands|enterprises|developers|installs|downloads)/i;

// ---------------------------------------------------------------------------------------------------------------------
// Partner kinds (partner_architect). Kinds of company, never names, never a figure. Three sources are combined: the partner model (who refers, resells,
// integrates or implements in general), what the product does (cue words in its own description), and the buyer segments named in the goal.
export interface SegmentKinds { name: string; partners: string; buying: string; resellers?: string; motion?: string; risks?: string }
const buyingOf = (id: string): string => BUYER_CONTEXTS.find((c) => c.id === id)?.buying ?? '';
const SEGMENTS: Array<SegmentKinds & { re: RegExp }> = [
  { re: /\b(?:banks?|banking|bfsi|financial[ _]services?|insur\w+|lenders?|lending|nbfc|fintech)\b/i, name: 'banks and financial services', partners: 'risk and compliance consultancies, core banking and payments integrators, audit and advisory firms', buying: buyingOf('financial') },
  { re: /\b(?:government|public[ _]sector|ministr\w+|municipal\w*|defen[cs]e|state[- ]owned|public authorit\w+)\b/i, name: 'government and public sector', partners: 'systems integrators that hold public sector frameworks or approved supplier status, local resellers that hold the procurement vehicles, government technology advisers', buying: buyingOf('public-sector') },
  { re: /\b(?:retail\w*|e-?commerce|d2c|online (?:retailers?|sellers?|stores?|brands?)|merchants?|marketplaces?|consumer brands?)\b/i, name: 'retail and e-commerce', partners: 'retail technology integrators, e-commerce platform agencies, point of sale and store technology vendors', buying: buyingOf('retail') },
  { re: /\b(?:fmcg|cpg|consumer goods|food and beverages?|food (?:&|and) drink|beverages?|packaged goods|grocery)\b/i, name: 'consumer goods and food', partners: 'supply chain and logistics consultancies, ERP and distributor system integrators, sourcing and merchandising advisers', resellers: 'route to market consultancies and trade marketing agencies', buying: buyingOf('consumer-goods') },
  { re: /\b(?:manufactur\w*|automotive|chemicals?|industrial|steel|aerospace|machinery|plants?|factory|factories)\b/i, name: 'manufacturing', partners: 'supply chain and logistics consultancies, ERP and transport system integrators, procurement and sourcing advisers that serve manufacturers', resellers: 'regional resellers close to the plants', buying: buyingOf('industrial') },
  { re: /\b(?:energy|utilit(?:y|ies)|power (?:generation|distribution)|oil and gas|renewables?)\b/i, name: 'energy and utilities', partners: 'engineering and technical consultancies that advise utilities, operational technology and grid systems integrators, billing and customer information system integrators', buying: 'Regulated operators have long approval cycles, and operations, security and finance must all agree.' },
  { re: /\b(?:3pl|courier|logistics|transport\w*|freight|shipping|supply chain|distribution)\b/i, name: 'logistics and distribution', partners: 'logistics and supply chain consultancies, transport, warehouse and ERP integrators, freight and carrier networks that advise shippers', buying: 'Operations leaders own service levels to their own customers, and thin margins make the cost of change visible.' },
  { re: /\b(?:telecom\w*|communications?|isps?)\b/i, name: 'telecom', partners: 'OSS and BSS integrators, network and platform consultancies', buying: buyingOf('telecom-media') },
  { re: /\b(?:media|publishing|broadcast\w*|entertainment)\b/i, name: 'media and publishing', partners: 'agency and ad-tech integrators, content platform vendors, billing and subscription consultancies', buying: 'Many titles or channels, subscription and advertising revenue to reconcile, and finance and product teams that share the decision.' },
  { re: /\b(?:education|schools?|universit\w*|colleges?|edtech|coaching|institutes?)\b/i, name: 'education', partners: 'education technology integrators, admissions and student system consultants, resellers that already sell to institutions', buying: buyingOf('education') },
  { re: /\b(?:construction|civil|infrastructure|contractors?)\b/i, name: 'construction and infrastructure', partners: 'construction ERP and project controls integrators, construction technology consultancies', buying: buyingOf('construction') },
  { re: /\b(?:games?|gaming)\b/i, name: 'games', partners: 'game services studios, live operations and backend service providers, publisher partnership teams', buying: buyingOf('gaming') },
  { re: /\b(?:software|saas|technology|tech companies|ai companies|startups?|scale-?ups?|developers?|(?:web|mobile)(?: (?:and|&) (?:web|mobile))? apps?|app (?:makers|developers))\b/i, name: 'software and technology companies', partners: 'app and web development agencies, technology consultancies, cloud marketplaces, managed service providers', buying: buyingOf('technology') },
];
// How a first account usually runs in each segment, and what its buyers fear (the risks come from the buyer contexts of the shared sector file).
const MOTION: Record<string, [string, string]> = {
  'banks and financial services': ['the risk review and the security questionnaire started early', 'financial'],
  'government and public sector': ["the tender or framework route set by the buyer's process", 'public-sector'],
  'retail and e-commerce': ['a trial on live orders', 'retail'],
  'consumer goods and food': ['a pilot in one region judged against a comparable region', 'consumer-goods'],
  'manufacturing': ['a pilot at one plant, lane or supplier', 'industrial'],
  'energy and utilities': ['approval from operations, security and finance together', ''],
  'logistics and distribution': ['a pilot on one lane or customer', ''],
  'telecom': ['a staged rollout with a fallback for each stage', 'telecom-media'],
  'media and publishing': ['a trial on one title or channel', ''],
  'education': ['a rollout that is live before the intake', 'education'],
  'construction and infrastructure': ['a pilot on one live project', 'construction'],
  'games': ['a trial timed around a release', 'gaming'],
  'software and technology companies': ['a trial by engineering before the security review', 'technology'],
};
const risksOf = (name: string): string => { const id = MOTION[name]?.[1]; return (id && BUYER_CONTEXTS.find((c) => c.id === id)?.risks) || ''; };
/** The partner kinds of every customer segment a partner goal names (each comma piece after "among" is read on its own), and the pieces for which no kinds are known. */
export function segmentsOfGoal(goal: string, productText = '', partnerModel = 'referral'): { found: SegmentKinds[]; unknown: string[] } {
  const g = goal.replace(/;?\s*no numeric target given\.?/i, '').trim();
  const after = g.match(/\bamong(?:st)?\s+(.+)$/i);
  const pieces = (after ? after[1] : g).split(/,|;/).map((x) => x.trim()).filter(Boolean);
  const found: SegmentKinds[] = []; const unknown: string[] = [];
  const plant = /\b(?:plant|factory|shop ?floor|mes|scada|industrial automation|machine)\b/i.test(productText);
  for (const piece of pieces) {
    let hit = false;
    // investment institutions keep the shared list (the independence caution depends on them)
    for (const k of segmentKinds(piece)) if (k.kind === 'investment institutions' && !found.some((o) => o.name === k.kind)) { found.push({ name: k.kind, partners: k.partners, buying: k.review }); hit = true; }
    for (const seg of SEGMENTS) {
      if (!seg.re.test(piece)) continue;
      hit = true;
      if (found.some((o) => o.name === seg.name)) continue;
      const base = plant && seg.name === 'manufacturing' ? `plant automation integrators, ${seg.partners}` : seg.partners;
      found.push({ name: seg.name, partners: seg.resellers && /^(?:reseller|oem_white_label)$/.test(partnerModel) ? `${base}, ${seg.resellers}` : base, buying: seg.buying, motion: MOTION[seg.name]?.[0], risks: risksOf(seg.name) });
    }
    if (!hit && after) unknown.push(piece);
  }
  return { found, unknown };
}

/** Who refers, resells, integrates or implements in general, by partner model (used when the sector is not read from the product). */
export const MODEL_KINDS: Record<string, string> = {
  referral: 'advisers and consultants who already help your buyers choose suppliers, and companies that sell a neighbouring product to the same buyers',
  affiliate: 'communities, publishers and review sites that your buyers already read',
  reseller: 'regional resellers and distributors that already sell to your buyers\' teams',
  integration_tech: 'vendors whose products your buyers use next to yours and that can connect to yours through an interface',
  agency_si: 'implementation agencies and systems integrators that set up and run products like yours for their clients',
  oem_white_label: 'software and device makers whose own product would be better with yours built in',
};

// What the product does, read from its own description: cue words and the kinds of partner that go with them.
const PRODUCT_CUES: Array<{ re: RegExp; does: string; partners: string }> = [
  { re: /\b(?:locali[sz]\w+|translat\w+|multilingual|languages?)\b/i, does: 'languages and localisation', partners: 'localisation and translation agencies, global content and marketing agencies, and product and engineering teams that already ship in many markets' },
  { re: /\b(?:visibility|tracking|shipments?|freight|supply chain|logistics|carriers?)\b/i, does: 'shipments and supply chains', partners: 'supply chain and logistics consultancies, transport and order system integrators, and carrier and freight networks that advise shippers' },
  { re: /\b(?:testing|test automation|qa|quality assurance|browsers?|devices?)\b/i, does: 'software testing', partners: 'quality engineering and test consultancies, DevOps agencies, and engineering service firms that run releases for clients' },
  { re: /\b(?:voice|speech|conversation\w*|contact cent(?:re|er)s?|call cent(?:re|er)s?|telephony)\b/i, does: 'voice and conversations', partners: 'contact centre and conversation platform providers, voice and telephony integrators, and customer experience consultancies' },
  { re: /\b(?:billing|invoic\w+|subscriptions?|revenue recogni\w+|dunning)\b/i, does: 'billing and revenue', partners: 'finance systems integrators, ERP and accounting consultancies, and fractional finance firms' },
  { re: /\b(?:security|phishing|threat|vulnerabilit\w+|identity|attack surface|dark web)\b/i, does: 'security', partners: 'managed security service providers, security consultancies, and IT resellers that sell to security teams' },
  { re: /\b(?:sd-?wan|mpls|leased lines?|connectivity|iot|sims?|esims?|broadband)\b/i, does: 'connectivity', partners: 'network integrators, managed service providers, and builders of connected-device solutions' },
  { re: /\b(?:payments?|payment gateway|checkout|cards?|payouts?)\b/i, does: 'payments', partners: 'payments consultancies, e-commerce platform agencies, and ERP and finance integrators' },
  { re: /\b(?:databases?|data platform|kafka|postgres\w*|analytics|data warehouse|observability)\b/i, does: 'data', partners: 'data engineering consultancies, cloud partners and marketplaces, and managed service providers' },
  { re: /\b(?:ci\/cd|devops|pipelines?|source code|developer tools?|apis?|sdks?)\b/i, does: 'developer workflows', partners: 'DevOps and platform engineering consultancies, cloud marketplaces, and software houses that build for clients' },
  { re: /\b(?:crm|sales automation|field sales|distributor|retail execution)\b/i, does: 'sales operations', partners: 'CRM and ERP integrators, route to market consultancies, and trade marketing agencies' },
  { re: /\b(?:ai|a\.i\.|llms?|machine learning|language models?|ai agents?|copilots?|generative)\b/i, does: 'AI', partners: 'AI and data consultancies, systems integrators that deploy AI for enterprises, and cloud marketplaces and model platforms that list AI products' },
  { re: /\b(?:support|ticket\w*|help ?desk|customer service)\b/i, does: 'customer support', partners: 'customer experience consultancies, helpdesk and CRM integrators, and outsourcing providers that run support for brands' },
];
// Stems that a company or product NAME may hold ("Lokalize" is "localize" with a k, "Cargotrail" holds "cargo"); read only from the names, and said to be read from the name.
const NAME_STEMS: Array<[RegExp, string]> = [
  [/locali[sz]|translat|lingu/, 'languages and localisation'], [/cargo|freight|shipp|logist|fleet|parcel|haul/, 'shipments and supply chains'], [/phish|cyber|secur|threat|shield/, 'security'],
  [/voice|speech|speak|\bvox/, 'voice and conversations'], [/payment|payroll|wallet|checkout/, 'payments'], [/billing|invoic|ledger/, 'billing and revenue'],
];
/** The kinds of partner that the product's own words point to (at most three); a kind read only from a company or product name is marked. */
export function productKinds(text: string, names = ''): Array<{ does: string; partners: string; fromName: boolean }> {
  const out: Array<{ does: string; partners: string; fromName: boolean }> = PRODUCT_CUES.filter((c) => c.re.test(text)).slice(0, 3).map((c) => ({ does: c.does, partners: c.partners, fromName: false }));
  const nm = names.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
  const nmk = nm.replace(/k/g, 'c');
  for (const [re, does] of NAME_STEMS) {
    if (out.length >= 3 || out.some((o) => o.does === does) || !(re.test(nm) || re.test(nmk))) continue;
    const cue = PRODUCT_CUES.find((c) => c.does === does);
    if (cue) out.push({ does, partners: cue.partners, fromName: true });
  }
  return out;
}
