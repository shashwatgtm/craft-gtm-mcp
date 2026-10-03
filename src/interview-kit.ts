import { describeChoice, readableChoice, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, q, andList, shortName, capEcho } from './context.js';
import { playbookFor, MODEL_LANGUAGE } from './sector-playbooks.js';

// Run 20 (quality round 1): questions for the person you interview, by the kind of role. A role is read from its title; the questions
// are about that person's own work and measures (no figure, no claim about their company).
const ROLE_FOCUS: Array<{ re: RegExp; label: string; questions: string[] }> = [
  { re: /\b(portfolio manager|chief investment|investment (?:officer|director|committee)|asset (?:allocator|manager)|quant|head of investments?|\bcio\b.*invest)\b/i, label: 'investment decision maker', questions: [
    'Walk me through how an investment idea or a signal gets from first look to a decision. Who has to agree, and what do they ask for?',
    'What would you need to see about a model or a data source before you trusted it: its history, its explanation, or both?',
    'How do you explain a decision to your committee, your board or your clients afterwards, and what is missing from that explanation today?',
    'What did the last tool or data source you adopted have to pass, and who reviewed it?'] },
  { re: /\b(cfo|finance|controller|treasur\w*|accounts? (?:payable|receivable)|accounting|audit)\b/i, label: 'finance leader', questions: [
    'Walk me through the last month-end close: which steps took longest, and which were done by hand?',
    'Where do policy breaches or errors in spend, claims or invoices show up first, and who finds them?',
    'What did your last audit ask for that took days to produce?',
    'Which systems must anything new post into, and who owns that integration?'] },
  { re: /\b(ciso|security|soc\b|risk and compliance|compliance)\b/i, label: 'security role', questions: [
    'Walk me through last week: how many alerts or findings reached the team, and which ones were worked on?',
    'Which findings keep coming back, and what stops the team from closing them?',
    'What did the last audit or incident show that your tools did not?',
    'How would you know a new tool had paid off after three months: fewer alerts, faster fixes, or better audit evidence?'] },
  { re: /\b(cio|cto\b|chief (?:information|technology)|head of (?:it|technology|infrastructure)|it (?:head|director|manager|operations)|infrastructure|network (?:head|manager|lead|engineer)|vp it)\b/i, label: 'IT and infrastructure leader', questions: [
    'Which parts of your estate cause the most calls to your team: sites, links, applications or vendors?',
    'How many providers or vendors do you manage for this today, and who is called first when something fails?',
    'Which contracts end in the next year, and what would make you move one early?',
    'What does a change or a migration need from your team, and when are the windows you can use?'] },
  { re: /\b(coo|operations|last-?mile|supply chain|logistics|fleet|dispatch|transport|warehouse|hub)\b/i, label: 'operations leader', questions: [
    'Walk me through a normal day, and then a bad one: what breaks first when volumes or plans change?',
    'Which numbers do you look at every morning, and who produces them?',
    'Where does work get done twice, or by hand, because two systems do not agree?',
    'What would your team have to give up or learn for a new tool to work, and what would they push back on?'] },
  { re: /\b(sales|revenue|cro|commercial|distribution|trade marketing|go-to-market)\b/i, label: 'sales and revenue leader', questions: [
    'Walk me through how an order or an opportunity moves from the field or the first call to the system, and where it gets stuck.',
    'Which numbers do you review weekly, how late are they, and who has to chase them?',
    'What made your reps or partners drop the last tool you introduced?',
    'Who else must agree before you change how the team sells?'] },
  { re: /\b(engineer\w*|developer|platform|devops|qa\b|architect|product (?:manager|head|lead)|head of product|vp product)\b/i, label: 'engineering or product leader', questions: [
    'Walk me through how a change goes from an idea to production, and where it waits.',
    'Which tools does the team maintain itself, and how much time does that take?',
    'What would a trial need to prove on one real project before you took it further?',
    'Who else has a say: security, procurement, or other teams that depend on the same tools?'] },
  { re: /\b(procurement|vendor|sourcing|purchasing)\b/i, label: 'procurement and vendor management', questions: [
    'Walk me through how a new supplier is assessed here, from request to contract.',
    'How are offers compared: rate card, total cost of the outcome, or something else?',
    'What would make you stop a supplier selection late in the process?',
    'Which references or evidence do you ask suppliers for?'] },
  { re: /\b(customer (?:experience|service|support)|cx\b|contact cent\w*|service desk|support (?:head|manager|lead))\b/i, label: 'customer experience leader', questions: [
    'Walk me through how a customer request is handled from the first contact to the close, and where it waits.',
    'Which measures do you review each week, and which of them do your people feel they can change?',
    'What would a person have to approve before an automated step answers a customer?',
    'What happened the last time something changed in how requests are handled?'] },
];
function roleFocus(persona: string): { label: string; questions: string[] } | null {
  for (const r of ROLE_FOCUS) if (r.re.test(persona)) return { label: r.label, questions: r.questions };
  return null;
}

export function generateCustomerInterviewKit(args: {
  interview_type: string;
  product_context: string;
  industry?: string;
  product_complexity?: string;
  target_persona: string;
  key_hypotheses?: string;
  business_model?: string;
}): string {
  const interviewType = args.interview_type;
  const complexity = args.product_complexity || 'moderate';
  // Run 19 (D80, problem 2): a hypothesis is a sentence. It is split by line or semicolon, never at a comma inside it.
  // A piece that is not a claim (a short list of audiences, "the about page says ...") belongs to the claim before it; it is not a hypothesis of its own.
  const hypotheses: string[] = [];
  let objectionRun = false;
  for (const piece of splitItems(args.key_hypotheses)) {
    const isObjectionLine = /^objections?\s+to\s+test\s*:/i.test(piece);
    if (isObjectionLine) objectionRun = true;
    const notClaim = !objectionRun && hypotheses.length > 0 && !/^objections?\b/i.test(hypotheses[hypotheses.length - 1] ?? '') && (/^(?:the\s+)?(?:about\s+|home\s+)?page\s+(?:says|states|calls|notes)/i.test(piece) || (piece.split(/\s+/).length <= 6 && !/\b(is|are|was|were|has|have|means?|causes?|caused|breaks?|drift\w*|runs?|rely|relies|fails?|needs?|lose|loses|takes?|struggles?|can|will|do|does)\b/i.test(piece)));
    if (notClaim) hypotheses[hypotheses.length - 1] += `; ${piece}`; else hypotheses.push(piece);
  }
  // Readable names for display ("enterprise_software" -> "enterprise software")
  const typeName = readableChoice(interviewType);
  const complexityName = readableChoice(complexity);

  // Run 19 (D80, problems 4 and 8): the sector is the one chosen, else read from what you typed; the questions come from the
  // sector data file (src/verticals.ts). With no sector the generic questions below are used and the answer says so.
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [args.product_context], context: [args.key_hypotheses], role: [args.target_persona] });
  const v = ctx.v;
  const industryName = args.industry ? readableChoice(args.industry) : v ? `${v.name} (read from your inputs)` : 'not stated (generic questions are used: set industry or name the sector)';
  const product = shortName(args.product_context) ?? 'the product';
  const subscription = ctx.model === 'saas' || ctx.model === null;
  const lang = MODEL_LANGUAGE[ctx.model ?? 'saas'];
  const leave = lang.leave;
  const pb = v ? playbookFor(v) : null;
  const focus = roleFocus(args.target_persona);

  // Generic context for the choices that are not one of the owner's verticals (ecommerce, marketplace, enterprise software, consumer, other)
  const genericContext: Record<string, { terms: string[]; painPoints: string[]; stakeholders: string[] }> = {
    ecommerce: {
      terms: ['conversion', 'cart abandonment', 'fulfillment', 'inventory', 'customer lifetime value'],
      painPoints: ['abandoned carts', 'returns', 'inventory management', 'shipping costs'],
      stakeholders: ['Operations', 'Marketing', 'Customer Service', 'Finance']
    },
    marketplace: {
      terms: ['supply', 'demand', 'liquidity', 'trust', 'matching'],
      painPoints: ['chicken-and-egg', 'quality control', 'fraud', 'pricing'],
      stakeholders: ['Suppliers/Sellers', 'Buyers', 'Operations', 'Trust & Safety']
    },
    enterprise_software: {
      terms: ['deployment', 'customization', 'training', 'support SLA', 'roadmap'],
      painPoints: ['long implementation', 'change management', 'vendor lock-in', 'TCO'],
      stakeholders: ['IT', 'Procurement', 'End Users', 'Executive Sponsor']
    },
    consumer: {
      terms: ['engagement', 'retention', 'virality', 'monetization', 'UX'],
      painPoints: ['attention span', 'switching costs', 'trust', 'value clarity'],
      stakeholders: ['End User', 'Household decision-maker', 'Influencers']
    },
    other: {
      terms: ['workflow', 'efficiency', 'ROI', 'implementation', 'support'],
      painPoints: ['time', 'cost', 'complexity', 'adoption'],
      stakeholders: ['Decision maker', 'End user', 'Influencer', 'Procurement']
    }
  };
  const generic = genericContext[args.industry && genericContext[args.industry] ? args.industry : 'other'];
  const personaLower = args.target_persona.trim().toLowerCase();
  // Investment decision makers (a portfolio manager, a chief investment officer) are not customer-experience buyers even when the
  // seller is read as AI native: their measures, peers and questions come from the role, not from the support-automation sector notes.
  const investing = ctx.model === 'investment' || focus?.label === 'investment decision maker';
  const INVEST = {
    metrics: ['performance against the agreed benchmark', 'risk-adjusted return', 'tracking error', 'turnover', 'how well each signal can be explained'],
    roles: ['Chief Investment Officer', 'Head of Risk', 'Head of Compliance', 'Head of Investment Operations'],
    discovery: ['How do you decide which signals or data sources to trust, and who signs off?', 'What does your committee need to see before it accepts a model-based input?', 'How do you judge whether a signal has added value: against which benchmark, over what period?', 'Which data may not leave your environment?', 'How do you document the reasoning behind a decision for clients, trustees or regulators?'],
  };
  const measures = investing ? INVEST.metrics : v ? v.metrics : [];
  const otherRoles = investing ? INVEST.roles.filter((r) => r.toLowerCase() !== personaLower).slice(0, 3) : v ? v.buyerRoles.filter((r) => r.toLowerCase() !== personaLower).slice(0, 3) : generic.stakeholders.slice(0, 2);

  // Complexity-based question depth
  const technicalQuestions: Record<string, string[]> = {
    simple: [
      'How did you first hear about solutions like this?',
      'What made you decide to try it?',
      'How easy was it to get started?'
    ],
    moderate: [
      `Walk me through your typical workflow with ${product}.`,
      'What integrations are most important to you?',
      'How do you measure success with tools like this?'
    ],
    complex: [
      'Can you describe your current technical architecture for this function?',
      'What security and compliance requirements affect your decisions?',
      'How does this fit into your broader technology strategy?'
    ],
    highly_technical: [
      'What APIs or data formats are you working with?',
      'Walk me through your deployment and infrastructure requirements.',
      'How do you handle scaling, failover, and disaster recovery?',
      'What are your latency/performance requirements?'
    ]
  };
  
  // A software buyer is asked about integrations and deployment; for services, connectivity and the other sectors the depth comes from the sector
  // (src/sector-playbooks.ts), cut to the complexity chosen.
  const softwareLike = ctx.model === null || ctx.model === 'saas' || ctx.model === 'hardware_software' || ctx.model === 'transactions';
  const depth = ({ simple: 2, moderate: 3, complex: 4, highly_technical: 4 } as Record<string, number>)[complexity] ?? 3;
  const techQuestions = pb && !(softwareLike && v && (v.id === 'software' || v.id === 'saas') && complexity !== 'simple')
    ? [...pb.deepQuestions.slice(0, depth), ...(softwareLike && (complexity === 'complex' || complexity === 'highly_technical') ? ['What security and compliance requirements affect your decision, and who reviews them?'] : [])]
    : (technicalQuestions[complexity] || technicalQuestions.moderate);
  
  // Interview type-specific question sets (no fill-in brackets: where the interviewer must use the interviewee's own words, the line says so)
  const questionSets: Record<string, { opening: string[]; core: string[]; probing: string[]; closing: string[] }> = {
    discovery: {
      opening: [
        `Tell me about your role (${args.target_persona}). What does a typical week look like?`,
        `What are your top 3 priorities this quarter?`,
        `How long has this problem been on your team's list, and who noticed it first?`
      ],
      core: [
        `Walk me through the last time you hit this problem. What happened?`,
        `What solutions have you tried? What worked and didn't work?`,
        `How are you solving this problem today?`,
        `What would "perfect" look like for you?`,
        `Who else is affected or involved: ${andList(otherRoles)}?`
      ],
      probing: [
        `Pick something they just said that sounded important and ask: "Can you tell me more about that?"`,
        `Why is that important to you specifically?`,
        `What happens if this problem isn't solved?`,
        `How much time or money does this cost you currently, and where is that written down?`
      ],
      closing: [
        `If you could wave a magic wand, what would change?`,
        `What would make you excited to try a new solution?`,
        `Is there anything I should have asked but didn't?`
      ]
    },
    validation: {
      opening: [
        `Thanks for taking the time. I'd love to show you what we're building and get your honest reaction.`,
        `Before I show you anything, tell me: what's your current biggest challenge in this area?`
      ],
      core: [
        `Show the ${subscription ? 'solution' : 'offer'}, then ask: What's your initial reaction?`,
        `How excited would you be to try this (scale 1 to 10)? Why that number?`,
        `What would need to change for that to be a 10?`,
        `How does this compare to what you're using today?`,
        `Would this solve the problem you mentioned earlier?`
      ],
      probing: [
        `When I showed the main feature, what was your first reaction? What did you expect to see instead?`,
        `What concerns do you have?`,
        `Who else would need to approve using something like this?`,
        `What would stop you from trying this tomorrow?`,
        `How much would you expect to pay for something like this?`
      ],
      closing: [
        `Would you be willing to ${subscription ? 'be a beta tester' : `take part in a ${lang.pilot}`}?`,
        `Who else should I talk to about this?`,
        `Can I follow up in a few weeks with updates?`
      ]
    },
    feedback: {
      opening: [
        `Thanks for being a customer! How has your experience been overall?`,
        `What initially made you decide to use ${product}?`,
        `How long have you been using it?`
      ],
      core: [
        `What's the #1 thing you value about it?`,
        `What's the #1 thing that frustrates you?`,
        `What do you use most? Least?`,
        `Has it delivered on what you expected?`,
        `How has it affected your work on ${measures.length ? measures[0] : generic.painPoints[0]}?`
      ],
      probing: [
        `Pick a feature they mentioned and ask: "What specifically about it works or doesn't work?"`,
        `If you could add one thing, what would it be?`,
        `Have you recommended us to others? Why/why not?`,
        `What would make you a raving fan?`,
        `How does our support compare to other vendors?`
      ],
      closing: [
        `Would you be open to being a reference/case study?`,
        `How likely are you to recommend us (scale 0 to 10)? Note the score.`,
        `What advice would you give our product team?`
      ]
    },
    churn: {
      opening: [
        `I appreciate you taking the time despite deciding to leave. Your feedback is invaluable.`,
        `Can you tell me about your experience with us overall?`,
        `When did you first start thinking about leaving?`
      ],
      core: [
        `What was the primary reason you decided to ${leave}?`,
        `Were there any secondary reasons?`,
        `What did you switch to? What made that option better?`,
        `Was there anything we could have done to keep you?`,
        `Did you feel you got value from ${product}?`
      ],
      probing: [
        `They gave a main reason for leaving. Ask: "When did that first become a problem?"`,
        `Did you reach out to support about this? What happened?`,
        `What would have needed to change for you to stay?`,
        `How did you make the final decision? Who was involved?`,
        `Looking back, what should we have done differently?`
      ],
      closing: [
        `Is there any scenario where you'd consider coming back?`,
        `What should we tell other customers who have similar concerns?`,
        `Is there anything else you want us to know?`
      ]
    },
    win_loss: {
      opening: [
        `Thank you for sharing your decision process with us.`,
        `Can you walk me through how you evaluated solutions?`,
        `Who was involved in the decision?`
      ],
      core: [
        `What were your top criteria when evaluating options?`,
        `Which vendors did you consider? For a win: why did you choose us? For a loss: why did you choose the other vendor?`,
        `What was the deciding factor?`,
        `How did pricing factor into the decision?`,
        `What did you think of our sales process?`
      ],
      probing: [
        `Which criterion mattered most, and why was it so important?`,
        `How did we compare on that criterion?`,
        `What did the vendor you chose do well that we didn't?`,
        `What could our sales team have done better?`,
        `Were there any surprises during the evaluation?`
      ],
      closing: [
        `What advice would you give us for similar evaluations?`,
        `If this was a loss: what would need to change for you to consider us in the future?`,
        `Can I share this feedback with our team?`
      ]
    },
    persona_research: {
      opening: [
        `I'm trying to deeply understand the ${args.target_persona} role. Tell me about your day-to-day.`,
        `How did you end up in this role?`,
        `What does success look like in your position?`
      ],
      core: [
        `What are the biggest challenges you face?`,
        `What tools and resources do you rely on most?`,
        `How do you stay current in your field?`,
        `What metrics are you measured on?`,
        `Who do you collaborate with most?`
      ],
      probing: [
        `Walk me through a recent project you're proud of.`,
        `What skills separate great ${/s$/i.test(args.target_persona.trim()) ? args.target_persona.trim() : `${args.target_persona}s`} from good ones?`,
        `What do you wish you had known when you started?`,
        `What trends are you watching in your field?`,
        `What frustrates you most about your role?`
      ],
      closing: [
        `What advice would you give someone entering your field?`,
        `What's one thing you'd change about how your industry works?`,
        `Who else should I talk to to understand this role better?`
      ]
    }
  };
  
  const questions = questionSets[interviewType] || questionSets.discovery;
  const norm = (t: string): string => t.toLowerCase().replace(/[^a-z ]/g, '').split(' ').slice(0, 8).join(' ');
  const seen = new Set<string>();
  const fresh = (list: string[]): string[] => list.filter((x) => { const k = norm(x); if (seen.has(k)) return false; seen.add(k); return true; });
  
  // Build hypothesis validation questions: each hypothesis is quoted whole. A line that starts "objections to test:" is an objection, not a claim.
  let hypothesisSection = '';
  const metric1 = measures.length ? measures[0] : 'the cost or time it takes';
  if (hypotheses.length > 0) {
    hypothesisSection = `
---

## Hypothesis Validation Questions

${(() => { let inObjections = false; return hypotheses.map((raw, i) => {
  // "objections to test:" starts a run of objections, which lasts until a new "hypothesis" label
  if (/^hypothes[ei]s\s*:/i.test(raw)) inObjections = false;
  if (/^objections?\s+to\s+test\s*:/i.test(raw)) inObjections = true;
  const isObjection = inObjections;
  const h = raw.replace(/^objections?\s+to\s+test\s*:\s*/i, '');
  const plain = h.replace(/^["']|["']$/g, '').replace(/[.]$/, '');
  const shown = capEcho(plain, 220).short;
  if (isObjection) return `
### Objection ${i + 1}: ${q(h)}

| To Validate | Ask |
|-------------|-----|
| Find where it comes from | "When did this first come up, and what happened that made it a concern?" |
| Test how strong it is | "If this were solved, would it change your decision? What else would still stand in the way?" |
| Find the evidence they trust | "What would you need to see to put this concern to rest, and who would need to see it?" |
| Find counter-evidence | "Tell me about a time this concern turned out not to matter." |
`;
  return `
### Hypothesis ${i + 1}: ${q(h)}

| To Validate | Ask |
|-------------|-----|
| Confirm it is true | "Is this true for you: ${plain.length <= 260 ? `'${plain}'` : 'the statement above'}? When did you last see it?" |
| Understand severity | "What does it cost you (time, rework, money or risk), and who feels it first?" |
| Test assumption | "Tell me about the last time it happened. What did you do, and who was involved?" |
| Find counter-evidence | "What would make this NOT true for you, and where have you seen the opposite?" |
`;
}); })().join('')}
`;
  }

  // Questions in the sector's own language (from the data file), else the generic set
  const sectorQuestions = v || investing
    ? [...(investing ? INVEST.discovery : v!.discovery), `How do ${andList(otherRoles)} take part in this decision, and who has the final say?`]
    : [
        `How do you currently handle ${generic.terms[0]}?`,
        `What's your process for ${generic.terms[1]}?`,
        `How do ${generic.stakeholders[0]} and ${generic.stakeholders[1]} collaborate on this?`,
        `What ${generic.terms[2]} challenges have you faced?`
      ];
  const opener = measures.length
    ? `How do you measure ${measures[0]} today, and how much does it vary?`
    : `How much of a challenge is ${generic.painPoints[0]} for you?`;

  // Topic questions from the words of the product and the hypotheses (a billing platform, an API platform): about the buyer's own work, never about the product.
  const topicText = `${args.product_context} ${args.key_hypotheses ?? ''}`;
  const topicQs: string[] = [];
  if (/\b(billing|invoic\w*|proration|dunning|revenue recogni\w*)\b/i.test(topicText)) topicQs.push('How are plan and price changes turned into invoices today, and who checks them before they go out?', 'Where do invoice disputes and failed payments get handled, and how long do they stay open?', 'How long after month end is revenue closed, and what holds it up: reconciliation, usage data or approvals?', 'Which systems must billing connect to: CRM, ERP, tax, payment gateway?');
  if (/\b(apis?|specs?|openapi|collections?|api lifecycle|governance)\b/i.test(topicText) && /\b(api|specs?|collections?)\b/i.test(topicText)) topicQs.push('Where do your API specs, collections and docs live today, and who keeps them in step when an API changes?', 'How does another team find out that an API exists, and how do they know it is the current one?', 'Which governance rules are checked automatically, and which only in a review that comes late?');
  const coreList = fresh([...questions.core]);
  const techList = fresh([...techQuestions, ...topicQs]);
  const sectorList = fresh(sectorQuestions);
  const roleList = focus ? fresh(focus.questions) : [];

  return `# Customer Interview Kit
## ${typeName.toUpperCase()} Interview

**Target Persona:** ${args.target_persona}
**Product Context:** ${args.product_context}
**Industry:** ${industryName}
**Complexity Level:** ${describeChoice(args.product_complexity, complexity)}

${ctx.line}

---

## Pre-Interview Checklist

- [ ] Reviewed persona's LinkedIn/background${measures.length ? `\n- [ ] Know the measures this person is judged on (${andList(measures.slice(0, 3))}) and use them as the buyer does` : ''}
- [ ] Tested recording equipment
- [ ] Prepared note-taking template
- [ ] Sent calendar invite with clear agenda
- [ ] Confirmed interview timing (45-60 min recommended)
- [ ] Prepared incentive (if applicable)

---

## Interview Objectives

1. Understand the current reality and challenges of: ${args.target_persona}
2. ${interviewType === 'discovery' ? 'Identify unmet needs and pain points' :
     interviewType === 'validation' ? 'Test solution assumptions and get honest reaction' :
     interviewType === 'feedback' ? 'Gather improvement ideas and satisfaction signals' :
     interviewType === 'churn' ? 'Understand true reasons for leaving' :
     interviewType === 'win_loss' ? 'Learn what drove the decision' :
     'Build deep persona understanding'}
3. Gather stories and quotes for internal use
${hypotheses.length > 0 ? `4. Validate/invalidate key hypotheses` : ''}

---

## Opening (5 min)

*Build rapport before diving into questions*

${questions.opening.map(q => `- ${q}`).join('\n')}

**Industry-specific opener:** "${opener}"

---

## Core Questions (25-30 min)

### Main Line of Inquiry

${coreList.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### ${complexityName.charAt(0).toUpperCase() + complexityName.slice(1)}-Level Technical Questions

${techList.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### Industry-Specific Questions (${investing ? `${v ? `${v.name}, ` : ''}investment decision makers` : v ? v.name : industryName})

${sectorList.map((x, i) => `${i + 1}. ${x}`).join('\n')}
${focus && roleList.length ? `\n### Questions for ${/^[aeiou]/i.test(focus.label) ? 'an' : 'a'} ${focus.label} (${args.target_persona})\n\n${roleList.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n` : ''}
${v && !investing ? `\n*Who usually decides in this sector: ${v.committee}*\n\n*Words this buyer uses: ${v.vocabulary.join(', ')}. Use them where they are true for the person you interview.*\n` : ''}
---

## Probing Questions (Use as needed)

*Follow the energy: when they light up or seem frustrated, probe deeper*

${questions.probing.map(q => `- ${q}`).join('\n')}

**Silence technique:** After an answer, wait 3-5 seconds. They often add the most valuable insights in the silence.

---

## Closing (5 min)

${questions.closing.map(q => `- ${q}`).join('\n')}

**Always end with:** "Is there anything I should have asked but didn't?"

${hypothesisSection}

---

## Note-Taking Template

\`\`\`
INTERVIEW: ${typeName.toUpperCase()} | ${args.target_persona}
DATE: _______________
DURATION: _______________

CONTEXT:
- Company/Role: 
- Experience level:
- Current solution:

KEY QUOTES:
1. "_______________" (re: ___)
2. "_______________" (re: ___)
3. "_______________" (re: ___)

PAIN POINTS IDENTIFIED:
- [ ] _______________
- [ ] _______________
- [ ] _______________

NEEDS/WANTS:
- Must have:
- Nice to have:
- Unexpected:

${hypotheses.length > 0 ? `HYPOTHESIS VALIDATION:
${hypotheses.map((h, i) => `- H${i + 1}: Confirmed / Rejected / Unclear`).join('\n')}` : ''}

FOLLOW-UP ACTIONS:
- [ ] _______________
- [ ] _______________
\`\`\`

---

## Synthesis Framework

After conducting multiple interviews, map findings to:

### ICP Signals
Tally the Count column as "interviews that said it, out of the interviews you ran".
| Signal | Count | Implication |
|--------|-------|-------------|
| Most common pain point | | Include in messaging |
| Most common objection | | Address proactively |
| ${subscription ? 'Most requested feature' : 'Most requested change to the service'} | | ${subscription ? 'Product input' : 'Service design input'} |

### Persona Insights
| Attribute | Pattern | Source Quotes |
|-----------|---------|---------------|
| Goals | | |
| Challenges | | |
| Decision criteria | | |
| Information sources | | |

---

*Interview kit generated for ${typeName} interviews using the CRAFT GTM framework*
*Customized for ${v ? v.name : industryName} at ${complexityName} complexity level*

${SUGGESTION_FOOTER}`;
}
