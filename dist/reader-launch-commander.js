import { readSignal } from './text-signals.js';
import { fact } from './reader-case.js';
export function case_launch_commander(args) {
    const goalText = String(args.goals || '');
    const target = /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+((?:qualified\s+)?(?:(?:pilot|paid|customer|buyer)\s+)?(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups))\b/i.exec(goalText);
    const numbers = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    const goal = target && readSignal(goalText, /\b(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups)\b/i).state === 'affirmed'
        ? `${numbers[target[1].toLowerCase()] ?? Number(target[1])} ${target[2].toLowerCase()} as a target, not an achieved result`
        : 'the stated launch outcome, with its acceptance condition still to confirm';
    const dateText = String(args.launch_date || "").trim();
    const date = /^(?:TBD|to be determined|unknown|not set|none)$/i.test(dateText) ? "an agreed launch date, which is not set yet" : fact(args, "launch_date", "an agreed launch date, which is not set yet");
    const audience = fact(args, "target_segments", "the intended buyers");
    const channels = fact(args, "available_channels", "the available channels");
    const team = fact(args, "team_size", "the team size answer");
    const product = fact(args, "product_feature", "the proposed offer");
    return {
        meaning: `This sequence supports planning for ${goal} by ${date}. A team size category does not establish hours or delivery capacity. Overdue steps need rescheduling before the plan can be approved.`,
        change: `the date, available hours, qualified buyer response or pilot acceptance condition changes; reduce scope when the workload cannot fit`,
        roles: [
            `Founder: ask the launch owner to define the buyer acceptance check with ${audience}; count commitments only after that check is agreed.`,
            `CEO: ask the delivery owner to translate ${team} into available hours through ${date}; remove tasks or move the date if the workload exceeds them.`,
            `CMO: assign a channel owner to ${channels}; verify the launch claim and a working destination before releasing each asset.`,
            `CRO: qualify ${audience} against ${goal}; agree who accepts a pilot and what evidence makes a commitment count.`,
            `Demand generation head: estimate reachable contacts through ${channels} using observed response rates; reconcile the required volume with ${goal} before outreach.`,
        ],
    };
}
//# sourceMappingURL=reader-launch-commander.js.map