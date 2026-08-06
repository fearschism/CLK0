/*
 * Self-test for the question bank, the rating engine, the bilingual content
 * and the single-file build.
 *
 *   node tools/test-scoring.mjs
 *
 * The browser files are classic scripts that attach to `window`, so they are
 * evaluated here in a VM context with a minimal window stub. These tests
 * therefore exercise exactly the code the two pages run.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {}, Math, Date, JSON, String, Number, Object, Array, isNaN, RegExp, console };
sandbox.globalThis = sandbox;
const context = createContext(sandbox);

for (const file of ['branding.js', 'framework.js', 'scoring.js', 'charts.js']) {
  runInContext(readFileSync(join(root, 'src', 'js', file), 'utf8'), context, { filename: file });
}

const AIMA = sandbox.window.AIMA;
const { scoring, charts } = AIMA;
const NA = AIMA.NOT_APPLICABLE;
const t = AIMA.t;

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push({ name, detail });
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(name, actual, expected) {
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function close(name, actual, expected, tolerance = 0.005) {
  check(name, Math.abs(actual - expected) <= tolerance, `expected ~${expected}, got ${actual}`);
}

function group(title) { console.log(`\n${title}`); }

const ARABIC = /[\u0600-\u06FF]/;

/** A string is properly bilingual: both languages present, Arabic in Arabic script. */
function bilingual(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.en !== 'string' || typeof value.ar !== 'string') return false;
  if (!value.en.trim() || !value.ar.trim()) return false;
  return ARABIC.test(value.ar);
}

/* ------------------------------------------------------------------ *
 * Question bank
 * ------------------------------------------------------------------ */
group('Question bank');

eq('section weights total 100', AIMA.sections.reduce((sum, s) => sum + s.weight, 0), 100);
eq('there are twelve sections', AIMA.sections.length, 12);
check('section ids are single letters and unique',
  new Set(AIMA.sections.map(s => s.id)).size === AIMA.sections.length &&
  AIMA.sections.every(s => /^[A-Z]$/.test(s.id)));

// The domains the assessment is meant to cover.
const titles = AIMA.sections.map(s => t(s.title, 'en').toLowerCase());
for (const [label, pattern] of [
  ['strategy and governance', /strategy|governance/],
  ['data and telemetry', /data|telemetry/],
  ['threat detection', /detection|monitoring/],
  ['alert triage and false positives', /triage|false positive/],
  ['incident response and SOC automation', /incident response|automation/],
  ['threat intelligence and hunting', /intelligence|hunting/],
  ['vulnerabilities and attack surface', /vulnerabilit|attack surface/],
  ['identity and insider risk', /identity|insider/],
  ['data protection', /data protection|leak/],
  ['governance, risk and compliance', /compliance|risk/],
  ['resilience and recovery', /resilience|recovery/],
  ['assurance and skills', /assurance|skills/]
]) {
  check(`a section covers ${label}`, titles.some(title => pattern.test(title)),
    titles.join(' | '));
}

const ids = AIMA.allQuestions.map(q => q.id);
check('question ids are unique', new Set(ids).size === ids.length);
check('question ids start with their section letter', AIMA.allQuestions.every(q => q.id.startsWith(q.sectionId)));
check('questions are numbered continuously from 1', AIMA.allQuestions.every((q, i) => q.number === i + 1));
check('the questionnaire is short enough to stay usable', AIMA.questionCount <= 56, String(AIMA.questionCount));
check('every section has at least four questions', AIMA.sections.every(s => s.questions.length >= 4));

const allowedTypes = ['yesno', 'choice', 'multi', 'number', 'text'];
check('every question uses a supported simple input type',
  AIMA.allQuestions.every(q => allowedTypes.includes(q.type)));
check('most questions are yes/no or a single choice',
  AIMA.allQuestions.filter(q => q.type === 'yesno' || q.type === 'choice').length / AIMA.questionCount > 0.7);
check('question wording avoids maturity jargon',
  AIMA.allQuestions.every(q => !/maturity|weighted|\bscore\b|level [0-5]/i.test(t(q.text, 'en'))),
  AIMA.allQuestions.filter(q => /maturity|weighted|\bscore\b|level [0-5]/i.test(t(q.text, 'en'))).map(q => q.id).join(', '));
check('every scored question has a remedy for the console',
  AIMA.allQuestions.every(q => !q.scored || q.remedy),
  AIMA.allQuestions.filter(q => q.scored && !q.remedy).map(q => q.id).join(', '));
check('every question maps to at least one framework', AIMA.allQuestions.every(q => (q.refs || []).length > 0));
check('every framework reference resolves',
  AIMA.allQuestions.every(q => (q.refs || []).every(r => AIMA.getFramework(r.key))),
  AIMA.allQuestions.flatMap(q => (q.refs || []).filter(r => !AIMA.getFramework(r.key)).map(r => `${q.id}:${r.key}`)).join(', '));
check('question weights are 1 or 1.5', AIMA.allQuestions.every(q => q.weight === 1 || q.weight === 1.5));

const choiceQuestions = AIMA.allQuestions.filter(q => q.type === 'choice');
check('there are combo-box questions', choiceQuestions.length >= 10, String(choiceQuestions.length));
check('every choice option carries a value from 0 to 5',
  choiceQuestions.every(q => q.options.every(o => typeof o.score === 'number' && o.score >= 0 && o.score <= 5)));
check('choice options run from worst to best',
  choiceQuestions.every(q => q.options.every((o, i) => i === 0 || q.options[i - 1].score <= o.score)),
  choiceQuestions.filter(q => q.options.some((o, i) => i > 0 && q.options[i - 1].score > o.score)).map(q => q.id).join(', '));

const multiQuestions = AIMA.allQuestions.filter(q => q.type === 'multi');
check('there are tick-box questions', multiQuestions.length >= 2, String(multiQuestions.length));
check('every tick-box question offers a "none of these" label',
  multiQuestions.every(q => bilingual(q.noneLabel)));
check('informational questions are excluded from the rating',
  AIMA.allQuestions.filter(q => q.informational).every(q => !q.scored));
eq('30 organisations are on the register', AIMA.entities.length, 30);

/* ------------------------------------------------------------------ *
 * Bilingual content
 * ------------------------------------------------------------------ */
group('English and Arabic together');

check('every question is written in both languages',
  AIMA.allQuestions.every(q => bilingual(q.text)),
  AIMA.allQuestions.filter(q => !bilingual(q.text)).map(q => q.id).join(', '));
check('every hint is written in both languages',
  AIMA.allQuestions.every(q => !q.hint || bilingual(q.hint)),
  AIMA.allQuestions.filter(q => q.hint && !bilingual(q.hint)).map(q => q.id).join(', '));
check('every remedy is written in both languages',
  AIMA.allQuestions.every(q => !q.remedy || bilingual(q.remedy)),
  AIMA.allQuestions.filter(q => q.remedy && !bilingual(q.remedy)).map(q => q.id).join(', '));
check('every answer option is written in both languages',
  AIMA.allQuestions.every(q => (q.options || []).every(o => bilingual(o.label))),
  AIMA.allQuestions.filter(q => (q.options || []).some(o => !bilingual(o.label))).map(q => q.id).join(', '));
check('every unit label is bilingual', AIMA.allQuestions.every(q => !q.unit || bilingual(q.unit)));
check('yes / no / not sure are bilingual', AIMA.yesNoOptions.every(o => bilingual(o.label)));
check('"not applicable" is bilingual', bilingual(AIMA.notApplicableOption.label));
check('every section title and introduction is bilingual',
  AIMA.sections.every(s => bilingual(s.title) && bilingual(s.intro)),
  AIMA.sections.filter(s => !(bilingual(s.title) && bilingual(s.intro))).map(s => s.id).join(', '));
check('every rating band is named and described in both languages',
  AIMA.levels.every(l => bilingual(l.name) && bilingual(l.description)));
check('every organisation on the register has an Arabic name',
  AIMA.entities.every(e => bilingual(e.name)),
  AIMA.entities.filter(e => !bilingual(e.name)).map(e => e.code).join(', '));
check('organisation types, regions and sizes are bilingual',
  AIMA.entityTypes.every(bilingual) && AIMA.regions.every(bilingual) && AIMA.entitySizes.every(bilingual));
check('every respondent field label is bilingual', AIMA.respondentFields.every(f => bilingual(f.label)));
check('every framework name and note is bilingual',
  AIMA.frameworks.every(f => bilingual(f.name) && bilingual(f.note)));
check('every interface string is bilingual',
  Object.keys(AIMA.ui).every(key => bilingual(AIMA.ui[key])),
  Object.keys(AIMA.ui).filter(key => !bilingual(AIMA.ui[key])).join(', '));
check('branding is bilingual where it is shown to respondents',
  ['organisation', 'directorate', 'programme', 'cycle', 'classification', 'returnInstructions']
    .every(key => bilingual(AIMA.branding[key])));
check('the Arabic differs from the English everywhere',
  AIMA.allQuestions.every(q => t(q.text, 'ar') !== t(q.text, 'en')));

group('Reference frameworks');
check('the current LLM risk list is included',
  AIMA.frameworks.some(f => /OWASP/.test(f.short) && f.year >= 2025));
check('the attack technique library is included', AIMA.frameworks.some(f => f.key === 'ATTACK'));
check('a security operations maturity model is included', AIMA.frameworks.some(f => f.key === 'SOCCMM'));
check('the AI risk management framework is included', AIMA.frameworks.some(f => f.key === 'AIRMF'));
const coverage = scoring.frameworkCoverage();
eq('every framework is reported', coverage.length, AIMA.frameworks.length);
check('every framework is used by at least one question',
  coverage.every(f => f.questionCount > 0),
  coverage.filter(f => !f.questionCount).map(f => f.short).join(', '));

/* ------------------------------------------------------------------ *
 * One self-contained file per audience
 * ------------------------------------------------------------------ */
group('Single-file delivery');

const questionnaireFile = readFileSync(join(root, 'index.html'), 'utf8');
const consoleFile = readFileSync(join(root, 'console.html'), 'utf8');

for (const [label, html] of [['questionnaire', questionnaireFile], ['console', consoleFile]]) {
  check(`the built ${label} has no external stylesheet`, !/<link[^>]+rel=["']stylesheet["']/i.test(html));
  check(`the built ${label} has no external script`, !/<script[^>]+src=/i.test(html));
  check(`the built ${label} has no external image`, !/<img[^>]+src=["'](?!data:)/i.test(html));
  check(`the built ${label} inlines the logo`, /<svg class="crest"/.test(html));
  check(`the built ${label} carries its own stylesheet and scripts`,
    /<style>/.test(html) && /<script>/.test(html));
  check(`the built ${label} is small enough to email`, html.length < 700 * 1024,
    `${(html.length / 1024).toFixed(0)} KB`);
}
check('the questionnaire contains the whole question bank',
  AIMA.allQuestions.every(q => questionnaireFile.includes(t(q.text, 'ar'))));

/* ------------------------------------------------------------------ *
 * Separation between the two audiences
 * ------------------------------------------------------------------ */
group('Separation between the two audiences');

const surveySource = readFileSync(join(root, 'src', 'js', 'survey.js'), 'utf8');
const surveyPage = readFileSync(join(root, 'src', 'pages', 'questionnaire.html'), 'utf8');

check('the questionnaire never touches the rating engine',
  !/AIMA\.scoring|computeResults|scoreAnswer|scoreSection|aggregate\(/.test(surveySource));
check('the questionnaire never reads rating bands or option values',
  !/AIMA\.levels|levelFor|\.score\b/.test(surveySource));
check('the questionnaire only uses the shared answer helpers',
  (surveySource.match(/answers\.[a-zA-Z]+/g) || [])
    .every(call => ['answers.isAnswered', 'answers.describeAnswer', 'answers.describeAnswerBoth',
      'answers.answerKeys', 'answers.NONE'].includes(call)),
  [...new Set(surveySource.match(/answers\.[a-zA-Z]+/g) || [])].join(', '));
// The rating engine is not even shipped in the file organisations receive.
check('the built questionnaire does not ship the rating engine',
  !/function computeResults|function aggregate|function buildActions|frameworkCoverage/.test(questionnaireFile));
check('the built console does ship the rating engine',
  /function computeResults/.test(consoleFile) && /function aggregate/.test(consoleFile));
check('the questionnaire page does not link to the console', !/console\.html/.test(surveyPage));
check('the built questionnaire shows no rating words to respondents',
  !/maturity rating|benchmark|your score/i.test(questionnaireFile.replace(/<!--[\s\S]*?-->/g, '')));
check('the console is marked as restricted', /governing body/i.test(consoleFile));

/* ------------------------------------------------------------------ *
 * Answer values
 * ------------------------------------------------------------------ */
group('Turning answers into values');

const yesno = AIMA.getQuestion('A1');
eq('Yes scores 5', scoring.scoreAnswer(yesno, { value: 'yes' }), 5);
eq('No scores 0', scoring.scoreAnswer(yesno, { value: 'no' }), 0);
eq('Not sure scores 1', scoring.scoreAnswer(yesno, { value: 'unsure' }), 1);
eq('Not applicable is flagged, not scored', scoring.scoreAnswer(yesno, { value: NA }), NA);
eq('an unanswered question has no value', scoring.scoreAnswer(yesno, undefined), null);

const choice = AIMA.getQuestion('A5');
eq('the worst option scores 0', scoring.scoreAnswer(choice, { value: 'never' }), 0);
eq('the best option scores 5', scoring.scoreAnswer(choice, { value: 'monthly' }), 5);
eq('an unknown option value has no score', scoring.scoreAnswer(choice, { value: 'nonsense' }), null);

const multi = AIMA.getQuestion('B1');
eq('B1 offers six log sources', multi.options.length, 6);
eq('ticking nothing but "none of these" scores 0', scoring.scoreAnswer(multi, { value: ['none'] }), 0);
eq('ticking every box scores 5', scoring.scoreAnswer(multi, { value: multi.options.map(o => o.value) }), 5);
close('ticking three of six scores 2.5',
  scoring.scoreAnswer(multi, { value: multi.options.slice(0, 3).map(o => o.value) }), 2.5);
eq('an empty tick list counts as unanswered', scoring.scoreAnswer(multi, { value: [] }), null);

const informational = AIMA.getQuestion('D5');
eq('informational questions never produce a value', scoring.scoreAnswer(informational, { value: 120 }), null);
eq('informational questions still count as answered', scoring.isAnswered(informational, { value: 0 }), true);

group('Describing answers in both languages');
eq('a yes reads back in English', scoring.describeAnswer(yesno, { value: 'yes' }, 'en'), 'Yes');
eq('a yes reads back in Arabic', scoring.describeAnswer(yesno, { value: 'yes' }, 'ar'), 'نعم');
eq('not sure reads back in Arabic', scoring.describeAnswer(yesno, { value: 'unsure' }, 'ar'), 'غير متأكد');
check('an unanswered question reads back in both languages', (() => {
  const both = scoring.describeAnswerBoth(yesno, {});
  return both.en === 'Not answered' && ARABIC.test(both.ar);
})());
check('a chosen option reads back in both languages', (() => {
  const both = scoring.describeAnswerBoth(choice, { value: 'quarterly' });
  return both.en === 'Every three months' && ARABIC.test(both.ar);
})());
check('multiple ticks read back as a list in both languages', (() => {
  const both = scoring.describeAnswerBoth(multi, { value: [multi.options[0].value, multi.options[1].value] });
  return both.en.includes('·') && ARABIC.test(both.ar);
})());
check('answer keys are language independent',
  scoring.answerKeys(yesno, { value: 'yes' }).join() === 'yes' &&
  scoring.answerKeys(multi, { value: ['endpoints', 'cloud'] }).join() === 'endpoints,cloud');

/* ------------------------------------------------------------------ *
 * Ratings
 * ------------------------------------------------------------------ */
group('Rating bands');

eq('0.00 is band 1', scoring.levelFor(0).level, 1);
eq('1.50 is band 2', scoring.levelFor(1.5).level, 2);
eq('2.50 is band 3', scoring.levelFor(2.5).level, 3);
eq('3.50 is band 4', scoring.levelFor(3.5).level, 4);
eq('4.50 is band 5', scoring.levelFor(4.5).level, 5);
eq('band 1 reads plainly in English', t(scoring.levelFor(0.5).name, 'en'), 'Not established');
eq('band 5 reads plainly in English', t(scoring.levelFor(5).name, 'en'), 'Leading');
check('rating bands are contiguous and cover 0 to 5', (() => {
  if (AIMA.levels[0].min !== 0 || AIMA.levels[AIMA.levels.length - 1].max !== 5) return false;
  for (let i = 1; i < AIMA.levels.length; i++) {
    if (Math.abs(AIMA.levels[i].min - AIMA.levels[i - 1].max - 0.01) > 1e-9) return false;
  }
  return true;
})());

group('Whole-return rating');

function answerEverything(mode) {
  const answers = {};
  AIMA.allQuestions.forEach(q => {
    if (q.type === 'yesno') answers[q.id] = { value: mode === 'yes' ? 'yes' : 'no' };
    else if (q.type === 'choice') {
      answers[q.id] = { value: (mode === 'yes' ? q.options[q.options.length - 1] : q.options[0]).value };
    } else if (q.type === 'multi') {
      answers[q.id] = { value: mode === 'yes' ? q.options.map(o => o.value) : ['none'] };
    } else if (q.type === 'number') {
      answers[q.id] = { value: 40 };
    }
  });
  return answers;
}

const empty = scoring.computeResults({ answers: {} });
eq('an empty return has no rating', empty.overall.score, null);
eq('an empty return is 0% complete', empty.completeness.percent, 0);

const best = scoring.computeResults({ answers: answerEverything('yes') });
eq('answering everything positively rates 5.00', best.overall.score, 5);
eq('the best possible return is band 5', best.overall.level, 5);
eq('the best possible return has no actions', best.actions.length, 0);
eq('the best possible return is 100% complete', best.completeness.percent, 100);

const worst = scoring.computeResults({ answers: answerEverything('no') });
eq('answering everything negatively rates 0.00', worst.overall.score, 0);
eq('the worst return raises an action for every scored question', worst.actions.length, AIMA.scoredQuestionCount);
eq('the worst return has no strengths', worst.strengths.length, 0);

const unsureAll = {};
AIMA.allQuestions.filter(q => q.type === 'yesno' && q.scored).forEach(q => { unsureAll[q.id] = { value: 'unsure' }; });
const unsureResults = scoring.computeResults({ answers: unsureAll });
eq('every "not sure" is counted as a visibility gap', unsureResults.visibility.unsureCount, Object.keys(unsureAll).length);
check('"not sure" answers rate close to the bottom', unsureResults.overall.score <= 1.2, String(unsureResults.overall.score));

group('Weighted arithmetic');

// Section D: weights 1.5, 1.5, 1.5, 1 across four scored questions (total 5.5),
// plus one informational question that must not affect the average.
const sectionD = AIMA.getSection('D');
eq('section D has five questions', sectionD.questions.length, 5);
const dAnswers = {
  D1: { value: 'yes' },        // 5   x 1.5
  D2: { value: 'no' },         // 0   x 1.5
  D3: { value: 'small' },      // 3   x 1.5
  D4: { value: 'unsure' },     // 1   x 1
  D5: { value: 400 }           // informational
};
const expectedD = (5 * 1.5 + 0 * 1.5 + 3 * 1.5 + 1 * 1) / 5.5; // 13 / 5.5
const resultD = scoring.scoreSection(sectionD, dAnswers);
close('section D matches the hand calculation', resultD.score, expectedD);
eq('section D rounds to 2.36', resultD.score, 2.36);
eq('the informational question does not change the section score', resultD.questionsScored, 4);
eq('all five questions count as answered', resultD.questionsAnswered, 5);
eq('section D counts one "not sure"', resultD.unsureCount, 1);

// Not applicable must leave both sides of the average.
const naSection = scoring.scoreSection(AIMA.getSection('L'), {
  L1: { value: 'yes' }, L2: { value: NA }, L3: { value: 'refresh' }, L4: { value: 'yes' }, L5: { value: 'yes' }
});
eq('not-applicable answers are excluded from the score', naSection.score, 5);
eq('not-applicable answers are counted separately', naSection.questionsNotApplicable, 1);

// Section weighting: lift only one section.
const mixed = answerEverything('no');
AIMA.getSection('C').questions.forEach(raw => {
  const question = AIMA.getQuestion(raw.id);
  if (question.type === 'yesno') mixed[question.id] = { value: 'yes' };
  else if (question.type === 'choice') mixed[question.id] = { value: question.options[question.options.length - 1].value };
  else if (question.type === 'multi') mixed[question.id] = { value: question.options.map(o => o.value) };
});
close('the overall rating follows the section weights',
  scoring.computeResults({ answers: mixed }).overall.score, (5 * AIMA.getSection('C').weight) / 100);

group('Improvement actions');

const actionCase = scoring.computeResults({
  answers: Object.assign(answerEverything('yes'), { C1: { value: 'no' }, L4: { value: 'unsure' } }),
  targetLevel: 4
});
eq('only answers below the target generate actions', actionCase.actions.length, 2);
eq('the heaviest weighted gap is ranked first', actionCase.actions[0].questionId, 'C1');
eq('a core capability answered No is priority 1', actionCase.actions[0].priority, 1);
check('actions quote the answer in both languages',
  actionCase.actions[0].answer.en === 'No' && ARABIC.test(actionCase.actions[0].answer.ar));
check('actions carry a bilingual instruction', bilingual(actionCase.actions[0].action));
check('actions carry the framework references', (actionCase.actions[0].refs || []).length > 0);

/* ------------------------------------------------------------------ *
 * Aggregation
 * ------------------------------------------------------------------ */
group('Sector aggregation');

function makeReturn(code, mode) {
  return {
    id: 'test-' + code,
    entity: AIMA.getEntity(code),
    contact: { contactName: 'Tester' },
    period: '2026 Annual Return',
    submittedDate: '2026-05-01',
    targetLevel: 4,
    answers: answerEverything(mode)
  };
}

const agg = scoring.aggregate([makeReturn('E01', 'yes'), makeReturn('E14', 'no')]);
eq('two returns are aggregated', agg.entities.length, 2);
eq('the sector average of 5 and 0 is 2.5', agg.sector.avg, 2.5);
eq('the strongest organisation is listed first', agg.entities[0].entityCode, 'E01');
eq('one organisation meets the target', agg.sector.atOrAboveTarget, 1);
eq('coverage is measured against the register', agg.coverage.expected, 30);
eq('28 organisations are still outstanding', agg.coverage.missing.length, 28);
check('rows carry an English name for sorting and CSV',
  agg.entities[0].entityNameEn === 'Central Medical City', agg.entities[0].entityNameEn);
check('rows keep the bilingual name for display', bilingual(agg.entities[0].entityName));
check('rows carry the English band name', typeof agg.entities[0].levelNameEn === 'string');
check('every section average is 2.5', agg.sectionAverages.every(s => s.avg === 2.5));
check('per-question distributions are keyed by option value', (() => {
  const stat = agg.questionStats.find(s => s.questionId === 'A1');
  return stat.distribution.yes === 1 && stat.distribution.no === 1 && stat.responses === 2;
})());
check('grouping by type keeps the bilingual label', bilingual(agg.byType[0].key));
eq('grouping by region works', agg.byRegion.length, 1);
check('common actions are counted across organisations', agg.commonActions.length > 0);

const aggEmpty = scoring.aggregate([]);
eq('aggregating nothing yields no organisations', aggEmpty.entities.length, 0);
eq('aggregating nothing lists all 30 as outstanding', aggEmpty.coverage.missing.length, 30);

/* ------------------------------------------------------------------ *
 * Charts
 * ------------------------------------------------------------------ */
group('Chart renderers');

const radarSvg = charts.radar({
  axes: AIMA.sections.map(s => ({ label: t(s.title, 'en'), short: s.id })),
  series: [{ name: 'Sector', color: '#0e8b7d', values: AIMA.sections.map(() => 3) }]
});
check('radar renders an svg', radarSvg.startsWith('<svg') && radarSvg.endsWith('</svg>'));
check('radar has one marker per section', (radarSvg.match(/<circle/g) || []).length === AIMA.sections.length);
check('radar plots no NaN coordinates', !/NaN/.test(radarSvg));

const barsSvg = charts.bars({ items: [{ label: 'A', value: 2 }, { label: 'B', value: null }], target: 4 });
check('bars renders an svg', barsSvg.startsWith('<svg'));
check('bars shows an em dash for a missing value', barsSvg.includes('—'));
check('bars draws the target line', barsSvg.includes('target 4'));

const longest = AIMA.sections.reduce((a, b) => (t(a.title, 'en').length > t(b.title, 'en').length ? a : b));
const wrapped = charts.bars({ items: [{ label: 'A. ' + t(longest.title, 'en'), sublabel: 'w 8%', value: 2 }] });
check('long bar labels wrap rather than truncate',
  (wrapped.match(/chart-row-label/g) || []).length === 2 && wrapped.includes('<title>'));

const heatSvg = charts.heatmap({
  cols: AIMA.sections.map(s => ({ label: s.id, title: t(s.title, 'en') })),
  rows: [{ label: 'E01', total: 3, values: AIMA.sections.map(() => 3) }]
});
check('heatmap renders an svg', heatSvg.startsWith('<svg'));
check('heatmap has a cell per section plus a total',
  (heatSvg.match(/<rect/g) || []).length === AIMA.sections.length + 1);

check('gauge renders an svg', charts.gauge({ value: 3.4 }).startsWith('<svg'));
check('gauge handles a missing rating', charts.gauge({ value: null }).includes('—'));
check('stacked bar renders an svg',
  charts.stackedBar({ segments: AIMA.levels.map(l => ({ level: l.level, name: t(l.name, 'en'), color: l.color, count: 2 })) }).startsWith('<svg'));
check('columns renders an svg', charts.columns({ items: [{ label: 'Central', value: 3.2 }] }).startsWith('<svg'));
check('html is escaped in chart labels',
  charts.bars({ items: [{ label: '<script>x</script>', value: 1 }] }).indexOf('<script>') === -1);

/* ------------------------------------------------------------------ */

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(` - ${f.name}${f.detail ? `: ${f.detail}` : ''}`));
  process.exit(1);
}
