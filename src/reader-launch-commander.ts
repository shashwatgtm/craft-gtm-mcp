import { readSignal } from './text-signals.js';
import { fact, type ReaderCase } from './reader-case.js';
export function case_launch_commander(args: Record<string,unknown>): ReaderCase {
  const goalText = String(args.goals || '');
  const target = /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+((?:qualified\s+)?(?:(?:pilot|paid|customer|buyer)\s+)?(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups))\b/i.exec(goalText);
  const numbers: Record<string,number> = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12};
  const goal = target && readSignal(goalText, /\b(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups)\b/i).state === 'affirmed'
    ? `${numbers[target[1].toLowerCase()] ?? Number(target[1])} ${target[2].toLowerCase()}`
    : 'the launch outcome still to confirm';
  const dateText = String(args.launch_date || "").trim();
  const date = /^(?:TBD|to be determined|unknown|not set|none)$/i.test(dateText) ? "an unset launch date" : fact(args, "launch_date", "an unset launch date");
  const audience = fact(args, "target_segments", "the intended buyers");
  const channels = fact(args, "available_channels", "the available channels");
  const team = fact(args, "team_size", "the team size answer");
  const product = fact(args, "product_feature", "the proposed offer");
  return {
    meaning: `Plan for ${goal} as a target. Capacity is unverified; reschedule overdue work.`,
    change: `the date, capacity or buyer acceptance check changes`,
    roles: [
      `Founder: have the launch owner agree acceptance with ${audience} before counting commitments.`,
      `CEO: have delivery check ${team} hours by ${date}; cut scope if capacity is short.`,
      `CMO: have owners of ${channels} verify each claim and destination before release.`,
      `CRO: have sales qualify ${audience} for ${goal}; confirm buyer acceptance.`,
      `Demand generation head: check reachable volume on ${channels} with sales against ${goal} before outreach.`,
    ],
  };
}
