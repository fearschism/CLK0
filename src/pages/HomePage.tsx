import { Link } from "react-router-dom";
import { clients, contact, expertise, specialisations } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

export function HomePage() {
  const { t, lang } = useI18n();
  const copy = useCopy();
  const featured = [...expertise.slice(0, 3), ...specialisations.slice(0, 3)];
  const previewClients = clients.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-orange">{t(copy.home.orange)}</span>
          <h1>
            {t(copy.home.title)}
            <br />
            <span>{t(copy.home.titleAccent)}</span>
          </h1>
          <p className="hero-lead">{t(copy.home.lead)}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/services">
              {t(copy.home.ctaPrimary)}
            </Link>
            <Link className="btn btn-secondary" to="/clients">
              {t(copy.home.ctaSecondary)}
            </Link>
          </div>
        </div>
      </section>

      <div className="member-bar">
        <div className="container">
          {t(copy.home.memberNote)}{" "}
          <a href={contact.global} target="_blank" rel="noreferrer">
            <strong>TGS Global</strong>
          </a>{" "}
          — Think Global Sustainability
        </div>
      </div>

      <section className="section">
        <div className="container knowhow-grid">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.activitiesEyebrow)}</span>
              <h2>{t(copy.home.activitiesTitle)}</h2>
              <p>{t(copy.home.activitiesLead)}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="eyebrow">{t(copy.home.knowhowEyebrow)}</span>
              <h3 style={{ margin: "0.6rem 0 1rem", fontSize: "1.35rem" }}>
                {t(copy.home.expertiseLabel)}
              </h3>
              <div className="pill-row" style={{ marginBottom: "1.4rem" }}>
                {expertise.map((item) => (
                  <Link key={item.id} className="pill" to={`/services#${item.id}`}>
                    {item.title[lang]}
                  </Link>
                ))}
              </div>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.35rem" }}>
                {t(copy.home.specialLabel)}
              </h3>
              <div className="pill-row" style={{ marginBottom: "1.4rem" }}>
                {specialisations.map((item) => (
                  <Link key={item.id} className="pill accent" to={`/services#${item.id}`}>
                    {item.title[lang]}
                  </Link>
                ))}
              </div>
              <h3 style={{ margin: "0 0 0.7rem", fontSize: "1.35rem" }}>
                {t(copy.home.regionsLabel)}
              </h3>
              <div className="pill-row">
                <span className="pill">{t(copy.home.regionValue)}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-muted">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.servicesEyebrow)}</span>
              <h2>{t(copy.home.servicesTitle)}</h2>
              <p>{t(copy.home.servicesLead)}</p>
            </div>
          </Reveal>
          <div className="service-grid">
            {featured.map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <article className="service-tile">
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
          <div style={{ marginTop: "1.8rem" }}>
            <Link className="btn btn-dark" to="/services">
              {t(copy.home.viewAll)}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.clientsEyebrow)}</span>
              <h2>{t(copy.home.clientsTitle)}</h2>
              <p>{t(copy.home.clientsLead)}</p>
            </div>
          </Reveal>
          <div className="client-grid">
            {previewClients.map((client, index) => (
              <Reveal key={client.id} delay={index * 40}>
                <article className="client-card">
                  <div className="client-logo">{client.initials}</div>
                  <h3>{client.name[lang]}</h3>
                  <div className="client-meta">
                    <span className="tag">{client.sector[lang]}</span>
                    <span className="tag">{client.location[lang]}</span>
                  </div>
                  <p>{client.focus[lang]}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: "1.8rem" }}>
            <Link className="btn btn-primary" to="/clients">
              {t(copy.home.viewClients)}
            </Link>
          </div>
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
                <strong>66</strong>
                <span>{t(copy.common.members)}</span>
              </div>
            </Reveal>
            <Reveal delay={70}>
              <div className="stat">
                <strong>58</strong>
                <span>{t(copy.common.countries)}</span>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="stat">
                <strong>266</strong>
                <span>{t(copy.common.hubs)}</span>
              </div>
            </Reveal>
            <Reveal delay={210}>
              <div className="stat">
                <strong>KSA</strong>
                <span>{t(copy.common.saudi)}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">{t(copy.home.aboutEyebrow)}</span>
              <h2>{t(copy.home.aboutTitle)}</h2>
              <p>{t(copy.home.aboutLead)}</p>
            </div>
            <Link className="btn btn-outline" to="/about">
              {t(copy.home.learnMore)}
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="cta" style={{ marginTop: "3rem" }}>
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
