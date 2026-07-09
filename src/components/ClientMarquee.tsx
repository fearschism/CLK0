import { clients } from "../data";
import { useI18n } from "../i18n";

export function ClientMarquee({ label }: { label: string }) {
  const { lang } = useI18n();
  const loop = [...clients, ...clients];

  return (
    <section className="marquee-section" aria-label={label}>
      <div className="marquee-label">{label}</div>
      <div className="marquee">
        <div className="marquee-track">
          {loop.map((client, index) => (
            <div className="logo-chip" key={`${client.id}-${index}`}>
              <div
                className="logo-mark"
                style={{ background: client.logoColor }}
                aria-hidden="true"
              >
                {client.initials}
              </div>
              <div>
                <strong>{client.name[lang]}</strong>
                <small>{client.sector[lang]}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
