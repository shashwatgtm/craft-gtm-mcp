import { type SubType, type Vertical, type VerticalId } from './verticals.js';
/** The sub industry the seller's own words name, or null. `sellerTexts` are the seller's own words only. Returns a SubType; for the entries
 * that sit inside a sector's own lines (decision AI, developer tools) a SubType with empty notes, id 'decision-ai' or 'developer-tools'. */
export declare function subIndustryFor(sector: VerticalId | null | undefined, sellerTexts: unknown[], opts?: {
    direct?: boolean;
}): SubType | null;
/** Sector notes that hold for every company in the sector, for a sector whose entry also holds kind specific lines. */
export declare const GENERAL_NOTES: Partial<Record<VerticalId, Partial<Vertical>>>;
/** The sector entry (or a profile of it) as the seller's own words allow: the sub industry's notes only for a named sub industry, else the
 * sector's general notes. Business model profiles (billing, investment management, AI support) are chosen by their own seller word rules and pass through. */
export declare function applySubIndustry(v: Vertical | null, sellerTexts: unknown[]): Vertical | null;
//# sourceMappingURL=sub-industry.d.ts.map