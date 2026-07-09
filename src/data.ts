export type Lang = "en" | "ar";

export type Service = {
  id: string;
  category: "expertise" | "specialisation";
  title: { en: string; ar: string };
  summary: { en: string; ar: string };
  details: { en: string[]; ar: string[] };
};

export type Client = {
  id: string;
  name: { en: string; ar: string };
  sector: { en: string; ar: string };
  location: { en: string; ar: string };
  focus: { en: string; ar: string };
  initials: string;
};

export const expertise: Service[] = [
  {
    id: "audit",
    category: "expertise",
    title: { en: "Audit", ar: "التدقيق" },
    summary: {
      en: "Independent financial audit and assurance for Saudi and cross-border reporting needs.",
      ar: "تدقيق مالي وضمان مستقل لاحتياجات التقارير السعودية والعابرة للحدود.",
    },
    details: {
      en: [
        "Statutory and financial statement audits",
        "Assurance for stakeholders and regulators",
        "Quality-aligned engagements for international groups",
      ],
      ar: [
        "تدقيق القوائم المالية والنظامية",
        "خدمات ضمان لأصحاب المصلحة والجهات التنظيمية",
        "ارتباطات متوافقة مع الجودة للمجموعات الدولية",
      ],
    },
  },
  {
    id: "accounting",
    category: "expertise",
    title: { en: "Accounting", ar: "المحاسبة" },
    summary: {
      en: "Practical accounting support that keeps books clean, decision-ready, and audit-friendly.",
      ar: "دعم محاسبي عملي يحافظ على سجلات دقيقة وجاهزة للقرار والتدقيق.",
    },
    details: {
      en: [
        "Bookkeeping and financial reporting",
        "Month-end close and management packs",
        "Process support for growing finance teams",
      ],
      ar: [
        "مسك الدفاتر والتقارير المالية",
        "إقفال شهري وحزم إدارية",
        "دعم العمليات لفرق المالية النامية",
      ],
    },
  },
  {
    id: "advisory",
    category: "expertise",
    title: { en: "Advisory", ar: "الاستشارات" },
    summary: {
      en: "Business advisory for middle-market leaders navigating growth, governance, and complexity.",
      ar: "استشارات أعمال لقادة السوق المتوسط في النمو والحوكمة والتعقيد.",
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
    id: "tax",
    category: "expertise",
    title: { en: "Tax", ar: "الضرائب" },
    summary: {
      en: "Corporate tax, VAT, and compliance guidance for domestic operators and international groups.",
      ar: "ضريبة الشركات وضريبة القيمة المضافة والامتثال للمنشآت المحلية والمجموعات الدولية.",
    },
    details: {
      en: [
        "Corporate income tax and VAT advisory",
        "Compliance calendars and return support",
        "Cross-border tax considerations",
      ],
      ar: [
        "استشارات ضريبة الدخل وضريبة القيمة المضافة",
        "جداول الامتثال ودعم الإقرارات",
        "اعتبارات ضريبية عابرة للحدود",
      ],
    },
  },
  {
    id: "zakat",
    category: "expertise",
    title: { en: "Zakat", ar: "الزكاة" },
    summary: {
      en: "KSA-focused zakat computation, filing support, and advisory aligned with ZATCA requirements.",
      ar: "احتساب الزكاة وتقديم الإقرارات والاستشارات وفق متطلبات هيئة الزكاة والضريبة والجمارك.",
    },
    details: {
      en: [
        "Zakat base assessment and compliance reviews",
        "Filing support and documentation readiness",
        "Advisory for mixed ownership structures",
      ],
      ar: [
        "تقييم وعاء الزكاة ومراجعات الامتثال",
        "دعم تقديم الإقرارات وتجهيز المستندات",
        "استشارات لهياكل الملكية المختلطة",
      ],
    },
  },
];

export const specialisations: Service[] = [
  {
    id: "local-content",
    category: "specialisation",
    title: { en: "Local Content Audit", ar: "تدقيق المحتوى المحلي" },
    summary: {
      en: "Verification and advisory around local content commitments in Saudi procurement.",
      ar: "تحقق واستشارات حول التزامات المحتوى المحلي في المشتريات السعودية.",
    },
    details: {
      en: [
        "Local content measurement and evidence review",
        "Audit support for procurement programs",
        "Recommendations to strengthen in-Kingdom value",
      ],
      ar: [
        "قياس المحتوى المحلي ومراجعة الأدلة",
        "دعم التدقيق لبرامج المشتريات",
        "توصيات لتعزيز القيمة داخل المملكة",
      ],
    },
  },
  {
    id: "off-plan",
    category: "specialisation",
    title: { en: "Off-plan Sale & Rental", ar: "البيع والإيجار على الخارطة" },
    summary: {
      en: "Specialist guidance for off-plan real estate frameworks in the Kingdom.",
      ar: "إرشاد متخصص لأطر البيع والإيجار على الخارطة في المملكة.",
    },
    details: {
      en: [
        "Regulatory and commercial readiness reviews",
        "Process and documentation advisory",
        "Support for developers and stakeholders",
      ],
      ar: [
        "مراجعات الجاهزية التنظيمية والتجارية",
        "استشارات الإجراءات والمستندات",
        "دعم المطورين وأصحاب المصلحة",
      ],
    },
  },
  {
    id: "corporate-finance",
    category: "specialisation",
    title: { en: "Corporate Finance", ar: "التمويل المؤسسي" },
    summary: {
      en: "Finance advisory that helps leadership evaluate capital, structure, and options.",
      ar: "استشارات تمويل تساعد القيادة على تقييم رأس المال والهيكل والخيارات.",
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
    category: "specialisation",
    title: { en: "Internal Audit & Risk", ar: "التدقيق الداخلي والمخاطر" },
    summary: {
      en: "Internal audit and risk management that strengthens controls without slowing the business.",
      ar: "تدقيق داخلي وإدارة مخاطر تعزز الرقابة دون إبطاء الأعمال.",
    },
    details: {
      en: [
        "Internal audit planning and execution",
        "Control design and remediation",
        "Risk assessment for leadership teams",
      ],
      ar: [
        "تخطيط وتنفيذ التدقيق الداخلي",
        "تصميم الضوابط ومعالجة الفجوات",
        "تقييم المخاطر لفرق القيادة",
      ],
    },
  },
  {
    id: "it",
    category: "specialisation",
    title: { en: "IT Systems & Solutions", ar: "أنظمة وتقنيات المعلومات" },
    summary: {
      en: "Technology-minded support to modernize finance operations and reporting reliability.",
      ar: "دعم تقني لتحديث عمليات المالية وموثوقية التقارير.",
    },
    details: {
      en: [
        "Systems and process improvement",
        "Reporting and data integrity support",
        "Digital enablement for finance teams",
      ],
      ar: [
        "تحسين الأنظمة والعمليات",
        "دعم التقارير وسلامة البيانات",
        "تمكين رقمي لفرق المالية",
      ],
    },
  },
];

export const services = [...expertise, ...specialisations];

/** Representative client portfolio for display. Replace with approved logos/names anytime. */
export const clients: Client[] = [
  {
    id: "c1",
    name: { en: "Najd Industrial Holding", ar: "نجد الصناعية القابضة" },
    sector: { en: "Manufacturing", ar: "التصنيع" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Audit · Zakat · Advisory", ar: "تدقيق · زكاة · استشارات" },
    initials: "NI",
  },
  {
    id: "c2",
    name: { en: "Eastern Trading Company", ar: "شركة الشرقية للتجارة" },
    sector: { en: "Trading", ar: "التجارة" },
    location: { en: "Dammam", ar: "الدمام" },
    focus: { en: "Tax · Accounting · VAT", ar: "ضرائب · محاسبة · ضريبة القيمة المضافة" },
    initials: "ET",
  },
  {
    id: "c3",
    name: { en: "Sahara Real Estate Group", ar: "مجموعة الصحراء العقارية" },
    sector: { en: "Real Estate", ar: "العقارات" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Off-plan · Audit · Advisory", ar: "على الخارطة · تدقيق · استشارات" },
    initials: "SR",
  },
  {
    id: "c4",
    name: { en: "Gulf Contracting Partners", ar: "شركاء الخليج للمقاولات" },
    sector: { en: "Construction", ar: "المقاولات" },
    location: { en: "Al Khobar", ar: "الخبر" },
    focus: { en: "Local Content · Audit · Risk", ar: "محتوى محلي · تدقيق · مخاطر" },
    initials: "GC",
  },
  {
    id: "c5",
    name: { en: "Nordic Tech Arabia", ar: "نورديك تك العربية" },
    sector: { en: "Technology", ar: "التقنية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "International subsidiary · Tax · Audit", ar: "شركة تابعة دولية · ضرائب · تدقيق" },
    initials: "NT",
  },
  {
    id: "c6",
    name: { en: "Al Waha Family Office", ar: "مكتب الواحة العائلي" },
    sector: { en: "Family Business", ar: "أعمال عائلية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Corporate Finance · Advisory · Zakat", ar: "تمويل مؤسسي · استشارات · زكاة" },
    initials: "AW",
  },
  {
    id: "c7",
    name: { en: "Peninsula Logistics", ar: "شبه الجزيرة للخدمات اللوجستية" },
    sector: { en: "Logistics", ar: "الخدمات اللوجستية" },
    location: { en: "Jeddah", ar: "جدة" },
    focus: { en: "Accounting · Tax · Internal Audit", ar: "محاسبة · ضرائب · تدقيق داخلي" },
    initials: "PL",
  },
  {
    id: "c8",
    name: { en: "Horizon Healthcare Services", ar: "آفاق للخدمات الصحية" },
    sector: { en: "Healthcare", ar: "الرعاية الصحية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Audit · Risk · Advisory", ar: "تدقيق · مخاطر · استشارات" },
    initials: "HH",
  },
  {
    id: "c9",
    name: { en: "Atlas Korea Trading KSA", ar: "أطلس كوريا للتجارة" },
    sector: { en: "International Trade", ar: "التجارة الدولية" },
    location: { en: "Dammam", ar: "الدمام" },
    focus: { en: "Cross-border Tax · Audit · Accounting", ar: "ضرائب عابرة للحدود · تدقيق · محاسبة" },
    initials: "AK",
  },
  {
    id: "c10",
    name: { en: "Vision Energy Services", ar: "رؤية لخدمات الطاقة" },
    sector: { en: "Energy Services", ar: "خدمات الطاقة" },
    location: { en: "Eastern Province", ar: "المنطقة الشرقية" },
    focus: { en: "Local Content · Audit · Corporate Finance", ar: "محتوى محلي · تدقيق · تمويل مؤسسي" },
    initials: "VE",
  },
  {
    id: "c11",
    name: { en: "Cedar Professional Group", ar: "مجموعة الأرز المهنية" },
    sector: { en: "Professional Services", ar: "الخدمات المهنية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Accounting · Tax · Advisory", ar: "محاسبة · ضرائب · استشارات" },
    initials: "CP",
  },
  {
    id: "c12",
    name: { en: "British Retail Ventures SA", ar: "المشاريع البريطانية للتجزئة" },
    sector: { en: "Retail", ar: "التجزئة" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "VAT · Audit · International reporting", ar: "ضريبة القيمة المضافة · تدقيق · تقارير دولية" },
    initials: "BR",
  },
];

export const clientSectors = [
  { en: "All", ar: "الكل" },
  { en: "Manufacturing", ar: "التصنيع" },
  { en: "Trading", ar: "التجارة" },
  { en: "Real Estate", ar: "العقارات" },
  { en: "Construction", ar: "المقاولات" },
  { en: "Technology", ar: "التقنية" },
  { en: "Family Business", ar: "أعمال عائلية" },
  { en: "Logistics", ar: "الخدمات اللوجستية" },
  { en: "Healthcare", ar: "الرعاية الصحية" },
  { en: "International Trade", ar: "التجارة الدولية" },
  { en: "Energy Services", ar: "خدمات الطاقة" },
  { en: "Professional Services", ar: "الخدمات المهنية" },
  { en: "Retail", ar: "التجزئة" },
];

export const values = [
  {
    title: { en: "Integrity", ar: "النزاهة" },
    text: {
      en: "Transparent, accountable relationships with clients and colleagues.",
      ar: "علاقات شفافة ومسؤولة مع العملاء والزملاء.",
    },
  },
  {
    title: { en: "Local depth", ar: "عمق محلي" },
    text: {
      en: "Saudi regulatory fluency with international professional standards.",
      ar: "إلمام عميق بالأنظمة السعودية مع المعايير المهنية الدولية.",
    },
  },
  {
    title: { en: "Entrepreneurial spirit", ar: "روح ريادية" },
    text: {
      en: "Agile, practical counsel for middle-market leaders who need usable answers.",
      ar: "مشورة عملية وسريعة لقادة السوق المتوسط ممن يحتاجون إجابات قابلة للتنفيذ.",
    },
  },
  {
    title: { en: "Global network", ar: "شبكة عالمية" },
    text: {
      en: "Independent member of TGS — accounting, audit, tax, advisory, and commercial legal.",
      ar: "عضو مستقل في TGS — محاسبة وتدقيق وضرائب واستشارات وخدمات قانونية تجارية.",
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
  global: "https://tgs-global.com/",
};
