import { describeChoice, readableChoice, EXAMPLE_FIGURES, SUGGESTION_FOOTER } from './utils.js';
import { readContext, splitItems, q, andList, shortName } from './context.js';

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
  const hypotheses = splitItems(args.key_hypotheses);
  // Readable names for display ("enterprise_software" -> "enterprise software")
  const typeName = readableChoice(interviewType);
  const complexityName = readableChoice(complexity);

  // Run 19 (D80, problems 4 and 8): the sector is the one chosen, else read from what you typed; the questions come from the
  // sector data file (src/verticals.ts). With no sector the generic questions below are used and the answer says so.
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, args.product_context, args.target_persona, args.key_hypotheses);
  const v = ctx.v;
  const industryName = args.industry ? readableChoice(args.industry) : v ? `${v.name} (read from your inputs)` : 'not stated (generic questions are used: set industry or name the sector)';
  const product = shortName(args.product_context) ?? 'the product';
  const subscription = ctx.model === 'saas' || ctx.model === null;
  const leave = subscription ? 'cancel' : 'end the contract or not renew';

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
  const otherRoles = v ? v.buyerRoles.filter((r) => r.toLowerCase() !== personaLower).slice(0, 3) : generic.stakeholders.slice(0, 2);

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
  
  const techQuestions = technicalQuestions[complexity] || technicalQuestions.moderate;
  
  // Interview type-specific question sets (no fill-in brackets: where the interviewer must use the interviewee's own words, the line says so)
  const questionSets: Record<string, { opening: string[]; core: string[]; probing: string[]; closing: string[] }> = {
    discovery: {
      opening: [
        `Tell me about your role as ${args.target_persona}. What does a typical week look like?`,
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
        `How much time/money does this cost you currently?`,
        `Who else is affected by this problem?`
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
        `Show the solution, then ask: What's your initial reaction?`,
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
        `Would you be willing to be a beta tester?`,
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
        `How has it affected your work on ${v ? v.metrics[0] : generic.painPoints[0]}?`
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
  
  // Build hypothesis validation questions: each hypothesis is quoted whole
  let hypothesisSection = '';
  if (hypotheses.length > 0) {
    hypothesisSection = `
---

## Hypothesis Validation Questions

${hypotheses.map((h, i) => `
### Hypothesis ${i + 1}: ${q(h)}

| To Validate | Ask |
|-------------|-----|
| Confirm it is true | "Is this true for you: '${h.replace(/^["']|["']$/g, '').replace(/[.]$/, '')}'? When did you last see it?" |
| Understand severity | "How painful is this (scale 1 to 10)? What does it cost you?" |
| Test assumption | "Tell me about the last time it happened. What did you do?" |
| Find counter-evidence | "What would make this NOT true for you?" |
`).join('')}
`;
  }

  // Questions in the sector's own language (from the data file), else the generic set
  const sectorQuestions = v
    ? [...v.discovery, `How do ${andList(otherRoles)} take part in this decision, and who has the final say?`]
    : [
        `How do you currently handle ${generic.terms[0]}?`,
        `What's your process for ${generic.terms[1]}?`,
        `How do ${generic.stakeholders[0]} and ${generic.stakeholders[1]} collaborate on this?`,
        `What ${generic.terms[2]} challenges have you faced?`
      ];
  const opener = v
    ? `How do you measure ${v.metrics[0]} today, and how much does it vary?`
    : `How much of a challenge is ${generic.painPoints[0]} for you?`;

  return `# Customer Interview Kit
## ${typeName.toUpperCase()} Interview

**Target Persona:** ${args.target_persona}
**Product Context:** ${args.product_context}
**Industry:** ${industryName}
**Complexity Level:** ${describeChoice(args.product_complexity, complexity)}

${ctx.line}

---

## Pre-Interview Checklist

- [ ] Reviewed persona's LinkedIn/background
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

${questions.core.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### ${complexityName.charAt(0).toUpperCase() + complexityName.slice(1)}-Level Technical Questions

${techQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### Industry-Specific Questions (${v ? v.name : industryName})

${sectorQuestions.map((x, i) => `${i + 1}. ${x}`).join('\n')}
${v ? `\n*Who usually decides in this sector: ${v.committee}*\n\n*Words this buyer uses: ${v.vocabulary.join(', ')}. Use them where they are true for the person you interview.*\n` : ''}
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
${EXAMPLE_FIGURES} Tally the Count column against your own number of interviews.
| Signal | Count | Implication |
|--------|-------|-------------|
| Most common pain point | /10 | Include in messaging |
| Most common objection | /10 | Address proactively |
| Most requested feature | /10 | Product input |

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
