import { cap } from './utils.js';
import { readContext, splitItems, splitPhrases, splitTopLevel, q, answerFor, type Vertical } from './context.js';
import { stripEnd, sentence, lc, listAnd, clauseCut, productLabel, closing, finalise, isClaim, POPULARITY, type ProductLabel } from './rw-gtm.js';

// The name a competitor is mentioned by in running text: the name without a trailing description in brackets.
const shortOf = (comp: string): string => comp.replace(/\s*\(.*\)\s*$/, '').trim() || comp;

// Run 19 (D80, problem 3): each competitor detail goes to the competitor it names, and only to that one. A piece that names two
// competitors is cut at each name; a piece that names none is kept apart as a general detail.
function assignDetails(details: string, competitors: string[]): { byCompetitor: Record<string, string[]>; general: string[] } {
  const byCompetitor: Record<string, string[]> = {};
  const general: string[] = [];
  const names = competitors.map((c) => ({ comp: c, short: shortOf(c) }));
  const pieces = details.split(/\n|;|(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.trim().replace(/[.]$/, '')).filter(Boolean);
  for (const piece of pieces) {
    const hits = names
      .map((n) => ({ ...n, at: piece.toLowerCase().indexOf(n.short.toLowerCase()) }))
      .filter((h) => h.at >= 0)
      .sort((a, b) => a.at - b.at);
    if (!hits.length) { general.push(piece); continue; }
    hits.forEach((h, i) => {
      const start = i === 0 ? 0 : h.at;
      const end = i + 1 < hits.length ? hits[i + 1].at : piece.length;
      const part = piece.slice(start, end).trim().replace(/[,\s]+(?:and|but)?$/i, '').trim();
      if (part) (byCompetitor[h.comp] ??= []).push(part);
    });
  }
  return { byCompetitor, general };
}

// a light plural stem, so "country" and "countries" or "report" and "reports" are the same word
const stem = (w: string): string => w.replace(/ies$/, 'y').replace(/(?:es|s)$/, (m, off: number) => (w.length - m.length >= 4 ? '' : m));
const words = (t: string): string[] => (t.toLowerCase().match(/[a-z]{5,}/g) || []).map(stem);

// Topics that connect an objection to a strength or a detail even when they share no word ("how long does it take to set up" and
// "implementation in a few days"). A strength answers an objection when they share a topic or a word of five letters or more.
const TOPICS: Array<[string, RegExp]> = [
  ['setup', /\b(?:set[- ]?up|implementation|implement\w*|go[- ]?live|onboard\w*|deploy\w*|roll ?out|how long|weeks?|days?|migrat\w*)\b/i],
  ['price', /\b(?:price|prices|pricing|cost|costs|expensive|cheap\w*|budget|fees?)\b/i],
  ['security', /\b(?:security|secure|compliance|complian\w*|certif\w*|iso ?27001|soc ?[12]|pci|gdpr|privacy|audit\w*|itil|empanel\w*)\b/i],
  ['integration', /\b(?:integrat\w*|erp|crm|apis?|connect\w*|salesforce|netsuite|sap|sync\w*|oms|wms|tms|dms)\b/i],
  ['reliability', /\b(?:uptime|sla|availability|reliab\w*|outage\w*|99\.\d+|downtime)\b/i],
  ['scale', /\b(?:enterprise|scal\w*|large|volume|robust\w*|global)\b/i],
  ['offline', /\b(?:offline|no network|without a mobile network|remote areas?|low connectivity)\b/i],
  ['coverage', /\b(?:all types|every type|models?|trade|segments?|regions?|languages?|sources?)\b/i],
  ['support', /\b(?:support|service desk|24x7|help ?desk|expert)\b/i],
  ['accuracy', /\b(?:accura\w*|explain\w*|black box|trust\w*|evidence|validat\w*|detect\w*)\b/i],
  ['compliance-rev', /\b(?:asc ?606|ifrs ?15|revenue recogni\w*)\b/i],
];
const topicsOf = (t: string): Set<string> => new Set(TOPICS.filter(([, re]) => re.test(t)).map(([n]) => n));
const STOP = new Set(['does', 'doesnt', 'with', 'what', 'which', 'your', 'this', 'that', 'than', 'from', 'over', 'the', 'and', 'for', 'how', 'why', 'our', 'are', 'can', 'not', 'only', 'when', 'into', 'any']);
const toks = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w)).map(stem));
const longWords = (t: string): Set<string> => new Set(words(t));
function related(a: string, b: string): boolean {
  const ta = topicsOf(a); const tb = topicsOf(b);
  for (const t of ta) if (tb.has(t)) return true;
  const wa = longWords(a); for (const w of longWords(b)) if (wa.has(w)) return true;
  return false;
}
// A competitor typed as a description of an approach ("manual excel based routing ...") rather than a name.
const isDescription = (c: string): boolean => shortOf(c).split(/\s+/).length > 4 || /^[a-z]/.test(shortOf(c));
// A competitor detail says either where the competitor is weak ("manual tracking causes missed visits") or where it is ahead ("cheaper", "bundles a free app").
const AHEAD = /\b(?:strong(?:er)?|cheaper|cheap|better|faster|bundl\w*|free|larger|bigger|leader|established|incumbent|more (?:mature|complete)|wider|broader|lower (?:price|cost)|well[- ]known|trusted)\b/i;
const WEAK = /\b(?:break\w*|brok\w*|stuck|errors?|wrong|leak\w*|late|slow\w*|manual\w*|miss\w*|fail\w*|cause[sd]?|lack\w*|no|not|only|cannot|can't|constraint|drift|delays?|expensive|costly|overpriced|siloed|static|black box|fragile|legacy|fragmented|difficult|hard|bypassed|sluggish|congested|disconnect\w*|isolated|periodic|accumulates?)\b/i;
function sideOf(detail: string): 'weak' | 'ahead' | 'neutral' {
  const a = AHEAD.test(detail); const w = WEAK.test(detail);
  return w && !a ? 'weak' : a && !w ? 'ahead' : 'neutral';
}

// A list of strengths or weaknesses: one item per line or per semicolon when the text has them (commas stay inside an item); else a comma run read by splitPhrases.
function splitList(text: string): string[] {
  return /[;\n]/.test(text) ? text.split(/\n|;/).map((x) => x.trim().replace(/^[-*\u2022]\s*/, '')).filter(Boolean) : splitPhrases(text);
}
// Objections are typed as a comma list ("too expensive, missing X feature, competitor has better Y"). A question mark followed by a comma ends an objection
// (a semicolon inside it is then part of it); else every top level comma starts a new objection, unless the piece opens with a joining word ("but teams
// already own too many tools"), which continues the one before; a text with no comma is split at semicolons.
function splitObjections(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split('\n').map((x) => x.trim()).filter(Boolean)) {
    if (/\?\s*,\s*\S/.test(line)) { out.push(...line.split(/(?<=\?)\s*,\s*/).map((x) => x.trim()).filter(Boolean)); continue; }
    const commas = splitTopLevel(line, false);
    if (commas.length === 1 && line.includes(';')) { out.push(...line.split(';').map((x) => x.trim()).filter(Boolean)); continue; }
    const merged: string[] = [];
    for (const piece of commas) {
      if (merged.length && /^(?:which|with|but|so|that|where|from|because|including|plus|while|then)\b/i.test(piece)) merged[merged.length - 1] += `, ${piece}`;
      else merged.push(piece.replace(/^(?:and|or)\s+(?=\S+\s+\S+)/i, ''));
    }
    out.push(...merged);
  }
  return out;
}

type ObjKind = 'price' | 'comparison' | 'timing' | 'capability' | 'risk' | 'other';

// A description of an approach, named in running text by its leading noun phrase ("a managed streaming service" for "a managed streaming service built on
// a vendor-specific Kafka distribution"); the whole text when it is short; else "alternative N".
function descRef(raw: string, i: number): string {
  const t = stripEnd(raw).replace(/^(\w+(?:\s+\w+)?);\s+/, '$1, ');
  const m = t.match(/^(.+?)\s+(?:that|which|who|tied|built|moved|kept|bundled|sold|offered|provided|supplied|working|requests?|requesting|relying|without|through|across|with|using|based|where|run|written|made)\b/i);
  const head = m && !/(?:ed|ing|by|of|to|and|or|the|an?)$/i.test(m[1]) ? m[1] : t;
  if (head.split(/\s+/).length >= 2 && head.length <= 60 && (head.length < t.length || t.length > 60)) return lc(head);
  return t.length <= 90 ? lc(t) : `alternative ${i + 1}`;
}

// One alternative the seller named: a name (optionally with a note in brackets) or a description of an approach.
interface Comp { raw: string; name: string; desc: boolean; ref: string; heading: string; notes: string[]; weak: string[]; ahead: string[] }

export function generateCompetitiveIntel(args: {
  your_product: string;
  competitors: string;
  your_strengths?: string;
  your_weaknesses?: string;
  competitor_details?: string;
  common_objections?: string;
  recent_wins?: string;
  recent_losses?: string;
  business_model?: string;
  industry?: string;
}): string {
  const competitorsRaw = splitTopLevel(args.competitors, false);
  const wins = splitItems(args.recent_wins);
  const losses = splitItems(args.recent_losses);
  const objections = args.common_objections ? splitObjections(args.common_objections) : [];
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [args.your_product, args.your_strengths], context: [args.competitors, args.competitor_details, args.common_objections, args.recent_wins, args.recent_losses] });
  const v = ctx.v;

  // Strengths: the ones you gave, else your own words from your wins (Run 19, D80, problem 7: a win phrase is never turned into a claim you did not make).
  // A claim label typed at the end of the strengths ("(page claims)") stays on every strength.
  const claimLabel = args.your_strengths && isClaim(args.your_strengths) ? ' (page claims)' : '';
  const fromWins = !args.your_strengths && wins.length > 0;
  const S: string[] = args.your_strengths ? splitList(args.your_strengths).map(cap).map((x) => (claimLabel && !/\((page )?claims?\)/i.test(x) ? x + claimLabel : x)) : wins.map(cap);
  const fromLosses = !args.your_weaknesses && losses.length > 0;
  const W: string[] = args.your_weaknesses ? splitList(args.your_weaknesses).map(cap) : losses.map(cap);
  const label = productLabel(args.your_product);
  const nameText = label.name ?? 'your solution';

  const { byCompetitor, general } = args.competitor_details ? assignDetails(args.competitor_details, competitorsRaw) : { byCompetitor: {} as Record<string, string[]>, general: [] as string[] };
  const generalLeft: string[] = [];
  for (const g of general) {
    if (competitorsRaw.length === 1) { (byCompetitor[competitorsRaw[0]] ??= []).push(g); continue; }
    const hit = competitorsRaw.map((c) => ({ c, n: [...toks(g)].filter((w) => toks(c).has(w)).length })).sort((x, y) => y.n - x.n)[0];
    // else the one competitor that shares a word of eight letters or more that no other competitor's text has ("spreadsheets")
    const unique = competitorsRaw.filter((c) => [...longWords(g)].some((w) => w.length >= 8 && longWords(c).has(w) && !competitorsRaw.some((o) => o !== c && longWords(o).has(w))));
    const sharing = competitorsRaw.filter((c) => [...toks(g)].filter((w) => toks(c).has(w)).length >= 2);
    // a detail that several alternatives share words with goes to the one it shares most with (the first on a tie), so no card repeats another
    const best = sharing.map((c) => ({ c, n: [...toks(g)].filter((w) => toks(c).has(w)).length })).sort((x, y) => y.n - x.n)[0];
    if (hit && hit.n >= 2 && best) (byCompetitor[best.c] ??= []).push(g);
    else if (unique.length === 1) (byCompetitor[unique[0]] ??= []).push(g);
    else generalLeft.push(g);
  }

  const comps: Comp[] = competitorsRaw.map((raw0, i) => {
    const raw = raw0;
    const desc = isDescription(raw);
    const name = shortOf(raw);
    const paren = raw.match(/\(([^)]*)\)\s*$/);
    const notes = [...(paren && !desc && stripEnd(paren[1]) ? [`You describe ${name} as ${stripEnd(paren[1])}`] : []), ...(byCompetitor[raw] || [])];
    const ref = desc ? descRef(raw, i) : name;
    const heading = desc && stripEnd(raw).length > 90 ? `alternative ${i + 1}` : desc ? lc(stripEnd(raw)).replace(/^(\w+(?:\s+\w+)?);\s+/, '$1, ') : name;
    return { raw, name, desc, ref, heading, notes, weak: notes.filter((x) => sideOf(x) === 'weak'), ahead: notes.filter((x) => sideOf(x) === 'ahead') };
  });
  const metricFor = (i: number): string => (v ? v.metrics[i % v.metrics.length] : 'time or cost');
  const testable = S.filter((x) => !POPULARITY.test(x));
  const sayList = (items: string[]): string => items.map((x) => lc(stripEnd(x))).join('; ');
  const claimOnly = (items: string[]): boolean => items.length > 0 && items.every(isClaim);
  const answersFor = (text: string): string[] => S.filter((s) => related(text, stripEnd(s)));
  const leadFor = (c: Comp, i: number): string[] => {
    // popularity and company-fact claims (users, awards, funding) answer no alternative: when they are all there is, no card leads with them
    if (!testable.length) return [];
    const rel = S.filter((s) => related(stripEnd(s), c.raw) || c.notes.some((n) => related(s, n)));
    if (rel.length) return rel.slice(0, 3);
    const pool = [...testable, ...S.filter((x) => !testable.includes(x))];
    return pool.length <= 2 ? pool : [pool[(i * 2) % pool.length], pool[(i * 2 + 1) % pool.length]];
  };

  // ---- discovery mode: only a product and competitors (and perhaps notes about them) were given ----
  if (!args.your_strengths && !args.your_weaknesses && wins.length === 0 && losses.length === 0 && objections.length === 0) {
    return discoveryDraft(args, comps, generalLeft, ctx.line, v, label, ctx.how);
  }

  // ---- the objection handlers ----
  const kindOf = (objection: string, named: Comp | undefined): ObjKind => {
    const o = objection.toLowerCase();
    if (/\b(price|prices|pricing|expensive|cost|costs|budget|cheaper|cheap)\b/.test(o)) return 'price';
    if (named || /\b(differ\w*|different|versus|vs|compared? (?:to|with)|instead of|why (?:\w+ ){0,3}over|better than|competitors?|alternatives?|other (?:vendors?|options?|tools?)|rivals?)\b/.test(o)) return 'comparison';
    if (/\b(timing|not ready|ready|later|next year|not now|right now|this quarter)\b/.test(o)) return 'timing';
    if (/\b(features?|can't|cannot|doesn't|does it|do you|does .* support|missing|lack|lacks|lacking|support|how long|how quickly|how fast|take to)\b/.test(o) || /^\s*(?:does|do|can|is|are|will)\b/.test(o)) return 'capability';
    if (/\b(risk|risky|trust|new|proven|unproven)\b/.test(o)) return 'risk';
    return 'other';
  };
  const said = new Set<string>();
  // the first variant of a spoken sentence that no earlier line of this answer used; none left means the line is left out (no sentence is said twice)
  const pick = (variants: string[], fallback = ''): string => { const v1 = variants.find((x) => !said.has(x)) ?? (fallback && !said.has(fallback) ? fallback : ''); if (v1) said.add(v1); return v1; };
    const handleObjection = (objection: string): { approach: string; say: string; need: string; hasEvidence: boolean } => {
    const o = objection.toLowerCase();
    const named = comps.find((c) => (!c.desc && o.includes(c.name.toLowerCase())) || [...toks(objection)].filter((w) => toks(c.raw).has(w)).length >= 2);
    const kind = kindOf(objection, named);
    const matched = answersFor(objection);
    const useful = matched.length ? matched : named ? (testable.length ? testable : S).slice(0, 2) : [];
    const weakOf = named ? named.weak : [];
    const counterFor: Partial<Record<ObjKind, boolean>> = { price: true, timing: true, risk: true };
    const leadForms: [string, string] = claimOnly(useful.slice(0, 2)) ? ['On that, our own materials say', 'our own materials say'] : kind === 'comparison' ? ['Set against the alternatives, I can point to', 'I can point to'] : ['What I can tell you today is', 'what I can tell you today is'];
    const quoted = stripEnd(objection).length <= 70 ? q(objection) : 'this point';
    const evidence = useful.length
      ? pick([`${leadForms[0]}: ${sayList(useful.slice(0, 2))}.`, `On ${quoted}, ${leadForms[1]}: ${sayList(useful.slice(0, 2))}.`])
      : counterFor[kind] ? ''
      : pick([`On ${quoted} I would rather give you an accurate answer than a guess, so I will confirm the specifics and come back to you.`, 'I would rather confirm the facts than guess, and I will come back to you.']);
    const weakLine = useful.length && weakOf.length ? pick([`Against ${named!.ref} specifically, we have seen ${stripEnd(weakOf[0])}.`]) : '';
    const ACK: Record<ObjKind, string[]> = {
      price: ['I understand that budget matters.', 'Cost is a fair thing to ask about.', 'It is right to look at the price carefully.'],
      comparison: ['It makes sense to compare your options properly.', 'Comparing options is the right thing to do.', 'You should hold us up against the alternatives.'],
      timing: ['Timing matters, and it is worth getting right.', 'Getting the timing right is important.'],
      capability: ['That is a fair question.', 'Good to ask that before deciding.', 'It is right to check that.'],
      risk: ['De-risking a decision like this is sensible.', 'Wanting less risk is reasonable.'],
      other: ['Thank you for raising that.', 'I am glad you said that.', 'That is useful to hear.'],
    };
    const COUNTER: Record<ObjKind, string[]> = {
      price: ['Let us agree what the problem costs you today, then compare the price with that.', 'Set the price against what the problem costs today, not against zero.', 'The useful comparison is the price against the cost of leaving things as they are.'],
      comparison: [], capability: [], other: [],
      timing: ['Find the event that makes it urgent for you (a renewal, an audit, a season or a target) and plan back from it.', 'Work back from the date that matters to you and see what has to start when.'],
      risk: ['I would suggest we agree in writing what success looks like before anything is signed.', 'A small first step with success criteria written down limits your exposure.'],
    };
    const setupQ = /\b(how long|how quickly|how fast|take to)\b/.test(o);
    const REDIRECTS: Record<ObjKind, string[]> = {
      price: ['What would it cost your team to leave this problem unsolved?', 'If the problem stays as it is for another year, what does that cost you?', 'What is the problem costing you each quarter today?'],
      comparison: ['What matters most to you in making this decision?', 'Which of the options on your list worries you most, and why?', 'What would make you choose one option over another?'],
      timing: ['What would need to change for the timing to feel right?', 'What would have to happen first for you to start?', 'Which date or event is driving your timing?'],
      capability: setupQ ? ['What date would you need this to be live by?', 'Which launch or deadline sets that date?', 'Who on your side has to be ready for that date?'] : ['How critical is that capability compared with the outcome you want to reach?', 'What would you do today if that capability were missing?', 'Which part of your process depends on it most?'],
      risk: ['What would help you feel confident in moving forward?', 'What would a successful pilot have to show you?', 'Who else needs to be convinced, and what do they look for?'],
      other: ['Can you tell me more about why that matters in your situation?', 'What is behind that for you?', 'What would you need to see to set that worry aside?'],
    };
    const redirect = pick(REDIRECTS[kind], `What would settle ${quoted} for you?`);
    const rest = objection.replace(/^\s*(?:does|do|can|is|are|will|how|why|what|which)\s+/i, '').replace(/[?]+$/, '');
    const need = /^\s*how (?:long|quickly|fast)\b|\btake to\b/i.test(objection) ? 'the real elapsed time from signature to go-live for a customer like this buyer, and the case it was measured on'
      : /\b(differ\w*|different)\b|^\s*why\b/i.test(objection) ? 'two or three concrete differences a buyer can check for themselves, in your own words'
      : /^\s*(?:does|do|can|is|are|will)\b/i.test(objection) ? 'a yes or no to this exact question, with any limits and the date it applies from'
      : /\b(price|cost|expensive|budget|cheap\w*)\b/i.test(o) ? 'the price or range you can quote and what it includes'
      : `the specific fact that settles ${q(rest)}`;
    const pattern = answerFor(objection, v);
    return { approach: /^Ask what lies behind it/.test(pattern) ? '' : pattern, say: [pick(ACK[kind], `On ${quoted}, here is how I see it.`), pick(COUNTER[kind]), evidence, weakLine, redirect].filter(Boolean).join(' '), need, hasEvidence: useful.length > 0 || !!counterFor[kind] };
  };

  // ---- the answer ----
  let out = `# Battle cards: ${nameText}

${ctx.line}

`;
  if (label.name && label.rest && label.rest.toLowerCase() !== label.name.toLowerCase()) out += `**What you sell:** ${label.rest.startsWith('(') ? clauseCut(label.whole, 420) : clauseCut(label.rest, 420)}.\n\n`;
  else if (!label.name) out += `**What you sell:** ${clauseCut(label.whole, 420)}.\n\n`;

  out += `## Where you stand

You are up against ${listAnd(comps.map((c) => (c.desc ? c.ref : c.name)))}.${claimLabel || S.some(isClaim) ? ' Figures marked (page claims) come from your own pages: present them as what your materials say, not as measured results.' : ''}

`;
  if (S.length) out += `**${fromWins ? 'You win, from your recent wins in your own words:' : 'You win on:'}** ${sayList(S)}.\n\n`;
  if (args.your_strengths && wins.length) out += `**Recent wins:** ${sayList(wins)}.\n\n`;
  if (W.length) out += `**${fromLosses ? 'You lose, from your recent losses in your own words:' : 'You lose when:'}** ${sayList(W)}.\n\n`;
  if (args.your_weaknesses && losses.length) out += `**Recent losses:** ${sayList(losses)}.\n\n`;
  if (generalLeft.length) out += `**Across the alternatives:** ${generalLeft.map(sentence).join(' ')}\n\n`;

  const disc = v ? v.discovery : ['Who is affected most by this, and what do they do today to work around it?'];
  const usedQ = new Set<string>();
  const usedWeakQ = new Set<string>();
  comps.forEach((c, i) => {
    const lead = leadFor(c, i);
    const metric = metricFor(i);
    out += `## Against ${c.heading}\n\n`;
    if (c.desc && stripEnd(c.raw).length > 90) out += `You described it as: ${q(c.raw)}.\n\n`;
    if (c.notes.length) out += `**What you know about ${c.ref}:** ${c.notes.map(sentence).join(' ')}\n\n`;
    if (lead.length) out += `**Against ${c.ref}, lead with:** ${sayList(lead)}.\n\n`;
    const gaps = W.filter((w) => related(w, c.raw) || c.notes.some((n) => related(w, n)));
    if (c.ahead.length || gaps.length) {
      out += `**Where ${c.ref} may be ahead:** `;
      if (c.ahead.length) out += `your notes say ${c.ahead.map((x) => lc(stripEnd(x)).replace(/^you describe/i, 'you describe')).map((x) => (x.toLowerCase().startsWith(c.name.toLowerCase()) ? stripEnd(x.charAt(0).toUpperCase() + x.slice(1)) : x)).join('; ')}. Acknowledge that, then move the conversation to ${lead.length ? `this strength: ${lc(stripEnd(lead[0]))}` : 'what you do better'}. `;
      if (gaps.length) out += `Your own gaps that it can use: ${sayList(gaps)}.`;
      out += '\n\n';
    }
    // questions about the buyer's own situation: a weak point of the alternative first, then the sector's discovery questions
    const qs: string[] = [];
    for (const d of c.weak.slice(0, 2)) if (stripEnd(d).length <= 140 && !usedWeakQ.has(d)) { usedWeakQ.add(d); qs.push(`How often does this happen in your operation: ${lc(stripEnd(d))}? How did the last case show up in ${metric}?`); }
    if (!qs.length) qs.push(c.desc ? `How well does your current setup work for you today, measured by ${metric} over the last quarter?` : `How well does ${c.name} work for you today, measured by ${metric} over the last quarter?`);
    for (let k = 0; qs.length < 3 && k < disc.length; k++) { const d = disc[(i * 2 + k) % disc.length]; if (!usedQ.has(d) && !qs.includes(d)) { qs.push(d); usedQ.add(d); } }
    for (let k = 0; qs.length < 3 && k < 6; k++) { const m2 = v ? v.metrics[(i + k) % v.metrics.length] : 'time or cost'; const d = `Who owns the number you track for ${m2}, and how often do they look at it?`; if (!usedQ.has(d)) { qs.push(d); usedQ.add(d); } }
    out += `**Questions to ask the buyer about ${c.ref}:**\n${qs.slice(0, 3).map((x, n) => `${n + 1}. ${x}`).join('\n')}\n\n`;
    if (lead.length || c.weak.length) {
      const claims = claimOnly(lead);
      out += `**${c.desc ? 'Why not stay with the current approach?' : `Why not ${c.name}?`} What to say:**\n\n> "Comparing us with ${c.ref} is fair, and I would rather answer it than dodge it.${lead.length ? ` Against ${c.ref}, ${claims ? 'our own materials say' : 'here is what I can point to'}: ${sayList(lead.slice(0, 2))}.` : ''}${c.weak.length ? ` And on ${c.ref}, what we have seen is: ${stripEnd(c.weak[0])}.` : ''} Which of that would you want to check first against ${c.ref}?"\n\n`;
    }
  });

  out += `## Objection handlers\n\n`;
  const needs: Array<[string, string]> = [];
  if (objections.length === 0) out += `You listed no objections, so the section below holds the ones your sector raises.\n\n`;
  objections.forEach((obj) => {
    const h = handleObjection(obj);
    out += `### "${stripEnd(obj)}"\n\n`;
    if (h.approach) out += `**Approach:** ${h.approach}\n\n`;
    out += `**What to say:**\n\n> "${h.say}"\n\n`;
    if (!h.hasEvidence) needs.push([`a fact that answers "${stripEnd(obj)}": ${h.need}`, 'this answer, which now promises to confirm instead of showing evidence']);
  });
  const missingObjections = v ? v.objections.filter((o) => !objections.some((u) => words(u).filter((w) => words(o.objection).includes(w)).length >= 1)).slice(0, 3) : [];
  if (missingObjections.length) out += `### Objections ${v!.name} buyers often raise that you did not list\n\n${missingObjections.map((o) => `- **${o.objection}:** ${o.response}`).join('\n')}\n\n`;
  if (v) out += `## Who decides in ${v.name}\n\n${v.committee}${v.proofShape ? ` A proof point that lands: ${lc(v.proofShape)}` : ''}\n\n`;

  // ---- what was not given ----
  const asks: Array<[string, string]> = [];
  if (!S.length) asks.push(['your_strengths or recent_wins', 'what each card leads with']);
  if (S.length && !testable.length) asks.push(['your_strengths that a buyer can test, such as a speed, a result or a feature (the claims you gave cannot be tested)', 'what each card leads with']);
  if (!W.length) asks.push(['your_weaknesses or recent_losses', 'the lines on where each alternative may be ahead']);
  const bare = comps.filter((c) => !c.notes.length);
  if (!args.competitor_details) asks.push(['competitor_details: a price, a segment or a known weak point for each alternative', 'the weak points, the questions and the "why not" line on each card']);
  else if (bare.length) asks.push([`competitor_details about ${listAnd(bare.map((c) => c.ref))}`, `the weak points and the questions on ${bare.length === 1 ? 'that card' : 'those cards'}`]);
  if (!objections.length) asks.push(['common_objections: the ones you hear most', 'a written answer for each, in place of the sector list']);
  asks.push(...needs);
  asks.push(['the deals you met and won against each alternative', 'a win rate for each alternative']);
  if (ctx.how === 'sector' || ctx.how === 'unknown') asks.push(['business_model, which these cards read from your sector or text', 'the wording on price, trials and contracts']);
  out += closing(asks);
  return finalise(out);
}

// Discovery draft: the seller named competitors but gave no strengths, weaknesses, objections or deal stories.
function discoveryDraft(args: { your_product: string; competitors: string; competitor_details?: string }, comps: Comp[], generalLeft: string[], contextLine: string, v: Vertical | null, label: ProductLabel, how: string): string {
  const nameText = label.name ?? 'your solution';
  const names = comps.map((c) => c.ref);
  let out = `# Competitive discovery draft: ${nameText}

${contextLine}

You named ${comps.length === 1 ? 'one alternative' : `${comps.length} alternatives`}: ${listAnd(names)}. You have not yet said what you win on, where you lose or which objections you hear, so there is nothing yet to put on a battle card. This draft shows how to find it out, with the questions and objections of ${v ? v.name : 'your sector'} filled in.

`;
  if (comps.some((c) => c.notes.length) || generalLeft.length) {
    out += `## What you know so far\n\n${comps.filter((c) => c.notes.length).map((c) => `**${c.ref}:** ${c.notes.map(sentence).join(' ')}`).join('\n\n')}${generalLeft.length ? `${comps.some((c) => c.notes.length) ? '\n\n' : ''}**Across the alternatives:** ${generalLeft.map(sentence).join(' ')}` : ''}\n\n`;
  }
  const disc = v ? v.discovery : ['Who is affected most by this, and what do they do today to work around it?', 'Who owns the number you track for time or cost, and how often do they look at it?'];
  out += `## Questions for buyers who use each alternative\n\n`;
  comps.forEach((c, i) => {
    const m = v ? v.metrics[i % v.metrics.length] : 'time or cost';
    const a = disc[(i * 2) % disc.length]; const b = disc[(i * 2 + 1) % disc.length];
    out += `**${c.ref}:** ${c.desc ? 'How well does your current setup work for you today' : `How well does ${c.name} work for you today`}, and what has it cost you in ${m} over the last quarter? ${a}${b !== a ? ` ${b}` : ''}\n\n`;
  });
  out += `## Questions for your own sales team

1. Think about your best wins against ${comps[0] ? comps[0].ref : 'the main alternative'}: what did you do right?
2. When a prospect chooses you, what do they say decided it?
3. Which features do you demonstrate that get the best reaction?
4. Which objections come up most often, and which do you struggle to answer?
5. When you lose, what reason does the prospect give?
6. Which alternative do you least like to meet, and why?
7. What do you wish you could say about your product that you cannot say today?

## What to look up on each alternative

${comps.map((c) => (c.desc
    ? `- **${c.ref}:** this is an approach, not a supplier, so there is no website to read: ask buyers how they run it today, what it costs them each quarter and where it breaks.`
    : `- **${c.name}:** what its website claims, what customers praise or complain about in reviews and analyst coverage, which industries and company sizes its case studies show, its pricing if public, and any recent funding, acquisition or launch.`)).join('\n')}

`;
  if (v) out += `## Objections ${v.name} buyers often raise\n\n${v.objections.slice(0, 4).map((o) => `- **${o.objection}:** ${o.response}`).join('\n')}\n\n## A proof point that lands\n\n${sentence(v.proofShape)}\n\n`;
  const asks: Array<[string, string]> = [['your_strengths, your_weaknesses and common_objections, or recent_wins and recent_losses', 'this draft into one battle card for each alternative, with a written answer to each objection']];
  if (!args.competitor_details) asks.push(['competitor_details: what you know of each alternative', 'the weak points and questions on each card']);
  asks.push(['the deals you met and won against each alternative', 'a win rate for each alternative']);
  if (how === 'sector' || how === 'unknown') asks.push(['business_model, which this draft reads from your sector or text', 'the wording on price, trials and contracts']);
  out += closing(asks);
  return finalise(out);
}
