// Run 20 round 1 (quality, D92): what the planning tools need to know about each of the owner's nine sectors beyond the reader
// data in src/verticals.ts (which stays byte identical to the shared copy). Same rule as that file (B82): vocabulary, roles,
// workflows, partner types, kinds of crisis, next steps. NO statistic, market size, benchmark, price, timing claim or named
// company. Every line is a pattern to confirm with the user's own data, and the tools say so where they print it.
import type { BusinessModel, VerticalId } from './verticals.ts';

export interface PartnerKinds { refer: string[]; resell: string[]; integrate: string[]; implement: string[]; }
export interface Playbook {
  /** What buyers in this sector are usually trying to fix (to confirm in discovery, never presented as a fact about one buyer). */
  pains: string[];
  /** The one next step a buyer in this sector is asked to take after a first conversation. */
  cta: string;
  /** Tasks a launch in this sector needs on top of the generic plan, in launch order. */
  launchTasks: string[];
  /** Channels that reach this sector's buyers (used when the user names none). */
  channels: string[];
  /** What "adoption" means for a launch in this sector, and where it is read. */
  adoption: { measure: string; source: string };
  /** Who can refer, resell, integrate with or implement for a seller in this sector (kinds of company, never names). */
  partners: PartnerKinds;
  /** Why a seller in this sector asks for each kind of partner. */
  partnerWhy: string;
  /** Deeper interview questions for this sector (in addition to the ones in verticals.ts). */
  deepQuestions: string[];
  /** The crises that matter most here, as short plain titles, beyond the generic set. */
  crises: Array<{ key: string; title: string; what: string; first: string[]; tell: Array<{ who: string; how: string; focus: string }> }>;
  /** How an outage and a data breach look in this sector (one sentence each). */
  outage: string;
  breach: string;
  /** Reasons customers leave, sector specific (added to the model's list). */
  churnReasons: string[];
  /** A sentence about renewal in this sector. */
  renewal: string;
  /** Checks before a launch goes out. */
  checklist: string[];
}

export const PLAYBOOKS: Record<VerticalId, Playbook> = {
  'logistics-tech': {
    pains: ['dispatch plans that break when orders, drivers or roads change after vehicles have left', 'failed first-attempt deliveries caused by addresses, time windows or driver allocation', 'a cost per delivery that nobody can explain by route, hub or carrier'],
    cta: 'Agree a pilot at one hub or city, with the baseline cost per delivery and first-attempt delivery measured before it starts',
    launchTasks: ['Choose the pilot hub or city and write down its baseline cost per delivery and first-attempt delivery rate', 'Check the integration path with the TMS, WMS and order systems the first accounts run', 'Test the driver app offline on the phones the drivers carry'],
    channels: ['account-based email to named operations and supply chain leaders', 'LinkedIn posts from your experts and customers', 'operations roundtable or hub visit', 'trade event or association meeting'],
    adoption: { measure: 'hubs or cities live, drivers active in the app, and first-attempt delivery rate at the pilot hub', source: 'your dispatch and driver app data' },
    partners: { refer: ['supply chain and logistics consultants', 'ERP, TMS and WMS implementers who already sit with the Head of Supply Chain', '3PL and carrier networks that advise shippers'], resell: ['regional logistics software resellers', 'systems integrators with a transport practice'], integrate: ['TMS, WMS, ERP and order management vendors', 'telematics and driver app vendors', 'address and map data providers'], implement: ['ERP and supply chain systems integrators', 'logistics process consultancies'] },
    partnerWhy: 'The Head of Supply Chain and the COO already take advice from consultants and integrators who run their TMS, WMS and ERP, and a pilot needs those systems connected.',
    deepQuestions: ['What changes in your volumes during the busiest weeks, and what breaks first?', 'How do drivers and hub staff get their plan for the day, and what do they do when it changes?', 'How are failed deliveries recorded, and who sees the reasons?', 'Which carriers or fleet types (own, contracted, outsourced) must be planned together?'],
    crises: [
      { key: 'dispatch_outage', title: 'Dispatch or routing outage with vehicles on the road', what: 'planning or tracking stops while vehicles are out', first: ['Freeze the last published route plan and send it to hub leads by the fallback channel', 'Tell drivers to continue on their last plan and use the offline app mode', 'Switch dispatchers to manual allocation for orders that arrive during the outage', 'Log every order assigned by hand so it can be reconciled when service returns'], tell: [{ who: 'Operations heads at affected customers', how: 'Call from the account owner', focus: 'Which hubs and routes are affected, the fallback in use, the next update time' }, { who: 'Hub managers and drivers', how: 'Fallback channel agreed in advance', focus: 'Continue on the last plan, record exceptions' }] },
    ],
    outage: 'an outage stops route planning or live tracking while vehicles are still out, so dispatchers fall back to phone calls and the last published plan',
    breach: 'exposure of customer addresses, delivery contacts, driver identities or live vehicle locations',
    churnReasons: ['Pilot hub results did not carry over to other hubs', 'Drivers stopped using the app', 'Integration with the TMS, WMS or ERP kept breaking', 'A bigger logistics suite was bundled in'],
    renewal: 'Renewals often follow peak season: the buyer looks back at cost per delivery and first-attempt delivery for the busy weeks.',
    checklist: ['Pilot hub chosen and its baseline measures written down', 'Driver app tested offline on the phones in use', 'TMS, WMS and ERP integration path confirmed with the buyer\'s IT', 'Peak-season dates known, so the pilot does not collide with them'],
  },
  fintech: {
    pains: ['month-end close and reconciliation that take too many manual steps', 'spend, claims or invoices that break policy and are found late', 'audit questions about approvals and controls that take days to answer'],
    cta: 'Agree a pilot on one entity or department, with one month of the buyer\'s own transactions as the test',
    launchTasks: ['Prepare the security and compliance pack (data residency, access controls, audit logs, certifications you actually hold)', 'Write the ERP or ledger posting guide with the finance controller\'s team in mind', 'Plan the cut-over just after a month-end close, with old and new running side by side for one cycle'],
    channels: ['account-based email to CFOs and finance controllers', 'LinkedIn posts from your experts and customers', 'finance leaders roundtable', 'partner and accountant referrals'],
    adoption: { measure: 'entities or departments live, and the share of transactions posted through the product', source: 'your product usage data and the buyer\'s ERP posting records' },
    partners: { refer: ['accounting and audit firms that advise CFOs', 'ERP and HRMS implementation partners', 'banks and card issuers that serve the same finance teams'], resell: ['finance software resellers', 'outsourced accounting providers'], integrate: ['ERP and accounting software vendors', 'banks and payment providers', 'HR and travel systems'], implement: ['ERP implementation partners', 'finance transformation consultancies'] },
    partnerWhy: 'The CFO and Finance Controller take advice from auditors, accountants and the ERP partner, and every deal passes a security and compliance review.',
    deepQuestions: ['Which approvals or policy checks are done by hand today, and who signs them?', 'How are exceptions found: during the month, at close, or at audit?', 'Which entities, currencies or tax regimes must be covered from the start?', 'What must the audit trail show that it does not show today?'],
    crises: [
      { key: 'posting_error', title: 'Wrong postings, payments or reconciliation errors', what: 'transactions are posted, approved or paid wrongly and reach the customer\'s ledger', first: ['Stop the posting or payout job that produced the error', 'List every affected entity, ledger and period', 'Prepare the corrected entries and who approves them', 'Tell the finance controller before month-end close is affected'], tell: [{ who: 'Finance controller and CFO at affected customers', how: 'Call from the account owner, then a written summary', focus: 'What was posted wrongly, the corrected entries, the effect on the close' }, { who: 'Internal audit and compliance contacts', how: 'Written note', focus: 'Facts, controls that failed, the fix' }] },
    ],
    outage: 'an outage stops approvals, card or payment processing or ERP posting, and the finance team falls back to manual approvals and spreadsheets near a close or a payment run',
    breach: 'exposure of financial records, bank details, cardholder data or employee data',
    churnReasons: ['The ERP module closed the gap', 'A control or audit finding the product did not cover', 'Integration with the ledger kept needing fixes', 'The finance owner who chose the product left'],
    renewal: 'Renewals tend to follow the audit and budget cycle: bring the reconciliation and close results for the period.',
    checklist: ['Security and compliance pack ready before the buyer asks', 'ERP posting path tested with the buyer\'s chart of accounts', 'Cut-over date agreed around a month-end close', 'Claims you make about certifications match what you hold'],
  },
  'vertical-saas': {
    pains: ['reps who capture orders on paper or in several apps, so secondary sales are seen late', 'trade schemes that are not communicated to reps or checked in the outlet', 'distributor stock and order data that are out of sync with the company\'s view'],
    cta: 'Agree a pilot in one region with a set of distributors, with a measured comparison region',
    launchTasks: ['Choose the pilot region and the distributors in it, and record the baseline productive calls and outlet coverage', 'Test the app offline on the low-end phones the reps carry', 'Agree how distributor stock and orders flow back from the DMS before rollout'],
    channels: ['account-based email to sales heads and sales operations', 'LinkedIn posts from your experts and customers', 'field visit to a pilot region', 'industry and sales leaders meetups'],
    adoption: { measure: 'regions and reps live, and productive calls and orders captured in the app per rep', source: 'your app usage data and the buyer\'s secondary sales reports' },
    partners: { refer: ['route-to-market and sales consultancies', 'DMS and ERP integrators who serve the same distributors', 'trade marketing and retail audit agencies'], resell: ['regional software resellers close to FMCG sales teams', 'mobile device and telecom resellers serving field forces'], integrate: ['DMS, ERP and tax or invoicing systems', 'retail audit and image recognition vendors'], implement: ['ERP and DMS integrators', 'change management consultancies for sales teams'] },
    partnerWhy: 'The National Sales Head and Head of Sales Operations take advice from route-to-market consultants, and the rollout depends on the DMS and ERP integrators who already work with the distributors.',
    deepQuestions: ['How does a rep decide which outlets to visit, and who changes the beat plan?', 'What happens to an order captured in an outlet with no network?', 'How do distributors receive and confirm orders today?', 'Which schemes and price lists change in a month, and how fast must reps see them?'],
    crises: [
      { key: 'sync_failure', title: 'Order or distributor data sync failure', what: 'orders captured by reps do not reach distributors, or stock data goes wrong', first: ['Stop automatic pushes to distributor systems', 'Switch reps to offline capture with a daily upload', 'List orders captured during the failure and their status', 'Agree with each distributor how orders are replayed'], tell: [{ who: 'Sales heads and sales operations at affected customers', how: 'Call from the account owner', focus: 'Which regions and distributors are affected, how orders are protected, when sync returns' }, { who: 'Regional managers and reps', how: 'Message through the sales hierarchy', focus: 'Keep capturing orders offline, what not to re-enter' }] },
    ],
    outage: 'an outage stops order capture and beat plans in the field, and reps fall back to paper and phone calls while distributors wait for orders',
    breach: 'exposure of outlet lists, order and price data, distributor terms or rep location data',
    churnReasons: ['Reps went back to old ways of capturing orders', 'The DMS vendor\'s bundled app was good enough', 'Distributor data stayed out of sync', 'The national rollout lost its sponsor'],
    renewal: 'Renewals follow the sales year: show productive calls, outlet coverage and secondary sales in the pilot region against the comparison region.',
    checklist: ['Pilot region, distributors and comparison region agreed', 'Offline order capture tested on low-end phones', 'DMS and ERP data flow confirmed with IT', 'Rep incentives tied to orders captured in the app'],
  },
  'ai-native': {
    pains: ['cases or decisions that need people to review a lot of routine work', 'answers that cannot be explained to a client, a regulator or an investment committee', 'doubts about accuracy, data privacy and what happens when the AI is wrong'],
    cta: 'Agree a proof of concept on the buyer\'s own data, with the evaluation set and the success criteria written down first',
    launchTasks: ['Build the evaluation set from the buyer\'s own history and agree what counts as a correct answer', 'Write the data privacy statement: where data is processed and stored, what is used for training, and how it is deleted', 'Define which actions a person must approve before the AI acts'],
    channels: ['account-based email to data, technology and business leads', 'LinkedIn posts from your experts and customers', 'technical briefing or evaluation workshop', 'research notes that show how the models are evaluated'],
    adoption: { measure: 'proofs of concept moved to a production pilot, and the automation rate with human review switched on', source: 'your evaluation and production logs' },
    partners: { refer: ['consultancies that advise on data and AI strategy', 'domain advisers and consultants who sit with the investment, risk or operations committee'], resell: ['systems integrators with an AI practice', 'data platform resellers'], integrate: ['data platform and cloud vendors', 'model and infrastructure providers', 'workflow and case management systems'], implement: ['AI and data engineering consultancies', 'systems integrators that run pilots on client data'] },
    partnerWhy: 'The buyer wants a second pair of eyes on accuracy, data use and risk, and the data lead or the investment committee often listens to an adviser or integrator before the vendor.',
    deepQuestions: ['What evidence would let you trust a recommendation: a history of results, an explanation, or both?', 'Which data may leave your environment, and which may never?', 'What does the review process look like when the AI and a person disagree?', 'Who owns the decision if the AI is wrong?'],
    crises: [
      { key: 'model_error', title: 'A wrong or unexplained model output used by a customer', what: 'the AI produced an output that a customer acted on and it was wrong, biased or could not be explained', first: ['Pause the affected output type or send it to human review', 'Find every customer who received the affected output, from the audit trail', 'Reproduce the failing case and add it to the evaluation set', 'Prepare an explanation the customer can give to its own committee or client'], tell: [{ who: 'Customers who acted on the output', how: 'Call from the account owner, then a written note', focus: 'What was wrong, what it affected, what has been corrected, how it will be prevented' }, { who: 'Risk, compliance and legal contacts', how: 'Written note', focus: 'Facts, evaluation results, the fix' }] },
    ],
    outage: 'an outage stops scoring or automated handling, so the customer\'s people take back the work at once and review queues grow',
    breach: 'exposure of customer data used for evaluation or training, prompts, or model outputs',
    churnReasons: ['The pilot was accurate but the explanation was not good enough for the committee', 'Data privacy review blocked production use', 'The buyer decided to build on a model API themselves', 'Cost grew with volume'],
    renewal: 'Renewal decisions follow live results with human review switched on, not the first pilot: keep the evaluation evidence current.',
    checklist: ['Evaluation set built from the buyer\'s own history', 'Data privacy statement ready', 'Human approval points defined for any action that moves money or changes a record', 'Claims about accuracy match the evaluation results you hold'],
  },
  ites: {
    pains: ['a current provider whose service levels slip or whose key people keep changing', 'transition risk, because the client cannot afford a gap in service', 'cost that is hard to compare across providers because rates and scope differ'],
    cta: 'Agree a scoping workshop or a short assessment, then a staged transition plan with exit criteria for each stage',
    launchTasks: ['Write the transition plan: knowledge transfer, parallel run and exit criteria for each stage', 'Prepare the governance model: service owner on both sides, the monthly reports the client reads and the escalation path', 'Collect references from clients with a similar scope, with the transition timeline that was actually met'],
    channels: ['account-based outreach to CIOs and procurement', 'advisor and analyst briefings', 'client roundtable or leadership dinner', 'responses to requests for proposal'],
    adoption: { measure: 'engagements signed and moved from transition to steady state, and SLA attainment in the first quarter', source: 'your delivery and service reports' },
    partners: { refer: ['sourcing advisors and IT consultancies that run vendor selection', 'technology alliance partners (cloud and enterprise software vendors) who need a delivery partner'], resell: ['technology vendors that bundle delivery services', 'regional integrators that subcontract capacity'], integrate: ['cloud and enterprise software vendors whose platforms you support', 'tooling vendors for service desk, monitoring and automation'], implement: ['specialist niche providers that cover skills you do not hold', 'regional delivery partners for local presence'] },
    partnerWhy: 'The CIO, procurement and vendor management usually hear about providers from sourcing advisors and technology vendors before an RFP is written.',
    deepQuestions: ['Which services are in scope for transition first, and which are kept in house?', 'What does the current SLA say, and where was it missed?', 'How are rates compared today: per FTE, per ticket, fixed price or outcome based?', 'Who signs off each stage of a transition, and what would make them stop it?'],
    crises: [
      { key: 'delivery_failure', title: 'A client delivery failure or missed service level', what: 'a client engagement misses its service levels or a delivery milestone and the client\'s own users feel it', first: ['Name the engagement owner and a senior sponsor for the client', 'Confirm which service-level clauses and periods are affected', 'Add named people to the recovery work', 'Agree a recovery plan with dates the client can check'], tell: [{ who: 'Client service owner', how: 'Call from the engagement lead', focus: 'What was missed, the recovery plan with dates' }, { who: 'Client CIO or business unit head', how: 'Executive call', focus: 'Impact, credits, what changes' }] },
      { key: 'key_people_loss', title: 'Loss of key people on a client engagement', what: 'several named engineers or leads leave an engagement at once', first: ['List the roles and the knowledge each person held', 'Name backups and start knowledge transfer from documentation', 'Tell the client before they find out from a delay', 'Bring in people from other teams under the same governance'], tell: [{ who: 'Client service owner', how: 'Call from the engagement lead', focus: 'Who is leaving, who covers, how knowledge is protected' }] },
    ],
    outage: 'a tooling or network failure stops the service desk, monitoring or managed services, and client users cannot reach support or see ticket status',
    breach: 'a breach through access to a client\'s systems, credentials or data held by your people or tools',
    churnReasons: ['Service levels were missed in the first quarters', 'Key people left the engagement', 'The client moved to an offshore-only provider on rate', 'Governance and reporting were too thin'],
    renewal: 'Renewals follow the contract term and the notice period: put the SLA record and the transition milestones met on the table early.',
    checklist: ['Transition plan with exit criteria written', 'Governance model and report samples ready', 'References from clients with a similar scope agreed', 'Rates explained as the total cost of the outcome, not only a rate'],
  },
  telecom: {
    pains: ['branch or site links that fail, with slow repairs and several providers to call', 'a network that is expensive to manage across many sites and many links', 'security that has to be added on top of the network, with unclear ownership of incidents'],
    cta: 'Agree a site survey and a pilot at the sites where service is worst today, with uptime and repair time compared against the current provider',
    launchTasks: ['Prepare the site survey checklist and the shortlist of pilot sites (the sites with the worst service first)', 'Write the wave plan with fallback links and a rollback rule for each wave', 'Prepare the rate-card comparison in cost per site, including outages and the IT team\'s time'],
    channels: ['account-based outreach to CIOs and heads of IT infrastructure', 'account manager briefings for existing customers', 'CIO and network leaders roundtable', 'responses to requests for proposal and rate-card comparisons'],
    adoption: { measure: 'sites live per wave, uptime per site and repair time at the pilot sites', source: 'your network operations reports' },
    partners: { refer: ['network and IT consultancies that advise CIOs', 'systems integrators that run branch and data centre projects', 'managed security providers that need the network underneath'], resell: ['IT resellers and managed service providers with branch customers', 'system integrators that bundle connectivity into their contracts'], integrate: ['security and cloud access vendors', 'cloud providers and data centre operators', 'IT service management tools'], implement: ['network integrators for site installation and cut-over', 'field engineering partners for sites outside your coverage'] },
    partnerWhy: 'The CIO and the network head often buy connectivity inside a wider IT or security project led by an integrator or consultant, who also decides which provider is included.',
    deepQuestions: ['Which sites cost the most when they go down, and how do you know?', 'Who manages the links today, and how many providers do you call for a repair?', 'Which sites have a second link, and which have none?', 'Which contracts end when, and what is the notice period?'],
    crises: [
      { key: 'network_outage', title: 'Network outage across customer sites', what: 'links or a core network fail across several customer sites at once', first: ['Open one incident and name the incident commander and the network operations lead', 'List affected sites and customers, starting with sites that have no second link', 'Fail over to the backup path where one exists, and dispatch field engineers to sites with a local fault', 'Start the service credit log from the first minute of the outage'], tell: [{ who: 'Customer network owners and CIOs', how: 'Call from the account owner, then a status update by agreed channel', focus: 'Which sites, the fallback in use, the repair plan and the next update time' }, { who: 'Customer security teams', how: 'Direct note', focus: 'Whether traffic or inspection was affected while links were down' }] },
    ],
    outage: 'a link or core network failure takes sites offline, branches lose their systems, and the customer\'s IT team calls you and the other providers at the same time',
    breach: 'exposure of customer traffic metadata, site and network configuration or management credentials',
    churnReasons: ['Repeated outages at the same sites', 'Repairs took too long', 'Price per site against the national operator', 'Cut-over of sites slipped from its wave'],
    renewal: 'Renewals follow the contract end and often a re-tender: bring the uptime and repair record for each site.',
    checklist: ['Pilot sites chosen and surveyed', 'Wave plan with rollback rules', 'Rate-card comparison in cost per site', 'Security overlay explained: who responds to an incident'],
  },
  cybersecurity: {
    pains: ['too many alerts and findings, with no ranking by real exposure', 'unknown assets, clouds or exposures that the team only finds after an incident or an audit', 'tools that do not connect to the SIEM and ticketing the team already runs'],
    cta: 'Agree a time-boxed proof of value on the buyer\'s own environment, with the success criteria written down first',
    launchTasks: ['Write the proof of value plan: scope, success criteria and what will be found and closed', 'Prepare the integration notes for the SIEM, ticketing and cloud accounts the team uses', 'Prepare the briefing for the CISO and the SOC or cloud security lead, with the evidence the audit team will want'],
    channels: ['account-based email to CISOs and security leads', 'LinkedIn posts from your researchers and customers', 'threat research or briefing content', 'security leaders roundtable'],
    adoption: { measure: 'proofs of value started and converted, assets covered and findings closed during the proof', source: 'your proof of value reports and product telemetry' },
    partners: { refer: ['security consultancies and audit firms that advise CISOs', 'managed security service providers that run the SOC for customers', 'cloud and IT consultancies that lead cloud migrations'], resell: ['security resellers and distributors', 'managed security providers that bundle your product into their service'], integrate: ['SIEM, SOAR and ticketing vendors', 'cloud providers and identity vendors'], implement: ['security integrators', 'incident response and advisory firms'] },
    partnerWhy: 'The CISO often follows the advice of the audit firm, the consultancy or the managed security provider that runs their SOC, and those partners also own the integrations a proof of value needs.',
    deepQuestions: ['Which assets, clouds or exposures are you least sure about today?', 'How are findings ranked, and what happens to the ones nobody has time for?', 'What did the last audit or incident show that the tools did not?', 'How would you judge a proof of value a success: coverage, noise reduction, or time to fix?'],
    crises: [
      { key: 'false_negative', title: 'A missed detection or a wrong finding in a customer environment', what: 'the product missed something it should have flagged, or raised a finding that led a customer to act wrongly', first: ['Reproduce the case and confirm whether it is a product fault', 'Find every customer environment exposed to the same gap', 'Ship a rule or fix and tell customers how to check', 'Prepare a plain account for the customer\'s CISO and auditors'], tell: [{ who: 'Affected customers\' CISOs and SOC leads', how: 'Call from the account owner, then a written advisory', focus: 'What was missed, how to check, what the fix is' }, { who: 'Customers\' audit and compliance contacts', how: 'Written note', focus: 'Facts, the control gap, the fix' }] },
      { key: 'disclosure', title: 'A vulnerability in your own product reported by a researcher', what: 'a researcher reports a flaw in your product or your tooling', first: ['Acknowledge the report and name one owner', 'Reproduce and rate the flaw by real exposure', 'Fix, test and prepare an advisory with the same rating', 'Agree the disclosure timing with the researcher'], tell: [{ who: 'Researcher', how: 'Direct reply', focus: 'Receipt, owner, timing' }, { who: 'Customers', how: 'Advisory and account owner calls for the most exposed', focus: 'What is affected, the fix, how to check' }] },
    ],
    outage: 'an outage stops detection or collection, so the customer\'s SOC has a blind spot and cannot say what happened during the gap',
    breach: 'exposure of customer findings, asset inventories, credentials or tokens held by the product',
    churnReasons: ['Alert volume stayed high', 'The product did not connect cleanly to the SIEM or ticketing', 'The security lead who chose the product left', 'A platform vendor bundled a similar capability'],
    renewal: 'Renewals follow audit findings and incidents: bring the exposures found and closed, and the time they took to fix.',
    checklist: ['Proof of value plan with written success criteria', 'Integration notes for SIEM, ticketing and cloud accounts', 'Security and privacy documentation ready before it is asked for', 'Claims about detection match what the product does today'],
  },
  software: {
    pains: ['releases that are slowed by tests, builds or manual checks', 'open-source or home-made tools that someone has to keep running', 'migration work that stops teams from trying a new tool'],
    cta: 'Start a trial with one team on one real project, and migrate one existing test suite or service during the trial',
    launchTasks: ['Publish the quickstart, the reference and one sample project that a developer can finish in one sitting', 'Write the migration guide from the open-source or in-house tools teams use now', 'Prepare the security note: what the product reads and stores, and how access is controlled'],
    channels: ['developer docs and quickstart', 'engineering blog and conference talks', 'community, forums and open-source channels', 'email to engineering leaders who already have team users'],
    adoption: { measure: 'teams that finish the quickstart, move a real project and keep using it after the trial', source: 'your product analytics and trial records' },
    partners: { refer: ['engineering consultancies and DevOps advisers', 'cloud marketplace and platform vendors that list tools'], resell: ['cloud and software resellers', 'systems integrators with a developer tooling practice'], integrate: ['CI/CD, source control, cloud and observability vendors', 'framework and tooling maintainers'], implement: ['DevOps and platform engineering consultancies', 'training providers for developer teams'] },
    partnerWhy: 'Developers adopt first and engineering leaders follow the advice of DevOps advisers and the cloud marketplaces and tool ecosystems their teams already use.',
    deepQuestions: ['Which tools are in the pipeline today, and which would this replace or join?', 'How are tests or specs written and maintained, and by whom?', 'What would a migration of one project need, and who would do it?', 'Who must approve a new developer tool: security, procurement or the platform team?'],
    crises: [
      { key: 'bad_release', title: 'A bad release or breaking API change', what: 'a release breaks customers\' pipelines, builds or integrations', first: ['Stop the rollout and roll back to the last good version', 'Publish the affected versions and a workaround', 'Check which customers pinned or auto-updated to the bad version', 'Add a test for the failing case before re-release'], tell: [{ who: 'Affected engineering teams', how: 'Status page, changelog and direct note to named accounts', focus: 'Affected versions, the workaround, the fixed version' }] },
      { key: 'leaked_keys', title: 'Leaked API keys or tokens', what: 'customer or internal API keys or tokens are exposed', first: ['Revoke and rotate the exposed keys', 'Review access logs for use of the keys', 'List customers whose keys were exposed', 'Tell customers how to rotate their own'], tell: [{ who: 'Affected customers', how: 'Direct email and account owner call for the largest', focus: 'What was exposed, what to rotate, what logs show' }] },
    ],
    outage: 'an outage of the API or hosted service breaks customers\' builds, pipelines and integrations, and their own users notice within minutes',
    breach: 'exposure of source code, API keys, tokens, test data or specs held by the product',
    churnReasons: ['The team went back to its open-source setup', 'Migration of existing tests or scripts stalled', 'Per-user cost at larger scale', 'The developer champion left'],
    renewal: 'Renewals follow usage by teams: show projects moved, release frequency and time saved for each team.',
    checklist: ['Quickstart finished by someone outside the team', 'Migration guide tested on a real project', 'Security note ready', 'Pricing explained for a team at the next stage of growth'],
  },
  saas: {
    pains: ['customers who sign up but take too long to reach first value', 'pricing that does not follow the value the customer gets', 'a tool that is one more login for teams that already use many'],
    cta: 'Book a working session on the buyer\'s own data or process, then start a pilot with success measures agreed first',
    launchTasks: ['Write the migration plan and the time to first value for a new customer', 'Show where the product sits in the tools the buyer already uses', 'Prepare the pricing explanation for the next stage of the buyer\'s growth'],
    channels: ['email to existing users and named accounts', 'LinkedIn posts from your experts and customers', 'webinar or workshop', 'product-led trial or demo'],
    adoption: { measure: 'accounts that reach first value and the share still active after the first renewal period', source: 'your product analytics' },
    partners: { refer: ['agencies and consultants who advise the same buyer', 'ERP and CRM consultants who recommend tools in their projects'], resell: ['software resellers and marketplaces', 'system integrators with a practice for this function'], integrate: ['the systems your customers already run (CRM, ERP, data warehouse)', 'adjacent tools whose users overlap with yours'], implement: ['implementation partners and agencies', 'training and enablement providers'] },
    partnerWhy: 'Buyers adopt tools that fit the systems and advisers they already trust, so partners who work inside those systems shorten the sale.',
    deepQuestions: ['What does a customer have to do before they get value, and how long does it take today?', 'Which accounts expanded last year, and what did they have in common?', 'Where do customers drop off: onboarding, adoption or renewal?', 'Which tools would this replace or connect to?'],
    crises: [],
    outage: 'an outage stops customers\' daily work in the product, and their own customers or teams see the effect',
    breach: 'exposure of customer account data, credentials or the data customers store in the product',
    churnReasons: ['Customers never reached first value', 'The price grew faster than the value', 'Another tool covered the use case', 'The champion left'],
    renewal: 'Renewals follow usage and the value the customer can show: prepare a usage and outcome summary before the renewal talk.',
    checklist: ['Time to first value measured', 'Pricing explained for growth', 'Integrations with the buyer\'s main tools tested', 'References from similar customers'],
  },
};

/** Words for the same offer by business model (used where a tool would otherwise say "customer cancels" or "free trial"). */
export const MODEL_LANGUAGE: Record<BusinessModel, { leave: string; engagement: string; pilot: string; buyerNoun: string }> = {
  saas: { leave: 'cancel', engagement: 'usage', pilot: 'trial or pilot', buyerNoun: 'customer' },
  services: { leave: 'end the contract or not renew', engagement: 'service reviews and SLA reports', pilot: 'assessment or pilot engagement', buyerNoun: 'client' },
  connectivity: { leave: 'end the contract or not renew', engagement: 'sites live and service levels', pilot: 'pilot sites', buyerNoun: 'customer' },
  transactions: { leave: 'move volume elsewhere', engagement: 'transaction volume', pilot: 'pilot on part of the volume', buyerNoun: 'merchant or customer' },
  marketplace: { leave: 'stop transacting', engagement: 'transactions on both sides', pilot: 'pilot in one category or city', buyerNoun: 'participant' },
  hardware_software: { leave: 'stop renewing the software or stop reordering devices', engagement: 'devices in service and software use', pilot: 'pilot site with devices', buyerNoun: 'customer' },
  investment: { leave: 'withdraw the mandate or not renew it', engagement: 'reporting reviews and mandate size', pilot: 'a phased allocation', buyerNoun: 'client' },
};

/** Buyer-side notes by kind of customer segment (what a purchase in that kind of organisation usually has to pass). Patterns, no figures. */
const SEGMENT_NOTES: Array<{ re: RegExp; kind: string; review: string }> = [
  { re: /\b(asset (?:allocators?|managers?|management)|wealth|pensions?|endowments?|investment (?:managers?|banks?|firms?)|funds?|family offices?|sovereign|insurers?)\b/i, kind: 'investment institutions', review: 'an investment or risk committee, due diligence questionnaires, consultants who advise on suppliers, and explanations the committee can defend to trustees or clients' },
  { re: /\b(bank(?:s|ing)?|bfsi|financial services|lend\w*|nbfc|fintech|payments?)\b/i, kind: 'banks and financial services', review: 'a vendor risk and security review, data residency and audit questions on controls, and a regulator who may ask how the supplier is overseen' },
  { re: /\b(government|public sector|municipal|defen[cs]e|state-owned)\b/i, kind: 'government and public sector', review: 'formal procurement or tenders, data localisation and security rules, and long approval chains' },
  { re: /\b(manufactur\w*|automotive|industrial|plants?|engineering|energy|utilities)\b/i, kind: 'manufacturing and industry', review: 'multi-site rollouts, plant uptime windows, and IT and operations teams that must both agree' },
  { re: /\b(3pl|cep|courier|logistics|transport\w*|freight|shipping|supply chain|distribution)\b/i, kind: 'logistics and distribution operators', review: 'operations leaders who own service levels to their own customers, multi-client operations, and thin margins that make the cost of change visible' },
  { re: /\b(fmcg|cpg|consumer goods|consumer brands?)\b/i, kind: 'consumer goods brands', review: 'sales and distribution teams, distributor networks, trade schemes and a rollout region by region' },
  { re: /\b(retail\w*|e-?commerce|e-?grocery|d2c|stores?|pos)\b/i, kind: 'retail and e-commerce', review: 'seasonal peaks, many stores or outlets, and operations and technology teams that share the decision' },
  { re: /\b(telecom\w*|media|communications?|isps?)\b/i, kind: 'telecom and media', review: 'network and platform teams, very large estates, and a preference for fewer suppliers' },
  { re: /\b(technology|software|saas|it services|ites|tech companies|ai companies|startups?|scale-?ups?)\b/i, kind: 'technology companies', review: 'an engineering-led evaluation, technical due diligence, and a security review of anything that touches code or data' },
];
export function segmentNotes(segment: string): { kind: string; review: string } | null {
  for (const n of SEGMENT_NOTES) if (n.re.test(segment)) return { kind: n.kind, review: n.review };
  return null;
}
