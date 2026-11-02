import { readSignal } from './text-signals.js';
import { fact, type ReaderCase } from './reader-case.js';
export function case_retention_playbook(args: Record<string,unknown>): ReaderCase {
  const reason = fact(args, "churn_reasons", "the reported departure reasons");
  const rate = fact(args, "current_churn_rate", "the churn rate and its period");
  const segment = fact(args, "customer_segment", "the customer cohort");
  const signals = fact(args, "available_data_signals", "the available account records");
  const supportLoss = readSignal(String(args.churn_reasons || ''), /\b(?:withdrew|removed|stopped|ended) (?:local )?support\b/i).state === 'affirmed';
  const bypass = readSignal(String(args.churn_reasons || ''), /\b(?:bypass|bypassing|stopped logging in)\b/i).state === 'affirmed';
  return {
    meaning: `This investigation supports checking account records for ${segment}. It does not establish a cause of churn or justify a discount. Keep the charging model separate from the customer's renewal process.`,
    change: `comparable retained and departed accounts show a different pattern, or an agreed intervention test changes the observed behaviour`,
    roles: [
      `Founder: ask the customer research owner to contrast the reported departure reasons for ${segment} with retained accounts; choose an intervention only after the behaviour is confirmed.`,
      `CEO: have the retention owner verify the denominator and period behind ${rate}; set the review date and cost limit before authorizing a test.`,
      `CMO: compare promises made to ${segment} with the work customers actually complete; ask customer success to confirm a mismatch before revising messaging.`,
      bypass ? `CRO: ask the account owner to observe a handoff that users bypass in ${segment}; test a workflow correction on one task and check actual use before offering a discount.` : supportLoss ? `CRO: have the account owner verify the reported loss of support for ${segment}, confirm which coverage was promised and ask the service owner whether restoration is feasible before making a retention offer.` : `CRO: ask account owners to reconstruct one departure in ${segment} from customer notes and service records; confirm the cause before offering a discount or a workflow change.`,
      `Demand generation head: check ${signals} with the retention owner against the acquisition cohort; stop expanding a segment only when the account evidence supports that choice.`,
    ],
  };
}
