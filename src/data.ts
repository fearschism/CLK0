export type Lang = "en" | "ar";

export type Service = {
  id: string;
  title: { en: string; ar: string };
  summary: { en: string; ar: string };
  details: { en: string[]; ar: string[] };
};

export const services: Service[] = [
  {
    id: "audit",
    title: { en: "Audit & Assurance", ar: "التدقيق والضمان" },
    summary: {
      en: "Independent financial audit and assurance grounded in international standards and local regulatory expectations.",
      ar: "تدقيق مالي وضمان مستقل وفق المعايير الدولية والمتطلبات التنظيمية المحلية.",
    },
    details: {
      en: [
        "Statutory and financial statement audits",
        "Assurance engagements for stakeholders and regulators",
        "PCAOB-aware quality discipline for cross-border needs",
      ],
      ar: [
        "عمليات تدقيق القوائم المالية والنظامية",
        "خدمات ضمان لأصحاب المصلحة والجهات التنظيمية",
        "انضباط جودة يراعي متطلبات PCAOB للاحتياجات العابرة للحدود",
      ],
    },
  },
  {
    id: "zakat",
    title: { en: "Zakat", ar: "الزكاة" },
    summary: {
      en: "KSA-focused zakat computation, filing support, and advisory aligned with ZATCA requirements.",
      ar: "احتساب الزكاة وتقديم الإقرارات والاستشارات وفق متطلبات هيئة الزكاة والضريبة والجمارك.",
    },
    details: {
      en: [
        "Zakat base assessment and compliance reviews",
        "Filing support and documentation readiness",
        "Advisory for mixed ownership and complex structures",
      ],
      ar: [
        "تقييم وعاء الزكاة ومراجعات الامتثال",
        "دعم تقديم الإقرارات وتجهيز المستندات",
        "استشارات لهياكل الملكية المختلطة والمعقدة",
      ],
    },
  },
  {
    id: "tax",
    title: { en: "Tax Services", ar: "الخدمات الضريبية" },
    summary: {
      en: "Corporate tax, VAT, and compliance guidance for domestic operators and international groups.",
      ar: "ضريبة الشركات وضريبة القيمة المضافة والامتثال للمنشآت المحلية والمجموعات الدولية.",
    },
    details: {
      en: [
        "Corporate income tax and VAT advisory",
        "Compliance calendars and return support",
        "Cross-border tax considerations for expanding businesses",
      ],
      ar: [
        "استشارات ضريبة الدخل وضريبة القيمة المضافة",
        "جداول الامتثال ودعم الإقرارات",
        "اعتبارات ضريبية عابرة للحدود للأعمال المتوسعة",
      ],
    },
  },
  {
    id: "accounting",
    title: { en: "Accounting Services", ar: "الخدمات المحاسبية" },
    summary: {
      en: "Practical accounting support that keeps books clean, decision-ready, and audit-friendly.",
      ar: "دعم محاسبي عملي يحافظ على سجلات دقيقة وجاهزة للقرار والتدقيق.",
    },
    details: {
      en: [
        "Bookkeeping and financial reporting support",
        "Month-end close and management packs",
        "Process hygiene for growing finance teams",
      ],
      ar: [
        "مسك الدفاتر ودعم التقارير المالية",
        "إقفال شهري وحزم إدارية",
        "تحسين العمليات لفرق المالية النامية",
      ],
    },
  },
  {
    id: "advisory",
    title: { en: "Business Advisory", ar: "الاستشارات الإدارية" },
    summary: {
      en: "Clear-eyed advisory for middle-market leaders navigating growth, governance, and complexity.",
      ar: "استشارات عملية لقادة السوق المتوسط في النمو والحوكمة والتعقيد.",
    },
    details: {
      en: [
        "Growth and operating model advice",
        "Governance and control improvements",
        "Transaction and restructuring support",
      ],
      ar: [
        "استشارات النمو ونماذج التشغيل",
        "تحسين الحوكمة والرقابة",
        "دعم الصفقات وإعادة الهيكلة",
      ],
    },
  },
  {
    id: "local-content",
    title: { en: "Local Content Audit", ar: "تدقيق المحتوى المحلي" },
    summary: {
      en: "Verification and advisory around local content commitments that matter in Saudi procurement.",
      ar: "تحقق واستشارات حول التزامات المحتوى المحلي المؤثرة في المشتريات السعودية.",
    },
    details: {
      en: [
        "Local content measurement and evidence review",
        "Audit support for procurement and supplier programs",
        "Practical recommendations to strengthen in-Kingdom value",
      ],
      ar: [
        "قياس المحتوى المحلي ومراجعة الأدلة",
        "دعم التدقيق لبرامج المشتريات والموردين",
        "توصيات عملية لتعزيز القيمة داخل المملكة",
      ],
    },
  },
  {
    id: "off-plan",
    title: { en: "Off-plan Sale & Rental", ar: "البيع والإيجار على الخارطة" },
    summary: {
      en: "Specialist guidance for off-plan real estate sale and rental frameworks in the Kingdom.",
      ar: "إرشاد متخصص لأطر البيع والإيجار على الخارطة في المملكة.",
    },
    details: {
      en: [
        "Regulatory and commercial readiness reviews",
        "Process and documentation advisory",
        "Support for developers and related stakeholders",
      ],
      ar: [
        "مراجعات الجاهزية التنظيمية والتجارية",
        "استشارات الإجراءات والمستندات",
        "دعم المطورين وأصحاب المصلحة ذوي الصلة",
      ],
    },
  },
  {
    id: "corporate-finance",
    title: { en: "Corporate Finance", ar: "التمويل المؤسسي" },
    summary: {
      en: "Finance advisory that helps leadership evaluate capital, structure, and strategic options.",
      ar: "استشارات تمويل تساعد القيادة على تقييم رأس المال والهيكل والخيارات الاستراتيجية.",
    },
    details: {
      en: [
        "Capital and funding discussions",
        "Financial due diligence support",
        "Scenario analysis for strategic decisions",
      ],
      ar: [
        "نقاشات رأس المال والتمويل",
        "دعم العناية المالية الواجبة",
        "تحليل سيناريوهات للقرارات الاستراتيجية",
      ],
    },
  },
  {
    id: "risk",
    title: { en: "Internal Audit & Risk", ar: "التدقيق الداخلي والمخاطر" },
    summary: {
      en: "Internal audit and risk management that strengthens controls without slowing the business.",
      ar: "تدقيق داخلي وإدارة مخاطر تعزز الرقابة دون إبطاء الأعمال.",
    },
    details: {
      en: [
        "Internal audit planning and execution",
        "Control design and remediation support",
        "Risk assessment for leadership teams",
      ],
      ar: [
        "تخطيط وتنفيذ التدقيق الداخلي",
        "دعم تصميم الضوابط ومعالجة الفجوات",
        "تقييم المخاطر لفرق القيادة",
      ],
    },
  },
  {
    id: "it",
    title: { en: "IT Systems & Solutions", ar: "أنظمة وتقنيات المعلومات" },
    summary: {
      en: "Technology-minded support to modernize finance operations and reporting reliability.",
      ar: "دعم تقني لتحديث عمليات المالية وموثوقية التقارير.",
    },
    details: {
      en: [
        "Systems and process improvement guidance",
        "Reporting and data integrity support",
        "Practical digital enablement for finance teams",
      ],
      ar: [
        "إرشاد تحسين الأنظمة والعمليات",
        "دعم التقارير وسلامة البيانات",
        "تمكين رقمي عملي لفرق المالية",
      ],
    },
  },
];

export const values = [
  {
    title: { en: "Integrity", ar: "النزاهة" },
    text: {
      en: "We act with clarity and accountability — with clients and with each other.",
      ar: "نعمل بوضوح ومساءلة — مع عملائنا ومع بعضنا البعض.",
    },
  },
  {
    title: { en: "Local depth", ar: "عمق محلي" },
    text: {
      en: "Saudi regulatory fluency paired with international professional standards.",
      ar: "إلمام عميق بالأنظمة السعودية مع الالتزام بالمعايير المهنية الدولية.",
    },
  },
  {
    title: { en: "Client focus", ar: "تركيز على العميل" },
    text: {
      en: "Practical advice for middle-market leaders who need decisive, usable counsel.",
      ar: "نصائح عملية لقادة السوق المتوسط ممن يحتاجون مشورة حاسمة وقابلة للتنفيذ.",
    },
  },
  {
    title: { en: "Global reach", ar: "انتشار عالمي" },
    text: {
      en: "Independent member of the TGS network — accounting, audit, tax, advisory, and commercial legal.",
      ar: "عضو مستقل في شبكة TGS — محاسبة وتدقيق وضرائب واستشارات وخدمات قانونية تجارية.",
    },
  },
];

export const contact = {
  email: "info@tgs-saudi.com",
  phone: "+966 920 007 832",
  phoneHref: "tel:+966920007832",
  address: {
    en: "Al Imam Saud Bin Faysal Road, Al Sahafah Dist, Riyadh 13321, Saudi Arabia",
    ar: "طريق الإمام سعود بن فيصل، حي الصحافة، الرياض 13321، المملكة العربية السعودية",
  },
  linkedin: "https://sa.linkedin.com/company/tgs-saudi-arabia",
  website: "https://tgs-saudi.com",
};
