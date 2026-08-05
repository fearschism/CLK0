/*
 * Self-test for the framework definition, scoring engine and chart renderers.
 *
 *   node tools/test-scoring.mjs
 *
 * The browser files are classic scripts that attach to `window`, so they are
 * evaluated here inside a VM context with a minimal window stub. That keeps a
 * single source of truth: these tests exercise exactly the code the pages run.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {}, Math, Date, JSON, String, Number, Object, Array, isNaN, console };
sandbox.globalThis = sandbox;
const context = createContext(sandbox);

for (const file of ['framework.js', 'scoring.js', 'charts.js']) {
  runInContext(readFileSync(join(root, 'assets', 'js', file), 'utf8'), context, { filename: file });
}

const AIMA = sandbox.window.AIMA;
const { scoring, charts } = AIMA;

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

function group(title) {
  console.log(`\n${title}`);
}

/* ------------------------------------------------------------------ *
 * Framework integrity
 * ------------------------------------------------------------------ */
group('Framework definition');

eq('domain weights total 100', AIMA.domains.reduce((sum, d) => sum + d.weight, 0), 100);
eq('30 entities are registered', AIMA.entities.length, 30);
check('entity codes are unique', new Set(AIMA.entities.map(e => e.code)).size === AIMA.entities.length);
check('every entity has a type in the type list',
  AIMA.entities.every(e => AIMA.entityTypes.includes(e.type)),
  AIMA.entities.filter(e => !AIMA.entityTypes.includes(e.type)).map(e => e.code).join(', '));
check('every entity has a known region', AIMA.entities.every(e => AIMA.regions.includes(e.region)));
check('every entity has a known size band', AIMA.entities.every(e => AIMA.entitySizes.includes(e.size)));

const ids = AIMA.allQuestions.map(q => q.id);
check('question ids are unique', new Set(ids).size === ids.length);
check('question ids are prefixed with their domain',
  AIMA.allQuestions.every(q => q.id.startsWith(q.domainId + '-')));
check('every question has text, help and a remedy',
  AIMA.allQuestions.every(q => q.text && q.help && q.remedy),
  AIMA.allQuestions.filter(q => !(q.text && q.help && q.remedy)).map(q => q.id).join(', '));
check('every question has a positive weight', AIMA.allQuestions.every(q => q.weight > 0));
check('each domain has at least four questions', AIMA.domains.every(d => d.questions.length >= 4));
eq('question count matches the flattened list', AIMA.questionCount, AIMA.allQuestions.length);
check('maturity level bands are contiguous and cover 0–5', (() => {
  if (AIMA.levels[0].min !== 0) return false;
  if (AIMA.levels[AIMA.levels.length - 1].max !== 5) return false;
  for (let i = 1; i < AIMA.levels.length; i++) {
    if (Math.abs(AIMA.levels[i].min - AIMA.levels[i - 1].max - 0.01) > 1e-9) return false;
  }
  return true;
})());

/* ------------------------------------------------------------------ *
 * Level mapping
 * ------------------------------------------------------------------ */
group('Level mapping');

eq('0.00 is level 1', scoring.levelFor(0).level, 1);
eq('1.49 is level 1', scoring.levelFor(1.49).level, 1);
eq('1.50 is level 2', scoring.levelFor(1.5).level, 2);
eq('2.50 is level 3', scoring.levelFor(2.5).level, 3);
eq('3.49 is level 3', scoring.levelFor(3.49).level, 3);
eq('3.50 is level 4', scoring.levelFor(3.5).level, 4);
eq('4.50 is level 5', scoring.levelFor(4.5).level, 5);
eq('5.00 is level 5', scoring.levelFor(5).level, 5);
eq('score 2.5 maps to index 50%', scoring.toPercent(2.5), 50);
eq('score 5 maps to index 100%', scoring.toPercent(5), 100);

/* ------------------------------------------------------------------ *
 * Single-assessment scoring
 * ------------------------------------------------------------------ */
group('Assessment scoring');

function answersAll(value) {
  const answers = {};
  AIMA.allQuestions.forEach(q => { answers[q.id] = { value }; });
  return answers;
}

const empty = scoring.computeResults({ answers: {} });
eq('empty assessment has no overall score', empty.overall.score, null);
eq('empty assessment completeness is 0%', empty.completeness.percent, 0);
eq('empty assessment produces no actions', empty.actions.length, 0);
check('empty assessment scores no domain', empty.domains.every(d => d.score === null));

const perfect = scoring.computeResults({ answers: answersAll(5) });
eq('all fives scores 5.00', perfect.overall.score, 5);
eq('all fives is level 5', perfect.overall.level, 5);
eq('all fives is index 100%', perfect.overall.percent, 100);
eq('all fives leaves no gap to target', perfect.overall.gapToTarget, 0);
eq('all fives produces no actions', perfect.actions.length, 0);
eq('all fives completeness is 100%', perfect.completeness.percent, 100);
eq('all fives counts every question as a strength', perfect.strengths.length, AIMA.questionCount);

const zero = scoring.computeResults({ answers: answersAll(0) });
eq('all zeros scores 0', zero.overall.score, 0);
eq('all zeros is level 1', zero.overall.level, 1);
eq('all zeros raises an action for every question', zero.actions.length, AIMA.questionCount);
eq('all zeros gap to target equals the target', zero.overall.gapToTarget, AIMA.defaultTargetLevel);
check('all zeros has no strengths', zero.strengths.length === 0);

const three = scoring.computeResults({ answers: answersAll(3) });
eq('all threes scores 3.00', three.overall.score, 3);
eq('all threes is level 3 Defined', three.overall.levelName, 'Defined');

// Hand-calculated weighted domain: GOV weights are 1.5, 1, 1.5, 1, 1, 1 (total 7).
group('Weighted arithmetic');
const gov = AIMA.getDomain('GOV');
eq('GOV has six questions', gov.questions.length, 6);
const govAnswers = {
  'GOV-1': { value: 4 }, 'GOV-2': { value: 2 }, 'GOV-3': { value: 5 },
  'GOV-4': { value: 1 }, 'GOV-5': { value: 3 }, 'GOV-6': { value: 0 }
};
const expectedGov = (4 * 1.5 + 2 * 1 + 5 * 1.5 + 1 * 1 + 3 * 1 + 0 * 1) / 7; // 19.5 / 7
const govResult = scoring.scoreDomain(gov, govAnswers);
close('GOV weighted score matches hand calculation', govResult.score, expectedGov);
eq('GOV rounds to 2.79', govResult.score, 2.79);
eq('GOV is level 3', govResult.level, 3);

// Not-applicable answers must drop out of both numerator and denominator.
const naAnswers = { 'GOV-1': { value: 4 }, 'GOV-2': { value: 'na' }, 'GOV-3': { value: 4 } };
const naResult = scoring.scoreDomain(gov, naAnswers);
eq('N/A answers are excluded from the score', naResult.score, 4);
eq('N/A answers are counted as answered', naResult.answered, 3);
eq('N/A count is tracked separately', naResult.questionsNotApplicable, 1);
eq('only scored questions count towards scored total', naResult.questionsScored, 2);

// A domain that is entirely N/A must not drag the overall score down.
const allNaGov = {};
gov.questions.forEach(q => { allNaGov[q.id] = { value: 'na' }; });
const mixed = scoring.computeResults({ answers: Object.assign({}, answersAll(4), allNaGov) });
eq('fully N/A domain is excluded from the overall score', mixed.overall.score, 4);
check('fully N/A domain reports a null domain score',
  mixed.domains.find(d => d.domainId === 'GOV').score === null);

// Overall score must respect domain weighting: lift only the heaviest domain.
const detBoost = Object.assign({}, answersAll(2));
AIMA.getDomain('DET').questions.forEach(q => { detBoost[q.id] = { value: 5 }; });
const detResult = scoring.computeResults({ answers: detBoost });
const expectedOverall = (2 * (100 - 14) + 5 * 14) / 100;
close('overall score is weighted by domain weight', detResult.overall.score, expectedOverall);

group('Action plan');
const actionCase = scoring.computeResults({
  answers: Object.assign({}, answersAll(4), { 'DET-1': { value: 0 }, 'PPL-2': { value: 3 } }),
  targetLevel: 4
});
eq('only sub-target questions generate actions', actionCase.actions.length, 2);
eq('the largest weighted gap is ranked first', actionCase.actions[0].questionId, 'DET-1');
eq('a 4-point gap on a core control is priority 1', actionCase.actions[0].priority, 1);
eq('a 1-point gap on a standard control is priority 3', actionCase.actions[1].priority, 3);
check('actions carry a remedy sentence', actionCase.actions.every(a => typeof a.action === 'string' && a.action.length > 10));
eq('priority counts add up to the action list',
  actionCase.priorityCounts.p1 + actionCase.priorityCounts.p2 + actionCase.priorityCounts.p3,
  actionCase.actions.length);

const target5 = scoring.computeResults({ answers: answersAll(4), targetLevel: 5 });
eq('raising the target surfaces new actions', target5.actions.length, AIMA.questionCount);
eq('target is echoed back in the results', target5.targetLevel, 5);

group('Notes and completeness');
const partial = scoring.computeResults({
  answers: { 'GOV-1': { value: 3, note: 'Policy approved 2025-11.' }, 'GOV-2': { value: 'na' } }
});
eq('two answers of 54 questions is 3.7% complete', partial.completeness.percent,
  scoring.round((2 / AIMA.questionCount) * 100, 1));
eq('evidence notes are counted', partial.completeness.withEvidenceNotes, 1);
eq('N/A is included in the answered count', partial.completeness.answered, 2);

/* ------------------------------------------------------------------ *
 * Sector aggregation
 * ------------------------------------------------------------------ */
group('Sector aggregation');

function record(code, value, extra = {}) {
  const entity = AIMA.getEntity(code);
  return Object.assign({
    id: 'test-' + code,
    entity,
    respondent: { name: 'Tester' },
    period: '2026 H1',
    assessmentDate: '2026-03-01',
    targetLevel: 4,
    answers: answersAll(value)
  }, extra);
}

const agg = scoring.aggregate([record('E01', 5), record('E02', 3), record('E03', 1)]);
eq('three assessments are aggregated', agg.entities.length, 3);
eq('sector average of 5, 3 and 1 is 3.00', agg.sector.avg, 3);
eq('sector median of 5, 3 and 1 is 3.00', agg.sector.median, 3);
eq('sector minimum is 1', agg.sector.min, 1);
eq('sector maximum is 5', agg.sector.max, 5);
eq('entities are ranked highest first', agg.entities[0].entityCode, 'E01');
eq('lowest scoring entity is last', agg.entities[2].entityCode, 'E03');
eq('one entity is at or above target', agg.sector.atOrAboveTarget, 1);
eq('two entities are below target', agg.sector.belowTarget, 2);
eq('one entity is at risk (level 1–2)', agg.sector.atRisk, 1);
eq('coverage counts against the 30-entity register', agg.coverage.expected, 30);
eq('coverage percentage is 10%', agg.coverage.percent, 10);
eq('27 entities are still missing', agg.coverage.missing.length, 27);
eq('level distribution sums to the entity count',
  agg.levelDistribution.reduce((sum, l) => sum + l.count, 0), 3);
eq('every domain average is 3.00', agg.domainAverages.every(d => d.avg === 3), true);
eq('domain spread across 1 and 5 is 4', agg.domainAverages[0].spread, 4);
eq('entities below target per domain', agg.domainAverages[0].entitiesBelowTarget, 2);
check('weakest controls list is sorted ascending',
  agg.weakestControls.every((c, i, arr) => i === 0 || arr[i - 1].avg <= c.avg));
check('strongest controls list is sorted descending',
  agg.strongestControls.every((c, i, arr) => i === 0 || arr[i - 1].avg >= c.avg));
eq('grouping by region works', agg.byRegion.length, new Set(['Central', 'North', 'South']).size);
eq('grouping by type works', agg.byType.reduce((sum, g) => sum + g.count, 0), 3);
check('per-entity actions are attached', agg.entities[2].actions.length > 0);

const aggEmpty = scoring.aggregate([]);
eq('aggregating nothing yields no entities', aggEmpty.entities.length, 0);
eq('aggregating nothing yields a null average', aggEmpty.sector.avg, null);
eq('aggregating nothing lists all 30 entities as missing', aggEmpty.coverage.missing.length, 30);

// Aggregation must recompute rather than trust a stale `results` block.
const stale = record('E04', 2, { results: { overall: { score: 4.9, level: 5 } } });
const aggStale = scoring.aggregate([stale]);
eq('stored results are ignored in favour of recomputation', aggStale.entities[0].score, 2);

/* ------------------------------------------------------------------ *
 * Chart renderers
 * ------------------------------------------------------------------ */
group('Chart renderers');

const radarSvg = charts.radar({
  axes: AIMA.domains.map(d => ({ label: d.name, short: d.id })),
  series: [{ name: 'Entity', color: '#0d9488', values: AIMA.domains.map(() => 3) }]
});
check('radar renders an svg', radarSvg.startsWith('<svg') && radarSvg.endsWith('</svg>'));
check('radar has one point marker per domain',
  (radarSvg.match(/<circle/g) || []).length === AIMA.domains.length);
check('radar plots no NaN coordinates', !/NaN/.test(radarSvg));

const barsSvg = charts.bars({ items: [{ label: 'A', value: 2 }, { label: 'B', value: null }], target: 4 });
check('bars renders an svg', barsSvg.startsWith('<svg'));
check('bars shows an em dash for a null value', barsSvg.includes('—'));
check('bars draws the target line', barsSvg.includes('target 4'));
check('short bar labels stay on one line', (barsSvg.match(/chart-row-label/g) || []).length === 2);

const longLabel = 'Medical Device & Clinical System Protection';
const wrapped = charts.bars({ items: [{ label: longLabel, sublabel: 'w 8%', value: 2 }] });
check('long bar labels wrap onto two lines', (wrapped.match(/chart-row-label/g) || []).length === 2);
check('wrapped labels break on a word boundary and lose no words',
  longLabel.split(' ').every(word => wrapped.includes(word.replace(/&/g, '&amp;'))),
  wrapped.slice(wrapped.indexOf('chart-row-label'), wrapped.indexOf('chart-row-label') + 220));
check('wrapped labels keep the full text in a tooltip', wrapped.includes('<title>Medical Device &amp; Clinical System Protection</title>'));

const heatSvg = charts.heatmap({
  cols: AIMA.domains.map(d => ({ label: d.id, title: d.name })),
  rows: [{ label: 'E01', total: 3, values: AIMA.domains.map(() => 3) }]
});
check('heatmap renders an svg', heatSvg.startsWith('<svg'));
check('heatmap has a cell per domain plus a total',
  (heatSvg.match(/<rect/g) || []).length === AIMA.domains.length + 1);

check('gauge renders an svg', charts.gauge({ value: 3.4 }).startsWith('<svg'));
check('gauge handles a null score', charts.gauge({ value: null }).includes('—'));
check('stacked bar renders an svg', charts.stackedBar({ segments: AIMA.levels.map(l => ({ level: l.level, name: l.name, color: l.color, count: 2 })) }).startsWith('<svg'));
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
