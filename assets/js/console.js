/*
 * Governing body console
 * ----------------------
 * Loads the returns organisations send back, applies the rating model and
 * reports across the sector. This page is for the governing body only: the
 * questionnaire never links to it.
 */
(function (AIMA) {
  'use strict';

  var util = AIMA.util;
  var scoring = AIMA.scoring;
  var charts = AIMA.charts;
  var esc = util.escapeHTML;
  var NA = AIMA.NOT_APPLICABLE;

  var RECORDS_KEY = 'aima.console.records.v2';
  var SETTINGS_KEY = 'aima.console.settings.v2';

  var records = [];
  var settings = { targetLevel: AIMA.defaultTargetLevel };
  var filters = { type: '', region: '', level: '', search: '' };
  var sort = { key: 'score', dir: 'desc' };
  var activeTab = 'dashboard';
  var compareEntityId = '';
  var reportEntityId = '';
  var questionSectionFilter = '';

  function $(id) { return document.getElementById(id); }

  function toast(message, kind) {
    var stack = $('toastStack');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, 3800);
  }

  function fmt(value, dp) {
    return (value === null || value === undefined || isNaN(value)) ? '—' : Number(value).toFixed(dp === undefined ? 2 : dp);
  }

  function shorten(text, max) {
    var value = String(text || '');
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }

  /* ------------------------------------------------------------------ *
   * Records
   * ------------------------------------------------------------------ */

  function normalise(raw, sourceFile) {
    if (!raw || typeof raw !== 'object' || !raw.answers) return { error: 'not a return file' };
    var major = String(raw.schemaVersion || '').split('.')[0];
    if (major && major !== '2') {
      return { error: 'return uses schema ' + raw.schemaVersion + ', this console expects ' + AIMA.meta.schemaVersion };
    }
    return {
      record: {
        id: raw.id || util.uid('return'),
        sourceFile: sourceFile || 'imported',
        schemaVersion: raw.schemaVersion || AIMA.meta.schemaVersion,
        frameworkVersion: raw.frameworkVersion || '',
        entity: Object.assign({ code: '', name: '', type: '', region: '', size: '' }, raw.entity || {}),
        contact: Object.assign({ contactName: '', contactRole: '', contactEmail: '', contactPhone: '', approverName: '' }, raw.contact || {}),
        period: raw.period || '—',
        submittedDate: raw.submittedDate || '',
        declarationConfirmed: !!raw.declarationConfirmed,
        answers: raw.answers,
        sectionNotes: raw.sectionNotes || {},
        demo: !!raw.demo
      }
    };
  }

  function withTarget(record) {
    return Object.assign({}, record, { targetLevel: settings.targetLevel });
  }

  function addRecords(list) {
    var added = 0;
    var replaced = 0;
    list.forEach(function (record) {
      var key = (record.entity.code || '') + '|' + record.period;
      var index = records.findIndex(function (r) {
        return r.id === record.id || ((r.entity.code || '') + '|' + r.period) === key;
      });
      if (index >= 0) { records[index] = record; replaced++; }
      else { records.push(record); added++; }
    });
    persist();
    return { added: added, replaced: replaced };
  }

  function persist() {
    util.store.save(RECORDS_KEY, records);
    util.store.save(SETTINGS_KEY, settings);
  }

  function restore() {
    var savedRecords = util.store.load(RECORDS_KEY, []);
    records = Array.isArray(savedRecords)
      ? savedRecords.map(function (r) {
        var result = normalise(r, r.sourceFile);
        return result.record || null;
      }).filter(Boolean)
      : [];
    settings = Object.assign({ targetLevel: AIMA.defaultTargetLevel }, util.store.load(SETTINGS_KEY, {}));
  }

  function scopedRecords() {
    var search = filters.search.trim().toLowerCase();
    return records.filter(function (record) {
      if (filters.type && record.entity.type !== filters.type) return false;
      if (filters.region && record.entity.region !== filters.region) return false;
      if (filters.level) {
        var results = scoring.computeResults(withTarget(record));
        if (String(results.overall.level) !== filters.level) return false;
      }
      if (search) {
        var hay = ((record.entity.code || '') + ' ' + (record.entity.name || '')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    }).map(withTarget);
  }

  /* ------------------------------------------------------------------ *
   * Demonstration data — plain answers, exactly as an organisation would
   * submit them. The console derives the ratings from these.
   * ------------------------------------------------------------------ */

  function seededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildDemoRecords() {
    var typeBias = {
      'Tertiary Hospital': 0.20,
      'General Hospital': 0.02,
      'Specialty Hospital': -0.04,
      'Primary Care Cluster': -0.14,
      'Diagnostics & Laboratories': -0.02,
      'Public Health': 0.06,
      'Emergency Services': -0.06,
      'Insurance & Claims': 0.14,
      'Shared Services': 0.10,
      'Research & Academia': -0.08
    };
    // Sections the sector tends to be weaker or stronger on.
    var sectionBias = {
      A: -0.04, B: 0.00, C: 0.04, D: -0.16, E: -0.06,
      F: 0.10, G: -0.18, H: -0.08, I: -0.02, J: -0.10
    };

    return AIMA.entities.map(function (entity, index) {
      var rand = seededRandom(2600 + index * 53);
      var base = 0.48 + (typeBias[entity.type] || 0) + (rand() * 0.36 - 0.18);
      var clinical = ['Tertiary Hospital', 'General Hospital', 'Specialty Hospital', 'Primary Care Cluster'].indexOf(entity.type) !== -1;
      var answers = {};

      AIMA.sections.forEach(function (section) {
        var capability = Math.max(0.03, Math.min(0.97, base + (sectionBias[section.id] || 0) + (rand() * 0.2 - 0.1)));

        section.questions.forEach(function (raw) {
          var question = AIMA.getQuestion(raw.id);
          var roll = rand();

          if (question.id === 'J1') { answers[question.id] = { value: clinical ? 'yes' : 'no' }; return; }

          if (question.allowNA && !clinical && question.sectionId === 'J' && roll < 0.65) {
            answers[question.id] = { value: NA };
            return;
          }
          if (question.allowNA && roll < 0.05) {
            answers[question.id] = { value: NA };
            return;
          }

          if (question.type === 'yesno') {
            answers[question.id] = { value: roll < capability ? 'yes' : (roll < capability + 0.14 ? 'unsure' : 'no') };
            return;
          }

          if (question.type === 'choice') {
            var options = question.options;
            var position = capability * (options.length - 1) + (rand() * 1.2 - 0.6);
            var pick = Math.max(0, Math.min(options.length - 1, Math.round(position)));
            answers[question.id] = { value: options[pick].value };
            return;
          }

          if (question.type === 'multi') {
            var chosen = question.options.filter(function () { return rand() < capability; })
              .map(function (o) { return o.value; });
            answers[question.id] = { value: chosen.length ? chosen : [scoring.NONE] };
            return;
          }

          if (question.type === 'number') {
            var value = question.id === 'H5'
              ? Math.round(rand() * 5 * capability)
              : Math.round(3 + capability * 45 * rand() + 1);
            answers[question.id] = { value: value };
          }
        });
      });

      return normalise({
        id: 'demo-' + entity.code,
        schemaVersion: AIMA.meta.schemaVersion,
        frameworkVersion: AIMA.meta.frameworkVersion,
        entity: entity,
        contact: {
          contactName: 'Demonstration respondent',
          contactRole: 'Information Security Officer',
          contactEmail: '',
          contactPhone: '',
          approverName: 'Demonstration approver'
        },
        period: AIMA.branding.cycle,
        submittedDate: '2026-05-14',
        declarationConfirmed: true,
        answers: answers,
        sectionNotes: { D: 'Demonstration record generated by the console, not a real return.' },
        demo: true
      }, 'demonstration data').record;
    });
  }

  /* ------------------------------------------------------------------ *
   * Tabs and printing
   * ------------------------------------------------------------------ */

  function showTab(tab) {
    activeTab = tab;
    ['dashboard', 'entity', 'questions', 'data', 'method'].forEach(function (name) {
      var view = $('view-' + name);
      if (name === tab) view.removeAttribute('hidden'); else view.setAttribute('hidden', '');
      var button = $('tab-' + name);
      if (button) button.setAttribute('aria-selected', name === tab ? 'true' : 'false');
    });
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function setPrintLetterhead(data) {
    var titles = {
      dashboard: 'AI Cyber Assurance — Sector Report',
      entity: 'AI Cyber Assurance — Organisation Report',
      questions: 'AI Cyber Assurance — Question Analysis',
      data: 'AI Cyber Assurance — Returns Received',
      method: 'AI Cyber Assurance — Method and Frameworks'
    };
    $('printTitle').textContent = titles[activeTab] || titles.dashboard;

    if (activeTab === 'entity') {
      var entity = data && data.entities.filter(function (e) { return e.id === reportEntityId; })[0];
      $('printSubtitle').textContent = entity ? entity.entityCode + ' — ' + entity.entityName : '';
      $('printMeta').textContent = entity ? [
        entity.entityType + ' · ' + entity.region,
        'Return completed ' + entity.submittedDate + ' by ' + entity.contactName,
        'Target rating: level ' + settings.targetLevel,
        'Framework ' + AIMA.meta.frameworkVersion
      ].join('  ·  ') : '';
      return;
    }

    $('printSubtitle').textContent = data
      ? data.coverage.assessed + ' of ' + data.coverage.expected + ' organisations reported'
      : '';
    $('printMeta').textContent = data ? [
      'Sector average: ' + fmt(data.sector.avg) + ' of 5' + (data.sector.levelName ? ' (' + data.sector.levelName + ')' : ''),
      'Target rating: level ' + settings.targetLevel,
      'Produced ' + util.formatDateTime(data.generatedAt),
      'Framework ' + AIMA.meta.frameworkVersion
    ].join('  ·  ') : '';
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */

  function render() {
    $('recordCountPill').textContent = records.length + (records.length === 1 ? ' return loaded' : ' returns loaded');
    refreshFilterOptions();
    refreshTargetSelect();

    var scope = scopedRecords();
    var data = scope.length ? scoring.aggregate(scope) : null;

    $('emptyState').hidden = !!data;
    $('dashboardBody').hidden = !data;
    $('filterSummary').textContent = records.length
      ? 'Showing ' + scope.length + ' of ' + records.length + ' returns'
      : '';

    if (data && records.length && !scope.length) {
      $('emptyState').hidden = false;
    }
    if (!data) {
      if (records.length) {
        $('emptyState').innerHTML = '<div class="callout warn"><h4>No returns match the current filters</h4>' +
          '<p class="mb-0">Reset the filters to see all ' + records.length + ' loaded returns.</p></div>';
      }
      renderDataTab();
      renderMethodTab();
      setPrintLetterhead(null);
      return;
    }

    if (activeTab === 'dashboard') renderDashboard(data);
    if (activeTab === 'entity') renderEntityTab(data);
    if (activeTab === 'questions') renderQuestionTab(data);
    renderDataTab();
    renderMethodTab();
    setPrintLetterhead(data);
  }

  function kpi(label, value, sub, color) {
    return '<div class="kpi" style="border-top-color:' + color + '">' +
      '<div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + '</div>' +
      '<div class="kpi-sub">' + esc(sub) + '</div></div>';
  }

  function renderDashboard(data) {
    var sector = data.sector;
    var demoCount = data.entities.filter(function (e) { return e.demo; }).length;

    $('overviewHint').textContent = demoCount
      ? demoCount + ' of ' + data.entities.length + ' returns are demonstration data'
      : 'Calculated from the returns currently in scope';

    $('kpiGrid').innerHTML = [
      kpi('Returns received', data.coverage.assessed + ' / ' + data.coverage.expected, data.coverage.percent + '% of the register', '#1d5a80'),
      kpi('Sector average', fmt(sector.avg), (sector.levelName || 'not rated') + ' · ' + (sector.avgPercent === null ? '—' : sector.avgPercent + '%'), sector.color),
      kpi('Meeting target', sector.atOrAboveTarget + ' / ' + data.entities.length, 'target is level ' + settings.targetLevel, sector.atOrAboveTarget ? '#0e8b7d' : '#94a3b8'),
      kpi('Of most concern', String(sector.atRisk), 'rated not established or emerging', sector.atRisk ? '#c0392b' : '#0e8b7d'),
      kpi('Questionnaire completed', (sector.avgCompleteness === null ? '—' : Math.round(sector.avgCompleteness) + '%'), 'average across returns', '#64748b'),
      kpi('“Not sure” answers', String(sector.totalUnsure), 'where nobody could confirm a control', sector.totalUnsure ? '#d97706' : '#0e8b7d')
    ].join('');

    $('levelDistribution').innerHTML = charts.stackedBar({ segments: data.levelDistribution });

    renderCoverage(data);
    renderSectorRadar(data);

    $('sectionBars').innerHTML = charts.bars({
      items: data.sectionAverages.map(function (s) {
        return { label: s.title, sublabel: 'w ' + s.weight + '%', value: s.avg, color: s.color };
      }),
      max: 5,
      target: settings.targetLevel
    });

    $('sectionTable').querySelector('tbody').innerHTML = data.sectionAverages.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.sectionId) + '</strong> — ' + esc(s.title) + '</td>' +
        '<td class="num">' + s.weight + '%</td>' +
        '<td class="num">' + (s.avg === null ? '—' : '<span class="score-chip" style="background:' + s.color + '">' + fmt(s.avg) + '</span>') + '</td>' +
        '<td class="num">' + fmt(s.min) + '</td><td class="num">' + fmt(s.max) + '</td><td class="num">' + fmt(s.spread) + '</td>' +
        '<td class="num">' + s.entitiesBelowTarget + '</td></tr>';
    }).join('');

    $('entityRanking').innerHTML = charts.bars({
      items: data.entities.map(function (e) {
        return {
          label: e.entityCode + ' · ' + shorten(e.entityName, 32),
          sublabel: e.level ? 'L' + e.level : '—',
          value: e.score,
          color: e.color
        };
      }),
      max: 5, rowHeight: 26, target: settings.targetLevel
    });

    $('heatmap').innerHTML = charts.heatmap({
      cols: AIMA.sections.map(function (s) { return { label: s.id, title: s.title }; }),
      rows: data.entities.map(function (e) {
        return {
          label: e.entityCode + ' ' + shorten(e.entityName, 26),
          total: e.score,
          values: AIMA.sections.map(function (s) {
            var v = e.sectionScores[s.id];
            return v === null || v === undefined ? null : v;
          })
        };
      })
    });

    renderEntityTable(data);

    $('byTypeChart').innerHTML = charts.columns({
      items: data.byType.map(function (g) { return { label: g.key, value: g.avg, sublabel: 'n=' + g.count }; })
    });
    $('byRegionChart').innerHTML = charts.columns({
      items: data.byRegion.map(function (g) { return { label: g.key, value: g.avg, sublabel: 'n=' + g.count }; })
    });
  }

  function renderCoverage(data) {
    var html = '<div style="height:12px;background:#e8edf3;border-radius:6px;overflow:hidden">' +
      '<div style="width:' + data.coverage.percent + '%;height:100%;background:var(--brand-accent)"></div></div>' +
      '<p class="card-note mt-16">' + data.coverage.assessed + ' of ' + data.coverage.expected +
      ' organisations on the register have returned a questionnaire (' + data.coverage.percent + '%).</p>';

    if (data.coverage.missing.length) {
      html += '<h4 style="margin:12px 0 6px">Still outstanding (' + data.coverage.missing.length + ')</h4><div>' +
        data.coverage.missing.map(function (m) {
          return '<span class="pill" style="margin:2px 4px 2px 0">' + esc(m.code) + ' ' + esc(m.name) + '</span>';
        }).join('') + '</div>';
    } else {
      html += '<div class="callout good mt-16"><strong>Every organisation has reported.</strong> No follow-up needed for this cycle.</div>';
    }
    $('coveragePanel').innerHTML = html;
  }

  function renderSectorRadar(data) {
    var series = [{
      name: 'Sector average',
      color: data.sector.color,
      values: data.sectionAverages.map(function (s) { return s.avg === null ? 0 : s.avg; })
    }];

    var compare = data.entities.filter(function (e) { return e.id === compareEntityId; })[0];
    if (compare) {
      series.push({
        name: compare.entityCode + ' ' + shorten(compare.entityName, 26),
        color: '#1d5a80',
        values: AIMA.sections.map(function (s) {
          var v = compare.sectionScores[s.id];
          return v === null || v === undefined ? 0 : v;
        })
      });
    }

    series.push({
      name: 'Target level ' + settings.targetLevel,
      color: '#16202b',
      dashed: true,
      values: AIMA.sections.map(function () { return settings.targetLevel; })
    });

    $('sectorRadar').innerHTML = charts.radar({
      axes: AIMA.sections.map(function (s) { return { label: s.title, short: s.id }; }),
      series: series
    });

    var select = $('compareEntity');
    select.innerHTML = '<option value="">Compare an organisation…</option>' + data.entities.map(function (e) {
      return '<option value="' + esc(e.id) + '">' + esc(e.entityCode + ' — ' + e.entityName) + '</option>';
    }).join('');
    select.value = compareEntityId;
  }

  function sortedEntities(data) {
    var rows = data.entities.slice();
    var dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var av = a[sort.key];
      var bv = b[sort.key];
      if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * dir;
      av = av === null || av === undefined ? -1 : av;
      bv = bv === null || bv === undefined ? -1 : bv;
      return (av - bv) * dir;
    });
    return rows;
  }

  function renderEntityTable(data) {
    $('entityTable').querySelector('tbody').innerHTML = sortedEntities(data).map(function (e) {
      var p1 = e.actions.filter(function (a) { return a.priority === 1; }).length;
      return '<tr>' +
        '<td class="nowrap"><strong>' + esc(e.entityCode) + '</strong></td>' +
        '<td>' + esc(e.entityName) + (e.demo ? ' <span class="pill" style="font-size:.66rem">demo</span>' : '') + '</td>' +
        '<td>' + esc(e.entityType) + '</td><td>' + esc(e.region) + '</td>' +
        '<td class="num">' + (e.score === null ? '—' : '<span class="score-chip" style="background:' + e.color + '">' + fmt(e.score) + '</span>') + '</td>' +
        '<td class="num">' + (e.level === null ? '—' : esc(e.levelName)) + '</td>' +
        '<td class="num">' + e.completeness + '%</td>' +
        '<td class="num">' + e.unsureCount + '</td>' +
        '<td class="num">' + p1 + '</td>' +
        '<td class="no-print"><button type="button" class="btn btn-sm" data-report-entity="' + esc(e.id) + '">Report</button></td>' +
        '</tr>';
    }).join('');

    $('entityTable').querySelectorAll('th.sortable').forEach(function (th) {
      var active = th.dataset.sort === sort.key;
      th.textContent = th.textContent.replace(/[ ▲▼]+$/, '') + (active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
    });
  }

  /* ---------------------- Organisation report ---------------------- */

  function renderEntityTab(data) {
    var picker = $('entityPicker');
    picker.innerHTML = data.entities.map(function (e) {
      return '<option value="' + esc(e.id) + '">' + esc(e.entityCode + ' — ' + e.entityName) + '</option>';
    }).join('');

    if (!data.entities.some(function (e) { return e.id === reportEntityId; })) {
      reportEntityId = data.entities.length ? data.entities[0].id : '';
    }
    picker.value = reportEntityId;

    var entity = data.entities.filter(function (e) { return e.id === reportEntityId; })[0];
    if (!entity) {
      $('entityReport').innerHTML = '<div class="card"><p class="muted mb-0">No returns in scope.</p></div>';
      return;
    }

    var results = entity.results;
    var html = '';

    html += '<section class="card avoid-break">' +
      '<div class="card-head"><h2>' + esc(entity.entityCode + ' — ' + entity.entityName) + '</h2></div>' +
      '<p class="card-note">' + [
        esc(entity.entityType), esc(entity.region), esc(entity.size),
        'return for ' + esc(entity.period),
        'completed ' + esc(entity.submittedDate) + ' by ' + esc(entity.contactName) + (entity.contactRole ? ', ' + esc(entity.contactRole) : ''),
        entity.results.completeness.answered + ' of ' + entity.results.completeness.total + ' questions answered'
      ].join(' &nbsp;·&nbsp; ') + '</p>' +
      '<div style="display:grid;grid-template-columns:minmax(180px,220px) minmax(0,1fr);gap:20px;align-items:center;margin-top:14px">' +
      '<div>' + charts.gauge({
        value: results.overall.score,
        color: results.overall.color,
        label: results.overall.levelName || 'Not rated'
      }) + '</div><div>' +
      (results.overall.score === null
        ? '<p class="muted">Not enough answers to produce a rating.</p>'
        : '<h3 style="color:' + results.overall.color + '">' + esc(results.overall.levelName) + '</h3>' +
          '<p class="card-note">' + esc(results.overall.levelDescription) + '</p>') +
      '<div class="kpi-grid mt-16" id="summaryKpis">' + [
        kpi('Rating', fmt(results.overall.score) + ' / 5', 'sector average ' + fmt(data.sector.avg), results.overall.color),
        kpi('Gap to target', fmt(results.overall.gapToTarget), 'target is level ' + settings.targetLevel, results.overall.gapToTarget > 0 ? '#d97706' : '#0e8b7d'),
        kpi('Priority 1 actions', String(results.priorityCounts.p1), results.actions.length + ' actions in total', '#c0392b'),
        kpi('Questions answered', results.completeness.percent + '%', results.completeness.notApplicable + ' marked not applicable', '#64748b'),
        kpi('“Not sure” answers', String(results.visibility.unsureCount), 'visibility gaps to follow up', results.visibility.unsureCount ? '#d97706' : '#0e8b7d'),
        kpi('Declaration', entity.results ? (recordFor(entity.id) && recordFor(entity.id).declarationConfirmed ? 'Confirmed' : 'Not confirmed') : '—', 'signed off by the organisation', '#1d5a80')
      ].join('') + '</div></div></div></section>';

    html += '<div class="chart-cols">' +
      '<section class="card avoid-break"><div class="card-head"><h3>Profile against the sector and the target</h3></div>' +
      '<div class="chart-wrap">' + charts.radar({
        axes: AIMA.sections.map(function (s) { return { label: s.title, short: s.id }; }),
        series: [
          {
            name: 'This organisation', color: entity.color,
            values: AIMA.sections.map(function (s) {
              var v = entity.sectionScores[s.id];
              return v === null || v === undefined ? 0 : v;
            })
          },
          {
            name: 'Sector average', color: '#7c3aed',
            values: data.sectionAverages.map(function (s) { return s.avg === null ? 0 : s.avg; })
          },
          {
            name: 'Target level ' + settings.targetLevel, color: '#16202b', dashed: true,
            values: AIMA.sections.map(function () { return settings.targetLevel; })
          }
        ]
      }) + '</div></section>' +
      '<section class="card avoid-break"><div class="card-head"><h3>Rating by section</h3></div>' +
      '<div class="chart-wrap">' + charts.bars({
        items: results.sections.map(function (s) {
          return { label: s.title, sublabel: 'w ' + s.weight + '%', value: s.score, color: s.color };
        }),
        max: 5, target: settings.targetLevel
      }) + '</div></section></div>';

    html += '<section class="card avoid-break"><div class="card-head"><h3>Section detail</h3></div><div class="table-wrap">' +
      '<table class="data"><thead><tr><th>Section</th><th class="num">Weight</th><th class="num">Rating</th><th>Band</th>' +
      '<th class="num">Gap</th><th class="num">Answered</th><th class="num">Not sure</th></tr></thead><tbody>' +
      results.sections.map(function (s) {
        var gap = s.score === null ? null : Math.max(0, settings.targetLevel - s.score);
        return '<tr><td><strong>' + esc(s.sectionId) + '</strong> — ' + esc(s.title) + '</td>' +
          '<td class="num">' + s.weight + '%</td>' +
          '<td class="num">' + (s.score === null ? '—' : '<span class="score-chip" style="background:' + s.color + '">' + fmt(s.score) + '</span>') + '</td>' +
          '<td>' + (s.levelName ? esc(s.levelName) : '<span class="muted">not rated</span>') + '</td>' +
          '<td class="num">' + (gap === null ? '—' : (gap === 0 ? '<span style="color:var(--brand-accent-dark);font-weight:700">met</span>' : fmt(gap))) + '</td>' +
          '<td class="num">' + s.questionsAnswered + '/' + s.questionsTotal +
          (s.questionsNotApplicable ? ' <span class="muted">(' + s.questionsNotApplicable + ' n/a)</span>' : '') + '</td>' +
          '<td class="num">' + s.unsureCount + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';

    html += '<section class="card"><div class="card-head"><h3>What this organisation should do next</h3><div class="spacer"></div>' +
      '<span class="card-note">' + results.actions.length + ' actions · P1 ' + results.priorityCounts.p1 +
      ' · P2 ' + results.priorityCounts.p2 + ' · P3 ' + results.priorityCounts.p3 + '</span></div>';
    html += results.actions.length
      ? [1, 2, 3].map(function (priority) {
        var items = results.actions.filter(function (a) { return a.priority === priority; });
        if (!items.length) return '';
        var titles = { 1: 'Priority 1 — address first', 2: 'Priority 2 — significant gaps', 3: 'Priority 3 — refinement' };
        return '<h4 style="margin-top:14px">' + titles[priority] + ' <span class="muted">(' + items.length + ')</span></h4>' +
          '<ul class="action-list">' + items.map(function (a) {
            return '<li class="p' + a.priority + '"><div class="action-head">' +
              '<span class="pill pill-p' + a.priority + '">P' + a.priority + '</span>' +
              '<span class="pill">' + esc(a.sectionId) + '</span>' +
              '<span class="pill">Q' + a.questionNumber + '</span>' +
              (a.refs || []).slice(0, 2).map(function (ref) {
                var framework = AIMA.getFramework(ref.key);
                return '<span class="pill pill-ref">' + esc(framework ? framework.short : ref.key) + '</span>';
              }).join('') +
              '</div><div class="action-text">' + esc(a.action) + '</div>' +
              '<div class="action-meta">Question: ' + esc(a.question) + '<br />They answered: <strong>' + esc(a.answer) + '</strong></div></li>';
          }).join('') + '</ul>';
      }).join('')
      : '<p class="muted">Nothing below the target rating for the questions answered.</p>';
    html += '</section>';

    var unsure = AIMA.allQuestions.filter(function (q) {
      var answer = entity.answers[q.id];
      return answer && answer.value === 'unsure';
    });
    if (unsure.length) {
      html += '<section class="card avoid-break"><div class="card-head"><h3>Questions they could not answer</h3></div>' +
        '<p class="card-note">Each of these is a visibility gap: worth a direct conversation, because the organisation cannot confirm the control either way.</p>' +
        '<ul>' + unsure.map(function (q) {
          return '<li><strong>Q' + q.number + '</strong> ' + esc(q.text) + '</li>';
        }).join('') + '</ul></section>';
    }

    if (results.strengths.length) {
      html += '<section class="card avoid-break"><div class="card-head"><h3>Established strengths</h3></div><div class="table-wrap">' +
        '<table class="data"><thead><tr><th class="num">No.</th><th>Question</th><th>Answer</th></tr></thead><tbody>' +
        results.strengths.map(function (s) {
          var question = AIMA.getQuestion(s.questionId);
          return '<tr><td class="num">' + question.number + '</td><td>' + esc(s.question) + '</td><td>' + esc(s.answer) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
    }

    html += '<section class="card page-break"><h3>Appendix — every answer as submitted</h3><div class="table-wrap">' +
      '<table class="answer-log"><thead><tr><th style="width:6%">No.</th><th style="width:56%">Question</th><th>Answer</th></tr></thead><tbody>';
    AIMA.sections.forEach(function (section) {
      html += '<tr class="section-row"><td colspan="3">' + esc(section.id + ' — ' + section.title) + '</td></tr>';
      section.questions.forEach(function (raw) {
        var question = AIMA.getQuestion(raw.id);
        var answer = entity.answers[question.id];
        html += '<tr><td>' + question.number + '</td><td>' + esc(question.text) + '</td><td>' +
          esc(scoring.isAnswered(question, answer) ? scoring.describeAnswer(question, answer) : 'Not answered') + '</td></tr>';
      });
      if (entity.sectionNotes[section.id]) {
        html += '<tr><td></td><td><em>Their comments</em></td><td>' + esc(entity.sectionNotes[section.id]) + '</td></tr>';
      }
    });
    html += '</tbody></table></div></section>';

    $('entityReport').innerHTML = html;
  }

  function recordFor(id) {
    return records.filter(function (r) { return r.id === id; })[0] || null;
  }

  /* ---------------------- Question analysis ---------------------- */

  function distributionHTML(stat) {
    var question = AIMA.getQuestion(stat.questionId);
    if (question.type === 'multi') {
      return stat.responses ? '<span class="muted">' + stat.responses + ' returns</span>' : '—';
    }
    if (question.type === 'number') {
      return '<span class="muted">' + stat.responses + ' returns</span>';
    }

    var order = question.type === 'yesno'
      ? [{ label: 'Yes', color: '#0e8b7d' }, { label: 'No', color: '#c0392b' }, { label: 'Not sure', color: '#d97706' }, { label: 'Not applicable', color: '#94a3b8' }]
      : (question.options || []).map(function (option) {
        return { label: option.label, color: charts.colorForScore(option.score) };
      }).concat([{ label: 'Not applicable', color: '#94a3b8' }]);

    var total = Object.keys(stat.distribution).reduce(function (sum, k) { return sum + stat.distribution[k]; }, 0);
    if (!total) return '—';

    var bar = '<div class="dist-bar">' + order.map(function (entry) {
      var count = stat.distribution[entry.label] || 0;
      if (!count) return '';
      return '<span style="width:' + (count / total * 100).toFixed(1) + '%;background:' + entry.color + '" title="' +
        esc(entry.label + ': ' + count) + '"></span>';
    }).join('') + '</div>';

    var text = order.filter(function (entry) { return stat.distribution[entry.label]; })
      .map(function (entry) { return esc(entry.label) + ' ' + stat.distribution[entry.label]; })
      .join(' · ');

    return bar + '<div class="card-note" style="margin-top:4px">' + text + '</div>';
  }

  function refsHTML(refs) {
    return (refs || []).map(function (ref) {
      var framework = AIMA.getFramework(ref.key);
      return '<span class="pill pill-ref" title="' + esc((framework ? framework.name : ref.key) + (ref.cite ? ' — ' + ref.cite : '')) + '">' +
        esc(framework ? framework.short : ref.key) + '</span>';
    }).join(' ');
  }

  function renderQuestionTab(data) {
    $('weakTable').querySelector('tbody').innerHTML = data.weakestControls.map(function (stat) {
      return '<tr><td><strong>Q' + stat.questionNumber + '</strong> ' + esc(shorten(stat.question, 120)) +
        '<div class="card-note">' + esc(stat.sectionTitle) + '</div></td>' +
        '<td class="num"><span class="score-chip" style="background:' + charts.colorForScore(stat.avg) + '">' + fmt(stat.avg) + '</span></td>' +
        '<td class="num">' + stat.entitiesAtOrBelow2 + ' / ' + stat.responses + '</td></tr>';
    }).join('');

    $('commonActionsTable').querySelector('tbody').innerHTML = data.commonActions.length
      ? data.commonActions.slice(0, 12).map(function (action) {
        return '<tr><td><span class="pill">' + esc(action.sectionId) + '</span> ' + esc(action.action) + '</td>' +
          '<td class="num">' + action.entities + '</td><td class="num">' + action.p1 + '</td></tr>';
      }).join('')
      : '<tr><td colspan="3" class="muted">No gaps against the target in the current scope.</td></tr>';

    var sectionSelect = $('questionSectionFilter');
    if (sectionSelect.options.length <= 1) {
      sectionSelect.innerHTML = '<option value="">All sections</option>' + AIMA.sections.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.id + ' — ' + s.title) + '</option>';
      }).join('');
    }
    sectionSelect.value = questionSectionFilter;

    var stats = data.questionStats.filter(function (stat) {
      return !questionSectionFilter || stat.sectionId === questionSectionFilter;
    });

    $('questionTable').querySelector('tbody').innerHTML = stats.map(function (stat) {
      return '<tr>' +
        '<td class="num">' + stat.questionNumber + '</td>' +
        '<td>' + esc(stat.question) +
        '<div class="card-note">' + esc(stat.sectionId + ' — ' + stat.sectionTitle) +
        (stat.scored ? '' : ' · context only, not rated') + '</div></td>' +
        '<td>' + refsHTML(stat.refs) + '</td>' +
        '<td class="num">' + (stat.avg === null ? '—' : '<span class="score-chip" style="background:' + charts.colorForScore(stat.avg) + '">' + fmt(stat.avg) + '</span>') + '</td>' +
        '<td style="min-width:200px">' + distributionHTML(stat) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ---------------------- Data and method tabs ---------------------- */

  function renderDataTab() {
    $('recordTable').querySelector('tbody').innerHTML = records.length
      ? records.map(function (record) {
        var progress = scoring.computeResults(withTarget(record)).completeness;
        return '<tr>' +
          '<td class="nowrap"><strong>' + esc(record.entity.code || '—') + '</strong></td>' +
          '<td>' + esc(record.entity.name || 'Unnamed') + (record.demo ? ' <span class="pill" style="font-size:.66rem">demo</span>' : '') + '</td>' +
          '<td>' + esc(record.period) + '</td>' +
          '<td>' + esc(record.contact.contactName || '—') + '</td>' +
          '<td class="nowrap">' + esc(record.submittedDate || '—') + '</td>' +
          '<td class="num">' + progress.percent + '%</td>' +
          '<td>' + (record.declarationConfirmed ? 'Yes' : '<span class="muted">No</span>') + '</td>' +
          '<td class="muted">' + esc(shorten(record.sourceFile, 34)) + '</td>' +
          '<td class="no-print"><button type="button" class="btn btn-sm btn-danger" data-remove-record="' + esc(record.id) + '">Remove</button></td>' +
          '</tr>';
      }).join('')
      : '<tr><td colspan="9" class="muted">No returns loaded.</td></tr>';
  }

  function renderMethodTab() {
    $('levelTable').querySelector('tbody').innerHTML = AIMA.levels.map(function (level) {
      return '<tr><td><span class="score-chip" style="background:' + level.color + '">' + level.level + '</span> <strong>' +
        esc(level.name) + '</strong></td><td class="num">' + level.min.toFixed(2) + ' – ' + level.max.toFixed(2) + '</td>' +
        '<td>' + esc(level.description) + '</td></tr>';
    }).join('');

    var scaleRows = AIMA.yesNoOptions.map(function (option, index) {
      return '<tr>' + (index === 0 ? '<td rowspan="4"><strong>Yes / No / Not sure</strong></td>' : '') +
        '<td>' + esc(option.label) + '</td><td class="num">' + AIMA.yesNoScores[option.value] + '</td></tr>';
    }).join('') +
      '<tr><td>Not applicable</td><td class="num">excluded</td></tr>' +
      '<tr><td rowspan="2"><strong>Choose from a list</strong></td><td>Each option carries its own value</td><td class="num">0 – 5</td></tr>' +
      '<tr><td>Example: “Reviewed every three months”</td><td class="num">4</td></tr>' +
      '<tr><td><strong>Tick all that apply</strong></td><td>Share of items ticked, scaled to 5. “None of these” scores 0.</td><td class="num">0 – 5</td></tr>' +
      '<tr><td><strong>A number</strong></td><td>Recorded as context; does not affect the rating</td><td class="num">—</td></tr>';
    $('scaleTable').querySelector('tbody').innerHTML = scaleRows;

    $('frameworkTable').querySelector('tbody').innerHTML = scoring.frameworkCoverage().map(function (framework) {
      return '<tr><td><strong>' + esc(framework.short) + '</strong><div class="card-note">' + esc(framework.name) + '</div></td>' +
        '<td>' + esc(framework.publisher) + '</td><td class="num">' + framework.year + '</td>' +
        '<td class="num">' + framework.questionCount + '</td><td>' + esc(framework.note) + '</td></tr>';
    }).join('');

    $('methodSectionTable').querySelector('tbody').innerHTML = AIMA.sections.map(function (section) {
      return '<tr><td><strong>' + esc(section.id) + '</strong> — ' + esc(section.title) + '</td>' +
        '<td class="num">' + section.weight + '%</td>' +
        '<td class="num">' + section.questions.length + '</td>' +
        '<td>' + (section.refs || []).map(function (ref) {
          var framework = AIMA.getFramework(ref.key);
          return '<span class="pill pill-ref" title="' + esc(ref.cite || '') + '">' + esc(framework ? framework.short : ref.key) + '</span>';
        }).join(' ') + '</td></tr>';
    }).join('');
  }

  function refreshTargetSelect() {
    var select = $('targetSelect');
    if (!select.options.length) {
      select.innerHTML = AIMA.levels.filter(function (l) { return l.level >= 2; }).map(function (l) {
        return '<option value="' + l.level + '">Level ' + l.level + ' — ' + esc(l.name) + '</option>';
      }).join('');
    }
    select.value = String(settings.targetLevel);
  }

  function refreshFilterOptions() {
    function options(select, values, allLabel, current) {
      select.innerHTML = '<option value="">' + allLabel + '</option>' + values.map(function (v) {
        return '<option value="' + esc(v.value) + '">' + esc(v.label) + '</option>';
      }).join('');
      select.value = current;
    }
    var types = {};
    var regions = {};
    records.forEach(function (record) {
      if (record.entity.type) types[record.entity.type] = true;
      if (record.entity.region) regions[record.entity.region] = true;
    });
    options($('filterType'), Object.keys(types).sort().map(function (t) { return { value: t, label: t }; }), 'All types', filters.type);
    options($('filterRegion'), Object.keys(regions).sort().map(function (r) { return { value: r, label: r }; }), 'All regions', filters.region);
    options($('filterLevel'), AIMA.levels.map(function (l) {
      return { value: String(l.level), label: l.name };
    }), 'All ratings', filters.level);
  }

  /* ------------------------------------------------------------------ *
   * Import and export
   * ------------------------------------------------------------------ */

  function handleFiles(fileList) {
    util.readJSONFiles(fileList).then(function (result) {
      var normalised = [];
      var rejected = [];

      result.records.forEach(function (item) {
        var payload = item.data;
        var list = payload && Array.isArray(payload.returns) ? payload.returns : [payload];
        list.forEach(function (entry) {
          var outcome = normalise(entry, item.file);
          if (outcome.record) normalised.push(outcome.record);
          else rejected.push({ file: item.file, error: outcome.error });
        });
      });

      var messages = '';
      if (normalised.length) {
        var outcome = addRecords(normalised);
        messages += '<div class="callout good"><strong>' + outcome.added + ' return(s) added' +
          (outcome.replaced ? ', ' + outcome.replaced + ' replaced (same organisation and cycle)' : '') + '.</strong></div>';
        toast(outcome.added + ' added, ' + outcome.replaced + ' replaced.', 'ok');
      }
      if (result.errors.length || rejected.length) {
        messages += '<div class="callout danger"><strong>Some files could not be loaded:</strong><ul>' +
          result.errors.map(function (e) { return '<li>' + esc(e.file) + ' — ' + esc(e.error) + '</li>'; }).join('') +
          rejected.map(function (e) { return '<li>' + esc(e.file) + ' — ' + esc(e.error) + '</li>'; }).join('') +
          '</ul></div>';
        if (!normalised.length) toast('No valid returns found in those files.', 'err');
      }
      $('loadMessages').innerHTML = messages;
      render();
    });
  }

  function exportCombined() {
    var scope = scopedRecords();
    var data = scoring.aggregate(scope);
    util.downloadJSON('ai-assurance_sector_' + util.todayISO() + '.json', {
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      producedBy: AIMA.branding.organisation,
      documentRef: AIMA.branding.documentRef,
      period: AIMA.branding.cycle,
      targetLevel: settings.targetLevel,
      generatedAt: new Date().toISOString(),
      summary: {
        coverage: data.coverage,
        sector: data.sector,
        sectionAverages: data.sectionAverages,
        levelDistribution: data.levelDistribution,
        weakestControls: data.weakestControls,
        commonActions: data.commonActions,
        byType: data.byType,
        byRegion: data.byRegion
      },
      organisations: data.entities.map(function (entity) {
        return {
          entityCode: entity.entityCode,
          entityName: entity.entityName,
          entityType: entity.entityType,
          region: entity.region,
          score: entity.score,
          percent: entity.percent,
          level: entity.level,
          levelName: entity.levelName,
          completeness: entity.completeness,
          unsureCount: entity.unsureCount,
          sectionScores: entity.sectionScores,
          actions: entity.actions
        };
      }),
      returns: scope.map(function (record) {
        var copy = Object.assign({}, record);
        delete copy.targetLevel;
        return copy;
      })
    });
    toast('Combined sector file exported.', 'ok');
  }

  function exportEntityCSV() {
    var data = scoring.aggregate(scopedRecords());
    var columns = [
      { label: 'Code', value: 'entityCode' },
      { label: 'Organisation', value: 'entityName' },
      { label: 'Type', value: 'entityType' },
      { label: 'Region', value: 'region' },
      { label: 'Cycle', value: 'period' },
      { label: 'Date completed', value: 'submittedDate' },
      { label: 'Completed by', value: 'contactName' },
      { label: 'Rating (0-5)', value: 'score' },
      { label: 'Index %', value: 'percent' },
      { label: 'Band', value: 'levelName' },
      { label: 'Target level', value: 'targetLevel' },
      { label: 'Questions answered %', value: 'completeness' },
      { label: 'Not sure answers', value: 'unsureCount' },
      { label: 'Priority 1 actions', value: function (row) { return row.actions.filter(function (a) { return a.priority === 1; }).length; } }
    ].concat(AIMA.sections.map(function (section) {
      return { label: section.id + ' — ' + section.title, value: function (row) { return row.sectionScores[section.id]; } };
    }));
    util.download('ai-assurance_organisations_' + util.todayISO() + '.csv', util.toCSV(columns, data.entities), 'text/csv');
    toast('Organisation CSV exported.', 'ok');
  }

  function exportAnswersCSV() {
    var scope = scopedRecords();
    var rows = [];
    scope.forEach(function (record) {
      AIMA.allQuestions.forEach(function (question) {
        var answer = record.answers[question.id];
        var score = scoring.scoreAnswer(question, answer);
        rows.push({
          entityCode: record.entity.code,
          entityName: record.entity.name,
          period: record.period,
          sectionId: question.sectionId,
          sectionTitle: question.sectionTitle,
          questionNumber: question.number,
          questionId: question.id,
          question: question.text,
          answer: scoring.isAnswered(question, answer) ? scoring.describeAnswer(question, answer) : '',
          score: score === null ? '' : (score === NA ? 'n/a' : score),
          frameworks: (question.refs || []).map(function (ref) {
            var framework = AIMA.getFramework(ref.key);
            return (framework ? framework.short : ref.key) + (ref.cite ? ' (' + ref.cite + ')' : '');
          }).join(' | ')
        });
      });
    });
    var columns = [
      { label: 'Code', value: 'entityCode' },
      { label: 'Organisation', value: 'entityName' },
      { label: 'Cycle', value: 'period' },
      { label: 'Section', value: 'sectionId' },
      { label: 'Section title', value: 'sectionTitle' },
      { label: 'Question no.', value: 'questionNumber' },
      { label: 'Question id', value: 'questionId' },
      { label: 'Question', value: 'question' },
      { label: 'Answer', value: 'answer' },
      { label: 'Derived value', value: 'score' },
      { label: 'Frameworks', value: 'frameworks' }
    ];
    util.download('ai-assurance_answers_' + util.todayISO() + '.csv', util.toCSV(columns, rows), 'text/csv');
    toast('Answer-level CSV exported (' + rows.length + ' rows).', 'ok');
  }

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */

  function bindEvents() {
    document.querySelectorAll('.tabs button').forEach(function (button) {
      button.addEventListener('click', function () { showTab(button.dataset.tab); });
    });

    var drop = $('dropzone');
    var fileInput = $('fileInput');
    drop.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length) handleFiles(this.files);
      this.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });

    $('btnDemo').addEventListener('click', function () {
      var outcome = addRecords(buildDemoRecords());
      $('loadMessages').innerHTML = '<div class="callout"><strong>Demonstration data loaded.</strong> ' +
        outcome.added + ' added, ' + outcome.replaced + ' replaced. These are synthetic returns, marked “demo”.</div>';
      render();
      toast('Demonstration data loaded.', 'ok');
    });

    $('btnClear').addEventListener('click', function () {
      if (!window.confirm('Remove all loaded returns from this browser?')) return;
      records = [];
      reportEntityId = '';
      compareEntityId = '';
      persist();
      $('loadMessages').innerHTML = '';
      render();
      toast('All returns removed.', 'ok');
    });

    $('btnExportCombined').addEventListener('click', exportCombined);
    $('btnExportCSV').addEventListener('click', exportEntityCSV);
    $('btnExportAnswersCSV').addEventListener('click', exportAnswersCSV);
    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('btnPrintEntity').addEventListener('click', function () { window.print(); });

    $('targetSelect').addEventListener('change', function () {
      settings.targetLevel = Number(this.value);
      persist();
      render();
    });

    [['filterType', 'type'], ['filterRegion', 'region'], ['filterLevel', 'level']].forEach(function (pair) {
      $(pair[0]).addEventListener('change', function () {
        filters[pair[1]] = this.value;
        render();
      });
    });
    $('filterSearch').addEventListener('input', function () {
      filters.search = this.value;
      render();
    });
    $('btnResetFilters').addEventListener('click', function () {
      filters = { type: '', region: '', level: '', search: '' };
      $('filterSearch').value = '';
      render();
    });

    $('compareEntity').addEventListener('change', function () {
      compareEntityId = this.value;
      render();
    });

    $('entityPicker').addEventListener('change', function () {
      reportEntityId = this.value;
      render();
    });

    $('questionSectionFilter').addEventListener('change', function () {
      questionSectionFilter = this.value;
      render();
    });

    $('entityTable').addEventListener('click', function (event) {
      var reportBtn = event.target.closest('[data-report-entity]');
      if (reportBtn) {
        reportEntityId = reportBtn.getAttribute('data-report-entity');
        showTab('entity');
        return;
      }
      var th = event.target.closest('th.sortable');
      if (th) {
        var key = th.dataset.sort;
        if (sort.key === key) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
        else sort = { key: key, dir: ['entityCode', 'entityName', 'entityType', 'region'].indexOf(key) >= 0 ? 'asc' : 'desc' };
        render();
      }
    });

    $('recordTable').addEventListener('click', function (event) {
      var button = event.target.closest('[data-remove-record]');
      if (!button) return;
      var id = button.getAttribute('data-remove-record');
      records = records.filter(function (record) { return record.id !== id; });
      persist();
      render();
      toast('Return removed.', 'ok');
    });
  }

  function init() {
    AIMA.applyBranding({ title: 'AI Cyber Assurance Console' });
    restore();
    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.AIMA);
