import { Link } from "react-router-dom";
import { CountUp } from "../components/CountUp";
import { Reveal } from "../components/Reveal";
import { contact, team, values } from "../data";
import { useCopy, useI18n } from "../i18n";

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

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container about-grid">
          <Reveal>
            <div>
              <div className="section-head" style={{ display: "block" }}>
                <h2>{t(copy.aboutPage.storyTitle)}</h2>
                <p>{t(copy.aboutPage.story)}</p>
              </div>
              <div className="section-head" style={{ display: "block", marginTop: "1.5rem" }}>
                <h2 style={{ fontSize: "1.6rem" }}>{t(copy.aboutPage.visionTitle)}</h2>
                <p>{t(copy.aboutPage.vision)}</p>
              </div>
              <a
                className="btn btn-primary"
                href={contact.global}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: "1rem" }}
              >
                {t(copy.home.networkCta)}
              </a>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="network-panel">
              <h3>{t(copy.home.networkTitle)}</h3>
              <div className="network-stats">
                <div className="network-stat">
                  <div>
                    <strong><CountUp end={66} /></strong>
                    <span>{t(copy.common.members)}</span>
                  </div>
                </div>
                <div className="network-stat">
                  <div>
                    <strong><CountUp end={58} /></strong>
                    <span>{t(copy.common.countries)}</span>
                  </div>
                </div>
                <div className="network-stat">
                  <div>
                    <strong><CountUp end={266} /></strong>
                    <span>{t(copy.common.hubs)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-muted">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2>{t(copy.aboutPage.valuesTitle)}</h2>
            </div>
          </Reveal>
          <div className="expertise-grid">
            {values.map((value, index) => (
              <Reveal key={value.title.en} delay={index * 60}>
                <article className="expertise-card">
                  <h3>{value.title[lang]}</h3>
                  <p>{value.text[lang]}</p>
                  <Link className="link-arrow" to="/contact">
                    {t(copy.nav.talk)} →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head" style={{ display: "block" }}>
              <h2>{t(copy.aboutPage.teamTitle)}</h2>
              <p>{t(copy.aboutPage.teamLead)}</p>
            </div>
          </Reveal>
          <div className="team-grid">
            {team.map((member, index) => (
              <Reveal key={member.id} delay={index * 60}>
                <article className="team-card">
                  <div className="team-photo" aria-hidden="true">
                    {member.photo ? (
                      <img src={member.photo} alt="" />
                    ) : (
                      <span className="team-initials">{member.initials}</span>
                    )}
                  </div>
                  <h3>{member.name[lang]}</h3>
                  <span className="team-role">{member.role[lang]}</span>
                  <p>{member.achievements[lang]}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="team-note">{t(copy.aboutPage.teamNote)}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
