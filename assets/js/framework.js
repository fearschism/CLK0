/*
 * Question bank and assessment model
 * ----------------------------------
 * Single source of truth for the annual return. Two audiences read this file:
 *
 *   - the questionnaire (index.html) renders `sections` as plain questions and
 *     never shows a score, a weight or a maturity level;
 *   - the governing body console (console.html) uses the same definitions,
 *     plus the hidden scores below, to rate and compare returns.
 *
 * Every scored answer option carries its own score, so respondents answer in
 * plain language ("Yes", "Reviewed every three months") and the rating is
 * derived afterwards rather than asked for directly.
 *
 * Loaded as a classic script so both pages also work when opened over file://.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  AIMA.meta = {
    schemaVersion: '2.0.0',
    frameworkVersion: '2026.2',
    title: 'AI Cyber Assurance Return',
    subtitle: 'Annual return on the security of artificial intelligence use',
    estimatedMinutes: 15
  };

  /* ------------------------------------------------------------------ *
   * Reference frameworks
   * The question set is mapped to these; the console shows the coverage.
   * ------------------------------------------------------------------ */

  AIMA.frameworks = [
    {
      key: 'AIRMF',
      name: 'NIST AI Risk Management Framework 1.0',
      short: 'NIST AI RMF',
      publisher: 'NIST',
      year: 2023,
      note: 'GOVERN, MAP, MEASURE and MANAGE functions for trustworthy AI.'
    },
    {
      key: 'GENAI',
      name: 'NIST AI 600-1 — Generative AI Profile',
      short: 'NIST AI 600-1',
      publisher: 'NIST',
      year: 2024,
      note: 'Companion profile for generative AI risks, including data leakage and confabulation.'
    },
    {
      key: 'OWASP',
      name: 'OWASP Top 10 for LLM Applications 2025',
      short: 'OWASP LLM Top 10 (2025)',
      publisher: 'OWASP',
      year: 2025,
      note: 'The current list of large language model risks: prompt injection, sensitive information disclosure, supply chain, excessive agency and more.'
    },
    {
      key: 'ISO42001',
      name: 'ISO/IEC 42001:2023 — AI management systems',
      short: 'ISO/IEC 42001',
      publisher: 'ISO/IEC',
      year: 2023,
      note: 'Certifiable management system standard for AI, including Annex A controls.'
    },
    {
      key: 'SECAI',
      name: 'Guidelines for Secure AI System Development',
      short: 'CISA / NCSC secure AI',
      publisher: 'CISA, NCSC and international partners',
      year: 2023,
      note: 'Secure design, development, deployment, and operation and maintenance of AI systems.'
    },
    {
      key: 'ATLAS',
      name: 'MITRE ATLAS',
      short: 'MITRE ATLAS',
      publisher: 'MITRE',
      year: 2024,
      note: 'Adversary tactics and techniques against AI-enabled systems; the basis for AI red teaming.'
    },
    {
      key: 'CSF',
      name: 'NIST Cybersecurity Framework 2.0',
      short: 'NIST CSF 2.0',
      publisher: 'NIST',
      year: 2024,
      note: 'Underlying cybersecurity outcomes, used here for detection and response questions.'
    },
    {
      key: 'HEALTH',
      name: 'Health sector cyber practice — HITRUST AI security assessment and HHS 405(d) HICP',
      short: 'HITRUST AI / HHS HICP',
      publisher: 'HITRUST, US HHS',
      year: 2024,
      note: 'Health-specific expectations for AI assurance, medical devices and clinical continuity.'
    },
    {
      key: 'AIACT',
      name: 'EU AI Act (Regulation 2024/1689)',
      short: 'EU AI Act',
      publisher: 'European Union',
      year: 2024,
      note: 'Risk management, human oversight (Art. 14) and accuracy, robustness and cybersecurity (Art. 15).'
    }
  ];

  AIMA.getFramework = function (key) {
    return AIMA.frameworks.filter(function (f) { return f.key === key; })[0] || null;
  };

  /* ------------------------------------------------------------------ *
   * Rating model (governing body only — never shown in the questionnaire)
   * ------------------------------------------------------------------ */

  // Fixed scores for the yes / no / not sure question type.
  AIMA.yesNoScores = { yes: 5, no: 0, unsure: 1 };

  AIMA.NOT_APPLICABLE = 'na';

  AIMA.yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'unsure', label: 'Not sure' }
  ];

  AIMA.notApplicableOption = { value: AIMA.NOT_APPLICABLE, label: 'Not applicable' };

  AIMA.levels = [
    { level: 1, name: 'Not established', min: 0.00, max: 1.49, color: '#c0392b', tint: '#fdecea', description: 'Little or no control over how AI is used. Basic rules, ownership and visibility are missing.' },
    { level: 2, name: 'Emerging',        min: 1.50, max: 2.49, color: '#d97706', tint: '#fef3e2', description: 'Some controls exist but they are informal, partial or unevenly applied.' },
    { level: 3, name: 'Established',     min: 2.50, max: 3.49, color: '#b7950b', tint: '#fdf6d8', description: 'Documented rules and controls are in place and applied across the areas that matter most.' },
    { level: 4, name: 'Managed',         min: 3.50, max: 4.49, color: '#0e8b7d', tint: '#e6f4f1', description: 'Controls are consistently applied, checked and measured, and cover clinical systems.' },
    { level: 5, name: 'Leading',         min: 4.50, max: 5.00, color: '#123e5c', tint: '#e7eef4', description: 'Controls are automated, continuously tested and ahead of sector expectations.' }
  ];

  AIMA.defaultTargetLevel = 4;

  /* ------------------------------------------------------------------ *
   * Register of reporting organisations
   * Replace these 30 entries with the client's own register.
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
    'Small (under 500 staff)',
    'Medium (500 to 2,000 staff)',
    'Large (2,000 to 10,000 staff)',
    'Very large (over 10,000 staff)'
  ];

  AIMA.entities = [
    { code: 'E01', name: 'Central Medical City',                          type: 'Tertiary Hospital',          region: 'Central', size: 'Very large (over 10,000 staff)' },
    { code: 'E02', name: 'Northern Teaching Hospital',                     type: 'Tertiary Hospital',          region: 'North',   size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E03', name: 'Southern Regional Hospital',                     type: 'General Hospital',           region: 'South',   size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E04', name: 'Eastern Regional Hospital',                      type: 'General Hospital',           region: 'East',    size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E05', name: 'Western Regional Hospital',                      type: 'General Hospital',           region: 'West',    size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E06', name: 'Capital General Hospital',                       type: 'General Hospital',           region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E07', name: "Children's Specialty Hospital",                  type: 'Specialty Hospital',         region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E08', name: "Maternity & Women's Hospital",                   type: 'Specialty Hospital',         region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E09', name: 'National Oncology Centre',                       type: 'Specialty Hospital',         region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E10', name: 'Cardiac Care Centre',                            type: 'Specialty Hospital',         region: 'North',   size: 'Medium (500 to 2,000 staff)' },
    { code: 'E11', name: 'Behavioural Health Hospital',                     type: 'Specialty Hospital',         region: 'South',   size: 'Medium (500 to 2,000 staff)' },
    { code: 'E12', name: 'Rehabilitation & Long-Term Care Hospital',        type: 'Specialty Hospital',         region: 'East',    size: 'Small (under 500 staff)' },
    { code: 'E13', name: 'Ophthalmology Hospital',                          type: 'Specialty Hospital',         region: 'West',    size: 'Small (under 500 staff)' },
    { code: 'E14', name: 'Central Primary Care Cluster',                    type: 'Primary Care Cluster',       region: 'Central', size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E15', name: 'Northern Primary Care Cluster',                   type: 'Primary Care Cluster',       region: 'North',   size: 'Medium (500 to 2,000 staff)' },
    { code: 'E16', name: 'Southern Primary Care Cluster',                   type: 'Primary Care Cluster',       region: 'South',   size: 'Medium (500 to 2,000 staff)' },
    { code: 'E17', name: 'Eastern Primary Care Cluster',                    type: 'Primary Care Cluster',       region: 'East',    size: 'Medium (500 to 2,000 staff)' },
    { code: 'E18', name: 'Western Primary Care Cluster',                    type: 'Primary Care Cluster',       region: 'West',    size: 'Medium (500 to 2,000 staff)' },
    { code: 'E19', name: 'National Reference Laboratory',                   type: 'Diagnostics & Laboratories', region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E20', name: 'Regional Diagnostics & Imaging Network',          type: 'Diagnostics & Laboratories', region: 'North',   size: 'Medium (500 to 2,000 staff)' },
    { code: 'E21', name: 'National Blood & Tissue Services',                type: 'Diagnostics & Laboratories', region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E22', name: 'Public Health & Epidemiology Authority',          type: 'Public Health',              region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E23', name: 'Health Emergency Operations Centre',              type: 'Public Health',              region: 'Central', size: 'Small (under 500 staff)' },
    { code: 'E24', name: 'National Ambulance & Emergency Services',         type: 'Emergency Services',         region: 'Central', size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E25', name: 'Health Insurance & Claims Authority',             type: 'Insurance & Claims',         region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E26', name: 'Pharmaceutical Supply & Logistics Authority',     type: 'Shared Services',            region: 'Central', size: 'Medium (500 to 2,000 staff)' },
    { code: 'E27', name: 'Health Information Exchange & Digital Platforms', type: 'Shared Services',            region: 'Central', size: 'Large (2,000 to 10,000 staff)' },
    { code: 'E28', name: 'Medical Research Institute',                      type: 'Research & Academia',        region: 'Central', size: 'Small (under 500 staff)' },
    { code: 'E29', name: 'Health Workforce Training Academy',               type: 'Research & Academia',        region: 'Central', size: 'Small (under 500 staff)' },
    { code: 'E30', name: 'Facilities & Biomedical Engineering Services',    type: 'Shared Services',            region: 'Central', size: 'Medium (500 to 2,000 staff)' }
  ];

  /* ------------------------------------------------------------------ *
   * Sections and questions
   *
   * Section weights are percentages and must total 100.
   * Question weight 1.5 marks a core control, 1 a standard one.
   * `type` is one of: yesno | choice | multi | number | text
   * `informational: true` records context without affecting the rating.
   * ------------------------------------------------------------------ */

  AIMA.sections = [
    {
      id: 'A',
      title: 'Rules and responsibility for AI',
      weight: 11,
      intro: 'These questions are about who decides how AI may be used in your organisation, and what rules staff have to follow.',
      refs: [
        { key: 'AIRMF', cite: 'GOVERN function' },
        { key: 'ISO42001', cite: 'Annex A.2 AI policy, A.3 internal organisation' },
        { key: 'AIACT', cite: 'Risk management obligations' }
      ],
      questions: [
        {
          id: 'A1', type: 'yesno', weight: 1.5,
          text: 'Has your organisation approved a written rule or policy covering how staff may use AI tools, including chatbots such as ChatGPT, Copilot or Gemini?',
          hint: 'Answer Yes only if the document has been formally approved. A draft does not count.',
          refs: [{ key: 'AIRMF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'A.2' }],
          remedy: 'Approve and publish a written policy covering how staff may use AI tools.'
        },
        {
          id: 'A2', type: 'yesno', weight: 1.5,
          text: 'Is there one named person responsible for decisions about AI risk?',
          hint: 'For example the Chief Information Security Officer, the Chief Medical Information Officer, or a named AI lead.',
          refs: [{ key: 'AIRMF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'A.3' }],
          remedy: 'Name a single accountable owner for AI risk decisions and record it in the governance structure.'
        },
        {
          id: 'A3', type: 'multi', weight: 1.0,
          text: 'Which of the following does your AI rule or policy actually cover?',
          hint: 'Tick everything that is written down. Leave the rest blank.',
          options: [
            { value: 'approved-tools', label: 'A list of AI tools staff are allowed to use', points: 1 },
            { value: 'data-limits', label: 'What information must never be entered into an AI tool', points: 1 },
            { value: 'human-check', label: 'When a person must check what the AI produced', points: 1 },
            { value: 'banned-uses', label: 'Uses that are banned outright', points: 1 },
            { value: 'consequences', label: 'What happens if someone breaks the rules', points: 1 }
          ],
          noneLabel: 'None of these are covered',
          refs: [{ key: 'ISO42001', cite: 'A.2, A.9' }, { key: 'GENAI', cite: 'Acceptable use' }],
          remedy: 'Expand the AI policy so it covers approved tools, data limits, human checks, banned uses and consequences.'
        },
        {
          id: 'A4', type: 'choice', weight: 1.0,
          text: 'How often does a committee or senior group review AI use and AI risk?',
          hint: 'Pick the closest answer.',
          options: [
            { value: 'never', label: 'Never', score: 0 },
            { value: 'incident', label: 'Only when a problem happens', score: 1 },
            { value: 'annual', label: 'At least once a year', score: 3 },
            { value: 'quarterly', label: 'At least every three months', score: 4 },
            { value: 'monthly', label: 'Monthly or continuously', score: 5 }
          ],
          refs: [{ key: 'AIRMF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'Management review' }],
          remedy: 'Put AI use and AI risk on a senior committee agenda at least quarterly.'
        },
        {
          id: 'A5', type: 'yesno', weight: 1.0,
          text: 'Is AI risk assessed and signed off before a new AI tool is used with real patient or business information?',
          hint: 'This means a documented check before go-live, not after.',
          refs: [{ key: 'AIRMF', cite: 'MAP' }, { key: 'ISO42001', cite: 'A.5 impact assessment' }, { key: 'AIACT', cite: 'Art. 9' }],
          remedy: 'Introduce a documented pre-deployment risk assessment and sign-off for new AI tools.'
        }
      ]
    },

    {
      id: 'B',
      title: 'Knowing which AI tools you have',
      weight: 10,
      intro: 'You cannot secure AI you do not know about. These questions are about visibility.',
      refs: [
        { key: 'AIRMF', cite: 'MAP function' },
        { key: 'ISO42001', cite: 'Annex A.4 resources, A.6 life cycle' },
        { key: 'OWASP', cite: 'LLM03:2025 Supply Chain' }
      ],
      questions: [
        {
          id: 'B1', type: 'yesno', weight: 1.5,
          text: 'Do you keep a list of the AI tools used across your organisation?',
          hint: 'Include AI features built into software you already own, not only standalone AI products.',
          refs: [{ key: 'AIRMF', cite: 'MAP' }, { key: 'ISO42001', cite: 'A.4' }],
          remedy: 'Create a single register of AI tools in use, including AI features inside existing software.'
        },
        {
          id: 'B2', type: 'choice', weight: 1.5,
          text: 'How up to date is that list?',
          options: [
            { value: 'none', label: 'There is no list', score: 0 },
            { value: 'stale', label: 'More than a year old', score: 1 },
            { value: 'annual', label: 'Reviewed once a year', score: 2 },
            { value: 'quarterly', label: 'Reviewed every three months', score: 4 },
            { value: 'auto', label: 'Updated automatically or continuously', score: 5 }
          ],
          refs: [{ key: 'AIRMF', cite: 'MAP' }],
          remedy: 'Review the AI register at least quarterly, ideally feeding it from automated discovery.'
        },
        {
          id: 'B3', type: 'choice', weight: 1.0,
          text: 'Roughly what share of the AI tools in use were formally approved before being used?',
          options: [
            { value: 'none', label: 'None, or we do not know', score: 0 },
            { value: 'few', label: 'A few', score: 1 },
            { value: 'half', label: 'About half', score: 2 },
            { value: 'most', label: 'Most', score: 4 },
            { value: 'all', label: 'All of them', score: 5 }
          ],
          refs: [{ key: 'ISO42001', cite: 'A.6' }, { key: 'SECAI', cite: 'Secure deployment' }],
          remedy: 'Route all AI tools through an approval step and retrospectively review those already in use.'
        },
        {
          id: 'B4', type: 'yesno', weight: 1.5,
          text: 'Are you able to detect staff using AI tools that have not been approved?',
          hint: 'Sometimes called "shadow AI" — for example someone pasting work into a personal chatbot account.',
          refs: [{ key: 'GENAI', cite: 'Shadow AI' }, { key: 'CSF', cite: 'DETECT' }],
          remedy: 'Enable monitoring of web and cloud traffic to detect use of unapproved AI services.'
        },
        {
          id: 'B5', type: 'number', informational: true,
          text: 'Roughly how many AI tools or AI features are in use in your organisation today?',
          hint: 'An estimate is fine. Enter 0 if none.',
          unit: 'tools',
          refs: [{ key: 'AIRMF', cite: 'MAP' }]
        },
        {
          id: 'B6', type: 'multi', informational: true,
          text: 'Where is AI used in your organisation?',
          hint: 'Tick all that apply. This helps us understand your risk profile, and is not scored.',
          options: [
            { value: 'clinical-decision', label: 'Clinical decision support or triage' },
            { value: 'imaging', label: 'Medical imaging or diagnostics' },
            { value: 'documentation', label: 'Clinical documentation or note taking' },
            { value: 'patient-facing', label: 'Patient-facing chatbots or messaging' },
            { value: 'coding-billing', label: 'Coding, billing or claims' },
            { value: 'back-office', label: 'Back office: HR, finance or procurement' },
            { value: 'security', label: 'Cybersecurity or IT operations' },
            { value: 'research', label: 'Research or analytics' }
          ],
          noneLabel: 'AI is not used anywhere yet',
          refs: [{ key: 'AIRMF', cite: 'MAP' }]
        }
      ]
    },

    {
      id: 'C',
      title: 'Protecting patient and staff information',
      weight: 13,
      intro: 'These questions are about stopping confidential information leaking through AI tools.',
      refs: [
        { key: 'GENAI', cite: 'Data privacy and information leakage' },
        { key: 'OWASP', cite: 'LLM02:2025 Sensitive Information Disclosure' },
        { key: 'ISO42001', cite: 'Annex A.7 data for AI' },
        { key: 'HEALTH', cite: 'HITRUST AI security assessment' }
      ],
      questions: [
        {
          id: 'C1', type: 'yesno', weight: 1.5,
          text: 'Have staff been told in writing what information must never be typed or uploaded into a public AI tool?',
          hint: 'For example patient records, staff records, contracts or passwords.',
          refs: [{ key: 'GENAI', cite: 'Data leakage' }, { key: 'OWASP', cite: 'LLM02:2025' }],
          remedy: 'Issue clear written guidance on what may never be entered into a public AI tool, and remind staff regularly.'
        },
        {
          id: 'C2', type: 'choice', weight: 1.5, allowNA: true,
          text: 'Where AI tools handle patient information, how is that information protected before it reaches the tool?',
          options: [
            { value: 'none', label: 'It is not protected', score: 0 },
            { value: 'case', label: 'Decided case by case', score: 1 },
            { value: 'some', label: 'Identifying details are removed for some tools', score: 2 },
            { value: 'all', label: 'Identifying details are removed or masked for all such tools', score: 4 },
            { value: 'automatic', label: 'Automatic controls block sensitive information from being sent', score: 5 }
          ],
          refs: [{ key: 'ISO42001', cite: 'A.7' }, { key: 'HEALTH', cite: 'Patient data minimisation' }],
          remedy: 'Remove or mask identifying details before patient information reaches an AI tool, and automate the check where possible.'
        },
        {
          id: 'C3', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Do your contracts stop AI suppliers from using your data to train their models?',
          refs: [{ key: 'ISO42001', cite: 'A.10 third parties' }, { key: 'OWASP', cite: 'LLM03:2025' }],
          remedy: 'Add a clause to AI supplier contracts prohibiting training on your data, and confirm the setting is enforced in the product.'
        },
        {
          id: 'C4', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Do you know which countries your AI suppliers store and process your data in?',
          refs: [{ key: 'ISO42001', cite: 'A.10' }, { key: 'AIACT', cite: 'Data governance' }],
          remedy: 'Record the processing locations for each AI supplier and check them against your data residency rules.'
        },
        {
          id: 'C5', type: 'multi', weight: 1.0,
          text: 'Which of these controls are in place to stop sensitive information leaving through AI tools?',
          hint: 'Tick everything that is actually switched on today.',
          options: [
            { value: 'dlp', label: 'Data loss prevention checks on web and AI traffic', points: 1 },
            { value: 'blocked', label: 'Public AI websites are blocked or restricted', points: 1 },
            { value: 'tenancy', label: 'Enterprise AI accounts configured not to train on your data', points: 1 },
            { value: 'gateway', label: 'A single approved AI gateway that staff must use', points: 1 },
            { value: 'logging', label: 'Records kept of what is sent to AI tools', points: 1 }
          ],
          noneLabel: 'None of these are in place',
          refs: [{ key: 'OWASP', cite: 'LLM02:2025' }, { key: 'CSF', cite: 'PROTECT' }],
          remedy: 'Add technical controls so sensitive information cannot leave through AI tools, starting with blocking unapproved services and enabling data loss prevention.'
        },
        {
          id: 'C6', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Has a privacy impact assessment been completed for AI tools that handle patient information?',
          hint: 'A DPIA, PIA or your local equivalent.',
          refs: [{ key: 'ISO42001', cite: 'A.5' }, { key: 'AIACT', cite: 'Art. 27 impact assessment' }],
          remedy: 'Complete a privacy impact assessment for each AI tool that handles patient information.'
        }
      ]
    },

    {
      id: 'D',
      title: 'Safe use of chatbots and generative AI',
      weight: 13,
      intro: 'These questions cover the specific risks of chatbots and other generative AI tools.',
      refs: [
        { key: 'OWASP', cite: 'LLM01, LLM05, LLM06, LLM08, LLM09:2025' },
        { key: 'GENAI', cite: 'Generative AI Profile' },
        { key: 'AIACT', cite: 'Art. 14 human oversight' }
      ],
      questions: [
        {
          id: 'D1', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Is AI output checked by a suitably qualified person before it affects a patient, a payment, or a change to a system?',
          hint: 'This is about a required check, not an optional one.',
          refs: [{ key: 'OWASP', cite: 'LLM05, LLM09:2025' }, { key: 'AIACT', cite: 'Art. 14' }],
          remedy: 'Require a qualified person to review AI output before it affects a patient, a payment or a system change.'
        },
        {
          id: 'D2', type: 'choice', weight: 1.5, allowNA: true,
          text: 'Can your AI tools take actions by themselves, such as sending email, changing records or running commands?',
          options: [
            { value: 'unrestricted', label: 'Yes, with no restrictions', score: 0 },
            { value: 'few-limits', label: 'Yes, with few restrictions', score: 1 },
            { value: 'per-approval', label: 'Yes, but a person approves each action', score: 3 },
            { value: 'suggest-only', label: 'No, they only suggest and a person carries it out', score: 4 },
            { value: 'blocked', label: 'No, and this is enforced technically', score: 5 }
          ],
          refs: [{ key: 'OWASP', cite: 'LLM06:2025 Excessive Agency' }],
          remedy: 'Restrict what AI tools may do on their own, and require human approval for any action that changes data or systems.'
        },
        {
          id: 'D3', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Are your AI tools protected against hidden instructions in documents, emails or web pages that try to hijack them?',
          hint: 'Known as prompt injection: text hidden in a file or message that tells the AI to ignore its rules.',
          refs: [{ key: 'OWASP', cite: 'LLM01:2025 Prompt Injection' }, { key: 'ATLAS', cite: 'Prompt injection techniques' }],
          remedy: 'Add input and output filtering for AI tools that read untrusted content, and test them against prompt injection.'
        },
        {
          id: 'D4', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Where an AI assistant searches your internal documents, is it limited to only what that user is already allowed to see?',
          refs: [{ key: 'OWASP', cite: 'LLM08:2025 Vector and Embedding Weaknesses' }, { key: 'CSF', cite: 'PROTECT' }],
          remedy: 'Enforce the user\u2019s existing permissions on anything an AI assistant can retrieve.'
        },
        {
          id: 'D5', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Do you keep records of what staff ask AI tools and what the tools answered?',
          hint: 'Needed to investigate a data leak or a harmful answer after the fact.',
          refs: [{ key: 'GENAI', cite: 'Monitoring and logging' }, { key: 'CSF', cite: 'DETECT' }],
          remedy: 'Enable logging of AI prompts and responses, and make the logs available to the security team.'
        },
        {
          id: 'D6', type: 'choice', weight: 1.0, allowNA: true,
          text: 'Are people told when content they receive was generated or drafted by AI?',
          options: [
            { value: 'no', label: 'No', score: 0 },
            { value: 'sometimes', label: 'Sometimes, informally', score: 1 },
            { value: 'clinical', label: 'Yes, for clinical content', score: 3 },
            { value: 'all', label: 'Yes, for all AI-generated content', score: 5 }
          ],
          refs: [{ key: 'AIACT', cite: 'Art. 50 transparency' }, { key: 'AIRMF', cite: 'MEASURE' }],
          remedy: 'Label AI-generated content so staff and patients know when AI was involved.'
        }
      ]
    },

    {
      id: 'E',
      title: 'Buying AI safely',
      weight: 9,
      intro: 'Most AI risk arrives through a supplier. These questions are about what you ask for before you buy.',
      refs: [
        { key: 'SECAI', cite: 'Secure design and secure deployment' },
        { key: 'OWASP', cite: 'LLM03:2025 Supply Chain' },
        { key: 'ISO42001', cite: 'Annex A.10 third-party relationships' }
      ],
      questions: [
        {
          id: 'E1', type: 'yesno', weight: 1.5,
          text: 'Do you ask AI suppliers security questions before buying or switching on their product?',
          refs: [{ key: 'SECAI', cite: 'Secure design' }, { key: 'ISO42001', cite: 'A.10' }],
          remedy: 'Add an AI-specific security questionnaire to the procurement process.'
        },
        {
          id: 'E2', type: 'multi', weight: 1.5,
          text: 'Which of these do you require from AI suppliers in writing?',
          hint: 'Tick everything your contracts or procurement rules actually require.',
          options: [
            { value: 'certification', label: 'A recognised security certification, for example ISO 27001 or ISO 42001', points: 1 },
            { value: 'testing', label: 'Evidence that the AI has been security tested independently', points: 1 },
            { value: 'breach', label: 'Prompt notification if the supplier suffers a breach', points: 1 },
            { value: 'no-training', label: 'A clause preventing them training on your data', points: 1 },
            { value: 'exit', label: 'Deletion or return of your data when the contract ends', points: 1 }
          ],
          noneLabel: 'None of these are required',
          refs: [{ key: 'OWASP', cite: 'LLM03:2025' }, { key: 'ISO42001', cite: 'A.10' }],
          remedy: 'Standardise AI supplier requirements covering certification, independent testing, breach notice, no-training clauses and data deletion on exit.'
        },
        {
          id: 'E3', type: 'yesno', weight: 1.0,
          text: 'Do you know which AI features are already switched on inside software you have bought?',
          hint: 'For example AI features in your electronic health record, email, or document tools.',
          refs: [{ key: 'AIRMF', cite: 'MAP' }, { key: 'OWASP', cite: 'LLM03:2025' }],
          remedy: 'Review existing software for AI features that are already enabled and bring them into the AI register.'
        },
        {
          id: 'E4', type: 'choice', weight: 1.0,
          text: 'How do you handle AI features that a supplier switches on automatically?',
          options: [
            { value: 'unaware', label: 'We would not know', score: 0 },
            { value: 'after', label: 'We find out afterwards', score: 1 },
            { value: 'notified', label: 'We review them when the supplier tells us', score: 3 },
            { value: 'contract', label: 'Our contract requires notice and our approval', score: 4 },
            { value: 'default-off', label: 'New AI features stay switched off until we approve them', score: 5 }
          ],
          refs: [{ key: 'SECAI', cite: 'Secure operation and maintenance' }],
          remedy: 'Require suppliers to give notice before enabling AI features, and keep new features off until reviewed.'
        }
      ]
    },

    {
      id: 'F',
      title: 'Using AI to defend the organisation',
      weight: 12,
      intro: 'These questions are about AI working in your favour: helping detect and respond to attacks.',
      refs: [
        { key: 'CSF', cite: 'DETECT and RESPOND functions' },
        { key: 'HEALTH', cite: 'HHS 405(d) HICP' }
      ],
      questions: [
        {
          id: 'F1', type: 'yesno', weight: 1.5,
          text: 'Does your security monitoring use AI or behaviour analytics to spot unusual activity?',
          hint: 'For example alerting when an account behaves unlike its normal pattern.',
          refs: [{ key: 'CSF', cite: 'DETECT' }],
          remedy: 'Deploy behaviour analytics in security monitoring rather than relying on fixed rules alone.'
        },
        {
          id: 'F2', type: 'choice', weight: 1.5,
          text: 'How much of your environment does that monitoring cover?',
          options: [
            { value: 'none', label: 'None of it', score: 0 },
            { value: 'few', label: 'A few systems', score: 1 },
            { value: 'it', label: 'Most IT systems', score: 3 },
            { value: 'clinical', label: 'IT and clinical systems', score: 4 },
            { value: 'devices', label: 'IT, clinical systems and connected medical devices', score: 5 }
          ],
          refs: [{ key: 'CSF', cite: 'DETECT' }, { key: 'HEALTH', cite: 'Clinical system coverage' }],
          remedy: 'Extend monitoring coverage to clinical systems and connected medical devices.'
        },
        {
          id: 'F3', type: 'yesno', weight: 1.0,
          text: 'Do you use AI to help sort and prioritise security alerts, so the team sees the important ones first?',
          refs: [{ key: 'CSF', cite: 'DETECT' }],
          remedy: 'Use AI-assisted triage to rank security alerts by risk and cut the queue reaching analysts.'
        },
        {
          id: 'F4', type: 'yesno', weight: 1.0,
          text: 'Are any security responses automated, such as isolating a device that appears infected?',
          refs: [{ key: 'CSF', cite: 'RESPOND' }],
          remedy: 'Automate the highest-volume response steps, starting with containment of clearly compromised devices.'
        },
        {
          id: 'F5', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Is there a firm rule that an automated security action must never disrupt patient care without a human decision?',
          hint: 'For example a rule that clinical workstations and medical devices are never isolated automatically.',
          refs: [{ key: 'HEALTH', cite: 'Clinical safety' }, { key: 'AIACT', cite: 'Art. 14' }],
          remedy: 'Write and enforce a rule that automated action affecting patient care always requires a human decision.'
        },
        {
          id: 'F6', type: 'yesno', weight: 1.0,
          text: 'Does your email security use AI to catch AI-written phishing and impersonation?',
          refs: [{ key: 'CSF', cite: 'PROTECT, DETECT' }, { key: 'GENAI', cite: 'AI-enabled social engineering' }],
          remedy: 'Enable AI-based email defence tuned for impersonation and AI-written phishing.'
        }
      ]
    },

    {
      id: 'G',
      title: 'Testing and checking AI',
      weight: 9,
      intro: 'These questions are about proving your AI tools behave safely, rather than assuming they do.',
      refs: [
        { key: 'AIRMF', cite: 'MEASURE function' },
        { key: 'ATLAS', cite: 'Adversarial testing' },
        { key: 'AIACT', cite: 'Art. 15 accuracy, robustness and cybersecurity' }
      ],
      questions: [
        {
          id: 'G1', type: 'choice', weight: 1.5,
          text: 'How often are AI tools tested for security weaknesses, including deliberate attempts to trick them?',
          options: [
            { value: 'never', label: 'Never', score: 0 },
            { value: 'once', label: 'Once, before purchase', score: 1 },
            { value: 'annual', label: 'Once a year', score: 3 },
            { value: 'change', label: 'After every significant change', score: 4 },
            { value: 'continuous', label: 'Continuously', score: 5 }
          ],
          refs: [{ key: 'AIRMF', cite: 'MEASURE' }, { key: 'AIACT', cite: 'Art. 15' }],
          remedy: 'Test AI tools for security weaknesses at least annually and after every significant change.'
        },
        {
          id: 'G2', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Has anyone deliberately tried to break or trick your AI tools to see what happens?',
          hint: 'Sometimes called AI red teaming. Internal testing counts.',
          refs: [{ key: 'ATLAS', cite: 'Adversary emulation' }, { key: 'SECAI', cite: 'Secure development' }],
          remedy: 'Run AI red teaming against your highest-risk AI tools and fix what it finds.'
        },
        {
          id: 'G3', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Do you measure how often AI tools give wrong, misleading or unsafe answers?',
          refs: [{ key: 'AIRMF', cite: 'MEASURE' }, { key: 'OWASP', cite: 'LLM09:2025 Misinformation' }],
          remedy: 'Sample AI output regularly and record an error rate so quality can be tracked over time.'
        },
        {
          id: 'G4', type: 'yesno', weight: 1.0,
          text: 'Are AI tools included in your normal internal audit or assurance programme?',
          refs: [{ key: 'ISO42001', cite: 'Internal audit' }, { key: 'AIRMF', cite: 'MEASURE' }],
          remedy: 'Add AI tools to the internal audit plan so assurance does not depend on the project team alone.'
        }
      ]
    },

    {
      id: 'H',
      title: 'When AI goes wrong',
      weight: 9,
      intro: 'These questions are about being ready for an AI problem before it happens.',
      refs: [
        { key: 'AIRMF', cite: 'MANAGE function' },
        { key: 'CSF', cite: 'RESPOND and RECOVER functions' }
      ],
      questions: [
        {
          id: 'H1', type: 'yesno', weight: 1.5,
          text: 'Do staff know how to report a problem caused by an AI tool, and who to report it to?',
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }, { key: 'CSF', cite: 'RESPOND' }],
          remedy: 'Publish a simple route for staff to report AI problems and make sure it reaches the security team.'
        },
        {
          id: 'H2', type: 'yesno', weight: 1.5,
          text: 'Does your incident response plan specifically cover AI problems?',
          hint: 'For example wrong output that reached a patient, information leaked through an AI tool, or misuse of an AI account.',
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }, { key: 'CSF', cite: 'RESPOND' }],
          remedy: 'Add AI-specific scenarios and steps to the incident response plan.'
        },
        {
          id: 'H3', type: 'yesno', weight: 1.5,
          text: 'Could you switch off or withdraw an AI tool quickly if it started causing harm?',
          hint: 'Answer Yes only if you know who can do it and how long it would take.',
          refs: [{ key: 'AIRMF', cite: 'MANAGE — ability to disengage an AI system' }, { key: 'AIACT', cite: 'Art. 14' }],
          remedy: 'Document and test how each AI tool can be disabled quickly, and who is authorised to do it.'
        },
        {
          id: 'H4', type: 'choice', weight: 1.0,
          text: 'Have you practised an AI-related incident?',
          options: [
            { value: 'never', label: 'Never', score: 0 },
            { value: 'informal', label: 'Discussed it informally', score: 1 },
            { value: 'once', label: 'Ran one tabletop exercise', score: 3 },
            { value: 'annual', label: 'Run a tabletop exercise every year', score: 4 },
            { value: 'clinical', label: 'Run a full exercise including clinical teams', score: 5 }
          ],
          refs: [{ key: 'CSF', cite: 'RESPOND' }, { key: 'HEALTH', cite: 'Clinical continuity exercises' }],
          remedy: 'Run an AI incident tabletop exercise, and involve clinical teams where AI touches care.'
        },
        {
          id: 'H5', type: 'number', informational: true,
          text: 'How many AI-related incidents or near misses have you recorded in the last 12 months?',
          hint: 'Enter 0 if none. A higher number is not necessarily worse — it often means better reporting.',
          unit: 'incidents',
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }]
        }
      ]
    },

    {
      id: 'I',
      title: 'People and awareness',
      weight: 7,
      intro: 'These questions are about whether your staff know what safe AI use looks like.',
      refs: [
        { key: 'ISO42001', cite: 'Annex A.3 and A.4 competence' },
        { key: 'HEALTH', cite: 'HHS 405(d) HICP workforce practices' }
      ],
      questions: [
        {
          id: 'I1', type: 'choice', weight: 1.5,
          text: 'What share of your staff have received training on safe use of AI?',
          options: [
            { value: 'none', label: 'None', score: 0 },
            { value: 'few', label: 'A few teams', score: 1 },
            { value: 'most', label: 'Most clinical and administrative staff', score: 3 },
            { value: 'all', label: 'All staff', score: 4 },
            { value: 'refresh', label: 'All staff, with a yearly refresher', score: 5 }
          ],
          refs: [{ key: 'ISO42001', cite: 'A.4' }],
          remedy: 'Roll out safe-AI-use training to all staff and add a yearly refresher.'
        },
        {
          id: 'I2', type: 'yesno', weight: 1.5,
          text: 'Does your awareness training cover AI-enabled scams, such as deepfake voice or video calls and AI-written phishing?',
          refs: [{ key: 'GENAI', cite: 'Synthetic media' }, { key: 'HEALTH', cite: 'HICP social engineering' }],
          remedy: 'Add deepfake and AI-written phishing content to awareness training, including a verification procedure for unusual requests.'
        },
        {
          id: 'I3', type: 'yesno', weight: 1.0,
          text: 'Does your security or IT team include someone with AI or data skills?',
          refs: [{ key: 'ISO42001', cite: 'A.4' }, { key: 'AIRMF', cite: 'GOVERN' }],
          remedy: 'Build or buy AI and data skills within the security team, and record it in the resourcing plan.'
        },
        {
          id: 'I4', type: 'yesno', weight: 1.0,
          text: 'Is there an easy way for staff to ask whether a particular AI tool is allowed?',
          hint: 'For example a mailbox, a form or a named contact.',
          refs: [{ key: 'ISO42001', cite: 'A.9 use of AI systems' }],
          remedy: 'Publish a single, easy route for staff to check whether an AI tool is permitted.'
        }
      ]
    },

    {
      id: 'J',
      title: 'Clinical AI and connected devices',
      weight: 7,
      intro: 'These questions only concern AI that touches patient care or medical equipment. Choose "Not applicable" where it does not apply to you.',
      refs: [
        { key: 'HEALTH', cite: 'HITRUST AI security assessment, medical device practice' },
        { key: 'CSF', cite: 'IDENTIFY and PROTECT functions' },
        { key: 'AIACT', cite: 'High-risk AI in health' }
      ],
      questions: [
        {
          id: 'J1', type: 'yesno', informational: true,
          text: 'Is AI used in direct clinical care in your organisation?',
          hint: 'For example diagnosis support, triage or medical imaging. This answer is context only.',
          refs: [{ key: 'HEALTH', cite: 'Clinical AI use' }]
        },
        {
          id: 'J2', type: 'yesno', weight: 1.5, allowNA: true,
          text: 'Where AI supports clinical decisions, is a named clinician always responsible for the final decision?',
          refs: [{ key: 'AIACT', cite: 'Art. 14' }, { key: 'HEALTH', cite: 'Clinical accountability' }],
          remedy: 'Record that a named clinician holds the final decision wherever AI supports clinical judgement.'
        },
        {
          id: 'J3', type: 'choice', weight: 1.5, allowNA: true,
          text: 'Are AI-enabled medical devices included in your device inventory and risk assessments?',
          options: [
            { value: 'none', label: 'We do not have a device inventory', score: 0 },
            { value: 'partly', label: 'Partly', score: 1 },
            { value: 'most', label: 'Most devices', score: 3 },
            { value: 'all', label: 'All devices', score: 4 },
            { value: 'monitored', label: 'All devices, with continuous monitoring', score: 5 }
          ],
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }, { key: 'HEALTH', cite: 'Medical device inventory' }],
          remedy: 'Bring AI-enabled medical devices into the device inventory and risk assessment process.'
        },
        {
          id: 'J4', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Do your clinical engineering and security teams jointly review AI-related updates to medical devices?',
          refs: [{ key: 'HEALTH', cite: 'Biomedical and security co-ordination' }, { key: 'SECAI', cite: 'Secure operation and maintenance' }],
          remedy: 'Set up a joint clinical engineering and security review for AI-related medical device updates.'
        },
        {
          id: 'J5', type: 'yesno', weight: 1.0, allowNA: true,
          text: 'Is there a documented fallback if a clinical AI tool becomes unavailable or unreliable?',
          hint: 'What clinicians do instead, and who tells them to switch.',
          refs: [{ key: 'CSF', cite: 'RECOVER' }, { key: 'HEALTH', cite: 'Clinical downtime procedures' }],
          remedy: 'Document and communicate the clinical fallback for each AI tool used in care.'
        }
      ]
    }
  ];

  /* ------------------------------------------------------------------ *
   * Respondent details collected before the questions
   * ------------------------------------------------------------------ */

  AIMA.respondentFields = [
    { id: 'contactName', label: 'Your name', type: 'text', required: true },
    { id: 'contactRole', label: 'Your job title', type: 'text', required: true },
    { id: 'contactEmail', label: 'Your work email', type: 'email', required: true },
    { id: 'contactPhone', label: 'Contact number', type: 'text', required: false },
    { id: 'approverName', label: 'Name of the senior person who approved this return', type: 'text', required: false }
  ];

  /* ------------------------------------------------------------------ *
   * Derived helpers
   * ------------------------------------------------------------------ */

  function isScored(question) {
    if (question.informational) return false;
    if (question.type === 'text') return false;
    if (question.type === 'number') return !!question.bands;
    return true;
  }

  AIMA.isScored = isScored;

  AIMA.allQuestions = AIMA.sections.reduce(function (acc, section) {
    section.questions.forEach(function (q, index) {
      acc.push(Object.assign({}, q, {
        sectionId: section.id,
        sectionTitle: section.title,
        sectionWeight: section.weight,
        indexInSection: index + 1,
        scored: isScored(q),
        weight: q.weight || 1
      }));
    });
    return acc;
  }, []);

  // Continuous question numbering, which is what respondents refer to.
  AIMA.allQuestions.forEach(function (q, i) { q.number = i + 1; });

  AIMA.questionCount = AIMA.allQuestions.length;
  AIMA.scoredQuestionCount = AIMA.allQuestions.filter(function (q) { return q.scored; }).length;

  AIMA.getSection = function (id) {
    return AIMA.sections.filter(function (s) { return s.id === id; })[0] || null;
  };

  AIMA.getQuestion = function (id) {
    return AIMA.allQuestions.filter(function (q) { return q.id === id; })[0] || null;
  };

  AIMA.getEntity = function (code) {
    return AIMA.entities.filter(function (e) { return e.code === code; })[0] || null;
  };

  /** Options a respondent may choose for a question, including N/A where allowed. */
  AIMA.optionsFor = function (question) {
    var options;
    if (question.type === 'yesno') {
      options = AIMA.yesNoOptions.slice();
    } else if (question.type === 'choice' || question.type === 'multi') {
      options = (question.options || []).slice();
    } else {
      options = [];
    }
    if (question.allowNA) options = options.concat([AIMA.notApplicableOption]);
    return options;
  };

  AIMA.totalSectionWeight = AIMA.sections.reduce(function (sum, s) { return sum + s.weight; }, 0);
})(window.AIMA);
