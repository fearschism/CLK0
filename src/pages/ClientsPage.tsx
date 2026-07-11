import { ClientMarquee } from "../components/ClientMarquee";
import { Reveal } from "../components/Reveal";
import { approvedClientLogos } from "../data";
import { useCopy, useI18n } from "../i18n";

export function ClientsPage() {
  const { t } = useI18n();
  const copy = useCopy();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1>{t(copy.clientsPage.title)}</h1>
            <p>{t(copy.clientsPage.lead)}</p>
          </Reveal>
        </div>
      </section>

      <ClientMarquee label={t(copy.home.trusted)} />

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          <div className="client-logo-grid">
            {approvedClientLogos.map((client, index) => (
              <Reveal key={client.id} delay={(index % 6) * 40}>
                <article className={`client-logo-card client-logo-card-${client.theme || "light"}`}>
                  <img src={client.logo} alt={client.name} loading="lazy" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
