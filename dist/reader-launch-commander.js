import { readSignal, launchAcquisitionPaused } from './text-signals.js';
import { fact } from './reader-case.js';
export function case_launch_commander(args) {
    const goalText = String(args.goals || '');
    const target = /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+((?:qualified\s+)?(?:(?:pilot|paid|customer|buyer)\s+)?(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups))\b/i.exec(goalText);
    const numbers = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    const goal = target && readSignal(goalText, /\b(?:commitments|meetings|customers|trials|accounts|approvals|pilots|demos|signups)\b/i).state === 'affirmed'
        ? `${numbers[target[1].toLowerCase()] ?? Number(target[1])} ${target[2].toLowerCase()}`
        : 'the launch outcome still to confirm';
    const paused = launchAcquisitionPaused(goalText);
    const zero = /^0\s/.test(goal);
    const unknown = goal === 'the launch outcome still to confirm';
    const dateText = String(args.launch_date || "").trim();
    const date = /^(?:TBD|to be determined|unknown|not set|none)$/i.test(dateText) ? "an unset launch date" : fact(args, "launch_date", "an unset launch date");
    const audience = fact(args, "target_segments", "the intended buyers");
    const channels = fact(args, "available_channels", "the available channels");
    const sizes = { solo: 'one person', small_2_5: 'a team of 2 to 5', medium_6_15: 'a team of 6 to 15', large_15_plus: 'a team of 15 or more' };
    const team = sizes[String(args.team_size)] || fact(args, "team_size", "the proposed team");
    const product = fact(args, "product_feature", "the proposed offer");
    return {
        meaning: paused ? 'Acquisition is paused by the supplied goal. Use this answer to establish readiness and the conditions for resuming.' : unknown ? 'The launch outcome is undecided. Agree an observable outcome and confirm capacity before dating work.' : `Plan for ${goal} as a target. Confirm capacity before dating work.`,
        change: `the date, capacity or buyer acceptance check changes`,
        roles: [
            paused ? `Founder: have the launch owner confirm what must be ready before outreach to ${audience} resumes; keep the pause until that evidence is accepted.` : `Founder: have the launch owner agree acceptance with ${audience} before counting commitments.`,
            `CEO: have delivery confirm available hours for ${team} by ${date}; cut scope if short.`,
            paused ? `CMO: have owners of ${channels} confirm that scheduled acquisition messages respect the pause; record what preparation may continue.` : `CMO: have owners of ${channels} verify each claim and destination before release.`,
            paused || zero ? `CRO: have sales confirm that no new commitments are being requested from ${audience}; agree the readiness check before proposing a new target.` : unknown ? `CRO: have sales and the launch owner agree an observable outcome for ${audience}; record buyer acceptance before assigning a target.` : `CRO: have sales qualify ${audience} for ${goal}; confirm buyer acceptance.`,
            paused || zero ? `Demand generation head: check scheduled activity on ${channels} with sales; hold new acquisition until the owner agrees a revised target.` : unknown ? `Demand generation head: have sales agree the outcome and reachable audience on ${channels}; check both before scheduling outreach.` : `Demand generation head: check reachable volume on ${channels} with sales against ${goal} before outreach.`,
        ],
    };
}
//# sourceMappingURL=reader-launch-commander.js.map