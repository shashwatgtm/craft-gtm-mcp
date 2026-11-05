export function satisfactionEvidence(raw) {
    const text = raw.replace(/\\([.!?])/g, '$1').replace(/\b(\d+(?:\.\d+)?)\s*(?:per cent|percent)\b/gi, '$1%');
    const result = {};
    const count = text.match(/\b(\d+)\s+(responses?|respondents?|replies)\b/i) || text.match(/\bn\s*=\s*(\d+)\b/i) || text.match(/\b(\d+)\s+(customers?)\b/i);
    if (count) {
        result.sample = Number(count[1]);
        result.sampleBasis = count[2] || 'responses';
    }
    const a = /([+-]?\d+(?:\.\d+)?)\s*%\s*(?:of\s+(?:the\s+)?(?:users|customers|respondents|responses)\s+)?(?:(?:are|were|would be|said they would be)\s+)?["“']?very\s+disappointed/gi;
    const b = /very\s+disappointed["”']?\s*(?:share|score|responses|users)?\s*(?::|=|is|was|at)?\s*([+-]?\d+(?:\.\d+)?)\s*%/gi;
    for (const match of [...text.matchAll(a), ...text.matchAll(b)]) {
        const before = text.slice(0, match.index).split(/[;\n,.]/).pop() || '';
        if (/\b(?:target|goal|hypothetical|assumed|not|forecast|projected)\b/i.test(before)) {
            result.issue = 'Very disappointed share is not an observed value. Supply the actual survey result and response count.';
            continue;
        }
        const value = Number(match[1]);
        if (value < 0 || value > 100)
            result.issue = 'Very disappointed share must be between 0% and 100%. Supply the actual survey result.';
        else if (result.share !== undefined && result.share !== value)
            result.issue = 'Conflicting very disappointed shares. Supply one observed share and cohort.';
        else
            result.share = value;
    }
    return result;
}
//# sourceMappingURL=satisfaction-evidence.js.map