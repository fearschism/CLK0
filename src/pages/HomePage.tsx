import { Link } from "react-router-dom";
import { ClientMarquee } from "../components/ClientMarquee";
import { HeroDots } from "../components/HeroDots";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { contact, expertise, insights, pillars } from "../data";
import { useCopy, useI18n } from "../i18n";

export function HomePage() {
  const { t, lang } = useI18n();
  const copy = useCopy();

  return (
    <>
      <section className="hero">
        <HeroDots />
        <div className="container hero-grid">
          <div>
            <span className="hero-kicker">{t(copy.home.kicker)}</span>
            <h1>{t(copy.home.title)}</h1>
            <p className="hero-lead">{t(copy.home.lead)}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/about">
                {t(copy.home.ctaPrimary)}
              </Link>
              <Link className="btn btn-outline" to="/services">
                {t(copy.home.ctaSecondary)}
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-blob soft" />
            <div className="hero-blob" />
            <div className="hero-photo" />
          </div>
        </div>
      </section>

      <ClientMarquee label={t(copy.home.trusted)} />

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2>{t(copy.home.pillarsTitle)}</h2>
            </div>
          </Reveal>
          <div className="pillar-grid">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.id} delay={index * 70}>
                <article className="pillar-card">
                  <div className="icon-bubble">
                    <Icon name={pillar.icon} />
                  </div>
                  <h3>{pillar.title[lang]}</h3>
                  <p>{pillar.text[lang]}</p>
                  <Link className="link-arrow" to="/services">
                    →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section band-muted">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2>{t(copy.home.expertiseTitle)}</h2>
              <Link className="link-arrow" to="/services">
                {t(copy.home.viewAll)} →
              </Link>
            </div>
          </Reveal>
          <div className="expertise-marquee">
            <div className="expertise-track">
              {[...expertise, ...expertise].map((service, index) => (
                <article className="expertise-card" key={`${service.id}-${index}`}>
                  <div className="icon-outline">
                    <Icon name={service.icon} />
                  </div>
                  <h3>{service.title[lang]}</h3>
                  <p>{service.summary[lang]}</p>
                  <Link className="link-arrow" to={`/services#${service.id}`}>
                    {t(copy.home.readMore)} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <Reveal>
            <div>
              <div className="section-head" style={{ display: "block" }}>
                <h2>{t(copy.home.aboutTitle)}</h2>
                <p>{t(copy.home.aboutLead)}</p>
              </div>
              <a
                className="btn btn-primary"
                href={contact.global}
                target="_blank"
                rel="noreferrer"
              >
                {t(copy.home.networkCta)}
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="network-panel">
              <h3>{t(copy.home.networkTitle)}</h3>
              <div className="network-stats">
                <div className="network-stat">
                  <div className="icon-bubble">
                    <Icon name="people" />
                  </div>
                  <div>
                    <strong>66</strong>
                    <span>{t(copy.common.members)}</span>
                  </div>
                </div>
                <div className="network-stat">
                  <div className="icon-bubble">
                    <Icon name="globe" />
                  </div>
                  <div>
                    <strong>58</strong>
                    <span>{t(copy.common.countries)}</span>
                  </div>
                </div>
                <div className="network-stat">
                  <div className="icon-bubble">
                    <Icon name="pin" />
                  </div>
                  <div>
                    <strong>266</strong>
                    <span>{t(copy.common.hubs)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-muted" id="insights">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2>{t(copy.home.insightsTitle)}</h2>
              <a className="link-arrow" href="#insights">
                {t(copy.home.viewInsights)} →
              </a>
            </div>
          </Reveal>
          <div className="insight-grid">
            {insights.map((item, index) => (
              <Reveal key={item.id} delay={index * 70}>
                <article className="insight-card">
                  <img src={item.image} alt="" />
                  <div className="insight-body">
                    <div className="insight-meta">
                      {item.date[lang]} | {item.category[lang]}
                    </div>
                    <h3>{item.title[lang]}</h3>
                    <Link className="link-arrow" to="/services">
                      {t(copy.home.readMore)} →
                    </Link>
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
