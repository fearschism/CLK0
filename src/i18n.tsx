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
};

const I18nContext = createContext<I18nContextValue | null>(null);

const copy = {
  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    about: { en: "About Us", ar: "من نحن" },
    expertise: { en: "Expertise", ar: "الخبرات" },
    clients: { en: "Clients", ar: "العملاء" },
    insights: { en: "Insights", ar: "رؤى" },
    contact: { en: "Contact", ar: "تواصل" },
    talk: { en: "Contact us", ar: "تواصل معنا" },
  },
  home: {
    kicker: { en: "Think Global Sustainability", ar: "فكر عالميًا باستدامة" },
    title: { en: "TGS Saudi Arabia", ar: "تي جي إس السعودية" },
    lead: {
      en: "Integrated advisory, audit, legal and tax services for organisations building and growing across Saudi Arabia and the GCC.",
      ar: "خدمات استشارية وتدقيق وقانونية وضريبية متكاملة للمنشآت التي تبني وتنمو عبر السعودية ودول الخليج.",
    },
    ctaPrimary: { en: "Get to know us", ar: "تعرّف علينا" },
    ctaSecondary: { en: "How we can help", ar: "كيف نساعدك" },
    trusted: { en: "Trusted by organisations across the Kingdom", ar: "موثوقون من منشآت في أنحاء المملكة" },
    pillarsTitle: { en: "How we support you", ar: "كيف ندعمك" },
    expertiseTitle: { en: "Our expertise", ar: "خبراتنا" },
    viewAll: { en: "View all services", ar: "عرض كل الخدمات" },
    aboutTitle: { en: "About us", ar: "من نحن" },
    aboutLead: {
      en: "TGS Saudi Arabia is an independent member of TGS Global — a dynamic international network providing accounting, audit, tax, business advisory and commercial legal services.",
      ar: "تي جي إس السعودية عضو مستقل في شبكة TGS العالمية — شبكة دولية ديناميكية تقدم خدمات المحاسبة والتدقيق والضرائب والاستشارات الإدارية والخدمات القانونية التجارية.",
    },
    networkCta: { en: "Access TGS Network", ar: "الوصول إلى شبكة TGS" },
    networkTitle: { en: "The TGS Global network", ar: "شبكة TGS العالمية" },
    insightsTitle: { en: "Insights", ar: "رؤى" },
    viewInsights: { en: "View all insights", ar: "عرض كل الرؤى" },
    readMore: { en: "Read more", ar: "اقرأ المزيد" },
  },
  servicesPage: {
    title: { en: "Our expertise", ar: "خبراتنا" },
    lead: {
      en: "Professional services delivered in Saudi Arabia with local regulatory fluency and international standards.",
      ar: "خدمات مهنية تُقدَّم في السعودية بإلمام تنظيمي محلي ومعايير دولية.",
    },
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
    title: { en: "About TGS Saudi Arabia", ar: "عن تي جي إس السعودية" },
    lead: {
      en: "A Riyadh-based professional services firm and independent member of the TGS Global network.",
      ar: "مكتب خدمات مهنية في الرياض وعضو مستقل في شبكة TGS العالمية.",
    },
    storyTitle: { en: "Who we are", ar: "من نحن" },
    story: {
      en: "We help middle-market leaders and international groups operate with confidence across compliance, reporting and growth decisions in the Kingdom.",
      ar: "نساعد قادة السوق المتوسط والمجموعات الدولية على العمل بثقة عبر الامتثال والتقارير وقرارات النمو في المملكة.",
    },
    visionTitle: { en: "Vision", ar: "الرؤية" },
    vision: {
      en: "To be the adviser of choice to middle-market leaders — in Saudi Arabia and through the TGS network globally.",
      ar: "أن نكون المستشار المفضل لقادة السوق المتوسط — في السعودية وعبر شبكة TGS عالميًا.",
    },
    valuesTitle: { en: "Values", ar: "قيمنا" },
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
    information: { en: "Information", ar: "معلومات" },
    expertise: { en: "Expertise", ar: "الخبرات" },
    contact: { en: "Contact", ar: "تواصل" },
    conversation: {
      en: "Let’s start a conversation",
      ar: "لنبدأ محادثة",
    },
    rights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
    privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
    terms: { en: "Terms of Use", ar: "شروط الاستخدام" },
    cookies: { en: "Cookie Policy", ar: "سياسة ملفات الارتباط" },
  },
  common: {
    members: { en: "Members", ar: "أعضاء" },
    countries: { en: "Countries", ar: "دول" },
    hubs: { en: "Hubs", ar: "مراكز" },
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
