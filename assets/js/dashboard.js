/*
 * Sector dashboard controller
 * ---------------------------
 * Loads any number of exported assessment JSON files, recomputes their scores
 * with the shared engine and renders the aggregated sector view.
 */
(function (AIMA) {
  'use strict';

  var util = AIMA.util;
  var scoring = AIMA.scoring;
  var charts = AIMA.charts;
  var esc = util.escapeHTML;

  var STORAGE_KEY = 'aima.dashboard.records.v1';

  var records = [];
  var filters = { type: '', region: '', period: '', level: '', search: '' };
  var sort = { key: 'score', dir: 'desc' };
  var selectedEntityId = null;
  var compareEntityId = '';

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
    }, 3400);
  }

  /* ------------------------------------------------------------------ *
   * Record management
   * ------------------------------------------------------------------ */

  function normaliseRecord(raw, sourceName) {
    if (!raw || typeof raw !== 'object' || !raw.answers) return null;
    return {
      id: raw.id || util.uid('assess'),
      source: sourceName || 'imported',
      schemaVersion: raw.schemaVersion || 'unknown',
      entity: Object.assign({ code: '', name: '', type: '', region: '', size: '' }, raw.entity || {}),
      respondent: Object.assign({ name: '', role: '', email: '' }, raw.respondent || {}),
      status: raw.status || 'Draft',
      period: raw.period || '—',
      assessmentDate: raw.assessmentDate || '',
      targetLevel: raw.targetLevel || AIMA.defaultTargetLevel,
      scopeNotes: raw.scopeNotes || '',
      generalNotes: raw.generalNotes || '',
      domainNotes: raw.domainNotes || {},
      answers: raw.answers,
      demo: !!raw.demo
    };
  }

  function addRecords(list) {
    var added = 0;
    var replaced = 0;
    list.forEach(function (record) {
      var key = (record.entity.code || '') + '|' + record.period;
      var existingIndex = records.findIndex(function (r) {
        return r.id === record.id || ((r.entity.code || '') + '|' + r.period) === key;
      });
      if (existingIndex >= 0) {
        records[existingIndex] = record;
        replaced++;
      } else {
        records.push(record);
        added++;
      }
    });
    persist();
    render();
    return { added: added, replaced: replaced };
  }

  function persist() {
    util.store.save(STORAGE_KEY, records);
  }

  function restore() {
    var saved = util.store.load(STORAGE_KEY, []);
    records = Array.isArray(saved)
      ? saved.map(function (r) { return normaliseRecord(r, r.source); }).filter(Boolean)
      : [];
  }

  function filteredRecords() {
    var search = filters.search.trim().toLowerCase();
    return records.filter(function (r) {
      if (filters.type && r.entity.type !== filters.type) return false;
      if (filters.region && r.entity.region !== filters.region) return false;
      if (filters.period && r.period !== filters.period) return false;
      if (filters.level) {
        var results = scoring.computeResults(r);
        if (String(results.overall.level) !== filters.level) return false;
      }
      if (search) {
        var hay = ((r.entity.code || '') + ' ' + (r.entity.name || '')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  /* ------------------------------------------------------------------ *
   * Demo dataset — synthetic scores so the dashboard can be reviewed
   * before real submissions arrive.
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
      'Tertiary Hospital': 0.9,
      'General Hospital': 0.2,
      'Specialty Hospital': -0.1,
      'Primary Care Cluster': -0.5,
      'Diagnostics & Laboratories': 0.0,
      'Public Health': 0.3,
      'Emergency Services': -0.2,
      'Insurance & Claims': 0.6,
      'Shared Services': 0.5,
      'Research & Academia': -0.3
    };
    // Domains where the sector is typically weaker or stronger.
    var domainBias = {
      GOV: -0.3, STR: -0.2, DAT: 0.2, DET: 0.5, RES: 0.1,
      IAM: 0.3, VUL: 0.2, SEC: -0.8, MED: -0.6, PPL: -0.1
    };

    return AIMA.entities.map(function (entity, index) {
      var rand = seededRandom(1000 + index * 37);
      var base = 2.1 + (typeBias[entity.type] || 0) + (rand() * 1.4 - 0.6);
      var answers = {};

      AIMA.domains.forEach(function (domain) {
        var domainBase = base + (domainBias[domain.id] || 0) + (rand() * 0.8 - 0.4);
        domain.questions.forEach(function (q) {
          if (rand() < 0.02) {
            answers[q.id] = { value: AIMA.NOT_APPLICABLE, note: 'Not applicable to this entity’s scope.' };
            return;
          }
          var value = Math.round(domainBase + (rand() * 1.6 - 0.8));
          answers[q.id] = { value: Math.max(0, Math.min(5, value)), note: '' };
        });
      });

      // A couple of illustrative evidence notes per entity.
      var noteTargets = ['DET-1', 'SEC-1'];
      noteTargets.forEach(function (qid) {
        if (answers[qid]) answers[qid].note = 'Synthetic demo record — replace with real evidence.';
      });

      return normaliseRecord({
        id: 'demo-' + entity.code,
        entity: entity,
        respondent: { name: 'Demo respondent', role: 'Information Security Officer', email: '' },
        status: 'Submitted',
        period: '2026 H1',
        assessmentDate: '2026-03-15',
        targetLevel: AIMA.defaultTargetLevel,
        scopeNotes: 'Synthetic demonstration data generated by the dashboard.',
        answers: answers,
        demo: true
      }, 'demo dataset');
    });
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */

  function render() {
    $('fwVersion').textContent = AIMA.meta.frameworkVersion;
    $('reportOrg').textContent = AIMA.meta.owner;
    $('recordCountPill').textContent = records.length + (records.length === 1 ? ' assessment loaded' : ' assessments loaded');

    refreshFilterOptions();

    var scope = filteredRecords();
    var hasData = scope.length > 0;
    $('emptyState').hidden = hasData;
    $('dashboardBody').hidden = !hasData;

    $('filterSummary').textContent = records.length
      ? 'Showing ' + scope.length + ' of ' + records.length + ' loaded assessments.'
      : '';

    if (!hasData) {
      if (records.length) {
        $('emptyState').innerHTML = '<div class="callout warn"><strong>No assessments match the current filters.</strong> ' +
          'Reset the filters to see all ' + records.length + ' loaded records.</div>';
      }
      return;
    }

    var data = scoring.aggregate(scope);
    var demoCount = scope.filter(function (r) { return r.demo; }).length;

    $('reportMeta').textContent = [
      'Entities in scope: ' + data.coverage.assessed + ' of ' + data.coverage.expected,
      'Sector average: ' + (data.sector.avg === null ? '—' : data.sector.avg.toFixed(2) + ' / 5 (Level ' + data.sector.level + ')'),
      'Generated: ' + util.formatDateTime(data.generatedAt),
      'Framework: ' + AIMA.meta.frameworkVersion
    ].join('  ·  ');

    $('overviewHint').textContent = demoCount
      ? demoCount + ' of ' + scope.length + ' records are synthetic demo data.'
      : 'All figures recomputed from the loaded assessment files.';

    renderKPIs(data);
    renderLevelDistribution(data);
    renderCoverage(data);
    renderSectorRadar(data);
    renderDomainCharts(data);
    renderEntityRanking(data);
    renderHeatmap(data);
    renderEntityTable(data);
    renderControlTables(data);
    renderGroupCharts(data);
    renderEntityDetail(data);
  }

  function kpi(label, value, sub, color) {
    return '<div class="kpi" style="border-top-color:' + color + '">' +
      '<div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + '</div>' +
      '<div class="kpi-sub">' + esc(sub) + '</div></div>';
  }

  function renderKPIs(data) {
    var s = data.sector;
    var target = scoring.mean(data.entities.map(function (e) { return e.targetLevel; })) || AIMA.defaultTargetLevel;
    $('kpiGrid').innerHTML = [
      kpi('Entities assessed', data.coverage.assessed + ' / ' + data.coverage.expected, data.coverage.percent + '% of the register', '#1d4ed8'),
      kpi('Sector average', (s.avg === null ? '—' : s.avg.toFixed(2)), (s.levelName ? 'Level ' + s.level + ' ' + s.levelName : 'not scored') + ' · index ' + (s.avgPercent === null ? '—' : s.avgPercent + '%'), s.color),
      kpi('Median score', (s.median === null ? '—' : s.median.toFixed(2)), 'range ' + (s.min === null ? '—' : s.min.toFixed(2)) + ' – ' + (s.max === null ? '—' : s.max.toFixed(2)), '#0f172a'),
      kpi('At or above target', s.atOrAboveTarget + ' / ' + data.entities.length, 'target level ' + target.toFixed(1).replace('.0', ''), s.atOrAboveTarget ? '#0d9488' : '#94a3b8'),
      kpi('Entities at risk', String(s.atRisk), 'maturity level 1 or 2', s.atRisk ? '#dc2626' : '#0d9488'),
      kpi('Average completion', (s.avgCompleteness === null ? '—' : s.avgCompleteness.toFixed(0) + '%'), 'of questionnaire answered', '#64748b')
    ].join('');
  }

  function renderLevelDistribution(data) {
    $('levelDistribution').innerHTML = charts.stackedBar({ segments: data.levelDistribution });
  }

  function renderCoverage(data) {
    var missing = data.coverage.missing;
    var html = '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
      '<div style="flex:1 1 220px"><div style="height:12px;background:#eef2f7;border-radius:6px;overflow:hidden">' +
      '<div style="width:' + data.coverage.percent + '%;height:100%;background:#0d9488"></div></div>' +
      '<div class="card-note mt-16">' + data.coverage.assessed + ' of ' + data.coverage.expected +
      ' registered entities have submitted (' + data.coverage.percent + '%).</div></div></div>';

    if (missing.length) {
      html += '<h4 style="margin:14px 0 4px">Awaiting submission (' + missing.length + ')</h4>' +
        '<div class="card-note">' + missing.map(function (m) {
          return '<span class="pill" style="margin:2px 4px 2px 0">' + esc(m.code) + ' ' + esc(m.name) + '</span>';
        }).join('') + '</div>';
    } else {
      html += '<div class="callout mt-16"><strong>Full coverage.</strong> Every registered entity has submitted an assessment for this scope.</div>';
    }
    $('coveragePanel').innerHTML = html;
  }

  function renderSectorRadar(data) {
    var axes = AIMA.domains.map(function (d) { return { label: d.name, short: d.id }; });
    var target = data.entities.length ? data.entities[0].targetLevel : AIMA.defaultTargetLevel;

    var series = [{
      name: 'Sector average',
      color: data.sector.color,
      values: data.domainAverages.map(function (d) { return d.avg === null ? 0 : d.avg; })
    }];

    var compare = data.entities.filter(function (e) { return e.id === compareEntityId; })[0];
    if (compare) {
      series.push({
        name: compare.entityCode + ' ' + compare.entityName,
        color: '#1d4ed8',
        values: AIMA.domains.map(function (d) {
          var v = compare.domainScores[d.id];
          return v === null || v === undefined ? 0 : v;
        })
      });
    }

    series.push({
      name: 'Target level ' + target,
      color: '#0f172a',
      dashed: true,
      values: AIMA.domains.map(function () { return target; })
    });

    $('sectorRadar').innerHTML = charts.radar({ axes: axes, series: series });

    var select = $('compareEntity');
    var current = compareEntityId;
    select.innerHTML = '<option value="">Compare an entity…</option>' + data.entities.map(function (e) {
      return '<option value="' + esc(e.id) + '">' + esc(e.entityCode + ' — ' + e.entityName) + '</option>';
    }).join('');
    select.value = current;
  }

  function renderDomainCharts(data) {
    $('domainBars').innerHTML = charts.bars({
      items: data.domainAverages.map(function (d) {
        return { label: d.name, sublabel: 'w ' + d.weight + '%', value: d.avg, color: d.color };
      }),
      max: 5,
      target: data.entities.length ? data.entities[0].targetLevel : AIMA.defaultTargetLevel
    });

    $('levelLegend').innerHTML = AIMA.levels.map(function (l) {
      return '<li><span class="swatch" style="background:' + l.color + '"></span>L' + l.level + ' ' + esc(l.name) + '</li>';
    }).join('');

    $('domainTable').querySelector('tbody').innerHTML = data.domainAverages.map(function (d) {
      return '<tr>' +
        '<td><strong>' + esc(d.domainId) + '</strong> — ' + esc(d.name) + '</td>' +
        '<td class="num">' + d.weight + '%</td>' +
        '<td class="num">' + (d.avg === null ? '—' : '<span class="score-chip" style="background:' + d.color + '">' + d.avg.toFixed(2) + '</span>') + '</td>' +
        '<td class="num">' + (d.min === null ? '—' : d.min.toFixed(2)) + '</td>' +
        '<td class="num">' + (d.max === null ? '—' : d.max.toFixed(2)) + '</td>' +
        '<td class="num">' + (d.spread === null ? '—' : d.spread.toFixed(2)) + '</td>' +
        '<td class="num">' + d.entitiesBelowTarget + '</td>' +
        '</tr>';
    }).join('');
  }

  function shorten(text, max) {
    var value = String(text || '');
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }

  function renderEntityRanking(data) {
    $('entityRanking').innerHTML = charts.bars({
      items: data.entities.map(function (e) {
        return {
          label: e.entityCode + ' · ' + shorten(e.entityName, 34),
          sublabel: e.levelName ? 'L' + e.level : 'n/s',
          value: e.score,
          color: e.color
        };
      }),
      max: 5,
      rowHeight: 26,
      target: data.entities.length ? data.entities[0].targetLevel : AIMA.defaultTargetLevel
    });
  }

  function renderHeatmap(data) {
    $('heatmap').innerHTML = charts.heatmap({
      cols: AIMA.domains.map(function (d) { return { label: d.id, title: d.name }; }),
      rows: data.entities.map(function (e) {
        return {
          label: e.entityCode + ' ' + shorten(e.entityName, 26),
          total: e.score,
          values: AIMA.domains.map(function (d) {
            var v = e.domainScores[d.id];
            return v === null || v === undefined ? null : v;
          })
        };
      })
    });
  }

  function sortedEntities(data) {
    var rows = data.entities.slice();
    var key = sort.key;
    var dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      av = av === null || av === undefined ? -1 : av;
      bv = bv === null || bv === undefined ? -1 : bv;
      return (av - bv) * dir;
    });
    return rows;
  }

  function renderEntityTable(data) {
    var rows = sortedEntities(data);
    $('entityTable').querySelector('tbody').innerHTML = rows.map(function (e) {
      var p1 = e.actions.filter(function (a) { return a.priority === 1; }).length;
      return '<tr' + (e.id === selectedEntityId ? ' style="background:#f0f7ff"' : '') + '>' +
        '<td class="nowrap"><strong>' + esc(e.entityCode) + '</strong></td>' +
        '<td>' + esc(e.entityName) + (e.demo ? ' <span class="pill" style="font-size:.66rem">demo</span>' : '') + '</td>' +
        '<td>' + esc(e.entityType) + '</td>' +
        '<td>' + esc(e.region) + '</td>' +
        '<td class="num">' + (e.score === null ? '—' : '<span class="score-chip" style="background:' + e.color + '">' + e.score.toFixed(2) + '</span>') + '</td>' +
        '<td class="num">' + (e.percent === null ? '—' : e.percent + '%') + '</td>' +
        '<td class="num">' + (e.level === null ? '—' : 'L' + e.level) + '</td>' +
        '<td class="num">' + e.completeness + '%</td>' +
        '<td class="num">' + p1 + '</td>' +
        '<td class="no-print"><button type="button" class="btn btn-sm" data-view-entity="' + esc(e.id) + '">View</button></td>' +
        '</tr>';
    }).join('');

    $('entityTable').querySelectorAll('th.sortable').forEach(function (th) {
      var active = th.dataset.sort === sort.key;
      th.textContent = th.textContent.replace(/[ ▲▼]+$/, '') + (active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
    });
  }

  function renderControlTables(data) {
    $('weakTable').querySelector('tbody').innerHTML = data.weakestControls.map(function (c) {
      return '<tr><td><strong>' + esc(c.questionId) + '</strong> ' + esc(shorten(c.question, 130)) +
        '<div class="card-note">' + esc(c.domainName) + '</div></td>' +
        '<td class="num"><span class="score-chip" style="background:' + charts.colorForScore(c.avg) + '">' + c.avg.toFixed(2) + '</span></td>' +
        '<td class="num">' + c.entitiesAtOrBelow2 + ' / ' + c.responses + '</td></tr>';
    }).join('');

    $('strongTable').querySelector('tbody').innerHTML = data.strongestControls.map(function (c) {
      return '<tr><td><strong>' + esc(c.questionId) + '</strong> ' + esc(shorten(c.question, 130)) +
        '<div class="card-note">' + esc(c.domainName) + '</div></td>' +
        '<td class="num"><span class="score-chip" style="background:' + charts.colorForScore(c.avg) + '">' + c.avg.toFixed(2) + '</span></td>' +
        '<td class="num">' + c.responses + '</td></tr>';
    }).join('');

    var byAction = {};
    data.entities.forEach(function (e) {
      e.actions.forEach(function (a) {
        var bucket = byAction[a.questionId] || (byAction[a.questionId] = {
          questionId: a.questionId, domainId: a.domainId, action: a.action, entities: 0, p1: 0
        });
        bucket.entities++;
        if (a.priority === 1) bucket.p1++;
      });
    });
    var common = Object.keys(byAction).map(function (k) { return byAction[k]; })
      .sort(function (a, b) { return b.p1 - a.p1 || b.entities - a.entities; })
      .slice(0, 12);

    $('commonActionsTable').querySelector('tbody').innerHTML = common.length
      ? common.map(function (a) {
        return '<tr><td><span class="pill">' + esc(a.domainId) + '</span> ' + esc(a.action) +
          '<div class="card-note">' + esc(a.questionId) + '</div></td>' +
          '<td class="num">' + a.entities + '</td><td class="num">' + a.p1 + '</td></tr>';
      }).join('')
      : '<tr><td colspan="3" class="muted">No gaps against target in the current scope.</td></tr>';
  }

  function renderGroupCharts(data) {
    $('byTypeChart').innerHTML = charts.columns({
      items: data.byType.map(function (g) {
        return { label: g.key, value: g.avg, sublabel: 'n=' + g.count };
      })
    });
    $('byRegionChart').innerHTML = charts.columns({
      items: data.byRegion.map(function (g) {
        return { label: g.key, value: g.avg, sublabel: 'n=' + g.count };
      })
    });
  }

  function renderEntityDetail(data) {
    var card = $('entityDetailCard');
    var entity = data.entities.filter(function (e) { return e.id === selectedEntityId; })[0];
    if (!entity) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    $('entityDetailTitle').textContent = entity.entityCode + ' — ' + entity.entityName;

    var radar = charts.radar({
      axes: AIMA.domains.map(function (d) { return { label: d.name, short: d.id }; }),
      series: [
        {
          name: 'This entity',
          color: entity.color,
          values: AIMA.domains.map(function (d) {
            var v = entity.domainScores[d.id];
            return v === null || v === undefined ? 0 : v;
          })
        },
        {
          name: 'Sector average',
          color: '#7c3aed',
          values: data.domainAverages.map(function (d) { return d.avg === null ? 0 : d.avg; })
        },
        {
          name: 'Target level ' + entity.targetLevel,
          color: '#0f172a',
          dashed: true,
          values: AIMA.domains.map(function () { return entity.targetLevel; })
        }
      ]
    });

    var kpis = [
      kpi('Overall score', (entity.score === null ? '—' : entity.score.toFixed(2)), 'Level ' + entity.level + ' ' + entity.levelName, entity.color),
      kpi('Index', (entity.percent === null ? '—' : entity.percent + '%'), 'vs sector ' + (data.sector.avgPercent === null ? '—' : data.sector.avgPercent + '%'), '#1d4ed8'),
      kpi('Completion', entity.completeness + '%', 'questionnaire answered', '#64748b'),
      kpi('Priority 1 actions', String(entity.actions.filter(function (a) { return a.priority === 1; }).length), entity.actions.length + ' actions in total', '#dc2626')
    ].join('');

    var topActions = entity.actions.slice(0, 8).map(function (a) {
      return '<li class="p' + a.priority + '"><div class="action-head">' +
        '<span class="pill pill-p' + a.priority + '">P' + a.priority + '</span>' +
        '<span class="pill">' + esc(a.questionId) + '</span>' +
        '<span class="muted" style="font-size:.78rem">score ' + a.current + ' → target ' + a.target + '</span></div>' +
        '<div class="action-text">' + esc(a.action) + '</div></li>';
    }).join('');

    $('entityDetailBody').innerHTML =
      '<div class="card-note">' + esc(entity.entityType) + ' · ' + esc(entity.region) + ' · ' + esc(entity.size) +
      ' · cycle ' + esc(entity.period) + ' · respondent ' + esc(entity.respondent) + '</div>' +
      '<div class="kpi-grid mt-16">' + kpis + '</div>' +
      '<div class="chart-cols mt-16"><div class="chart-wrap">' + radar + '</div>' +
      '<div><h4>Top priority actions</h4><ul class="action-list">' +
      (topActions || '<li class="muted">No gaps against target.</li>') + '</ul></div></div>';
  }

  /* ------------------------------------------------------------------ *
   * Filters
   * ------------------------------------------------------------------ */

  function refreshFilterOptions() {
    function options(select, values, allLabel, current) {
      select.innerHTML = '<option value="">' + allLabel + '</option>' + values.map(function (v) {
        return '<option value="' + esc(v.value) + '">' + esc(v.label) + '</option>';
      }).join('');
      select.value = current;
    }

    var types = {};
    var regions = {};
    var periods = {};
    records.forEach(function (r) {
      if (r.entity.type) types[r.entity.type] = true;
      if (r.entity.region) regions[r.entity.region] = true;
      if (r.period) periods[r.period] = true;
    });

    options($('filterType'), Object.keys(types).sort().map(function (t) { return { value: t, label: t }; }), 'All types', filters.type);
    options($('filterRegion'), Object.keys(regions).sort().map(function (t) { return { value: t, label: t }; }), 'All regions', filters.region);
    options($('filterPeriod'), Object.keys(periods).sort().map(function (t) { return { value: t, label: t }; }), 'All cycles', filters.period);
    options($('filterLevel'), AIMA.levels.map(function (l) {
      return { value: String(l.level), label: 'Level ' + l.level + ' — ' + l.name };
    }), 'All levels', filters.level);
  }

  /* ------------------------------------------------------------------ *
   * Exports
   * ------------------------------------------------------------------ */

  function exportCombined() {
    var scope = filteredRecords();
    var data = scoring.aggregate(scope);
    util.downloadJSON('ai-maturity_sector_' + util.todayISO() + '.json', {
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      generatedAt: new Date().toISOString(),
      owner: AIMA.meta.owner,
      summary: {
        coverage: data.coverage,
        sector: data.sector,
        domainAverages: data.domainAverages,
        levelDistribution: data.levelDistribution,
        weakestControls: data.weakestControls,
        byType: data.byType,
        byRegion: data.byRegion
      },
      assessments: scope
    });
    toast('Combined sector JSON exported.', 'ok');
  }

  function exportEntityCSV() {
    var data = scoring.aggregate(filteredRecords());
    var columns = [
      { label: 'Entity code', value: 'entityCode' },
      { label: 'Entity name', value: 'entityName' },
      { label: 'Type', value: 'entityType' },
      { label: 'Region', value: 'region' },
      { label: 'Cycle', value: 'period' },
      { label: 'Assessment date', value: 'assessmentDate' },
      { label: 'Overall score', value: 'score' },
      { label: 'Index %', value: 'percent' },
      { label: 'Level', value: 'level' },
      { label: 'Level name', value: 'levelName' },
      { label: 'Target level', value: 'targetLevel' },
      { label: 'Completion %', value: 'completeness' },
      { label: 'P1 actions', value: function (row) { return row.actions.filter(function (a) { return a.priority === 1; }).length; } }
    ].concat(AIMA.domains.map(function (d) {
      return { label: d.id + ' — ' + d.name, value: function (row) { return row.domainScores[d.id]; } };
    }));
    util.download('ai-maturity_entities_' + util.todayISO() + '.csv', util.toCSV(columns, data.entities), 'text/csv');
    toast('Entity CSV exported.', 'ok');
  }

  function exportControlCSV() {
    var scope = filteredRecords();
    var rows = [];
    scope.forEach(function (r) {
      AIMA.allQuestions.forEach(function (q) {
        var answer = r.answers[q.id] || {};
        rows.push({
          entityCode: r.entity.code,
          entityName: r.entity.name,
          period: r.period,
          domainId: q.domainId,
          domainName: q.domainName,
          questionId: q.id,
          question: q.text,
          score: answer.value === undefined || answer.value === '' ? '' : answer.value,
          note: answer.note || ''
        });
      });
    });
    var columns = [
      { label: 'Entity code', value: 'entityCode' },
      { label: 'Entity name', value: 'entityName' },
      { label: 'Cycle', value: 'period' },
      { label: 'Domain ID', value: 'domainId' },
      { label: 'Domain', value: 'domainName' },
      { label: 'Question ID', value: 'questionId' },
      { label: 'Statement', value: 'question' },
      { label: 'Score', value: 'score' },
      { label: 'Evidence note', value: 'note' }
    ];
    util.download('ai-maturity_controls_' + util.todayISO() + '.csv', util.toCSV(columns, rows), 'text/csv');
    toast('Control-level CSV exported (' + rows.length + ' rows).', 'ok');
  }

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */

  function showLoadMessages(result, fileResults) {
    var box = $('loadMessages');
    var html = '';
    if (result.added || result.replaced) {
      html += '<div class="callout"><strong>' + result.added + ' assessment(s) added</strong>' +
        (result.replaced ? ', ' + result.replaced + ' updated (same entity and cycle)' : '') + '.</div>';
    }
    if (fileResults && fileResults.errors.length) {
      html += '<div class="callout danger"><strong>' + fileResults.errors.length + ' file(s) could not be read:</strong><ul style="margin:6px 0 0 18px">' +
        fileResults.errors.map(function (e) { return '<li>' + esc(e.file) + ' — ' + esc(e.error) + '</li>'; }).join('') + '</ul></div>';
    }
    if (fileResults && fileResults.skipped && fileResults.skipped.length) {
      html += '<div class="callout warn"><strong>' + fileResults.skipped.length + ' file(s) skipped</strong> — not an assessment export: ' +
        fileResults.skipped.map(function (f) { return esc(f); }).join(', ') + '</div>';
    }
    box.innerHTML = html;
  }

  function handleFiles(fileList) {
    util.readJSONFiles(fileList).then(function (result) {
      var normalised = [];
      var skipped = [];
      result.records.forEach(function (item) {
        // A combined sector export carries an `assessments` array.
        if (item.data && Array.isArray(item.data.assessments)) {
          item.data.assessments.forEach(function (a) {
            var record = normaliseRecord(a, item.file);
            if (record) normalised.push(record); else skipped.push(item.file);
          });
          return;
        }
        var record = normaliseRecord(item.data, item.file);
        if (record) normalised.push(record); else skipped.push(item.file);
      });
      result.skipped = skipped;
      if (!normalised.length) {
        showLoadMessages({ added: 0, replaced: 0 }, result);
        toast('No valid assessment files found.', 'err');
        return;
      }
      var outcome = addRecords(normalised);
      showLoadMessages(outcome, result);
      toast(outcome.added + ' added, ' + outcome.replaced + ' updated.', 'ok');
    });
  }

  function bindEvents() {
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
      showLoadMessages(outcome, null);
      toast('Loaded ' + outcome.added + ' synthetic demo assessments.', 'ok');
    });

    $('btnClear').addEventListener('click', function () {
      if (!window.confirm('Remove all loaded assessments from this browser?')) return;
      records = [];
      selectedEntityId = null;
      compareEntityId = '';
      persist();
      $('loadMessages').innerHTML = '';
      render();
      toast('All data cleared.', 'ok');
    });

    $('btnExportCombined').addEventListener('click', exportCombined);
    $('btnExportCSV').addEventListener('click', exportEntityCSV);
    $('btnExportControlsCSV').addEventListener('click', exportControlCSV);
    $('btnPrint').addEventListener('click', function () { window.print(); });

    [['filterType', 'type'], ['filterRegion', 'region'], ['filterPeriod', 'period'], ['filterLevel', 'level']].forEach(function (pair) {
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
      filters = { type: '', region: '', period: '', level: '', search: '' };
      $('filterSearch').value = '';
      render();
    });

    $('compareEntity').addEventListener('change', function () {
      compareEntityId = this.value;
      render();
    });

    $('entityTable').addEventListener('click', function (event) {
      var viewBtn = event.target.closest('[data-view-entity]');
      if (viewBtn) {
        selectedEntityId = viewBtn.dataset.viewEntity === selectedEntityId ? null : viewBtn.dataset.viewEntity;
        render();
        if (selectedEntityId) {
          var card = $('entityDetailCard');
          window.scrollTo({ top: card.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
        }
        return;
      }
      var th = event.target.closest('th.sortable');
      if (th) {
        var key = th.dataset.sort;
        if (sort.key === key) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
        else sort = { key: key, dir: key === 'entityCode' || key === 'entityName' || key === 'entityType' || key === 'region' ? 'asc' : 'desc' };
        render();
      }
    });

    $('btnCloseDetail').addEventListener('click', function () {
      selectedEntityId = null;
      render();
    });
  }

  function init() {
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
