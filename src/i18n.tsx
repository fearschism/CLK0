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
    about: { en: "About", ar: "من نحن" },
    contact: { en: "Contact", ar: "تواصل" },
    talk: { en: "Talk to us", ar: "تحدث معنا" },
  },
  home: {
    kicker: { en: "Riyadh · TGS Global Network", ar: "الرياض · شبكة TGS العالمية" },
    brand: { en: "TGS Saudi", ar: "تي جي إس السعودية" },
    lead: {
      en: "Audit, zakat, tax, and advisory for organizations that need local fluency with international standards.",
      ar: "تدقيق وزكاة وضرائب واستشارات للمنشآت التي تحتاج خبرة محلية بمعايير دولية.",
    },
    ctaPrimary: { en: "Explore services", ar: "استكشف الخدمات" },
    ctaSecondary: { en: "Get in touch", ar: "تواصل معنا" },
    expertiseEyebrow: { en: "Expertise", ar: "خبراتنا" },
    expertiseTitle: {
      en: "Professional services shaped for the Kingdom.",
      ar: "خدمات مهنية مصممة لاحتياجات المملكة.",
    },
    expertiseLead: {
      en: "From statutory audit to local content and off-plan advisory, TGS Saudi helps leadership teams stay compliant, clear, and ready to grow.",
      ar: "من التدقيق النظامي إلى المحتوى المحلي والبيع على الخارطة، تساعد تي جي إس السعودية فرق القيادة على الامتثال والوضوح والنمو.",
    },
    viewAll: { en: "View all services", ar: "عرض كل الخدمات" },
    aboutEyebrow: { en: "About", ar: "من نحن" },
    aboutTitle: {
      en: "Think Global Sustainability.",
      ar: "فكر عالميًا باستدامة.",
    },
    aboutLead: {
      en: "We are part of TGS, a dynamic global business network of independent firms providing accounting, audit, tax, business advisory, and commercial legal services.",
      ar: "نحن جزء من TGS، شبكة أعمال عالمية ديناميكية من مكاتب مستقلة تقدم خدمات المحاسبة والتدقيق والضرائب والاستشارات الإدارية والخدمات القانونية التجارية.",
    },
    panelLabel: { en: "Adviser of choice", ar: "المستشار المفضل" },
    panelText: {
      en: "for middle-market leaders navigating Saudi and cross-border complexity.",
      ar: "لقادة السوق المتوسط في تعقيدات السوق السعودي والعابر للحدود.",
    },
    learnMore: { en: "Learn about TGS Saudi", ar: "تعرف على تي جي إس السعودية" },
    statsEyebrow: { en: "At a glance", ar: "لمحة سريعة" },
    statsTitle: {
      en: "Local presence. Global network.",
      ar: "حضور محلي. شبكة عالمية.",
    },
    ctaTitle: {
      en: "Ready for clearer financial counsel?",
      ar: "هل أنت مستعد لمشورة مالية أوضح؟",
    },
    ctaButton: { en: "Contact the team", ar: "تواصل مع الفريق" },
  },
  servicesPage: {
    title: { en: "Our services", ar: "خدماتنا" },
    lead: {
      en: "A focused suite of audit, zakat, tax, advisory, and specialized Saudi engagements — delivered with international discipline.",
      ar: "مجموعة مركزة من خدمات التدقيق والزكاة والضرائب والاستشارات والخدمات المتخصصة في السعودية — بمنهجية دولية.",
    },
  },
  aboutPage: {
    title: { en: "About TGS Saudi", ar: "عن تي جي إس السعودية" },
    lead: {
      en: "A Riyadh-based professional services firm helping organizations operate with confidence across compliance, reporting, and growth decisions.",
      ar: "مكتب خدمات مهنية في الرياض يساعد المنشآت على العمل بثقة عبر الامتثال والتقارير وقرارات النمو.",
    },
    storyTitle: { en: "Who we are", ar: "من نحن" },
    story: {
      en: "TGS Saudi provides accounting, audit, tax, business advisory, and related professional services as an independent member of the TGS global network. Our work is grounded in integrity, local regulatory fluency, and practical counsel for middle-market leaders.",
      ar: "تقدم تي جي إس السعودية خدمات المحاسبة والتدقيق والضرائب والاستشارات الإدارية والخدمات المهنية ذات الصلة كعضو مستقل في شبكة TGS العالمية. عملنا قائم على النزاهة والإلمام التنظيمي المحلي والمشورة العملية لقادة السوق المتوسط.",
    },
    visionTitle: { en: "Vision", ar: "الرؤية" },
    vision: {
      en: "To be the adviser of choice to middle-market leaders globally.",
      ar: "أن نكون المستشار المفضل لقادة السوق المتوسط عالميًا.",
    },
    valuesTitle: { en: "Values", ar: "قيمنا" },
  },
  contactPage: {
    title: { en: "Contact", ar: "تواصل" },
    lead: {
      en: "Tell us what you need — audit, zakat, tax, advisory, or a specialized engagement. We’ll respond with the right next step.",
      ar: "أخبرنا بما تحتاجه — تدقيق أو زكاة أو ضريبة أو استشارات أو خدمة متخصصة. سنرد بالخطوة التالية المناسبة.",
    },
    email: { en: "Email", ar: "البريد" },
    phone: { en: "Phone", ar: "الهاتف" },
    office: { en: "Office", ar: "المكتب" },
    name: { en: "Full name", ar: "الاسم الكامل" },
    company: { en: "Company", ar: "الشركة" },
    service: { en: "Service interest", ar: "الخدمة المطلوبة" },
    message: { en: "How can we help?", ar: "كيف يمكننا المساعدة؟" },
    send: { en: "Send message", ar: "إرسال الرسالة" },
    note: {
      en: "This demo form opens your email client with a prefilled message to info@tgs-saudi.com.",
      ar: "هذا النموذج التجريبي يفتح بريدك برسالة جاهزة إلى info@tgs-saudi.com.",
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
    founded: { en: "Founded", ar: "تأسست" },
    network: { en: "Global network", ar: "شبكة عالمية" },
    focus: { en: "Client focus", ar: "تركيز العملاء" },
    bilingual: { en: "Languages", ar: "اللغات" },
  },
} as const;

export type Copy = typeof copy;

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
