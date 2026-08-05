/*
 * AI-in-Cybersecurity Maturity Framework
 * ---------------------------------------
 * Single source of truth for the assessment model: maturity scale, domains,
 * weighted questions and the register of assessed entities.
 *
 * Loaded as a classic script (no ES modules / no fetch) so that every page in
 * this toolkit also works when opened directly from disk via file://.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  AIMA.meta = {
    schemaVersion: '1.0.0',
    frameworkVersion: '2026.1',
    title: 'AI in Cybersecurity Maturity Assessment',
    owner: 'Health Sector Governing Body — Cybersecurity Directorate',
    subtitle: 'Sector-wide assessment of how member entities adopt artificial intelligence within their cybersecurity programme',
    references: [
      'NIST AI Risk Management Framework (AI RMF 1.0)',
      'NIST Cybersecurity Framework 2.0',
      'ISO/IEC 42001 — AI management systems',
      'ISO/IEC 27001:2022 — Information security management',
      'HHS HICP / health-sector cybersecurity practices'
    ]
  };

  /* ------------------------------------------------------------------ *
   * Maturity scale
   * ------------------------------------------------------------------ */

  // Answer options for every question. `value` feeds the scoring engine.
  AIMA.scale = [
    { value: 0, label: 'None', short: '0', description: 'Not in place. No activity, tooling or intent recorded.' },
    { value: 1, label: 'Initial', short: '1', description: 'Ad-hoc and undocumented. Depends on individual effort or a one-off trial.' },
    { value: 2, label: 'Developing', short: '2', description: 'Partially implemented or piloted. Inconsistent across the entity.' },
    { value: 3, label: 'Defined', short: '3', description: 'Documented, approved and consistently applied across critical scope.' },
    { value: 4, label: 'Managed', short: '4', description: 'Measured with KPIs, broad coverage, reviewed and reported regularly.' },
    { value: 5, label: 'Optimising', short: '5', description: 'Continuously improved, largely automated and benchmarked against peers.' }
  ];

  AIMA.NOT_APPLICABLE = 'na';

  // Maturity levels. `min`/`max` are inclusive bounds on the 0–5 score.
  AIMA.levels = [
    { level: 1, name: 'Initial',    min: 0.00, max: 1.49, color: '#dc2626', tint: '#fee2e2', description: 'AI use in cybersecurity is absent or experimental, with no governance or measurement.' },
    { level: 2, name: 'Developing', min: 1.50, max: 2.49, color: '#ea580c', tint: '#ffedd5', description: 'Isolated pilots and vendor defaults. Value is unproven and coverage is partial.' },
    { level: 3, name: 'Defined',    min: 2.50, max: 3.49, color: '#ca8a04', tint: '#fef9c3', description: 'Documented and repeatable AI-enabled practices applied across critical systems.' },
    { level: 4, name: 'Managed',    min: 3.50, max: 4.49, color: '#0d9488', tint: '#ccfbf1', description: 'AI is integrated into security operations, measured with KPIs and governed end to end.' },
    { level: 5, name: 'Optimising', min: 4.50, max: 5.00, color: '#1d4ed8', tint: '#dbeafe', description: 'Continuous improvement, automation at scale and sector leadership on AI assurance.' }
  ];

  AIMA.defaultTargetLevel = 4;

  /* ------------------------------------------------------------------ *
   * Entity register — 30 member entities of the governing body
   * Edit the names/types/regions here to match your own organisation.
   * ------------------------------------------------------------------ */

  AIMA.entityTypes = [
    'Tertiary Hospital',
    'General Hospital',
    'Specialty Hospital',
    'Primary Care Cluster',
    'Diagnostics & Laboratories',
    'Public Health',
    'Emergency Services',
    'Insurance & Claims',
    'Shared Services',
    'Research & Academia'
  ];

  AIMA.regions = ['Central', 'North', 'South', 'East', 'West'];

  AIMA.entitySizes = [
    'Small (< 500 staff)',
    'Medium (500–2,000 staff)',
    'Large (2,000–10,000 staff)',
    'Very large (> 10,000 staff)'
  ];

  AIMA.entities = [
    { code: 'E01', name: 'Central Medical City',                        type: 'Tertiary Hospital',        region: 'Central', size: 'Very large (> 10,000 staff)' },
    { code: 'E02', name: 'Northern Teaching Hospital',                   type: 'Tertiary Hospital',        region: 'North',   size: 'Large (2,000–10,000 staff)' },
    { code: 'E03', name: 'Southern Regional Hospital',                   type: 'General Hospital',         region: 'South',   size: 'Large (2,000–10,000 staff)' },
    { code: 'E04', name: 'Eastern Regional Hospital',                    type: 'General Hospital',         region: 'East',    size: 'Large (2,000–10,000 staff)' },
    { code: 'E05', name: 'Western Regional Hospital',                    type: 'General Hospital',         region: 'West',    size: 'Large (2,000–10,000 staff)' },
    { code: 'E06', name: 'Capital General Hospital',                     type: 'General Hospital',         region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E07', name: "Children's Specialty Hospital",                type: 'Specialty Hospital',       region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E08', name: "Maternity & Women's Hospital",                 type: 'Specialty Hospital',       region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E09', name: 'National Oncology Centre',                     type: 'Specialty Hospital',       region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E10', name: 'Cardiac Care Centre',                          type: 'Specialty Hospital',       region: 'North',   size: 'Medium (500–2,000 staff)' },
    { code: 'E11', name: 'Behavioural Health Hospital',                  type: 'Specialty Hospital',       region: 'South',   size: 'Medium (500–2,000 staff)' },
    { code: 'E12', name: 'Rehabilitation & Long-Term Care Hospital',     type: 'Specialty Hospital',       region: 'East',    size: 'Small (< 500 staff)' },
    { code: 'E13', name: 'Ophthalmology Hospital',                       type: 'Specialty Hospital',       region: 'West',    size: 'Small (< 500 staff)' },
    { code: 'E14', name: 'Central Primary Care Cluster',                 type: 'Primary Care Cluster',     region: 'Central', size: 'Large (2,000–10,000 staff)' },
    { code: 'E15', name: 'Northern Primary Care Cluster',                type: 'Primary Care Cluster',     region: 'North',   size: 'Medium (500–2,000 staff)' },
    { code: 'E16', name: 'Southern Primary Care Cluster',                type: 'Primary Care Cluster',     region: 'South',   size: 'Medium (500–2,000 staff)' },
    { code: 'E17', name: 'Eastern Primary Care Cluster',                 type: 'Primary Care Cluster',     region: 'East',    size: 'Medium (500–2,000 staff)' },
    { code: 'E18', name: 'Western Primary Care Cluster',                 type: 'Primary Care Cluster',     region: 'West',    size: 'Medium (500–2,000 staff)' },
    { code: 'E19', name: 'National Reference Laboratory',                type: 'Diagnostics & Laboratories', region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E20', name: 'Regional Diagnostics & Imaging Network',       type: 'Diagnostics & Laboratories', region: 'North',   size: 'Medium (500–2,000 staff)' },
    { code: 'E21', name: 'National Blood & Tissue Services',             type: 'Diagnostics & Laboratories', region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E22', name: 'Public Health & Epidemiology Authority',       type: 'Public Health',            region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E23', name: 'Health Emergency Operations Centre',           type: 'Public Health',            region: 'Central', size: 'Small (< 500 staff)' },
    { code: 'E24', name: 'National Ambulance & Emergency Services',      type: 'Emergency Services',       region: 'Central', size: 'Large (2,000–10,000 staff)' },
    { code: 'E25', name: 'Health Insurance & Claims Authority',          type: 'Insurance & Claims',       region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E26', name: 'Pharmaceutical Supply & Logistics Authority',  type: 'Shared Services',          region: 'Central', size: 'Medium (500–2,000 staff)' },
    { code: 'E27', name: 'Health Information Exchange & Digital Platforms', type: 'Shared Services',       region: 'Central', size: 'Large (2,000–10,000 staff)' },
    { code: 'E28', name: 'Medical Research Institute',                   type: 'Research & Academia',      region: 'Central', size: 'Small (< 500 staff)' },
    { code: 'E29', name: 'Health Workforce Training Academy',            type: 'Research & Academia',      region: 'Central', size: 'Small (< 500 staff)' },
    { code: 'E30', name: 'Facilities & Biomedical Engineering Services', type: 'Shared Services',          region: 'Central', size: 'Medium (500–2,000 staff)' }
  ];

  /* ------------------------------------------------------------------ *
   * Domains and questions
   * Domain weights are percentages and must total 100.
   * Question weights are relative within their domain (1 = standard, 1.5 = critical).
   * ------------------------------------------------------------------ */

  AIMA.domains = [
    {
      id: 'GOV',
      name: 'AI Governance, Policy & Accountability',
      weight: 12,
      description: 'Mandate, policy and oversight for the use of AI inside the cybersecurity function.',
      questions: [
        { id: 'GOV-1', weight: 1.5, text: 'An approved policy governs the use of AI/ML within cybersecurity, covering acceptable use, data handling and human oversight.', help: 'Look for a signed policy or standard that explicitly names AI/ML and GenAI use in security operations.', remedy: 'Issue an AI-in-security policy covering approved use cases, data handling, human oversight and prohibited uses.' },
        { id: 'GOV-2', weight: 1.0, text: 'A named owner or committee is accountable for AI-in-security decisions, with a documented mandate and escalation path.', help: 'A CISO-chaired AI review board, or AI risk items formally delegated to an existing security governance committee.', remedy: 'Assign accountability for AI-in-security to a named owner or committee with a written mandate and escalation route.' },
        { id: 'GOV-3', weight: 1.5, text: 'A current register of AI capabilities used in security exists (vendor features, models, agents, in-house scripts).', help: 'Includes AI features embedded in existing tools, not only standalone AI products.', remedy: 'Build and maintain a register of AI capabilities used in security, including embedded vendor AI features.' },
        { id: 'GOV-4', weight: 1.0, text: 'Every AI security use case passes a documented risk assessment before deployment (privacy, bias, error impact, patient safety).', help: 'Evidence: completed assessments with named reviewers and residual-risk decisions.', remedy: 'Introduce a pre-deployment AI risk assessment gate that considers privacy, error impact and clinical safety.' },
        { id: 'GOV-5', weight: 1.0, text: 'AI security practices are mapped to recognised frameworks (NIST AI RMF, ISO/IEC 42001, NIST CSF 2.0) and to regulatory obligations.', help: 'A traceability matrix or control mapping maintained and reviewed.', remedy: 'Map current AI security practices to NIST AI RMF and ISO/IEC 42001 and close the identified control gaps.' },
        { id: 'GOV-6', weight: 1.0, text: 'Human-in-the-loop and override requirements are defined for AI-driven security decisions that can affect clinical services.', help: 'Explicit rules on which actions may never run without human approval.', remedy: 'Define mandatory human approval and override rules for AI actions touching clinical systems.' }
      ]
    },
    {
      id: 'STR',
      name: 'Strategy, Roadmap & Investment',
      weight: 8,
      description: 'Whether AI adoption in security is deliberate, funded and measured for value.',
      questions: [
        { id: 'STR-1', weight: 1.5, text: 'A documented multi-year roadmap sets out prioritised AI use cases for cybersecurity.', help: 'Prioritisation should reference risk reduction, not only technology availability.', remedy: 'Publish a prioritised AI-in-security roadmap tied to the entity risk register.' },
        { id: 'STR-2', weight: 1.0, text: 'Budget is explicitly allocated to AI security capability (tooling, data engineering, skills).', help: 'Ring-fenced line items rather than opportunistic spend.', remedy: 'Secure a dedicated budget line for AI security capability including data engineering and skills.' },
        { id: 'STR-3', weight: 1.0, text: 'A business case and value measurement exist for AI investments (e.g. MTTD/MTTR reduction, analyst effort saved, coverage gained).', help: 'Baseline metrics captured before deployment and compared afterwards.', remedy: 'Define baseline metrics and post-deployment benefit tracking for each AI security investment.' },
        { id: 'STR-4', weight: 1.0, text: 'AI security plans are coordinated with the governing body’s central programmes and reuse shared or national services where available.', help: 'Avoids duplicated licences and inconsistent controls across entities.', remedy: 'Align the entity roadmap with central/shared AI security services offered by the governing body.' },
        { id: 'STR-5', weight: 1.0, text: 'Progress on AI in cybersecurity is reported to executive leadership at least quarterly.', help: 'Board or executive pack with AI-specific metrics and risks.', remedy: 'Add AI-in-security metrics and risks to the quarterly executive security report.' }
      ]
    },
    {
      id: 'DAT',
      name: 'Data Foundation, Telemetry & Integration',
      weight: 12,
      description: 'The data quality, coverage and privacy controls that any AI security capability depends on.',
      questions: [
        { id: 'DAT-1', weight: 1.5, text: 'Security telemetry is centrally collected across endpoint, network, identity, cloud, clinical applications and medical devices.', help: 'Coverage gaps should be known and tracked, not assumed.', remedy: 'Extend central telemetry collection to the domains with no coverage, starting with clinical applications and medical devices.' },
        { id: 'DAT-2', weight: 1.5, text: 'Log retention, normalisation and time synchronisation are sufficient to support analytics and model tuning.', help: 'Consistent schema, reliable timestamps, retention aligned to investigation needs.', remedy: 'Normalise log schemas and align retention and time synchronisation with analytics requirements.' },
        { id: 'DAT-3', weight: 1.0, text: 'A central data platform (SIEM, data lake or equivalent) with documented pipelines feeds the AI/analytics use cases.', help: 'Pipelines documented, monitored and owned.', remedy: 'Consolidate security data into a governed platform with documented, monitored pipelines.' },
        { id: 'DAT-4', weight: 1.5, text: 'Data classification, minimisation and masking of patient data are applied before it is used in AI analytics.', help: 'Critical where telemetry or tickets may contain PHI, and where vendor AI processes data off-premise.', remedy: 'Apply PHI minimisation and masking to any data flowing into AI analytics or vendor AI services.' },
        { id: 'DAT-5', weight: 1.0, text: 'Asset, identity and medical-device inventories are accurate enough to enrich AI detections.', help: 'CMDB, IoMT inventory and HR/identity feeds joined to security events.', remedy: 'Improve asset, identity and IoMT inventory accuracy and join them to security event enrichment.' },
        { id: 'DAT-6', weight: 1.0, text: 'Data quality is monitored and issues feed back into detection and model tuning.', help: 'Alerts on log source silence, parsing failures and schema drift.', remedy: 'Monitor log source health and schema drift, and route findings into detection tuning.' }
      ]
    },
    {
      id: 'DET',
      name: 'AI-Driven Threat Detection & Monitoring',
      weight: 14,
      description: 'Use of behavioural analytics and machine learning to find threats earlier and reduce analyst noise.',
      questions: [
        { id: 'DET-1', weight: 1.5, text: 'Behavioural analytics and anomaly detection (UEBA, NDR or equivalent) are deployed and tuned beyond vendor defaults.', help: 'Tuning evidence: suppressed noisy baselines, entity-specific thresholds.', remedy: 'Deploy and locally tune behavioural analytics rather than relying on out-of-the-box vendor baselines.' },
        { id: 'DET-2', weight: 1.5, text: 'AI assists alert triage: correlation, deduplication, enrichment and risk-based prioritisation in the SOC queue.', help: 'Measured reduction in alert volume reaching analysts.', remedy: 'Introduce AI-assisted correlation and risk-based prioritisation to reduce the analyst alert queue.' },
        { id: 'DET-3', weight: 1.5, text: 'AI-enabled detection covers the critical clinical estate (EMR/HIS, PACS, laboratory, pharmacy, scheduling).', help: 'Clinical systems are often excluded from advanced analytics.', remedy: 'Extend AI-enabled detection coverage to EMR/HIS, PACS, laboratory and pharmacy systems.' },
        { id: 'DET-4', weight: 1.0, text: 'Detection engineering measures the precision, recall and false-positive rate of AI-driven detections.', help: 'Regular review of detection performance with retirement of poor performers.', remedy: 'Track precision and false-positive rates per AI detection and retire or retune poor performers.' },
        { id: 'DET-5', weight: 1.0, text: 'AI is applied to email, phishing and web defence, tuned for healthcare-targeted lures and impersonation.', help: 'Includes business email compromise attempts against finance and procurement.', remedy: 'Tune AI-based email defence for healthcare-specific lures and executive impersonation.' },
        { id: 'DET-6', weight: 1.0, text: 'Monitoring coverage is continuous, with AI augmenting analyst capacity and documented handover for out-of-hours.', help: '24×7 coverage achieved without relying on AI as an unsupervised replacement.', remedy: 'Use AI triage to extend out-of-hours monitoring while keeping documented analyst handover.' }
      ]
    },
    {
      id: 'RES',
      name: 'AI-Assisted Response & Automation',
      weight: 12,
      description: 'Automated and AI-supported containment, investigation and recovery — with clinical-safety guardrails.',
      questions: [
        { id: 'RES-1', weight: 1.5, text: 'Response playbooks are automated (SOAR or equivalent) with AI-suggested or AI-executed containment steps.', help: 'Count only playbooks actually running in production.', remedy: 'Automate the highest-volume response playbooks and add AI-suggested containment steps.' },
        { id: 'RES-2', weight: 1.0, text: 'Incident enrichment and case summarisation are automated (timelines, natural-language summaries, similar-incident lookup).', help: 'Reduces manual write-up effort and speeds escalation.', remedy: 'Automate incident enrichment and case summarisation to cut manual write-up time.' },
        { id: 'RES-3', weight: 1.5, text: 'Safety controls constrain automated action on clinical systems: approval gates, blast-radius limits and rollback.', help: 'An automated isolation of a clinical workstation must never risk patient care unchecked.', remedy: 'Add approval gates, blast-radius limits and tested rollback for automated actions on clinical systems.' },
        { id: 'RES-4', weight: 1.0, text: 'AI supports post-incident analysis: root cause, control gap identification and lessons-learned tracking.', help: 'Outputs reviewed by humans and tracked to closure.', remedy: 'Use AI-assisted post-incident analysis and track resulting control gaps to closure.' },
        { id: 'RES-5', weight: 1.0, text: 'AI and automation are exercised in incident simulations, tabletops and clinical downtime drills.', help: 'Includes testing what happens when the AI capability itself is unavailable or wrong.', remedy: 'Include AI/automation failure scenarios in incident exercises and clinical downtime drills.' },
        { id: 'RES-6', weight: 1.0, text: 'Improvement in detection and response times attributable to AI/automation is measured and reported.', help: 'Before/after MTTD and MTTR with a stated method.', remedy: 'Measure and report MTTD/MTTR change attributable to AI and automation.' }
      ]
    },
    {
      id: 'IAM',
      name: 'Identity, Access & Insider Risk Analytics',
      weight: 8,
      description: 'Analytics applied to identity behaviour, privileged access and inappropriate access to patient records.',
      questions: [
        { id: 'IAM-1', weight: 1.0, text: 'Risk-based or adaptive authentication uses behavioural signals for clinical, remote and privileged access.', help: 'Step-up authentication driven by risk score rather than static rules only.', remedy: 'Enable risk-based adaptive authentication for remote, privileged and clinical access paths.' },
        { id: 'IAM-2', weight: 1.5, text: 'Analytics detect inappropriate access to patient records and privileged account misuse (e.g. record snooping, VIP access).', help: 'A signature health-sector use case for AI-driven monitoring.', remedy: 'Deploy patient-record access analytics to detect snooping and privileged misuse patterns.' },
        { id: 'IAM-3', weight: 1.0, text: 'Entitlement analytics support access reviews by flagging excessive, dormant or anomalous privileges.', help: 'Reviewers receive risk-ranked suggestions instead of raw lists.', remedy: 'Add entitlement analytics to access reviews so reviewers see risk-ranked recommendations.' },
        { id: 'IAM-4', weight: 1.0, text: 'An insider-risk process defines thresholds, privacy safeguards and joint handling with HR and legal.', help: 'Protects staff privacy while enabling investigation.', remedy: 'Formalise insider-risk thresholds, privacy safeguards and joint HR/legal handling.' }
      ]
    },
    {
      id: 'VUL',
      name: 'Vulnerability, Exposure & Threat Intelligence',
      weight: 8,
      description: 'AI-assisted prioritisation of exposure and intelligence-led defence.',
      questions: [
        { id: 'VUL-1', weight: 1.5, text: 'Vulnerability prioritisation uses exploitability, exposure and clinical criticality rather than CVSS alone.', help: 'Machine-assisted ranking that reflects patient-care impact.', remedy: 'Adopt risk-based vulnerability prioritisation combining exploit intelligence with clinical criticality.' },
        { id: 'VUL-2', weight: 1.0, text: 'External attack surface discovery and exposure monitoring run continuously with automated analysis.', help: 'Includes forgotten portals, telehealth endpoints and third-party hosted services.', remedy: 'Run continuous external attack surface discovery with automated triage of new exposures.' },
        { id: 'VUL-3', weight: 1.0, text: 'Threat intelligence relevant to the health sector is ingested, correlated and scored automatically.', help: 'Feeds mapped to the entity estate rather than read as reports.', remedy: 'Automate ingestion and correlation of health-sector threat intelligence against the asset estate.' },
        { id: 'VUL-4', weight: 1.0, text: 'AI-assisted review supports secure development and configuration (code scanning, IaC checks, misconfiguration detection).', help: 'Relevant to in-house development and cloud platform teams.', remedy: 'Introduce AI-assisted code and configuration review in the delivery pipeline.' },
        { id: 'VUL-5', weight: 1.0, text: 'Adversary emulation and red teaming include AI-assisted attack techniques and validate AI-based detections.', help: 'Tests whether analytics catch novel or AI-generated attack patterns.', remedy: 'Extend red team scenarios to AI-assisted attack techniques and validate analytics coverage.' }
      ]
    },
    {
      id: 'SEC',
      name: 'Securing AI Itself (AI Attack Surface)',
      weight: 10,
      description: 'Protecting the entity’s own AI systems — including clinical and administrative AI — from misuse and compromise.',
      questions: [
        { id: 'SEC-1', weight: 1.5, text: 'All AI/GenAI tools in use are inventoried and approved, with active discovery of unsanctioned "shadow AI".', help: 'Includes staff use of public chatbots with patient or operational data.', remedy: 'Inventory approved AI tools and run discovery for unsanctioned AI use involving sensitive data.' },
        { id: 'SEC-2', weight: 1.5, text: 'Controls address prompt injection, sensitive-data leakage and unsafe output for deployed AI/LLM systems.', help: 'Input/output filtering, retrieval scoping, tenancy isolation.', remedy: 'Implement input/output guardrails and data-leakage controls for deployed AI and LLM systems.' },
        { id: 'SEC-3', weight: 1.0, text: 'Model and AI supply-chain integrity is managed (model provenance, dataset lineage, MLOps pipeline security).', help: 'Signed artefacts, trusted registries, dependency scanning.', remedy: 'Establish provenance and integrity controls for models, datasets and MLOps pipelines.' },
        { id: 'SEC-4', weight: 1.0, text: 'Adversarial robustness testing or AI red teaming is performed before go-live and periodically thereafter.', help: 'Includes evasion, poisoning and jailbreak testing proportional to risk.', remedy: 'Add adversarial robustness testing to AI go-live criteria and periodic assurance.' },
        { id: 'SEC-5', weight: 1.0, text: 'AI system usage is logged and monitored (prompts, outputs, access) to a standard that supports investigation.', help: 'Logs retained and reachable by the security team.', remedy: 'Route AI system usage logs into security monitoring with investigation-grade retention.' },
        { id: 'SEC-6', weight: 1.0, text: 'Incident response procedures explicitly cover AI failure, misuse, model compromise and harmful output.', help: 'Named playbooks, not a general IT incident process.', remedy: 'Write AI-specific incident playbooks covering misuse, model compromise and harmful output.' }
      ]
    },
    {
      id: 'MED',
      name: 'Medical Device & Clinical System Protection',
      weight: 8,
      description: 'Applying analytics to connected medical devices and clinical technology without disrupting care.',
      questions: [
        { id: 'MED-1', weight: 1.0, text: 'Connected medical and IoMT devices are discovered automatically and risk-scored (passive fingerprinting, no active scanning of sensitive devices).', help: 'Coverage percentage of the known biomedical estate.', remedy: 'Deploy passive IoMT discovery and risk scoring across the biomedical estate.' },
        { id: 'MED-2', weight: 1.5, text: 'Behavioural baselining and anomaly detection are applied to medical device network traffic.', help: 'Detects devices deviating from expected clinical communication patterns.', remedy: 'Baseline medical device traffic and alert on deviation from expected clinical behaviour.' },
        { id: 'MED-3', weight: 1.0, text: 'Segmentation policy for clinical devices is informed by traffic analytics and enforced, not just designed.', help: 'Analytics-derived policy that is actually applied on the network.', remedy: 'Use traffic analytics to derive and then enforce clinical device segmentation policy.' },
        { id: 'MED-4', weight: 1.5, text: 'Clinical safety impact is assessed before any AI-driven or automated security action can affect a medical device.', help: 'Joint sign-off with biomedical engineering and clinical leadership.', remedy: 'Require biomedical and clinical sign-off for automated security actions on medical devices.' },
        { id: 'MED-5', weight: 1.0, text: 'Compensating controls are tracked for legacy or unpatchable devices, with monitoring intensity raised accordingly.', help: 'A living register rather than a one-time exception list.', remedy: 'Maintain a live register of unpatchable devices with compensating controls and heightened monitoring.' }
      ]
    },
    {
      id: 'PPL',
      name: 'People, Skills & Third-Party Ecosystem',
      weight: 8,
      description: 'Capability of the workforce and assurance over suppliers delivering AI-enabled security.',
      questions: [
        { id: 'PPL-1', weight: 1.0, text: 'Security team skills in AI/ML and data analysis are assessed against a defined capability model with a training plan.', help: 'Named skills matrix and funded development plan.', remedy: 'Assess security team AI/data skills against a capability model and fund the resulting training plan.' },
        { id: 'PPL-2', weight: 1.0, text: 'Analysts routinely use AI assistants in their workflow and their feedback drives improvement.', help: 'Adoption measured, not just licensed.', remedy: 'Drive analyst adoption of AI assistants and capture structured feedback for tuning.' },
        { id: 'PPL-3', weight: 1.5, text: 'Clinical and administrative staff receive awareness training on safe AI use and AI-enabled social engineering (deepfake voice, video, synthetic identity).', help: 'Health-sector fraud increasingly uses synthetic media.', remedy: 'Add safe-AI-use and deepfake social engineering content to workforce awareness training.' },
        { id: 'PPL-4', weight: 1.0, text: 'Contracts and assurance requirements cover AI features in third-party and outsourced security services.', help: 'Data location, model training on entity data, transparency and exit terms.', remedy: 'Add AI-specific clauses and assurance evidence requirements to security supplier contracts.' },
        { id: 'PPL-5', weight: 1.0, text: 'The entity participates in sector-level sharing of AI threat and practice information with the governing body and peers.', help: 'Two-way contribution, not passive receipt.', remedy: 'Join and actively contribute to the sector AI threat and practice sharing forum.' }
      ]
    }
  ];

  /* ------------------------------------------------------------------ *
   * Derived helpers
   * ------------------------------------------------------------------ */

  AIMA.allQuestions = AIMA.domains.reduce(function (acc, domain) {
    domain.questions.forEach(function (q) {
      acc.push(Object.assign({}, q, { domainId: domain.id, domainName: domain.name, domainWeight: domain.weight }));
    });
    return acc;
  }, []);

  AIMA.questionCount = AIMA.allQuestions.length;

  AIMA.getDomain = function (id) {
    return AIMA.domains.filter(function (d) { return d.id === id; })[0] || null;
  };

  AIMA.getQuestion = function (id) {
    return AIMA.allQuestions.filter(function (q) { return q.id === id; })[0] || null;
  };

  AIMA.getEntity = function (code) {
    return AIMA.entities.filter(function (e) { return e.code === code; })[0] || null;
  };

  AIMA.totalDomainWeight = AIMA.domains.reduce(function (sum, d) { return sum + d.weight; }, 0);
})(window.AIMA);
