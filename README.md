# AI in Cybersecurity — maturity return and console

How far has each organisation actually taken artificial intelligence into its cybersecurity work? Not "do you govern your chatbots", but: is AI reducing false positives in the SOC, is response automated, is GRC evidence collected automatically, would you still detect an attack if the AI tooling failed.

Built for a health governing body that oversees **30 organisations**. Two audiences, two files:

| File | Who gets it | What it does |
| --- | --- | --- |
| **`index.html`** | The 30 reporting organisations. Email it to them. | The questionnaire. Plain questions in **English and Arabic together**, answered with Yes / No / Not sure, a drop-down or tick boxes. At the end they save a **PDF** and download a **data file**. No score, rating or league table is visible anywhere. |
| **`console.html`** | The governing body only. Never linked from the questionnaire. | Loads the returned data files, derives a rating, and produces the sector dashboard, per-organisation reports, question analysis and exports. |

Each file is **completely self-contained** — the stylesheet, all the scripts and the crest are inlined. There is nothing to install, nothing to host and no network access required. A recipient can open the attachment straight from their mail client, work offline, and email two files back.

---

## Quick start

Double-click `index.html`. That is the whole thing.

To run a cycle:

1. Edit `src/js/branding.js` — the client's name, logo, colours, document reference, deadline and return address, in both languages.
2. Edit the register of 30 organisations in `src/js/framework.js`.
3. Run `node tools/build.mjs` to regenerate `index.html` and `console.html`.
4. Email `index.html` to the organisations (rename it to whatever suits, there are no dependencies).
5. They answer, click **Save as PDF**, click **Download data file**, and email both back.
6. You open `console.html`, drop in all the data files at once, and read the sector view.

Before the first return arrives, **Load demonstration data** in the console fills the register with synthetic returns so you can rehearse the whole reporting cycle.

---

## Bilingual, with no toggle

Every visible string is a pair. English runs in the normal flow; Arabic sits beneath it, right-aligned and set in an Arabic face, so both are always on screen and neither is a second-class citizen. That applies to questions, hints, every answer option, section titles, the interface, the rating bands, the organisation register, and both printed reports.

Short labels share a line (`Yes نعم`), longer ones stack. Drop-down options carry both languages in the same entry, because a `<select>` cannot hold two lines.

Adding a language means adding a key to the `{ en, ar }` pairs in `src/js/framework.js` and one rendering helper; nothing else assumes two.

---

## What the questionnaire measures

**55 questions across twelve weighted sections.** About 15 minutes, almost all of it clicking.

| Section | Weight | Anchored to |
| --- | --- | --- |
| A · Strategy, ownership and adoption | 9% | NIST AI RMF (GOVERN), ISO/IEC 42001, SOC-CMM |
| B · Data and telemetry foundation | 8% | NIST CSF 2.0, SOC-CMM (log management) |
| C · Threat detection and monitoring | 12% | NIST CSF 2.0 (DETECT), MITRE ATT&CK coverage |
| D · Alert triage and false positives | 10% | SOC-CMM (triage, efficiency metrics) |
| E · Incident response and SOC automation | 11% | NIST CSF 2.0 (RESPOND), SOC-CMM, clinical safety |
| F · Threat intelligence and hunting | 7% | NIST CSF 2.0, MITRE ATT&CK |
| G · Vulnerabilities and attack surface | 7% | NIST CSF 2.0, ISO/IEC 27001 A.8 |
| H · Identity and insider risk | 7% | NIST CSF 2.0, patient-record access monitoring |
| I · Data protection and leak prevention | 6% | ISO/IEC 27001, OWASP LLM02, NIST AI 600-1 |
| J · Governance, risk and compliance | 9% | ISO/IEC 27001 clauses 6 and 9, ISO/IEC 42001 |
| K · Cyber resilience and recovery | 8% | NIST CSF 2.0 (RECOVER), clinical continuity |
| L · Assurance and skills | 6% | NIST AI RMF (MEASURE), OWASP LLM Top 10, MITRE ATLAS |

The health context runs through it rather than sitting in its own box: detection coverage is measured up to clinical systems and medical devices, automated containment must never disrupt patient care without a human decision, and recovery testing is about clinical systems and measured recovery time.

### Reference frameworks

Twelve, all current, and every question maps to at least one:

- **NIST Cybersecurity Framework 2.0** — the spine for the detect, respond and recover domains.
- **MITRE ATT&CK** — for measuring what detection actually covers.
- **SOC-CMM** — the reference model for security operations maturity, behind the triage, automation and metrics questions.
- **NIST AI Risk Management Framework 1.0** and the **Generative AI Profile (NIST AI 600-1)** — for governing the AI you rely on.
- **OWASP Top 10 for LLM Applications 2025** and **MITRE ATLAS** — for the assurance of AI assistants used inside the SOC, including prompt injection.
- **ISO/IEC 42001:2023** and **ISO/IEC 27001:2022** — management-system anchors, so findings map to something an auditor recognises.
- **CISA / NCSC Guidelines for Secure AI System Development**.
- **HITRUST AI security assessment** and **HHS 405(d) HICP** — the health overlay.
- **EU AI Act** — human oversight (Art. 14) and robustness (Art. 15).

The console's **Method** tab shows how many questions map to each framework, and the answer-level CSV carries the mapping per row.

---

## How the rating works

Respondents never see it; the console applies it.

| Answer | Value |
| --- | --- |
| Yes | 5 |
| No | 0 |
| Not sure | 1 |
| Not applicable | excluded from the average |
| An option from a list | the value attached to that option, 0–5 |
| Tick boxes | the share of boxes ticked, scaled to 5 (“none of these” scores 0) |
| A number | context only, not rated |

`Not sure` scores 1 rather than 0 deliberately: if the accountable respondent cannot confirm a capability it is not being managed, but it is not the same as a flat No — and those answers are counted separately so you can chase them.

Sections are weighted averages, with core questions counting 1.5×; the overall rating weights the twelve sections. *Not applicable* leaves both sides of the average. Ratings map to five bands — **Not established, Emerging, Established, Managed, Leading** — and anything below the target band becomes an action ranked by `section weight × question weight × size of the gap`, quoting the answer that triggered it, in both languages.

Two caveats to repeat whenever you present the output, both stated on the Method tab: returns are **self-declared**, not audited; and a pile of **Not sure** answers is as significant as a low rating, because it means nobody has visibility.

---

## The console

Sector dashboard (coverage against the register, sector average, who is meeting the target, rating distribution, sector radar with any organisation overlaid, average by section, organisation ranking, an organisation × section heatmap, averages by type and region), per-organisation reports you can export as that organisation's feedback letter, question analysis showing how all 30 answered each question with its framework mapping, exports (combined JSON, organisation CSV, answer-level CSV with both languages), and the Method tab.

The target band is a setting, so a cycle can be re-rated without touching the returns.

---

## Building and customising

Sources live in `src/`; `index.html` and `console.html` at the root are **generated and committed**, so nobody needs Node to use the pack.

```
src/pages/questionnaire.html   page template with build placeholders
src/pages/console.html         page template
src/css/styles.css             theme, bilingual typography, A4 print rules
src/js/branding.js             client name, logo, colours, cycle, deadline — bilingual
src/js/framework.js            sections, questions, options, register, and reading answers back
src/js/scoring.js              rating and aggregation engine (console only)
src/js/survey.js               questionnaire controller
src/js/console.js              console controller
src/js/charts.js               dependency-free SVG radar, bars, gauge, heatmap, columns
src/js/util.js                 storage, download and upload, CSV, formatting
src/brand/logo.svg             placeholder crest — replace with the client's
tools/build.mjs                inlines everything into the two root files
schema/return.schema.json      JSON Schema for the return data file
```

```bash
node tools/build.mjs           # regenerate index.html and console.html
node tools/build.mjs --check   # fail if either is out of date
```

The build fails if anything external survives inlining, and it gives each copy of the logo unique element ids so a gradient referenced twice cannot render blank in print.

To change the questions, edit `AIMA.sections`: each question needs an `id`, bilingual `text`, `type`, `weight`, `refs` and — if rated — a bilingual `remedy`. Section weights must total 100; the tests enforce it, along with Arabic being present everywhere.

**One thing to be aware of:** because the questionnaire is a single self-contained file, its source necessarily contains the question bank. The rating engine is not shipped in it — the file organisations receive cannot compute or display a rating — but a determined reader could inspect the option values. That is a deliberate trade for portability, and it is a small exposure: the options are already listed worst-to-best on screen, and the method is published on the console's Method tab anyway.

---

## The return data file

One file per organisation, described by `schema/return.schema.json`. It holds **answers only**:

```jsonc
{
  "schemaVersion": "3.0.0",
  "frameworkVersion": "2026.3",
  "period": "2026 Annual Return",
  "entity": {
    "code": "E14",
    "name": { "en": "Central Primary Care Cluster", "ar": "تجمع الرعاية الأولية المركزي" },
    "type": { "en": "Primary Care Cluster", "ar": "تجمع رعاية أولية" }
  },
  "contact": { "contactName": "S. Haddad", "contactRole": "Head of Security Operations" },
  "submittedDate": "2026-05-14",
  "declarationConfirmed": true,
  "answers": {
    "C1": { "value": "yes" },
    "D3": { "value": "tracked" },
    "B1": { "value": ["endpoints", "network", "identity"] },
    "D5": { "value": 250 }
  },
  "sectionNotes": { "D": "Triage automation went live in March." },
  "progress": { "answered": 55, "total": 55, "percent": 100 }
}
```

Names are bilingual objects so a report can be produced in either language from the same file. The console recomputes everything from `answers`, and rejects files from an earlier schema rather than mis-scoring them.

---

## Testing

254 automated checks.

```bash
node tools/test-scoring.mjs        # 163 checks, no dependencies
```

Question bank integrity (weights total 100, the twelve domains are all present, every question maps to a real framework, list options run worst to best, no maturity jargon in the wording), **bilingual coverage** (every question, hint, option, remedy, section, band, organisation name and interface string has Arabic in Arabic script and differs from the English), the answer-to-value rules, weighted arithmetic against hand-calculated figures, aggregation, and the chart renderers.

It also enforces the two structural guarantees: the built files have **no external references** and inline their own logo, and the questionnaire **does not ship the rating engine** — the built file contains no `computeResults`, no `aggregate`, and `survey.js` cannot reference them.

```bash
npm install --no-save puppeteer-core
CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs    # 91 checks
```

Drives real Chrome through the cycle: confirms each page loads with **exactly one network request**, that every question renders in both languages with Arabic running right to left and no language toggle, completes all 55 questions through the actual inputs, checks the printed return is bilingual and shows answers in words, downloads the data file and validates it against the schema, then loads it into the console and confirms the derived rating matches an **independently computed** rating, section by section — the engine now has to be loaded separately in Node, because the questionnaire page does not have it. It also opens the built file over `file://` and asserts it renders, styles, keeps Arabic and makes **zero network requests**.

---

## Feeding a BI tool later

The answer-level CSV is one row per organisation × question with the answer in both languages, the derived value and the framework mapping — it pivots straight into a matrix visual. The organisation CSV is one row per organisation with a column per section. The combined JSON carries the sector summary plus every raw return; `entity.code`, `period` and `frameworkVersion` form a natural key across cycles. Store the raw `answers` and recompute with `src/js/scoring.js`, which is plain side-effect-free JavaScript, so history stays consistent if the weights change.
