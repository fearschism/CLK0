import { approvedClientLogos } from "../data";

export function ClientMarquee({ label }: { label: string }) {
  const loop = [...approvedClientLogos, ...approvedClientLogos];

  return (
    <section className="marquee-section" aria-label={label}>
      <div className="marquee-label">{label}</div>
      <div className="marquee">
        <div className="marquee-track">
          {loop.map((client, index) => (
            <div className={`logo-chip logo-chip-${client.theme || "light"}`} key={`${client.id}-${index}`}>
              <img src={client.logo} alt={client.name} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
