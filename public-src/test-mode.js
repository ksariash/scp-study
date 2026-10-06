(() => {
  'use strict';

  const el = id => document.getElementById(id);
  const Q = typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS) ? QUESTIONS : [];
  const E = Array.isArray(window.ESSAY_PRACTICE_DATA) ? window.ESSAY_PRACTICE_DATA : [];
  const zman = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  const zid = String(zman.id || 'default');
  const analyticsZman = String(zman.analyticsKey || zid);

  const MAIN = 'courseReviewSpacedRepetition.v1';
  const SUP = `scpStudy.testSupplement.v2:${zid}`;
  const PENDING = `scpStudy.pendingCombinedTestResult.v2:${zid}`;
  const RESP = `scpStudy.testEssayResponses.v1:${zid}`;
  const SYNC = 'scpStudy.sync.v1';
  const SYNCQ = 'scpStudy.syncQueue.v1';
  const DURATION = 3 * 60 * 60 * 1000;
  // Core app.js still owns the underlying M/C timer lifecycle. Give it a small
  // internal grace period so this controller can close the combined attempt at
  // exactly three hours without racing the legacy question-only timeout.
  const CORE_TIMER_GRACE = 3 * 1000;

  const qMap = new Map(Q.map(q => [Number(q.id), q]));
  const eMap = new Map(E.map(e => [String(e.id), e]));
  const json = (value, fallback = null) => {
    try { return JSON.parse(value); }
    catch (_) { return fallback; }
  };
  const uid = () => crypto?.randomUUID?.() || `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      v: 3,
      testId: String(test.id),
      phase: 'questions',
      flags: [],
      essayOrder: E.map(essay => String(essay.id)),
      essayIndex: 0,
      essayResponses: {}
    };
  }

  function normSup(test) {
    let sup = readSup();
    if (!sup || String(sup.testId) !== String(test.id)) sup = baseSup(test);
    sup.v = 3;
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
    sup.essayResponses = sup.essayResponses && typeof sup.essayResponses === 'object' ? sup.essayResponses : {};
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
    const description = el('categoriesDialogDescription');
    if (description && !document.body.classList.contains('essay-mode-active')) {
      description.textContent = 'Choose which categories may be selected in Question study. The practice test always uses the full question bank.';
    }

    const intro = el('testIntroDialog');
    if (!intro) return;
    const introCopy = intro.querySelector('.modal-head p');
    const calloutCopy = intro.querySelector('.callout p');
    if (introCopy) {
      introCopy.textContent = `All ${Q.length} questions plus ${E.length} essay${E.length === 1 ? '' : 's'}, with one 3-hour countdown. Multiple-choice timing and results continue to feed study scheduling.`;
    }
    if (calloutCopy) {
      calloutCopy.textContent = `Questions are locked and graded when submitted. During the test you can move between Questions and Essays at any time, jump directly to any question or essay, and return to flagged questions before finishing. The test ends when you finish, exit, or the timer reaches zero.`;
    }
    if (el('startTestBtn')) el('startTestBtn').textContent = 'Start 3-hour test';
  }

  // Let app.js create the native activeTest first, then extend that exact state
  // into the combined three-hour attempt. This avoids competing initialization
  // paths and keeps all existing question statistics/timing behavior intact.
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
      decorate(attempt);
    });
    return button;
  }

  function status(test, sup, id) {
    const item = test.items?.[id] || test.items?.[String(id)] || {};
    return { answered: !!item.answered, flagged: sup.flags.includes(Number(id)) };
  }

  const questionAnswered = test => test.order.filter(id => test.items?.[id]?.answered).length;
  const allAnswered = test => !!test.order?.length && questionAnswered(test) === test.order.length;
  const response = (sup, id) => String(sup.essayResponses?.[String(id)] || '');
  const essayAnswered = sup => sup.essayOrder.filter(id => response(sup, id).trim()).length;

  function ensurePhaseNav(attempt) {
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
      const track = wrap.querySelector('.progress-track');
      wrap.insertBefore(nav, track || null);
      el('testQuestionsPhaseBtn')?.addEventListener('click', () => switchPhase('questions'));
      el('testEssaysPhaseBtn')?.addEventListener('click', () => switchPhase('essays'));
    }

    const qDone = questionAnswered(attempt.test);
    const eDone = essayAnswered(attempt.sup);
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

  function switchPhase(phase) {
    const attempt = active();
    if (!attempt || !['questions', 'essays'].includes(phase)) return false;
    if (phase === 'essays' && !attempt.sup.essayOrder.length) return false;
    if (attempt.sup.phase === phase) return true;

    attempt.sup.phase = phase;
    saveSup(attempt.sup);
    if (phase === 'essays') {
      renderEssay(attempt);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      // Reloading when returning to Questions deliberately discards the hidden
      // question timer tick that accrued while the learner was writing essays.
      window.location.reload();
    }
    return true;
  }

  function decorate(attempt = active()) {
    if (!attempt || attempt.sup.phase !== 'questions') return;
    ensurePhaseNav(attempt);
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

    if (allAnswered(attempt.test) && attempt.sup.essayOrder.length && el('nextBtn')) {
      el('nextBtn').textContent = 'Review essays →';
    }
  }

  function essayHost() {
    const host = el('essayPracticeMain');
    if (!host) return null;
    let surface = host.querySelector('.test-essay-surface');
    if (!surface) {
      surface = document.createElement('section');
      surface.className = 'test-essay-surface';
      host.append(surface);
    }
    return surface;
  }

  function combinedCompletion(attempt) {
    const total = attempt.test.order.length + attempt.sup.essayOrder.length;
    const done = questionAnswered(attempt.test) + essayAnswered(attempt.sup);
    return { total, done, pct: total ? (done / total) * 100 : 0 };
  }

  function progress(attempt) {
    const total = attempt.sup.essayOrder.length;
    const done = essayAnswered(attempt.sup);
    if (el('testQuestionCount')) el('testQuestionCount').textContent = `Essay ${attempt.sup.essayIndex + 1}/${total}`;
    if (el('testAnsweredCount')) el('testAnsweredCount').textContent = `${done}/${total} essays answered`;
    const combined = combinedCompletion(attempt);
    if (el('testProgressFill')) el('testProgressFill').style.width = `${combined.pct}%`;
    ensurePhaseNav(attempt);
  }

  function renderEssay(attempt = active()) {
    if (!attempt || attempt.sup.phase !== 'essays') return;
    document.body.classList.add('ui-test-active', 'ui-test-essays');
    el('questionCard')?.classList.add('ui-test-section-hidden');
    el('saveNote')?.classList.add('ui-test-section-hidden');
    el('essayPracticeMain')?.classList.remove('hidden');
    followButton()?.classList.add('hidden');
    ensurePhaseNav(attempt);

    const host = essayHost();
    const ids = attempt.sup.essayOrder;
    if (!host || !ids.length) return;
    const essay = eMap.get(ids[attempt.sup.essayIndex]);
    if (!essay) return;

    const renderKey = `${attempt.test.id}:${attempt.sup.essayIndex}`;
    if (host.dataset.testEssayKey === renderKey) {
      progress(attempt);
      return;
    }
    host.dataset.testEssayKey = renderKey;
    host.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'test-essay-toolbar';
    const pickerLabel = document.createElement('label');
    pickerLabel.className = 'test-essay-picker-label';
    const pickerCaption = document.createElement('span');
    pickerCaption.textContent = 'Jump to essay';
    const picker = document.createElement('select');
    picker.className = 'test-essay-picker';
    picker.setAttribute('aria-label', 'Jump to essay');
    ids.forEach((id, index) => {
      const candidate = eMap.get(id);
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `Essay ${index + 1} · ${candidate?.title || 'Essay'}`;
      picker.append(option);
    });
    picker.value = String(attempt.sup.essayIndex);
    picker.addEventListener('change', () => jumpEssay(Number(picker.value)));
    pickerLabel.append(pickerCaption, picker);
    toolbar.append(pickerLabel);

    const header = document.createElement('header');
    header.className = 'test-essay-head';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Essay ${attempt.sup.essayIndex + 1} of ${ids.length}`;
    const title = document.createElement('h2');
    title.textContent = essay.title || 'Essay';
    const prompt = document.createElement('p');
    prompt.className = 'test-essay-prompt';
    prompt.textContent = essay.prompt || '';
    header.append(eyebrow, title, prompt);

    const label = document.createElement('label');
    label.className = 'test-essay-response-field';
    const caption = document.createElement('span');
    caption.textContent = 'Your answer';
    const textarea = document.createElement('textarea');
    textarea.rows = 12;
    textarea.maxLength = 12000;
    textarea.placeholder = 'Write your essay response here…';
    textarea.value = response(attempt.sup, essay.id);
    const count = document.createElement('small');
    count.className = 'test-essay-word-count';
    const updateCount = () => {
      const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
      count.textContent = `${words} word${words === 1 ? '' : 's'} · saved automatically`;
    };
    updateCount();
    textarea.addEventListener('input', () => {
      const current = active();
      if (!current) return;
      current.sup.essayResponses[String(essay.id)] = textarea.value;
      saveSup(current.sup);
      updateCount();
      progress(current);
    });
    label.append(caption, textarea, count);

    const nav = document.createElement('div');
    nav.className = 'test-essay-nav';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'secondary';
    previous.textContent = '← Previous essay';
    previous.disabled = attempt.sup.essayIndex === 0;
    previous.addEventListener('click', () => moveEssay(-1));
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary';
    next.textContent = attempt.sup.essayIndex === ids.length - 1 ? 'Finish test' : 'Next essay →';
    next.addEventListener('click', () => attempt.sup.essayIndex === ids.length - 1 ? requestFinish() : moveEssay(1));
    nav.append(previous, next);

    host.append(toolbar, header, label, nav);
    progress(attempt);
  }

  function jumpEssay(index) {
    const attempt = active();
    if (!attempt || !attempt.sup.essayOrder.length) return;
    attempt.sup.phase = 'essays';
    attempt.sup.essayIndex = Math.min(Math.max(0, Number(index) || 0), attempt.sup.essayOrder.length - 1);
    saveSup(attempt.sup);
    renderEssay(attempt);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function moveEssay(delta) {
    const attempt = active();
    if (!attempt) return;
    jumpEssay(attempt.sup.essayIndex + delta);
  }

  function requestFinish() {
    const attempt = active();
    if (!attempt) return;
    const unansweredQuestions = attempt.test.order.length - questionAnswered(attempt.test);
    const unansweredEssays = attempt.sup.essayOrder.length - essayAnswered(attempt.sup);
    if (unansweredQuestions || unansweredEssays) {
      const parts = [];
      if (unansweredQuestions) parts.push(`${unansweredQuestions} unanswered question${unansweredQuestions === 1 ? '' : 's'}`);
      if (unansweredEssays) parts.push(`${unansweredEssays} unanswered essay${unansweredEssays === 1 ? '' : 's'}`);
      if (!confirm(`Finish the practice test with ${parts.join(' and ')}?`)) return;
    }
    finish('completed');
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

    const essays = sup.essayOrder.map(id => {
      const essay = eMap.get(String(id));
      const text = response(sup, id);
      return {
        essayId: String(id),
        title: essay?.title || 'Essay',
        prompt: essay?.prompt || '',
        response: text,
        answered: !!text.trim()
      };
    });
    const date = Date.now();

    return {
      summary: {
        id: String(test.id),
        date,
        reason,
        completed: reason === 'completed',
        scorePct: Q.length ? points / Q.length * 100 : 0,
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
        followUpQuestionIds: [...sup.flags],
        testFormat: 'questions-plus-essays-v2'
      },
      essays
    };
  }

  function saveResponses(id, responses) {
    const history = json(localStorage.getItem(RESP), {}) || {};
    history[String(id)] = { savedAt: Date.now(), responses };
    const rows = Object.entries(history)
      .sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0))
      .slice(0, 30);
    localStorage.setItem(RESP, JSON.stringify(Object.fromEntries(rows)));
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
    saveResponses(result.id, built.essays);
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

  function exit(event) {
    const attempt = active();
    if (!attempt) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const questions = questionAnswered(attempt.test);
    const essays = essayAnswered(attempt.sup);
    if (confirm(`Exit the practice test now? ${questions}/${attempt.test.order.length} questions and ${essays}/${attempt.sup.essayOrder.length} essays are answered. This attempt will be saved as incomplete.`)) {
      finish('exited');
    }
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

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

    const history = json(localStorage.getItem(RESP), {}) || {};
    const rows = history[String(result.id)]?.responses || [];
    content.innerHTML = `
      <div class="stat-grid test-combined-stats">
        <div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(result.scorePct || 0).toFixed(1)}%</div></div>
        <div class="stat-card"><div class="label">Correct</div><div class="value">${result.correct || 0}</div></div>
        <div class="stat-card"><div class="label">Partial</div><div class="value">${result.partial || 0}</div></div>
        <div class="stat-card"><div class="label">Incorrect</div><div class="value">${result.incorrect || 0}</div></div>
        <div class="stat-card"><div class="label">Essays answered</div><div class="value">${result.essayAnswered || 0}/${result.essayTotal || 0}</div></div>
      </div>
      ${rows.length ? `<div class="stat-section"><h3>Essay responses</h3><p class="small-muted">Essay responses are for self-review and are not automatically graded.</p>${rows.map((item, index) => {
        const essay = eMap.get(String(item.essayId));
        return `<details class="test-result-essay"><summary>Essay ${index + 1}: ${escapeHtml(item.title)} · ${item.answered ? 'Answered' : 'Unanswered'}</summary><div class="test-result-essay-body"><strong>Prompt</strong><p>${escapeHtml(item.prompt)}</p><strong>Your response</strong><p class="test-result-response">${item.answered ? escapeHtml(item.response) : 'No response submitted.'}</p>${essay?.modelAnswer ? `<strong>Model answer</strong><p>${escapeHtml(essay.modelAnswer)}</p>` : ''}</div></details>`;
      }).join('')}</div>` : ''}`;

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
    decorate(attempt);
  }

  function cleanupInactive() {
    followButton()?.classList.add('hidden');
    el('testSectionNav')?.remove();
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
    ensurePhaseNav(attempt);
    if (attempt.sup.phase === 'essays') renderEssay(attempt);
    else showQuestionSurface(attempt);
  }

  el('startTestBtn')?.addEventListener('click', bridgeNativeStart);
  el('exitTestBtn')?.addEventListener('click', exit, true);
  el('nextBtn')?.addEventListener('click', event => {
    const attempt = active();
    if (attempt?.sup.phase === 'questions' && allAnswered(attempt.test) && attempt.sup.essayOrder.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switchPhase('essays');
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (
      event.key !== 'ArrowRight' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
      event.target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open]')
    ) return;
    const attempt = active();
    if (attempt?.sup.phase === 'questions' && allAnswered(attempt.test) && attempt.sup.essayOrder.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switchPhase('essays');
    }
  }, true);

  el('categoriesBtn')?.addEventListener('click', () => window.setTimeout(copy, 0), true);

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
