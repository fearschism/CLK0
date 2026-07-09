import { useMemo, useState } from "react";
import { clients } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Reveal } from "../components/Reveal";

export function ClientsPage() {
  const { lang, t } = useI18n();
  const copy = useCopy();
  const [sector, setSector] = useState("All");

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(clients.map((c) => c.sector.en)));
    return ["All", ...unique];
  }, []);

  const filtered =
    sector === "All" ? clients : clients.filter((c) => c.sector.en === sector);

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

      <section className="section" style={{ paddingTop: "2.2rem" }}>
        <div className="container">
          <div className="client-filters">
            {sectors.map((item) => {
              const label =
                item === "All"
                  ? t(copy.clientsPage.filterAll)
                  : clients.find((c) => c.sector.en === item)?.sector[lang] || item;
              return (
                <button
                  key={item}
                  type="button"
                  className={`filter-btn ${sector === item ? "active" : ""}`}
                  onClick={() => setSector(item)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="client-grid">
            {filtered.map((client, index) => (
              <Reveal key={client.id} delay={(index % 6) * 40}>
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

          <p className="client-note">{t(copy.clientsPage.note)}</p>
        </div>
      </section>
    </>
  );
}
