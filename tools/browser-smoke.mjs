/*
 * End-to-end browser check (optional tooling).
 *
 * Serves the toolkit over a local static server, then drives a real Chrome
 * instance to: complete the questionnaire, verify the computed score in the UI,
 * export the JSON, print the PDF report, and load that JSON into the dashboard.
 *
 * Requires Chrome plus puppeteer-core, which are deliberately NOT project
 * dependencies — the toolkit itself is plain HTML/CSS/JS with no build step.
 *
 *   npm install --no-save puppeteer-core
 *   CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs
 *
 * Output (screenshots, PDF, exported JSON) is written to tools/.artifacts/.
 */
import http from 'node:http';
import { readFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const puppeteer = (await import('puppeteer-core')).default;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'tools', '.artifacts');
const chromePath = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown'
};

const failures = [];
let passed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = join(root, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* A deliberately uneven profile so the charts and the action plan have shape. */
const PROFILE = {
  GOV: [4, 3, 4, 3, 2, 3],
  STR: [3, 2, 2, 3, 3],
  DAT: [4, 4, 4, 3, 3, 3],
  DET: [4, 4, 3, 3, 4, 4],
  RES: [3, 4, 2, 3, 2, 3],
  IAM: [4, 4, 3, 2],
  VUL: [3, 3, 4, 2, 2],
  SEC: [2, 1, 1, 1, 2, 2],
  MED: [3, 2, 2, 1, 3],
  PPL: [3, 3, 2, 3, 4]
};

async function main() {
  await rm(artifacts, { recursive: true, force: true });
  await mkdir(artifacts, { recursive: true });

  if (!existsSync(chromePath)) {
    console.error(`Chrome not found at ${chromePath}. Set CHROME_PATH.`);
    process.exit(2);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000'],
    defaultViewport: { width: 1440, height: 1000 }
  });

  const consoleErrors = [];
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(String(err)));

  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: artifacts });

  /* ---------------- Questionnaire ---------------- */
  console.log('\nQuestionnaire page');
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });

  const questionCount = await page.$$eval('.question', els => els.length);
  check('every framework question is rendered', questionCount === 54, `found ${questionCount}`);
  const domainCount = await page.$$eval('.domain-block', els => els.length);
  check('every domain block is rendered', domainCount === 10, `found ${domainCount}`);

  await page.select('#entitySelect', 'E01');
  await page.type('#respondentName', 'A. Rahman');
  await page.type('#respondentRole', 'Chief Information Security Officer');
  await page.type('#respondentEmail', 'ciso@central-medical-city.example');
  await page.$eval('#periodInput', el => { el.value = ''; });
  await page.type('#periodInput', '2026 H1');
  await page.select('#statusSelect', 'Submitted');
  await page.type('#scopeNotes', 'Covers the main campus and two satellite clinics. Radiology AI pilot excluded pending sign-off.');

  const entityName = await page.$eval('#footerStatus', el => el.textContent);
  check('selecting an entity updates the status bar', entityName.includes('Central Medical City'), entityName);

  // Answer every question from the profile.
  const expected = await page.evaluate(profile => {
    const answers = {};
    window.AIMA.domains.forEach(domain => {
      domain.questions.forEach((q, i) => {
        const value = profile[domain.id][i];
        answers[q.id] = { value };
        document.querySelector(`input[name="score-${q.id}"][value="${value}"]`).click();
      });
    });
    const results = window.AIMA.scoring.computeResults({ answers, targetLevel: 4 });
    return { score: results.overall.score, level: results.overall.level, percent: results.overall.percent };
  }, PROFILE);

  await page.click('[data-notetoggle="SEC-1"]');
  await page.type('[data-note="SEC-1"]', 'No discovery for unsanctioned GenAI use; policy drafted but not issued.');
  const noteVisible = await page.$eval('[data-notebox="SEC-1"]', el => !el.hidden);
  check('the evidence note field expands on demand', noteVisible);
  await page.type('[data-domainnote="MED"]', 'Biomedical inventory migration to the new CMMS completes this cycle.');

  const progress = await page.$eval('#progressPercent', el => el.textContent);
  check('progress reaches 100%', progress.trim() === '100%', progress);

  const footer = await page.$eval('#footerStatus', el => el.textContent);
  check('live footer score matches the scoring engine',
    footer.includes(expected.score.toFixed(2)) && footer.includes(`Level ${expected.level}`), footer);

  await page.screenshot({ path: join(artifacts, 'survey_questionnaire.png'), fullPage: false });

  /* ---------------- Results ---------------- */
  console.log('\nResults view');
  await page.click('#tab-results');
  await new Promise(r => setTimeout(r, 350));

  const gaugeText = await page.$eval('#overallGauge', el => el.textContent);
  check('gauge shows the overall score', gaugeText.includes(expected.score.toFixed(2)), gaugeText.trim());

  const headline = await page.$eval('#overallHeadline', el => el.textContent);
  check('headline shows the maturity level', headline.includes(`Level ${expected.level}`), headline.trim());

  const svgCount = await page.$$eval('#view-results svg', els => els.length);
  check('results view renders gauge, radar and bar charts', svgCount >= 3, `found ${svgCount}`);

  const radarPoints = await page.$$eval('#radarChart circle', els => els.length);
  check('radar plots one marker per domain', radarPoints === 10, `found ${radarPoints}`);

  const domainRows = await page.$$eval('#domainTable tbody tr', els => els.length);
  check('domain table lists every domain', domainRows === 10, `found ${domainRows}`);

  const actionCount = await page.$$eval('#actionPlan .action-list li', els => els.length);
  check('improvement plan lists actions for sub-target controls', actionCount > 10, `found ${actionCount}`);

  const p1Count = await page.$$eval('#actionPlan .action-list li.p1', els => els.length);
  check('priority 1 actions are highlighted', p1Count > 0, `found ${p1Count}`);

  const appendixRows = await page.$$eval('#answerAppendix tbody tr', els => els.length);
  check('print appendix logs every answer', appendixRows >= 54, `found ${appendixRows}`);

  const signoff = await page.$eval('#signoffRespondent', el => el.textContent);
  check('sign-off block names the respondent', signoff.includes('A. Rahman'), signoff);

  await page.screenshot({ path: join(artifacts, 'survey_results_top.png') });
  await page.screenshot({ path: join(artifacts, 'survey_results.png'), fullPage: true });

  /* ---------------- PDF ---------------- */
  console.log('\nPDF export');
  await page.pdf({
    path: join(artifacts, 'assessment_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '13mm', bottom: '13mm', left: '12mm', right: '12mm' }
  });
  const pdfBytes = (await readFile(join(artifacts, 'assessment_report.pdf'))).length;
  check('PDF report is produced', pdfBytes > 20000, `${pdfBytes} bytes`);

  const printHidden = await page.evaluate(() => {
    const style = window.getComputedStyle(document.querySelector('.app-header'));
    return style.display;
  });
  check('print stylesheet keeps the app header on screen', printHidden !== 'none', printHidden);

  await page.emulateMediaType('print');
  await page.setViewport({ width: 794, height: 1123 });
  const printChrome = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector('.app-header')).display,
    letterhead: getComputedStyle(document.querySelector('.report-header')).display,
    appendix: getComputedStyle(document.querySelector('#appendixCard')).display
  }));
  check('print view hides the app chrome', printChrome.header === 'none', printChrome.header);
  check('print view shows the report letterhead', printChrome.letterhead === 'block', printChrome.letterhead);
  check('print view reveals the response appendix', printChrome.appendix === 'block', printChrome.appendix);
  await page.screenshot({ path: join(artifacts, 'report_print_preview.png'), fullPage: true });
  await page.emulateMediaType('screen');
  await page.setViewport({ width: 1440, height: 1000 });

  /* ---------------- JSON export ---------------- */
  console.log('\nJSON export');
  await page.click('#tab-data');
  await new Promise(r => setTimeout(r, 200));
  await page.click('#btnExportJSON');
  await new Promise(r => setTimeout(r, 900));

  const files = await readdir(artifacts);
  const jsonFile = files.find(f => f.endsWith('.json'));
  check('clicking Download JSON writes a file', !!jsonFile, files.join(', '));

  let exported = null;
  if (jsonFile) {
    exported = JSON.parse(await readFile(join(artifacts, jsonFile), 'utf8'));
    check('export names the entity', exported.entity.name === 'Central Medical City', exported.entity.name);
    check('export contains all 54 answers', Object.keys(exported.answers).length === 54,
      String(Object.keys(exported.answers).length));
    check('export embeds the computed results', exported.results.overall.score === expected.score,
      `${exported.results?.overall?.score} vs ${expected.score}`);
    check('export keeps the evidence note', (exported.answers['SEC-1'].note || '').includes('unsanctioned GenAI'));
    check('export keeps domain observations', (exported.domainNotes.MED || '').includes('CMMS'));
    check('export declares a schema version', typeof exported.schemaVersion === 'string');

    const schema = JSON.parse(await readFile(join(root, 'schema', 'assessment.schema.json'), 'utf8'));
    const missingTop = schema.required.filter(key => exported[key] === undefined);
    check('export carries every field the published schema requires', missingTop.length === 0, missingTop.join(', '));
    const missingResults = schema.properties.results.required.filter(key => exported.results[key] === undefined);
    check('results block matches the published schema', missingResults.length === 0, missingResults.join(', '));
    const answerPattern = new RegExp(schema.properties.answers.propertyNames.pattern);
    check('every answer key matches the documented id pattern',
      Object.keys(exported.answers).every(k => answerPattern.test(k)));
    check('every answer value is 0–5 or "na"',
      Object.values(exported.answers).every(a => a.value === 'na' || (Number.isInteger(a.value) && a.value >= 0 && a.value <= 5)));
  }

  /* ---------------- Dashboard ---------------- */
  console.log('\nDashboard');
  const dash = await browser.newPage();
  dash.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('dashboard: ' + msg.text()); });
  dash.on('pageerror', err => consoleErrors.push('dashboard: ' + String(err)));
  await dash.goto(`${base}/dashboard.html`, { waitUntil: 'networkidle0' });

  const emptyVisible = await dash.$eval('#emptyState', el => !el.hidden);
  check('dashboard starts in the empty state', emptyVisible);

  const input = await dash.$('#fileInput');
  await input.uploadFile(join(artifacts, jsonFile));
  await new Promise(r => setTimeout(r, 700));

  const kpiCount = await dash.$$eval('#kpiGrid .kpi', els => els.length);
  check('dashboard renders the KPI cards after import', kpiCount === 6, `found ${kpiCount}`);

  const kpiText = await dash.$eval('#kpiGrid', el => el.textContent);
  check('imported score appears in the KPIs', kpiText.includes(expected.score.toFixed(2)), kpiText.slice(0, 160));
  check('coverage counts against the 30-entity register', kpiText.includes('1 / 30'), kpiText.slice(0, 160));

  const tableRows = await dash.$$eval('#entityTable tbody tr', els => els.length);
  check('entity table has one row for the imported entity', tableRows === 1, `found ${tableRows}`);

  await dash.click('#btnDemo');
  await new Promise(r => setTimeout(r, 900));

  const demoRows = await dash.$$eval('#entityTable tbody tr', els => els.length);
  check('demo dataset fills the 30-entity register', demoRows === 30, `found ${demoRows}`);

  const heatCells = await dash.$$eval('#heatmap rect', els => els.length);
  check('heatmap renders a cell per entity and domain', heatCells === 30 * 11, `found ${heatCells}`);

  const rankingBars = await dash.$$eval('#entityRanking rect', els => els.length);
  check('ranking chart renders a bar per entity', rankingBars === 30 * 2, `found ${rankingBars}`);

  const weakRows = await dash.$$eval('#weakTable tbody tr', els => els.length);
  check('weakest-control table is populated', weakRows === 12, `found ${weakRows}`);

  await dash.select('#filterType', 'Tertiary Hospital');
  await new Promise(r => setTimeout(r, 400));
  const filteredRows = await dash.$$eval('#entityTable tbody tr', els => els.length);
  check('type filter narrows the entity table', filteredRows === 2, `found ${filteredRows}`);
  await dash.click('#btnResetFilters');
  await new Promise(r => setTimeout(r, 400));

  await dash.$eval('#entityTable tbody tr:first-child [data-view-entity]', el => el.click());
  await new Promise(r => setTimeout(r, 500));
  const detailVisible = await dash.$eval('#entityDetailCard', el => !el.hidden);
  check('entity profile panel opens', detailVisible);
  const detailRadars = await dash.$$eval('#entityDetailBody svg', els => els.length);
  check('entity profile draws a comparison radar', detailRadars === 1, `found ${detailRadars}`);

  await dash.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 250));
  await dash.screenshot({ path: join(artifacts, 'dashboard_overview.png'), fullPage: false });
  await dash.evaluate(() => {
    document.getElementById('heatmap').scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 250));
  await dash.screenshot({ path: join(artifacts, 'dashboard_heatmap.png'), fullPage: false });
  await dash.evaluate(() => window.scrollTo(0, 0));
  await dash.screenshot({ path: join(artifacts, 'dashboard_full.png'), fullPage: true });
  await dash.pdf({
    path: join(artifacts, 'sector_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '13mm', bottom: '13mm', left: '12mm', right: '12mm' }
  });
  const sectorPdf = (await readFile(join(artifacts, 'sector_report.pdf'))).length;
  check('sector PDF report is produced', sectorPdf > 20000, `${sectorPdf} bytes`);

  check('no console or page errors were raised', consoleErrors.length === 0, consoleErrors.join(' | '));

  await browser.close();
  server.close();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`Artifacts written to ${artifacts}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(` - ${f}`));
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
