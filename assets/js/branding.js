/*
 * Client branding
 * ---------------
 * EDIT THIS FILE to brand the pack for the governing body. Nothing else needs
 * to change: both the questionnaire and the console read their letterhead,
 * colours, document references and return instructions from here.
 *
 * To use the client's own logo, drop the file into assets/brand/ and point
 * `logoPath` at it (SVG or PNG, ideally square or landscape up to ~4:1).
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  AIMA.branding = {
    /* ---- Identity ------------------------------------------------- */
    organisation: 'National Health Authority',
    organisationShort: 'NHA',
    directorate: 'Cybersecurity & Digital Risk Directorate',
    programme: 'AI Cyber Assurance Programme',

    /* ---- This assessment round ------------------------------------ */
    cycle: '2026 Annual Return',
    documentRef: 'NHA/CDR/AICAP/2026-01',
    classification: 'Official — Sensitive',
    returnDeadline: '31 May 2026',
    returnContact: 'ai.assurance@nha.health.example',
    returnInstructions: 'Return both the PDF and the data file (.json) to the address above by the deadline. Keep a copy for your own records.',
    supportContact: 'ai.assurance@nha.health.example',

    /* ---- Assets --------------------------------------------------- */
    logoPath: 'assets/brand/logo.svg',
    faviconPath: 'assets/brand/favicon.svg',

    /* ---- Palette -------------------------------------------------- */
    theme: {
      primary: '#123e5c',
      primaryDark: '#0c2c42',
      primaryLight: '#1d5a80',
      accent: '#0e8b7d',
      accentDark: '#0b6d62',
      accentSoft: '#e6f4f1',
      gold: '#b48b2f'
    }
  };

  /**
   * Push the branding into the document: CSS custom properties, page title,
   * favicon, letterhead blocks and any element tagged with data-brand.
   */
  AIMA.applyBranding = function (options) {
    var brand = AIMA.branding;
    var opts = options || {};
    var root = document.documentElement;

    Object.keys(brand.theme).forEach(function (key) {
      root.style.setProperty('--brand-' + key.replace(/[A-Z]/g, function (m) {
        return '-' + m.toLowerCase();
      }), brand.theme[key]);
    });

    if (opts.title) {
      document.title = opts.title + ' · ' + brand.organisationShort;
    }

    var favicon = document.querySelector('link[rel="icon"]');
    if (favicon && brand.faviconPath) favicon.setAttribute('href', brand.faviconPath);

    var values = {
      organisation: brand.organisation,
      organisationShort: brand.organisationShort,
      directorate: brand.directorate,
      programme: brand.programme,
      cycle: brand.cycle,
      documentRef: brand.documentRef,
      classification: brand.classification,
      returnDeadline: brand.returnDeadline,
      returnContact: brand.returnContact,
      returnInstructions: brand.returnInstructions,
      supportContact: brand.supportContact
    };

    document.querySelectorAll('[data-brand]').forEach(function (el) {
      var key = el.getAttribute('data-brand');
      if (values[key] !== undefined) el.textContent = values[key];
    });

    document.querySelectorAll('[data-brand-mail]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + brand.returnContact);
      if (!el.textContent.trim()) el.textContent = brand.returnContact;
    });

    document.querySelectorAll('[data-brand-logo]').forEach(function (el) {
      el.setAttribute('src', brand.logoPath);
      el.setAttribute('alt', brand.organisation + ' logo');
    });
  };
})(window.AIMA);
