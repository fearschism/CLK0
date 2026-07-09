import { values } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

export function AboutPage() {
  const { lang, t } = useI18n();
  const copy = useCopy();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1>{t(copy.aboutPage.title)}</h1>
            <p>{t(copy.aboutPage.lead)}</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="container split">
          <Reveal>
            <div>
              <div className="section-head">
                <span className="eyebrow">{t(copy.aboutPage.storyTitle)}</span>
                <h2>{t(copy.home.aboutTitle)}</h2>
                <p>{t(copy.aboutPage.story)}</p>
              </div>
              <div className="section-head" style={{ marginTop: "2rem" }}>
                <span className="eyebrow">{t(copy.aboutPage.visionTitle)}</span>
                <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                  {t(copy.aboutPage.vision)}
                </h2>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="panel">
              <div className="panel-copy">
                <strong>TGS</strong>
                <p>
                  {lang === "en"
                    ? "Independent member firm · Accounting, audit, tax, advisory & commercial legal network"
                    : "مكتب عضو مستقل · شبكة محاسبة وتدقيق وضرائب واستشارات وخدمات قانونية تجارية"}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-sand">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.aboutPage.valuesTitle)}</span>
              <h2>
                {lang === "en"
                  ? "How we work with clients."
                  : "كيف نعمل مع عملائنا."}
              </h2>
            </div>
          </Reveal>
          <div className="values">
            {values.map((value, index) => (
              <Reveal key={value.title.en} delay={index * 70}>
                <div className="value-row">
                  <h3>{value.title[lang]}</h3>
                  <p>{value.text[lang]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
