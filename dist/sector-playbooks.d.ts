import { type BusinessModel, type VerticalId } from './verticals.js';
export interface PartnerKinds {
    refer: string[];
    resell: string[];
    integrate: string[];
    implement: string[];
}
export interface Playbook {
    /** What buyers in this sector are usually trying to fix (to confirm in discovery, never presented as a fact about one buyer). */
    pains: string[];
    /** The one next step a buyer in this sector is asked to take after a first conversation. */
    cta: string;
    /** Tasks a launch in this sector needs on top of the generic plan, in launch order. */
    launchTasks: string[];
    /** Channels that reach this sector's buyers (used when the user names none). */
    channels: string[];
    /** What "adoption" means for a launch in this sector, and where it is read. */
    adoption: {
        measure: string;
        source: string;
    };
    /** Who can refer, resell, integrate with or implement for a seller in this sector (kinds of company, never names). */
    partners: PartnerKinds;
    /** Why a seller in this sector asks for each kind of partner. */
    partnerWhy: string;
    /** Deeper interview questions for this sector (in addition to the ones in verticals.ts). */
    deepQuestions: string[];
    /** The crises that matter most here, as short plain titles, beyond the generic set. */
    crises: Array<{
        key: string;
        title: string;
        what: string;
        first: string[];
        tell: Array<{
            who: string;
            how: string;
            focus: string;
        }>;
    }>;
    /** How an outage and a data breach look in this sector (one sentence each). */
    outage: string;
    breach: string;
    /** Reasons customers leave, sector specific (added to the model's list). */
    churnReasons: Array<{
        reason: string;
        signal: string;
        action: string;
    }>;
    /** A sentence about renewal in this sector. */
    renewal: string;
    /** Checks before a launch goes out. */
    checklist: string[];
}
export declare const PLAYBOOKS: Record<VerticalId, Playbook>;
/** Words for the same offer by business model (used where a tool would otherwise say "customer cancels" or "free trial"). */
export declare const MODEL_LANGUAGE: Record<BusinessModel, {
    leave: string;
    engagement: string;
    pilot: string;
    buyerNoun: string;
}>;
export declare function segmentNotes(segment: string): {
    kind: string;
    review: string;
    partners: string;
    channels?: string[];
} | null;
/** Every kind of customer segment a text names (a partner goal that lists the segments it aims at). */
export declare function segmentKinds(text: string): Array<{
    kind: string;
    review: string;
    partners: string;
    channels?: string[];
}>;
/** What a seller on this business model measures after the sale (names only, no figures). Used where the sector file's measures belong to another kind of business. */
export declare const MODEL_MEASURES: Partial<Record<BusinessModel, string[]>>;
import type { SectorNotes } from './verticals.js';
export declare const BILLING_NOTES: SectorNotes;
export declare const BILLING_PLAYBOOK: Playbook;
export declare const INVESTMENT_PLAYBOOK: Playbook;
/** Run 21b step 2 (stock text): lines written for one kind of company. The entries of PLAYBOOKS above hold only lines true for every company in
 * the vertical; the lines of one kind sit here, under the sub-type id of src/verticals.ts, and replace the neutral field when the seller's own words
 * name exactly that sub-type. Only the fields below can be replaced (run 21b late task: the launch lines pains, cta, launchTasks, channels, adoption and checklist
 * were moved here too, so launch_commander prints them only for the kind they were written for). No figure, statistic or named company (B82). */
export type PlaybookOverlay = Partial<Pick<Playbook, 'crises' | 'outage' | 'breach' | 'churnReasons' | 'renewal' | 'deepQuestions' | 'partners' | 'partnerWhy' | 'pains' | 'cta' | 'launchTasks' | 'channels' | 'adoption' | 'checklist'>>;
export declare const SUBTYPE_PLAYBOOKS: Record<string, PlaybookOverlay>;
export declare const DECISION_AI_WORDS: RegExp;
export declare const AI_GENERAL_NOTES: SectorNotes;
export declare function playbookFor(v: {
    id: VerticalId;
    name: string;
    subtype?: string;
    generalOnly?: boolean;
}): Playbook;
/** One line for a tool that used the neutral entry of a vertical (the seller's words named no kind of company): the lines fit any company in the
 * vertical, and the kinds that have lines of their own are named, with the input that gets them. Empty when a sub-type or a profile was read, or
 * when the vertical has no kind with lines of its own; otherwise a paragraph that starts with a blank line, to be placed after the sector line. `who` is the company or product as typed (cut short), `field` the input to fill. */
export declare const LAUNCH_FIELDS: Array<keyof PlaybookOverlay>;
export declare function kindsNote(v: {
    id: VerticalId;
    name: string;
    subtype?: string;
} | null | undefined, who: string, field: string, uses?: Array<keyof PlaybookOverlay>): string;
export declare const REGIONAL_SHIPPING_WORDS: RegExp;
export declare const SHIPPING_GENERAL_NOTES: SectorNotes;
export declare const SOFTWARE_GENERAL_NOTES: SectorNotes;
//# sourceMappingURL=sector-playbooks.d.ts.map