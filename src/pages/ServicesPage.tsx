import { expertise, specialisations } from "../data";
import { ClientMarquee } from "../components/ClientMarquee";
import { Reveal } from "../components/Reveal";
import { useCopy, useI18n } from "../i18n";

export function ServicesPage() {
  const { lang, t } = useI18n();
  const copy = useCopy();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1>{t(copy.servicesPage.title)}</h1>
            <p>{t(copy.servicesPage.lead)}</p>
          </Reveal>
        </div>
      </section>

      <ClientMarquee label={t(copy.home.trusted)} />

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container service-detail">
          {expertise.map((service, index) => (
            <Reveal key={service.id} delay={(index % 3) * 40}>
              <article className="service-card" id={service.id}>
                <div>
                  <div
                    style={{
                      color: "var(--orange)",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      letterSpacing: "0.08em",
                      marginBottom: "0.55rem",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h2>{service.title[lang]}</h2>
                </div>
                <div>
                  <p style={{ color: "var(--ink-soft)", fontSize: "1.02rem" }}>
                    {service.summary[lang]}
                  </p>
                  <ul>
                    {service.details[lang].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}

          <Reveal>
            <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
              {lang === "en" ? "Saudi specialisations" : "تخصصات سعودية"}
            </h2>
          </Reveal>
          {specialisations.map((service, index) => (
            <Reveal key={service.id} delay={index * 40}>
              <article className="service-card" id={service.id}>
                <div>
                  <h2 style={{ fontSize: "1.5rem" }}>{service.title[lang]}</h2>
                </div>
                <div>
                  <p style={{ color: "var(--ink-soft)" }}>{service.summary[lang]}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
