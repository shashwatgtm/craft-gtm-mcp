// Run 42B (addendum 8), the one place that decides a sub industry. A sector entry in src/verticals.ts holds lines for every company in the
// sector; a sub industry (a SUBTYPES entry, the decision AI lines of the AI native entry, the developer tool lines of the software entry)
// holds lines for one kind of company. A sub industry is returned ONLY when the seller's own category or product description (never the
// deal text, the job titles or the buyer's industry) holds its name or at least two of its own keywords; otherwise null, and every caller
// uses the sector's general notes (GENERAL_NOTES), or neutral B2B wording for a line with no general form.
// your_sector fixes the sector, never the sub industry. No figure, statistic or named company (B82).
import { SUBTYPES, VERTICALS, AI_SUPPORT_PROFILE, profileFor, type SubType, type Vertical, type VerticalId } from './verticals.js';
import { DECISION_AI_WORDS, REGIONAL_SHIPPING_WORDS, SHIPPING_GENERAL_NOTES, AI_GENERAL_NOTES, SOFTWARE_GENERAL_NOTES } from './sector-playbooks.js';

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameIn = (name: string, text: string): boolean => new RegExp('\\b' + esc(name) + '\\b', 'i').test(text);
function hitsOf(re: RegExp, text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(new RegExp(re.source, re.flags.replace(/[gy]/g, '') + 'g'))) found.add(m[0].toLowerCase().replace(/\s+/g, ' '));
  return [...found];
}
const distinctHits = (re: RegExp, text: string): number => hitsOf(re, text).length;
// A lone keyword that is a loose phrase of everyday work ("meeting scheduling", "note taking", "wiki" are used by many kinds of product) needs a second keyword or the name.
const LOOSE = /^(?:meeting scheduling|scheduling links?|note-?taking|team messaging|document collaboration|team workspaces?|connected workspaces?|wikis?)$/;
const firmHit = (re: RegExp, text: string): boolean => hitsOf(re, text).some((h) => /\s/.test(h) && !LOOSE.test(h));
// The entries of the sector's own file that hold lines for one kind of company, though the sector's name is the entry's: they are sub industries too.
const SECTOR_KINDS: Partial<Record<VerticalId, { id: string; name: string; words: RegExp; notes: Partial<Vertical> }>> = {
  'ai-native': { id: 'decision-ai', name: 'AI that decides cases', words: DECISION_AI_WORDS, notes: {} },
  software: { id: 'developer-tools', name: 'developer tools', words: VERTICALS.find((x) => x.id === 'software')!.match, notes: {} },
};
/** The sub industry the seller's own words name, or null. `sellerTexts` are the seller's own words only. Returns a SubType; for the entries
 * that sit inside a sector's own lines (decision AI, developer tools) a SubType with empty notes, id 'decision-ai' or 'developer-tools'. */
export function subIndustryFor(sector: VerticalId | null | undefined, sellerTexts: unknown[], opts: { direct?: boolean } = {}): SubType | null {
  if (!sector) return null;
  const text = sellerTexts.filter((x): x is string => typeof x === 'string').join(' \n ');
  if (!text.trim()) return null;
  // The kind is read from the seller's words only (the reader in src/verticals.ts, which also settles ties between kinds); it stands when the seller's text holds its
  // name, two of its keywords, or one keyword that is not a loose phrase of everyday work.
  const base = VERTICALS.find((x) => x.id === sector);
  // direct: the plan checker asks which kind of AI the plan's own lines name, even when support words also stand there (the support profile is a use case, not a kind)
  const direct = opts.direct ? SUBTYPES.find((x) => x.vertical === sector && hitsOf(x.match, text).some((h) => !LOOSE.test(h)))?.id : undefined;
  const readId = direct ?? (base ? profileFor(base, null, { seller: sellerTexts.filter((x): x is string => typeof x === 'string') })?.subtype : undefined);
  const st = readId ? SUBTYPES.find((x) => x.id === readId && x.vertical === sector) : undefined;
  if (st) { const hits = hitsOf(st.match, text); return hits.length !== 1 || nameIn(st.name, text) || !LOOSE.test(hits[0]) ? st : null; }
  if (SUBTYPES.some((x) => x.vertical === sector && nameIn(x.name, text))) { const named = SUBTYPES.filter((x) => x.vertical === sector && nameIn(x.name, text)); if (named.length === 1) return named[0]; }
  const kind = SECTOR_KINDS[sector];
  if (kind && (distinctHits(kind.words, text) >= 2 || nameIn(kind.name, text))) return { id: kind.id, vertical: sector, name: kind.name, match: kind.words, notes: {} as SubType['notes'] };
  return null;
}
/** Sector notes that hold for every company in the sector, for a sector whose entry also holds kind specific lines. */
export const GENERAL_NOTES: Partial<Record<VerticalId, Partial<Vertical>>> = { 'ai-native': AI_GENERAL_NOTES, software: SOFTWARE_GENERAL_NOTES };

/** The sector entry (or a profile of it) as the seller's own words allow: the sub industry's notes only for a named sub industry, else the
 * sector's general notes. Business model profiles (billing, investment management, AI support) are chosen by their own seller word rules and pass through. */
export function applySubIndustry(v: Vertical | null, sellerTexts: unknown[]): Vertical | null {
  if (!v) return v;
  if (/billing|investment management/i.test(v.name) || (v.id === 'ai-native' && v.committee === AI_SUPPORT_PROFILE.committee)) return v;
  const base = VERTICALS.find((x) => x.id === v.id);
  if (!base) return v;
  const st = subIndustryFor(v.id, sellerTexts);
  if (st && SUBTYPES.some((x) => x.id === st.id)) {
    let out: Vertical = v.subtype === st.id ? v : { ...base, ...st.notes, name: `${base.name}, ${st.name}`, subtype: st.id } as Vertical;
    if (st.id === 'seller-shipping' && !REGIONAL_SHIPPING_WORDS.test(sellerTexts.filter((x): x is string => typeof x === 'string').join('  '))) out = { ...out, ...SHIPPING_GENERAL_NOTES } as Vertical;
    return out;
  }
  if (st) return base;   // decision AI or developer tools named: the entry's own lines
  const general = GENERAL_NOTES[v.id];
  return general ? ({ ...base, ...general, generalOnly: true } as Vertical) : base;
}
