/*
 * Client branding — bilingual
 * ---------------------------
 * EDIT THIS FILE to brand the pack for the governing body. Nothing else needs
 * to change: both pages read their letterhead, colours, references and return
 * instructions from here, in English and Arabic.
 *
 * To use the client's own logo, replace src/brand/logo.svg and rebuild with
 * `node tools/build.mjs`.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  AIMA.branding = {
    /* ---- Identity ------------------------------------------------- */
    organisation: { en: 'National Health Authority', ar: 'الهيئة الوطنية للصحة' },
    organisationShort: { en: 'NHA', ar: 'الهيئة' },
    directorate: {
      en: 'Cybersecurity & Digital Risk Directorate',
      ar: 'إدارة الأمن السيبراني والمخاطر الرقمية'
    },
    programme: {
      en: 'AI Cyber Assurance Programme',
      ar: 'برنامج ضمان الذكاء الاصطناعي في الأمن السيبراني'
    },

    /* ---- This assessment round ------------------------------------ */
    cycle: { en: '2026 Annual Return', ar: 'النموذج السنوي 2026' },
    documentRef: { en: 'NHA/CDR/AICAP/2026-01', ar: 'NHA/CDR/AICAP/2026-01' },
    classification: { en: 'Official — Sensitive', ar: 'رسمي — حساس' },
    returnDeadline: { en: '31 May 2026', ar: '31 مايو 2026' },
    returnContact: { en: 'ai.assurance@nha.health.example', ar: 'ai.assurance@nha.health.example' },
    returnInstructions: {
      en: 'Send both the PDF and the data file (.json) to the address above by the deadline, and keep a copy for your own records.',
      ar: 'أرسلوا ملف PDF وملف البيانات (.json) معاً إلى العنوان أعلاه قبل الموعد النهائي، مع الاحتفاظ بنسخة لسجلاتكم.'
    },

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

  /** One language out of a bilingual branding value. */
  AIMA.brand = function (key, lang) {
    var value = AIMA.branding[key];
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    return value[lang || 'en'] || value.en || '';
  };

  /**
   * Push the branding into the document: CSS custom properties, page title and
   * every element tagged with data-brand (optionally data-lang="ar").
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
      document.title = opts.title + ' · ' + AIMA.brand('organisationShort', 'en');
    }

    document.querySelectorAll('[data-brand]').forEach(function (el) {
      var key = el.getAttribute('data-brand');
      var lang = el.getAttribute('data-lang') || 'en';
      if (brand[key] === undefined) return;
      el.textContent = AIMA.brand(key, lang);
    });

    document.querySelectorAll('[data-brand-mail]').forEach(function (el) {
      var address = AIMA.brand('returnContact', 'en');
      el.setAttribute('href', 'mailto:' + address);
      if (!el.textContent.trim()) el.textContent = address;
    });
  };
})(window.AIMA);
