/** Deterministic metric reader. Never score a target, negation or conflicting pair as an observed fact. */
export interface MetricReading { values: Record<string, number>; evidence: string[]; issues: string[]; retentionIsNet: boolean }
export function readPMFMetrics(raw: string): MetricReading {
  const result: MetricReading = { values: {}, evidence: [], issues: [], retentionIsNet: false };
  const definitions: [string, string, number, number][] = [
    ['churn', '(?:monthly\\s+)?churn(?:\\s+rates?)?', 0, 100],
    ['nps', '(?:nps|net promoter score)', -100, 100],
    ['ltv', 'ltv', 0, Infinity], ['cac', 'cac', 0, Infinity],
    ['retentionRate', '(?:(?:net revenue|gross revenue|net|gross|customer|logo)\\s+)?retention(?:\\s+rates?)?|nrr', 0, Infinity],
    ['activationRate', 'activation(?:\\s+rates?)?', 0, 100],
  ];
  for (const [key, label, min, max] of definitions) {
    const pattern = new RegExp('\\b(' + label + ')\\b\\s*(?::|=|is|of|was)?\\s*\\$?\\s*([+-]?\\d[\\d,]*(?:\\.\\d+)?)\\s*([kmb])?\\s*(%)?', 'gi');
    const matches = [...raw.matchAll(pattern)];
    // Common percentage-first forms remain scoped to the named measure.
    if (!matches.length && ['churn','retentionRate','activationRate'].includes(key)) {
      const reversed = new RegExp('([+-]?\\d+(?:\\.\\d+)?)\\s*%\\s*(' + label + ')\\b','gi');
      for (const m of raw.matchAll(reversed)) {const fake = [m[0],m[2],m[1],undefined,'%'] as unknown as RegExpExecArray;fake.index=m.index ?? 0;matches.push(fake);}
    }
    for (const match of matches) {
      const index = match.index ?? 0;
      const before = raw.slice(0,index).split(/[;\n]|(?<!\d)\.(?!\d)/).pop() ?? '';
      const after = raw.slice(index + match[0].length).split(/[;\n]|,(?!\d)|(?<!\d)\.(?!\d)/)[0];
      const sentence = (before+match[0]+after).trim();
      if (/\b(?:not|never|no longer|target|goal|forecast|aim|expected)\b/i.test(before.slice(-55)) || /\b(?:target|goal|not actual|not achieved|actual is|was wrong)\b/i.test(after)) {
        result.issues.push(`${key}: the fact was not clear; confirm the observed value. Read: "${sentence}".`); continue;
      }
      let value = Number(match[2].replace(/,/g,''));
      const suffix = (match[3] ?? '').toLowerCase();
      if (suffix) value *= ({k:1e3,m:1e6,b:1e9} as Record<string,number>)[suffix];
      const net = /\bnrr\b|\bnet\b/i.test(match[1]);
      const upper = key==='retentionRate' && !net ? 100 : max;
      if (!Number.isFinite(value) || value < min || value > upper || (key==='cac' && value===0)) {
        result.issues.push(`Invalid metric: ${match[1]} must be ${key==='cac'?'greater than 0':Number.isFinite(upper)?`between ${min} and ${upper}`:`at least ${min}`}. Read: "${match[0]}".`);continue;
      }
      if (result.values[key] !== undefined && result.values[key] !== value) {
        result.issues.push(`${key}: conflicting values or bases; give one confirmed measure and period. Read: "${match[0]}".`);continue;
      }
      result.values[key]=value;
      if (key==='retentionRate')result.retentionIsNet=net;
      result.evidence.push(`${match[1]}: "${match[0]}"`);
    }
  }
  return result;
}
