import { readSignal } from './text-signals.js';
/** Deterministic metric reader. Never score a target, negation or conflicting pair as an observed fact. */
export interface MetricReading { values: Record<string, number>; currencies: Record<string, string>; evidence: string[]; issues: string[]; retentionIsNet: boolean; retentionBasis?: 'logo' | 'gross_revenue' | 'net_revenue' | 'unspecified'; churnMonths?: number }
export function readPMFMetrics(raw: string): MetricReading {
  const result: MetricReading = { values: {}, currencies: {}, evidence: [], issues: [], retentionIsNet: false };
  const currency = '(?:\\b(?:USD|INR|SGD|EUR|GBP|AED|SAR|CAD|AUD|NZD|HKD|JPY|CNY|CHF|ZAR|BRL|MXN|KRW|SEK|NOK|DKK|PLN|TRY|IDR|MYR|THB|PHP|VND)\\b|US\\$|HK\\$|NZ\\$|S\\$|A\\$|C\\$|₹|€|£|¥|\\$)';
  const currencyName = (value: string) => ({'₹':'INR','€':'EUR','£':'GBP','US$':'USD','S$':'SGD','A$':'AUD','C$':'CAD','HK$':'HKD','NZ$':'NZD'} as Record<string,string>)[value.toUpperCase()] || value.toUpperCase();

  // Consume numeric notation as a whole. Unsupported units and intervals must
  // never leave a truncated prefix available to the scalar scoring rules.
  const numericText=raw.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'');
  const unsupported = /\d[\d,]*(?:\.\d+)?\s*(?:lakhs?|lacs?|crores?|thousand|million|billion|basis\s+points?|bps)\b|\d(?:\.\d+)?e[+-]?\d+\b|\d[\d,]*(?:\.\d+)?\s*(?:[kmb]\b)?\s*%?\s*(?:to|[-–—])\s*(?:(?:USD|INR|GBP|EUR|CAD|SGD)\s*|[$£€₹]\s*)?[+-]?\d|\bas\s+a\s+fraction\b/i.exec(numericText);
  if(unsupported){result.issues.push('Unsupported numeric unit or interval: "'+unsupported[0]+'". Supply one confirmed scalar in ordinary currency units or percent, with its measurement period. No numeric prefix has been scored.');return result;}

  const definitions: [string, string, number, number][] = [
    ['churn', '(?:(?:monthly|annual|yearly|quarterly)\\s+)?(?:logo\\s+)?churn(?:\\s+rates?)?', 0, 100],
    ['nps', '(?:nps|net promoter score)', -100, 100],
    ['ltv', '(?:ltv|(?:customer )?lifetime value)', 0, Infinity], ['cac', '(?:cac|customer acquisition cost)', 0, Infinity],
    ['mrr', '(?:mrr|monthly recurring revenue)', 0, Infinity],
    ['arr', '(?:arr|annual recurring revenue)', 0, Infinity],
    ['acv', '(?:acv|annual contract value|average contract value)', 0, Infinity],
    ['retentionRate', '(?:(?:net revenue|gross revenue|net|gross|customer|logo)\\s+)?retention(?:\\s+rates?)?|nrr', 0, Infinity],
    ['activationRate', 'activation(?:\\s+rates?)?', 0, 100],
  ];
  for (const [key, label, min, max] of definitions) {
    const money = ['ltv','cac','mrr','arr','acv'].includes(key);
    const unit = money ? '(?:'+currency+')?' : '\\$?';
    const pattern = new RegExp('\\b(' + label + ')\\b\\s*(?::|=|is|of|was)?\\s*'+unit+'\\s*([+-]?\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:([kmb])\\b)?\\s*(%)?'+(money?'\\s*(?:'+currency+')?':''), 'gi');
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
      // A transport-escaped sentence stop can leave its escape after splitting.
      const sentence = (before+match[0]+after).trim().replace(/\\$/, '');
      const unobserved = /\b(?:target|goal|forecast|projected|projection|assumed|assumption|illustrative|hypothetical|expected|incorrect|invalid|withdrawn|retracted|not(?: an?| the)? (?:actual|measured|observed)|not achieved|actual is|was wrong)\b/i;
      // A directly attached correction can follow a full stop. Do not borrow a
      // qualification from a different metric or an unrelated revenue forecast.
      const following = raw.slice(index + match[0].length).match(/^[^.\n;]*\.\s*((?:(?:this|that)\s+(?:value|figure|metric|result)|the\s+(?:value|figure|metric|result)|(?:the\s+)?(?:nps|churn|ltv|cac|retention|activation)\s+(?:value|figure|metric|result))\b[^.\n;]*)/i)?.[1] || '';
      const refersToMetric = !/\b(?:nps|churn|ltv|cac|retention|activation)\b/i.test(following) || new RegExp('\\b'+label+'\\b','i').test(following);
      if (/\b(?:not|never|no longer|aim)\b/i.test(before.slice(-55)) || unobserved.test(before.slice(-55)) || unobserved.test(after) || (refersToMetric && unobserved.test(following))) {
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
      if (money) {
        const units = [...new Set((match[0].match(new RegExp(currency,'gi')) || []).map(currencyName))];
        const prior = result.currencies[key];
        if (units.length > 1 || (prior && units.length && prior !== units[0])) {
          result.issues.push(`${key}: conflicting currency units; confirm one amount and currency before comparison.`);continue;
        }
        if (units[0]) result.currencies[key] = units[0];
      }
      if (key === 'churn') {
        // Read the period only in this metric's clause, never from a neighbouring measure.
        const clause = (before.split(/,(?!\d)/).pop() + match[0] + after).trim();
        const periods: [number, RegExp][] = [
          [12, /\b(?:annual(?:ly)?|yearly|per year|a year|(?:over|in|during) (?:twelve|12) months)\b/i],
          [3, /\b(?:quarterly|per quarter|(?:over|in|during) (?:three|3) months)\b/i],
          [1, /\b(?:monthly|per month|a month|(?:over|in|during) (?:one|a|1) month)\b/i],
        ];
        const found = periods.filter(([,pattern]) => readSignal(clause, pattern).state === 'affirmed').map(([months]) => months);
        if (found.length > 1 || (result.churnMonths !== undefined && found.length && result.churnMonths !== found[0])) {
          result.issues.push('churn: conflicting periods; give one confirmed measure and period.');
        }
        result.churnMonths = found[0];
      }
      result.values[key]=value;
      if (key==='retentionRate') {
        const basis = net ? 'net_revenue' : /\b(?:logo|customer)\b/i.test(match[1]) ? 'logo' : /\bgross\b/i.test(match[1]) ? 'gross_revenue' : 'unspecified';
        if (result.retentionBasis && result.retentionBasis !== basis) result.issues.push('retentionRate: different retention bases were supplied; choose one confirmed measure for this comparison.');
        result.retentionIsNet=net; result.retentionBasis=basis;
      }
      result.evidence.push(`${match[1]}: "${match[0]}"`);
    }
  }
  if (result.values.ltv !== undefined && result.values.cac !== undefined) {
    const ltvCurrency=result.currencies.ltv, cacCurrency=result.currencies.cac;
    if (!ltvCurrency || !cacCurrency || ltvCurrency !== cacCurrency) {
      result.issues.push(`ltvCacRatio: currency units are ${ltvCurrency || 'not supplied'} for lifetime value and ${cacCurrency || 'not supplied'} for acquisition cost. Supply comparable amounts in the same stated currency and the conversion basis before calculating a ratio. No exchange rate has been assumed.`);
    }
  }
  return result;
}
