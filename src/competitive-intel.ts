import { parseListItems, lowerFirstIfCommon, cap, EXAMPLE_FIGURE, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, splitPhrases, splitTopLevel, q, qc, answerFor, andList, sectorNotes, shortName, capEcho, type Vertical } from './context.js';

// A comma list that keeps a comma inside brackets: "Competitor A (a global suite, strong on reports), Competitor B".
function splitOutsideBrackets(text: string): string[] {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of text.replace(/\n/g, ',')) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

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

const words = (t: string): string[] => (t.toLowerCase().match(/[a-z]{5,}/g) || []);

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
const longWords = (t: string): Set<string> => new Set(words(t));
function related(a: string, b: string): boolean {
  const ta = topicsOf(a); const tb = topicsOf(b);
  for (const t of ta) if (tb.has(t)) return true;
  const wa = longWords(a); for (const w of longWords(b)) if (wa.has(w)) return true;
  return false;
}
// A competitor typed as a description of an approach ("manual excel based routing ...") rather than a name.
const isDescription = (c: string): boolean => shortOf(c).split(/\s+/).length > 4 || /^[a-z]/.test(shortOf(c));
const lowerFirst = (t: string): string => (/^[A-Z]{2,}\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
// A competitor detail says either where the competitor is weak ("manual tracking causes missed visits") or where it is ahead ("cheaper", "bundles a free app").
const AHEAD = /\b(?:strong(?:er)?|cheaper|cheap|better|faster|bundl\w*|free|larger|bigger|leader|established|incumbent|more (?:mature|complete)|wider|broader|lower (?:price|cost)|well[- ]known|trusted)\b/i;
const WEAK = /\b(?:slow\w*|manual\w*|miss\w*|fail\w*|cause[sd]?|lack\w*|no|not|only|cannot|can't|constraint|drift|delays?|expensive|costly|overpriced|siloed|static|black box|fragile|legacy|fragmented|difficult|hard|bypassed|sluggish|congested|disconnect\w*|isolated|periodic|accumulates?)\b/i;
function sideOf(detail: string): 'weak' | 'ahead' | 'neutral' {
  const a = AHEAD.test(detail); const w = WEAK.test(detail);
  return w && !a ? 'weak' : a && !w ? 'ahead' : 'neutral';
}
const stripEnd = (t: string): string => t.trim().replace(/[.]+$/, '');

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
  const competitors = splitTopLevel(args.competitors, false);
  const wins = splitItems(args.recent_wins);
  const losses = splitItems(args.recent_losses);
  const objections = args.common_objections ? splitPhrases(args.common_objections) : [];
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [args.your_product, args.your_strengths], context: [args.competitors, args.competitor_details, args.common_objections, args.recent_wins, args.recent_losses] });
  
  // Strengths: the ones you gave, else your own words from your wins (Run 19, D80, problem 7: a win phrase is never turned into
  // a claim you did not make, such as "superior customer support"). Run 20: a comma run is split by phrase, never inside one.
  const strengths: string[] = args.your_strengths ? splitPhrases(args.your_strengths).map(cap) : wins.map(cap);
  const weaknesses: string[] = args.your_weaknesses ? splitPhrases(args.your_weaknesses).map(cap) : losses.map(cap);
  const S = strengths;
  const W = weaknesses;

  // If no strengths, weaknesses, AND no objections - return discovery mode
  if (!args.your_strengths && !args.your_weaknesses && wins.length === 0 && losses.length === 0 && objections.length === 0) {
    return generateCompetitiveDiscoveryKit(args.your_product, competitors, ctx.line, ctx.v);
  }
  
  // Competitor details, each to the competitor it names; a detail that names none goes to the competitor whose own words it shares
  // (a description of an approach), else to the only competitor, else it is shown on every card as a detail about the whole category.
  const { byCompetitor, general } = args.competitor_details ? assignDetails(args.competitor_details, competitors) : { byCompetitor: {} as Record<string, string[]>, general: [] as string[] };
  const generalLeft: string[] = [];
  for (const g of general) {
    if (competitors.length === 1) { (byCompetitor[competitors[0]] ??= []).push(g); continue; }
    const hit = competitors.map((c) => ({ c, n: [...longWords(g)].filter((w) => longWords(c).has(w)).length })).sort((x, y) => y.n - x.n)[0];
    // else the one competitor that shares a word of six letters or more that no other competitor's text has ("spreadsheets")
    const unique = competitors.filter((c) => [...longWords(g)].some((w) => w.length >= 6 && longWords(c).has(w) && !competitors.some((o) => o !== c && longWords(o).has(w))));
    if (hit && hit.n >= 2) (byCompetitor[hit.c] ??= []).push(g);
    else if (unique.length === 1) (byCompetitor[unique[0]] ??= []).push(g);
    else generalLeft.push(g);
  }

  const strongFirst = S[0] ? lowerFirst(stripEnd(S[0])) : '';
  const sectorMetric = ctx.v ? ctx.v.metrics[0] : 'the result the buyer measures';
  // The strengths that answer an objection (by topic or shared word), else none
  const answersFor = (objection: string): string[] => S.filter((s) => related(objection, s)).map((s) => stripEnd(s));

  // Generate objection handlers: the strength that answers the objection is used; when none does, the answer says so plainly
  const generateObjectionHandler = (objection: string): { acknowledge: string; counter: string; redirect: string; pattern: string; note: string } => {
    const o = objection.toLowerCase();
    const pattern = answerFor(objection, ctx.v);
    const has = (re: RegExp): boolean => re.test(o);
    const matched = answersFor(objection);
    // With evidence the counter says it; without, the spoken line promises an accurate answer in writing (never an invented one) and the note tells the seller what is missing.
    const evidence = matched.length ? `What I can tell you today is ${andList(matched.slice(0, 2).map((m) => lowerFirst(m)))}.` : `On ${qc(objection, 80)} I would rather give you an accurate answer than a guess, so let me confirm the specifics and send them to you in writing.`;
    const note = matched.length ? '' : 'None of the strengths you listed answers this objection. Add the evidence you hold to your_strengths (or recent_wins) and run the tool again; until then, do not improvise an answer.';
    
    if (has(/\b(price|prices|pricing|expensive|cost|costs|budget|cheaper|cheap)\b/)) {
      return {
        acknowledge: "I understand budget is a consideration.",
        counter: `Let us agree what the problem costs you today, then compare the price with that. ${evidence}`,
        redirect: "What would the cost of NOT solving this problem be for your team?",
        pattern, note
      };
    }
    
    if (has(/\b(competitors?|alternatives?|other (?:vendors?|options?|tools?)|rivals?)\b/) || competitors.some((c) => !isDescription(c) && o.includes(shortOf(c).toLowerCase()))) {
      return {
        acknowledge: "It makes sense to evaluate options thoroughly.",
        counter: S[0] ? `What sets us apart is ${strongFirst}. ${matched.length ? evidence : ''}`.trim() : `Tell me which of your criteria matter most, and I will show how we answer each. (No strengths were supplied: add your_strengths to name what sets you apart.)`,
        redirect: "What's most important to you in making this decision?",
        pattern, note
      };
    }
    
    if (has(/\b(timing|not ready|ready|later|next year|not now|right now|this quarter)\b/)) {
      return {
        acknowledge: "Timing is definitely important to get right.",
        counter: `Find the event that makes it urgent for you (a renewal, an audit, a season, a target) and plan back from it. ${evidence}`,
        redirect: "What would need to change for the timing to feel right?",
        pattern, note
      };
    }
    
    if (has(/\b(features?|can't|cannot|doesn't|does it|do you|does .* support|missing|lack|lacks|lacking|support)\b/)) {
      return {
        acknowledge: "That's a fair question.",
        counter: `${evidence}`,
        redirect: "How critical is that specific capability vs. the overall outcome you're trying to achieve?",
        pattern, note
      };
    }
    
    if (has(/\b(risk|risky|trust|new|proven|unproven)\b/)) {
      return {
        acknowledge: "De-risking a decision like this is smart.",
        counter: `Here's how we reduce risk: a pilot with success criteria agreed in writing, and references the buyer can call. ${evidence}`,
        redirect: "What would help you feel confident in moving forward?",
        pattern, note
      };
    }
    
    // The coaching note for the seller (the answer pattern) stays outside the spoken lines.
    return {
      acknowledge: 'I appreciate you raising that.',
      counter: `${evidence}`,
      redirect: `Can you tell me more about why that matters in your situation?`,
      pattern, note
    };
  };

  const productHead = capEcho(args.your_product, 120);
  const productName = shortName(args.your_product) ?? capEcho(args.your_product, 40).short;
  let output = `# Competitive Battle Cards
## ${productHead.short}
${productHead.capped ? `\n**Your product (as you wrote it):** ${args.your_product.trim()}\n` : ''}
${ctx.line}

---

## Your Competitive Position

### When We Win

${S.length > 0 ? S.map((s, i) => `${i + 1}. **${s}**`).join('\n') : 'Not known yet (add your_strengths or recent_wins).'}

${args.your_strengths && wins.length > 0 ? `\n**Recent Win Patterns:**\n${wins.map(w => `- ${w}`).join('\n')}` : ''}

### When We Lose

${W.length > 0 ? W.map((w, i) => `${i + 1}. **${w}**`).join('\n') : 'Not known yet (add your_weaknesses or recent_losses).'}

${args.your_weaknesses && losses.length > 0 ? `\n**Recent Loss Patterns:**\n${losses.map(l => `- ${l}`).join('\n')}` : ''}

${generalLeft.length ? `**Competitor details about the whole category (shown on each card):**\n${generalLeft.map((g) => `- ${g}`).join('\n')}\n` : ''}
---

## Competitor Battle Cards

`;

  // Generate battle card for each competitor
  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];
    const desc = isDescription(comp);
    const short = desc ? 'this approach' : shortOf(comp);
    const info = [...(byCompetitor[comp] || []), ...generalLeft];
    // Pair each strength with the detail it answers (by topic or shared word); unpaired strengths stay as strengths
    const pairs = S.slice(0, 4).map((s) => ({ s: stripEnd(s), d: info.find((x) => related(s, x)) ?? null }));
    const metricWord = ctx.v ? andList(ctx.v.metrics.slice(0, 3)) : '';
    const weakNotes = info.filter((x) => sideOf(x) === 'weak');
    const aheadLines = [...W.slice(0, 3).map((w) => `- Where we fall short: ${w}`), ...info.filter((x) => sideOf(x) !== 'weak').map((x) => `- From your notes: ${x}`)];
    output += `### ${i + 1}. ${comp}

${desc ? `*You described this alternative in your own words, so the card calls it "${short}".*\n\n` : ''}${info.length > 0 ? `**What you know about ${desc ? 'it' : short} (your own notes):**\n${info.map(x => `- ${x}`).join('\n')}\n` : `**What you know about ${desc ? 'it' : short}:** none of your competitor details names it. Add one that does.\n`}

**Where you are stronger against ${short}:**
${S.length > 0 ? pairs.map((p) => `- ${p.s}${p.d ? ` (your note on ${short}: ${q(p.d)})` : ''}`).join('\n') : '- Not known yet (add your_strengths)'}

${weakNotes.length ? `**Weak points of ${short}, from your notes:**\n${weakNotes.map((x) => `- ${x}`).join('\n')}\n\n` : ''}**Where ${short} may be ahead:**
${aheadLines.length ? aheadLines.join('\n') : W.length || info.length ? '- Your notes name nothing here beyond the points above' : '- Not known yet (add your_weaknesses or a competitor detail)'}

**Trap questions for ${short}:**
*Questions to ask the buyer*

${(() => {
  const qs: string[] = [];
  (weakNotes.length ? weakNotes : info).slice(0, 2).forEach((d) => qs.push(`Ask the buyer how they cope with this today, with ${short}: ${qc(d, 120)}`));
  S.slice(0, 3 - qs.length).forEach((st) => qs.push(`Ask how ${short} handles ${qc(stripEnd(st), 90)}`));
  if (qs.length < 3) qs.push(ctx.v ? `Ask which of ${andList(ctx.v.metrics.slice(0, 3))} the buyer measures today, and how ${short} improves it` : `Ask what result the buyer measures today, and how ${short} improves it`);
  return qs.map((x, n) => `${n + 1}. ${x}`).join('\n');
})()}

**"Why not ${short}?" response:**

\`\`\`
If prospect asks: "Why should we choose you over ${short}?"

First acknowledge one real strength of ${short}. Then say:

"That's a fair question, and I'd rather answer it than dodge it.${S.length > 0 ? ` Here is what customers tell us:\n${S.slice(0, 2).map((s, n) => `${n + 1}. ${cap(stripEnd(s))}. For a buyer who watches ${metricWord || sectorMetric}, ask what that is worth to them.`).join('\n')}` : ' (No strengths were supplied: add your_strengths so this answer can name them.)'}${(weakNotes[0] || info[0]) ? `\nAnd on ${short} itself, what you have seen is: ${stripEnd(weakNotes[0] || info[0])}.` : ''}"
\`\`\`

---

`;
  }

  output += `## Objection Handlers

`;
  // A section with no content never prints empty: say what to add instead.
  if (objections.length === 0) {
    output += `No objections supplied. Add common_objections (for example "too expensive, we already use a competitor") to get a handler for each one.

---

`;
  }

  // Generate specific handler for each objection
  for (let i = 0; i < objections.length; i++) {
    const obj = objections[i];
    const handler = generateObjectionHandler(obj);
    
    output += `### ${i + 1}. "${obj}"

**Acknowledge:** "${handler.acknowledge}"

**Counter:** "${handler.counter}"

**Redirect:** "${handler.redirect}"

**Answer pattern:** ${handler.pattern}
${handler.note ? `\n**Coach note:** ${handler.note}\n` : ''}
**Full Response:**
\`\`\`
"${handler.acknowledge}

${handler.counter}

${handler.redirect}"
\`\`\`

---

`;
  }

  // Objections the sector often raises that you did not list (from the sector data file)
  const missingObjections: Array<{ objection: string; response: string }> = ctx.v
    ? ctx.v.objections.filter((o) => !objections.some((u) => words(u).filter((w) => words(o.objection).includes(w)).length >= 1)).slice(0, 3)
    : [];
  if (missingObjections.length) {
    output += `### Objections ${ctx.v!.name} buyers often raise that you did not list

${missingObjections.map((o) => `- **${o.objection}:** ${o.response}`).join('\n')}

---

`;
  }

  output += `## Win/Loss Analysis

### We Win When:
${wins.length > 0 
  ? wins.map(w => `- ${w}`).join('\n')
  : S.length > 0 ? S.slice(0, 2).map(s => `- The buyer's priority is ${lowerFirstIfCommon(stripEnd(s))}`).join('\n') : '- Not known yet (add recent_wins)'}

### We Lose When:
${losses.length > 0 
  ? losses.map(l => `- ${l}`).join('\n')
  : W.length > 0 ? W.slice(0, 2).map(w => `- The buyer needs what we lack: ${w}`).join('\n') : '- Not known yet (add recent_losses)'}

### Win Rate by Competitor

No deal counts were supplied, so no win rate is shown. To track one, record for each of ${andList(competitors.map((c) => (isDescription(c) ? 'the alternatives you named' : shortOf(c))).filter((x, n, a) => a.indexOf(x) === n))} how many deals you met it in and how many you won.

---

${ctx.v ? `${sectorNotes(ctx.v, 'committee')}\n\n---\n\n` : ''}## Quick Reference Card

\`\`\`
Quick guide: ${productName} against the competition

OUR STRENGTHS:
${S.length > 0 ? S.slice(0, 3).map(s => `• ${s}`).join('\n') : '• Not known yet (add your_strengths)'}

WATCH OUT FOR:
${W.length > 0 ? W.slice(0, 2).map(w => `• ${w}`).join('\n') : '• Not known yet (add your_weaknesses)'}

TOP OBJECTION HANDLERS:
${objections.length > 0 ? objections.slice(0, 3).map((o, i) => { const m = answersFor(o); return `${i + 1}. "${o}" → ${m.length ? lowerFirst(m[0]) : answerFor(o, ctx.v).split(/[;.]/)[0]}`; }).join('\n') : 'None supplied yet: add common_objections.'}
\`\`\`

---

*Competitive intelligence generated using the CRAFT GTM framework*`;

  return output;
}

// Discovery mode when user has minimal competitive knowledge
function generateCompetitiveDiscoveryKit(product: string, competitors: string[], contextLine: string, v: Vertical | null): string {
  return `# Competitive Discovery Kit: ${product}

${contextLine}

## Current Situation

You've identified these competitors: **${competitors.join(', ')}**

But you haven't provided:
- Your strengths (why you win)
- Your weaknesses (why you lose)
- Common objections you hear
- Recent win/loss stories

**To build effective battle cards, we need to understand your competitive position.**

---

## Step 1: Win/Loss Analysis Template

### For Your Last 10 Wins, Answer:

| Deal | Competitor | Why Did We Win? | Key Differentiator |
|------|------------|-----------------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### For Your Last 10 Losses, Answer:

| Deal | Competitor | Why Did We Lose? | What Would Have Changed the Outcome? |
|------|------------|------------------|--------------------------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Step 2: Sales Team Interview Questions

Ask your sales reps:

### Win Patterns
1. "Think about your best wins against ${shortOf(competitors[0] || 'competitors')}. What did we do right?"
2. "When prospects choose us, what do they say is the deciding factor?"
3. "Which features do you demo that get the best reaction?"

### Loss Patterns  
4. "What objections come up most often that you struggle to handle?"
5. "When we lose, what reason does the prospect give?"
6. "Which competitor do you hate going up against? Why?"

### Competitive Positioning
7. "How do you position us vs ${shortOf(competitors[0] || 'the main competitor')}?"
8. "What do you wish you could say about us that you can't today?"

---

## Step 3: Competitive Research Checklist

For each competitor (${competitors.join(', ')}):

- [ ] Review their website messaging: what do they claim?
- [ ] Check customer reviews and analyst coverage: what do customers praise or complain about?
- [ ] Look at their case studies: which industries/sizes do they focus on?
- [ ] Find their pricing (if public): how does it compare?
- [ ] Check LinkedIn: how big is their team? Which roles are they hiring?
- [ ] Search news: any recent funding, acquisitions, or product launches?

---

${v ? `${sectorNotes(v, 'objections')}\n\n---\n\n` : ''}## Quick Competitor Profiles to Fill In

${competitors.map(c => `
### ${c}

**What they claim:** check their homepage
**Target customer:** who do they focus on?
**Pricing model:** how do they charge?
**Key strengths:** what are they known for?
**Key weaknesses:** what do people complain about?
**When they win against us:** the pattern
**When we win against them:** the pattern
`).join('\n')}

---

## Next Steps

1. **Fill in the win/loss analysis** (even 5 deals helps) ${EXAMPLE_FIGURE}
2. **Do 2-3 sales team interviews** (15 min each) ${EXAMPLE_FIGURE}
3. **Complete competitor profiles** above
4. **Come back to this tool** with your findings

**Once you have this data, run competitive_intel again with:**
\`\`\`
your_strengths: "strength 1, strength 2"
your_weaknesses: "weakness 1, weakness 2"
common_objections: "objection 1, objection 2"
recent_wins: "why we won deal 1, why we won deal 2"
recent_losses: "why we lost deal 1, why we lost deal 2"
\`\`\`

You'll get complete battle cards with specific handlers for each competitor and objection.

---

*Competitive Discovery Kit generated using the CRAFT GTM framework*

${SUGGESTION_FOOTER}`;
}
