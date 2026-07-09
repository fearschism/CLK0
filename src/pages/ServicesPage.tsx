import { services } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

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

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container service-detail">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={(index % 3) * 50}>
              <article className="service-card" id={service.id}>
                <div>
                  <div className="index" style={{ color: "var(--gold)", letterSpacing: "0.12em", fontSize: "0.78rem", marginBottom: "0.6rem" }}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h2>{service.title[lang]}</h2>
                </div>
                <div>
                  <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem" }}>
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
        </div>
      </section>
    </>
  );
}
