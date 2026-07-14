import { ClientMarquee } from "../components/ClientMarquee";
import { Reveal } from "../components/Reveal";
import { expertise, specialisations } from "../data";
import { useCopy, useI18n } from "../i18n";

export function ServicesPage() {
  const { lang, t } = useI18n();
  const copy = useCopy();
  const expertiseVisual = `${import.meta.env.BASE_URL}expertise-visuals.jpg`;
  const visualPositions = ["0% center", "33.333% center", "66.666% center", "100% center"];

  return (
    <>
      <section className="page-hero expertise-hero">
        <div className="container expertise-hero-grid">
          <Reveal>
            <div>
              <span className="hero-kicker">
                {lang === "en" ? "Clarity for every stage" : "وضوح في كل مرحلة"}
              </span>
              <h1>{t(copy.servicesPage.title)}</h1>
              <p>{t(copy.servicesPage.lead)}</p>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div
              className="expertise-hero-art"
              style={{ backgroundImage: `url(${expertiseVisual})` }}
              role="img"
              aria-label={lang === "en" ? "Illustrations of TGS Saudi professional services" : "رسومات توضيحية لخدمات تي جي إس السعودية"}
            />
          </Reveal>
        </div>
      </section>

      <ClientMarquee label={t(copy.home.trusted)} />

      <section className="section expertise-section" style={{ paddingTop: "3rem" }}>
        <div className="container">
          <Reveal>
            <div className="section-head expertise-intro">
              <div>
                <span className="section-eyebrow">
                  {lang === "en" ? "Core expertise" : "خبراتنا الأساسية"}
                </span>
                <h2>
                  {lang === "en"
                    ? "Professional insight, made practical."
                    : "خبرة مهنية تتحول إلى حلول عملية."}
                </h2>
              </div>
              <p>
                {lang === "en"
                  ? "Explore the services that help organisations report clearly, remain compliant and move forward with confidence."
                  : "اكتشف خدماتنا التي تساعد المنشآت على وضوح التقارير والامتثال والتقدم بثقة."}
              </p>
            </div>
          </Reveal>

          <div className="expertise-card-grid">
            {expertise.map((service, index) => (
              <Reveal key={service.id} delay={(index % 3) * 40}>
                <article className="expertise-image-card" id={service.id}>
                  <div
                    className="expertise-card-visual"
                    style={{
                      backgroundImage: `url(${expertiseVisual})`,
                      backgroundPosition: visualPositions[index],
                    }}
                    role="img"
                    aria-label={service.title[lang]}
                  >
                    <span className="expertise-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="expertise-card-content">
                    <div className="expertise-card-heading">
                      <h2>{service.title[lang]}</h2>
                      <span aria-hidden="true">↗</span>
                    </div>
                    <p>{service.summary[lang]}</p>
                    <ul>
                      {service.details[lang].map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="section-head specialisations-head">
              <div>
                <span className="section-eyebrow">
                  {lang === "en" ? "Kingdom-focused" : "خبرات محلية"}
                </span>
                <h2>{lang === "en" ? "Saudi specialisations" : "تخصصات سعودية"}</h2>
              </div>
              <p>
                {lang === "en"
                  ? "Specialist support shaped around the Kingdom’s regulatory and commercial environment."
                  : "دعم متخصص مصمم لبيئة المملكة التنظيمية والتجارية."}
              </p>
            </div>
          </Reveal>

          <div className="specialisation-grid">
            {specialisations.map((service, index) => (
              <Reveal key={service.id} delay={index * 40}>
                <article className="specialisation-card" id={service.id}>
                  <div className="specialisation-art" aria-hidden="true">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <i />
                    <i />
                    <i />
                  </div>
                  <div>
                    <h3>{service.title[lang]}</h3>
                    <p>{service.summary[lang]}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
