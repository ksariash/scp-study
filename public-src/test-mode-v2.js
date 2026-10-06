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
  const SUP = `scpStudy.testSupplement.v3:${zid}`;
  const LEGACY_SUP = `scpStudy.testSupplement.v2:${zid}`;
  const PENDING = `scpStudy.pendingCombinedTestResult.v3:${zid}`;
  const LEGACY_PENDING = `scpStudy.pendingCombinedTestResult.v2:${zid}`;
  const REVIEW = `scpStudy.testReview.v1:${zid}`;
  const ESSAY_RESULT = `scpStudy.testEssayPairings.v1:${zid}`;
  const SYNC = 'scpStudy.sync.v1';
  const SYNCQ = 'scpStudy.syncQueue.v1';
  const DURATION = 3 * 60 * 60 * 1000;
  const CORE_TIMER_GRACE = 2500;

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
  let reviewState = null;

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

  function read() { return stored().state; }

  function write(state) {
    const { env } = stored();
    env.scopeVersion = 1;
    env.cohorts ||= {};
    env.cohorts[zid] = state;
    localStorage.setItem(MAIN, JSON.stringify(env));
  }

  function readSup() {
    let value = json(localStorage.getItem(SUP), null);
    if (!value) {
      value = json(localStorage.getItem(LEGACY_SUP), null);
      if (value) {
        localStorage.setItem(SUP, JSON.stringify(value));
        localStorage.removeItem(LEGACY_SUP);
      }
    }
    return value && typeof value === 'object' ? value : null;
  }

  function saveSup(value) { localStorage.setItem(SUP, JSON.stringify(value)); }
  function pairingKey(essayId, factId) { return `${essayId}::${factId}`; }

  function baseSup(test) {
    return {
      v: 5,
      testId: String(test.id),
      phase: 'questions',
      flags: [],
      essayFlags: [],
      pairingFlags: [],
      essayOrder: E.map(essay => String(essay.id)),
      essayIndex: 0,
      essayFactIndex: {},
      essayPairings: {},
      essayDraftChoices: {}
    };
  }

  function normSup(test) {
    let sup = readSup();
    if (!sup || String(sup.testId) !== String(test.id)) sup = baseSup(test);
    sup.v = 5;
    sup.phase = sup.phase === 'essays' ? 'essays' : 'questions';
    sup.flags = [...new Set((sup.flags || []).map(Number).filter(id => qMap.has(id)))];
    sup.essayFlags = [...new Set((sup.essayFlags || []).map(String).filter(id => eMap.has(id)))];
    sup.pairingFlags = [...new Set((sup.pairingFlags || []).map(String))];

    const ids = E.map(essay => String(essay.id));
    const savedOrder = Array.isArray(sup.essayOrder) ? sup.essayOrder.map(String).filter(id => eMap.has(id)) : [];
    sup.essayOrder = savedOrder.length === ids.length && ids.every(id => savedOrder.includes(id)) ? savedOrder : ids;
    sup.essayIndex = Math.min(Math.max(0, Number(sup.essayIndex) || 0), Math.max(0, sup.essayOrder.length - 1));
    sup.essayFactIndex = sup.essayFactIndex && typeof sup.essayFactIndex === 'object' ? sup.essayFactIndex : {};
    sup.essayPairings = sup.essayPairings && typeof sup.essayPairings === 'object' ? sup.essayPairings : {};
    sup.essayDraftChoices = sup.essayDraftChoices && typeof sup.essayDraftChoices === 'object' ? sup.essayDraftChoices : {};

    const validPairFlags = new Set();
    for (const essayId of sup.essayOrder) {
      const essay = eMap.get(essayId);
      const facts = essay?.facts || [];
      const maxFact = Math.max(0, facts.length - 1);
      sup.essayFactIndex[essayId] = Math.min(Math.max(0, Number(sup.essayFactIndex[essayId]) || 0), maxFact);
      const validFactIds = new Set(facts.map(fact => String(fact.id)));
      const prior = sup.essayPairings[essayId];
      sup.essayPairings[essayId] = prior && typeof prior === 'object' ? prior : {};
      const drafts = sup.essayDraftChoices[essayId];
      sup.essayDraftChoices[essayId] = drafts && typeof drafts === 'object' ? drafts : {};
      for (const key of Object.keys(sup.essayPairings[essayId])) {
        const value = String(sup.essayPairings[essayId][key] || '');
        if (!validFactIds.has(String(key)) || !validFactIds.has(value)) delete sup.essayPairings[essayId][key];
        else sup.essayPairings[essayId][String(key)] = value;
      }
      for (const key of Object.keys(sup.essayDraftChoices[essayId])) {
        const value = String(sup.essayDraftChoices[essayId][key] || '');
        if (!validFactIds.has(String(key)) || !validFactIds.has(value)) delete sup.essayDraftChoices[essayId][key];
        else sup.essayDraftChoices[essayId][String(key)] = value;
      }
      for (const fact of facts) validPairFlags.add(pairingKey(essayId, fact.id));
    }
    sup.pairingFlags = sup.pairingFlags.filter(key => validPairFlags.has(key));
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
    if (!Number(test.endTime) || Math.abs(Number(test.endTime) - desiredEnd) > 100) {
      test.endTime = desiredEnd;
      write(state);
    }
    const sup = normSup(test);
    document.body.classList.add('ui-test-active');
    document.body.classList.toggle('ui-test-essays', sup.phase === 'essays');
    return { state, test, sup };
  }

  function readReviews() {
    const value = json(localStorage.getItem(REVIEW), {});
    return value && typeof value === 'object' ? value : {};
  }
  function saveReviews(value) { localStorage.setItem(REVIEW, JSON.stringify(value)); }

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
  function draftMap(sup, essayId) {
    sup.essayDraftChoices[String(essayId)] ||= {};
    return sup.essayDraftChoices[String(essayId)];
  }
  function essayIsAnswered(sup, essayId) {
    const essay = eMap.get(String(essayId));
    if (!essay?.facts?.length) return false;
    const pairs = pairingMap(sup, essayId);
    return essay.facts.every(fact => !!pairs[String(fact.id)]);
  }
  function essayAnsweredCount(sup) { return (sup.essayOrder || []).filter(id => essayIsAnswered(sup, id)).length; }
  function essayPairingCount(sup, essayId) {
    const essay = eMap.get(String(essayId));
    if (!essay?.facts?.length) return 0;
    const pairs = pairingMap(sup, essayId);
    return essay.facts.filter(fact => !!pairs[String(fact.id)]).length;
  }
  function essayNameText(fact) { return fact?.tokens?.[0]?.[1] || fact?.label || ''; }
  function essayPositionText(fact) { return fact?.tokens?.[1]?.[1] || ''; }

  function pairingChoices(essay, factIndex) {
    const facts = essay?.facts || [];
    const current = facts[factIndex];
    if (!current) return [];
    const choices = [current];
    for (let offset = 1; offset < facts.length && choices.length < Math.min(4, facts.length); offset += 1) {
      const candidate = facts[(factIndex + offset) % facts.length];
      if (!choices.some(item => String(item.id) === String(candidate.id))) choices.push(candidate);
    }
    return choices.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  function questionStatus(test, sup, id) {
    const item = test.items?.[id] || test.items?.[String(id)] || {};
    return { answered: !!item.answered, flagged: sup.flags.includes(Number(id)) };
  }

  function copyIntro() {
    const intro = el('testIntroDialog');
    if (!intro) return;
    const introCopy = intro.querySelector('.modal-head p');
    const calloutCopy = intro.querySelector('.callout p');
    if (introCopy) introCopy.textContent = `All ${Q.length} questions plus ${E.length} essay${E.length === 1 ? '' : 's'}, with one 3-hour countdown.`;
    if (calloutCopy) calloutCopy.textContent = 'Questions and essay pairings can be skipped, revisited, edited, and marked for follow-up. Correctness is hidden until the test is submitted.';
    if (el('startTestBtn')) el('startTestBtn').textContent = 'Start 3-hour test';
    ensureIntroHistoryButton();
  }

  function bridgeNativeStart() {
    window.setTimeout(() => {
      const state = read();
      const test = state?.activeTest;
      if (!test?.id) return;
      test.endTime = coreDeadline(test);
      write(state);
      saveSup(baseSup(test));
      localStorage.removeItem(LEGACY_SUP);
      window.location.reload();
    }, 0);
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
      if (flags.has(id)) flags.delete(id); else flags.add(id);
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
      nav.innerHTML = '<button type="button" id="testQuestionsPhaseBtn" class="test-section-btn">Questions</button><button type="button" id="testEssaysPhaseBtn" class="test-section-btn">Essays</button>';
      wrap.querySelector('.test-progress-row')?.insertAdjacentElement('afterend', nav);
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
    const wrap = el('testProgressWrap');
    const qDone = questionAnswered(attempt.test);
    const qTotal = attempt.test.order.length || 0;
    const eDone = essayAnsweredCount(attempt.sup);
    const eTotal = attempt.sup.essayOrder.length || 0;
    wrap?.style.setProperty('--test-question-progress', `${qTotal ? (qDone / qTotal) * 100 : 0}%`);
    wrap?.style.setProperty('--test-essay-progress', `${eTotal ? (eDone / eTotal) * 100 : 0}%`);
    if (el('testQuestionProgressText')) el('testQuestionProgressText').textContent = `${qDone}/${qTotal} answered`;
    if (el('testEssayProgressText')) el('testEssayProgressText').textContent = `${eDone}/${eTotal} answered`;
    if (attempt.sup.phase === 'essays') {
      const essay = currentEssay(attempt);
      const factIndex = essay ? currentEssayFactIndex(attempt, essay) : 0;
      if (el('testQuestionCount')) el('testQuestionCount').textContent = `Essay ${attempt.sup.essayIndex + 1}/${Math.max(1, eTotal)} · Pairing ${factIndex + 1}`;
      if (el('testAnsweredCount')) el('testAnsweredCount').textContent = `${eDone}/${eTotal} essays complete`;
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

  function neutralizeQuestionFeedback(attempt) {
    const id = currentId(attempt.test);
    const current = questionStatus(attempt.test, attempt.sup, id);
    const chip = el('questionStatus');
    if (chip) {
      chip.textContent = current.answered ? 'Answered' : 'Unanswered';
      chip.className = 'status-chip';
    }
    el('feedbackBox')?.classList.add('hidden');
    el('answerForm')?.querySelectorAll('.choice').forEach(label => label.classList.remove('correct-choice', 'wrong-choice'));
  }

  function decorateQuestions(attempt = active()) {
    if (!attempt || attempt.sup.phase !== 'questions') return;
    updateProgress(attempt);
    const id = currentId(attempt.test);
    const current = questionStatus(attempt.test, attempt.sup, id);
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
        const s = questionStatus(attempt.test, attempt.sup, number);
        option.textContent = `${s.flagged ? '★ ' : ''}${s.answered ? '✓' : '□'} Question ${number}${s.answered ? '' : ' — Not answered'}`;
      });
    }
    el('questionNumberMenu')?.querySelectorAll('[data-question-number]').forEach(button => {
      const number = Number(button.dataset.questionNumber);
      const s = questionStatus(attempt.test, attempt.sup, number);
      button.classList.toggle('test-answered', s.answered);
      button.classList.toggle('test-unanswered', !s.answered);
      button.classList.toggle('test-flagged', s.flagged);
      button.textContent = `${s.flagged ? '★ ' : ''}${number}`;
      button.setAttribute('aria-label', `Question ${number}, ${s.answered ? 'answered' : 'not answered'}${s.flagged ? ', marked for follow-up' : ''}`);
    });
    const trigger = el('questionNumberTrigger');
    if (trigger) {
      trigger.textContent = `Question ${id}${current.flagged ? ' ★' : current.answered ? ' ✓' : ''}`;
      trigger.setAttribute('aria-label', `Question ${id}, ${current.answered ? 'answered' : 'not answered'}${current.flagged ? ', marked for follow-up' : ''}. Choose another question.`);
    }
    neutralizeQuestionFeedback(attempt);
  }

  function switchPhase(phase) {
    const attempt = active();
    if (!attempt || !['questions', 'essays'].includes(phase)) return false;
    if (phase === 'essays' && !attempt.sup.essayOrder.length) return false;
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

  function currentEssay(attempt) { return eMap.get(String(attempt.sup.essayOrder[attempt.sup.essayIndex])) || null; }
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
  function isEssayFlagged(sup, essayId) { return sup.essayFlags.includes(String(essayId)); }
  function isPairingFlagged(sup, essayId, factId) { return sup.pairingFlags.includes(pairingKey(essayId, factId)); }

  function toggleEssayFlag() {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay) return;
    const flags = new Set(attempt.sup.essayFlags);
    const key = String(essay.id);
    if (flags.has(key)) flags.delete(key); else flags.add(key);
    attempt.sup.essayFlags = [...flags];
    saveSup(attempt.sup);
    renderEssay(attempt);
  }
  function togglePairingFlag() {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay) return;
    const fact = essay.facts[currentEssayFactIndex(attempt, essay)];
    if (!fact) return;
    const flags = new Set(attempt.sup.pairingFlags);
    const key = pairingKey(essay.id, fact.id);
    if (flags.has(key)) flags.delete(key); else flags.add(key);
    attempt.sup.pairingFlags = [...flags];
    saveSup(attempt.sup);
    renderEssay(attempt);
  }

  function ensureEssayControls() {
    const questionHead = document.querySelector('.essay-question-card-head');
    if (questionHead && !el('testEssayFollowUpBtn')) {
      const button = document.createElement('button');
      button.id = 'testEssayFollowUpBtn';
      button.type = 'button';
      button.className = 'test-followup-btn test-essay-followup-btn';
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3-5 3z"/></svg>';
      button.addEventListener('click', toggleEssayFlag);
      questionHead.append(button);
    }
    const matchActions = document.querySelector('.essay-match-actions');
    if (matchActions && !el('testPairingFollowUpBtn')) {
      const button = document.createElement('button');
      button.id = 'testPairingFollowUpBtn';
      button.type = 'button';
      button.className = 'test-followup-btn test-pairing-followup-btn';
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10v15l-5-3-5 3z"/></svg>';
      button.addEventListener('click', togglePairingFlag);
      matchActions.insertBefore(button, matchActions.firstChild);
    }
    const choices = el('essayChoiceList');
    if (choices && !el('testPairingNav')) {
      const nav = document.createElement('div');
      nav.id = 'testPairingNav';
      nav.className = 'test-pairing-nav';
      nav.innerHTML = '<button type="button" class="secondary" id="testPrevPairingBtn">← Pairing</button><button type="button" class="secondary" id="testNextPairingBtn">Next pairing →</button>';
      choices.insertAdjacentElement('afterend', nav);
      el('testPrevPairingBtn')?.addEventListener('click', () => movePairing(-1));
      el('testNextPairingBtn')?.addEventListener('click', () => movePairing(1));
    }
    const main = el('essayPracticeMain');
    if (main && !el('testEssayKeyboardHelp')) {
      const help = document.createElement('div');
      help.id = 'testEssayKeyboardHelp';
      help.className = 'test-keyboard-help';
      help.textContent = '←/→ Pairings · Shift+←/→ Essays · 1–4 Select · Enter Submit · F Pairing flag · Shift+F Essay flag';
      main.append(help);
    }
  }

  function populateEssayPicker(attempt) {
    const select = el('essayQuickNav');
    if (!select) return;
    select.innerHTML = '';
    attempt.sup.essayOrder.forEach((id, essayIndex) => {
      const essay = eMap.get(String(id));
      if (!essay) return;
      const group = document.createElement('optgroup');
      const essayFlag = isEssayFlagged(attempt.sup, id);
      group.label = `${essayFlag ? '★ ' : ''}Essay ${essayIndex + 1}: ${essay.title || 'Essay'}`;
      const overview = document.createElement('option');
      overview.value = `essay:${id}`;
      overview.textContent = `${essayFlag ? '★ ' : ''}${essayIsAnswered(attempt.sup, id) ? '✓' : '□'} Essay overview`;
      group.append(overview);
      (essay.facts || []).forEach((fact, factIndex) => {
        const submitted = !!pairingMap(attempt.sup, id)[String(fact.id)];
        const flagged = isPairingFlagged(attempt.sup, id, fact.id);
        const option = document.createElement('option');
        option.value = `pair:${id}:${fact.id}`;
        option.textContent = `${flagged ? '★ ' : ''}${submitted ? '✓' : '□'} Pairing ${factIndex + 1}: ${essayNameText(fact)}`;
        group.append(option);
      });
      select.append(group);
    });
    const essay = currentEssay(attempt);
    const fact = essay?.facts?.[currentEssayFactIndex(attempt, essay)];
    if (essay && fact) select.value = `pair:${essay.id}:${fact.id}`;
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
      empty.textContent = 'Submitted pairings will appear here. Tap any pairing later to edit it.';
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
      const flagged = isPairingFlagged(attempt.sup, essay.id, fact.id);
      row.innerHTML = `<span class="test-pairing-edit-icon" aria-hidden="true">✎</span><div class="essay-built-copy"><strong>${flagged ? '★ ' : ''}${escapeHtml(essayNameText(fact))}</strong><span>${escapeHtml(essayPositionText(selectedFact))}</span></div><span class="test-pairing-edit-label">Edit</span>`;
      row.setAttribute('aria-label', `Edit pairing for ${essayNameText(fact)}${flagged ? ', marked for follow-up' : ''}`);
      row.addEventListener('click', () => editSubmittedPairing(fact.id));
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
    ensureEssayControls();
    updateProgress(attempt);
    const essay = currentEssay(attempt);
    if (!essay?.facts?.length) return;
    const essayId = String(essay.id);
    const factIndex = currentEssayFactIndex(attempt, essay);
    const fact = essay.facts[factIndex];
    const pairs = pairingMap(attempt.sup, essayId);
    const drafts = draftMap(attempt.sup, essayId);
    const submittedId = pairs[String(fact.id)] || '';
    const draftId = drafts[String(fact.id)] || submittedId || '';
    populateEssayPicker(attempt);
    renderEssayTags(essay);
    if (el('essayPracticeCounter')) el('essayPracticeCounter').textContent = `Pairing ${factIndex + 1} of ${essay.facts.length}`;
    if (el('essayMasterySummary')) el('essayMasterySummary').textContent = `${essayPairingCount(attempt.sup, essayId)}/${essay.facts.length} submitted`;
    if (el('essayPracticeTitle')) el('essayPracticeTitle').textContent = essay.title || 'Essay';
    if (el('essayPracticePrompt')) el('essayPracticePrompt').textContent = essay.prompt || '';
    el('essayNoteLinks')?.classList.add('hidden');
    el('essayQuestionAudio')?.classList.add('hidden');
    el('essayPromptReportBtn')?.classList.add('hidden');
    if (el('essayBuildProgress')) el('essayBuildProgress').textContent = `${essayPairingCount(attempt.sup, essayId)} of ${essay.facts.length} submitted`;
    renderSubmittedPairings(attempt, essay);
    if (el('essayMatchCount')) el('essayMatchCount').textContent = `${factIndex + 1} of ${essay.facts.length}`;
    if (el('essayMatchContext')) el('essayMatchContext').textContent = fact.label || 'Match the position';
    if (el('essayMatchName')) el('essayMatchName').textContent = essayNameText(fact);
    const eyebrow = document.querySelector('.essay-match-head .eyebrow');
    if (eyebrow) eyebrow.textContent = submittedId ? 'Edit pairing' : 'Pairing';
    el('essayPairingReportBtn')?.classList.add('hidden');
    if (el('essayPairingResources')) {
      el('essayPairingResources').innerHTML = '';
      el('essayPairingResources').classList.add('hidden');
    }
    const essayFlag = el('testEssayFollowUpBtn');
    if (essayFlag) {
      const flagged = isEssayFlagged(attempt.sup, essayId);
      essayFlag.classList.toggle('active', flagged);
      essayFlag.setAttribute('aria-pressed', flagged ? 'true' : 'false');
      essayFlag.setAttribute('aria-label', flagged ? 'Remove essay follow-up marker' : 'Mark essay for follow-up');
      essayFlag.title = flagged ? 'Remove essay follow-up marker' : 'Mark essay for follow-up';
    }
    const pairFlag = el('testPairingFollowUpBtn');
    if (pairFlag) {
      const flagged = isPairingFlagged(attempt.sup, essayId, fact.id);
      pairFlag.classList.toggle('active', flagged);
      pairFlag.setAttribute('aria-pressed', flagged ? 'true' : 'false');
      pairFlag.setAttribute('aria-label', flagged ? 'Remove pairing follow-up marker' : 'Mark pairing for follow-up');
      pairFlag.title = flagged ? 'Remove pairing follow-up marker' : 'Mark pairing for follow-up';
    }
    const choices = el('essayChoiceList');
    if (choices) {
      choices.innerHTML = '';
      pairingChoices(essay, factIndex).forEach((optionFact, optionIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'essay-choice test-essay-choice';
        button.dataset.testEssayChoice = String(optionFact.id);
        button.innerHTML = `<span class="test-choice-number" aria-hidden="true">${optionIndex + 1}</span><span class="test-choice-copy">${escapeHtml(essayPositionText(optionFact))}</span>`;
        const submitted = String(optionFact.id) === String(submittedId);
        const draft = String(optionFact.id) === String(draftId);
        button.classList.toggle('test-selected', submitted);
        button.classList.toggle('test-keyboard-selected', draft && !submitted);
        button.setAttribute('aria-pressed', draft ? 'true' : 'false');
        button.addEventListener('click', event => {
          event.preventDefault();
          submitEssayPairing(optionFact.id);
        });
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
    const previousPair = el('testPrevPairingBtn');
    const nextPair = el('testNextPairingBtn');
    if (previousPair) previousPair.disabled = factIndex === 0;
    if (nextPair) nextPair.disabled = factIndex >= essay.facts.length - 1;
    const previousEssay = el('essayTryAgainBtn');
    if (previousEssay) {
      previousEssay.hidden = false;
      previousEssay.textContent = '← Previous essay';
      previousEssay.disabled = attempt.sup.essayIndex === 0;
    }
    const nextEssay = el('essayNextBtn');
    if (nextEssay) {
      nextEssay.hidden = false;
      if (attempt.sup.essayIndex < attempt.sup.essayOrder.length - 1) nextEssay.textContent = 'Next essay →';
      else if (allQuestionsAnswered(attempt.test)) nextEssay.textContent = 'Finish test';
      else nextEssay.textContent = 'Questions →';
    }
  }

  function setEssayFact(attempt, essay, factIndex, { scroll = false } = {}) {
    const bounded = Math.min(Math.max(0, Number(factIndex) || 0), Math.max(0, essay.facts.length - 1));
    attempt.sup.essayFactIndex[String(essay.id)] = bounded;
    saveSup(attempt.sup);
    renderEssay(attempt);
    if (scroll) el('essayMatchSection')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function selectEssayChoice(choiceId) {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay) return false;
    const factIndex = currentEssayFactIndex(attempt, essay);
    const fact = essay.facts[factIndex];
    if (!fact || !essay.facts.some(item => String(item.id) === String(choiceId))) return false;
    draftMap(attempt.sup, essay.id)[String(fact.id)] = String(choiceId);
    saveSup(attempt.sup);
    renderEssay(attempt);
    return true;
  }
  function submitEssayPairing(choiceId = null) {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay?.facts?.length) return;
    const factIndex = currentEssayFactIndex(attempt, essay);
    const fact = essay.facts[factIndex];
    const drafts = draftMap(attempt.sup, essay.id);
    const selected = String(choiceId || drafts[String(fact.id)] || '');
    if (!fact || !essay.facts.some(item => String(item.id) === selected)) return;
    pairingMap(attempt.sup, essay.id)[String(fact.id)] = selected;
    delete drafts[String(fact.id)];
    attempt.sup.essayFactIndex[String(essay.id)] = nextUnansweredFactIndex(attempt, essay, factIndex);
    saveSup(attempt.sup);
    renderEssay(attempt);
  }
  function editSubmittedPairing(factId) {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay) return;
    const index = essay.facts.findIndex(fact => String(fact.id) === String(factId));
    if (index < 0) return;
    setEssayFact(attempt, essay, index, { scroll: true });
  }
  function jumpEssayTarget(value) {
    const attempt = active();
    if (!attempt || !attempt.sup.essayOrder.length) return;
    const [kind, essayId, factId] = String(value || '').split(':');
    const index = attempt.sup.essayOrder.findIndex(id => String(id) === String(essayId));
    if (index < 0) return;
    attempt.sup.phase = 'essays';
    attempt.sup.essayIndex = index;
    const essay = currentEssay(attempt);
    if (!essay) return;
    if (kind === 'pair' && factId) {
      const factIndex = essay.facts.findIndex(fact => String(fact.id) === String(factId));
      attempt.sup.essayFactIndex[String(essay.id)] = factIndex >= 0 ? factIndex : 0;
    } else {
      attempt.sup.essayFactIndex[String(essay.id)] = essayIsAnswered(attempt.sup, essay.id)
        ? Math.min(Math.max(0, Number(attempt.sup.essayFactIndex[String(essay.id)]) || 0), essay.facts.length - 1)
        : nextUnansweredFactIndex(attempt, essay, -1);
    }
    saveSup(attempt.sup);
    renderEssay(attempt);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function movePairing(delta) {
    const attempt = active();
    const essay = attempt && currentEssay(attempt);
    if (!attempt || attempt.sup.phase !== 'essays' || !essay) return;
    const current = currentEssayFactIndex(attempt, essay);
    const next = Math.min(Math.max(0, current + Number(delta || 0)), essay.facts.length - 1);
    if (next === current) return;
    setEssayFact(attempt, essay, next);
  }
  function moveEssay(delta) {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    const next = Math.min(Math.max(0, attempt.sup.essayIndex + Number(delta || 0)), attempt.sup.essayOrder.length - 1);
    if (next === attempt.sup.essayIndex) return;
    jumpEssayTarget(`essay:${attempt.sup.essayOrder[next]}`);
  }

  function requestFinish() {
    const attempt = active();
    if (!attempt) return;
    const unansweredQuestions = attempt.test.order.length - questionAnswered(attempt.test);
    const incompleteEssays = attempt.sup.essayOrder.length - essayAnsweredCount(attempt.sup);
    if (unansweredQuestions || incompleteEssays) {
      const parts = [];
      if (unansweredQuestions) parts.push(`${unansweredQuestions} unanswered question${unansweredQuestions === 1 ? '' : 's'}`);
      if (incompleteEssays) parts.push(`${incompleteEssays} incomplete essay${incompleteEssays === 1 ? '' : 's'}`);
      if (!confirm(`Finish and submit the practice test with ${parts.join(' and ')}?`)) return;
    } else if (!confirm('Finish and submit this practice test? You will then see the grading feedback.')) return;
    finish('completed');
  }
  function requestExit() {
    const attempt = active();
    if (!attempt) return;
    if (allQuestionsAnswered(attempt.test)) { requestFinish(); return; }
    const questions = questionAnswered(attempt.test);
    const essays = essayAnsweredCount(attempt.sup);
    if (confirm(`Exit the practice test now? ${questions}/${attempt.test.order.length} questions and ${essays}/${attempt.sup.essayOrder.length} essays are complete. This attempt will be saved as incomplete.`)) finish('exited');
  }

  function resultFor(test, sup, reason) {
    const perCategory = {};
    [...new Set(Q.map(q => q.category))].forEach(category => {
      perCategory[category] = { total: 0, correct: 0, partial: 0, incorrect: 0, unanswered: 0, points: 0, timeMs: 0, answered: 0 };
    });
    let correct = 0, partial = 0, incorrect = 0, unanswered = 0, points = 0, answeredTime = 0, answeredCount = 0;
    test.order.forEach(id => {
      const question = qMap.get(Number(id));
      if (!question) return;
      const item = test.items?.[id] || {};
      const category = perCategory[question.category];
      category.total += 1;
      if (!item.answered) { unanswered += 1; category.unanswered += 1; return; }
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
    let essayPairCorrect = 0, essayPairTotal = 0;
    const essays = sup.essayOrder.map(id => {
      const essay = eMap.get(String(id));
      const pairs = pairingMap(sup, id);
      const pairings = (essay?.facts || []).map(fact => {
        const selectedId = pairs[String(fact.id)] || null;
        const selectedFact = selectedId ? essay.facts.find(item => String(item.id) === String(selectedId)) : null;
        const correctPair = !!selectedId && String(selectedId) === String(fact.id);
        essayPairTotal += 1;
        if (correctPair) essayPairCorrect += 1;
        return { factId: String(fact.id), name: essayNameText(fact), selectedId: selectedId ? String(selectedId) : null, selectedText: selectedFact ? essayPositionText(selectedFact) : '', correct: correctPair, correctText: essayPositionText(fact), flagged: isPairingFlagged(sup, id, fact.id) };
      });
      return { essayId: String(id), title: essay?.title || 'Essay', prompt: essay?.prompt || '', modelAnswer: essay?.modelAnswer || '', answered: pairings.length > 0 && pairings.every(item => !!item.selectedId), correctCount: pairings.filter(item => item.correct).length, total: pairings.length, flagged: isEssayFlagged(sup, id), pairings };
    });
    const date = Date.now();
    return {
      summary: {
        id: String(test.id), date, reason, completed: reason === 'completed',
        scorePct: test.order.length ? points / test.order.length * 100 : 0,
        points, correct, partial, incorrect, unanswered, answeredCount,
        avgAnswerTimeMs: answeredCount ? answeredTime / answeredCount : 0,
        totalTimeMs: Math.min(DURATION, Math.max(0, date - (Number(test.startedAt) || date))),
        perCategory,
        essayTotal: essays.length, essayAnswered: essays.filter(item => item.answered).length, essayUnanswered: essays.filter(item => !item.answered).length,
        essayPairCorrect, essayPairTotal, essayScorePct: essayPairTotal ? essayPairCorrect / essayPairTotal * 100 : 0,
        followUpQuestionIds: [...sup.flags], followUpEssayIds: [...sup.essayFlags], followUpPairingIds: [...sup.pairingFlags],
        testFormat: 'questions-plus-essay-pairings-v4'
      },
      essays
    };
  }

  function buildReviewPayload(test, sup, built) {
    const questions = Q.slice().sort((a, b) => Number(a.id) - Number(b.id)).map(question => {
      const item = test.items?.[question.id] || test.items?.[String(question.id)] || {};
      return { questionId: Number(question.id), answered: !!item.answered, selected: Array.isArray(item.selected) ? [...item.selected] : [], result: item.result || null, credit: Number(item.credit) || 0, elapsedMs: Number(item.elapsedMs) || 0, flagged: sup.flags.includes(Number(question.id)) };
    });
    return { id: built.summary.id, date: built.summary.date, reason: built.summary.reason, summary: built.summary, questions, essays: built.essays };
  }
  function saveReview(payload) {
    const history = readReviews();
    history[String(payload.id)] = payload;
    const rows = Object.entries(history).sort((a, b) => Number(b[1]?.date || 0) - Number(a[1]?.date || 0)).slice(0, 30);
    saveReviews(Object.fromEntries(rows));
  }
  function saveEssayResults(id, essays) {
    const history = json(localStorage.getItem(ESSAY_RESULT), {}) || {};
    history[String(id)] = { savedAt: Date.now(), essays };
    const rows = Object.entries(history).sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0)).slice(0, 30);
    localStorage.setItem(ESSAY_RESULT, JSON.stringify(Object.fromEntries(rows)));
  }
  function queueSync(test) {
    const config = json(localStorage.getItem(SYNC), null);
    if (!config?.enabled || !config?.deviceToken) return;
    const queue = json(localStorage.getItem(SYNCQ), []) || [];
    queue.push({ opId: uid(), zman: analyticsZman, generation: Math.max(0, Number(config.generations?.[analyticsZman]) || 0), kind: 'test_complete', payload: { test }, clientTs: new Date().toISOString() });
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
    saveReview(buildReviewPayload(test, sup, built));
    state.tests = Array.isArray(state.tests) ? state.tests : [];
    if (!state.tests.some(item => String(item?.id) === result.id)) state.tests.push(result);
    state.tests = state.tests.slice(-30);
    state.activeTest = null;
    write(state);
    queueSync(result);
    localStorage.setItem(PENDING, JSON.stringify({ id: result.id }));
    localStorage.removeItem(LEGACY_PENDING);
    localStorage.removeItem(SUP);
    localStorage.removeItem(LEGACY_SUP);
    window.location.reload();
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
    if (timer) timer.dataset.testTime = formatDuration(remaining);
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
    const timer = el('mainTimer');
    if (timer) delete timer.dataset.testTime;
  }
  function scheduleQuestionAdvance() {
    const before = active();
    if (!before || before.sup.phase !== 'questions') return;
    const beforeId = currentId(before.test);
    window.setTimeout(() => {
      const attempt = active();
      if (!attempt || attempt.sup.phase !== 'questions') return;
      const item = attempt.test.items?.[beforeId] || attempt.test.items?.[String(beforeId)];
      if (!item?.answered || currentId(attempt.test) !== beforeId) return;
      if (allQuestionsAnswered(attempt.test)) {
        if (attempt.sup.essayOrder.length) switchPhase('essays'); else requestFinish();
        return;
      }
      const index = Number(attempt.test.index) || 0;
      if (index < attempt.test.order.length - 1) el('nextBtn')?.click();
      else {
        const nextIndex = attempt.test.order.findIndex(id => !(attempt.test.items?.[id]?.answered));
        if (nextIndex >= 0) {
          attempt.test.index = nextIndex;
          write(attempt.state);
          window.location.reload();
        }
      }
    }, 90);
  }

  function reviewResultSymbol(item) {
    if (!item?.answered && !item?.selectedId) return '□';
    if (item.result === 'correct' || item.correct === true) return '✓';
    if (item.result === 'partial') return '◐';
    return '✕';
  }
  function ensureReviewDialog() {
    let dialog = el('testReviewDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'testReviewDialog';
    dialog.className = 'modal wide test-review-dialog';
    dialog.innerHTML = `<div class="modal-inner test-review-shell"><div class="modal-head"><div><span class="eyebrow">Practice test review</span><h2 id="testReviewTitle">Review test</h2><p id="testReviewSubtitle"></p></div><button class="close-btn" type="button" id="closeTestReview" aria-label="Close">×</button></div><div class="test-review-section-nav" role="group" aria-label="Review section"><button type="button" id="reviewQuestionsBtn" class="test-section-btn active">Questions</button><button type="button" id="reviewEssaysBtn" class="test-section-btn">Essays</button></div><select id="testReviewPicker" class="essay-quick-nav" aria-label="Jump to review item"></select><div id="testReviewBody" class="test-review-body"></div><div class="modal-footer split"><button class="secondary" type="button" id="testReviewPrev">← Previous</button><div class="essay-footer-right"><button class="secondary" type="button" id="openTestHistoryFromReview">All tests</button><button class="primary" type="button" id="testReviewNext">Next →</button></div></div></div>`;
    document.body.append(dialog);
    el('closeTestReview')?.addEventListener('click', () => dialog.close());
    el('reviewQuestionsBtn')?.addEventListener('click', () => { if (reviewState) { reviewState.section = 'questions'; reviewState.index = 0; renderReview(); } });
    el('reviewEssaysBtn')?.addEventListener('click', () => { if (reviewState) { reviewState.section = 'essays'; reviewState.index = 0; renderReview(); } });
    el('testReviewPrev')?.addEventListener('click', () => moveReview(-1));
    el('testReviewNext')?.addEventListener('click', () => moveReview(1));
    el('openTestHistoryFromReview')?.addEventListener('click', () => { dialog.close(); openHistoryDialog(); });
    el('testReviewPicker')?.addEventListener('change', event => { if (reviewState) { reviewState.index = Math.max(0, Number(event.currentTarget.value) || 0); renderReview(); } });
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target?.closest?.('input,textarea,select,button,a')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveReview(event.key === 'ArrowLeft' ? -1 : 1); }
    });
    return dialog;
  }
  function reviewEssayItems(review) {
    const items = [];
    (review.essays || []).forEach((essay, essayIndex) => (essay.pairings || []).forEach((pairing, pairingIndex) => items.push({ essay, essayIndex, pairing, pairingIndex })));
    return items;
  }
  function renderReview() {
    const dialog = ensureReviewDialog();
    const review = reviewState?.review;
    if (!review) return;
    const questions = review.questions || [];
    const essays = reviewEssayItems(review);
    const items = reviewState.section === 'questions' ? questions : essays;
    reviewState.index = Math.min(Math.max(0, reviewState.index), Math.max(0, items.length - 1));
    const current = items[reviewState.index];
    if (el('testReviewTitle')) el('testReviewTitle').textContent = `Review ${new Date(review.date).toLocaleDateString()}`;
    if (el('testReviewSubtitle')) el('testReviewSubtitle').textContent = `${Number(review.summary?.scorePct || 0).toFixed(1)}% M/C · ${Number(review.summary?.essayScorePct || 0).toFixed(1)}% essay pairings`;
    el('reviewQuestionsBtn')?.classList.toggle('active', reviewState.section === 'questions');
    el('reviewEssaysBtn')?.classList.toggle('active', reviewState.section === 'essays');
    const picker = el('testReviewPicker');
    if (picker) {
      picker.innerHTML = '';
      items.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = reviewState.section === 'questions'
          ? `${item.flagged ? '★ ' : ''}${reviewResultSymbol(item)} Question ${item.questionId}`
          : `${item.pairing.flagged || item.essay.flagged ? '★ ' : ''}${reviewResultSymbol(item.pairing)} Essay ${item.essayIndex + 1} · Pairing ${item.pairingIndex + 1}`;
        picker.append(option);
      });
      picker.value = String(reviewState.index);
    }
    const body = el('testReviewBody');
    if (!body) return;
    if (!current) {
      body.innerHTML = '<p class="small-muted">No review items are available for this section.</p>';
    } else if (reviewState.section === 'questions') {
      const q = qMap.get(Number(current.questionId));
      const correct = new Set(q?.answer || []);
      const selected = new Set(current.selected || []);
      body.innerHTML = `<div class="test-review-status ${escapeHtml(current.result || 'unanswered')}">${current.flagged ? '★ Follow-up · ' : ''}${current.answered ? escapeHtml((current.result || 'answered').replace(/^./, c => c.toUpperCase())) : 'Not answered'}</div><h3>Question ${current.questionId}</h3><p class="test-review-prompt">${escapeHtml(q?.prompt || 'Question content is no longer available for this Zman.')}</p><div class="test-review-choices">${(q?.choices || []).map((choice, index) => { const letter = String.fromCharCode(65 + index); const classes = ['test-review-choice']; if (correct.has(letter)) classes.push('correct'); if (selected.has(letter)) classes.push('selected'); if (selected.has(letter) && !correct.has(letter)) classes.push('wrong'); return `<div class="${classes.join(' ')}"><strong>${letter}</strong><span>${escapeHtml(choice)}</span>${selected.has(letter) ? '<small>Your answer</small>' : ''}${correct.has(letter) ? '<small>Correct</small>' : ''}</div>`; }).join('')}</div>${q?.explanation ? `<div class="test-review-explanation"><strong>Explanation</strong><p>${escapeHtml(q.explanation)}</p></div>` : ''}`;
    } else {
      const { essay, essayIndex, pairing, pairingIndex } = current;
      const status = pairing.selectedId ? (pairing.correct ? 'Correct' : 'Incorrect') : 'Not answered';
      body.innerHTML = `<div class="test-review-status ${pairing.correct ? 'correct' : pairing.selectedId ? 'incorrect' : 'unanswered'}">${pairing.flagged || essay.flagged ? '★ Follow-up · ' : ''}${status}</div><h3>Essay ${essayIndex + 1}: ${escapeHtml(essay.title)}</h3><p class="test-review-prompt">${escapeHtml(essay.prompt)}</p><div class="test-review-pairing-card"><span class="eyebrow">Pairing ${pairingIndex + 1}</span><strong>${escapeHtml(pairing.name)}</strong><div><small>Your pairing</small><p>${pairing.selectedId ? escapeHtml(pairing.selectedText) : 'No pairing submitted.'}</p></div><div><small>Correct pairing</small><p>${escapeHtml(pairing.correctText)}</p></div></div><div class="test-review-buildout"><strong>Essay buildout</strong>${(essay.pairings || []).map((p, i) => `<div class="test-result-pairing ${p.correct ? 'correct' : p.selectedId ? 'incorrect' : 'unanswered'}"><span>${p.flagged ? '★ ' : ''}${i + 1}. ${escapeHtml(p.name)}</span><small>${p.selectedId ? escapeHtml(p.selectedText) : 'Not answered'}</small></div>`).join('')}</div>${essay.modelAnswer ? `<details class="test-review-model"><summary>Show model answer</summary><p>${escapeHtml(essay.modelAnswer)}</p></details>` : ''}`;
    }
    if (el('testReviewPrev')) el('testReviewPrev').disabled = reviewState.index <= 0;
    if (el('testReviewNext')) el('testReviewNext').disabled = reviewState.index >= items.length - 1;
    if (!dialog.open) dialog.showModal();
  }
  function moveReview(delta) {
    if (!reviewState) return;
    const count = reviewState.section === 'questions' ? (reviewState.review.questions || []).length : reviewEssayItems(reviewState.review).length;
    const next = Math.min(Math.max(0, reviewState.index + Number(delta || 0)), Math.max(0, count - 1));
    if (next !== reviewState.index) { reviewState.index = next; renderReview(); }
  }
  function openReview(id, section = 'questions') {
    const review = readReviews()[String(id)];
    if (!review) {
      const summary = (read()?.tests || []).find(item => String(item?.id) === String(id));
      if (summary) showSummaryOnly(summary);
      return;
    }
    reviewState = { review, section: section === 'essays' ? 'essays' : 'questions', index: 0 };
    renderReview();
  }

  function ensureHistoryDialog() {
    let dialog = el('testHistoryDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'testHistoryDialog';
    dialog.className = 'modal wide test-history-dialog';
    dialog.innerHTML = '<div class="modal-inner"><div class="modal-head"><div><span class="eyebrow">Practice tests</span><h2>Previous tests</h2><p>Review saved attempts from this device.</p></div><button class="close-btn" type="button" id="closeTestHistory" aria-label="Close">×</button></div><div id="testHistoryList" class="test-history-list"></div><div class="modal-footer"><button class="primary" type="button" id="doneTestHistory">Done</button></div></div>';
    document.body.append(dialog);
    el('closeTestHistory')?.addEventListener('click', () => dialog.close());
    el('doneTestHistory')?.addEventListener('click', () => dialog.close());
    return dialog;
  }
  function testHistoryRows() {
    const summaries = [...(read()?.tests || [])].sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
    const reviews = readReviews();
    return summaries.map(summary => ({ summary, review: reviews[String(summary.id)] || null }));
  }
  function openHistoryDialog() {
    const dialog = ensureHistoryDialog();
    const list = el('testHistoryList');
    const rows = testHistoryRows();
    if (list) {
      list.innerHTML = rows.length ? '' : '<p class="small-muted">No saved practice tests yet.</p>';
      rows.forEach(({ summary, review }) => {
        const row = document.createElement('div');
        row.className = 'test-history-row';
        row.innerHTML = `<div><strong>${escapeHtml(new Date(summary.date).toLocaleString())}</strong><span>${summary.completed ? 'Completed' : summary.reason === 'time' ? 'Time expired' : 'Exited early'} · ${Number(summary.scorePct || 0).toFixed(1)}% M/C${Number.isFinite(Number(summary.essayScorePct)) ? ` · ${Number(summary.essayScorePct || 0).toFixed(1)}% essays` : ''}</span></div><button type="button" class="secondary">${review ? 'Review' : 'Summary'}</button>`;
        row.querySelector('button')?.addEventListener('click', () => { dialog.close(); if (review) openReview(summary.id); else showSummaryOnly(summary); });
        list.append(row);
      });
    }
    if (!dialog.open) dialog.showModal();
  }
  function showSummaryOnly(summary) {
    const dialog = el('testResultDialog');
    const content = el('testResultContent');
    if (!dialog || !content) return;
    if (el('testResultSubtitle')) el('testResultSubtitle').textContent = new Date(summary.date).toLocaleString();
    content.innerHTML = `<div class="stat-grid test-combined-stats"><div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(summary.scorePct || 0).toFixed(1)}%</div></div><div class="stat-card"><div class="label">Correct</div><div class="value">${summary.correct || 0}</div></div><div class="stat-card"><div class="label">Incorrect</div><div class="value">${summary.incorrect || 0}</div></div><div class="stat-card"><div class="label">Unanswered</div><div class="value">${summary.unanswered || 0}</div></div></div><p class="small-muted">Detailed item-by-item review was not saved for this older attempt.</p>`;
    dialog.showModal();
  }
  function showResult() {
    const pending = json(localStorage.getItem(PENDING), null) || json(localStorage.getItem(LEGACY_PENDING), null);
    if (!pending?.id) return;
    const result = (read()?.tests || []).find(item => String(item?.id) === String(pending.id));
    const dialog = el('testResultDialog');
    const content = el('testResultContent');
    if (!result || !dialog || !content) return;
    if (el('testResultSubtitle')) el('testResultSubtitle').textContent = result.completed ? `Completed ${new Date(result.date).toLocaleString()}` : result.reason === 'time' ? `Time expired — ${new Date(result.date).toLocaleString()}` : `Exited early — ${new Date(result.date).toLocaleString()}`;
    const hasReview = !!readReviews()[String(result.id)];
    content.innerHTML = `<div class="stat-grid test-combined-stats"><div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(result.scorePct || 0).toFixed(1)}%</div></div><div class="stat-card"><div class="label">Correct</div><div class="value">${result.correct || 0}</div></div><div class="stat-card"><div class="label">Incorrect</div><div class="value">${result.incorrect || 0}</div></div><div class="stat-card"><div class="label">Essay pairings</div><div class="value">${result.essayPairCorrect || 0}/${result.essayPairTotal || 0}</div></div></div>${hasReview ? '<button type="button" class="primary test-review-now-btn" id="reviewJustFinishedTest">Review answers</button>' : ''}`;
    el('reviewJustFinishedTest')?.addEventListener('click', () => { dialog.close(); openReview(result.id); });
    localStorage.removeItem(PENDING);
    localStorage.removeItem(LEGACY_PENDING);
    dialog.showModal();
  }
  function ensureIntroHistoryButton() {
    const intro = el('testIntroDialog');
    if (!intro || el('reviewPreviousTestsBtn') || !testHistoryRows().length) return;
    const footer = intro.querySelector('.modal-footer');
    if (!footer) return;
    const button = document.createElement('button');
    button.id = 'reviewPreviousTestsBtn';
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = 'Review previous tests';
    button.addEventListener('click', () => { intro.close(); openHistoryDialog(); });
    footer.insertBefore(button, footer.firstChild);
  }
  function decorateStatsHistory() {
    const host = el('statsContent');
    if (!host || host.querySelector('[data-test-history-panel]')) return;
    if (!testHistoryRows().length) return;
    const section = document.createElement('section');
    section.className = 'stat-section test-history-stats-panel';
    section.dataset.testHistoryPanel = '1';
    section.innerHTML = '<div class="test-history-stats-head"><div><span class="eyebrow">Practice tests</span><h3>Previous tests</h3><p class="small-muted">Review answer-by-answer results from saved attempts.</p></div><button type="button" class="secondary">Review tests</button></div>';
    section.querySelector('button')?.addEventListener('click', openHistoryDialog);
    host.append(section);
  }

  function sync() {
    const attempt = active();
    if (!attempt) { cleanupInactive(); return; }
    syncExactTimer(attempt);
    if (finishing) return;
    updateProgress(attempt);
    if (attempt.sup.phase === 'essays') renderEssay(attempt); else showQuestionSurface(attempt);
  }

  el('startTestBtn')?.addEventListener('click', bridgeNativeStart);
  el('submitBtn')?.addEventListener('click', scheduleQuestionAdvance);
  el('nextBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (attempt?.sup.phase === 'questions' && allQuestionsAnswered(attempt.test)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (attempt.sup.essayOrder.length) switchPhase('essays'); else requestFinish();
    }
  }, true);
  el('exitTestBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (!attempt) return;
    event.preventDefault(); event.stopImmediatePropagation(); requestExit();
  }, true);
  el('essayQuickNav')?.addEventListener('change', event => {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    event.preventDefault(); event.stopImmediatePropagation(); jumpEssayTarget(event.currentTarget.value);
  }, true);
  el('essayTryAgainBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    event.preventDefault(); event.stopImmediatePropagation(); moveEssay(-1);
  }, true);
  el('essayNextBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (!attempt || attempt.sup.phase !== 'essays') return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (attempt.sup.essayIndex < attempt.sup.essayOrder.length - 1) moveEssay(1);
    else if (allQuestionsAnswered(attempt.test)) requestFinish();
    else switchPhase('questions');
  }, true);
  el('questionsModeBtn')?.addEventListener('click', event => {
    if (!active()) return;
    event.preventDefault(); event.stopImmediatePropagation(); switchPhase('questions');
  }, true);
  el('essayBtn')?.addEventListener('click', event => {
    if (!active()) return;
    event.preventDefault(); event.stopImmediatePropagation(); switchPhase('essays');
  }, true);

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const attempt = active();
    if (!attempt) return;
    if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open]')) return;
    if (attempt.sup.phase === 'essays') {
      if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault(); event.stopImmediatePropagation(); moveEssay(event.key === 'ArrowLeft' ? -1 : 1); return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); event.stopImmediatePropagation(); movePairing(event.key === 'ArrowLeft' ? -1 : 1); return;
      }
      if (/^[1-9]$/.test(event.key)) {
        const buttons = [...(el('essayChoiceList')?.querySelectorAll('[data-test-essay-choice]') || [])];
        const button = buttons[Number(event.key) - 1];
        if (button) { event.preventDefault(); event.stopImmediatePropagation(); selectEssayChoice(button.dataset.testEssayChoice); }
        return;
      }
      if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); submitEssayPairing(); return; }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.shiftKey) toggleEssayFlag(); else togglePairingFlag();
      }
    }
  }, true);

  el('statsBtn')?.addEventListener('click', () => window.setTimeout(decorateStatsHistory, 40));
  el('testBtn')?.addEventListener('click', () => window.setTimeout(ensureIntroHistoryButton, 40));

  copyIntro();
  followButton();
  active();
  window.setTimeout(() => {
    copyIntro();
    sync();
    showResult();
    decorateStatsHistory();
    const statsHost = el('statsContent');
    if (statsHost) new MutationObserver(() => window.setTimeout(decorateStatsHistory, 0)).observe(statsHost, { childList: true });
    window.setInterval(sync, 200);
  }, 0);
})();
