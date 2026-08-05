/*
 * Survey page controller
 * ----------------------
 * Renders the questionnaire from the framework definition, keeps a draft in
 * localStorage, computes live scores and produces the JSON / CSV / PDF outputs.
 */
(function (AIMA) {
  'use strict';

  var util = AIMA.util;
  var scoring = AIMA.scoring;
  var charts = AIMA.charts;
  var esc = util.escapeHTML;

  var STORAGE_KEY = 'aima.survey.draft.v1';
  var CUSTOM_ENTITY = '__custom__';
  var RING_CIRCUMFERENCE = 2 * Math.PI * 30;

  var state = newAssessment();
  var saveTimer = null;

  function newAssessment() {
    return {
      id: util.uid('assess'),
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      entity: { code: '', name: '', type: '', region: '', size: '' },
      respondent: { name: '', role: '', email: '' },
      reviewedBy: '',
      status: 'Draft',
      period: defaultPeriod(),
      assessmentDate: util.todayISO(),
      targetLevel: AIMA.defaultTargetLevel,
      scopeNotes: '',
      generalNotes: '',
      domainNotes: {},
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function defaultPeriod() {
    var now = new Date();
    return now.getFullYear() + (now.getMonth() < 6 ? ' H1' : ' H2');
  }

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
    }, 3200);
  }

  /* ------------------------------------------------------------------ *
   * Static UI construction
   * ------------------------------------------------------------------ */

  function fillSelect(select, values, placeholder) {
    var html = placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '';
    values.forEach(function (v) {
      var value = typeof v === 'string' ? v : v.value;
      var label = typeof v === 'string' ? v : v.label;
      html += '<option value="' + esc(value) + '">' + esc(label) + '</option>';
    });
    select.innerHTML = html;
  }

  function buildStaticUI() {
    $('fwVersion').textContent = AIMA.meta.frameworkVersion;
    $('schemaVersionLabel').textContent = AIMA.meta.schemaVersion;
    $('reportOrg').textContent = AIMA.meta.owner;

    var entityOptions = AIMA.entities.map(function (e) {
      return { value: e.code, label: e.code + ' — ' + e.name };
    });
    entityOptions.push({ value: CUSTOM_ENTITY, label: 'Other / not listed…' });
    fillSelect($('entitySelect'), entityOptions, 'Select an entity…');
    fillSelect($('entityTypeSelect'), AIMA.entityTypes, 'Not specified');
    fillSelect($('regionSelect'), AIMA.regions, 'Not specified');
    fillSelect($('sizeSelect'), AIMA.entitySizes, 'Not specified');

    fillSelect($('targetSelect'), AIMA.levels.filter(function (l) { return l.level >= 3; }).map(function (l) {
      return { value: String(l.level), label: 'Level ' + l.level + ' — ' + l.name };
    }));

    $('scaleLegend').innerHTML = AIMA.scale.map(function (s) {
      return '<li><span class="swatch" style="background:' + scoreSwatch(s.value) + '"></span>' +
        '<span><strong>' + s.value + ' ' + esc(s.label) + '</strong> — ' + esc(s.description) + '</span></li>';
    }).join('');

    $('domainNav').innerHTML = AIMA.domains.map(function (d) {
      return '<li><button type="button" data-nav="' + d.id + '" title="' + esc(d.id + ' — ' + d.name) + '">' +
        '<span class="dot" data-dot="' + d.id + '"></span>' +
        '<span class="nav-text">' + esc(d.name) + '</span>' +
        '<span class="nav-count" data-navcount="' + d.id + '">0/' + d.questions.length + '</span>' +
        '</button></li>';
    }).join('');

    $('questionContainer').innerHTML = AIMA.domains.map(renderDomainBlock).join('');
    $('storageNote').textContent = util.store.available
      ? 'Drafts are auto-saved in this browser only.'
      : 'Browser storage unavailable — export JSON before closing this page.';
  }

  function scoreSwatch(value) {
    return charts.colorForScore(value);
  }

  function renderDomainBlock(domain) {
    var html = '<section class="domain-block" id="domain-' + domain.id + '">';
    html += '<div class="domain-header">' +
      '<span class="code">' + esc(domain.id) + ' · ' + domain.weight + '%</span>' +
      '<div style="flex:1 1 260px;min-width:0"><h3>' + esc(domain.name) + '</h3><p>' + esc(domain.description) + '</p></div>' +
      '<div class="meta"><strong data-domainscore="' + domain.id + '">—</strong>' +
      '<span data-domainlevel="' + domain.id + '">not scored</span></div>' +
      '</div>';

    domain.questions.forEach(function (q) {
      var critical = q.weight > 1;
      html += '<div class="question' + (critical ? ' critical' : '') + '" id="q-' + q.id + '" data-qid="' + q.id + '">';
      html += '<div class="question-top">';
      html += '<span class="qid">' + esc(q.id) + '</span>';
      html += '<div class="qtext">' + esc(q.text) +
        (critical ? ' <span class="tag-critical">core control</span>' : '') +
        (q.help ? '<div class="qhelp">' + esc(q.help) + '</div>' : '') +
        '</div>';
      html += '</div>';

      html += '<div class="scale" role="radiogroup" aria-label="' + esc(q.id) + ' maturity score">';
      AIMA.scale.forEach(function (s) {
        html += '<label title="' + esc(s.value + ' — ' + s.label + ': ' + s.description) + '" data-opt="' + q.id + '|' + s.value + '">' +
          '<input type="radio" name="score-' + q.id + '" value="' + s.value + '" data-qid="' + q.id + '" />' +
          '<span class="num">' + s.value + '</span><span>' + esc(s.label) + '</span></label>';
      });
      html += '<label class="na" title="Not applicable to this entity" data-opt="' + q.id + '|na">' +
        '<input type="radio" name="score-' + q.id + '" value="na" data-qid="' + q.id + '" />' +
        '<span class="num">N/A</span><span>skip</span></label>';
      html += '</div>';

      html += '<div class="question-actions">' +
        '<button type="button" class="note-toggle" data-notetoggle="' + q.id + '">+ Add evidence note</button>' +
        '</div>';
      html += '<div class="note-box" hidden data-notebox="' + q.id + '">' +
        '<textarea data-note="' + q.id + '" placeholder="Evidence, system names, owner, planned action…"></textarea></div>';
      html += '</div>';
    });

    html += '<div class="card" style="margin-top:10px"><div class="field mb-0">' +
      '<label for="dnote-' + domain.id + '">Domain observations — ' + esc(domain.name) + '</label>' +
      '<textarea id="dnote-' + domain.id + '" data-domainnote="' + domain.id + '" ' +
      'placeholder="Context, dependencies or planned initiatives for this domain…"></textarea>' +
      '</div></div>';

    return html + '</section>';
  }

  /* ------------------------------------------------------------------ *
   * State <-> form binding
   * ------------------------------------------------------------------ */

  function bindEvents() {
    document.querySelectorAll('.nav-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () { showView(btn.dataset.view); });
    });

    $('entitySelect').addEventListener('change', onEntityChange);
    $('entityNameInput').addEventListener('input', function () {
      state.entity.name = this.value.trim();
      queueSave();
    });

    [['entityTypeSelect', 'type'], ['regionSelect', 'region'], ['sizeSelect', 'size']].forEach(function (pair) {
      $(pair[0]).addEventListener('change', function () {
        state.entity[pair[1]] = this.value;
        queueSave();
      });
    });

    $('periodInput').addEventListener('input', function () { state.period = this.value; queueSave(); });
    $('dateInput').addEventListener('change', function () { state.assessmentDate = this.value; queueSave(); });
    $('targetSelect').addEventListener('change', function () {
      state.targetLevel = Number(this.value);
      queueSave();
      renderAll();
    });
    $('respondentName').addEventListener('input', function () { state.respondent.name = this.value; queueSave(); });
    $('respondentRole').addEventListener('input', function () { state.respondent.role = this.value; queueSave(); });
    $('respondentEmail').addEventListener('input', function () { state.respondent.email = this.value; queueSave(); });
    $('reviewerInput').addEventListener('input', function () { state.reviewedBy = this.value; queueSave(); });
    $('statusSelect').addEventListener('change', function () {
      state.status = this.value;
      $('statusPill').textContent = this.value;
      queueSave();
    });
    $('scopeNotes').addEventListener('input', function () { state.scopeNotes = this.value; queueSave(); });
    $('generalNotes').addEventListener('input', function () { state.generalNotes = this.value; queueSave(); });

    var container = $('questionContainer');
    container.addEventListener('change', function (event) {
      var input = event.target;
      if (input.type !== 'radio' || !input.dataset.qid) return;
      setAnswer(input.dataset.qid, input.value === 'na' ? AIMA.NOT_APPLICABLE : Number(input.value));
    });
    container.addEventListener('input', function (event) {
      var el = event.target;
      if (el.dataset.note) {
        var qid = el.dataset.note;
        state.answers[qid] = state.answers[qid] || { value: '' };
        state.answers[qid].note = el.value;
        queueSave();
      } else if (el.dataset.domainnote) {
        state.domainNotes[el.dataset.domainnote] = el.value;
        queueSave();
      }
    });
    container.addEventListener('click', function (event) {
      var toggle = event.target.closest('[data-notetoggle]');
      if (toggle) {
        var box = container.querySelector('[data-notebox="' + toggle.dataset.notetoggle + '"]');
        var willShow = box.hasAttribute('hidden');
        if (willShow) { box.removeAttribute('hidden'); box.querySelector('textarea').focus(); }
        else { box.setAttribute('hidden', ''); }
        toggle.textContent = willShow ? '− Hide note' : '+ Add evidence note';
      }
    });

    $('domainNav').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-nav]');
      if (!btn) return;
      showView('assess');
      var target = $('domain-' + btn.dataset.nav);
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 76, behavior: 'smooth' });
    });

    $('btnGoResults').addEventListener('click', function () { showView('results'); });
    $('btnFooterResults').addEventListener('click', function () { showView('results'); });
    $('btnGoData').addEventListener('click', function () { showView('data'); });
    $('btnSaveNow').addEventListener('click', function () { saveDraft(); toast('Draft saved in this browser.', 'ok'); });

    ['btnPrint', 'btnPrintTop', 'btnPrintData'].forEach(function (id) {
      $(id).addEventListener('click', exportPDF);
    });
    ['btnExportJSON', 'btnExportJSONResults', 'btnFooterExport'].forEach(function (id) {
      $(id).addEventListener('click', exportJSON);
    });
    $('btnExportCSV').addEventListener('click', exportCSV);
    $('btnCopyJSON').addEventListener('click', copyJSON);
    $('btnReset').addEventListener('click', resetAssessment);

    var drop = $('importDrop');
    var fileInput = $('importFile');
    drop.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length) importFiles(this.files);
      this.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
    });
  }

  function onEntityChange() {
    var code = $('entitySelect').value;
    if (code === CUSTOM_ENTITY) {
      $('field-entityName').removeAttribute('hidden');
      state.entity.code = 'CUSTOM';
      state.entity.name = $('entityNameInput').value.trim();
    } else {
      $('field-entityName').setAttribute('hidden', '');
      var entity = AIMA.getEntity(code);
      if (entity) {
        state.entity = { code: entity.code, name: entity.name, type: entity.type, region: entity.region, size: entity.size };
        $('entityTypeSelect').value = entity.type;
        $('regionSelect').value = entity.region;
        $('sizeSelect').value = entity.size;
      } else {
        state.entity = { code: '', name: '', type: '', region: '', size: '' };
      }
    }
    $('field-entity').classList.remove('invalid');
    queueSave();
    renderAll();
  }

  function setAnswer(qid, value) {
    state.answers[qid] = state.answers[qid] || {};
    state.answers[qid].value = value;
    queueSave();
    renderAll();
  }

  function writeStateToForm() {
    $('entitySelect').value = state.entity.code === 'CUSTOM' ? CUSTOM_ENTITY : (state.entity.code || '');
    if (state.entity.code === 'CUSTOM') {
      $('field-entityName').removeAttribute('hidden');
      $('entityNameInput').value = state.entity.name || '';
    } else {
      $('field-entityName').setAttribute('hidden', '');
    }
    $('entityTypeSelect').value = state.entity.type || '';
    $('regionSelect').value = state.entity.region || '';
    $('sizeSelect').value = state.entity.size || '';
    $('periodInput').value = state.period || '';
    $('dateInput').value = state.assessmentDate || '';
    $('targetSelect').value = String(state.targetLevel || AIMA.defaultTargetLevel);
    $('respondentName').value = state.respondent.name || '';
    $('respondentRole').value = state.respondent.role || '';
    $('respondentEmail').value = state.respondent.email || '';
    $('reviewerInput').value = state.reviewedBy || '';
    $('statusSelect').value = state.status || 'Draft';
    $('statusPill').textContent = state.status || 'Draft';
    $('scopeNotes').value = state.scopeNotes || '';
    $('generalNotes').value = state.generalNotes || '';

    AIMA.domains.forEach(function (d) {
      var el = document.querySelector('[data-domainnote="' + d.id + '"]');
      if (el) el.value = state.domainNotes[d.id] || '';
    });

    AIMA.allQuestions.forEach(function (q) {
      var answer = state.answers[q.id];
      var group = document.querySelectorAll('input[name="score-' + q.id + '"]');
      group.forEach(function (input) { input.checked = false; });
      if (answer && answer.value !== undefined && answer.value !== '' && answer.value !== null) {
        var match = document.querySelector('input[name="score-' + q.id + '"][value="' + answer.value + '"]');
        if (match) match.checked = true;
      }
      var noteEl = document.querySelector('[data-note="' + q.id + '"]');
      if (noteEl) {
        noteEl.value = (answer && answer.note) || '';
        var box = document.querySelector('[data-notebox="' + q.id + '"]');
        var toggle = document.querySelector('[data-notetoggle="' + q.id + '"]');
        if (noteEl.value) {
          box.removeAttribute('hidden');
          toggle.textContent = '− Hide note';
        } else {
          box.setAttribute('hidden', '');
          toggle.textContent = '+ Add evidence note';
        }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Persistence
   * ------------------------------------------------------------------ */

  function queueSave() {
    state.updatedAt = new Date().toISOString();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 500);
    renderProgress();
    renderJSONPreview();
  }

  function saveDraft() {
    var ok = util.store.save(STORAGE_KEY, state);
    $('autosaveStatus').textContent = ok
      ? 'Draft saved ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : 'Not saved — export JSON to keep your answers';
  }

  function loadDraft() {
    var saved = util.store.load(STORAGE_KEY, null);
    if (saved && saved.answers) {
      state = Object.assign(newAssessment(), saved);
      state.entity = Object.assign({ code: '', name: '', type: '', region: '', size: '' }, saved.entity || {});
      state.respondent = Object.assign({ name: '', role: '', email: '' }, saved.respondent || {});
      state.answers = saved.answers || {};
      state.domainNotes = saved.domainNotes || {};
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */

  function showView(view) {
    ['assess', 'results', 'data'].forEach(function (name) {
      var el = $('view-' + name);
      if (name === view) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
      var tab = $('tab-' + name);
      if (tab) tab.setAttribute('aria-selected', name === view ? 'true' : 'false');
    });
    if (view === 'results') renderResults();
    if (view === 'data') renderJSONPreview();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderAll() {
    renderProgress();
    renderDomainHeaders();
    if (!$('view-results').hasAttribute('hidden')) renderResults();
    renderJSONPreview();
  }

  function renderProgress() {
    var results = scoring.computeResults(state);
    var pct = results.completeness.percent;

    $('progressPercent').textContent = Math.round(pct) + '%';
    $('progressCount').textContent = results.completeness.answered + ' of ' + results.completeness.total + ' questions answered';
    $('ringProgress').setAttribute('stroke-dasharray',
      (RING_CIRCUMFERENCE * pct / 100).toFixed(1) + ' ' + RING_CIRCUMFERENCE.toFixed(1));

    if (results.overall.score === null) {
      $('liveScoreNote').textContent = 'Current weighted score will appear once you answer a question.';
    } else {
      $('liveScoreNote').innerHTML = 'Current weighted score <strong>' + results.overall.score.toFixed(2) +
        ' / 5</strong> — <span style="color:' + results.overall.color + ';font-weight:700">Level ' +
        results.overall.level + ' ' + esc(results.overall.levelName) + '</span>';
    }

    results.domains.forEach(function (d) {
      var dot = document.querySelector('[data-dot="' + d.domainId + '"]');
      var count = document.querySelector('[data-navcount="' + d.domainId + '"]');
      if (dot) dot.className = 'dot' + (d.complete ? ' done' : (d.answered > 0 ? ' partial' : ''));
      if (count) count.textContent = d.answered + '/' + d.questionsTotal;
    });

    var entityLabel = state.entity.name || 'entity not selected';
    $('footerStatus').textContent = entityLabel + ' · ' + results.completeness.answered + '/' +
      results.completeness.total + ' answered · ' +
      (results.overall.score === null ? 'no score yet' : results.overall.score.toFixed(2) + '/5 (Level ' + results.overall.level + ')');

    AIMA.allQuestions.forEach(function (q) {
      var el = $('q-' + q.id);
      if (!el) return;
      var answer = state.answers[q.id];
      var answered = !!answer && answer.value !== undefined && answer.value !== '' && answer.value !== null;
      el.classList.toggle('answered', answered);
      el.querySelectorAll('.scale label').forEach(function (label) {
        var input = label.querySelector('input');
        label.classList.toggle('selected', !!input && input.checked);
      });
    });
  }

  function renderDomainHeaders() {
    var answers = state.answers;
    AIMA.domains.forEach(function (domain) {
      var result = scoring.scoreDomain(domain, answers);
      var scoreEl = document.querySelector('[data-domainscore="' + domain.id + '"]');
      var levelEl = document.querySelector('[data-domainlevel="' + domain.id + '"]');
      if (scoreEl) {
        scoreEl.textContent = result.score === null ? '—' : result.score.toFixed(2);
        scoreEl.style.color = result.color;
      }
      if (levelEl) {
        levelEl.textContent = result.score === null
          ? 'not scored'
          : 'Level ' + result.level + ' · ' + result.levelName;
      }
    });
  }

  function renderResults() {
    var results = scoring.computeResults(state);
    var target = results.targetLevel;

    $('reportSub').textContent = (state.entity.name || 'Entity not specified') +
      (state.entity.type ? ' · ' + state.entity.type : '');
    $('reportMeta').textContent = [
      'Cycle: ' + (state.period || '—'),
      'Assessment date: ' + (state.assessmentDate || '—'),
      'Respondent: ' + (state.respondent.name || '—') + (state.respondent.role ? ' (' + state.respondent.role + ')' : ''),
      'Status: ' + (state.status || 'Draft'),
      'Framework: ' + AIMA.meta.frameworkVersion
    ].join('  ·  ');

    var banner = $('resultsIncompleteBanner');
    if (results.completeness.answered < results.completeness.total) {
      banner.removeAttribute('hidden');
      $('resultsIncompleteText').innerHTML = '<strong>Partial assessment.</strong> ' +
        (results.completeness.total - results.completeness.answered) + ' of ' + results.completeness.total +
        ' questions are still unanswered, so scores cover only what has been completed.';
    } else {
      banner.setAttribute('hidden', '');
    }

    $('summaryMeta').innerHTML = [
      '<strong>' + esc(state.entity.code || '—') + ' · ' + esc(state.entity.name || 'Entity not specified') + '</strong>',
      esc(state.entity.type || 'type not set'),
      esc(state.entity.region || 'region not set'),
      'cycle ' + esc(state.period || '—'),
      'assessed ' + esc(state.assessmentDate || '—'),
      'respondent ' + esc(state.respondent.name || '—')
    ].join(' &nbsp;·&nbsp; ');

    $('overallGauge').innerHTML = charts.gauge({
      value: results.overall.score,
      color: results.overall.color,
      label: results.overall.level ? 'Level ' + results.overall.level + ' · ' + results.overall.levelName : 'Not scored'
    });

    $('overallHeadline').innerHTML = results.overall.score === null
      ? '<p class="muted">Answer at least one question to generate the maturity profile.</p>'
      : '<h3 style="color:' + results.overall.color + '">Level ' + results.overall.level + ' — ' +
        esc(results.overall.levelName) + '</h3><p class="card-note">' + esc(results.overall.levelDescription) + '</p>';

    var domainsAtTarget = results.domains.filter(function (d) { return d.score !== null && d.score >= target; }).length;
    var domainsScored = results.domains.filter(function (d) { return d.score !== null; }).length;

    $('summaryKpis').innerHTML = [
      kpi('Maturity index', (results.overall.percent === null ? '—' : results.overall.percent + '%'), 'weighted 0–100 scale', results.overall.color),
      kpi('Gap to target', (results.overall.gapToTarget === null ? '—' : results.overall.gapToTarget.toFixed(2)), 'levels below target ' + target, results.overall.gapToTarget > 0 ? '#ea580c' : '#0d9488'),
      kpi('Domains at target', domainsAtTarget + ' / ' + domainsScored, 'of ' + AIMA.domains.length + ' domains', '#1d4ed8'),
      kpi('Priority 1 actions', String(results.priorityCounts.p1), results.priorityCounts.p2 + ' at P2 · ' + results.priorityCounts.p3 + ' at P3', '#dc2626'),
      kpi('Completion', results.completeness.percent + '%', results.completeness.notApplicable + ' marked N/A', '#0f172a'),
      kpi('Evidence notes', String(results.completeness.withEvidenceNotes), 'questions with supporting notes', '#64748b')
    ].join('');

    $('radarChart').innerHTML = charts.radar({
      axes: AIMA.domains.map(function (d) { return { label: d.name, short: d.id }; }),
      series: [
        {
          name: 'Entity score',
          color: results.overall.color || '#0d9488',
          values: results.domains.map(function (d) { return d.score === null ? 0 : d.score; })
        },
        {
          name: 'Target level ' + target,
          color: '#0f172a',
          dashed: true,
          values: AIMA.domains.map(function () { return target; })
        }
      ]
    });

    $('domainBars').innerHTML = charts.bars({
      items: results.domains.map(function (d) {
        return { label: d.name, sublabel: 'w ' + d.weight + '%', value: d.score, color: d.color };
      }),
      max: 5,
      target: target
    });

    $('levelLegend').innerHTML = AIMA.levels.map(function (l) {
      return '<li><span class="swatch" style="background:' + l.color + '"></span>L' + l.level + ' ' + esc(l.name) + '</li>';
    }).join('');

    $('domainTable').querySelector('tbody').innerHTML = results.domains.map(function (d) {
      var gap = d.score === null ? null : Math.max(0, target - d.score);
      return '<tr>' +
        '<td><strong>' + esc(d.domainId) + '</strong> — ' + esc(d.name) + '</td>' +
        '<td class="num">' + d.weight + '%</td>' +
        '<td class="num">' + (d.score === null ? '—' : '<span class="score-chip" style="background:' + d.color + '">' + d.score.toFixed(2) + '</span>') + '</td>' +
        '<td class="num">' + (d.percent === null ? '—' : d.percent + '%') + '</td>' +
        '<td>' + (d.level === null ? '<span class="muted">not scored</span>' : 'L' + d.level + ' ' + esc(d.levelName)) + '</td>' +
        '<td class="num">' + (gap === null ? '—' : (gap === 0 ? '<span style="color:#0d9488;font-weight:700">met</span>' : gap.toFixed(2))) + '</td>' +
        '<td class="num">' + d.answered + '/' + d.questionsTotal + (d.questionsNotApplicable ? ' <span class="muted">(' + d.questionsNotApplicable + ' N/A)</span>' : '') + '</td>' +
        '</tr>';
    }).join('');

    renderActionPlan(results);

    $('strengthsList').innerHTML = results.strengths.length
      ? '<div class="table-wrap"><table class="data"><thead><tr><th>Control</th><th>Domain</th><th class="num">Score</th></tr></thead><tbody>' +
        results.strengths.map(function (s) {
          return '<tr><td><strong>' + esc(s.questionId) + '</strong> ' + esc(s.question) + '</td><td>' +
            esc(s.domainName) + '</td><td class="num"><span class="score-chip" style="background:' +
            charts.colorForScore(s.score) + '">' + s.score.toFixed(0) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<p class="muted">No control has yet reached level 4. Focus on the priority plan above.</p>';

    $('signoffRespondent').textContent = (state.respondent.name || '—') +
      (state.respondent.role ? ' · ' + state.respondent.role : '');
    $('signoffReviewer').textContent = state.reviewedBy || '—';

    renderAppendix();
  }

  function kpi(label, value, sub, color) {
    return '<div class="kpi" style="border-top-color:' + color + '">' +
      '<div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + '</div>' +
      '<div class="kpi-sub">' + esc(sub) + '</div></div>';
  }

  function renderActionPlan(results) {
    var container = $('actionPlan');
    if (!results.actions.length) {
      container.innerHTML = '<p class="muted">No gaps against the target level for the questions answered so far.</p>';
      $('actionSummary').textContent = '';
      return;
    }
    $('actionSummary').textContent = results.actions.length + ' actions · P1 ' + results.priorityCounts.p1 +
      ' · P2 ' + results.priorityCounts.p2 + ' · P3 ' + results.priorityCounts.p3;

    var groups = [
      { priority: 1, title: 'Priority 1 — highest weighted risk reduction' },
      { priority: 2, title: 'Priority 2 — significant gaps' },
      { priority: 3, title: 'Priority 3 — refinement to reach target' }
    ];

    container.innerHTML = groups.map(function (group) {
      var items = results.actions.filter(function (a) { return a.priority === group.priority; });
      if (!items.length) return '';
      return '<h3 style="margin-top:14px">' + esc(group.title) + ' <span class="muted" style="font-weight:400">(' +
        items.length + ')</span></h3><ul class="action-list">' + items.map(function (a) {
        return '<li class="p' + a.priority + '">' +
          '<div class="action-head">' +
          '<span class="pill pill-p' + a.priority + '">P' + a.priority + '</span>' +
          '<span class="pill">' + esc(a.domainId) + '</span>' +
          '<span class="pill">' + esc(a.questionId) + '</span>' +
          '<span class="muted" style="font-size:.78rem">score ' + a.current + ' → target ' + a.target + '</span>' +
          '</div>' +
          '<div class="action-text">' + esc(a.action) + '</div>' +
          '<div class="action-meta">Assessed statement: ' + esc(a.question) +
          (a.note ? '<br /><em>Respondent note: ' + esc(a.note) + '</em>' : '') + '</div>' +
          '</li>';
      }).join('') + '</ul>';
    }).join('');
  }

  function renderAppendix() {
    var rows = '';
    AIMA.domains.forEach(function (domain) {
      var d = scoring.scoreDomain(domain, state.answers);
      rows += '<tr class="domain-row"><td colspan="4">' + esc(domain.id) + ' — ' + esc(domain.name) +
        ' · weight ' + domain.weight + '% · score ' + (d.score === null ? 'not scored' : d.score.toFixed(2) + ' (L' + d.level + ')') + '</td></tr>';
      domain.questions.forEach(function (q) {
        var answer = state.answers[q.id] || {};
        var value = answer.value;
        var display = value === AIMA.NOT_APPLICABLE ? 'N/A'
          : (value === undefined || value === '' || value === null ? 'not answered' : value);
        rows += '<tr><td class="nowrap">' + esc(q.id) + '</td><td>' + esc(q.text) + '</td>' +
          '<td class="nowrap">' + esc(display) + '</td><td>' + esc(answer.note || '') + '</td></tr>';
      });
      if (state.domainNotes[domain.id]) {
        rows += '<tr><td class="nowrap">Notes</td><td colspan="3"><em>' + esc(state.domainNotes[domain.id]) + '</em></td></tr>';
      }
    });

    var extra = '';
    if (state.scopeNotes) extra += '<p><strong>Scope, exclusions &amp; assumptions:</strong> ' + esc(state.scopeNotes) + '</p>';
    if (state.generalNotes) extra += '<p><strong>Respondent commentary:</strong> ' + esc(state.generalNotes) + '</p>';
    if (state.reviewedBy) extra += '<p><strong>Reviewed / validated by:</strong> ' + esc(state.reviewedBy) + '</p>';

    $('answerAppendix').innerHTML = extra +
      '<table class="answer-appendix"><thead><tr><th>ID</th><th>Statement</th><th>Score</th><th>Evidence note</th></tr></thead><tbody>' +
      rows + '</tbody></table>';
  }

  function renderJSONPreview() {
    var preview = $('jsonPreview');
    if (!preview) return;
    preview.textContent = JSON.stringify(buildExport(), null, 2);

    var problems = validate();
    var box = $('exportValidation');
    if (!box) return;
    if (!problems.length) {
      box.className = 'callout mt-16';
      box.innerHTML = '<strong>Ready to export.</strong> All required details are present and every question has been answered.';
    } else {
      box.className = 'callout warn mt-16';
      box.innerHTML = '<strong>Before you submit:</strong><ul style="margin:6px 0 0 18px">' +
        problems.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
    }
  }

  function validate() {
    var problems = [];
    if (!state.entity.name) problems.push('Select the entity being assessed.');
    if (!state.respondent.name) problems.push('Enter the respondent name.');
    var results = scoring.computeResults(state);
    var missing = results.completeness.total - results.completeness.answered;
    if (missing > 0) problems.push(missing + ' question' + (missing === 1 ? '' : 's') + ' not yet answered.');
    return problems;
  }

  /* ------------------------------------------------------------------ *
   * Export / import
   * ------------------------------------------------------------------ */

  function buildExport() {
    var results = scoring.computeResults(state);
    return {
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      frameworkTitle: AIMA.meta.title,
      exportedAt: new Date().toISOString(),
      id: state.id,
      entity: state.entity,
      respondent: state.respondent,
      reviewedBy: state.reviewedBy,
      status: state.status,
      period: state.period,
      assessmentDate: state.assessmentDate,
      targetLevel: state.targetLevel,
      scopeNotes: state.scopeNotes,
      generalNotes: state.generalNotes,
      domainNotes: state.domainNotes,
      answers: state.answers,
      results: results,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt
    };
  }

  function exportFileName(extension) {
    return 'ai-maturity_' + util.slug((state.entity.code || 'entity') + '-' + (state.entity.name || 'unnamed')) +
      '_' + util.slug(state.period || util.todayISO()) + '.' + extension;
  }

  function exportJSON() {
    var problems = validate();
    saveDraft();
    util.downloadJSON(exportFileName('json'), buildExport());
    toast(problems.length ? 'JSON exported with ' + problems.length + ' open item(s).' : 'JSON exported.', problems.length ? '' : 'ok');
  }

  function exportCSV() {
    var rows = [];
    AIMA.allQuestions.forEach(function (q) {
      var answer = state.answers[q.id] || {};
      rows.push({
        entityCode: state.entity.code,
        entityName: state.entity.name,
        period: state.period,
        domainId: q.domainId,
        domainName: q.domainName,
        domainWeight: q.domainWeight,
        questionId: q.id,
        questionWeight: q.weight,
        question: q.text,
        score: answer.value === undefined || answer.value === '' ? '' : answer.value,
        note: answer.note || ''
      });
    });
    var columns = [
      { label: 'Entity code', value: 'entityCode' },
      { label: 'Entity name', value: 'entityName' },
      { label: 'Cycle', value: 'period' },
      { label: 'Domain ID', value: 'domainId' },
      { label: 'Domain', value: 'domainName' },
      { label: 'Domain weight %', value: 'domainWeight' },
      { label: 'Question ID', value: 'questionId' },
      { label: 'Question weight', value: 'questionWeight' },
      { label: 'Statement', value: 'question' },
      { label: 'Score', value: 'score' },
      { label: 'Evidence note', value: 'note' }
    ];
    util.download(exportFileName('csv'), util.toCSV(columns, rows), 'text/csv');
    toast('CSV exported.', 'ok');
  }

  function copyJSON() {
    var text = JSON.stringify(buildExport(), null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('JSON copied to clipboard.', 'ok');
      }, function () {
        toast('Clipboard blocked by the browser — use Download JSON.', 'err');
      });
    } else {
      toast('Clipboard unavailable — use Download JSON.', 'err');
    }
  }

  function exportPDF() {
    showView('results');
    // Let the results view paint before handing over to the print dialog.
    setTimeout(function () { window.print(); }, 120);
  }

  function importFiles(files) {
    util.readJSONFiles(files).then(function (result) {
      if (result.errors.length) {
        toast(result.errors[0].file + ': ' + result.errors[0].error, 'err');
        return;
      }
      var record = result.records[0] && result.records[0].data;
      if (!record || typeof record !== 'object' || !record.answers) {
        toast('That file does not look like an assessment export.', 'err');
        return;
      }
      state = Object.assign(newAssessment(), {
        id: record.id || util.uid('assess'),
        entity: Object.assign({ code: '', name: '', type: '', region: '', size: '' }, record.entity || {}),
        respondent: Object.assign({ name: '', role: '', email: '' }, record.respondent || {}),
        reviewedBy: record.reviewedBy || '',
        status: record.status || 'Draft',
        period: record.period || defaultPeriod(),
        assessmentDate: record.assessmentDate || util.todayISO(),
        targetLevel: record.targetLevel || AIMA.defaultTargetLevel,
        scopeNotes: record.scopeNotes || '',
        generalNotes: record.generalNotes || '',
        domainNotes: record.domainNotes || {},
        answers: record.answers || {},
        createdAt: record.createdAt || new Date().toISOString()
      });
      writeStateToForm();
      saveDraft();
      renderAll();
      showView('assess');
      toast('Loaded assessment for ' + (state.entity.name || 'unnamed entity') + '.', 'ok');
    });
  }

  function resetAssessment() {
    if (!window.confirm('Clear all answers and start a new assessment? Export first if you want to keep this one.')) return;
    state = newAssessment();
    util.store.remove(STORAGE_KEY);
    writeStateToForm();
    renderAll();
    showView('assess');
    toast('Form cleared.', 'ok');
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function init() {
    buildStaticUI();
    bindEvents();
    var restored = loadDraft();
    writeStateToForm();
    renderAll();
    if (restored) toast('Restored your saved draft from this browser.', 'ok');
    $('autosaveStatus').textContent = restored ? 'Draft restored' : '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.AIMA);
