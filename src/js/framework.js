/*
 * Question bank and assessment model — bilingual (English / العربية)
 * ------------------------------------------------------------------
 * Measures how far an organisation has taken artificial intelligence into its
 * cybersecurity work: detection, alert triage and false positives, SOC
 * automation, threat intelligence, vulnerabilities, identity, data protection,
 * GRC, resilience, and the assurance around the AI itself.
 *
 * Every visible string is a { en, ar } pair. Both languages are shown together;
 * there is no language switch.
 *
 * The questionnaire renders `sections` as plain questions and never shows a
 * score. The governing body console uses the hidden values below to rate and
 * compare returns.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  /** Bilingual string. */
  function T(en, ar) { return { en: en, ar: ar }; }
  AIMA.T = T;

  /** Read one language out of a bilingual string (or a plain string). */
  AIMA.t = function (value, lang) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return value[lang || 'en'] || value.en || '';
  };

  AIMA.meta = {
    schemaVersion: '3.0.0',
    frameworkVersion: '2026.3',
    title: T('AI in Cybersecurity — Maturity Return',
      'استخدام الذكاء الاصطناعي في الأمن السيبراني — استبيان النضج'),
    estimatedMinutes: 15
  };

  /* ------------------------------------------------------------------ *
   * Reference frameworks
   * ------------------------------------------------------------------ */

  AIMA.frameworks = [
    {
      key: 'CSF', short: 'NIST CSF 2.0', publisher: 'NIST', year: 2024,
      name: T('NIST Cybersecurity Framework 2.0', 'إطار NIST للأمن السيبراني 2.0'),
      note: T('The six functions — govern, identify, protect, detect, respond, recover — that the security domains here follow.',
        'الوظائف الست: الحوكمة والتعريف والحماية والكشف والاستجابة والتعافي، وهي التي تتبعها مجالات الأمن هنا.')
    },
    {
      key: 'ATTACK', short: 'MITRE ATT&CK', publisher: 'MITRE', year: 2025,
      name: T('MITRE ATT&CK', 'إطار MITRE ATT&CK لأساليب المهاجمين'),
      note: T('The library of real attacker techniques used to measure how much of the threat landscape your detection covers.',
        'مكتبة أساليب المهاجمين الحقيقية، وتُستخدم لقياس مدى تغطية أنظمة الكشف لديكم لمشهد التهديدات.')
    },
    {
      key: 'SOCCMM', short: 'SOC-CMM', publisher: 'SOC-CMM', year: 2024,
      name: T('SOC-CMM security operations capability maturity model', 'نموذج نضج قدرات مركز العمليات الأمنية SOC-CMM'),
      note: T('The reference model for judging security operations maturity, including automation and analytics.',
        'النموذج المرجعي لتقييم نضج العمليات الأمنية، بما في ذلك الأتمتة والتحليلات.')
    },
    {
      key: 'AIRMF', short: 'NIST AI RMF', publisher: 'NIST', year: 2023,
      name: T('NIST AI Risk Management Framework 1.0', 'إطار NIST لإدارة مخاطر الذكاء الاصطناعي 1.0'),
      note: T('Govern, map, measure and manage — applied here to the AI you rely on inside the security function.',
        'الحوكمة والتحديد والقياس والإدارة، وتُطبَّق هنا على الذكاء الاصطناعي الذي تعتمدون عليه داخل وظيفة الأمن.')
    },
    {
      key: 'GENAI', short: 'NIST AI 600-1', publisher: 'NIST', year: 2024,
      name: T('NIST AI 600-1 — Generative AI Profile', 'ملف الذكاء الاصطناعي التوليدي NIST AI 600-1'),
      note: T('Risks specific to generative AI, including the security copilots and assistants a SOC now uses.',
        'المخاطر الخاصة بالذكاء الاصطناعي التوليدي، بما فيها المساعدات الذكية التي تستخدمها مراكز العمليات الأمنية.')
    },
    {
      key: 'OWASP', short: 'OWASP LLM Top 10 (2025)', publisher: 'OWASP', year: 2025,
      name: T('OWASP Top 10 for LLM Applications 2025', 'قائمة OWASP لأخطر عشرة مخاطر لتطبيقات النماذج اللغوية 2025'),
      note: T('Prompt injection, sensitive information disclosure, excessive agency and the rest — the risks of AI tools that accept text.',
        'حقن الأوامر، وكشف المعلومات الحساسة، والصلاحيات المفرطة وغيرها — مخاطر أدوات الذكاء الاصطناعي التي تقبل نصاً.')
    },
    {
      key: 'ATLAS', short: 'MITRE ATLAS', publisher: 'MITRE', year: 2024,
      name: T('MITRE ATLAS', 'إطار MITRE ATLAS للهجمات على أنظمة الذكاء الاصطناعي'),
      note: T('Adversary techniques aimed at AI systems, behind the questions on testing and manipulation.',
        'أساليب الخصوم الموجهة لأنظمة الذكاء الاصطناعي، وهي أساس الأسئلة المتعلقة بالاختبار والتلاعب.')
    },
    {
      key: 'ISO42001', short: 'ISO/IEC 42001', publisher: 'ISO/IEC', year: 2023,
      name: T('ISO/IEC 42001:2023 — AI management systems', 'المواصفة ISO/IEC 42001:2023 لأنظمة إدارة الذكاء الاصطناعي'),
      note: T('The certifiable standard for managing AI, used for the ownership and oversight questions.',
        'المواصفة القابلة للاعتماد لإدارة الذكاء الاصطناعي، وتُستخدم لأسئلة الملكية والإشراف.')
    },
    {
      key: 'ISO27001', short: 'ISO/IEC 27001', publisher: 'ISO/IEC', year: 2022,
      name: T('ISO/IEC 27001:2022 — information security management', 'المواصفة ISO/IEC 27001:2022 لإدارة أمن المعلومات'),
      note: T('The control and audit backbone behind the governance, risk and compliance section.',
        'العمود الفقري للضوابط والتدقيق خلف قسم الحوكمة وإدارة المخاطر والامتثال.')
    },
    {
      key: 'SECAI', short: 'CISA / NCSC secure AI', publisher: 'CISA, NCSC and partners', year: 2023,
      name: T('Guidelines for Secure AI System Development', 'إرشادات التطوير الآمن لأنظمة الذكاء الاصطناعي'),
      note: T('Secure design, development, deployment and operation of the AI systems you buy or build.',
        'التصميم والتطوير والنشر والتشغيل الآمن لأنظمة الذكاء الاصطناعي التي تشترونها أو تبنونها.')
    },
    {
      key: 'HEALTH', short: 'HITRUST AI / HHS HICP', publisher: 'HITRUST, US HHS', year: 2024,
      name: T('HITRUST AI security assessment and HHS 405(d) HICP', 'تقييم HITRUST لأمن الذكاء الاصطناعي وممارسات HHS 405(d)'),
      note: T('Health-sector expectations for clinical systems, medical devices and continuity of care.',
        'متطلبات القطاع الصحي للأنظمة السريرية والأجهزة الطبية واستمرارية الرعاية.')
    },
    {
      key: 'AIACT', short: 'EU AI Act', publisher: 'European Union', year: 2024,
      name: T('EU AI Act (Regulation 2024/1689)', 'قانون الذكاء الاصطناعي الأوروبي (اللائحة 2024/1689)'),
      note: T('Human oversight (Art. 14) and accuracy, robustness and cybersecurity (Art. 15).',
        'الإشراف البشري (المادة 14) والدقة والمتانة والأمن السيبراني (المادة 15).')
    }
  ];

  AIMA.getFramework = function (key) {
    return AIMA.frameworks.filter(function (f) { return f.key === key; })[0] || null;
  };

  /* ------------------------------------------------------------------ *
   * Rating model — governing body only, never shown in the questionnaire
   * ------------------------------------------------------------------ */

  AIMA.yesNoScores = { yes: 5, no: 0, unsure: 1 };
  AIMA.NOT_APPLICABLE = 'na';

  AIMA.yesNoOptions = [
    { value: 'yes', label: T('Yes', 'نعم') },
    { value: 'no', label: T('No', 'لا') },
    { value: 'unsure', label: T('Not sure', 'غير متأكد') }
  ];

  AIMA.notApplicableOption = { value: AIMA.NOT_APPLICABLE, label: T('Not applicable', 'لا ينطبق') };

  AIMA.levels = [
    {
      level: 1, min: 0.00, max: 1.49, color: '#c0392b',
      name: T('Not established', 'غير مؤسَّس'),
      description: T('AI is not yet part of how this organisation defends itself.',
        'الذكاء الاصطناعي ليس بعد جزءاً من طريقة دفاع هذه المؤسسة عن نفسها.')
    },
    {
      level: 2, min: 1.50, max: 2.49, color: '#d97706',
      name: T('Emerging', 'ناشئ'),
      description: T('Some AI capability exists, mostly vendor defaults, used unevenly and unmeasured.',
        'توجد بعض قدرات الذكاء الاصطناعي، غالباً بالإعدادات الافتراضية للمورد، وتُستخدم بشكل متفاوت ودون قياس.')
    },
    {
      level: 3, min: 2.50, max: 3.49, color: '#b7950b',
      name: T('Established', 'مؤسَّس'),
      description: T('AI is used deliberately across the main security domains, with documented practice.',
        'يُستخدم الذكاء الاصطناعي بشكل مقصود عبر مجالات الأمن الرئيسية، مع ممارسات موثقة.')
    },
    {
      level: 4, min: 3.50, max: 4.49, color: '#0e8b7d',
      name: T('Managed', 'مُدار'),
      description: T('AI is integrated into daily security operations, measured, and covers clinical systems.',
        'الذكاء الاصطناعي مدمج في العمليات الأمنية اليومية، ويُقاس، ويغطي الأنظمة السريرية.')
    },
    {
      level: 5, min: 4.50, max: 5.00, color: '#123e5c',
      name: T('Leading', 'ريادي'),
      description: T('AI-driven defence is automated end to end, continuously tested and improved.',
        'الدفاع المعتمد على الذكاء الاصطناعي مؤتمت من البداية إلى النهاية، ويُختبر ويُحسَّن باستمرار.')
    }
  ];

  AIMA.defaultTargetLevel = 4;

  /* ------------------------------------------------------------------ *
   * Register of reporting organisations — replace with the client's own
   * ------------------------------------------------------------------ */

  AIMA.entityTypes = [
    T('Tertiary Hospital', 'مستشفى مرجعي تخصصي'),
    T('General Hospital', 'مستشفى عام'),
    T('Specialty Hospital', 'مستشفى تخصصي'),
    T('Primary Care Cluster', 'تجمع رعاية أولية'),
    T('Diagnostics & Laboratories', 'التشخيص والمختبرات'),
    T('Public Health', 'الصحة العامة'),
    T('Emergency Services', 'خدمات الطوارئ'),
    T('Insurance & Claims', 'التأمين والمطالبات'),
    T('Shared Services', 'الخدمات المشتركة'),
    T('Research & Academia', 'البحث والأوساط الأكاديمية')
  ];

  AIMA.regions = [
    T('Central', 'الوسطى'),
    T('North', 'الشمالية'),
    T('South', 'الجنوبية'),
    T('East', 'الشرقية'),
    T('West', 'الغربية')
  ];

  AIMA.entitySizes = [
    T('Small — under 500 staff', 'صغيرة — أقل من 500 موظف'),
    T('Medium — 500 to 2,000 staff', 'متوسطة — من 500 إلى 2,000 موظف'),
    T('Large — 2,000 to 10,000 staff', 'كبيرة — من 2,000 إلى 10,000 موظف'),
    T('Very large — over 10,000 staff', 'كبيرة جداً — أكثر من 10,000 موظف')
  ];

  function entity(code, en, ar, typeIndex, regionIndex, sizeIndex) {
    return {
      code: code,
      name: T(en, ar),
      type: AIMA.entityTypes[typeIndex],
      region: AIMA.regions[regionIndex],
      size: AIMA.entitySizes[sizeIndex]
    };
  }

  AIMA.entities = [
    entity('E01', 'Central Medical City', 'المدينة الطبية المركزية', 0, 0, 3),
    entity('E02', 'Northern Teaching Hospital', 'المستشفى التعليمي الشمالي', 0, 1, 2),
    entity('E03', 'Southern Regional Hospital', 'مستشفى المنطقة الجنوبية', 1, 2, 2),
    entity('E04', 'Eastern Regional Hospital', 'مستشفى المنطقة الشرقية', 1, 3, 2),
    entity('E05', 'Western Regional Hospital', 'مستشفى المنطقة الغربية', 1, 4, 2),
    entity('E06', 'Capital General Hospital', 'مستشفى العاصمة العام', 1, 0, 1),
    entity('E07', "Children's Specialty Hospital", 'مستشفى الأطفال التخصصي', 2, 0, 1),
    entity('E08', "Maternity & Women's Hospital", 'مستشفى الولادة وصحة المرأة', 2, 0, 1),
    entity('E09', 'National Oncology Centre', 'المركز الوطني للأورام', 2, 0, 1),
    entity('E10', 'Cardiac Care Centre', 'مركز رعاية القلب', 2, 1, 1),
    entity('E11', 'Behavioural Health Hospital', 'مستشفى الصحة النفسية والسلوكية', 2, 2, 1),
    entity('E12', 'Rehabilitation & Long-Term Care Hospital', 'مستشفى التأهيل والرعاية طويلة الأمد', 2, 3, 0),
    entity('E13', 'Ophthalmology Hospital', 'مستشفى العيون', 2, 4, 0),
    entity('E14', 'Central Primary Care Cluster', 'تجمع الرعاية الأولية المركزي', 3, 0, 2),
    entity('E15', 'Northern Primary Care Cluster', 'تجمع الرعاية الأولية الشمالي', 3, 1, 1),
    entity('E16', 'Southern Primary Care Cluster', 'تجمع الرعاية الأولية الجنوبي', 3, 2, 1),
    entity('E17', 'Eastern Primary Care Cluster', 'تجمع الرعاية الأولية الشرقي', 3, 3, 1),
    entity('E18', 'Western Primary Care Cluster', 'تجمع الرعاية الأولية الغربي', 3, 4, 1),
    entity('E19', 'National Reference Laboratory', 'المختبر المرجعي الوطني', 4, 0, 1),
    entity('E20', 'Regional Diagnostics & Imaging Network', 'الشبكة الإقليمية للتشخيص والأشعة', 4, 1, 1),
    entity('E21', 'National Blood & Tissue Services', 'الخدمات الوطنية للدم والأنسجة', 4, 0, 1),
    entity('E22', 'Public Health & Epidemiology Authority', 'هيئة الصحة العامة والوبائيات', 5, 0, 1),
    entity('E23', 'Health Emergency Operations Centre', 'مركز عمليات الطوارئ الصحية', 5, 0, 0),
    entity('E24', 'National Ambulance & Emergency Services', 'الخدمات الوطنية للإسعاف والطوارئ', 6, 0, 2),
    entity('E25', 'Health Insurance & Claims Authority', 'هيئة التأمين الصحي والمطالبات', 7, 0, 1),
    entity('E26', 'Pharmaceutical Supply & Logistics Authority', 'هيئة الإمداد الدوائي والخدمات اللوجستية', 8, 0, 1),
    entity('E27', 'Health Information Exchange & Digital Platforms', 'منصات تبادل المعلومات الصحية الرقمية', 8, 0, 2),
    entity('E28', 'Medical Research Institute', 'معهد البحوث الطبية', 9, 0, 0),
    entity('E29', 'Health Workforce Training Academy', 'أكاديمية تدريب الكوادر الصحية', 9, 0, 0),
    entity('E30', 'Facilities & Biomedical Engineering Services', 'خدمات المرافق والهندسة الطبية الحيوية', 8, 0, 1)
  ];

  /* ------------------------------------------------------------------ *
   * Sections and questions
   * Section weights are percentages and must total 100.
   * Question weight 1.5 marks a core capability, 1 a standard one.
   * ------------------------------------------------------------------ */

  AIMA.sections = [
    {
      id: 'A', weight: 9,
      title: T('Strategy, ownership and adoption', 'الاستراتيجية والملكية والتبنّي'),
      intro: T('How deliberate your use of AI in cybersecurity is: who owns it, how it is funded, and whether anyone checks that it works.',
        'مدى وضوح توجهكم في استخدام الذكاء الاصطناعي في الأمن السيبراني: من يملك الملف، وكيف يُموَّل، وهل يتحقق أحد من جدواه.'),
      refs: [{ key: 'AIRMF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'Annex A.2, A.3' }, { key: 'CSF', cite: 'GOVERN' }],
      questions: [
        {
          id: 'A1', type: 'yesno', weight: 1.5,
          text: T('Has your organisation approved a plan or strategy for using AI in cybersecurity?',
            'هل اعتمدت مؤسستكم خطة أو استراتيجية لاستخدام الذكاء الاصطناعي في الأمن السيبراني؟'),
          hint: T('A document approved by management. An informal intention does not count.',
            'وثيقة معتمدة من الإدارة. النية غير الرسمية لا تُحتسب.'),
          refs: [{ key: 'AIRMF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'A.2' }],
          remedy: T('Approve a written plan for using AI in cybersecurity, naming the priority use cases and their owners.',
            'اعتماد خطة مكتوبة لاستخدام الذكاء الاصطناعي في الأمن السيبراني، تحدد حالات الاستخدام ذات الأولوية ومالكيها.')
        },
        {
          id: 'A2', type: 'yesno', weight: 1.5,
          text: T('Is one named person accountable for AI use inside the security function?',
            'هل هناك شخص محدد بالاسم مسؤول عن استخدام الذكاء الاصطناعي داخل وظيفة الأمن السيبراني؟'),
          hint: T('For example the head of security operations or the CISO.',
            'على سبيل المثال رئيس العمليات الأمنية أو رئيس أمن المعلومات.'),
          refs: [{ key: 'ISO42001', cite: 'A.3' }, { key: 'AIRMF', cite: 'GOVERN' }],
          remedy: T('Assign a single accountable owner for AI in the security function and record it in the governance structure.',
            'تعيين مالك مسؤول واحد للذكاء الاصطناعي في وظيفة الأمن وتوثيق ذلك في هيكل الحوكمة.')
        },
        {
          id: 'A3', type: 'choice', weight: 1.0,
          text: T('How is AI in cybersecurity paid for?', 'كيف يتم تمويل استخدام الذكاء الاصطناعي في الأمن السيبراني؟'),
          options: [
            { value: 'none', score: 0, label: T('There is no funding for it', 'لا يوجد تمويل مخصص له') },
            { value: 'adhoc', score: 1, label: T('Case by case, when something is needed', 'حالة بحالة عند الحاجة') },
            { value: 'bundled', score: 2, label: T('Only through features already included in tools we own', 'فقط من خلال خصائص مضمّنة في أدوات نمتلكها') },
            { value: 'budgeted', score: 4, label: T('A planned budget line for this year', 'بند ميزانية مخطط لهذا العام') },
            { value: 'programme', score: 5, label: T('A funded multi-year programme', 'برنامج ممول لعدة سنوات') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Business — funding' }],
          remedy: T('Create a dedicated budget line for AI in security rather than relying on features bundled with existing tools.',
            'إنشاء بند ميزانية مخصص للذكاء الاصطناعي في الأمن بدلاً من الاعتماد على الخصائص المضمّنة في الأدوات الحالية.')
        },
        {
          id: 'A4', type: 'yesno', weight: 1.5,
          text: T('Do you measure whether AI is actually improving your security results?',
            'هل تقيسون ما إذا كان الذكاء الاصطناعي يُحسِّن فعلياً نتائجكم الأمنية؟'),
          hint: T('For example detection time, response time or analyst workload, compared before and after.',
            'مثل زمن الكشف أو زمن الاستجابة أو عبء عمل المحللين، بالمقارنة قبل وبعد.'),
          refs: [{ key: 'AIRMF', cite: 'MEASURE' }, { key: 'SOCCMM', cite: 'Services — metrics' }],
          remedy: T('Baseline your key security metrics and report the change attributable to AI and automation.',
            'تحديد خط أساس لمؤشرات الأمن الرئيسية وقياس التغير الناتج عن الذكاء الاصطناعي والأتمتة.')
        },
        {
          id: 'A5', type: 'choice', weight: 1.0,
          text: T('How often does executive management receive a report on AI in cybersecurity?',
            'كم مرة تتلقى الإدارة التنفيذية تقريراً عن الذكاء الاصطناعي في الأمن السيبراني؟'),
          options: [
            { value: 'never', score: 0, label: T('Never', 'أبداً') },
            { value: 'incident', score: 1, label: T('Only when something goes wrong', 'فقط عند وقوع مشكلة') },
            { value: 'annual', score: 3, label: T('Once a year', 'مرة واحدة سنوياً') },
            { value: 'quarterly', score: 4, label: T('Every three months', 'كل ثلاثة أشهر') },
            { value: 'monthly', score: 5, label: T('Every month', 'كل شهر') }
          ],
          refs: [{ key: 'CSF', cite: 'GOVERN' }, { key: 'ISO27001', cite: 'Management review' }],
          remedy: T('Add AI and automation performance to the quarterly security report to executive management.',
            'إضافة أداء الذكاء الاصطناعي والأتمتة إلى التقرير الأمني الربع سنوي المرفوع للإدارة التنفيذية.')
        },
        {
          id: 'A6', type: 'multi', weight: 1.5,
          text: T('Which of these AI-supported capabilities are actually live in your security work today?',
            'أي من قدرات الذكاء الاصطناعي التالية تعمل فعلياً في أعمال الأمن لديكم اليوم؟'),
          hint: T('Tick only what is running in production today, not what is planned or being trialled.',
            'اختاروا ما يعمل فعلياً في بيئة الإنتاج اليوم فقط، وليس ما هو مخطط أو قيد التجربة.'),
          options: [
            { value: 'triage', points: 1, label: T('Sorting and prioritising security alerts', 'فرز التنبيهات الأمنية وترتيب أولوياتها') },
            { value: 'analytics', points: 1, label: T('Behaviour analytics to detect threats', 'تحليلات السلوك لكشف التهديدات') },
            { value: 'response', points: 1, label: T('Automated response actions', 'إجراءات استجابة مؤتمتة') },
            { value: 'assistant', points: 1, label: T('An AI assistant that helps analysts investigate', 'مساعد ذكي يعين المحللين على التحقيق') },
            { value: 'phishing', points: 1, label: T('Detecting phishing and email fraud', 'كشف التصيّد والاحتيال عبر البريد') },
            { value: 'vulns', points: 1, label: T('Prioritising vulnerabilities', 'ترتيب أولويات الثغرات') },
            { value: 'grc', points: 1, label: T('Collecting compliance or audit evidence', 'جمع أدلة الامتثال أو التدقيق') },
            { value: 'reporting', points: 1, label: T('Writing incident or management reports', 'كتابة تقارير الحوادث أو التقارير الإدارية') }
          ],
          noneLabel: T('None of these are live yet', 'لا شيء من هذه يعمل حتى الآن'),
          refs: [{ key: 'SOCCMM', cite: 'Capability adoption' }, { key: 'AIRMF', cite: 'MAP' }],
          remedy: T('Widen AI use beyond the one or two areas already live, starting with alert triage and analyst assistance.',
            'توسيع استخدام الذكاء الاصطناعي إلى ما هو أبعد من المجالات القليلة العاملة حالياً، بدءاً بفرز التنبيهات ومساعدة المحللين.')
        }
      ]
    },

    {
      id: 'B', weight: 8,
      title: T('Data and telemetry foundation', 'أساس البيانات وسجلات المراقبة'),
      intro: T('AI in security is only as good as the data it sees. These questions are about coverage and quality of your logs.',
        'قيمة الذكاء الاصطناعي في الأمن مرهونة بجودة البيانات التي يراها. تتناول هذه الأسئلة تغطية السجلات وجودتها.'),
      refs: [{ key: 'CSF', cite: 'IDENTIFY, DETECT' }, { key: 'SOCCMM', cite: 'Technology — log management' }],
      questions: [
        {
          id: 'B1', type: 'multi', weight: 1.5,
          text: T('Which of these send their security logs to one central place?',
            'أي من هذه المصادر تُرسل سجلاتها الأمنية إلى مكان مركزي واحد؟'),
          hint: T('A SIEM, a data lake or equivalent. Tick everything that is connected today.',
            'نظام SIEM أو بحيرة بيانات أو ما يعادلهما. اختر كل ما هو موصول اليوم.'),
          options: [
            { value: 'endpoints', points: 1, label: T('Computers and servers', 'الحواسيب والخوادم') },
            { value: 'network', points: 1, label: T('Network and firewalls', 'الشبكة وجدران الحماية') },
            { value: 'identity', points: 1, label: T('Identity and sign-in systems', 'أنظمة الهوية وتسجيل الدخول') },
            { value: 'cloud', points: 1, label: T('Cloud services', 'الخدمات السحابية') },
            { value: 'clinical', points: 1, label: T('Clinical and hospital systems', 'الأنظمة السريرية وأنظمة المستشفى') },
            { value: 'devices', points: 1, label: T('Medical and other connected devices', 'الأجهزة الطبية والأجهزة المتصلة الأخرى') }
          ],
          noneLabel: T('None of these', 'لا شيء مما سبق'),
          refs: [{ key: 'CSF', cite: 'DETECT' }, { key: 'HEALTH', cite: 'Clinical system coverage' }],
          remedy: T('Extend central log collection to the sources not yet connected, prioritising clinical systems and connected devices.',
            'توسيع التجميع المركزي للسجلات ليشمل المصادر غير الموصولة، مع إعطاء الأولوية للأنظمة السريرية والأجهزة المتصلة.')
        },
        {
          id: 'B2', type: 'choice', weight: 1.5,
          text: T('How complete and reliable is that log data?', 'ما مدى اكتمال وموثوقية بيانات السجلات هذه؟'),
          options: [
            { value: 'none', score: 0, label: T('There is no central logging', 'لا يوجد تجميع مركزي للسجلات') },
            { value: 'unknown', score: 1, label: T('Logs are collected but we do not know what is missing', 'تُجمع السجلات لكننا لا نعرف ما هو مفقود') },
            { value: 'known', score: 2, label: T('We know where the gaps are', 'نعرف أين توجد الفجوات') },
            { value: 'closing', score: 4, label: T('Gaps are tracked and being closed', 'الفجوات مُتابعة ويجري إغلاقها') },
            { value: 'monitored', score: 5, label: T('Log sources are monitored automatically for silence and errors', 'تُراقب مصادر السجلات آلياً لاكتشاف الانقطاع والأخطاء') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Technology — log quality' }],
          remedy: T('Monitor log sources automatically for silence and parsing errors so analytics are not blind without anyone noticing.',
            'مراقبة مصادر السجلات آلياً لاكتشاف الانقطاع وأخطاء التحليل حتى لا تعمل التحليلات دون بيانات بلا علم أحد.')
        },
        {
          id: 'B3', type: 'yesno', weight: 1.0,
          text: T('Is your asset list good enough for analytics to know what a system is and who owns it?',
            'هل قائمة الأصول لديكم جيدة بما يكفي لتعرف أدوات التحليل ماهية النظام ومن يملكه؟'),
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }],
          remedy: T('Improve the asset inventory and link it to security events so alerts arrive with owner and criticality.',
            'تحسين سجل الأصول وربطه بالأحداث الأمنية بحيث تصل التنبيهات مصحوبة بالمالك ودرجة الأهمية.')
        },
        {
          id: 'B4', type: 'yesno', weight: 1.0,
          text: T('Is the data your AI security tools use protected as sensitive information?',
            'هل تُحمى البيانات التي تستخدمها أدوات الأمن المعتمدة على الذكاء الاصطناعي باعتبارها معلومات حساسة؟'),
          hint: T('Access controlled, retained for a defined period, and stored in approved locations.',
            'مقيدة الوصول، ومحفوظة لمدة محددة، ومخزنة في مواقع معتمدة.'),
          refs: [{ key: 'ISO27001', cite: 'A.5, A.8' }, { key: 'GENAI', cite: 'Data protection' }],
          remedy: T('Apply the same access, retention and location controls to security analytics data as to other sensitive data.',
            'تطبيق ضوابط الوصول والاحتفاظ والموقع نفسها على بيانات التحليلات الأمنية كما تُطبق على البيانات الحساسة الأخرى.')
        }
      ]
    },

    {
      id: 'C', weight: 12,
      title: T('Threat detection and monitoring', 'كشف التهديدات والمراقبة'),
      intro: T('Whether AI is helping you find attacks, and how much of the organisation it watches.',
        'ما إذا كان الذكاء الاصطناعي يساعدكم في اكتشاف الهجمات، وما حجم ما يراقبه من المؤسسة.'),
      refs: [{ key: 'CSF', cite: 'DETECT' }, { key: 'ATTACK', cite: 'Detection coverage' }, { key: 'SOCCMM', cite: 'Services — monitoring' }],
      questions: [
        {
          id: 'C1', type: 'yesno', weight: 1.5,
          text: T('Does your monitoring use machine learning or behaviour analytics, not only fixed rules?',
            'هل تستخدم المراقبة لديكم التعلّم الآلي أو تحليلات السلوك، وليس القواعد الثابتة فقط؟'),
          hint: T('For example alerting when an account or device behaves unlike its normal pattern.',
            'مثل التنبيه عندما يسلك حساب أو جهاز سلوكاً مختلفاً عن نمطه المعتاد.'),
          refs: [{ key: 'CSF', cite: 'DETECT' }, { key: 'SOCCMM', cite: 'Analytics' }],
          remedy: T('Introduce behaviour analytics alongside rule-based detection, starting with identity and endpoint data.',
            'إدخال تحليلات السلوك إلى جانب الكشف القائم على القواعد، بدءاً ببيانات الهوية والأجهزة الطرفية.')
        },
        {
          id: 'C2', type: 'choice', weight: 1.5,
          text: T('How much of your environment does that analytics-based detection cover?',
            'ما حجم البيئة التي تغطيها أنظمة الكشف القائمة على التحليلات؟'),
          options: [
            { value: 'none', score: 0, label: T('None of it', 'لا شيء منها') },
            { value: 'few', score: 1, label: T('A few critical systems', 'بعض الأنظمة الحرجة') },
            { value: 'it', score: 3, label: T('Most IT systems', 'معظم أنظمة تقنية المعلومات') },
            { value: 'clinical', score: 4, label: T('IT and clinical systems', 'أنظمة تقنية المعلومات والأنظمة السريرية') },
            { value: 'devices', score: 5, label: T('Also medical and operational devices', 'إضافة إلى الأجهزة الطبية والتشغيلية') }
          ],
          refs: [{ key: 'HEALTH', cite: 'Clinical and device coverage' }, { key: 'CSF', cite: 'DETECT' }],
          remedy: T('Extend analytics-based detection beyond IT into clinical systems and connected medical devices.',
            'توسيع الكشف القائم على التحليلات ليتجاوز تقنية المعلومات إلى الأنظمة السريرية والأجهزة الطبية المتصلة.')
        },
        {
          id: 'C3', type: 'yesno', weight: 1.0,
          text: T('Do you map what your detection covers against a recognised library of attacker techniques?',
            'هل تقارنون تغطية أنظمة الكشف لديكم بمكتبة معتمدة لأساليب المهاجمين؟'),
          hint: T('For example MITRE ATT&CK.', 'مثل MITRE ATT&CK.'),
          refs: [{ key: 'ATTACK', cite: 'Coverage mapping' }],
          remedy: T('Map detection coverage to MITRE ATT&CK so the gaps in what you can see become visible and rankable.',
            'ربط تغطية الكشف بإطار MITRE ATT&CK لتصبح الفجوات في قدرتكم على الرؤية واضحة وقابلة للترتيب.')
        },
        {
          id: 'C4', type: 'choice', weight: 1.0,
          text: T('How often are your detection rules and models reviewed and tuned?',
            'كم مرة تُراجع قواعد ونماذج الكشف لديكم وتُضبط؟'),
          options: [
            { value: 'never', score: 0, label: T('Never', 'أبداً') },
            { value: 'missed', score: 1, label: T('Only after something is missed', 'فقط بعد تفويت تهديد') },
            { value: 'annual', score: 2, label: T('About once a year', 'مرة واحدة سنوياً تقريباً') },
            { value: 'quarterly', score: 4, label: T('Every three months', 'كل ثلاثة أشهر') },
            { value: 'continuous', score: 5, label: T('Continuously, and we measure the result', 'بشكل مستمر ونقيس النتيجة') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Use case management' }],
          remedy: T('Set up a regular detection tuning cycle with measured precision, and retire rules that no longer earn their place.',
            'إنشاء دورة منتظمة لضبط الكشف مع قياس الدقة، وإيقاف القواعد التي لم تعد ذات جدوى.')
        },
        {
          id: 'C5', type: 'yesno', weight: 1.0,
          text: T('Is monitoring available around the clock, with AI helping cover the quiet hours?',
            'هل المراقبة متاحة على مدار الساعة، مع استعانة بالذكاء الاصطناعي لتغطية ساعات انخفاض التواجد؟'),
          refs: [{ key: 'SOCCMM', cite: 'Services — coverage' }, { key: 'CSF', cite: 'DETECT' }],
          remedy: T('Use AI-assisted triage to extend monitoring into out-of-hours periods, with a documented handover to analysts.',
            'استخدام الفرز المدعوم بالذكاء الاصطناعي لتمديد المراقبة خارج ساعات العمل، مع تسليم موثق للمحللين.')
        }
      ]
    },

    {
      id: 'D', weight: 10,
      title: T('Alert triage and false positives', 'فرز التنبيهات والإنذارات الكاذبة'),
      intro: T('Whether AI is reducing the noise your analysts have to work through, and whether you can prove it.',
        'ما إذا كان الذكاء الاصطناعي يقلل الضجيج الذي يتعامل معه المحللون، وهل يمكنكم إثبات ذلك.'),
      refs: [{ key: 'SOCCMM', cite: 'Services — triage' }, { key: 'CSF', cite: 'DETECT' }],
      questions: [
        {
          id: 'D1', type: 'yesno', weight: 1.5,
          text: T('Do you use AI or automation to group, de-duplicate and rank alerts before an analyst sees them?',
            'هل تستخدمون الذكاء الاصطناعي أو الأتمتة لتجميع التنبيهات وإزالة تكرارها وترتيبها قبل وصولها إلى المحلل؟'),
          refs: [{ key: 'SOCCMM', cite: 'Triage automation' }],
          remedy: T('Introduce automated correlation and risk ranking so analysts receive grouped, prioritised alerts instead of raw ones.',
            'إدخال الربط الآلي والترتيب حسب المخاطر بحيث يتلقى المحللون تنبيهات مجمّعة ومرتّبة بدلاً من التنبيهات الخام.')
        },
        {
          id: 'D2', type: 'yesno', weight: 1.5,
          text: T('Do you measure your false positive rate?', 'هل تقيسون نسبة الإنذارات الكاذبة لديكم؟'),
          hint: T('A number you could quote today, not an impression.',
            'رقم يمكنكم ذكره اليوم، وليس انطباعاً عاماً.'),
          refs: [{ key: 'SOCCMM', cite: 'Metrics' }, { key: 'AIRMF', cite: 'MEASURE' }],
          remedy: T('Start recording the false positive rate per detection so tuning can be judged on evidence.',
            'البدء بتسجيل نسبة الإنذارات الكاذبة لكل قاعدة كشف حتى يمكن تقييم الضبط بناءً على أدلة.')
        },
        {
          id: 'D3', type: 'choice', weight: 1.5,
          text: T('What has happened to the number of alerts analysts handle by hand since AI or automation was introduced?',
            'ماذا حدث لعدد التنبيهات التي يعالجها المحللون يدوياً منذ إدخال الذكاء الاصطناعي أو الأتمتة؟'),
          options: [
            { value: 'none', score: 0, label: T('We do not use AI or automation for this', 'لا نستخدم الذكاء الاصطناعي أو الأتمتة لهذا الغرض') },
            { value: 'nochange', score: 1, label: T('No noticeable change', 'لا يوجد تغير ملحوظ') },
            { value: 'small', score: 3, label: T('A small reduction', 'انخفاض طفيف') },
            { value: 'large', score: 4, label: T('A large reduction, and we measured it', 'انخفاض كبير وقد قِسناه') },
            { value: 'tracked', score: 5, label: T('A large reduction, tracked every month', 'انخفاض كبير ويُتابع شهرياً') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Efficiency' }],
          remedy: T('Measure analyst alert volume before and after automation so the benefit is visible and defensible.',
            'قياس حجم التنبيهات الواصلة للمحللين قبل الأتمتة وبعدها ليكون الأثر واضحاً وقابلاً للإثبات.')
        },
        {
          id: 'D4', type: 'yesno', weight: 1.0,
          text: T('Do analysts give feedback on wrong AI decisions, and does that feedback change the system?',
            'هل يقدم المحللون ملاحظات على قرارات الذكاء الاصطناعي الخاطئة، وهل تُحدث تلك الملاحظات تغييراً في النظام؟'),
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }, { key: 'SOCCMM', cite: 'Continuous improvement' }],
          remedy: T('Create a feedback route from analysts into detection tuning, and show that the corrections are applied.',
            'إنشاء مسار لملاحظات المحللين يصل إلى ضبط الكشف، مع إثبات تطبيق التصحيحات.')
        },
        {
          id: 'D5', type: 'number', informational: true,
          text: T('Roughly how many security alerts reach an analyst each day?',
            'كم عدد التنبيهات الأمنية التي تصل إلى المحلل يومياً تقريباً؟'),
          hint: T('An estimate is fine. Enter 0 if you do not have a staffed queue.',
            'التقدير التقريبي كافٍ. أدخل 0 إذا لم يكن لديكم فريق مخصص لمتابعة التنبيهات.'),
          unit: T('alerts a day', 'تنبيه يومياً'),
          refs: [{ key: 'SOCCMM', cite: 'Workload' }]
        }
      ]
    },

    {
      id: 'E', weight: 11,
      title: T('Incident response and SOC automation', 'الاستجابة للحوادث وأتمتة مركز العمليات'),
      intro: T('How much of your response runs automatically, and what stops automation from harming patient care.',
        'ما مقدار الاستجابة التي تعمل آلياً، وما الذي يمنع الأتمتة من الإضرار برعاية المرضى.'),
      refs: [{ key: 'CSF', cite: 'RESPOND' }, { key: 'SOCCMM', cite: 'Technology — SOAR' }, { key: 'HEALTH', cite: 'Clinical safety' }],
      questions: [
        {
          id: 'E1', type: 'yesno', weight: 1.5,
          text: T('Do you have automated response playbooks running in production?',
            'هل لديكم أدلة استجابة مؤتمتة تعمل فعلياً في بيئة الإنتاج؟'),
          hint: T('SOAR or equivalent. Count only playbooks that actually run, not ones that are designed.',
            'من خلال SOAR أو ما يعادله. احسبوا فقط الأدلة التي تعمل فعلاً، لا التي صُممت ولم تُفعّل.'),
          refs: [{ key: 'CSF', cite: 'RESPOND' }, { key: 'SOCCMM', cite: 'Automation' }],
          remedy: T('Automate the highest-volume response steps first, starting with enrichment and containment of clearly compromised endpoints.',
            'أتمتة خطوات الاستجابة الأكثر تكراراً أولاً، بدءاً من إثراء المعلومات واحتواء الأجهزة المخترقة بوضوح.')
        },
        {
          id: 'E2', type: 'choice', weight: 1.5,
          text: T('How much of your incident response is automated?', 'ما مقدار الاستجابة للحوادث المؤتمت لديكم؟'),
          options: [
            { value: 'none', score: 0, label: T('Nothing is automated', 'لا شيء مؤتمت') },
            { value: 'enrich', score: 1, label: T('Gathering context only', 'جمع المعلومات السياقية فقط') },
            { value: 'approval', score: 3, label: T('Context, plus some containment after a person approves', 'المعلومات السياقية وبعض الاحتواء بعد موافقة شخص') },
            { value: 'common', score: 4, label: T('Common incident types are contained automatically', 'الأنواع الشائعة من الحوادث تُحتوى آلياً') },
            { value: 'endtoend', score: 5, label: T('End to end, with human oversight', 'من البداية إلى النهاية مع إشراف بشري') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Automation maturity' }],
          remedy: T('Move beyond automated enrichment into approved containment actions for your most common incident types.',
            'الانتقال من الإثراء الآلي للمعلومات إلى إجراءات احتواء معتمدة لأكثر أنواع الحوادث شيوعاً.')
        },
        {
          id: 'E3', type: 'yesno', weight: 1.5,
          text: T('Is there a firm rule that an automated action must never disrupt patient care without a human decision?',
            'هل توجد قاعدة صارمة بأن أي إجراء آلي يجب ألا يعطل رعاية المرضى دون قرار بشري؟'),
          hint: T('For example clinical workstations and medical devices are never isolated automatically.',
            'مثل ألا تُعزل محطات العمل السريرية والأجهزة الطبية آلياً أبداً.'),
          refs: [{ key: 'HEALTH', cite: 'Clinical safety' }, { key: 'AIACT', cite: 'Art. 14 human oversight' }],
          remedy: T('Write and enforce a rule that automated action affecting patient care always requires a human decision, and test it.',
            'كتابة وفرض قاعدة تقضي بأن أي إجراء آلي يمس رعاية المرضى يتطلب قراراً بشرياً دائماً، مع اختبارها.')
        },
        {
          id: 'E4', type: 'yesno', weight: 1.0,
          text: T('Does AI help produce incident timelines, summaries or reports?',
            'هل يساعد الذكاء الاصطناعي في إعداد الجداول الزمنية للحوادث أو ملخصاتها أو تقاريرها؟'),
          refs: [{ key: 'GENAI', cite: 'Assistive use' }, { key: 'CSF', cite: 'RESPOND' }],
          remedy: T('Use AI to draft incident timelines and summaries, with an analyst reviewing before the record is finalised.',
            'استخدام الذكاء الاصطناعي لصياغة الجداول الزمنية وملخصات الحوادث، مع مراجعة محلل قبل اعتماد السجل.')
        },
        {
          id: 'E5', type: 'yesno', weight: 1.0,
          text: T('Do you measure detection and response times, and can you show whether automation improved them?',
            'هل تقيسون أزمنة الكشف والاستجابة، وهل يمكنكم إظهار ما إذا كانت الأتمتة قد حسّنتها؟'),
          refs: [{ key: 'SOCCMM', cite: 'Metrics' }, { key: 'AIRMF', cite: 'MEASURE' }],
          remedy: T('Track mean time to detect and respond, and report the change since automation was introduced.',
            'تتبع متوسط زمن الكشف والاستجابة، ورفع تقرير بالتغير منذ إدخال الأتمتة.')
        }
      ]
    },

    {
      id: 'F', weight: 7,
      title: T('Threat intelligence and hunting', 'معلومات التهديدات والصيد الاستباقي'),
      intro: T('Whether outside knowledge of attackers reaches your own systems automatically, and whether anyone goes looking.',
        'هل تصل المعرفة الخارجية بالمهاجمين إلى أنظمتكم آلياً، وهل يبحث أحد عن التهديدات استباقياً.'),
      refs: [{ key: 'CSF', cite: 'IDENTIFY, DETECT' }, { key: 'ATTACK', cite: 'Threat-informed defence' }],
      questions: [
        {
          id: 'F1', type: 'yesno', weight: 1.5,
          text: T('Is threat intelligence matched automatically against your own systems and logs?',
            'هل تُقارَن معلومات التهديدات آلياً مع أنظمتكم وسجلاتكم؟'),
          hint: T('Rather than being read as reports and acted on manually.',
            'بدلاً من قراءتها كتقارير والتعامل معها يدوياً.'),
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }],
          remedy: T('Automate the matching of threat intelligence against your asset inventory and log history.',
            'أتمتة مطابقة معلومات التهديدات مع سجل الأصول وتاريخ السجلات لديكم.')
        },
        {
          id: 'F2', type: 'choice', weight: 1.0,
          text: T('How often do you go looking for threats that no alert has raised?',
            'كم مرة تبحثون عن تهديدات لم يُطلق بشأنها أي تنبيه؟'),
          hint: T('Known as threat hunting.', 'يُعرف بالصيد الاستباقي للتهديدات.'),
          options: [
            { value: 'never', score: 0, label: T('Never', 'أبداً') },
            { value: 'adhoc', score: 1, label: T('Occasionally and informally', 'أحياناً وبشكل غير رسمي') },
            { value: 'quarterly', score: 3, label: T('A few times a year', 'بضع مرات في السنة') },
            { value: 'monthly', score: 4, label: T('Every month', 'كل شهر') },
            { value: 'continuous', score: 5, label: T('Continuously, with AI support', 'بشكل مستمر بدعم الذكاء الاصطناعي') }
          ],
          refs: [{ key: 'SOCCMM', cite: 'Services — hunting' }],
          remedy: T('Establish a regular threat hunting routine with hypotheses drawn from ATT&CK and recent sector intelligence.',
            'إنشاء روتين منتظم للصيد الاستباقي بفرضيات مستمدة من ATT&CK ومن معلومات القطاع الحديثة.')
        },
        {
          id: 'F3', type: 'yesno', weight: 1.0,
          text: T('Do you use AI to summarise or prioritise the intelligence that matters to healthcare?',
            'هل تستخدمون الذكاء الاصطناعي لتلخيص أو ترتيب أولويات المعلومات المهمة للقطاع الصحي؟'),
          refs: [{ key: 'GENAI', cite: 'Assistive use' }, { key: 'HEALTH', cite: 'Sector intelligence' }],
          remedy: T('Use AI to filter and summarise threat intelligence down to what affects health systems you actually run.',
            'استخدام الذكاء الاصطناعي لتصفية وتلخيص معلومات التهديدات بما يخص الأنظمة الصحية التي تشغلونها فعلاً.')
        },
        {
          id: 'F4', type: 'yesno', weight: 1.0,
          text: T('Do you share what you learn with the governing body or other health organisations?',
            'هل تشاركون ما تتعلمونه مع الجهة المُشرِفة أو مع المؤسسات الصحية الأخرى؟'),
          refs: [{ key: 'HEALTH', cite: 'Sector information sharing' }, { key: 'CSF', cite: 'GOVERN' }],
          remedy: T('Join the sector information sharing route and contribute findings, not only receive them.',
            'الانضمام إلى قناة تبادل المعلومات القطاعية والمساهمة بالنتائج وليس تلقيها فقط.')
        }
      ]
    },

    {
      id: 'G', weight: 7,
      title: T('Vulnerabilities and attack surface', 'الثغرات ومساحة الهجوم'),
      intro: T('Whether analytics help you fix the things that actually matter first.',
        'هل تساعدكم التحليلات على معالجة ما يهم فعلاً أولاً.'),
      refs: [{ key: 'CSF', cite: 'IDENTIFY, PROTECT' }, { key: 'ISO27001', cite: 'A.8 technical vulnerabilities' }],
      questions: [
        {
          id: 'G1', type: 'yesno', weight: 1.5,
          text: T('Do you prioritise vulnerabilities by how exploitable and how critical they are, rather than by the published severity alone?',
            'هل ترتبون أولويات الثغرات حسب قابلية الاستغلال ودرجة الأهمية، بدلاً من درجة الخطورة المنشورة وحدها؟'),
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }],
          remedy: T('Adopt risk-based vulnerability prioritisation combining exploit activity with clinical and business criticality.',
            'اعتماد ترتيب الثغرات على أساس المخاطر بدمج نشاط الاستغلال مع الأهمية السريرية والتشغيلية.')
        },
        {
          id: 'G2', type: 'yesno', weight: 1.0,
          text: T('Is that prioritisation supported by AI or automated risk scoring?',
            'هل يدعم الذكاء الاصطناعي أو التقييم الآلي للمخاطر هذا الترتيب؟'),
          refs: [{ key: 'AIRMF', cite: 'MEASURE' }],
          remedy: T('Automate vulnerability risk scoring so the ranking updates as exploit intelligence changes.',
            'أتمتة تقييم مخاطر الثغرات بحيث يتحدث الترتيب مع تغير معلومات الاستغلال.')
        },
        {
          id: 'G3', type: 'choice', weight: 1.0,
          text: T('How often is everything you expose to the internet checked?',
            'كم مرة يتم فحص كل ما تعرضونه على الإنترنت؟'),
          options: [
            { value: 'never', score: 0, label: T('Never, or we are not sure what is exposed', 'أبداً، أو لسنا متأكدين مما هو معرَّض') },
            { value: 'annual', score: 1, label: T('Once a year', 'مرة واحدة سنوياً') },
            { value: 'quarterly', score: 3, label: T('Every three months', 'كل ثلاثة أشهر') },
            { value: 'monthly', score: 4, label: T('Every month', 'كل شهر') },
            { value: 'continuous', score: 5, label: T('Continuously and automatically', 'بشكل مستمر وآلي') }
          ],
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }],
          remedy: T('Run continuous external attack surface discovery so forgotten services are found before attackers find them.',
            'تشغيل اكتشاف مستمر لمساحة الهجوم الخارجية للعثور على الخدمات المنسية قبل أن يجدها المهاجمون.')
        },
        {
          id: 'G4', type: 'yesno', weight: 1.0,
          text: T('Do you use AI to review code or cloud configuration for security problems before go-live?',
            'هل تستخدمون الذكاء الاصطناعي لمراجعة الشيفرة أو إعدادات السحابة بحثاً عن مشاكل أمنية قبل التشغيل؟'),
          allowNA: true,
          refs: [{ key: 'SECAI', cite: 'Secure development' }],
          remedy: T('Add AI-assisted code and configuration review to the delivery pipeline, before changes reach production.',
            'إضافة مراجعة الشيفرة والإعدادات بمساعدة الذكاء الاصطناعي إلى مسار التسليم قبل وصول التغييرات للإنتاج.')
        }
      ]
    },

    {
      id: 'H', weight: 7,
      title: T('Identity and insider risk', 'الهوية والمخاطر الداخلية'),
      intro: T('Analytics applied to accounts, privileges and access to patient records.',
        'التحليلات المطبقة على الحسابات والصلاحيات والوصول إلى سجلات المرضى.'),
      refs: [{ key: 'CSF', cite: 'PROTECT, DETECT' }, { key: 'HEALTH', cite: 'Record access monitoring' }],
      questions: [
        {
          id: 'H1', type: 'yesno', weight: 1.5,
          text: T('Do you use behaviour analytics to spot unusual account or privileged user activity?',
            'هل تستخدمون تحليلات السلوك لرصد النشاط غير المعتاد للحسابات أو المستخدمين ذوي الصلاحيات العالية؟'),
          refs: [{ key: 'CSF', cite: 'DETECT' }],
          remedy: T('Deploy user and entity behaviour analytics, starting with privileged and service accounts.',
            'نشر تحليلات سلوك المستخدمين والكيانات، بدءاً بالحسابات ذات الصلاحيات العالية وحسابات الخدمات.')
        },
        {
          id: 'H2', type: 'yesno', weight: 1.5,
          text: T('Do you have analytics that detect inappropriate access to patient records?',
            'هل لديكم تحليلات تكشف الوصول غير المبرر إلى سجلات المرضى؟'),
          hint: T('For example a member of staff looking up a record with no care relationship.',
            'مثل اطلاع موظف على سجل مريض دون وجود علاقة رعاية.'),
          refs: [{ key: 'HEALTH', cite: 'Patient record access' }],
          remedy: T('Deploy patient record access analytics to detect look-ups with no care relationship, with HR and legal handling agreed.',
            'نشر تحليلات الوصول إلى سجلات المرضى لكشف الاطلاع دون علاقة رعاية، مع اتفاق مسبق على آلية التعامل مع الموارد البشرية والشؤون القانونية.')
        },
        {
          id: 'H3', type: 'yesno', weight: 1.0,
          text: T('Does the risk of a sign-in change what the user has to do to log in?',
            'هل تؤثر درجة خطورة محاولة تسجيل الدخول على ما يجب على المستخدم فعله لتسجيل الدخول؟'),
          hint: T('For example an extra verification step for an unusual location or device.',
            'مثل خطوة تحقق إضافية عند تسجيل الدخول من موقع أو جهاز غير معتاد.'),
          refs: [{ key: 'CSF', cite: 'PROTECT' }],
          remedy: T('Enable risk-based authentication so unusual sign-ins require an extra verification step.',
            'تفعيل المصادقة القائمة على المخاطر بحيث تتطلب عمليات الدخول غير المعتادة خطوة تحقق إضافية.')
        },
        {
          id: 'H4', type: 'yesno', weight: 1.0,
          text: T('Do access reviews use analytics to highlight excessive or unused permissions?',
            'هل تستخدم مراجعات الصلاحيات تحليلات لإبراز الصلاحيات الزائدة أو غير المستخدمة؟'),
          refs: [{ key: 'ISO27001', cite: 'A.5.18 access rights' }],
          remedy: T('Give access reviewers risk-ranked suggestions from analytics instead of raw permission lists.',
            'تزويد مراجعي الصلاحيات باقتراحات مرتبة حسب المخاطر من التحليلات بدلاً من قوائم الصلاحيات الخام.')
        }
      ]
    },

    {
      id: 'I', weight: 6,
      title: T('Data protection and leak prevention', 'حماية البيانات ومنع التسريب'),
      intro: T('Finding sensitive data, and noticing when it leaves.',
        'العثور على البيانات الحساسة وملاحظة خروجها.'),
      refs: [{ key: 'ISO27001', cite: 'A.5.12, A.8.12' }, { key: 'HEALTH', cite: 'Patient data protection' }],
      questions: [
        {
          id: 'I1', type: 'yesno', weight: 1.5,
          text: T('Do you use automated discovery to find where sensitive and patient data is stored?',
            'هل تستخدمون الاكتشاف الآلي لمعرفة أماكن تخزين البيانات الحساسة وبيانات المرضى؟'),
          refs: [{ key: 'CSF', cite: 'IDENTIFY' }],
          remedy: T('Run automated discovery and classification so you know where patient data actually lives, including in file shares.',
            'تشغيل الاكتشاف والتصنيف الآلي لمعرفة الأماكن الفعلية لبيانات المرضى، بما في ذلك مجلدات الملفات المشتركة.')
        },
        {
          id: 'I2', type: 'yesno', weight: 1.0,
          text: T('Does your data leak prevention analyse content intelligently, rather than only matching keywords?',
            'هل يحلل نظام منع تسرب البيانات لديكم المحتوى بذكاء بدلاً من مطابقة الكلمات المفتاحية فقط؟'),
          allowNA: true,
          refs: [{ key: 'ISO27001', cite: 'A.8.12 data leakage prevention' }],
          remedy: T('Move data leak prevention from keyword rules to content and context analysis to cut both misses and false alarms.',
            'الانتقال بمنع تسرب البيانات من قواعد الكلمات المفتاحية إلى تحليل المحتوى والسياق لتقليل الحالات الفائتة والإنذارات الكاذبة معاً.')
        },
        {
          id: 'I3', type: 'choice', weight: 1.0,
          text: T('Can you see and control staff use of public AI chatbots?',
            'هل يمكنكم رؤية استخدام الموظفين لروبوتات الدردشة العامة والتحكم فيه؟'),
          options: [
            { value: 'blind', score: 0, label: T('We cannot see it at all', 'لا يمكننا رؤيته إطلاقاً') },
            { value: 'aware', score: 1, label: T('We know it happens but cannot see the detail', 'نعلم أنه يحدث لكن لا نرى التفاصيل') },
            { value: 'visible', score: 3, label: T('It appears in our reporting', 'يظهر في تقاريرنا') },
            { value: 'restricted', score: 4, label: T('Visible, and restricted by policy and technology', 'مرئي ومقيَّد بالسياسة والتقنية') },
            { value: 'enterprise', score: 5, label: T('Only an approved service is allowed, and that is enforced', 'يُسمح بخدمة معتمدة فقط ويُفرض ذلك تقنياً') }
          ],
          refs: [{ key: 'GENAI', cite: 'Shadow AI' }, { key: 'OWASP', cite: 'LLM02:2025' }],
          remedy: T('Make use of public AI services visible in your monitoring, then steer staff to an approved enterprise service.',
            'جعل استخدام خدمات الذكاء الاصطناعي العامة مرئياً في المراقبة، ثم توجيه الموظفين إلى خدمة مؤسسية معتمدة.')
        },
        {
          id: 'I4', type: 'yesno', weight: 1.0,
          text: T('Are data leak alerts investigated with automatic context about the file, the user and the destination?',
            'هل تُحقَّق تنبيهات تسرب البيانات مع معلومات سياقية آلية عن الملف والمستخدم والوجهة؟'),
          allowNA: true,
          refs: [{ key: 'CSF', cite: 'RESPOND' }],
          remedy: T('Enrich data leak alerts automatically with file sensitivity, user role and destination reputation before triage.',
            'إثراء تنبيهات تسرب البيانات آلياً بحساسية الملف ودور المستخدم وسمعة الوجهة قبل الفرز.')
        }
      ]
    },

    {
      id: 'J', weight: 9,
      title: T('Governance, risk and compliance', 'الحوكمة وإدارة المخاطر والامتثال'),
      intro: T('Whether AI and automation are taking the manual effort out of controls, audits and risk work.',
        'هل يقلل الذكاء الاصطناعي والأتمتة الجهد اليدوي في الضوابط والتدقيق وأعمال المخاطر.'),
      refs: [{ key: 'ISO27001', cite: 'Clauses 6, 9' }, { key: 'CSF', cite: 'GOVERN' }, { key: 'ISO42001', cite: 'A.5' }],
      questions: [
        {
          id: 'J1', type: 'yesno', weight: 1.5,
          text: T('Do you use automation to collect evidence for audits and compliance checks?',
            'هل تستخدمون الأتمتة لجمع الأدلة الخاصة بالتدقيق وفحوص الامتثال؟'),
          hint: T('Rather than asking teams for screenshots each time.',
            'بدلاً من طلب لقطات شاشة من الفرق في كل مرة.'),
          refs: [{ key: 'ISO27001', cite: 'Clause 9' }],
          remedy: T('Automate evidence collection for the controls audited most often, so assurance stops depending on screenshots.',
            'أتمتة جمع الأدلة للضوابط الأكثر تدقيقاً حتى لا يعتمد التحقق على لقطات الشاشة.')
        },
        {
          id: 'J2', type: 'choice', weight: 1.5,
          text: T('How is it checked that your security controls are actually working?',
            'كيف يتم التحقق من أن ضوابطكم الأمنية تعمل فعلاً؟'),
          options: [
            { value: 'annual', score: 0, label: T('By hand, once a year', 'يدوياً مرة واحدة سنوياً') },
            { value: 'periodic', score: 1, label: T('By hand, more than once a year', 'يدوياً أكثر من مرة في السنة') },
            { value: 'partly', score: 3, label: T('Partly automated', 'مؤتمت جزئياً') },
            { value: 'mostly', score: 4, label: T('Mostly automated and continuous', 'مؤتمت في معظمه وبشكل مستمر') },
            { value: 'ai', score: 5, label: T('Continuous, with AI analysing the results', 'مستمر مع تحليل النتائج بالذكاء الاصطناعي') }
          ],
          refs: [{ key: 'ISO27001', cite: 'Clause 9.1' }, { key: 'CSF', cite: 'GOVERN' }],
          remedy: T('Move control testing from an annual manual exercise to continuous automated checks with exception reporting.',
            'نقل اختبار الضوابط من عملية يدوية سنوية إلى فحوص آلية مستمرة مع تقارير بالاستثناءات.')
        },
        {
          id: 'J3', type: 'yesno', weight: 1.0,
          text: T('Do you use AI to map your policies and controls to regulations and standards?',
            'هل تستخدمون الذكاء الاصطناعي لربط سياساتكم وضوابطكم باللوائح والمعايير؟'),
          refs: [{ key: 'ISO42001', cite: 'A.5' }, { key: 'GENAI', cite: 'Assistive use' }],
          remedy: T('Use AI-assisted mapping to keep the crosswalk between your controls and each regulation current.',
            'استخدام الربط بمساعدة الذكاء الاصطناعي للحفاظ على تحديث المطابقة بين ضوابطكم وكل لائحة.')
        },
        {
          id: 'J4', type: 'yesno', weight: 1.0,
          text: T('Do you use analytics to assess and monitor supplier and third-party risk?',
            'هل تستخدمون التحليلات لتقييم ومراقبة مخاطر الموردين والأطراف الثالثة؟'),
          refs: [{ key: 'ISO27001', cite: 'A.5.19 supplier relationships' }, { key: 'SECAI', cite: 'Supply chain' }],
          remedy: T('Monitor supplier risk continuously with external signals rather than relying on an annual questionnaire.',
            'مراقبة مخاطر الموردين باستمرار عبر مؤشرات خارجية بدلاً من الاعتماد على استبيان سنوي.')
        },
        {
          id: 'J5', type: 'yesno', weight: 1.0,
          text: T('Is cyber risk expressed in terms leadership can act on, such as financial or clinical impact?',
            'هل يُعبَّر عن المخاطر السيبرانية بصيغة يمكن للقيادة التصرف بناءً عليها، مثل الأثر المالي أو السريري؟'),
          refs: [{ key: 'CSF', cite: 'GOVERN' }, { key: 'ISO27001', cite: 'Clause 6.1' }],
          remedy: T('Quantify cyber risk in financial or clinical impact terms so leadership can compare it with other risks.',
            'تقدير المخاطر السيبرانية بدلالة الأثر المالي أو السريري لتتمكن القيادة من مقارنتها بالمخاطر الأخرى.')
        }
      ]
    },

    {
      id: 'K', weight: 8,
      title: T('Cyber resilience and recovery', 'الصمود السيبراني والتعافي'),
      intro: T('Whether you would keep running, and keep seeing, during a serious attack.',
        'هل ستبقون قادرين على العمل وعلى الرؤية أثناء هجوم خطير.'),
      refs: [{ key: 'CSF', cite: 'RECOVER' }, { key: 'HEALTH', cite: 'Clinical continuity' }],
      questions: [
        {
          id: 'K1', type: 'yesno', weight: 1.5,
          text: T('Do you use anomaly detection on backups to spot ransomware or tampering?',
            'هل تستخدمون كشف الشذوذ على النسخ الاحتياطية لرصد برامج الفدية أو العبث؟'),
          refs: [{ key: 'CSF', cite: 'PROTECT, RECOVER' }],
          remedy: T('Enable anomaly detection on backup data so encryption or deletion is caught before recovery is needed.',
            'تفعيل كشف الشذوذ على بيانات النسخ الاحتياطي لاكتشاف التشفير أو الحذف قبل الحاجة إلى التعافي.')
        },
        {
          id: 'K2', type: 'yesno', weight: 1.5,
          text: T('Are recovery plans for clinical systems tested, with the recovery time actually measured?',
            'هل تُختبر خطط التعافي للأنظمة السريرية مع قياس زمن التعافي فعلياً؟'),
          refs: [{ key: 'CSF', cite: 'RECOVER' }, { key: 'HEALTH', cite: 'Clinical downtime' }],
          remedy: T('Test recovery of the clinical systems that matter most and record the actual time taken, not the target.',
            'اختبار تعافي الأنظمة السريرية الأكثر أهمية وتسجيل الزمن الفعلي المستغرق وليس الزمن المستهدف.')
        },
        {
          id: 'K3', type: 'choice', weight: 1.0,
          text: T('How is AI used in your exercises and simulations?',
            'كيف يُستخدم الذكاء الاصطناعي في تمارينكم ومحاكاتكم؟'),
          options: [
            { value: 'none', score: 0, label: T('It is not used', 'لا يُستخدم') },
            { value: 'discussed', score: 1, label: T('Only discussed', 'يُناقش فقط') },
            { value: 'scenarios', score: 3, label: T('Used to build the scenarios', 'يُستخدم لبناء السيناريوهات') },
            { value: 'security', score: 4, label: T('Used in exercises with the security team', 'يُستخدم في تمارين مع فريق الأمن') },
            { value: 'clinical', score: 5, label: T('Used in full exercises including clinical teams', 'يُستخدم في تمارين كاملة تشمل الفرق السريرية') }
          ],
          refs: [{ key: 'HEALTH', cite: 'Exercises' }, { key: 'CSF', cite: 'RECOVER' }],
          remedy: T('Use AI to build realistic exercise scenarios, and run at least one exercise a year with clinical teams involved.',
            'استخدام الذكاء الاصطناعي لبناء سيناريوهات تمارين واقعية، وتنفيذ تمرين واحد سنوياً على الأقل بمشاركة الفرق السريرية.')
        },
        {
          id: 'K4', type: 'yesno', weight: 1.5,
          text: T('Could you still detect and respond if your AI security tools were unavailable?',
            'هل ستظلون قادرين على الكشف والاستجابة إذا توقفت أدوات الأمن المعتمدة على الذكاء الاصطناعي؟'),
          hint: T('A fallback that has been thought through, not assumed.',
            'خطة بديلة مدروسة، وليست مفترضة.'),
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }, { key: 'CSF', cite: 'RECOVER' }],
          remedy: T('Document and test how detection and response continue if the AI tooling is unavailable or untrusted.',
            'توثيق واختبار كيفية استمرار الكشف والاستجابة في حال تعطل أدوات الذكاء الاصطناعي أو فقدان الثقة بها.')
        }
      ]
    },

    {
      id: 'L', weight: 6,
      title: T('Assurance and skills', 'ضمان الاستخدام والمهارات'),
      intro: T('Whether the AI you rely on can be trusted, and whether your people can use it well.',
        'هل يمكن الوثوق بالذكاء الاصطناعي الذي تعتمدون عليه، وهل يجيد فريقكم استخدامه.'),
      refs: [{ key: 'AIRMF', cite: 'MEASURE, MANAGE' }, { key: 'OWASP', cite: 'LLM Top 10' }, { key: 'ATLAS', cite: 'Adversarial testing' }],
      questions: [
        {
          id: 'L1', type: 'yesno', weight: 1.5,
          text: T('Before trusting an AI security tool, do you check how it reaches its decisions and where its limits are?',
            'قبل الوثوق بأداة أمن تعتمد على الذكاء الاصطناعي، هل تتحققون من كيفية وصولها إلى قراراتها وأين تكمن حدودها؟'),
          refs: [{ key: 'AIRMF', cite: 'MEASURE' }, { key: 'SECAI', cite: 'Secure deployment' }, { key: 'AIACT', cite: 'Art. 15' }],
          remedy: T('Require evidence of how each AI security tool decides, and record its known limits before it is relied on.',
            'اشتراط أدلة على كيفية اتخاذ كل أداة ذكاء اصطناعي لقراراتها، وتوثيق حدودها المعروفة قبل الاعتماد عليها.')
        },
        {
          id: 'L2', type: 'yesno', weight: 1.5, allowNA: true,
          text: T('Are AI security assistants that accept text protected against manipulation such as hidden instructions?',
            'هل تُحمى مساعدات الأمن الذكية التي تقبل نصاً من التلاعب مثل التعليمات المخفية؟'),
          hint: T('Known as prompt injection: text hidden in a log, ticket or document that tells the AI to ignore its rules.',
            'يُعرف بحقن الأوامر: نص مخفي داخل سجل أو تذكرة أو مستند يوجّه الذكاء الاصطناعي لتجاهل قواعده.'),
          refs: [{ key: 'OWASP', cite: 'LLM01:2025 Prompt Injection' }, { key: 'ATLAS', cite: 'Prompt injection' }],
          remedy: T('Test AI assistants against prompt injection and filter untrusted content before it reaches them.',
            'اختبار المساعدات الذكية ضد حقن الأوامر وتصفية المحتوى غير الموثوق قبل وصوله إليها.')
        },
        {
          id: 'L3', type: 'choice', weight: 1.0,
          text: T('How much of the security team has been trained to use AI tools properly?',
            'ما نسبة فريق الأمن الذي دُرِّب على استخدام أدوات الذكاء الاصطناعي بشكل صحيح؟'),
          options: [
            { value: 'none', score: 0, label: T('Nobody', 'لا أحد') },
            { value: 'few', score: 1, label: T('A few people', 'عدد قليل') },
            { value: 'most', score: 3, label: T('Most of the team', 'معظم الفريق') },
            { value: 'all', score: 4, label: T('The whole team', 'الفريق بأكمله') },
            { value: 'refresh', score: 5, label: T('The whole team, with refresher training', 'الفريق بأكمله مع تدريب تنشيطي') }
          ],
          refs: [{ key: 'ISO42001', cite: 'A.4 competence' }, { key: 'SOCCMM', cite: 'People — training' }],
          remedy: T('Train the whole security team on the AI tooling they are expected to rely on, and refresh it yearly.',
            'تدريب فريق الأمن بأكمله على أدوات الذكاء الاصطناعي المتوقع اعتمادهم عليها، مع تحديث التدريب سنوياً.')
        },
        {
          id: 'L4', type: 'yesno', weight: 1.0,
          text: T('Are AI-driven security decisions recorded so they can be reviewed or challenged later?',
            'هل تُسجَّل القرارات الأمنية التي يتخذها الذكاء الاصطناعي بحيث يمكن مراجعتها أو الاعتراض عليها لاحقاً؟'),
          refs: [{ key: 'AIRMF', cite: 'MANAGE' }, { key: 'AIACT', cite: 'Art. 12 record-keeping' }],
          remedy: T('Log AI-driven security decisions with their inputs so they can be reviewed after an incident.',
            'تسجيل القرارات الأمنية المدفوعة بالذكاء الاصطناعي مع مدخلاتها لتمكين مراجعتها بعد الحوادث.')
        },
        {
          id: 'L5', type: 'yesno', weight: 1.0,
          text: T('Does staff awareness training cover AI-enabled attacks such as deepfake voice calls and AI-written phishing?',
            'هل يغطي تدريب التوعية للموظفين الهجمات المدعومة بالذكاء الاصطناعي مثل المكالمات المزيفة والتصيّد المكتوب بالذكاء الاصطناعي؟'),
          refs: [{ key: 'GENAI', cite: 'Synthetic media' }, { key: 'HEALTH', cite: 'HICP awareness' }],
          remedy: T('Add deepfake and AI-written phishing to awareness training, with a verification step for unusual requests.',
            'إضافة التزييف العميق والتصيّد المكتوب بالذكاء الاصطناعي إلى تدريب التوعية، مع خطوة تحقق للطلبات غير المعتادة.')
        }
      ]
    }
  ];

  /* ------------------------------------------------------------------ *
   * Respondent details
   * ------------------------------------------------------------------ */

  AIMA.respondentFields = [
    { id: 'contactName', required: true, label: T('Your name', 'الاسم') },
    { id: 'contactRole', required: true, label: T('Your job title', 'المسمى الوظيفي') },
    { id: 'contactEmail', required: true, type: 'email', label: T('Your work email', 'البريد الإلكتروني للعمل') },
    { id: 'contactPhone', required: false, label: T('Contact number', 'رقم التواصل') },
    { id: 'approverName', required: false, label: T('Name of the senior person who approved this return', 'اسم المسؤول الذي اعتمد هذا النموذج') }
  ];

  /* ------------------------------------------------------------------ *
   * Strings used by code rather than markup
   * ------------------------------------------------------------------ */

  AIMA.ui = {
    notAnswered: T('Not answered', 'لم تتم الإجابة'),
    notApplicable: T('Not applicable', 'لا ينطبق'),
    chooseAnswer: T('Choose an answer', 'اختر إجابة'),
    otherOrganisation: T('Other — not in this list', 'أخرى — غير مدرجة في القائمة'),
    chooseOrganisation: T('Choose your organisation', 'اختر مؤسستك'),
    notListed: T('Not sure / not listed', 'غير متأكد / غير مدرج'),
    preferNotToSay: T('Prefer not to say', 'أفضل عدم الإفصاح'),
    sectionComment: T('Anything else we should know about this section? (optional)',
      'هل هناك ما تودون إضافته عن هذا القسم؟ (اختياري)'),
    commentPlaceholder: T('Please do not include passwords, patient details or system addresses.',
      'يُرجى عدم تضمين كلمات المرور أو بيانات المرضى أو عناوين الأنظمة.'),
    back: T('Back', 'رجوع'),
    continue: T('Continue', 'متابعة'),
    allAnswered: T('All questions answered', 'تمت الإجابة على جميع الأسئلة'),
    ofQuestionsAnswered: T('questions answered', 'سؤال تمت الإجابة عليه'),
    of: T('of', 'من'),
    question: T('Question', 'سؤال'),
    answer: T('Answer', 'الإجابة'),
    number: T('No.', 'م'),
    organisationDetails: T('Organisation details', 'بيانات المؤسسة'),
    declaration: T('Declaration', 'الإقرار'),
    completedBy: T('Completed by', 'أُكمل بواسطة'),
    approvedBy: T('Approved by', 'اعتمده'),
    signature: T('Signature', 'التوقيع'),
    date: T('Date', 'التاريخ'),
    yourComments: T('Your comments', 'ملاحظاتكم'),
    savedAt: T('Saved', 'حُفظ'),
    organisation: T('Organisation', 'المؤسسة'),
    type: T('Type', 'النوع'),
    region: T('Region', 'المنطقة'),
    size: T('Approximate size', 'الحجم التقريبي'),
    cycle: T('Return cycle', 'دورة النموذج'),
    dateCompleted: T('Date completed', 'تاريخ الإكمال'),
    contactEmail: T('Contact email', 'البريد الإلكتروني'),
    contactPhone: T('Contact number', 'رقم التواصل'),
    notChosen: T('Organisation not chosen', 'لم يتم اختيار المؤسسة')
  };

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

  /* ------------------------------------------------------------------ *
   * Reading answers back
   * These live here, not in the rating engine, so the questionnaire can
   * render and print answers without shipping the scoring code at all.
   * ------------------------------------------------------------------ */

  var NONE = 'none';

  function isBlank(value) {
    return value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0);
  }

  function isAnswered(question, answer) {
    if (!answer) return false;
    if (question.type === 'number') {
      return answer.value !== '' && answer.value !== null && answer.value !== undefined && !isNaN(Number(answer.value));
    }
    return !isBlank(answer.value);
  }

  /** Which option values were chosen — language independent. */
  function answerKeys(question, answer) {
    if (!isAnswered(question, answer)) return [];
    if (question.type === 'multi') return answer.value.slice();
    if (question.type === 'number') return [];
    return [answer.value];
  }

  /** Plain-language rendering of an answer in one language. */
  function describeAnswer(question, answer, lang) {
    var language = lang || 'en';
    if (!isAnswered(question, answer)) return AIMA.t(AIMA.ui.notAnswered, language);
    var value = answer.value;

    if (question.type === 'multi') {
      if (value.indexOf(AIMA.NOT_APPLICABLE) !== -1) return AIMA.t(AIMA.ui.notApplicable, language);
      if (value.indexOf(NONE) !== -1) return AIMA.t(question.noneLabel, language);
      var labels = (question.options || [])
        .filter(function (o) { return value.indexOf(o.value) !== -1; })
        .map(function (o) { return AIMA.t(o.label, language); });
      return labels.length ? labels.join(' · ') : AIMA.t(AIMA.ui.notAnswered, language);
    }

    if (value === AIMA.NOT_APPLICABLE) return AIMA.t(AIMA.ui.notApplicable, language);

    if (question.type === 'yesno') {
      var yn = AIMA.yesNoOptions.filter(function (o) { return o.value === value; })[0];
      return yn ? AIMA.t(yn.label, language) : String(value);
    }

    if (question.type === 'choice') {
      var option = (question.options || []).filter(function (o) { return o.value === value; })[0];
      return option ? AIMA.t(option.label, language) : String(value);
    }

    if (question.type === 'number') {
      return String(value) + (question.unit ? ' ' + AIMA.t(question.unit, language) : '');
    }

    return String(value);
  }

  AIMA.answers = {
    NONE: NONE,
    isAnswered: isAnswered,
    answerKeys: answerKeys,
    describeAnswer: describeAnswer,
    describeAnswerBoth: function (question, answer) {
      return { en: describeAnswer(question, answer, 'en'), ar: describeAnswer(question, answer, 'ar') };
    }
  };

  AIMA.optionsFor = function (question) {
    var options;
    if (question.type === 'yesno') options = AIMA.yesNoOptions.slice();
    else if (question.type === 'choice' || question.type === 'multi') options = (question.options || []).slice();
    else options = [];
    if (question.allowNA) options = options.concat([AIMA.notApplicableOption]);
    return options;
  };

  AIMA.totalSectionWeight = AIMA.sections.reduce(function (sum, s) { return sum + s.weight; }, 0);
})(window.AIMA);
