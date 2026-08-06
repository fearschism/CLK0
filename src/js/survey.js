/*
 * Questionnaire page (the single file sent to reporting organisations)
 * -------------------------------------------------------------------
 * Renders the question bank as a plain stepped form in English and Arabic
 * together. It shows no scores, weights or ratings: respondents answer, save a
 * PDF and download a data file. All rating happens later in the console.
 */
(function (AIMA) {
  'use strict';

  var util = AIMA.util;
  var answers = AIMA.answers;
  var esc = util.escapeHTML;
  var t = AIMA.t;
  var ui = AIMA.ui;
  var NA = AIMA.NOT_APPLICABLE;
  var NONE = answers.NONE;

  var STORAGE_KEY = 'aima.return.draft.v3';
  var CUSTOM_ENTITY = '__other__';

  var state = newReturn();
  var steps = [];
  var currentStep = 0;
  var saveTimer = null;

  /* ---------- bilingual rendering helpers ---------- */

  /** English and Arabic stacked, for anything with room for two lines. */
  function bi(value) {
    return '<span class="en">' + esc(t(value, 'en')) + '</span>' +
      '<span class="ar">' + esc(t(value, 'ar')) + '</span>';
  }

  /** English and Arabic on one line, for buttons and short labels. */
  function biInline(value) {
    return esc(t(value, 'en')) + '<span class="ar-in">' + esc(t(value, 'ar')) + '</span>';
  }

  /** Both languages in one plain string, for <option> and printed cells. */
  function biPlain(value, separator) {
    var en = t(value, 'en');
    var ar = t(value, 'ar');
    if (!ar || ar === en) return en;
    return en + (separator || ' — ') + ar;
  }

  function newReturn() {
    return {
      id: util.uid('return'),
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      entity: { code: '', name: null, type: null, region: null, size: null },
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
    el.innerHTML = bi(message);
    stack.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, 4200);
  }

  /* ------------------------------------------------------------------ *
   * Building the form
   * ------------------------------------------------------------------ */

  function fillSelect(select, values, placeholder) {
    var html = placeholder ? '<option value="">' + esc(biPlain(placeholder)) + '</option>' : '';
    values.forEach(function (item) {
      html += '<option value="' + esc(item.value) + '">' + esc(item.label) + '</option>';
    });
    select.innerHTML = html;
  }

  function buildIntro() {
    $('introQuestionCount').textContent = AIMA.questionCount;
    $('introQuestionCountAr').textContent = AIMA.questionCount;
    $('introMinutes').textContent = AIMA.meta.estimatedMinutes;
    $('introMinutesAr').textContent = AIMA.meta.estimatedMinutes;
    $('introFrameworks').innerHTML = AIMA.frameworks.map(function (f) {
      return '<strong>' + esc(f.short) + '</strong>';
    }).join(' &nbsp;·&nbsp; ');
  }

  function buildDetailsStep() {
    var entityOptions = AIMA.entities.map(function (e) {
      return { value: e.code, label: e.code + ' — ' + biPlain(e.name) };
    });
    entityOptions.push({ value: CUSTOM_ENTITY, label: biPlain(ui.otherOrganisation) });
    fillSelect($('entitySelect'), entityOptions, ui.chooseOrganisation);

    fillSelect($('entityTypeSelect'), AIMA.entityTypes.map(function (v) {
      return { value: t(v, 'en'), label: biPlain(v) };
    }), ui.notListed);
    fillSelect($('regionSelect'), AIMA.regions.map(function (v) {
      return { value: t(v, 'en'), label: biPlain(v) };
    }), ui.notListed);
    fillSelect($('sizeSelect'), AIMA.entitySizes.map(function (v) {
      return { value: t(v, 'en'), label: biPlain(v) };
    }), ui.preferNotToSay);

    $('contactFields').innerHTML = AIMA.respondentFields.map(function (field) {
      return '<div class="field" id="field-' + field.id + '">' +
        '<label for="' + field.id + '">' +
        '<span class="en">' + esc(t(field.label, 'en')) + (field.required ? ' <span class="req">*</span>' : '') + '</span>' +
        '<span class="ar">' + esc(t(field.label, 'ar')) + (field.required ? ' <span class="req">*</span>' : '') + '</span>' +
        '</label>' +
        '<input type="' + (field.type === 'email' ? 'email' : 'text') + '" id="' + field.id + '" />' +
        '</div>';
    }).join('');
  }

  function questionHTML(question) {
    var html = '<div class="q" id="q-' + question.id + '" data-qid="' + question.id + '">';
    html += '<div class="q-head">';
    html += '<div class="q-number">' + question.number + '</div>';
    html += '<div class="q-body"><span class="q-text">' + bi(question.text) + '</span>';
    if (question.hint) html += '<div class="q-hint">' + bi(question.hint) + '</div>';
    html += '</div></div>';
    html += '<div class="q-input">' + inputHTML(question) + '</div>';
    return html + '</div>';
  }

  function inputHTML(question) {
    var options = AIMA.optionsFor(question);

    if (question.type === 'yesno') {
      return '<div class="opt-row" role="radiogroup" aria-label="' + esc(t(question.text, 'en')) + '">' +
        options.map(function (option) {
          return '<label class="opt' + (option.value === NA ? ' opt-na' : '') + '">' +
            '<input type="radio" name="' + question.id + '" value="' + esc(option.value) + '" data-qid="' + question.id + '" />' +
            '<span class="tick" aria-hidden="true"></span><span>' + biInline(option.label) + '</span></label>';
        }).join('') + '</div>';
    }

    if (question.type === 'choice') {
      return '<select id="input-' + question.id + '" data-qid="' + question.id + '" data-kind="choice">' +
        '<option value="">' + esc(biPlain(ui.chooseAnswer)) + '</option>' +
        options.map(function (option) {
          return '<option value="' + esc(option.value) + '">' + esc(biPlain(option.label)) + '</option>';
        }).join('') + '</select>';
    }

    if (question.type === 'multi') {
      var html = '<div class="check-list">';
      html += options.filter(function (o) { return o.value !== NA; }).map(function (option) {
        return '<label class="check">' +
          '<input type="checkbox" name="' + question.id + '" value="' + esc(option.value) + '" data-qid="' + question.id + '" data-kind="multi" />' +
          '<span class="box" aria-hidden="true"></span><span>' + bi(option.label) + '</span></label>';
      }).join('');
      html += '<label class="check check-none">' +
        '<input type="checkbox" name="' + question.id + '" value="' + NONE + '" data-qid="' + question.id + '" data-kind="multi" />' +
        '<span class="box" aria-hidden="true"></span><span>' + bi(question.noneLabel || ui.notApplicable) + '</span></label>';
      if (question.allowNA) {
        html += '<label class="check check-none">' +
          '<input type="checkbox" name="' + question.id + '" value="' + NA + '" data-qid="' + question.id + '" data-kind="multi" />' +
          '<span class="box" aria-hidden="true"></span><span>' + bi(ui.notApplicable) + '</span></label>';
      }
      return html + '</div>';
    }

    if (question.type === 'number') {
      return '<div class="number-row">' +
        '<input type="number" min="0" step="1" id="input-' + question.id + '" data-qid="' + question.id + '" data-kind="number" />' +
        (question.unit ? '<span class="unit">' + esc(biPlain(question.unit, ' / ')) + '</span>' : '') + '</div>';
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
        '<span class="step-count">' + (index + 3) + '</span>' +
        '<h2>' + bi(section.title) + '</h2></div>';
      if (section.intro) html += '<div class="step-intro">' + bi(section.intro) + '</div>';

      html += '<div class="questions">' + section.questions.map(function (raw) {
        return questionHTML(AIMA.getQuestion(raw.id));
      }).join('') + '</div>';

      html += '<div class="section-comment"><div class="field mb-0">' +
        '<label for="note-' + section.id + '">' + bi(ui.sectionComment) + '</label>' +
        '<textarea id="note-' + section.id + '" data-sectionnote="' + section.id + '" ' +
        'placeholder="' + esc(biPlain(ui.commentPlaceholder, '  ')) + '"></textarea>' +
        '</div></div>';

      html += '<div class="step-actions">' +
        '<button type="button" class="btn" data-goto-prev>' + biInline(ui.back) + '</button>' +
        '<div class="spacer"></div>' +
        '<span class="status muted" data-section-progress="' + section.id + '"></span>' +
        '<button type="button" class="btn btn-primary" data-goto-next>' + biInline(ui.continue) + '</button>' +
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
        label: key === 'intro' ? AIMA.T('Before you start', 'قبل أن تبدأ')
          : key === 'details' ? AIMA.T('About your organisation', 'بيانات مؤسستكم')
            : key === 'finish' ? AIMA.T('Save and send', 'الحفظ والإرسال') : section.title,
        section: section
      });
    });

    $('stepNav').innerHTML = steps.map(function (step, index) {
      return '<li><button type="button" data-step-to="' + index + '">' +
        '<span class="marker" data-marker="' + index + '">' + (index + 1) + '</span>' +
        '<span class="label">' + bi(step.label) + '</span></button></li>';
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
    var problems = 0;

    var entityField = $('field-entity');
    entityField.classList.remove('invalid');
    removeFieldError(entityField);
    if (!state.entity.name) {
      entityField.classList.add('invalid');
      addFieldError(entityField, AIMA.T('Please choose your organisation.', 'يُرجى اختيار مؤسستكم.'));
      problems++;
    }

    AIMA.respondentFields.forEach(function (field) {
      if (!field.required) return;
      var wrap = $('field-' + field.id);
      wrap.classList.remove('invalid');
      removeFieldError(wrap);
      if (!String(state.contact[field.id] || '').trim()) {
        wrap.classList.add('invalid');
        addFieldError(wrap, AIMA.T('Please complete this.', 'يُرجى تعبئة هذا الحقل.'));
        problems++;
      }
    });

    if (problems) {
      toast(AIMA.T('Please complete the highlighted details before continuing.',
        'يُرجى استكمال الحقول المميزة قبل المتابعة.'), 'err');
      var first = document.querySelector('.field.invalid');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  }

  function addFieldError(wrap, message) {
    var span = document.createElement('span');
    span.className = 'field-error';
    span.innerHTML = bi(message);
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

    var answered = answers.isAnswered(question, answer);
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
      $('entityNameInput').value = t(state.entity.name, 'en') || '';
    } else {
      $('field-entityName').setAttribute('hidden', '');
    }
    $('entityTypeSelect').value = state.entity.type ? t(state.entity.type, 'en') : '';
    $('regionSelect').value = state.entity.region ? t(state.entity.region, 'en') : '';
    $('sizeSelect').value = state.entity.size ? t(state.entity.size, 'en') : '';
    $('dateInput').value = state.submittedDate || '';
    AIMA.respondentFields.forEach(function (field) {
      var input = $(field.id);
      if (input) input.value = state.contact[field.id] || '';
    });
    $('declarationCheck').checked = !!state.declarationConfirmed;
    $('declarationWrap').classList.toggle('selected', !!state.declarationConfirmed);
  }

  /** Find the bilingual entry whose English form matches a select value. */
  function lookup(list, englishValue) {
    return list.filter(function (item) { return t(item, 'en') === englishValue; })[0] || null;
  }

  /* ------------------------------------------------------------------ *
   * Progress
   * ------------------------------------------------------------------ */

  function countAnswers() {
    var answered = 0;
    AIMA.allQuestions.forEach(function (question) {
      if (answers.isAnswered(question, state.answers[question.id])) answered++;
    });
    return answered;
  }

  function sectionProgress(section) {
    var answered = 0;
    section.questions.forEach(function (raw) {
      if (answers.isAnswered(AIMA.getQuestion(raw.id), state.answers[raw.id])) answered++;
    });
    return { answered: answered, total: section.questions.length };
  }

  function refreshProgress() {
    var answered = countAnswers();
    var total = AIMA.questionCount;
    var percent = Math.round((answered / total) * 100);

    $('progressText').innerHTML = answered + ' / ' + total +
      '<span class="ar-in">' + esc(t(ui.ofQuestionsAnswered, 'ar')) + '</span>';
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
        if (label) label.textContent = progress.answered + ' / ' + progress.total;
      } else if (step.key === 'details') {
        if (state.entity.name && state.contact.contactName && state.contact.contactEmail) marker.classList.add('done');
        else if (state.entity.name || state.contact.contactName) marker.classList.add('partial');
      }
    });

    $('entityStatus').textContent = (state.entity.name ? biPlain(state.entity.name) : t(ui.notChosen, 'en')) +
      ' · ' + answered + ' / ' + total;
  }

  /* ------------------------------------------------------------------ *
   * Finish step and printed output
   * ------------------------------------------------------------------ */

  function unansweredList() {
    return AIMA.allQuestions.filter(function (question) {
      return !answers.isAnswered(question, state.answers[question.id]);
    });
  }

  function renderFinishStep() {
    var missing = unansweredList();
    var status = $('finishStatus');

    if (!state.entity.name || !state.contact.contactName) {
      status.className = 'callout warn';
      status.innerHTML = '<h4>' + bi(AIMA.T('Your organisation details are incomplete',
        'بيانات مؤسستكم غير مكتملة')) + '</h4><p class="mb-0">' +
        bi(AIMA.T('Please go back to “About your organisation” and complete the required fields.',
          'يُرجى الرجوع إلى «بيانات مؤسستكم» واستكمال الحقول المطلوبة.')) + '</p>';
    } else if (missing.length) {
      status.className = 'callout warn';
      status.innerHTML = '<h4>' + bi({
        en: missing.length + ' question' + (missing.length === 1 ? '' : 's') + ' still unanswered',
        ar: 'ما زال هناك ' + missing.length + ' سؤالاً دون إجابة'
      }) + '</h4><p>' + bi(AIMA.T('You can still save and send, but please answer what you can first.',
        'يمكنكم الحفظ والإرسال، لكن يُرجى الإجابة على ما تستطيعون أولاً.')) + '</p><p class="mb-0">' +
        missing.slice(0, 12).map(function (q) {
          return '<button type="button" class="btn btn-sm" data-jump-question="' + q.id + '" style="margin:2px 3px">' +
            t(ui.question, 'en') + ' ' + q.number + '</button>';
        }).join('') +
        (missing.length > 12 ? ' <span class="muted">+' + (missing.length - 12) + '</span>' : '') + '</p>';
    } else {
      status.className = 'callout good';
      status.innerHTML = '<h4>' + bi(AIMA.T('All questions answered — thank you',
        'تمت الإجابة على جميع الأسئلة — شكراً لكم')) + '</h4><p class="mb-0">' +
        bi(AIMA.T('Complete the three steps below to finish your return.',
          'أكملوا الخطوات الثلاث أدناه لإنهاء النموذج.')) + '</p>';
    }

    var rows = '';
    AIMA.sections.forEach(function (section) {
      var progress = sectionProgress(section);
      rows += '<tr class="section-row"><th>' + bi(section.title) + '</th><td>' +
        progress.answered + ' / ' + progress.total + '</td></tr>';
      section.questions.forEach(function (raw) {
        var question = AIMA.getQuestion(raw.id);
        var answered = answers.isAnswered(question, state.answers[question.id]);
        rows += '<tr><th><span class="qnum">' + question.number + '</span>' + bi(question.text) + '</th>' +
          '<td' + (answered ? '' : ' class="missing"') + '>' +
          bi(answers.describeAnswerBoth(question, state.answers[question.id])) + '</td></tr>';
      });
    });
    $('reviewTable').querySelector('tbody').innerHTML = rows;
  }

  function renderPrintSummary() {
    var missing = unansweredList().length;
    var name = state.entity.name ? biPlain(state.entity.name) : '—';

    $('printSubtitle').innerHTML = esc(name) +
      (state.entity.type ? ' · ' + esc(biPlain(state.entity.type)) : '');
    $('printMeta').textContent = [
      t(ui.completedBy, 'en') + ': ' + (state.contact.contactName || '—') +
        (state.contact.contactRole ? ', ' + state.contact.contactRole : ''),
      t(ui.date, 'en') + ': ' + (state.submittedDate || '—'),
      countAnswers() + ' / ' + AIMA.questionCount + ' ' + t(ui.ofQuestionsAnswered, 'en')
    ].join('  ·  ');

    function row(label, value) {
      return '<tr><th style="width:30%">' + bi(label) + '</th><td>' + esc(value) + '</td></tr>';
    }

    var html = '<h2>' + bi(ui.organisationDetails) + '</h2><table class="answer-log"><tbody>' +
      row(ui.organisation, (state.entity.code ? state.entity.code + ' — ' : '') + name) +
      row(ui.type, state.entity.type ? biPlain(state.entity.type) : '—') +
      row(ui.region, state.entity.region ? biPlain(state.entity.region) : '—') +
      row(ui.size, state.entity.size ? biPlain(state.entity.size) : '—') +
      row(ui.cycle, biPlain(AIMA.branding.cycle)) +
      row(ui.dateCompleted, state.submittedDate || '—') +
      row(ui.completedBy, (state.contact.contactName || '—') +
        (state.contact.contactRole ? ' (' + state.contact.contactRole + ')' : '')) +
      row(ui.contactEmail, state.contact.contactEmail || '—') +
      row(ui.contactPhone, state.contact.contactPhone || '—') +
      row(ui.approvedBy, state.contact.approverName || '—') +
      '</tbody></table>';

    AIMA.sections.forEach(function (section, index) {
      html += '<h2' + (index === 0 ? ' style="margin-top:7mm"' : '') + '>' + bi(section.title) + '</h2>';
      html += '<table class="answer-log"><thead><tr>' +
        '<th style="width:6%">' + bi(ui.number) + '</th>' +
        '<th style="width:52%">' + bi(ui.question) + '</th>' +
        '<th>' + bi(ui.answer) + '</th></tr></thead><tbody>';
      section.questions.forEach(function (raw) {
        var question = AIMA.getQuestion(raw.id);
        html += '<tr><td>' + question.number + '</td><td>' + bi(question.text) + '</td><td>' +
          bi(answers.describeAnswerBoth(question, state.answers[question.id])) + '</td></tr>';
      });
      if (state.sectionNotes[section.id]) {
        html += '<tr><td></td><td><em>' + bi(ui.yourComments) + '</em></td><td>' +
          esc(state.sectionNotes[section.id]) + '</td></tr>';
      }
      html += '</tbody></table>';
    });

    html += '<h2 style="margin-top:6mm">' + bi(ui.declaration) + '</h2>';
    html += '<p style="font-size:9pt">' + bi(state.declarationConfirmed
      ? AIMA.T('The respondent has confirmed that these answers are accurate to the best of their knowledge and that a senior manager has approved this return.',
        'أقر معبئ النموذج بأن هذه الإجابات صحيحة على حد علمه وأن أحد كبار المسؤولين قد اعتمد النموذج.')
      : AIMA.T('The declaration was not confirmed in the online form. Please sign below to confirm the answers are accurate.',
        'لم يتم تأكيد الإقرار في النموذج الإلكتروني. يُرجى التوقيع أدناه لتأكيد صحة الإجابات.')) + '</p>';
    html += '<table class="signoff"><tbody>' +
      '<tr><th>' + bi(ui.completedBy) + '</th><td>' + esc(state.contact.contactName || '') +
      (state.contact.contactRole ? ', ' + esc(state.contact.contactRole) : '') +
      '</td><th>' + bi(ui.signature) + '</th><td class="sign-line"></td><th>' + bi(ui.date) + '</th><td class="sign-line"></td></tr>' +
      '<tr><th>' + bi(ui.approvedBy) + '</th><td>' + esc(state.contact.approverName || '') +
      '</td><th>' + bi(ui.signature) + '</th><td class="sign-line"></td><th>' + bi(ui.date) + '</th><td class="sign-line"></td></tr>' +
      '</tbody></table>';

    html += '<div class="print-footnote">' +
      (missing ? '<strong>' + missing + '</strong> ' + esc(t(AIMA.T('questions were left unanswered.',
        'سؤالاً تُرك دون إجابة.'), 'en')) + ' ' : '') +
      esc(AIMA.brand('returnInstructions', 'en')) + ' — ' + esc(AIMA.brand('returnContact', 'en')) + ' · ' +
      esc(AIMA.brand('returnDeadline', 'en')) + ' · ' + esc(AIMA.brand('documentRef', 'en')) + ' · ' +
      esc(AIMA.brand('classification', 'en')) +
      '<span class="ar">' + esc(AIMA.brand('returnInstructions', 'ar')) + ' — ' +
      esc(AIMA.brand('returnContact', 'ar')) + ' · ' + esc(AIMA.brand('returnDeadline', 'ar')) + ' · ' +
      esc(AIMA.brand('classification', 'ar')) + '</span></div>';

    $('printSummary').innerHTML = html;
  }

  /* ------------------------------------------------------------------ *
   * Saving, export, resume
   * ------------------------------------------------------------------ */

  function queueSave() {
    state.updatedAt = new Date().toISOString();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveDraft();
      renderPrintSummary();
    }, 600);
  }

  function saveDraft(silent) {
    var ok = util.store.save(STORAGE_KEY, state);
    $('savedStatus').textContent = ok
      ? t(ui.savedAt, 'en') + ' ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : '';
    if (!silent && !ok) {
      toast(AIMA.T('This browser will not store your progress. Please download the data file before closing.',
        'لن يحفظ هذا المتصفح تقدمكم. يُرجى تنزيل ملف البيانات قبل الإغلاق.'), 'err');
    }
    return ok;
  }

  function loadDraft() {
    var saved = util.store.load(STORAGE_KEY, null);
    if (!saved || !saved.answers) return false;
    state = Object.assign(newReturn(), saved);
    state.entity = Object.assign({ code: '', name: null, type: null, region: null, size: null }, saved.entity || {});
    state.contact = Object.assign({ contactName: '', contactRole: '', contactEmail: '', contactPhone: '', approverName: '' }, saved.contact || {});
    state.answers = saved.answers || {};
    state.sectionNotes = saved.sectionNotes || {};
    return true;
  }

  /** The return file. Answers only — no scores. */
  function buildReturnFile() {
    return {
      schemaVersion: AIMA.meta.schemaVersion,
      frameworkVersion: AIMA.meta.frameworkVersion,
      returnTitle: AIMA.meta.title,
      programme: AIMA.branding.programme,
      requestedBy: AIMA.branding.organisation,
      documentRef: AIMA.brand('documentRef', 'en'),
      period: AIMA.brand('cycle', 'en'),
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
        percent: Math.round((countAnswers() / AIMA.questionCount) * 1000) / 10
      },
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      exportedAt: new Date().toISOString()
    };
  }

  function exportFileName(extension) {
    return 'ai-cyber-return_' +
      util.slug((state.entity.code || 'organisation') + '-' + t(state.entity.name, 'en')) + '_' +
      util.slug(AIMA.brand('cycle', 'en')) + '.' + extension;
  }

  function downloadJSON() {
    saveDraft(true);
    util.downloadJSON(exportFileName('json'), buildReturnFile());
    var missing = unansweredList().length;
    toast(missing
      ? {
        en: 'Data file downloaded. ' + missing + ' question(s) still unanswered.',
        ar: 'تم تنزيل ملف البيانات. ما زال هناك ' + missing + ' سؤالاً دون إجابة.'
      }
      : AIMA.T('Data file downloaded. Please email it with your PDF.',
        'تم تنزيل ملف البيانات. يُرجى إرساله مع ملف PDF.'), missing ? '' : 'ok');
  }

  function savePDF() {
    renderPrintSummary();
    setTimeout(function () { window.print(); }, 160);
  }

  function resumeFromFile(fileList) {
    util.readJSONFiles(fileList).then(function (result) {
      if (result.errors.length) {
        toast(AIMA.T('That file could not be read.', 'تعذّرت قراءة هذا الملف.'), 'err');
        return;
      }
      var file = result.records[0] && result.records[0].data;
      if (!file || typeof file !== 'object' || !file.answers) {
        toast(AIMA.T('That is not a saved return. Look for the .json file downloaded from this questionnaire.',
          'هذا ليس نموذجاً محفوظاً. ابحثوا عن ملف .json الذي جرى تنزيله من هذا الاستبيان.'), 'err');
        return;
      }
      var major = String(file.schemaVersion || '').split('.')[0];
      if (major && major !== String(AIMA.meta.schemaVersion).split('.')[0]) {
        toast(AIMA.T('That file came from an earlier version of this questionnaire and cannot be loaded.',
          'هذا الملف من نسخة سابقة من الاستبيان ولا يمكن تحميله.'), 'err');
        return;
      }

      state = Object.assign(newReturn(), {
        id: file.id || util.uid('return'),
        entity: Object.assign({ code: '', name: null, type: null, region: null, size: null }, file.entity || {}),
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
      toast({
        en: 'Loaded the saved return — ' + countAnswers() + ' of ' + AIMA.questionCount + ' questions already answered.',
        ar: 'تم تحميل النموذج المحفوظ — ' + countAnswers() + ' من ' + AIMA.questionCount + ' سؤالاً مُجاباً بالفعل.'
      }, 'ok');
    });
  }

  function clearAll() {
    if (!window.confirm(t(AIMA.T('Clear all answers and start again?', 'مسح جميع الإجابات والبدء من جديد؟'), 'en') +
      '\n' + t(AIMA.T('Clear all answers and start again?', 'مسح جميع الإجابات والبدء من جديد؟'), 'ar'))) return;
    state = newReturn();
    util.store.remove(STORAGE_KEY);
    writeDetailsToForm();
    paintAllAnswers();
    renderPrintSummary();
    refreshProgress();
    showStep(0);
    toast(AIMA.T('All answers cleared.', 'تم مسح جميع الإجابات.'), 'ok');
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
            answers.isAnswered(AIMA.getQuestion(input.dataset.qid), state.answers[input.dataset.qid]));
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
        var typed = $('entityNameInput').value.trim();
        state.entity = {
          code: 'OTHER',
          name: typed ? { en: typed, ar: typed } : null,
          type: state.entity.type, region: state.entity.region, size: state.entity.size
        };
      } else {
        $('field-entityName').setAttribute('hidden', '');
        var entity = AIMA.getEntity(code);
        state.entity = entity
          ? { code: entity.code, name: entity.name, type: entity.type, region: entity.region, size: entity.size }
          : { code: '', name: null, type: null, region: null, size: null };
        $('entityTypeSelect').value = state.entity.type ? t(state.entity.type, 'en') : '';
        $('regionSelect').value = state.entity.region ? t(state.entity.region, 'en') : '';
        $('sizeSelect').value = state.entity.size ? t(state.entity.size, 'en') : '';
      }
      $('field-entity').classList.remove('invalid');
      removeFieldError($('field-entity'));
      queueSave();
      refreshProgress();
    });

    $('entityNameInput').addEventListener('input', function () {
      var typed = this.value.trim();
      state.entity.name = typed ? { en: typed, ar: typed } : null;
      queueSave();
      refreshProgress();
    });

    $('entityTypeSelect').addEventListener('change', function () {
      state.entity.type = lookup(AIMA.entityTypes, this.value);
      queueSave();
    });
    $('regionSelect').addEventListener('change', function () {
      state.entity.region = lookup(AIMA.regions, this.value);
      queueSave();
    });
    $('sizeSelect').addEventListener('change', function () {
      state.entity.size = lookup(AIMA.entitySizes, this.value);
      queueSave();
    });

    $('dateInput').addEventListener('change', function () {
      state.submittedDate = this.value;
      queueSave();
    });

    $('contactFields').addEventListener('input', function (event) {
      var input = event.target;
      if (!input.id || state.contact[input.id] === undefined) return;
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
      if (saveDraft()) toast(AIMA.T('Progress saved in this browser.', 'تم حفظ التقدم في هذا المتصفح.'), 'ok');
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
    AIMA.applyBranding({ title: AIMA.t(AIMA.meta.title, 'en') });
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
      showStep(countAnswers() > 0 ? Math.min(steps.length - 1, 2) : 0);
      toast(AIMA.T('We restored your saved answers in this browser.',
        'تمت استعادة إجاباتكم المحفوظة في هذا المتصفح.'), 'ok');
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
