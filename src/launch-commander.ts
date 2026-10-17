import { writeLaunchPlan } from './rw-launch.js';

// Run 22 (writer cg-w2): the launch plan is written by writeLaunchPlan in src/rw-launch.ts (a finished plan built from every input, not a scaffold).
export function generateLaunchCommander(args: {
  product_feature: string;
  launch_type: string;
  target_segments: string;
  goals: string;
  launch_date?: string;
  available_channels?: string;
  team_size?: string;
  budget_level?: string;
  business_model?: string;
  industry?: string;
}): string {
  return writeLaunchPlan(args);
}
