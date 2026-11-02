import { fact, type ReaderCase } from './reader-case.js';
export function case_crisis_planner(args: Record<string,unknown>): ReaderCase {
  const incident = fact(args, "potential_crises", "the incident description");
  const company = fact(args, "company", "the affected business");
  const customers = fact(args, "customer_base", "the affected customer group");
  const sensitivity = fact(args, "data_sensitivity", "the data sensitivity answer");
  const departure = /\bcustomer\b.{0,80}\b(?:move|leave|switch|cancel)\b/i.test(String(args.potential_crises || ''));
  return {
    meaning: `This is a proposed response for ${company}. It supports incident verification and ownership, not a finding of exposure. Team roles and company size used as defaults are planning assumptions, not confirmed staffing.`,
    change: `incident logs establish different impact, recovery status or exposure; a sensitivity category alone does not confirm a breach`,
    roles: [
      departure ? `Founder: ask the account owner at ${company} to verify the customer's stated intent and renewal date; distinguish a confirmed departure from a concern before promising a response.` : `Founder: ask the incident lead to separate confirmed impact from unknowns in ${incident}; approve no public assurance before the logs support it.`,
      `CEO: confirm an available incident lead for ${company} and the recovery decision they own; check staffing before using the proposed team structure.`,
      `CMO: reconcile every customer update for ${company} with the incident lead's latest timestamped record; remove any unsupported exposure claim.`,
      `CRO: ask account owners to confirm which customers in ${customers} cannot complete their work and the next update they need; do not invent affected account counts.`,
      `Demand generation head: ask the incident lead whether campaigns for ${company} should pause; verify recovery before resuming claims about service availability.`,
    ],
  };
}
