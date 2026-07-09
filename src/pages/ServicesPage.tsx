import { expertise, specialisations } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

function ServiceBlock({
  title,
  items,
}: {
  title: string;
  items: typeof expertise;
}) {
  const { lang } = useI18n();

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <Reveal>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{title}</h2>
      </Reveal>
      <div className="service-detail">
        {items.map((service, index) => (
          <Reveal key={service.id} delay={(index % 3) * 40}>
            <article className="service-card" id={service.id}>
              <div>
                <div
                  style={{
                    color: "var(--orange)",
                    fontFamily: "var(--font-display)",
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
      </div>
    </div>
  );
}

export function ServicesPage() {
  const { t } = useI18n();
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

      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <ServiceBlock title={t(copy.servicesPage.expertise)} items={expertise} />
          <ServiceBlock title={t(copy.servicesPage.special)} items={specialisations} />
        </div>
      </section>
    </>
  );
}
