export type Lang = "en" | "ar";

export type Service = {
  id: string;
  title: { en: string; ar: string };
  summary: { en: string; ar: string };
  details: { en: string[]; ar: string[] };
  icon: "audit" | "accounting" | "advisory" | "tax" | "legal" | "digital";
};

export type Client = {
  id: string;
  name: { en: string; ar: string };
  sector: { en: string; ar: string };
  location: { en: string; ar: string };
  focus: { en: string; ar: string };
  initials: string;
  logoColor: string;
};

export type Insight = {
  id: string;
  date: { en: string; ar: string };
  category: { en: string; ar: string };
  title: { en: string; ar: string };
  image: string;
};

export const pillars = [
  {
    id: "establish",
    title: { en: "Establish", ar: "التأسيس" },
    text: {
      en: "Set up and structure your business in Saudi Arabia with confidence — from company formation to compliance readiness.",
      ar: "أسّس وهيكل أعمالك في السعودية بثقة — من تأسيس الشركة إلى جاهزية الامتثال.",
    },
    icon: "establish" as const,
  },
  {
    id: "grow",
    title: { en: "Grow", ar: "النمو" },
    text: {
      en: "Scale with clear strategy, financial insight, and advisory support tailored to middle-market ambitions.",
      ar: "توسّع باستراتيجية واضحة ورؤية مالية ودعم استشاري يناسب طموحات السوق المتوسط.",
    },
    icon: "grow" as const,
  },
  {
    id: "transform",
    title: { en: "Transform", ar: "التحول" },
    text: {
      en: "Modernise operations, controls, and digital finance so your organisation stays resilient and future-ready.",
      ar: "حدّث العمليات والرقابة والمالية الرقمية لتبقى منظمتك مرنة وجاهزة للمستقبل.",
    },
    icon: "transform" as const,
  },
];

export const expertise: Service[] = [
  {
    id: "audit",
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
    icon: "audit",
  },
  {
    id: "accounting",
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
    icon: "accounting",
  },
  {
    id: "advisory",
    title: { en: "Advisory", ar: "الاستشارات" },
    summary: {
      en: "Business advisory for leaders navigating growth, governance, and complexity in the Kingdom.",
      ar: "استشارات أعمال للقادة في النمو والحوكمة والتعقيد داخل المملكة.",
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
    icon: "advisory",
  },
  {
    id: "tax",
    title: { en: "Tax & Zakat", ar: "الضرائب والزكاة" },
    summary: {
      en: "Corporate tax, VAT, and zakat guidance aligned with ZATCA requirements.",
      ar: "ضريبة الشركات وضريبة القيمة المضافة والزكاة وفق متطلبات هيئة الزكاة والضريبة والجمارك.",
    },
    details: {
      en: [
        "Corporate income tax and VAT advisory",
        "Zakat computation and filing support",
        "Cross-border tax considerations",
      ],
      ar: [
        "استشارات ضريبة الدخل وضريبة القيمة المضافة",
        "احتساب الزكاة ودعم الإقرارات",
        "اعتبارات ضريبية عابرة للحدود",
      ],
    },
    icon: "tax",
  },
  {
    id: "legal",
    title: { en: "Legal", ar: "القانونية" },
    summary: {
      en: "Commercial legal support through the TGS network for contracts, structuring, and compliance.",
      ar: "دعم قانوني تجاري عبر شبكة TGS للعقود والهيكلة والامتثال.",
    },
    details: {
      en: [
        "Commercial contracts and corporate matters",
        "Structuring support for local and cross-border work",
        "Coordination with TGS legal member firms",
      ],
      ar: [
        "العقود التجارية والشؤون المؤسسية",
        "دعم الهيكلة للعمل المحلي والعابر للحدود",
        "التنسيق مع مكاتب TGS القانونية الأعضاء",
      ],
    },
    icon: "legal",
  },
  {
    id: "digital",
    title: { en: "Digital & IT", ar: "الرقمنة وتقنية المعلومات" },
    summary: {
      en: "Technology-minded support to modernise finance operations and reporting reliability.",
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
    icon: "digital",
  },
];

export const specialisations = [
  {
    id: "local-content",
    title: { en: "Local Content Audit", ar: "تدقيق المحتوى المحلي" },
    summary: {
      en: "Verification and advisory around local content commitments in Saudi procurement.",
      ar: "تحقق واستشارات حول التزامات المحتوى المحلي في المشتريات السعودية.",
    },
  },
  {
    id: "off-plan",
    title: { en: "Off-plan Sale & Rental", ar: "البيع والإيجار على الخارطة" },
    summary: {
      en: "Specialist guidance for off-plan real estate frameworks in the Kingdom.",
      ar: "إرشاد متخصص لأطر البيع والإيجار على الخارطة في المملكة.",
    },
  },
  {
    id: "risk",
    title: { en: "Internal Audit & Risk", ar: "التدقيق الداخلي والمخاطر" },
    summary: {
      en: "Internal audit and risk management that strengthens controls without slowing the business.",
      ar: "تدقيق داخلي وإدارة مخاطر تعزز الرقابة دون إبطاء الأعمال.",
    },
  },
];

export const services = expertise;

export const clients: Client[] = [
  {
    id: "c1",
    name: { en: "Najd Industrial", ar: "نجد الصناعية" },
    sector: { en: "Manufacturing", ar: "التصنيع" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Audit · Zakat · Advisory", ar: "تدقيق · زكاة · استشارات" },
    initials: "NI",
    logoColor: "#F58025",
  },
  {
    id: "c2",
    name: { en: "Eastern Trading", ar: "الشرقية للتجارة" },
    sector: { en: "Trading", ar: "التجارة" },
    location: { en: "Dammam", ar: "الدمام" },
    focus: { en: "Tax · Accounting · VAT", ar: "ضرائب · محاسبة · ضريبة القيمة المضافة" },
    initials: "ET",
    logoColor: "#353535",
  },
  {
    id: "c3",
    name: { en: "Sahara Realty", ar: "الصحراء العقارية" },
    sector: { en: "Real Estate", ar: "العقارات" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Off-plan · Audit", ar: "على الخارطة · تدقيق" },
    initials: "SR",
    logoColor: "#1B6B93",
  },
  {
    id: "c4",
    name: { en: "Gulf Contracting", ar: "الخليج للمقاولات" },
    sector: { en: "Construction", ar: "المقاولات" },
    location: { en: "Al Khobar", ar: "الخبر" },
    focus: { en: "Local Content · Audit", ar: "محتوى محلي · تدقيق" },
    initials: "GC",
    logoColor: "#2F6B55",
  },
  {
    id: "c5",
    name: { en: "Nordic Tech Arabia", ar: "نورديك تك" },
    sector: { en: "Technology", ar: "التقنية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "International · Tax · Audit", ar: "دولي · ضرائب · تدقيق" },
    initials: "NT",
    logoColor: "#5B4B8A",
  },
  {
    id: "c6",
    name: { en: "Al Waha Family Office", ar: "مكتب الواحة" },
    sector: { en: "Family Business", ar: "أعمال عائلية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Corporate Finance · Advisory", ar: "تمويل مؤسسي · استشارات" },
    initials: "AW",
    logoColor: "#B08A4A",
  },
  {
    id: "c7",
    name: { en: "Peninsula Logistics", ar: "شبه الجزيرة للوجستيات" },
    sector: { en: "Logistics", ar: "الخدمات اللوجستية" },
    location: { en: "Jeddah", ar: "جدة" },
    focus: { en: "Accounting · Tax", ar: "محاسبة · ضرائب" },
    initials: "PL",
    logoColor: "#0E4D6B",
  },
  {
    id: "c8",
    name: { en: "Horizon Healthcare", ar: "آفاق الصحية" },
    sector: { en: "Healthcare", ar: "الرعاية الصحية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Audit · Risk · Advisory", ar: "تدقيق · مخاطر · استشارات" },
    initials: "HH",
    logoColor: "#C45C26",
  },
  {
    id: "c9",
    name: { en: "Atlas Korea KSA", ar: "أطلس كوريا" },
    sector: { en: "International Trade", ar: "التجارة الدولية" },
    location: { en: "Dammam", ar: "الدمام" },
    focus: { en: "Cross-border Tax · Audit", ar: "ضرائب عابرة للحدود · تدقيق" },
    initials: "AK",
    logoColor: "#8B1E3F",
  },
  {
    id: "c10",
    name: { en: "Vision Energy", ar: "رؤية للطاقة" },
    sector: { en: "Energy Services", ar: "خدمات الطاقة" },
    location: { en: "Eastern Province", ar: "المنطقة الشرقية" },
    focus: { en: "Local Content · Audit", ar: "محتوى محلي · تدقيق" },
    initials: "VE",
    logoColor: "#1F4E3D",
  },
  {
    id: "c11",
    name: { en: "Cedar Professional", ar: "الأرز المهنية" },
    sector: { en: "Professional Services", ar: "الخدمات المهنية" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "Accounting · Tax · Advisory", ar: "محاسبة · ضرائب · استشارات" },
    initials: "CP",
    logoColor: "#4A5568",
  },
  {
    id: "c12",
    name: { en: "British Retail SA", ar: "التجزئة البريطانية" },
    sector: { en: "Retail", ar: "التجزئة" },
    location: { en: "Riyadh", ar: "الرياض" },
    focus: { en: "VAT · Audit · Reporting", ar: "ضريبة القيمة المضافة · تدقيق · تقارير" },
    initials: "BR",
    logoColor: "#9B2C2C",
  },
];

export const insights: Insight[] = [
  {
    id: "i1",
    date: { en: "May 20, 2024", ar: "20 مايو 2024" },
    category: { en: "Tax", ar: "الضرائب" },
    title: {
      en: "ZATCA updates: What businesses need to know in 2024",
      ar: "تحديثات هيئة الزكاة والضريبة والجمارك: ما تحتاج الشركات معرفته في 2024",
    },
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "i2",
    date: { en: "Apr 8, 2024", ar: "8 أبريل 2024" },
    category: { en: "Advisory", ar: "الاستشارات" },
    title: {
      en: "Local content readiness for Saudi procurement programmes",
      ar: "جاهزية المحتوى المحلي لبرامج المشتريات السعودية",
    },
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "i3",
    date: { en: "Mar 12, 2024", ar: "12 مارس 2024" },
    category: { en: "Audit", ar: "التدقيق" },
    title: {
      en: "How middle-market leaders can prepare for stronger assurance",
      ar: "كيف يستعد قادة السوق المتوسط لضمان أقوى",
    },
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
  },
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
      en: "Agile, practical counsel for leaders who need usable answers.",
      ar: "مشورة عملية وسريعة للقادة ممن يحتاجون إجابات قابلة للتنفيذ.",
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
    en: "Kingdom Tower area · Al Sahafah Dist, Riyadh 13321, Saudi Arabia",
    ar: "منطقة برج المملكة · حي الصحافة، الرياض 13321، المملكة العربية السعودية",
  },
  linkedin: "https://sa.linkedin.com/company/tgs-saudi-arabia",
  global: "https://tgs-global.com/",
};
