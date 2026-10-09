// Run 21b late task (test first): the launch lines of each vertical in src/sector-playbooks.ts (pains, next step, launch tasks, channels,
// adoption measure, checklist) were written for one kind of company per vertical (hub pilots and driver apps, month-end close, FMCG outlets
// and distributors, enterprise connectivity sites, cloud posture, test suites). launch_commander printed them for every company of the vertical.
// Now the neutral entry of each vertical holds lines true for every company in it, and the lines of one kind sit under its sub-type.
// Companies are described in plain words, no names. Run: npm run build && node --test tests/run21-tables-craft-gtm.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
async function launch(product, industry, extra = {}) {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "launch_commander", arguments: {
      product_feature: product, launch_type: "feature_launch", target_segments: "mid-size companies", goals: "20 qualified meetings (hypothetical)", industry, ...extra } } }),
  }));
  const j = await r.json();
  assert.equal(!!j.result.isError, false);
  return j.result.content.map((c) => c.text).join("\n");
}
const NO_DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

// Lines the table used to hold for every company of the vertical.
const LAST_MILE = /Choose the pilot hub or city|Driver app tested offline|Test the driver app offline|dispatch plans that break|failed first-attempt deliveries|drivers active in the app|operations roundtable or hub visit/i;
const SPEND = /month-end close|ERP or ledger posting guide|share of transactions posted|chart of accounts|spend, claims or invoices|one entity or department/i;
const FMCG = /Choose the pilot region and the distributors|low-end phones|reps who capture orders|trade schemes|distributor stock|DMS|Rep incentives|field visit to a pilot region|one region with a set of distributors/i;
const CONNECTIVITY = /site survey|wave plan with fallback links|branch or site links|sites live per wave|rate-card comparison in cost per site|uptime and repair time at the pilot sites/i;
const CLOUD = /unknown assets, clouds or exposures|cloud accounts|assets covered/i;
const TESTING = /slowed by tests, builds or manual checks|migrate one existing test suite/i;

test("logistics tech: last mile delivery gets hub pilot and driver app lines, freight visibility and a plain logistics company do not", async () => {
  const lm = await launch("a last mile delivery platform for courier fleets", "logistics_tech");
  const fv = await launch("a freight visibility platform with shipment tracking across carriers", "logistics_tech");
  const neutral = await launch("Brightline", "logistics_tech");
  assert.match(lm, LAST_MILE);
  assert.doesNotMatch(fv, LAST_MILE);
  assert.doesNotMatch(neutral, LAST_MILE);
  for (const t of [fv, neutral]) { assert.match(t, /Agree a pilot on one lane, site or customer account/); assert.match(t, /## Who the launch speaks to/); }
  for (const t of [lm, fv, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("fintech: spend and expense gets close and ledger lines, a payments platform and a plain fintech company do not", async () => {
  const spend = await launch("a corporate card and expense management platform", "fintech");
  const pay = await launch("a payments API platform that moves money through partner banks", "fintech");
  const neutral = await launch("Brightline", "fintech");
  assert.match(spend, SPEND);
  assert.doesNotMatch(pay, SPEND);
  assert.doesNotMatch(neutral, SPEND);
  for (const t of [pay, neutral]) assert.match(t, /Security and compliance pack ready before the buyer asks/);
  for (const t of [spend, pay, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("vertical SaaS: field sales automation for consumer brands gets outlet and distributor lines, construction software and a plain company do not", async () => {
  const fmcg = await launch("field sales automation for consumer goods brands with distributors", "vertical_saas");
  const build = await launch("a construction management platform for contractors and site teams", "vertical_saas");
  const neutral = await launch("Brightline", "vertical_saas");
  assert.match(fmcg, FMCG);
  assert.doesNotMatch(build, FMCG);
  assert.doesNotMatch(neutral, FMCG);
  for (const t of [build, neutral]) assert.match(t, /Agree a pilot with one team or site/);
  for (const t of [fmcg, build, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("telecom: enterprise connectivity gets site survey and wave lines, a messaging platform and a plain telecom company do not", async () => {
  const conn = await launch("managed SD-WAN and internet leased lines for companies with many branch sites", "telecom");
  const msg = await launch("a messaging platform that sends one time codes and alerts by SMS and chat apps through an API", "telecom");
  const neutral = await launch("Brightline", "telecom");
  assert.match(conn, CONNECTIVITY);
  assert.doesNotMatch(msg, CONNECTIVITY);
  assert.doesNotMatch(neutral, CONNECTIVITY);
  for (const t of [msg, neutral]) assert.match(t, /Agree a pilot on the service where results are worst today/);
  for (const t of [conn, msg, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("cybersecurity: cloud security gets cloud account and exposure lines, email security and a plain security company do not", async () => {
  const cloud = await launch("cloud security that finds misconfigurations and risky access across cloud accounts", "cybersecurity");
  const mail = await launch("an email security product that stops phishing before it reaches inboxes", "cybersecurity");
  const neutral = await launch("Brightline", "cybersecurity");
  assert.match(cloud, CLOUD);
  assert.doesNotMatch(mail, CLOUD);
  assert.doesNotMatch(neutral, CLOUD);
  for (const t of [mail, neutral]) assert.match(t, /Agree a time-boxed proof of value/);
  for (const t of [cloud, mail, neutral]) assert.doesNotMatch(t, NO_DASH);
});

test("software: API and test automation tools get test suite lines, an observability tool and a plain software company do not", async () => {
  const qa = await launch("API testing and test automation tools that let QA teams catch regressions before every release", "software");
  const obs = await launch("an observability platform that collects logs, metrics and traces so engineers can find the cause of incidents", "software");
  const neutral = await launch("Brightline", "software");
  assert.match(qa, TESTING);
  assert.doesNotMatch(obs, TESTING);
  assert.doesNotMatch(neutral, TESTING);
  for (const t of [obs, neutral]) assert.match(t, /Start a trial with one team on one real project/);
  for (const t of [qa, obs, neutral]) assert.doesNotMatch(t, NO_DASH);
});
