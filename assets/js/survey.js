/*
 * Questionnaire page (the version sent to reporting organisations)
 * ---------------------------------------------------------------
 * Renders the question bank as a plain stepped form. It deliberately shows no
 * scores, weights, maturity levels or benchmarks: respondents answer, save a
 * PDF and download a data file. All rating happens later in the console.
 */
(function (AIMA) {
  'use strict';

  var util = AIMA.util;
  var scoring = AIMA.scoring;
  var esc = util.escapeHTML;
  var NA = AIMA.NOT_APPLICABLE;
  var NONE = scoring.NONE;

  var STORAGE_KEY = 'aima.return.draft.v2';
  var CUSTOM_ENTITY = '__other__';

  var state = newReturn();
  var steps = [];
  var currentStep = 0;
  var saveTimer = null;

  function newReturn() {
    return {
      id: util.uid('return'),
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      entity: { code: '', name: '', type: '', region: '', size: '' },
      contact: { contactName: '', contactRole: '', contactEmail: '', contactPhone: '', approverName: '' },
      submittedDate: util.todayISO(),
      declarationConfirmed: false,
      answers: {},
      sectionNotes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
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
    }, 3600);
  }

  /* ------------------------------------------------------------------ *
   * Building the form
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

  function buildIntro() {
    $('introQuestionCount').textContent = AIMA.questionCount;
    $('introMinutes').textContent = AIMA.meta.estimatedMinutes;
    $('introFrameworks').innerHTML = AIMA.frameworks.map(function (f) {
      return '<strong>' + esc(f.short) + '</strong> (' + esc(f.publisher) + ', ' + f.year + ')';
    }).join(' &nbsp;·&nbsp; ');
  }

  function buildDetailsStep() {
    var entityOptions = AIMA.entities.map(function (e) {
      return { value: e.code, label: e.code + ' — ' + e.name };
    });
    entityOptions.push({ value: CUSTOM_ENTITY, label: 'Other — not in this list' });
    fillSelect($('entitySelect'), entityOptions, 'Choose your organisation…');
    fillSelect($('entityTypeSelect'), AIMA.entityTypes, 'Not sure / not listed');
    fillSelect($('regionSelect'), AIMA.regions, 'Not sure / not listed');
    fillSelect($('sizeSelect'), AIMA.entitySizes, 'Prefer not to say');

    $('contactFields').innerHTML = AIMA.respondentFields.map(function (field) {
      return '<div class="field" id="field-' + field.id + '">' +
        '<label for="' + field.id + '">' + esc(field.label) +
        (field.required ? ' <span class="req">*</span>' : '') + '</label>' +
        '<input type="' + (field.type === 'email' ? 'email' : 'text') + '" id="' + field.id + '" />' +
        '</div>';
    }).join('');
  }

  function questionHTML(question) {
    var html = '<div class="q" id="q-' + question.id + '" data-qid="' + question.id + '">';
    html += '<div class="q-head">';
    html += '<div class="q-number">' + question.number + '</div>';
    html += '<div class="q-body"><label class="q-text" for="input-' + question.id + '">' + esc(question.text) + '</label>';
    if (question.hint) html += '<p class="q-hint">' + esc(question.hint) + '</p>';
    html += '</div></div>';
    html += '<div class="q-input">' + inputHTML(question) + '</div>';
    return html + '</div>';
  }

  function inputHTML(question) {
    var options = AIMA.optionsFor(question);

    if (question.type === 'yesno') {
      return '<div class="opt-row" role="radiogroup" aria-label="' + esc(question.text) + '">' +
        options.map(function (option) {
          return '<label class="opt' + (option.value === NA ? ' opt-na' : '') + '" data-opt="' + question.id + '|' + option.value + '">' +
            '<input type="radio" name="' + question.id + '" value="' + esc(option.value) + '" data-qid="' + question.id + '" />' +
            '<span class="tick" aria-hidden="true"></span><span>' + esc(option.label) + '</span></label>';
        }).join('') + '</div>';
    }

    if (question.type === 'choice') {
      return '<select id="input-' + question.id + '" data-qid="' + question.id + '" data-kind="choice">' +
        '<option value="">Choose an answer…</option>' +
        options.map(function (option) {
          return '<option value="' + esc(option.value) + '">' + esc(option.label) + '</option>';
        }).join('') + '</select>';
    }

    if (question.type === 'multi') {
      var html = '<div class="check-list">';
      html += options.filter(function (o) { return o.value !== NA; }).map(function (option) {
        return '<label class="check" data-opt="' + question.id + '|' + option.value + '">' +
          '<input type="checkbox" name="' + question.id + '" value="' + esc(option.value) + '" data-qid="' + question.id + '" data-kind="multi" />' +
          '<span class="box" aria-hidden="true"></span><span>' + esc(option.label) + '</span></label>';
      }).join('');
      html += '<label class="check check-none" data-opt="' + question.id + '|' + NONE + '">' +
        '<input type="checkbox" name="' + question.id + '" value="' + NONE + '" data-qid="' + question.id + '" data-kind="multi" />' +
        '<span class="box" aria-hidden="true"></span><span>' + esc(question.noneLabel || 'None of these') + '</span></label>';
      if (question.allowNA) {
        html += '<label class="check check-none" data-opt="' + question.id + '|' + NA + '">' +
          '<input type="checkbox" name="' + question.id + '" value="' + NA + '" data-qid="' + question.id + '" data-kind="multi" />' +
          '<span class="box" aria-hidden="true"></span><span>Not applicable</span></label>';
      }
      return html + '</div>';
    }

    if (question.type === 'number') {
      return '<div class="number-row">' +
        '<input type="number" min="0" step="1" id="input-' + question.id + '" data-qid="' + question.id + '" data-kind="number" />' +
        (question.unit ? '<span class="unit">' + esc(question.unit) + '</span>' : '') + '</div>';
    }

    return '<textarea id="input-' + question.id + '" data-qid="' + question.id + '" data-kind="text"></textarea>';
  }

  function buildSectionSteps() {
    var container = $('stepContainer');
    var finishStep = container.querySelector('[data-step="finish"]');

    AIMA.sections.forEach(function (section, index) {
      var el = document.createElement('section');
      el.className = 'card step';
      el.setAttribute('data-step', section.id);
      el.setAttribute('hidden', '');

      var html = '<div class="step-heading">' +
        '<span class="step-count">Section ' + (index + 2) + '</span>' +
        '<h2>' + esc(section.title) + '</h2></div>';
      if (section.intro) html += '<p class="step-intro">' + esc(section.intro) + '</p>';

      html += '<div class="questions">' + section.questions.map(function (raw) {
        return questionHTML(AIMA.getQuestion(raw.id));
      }).join('') + '</div>';

      html += '<div class="section-comment"><div class="field mb-0">' +
        '<label for="note-' + section.id + '">Anything else we should know about this section? (optional)</label>' +
        '<textarea id="note-' + section.id + '" data-sectionnote="' + section.id + '" ' +
        'placeholder="Add anything that helps us understand your answers. Please do not include passwords, patient details or system addresses."></textarea>' +
        '</div></div>';

      html += '<div class="step-actions">' +
        '<button type="button" class="btn" data-goto-prev>Back</button>' +
        '<div class="spacer"></div>' +
        '<span class="status muted" data-section-progress="' + section.id + '"></span>' +
        '<button type="button" class="btn btn-primary" data-goto-next>Continue</button>' +
        '</div>';

      el.innerHTML = html;
      container.insertBefore(el, finishStep);
    });
  }

  function buildStepIndex() {
    steps = [];
    document.querySelectorAll('#stepContainer .step').forEach(function (el) {
      var key = el.getAttribute('data-step');
      var section = AIMA.getSection(key);
      steps.push({
        key: key,
        el: el,
        label: key === 'intro' ? 'Before you start'
          : key === 'details' ? 'About your organisation'
            : key === 'finish' ? 'Save and send' : section.title,
        section: section
      });
    });

    $('stepNav').innerHTML = steps.map(function (step, index) {
      return '<li><button type="button" data-step-to="' + index + '">' +
        '<span class="marker" data-marker="' + index + '">' + (index + 1) + '</span>' +
        '<span class="label">' + esc(step.label) + '</span></button></li>';
    }).join('');
  }

  /* ------------------------------------------------------------------ *
   * Step navigation
   * ------------------------------------------------------------------ */

  function showStep(index, options) {
    currentStep = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach(function (step, i) {
      if (i === currentStep) step.el.removeAttribute('hidden');
      else step.el.setAttribute('hidden', '');
    });
    document.querySelectorAll('#stepNav button').forEach(function (btn, i) {
      btn.setAttribute('aria-current', i === currentStep ? 'true' : 'false');
    });
    if (steps[currentStep].key === 'finish') renderFinishStep();
    if (!options || options.scroll !== false) window.scrollTo({ top: 0, behavior: 'auto' });
    refreshProgress();
  }

  function goNext() {
    if (steps[currentStep].key === 'details' && !validateDetails()) return;
    showStep(currentStep + 1);
  }

  function validateDetails() {
    var problems = [];

    var entityField = $('field-entity');
    entityField.classList.remove('invalid');
    removeFieldError(entityField);
    if (!state.entity.name) {
      entityField.classList.add('invalid');
      addFieldError(entityField, 'Please choose your organisation.');
      problems.push('organisation');
    }

    AIMA.respondentFields.forEach(function (field) {
      if (!field.required) return;
      var wrap = $('field-' + field.id);
      wrap.classList.remove('invalid');
      removeFieldError(wrap);
      if (!String(state.contact[field.id] || '').trim()) {
        wrap.classList.add('invalid');
        addFieldError(wrap, 'Please complete this.');
        problems.push(field.id);
      }
    });

    if (problems.length) {
      toast('Please complete the highlighted details before continuing.', 'err');
      var first = document.querySelector('.field.invalid');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  }

  function addFieldError(wrap, message) {
    var span = document.createElement('span');
    span.className = 'field-error';
    span.textContent = message;
    wrap.appendChild(span);
  }

  function removeFieldError(wrap) {
    var existing = wrap.querySelector('.field-error');
    if (existing) existing.parentNode.removeChild(existing);
  }

  /* ------------------------------------------------------------------ *
   * Answers
   * ------------------------------------------------------------------ */

  function setAnswer(questionId, value) {
    state.answers[questionId] = { value: value };
    queueSave();
    paintQuestion(questionId);
    refreshProgress();
  }

  function toggleMulti(questionId, optionValue, checked) {
    var question = AIMA.getQuestion(questionId);
    var current = (state.answers[questionId] && Array.isArray(state.answers[questionId].value))
      ? state.answers[questionId].value.slice() : [];

    var exclusive = optionValue === NONE || optionValue === NA;
    if (checked && exclusive) {
      current = [optionValue];
    } else if (checked) {
      current = current.filter(function (v) { return v !== NONE && v !== NA; });
      if (current.indexOf(optionValue) === -1) current.push(optionValue);
    } else {
      current = current.filter(function (v) { return v !== optionValue; });
    }

    // Keep the stored order matching the order shown on screen.
    var order = (question.options || []).map(function (o) { return o.value; }).concat([NONE, NA]);
    current.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });

    state.answers[questionId] = { value: current };
    queueSave();
    paintQuestion(questionId);
    refreshProgress();
  }

  function paintQuestion(questionId) {
    var question = AIMA.getQuestion(questionId);
    var answer = state.answers[questionId];
    var wrapper = $('q-' + questionId);
    if (!wrapper) return;

    var answered = scoring.isAnswered(question, answer);
    wrapper.classList.toggle('answered', answered);

    if (question.type === 'yesno') {
      wrapper.querySelectorAll('.opt').forEach(function (label) {
        var input = label.querySelector('input');
        var selected = answered && input.value === answer.value;
        input.checked = selected;
        label.classList.toggle('selected', selected);
      });
    } else if (question.type === 'multi') {
      var values = answered && Array.isArray(answer.value) ? answer.value : [];
      wrapper.querySelectorAll('.check').forEach(function (label) {
        var input = label.querySelector('input');
        var selected = values.indexOf(input.value) !== -1;
        input.checked = selected;
        label.classList.toggle('selected', selected);
      });
    } else {
      var input = wrapper.querySelector('[data-qid]');
      if (input) input.value = answered ? answer.value : '';
    }
  }

  function paintAllAnswers() {
    AIMA.allQuestions.forEach(function (question) { paintQuestion(question.id); });
    AIMA.sections.forEach(function (section) {
      var el = document.querySelector('[data-sectionnote="' + section.id + '"]');
      if (el) el.value = state.sectionNotes[section.id] || '';
    });
  }

  function writeDetailsToForm() {
    $('entitySelect').value = state.entity.code === 'OTHER' ? CUSTOM_ENTITY : (state.entity.code || '');
    if (state.entity.code === 'OTHER') {
      $('field-entityName').removeAttribute('hidden');
      $('entityNameInput').value = state.entity.name || '';
    } else {
      $('field-entityName').setAttribute('hidden', '');
    }
    $('entityTypeSelect').value = state.entity.type || '';
    $('regionSelect').value = state.entity.region || '';
    $('sizeSelect').value = state.entity.size || '';
    $('dateInput').value = state.submittedDate || '';
    AIMA.respondentFields.forEach(function (field) {
      var input = $(field.id);
      if (input) input.value = state.contact[field.id] || '';
    });
    $('declarationCheck').checked = !!state.declarationConfirmed;
    $('declarationWrap').classList.toggle('selected', !!state.declarationConfirmed);
  }

  /* ------------------------------------------------------------------ *
   * Progress
   * ------------------------------------------------------------------ */

  function countAnswers() {
    var answered = 0;
    AIMA.allQuestions.forEach(function (question) {
      if (scoring.isAnswered(question, state.answers[question.id])) answered++;
    });
    return answered;
  }

  function sectionProgress(section) {
    var answered = 0;
    section.questions.forEach(function (raw) {
      if (scoring.isAnswered(AIMA.getQuestion(raw.id), state.answers[raw.id])) answered++;
    });
    return { answered: answered, total: section.questions.length };
  }

  function refreshProgress() {
    var answered = countAnswers();
    var total = AIMA.questionCount;
    var percent = Math.round((answered / total) * 100);

    $('progressText').textContent = answered + ' of ' + total + ' questions answered';
    $('progressPercent').textContent = percent + '%';
    $('progressBar').style.width = percent + '%';

    steps.forEach(function (step, index) {
      var marker = document.querySelector('[data-marker="' + index + '"]');
      if (!marker) return;
      marker.classList.remove('done', 'partial');
      if (step.section) {
        var progress = sectionProgress(step.section);
        if (progress.answered === progress.total) marker.classList.add('done');
        else if (progress.answered > 0) marker.classList.add('partial');
        var label = document.querySelector('[data-section-progress="' + step.section.id + '"]');
        if (label) {
          label.textContent = progress.answered === progress.total
            ? 'All questions answered'
            : progress.answered + ' of ' + progress.total + ' answered';
        }
      } else if (step.key === 'details') {
        if (state.entity.name && state.contact.contactName && state.contact.contactEmail) marker.classList.add('done');
        else if (state.entity.name || state.contact.contactName) marker.classList.add('partial');
      }
    });

    $('entityStatus').textContent = (state.entity.name || 'Organisation not chosen') + ' · ' +
      answered + ' of ' + total + ' answered';
  }

  /* ------------------------------------------------------------------ *
   * Finish step and printed output
   * ------------------------------------------------------------------ */

  function unansweredList() {
    return AIMA.allQuestions.filter(function (question) {
      return !scoring.isAnswered(question, state.answers[question.id]);
    });
  }

  function renderFinishStep() {
    var missing = unansweredList();
    var status = $('finishStatus');

    if (!state.entity.name || !state.contact.contactName) {
      status.className = 'callout warn';
      status.innerHTML = '<h4>Your organisation details are incomplete</h4>' +
        '<p class="mb-0">Please go back to <strong>About your organisation</strong> and complete the required fields before saving your return.</p>';
    } else if (missing.length) {
      status.className = 'callout warn';
      status.innerHTML = '<h4>' + missing.length + ' question' + (missing.length === 1 ? '' : 's') + ' still unanswered</h4>' +
        '<p>You can still save and send the return, but please answer what you can first. Missing: ' +
        missing.slice(0, 12).map(function (q) {
          return '<button type="button" class="btn btn-sm" data-jump-question="' + q.id + '" style="margin:2px 3px">Question ' + q.number + '</button>';
        }).join('') +
        (missing.length > 12 ? ' <span class="muted">and ' + (missing.length - 12) + ' more</span>' : '') + '</p>';
    } else {
      status.className = 'callout good';
      status.innerHTML = '<h4>All questions answered — thank you</h4>' +
        '<p class="mb-0">Complete the three steps below to finish your return.</p>';
    }

    var rows = '';
    AIMA.sections.forEach(function (section) {
      rows += '<tr class="section-row"><th>' + esc(section.title) + '</th><td>' +
        sectionProgress(section).answered + ' of ' + section.questions.length + '</td></tr>';
      section.questions.forEach(function (raw) {
        var question = AIMA.getQuestion(raw.id);
        var answered = scoring.isAnswered(question, state.answers[question.id]);
        rows += '<tr><th><span class="qnum">' + question.number + '</span>' + esc(question.text) + '</th>' +
          '<td' + (answered ? '' : ' class="missing"') + '>' +
          esc(answered ? scoring.describeAnswer(question, state.answers[question.id]) : 'Not answered') +
          '</td></tr>';
      });
    });
    $('reviewTable').querySelector('tbody').innerHTML = rows;
  }

  function renderPrintSummary() {
    var brand = AIMA.branding;
    var missing = unansweredList().length;

    $('printSubtitle').textContent = (state.entity.name || 'Organisation not specified') +
      (state.entity.type ? ' · ' + state.entity.type : '');
    $('printMeta').textContent = [
      'Completed by: ' + (state.contact.contactName || '—') + (state.contact.contactRole ? ', ' + state.contact.contactRole : ''),
      'Date: ' + (state.submittedDate || '—'),
      'Questions answered: ' + countAnswers() + ' of ' + AIMA.questionCount
    ].join('  ·  ');

    var html = '';

    html += '<h2>Organisation details</h2><table class="answer-log"><tbody>' +
      row('Organisation', (state.entity.code ? state.entity.code + ' — ' : '') + (state.entity.name || '—')) +
      row('Type', state.entity.type || '—') +
      row('Region', state.entity.region || '—') +
      row('Approximate size', state.entity.size || '—') +
      row('Return cycle', brand.cycle) +
      row('Date completed', state.submittedDate || '—') +
      row('Completed by', (state.contact.contactName || '—') + (state.contact.contactRole ? ' (' + state.contact.contactRole + ')' : '')) +
      row('Contact email', state.contact.contactEmail || '—') +
      row('Contact number', state.contact.contactPhone || '—') +
      row('Approved by', state.contact.approverName || '—') +
      '</tbody></table>';

    AIMA.sections.forEach(function (section, index) {
      html += '<h2' + (index === 0 ? ' style="margin-top:8mm"' : '') + '>' + esc(section.title) + '</h2>';
      html += '<table class="answer-log"><thead><tr><th style="width:8%">No.</th><th style="width:56%">Question</th><th>Answer</th></tr></thead><tbody>';
      section.questions.forEach(function (raw) {
        var question = AIMA.getQuestion(raw.id);
        var answered = scoring.isAnswered(question, state.answers[question.id]);
        html += '<tr><td>' + question.number + '</td><td>' + esc(question.text) + '</td><td>' +
          esc(answered ? scoring.describeAnswer(question, state.answers[question.id]) : 'Not answered') + '</td></tr>';
      });
      if (state.sectionNotes[section.id]) {
        html += '<tr><td></td><td><em>Additional comments</em></td><td>' + esc(state.sectionNotes[section.id]) + '</td></tr>';
      }
      html += '</tbody></table>';
    });

    html += '<h2 style="margin-top:6mm">Declaration</h2>';
    html += '<p style="font-size:9pt">' +
      (state.declarationConfirmed
        ? 'The respondent has confirmed that these answers are accurate to the best of their knowledge and that a senior manager has approved this return.'
        : 'The declaration has not been confirmed in the online form. Please sign below to confirm the answers are accurate.') +
      '</p>';
    html += '<table class="signoff"><tbody>' +
      '<tr><th>Completed by</th><td>' + esc(state.contact.contactName || '') +
      (state.contact.contactRole ? ', ' + esc(state.contact.contactRole) : '') +
      '</td><th>Signature</th><td class="sign-line"></td><th>Date</th><td class="sign-line"></td></tr>' +
      '<tr><th>Approved by</th><td>' + esc(state.contact.approverName || '') +
      '</td><th>Signature</th><td class="sign-line"></td><th>Date</th><td class="sign-line"></td></tr>' +
      '</tbody></table>';

    html += '<div class="print-footnote">' +
      (missing ? '<strong>Note:</strong> ' + missing + ' question' + (missing === 1 ? ' was' : 's were') + ' left unanswered. ' : '') +
      esc(brand.returnInstructions) + ' Return to ' + esc(brand.returnContact) + ' by ' + esc(brand.returnDeadline) + '. ' +
      esc(brand.documentRef) + ' · ' + esc(brand.classification) + '</div>';

    $('printSummary').innerHTML = html;

    function row(label, value) {
      return '<tr><th style="width:32%">' + esc(label) + '</th><td>' + esc(value) + '</td></tr>';
    }
  }

  /* ------------------------------------------------------------------ *
   * Saving, export, import
   * ------------------------------------------------------------------ */

  function queueSave() {
    state.updatedAt = new Date().toISOString();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveDraft();
      // Keep the printable version in step with the answers, so printing from
      // the browser menu produces the same document as the button does.
      renderPrintSummary();
    }, 600);
  }

  function saveDraft(silent) {
    var ok = util.store.save(STORAGE_KEY, state);
    $('savedStatus').textContent = ok
      ? 'Saved ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : 'Not saved in this browser — download the data file to keep your answers';
    if (!silent && !ok) toast('This browser will not store your progress. Please download the data file before closing.', 'err');
    return ok;
  }

  function loadDraft() {
    var saved = util.store.load(STORAGE_KEY, null);
    if (!saved || !saved.answers) return false;
    state = Object.assign(newReturn(), saved);
    state.entity = Object.assign({ code: '', name: '', type: '', region: '', size: '' }, saved.entity || {});
    state.contact = Object.assign({ contactName: '', contactRole: '', contactEmail: '', contactPhone: '', approverName: '' }, saved.contact || {});
    state.answers = saved.answers || {};
    state.sectionNotes = saved.sectionNotes || {};
    return true;
  }

  /** The return file. Deliberately contains answers only — no scores. */
  function buildReturnFile() {
    var brand = AIMA.branding;
    return {
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      returnTitle: AIMA.meta.title,
      programme: brand.programme,
      requestedBy: brand.organisation,
      documentRef: brand.documentRef,
      period: brand.cycle,
      id: state.id,
      entity: state.entity,
      contact: state.contact,
      submittedDate: state.submittedDate,
      declarationConfirmed: !!state.declarationConfirmed,
      answers: state.answers,
      sectionNotes: state.sectionNotes,
      progress: {
        answered: countAnswers(),
        total: AIMA.questionCount,
        percent: scoring.round((countAnswers() / AIMA.questionCount) * 100, 1)
      },
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      exportedAt: new Date().toISOString()
    };
  }

  function exportFileName(extension) {
    return 'ai-assurance-return_' +
      util.slug((state.entity.code || 'organisation') + '-' + (state.entity.name || '')) + '_' +
      util.slug(AIMA.branding.cycle) + '.' + extension;
  }

  function downloadJSON() {
    saveDraft(true);
    util.downloadJSON(exportFileName('json'), buildReturnFile());
    var missing = unansweredList().length;
    toast(missing
      ? 'Data file downloaded. ' + missing + ' question' + (missing === 1 ? '' : 's') + ' still unanswered.'
      : 'Data file downloaded. Please email it with your PDF.', missing ? '' : 'ok');
  }

  function savePDF() {
    renderPrintSummary();
    setTimeout(function () { window.print(); }, 140);
  }

  /** Pick up a return someone else started, from the data file they saved. */
  function resumeFromFile(fileList) {
    util.readJSONFiles(fileList).then(function (result) {
      if (result.errors.length) {
        toast(result.errors[0].file + ': ' + result.errors[0].error, 'err');
        return;
      }
      var file = result.records[0] && result.records[0].data;
      if (!file || typeof file !== 'object' || !file.answers) {
        toast('That file is not a saved return. Look for the .json file downloaded from this questionnaire.', 'err');
        return;
      }
      var major = String(file.schemaVersion || '').split('.')[0];
      if (major && major !== String(AIMA.meta.schemaVersion).split('.')[0]) {
        toast('That file came from an earlier version of this questionnaire, so it cannot be loaded.', 'err');
        return;
      }

      state = Object.assign(newReturn(), {
        id: file.id || util.uid('return'),
        entity: Object.assign({ code: '', name: '', type: '', region: '', size: '' }, file.entity || {}),
        contact: Object.assign({ contactName: '', contactRole: '', contactEmail: '', contactPhone: '', approverName: '' }, file.contact || {}),
        submittedDate: file.submittedDate || util.todayISO(),
        declarationConfirmed: !!file.declarationConfirmed,
        answers: file.answers || {},
        sectionNotes: file.sectionNotes || {},
        createdAt: file.createdAt || new Date().toISOString()
      });

      writeDetailsToForm();
      paintAllAnswers();
      saveDraft(true);
      renderPrintSummary();
      refreshProgress();
      showStep(1);
      toast('Loaded the saved return for ' + (state.entity.name || 'your organisation') + ' — ' +
        countAnswers() + ' of ' + AIMA.questionCount + ' questions already answered.', 'ok');
    });
  }

  function clearAll() {
    if (!window.confirm('Clear all answers and start again? Download your data file first if you want to keep them.')) return;
    state = newReturn();
    util.store.remove(STORAGE_KEY);
    writeDetailsToForm();
    paintAllAnswers();
    refreshProgress();
    showStep(0);
    toast('All answers cleared.', 'ok');
  }

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */

  function bindEvents() {
    var container = $('stepContainer');

    container.addEventListener('click', function (event) {
      if (event.target.closest('[data-goto-next]')) { goNext(); return; }
      if (event.target.closest('[data-goto-prev]')) { showStep(currentStep - 1); return; }
      var jump = event.target.closest('[data-jump-question]');
      if (jump) {
        var question = AIMA.getQuestion(jump.getAttribute('data-jump-question'));
        var stepIndex = steps.findIndex(function (s) { return s.key === question.sectionId; });
        if (stepIndex >= 0) {
          showStep(stepIndex, { scroll: false });
          var el = $('q-' + question.id);
          if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el.style.transition = 'background .4s';
            el.style.background = '#fdf6e3';
            setTimeout(function () { el.style.background = ''; }, 1400);
          }
        }
      }
    });

    container.addEventListener('change', function (event) {
      var input = event.target;
      if (!input.dataset.qid) return;
      if (input.type === 'radio') {
        setAnswer(input.dataset.qid, input.value);
      } else if (input.dataset.kind === 'multi') {
        toggleMulti(input.dataset.qid, input.value, input.checked);
      } else if (input.dataset.kind === 'choice') {
        if (input.value === '') {
          delete state.answers[input.dataset.qid];
          queueSave();
          paintQuestion(input.dataset.qid);
          refreshProgress();
        } else {
          setAnswer(input.dataset.qid, input.value);
        }
      }
    });

    container.addEventListener('input', function (event) {
      var input = event.target;
      if (input.dataset.sectionnote !== undefined) {
        state.sectionNotes[input.dataset.sectionnote] = input.value;
        queueSave();
        return;
      }
      if (!input.dataset.qid) return;
      if (input.dataset.kind === 'number' || input.dataset.kind === 'text') {
        if (input.value === '') delete state.answers[input.dataset.qid];
        else state.answers[input.dataset.qid] = { value: input.dataset.kind === 'number' ? Number(input.value) : input.value };
        queueSave();
        var wrapper = $('q-' + input.dataset.qid);
        if (wrapper) {
          wrapper.classList.toggle('answered',
            scoring.isAnswered(AIMA.getQuestion(input.dataset.qid), state.answers[input.dataset.qid]));
        }
        refreshProgress();
      }
    });

    $('stepNav').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-step-to]');
      if (btn) showStep(Number(btn.getAttribute('data-step-to')));
    });

    $('entitySelect').addEventListener('change', function () {
      var code = this.value;
      if (code === CUSTOM_ENTITY) {
        $('field-entityName').removeAttribute('hidden');
        state.entity = { code: 'OTHER', name: $('entityNameInput').value.trim(), type: state.entity.type, region: state.entity.region, size: state.entity.size };
      } else {
        $('field-entityName').setAttribute('hidden', '');
        var entity = AIMA.getEntity(code);
        state.entity = entity
          ? { code: entity.code, name: entity.name, type: entity.type, region: entity.region, size: entity.size }
          : { code: '', name: '', type: '', region: '', size: '' };
        $('entityTypeSelect').value = state.entity.type || '';
        $('regionSelect').value = state.entity.region || '';
        $('sizeSelect').value = state.entity.size || '';
      }
      $('field-entity').classList.remove('invalid');
      removeFieldError($('field-entity'));
      queueSave();
      refreshProgress();
    });

    $('entityNameInput').addEventListener('input', function () {
      state.entity.name = this.value.trim();
      queueSave();
      refreshProgress();
    });

    [['entityTypeSelect', 'type'], ['regionSelect', 'region'], ['sizeSelect', 'size']].forEach(function (pair) {
      $(pair[0]).addEventListener('change', function () {
        state.entity[pair[1]] = this.value;
        queueSave();
      });
    });

    $('dateInput').addEventListener('change', function () {
      state.submittedDate = this.value;
      queueSave();
    });

    $('contactFields').addEventListener('input', function (event) {
      var input = event.target;
      if (!input.id) return;
      if (state.contact[input.id] === undefined) return;
      state.contact[input.id] = input.value;
      var wrap = $('field-' + input.id);
      if (wrap) { wrap.classList.remove('invalid'); removeFieldError(wrap); }
      queueSave();
      refreshProgress();
    });

    $('declarationCheck').addEventListener('change', function () {
      state.declarationConfirmed = this.checked;
      $('declarationWrap').classList.toggle('selected', this.checked);
      queueSave();
    });

    $('btnSaveProgress').addEventListener('click', function () {
      if (saveDraft()) toast('Progress saved in this browser.', 'ok');
    });
    $('btnSavePDF').addEventListener('click', savePDF);
    $('btnSavePDFTop').addEventListener('click', savePDF);
    $('btnDownloadJSON').addEventListener('click', downloadJSON);
    $('btnDownloadJSONTop').addEventListener('click', downloadJSON);
    $('btnClear').addEventListener('click', clearAll);
    $('btnBackToStart').addEventListener('click', function () { showStep(2); });

    $('btnResume').addEventListener('click', function () { $('resumeFile').click(); });
    $('resumeFile').addEventListener('change', function () {
      if (this.files && this.files.length) resumeFromFile(this.files);
      this.value = '';
    });

    window.addEventListener('beforeprint', renderPrintSummary);
    // Safari does not fire beforeprint; it switches the print media query instead.
    if (window.matchMedia) {
      var printQuery = window.matchMedia('print');
      if (printQuery.addEventListener) {
        printQuery.addEventListener('change', function (event) {
          if (event.matches) renderPrintSummary();
        });
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function init() {
    AIMA.applyBranding({ title: AIMA.meta.title });
    buildIntro();
    buildDetailsStep();
    buildSectionSteps();
    buildStepIndex();
    bindEvents();

    var restored = loadDraft();
    writeDetailsToForm();
    paintAllAnswers();
    renderPrintSummary();

    if (restored) {
      var answered = countAnswers();
      showStep(answered > 0 ? Math.min(steps.length - 1, 2) : 0);
      toast('We restored your saved answers in this browser.', 'ok');
    } else {
      showStep(0);
    }
    refreshProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.AIMA);
