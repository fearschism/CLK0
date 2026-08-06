/*
 * End-to-end browser check (optional tooling).
 *
 * Serves the two built pages and drives a real Chrome to:
 *   1. confirm each page is genuinely self-contained (one network request);
 *   2. complete the questionnaire as a reporting organisation would;
 *   3. confirm it is bilingual and never shows a rating;
 *   4. save the PDF and the data file, and validate the file against the schema;
 *   5. load it into the console and confirm the derived rating matches the
 *      shared engine exactly, section by section;
 *   6. confirm the questionnaire also works opened straight from disk.
 *
 * Chrome and puppeteer-core are deliberately not project dependencies.
 *
 *   npm install --no-save puppeteer-core
 *   CHROME_PATH=/usr/bin/google-chrome node tools/browser-smoke.mjs
 */
import http from 'node:http';
import { readFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const puppeteer = (await import('puppeteer-core')).default;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'tools', '.artifacts');
const chromePath = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';
const ARABIC = /[\u0600-\u06FF]/;

/*
 * The rating engine is deliberately absent from the questionnaire page, so the
 * expected rating is computed here in Node from the same answers the browser
 * recorded. That is the point of the comparison: two independent paths.
 */
const engineSandbox = { window: {}, Math, Date, JSON, String, Number, Object, Array, isNaN, RegExp, console };
engineSandbox.globalThis = engineSandbox;
const engineContext = createContext(engineSandbox);
for (const file of ['branding.js', 'framework.js', 'scoring.js']) {
  runInContext(readFileSync(join(root, 'src', 'js', file), 'utf8'), engineContext, { filename: file });
}
const engine = engineSandbox.window.AIMA;

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
  const MIME = { '.html': 'text/html', '.json': 'application/json' };
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

  console.log('\nBuild');
  let buildCurrent = true;
  try {
    execFileSync('node', [join(root, 'tools', 'build.mjs'), '--check'], { cwd: root, stdio: 'pipe' });
  } catch {
    buildCurrent = false;
  }
  check('the built pages are up to date with src/', buildCurrent, 'run: node tools/build.mjs');

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

  const requests = [];
  page.on('request', req => { if (/^https?:/.test(req.url())) requests.push(req.url()); });

  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: artifacts });

  /* ------------------- Self-contained ------------------- */
  console.log('\nQuestionnaire — one file, nothing external');
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
  check('the questionnaire loads with a single network request',
    requests.length === 1, requests.join(', '));

  const counts = await page.evaluate(() => ({
    questions: document.querySelectorAll('.q').length,
    steps: document.querySelectorAll('#stepContainer .step').length,
    expected: window.AIMA.questionCount,
    sections: window.AIMA.sections.length
  }));
  check('every question is rendered', counts.questions === counts.expected,
    `${counts.questions} of ${counts.expected}`);
  check('there is a step per section plus intro, details and finish',
    counts.steps === counts.sections + 3, `found ${counts.steps}`);

  const brandApplied = await page.evaluate(() => ({
    org: document.querySelector('[data-brand="organisation"]').textContent,
    orgAr: document.querySelector('[data-brand="organisation"][data-lang="ar"]').textContent,
    classification: document.querySelector('.classification-bar').textContent,
    logoInline: !!document.querySelector('.site-header svg.crest'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim()
  }));
  check('client branding is applied', brandApplied.org === 'National Health Authority', brandApplied.org);
  check('the letterhead carries the Arabic organisation name',
    /[\u0600-\u06FF]/.test(brandApplied.orgAr), brandApplied.orgAr);
  check('the classification banner shows both languages',
    /Official/.test(brandApplied.classification) && /[\u0600-\u06FF]/.test(brandApplied.classification));
  check('the logo is inlined as SVG rather than linked', brandApplied.logoInline);
  check('brand colours reach the CSS variables', brandApplied.accent === '#0e8b7d', brandApplied.accent);

  /* ------------------- Bilingual ------------------- */
  console.log('\nQuestionnaire — English and Arabic together');
  const bilingualState = await page.evaluate(() => {
    const arabic = /[\u0600-\u06FF]/;
    const questions = [...document.querySelectorAll('.q')];
    const withBoth = questions.filter(q => {
      const en = q.querySelector('.q-text .en');
      const ar = q.querySelector('.q-text .ar');
      return en && ar && en.textContent.trim() && arabic.test(ar.textContent);
    });
    const firstYesNo = document.querySelector('.opt-row');
    const arDirection = getComputedStyle(document.querySelector('.q-text .ar')).direction;
    const selects = [...document.querySelectorAll('.q-input select')];
    return {
      total: questions.length,
      withBoth: withBoth.length,
      optionText: firstYesNo ? firstYesNo.textContent.replace(/\s+/g, ' ').trim() : '',
      arDirection,
      comboOptionsBilingual: selects.length > 0 && selects.every(select =>
        [...select.options].slice(1).every(option => arabic.test(option.textContent))),
      stepNavBilingual: [...document.querySelectorAll('#stepNav .label .ar')].every(el => arabic.test(el.textContent)),
      noLanguageToggle: !document.querySelector('[data-lang-toggle], .lang-switch, #langToggle')
    };
  });
  check('every question appears in both languages',
    bilingualState.withBoth === bilingualState.total,
    `${bilingualState.withBoth} of ${bilingualState.total}`);
  check('yes / no / not sure are shown in both languages',
    /Yes/.test(bilingualState.optionText) && ARABIC.test(bilingualState.optionText),
    bilingualState.optionText);
  check('Arabic runs right to left', bilingualState.arDirection === 'rtl', bilingualState.arDirection);
  check('combo box options are bilingual', bilingualState.comboOptionsBilingual);
  check('the section list is bilingual', bilingualState.stepNavBilingual);
  check('there is no language toggle — both languages are always on', bilingualState.noLanguageToggle);

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

  // Read the page as a respondent sees it: markup text with scripts stripped,
  // including the steps that are currently hidden.
  const surveyWords = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    return clone.textContent.toLowerCase();
  });
  check('the questionnaire never shows a score or rating to the respondent',
    !/maturity rating|weighted|benchmark|\byour score\b|\bpriority 1\b/.test(surveyWords),
    (surveyWords.match(/maturity rating|weighted|benchmark|your score|priority 1/g) || []).join(', '));
  check('the questionnaire page does not carry the rating engine',
    await page.evaluate(() => window.AIMA.scoring === undefined && typeof window.AIMA.aggregate !== 'function'));

  await page.screenshot({ path: join(artifacts, 'survey_intro.png') });

  /* ------------------- Completion ------------------- */
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
  await page.type('#contactRole', 'Head of Security Operations');
  await page.type('#contactEmail', 'soc@central-pcc.health.example');
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
  check('completing the details unlocks the first section',
    await page.evaluate(() => !document.querySelector('[data-step="A"]').hasAttribute('hidden')));

  const givenAnswers = await page.evaluate(() => {
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
        const chosen = question.options.slice(0, Math.ceil(question.options.length / 2)).map(o => o.value);
        chosen.forEach(value => document.querySelector(`#q-${question.id} input[value="${value}"]`).click());
        answers[question.id] = { value: chosen };
      } else if (question.type === 'number') {
        const input = document.querySelector(`#q-${question.id} input[type="number"]`);
        input.value = '250';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        answers[question.id] = { value: 250 };
      }
    });

    const noteBox = document.querySelector('[data-sectionnote="D"]');
    noteBox.value = 'Triage automation went live in March; false positive rate not yet baselined.';
    noteBox.dispatchEvent(new Event('input', { bubbles: true }));

    return answers;
  });

  const engineResults = engine.scoring.computeResults({ answers: givenAnswers, targetLevel: 4 });
  const expected = {
    score: engineResults.overall.score,
    levelNameEn: engine.t(engineResults.overall.levelName, 'en'),
    unsure: engineResults.visibility.unsureCount,
    sectionScores: engineResults.sections.map(s => ({ id: s.sectionId, score: s.score }))
  };
  check('the answers recorded in the browser cover every question',
    Object.keys(givenAnswers).length === counts.expected, String(Object.keys(givenAnswers).length));

  const progress = await page.evaluate(() => ({
    text: document.getElementById('progressText').textContent,
    percent: document.getElementById('progressPercent').textContent,
    width: document.getElementById('progressBar').style.width
  }));
  check('the progress bar reaches 100%', progress.percent.trim() === '100%', JSON.stringify(progress));
  check('the progress counter is bilingual', ARABIC.test(progress.text), progress.text);

  const markers = await page.evaluate(() =>
    [...document.querySelectorAll('#stepNav .marker')].filter(m => m.classList.contains('done')).length);
  check('every section is marked complete in the step list', markers === counts.sections + 1, String(markers));

  await page.screenshot({ path: join(artifacts, 'survey_questions.png') });

  /* ------------------- Finish step ------------------- */
  console.log('\nQuestionnaire — finishing');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('#stepNav button');
    buttons[buttons.length - 1].click();
  });
  await wait(300);

  const finish = await page.evaluate(() => ({
    status: document.getElementById('finishStatus').textContent,
    statusArabic: /[\u0600-\u06FF]/.test(document.getElementById('finishStatus').textContent),
    reviewRows: document.querySelectorAll('#reviewTable tbody tr').length,
    missingCells: document.querySelectorAll('#reviewTable .missing').length,
    reviewArabic: [...document.querySelectorAll('#reviewTable td .ar')].some(el => /[\u0600-\u06FF]/.test(el.textContent))
  }));
  check('the finish step confirms all questions are answered',
    /All questions answered/.test(finish.status), finish.status.trim().slice(0, 60));
  check('the finish message is bilingual', finish.statusArabic);
  check('the check-your-answers table lists every question and section',
    finish.reviewRows === counts.expected + counts.sections, String(finish.reviewRows));
  check('nothing is flagged as missing', finish.missingCells === 0, String(finish.missingCells));
  check('the answers are read back in both languages', finish.reviewArabic);

  await page.click('#declarationCheck');
  check('the respondent can confirm the declaration',
    await page.evaluate(() => document.getElementById('declarationCheck').checked));

  await page.screenshot({ path: join(artifacts, 'survey_finish.png') });

  /* ------------------- Printed return ------------------- */
  console.log('\nQuestionnaire — PDF');
  await page.emulateMediaType('print');
  await page.setViewport({ width: 794, height: 1123 });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const printState = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector('.site-header')).display,
    letterhead: getComputedStyle(document.querySelector('#printLetterhead')).display,
    steps: getComputedStyle(document.querySelector('#stepContainer')).display,
    summary: getComputedStyle(document.querySelector('#printSummary')).display,
    tables: document.querySelectorAll('#printSummary table').length,
    rows: document.querySelectorAll('#printSummary tbody tr').length,
    text: document.querySelector('#printSummary').textContent,
    arabicCells: [...document.querySelectorAll('#printSummary td .ar')].filter(el => /[\u0600-\u06FF]/.test(el.textContent)).length
  }));
  check('the printed return hides the interactive form', printState.steps === 'none');
  check('the printed return shows the letterhead', printState.letterhead === 'flex');
  check('the printed return has a table per section plus details and sign-off',
    printState.tables === counts.sections + 2, String(printState.tables));
  check('the printed return lists every answer', printState.rows >= counts.expected, String(printState.rows));
  check('the printed return is bilingual', printState.arabicCells > counts.expected, String(printState.arabicCells));
  check('the printed return records the respondent and approver',
    /S\. Haddad/.test(printState.text) && /Dr M\. Aziz/.test(printState.text));
  check('the printed return shows answers in words, not scores',
    /Not sure/.test(printState.text) && !/\b[0-5]\s*\/\s*5\b/.test(printState.text));
  check('the printed return carries the return instructions', /31 May 2026/.test(printState.text));

  await page.screenshot({ path: join(artifacts, 'survey_print_preview.png'), fullPage: true });
  await page.pdf({
    path: join(artifacts, 'completed_return.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  check('a PDF of the completed return is produced',
    (await readFile(join(artifacts, 'completed_return.pdf'))).length > 20000);

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
    check('the data file names the organisation in both languages',
      exported.entity.name.en === 'Central Primary Care Cluster' && ARABIC.test(exported.entity.name.ar),
      JSON.stringify(exported.entity.name));
    check('the data file holds every answer',
      Object.keys(exported.answers).length === counts.expected, String(Object.keys(exported.answers).length));
    check('the data file records the declaration', exported.declarationConfirmed === true);
    check('the data file keeps the section comment', /Triage automation/.test(exported.sectionNotes.D || ''));
    check('the data file contains no ratings at all',
      !JSON.stringify(exported).match(/"results"|"overall"|"levelName"/));

    const schema = JSON.parse(await readFile(join(root, 'schema', 'return.schema.json'), 'utf8'));
    const missing = schema.required.filter(key => exported[key] === undefined);
    check('the data file carries every field the schema requires', missing.length === 0, missing.join(', '));
    const keyPattern = new RegExp(schema.properties.answers.propertyNames.pattern);
    check('every answer key matches the documented pattern',
      Object.keys(exported.answers).every(k => keyPattern.test(k)),
      Object.keys(exported.answers).filter(k => !keyPattern.test(k)).join(', '));
  }

  /* ------------------- Resuming ------------------- */
  console.log('\nQuestionnaire — resuming from a saved data file');
  const resumePage = await browser.newPage();
  resumePage.on('pageerror', err => consoleErrors.push('resume: ' + String(err)));
  await resumePage.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
  await resumePage.evaluate(() => window.localStorage.clear());
  await resumePage.reload({ waitUntil: 'networkidle0' });
  await (await resumePage.$('#resumeFile')).uploadFile(join(artifacts, jsonFile));
  await wait(800);
  const resumed = await resumePage.evaluate(() => ({
    progress: document.getElementById('progressText').textContent,
    org: document.getElementById('entitySelect').value,
    contact: document.getElementById('contactName').value
  }));
  check('loading a saved data file restores every answer',
    resumed.progress.trim().startsWith(String(counts.expected) + ' / ' + counts.expected), resumed.progress);
  check('loading a saved data file restores the organisation and contact',
    resumed.org === 'E14' && resumed.contact === 'S. Haddad', JSON.stringify(resumed));
  await resumePage.close();

  /* ------------------- Straight from disk ------------------- */
  console.log('\nQuestionnaire — opened straight from disk');
  const filePage = await browser.newPage();
  const fileErrors = [];
  filePage.on('pageerror', err => fileErrors.push(String(err)));
  filePage.on('console', msg => { if (msg.type() === 'error') fileErrors.push(msg.text()); });
  const fileRequests = [];
  filePage.on('request', req => { if (/^https?:/.test(req.url())) fileRequests.push(req.url()); });
  await filePage.goto('file://' + join(root, 'index.html'), { waitUntil: 'networkidle0' });
  const fromDisk = await filePage.evaluate(() => ({
    questions: document.querySelectorAll('.q').length,
    storage: window.AIMA.util.store.available,
    styled: getComputedStyle(document.querySelector('.site-header')).backgroundImage !== 'none',
    arabic: /[\u0600-\u06FF]/.test(document.body.textContent)
  }));
  check('the questionnaire works opened as a local file', fromDisk.questions === counts.expected,
    `${fromDisk.questions} questions`);
  check('styling survives being opened from disk', fromDisk.styled);
  check('Arabic survives being opened from disk', fromDisk.arabic);
  check('progress can still be saved locally from disk', fromDisk.storage);
  check('opening from disk makes no network requests', fileRequests.length === 0, fileRequests.join(', '));
  check('opening from disk raises no errors', fileErrors.length === 0, fileErrors.join(' | '));
  await filePage.close();

  /* ------------------- Console ------------------- */
  console.log('\nConsole');
  const dash = await browser.newPage();
  const dashRequests = [];
  dash.on('request', req => { if (/^https?:/.test(req.url())) dashRequests.push(req.url()); });
  dash.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('console: ' + msg.text()); });
  dash.on('pageerror', err => consoleErrors.push('console: ' + String(err)));
  await dash.goto(`${base}/console.html`, { waitUntil: 'networkidle0' });
  check('the console loads with a single network request', dashRequests.length === 1, dashRequests.join(', '));
  check('the console starts empty', await dash.$eval('#emptyState', el => !el.hidden));
  check('the console is labelled for the governing body only',
    /governing body/i.test(await dash.$eval('.classification-bar', el => el.textContent)));

  await dash.click('#tab-data');
  await wait(200);
  await (await dash.$('#fileInput')).uploadFile(join(artifacts, jsonFile));
  await wait(800);
  check('the console accepts the return',
    /1 return loaded/.test(await dash.$eval('#recordCountPill', el => el.textContent)));

  await dash.click('#tab-dashboard');
  await wait(500);

  const derived = await dash.evaluate(() => {
    const cells = document.querySelectorAll('#entityTable tbody tr:first-child td');
    return {
      score: cells[4].textContent.trim(),
      band: cells[5].textContent.trim(),
      answered: cells[6].textContent.trim(),
      unsure: cells[7].textContent.trim(),
      nameArabic: /[\u0600-\u06FF]/.test(cells[1].textContent),
      kpis: document.getElementById('kpiGrid').textContent
    };
  });
  check('the console rates the return it was given', derived.score === expected.score.toFixed(2),
    `console ${derived.score} vs engine ${expected.score.toFixed(2)}`);
  check('the console shows the rating band in words', derived.band === expected.levelNameEn,
    `${derived.band} vs ${expected.levelNameEn}`);
  check('the console reports 100% of questions answered', derived.answered === '100%', derived.answered);
  check('the console counts the "not sure" answers', derived.unsure === String(expected.unsure));
  check('the console shows organisation names in both languages', derived.nameArabic);
  check('coverage is measured against the 30-organisation register', /1 \/ 30/.test(derived.kpis));

  const sectionMatch = await dash.evaluate(expectedSections => {
    const rows = [...document.querySelectorAll('#sectionTable tbody tr')];
    return rows.length === expectedSections.length && rows.every((row, i) => {
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
    coverage: document.getElementById('coveragePanel').textContent
  }));
  check('demonstration data fills the register', withDemo.rows === 30, String(withDemo.rows));
  check('the heatmap draws a cell per organisation and section',
    withDemo.heatCells === 30 * (counts.sections + 1), String(withDemo.heatCells));
  check('the ranking chart draws a bar per organisation', withDemo.rankingBars === 60, String(withDemo.rankingBars));
  check('coverage reports a full return rate', /30 of 30/.test(withDemo.coverage));

  await dash.evaluate(() => window.scrollTo(0, 0));
  await wait(200);
  await dash.screenshot({ path: join(artifacts, 'console_dashboard.png') });
  await dash.evaluate(() => document.getElementById('heatmap').scrollIntoView({ block: 'center' }));
  await wait(250);
  await dash.screenshot({ path: join(artifacts, 'console_heatmap.png') });

  /* ------------------- Organisation report ------------------- */
  console.log('\nConsole — organisation report');
  await dash.click('#tab-entity');
  await wait(700);
  const report = await dash.evaluate(() => ({
    charts: document.querySelectorAll('#entityReport svg').length,
    kpis: document.querySelectorAll('#entityReport .kpi').length,
    actions: document.querySelectorAll('#entityReport .action-list li').length,
    appendixRows: document.querySelectorAll('#entityReport .answer-log tbody tr').length,
    quotesAnswers: /They answered:/.test(document.getElementById('entityReport').textContent),
    frameworkTags: document.querySelectorAll('#entityReport .pill-ref').length,
    arabicActions: [...document.querySelectorAll('#entityReport .action-text .ar')].filter(el => /[\u0600-\u06FF]/.test(el.textContent)).length
  }));
  check('the report draws a gauge, radar and bar chart', report.charts >= 3, String(report.charts));
  check('the report shows its summary indicators', report.kpis === 6, String(report.kpis));
  check('the report lists improvement actions', report.actions > 3, String(report.actions));
  check('recommended actions are bilingual', report.arabicActions === report.actions,
    `${report.arabicActions} of ${report.actions}`);
  check('each action quotes the answer that triggered it', report.quotesAnswers);
  check('actions cite the framework they come from', report.frameworkTags > 0);
  check('the appendix reproduces every answer', report.appendixRows >= counts.expected, String(report.appendixRows));

  await dash.screenshot({ path: join(artifacts, 'console_entity_report.png') });
  await dash.pdf({
    path: join(artifacts, 'organisation_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  check('the organisation report exports as a PDF',
    (await readFile(join(artifacts, 'organisation_report.pdf'))).length > 20000);

  /* ------------------- Question analysis and method ------------------- */
  console.log('\nConsole — question analysis and method');
  await dash.click('#tab-questions');
  await wait(600);
  const analysis = await dash.evaluate(() => ({
    rows: document.querySelectorAll('#questionTable tbody tr').length,
    distributions: document.querySelectorAll('#questionTable .dist-bar').length,
    refTags: document.querySelectorAll('#questionTable .pill-ref').length,
    weakRows: document.querySelectorAll('#weakTable tbody tr').length
  }));
  check('the analysis lists every question', analysis.rows === counts.expected, String(analysis.rows));
  check('the analysis shows how organisations answered', analysis.distributions > 30, String(analysis.distributions));
  check('the analysis maps every question to a framework', analysis.refTags >= counts.expected, String(analysis.refTags));
  check('the weakest capabilities are listed', analysis.weakRows === 12, String(analysis.weakRows));

  const sectionDCount = await dash.evaluate(() => window.AIMA.getSection('D').questions.length);
  await dash.select('#questionSectionFilter', 'D');
  await wait(400);
  check('the section filter narrows the question list',
    await dash.$$eval('#questionTable tbody tr', els => els.length) === sectionDCount);
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
  check('the method tab lists every framework', method.frameworks === 12, String(method.frameworks));
  check('the method tab explains the rating bands', method.levels === 5, String(method.levels));
  check('the method tab lists the sections and weights', method.sections === counts.sections);
  check('the method tab warns that returns are self-declared', /self-declared/.test(method.text));

  await dash.screenshot({ path: join(artifacts, 'console_method.png') });

  await dash.click('#tab-dashboard');
  await wait(600);
  await dash.pdf({
    path: join(artifacts, 'sector_report.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }
  });
  check('the sector report exports as a PDF',
    (await readFile(join(artifacts, 'sector_report.pdf'))).length > 20000);

  /* ------------------- Bad input ------------------- */
  console.log('\nConsole — bad input');
  const rejected = await dash.evaluate(async () => {
    const holder = document.getElementById('loadMessages');
    holder.innerHTML = '';
    const fake = { schemaVersion: '2.0.0', answers: { A1: { value: 'yes' } } };
    const file = new File([new Blob([JSON.stringify(fake)], { type: 'application/json' })],
      'old-cycle.json', { type: 'application/json' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById('fileInput');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    return holder.textContent;
  });
  check('a return from an older schema is rejected with an explanation',
    /schema 2\.0\.0/.test(rejected) && /could not be loaded/i.test(rejected), rejected.trim().slice(0, 140));

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
