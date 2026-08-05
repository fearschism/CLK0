/*
 * Scoring engine
 * --------------
 * Pure functions shared by the survey page and the dashboard so a score
 * calculated at data-entry time always matches the score recomputed later
 * from an exported JSON file.
 *
 * Answer shape:  answers["GOV-1"] = { value: 0..5 | "na", note: "free text" }
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  var NA = AIMA.NOT_APPLICABLE;

  function isScored(answer) {
    return !!answer && answer.value !== undefined && answer.value !== null && answer.value !== '' && answer.value !== NA;
  }

  function isNotApplicable(answer) {
    return !!answer && answer.value === NA;
  }

  function round(value, dp) {
    var f = Math.pow(10, dp === undefined ? 2 : dp);
    return Math.round(value * f) / f;
  }

  /** Maturity level object for a 0–5 score. */
  function levelFor(score) {
    if (score === null || score === undefined || isNaN(score)) return null;
    var clamped = Math.max(0, Math.min(5, score));
    for (var i = 0; i < AIMA.levels.length; i++) {
      if (clamped <= AIMA.levels[i].max) return AIMA.levels[i];
    }
    return AIMA.levels[AIMA.levels.length - 1];
  }

  /** A 0–5 score expressed as a 0–100 index. */
  function toPercent(score) {
    if (score === null || score === undefined || isNaN(score)) return null;
    return round((score / 5) * 100, 1);
  }

  /** Weighted score for one domain. Returns score === null when nothing scored. */
  function scoreDomain(domain, answers) {
    var weighted = 0;
    var weightUsed = 0;
    var scored = 0;
    var na = 0;

    domain.questions.forEach(function (q) {
      var answer = answers[q.id];
      if (isNotApplicable(answer)) { na++; return; }
      if (!isScored(answer)) return;
      weighted += Number(answer.value) * q.weight;
      weightUsed += q.weight;
      scored++;
    });

    var score = weightUsed > 0 ? weighted / weightUsed : null;

    return {
      domainId: domain.id,
      name: domain.name,
      weight: domain.weight,
      score: score === null ? null : round(score, 2),
      percent: toPercent(score),
      level: score === null ? null : levelFor(score).level,
      levelName: score === null ? null : levelFor(score).name,
      color: score === null ? '#94a3b8' : levelFor(score).color,
      questionsTotal: domain.questions.length,
      questionsScored: scored,
      questionsNotApplicable: na,
      answered: scored + na,
      complete: (scored + na) === domain.questions.length
    };
  }

  /**
   * Priority actions for every scored question that sits below the target level,
   * ranked by domain weight × question weight × size of the gap.
   */
  function buildActions(answers, targetLevel) {
    var target = targetLevel || AIMA.defaultTargetLevel;
    var actions = [];

    AIMA.allQuestions.forEach(function (q) {
      var answer = answers[q.id];
      if (!isScored(answer)) return;
      var value = Number(answer.value);
      var gap = target - value;
      if (gap <= 0) return;

      var priorityScore = round(gap * q.weight * q.domainWeight, 2);
      var priority = priorityScore >= 30 ? 1 : (priorityScore >= 15 ? 2 : 3);

      actions.push({
        questionId: q.id,
        domainId: q.domainId,
        domainName: q.domainName,
        question: q.text,
        action: q.remedy,
        current: value,
        target: target,
        gap: round(gap, 2),
        priorityScore: priorityScore,
        priority: priority,
        note: answer.note || ''
      });
    });

    actions.sort(function (a, b) {
      return b.priorityScore - a.priorityScore || a.questionId.localeCompare(b.questionId);
    });
    return actions;
  }

  /** Questions already at or above 4 — used for the strengths panel. */
  function buildStrengths(answers) {
    var strengths = [];
    AIMA.allQuestions.forEach(function (q) {
      var answer = answers[q.id];
      if (!isScored(answer)) return;
      if (Number(answer.value) >= 4) {
        strengths.push({
          questionId: q.id,
          domainId: q.domainId,
          domainName: q.domainName,
          question: q.text,
          score: Number(answer.value)
        });
      }
    });
    strengths.sort(function (a, b) { return b.score - a.score || a.questionId.localeCompare(b.questionId); });
    return strengths;
  }

  /**
   * Full result set for a single assessment.
   * Overall score = domain scores weighted by domain weight, ignoring domains
   * where every question was skipped or marked not applicable.
   */
  function computeResults(assessment) {
    var answers = (assessment && assessment.answers) || {};
    var targetLevel = (assessment && assessment.targetLevel) || AIMA.defaultTargetLevel;

    var domains = AIMA.domains.map(function (d) { return scoreDomain(d, answers); });

    var weighted = 0;
    var weightUsed = 0;
    domains.forEach(function (d) {
      if (d.score === null) return;
      weighted += d.score * d.weight;
      weightUsed += d.weight;
    });

    var overallScore = weightUsed > 0 ? weighted / weightUsed : null;
    var level = overallScore === null ? null : levelFor(overallScore);

    var answeredCount = 0;
    var naCount = 0;
    var notesCount = 0;
    AIMA.allQuestions.forEach(function (q) {
      var a = answers[q.id];
      if (isNotApplicable(a)) { naCount++; answeredCount++; }
      else if (isScored(a)) { answeredCount++; }
      if (a && a.note && String(a.note).trim()) notesCount++;
    });

    var actions = buildActions(answers, targetLevel);

    return {
      computedAt: new Date().toISOString(),
      frameworkVersion: AIMA.meta.frameworkVersion,
      targetLevel: targetLevel,
      overall: {
        score: overallScore === null ? null : round(overallScore, 2),
        percent: toPercent(overallScore),
        level: level ? level.level : null,
        levelName: level ? level.name : null,
        levelDescription: level ? level.description : null,
        color: level ? level.color : '#94a3b8',
        gapToTarget: overallScore === null ? null : round(Math.max(0, targetLevel - overallScore), 2)
      },
      domains: domains,
      completeness: {
        answered: answeredCount,
        total: AIMA.questionCount,
        percent: round((answeredCount / AIMA.questionCount) * 100, 1),
        notApplicable: naCount,
        withEvidenceNotes: notesCount
      },
      actions: actions,
      priorityCounts: {
        p1: actions.filter(function (a) { return a.priority === 1; }).length,
        p2: actions.filter(function (a) { return a.priority === 2; }).length,
        p3: actions.filter(function (a) { return a.priority === 3; }).length
      },
      strengths: buildStrengths(answers)
    };
  }

  /* ------------------------------------------------------------------ *
   * Sector-level aggregation (dashboard)
   * ------------------------------------------------------------------ */

  function mean(values) {
    if (!values.length) return null;
    var sum = values.reduce(function (a, b) { return a + b; }, 0);
    return round(sum / values.length, 2);
  }

  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, 2);
  }

  /**
   * Aggregate any number of assessments into the shape the dashboard renders.
   * Each input is a full assessment record (results are recomputed, never trusted).
   */
  function aggregate(assessments) {
    var rows = assessments.map(function (a) {
      var results = computeResults(a);
      var domainScores = {};
      results.domains.forEach(function (d) { domainScores[d.domainId] = d.score; });
      return {
        id: a.id,
        entityCode: (a.entity && a.entity.code) || '—',
        entityName: (a.entity && a.entity.name) || 'Unnamed entity',
        entityType: (a.entity && a.entity.type) || '—',
        region: (a.entity && a.entity.region) || '—',
        size: (a.entity && a.entity.size) || '—',
        period: a.period || '—',
        assessmentDate: a.assessmentDate || '—',
        respondent: (a.respondent && a.respondent.name) || '—',
        targetLevel: results.targetLevel,
        score: results.overall.score,
        percent: results.overall.percent,
        level: results.overall.level,
        levelName: results.overall.levelName,
        color: results.overall.color,
        completeness: results.completeness.percent,
        domainScores: domainScores,
        actions: results.actions,
        answers: a.answers || {}
      };
    });

    var scored = rows.filter(function (r) { return r.score !== null; });
    var scores = scored.map(function (r) { return r.score; });

    var domainAverages = AIMA.domains.map(function (d) {
      var values = scored
        .map(function (r) { return r.domainScores[d.id]; })
        .filter(function (v) { return v !== null && v !== undefined; });
      var avg = mean(values);
      return {
        domainId: d.id,
        name: d.name,
        weight: d.weight,
        avg: avg,
        min: values.length ? round(Math.min.apply(null, values), 2) : null,
        max: values.length ? round(Math.max.apply(null, values), 2) : null,
        spread: values.length ? round(Math.max.apply(null, values) - Math.min.apply(null, values), 2) : null,
        level: avg === null ? null : levelFor(avg).level,
        color: avg === null ? '#94a3b8' : levelFor(avg).color,
        entitiesBelowTarget: scored.filter(function (r) {
          var v = r.domainScores[d.id];
          return v !== null && v !== undefined && v < r.targetLevel;
        }).length
      };
    });

    var levelDistribution = AIMA.levels.map(function (l) {
      var count = scored.filter(function (r) { return r.level === l.level; }).length;
      return {
        level: l.level,
        name: l.name,
        color: l.color,
        count: count,
        percent: scored.length ? round((count / scored.length) * 100, 1) : 0
      };
    });

    var questionAverages = AIMA.allQuestions.map(function (q) {
      var values = [];
      scored.forEach(function (r) {
        var a = r.answers[q.id];
        if (isScored(a)) values.push(Number(a.value));
      });
      return {
        questionId: q.id,
        domainId: q.domainId,
        domainName: q.domainName,
        question: q.text,
        avg: mean(values),
        responses: values.length,
        entitiesAtOrBelow2: values.filter(function (v) { return v <= 2; }).length
      };
    }).filter(function (q) { return q.avg !== null; });

    function groupBy(key) {
      var map = {};
      scored.forEach(function (r) {
        var k = r[key] || '—';
        (map[k] = map[k] || []).push(r.score);
      });
      return Object.keys(map).sort().map(function (k) {
        return { key: k, count: map[k].length, avg: mean(map[k]) };
      });
    }

    var sectorAvg = mean(scores);

    return {
      generatedAt: new Date().toISOString(),
      frameworkVersion: AIMA.meta.frameworkVersion,
      entities: rows.slice().sort(function (a, b) {
        return (b.score === null ? -1 : b.score) - (a.score === null ? -1 : a.score) ||
          a.entityCode.localeCompare(b.entityCode);
      }),
      coverage: {
        assessed: rows.length,
        expected: AIMA.entities.length,
        percent: round((rows.length / AIMA.entities.length) * 100, 1),
        missing: AIMA.entities
          .filter(function (e) { return !rows.some(function (r) { return r.entityCode === e.code; }); })
          .map(function (e) { return { code: e.code, name: e.name }; })
      },
      sector: {
        avg: sectorAvg,
        avgPercent: toPercent(sectorAvg),
        median: median(scores),
        min: scores.length ? round(Math.min.apply(null, scores), 2) : null,
        max: scores.length ? round(Math.max.apply(null, scores), 2) : null,
        level: sectorAvg === null ? null : levelFor(sectorAvg).level,
        levelName: sectorAvg === null ? null : levelFor(sectorAvg).name,
        color: sectorAvg === null ? '#94a3b8' : levelFor(sectorAvg).color,
        avgCompleteness: mean(rows.map(function (r) { return r.completeness; })),
        belowTarget: scored.filter(function (r) { return r.score < r.targetLevel; }).length,
        atOrAboveTarget: scored.filter(function (r) { return r.score >= r.targetLevel; }).length,
        atRisk: scored.filter(function (r) { return r.level <= 2; }).length
      },
      domainAverages: domainAverages,
      levelDistribution: levelDistribution,
      weakestControls: questionAverages.slice().sort(function (a, b) { return a.avg - b.avg; }).slice(0, 12),
      strongestControls: questionAverages.slice().sort(function (a, b) { return b.avg - a.avg; }).slice(0, 8),
      byType: groupBy('entityType'),
      byRegion: groupBy('region')
    };
  }

  AIMA.scoring = {
    isScored: isScored,
    isNotApplicable: isNotApplicable,
    levelFor: levelFor,
    toPercent: toPercent,
    scoreDomain: scoreDomain,
    computeResults: computeResults,
    buildActions: buildActions,
    aggregate: aggregate,
    round: round,
    mean: mean,
    median: median
  };
})(window.AIMA);
