export function satisfactionEvidence(raw: string): {sample?: number; sampleBasis?: string; share?: number; issue?: string} {
  const text = raw.replace(/\\([.!?])/g, '$1').replace(/\b(\d+(?:\.\d+)?)\s*(?:per cent|percent)\b/gi,'$1%');
  const result: {sample?: number; sampleBasis?: string; share?: number; issue?: string} = {};
  const count = text.match(/\b(\d+)\s+(responses?|respondents?|replies)\b/i) || text.match(/\bn\s*=\s*(\d+)\b/i) || text.match(/\b(\d+)\s+(customers?)\b/i);
  if (count) {result.sample=Number(count[1]);result.sampleBasis=count[2] || 'responses';}
  const a = /([+-]?\d+(?:\.\d+)?)\s*%[^;\n.!?%,]{0,160}?["“']?very\s+disappointed/gi;
  const b = /very\s+disappointed["”']?\s*(?:share|score|responses|users|without the product|if (?:the )?product (?:went away|were gone|disappeared))?\s*(?::|=|is|was|at)?\s*([+-]?\d+(?:\.\d+)?)\s*%/gi;
  for(const match of [...text.matchAll(a),...text.matchAll(b)]) {
    // A percentage of renewals or a vague subset is not a survey share.
    if (/\b(?:renewed|retained|churned|purchased|few|some|minority|majority)\b/i.test(match[0])) continue;
    const before=text.slice(0,match.index).split(/[;\n,.]/).pop() || '';
    if (/\b(?:target|goal|hypothetical|assumed|not|forecast|projected)\b/i.test(before) || /\b(?:target|goal|hypothetical|assumed|not|never|forecast|projected)\b/i.test(match[0])) {result.issue='Very disappointed share is not an observed value. Supply the actual survey result and response count.';continue;}
    const value=Number(match[1]);
    if(value<0||value>100)result.issue='Very disappointed share must be between 0% and 100%. Supply the actual survey result.';
    else if(result.share!==undefined&&result.share!==value)result.issue='Conflicting very disappointed shares. Supply one observed share and cohort.';
    else result.share=value;
  }
  return result;
}
