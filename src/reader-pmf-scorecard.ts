import { fact, type ReaderCase } from './reader-case.js';
export function case_pmf_scorecard(args: Record<string,unknown>): ReaderCase {
  const metrics = fact(args, "current_metrics", "the supplied metrics");
  const retention = fact(args, "current_metrics", "the retention measure and cohort", new RegExp("retention|churn", 'i'));
  const product = fact(args, "product", "the product");
  const market = fact(args, "target_market", "the selected market");
  const model = fact(args, "business_model", "the charging model");
  return {
    meaning: `This score supports a comparison of ${metrics} with example benchmark rules. It does not establish fit beyond the sample. Any assumed time in market is not evidence of product maturity.`,
    change: `verified cohort size, retention period, acquisition cost or a more comparable benchmark changes the comparison`,
    roles: [
      `Founder: ask the research owner which observation would contradict fit for ${product}; check losses and nonusers before treating a favourable score as validation.`,
      `CEO: ask finance to reconcile ${metrics} over consistent periods; hold increased spending until the source and cohort are checked.`,
      `CMO: check whether the benchmark for ${market} matches the actual buyer, stage and charging model; report mismatches instead of choosing the most favourable score.`,
      `CRO: have customer success reconcile ${retention} with renewals and lost accounts; distinguish logo retention from revenue retention before changing sales targets.`,
      `Demand generation head: have the analytics owner separate acquisition and activation cohorts for ${product}; rerun with observed retention before scaling the next cohort.`,
    ],
  };
}
