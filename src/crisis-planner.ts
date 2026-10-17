import { writeCrisisPlan } from './rw-launch.js';

// Run 22 (writer cg-w2): the crisis plan is written by writeCrisisPlan in src/rw-launch.ts.
export function generateCrisisPlanner(args: {
  company: string;
  industry: string;
  customer_base: string;
  data_sensitivity: string;
  potential_crises?: string;
  company_size?: string;
  compliance_requirements?: string;
  business_model?: string;
}): string {
  return writeCrisisPlan(args);
}
