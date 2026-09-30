(() => {
  'use strict';

  const STORAGE_KEY = 'courseReviewSpacedRepetition.v1';
  const AUDIO_DB_NAME = 'scpStudyAudioLibrary.v1';
  const AUDIO_DB_STORE = 'tracks';
  const AUDIO_PLAYBACK_KEY = 'scpStudy.audioPlayback.v1';
  const MATERIALS_TAB_KEY = 'scpStudy.materialsTab.v1';
  const MATERIALS_TRANSCRIPT_KEY = 'scpStudy.materialsTranscript.v1';
  const AUDIO_CACHE_NAME = 'scp-study-audio-v1';
  const BUNDLED_AUDIO_REVIEWS = AUDIO_REVIEW_DATA.map(track => ({
    ...track,
    name: track.title
  }));
  const APP_VERSION = 26;
  const ANALYTICS_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/events';
  const ANALYTICS_COHORT = 'SCP 2026 Summer';
  const ANALYTICS_SETTINGS_KEY = 'scpStudy.analytics.v1';
  const ANALYTICS_QUEUE_KEY = 'scpStudy.analyticsQueue.v1';
  const ANALYTICS_INSTALLATION_KEY = 'scpStudy.analyticsInstallation.v1';
  const ANALYTICS_MAX_QUEUE = 500;
  const TEST_DURATION_MS = 90 * 60 * 1000;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const categories = [...new Set(QUESTIONS.map(q => q.category))];
  const questionById = new Map(QUESTIONS.map(q => [q.id, q]));

  function searchableQuestionText(q) {
    const refs = (typeof QUESTION_AUDIO_MAP !== 'undefined' && QUESTION_AUDIO_MAP[String(q.id)]) || [];
    const audioText = [];
    const seenReviews = new Set();
    refs.forEach(ref => {
      if (ref.label) audioText.push(ref.label);
      const reviewId = Number(ref.review);
      if (seenReviews.has(reviewId) || typeof AUDIO_REVIEW_DATA === 'undefined') return;
      seenReviews.add(reviewId);
      const track = AUDIO_REVIEW_DATA.find(item => Number(item.id) === reviewId);
      if (!track) return;
      audioText.push(track.title || track.name || '');
      (track.transcript || []).forEach(segment => audioText.push(segment.text || ''));
    });
    const correctChoiceText = (q.answer || []).map(letter => {
      const idx = LETTERS.indexOf(letter);
      return idx >= 0 ? q.choices?.[idx] || '' : '';
    });
    return [
      `question ${q.id}`, q.id, q.category, q.prompt, q.explanation,
      ...(q.choices || []), ...correctChoiceText, ...audioText
    ].join(' ').toLocaleLowerCase();
  }

  const questionSearchCorpus = new Map(QUESTIONS.map(q => [q.id, searchableQuestionText(q)]));

  const glossaryById = new Map((typeof GLOSSARY_TERMS !== 'undefined' ? GLOSSARY_TERMS : []).map(entry => [entry.id, entry]));
  const glossaryAliasPairs = [];
  glossaryById.forEach(entry => {
    const aliases = [...new Set([entry.term, ...(entry.aliases || [])].filter(Boolean))];
    aliases.forEach(alias => glossaryAliasPairs.push({ alias: String(alias), entry }));
  });
  glossaryAliasPairs.sort((a, b) => b.alias.length - a.alias.length);
  const glossaryAliasLookup = new Map(glossaryAliasPairs.map(item => [item.alias.toLocaleLowerCase(), item.entry]));
  const glossaryPattern = glossaryAliasPairs.length
    ? new RegExp(`(^|[^\\p{L}\\p{N}])(${glossaryAliasPairs.map(item => item.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'giu')
    : null;
  const GLOSSARY_CATEGORY_LINKS = {
    'taam-keikar': ['נ״ט בר נ״ט'],
    'noten-taam-lifgam': ['Dishes, Sinks & Dishwashers'],
    'tataah-gavar': ['Dishes, Sinks & Dishwashers'],
    'ein-mevatlin': ['Fish & Meat', 'Wine Processing & Products'],
    'yad-soledet': ['Dishes, Sinks & Dishwashers', 'Wine Processing & Products'],
    'gezeirah': ['סתם יינם — Foundations & Benefit', 'Social Drinking'],
    'maga-akum': ['סתם יינם — Foundations & Benefit', 'Wine Contact & Touch'],
    'akum': ['סתם יינם — Foundations & Benefit', 'Wine Contact & Touch', 'Unattended Wine'],
    'nitzok': ['Wine Contact & Touch'],
    'chotam-betoch-chotam': ['Unattended Wine']
  };
  const glossaryCategoryCache = new Map();
  let activeGlossaryEntry = null;

  const el = id => document.getElementById(id);
  const dom = {
    modeLabel: el('modeLabel'), timerLabel: el('timerLabel'), mainTimer: el('mainTimer'), timerCard: el('timerCard'),
    categoriesBtn: el('categoriesBtn'), materialsBtn: el('materialsBtn'), statsBtn: el('statsBtn'), testBtn: el('testBtn'), questionSearchFab: el('questionSearchFab'), installBtn: el('installBtn'), installGuideDialog: el('installGuideDialog'), closeInstallGuide: el('closeInstallGuide'),
    testProgressWrap: el('testProgressWrap'), testQuestionCount: el('testQuestionCount'), testAnsweredCount: el('testAnsweredCount'), testProgressFill: el('testProgressFill'),
    questionNumber: el('questionNumber'), questionCategory: el('questionCategory'), questionStatus: el('questionStatus'), questionPrompt: el('questionPrompt'), multiNote: el('multiNote'), questionAudio: el('questionAudio'), answerForm: el('answerForm'),
    feedbackBox: el('feedbackBox'), feedbackResult: el('feedbackResult'), feedbackTime: el('feedbackTime'), feedbackCategory: el('feedbackCategory'), feedbackExplanation: el('feedbackExplanation'), correctAnswerLine: el('correctAnswerLine'),
    prevBtn: el('prevBtn'), submitBtn: el('submitBtn'), nextBtn: el('nextBtn'), saveNote: el('saveNote'),
    categoriesDialog: el('categoriesDialog'), categoryOptions: el('categoryOptions'), selectAllCategories: el('selectAllCategories'), clearCategories: el('clearCategories'), applyCategories: el('applyCategories'),
    materialsDialog: el('materialsDialog'), closeMaterials: el('closeMaterials'), doneMaterialsBtn: el('doneMaterialsBtn'), materialsQuestionSearchBtn: el('materialsQuestionSearchBtn'), materialsTabs: el('materialsTabs'), materialsPanelAudio: el('materialsPanelAudio'), materialsPanelGlossary: el('materialsPanelGlossary'), materialsPanelDownloads: el('materialsPanelDownloads'), downloadAllAudioBtn: el('downloadAllAudioBtn'), audioCacheStatus: el('audioCacheStatus'), glossarySearchInput: el('glossarySearchInput'), glossarySearchClear: el('glossarySearchClear'), glossaryCount: el('glossaryCount'), glossaryList: el('glossaryList'), glossaryEmpty: el('glossaryEmpty'), analyticsToggle: el('analyticsToggle'), analyticsStatus: el('analyticsStatus'),
    audioPlayerShell: el('audioPlayerShell'), audioPlayer: el('audioPlayer'), audioTrackTitle: el('audioTrackTitle'), audioTrackCounter: el('audioTrackCounter'), audioPrevBtn: el('audioPrevBtn'), audioBack10Btn: el('audioBack10Btn'), audioForward10Btn: el('audioForward10Btn'), audioNextBtn: el('audioNextBtn'), audioEmptyState: el('audioEmptyState'), audioPlaylistWrap: el('audioPlaylistWrap'), audioPlaylistCount: el('audioPlaylistCount'), audioPlaylistToggle: el('audioPlaylistToggle'), audioPlaylist: el('audioPlaylist'), transcriptPanel: el('transcriptPanel'), transcriptToggle: el('transcriptToggle'), audioTranscript: el('audioTranscript'), transcriptClock: el('transcriptClock'), miniAudioPlayer: el('miniAudioPlayer'), miniAudioOpen: el('miniAudioOpen'), miniAudioTitle: el('miniAudioTitle'), miniAudioTime: el('miniAudioTime'), miniAudioBack10: el('miniAudioBack10'), miniAudioPlayPause: el('miniAudioPlayPause'), miniAudioStop: el('miniAudioStop'),
    statsDialog: el('statsDialog'), statsContent: el('statsContent'), closeStats: el('closeStats'), resetStatsBtn: el('resetStatsBtn'), doneStatsBtn: el('doneStatsBtn'),
    questionReviewDialog: el('questionReviewDialog'), closeQuestionReview: el('closeQuestionReview'), reviewTitle: el('reviewTitle'), reviewContextLabel: el('reviewContextLabel'), reviewSearchInput: el('reviewSearchInput'), reviewSearchClear: el('reviewSearchClear'), reviewSearchCount: el('reviewSearchCount'), reviewSearchEmpty: el('reviewSearchEmpty'), reviewNav: el('reviewNav'), reviewBody: el('reviewBody'), reviewQuestionNumber: el('reviewQuestionNumber'), reviewCategory: el('reviewCategory'), reviewStatsGrid: el('reviewStatsGrid'), reviewLastAnswer: el('reviewLastAnswer'), reviewPrompt: el('reviewPrompt'), reviewChoices: el('reviewChoices'), reviewExplanation: el('reviewExplanation'), reviewCorrectAnswer: el('reviewCorrectAnswer'), reviewAnswerDetails: el('reviewAnswerDetails'), reviewRevealBtn: el('reviewRevealBtn'), reviewAudio: el('reviewAudio'), reviewPrevBtn: el('reviewPrevBtn'), reviewNextBtn: el('reviewNextBtn'), reviewCounter: el('reviewCounter'),
    testIntroDialog: el('testIntroDialog'), closeTestIntro: el('closeTestIntro'), cancelTestStart: el('cancelTestStart'), startTestBtn: el('startTestBtn'),
    testResultDialog: el('testResultDialog'), testResultSubtitle: el('testResultSubtitle'), testResultContent: el('testResultContent'), closeTestResult: el('closeTestResult'), reviewStatsAfterTest: el('reviewStatsAfterTest'), returnToStudy: el('returnToStudy'),
    glossaryTermDialog: el('glossaryTermDialog'), closeGlossaryTerm: el('closeGlossaryTerm'), glossaryTermTitle: el('glossaryTermTitle'), glossaryTermPronunciation: el('glossaryTermPronunciation'), glossaryTermIpa: el('glossaryTermIpa'), glossaryTermDefinition: el('glossaryTermDefinition'), glossarySpeakBtn: el('glossarySpeakBtn'), glossaryTermCategoriesWrap: el('glossaryTermCategoriesWrap'), glossaryTermCategories: el('glossaryTermCategories')
  };

  let state = loadState();
  let mode = state.activeTest ? 'test' : 'study';
  let activeQuestionTickStart = null;
  let studyTickStart = null;
  let timerInterval = null;
  let deferredInstallPrompt = null;
  let lastFinishedTest = null;
  let reviewContext = null;
  let audioLibrary = [];
  let audioTrackIndex = -1;
  let audioObjectUrl = null;
  let audioDbPromise = null;
  let audioLibraryLoaded = false;
  let lastAudioPersistAt = 0;
  let activeTranscriptIndex = -1;
  let miniAudioStopped = true;
  let cachedAudioUrls = new Set();
  let transcriptExpanded = true;
  let activeMaterialsTab = 'audio';
  const materialsScrollByTab = { audio: 0, glossary: 0, downloads: 0 };
  let glossaryPronunciationAudio = null;
  let resumeCourseAudioAfterGlossary = false;
  let analyticsFlushInFlight = false;
  let analyticsAssistKey = null;
  let analyticsAssist = { audioUsed: false, glossaryUsed: false };
  const dialogs = [dom.categoriesDialog, dom.materialsDialog, dom.statsDialog, dom.questionReviewDialog, dom.testIntroDialog, dom.testResultDialog, dom.installGuideDialog, dom.glossaryTermDialog].filter(Boolean);

  function analyticsSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(ANALYTICS_SETTINGS_KEY) || '{}');
      return { enabled: saved.enabled !== false };
    } catch (_) {
      return { enabled: true };
    }
  }

  function analyticsEnabled() {
    return analyticsSettings().enabled;
  }

  function setAnalyticsEnabled(enabled) {
    try { localStorage.setItem(ANALYTICS_SETTINGS_KEY, JSON.stringify({ enabled: !!enabled })); } catch (_) {}
    if (!enabled) {
      try { localStorage.removeItem(ANALYTICS_QUEUE_KEY); } catch (_) {}
    } else {
      void flushAnalyticsQueue();
    }
    updateAnalyticsUi();
  }

  function updateAnalyticsUi() {
    const enabled = analyticsEnabled();
    if (dom.analyticsToggle) dom.analyticsToggle.checked = enabled;
    if (dom.analyticsStatus) dom.analyticsStatus.textContent = enabled
      ? 'On · anonymous question results, glossary-term opens, and broad IP-derived location are shared.'
      : 'Off · future study statistics will stay on this device.';
  }

  function analyticsInstallationId() {
    let id = '';
    try { id = localStorage.getItem(ANALYTICS_INSTALLATION_KEY) || ''; } catch (_) {}
    if (id) return id;
    id = (crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
    try { localStorage.setItem(ANALYTICS_INSTALLATION_KEY, id); } catch (_) {}
    return id;
  }

  function analyticsQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveAnalyticsQueue(queue) {
    try { localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-ANALYTICS_MAX_QUEUE))); } catch (_) {}
  }

  function responseTimeBucket(ms) {
    const seconds = Math.max(0, Number(ms) || 0) / 1000;
    if (seconds < 10) return '<10s';
    if (seconds < 30) return '10–29s';
    if (seconds < 60) return '30–59s';
    if (seconds < 120) return '1–2m';
    if (seconds < 300) return '2–5m';
    return '5m+';
  }

  function currentAnalyticsEntryKey() {
    if (mode === 'test' && state.activeTest) return `test:${state.activeTest.id}:${state.activeTest.index}`;
    return `study:${state.study.index}`;
  }

  function syncAnalyticsAssist() {
    const key = currentAnalyticsEntryKey();
    if (key === analyticsAssistKey) return;
    analyticsAssistKey = key;
    analyticsAssist = { audioUsed: false, glossaryUsed: false };
  }

  function markAnalyticsAssist(kind) {
    const entry = currentEntry();
    if (!entry || entry.answered) return;
    syncAnalyticsAssist();
    if (kind === 'audio') analyticsAssist.audioUsed = true;
    if (kind === 'glossary') analyticsAssist.glossaryUsed = true;
  }

  function queueGlossaryAnalytics(entry, source = 'other') {
    if (!analyticsEnabled() || !entry?.id || !entry?.term) return;
    const q = source === 'question' ? currentQuestion() : null;
    const event = {
      kind: 'glossary',
      eventId: crypto?.randomUUID?.() || `gls-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      appVersion: String(APP_VERSION),
      clientTs: new Date().toISOString(),
      termId: entry.id,
      term: entry.term,
      source: ['question', 'materials'].includes(source) ? source : 'other',
      questionId: q?.id || null,
      mode
    };
    const queue = analyticsQueue();
    queue.push(event);
    saveAnalyticsQueue(queue);
    void flushAnalyticsQueue();
  }

  function queueAnswerAnalytics({ q, selected, result, credit, elapsedMs, attemptNumber }) {
    if (!analyticsEnabled() || !q) return;
    syncAnalyticsAssist();
    const event = {
      eventId: crypto?.randomUUID?.() || `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      appVersion: String(APP_VERSION),
      clientTs: new Date().toISOString(),
      questionId: q.id,
      mode,
      attemptNumber: Math.max(1, Number(attemptNumber) || 1),
      result,
      credit: Math.max(0, Math.min(1, Number(credit) || 0)),
      selected: [...selected],
      responseTimeBucket: responseTimeBucket(elapsedMs),
      audioUsed: !!analyticsAssist.audioUsed,
      glossaryUsed: !!analyticsAssist.glossaryUsed
    };
    const queue = analyticsQueue();
    queue.push(event);
    saveAnalyticsQueue(queue);
    analyticsAssist = { audioUsed: false, glossaryUsed: false };
    void flushAnalyticsQueue();
  }

  async function flushAnalyticsQueue() {
    if (!analyticsEnabled() || analyticsFlushInFlight || !navigator.onLine) return;
    const queue = analyticsQueue();
    if (!queue.length) return;
    analyticsFlushInFlight = true;
    let uploaded = false;
    const batch = queue.slice(0, 50);
    try {
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-SCP-Analytics-Version': '1' },
        body: JSON.stringify({ events: batch }),
        keepalive: batch.length <= 10
      });
      if (!response.ok) throw new Error(`Analytics upload failed (${response.status})`);
      const ids = new Set(batch.map(item => item.eventId));
      saveAnalyticsQueue(analyticsQueue().filter(item => !ids.has(item.eventId)));
      uploaded = true;
    } catch (err) {
      console.warn('Anonymous analytics upload deferred:', err);
    } finally {
      analyticsFlushInFlight = false;
      if (uploaded && analyticsEnabled() && navigator.onLine && analyticsQueue().length) setTimeout(() => void flushAnalyticsQueue(), 250);
    }
  }

  function defaultQuestionStats() {
    return { shown: 0, attempts: 0, correct: 0, partial: 0, incorrect: 0, pointsEarned: 0, totalTimeMs: 0, lastResult: null, lastSeen: null, lastAnswered: null };
  }

  function defaultState() {
    const stats = {};
    QUESTIONS.forEach(q => { stats[q.id] = defaultQuestionStats(); });
    return {
      version: APP_VERSION,
      stats,
      filters: [...categories],
      study: { history: [], index: -1, sessionElapsedMs: 0 },
      tests: [],
      activeTest: null
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (err) {
      console.warn('Could not load saved progress:', err);
      return defaultState();
    }
  }

  function normalizeState(saved) {
    const fresh = defaultState();
    if (!saved || typeof saved !== 'object') return fresh;
    fresh.filters = Array.isArray(saved.filters) ? saved.filters.filter(c => categories.includes(c)) : [...categories];
    if (!fresh.filters.length) fresh.filters = [...categories];
    fresh.study = {
      history: Array.isArray(saved.study?.history) ? saved.study.history.filter(h => questionById.has(h.qid)) : [],
      index: Number.isInteger(saved.study?.index) ? saved.study.index : -1,
      sessionElapsedMs: Math.max(0, Number(saved.study?.sessionElapsedMs) || 0)
    };
    if (fresh.study.history.length) fresh.study.index = Math.min(Math.max(0, fresh.study.index), fresh.study.history.length - 1);
    else fresh.study.index = -1;

    for (const q of QUESTIONS) {
      const s = saved.stats?.[q.id] || {};
      fresh.stats[q.id] = {
        ...defaultQuestionStats(),
        shown: Math.max(0, Number(s.shown) || 0),
        attempts: Math.max(0, Number(s.attempts) || 0),
        correct: Math.max(0, Number(s.correct) || 0),
        partial: Math.max(0, Number(s.partial) || 0),
        incorrect: Math.max(0, Number(s.incorrect) || 0),
        pointsEarned: Math.max(0, Number(s.pointsEarned) || 0),
        totalTimeMs: Math.max(0, Number(s.totalTimeMs) || 0),
        lastResult: ['correct','partial','incorrect'].includes(s.lastResult) ? s.lastResult : null,
        lastSeen: Number(s.lastSeen) || null,
        lastAnswered: Number(s.lastAnswered) || null
      };
    }
    fresh.tests = Array.isArray(saved.tests) ? saved.tests.slice(-30) : [];
    fresh.activeTest = normalizeActiveTest(saved.activeTest);
    return fresh;
  }

  function normalizeActiveTest(t) {
    if (!t || !Array.isArray(t.order) || t.order.length !== QUESTIONS.length) return null;
    const validIds = new Set(QUESTIONS.map(q => q.id));
    if (!t.order.every(id => validIds.has(id))) return null;
    const items = {};
    t.order.forEach(id => {
      const x = t.items?.[id] || {};
      items[id] = {
        viewed: !!x.viewed,
        selected: Array.isArray(x.selected) ? x.selected.filter(v => LETTERS.includes(v)) : [],
        answered: !!x.answered,
        result: ['correct','partial','incorrect'].includes(x.result) ? x.result : null,
        credit: Math.max(0, Math.min(1, Number(x.credit) || 0)),
        elapsedMs: Math.max(0, Number(x.elapsedMs) || 0)
      };
    });
    return {
      id: t.id || `test-${Date.now()}`,
      order: [...t.order],
      index: Math.min(Math.max(0, Number(t.index) || 0), QUESTIONS.length - 1),
      startedAt: Number(t.startedAt) || Date.now(),
      endTime: Number(t.endTime) || (Date.now() + TEST_DURATION_MS),
      items
    };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (err) { console.warn('Could not save progress:', err); }
  }

  function formatDuration(ms, showHours = true) {
    ms = Math.max(0, Math.floor(ms));
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return showHours || h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function formatAnswerTime(ms) {
    const sec = ms / 1000;
    if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0)}s`;
    return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getStudyEntry() {
    return state.study.history[state.study.index] || null;
  }

  function getTestEntry() {
    if (!state.activeTest) return null;
    const qid = state.activeTest.order[state.activeTest.index];
    return state.activeTest.items[qid];
  }

  function currentQuestion() {
    if (mode === 'test' && state.activeTest) return questionById.get(state.activeTest.order[state.activeTest.index]);
    const entry = getStudyEntry();
    return entry ? questionById.get(entry.qid) : null;
  }

  function currentEntry() {
    return mode === 'test' ? getTestEntry() : getStudyEntry();
  }

  function flushQuestionTime() {
    if (activeQuestionTickStart == null) return;
    const entry = currentEntry();
    if (entry && !entry.answered) entry.elapsedMs = (entry.elapsedMs || 0) + (Date.now() - activeQuestionTickStart);
    activeQuestionTickStart = null;
    saveState();
  }

  function beginQuestionTimeIfNeeded() {
    const entry = currentEntry();
    if (document.visibilityState === 'visible' && entry && !entry.answered && activeQuestionTickStart == null) activeQuestionTickStart = Date.now();
  }

  function flushStudyTime() {
    if (studyTickStart == null) return;
    state.study.sessionElapsedMs += Date.now() - studyTickStart;
    studyTickStart = null;
    saveState();
  }

  function beginStudyTimeIfNeeded() {
    if (mode === 'study' && document.visibilityState === 'visible' && studyTickStart == null) studyTickStart = Date.now();
  }

  function studyElapsedNow() {
    return state.study.sessionElapsedMs + (studyTickStart == null ? 0 : Date.now() - studyTickStart);
  }

  function weightedPick() {
    const eligible = QUESTIONS.filter(q => state.filters.includes(q.category));
    const pool = eligible.length ? eligible : QUESTIONS;
    const recentIds = state.study.history.slice(-4).map(h => h.qid);
    const now = Date.now();
    const weighted = pool.map(q => {
      const s = state.stats[q.id] || defaultQuestionStats();
      let w;
      if (s.attempts === 0) w = s.shown ? 7.5 : 10;
      else if (s.lastResult === 'incorrect') w = 7;
      else if (s.lastResult === 'partial') w = 4.8;
      else w = 1.8;

      const avgSec = s.attempts ? (s.totalTimeMs / s.attempts) / 1000 : 30;
      if (s.lastResult === 'correct') {
        if (avgSec <= 12) w *= 0.38;
        else if (avgSec <= 25) w *= 0.7;
        else if (avgSec >= 60) w *= 1.65;
        else if (avgSec >= 40) w *= 1.3;
      } else if (avgSec >= 45) {
        w *= 1.2;
      }

      if (s.lastAnswered) {
        const ageMin = (now - s.lastAnswered) / 60000;
        if (ageMin < 3) w *= 0.12;
        else if (ageMin < 15) w *= 0.28;
        else if (ageMin < 60) w *= 0.55;
        else if (ageMin > 3 * 24 * 60) w *= 1.45;
        else if (ageMin > 24 * 60) w *= 1.2;
      }
      const recentIndex = recentIds.lastIndexOf(q.id);
      if (recentIndex >= 0) w *= [0.18, 0.28, 0.45, 0.65][recentIndex] || 0.5;
      if (s.lastResult === 'correct' && s.correct >= 3) w /= Math.sqrt(Math.min(s.correct, 9));
      return { q, w: Math.max(0.03, w) };
    });
    const total = weighted.reduce((sum, x) => sum + x.w, 0);
    let r = Math.random() * total;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) return x.q;
    }
    return weighted[weighted.length - 1].q;
  }

  function appendStudyQuestion(q = weightedPick()) {
    const entry = { qid: q.id, selected: [], answered: false, result: null, credit: 0, elapsedMs: 0 };
    state.study.history = state.study.history.slice(0, state.study.index + 1);
    state.study.history.push(entry);
    state.study.index = state.study.history.length - 1;
    markQuestionShown(q.id);
    saveState();
  }

  function markQuestionShown(qid) {
    const s = state.stats[qid];
    s.shown += 1;
    s.lastSeen = Date.now();
  }

  function ensureCurrentQuestion() {
    if (mode === 'study' && !getStudyEntry()) appendStudyQuestion();
    if (mode === 'test' && state.activeTest) {
      const qid = state.activeTest.order[state.activeTest.index];
      const item = state.activeTest.items[qid];
      if (!item.viewed) {
        item.viewed = true;
        markQuestionShown(qid);
        saveState();
      }
    }
  }

  function evaluateAnswer(q, selected) {
    const chosen = [...new Set(selected)].sort();
    const correct = [...q.answer].sort();
    const exact = chosen.length === correct.length && chosen.every((v, i) => v === correct[i]);
    if (exact) return { result: 'correct', credit: 1 };
    const intersection = chosen.filter(v => correct.includes(v)).length;
    if (q.type === 'multi' && intersection > 0) {
      const wrongSelected = chosen.filter(v => !correct.includes(v)).length;
      const credit = Math.max(0, Math.min(.99, intersection / (correct.length + wrongSelected)));
      return { result: 'partial', credit };
    }
    return { result: 'incorrect', credit: 0 };
  }

  function updateQuestionStats(qid, result, credit, elapsedMs) {
    const s = state.stats[qid];
    s.attempts += 1;
    s[result] += 1;
    s.pointsEarned += credit;
    s.totalTimeMs += elapsedMs;
    s.lastResult = result;
    s.lastAnswered = Date.now();
  }

  function selectedFromForm() {
    return [...dom.answerForm.querySelectorAll('input:checked')].map(i => i.value);
  }

  function setGlossaryText(target, value) {
    if (!target) return;
    const text = String(value ?? '');
    target.textContent = '';
    if (!glossaryPattern || !text) {
      target.textContent = text;
      return;
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    glossaryPattern.lastIndex = 0;
    let match;
    while ((match = glossaryPattern.exec(text))) {
      const prefix = match[1] || '';
      const matchedText = match[2] || '';
      const termStart = match.index + prefix.length;
      if (termStart > cursor) fragment.append(document.createTextNode(text.slice(cursor, termStart)));
      const entry = glossaryAliasLookup.get(matchedText.toLocaleLowerCase());
      if (entry) {
        const term = document.createElement('span');
        term.className = 'glossary-term';
        term.dataset.glossaryId = entry.id;
        term.setAttribute('role', 'button');
        term.setAttribute('tabindex', '0');
        term.setAttribute('aria-label', `${matchedText}: show pronunciation and definition`);
        term.title = 'Show pronunciation and definition';
        term.textContent = matchedText;
        fragment.append(term);
      } else {
        fragment.append(document.createTextNode(matchedText));
      }
      cursor = termStart + matchedText.length;
      if (glossaryPattern.lastIndex <= match.index) glossaryPattern.lastIndex = match.index + match[0].length;
    }
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    target.append(fragment);
  }

  function glossaryCategories(entry) {
    if (!entry) return [];
    if (glossaryCategoryCache.has(entry.id)) return glossaryCategoryCache.get(entry.id);
    const aliases = [...new Set([entry.term, ...(entry.aliases || [])].filter(Boolean))]
      .map(value => String(value).toLocaleLowerCase());
    const linked = new Set(GLOSSARY_CATEGORY_LINKS[entry.id] || []);
    QUESTIONS.forEach(q => {
      const questionText = [q.prompt, ...(q.choices || []), q.explanation].join(' ').toLocaleLowerCase();
      if (aliases.some(alias => alias && questionText.includes(alias))) linked.add(q.category);
    });
    const result = categories.filter(category => linked.has(category));
    glossaryCategoryCache.set(entry.id, result);
    return result;
  }

  function makeGlossaryCategoryButton(category) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'glossary-category-chip';
    btn.dataset.glossaryCategory = category;
    btn.textContent = category;
    btn.setAttribute('aria-label', `Open ${category} questions`);
    return btn;
  }

  function renderGlossaryCategoryButtons(container, entry) {
    if (!container) return 0;
    container.textContent = '';
    const linked = glossaryCategories(entry);
    linked.forEach(category => container.append(makeGlossaryCategoryButton(category)));
    return linked.length;
  }

  function openGlossaryEntry(entryOrId, source = 'other') {
    flushQuestionTime();
    markAnalyticsAssist('glossary');
    const entry = typeof entryOrId === 'string' ? glossaryById.get(entryOrId) : entryOrId;
    if (!entry || !dom.glossaryTermDialog) return;
    queueGlossaryAnalytics(entry, source);
    activeGlossaryEntry = entry;
    dom.glossaryTermTitle.textContent = entry.term;
    dom.glossaryTermPronunciation.textContent = entry.pronunciation;
    if (dom.glossaryTermIpa) dom.glossaryTermIpa.textContent = entry.ipa ? `IPA /${entry.ipa}/` : '';
    dom.glossaryTermDefinition.textContent = entry.definition;
    const linkedCount = renderGlossaryCategoryButtons(dom.glossaryTermCategories, entry);
    dom.glossaryTermCategoriesWrap?.classList.toggle('hidden', linkedCount === 0);
    dom.glossarySpeakBtn?.classList.toggle('hidden', !entry.id);
    if (!dom.glossaryTermDialog.open) dom.glossaryTermDialog.showModal();
  }

  function glossaryAudioPath(entry) {
    return entry?.id ? `glossary-audio/glossary-${entry.id}.mp3` : '';
  }

  function resetGlossaryHearButton() {
    if (!dom.glossarySpeakBtn) return;
    dom.glossarySpeakBtn.disabled = false;
    dom.glossarySpeakBtn.textContent = '▶ Hear';
  }

  function stopGlossaryPronunciation({ resumeCourseAudio = false } = {}) {
    if (glossaryPronunciationAudio) {
      glossaryPronunciationAudio.pause();
      glossaryPronunciationAudio.removeAttribute('src');
      glossaryPronunciationAudio.load();
      glossaryPronunciationAudio = null;
    }
    resetGlossaryHearButton();
    if (resumeCourseAudio && resumeCourseAudioAfterGlossary && dom.audioPlayer?.src && dom.audioPlayer.paused) {
      void dom.audioPlayer.play().catch(() => {});
    }
    resumeCourseAudioAfterGlossary = false;
  }

  function playActiveGlossaryEntry() {
    if (!activeGlossaryEntry) return;
    const src = glossaryAudioPath(activeGlossaryEntry);
    if (!src) return;

    stopGlossaryPronunciation();
    resumeCourseAudioAfterGlossary = Boolean(dom.audioPlayer?.src && !dom.audioPlayer.paused);
    if (resumeCourseAudioAfterGlossary) dom.audioPlayer.pause();

    const audio = new Audio(src);
    glossaryPronunciationAudio = audio;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    if (dom.glossarySpeakBtn) {
      dom.glossarySpeakBtn.disabled = true;
      dom.glossarySpeakBtn.textContent = 'Playing…';
    }

    const finish = () => {
      if (glossaryPronunciationAudio !== audio) return;
      glossaryPronunciationAudio = null;
      resetGlossaryHearButton();
      if (resumeCourseAudioAfterGlossary && dom.audioPlayer?.src && dom.audioPlayer.paused) {
        void dom.audioPlayer.play().catch(() => {});
      }
      resumeCourseAudioAfterGlossary = false;
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', () => {
      finish();
      if (dom.glossarySpeakBtn) {
        dom.glossarySpeakBtn.textContent = 'Audio unavailable';
        setTimeout(resetGlossaryHearButton, 1800);
      }
    }, { once: true });
    void audio.play().catch(() => {
      finish();
      if (dom.glossarySpeakBtn) {
        dom.glossarySpeakBtn.textContent = 'Tap again';
        setTimeout(resetGlossaryHearButton, 1500);
      }
    });
  }

  function glossaryMatches(entry, rawQuery) {
    const query = String(rawQuery || '').trim().toLocaleLowerCase();
    if (!query) return true;
    const haystack = [entry.term, entry.pronunciation, entry.ipa || '', entry.definition, ...(entry.aliases || []), ...glossaryCategories(entry)].join(' ').toLocaleLowerCase();
    return query.split(/\s+/).filter(Boolean).every(token => haystack.includes(token));
  }

  function renderGlossary(rawQuery = '') {
    if (!dom.glossaryList) return;
    const all = typeof GLOSSARY_TERMS !== 'undefined' ? GLOSSARY_TERMS : [];
    const matches = all.filter(entry => glossaryMatches(entry, rawQuery));
    dom.glossaryList.textContent = '';
    const fragment = document.createDocumentFragment();
    matches.forEach(entry => {
      const card = document.createElement('article');
      card.className = 'glossary-item';

      const top = document.createElement('div');
      top.className = 'glossary-item-top';
      const term = document.createElement('button');
      term.type = 'button';
      term.className = 'glossary-item-term';
      term.dataset.glossaryId = entry.id;
      term.textContent = entry.term;
      const pronunciation = document.createElement('span');
      pronunciation.className = 'glossary-item-pronunciation';
      pronunciation.textContent = entry.ipa ? `${entry.pronunciation} · /${entry.ipa}/` : entry.pronunciation;
      top.append(term, pronunciation);

      const definition = document.createElement('p');
      definition.textContent = entry.definition;
      card.append(top, definition);

      const linked = glossaryCategories(entry);
      if (linked.length) {
        const categoryWrap = document.createElement('div');
        categoryWrap.className = 'glossary-item-categories';
        const label = document.createElement('span');
        label.className = 'glossary-item-categories-label';
        label.textContent = 'Questions';
        const links = document.createElement('div');
        links.className = 'glossary-category-links';
        linked.forEach(category => links.append(makeGlossaryCategoryButton(category)));
        categoryWrap.append(label, links);
        card.append(categoryWrap);
      }
      fragment.append(card);
    });
    dom.glossaryList.append(fragment);
    dom.glossaryCount.textContent = `${matches.length} term${matches.length === 1 ? '' : 's'}`;
    dom.glossaryEmpty?.classList.toggle('hidden', matches.length !== 0);
    dom.glossarySearchClear?.classList.toggle('hidden', !String(rawQuery || '').trim());
  }

  function openGlossaryCategory(category) {
    if (!category || !categories.includes(category)) return;
    if (dom.glossaryTermDialog?.open) dom.glossaryTermDialog.close();
    if (dom.materialsDialog?.open) dom.materialsDialog.close();
    openQuestionReviewCategory(category);
  }

  function scrollToQuestionTop() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  function scrollQuestionReviewToTop() {
    const scroller = dom.questionReviewDialog?.querySelector('.modal-inner');
    if (!scroller) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    requestAnimationFrame(() => scroller.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  function submitCurrentAnswer() {
    const q = currentQuestion();
    const entry = currentEntry();
    if (!q || !entry || entry.answered) return;
    const selected = selectedFromForm();
    if (!selected.length) {
      dom.saveNote.textContent = 'Choose an answer before submitting.';
      setTimeout(() => dom.saveNote.textContent = 'Progress is saved automatically on this device. Tip: use ← and → to move, number keys to choose answers, and Enter to submit.', 1800);
      return;
    }
    flushQuestionTime();
    entry.selected = selected;
    const { result, credit } = evaluateAnswer(q, selected);
    entry.answered = true;
    entry.result = result;
    entry.credit = credit;
    const attemptNumber = (state.stats[q.id]?.attempts || 0) + 1;
    queueAnswerAnalytics({ q, selected, result, credit, elapsedMs: entry.elapsedMs || 0, attemptNumber });
    updateQuestionStats(q.id, result, credit, entry.elapsedMs || 0);
    saveState();
    render();
  }

  function render() {
    ensureCurrentQuestion();
    const q = currentQuestion();
    const entry = currentEntry();
    if (!q || !entry) return;
    syncAnalyticsAssist();

    dom.modeLabel.textContent = mode === 'test' ? 'Practice test' : 'Study mode';
    dom.timerLabel.textContent = mode === 'test' ? 'Time left' : 'Session';
    dom.timerCard.classList.toggle('is-clickable', mode === 'study');
    dom.timerCard.setAttribute('title', mode === 'study' ? 'Click to reset the study session timer' : 'Practice test countdown');
    dom.timerCard.setAttribute('aria-label', mode === 'study' ? 'Study session timer. Click to reset.' : 'Practice test countdown timer');
    dom.testBtn.textContent = mode === 'test' ? 'Exit test' : 'Test mode';
    dom.categoriesBtn.disabled = mode === 'test';
    dom.statsBtn.disabled = mode === 'test';
    dom.testProgressWrap.classList.toggle('hidden', mode !== 'test');

    if (mode === 'test') {
      const t = state.activeTest;
      const answered = t.order.filter(id => t.items[id].answered).length;
      dom.testQuestionCount.textContent = `${t.index + 1}/${QUESTIONS.length}`;
      dom.testAnsweredCount.textContent = `${answered} answered`;
      dom.testProgressFill.style.width = `${((t.index + 1) / QUESTIONS.length) * 100}%`;
      dom.questionNumber.textContent = `Question ${t.index + 1} of ${QUESTIONS.length}`;
    } else {
      dom.questionNumber.textContent = `Question ${q.id}`;
    }
    dom.questionCategory.textContent = q.category;
    setGlossaryText(dom.questionPrompt, q.prompt);
    dom.multiNote.classList.toggle('hidden', q.type !== 'multi');
    renderRelevantAudio(q.id, dom.questionAudio, mode !== 'test' || !!entry.answered);

    const status = entry.answered ? entry.result : 'unanswered';
    dom.questionStatus.textContent = status === 'unanswered' ? 'Unanswered' : status[0].toUpperCase() + status.slice(1);
    dom.questionStatus.className = `status-chip ${status === 'unanswered' ? '' : status}`.trim();
    [dom.questionNumber, dom.questionPrompt, dom.questionCategory].forEach(node => {
      node.classList.toggle('explorer-link', !!entry.answered);
      node.tabIndex = entry.answered ? 0 : -1;
      node.setAttribute('aria-disabled', entry.answered ? 'false' : 'true');
    });

    renderChoices(q, entry);
    renderFeedback(q, entry);
    renderNav(entry);
    saveState();
    beginQuestionTimeIfNeeded();
    beginStudyTimeIfNeeded();
  }

  function renderChoices(q, entry) {
    dom.answerForm.innerHTML = '';
    const inputType = q.type === 'multi' ? 'checkbox' : 'radio';
    q.choices.forEach((choiceText, idx) => {
      const letter = LETTERS[idx];
      const label = document.createElement('label');
      label.className = 'choice';
      if (entry.selected?.includes(letter)) label.classList.add('selected');
      if (entry.answered) {
        label.classList.add('locked');
        if (q.answer.includes(letter)) label.classList.add('correct-choice');
        else if (entry.selected?.includes(letter)) label.classList.add('wrong-choice');
      }
      const input = document.createElement('input');
      input.type = inputType;
      input.name = 'answer';
      input.value = letter;
      input.checked = entry.selected?.includes(letter) || false;
      input.disabled = !!entry.answered;
      input.setAttribute('aria-label', `Choice ${letter}`);

      const line = document.createElement('span');
      line.className = 'choice-line';
      const badge = document.createElement('span');
      badge.className = 'choice-letter';
      badge.textContent = letter;
      const textSpan = document.createElement('span');
      textSpan.className = 'choice-text';
      setGlossaryText(textSpan, choiceText);
      line.append(badge, textSpan);
      label.append(input, line);
      dom.answerForm.append(label);
    });

    dom.answerForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        const e = currentEntry();
        if (!e || e.answered) return;
        e.selected = selectedFromForm();
        dom.answerForm.querySelectorAll('.choice').forEach(l => {
          const i = l.querySelector('input');
          l.classList.toggle('selected', i.checked);
        });
        saveState();
      });
    });
  }

  function renderFeedback(q, entry) {
    dom.feedbackBox.className = 'feedback hidden';
    if (!entry.answered) return;
    dom.feedbackBox.className = `feedback ${entry.result}`;
    dom.feedbackResult.textContent = entry.result === 'correct' ? 'Correct' : entry.result === 'partial' ? 'Partially correct' : 'Incorrect';
    dom.feedbackTime.textContent = `Answered in ${formatAnswerTime(entry.elapsedMs || 0)}`;
    dom.feedbackCategory.textContent = `Category: ${q.category}`;
    setGlossaryText(dom.feedbackExplanation, q.explanation);
    dom.correctAnswerLine.textContent = `Correct answer${q.answer.length > 1 ? 's' : ''}: ${q.answer.join(', ')}`;
  }

  function renderNav(entry) {
    if (mode === 'study') {
      dom.prevBtn.disabled = state.study.index <= 0;
      dom.nextBtn.disabled = false;
      dom.nextBtn.textContent = state.study.index < state.study.history.length - 1 ? 'Next →' : 'Next question →';
    } else {
      const t = state.activeTest;
      const answered = t.order.filter(id => t.items[id].answered).length;
      dom.prevBtn.disabled = t.index <= 0;
      dom.nextBtn.disabled = false;
      if (answered === QUESTIONS.length) dom.nextBtn.textContent = 'Finish test →';
      else if (t.index === QUESTIONS.length - 1) dom.nextBtn.textContent = 'Next unanswered →';
      else dom.nextBtn.textContent = 'Next →';
    }
    dom.submitBtn.disabled = !!entry.answered;
    dom.submitBtn.textContent = entry.answered ? 'Submitted' : 'Submit answer';
  }

  function goPrevious() {
    flushQuestionTime();
    if (mode === 'study') {
      if (state.study.index > 0) state.study.index -= 1;
    } else if (state.activeTest?.index > 0) {
      state.activeTest.index -= 1;
    }
    saveState();
    render();
  }

  function goNext() {
    flushQuestionTime();
    if (mode === 'study') {
      if (state.study.index < state.study.history.length - 1) state.study.index += 1;
      else appendStudyQuestion();
      render();
      scrollToQuestionTop();
      return;
    }

    const t = state.activeTest;
    if (!t) return;
    const answered = t.order.filter(id => t.items[id].answered).length;
    if (answered === QUESTIONS.length) {
      finishTest('completed');
      return;
    }
    if (t.index < QUESTIONS.length - 1) {
      t.index += 1;
    } else {
      const firstUnanswered = t.order.findIndex(id => !t.items[id].answered);
      if (firstUnanswered >= 0) t.index = firstUnanswered;
    }
    saveState();
    render();
    scrollToQuestionTop();
  }

  function openCategories() {
    flushQuestionTime();
    dom.categoryOptions.innerHTML = '';
    categories.forEach((cat, idx) => {
      const label = document.createElement('label');
      label.className = 'category-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = cat;
      input.checked = state.filters.includes(cat);
      input.id = `cat-${idx}`;
      const span = document.createElement('span');
      span.textContent = cat;
      label.append(input, span);
      dom.categoryOptions.append(label);
    });
    dom.categoriesDialog.showModal();
  }

  function applyCategories() {
    const selected = [...dom.categoryOptions.querySelectorAll('input:checked')].map(i => i.value);
    if (!selected.length) {
      alert('Select at least one category.');
      return;
    }
    state.filters = selected;
    saveState();
    dom.categoriesDialog.close();
  }

  function startTest() {
    flushQuestionTime();
    flushStudyTime();
    const order = shuffle(QUESTIONS.map(q => q.id));
    const items = {};
    order.forEach(id => { items[id] = { viewed: false, selected: [], answered: false, result: null, credit: 0, elapsedMs: 0 }; });
    const now = Date.now();
    state.activeTest = { id: `test-${now}`, order, index: 0, startedAt: now, endTime: now + TEST_DURATION_MS, items };
    mode = 'test';
    saveState();
    if (dom.testIntroDialog.open) dom.testIntroDialog.close();
    render();
  }

  function requestExitTest() {
    if (!state.activeTest) return;
    const answered = state.activeTest.order.filter(id => state.activeTest.items[id].answered).length;
    const msg = `Exit the practice test now? ${answered} of ${QUESTIONS.length} questions have been submitted. This attempt will be saved as incomplete.`;
    if (confirm(msg)) finishTest('exited');
  }

  function buildTestResult(t, reason) {
    const endedAt = Date.now();
    const itemRows = t.order.map(id => ({ q: questionById.get(id), item: t.items[id] }));
    let correct = 0, partial = 0, incorrect = 0, unanswered = 0, points = 0, answeredTime = 0, answeredCount = 0;
    const perCategory = {};
    categories.forEach(c => perCategory[c] = { total: 0, correct: 0, partial: 0, incorrect: 0, unanswered: 0, points: 0, timeMs: 0, answered: 0 });
    for (const {q, item} of itemRows) {
      const c = perCategory[q.category];
      c.total += 1;
      if (!item.answered) { unanswered += 1; c.unanswered += 1; continue; }
      answeredCount += 1;
      answeredTime += item.elapsedMs || 0;
      c.answered += 1;
      c.timeMs += item.elapsedMs || 0;
      points += item.credit || 0;
      c.points += item.credit || 0;
      if (item.result === 'correct') { correct += 1; c.correct += 1; }
      else if (item.result === 'partial') { partial += 1; c.partial += 1; }
      else { incorrect += 1; c.incorrect += 1; }
    }
    const elapsed = Math.min(TEST_DURATION_MS, Math.max(0, endedAt - t.startedAt));
    return {
      id: t.id,
      date: endedAt,
      reason,
      completed: reason === 'completed',
      scorePct: (points / QUESTIONS.length) * 100,
      points,
      correct,
      partial,
      incorrect,
      unanswered,
      answeredCount,
      avgAnswerTimeMs: answeredCount ? answeredTime / answeredCount : 0,
      totalTimeMs: elapsed,
      perCategory
    };
  }

  function finishTest(reason) {
    if (!state.activeTest) return;
    flushQuestionTime();
    const result = buildTestResult(state.activeTest, reason);
    state.tests.push(result);
    state.tests = state.tests.slice(-30);
    state.activeTest = null;
    mode = 'study';
    lastFinishedTest = result;
    saveState();
    beginStudyTimeIfNeeded();
    render();
    showTestResult(result);
  }

  function showTestResult(result) {
    dom.testResultSubtitle.textContent = result.completed
      ? `Completed ${new Date(result.date).toLocaleString()}`
      : result.reason === 'time'
        ? `Time expired — ${new Date(result.date).toLocaleString()}`
        : `Exited early — ${new Date(result.date).toLocaleString()}`;

    const categoryRows = Object.entries(result.perCategory).map(([cat, x]) => {
      const pct = x.total ? (x.points / x.total) * 100 : 0;
      const avg = x.answered ? formatAnswerTime(x.timeMs / x.answered) : '—';
      return `<tr><td>${escapeHtml(cat)}</td><td>${pct.toFixed(0)}%</td><td>${x.correct}</td><td>${x.partial}</td><td>${x.incorrect}</td><td>${x.unanswered}</td><td>${avg}</td></tr>`;
    }).join('');

    dom.testResultContent.innerHTML = `
      <div class="stat-grid">
        ${statCard('Score', `${result.scorePct.toFixed(1)}%`)}
        ${statCard('Correct', result.correct)}
        ${statCard('Partial', result.partial)}
        ${statCard('Incorrect', result.incorrect)}
        ${statCard('Unanswered', result.unanswered)}
      </div>
      <div class="stat-grid">
        ${statCard('Time used', formatDuration(result.totalTimeMs))}
        ${statCard('Avg answer', result.answeredCount ? formatAnswerTime(result.avgAnswerTimeMs) : '—')}
      </div>
      <div class="stat-section">
        <h3>By category</h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Category</th><th>Score</th><th>Correct</th><th>Partial</th><th>Wrong</th><th>Unanswered</th><th>Avg time</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table></div>
      </div>`;
    flushQuestionTime();
    if (!dom.testResultDialog.open) dom.testResultDialog.showModal();
  }

  function statCard(label, value) {
    return `<div class="stat-card"><div class="label">${escapeHtml(String(label))}</div><div class="value">${escapeHtml(String(value))}</div></div>`;
  }

  function currentMasteryCounts() {
    const counts = { asked: 0, correct: 0, partial: 0, incorrect: 0, unanswered: 0 };
    for (const q of QUESTIONS) {
      const s = state.stats[q.id];
      if (s.shown > 0) counts.asked += 1;
      if (!s.lastResult) counts.unanswered += 1;
      else counts[s.lastResult] += 1;
    }
    return counts;
  }

  function formatSavedDate(ts) {
    if (!ts) return 'Never';
    try { return new Date(ts).toLocaleString(); }
    catch (_) { return '—'; }
  }

  function getOpenDialog(except = []) {
    return dialogs.find(d => d.open && !except.includes(d)) || null;
  }

  function closeOnBackdrop(dialog) {
    if (!dialog) return;
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      const inside = rect.top <= event.clientY && event.clientY <= rect.bottom && rect.left <= event.clientX && event.clientX <= rect.right;
      if (!inside) dialog.close();
    });
  }

  function selectAnswerByNumber(index) {
    const q = currentQuestion();
    const entry = currentEntry();
    if (!q || !entry || entry.answered) return false;
    const inputs = [...dom.answerForm.querySelectorAll('input')];
    if (!inputs.length || index < 0 || index >= inputs.length) return false;
    const target = inputs[index];
    if (q.type === 'multi') target.checked = !target.checked;
    else {
      inputs.forEach(i => { i.checked = false; });
      target.checked = true;
    }
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function handleGlobalKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target?.closest?.('button, a, select, textarea, [contenteditable=\"true\"]')) return;
    const key = event.key;
    const reviewOpen = !!dom.questionReviewDialog?.open;
    const otherOpen = !!getOpenDialog([dom.questionReviewDialog]);

    if (reviewOpen) {
      if (key === 'ArrowLeft') { event.preventDefault(); moveQuestionReview(-1); }
      else if (key === 'ArrowRight') { event.preventDefault(); moveQuestionReview(1); }
      return;
    }

    if (otherOpen) return;

    if (key === 'ArrowLeft') {
      event.preventDefault();
      goPrevious();
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      goNext();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      submitCurrentAnswer();
      return;
    }

    if (/^[1-9]$/.test(key)) {
      if (selectAnswerByNumber(Number(key) - 1)) event.preventDefault();
    }
  }

  function resetStudySessionTimer() {
    if (mode !== 'study') return;
    const msg = 'Reset the study session timer and the timer for the current question? This will not erase study history, question stats, or practice-test results.';
    if (!confirm(msg)) return;

    flushQuestionTime();
    flushStudyTime();

    state.study.sessionElapsedMs = 0;
    const entry = currentEntry();
    if (entry && !entry.answered) entry.elapsedMs = 0;

    saveState();
    beginStudyTimeIfNeeded();
    beginQuestionTimeIfNeeded();
    updateTimer();
    if (dom.statsDialog.open) renderStats();
  }

  function openAudioDb() {
    if (audioDbPromise) return audioDbPromise;
    audioDbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available in this browser.'));
        return;
      }
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_DB_STORE)) db.createObjectStore(AUDIO_DB_STORE, { keyPath: 'name' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open the audio library.'));
    });
    return audioDbPromise;
  }

  function runAudioTransaction(mode, operation) {
    return openAudioDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_DB_STORE, mode);
      const store = tx.objectStore(AUDIO_DB_STORE);
      let result;
      try { result = operation(store); }
      catch (err) { reject(err); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Audio library transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Audio library transaction was aborted.'));
    }));
  }

  async function getStoredAudioTracks() {
    return BUNDLED_AUDIO_REVIEWS.map(track => ({ ...track }));
  }

  function reviewNumber(trackOrName) {
    if (trackOrName && typeof trackOrName === 'object' && Number.isFinite(Number(trackOrName.number))) return Number(trackOrName.number);
    const match = String(trackOrName || '').match(/review\s*#?\s*(\d+)/i);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function isReviewAudioName(name) {
    const value = String(name || '');
    if (/trader\s*joe['’]?s\s*story/i.test(value)) return false;
    return /review\s*#?\s*\d+/i.test(value);
  }

  function sortAudioTracks(tracks) {
    return [...tracks].sort((a, b) => {
      const na = reviewNumber(a);
      const nb = reviewNumber(b);
      if (na !== nb) return na - nb;
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function absoluteUrl(url) {
    try { return new URL(url, window.location.href).href; }
    catch (_) { return url; }
  }

  async function refreshAudioCacheState() {
    if (!('caches' in window)) return;
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const entries = await Promise.all(audioLibrary.map(async track => {
      const url = absoluteUrl(track.src);
      const hit = await cache.match(url);
      return hit ? url : null;
    }));
    cachedAudioUrls = new Set(entries.filter(Boolean));
    renderAudioPlaylist();
    updateAudioCacheStatus();
  }

  function updateAudioCacheStatus(message = '') {
    if (!dom.audioCacheStatus) return;
    if (message) {
      dom.audioCacheStatus.textContent = message;
      return;
    }
    const total = audioLibrary.length || AUDIO_REVIEW_DATA.length;
    const count = audioLibrary.filter(track => cachedAudioUrls.has(absoluteUrl(track.src))).length;
    dom.audioCacheStatus.textContent = count ? `${count}/${total} offline` : '';
    if (dom.downloadAllAudioBtn) {
      dom.downloadAllAudioBtn.textContent = count === total && total ? 'Downloaded' : 'Download all';
      dom.downloadAllAudioBtn.disabled = count === total && total > 0;
    }
  }

  async function cacheAudioTrack(index, { quiet = false } = {}) {
    if (!('caches' in window)) throw new Error('Offline caching is unavailable.');
    const track = audioLibrary[index];
    if (!track?.src) return false;
    const url = absoluteUrl(track.src);
    const cache = await caches.open(AUDIO_CACHE_NAME);
    if (await cache.match(url)) {
      cachedAudioUrls.add(url);
      renderAudioPlaylist();
      updateAudioCacheStatus();
      return true;
    }
    const response = await fetch(url, { cache: 'reload' });
    if (!response.ok) throw new Error(`Could not download ${track.title || track.name}.`);
    await cache.put(url, response.clone());
    cachedAudioUrls.add(url);
    renderAudioPlaylist();
    if (!quiet) updateAudioCacheStatus('Downloaded');
    return true;
  }

  async function cacheAllAudio() {
    if (!audioLibrary.length) return;
    if (dom.downloadAllAudioBtn) dom.downloadAllAudioBtn.disabled = true;
    try {
      if (navigator.storage?.persist) { try { await navigator.storage.persist(); } catch (_) {} }
      for (let i = 0; i < audioLibrary.length; i++) {
        updateAudioCacheStatus(`Downloading ${i + 1}/${audioLibrary.length}…`);
        await cacheAudioTrack(i, { quiet: true });
      }
      updateAudioCacheStatus('Ready offline');
      setTimeout(() => updateAudioCacheStatus(), 1300);
    } catch (err) {
      console.warn('Could not cache all audio:', err);
      updateAudioCacheStatus('Download failed');
      setTimeout(() => updateAudioCacheStatus(), 1800);
    } finally {
      if (dom.downloadAllAudioBtn) dom.downloadAllAudioBtn.disabled = false;
      updateAudioCacheStatus();
    }
  }

  function formatAudioTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  }

  function getAudioPlaybackState() {
    try {
      const value = JSON.parse(localStorage.getItem(AUDIO_PLAYBACK_KEY) || '{}');
      return {
        trackName: typeof value.trackName === 'string' ? value.trackName : null,
        currentTime: Math.max(0, Number(value.currentTime) || 0),
        rate: [1, 1.2, 1.5, 2].includes(Number(value.rate)) ? Number(value.rate) : 1
      };
    } catch (_) {
      return { trackName: null, currentTime: 0, rate: 1 };
    }
  }

  function saveAudioPlaybackState(force = false) {
    if (!dom.audioPlayer) return;
    const now = Date.now();
    if (!force && now - lastAudioPersistAt < 900) return;
    lastAudioPersistAt = now;
    const track = audioLibrary[audioTrackIndex] || null;
    const data = {
      trackName: track?.name || track?.title || null,
      currentTime: Number.isFinite(dom.audioPlayer.currentTime) ? dom.audioPlayer.currentTime : 0,
      rate: dom.audioPlayer.playbackRate || 1
    };
    try { localStorage.setItem(AUDIO_PLAYBACK_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function setAudioRate(rate, persist = true) {
    const next = [1, 1.2, 1.5, 2].includes(Number(rate)) ? Number(rate) : 1;
    if (dom.audioPlayer) dom.audioPlayer.playbackRate = next;
    document.querySelectorAll('[data-audio-rate]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.audioRate) === next);
      btn.setAttribute('aria-pressed', Number(btn.dataset.audioRate) === next ? 'true' : 'false');
    });
    if (persist) saveAudioPlaybackState(true);
  }

  function seekAudioBy(seconds) {
    if (!dom.audioPlayer || !dom.audioPlayer.getAttribute('src')) return;
    const current = Number(dom.audioPlayer.currentTime) || 0;
    const duration = Number(dom.audioPlayer.duration);
    let next = Math.max(0, current + Number(seconds || 0));
    if (Number.isFinite(duration) && duration > 0) next = Math.min(next, duration);
    try {
      if (typeof dom.audioPlayer.fastSeek === 'function') dom.audioPlayer.fastSeek(next);
      else dom.audioPlayer.currentTime = next;
    } catch (_) {
      try { dom.audioPlayer.currentTime = next; } catch (_) {}
    }
    miniAudioStopped = false;
    saveAudioPlaybackState(true);
    syncTranscriptToAudio(true);
    updateMediaPositionState();
    updateMiniAudio();
  }

  function revokeAudioObjectUrl() {
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = null;
    }
  }

  function displayAudioImportMessage(message, isError = false) {
    if (!dom.audioEmptyState) return;
    dom.audioEmptyState.classList.remove('hidden');
    dom.audioEmptyState.classList.toggle('audio-error', isError);
    dom.audioEmptyState.innerHTML = `<strong>${escapeHtml(isError ? 'Audio unavailable' : 'Audio reviews')}</strong><p>${escapeHtml(message)}</p>`;
  }

  function updateMediaSessionMetadata(track) {
    if (!track) return;
    document.title = `${track.title || track.name || 'Audio Review'} — SCP Study`;
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || track.name || 'Audio Review',
        artist: 'Short and Sweet Audio Reviews',
        album: 'SCP Study',
        artwork: [
          { src: absoluteUrl('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
          { src: absoluteUrl('icons/icon-512.png'), sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (err) { console.warn('Media Session metadata unavailable:', err); }
  }

  function updateMediaPositionState() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    const duration = Number(dom.audioPlayer?.duration);
    const position = Number(dom.audioPlayer?.currentTime);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: dom.audioPlayer.playbackRate || 1,
        position: Math.min(Math.max(0, position), Math.max(0, duration - 0.001))
      });
    } catch (_) {}
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const safeHandler = (action, handler) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    };
    safeHandler('play', async () => {
      miniAudioStopped = false;
      try { await dom.audioPlayer.play(); } catch (_) {}
      updateMiniAudio();
    });
    safeHandler('pause', () => { dom.audioPlayer.pause(); updateMiniAudio(); });
    safeHandler('stop', stopAudio);
    safeHandler('seekbackward', details => {
      dom.audioPlayer.currentTime = Math.max(0, dom.audioPlayer.currentTime - (details.seekOffset || 10));
      updateMediaPositionState();
    });
    safeHandler('seekforward', details => {
      const duration = Number(dom.audioPlayer.duration) || Infinity;
      dom.audioPlayer.currentTime = Math.min(duration, dom.audioPlayer.currentTime + (details.seekOffset || 10));
      updateMediaPositionState();
    });
    safeHandler('seekto', details => {
      if (!Number.isFinite(details.seekTime)) return;
      if (details.fastSeek && typeof dom.audioPlayer.fastSeek === 'function') dom.audioPlayer.fastSeek(details.seekTime);
      else dom.audioPlayer.currentTime = details.seekTime;
      updateMediaPositionState();
    });
    safeHandler('previoustrack', () => moveAudioTrack(-1, true));
    safeHandler('nexttrack', () => moveAudioTrack(1, true));
  }

  function setMediaPlaybackState(stateValue) {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.playbackState = stateValue; } catch (_) {}
  }

  function printPdf(url) {
    const absolute = absoluteUrl(url);
    const win = window.open(absolute, '_blank');
    if (!win) return;
    const trigger = () => { try { win.focus(); win.print(); } catch (_) {} };
    try { win.addEventListener('load', () => setTimeout(trigger, 350), { once: true }); }
    catch (_) { setTimeout(trigger, 900); }
  }

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandaloneApp() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  function updateInstallButtonVisibility() {
    if (!dom.installBtn) return;
    const showIOSHelp = isIOSDevice() && !isStandaloneApp();
    const showNativePrompt = !!deferredInstallPrompt && !isStandaloneApp();
    dom.installBtn.classList.toggle('hidden', !(showIOSHelp || showNativePrompt));
  }

  const MATERIALS_TABS = new Set(['audio', 'glossary', 'downloads']);

  function savedMaterialsTab() {
    try {
      const value = localStorage.getItem(MATERIALS_TAB_KEY);
      return MATERIALS_TABS.has(value) ? value : 'audio';
    } catch (_) { return 'audio'; }
  }

  function savedTranscriptExpanded() {
    try {
      const value = localStorage.getItem(MATERIALS_TRANSCRIPT_KEY);
      return value === null ? true : value === '1';
    } catch (_) { return true; }
  }

  function materialsScroller() {
    return dom.materialsDialog?.querySelector('.modal-inner') || null;
  }

  function setMaterialsTab(tab, { remember = true, focus = false, resetScroll = false } = {}) {
    const next = MATERIALS_TABS.has(tab) ? tab : 'audio';
    const scroller = materialsScroller();
    if (MATERIALS_TABS.has(activeMaterialsTab) && scroller && dom.materialsDialog?.open) {
      materialsScrollByTab[activeMaterialsTab] = scroller.scrollTop;
    }
    activeMaterialsTab = next;
    document.querySelectorAll('[data-materials-tab]').forEach(button => {
      const selected = button.dataset.materialsTab === next;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-materials-panel]').forEach(panel => {
      panel.hidden = panel.dataset.materialsPanel !== next;
    });
    if (remember) {
      try { localStorage.setItem(MATERIALS_TAB_KEY, next); } catch (_) {}
    }
    if (scroller) {
      const targetTop = resetScroll ? 0 : (materialsScrollByTab[next] || 0);
      requestAnimationFrame(() => { scroller.scrollTop = targetTop; });
    }
    if (focus) document.querySelector(`[data-materials-tab="${next}"]`)?.focus();
    if (next === 'audio' && audioLibraryLoaded) {
      renderAudioPlaylist();
      renderAudioTranscript();
      setTimeout(() => syncTranscriptToAudio(true), 20);
    }
  }

  function currentAudioTrack() {
    return audioLibrary[audioTrackIndex] || null;
  }

  function isMobileAudioLayout() {
    return window.matchMedia?.('(max-width: 760px)').matches ?? false;
  }

  function setMobilePlaylistExpanded(expanded) {
    if (!dom.audioPlaylistWrap || !dom.audioPlaylistToggle) return;
    const value = !!expanded;
    dom.audioPlaylistWrap.classList.toggle('mobile-expanded', value);
    dom.audioPlaylistToggle.setAttribute('aria-expanded', String(value));
    const label = dom.audioPlaylistToggle.querySelector('.audio-playlist-toggle-label');
    if (label) label.textContent = value ? 'Hide playlist' : 'Choose another shiur';
  }

  function setTranscriptExpanded(expanded, { remember = true } = {}) {
    transcriptExpanded = !!expanded;
    if (remember) {
      try { localStorage.setItem(MATERIALS_TRANSCRIPT_KEY, transcriptExpanded ? '1' : '0'); } catch (_) {}
    }
    if (!dom.transcriptPanel || !dom.transcriptToggle) return;
    dom.transcriptPanel.classList.toggle('transcript-collapsed', !transcriptExpanded);
    dom.transcriptToggle.setAttribute('aria-expanded', String(transcriptExpanded));
    const label = dom.transcriptToggle.querySelector('.transcript-toggle-label');
    if (label) label.textContent = transcriptExpanded ? 'Hide transcript' : 'Show transcript';
  }

  function renderAudioPlaylist() {
    const hasTracks = audioLibrary.length > 0;
    dom.audioEmptyState.classList.toggle('hidden', hasTracks);
    dom.audioPlaylistWrap.classList.toggle('hidden', !hasTracks);
    dom.audioPrevBtn.disabled = !hasTracks || audioTrackIndex <= 0;
    if (dom.audioBack10Btn) dom.audioBack10Btn.disabled = !hasTracks;
    if (dom.audioForward10Btn) dom.audioForward10Btn.disabled = !hasTracks;
    dom.audioNextBtn.disabled = !hasTracks || audioTrackIndex >= audioLibrary.length - 1;

    if (!hasTracks) {
      dom.audioTrackTitle.textContent = 'Audio Reviews';
      dom.audioTrackCounter.textContent = 'Unavailable';
      dom.audioPlaylist.innerHTML = '';
      dom.audioPlaylistCount.textContent = '0 reviews';
      dom.audioTranscript.innerHTML = '';
      return;
    }

    dom.audioPlaylistCount.textContent = `${audioLibrary.length} reviews`;
    dom.audioPlaylist.innerHTML = audioLibrary.map((track, idx) => {
      const n = reviewNumber(track);
      const cached = cachedAudioUrls.has(absoluteUrl(track.src));
      return `<div class="audio-playlist-item${idx === audioTrackIndex ? ' active' : ''}" role="listitem">
        <button class="audio-track-main" type="button" data-audio-index="${idx}">
          <span class="audio-track-number">${Number.isFinite(n) ? n : idx + 1}</span>
          <span class="audio-track-name">${escapeHtml(track.title || track.name)}</span>
          <span class="audio-track-play">${idx === audioTrackIndex && !dom.audioPlayer.paused ? 'Playing' : 'Play'}</span>
        </button>
        <button class="audio-cache-btn${cached ? ' cached' : ''}" type="button" data-audio-download-index="${idx}" aria-label="${cached ? 'Available offline' : 'Download for offline use'}" title="${cached ? 'Available offline' : 'Download'}">${cached ? '✓' : '↓'}</button>
      </div>`;
    }).join('');
  }

  function renderAudioTranscript() {
    const track = currentAudioTrack();
    activeTranscriptIndex = -1;
    if (!track?.transcript?.length) {
      dom.audioTranscript.innerHTML = '<div class="transcript-empty">Transcript unavailable.</div>';
      return;
    }
    dom.audioTranscript.innerHTML = track.transcript.map((segment, idx) => `
      <button type="button" class="transcript-segment" data-transcript-index="${idx}" data-transcript-start="${segment.start}">
        <span class="transcript-time">${formatAudioTime(segment.start)}</span>
        <span class="transcript-text">${escapeHtml(segment.text)}</span>
      </button>`).join('');
    syncTranscriptToAudio(true);
  }

  function syncTranscriptToAudio(forceScroll = false) {
    const track = currentAudioTrack();
    if (!track?.transcript?.length || !dom.audioTranscript) return;
    const time = Number(dom.audioPlayer.currentTime) || 0;
    dom.transcriptClock.textContent = formatAudioTime(time);
    let idx = track.transcript.findIndex(seg => time >= seg.start && time < seg.end);
    if (idx < 0) {
      for (let i = track.transcript.length - 1; i >= 0; i--) {
        if (time >= track.transcript[i].start) { idx = i; break; }
      }
    }
    if (idx === activeTranscriptIndex && !forceScroll) return;
    dom.audioTranscript.querySelector('.transcript-segment.active')?.classList.remove('active');
    activeTranscriptIndex = idx;
    if (idx >= 0) {
      const node = dom.audioTranscript.querySelector(`[data-transcript-index="${idx}"]`);
      node?.classList.add('active');
      if (dom.materialsDialog.open && activeMaterialsTab === 'audio' && (forceScroll || !dom.audioPlayer.paused)) {
        node?.scrollIntoView({ block: 'nearest', behavior: forceScroll ? 'auto' : 'smooth' });
      }
    }
  }

  function updateMiniAudio() {
    if (!dom.miniAudioPlayer || !dom.audioPlayer) return;
    const track = currentAudioTrack();
    const hasLoadedTrack = !!track && !!dom.audioPlayer.getAttribute('src');
    const shouldShow = hasLoadedTrack && !dom.materialsDialog.open && !miniAudioStopped;
    dom.miniAudioPlayer.classList.toggle('hidden', !shouldShow);
    document.body.classList.toggle('mini-audio-visible', shouldShow);
    if (!shouldShow) return;
    dom.miniAudioTitle.textContent = track.title || track.name;
    dom.miniAudioTime.textContent = `${formatAudioTime(dom.audioPlayer.currentTime)} / ${Number.isFinite(dom.audioPlayer.duration) ? formatAudioTime(dom.audioPlayer.duration) : '—'}`;
    const paused = dom.audioPlayer.paused;
    dom.miniAudioPlayPause.textContent = paused ? '▶' : '❚❚';
    dom.miniAudioPlayPause.setAttribute('aria-label', paused ? 'Resume audio' : 'Pause audio');
  }

  async function setAudioTrack(index, { autoplay = false, restoreTime = 0 } = {}) {
    if (!audioLibrary.length) return;
    const next = Math.min(Math.max(0, index), audioLibrary.length - 1);
    const track = audioLibrary[next];
    const sameTrack = next === audioTrackIndex && !!dom.audioPlayer.getAttribute('src');
    audioTrackIndex = next;

    if (!sameTrack) {
      revokeAudioObjectUrl();
      if (track.src) dom.audioPlayer.src = track.src;
      else if (track.blob) {
        audioObjectUrl = URL.createObjectURL(track.blob);
        dom.audioPlayer.src = audioObjectUrl;
      } else return;
    }

    dom.audioTrackTitle.textContent = track.title || track.name;
    dom.audioTrackCounter.textContent = `Review ${track.number || next + 1} of ${audioLibrary.length}`;
    updateMediaSessionMetadata(track);
    const savedRate = getAudioPlaybackState().rate;
    setAudioRate(savedRate, false);
    renderAudioPlaylist();
    renderAudioTranscript();

    const applyPosition = async () => {
      if (restoreTime > 0 && Number.isFinite(dom.audioPlayer.duration)) {
        dom.audioPlayer.currentTime = Math.min(restoreTime, Math.max(0, dom.audioPlayer.duration - 0.1));
      } else if (restoreTime === 0 && !sameTrack) {
        dom.audioPlayer.currentTime = 0;
      }
      if (restoreTime > 0) miniAudioStopped = false;
      syncTranscriptToAudio(true);
      if (autoplay) {
        miniAudioStopped = false;
        try { await dom.audioPlayer.play(); } catch (_) {}
      }
      saveAudioPlaybackState(true);
      renderAudioPlaylist();
      updateMiniAudio();
    };

    if (sameTrack && Number.isFinite(dom.audioPlayer.duration) && dom.audioPlayer.readyState >= 1) {
      await applyPosition();
    } else {
      const onMetadata = async () => {
        dom.audioPlayer.removeEventListener('loadedmetadata', onMetadata);
        await applyPosition();
      };
      dom.audioPlayer.addEventListener('loadedmetadata', onMetadata);
      dom.audioPlayer.load();
    }
  }

  async function loadAudioLibrary({ preserveCurrent = true } = {}) {
    if (!dom.audioPlayer) return;
    try {
      const saved = getAudioPlaybackState();
      const currentName = preserveCurrent ? (currentAudioTrack()?.name || saved.trackName) : saved.trackName;
      audioLibrary = sortAudioTracks(await getStoredAudioTracks());
      audioLibraryLoaded = true;
      if (!audioLibrary.length) {
        revokeAudioObjectUrl();
        audioTrackIndex = -1;
        dom.audioPlayer.removeAttribute('src');
        dom.audioPlayer.load();
        renderAudioPlaylist();
        setAudioRate(saved.rate, false);
        updateMiniAudio();
        return;
      }
      const idx = currentName ? audioLibrary.findIndex(t => t.name === currentName || t.title === currentName) : -1;
      const next = idx >= 0 ? idx : 0;
      const restoreTime = audioLibrary[next]?.name === saved.trackName || audioLibrary[next]?.title === saved.trackName ? saved.currentTime : 0;
      if (restoreTime > 0) miniAudioStopped = false;
      await setAudioTrack(next, { restoreTime });
    } catch (err) {
      console.warn('Could not load audio reviews:', err);
      displayAudioImportMessage('Audio is unavailable in this browser.', true);
    }
  }

  function moveAudioTrack(delta, autoplay = false) {
    if (!audioLibrary.length) return;
    const next = audioTrackIndex + delta;
    if (next < 0 || next >= audioLibrary.length) return;
    saveAudioPlaybackState(true);
    void setAudioTrack(next, { autoplay });
  }

  async function playAudioReference(reviewId, start = 0, { autoplay = true, openMaterials = false } = {}) {
    if (!audioLibraryLoaded) await loadAudioLibrary({ preserveCurrent: true });
    const index = audioLibrary.findIndex(track => Number(track.id || track.number) === Number(reviewId));
    if (index < 0) return;
    if (openMaterials) {
      setMaterialsTab('audio');
      setTranscriptExpanded(true, { remember: false });
      if (!dom.materialsDialog.open) dom.materialsDialog.showModal();
    }
    await setAudioTrack(index, { autoplay, restoreTime: Math.max(0, Number(start) || 0) });
    if (openMaterials) {
      updateMiniAudio();
      setTimeout(() => syncTranscriptToAudio(true), 30);
    }
  }

  function stopAudio() {
    if (!dom.audioPlayer) return;
    dom.audioPlayer.pause();
    try { dom.audioPlayer.currentTime = 0; } catch (_) {}
    miniAudioStopped = true;
    setMediaPlaybackState('none');
    document.title = 'SCP Study';
    saveAudioPlaybackState(true);
    syncTranscriptToAudio(true);
    updateMiniAudio();
  }

  function renderRelevantAudio(questionId, container, allowBeforeAnswer = true) {
    if (!container) return;
    const refs = QUESTION_AUDIO_MAP[String(questionId)] || [];
    if (!refs.length || !allowBeforeAnswer) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }
    const rows = refs.map((ref, idx) => {
      const track = AUDIO_REVIEW_DATA.find(t => Number(t.id) === Number(ref.review));
      if (!track) return '';
      return `<div class="question-audio-row">
        <button class="question-audio-play" type="button" data-related-review="${ref.review}" data-related-start="${ref.start}">
          <span class="question-audio-playicon" aria-hidden="true">▶</span>
          <span class="question-audio-copy"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(ref.label || 'Relevant section')}</small></span>
          <span class="question-audio-time">${formatAudioTime(ref.start)}</span>
        </button>
        <button class="question-audio-transcript" type="button" data-related-transcript="${ref.review}" data-related-start="${ref.start}" aria-label="Open transcript at ${formatAudioTime(ref.start)}">Transcript</button>
      </div>`;
    }).join('');
    container.innerHTML = `<div class="question-audio-label">Relevant audio</div>${rows}`;
    container.classList.remove('hidden');
  }

  function openMaterials(tab = null) {
    flushQuestionTime();
    if (isMobileAudioLayout()) setMobilePlaylistExpanded(false);
    const targetTab = MATERIALS_TABS.has(tab) ? tab : savedMaterialsTab();
    if (!dom.materialsDialog.open) dom.materialsDialog.showModal();
    setMaterialsTab(targetTab, { remember: true });
    if (targetTab === 'audio' && !dom.audioPlayer.paused) setTranscriptExpanded(true, { remember: false });
    if (!audioLibraryLoaded) void loadAudioLibrary({ preserveCurrent: true });
    else if (targetTab === 'audio') {
      renderAudioPlaylist();
      renderAudioTranscript();
      syncTranscriptToAudio(true);
    }
    void refreshAudioCacheState();
    updateMiniAudio();
  }

  function questionMatchesReviewSearch(qid, rawQuery) {
    const query = String(rawQuery || '').trim().toLocaleLowerCase();
    if (!query) return true;
    const corpus = questionSearchCorpus.get(qid) || '';
    return query.split(/\s+/).filter(Boolean).every(token => corpus.includes(token));
  }

  function applyQuestionReviewSearch(rawQuery, { preserveQuestion = true } = {}) {
    if (!reviewContext) return;
    const query = String(rawQuery || '');
    const currentQid = preserveQuestion && reviewContext.ids?.length
      ? reviewContext.ids[reviewContext.index]
      : reviewContext.baseIds[0];
    reviewContext.query = query;
    reviewContext.ids = reviewContext.baseIds.filter(id => questionMatchesReviewSearch(id, query));
    const preservedIndex = reviewContext.ids.indexOf(currentQid);
    reviewContext.index = preservedIndex >= 0 ? preservedIndex : 0;
    reviewContext.revealed = false;
    renderQuestionReview();
  }

  function openQuestionReview(qid, ids, contextLabel) {
    const validIds = (ids || []).filter(id => questionById.has(id));
    if (!validIds.length) return;
    const idx = Math.max(0, validIds.indexOf(qid));
    reviewContext = {
      baseIds: validIds,
      ids: [...validIds],
      index: idx,
      contextLabel: contextLabel || 'Question review',
      revealed: false,
      query: ''
    };
    if (dom.reviewSearchInput) dom.reviewSearchInput.value = '';
    renderQuestionReview();
    if (!dom.questionReviewDialog.open) dom.questionReviewDialog.showModal();
  }

  function openQuestionReviewAll(qid) {
    openQuestionReview(qid, QUESTIONS.map(q => q.id), 'All questions');
  }

  function openQuestionSearch() {
    const qid = currentQuestion()?.id || QUESTIONS[0]?.id;
    if (dom.materialsDialog?.open) dom.materialsDialog.close();
    openQuestionReviewAll(qid);
    requestAnimationFrame(() => {
      dom.reviewSearchInput?.focus({ preventScroll: true });
      try { dom.reviewSearchInput?.select(); } catch (_) {}
    });
  }

  function openQuestionReviewCategory(category) {
    const ids = QUESTIONS.filter(q => q.category === category).map(q => q.id);
    if (!ids.length) return;
    openQuestionReview(ids[0], ids, `Category: ${category}`);
  }

  function canRevealReviewAnswer(qid) {
    if (mode !== 'test' || !state.activeTest) return true;
    return !!state.activeTest.items?.[qid]?.answered;
  }

  function setReviewReveal(revealed) {
    if (!reviewContext?.ids?.length) return;
    const qid = reviewContext.ids[reviewContext.index];
    if (revealed && !canRevealReviewAnswer(qid)) return;
    reviewContext.revealed = !!revealed;
    renderQuestionReview();
  }

  function renderQuestionReview() {
    if (!reviewContext) return;
    const baseTotal = reviewContext.baseIds?.length || 0;
    const matchTotal = reviewContext.ids?.length || 0;
    const hasQuery = !!String(reviewContext.query || '').trim();
    if (dom.reviewSearchCount) {
      dom.reviewSearchCount.textContent = hasQuery
        ? `${matchTotal} of ${baseTotal} question${baseTotal === 1 ? '' : 's'}`
        : `${baseTotal} question${baseTotal === 1 ? '' : 's'}`;
    }
    dom.reviewSearchClear?.classList.toggle('hidden', !hasQuery);

    const noMatches = matchTotal === 0;
    dom.reviewSearchEmpty?.classList.toggle('hidden', !noMatches);
    dom.reviewNav?.classList.toggle('hidden', noMatches);
    dom.reviewBody?.classList.toggle('hidden', noMatches);
    if (noMatches) {
      dom.reviewTitle.textContent = 'Question explorer';
      dom.reviewContextLabel.textContent = reviewContext.contextLabel;
      return;
    }

    reviewContext.index = Math.min(Math.max(0, reviewContext.index), reviewContext.ids.length - 1);
    const q = questionById.get(reviewContext.ids[reviewContext.index]);
    if (!q) return;
    const s = state.stats[q.id] || defaultQuestionStats();
    const avg = s.attempts ? formatAnswerTime(s.totalTimeMs / s.attempts) : '—';
    const lastResult = s.lastResult ? s.lastResult[0].toUpperCase() + s.lastResult.slice(1) : 'Not answered';

    dom.reviewTitle.textContent = `Question ${q.id}`;
    dom.reviewContextLabel.textContent = reviewContext.contextLabel;
    dom.reviewQuestionNumber.textContent = `Question ${q.id}`;
    dom.reviewCategory.textContent = q.category;
    setGlossaryText(dom.reviewPrompt, q.prompt);
    setGlossaryText(dom.reviewExplanation, q.explanation);
    dom.reviewCorrectAnswer.textContent = `Correct answer${q.answer.length > 1 ? 's' : ''}: ${q.answer.join(', ')}`;
    const canReveal = canRevealReviewAnswer(q.id);
    const revealed = !!reviewContext.revealed && canReveal;
    dom.reviewAnswerDetails.classList.toggle('hidden', !revealed);
    dom.reviewRevealBtn.disabled = !canReveal;
    dom.reviewRevealBtn.textContent = !canReveal ? 'Submit this question first' : (revealed ? 'Hide answer & explanation' : 'Show answer & explanation');
    renderRelevantAudio(q.id, dom.reviewAudio, mode !== 'test' || canReveal);
    dom.reviewCounter.textContent = `${reviewContext.index + 1}/${reviewContext.ids.length}`;
    dom.reviewPrevBtn.disabled = reviewContext.index <= 0;
    dom.reviewNextBtn.disabled = reviewContext.index >= reviewContext.ids.length - 1;

    dom.reviewStatsGrid.innerHTML = [
      statCard('Asked', s.shown),
      statCard('Attempts', s.attempts),
      statCard('Correct', s.correct),
      statCard('Partial', s.partial),
      statCard('Wrong', s.incorrect),
      statCard('Avg answer', avg)
    ].join('');
    dom.reviewLastAnswer.innerHTML = `<strong>Last result:</strong> ${escapeHtml(lastResult)} &nbsp;·&nbsp; <strong>Last answered:</strong> ${escapeHtml(formatSavedDate(s.lastAnswered))}`;

    dom.reviewChoices.innerHTML = '';
    q.choices.forEach((choiceText, idx) => {
      const letter = LETTERS[idx];
      const row = document.createElement('div');
      row.className = `review-choice${reviewContext.revealed && canRevealReviewAnswer(q.id) && q.answer.includes(letter) ? ' correct' : ''}`;
      const badge = document.createElement('span');
      badge.className = 'choice-letter';
      badge.textContent = letter;
      const text = document.createElement('span');
      setGlossaryText(text, choiceText);
      row.append(badge, text);
      dom.reviewChoices.append(row);
    });
  }

  function moveQuestionReview(delta) {
    if (!reviewContext?.ids?.length) return;
    const next = reviewContext.index + delta;
    if (next < 0 || next >= reviewContext.ids.length) return;
    reviewContext.index = next;
    reviewContext.revealed = false;
    renderQuestionReview();
    scrollQuestionReviewToTop();
  }

  function renderStats() {
    const mastery = currentMasteryCounts();
    const totalAttempts = QUESTIONS.reduce((n, q) => n + state.stats[q.id].attempts, 0);
    const totalPoints = QUESTIONS.reduce((n, q) => n + state.stats[q.id].pointsEarned, 0);
    const totalTime = QUESTIONS.reduce((n, q) => n + state.stats[q.id].totalTimeMs, 0);
    const accuracy = totalAttempts ? (totalPoints / totalAttempts) * 100 : 0;
    const avgTime = totalAttempts ? totalTime / totalAttempts : 0;

    const categoryStats = categories.map(cat => {
      const qs = QUESTIONS.filter(q => q.category === cat);
      const attempts = qs.reduce((n,q) => n + state.stats[q.id].attempts, 0);
      const points = qs.reduce((n,q) => n + state.stats[q.id].pointsEarned, 0);
      const time = qs.reduce((n,q) => n + state.stats[q.id].totalTimeMs, 0);
      const seen = qs.filter(q => state.stats[q.id].shown > 0).length;
      return { cat, total: qs.length, attempts, points, time, seen, accuracy: attempts ? points/attempts*100 : 0 };
    });

    const questionRows = QUESTIONS.map(q => {
      const s = state.stats[q.id];
      const avg = s.attempts ? formatAnswerTime(s.totalTimeMs / s.attempts) : '—';
      const last = s.lastResult ? `<span class="result-badge ${s.lastResult}">${s.lastResult}</span>` : '<span class="result-badge">not answered</span>';
      return `<tr class="clickable-row" role="button" tabindex="0" data-review-question="${q.id}" title="Open question ${q.id}"><td>${q.id}</td><td>${escapeHtml(q.category)}</td><td>${s.shown}</td><td>${s.attempts}</td><td>${last}</td><td>${avg}</td></tr>`;
    }).join('');

    const catRows = categoryStats.map(x => `<tr class="clickable-row" role="button" tabindex="0" data-review-category="${encodeURIComponent(x.cat)}" title="Review ${escapeHtml(x.cat)} questions"><td>${escapeHtml(x.cat)}</td><td>${x.seen}/${x.total}</td><td>${x.attempts}</td><td>${x.attempts ? x.accuracy.toFixed(0)+'%' : '—'}</td><td>${x.attempts ? formatAnswerTime(x.time/x.attempts) : '—'}</td></tr>`).join('');

    const testHtml = renderPracticeTestStats();

    dom.statsContent.innerHTML = `
      <div class="stat-grid">
        ${statCard('Questions seen', `${mastery.asked}/${QUESTIONS.length}`)}
        ${statCard('Last: correct', mastery.correct)}
        ${statCard('Last: partial', mastery.partial)}
        ${statCard('Last: wrong', mastery.incorrect)}
        ${statCard('Attempt score', totalAttempts ? `${accuracy.toFixed(1)}%` : '—')}
      </div>
      <div class="stat-grid">
        ${statCard('Total attempts', totalAttempts)}
        ${statCard('Avg answer time', totalAttempts ? formatAnswerTime(avgTime) : '—')}
        ${statCard('Study session', formatDuration(studyElapsedNow()))}
      </div>
      <div class="stat-section">
        <h3>Category performance</h3>
        <div class="table-wrap"><table><thead><tr><th>Category</th><th>Seen</th><th>Attempts</th><th>Attempt score</th><th>Avg time</th></tr></thead><tbody>${catRows}</tbody></table></div>
      </div>
      ${testHtml}
      <div class="stat-section">
        <details>
          <summary>Per-question study history</summary>
          <div class="details-body table-wrap"><table><thead><tr><th>Q</th><th>Category</th><th>Asked</th><th>Attempts</th><th>Last result</th><th>Avg time</th></tr></thead><tbody>${questionRows}</tbody></table></div>
        </details>
      </div>`;
  }

  function renderPracticeTestStats() {
    if (!state.tests.length) {
      return `<div class="stat-section"><h3>Practice tests</h3><div class="callout"><strong>No practice test yet</strong><p>Your last try, best completed try, category breakdowns, timing, and expanded details will appear here.</p></div></div>`;
    }
    const last = state.tests[state.tests.length - 1];
    const completed = state.tests.filter(t => t.completed);
    const bestPool = completed.length ? completed : state.tests;
    const best = bestPool.reduce((a,b) => b.scorePct > a.scorePct ? b : a, bestPool[0]);
    const recent = [...state.tests].reverse().slice(0, 8);
    const details = recent.map((t, idx) => {
      const catRows = Object.entries(t.perCategory || {}).map(([cat, x]) => `<tr class="clickable-row" role="button" tabindex="0" data-review-category="${encodeURIComponent(cat)}"><td>${escapeHtml(cat)}</td><td>${x.total ? (x.points/x.total*100).toFixed(0)+'%' : '—'}</td><td>${x.correct}</td><td>${x.partial}</td><td>${x.incorrect}</td><td>${x.unanswered}</td></tr>`).join('');
      return `<details><summary>${idx === 0 ? 'Last try — ' : ''}${t.scorePct.toFixed(1)}% · ${t.completed ? 'completed' : 'incomplete'} · ${new Date(t.date).toLocaleString()}</summary><div class="details-body"><p class="small-muted">Correct ${t.correct} · Partial ${t.partial} · Incorrect ${t.incorrect} · Unanswered ${t.unanswered} · Time ${formatDuration(t.totalTimeMs)} · Avg ${t.answeredCount ? formatAnswerTime(t.avgAnswerTimeMs) : '—'}</p><div class="table-wrap"><table><thead><tr><th>Category</th><th>Score</th><th>Correct</th><th>Partial</th><th>Wrong</th><th>Unanswered</th></tr></thead><tbody>${catRows}</tbody></table></div></div></details>`;
    }).join('');
    return `<div class="stat-section"><h3>Practice tests</h3><div class="stat-grid">${statCard('Last try', `${last.scorePct.toFixed(1)}%`)}${statCard('Best try', `${best.scorePct.toFixed(1)}%`)}${statCard('Attempts', state.tests.length)}${statCard('Last time', formatDuration(last.totalTimeMs))}</div>${details}</div>`;
  }

  function openStats() {
    flushQuestionTime();
    renderStats();
    dom.statsDialog.showModal();
  }

  function resetAllProgress() {
    const msg = 'Reset all study history, timing, category filters, and practice-test results? This cannot be undone.';
    if (!confirm(msg)) return;
    flushQuestionTime();
    flushStudyTime();
    state = defaultState();
    mode = 'study';
    lastFinishedTest = null;
    saveState();
    if (dom.statsDialog.open) dom.statsDialog.close();
    appendStudyQuestion();
    beginStudyTimeIfNeeded();
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function updateTimer() {
    if (mode === 'test' && state.activeTest) {
      const remaining = state.activeTest.endTime - Date.now();
      dom.mainTimer.textContent = formatDuration(Math.max(0, remaining));
      if (remaining <= 0) finishTest('time');
    } else {
      dom.mainTimer.textContent = formatDuration(studyElapsedNow());
    }
  }

  function checkExpiredTestOnLoad() {
    if (state.activeTest && state.activeTest.endTime <= Date.now()) {
      mode = 'test';
      setTimeout(() => finishTest('time'), 50);
      return true;
    }
    return false;
  }

  function bindEvents() {
    dom.submitBtn.addEventListener('click', submitCurrentAnswer);
    dom.prevBtn.addEventListener('click', goPrevious);
    dom.nextBtn.addEventListener('click', goNext);
    dom.categoriesBtn.addEventListener('click', openCategories);
    dom.materialsBtn.addEventListener('click', openMaterials);
    dom.questionSearchFab?.addEventListener('click', openQuestionSearch);
    const openCurrentExplorer = kind => {
      const q = currentQuestion();
      const entry = currentEntry();
      if (!q || !entry?.answered) return;
      if (kind === 'category') openQuestionReview(q.id, QUESTIONS.filter(x => x.category === q.category).map(x => x.id), `Category: ${q.category}`);
      else openQuestionReviewAll(q.id);
    };
    dom.questionNumber.addEventListener('click', () => openCurrentExplorer('question'));
    dom.questionPrompt.addEventListener('click', () => openCurrentExplorer('question'));
    dom.questionCategory.addEventListener('click', () => openCurrentExplorer('category'));
    [dom.questionNumber, dom.questionPrompt, dom.questionCategory].forEach(node => node.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (node.getAttribute('aria-disabled') === 'true') return;
      e.preventDefault();
      openCurrentExplorer(node === dom.questionCategory ? 'category' : 'question');
    }));

    dom.statsBtn.addEventListener('click', openStats);
    dialogs.forEach(d => {
      closeOnBackdrop(d);
      d.addEventListener('close', () => {
        const anyOpen = dialogs.some(x => x.open);
        if (!anyOpen) beginQuestionTimeIfNeeded();
        updateMiniAudio();
      });
    });
    dom.timerCard.addEventListener('click', resetStudySessionTimer);
    dom.timerCard.addEventListener('keydown', e => {
      if (mode !== 'study') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetStudySessionTimer();
      }
    });

    dom.testBtn.addEventListener('click', () => {
      if (mode === 'test') requestExitTest();
      else {
        flushQuestionTime();
        dom.testIntroDialog.showModal();
      }
    });

    dom.selectAllCategories.addEventListener('click', () => dom.categoryOptions.querySelectorAll('input').forEach(i => i.checked = true));
    dom.clearCategories.addEventListener('click', () => dom.categoryOptions.querySelectorAll('input').forEach(i => i.checked = false));
    dom.applyCategories.addEventListener('click', applyCategories);

    dom.closeMaterials.addEventListener('click', () => dom.materialsDialog.close());
    dom.doneMaterialsBtn.addEventListener('click', () => dom.materialsDialog.close());
    dom.materialsQuestionSearchBtn?.addEventListener('click', openQuestionSearch);
    dom.materialsTabs?.addEventListener('click', e => {
      const tab = e.target.closest('[data-materials-tab]');
      if (tab) setMaterialsTab(tab.dataset.materialsTab);
    });
    dom.materialsTabs?.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const buttons = [...dom.materialsTabs.querySelectorAll('[data-materials-tab]')];
      const current = buttons.findIndex(button => button.dataset.materialsTab === activeMaterialsTab);
      if (current < 0) return;
      e.preventDefault();
      let next = current;
      if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
      if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = buttons.length - 1;
      setMaterialsTab(buttons[next].dataset.materialsTab, { focus: true });
    });
    dom.analyticsToggle?.addEventListener('change', e => setAnalyticsEnabled(e.currentTarget.checked));
    dom.glossarySearchInput?.addEventListener('input', e => renderGlossary(e.target.value));
    dom.glossarySearchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape' && e.currentTarget.value) {
        e.preventDefault();
        e.currentTarget.value = '';
        renderGlossary('');
      }
    });
    dom.glossarySearchClear?.addEventListener('click', () => {
      if (!dom.glossarySearchInput) return;
      dom.glossarySearchInput.value = '';
      renderGlossary('');
      dom.glossarySearchInput.focus();
    });
    dom.materialsDialog.addEventListener('click', e => {
      const print = e.target.closest('[data-print-pdf]');
      if (print) printPdf(print.dataset.printPdf);
    });
    dom.audioPrevBtn.addEventListener('click', () => moveAudioTrack(-1, true));
    dom.audioBack10Btn?.addEventListener('click', () => seekAudioBy(-10));
    dom.audioForward10Btn?.addEventListener('click', () => seekAudioBy(10));
    dom.audioNextBtn.addEventListener('click', () => moveAudioTrack(1, true));
    dom.downloadAllAudioBtn?.addEventListener('click', () => void cacheAllAudio());
    dom.audioPlaylistToggle?.addEventListener('click', () => {
      const expanded = !dom.audioPlaylistWrap.classList.contains('mobile-expanded');
      setMobilePlaylistExpanded(expanded);
    });
    dom.transcriptToggle?.addEventListener('click', () => setTranscriptExpanded(!transcriptExpanded));
    document.querySelectorAll('[data-audio-rate]').forEach(btn => btn.addEventListener('click', () => setAudioRate(Number(btn.dataset.audioRate))));
    dom.audioPlaylist.addEventListener('click', e => {
      const download = e.target.closest('[data-audio-download-index]');
      if (download) {
        const index = Number(download.dataset.audioDownloadIndex);
        download.disabled = true;
        download.textContent = '…';
        void cacheAudioTrack(index).catch(err => {
          console.warn('Audio download failed:', err);
          updateAudioCacheStatus('Download failed');
        }).finally(() => { void refreshAudioCacheState(); });
        return;
      }
      const row = e.target.closest('[data-audio-index]');
      if (!row) return;
      void setAudioTrack(Number(row.dataset.audioIndex), { autoplay: true });
      if (isMobileAudioLayout()) setMobilePlaylistExpanded(false);
    });
    dom.audioTranscript.addEventListener('click', e => {
      const segment = e.target.closest('[data-transcript-start]');
      if (!segment || !currentAudioTrack()) return;
      const start = Math.max(0, Number(segment.dataset.transcriptStart) || 0);
      dom.audioPlayer.currentTime = start;
      miniAudioStopped = false;
      void dom.audioPlayer.play().catch(() => {});
      syncTranscriptToAudio(true);
      updateMiniAudio();
    });
    [dom.questionAudio, dom.reviewAudio].forEach(container => container?.addEventListener('click', e => {
      const isMainQuestionAudio = container === dom.questionAudio;
      const play = e.target.closest('[data-related-review]');
      if (play) {
        if (isMainQuestionAudio) markAnalyticsAssist('audio');
        void playAudioReference(Number(play.dataset.relatedReview), Number(play.dataset.relatedStart), { autoplay: true });
        return;
      }
      const transcript = e.target.closest('[data-related-transcript]');
      if (transcript) {
        if (isMainQuestionAudio) markAnalyticsAssist('audio');
        void playAudioReference(Number(transcript.dataset.relatedTranscript), Number(transcript.dataset.relatedStart), { autoplay: false, openMaterials: true });
      }
    }));
    dom.miniAudioOpen.addEventListener('click', () => openMaterials('audio'));
    dom.miniAudioBack10?.addEventListener('click', () => seekAudioBy(-10));
    dom.miniAudioPlayPause.addEventListener('click', () => {
      if (dom.audioPlayer.paused) {
        miniAudioStopped = false;
        void dom.audioPlayer.play().catch(() => {});
      } else dom.audioPlayer.pause();
      updateMiniAudio();
    });
    dom.miniAudioStop.addEventListener('click', stopAudio);
    dom.audioPlayer.addEventListener('ended', () => {
      if (audioTrackIndex < audioLibrary.length - 1) moveAudioTrack(1, true);
      else {
        miniAudioStopped = true;
        setMediaPlaybackState('none');
        document.title = 'SCP Study';
        saveAudioPlaybackState(true);
        renderAudioPlaylist();
        updateMiniAudio();
      }
    });
    dom.audioPlayer.addEventListener('play', () => { miniAudioStopped = false; setMediaPlaybackState('playing'); updateMediaPositionState(); renderAudioPlaylist(); updateMiniAudio(); });
    dom.audioPlayer.addEventListener('pause', () => { if (!dom.audioPlayer.ended) setMediaPlaybackState('paused'); saveAudioPlaybackState(true); updateMediaPositionState(); renderAudioPlaylist(); updateMiniAudio(); });
    dom.audioPlayer.addEventListener('timeupdate', () => { saveAudioPlaybackState(false); syncTranscriptToAudio(false); updateMediaPositionState(); updateMiniAudio(); });
    dom.audioPlayer.addEventListener('durationchange', updateMediaPositionState);
    dom.audioPlayer.addEventListener('ratechange', updateMediaPositionState);

    dom.closeStats.addEventListener('click', () => dom.statsDialog.close());
    dom.doneStatsBtn.addEventListener('click', () => dom.statsDialog.close());
    dom.resetStatsBtn.addEventListener('click', resetAllProgress);

    dom.closeQuestionReview.addEventListener('click', () => dom.questionReviewDialog.close());
    dom.reviewPrevBtn.addEventListener('click', () => moveQuestionReview(-1));
    dom.reviewNextBtn.addEventListener('click', () => moveQuestionReview(1));
    dom.reviewRevealBtn.addEventListener('click', () => setReviewReveal(!reviewContext?.revealed));
    dom.reviewSearchInput?.addEventListener('input', e => applyQuestionReviewSearch(e.target.value));
    dom.reviewSearchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape' && e.currentTarget.value) {
        e.preventDefault();
        e.currentTarget.value = '';
        applyQuestionReviewSearch('');
      }
    });
    dom.reviewSearchClear?.addEventListener('click', () => {
      if (!dom.reviewSearchInput) return;
      dom.reviewSearchInput.value = '';
      applyQuestionReviewSearch('');
      dom.reviewSearchInput.focus();
    });
    dom.statsContent.addEventListener('click', e => {
      const qRow = e.target.closest('[data-review-question]');
      if (qRow) { openQuestionReviewAll(Number(qRow.dataset.reviewQuestion)); return; }
      const catRow = e.target.closest('[data-review-category]');
      if (catRow) openQuestionReviewCategory(decodeURIComponent(catRow.dataset.reviewCategory));
    });
    dom.statsContent.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('[data-review-question], [data-review-category]');
      if (!row) return;
      e.preventDefault();
      row.click();
    });

    document.addEventListener('keydown', e => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = String(e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      const openDialog = dialogs.find(d => d.open);
      if (openDialog && openDialog !== dom.materialsDialog && openDialog !== dom.questionReviewDialog) return;
      e.preventDefault();
      if (dom.questionReviewDialog.open) { dom.reviewSearchInput?.focus(); return; }
      openQuestionSearch();
    });

    dom.closeTestIntro.addEventListener('click', () => dom.testIntroDialog.close());
    dom.cancelTestStart.addEventListener('click', () => dom.testIntroDialog.close());
    dom.startTestBtn.addEventListener('click', startTest);

    dom.closeTestResult.addEventListener('click', () => dom.testResultDialog.close());
    dom.returnToStudy.addEventListener('click', () => dom.testResultDialog.close());
    dom.reviewStatsAfterTest.addEventListener('click', () => {
      dom.testResultDialog.close();
      openStats();
    });

    document.addEventListener('click', e => {
      const category = e.target.closest?.('[data-glossary-category]');
      if (category) {
        e.preventDefault();
        e.stopPropagation();
        openGlossaryCategory(category.dataset.glossaryCategory);
        return;
      }
      const term = e.target.closest?.('[data-glossary-id]');
      if (!term) return;
      e.preventDefault();
      e.stopPropagation();
      openGlossaryEntry(term.dataset.glossaryId, term.closest('#glossaryList') ? 'materials' : 'question');
    }, true);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const category = e.target.closest?.('[data-glossary-category]');
      if (category) {
        e.preventDefault();
        e.stopPropagation();
        openGlossaryCategory(category.dataset.glossaryCategory);
        return;
      }
      const term = e.target.closest?.('[data-glossary-id]');
      if (!term) return;
      e.preventDefault();
      e.stopPropagation();
      openGlossaryEntry(term.dataset.glossaryId, term.closest('#glossaryList') ? 'materials' : 'question');
    }, true);
    dom.closeGlossaryTerm?.addEventListener('click', () => { stopGlossaryPronunciation({ resumeCourseAudio: true }); dom.glossaryTermDialog.close(); });
    dom.glossarySpeakBtn?.addEventListener('click', playActiveGlossaryEntry);

    document.addEventListener('keydown', handleGlobalKeydown);

    const pauseActivityTimers = () => { flushQuestionTime(); flushStudyTime(); };
    const resumeActivityTimers = () => {
      if (document.visibilityState !== 'visible') return;
      beginQuestionTimeIfNeeded();
      beginStudyTimeIfNeeded();
    };
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' ? pauseActivityTimers() : resumeActivityTimers());
    window.addEventListener('pagehide', pauseActivityTimers);
    window.addEventListener('blur', pauseActivityTimers);
    window.addEventListener('focus', resumeActivityTimers);
    window.addEventListener('pageshow', resumeActivityTimers);
    document.addEventListener('freeze', pauseActivityTimers);
    document.addEventListener('resume', resumeActivityTimers);

    window.addEventListener('online', () => void flushAnalyticsQueue());

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      updateInstallButtonVisibility();
    });
    dom.installBtn.addEventListener('click', async () => {
      if (isIOSDevice() && !isStandaloneApp()) {
        if (!dom.installGuideDialog.open) dom.installGuideDialog.showModal();
        return;
      }
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallButtonVisibility();
    });
    dom.closeInstallGuide.addEventListener('click', () => dom.installGuideDialog.close());
    window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; updateInstallButtonVisibility(); });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker registration failed:', err)));
    }
  }

  function init() {
    bindEvents();
    registerServiceWorker();
    setupMediaSession();
    updateInstallButtonVisibility();
    updateAnalyticsUi();
    void flushAnalyticsQueue();
    activeMaterialsTab = savedMaterialsTab();
    setMaterialsTab(activeMaterialsTab, { remember: false });
    setTranscriptExpanded(savedTranscriptExpanded(), { remember: false });
    renderGlossary('');
    void loadAudioLibrary({ preserveCurrent: false }).then(() => refreshAudioCacheState());
    const expired = checkExpiredTestOnLoad();
    if (!expired) {
      if (mode === 'study' && !state.study.history.length) appendStudyQuestion();
      beginStudyTimeIfNeeded();
      render();
    }
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }

  init();
})();
