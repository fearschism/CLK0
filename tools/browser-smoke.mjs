/*
 * End-to-end browser check (optional tooling).
 *
 * Serves the pack over a local static server, then drives a real Chrome to:
 *   1. complete the questionnaire as a reporting organisation would;
 *   2. confirm the questionnaire never shows a rating;
 *   3. save the PDF and the data file;
 *   4. validate the data file against the published schema;
 *   5. load it into the governing body console and confirm the derived rating
 *      matches what the shared engine calculates from the same answers.
 *
 * Chrome and puppeteer-core are deliberately not project dependencies.
 *
 *   npm install --no-save puppeteer-core
 *   CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs
 *
 * Screenshots, PDFs and the exported return land in tools/.artifacts/.
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

const wait = ms => new Promise(r => setTimeout(r, ms));

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
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1460,1020'],
    defaultViewport: { width: 1460, height: 1020 }
  });

  const consoleErrors = [];
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('survey: ' + msg.text()); });
  page.on('pageerror', err => consoleErrors.push('survey: ' + String(err)));

  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: artifacts });

  /* ------------------- Questionnaire: structure ------------------- */
  console.log('\nQuestionnaire — structure');
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });

  const counts = await page.evaluate(() => ({
    questions: document.querySelectorAll('.q').length,
    steps: document.querySelectorAll('#stepContainer .step').length,
    navItems: document.querySelectorAll('#stepNav button').length,
    frameworkQuestions: window.AIMA.questionCount,
    sections: window.AIMA.sections.length
  }));
  check('every question is rendered', counts.questions === counts.frameworkQuestions,
    `${counts.questions} of ${counts.frameworkQuestions}`);
  check('there is a step per section plus intro, details and finish',
    counts.steps === counts.sections + 3, `found ${counts.steps}`);
  check('the step list matches the number of steps', counts.navItems === counts.steps);

  const brandApplied = await page.evaluate(() => ({
    org: document.querySelector('[data-brand="organisation"]').textContent,
    classification: document.querySelector('.classification-bar').textContent.trim(),
    logo: document.querySelector('.site-header .crest').getAttribute('src'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim(),
    title: document.title
  }));
  check('client branding is applied to the letterhead',
    brandApplied.org === 'National Health Authority', brandApplied.org);
  check('the classification banner is shown', /Official/.test(brandApplied.classification), brandApplied.classification);
  check('the client logo is used', /brand\/logo\.svg$/.test(brandApplied.logo), brandApplied.logo);
  check('brand colours reach the CSS variables', brandApplied.accent === '#0e8b7d', brandApplied.accent);
  check('the page title carries the client short name', /NHA$/.test(brandApplied.title), brandApplied.title);

  const inputTypes = await page.evaluate(() => {
    const types = new Set();
    document.querySelectorAll('.q .q-input').forEach(el => {
      if (el.querySelector('.opt-row')) types.add('yesno');
      if (el.querySelector('select')) types.add('combo');
      if (el.querySelector('.check-list')) types.add('checkbox');
      if (el.querySelector('input[type="number"]')) types.add('number');
      if (el.querySelector('textarea')) types.add('freetext');
    });
    return [...types];
  });
  check('questions use yes/no pills, combo boxes, tick boxes and numbers only',
    ['yesno', 'combo', 'checkbox', 'number'].every(t => inputTypes.includes(t)) && !inputTypes.includes('freetext'),
    inputTypes.join(', '));

  const surveyWords = await page.evaluate(() => document.body.textContent.toLowerCase());
  check('the questionnaire never shows a score, rating or maturity level to the respondent',
    !/maturity|weighted|benchmark|\bscore\b|\brated\b/.test(surveyWords),
    (surveyWords.match(/maturity|weighted|benchmark|\bscore\b|\brated\b/g) || []).join(', '));

  await page.screenshot({ path: join(artifacts, 'survey_intro.png') });

  /* ------------------- Questionnaire: completion ------------------- */
  console.log('\nQuestionnaire — completing it');
  await page.click('[data-step="intro"] [data-goto-next]');
  await wait(200);

  const blocked = await page.evaluate(() => {
    document.querySelector('[data-step="details"] [data-goto-next]').click();
    return !document.querySelector('[data-step="details"]').hasAttribute('hidden');
  });
  check('the form refuses to continue without the required details', blocked);

  await page.select('#entitySelect', 'E14');
  await page.type('#contactName', 'S. Haddad');
  await page.type('#contactRole', 'Head of Information Security');
  await page.type('#contactEmail', 'security@central-pcc.health.example');
  await page.type('#contactPhone', '+000 0000 0000');
  await page.type('#approverName', 'Dr M. Aziz, Chief Executive');

  const autofilled = await page.evaluate(() => ({
    type: document.getElementById('entityTypeSelect').value,
    region: document.getElementById('regionSelect').value
  }));
  check('choosing an organisation fills in its type and region',
    autofilled.type === 'Primary Care Cluster' && autofilled.region === 'Central',
    JSON.stringify(autofilled));

  await page.click('[data-step="details"] [data-goto-next]');
  await wait(200);
  const movedOn = await page.evaluate(() => document.querySelector('[data-step="A"]') &&
    !document.querySelector('[data-step="A"]').hasAttribute('hidden'));
  check('completing the details unlocks the first section', movedOn);

  // Answer every question through the real inputs, with a deliberately uneven
  // profile so the console has something interesting to rate.
  const expected = await page.evaluate(() => {
    const AIMA = window.AIMA;
    const answers = {};

    AIMA.allQuestions.forEach((question, index) => {
      if (question.type === 'yesno') {
        const value = index % 7 === 0 ? 'unsure' : (index % 3 === 0 ? 'no' : 'yes');
        document.querySelector(`#q-${question.id} input[value="${value}"]`).click();
        answers[question.id] = { value };
      } else if (question.type === 'choice') {
        const pick = question.options[Math.min(question.options.length - 1, 1 + (index % 3))];
        const select = document.querySelector(`#q-${question.id} select`);
        select.value = pick.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        answers[question.id] = { value: pick.value };
      } else if (question.type === 'multi') {
        const take = Math.ceil(question.options.length / 2);
        const chosen = question.options.slice(0, take).map(o => o.value);
        chosen.forEach(value => {
          document.querySelector(`#q-${question.id} input[value="${value}"]`).click();
        });
        answers[question.id] = { value: chosen };
      } else if (question.type === 'number') {
        const input = document.querySelector(`#q-${question.id} input[type="number"]`);
        input.value = '12';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        answers[question.id] = { value: 12 };
      }
    });

    const noteBox = document.querySelector('[data-sectionnote="D"]');
    noteBox.value = 'Copilot is enabled in the back office only; no clinical use yet.';
    noteBox.dispatchEvent(new Event('input', { bubbles: true }));

    const results = AIMA.scoring.computeResults({ answers, targetLevel: 4 });
    return {
      score: results.overall.score,
      levelName: results.overall.levelName,
      unsure: results.visibility.unsureCount,
      p1: results.priorityCounts.p1,
      sectionScores: results.sections.map(s => ({ id: s.sectionId, score: s.score }))
    };
  });

  const progress = await page.evaluate(() => ({
    text: document.getElementById('progressText').textContent,
    percent: document.getElementById('progressPercent').textContent,
    width: document.getElementById('progressBar').style.width
  }));
  check('the progress bar reaches 100%', progress.percent.trim() === '100%', JSON.stringify(progress));
  check('the progress bar is filled', progress.width === '100%', progress.width);

  const markers = await page.evaluate(() =>
    [...document.querySelectorAll('#stepNav .marker')].filter(m => m.classList.contains('done')).length);
  check('every section is marked complete in the step list', markers === counts.sections + 1, String(markers));

  await page.screenshot({ path: join(artifacts, 'survey_questions.png') });

  /* ------------------- Questionnaire: finish step ------------------- */
  console.log('\nQuestionnaire — finishing');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('#stepNav button');
    buttons[buttons.length - 1].click();
  });
  await wait(300);

  const finish = await page.evaluate(() => ({
    status: document.getElementById('finishStatus').textContent,
    reviewRows: document.querySelectorAll('#reviewTable tbody tr').length,
    missingCells: document.querySelectorAll('#reviewTable .missing').length
  }));
  check('the finish step confirms all questions are answered',
    /All questions answered/.test(finish.status), finish.status.trim().slice(0, 80));
  check('the check-your-answers table lists every question and section heading',
    finish.reviewRows === counts.frameworkQuestions + counts.sections, String(finish.reviewRows));
  check('nothing is flagged as missing', finish.missingCells === 0, String(finish.missingCells));

  await page.click('#declarationCheck');
  const declared = await page.evaluate(() => document.getElementById('declarationCheck').checked);
  check('the respondent can confirm the declaration', declared);

  await page.screenshot({ path: join(artifacts, 'survey_finish.png') });

  /* ------------------- Printed return ------------------- */
  console.log('\nQuestionnaire — PDF');
  await page.emulateMediaType('print');
  await page.setViewport({ width: 794, height: 1123 });
  // What the browser does for Ctrl+P; the button path calls the same code.
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const printState = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector('.site-header')).display,
    letterhead: getComputedStyle(document.querySelector('#printLetterhead')).display,
    steps: getComputedStyle(document.querySelector('#stepContainer')).display,
    summary: getComputedStyle(document.querySelector('#printSummary')).display,
    tables: document.querySelectorAll('#printSummary table').length,
    rows: document.querySelectorAll('#printSummary tbody tr').length,
    text: document.querySelector('#printSummary').textContent
  }));
  check('the printed return hides the interactive form', printState.steps === 'none', printState.steps);
  check('the printed return shows the letterhead', printState.letterhead === 'flex', printState.letterhead);
  check('the printed return shows the completed summary', printState.summary === 'block', printState.summary);
  check('the printed return has a table per section plus details and sign-off',
    printState.tables === counts.sections + 2, String(printState.tables));
  check('the printed return lists every answer', printState.rows >= counts.frameworkQuestions, String(printState.rows));
  check('the printed return records the respondent and approver',
    /S\. Haddad/.test(printState.text) && /Dr M\. Aziz/.test(printState.text));
  check('the printed return repeats the answers in words, not scores',
    /Not sure/.test(printState.text) && !/\b[0-5]\s*\/\s*5\b/.test(printState.text));
  check('the printed return carries the return instructions',
    /Return to/.test(printState.text) && /31 May 2026/.test(printState.text));

  await page.screenshot({ path: join(artifacts, 'survey_print_preview.png'), fullPage: true });
  await page.pdf({
    path: join(artifacts, 'completed_return.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  const returnPdf = (await readFile(join(artifacts, 'completed_return.pdf'))).length;
  check('a PDF of the completed return is produced', returnPdf > 20000, `${returnPdf} bytes`);

  await page.emulateMediaType('screen');
  await page.setViewport({ width: 1460, height: 1020 });

  /* ------------------- Data file ------------------- */
  console.log('\nQuestionnaire — data file');
  await page.click('#btnDownloadJSON');
  await wait(900);

  const files = await readdir(artifacts);
  const jsonFile = files.find(f => f.endsWith('.json'));
  check('the data file downloads', !!jsonFile, files.join(', '));

  let exported = null;
  if (jsonFile) {
    exported = JSON.parse(await readFile(join(artifacts, jsonFile), 'utf8'));
    check('the data file names the organisation', exported.entity.name === 'Central Primary Care Cluster', exported.entity.name);
    check('the data file holds every answer',
      Object.keys(exported.answers).length === counts.frameworkQuestions, String(Object.keys(exported.answers).length));
    check('the data file keeps the respondent details', exported.contact.contactName === 'S. Haddad');
    check('the data file records the declaration', exported.declarationConfirmed === true);
    check('the data file keeps the section comment', /Copilot/.test(exported.sectionNotes.D || ''));
    check('answers are stored in plain values, not scores',
      exported.answers.A1.value === expectedValue(exported.answers.A1.value) &&
      typeof exported.answers.A1.value === 'string' &&
      ['yes', 'no', 'unsure', 'na'].includes(exported.answers.A1.value),
      JSON.stringify(exported.answers.A1));
    check('the data file contains no ratings at all',
      !JSON.stringify(exported).match(/"results"|"overall"|"levelName"|"maturity"/),
      'found rating data in the return file');

    const schema = JSON.parse(await readFile(join(root, 'schema', 'return.schema.json'), 'utf8'));
    const missing = schema.required.filter(key => exported[key] === undefined);
    check('the data file carries every field the schema requires', missing.length === 0, missing.join(', '));
    const keyPattern = new RegExp(schema.properties.answers.propertyNames.pattern);
    check('every answer key matches the documented pattern',
      Object.keys(exported.answers).every(k => keyPattern.test(k)));
    const notePattern = new RegExp(schema.properties.sectionNotes.propertyNames.pattern);
    check('every section comment key matches the documented pattern',
      Object.keys(exported.sectionNotes).every(k => notePattern.test(k)));
  }

  function expectedValue(v) { return v; }

  /* ------------------- Console ------------------- */
  console.log('\nConsole');
  const dash = await browser.newPage();
  dash.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('console: ' + msg.text()); });
  dash.on('pageerror', err => consoleErrors.push('console: ' + String(err)));
  await dash.goto(`${base}/console.html`, { waitUntil: 'networkidle0' });

  check('the console starts empty', await dash.$eval('#emptyState', el => !el.hidden));
  check('the console is labelled for the governing body only',
    /governing body/i.test(await dash.$eval('.classification-bar', el => el.textContent)));

  await dash.click('#tab-data');
  await wait(200);
  await (await dash.$('#fileInput')).uploadFile(join(artifacts, jsonFile));
  await wait(800);

  const loaded = await dash.evaluate(() => ({
    pill: document.getElementById('recordCountPill').textContent,
    rows: document.querySelectorAll('#recordTable tbody tr').length,
    declared: document.querySelectorAll('#recordTable tbody tr td:nth-child(7)')[0].textContent.trim()
  }));
  check('the console accepts the return', /1 return loaded/.test(loaded.pill), loaded.pill);
  check('the return is listed on the returns tab', loaded.rows === 1, String(loaded.rows));
  check('the console shows the declaration status', loaded.declared === 'Yes', loaded.declared);

  await dash.click('#tab-dashboard');
  await wait(400);

  const derived = await dash.evaluate(() => {
    const cells = document.querySelectorAll('#entityTable tbody tr:first-child td');
    return {
      code: cells[0].textContent.trim(),
      score: cells[4].textContent.trim(),
      band: cells[5].textContent.trim(),
      answered: cells[6].textContent.trim(),
      unsure: cells[7].textContent.trim(),
      kpis: document.getElementById('kpiGrid').textContent
    };
  });
  check('the console rates the return it was given', derived.score === expected.score.toFixed(2),
    `console ${derived.score} vs engine ${expected.score.toFixed(2)}`);
  check('the console shows the rating band in words', derived.band === expected.levelName,
    `${derived.band} vs ${expected.levelName}`);
  check('the console reports 100% of questions answered', derived.answered === '100%', derived.answered);
  check('the console counts the "not sure" answers', derived.unsure === String(expected.unsure),
    `${derived.unsure} vs ${expected.unsure}`);
  check('coverage is measured against the 30-organisation register', /1 \/ 30/.test(derived.kpis));

  const sectionMatch = await dash.evaluate(expectedSections => {
    const rows = [...document.querySelectorAll('#sectionTable tbody tr')];
    return rows.every((row, i) => {
      const shown = row.querySelectorAll('td')[2].textContent.trim();
      const want = expectedSections[i].score === null ? '—' : expectedSections[i].score.toFixed(2);
      return shown === want;
    });
  }, expected.sectionScores);
  check('every section rating matches the engine', sectionMatch);

  await dash.click('#tab-data');
  await wait(200);
  await dash.click('#btnDemo');
  await wait(400);
  await dash.click('#tab-dashboard');
  await wait(900);

  const withDemo = await dash.evaluate(() => ({
    rows: document.querySelectorAll('#entityTable tbody tr').length,
    heatCells: document.querySelectorAll('#heatmap rect').length,
    rankingBars: document.querySelectorAll('#entityRanking rect').length,
    radarSeries: document.querySelectorAll('#sectorRadar polygon').length,
    coverage: document.getElementById('coveragePanel').textContent
  }));
  check('demonstration data fills the register', withDemo.rows === 30, String(withDemo.rows));
  check('the heatmap draws a cell per organisation and section',
    withDemo.heatCells === 30 * (counts.sections + 1), String(withDemo.heatCells));
  check('the ranking chart draws a bar per organisation',
    withDemo.rankingBars === 30 * 2, String(withDemo.rankingBars));
  check('the sector radar draws its grid and both series', withDemo.radarSeries >= 7, String(withDemo.radarSeries));
  check('coverage reports a full return rate', /30 of 30/.test(withDemo.coverage));

  await dash.evaluate(() => window.scrollTo(0, 0));
  await wait(200);
  await dash.screenshot({ path: join(artifacts, 'console_dashboard.png') });
  await dash.evaluate(() => document.getElementById('heatmap').scrollIntoView({ block: 'center' }));
  await wait(250);
  await dash.screenshot({ path: join(artifacts, 'console_heatmap.png') });

  // Target level should change who is deemed to be meeting expectations.
  await dash.click('#tab-data');
  await wait(200);
  await dash.select('#targetSelect', '2');
  await wait(400);
  await dash.click('#tab-dashboard');
  await wait(500);
  const lowTarget = await dash.$eval('#kpiGrid', el => el.textContent);
  await dash.click('#tab-data');
  await dash.select('#targetSelect', '4');
  await wait(400);
  await dash.click('#tab-dashboard');
  await wait(500);
  const highTarget = await dash.$eval('#kpiGrid', el => el.textContent);
  check('changing the target changes who is meeting expectations', lowTarget !== highTarget);

  /* ------------------- Organisation report ------------------- */
  console.log('\nConsole — organisation report');
  await dash.click('#tab-entity');
  await wait(700);
  const report = await dash.evaluate(() => ({
    heading: document.querySelector('#entityReport h2') ? document.querySelector('#entityReport h2').textContent : '',
    charts: document.querySelectorAll('#entityReport svg').length,
    kpis: document.querySelectorAll('#entityReport .kpi').length,
    actions: document.querySelectorAll('#entityReport .action-list li').length,
    appendixRows: document.querySelectorAll('#entityReport .answer-log tbody tr').length,
    quotesAnswers: /They answered:/.test(document.getElementById('entityReport').textContent),
    frameworkTags: document.querySelectorAll('#entityReport .pill-ref').length
  }));
  check('the report names the organisation', /—/.test(report.heading), report.heading);
  check('the report draws a gauge, radar and bar chart', report.charts >= 3, String(report.charts));
  check('the report shows its summary indicators', report.kpis === 6, String(report.kpis));
  check('the report lists improvement actions', report.actions > 3, String(report.actions));
  check('each action quotes the answer that triggered it', report.quotesAnswers);
  check('actions cite the framework they come from', report.frameworkTags > 0, String(report.frameworkTags));
  check('the appendix reproduces every answer as submitted',
    report.appendixRows >= counts.frameworkQuestions, String(report.appendixRows));

  await dash.screenshot({ path: join(artifacts, 'console_entity_report.png') });
  await dash.pdf({
    path: join(artifacts, 'organisation_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  const entityPdf = (await readFile(join(artifacts, 'organisation_report.pdf'))).length;
  check('the organisation report exports as a PDF', entityPdf > 20000, `${entityPdf} bytes`);

  /* ------------------- Question analysis ------------------- */
  console.log('\nConsole — question analysis and method');
  await dash.click('#tab-questions');
  await wait(600);
  const analysis = await dash.evaluate(() => ({
    rows: document.querySelectorAll('#questionTable tbody tr').length,
    weakRows: document.querySelectorAll('#weakTable tbody tr').length,
    actionRows: document.querySelectorAll('#commonActionsTable tbody tr').length,
    distributions: document.querySelectorAll('#questionTable .dist-bar').length,
    refTags: document.querySelectorAll('#questionTable .pill-ref').length
  }));
  check('the analysis lists every question', analysis.rows === counts.frameworkQuestions, String(analysis.rows));
  check('the analysis shows how organisations answered', analysis.distributions > 30, String(analysis.distributions));
  check('the analysis maps every question to a framework', analysis.refTags >= counts.frameworkQuestions, String(analysis.refTags));
  check('the weakest controls are listed', analysis.weakRows === 12, String(analysis.weakRows));
  check('the most common actions are listed', analysis.actionRows > 0, String(analysis.actionRows));

  await dash.select('#questionSectionFilter', 'D');
  await wait(400);
  const filtered = await dash.$$eval('#questionTable tbody tr', els => els.length);
  check('the section filter narrows the question list', filtered === 6, String(filtered));
  await dash.select('#questionSectionFilter', '');
  await wait(300);

  await dash.click('#tab-method');
  await wait(500);
  const method = await dash.evaluate(() => ({
    frameworks: document.querySelectorAll('#frameworkTable tbody tr').length,
    levels: document.querySelectorAll('#levelTable tbody tr').length,
    sections: document.querySelectorAll('#methodSectionTable tbody tr').length,
    text: document.getElementById('view-method').textContent
  }));
  check('the method tab lists every framework', method.frameworks === 9, String(method.frameworks));
  check('the method tab explains the rating bands', method.levels === 5, String(method.levels));
  check('the method tab lists the sections and weights', method.sections === counts.sections, String(method.sections));
  check('the method tab explains how "not sure" is treated', /Not sure/.test(method.text));
  check('the method tab warns that returns are self-declared', /self-declared/.test(method.text));

  await dash.screenshot({ path: join(artifacts, 'console_method.png') });

  await dash.click('#tab-dashboard');
  await wait(600);
  await dash.pdf({
    path: join(artifacts, 'sector_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  const sectorPdf = (await readFile(join(artifacts, 'sector_report.pdf'))).length;
  check('the sector report exports as a PDF', sectorPdf > 20000, `${sectorPdf} bytes`);

  /* ------------------- Rejecting the wrong file ------------------- */
  console.log('\nConsole — bad input');
  const rejected = await dash.evaluate(async () => {
    const module = window.AIMA;
    // Simulate a v1 file arriving from a previous cycle.
    const holder = document.getElementById('loadMessages');
    holder.innerHTML = '';
    const fake = { schemaVersion: '1.0.0', answers: { 'GOV-1': { value: 3 } } };
    const blob = new Blob([JSON.stringify(fake)], { type: 'application/json' });
    const file = new File([blob], 'old-cycle.json', { type: 'application/json' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById('fileInput');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    return { messages: holder.textContent, version: module.meta.schemaVersion };
  });
  check('a return from an older schema is rejected with an explanation',
    /schema 1\.0\.0/.test(rejected.messages) && /could not be loaded/i.test(rejected.messages),
    rejected.messages.trim().slice(0, 120));

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
