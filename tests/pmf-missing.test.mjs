import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../netlify/functions/mcp.mjs';

async function call(args) {
  const response = await handler(new Request('https://local.invalid/mcp', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', method: 'tools/call', id: 1,
      params: {name: 'pmf_scorecard', arguments: args}})
  }));
  const message = await response.json();
  assert.ok(message.result && !message.result.isError, JSON.stringify(message).slice(0,500));
  return message.result;
}

const products = [
  [
    "B2B SaaS",
    "Subscription billing software"
  ],
  [
    "fintech",
    "Payment reconciliation"
  ],
  [
    "HR tech",
    "Shift scheduling software"
  ],
  [
    "sales tech",
    "Call coaching software"
  ],
  [
    "ops tech",
    "Equipment maintenance planning"
  ],
  [
    "ITeS",
    "Managed application support"
  ],
  [
    "AI-native",
    "Support agent with human escalation"
  ],
  [
    "cybersecurity",
    "Cloud exposure management"
  ],
  [
    "martech",
    "Consent measurement software"
  ]
];
for (const [vertical, product] of products) {
  test(vertical + ' distinguishes missing evidence from a scored zero', async () => {
    const args = {product, target_market: 'enterprise_saas', current_metrics: 'MRR: $24,000'};
    const result = await call(args);
    assert.deepEqual(await call(args), result);
    const text = result.content[0].text;
    assert.doesNotMatch(text, /\b0\/10\b|\*\*Pre-PMF\*\*/);
    assert.match(text, /Overall PMF Assessment[\s\S]*?MISSING/);
    assert.match(text, /supply|provide|give/i);
    assert.match(text, /retention|churn/i);
  });
}
