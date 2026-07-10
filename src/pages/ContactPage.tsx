import { useState, type FormEvent } from "react";
import { Reveal } from "../components/Reveal";
import { contact, services } from "../data";
import { useCopy, useI18n } from "../i18n";

export function ContactPage() {
  const { lang, t } = useI18n();
  const copy = useCopy();
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const company = String(data.get("company") || "");
    const service = String(data.get("service") || "");
    const message = String(data.get("message") || "");

    const subject = encodeURIComponent(
      `TGS Saudi inquiry${service ? ` — ${service}` : ""}`,
    );
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nService: ${service}\n\n${message}`,
    );
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <h1>{t(copy.contactPage.title)}</h1>
            <p>{t(copy.contactPage.lead)}</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="container contact-grid">
          <Reveal>
            <div className="contact-map">
              <iframe
                title="TGS Saudi Arabia — Riyadh office"
                src={contact.mapEmbed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                className="map-pin-card"
                href={contact.mapLink}
                target="_blank"
                rel="noreferrer"
              >
                <span className="map-pin-label">{t(copy.contactPage.locationLabel)}</span>
                <strong>TGS Saudi Arabia</strong>
                <span className="map-pin-address">{contact.address[lang]}</span>
                <span className="map-pin-cta">{t(copy.contactPage.openMap)} →</span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <form className="form" onSubmit={onSubmit}>
              <label>
                {t(copy.contactPage.name)}
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                {t(copy.contactPage.company)}
                <input name="company" autoComplete="organization" />
              </label>
              <label>
                {t(copy.contactPage.service)}
                <select name="service" defaultValue="">
                  <option value="">{t(copy.contactPage.select)}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.title.en}>
                      {service.title[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t(copy.contactPage.message)}
                <textarea name="message" required />
              </label>
              <button className="btn btn-primary" type="submit">
                {t(copy.contactPage.send)}
              </button>
              <p className="form-note">{t(copy.contactPage.note)}</p>
              {sent && <p className="form-success">{t(copy.contactPage.success)}</p>}
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
