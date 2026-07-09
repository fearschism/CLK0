import { Link } from "react-router-dom";
import { services, values } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

export function HomePage() {
  const { t, lang } = useI18n();
  const copy = useCopy();
  const featured = services.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-kicker">{t(copy.home.kicker)}</span>
          <h1>
            {t(copy.home.brand)}
            <br />
            <em>Think Global Sustainability</em>
          </h1>
          <p className="hero-lead">{t(copy.home.lead)}</p>
          <div className="hero-actions">
            <Link className="btn btn-light" to="/services">
              {t(copy.home.ctaPrimary)}
            </Link>
            <Link className="btn btn-secondary" to="/contact" style={{ color: "var(--sand)", borderColor: "rgba(232,220,200,0.35)" }}>
              {t(copy.home.ctaSecondary)}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.expertiseEyebrow)}</span>
              <h2>{t(copy.home.expertiseTitle)}</h2>
              <p>{t(copy.home.expertiseLead)}</p>
            </div>
          </Reveal>

          <div className="service-grid">
            {featured.map((service, index) => (
              <Reveal key={service.id} delay={index * 60}>
                <article className="service-item">
                  <div className="index">0{index + 1}</div>
                  <h3>{service.title[lang]}</h3>
                  <p>{service.summary[lang]}</p>
                  <Link className="link" to={`/services#${service.id}`}>
                    {t(copy.common.readMore)} →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Link className="btn btn-primary" to="/services">
              {t(copy.home.viewAll)}
            </Link>
          </div>
        </div>
      </section>

      <section className="section band-sand">
        <div className="container split">
          <Reveal>
            <div className="panel">
              <div className="panel-copy">
                <strong>{t(copy.home.panelLabel)}</strong>
                <p>{t(copy.home.panelText)}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <div className="section-head">
                <span className="eyebrow">{t(copy.home.aboutEyebrow)}</span>
                <h2>{t(copy.home.aboutTitle)}</h2>
                <p>{t(copy.home.aboutLead)}</p>
              </div>
              <div className="values">
                {values.slice(0, 3).map((value) => (
                  <div className="value-row" key={value.title.en}>
                    <h3>{value.title[lang]}</h3>
                    <p>{value.text[lang]}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <Link className="btn btn-secondary" to="/about">
                  {t(copy.home.learnMore)}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-dark">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.statsEyebrow)}</span>
              <h2>{t(copy.home.statsTitle)}</h2>
            </div>
          </Reveal>
          <div className="stats">
            <Reveal>
              <div className="stat">
                <strong>2012</strong>
                <span>{t(copy.common.founded)}</span>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="stat">
                <strong>44+</strong>
                <span>{t(copy.common.network)}</span>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="stat">
                <strong>SME</strong>
                <span>{t(copy.common.focus)}</span>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="stat">
                <strong>EN / AR</strong>
                <span>{t(copy.common.bilingual)}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta">
              <h2>{t(copy.home.ctaTitle)}</h2>
              <Link className="btn btn-primary" to="/contact">
                {t(copy.home.ctaButton)}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
