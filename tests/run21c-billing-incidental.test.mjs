// Run 21c round 5 (test first, a judge's wrong sector finding): a long go-to-market plan for a construction platform that says once "streamline billing and payment"
// was read as SaaS billing and revenue operations (CFO signs, dunning, proration). One incidental billing word in a long document is not a billing seller.
// Run: npm run build && node --no-warnings --test tests/run21c-billing-incidental.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const mod = await import(new URL("../src/verticals.ts", import.meta.url));
const { detectVertical, isBillingSeller } = mod;

const PLAN = `Gridbeam go-to-market plan for next quarter. Goal: a hypothetical pipeline from civil and infrastructure contractors.
Audience: owners, general contractors, specialty contractors and other project stakeholders in the construction industry.
Buyer roles: President and CFO, project teams and field crews, financial teams, IT teams, financial controller, owners.
Message: Gridbeam helps when processes take people away from the project, things slow down, mistakes get made and costs spiral out of control; teams work from disconnected spreadsheets, manual workflows and fragmented tools instead of one source of truth; keep projects on schedule and on budget, protect margins, manage change in real time and streamline billing and payment.
How we differ: unlimited users and unlimited data under a volume based annual price instead of per seat licenses, and a platform built for construction by construction professionals that connects office and field on one data layer.
What buyers use today: disconnected spreadsheets and manual workflows; on premise servers; construction software that charges per seat and adds hidden fees.`;

test("one incidental billing word in a long plan does not make the seller a billing company", () => {
  assert.equal(isBillingSeller({ seller: [PLAN] }), false);
  const v = detectVertical({ seller: [PLAN] });
  assert.ok(!v || !/billing/i.test(v.name), v && v.name);
});

test("a short seller description that sells billing still reads as billing", () => {
  assert.equal(isBillingSeller({ seller: ["Subscription billing, invoicing and revenue recognition software for SaaS companies"] }), true);
  assert.equal(isBillingSeller({ seller: ["Usage-based billing and metering platform"] }), true);
});
