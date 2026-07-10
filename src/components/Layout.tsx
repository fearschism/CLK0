import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { contact, expertise } from "../data";
import { useCopy, useI18n } from "../i18n";
import { Logo } from "./Logo";

export function Layout() {
  const { lang, toggleLang, t } = useI18n();
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [lang]);

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

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <div className="brand-logo">
              <Logo variant="light" />
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
