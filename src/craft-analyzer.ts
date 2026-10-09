import { analyzeCRAFTDimensions, isMarketLine, type CRAFTDimension } from './utils.js';
import { VERTICALS, SUBTYPES, AI_SUPPORT_PROFILE, BUYER_CONTEXTS, profileFor, buyerContextFor, type Vertical } from './verticals.ts';
import { andList, readContext, q, splitPhrases } from './context.js';
import { answerFor } from './context.js';
import { lc, closing, finalise, clauseCut } from './rw-gtm.js';

// A plan line in quotes, in full when it fits and otherwise ended at a clause break (never with three dots).
const qc = (t: string, max = 220): string => q(clauseCut(t, max));

export function generateCRAFTAnalyzer(args: {
  document_content: string;
  document_type: string;
  intended_audience?: string;
  desired_outcome?: string;
  industry?: string;
}): string {
  // Run 18 (R18-26, P05-WS-01): leading and trailing whitespace is not part of the document, so it is not measured or shown
  // (the web form already trims it in netlify/functions/api.mjs). Interior whitespace is kept exactly.
  const content = args.document_content.trim();
  const docType = args.document_type;
  // Run 20: when audience or outcome is not given as an input, the plan's own Audience and Goal lines are read and shown (before, the answer said
  // "Not specified" for a plan that states both).
  const labelled = content.split('\n').map((l) => { const m = l.match(/^\s*([A-Za-z][A-Za-z /&'-]{1,40}):\s*(.+)$/); return m ? { label: m[1].trim(), text: m[2].trim() } : null; }).filter((x): x is { label: string; text: string } => !!x);
  const planAudience = labelled.find((x) => /^(?:target )?audience$|^icp$|^segments?$/i.test(x.label));
  const planGoal = labelled.find((x) => /^(?:goals?|objectives?|targets?|outcomes?|success(?: criteria| metrics?)?)$/i.test(x.label));
  // The plan is read in its parts when it is labelled (Message and How we differ are the seller's words; Buyer roles are job titles; Audience is the buyer);
  // a plan with no such lines is read whole, as deal text. Its Goal line is not read: it often lists the segments, which are the buyer's sector, not yours.
  const byLabel = (re: RegExp): string[] => labelled.filter((x) => re.test(x.label)).map((x) => x.text);
  const sellerLines = byLabel(/^(?:message|messaging|positioning|how we differ|differentiat\w+|what we sell|offer|product)$/i);
  const readInput = sellerLines.length || planAudience
    ? { seller: [content.split('\n')[0], ...sellerLines], role: byLabel(/^buyer(?:s| roles?)?$|^personas?$/i), buyer: [args.intended_audience, planAudience?.text] }
    : { context: [content, args.desired_outcome], buyer: [args.intended_audience] };
  const sectorCtx = readContext({ vertical: args.industry }, readInput);
  const sectorCtx0 = sectorCtx;
  // Perform CRAFT analysis
  const analysis = analyzeCRAFTDimensions(content);
  
  // Calculate overall score
  const totalScore = analysis.character.score + analysis.result.score + analysis.artifact.score + analysis.frame.score + analysis.timeline.score;
  const maxScore = 50;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Determine rating
  let rating = '';
  if (percentage >= 80) { rating = 'EXCELLENT'; }
  else if (percentage >= 60) { rating = 'GOOD'; }
  else if (percentage >= 40) { rating = 'NEEDS WORK'; }
  else { rating = 'SIGNIFICANT GAPS'; }
  
  // Run 20: what the plan states, line by line, and the gaps that matter for a go-to-market plan (read from the plan's own lines).
  const countsFor = (label: string, text: string): string => {
    if (isMarketLine(`${label}: ${text}`)) return /^(?:message|messaging|positioning|how we differ|differentiat\w+|proof|references?|testimonials?|quotes?|case stud)/i.test(label) ? 'Not scored (describes your product or your customers)' : 'Frame only (describes your customers and market, not who runs the plan)';
    if (/^(?:goals?|objectives?|targets?|outcomes?|success|kpis?|okrs?)/i.test(label)) return 'Result';
    if (/^(?:owner|owners|responsible|accountable|lead|team|raci)/i.test(label)) return 'Character';
    if (/^(?:budget|resources?|headcount|constraints?|assumptions?)/i.test(label)) return 'Frame';
    if (/^(?:timeline|dates?|schedule|milestones?|deadline)/i.test(label)) return 'Timeline';
    if (/^risks?/i.test(label)) return 'Risks section';
    return 'Read for all five areas';
  };
  const stated = labelled.slice(0, 10).map((x) => ({ ...x, counts: countsFor(x.label, x.text) }));
  const ownText = content.split('\n').filter((l) => !isMarketLine(l)).join('\n');
  const buyerLine = labelled.find((x) => /^buyer(?:s| roles?)?$/i.test(x.label));
  const matters: Array<{ title: string; detail: string }> = [];
  if (analysis.character.found.length === 0) matters.push({ title: 'Nobody on your side is named to run the plan', detail: `${buyerLine ? `The line ${qc(`${buyerLine.label}: ${buyerLine.text}`, 140)} names the customer's roles, which are not owners. ` : ''}Name who owns the goal and who does each piece of the work.` });
  if (!/\b(email|e-mail|linkedin|outbound|inbound|webinars?|events?|conferences?|roundtables?|partners?|referrals?|paid|ads|seo|abm|account-based|sdrs?|cold|calls?|social|community|press|field|direct|content|newsletter)\b/i.test(ownText)) matters.push({ title: 'No channel is named', detail: 'Say where the first conversations come from (outbound, events, partners, referrals, paid, content), and who is reached first.' });
  const hasNumberGoal = planGoal && /\d/.test(planGoal.text);
  if (hasNumberGoal && !/\b(win rate|close rate|conversion|meetings?|opportunit\w*|funnel|demos?|mqls?|sqls?|stage)\b/i.test(ownText.replace(planGoal!.text, ''))) matters.push({ title: 'The goal is not traced to activity', detail: `${qc(planGoal!.text, 150)} is a result, but no win rate, meeting count or stage conversion is stated, so it cannot be traced back to the work that would produce it. Work backwards from the goal: deals needed, opportunities needed, meetings needed.` });
  if (analysis.timeline.found.length === 0) matters.push({ title: 'No dates', detail: `${analysis.timelineWords.length ? `Only the words ${andList(analysis.timelineWords.slice(0, 3).map((w) => q(w)))} appear` : 'No period or date appears'}${/\bnext quarter\b/i.test(ownText) ? ' (the plan says "next quarter")' : ''}. Put a date on the first meeting, the pilot or first delivery, and the review.` });
  if (!analysis.frame.groupsFound.includes('a budget or resources')) matters.push({ title: 'No budget or headcount', detail: 'State what money and people the plan has, so the goal can be checked against what it costs.' });
  if (!/\b(weekly|monthly|fortnightly|review|check-?in|cadence|stand-?up|steering)\b/i.test(ownText)) matters.push({ title: 'No review rhythm', detail: 'Say when the plan is reviewed and by whom, and which number is looked at first.' });
  if (analysis.artifact.found.length === 0) matters.push({ title: 'No deliverables', detail: 'List what gets made (deck, one-pager, email sequence, event, case study) and who makes it.' });

  // A "Risks:" line holds several risks: each one is judged and answered on its own.
  const riskItems: Array<{ line: string; answered: boolean; pattern: string }> = [];
  for (const r of analysis.risks) {
    const m = r.line.match(/^\s*risks?\s*:\s*(.+)$/i);
    if (m) for (const item of splitPhrases(m[1])) riskItems.push({ line: item, answered: false, pattern: answerFor(item, sectorCtx0.v) });
    else riskItems.push({ ...r, pattern: r.answered ? '' : answerFor(r.line, sectorCtx0.v) });
  }
  // ---- the review ----
  const DIM_NAME: Record<string, string> = { character: 'Character', result: 'Result', artifact: 'Artifact', frame: 'Frame', timeline: 'Timeline' };
  const DIM_WHO: Record<string, string> = { character: 'who runs it', result: 'what success looks like', artifact: 'what gets produced', frame: 'the context and limits', timeline: 'when it happens' };
  const dims = (['character', 'result', 'artifact', 'frame', 'timeline'] as const).map((key) => ({ key, name: DIM_NAME[key], d: analysis[key] }));
  const strong = dims.filter((x) => x.d.score >= 7);
  const empty = dims.filter((x) => x.d.score < 4);
  const status = (n: number): string => (n >= 7 ? 'Yes' : n >= 4 ? 'Note' : 'No');
  const verdict = `${strong.length ? `The plan is clear on ${andList(strong.map((x) => `${x.name} (${DIM_WHO[x.key]})`))}.` : 'No dimension of the plan is clear yet.'} ${empty.length ? `It has little or nothing yet on ${andList(empty.map((x) => `${x.name} (${DIM_WHO[x.key]})`))}.` : 'Nothing is missing entirely, but some parts are thin.'}`;

  // the buyer's industry, read from the plan's audience and goal lines (and the audience input), else from the whole plan without the broad technology and media words
  const buyerTexts = [args.intended_audience, planAudience?.text, planGoal?.text, args.desired_outcome];
  const buyerCtx = buyerContextFor(...buyerTexts) ?? (() => { const t = content; for (const c of BUYER_CONTEXTS) if (c.id !== 'technology' && c.id !== 'telecom-media' && c.id !== 'gaming' && c.match.test(t)) return c; return null; })();

  // the plan's own title, when its first line is a sentence and not a labelled line ("Brightdesk plan for Q1 2027.")
  const firstLine = content.split('\n')[0].trim();
  const planTitle = firstLine && !/^[A-Za-z][A-Za-z /&'-]{1,40}:\s/.test(firstLine) ? clauseCut(firstLine.split(/(?<=[.!?])\s+/)[0], 140) : '';

  let output = `# CRAFT review: ${docType.replace(/_/g, ' ')}

${planTitle ? `**Plan:** ${planTitle}\n\n` : ''}**Document Length:** ${content.length} characters
**Words (estimate):** ~${Math.round(content.length / 5)}, from the character count

${args.intended_audience ? `**Written for:** ${args.intended_audience}.` : planAudience ? `**Written for:** ${qc(planAudience.text, 320)} (the plan's own Audience line).` : ''}${args.desired_outcome ? `\n\n**Meant to drive:** ${args.desired_outcome}.` : planGoal ? `\n\n**Meant to drive:** ${qc(planGoal.text, 320)} (the plan's own ${planGoal.label} line).` : ''}

## Overall Score: ${totalScore}/${maxScore} (${percentage}%), rated ${rating}

${verdict} The scores come from a keyword check of the lines that describe your own plan, not a reading of the whole plan, so check each gap against your document. Lines that describe your customers, market or product (Audience, Buyer roles, Message, Proof, How we differ) are not scored as your owner, goal, deliverables or dates; they count only toward Frame.

| Dimension | Score | Status | Assessment |
|-----------|-------|--------|------------|
| **C**haracter (who) | ${analysis.character.score}/10 | ${status(analysis.character.score)} | ${analysis.character.score >= 7 ? 'Clear ownership' : analysis.character.score >= 4 ? 'Partial ownership' : 'Missing ownership'} |
| **R**esult (what success is) | ${analysis.result.score}/10 | ${status(analysis.result.score)} | ${analysis.result.score >= 7 ? 'Clear goals' : analysis.result.score >= 4 ? 'Vague goals' : 'No measurable goals'} |
| **A**rtifact (what is produced) | ${analysis.artifact.score}/10 | ${status(analysis.artifact.score)} | ${analysis.artifact.score >= 7 ? 'Clear deliverables' : analysis.artifact.score >= 4 ? 'Some deliverables' : 'Unclear outputs'} |
| **F**rame (context) | ${analysis.frame.score}/10 | ${status(analysis.frame.score)} | ${analysis.frame.score >= 7 ? 'Clear context' : analysis.frame.score >= 4 ? 'Partial context' : 'Missing context'} |
| **T**imeline (when) | ${analysis.timeline.score}/10 | ${status(analysis.timeline.score)} | ${analysis.timeline.score >= 7 ? 'Clear timeline' : analysis.timeline.score >= 4 ? 'Vague timeline' : 'No timeline'} |

`;
  // the shared check cuts a long plan line at 157 characters and adds three dots; the plan's own sentence is restored here, ended at a clause break
  const flat = content.replace(/\s+/g, ' ');
  const fullEvidence = (e: string): string => {
    if (!e.endsWith('...')) return e;
    const at = flat.indexOf(e.slice(0, -3));
    if (at < 0) return e.slice(0, -3).replace(/[,;:\s]+\S*$/, '');
    let end = at + e.length - 3;
    while (end < flat.length && !/[.;!?]/.test(flat[end])) end++;
    return clauseCut(flat.slice(at, end + 1), 320);
  };
  const countGroups: Array<[string, (c: string) => boolean]> = [
    ['Counted toward the dimension they name', (c) => /^(?:Result|Character|Frame|Timeline)$/.test(c)],
    ['Counted toward Frame only, because they describe your customers and market', (c) => /^Frame only/.test(c)],
    ['Not scored, because they describe your product or your customers', (c) => /^Not scored/.test(c)],
    ['Read as risks', (c) => /^Risks section/.test(c)],
    ['Read for all five areas', (c) => /^Read for all five/.test(c)],
  ];
  const countLines = countGroups.map(([title, test]) => { const xs = stated.filter((x) => test(x.counts)); return xs.length ? `${title}: ${andList(xs.map((x) => q(x.label)))}.` : ''; }).filter(Boolean);

  // ---- what to fix first: the gaps that matter, each once, ordered by the lowest dimension score ----
  const dimOfMatter: Record<string, keyof typeof analysis> = { 'Nobody on your side is named to run the plan': 'character', 'No channel is named': 'frame', 'The goal is not traced to activity': 'result', 'No dates': 'timeline', 'No budget or headcount': 'frame', 'No review rhythm': 'timeline', 'No deliverables': 'artifact' };
  type Fix = { title: string; detail: string; score: number; dim: string };
  const fixes: Fix[] = matters.map((m) => ({ title: m.title, detail: m.detail, score: (analysis[dimOfMatter[m.title] ?? 'frame'] as CRAFTDimension).score, dim: DIM_NAME[dimOfMatter[m.title] ?? 'frame'] }));
  if (analysis.result.found.length === 0) fixes.push({ title: 'No measurable result', detail: 'State one goal with a number and a date, such as a count of meetings, a pipeline value or a number of deals.', score: analysis.result.score, dim: 'Result' });
  if (analysis.frame.found.length === 0) fixes.push({ title: 'No audience or limits', detail: 'Say who the plan is for, what budget and people it has, and what it assumes.', score: analysis.frame.score, dim: 'Frame' });
  for (const x of dims) {
    if (x.d.score < 7 && x.d.found.length > 0 && x.d.groupsMissing.length && !fixes.some((f) => dimOfMatter[f.title] === x.key)) {
      fixes.push({ title: `${x.name} is partly covered`, detail: `The plan has ${andList(x.d.groupsFound.length ? x.d.groupsFound : ['little'])}; it does not have ${andList(x.d.groupsMissing)}.`, score: x.d.score, dim: x.name });
    }
  }
  fixes.sort((a, b) => a.score - b.score);
  output += `## What to fix first\n\n${fixes.length ? fixes.map((f, i) => `${i + 1}. **${f.title}.** (${f.dim} ${f.score}/10) ${f.detail}`).join('\n') : 'This check finds no structural gap. Read the plan once for sense before you send it.'}\n\n`;

  // ---- the sector check ----
  const planLower = content.toLowerCase();
  const roleNamed = (role: string): boolean => {
    const acronym = /^Chief .* Officer$/.test(role) ? role.split(' ').filter((w) => /^[A-Z]/.test(w) && w !== 'Officer').map((w) => w[0]).join('') + 'O' : '';
    // the same words in another order count ("IT Infrastructure Head" names the "Head of IT Infrastructure"), all in one line of the plan
    const roleWords = role.toLowerCase().split(/\s+/).filter((w) => !['of', 'and', 'the'].includes(w));
    const sameWords = content.split('\n').some((line) => { const l = line.toLowerCase(); return roleWords.every((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(l)); });
    // plain titles that name the same decider (GM-IT and the IT head are the CIO's side; a platform leader is the platform engineering lead; IT / Security is the security lead)
    const ALIASES: Array<[RegExp, RegExp]> = [
      [/information officer|head of it|network manager|cio\b|cto\b|chief technology/i, /\b(gm[- ]it|it head|head of it|cio|cto|it manager|it director|it infrastructure|it \/ security|it and security)\b/i],
      [/platform engineering lead|engineering manager|vp engineering/i, /\b(platform (?:leader|lead|engineer\w*|team)|engineering (?:lead|head|manager))\b/i],
      [/security|ciso/i, /\b(ciso|security (?:lead|head|team)|it \/ security|it and security)\b/i],
      [/procurement/i, /\b(procurement|purchasing|sourcing)\b/i],
      [/sales head|sales operations|distribution|managing director/i, /\b(sales (?:head|automation|operations)|national sales|head of sales|md\b)\b/i],
    ];
    const aliasHit = ALIASES.some(([r, plan]) => r.test(role) && plan.test(content));
    return planLower.includes(role.toLowerCase()) || sameWords || aliasHit || (acronym.length >= 3 && new RegExp(`\\b${acronym}\\b`, 'i').test(content));
  };
  // A plan whose buyers are asset allocators, a CIO and portfolio managers is an investment sale even when the product words name no sector.
  const investPlan = !sectorCtx.v && ((content.match(/\b(asset allocators?|portfolio managers?|investment committees?|investment managers?|wealth managers?|pensions?|endowments?)\b/gi) ?? []).length >= 2);
  let checkV: Vertical | null = sectorCtx.v ?? (investPlan ? profileFor(VERTICALS.find((x) => x.id === 'ai-native')!, 'investment') : null);
  // The shared reader takes an AI seller whose plan mentions contact centres or tickets for a customer service automation seller. When the
  // seller's OWN lines (the plan title, Message, positioning) name a kind of AI product (voice and language models ...) that kind is used; when they
  // name no kind and no support words, only the checks of the whole vertical are printed (its roles and measures), not the support profile's.
  if (checkV && checkV.committee === AI_SUPPORT_PROFILE.committee) {
    const own = [content.split('\n')[0], ...sellerLines].join(' \n ');
    const base = VERTICALS.find((x) => x.id === 'ai-native')!;
    const st = SUBTYPES.find((x) => x.vertical === 'ai-native' && x.match.test(own));
    if (st) checkV = { ...base, ...st.notes, name: `${base.name}, ${st.name}`, subtype: st.id };
    else if (!/\b(?:customer|technical|tech|it|client|user) support|support (?:tickets?|agents?|teams?|desks?|automation)|tickets?|help ?desks?|contact cent(?:re|er)s?|call cent(?:re|er)s?|service desks?|customer service|customer care\b/i.test(own)) checkV = base;
  }
  // "The plan names X" is only said when the plan's text holds X: a measure by its words (or its words without a tail such as "per site"), a role by its
  // function word on a line that lists roles (buyer roles, owners, champions) or holds a title.
  const roleLines = (() => { const labelled = content.split('\n').filter((l) => /^\s*(?:buyers?|buyer roles?|personas?|roles?|stakeholders?|champions?|decision makers?|economic buyer|owners?|team)\b[^:]*:/i.test(l)); return labelled.length ? labelled : content.split('\n').filter((l) => /\b(?:head of|chief|vp|svp|evp|director|manager|officer|lead|cto|cfo|ciso|cio|coo|cmo|teams?)\b/i.test(l)); })();
  const FUNCTION_SKIP = new Set(['chief', 'head', 'of', 'officer', 'vp', 'svp', 'evp', 'director', 'manager', 'lead', 'senior', 'sr', 'the', 'and', 'or', 'group', 'general', 'global', 'vice', 'president', 'owner', 'business', 'unit', 'operations']);
  const roleFunctionNamed = (role: string): boolean => {
    const keys = role.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 3 && !FUNCTION_SKIP.has(w));
    if (!keys.length) return false;
    return roleLines.some((line) => keys.every((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(line)));
  };
  const metricWordsIn = (m: string): boolean => [m, m.replace(/\s+(?:per|of|on|for|by|at|to)\s+.*$/i, '')].filter((x) => x.length >= 6).some((x) => planLower.includes(x.toLowerCase()));
  output += `## Sector Check\n\n`;
  if (checkV) {
    const v = checkV;
    const rolesNamed = v.buyerRoles.filter((r) => roleNamed(r) || roleFunctionNamed(r));
    const rolesMissing = v.buyerRoles.filter((r) => !rolesNamed.includes(r));
    const metricsNamed = v.metrics.filter(metricWordsIn);
    output += `*Sector: ${sectorCtx.v ? sectorCtx.sector : `read from the buyers your plan names as ${v.name}`}. This is not part of the score.*

Deals in this sector are decided like this: ${lc(v.committee)} ${rolesNamed.length ? `The roles in your plan match ${andList(rolesNamed)}` : 'No role in your plan matches the usual deciders'}${rolesMissing.length ? `${rolesNamed.length ? ', and' : ':'} none matches ${andList(rolesMissing)}` : ''}.

The sector measures ${andList(v.metrics)}; your plan uses the words for ${metricsNamed.length ? andList(metricsNamed) : 'none of them'}. A proof point that lands: ${lc(v.proofShape)} Words this buyer uses: ${v.vocabulary.join(', ')}.
`;
    if (buyerCtx) output += `\nThe buyers your plan aims at are in ${buyerCtx.name}. ${buyerCtx.reviews} ${buyerCtx.buying}\n`;
  } else if (buyerCtx) {
    output += `*Sector: the plan sells into ${buyerCtx.name}; no sector of your own is named in it. This is not part of the score.*

${buyerCtx.reviews} ${buyerCtx.buying} A plan for this buyer should show when the review steps start, who owns each, and what the buyer risks if the purchase goes wrong: ${buyerCtx.risks}.
`;
  } else {
    output += `Neither your product lines nor your buyers name an industry this tool knows. Name the buyer's industry in the plan, or pass the industry input, to get a check against that sector's deciders and measures.\n`;
  }

  // ---- risks: a risk to the plan is told apart from a question a customer asks ----
  const isCustomerQuestion = (t: string): boolean => /\?\s*$/.test(t.trim()) || /^\s*(?:do|does|did|is|are|can|could|will|would|how|what|which|why|when|where)\b/i.test(t.trim());
  // a piece of an abbreviation ("i.e", "e.g") left by the sentence split is not a risk
  const items = riskItems.filter((r) => !/^\s*(?:i\.?e|e\.?g|etc|vs|approx|incl)\.?\s*$/i.test(r.line));
  const questions = items.filter((r) => isCustomerQuestion(r.line));
  const realRisks = items.filter((r) => !isCustomerQuestion(r.line));
  output += `\n## Risks in your plan\n\n`;
  if (items.length === 0) output += 'No risk is named in the plan. Name the top two and how you would respond to each.\n';
  const open = realRisks.filter((r) => !r.answered);
  for (const r of realRisks) {
    const text = r.line.replace(/[.]$/, '');
    output += r.answered ? `- A risk with a response: ${q(text)}.\n` : `- A risk without a response: ${q(text)}.${r.pattern && !/^Ask what lies behind it/.test(r.pattern) ? ` A usual response: ${lc(r.pattern)}` : ''}\n`;
  }
  if (open.length) output += `\nFor ${open.length === 1 ? 'that risk' : `each of the ${open.length} risks without a response`}, add a response, an owner and the signal that triggers it.\n`;
  if (questions.length) {
    output += `${realRisks.length ? '\n' : ''}${questions.length === 1 ? 'One item on your Risks line reads' : `${questions.length} items on your Risks line read`} as ${questions.length === 1 ? 'a question' : 'questions'} a customer would ask, not as ${questions.length === 1 ? 'a risk' : 'risks'} to the plan: ${andList(questions.map((r) => q(r.line.replace(/[.]$/, ''))))}. If you meant them as buyer objections, move them to your objection list and answer them there. For the plan itself, name what could stop the goal being met, with a response, an owner and a trigger for each${buyerCtx ? `; for ${buyerCtx.name} buyers the first candidate is how the buyer reviews and approves a purchase, as described above` : ''}.\n`;
  }

  // ---- how the score was reached: each dimension with its score, the words matched and the plan's own lines ----
  const DIM_HEAD: Record<string, string> = { character: 'C: CHARACTER (who runs it)', result: 'R: RESULT (what success looks like)', artifact: 'A: ARTIFACT (what gets produced)', frame: 'F: FRAME (context and limits)', timeline: 'T: TIMELINE (when it happens)' };
  output += `\n## Dimension by dimension\n\n${dims.map((x) => `### ${DIM_HEAD[x.key]}\n**Score: ${x.d.score}/10**\n\n**Words matched:**\n${x.d.found.length ? x.d.found.slice(0, 5).map((f) => `- "${f}"`).join('\n') : '- None'}${x.d.evidence.length ? `\n\n**Your plan's own line${x.d.evidence.length > 1 ? 's' : ''}:**\n${x.d.evidence.map((e) => `> ${fullEvidence(e)}`).join('\n')}` : ''}${x.d.groupsMissing.length ? `\n\n**Not found:** ${x.d.groupsMissing.join('; ')}.` : ''}`).join('\n\n')}

Timeline counts dates, quarters (such as Q1) and durations with a number (such as 30 days). Words such as by, plan, quarter, month or milestone are not dates and are not scored.${analysis.timeline.found.length === 0 && analysis.timelineWords.length ? ` Your plan has the words ${andList(analysis.timelineWords.slice(0, 3).map((w) => q(w)))}, which are not dates.` : ''}

${stated.length ? `How the labelled lines of the plan count. ${countLines.join(' ')}` : 'The plan has no labelled lines such as "Goal:" or "Owner:", so it was read as running text.'}
`;

  const asks: Array<[string, string]> = [];
  if (!args.intended_audience && !planAudience) asks.push(['intended_audience: who reads and approves the plan', 'which objections and questions the review checks the plan against']);
  if (!args.desired_outcome && !planGoal) asks.push(['desired_outcome: what the plan should make happen', 'whether the review can check the plan against its purpose']);
  if (!checkV && !buyerCtx) asks.push(['the industry input, or the buyer\'s industry in the plan', 'the sector check of deciders and measures']);
  output += `\n${closing(asks)}`;
  return finalise(output);
}
