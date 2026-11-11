// Deliberately no usage counter, storage, request logging or third party calls.
import { calculateScalePaidSite } from '../../dist/scale-paid-site.js';
export const MAX_BYTES = 2_000_000;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
export default async function handler(request) {
  // Set this only to the approved Site origin when releasing the craft route.
  // Staging calls the same handler on its own origin and needs no CORS grant.
  const allowedOrigin = typeof process !== 'undefined' ? process.env.SCALE_PAID_SITE_ORIGIN : undefined;
  const origin = request.headers.get('Origin');
  const cors = allowedOrigin && origin === allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
  const responseHeaders = { ...headers, ...cors };
  if (request.method === 'OPTIONS') return new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: responseHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Use the check form to send a result request.' }), { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return new Response(JSON.stringify({ error: 'Send the check as JSON.' }), { status: 415, headers });
  const chunks = []; let size = 0;
  try {
    const reader = request.body?.getReader();
    if (reader) for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return new Response(JSON.stringify({ error: 'The request is too large. Use up to 2,000 rows.' }), { status: 413, headers }); }
      chunks.push(value);
    }
    const data = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { data.set(chunk,offset); offset += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder().decode(data));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Give the check inputs.');
    const result = calculateScalePaidSite(body);
    return new Response(JSON.stringify({ ok: true, result }), { headers: responseHeaders });
  } catch (error) {
    // No exception strings from the platform or parser, which may contain input.
    const message = error instanceof SyntaxError ? 'The check inputs could not be read.' : error instanceof Error && /^(Give |Choose |One time|The floor|Your list)/.test(error.message) ? error.message : 'The check could not run. Check the inputs and try again.';
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 422, headers: responseHeaders });
  }
}
export const config = { path: '/api/scale-paid-check', rateLimit: { windowSize: 60, windowLimit: 20, aggregateBy: ['ip','domain'] } };
