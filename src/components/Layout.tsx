import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { contact } from "../data";
import { useCopy, useI18n } from "../i18n";

export function Layout() {
  const { lang, toggleLang, t } = useI18n();
  const copy = useCopy();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [lang]);

  const links = [
    { to: "/", label: copy.nav.home },
    { to: "/services", label: copy.nav.services },
    { to: "/clients", label: copy.nav.clients },
    { to: "/about", label: copy.nav.about },
    { to: "/contact", label: copy.nav.contact },
  ];

  return (
    <div className="site">
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark">TGS</span>
            TGS <em>Saudi</em>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {t(link.label)}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <button className="lang-toggle" type="button" onClick={toggleLang}>
              {lang === "en" ? "العربية" : "English"}
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
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {t(link.label)}
            </NavLink>
          ))}
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
        <div className="container">
          <div className="footer-top">
            <div>
              <div className="brand">
                <span className="brand-mark">TGS</span>
                TGS <em>Saudi</em>
              </div>
              <p style={{ marginTop: "0.75rem", maxWidth: "28rem" }}>
                {t(copy.footer.tagline)}
              </p>
            </div>
            <div className="footer-links">
              {links.map((link) => (
                <Link key={link.to} to={link.to}>
                  {t(link.label)}
                </Link>
              ))}
              <a href={contact.global} target="_blank" rel="noreferrer">
                TGS Global
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} TGS Saudi. {t(copy.footer.rights)}
            </span>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
