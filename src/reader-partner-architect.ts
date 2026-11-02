import { fact, type ReaderCase } from './reader-case.js';
export function case_partner_architect(args: Record<string,unknown>): ReaderCase {
  const goal = fact(args, "partner_goals", "the partner recruitment goal");
  const history = fact(args, "existing_partners", "the existing partner evidence");
  const amount = fact(args, "your_deal_size", "the proposed deal amount");
  const capacity = fact(args, "partner_support_capacity", "the support capacity answer");
  const product = fact(args, "product", "the offer");
  return {
    meaning: `This plan supports qualifying partners for ${goal}. Recruitment is not closed revenue. Example tiers and economics are not agreed commercial terms.`,
    change: `a qualified introduction produces a buyer accepted next step, or delivery cost and attribution evidence change the proposed economics`,
    roles: [
      `Founder: ask the partnership owner to show one credible introduction route for ${goal}; qualify access before adding partners to a target count.`,
      `CEO: check ${capacity} with the support owner against the pilot workload; approve capacity and terms before promising partner service levels.`,
      `CMO: verify ${history} with the partnership owner before describing the motion as successful; keep introductions and paid accounts separate.`,
      `CRO: trace the outcome of each introduction in ${history} with the account owner; agree a buyer qualification check before requesting the next introduction.`,
      `Demand generation head: test partner invitations around ${product}; have sales confirm the buyer need and ${amount} before counting a sourced opportunity.`,
    ],
  };
}
