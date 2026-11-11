// Segment and Seat Cut Check (guide 29 as one tool). Every expected value below is worked by hand in the comment
// beside it, or written as its own arithmetic. No expected value is read from the tool and none is typed from memory.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateSegmentCheck,
  paybackMonths,
  paybackMonthsOnGrossProfit,
  grossProfitPerCacDollar,
  sellerCapacity,
  renewalAfterSeatCut,
  retentionPointsLost,
  readPricingUnit,
} from "../dist/segment-check.js";
import { createServer, listedTools } from "../dist/server.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const TOOL = "segment_and_seat_cut_check";
const guide29 = () => { const a = JSON.parse(readFileSync(path.join(here, "fixtures/segment-check/guide-29-inputs.json"), "utf8")); delete a._note; return a; };
const near = (actual, expected, tolerance = 1e-9, label = "") => assert.ok(Math.abs(actual - expected) <= tolerance, `${label} expected ${expected}, got ${actual}`);
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

async function call(args, name = TOOL) {
  const server = createServer();
  return server._requestHandlers.get("tools/call")({ method: "tools/call", params: { name, arguments: args } });
}

test("known answer: guide 29's worked example is reproduced by computation", async () => {
  const res = await call(guide29());
  assert.ok(!res.isError);
  const [reg, dig] = res.structuredContent.segments;
  const rp = reg.retention_and_payback, dp = dig.retention_and_payback;

  // Payback on gross profit (the guide's version): 45,000 / (60,000 x 0.72) x 12 and 9,000 / (18,000 x 0.72) x 12.
  near(rp.payback_months_on_gross_profit, (45000 / (60000 * 0.72)) * 12, 1e-4);
  near(dp.payback_months_on_gross_profit, (9000 / (18000 * 0.72)) * 12, 1e-4);
  // Third check, the guide's printed figures: 12.5 and 8.3 months.
  assert.equal(round(rp.payback_months_on_gross_profit, 1), 12.5);
  assert.equal(round(dp.payback_months_on_gross_profit, 1), 8.3);
  // The owner's lead measure, CAC over monthly ARR: 45,000 / 5,000 = 9; 9,000 / 1,500 = 6.
  near(rp.payback_months_on_cac_and_arr, 9, 1e-9);
  near(dp.payback_months_on_cac_and_arr, 6, 1e-9);
  // Expansion is net minus gross: 108 - 92 and 92 - 82.
  assert.equal(rp.expansion_points, 16);
  assert.equal(dp.expansion_points, 10);

  // Gross profit per $1 of CAC (later years table). Year 1: 43,200 / 45,000 and 12,960 / 9,000.
  const g = (acv, cac, r, n) => { let s = 0; for (let t = 0; t < n; t++) s += r ** t; return ((acv * 0.72) / cac) * s; };
  const rg = rp.gross_profit_per_cac_dollar, dg = dp.gross_profit_per_cac_dollar;
  near(rg.year_1, 0.96, 1e-4); near(dg.year_1, 1.44, 1e-4);
  near(rg.on_gross_retention.year_5, g(60000, 45000, 0.92, 5), 1e-4);
  near(dg.on_gross_retention.year_5, g(18000, 9000, 0.82, 5), 1e-4);
  near(rg.on_net_retention.year_5, g(60000, 45000, 1.08, 5), 1e-4);
  near(dg.on_net_retention.year_5, g(18000, 9000, 0.92, 5), 1e-4);
  near(rg.on_net_retention.year_7, g(60000, 45000, 1.08, 7), 1e-4);
  near(dg.on_net_retention.year_7, g(18000, 9000, 0.92, 7), 1e-4);
  // Third check, the guide's printed table: 0.96, 1.44; 4.09, 5.03; 5.63, 6.14; 8.57, 7.96.
  assert.deepEqual([rg.year_1, dg.year_1, rg.on_gross_retention.year_5, dg.on_gross_retention.year_5, rg.on_net_retention.year_5, dg.on_net_retention.year_5, rg.on_net_retention.year_7, dg.on_net_retention.year_7].map((n) => round(n, 2)),
    [0.96, 1.44, 4.09, 5.03, 5.63, 6.14, 8.57, 7.96]);
  // The guide: digital native leads for six years on net retention, and past year ten on gross.
  const later = res.structuredContent.comparison.later_years;
  assert.equal(later.lead_changes.find((c) => c.basis === "net").change_year, 7);
  assert.equal(later.lead_changes.find((c) => c.basis === "gross").change_year, 11);
  // The guide: at about $11,000, 23% higher, the five year lead on gross retention is gone.
  // By hand: 12,960 x (1 - 0.82^5) / 0.18, over regulated's year 5 figure.
  near(later.cac_line.cac_where_lead_is_gone, (12960 * ((1 - 0.82 ** 5) / 0.18)) / g(60000, 45000, 0.92, 5), 1e-3);
  assert.equal(Math.round(later.cac_line.cac_where_lead_is_gone / 1000), 11);
  assert.equal(Math.round(later.cac_line.rise_percent), 23);

  // Seat cut, regulated: 100 seats at $600, 25 cut. Renewal 60,000 x 0.75 = 45,000.
  const sc = reg.seat_cut;
  assert.equal(sc.renewal_per_account.on_seats, 45000);
  assert.equal(sc.renewal_per_account.on_usage, 60000);
  assert.equal(sc.price_per_seat, 600);
  assert.equal(sc.seats_cut, 25);
  // Accounts holding 32% of revenue each cut a quarter: 0.32 x 0.25 = 8 points. Gross 92 to 84, net 108 to 100.
  near(sc.retention_points_lost, 8, 1e-9);
  near(sc.gross_retention_after_percent, 84, 1e-9);
  near(sc.net_retention_after_percent, 100, 1e-9);
  // The guide: the base fails at gross 84 while net 100 still passes (gates 90 and 100).
  assert.deepEqual(sc.gates, { gross_before: "pass", gross_after: "fail", net_before: "pass", net_after: "pass", logo: null });
  // Rate: 25 seats x 6,000 contacts = 150,000; 15,000 / 150,000 = 0.10; x 0.72 = 0.072.
  assert.equal(sc.work_units_moved, 150000);
  near(sc.usage_rate_that_recovers_revenue, 0.1, 1e-9);
  near(sc.usage_rate_that_keeps_gross_profit_before_run_cost, 0.072, 1e-9);
  // Buyer: 25 x 6,000 = 150,000, $1.00 a contact. At $0.20: 30,000, twice the seats, a fifth of the saving, margin 0.14/0.20.
  assert.equal(sc.buyer_saving, 150000);
  near(sc.buyer_saving_per_unit, 1, 1e-9);
  near(sc.revenue_at_your_usage_price, 30000, 1e-6);
  near(sc.times_seat_revenue, 2, 1e-9);
  near(sc.share_of_buyer_saving, 0.2, 1e-9);
  near(sc.usage_margin_after_run_cost, 0.7, 1e-9);

  // Step 5 of the guide: 30 customers at $45,000 CAC is $1.35M; 30 wins at one in three need 90 opportunities.
  assert.equal(reg.seller_capacity.cac_budget_for_target, 1350000);
  near(reg.seller_capacity.opportunities_for_target, 90, 1e-6);
  near(reg.seller_capacity.pipeline_for_target, 5400000, 1e-2);
  // Digital native gave no win rate: nothing is filled in.
  assert.equal(dig.seller_capacity.opportunities_for_target, null);
  assert.match(res.content[0].text, /Qualified opportunities that target needs: Missing: needs the target and your own win rate/);

  // The owner's rule: payback on CAC and ARR leads; no lifetime value anywhere.
  const text = res.content[0].text;
  assert.ok(text.indexOf("Payback on CAC and ARR") < text.indexOf("Payback on gross profit"));
  assert.ok(text.indexOf("Payback on CAC and ARR") < text.indexOf("Later years"));
  assert.doesNotMatch(text + JSON.stringify(res.structuredContent), /\bLTV\b|lifetime/i);
});

test("the outside first drafts used in the known answer are what the live tools returned", () => {
  // Recorded from gtmalpha.gtmhelix.com and icp-intelligence.gtmhelix.com on 11 Nov 2026 with the handoff inputs.
  const live = JSON.parse(readFileSync(path.join(here, "fixtures/segment-check/outside-tools-live-20261111.json"), "utf8"));
  const input = guide29();
  assert.equal(live.epic_regulated.lead_motion, input.segments[0].motion_lead);
  assert.equal(live.epic_regulated.lead_score, input.segments[0].motion_score);
  assert.equal(live.epic_digital.lead_motion, input.segments[1].motion_lead);
  assert.equal(live.epic_digital.lead_score, input.segments[1].motion_score);
  assert.match(live.size_regulated.printed, /TAM = \$360\.0M[\s\S]*SAM = \$90\.0M[\s\S]*SOM = \$1\.8M[\s\S]*~30 closed customers/);
  assert.match(live.size_digital.printed, /TAM = \$216\.0M[\s\S]*SAM = \$43\.2M[\s\S]*SOM = \$1\.3M[\s\S]*~72 closed customers/);
});

test("seller capacity: guide 01's two sellers, worked by hand", () => {
  // Business seller: 1 month ramp, 75 day cycle (2.5 months): 12 - 1 - 2.5 = 8.5 selling months.
  // Two deals a month ramped (24 a year): 8.5 x 2 = 17 deals; 17 x 36,000 = 612,000.
  // Payback on seller cost per deal: 200,000 / 17 / (36,000 x 0.6 / 12 = 1,800) = 6.5359 months.
  const b = sellerCapacity(1, 75, 24, 36000, 200000, 0.6);
  near(b.sellingMonths, 8.5); near(b.dealsYearOne, 17); near(b.acvBooked, 612000); near(b.paybackOnSellerCostMonths, 200000 / 17 / 1800);
  assert.equal(round(b.paybackOnSellerCostMonths, 1), 6.5);
  // Enterprise seller: 2 months ramp, 120 day cycle (4 months): 6 selling months; 7 a year: 6 x 7 / 12 = 3.5 deals.
  // 3.5 x 90,000 = 315,000. Payback: 300,000 / 3.5 / (90,000 x 0.6 / 12 = 4,500) = 19.05 months.
  const e = sellerCapacity(2, 120, 7, 90000, 300000, 0.6);
  near(e.sellingMonths, 6); near(e.dealsYearOne, 3.5); near(e.acvBooked, 315000);
  assert.equal(round(e.paybackOnSellerCostMonths, 0), 19);

  const res = generateSegmentCheck({
    product: "AI app builder for internal tools", gross_margin_percent: 60, confirmed: { segment_split: true, win_rate: true },
    segments: [
      { name: "Business plan, 200 to 999 employees", acv: 36000, sales_cycle_days: 75, seller_ramp_months: 1, seller_loaded_cost_per_year: 200000, ramped_deals_per_seller_per_year: 24, year_one_customer_target: 80, win_rate_percent: 100 / 3, monthly_qualified_demand: 12 },
      { name: "Enterprise plan, 1,000 to 10,000 employees", acv: 90000, sales_cycle_days: 120, seller_ramp_months: 2, seller_loaded_cost_per_year: 300000, ramped_deals_per_seller_per_year: 7, year_one_customer_target: 18, win_rate_percent: 100 / 3 },
    ],
  });
  const [bus, ent] = res.structuredContent.segments.map((s) => s.seller_capacity);
  // 80 / 17 = 4.7 sellers; 18 / 3.5 = 5.1 sellers; 80 wins at one in three need 240 opportunities, 18 need 54.
  assert.equal(round(bus.sellers_for_target, 1), 4.7);
  assert.equal(round(ent.sellers_for_target, 1), 5.1);
  near(bus.opportunities_for_target, 240, 1e-6);
  near(ent.opportunities_for_target, 54, 1e-6);
  // Two wins a month at one in three is six opportunities a seller: 12 a month carries 2 sellers. 12 x 8.5 = 102, a third is 34 wins.
  near(bus.sellers_demand_carries, 2, 1e-6);
  near(bus.wins_from_demand_year_one, 34, 1e-6);
  assert.match(res.text, /Deals one new seller closes in year one: 17 \(8\.5 months at 24 a year\)/);
});

test("hand-worked set A: logistics software on dispatcher seats", () => {
  // Payback on CAC and ARR: 30,000 / (48,000 / 12 = 4,000) = 7.5 months. On gross profit at 75%: 30,000 / 3,000 = 10 months.
  near(paybackMonths(30000, 48000), 7.5);
  near(paybackMonthsOnGrossProfit(30000, 48000, 0.75), 10);
  // Capacity: ramp 3, cycle 90 days = 3 months, 6 selling months; 12 a year ramped gives 6 deals; 6 x 48,000 = 288,000.
  // Seller payback per deal: 180,000 / 6 / 3,000 = 10 months.
  const cap = sellerCapacity(3, 90, 12, 48000, 180000, 0.75);
  near(cap.dealsYearOne, 6); near(cap.acvBooked, 288000); near(cap.paybackOnSellerCostMonths, 10);
  // Seat cut 20%: renewal 48,000 x 0.8 = 38,400. Half of revenue cutting 20%: 0.5 x 0.2 = 10 points.
  near(renewalAfterSeatCut(48000, 0.2, 1), 38400);
  near(retentionPointsLost(0.5, 0.2, 1), 10);
  const res = generateSegmentCheck({
    product: "Dispatch planning software for road freight", gross_margin_percent: 75, confirmed: { segment_split: true, win_rate: true, seat_cut: true },
    segments: [{ name: "Mid-size road carriers", acv: 48000, sales_cycle_days: 90, accounts: 3000, deal_source: "outbound", cac: 30000, logo_retention_percent: 90, gross_retention_percent: 88, net_retention_percent: 104,
      pricing_unit_in_writing: "We charge per dispatcher seat, billed yearly", what_customers_can_cut: "dispatcher seats at renewal", win_rate_percent: 25, year_one_customer_target: 24,
      seller_ramp_months: 3, seller_loaded_cost_per_year: 180000, ramped_deals_per_seller_per_year: 12, monthly_qualified_demand: 16,
      seat_cut_percent: 20, arr_share_cutting_percent: 50, seats_per_account: 40, work_units_per_seat_per_year: 2500 }],
  });
  const s = res.structuredContent.segments[0];
  near(s.retention_and_payback.payback_months_on_cac_and_arr, 7.5);
  near(s.retention_and_payback.payback_months_on_gross_profit, 10);
  // 24 customers / 6 deals = 4 sellers; 24 / 0.25 = 96 opportunities; one ramped seller needs 1 / 0.25 = 4 a month, so 16 carries 4; 16 x 6 x 0.25 = 24 wins.
  near(s.seller_capacity.sellers_for_target, 4); near(s.seller_capacity.opportunities_for_target, 96);
  near(s.seller_capacity.sellers_demand_carries, 4); near(s.seller_capacity.wins_from_demand_year_one, 24);
  // Gross 88 to 78, net 104 to 94. 40 seats at 1,200; 8 cut; 9,600 lost; 8 x 2,500 = 20,000 units; 0.48 recovers; x 0.75 = 0.36.
  near(s.seat_cut.gross_retention_after_percent, 78); near(s.seat_cut.net_retention_after_percent, 94);
  assert.equal(s.seat_cut.renewal_per_account.on_your_pricing, 38400);
  assert.equal(s.seat_cut.price_per_seat, 1200); assert.equal(s.seat_cut.seats_cut, 8); assert.equal(s.seat_cut.revenue_lost_per_account, 9600);
  near(s.seat_cut.usage_rate_that_recovers_revenue, 0.48); near(s.seat_cut.usage_rate_that_keeps_gross_profit_before_run_cost, 0.36);
  assert.match(res.text, /Payback on CAC and ARR \| 7\.5 months/);
});

test("hand-worked set B: payments software billed on usage is not moved by a seat cut", () => {
  // Payback: 90,000 / (120,000 / 12 = 10,000) = 9 months; on gross profit at 60%: 90,000 / 6,000 = 15 months.
  // Capacity: ramp 2, cycle 150 days = 5 months, 5 selling months; 6 a year gives 2.5 deals; 300,000 booked; 240,000 / 2.5 / 6,000 = 16 months.
  const res = generateSegmentCheck({
    product: "Payment orchestration for online merchants", gross_margin_percent: 60, confirmed: { segment_split: true, seat_cut: true },
    segments: [{ name: "Large online merchants", acv: 120000, sales_cycle_days: 150, cac: 90000, logo_retention_percent: 95, gross_retention_percent: 93, net_retention_percent: 118,
      pricing_unit_in_writing: "We bill per transaction processed", seller_ramp_months: 2, seller_loaded_cost_per_year: 240000, ramped_deals_per_seller_per_year: 6,
      seat_cut_percent: 30, arr_share_cutting_percent: 40 }],
  });
  const s = res.structuredContent.segments[0];
  near(s.retention_and_payback.payback_months_on_cac_and_arr, 9); near(s.retention_and_payback.payback_months_on_gross_profit, 15);
  near(s.seller_capacity.deals_per_seller_year_one, 2.5); near(s.seller_capacity.acv_booked_per_seller_year_one, 300000); near(s.seller_capacity.payback_on_seller_cost_months, 16);
  assert.equal(s.pricing_unit.read_as, "usage");
  // No part of the contract is on seats: 0 points lost, renewal stays 120,000.
  assert.equal(s.seat_cut.retention_points_lost, 0);
  assert.equal(s.seat_cut.renewal_per_account.on_your_pricing, 120000);
  assert.equal(s.seat_cut.gross_retention_after_percent, 93);
  assert.match(res.text, /no part of this contract is billed on seats/);
  // The win rate was not confirmed, so nothing that needs it is computed.
  assert.equal(s.seller_capacity.win_rate_percent_used, null);
  assert.match(res.text, /Waiting for you: qualified opportunities needed/);
});

test("hand-worked set C: security software on a mix of seats and usage", () => {
  // Payback: 50,000 / (80,000 / 12) = 7.5 months; on gross profit at 80%: 50,000 / (64,000 / 12) = 9.375 months.
  // 60% of the contract is on seats. Cut 25%: renewal 80,000 x (1 - 0.6 x 0.25) = 68,000.
  // Accounts with 40% of revenue: 0.4 x 0.25 x 0.6 = 6 points. Gross 91 to 85, net 110 to 104.
  // Capacity: ramp 1.5, cycle 60 days = 2 months, 8.5 selling months; 10 a year: 8.5 x 10 / 12 = 7.0833 deals.
  const res = generateSegmentCheck({
    product: "Threat detection for mid-size enterprises", gross_margin_percent: 80, confirmed: { segment_split: true, seat_cut: true, win_rate: true },
    segments: [{ name: "Mid-size enterprises with a security operations centre", acv: 80000, sales_cycle_days: 60, cac: 50000, logo_retention_percent: 93, gross_retention_percent: 91, net_retention_percent: 110,
      pricing_unit_in_writing: "Priced per analyst seat plus a fee per endpoint protected", seat_share_of_acv_percent: 60, seller_ramp_months: 1.5, ramped_deals_per_seller_per_year: 10,
      seat_cut_percent: 25, arr_share_cutting_percent: 40, gross_retention_gate_percent: 88, net_retention_gate_percent: 105 }],
  });
  const s = res.structuredContent.segments[0];
  assert.equal(s.pricing_unit.read_as, "hybrid");
  near(s.retention_and_payback.payback_months_on_cac_and_arr, 7.5); near(s.retention_and_payback.payback_months_on_gross_profit, 9.375);
  near(s.seat_cut.renewal_per_account.on_your_pricing, 68000); near(s.seat_cut.retention_points_lost, 6);
  near(s.seat_cut.gross_retention_after_percent, 85); near(s.seat_cut.net_retention_after_percent, 104);
  assert.deepEqual(s.seat_cut.gates, { gross_before: "pass", gross_after: "fail", net_before: "pass", net_after: "fail", logo: null });
  near(s.seller_capacity.deals_per_seller_year_one, (8.5 * 10) / 12, 1e-4);
  // Loaded cost was not given: the seller payback is missing, not guessed.
  assert.equal(s.seller_capacity.payback_on_seller_cost_months, null);
});

// Free text: an exact sentence, a same-meaning sentence and an opposite sentence, in each of the nine verticals.
const FREE_TEXT = [
  ["logistics tech", "We charge per dispatcher seat, billed yearly", "seat"],
  ["logistics tech", "Pricing is by the number of users on the dispatch desk", "seat"],
  ["logistics tech", "We do not charge per seat; shippers pay per shipment booked", "usage"],
  ["fintech", "We bill per transaction processed", "usage"],
  ["fintech", "Fees follow payment volume, a few cents on each successful payment", "usage"],
  ["fintech", "We never charge on transaction volume, only a fixed licence per analyst", "seat"],
  ["vertical SaaS", "Salons pay per stylist seat each month", "seat"],
  ["vertical SaaS", "Every stylist who logs in needs a licence", "seat"],
  ["vertical SaaS", "No per user fees; salons pay per booking taken", "usage"],
  ["AI native", "We charge per resolved conversation", "usage"],
  ["AI native", "Customers pay for each task the agent completes", "usage"],
  ["AI native", "We don't price on outcomes; it is a flat fee per named user", "seat"],
  ["ITeS", "We bill per agent seat on the floor", "seat"],
  ["ITeS", "Billing follows the headcount we staff on the account", "seat"],
  ["ITeS", "Not billed by headcount, the client pays per ticket closed", "usage"],
  ["telecom", "We charge per SIM connected", "usage"],
  ["telecom", "The bill is metered on data consumed, by the gigabyte", "usage"],
  ["telecom", "It is not metered; each account buys user licences for the console", "seat"],
  ["cybersecurity", "Priced per analyst seat in the security operations centre", "seat"],
  ["cybersecurity", "We license by the number of analysts using the console", "seat"],
  ["cybersecurity", "We moved away from analyst seats and now charge per endpoint protected", "usage"],
  ["software", "We sell per developer seat", "seat"],
  ["software", "Each engineer on the team needs a paid licence", "seat"],
  ["software", "There are no seats; teams pay for build minutes used", "usage"],
  ["SaaS", "Our plans are per user per month", "seat"],
  ["SaaS", "You pay for every person who has a login", "seat"],
  ["SaaS", "We stopped charging by user and bill on usage instead", "usage"],
];

test("free text: the pricing sentence is read the same way for exact, same-meaning and opposite wording in nine verticals", async () => {
  for (const [vertical, sentence, expected] of FREE_TEXT) {
    assert.equal(readPricingUnit(sentence), expected, `${vertical}: "${sentence}"`);
    // And through the server, where the sentence is escaped first.
    const res = await call({ product: `${vertical} product`, confirmed: { segment_split: true, seat_cut: true },
      segments: [{ name: `${vertical} buyers`, acv: 40000, cac: 20000, gross_retention_percent: 90, net_retention_percent: 100, pricing_unit_in_writing: sentence, seat_cut_percent: 20, arr_share_cutting_percent: 50 }] });
    assert.ok(!res.isError, `${vertical}: "${sentence}" ${res.content[0].text.slice(0, 200)}`);
    const s = res.structuredContent.segments[0];
    assert.equal(s.pricing_unit.read_as, expected, `${vertical} via server: "${sentence}"`);
    // Seats: 0.5 x 0.2 = 10 points off gross, 90 to 80. Usage: nothing moves.
    assert.equal(s.seat_cut.gross_retention_after_percent, expected === "seat" ? 80 : 90, `${vertical}: "${sentence}"`);
  }
});

test("free text: a mix reads as a mix, an unclear sentence stays missing, and a stated choice wins", () => {
  assert.equal(readPricingUnit("A platform fee, then per agent seat and per resolved contact"), "hybrid");
  assert.equal(readPricingUnit("We charge per seat and per API call"), "hybrid");
  assert.equal(readPricingUnit("We have three plans: basic, growth and enterprise"), "unclear");
  assert.equal(readPricingUnit(""), "unclear");
  assert.equal(readPricingUnit("Unlimited seats; priced on revenue processed"), "unclear");
  assert.equal(readPricingUnit("Neither seats nor usage: a fixed yearly subscription"), "unclear");
  assert.equal(readPricingUnit("We do not charge per seat or per user"), "unclear");
  assert.equal(readPricingUnit("Billed by hours worked on the account"), "unclear");
  assert.equal(readPricingUnit(undefined), "unclear");
  const unclear = generateSegmentCheck({ product: "Workflow software", confirmed: { segment_split: true, seat_cut: true },
    segments: [{ name: "Agencies", acv: 30000, cac: 12000, gross_retention_percent: 85, net_retention_percent: 95, pricing_unit_in_writing: "We have three plans: basic, growth and enterprise", seat_cut_percent: 25, arr_share_cutting_percent: 40 }] });
  assert.equal(unclear.structuredContent.segments[0].seat_cut.gross_retention_after_percent, null);
  assert.match(unclear.text, /Agencies, Missing: .*the pricing unit in writing \(seats or usage\)/);
  const chosen = generateSegmentCheck({ product: "Workflow software", confirmed: { segment_split: true, seat_cut: true },
    segments: [{ name: "Agencies", acv: 30000, cac: 12000, gross_retention_percent: 85, net_retention_percent: 95, pricing_unit: "seat", pricing_unit_in_writing: "We bill per transaction processed", seat_cut_percent: 25, arr_share_cutting_percent: 40 }] });
  assert.equal(chosen.structuredContent.segments[0].pricing_unit.read_as, "seat");
  assert.match(chosen.text, /you chose seats as the pricing unit, but your sentence reads as usage/);
});

test("pauses: no sum runs until the split is confirmed; win rate and seat cut each wait for their own confirmation", async () => {
  const input = guide29();
  delete input.confirmed;
  const waiting = await call(input);
  assert.equal(waiting.structuredContent.stage, "waiting_for_confirmation");
  assert.match(waiting.content[0].text, /No sum has been run/);
  assert.doesNotMatch(waiting.content[0].text, /Payback|months/);
  assert.match(waiting.content[0].text, /Confirm your own win rate/);
  assert.match(waiting.content[0].text, /total potential companies: 6,000; average contract value: 60,000/);

  const splitOnly = await call({ ...guide29(), confirmed: { segment_split: true } });
  const reg = splitOnly.structuredContent.segments[0];
  near(reg.retention_and_payback.payback_months_on_cac_and_arr, 9);
  assert.equal(reg.seller_capacity.opportunities_for_target, null);
  assert.deepEqual(reg.seat_cut, { state: "waiting" });
  assert.match(splitOnly.content[0].text, /Waiting for you: the seat cut sums run only after a person confirms/);
  // "true" as text, or any value but true, is not a confirmation.
  const loose = await call({ ...guide29(), confirmed: { segment_split: true, seat_cut: false, win_rate: false } });
  assert.deepEqual(loose.structuredContent.segments[0].seat_cut, { state: "waiting" });
});

test("missing means missing: no figure is filled in", () => {
  const res = generateSegmentCheck({ product: "Recruitment software", confirmed: { segment_split: true, win_rate: true, seat_cut: true }, segments: [{ name: "Staffing agencies", acv: 24000 }, { name: "In-house hiring teams", cac: 8000, gross_retention_percent: 88 }] });
  const [a, b] = res.structuredContent.segments;
  assert.equal(a.retention_and_payback.payback_months_on_cac_and_arr, null);
  assert.equal(b.retention_and_payback.payback_months_on_cac_and_arr, null);
  assert.equal(a.retention_and_payback.payback_months_on_gross_profit, null);
  assert.deepEqual(a.missing, ["CAC", "logo retention", "gross revenue retention", "net revenue retention", "the pricing unit in writing (seats or usage)", "gross margin"]);
  assert.match(res.text, /Payback on CAC and ARR \| Missing: needs ACV and CAC \| Missing: needs ACV and CAC \|/);
  assert.equal(res.structuredContent.tracks_expansion, false);
  assert.doesNotMatch(res.text, /Later years/);
});

test("refusals: a percent typed as a fraction, an impossible retention and too many segments are refused in plain words", async () => {
  const fraction = await call({ product: "Billing software", segments: [{ name: "Clinics", logo_retention_percent: 0.89 }] });
  assert.equal(fraction.isError, true);
  assert.match(fraction.content[0].text, /write logo retention as a percent between 1 and 100, for example 89 for 89%/);
  const over = await call({ product: "Billing software", segments: [{ name: "Clinics", gross_retention_percent: 104 }] });
  assert.equal(over.isError, true);
  const many = generateSegmentCheck({ product: "Billing software", segments: [1, 2, 3, 4, 5].map((n) => ({ name: `Segment ${n}` })) });
  assert.equal(many.isError, true);
  const none = await call({ product: "Billing software" });
  assert.equal(none.isError, true);
  const twins = generateSegmentCheck({ product: "Billing software", segments: [{ name: "Clinics" }, { name: "clinics" }] });
  assert.match(twins.text, /Give each segment its own name/);
});

test("net below gross is flagged, never silently used", () => {
  const res = generateSegmentCheck({ product: "Learning software", confirmed: { segment_split: true }, segments: [{ name: "Universities", acv: 50000, cac: 25000, gross_retention_percent: 92, net_retention_percent: 88 }] });
  assert.match(res.text, /net retention \(88%\) is below gross retention \(92%\)/);
});

test("same inputs give the same output twice", async () => {
  const first = await call(guide29());
  const second = await call(guide29());
  assert.equal(first.content[0].text, second.content[0].text);
  assert.equal(JSON.stringify(first.structuredContent), JSON.stringify(second.structuredContent));
  assert.equal(JSON.stringify(generateSegmentCheck(guide29())), JSON.stringify(generateSegmentCheck(guide29())));
});

test("tools/list grows by exactly one and every existing tool is unchanged", async () => {
  const production = JSON.parse(readFileSync(path.join(here, "fixtures/release-production-tools.json"), "utf8")).tools_list.tools;
  const server = createServer();
  const listed = (await server._requestHandlers.get("tools/list")({ method: "tools/list" })).tools;
  const before = listed.filter((t) => t.name !== TOOL);
  assert.equal(listed.length, before.length + 1);
  assert.equal(before.length, 9);
  assert.equal(listed.at(-1).name, TOOL);
  for (const old of production) {
    const now = before.find((t) => t.name === old.name);
    assert.ok(now, `${old.name} is still listed`);
    assert.equal(now.description, old.description, `${old.name} description`);
    assert.deepEqual(now.inputSchema, old.inputSchema, `${old.name} schema`);
  }
  const tool = listedTools.find((t) => t.name === TOOL);
  assert.equal(tool.title, "Segment and Seat Cut Check");
  assert.deepEqual(tool.annotations, { title: "Segment and Seat Cut Check", readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  assert.deepEqual(tool.inputSchema.required, ["product", "segments"]);
});

test("an existing tool answers as before beside the new one", async () => {
  const res = await call({ customer_segment: "mid-market logistics teams", business_model: "saas_subscription", current_churn_rate: "3% monthly" }, "retention_playbook");
  assert.ok(!res.isError);
  assert.match(res.content[0].text, /^# Churn discovery kit: mid-market logistics teams/);
});

test("buyer text: no dashes, no exclamation marks, no code words, no software named to buy", async () => {
  const outputs = [await call(guide29()), await call({ ...guide29(), confirmed: undefined })];
  for (const res of outputs) {
    const text = res.content[0].text.replace(/https:\/\/\S+/g, "");
    assert.doesNotMatch(text, /[—–]/, "no em or en dash");
    assert.doesNotMatch(text, /!/, "no exclamation mark");
    assert.doesNotMatch(text, /\b[a-z]+_[a-z_]+\b/, "no snake case");
    assert.doesNotMatch(text, /\b[A-Z]{2,}_[A-Z_]+\b|\bMISSING\b/, "no screaming case");
    assert.doesNotMatch(text, /\b(?:Salesforce|HubSpot|Gainsight|Zendesk|Intercom|Stripe|Chargebee|Zuora)\b/, "no software named");
    assert.doesNotMatch(text, /\bPMF\b|product.market fit/i);
  }
});

test("a question about which software to buy goes to the booking, not into the sums", async () => {
  const res = await call({ ...guide29(), product: "Which CRM should we buy to track renewals?" });
  assert.match(res.content[0].text, /calendly\.com\/shashwat-gtmhelix\/45min/);
  assert.equal(res.structuredContent, undefined);
});

test("exact helper sums", () => {
  // 1 + 0.9 + 0.81 = 2.71 years of revenue; 20,000 x 0.5 / 10,000 = 1.00 a year: 2.71 by year 3.
  near(grossProfitPerCacDollar(20000, 0.5, 10000, 0.9, 3), 2.71, 1e-12);
  // A cycle longer than the year leaves no selling months, and no negative deals.
  assert.equal(sellerCapacity(6, 240, 12, 50000, 200000, 0.7).sellingMonths, 0);
  assert.equal(sellerCapacity(6, 240, 12, 50000, 200000, 0.7).dealsYearOne, 0);
  assert.equal(sellerCapacity(6, 240, 12, 50000, 200000, 0.7).paybackOnSellerCostMonths, null);
});
