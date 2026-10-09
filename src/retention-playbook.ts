import { writeRetentionPlaybook } from './rw-launch.js';

// Run 22 (writer cg-w2): the retention playbook (or the churn discovery kit when no reasons are given) is written by writeRetentionPlaybook in src/rw-launch.ts.
export function generateRetentionPlaybook(args: {
  customer_segment: string;
  business_model: string;
  current_churn_rate: string;
  churn_reasons?: string;
  available_data_signals?: string;
  cs_team_size?: string;
  current_interventions?: string;
  product?: string;
  industry?: string;
}): string {
  return writeRetentionPlaybook(args);
}
