/** A typed phrase without its trailing full stop, comma, colon or semicolon and with single spaces. */
export declare const stripEnd: (t: string) => string;
/** A typed phrase as a sentence: first letter in capitals, one full stop at the end (a question or exclamation mark stays). */
export declare function sentence(t: string): string;
/** The first letter in lower case, unless the text opens with an acronym or a name written with inner capitals ("SLA", "iOS", "SD-WAN"). */
export declare function lc(t: string): string;
/** A list in one sentence: "a, b and c". */
export declare function listAnd(list: string[]): string;
/** The text in full when it fits; otherwise cut at the last clause break (comma, semicolon, colon, dash or opening bracket) that leaves at least half of it. Never cuts inside a clause when no break exists. */
export declare function clauseCut(text: string, max: number): string;
/** The name of a seller's product and what is left of its description. A plain description with no clear name has no name: the answers say "your solution" or use the description (never its first word). */
export interface ProductLabel {
    name: string | null;
    rest: string;
    whole: string;
}
export declare function productLabel(product: string, company?: string): ProductLabel;
/** The closing block: what was not given, each with what it would change. One block, at the end, never a placeholder inside the text. */
export declare function closing(items: Array<[string, string]>): string;
/** Final tidy: blank lines collapsed, and a line that repeats an earlier line of 40 characters or more is dropped. */
export declare function finalise(out: string): string;
/** Page claims: a strength that carries a "(page claim)" label keeps it wherever the strength is quoted. */
export declare const isClaim: (t: string) => boolean;
/** A strength that is a popularity or award claim (nothing a buyer can test). */
export declare const POPULARITY: RegExp;
export interface SegmentKinds {
    name: string;
    partners: string;
    buying: string;
    resellers?: string;
    motion?: string;
    risks?: string;
}
/** The partner kinds of every customer segment a partner goal names (each comma piece after "among" is read on its own), and the pieces for which no kinds are known. */
export declare function segmentsOfGoal(goal: string, productText?: string, partnerModel?: string): {
    found: SegmentKinds[];
    unknown: string[];
};
/** Who refers, resells, integrates or implements in general, by partner model (used when the sector is not read from the product). */
export declare const MODEL_KINDS: Record<string, string>;
/** The kinds of partner that the product's own words point to (at most three); a kind read only from a company or product name is marked. */
export declare function productKinds(text: string, names?: string): Array<{
    does: string;
    partners: string;
    fromName: boolean;
}>;
//# sourceMappingURL=rw-gtm.d.ts.map