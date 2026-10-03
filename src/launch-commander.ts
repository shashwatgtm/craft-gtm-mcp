import { formatDate, addDays, calculateDaysUntil, describeChoice, EXAMPLE_FIGURE } from './utils.js';
import { readContext, sectorNotes, q, andList, capEcho, splitTopLevel, splitPhrases } from './context.js';
import { PLAYBOOKS, MODEL_LANGUAGE, segmentNotes } from './sector-playbooks.js';

// Run 20 (quality round 1): the product text is read as a name and a description ("Name: what it does"), so a sentence is built from parts
// and never from a text cut in the middle of a phrase.
function parseProduct(text: string): { name: string; rest: string } {
  const t = text.trim().replace(/\s+/g, ' ');
  const colon = t.indexOf(':');
  if (colon > 0 && t.slice(0, colon).split(' ').length <= 10) return { name: t.slice(0, colon).trim(), rest: t.slice(colon + 1).trim() };
  const comma = t.indexOf(',');
  if (comma > 0 && t.slice(0, comma).split(' ').length <= 8) return { name: t.slice(0, comma).trim(), rest: t.slice(comma + 1).trim() };
  return { name: t.split(' ').length <= 8 ? t : capEcho(t, 70).short, rest: t.split(' ').length <= 8 ? '' : t };
}

const lower1 = (t: string): string => (/^[A-Z]{2,}\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
const aAn = (word: string): string => (/^[aeiou]/i.test(word.trim()) ? 'an' : 'a');
const initials = (role: string): string => role.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('');
const upperFirst = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

// A contract sold to a buying committee (services, connectivity, investment, hardware plus software) has no landing page, blog or in-app
// message as its launch channels: each software launch task is swapped for the sales-led task that does the same job.
const CONTRACT_SWAP: Record<string, string> = {
  'landing page update': 'Service page and solution brief for the buying committee',
  'landing page design': 'Service page and solution brief for the buying committee',
  'email sequences': 'Account-based emails to named contacts',
  'blog post': 'Point-of-view article for the buyer\'s leaders',
  'blog content': 'Point-of-view article for the buyer\'s leaders',
  'announcement email': 'Announcement to existing customers through their account managers',
  'email blast': 'Announcement to existing customers through their account managers',
  'customer email': 'Note to existing customers from their account managers',
  'in-app notification': 'Account-team briefing for existing customers',
  'in-app message': 'Account-team briefing for existing customers',
  'changelog update': 'Service change notice to customers',
  'release notes': 'Service change notes for customers',
  'support brief': 'Account-team and support briefing',
  'support prep': 'Support and escalation contacts briefed',
  'demo videos': 'Walkthrough for the buying committee',
  'customer webinar': 'Customer roundtable with a similar buyer',
  'webinar/event': 'Customer roundtable or executive briefing',
  'press kit': 'Briefing pack for analysts and advisers',
  'beta invitations': 'Invitations to selected accounts for a pilot',
  'onboarding flow': 'Onboarding plan for pilot accounts',
  'bug tracking': 'Issue log shared with pilot accounts',
  'monitor usage': 'Review service levels and usage at pilot accounts',
  'feature tips': 'Service review at the first live customers',
  'success stories': 'Reference call or case study from a pilot customer',
  'beta criteria': 'Pilot criteria agreed with the pilot accounts',
  'feedback system': 'Review meeting schedule with the pilot accounts',
  'nda if needed': 'Confidentiality terms for the pilot accounts',
  'thank testers': 'Thank-you and next steps for pilot accounts',
  'ga decision': 'Decision to roll out beyond the pilot',
  'case studies': 'Reference calls and case study from the pilot accounts',
  'paid campaigns': 'Targeted outreach to named accounts',
  'community seeding': 'Introductions through partners and advisers',
};

interface Phase {
  name: string;
  weekRange: string;
  startOffset: number;
  endOffset: number;
  focus: string;
  tasks: string[];
}

// Parse flexible date formats
function parseLaunchDate(dateInput?: string): { date: Date | null; isFlexible: boolean; displayDate: string } {
  if (!dateInput || dateInput.toLowerCase() === 'tbd') {
    return { date: null, isFlexible: true, displayDate: 'TBD (To Be Determined)' };
  }
  
  // Check for quarter format: Q1 2025, Q2 2025, etc.
  const quarterMatch = dateInput.match(/Q([1-4])\s*(\d{4})/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = parseInt(quarterMatch[2]);
    const quarterStartMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    const midMonth = quarterStartMonths[quarter - 1] + 1; // Middle of quarter
    return { 
      date: new Date(year, midMonth, 15), 
      isFlexible: true, 
      displayDate: `Q${quarter} ${year} (planning mode)` 
    };
  }
  
  // Check for month year format: March 2025, Mar 2025
  const monthMatch = dateInput.match(/([A-Za-z]+)\s*(\d{4})/);
  if (monthMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.findIndex(m => monthMatch[1].toLowerCase().startsWith(m));
    if (monthIndex !== -1) {
      const year = parseInt(monthMatch[2]);
      return { 
        date: new Date(year, monthIndex, 15), 
        isFlexible: true, 
        displayDate: `${monthMatch[1]} ${year} (planning mode)` 
      };
    }
  }
  
  // Standard date format
  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    return { date, isFlexible: false, displayDate: formatDate(date) };
  }
  
  // Fallback
  return { date: null, isFlexible: true, displayDate: dateInput };
}

export function generateLaunchCommander(args: {
  product_feature: string;
  launch_type: string;
  target_segments: string;
  goals: string;
  launch_date?: string;
  available_channels?: string;
  team_size?: string;
  budget_level?: string;
  business_model?: string;
  industry?: string;
}): string {
  const { date: launchDate, isFlexible, displayDate } = parseLaunchDate(args.launch_date);
  const launchType = args.launch_type || 'feature_launch';
  const teamSize = args.team_size || 'small_2_5';
  const budgetLevel = args.budget_level || 'moderate';
  const segments = splitTopLevel(args.target_segments).map((x) => x.charAt(0).toUpperCase() + x.slice(1));
  const daysUntilLaunch = launchDate ? calculateDaysUntil(launchDate.toISOString()) : null;
  // Run 19 (D80, problems 4 and 8): the sector and the business model are read from the inputs; a launch to a sales-led buyer
  // (services, connectivity, investment, hardware plus software, or a sector whose deals run through a buying committee)
  // gets no consumer or software-only tasks.
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [args.product_feature], context: [args.goals], buyer: [args.target_segments] });
  const salesLed = (ctx.model !== null && ctx.model !== 'saas' && ctx.model !== 'marketplace') || (ctx.v !== null && ctx.v.id !== 'saas' && ctx.v.id !== 'software');
  const subscription = ctx.model === 'saas' || ctx.model === null;
  const contractSale = salesLed && !subscription && ctx.model !== 'transactions';
  const pb = ctx.v ? PLAYBOOKS[ctx.v.id] : null;
  const lang = MODEL_LANGUAGE[ctx.model ?? 'saas'];
  const product = parseProduct(args.product_feature);
  // Channels: the ones you named; else email, LinkedIn and blog drive the task filter, and the sector's own channels are shown.
  const channelsGiven = args.available_channels ? splitTopLevel(args.available_channels) : [];
  const channels = channelsGiven.length ? channelsGiven : ['email', 'linkedin', 'blog'];
  const shownChannels = channelsGiven.length ? channelsGiven.map((ch) => (ch.toLowerCase() === 'linkedin' ? 'LinkedIn' : ch)) : pb ? pb.channels : channels.map((ch) => (ch.toLowerCase() === 'linkedin' ? 'LinkedIn' : ch));
  const SWAP: Record<string, string> = {
    'waitlist campaign': 'Early-access list of named accounts',
    'influencer outreach': 'Customer and peer advocate outreach',
    'product hunt (if applicable)': 'Analyst and trade-press briefings',
    'social campaign': 'LinkedIn posts from your experts and customers',
    'social posts': 'LinkedIn posts from your experts and customers',
    'a few influencer posts': 'Posts from customers and your own experts',
    'influencer campaigns': 'Customer-advocate programme',
    'help docs': 'Customer guide and runbook',
  };
  const adaptTask = (task: string): string => {
    const k = task.toLowerCase();
    if (salesLed && SWAP[k]) return SWAP[k];
    if (contractSale && CONTRACT_SWAP[k]) return CONTRACT_SWAP[k];
    if (salesLed && k === 'adoption tracking' && pb) return `Adoption tracking: ${pb.adoption.measure}`;
    if (!subscription && /^in-app (notification|message)$/.test(k)) return 'Account-team briefing for existing customers';
    return task;
  };
  
  // Define phase structure based on launch type
  // (weekRange is the heading shown in planning mode; the offsets drive the dates)
  const phases: Record<string, Phase[]> = {
    major_release: [
      { name: 'Foundation', weekRange: 'Weeks 12 to 9 before launch', startOffset: -84, endOffset: -63, focus: 'Research & Strategy', tasks: ['Finalize positioning', 'Competitive analysis', 'Messaging framework', 'Content strategy', 'Channel planning'] },
      { name: 'Content Creation', weekRange: 'Weeks 8 to 5 before launch', startOffset: -56, endOffset: -35, focus: 'Asset Development', tasks: ['Landing page design', 'Demo videos', 'Blog content', 'Sales enablement', 'Press kit'] },
      { name: 'Pre-Launch', weekRange: 'Weeks 4 to 2 before launch', startOffset: -28, endOffset: -14, focus: 'Build Anticipation', tasks: ['Waitlist campaign', 'Influencer outreach', 'Internal training', 'PR coordination', 'Beta feedback integration'] },
      { name: 'Launch Week', weekRange: 'Week 1 before launch to launch week (week 0)', startOffset: -7, endOffset: 0, focus: 'Execute Launch', tasks: ['Press release', 'Email blast', 'Social campaign', 'Webinar/event', 'Product Hunt (if applicable)'] },
      { name: 'Post-Launch', weekRange: 'Weeks 1 to 4 after launch', startOffset: 1, endOffset: 28, focus: 'Optimize & Scale', tasks: ['Monitor metrics', 'Gather feedback', 'Address issues', 'Amplify wins', 'Iterate messaging'] }
    ],
    feature_launch: [
      { name: 'Prep', weekRange: 'Weeks 6 to 4 before launch', startOffset: -42, endOffset: -28, focus: 'Planning', tasks: ['Positioning', 'Key messages', 'Content brief', 'Channel selection'] },
      { name: 'Build', weekRange: 'Weeks 3 to 2 before launch', startOffset: -21, endOffset: -14, focus: 'Create Assets', tasks: ['Landing page update', 'Email sequences', 'Blog post', 'Help docs'] },
      { name: 'Launch', weekRange: 'Week 1 before launch to launch week (week 0)', startOffset: -7, endOffset: 0, focus: 'Go Live', tasks: ['Announcement email', 'In-app notification', 'Social posts', 'Customer webinar'] },
      { name: 'Follow-up', weekRange: 'Weeks 1 to 2 after launch', startOffset: 1, endOffset: 14, focus: 'Drive Adoption', tasks: ['Adoption tracking', 'Feature tips', 'Success stories', 'Feedback loop'] }
    ],
    beta_launch: [
      { name: 'Setup', weekRange: 'Weeks 4 to 3 before launch', startOffset: -28, endOffset: -21, focus: 'Prepare Beta', tasks: ['Beta criteria', 'Feedback system', 'Communication plan', 'Success metrics'] },
      { name: 'Recruit', weekRange: 'Weeks 2 to 1 before launch', startOffset: -14, endOffset: -7, focus: 'Get Testers', tasks: ['Beta invitations', 'Onboarding flow', 'Expectation setting', 'NDA if needed'] },
      { name: 'Run', weekRange: 'Launch week (week 0) to week 2 after launch', startOffset: 0, endOffset: 14, focus: 'Active Beta', tasks: ['Monitor usage', 'Collect feedback', 'Bug tracking', 'Regular check-ins'] },
      { name: 'Close', weekRange: 'Weeks 3 to 4 after launch', startOffset: 15, endOffset: 28, focus: 'Wrap Up', tasks: ['Synthesize feedback', 'Thank testers', 'GA decision', 'Case studies'] }
    ],
    product_update: [
      { name: 'Prepare', weekRange: 'Weeks 2 to 1 before launch', startOffset: -14, endOffset: -7, focus: 'Get Ready', tasks: ['Release notes', 'Email draft', 'Support prep'] },
      { name: 'Launch', weekRange: 'Launch week (week 0)', startOffset: 0, endOffset: 0, focus: 'Announce', tasks: ['Customer email', 'In-app message', 'Changelog update', 'Support brief'] }
    ],
    market_expansion: [
      { name: 'Research', weekRange: 'Weeks 10 to 7 before launch', startOffset: -70, endOffset: -49, focus: 'Market Analysis', tasks: ['Market sizing', 'Competitor mapping', 'Localization needs', 'Partner identification'] },
      { name: 'Adapt', weekRange: 'Weeks 6 to 4 before launch', startOffset: -42, endOffset: -28, focus: 'Localization', tasks: ['Messaging localization', 'Pricing strategy', 'Legal/compliance', 'Payment methods'] },
      { name: 'Seed', weekRange: 'Weeks 3 to 1 before launch', startOffset: -21, endOffset: -7, focus: 'Build Presence', tasks: ['Local partnerships', 'PR outreach', 'Pilot customers', 'Local hiring'] },
      { name: 'Launch', weekRange: 'Launch week (week 0)', startOffset: 0, endOffset: 0, focus: 'Market Entry', tasks: ['Launch event', 'Press release', 'Paid campaigns', 'Community seeding'] },
      { name: 'Scale', weekRange: 'Weeks 1 to 6 after launch', startOffset: 1, endOffset: 42, focus: 'Grow Market', tasks: ['Performance optimization', 'Expand channels', 'Local team growth', 'Customer success'] }
    ]
  };
  
  const selectedPhases = phases[launchType] || phases.feature_launch;
  
  // Filter tasks based on available channels
  const filterTasksByChannels = (tasks: string[]): string[] => {
    return tasks.filter(task => {
      const taskLower = task.toLowerCase();
      if (channels.some(ch => taskLower.includes(ch.toLowerCase()))) return true;
      if (['position', 'messaging', 'strategy', 'feedback', 'metric', 'monitor', 'plan', 'brief'].some(word => taskLower.includes(word))) return true;
      if ((taskLower.includes('webinar') || taskLower.includes('roundtable')) && !channels.some(ch => /webinar|event|roundtable/.test(ch.toLowerCase()))) return false;
      // Run 19: "pr" is the word PR or press, not the letters inside prep, program or pricing.
      if (/\b(pr|press)\b/.test(taskLower) && !channels.some(ch => ch.toLowerCase().includes('pr'))) return false;
      if (taskLower.includes('paid') && !channels.some(ch => ch.includes('paid'))) return false;
      return true;
    });
  };
  
  // Adjust task assignment based on team size
  const getOwner = (taskType: string): string => {
    const ownerMap: Record<string, Record<string, string>> = {
      solo: { strategy: 'You', content: 'You', execution: 'You', sales: 'You' },
      small_2_5: { strategy: 'Lead', content: 'Content/Lead', execution: 'Team', sales: 'Sales' },
      medium_6_15: { strategy: 'Director', content: 'Content Team', execution: 'Campaign Manager', sales: 'Sales Enablement' },
      large_15_plus: { strategy: 'VP/Director', content: 'Content Lead', execution: 'Campaign Team', sales: 'Sales Enablement Team' }
    };
    return ownerMap[teamSize]?.[taskType] || 'TBD';
  };
  
  // Budget-appropriate tactics (a sales-led launch spends on named accounts, not on influencers or broad ads)
  const budgetTactics: Record<string, string[]> = salesLed ? {
    bootstrap: ['Posts from your experts and customers', 'Content for the buying committee', 'Partner co-marketing', 'Email to named accounts'],
    moderate: ['Account-based outreach to named accounts', 'Small executive roundtable', 'Posts from customers and your own experts', 'Targeted ads to named accounts'],
    well_funded: ['Account-based programme across the target list', 'Executive events', 'Customer-advocate programme', 'Analyst and advisor relations']
  } : {
    bootstrap: ['Organic social', 'Content marketing', 'Community building', 'Partner co-marketing', 'Email marketing'],
    moderate: ['Targeted paid ads', 'Small event/webinar', 'A few influencer posts', 'Retargeting', 'Content syndication'],
    well_funded: ['Multi-channel paid', 'Large events', 'Influencer campaigns', 'PR agency', 'ABM programs']
  };
  
  const availableTactics = (budgetTactics[budgetLevel] || budgetTactics.moderate).map(adaptTask);

  // Days until launch: counted from today to the user's date. A quarter or a month
  // (planning mode) is counted to an assumed mid-month day, so that figure is an example.
  let daysNote = '';
  if (daysUntilLaunch !== null) {
    if (daysUntilLaunch <= 0) daysNote = ' (PAST DUE)';
    else if (isFlexible) daysNote = ` (about ${daysUntilLaunch} days away, counted to an assumed mid-month date) ${EXAMPLE_FIGURE}`;
    else daysNote = ` (${daysUntilLaunch} days away)`;
  }

  // Goals: one per line or semicolon; a comma run is split only where each piece is a goal of its own, so "ten deals at $120,000, with CIO as the buyer" stays one goal.
  const goalList = splitPhrases(args.goals);
  const buyerNamed = (args.goals.match(/\bwith\s+(?:the\s+)?([A-Za-z][A-Za-z .&/-]{1,50}?)\s+as\s+(?:the\s+)?(?:buyer|sponsor|champion|decision[- ]maker)\b/i) || [])[1]?.trim() ?? null;

  // Build the launch plan
  const featureHead = capEcho(args.product_feature, 120);
  let output = `# Launch Command Center
## ${featureHead.short}
${featureHead.capped ? `\n**What you are launching (as you wrote it):** ${args.product_feature.trim()}\n` : ''}
**Launch Type:** ${launchType.replace(/_/g, ' ').toUpperCase()}
**Launch Date:** ${displayDate}${daysNote}
**Team Size:** ${describeChoice(args.team_size, teamSize)}
**Budget Level:** ${describeChoice(args.budget_level, budgetLevel)}

${ctx.line}

${pb ? `**How this plan is tuned:** ${ctx.v!.name} deals run through a buying committee (${lower1(ctx.v!.committee.split(';')[0])}), so the plan ${contractSale ? `swaps the software launch tasks for ${lang.pilot}, account-based outreach and reference calls` : 'adds the sector tasks (committee briefing, proof point, objection answers) to the usual launch tasks'}.${buyerNamed ? ` You named ${buyerNamed} as the buyer: the briefing and the messages below are written for that role.` : ''}\n` : ''}
---

## Launch Goals

${goalList.map(g => `- ${g}`).join('\n')}

---

## Target Segments

${segments.map((s, i) => `${i + 1}. **${s}**`).join('\n')}

---

## Active Channels
${channelsGiven.length ? '' : `\n*Channels not supplied: ${pb ? `these are the usual channels for ${ctx.v!.name} buyers` : 'these defaults are assumed'}.*\n`}
${shownChannels.map(ch => `- ${ch}`).join('\n')}

**Budget-Appropriate Tactics:**
${availableTactics.map(t => `- ${t}`).join('\n')}

---

## Launch Timeline

${!launchDate
  ? '*No exact launch date: the task due dates below count back from today, as if launching today. Add a launch date (YYYY-MM-DD) for a real schedule.*\n\n'
  : isFlexible
    ? `*Planning mode: the task due dates below count back from an assumed launch date of ${formatDate(launchDate)}.*\n\n`
    : ''}*Task dates are suggestions spread across each phase: move them to fit your launch day.*

`;

  // Generate detailed timeline - use current date as reference if no launch date
  const referenceDate = launchDate || new Date();
  
  // Run 19 (rule B82): tasks from the sector data file (who decides, what proof lands, the usual objections), each in the phase where it belongs.
  // Run 20: plus the sector's own launch tasks (pilot site, integration path, security pack ...) from src/sector-playbooks.ts.
  const buyerRoles = ctx.v ? (buyerNamed ? andList([buyerNamed, ...ctx.v.buyerRoles.filter((r) => !r.toLowerCase().includes(buyerNamed.toLowerCase()) && initials(r).toLowerCase() !== buyerNamed.toLowerCase().replace(/\./g, '')).slice(0, 3)]) : andList(ctx.v.buyerRoles.slice(0, 4))) : '';
  const sectorTasks: Array<{ task: string; phase: number; owner: string }> = ctx.v && pb ? [
    { task: `Brief the buying committee: ${buyerRoles}`, phase: 0, owner: 'sales' },
    { task: pb.launchTasks[0], phase: 0, owner: 'strategy' },
    { task: pb.launchTasks[1], phase: 1, owner: 'execution' },
    { task: `Prepare the proof point: ${lower1(ctx.v.proofShape).replace(/[.]$/, '')}`, phase: 1, owner: 'content' },
    { task: pb.launchTasks[2], phase: 1, owner: 'execution' },
    { task: `Prepare sales answers to the usual objections: ${andList(ctx.v.objections.slice(0, 3).map(o => lower1(o.objection)))}`, phase: 2, owner: 'sales' },
  ] : [];
  for (const [pi, phase] of selectedPhases.entries()) {
    const phaseStart = addDays(referenceDate, phase.startOffset);
    const phaseEnd = addDays(referenceDate, phase.endOffset);
    const isCurrentPhase = launchDate ? (new Date() >= phaseStart && new Date() <= phaseEnd) : false;
    
    output += `### ${phase.name} Phase${isCurrentPhase ? ' (current phase)' : ''}
**${isFlexible ? phase.weekRange : formatDate(phaseStart) + ' to ' + formatDate(phaseEnd)}** | Focus: ${phase.focus}

| Task | Owner | Due | Status |
|------|-------|-----|--------|
`;
    
    const extra = sectorTasks.filter((t) => Math.min(t.phase, selectedPhases.length - 1) === pi);
    const base = filterTasksByChannels(phase.tasks.map(adaptTask)).map((task) => ({
      task,
      owner: task.toLowerCase().includes('strategy') || task.toLowerCase().includes('position') ? 'strategy' :
             task.toLowerCase().includes('content') || task.toLowerCase().includes('blog') ? 'content' :
             task.toLowerCase().includes('sales') || task.toLowerCase().includes('enablement') ? 'sales' : 'execution',
    }));
    const filteredTasks = [...base, ...extra.map((t) => ({ task: t.task, owner: t.owner }))];
    filteredTasks.forEach((item, i) => {
      const taskDate = addDays(phaseStart, Math.floor((i / filteredTasks.length) * (phase.endOffset - phase.startOffset)));
      const isPast = taskDate < new Date();
      output += `| ${item.task} | ${getOwner(item.owner)} | ${formatDate(taskDate)} | ${isPast ? 'Check' : 'Pending'} |\n`;
    });
    
    output += '\n';
  }

  // Segment-specific messaging, built from the product text, the goals and the sector (nothing is left as a blank)
  output += `---

## Segment Messaging Matrix

${pb ? `*The pain points, proof and next step below come from what ${ctx.v!.name} buyers usually look for: confirm each with the segment in your first conversations. The product description is yours.*\n\n` : `*No sector was clear from your inputs, so the pain point is a question to ask. Name the industry (the industry input) to get sector pain points, proof and next steps.*\n\n`}`;

  const restShort = product.rest ? capEcho(product.rest, 220).short : '';
  output += `**The product, in your words:** "${product.name.replace(/[.]$/, '')}"${restShort ? `: "${restShort}"` : ''}\n\n`;
  segments.forEach((segment, si) => {
    const pains = pb ? [pb.pains[si % pb.pains.length], pb.pains[(si + 1) % pb.pains.length]] : [];
    const metricList = ctx.v ? ctx.v.metrics : [];
    const metric = metricList.length ? metricList[si % metricList.length] : '';
    const vocab = ctx.v ? andList(ctx.v.vocabulary.slice(0, 4)) : '';
    const seg = segmentNotes(segment);
    output += `### ${segment}

| Element | Content |
|---------|---------|
| Primary Pain Point | ${pb ? `Usually: ${pains[0]}; also ${pains[1]}. Confirm which one ${segment} feels most.` : `Not known from your inputs. Ask ${segment}: "What does this problem cost you today, and who owns the number?"`} |
| Key Message | ${pb ? `Show ${segment} how ${q(product.name)} deals with ${pains[0]}${metric ? `, and measure the result by ${metric}` : ''}.${vocab ? ` Use the words this buyer uses (${vocab}).` : ''}` : `Lead with ${q(product.name)} for ${segment}${restShort ? `, in your words: "${restShort}"` : ''}. Add the outcome you can prove.`}${buyerNamed ? ` Write it for the ${buyerNamed}.` : ''} |${seg ? `\n| What the buying process usually involves | For ${segment}: ${seg.review}. Have the answers ready before they are asked. |` : ''}
| Proof Point | ${ctx.v ? `Collect from ${aAn(segment)} ${segment} customer: ${lower1(ctx.v.proofShape)}` : `A before and after from one ${segment} customer on the goal you set.`} |
| CTA | ${pb ? `${pb.cta}.` : `Ask ${segment} for one next step: a working session on their own data or process.`} |
| Primary Channel | ${channelsGiven[0] ?? (pb ? pb.channels[0] : channels[0])} |

`;
  });

  // Run 12 (R12-21): the user's goals go in the Target column of the row they match; other rows ask for a target,
  // and a goal that matches no row gets a row of its own. The goals are printed as typed.
  // Run 19 (D80, problem 3): each goal is filed under its own metric, one by one (money, meetings and sign-ups, reach, adoption,
  // other). Before, the first row that matched filled itself, so "40 qualified meetings with National Sales Heads" went to Revenue.
  const kindOf = (g: string): string =>
    /pipeline|revenue|\$|closed|\barr\b|\bmrr\b|bookings?|deal value/i.test(g) ? 'Revenue'
    : /meeting|demo|sign-?up|trial|\bleads?\b|registr|attend|click|\bctr\b|opportunit|\bcalls?\b|inquir|enquir/i.test(g) ? 'Engagement'
    : /view|impression|visit|traffic|reach|download|follower|aware/i.test(g) ? 'Awareness'
    : /activat|usage|active user|adopt|conversion|retention|rollout|renew|reference|go-?live|live sites?/i.test(g) ? 'Adoption'
    : 'Other goal';
  const tracking: Record<string, string> = { Awareness: contractSale ? 'Named accounts reached (CRM)' : 'Analytics', Engagement: contractSale ? 'Meetings with named contacts (CRM)' : 'CRM/Analytics', Adoption: pb ? `${upperFirst(pb.adoption.measure)} (${pb.adoption.source})` : 'Product or service usage data', Revenue: 'CRM', 'Other goal': 'Name the source (not supplied)' };
  const rows = ['Awareness', 'Engagement', 'Adoption', 'Revenue'].map((kind) => {
    const mine = goalList.filter((g) => kindOf(g) === kind);
    return [kind, mine.length ? mine.join('; ') : 'No goal given for this metric: add a target if it matters', tracking[kind]];
  });
  goalList.filter((g) => kindOf(g) === 'Other goal').forEach((g) => rows.push(['Other goal', g, tracking['Other goal']]));
  const metricRows = rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n');

  const riskRows = ctx.v
    ? ctx.v.objections.slice(0, 4).map((o) => `| ${o.objection} | ${o.response} | ${getOwner('sales')} |`)
    : [];
  output += `---

## Success Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
${metricRows}

---

${ctx.v ? `${sectorNotes(ctx.v, 'committee')}\n\n---\n\n` : ''}## Risk Mitigation

| Risk | Mitigation | Owner |
|------|------------|-------|
| Launch delay | Build in a buffer week | ${getOwner('strategy')} |
${riskRows.join('\n')}${riskRows.length ? '\n' : ''}| ${contractSale ? 'Cut-over or pilot problems' : 'Technical issues'} | ${contractSale ? 'Agree a fallback and a rollback rule for each stage before it starts' : 'Document a rollback plan'} | ${contractSale ? 'Delivery lead' : 'Engineering'} |
| Competitive response | Update the battle cards | ${getOwner('sales')} |
${subscription ? '| Low awareness | Have a backup paid campaign ready | ' + getOwner('execution') + ' |\n' : ''}
---

## Pre-Launch Checklist

- [ ] Positioning finalized and approved
- [ ] All assets created and reviewed
- [ ] Sales team trained
- [ ] ${contractSale ? 'Customer guide, runbook and escalation contacts ready' : 'Support documentation ready'}
- [ ] Analytics tracking configured
- [ ] ${contractSale ? 'Fallback and rollback plan documented' : 'Rollback plan documented'}
- [ ] Success metrics defined
- [ ] Post-launch monitoring assigned
${pb ? pb.checklist.map((c) => `- [ ] ${c}`).join('\n') + '\n' : ''}
---

*Launch plan generated for ${launchType.replace(/_/g, ' ')} using the CRAFT GTM framework*`;

  return output;
}
