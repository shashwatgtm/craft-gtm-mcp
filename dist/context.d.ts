import { BUSINESS_MODELS, VERTICALS, type Vertical, type VerticalId, type BusinessModel, type ReaderInput } from './verticals.js';
export { BUSINESS_MODELS, VERTICALS };
export type { Vertical, BusinessModel, ReaderInput };
/** The choices of the optional business_model input (the same words in every tool). */
export declare const MODEL_CHOICES: string[];
/** Sector choices that name one of the owner's verticals. */
export declare const SECTOR_CHOICES: Record<string, VerticalId>;
/**
 * Run 42B (addendum 9): a typed phrase that only looks like a comma list is one item. "design, review and handoff in one place" is one phrase: every piece
 * starts in lower case and the last piece is "<word> and <word> <preposition> ...", so the pieces are not separate items.
 */
export declare function isOnePhrase(pieces: string[]): boolean;
export declare function splitItems(s: unknown): string[];
/** Text typed by the user, quoted when it sits inside one of the tool's own sentences, so a clause never breaks the grammar. */
export declare function q(s: string): string;
export interface Context {
    v: Vertical | null;
    model: BusinessModel | null;
    how: 'input' | 'hint' | 'read' | 'sector' | 'unknown';
    sector: string;
    line: string;
    buyerV: Vertical | null;
}
export declare function statedCharge(text: string): BusinessModel | null;
export declare function readContext(opts: {
    model?: unknown;
    hintModel?: BusinessModel | null;
    vertical?: string | null;
    sector?: string | null;
}, rawInput: ReaderInput): Context;
/** Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82). */
export declare function sectorNotes(v: Vertical | null, what?: 'committee' | 'metrics' | 'objections' | 'all'): string;
/** The answer pattern for one objection or blocker typed by the user: the sector's pattern when it matches, else a pattern by kind. */
export declare function answerFor(text: string, v: Vertical | null): string;
/** Names the inputs a tool read but could not use, with the reason, so no supplied input is dropped silently. */
export declare function notUsedNote(items: Array<[string, string]>): string;
/** A short plain-English list: "a, b and c". */
export declare function andList(list: string[]): string;
/** The short name at the start of a product description ("Shelfwalk, a field sales app" gives "Shelfwalk"), or null when the text starts with a long phrase. */
export declare function shortName(text: string | undefined): string | null;
/**
 * A user text placed in a heading, a table or a repeated sentence (ledger B15-L1): capped at a word boundary, so a long pasted text
 * never fills a heading. The full text is printed once elsewhere in the answer.
 */
export declare function capEcho(text: string, max?: number): {
    short: string;
    capped: boolean;
};
/** A comma list that keeps a comma inside brackets or inside a number: "Competitor A (a global suite, strong on reports), Competitor B". New lines also separate items; semicolons do unless `semicolons` is false. */
export declare function splitTopLevel(text: unknown, semicolons?: boolean): string[];
/**
 * A list typed as one sentence with commas (strengths, objections, goals): items separated by new lines or semicolons are kept as typed.
 * In a comma run, a piece that opens with a joining word (which, with, and, or, but, so, that, where, from, because, including, plus),
 * a piece made only of names or acronyms ("APAC and ANZ"), and a piece that continues a list of acronyms
 * ("FMS or TMS in weeks" after "WMS") are joined back onto the piece before them, so no item starts or ends mid-phrase. A first piece
 * of one or two words is joined forward.
 */
export declare function splitPhrases(text: unknown): string[];
/** A company name without trailing corporate words (Software, Technologies, Systems, Inc, Ltd ...): "Brightfield Software" is read as "Brightfield", so the word Software does not set a business model. */
export declare function cleanCompanyName(name: string | undefined): string;
/** A user text in double quotes, capped at a word boundary; a cut ends with "..." inside the quotes (q() would strip a final dot). */
export declare function qc(text: string, max?: number): string;
/** The first letter lower case, unless the text opens with an acronym ("SLA and cost outcomes" stays, "A before and after" becomes "a before and after"). */
export declare function lcFirst(t: string): string;
//# sourceMappingURL=context.d.ts.map