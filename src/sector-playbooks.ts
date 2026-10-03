// Run 20 round 1 (quality, D92): what the planning tools need to know about each of the owner's nine sectors beyond the reader
// data in src/verticals.ts (which stays byte identical to the shared copy). Same rule as that file (B82): vocabulary, roles,
// workflows, partner types, kinds of crisis, next steps. NO statistic, market size, benchmark, price, timing claim or named
// company. Every line is a pattern to confirm with the user's own data, and the tools say so where they print it.
import { SUBTYPES, type BusinessModel, type VerticalId } from './verticals.ts';

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
  churnReasons: Array<{ reason: string; signal: string; action: string }>;
  /** A sentence about renewal in this sector. */
  renewal: string;
  /** Checks before a launch goes out. */
  checklist: string[];
}

export const PLAYBOOKS: Record<VerticalId, Playbook> = {
  'logistics-tech': {
    pains: ['plans, shipments or orders that change after goods are moving, with no shared view of the change', 'exceptions (late, damaged or failed shipments) that are found late and chased by phone or email', 'a cost of moving goods that nobody can explain by lane, site or carrier'],
    cta: 'Agree a pilot on one lane, site or customer account, with the measures you will compare written down before it starts',
    launchTasks: ['Choose the pilot lane, site or customer account and write down its baseline measures', 'Check the integration path with the TMS, WMS and order systems the first accounts run', 'Agree with the pilot account who sees each exception and what that person does about it'],
    channels: ['account-based email to named operations and supply chain leaders', 'LinkedIn posts from your experts and customers', 'operations roundtable or customer site visit', 'trade event or association meeting'],
    adoption: { measure: 'accounts, lanes or sites live, users active in the product, and the pilot measures agreed at the start', source: 'your product usage data and the pilot records' },
    partners: { refer: ['supply chain and logistics consultants', 'ERP, TMS and WMS implementers who already sit with the Head of Supply Chain', '3PL and carrier networks that advise shippers'], resell: ['regional logistics software resellers', 'systems integrators with a transport practice'], integrate: ['TMS, WMS, ERP and order management vendors', 'carrier and shipper network platforms'], implement: ['ERP and supply chain systems integrators', 'logistics process consultancies'] },
    partnerWhy: 'The Head of Supply Chain and the COO already take advice from consultants and integrators who run their TMS, WMS and ERP, and a pilot needs those systems connected.',
    deepQuestions: ['What changes in your volumes during the busiest weeks, and what breaks first?', 'How is an exception recorded today (a late, damaged or failed shipment), and who sees the reasons?', 'What does a late or failed shipment cost you today, and who sees that number?', 'Which carriers, partners or sites must work together in one plan or one view?'],
    crises: [
      { key: 'planning_outage', title: 'Planning or tracking outage while shipments are moving', what: 'the planning, tracking or order data that customers run their operations on stops or goes wrong while goods are in motion', first: ['Tell each customer\'s operations lead which functions are down and when the next update comes', 'Freeze the last known good plan or status data and mark it as the last good version', 'Review first the orders, shipments or plans decided while the data was wrong', 'Log everything handled by hand so it can be reconciled when service returns'], tell: [{ who: 'Operations heads at affected customers', how: 'Call from the account owner', focus: 'Which functions, sites or lanes are affected, the fallback in use, the next update time' }, { who: 'Planners and customer service teams at the customer', how: 'Message through the channel the customer agreed in advance', focus: 'What to trust, what to confirm by hand, what to record' }] },
    ],
    outage: 'an outage stops the planning, tracking or order data that customers run their day on, and their teams fall back to phone calls, spreadsheets and the last plan they saved',
    breach: 'exposure of customer order data, delivery contacts, addresses, or the locations of shipments and staff',
    churnReasons: [
    { reason: 'The pilot results did not carry over to other sites or lanes', signal: 'Sites after the pilot report weaker results on the pilot measures, and their planners stop using the product', action: 'Compare the pilot site with the next one on the same measures, and fix what differs (data, set-up, working habits) before the next wave' },
    { reason: 'Daily users stopped using the product', signal: 'Fewer active users each week, more work handled by phone or spreadsheet, complaints from site leads', action: 'Visit a site, fix what the users name, and agree with the site lead how adoption is measured' },
    { reason: 'Integration with the transport, warehouse or ERP systems kept breaking', signal: 'Repeated tickets about orders or shipment data not arriving, manual re-entry by planners', action: 'Name the owner of each integration on both sides and fix the data fields that fail most often' },
    { reason: 'A bigger logistics suite was bundled in', signal: 'The buyer\'s IT or procurement asks for a comparison with a suite they already license', action: 'Compare what planners can do each day in each tool, not the feature list' },
  ],
    renewal: 'Renewals often follow the buyer\'s peak season and budget review: bring the results on the measures agreed at the start for the busy weeks.',
    checklist: ['Pilot scope chosen and its baseline measures written down', 'Integration path with the TMS, WMS and ERP confirmed with the buyer\'s IT', 'Who sees and acts on each exception agreed with the pilot account', 'Peak-season dates known, so the pilot does not collide with them'],
  },
  fintech: {
    pains: ['reporting and reconciliation that take too many manual steps', 'payments, claims or records that break a rule and are found late', 'audit questions about approvals and controls that take days to answer'],
    cta: 'Agree a pilot on one product line, entity or customer group, with a sample of the buyer\'s own data as the test',
    launchTasks: ['Prepare the security and compliance pack (data residency, access controls, audit logs, certifications you actually hold)', 'Write the integration guide with the buyer\'s finance and technology teams in mind', 'Plan the go-live around the buyer\'s reporting dates, with old and new running side by side for one cycle'],
    channels: ['account-based email to finance, risk and technology leaders', 'LinkedIn posts from your experts and customers', 'finance leaders roundtable', 'partner and adviser referrals'],
    adoption: { measure: 'entities, teams or products live, and the share of the buyer\'s flows that run through the product', source: 'your product usage data and the buyer\'s own records' },
    partners: { refer: ['advisory and audit firms that advise finance, risk and compliance leaders', 'banks and payment providers that serve the same customers', 'technology consultancies that advise on regulated systems'], resell: ['financial software resellers', 'outsourced finance and operations providers'], integrate: ['banks and payment providers', 'core systems and accounting software vendors'], implement: ['systems integrators for regulated environments', 'finance transformation consultancies'] },
    partnerWhy: 'Finance, risk and technology leaders take advice from auditors, advisers and integrators, and every deal passes a security and compliance review.',
    deepQuestions: ['How are exceptions found today: as they happen, at a reporting date, or at audit?', 'What must the audit trail show that it does not show today?', 'Which countries, entities or licences must be covered from the start?', 'Which of your customers\' or partners\' systems must it connect to, and who owns each connection?'],
    crises: [
      { key: 'transaction_error', title: 'Wrong transactions or records reaching customers', what: 'payments, balances, decisions or records are wrong, and customers or their end users act on them', first: ['Stop the job, rule or release that produced the error', 'List every affected customer, account and period', 'Prepare the corrections and who approves them', 'Tell the customer\'s finance or operations owner before the next payment run or reporting date'], tell: [{ who: 'Finance and operations owners at affected customers', how: 'Call from the account owner, then a written summary', focus: 'What was wrong, the corrected figures, the effect on their reporting' }, { who: 'Internal audit and compliance contacts', how: 'Written note', focus: 'Facts, controls that failed, the fix' }] },
    ],
    outage: 'an outage stops the flows customers use the product for, and their teams fall back to manual work and spreadsheets while payments, approvals or decisions wait',
    breach: 'exposure of financial records, bank details, cardholder data or employee data',
    churnReasons: [
    { reason: 'A control or audit finding the product did not cover', signal: 'Internal audit, risk or compliance raises a finding about controls, access or approvals', action: 'Map the finding to a control the product can meet, and say plainly what it cannot' },
    { reason: 'Integration with the customer\'s systems kept needing fixes', signal: 'Repeated tickets about data not arriving, manual re-entry, reconciliation delays at reporting dates', action: 'Name the integration owner on both sides and fix the data that fails most often before the next reporting date' },
    { reason: 'The owner who chose the product left', signal: 'The new finance, risk or technology owner asks basic questions again or reviews all vendors', action: 'Meet the new owner early with the results from before and after' },
    { reason: 'A provider the buyer already had was judged good enough', signal: 'The buyer asks for a comparison with the provider or the module it already runs', action: 'Compare on the journeys that fail or cost the most today, using a sample of the buyer\'s own data' },
  ],
    renewal: 'Renewals tend to follow the buyer\'s audit and budget cycle: bring the results and the record of reviews passed for the period.',
    checklist: ['Security and compliance pack ready before the buyer asks', 'Integration path tested with the buyer\'s systems', 'Go-live date agreed around the buyer\'s reporting dates', 'Claims you make about certifications match what you hold'],
  },
  'vertical-saas': {
    pains: ['people who do the daily work on paper, in spreadsheets or in several tools, so the work is seen late', 'rules, prices or forms that change and do not reach the people who do the work', 'records that are out of sync with the company\'s other systems'],
    cta: 'Agree a pilot with one team or site, with a comparison team or site to measure against',
    launchTasks: ['Choose the pilot team or site and record the baseline for the measures you will compare', 'Test the product in the conditions the team works in (devices, network, shifts)', 'Agree how records flow between the product and the customer\'s ERP and accounting systems before rollout'],
    channels: ['account-based email to the owner, the head of operations and department leads', 'LinkedIn posts from your experts and customers', 'visit to a pilot team or site', 'industry and association meetups'],
    adoption: { measure: 'teams and sites live, and the share of the daily work done in the product, by role', source: 'your product usage data and the customer\'s own work records' },
    partners: { refer: ['industry consultants and advisers who sit with the owner or the head of operations', 'ERP and accounting integrators who serve the same customers'], resell: ['regional software resellers close to the trade', 'mobile device and telecom resellers serving field and site teams'], integrate: ['ERP, accounting and document systems', 'mobile device and data capture vendors'], implement: ['ERP and accounting integrators', 'change management consultancies for the teams who use the product'] },
    partnerWhy: 'The owner or the head of operations takes advice from consultants and from the ERP and accounting integrators who already work with the business, and the rollout depends on those systems being connected.',
    deepQuestions: ['What happens to work in progress when the system or the network is not available?', 'Which records must reach other systems, and who confirms they arrived?', 'Which rules, prices or forms change in a month, and how fast must everyone see the change?', 'Who changes how the work is planned or approved today, and how do the people doing it hear about it?'],
    crises: [
      { key: 'sync_failure', title: 'Data sync or integration failure', what: 'entries made in the product do not reach the customer\'s other systems, or data from those systems goes wrong', first: ['Stop automatic pushes to the connected systems', 'Let teams keep working and mark every entry that has not been delivered', 'List the entries made during the failure and their status', 'Agree with each customer how entries are replayed or entered again'], tell: [{ who: 'Operations or department heads at affected customers', how: 'Call from the account owner', focus: 'Which teams and records are affected, how work is protected, when sync returns' }, { who: 'Teams who use the product daily', how: 'Message through the customer\'s own channel', focus: 'Keep working, and what not to re-enter' }] },
    ],
    outage: 'an outage stops the daily work in the product, and teams fall back to paper, spreadsheets and phone calls while the work waits',
    breach: 'exposure of customer records, documents, prices and terms, or staff data held by the product',
    churnReasons: [
    { reason: 'People went back to their old way of working', signal: 'Adoption by role falls while the same work shows up on paper, in spreadsheets or by phone', action: 'Visit a team, fix what people name, and tie the adoption measure agreed at the start to how the team is reviewed' },
    { reason: 'A module of a system the customer already had was good enough', signal: 'The owner compares the product with the module that comes with the system they already run', action: 'Compare what people can do in their daily work with each option, not the feature list' },
    { reason: 'Data stayed out of sync with the customer\'s other systems', signal: 'Numbers differ between the product and the accounting, ERP or partner systems it connects to', action: 'Name the systems involved and agree how records flow back, team by team' },
    { reason: 'The sponsor who backed the rollout changed role', signal: 'The owner or department head who backed the rollout moves on and waves are postponed', action: 'Re-baseline the rollout plan with the new sponsor, using the results of the first team or site' },
  ],
    renewal: 'Renewals follow the customer\'s working year: show adoption by role and the work saved for the team or site that went live.',
    checklist: ['Pilot team or site and comparison group agreed', 'Product tested in the conditions where people work', 'ERP and accounting data flow confirmed with IT', 'Routines or incentives tied to using the product'],
  },
  'ai-native': {
    pains: ['cases or decisions that need people to review a lot of routine work', 'answers that cannot be explained to a client, a regulator or an investment committee', 'doubts about accuracy, data privacy and what happens when the AI is wrong'],
    cta: 'Agree a proof of concept on the buyer\'s own data, with the evaluation set and the success criteria written down first',
    launchTasks: ['Build the evaluation set from the buyer\'s own history and agree what counts as a correct answer', 'Write the data privacy statement: where data is processed and stored, what is used for training, and how it is deleted', 'Define which actions a person must approve before the AI acts'],
    channels: ['account-based email to data, technology and business leads', 'LinkedIn posts from your experts and customers', 'technical briefing or evaluation workshop', 'research notes that show how the models are evaluated'],
    adoption: { measure: 'proofs of concept moved to a production pilot, and the automation rate with human review switched on', source: 'your evaluation and production logs' },
    partners: { refer: ['consultancies that advise on data and AI strategy', 'domain advisers and consultants who sit with the risk, operations or review committee'], resell: ['systems integrators with an AI practice', 'data platform resellers'], integrate: ['data platform and cloud vendors', 'model and infrastructure providers', 'workflow and case management systems'], implement: ['AI and data engineering consultancies', 'systems integrators that run pilots on client data'] },
    partnerWhy: 'The buyer wants a second pair of eyes on accuracy, data use and risk, and the data lead or the review committee often listens to an adviser or integrator before the vendor.',
    deepQuestions: ['What evidence would let you trust a recommendation: a history of results, an explanation, or both?', 'Which data may leave your environment, and which may never?', 'What does the review process look like when the AI and a person disagree?', 'Who owns the decision if the AI is wrong?'],
    crises: [
      { key: 'model_error', title: 'A wrong or unexplained model output used by a customer', what: 'the AI produced an output that a customer acted on and it was wrong, biased or could not be explained', first: ['Pause the affected output type or send it to human review', 'Find every customer who received the affected output, from the audit trail', 'Reproduce the failing case and add it to the evaluation set', 'Prepare an explanation the customer can give to its own committee or client'], tell: [{ who: 'Customers who acted on the output', how: 'Call from the account owner, then a written note', focus: 'What was wrong, what it affected, what has been corrected, how it will be prevented' }, { who: 'Risk, compliance and legal contacts', how: 'Written note', focus: 'Facts, evaluation results, the fix' }] },
    ],
    outage: 'an outage stops scoring or automated handling, so the customer\'s people take back the work at once and review queues grow',
    breach: 'exposure of customer data used for evaluation or training, prompts, or model outputs',
    churnReasons: [
    { reason: 'The pilot was accurate but the explanation was not good enough for the committee', signal: 'Reviewers ask for reasoning behind outputs, or overrule the AI without recording why', action: 'Add the explanation the committee asks for to every output, and show the evaluation history' },
    { reason: 'Data privacy review blocked production use', signal: 'Security or legal asks again where data is processed and what is used for training', action: 'Answer in writing where data is processed and stored, what is used for training and how it is deleted' },
    { reason: 'The buyer decided to build on a model API themselves', signal: 'The buyer\'s engineers ask for access to raw model features or compare build cost', action: 'Compare the full cost of evaluation, guardrails and integrations that they would have to build and maintain' },
    { reason: 'Cost grew with volume', signal: 'Usage and cost per case rise faster than the cases handled by people before', action: 'Show the cost per case handled against the cost of handling it today, with their own volumes' },
  ],
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
    deepQuestions: ['Which services are in scope for transition first, and which are kept in house?', 'What does the current SLA say, and where was it missed?', 'How are rates compared today: per person, per unit of work, fixed price or outcome based?', 'Who signs off each stage of a transition, and what would make them stop it?'],
    crises: [
      { key: 'delivery_failure', title: 'A client delivery failure or missed service level', what: 'a client engagement misses its service levels or a delivery milestone and the client\'s own users feel it', first: ['Name the engagement owner and a senior sponsor for the client', 'Confirm which service-level clauses and periods are affected', 'Add named people to the recovery work', 'Agree a recovery plan with dates the client can check'], tell: [{ who: 'Client service owner', how: 'Call from the engagement lead', focus: 'What was missed, the recovery plan with dates' }, { who: 'Client CIO or business unit head', how: 'Executive call', focus: 'Impact, credits, what changes' }] },
      { key: 'key_people_loss', title: 'Loss of key people on a client engagement', what: 'several named engineers or leads leave an engagement at once', first: ['List the roles and the knowledge each person held', 'Name backups and start knowledge transfer from documentation', 'Tell the client before they find out from a delay', 'Bring in people from other teams under the same governance'], tell: [{ who: 'Client service owner', how: 'Call from the engagement lead', focus: 'Who is leaving, who covers, how knowledge is protected' }] },
    ],
    outage: 'a tooling or network failure stops the systems the delivery team works in, and client users cannot reach support or see the status of their requests',
    breach: 'a breach through access to a client\'s systems, credentials or data held by your people or tools',
    churnReasons: [
    { reason: 'Service levels were missed in the first quarters', signal: 'Credits claimed, SLA reports below target, escalations to the client\'s management', action: 'Run a root-cause review with the service owner, agree a recovery plan with dates and a report the client can check' },
    { reason: 'Key people left the engagement', signal: 'Requests to keep named people, complaints about changes in the team, more rework', action: 'Name the backup for each key role, show the knowledge transfer and agree a team review' },
    { reason: 'The client moved to a lower-cost provider on rate', signal: 'Procurement asks for a rate benchmark or opens a re-tender', action: 'Compare the total cost of the outcome (SLA attainment, rework, management time) instead of the rate' },
    { reason: 'Governance and reporting were too thin', signal: 'Missed reviews, reports not read, no named service owner on either side', action: 'Reset the review cadence, name the owners and agree the reports the client reads' },
  ],
    renewal: 'Renewals follow the contract term and the notice period: put the SLA record and the transition milestones met on the table early.',
    checklist: ['Transition plan with exit criteria written', 'Governance model and report samples ready', 'References from clients with a similar scope agreed', 'Rates explained as the total cost of the outcome, not only a rate'],
  },
  telecom: {
    pains: ['services that fail, with slow repairs and several providers to call', 'a communications setup that is expensive to manage across many services and providers', 'security that has to be added on top, with unclear ownership of incidents'],
    cta: 'Agree a pilot on the service where results are worst today, with service quality and repair time compared against the current provider',
    launchTasks: ['Prepare the shortlist of pilot services or customers (the worst served first) and write down their baseline measures', 'Write the cut-over plan with a fallback and a rollback rule for each step', 'Prepare the price comparison in cost per service, including outages and the IT team\'s time'],
    channels: ['account-based outreach to CIOs and heads of technology', 'account manager briefings for existing customers', 'CIO and technology leaders roundtable', 'responses to requests for proposal and price comparisons'],
    adoption: { measure: 'services or customers live per step, and service quality and repair time at the pilot', source: 'your service operations reports' },
    partners: { refer: ['network and IT consultancies that advise CIOs', 'systems integrators that run migration projects'], resell: ['IT resellers and managed service providers with business customers', 'system integrators that bundle communications services into their contracts'], integrate: ['security and cloud access vendors', 'cloud providers', 'IT service management tools'], implement: ['network and systems integrators for installation and cut-over', 'field engineering partners for places outside your coverage'] },
    partnerWhy: 'The CIO and the technology head often buy communications services inside a wider IT or security project led by an integrator or consultant, who also decides which provider is included.',
    deepQuestions: ['Which services cost the most when they fail, and how do you know?', 'Who runs the services today, and how many providers do you call when something fails?', 'Which services have a fallback, and which have none?', 'Which contracts end when, and what is the notice period?'],
    crises: [
      { key: 'network_outage', title: 'Service outage across several customers', what: 'the connectivity or communications service fails for several customers at once', first: ['Open one incident and name the incident commander and the operations lead', 'List affected customers and services, starting with those that have no fallback', 'Switch to a backup path or provider where one exists', 'Start the service credit log from the first minute of the outage'], tell: [{ who: 'Customer technology owners and CIOs', how: 'Call from the account owner, then a status update by agreed channel', focus: 'Which services are affected, the fallback in use, the repair plan and the next update time' }, { who: 'Customer security teams', how: 'Direct note', focus: 'Whether any customer traffic or data was affected during the failure' }] },
    ],
    outage: 'a failure takes the connectivity or communications service down for customers, and their IT teams call you and the other providers at the same time',
    breach: 'exposure of customer traffic metadata, site and network configuration or management credentials',
    churnReasons: [
    { reason: 'Repeated outages of the same services', signal: 'The same services appear in incident reports again and again, service credits are paid', action: 'Run an incident review per service and agree a fallback plan for the services that fail most' },
    { reason: 'Repairs took too long', signal: 'Long repair times, escalations to your management, the customer calls other providers in parallel', action: 'Agree a repair-time commitment you can meet, and show the repair record per service' },
    { reason: 'Price compared with the supplier they use today', signal: 'Rate-card comparisons, requests to cut services that are little used', action: 'Compare the total cost including outages, repair time and the IT team\'s time' },
    { reason: 'The switch to the new service slipped from its plan', signal: 'Customers late in their migration, rollback requests, complaints from the people who use it', action: 'Reset the migration plan with a rollback rule for each stage and a named owner per region' },
  ],
    renewal: 'Renewals follow the contract end and often a re-tender: bring the service record for the period.',
    checklist: ['Pilot services or customers chosen and their baseline measured', 'Cut-over plan with rollback rules', 'Price comparison in cost per service', 'Security overlay explained: who responds to an incident'],
  },
  cybersecurity: {
    pains: ['too many alerts and findings, with no ranking by real impact', 'gaps in what the team can see, found only after an incident or an audit', 'tools that do not connect to the SIEM and ticketing the team already runs'],
    cta: 'Agree a time-boxed proof of value on the buyer\'s own environment, with the success criteria written down first',
    launchTasks: ['Write the proof of value plan: scope, success criteria and what will be found and closed', 'Prepare the integration notes for the SIEM, ticketing and identity systems the team uses', 'Prepare the briefing for the CISO and the SOC or security lead, with the evidence the audit team will want'],
    channels: ['account-based email to CISOs and security leads', 'LinkedIn posts from your researchers and customers', 'threat research or briefing content', 'security leaders roundtable'],
    adoption: { measure: 'proofs of value started and converted, and findings or threats handled during the proof', source: 'your proof of value reports and product telemetry' },
    partners: { refer: ['security consultancies and audit firms that advise CISOs', 'managed security service providers that run the SOC for customers', 'cloud and IT consultancies that lead cloud migrations'], resell: ['security resellers and distributors', 'managed security providers that bundle your product into their service'], integrate: ['SIEM, SOAR and ticketing vendors', 'cloud providers and identity vendors'], implement: ['security integrators', 'incident response and advisory firms'] },
    partnerWhy: 'The CISO often follows the advice of the audit firm, the consultancy or the managed security provider that runs their SOC, and those partners also own the integrations a proof of value needs.',
    deepQuestions: ['Which assets, systems or exposures are you least sure about today?', 'How are findings ranked, and what happens to the ones nobody has time for?', 'What did the last audit or incident show that the tools did not?', 'How would you judge a proof of value a success: coverage, noise reduction, or time to fix?'],
    crises: [
      { key: 'false_negative', title: 'A missed detection or a wrong finding in a customer environment', what: 'the product missed something it should have flagged, or raised a finding that led a customer to act wrongly', first: ['Reproduce the case and confirm whether it is a product fault', 'Find every customer environment exposed to the same gap', 'Ship a rule or fix and tell customers how to check', 'Prepare a plain account for the customer\'s CISO and auditors'], tell: [{ who: 'Affected customers\' CISOs and SOC leads', how: 'Call from the account owner, then a written advisory', focus: 'What was missed, how to check, what the fix is' }, { who: 'Customers\' audit and compliance contacts', how: 'Written note', focus: 'Facts, the control gap, the fix' }] },
      { key: 'disclosure', title: 'A vulnerability in your own product reported by a researcher', what: 'a researcher reports a flaw in your product or your tooling', first: ['Acknowledge the report and name one owner', 'Reproduce and rate the flaw by real exposure', 'Fix, test and prepare an advisory with the same rating', 'Agree the disclosure timing with the researcher'], tell: [{ who: 'Researcher', how: 'Direct reply', focus: 'Receipt, owner, timing' }, { who: 'Customers', how: 'Advisory and account owner calls for the most exposed', focus: 'What is affected, the fix, how to check' }] },
    ],
    outage: 'an outage stops detection, protection or enforcement, so the customer has a blind spot or a gap in control and cannot say what happened during it',
    breach: 'exposure of customer findings, asset inventories, credentials or tokens held by the product',
    churnReasons: [
    { reason: 'Alert volume stayed high', signal: 'Alerts per analyst stay high, findings age without being closed', action: 'Show findings ranked by real exposure so the team works on fewer, more important items' },
    { reason: 'The product did not connect cleanly to the tools the security team runs', signal: 'Tickets about missing events, manual exports into the SIEM, ticketing or identity tools', action: 'Fix the integrations the team named first, and test them with the team in a short working session' },
    { reason: 'The security lead who chose the product left', signal: 'A new CISO asks for a review of all security vendors', action: 'Brief the new lead with the exposures found and closed and the time it took to fix them' },
    { reason: 'A platform vendor bundled a similar capability', signal: 'The buyer\'s security or IT team compares with what a platform vendor now includes', action: 'Map the overlap honestly and show what the platform capability misses in their own environment' },
  ],
    renewal: 'Renewals follow audit findings and incidents: bring the exposures found and closed, and the time they took to fix.',
    checklist: ['Proof of value plan with written success criteria', 'Integration notes for the SIEM and ticketing the team uses', 'Security and privacy documentation ready before it is asked for', 'Claims about detection match what the product does today'],
  },
  software: {
    pains: ['releases that are slowed by manual checks and handoffs between tools', 'open-source or home-made tools that someone has to keep running', 'migration work that stops teams from trying a new tool'],
    cta: 'Start a trial with one team on one real project, and migrate one existing project or service during the trial',
    launchTasks: ['Publish the quickstart, the reference and one sample project that a developer can finish in one sitting', 'Write the migration guide from the open-source or in-house tools teams use now', 'Prepare the security note: what the product reads and stores, and how access is controlled'],
    channels: ['developer docs and quickstart', 'engineering blog and conference talks', 'community, forums and open-source channels', 'email to engineering leaders who already have team users'],
    adoption: { measure: 'teams that finish the quickstart, move a real project and keep using it after the trial', source: 'your product analytics and trial records' },
    partners: { refer: ['engineering consultancies and DevOps advisers', 'cloud marketplace and platform vendors that list tools'], resell: ['cloud and software resellers', 'systems integrators with a developer tooling practice'], integrate: ['CI/CD, source control, cloud and observability vendors', 'framework and tooling maintainers'], implement: ['DevOps and platform engineering consultancies', 'training providers for developer teams'] },
    partnerWhy: 'Developers adopt first and engineering leaders follow the advice of DevOps advisers and the cloud marketplaces and tool ecosystems their teams already use.',
    deepQuestions: ['Which tools are in the pipeline today, and which would this replace or join?', 'What would a migration of one project need, and who would do it?', 'What happens today when a build or a release fails, and who is told?', 'Who must approve a new developer tool: security, procurement or the platform team?'],
    crises: [
      { key: 'bad_release', title: 'A bad release or breaking API change', what: 'a release breaks customers\' pipelines, builds or integrations', first: ['Stop the rollout and roll back to the last good version', 'Publish the affected versions and a workaround', 'Check which customers pinned or auto-updated to the bad version', 'Add a test for the failing case before re-release'], tell: [{ who: 'Affected engineering teams', how: 'Status page, changelog and direct note to named accounts', focus: 'Affected versions, the workaround, the fixed version' }] },
      { key: 'leaked_keys', title: 'Leaked API keys or tokens', what: 'customer or internal API keys or tokens are exposed', first: ['Revoke and rotate the exposed keys', 'Review access logs for use of the keys', 'List customers whose keys were exposed', 'Tell customers how to rotate their own'], tell: [{ who: 'Affected customers', how: 'Direct email and account owner call for the largest', focus: 'What was exposed, what to rotate, what logs show' }] },
    ],
    outage: 'an outage of the API or hosted service breaks customers\' builds, pipelines and integrations, and their own users notice within minutes',
    breach: 'exposure of source code, API keys, tokens, test data or specs held by the product',
    churnReasons: [
    { reason: 'The team went back to the tools it used before', signal: 'Fewer projects run through the product, work moved back to older scripts or tools', action: 'Compare the time spent maintaining the previous setup with what the product removes, on one team' },
    { reason: 'Migration of existing projects stalled', signal: 'Migration tickets stay open, only new projects use the product', action: 'Migrate one real project with the team and show the import path' },
    { reason: 'Per-user cost at larger scale', signal: 'Procurement asks for the price at the next stage of growth', action: 'Tie the price to the teams that use it and the time saved, measured on their own data' },
    { reason: 'The developer champion left', signal: 'The sponsor on the platform team changes and usage drops in that team', action: 'Find the next champion on the team and show the usage and time saved so far' },
  ],
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
    churnReasons: [
    { reason: 'Customers never reached first value', signal: 'Accounts with no key action in the first weeks, setup left unfinished', action: 'Restart onboarding with a named quick win and a date' },
    { reason: 'The price grew faster than the value', signal: 'Requests to downgrade or to renegotiate at renewal', action: 'Align the pricing metric with the value the customer gets and show the price at their next stage of growth' },
    { reason: 'Another tool covered the use case', signal: 'Mentions of another tool in calls or tickets', action: 'Show where your product sits in the tools they already use and what the other tool leaves manual' },
    { reason: 'The champion left', signal: 'Primary contact changed, the new stakeholder asks for the basics again', action: 'Find the new champion and restate the value in their terms' },
  ],
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
const SEGMENT_NOTES: Array<{ re: RegExp; kind: string; review: string; partners: string; channels?: string[] }> = [
  { re: /\b(asset (?:allocators?|managers?|management)|wealth|pensions?|endowments?|investment (?:managers?|banks?|firms?)|funds?|family offices?|sovereign|insurers?)\b/i, kind: 'investment institutions', channels: ['consultant and adviser relations', 'due diligence questionnaires and data room packs', 'investment conferences and committee presentations', 'reference calls with similar institutions'], partners: 'investment consultants and advisers who recommend suppliers, data and technology vendors that serve the same desks, custodians and fund administrators', review: 'an investment or risk committee, due diligence questionnaires, consultants who advise on suppliers, and explanations the committee can defend to trustees or clients' },
  { re: /\b(bank(?:s|ing)?|bfsi|financial services|lend\w*|nbfc|fintech|payments?)\b/i, kind: 'banks and financial services', channels: ['account-based outreach to technology and risk leaders', 'security and vendor-risk review packs', 'industry roundtables', 'reference calls with similar institutions'], partners: 'risk and compliance consultancies, core banking and ERP integrators, audit and advisory firms', review: 'a vendor risk and security review, data residency and audit questions on controls, and a regulator who may ask how the supplier is overseen' },
  { re: /\b(government|public sector|municipal|defen[cs]e|state-owned)\b/i, kind: 'government and public sector', channels: ['tender and framework monitoring', 'partner-led bids', 'public sector events'], partners: 'systems integrators with public sector frameworks, local resellers that hold the procurement vehicles', review: 'formal procurement or tenders, data localisation and security rules, and long approval chains' },
  { re: /\b(manufactur\w*|automotive|industrial|plants?|engineering|energy|utilities)\b/i, kind: 'manufacturing and industry', partners: 'plant automation and ERP integrators, industry consultants, regional resellers close to the plants', review: 'multi-site rollouts, plant uptime windows, and IT and operations teams that must both agree' },
  { re: /\b(3pl|cep|courier|logistics|transport\w*|freight|shipping|supply chain|distribution)\b/i, kind: 'logistics and distribution operators', partners: 'logistics consultants, ERP, WMS and TMS integrators, freight and carrier networks that advise shippers', review: 'operations leaders who own service levels to their own customers, multi-client operations, and thin margins that make the cost of change visible' },
  { re: /\b(fmcg|cpg|consumer goods|consumer brands?)\b/i, kind: 'consumer goods brands', partners: 'route-to-market consultants, DMS and ERP integrators, trade marketing and retail audit agencies', review: 'sales and distribution teams, distributor networks, trade schemes and a rollout region by region' },
  { re: /\b(retail\w*|e-?commerce|e-?grocery|d2c|stores?|pos)\b/i, kind: 'retail and e-commerce', partners: 'retail technology integrators, e-commerce platform agencies, point-of-sale and store technology vendors', review: 'seasonal peaks, many stores or outlets, and operations and technology teams that share the decision' },
  { re: /\b(telecom\w*|communications?|isps?)\b/i, kind: 'telecom', partners: 'OSS and BSS integrators, network and platform consultancies', review: 'network and platform teams, very large estates, and a preference for fewer suppliers' },
  { re: /\b(media|publishing|entertainment|broadcast\w*)\b/i, kind: 'media and publishing', partners: 'agency and ad-tech integrators, content platform vendors, billing and subscription consultancies', review: 'many titles or channels, subscription and advertising revenue to reconcile, and finance and product teams that share the decision' },
  { re: /\b(technology|software|saas|it services|ites|tech companies|ai companies|startups?|scale-?ups?)\b/i, kind: 'technology companies', partners: 'cloud marketplaces, technology consultancies, managed service providers', review: 'an engineering-led evaluation, technical due diligence, and a security review of anything that touches code or data' },
];
export function segmentNotes(segment: string): { kind: string; review: string; partners: string; channels?: string[] } | null {
  for (const n of SEGMENT_NOTES) if (n.re.test(segment)) return { kind: n.kind, review: n.review, partners: n.partners, channels: n.channels };
  return null;
}
/** Every kind of customer segment a text names (a partner goal that lists the segments it aims at). */
export function segmentKinds(text: string): Array<{ kind: string; review: string; partners: string; channels?: string[] }> {
  const out: Array<{ kind: string; review: string; partners: string; channels?: string[] }> = [];
  for (const n of SEGMENT_NOTES) if (n.re.test(text) && !out.some((o) => o.kind === n.kind)) out.push({ kind: n.kind, review: n.review, partners: n.partners, channels: n.channels });
  return out;
}

/** What a seller on this business model measures after the sale (names only, no figures). Used where the sector file's measures belong to another kind of business. */
export const MODEL_MEASURES: Partial<Record<BusinessModel, string[]>> = {
  investment: ['assets under mandate', 'mandate renewals', 'performance against the agreed benchmark', 'reporting reviews held'],
  connectivity: ['sites live per wave', 'uptime per site', 'mean time to repair', 'service credits paid'],
  services: ['SLA attainment', 'transition milestones met', 'statement of work renewals', 'client satisfaction'],
};


// ---------------------------------------------------------------------------------------------------------------------
// Billing and revenue operations: a SaaS-sector seller whose own words are billing words (billing, invoicing, dunning, proration, revenue
// recognition) is sold to finance and revenue operations, not to product leaders: the generic SaaS notes (activation, first value) do not fit.
import type { SectorNotes } from './verticals.ts';
export const BILLING_NOTES: SectorNotes = {
  vocabulary: ['invoice accuracy', 'proration', 'usage metering', 'dunning', 'failed payment recovery', 'revenue recognition', 'month-end close', 'plan and price changes', 'ERP posting'],
  buyerRoles: ['Chief Financial Officer', 'VP Finance', 'Head of Revenue Operations', 'Finance Controller', 'Head of Billing Operations', 'Chief Revenue Officer'],
  committee: 'The CFO or VP Finance signs; revenue operations or the billing owner champions; finance operations and the controller use it at every close; sales operations and the CRM owner check the quote-to-cash flow; IT checks the CRM, ERP and payment integrations and security.',
  objections: [
    { objection: 'Does it integrate with our CRM and ERP?', response: 'Name the CRM, ERP, tax and payment systems involved, say which integrations exist today, and agree who on the buyer side owns each.' },
    { objection: 'Revenue recognition and audit', response: 'Show how recognition rules are set, who approves a change and what the audit trail records; never claim a standard you cannot show.' },
    { objection: 'Migrating live subscriptions will disrupt billing', response: 'Plan a parallel run for one billing cycle, move one product line first, and agree how differences are explained to customers.' },
    { objection: 'Our pricing is too custom for a billing system', response: 'Walk through the buyer\'s three most unusual plans and show how each is modelled, before the price is discussed.' },
  ],
  salesMotion: 'Finance-led evaluation with a pilot on one product line or entity; the CRM and ERP integration and a revenue recognition review sit inside the cycle.',
  metrics: ['invoice accuracy', 'billing errors per cycle', 'revenue leakage', 'failed payment recovery', 'days to close the books', 'invoice disputes'],
  proofShape: 'Billing errors, failed-payment recovery or time to close before and after for one product line or entity, signed off by the finance owner.',
  discovery: [
    'How are plan and price changes turned into invoices today, and who checks them?',
    'Where are invoice disputes and failed payments handled, and by whom?',
    'How long after month end is revenue closed, and what holds it up?',
    'Which systems must billing connect to (CRM, ERP, tax, payment gateway)?',
    'Which pricing models do you run, and which of them break your current process?',
  ],
};
export const BILLING_PLAYBOOK: Playbook = {
  ...PLAYBOOKS.saas,
  pains: ['billing errors and manual corrections every cycle', 'revenue leakage from unbilled usage, wrong prices or expired discounts', 'failed payments that are not recovered, and a close that waits on reconciliation'],
  cta: 'Agree a pilot on one product line or entity, with a month of the buyer\'s own invoices as the test',
  launchTasks: ['Write the integration guide for the CRM, ERP, tax and payment systems the first accounts use', 'Prepare the revenue recognition and audit pack: what is recognised and when, who approves a change, and the audit trail', 'Plan the migration of live subscriptions with a parallel run for one billing cycle'],
  channels: ['account-based email to CFOs and heads of revenue operations', 'LinkedIn posts from your experts and customers', 'finance leaders roundtable or webinar', 'referrals from ERP and finance consultants'],
  adoption: { measure: 'product lines or entities billed through the platform, and invoices issued without manual correction', source: 'your billing platform data' },
  partners: { refer: ['ERP and accounting implementation partners', 'finance transformation and revenue operations consultancies', 'audit and advisory firms that advise CFOs'], resell: ['finance software resellers', 'ERP resellers with a subscription practice'], integrate: ['CRM, ERP and tax systems', 'payment gateways and banks'], implement: ['ERP implementers', 'billing migration specialists'] },
  partnerWhy: 'The CFO and the head of revenue operations follow the advice of the ERP implementer, the finance consultancy and the auditor, and a billing platform has to be connected to the CRM and ERP they run.',
  deepQuestions: ['How are plan and price changes turned into invoices today, and who checks them?', 'Where are invoice disputes and failed payments handled, and by whom?', 'How long after month end is revenue closed, and what holds it up?', 'Which systems must billing connect to (CRM, ERP, tax, payment gateway)?'],
  crises: [
    { key: 'billing_error', title: 'A wrong invoice run or a failed billing run', what: 'invoices go out wrong, are not generated, or charges are applied to the wrong customers', first: ['Stop the billing job and any automatic payment collection that follows it', 'List the affected customers, invoices, amounts and billing periods', 'Prepare corrected invoices or credit notes and who approves them', 'Check whether revenue already recognised needs a correcting entry'], tell: [{ who: 'Finance owners at affected customers', how: 'Call from the account owner, then a written explanation with the corrected documents', focus: 'What was wrong, what is corrected, what they need to do about any payment already taken' }, { who: 'Customers\' payers or end customers, where charges reached them', how: 'Email after the finance owner has been told', focus: 'The error, the refund or credit and when it arrives' }] },
    { key: 'recognition_error', title: 'A revenue recognition or tax error in customers\' books', what: 'a recognition rule or tax setting produced wrong figures that reached a customer\'s ledger or filing', first: ['Freeze the rule or setting that changed and record who changed it', 'List the customers, periods and entries affected', 'Prepare corrected entries with the customer\'s controller', 'Tell the auditor contact the customer names, through the customer'], tell: [{ who: 'Controller and CFO at affected customers', how: 'Call from the account owner, then a written note', focus: 'The rule, the periods, the corrected entries, the effect on the close' }] },
  ],
  outage: 'an outage stops invoicing, payment collection or recovery of failed payments, so cash is delayed and finance teams reconcile by hand near a close',
  breach: 'exposure of invoices, customer billing details, payment tokens or pricing and contract terms',
  churnReasons: [
    { reason: 'Integration with the CRM or ERP kept breaking', signal: 'Repeated tickets about invoices not posting, customers missing between CRM and billing, manual journal entries', action: 'Name the integration owner on both sides, fix the failing postings first, and test with the controller at the next close' },
    { reason: 'The finance owner who chose the platform left', signal: 'A new controller or CFO asks basic questions again, reviews all finance vendors, or asks for a comparison with the ERP module', action: 'Meet the new owner early with billing errors, recovery and close time before and after' },
    { reason: 'New pricing models were not supported', signal: 'Sales sells a plan that billing cannot invoice, workarounds in spreadsheets, delayed launches of new plans', action: 'Model the plan with the revenue operations team, and agree how new plans are tested before they are sold' },
    { reason: 'Migration left billing in two systems', signal: 'Customers still invoiced from the old system, reconciliation between two sources, a parallel run that never ended', action: 'Agree a dated end to the parallel run and move the remaining product lines in order' },
  ],
  renewal: 'Renewals follow the budget and audit cycle: bring billing errors, failed-payment recovery and time to close for the period.',
  checklist: ['Integration with the buyer\'s CRM and ERP confirmed', 'Revenue recognition and audit pack ready', 'Parallel run for one cycle planned', 'Claims about standards and certifications match what you hold'],
};
// A seller that manages money or sells research and signals to investors (the investment model): the buyers are investment committees, consultants and trustees.
export const INVESTMENT_PLAYBOOK: Playbook = {
  ...PLAYBOOKS['ai-native'],
  pains: ['signals or research that cannot be explained to a committee, trustees or clients', 'research that is slow or hard to repeat across a whole portfolio', 'a gap between what a model outputs and an investment process that has to defend each decision'],
  cta: 'Agree a trial on a defined universe and period, with the benchmark, the method and the committee\'s review criteria written down first',
  launchTasks: ['Prepare the due diligence pack: method, data sources, how each signal is explained, controls, and the track record with its period and method', 'Prepare the committee presentation and the briefing for the consultants who advise allocators', 'Agree the trial design: benchmark, period and universe, and label any back-tested result as back-tested'],
  channels: ['consultant and adviser relations', 'due diligence questionnaires and data room packs', 'investment conferences and committee presentations', 'reference calls with similar institutions'],
  adoption: { measure: 'trials started, mandates or licences awarded, and assets or users on the product after the trial', source: 'your sales and mandate records' },
  partners: { refer: ['investment consultants who advise allocators', 'custodians and fund administrators', 'data and technology vendors that serve the same desks'], resell: ['distribution partners and placement agents', 'platform vendors that serve institutional desks'], integrate: ['portfolio management and order management systems', 'market and alternative data vendors'], implement: ['investment technology consultancies', 'data engineering firms that integrate research into the process'] },
  partnerWhy: 'Investment committees follow the advice of consultants and rely on custodians, administrators and data vendors that already sit in their process.',
  deepQuestions: ['What does your committee need to see before it accepts a new model-based input?', 'How do you judge whether a signal has added value: against which benchmark, over what period?', 'Which data may not leave your environment?', 'How are decisions documented for trustees, clients or regulators?'],
  churnReasons: [
    { reason: 'Results lagged the agreed benchmark for several review periods', signal: 'Questions from the committee on recent performance, requests for attribution, a consultant review of the mandate', action: 'Prepare an attribution of the gap, the drivers and what changes, and take it to the sponsor before the review' },
    { reason: 'The explanation was not good enough for the committee', signal: 'Reviewers ask for the reasoning behind signals or overrule them without recording why', action: 'Add the explanation the committee asks for to every report, and show the history of the method' },
    { reason: 'Fee pressure', signal: 'Requests to renegotiate fees, comparison with other managers or vendors', action: 'Agree reporting and scope instead of a fee cut' },
    { reason: 'The sponsor or the consultant changed', signal: 'A new investment committee chair or a new consultant asks for a review of all managers and vendors', action: 'Meet the new decision makers early and restate the agreed purpose with the results so far' },
  ],
  renewal: 'Mandates and licences are reviewed by the committee and its consultant on a cycle: bring performance against the agreed benchmark and the explanation of each signal.',
  checklist: ['Due diligence pack ready', 'Trial design with benchmark and period agreed', 'Back-tested results labelled as back-tested', 'Claims about track record match the records you hold'],
};
/** Run 21b step 2 (stock text): lines written for one kind of company. The entries of PLAYBOOKS above hold only lines true for every company in
 * the vertical; the lines of one kind sit here, under the sub-type id of src/verticals.ts, and replace the neutral field when the seller's own words
 * name exactly that sub-type. Only the fields below can be replaced (run 21b late task: the launch lines pains, cta, launchTasks, channels, adoption and checklist
 * were moved here too, so launch_commander prints them only for the kind they were written for). No figure, statistic or named company (B82). */
export type PlaybookOverlay = Partial<Pick<Playbook, 'crises' | 'outage' | 'breach' | 'churnReasons' | 'renewal' | 'deepQuestions' | 'partners' | 'partnerWhy' | 'pains' | 'cta' | 'launchTasks' | 'channels' | 'adoption' | 'checklist'>>;
export const SUBTYPE_PLAYBOOKS: Record<string, PlaybookOverlay> = {
  // Logistics tech, last mile delivery (the lines the neutral entry used to hold for every logistics company).
  'last-mile': {
    pains: ['dispatch plans that break when orders, drivers or roads change after vehicles have left', 'failed first-attempt deliveries caused by addresses, time windows or driver allocation', 'a cost per delivery that nobody can explain by route, hub or carrier'],
    cta: 'Agree a pilot at one hub or city, with the baseline cost per delivery and first-attempt delivery measured before it starts',
    launchTasks: ['Choose the pilot hub or city and write down its baseline cost per delivery and first-attempt delivery rate', 'Check the integration path with the TMS, WMS and order systems the first accounts run', 'Test the driver app offline on the phones the drivers carry'],
    channels: ['account-based email to named operations and supply chain leaders', 'LinkedIn posts from your experts and customers', 'operations roundtable or hub visit', 'trade event or association meeting'],
    adoption: { measure: 'hubs or cities live, drivers active in the app, and first-attempt delivery rate at the pilot hub', source: 'your dispatch and driver app data' },
    checklist: ['Pilot hub chosen and its baseline measures written down', 'Driver app tested offline on the phones in use', 'TMS, WMS and ERP integration path confirmed with the buyer\'s IT', 'Peak-season dates known, so the pilot does not collide with them'],
    deepQuestions: ['What changes in your volumes during the busiest weeks, and what breaks first?', 'How do drivers and hub staff get their plan for the day, and what do they do when it changes?', 'How are failed deliveries recorded, and who sees the reasons?', 'Which carriers or fleet types (own, contracted, outsourced) must be planned together?'],
    crises: [
      { key: 'dispatch_outage', title: 'Dispatch or routing outage with vehicles on the road', what: 'planning or tracking stops while vehicles are out', first: ['Freeze the last published route plan and send it to hub leads by the fallback channel', 'Tell drivers to continue on their last plan and use the offline app mode', 'Switch dispatchers to manual allocation for orders that arrive during the outage', 'Log every order assigned by hand so it can be reconciled when service returns'], tell: [{ who: 'Operations heads at affected customers', how: 'Call from the account owner', focus: 'Which hubs and routes are affected, the fallback in use, the next update time' }, { who: 'Hub managers and drivers', how: 'Fallback channel agreed in advance', focus: 'Continue on the last plan, record exceptions' }] },
    ],
    outage: 'an outage stops route planning or live tracking while vehicles are still out, so dispatchers fall back to phone calls and the last published plan',
    breach: 'exposure of customer addresses, delivery contacts, driver identities or live vehicle locations',
    churnReasons: [
    { reason: 'Pilot hub results did not carry over to other hubs', signal: 'Hubs after the pilot report lower first-attempt delivery than the pilot hub, and hub managers stop using the plans', action: 'Compare the pilot hub with the next hub on the same measures, and fix what differs (data, addresses, driver habits) before the next wave' },
    { reason: 'Drivers stopped using the app', signal: 'Fewer drivers active in the app each week, more manual dispatch calls, complaints from hub leads about the phone', action: 'Visit a hub, fix the app problems drivers name, and agree with the hub lead how adoption is measured' },
    { reason: 'Integration with the TMS, WMS or ERP kept breaking', signal: 'Repeated tickets about orders or addresses not arriving, manual re-entry by dispatchers', action: 'Name the owner of each integration on both sides and fix the data fields that fail most often' },
    { reason: 'A bigger logistics suite was bundled in', signal: 'The buyer\'s IT or procurement asks for a comparison with a suite they already license', action: 'Compare what dispatchers can do each day in each tool (re-planning, address cleaning, driver allocation), not the feature list' },
  ],
    renewal: 'Renewals often follow peak season: the buyer looks back at cost per delivery and first-attempt delivery for the busy weeks.',
    partners: { refer: ['supply chain and logistics consultants', 'ERP, TMS and WMS implementers who already sit with the Head of Supply Chain', '3PL and carrier networks that advise shippers'], resell: ['regional logistics software resellers', 'systems integrators with a transport practice'], integrate: ['TMS, WMS, ERP and order management vendors', 'telematics and driver app vendors', 'address and map data providers'], implement: ['ERP and supply chain systems integrators', 'logistics process consultancies'] },
  },
  // Logistics tech, freight visibility and shipment tracking.
  'freight-visibility': {
    deepQuestions: ['What happens to a shipment record when a carrier changes its status code or goes silent?', 'How do you judge today whether an arrival estimate was right?', 'Which exceptions does your team chase by hand every day, and who decides what to do about each one?', 'Who outside your own team (customers, carriers, customs agents) needs to see the same status?'],
    crises: [
      { key: 'tracking_failure', title: 'Tracking data stops or goes wrong while shipments are moving', what: 'carrier feeds, devices or port event sources stop or send wrong data, so the statuses and arrival estimates customers rely on are missing or wrong', first: ['Mark each shipment\'s status as of the last good update, so nobody reads old data as current', 'Find which carrier feeds, devices or event sources failed or sent wrong data', 'Tell customer service teams which shipments to confirm by hand with the carrier', 'Process the missed updates again and compare the arrival estimates with what actually happened'], tell: [{ who: 'Supply chain and logistics leads at affected customers', how: 'Call from the account owner', focus: 'Which carriers, lanes and shipments are affected, what to confirm by hand, the next update time' }, { who: 'Customer service teams at the customer', how: 'Message through the channel the customer agreed in advance', focus: 'Which statuses to trust, what to tell their own customers' }] },
    ],
    outage: 'an outage stops status updates and arrival estimates, so planners and customer service teams chase carriers by phone and email and cannot say where goods are',
    breach: 'exposure of shipment details, consignee contacts, carrier rates or tracking links held by the product',
    churnReasons: [
    { reason: 'Carrier data stayed patchy', signal: 'Shipments with no status for long stretches, planners still checking carrier portals by hand', action: 'Show which carriers and modes have gaps, how each gap is flagged, and fix the feeds the team named first' },
    { reason: 'Alerts were not acted on', signal: 'Exceptions pile up unread, customer service still hears about delays from customers first', action: 'Rank exceptions, send each to the person who can act, and agree which few the team acts on first' },
    { reason: 'Arrival estimates were not trusted', signal: 'Planners keep their own estimates, questions about why an estimate moved', action: 'Measure estimate accuracy on the buyer\'s own shipments and show the result each month' },
    { reason: 'The carriers\' own tracking was judged good enough', signal: 'Procurement or IT asks for a comparison with the carrier portals the team already has', action: 'Count the carriers and portals the team checks by hand and show what one view changes in the day' },
  ],
    renewal: 'Renewals follow the buyer\'s review of arrival estimate accuracy and the time spent chasing status: bring both for the period.',
    partners: { refer: ['supply chain and logistics consultants', 'ERP, TMS and WMS implementers who already sit with the Head of Supply Chain', 'freight forwarders and 3PLs that advise shippers'], resell: ['regional logistics software resellers', 'systems integrators with a transport practice'], integrate: ['TMS, WMS, ERP and order management vendors', 'carrier connectivity and data providers', 'port event and telematics data providers'], implement: ['ERP and supply chain systems integrators', 'logistics process consultancies'] },
  },
  // ITeS, IT services and application services (the line the neutral entry used to hold for every ITeS company).
  'it-services': {
    outage: 'a tooling or network failure stops the service desk, monitoring or managed services, and client users cannot reach support or see ticket status',
  },
  // Fintech, spend and expense management (the lines the neutral entry used to hold for every fintech company).
  'spend-expense': {
    pains: ['month-end close and reconciliation that take too many manual steps', 'spend, claims or invoices that break policy and are found late', 'audit questions about approvals and controls that take days to answer'],
    cta: 'Agree a pilot on one entity or department, with one month of the buyer\'s own transactions as the test',
    launchTasks: ['Prepare the security and compliance pack (data residency, access controls, audit logs, certifications you actually hold)', 'Write the ERP or ledger posting guide with the finance controller\'s team in mind', 'Plan the cut-over just after a month-end close, with old and new running side by side for one cycle'],
    channels: ['account-based email to CFOs and finance controllers', 'LinkedIn posts from your experts and customers', 'finance leaders roundtable', 'partner and accountant referrals'],
    adoption: { measure: 'entities or departments live, and the share of transactions posted through the product', source: 'your product usage data and the buyer\'s ERP posting records' },
    checklist: ['Security and compliance pack ready before the buyer asks', 'ERP posting path tested with the buyer\'s chart of accounts', 'Cut-over date agreed around a month-end close', 'Claims you make about certifications match what you hold'],
    deepQuestions: ['Which approvals or policy checks are done by hand today, and who signs them?', 'How are exceptions found: during the month, at close, or at audit?', 'Which entities, currencies or tax regimes must be covered from the start?', 'What must the audit trail show that it does not show today?'],
    crises: [
      { key: 'posting_error', title: 'Wrong postings, payments or reconciliation errors', what: 'transactions are posted, approved or paid wrongly and reach the customer\'s ledger', first: ['Stop the posting or payout job that produced the error', 'List every affected entity, ledger and period', 'Prepare the corrected entries and who approves them', 'Tell the finance controller before month-end close is affected'], tell: [{ who: 'Finance controller and CFO at affected customers', how: 'Call from the account owner, then a written summary', focus: 'What was posted wrongly, the corrected entries, the effect on the close' }, { who: 'Internal audit and compliance contacts', how: 'Written note', focus: 'Facts, controls that failed, the fix' }] },
    ],
    outage: 'an outage stops approvals, card or payment processing or ERP posting, and the finance team falls back to manual approvals and spreadsheets near a close or a payment run',
    churnReasons: [
    { reason: 'The ERP module closed the gap', signal: 'Finance asks why the ERP module cannot do the same, or a new ERP release is planned', action: 'Show the gap between the module and the daily workflow (approvals, receipts, cards, posting) on one month of their transactions' },
    { reason: 'A control or audit finding the product did not cover', signal: 'Internal audit or compliance raises a finding about spend controls or approvals', action: 'Map the finding to a control the product can meet, and say plainly what it cannot' },
    { reason: 'Integration with the ledger kept needing fixes', signal: 'Repeated posting errors, manual journal entries, reconciliation delays at month end', action: 'Name the integration owner on both sides and fix the postings that fail most often before the next close' },
    { reason: 'The finance owner who chose the product left', signal: 'The new controller or CFO asks basic questions again or reviews all vendors', action: 'Meet the new owner early with the close and reconciliation results from before and after' },
  ],
    renewal: 'Renewals tend to follow the audit and budget cycle: bring the reconciliation and close results for the period.',
    partners: { refer: ['accounting and audit firms that advise CFOs', 'ERP and HRMS implementation partners', 'banks and card issuers that serve the same finance teams'], resell: ['finance software resellers', 'outsourced accounting providers'], integrate: ['ERP and accounting software vendors', 'banks and payment providers', 'HR and travel systems'], implement: ['ERP implementation partners', 'finance transformation consultancies'] },
    partnerWhy: 'The CFO and Finance Controller take advice from auditors, accountants and the ERP partner, and every deal passes a security and compliance review.',
  },
  // Fintech, payments and banking APIs.
  'payments-banking': {
    deepQuestions: ['What happens to a payment that is sent twice, or sent and never confirmed?', 'How do you tell, in the first minutes, that success rates have fallen?', 'Which of your customers\' flows cannot be interrupted, and what do they do when the provider is slow?', 'Who is told when a payment partner changes its rules or its fees?'],
    crises: [
      { key: 'payment_failure', title: 'Failed, duplicated or delayed payments', what: 'payments fail, are taken twice or settle late for several customers at once', first: ['Stop retries and automatic re-submission that could take a payment twice', 'List the affected payments, customers and settlement periods', 'Reconcile against the partner bank or processor records before giving any customer a figure', 'Prepare refunds or reversals and who approves them'], tell: [{ who: 'Technology and payments leads at affected customers', how: 'Call from the account owner, then a status note', focus: 'Which payments are affected, whether money moved twice or not at all, the next update time' }, { who: 'Banking and payment partners', how: 'Formal notice per your agreements', focus: 'Facts, affected volumes, actions taken' }] },
    ],
    outage: 'an outage stops payments, payouts or account data calls, so the customer\'s checkout or app fails for its own users and money in flight is in doubt',
    churnReasons: [
    { reason: 'Payment success rates did not improve', signal: 'The buyer compares failed or declined payments with the previous provider and asks for a breakdown by method', action: 'Break the failures down by method, issuer and error type with the buyer\'s technical lead, and agree the one change to test first' },
    { reason: 'Settlement or reconciliation questions kept coming', signal: 'Finance tickets about payments that are missing, duplicated or late in the settlement report', action: 'Give finance a daily reconciliation view and name who answers a settlement question on each side' },
    { reason: 'A second provider took part of the volume', signal: 'Volume per payment method falls while the buyer\'s technology team tests another provider', action: 'Ask what the other provider does for them that you do not, and propose a measured split on one flow' },
    { reason: 'Integration changes took too long', signal: 'Requests wait in the buyer\'s technology queue, the sandbox and the live service behave differently', action: 'Name the integration owner on both sides, fix the sandbox gaps they list and agree a date for the next release' },
  ],
    renewal: 'Renewals follow the buyer\'s review of success rates, settlement accuracy and incidents: bring the record for the period.',
    partners: { refer: ['payments and banking consultancies that advise technology and product heads', 'systems integrators that build checkout and onboarding flows', 'banks and processors that serve the same businesses'], resell: ['software and platform partners that embed payments for their customers', 'regional resellers with merchant relationships'], integrate: ['commerce, ERP and accounting platforms', 'banks, card networks and processors', 'fraud and identity vendors'], implement: ['systems integrators for checkout and payouts', 'finance operations consultancies'] },
    partnerWhy: 'The head of payments and the technology head follow the advice of the integrators and platforms that build their checkout and payout flows, and every deal passes a security and compliance review.',
  },
  // Vertical SaaS, FMCG retail execution (the lines the neutral entry used to hold for every vertical SaaS company).
  'fmcg-retail-execution': {
    pains: ['reps who capture orders on paper or in several apps, so secondary sales are seen late', 'trade schemes that are not communicated to reps or checked in the outlet', 'distributor stock and order data that are out of sync with the company\'s view'],
    cta: 'Agree a pilot in one region with a set of distributors, with a measured comparison region',
    launchTasks: ['Choose the pilot region and the distributors in it, and record the baseline productive calls and outlet coverage', 'Test the app offline on the low-end phones the reps carry', 'Agree how distributor stock and orders flow back from the DMS before rollout'],
    channels: ['account-based email to sales heads and sales operations', 'LinkedIn posts from your experts and customers', 'field visit to a pilot region', 'industry and sales leaders meetups'],
    adoption: { measure: 'regions and reps live, and productive calls and orders captured in the app per rep', source: 'your app usage data and the buyer\'s secondary sales reports' },
    checklist: ['Pilot region, distributors and comparison region agreed', 'Offline order capture tested on low-end phones', 'DMS and ERP data flow confirmed with IT', 'Rep incentives tied to orders captured in the app'],
    deepQuestions: ['How does a rep decide which outlets to visit, and who changes the beat plan?', 'What happens to an order captured in an outlet with no network?', 'How do distributors receive and confirm orders today?', 'Which schemes and price lists change in a month, and how fast must reps see them?'],
    crises: [
      { key: 'sync_failure', title: 'Order or distributor data sync failure', what: 'orders captured by reps do not reach distributors, or stock data goes wrong', first: ['Stop automatic pushes to distributor systems', 'Switch reps to offline capture with a daily upload', 'List orders captured during the failure and their status', 'Agree with each distributor how orders are replayed'], tell: [{ who: 'Sales heads and sales operations at affected customers', how: 'Call from the account owner', focus: 'Which regions and distributors are affected, how orders are protected, when sync returns' }, { who: 'Regional managers and reps', how: 'Message through the sales hierarchy', focus: 'Keep capturing orders offline, what not to re-enter' }] },
    ],
    outage: 'an outage stops order capture and beat plans in the field, and reps fall back to paper and phone calls while distributors wait for orders',
    breach: 'exposure of outlet lists, order and price data, distributor terms or rep location data',
    churnReasons: [
    { reason: 'Reps went back to old ways of capturing orders', signal: 'Orders captured in the app fall while distributors report orders by phone or paper', action: 'Visit the region, fix what reps name, and tie incentives to orders captured in the app' },
    { reason: 'The DMS vendor\'s bundled app was good enough', signal: 'Sales operations compares the sales app with the app that comes with the distributor system', action: 'Compare what reps can do in the outlet with each app (order suggestions, schemes, stock visibility)' },
    { reason: 'Distributor data stayed out of sync', signal: 'Stock and order numbers differ between the company and its distributors', action: 'Name the distributor systems involved and agree how stock and orders flow back, region by region' },
    { reason: 'The national rollout lost its sponsor', signal: 'The sales head who backed the rollout changes role and waves are postponed', action: 'Re-baseline the wave plan with the new sponsor, using the pilot region\'s productive calls and coverage' },
  ],
    renewal: 'Renewals follow the sales year: show productive calls, outlet coverage and secondary sales in the pilot region against the comparison region.',
    partners: { refer: ['route-to-market and sales consultancies', 'DMS and ERP integrators who serve the same distributors', 'trade marketing and retail audit agencies'], resell: ['regional software resellers close to FMCG sales teams', 'mobile device and telecom resellers serving field forces'], integrate: ['DMS, ERP and tax or invoicing systems', 'retail audit and image recognition vendors'], implement: ['ERP and DMS integrators', 'change management consultancies for sales teams'] },
    partnerWhy: 'The National Sales Head and Head of Sales Operations take advice from route-to-market consultants, and the rollout depends on the DMS and ERP integrators who already work with the distributors.',
  },
  // Telecom, operators and enterprise connectivity (the lines the neutral entry used to hold for every telecom company).
  'operators-connectivity': {
    pains: ['branch or site links that fail, with slow repairs and several providers to call', 'a network that is expensive to manage across many sites and many links', 'security that has to be added on top of the network, with unclear ownership of incidents'],
    cta: 'Agree a site survey and a pilot at the sites where service is worst today, with uptime and repair time compared against the current provider',
    launchTasks: ['Prepare the site survey checklist and the shortlist of pilot sites (the sites with the worst service first)', 'Write the wave plan with fallback links and a rollback rule for each wave', 'Prepare the rate-card comparison in cost per site, including outages and the IT team\'s time'],
    channels: ['account-based outreach to CIOs and heads of IT infrastructure', 'account manager briefings for existing customers', 'CIO and network leaders roundtable', 'responses to requests for proposal and rate-card comparisons'],
    adoption: { measure: 'sites live per wave, uptime per site and repair time at the pilot sites', source: 'your network operations reports' },
    checklist: ['Pilot sites chosen and surveyed', 'Wave plan with rollback rules', 'Rate-card comparison in cost per site', 'Security overlay explained: who responds to an incident'],
    deepQuestions: ['Which sites cost the most when they go down, and how do you know?', 'Who manages the links today, and how many providers do you call for a repair?', 'Which sites have a second link, and which have none?', 'Which contracts end when, and what is the notice period?'],
    crises: [
      { key: 'network_outage', title: 'Network outage across customer sites', what: 'links or a core network fail across several customer sites at once', first: ['Open one incident and name the incident commander and the network operations lead', 'List affected sites and customers, starting with sites that have no second link', 'Fail over to the backup path where one exists, and dispatch field engineers to sites with a local fault', 'Start the service credit log from the first minute of the outage'], tell: [{ who: 'Customer network owners and CIOs', how: 'Call from the account owner, then a status update by agreed channel', focus: 'Which sites, the fallback in use, the repair plan and the next update time' }, { who: 'Customer security teams', how: 'Direct note', focus: 'Whether traffic or inspection was affected while links were down' }] },
    ],
    outage: 'a link or core network failure takes sites offline, branches lose their systems, and the customer\'s IT team calls you and the other providers at the same time',
    churnReasons: [
    { reason: 'Repeated outages at the same sites', signal: 'The same sites appear in incident reports again and again, service credits are paid', action: 'Run an incident review per site and agree a fallback link plan for the sites that fail most' },
    { reason: 'Repairs took too long', signal: 'Long repair times, escalations to your management, the customer calls other providers in parallel', action: 'Agree a repair-time commitment you can meet, and show the repair record per site' },
    { reason: 'Price per site against the national operator', signal: 'Rate-card comparisons by site, requests to cut low-use sites', action: 'Compare the total cost per site including outages, repair time and the IT team\'s time' },
    { reason: 'Cut-over of sites slipped from its wave', signal: 'Sites late in their wave, rollback requests, branch complaints', action: 'Reset the wave plan with a rollback rule for each wave and a named owner per region' },
  ],
    renewal: 'Renewals follow the contract end and often a re-tender: bring the uptime and repair record for each site.',
    partners: { refer: ['network and IT consultancies that advise CIOs', 'systems integrators that run branch and data centre projects', 'managed security providers that need the network underneath'], resell: ['IT resellers and managed service providers with branch customers', 'system integrators that bundle connectivity into their contracts'], integrate: ['security and cloud access vendors', 'cloud providers and data centre operators', 'IT service management tools'], implement: ['network integrators for site installation and cut-over', 'field engineering partners for sites outside your coverage'] },
    partnerWhy: 'The CIO and the network head often buy connectivity inside a wider IT or security project led by an integrator or consultant, who also decides which provider is included.',
  },
  // Telecom, CPaaS and messaging.
  'cpaas-messaging': {
    deepQuestions: ['Who decides which route or provider carries each kind of message, and how often is that changed?', 'How quickly do you learn that one channel or country is delivering badly, and from whom?', 'Who sends the messages: your own product, your customers\' systems, or both?', 'What do you do when a channel provider or an operator changes its rules or its fees?'],
    crises: [
      { key: 'message_delivery', title: 'Messages delayed, lost or sent twice', what: 'messages that customers or their end users depend on (codes, alerts, notices) are delayed, lost or sent more than once', first: ['Pause bulk and scheduled sends so the queue does not grow', 'Find the routes, operators or channels that are failing and move traffic to a working route where one exists', 'List the affected messages by customer and by type, one time codes and alerts first', 'Tell customers which of their messages need to be sent again, and who does it'], tell: [{ who: 'Technology owners at affected customers', how: 'Call from the account owner, then a status update by agreed channel', focus: 'Which messages and channels are affected, what is queued, what to send again, the next update time' }, { who: 'Customer support teams at the customer', how: 'Message through the channel the customer agreed in advance', focus: 'What their end users may see and what to tell them' }] },
    ],
    outage: 'an outage stops messages or calls from being sent or received, so one time codes, alerts and notices fail for the customer\'s own users',
    churnReasons: [
    { reason: 'Delivery fell on some routes', signal: 'Customers report messages not arriving in some countries or on some networks', action: 'Show delivery by route and country, fix or replace the weak routes, and agree how delivery is reported each month' },
    { reason: 'Sender approvals and channel rules slowed the customer down', signal: 'Requests for new senders, templates or channels wait in a queue', action: 'Name one owner for approvals, share the status of each request and agree the lead time' },
    { reason: 'Price per message compared with another provider', signal: 'Quotes from other providers, requests for volume pricing', action: 'Compare the total cost of delivered messages, including failed sends and support time' },
    { reason: 'The customer moved a channel to another provider', signal: 'Volume on one channel falls while another provider is tested', action: 'Ask what the other provider does on that channel that you do not, and propose a measured split' },
  ],
    renewal: 'Renewals follow the review of delivery quality and incidents: bring delivery by route and the incident record for the period.',
    partners: { refer: ['digital agencies and consultancies that build customer messaging', 'systems integrators for contact centres and customer platforms'], resell: ['software and platform partners that bundle messaging', 'regional telecom resellers'], integrate: ['CRM, marketing and customer data platforms', 'channel providers and operators', 'fraud and identity vendors'], implement: ['systems integrators for customer platforms', 'digital agencies that build messaging flows'] },
    partnerWhy: 'Product and technology heads follow the advice of the agencies and integrators that build their customer messaging, and those partners also own the platform connections.',
  },
  // Cybersecurity, cloud security (the lines the neutral entry used to hold for every cybersecurity company).
  'cloud-security': {
    pains: ['too many alerts and findings, with no ranking by real exposure', 'unknown assets, systems or exposures that the team only finds after an incident or an audit', 'tools that do not connect to the SIEM and ticketing the team already runs'],
    launchTasks: ['Write the proof of value plan: scope, success criteria and what will be found and closed', 'Prepare the integration notes for the SIEM, ticketing and cloud accounts the team uses', 'Prepare the briefing for the CISO and the SOC or cloud security lead, with the evidence the audit team will want'],
    adoption: { measure: 'proofs of value started and converted, assets covered and findings closed during the proof', source: 'your proof of value reports and product telemetry' },
    checklist: ['Proof of value plan with written success criteria', 'Integration notes for SIEM, ticketing and cloud accounts', 'Security and privacy documentation ready before it is asked for', 'Claims about detection match what the product does today'],
  },
  // Software, testing and QA tools.
  testing: {
    pains: ['releases that are slowed by tests, builds or manual checks', 'open-source or home-made tools that someone has to keep running', 'migration work that stops teams from trying a new tool'],
    cta: 'Start a trial with one team on one real project, and migrate one existing test suite or service during the trial',
    deepQuestions: ['How are tests or specs written and maintained, and by whom?', 'Which tests run on every change, and which only before a release?', 'Which browsers, devices or services must tests cover, and who keeps that list?', 'How do you decide today that a failed test is a real defect?'],
    churnReasons: [
    { reason: 'The team went back to its open-source setup', signal: 'Fewer projects run through the product, builds or tests moved back to the old scripts', action: 'Compare the time spent maintaining the open-source setup with what the product removes, on one team' },
    { reason: 'Migration of existing tests or scripts stalled', signal: 'Migration tickets stay open, only new projects use the product', action: 'Migrate one real project with the team and show the import path' },
    { reason: 'Per-user cost at larger scale', signal: 'Procurement asks for the price at the next stage of growth', action: 'Tie the price to the teams that use it and the time saved, measured on their own data' },
    { reason: 'The developer champion left', signal: 'The sponsor on the platform team changes and usage drops in that team', action: 'Find the next champion on the team and show the usage and time saved so far' },
  ],
  },
};
export function playbookFor(v: { id: VerticalId; name: string; subtype?: string }): Playbook {
  const base = /billing/i.test(v.name) ? BILLING_PLAYBOOK : /investment management/i.test(v.name) ? INVESTMENT_PLAYBOOK : PLAYBOOKS[v.id];
  const own = v.subtype ? SUBTYPE_PLAYBOOKS[v.subtype] : undefined;
  return own && base === PLAYBOOKS[v.id] ? { ...base, ...own } : base;
}

/** One line for a tool that used the neutral entry of a vertical (the seller's words named no kind of company): the lines fit any company in the
 * vertical, and the kinds that have lines of their own are named, with the input that gets them. Empty when a sub-type or a profile was read, or
 * when the vertical has no kind with lines of its own; otherwise a paragraph that starts with a blank line, to be placed after the sector line. `who` is the company or product as typed (cut short), `field` the input to fill. */
export const LAUNCH_FIELDS: Array<keyof PlaybookOverlay> = ['pains', 'cta', 'launchTasks', 'channels', 'adoption', 'checklist'];
const OTHER_FIELDS: Array<keyof PlaybookOverlay> = ['crises', 'outage', 'breach', 'churnReasons', 'renewal', 'deepQuestions', 'partners', 'partnerWhy'];
export function kindsNote(v: { id: VerticalId; name: string; subtype?: string } | null | undefined, who: string, field: string, uses: Array<keyof PlaybookOverlay> = OTHER_FIELDS): string {
  if (!v || v.subtype || /billing|investment management/i.test(v.name)) return '';
  // Only the kinds that have lines of their own in the fields this tool prints (launch_commander prints the launch lines, the others the rest).
  const kinds = SUBTYPES.filter((st) => st.vertical === v.id && SUBTYPE_PLAYBOOKS[st.id] && uses.some((f) => SUBTYPE_PLAYBOOKS[st.id][f] !== undefined)).map((st) => st.name);
  if (!kinds.length) return '';
  const short = who.trim().replace(/\s+/g, ' ');
  const name = short.length > 60 ? `${short.slice(0, short.lastIndexOf(' ', 60) > 20 ? short.lastIndexOf(' ', 60) : 60)}...` : short;
  const list = kinds.join('; ');
  return `\n\n*For ${name}: the sector lines below fit any company in ${v.name}. Lines written for one kind of company exist for these kinds: ${list}. Say what it sells in the ${field} input to get them.*`;
}
