import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "./data";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: <T extends { en: string; ar: string }>(value: T) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextValue | null>(null);

const copy = {
  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    services: { en: "Services", ar: "الخدمات" },
    clients: { en: "Clients", ar: "العملاء" },
    about: { en: "About", ar: "من نحن" },
    contact: { en: "Contact", ar: "تواصل" },
    talk: { en: "How can we help", ar: "كيف نساعدك" },
  },
  home: {
    orange: { en: "TGS Saudi · Middle East", ar: "تي جي إس السعودية · الشرق الأوسط" },
    title: { en: "Think Global", ar: "فكر عالميًا" },
    titleAccent: { en: "Sustainability", ar: "باستدامة" },
    lead: {
      en: "The Saudi member firm of TGS Global — advisory, audit, zakat, tax and accounting for organisations growing in the Kingdom and beyond.",
      ar: "المكتب السعودي في شبكة TGS العالمية — استشارات وتدقيق وزكاة وضرائب ومحاسبة للمنشآت النامية في المملكة وخارجها.",
    },
    ctaPrimary: { en: "Our expertise", ar: "خبراتنا" },
    ctaSecondary: { en: "Meet our clients", ar: "تعرّف على عملائنا" },
    memberNote: {
      en: "Independent member of",
      ar: "عضو مستقل في",
    },
    activitiesEyebrow: { en: "Our activities", ar: "أنشطتنا" },
    activitiesTitle: {
      en: "Local answers. Global network.",
      ar: "إجابات محلية. شبكة عالمية.",
    },
    activitiesLead: {
      en: "TGS Saudi supports local and international growth with quality-assured professional services. We help middle-market leaders make Saudi and cross-border complexity feel secure and attainable.",
      ar: "تدعم تي جي إس السعودية النمو المحلي والدولي بخدمات مهنية مضمونة الجودة. نساعد قادة السوق المتوسط على التعامل مع تعقيد السوق السعودي والعابر للحدود بثقة.",
    },
    knowhowEyebrow: { en: "Know-how", ar: "المعرفة" },
    expertiseLabel: { en: "Expertise", ar: "الخبرات" },
    specialLabel: { en: "Saudi specialisations", ar: "تخصصات سعودية" },
    regionsLabel: { en: "Region", ar: "المنطقة" },
    regionValue: { en: "Middle East · Saudi Arabia", ar: "الشرق الأوسط · المملكة العربية السعودية" },
    servicesEyebrow: { en: "Expertise", ar: "الخبرات" },
    servicesTitle: {
      en: "Professional services for the Kingdom.",
      ar: "خدمات مهنية للمملكة.",
    },
    servicesLead: {
      en: "Audit, accounting, advisory, tax and zakat — plus Saudi specialisations such as local content and off-plan advisory.",
      ar: "تدقيق ومحاسبة واستشارات وضرائب وزكاة — إضافة إلى تخصصات سعودية مثل المحتوى المحلي والبيع على الخارطة.",
    },
    viewAll: { en: "Show all our expertise", ar: "عرض كل خبراتنا" },
    clientsEyebrow: { en: "Clients", ar: "العملاء" },
    clientsTitle: {
      en: "Trusted by organisations across the Kingdom.",
      ar: "موثوقون من منشآت في أنحاء المملكة.",
    },
    clientsLead: {
      en: "From family businesses to international subsidiaries — a sample of the sectors we serve.",
      ar: "من الأعمال العائلية إلى الشركات التابعة الدولية — عينة من القطاعات التي نخدمها.",
    },
    viewClients: { en: "View clients", ar: "عرض العملاء" },
    statsEyebrow: { en: "Network strength", ar: "قوة الشبكة" },
    statsTitle: {
      en: "A top international network — with a Saudi home.",
      ar: "شبكة دولية رائدة — بموطن سعودي.",
    },
    aboutEyebrow: { en: "About", ar: "من نحن" },
    aboutTitle: {
      en: "Part of TGS Global. Rooted in Saudi Arabia.",
      ar: "جزء من TGS العالمية. متجذرون في السعودية.",
    },
    aboutLead: {
      en: "We are part of TGS, a dynamic global business network of independent firms providing accounting, audit, tax, business advisory and commercial legal services.",
      ar: "نحن جزء من TGS، شبكة أعمال عالمية ديناميكية من مكاتب مستقلة تقدم خدمات المحاسبة والتدقيق والضرائب والاستشارات الإدارية والخدمات القانونية التجارية.",
    },
    learnMore: { en: "Get to know us", ar: "تعرّف علينا" },
    ctaTitle: {
      en: "Ready for clearer counsel in Saudi Arabia?",
      ar: "هل أنت مستعد لمشورة أوضح في السعودية؟",
    },
    ctaButton: { en: "Contact the team", ar: "تواصل مع الفريق" },
  },
  servicesPage: {
    title: { en: "Our expertise", ar: "خبراتنا" },
    lead: {
      en: "The TGS service lines — delivered in Saudi Arabia with local regulatory fluency and international standards.",
      ar: "خطوط خدمات TGS — تُقدَّم في السعودية بإلمام تنظيمي محلي ومعايير دولية.",
    },
    expertise: { en: "Core expertise", ar: "الخبرات الأساسية" },
    special: { en: "Saudi specialisations", ar: "التخصصات السعودية" },
  },
  clientsPage: {
    title: { en: "Our clients", ar: "عملاؤنا" },
    lead: {
      en: "Organisations we support across audit, zakat, tax, advisory and specialised Saudi engagements.",
      ar: "منشآت ندعمها عبر التدقيق والزكاة والضرائب والاستشارات والخدمات السعودية المتخصصة.",
    },
    filterAll: { en: "All sectors", ar: "كل القطاعات" },
    note: {
      en: "Client names shown are representative portfolio examples for this website demo. Replace with approved client logos and names before production launch.",
      ar: "أسماء العملاء المعروضة أمثلة تمثيلية لهذا الموقع التجريبي. استبدلها بشعارات وأسماء معتمدة قبل الإطلاق النهائي.",
    },
  },
  aboutPage: {
    title: { en: "About TGS Saudi", ar: "عن تي جي إس السعودية" },
    lead: {
      en: "A Riyadh-based professional services firm and independent member of the TGS Global network.",
      ar: "مكتب خدمات مهنية في الرياض وعضو مستقل في شبكة TGS العالمية.",
    },
    storyTitle: { en: "Who we are", ar: "من نحن" },
    story: {
      en: "TGS Saudi provides accounting, audit, tax, zakat, business advisory and related professional services. Our client base is mainly small to medium-sized privately owned enterprises, alongside larger companies and international subsidiaries operating in the Kingdom.",
      ar: "تقدم تي جي إس السعودية خدمات المحاسبة والتدقيق والضرائب والزكاة والاستشارات الإدارية والخدمات المهنية ذات الصلة. قاعدة عملائنا أساسًا منشآت خاصة صغيرة ومتوسطة، إلى جانب شركات أكبر وشركات تابعة دولية تعمل في المملكة.",
    },
    visionTitle: { en: "Vision", ar: "الرؤية" },
    vision: {
      en: "To be the adviser of choice to middle-market leaders — in Saudi Arabia and through the TGS network globally.",
      ar: "أن نكون المستشار المفضل لقادة السوق المتوسط — في السعودية وعبر شبكة TGS عالميًا.",
    },
    valuesTitle: { en: "Values", ar: "قيمنا" },
    networkTitle: { en: "TGS Global", ar: "TGS العالمية" },
    networkText: {
      en: "TGS means Think Global Sustainability. The network operates with members across dozens of countries, supporting clients with a one-stop shop for advisory, audit, tax, legal and accounting services.",
      ar: "TGS تعني فكر عالميًا باستدامة. تعمل الشبكة بأعضاء في عشرات الدول، وتدعم العملاء بنقطة اتصال واحدة لخدمات الاستشارات والتدقيق والضرائب والقانون والمحاسبة.",
    },
  },
  contactPage: {
    title: { en: "Contact", ar: "تواصل" },
    lead: {
      en: "Tell us what you need — audit, zakat, tax, advisory, or a specialised Saudi engagement.",
      ar: "أخبرنا بما تحتاجه — تدقيق أو زكاة أو ضريبة أو استشارات أو خدمة سعودية متخصصة.",
    },
    email: { en: "Email", ar: "البريد" },
    phone: { en: "Phone", ar: "الهاتف" },
    office: { en: "Office", ar: "المكتب" },
    network: { en: "Global network", ar: "الشبكة العالمية" },
    name: { en: "Full name", ar: "الاسم الكامل" },
    company: { en: "Company", ar: "الشركة" },
    service: { en: "Service interest", ar: "الخدمة المطلوبة" },
    message: { en: "How can we help?", ar: "كيف يمكننا المساعدة؟" },
    send: { en: "Send message", ar: "إرسال الرسالة" },
    note: {
      en: "This form opens your email client with a prefilled message to info@tgs-saudi.com.",
      ar: "يفتح هذا النموذج بريدك برسالة جاهزة إلى info@tgs-saudi.com.",
    },
    success: {
      en: "Your email draft is ready. Send it whenever you’re set.",
      ar: "مسودة بريدك جاهزة. أرسلها متى شئت.",
    },
    select: { en: "Select a service", ar: "اختر خدمة" },
  },
  footer: {
    tagline: {
      en: "Think Global Sustainability",
      ar: "فكر عالميًا باستدامة",
    },
    rights: {
      en: "All rights reserved.",
      ar: "جميع الحقوق محفوظة.",
    },
  },
  common: {
    readMore: { en: "Read more", ar: "اقرأ المزيد" },
    members: { en: "Network members", ar: "أعضاء الشبكة" },
    countries: { en: "Countries", ar: "دول" },
    hubs: { en: "Hubs", ar: "مراكز" },
    saudi: { en: "Saudi focus", ar: "تركيز سعودي" },
  },
} as const;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.classList.toggle("rtl", lang === "ar");
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === "en" ? "ar" : "en")),
      t: (item) => item[lang],
      dir: lang === "ar" ? "rtl" : "ltr",
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useCopy() {
  return copy;
}
