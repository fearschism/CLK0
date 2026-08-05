/*
 * Self-test for the question bank, the rating engine and the chart renderers.
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
  runInContext(readFileSync(join(root, 'assets', 'js', file), 'utf8'), context, { filename: file });
}

const AIMA = sandbox.window.AIMA;
const { scoring, charts } = AIMA;
const NA = AIMA.NOT_APPLICABLE;

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

/* ------------------------------------------------------------------ *
 * Question bank integrity
 * ------------------------------------------------------------------ */
group('Question bank');

eq('section weights total 100', AIMA.sections.reduce((sum, s) => sum + s.weight, 0), 100);
eq('there are ten sections', AIMA.sections.length, 10);
check('section ids are single letters and unique',
  new Set(AIMA.sections.map(s => s.id)).size === AIMA.sections.length &&
  AIMA.sections.every(s => /^[A-Z]$/.test(s.id)));
check('every section has an introduction for respondents', AIMA.sections.every(s => s.intro && s.intro.length > 20));

const ids = AIMA.allQuestions.map(q => q.id);
check('question ids are unique', new Set(ids).size === ids.length);
check('question ids start with their section letter',
  AIMA.allQuestions.every(q => q.id.startsWith(q.sectionId)));
check('questions are numbered continuously from 1',
  AIMA.allQuestions.every((q, i) => q.number === i + 1));
check('every question has plain-language text',
  AIMA.allQuestions.every(q => q.text && q.text.length > 15));
check('question text asks something a non-specialist can answer (no maturity jargon)',
  AIMA.allQuestions.every(q => !/maturity|weighted|score|level [0-5]/i.test(q.text)),
  AIMA.allQuestions.filter(q => /maturity|weighted|score|level [0-5]/i.test(q.text)).map(q => q.id).join(', '));

const allowedTypes = ['yesno', 'choice', 'multi', 'number', 'text'];
check('every question uses a supported simple input type',
  AIMA.allQuestions.every(q => allowedTypes.includes(q.type)),
  AIMA.allQuestions.filter(q => !allowedTypes.includes(q.type)).map(q => `${q.id}:${q.type}`).join(', '));
check('no free-text question is used for a rated control',
  AIMA.allQuestions.every(q => q.type !== 'text' || !q.scored));

check('every scored question has a remedy sentence for the console',
  AIMA.allQuestions.every(q => !q.scored || (q.remedy && q.remedy.length > 20)),
  AIMA.allQuestions.filter(q => q.scored && !q.remedy).map(q => q.id).join(', '));
check('every question maps to at least one framework',
  AIMA.allQuestions.every(q => (q.refs || []).length > 0),
  AIMA.allQuestions.filter(q => !(q.refs || []).length).map(q => q.id).join(', '));
check('every framework reference resolves to a known framework',
  AIMA.allQuestions.every(q => (q.refs || []).every(r => AIMA.getFramework(r.key))),
  AIMA.allQuestions.flatMap(q => (q.refs || []).filter(r => !AIMA.getFramework(r.key)).map(r => `${q.id}:${r.key}`)).join(', '));
check('question weights are 1 or 1.5', AIMA.allQuestions.every(q => q.weight === 1 || q.weight === 1.5));

const choiceQuestions = AIMA.allQuestions.filter(q => q.type === 'choice');
check('there are choice (combo box) questions', choiceQuestions.length >= 8, String(choiceQuestions.length));
check('every choice option carries a score between 0 and 5',
  choiceQuestions.every(q => q.options.every(o => typeof o.score === 'number' && o.score >= 0 && o.score <= 5)));
check('choice options run from worst to best',
  choiceQuestions.every(q => q.options.every((o, i) => i === 0 || q.options[i - 1].score <= o.score)),
  choiceQuestions.filter(q => q.options.some((o, i) => i > 0 && q.options[i - 1].score > o.score)).map(q => q.id).join(', '));
check('choice option values are unique within a question',
  choiceQuestions.every(q => new Set(q.options.map(o => o.value)).size === q.options.length));

const multiQuestions = AIMA.allQuestions.filter(q => q.type === 'multi');
check('there are tick-box questions', multiQuestions.length >= 4, String(multiQuestions.length));
check('every tick-box question offers a "none of these" label',
  multiQuestions.every(q => q.noneLabel && q.noneLabel.length > 3));
check('scored tick-box options all carry points',
  multiQuestions.every(q => !q.scored || q.options.every(o => o.points === undefined || o.points > 0)));

check('informational questions are excluded from the rating',
  AIMA.allQuestions.filter(q => q.informational).every(q => !q.scored));
eq('the questionnaire is short enough to stay usable', AIMA.questionCount <= 55, true);
check('most questions are yes/no or a single choice',
  AIMA.allQuestions.filter(q => q.type === 'yesno' || q.type === 'choice').length / AIMA.questionCount > 0.7);
eq('30 organisations are on the register', AIMA.entities.length, 30);
check('entity codes are unique', new Set(AIMA.entities.map(e => e.code)).size === 30);

group('Branding');
check('branding exposes an organisation name', typeof AIMA.branding.organisation === 'string' && AIMA.branding.organisation.length > 3);
check('branding exposes return instructions and a deadline',
  !!AIMA.branding.returnContact && !!AIMA.branding.returnDeadline && !!AIMA.branding.returnInstructions);
check('branding defines the full colour palette',
  ['primary', 'primaryDark', 'primaryLight', 'accent', 'accentDark', 'accentSoft', 'gold']
    .every(key => /^#[0-9a-f]{6}$/i.test(AIMA.branding.theme[key])));
check('applyBranding is available to the pages', typeof AIMA.applyBranding === 'function');

/* ------------------------------------------------------------------ *
 * The questionnaire must not expose the rating
 * ------------------------------------------------------------------ */
group('Separation between the two audiences');

const surveySource = readFileSync(join(root, 'assets', 'js', 'survey.js'), 'utf8');
const surveyHtml = readFileSync(join(root, 'index.html'), 'utf8');

check('the questionnaire never computes a rating', !/computeResults|scoreAnswer|scoreSection|aggregate\(/.test(surveySource));
check('the questionnaire never reads maturity levels or option scores',
  !/AIMA\.levels|levelFor|\.score\b/.test(surveySource));
check('the questionnaire only uses the scoring helpers that describe answers',
  (surveySource.match(/scoring\.[a-zA-Z]+/g) || [])
    .every(call => ['scoring.isAnswered', 'scoring.describeAnswer', 'scoring.round', 'scoring.NONE'].includes(call)),
  [...new Set(surveySource.match(/scoring\.[a-zA-Z]+/g) || [])].join(', '));
check('the questionnaire page does not link to the console',
  !/console\.html/.test(surveyHtml));
check('the questionnaire shows no rating words to respondents',
  !/maturity|benchmark|your score/i.test(surveyHtml.replace(/<!--[\s\S]*?-->/g, '')));
check('the questionnaire tells respondents how to save a PDF and a data file',
  /Save as PDF/.test(surveyHtml) && /Download data file/.test(surveyHtml));

const consoleHtml = readFileSync(join(root, 'console.html'), 'utf8');
check('the console is marked as restricted to the governing body', /governing body/i.test(consoleHtml));
check('the console explains the method to its users', /view-method/.test(consoleHtml));

/* ------------------------------------------------------------------ *
 * Answer scoring
 * ------------------------------------------------------------------ */
group('Turning answers into values');

const yesno = AIMA.getQuestion('A1');
eq('Yes scores 5', scoring.scoreAnswer(yesno, { value: 'yes' }), 5);
eq('No scores 0', scoring.scoreAnswer(yesno, { value: 'no' }), 0);
eq('Not sure scores 1', scoring.scoreAnswer(yesno, { value: 'unsure' }), 1);
eq('Not applicable is flagged, not scored', scoring.scoreAnswer(yesno, { value: NA }), NA);
eq('an unanswered question has no value', scoring.scoreAnswer(yesno, undefined), null);
eq('an empty answer has no value', scoring.scoreAnswer(yesno, { value: '' }), null);

const choice = AIMA.getQuestion('A4');
eq('the worst option on A4 scores 0', scoring.scoreAnswer(choice, { value: 'never' }), 0);
eq('a mid option on A4 scores 3', scoring.scoreAnswer(choice, { value: 'annual' }), 3);
eq('the best option on A4 scores 5', scoring.scoreAnswer(choice, { value: 'monthly' }), 5);
eq('an unknown option value has no score', scoring.scoreAnswer(choice, { value: 'nonsense' }), null);

const multi = AIMA.getQuestion('A3');
eq('A3 has five options', multi.options.length, 5);
eq('ticking nothing but "none of these" scores 0', scoring.scoreAnswer(multi, { value: ['none'] }), 0);
eq('ticking every box scores 5', scoring.scoreAnswer(multi, { value: multi.options.map(o => o.value) }), 5);
close('ticking two of five scores 2', scoring.scoreAnswer(multi, { value: [multi.options[0].value, multi.options[1].value] }), 2);
eq('an empty tick list counts as unanswered', scoring.scoreAnswer(multi, { value: [] }), null);
eq('a tick-box question marked not applicable is excluded',
  scoring.scoreAnswer(AIMA.getQuestion('C5'), { value: [NA] }), NA);

const informational = AIMA.getQuestion('B5');
eq('informational questions never produce a value', scoring.scoreAnswer(informational, { value: 12 }), null);
eq('informational questions still count as answered', scoring.isAnswered(informational, { value: 0 }), true);
eq('a blank number is not answered', scoring.isAnswered(informational, { value: '' }), false);

group('Describing answers in plain words');
eq('a yes/no answer reads back as Yes', scoring.describeAnswer(yesno, { value: 'yes' }), 'Yes');
eq('not sure reads back as Not sure', scoring.describeAnswer(yesno, { value: 'unsure' }), 'Not sure');
eq('not applicable reads back in words', scoring.describeAnswer(yesno, { value: NA }), 'Not applicable');
eq('an unanswered question reads back as Not answered', scoring.describeAnswer(yesno, {}), 'Not answered');
eq('a chosen option reads back as its label', scoring.describeAnswer(choice, { value: 'quarterly' }), 'At least every three months');
eq('"none of these" reads back as the question\'s own wording',
  scoring.describeAnswer(multi, { value: ['none'] }), multi.noneLabel);
check('multiple ticks read back as a list',
  scoring.describeAnswer(multi, { value: [multi.options[0].value, multi.options[1].value] })
    === `${multi.options[0].label}; ${multi.options[1].label}`);
eq('a number reads back with its unit', scoring.describeAnswer(informational, { value: 14 }), '14 tools');

/* ------------------------------------------------------------------ *
 * Ratings
 * ------------------------------------------------------------------ */
group('Rating bands');

eq('0.00 is band 1', scoring.levelFor(0).level, 1);
eq('1.49 is band 1', scoring.levelFor(1.49).level, 1);
eq('1.50 is band 2', scoring.levelFor(1.5).level, 2);
eq('2.50 is band 3', scoring.levelFor(2.5).level, 3);
eq('3.50 is band 4', scoring.levelFor(3.5).level, 4);
eq('4.50 is band 5', scoring.levelFor(4.5).level, 5);
eq('band 1 is named for a non-specialist reader', scoring.levelFor(0.5).name, 'Not established');
eq('band 5 is named for a non-specialist reader', scoring.levelFor(5).name, 'Leading');
check('rating bands are contiguous and cover 0 to 5', (() => {
  if (AIMA.levels[0].min !== 0 || AIMA.levels[AIMA.levels.length - 1].max !== 5) return false;
  for (let i = 1; i < AIMA.levels.length; i++) {
    if (Math.abs(AIMA.levels[i].min - AIMA.levels[i - 1].max - 0.01) > 1e-9) return false;
  }
  return true;
})());
eq('a rating of 2.5 is an index of 50%', scoring.toPercent(2.5), 50);

group('Whole-return rating');

function answerEverything(value) {
  const answers = {};
  AIMA.allQuestions.forEach(q => {
    if (q.type === 'yesno') answers[q.id] = { value };
    else if (q.type === 'choice') {
      const option = value === 'yes' ? q.options[q.options.length - 1] : q.options[0];
      answers[q.id] = { value: option.value };
    } else if (q.type === 'multi') {
      answers[q.id] = { value: value === 'yes' ? q.options.map(o => o.value) : ['none'] };
    } else if (q.type === 'number') {
      answers[q.id] = { value: 5 };
    }
  });
  return answers;
}

const empty = scoring.computeResults({ answers: {} });
eq('an empty return has no rating', empty.overall.score, null);
eq('an empty return is 0% complete', empty.completeness.percent, 0);
eq('an empty return produces no actions', empty.actions.length, 0);

const best = scoring.computeResults({ answers: answerEverything('yes') });
eq('answering everything positively rates 5.00', best.overall.score, 5);
eq('the best possible return is band 5', best.overall.level, 5);
eq('the best possible return has no actions', best.actions.length, 0);
eq('the best possible return is 100% complete', best.completeness.percent, 100);

const worst = scoring.computeResults({ answers: answerEverything('no') });
eq('answering everything negatively rates 0.00', worst.overall.score, 0);
eq('the worst return is band 1', worst.overall.level, 1);
eq('the worst return raises an action for every scored question', worst.actions.length, AIMA.scoredQuestionCount);
eq('the worst return has no strengths', worst.strengths.length, 0);

const unsureAll = {};
AIMA.allQuestions.filter(q => q.type === 'yesno' && q.scored).forEach(q => { unsureAll[q.id] = { value: 'unsure' }; });
const unsureResults = scoring.computeResults({ answers: unsureAll });
eq('every "not sure" is counted as a visibility gap', unsureResults.visibility.unsureCount, Object.keys(unsureAll).length);
check('"not sure" answers rate close to the bottom of the scale', unsureResults.overall.score <= 1.2, String(unsureResults.overall.score));

group('Weighted arithmetic');

// Section A: weights 1.5, 1.5, 1, 1, 1 (total 6).
const sectionA = AIMA.getSection('A');
eq('section A has five questions', sectionA.questions.length, 5);
const aAnswers = {
  A1: { value: 'yes' },                       // 5 x 1.5
  A2: { value: 'no' },                        // 0 x 1.5
  A3: { value: ['approved-tools', 'data-limits'] }, // 2 x 1
  A4: { value: 'annual' },                    // 3 x 1
  A5: { value: 'unsure' }                     // 1 x 1
};
const expectedA = (5 * 1.5 + 0 * 1.5 + 2 * 1 + 3 * 1 + 1 * 1) / 6; // 13.5 / 6 = 2.25
const resultA = scoring.scoreSection(sectionA, aAnswers);
close('section A matches the hand calculation', resultA.score, expectedA);
eq('section A rounds to 2.25', resultA.score, 2.25);
eq('section A is band 2', resultA.level, 2);
eq('section A counts one "not sure"', resultA.unsureCount, 1);

// Not applicable must leave both sides of the average.
const naSection = scoring.scoreSection(AIMA.getSection('J'), {
  J1: { value: 'no' }, J2: { value: NA }, J3: { value: NA }, J4: { value: 'yes' }, J5: { value: NA }
});
eq('a section scored only on the applicable questions', naSection.score, 5);
eq('not-applicable answers are counted separately', naSection.questionsNotApplicable, 3);
eq('all five questions in J count as answered', naSection.questionsAnswered, 5);

// A section that is entirely not applicable drops out of the overall rating.
const mostlyGood = answerEverything('yes');
AIMA.getSection('J').questions.forEach(q => {
  const question = AIMA.getQuestion(q.id);
  mostlyGood[question.id] = { value: question.allowNA ? NA : 'yes' };
});
const withNaSection = scoring.computeResults({ answers: mostlyGood });
eq('an entirely not-applicable section does not drag the rating down', withNaSection.overall.score, 5);

// Section weighting: lift only the heaviest section.
const mixed = answerEverything('no');
AIMA.getSection('C').questions.forEach(raw => {
  const question = AIMA.getQuestion(raw.id);
  if (question.type === 'yesno') mixed[question.id] = { value: 'yes' };
  else if (question.type === 'choice') mixed[question.id] = { value: question.options[question.options.length - 1].value };
  else if (question.type === 'multi') mixed[question.id] = { value: question.options.map(o => o.value) };
});
const cWeight = AIMA.getSection('C').weight;
close('the overall rating follows the section weights',
  scoring.computeResults({ answers: mixed }).overall.score, (5 * cWeight) / 100);

group('Improvement actions');

const actionCase = scoring.computeResults({
  answers: Object.assign(answerEverything('yes'), { D3: { value: 'no' }, I4: { value: 'unsure' } }),
  targetLevel: 4
});
eq('only answers below the target generate actions', actionCase.actions.length, 2);
eq('the heaviest weighted gap is ranked first', actionCase.actions[0].questionId, 'D3');
eq('a core control answered No is priority 1', actionCase.actions[0].priority, 1);
check('actions quote the answer the organisation gave', actionCase.actions[0].answer === 'No');
check('actions carry the framework references', (actionCase.actions[0].refs || []).length > 0);
check('actions carry a plain instruction', actionCase.actions.every(a => a.action.length > 20));
eq('priority counts add up', actionCase.priorityCounts.p1 + actionCase.priorityCounts.p2 + actionCase.priorityCounts.p3,
  actionCase.actions.length);
eq('the target is echoed back with the results', actionCase.targetLevel, 4);

const target5 = scoring.computeResults({ answers: answerEverything('yes'), targetLevel: 5 });
eq('a target of 5 is reachable by answering everything positively', target5.actions.length, 0);

/* ------------------------------------------------------------------ *
 * Aggregation
 * ------------------------------------------------------------------ */
group('Sector aggregation');

function makeReturn(code, mode) {
  return {
    id: 'test-' + code,
    entity: AIMA.getEntity(code),
    contact: { contactName: 'Tester', contactRole: 'CISO' },
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
eq('one organisation is of concern', agg.sector.atRisk, 1);
eq('coverage is measured against the register', agg.coverage.expected, 30);
eq('28 organisations are still outstanding', agg.coverage.missing.length, 28);
eq('the rating distribution sums to the number of returns',
  agg.levelDistribution.reduce((sum, l) => sum + l.count, 0), 2);
check('every section average is 2.5', agg.sectionAverages.every(s => s.avg === 2.5));
eq('section spread between 0 and 5 is 5', agg.sectionAverages[0].spread, 5);
eq('one organisation is below target in each section', agg.sectionAverages[0].entitiesBelowTarget, 1);
check('the weakest control list is sorted upwards',
  agg.weakestControls.every((c, i, arr) => i === 0 || arr[i - 1].avg <= c.avg));
check('per-question answer distributions are recorded', (() => {
  const stat = agg.questionStats.find(s => s.questionId === 'A1');
  return stat.distribution.Yes === 1 && stat.distribution.No === 1 && stat.responses === 2;
})());
check('informational questions appear in the analysis but are marked unrated',
  agg.questionStats.find(s => s.questionId === 'B5').scored === false);
check('common actions are counted across organisations',
  agg.commonActions.length > 0 && agg.commonActions[0].entities >= 1);
eq('grouping by region works', agg.byRegion.length, 1);
eq('grouping by type works', agg.byType.length, 2);
check('each row keeps its answers for the appendix', Object.keys(agg.entities[0].answers).length === AIMA.questionCount);

const aggEmpty = scoring.aggregate([]);
eq('aggregating nothing yields no organisations', aggEmpty.entities.length, 0);
eq('aggregating nothing yields no average', aggEmpty.sector.avg, null);
eq('aggregating nothing lists all 30 as outstanding', aggEmpty.coverage.missing.length, 30);

group('Framework coverage');
const coverage = scoring.frameworkCoverage();
eq('every framework is reported', coverage.length, AIMA.frameworks.length);
check('every framework is used by at least one question',
  coverage.every(f => f.questionCount > 0),
  coverage.filter(f => !f.questionCount).map(f => f.short).join(', '));
check('the LLM-specific framework is present',
  coverage.some(f => /OWASP/.test(f.short) && f.year >= 2025));
check('coverage is ordered by how much each framework is used',
  coverage.every((f, i, arr) => i === 0 || arr[i - 1].questionCount >= f.questionCount));

/* ------------------------------------------------------------------ *
 * Charts
 * ------------------------------------------------------------------ */
group('Chart renderers');

const radarSvg = charts.radar({
  axes: AIMA.sections.map(s => ({ label: s.title, short: s.id })),
  series: [{ name: 'Sector', color: '#0e8b7d', values: AIMA.sections.map(() => 3) }]
});
check('radar renders an svg', radarSvg.startsWith('<svg') && radarSvg.endsWith('</svg>'));
check('radar has one marker per section', (radarSvg.match(/<circle/g) || []).length === AIMA.sections.length);
check('radar plots no NaN coordinates', !/NaN/.test(radarSvg));

const barsSvg = charts.bars({ items: [{ label: 'A', value: 2 }, { label: 'B', value: null }], target: 4 });
check('bars renders an svg', barsSvg.startsWith('<svg'));
check('bars shows an em dash for a missing value', barsSvg.includes('—'));
check('bars draws the target line', barsSvg.includes('target 4'));

const longest = AIMA.sections.reduce((a, b) => (a.title.length > b.title.length ? a : b)).title;
const wrapped = charts.bars({ items: [{ label: longest, sublabel: 'w 8%', value: 2 }] });
check('long bar labels wrap rather than truncate',
  (wrapped.match(/chart-row-label/g) || []).length === 2 && wrapped.includes('<title>'));

const heatSvg = charts.heatmap({
  cols: AIMA.sections.map(s => ({ label: s.id, title: s.title })),
  rows: [{ label: 'E01', total: 3, values: AIMA.sections.map(() => 3) }]
});
check('heatmap renders an svg', heatSvg.startsWith('<svg'));
check('heatmap has a cell per section plus a total',
  (heatSvg.match(/<rect/g) || []).length === AIMA.sections.length + 1);

check('gauge renders an svg', charts.gauge({ value: 3.4 }).startsWith('<svg'));
check('gauge handles a missing rating', charts.gauge({ value: null }).includes('—'));
check('stacked bar renders an svg',
  charts.stackedBar({ segments: AIMA.levels.map(l => ({ level: l.level, name: l.name, color: l.color, count: 2 })) }).startsWith('<svg'));
check('stacked bar handles an empty dataset', charts.stackedBar({ segments: [] }).includes('No assessments'));
check('columns renders an svg', charts.columns({ items: [{ label: 'Central region', value: 3.2 }] }).startsWith('<svg'));
check('html is escaped in chart labels',
  charts.bars({ items: [{ label: '<script>x</script>', value: 1 }] }).indexOf('<script>') === -1);

/* ------------------------------------------------------------------ */

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(` - ${f.name}${f.detail ? `: ${f.detail}` : ''}`));
  process.exit(1);
}
