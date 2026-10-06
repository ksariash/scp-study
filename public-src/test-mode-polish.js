(() => {
  'use strict';

  const el = id => document.getElementById(id);
  const QUESTIONS_LIST = Array.isArray(window.QUESTIONS) ? window.QUESTIONS : (typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS) ? QUESTIONS : []);
  const ESSAYS = Array.isArray(window.ESSAY_PRACTICE_DATA) ? window.ESSAY_PRACTICE_DATA : [];
  const zman = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  const zid = String(zman.id || 'default');
  const analyticsZman = String(zman.analyticsKey || zid);
  const MAIN = 'courseReviewSpacedRepetition.v1';
  const SUP = `scpStudy.testSupplement.v2:${zid}`;
  const DRAFT = `scpStudy.testReviewDraft.v1:${zid}`;
  const HISTORY = `scpStudy.testReviewHistory.v1:${zid}`;
  const ANALYTICS_SENT = `scpStudy.testAttemptAnalyticsSent.v1:${zid}`;
  const ANALYTICS_SETTINGS_KEY = 'scpStudy.analytics.v1';
  const ANALYTICS_INSTALLATION_KEY = 'scpStudy.analyticsInstallation.v1';
  const ANALYTICS_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/test-attempts';
  const TEST_DURATION = 3 * 60 * 60 * 1000;

  const json = (value, fallback = null) => {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };
  const readJson = (key, fallback = null) => json(localStorage.getItem(key), fallback);
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function state() {
    const raw = readJson(MAIN, null);
    if (!raw) return null;
    if (raw.scopeVersion === 1 && raw.cohorts && typeof raw.cohorts === 'object') return raw.cohorts[zid] || null;
    return raw;
  }
  function supplement() {
    const value = readJson(SUP, null);
    return value && typeof value === 'object' ? value : null;
  }
  function saveSupplement(value) { writeJson(SUP, value); }
  function activeAttempt() {
    const s = state();
    return s?.activeTest?.id ? { state:s, test:s.activeTest, sup:supplement() } : null;
  }
  function ensureSupplementFields(sup) {
    if (!sup) return null;
    sup.essayFlags = Array.isArray(sup.essayFlags) ? [...new Set(sup.essayFlags.map(String))] : [];
    sup.pairingFlags = sup.pairingFlags && typeof sup.pairingFlags === 'object' ? sup.pairingFlags : {};
    for (const essay of ESSAYS) {
      const id = String(essay.id);
      const valid = new Set((essay.facts || []).map(f => String(f.id)));
      sup.pairingFlags[id] = Array.isArray(sup.pairingFlags[id])
        ? [...new Set(sup.pairingFlags[id].map(String).filter(fid => valid.has(fid)))]
        : [];
    }
    return sup;
  }
  function qById(id) { return QUESTIONS_LIST.find(q => Number(q.id) === Number(id)) || null; }
  function essayById(id) { return ESSAYS.find(e => String(e.id) === String(id)) || null; }
  function pairMap(sup, essayId) {
    sup.essayPairings ||= {};
    sup.essayPairings[String(essayId)] ||= {};
    return sup.essayPairings[String(essayId)];
  }

  function analyticsEnabled() {
    const saved = readJson(ANALYTICS_SETTINGS_KEY, {});
    return saved?.enabled !== false;
  }
  function analyticsInstallationId() {
    let id = '';
    try { id = localStorage.getItem(ANALYTICS_INSTALLATION_KEY) || ''; } catch (_) {}
    if (id) return id;
    id = crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(ANALYTICS_INSTALLATION_KEY, id); } catch (_) {}
    return id;
  }

  function snapshotActive() {
    const attempt = activeAttempt();
    if (!attempt?.sup) return;
    const sup = ensureSupplementFields(structuredClone(attempt.sup));
    writeJson(DRAFT, {
      savedAt: Date.now(),
      test: structuredClone(attempt.test),
      sup
    });
  }

  function historyRows() {
    const rows = readJson(HISTORY, []);
    return Array.isArray(rows) ? rows : [];
  }
  function saveHistory(rows) { writeJson(HISTORY, rows.slice(0, 30)); }

  function buildDetailedHistory(result, draft) {
    const test = draft?.test || {};
    const sup = ensureSupplementFields(draft?.sup || {}) || {};
    const questions = QUESTIONS_LIST
      .slice()
      .sort((a,b) => Number(a.id) - Number(b.id))
      .map(q => {
        const item = test.items?.[q.id] || test.items?.[String(q.id)] || {};
        const selected = Array.isArray(item.selected) ? [...item.selected] : [];
        return {
          id:Number(q.id),
          category:q.category || '',
          prompt:q.prompt || '',
          choices:[...(q.choices || [])],
          answer:[...(q.answer || [])],
          explanation:q.explanation || '',
          selected,
          answered:!!item.answered,
          result:item.result || null,
          credit:Number(item.credit) || 0,
          elapsedMs:Number(item.elapsedMs) || 0,
          followUp:Array.isArray(sup.flags) && sup.flags.map(Number).includes(Number(q.id))
        };
      });

    const essays = (sup.essayOrder || ESSAYS.map(e => String(e.id))).map(essayId => {
      const essay = essayById(essayId);
      if (!essay) return null;
      const pairs = pairMap(sup, essayId);
      const pairFlags = new Set((sup.pairingFlags?.[String(essayId)] || []).map(String));
      return {
        essayId:String(essayId),
        title:essay.title || 'Essay',
        prompt:essay.prompt || '',
        modelAnswer:essay.modelAnswer || '',
        flagged:(sup.essayFlags || []).map(String).includes(String(essayId)),
        pairings:(essay.facts || []).map(fact => {
          const selectedId = pairs[String(fact.id)] || null;
          const selectedFact = selectedId ? essay.facts.find(x => String(x.id) === String(selectedId)) : null;
          const name = fact?.tokens?.[0]?.[1] || fact?.label || '';
          const correctText = fact?.tokens?.[1]?.[1] || '';
          const selectedText = selectedFact?.tokens?.[1]?.[1] || '';
          return {
            factId:String(fact.id), name,
            selectedId:selectedId ? String(selectedId) : null,
            selectedText,
            correctText,
            correct:!!selectedId && String(selectedId) === String(fact.id),
            flagged:pairFlags.has(String(fact.id))
          };
        })
      };
    }).filter(Boolean);

    return {
      id:String(result.id),
      date:Number(result.date) || Date.now(),
      startedAt:Number(test.startedAt) || null,
      endedAt:Number(result.date) || Date.now(),
      reason:result.reason || 'completed',
      completed:!!result.completed,
      scorePct:Number(result.scorePct) || 0,
      correct:Number(result.correct) || 0,
      partial:Number(result.partial) || 0,
      incorrect:Number(result.incorrect) || 0,
      unanswered:Number(result.unanswered) || 0,
      points:Number(result.points) || 0,
      totalTimeMs:Number(result.totalTimeMs) || Math.max(0, (Number(result.date) || Date.now()) - (Number(test.startedAt) || Date.now())),
      essayScorePct:Number(result.essayScorePct) || 0,
      essayPairCorrect:Number(result.essayPairCorrect) || 0,
      essayPairTotal:Number(result.essayPairTotal) || 0,
      questions,
      essays
    };
  }

  async function sendAttemptAnalytics(review) {
    if (!review || !analyticsEnabled()) return;
    const sent = new Set(readJson(ANALYTICS_SENT, []) || []);
    if (sent.has(String(review.id))) return;
    const payload = {
      eventId:`test-${review.id}`,
      installationId:analyticsInstallationId(),
      zman:analyticsZman,
      appVersion:String((String(el('appVersionFooter')?.textContent || '').match(/v(\d+)/i) || [])[1] || ''),
      clientTs:new Date(review.endedAt || review.date || Date.now()).toISOString(),
      startedAt:review.startedAt ? new Date(review.startedAt).toISOString() : null,
      endedAt:new Date(review.endedAt || review.date || Date.now()).toISOString(),
      reason:review.reason,
      completed:review.completed,
      questionTotal:review.questions.length,
      questionAnswered:review.questions.filter(q => q.answered).length,
      correct:review.correct,
      partial:review.partial,
      incorrect:review.incorrect,
      unanswered:review.unanswered,
      scorePct:review.scorePct,
      essayTotal:review.essays.length,
      essayAnswered:review.essays.filter(e => e.pairings.length && e.pairings.every(p => p.selectedId)).length,
      essayPairCorrect:review.essayPairCorrect,
      essayPairTotal:review.essayPairTotal,
      essayScorePct:review.essayScorePct,
      durationMs:review.totalTimeMs,
      followUpQuestionCount:review.questions.filter(q => q.followUp).length,
      followUpEssayCount:review.essays.filter(e => e.flagged).length,
      followUpPairingCount:review.essays.reduce((n,e) => n + e.pairings.filter(p => p.flagged).length, 0),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || null
    };
    try {
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json','X-SCP-Analytics-Version':'1'},
        body:JSON.stringify(payload),
        keepalive:true
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      sent.add(String(review.id));
      writeJson(ANALYTICS_SENT, [...sent].slice(-100));
    } catch (error) {
      console.warn('Practice-test analytics deferred:', error);
    }
  }

  function reconcileCompletedAttempt() {
    const draft = readJson(DRAFT, null);
    if (!draft?.test?.id) return;
    const s = state();
    const result = (s?.tests || []).find(item => String(item?.id) === String(draft.test.id));
    if (!result) return;
    const rows = historyRows();
    let review = rows.find(item => String(item?.id) === String(result.id));
    if (!review) {
      review = buildDetailedHistory(result, draft);
      rows.unshift(review);
      saveHistory(rows);
    }
    try { localStorage.removeItem(DRAFT); } catch (_) {}
    void sendAttemptAnalytics(review);
  }

  function currentEssayContext() {
    const attempt = activeAttempt();
    if (!attempt?.sup || attempt.sup.phase !== 'essays') return null;
    const sup = ensureSupplementFields(attempt.sup);
    const essayId = String(sup.essayOrder?.[Number(sup.essayIndex) || 0] || '');
    const essay = essayById(essayId);
    if (!essay) return null;
    const factIndex = Math.min(Math.max(0, Number(sup.essayFactIndex?.[essayId]) || 0), Math.max(0, essay.facts.length - 1));
    const fact = essay.facts[factIndex] || null;
    return { attempt, sup, essayId, essay, factIndex, fact };
  }

  function rerenderEssay(ctx = currentEssayContext()) {
    if (!ctx) return;
    saveSupplement(ctx.sup);
    const native = el('essayQuickNav');
    if (native) {
      native.value = String(ctx.sup.essayIndex || 0);
      native.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }

  function movePairing(delta) {
    const ctx = currentEssayContext();
    if (!ctx?.essay?.facts?.length) return;
    const count = ctx.essay.facts.length;
    ctx.sup.essayFactIndex[ctx.essayId] = (ctx.factIndex + Number(delta) + count) % count;
    rerenderEssay(ctx);
  }
  function moveEssay(delta) {
    const ctx = currentEssayContext();
    if (!ctx) return;
    const next = Math.min(Math.max(0, (Number(ctx.sup.essayIndex) || 0) + Number(delta)), Math.max(0, ctx.sup.essayOrder.length - 1));
    if (next === Number(ctx.sup.essayIndex)) return;
    ctx.sup.essayIndex = next;
    const nextId = String(ctx.sup.essayOrder[next]);
    const nextEssay = essayById(nextId);
    if (nextEssay) {
      const pairs = pairMap(ctx.sup, nextId);
      const firstOpen = nextEssay.facts.findIndex(f => !pairs[String(f.id)]);
      ctx.sup.essayFactIndex[nextId] = firstOpen >= 0 ? firstOpen : Math.min(Number(ctx.sup.essayFactIndex[nextId]) || 0, nextEssay.facts.length - 1);
    }
    rerenderEssay(ctx);
  }
  function toggleEssayFlag() {
    const ctx = currentEssayContext();
    if (!ctx) return;
    const flags = new Set((ctx.sup.essayFlags || []).map(String));
    if (flags.has(ctx.essayId)) flags.delete(ctx.essayId); else flags.add(ctx.essayId);
    ctx.sup.essayFlags = [...flags];
    rerenderEssay(ctx);
  }
  function togglePairingFlag() {
    const ctx = currentEssayContext();
    if (!ctx?.fact) return;
    const list = new Set((ctx.sup.pairingFlags?.[ctx.essayId] || []).map(String));
    const fid = String(ctx.fact.id);
    if (list.has(fid)) list.delete(fid); else list.add(fid);
    ctx.sup.pairingFlags[ctx.essayId] = [...list];
    rerenderEssay(ctx);
  }

  function ensureEssayControls() {
    const ctx = currentEssayContext();
    if (!ctx) return;

    const native = el('essayQuickNav');
    const toolbar = native?.parentElement;
    if (native && toolbar && !el('testEssayQuickNav')) {
      native.classList.add('test-native-essay-nav-hidden');
      const select = document.createElement('select');
      select.id = 'testEssayQuickNav';
      select.className = 'essay-quick-nav test-essay-quick-nav';
      select.setAttribute('aria-label', 'Jump to essay or pairing');
      toolbar.insertBefore(select, native);
      select.addEventListener('change', () => {
        const [essayIndexRaw, factIndexRaw] = String(select.value).split(':');
        const essayIndex = Number(essayIndexRaw);
        const factIndex = Number(factIndexRaw);
        const fresh = currentEssayContext();
        if (!fresh || !Number.isInteger(essayIndex)) return;
        fresh.sup.essayIndex = Math.min(Math.max(0, essayIndex), fresh.sup.essayOrder.length - 1);
        const targetId = String(fresh.sup.essayOrder[fresh.sup.essayIndex]);
        const targetEssay = essayById(targetId);
        if (targetEssay) fresh.sup.essayFactIndex[targetId] = Math.min(Math.max(0, Number.isInteger(factIndex) ? factIndex : 0), Math.max(0, targetEssay.facts.length - 1));
        rerenderEssay(fresh);
      });
    }

    let controls = el('testPairingNav');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'testPairingNav';
      controls.className = 'test-pairing-nav';
      controls.innerHTML = `
        <button type="button" class="secondary" data-test-pair-nav="prev">← Pairing</button>
        <button type="button" class="secondary" data-test-pair-nav="skip">Skip</button>
        <button type="button" class="secondary" data-test-pair-nav="next">Pairing →</button>
        <button type="button" class="test-flag-btn" id="testPairingFlagBtn" aria-pressed="false">☆ Pairing</button>
        <button type="button" class="test-flag-btn" id="testEssayFlagBtn" aria-pressed="false">☆ Essay</button>`;
      el('essayMatchSection')?.insertBefore(controls, el('essayChoiceList'));
      controls.addEventListener('click', event => {
        const nav = event.target.closest?.('[data-test-pair-nav]')?.dataset.testPairNav;
        if (nav === 'prev') movePairing(-1);
        if (nav === 'skip' || nav === 'next') movePairing(1);
        if (event.target.closest?.('#testPairingFlagBtn')) togglePairingFlag();
        if (event.target.closest?.('#testEssayFlagBtn')) toggleEssayFlag();
      });
    }

    let footer = el('testEssayShortcuts');
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'testEssayShortcuts';
      footer.className = 'review-shortcuts test-essay-shortcuts';
      footer.innerHTML = '<span><kbd>1–9</kbd> choose</span><span><kbd>↑</kbd><kbd>↓</kbd> pairings</span><span><kbd>←</kbd><kbd>→</kbd> essays</span><span><kbd>F</kbd> flag pairing</span><span><kbd>Shift</kbd>+<kbd>F</kbd> flag essay</span>';
      el('essayPracticeMain')?.append(footer);
    }

    refreshEssayControls(ctx);
  }

  function refreshEssayControls(ctx = currentEssayContext()) {
    if (!ctx) return;
    const select = el('testEssayQuickNav');
    if (select) {
      const currentValue = `${ctx.sup.essayIndex}:${ctx.factIndex}`;
      select.innerHTML = '';
      ctx.sup.essayOrder.forEach((essayId, essayIndex) => {
        const essay = essayById(essayId);
        if (!essay) return;
        const essayFlagged = (ctx.sup.essayFlags || []).map(String).includes(String(essayId));
        const group = document.createElement('optgroup');
        group.label = `${essayFlagged ? '★ ' : ''}Essay ${essayIndex + 1}: ${essay.title || 'Essay'}`;
        (essay.facts || []).forEach((fact, factIndex) => {
          const option = document.createElement('option');
          option.value = `${essayIndex}:${factIndex}`;
          const answered = !!pairMap(ctx.sup, essayId)[String(fact.id)];
          const flagged = (ctx.sup.pairingFlags?.[String(essayId)] || []).map(String).includes(String(fact.id));
          const name = fact?.tokens?.[0]?.[1] || fact?.label || `Pairing ${factIndex + 1}`;
          option.textContent = `${flagged ? '★ ' : ''}${answered ? '✓' : '□'} ${factIndex + 1}. ${name}`;
          group.append(option);
        });
        select.append(group);
      });
      select.value = currentValue;
    }
    const pairFlag = el('testPairingFlagBtn');
    const essayFlag = el('testEssayFlagBtn');
    const pairFlagged = !!ctx.fact && (ctx.sup.pairingFlags?.[ctx.essayId] || []).map(String).includes(String(ctx.fact.id));
    const essayFlagged = (ctx.sup.essayFlags || []).map(String).includes(ctx.essayId);
    if (pairFlag) { pairFlag.textContent = pairFlagged ? '★ Pairing' : '☆ Pairing'; pairFlag.classList.toggle('active', pairFlagged); pairFlag.setAttribute('aria-pressed', pairFlagged ? 'true' : 'false'); }
    if (essayFlag) { essayFlag.textContent = essayFlagged ? '★ Essay' : '☆ Essay'; essayFlag.classList.toggle('active', essayFlagged); essayFlag.setAttribute('aria-pressed', essayFlagged ? 'true' : 'false'); }
  }

  function hardenEssayHitTargets() {
    document.querySelectorAll('[data-test-essay-choice], [data-test-edit-fact]').forEach(button => {
      button.classList.add('test-full-hit-target');
      button.querySelectorAll('*').forEach(child => child.classList.add('test-hit-child'));
    });
  }

  function decorateQuestionStates() {
    const attempt = activeAttempt();
    if (!attempt || attempt.sup?.phase === 'essays') return;
    const answered = new Set((attempt.test.order || []).filter(id => attempt.test.items?.[id]?.answered).map(Number));
    const flags = new Set((attempt.sup?.flags || []).map(Number));
    const select = el('questionNumber');
    if (select) [...select.options].forEach(option => {
      const id = Number(option.value);
      option.textContent = `${flags.has(id) ? '★ ' : ''}${answered.has(id) ? '✓' : '□'} Question ${id}`;
    });
    el('questionNumberMenu')?.querySelectorAll('[data-question-number]').forEach(button => {
      const id = Number(button.dataset.questionNumber);
      button.classList.toggle('test-answered', answered.has(id));
      button.classList.toggle('test-unanswered', !answered.has(id));
      button.classList.toggle('test-flagged', flags.has(id));
      button.textContent = `${flags.has(id) ? '★ ' : ''}${answered.has(id) ? '✓' : '□'} ${id}`;
    });
  }

  let previousAnswered = new Set();
  let autoAdvanceBusy = false;
  function watchAutoAdvance() {
    const attempt = activeAttempt();
    if (!attempt || attempt.sup?.phase === 'essays') {
      previousAnswered = new Set();
      return;
    }
    const nowAnswered = new Set((attempt.test.order || []).filter(id => attempt.test.items?.[id]?.answered).map(Number));
    const currentId = Number(el('questionNumber')?.value || attempt.test.order?.[attempt.test.index]);
    const newlyAnsweredCurrent = nowAnswered.has(currentId) && !previousAnswered.has(currentId);
    previousAnswered = nowAnswered;
    if (!newlyAnsweredCurrent || autoAdvanceBusy) return;
    autoAdvanceBusy = true;
    window.setTimeout(() => {
      const fresh = activeAttempt();
      if (!fresh || fresh.sup?.phase === 'essays') { autoAdvanceBusy = false; return; }
      const total = fresh.test.order?.length || 0;
      const done = fresh.test.order?.filter(id => fresh.test.items?.[id]?.answered).length || 0;
      if (done < total) el('nextBtn')?.click();
      autoAdvanceBusy = false;
    }, 120);
  }

  function stabilizeProgress() {
    const attempt = activeAttempt();
    if (!attempt) return;
    const total = attempt.test.order?.length || 0;
    const done = attempt.test.order?.filter(id => attempt.test.items?.[id]?.answered).length || 0;
    const fill = el('testProgressFill');
    if (fill) fill.style.setProperty('width', `${total ? done / total * 100 : 0}%`, 'important');
  }

  function smoothTimer() {
    const attempt = activeAttempt();
    if (!attempt) return;
    const start = Number(attempt.test.startedAt) || Date.now();
    const remaining = Math.max(0, start + TEST_DURATION - Date.now());
    const total = Math.floor(remaining / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const timer = el('mainTimer');
    if (timer) timer.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function ensureHistoryDialogs() {
    if (!el('testHistoryDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'testHistoryDialog';
      dialog.className = 'modal wide test-history-dialog';
      dialog.innerHTML = `<div class="modal-inner"><div class="modal-head"><div><h2>Previous practice tests</h2><p>Review completed, timed-out, and exited attempts saved on this device.</p></div><button class="close-btn" type="button" aria-label="Close">×</button></div><div id="testHistoryList" class="test-history-list"></div><div class="modal-footer"><button class="primary" type="button" data-close-history>Done</button></div></div>`;
      document.body.append(dialog);
      dialog.querySelector('.close-btn')?.addEventListener('click', () => dialog.close());
      dialog.querySelector('[data-close-history]')?.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => {
        const button = event.target.closest?.('[data-review-test]');
        if (!button) return;
        dialog.close();
        openReview(button.dataset.reviewTest);
      });
    }
    if (!el('testReviewDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'testReviewDialog';
      dialog.className = 'modal wide test-review-dialog';
      dialog.innerHTML = `<div class="modal-inner test-review-inner"><div class="modal-head"><div><h2 id="testReviewTitle">Practice test review</h2><p id="testReviewMeta"></p></div><button class="close-btn" type="button" aria-label="Close">×</button></div><div class="test-review-tabs"><button type="button" data-review-section="questions" class="active">Questions</button><button type="button" data-review-section="essays">Essays</button></div><div id="testReviewBody"></div><div class="review-shortcuts test-review-shortcuts"><span><kbd>←</kbd><kbd>→</kbd> item</span><span><kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> section</span></div></div>`;
      document.body.append(dialog);
      dialog.querySelector('.close-btn')?.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => {
        const section = event.target.closest?.('[data-review-section]')?.dataset.reviewSection;
        if (section) { reviewState.section = section; reviewState.index = 0; renderReview(); }
        const delta = Number(event.target.closest?.('[data-review-step]')?.dataset.reviewStep || 0);
        if (delta) { reviewState.index += delta; renderReview(); }
      });
    }
  }

  const reviewState = { id:null, section:'questions', index:0 };
  function allAvailableTests() {
    const detailed = historyRows();
    const detailedIds = new Set(detailed.map(x => String(x.id)));
    const summaries = (state()?.tests || []).slice().reverse().filter(x => !detailedIds.has(String(x.id))).map(x => ({ ...x, summaryOnly:true }));
    return [...detailed, ...summaries].sort((a,b) => Number(b.date || 0) - Number(a.date || 0));
  }
  function renderHistoryList() {
    ensureHistoryDialogs();
    const host = el('testHistoryList');
    const rows = allAvailableTests();
    if (!host) return;
    host.innerHTML = rows.length ? rows.map(row => `
      <button type="button" class="test-history-row" data-review-test="${esc(row.id)}">
        <span><strong>${new Date(row.date || Date.now()).toLocaleString()}</strong><small>${row.completed ? 'Completed' : row.reason === 'time' ? 'Timed out' : 'Exited early'}</small></span>
        <span><b>${Number(row.scorePct || 0).toFixed(1)}%</b><small>${row.essayPairTotal ? `Essay ${row.essayPairCorrect || 0}/${row.essayPairTotal}` : row.summaryOnly ? 'Summary only' : ''}</small></span>
      </button>`).join('') : '<div class="empty">No previous practice tests are saved on this device yet.</div>';
  }
  function openHistory() {
    renderHistoryList();
    el('testHistoryDialog')?.showModal();
  }
  function openReview(id) {
    ensureHistoryDialogs();
    reviewState.id = String(id);
    reviewState.section = 'questions';
    reviewState.index = 0;
    renderReview();
    el('testReviewDialog')?.showModal();
  }
  function renderReview() {
    const row = allAvailableTests().find(x => String(x.id) === reviewState.id);
    const body = el('testReviewBody');
    if (!row || !body) return;
    el('testReviewTitle').textContent = 'Practice test review';
    el('testReviewMeta').textContent = `${new Date(row.date || Date.now()).toLocaleString()} · ${Number(row.scorePct || 0).toFixed(1)}% M/C${row.essayPairTotal ? ` · ${row.essayPairCorrect || 0}/${row.essayPairTotal} essay pairings` : ''}`;
    document.querySelectorAll('#testReviewDialog [data-review-section]').forEach(btn => btn.classList.toggle('active', btn.dataset.reviewSection === reviewState.section));

    if (row.summaryOnly || !Array.isArray(row.questions)) {
      body.innerHTML = `<div class="stat-grid"><div class="stat-card"><div class="label">M/C score</div><div class="value">${Number(row.scorePct || 0).toFixed(1)}%</div></div><div class="stat-card"><div class="label">Correct</div><div class="value">${row.correct || 0}</div></div><div class="stat-card"><div class="label">Incorrect</div><div class="value">${row.incorrect || 0}</div></div><div class="stat-card"><div class="label">Unanswered</div><div class="value">${row.unanswered || 0}</div></div></div><p class="small-muted">This older attempt predates detailed review storage, so only its saved summary is available.</p>`;
      return;
    }

    const items = reviewState.section === 'essays'
      ? row.essays.flatMap((essay, essayIndex) => essay.pairings.map((pair, pairIndex) => ({ type:'essay', essay, essayIndex, pair, pairIndex })))
      : row.questions.map(question => ({ type:'question', question }));
    if (!items.length) { body.innerHTML = '<div class="empty">No items in this section.</div>'; return; }
    reviewState.index = Math.min(Math.max(0, reviewState.index), items.length - 1);
    const item = items[reviewState.index];

    if (item.type === 'question') {
      const q = item.question;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      body.innerHTML = `<div class="test-review-nav"><button class="secondary" data-review-step="-1" ${reviewState.index === 0 ? 'disabled' : ''}>← Previous</button><strong>Question ${q.id} · ${reviewState.index + 1}/${items.length}</strong><button class="secondary" data-review-step="1" ${reviewState.index === items.length - 1 ? 'disabled' : ''}>Next →</button></div><div class="test-review-result ${q.result || 'unanswered'}">${q.followUp ? '★ ' : ''}${q.answered ? (q.result === 'correct' ? 'Correct' : q.result === 'partial' ? 'Partial' : 'Incorrect') : 'Unanswered'}</div><h3>${esc(q.prompt)}</h3><div class="test-review-choices">${q.choices.map((choice, i) => { const letter=letters[i]; const selected=q.selected.includes(letter); const correct=q.answer.includes(letter); return `<div class="test-review-choice ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${selected && !correct ? 'wrong' : ''}"><strong>${letter}</strong><span>${esc(choice)}</span>${selected ? '<small>Your answer</small>' : ''}${correct ? '<small>Correct</small>' : ''}</div>`; }).join('')}</div><div class="test-review-explanation"><strong>Explanation</strong><p>${esc(q.explanation)}</p></div>`;
    } else {
      const { essay, pair, pairIndex } = item;
      body.innerHTML = `<div class="test-review-nav"><button class="secondary" data-review-step="-1" ${reviewState.index === 0 ? 'disabled' : ''}>← Previous</button><strong>Essay ${item.essayIndex + 1} · Pairing ${pairIndex + 1}/${essay.pairings.length}</strong><button class="secondary" data-review-step="1" ${reviewState.index === items.length - 1 ? 'disabled' : ''}>Next →</button></div><div class="test-review-result ${pair.selectedId ? (pair.correct ? 'correct' : 'incorrect') : 'unanswered'}">${essay.flagged || pair.flagged ? '★ ' : ''}${pair.selectedId ? (pair.correct ? 'Correct' : 'Incorrect') : 'Unanswered'}</div><h3>${esc(essay.title)}</h3><p>${esc(essay.prompt)}</p><div class="test-result-pairing ${pair.correct ? 'correct' : pair.selectedId ? 'incorrect' : 'unanswered'}"><strong>${esc(pair.name)}</strong><span>${pair.selectedId ? `Your pairing: ${esc(pair.selectedText)}` : 'No pairing submitted.'}</span><small>Correct pairing: ${esc(pair.correctText)}</small></div>${essay.modelAnswer ? `<details class="essay-model-answer"><summary>Model answer</summary><p>${esc(essay.modelAnswer)}</p></details>` : ''}`;
    }
  }

  function injectHistoryEntrypoints() {
    ensureHistoryDialogs();
    const introFooter = el('testIntroDialog')?.querySelector('.modal-footer');
    if (introFooter && !el('reviewPreviousTestsBtn')) {
      const button = document.createElement('button');
      button.type = 'button'; button.id = 'reviewPreviousTestsBtn'; button.className = 'secondary'; button.textContent = 'Review previous tests';
      introFooter.insertBefore(button, introFooter.firstChild);
      button.addEventListener('click', () => { el('testIntroDialog')?.close(); openHistory(); });
    }
    const refreshIntroButton = () => { const b=el('reviewPreviousTestsBtn'); if (b) b.hidden = !allAvailableTests().length; };
    refreshIntroButton();
    el('testBtn')?.addEventListener('click', () => window.setTimeout(refreshIntroButton, 0));

    const appendStats = () => {
      const host = el('statsContent');
      if (!host || el('testHistoryStatsSection')) return;
      const rows = allAvailableTests();
      const section = document.createElement('section');
      section.id = 'testHistoryStatsSection'; section.className = 'stat-section test-history-stats-section';
      section.innerHTML = `<div class="section-head"><div><h3>Practice tests</h3><p class="small-muted">${rows.length ? `${rows.length} saved attempt${rows.length === 1 ? '' : 's'} on this device.` : 'No saved attempts yet.'}</p></div><button type="button" class="secondary" id="reviewTestsFromStats" ${rows.length ? '' : 'disabled'}>Review tests</button></div>`;
      host.append(section);
      el('reviewTestsFromStats')?.addEventListener('click', () => { el('statsDialog')?.close(); openHistory(); });
    };
    el('statsBtn')?.addEventListener('click', () => window.setTimeout(appendStats, 0));
    el('reviewStatsAfterTest')?.addEventListener('click', () => window.setTimeout(appendStats, 0));
  }

  function keyboard() {
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const dialog = el('testReviewDialog');
      if (dialog?.open) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          if (event.shiftKey) {
            reviewState.section = reviewState.section === 'questions' ? 'essays' : 'questions';
            reviewState.index = 0;
          } else reviewState.index += event.key === 'ArrowLeft' ? -1 : 1;
          renderReview();
        }
        return;
      }
      const ctx = currentEssayContext();
      if (!ctx) return;
      const interactive = event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
      if (interactive) return;
      if (/^[1-9]$/.test(event.key)) {
        const choices = [...document.querySelectorAll('[data-test-essay-choice]')];
        const choice = choices[Number(event.key) - 1];
        if (choice) { event.preventDefault(); choice.click(); }
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); event.stopImmediatePropagation(); movePairing(event.key === 'ArrowUp' ? -1 : 1); return; }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopImmediatePropagation(); moveEssay(event.key === 'ArrowLeft' ? -1 : 1); return; }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); event.shiftKey ? toggleEssayFlag() : togglePairingFlag(); }
    }, true);
  }

  function pointerReliability() {
    document.addEventListener('pointerup', event => {
      if (!document.body.classList.contains('ui-test-essays')) return;
      const edit = event.target.closest?.('[data-test-edit-fact]');
      if (edit) {
        const ctx = currentEssayContext();
        const index = ctx?.essay?.facts?.findIndex(f => String(f.id) === String(edit.dataset.testEditFact)) ?? -1;
        if (ctx && index >= 0) {
          event.preventDefault(); event.stopImmediatePropagation();
          ctx.sup.essayFactIndex[ctx.essayId] = index;
          rerenderEssay(ctx);
          el('essayMatchSection')?.scrollIntoView({ block:'nearest', behavior:'smooth' });
        }
        return;
      }
      const choice = event.target.closest?.('[data-test-essay-choice]');
      if (choice && event.pointerType === 'touch') {
        event.preventDefault(); event.stopImmediatePropagation();
        choice.click();
      }
    }, true);
  }

  function tick() {
    const attempt = activeAttempt();
    if (attempt?.sup) {
      ensureSupplementFields(attempt.sup);
      snapshotActive();
      decorateQuestionStates();
      watchAutoAdvance();
      stabilizeProgress();
      smoothTimer();
      if (attempt.sup.phase === 'essays') {
        ensureEssayControls();
        refreshEssayControls();
        hardenEssayHitTargets();
      }
    } else {
      reconcileCompletedAttempt();
    }
  }

  reconcileCompletedAttempt();
  injectHistoryEntrypoints();
  keyboard();
  pointerReliability();
  window.setInterval(tick, 120);
})();
