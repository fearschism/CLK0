/*
 * Rating engine (governing body side)
 * -----------------------------------
 * Turns plain answers into a comparable rating. Respondents never see any of
 * this: the questionnaire asks "Yes / No / Not sure" or offers a list, and the
 * score for each option lives in framework.js.
 *
 * Answer shapes stored in a return file:
 *   yesno   { value: 'yes' | 'no' | 'unsure' | 'na' }
 *   choice  { value: '<option value>' | 'na' }
 *   multi   { value: ['<option value>', ...] }   // ['none'] means none of them
 *   number  { value: 12 }
 *   text    { value: 'free text' }
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  var NA = AIMA.NOT_APPLICABLE;
  var NONE = 'none';

  function round(value, dp) {
    var f = Math.pow(10, dp === undefined ? 2 : dp);
    return Math.round(value * f) / f;
  }

  function isBlank(value) {
    return value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0);
  }

  /** Has the respondent given any answer at all? Drives the progress bar. */
  function isAnswered(question, answer) {
    if (!answer) return false;
    if (question.type === 'number') {
      return answer.value !== '' && answer.value !== null && answer.value !== undefined && !isNaN(Number(answer.value));
    }
    return !isBlank(answer.value);
  }

  /**
   * Score for one answer: a number 0-5, the string 'na', or null when the
   * question is unanswered or does not contribute to the rating.
   */
  function scoreAnswer(question, answer) {
    if (!question.scored) return null;
    if (!isAnswered(question, answer)) return null;
    var value = answer.value;

    if (question.type === 'multi') {
      if (value.indexOf(NA) !== -1) return NA;
      if (value.indexOf(NONE) !== -1) return 0;
      var options = question.options || [];
      var total = options.reduce(function (sum, o) { return sum + (o.points === undefined ? 1 : o.points); }, 0);
      var earned = options.reduce(function (sum, o) {
        return value.indexOf(o.value) === -1 ? sum : sum + (o.points === undefined ? 1 : o.points);
      }, 0);
      return total > 0 ? round((earned / total) * 5, 3) : null;
    }

    if (value === NA) return NA;

    if (question.type === 'yesno') {
      var mapped = AIMA.yesNoScores[value];
      return mapped === undefined ? null : mapped;
    }

    if (question.type === 'choice') {
      var option = (question.options || []).filter(function (o) { return o.value === value; })[0];
      return option && option.score !== undefined ? option.score : null;
    }

    if (question.type === 'number' && question.bands) {
      var number = Number(value);
      for (var i = 0; i < question.bands.length; i++) {
        var band = question.bands[i];
        if ((band.min === undefined || number >= band.min) && (band.max === undefined || number <= band.max)) {
          return band.score;
        }
      }
      return null;
    }

    return null;
  }

  /** Plain-language rendering of an answer, used in printouts and the console. */
  function describeAnswer(question, answer) {
    if (!isAnswered(question, answer)) return 'Not answered';
    var value = answer.value;

    if (question.type === 'multi') {
      if (value.indexOf(NA) !== -1) return 'Not applicable';
      if (value.indexOf(NONE) !== -1) return question.noneLabel || 'None of these';
      var labels = (question.options || [])
        .filter(function (o) { return value.indexOf(o.value) !== -1; })
        .map(function (o) { return o.label; });
      return labels.length ? labels.join('; ') : 'Not answered';
    }

    if (value === NA) return 'Not applicable';

    if (question.type === 'yesno') {
      var yn = AIMA.yesNoOptions.filter(function (o) { return o.value === value; })[0];
      return yn ? yn.label : String(value);
    }

    if (question.type === 'choice') {
      var option = (question.options || []).filter(function (o) { return o.value === value; })[0];
      return option ? option.label : String(value);
    }

    if (question.type === 'number') {
      return String(value) + (question.unit ? ' ' + question.unit : '');
    }

    return String(value);
  }

  function levelFor(score) {
    if (score === null || score === undefined || isNaN(score)) return null;
    var clamped = Math.max(0, Math.min(5, score));
    for (var i = 0; i < AIMA.levels.length; i++) {
      if (clamped <= AIMA.levels[i].max) return AIMA.levels[i];
    }
    return AIMA.levels[AIMA.levels.length - 1];
  }

  function toPercent(score) {
    if (score === null || score === undefined || isNaN(score)) return null;
    return round((score / 5) * 100, 1);
  }

  /** Weighted rating for one section. */
  function scoreSection(section, answers) {
    var weighted = 0;
    var weightUsed = 0;
    var scored = 0;
    var na = 0;
    var unsure = 0;
    var answered = 0;
    var total = 0;

    section.questions.forEach(function (raw) {
      var question = AIMA.getQuestion(raw.id);
      total++;
      if (isAnswered(question, answers[question.id])) answered++;
      if (!question.scored) return;

      var result = scoreAnswer(question, answers[question.id]);
      if (result === NA) { na++; return; }
      if (result === null) return;
      if (question.type === 'yesno' && answers[question.id].value === 'unsure') unsure++;

      weighted += result * question.weight;
      weightUsed += question.weight;
      scored++;
    });

    var score = weightUsed > 0 ? weighted / weightUsed : null;
    var level = score === null ? null : levelFor(score);

    return {
      sectionId: section.id,
      title: section.title,
      weight: section.weight,
      score: score === null ? null : round(score, 2),
      percent: toPercent(score),
      level: level ? level.level : null,
      levelName: level ? level.name : null,
      color: level ? level.color : '#94a3b8',
      questionsTotal: total,
      questionsAnswered: answered,
      questionsScored: scored,
      questionsNotApplicable: na,
      unsureCount: unsure,
      complete: answered === total
    };
  }

  /** Improvement actions for every scored answer below the target. */
  function buildActions(answers, targetLevel) {
    var target = targetLevel || AIMA.defaultTargetLevel;
    var actions = [];

    AIMA.allQuestions.forEach(function (question) {
      if (!question.scored || !question.remedy) return;
      var result = scoreAnswer(question, answers[question.id]);
      if (result === null || result === NA) return;
      var gap = target - result;
      if (gap <= 0) return;

      var priorityScore = round(gap * question.weight * question.sectionWeight, 2);
      actions.push({
        questionId: question.id,
        questionNumber: question.number,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle,
        question: question.text,
        answer: describeAnswer(question, answers[question.id]),
        action: question.remedy,
        score: round(result, 2),
        target: target,
        gap: round(gap, 2),
        priorityScore: priorityScore,
        priority: priorityScore >= 30 ? 1 : (priorityScore >= 15 ? 2 : 3),
        refs: question.refs || []
      });
    });

    actions.sort(function (a, b) {
      return b.priorityScore - a.priorityScore || a.questionId.localeCompare(b.questionId);
    });
    return actions;
  }

  function buildStrengths(answers) {
    var strengths = [];
    AIMA.allQuestions.forEach(function (question) {
      if (!question.scored) return;
      var result = scoreAnswer(question, answers[question.id]);
      if (result === null || result === NA || result < 4) return;
      strengths.push({
        questionId: question.id,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle,
        question: question.text,
        answer: describeAnswer(question, answers[question.id]),
        score: round(result, 2)
      });
    });
    strengths.sort(function (a, b) { return b.score - a.score || a.questionId.localeCompare(b.questionId); });
    return strengths;
  }

  /** Everything the console needs about one return. */
  function computeResults(record) {
    var answers = (record && record.answers) || {};
    var targetLevel = (record && record.targetLevel) || AIMA.defaultTargetLevel;

    var sections = AIMA.sections.map(function (s) { return scoreSection(s, answers); });

    var weighted = 0;
    var weightUsed = 0;
    sections.forEach(function (s) {
      if (s.score === null) return;
      weighted += s.score * s.weight;
      weightUsed += s.weight;
    });

    var overallScore = weightUsed > 0 ? weighted / weightUsed : null;
    var level = overallScore === null ? null : levelFor(overallScore);

    var answered = 0;
    var naCount = 0;
    var unsureCount = 0;
    AIMA.allQuestions.forEach(function (question) {
      var answer = answers[question.id];
      if (isAnswered(question, answer)) answered++;
      if (answer && (answer.value === NA || (Array.isArray(answer.value) && answer.value.indexOf(NA) !== -1))) naCount++;
      if (answer && answer.value === 'unsure') unsureCount++;
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
      sections: sections,
      completeness: {
        answered: answered,
        total: AIMA.questionCount,
        percent: round((answered / AIMA.questionCount) * 100, 1),
        notApplicable: naCount,
        complete: answered === AIMA.questionCount
      },
      visibility: {
        unsureCount: unsureCount,
        percentOfScored: round((unsureCount / AIMA.scoredQuestionCount) * 100, 1)
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
   * Sector aggregation
   * ------------------------------------------------------------------ */

  function mean(values) {
    if (!values.length) return null;
    return round(values.reduce(function (a, b) { return a + b; }, 0) / values.length, 2);
  }

  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, 2);
  }

  function aggregate(records) {
    var rows = records.map(function (record) {
      var results = computeResults(record);
      var sectionScores = {};
      results.sections.forEach(function (s) { sectionScores[s.sectionId] = s.score; });
      return {
        id: record.id,
        entityCode: (record.entity && record.entity.code) || '—',
        entityName: (record.entity && record.entity.name) || 'Unnamed organisation',
        entityType: (record.entity && record.entity.type) || '—',
        region: (record.entity && record.entity.region) || '—',
        size: (record.entity && record.entity.size) || '—',
        period: record.period || '—',
        submittedDate: record.submittedDate || '—',
        contactName: (record.contact && record.contact.contactName) || '—',
        contactRole: (record.contact && record.contact.contactRole) || '',
        targetLevel: results.targetLevel,
        score: results.overall.score,
        percent: results.overall.percent,
        level: results.overall.level,
        levelName: results.overall.levelName,
        color: results.overall.color,
        completeness: results.completeness.percent,
        unsureCount: results.visibility.unsureCount,
        sectionScores: sectionScores,
        actions: results.actions,
        strengths: results.strengths,
        results: results,
        answers: record.answers || {},
        sectionNotes: record.sectionNotes || {},
        demo: !!record.demo
      };
    });

    var scored = rows.filter(function (r) { return r.score !== null; });
    var scores = scored.map(function (r) { return r.score; });

    var sectionAverages = AIMA.sections.map(function (section) {
      var values = scored
        .map(function (r) { return r.sectionScores[section.id]; })
        .filter(function (v) { return v !== null && v !== undefined; });
      var avg = mean(values);
      return {
        sectionId: section.id,
        title: section.title,
        weight: section.weight,
        avg: avg,
        min: values.length ? round(Math.min.apply(null, values), 2) : null,
        max: values.length ? round(Math.max.apply(null, values), 2) : null,
        spread: values.length ? round(Math.max.apply(null, values) - Math.min.apply(null, values), 2) : null,
        level: avg === null ? null : levelFor(avg).level,
        color: avg === null ? '#94a3b8' : levelFor(avg).color,
        entitiesBelowTarget: scored.filter(function (r) {
          var v = r.sectionScores[section.id];
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

    // Per-question view, including how the answers were distributed.
    var questionStats = AIMA.allQuestions.map(function (question) {
      var values = [];
      var distribution = {};
      var naCount = 0;
      var responses = 0;

      scored.forEach(function (row) {
        var answer = row.answers[question.id];
        if (!isAnswered(question, answer)) return;
        responses++;
        var label = describeAnswer(question, answer);
        if (question.type === 'yesno' || question.type === 'choice') {
          distribution[label] = (distribution[label] || 0) + 1;
        }
        var result = scoreAnswer(question, answer);
        if (result === NA) { naCount++; return; }
        if (result !== null) values.push(result);
      });

      return {
        questionId: question.id,
        questionNumber: question.number,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle,
        question: question.text,
        type: question.type,
        scored: question.scored,
        refs: question.refs || [],
        avg: mean(values),
        responses: responses,
        notApplicable: naCount,
        distribution: distribution,
        entitiesAtOrBelow2: values.filter(function (v) { return v <= 2; }).length,
        entitiesAtOrAbove4: values.filter(function (v) { return v >= 4; }).length
      };
    });

    var scoredStats = questionStats.filter(function (q) { return q.scored && q.avg !== null; });

    function groupBy(key) {
      var map = {};
      scored.forEach(function (row) {
        var k = row[key] || '—';
        (map[k] = map[k] || []).push(row.score);
      });
      return Object.keys(map).sort().map(function (k) {
        return { key: k, count: map[k].length, avg: mean(map[k]) };
      });
    }

    var commonActions = {};
    rows.forEach(function (row) {
      row.actions.forEach(function (action) {
        var bucket = commonActions[action.questionId] || (commonActions[action.questionId] = {
          questionId: action.questionId,
          sectionId: action.sectionId,
          action: action.action,
          entities: 0,
          p1: 0
        });
        bucket.entities++;
        if (action.priority === 1) bucket.p1++;
      });
    });

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
        atRisk: scored.filter(function (r) { return r.level <= 2; }).length,
        totalUnsure: rows.reduce(function (sum, r) { return sum + r.unsureCount; }, 0)
      },
      sectionAverages: sectionAverages,
      levelDistribution: levelDistribution,
      questionStats: questionStats,
      weakestControls: scoredStats.slice().sort(function (a, b) { return a.avg - b.avg; }).slice(0, 12),
      strongestControls: scoredStats.slice().sort(function (a, b) { return b.avg - a.avg; }).slice(0, 8),
      commonActions: Object.keys(commonActions).map(function (k) { return commonActions[k]; })
        .sort(function (a, b) { return b.p1 - a.p1 || b.entities - a.entities; }),
      byType: groupBy('entityType'),
      byRegion: groupBy('region')
    };
  }

  /** How many questions map to each reference framework. */
  function frameworkCoverage() {
    return AIMA.frameworks.map(function (framework) {
      var questions = AIMA.allQuestions.filter(function (q) {
        return (q.refs || []).some(function (r) { return r.key === framework.key; });
      });
      return {
        key: framework.key,
        name: framework.name,
        short: framework.short,
        publisher: framework.publisher,
        year: framework.year,
        note: framework.note,
        questionCount: questions.length,
        questionIds: questions.map(function (q) { return q.id; })
      };
    }).sort(function (a, b) { return b.questionCount - a.questionCount; });
  }

  AIMA.scoring = {
    isAnswered: isAnswered,
    scoreAnswer: scoreAnswer,
    describeAnswer: describeAnswer,
    levelFor: levelFor,
    toPercent: toPercent,
    scoreSection: scoreSection,
    computeResults: computeResults,
    buildActions: buildActions,
    aggregate: aggregate,
    frameworkCoverage: frameworkCoverage,
    round: round,
    mean: mean,
    median: median,
    NONE: NONE
  };
})(window.AIMA);
