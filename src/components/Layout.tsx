import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { contact, expertise } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Logo } from "./Logo";

export function Layout() {
  const { lang, toggleLang, t } = useI18n();
  const copy = useCopy();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [lang, location.pathname]);

  useEffect(() => {
    const meta = {
      "/": {
        en: ["TGS Saudi Arabia | Audit, Zakat, Tax & Advisory", "Integrated professional services for organisations operating and growing in Saudi Arabia."],
        ar: ["تي جي إس السعودية | التدقيق والزكاة والضرائب والاستشارات", "خدمات مهنية متكاملة للمنظمات العاملة والنامية في المملكة العربية السعودية."],
      },
      "/services": {
        en: ["Our Expertise | TGS Saudi Arabia", "Audit, accounting, advisory, zakat, tax and specialist Saudi regulatory services."],
        ar: ["خبراتنا | تي جي إس السعودية", "خدمات التدقيق والمحاسبة والاستشارات والزكاة والضرائب والخدمات التنظيمية السعودية المتخصصة."],
      },
      "/clients": {
        en: ["Our Clients | TGS Saudi Arabia", "Organisations that place their confidence in TGS Saudi Arabia."],
        ar: ["عملاؤنا | تي جي إس السعودية", "منظمات وضعت ثقتها في تي جي إس السعودية."],
      },
      "/about": {
        en: ["About Us | TGS Saudi Arabia", "A Riyadh-based professional services firm and independent member of TGS Global."],
        ar: ["من نحن | تي جي إس السعودية", "مكتب خدمات مهنية في الرياض وعضو مستقل في شبكة تي جي إس العالمية."],
      },
      "/contact": {
        en: ["Contact | TGS Saudi Arabia", "Speak with our Riyadh team about audit, zakat, tax, advisory or specialist engagements."],
        ar: ["تواصل معنا | تي جي إس السعودية", "تواصل مع فريقنا في الرياض بشأن التدقيق أو الزكاة أو الضرائب أو الاستشارات."],
      },
    } as const;
    const entry = meta[location.pathname as keyof typeof meta] || meta["/"];
    const [title, description] = entry[lang];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [lang, location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const links = [
    { to: "/", label: copy.nav.home },
    { to: "/about", label: copy.nav.about },
    { to: "/services", label: copy.nav.expertise },
    { to: "/clients", label: copy.nav.clients },
    { to: `${base}/#insights`, label: copy.nav.insights, external: true },
    { to: "/contact", label: copy.nav.contact },
  ];

  return (
    <div className="site">
      <a className="skip-link" href="#main-content">
        {lang === "en" ? "Skip to content" : "انتقل إلى المحتوى"}
      </a>
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link to="/" className="brand-logo" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {links.map((link) =>
              "external" in link && link.external ? (
                <a key={link.to} href={link.to}>
                  {t(link.label)}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {t(link.label)}
                </NavLink>
              ),
            )}
          </nav>

          <div className="nav-actions">
            <button className="lang-toggle" type="button" onClick={toggleLang}>
              {lang === "en" ? "EN | AR" : "AR | EN"}
            </button>
            <Link className="btn btn-primary" to="/contact">
              {t(copy.nav.talk)}
            </Link>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={open}
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-panel">
          {links.map((link) =>
            "external" in link && link.external ? (
              <a key={link.to} href={link.to} onClick={() => setOpen(false)}>
                {t(link.label)}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {t(link.label)}
              </NavLink>
            ),
          )}
          <button type="button" onClick={toggleLang}>
            {lang === "en" ? "العربية" : "English"}
          </button>
          <Link className="btn btn-primary" to="/contact" onClick={() => setOpen(false)}>
            {t(copy.nav.talk)}
          </Link>
        </div>
      )}

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <section className="conversation-band" aria-labelledby="conversation-title">
        <div className="container conversation-band-inner">
          <div>
            <span className="conversation-kicker">
              {lang === "en" ? "A clearer next step" : "خطوتك التالية بوضوح"}
            </span>
            <h2 id="conversation-title">
              {lang === "en" ? "Let’s turn complexity into confidence." : "نحوّل التعقيد إلى ثقة."}
            </h2>
            <p>
              {lang === "en"
                ? "Tell our Riyadh team what you are navigating. We’ll connect you with the right expertise."
                : "أخبر فريقنا في الرياض بالتحدي الذي تواجهه، وسنصلك بالخبرة المناسبة."}
            </p>
          </div>
          <div className="conversation-actions">
            <Link className="btn btn-dark" to="/contact">
              {t(copy.nav.talk)}
            </Link>
            <a className="conversation-phone" href={contact.phoneHref}>
              {contact.phone}
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <div className="brand-logo">
              <Logo />
            </div>
            <p>{contact.address[lang]}</p>
            <p>
              <a href={contact.phoneHref}>{contact.phone}</a>
            </p>
            <p>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
            <div className="socials">
              <a href={contact.linkedin} target="_blank" rel="noreferrer">
                in
              </a>
              <a href={contact.global} target="_blank" rel="noreferrer">
                X
              </a>
              <a href={contact.global} target="_blank" rel="noreferrer">
                YT
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t(copy.footer.information)}</h4>
            <Link to="/about">{t(copy.nav.about)}</Link>
            <Link to="/clients">{t(copy.nav.clients)}</Link>
            <a href={`${base}/#insights`}>{t(copy.nav.insights)}</a>
            <Link to="/contact">{t(copy.nav.contact)}</Link>
          </div>

          <div className="footer-col">
            <h4>{t(copy.footer.expertise)}</h4>
            {expertise.map((item) => (
              <Link key={item.id} to={`/services#${item.id}`}>
                {item.title[lang]}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <h4>{t(copy.footer.contact)}</h4>
            <p>{t(copy.footer.conversation)}</p>
            <Link className="btn btn-outline" to="/contact" style={{ marginTop: "0.6rem", width: "fit-content" }}>
              {t(copy.nav.talk)}
            </Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} TGS Saudi Arabia. {t(copy.footer.rights)}
          </span>
          <div>
            <a href="#">{t(copy.footer.privacy)}</a>
            <a href="#">{t(copy.footer.terms)}</a>
            <a href="#">{t(copy.footer.cookies)}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
