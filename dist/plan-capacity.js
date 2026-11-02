import { clauses } from './text-signals.js';
// Deliberately bounded extraction. A number without a stated unit is not capacity.
// The result is a scenario from supplied figures, never an approval or forecast.
const number = '(?:\\d+(?:\\.\\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
const words = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
function extract(text, context, patterns) {
    const values = [];
    let blocked = false;
    for (const clause of clauses(text)) {
        if (!context.test(clause))
            continue;
        const matches = patterns.flatMap(pattern => [...clause.matchAll(new RegExp(pattern, 'gi'))]);
        if (!matches.length)
            continue;
        // Ranges, conditional figures, denials and per-person rates require clarification.
        if (/\b(?:not|never|no|cannot|can't|isn't|wasn't|didn't|unknown|unmeasured|unconfirmed|maybe|perhaps|might|if|between|per rep|per person|each rep|each person|each account executive)\b|\d\s*(?:to|[-–])\s*\d|[-−]\s*\d/i.test(clause)) {
            blocked = true;
            continue;
        }
        for (const match of matches) {
            const value = words[match[1].toLowerCase()] ?? Number(match[1]);
            if (Number.isFinite(value) && value >= 0)
                values.push(value);
        }
    }
    const unique = [...new Set(values)];
    return { value: !blocked && unique.length === 1 ? unique[0] : undefined, blocked: blocked || unique.length > 1 };
}
export function capacityCheck(text) {
    const target = extract(text, /\btarget|\bgoal|\baim|\bneed|\bwant/i, [`(?:target|goal|aim|need|want)(?:[^.;\\d]{0,45}?)\\b(${number})\\s+(?:new\\s+)?paid customers\\b`, `\\b(${number})\\s+(?:new\\s+)?paid customers\\b.{0,25}\\b(?:target|goal)\\b`]);
    const conversion = extract(text, /conversion|demo.{0,30}sale|demos.{0,30}became sales/i, [`\\b(${number})\\s*(?:%|percent)`, `\\b(${number})\\s+per cent`]);
    const demos = extract(text, /demo/i, [`\\b(${number})\\s+demos?\\s+(?:weekly|per week|a week|each week)\\b`, `\\bweekly demo capacity\\s*(?:is|:|=)\\s*(${number})\\b`]);
    const onboarding = extract(text, /onboard/i, [`\\bonboard\\w*\\s+(?:capacity\\s*(?:is|:|=)\\s*)?(${number})\\s+(?:accounts|customers|fleets)\\s+(?:monthly|per month|a month|each month)\\b`]);
    if ([target, conversion, demos, onboarding].every(x => x.value === undefined && !x.blocked))
        return '';
    const lines = ['**Capacity scenario from supplied figures.** Confirm that the target, conversion sample and capacities cover the same offer and buyer group.'];
    const n = (v) => String(Math.round(v * 100) / 100);
    if (target.value === 0)
        lines.push('The stated target is zero paid customers. Confirm whether acquisition is paused before allocating demo capacity.');
    else if (target.value !== undefined && conversion.value !== undefined && conversion.value > 0 && conversion.value <= 100) {
        const needed = Math.ceil(target.value / (conversion.value / 100));
        lines.push(`${n(target.value)} paid customers at ${n(conversion.value)}% demo to sale conversion require at least ${needed} completed demos (${n(target.value)} / ${n(conversion.value / 100)}, rounded up). This assumes the observed rate persists; a small sample cannot establish that.`);
        if (demos.value === 0)
            lines.push('Stated weekly demo capacity is zero, so this route cannot reach a positive customer target until capacity changes.');
        else if (demos.value !== undefined)
            lines.push(`At ${n(demos.value)} demos per week, that is at least ${Math.ceil(needed / demos.value)} selling weeks (${needed} / ${n(demos.value)}, rounded up). This treats the quoted capacity as the team total; confirm that basis and do not multiply it by headcount.`);
        else
            lines.push('Selling weeks are not calculated: weekly team demo capacity is missing, qualified or conflicting.');
    }
    else if (conversion.value === 0 && target.value !== undefined && target.value > 0)
        lines.push('Observed demo to sale conversion is zero. No finite demo volume follows from that rate; investigate lost deals before approving an acquisition volume.');
    else
        lines.push('Required demos are not calculated: the paid customer target or a valid conversion rate is missing, qualified or conflicting.');
    if (target.value !== undefined && target.value > 0 && onboarding.value !== undefined) {
        lines.push(onboarding.value === 0 ? 'Stated monthly onboarding capacity is zero. Resolve delivery capacity before accepting new paid customers.' : `At ${n(onboarding.value)} onboarded accounts per month, ${n(target.value)} customers require at least ${Math.ceil(target.value / onboarding.value)} onboarding months. Confirm that every won customer needs one onboarding slot.`);
    }
    else
        lines.push('Onboarding duration is not calculated without a clear target and monthly onboarding capacity.');
    lines.push('The selling and onboarding periods may overlap; do not add them together. No completion date is inferred. The plan owner must supply the start date, usable selling weeks and delivery schedule before approving a deadline.');
    return lines.join(' ');
}
//# sourceMappingURL=plan-capacity.js.map