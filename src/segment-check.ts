// Segment and Seat Cut Check (guide 29 as one tool), first draft, 11 Nov 2026.
// Question it answers: "Which segment should we back, and is our pricing safe if AI cuts seats?"
// The value is exact sums on the server: retention and payback per segment on one band set, seller capacity
// (deals per seller after ramp and cycle), and the seat cut renewal model. Nothing here is a benchmark and nothing is
// copied from the guide: every figure is computed from the inputs, and a figure whose input is absent prints as Missing.
// It never uses the date or the network, so the same inputs always give the same answer.
// Motion (EPIC audit, GTM Alpha) and size (TAM, SAM and SOM calculator, ICP Intelligence) are other connectors' rules.
// They are not duplicated here: the tool prints the exact inputs to send to each and carries back the named result
// fields the chat supplies. The retention playbook runs on this server and is called directly.
import { generateRetentionPlaybook } from "./retention-playbook.js";
import { detectVertical } from "./verticals.js";

export interface SegmentInput {
  name: string;
  acv?: number;
  sales_cycle_days?: number;
  accounts?: number;
  deal_source?: string;
  cac?: number;
  logo_retention_percent?: number;
  gross_retention_percent?: number;
  net_retention_percent?: number;
  monthly_logo_churn_percent?: number;
  pricing_unit_in_writing?: string;
  pricing_unit?: "seat" | "usage" | "hybrid";
  seat_share_of_acv_percent?: number;
  what_customers_can_cut?: string;
  icp_match_percent?: number;
  year_one_share_percent?: number;
  win_rate_percent?: number;
  year_one_customer_target?: number;
  seller_ramp_months?: number;
  seller_loaded_cost_per_year?: number;
  ramped_deals_per_seller_per_year?: number;
  monthly_qualified_demand?: number;
  seat_cut_percent?: number;
  arr_share_cutting_percent?: number;
  seats_per_account?: number;
  work_units_per_seat_per_year?: number;
  buyer_cost_per_seat_per_year?: number;
  usage_price_per_unit?: number;
  run_cost_per_unit?: number;
  gross_retention_gate_percent?: number;
  net_retention_gate_percent?: number;
  logo_retention_gate_percent?: number;
  churn_reasons?: string;
  motion_lead?: string;
  motion_score?: number;
  motion_reason?: string;
  sizing_tam?: number;
  sizing_sam?: number;
  sizing_som?: number;
  sizing_year_one_customers?: number;
}

export interface SegmentCheckInput {
  product: string;
  gross_margin_percent?: number;
  tracks_expansion?: boolean;
  business_stage?: string;
  industry?: string;
  segments: SegmentInput[];
  confirmed?: { segment_split?: boolean; win_rate?: boolean; seat_cut?: boolean };
}

export interface SegmentCheckResult {
  text: string;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

export type PricingUnit = "seat" | "usage" | "hybrid" | "unclear";

// ---------- exact sums (exported so the tests can check each one by hand) ----------

/** Payback months on CAC and ARR: CAC over one month of the contract's yearly revenue. The owner's lead measure. */
export function paybackMonths(cac: number, arr: number): number {
  return cac / (arr / 12);
}

/** The same payback on gross profit: CAC over one month of yearly revenue times gross margin. Shown second. */
export function paybackMonthsOnGrossProfit(cac: number, arr: number, marginShare: number): number {
  return cac / ((arr * marginShare) / 12);
}

/** Sum of r^t for t = 0 to years - 1: how many "first years" of revenue a customer gives over the period. */
export function retainedYears(retentionShare: number, years: number): number {
  let sum = 0;
  let power = 1;
  for (let t = 0; t < years; t++) { sum += power; power *= retentionShare; }
  return sum;
}

/** Cumulative gross profit per dollar of CAC by the end of a year, undiscounted, at one flat yearly retention. */
export function grossProfitPerCacDollar(acv: number, marginShare: number, cac: number, retentionShare: number, years: number): number {
  return ((acv * marginShare) / cac) * retainedYears(retentionShare, years);
}

/** The first year (2 to maxYears) in which the other segment strictly leads. Ties do not count. */
export function leadChangeYear(valueA: (years: number) => number, valueB: (years: number) => number, maxYears = 15): { firstLeader: "a" | "b" | "tie"; changeYear: number | null } {
  const lead = (y: number): "a" | "b" | "tie" => { const a = valueA(y), b = valueB(y); return Math.abs(a - b) < 1e-12 ? "tie" : a > b ? "a" : "b"; };
  const firstLeader = lead(1);
  if (firstLeader === "tie") return { firstLeader, changeYear: null };
  for (let y = 2; y <= maxYears; y++) if (lead(y) !== firstLeader && lead(y) !== "tie") return { firstLeader, changeYear: y };
  return { firstLeader, changeYear: null };
}

/** The CAC at which a segment's cumulative gross profit per CAC dollar falls to another figure. */
export function cacWhereLeadIsGone(acv: number, marginShare: number, retentionShare: number, years: number, otherValue: number): number {
  return (acv * marginShare * retainedYears(retentionShare, years)) / otherValue;
}

export interface SellerCapacity {
  cycleMonths: number;
  sellingMonths: number;
  dealsYearOne: number | null;
  acvBooked: number | null;
  paybackOnSellerCostMonths: number | null;
}

/** What one new seller closes in year one after ramp and one sales cycle (guide 01's sum). */
export function sellerCapacity(rampMonths: number, cycleDays: number, rampedDealsPerYear: number | undefined, acv: number | undefined, loadedCost: number | undefined, marginShare: number | undefined): SellerCapacity {
  const cycleMonths = cycleDays / 30;
  const sellingMonths = Math.max(0, 12 - rampMonths - cycleMonths);
  const dealsYearOne = rampedDealsPerYear === undefined ? null : (sellingMonths * rampedDealsPerYear) / 12;
  const acvBooked = dealsYearOne === null || acv === undefined ? null : dealsYearOne * acv;
  const paybackOnSellerCostMonths = dealsYearOne === null || dealsYearOne <= 0 || acv === undefined || loadedCost === undefined || marginShare === undefined || marginShare <= 0
    ? null : loadedCost / dealsYearOne / ((acv * marginShare) / 12);
  return { cycleMonths, sellingMonths, dealsYearOne, acvBooked, paybackOnSellerCostMonths };
}

/** Renewal value of one account after a share of seats is cut. seatShare is the part of the contract billed on seats. */
export function renewalAfterSeatCut(acv: number, seatCutShare: number, seatShare: number): number {
  return acv * (1 - seatShare * seatCutShare);
}

/** Points of gross (and net) retention lost when accounts holding a share of ARR each cut a share of seats. */
export function retentionPointsLost(arrShareCutting: number, seatCutShare: number, seatShare: number): number {
  return arrShareCutting * seatCutShare * seatShare * 100;
}

// ---------- reading the pricing unit from the buyer's own sentence ----------

// People a customer pays for, and units of work or volume a customer pays for. Lists of plain nouns, no company names.
const SEAT_NOUN = "(?:user|agent|licen[cs]e|login|head|employee|rep|analyst|operator|member|person|people|advisor|dispatcher|recruiter|developer|engineer|practitioner|stylist|teacher|seat)s?";
const USAGE_NOUN = "(?:transaction|shipment|api call|call|resolution|contact|interaction|conversation|message|minute|gb|gigabyte|invoice|claim|document|order|delivery|deliverie|alert|event|verification|payment|ticket|outcome|query|querie|token|run|task|parcel|load|booking|sms|session|scan|check|loan|application|device|endpoint|sim|line|connection|trip|consignment|payslip|hire|placement|incident|asset|credit|request|job|visit)s?";
const NOT_WORK = "(?![- ](?:resolution|resolved|completed|conversation|task|run|action|outcome)s?\\b)";
const LEAD = "(?:per|each|every|number of|by the|(?:pay|pays|paid|charge|charges|charged|bill|bills|billed|price|priced|prices|license|licensed)\\s+(?:for|on|by)(?:\\s+the)?)";
const BILLING = /\b(?:pay|pays|paid|charge|charges|charged|bill|bills|billed|billing|price|priced|prices|pricing|fee|fees|licen[cs]e|licen[cs]es|licen[cs]ed|cost|costs|subscription)\b/i;
const SEAT_WORDS = new RegExp("\\b" + LEAD + "[- ](?:named[- ])?" + SEAT_NOUN + "\\b" + NOT_WORK + "|\\b(?:seat|user|headcount)[- ](?:based|pricing|billing|fees?|count)\\b", "i");
const USAGE_WORDS = new RegExp("\\b" + LEAD + "[- ](?:[a-z]+[- ]){0,2}?" + USAGE_NOUN + "\\b|\\b" + USAGE_NOUN + "[- ](?:based|volume)\\b|\\b(?:volume|outcome)[- ]based\\b", "i");
const NEGATORS = /\b(?:not|no|never|neither|nor|unlimited|without|instead of|rather than|no longer|away from|stopped|dropped|ended|removed|scrapped|retired)\b|n't\b/i;

/** A conservative current billing reader. Mentions, questions and future plans are not a pricing contract. */
export function readPricingUnit(sentence: string | undefined): PricingUnit {
  if (typeof sentence !== "string" || !sentence.trim()) return "unclear";
  let plain = sentence.replace(/\\/g, "").replace(/&#39;|&#x27;|&apos;|\u2019/g, "'").replace(/&quot;/g, '"');
  if (/\?|\b(?:whether|unless|not without)\b/i.test(plain)) return "unclear";
  // Preserve an explicit present contract and discard a later plan. Otherwise a future price is unknown.
  plain = plain.replace(/[,;]\s*(?:(?:we are |we're )?(?:moving|switching|planning)|(?:we )?(?:will|may|might|plan to))\b.*$/i, "");
  plain = plain.replace(/\b(?:we )?(?:switched|moved|changed) (?:our pricing )?from .+? to /gi, "We bill on ");
  if (/\b(?:(?:moving|switching|transitioning) from|reverted|reverting)\b/i.test(plain)) return "unclear";
  plain = plain.replace(/\bnot only\b/gi, "");
  const clauses = plain.split(/(?<!\d)[.;:]|[.;:](?!\d)|[,()]|\bbut\b|\bonly\b|\bjust\b|\bhowever\b|\bthough\b|\bwith\b|\band(?=\s+(?:now|we|they|instead|then|it|customers|clients|each|every|bill|charge|price|pay|sell|moved|switched|include|includes|provide|manage|no|not|unlimited)\b)/i);
  let seat = false, usage = false, fixed = false;
  for (const clause of clauses) {
    if (/\b(?:will|would|may|might|could|plan|planning|next year|next quarter|used to|previously|formerly|last year|last quarter)\b/i.test(clause)) continue;
    // A statement denying an entire price, including a denial after its unit, is not evidence for it.
    if (NEGATORS.test(clause) || /\b(?:free|included|waived|not used|not charged)\b/i.test(clause)) continue;
    const bills = BILLING.test(clause);
    const agentIsSoftware = /\b(?:ai|software|autonomous) agents?\b/i.test(clause) && !/\b(?:resolution|resolved|task|action|outcome|conversation)\b/i.test(clause);
    if (!agentIsSoftware && (SEAT_WORDS.test(clause) || (bills && /\b(?:(?:users?|seats?|named|personal|employees?|agents?|developers?|analysts?) licen[cs]es?|(?:bill(?:ing|ed)?|pric(?:ing|ed|e)|charge[sd]?|pay[sd]?) (?:follows? |on |by )?(?:the )?(?:seats?|headcount))\b/i.test(clause)))) seat = true;
    const billingClause = clause.replace(/\busage (?:analytics|reporting|dashboard|management|monitoring)\b/gi, "");
    if (USAGE_WORDS.test(billingClause) || (bills && /\b(?:usage|consumption|consumed|metered|pay as you go|volume of)\b/i.test(billingClause))) usage = true;
    if (bills && /\b(?:platform|base) fee\b|\b(?:fixed|flat) fee (?:plus|and)\b/i.test(clause)) fixed = true;
  }
  if (seat && (usage || fixed)) return "hybrid";
  if (seat) return "seat";
  if (usage) return "usage";
  return "unclear";
}

/** Evidence for subtracting a fresh cut from a reported retention cohort. Unclear wording holds the projection. */
export function readSeatCutBasis(sentence: string | undefined): { additional: boolean; openingArr: boolean; expansionUnchanged: boolean; alreadyIncluded: boolean } {
  const plain = (typeof sentence === "string" ? sentence : "").replace(/\\/g, "").toLowerCase();
  const alreadyIncluded = /\b(?:already|fully) (?:included|reflected|counted) in (?:our |the )?(?:reported|current) retention\b/.test(plain)
    || /\b(?:reported|current) retention (?:already )?includes? (?:these |the )?(?:seat )?cuts?\b/.test(plain);
  // Match complete assertions, not keywords in a question, uncertainty or denial.
  const clauses = plain.split(/[.;]/).filter(c => !/[?]|\b(?:may|might|could|whether|not sure|not unchanged|not fixed|not constant|not outside|not beyond|not on top of|not additional|not incremental|not future|no additional|no incremental|no future|not not included)\b/.test(c));
  return {
    alreadyIncluded,
    additional: !alreadyIncluded && clauses.some(c => /\b(?:additional|incremental|future) (?:seat )?(?:cuts?|reductions?)\b/.test(c) && /\b(?:not included in|not reflected in|outside|on top of|beyond) (?:our |the )?(?:reported|current) retention\b/.test(c)),
    openingArr: clauses.some(c => /\b(?:share of|against|of|based on) (?:the )?(?:opening|beginning|start of period) (?:arr|revenue)\b/.test(c) && !/\b(?:not|never|instead of|rather than)\b/.test(c)),
    expansionUnchanged: clauses.some(c => /\bexpansion(?: revenue| dollars)? (?:stays|is|remains|held|will remain) (?:unchanged|fixed|constant)\b/.test(c) && !/\b(?:not|never)\b/.test(c)),
  };
}

// ---------- formatting (display only; every sum uses full precision) ----------

const money = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
const rate = (n: number): string => `$${Number(n.toPrecision(8)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 16 })}`;
const perDollar = (n: number): string => `$${n.toFixed(2)}`;
const one = (n: number): string => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
const months = (n: number): string => `${(Math.round(n * 10) / 10).toFixed(1)} months`;
const pct = (n: number): string => `${one(n)}%`;
const points = (n: number): string => `${one(n)} ${Math.abs(Math.round(n * 10) / 10) === 1 ? "point" : "points"}`;
const count = (n: number): string => (Math.round(n * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });
const round4 = (n: number | null | undefined): number | null => (n === null || n === undefined || !Number.isFinite(n) ? null : Math.round(n * 10000) / 10000);
const stripDashes = (s: string): string => s.replace(/\s*[\u2014\u2013]\s*/g, ", ");
const miss = (needs: string): string => `Missing: needs ${needs}`;

function given(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function retentionConsistent(s: SegmentInput): boolean {
  const grr = given(s.gross_retention_percent), nrr = given(s.net_retention_percent);
  return grr === undefined || nrr === undefined || nrr >= grr;
}
function text(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

const UNIT_WORDS: Record<PricingUnit, string> = { seat: "seats", usage: "usage", hybrid: "a price with a seat share", unclear: "not clear" };
const YEARS_SHOWN = [1, 3, 5, 7, 10];

function refusal(message: string): SegmentCheckResult {
  return { text: message, structuredContent: {}, isError: true };
}

/** One section of the retention playbook's own answer, found by its heading. Null when the heading is not there. */
function playbookSection(playbook: string, heading: string): string | null {
  const lines = playbook.split("\n");
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break; }
  return lines.slice(start + 1, end).join("\n").trim();
}

interface Worked {
  name: string;
  s: SegmentInput;
  unit: PricingUnit;
  unitSource: "your choice" | "your sentence" | "not given";
  unitConflict: boolean;
  seatShare: number | null;
  payback: number | null;
  paybackOnProfit: number | null;
  perCac: { gross: Record<number, number> | null; net: Record<number, number> | null; yearOne: number | null };
  expansionPoints: number | null;
  missing: string[];
}

export function generateSegmentCheck(input: SegmentCheckInput): SegmentCheckResult {
  const rawSegments = Array.isArray(input?.segments) ? input.segments : [];
  if (rawSegments.length < 1) return refusal("Give at least one segment with its name and numbers. Two or three segments is the usual split.");
  if (rawSegments.length > 4) return refusal(`You gave ${rawSegments.length} segments. This check reads up to 4 on one page. Merge the smallest ones or run it twice.`);

  // ----- input checks that would make a sum wrong (plain refusals, before any sum) -----
  const problems: string[] = [];
  const names = new Set<string>();
  const marginPercent = given(input.gross_margin_percent);
  if (marginPercent !== undefined && (marginPercent < 0 || marginPercent > 100)) problems.push("Gross margin: write it as a percent between 0 and 100, for example 72 for 72%.");
  if (rawSegments.some((s) => !s || typeof s !== "object" || Array.isArray(s))) return refusal("Give each segment as a named set of numbers.");
  rawSegments.forEach((s, i) => {
    const label = text(s?.name) ?? `Segment ${i + 1}`;
    for (const [key, value] of Object.entries(s)) {
      if (typeof value === "number" && !Number.isFinite(value)) problems.push(`${label}: ${key.replace(/_/g, " ")} must be a finite number.`);
    }
    if (!text(s?.name)) problems.push(`Segment ${i + 1} has no name. Name each segment in your own words.`);
    else if (names.has(label.toLowerCase())) problems.push(`Two segments are both called "${label}". Give each segment its own name.`);
    names.add(label.toLowerCase());
    const positive: Array<[keyof SegmentInput, string]> = [["acv", "ACV"], ["seats_per_account", "seats per account"], ["work_units_per_seat_per_year", "work units per seat"]];
    for (const [key, word] of positive) { const v = given(s?.[key]); if (v !== undefined && v <= 0) problems.push(`${label}: ${word} must be more than 0.`); }
    for (const key of ["accounts", "seller_loaded_cost_per_year", "buyer_cost_per_seat_per_year", "sales_cycle_days", "cac", "ramped_deals_per_seller_per_year", "monthly_qualified_demand", "usage_price_per_unit", "year_one_customer_target", "sizing_tam", "sizing_sam", "sizing_som", "sizing_year_one_customers"] as const) {
      const v = given(s[key]);
      if (v !== undefined && v < 0) problems.push(`${label}: ${key.replace(/_/g, " ")} cannot be negative.`);
    }
    const ramp = given(s?.seller_ramp_months);
    if (ramp !== undefined && (ramp < 0 || ramp > 24)) problems.push(`${label}: seller ramp must be between 0 and 24 months.`);
    const runCost = given(s?.run_cost_per_unit);
    if (runCost !== undefined && runCost < 0) problems.push(`${label}: run cost cannot be negative.`);
    const percent = (key: keyof SegmentInput, word: string, max: number, example: string) => {
      const v = given(s?.[key]);
      if (v === undefined) return;
      if (v < 0 || v > max) problems.push(`${label}: write ${word} as a percent between 0 and ${max}, for example ${example}.`);
    };
    percent("logo_retention_percent", "logo retention", 100, "89 for 89%");
    percent("gross_retention_percent", "gross revenue retention", 100, "92 for 92% (it cannot pass 100)");
    percent("net_retention_percent", "net revenue retention", 300, "108 for 108%");
    percent("win_rate_percent", "your win rate", 100, "33 for one win in three");
    percent("seat_cut_percent", "the share of seats customers could cut", 100, "25 for a quarter of seats");
    percent("arr_share_cutting_percent", "the share of revenue in accounts that would cut", 100, "32 for 32%");
    percent("seat_share_of_acv_percent", "the seat share of the contract", 100, "60 for 60%");
    percent("icp_match_percent", "the ICP match", 100, "25 for 25%");
    percent("gross_retention_gate_percent", "the gross retention gate", 100, "90 for 90%");
    percent("net_retention_gate_percent", "the net retention gate", 300, "100 for 100%");
    percent("logo_retention_gate_percent", "the logo retention gate", 100, "85 for 85%");
    if (given(s.win_rate_percent) === 0) problems.push(`${label}: your win rate must be above 0 to plan wins.`);
    const share = given(s?.year_one_share_percent);
    if (share !== undefined && (share < 0 || share > 100)) problems.push(`${label}: write the year one share as a percent between 0 and 100, for example 2 for 2%.`);
    const churn = given(s?.monthly_logo_churn_percent);
    if (churn !== undefined && (churn < 0 || churn > 100)) problems.push(`${label}: write monthly logo churn as a percent between 0 and 100, for example 2.5 for 2.5% a month.`);
  });
  if (marginPercent === undefined && input.gross_margin_percent != null) problems.push("Gross margin must be a finite number.");
  if (problems.length > 0) return refusal(`Segment and Seat Cut Check cannot run yet:\n${problems.map((p) => `- ${p}`).join("\n")}`);

  const margin = marginPercent === undefined ? undefined : marginPercent / 100;
  const confirmed = {
    segment_split: input.confirmed?.segment_split === true,
    win_rate: input.confirmed?.win_rate === true,
    seat_cut: input.confirmed?.seat_cut === true,
  };
  const product = text(input.product) ?? "your product";
  const confirmationNote = "Confirmation is reported by the calling chat. This server cannot verify that a person said yes. The chat must ask the person about each input and leave its confirmation false until they answer. Changing the inputs requires asking again. Percentages are literal: 0.5 means 0.5%, not 50%.";

  // ----- the handoff strings: the one value that passes on is the segment split (ACV and accounts) -----
  const handoffs = rawSegments.map((s) => {
    const name = text(s.name)!;
    return {
      segment: name,
      motion_tool: "epic_audit on GTM Alpha",
      motion_inputs: {
        challenge: `${product}, sold to ${name}`,
        industry: text(input.industry) ?? null,
        business_stage: text(input.business_stage) ?? null,
        acv_usd: given(s.acv) ?? null,
        deal_cycle_days: given(s.sales_cycle_days) ?? null,
        nrr_percent: given(s.net_retention_percent) ?? null,
        tam_accounts: given(s.accounts) ?? null,
        deal_source: text(s.deal_source) ?? null,
      },
      sizing_tool: "tam_sam_som_calculator on ICP Intelligence",
      sizing_inputs: {
        segment_name: name,
        total_potential_companies: given(s.accounts) ?? null,
        average_contract_value: given(s.acv) ?? null,
        icp_percentage: given(s.icp_match_percent) ?? null,
        year1_market_share_target: given(s.year_one_share_percent) ?? null,
      },
    };
  });
  const showInputs = (o: Record<string, unknown>): string => Object.entries(o).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v === null ? "Missing" : typeof v === "number" ? v.toLocaleString("en-US") : `"${v}"`}`).join("; ");

  const splitTable = (): string[] => {
    const rows = ["| Segment | ACV | Sales cycle | Accounts | Deal source | CAC |", "|---|---|---|---|---|---|"];
    for (const s of rawSegments) {
      rows.push(`| ${text(s.name)} | ${given(s.acv) !== undefined ? money(s.acv!) : "Missing"} | ${given(s.sales_cycle_days) !== undefined ? `${count(s.sales_cycle_days!)} days` : "Missing"} | ${given(s.accounts) !== undefined ? count(s.accounts!) : "Missing"} | ${text(s.deal_source) ?? "Missing"} | ${given(s.cac) !== undefined ? money(s.cac!) : "Missing"} |`);
    }
    return rows;
  };

  // ----- pause one: the segment split is confirmed by a person before any sum -----
  if (!confirmed.segment_split) {
    const lines: string[] = [];
    lines.push("# Segment and Seat Cut Check: confirm three things before the sums");
    lines.push("");
    lines.push("No sum has been run. The answer is only as good as the split, so a person confirms it first.");
    lines.push(confirmationNote);
    lines.push("");
    lines.push("## Confirm the segment split");
    lines.push("");
    lines.push(...splitTable());
    lines.push("");
    lines.push("Is this how last year's closed deals really divide: who signed, how they found you, the sales cycle and the contract value? If two rows look alike, they are one segment. If one row hides two kinds of buyer, split it.");
    lines.push("");
    lines.push("## Confirm your own win rate");
    lines.push("");
    for (const s of rawSegments) lines.push(`- ${text(s.name)}: ${given(s.win_rate_percent) !== undefined ? `${pct(s.win_rate_percent!)} of qualified opportunities won. Is that from your own closed deals?` : "Missing. Give the share of qualified opportunities you win, from your own closed deals. An example rate such as one in three is not yours."}`);
    lines.push("");
    lines.push("## Confirm what customers can cut");
    lines.push("");
    for (const s of rawSegments) lines.push(`- ${text(s.name)}: ${text(s.pricing_unit_in_writing) ? `you bill on "${text(s.pricing_unit_in_writing)}"` : "what you bill on is Missing"}; ${text(s.what_customers_can_cut) ? `customers can cut "${text(s.what_customers_can_cut)}"` : "what a customer can cut, and when, is Missing"}; ${given(s.seat_cut_percent) !== undefined ? `seat cut to test: ${pct(s.seat_cut_percent!)}` : "the share of seats to test is Missing"}.`);
    lines.push("");
    lines.push("## First drafts to run meanwhile (the only value passed on is the split)");
    lines.push("");
    for (const h of handoffs) {
      lines.push(`- ${h.segment}, motion: run the EPIC audit on GTM Alpha with ${showInputs(h.motion_inputs)}.`);
      lines.push(`- ${h.segment}, size: run the TAM, SAM and SOM calculator on ICP Intelligence with ${showInputs(h.sizing_inputs)}.`);
    }
    lines.push("");
    lines.push("## What to do next");
    lines.push("");
    lines.push("When the person has confirmed the split, run this check again with the split marked confirmed. Mark the win rate and the seat cut confirmed only when the person has confirmed each one. Anything not confirmed stays out of the sums.");
    return {
      text: stripDashes(lines.join("\n")),
      structuredContent: { tool: "segment_and_seat_cut_check", stage: "waiting_for_confirmation", confirmed, confirmation_evidence: "caller_attestation_only", segments: rawSegments.map((s) => ({ name: text(s.name), acv: given(s.acv) ?? null, sales_cycle_days: given(s.sales_cycle_days) ?? null, accounts: given(s.accounts) ?? null, deal_source: text(s.deal_source) ?? null, cac: given(s.cac) ?? null })), handoffs },
    };
  }

  // ----- the sums, per segment -----
  const worked: Worked[] = rawSegments.map((s) => {
    const name = text(s.name)!;
    const missing: string[] = [];
    const acv = given(s.acv), cac = given(s.cac);
    const logo = given(s.logo_retention_percent), grr = given(s.gross_retention_percent), nrr = given(s.net_retention_percent);
    const read = readPricingUnit(s.pricing_unit_in_writing);
    const chosen = s.pricing_unit === "seat" || s.pricing_unit === "usage" || s.pricing_unit === "hybrid" ? s.pricing_unit : undefined;
    const unit: PricingUnit = chosen ?? read;
    const unitSource = chosen ? "your choice" : text(s.pricing_unit_in_writing) ? "your sentence" : "not given";
    const unitConflict = !!chosen && read !== "unclear" && read !== chosen;
    const seatShare = unit === "seat" ? 1 : unit === "usage" ? 0 : unit === "hybrid" ? (given(s.seat_share_of_acv_percent) !== undefined ? s.seat_share_of_acv_percent! / 100 : null) : null;
    const payback = acv !== undefined && cac !== undefined ? paybackMonths(cac, acv) : null;
    const paybackOnProfit = acv !== undefined && cac !== undefined && margin !== undefined && margin > 0 ? paybackMonthsOnGrossProfit(cac, acv, margin) : null;
    const series = (r: number | undefined): Record<number, number> | null => {
      if (!retentionConsistent(s) || acv === undefined || cac === undefined || cac === 0 || margin === undefined || r === undefined) return null;
      const out: Record<number, number> = {};
      for (let y = 1; y <= 15; y++) out[y] = grossProfitPerCacDollar(acv, margin, cac, r / 100, y);
      return out;
    };
    if (acv === undefined) missing.push("ACV");
    if (cac === undefined) missing.push("CAC");
    if (logo === undefined) missing.push("logo retention");
    if (grr === undefined) missing.push("gross revenue retention");
    if (nrr === undefined) missing.push("net revenue retention");
    if (unit === "unclear") missing.push("the pricing unit in writing (seats or usage)");
    return {
      name, s, unit, unitSource, unitConflict, seatShare, payback, paybackOnProfit,
      perCac: { gross: series(grr), net: series(nrr), yearOne: acv !== undefined && cac !== undefined && cac > 0 && margin !== undefined ? (acv * margin) / cac : null },
      expansionPoints: retentionConsistent(s) && grr !== undefined && nrr !== undefined ? nrr - grr : null,
      missing,
    };
  });
  if (margin === undefined) worked.forEach((w) => w.missing.push("gross margin"));

  const warnings: string[] = [];
  for (const w of worked) {
    const grr = given(w.s.gross_retention_percent), nrr = given(w.s.net_retention_percent);
    if (grr !== undefined && nrr !== undefined && nrr < grr) warnings.push(`${w.name}: net retention (${pct(nrr)}) is below gross retention (${pct(grr)}). Net adds expansion to gross, so it cannot be lower. Check both figures and their period.`);
    if (w.unitConflict) warnings.push(`${w.name}: you chose ${UNIT_WORDS[w.unit]} as the pricing unit, but your sentence reads as ${UNIT_WORDS[readPricingUnit(w.s.pricing_unit_in_writing)]}. Your choice is used. Check it.`);
    if (w.unit === "hybrid" && w.seatShare === null) warnings.push(`${w.name}: the price is a mix of seats and usage, and the share of the contract billed on seats is Missing. The seat cut sums need it.`);
  }

  // ----- compare segments on one band set -----
  const notes: string[] = [];
  const withPayback = worked.filter((w) => w.payback !== null);
  if (withPayback.length >= 2) {
    const sorted = [...withPayback].sort((a, b) => a.payback! - b.payback!);
    if (Math.abs(sorted[0].payback! - sorted[1].payback!) < 1e-9) notes.push(`Payback is level: ${sorted[0].name} and ${sorted[1].name} both earn back CAC in ${months(sorted[0].payback!)}.`);
    else notes.push(`Faster payback: ${sorted[0].name}, ${months(sorted[0].payback!)} against ${sorted.slice(1).map((w) => `${months(w.payback!)} for ${w.name}`).join(" and ")}.`);
  }
  const leadChanges: Array<Record<string, unknown>> = [];
  let cacLine: Record<string, unknown> | null = null;
  const tracksExpansion = input.tracks_expansion === true;
  const laterNotes: string[] = [];
  if (tracksExpansion && worked.length >= 2) {
    for (let i = 0; i < worked.length; i++) for (let j = i + 1; j < worked.length; j++) {
      const a = worked[i], b = worked[j];
      for (const basis of ["net", "gross"] as const) {
        const sa = a.perCac[basis], sb = b.perCac[basis];
        if (!sa || !sb) continue;
        const change = leadChangeYear((y) => sa[y], (y) => sb[y], 15);
        if (change.firstLeader === "tie") continue;
        const first = change.firstLeader === "a" ? a : b, other = change.firstLeader === "a" ? b : a;
        leadChanges.push({ basis, first_leader: first.name, other: other.name, change_year: change.changeYear });
        laterNotes.push(change.changeYear === null
          ? `On ${basis} retention, ${first.name} returns more gross profit per dollar of CAC than ${other.name} in every year to year 15.`
          : `On ${basis} retention, ${first.name} returns more gross profit per dollar of CAC than ${other.name} at year one; ${other.name} first leads at year ${change.changeYear}. Any intervening ties do not count as a lead.`);
      }
    }
    if (worked.length === 2 && worked[0].perCac.gross && worked[1].perCac.gross && margin !== undefined) {
      const [a, b] = worked;
      const leader = a.perCac.gross![5] >= b.perCac.gross![5] ? a : b, other = leader === a ? b : a;
      if (Math.abs(leader.perCac.gross![5] - other.perCac.gross![5]) > 1e-12) {
        const limit = cacWhereLeadIsGone(leader.s.acv!, margin, leader.s.gross_retention_percent! / 100, 5, other.perCac.gross![5]);
        const rise = (limit / leader.s.cac! - 1) * 100;
        cacLine = { leader: leader.name, other: other.name, cac_where_lead_is_gone: round4(limit), rise_percent: round4(rise) };
        laterNotes.push(`${leader.name} leads at year 5 on gross retention only while its CAC stays under ${money(limit)}, which is ${pct(rise)} above today's ${money(leader.s.cac!)}.`);
      }
    }
  }
  for (const w of worked) {
    const nrr = given(w.s.net_retention_percent);
    if (retentionConsistent(w.s) && nrr !== undefined && nrr < 100) notes.push(`${w.name}: net retention is ${pct(nrr)}, under 100%, so this base shrinks without new sales. More spend buys more of what leaves. Fix retention before scaling acquisition here.`);
  }

  // ----- seat cut model (pause three) -----
  const seatCut = worked.map((w) => {
    const s = w.s;
    const acv = given(s.acv), cut = given(s.seat_cut_percent), arrShare = given(s.arr_share_cutting_percent);
    const grr = given(s.gross_retention_percent), nrr = given(s.net_retention_percent), logo = given(s.logo_retention_percent);
    if (!confirmed.seat_cut) return { name: w.name, state: "waiting" as const };
    if (cut === undefined) return { name: w.name, state: "no_cut_given" as const };
    const cutShare = cut / 100;
    const renewalByUnit = acv === undefined ? null : { seat: renewalAfterSeatCut(acv, cutShare, 1), usage: renewalAfterSeatCut(acv, cutShare, 0), own: w.seatShare === null ? null : renewalAfterSeatCut(acv, cutShare, w.seatShare) };
    const basis = readSeatCutBasis(s.what_customers_can_cut);
    const noSeatLoss = w.seatShare === 0 || cut === 0 || arrShare === 0;
    const basisReady = basis.additional && basis.openingArr;
    const proposedLoss = w.seatShare === null || (arrShare === undefined && !noSeatLoss) ? null : noSeatLoss ? 0 : retentionPointsLost(arrShare! / 100, cutShare, w.seatShare);
    const impossible = proposedLoss !== null && ((grr !== undefined && proposedLoss > grr) || (nrr !== undefined && proposedLoss > nrr));
    const lostPoints = !retentionConsistent(s) || impossible || (!noSeatLoss && !basisReady) ? null : proposedLoss;
    const grrAfter = lostPoints === null || grr === undefined ? null : grr - lostPoints;
    const nrrAfter = lostPoints === null || nrr === undefined || (!noSeatLoss && !basis.expansionUnchanged) ? null : nrr - lostPoints;
    const retentionNeeds = !retentionConsistent(s) ? "consistent gross and net retention for the same cohort and period; net cannot be below gross" : impossible ? "a cut consistent with retained revenue; this cut exceeds what remains" : basis.alreadyIncluded ? "an additional cut outside reported retention; these cuts are already counted" : !basis.additional ? "written confirmation that these additional cuts are not included in reported retention" : !basis.openingArr ? "affected revenue as a share of opening ARR, using the retention cohort and period" : "reported retention";
    const gate = (value: number | null | undefined, line: number | undefined): "pass" | "fail" | null => (value === null || value === undefined || line === undefined ? null : value + 1e-9 >= line ? "pass" : "fail");
    const gates = {
      gross_before: gate(retentionConsistent(s) ? grr : null, given(s.gross_retention_gate_percent)), gross_after: gate(grrAfter, given(s.gross_retention_gate_percent)),
      net_before: gate(retentionConsistent(s) ? nrr : null, given(s.net_retention_gate_percent)), net_after: gate(nrrAfter, given(s.net_retention_gate_percent)),
      logo: gate(logo, given(s.logo_retention_gate_percent)),
    };
    // The rate that replaces the seat revenue, when the work each seat did is known.
    const seats = given(s.seats_per_account), units = given(s.work_units_per_seat_per_year);
    const seatsCut = seats === undefined ? null : seats * cutShare;
    const pricePerSeat = acv === undefined || seats === undefined || w.seatShare === null ? null : (acv * w.seatShare) / seats;
    const revenueLost = renewalByUnit === null || renewalByUnit.own === null || acv === undefined ? null : acv - renewalByUnit.own;
    const unitsMoved = seatsCut === null || units === undefined ? null : seatsCut * units;
    const recoverRate = revenueLost === null || unitsMoved === null || unitsMoved <= 0 ? null : revenueLost / unitsMoved;
    const keepProfitRate = recoverRate === null || margin === undefined ? null : recoverRate * margin;
    const buyerCost = given(s.buyer_cost_per_seat_per_year);
    const buyerSaving = seatsCut === null || buyerCost === undefined ? null : seatsCut * buyerCost;
    const savingPerUnit = buyerSaving === null || unitsMoved === null || unitsMoved <= 0 ? null : buyerSaving / unitsMoved;
    const price = given(s.usage_price_per_unit), runCost = given(s.run_cost_per_unit);
    const usageRevenue = price === undefined || unitsMoved === null ? null : price * unitsMoved;
    const shareOfSaving = usageRevenue === null || buyerSaving === null || buyerSaving <= 0 ? null : usageRevenue / buyerSaving;
    const timesSeatRevenue = usageRevenue === null || revenueLost === null || revenueLost <= 0 ? null : usageRevenue / revenueLost;
    const usageMargin = price === undefined || price === 0 || runCost === undefined ? null : (price - runCost) / price;
    return { name: w.name, state: "worked" as const, basis, retentionNeeds, impossible, cut, arrShare, renewalByUnit, lostPoints, grrAfter, nrrAfter, gates, seatsCut, pricePerSeat, revenueLost, unitsMoved, recoverRate, keepProfitRate, buyerSaving, savingPerUnit, price, usageRevenue, shareOfSaving, timesSeatRevenue, usageMargin };
  });

  // ----- seller capacity (pause two guards every sum that uses the win rate) -----
  const capacity = worked.map((w) => {
    const s = w.s;
    const ramp = given(s.seller_ramp_months), cycle = given(s.sales_cycle_days);
    const win = confirmed.win_rate ? given(s.win_rate_percent) : undefined;
    const target = given(s.year_one_customer_target);
    const targetSource = target !== undefined ? "your own target" : null;
    const core = ramp !== undefined && cycle !== undefined ? sellerCapacity(ramp, cycle, given(s.ramped_deals_per_seller_per_year), given(s.acv), given(s.seller_loaded_cost_per_year), margin) : null;
    const sellersForTarget = target === 0 ? 0 : core?.dealsYearOne && target !== undefined ? target / core.dealsYearOne : null;
    const opportunitiesForTarget = target !== undefined && win !== undefined ? target / (win / 100) : null;
    const budgetForTarget = target !== undefined && given(s.cac) !== undefined ? target * s.cac! : null;
    const pipelineForTarget = opportunitiesForTarget !== null && given(s.acv) !== undefined ? opportunitiesForTarget * s.acv! : null;
    const ramped = given(s.ramped_deals_per_seller_per_year), demand = given(s.monthly_qualified_demand);
    const opportunitiesPerSellerMonth = ramped !== undefined && ramped > 0 && win !== undefined ? ramped / 12 / (win / 100) : null;
    const sellersDemandCarries = opportunitiesPerSellerMonth !== null && demand !== undefined ? demand / opportunitiesPerSellerMonth : null;
    const winsFromDemand = core !== null && demand !== undefined && win !== undefined ? demand * core.sellingMonths * (win / 100) : null;
    return { name: w.name, ramp, cycle, win, winGiven: given(s.win_rate_percent), target, targetSource, core, sellersForTarget, opportunitiesForTarget, budgetForTarget, pipelineForTarget, opportunitiesPerSellerMonth, sellersDemandCarries, winsFromDemand, demand, ramped };
  });

  // ----- retention playbook, only for its seat or usage signals (same server, called directly) -----
  const playbooks = worked.map((w) => {
    if (!confirmed.seat_cut || w.unit === "unclear") return { name: w.name, runs: [] as Array<{ model: string; churn: string; health: string | null; reach: string | null }> };
    const monthly = given(w.s.monthly_logo_churn_percent);
    const logo = given(w.s.logo_retention_percent);
    const monthlyRate = monthly !== undefined ? monthly : logo !== undefined ? (1 - Math.pow(logo / 100, 1 / 12)) * 100 : undefined;
    if (monthlyRate === undefined) return { name: w.name, runs: [] };
    const churn = `${(Math.round(monthlyRate * 10) / 10).toFixed(1)}% monthly`;
    const models = w.unit === "seat" ? ["saas_subscription"] : w.unit === "usage" ? ["usage_based"] : ["saas_subscription", "usage_based"];
    const runs = models.map((model) => {
      const answer = stripDashes(generateRetentionPlaybook({ customer_segment: w.name, business_model: model, current_churn_rate: churn, ...(text(w.s.churn_reasons) ? { churn_reasons: text(w.s.churn_reasons)! } : {}), product, ...(text(input.industry) ? { industry: detectVertical(input.industry)?.id ?? text(input.industry)! } : {}) } as Parameters<typeof generateRetentionPlaybook>[0]));
      return { model, churn, health: playbookSection(answer, "Health score"), reach: model === "usage_based" ? playbookSection(answer, "When to reach out") : null };
    });
    return { name: w.name, runs };
  });

  const hasNonFinite = (value: unknown): boolean => typeof value === "number" ? !Number.isFinite(value) : Array.isArray(value) ? value.some(hasNonFinite) : value !== null && typeof value === "object" ? Object.values(value).some(hasNonFinite) : false;
  if (hasNonFinite([worked, seatCut, capacity])) return refusal("These numbers are too large for reliable sums. Check the amounts and units, then run the check again.");

  // =====================  the answer, in reading order  =====================
  const lines: string[] = [];
  const head = `| Line | ${worked.map((w) => w.name).join(" | ")} |`;
  const rule = `|---|${worked.map(() => "---").join("|")}|`;
  const row = (label: string, cell: (w: Worked, i: number) => string): string => `| ${label} | ${worked.map((w, i) => cell(w, i)).join(" | ")} |`;
  const v = (n: number | undefined, f: (n: number) => string, needs: string): string => (n === undefined ? miss(needs) : f(n));

  lines.push("# Which segment to back, and is the pricing safe if AI cuts seats");
  lines.push("");
  lines.push(`First draft for ${product}, worked from your own numbers. Every figure is a sum of what you typed. None is a benchmark, and nothing is filled in for you: a figure with no input reads Missing.`);
  lines.push("");
  lines.push("## Read this first: retention and payback, side by side");
  lines.push("");
  lines.push(head, rule);
  lines.push(row("Payback on CAC and ARR", (w) => (w.payback === null ? miss("ACV and CAC") : months(w.payback))));
  lines.push(row("Payback on gross profit", (w) => (w.paybackOnProfit === null ? (margin === 0 ? "No payback at zero gross margin" : miss("ACV, CAC and gross margin")) : months(w.paybackOnProfit))));
  lines.push(row("Logo retention a year", (w) => v(given(w.s.logo_retention_percent), pct, "logo retention")));
  lines.push(row("Gross revenue retention", (w) => v(given(w.s.gross_retention_percent), pct, "gross revenue retention")));
  lines.push(row("Net revenue retention", (w) => v(given(w.s.net_retention_percent), pct, "net revenue retention")));
  lines.push(row("Expansion (net minus gross)", (w) => (w.expansionPoints === null ? miss("gross and net retention") : points(w.expansionPoints))));
  lines.push("");
  if (notes.length > 0) {
    lines.push("What the sums say:");
    for (const n of notes) lines.push(`- ${n}`);
    lines.push("");
  }
  lines.push("How to read it: these are retention and payback, not a fit score, and every segment is read on the same lines. Payback is CAC over one month of the contract's yearly revenue, in months; the second line does the same on gross profit. A fast payback on a segment that keeps too little revenue buys more of what leaves, so read payback beside gross and net retention. The choice between segments is yours.");
  lines.push("");

  lines.push("## If customers cut seats");
  lines.push("");
  if (!confirmed.seat_cut) {
    lines.push("Waiting for you: the seat cut sums run only after a person confirms what customers can cut, and when. Confirm it, then run the check again with the seat cut marked confirmed.");
  } else {
    lines.push(head, rule);
    lines.push(row("Pricing unit", (w) => (w.unit === "unclear" ? miss("the pricing unit in writing") : `${UNIT_WORDS[w.unit]} (${w.unitSource})`)));
    lines.push(row("Share of seats cut", (_w, i) => (seatCut[i].state === "worked" ? pct((seatCut[i] as any).cut) : miss("the share of seats customers could cut"))));
    lines.push(row("Renewal of one account", (w, i) => { const c = seatCut[i] as any; return c.state !== "worked" ? miss("the seat cut share") : c.renewalByUnit === null ? miss("ACV") : c.renewalByUnit.own === null ? miss("the pricing unit, and the seat share when it is a mix") : `${money(c.renewalByUnit.own)}, from ${money(w.s.acv!)}`; }));
    lines.push(row("Logo retention after the cut", (w, i) => (seatCut[i].state !== "worked" ? miss("the seat cut share") : v(given(w.s.logo_retention_percent), (n) => `${pct(n)}, unchanged`, "logo retention"))));
    lines.push(row("Gross retention after the cut", (_w, i) => { const c = seatCut[i] as any; return c.state !== "worked" ? miss("the seat cut share") : c.grrAfter === null ? miss(c.retentionNeeds + ", gross retention and the share of revenue in accounts that cut") : `${pct(c.grrAfter)}, down ${points(c.lostPoints)}`; }));
    lines.push(row("Net retention after the cut", (_w, i) => { const c = seatCut[i] as any; return c.state !== "worked" ? miss("the seat cut share") : c.nrrAfter === null ? miss(c.lostPoints === null ? c.retentionNeeds : "net retention and written confirmation that expansion revenue stays unchanged") : pct(c.nrrAfter); }));
    lines.push("");
    for (let i = 0; i < worked.length; i++) {
      const c = seatCut[i] as any, w = worked[i];
      if (c.state !== "worked" || c.lostPoints === null) continue;
      const g = c.gates;
      if (c.lostPoints === 0) { lines.push(`- ${w.name}: no additional seat revenue loss is modelled. With usage pricing no part of this contract is billed on seats; the renewal shown assumes work volume and price stay unchanged. A fall in work volume is outside this seat cut scenario.`); continue; }
      lines.push(`- ${w.name}: the customer stays, so logo retention does not move. Gross retention shows the cut first. Selling ${points(c.lostPoints)} of expansion elsewhere would put net retention back where it was while gross stayed at ${c.grrAfter === null ? "Missing until gross retention is supplied" : pct(c.grrAfter)}, so watch gross beside net.`);
      if (g.gross_after !== null || g.net_after !== null) {
        const part = (label: string, before: string | null, after: string | null, line: number | undefined): string | null => (after === null ? null : `${label} gate of ${pct(line!)}: ${before === after ? `${after === "pass" ? "passes" : "fails"} before and after` : `${before === "pass" ? "passes" : "fails"} today, ${after === "pass" ? "passes" : "fails"} after the cut`}`);
        const parts = [part("gross retention", g.gross_before, g.gross_after, given(w.s.gross_retention_gate_percent)), part("net retention", g.net_before, g.net_after, given(w.s.net_retention_gate_percent))].filter(Boolean);
        lines.push(`- ${w.name}, against your own gates: ${parts.join("; ")}.`);
      }
    }
    lines.push("");
    lines.push("How to read it: this is an additional cut scenario, not a forecast. In what customers can cut, state that the additional cut is not included in reported retention, that affected revenue is a share of opening ARR for the same cohort and period, and whether expansion revenue stays unchanged. Otherwise the retention projection stays Missing. Never subtract a cut already counted in gross retention again from either gross or net. The same loss is applied once to each measure because both use opening ARR; net is gross plus expansion. The account renewal also assumes its ACV is before this proposed cut. AI takes short, easy work first, so a quarter of the work is rarely a quarter of the seats. The test works with or without AI: when the customer gets the result you sell, which billed unit shrinks?");
  }
  lines.push("");

  lines.push(confirmationNote);
  lines.push("");
  lines.push("## Check this first");
  lines.push("");
  lines.push("The split you confirmed:");
  lines.push("");
  lines.push(...splitTable());
  lines.push("");
  lines.push(`- Gross margin used in every profit sum: ${margin === undefined ? miss("gross margin") : pct(marginPercent!)}.`);
  lines.push("- Segment split: the caller reports confirmation.");
  lines.push(`- Your own win rate: ${confirmed.win_rate ? "the caller reports confirmation" : "not confirmed, so every sum that uses a win rate is held back"}.`);
  lines.push(`- What customers can cut: ${confirmed.seat_cut ? "the caller reports confirmation" : "not confirmed, so the seat cut sums are held back"}.`);
  for (const w of worked) if (w.missing.length > 0) lines.push(`- ${w.name}, Missing: ${[...new Set(w.missing)].join(", ")}.`);
  for (const warning of warnings) lines.push(`- Check: ${warning}`);
  if (worked.length === 1) lines.push("- You gave one segment. The check still runs, but its use is the comparison: split the base into two or three segments where the buyers, cycles and contract values differ.");
  lines.push("");

  // ----- one page per segment -----
  worked.forEach((w, i) => {
    const s = w.s, c = seatCut[i] as any, cap = capacity[i], h = handoffs[i];
    lines.push(`## One page: ${w.name}`);
    lines.push("");
    lines.push("### Retention and payback");
    lines.push("");
    lines.push(`- Payback on CAC and ARR: ${w.payback === null ? miss("ACV and CAC") : `${months(w.payback)} (${money(s.cac!)} CAC over ${money(s.acv! / 12)} of contract revenue a month)`}.`);
    lines.push(`- Payback on gross profit: ${w.paybackOnProfit === null ? (margin === 0 ? "No payback at zero gross margin" : miss("ACV, CAC and gross margin")) : `${months(w.paybackOnProfit)} (${money(s.cac!)} CAC over ${money((s.acv! * margin!) / 12)} of gross profit a month, at your ${pct(marginPercent!)} margin)`}.`);
    lines.push(`- Retention: logo ${v(given(s.logo_retention_percent), pct, "logo retention")}; gross ${v(given(s.gross_retention_percent), pct, "gross revenue retention")}; net ${v(given(s.net_retention_percent), pct, "net revenue retention")}; expansion ${w.expansionPoints === null ? miss("gross and net retention") : points(w.expansionPoints)}.`);
    lines.push("");
    lines.push("### Seller capacity");
    lines.push("");
    if (cap.core === null) lines.push(`- ${miss("seller ramp in months and the sales cycle in days")}.`);
    else {
      lines.push(`- Selling months left in year one: ${one(cap.core.sellingMonths)} (12, less ${one(cap.ramp!)} of ramp, less a ${one(cap.core.cycleMonths)} month sales cycle before the first close).`);
      lines.push(`- Deals one new seller closes in year one: ${cap.core.dealsYearOne === null ? miss("the deals a ramped seller closes in a year, from your own hiring record") : `${count(cap.core.dealsYearOne)} (${one(cap.core.sellingMonths)} months at ${count(cap.ramped!)} a year)`}.`);
      lines.push(`- Contract value one seller books in year one: ${cap.core.acvBooked === null ? miss("ramped deals per seller and ACV") : money(cap.core.acvBooked)}.`);
      lines.push(`- Payback on the seller's cost, per deal: ${cap.core.paybackOnSellerCostMonths === null ? (cap.core.dealsYearOne === 0 ? "No payback in this plan: no deals close in year one" : margin === 0 ? "No payback at zero gross margin" : miss("ramped deals per seller, loaded cost, ACV and gross margin")) : `${months(cap.core.paybackOnSellerCostMonths)} (${money(s.seller_loaded_cost_per_year!)} over ${count(cap.core.dealsYearOne!)} deals, over ${money((s.acv! * margin!) / 12)} of gross profit a month per deal)`}.`);
    }
    lines.push(`- Year one customer target: ${cap.target === undefined ? miss("your own year one customer target") : `${count(cap.target)}, from ${cap.targetSource}`}.`);
    lines.push(`- Sellers that target needs, all hired on day one: ${cap.sellersForTarget === null ? (cap.core?.dealsYearOne === 0 && cap.target !== undefined ? "The target cannot be met by sellers with no year one closes" : miss("the target and year one deals per seller")) : count(cap.sellersForTarget)}.`);
    lines.push(`- CAC budget that target implies: ${cap.budgetForTarget === null ? miss("the target and CAC") : `${money(cap.budgetForTarget)} (${count(cap.target!)} customers at ${money(s.cac!)})`}.`);
    if (!confirmed.win_rate) lines.push("- Waiting for you: qualified opportunities needed, pipeline needed, and the sellers your demand can carry all use a win rate. They run only after a person confirms the win rate is your own.");
    else {
      lines.push(`- Qualified opportunities that target needs: ${cap.opportunitiesForTarget === null ? miss("the target and your own win rate") : `${count(cap.opportunitiesForTarget)}, at your ${pct(cap.win!)} win rate`}.`);
      lines.push(`- Pipeline value that target needs: ${cap.pipelineForTarget === null ? miss("the target, your own win rate and ACV") : money(cap.pipelineForTarget)}.`);
      lines.push(`- Sellers your qualified demand can carry: ${cap.sellersDemandCarries === null ? miss("monthly qualified demand, ramped deals per seller and your own win rate") : `${count(cap.sellersDemandCarries)} (${count(cap.demand!)} qualified opportunities a month, and one ramped seller needs ${count(cap.opportunitiesPerSellerMonth!)} a month)`}.`);
      lines.push(`- Wins that demand supports in year one: ${cap.winsFromDemand === null ? miss("monthly qualified demand, ramp, cycle and your own win rate") : `${count(cap.winsFromDemand)} (${count(cap.demand!)} a month over ${one(cap.core!.sellingMonths)} selling months, at your win rate)`}.`);
    }
    lines.push("- How to read it: this is year one, not a full year. Ramp and the sales cycle cut it, and qualified demand sets the ceiling. Count only qualified opportunities really assigned to sellers. Size the team from this, never from a market share.");
    lines.push("");
    lines.push("### Pricing unit risk");
    lines.push("");
    lines.push(`- What you bill on, in your words: ${text(s.pricing_unit_in_writing) ? `"${text(s.pricing_unit_in_writing)}"` : miss("the pricing unit in writing")}. Read as: ${UNIT_WORDS[w.unit]}${w.unit === "unclear" ? "" : ` (${w.unitSource})`}.`);
    lines.push(`- What a customer can cut, and when: ${text(s.what_customers_can_cut) ? `"${text(s.what_customers_can_cut)}"` : miss("what a customer can cut, and when, in writing")}.`);
    if (!confirmed.seat_cut) lines.push("- Waiting for you: confirm what customers can cut, then the renewal sums run.");
    else if (c.state !== "worked") lines.push(`- ${miss("the share of seats customers could cut")}.`);
    else {
      lines.push(`- Renewal of one account if ${pct(c.cut)} of seats go: ${c.renewalByUnit === null ? miss("ACV") : `on seats ${money(c.renewalByUnit.seat)}; on usage ${money(c.renewalByUnit.usage)}, because that bill follows the work done and not the seat count${c.renewalByUnit.own === null ? "" : `; on your pricing ${money(c.renewalByUnit.own)}`}`}.`);
      lines.push(`- Across the base: ${c.lostPoints === null ? miss(c.retentionNeeds + ", the share of revenue in accounts that would cut, and the pricing unit") : `accounts holding ${c.arrShare === undefined ? "an unspecified share" : pct(c.arrShare)} of revenue each cutting ${pct(c.cut)} of seats takes ${points(c.lostPoints)} off gross retention${c.basis.expansionUnchanged ? " and the same points off net, with expansion revenue held fixed" : "; net retention waits for confirmation that expansion revenue stays unchanged"}`}${c.grrAfter === null ? "" : `: gross ${pct(s.gross_retention_percent!)} to ${pct(c.grrAfter)}`}${c.nrrAfter === null ? "" : `, net ${pct(s.net_retention_percent!)} to ${pct(c.nrrAfter)}`}.`);
      if (c.seatsCut !== null && c.pricePerSeat !== null) lines.push(`- Seats: ${count(s.seats_per_account!)} at ${money(c.pricePerSeat)} each; ${count(c.seatsCut)} cut; revenue lost ${c.revenueLost === null ? miss("ACV") : money(c.revenueLost)} a year.`);
      if (c.recoverRate !== null) lines.push(`- The usage rate that replaces it: those seats did ${count(c.unitsMoved)} units of work a year, so ${rate(c.recoverRate)} a unit recovers the revenue${c.keepProfitRate === null ? "" : `, and ${rate(c.keepProfitRate)} plus your run cost keeps the gross profit`}. That is a floor, not a price.`);
      else lines.push(`- The usage rate that replaces it: ${miss("seats per account and the units of work one seat does in a year")}.`);
      if (c.savingPerUnit !== null) lines.push(`- The buyer's side: ${count(c.seatsCut)} fewer seats saves the buyer ${money(c.buyerSaving)} a year, ${rate(c.savingPerUnit)} a unit. Your price sits between the floor and that.`);
      if (c.usageRevenue !== null) lines.push(`- At your ${rate(c.price)} a unit: ${money(c.usageRevenue)} a year${c.timesSeatRevenue === null ? "" : `, ${one(c.timesSeatRevenue)} times what the cut seats paid`}${c.shareOfSaving === null ? "" : `, and ${pct(c.shareOfSaving * 100)} of the buyer's saving`}${c.usageMargin === null ? "" : `; margin ${pct(c.usageMargin * 100)} after run cost`}. Count retries and failed attempts in run cost.`);
    }
    lines.push("- Contract terms that limit a seat cut: a platform fee (revenue no seat count moves), a minimum commit or seat floor (a limit on the cut), a multi year term (time to move the account), and a usage meter in the first contract (revenue that rises with AI use).");
    lines.push("");
    lines.push("### Size (first draft from the sizing calculator on ICP Intelligence)");
    lines.push("");
    if (given(s.sizing_som) !== undefined || given(s.sizing_year_one_customers) !== undefined || given(s.sizing_tam) !== undefined) {
      lines.push(`- TAM ${v(given(s.sizing_tam), money, "the sizing result")}; SAM ${v(given(s.sizing_sam), money, "the sizing result")}; SOM in year one ${v(given(s.sizing_som), money, "the sizing result")}; customers needed ${v(given(s.sizing_year_one_customers), count, "the sizing result")}. These are the calculator's figures, carried as you passed them.`);
    } else {
      lines.push(`- ${miss("the sizing first draft")}. Run the TAM, SAM and SOM calculator on ICP Intelligence with ${showInputs(h.sizing_inputs)}, then pass back its TAM, SAM, SOM and customers needed.`);
    }
    lines.push("- How to read it: the calculator multiplies the counts you give it and brings none of its own. Its pipeline line uses an example win rate of one in three; the opportunity and pipeline lines above use your own rate instead. A year one share is a planning assumption, not a forecast.");
    lines.push("");
    lines.push("### Motion (first draft from the EPIC audit on GTM Alpha)");
    lines.push("");
    if (text(s.motion_lead)) {
      lines.push(`- Lead motion: ${text(s.motion_lead)}${given(s.motion_score) !== undefined ? `, scored ${count(s.motion_score!)} of 10` : ""}${text(s.motion_reason) ? `. The audit's reason: "${text(s.motion_reason)}"` : ""}. Carried as you passed it.`);
    } else {
      lines.push(`- ${miss("the motion first draft")}. Run the EPIC audit on GTM Alpha with ${showInputs(h.motion_inputs)}, then pass back its lead motion, score and reason.`);
    }
    lines.push("- How to read it: the audit starts each motion from a table set by your funding stage, then adds points for lines in your figures. It does not read how these buyers buy, so a different lead per segment can come from the inputs alone. Check the motion against how your last 20 deals in this segment arrived.");
    lines.push("");
  });

  // ----- later years: only for companies that track expansion; never the lead -----
  if (tracksExpansion) {
    lines.push("## Later years, for companies that track expansion");
    lines.push("");
    lines.push("Gross profit per $1 of CAC, added up year by year at one flat retention rate, with no discounting. A planning sum, not a forecast. Read payback first; use this only if you measure expansion account by account.");
    lines.push("");
    lines.push(head, rule);
    for (const y of YEARS_SHOWN) {
      lines.push(row(`By year ${y}, on gross retention`, (w) => (w.perCac.gross ? perDollar(w.perCac.gross[y]) : miss("ACV, CAC, gross margin and gross retention"))));
      if (y > 1) lines.push(row(`By year ${y}, on net retention`, (w) => (w.perCac.net ? perDollar(w.perCac.net[y]) : miss("ACV, CAC, gross margin and net retention"))));
    }
    lines.push("");
    for (const n of laterNotes) lines.push(`- ${n}`);
    if (laterNotes.length > 0) lines.push("");
  }

  // ----- retention playbook signals -----
  if (playbooks.some((p) => p.runs.length > 0)) {
    lines.push("## First draft: signals to watch for your pricing unit (from the retention playbook)");
    lines.push("");
    lines.push("The playbook does not model a seat cut or a price change; the sums above do that. It is carried here only for the signals that fit how you charge. Its weights are illustrations, not a retention forecast or a gate for spending.");
    lines.push("");
    for (const p of playbooks) for (const run of p.runs) {
      lines.push(`### ${p.name}, read as ${run.model === "usage_based" ? "usage based" : "a seat subscription"} at ${run.churn} logo churn`);
      lines.push("");
      lines.push(run.health ?? miss("the health score section of the retention playbook answer"));
      lines.push("");
      if (run.reach) { lines.push("When to reach out:"); lines.push(""); lines.push(run.reach); lines.push(""); }
    }
  }

  // ----- step strip -----
  lines.push("## Steps and what passed between them");
  lines.push("");
  lines.push("- Step one, you: the segment split, confirmed. Only the split passes on: each segment's ACV and account count go to the motion and size first drafts.");
  for (const h of handoffs) {
    lines.push(`- ${h.segment}, to the EPIC audit on GTM Alpha: ${showInputs(h.motion_inputs)}.`);
    lines.push(`- ${h.segment}, to the sizing calculator on ICP Intelligence: ${showInputs(h.sizing_inputs)}.`);
  }
  lines.push("- Step two, this server: retention, payback, seller capacity and the seat cut sums. These steps do not feed each other; each reads your inputs.");
  for (const p of playbooks) for (const run of p.runs) lines.push(`- ${p.name}, to the retention playbook on this server: customer segment "${p.name}"; business model "${run.model.replace(/_/g, " ")}"; current churn rate "${run.churn}".`);
  lines.push("");

  // ----- role lines -----
  const fastest = withPayback.length > 0 ? [...withPayback].sort((a, b) => a.payback! - b.payback!)[0] : null;
  const seatExposed = worked.filter((_, i) => { const c = seatCut[i] as any; return c.state === "worked" && c.lostPoints !== null && c.lostPoints > 0; });
  const under100 = worked.filter((w) => retentionConsistent(w.s) && given(w.s.net_retention_percent) !== undefined && w.s.net_retention_percent! < 100);
  const sellerPays = capacity.filter((c) => c.core?.paybackOnSellerCostMonths != null).sort((a, b) => a.core!.paybackOnSellerCostMonths! - b.core!.paybackOnSellerCostMonths!)[0] ?? null;
  lines.push("## Your next action");
  lines.push("");
  lines.push(`Founder: back one segment on retention and payback, not on a score. ${fastest ? `${fastest.name} pays back fastest at ${months(fastest.payback!)}` : "Payback is Missing until ACV and CAC are in"}. Write the gross and net retention lines that release the next money before you spend it.`);
  lines.push(`CEO: decide whether the pricing unit changes, and when. ${seatExposed.length > 0 ? `${seatExposed.map((w) => w.name).join(" and ")} ${seatExposed.length === 1 ? "loses" : "lose"} gross retention when seats are cut` : confirmed.seat_cut ? "The seat cut loss is Missing or zero; Missing does not establish that pricing is safe" : "The seat cut sums are waiting for a confirmed cut"}. Put a usage meter into new contracts first, and move existing accounts one renewal before their seats shrink, not when procurement asks.`);
  lines.push(`CMO: set one motion per segment and check each against how the last 20 deals in that segment arrived. ${under100.length > 0 ? `Keep new acquisition spend off ${under100.map((w) => w.name).join(" and ")} until net retention is back at 100%.` : "Check every segment with Missing net retention before releasing acquisition spend; reported rates alone do not fill those gaps."}`);
  lines.push(`CRO: place sellers where one seller earns back its cost soonest${sellerPays ? `: ${sellerPays.name}, at ${months(sellerPays.core!.paybackOnSellerCostMonths!)} per deal` : " (Missing until ramp, ramped deals, loaded cost and margin are in)"}. Hire behind the written gate, and size the team from qualified demand, not from a market share.`);
  lines.push(`Demand generation head: set budget per segment from payback and the CAC budget each target implies, and report qualified opportunities assigned to sellers every month. ${fastest ? `Watch CAC on ${fastest.name}: a faster payback holds only while CAC holds at volume.` : "Report CAC per segment, not blended."}`);
  lines.push("");
  lines.push("## Reading the answer");
  lines.push("");
  lines.push("Same inputs give the same page, so rerun it each quarter with new retention figures and before each renewal season with a new seat cut share, then compare line by line. Retention projections require a fresh cut outside reported retention and a share of opening ARR. Usage renewals assume unchanged work volume and rates. The motion and size lines are first drafts from other Helix tools, carried as passed and never recomputed here. The conclusion needs review if your seat cut share, retention figures or segment CAC change, or if a segment's payback moves past your gate. If gross retention sits under your gate while net retention looks sound, that is the moment for a second pair of eyes: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min");

  const structuredContent: Record<string, unknown> = {
    tool: "segment_and_seat_cut_check",
    stage: "worked",
    confirmed,
    confirmation_evidence: "caller_attestation_only",
    gross_margin_percent: marginPercent ?? null,
    segments: worked.map((w, i) => {
      const c = seatCut[i] as any, cap = capacity[i];
      return {
        name: w.name,
        missing: [...new Set(w.missing)],
        pricing_unit: { read_as: w.unit, source: w.unitSource, seat_share: w.seatShare },
        retention_and_payback: {
          payback_months_on_cac_and_arr: round4(w.payback),
          payback_months_on_gross_profit: round4(w.paybackOnProfit),
          logo_retention_percent: given(w.s.logo_retention_percent) ?? null,
          gross_retention_percent: given(w.s.gross_retention_percent) ?? null,
          net_retention_percent: given(w.s.net_retention_percent) ?? null,
          expansion_points: round4(w.expansionPoints),
          gross_profit_per_cac_dollar: !tracksExpansion ? null : {
            year_1: round4(w.perCac.yearOne),
            on_gross_retention: w.perCac.gross ? Object.fromEntries(YEARS_SHOWN.map((y) => [`year_${y}`, round4(w.perCac.gross![y])])) : null,
            on_net_retention: w.perCac.net ? Object.fromEntries(YEARS_SHOWN.map((y) => [`year_${y}`, round4(w.perCac.net![y])])) : null,
          },
        },
        seller_capacity: {
          selling_months_year_one: round4(cap.core?.sellingMonths),
          deals_per_seller_year_one: round4(cap.core?.dealsYearOne),
          acv_booked_per_seller_year_one: round4(cap.core?.acvBooked),
          payback_on_seller_cost_months: round4(cap.core?.paybackOnSellerCostMonths),
          year_one_customer_target: cap.target ?? null,
          sellers_for_target: round4(cap.sellersForTarget),
          cac_budget_for_target: round4(cap.budgetForTarget),
          win_rate_percent_used: cap.win ?? null,
          opportunities_for_target: round4(cap.opportunitiesForTarget),
          pipeline_for_target: round4(cap.pipelineForTarget),
          sellers_demand_carries: round4(cap.sellersDemandCarries),
          wins_from_demand_year_one: round4(cap.winsFromDemand),
        },
        seat_cut: c.state !== "worked" ? { state: c.state } : {
          state: "worked",
          retention_basis: c.basis,
          retention_projection_missing_reason: c.lostPoints === null ? c.retentionNeeds : c.nrrAfter === null ? "Net retention needs its reported rate and unchanged expansion revenue" : null,
          seat_cut_percent: c.cut,
          renewal_per_account: c.renewalByUnit === null ? null : { on_seats: round4(c.renewalByUnit.seat), on_usage: round4(c.renewalByUnit.usage), on_your_pricing: round4(c.renewalByUnit.own) },
          retention_points_lost: round4(c.lostPoints),
          gross_retention_after_percent: round4(c.grrAfter),
          net_retention_after_percent: round4(c.nrrAfter),
          gates: c.gates,
          seats_cut: round4(c.seatsCut),
          price_per_seat: c.pricePerSeat,
          revenue_lost_per_account: round4(c.revenueLost),
          work_units_moved: round4(c.unitsMoved),
          usage_rate_that_recovers_revenue: c.recoverRate,
          usage_rate_that_keeps_gross_profit_before_run_cost: c.keepProfitRate,
          buyer_saving: round4(c.buyerSaving),
          buyer_saving_per_unit: c.savingPerUnit,
          revenue_at_your_usage_price: round4(c.usageRevenue),
          share_of_buyer_saving: round4(c.shareOfSaving),
          times_seat_revenue: round4(c.timesSeatRevenue),
          usage_margin_after_run_cost: round4(c.usageMargin),
        },
        size_first_draft: { tam: given(w.s.sizing_tam) ?? null, sam: given(w.s.sizing_sam) ?? null, som: given(w.s.sizing_som) ?? null, year_one_customers: given(w.s.sizing_year_one_customers) ?? null },
        motion_first_draft: { lead: text(w.s.motion_lead) ?? null, score: given(w.s.motion_score) ?? null, reason: text(w.s.motion_reason) ?? null },
      };
    }),
    tracks_expansion: tracksExpansion,
    comparison: { notes, later_years: tracksExpansion ? { lead_changes: leadChanges, cac_line: cacLine, notes: laterNotes } : null },
    warnings,
    handoffs,
  };

  if (hasNonFinite(structuredContent)) return refusal("These numbers are too large for reliable sums. Check the amounts and units, then run the check again.");
  return { text: stripDashes(lines.join("\n")), structuredContent };
}
