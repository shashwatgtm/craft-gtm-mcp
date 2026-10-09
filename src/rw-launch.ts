// Run 22 (writer cg-w2): the rewritten launch_commander, retention_playbook and crisis_planner.
// Each tool writes a finished draft from the user's own inputs: every input is used where it matters, in clean sentences, nothing is invented
// (no figure, customer, date or promise that was not given), and what was not given is named once at the end ("To sharpen this, give: ...").
// The business model decides the wording (a services firm has no free trial, a connectivity seller has no per seat price).
// Sector knowledge comes only from the shared data files (src/verticals.ts and src/sector-playbooks.ts); this file adds none.
import { formatDate, addDays, calculateDaysUntil, readableChoice, pct, roundTypedPercents, EXAMPLE_FIGURE, EXAMPLE_FIGURES } from './utils.js';
import { readContext, q, andList, splitTopLevel, splitPhrases, lcFirst, cleanCompanyName, answerFor, type Context, type BusinessModel } from './context.js';
import { playbookFor, MODEL_LANGUAGE, segmentNotes, segmentKinds, SUBTYPE_PLAYBOOKS, type PlaybookOverlay } from './sector-playbooks.js';
import { SUBTYPES, SECTOR_MODEL, MODEL_NAME } from './verticals.ts';

// ---------------------------------------------------------------------------------------------------------------------------------
// Small helpers shared by the three tools
// ---------------------------------------------------------------------------------------------------------------------------------
const upper1 = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const stripEnd = (t: string): string => t.trim().replace(/[\s.;:,]+$/, '');
/** A sentence: first letter capital, one full stop at the end. */
const sentence = (t: string): string => { const x = stripEnd(t); return x ? `${upper1(x)}.` : ''; };
const aAn = (word: string): string => (/^[aeiou]/i.test(word.trim()) ? 'an' : 'a');
const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);
const initials = (role: string): string => role.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('');
const cell = (t: string): string => t.replace(/\|/g, '/');
const escapeRe = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Typed text in quotes. The echo safeguard already wraps a text that tried to give an instruction in curly quotes: it is then shown as it is. */
const quoted = (t: string): string => (/^\u201C[\s\S]*\u201D$/.test(t.trim()) ? t.trim() : q(t));

/** What was not given, named once at the end: "To sharpen this, give: X (it would change Y)". */
function sharpenBlock(items: Array<[string, string]>): string {
  if (!items.length) return '';
  return `\n---\n\n**To sharpen this, give:**\n${items.map(([what, change]) => `- ${what} (it would change ${change})`).join('\n')}\n`;
}

/** A second copy of a line that is long enough to be a sentence is dropped: the safety net behind the careful writing. */
function dropRepeatedLines(text: string): string {
  const seen = new Set<string>();
  return text.split('\n').filter((line) => {
    const key = line.trim().toLowerCase();
    if (key.length < 50 || /^\|[-: |]+\|$/.test(key) || /^#/.test(key)) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join('\n');
}

/**
 * The business model the wording follows. A model read from the typed text is trusted unless it is a connectivity contract for a company that
 * is not read as telecom (the word "connectivity" or "gateway" in a banking or software description): then the sector's usual model is used.
 */
function wordingModel(ctx: Context, given: boolean): BusinessModel | null {
  if (!given && ctx.model === 'connectivity' && ctx.v && ctx.v.id !== 'telecom') return SECTOR_MODEL[ctx.v.id];
  return ctx.model;
}

/** The line that says how the sector and the model were read; when the wording model differs from the one read, the line says which one the plan follows. */
function readLine(ctx: Context, model: BusinessModel | null, neutralConnectivity = false): string {
  if (neutralConnectivity && ctx.how === 'sector' && model === 'connectivity') return `*Sector: ${ctx.sector}. Business model: not given, so the plan uses wording that fits any company in the sector (set business_model to change it).*`;
  return model !== ctx.model && model ? `*Sector: ${ctx.sector}. Business model: ${MODEL_NAME[model]} (the usual model in this sector, assumed; set business_model to change it).*` : ctx.line;
}

/** The kinds of company in the sector that have lines of their own in the given fields, when the sector was read without a kind. */
function kindsWithLines(ctx: Context, fields: Array<keyof PlaybookOverlay>): string[] {
  const v = ctx.v;
  if (!v || v.subtype || /billing|investment management/i.test(v.name)) return [];
  return SUBTYPES.filter((st) => st.vertical === v.id && SUBTYPE_PLAYBOOKS[st.id] && fields.some((f) => SUBTYPE_PLAYBOOKS[st.id][f] !== undefined)).map((st) => st.name);
}
/** Whether the sector notes of this company are those of its kind (a kind was read) or only the vertical's neutral lines. */
const kindRead = (ctx: Context): boolean => !!ctx.v && (!!ctx.v.subtype || /billing|investment management/i.test(ctx.v.name));

/** A list typed by the user: one item per line or per semicolon; a comma run of short items is split too. A long clause with commas stays whole. */
export function typedList(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const parts = text.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (parts.length === 1 && /,/.test(parts[0])) {
    const c = splitTopLevel(parts[0], false);
    if (c.length > 1 && c.every((x) => x.split(/\s+/).length <= 10) && !c.some((x) => /^(?:not|but|and|or|so|which|that|because|with|where|while|then)\b/i.test(x))) return c;
  }
  return parts;
}

/** The product text read as a name and a description. A name is found only where the text names it ("Name: what it does", "Name, a description"); otherwise the product is "your solution". */
export function productParts(text: string): { name: string | null; desc: string; wrapped: boolean } {
  const t = text.trim().replace(/\s+/g, ' ');
  if (/^\u201C[\s\S]*\u201D$/.test(t)) return { name: null, desc: t, wrapped: true };
  const r = productPartsPlain(t);
  return { ...r, wrapped: false };
}
// a verb or joining word that ends a name written as a clause ("Name connects branch offices ...")
const VERB_JOINER = /\s+(?:connects?|helps?|lets?|gives?|makes?|builds?|runs?|designs?|turns?|unifies?|joins?|uses?|brings?|powers?|automates?|offers?|provides?|enables?|delivers?|is|are|that|which|who|where)\b/i;
// Words that start a description, not a name ("Cloud-native, composable core banking ...", "Operating system built to power ..."): then the product has no clear name.
const DESCRIPTIVE = new Set(['cloud', 'cloud-native', 'operations', 'digital', 'data', 'modern', 'global', 'smart', 'intelligent', 'enterprise', 'open', 'unified', 'connected', 'integrated', 'automated', 'managed', 'secure', 'next', 'real', 'technology', 'software', 'network', 'security', 'cyber', 'mobile', 'online', 'retail', 'financial', 'payments', 'logistics', 'customer', 'business', 'ai', 'ai-native', 'platform', 'composable', 'operating', 'full-stack', 'end-to-end']);
function looksLikeName(head: string): boolean {
  const w = head.split(' ');
  if (/\b(?:to|that|which|who|built|designed|made|for|with|from|using|where|when)\b/.test(head)) return false;
  if (/^[A-Za-z]+(?:ing|ed)$/.test(w[0]) && w.length > 1) return false;
  return !DESCRIPTIVE.has(w[0].toLowerCase());
}
function productPartsPlain(t: string): { name: string | null; desc: string } {
  let head: string | null = null; let rest = '';
  const colon = t.match(/^([^:]{2,140}?):\s+(.+)$/);
  const comma = t.match(/^([^,]{2,50}),\s+(.+)$/);
  const startsAsName = (h: string): boolean => /^[A-Z0-9]/.test(h) || /^[a-z]+[A-Z]/.test(h);
  if (colon && startsAsName(colon[1]) && colon[1].replace(/\([^)]*\)/g, '').split(' ').filter(Boolean).length <= 12) { head = colon[1].trim(); rest = colon[2].trim(); }
  else if (comma && comma[1].split(' ').length <= 5 && startsAsName(comma[1]) && !/^(?:A|An|The|Our|My)\b/.test(comma[1])) { head = comma[1].trim(); rest = comma[2].trim(); }
  if (head !== null) {
    // a bracket after the name ("Name (what it covers): ...") is part of the description, not of the name
    const br = head.match(/^(.+?)\s*\(([^)]*)\)\s*$/);
    if (br && br[1].split(' ').length <= 12) { rest = `${br[2].trim()}; ${rest}`; head = br[1].trim(); }
    const c = head.indexOf(', ');
    if (c > 0) {
      // "Name, a description": the name is the words before the comma, when they are few; a long head with a comma has no clear name
      if (head.slice(0, c).split(' ').length > 4) return { name: null, desc: t };
      rest = `${head.slice(c + 2).trim()}; ${rest}`; head = head.slice(0, c).trim();
    }
    const j = head.search(VERB_JOINER);
    if (j > 0) { rest = `${head.slice(j).trim()}; ${rest}`; head = head.slice(0, j).trim(); }
    if (head.split(' ').length > 8 || !looksLikeName(head)) return { name: null, desc: t };
    return { name: head, desc: rest };
  }
  const words = t.split(' ');
  // a short text is a name on its own ("Lanehop", "Lanehop route planner", "branch44")
  if (words.length === 1 && /^[A-Za-z][A-Za-z0-9.&+-]*$/.test(t)) return { name: t, desc: '' };
  if (words.length <= 4 && /^[A-Z0-9]/.test(t) && !/[.;:!?]$/.test(t)) return { name: t, desc: '' };
  if (words.length <= 5 && /^[A-Z0-9]/.test(t) && words.every((w) => /^[A-Z0-9][\w.&+-]*$/.test(w) || /^[a-z]+\d+\w*$/.test(w) || /^(?:of|and|for|by)$/.test(w))) return { name: t, desc: '' };
  return { name: null, desc: t };
}

/** A list of items for a sentence: "a, b and c", or with semicolons when an item holds "and" or a comma itself. */
function listOf(items: string[]): string {
  if (items.length < 2) return items.join('');
  if (!items.some((x) => / and |,|;/.test(x))) return andList(items);
  if (!items.some((x) => /,|;/.test(x))) return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
}

/**
 * The pieces of a product description, each a clean phrase (no piece is cut in the middle). A run of one or two word items that follows a
 * phrase with a preposition ("one catalog for flat rate, per seat, usage based, tiered") belongs to that phrase and is joined back onto it.
 */
function capabilityList(desc: string): string[] {
  const parts = capabilityPieces(desc);
  // a list of fragments ("4G, LTE-M", "not voice") is not a list of parts: the description is then shown whole, as written
  const ragged = parts.filter((x) => /^(?:not|and|or|only)\b/i.test(x) || /^(?:recommends?|finds?|plans?|researches|delivers?|lets|gives|helps|connects|automates|tracks|prints|generates|detects|combines|enables|provides|offers|supports|covers|handles|manages|moves|sends|scans|scores|ranks)\b/.test(x) || (x.split(/\s+/).length <= 6 && /,\s*\S+(?:\s+\S+)?$/.test(x))).length;
  return parts.length > 1 && ragged >= 1 ? [] : parts;
}
function capabilityPieces(desc: string): string[] {
  if (!desc) return [];
  const sentences = desc.split(/(?<=[.!?])\s+(?=[A-Z])/).map((x) => stripEnd(x)).filter(Boolean);
  const pieces: string[] = [];
  for (const sent of sentences) {
    if (sent.split(/\s+/).length <= 16 && !/;/.test(sent)) { pieces.push(sent); continue; }
    // A piece that stops right after a preposition and one short noun, or right after "that" and a verb, is the start of a list: the pieces that follow it are its items.
    const opensList = (t: string): boolean => /\b(?:that|which|who)\s+\w+$/i.test(t) || (/\b(?:for|of|with|over|across|including|such as)\s+(?![\d])\S+(?:\s+\S+)?$/i.test(t) && !/\b(?:for|of|with|over|across|including|such as)\s+[^,]*\band\b/i.test(t.slice(Math.max(0, t.search(/\b(?:for|of|with|over|across|including|such as)\s+\S+(?:\s+\S+)?$/i)))));
    for (const line of sent.split(/\n|;/).map((x) => x.trim()).filter(Boolean)) {
      // the line is cut at its commas; a piece that opens with a joining word continues the one before it
      const parts: string[] = [];
      for (const raw of splitTopLevel(line, false)) {
        const piece = stripEnd(raw.replace(/^(?:and|or|plus)\s+/i, ''));
        if (!piece) continue;
        if (parts.length && /^(?:which|that|where|because|including|while|then|with)\b/i.test(piece)) parts[parts.length - 1] += `, ${piece}`;
        else parts.push(piece);
      }
      const merged: string[] = []; let open = false; let started = false; let names = false;
      for (const part of parts) {
        const w = part.split(/\s+/).length;
        const plain = !/^[0-9]/.test(part) && !/^(?:a|an|the|one)\b/i.test(part);
        const relative = merged.length > 0 && /\b(?:that|which|who)\s+\w+$/i.test(merged[merged.length - 1]);
        // a run of single names ("Docker, Linux, Windows, macOS") is one part, with the item that ends the list
        if (merged.length && w === 1 && /^[^,\s]+(?:, [^,\s]+)*$/.test(merged[merged.length - 1])) { merged[merged.length - 1] += `, ${part}`; names = true; open = false; continue; }
        if (merged.length && names && w <= 6 && / and /.test(part)) { merged[merged.length - 1] += `, ${part}`; names = false; continue; }
        names = false;
        if (merged.length && open && w <= (started ? 4 : relative ? 3 : 2) && plain) { merged[merged.length - 1] += `, ${part}`; open = !/ and /.test(part); started = true; continue; }
        if (merged.length && open && w <= (started ? 6 : 4) && plain && / and /.test(part)) { merged[merged.length - 1] += `, ${part}`; open = false; continue; }
        merged.push(part); open = opensList(part); started = false;
      }
      pieces.push(...merged);
    }
  }
  return pieces.filter((x) => x.split(/\s+/).length <= 24).filter((x, i, a) => a.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// launch_commander
// ---------------------------------------------------------------------------------------------------------------------------------
interface Phase { name: string; weekRange: string; startOffset: number; endOffset: number; focus: string; tasks: string[]; }
interface LaunchCtx {
  N: string; NS: string; segs: string[]; segList: string; segRef: string; segEach: string; buyer: string | null; channels: string[]; channelList: string; mode: 'self' | 'committee' | 'contract';
  caps: string[]; adoption: string; goals: string[]; ctx: Context; launchWord: string;
}

// A contract sold to a buying committee (services, connectivity, investment, hardware plus software) has no landing page, blog or in-app
// message as its launch channels: each software launch task is swapped for the sales-led task that does the same job.
const CONTRACT_SWAP: Record<string, string> = {
  'landing page update': 'Service page and solution brief for the buying committee', 'landing page design': 'Service page and solution brief for the buying committee',
  'email sequences': 'Account-based emails to named contacts', 'blog post': 'Point-of-view article for the buyer\'s leaders', 'blog content': 'Point-of-view article for the buyer\'s leaders',
  'announcement email': 'Announcement to existing customers through their account managers', 'email blast': 'Announcement to existing customers through their account managers',
  'customer email': 'Note to existing customers from their account managers', 'in-app notification': 'Account-team briefing for existing customers', 'in-app message': 'Account-team briefing for existing customers',
  'changelog update': 'Service change notice to customers', 'release notes': 'Service change notes for customers', 'support brief': 'Account-team and support briefing', 'support prep': 'Support and escalation contacts briefed',
  'demo videos': 'Walkthrough for the buying committee', 'customer webinar': 'Customer roundtable with a similar buyer', 'webinar/event': 'Customer roundtable or executive briefing',
  'press kit': 'Briefing pack for analysts and advisers', 'beta invitations': 'Invitations to selected accounts for a pilot', 'onboarding flow': 'Onboarding plan for pilot accounts',
  'bug tracking': 'Issue log shared with pilot accounts', 'monitor usage': 'Review service levels and usage at pilot accounts', 'feature tips': 'Service review at the first live customers',
  'success stories': 'Reference call or case study from a pilot customer', 'beta criteria': 'Pilot criteria agreed with the pilot accounts', 'feedback system': 'Review meeting schedule with the pilot accounts',
  'nda if needed': 'Confidentiality terms for the pilot accounts', 'thank testers': 'Thank-you and next steps for pilot accounts', 'ga decision': 'Decision to roll out beyond the pilot',
  'case studies': 'Reference calls and case study from the pilot accounts', 'paid campaigns': 'Targeted outreach to named accounts', 'community seeding': 'Introductions through partners and advisers',
};
const SALES_SWAP: Record<string, string> = {
  'waitlist campaign': 'Early-access list of named accounts', 'influencer outreach': 'Customer and peer advocate outreach', 'product hunt (if applicable)': 'Analyst and trade-press briefings',
  'social campaign': 'LinkedIn posts from your experts and customers', 'social posts': 'LinkedIn posts from your experts and customers', 'a few influencer posts': 'Posts from customers and your own experts',
  'influencer campaigns': 'Customer-advocate programme', 'help docs': 'Customer guide and runbook',
};

const PHASES: Record<string, Phase[]> = {
  major_release: [
    { name: 'Foundation', weekRange: 'Weeks 12 to 9 before launch', startOffset: -84, endOffset: -63, focus: 'Research and strategy', tasks: ['Finalize positioning', 'Competitive analysis', 'Messaging framework', 'Content strategy', 'Channel planning'] },
    { name: 'Content Creation', weekRange: 'Weeks 8 to 5 before launch', startOffset: -56, endOffset: -35, focus: 'Asset development', tasks: ['Landing page design', 'Demo videos', 'Blog content', 'Sales enablement', 'Press kit'] },
    { name: 'Pre-Launch', weekRange: 'Weeks 4 to 2 before launch', startOffset: -28, endOffset: -14, focus: 'Build anticipation', tasks: ['Waitlist campaign', 'Influencer outreach', 'Internal training', 'PR coordination', 'Beta feedback integration'] },
    { name: 'Launch Week', weekRange: 'Week 1 before launch to launch week (week 0)', startOffset: -7, endOffset: 0, focus: 'Execute the launch', tasks: ['Press release', 'Email blast', 'Social campaign', 'Webinar/event', 'Product Hunt (if applicable)'] },
    { name: 'Post-Launch', weekRange: 'Weeks 1 to 4 after launch', startOffset: 1, endOffset: 28, focus: 'Optimize and scale', tasks: ['Monitor metrics', 'Gather feedback', 'Address issues', 'Amplify wins', 'Iterate messaging'] },
  ],
  feature_launch: [
    { name: 'Prep', weekRange: 'Weeks 6 to 4 before launch', startOffset: -42, endOffset: -28, focus: 'Planning', tasks: ['Positioning', 'Key messages', 'Content brief', 'Channel selection'] },
    { name: 'Build', weekRange: 'Weeks 3 to 2 before launch', startOffset: -21, endOffset: -14, focus: 'Create assets', tasks: ['Landing page update', 'Email sequences', 'Blog post', 'Help docs'] },
    { name: 'Launch', weekRange: 'Week 1 before launch to launch week (week 0)', startOffset: -7, endOffset: 0, focus: 'Go live', tasks: ['Announcement email', 'In-app notification', 'Social posts', 'Customer webinar'] },
    { name: 'Follow-up', weekRange: 'Weeks 1 to 2 after launch', startOffset: 1, endOffset: 14, focus: 'Drive adoption', tasks: ['Adoption tracking', 'Feature tips', 'Success stories', 'Feedback loop'] },
  ],
  beta_launch: [
    { name: 'Setup', weekRange: 'Weeks 4 to 3 before launch', startOffset: -28, endOffset: -21, focus: 'Prepare the beta', tasks: ['Beta criteria', 'Feedback system', 'Communication plan', 'Success metrics'] },
    { name: 'Recruit', weekRange: 'Weeks 2 to 1 before launch', startOffset: -14, endOffset: -7, focus: 'Get testers', tasks: ['Beta invitations', 'Onboarding flow', 'Expectation setting', 'NDA if needed'] },
    { name: 'Run', weekRange: 'Launch week (week 0) to week 2 after launch', startOffset: 0, endOffset: 14, focus: 'Active beta', tasks: ['Monitor usage', 'Collect feedback', 'Bug tracking', 'Regular check-ins'] },
    { name: 'Close', weekRange: 'Weeks 3 to 4 after launch', startOffset: 15, endOffset: 28, focus: 'Wrap up', tasks: ['Synthesize feedback', 'Thank testers', 'GA decision', 'Case studies'] },
  ],
  product_update: [
    { name: 'Prepare', weekRange: 'Weeks 2 to 1 before launch', startOffset: -14, endOffset: -7, focus: 'Get ready', tasks: ['Release notes', 'Email draft', 'Support prep'] },
    { name: 'Launch', weekRange: 'Launch week (week 0)', startOffset: 0, endOffset: 0, focus: 'Announce', tasks: ['Customer email', 'In-app message', 'Changelog update', 'Support brief'] },
  ],
  market_expansion: [
    { name: 'Research', weekRange: 'Weeks 10 to 7 before launch', startOffset: -70, endOffset: -49, focus: 'Market analysis', tasks: ['Market sizing', 'Competitor mapping', 'Localization needs', 'Partner identification'] },
    { name: 'Adapt', weekRange: 'Weeks 6 to 4 before launch', startOffset: -42, endOffset: -28, focus: 'Localization', tasks: ['Messaging localization', 'Pricing strategy', 'Legal/compliance', 'Payment methods'] },
    { name: 'Seed', weekRange: 'Weeks 3 to 1 before launch', startOffset: -21, endOffset: -7, focus: 'Build presence', tasks: ['Local partnerships', 'PR outreach', 'Pilot customers', 'Local hiring'] },
    { name: 'Launch', weekRange: 'Launch week (week 0)', startOffset: 0, endOffset: 0, focus: 'Market entry', tasks: ['Launch event', 'Press release', 'Paid campaigns', 'Community seeding'] },
    { name: 'Scale', weekRange: 'Weeks 1 to 6 after launch', startOffset: 1, endOffset: 42, focus: 'Grow the market', tasks: ['Performance optimization', 'Expand channels', 'Local team growth', 'Customer success'] },
  ],
};

/** What each task means for this launch, in a sentence built from the user's inputs. Keys are the task titles in lower case (after the swap for a sales-led launch). */
const DETAIL: Record<string, (c: LaunchCtx) => string> = {
  // planning
  'positioning': (c) => `Write one paragraph on who ${c.N} is for (${c.segRef}), the problem it removes and why it beats what they use today${c.buyer ? `; check it with someone in the ${c.buyer} role` : ''}`,
  'finalize positioning': (c) => `Settle who ${c.N} is for (${c.segRef}), the problem it removes and why it beats what they use today${c.buyer ? `; check it with someone in the ${c.buyer} role` : ''}`,
  'key messages': (c) => `One message for ${c.segEach}, in the words that buyer uses, with a proof point behind each`,
  'messaging framework': (c) => `One message for ${c.segEach}, in the words that buyer uses, with a proof point behind each`,
  'content brief': (c) => `Decide what to publish for ${c.segRef} on ${c.channelList}, and tie each piece to one of the goals`,
  'content strategy': (c) => `Decide what to publish for ${c.segRef} on ${c.channelList}, and tie each piece to one of the goals`,
  'channel selection': (c) => `Confirm ${c.channelList}, who owns each one and which goal it serves`,
  'channel planning': (c) => `Confirm ${c.channelList}, who owns each one and which goal it serves`,
  'competitive analysis': (c) => `List what ${c.segRef} use today instead of ${c.N}, including doing nothing, and where each option is stronger or weaker; use only what you can source`,
  'competitor mapping': (c) => `List what ${c.segRef} use today instead of ${c.N}, including doing nothing, and where each option is stronger or weaker; use only what you can source`,
  'market sizing': (c) => `Size ${c.segRef} from sources you can name, and do not publish a figure without one`,
  'localization needs': (c) => `List what must change for ${c.segRef}: language, terms, formats, rules and the systems they run`,
  'partner identification': (c) => `List the partners who already sit close to ${c.segRef} and what each would do for ${c.N}`,
  'messaging localization': (c) => `Rewrite the messages for ${c.segRef} in their own terms, and have someone from the market read them`,
  'pricing strategy': (c) => `Decide the price and terms for ${c.segRef}; this plan sets none, because none were given`,
  'legal/compliance': () => 'List the rules that apply to selling and delivering in the new market, with the person who confirms each one',
  'payment methods': () => 'Confirm how customers in the new market will pay and be invoiced, and who sets that up',
  // assets
  'landing page update': (c) => `Update the page so a visitor from ${c.segs[0]} sees what ${c.N} does and one clear next step`,
  'landing page design': (c) => `Design the page so a visitor from ${c.segs[0]} sees what ${c.N} does and one clear next step`,
  'service page and solution brief for the buying committee': (c) => `A page and a short brief that say what ${c.N} does, who signs, who uses it and what a first step costs the buyer in time${c.buyer ? `; written for the ${c.buyer}` : ''}`,
  'email sequences': (c) => `A short email sequence with one version for ${c.segEach}, each ending in one clear next step`,
  'account-based emails to named contacts': (c) => `Emails to named contacts at ${c.segRef}, each opening with what that account measures`,
  'blog post': (c) => `One article on the problem ${c.N} addresses, in the words the buyers in ${c.segRef} use`,
  'blog content': (c) => `Articles on the problems ${c.N} addresses, in the words the buyers in ${c.segRef} use`,
  'point-of-view article for the buyer\'s leaders': (c) => `One article for the leaders of ${c.segRef} on the problem ${c.N} addresses, argued with evidence you can source`,
  'help docs': (c) => `A guide for the first use of ${c.N}, with the steps in the order a new user takes them`,
  'customer guide and runbook': (c) => `A guide and a runbook for the customer's team: what ${c.N} does, who to call and how problems are escalated`,
  'demo videos': (c) => `Short demos of ${c.caps.slice(0, 2).join(' and ') || c.N}, one for ${c.segEach}`,
  'walkthrough for the buying committee': (c) => `A walkthrough for the people who sign and the people who use ${c.N}, built on the buyer's own process`,
  'sales enablement': (c) => `A short pack for sales: the message for ${c.segEach}, the usual objections with answers, and the proof to show`,
  'press kit': (c) => `Facts about ${c.N}, a short description and contact details; claims only where you can show the source`,
  'briefing pack for analysts and advisers': (c) => `A short briefing on ${c.N} for the advisers and analysts who influence ${c.segRef}`,
  // pre-launch and launch
  'waitlist campaign': (c) => `Invite ${c.segRef} to register interest before launch`,
  'early-access list of named accounts': (c) => `A list of named accounts in ${c.segRef} who are asked for early access`,
  'influencer outreach': (c) => `Ask people ${c.segRef} already follow to look at ${c.N} before launch`,
  'customer and peer advocate outreach': (c) => `Ask customers and respected peers in ${c.segRef} to look at ${c.N} before launch`,
  'internal training': (c) => `Train sales, support and customer success on ${c.N}: who it is for, the messages, the objections and what not to promise`,
  'pr coordination': () => 'Agree the announcement, the spokesperson and the approvals with the people who must sign off',
  'beta feedback integration': () => 'Fold what beta users said into the product and the messages before launch day',
  'press release': (c) => `Announce ${c.N} in plain facts, with a quote only from someone who has agreed to it`,
  'email blast': (c) => `Tell your list what ${c.N} does and what to do first`,
  'announcement email': (c) => `Tell existing users and named accounts in ${c.segRef} what ${c.N} adds and what to do first`,
  'announcement to existing customers through their account managers': (c) => `Account managers tell existing customers what ${c.N} adds and offer a first conversation`,
  'in-app notification': (c) => `A short in-product message that points existing users to ${c.N}`,
  'account-team briefing for existing customers': (c) => `Brief the account teams so they can explain ${c.N} to existing customers and take questions`,
  'social campaign': (c) => `Posts on ${c.channelList}: one for ${c.segEach}, and one from a customer if you have one`,
  'social posts': (c) => `Posts on ${c.channelList}: one for ${c.segEach}, and one from a customer if you have one`,
  'linkedin posts from your experts and customers': (c) => `Posts from your own experts and from customers about the problem ${c.N} addresses, one aimed at ${c.segEach}`,
  'webinar/event': (c) => `A live session for ${c.segRef} with a demonstration and time for questions`,
  'customer webinar': (c) => `A live session for ${c.segRef} with a demonstration and time for questions`,
  'customer roundtable or executive briefing': (c) => `A small session for leaders from ${c.segRef}, with one customer or peer speaking`,
  'customer roundtable with a similar buyer': (c) => `A small session where a customer similar to ${c.segRef} speaks about their experience`,
  'product hunt (if applicable)': () => 'List the product on a launch site only if your buyers look there',
  'analyst and trade-press briefings': (c) => `Brief the analysts and trade press that ${c.segRef} read`,
  'launch event': (c) => `An event for ${c.segRef} in the new market, with a demonstration and local customers or partners`,
  'local partnerships': (c) => `Agree a first step with the partners who sit close to ${c.segRef}`,
  'pr outreach': (c) => `Brief the media that ${c.segRef} read in the new market`,
  'pilot customers': (c) => `Sign the first customers in ${c.segRef} on agreed pilot terms and success measures`,
  'local hiring': () => 'Decide which roles must sit in the new market from the start and which can be covered remotely',
  'paid campaigns': (c) => `Paid campaigns aimed at ${c.segRef} on ${c.channelList}, with a limit agreed first`,
  'targeted outreach to named accounts': (c) => `Outreach to named accounts in ${c.segRef}, through the people they already trust`,
  'community seeding': (c) => `Share ${c.N} where ${c.segRef} already gather, and answer questions rather than promote`,
  'introductions through partners and advisers': (c) => `Ask partners and advisers close to ${c.segRef} for introductions to named accounts`,
  // beta and pilot
  'beta criteria': (c) => `Who qualifies for the beta from ${c.segRef}, and what counts as a good beta account`,
  'pilot criteria agreed with the pilot accounts': (c) => `Which accounts in ${c.segRef} qualify for the pilot, what is in scope and what counts as success`,
  'feedback system': () => 'One place where feedback is collected, one owner and a weekly review',
  'review meeting schedule with the pilot accounts': () => 'Fixed review meetings with each pilot account, with a named owner on both sides',
  'communication plan': (c) => `What testers hear, when and from whom, from invitation to the end of the beta of ${c.N}`,
  'success metrics': (c) => `The measures that decide whether the beta worked${c.goals.length ? `, taken from the goals above` : ''}`,
  'beta invitations': (c) => `Invite testers from ${c.segRef} with a short note on what ${c.N} does and what you need from them`,
  'invitations to selected accounts for a pilot': (c) => `Invite selected accounts in ${c.segRef} to a pilot, with scope, duration and the success measures stated`,
  'onboarding flow': (c) => `The steps a tester follows to start using ${c.N}, and who helps at each one`,
  'onboarding plan for pilot accounts': (c) => `A plan for each pilot account: who is involved, what is set up first and when the first result is reviewed`,
  'expectation setting': () => 'Tell testers what is unfinished, what you will do with their feedback and what you cannot promise',
  'nda if needed': () => 'Confidentiality terms, if the beta shows anything not yet public',
  'confidentiality terms for the pilot accounts': () => 'Confidentiality terms for any pilot account that will see something not yet public',
  'monitor usage': (c) => `Watch how testers use ${c.N} against ${c.adoption}`,
  'review service levels and usage at pilot accounts': (c) => `Review service levels and use at each pilot account against ${c.adoption}`,
  'collect feedback': () => 'Talk to each tester at least once; record what they did, what stopped them and what they would change',
  'bug tracking': () => 'One list of faults with an owner and a severity, reviewed every week',
  'issue log shared with pilot accounts': () => 'One list of faults shared with the pilot accounts, with an owner and a date for each',
  'regular check-ins': () => 'A fixed check-in with each tester or pilot account',
  'synthesize feedback': (c) => `Sort what testers said into what changes ${c.N}, what changes the messages and what waits`,
  'thank testers': () => 'Thank the testers and tell each one what changed because of their feedback',
  'thank-you and next steps for pilot accounts': () => 'Thank the pilot accounts and agree the next step with each one',
  'ga decision': (c) => `Decide whether ${c.N} goes to everyone, against the success measures agreed at the start`,
  'decision to roll out beyond the pilot': (c) => `Decide whether ${c.N} rolls out beyond the pilot, against the measures agreed at the start`,
  'case studies': () => 'Ask the best-fit testers for a result you can show, with its source and date, before anything is published',
  'reference calls and case study from the pilot accounts': () => 'Ask the pilot accounts that agree for a reference call and a short case study with the result, its source and date',
  // updates
  'release notes': (c) => `What changed in ${c.N}, in plain words, with what customers must do, if anything`,
  'service change notes for customers': (c) => `What changes in the service of ${c.N}, in plain words, with what the customer must do, if anything`,
  'email draft': (c) => `A short note to customers of ${c.N} about the update`,
  'support prep': () => 'Brief support on what changed, the likely questions and who answers the hard ones',
  'support and escalation contacts briefed': () => 'Brief the support and escalation contacts on what changed and the likely questions',
  'customer email': (c) => `Tell customers of ${c.N} what changed and what it means for them`,
  'note to existing customers from their account managers': (c) => `Account managers tell customers of ${c.N} what changed and what it means for them`,
  'in-app message': (c) => `A short message inside ${c.N} that points users to the update`,
  'changelog update': () => 'Add the change to the public record of changes',
  'service change notice to customers': () => 'A written notice of the change to each customer, with the date it takes effect',
  'support brief': () => 'A one-page brief for support with the questions to expect',
  'account-team and support briefing': () => 'A one-page brief for account teams and support with the questions to expect',
  // follow-up
  'monitor metrics': (c) => `Watch ${c.adoption} and the goals above each week`,
  'gather feedback': () => 'Collect what customers and sales say, in one place, with the name of who said it',
  'address issues': () => 'Fix what blocks adoption first, and tell the people who reported it',
  'amplify wins': () => 'Share results customers have agreed to share, with the source and the date',
  'iterate messaging': (c) => `Change the messages for ${c.segRef} where the replies show they miss`,
  'adoption tracking': (c) => `Track ${c.adoption} every week for the first two weeks`,
  'feature tips': (c) => `Short how-to messages that show customers the parts of ${c.N} they have not tried`,
  'service review at the first live customers': (c) => `A service review at the first live customers, covering ${c.adoption}`,
  'success stories': () => 'Ask the first customers for a result you can show, with its source and date, before it is used anywhere',
  'reference call or case study from a pilot customer': () => 'Ask a pilot customer for a reference call or a case study with the result, its source and date',
  'feedback loop': () => 'A weekly look at what customers say, with one owner and a short list of changes',
  'performance optimization': (c) => `Compare what each channel produced against the goals above and move effort to what works for ${c.segRef}`,
  'expand channels': (c) => `Add channels beyond ${c.channelList} only where the first results justify them`,
  'local team growth': () => 'Add people in the market in the order the first results call for',
  'customer success': (c) => `Make sure the first customers of ${c.N} in the market reach their first result`,
};
const GENERIC_DETAIL = (focus: string): string => `Part of the "${focus.toLowerCase()}" work of this phase`;

const MODEL_WORDS: Record<BusinessModel, string> = {
  saas: 'a software subscription', services: 'a services contract', connectivity: 'a connectivity contract', transactions: 'a per-transaction offer', marketplace: 'a marketplace',
  hardware_software: 'devices with software', investment: 'an investment mandate',
};
const LAUNCH_WORD: Record<string, string> = { major_release: 'major release', feature_launch: 'feature launch', beta_launch: 'beta launch', product_update: 'product update', market_expansion: 'market expansion' };

/** The sector read for launch lines: pains are used only when they were written for this company's kind (the neutral lines of a vertical do not fit every kind of product). */
function painsFor(ctx: Context): string[] {
  if (!ctx.v) return [];
  const pb = playbookFor(ctx.v);
  if (ctx.v.subtype && !SUBTYPE_PLAYBOOKS[ctx.v.subtype]?.pains && !/billing/i.test(ctx.v.name)) return [];
  return pb.pains;
}

// ---- matching the parts of a product to segments by meaning ----
const STOPW = new Set(['with', 'from', 'that', 'this', 'their', 'your', 'have', 'into', 'over', 'such', 'than', 'then', 'them', 'they', 'what', 'when', 'where', 'which', 'while', 'about', 'across', 'after', 'also', 'before', 'between', 'each', 'every', 'more', 'most', 'other', 'some', 'these', 'those', 'through', 'under', 'using', 'usually', 'involves', 'teams', 'team', 'work', 'works', 'needs', 'need', 'make', 'makes', 'many', 'much']);
const wordsOf = (t: string): string[] => (t.toLowerCase().match(/[a-z][a-z0-9+-]{3,}/g) ?? []).filter((w) => !STOPW.has(w));
const stemsOf = (t: string): Set<string> => new Set(wordsOf(t).map((w) => w.slice(0, 5)));
// What each kind of segment looks for in a product, as words that may appear in a part of the product (cues, no facts about any company).
const SEGMENT_CUES: Array<[RegExp, RegExp]> = [
  [/bank|financ|insur|lend|mortgage|fintech|payments?|wealth|asset|invest|fund|pension|credit/i, /secur|complian|audit|\bsso\b|sign.?on|saml|scim|access|permission|polic|encrypt|governance|residency|certif|soc ?2|\biso\b|risk|fraud|aml|kyc|identity|verif|underwrit|credit|ledger|reconcil|payment|\bach\b|balance|income|report|regulat|self.hosted|on.prem|ownership|bank/i],
  [/government|public sector|defen[cs]e|municipal|state/i, /complian|audit|residency|self.hosted|on.prem|air.?gap|secur|access|\bsso\b|certif|polic|permission|encrypt/i],
  [/manufactur|industr|plant|automotive|\bauto\b|energy|utilit|engineering|construction|infrastructure|civil/i, /erp|integrat|offline|edge|uptime|mobile|device|\biot\b|sensor|asset|maintenance|cost|schedule|job|field|site|project|change order|rfi|document|safety|quality|supply|equipment|labor/i],
  [/retail|e-?commerce|d2c|store|consumer|fmcg|brand|merchant|seller|restaurant|hotel|hospitality|travel|shop/i, /checkout|payment|inventory|catalog|stock|order|\bpos\b|storefront|return|shipping|carrier|label|loyalty|\bcrm\b|omnichannel|channel|marketplace|price|promotion|rate|booking|reservation|guest|mobile app|scale|peak|tracking|fulfil/i],
  [/gaming|game|media|entertain|stream|publish/i, /\bgpu\b|\barm\b|performance|latency|real.?time|scale|concurren|stream|build|runner|cach|\bcdn\b|subscription|billing|usage|royalt|content|rights|machine/i],
  [/saas|software|technology|\btech\b|startup|developer|\bai\b|platform|digital|\bit\b|engineering teams?/i, /\bapi\b|\bsdk\b|integrat|webhook|developer|automation|cloud|devops|\bci\b|pipeline|workflow|usage|billing|metered|self.serve|analytics|open|cach|dashboard|runner/i],
  [/logistic|freight|transport|3pl|courier|shipping|supply chain|distribution|warehouse|fleet/i, /track|route|shipment|carrier|\beta\b|dispatch|warehouse|inventory|label|delivery|fleet|proof|order|visibility|freight/i],
  [/telecom|operator|network|\bisp\b|connectivity/i, /network|\bsim\b|\bsms\b|voice|message|\bapi\b|route|operator|coverage|sd-?wan|bandwidth|latency|connect/i],
  [/educat|school|universit|learning|college/i, /student|learn|course|content|accessib|privacy|child|complian|\bsso\b|\blms\b|identity|verif/i],
  [/property|real estate|lease|landlord|tenant|rental|residential|commercial|housing/i, /lease|tenant|rent|unit|property|accounting|invoice|maintenance|work order|payment|ledger|portal|screening|identity|verif|document|inspection|income|balance|cost|project/i],
];
/** How well one part of a product (or one sector measure, pain or question) fits a segment: cue words, words shared with the segment name and words shared with its buying steps. */
function fitScore(segText: string, review: string, part: string): number {
  let score = 0;
  for (const [segRe, cueRe] of SEGMENT_CUES) {
    if (!segRe.test(segText)) continue;
    const g = new RegExp(cueRe.source, 'gi'); const hits = new Set<string>(); let m: RegExpExecArray | null;
    while ((m = g.exec(part))) hits.add(m[0].toLowerCase());
    score += 3 * hits.size;
  }
  const partStems = stemsOf(part);
  for (const w of stemsOf(segText)) if (partStems.has(w)) score += 2;
  for (const w of stemsOf(review)) if (partStems.has(w)) score += 1;
  return score;
}

// ---- what a goal needs, from the user's figure only ----
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50 };
const COUNT_UNIT = /(deals?|meetings?|pilots?|pilot sites?|sites?|customers?|clients?|demos?|workshops?|surveys?|accounts?|opportunities|sign-?ups?|calls?|trials?|partners?|references?)\b/i;
function goalNeeds(goals: string[], segs: string[], ctxBuyer: string | null): { lines: string[]; deals: boolean } {
  const lines: string[] = []; let deals = false;
  const k = segs.length;
  for (const g of goals) {
    const m = g.match(new RegExp(`(?:^|[^\\w$.,])(\\d[\\d,]*|${Object.keys(NUMBER_WORDS).join('|')})\\s+((?:[a-z-]+\\s+){0,3}?)${COUNT_UNIT.source}`, 'i'));
    if (!m) continue;
    const typed = m[1]; const n = /^\d/.test(typed) ? parseInt(typed.replace(/,/g, ''), 10) : NUMBER_WORDS[typed.toLowerCase()];
    if (!n || n < 2) continue;
    const phrase = `${typed} ${m[2]}${m[3]}`.replace(/\s+/g, ' ').trim();
    const share = Math.ceil(n / Math.max(k, 1));
    const where = k > 1 ? `about ${share} in each of ${k} segments if you share them evenly (${n} divided by ${k}, rounded up)` : `all in ${segs[0]}`;
    if (/^deals?$/i.test(m[3])) {
      deals = true;
      lines.push(`${upper1(phrase)} need at least ${typed} buying conversations in all, ${where}. Your win rate decides how many more are needed: it was not given.`);
    } else lines.push(`${upper1(phrase)} is ${where}.`);
  }
  void ctxBuyer;
  return { lines, deals };
}

function parseLaunchDate(input?: string): { date: Date | null; exact: boolean; label: string } {
  const text = (input ?? '').trim();
  if (!text || text.toLowerCase() === 'tbd') return { date: null, exact: false, label: '' };
  const quarter = text.match(/Q([1-4])\s*(\d{4})/i);
  if (quarter) return { date: new Date(parseInt(quarter[2]), [0, 3, 6, 9][parseInt(quarter[1]) - 1] + 1, 15), exact: false, label: `Q${quarter[1]} ${quarter[2]}` };
  const month = text.match(/([A-Za-z]+)\s*(\d{4})/);
  if (month) {
    const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const i = names.findIndex((m) => month[1].toLowerCase().startsWith(m));
    if (i !== -1) return { date: new Date(parseInt(month[2]), i, 15), exact: false, label: `${month[1]} ${month[2]}` };
  }
  const d = new Date(text);
  if (!isNaN(d.getTime())) return { date: d, exact: true, label: formatDate(d) };
  return { date: null, exact: false, label: text };
}

const weeksLabel = (days: number): string => {
  const w = Math.round(Math.abs(days) / 7);
  if (days < 0) return w === 0 ? 'launch week' : `${w} ${plural(w, 'week', 'weeks')} before launch`;
  return w === 0 ? 'launch week' : `${w} ${plural(w, 'week', 'weeks')} after launch`;
};

export function writeLaunchPlan(args: {
  product_feature: string; launch_type: string; target_segments: string; goals: string; launch_date?: string; available_channels?: string;
  team_size?: string; budget_level?: string; business_model?: string; industry?: string;
}): string {
  const launchType = PHASES[args.launch_type] ? args.launch_type : 'feature_launch';
  const teamSize = args.team_size || 'small_2_5';
  const budgetLevel = args.budget_level || 'moderate';
  const when = parseLaunchDate(args.launch_date);
  // the segments are comma separated, as the input says: a semicolon stays inside a segment
  const segs = splitTopLevel(args.target_segments, false).map(upper1);
  const segList = listOf(segs);
  const goals = splitPhrases(args.goals).length ? splitPhrases(args.goals) : [args.goals.trim()];
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [args.product_feature], context: [args.goals], buyer: [args.target_segments] });
  const pb = ctx.v ? playbookFor(ctx.v) : null;
  const buyer = (args.goals.match(/\bwith\s+(?:the\s+)?([A-Za-z][A-Za-z .&/-]{1,50}?)(?:\s*\([^)]*\))?\s+as\s+(?:the\s+)?(?:buyer|sponsor|champion|decision[- ]maker)\b/i) || [])[1]?.trim() ?? null;
  const committeeBuyer = (!!buyer && /\b(c[a-z]o|chief|head|vp|director|leader|manager)\b/i.test(buyer)) || segmentKinds(args.target_segments).some((k) => ['investment institutions', 'banks and financial services', 'government and public sector'].includes(k.kind));
  const model = wordingModel(ctx, !!args.business_model);
  const salesLed = committeeBuyer || (model !== null && model !== 'saas' && model !== 'marketplace') || (ctx.v !== null && ctx.v.id !== 'saas' && ctx.v.id !== 'software');
  const subscription = model === 'saas' || model === null;
  const contractSale = salesLed && !subscription && model !== 'transactions';
  const mode: LaunchCtx['mode'] = contractSale ? 'contract' : salesLed ? 'committee' : 'self';
  const lang = MODEL_LANGUAGE[model ?? 'saas'];
  const prod = productParts(args.product_feature);
  const caps = prod.wrapped ? [] : capabilityList(prod.desc);
  const descShown = !prod.wrapped && !caps.length && prod.desc ? prod.desc : '';

  // channels: the ones named, else the sector's own
  const channelsGiven = args.available_channels ? splitTopLevel(args.available_channels).map((c) => (c.toLowerCase() === 'linkedin' ? 'LinkedIn' : c)) : [];
  const segChannels = segmentKinds(args.target_segments).flatMap((k) => k.channels ?? []).filter((c, i, a) => a.indexOf(c) === i).slice(0, 4);
  const shownChannels = channelsGiven.length ? channelsGiven : pb ? pb.channels : segChannels.length ? segChannels : salesLed ? ['account-based outreach to named buyers', 'LinkedIn posts from your experts and customers', 'executive roundtable or briefing'] : ['email', 'LinkedIn', 'blog'];
  const filterWords = (channelsGiven.length ? channelsGiven : ['email', 'linkedin', 'blog']).map((c) => c.toLowerCase());
  const adoption = pb ? pb.adoption.measure : 'product or service usage';
  const c: LaunchCtx = { N: prod.name ?? 'your solution', NS: prod.name ?? 'Your solution', segs, segList, segRef: segs.length <= 3 ? segList : 'the target segments', segEach: segs.length <= 3 ? `each of ${segList}` : 'each target segment', buyer, channels: shownChannels, channelList: channelsGiven.length ? andList(channelsGiven) : 'the channels listed under Channels and budget', mode, caps, adoption, goals, ctx, launchWord: LAUNCH_WORD[launchType] };

  const adaptTask = (task: string): string => {
    const k = task.toLowerCase();
    if (salesLed && SALES_SWAP[k]) return SALES_SWAP[k];
    if (contractSale && CONTRACT_SWAP[k]) return CONTRACT_SWAP[k];
    if (salesLed && k === 'adoption tracking') return 'Adoption tracking';
    if (!subscription && /^in-app (notification|message)$/.test(k)) return 'Account-team briefing for existing customers';
    return task;
  };
  const keepTask = (task: string): boolean => {
    const t = task.toLowerCase();
    if (filterWords.some((ch) => t.includes(ch))) return true;
    if (['position', 'messaging', 'strategy', 'feedback', 'metric', 'monitor', 'plan', 'brief'].some((w) => t.includes(w))) return true;
    if ((t.includes('webinar') || t.includes('roundtable')) && !filterWords.some((ch) => /webinar|event|roundtable/.test(ch))) return false;
    if (/\b(pr|press)\b/.test(t) && !filterWords.some((ch) => ch.includes('pr'))) return false;
    if (t.includes('paid') && !filterWords.some((ch) => ch.includes('paid'))) return false;
    return true;
  };
  const owners: Record<string, Record<string, string>> = {
    solo: { strategy: 'You', content: 'You', execution: 'You', sales: 'You' },
    small_2_5: { strategy: 'Lead', content: 'Content owner', execution: 'Team', sales: 'Sales' },
    medium_6_15: { strategy: 'Director', content: 'Content team', execution: 'Campaign manager', sales: 'Sales enablement' },
    large_15_plus: { strategy: 'VP or director', content: 'Content lead', execution: 'Campaign team', sales: 'Sales enablement team' },
  };
  const ownerOf = (kind: string): string => owners[teamSize]?.[kind] ?? 'Lead';
  const ownerKind = (task: string): string => { const t = task.toLowerCase(); return /strateg|position|messag/.test(t) ? 'strategy' : /content|blog|article|page|guide/.test(t) ? 'content' : /sales|enablement|brief|train/.test(t) ? 'sales' : 'execution'; };

  // sector tasks (from the sector data), each in the phase where it belongs
  const normRole = (r: string): string => r.toLowerCase().replace(/\b(?:of|the|and)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const sameRole = (r: string): boolean => !!buyer && (normRole(r) === normRole(buyer) || normRole(r).includes(normRole(buyer)) || normRole(buyer).includes(normRole(r)) || initials(r).toLowerCase() === buyer.toLowerCase().replace(/\./g, ''));
  const otherRoles = ctx.v ? ctx.v.buyerRoles.filter((r) => !sameRole(r)).slice(0, buyer ? 3 : 4) : [];
  const buyerRoles = ctx.v ? (buyer ? andList([buyer, ...otherRoles]) : andList(otherRoles)) : '';
  const phases = PHASES[launchType];
  const sectorTasks: Array<{ task: string; detail: string; phase: number; owner: string }> = ctx.v && pb ? [
    { task: 'Brief the buying committee', detail: `Brief the buyers named under Who the launch speaks to on ${c.N}: what it does, what it replaces and what a first step asks of them`, phase: 0, owner: 'sales' },
    { task: pb.launchTasks[0], detail: '', phase: 0, owner: 'strategy' },
    { task: pb.launchTasks[1], detail: '', phase: 1, owner: 'execution' },
    { task: 'Prepare the proof point', detail: 'Collect the proof described under Who the launch speaks to from one customer in each segment, with its source and date', phase: 1, owner: 'content' },
    { task: pb.launchTasks[2], detail: '', phase: 1, owner: 'execution' },
    { task: 'Prepare sales answers to the usual objections', detail: `Prepare answers to ${andList(ctx.v.objections.slice(0, 3).map((o) => q(stripEnd(o.objection).replace(/[?]$/, ''))))}, using the responses under Risks and how to meet them`, phase: 2, owner: 'sales' },
  ] : [];

  const dated = when.date !== null && when.exact;
  const reference = when.date ?? new Date();
  const days = when.date ? calculateDaysUntil(when.date.toISOString()) : null;

  // ---- header and brief ----
  const out: string[] = [];
  out.push(`# Launch plan${prod.name ? `: ${prod.name}` : ''}`);
  const facts = [`${upper1(c.launchWord)}`, when.label ? (dated ? when.label : `${when.label} (planning mode)`) : 'no fixed launch date', `team ${readableChoice(teamSize)}${args.team_size ? '' : ' (assumed)'}`, `budget ${readableChoice(budgetLevel)}${args.budget_level ? '' : ' (assumed)'}`];
  out.push(`*${facts.join(' | ')}*`);
  out.push('');
  out.push(readLine(ctx, model));
  out.push('');
  out.push('## The plan in brief');
  const briefParts: string[] = [];
  briefParts.push(`${c.NS} is launched as ${aAn(c.launchWord)} ${c.launchWord} to ${segList}${channelsGiven.length ? `, reached through ${c.channelList}` : ''}.`);
  if (days !== null) {
    if (days <= 0) briefParts.push(`The date you gave, ${when.label}, has already passed, so the dates below are in the past.`);
    else if (dated) briefParts.push(`The launch date is ${when.label}, ${days} ${plural(days, 'day', 'days')} away.`);
    else briefParts.push(`${when.label} is about ${days} days away, counted to an assumed date in the middle of the period ${EXAMPLE_FIGURE}; the schedule below therefore counts in weeks before launch.`);
  } else briefParts.push('No fixed launch date is set, so the schedule below counts in weeks before launch.');
  if (pb && ctx.v) briefParts.push(`In ${ctx.v.name} a group decides (${lcFirst(ctx.v.committee.split(';')[0])}), so the plan ${contractSale ? `relies on ${lang.pilot}, account-based outreach and reference calls rather than broad campaigns` : 'adds a committee briefing, a proof point and answers to the usual objections to the usual launch tasks'}.`);
  if (buyer) briefParts.push(`You named the ${buyer} as the buyer, so the briefing and the messages are written for that role.`);
  out.push(briefParts.join(' '));
  out.push('');

  // ---- what is launched ----
  out.push('## What is being launched');
  if (caps.length > 1) {
    out.push(`${prod.name ? c.NS : 'Your solution'} is described by these parts:`);
    out.push('');
    out.push(caps.map((x) => `- ${x}`).join('\n'));
  } else if (caps.length === 1) {
    out.push(`You describe ${prod.name ? c.N : 'your solution'} as ${quoted(caps[0])}.`);
  } else if (prod.wrapped) out.push(`You describe ${c.N} in these words: ${quoted(prod.desc)}`);
  else if (descShown) out.push(`You describe ${prod.name ? c.N : 'your solution'} in these words: ${quoted(descShown)}.`);
  else out.push(`${c.NS} is the launch. No description was given, so the messages below are built from the sector and the segments.`);
  out.push('');

  // ---- goals ----
  const kindOf = (g: string): string => /pipeline|revenue|\$|closed|\barr\b|\bmrr\b|bookings?|deal value/i.test(g) ? 'Revenue'
    : /meeting|demo|sign-?up|trial|\bleads?\b|registr|attend|click|\bctr\b|opportunit|\bcalls?\b|inquir|enquir|workshop|survey|assessment/i.test(g) ? 'Engagement'
    : /view|impression|visit|traffic|reach|download|follower|aware/i.test(g) ? 'Awareness'
    : /activat|usage|active user|adopt|conversion|retention|rollout|renew|reference|go-?live|live sites?|pilot/i.test(g) ? 'Adoption' : 'Other';
  const trackedBy: Record<string, string> = {
    Revenue: 'CRM, from signed deals', Engagement: contractSale ? 'CRM, meetings with named contacts' : 'CRM and analytics',
    Awareness: contractSale ? 'CRM, named accounts reached' : 'Analytics', Adoption: pb ? `${pb.adoption.source}, counting ${pb.adoption.measure}` : 'Product or service usage data', Other: 'The source you name for this goal',
  };
  out.push('## Goals and how each is measured');
  out.push('');
  out.push('| Goal | What it counts | Where to read it |');
  out.push('|------|----------------|------------------|');
  for (const g of goals) out.push(`| ${cell(stripEnd(g))} | ${kindOf(g) === 'Other' ? 'Other measure' : kindOf(g)} | ${trackedBy[kindOf(g)]} |`);
  out.push('');
  const needs = goalNeeds(goals, segs, buyer);
  if (needs.lines.length) { out.push(`**What the goals need.** ${needs.lines.join(' ')}`); out.push(''); }

  // ---- segments and messages ----
  out.push('## Who the launch speaks to');
  const roleLine = ctx.v
    ? (buyer ? `Write to the ${buyer} first, then to the other roles in the group: ${andList(otherRoles)}.` : `Write to the buyers in these roles: ${buyerRoles}.`)
    : buyer ? `Write to the ${buyer}.` : '';
  const pains = painsFor(ctx);
  const metrics = ctx.v ? ctx.v.metrics : [];
  const vocab = ctx.v ? ctx.v.vocabulary : [];
  const discovery = ctx.v ? ctx.v.discovery : [];
  const proofLine = ctx.v ? `Proof to collect from one customer in each segment: ${lcFirst(ctx.v.proofShape).replace(/[.]$/, '')}.` : 'Proof to collect from one customer in each segment: a before and after on the goal you set, with its source and date.';
  const nextStep = pb ? `Next step to ask for: ${pb.cta}.` : `The next step to ask for: a working session on the buyer's own data or process.`;
  out.push([roleLine, ctx.v ? `The buying group: ${lcFirst(ctx.v.committee)}` : '', proofLine, nextStep, metrics.length ? `Measures this sector watches, to use in the proof: ${andList(metrics.slice(0, 5))}.` : ''].filter(Boolean).join(' '));
  out.push('');
  const general = discovery.slice(0, 3);
  if (general.length || pains.length) {
    out.push(`${pains.length ? `Problems to test in the first conversations: ${pains.join('; ')}. ` : ''}${general.length ? 'Questions to ask in any segment:' : ''}`.trim());
    if (general.length) { out.push(''); out.push(general.map((x) => `- ${x.replace(/\?*$/, '?')}`).join('\n')); }
    out.push('');
  }
  const segChan = (seg: string) => (channelsGiven.length ? null : segmentNotes(seg)?.channels?.slice(0, 2) ?? null);
  // segments that share the same buying steps are described together, once
  const reviewGroups = new Map<string, string[]>();
  for (const seg of segs) { const n = segmentNotes(seg); if (n) reviewGroups.set(n.review, [...(reviewGroups.get(n.review) ?? []), seg]); }
  const channelGroups = new Map<string, string[]>();
  for (const seg of segs) { const ch = segChan(seg); if (ch && ch.length) channelGroups.set(andList(ch), [...(channelGroups.get(andList(ch)) ?? []), seg]); }
  // each part of the product goes to the segment it fits best (by cue words, shared words and the segment's buying steps); a part leads once
  const usedParts = new Set<number>();
  const usedAsks = new Set<string>();
  const leadFor = (seg: string): { parts: string[]; fits: boolean } => {
    if (caps.length < 2) return { parts: [], fits: false };
    const review = segmentNotes(seg)?.review ?? '';
    const segText = `${seg} ${segmentNotes(seg)?.kind ?? ''}`;
    // a single word is a name, not a part to lead with, unless the parts are all single words
    const eligible = caps.map((cap, i) => ({ cap, i })).filter((x) => x.cap.split(/\s+/).length >= 2);
    const pool = eligible.length >= 2 ? eligible : caps.map((cap, i) => ({ cap, i }));
    const ranked = pool.map((x) => ({ ...x, score: fitScore(segText, review, x.cap) })).sort((x, y) => y.score - x.score || x.i - y.i);
    const fresh = ranked.filter((r) => !usedParts.has(r.i));
    const best = (fresh.length ? fresh : ranked).filter((r) => r.score > 0).slice(0, 2);
    let chosen = best.length ? best : pool.slice(0, 1).map((x) => ({ ...x, score: 0 }));
    // two parts are named only when together they stay short
    if (chosen.length > 1 && chosen[0].cap.length + chosen[1].cap.length > 170) chosen = chosen.slice(0, 1);
    if (best.length) chosen.forEach((r) => usedParts.add(r.i));
    return { parts: chosen.sort((x, y) => x.i - y.i).map((r) => r.cap), fits: best.length > 0 };
  };
  for (const seg of segs) {
    const notes = segmentNotes(seg);
    const { parts: lead, fits } = leadFor(seg);
    const segText = `${seg} ${notes?.kind ?? ''} ${lead.join(' ')}`;
    const lines: string[] = [];
    lines.push(lead.length
      ? (fits ? `For ${seg}, lead with ${andList(lead.map((x) => quoted(x)))}.` : `Nothing in your description points to ${seg} more than to another segment, so open with ${andList(lead.map((x) => quoted(x)))}, the first part you list, and move to the part their answers point to.`)
      : `For ${seg}, say in the words that segment uses what ${c.N} changes for its work.`);
    if (notes && reviewGroups.get(notes.review)![0] === seg) { const grp = reviewGroups.get(notes.review)!; const rv = grp.some((g) => /e-?commerce|online|d2c|marketplace/i.test(g)) ? notes.review.replace('many stores or outlets', 'many storefronts and sales channels') : notes.review; lines.push(`For ${andList(grp)} a purchase usually involves ${rv}; have those answers ready before they are asked.`); }
    // a question or a measure of the sector goes to a segment only when it fits it
    const q2 = discovery.slice(3).filter((d) => !usedAsks.has(d)).map((d) => ({ d, score: fitScore(segText, notes?.review ?? '', d) })).sort((x, y) => y.score - x.score)[0];
    if (q2 && q2.score >= 3) { usedAsks.add(q2.d); lines.push(`Ask: ${q2.d.replace(/\?*$/, '?')}`); }
    const m2 = metrics.filter((mm) => !usedAsks.has(mm)).map((mm) => ({ mm, score: fitScore(segText, notes?.review ?? '', mm) })).sort((x, y) => y.score - x.score)[0];
    if (m2 && m2.score >= 3) { usedAsks.add(m2.mm); lines.push(`Measure the result by ${m2.mm}.`); }
    const ch = segChan(seg);
    if (ch && ch.length && channelGroups.get(andList(ch))![0] === seg) lines.push(`Reach ${listOf(channelGroups.get(andList(ch))!)} through ${andList(ch)}.`);
    out.push(`### ${seg}`);
    out.push('');
    out.push(lines.join(' '));
    out.push('');
  }
  if (vocab.length) { out.push(`Words this buyer uses, to use in the copy: ${andList(vocab.slice(0, 6))}.`); out.push(''); }

  // ---- channels and budget ----
  out.push('## Channels and budget');
  const tactics: Record<string, string[]> = salesLed ? {
    bootstrap: ['posts from your experts and customers', 'content for the buying committee', 'partner co-marketing', 'email to named accounts'],
    moderate: ['account-based outreach to named accounts', 'a small executive roundtable', 'posts from customers and your own experts', 'targeted ads to named accounts'],
    well_funded: ['an account-based programme across the target list', 'executive events', 'a customer-advocate programme', 'analyst and adviser relations'],
  } : {
    bootstrap: ['organic social posts', 'content marketing', 'community building', 'partner co-marketing', 'email marketing'],
    moderate: ['targeted paid ads', 'a small event or webinar', 'retargeting', 'content syndication'],
    well_funded: ['multi-channel paid campaigns', 'large events', 'a PR agency', 'account-based programmes'],
  };
  const tacticList = (tactics[budgetLevel] || tactics.moderate);
  out.push(`${channelsGiven.length ? `You can use ${andList(channelsGiven)}.` : `The channels are the usual ones for ${ctx.v ? `${ctx.v.name} buyers` : 'this kind of buyer'}: ${andList(shownChannels)}.`} At a ${readableChoice(budgetLevel)} budget the plan spends on ${andList(tacticList)}.`);
  out.push('');

  // ---- timeline ----
  out.push('## Timeline');
  out.push('');
  out.push(dated ? '*Task dates are suggestions spread across each phase: move them to fit your launch day.*' : '*Tasks are placed in weeks before and after launch; with a launch date they would carry calendar dates.*');
  out.push('');
  for (const [pi, phase] of phases.entries()) {
    const start = addDays(reference, phase.startOffset); const end = addDays(reference, phase.endOffset);
    const current = dated && new Date() >= start && new Date() <= end;
    const base = phase.tasks.map(adaptTask).filter(keepTask).map((title) => ({ title, detail: (DETAIL[title.toLowerCase()] ?? (() => GENERIC_DETAIL(phase.focus)))(c), owner: ownerKind(title) }));
    const extra = sectorTasks.filter((t) => Math.min(t.phase, phases.length - 1) === pi).map((t) => ({ title: t.task, detail: t.detail, owner: t.owner }));
    const rows = [...base, ...extra];
    out.push(`### ${phase.name}${current ? ' (current phase)' : ''}`);
    out.push(`**${dated ? `${formatDate(start)} to ${formatDate(end)}` : phase.weekRange}** | Focus: ${phase.focus.toLowerCase()}`);
    out.push('');
    rows.forEach((row, i) => {
      const offset = phase.startOffset + Math.floor((i / rows.length) * (phase.endOffset - phase.startOffset));
      const due = dated ? formatDate(addDays(reference, offset)) : weeksLabel(offset);
      out.push(`- **${stripEnd(row.title)}** (${ownerOf(row.owner)}, ${dated ? 'due ' : ''}${due})${row.detail ? `: ${stripEnd(row.detail)}.` : '.'}`);
    });
    out.push('');
  }

  // ---- risks ----
  out.push('## Risks and how to meet them');
  out.push('');
  out.push('| Risk | Response | Owner |');
  out.push('|------|----------|-------|');
  out.push(`| The launch date slips | Keep a buffer week before ${dated ? when.label : 'the launch'} | ${ownerOf('strategy')} |`);
  if (ctx.v) for (const o of ctx.v.objections.slice(0, 4)) out.push(`| ${stripEnd(o.objection)} | ${stripEnd(o.response)} | ${ownerOf('sales')} |`);
  out.push(`| ${contractSale ? 'A cut-over or pilot problem' : 'A technical problem on launch day'} | ${contractSale ? 'Agree a fallback and a rollback rule for each stage before it starts' : 'Have a rollback plan written and the person who can run it named'} | ${contractSale ? 'Delivery lead' : 'Engineering'} |`);
  out.push(`| A competitor reacts | Update the battle cards before launch day and brief sales | ${ownerOf('sales')} |`);
  if (subscription) out.push(`| Awareness is lower than planned | Keep part of the ${readableChoice(budgetLevel)} budget back for a second push | ${ownerOf('execution')} |`);
  out.push('');

  // ---- checklist ----
  out.push('## Pre-launch checklist');
  out.push('');
  const checks = [
    `Positioning for ${segList} agreed${buyer ? ` and read by someone in the ${buyer} role` : ''}`,
    `Assets ready for ${channelsGiven.length ? andList(channelsGiven) : 'each channel listed under Channels and budget'}`,
    contractSale ? 'Sales and account teams trained, with the customer guide, runbook and escalation contacts ready' : 'Sales trained and support documentation ready',
    `Tracking in place for each goal in the goals table`,
    contractSale ? 'Fallback and rollback plan written' : 'Rollback plan written',
    'One owner named for the weeks after launch',
    ...(pb ? pb.checklist : []),
  ];
  out.push(checks.map((x) => `- [ ] ${x}`).join('\n'));

  // ---- what was not given ----
  const missing: Array<[string, string]> = [];
  if (!when.date) missing.push(['a launch date (YYYY-MM-DD)', 'the schedule, which would then show calendar dates instead of weeks before launch']);
  else if (!when.exact) missing.push(['an exact launch date (YYYY-MM-DD)', `the schedule, which now counts in weeks before launch because only ${when.label} was given`]);
  if (!args.industry && !ctx.v) missing.push(['the industry, in the industry input', 'the buyer roles, proof, objections and channels, which now come from your segments only']);
  else if (!args.industry && ctx.v) missing.push(['the industry, in the industry input, to confirm the sector read from your text', 'the buyer roles, proof, objections and channels if the read is wrong']);
  if (!args.business_model) missing.push(['the business model, in the business_model input', `the launch tasks and words, which now follow ${model ? MODEL_WORDS[model] : 'a software subscription'} as read from your text`]);
  if (!buyer) missing.push(['who the buyer is, for example "with the CIO as the buyer" in the goals', `the committee briefing and the tone of the messages${ctx.v ? `, which now address ${andList(ctx.v.buyerRoles.slice(0, 3))}` : ''}`]);
  if (!channelsGiven.length) missing.push(['the channels you can use, in the available_channels input', 'which tasks stay in the plan and where the messages go']);
  if (!args.team_size) missing.push(['the team size, in the team_size input; the plan assumes small (2 to 5)', 'who owns each task']);
  if (!args.budget_level) missing.push(['the budget level, in the budget_level input; the plan assumes moderate', 'the tactics in Channels and budget']);
  // a product described in some detail is not asked for again; a bare name or a short phrase is
  const kinds = kindsWithLines(ctx, ['pains', 'cta', 'launchTasks', 'channels', 'adoption', 'checklist']);
  if (kinds.length && prod.desc.split(/\s+/).filter(Boolean).length < 8) missing.push([`what ${prod.name ?? 'the solution'} sells, in the product_feature input`, 'the pilot, integration and adoption tasks, which now fit any company in the sector']);
  if (needs.deals) missing.push(['your win rate from buying conversation to signed deal', 'the number of conversations to book, which is now the number of deals as a minimum']);
  const kindsOfGoals = new Set(goals.map(kindOf));
  if (!kindsOfGoals.has('Adoption') && !kindsOfGoals.has('Revenue')) missing.push(['a target for pipeline or adoption in the goals', 'the Follow-up phase, which has no adoption target to track']);
  missing.push(['a result you already hold from a customer in these segments, with its source and date', 'the proof line, which now describes the kind of proof to collect']);
  out.push(sharpenBlock(missing));
  return dropRepeatedLines(out.join('\n')).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------------------------------------------------------------
// retention_playbook
// ---------------------------------------------------------------------------------------------------------------------------------
// The business model chosen is mapped to the model class the tool reasons with. enterprise_contract is read further from the typed text.
const MODEL_OF_CHOICE: Record<string, BusinessModel | undefined> = {
  saas_subscription: 'saas', usage_based: 'saas', freemium: 'saas', marketplace: 'marketplace', transactional: 'transactions',
  services_contract: 'services', connectivity_contract: 'connectivity', investment_mandate: 'investment',
};
// Signals for a contract that is not a software subscription. No weights are invented for them: the answer splits 100% equally.
const CONTRACT_SIGNALS: Record<string, string[]> = {
  services: ['sla_attainment', 'ticket_backlog_trend', 'service_review_attendance', 'executive_engagement', 'renewal_sentiment'],
  connectivity: ['uptime_and_repair_time', 'incident_trend', 'executive_engagement', 'new_sites_or_links_requested', 'renewal_sentiment'],
  investment: ['reporting_engagement', 'mandate_size_trend', 'sponsor_engagement', 'risk_review_attendance', 'renewal_sentiment'],
};
const HEALTH_WEIGHTS: Record<string, Record<string, number>> = {
  saas_subscription: { login_frequency: 25, feature_adoption: 30, support_tickets: 15, billing_health: 10, engagement_trend: 20 },
  usage_based: { usage_volume: 40, usage_trend: 25, feature_breadth: 15, billing_health: 10, support_tickets: 10 },
  marketplace: { transaction_frequency: 35, gmv_trend: 25, seller_buyer_ratio: 15, review_score: 15, support_tickets: 10 },
  transactional: { purchase_frequency: 30, aov_trend: 25, category_breadth: 20, engagement: 15, support: 10 },
  freemium: { feature_engagement: 30, upgrade_signals: 30, viral_actions: 20, time_in_product: 10, support: 10 },
  enterprise_contract: { executive_engagement: 25, feature_adoption: 25, support_nps: 20, expansion_signals: 15, renewal_sentiment: 15 },
};
const CAPACITY: Record<string, { highTouch: number; automated: number; scaledTouch: number }> = {
  no_dedicated_cs: { highTouch: 0, automated: 90, scaledTouch: 10 }, small_1_3: { highTouch: 20, automated: 50, scaledTouch: 30 },
  medium_4_10: { highTouch: 40, automated: 30, scaledTouch: 30 }, large_10_plus: { highTouch: 60, automated: 20, scaledTouch: 20 },
};
const COMMON_REASONS: Record<string, string[]> = {
  saas_subscription: ['Price/value mismatch', 'Missing features', 'Poor support', 'Competitor switch', 'Low usage/adoption', 'Champion left', 'Budget cuts', 'Poor onboarding'],
  usage_based: ['Unpredictable billing', 'Usage dropped', 'Better pricing elsewhere', 'Feature gaps', 'Integration issues'],
  marketplace: ['Low supply/demand', 'Trust issues', 'Fee concerns', 'Better platform', 'Quality issues'],
  transactional: ['Price per transaction compared with another provider', 'Failures, delays or returns on transactions', 'Slow help when something went wrong', 'Volume moved to a second provider', 'Business slowed down or stopped', 'A connection to a selling channel or system broke', 'A channel or option that was needed was missing'],
  freemium: ['Never converted', 'Feature limits frustrating', 'Found free alternative', 'Not enough value to pay'],
  enterprise_contract: ['Executive sponsor left', 'Failed implementation', 'Poor ROI', 'Vendor consolidation', 'Contract terms'],
  services: ['Service level misses', 'Key people left', 'Price or rate pressure', 'Competitor or offshore alternative', 'Scope changed', 'Governance or reporting gaps', 'Transition problems', 'Vendor consolidation'],
  connectivity: ['Outages and slow repairs', 'Price per site', 'Migration or cut-over pain', 'Competitor or operator switch', 'Contract end and re-tender', 'Security overlay gaps'],
  investment: ['Performance against the agreed benchmark', 'Fee pressure', 'Reporting or explainability gaps', 'Mandate or allocation change', 'Key contact left', 'Risk concerns'],
};
const SIGNAL_FOR: Record<string, string> = {
    'Price/value mismatch': 'Mentions "expensive" or "cost" in support tickets, requests for discounts',
    'Missing features': 'Feature request tickets, "can\'t do X" mentions, integration requests',
    'Poor support': 'Low CSAT on tickets, multiple escalations, long resolution times',
    'Competitor switch': 'Competitor mentions in calls, "saw that X can do Y" comments',
    'Low usage/adoption': 'Login frequency dropping, few features used, short sessions',
    'Champion left': 'Primary contact changed, new stakeholder questions basics',
    'Budget cuts': 'Delayed payments, contract negotiation requests, downgrade inquiries',
    'Poor onboarding': 'Churns in the first weeks after sign-up, incomplete setup, never hit the first milestone',
    'Service level misses': 'Service-level reports below target, credits requested, escalations to your management',
    'Key people left': 'Requests to keep named people, complaints about changes in the team, more rework',
    'Price or rate pressure': 'Rate-card comparisons, requests for a cheaper scope, procurement asking for a re-tender',
    'Competitor or offshore alternative': 'Questions about other providers, requests for a rate benchmark',
    'Scope changed': 'Change requests, work outside the statement of work, unclear ownership',
    'Governance or reporting gaps': 'Missed reviews, reports not read, no named service owner on either side',
    'Transition problems': 'Delays against the transition plan, knowledge gaps, parallel run extended',
    'Vendor consolidation': 'Procurement talking about fewer vendors, a rival offering a wider package',
    'Outages and slow repairs': 'Repeated incidents on the same sites, long repair times, service credits paid',
    'Price per site': 'Rate-card comparisons by site, requests to cut low-use sites',
    'Migration or cut-over pain': 'Sites slipping from their wave, rollback requests, branch complaints',
    'Competitor or operator switch': 'Questions about another operator, requests for site-by-site quotes',
    'Contract end and re-tender': 'A tender or RFP announced, procurement contact replaces the network owner',
    'Security overlay gaps': 'Security team raising findings the service does not cover',
    'Performance against the agreed benchmark': 'Performance below the agreed reference for several review periods',
    'Fee pressure': 'Requests to renegotiate fees, comparison with other managers',
    'Reporting or explainability gaps': 'Questions the reports cannot answer, requests for more detail on how decisions are made',
    'Mandate or allocation change': 'Reallocation by the client, a new investment committee, a changed policy',
    'Key contact left': 'Primary contact changed, new stakeholder asks for basics again',
    'Risk concerns': 'Risk or compliance asking for more documentation or limits',
    'Executive sponsor left': 'The sponsor changes role or leaves, the new owner asks for the basics again, meetings with executives stop',
    'Failed implementation': 'Go-live dates slipping, sites or teams never switched over, an open list of issues from the start of the contract',
    'Poor ROI': 'The customer cannot name a result the service delivered, finance asks what the contract is worth',
    'Contract terms': 'Requests to shorten the term, change the notice period or remove a minimum commitment',
    'Unpredictable billing': 'Disputed invoices, questions about how usage is counted, requests for caps',
    'Usage dropped': 'Volume falling month after month with no change on the customer side',
    'Better pricing elsewhere': 'Requests for a price match, quotes from other providers mentioned',
    'Feature gaps': 'Requests for capabilities you do not have, workarounds built outside the product',
    'Integration issues': 'Repeated tickets about data not arriving, manual re-entry, delays in connected systems',
    'Low supply/demand': 'Fewer listings or fewer requests on one side, slower matching',
    'Trust issues': 'Disputes, complaints about quality or fraud, requests to take the transaction outside',
    'Fee concerns': 'Participants asking about the fee or moving repeat deals off the platform',
    'Better platform': 'Participants mention another platform with better reach or lower fees',
    'Quality issues': 'Rising returns, low ratings, repeat complaints about the same participants',
    'Never converted': 'Accounts that sign up and never take the paid step',
    'Feature limits frustrating': 'Many contacts about a limit, upgrades started and not finished',
    'Found free alternative': 'Mentions of a free tool that does most of the job',
    'Not enough value to pay': 'Heavy use of the free plan but no upgrade, no clear paid-only need',
    'Price per transaction compared with another provider': 'Volume per customer falls while quotes from other providers are mentioned, requests for volume pricing',
    'Failures, delays or returns on transactions': 'Repeat contacts about the same failed, late or returned transactions, rising share of exceptions per customer',
    'Slow help when something went wrong': 'Long waits for an answer on a failed transaction, low satisfaction after contacts, escalations',
    'Volume moved to a second provider': 'Volume per customer falls while the customer is still active on other measures',
    'Business slowed down or stopped': 'Volume falls across all of a customer\'s channels at once, with no complaint',
    'A connection to a selling channel or system broke': 'Transactions stop arriving from one channel or system, repeated tickets about a connection',
    'A channel or option that was needed was missing': 'Requests for a channel, method or option you do not offer, workarounds outside the product',
};
const STEP_FOR: Record<string, string> = {
    'Price/value mismatch': 'ROI review call, value demonstration, usage optimization',
    'Missing features': 'Workaround education, roadmap preview, feature request escalation',
    'Poor support': 'Executive escalation, dedicated support channel, satisfaction recovery',
    'Competitor switch': 'Competitive differentiation call, switching cost analysis, special offer',
    'Low usage/adoption': 'Reactivation campaign, training session, success milestone push',
    'Champion left': 'New champion discovery, executive sponsorship renewal, value resell',
    'Budget cuts': 'Downgrade options, payment flexibility, value justification for leadership',
    'Poor onboarding': 'Onboarding restart, dedicated implementation support, quick win focus',
    'Service level misses': 'Root-cause review with the service owner, a recovery plan with dates, a report the client can check',
    'Key people left': 'Name the backup for each key role, show the knowledge transfer, agree a team review',
    'Price or rate pressure': 'Compare the total cost of the outcome, not the rate; offer a scope or term option instead of a cut',
    'Competitor or offshore alternative': 'Total-cost comparison on the outcome, staged transition proof, references from similar clients',
    'Scope changed': 'Re-baseline the scope, agree the change process, name the owner on both sides',
    'Governance or reporting gaps': 'Reset the review cadence, name the owners, agree the reports the client reads',
    'Transition problems': 'Recovery plan against the transition milestones, extra knowledge transfer, exit criteria for each stage',
    'Vendor consolidation': 'Compare the outcome the buyer needs from each option, not the size of the bundle',
    'Outages and slow repairs': 'Incident review per site, a repair-time commitment you can meet, a fallback link plan',
    'Price per site': 'Total cost per site including outages and management time',
    'Migration or cut-over pain': 'Wave plan with a rollback rule for each wave, fallback links, a named owner per region',
    'Competitor or operator switch': 'Start with the sites where service is worst; let the results make the case',
    'Contract end and re-tender': 'Open the renewal early with the network owner and procurement together, and bring service records',
    'Security overlay gaps': 'Show how network and security controls are managed together and who responds to an incident',
    'Performance against the agreed benchmark': 'A review of the drivers of the gap with the sponsor, and what changes next',
    'Fee pressure': 'Agree reporting and scope instead of a fee cut',
    'Reporting or explainability gaps': 'Add the explanation the client asks for to every report',
    'Mandate or allocation change': 'Meet the new decision makers early and restate the agreed purpose',
    'Key contact left': 'New champion discovery, executive sponsorship renewal',
    'Risk concerns': 'Prepare the documentation and limits risk and compliance ask for, before they ask',
    'Executive sponsor left': 'Meet the new owner in the first weeks, restate the agreed goals and bring the results so far',
    'Failed implementation': 'A recovery plan with dates for the sites or teams not yet live, and a named owner on both sides',
    'Poor ROI': 'A value review that puts the results the contract delivered next to what it costs, in the customer\'s own measures',
    'Contract terms': 'Offer terms that keep the value (scope, phasing, notice) instead of a discount',
    'Unpredictable billing': 'Explain how usage is counted, offer a cap or an alert, and agree a forecast',
    'Usage dropped': 'Find what changed on the customer side and restart with the team that used it most',
    'Better pricing elsewhere': 'Compare the total cost of the outcome, not the unit price',
    'Feature gaps': 'Log the request with the customer, share what the product does today for the need, and agree a workaround',
    'Integration issues': 'Name the owner of each integration on both sides and fix the failing data first',
    'Low supply/demand': 'Focus the effort on the side that is short, in one category or area first',
    'Trust issues': 'Show the checks you run, handle each dispute personally, and report back to those affected',
    'Fee concerns': 'Show what the fee pays for and what repeat participants get for it',
    'Better platform': 'Compare reach and outcomes for the participant, and fix the gaps they name',
    'Quality issues': 'Remove or coach the repeat offenders and publish the quality bar',
    'Never converted': 'Find the first action that shows value and guide users to it',
    'Feature limits frustrating': 'Review where the limit bites and offer the paid step that removes it',
    'Found free alternative': 'Show what the paid plan does that the free tool does not',
    'Not enough value to pay': 'Ask what would make the paid plan worth it for them, and test it',
    'Price per transaction compared with another provider': 'Compare the full cost of the outcome (fees plus the failed or repeated transactions), not the unit price, and offer volume terms only where the customer\'s own volume supports them',
    'Failures, delays or returns on transactions': 'Review the failures behind the repeat contacts, fix the most common cause first and tell the affected customers what changed',
    'Slow help when something went wrong': 'Give repeat contacts a named owner, review response times on failed transactions and close the loop with each customer',
    'Volume moved to a second provider': 'Ask what the other provider does for them that you do not, and propose a measured split on one flow',
    'Business slowed down or stopped': 'Check whether the cause is on the customer\'s side, keep the account warm and make restarting easy',
    'A connection to a selling channel or system broke': 'Name the owner of each connection on both sides, fix the failing one first and confirm with the customer that transactions arrive',
    'A channel or option that was needed was missing': 'Log the request with the customer, say plainly what you offer today for the need and agree a workaround',
};

type ReasonKind = 'bundle' | 'price' | 'feature' | 'service' | 'person' | 'support' | 'competitor' | 'adoption' | 'other';
const REASON_KINDS: Array<[ReasonKind, RegExp]> = [
  ['bundle', /\b(bundl\w*|consolidat\w*|one vendor|single vendor|suite)\b/],
  ['price', /\b(price|prices|pricing|cost|costs|expensive|cheaper|discount\w*|rates?|fees?)\b/],
  ['feature', /\b(features?|missing|capabilit\w*)\b/],
  ['service', /\b(sla|service levels?|service credits?|credits?|uptime|outages?|incidents?|repair\w*|downtime)\b/],
  ['person', /\b(key \w+ left|champion|sponsor|contact left|attrition|turnover|resign\w*)\b|\b(?:owner|lead|manager|contact)\b[^.]{0,20}\b(?:left|changed|moved on)\b/],
  ['support', /\b(support|help|response|tickets?)\b/],
  ['competitor', /\b(competitors?|switch\w*|alternatives?|rivals?|incumbents?)\b/],
  ['adoption', /\b(adopt\w*|usage|engagement|unused|not using|low use|(?:do|does|did|will|would) not use|won't use|logging in|log in|logins?|stopped using)\b/],
];
const kindOfReason = (text: string): ReasonKind => (REASON_KINDS.find(([, re]) => re.test(text.toLowerCase())) ?? ['other'])[0];

/** What each current intervention can help with, by what it is called. */
const INTERVENTION_HELPS: Array<[RegExp, ReasonKind[]]> = [
  [/business review|\bqbr\b|\bebr\b|service review|steering|executive (?:check|review|sponsor)|account review/i, ['price', 'competitor', 'person', 'service', 'bundle']],
  [/onboard|training|kick-?off|enablement|activation|adoption|go-?live/i, ['adoption', 'feature']],
  [/support|help ?desk|ticket|escalat|\bsla\b/i, ['support', 'service']],
  [/\bnps\b|survey|csat|feedback|interview/i, ['feature', 'support', 'adoption']],
  [/discount|renewal offer|pricing|price lock|\bcredit/i, ['price']],
  [/health|score|alert|monitor|dashboard|usage report/i, ['adoption', 'service']],
  [/champion|sponsor|relationship|exec|account manager|csm/i, ['person', 'competitor']],
];

function parseChurn(text: string): { n: number | null; period: 'month' | 'year' | 'quarter' | 'unstated'; monthly: number; annual: number } {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return { n: null, period: 'unstated', monthly: 0, annual: 0 };
  const n = parseFloat(m[1]);
  const period = /\b(?:annual(?:ly)?|yearly|per year|a year|per annum|p\.?a\.?|each year)\b|\/\s?(?:yr|year)\b/i.test(text) ? 'year'
    : /\bquarter(?:ly)?\b|\/\s?q\b/i.test(text) ? 'quarter'
    : /\b(?:month(?:ly)?|per month|a month|each month|\/\s?mo)\b/i.test(text) ? 'month' : 'unstated';
  const monthly = period === 'year' ? n / 12 : period === 'quarter' ? n / 3 : n;
  return { n, period, monthly, annual: monthly * 12 };
}

export function writeRetentionPlaybook(args: {
  customer_segment: string; business_model: string; current_churn_rate: string; churn_reasons?: string; available_data_signals?: string;
  cs_team_size?: string; current_interventions?: string; product?: string; industry?: string;
}): string {
  const choice = args.business_model;
  const csTeamSize = args.cs_team_size || 'small_1_3';
  const capacity = CAPACITY[csTeamSize] || CAPACITY.small_1_3;
  const reasons = typedList(args.churn_reasons);
  const dataSignals = typedList(args.available_data_signals);
  const current = typedList(args.current_interventions);
  const product = args.product ? args.product.trim() : '';
  const productRef = product || 'your service';
  const accountRef = product || 'your account';
  const sign = product ? `The ${product} team` : 'Your account team';
  const segment = args.customer_segment.trim();
  const ctx = readContext({ model: MODEL_OF_CHOICE[choice], vertical: args.industry }, { seller: [args.product], context: [args.churn_reasons, args.available_data_signals], buyer: [args.customer_segment] });
  const model0 = wordingModel(ctx, choice !== 'enterprise_contract');
  // an enterprise contract the user chose is read as people-delivered services only for an IT services firm, and as connectivity only for a telecom company
  const model = choice === 'enterprise_contract' && ((model0 === 'services' && ctx.v?.id !== 'ites') || (model0 === 'connectivity' && ctx.v?.id !== 'telecom')) ? null : model0;
  const contractModel = model === 'services' || model === 'connectivity' || model === 'investment' ? model : null;
  const subscription = !contractModel && (['saas_subscription', 'usage_based', 'freemium', 'marketplace', 'transactional'].includes(choice) || (choice === 'enterprise_contract' && model === 'saas'));
  const ctxLine = choice === 'enterprise_contract' && (!ctx.model || model !== ctx.model)
    ? ctx.line.replace(/Business model: [^]*$/, 'Business model: enterprise contract (from your business_model input; name your offer in the product input and a services, connectivity or investment contract is read from it).*')
    : ctx.line;
  // AI native without a kind read is written for case-by-case decision AI (cost per case, human review); other AI products get the reasons as questions
  const caseAI = ctx.v?.id === 'ai-native' && !ctx.v.subtype && !/investment/i.test(ctx.v.name);
  const churn = parseChurn(args.current_churn_rate);
  const severity = churn.monthly > 8 ? 'CRITICAL' : churn.monthly > 5 ? 'HIGH' : churn.monthly > 3 ? 'MODERATE' : 'LOW';
  const typedRate = roundTypedPercents(args.current_churn_rate).trim();
  const pb = ctx.v ? playbookFor(ctx.v) : null;
  const notes = segmentNotes(segment);
  const smallCustomers = /\b(smb|small|sellers?|merchants?|d2c|startups?|freelanc\w+|individuals?|consumers?|shops?|stores?|retailers?|businesses)\b/i.test(segment) && !/\b(enterprise|large|corporate|institution\w*)\b/i.test(segment);
  const volumeModel = choice === 'transactional' || choice === 'usage_based' || choice === 'marketplace' || choice === 'freemium';
  const enterpriseLike = !volumeModel && !smallCustomers;
  // how leaving is worded for this model: "customers who ___" (past) and "you decided to ___" (infinitive)
  const LEAVE: Record<string, [string, string]> = {
    saas_subscription: ['cancelled', 'cancel'], usage_based: ['cut their usage or stopped using it', 'cut your usage or stop using it'], transactional: ['moved their volume to another provider', 'move your volume to another provider'],
    marketplace: ['stopped transacting', 'stop transacting'], freemium: ['stopped using the free plan or did not upgrade', 'stop using the free plan or not upgrade'],
    enterprise_contract: ['ended the contract or did not renew', 'end the contract or not renew'], services_contract: ['ended the engagement or did not renew the statement of work', 'end the engagement or not renew the statement of work'],
    connectivity_contract: ['ended the contract or did not renew', 'end the contract or not renew'], investment_mandate: ['withdrew the mandate or did not renew it', 'withdraw the mandate or not renew it'],
  };
  const [leftPast, leaveInf] = LEAVE[choice] ?? ['left', 'leave'];
  const cust = model === 'services' || model === 'investment' ? 'client' : choice === 'marketplace' ? 'participant' : 'customer';
  const modelName = readableChoice(choice) + (model === 'investment' && choice === 'enterprise_contract' ? ' (an investment mandate)' : '');
  const out: string[] = [];

  // ---- where you stand ----
  const headSeg = segment.length <= 90 ? segment : null;
  out.push(`# ${reasons.length ? 'Retention playbook' : 'Churn discovery kit'}: ${product || (headSeg ?? 'your customers')}`);
  out.push('');
  out.push(ctxLine);
  out.push('');
  out.push('## Where you stand');
  const stand: string[] = [];
  stand.push(`This is written for ${headSeg ? segment : 'the segment you described'}${product && !segment.toLowerCase().includes(product.toLowerCase()) && !/customers of/i.test(segment) ? ` (customers of ${product})` : ''}, on ${aAn(modelName)} ${modelName} model, with ${readableChoice(csTeamSize)} customer success capacity${args.cs_team_size ? '' : ' (assumed)'}.`);
  if (headSeg === null) stand.push(`The segment, as you described it: ${quoted(segment)}.`);
  if (churn.n === null) stand.push(`You gave a churn rate of ${quoted(typedRate)}, which could not be read as a number, so no severity is shown.`);
  else {
    stand.push(`You report churn of ${typedRate}${churn.period === 'unstated' ? ', which is read as a monthly rate' : ''}.`);
    if (churn.period === 'year') stand.push(`Spread evenly that is about ${pct(churn.monthly)}% a month (the annual rate divided by twelve).`);
    else if (churn.period === 'quarter') stand.push(`That is about ${pct(churn.monthly)}% a month and about ${pct(churn.annual)}% a year (the quarterly rate divided by three, then times twelve, not compounded).`);
    else stand.push(`If it holds, that is about ${pct(churn.annual)}% of ${volumeModel ? 'volume' : 'customers'} lost in a year (the monthly rate times twelve, not compounded).`);
    stand.push(`It reads ${severity} against the example thresholds of this tool (above 8% a month is critical, above 5% high, above 3% moderate). The thresholds are illustrations, so judge the rate against your own history.`);
  }
  out.push(stand.join(' '));
  out.push('');
  const sectorParas: string[] = [];
  if (notes && enterpriseLike) sectorParas.push(`In this segment a ${subscription ? 'purchase' : 'renewal'} usually involves ${notes.review}, so check each reason for leaving against those steps as well as the product and the price.`);
  if (ctx.v && pb && enterpriseLike && !caseAI) sectorParas.push(`In ${ctx.v.name}: ${pb.renewal}`);
  if (sectorParas.length) { out.push(sectorParas.join(' ')); out.push(''); }

  // ---- the reasons ----
  const sectorLine = ctx.v ? `In ${ctx.v.name} the proof that lands is ${lcFirst(ctx.v.proofShape).replace(/[.]$/, '')}.` : 'Use a result from a similar customer that you can show.';
  const intervention = (reason: string) => {
    const generic = answerFor(reason, null);
    const found = answerFor(reason, ctx.v);
    const sector = found === generic ? '' : found;
    const hi = capacity.highTouch > 30;
    switch (kindOfReason(reason)) {
      case 'bundle': return { trigger: 'Another vendor offers a bundled or consolidated package to the account', action: `Compare the outcome each option delivers, not the feature lists.${sector ? ` ${sector}` : ''}`, owner: hi ? 'CSM with the account executive' : 'CS team, with the account executive', timing: 'Within a week of the signal',
        email: `Subject: Comparing the outcome, not the bundle\n\nHello,\n\nI understand another vendor has offered a bundled package. That can look simpler on paper.\n\nBefore you decide, I would like to compare what each option delivers for the results you care about, and what the bundle leaves to manual work.\n\nWould a short comparison with your team help?\n\n${sign}` };
      case 'price': return { trigger: 'A price objection in a survey, a support ticket or a cancellation reason', action: 'A value review: what the account gets for what it pays, in its own measures, before any discount is discussed', owner: hi ? 'CSM' : 'CS team, after an automated email', timing: 'Within a day of the signal',
        email: `Subject: What ${productRef} delivers for what you pay\n\nHello,\n\nYou raised the cost of ${productRef}. I would like to go through what it delivers for your team and what it costs, so the comparison is fair.\n\nWould you be open to a short call this week?\n\n${sign}` };
      case 'feature': return { trigger: 'A missing capability mentioned in support, feedback or a survey', action: 'Log the request with the customer, show what the product does today for the need, and agree a workaround; promise no date you cannot keep', owner: hi ? 'CSM with product input' : 'Support, with escalation to product', timing: 'Within two days',
        email: `Subject: About what you told us was missing\n\nHello,\n\nThank you for telling us what ${productRef} is missing. I wanted to follow up personally.\n\nI cannot promise timelines, but I can walk you through what ${productRef} does today for this need and the options we have.\n\nWould it help to go through it together?\n\n${sign}` };
      case 'service': return { trigger: 'Service levels missed, credits claimed or disputed, or the same incident again', action: `A service recovery review: the cause, a recovery plan with dates and a report the customer can check.${sector ? ` ${sector}` : ''}`, owner: 'Service owner and CSM', timing: 'Within two days of the signal, then at the next review',
        email: `Subject: Service levels for ${accountRef}\n\nHello,\n\nI saw that service levels have not met what we agreed. I would like to walk you through the cause and a recovery plan with dates.\n\nCould we find half an hour this week with your service owner?\n\n${sign}` };
      case 'person': return { trigger: 'A key person on either side leaves or changes role', action: `Name a backup for each key role, show how knowledge is handed over, and find the new champion.${sector ? ` ${sector}` : ''}`, owner: hi ? 'CSM with the account executive' : 'CS team, with the account executive', timing: 'Within a week of the change',
        email: `Subject: Continuity for ${accountRef}\n\nHello,\n\nI know there has been a change in the team. I would like to confirm who covers each key role and how knowledge is being passed on, so nothing slips.\n\nCould we meet this week to go through it?\n\n${sign}` };
      case 'support': return { trigger: 'Several support tickets, or low satisfaction after a support contact', action: 'An executive escalation, a named support contact and a recovery step the customer can see', owner: 'Support manager and CSM', timing: 'The same day',
        email: `Subject: Making things right\n\nHello,\n\nI saw that your recent support experience did not meet our standard, and I am sorry. I have reviewed your case myself and would like to set up a direct escalation path for you.\n\nCan we schedule a call to go through it?\n\n${sign}` };
      case 'competitor': return { trigger: 'A competitor named in any customer contact', action: `A differentiation call, with the comparison based on the customer's own results.${sector ? ` ${sector}` : ''}`, owner: hi ? 'CSM or account executive' : 'CS team, with comparison content', timing: 'Within four hours of the mention',
        email: `Subject: Before you decide\n\nHello,\n\nI understand you are looking at other options. That is sensible: you should look at what is best for your team.\n\nBefore you decide, I would like to share what ${productRef} has delivered for you so far, next to what you would be moving to.\n\nIs there a good time this week?\n\n${sign}` };
      case 'adoption': return { trigger: subscription ? 'Low logins or few features used for several weeks' : contractModel === 'connectivity' ? 'Sites not live in the planned wave, or the same incident again and again' : contractModel === 'investment' ? 'Falling attendance at reviews, or fewer reports opened' : 'Fewer requests raised, fewer service reviews attended, or reports unread',
        action: subscription ? 'An onboarding reset, a use case discovery call and one quick win with a date' : 'A service review, a use case discovery call and one quick win with a date', owner: hi ? 'CSM' : 'CS team, after an automated nurture', timing: subscription ? 'As soon as the pattern shows, then again two weeks later' : 'At the next service review, or within two weeks of the signal',
        email: `Subject: Getting more out of ${accountRef}\n\nHello,\n\nI noticed your team has not been using ${productRef} as much recently. Sometimes that means we did not get the first setup right.\n\nI would like to understand your goals and show you one quick win.\n\nCould we take fifteen minutes this week?\n\n${sign}` };
      default: return { trigger: `${quoted(capEchoSafe(reason, 120))} raised by a customer`, action: `Personal outreach and a root cause review.${sector ? ` ${sector}` : ''}`, owner: hi ? 'CSM' : 'CS team, after an automated check-in', timing: 'Within two days of the signal',
        email: `Subject: A quick check-in\n\nHello,\n\nI wanted to reach out personally because your feedback matters to us.\n\nYou told us: ${quoted(capEchoSafe(reason, 200))}. I would like to understand this better and see what we can do.\n\nDo you have ten minutes this week?\n\n${sign}` };
    }
  };

  const reasonKinds = reasons.map(kindOfReason);
  if (reasons.length) {
    out.push('## Why customers leave, and what to do about each reason');
    out.push('');
    out.push(`Each reason gets a signal to watch, a first step, an owner and a draft message. The measure of success is the same for all of them: the share of ${cust}s who got the step and are still ${cust}s after the next ${subscription ? 'billing period' : 'review'}. ${sectorLine} Add a result to a draft only if you hold it.`);
    out.push('');
    reasons.forEach((reason, i) => {
      const step = intervention(reason);
      out.push(`### Reason ${i + 1}: ${quoted(reason)}`);
      out.push('');
      out.push(`**Signal to watch:** ${step.trigger}.`);
      out.push(`**First step:** ${stripEnd(step.action)}.`);
      out.push(`**Owner and timing:** ${step.owner}; ${lcFirst(step.timing)}.`);
      const own = ctx.v && pb && enterpriseLike ? pb.churnReasons.find((r) => kindOfReason(r.reason) === reasonKinds[i] && reasonKinds[i] !== 'other') : undefined;
      if (own) out.push(`**In ${ctx.v!.name}:** ${stripEnd(own.signal)}. A step that fits: ${lcFirst(stripEnd(own.action))}.`);
      out.push('');
      out.push('Draft message:');
      out.push('');
      out.push('```');
      out.push(step.email);
      out.push('```');
      out.push('');
    });
  } else {
    out.push(...discoveryKit());
  }

  // ---- what you already do ----
  if (current.length && reasons.length) {
    out.push('## What you already do');
    out.push('');
    for (const item of current) {
      const helps = INTERVENTION_HELPS.filter(([re]) => re.test(item)).flatMap(([, kinds]) => kinds);
      const answered = reasons.map((r, i) => ({ r, i })).filter(({ i }) => helps.includes(reasonKinds[i]));
      out.push(`- ${quoted(item)}: ${answered.length ? `it speaks to ${andList(answered.map(({ i }) => `reason ${i + 1}`))}; keep it, and check that it reaches the ${cust}s who raised ${answered.length === 1 ? 'that reason' : 'those reasons'}.` : 'no reason above is answered by it directly; keep it if it earns its cost, and see what it protects.'}`);
    }
    const unanswered = reasons.map((_r, i) => i).filter((i) => !current.some((item) => INTERVENTION_HELPS.some(([re, kinds]) => re.test(item) && kinds.includes(reasonKinds[i]))));
    out.push('');
    out.push(unanswered.length ? `Nothing you do today speaks to ${andList(unanswered.map((i) => `reason ${i + 1}`))}: start there.` : 'Every reason has something you already do that speaks to it, so the work is to make each one reach the right customers on time.');
    out.push('');
  }

  // ---- health score ----
  const weights: Record<string, number> = contractModel
    ? Object.fromEntries(CONTRACT_SIGNALS[contractModel].map((sg) => [sg, Math.round((100 / CONTRACT_SIGNALS[contractModel].length) * 10) / 10]))
    : (HEALTH_WEIGHTS[choice] || HEALTH_WEIGHTS.saas_subscription);
  const signalWords = (key: string): string[] => key.split('_').filter((w) => w.length >= 4 && !['trend', 'rate', 'requested', 'sentiment'].includes(w));
  const trackedFor = (key: string): string | null => dataSignals.find((ds) => signalWords(key).some((w) => ds.toLowerCase().includes(w.slice(0, 4)))) ?? null;
  const usedSignals = new Set<string>();
  const LABELS: Record<string, string> = { ticket_backlog_trend: 'open request backlog trend', aov_trend: 'value per transaction trend', category_breadth: 'breadth of use', purchase_frequency: 'transaction frequency', feature_adoption: subscription ? 'feature adoption' : 'service adoption' };
  const label = (sg: string): string => LABELS[sg] ?? sg.replace(/_/g, ' ');
  out.push('## Health score');
  out.push('');
  out.push(contractModel
    ? `The signals below are for ${contractModel === 'services' ? 'a services' : contractModel === 'connectivity' ? 'a connectivity' : 'an investment'} contract. The weights are an equal split of 100%, computed from the number of signals: set your own from your data.`
    : 'The weights below are illustrations to adapt to your data.');
  out.push('');
  out.push('| Signal | Weight | Where it comes from |');
  out.push('|--------|--------|---------------------|');
  for (const [sg, w] of Object.entries(weights)) {
    const tracked = trackedFor(sg);
    if (tracked) usedSignals.add(tracked);
    out.push(`| ${label(sg)} | ${pct(w)}% | ${tracked ? `you track ${quoted(tracked)}` : 'to add: you did not name a matching data signal'} |`);
  }
  out.push('');
  const unused = dataSignals.filter((d) => !usedSignals.has(d));
  if (dataSignals.length) out.push(`You said you can track ${andList(dataSignals.map((d) => quoted(d)))}.${unused.length ? ` ${andList(unused.map((d) => quoted(d)))} ${unused.length === 1 ? 'is' : 'are'} not matched to a signal above: add ${unused.length === 1 ? 'it' : 'them'} as signals, or use ${unused.length === 1 ? 'it' : 'them'} in your reviews.` : ' Every one is matched to a signal above.'}`);
  else out.push('Every signal above is marked "to add", because no data signals were named.');
  out.push('');
  out.push(`The score is the sum of each signal scaled 0 to 100 and multiplied by its weight. Read it as below 30 red, 30 to 70 yellow and above 70 green: critical up to 30 (act at once), at risk from 31 to 50 (reach out), monitor from 51 to 70 (nurture), healthy above 70 (expand and ask for advocacy). These bands are illustrations.`);
  out.push('');

  // ---- team time ----
  out.push('## How the team\'s time is split');
  out.push('');
  out.push(`A starting split for ${readableChoice(csTeamSize)} capacity (an illustration to adapt): ${capacity.highTouch}% personal contact (calls, custom solutions, executive involvement), ${capacity.scaledTouch}% one-to-many contact (webinars, office hours, community) and ${capacity.automated}% automated contact (${subscription ? 'email sequences, in-product messages, self-serve help' : 'email sequences, scheduled reports, portal updates'}).`);
  out.push('');

  // ---- timing ----
  out.push(`## ${subscription ? 'When to reach out' : 'Contract moments to plan around'}`);
  out.push('');
  if (choice === 'saas_subscription' || choice === 'freemium' || (choice === 'enterprise_contract' && subscription)) {
    out.push('| Touchpoint | When | What happens | Goal |', '|------------|------|--------------|------|',
      '| Onboarding check | Day 7 | Adoption check and one quick win | Activate |', '| First value review | Day 30 | Review the success measures | Confirm value |',
      '| Expansion probe | Day 60 | Look for a second use case | Deepen |', '| Business review | Day 90 | Review results with the sponsor | Renew signal |',
      '| Pre-renewal | 60 days before renewal | Renewal conversation | Retain |', '| At risk | When the health score or an alert triggers | A step from the list above | Save |');
    out.push('', 'The days are illustrations: set your own.');
  } else if (volumeModel) {
    out.push('| Touchpoint | When | What happens | Goal |', '|------------|------|--------------|------|',
      `| First live volume | When the first ${choice === 'marketplace' ? 'transactions' : 'volume'} arrives | Confirm it went through as expected and who to call | Activate |`,
      '| Volume review | Every month, per customer | Compare each customer with its own trend | Spot a fall early |',
      '| Fall alert | When a customer\'s volume drops against its own trend | A personal step from the list above | Save |',
      '| Commitment end | Early enough to act, where a commitment exists | Renewal conversation | Retain |');
  } else {
    out.push('| Touchpoint | When | What happens | Goal |', '|------------|------|--------------|------|',
      '| Go-live check | When the service goes live | Confirm it is live as contracted | Activate |', '| First service review | After go-live, at the first review | Review service levels and open issues with the owner | Confirm value |',
      '| Regular review | On the schedule in your contract | Review reports, incidents and requests | Deepen |', '| Pre-renewal | Early enough to act; your notice period decides | Renewal conversation with the sponsor | Retain |',
      '| At risk | When the health score or an incident triggers | A step from the list above | Save |');
  }
  out.push('');

  // ---- measures ----
  out.push('## Measures to watch');
  out.push('');
  out.push('| Measure | Now | Where to read it |', '|---------|-----|------------------|',
    `| Churn | ${churn.n === null ? 'not readable' : typedRate} | ${volumeModel ? 'Billing and volume records' : 'Billing system'} |`,
    '| Health score coverage | not measured yet | CS platform |', '| Response to outreach | not measured yet | Email and call tracking |', '| Save rate (at risk to retained) | not measured yet | CS platform |',
    `| ${subscription ? 'Time to first value' : 'Time to go-live'} | not measured yet | ${subscription ? 'Product analytics' : 'Project plan'} |`);
  out.push('');
  out.push('Set your own target for each measure once you have a first reading.');
  out.push('');

  // ---- sector ----
  if (ctx.v && enterpriseLike) {
    out.push(`## What to expect at renewal in ${ctx.v.name}`);
    out.push('');
    out.push(`Buyers in ${ctx.v.name} often raise: ${ctx.v.objections.map((o) => lcFirst(stripEnd(o.objection).replace(/\?$/, ''))).join('; ')}.${caseAI ? '' : ` They use words such as ${andList(ctx.v.vocabulary.slice(0, 6))}; use the same words in your messages.`}`);
    out.push('');
  } else if (ctx.v && pb) {
    out.push(`## What ${ctx.v.name} customers measure`);
    out.push('');
    out.push(`${upper1(ctx.v.name)} customers judge a provider by ${andList(ctx.v.metrics.slice(0, 5))}; check whether those measures moved for the ${cust}s who left. They use words such as ${andList(ctx.v.vocabulary.slice(0, 6))}; use the same words in your messages.`);
    out.push('');
  }

  // ---- what was not given ----
  const missing: Array<[string, string]> = [];
  if (!reasons.length) missing.push(['the churn reasons (why customers leave), in the churn_reasons input', 'this kit, which would become a playbook with a signal, a step, an owner and a draft message for each reason']);
  if (!dataSignals.length) missing.push(['the data signals you can track, in the available_data_signals input', 'the health score table, where every signal is now marked "to add"']);
  if (!current.length) missing.push(['what you already do to keep customers, in the current_interventions input', 'the comparison with each reason, which shows what is covered and what is not']);
  if (!product) missing.push(['the product or company name, in the product input', 'the title and the drafts, which now say "your service"']);
  if (!args.cs_team_size) missing.push(['the customer success team size, in the cs_team_size input; the plan assumes small (1 to 3)', 'the split between personal, one-to-many and automated contact']);
  if (churn.n !== null && churn.period === 'unstated') missing.push(['whether the churn rate is monthly, quarterly or yearly', `the annual figure, which now reads ${typedRate} as monthly`]);
  if (!args.industry && !ctx.v) missing.push(['the industry, in the industry input', 'the sector measures, objections and renewal habits, which are now left out']);
  const kinds = kindsWithLines(ctx, ['churnReasons', 'renewal']);
  if (kinds.length) missing.push([`what ${product || 'your company'} sells, said in a few words after its name in the product input`, 'the reasons and steps, which now fit any company in the sector']);
  out.push(sharpenBlock(missing));
  return dropRepeatedLines(out.join('\n')).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

  // ---------------- the churn discovery kit (no reasons given) ----------------
  function discoveryKit(): string[] {
    const k: string[] = [];
    const baseKey = contractModel ?? (choice === 'services_contract' ? 'services' : choice === 'connectivity_contract' ? 'connectivity' : choice === 'investment_mandate' ? 'investment' : choice);
    const base = COMMON_REASONS[baseKey] ?? COMMON_REASONS.saas_subscription;
    // a reason that needs a fact the user did not give (that the price follows volume or cases) is printed as a question
    const own = pb && enterpriseLike ? pb.churnReasons.map((r) => (caseAI && /cost/i.test(r.reason) ? { reason: 'Did the cost grow faster than the value as use grew?', signal: 'If the price follows volume or use: cost per unit of use rises faster than the value customers report', action: 'Show the cost against the value delivered, with their own volumes, and offer a price that follows the value' } : r)) : [];
    // the unit of a transaction in this sector ("shipment", "payment"), read from the sector's own measures
    const unit = (ctx.v?.metrics.join(' ').match(/\b(?:cost|price|fee|rate)s? per (\w+)/i) ?? [])[1] ?? 'transaction';
    const unitize = (t: string): string => (choice === 'transactional' ? t.replace(/\btransactions\b/g, `${unit}s`).replace(/\btransaction\b/g, unit) : t);
    const list0 = [...own.map((r) => r.reason), ...base.filter((r) => !own.some((x) => x.reason.toLowerCase().split(' ').filter((w) => w.length > 4).some((w) => r.toLowerCase().includes(w))))].slice(0, 8);
    const list = list0.map(unitize);
    const original = (r: string): string => list0[list.indexOf(r)] ?? r;
    const signalOf = (r: string): string => unitize(own.find((x) => x.reason === original(r))?.signal ?? SIGNAL_FOR[original(r)] ?? 'Check support tickets and usage data for mentions');
    const stepOf = (r: string): string => unitize(own.find((x) => x.reason === original(r))?.action ?? STEP_FOR[original(r)] ?? 'Reach out personally to understand the concern and answer it');
    k.push('## What to find out first');
    k.push('');
    k.push(`No churn reasons were given, so this kit is a short plan to find them: ask the ${cust}s who ${leftPast}, look at your own data for the pattern, then treat the likely reasons below as questions to test, not as findings. Start with the most recent departures and the largest ones.`);
    k.push('');
    k.push('## Step 1: ask the customers who left');
    k.push('');
    k.push('Send this within a week of the departure. The options are the likely reasons listed further down; they are hypotheses to test, so keep "Other" open.');
    k.push('');
    k.push('```');
    k.push(`Subject: ${subscription && volumeModel === false ? 'A short question about your decision' : 'A short request: what should we have done differently?'}\n\nHello,\n\nThank you for the time you spent with ${productRef}. To help us improve, would you tell us the main reason you decided to ${leaveInf}?\n\nPlease pick the one that fits best:\n${list.map((r) => `- ${r}`).join('\n')}\n- Other (please say what)\n\nAny further feedback is welcome.\n\nThank you,\n${sign}`);
    k.push('```');
    k.push('');
    k.push('## Step 2: a short interview for the larger losses');
    k.push('');
    const metricAsk = ctx.v && ctx.v.metrics.length >= 2 && !caseAI ? `While you used ${productRef}, how did ${ctx.v.metrics[0]} and ${ctx.v.metrics[1]} change for you?` : `While you used ${productRef}, what changed for you, and by how much?`;
    const qs = [
      'Thank you for the time. I am trying to understand what we could have done better.',
      `Walk me through how you came to the decision to ${leaveInf}: when did you first start thinking about it?`,
      'What was the final trigger?',
      metricAsk,
      'If you could change one thing about us, what would it be?',
      'Did you look at alternatives, and what did they offer that we did not?',
      'Was there a moment when you felt most frustrated with us?',
      ...(subscription && !volumeModel ? [] : ['Who else took part in the decision, and what did they need to see?']),
      'Is there anything that would bring you back?',
      `What would you tell someone considering ${product || 'our service'}?`,
    ];
    k.push(qs.map((x, i) => `${i + 1}. ${x}`).join('\n'));
    k.push('');
    k.push('## Step 3: look at your own data first');
    k.push('');
    const checks = subscription && !volumeModel
      ? ['Login frequency in the weeks before each departure', 'Which features the customers who left did not use', 'Support ticket volume and tone', 'Time since the last meaningful action', 'NPS or CSAT where you have it']
      : volumeModel ? ['Volume per customer in the months before each departure, against that customer\'s own trend', 'Whether volume fell before the customer said anything', `Failures, delays or returns per customer${ctx.v ? `, and the measures ${ctx.v.name} customers watch: ${andList(ctx.v.metrics.slice(0, 3))}` : ''}`, 'Support contacts and how long they took to close', 'Which acquisition channel and which size of customer left most']
      : contractModel === 'connectivity' ? ['Uptime and repair times per site in the months before the contract ended', 'Incidents and service credits paid', 'Sites late in their wave', 'Changes of contact on the customer side', 'Support ticket volume and tone']
      : contractModel === 'investment' ? ['Performance against the agreed benchmark in the review periods before the departure', 'Fee discussions and reporting requests', 'Changes of contact or committee on the client side', 'Attendance at reviews']
      : ['Service level reports in the months before the contract ended', 'Incidents, repair times or missed targets', 'Support ticket volume and tone', 'Changes of contact or sponsor on the customer side', 'NPS or CSAT where you have it'];
    k.push(checks.map((x) => `- ${x}`).join('\n'));
    k.push('');
    if (dataSignals.length) { k.push(`You said you can track ${andList(dataSignals.map((d) => quoted(d)))}: start with those.`); k.push(''); }
    if (current.length) { k.push(`You already do ${andList(current.map((d) => quoted(d)))}: ask each departed ${cust} whether they reached them, and what they thought.`); k.push(''); }
    k.push('## The likely reasons to test');
    k.push('');
    k.push(`These are common for a ${modelName} model${ctx.v && enterpriseLike ? ` in ${ctx.v.name}` : ''}, in no order of likelihood. For each: the signal that points to it and a first step if it proves true.`);
    k.push('');
    list.forEach((r, i) => { k.push(`### ${i + 1}. ${r}`); k.push(''); k.push(`**Signal:** ${stripEnd(signalOf(r))}.`); k.push(`**First step if true:** ${stripEnd(stepOf(r))}.`); k.push(''); });
    k.push('## After the first answers');
    k.push('');
    k.push('Come back with the three to five reasons you hear most, in the churn_reasons input (one per line or separated by semicolons), and this becomes a playbook with a signal, an owner, a timing and a draft message for each one.');
    k.push('');
    return k;
  }
}

/** A typed text shortened at a word boundary, for a place where a long text would break the sentence; the full text is quoted where it first appears. */
function capEchoSafe(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  const cut = t.slice(0, max); const at = cut.lastIndexOf(' ');
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:\s]+$/, '');
}

// ---------------------------------------------------------------------------------------------------------------------------------
// crisis_planner
// ---------------------------------------------------------------------------------------------------------------------------------
// Extra people on the response team by sector (roles, never names). The roles of a vertical are true for every company in it; the roles of one kind of company sit under its sub-type.
const SECTOR_ROLES: Record<string, string[]> = {
  'logistics-tech': ['Head of Operations (customer operations)', 'Customer support lead'], fintech: ['Head of Operations', 'Head of Compliance'],
  'vertical-saas': ['Head of Customer Operations', 'Integrations lead'], 'ai-native': ['Data and AI lead', 'Head of Model Evaluation'],
  ites: ['Delivery head', 'Account owners for the affected clients'], telecom: ['Service operations lead', 'Customer support lead'],
  cybersecurity: ['Head of Threat Research', 'Product security lead'], software: ['Engineering on-call lead', 'Developer relations lead'],
};
const SUBTYPE_ROLES: Record<string, string[]> = {
  'last-mile': ['Head of Operations (customer hubs and dispatch)', 'Driver app support lead'], 'spend-expense': ['Finance operations lead', 'Head of Compliance'],
  'fmcg-retail-execution': ['Head of Customer Operations', 'Distributor integrations lead'], 'operators-connectivity': ['Network operations centre lead', 'Field engineering lead'],
};
// Default crises by industry (the owner's verticals; no health-sector crisis types)
const DEFAULT_CRISES: Record<string, string[]> = {
  fintech: ['data_breach', 'service_outage', 'fraud_incident', 'regulatory_action'], saas: ['service_outage', 'data_breach', 'security_vulnerability', 'customer_data_exposure'],
  logistics_tech: ['service_outage', 'data_breach', 'sla_breach', 'regulatory_action'], vertical_saas: ['service_outage', 'data_breach', 'customer_data_exposure', 'regulatory_action'],
  ai_native: ['ai_wrong_action', 'data_breach', 'service_outage', 'regulatory_action'], ites: ['sla_breach', 'data_breach', 'service_outage', 'executive_departure'],
  telecom: ['service_outage', 'sla_breach', 'security_vulnerability', 'regulatory_action'], software: ['security_vulnerability', 'service_outage', 'data_breach', 'pr_incident'],
  cybersecurity: ['security_vulnerability', 'data_breach', 'service_outage', 'pr_incident'], ecommerce: ['service_outage', 'payment_breach', 'supply_chain_failure', 'pr_incident'],
  enterprise: ['data_breach', 'service_outage', 'executive_departure', 'regulatory_action'], consumer: ['pr_incident', 'product_safety', 'data_breach', 'service_outage'],
  other: ['service_outage', 'data_breach', 'pr_incident', 'executive_departure'],
};
const TEAMS: Record<string, { lead: string; core: string[]; extended: string[] }> = {
  startup_under_50: { lead: 'CEO or founder', core: ['CTO (for a technical issue)', 'Head of Customer'], extended: ['Legal counsel (external)', 'PR consultant (external)'] },
  scaleup_50_200: { lead: 'CEO or a designated VP', core: ['CTO', 'VP Customer Success', 'VP Marketing or Communications', 'Legal'], extended: ['HR', 'Engineering lead', 'Support lead'] },
  midsize_200_1000: { lead: 'COO or a designated crisis lead', core: ['CTO', 'CISO', 'VP Communications', 'General Counsel', 'VP Customer Success'], extended: ['HR', 'Engineering', 'Support', 'Regional leads'] },
  enterprise_1000_plus: { lead: 'Chief Communications Officer or Crisis Team Lead', core: ['CEO (briefed)', 'CISO', 'General Counsel', 'VP Communications', 'VP Customer', 'Regional VPs'], extended: ['PR agency', 'External counsel', 'HR', 'All department heads'] },
};
const STOP_STEMS = new Set(['incid', 'issue', 'probl', 'crisi', 'custo', 'servi', 'syste', 'major', 'secur', 'breac', 'cause', 'which', 'their', 'there', 'about', 'after', 'until', 'while', 'every', 'other', 'under', 'where', 'would', 'could', 'large', 'larg', 'small', 'again', 'since', 'being', 'moves', 'leave', 'compa', 'quart', 'next', 'moving']);
const stems = (t: string): string[] => (t.toLowerCase().match(/[a-z]{5,}/g) ?? []).map((w) => w.slice(0, 5)).filter((w) => !STOP_STEMS.has(w));

export function writeCrisisPlan(args: {
  company: string; industry: string; customer_base: string; data_sensitivity: string; potential_crises?: string; company_size?: string; compliance_requirements?: string; business_model?: string;
}): string {
  const companySize = args.company_size || 'scaleup_50_200';
  const base = args.customer_base;
  const sensitivity = args.data_sensitivity;
  const compItems = typedList(args.compliance_requirements);
  const comp = compItems.length ? andList(compItems) : '';
  const prod = productParts(args.company);
  const cname = args.company.trim();
  const plainName = !/[,:;]/.test(cname) && !/^(?:a|an|the|our|my)\b/i.test(cname) && (/^[A-Z0-9]/.test(cname) ? cname.split(/\s+/).length <= 6 : cname.split(/\s+/).length === 1) ? cname : null;
  const N = prod.name ?? plainName ?? 'your company';
  const ctx = readContext({ model: args.business_model, vertical: args.industry }, { seller: [cleanCompanyName(args.company)], context: [args.potential_crises, args.compliance_requirements] });
  const model = wordingModel(ctx, !!args.business_model);
  const pb = ctx.v ? playbookFor(ctx.v) : null;
  const sectorWords = !!ctx.v && (ctx.v.id !== 'saas' || /billing/i.test(ctx.v.name));
  // sector words are printed when the kind of company was read, or when the vertical's own words are distinctive (not for the broad software verticals)
  const sectorVocab = !!ctx.v && (!!ctx.v.subtype || /billing/i.test(ctx.v.name) || !['saas', 'vertical-saas', 'software'].includes(ctx.v.id));
  // a per-site connectivity business or a people-delivered services firm is assumed only when the user's words or the sector (ITeS) say so
  const modelRead = ctx.how === 'input' || ctx.how === 'read' || !!args.business_model;
  const kindModel: 'connectivity' | 'services' | null = model === 'connectivity' && modelRead ? 'connectivity' : model === 'services' && (modelRead || ctx.v?.id === 'ites') ? 'services' : null;
  // a crisis is measured by service measures; the adoption and onboarding measures of a sector are not crisis measures
  const serviceMeasures = ctx.v ? ctx.v.metrics.filter((m) => /uptime|availab|latency|success rate|error|fail|incident|repair|restor|response time|resolution|processing time|deliver|settle|downtime|exception|attain|accuracy|delay|damage|claim|credit/i.test(m) && !/adoption|onboard|first value|go.live|retention|expansion|admin|reference/i.test(m)).slice(0, 3) : [];
  const measureText = serviceMeasures.length && ctx.v ? ` Customers in ${ctx.v.name} also watch ${andList(serviceMeasures)}: say which of them you see affected.` : '';
  let measureShown = false;
  const measureOnce = (): string => { if (measureShown) return ''; measureShown = true; return measureText; };
  // AI native without a kind read: the sector's outage sentence is about scoring and review queues, which does not fit every AI product
  const outageText = ctx.v?.id === 'ai-native' && !ctx.v.subtype && !/investment/i.test(ctx.v.name) ? 'an outage stops the AI features customers rely on, so their people take the work back by hand until service returns' : pb?.outage ?? '';
  const enterprise = base === 'b2b_enterprise';
  const consumers = base === 'b2c_consumer' || base === 'mixed';

  // crises: the ones typed, else the default set for the sector
  const typed = typedList(args.potential_crises);
  let crises: string[];
  if (typed.length) crises = typed;
  else {
    crises = [...(DEFAULT_CRISES[args.industry] || DEFAULT_CRISES.other)];
    if (pb) for (const c of pb.crises.slice(0, 2)) if (!crises.includes(c.key)) crises.unshift(c.key);
    crises = crises.slice(0, 5);
    if (sensitivity === 'high_pii_financial' && !crises.includes('data_breach')) crises.unshift('data_breach');
  }

  // the response team
  const baseTeam = TEAMS[companySize] || TEAMS.scaleup_50_200;
  const sectorRoles = ctx.v ? (ctx.v.subtype && SUBTYPE_ROLES[ctx.v.subtype]) || SECTOR_ROLES[ctx.v.id] || [] : [];
  const team = { lead: baseTeam.lead, core: [...baseTeam.core], extended: [...baseTeam.extended, ...sectorRoles] };
  if (sensitivity === 'high_pii_financial') {
    if (!team.core.some((m) => /CISO|security/i.test(m))) team.core.push('CISO or security lead');
    if (!team.core.some((m) => /data protection|DPO/i.test(m))) team.core.push('Data protection lead (DPO)');
  }
  const lead = team.lead;
  const techLead = team.core.find((m) => /CTO|CISO|security/i.test(m)) ?? team.core[0];
  const legalLead = team.core.find((m) => /Legal|Counsel/i.test(m)) ?? 'Legal counsel';
  const acct = enterprise ? 'Account team' : 'Customer communications';
  const toCustomers = enterprise ? 'A call from the account owner, then a written note' : consumers ? 'Email, the status page and in-product notice' : 'Email and the status page';
  const heading = (kind: string, name: string): string => {
    const shown = name.trim().replace(/\bpr\b/gi, 'PR');
    return shown.toLowerCase() === kind.toLowerCase() || (kind.startsWith('PR ') && shown === 'PR incident') ? kind : `${kind}: ${shown}`;
  };
  const seenRows = new Set<string>();
  const audiences = (rows: Array<[string, string, string, string]>): string => {
    const fresh = rows.filter((r) => !seenRows.has(r.join('|')));
    fresh.forEach((r) => seenRows.add(r.join('|')));
    if (!fresh.length) return '';
    return `**Who to tell**\n\n${fresh.map((r) => `- **${r[0]}** (${r[3]}): ${lcFirst(stripEnd(r[1]))}; say ${lcFirst(stripEnd(r[2]))}.`).join('\n')}\n`;
  };
  const notice = (what: string): string => (compItems.length ? `Check which of the items you listed (${comp}) require ${what}; the duties and deadlines differ by law and country, and counsel confirms them` : `Check which of your contracts or compliance duties require ${what}; the duties and deadlines differ by law and country, and counsel confirms them`);
  let securityDone = '';
  const usedOwn = new Set<string>();

  const severityTable = (): string => {
    const ceo = /CEO/.test(lead) ? lead : `${lead} and the CEO`;
    const rows = kindModel === 'connectivity'
      ? [['SEV-1', 'The core network, or the sites of several customers, down', '15 minutes', ceo], ['SEV-2', 'One customer\'s sites down, or a regional link failing', '30 minutes', team.core[0]], ['SEV-3', 'Degraded performance at some sites', '1 hour', 'Network operations lead']]
      : kindModel === 'services'
      ? [['SEV-1', 'A managed service stopped for a client', '15 minutes', ceo], ['SEV-2', 'Service levels missed for a client', '30 minutes', team.core[0]], ['SEV-3', 'Degraded service for some users', '1 hour', 'Delivery lead']]
      : [['SEV-1', 'A complete outage for all customers', '15 minutes', ceo], ['SEV-2', 'A major function down for many customers', '30 minutes', team.core[0]], ['SEV-3', 'Degraded performance', '1 hour', 'Engineering lead']];
    return `**Severity levels** (the response time is the time to respond, an example to replace)

| Level | What it means | Respond within | Escalate to |
|-------|---------------|----------------|-------------|
${rows.map((l) => `| ${l.join(' | ')} |`).join('\n')}
`;
  };
  const updateCadence = (): string => `**While it lasts**

| After | Update | Channel |
|-------|--------|---------|
| 15 minutes | "Identified", with a one-line plain description of the cause | ${enterprise ? 'Status page, and a direct update from the account owner' : 'Status page'} |
| 30 minutes | "Working on a fix", with the time of the next update | ${consumers ? 'Status page and social channels' : 'Status page, and a direct update from the account owner'} |
| 60 minutes | Progress, or a revised time | Status page and an email to the affected |
| Every 30 minutes | A further update until it is resolved | Status page |
`;
  const slaRecovery = (): string => `**What counts as a breach:** read the service-level clauses of each affected contract first; the credits and the notice duties differ by contract.

**Recovery**
1. Find the root cause and what restores the service level.
2. Work out the service credits owed under each contract.
3. Put a recovery plan with dates in writing for the client.

${audiences([['Client service owner', 'A call from the account owner', 'What happened and the recovery plan with dates', 'Account team'], ['Client leadership', 'An executive call', 'The impact, the credits and what changes', lead]])}`;
  const aiFirst = (): string => `**If the AI took a wrong action: the first two hours**
1. Pause the automation that took the action, and send that type of action to human review.
2. Find the affected cases from the audit trail: what the AI did, on whose request and with what data.
3. Stop any action that changes a record or reaches a customer until a person approves it.
`;
  const aiCorrection = (): string => `**Correction**
1. Reverse or correct each affected case, and record who approved it.
2. Tell each affected customer what happened and what was fixed.
3. Add the failing cases to your evaluation set before the automation is switched back on.
4. Re-enable in stages, with a person approving each action until the evaluation passes.
`;
  // overlapping playbooks are merged: a sector outage takes the generic severity levels and updates, a delivery failure takes the SLA recovery, a wrong model output takes the correction steps
  const absorbs: Array<{ own: RegExp; generic: RegExp; add: () => string }> = [
    { own: /outage|message_delivery|payment_failure/, generic: /outage|downtime|\bdown\b/, add: () => `${pb ? `**What an outage looks like here:** ${outageText}.\n\n` : ''}${severityTable()}\n${updateCadence()}` },
    { own: /delivery_failure/, generic: /\bsla\b|sla_|service[ _]level/, add: slaRecovery },
    { own: /model_error/, generic: /ai_wrong|wrong[ _]action|ai[ _]error|hallucinat/, add: () => `${aiFirst()}\n${aiCorrection()}` },
  ];
  const ownKey = (c: string): string | undefined => pb?.crises.find((k) => c.toLowerCase().includes(k.key))?.key;
  const absorbed = new Map<string, () => string>();
  for (const a of absorbs) {
    const ownC = crises.find((c) => { const k = ownKey(c); return !!k && a.own.test(k); });
    const genC = crises.find((c) => !ownKey(c) && a.generic.test(c.toLowerCase()));
    if (ownC && genC) { crises = crises.filter((c) => c !== genC); absorbed.set(ownKey(ownC)!, a.add); }
  }

  const playbook = (crisis: string, wasTyped: boolean): string => {
    const lower = crisis.toLowerCase();
    const name = crisis.replace(/_/g, ' ');
    const t = stems(crisis);
    // a crisis of the sector's own (by its key, or by its words when the text names no known kind of crisis), used once
    const knownKind = /vulnerab|data[ _]exposure|customer_data|\bsla\b|sla_|service[ _]level|regulat|fraud|ai_wrong|wrong[ _]action|ai[ _]error|hallucinat|breach|security|hack|exposure|outage|downtime|\bdown\b|(^|[^a-z])pr([^a-z]|$)|reputation|media|social|executive|departure|fired|resign|competitor|attack|market/.test(lower);
    const byKey = pb ? pb.crises.find((c) => lower.includes(c.key) || lower.includes(c.key.replace(/_/g, ' '))) : undefined;
    const byWords = pb && !knownKind && t.length > 0 ? pb.crises.find((c) => t.some((st) => stems(`${c.title} ${c.what}`).includes(st))) : undefined;
    const found = byKey ?? byWords;
    const own = found && !usedOwn.has(found.key) ? found : undefined;
    if (own) {
      usedOwn.add(own.key);
      const label = !wasTyped || own.title.toLowerCase() === name.toLowerCase() ? own.title : `${own.title}: ${name}`;
      return `### ${label}

**What it means here:** ${own.what}.${/outage|sync|dispatch|network|delivery|posting|billing|recognition|payment|tracking|transaction/.test(own.key) ? measureOnce() : ''}

**First hour**
1. Name the owner: ${lead} as incident commander, with ${team.core[0]}.
${own.first.map((x, i) => `${i + 2}. ${x}.`).join('\n')}

${audiences(own.tell.map((x) => [x.who, x.how, x.focus, acct] as [string, string, string, string]))}${absorbed.has(own.key) ? `\n${absorbed.get(own.key)!()}` : ''}`;
    }
    if (/vulnerab/.test(lower)) return `### ${heading('Security vulnerability', name)}

**What it means here:** a flaw in ${N === 'your company' ? 'your product or tooling' : `the product or tooling of ${N}`} that someone outside has found, or that you have found, and that has not yet been used against a customer, as far as you know.

**First four hours**
1. Confirm it and rate it by real exposure (who can reach it and what it gives access to), not by label alone.
2. Search the logs for signs that it was already used; if it was, move to the data breach steps.
3. Decide the stop-gap (a feature switch, a rule, an access change or a patch) and who approves it.
4. Name the owner: ${lead} as sponsor, with ${techLead} as technical owner.

**Fix and advisory**
1. Fix, test and release; keep the rating in the advisory the same as in your internal record.
2. Write the advisory: what is affected, what is fixed, how a customer checks, and what they do.
3. ${notice('notice of a vulnerability or a fix')}.

${audiences([['Reporter, if a researcher found it', 'Direct reply', 'Receipt, one owner, the timing of the fix', 'Security lead'], ['Affected customers', enterprise ? 'A call from the account owner, then the advisory' : 'Email and the advisory', 'What is affected, the fix, how to check', acct]])}`;
    if (/data[ _]exposure|customer_data/.test(lower)) return `### ${heading('Customer data exposure', name)}

${pb ? `**What could be exposed here:** ${pb.breach}.\n\n` : ''}**First four hours**
1. Close the access: the open storage, link, permission or report that exposed the data.
2. Preserve the access logs before any clean-up, so you can say who looked.
3. Size it: which customers, which fields, which period, and whether anyone outside looked.
4. Name the owner: ${lead} with ${team.core.find((m) => /CISO|security|Legal/i.test(m)) ?? team.core[0]}.

${audiences([['Affected customers', toCustomers, 'What was exposed, for how long, what you have done, what they should do', acct], ['Regulators', `Per the duty that applies${compItems.length ? ` (you listed ${comp})` : ''}`, 'A notification approved by counsel', legalLead]])}`;
    if (/\bsla\b|sla_|service[ _]level/.test(lower)) return `### ${heading('SLA breach', name)}

**First four hours**
1. Confirm the breach: which contracts, which clause, which period.
2. Name the incident owner: ${lead} as sponsor and the delivery head as owner.
3. Tell the account owner first, so that no client hears of it from a report before they hear it from a person.
4. Start the incident log: facts, times and decisions.

${slaRecovery()}${measureText && !measureShown ? `\nPut the measures that are in your contracts on the recovery plan.${measureOnce()}\n` : ''}`;
    if (/regulat/.test(lower)) return `### ${heading('Regulatory action', name)}

**Compliance items you listed:** ${comp || 'none, so the steps refer to "each requirement you have"'}.

**First day**
1. Log the notice: who received it, when, and what it asks for.
2. Legal counsel owns the response, with ${lead} as sponsor.
3. Preserve records: stop routine deletion of anything the notice may cover.
4. One channel to the authority: one named person, no side conversations.
5. ${compItems.length ? `Map the notice to each item you listed (${comp}): which requirement it touches and which control or report answers it.` : 'Map the notice to each requirement you have: which control or report answers it.'}

| Phase | When | What happens |
|-------|------|--------------|
| Acknowledge | As the notice requires | Confirm receipt through counsel |
| Facts | The first week | Collect facts only, with no speculation |
| Respond | By the date in the notice | A counsel-approved answer with evidence |
| Review | After closure | Fix the control gap and update the register |
`;
    if (/fraud/.test(lower)) return `### ${heading('Fraud incident', name)}

**First four hours**
1. Contain: block the affected credentials, accounts or instruments, and hold payouts that are under review.
2. Preserve evidence: logs and transaction records, before any clean-up.
3. Size the exposure: which customers, which amounts, which period.
4. Name the owner: ${lead} as incident commander, with the security lead.

${audiences([['Affected customers', enterprise ? 'A call from the account owner' : 'Email', 'What happened, what is held and what they should do', acct], ['Banking and payment partners', 'Formal notice under your agreements', 'The facts and the actions taken', legalLead], ['Regulators', `Per the duty that applies${compItems.length ? ` (you listed ${comp})` : ''}`, 'A notification approved by counsel', legalLead]])}`;
    if (/ai_wrong|wrong[ _]action|ai[ _]error|hallucinat/.test(lower)) return `### ${heading('AI wrong action', name)}

**First two hours**
1. Pause the automation that took the action, and send that type of action to human review.
2. Find the affected cases from the audit trail: what the AI did, on whose request and with what data.
3. Stop any action that changes a record or reaches a customer until a person approves it.
4. Name the owner: ${lead} with the data or AI lead.

${aiCorrection()}`;
    if (/breach|security|hack|exposure/.test(lower)) {
      if (securityDone) return `### ${heading('Security incident', name)}\n\nFollow the steps of "${securityDone}" above, and add the audiences and facts that are specific to this one.\n`;
      securityDone = name;
      return `### ${heading('Security incident', name)}

${pb ? `**What could be exposed here:** ${pb.breach}.\n\n` : ''}**How to rate it**

| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Data exposed | Personal or financial data, or credentials | Business data | No customer data |
| Customers affected | Many, or a large account | Some | A few |
| Attack | Still going | Unknown | Contained |

**First four hours**
1. Activate the response team: ${lead} as incident commander.
2. Contain the threat: isolate the affected systems and revoke compromised credentials.
3. Preserve evidence: take forensic images before any repair.
4. Start the incident log: timeline, actions and decisions.
5. Keep communication internal until the facts are checked.

**Hours four to twenty-four**
1. Establish the scope: what data, how many customers, for how long.
2. Find the attack vector and close it.
3. Bring in forensics, internal or external.
4. ${notice('notification')}.
5. Draft the customer message and hold it until counsel has approved it.

${audiences([['Regulators', 'A formal filing', 'The notification counsel has approved', legalLead], [enterprise ? 'Enterprise accounts' : 'Customers', enterprise ? 'A call from the account owner, then a written note' : 'Email', 'What happened, what you are doing, what they should do', acct], ['Media, if needed', 'A short statement', 'The facts only', 'Communications lead']])}`;
    }
    if (/outage|downtime|\bdown\b/.test(lower)) {
      return `### ${heading('Service outage', name)}

${pb ? `**What it looks like here:** ${outageText}.\n\n` : ''}${severityTable()}
**First fifteen minutes**
1. Acknowledge on the status page, or to your customers' service owners: "Investigating reports of a problem with the service of ${N}".
2. Assemble the incident room: ${kindModel === 'connectivity' ? 'network operations, field engineering and account owners' : kindModel === 'services' ? 'delivery, support and account owners' : 'engineering, support and account owners'}.
3. Start the diagnosis and name the owner of the fix.
4. Brief the support and account teams, so they are ready for the volume.
${measureText && !measureShown ? `\n${measureOnce().trim()}\n` : ''}
${updateCadence()}`;
    }
    if (/(^|[^a-z])pr([^a-z]|$)/.test(lower) || /reputation|media|social/.test(lower)) return `### ${heading('PR or reputation incident', name)}

**How to rate it**

| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Media coverage | National or major trade press | Trade or industry | Social only |
| Accuracy | The claims are true | Partly true | Misinformation |
| Spread | Trending | Spreading | Contained |

**First two hours**
1. Assess it: what is being said, by whom, and how far it has spread.
2. Pause scheduled content, so that nothing tone-deaf goes out.
3. Brief the response team and agree the facts and the stance.
4. Draft a holding statement and have counsel read it.
5. List the people to tell before they read it: investors, the board and partners.

| If it is | Respond with |
|----------|--------------|
| A factual error about you | A public correction with evidence |
| Fair criticism | Acknowledge it and explain what you are changing |
| Employee misconduct | Investigate first, then make a statement |
| A competitor's attack | Usually leave it, unless there is a legal issue |
| A customer complaint that has spread | Personal outreach and a public acknowledgment |
`;
    if (/executive|departure|fired|resign/.test(lower)) return `### ${heading('Executive departure', name)}

| Kind | Approach | Preparation |
|------|----------|-------------|
| Planned | A controlled announcement, with a successor named | Weeks |
| Sudden resignation | A quick succession plan and steady messages | Days |
| For cause | Legal review, minimal detail, forward-looking | The same day |

**First actions**
1. Access: revoke system access at once if the departure is unplanned or for cause.
2. Tell employees first, from leadership, before the media can.
3. Prepare the external message for customers, investors and partners.
4. Name the interim leader and the chain of command.
5. ${enterprise ? 'Call your largest accounts yourself.' : 'Prepare a customer FAQ.'}
`;
    if (/competitor|attack|market/.test(lower)) return `### ${heading('Competitive threat', name)}

| Threat | Response | When |
|--------|----------|------|
| A campaign of doubt about you | Monitor, and answer selectively | Ongoing |
| A competitor approaching your customers | Proactive outreach to the accounts at risk | At once |
| A major competitor launch | An update of your positioning | Within weeks |
| A price war | A strategic decision by the leadership | Within a week |

**If the threat is a campaign of doubt:** record the claims being made, prepare factual evidence, arm sales with it, and answer in public only when a claim is provably false.

**If it is approaching your customers:** list the accounts at risk, call them from the top, and keep a win-back plan for the deals you lose.
`;
    // a crisis the user described in their own words
    return `### ${heading('Crisis', name)}

**In your words:** ${quoted(crisis)}

**First thirty minutes**
1. What happened? Facts only, no speculation.
2. Who is affected: customers, employees or partners?
3. Is it still going on, or contained?
4. What are the legal and compliance consequences?${compItems.length ? ` Start with the items you listed: ${comp}.` : ''}
5. What is the risk to your reputation?

**Who leads:** ${lead} as incident commander, with the core team; the extended team joins as needed (see Who runs the response).

| Phase | When | What happens |
|-------|------|--------------|
| Acknowledge | Within two hours | An internal brief and a holding statement ready |
| Respond | Two to twenty-four hours | Messages to each affected group |
| Resolve | One to three days | Full resolution or a clear plan with dates |
| Review | One to two weeks | A review of what happened and what changes |
`;
  };

  const out: string[] = [];
  out.push(`# Crisis response plan: ${N}`);
  out.push('');
  out.push(readLine(ctx, model, true));
  out.push('');
  out.push('## The plan in brief');
  const industryName = readableChoice(args.industry);
  const brief: string[] = [];
  brief.push(`${N === 'your company' ? 'This plan is for your company' : `This plan is for ${N}`}, ${aAn(industryName)} ${industryName} company with ${readableChoice(base)} customers, ${readableChoice(sensitivity)} data sensitivity and a ${readableChoice(companySize)} team${args.company_size ? '' : ' (assumed)'}.`);
  if (prod.desc) brief.push(`You describe the company as ${quoted(prod.desc)}.`);
  brief.push(typed.length
    ? `It covers the ${crises.length} ${plural(crises.length, 'crisis', 'crises')} you named: ${andList(crises.map((c) => quoted(c.replace(/_/g, ' '))))}.`
    : `You named no crises, so it covers a default set for ${industryName}, not ranked by likelihood: ${andList(crises.map((c) => c.replace(/_/g, ' ').replace(/\bsla\b/gi, 'SLA').replace(/\bpr\b/gi, 'PR').replace(/\bai\b/gi, 'AI')))}.`);
  if (compItems.length) brief.push(`The compliance items you listed (${comp}) are named in the steps that need them.`);
  brief.push('Every time in this plan (minutes, hours, days) is an example to replace with your own.');
  out.push(brief.join(' '));
  out.push('');
  out.push('## Who runs the response');
  out.push('');
  out.push(`The incident commander is the ${lead}. The core team is always activated: ${andList(team.core)}. The extended team is brought in as needed: ${andList(team.extended)}.`);
  out.push('');
  out.push(`The plan names roles, not people, because no names were given: before a crisis, write down a person, a deputy, a phone number and an email for each role, and keep the list where the team can reach it when systems are down. Measure every incident by time to detect, time to restore, customers affected and messages sent.${compItems.length ? ` Counsel confirms which of ${comp} apply to each incident.` : ''} In every crisis, tell employees the facts and what not to say outside, before the media can.`);
  out.push('');
  if (ctx.v && sectorVocab) { out.push(`In ${ctx.v.name} customers work with ${andList(ctx.v.vocabulary.slice(0, 6))}: use these words in customer messages, and say which of them an incident touches.`); out.push(''); }
  out.push('## Playbooks');
  out.push('');
  for (const c of crises) out.push(playbook(c, typed.length > 0));
  out.push('## Rules for every message');
  out.push('');
  out.push('Be fast with the first facts and honest about what you do not yet know. Acknowledge the impact before you explain it. Be specific, because vague statements erode trust. Use one spokesperson and one set of facts.');

  const missing: Array<[string, string]> = [];
  if (!typed.length) missing.push(['the crises you have seen or fear, in the potential_crises input', 'the playbooks, which are now a default set for the sector']);
  if (!compItems.length) missing.push(['the compliance items that apply to you, in the compliance_requirements input', 'the notification steps, which now say "each requirement you have"']);
  if (!prod.desc) missing.push(['what the company sells, in the company input, as the name followed by a short description', `which crises and which words are used, and who is on the team`]);
  if (!args.company_size) missing.push(['the company size, in the company_size input; the plan assumes scale-up (50 to 200)', 'the response team']);
  if (!args.business_model) missing.push(['the business model, in the business_model input', 'the severity levels and the words used for credits and service levels']);
  out.push(sharpenBlock(missing));
  return dropRepeatedLines(out.join('\n')).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
