# AI Cyber Assurance Programme — questionnaire and console

An annual return on how member organisations use and secure artificial intelligence, built for a health governing body that oversees **30 organisations**.

Two separate pages, for two separate audiences:

| Page | Who opens it | What it does |
| --- | --- | --- |
| `index.html` | **The 30 reporting organisations.** Send them this page (or a link to it). | A plain questionnaire: Yes / No / Not sure, a choice from a list, or tick boxes. At the end they save a **PDF** and download a **data file**. No scores, ratings or league tables are visible anywhere. |
| `console.html` | **The governing body only.** Never linked from the questionnaire. | Loads the returned data files, derives a rating from the plain answers, and produces the sector dashboard, per-organisation reports, question analysis and exports. |

The split is deliberate: respondents answer factual questions in their own language, and all judgement happens on your side. A test in the suite fails if the questionnaire ever starts referencing the rating engine.

Everything is plain HTML, CSS and JavaScript — no build step, no server, no external libraries, no data leaving the browser.

---

## Quick start

```bash
python3 -m http.server 8080     # then open http://localhost:8080/
```

Opening the files directly from disk also works, because there are no module imports or `fetch` calls.

**Rolling out a cycle**

1. Edit `assets/js/branding.js` — the client's name, logo, colours, document reference, deadline and return address.
2. Edit the register of 30 organisations in `assets/js/framework.js`.
3. Publish `index.html` (with the `assets/` folder) where the organisations can reach it, and send them the link.
4. Each organisation answers the questions, clicks **Save as PDF**, clicks **Download data file**, and emails both back.
5. You open `console.html`, drop in all the data files at once, and read the sector view.

Before the first return arrives, **Load demonstration data** in the console fills the register with synthetic returns so you can see and rehearse the whole reporting flow. Demonstration rows are labelled `demo`.

---

## What the respondent sees

<!-- The questionnaire is deliberately unremarkable: that is the point. -->

- A stepped form: an introduction, their organisation's details, ten short sections, then a save-and-send page. **51 questions, about 15 minutes.**
- Question types only: **Yes / No / Not sure**, a **drop-down list**, **tick all that apply**, and the occasional **number**. Nothing to write from scratch, though every section has an optional comment box.
- **Not sure** is offered on purpose. It is more useful than a guess, and the console counts these separately as visibility gaps.
- **Not applicable** appears only where a question genuinely may not apply, such as the clinical AI section.
- Progress is saved in their browser as they go, so they can close the page and come back.
- The finish page lists anything still unanswered, with a button that jumps straight to each one, and a **check your answers** table.

The PDF they save is a clean four-page official document: letterhead, their details, every question with the answer they gave in words, their comments, and a signature block for them and their approver. No numbers, no rating.

---

## The questions and where they come from

Ten sections, weighted for the overall rating:

| Section | Weight | Questions | Anchored to |
| --- | --- | --- | --- |
| A · Rules and responsibility for AI | 11% | 5 | NIST AI RMF (GOVERN), ISO/IEC 42001 A.2–A.3 |
| B · Knowing which AI tools you have | 10% | 6 | NIST AI RMF (MAP), ISO/IEC 42001 A.4, OWASP LLM03 |
| C · Protecting patient and staff information | 13% | 6 | NIST AI 600-1, OWASP LLM02, ISO/IEC 42001 A.7, HITRUST AI |
| D · Safe use of chatbots and generative AI | 13% | 6 | OWASP LLM01/05/06/08/09, EU AI Act Art. 14 |
| E · Buying AI safely | 9% | 4 | CISA/NCSC secure AI guidelines, OWASP LLM03, ISO/IEC 42001 A.10 |
| F · Using AI to defend the organisation | 12% | 6 | NIST CSF 2.0 (DETECT, RESPOND), HHS 405(d) HICP |
| G · Testing and checking AI | 9% | 4 | NIST AI RMF (MEASURE), MITRE ATLAS, EU AI Act Art. 15 |
| H · When AI goes wrong | 9% | 5 | NIST AI RMF (MANAGE), NIST CSF 2.0 (RESPOND, RECOVER) |
| I · People and awareness | 7% | 4 | ISO/IEC 42001 A.3–A.4, HHS 405(d) HICP |
| J · Clinical AI and connected devices | 7% | 5 | HITRUST AI, NIST CSF 2.0, EU AI Act high-risk AI |

Reference frameworks, all current:

- **OWASP Top 10 for LLM Applications 2025** — the LLM-specific risks: prompt injection, sensitive information disclosure, supply chain, excessive agency, vector and embedding weaknesses, misinformation.
- **NIST AI Risk Management Framework 1.0** (2023) with the **Generative AI Profile, NIST AI 600-1** (2024) — the governance spine.
- **ISO/IEC 42001:2023** — the certifiable AI management system standard, so findings map to something an auditor recognises.
- **Guidelines for Secure AI System Development** — CISA, NCSC and international partners (2023).
- **MITRE ATLAS** — adversary techniques against AI, behind the testing and red-teaming questions.
- **NIST Cybersecurity Framework 2.0** (2024) — the underlying detect and respond outcomes.
- **HITRUST AI security assessment** and **HHS 405(d) HICP** — the health-sector overlay.
- **EU AI Act** (Regulation 2024/1689) — human oversight (Art. 14) and accuracy, robustness and cybersecurity (Art. 15).

Every question carries its own framework references. The console's **Method** tab shows how many questions map to each framework, and the answer-level CSV includes the mapping per row, so a finding can always be traced back to a published control.

---

## How the rating works

Respondents never see this. The console applies it.

**1 — Each answer becomes a value out of 5.**

| Answer | Value |
| --- | --- |
| Yes | 5 |
| No | 0 |
| Not sure | 1 |
| Not applicable | excluded from the average |
| An option from a list | the value attached to that option, 0–5 |
| Tick boxes | the share of boxes ticked, scaled to 5 (“none of these” scores 0) |
| A number | context only, not rated |

`Not sure` scores 1 rather than 0 on purpose: if the accountable respondent cannot confirm a control, it is not being managed — but it is not the same as a straight No, and these answers are also counted separately so you can chase them.

**2 — Each section is a weighted average** of its questions; core questions count 1.5 times a standard one.

**3 — The overall rating is a weighted average of the sections**, using the weights in the table above. Questions marked *Not applicable* leave both the top and the bottom of the average rather than counting as zero, so a laboratory is not penalised for having no clinical AI.

**4 — Ratings map to five bands:**

| Band | Range | Meaning |
| --- | --- | --- |
| 1 · Not established | 0.00 – 1.49 | Little or no control over how AI is used |
| 2 · Emerging | 1.50 – 2.49 | Some controls, but informal or partial |
| 3 · Established | 2.50 – 3.49 | Documented and applied where it matters most |
| 4 · Managed | 3.50 – 4.49 | Consistently applied, checked and measured |
| 5 · Leading | 4.50 – 5.00 | Automated, continuously tested, ahead of the sector |

**5 — Anything below the target band becomes an action**, ranked by `section weight × question weight × size of the gap`. The top band is Priority 1. Every question carries a pre-written remediation sentence, so the improvement plan writes itself from the answers and quotes the answer that triggered it.

The target band is yours to set, on the console's **Returns & exports** tab. It defaults to 4 (Managed).

Two caveats worth repeating whenever you present the output, both stated on the Method tab: returns are **self-declared** rather than audited, and a low completion rate or a pile of **Not sure** answers is as significant as a low rating — it usually means nobody has visibility, which is itself the finding.

---

## The console

- **Sector dashboard** — returns received against the register (and who is outstanding), sector average and median, how many meet the target, how many are of most concern, total *Not sure* answers, the rating distribution, a sector radar with any single organisation overlaid, average by section, an organisation ranking, an organisation × section heatmap, and averages by type and region. Filters for type, region, rating band and free text apply to everything at once.
- **Organisation reports** — pick an organisation and get its own report: rating gauge, its profile against the sector average and the target, section detail, a ranked improvement plan quoting each answer, the questions it could not answer, its established strengths, and an appendix reproducing every answer as submitted. **Export PDF** turns it into that organisation's feedback letter.
- **Question analysis** — every question with the distribution of answers across the sector, its framework mapping, the weakest controls, and the actions needed by the most organisations. This is what tells you where a shared or centrally funded fix would pay off.
- **Returns & exports** — load and remove returns, set the target band, and export a combined JSON, an organisation-level CSV, or an answer-level CSV.
- **Method** — the rating rules, the bands, the answer values, the framework coverage and the section weights, so the numbers can be defended in a meeting.

Returns are held in the browser's local storage on the machine you load them on, and are never uploaded by the page.

---

## Branding it for the client

Everything visual and textual lives in `assets/js/branding.js`:

```js
organisation:  'National Health Authority',        // appears on both letterheads
directorate:   'Cybersecurity & Digital Risk Directorate',
programme:     'AI Cyber Assurance Programme',
cycle:         '2026 Annual Return',
documentRef:   'NHA/CDR/AICAP/2026-01',
classification:'Official — Sensitive',             // the banner across the top
returnDeadline:'31 May 2026',
returnContact: 'ai.assurance@nha.health.example',  // where returns are sent
logoPath:      'assets/brand/logo.svg',            // drop the client's file in and point here
theme: { primary: '#123e5c', accent: '#0e8b7d', ... }
```

The name, palette, crest, classification banner, document reference, deadline and return address flow from there into both pages, both printed reports and the exported files. `assets/brand/logo.svg` is a placeholder crest — replace the file with the client's own logo (SVG or PNG).

To change the questions, edit `AIMA.sections` in `assets/js/framework.js`: each question needs an `id`, `text`, `hint`, `type`, `weight`, `refs` and — if it is rated — a `remedy`. Section weights must total 100; the test suite enforces it. Bump `AIMA.meta.frameworkVersion` when you change the question set so old returns stay identifiable.

---

## Files

```
index.html                    The questionnaire sent to organisations
console.html                  The governing body console (do not publish alongside the questionnaire)
assets/js/branding.js         Client name, logo, colours, cycle, deadline, return address
assets/js/framework.js        Sections, questions, answer options and their hidden values, the register
assets/js/scoring.js          Rating and aggregation engine (pure functions)
assets/js/survey.js           Questionnaire controller — never touches the rating engine
assets/js/console.js          Console controller
assets/js/charts.js           Dependency-free SVG radar, bars, gauge, heatmap, columns
assets/js/util.js             Storage, file download and upload, CSV, formatting
assets/css/styles.css         Branded theme plus the A4 print stylesheets
assets/brand/                 Placeholder crest and favicon — replace with the client's
schema/return.schema.json     JSON Schema for the return data file
tools/test-scoring.mjs        Question bank, rating and chart tests
tools/browser-smoke.mjs       Optional end-to-end browser test
```

### The return data file

One file per organisation, described by `schema/return.schema.json`. It holds **answers only** — there is nothing in it that reveals how answers are scored:

```jsonc
{
  "schemaVersion": "2.0.0",
  "frameworkVersion": "2026.2",
  "period": "2026 Annual Return",
  "entity":  { "code": "E14", "name": "Central Primary Care Cluster", "type": "Primary Care Cluster", "region": "Central" },
  "contact": { "contactName": "S. Haddad", "contactRole": "Head of Information Security", "contactEmail": "…" },
  "submittedDate": "2026-05-14",
  "declarationConfirmed": true,
  "answers": {
    "A1": { "value": "unsure" },
    "A3": { "value": ["approved-tools", "data-limits"] },
    "A4": { "value": "annual" },
    "B5": { "value": 12 }
  },
  "sectionNotes": { "D": "Copilot is enabled in the back office only." },
  "progress": { "answered": 51, "total": 51, "percent": 100 }
}
```

The console recomputes everything from `answers`, so a return cannot arrive with a rating already baked in, and re-rating a past cycle against a new target is just a setting change.

Files from an earlier schema version are rejected with an explanation rather than silently mis-scored.

---

## Testing

```bash
node tools/test-scoring.mjs          # 148 checks, no dependencies
```

Covers the question bank (weights total 100, every question maps to a real framework, list options run worst to best, no maturity jargon in the wording), the answer-to-value rules, `Not sure` and `Not applicable` handling, the weighted arithmetic against hand-calculated figures, the action ranking, sector aggregation, framework coverage and the chart renderers. It also asserts the **separation between the two audiences**: the questionnaire must not call the rating engine, must not read the rating bands, and must not link to the console.

```bash
npm install --no-save puppeteer-core
CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs    # 79 checks
```

Drives real Chrome through the whole cycle: completes all 51 questions through the actual inputs, asserts the page never shows a score or rating, checks the printed return reproduces every answer in words, downloads the data file and validates it against the schema, then loads it into the console and confirms the derived rating matches the shared engine exactly — including every section. It also exercises the target-band setting, the organisation report, the question analysis, both PDF exports and the rejection of an out-of-date schema. Screenshots, PDFs and the exported return land in `tools/.artifacts/`.

---

## Feeding a BI tool later

The console is self-sufficient, but the exports are shaped for onward use:

- **Answer-level CSV** — one row per organisation × question, with the answer in words, the derived value and the framework mapping. Pivots straight into a matrix visual in Power BI or Tableau.
- **Organisation CSV** — one row per organisation with a column per section, ready for conditional formatting.
- **Combined JSON** — the sector summary plus every raw return, for a warehouse. `entity.code`, `period` and `frameworkVersion` form a natural key for tracking across cycles. Store the raw `answers` and recompute with `assets/js/scoring.js`, which is plain side-effect-free JavaScript, so history stays consistent if the weights change.
