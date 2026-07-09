import { contact, values } from "../data";
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

      <section className="section" style={{ paddingTop: "2.2rem" }}>
        <div className="container knowhow-grid">
          <Reveal>
            <div>
              <div className="section-head">
                <span className="eyebrow">{t(copy.aboutPage.storyTitle)}</span>
                <h2>{t(copy.home.aboutTitle)}</h2>
                <p>{t(copy.aboutPage.story)}</p>
              </div>
              <div className="section-head" style={{ marginTop: "1.8rem" }}>
                <span className="eyebrow">{t(copy.aboutPage.visionTitle)}</span>
                <h2 style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)" }}>
                  {t(copy.aboutPage.vision)}
                </h2>
              </div>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div
              style={{
                background: "var(--black)",
                color: "#fff",
                padding: "1.8rem 1.5rem",
                minHeight: "280px",
                display: "grid",
                alignContent: "end",
                gap: "0.7rem",
              }}
            >
              <span className="eyebrow">{t(copy.aboutPage.networkTitle)}</span>
              <h3 style={{ color: "#fff", fontSize: "1.8rem" }}>TGS</h3>
              <p style={{ color: "rgba(255,255,255,0.75)" }}>
                {t(copy.aboutPage.networkText)}
              </p>
              <a
                className="btn btn-primary"
                href={contact.global}
                target="_blank"
                rel="noreferrer"
                style={{ width: "fit-content", marginTop: "0.5rem" }}
              >
                tgs-global.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-muted">
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
          <div className="service-grid">
            {values.map((value, index) => (
              <Reveal key={value.title.en} delay={index * 60}>
                <article className="service-tile">
                  <div className="index">0{index + 1}</div>
                  <h3>{value.title[lang]}</h3>
                  <p>{value.text[lang]}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
