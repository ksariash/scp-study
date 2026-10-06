(() => {
  'use strict';

  const el = id => document.getElementById(id);
  const Q = typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS) ? QUESTIONS : [];
  const E = Array.isArray(window.ESSAY_PRACTICE_DATA) ? window.ESSAY_PRACTICE_DATA : [];
  const zman = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  const zid = String(zman.id || 'default');
  const analyticsZman = String(zman.analyticsKey || zid);
  const essayTags = zman.essayCategoryTags && typeof zman.essayCategoryTags === 'object' ? zman.essayCategoryTags : {};

  const MAIN = 'courseReviewSpacedRepetition.v1';
  const SUP = `scpStudy.testSupplement.v2:${zid}`;
  const PENDING = `scpStudy.pendingCombinedTestResult.v2:${zid}`;
  const ESSAY_RESULT = `scpStudy.testEssayPairings.v1:${zid}`;
  const SYNC = 'scpStudy.sync.v1';
  const SYNCQ = 'scpStudy.syncQueue.v1';
  const DURATION = 3 * 60 * 60 * 1000;
  const CORE_TIMER_GRACE = 3 * 1000;

  const qMap = new Map(Q.map(q => [Number(q.id), q]));
  const eMap = new Map(E.map(e => [String(e.id), e]));
  const json = (value, fallback = null) => {
    try { return JSON.parse(value); }
    catch (_) { return fallback; }
  };
  const uid = () => crypto?.randomUUID?.() || `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  let finishing = false;

  function stored() {
    const raw = json(localStorage.getItem(MAIN), null);
    if (!raw) return { env: { scopeVersion: 1, cohorts: {} }, state: null };
    if (raw.scopeVersion === 1 && raw.cohorts && typeof raw.cohorts === 'object') {
      let state = raw.cohorts[zid] || null;
      if (!state && Array.isArray(zman.legacyIds)) {
        for (const id of zman.legacyIds) {
          if (raw.cohorts[id]) { state = raw.cohorts[id]; break; }
        }
      }
      return { env: raw, state };
    }
    return { env: { scopeVersion: 1, cohorts: { [zid]: raw } }, state: raw };
  }

  function read() {
    return stored().state;
  }

  function write(state) {
    const { env } = stored();
    env.scopeVersion = 1;
    env.cohorts ||= {};
    env.cohorts[zid] = state;
    localStorage.setItem(MAIN, JSON.stringify(env));
  }

  function readSup() {
    const value = json(localStorage.getItem(SUP), null);
    return value && typeof value === 'object' ? value : null;
  }

  function saveSup(value) {
    localStorage.setItem(SUP, JSON.stringify(value));
  }

  function baseSup(test) {
    return {
      v: 4,
      testId: String(test.id),
      phase: 'questions',
      flags: [],
      essayOrder: E.map(essay => String(essay.id)),
      essayIndex: 0,
      essayFactIndex: {},
      essayPairings: {}
    };
  }

  function normSup(test) {
    let sup = readSup();
    if (!sup || String(sup.testId) !== String(test.id)) sup = baseSup(test);
    sup.v = 4;
    sup.phase = sup.phase === 'essays' ? 'essays' : 'questions';
    sup.flags = [...new Set((sup.flags || []).map(Number).filter(id => qMap.has(id)))];

    const ids = E.map(essay => String(essay.id));
    const savedOrder = Array.isArray(sup.essayOrder)
      ? sup.essayOrder.map(String).filter(id => eMap.has(id))
      : [];
    sup.essayOrder = savedOrder.length === ids.length && ids.every(id => savedOrder.includes(id))
      ? savedOrder
      : ids;
    sup.essayIndex = Math.min(Math.max(0, Number(sup.essayIndex) || 0), Math.max(0, sup.essayOrder.length - 1));
    sup.essayFactIndex = sup.essayFactIndex && typeof sup.essayFactIndex === 'object' ? sup.essayFactIndex : {};
    sup.essayPairings = sup.essayPairings && typeof sup.essayPairings === 'object' ? sup.essayPairings : {};

    for (const essayId of sup.essayOrder) {
      const essay = eMap.get(essayId);
      const maxFact = Math.max(0, Number(essay?.facts?.length || 0) - 1);
      sup.essayFactIndex[essayId] = Math.min(Math.max(0, Number(sup.essayFactIndex[essayId]) || 0), maxFact);
      const prior = sup.essayPairings[essayId];
      sup.essayPairings[essayId] = prior && typeof prior === 'object' ? prior : {};
      if (essay?.facts?.length) {
        const validFactIds = new Set(essay.facts.map(fact => String(fact.id)));
        for (const key of Object.keys(sup.essayPairings[essayId])) {
          const value = String(sup.essayPairings[essayId][key] || '');
          if (!validFactIds.has(String(key)) || !validFactIds.has(value)) delete sup.essayPairings[essayId][key];
          else sup.essayPairings[essayId][String(key)] = value;
        }
      }
    }
    saveSup(sup);
    return sup;
  }

  const exactDeadline = test => (Number(test.startedAt) || Date.now()) + DURATION;
  const coreDeadline = test => exactDeadline(test) + CORE_TIMER_GRACE;

  function active() {
    const state = read();
    const test = state?.activeTest;
    if (!test?.id) {
      document.body.classList.remove('ui-test-active', 'ui-test-essays');
      return null;
    }

    const desiredEnd = coreDeadline(test);
    if (!Number(test.endTime) || Number(test.endTime) < desiredEnd) {
      test.endTime = desiredEnd;
      write(state);
    }

    const sup = normSup(test);
    document.body.classList.add('ui-test-active');
    document.body.classList.toggle('ui-test-essays', sup.phase === 'essays');
    return { state, test, sup };
  }

  function copy() {
    const intro = el('testIntroDialog');
    if (intro) {
      const introCopy = intro.querySelector('.modal-head p');
      const calloutCopy = intro.querySelector('.callout p');
      if (introCopy) {
        introCopy.textContent = `All ${Q.length} questions plus ${E.length} essay${E.length === 1 ? '' : 's'}, with one 3-hour countdown. Multiple-choice timing and final results continue to feed study scheduling.`;
      }
      if (calloutCopy) {
        calloutCopy.textContent = 'Questions and essay pairings are submitted without correctness feedback during the test. You can move freely between Questions and Essays, edit submitted essay pairings, flag questions for follow-up, and review everything before finishing.';
      }
      if (el('startTestBtn')) el('startTestBtn').textContent = 'Start 3-hour test';
    }

    const categoriesDescription = el('categoriesDialogDescription');
    if (categoriesDescription && !document.body.classList.contains('essay-mode-active')) {
      categoriesDescription.textContent = 'Choose which categories may be selected in Question study. The practice test always uses the full question bank.';
    }
  }

  function bridgeNativeStart() {
    window.setTimeout(() => {
      const state = read();
      const test = state?.activeTest;
      if (!test?.id) return;
      test.endTime = coreDeadline(test);
      write(state);
      saveSup(baseSup(test));
      window.location.reload();
    }, 0);
  }

  function currentId(test) {
    const selected = Number(el('questionNumber')?.value);
    if (qMap.has(selected)) return selected;
    return Number(test.order?.[Number(test.index) || 0]);
  }

  const questionAnswered = test => (test.order || []).filter(id => test.items?.[id]?.answered).length;
  const allQuestionsAnswered = test => !!test.order?.length && questionAnswered(test) === test.order.length;

  function pairingMap(sup, essayId) {
    sup.essayPairings[String(essayId)] ||= {};
    return sup.essayPairings[String(essayId)];
  }

  function essayIsAnswered(sup, essayId) {
    const essay = eMap.get(String(essayId));
    if (!essay?.facts?.length) return false;
    const pairs = pairingMap(sup, essayId);
    return essay.facts.every(fact => !!pairs[String(fact.id)]);
  }

  function essayAnsweredCount(sup) {
    return (sup.essayOrder || []).filter(id => essayIsAnswered(sup, id)).length;
  }

  function essayPairingCount(sup, essayId) {
    const essay = eMap.get(String(essayId));
    if (!essay?.facts?.length) return 0;
    const pairs = pairingMap(sup, essayId);
    return essay.facts.filter(fact => !!pairs[String(fact.id)]).length;
  }

  function essayNameText(fact) {
    return fact?.tokens?.[0]?.[1] || fact?.label || '';
  }

  function essayPositionText(fact) {
    return fact?.tokens?.[1]?.[1] || '';
  }

  function pairingChoices(essay, factIndex) {
    const facts = essay?.facts || [];
    const current = facts[factIndex];
    if (!current) return [];
    const choices = [current];
    for (let offset = 1; offset < facts.length && choices.length < 3; offset += 1) {
      const candidate = facts[(factIndex + offset) % facts.length];
      if (!choices.some(item => String(item.id) === String(candidate.id))) choices.push(candidate);
    }
    return choices.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  function status(test, sup, id) {
    const item = test.items?.[id] || test.items?.[String(id)] || {};
    return { answered: !!item.answered, flagged: sup.flags.includes(Number(id)) };
  }

  function followButton() {
    const host = document.querySelector('.question-top-actions');
    if (!host) return null;
    let button = el('testFollowUpBtn');
    if (button) return button;

    button = document.createElement('button');
    button.id = 'testFollowUpBtn';
    button.type = 'button';
    button.className = 'test-followup-btn hidden';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3-5 3z"/></svg>';
    host.insertBefore(button, host.firstChild);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const attempt = active();
      if (!attempt || attempt.sup.phase !== 'questions') return;
      const id = currentId(attempt.test);
      const flags = new Set(attempt.sup.flags);
      if (flags.has(id)) flags.delete(id);
      else flags.add(id);
      attempt.sup.flags = [...flags];
      saveSup(attempt.sup);
      decorateQuestions(attempt);
    });
    return button;
  }

  function ensureSectionNav(attempt) {
    const wrap = el('testProgressWrap');
    if (!wrap) return null;
    let nav = el('testSectionNav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'testSectionNav';
      nav.className = 'test-section-nav';
      nav.setAttribute('role', 'group');
      nav.setAttribute('aria-label', 'Practice test section');
      nav.innerHTML = `
        <button type="button" id="testQuestionsPhaseBtn" class="test-section-btn">Questions</button>
        <button type="button" id="testEssaysPhaseBtn" class="test-section-btn">Essays</button>`;
      const row = wrap.querySelector('.test-progress-row');
      row?.insertAdjacentElement('afterend', nav);
      el('testQuestionsPhaseBtn')?.addEventListener('click', () => switchPhase('questions'));
      el('testEssaysPhaseBtn')?.addEventListener('click', () => switchPhase('essays'));
    }

    const qDone = questionAnswered(attempt.test);
    const eDone = essayAnsweredCount(attempt.sup);
    const qButton = el('testQuestionsPhaseBtn');
    const eButton = el('testEssaysPhaseBtn');
    if (qButton) {
      qButton.textContent = `Questions ${qDone}/${attempt.test.order.length}`;
      qButton.classList.toggle('active', attempt.sup.phase === 'questions');
      qButton.setAttribute('aria-pressed', attempt.sup.phase === 'questions' ? 'true' : 'false');
    }
    if (eButton) {
      eButton.textContent = `Essays ${eDone}/${attempt.sup.essayOrder.length}`;
      eButton.classList.toggle('active', attempt.sup.phase === 'essays');
      eButton.setAttribute('aria-pressed', attempt.sup.phase === 'essays' ? 'true' : 'false');
      eButton.disabled = !attempt.sup.essayOrder.length;
    }
    return nav;
  }

  function ensureProgressBars() {
    const wrap = el('testProgressWrap');
    const questionTrack = wrap?.querySelector('.progress-track');
    if (!wrap || !questionTrack) return;

    questionTrack.classList.add('test-question-progress-track');
    if (!el('testQuestionProgressLabel')) {
      const label = document.createElement('div');
      label.id = 'testQuestionProgressLabel';
      label.className = 'test-progress-label';
      label.innerHTML = '<span>Questions</span><strong id="testQuestionProgressText">0/0 answered</strong>';
      questionTrack.insertAdjacentElement('beforebegin', label);
    }

    if (!el('testEssayProgressTrack')) {
      const label = document.createElement('div');
      label.id = 'testEssayProgressLabel';
      label.className = 'test-progress-label test-essay-progress-label';
      label.innerHTML = '<span>Essays</span><strong id="testEssayProgressText">0/0 answered</strong>';
      const track = document.createElement('div');
      track.id = 'testEssayProgressTrack';
      track.className = 'progress-track test-essay-progress-track';
      track.innerHTML = '<div class="progress-fill test-essay-progress-fill" id="testEssayProgressFill"></div>';
      questionTrack.insertAdjacentElement('afterend', label);
      label.insertAdjacentElement('afterend', track);
    }
  }

  function updateProgress(attempt) {
    ensureSectionNav(attempt);
    ensureProgressBars();

    const qDone = questionAnswered(attempt.test);
    const qTotal = attempt.test.order.length || 0;
    const eDone = essayAnsweredCount(attempt.sup);
    const eTotal = attempt.sup.essayOrder.length || 0;

    if (el('testProgressFill')) {
      el('testProgressFill').style.width = `${qTotal ? (qDone / qTotal) * 100 : 0}%`;
    }
    if (el('testEssayProgressFill')) {
      el('testEssayProgressFill').style.width = `${eTotal ? (eDone / eTotal) * 100 : 0}%`;
    }
    if (el('testQuestionProgressText')) el('testQuestionProgressText').textContent = `${qDone}/${qTotal} answered`;
    if (el('testEssayProgressText')) el('testEssayProgressText').textContent = `${eDone}/${eTotal} answered`;

    if (attempt.sup.phase === 'essays') {
      if (el('testQuestionCount')) el('testQuestionCount').textContent = `Essay ${attempt.sup.essayIndex + 1}/${Math.max(1, eTotal)}`;
      if (el('testAnsweredCount')) el('testAnsweredCount').textContent = `${eDone}/${eTotal} essays answered`;
    } else {
      const index = Math.max(0, Number(attempt.test.index) || 0);
      if (el('testQuestionCount')) el('testQuestionCount').textContent = `Question ${index + 1}/${Math.max(1, qTotal)}`;
      if (el('testAnsweredCount')) el('testAnsweredCount').textContent = `${qDone}/${qTotal} questions answered`;
    }

    const exit = el('exitTestBtn');
    if (exit) {
      const ready = allQuestionsAnswered(attempt.test);
      exit.textContent = ready ? 'Finish test' : 'Exit test';
      exit.classList.toggle('ready-to-finish', ready);
      exit.setAttribute('aria-label', ready ? 'Finish and submit practice test' : 'Exit practice test and save as incomplete');
    }
  }

  function switchPhase(phase) {
    const attempt = active();
    if (!attempt || !['questions', 'essays'].includes(phase)) return false;
    if (phase === 'essays' && !attempt.sup.essayOrder.length) return false;
    if (attempt.sup.phase === phase) {
      if (phase === 'essays') renderEssay(attempt);
      return true;
    }

    attempt.sup.phase = phase;
    saveSup(attempt.sup);
    if (phase === 'essays') {
      renderEssay(attempt);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.location.reload();
    }
    return true;
  }

  function neutralizeQuestionFeedback(attempt) {
    const id = currentId(attempt.test);
    const current = status(attempt.test, attempt.sup, id);
    const chip = el('questionStatus');
    if (chip) {
      chip.textContent = current.answered ? 'Answered' : 'Unanswered';
      chip.className = 'status-chip';
    }
    el('feedbackBox')?.classList.add('hidden');

    el('answerForm')?.querySelectorAll('.choice').forEach(label => {
      label.classList.remove('correct-choice', 'wrong-choice');
    });
  }

  function decorateQuestions(attempt = active()) {
    if (!attempt || attempt.sup.phase !== 'questions') return;
    updateProgress(attempt);
    const id = currentId(attempt.test);
    const current = status(attempt.test, attempt.sup, id);
    const follow = followButton();
    if (follow) {
      follow.classList.remove('hidden');
      follow.classList.toggle('active', current.flagged);
      follow.setAttribute('aria-pressed', current.flagged ? 'true' : 'false');
      follow.setAttribute('aria-label', current.flagged ? 'Remove follow-up marker' : 'Mark question for follow-up');
      follow.title = current.flagged ? 'Remove follow-up marker' : 'Mark for follow-up';
    }

    const select = el('questionNumber');
    if (select) {
      [...select.options].forEach(option => {
        const number = Number(option.value);
        const itemStatus = status(attempt.test, attempt.sup, number);
        option.textContent = `${itemStatus.flagged ? '★ ' : ''}${itemStatus.answered ? '✓' : '○'} Question ${number}`;
      });
    }

    el('questionNumberMenu')?.querySelectorAll('[data-question-number]').forEach(button => {
      const number = Number(button.dataset.questionNumber);
      const itemStatus = status(attempt.test, attempt.sup, number);
      button.classList.toggle('test-answered', itemStatus.answered);
      button.classList.toggle('test-unanswered', !itemStatus.answered);
      button.classList.toggle('test-flagged', itemStatus.flagged);
      button.textContent = `${itemStatus.flagged ? '★' : ''}${itemStatus.answered ? '✓' : '○'} ${number}`;
      button.setAttribute('aria-label', `Question ${number}, ${itemStatus.answered ? 'answered' : 'unanswered'}${itemStatus.flagged ? ', marked for follow-up' : ''}`);
    });

    const trigger = el('questionNumberTrigger');
    if (trigger) {
      trigger.textContent = `Question ${id}${current.flagged ? ' ★' : current.answered ? ' ✓' : ''}`;
      trigger.setAttribute('aria-label', `Question ${id}, ${current.answered ? 'answered' : 'unanswered'}${current.flagged ? ', marked for follow-up' : ''}. Choose another question.`);
    }

    if (allQuestionsAnswered(attempt.test) && attempt.sup.essayOrder.length && el('nextBtn')) {
      el('nextBtn').textContent = 'Essays →';
    }
    neutralizeQuestionFeedback(attempt);
  }

  function currentEssay(attempt) {
    return eMap.get(String(attempt.sup.essayOrder[attempt.sup.essayIndex])) || null;
  }

  function currentEssayFactIndex(attempt, essay) {
    const essayId = String(essay.id);
    const max = Math.max(0, Number(essay.facts?.length || 0) - 1);
    const index = Math.min(Math.max(0, Number(attempt.sup.essayFactIndex[essayId]) || 0), max);
    attempt.sup.essayFactIndex[essayId] = index;
    return index;
  }

  function nextUnansweredFactIndex(attempt, essay, afterIndex = -1) {
    const pairs = pairingMap(attempt.sup, essay.id);
    const facts = essay.facts || [];
    for (let offset = 1; offset <= facts.length; offset += 1) {
      const index = (afterIndex + offset + facts.length) % facts.length;
      if (!pairs[String(facts[index].id)]) return index;
    }
    return Math.min(Math.max(0, afterIndex), Math.max(0, facts.length - 1));
  }

  function populateEssayPicker(attempt) {
    const select = el('essayQuickNav');
    if (!select) return;
    select.innerHTML = '';
    attempt.sup.essayOrder.forEach((id, index) => {
      const essay = eMap.get(String(id));
      if (!essay) return;
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${essayIsAnswered(attempt.sup, id) ? '✓ ' : '○ '}Essay ${index + 1} · ${essay.title || 'Essay'}`;
      select.append(option);
    });
    select.value = String(attempt.sup.essayIndex);
  }

  function renderEssayTags(essay) {
    const host = el('essayCategoryTags');
    if (!host) return;
    host.innerHTML = '';
    (essayTags[essay?.id] || ['Essay']).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'essay-category-tag';
      chip.textContent = tag;
      host.append(chip);
    });
  }

  function renderSubmittedPairings(attempt, essay) {
    const host = el('essayAnswerZone');
    if (!host) return;
    const pairs = pairingMap(attempt.sup, essay.id);
    host.innerHTML = '';
    const submitted = essay.facts.filter(fact => !!pairs[String(fact.id)]);
    if (!submitted.length) {
      const empty = document.createElement('span');
      empty.className = 'essay-answer-placeholder';
      empty.textContent = 'Submitted pairings will appear here. Tap any submitted pairing to edit it.';
      host.append(empty);
      return;
    }

    submitted.forEach(fact => {
      const selectedId = pairs[String(fact.id)];
      const selectedFact = essay.facts.find(item => String(item.id) === String(selectedId));
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'essay-built-row test-pairing-row';
      row.dataset.testEditFact = String(fact.id);
      row.innerHTML = `
        <span class="test-pairing-edit-icon" aria-hidden="true">✎</span>
        <div class="essay-built-copy"><strong>${escapeHtml(essayNameText(fact))}</strong><span>${escapeHtml(essayPositionText(selectedFact))}</span></div>
        <span class="test-pairing-edit-label">Edit</span>`;
      row.setAttribute('aria-label', `Edit pairing for ${essayNameText(fact)}`);
      host.append(row);
    });
  }

  function renderEssay(attempt = active()) {
    if (!attempt || attempt.sup.phase !== 'essays') return;
    document.body.classList.add('ui-test-active', 'ui-test-essays');
    el('questionCard')?.classList.add('ui-test-section-hidden');
    el('saveNote')?.classList.add('ui-test-section-hidden');
    el('essayPracticeMain')?.classList.remove('hidden');
    followButton()?.classList.add('hidden');
    updateProgress(attempt);

    const essay = currentEssay(attempt);
    if (!essay?.facts?.length) return;
    const essayId = String(essay.id);
    const factIndex = currentEssayFactIndex(attempt, essay);
    const fact = essay.facts[factIndex];
    const pairs = pairingMap(attempt.sup, essayId);
    const selectedId = pairs[String(fact.id)] || '';

    populateEssayPicker(attempt);
    renderEssayTags(essay);

    if (el('essayPracticeCounter')) el('essayPracticeCounter').textContent = `Pairing ${factIndex + 1} of ${essay.facts.length}`;
    if (el('essayMasterySummary')) {
      el('essayMasterySummary').textContent = `${essayPairingCount(attempt.sup, essayId)}/${essay.facts.length} submitted`;
    }
    if (el('essayPracticeTitle')) el('essayPracticeTitle').textContent = essay.title || 'Essay';
    if (el('essayPracticePrompt')) el('essayPracticePrompt').textContent = essay.prompt || '';
    el('essayNoteLinks')?.classList.add('hidden');
    el('essayQuestionAudio')?.classList.add('hidden');
    el('essayPromptReportBtn')?.classList.add('hidden');

    if (el('essayBuildProgress')) {
      el('essayBuildProgress').textContent = `${essayPairingCount(attempt.sup, essayId)} of ${essay.facts.length} submitted`;
    }
    renderSubmittedPairings(attempt, essay);

    el('essayMatchSection')?.classList.remove('complete');
    if (el('essayMatchCount')) el('essayMatchCount').textContent = `${factIndex + 1} of ${essay.facts.length}`;
    if (el('essayMatchContext')) el('essayMatchContext').textContent = fact.label || 'Match the position';
    if (el('essayMatchName')) el('essayMatchName').textContent = essayNameText(fact);
    el('essayPairingReportBtn')?.classList.add('hidden');
    if (el('essayPairingResources')) {
      el('essayPairingResources').innerHTML = '';
      el('essayPairingResources').classList.add('hidden');
    }

    const choices = el('essayChoiceList');
    if (choices) {
      choices.innerHTML = '';
      pairingChoices(essay, factIndex).forEach(optionFact => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'essay-choice test-essay-choice';
        button.dataset.testEssayChoice = String(optionFact.id);
        button.textContent = essayPositionText(optionFact);
        const selected = String(optionFact.id) === String(selectedId);
        button.classList.toggle('test-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        choices.append(button);
      });
    }

    if (el('essayFeedback')) {
      el('essayFeedback').className = 'essay-choice-feedback hidden';
      el('essayFeedback').textContent = '';
    }
    if (el('essayModelAnswerWrap')) {
      el('essayModelAnswerWrap').classList.add('hidden');
      el('essayModelAnswerWrap').open = false;
    }

    const previous = el('essayTryAgainBtn');
    if (previous) {
      previous.hidden = false;
      previous.textContent = '← Previous essay';
      previous.disabled = attempt.sup.essayIndex === 0;
    }
    const next = el('essayNextBtn');
    if (next) {
      next.hidden = false;
      if (attempt.sup.essayIndex < attempt.sup.essayOrder.length - 1) next.textContent = 'Next essay →';
      else if (allQuestionsAnswered(attempt.test)) next.textContent = 'Finish test';
      else next.textContent = 'Questions →';
    }
  }

  function setEssayFact(attempt, essay, factIndex) {
    const bounded = Math.min(Math.max(0, Number(factIndex) || 0), Math.max(0, essay.facts.length - 1));
    attempt.sup.essayFactIndex[String(essay.id)] = bounded;
    saveSup(attempt.sup);
    renderEssay(attempt);
  }

  function submitEssayPairing(choiceId) {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    const essay = currentEssay(attempt);
    if (!essay?.facts?.length) return;
    const factIndex = currentEssayFactIndex(attempt, essay);
    const fact = essay.facts[factIndex];
    const valid = essay.facts.some(item => String(item.id) === String(choiceId));
    if (!fact || !valid) return;

    pairingMap(attempt.sup, essay.id)[String(fact.id)] = String(choiceId);
    attempt.sup.essayFactIndex[String(essay.id)] = nextUnansweredFactIndex(attempt, essay, factIndex);
    saveSup(attempt.sup);
    renderEssay(attempt);
  }

  function editSubmittedPairing(factId) {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    const essay = currentEssay(attempt);
    const index = essay?.facts?.findIndex(fact => String(fact.id) === String(factId)) ?? -1;
    if (index < 0) return;
    setEssayFact(attempt, essay, index);
    el('essayMatchSection')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function jumpEssay(index) {
    const attempt = active();
    if (!attempt || !attempt.sup.essayOrder.length) return;
    attempt.sup.phase = 'essays';
    attempt.sup.essayIndex = Math.min(Math.max(0, Number(index) || 0), attempt.sup.essayOrder.length - 1);
    const essay = currentEssay(attempt);
    if (essay && essayIsAnswered(attempt.sup, essay.id)) {
      attempt.sup.essayFactIndex[String(essay.id)] = Math.min(
        Math.max(0, Number(attempt.sup.essayFactIndex[String(essay.id)]) || 0),
        Math.max(0, essay.facts.length - 1)
      );
    } else if (essay) {
      attempt.sup.essayFactIndex[String(essay.id)] = nextUnansweredFactIndex(attempt, essay, -1);
    }
    saveSup(attempt.sup);
    renderEssay(attempt);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function moveEssay(delta) {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    const next = Math.min(Math.max(0, attempt.sup.essayIndex + Number(delta || 0)), attempt.sup.essayOrder.length - 1);
    if (next === attempt.sup.essayIndex) return;
    jumpEssay(next);
  }

  function requestFinish() {
    const attempt = active();
    if (!attempt) return;
    const unansweredQuestions = attempt.test.order.length - questionAnswered(attempt.test);
    const unansweredEssays = attempt.sup.essayOrder.length - essayAnsweredCount(attempt.sup);
    if (unansweredQuestions || unansweredEssays) {
      const parts = [];
      if (unansweredQuestions) parts.push(`${unansweredQuestions} unanswered question${unansweredQuestions === 1 ? '' : 's'}`);
      if (unansweredEssays) parts.push(`${unansweredEssays} incomplete essay${unansweredEssays === 1 ? '' : 's'}`);
      if (!confirm(`Finish and submit the practice test with ${parts.join(' and ')}?`)) return;
    } else if (!confirm('Finish and submit this practice test? You will then see the grading feedback.')) {
      return;
    }
    finish('completed');
  }

  function requestExit() {
    const attempt = active();
    if (!attempt) return;
    if (allQuestionsAnswered(attempt.test)) {
      requestFinish();
      return;
    }
    const questions = questionAnswered(attempt.test);
    const essays = essayAnsweredCount(attempt.sup);
    if (confirm(`Exit the practice test now? ${questions}/${attempt.test.order.length} questions and ${essays}/${attempt.sup.essayOrder.length} essays are answered. This attempt will be saved as incomplete.`)) {
      finish('exited');
    }
  }

  function resultFor(test, sup, reason) {
    const perCategory = {};
    const categories = [...new Set(Q.map(q => q.category))];
    categories.forEach(category => {
      perCategory[category] = { total: 0, correct: 0, partial: 0, incorrect: 0, unanswered: 0, points: 0, timeMs: 0, answered: 0 };
    });

    let correct = 0;
    let partial = 0;
    let incorrect = 0;
    let unanswered = 0;
    let points = 0;
    let answeredTime = 0;
    let answeredCount = 0;

    test.order.forEach(id => {
      const question = qMap.get(Number(id));
      if (!question) return;
      const item = test.items?.[id] || {};
      const category = perCategory[question.category];
      category.total += 1;
      if (!item.answered) {
        unanswered += 1;
        category.unanswered += 1;
        return;
      }
      answeredCount += 1;
      answeredTime += Number(item.elapsedMs) || 0;
      category.answered += 1;
      category.timeMs += Number(item.elapsedMs) || 0;
      points += Number(item.credit) || 0;
      category.points += Number(item.credit) || 0;
      if (item.result === 'correct') { correct += 1; category.correct += 1; }
      else if (item.result === 'partial') { partial += 1; category.partial += 1; }
      else { incorrect += 1; category.incorrect += 1; }
    });

    let essayPairCorrect = 0;
    let essayPairTotal = 0;
    const essays = sup.essayOrder.map(id => {
      const essay = eMap.get(String(id));
      const pairs = pairingMap(sup, id);
      const pairings = (essay?.facts || []).map(fact => {
        const selectedId = pairs[String(fact.id)] || null;
        const selectedFact = selectedId ? essay.facts.find(item => String(item.id) === String(selectedId)) : null;
        const correctPair = !!selectedId && String(selectedId) === String(fact.id);
        essayPairTotal += 1;
        if (correctPair) essayPairCorrect += 1;
        return {
          factId: String(fact.id),
          name: essayNameText(fact),
          selectedId: selectedId ? String(selectedId) : null,
          selectedText: selectedFact ? essayPositionText(selectedFact) : '',
          correct: correctPair,
          correctText: essayPositionText(fact)
        };
      });
      const answered = pairings.length > 0 && pairings.every(item => !!item.selectedId);
      return {
        essayId: String(id),
        title: essay?.title || 'Essay',
        prompt: essay?.prompt || '',
        modelAnswer: essay?.modelAnswer || '',
        answered,
        correctCount: pairings.filter(item => item.correct).length,
        total: pairings.length,
        pairings
      };
    });

    const date = Date.now();
    return {
      summary: {
        id: String(test.id),
        date,
        reason,
        completed: reason === 'completed',
        scorePct: test.order.length ? points / test.order.length * 100 : 0,
        points,
        correct,
        partial,
        incorrect,
        unanswered,
        answeredCount,
        avgAnswerTimeMs: answeredCount ? answeredTime / answeredCount : 0,
        totalTimeMs: Math.min(DURATION, Math.max(0, date - (Number(test.startedAt) || date))),
        perCategory,
        essayTotal: essays.length,
        essayAnswered: essays.filter(item => item.answered).length,
        essayUnanswered: essays.filter(item => !item.answered).length,
        essayPairCorrect,
        essayPairTotal,
        essayScorePct: essayPairTotal ? essayPairCorrect / essayPairTotal * 100 : 0,
        followUpQuestionIds: [...sup.flags],
        testFormat: 'questions-plus-essay-pairings-v3'
      },
      essays
    };
  }

  function saveEssayResults(id, essays) {
    const history = json(localStorage.getItem(ESSAY_RESULT), {}) || {};
    history[String(id)] = { savedAt: Date.now(), essays };
    const rows = Object.entries(history)
      .sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0))
      .slice(0, 30);
    localStorage.setItem(ESSAY_RESULT, JSON.stringify(Object.fromEntries(rows)));
  }

  function queueSync(test) {
    const config = json(localStorage.getItem(SYNC), null);
    if (!config?.enabled || !config?.deviceToken) return;
    const queue = json(localStorage.getItem(SYNCQ), []) || [];
    queue.push({
      opId: uid(),
      zman: analyticsZman,
      generation: Math.max(0, Number(config.generations?.[analyticsZman]) || 0),
      kind: 'test_complete',
      payload: { test },
      clientTs: new Date().toISOString()
    });
    localStorage.setItem(SYNCQ, JSON.stringify(queue.slice(-1500)));
  }

  function finish(reason) {
    if (finishing) return;
    const state = read();
    const test = state?.activeTest;
    if (!test) return;
    finishing = true;
    const sup = normSup(test);
    const built = resultFor(test, sup, reason);
    const result = built.summary;
    saveEssayResults(result.id, built.essays);
    state.tests = Array.isArray(state.tests) ? state.tests : [];
    if (!state.tests.some(item => String(item?.id) === result.id)) state.tests.push(result);
    state.tests = state.tests.slice(-30);
    state.activeTest = null;
    write(state);
    queueSync(result);
    localStorage.setItem(PENDING, JSON.stringify({ id: result.id }));
    localStorage.removeItem(SUP);
    window.location.reload();
  }

  function showResult() {
    const pending = json(localStorage.getItem(PENDING), null);
    if (!pending?.id) return;
    const result = (read()?.tests || []).find(item => String(item?.id) === String(pending.id));
    const dialog = el('testResultDialog');
    const content = el('testResultContent');
    if (!result || !dialog || !content) return;

    const subtitle = el('testResultSubtitle');
    if (subtitle) {
      subtitle.textContent = result.completed
        ? `Completed ${new Date(result.date).toLocaleString()}`
        : result.reason === 'time'
          ? `Time expired — ${new Date(result.date).toLocaleString()}`
          : `Exited early — ${new Date(result.date).toLocaleString()}`;
    }

    const history = json(localStorage.getItem(ESSAY_RESULT), {}) || {};
    const essays = history[String(result.id)]?.essays || [];
    content.innerHTML = `
      <div class="stat-grid test-combined-stats">
        <div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(result.scorePct || 0).toFixed(1)}%</div></div>
        <div class="stat-card"><div class="label">Correct</div><div class="value">${result.correct || 0}</div></div>
        <div class="stat-card"><div class="label">Partial</div><div class="value">${result.partial || 0}</div></div>
        <div class="stat-card"><div class="label">Incorrect</div><div class="value">${result.incorrect || 0}</div></div>
        <div class="stat-card"><div class="label">Essay pairings</div><div class="value">${result.essayPairCorrect || 0}/${result.essayPairTotal || 0}</div></div>
        <div class="stat-card"><div class="label">Essay score</div><div class="value">${Number(result.essayScorePct || 0).toFixed(1)}%</div></div>
      </div>
      ${essays.length ? `<div class="stat-section"><h3>Essay results</h3><p class="small-muted">Pairing correctness is shown only after the test is submitted.</p>${essays.map((item, index) => `
        <details class="test-result-essay">
          <summary>Essay ${index + 1}: ${escapeHtml(item.title)} · ${item.correctCount}/${item.total} correct</summary>
          <div class="test-result-essay-body">
            <strong>Prompt</strong><p>${escapeHtml(item.prompt)}</p>
            <div class="test-result-pairings">${item.pairings.map(pair => `
              <div class="test-result-pairing ${pair.correct ? 'correct' : pair.selectedId ? 'incorrect' : 'unanswered'}">
                <strong>${escapeHtml(pair.name)}</strong>
                <span>${pair.selectedId ? escapeHtml(pair.selectedText) : 'No pairing submitted.'}</span>
                <small>${pair.correct ? 'Correct' : pair.selectedId ? `Correct pairing: ${escapeHtml(pair.correctText)}` : `Correct pairing: ${escapeHtml(pair.correctText)}`}</small>
              </div>`).join('')}</div>
            ${item.modelAnswer ? `<strong>Model answer</strong><p>${escapeHtml(item.modelAnswer)}</p>` : ''}
          </div>
        </details>`).join('')}</div>` : ''}`;

    localStorage.removeItem(PENDING);
    dialog.showModal();
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function syncExactTimer(attempt) {
    const remaining = exactDeadline(attempt.test) - Date.now();
    const timer = el('mainTimer');
    if (timer) timer.textContent = formatDuration(remaining);
    if (remaining <= 0) finish('time');
  }

  function showQuestionSurface(attempt) {
    document.body.classList.remove('ui-test-essays');
    el('questionCard')?.classList.remove('ui-test-section-hidden');
    el('saveNote')?.classList.remove('ui-test-section-hidden');
    el('essayPracticeMain')?.classList.add('hidden');
    decorateQuestions(attempt);
  }

  function cleanupInactive() {
    followButton()?.classList.add('hidden');
    el('testSectionNav')?.remove();
    el('testQuestionProgressLabel')?.remove();
    el('testEssayProgressLabel')?.remove();
    el('testEssayProgressTrack')?.remove();
    document.body.classList.remove('ui-test-essays');
    el('questionCard')?.classList.remove('ui-test-section-hidden');
    el('saveNote')?.classList.remove('ui-test-section-hidden');
  }

  function sync() {
    const attempt = active();
    if (!attempt) {
      cleanupInactive();
      return;
    }
    syncExactTimer(attempt);
    if (finishing) return;
    updateProgress(attempt);
    if (attempt.sup.phase === 'essays') renderEssay(attempt);
    else showQuestionSurface(attempt);
  }

  el('startTestBtn')?.addEventListener('click', bridgeNativeStart);

  document.addEventListener('click', event => {
    const attempt = active();
    if (!attempt) return;

    if (event.target.closest?.('#exitTestBtn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestExit();
      return;
    }

    if (attempt.sup.phase !== 'essays') return;

    const choice = event.target.closest?.('[data-test-essay-choice]');
    if (choice) {
      event.preventDefault();
      event.stopImmediatePropagation();
      submitEssayPairing(choice.dataset.testEssayChoice);
      return;
    }

    const edit = event.target.closest?.('[data-test-edit-fact]');
    if (edit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      editSubmittedPairing(edit.dataset.testEditFact);
      return;
    }

    if (event.target.closest?.('#essayTryAgainBtn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      moveEssay(-1);
      return;
    }

    if (event.target.closest?.('#essayNextBtn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (attempt.sup.essayIndex < attempt.sup.essayOrder.length - 1) moveEssay(1);
      else if (allQuestionsAnswered(attempt.test)) requestFinish();
      else switchPhase('questions');
    }
  }, true);

  el('essayQuickNav')?.addEventListener('change', event => {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    jumpEssay(Number(event.currentTarget.value));
  }, true);

  el('nextBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (attempt?.sup.phase === 'questions' && allQuestionsAnswered(attempt.test) && attempt.sup.essayOrder.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switchPhase('essays');
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const attempt = active();
    if (!attempt) return;
    const key = event.key;
    const interactiveTarget = event.target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]');
    const dialogOpen = !!document.querySelector('dialog[open]');
    if (interactiveTarget || dialogOpen) return;

    if (attempt.sup.phase === 'essays' && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      moveEssay(key === 'ArrowLeft' ? -1 : 1);
      return;
    }

    if (attempt.sup.phase === 'questions' && key === 'ArrowRight' && allQuestionsAnswered(attempt.test) && attempt.sup.essayOrder.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switchPhase('essays');
    }
  }, true);

  copy();
  followButton();
  active();
  window.setTimeout(() => {
    copy();
    sync();
    showResult();
    window.setInterval(sync, 200);
  }, 0);
})();