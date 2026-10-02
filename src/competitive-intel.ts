import { parseListItems, lowerFirstIfCommon, cap, EXAMPLE_FIGURE, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, q, answerFor, andList, sectorNotes, shortName, capEcho, type Vertical } from './context.js';

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
  const competitors = splitOutsideBrackets(args.competitors);
  const wins = splitItems(args.recent_wins);
  const losses = splitItems(args.recent_losses);
  const objections = args.common_objections ? parseListItems(args.common_objections) : [];
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, args.your_product, args.competitors, args.competitor_details, args.common_objections, args.recent_wins, args.recent_losses);
  
  // Strengths: the ones you gave, else your own words from your wins (Run 19, D80, problem 7: a win phrase is never turned into
  // a claim you did not make, such as "superior customer support")
  const strengths: string[] = args.your_strengths ? parseListItems(args.your_strengths).map(cap) : wins.map(cap);
  const weaknesses: string[] = args.your_weaknesses ? parseListItems(args.your_weaknesses).map(cap) : losses.map(cap);
  const S = strengths;
  const W = weaknesses;

  // If no strengths, weaknesses, AND no objections - return discovery mode
  if (!args.your_strengths && !args.your_weaknesses && wins.length === 0 && losses.length === 0 && objections.length === 0) {
    return generateCompetitiveDiscoveryKit(args.your_product, competitors, ctx.line, ctx.v);
  }
  
  // Competitor details, each to the competitor it names
  const { byCompetitor, general } = args.competitor_details ? assignDetails(args.competitor_details, competitors) : { byCompetitor: {} as Record<string, string[]>, general: [] as string[] };

  const strongFirst = S[0] ? lowerFirstIfCommon(S[0]) : '';

  // Generate objection handlers (whole-word rules; the sector's answer pattern is added to every handler)
  const generateObjectionHandler = (objection: string): { acknowledge: string; counter: string; redirect: string; pattern: string } => {
    const o = objection.toLowerCase();
    const pattern = answerFor(objection, ctx.v);
    const has = (re: RegExp): boolean => re.test(o);
    
    if (has(/\b(price|prices|pricing|expensive|cost|costs|budget|cheaper|cheap)\b/)) {
      return {
        acknowledge: "I understand budget is a consideration.",
        counter: `Let us agree what the problem costs you today, then compare the price with that. [Only if true and provable: ${strongFirst || 'our solution'} typically delivers a return within [X months]; add the result a similar customer got.]`,
        redirect: "What would the cost of NOT solving this problem be for your team?",
        pattern
      };
    }
    
    if (has(/\b(competitors?|alternatives?|other (?:vendors?|options?|tools?)|rivals?)\b/) || competitors.some((c) => o.includes(shortOf(c).toLowerCase()))) {
      return {
        acknowledge: "It makes sense to evaluate options thoroughly.",
        counter: S[0] ? `What sets us apart is ${strongFirst}. [Only if true and provable: customers who compared us found the difference in [the result you can prove].]` : `Tell me which of your criteria matter most, and I will show how we answer each. (No strengths were supplied: add your_strengths to name what sets you apart.)`,
        redirect: "What's most important to you in making this decision?",
        pattern
      };
    }
    
    if (has(/\b(timing|not ready|ready|later|next year|not now|right now|this quarter)\b/)) {
      return {
        acknowledge: "Timing is definitely important to get right.",
        counter: "[Only if true and provable: teams that wait often find the problem grows; add what a customer told you about starting earlier.]",
        redirect: "What would need to change for the timing to feel right?",
        pattern
      };
    }
    
    if (has(/\b(features?|can't|cannot|doesn't|missing|lack|lacks|lacking)\b/)) {
      return {
        acknowledge: "That's a fair point.",
        counter: `[Only if true and provable: while this works differently in our product, customers find that (the alternative benefit you can prove).] ${strongFirst ? `Plus, ${strongFirst} is where we are strongest.` : ''}`.trim(),
        redirect: "How critical is that specific capability vs. the overall outcome you're trying to achieve?",
        pattern
      };
    }
    
    if (has(/\b(risk|risky|trust|new|proven|unproven)\b/)) {
      return {
        acknowledge: "De-risking a decision like this is smart.",
        counter: `Here's how we reduce risk: a pilot with success criteria agreed in writing, and references the buyer can call. [Only if true and provable: we work with similar customers who had the same concern.]`,
        redirect: "What would help you feel confident in moving forward?",
        pattern
      };
    }
    
    // The coaching note for the seller (the answer pattern) stays outside the spoken lines.
    return {
      acknowledge: 'I appreciate you raising that concern.',
      counter: `On '${objection.replace(/^["']|["']$/g, '')}': ${strongFirst ? `what we would put against it is ${strongFirst}.` : 'let me show you how we handle it. (No strengths were supplied: add your_strengths to give the evidence.)'}`,
      redirect: `Can you tell me more about why that is a concern in your situation?`,
      pattern
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

${general.length ? `**Competitor details not tied to one competitor:**\n${general.map((g) => `- ${g}`).join('\n')}\n` : ''}
---

## Competitor Battle Cards

`;

  // Generate battle card for each competitor
  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];
    const short = shortOf(comp);
    const info = byCompetitor[comp] || [];
    const intelFor = (s: string): string => {
      const sw = words(s);
      const hit = info.find((x) => words(x).some((w) => sw.includes(w)));
      return hit ? `Your note: ${q(hit)}` : 'Not assessed: add what you know';
    };
    
    output += `### ${i + 1}. ${comp}

${info.length > 0 ? `**Known Intel (your own notes about ${short}):**\n${info.map(x => `- ${x}`).join('\n')}\n` : `**Known Intel:** none of your competitor details names ${short}. Add a detail that does.\n`}

**Head-to-Head Comparison:**

| Dimension | ${productName} | ${short} |
|-----------|------------|---------|
${S.length > 0 ? S.slice(0, 2).map(s => `| ${s} | Your strength | ${intelFor(s)} |`).join('\n') : '| Your key strength (not supplied) | Add your_strengths | Not assessed |'}
${W.length > 0 ? `| Our gap: ${W[0]} | Gap for us | ${intelFor(W[0])} |` : ''}

**Our Advantages Over ${short}:**
${S.length > 0 ? S.slice(0, 3).map(s => `- ${s}`).join('\n') : '- Not known yet (add your_strengths)'}

**Where ${short} May Be Ahead:**
${info.length > 0 || W.length > 0 ? [...W.slice(0, 2).map(w => `- Where we fall short: ${w}`), ...info.map(x => `- From your notes: ${x}`)].join('\n') : '- Not known yet (add your_weaknesses or a competitor detail)'}

**${short} Trap Questions:**
*Questions to ask the buyer*

1. ${S[0] ? `Ask how ${short} handles ${q(S[0])}` : `Ask what ${short} offers on the buyer's top criterion`}
2. ${S[1] ? `Ask how ${short} handles ${q(S[1])}` : `Ask what ${short} offers on the buyer's second criterion`}
3. ${ctx.v ? `Ask which of ${andList(ctx.v.metrics.slice(0, 3))} the buyer measures today, and how ${short} improves it` : `Ask what result the buyer measures today, and how ${short} improves it`}

**"Why Not ${short}?" Response:**

\`\`\`
If prospect asks: "Why should we choose you over ${short}?"

First acknowledge one real strength of ${short}. Then say:

"That's a fair question, and I'd rather answer it than dodge it. Here's why customers choose us:

${S.length > 0 ? S.slice(0, 2).map((s, n) => `${n + 1}. ${s}: add one line on what this means for this buyer`).join('\n') : '1. Add your key strength (none was supplied)'}

[Only if true and provable: Would it help to talk to a customer who evaluated both?]"
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
  : S.length > 0 ? S.slice(0, 2).map(s => `- The buyer's priority is ${lowerFirstIfCommon(s)}`).join('\n') : '- Not known yet (add recent_wins)'}

### We Lose When:
${losses.length > 0 
  ? losses.map(l => `- ${l}`).join('\n')
  : W.length > 0 ? W.slice(0, 2).map(w => `- The buyer needs what we lack: ${w}`).join('\n') : '- Not known yet (add recent_losses)'}

### Win Rate by Competitor (Track This):

No deal counts were supplied, so the table is empty until you add them.

| Competitor | Win Rate | Sample Size | Trend |
|------------|----------|-------------|-------|
${competitors.map(c => `| ${shortOf(c)} | not supplied | not supplied | not supplied |`).join('\n')}

---

${ctx.v ? `${sectorNotes(ctx.v, 'committee')}\n\n---\n\n` : ''}## Quick Reference Card

\`\`\`
Quick guide: ${productName} against the competition

OUR STRENGTHS:
${S.length > 0 ? S.slice(0, 3).map(s => `• ${s}`).join('\n') : '• Not known yet (add your_strengths)'}

WATCH OUT FOR:
${W.length > 0 ? W.slice(0, 2).map(w => `• ${w}`).join('\n') : '• Not known yet (add your_weaknesses)'}

TOP OBJECTION HANDLERS:
${objections.length > 0 ? objections.slice(0, 3).map((o, i) => `${i + 1}. "${o}" → ${answerFor(o, ctx.v).split(/[;.]/)[0]}`).join('\n') : 'None supplied yet: add common_objections.'}
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
