# AI in Cybersecurity — Maturity Assessment Toolkit

A self-contained assessment pack for a health sector governing body that oversees **30 member entities**. It answers one question: *how well is each entity adopting artificial intelligence inside its cybersecurity programme?*

Two pages, no build step, no server, no external libraries:

| Page | Purpose |
| --- | --- |
| `index.html` | The questionnaire completed by each entity. Scores live, exports a **PDF report** and a **JSON data file**. |
| `dashboard.html` | The governing body view. Loads every entity's JSON export and aggregates it into a sector dashboard. |

Everything runs client-side. Nothing is uploaded anywhere: answers stay in the browser until the respondent exports a file.

---

## Quick start

Open `index.html` in a modern browser — double-clicking the file works, because there are no module imports or `fetch` calls.

To share it with 30 entities, host the folder on any static web server or intranet share:

```bash
python3 -m http.server 8080     # then browse to http://localhost:8080/
```

Recommended cycle:

1. Each entity opens `index.html`, selects itself, answers the 54 statements and adds evidence notes.
2. The entity clicks **Export PDF** for the signed report and **Download JSON** for the data file.
3. The governing body opens `dashboard.html` and drops all 30 JSON files onto it at once.
4. The dashboard produces the sector view, and **Export PDF** turns it into the board report.

No submissions yet? Click **Load demo dataset (synthetic)** on the dashboard to see the full sector view populated with generated scores. Demo rows are labelled `demo` so they are never mistaken for real data.

---

## The assessment framework

**54 statements across 10 weighted domains**, drawing on NIST AI RMF 1.0, NIST CSF 2.0, ISO/IEC 42001, ISO/IEC 27001 and health-sector cybersecurity practice.

| Code | Domain | Weight | Questions |
| --- | --- | --- | --- |
| `GOV` | AI Governance, Policy & Accountability | 12% | 6 |
| `STR` | Strategy, Roadmap & Investment | 8% | 5 |
| `DAT` | Data Foundation, Telemetry & Integration | 12% | 6 |
| `DET` | AI-Driven Threat Detection & Monitoring | 14% | 6 |
| `RES` | AI-Assisted Response & Automation | 12% | 6 |
| `IAM` | Identity, Access & Insider Risk Analytics | 8% | 4 |
| `VUL` | Vulnerability, Exposure & Threat Intelligence | 8% | 5 |
| `SEC` | Securing AI Itself (AI Attack Surface) | 10% | 6 |
| `MED` | Medical Device & Clinical System Protection | 8% | 5 |
| `PPL` | People, Skills & Third-Party Ecosystem | 8% | 5 |

Two domains are deliberately health-specific: `MED` covers analytics on connected medical devices without disrupting care, and several `IAM`/`DAT` statements deal with patient-record access monitoring and PHI minimisation before data reaches an AI system.

### Answer scale

Each statement is scored 0–5, or marked **N/A** when it genuinely does not apply to the entity.

| Score | Meaning |
| --- | --- |
| 0 | **None** — not in place |
| 1 | **Initial** — ad-hoc, undocumented, individual effort |
| 2 | **Developing** — partially implemented or piloted, inconsistent |
| 3 | **Defined** — documented, approved, consistently applied to critical scope |
| 4 | **Managed** — measured with KPIs, broad coverage, regularly reviewed |
| 5 | **Optimising** — continuously improved, largely automated, benchmarked |

### Maturity levels

| Level | Name | Score band | Index |
| --- | --- | --- | --- |
| 1 | Initial | 0.00 – 1.49 | 0–29% |
| 2 | Developing | 1.50 – 2.49 | 30–49% |
| 3 | Defined | 2.50 – 3.49 | 50–69% |
| 4 | Managed | 3.50 – 4.49 | 70–89% |
| 5 | Optimising | 4.50 – 5.00 | 90–100% |

The default **target** is Level 4 (Managed); it is selectable per assessment.

---

## How the score is calculated

Two levels of weighting, so that heavier domains and core controls move the number more.

**1 — Domain score** is the weighted mean of its answered questions. Core controls carry weight 1.5, standard controls 1.0. `N/A` answers leave both the numerator and the denominator:

```
domainScore = Σ(answerValue × questionWeight) / Σ(questionWeight)
```

**2 — Overall score** is the domain scores weighted by domain weight. A domain where every question is unanswered or `N/A` is excluded rather than counted as zero:

```
overallScore = Σ(domainScore × domainWeight) / Σ(domainWeight of scored domains)
```

**Maturity index** is simply `overallScore / 5 × 100`, for stakeholders who prefer a percentage.

**Priority ranking** for the improvement plan multiplies impact by distance from target:

```
priorityScore = (targetLevel − answerValue) × questionWeight × domainWeight
```

`≥ 30` becomes Priority 1, `≥ 15` Priority 2, anything else Priority 3. Every question carries a pre-written remediation sentence, so the improvement plan writes itself from the answers.

Partial assessments still score: the report states how many questions were answered, and the dashboard shows completion per entity.

---

## Outputs

### PDF report (`Export PDF`)

Uses the browser's print dialog with a dedicated print stylesheet — choose *Save as PDF* as the destination. The report is 11–12 A4 pages and contains a letterhead, the summary and gauge, the domain radar and bar charts, the domain detail table, the full ranked improvement plan, established strengths, a sign-off block, and **Appendix A** with every answer and evidence note.

The dashboard prints its own sector report the same way.

### JSON export (`Download JSON`)

The machine-readable record, one file per entity, named `ai-maturity_<entity>_<cycle>.json`. Its structure is documented in `schema/assessment.schema.json` (JSON Schema draft-07). Abridged:

```jsonc
{
  "schemaVersion": "1.0.0",
  "frameworkVersion": "2026.1",
  "id": "assess-m8x2k1-a7f3d9",
  "entity":     { "code": "E01", "name": "Central Medical City", "type": "Tertiary Hospital", "region": "Central", "size": "…" },
  "respondent": { "name": "A. Rahman", "role": "Chief Information Security Officer", "email": "…" },
  "status": "Submitted",
  "period": "2026 H1",
  "assessmentDate": "2026-03-15",
  "targetLevel": 4,
  "answers": {
    "GOV-1": { "value": 4, "note": "Policy approved by the board in November 2025." },
    "GOV-2": { "value": "na", "note": "" }
  },
  "domainNotes": { "MED": "Biomedical inventory migration completes this cycle." },
  "results": {
    "overall":      { "score": 2.92, "percent": 58.4, "level": 3, "levelName": "Defined", "gapToTarget": 1.08 },
    "domains":      [ { "domainId": "GOV", "weight": 12, "score": 3.29, "level": 3, "…": "…" } ],
    "completeness": { "answered": 54, "total": 54, "percent": 100, "notApplicable": 0 },
    "actions":      [ { "questionId": "SEC-2", "priority": 1, "gap": 3, "action": "Implement input/output guardrails…" } ]
  }
}
```

`results` is a convenience snapshot. The dashboard **recomputes** every score from `answers`, so a hand-edited results block can never skew the sector view.

### CSV exports

For Excel and BI tools: one row per question on the assessment page, and both an entity-level and a control-level export on the dashboard.

---

## The dashboard

Drop in any number of assessment files (or a previously exported combined file) and you get:

- **KPI strip** — entities assessed against the 30-entity register, sector average and median, entities at or above target, entities at risk (Level 1–2), average completion.
- **Maturity level distribution** and a **coverage panel** naming the entities that have not yet submitted.
- **Sector radar** against the target line, with an optional overlay of any single entity.
- **Domain table** with average, lowest, highest, spread, and how many entities sit below target per domain.
- **Entity ranking** bar chart and an **entity × domain heatmap** — the fastest way to spot a systemic weakness (a cold column) versus a struggling entity (a cold row).
- **Sortable entity table** with a per-entity profile panel: its radar versus the sector average and target, plus its top priority actions.
- **Weakest controls sector-wide** and **most common priority actions** — the shortlist for a shared or centrally funded programme.
- **Average score by entity type and by region**.

Filters (type, region, cycle, level, search) apply to every chart and table at once, so "show me only the primary care clusters" is one click.

Loaded assessments persist in the browser's local storage, so refreshing the page does not lose them. **Clear all data** removes them.

---

## Customising

Everything below lives in one file, `assets/js/framework.js`:

- **Entity register** — replace the 30 entries in `AIMA.entities` with your own codes, names, types, regions and size bands. The dashboard's coverage figures follow this list automatically.
- **Questions** — edit, add or remove entries in `AIMA.domains[].questions`. Each needs an `id` (`DOMAIN-n`), `text`, `weight` (1 or 1.5), `help` and `remedy`. The remedy is what appears in the improvement plan.
- **Domain weights** — adjust `weight` on each domain; they must total 100. The test suite enforces this.
- **Scale and level bands** — `AIMA.scale` and `AIMA.levels`.
- **Branding** — `AIMA.meta.owner` sets the letterhead line on both printed reports. Colours are CSS custom properties at the top of `assets/css/styles.css`.

When you change the question set, bump `AIMA.meta.frameworkVersion` so historical exports stay identifiable.

---

## Data protection

Assessment responses describe security weaknesses and are sensitive. The toolkit never transmits data — the only ways data leaves the browser are the export buttons. Two consequences worth stating in your rollout note:

- Drafts sit in the browser's local storage on the respondent's machine. On a shared workstation, use **Clear form and start over** when finished.
- Distribute completed JSON and PDF files over a controlled channel, and keep evidence notes free of credentials, IP addresses and patient identifiers.

---

## Repository layout

```
index.html                        Entity questionnaire
dashboard.html                    Governing body sector dashboard
assets/css/styles.css             Screen theme plus the A4 print stylesheet
assets/js/framework.js            Domains, questions, weights, scale, entity register
assets/js/scoring.js              Scoring and aggregation engine (pure functions)
assets/js/charts.js               Dependency-free SVG radar, bars, gauge, heatmap, columns
assets/js/util.js                 Storage, file download/upload, CSV, formatting
assets/js/survey.js               Questionnaire page controller
assets/js/dashboard.js            Dashboard page controller
schema/assessment.schema.json     JSON Schema for the entity export
tools/test-scoring.mjs            Framework, scoring, aggregation and chart tests
tools/browser-smoke.mjs           Optional end-to-end browser check
```

---

## Testing

The scoring tests need nothing but Node:

```bash
node tools/test-scoring.mjs      # 103 checks: framework integrity, weighting, levels,
                                 # N/A handling, action ranking, aggregation, chart output
```

The end-to-end check drives a real Chrome through the whole workflow — completing the questionnaire, verifying the on-screen score against the engine, exporting the JSON, printing both PDFs and loading the export into the dashboard:

```bash
npm install --no-save puppeteer-core
CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs
```

It writes screenshots, both PDFs and the exported JSON to `tools/.artifacts/`. Puppeteer is intentionally not a project dependency: the toolkit itself has none.

---

## Feeding a BI dashboard

`dashboard.html` is self-sufficient, but the exports are designed to drop straight into an external tool when you want scheduled refreshes or to join this data with other sources:

- **Power BI / Tableau** — point the connector at a folder of entity JSON files, or use *Export control-level CSV* for a tall table (`entity × question × score`) that pivots directly into a matrix visual.
- **Excel** — *Export entity CSV* gives one row per entity with a column per domain, ready for conditional formatting as a heatmap.
- **Warehouse** — `id`, `entity.code`, `period` and `frameworkVersion` form a natural key for tracking maturity trends across cycles. Store the raw `answers` object and recompute scores with `assets/js/scoring.js` (it is plain, side-effect-free JavaScript) so history stays consistent if weights change.
