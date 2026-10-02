(() => {
  'use strict';

  const STORAGE_KEY = 'courseReviewSpacedRepetition.v1';
  const AUDIO_DB_NAME = 'scpStudyAudioLibrary.v1';
  const AUDIO_DB_STORE = 'tracks';
  const AUDIO_PLAYBACK_KEY = 'scpStudy.audioPlayback.v1';
  const MATERIALS_TAB_KEY = 'scpStudy.materialsTab.v1';
  const MATERIALS_TRANSCRIPT_KEY = 'scpStudy.materialsTranscript.v1';
  const ESSAY_PRACTICE_KEY = 'scpStudy.essayPractice.v1';
  const ESSAY_CATEGORY_FILTER_KEY = 'scpStudy.essayCategoryFilter.v1';
  const AUDIO_CACHE_NAME = 'scp-study-audio-v3';
  const BUNDLED_AUDIO_REVIEWS = AUDIO_REVIEW_DATA.map(track => ({
    ...track,
    name: track.title
  }));
  const APP_VERSION = 60;
  const ANALYTICS_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/events';
  const CONTENT_FEEDBACK_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/feedback/report';
  const NOTIFICATIONS_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/notifications';
  const NOTIFICATION_STATE_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/notifications/state';
  const PUSH_CONFIG_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/push/config';
  const PUSH_SUBSCRIBE_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/push/subscribe';
  const PUSH_UNSUBSCRIBE_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/push/unsubscribe';
  const NEXT_REMINDER_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/reminders/next';
  const SERVER_DATA_DELETE_ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/data/delete';
  const STUDY_REMINDER_SETTINGS_KEY = 'scpStudy.studyReminders.v1';
  const LATEST_ZMAN_PROMPT_KEY = 'scpStudy.latestZmanPrompt.v1';
  const COHORT_SELECTION_KEY = 'scpStudy.activeZman.v1';
  const ZMAN_REGISTRY = window.SCP_ZMAN_REGISTRY || { zmanim: window.SCP_COHORT_REGISTRY?.cohorts || [] };
  const COHORT_REGISTRY = { ...window.SCP_COHORT_REGISTRY, cohorts: ZMAN_REGISTRY.zmanim || [], defaultCohortId: ZMAN_REGISTRY.defaultZmanId || window.SCP_COHORT_REGISTRY?.defaultCohortId, latestZmanId: ZMAN_REGISTRY.latestZmanId || window.SCP_COHORT_REGISTRY?.latestZmanId };
  const ACTIVE_COHORT = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || COHORT_REGISTRY.cohorts?.[0] || {};
  const COHORT_ID = String(ACTIVE_COHORT.id || COHORT_REGISTRY.defaultCohortId || 'default');
  const COHORT_NAME = String(ACTIVE_COHORT.name || COHORT_ID);
  const ANALYTICS_COHORT = String(ACTIVE_COHORT.analyticsKey || COHORT_ID);
  const LEGACY_ZMAN_IDS = Array.isArray(ACTIVE_COHORT.legacyIds) ? ACTIVE_COHORT.legacyIds.map(String) : [];
  const ANALYTICS_SETTINGS_KEY = 'scpStudy.analytics.v1';
  const ANALYTICS_QUEUE_KEY = 'scpStudy.analyticsQueue.v1';
  const ANALYTICS_INSTALLATION_KEY = 'scpStudy.analyticsInstallation.v1';
  const APP_VERSION_SEEN_KEY = 'scpStudy.appVersionSeen.v1';
  const CHABURA_SETTINGS_KEY = 'scpStudy.chabura.v1';
  const CHABURA_PROFILE_SENT_KEY = 'scpStudy.chaburaProfileSent.v1';
  const CHABURA_FALLBACK = 'Not listed / unsure';
  const CONTENT_FEEDBACK_QUEUE_KEY = 'scpStudy.contentFeedbackQueue.v1';
  const CONTENT_FEEDBACK_SENT_KEY = 'scpStudy.contentFeedbackSent.v1';
  const ANALYTICS_MAX_QUEUE = 500;
  const TEST_DURATION_MS = 90 * 60 * 1000;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const categories = [...new Set(QUESTIONS.map(q => q.category))];
  const questionById = new Map(QUESTIONS.map(q => [q.id, q]));
  const ESSAY_BANK = Array.isArray(window.ESSAY_PRACTICE_DATA) ? window.ESSAY_PRACTICE_DATA : [];
  const COURSE_NOTE_REFS = window.COURSE_NOTE_REFS || { docs: {}, questions: {}, essays: {} };
  const ESSAY_CATEGORY_TAGS = ACTIVE_COHORT.essayCategoryTags && typeof ACTIVE_COHORT.essayCategoryTags === 'object'
    ? ACTIVE_COHORT.essayCategoryTags : {};
  const ESSAY_CATEGORY_LIST = [...new Set(Object.values(ESSAY_CATEGORY_TAGS).flat())];
  const CHABURA_QUESTIONS = Array.isArray(window.SCP_CHABURA_DATA?.questions) ? window.SCP_CHABURA_DATA.questions : [];
  const CHABURA_LOCATION_QUESTION = CHABURA_QUESTIONS.find(item => item.id === 'location') || null;
  const CHABURA_QUESTION = CHABURA_QUESTIONS.find(item => item.id === 'chabura') || null;
  const CHABURA_LOCATIONS = Array.isArray(CHABURA_LOCATION_QUESTION?.options) ? CHABURA_LOCATION_QUESTION.options : [];
  const CHABURAS_BY_LOCATION = CHABURA_QUESTION?.optionsByLocation && typeof CHABURA_QUESTION.optionsByLocation === 'object'
    ? CHABURA_QUESTION.optionsByLocation : {};

  function cohortScopedKey(base) {
    return `${base}:${COHORT_ID}`;
  }

  function readScopedJson(base, fallback = null) {
    const key = cohortScopedKey(base);
    try {
      const scoped = localStorage.getItem(key);
      if (scoped !== null) return JSON.parse(scoped);
      for (const legacyId of LEGACY_ZMAN_IDS) {
        const legacyScoped = localStorage.getItem(`${base}:${legacyId}`);
        if (legacyScoped !== null) {
          localStorage.setItem(key, legacyScoped);
          return JSON.parse(legacyScoped);
        }
      }
      const defaultId = String(COHORT_REGISTRY.defaultCohortId || COHORT_ID);
      if (COHORT_ID === defaultId) {
        const legacy = localStorage.getItem(base);
        if (legacy !== null) {
          localStorage.setItem(key, legacy);
          return JSON.parse(legacy);
        }
      }
    } catch (_) {}
    return fallback;
  }

  function writeScopedJson(base, value) {
    try { localStorage.setItem(cohortScopedKey(base), JSON.stringify(value)); } catch (_) {}
  }

  function readScopedString(base, fallback = '') {
    const key = cohortScopedKey(base);
    try {
      const scoped = localStorage.getItem(key);
      if (scoped !== null) return scoped;
      for (const legacyId of LEGACY_ZMAN_IDS) {
        const legacyScoped = localStorage.getItem(`${base}:${legacyId}`);
        if (legacyScoped !== null) {
          localStorage.setItem(key, legacyScoped);
          return legacyScoped;
        }
      }
      const defaultId = String(COHORT_REGISTRY.defaultCohortId || COHORT_ID);
      if (COHORT_ID === defaultId) {
        const legacy = localStorage.getItem(base);
        if (legacy !== null) {
          localStorage.setItem(key, legacy);
          return legacy;
        }
      }
    } catch (_) {}
    return fallback;
  }

  function writeScopedString(base, value) {
    try { localStorage.setItem(cohortScopedKey(base), String(value ?? '')); } catch (_) {}
  }

  function removeScopedValue(base) {
    try { localStorage.removeItem(cohortScopedKey(base)); } catch (_) {}
  }

  function readMainProgressEnvelope() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { scopeVersion: 1, cohorts: {} };
      const parsed = JSON.parse(raw);
      if (parsed?.scopeVersion === 1 && parsed.cohorts && typeof parsed.cohorts === 'object') {
        if (!parsed.cohorts[COHORT_ID]) {
          for (const legacyId of LEGACY_ZMAN_IDS) {
            if (parsed.cohorts[legacyId]) {
              parsed.cohorts[COHORT_ID] = parsed.cohorts[legacyId];
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              break;
            }
          }
        }
        return parsed;
      }
      const migrated = { scopeVersion: 1, cohorts: { [COHORT_ID]: parsed } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (_) {
      return { scopeVersion: 1, cohorts: {} };
    }
  }

  function readMainProgressForCohort() {
    const envelope = readMainProgressEnvelope();
    return envelope.cohorts?.[COHORT_ID] || null;
  }

  function writeMainProgressForCohort(value) {
    const envelope = readMainProgressEnvelope();
    envelope.scopeVersion = 1;
    envelope.cohorts ||= {};
    envelope.cohorts[COHORT_ID] = value;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); } catch (_) {}
  }

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
  const GLOSSARY_CATEGORY_LINKS = ACTIVE_COHORT.glossaryCategoryLinks && typeof ACTIVE_COHORT.glossaryCategoryLinks === 'object'
    ? ACTIVE_COHORT.glossaryCategoryLinks : {};
  const glossaryCategoryCache = new Map();
  let activeGlossaryEntry = null;

  const el = id => document.getElementById(id);
  const dom = {
    modeLabel: el('modeLabel'), timerLabel: el('timerLabel'), mainTimer: el('mainTimer'), timerCard: el('timerCard'), brandLogo: el('brandLogo'), brandTitle: el('brandTitle'),
    appInfoDialog: el('appInfoDialog'), closeAppInfo: el('closeAppInfo'), appInfoMcBtn: el('appInfoMcBtn'), appInfoEssayBtn: el('appInfoEssayBtn'), appInfoTestBtn: el('appInfoTestBtn'), appInfoShareBtn: el('appInfoShareBtn'), appInfoUpdateBtn: el('appInfoUpdateBtn'), appInfoSettingsBtn: el('appInfoSettingsBtn'),
    notificationInboxDialog: el('notificationInboxDialog'),
    categoriesBtn: el('categoriesBtn'), materialsBtn: el('materialsBtn'), statsBtn: el('statsBtn'), essayBtn: el('essayBtn'), testBtn: el('testBtn'), questionSearchFab: el('questionSearchFab'), installBtn: el('installBtn'), installGuideDialog: el('installGuideDialog'), closeInstallGuide: el('closeInstallGuide'),
    testProgressWrap: el('testProgressWrap'), testQuestionCount: el('testQuestionCount'), testAnsweredCount: el('testAnsweredCount'), testProgressFill: el('testProgressFill'),
    questionNumber: el('questionNumber'), questionCategory: el('questionCategory'), questionStatus: el('questionStatus'), questionPrompt: el('questionPrompt'), questionReportBtn: el('questionReportBtn'), multiNote: el('multiNote'), questionAudio: el('questionAudio'), questionNoteLinks: el('questionNoteLinks'), answerForm: el('answerForm'),
    feedbackBox: el('feedbackBox'), feedbackResult: el('feedbackResult'), feedbackTime: el('feedbackTime'), feedbackCategory: el('feedbackCategory'), feedbackExplanation: el('feedbackExplanation'), correctAnswerLine: el('correctAnswerLine'),
    questionCard: el('questionCard'), prevBtn: el('prevBtn'), submitBtn: el('submitBtn'), nextBtn: el('nextBtn'), saveNote: el('saveNote'),
    categoriesDialog: el('categoriesDialog'), categoriesDialogTitle: el('categoriesDialogTitle'), categoriesDialogDescription: el('categoriesDialogDescription'), categoryOptions: el('categoryOptions'), selectAllCategories: el('selectAllCategories'), clearCategories: el('clearCategories'), applyCategories: el('applyCategories'),
    materialsDialog: el('materialsDialog'), closeMaterials: el('closeMaterials'), doneMaterialsBtn: el('doneMaterialsBtn'), materialsTabs: el('materialsTabs'), materialsPanelAudio: el('materialsPanelAudio'), materialsPanelQuestions: el('materialsPanelQuestions'), materialsPanelEssays: el('materialsPanelEssays'), materialsPanelGlossary: el('materialsPanelGlossary'), materialsPanelDownloads: el('materialsPanelDownloads'), materialsPanelSettings: el('materialsPanelSettings'), materialsQuestionInput: el('materialsQuestionInput'), materialsQuestionGoBtn: el('materialsQuestionGoBtn'), materialsBrowseAllQuestions: el('materialsBrowseAllQuestions'), materialsCurrentQuestionBtn: el('materialsCurrentQuestionBtn'), materialsQuestionCategories: el('materialsQuestionCategories'), materialsQuestionCount: el('materialsQuestionCount'), materialsEssayInput: el('materialsEssayInput'), materialsEssaySearchClear: el('materialsEssaySearchClear'), materialsBrowseAllEssays: el('materialsBrowseAllEssays'), materialsEssayList: el('materialsEssayList'), materialsEssayEmpty: el('materialsEssayEmpty'), materialsEssayCount: el('materialsEssayCount'), downloadAllAudioBtn: el('downloadAllAudioBtn'), audioCacheStatus: el('audioCacheStatus'), glossarySearchInput: el('glossarySearchInput'), glossarySearchClear: el('glossarySearchClear'), glossaryCount: el('glossaryCount'), glossaryList: el('glossaryList'), glossaryEmpty: el('glossaryEmpty'), settingsCohortSelect: el('settingsCohortSelect'), switchCohortBtn: el('switchCohortBtn'), cohortSettingsStatus: el('cohortSettingsStatus'), analyticsToggle: el('analyticsToggle'), analyticsStatus: el('analyticsStatus'), settingsChaburaLocation: el('settingsChaburaLocation'), settingsChaburaSelect: el('settingsChaburaSelect'), saveChaburaSettingsBtn: el('saveChaburaSettingsBtn'), chaburaSettingsStatus: el('chaburaSettingsStatus'), clearCacheBtn: el('clearCacheBtn'), settingsResetStatsBtn: el('settingsResetStatsBtn'), settingsStatus: el('settingsStatus'), settingsTransferStatus: el('settingsTransferStatus'),
    essayIntroDialog: el('essayIntroDialog'), closeEssayIntro: el('closeEssayIntro'), cancelEssayStart: el('cancelEssayStart'), startEssayFromIntroBtn: el('startEssayFromIntroBtn'), viewEssayLibraryBtn: el('viewEssayLibraryBtn'), essayIntroMastered: el('essayIntroMastered'), essayIntroSeen: el('essayIntroSeen'), essayIntroPracticed: el('essayIntroPracticed'), essayIntroPerfect: el('essayIntroPerfect'),
    essayLibraryDialog: el('essayLibraryDialog'), closeEssayLibrary: el('closeEssayLibrary'), doneEssayLibrary: el('doneEssayLibrary'), essayLibrarySearch: el('essayLibrarySearch'), essayLibrarySearchClear: el('essayLibrarySearchClear'), essayLibrarySummary: el('essayLibrarySummary'), essayLibraryList: el('essayLibraryList'), essayLibraryEmpty: el('essayLibraryEmpty'),
    essayPracticeMain: el('essayPracticeMain'), essayQuickNav: el('essayQuickNav'), essayCategoryTags: el('essayCategoryTags'), essayPracticeCounter: el('essayPracticeCounter'), essayMasterySummary: el('essayMasterySummary'), essayPracticeTitle: el('essayPracticeTitle'), essayPracticePrompt: el('essayPracticePrompt'), essayNoteLinks: el('essayNoteLinks'), essayQuestionAudio: el('essayQuestionAudio'), essayPromptReportBtn: el('essayPromptReportBtn'), essayBuildProgress: el('essayBuildProgress'), essayAnswerZone: el('essayAnswerZone'), essayMatchSection: el('essayMatchSection'), essayMatchCount: el('essayMatchCount'), essayMatchContext: el('essayMatchContext'), essayMatchName: el('essayMatchName'), essayPairingReportBtn: el('essayPairingReportBtn'), essayPairingResources: el('essayPairingResources'), essayChoiceList: el('essayChoiceList'), essayFeedback: el('essayFeedback'), essayModelAnswerWrap: el('essayModelAnswerWrap'), essayModelAnswer: el('essayModelAnswer'), essayTryAgainBtn: el('essayTryAgainBtn'), essayNextBtn: el('essayNextBtn'),
    audioPlayerShell: el('audioPlayerShell'), audioPlayer: el('audioPlayer'), audioTrackTitle: el('audioTrackTitle'), audioTrackCounter: el('audioTrackCounter'), audioPrevBtn: el('audioPrevBtn'), audioBack10Btn: el('audioBack10Btn'), audioForward10Btn: el('audioForward10Btn'), audioNextBtn: el('audioNextBtn'), audioEmptyState: el('audioEmptyState'), audioPlaylistWrap: el('audioPlaylistWrap'), audioPlaylistCount: el('audioPlaylistCount'), audioPlaylistToggle: el('audioPlaylistToggle'), audioPlaylist: el('audioPlaylist'), transcriptPanel: el('transcriptPanel'), transcriptToggle: el('transcriptToggle'), audioTranscript: el('audioTranscript'), transcriptClock: el('transcriptClock'), miniAudioPlayer: el('miniAudioPlayer'), miniAudioOpen: el('miniAudioOpen'), miniAudioTitle: el('miniAudioTitle'), miniAudioTime: el('miniAudioTime'), miniAudioBack10: el('miniAudioBack10'), miniAudioPlayPause: el('miniAudioPlayPause'), miniAudioStop: el('miniAudioStop'),
    statsDialog: el('statsDialog'), statsContent: el('statsContent'), closeStats: el('closeStats'), resetStatsBtn: el('resetStatsBtn'), doneStatsBtn: el('doneStatsBtn'),
    questionReviewDialog: el('questionReviewDialog'), closeQuestionReview: el('closeQuestionReview'), reviewTitle: el('reviewTitle'), reviewContextLabel: el('reviewContextLabel'), reviewSearchInput: el('reviewSearchInput'), reviewSearchClear: el('reviewSearchClear'), reviewSearchCount: el('reviewSearchCount'), reviewSearchEmpty: el('reviewSearchEmpty'), reviewNav: el('reviewNav'), reviewBody: el('reviewBody'), reviewQuestionNumber: el('reviewQuestionNumber'), reviewCategory: el('reviewCategory'), reviewQuestionReportBtn: el('reviewQuestionReportBtn'), reviewStatsGrid: el('reviewStatsGrid'), reviewLastAnswer: el('reviewLastAnswer'), reviewPrompt: el('reviewPrompt'), reviewChoices: el('reviewChoices'), reviewExplanation: el('reviewExplanation'), reviewCorrectAnswer: el('reviewCorrectAnswer'), reviewAnswerDetails: el('reviewAnswerDetails'), reviewRevealBtn: el('reviewRevealBtn'), reviewAudio: el('reviewAudio'), reviewNoteLinks: el('reviewNoteLinks'), reviewPrevBtn: el('reviewPrevBtn'), reviewNextBtn: el('reviewNextBtn'), reviewCounter: el('reviewCounter'),
    mcIntroDialog: el('mcIntroDialog'), closeMcIntro: el('closeMcIntro'), cancelMcStart: el('cancelMcStart'), startMcFromIntroBtn: el('startMcFromIntroBtn'),
    testIntroDialog: el('testIntroDialog'), closeTestIntro: el('closeTestIntro'), cancelTestStart: el('cancelTestStart'), startTestBtn: el('startTestBtn'),
    testResultDialog: el('testResultDialog'), testResultSubtitle: el('testResultSubtitle'), testResultContent: el('testResultContent'), closeTestResult: el('closeTestResult'), reviewStatsAfterTest: el('reviewStatsAfterTest'), returnToStudy: el('returnToStudy'),
    glossaryTermDialog: el('glossaryTermDialog'), closeGlossaryTerm: el('closeGlossaryTerm'), glossaryTermTitle: el('glossaryTermTitle'), glossaryTermPronunciation: el('glossaryTermPronunciation'), glossaryTermIpa: el('glossaryTermIpa'), glossaryTermDefinition: el('glossaryTermDefinition'), glossarySpeakBtn: el('glossarySpeakBtn'), glossaryTermCategoriesWrap: el('glossaryTermCategoriesWrap'), glossaryTermCategories: el('glossaryTermCategories'),
    contentFeedbackDialog: el('contentFeedbackDialog'), closeContentFeedback: el('closeContentFeedback'), cancelContentFeedback: el('cancelContentFeedback'), submitContentFeedback: el('submitContentFeedback'), contentFeedbackType: el('contentFeedbackType'), contentFeedbackTitle: el('contentFeedbackTitle'), contentFeedbackPreview: el('contentFeedbackPreview'), contentFeedbackDetails: el('contentFeedbackDetails'), contentFeedbackCount: el('contentFeedbackCount'), contentFeedbackStatus: el('contentFeedbackStatus'),
    appVersionFooter: el('appVersionFooter'), appToast: el('appToast'), updatePullIndicator: el('updatePullIndicator'),
    pdfViewerDialog: el('pdfViewerDialog'), pdfViewerBackBtn: el('pdfViewerBackBtn'), pdfViewerTitle: el('pdfViewerTitle'), pdfViewerJump: el('pdfViewerJump'), pdfViewerShareBtn: el('pdfViewerShareBtn'), pdfViewerPrintBtn: el('pdfViewerPrintBtn'), pdfViewerDownloadBtn: el('pdfViewerDownloadBtn'), pdfViewerBody: el('pdfViewerBody'), pdfViewerStatus: el('pdfViewerStatus'), pdfViewerPages: el('pdfViewerPages'),
    chaburaDialog: el('chaburaDialog'), chaburaDialogLocation: el('chaburaDialogLocation'), chaburaDialogSelect: el('chaburaDialogSelect'), saveChaburaDialogBtn: el('saveChaburaDialogBtn')
  };

  let importReloadPending = false;
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
  const materialsScrollByTab = { audio: 0, questions: 0, glossary: 0, downloads: 0, settings: 0 };
  let glossaryPronunciationAudio = null;
  let resumeCourseAudioAfterGlossary = false;
  let analyticsFlushInFlight = false;
  let analyticsAssistKey = null;
  let analyticsAssist = { audioUsed: false, glossaryUsed: false };
  let essayProgressState = loadEssayProgress();
  let essayRun = null;
  let essayModeActive = false;
  let essaySessionNumber = 0;
  let essayAnalyticsSessionId = null;
  let activeContentFeedbackTarget = null;
  let contentFeedbackFlushInFlight = false;
  let appToastTimer = null;
  let updateCheckInFlight = null;
  let activePdfViewer = null;
  let pdfJsPromise = null;
  const dialogs = [dom.categoriesDialog, dom.materialsDialog, dom.essayIntroDialog, dom.essayLibraryDialog, dom.statsDialog, dom.questionReviewDialog, dom.pdfViewerDialog, dom.appInfoDialog, dom.mcIntroDialog, dom.testIntroDialog, dom.testResultDialog, dom.installGuideDialog, dom.glossaryTermDialog, dom.contentFeedbackDialog, dom.notificationInboxDialog, dom.chaburaDialog].filter(Boolean);


  function chaburaOptions(location) {
    const listed = Array.isArray(CHABURAS_BY_LOCATION?.[location]) ? CHABURAS_BY_LOCATION[location] : [];
    return [...listed, CHABURA_FALLBACK];
  }

  function validChaburaSettings(value) {
    if (!value || typeof value !== 'object') return null;
    const location = String(value.location || '').trim();
    const chabura = String(value.chabura || '').trim();
    if (!CHABURA_LOCATIONS.includes(location) || !chaburaOptions(location).includes(chabura)) return null;
    return { location, chabura };
  }

  function loadChaburaSettings() {
    try { return validChaburaSettings(readScopedJson(CHABURA_SETTINGS_KEY, null)); }
    catch (_) { return null; }
  }

  function analyticsProfileFields() {
    const profile = loadChaburaSettings();
    return { chabura: profile?.chabura || null, chaburaRegion: profile?.location || null };
  }

  function fillChaburaLocationSelect(select, selected = '') {
    if (!select) return;
    select.innerHTML = '<option value="">Choose a location…</option>' + CHABURA_LOCATIONS.map(location =>
      `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`
    ).join('');
    if (CHABURA_LOCATIONS.includes(selected)) select.value = selected;
  }

  function fillChaburaSelect(select, location, selected = '') {
    if (!select) return;
    const options = CHABURA_LOCATIONS.includes(location) ? chaburaOptions(location) : [];
    select.innerHTML = '<option value="">Choose a chabura…</option>' + options.map(chabura =>
      `<option value="${escapeHtml(chabura)}">${escapeHtml(chabura)}</option>`
    ).join('');
    select.disabled = !CHABURA_LOCATIONS.includes(location);
    if (options.includes(selected)) select.value = selected;
  }

  function cohortRegistryEntries() {
    return Array.isArray(COHORT_REGISTRY.cohorts) ? COHORT_REGISTRY.cohorts : [];
  }

  function syncCohortSettingsUi() {
    const entries = cohortRegistryEntries();
    if (dom.settingsCohortSelect) {
      dom.settingsCohortSelect.innerHTML = entries.map(cohort =>
        `<option value="${escapeHtml(cohort.id)}">${escapeHtml(cohort.name || cohort.id)}</option>`
      ).join('');
      if (entries.some(cohort => cohort.id === COHORT_ID)) dom.settingsCohortSelect.value = COHORT_ID;
    }
    const selected = dom.settingsCohortSelect?.value || COHORT_ID;
    if (dom.switchCohortBtn) dom.switchCohortBtn.disabled = selected === COHORT_ID || mode === 'test';
    if (dom.cohortSettingsStatus) dom.cohortSettingsStatus.textContent = `Current: ${COHORT_NAME}`;
  }

  function switchStudyCohort() {
    const id = String(dom.settingsCohortSelect?.value || '');
    const target = cohortRegistryEntries().find(cohort => cohort.id === id);
    if (!target || id === COHORT_ID) return;
    if (mode === 'test' && state.activeTest) {
      if (dom.cohortSettingsStatus) dom.cohortSettingsStatus.textContent = 'Exit the practice test before switching Zmanim.';
      return;
    }
    flushQuestionTime();
    flushStudyTime();
    try { localStorage.setItem(COHORT_SELECTION_KEY, id); } catch (_) {}
    if (dom.cohortSettingsStatus) dom.cohortSettingsStatus.textContent = `Switching to ${target.name || id}…`;
    window.setTimeout(() => window.location.reload(), 80);
  }

  function syncChaburaSettingsUi() {
    const saved = loadChaburaSettings();
    fillChaburaLocationSelect(dom.settingsChaburaLocation, saved?.location || '');
    fillChaburaSelect(dom.settingsChaburaSelect, saved?.location || '', saved?.chabura || '');
    if (dom.chaburaSettingsStatus) dom.chaburaSettingsStatus.textContent = saved
      ? `Current: ${saved.chabura} · ${saved.location}`
      : 'Current: Not selected';
  }

  function setChaburaProfile(location, chabura) {
    const next = validChaburaSettings({ location, chabura });
    if (!next) return false;
    const previous = loadChaburaSettings();
    writeScopedJson(CHABURA_SETTINGS_KEY, next);
    if (!previous || previous.location !== next.location || previous.chabura !== next.chabura) {
      removeScopedValue(CHABURA_PROFILE_SENT_KEY);
    }
    syncChaburaSettingsUi();
    updateAnalyticsUi();
    queueChaburaProfileAnalytics();
    return true;
  }

  function queueChaburaProfileAnalytics() {
    if (!analyticsEnabled()) return;
    const profile = loadChaburaSettings();
    if (!profile) return;
    const signature = `${profile.location}\n${profile.chabura}`;
    let sent = '';
    try { sent = readScopedString(CHABURA_PROFILE_SENT_KEY, ''); } catch (_) {}
    if (sent === signature) return;
    const queue = analyticsQueue();
    if (queue.some(item => item?.kind === 'profile' && item.cohort === ANALYTICS_COHORT && item.chabura === profile.chabura && item.chaburaRegion === profile.location)) return;
    queue.push({
      kind: 'profile',
      eventId: analyticsUuid('profile'),
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      appVersion: String(APP_VERSION),
      clientTs: new Date().toISOString(),
      chabura: profile.chabura,
      chaburaRegion: profile.location
    });
    saveAnalyticsQueue(queue);
    void flushAnalyticsQueue();
  }

  function prepareChaburaOnboarding() {
    const saved = loadChaburaSettings();
    if (saved || !dom.chaburaDialog) return;
    fillChaburaLocationSelect(dom.chaburaDialogLocation, '');
    fillChaburaSelect(dom.chaburaDialogSelect, '', '');
    dom.saveChaburaDialogBtn.disabled = true;
    if (!dom.chaburaDialog.open) dom.chaburaDialog.showModal();
  }

  function isMobileShareLayout() {
    return window.matchMedia?.('(max-width: 780px), (pointer: coarse)')?.matches ?? false;
  }

  async function shareStudyApp() {
    const url = new URL('./', window.location.href).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SCP Study', text: 'SCP Study', url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('SCP Study link copied.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('Could not share app:', error);
    }
  }

  function updateBrandShareAffordance() {
    [dom.brandLogo, dom.brandTitle].forEach(node => {
      if (!node) return;
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', 'About SCP Study');
      node.setAttribute('title', 'About SCP Study');
    });
  }

  function updateAppInfoModeUi() {
    const inEssay = essayModeActive && mode === 'study';
    const inTest = mode === 'test';
    [
      [dom.appInfoMcBtn, !inEssay && !inTest],
      [dom.appInfoEssayBtn, inEssay],
      [dom.appInfoTestBtn, inTest]
    ].forEach(([button, active]) => {
      if (!button) return;
      button.classList.toggle('active-mode', !!active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function openAppInfo() {
    updateAppInfoModeUi();
    if (dom.appInfoDialog && !dom.appInfoDialog.open) dom.appInfoDialog.showModal();
  }

  function openSettingsFromAppInfo() {
    dom.appInfoDialog?.close();
    openMaterials('settings');
  }

  function chooseModeFromAppInfo(target) {
    dom.appInfoDialog?.close();
    if (target === 'mc') {
      if (mode === 'test') {
        showAppToast('Exit the practice test before switching to M/C.');
        return;
      }
      if (essayModeActive) leaveEssayMode();
      return;
    }
    if (target === 'essay') {
      if (mode === 'test') {
        showAppToast('Exit the practice test before switching to Essay mode.');
        return;
      }
      if (!essayModeActive) openEssayIntro();
      return;
    }
    if (target === 'test') {
      if (mode === 'test') return;
      flushQuestionTime();
      if (!dom.testIntroDialog.open) dom.testIntroDialog.showModal();
    }
  }


  function showAppToast(message, duration = 3200) {
    if (!dom.appToast || !message) return;
    clearTimeout(appToastTimer);
    dom.appToast.textContent = message;
    dom.appToast.classList.remove('hidden');
    requestAnimationFrame(() => dom.appToast.classList.add('show'));
    appToastTimer = window.setTimeout(() => {
      dom.appToast.classList.remove('show');
      window.setTimeout(() => dom.appToast.classList.add('hidden'), 190);
    }, duration);
  }

  function updateAppVersionUi() {
    if (dom.appVersionFooter) dom.appVersionFooter.textContent = `SCP Study v${APP_VERSION}`;
    const aboutVersion = document.getElementById('appInfoVersion');
    if (aboutVersion) aboutVersion.textContent = `v${APP_VERSION}`;
  }

  function consumeUpdateAnnouncement() {
    let previous = '';
    try { previous = localStorage.getItem(APP_VERSION_SEEN_KEY) || ''; } catch (_) {}
    const current = String(APP_VERSION);
    const url = new URL(window.location.href);
    const updated = url.searchParams.get('scp_updated');
    try { localStorage.setItem(APP_VERSION_SEEN_KEY, current); } catch (_) {}

    if (updated) {
      url.searchParams.delete('scp_updated');
      history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
      if (!previous || previous !== current) window.setTimeout(() => showAppToast(`Updated app to v${APP_VERSION}`), 280);
      return;
    }
    if (previous && previous !== current) window.setTimeout(() => showAppToast(`Updated app to v${APP_VERSION}`), 280);
  }

  async function checkForAppUpdate({ manual = false } = {}) {
    if (!('serviceWorker' in navigator)) {
      if (manual) showAppToast('Update checks are not supported in this browser.');
      return null;
    }
    if (updateCheckInFlight) return updateCheckInFlight;

    updateCheckInFlight = (async () => {
      if (manual) showAppToast('Checking for updates…', 1800);
      try {
        let registration = await navigator.serviceWorker.getRegistration('./');
        if (!registration) registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });

        let updateFound = false;
        const onUpdateFound = () => {
          updateFound = true;
          if (manual) showAppToast('Update found. Refreshing…', 4500);
        };
        registration.addEventListener('updatefound', onUpdateFound, { once: true });
        await registration.update();

        if (manual && !updateFound) {
          window.setTimeout(() => showAppToast(`SCP Study v${APP_VERSION} is up to date.`), 220);
        }
        return registration;
      } catch (err) {
        console.warn('App update check failed:', err);
        if (manual) showAppToast('Could not check for updates. Try again when online.');
        return null;
      } finally {
        updateCheckInFlight = null;
      }
    })();

    return updateCheckInFlight;
  }

  function setupPullToCheckUpdates() {
    if (!('ontouchstart' in window) || !dom.updatePullIndicator) return;
    let tracking = false;
    let startY = 0;
    let armed = false;

    const hide = () => {
      dom.updatePullIndicator.classList.remove('visible');
      window.setTimeout(() => dom.updatePullIndicator.classList.add('hidden'), 140);
    };

    document.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || window.scrollY > 0 || dialogs.some(dialog => dialog.open)) return;
      tracking = true;
      armed = false;
      startY = event.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', event => {
      if (!tracking || event.touches.length !== 1) return;
      const distance = event.touches[0].clientY - startY;
      if (distance < 22) return;
      armed = distance >= 78;
      dom.updatePullIndicator.textContent = armed ? 'Release to check for updates' : 'Pull down to check for updates';
      dom.updatePullIndicator.classList.remove('hidden');
      requestAnimationFrame(() => dom.updatePullIndicator.classList.add('visible'));
    }, { passive: true });

    const finish = () => {
      if (!tracking) return;
      const shouldCheck = armed;
      tracking = false;
      armed = false;
      hide();
      if (shouldCheck) void checkForAppUpdate({ manual: true });
    };
    document.addEventListener('touchend', finish, { passive: true });
    document.addEventListener('touchcancel', finish, { passive: true });
  }

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
      queueChaburaProfileAnalytics();
      void flushAnalyticsQueue();
    }
    updateAnalyticsUi();
  }

  function updateAnalyticsUi() {
    const enabled = analyticsEnabled();
    const profile = loadChaburaSettings();
    if (dom.analyticsToggle) dom.analyticsToggle.checked = enabled;
    if (dom.analyticsStatus) dom.analyticsStatus.textContent = enabled
      ? `On · anonymous study activity, ${profile ? 'selected chabura, ' : ''}and broad IP-derived location are shared.`
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

  function feedbackHash(value) {
    let hash = 2166136261;
    const input = String(value || '');
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function contentFeedbackQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONTENT_FEEDBACK_QUEUE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveContentFeedbackQueue(queue) {
    try { localStorage.setItem(CONTENT_FEEDBACK_QUEUE_KEY, JSON.stringify(queue.slice(-100))); } catch (_) {}
  }

  function contentFeedbackSentMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONTENT_FEEDBACK_SENT_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveContentFeedbackSent(key) {
    const map = contentFeedbackSentMap();
    map[key] = Date.now();
    const entries = Object.entries(map).sort((a,b) => Number(b[1]) - Number(a[1])).slice(0, 250);
    try { localStorage.setItem(CONTENT_FEEDBACK_SENT_KEY, JSON.stringify(Object.fromEntries(entries))); } catch (_) {}
  }

  function feedbackTargetKey(target) {
    return target ? `${COHORT_ID}:${target.contentType}:${target.contentId}:${feedbackHash(target.wording)}` : '';
  }

  function questionFeedbackTarget(q, source = 'study') {
    if (!q) return null;
    const current = currentQuestion();
    const entry = current?.id === q.id ? currentEntry() : null;
    const wording = [
      q.prompt,
      ...(q.choices || []).map((choice, i) => `${LETTERS[i]}. ${choice}`),
      `Correct: ${(q.answer || []).join(', ')}`,
      q.explanation ? `Explanation: ${q.explanation}` : ''
    ].filter(Boolean).join('\n');
    return {
      contentType: 'question',
      contentId: String(q.id),
      parentId: null,
      title: `Question ${q.id}`,
      category: q.category || '',
      preview: q.prompt,
      wording,
      source,
      context: {
        mode,
        selected: Array.isArray(entry?.selected) ? [...entry.selected] : [],
        answered: !!entry?.answered
      }
    };
  }

  function essayPromptFeedbackTarget(essay, source = 'essay_practice') {
    if (!essay) return null;
    return {
      contentType: 'essay_prompt',
      contentId: String(essay.id),
      parentId: String(essay.id),
      title: essay.title || 'Essay question',
      category: essay.title || '',
      preview: essay.prompt || '',
      wording: essay.prompt || '',
      source,
      context: { essayId: essay.id }
    };
  }

  function essayPairingFeedbackTarget(essay, fact, source = 'essay_practice') {
    if (!essay || !fact) return null;
    const name = essayNameText(fact);
    const position = essayPositionText(fact);
    return {
      contentType: 'essay_pairing',
      contentId: String(fact.id),
      parentId: String(essay.id),
      title: `${essay.title} · ${name}`,
      category: essay.title || '',
      preview: `${name} → ${position}`,
      wording: `${name} → ${position}`,
      source,
      context: {
        essayId: essay.id,
        pairingLabel: fact.label || '',
        options: essayRun?.essay?.id === essay.id && currentEssayFact()?.id === fact.id
          ? (essayRun.stepChoices || []).map(id => essay.facts.find(item => item.id === id)).filter(Boolean).map(item => essayPositionText(item))
          : []
      }
    };
  }

  function resetContentFeedbackForm() {
    dom.contentFeedbackDialog?.querySelectorAll('input[name="contentFeedbackReason"]').forEach(input => { input.checked = false; });
    if (dom.contentFeedbackDetails) dom.contentFeedbackDetails.value = '';
    if (dom.contentFeedbackCount) dom.contentFeedbackCount.textContent = '0/500';
    if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = '';
    if (dom.submitContentFeedback) dom.submitContentFeedback.disabled = true;
  }

  function openContentFeedback(target) {
    if (!target || !dom.contentFeedbackDialog) return;
    activeContentFeedbackTarget = target;
    resetContentFeedbackForm();
    const labels = { question: 'Question', essay_prompt: 'Essay question', essay_pairing: 'Essay pairing' };
    if (dom.contentFeedbackType) dom.contentFeedbackType.textContent = labels[target.contentType] || 'Content';
    if (dom.contentFeedbackTitle) dom.contentFeedbackTitle.textContent = target.title || '';
    if (dom.contentFeedbackPreview) dom.contentFeedbackPreview.textContent = target.preview || target.wording || '';
    const key = feedbackTargetKey(target);
    const already = !!contentFeedbackSentMap()[key] || contentFeedbackQueue().some(item => item.dedupeKey === key);
    if (already) {
      if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = 'You already reported this wording. You can report it again after the content changes.';
      if (dom.submitContentFeedback) dom.submitContentFeedback.disabled = true;
    }
    if (!dom.contentFeedbackDialog.open) dom.contentFeedbackDialog.showModal();
  }

  function selectedContentFeedbackReasons() {
    return [...(dom.contentFeedbackDialog?.querySelectorAll('input[name="contentFeedbackReason"]:checked') || [])].map(input => input.value);
  }

  function selectedContentFeedbackReason() {
    return selectedContentFeedbackReasons()[0] || '';
  }

  function updateContentFeedbackSubmitState() {
    if (!dom.submitContentFeedback) return;
    const target = activeContentFeedbackTarget;
    const key = feedbackTargetKey(target);
    const duplicate = !!contentFeedbackSentMap()[key] || contentFeedbackQueue().some(item => item.dedupeKey === key);
    dom.submitContentFeedback.disabled = !target || !selectedContentFeedbackReasons().length || duplicate;
  }

  async function sendContentFeedbackEvent(event) {
    const response = await fetch(CONTENT_FEEDBACK_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-SCP-Analytics-Version': '1' },
      body: JSON.stringify(event)
    });
    if (!response.ok) {
      let message = `Feedback upload failed (${response.status})`;
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch (_) {}
      throw new Error(message);
    }
    return response;
  }

  async function flushContentFeedbackQueue() {
    if (contentFeedbackFlushInFlight || !navigator.onLine) return;
    const queue = contentFeedbackQueue();
    if (!queue.length) return;
    contentFeedbackFlushInFlight = true;
    const remaining = [...queue];
    try {
      while (remaining.length && navigator.onLine) {
        const item = remaining[0];
        await sendContentFeedbackEvent(item.event);
        saveContentFeedbackSent(item.dedupeKey);
        remaining.shift();
        saveContentFeedbackQueue(remaining);
      }
    } catch (err) {
      console.warn('Content feedback upload deferred:', err);
    } finally {
      contentFeedbackFlushInFlight = false;
    }
  }

  async function submitActiveContentFeedback() {
    const target = activeContentFeedbackTarget;
    const reasons = selectedContentFeedbackReasons();
    const reason = reasons[0] || '';
    if (!target || !reasons.length) return;
    const details = String(dom.contentFeedbackDetails?.value || '').trim().slice(0, 500);
    const contentHash = feedbackHash(target.wording);
    const dedupeKey = feedbackTargetKey(target);
    if (contentFeedbackSentMap()[dedupeKey] || contentFeedbackQueue().some(item => item.dedupeKey === dedupeKey)) {
      if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = 'This wording was already reported from this device.';
      updateContentFeedbackSubmitState();
      return;
    }

    const event = {
      eventId: crypto?.randomUUID?.() || `fb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      ...analyticsProfileFields(),
      appVersion: String(APP_VERSION),
      clientTs: new Date().toISOString(),
      contentType: target.contentType,
      contentId: target.contentId,
      parentId: target.parentId || null,
      title: target.title || '',
      category: target.category || '',
      wording: target.wording || '',
      contentHash,
      reason,
      reasons,
      details,
      source: target.source || 'other',
      context: target.context || {}
    };

    if (dom.submitContentFeedback) dom.submitContentFeedback.disabled = true;
    if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = 'Sending…';
    try {
      await sendContentFeedbackEvent(event);
      saveContentFeedbackSent(dedupeKey);
      if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = 'Thanks — your feedback was sent.';
      setTimeout(() => {
        if (dom.contentFeedbackDialog?.open) dom.contentFeedbackDialog.close();
      }, 700);
    } catch (err) {
      const queue = contentFeedbackQueue();
      queue.push({ dedupeKey, event });
      saveContentFeedbackQueue(queue);
      if (dom.contentFeedbackStatus) dom.contentFeedbackStatus.textContent = 'Saved on this device and will send when you are back online.';
      setTimeout(() => {
        if (dom.contentFeedbackDialog?.open) dom.contentFeedbackDialog.close();
      }, 900);
    }
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
      ...analyticsProfileFields(),
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

  function queueResourceAnalytics({ resourceType, resourceId, resourceLabel, resourceVariant = null, page = null, source = 'other', contextKind = 'other', contextId = null, category = null } = {}) {
    if (!analyticsEnabled() || !['audio','notes'].includes(resourceType) || !resourceId || !resourceLabel) return;
    const event = {
      kind:'resource',
      eventId: analyticsUuid('resource'),
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      ...analyticsProfileFields(),
      appVersion:String(APP_VERSION),
      clientTs:new Date().toISOString(),
      resourceType,
      resourceId:String(resourceId),
      resourceLabel:String(resourceLabel),
      resourceVariant:resourceVariant ? String(resourceVariant) : null,
      page:Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : null,
      source:String(source || 'other'),
      contextKind:String(contextKind || 'other'),
      contextId:contextId == null ? null : String(contextId),
      category:category ? String(category) : null,
      mode
    };
    const queue=analyticsQueue();
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
      ...analyticsProfileFields(),
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

  function analyticsUuid(prefix = 'evt') {
    return crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function essayFactContentHash(fact) {
    return feedbackHash(`${essayNameText(fact)} → ${essayPositionText(fact)}`);
  }

  function essayContentHash(essay) {
    if (!essay) return '';
    return feedbackHash([
      essay.prompt || '',
      ...(essay.facts || []).map(fact => `${essayNameText(fact)} → ${essayPositionText(fact)}`),
      essay.modelAnswer || ''
    ].join('\n'));
  }

  function queueEssayAnalytics(kind, payload = {}) {
    if (!analyticsEnabled() || !payload.essayId) return;
    const event = {
      kind,
      eventId: analyticsUuid('essay'),
      installationId: analyticsInstallationId(),
      cohort: ANALYTICS_COHORT,
      ...analyticsProfileFields(),
      appVersion: String(APP_VERSION),
      clientTs: new Date().toISOString(),
      ...payload
    };
    const queue = analyticsQueue();
    queue.push(event);
    saveAnalyticsQueue(queue);
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
      const profile = [...batch].reverse().find(item => item?.kind === 'profile' && item.chabura && item.chaburaRegion);
      if (profile) {
        writeScopedString(CHABURA_PROFILE_SENT_KEY, `${profile.chaburaRegion}\n${profile.chabura}`);
      }
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
      const parsed = readMainProgressForCohort();
      if (!parsed) return defaultState();
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
    if (importReloadPending) return;
    try { writeMainProgressForCohort(state); }
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

  function defaultEssayProgress() {
    return { version: 1, facts: {}, essays: {}, lastEssayId: null };
  }

  function loadEssayProgress() {
    try {
      const parsed = readScopedJson(ESSAY_PRACTICE_KEY, null);
      if (!parsed) return defaultEssayProgress();
      if (!parsed || typeof parsed !== 'object') return defaultEssayProgress();
      return {
        version: 1,
        facts: parsed.facts && typeof parsed.facts === 'object' ? parsed.facts : {},
        essays: parsed.essays && typeof parsed.essays === 'object' ? parsed.essays : {},
        lastEssayId: typeof parsed.lastEssayId === 'string' ? parsed.lastEssayId : null
      };
    } catch (_) {
      return defaultEssayProgress();
    }
  }

  function saveEssayProgress() {
    writeScopedJson(ESSAY_PRACTICE_KEY, essayProgressState);
    updateEssayProgressUi();
  }

  function essayFactIds() {
    return ESSAY_BANK.flatMap(essay => essay.facts.map(fact => fact.id));
  }

  function essayFactStat(id) {
    const stat = essayProgressState.facts[id] || {};
    return {
      seen: Math.max(0, Number(stat.seen) || 0),
      correct: Math.max(0, Number(stat.correct) || 0),
      mastery: Math.max(0, Math.min(3, Number(stat.mastery) || 0)),
      lastSeen: Number(stat.lastSeen) || 0
    };
  }

  function essayMasterySummary() {
    const ids = essayFactIds();
    const mastered = ids.filter(id => essayFactStat(id).mastery >= 2).length;
    const seen = ids.filter(id => essayFactStat(id).seen > 0).length;
    return { total: ids.length, mastered, seen };
  }

  function updateEssayProgressUi() {
    const summary = essayMasterySummary();
    const text = summary.total
      ? `${summary.mastered}/${summary.total} facts mastered · ${summary.seen}/${summary.total} seen`
      : 'Essay practice unavailable';
    if (dom.essayMasterySummary) dom.essayMasterySummary.textContent = text;

    const essayStats = Object.values(essayProgressState.essays || {});
    const practiced = essayStats.filter(stat => (Number(stat?.attempts) || 0) > 0).length;
    const perfect = essayStats.filter(stat => (Number(stat?.perfect) || 0) > 0).length;
    if (dom.essayIntroMastered) dom.essayIntroMastered.textContent = `${summary.mastered}/${summary.total}`;
    if (dom.essayIntroSeen) dom.essayIntroSeen.textContent = `${summary.seen}/${summary.total}`;
    if (dom.essayIntroPracticed) dom.essayIntroPracticed.textContent = `${practiced}/${ESSAY_BANK.length}`;
    if (dom.essayIntroPerfect) dom.essayIntroPerfect.textContent = String(perfect);
  }

  function openMultipleChoiceIntro() {
    if (!essayModeActive || mode === 'test' || !dom.mcIntroDialog) return;
    if (!dom.mcIntroDialog.open) dom.mcIntroDialog.showModal();
  }

  function leaveEssayMode() {
    if (!essayModeActive) return;
    essayModeActive = false;
    if (dom.mcIntroDialog?.open) dom.mcIntroDialog.close();
    render();
    scrollToQuestionTop();
  }

  function handleEssayModeButton() {
    if (essayModeActive) openMultipleChoiceIntro();
    else openEssayIntro();
  }

  function openEssayIntro() {
    if (mode === 'test' || !ESSAY_BANK.length) return;
    flushQuestionTime();
    updateEssayProgressUi();
    if (!dom.essayIntroDialog.open) dom.essayIntroDialog.showModal();
  }

  function essayLibraryHaystack(essay) {
    return [
      essay.title,
      essay.prompt,
      essay.modelAnswer,
      ...essay.facts.flatMap(fact => [fact.label, ...fact.tokens.map(([, text]) => text)])
    ].join(' ').toLowerCase();
  }

  function essayFactMasteryLabel(factId) {
    const stat = essayFactStat(factId);
    if (stat.mastery >= 2) return 'Mastered';
    if (stat.seen > 0) return 'Learning';
    return 'New';
  }

  function renderEssayLibrary(query = '') {
    if (!dom.essayLibraryList) return;
    const term = String(query || '').trim().toLowerCase();
    const rows = ESSAY_BANK.filter(essay => !term || essayLibraryHaystack(essay).includes(term));
    dom.essayLibraryList.innerHTML = '';

    rows.forEach((essay, index) => {
      const practiced = Number(essayProgressState.essays?.[essay.id]?.attempts) || 0;
      const masteredFacts = essay.facts.filter(fact => essayFactStat(fact.id).mastery >= 2).length;
      const card = document.createElement('article');
      card.className = 'essay-library-card';
      card.innerHTML = `
        <div class="essay-library-card-head">
          <div><span class="eyebrow">Essay ${index + 1}</span><h3>${escapeHtml(essay.title)}</h3></div>
          <span class="essay-library-progress">${masteredFacts}/${essay.facts.length} mastered</span>
        </div>
        <p class="essay-library-prompt"></p>
        <div class="course-note-links essay-library-note-links" data-essay-note-links></div>
        <div class="essay-library-actions">
          <button class="secondary compact" type="button" data-essay-library-practice="${escapeHtml(essay.id)}">Practice this essay</button>
          <button class="content-report-link" type="button" data-report-essay-prompt="${escapeHtml(essay.id)}">⚑ Report question</button>
          <span>${practiced ? `${practiced} attempt${practiced === 1 ? '' : 's'}` : 'Not practiced yet'}</span>
        </div>
        <details class="essay-library-details">
          <summary>Required points</summary>
          <div class="essay-library-points">
            ${essay.facts.map(fact => {
              const status = essayFactMasteryLabel(fact.id);
              const resources = pairingResourceActionsHtml(essay, fact, { context:'library' });
              return `<div class="essay-library-point" data-essay-library-fact="${escapeHtml(fact.id)}"><span class="essay-library-point-status ${status.toLowerCase()}">${status}</span><span class="essay-library-point-copy"></span><span class="essay-library-point-actions">${resources}<button class="content-report-btn essay-library-point-report" type="button" data-report-essay-pairing="${escapeHtml(fact.id)}" data-report-essay-id="${escapeHtml(essay.id)}" aria-label="Report an issue with this pairing" title="Report an issue">⚑</button></span></div>`;
            }).join('')}
          </div>
        </details>
        <details class="essay-library-details"><summary>Model answer</summary><p class="essay-library-model"></p></details>
      `;
      setGlossaryText(card.querySelector('.essay-library-prompt'), essay.prompt);
      renderCourseNoteLinks(card.querySelector('[data-essay-note-links]'), 'essay', essay.id);
      setGlossaryText(card.querySelector('.essay-library-model'), essay.modelAnswer);
      essay.facts.forEach(fact => {
        const point = card.querySelector(`[data-essay-library-fact="${CSS.escape(fact.id)}"] .essay-library-point-copy`);
        if (point) setGlossaryText(point, `${essayNameText(fact)} → ${essayPositionText(fact)}`);
      });
      dom.essayLibraryList.append(card);
    });

    if (dom.essayLibrarySummary) {
      const summary = essayMasterySummary();
      dom.essayLibrarySummary.textContent = `${rows.length} of ${ESSAY_BANK.length} essays · ${summary.mastered}/${summary.total} facts mastered`;
    }
    dom.essayLibraryEmpty?.classList.toggle('hidden', rows.length > 0);
    dom.essayLibrarySearchClear?.classList.toggle('hidden', !term);
  }

  function loadEssayCategoryFilter() {
    try {
      const parsed = readScopedJson(ESSAY_CATEGORY_FILTER_KEY, null);
      const valid = Array.isArray(parsed) ? parsed.filter(tag => ESSAY_CATEGORY_LIST.includes(tag)) : [];
      return valid.length ? valid : [...ESSAY_CATEGORY_LIST];
    } catch (_) {
      return [...ESSAY_CATEGORY_LIST];
    }
  }

  function saveEssayCategoryFilter(values) {
    const valid = [...new Set((values || []).filter(tag => ESSAY_CATEGORY_LIST.includes(tag)))];
    writeScopedJson(ESSAY_CATEGORY_FILTER_KEY, valid.length ? valid : ESSAY_CATEGORY_LIST);
  }

  function essayMatchesCategoryFilter(essay, selected = loadEssayCategoryFilter()) {
    const tags = ESSAY_CATEGORY_TAGS[essay?.id] || [];
    return !selected.length || tags.some(tag => selected.includes(tag));
  }

  function eligibleEssayBank() {
    const selected = loadEssayCategoryFilter();
    const filtered = ESSAY_BANK.filter(essay => essayMatchesCategoryFilter(essay, selected));
    return filtered.length ? filtered : ESSAY_BANK;
  }

  function populateEssayQuickNav(currentEssay = essayRun?.essay || null) {
    if (!dom.essayQuickNav) return;
    const essays = eligibleEssayBank();
    const choices = currentEssay && !essays.some(essay => essay.id === currentEssay.id)
      ? [currentEssay, ...essays]
      : essays;
    dom.essayQuickNav.textContent = '';
    choices.forEach(essay => {
      const index = ESSAY_BANK.findIndex(item => item.id === essay.id);
      const option = document.createElement('option');
      option.value = essay.id;
      option.textContent = `Essay ${index + 1} · ${essay.title}`;
      dom.essayQuickNav.append(option);
    });
    if (currentEssay) dom.essayQuickNav.value = currentEssay.id;
  }

  function renderEssayModeControls(essay) {
    populateEssayQuickNav(essay);
    if (dom.essayCategoryTags) {
      dom.essayCategoryTags.innerHTML = '';
      (ESSAY_CATEGORY_TAGS[essay?.id] || ['Essay']).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'essay-category-tag';
        chip.textContent = tag;
        dom.essayCategoryTags.append(chip);
      });
    }
  }

  function openEssaySearch() {
    openEssayLibrary();
    window.setTimeout(() => {
      dom.essayLibrarySearch?.focus();
      dom.essayLibrarySearch?.select();
    }, 0);
  }

  function openEssayLibrary() {
    if (mode === 'test' || !ESSAY_BANK.length) return;
    flushQuestionTime();
    if (dom.essayIntroDialog?.open) dom.essayIntroDialog.close();
    if (dom.essayLibrarySearch) dom.essayLibrarySearch.value = '';
    renderEssayLibrary('');
    if (!dom.essayLibraryDialog.open) dom.essayLibraryDialog.showModal();
  }

  function startSpecificEssay(essayId) {
    const essay = ESSAY_BANK.find(item => item.id === essayId);
    if (!essay || mode === 'test') return;
    flushQuestionTime();
    if (dom.essayLibraryDialog?.open) dom.essayLibraryDialog.close();
    if (dom.essayIntroDialog?.open) dom.essayIntroDialog.close();
    essaySessionNumber = 0;
    essayAnalyticsSessionId = analyticsUuid('essay-session');
    essayModeActive = true;
    beginEssayRound(essay, { source: 'library' });
    render();
    scrollToQuestionTop();
  }

  function essayAverageMastery(essay) {
    if (!essay?.facts?.length) return 3;
    return essay.facts.reduce((sum, fact) => sum + essayFactStat(fact.id).mastery, 0) / essay.facts.length;
  }

  function chooseEssayPractice() {
    const eligible = eligibleEssayBank();
    if (!eligible.length) return null;
    const ranked = eligible.map(essay => ({
      essay,
      mastery: essayAverageMastery(essay),
      unseen: essay.facts.filter(fact => essayFactStat(fact.id).seen === 0).length
    })).sort((a, b) => {
      if (b.unseen !== a.unseen) return b.unseen - a.unseen;
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      return Math.random() - .5;
    });
    const pool = ranked.filter(item => item.essay.id !== essayProgressState.lastEssayId).slice(0, Math.min(3, ranked.length));
    return (pool.length ? pool[Math.floor(Math.random() * pool.length)] : ranked[0]).essay;
  }

  function essayPositionText(fact) {
    return fact?.tokens?.[1]?.[1] || '';
  }

  function essayNameText(fact) {
    return fact?.tokens?.[0]?.[1] || fact?.label || '';
  }

  function buildEssayStepChoices(essay, index) {
    const current = essay.facts[index];
    if (!current) return [];
    const currentName = essayNameText(current);
    const differentNames = essay.facts.filter((fact, i) => i !== index && essayNameText(fact) !== currentName);
    const fallback = essay.facts.filter((fact, i) => i !== index && !differentNames.includes(fact));
    const others = [...shuffle(differentNames), ...shuffle(fallback)].slice(0, 2);
    return shuffle([current, ...others].map(fact => fact.id));
  }

  function currentEssayFact() {
    if (!essayRun || essayRun.finished) return null;
    return essayRun.essay.facts[essayRun.currentIndex] || null;
  }

  function recordEssayFactResult(fact, firstTry) {
    const prior = essayFactStat(fact.id);
    essayProgressState.facts[fact.id] = {
      seen: prior.seen + 1,
      correct: prior.correct + 1,
      mastery: firstTry ? Math.min(3, prior.mastery + 1) : Math.max(0, prior.mastery - .5),
      lastSeen: Date.now()
    };
    saveEssayProgress();
  }

  function finishEssayRound() {
    if (!essayRun || essayRun.finished) return;
    essayRun.finished = true;
    const essay = essayRun.essay;
    const priorEssay = essayProgressState.essays[essay.id] || { attempts: 0, perfect: 0 };
    const perfect = essayRun.totalWrong === 0;
    essayProgressState.essays[essay.id] = {
      attempts: (Number(priorEssay.attempts) || 0) + 1,
      perfect: (Number(priorEssay.perfect) || 0) + (perfect ? 1 : 0),
      lastScore: essayRun.firstTryCorrect,
      lastTotal: essay.facts.length,
      lastAttempt: Date.now()
    };
    essayProgressState.lastEssayId = essay.id;
    saveEssayProgress();
    queueEssayAnalytics('essay_round_complete', {
      roundId: essayRun.roundId,
      sessionId: essayRun.sessionId,
      essayId: essay.id,
      source: essayRun.source,
      attemptInRound: essayRun.attemptInRound + 1,
      totalFacts: essay.facts.length,
      firstTryCorrect: essayRun.firstTryCorrect,
      totalWrong: essayRun.totalWrong,
      perfect,
      durationBucket: responseTimeBucket(Date.now() - essayRun.roundStartedAt),
      essayContentHash: essayContentHash(essay)
    });
  }

  function renderEssayBuiltAnswer() {
    if (!essayRun || !dom.essayAnswerZone) return;
    const essay = essayRun.essay;
    dom.essayAnswerZone.innerHTML = '';
    if (!essayRun.completedFactIds.length) {
      const empty = document.createElement('span');
      empty.className = 'essay-answer-placeholder';
      empty.textContent = 'Correct pairings will build the essay here.';
      dom.essayAnswerZone.append(empty);
      return;
    }
    essayRun.completedFactIds.forEach(id => {
      const fact = essay.facts.find(item => item.id === id);
      if (!fact) return;
      const row = document.createElement('div');
      row.className = 'essay-built-row';
      row.innerHTML = `<span class="essay-built-check" aria-hidden="true">✓</span><div class="essay-built-copy"><strong></strong><span></span></div><button class="content-report-btn essay-built-report" type="button" data-report-essay-pairing="${escapeHtml(fact.id)}" aria-label="Report an issue with this pairing" title="Report an issue">⚑</button>`;
      setGlossaryText(row.querySelector('strong'), essayNameText(fact));
      setGlossaryText(row.querySelector('.essay-built-copy span'), essayPositionText(fact));
      dom.essayAnswerZone.append(row);
    });
  }

  function renderEssayStep() {
    if (!essayRun || !dom.essayMatchSection) return;
    const essay = essayRun.essay;
    const fact = currentEssayFact();
    const complete = essayRun.finished;
    dom.essayMatchSection.classList.toggle('complete', complete);
    if (dom.essayBuildProgress) dom.essayBuildProgress.textContent = `${essayRun.completedFactIds.length} of ${essay.facts.length} complete`;
    if (complete) {
      if (dom.essayPracticeCounter) dom.essayPracticeCounter.textContent = `Complete · ${essay.facts.length} pairings`;
      if (dom.essayMatchCount) dom.essayMatchCount.textContent = 'Complete';
      if (dom.essayMatchContext) dom.essayMatchContext.textContent = 'Essay complete';
      if (dom.essayMatchName) dom.essayMatchName.textContent = 'All pairings matched';
      if (dom.essayPairingReportBtn) dom.essayPairingReportBtn.disabled = true;
      if (dom.essayPairingResources) { dom.essayPairingResources.innerHTML = ''; dom.essayPairingResources.classList.add('hidden'); }
      if (dom.essayChoiceList) dom.essayChoiceList.innerHTML = '';
      if (dom.essayFeedback) {
        dom.essayFeedback.className = 'essay-choice-feedback correct';
        dom.essayFeedback.innerHTML = `<strong>Essay complete.</strong><span>${essayRun.firstTryCorrect}/${essay.facts.length} pairings were correct on the first try.</span>`;
      }
      return;
    }
    const step = essayRun.currentIndex + 1;
    if (dom.essayPracticeCounter) dom.essayPracticeCounter.textContent = `Pairing ${step} of ${essay.facts.length}`;
    if (dom.essayMatchCount) dom.essayMatchCount.textContent = `${step} of ${essay.facts.length}`;
    setGlossaryText(dom.essayMatchContext, fact.label || 'Match the position');
    setGlossaryText(dom.essayMatchName, essayNameText(fact));
    if (dom.essayPairingReportBtn) dom.essayPairingReportBtn.disabled = false;
    if (dom.essayPairingResources) {
      dom.essayPairingResources.innerHTML = pairingResourceActionsHtml(essay, fact, { context:'practice' });
      dom.essayPairingResources.classList.toggle('hidden', !dom.essayPairingResources.children.length);
    }
    if (dom.essayChoiceList) {
      dom.essayChoiceList.innerHTML = '';
      essayRun.stepChoices.forEach(id => {
        const optionFact = essay.facts.find(item => item.id === id);
        if (!optionFact) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'essay-choice';
        button.dataset.essayChoice = id;
        setGlossaryText(button, essayPositionText(optionFact));
        if (essayRun.wrongChoiceIds.includes(id)) { button.classList.add('incorrect'); button.disabled = true; }
        if (essayRun.transitioning) { button.disabled = true; if (id === fact.id) button.classList.add('correct'); }
        dom.essayChoiceList.append(button);
      });
    }
    if (dom.essayFeedback) {
      if (!essayRun.feedbackType) { dom.essayFeedback.className = 'essay-choice-feedback hidden'; dom.essayFeedback.textContent = ''; }
      else {
        dom.essayFeedback.className = `essay-choice-feedback ${essayRun.feedbackType}`;
        dom.essayFeedback.innerHTML = essayRun.feedbackType === 'correct'
          ? '<strong>Correct.</strong><span>That pairing was added to the essay.</span>'
          : '<strong>Not that pairing.</strong><span>That position belongs elsewhere in this essay. Try another choice.</span>';
      }
    }
  }

  function renderEssayPractice() {
    if (!essayRun) return;
    const essay = essayRun.essay;
    renderEssayModeControls(essay);
    if (dom.essayPracticeTitle) dom.essayPracticeTitle.textContent = essay.title;
    setGlossaryText(dom.essayPracticePrompt, essay.prompt);
    renderCourseNoteLinks(dom.essayNoteLinks, 'essay', essay.id);
    setGlossaryText(dom.essayModelAnswer, essay.modelAnswer);
    if (dom.essayModelAnswerWrap) {
      dom.essayModelAnswerWrap.classList.toggle('hidden', !essayRun.finished);
      if (!essayRun.finished) dom.essayModelAnswerWrap.open = false;
    }
    if (dom.essayTryAgainBtn) dom.essayTryAgainBtn.hidden = !essayRun.finished;
    if (dom.essayNextBtn) dom.essayNextBtn.hidden = !essayRun.finished;
    renderEssayBuiltAnswer();
    renderEssayStep();
    updateEssayProgressUi();
  }

  function handleEssayChoice(choiceId) {
    if (!essayRun || essayRun.finished || essayRun.transitioning) return;
    const fact = currentEssayFact();
    if (!fact) return;
    if (choiceId !== fact.id) {
      if (!essayRun.wrongChoiceIds.includes(choiceId)) { essayRun.wrongChoiceIds.push(choiceId); essayRun.totalWrong += 1; }
      essayRun.stepHadError = true;
      essayRun.feedbackType = 'incorrect';
      renderEssayStep();
      return;
    }
    const firstTry = !essayRun.stepHadError;
    queueEssayAnalytics('essay_pairing', {
      roundId: essayRun.roundId, sessionId: essayRun.sessionId, essayId: essayRun.essay.id, factId: fact.id,
      stepIndex: essayRun.currentIndex + 1, firstTry, presentedChoiceIds: [...essayRun.stepChoices],
      wrongChoiceIds: [...essayRun.wrongChoiceIds], responseTimeBucket: responseTimeBucket(Date.now() - essayRun.stepStartedAt),
      factContentHash: essayFactContentHash(fact), audioUsed: !!essayRun.stepAudioUsed
    });
    essayRun.transitioning = true;
    essayRun.feedbackType = 'correct';
    essayRun.completedFactIds.push(fact.id);
    if (firstTry) essayRun.firstTryCorrect += 1;
    recordEssayFactResult(fact, firstTry);
    renderEssayPractice();
    const essayId = essayRun.essay.id;
    window.setTimeout(() => {
      if (!essayRun || essayRun.essay.id !== essayId) return;
      essayRun.currentIndex += 1;
      essayRun.transitioning = false;
      essayRun.stepHadError = false;
      essayRun.wrongChoiceIds = [];
      essayRun.feedbackType = null;
      essayRun.stepAudioUsed = false;
      essayRun.stepStartedAt = Date.now();
      if (essayRun.currentIndex >= essayRun.essay.facts.length) finishEssayRound();
      else essayRun.stepChoices = buildEssayStepChoices(essayRun.essay, essayRun.currentIndex);
      renderEssayPractice();
    }, 520);
  }

  function beginEssayRound(essay, { retry = false, source = 'adaptive' } = {}) {
    if (!essay) return;
    if (!retry) essaySessionNumber += 1;
    if (!essayAnalyticsSessionId) essayAnalyticsSessionId = analyticsUuid('essay-session');
    const attemptInRound = retry && essayRun ? essayRun.attemptInRound + 1 : 0;
    const now = Date.now();
    essayRun = {
      essay, currentIndex: 0, completedFactIds: [], stepChoices: buildEssayStepChoices(essay, 0), wrongChoiceIds: [],
      stepHadError: false, feedbackType: null, transitioning: false, firstTryCorrect: 0, totalWrong: 0, finished: false,
      attemptInRound, source, sessionId: essayAnalyticsSessionId, roundId: analyticsUuid('essay-round'),
      roundStartedAt: now, stepStartedAt: now, stepAudioUsed: false
    };
    queueEssayAnalytics('essay_round_start', {
      roundId: essayRun.roundId, sessionId: essayRun.sessionId, essayId: essay.id, source,
      attemptInRound: attemptInRound + 1, totalFacts: essay.facts.length, essayContentHash: essayContentHash(essay)
    });
    renderEssayPractice();
  }

  function startEssayPractice() {
    if (!ESSAY_BANK.length || mode === 'test') return;
    flushQuestionTime();
    if (dom.materialsDialog?.open) dom.materialsDialog.close();
    if (dom.essayIntroDialog?.open) dom.essayIntroDialog.close();
    essaySessionNumber = 0;
    essayAnalyticsSessionId = analyticsUuid('essay-session');
    essayModeActive = true;
    beginEssayRound(chooseEssayPractice(), { source: 'adaptive' });
    render();
    scrollToQuestionTop();
  }

  function retryEssayPractice() {
    if (!essayRun) return;
    beginEssayRound(essayRun.essay, { retry: true, source: 'retry' });
  }

  function nextEssayPractice() {
    beginEssayRound(chooseEssayPractice(), { source: 'next' });
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
    if (essayModeActive) return;
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

    const inEssayMode = essayModeActive && mode === 'study';
    document.body.classList.toggle('essay-mode-active', inEssayMode);
    dom.modeLabel.textContent = mode === 'test' ? 'Practice test' : inEssayMode ? 'Essay mode' : 'Study mode';
    dom.timerLabel.textContent = mode === 'test' ? 'Time left' : 'Session';
    dom.timerCard.classList.toggle('is-clickable', mode === 'study' && !inEssayMode);
    dom.timerCard.setAttribute('title', mode === 'test' ? 'Practice test countdown' : inEssayMode ? 'Essay study session' : 'Click to reset the study session timer');
    dom.timerCard.setAttribute('aria-label', mode === 'test' ? 'Practice test countdown timer' : inEssayMode ? 'Essay study session timer.' : 'Study session timer. Click to reset.');
    dom.testBtn.textContent = mode === 'test' ? 'Exit test' : 'Test';
    dom.categoriesBtn.disabled = mode === 'test';
    dom.statsBtn.disabled = mode === 'test';
    if (dom.essayBtn) {
      dom.essayBtn.disabled = mode === 'test';
      dom.essayBtn.textContent = inEssayMode ? 'M/C' : 'Essay';
      dom.essayBtn.setAttribute('aria-label', inEssayMode ? 'Switch to multiple choice mode' : 'Open essay practice');
    }
    dom.testProgressWrap.classList.toggle('hidden', mode !== 'test');
    dom.questionCard?.classList.toggle('hidden', inEssayMode);
    dom.saveNote?.classList.toggle('hidden', inEssayMode);
    dom.essayPracticeMain?.classList.toggle('hidden', !inEssayMode);
    if (dom.questionSearchFab) {
      dom.questionSearchFab.classList.toggle('hidden', mode === 'test');
      dom.questionSearchFab.setAttribute('aria-label', inEssayMode ? 'Search essays' : 'Search course questions');
      dom.questionSearchFab.setAttribute('title', inEssayMode ? 'Search essays' : 'Search course questions (/)');
    }

    if (inEssayMode) {
      renderEssayPractice();
      saveState();
      beginStudyTimeIfNeeded();
      return;
    }

    if (mode === 'test') {
      const t = state.activeTest;
      const answered = t.order.filter(id => t.items[id].answered).length;
      dom.testQuestionCount.textContent = `${t.index + 1}/${QUESTIONS.length}`;
      dom.testAnsweredCount.textContent = `${answered} answered`;
      dom.testProgressFill.style.width = `${((t.index + 1) / QUESTIONS.length) * 100}%`;
      dom.questionNumber.value = String(q.id);
      dom.questionNumber.setAttribute('aria-label', `Question ${q.id}. Choose another question.`);
    } else {
      dom.questionNumber.value = String(q.id);
      dom.questionNumber.setAttribute('aria-label', `Question ${q.id}. Choose another question.`);
    }
    dom.questionCategory.textContent = q.category;
    setGlossaryText(dom.questionPrompt, q.prompt);
    dom.multiNote.classList.toggle('hidden', q.type !== 'multi');
    renderRelevantAudio(q.id, dom.questionAudio, mode !== 'test' || !!entry.answered);
    renderCourseNoteLinks(dom.questionNoteLinks, 'question', q.id);

    const status = entry.answered ? entry.result : 'unanswered';
    dom.questionStatus.textContent = status === 'unanswered' ? 'Unanswered' : status[0].toUpperCase() + status.slice(1);
    dom.questionStatus.className = `status-chip ${status === 'unanswered' ? '' : status}`.trim();
    dom.questionNumber.classList.remove('explorer-link');
    dom.questionNumber.tabIndex = 0;
    dom.questionNumber.setAttribute('aria-disabled', 'false');
    dom.questionPrompt.classList.remove('explorer-link');
    dom.questionPrompt.tabIndex = -1;
    dom.questionPrompt.removeAttribute('aria-disabled');
    dom.questionCategory.classList.toggle('explorer-link', !!entry.answered);
    dom.questionCategory.tabIndex = entry.answered ? 0 : -1;
    dom.questionCategory.setAttribute('aria-disabled', entry.answered ? 'false' : 'true');

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



  function populateQuestionNumberDropdown() {
    if (!dom.questionNumber || dom.questionNumber.options.length === QUESTIONS.length) return;
    dom.questionNumber.textContent = '';
    QUESTIONS
      .slice()
      .sort((left, right) => Number(left.id) - Number(right.id))
      .forEach(question => {
        const option = document.createElement('option');
        option.value = String(question.id);
        option.textContent = `Question ${question.id}`;
        dom.questionNumber.append(option);
      });
  }

  function goToQuestionNumber(rawValue) {
    const qid = Math.trunc(Number(rawValue));
    const question = questionById.get(qid);
    if (!question) return false;
    flushQuestionTime();

    if (mode === 'test' && state.activeTest) {
      const index = state.activeTest.order.indexOf(qid);
      if (index < 0) return false;
      state.activeTest.index = index;
    } else {
      let existingIndex = -1;
      for (let i = state.study.history.length - 1; i >= 0; i--) {
        if (Number(state.study.history[i]?.qid) === qid) { existingIndex = i; break; }
      }
      if (existingIndex >= 0) {
        state.study.index = existingIndex;
      } else {
        const entry = { qid, selected: [], answered: false, result: null, credit: 0, elapsedMs: 0 };
        const insertAt = Math.min(state.study.history.length, Math.max(0, state.study.index + 1));
        state.study.history.splice(insertAt, 0, entry);
        state.study.index = insertAt;
        markQuestionShown(qid);
      }
    }

    saveState();
    render();
    scrollToQuestionTop();
    return true;
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
    const essayCategories = essayModeActive && mode === 'study';
    const choices = essayCategories ? ESSAY_CATEGORY_LIST : categories;
    const selected = essayCategories ? loadEssayCategoryFilter() : state.filters;
    if (dom.categoriesDialogTitle) dom.categoriesDialogTitle.textContent = essayCategories ? 'Essay categories' : 'Study categories';
    if (dom.categoriesDialogDescription) dom.categoriesDialogDescription.textContent = essayCategories
      ? 'Choose which topics appear in Essay quick navigation and adaptive Essay practice.'
      : 'Choose which categories may be selected in study mode. Test mode always uses all 58 questions.';
    choices.forEach((cat, idx) => {
      const label = document.createElement('label');
      label.className = 'category-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = cat;
      input.checked = selected.includes(cat);
      input.id = `${essayCategories ? 'essay-cat' : 'cat'}-${idx}`;
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
    if (essayModeActive && mode === 'study') {
      saveEssayCategoryFilter(selected);
      dom.categoriesDialog.close();
      const current = essayRun?.essay;
      if (current && !essayMatchesCategoryFilter(current, selected)) {
        const next = eligibleEssayBank()[0];
        if (next) startSpecificEssay(next.id);
      } else {
        renderEssayModeControls(current);
      }
      return;
    }
    state.filters = selected;
    saveState();
    dom.categoriesDialog.close();
  }

  function startTest() {
    flushQuestionTime();
    flushStudyTime();
    essayModeActive = false;
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

    if (otherOpen || essayModeActive) return;

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
    if (mode !== 'study' || essayModeActive) return;
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
      const value = readScopedJson(AUDIO_PLAYBACK_KEY, {}) || {};
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
    writeScopedJson(AUDIO_PLAYBACK_KEY, data);
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

  function courseNoteRef(kind, id) {
    const group = kind === 'essay' ? COURSE_NOTE_REFS.essays : COURSE_NOTE_REFS.questions;
    return group?.[String(id)] || group?.[id] || null;
  }

  function courseNoteDoc(key) {
    return COURSE_NOTE_REFS.docs?.[key] || null;
  }

  function courseNotePage(ref, docKey) {
    const value = ref?.[docKey];
    const rawPage = value && typeof value === 'object' ? value.page : value;
    const page = Number(rawPage);
    return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 0;
  }

  function renderCourseNoteLinks(container, kind, id) {
    if (!container) return;
    const ref = courseNoteRef(kind, id);
    container.innerHTML = '';
    if (!ref) { container.classList.add('hidden'); return; }
    [['compact', 'Concise notes'], ['full', 'Full notes']].forEach(([key, label]) => {
      const doc = courseNoteDoc(key);
      const page = courseNotePage(ref, key);
      if (!doc || !Number.isFinite(page) || page < 1) return;
      const button = document.createElement('button');
      button.className = 'course-note-link';
      button.type = 'button';
      button.dataset.courseNoteDoc = key;
      button.dataset.courseNoteKind = kind;
      button.dataset.courseNoteId = String(id);
      button.innerHTML = `${escapeHtml(label)} <small>p. ${page}</small>`;
      container.append(button);
    });
    container.classList.toggle('hidden', !container.children.length);
  }

  function pairingResourceActionsHtml(essay, fact, { context = 'library' } = {}) {
    if (!essay || !fact) return '';
    const items = [];
    const audioRef = ESSAY_AUDIO_MAP?.[String(fact.id)]?.[0] || null;
    if (audioRef) {
      items.push(`<button class="pairing-resource-btn pairing-audio-btn" type="button" data-pairing-audio-fact="${escapeHtml(fact.id)}" data-pairing-audio-essay="${escapeHtml(essay.id)}" data-pairing-audio-context="${escapeHtml(context)}" aria-label="Play relevant audio for this pairing" title="Relevant audio"><span class="pairing-play-glyph" aria-hidden="true">▶</span></button>`);
    }

    const noteRef = courseNoteRef('essay', essay.id);
    [['compact','Concise notes','compact'],['full','Full notes','full']].forEach(([docKey,label,variant]) => {
      const doc = courseNoteDoc(docKey);
      const page = courseNotePage(noteRef, docKey);
      if (!doc || !page) return;
      const bookSvg = variant === 'compact'
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5c3-1 5.1-.5 7.5 1v11c-2.4-1.5-4.5-2-7.5-1v-11Zm15 0c-3-1-5.1-.5-7.5 1v11c2.4-1.5 4.5-2 7.5-1v-11Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5c3.4-1.2 6-.7 8.5 1.2v12.1c-2.5-1.9-5.1-2.4-8.5-1.2V5.5Zm17 0c-3.4-1.2-6-.7-8.5 1.2v12.1c2.5-1.9 5.1-2.4 8.5-1.2V5.5Z"/><path d="M12 6.7v12.1"/></svg>';
      items.push(`<button class="pairing-resource-btn pairing-notes-btn pairing-notes-${variant}" type="button" data-course-note-doc="${docKey}" data-course-note-kind="essay" data-course-note-id="${escapeHtml(essay.id)}" aria-label="${escapeHtml(label)} page ${page}" title="${escapeHtml(label)} · p. ${page}"><span class="pairing-book-glyph" aria-hidden="true">${bookSvg}<span class="pairing-page-badge">${page}</span></span></button>`);
    });
    return items.join('');
  }

  async function getPdfJs() {
    if (!pdfJsPromise) {
      pdfJsPromise = import('./pdfjs/pdf.mjs').then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.mjs';
        return pdfjs;
      });
    }
    return pdfJsPromise;
  }

  function buildCourseNoteJump(docKey, selectedValue = '') {
    if (!dom.pdfViewerJump) return;
    const isNotes = docKey === 'compact' || docKey === 'full';
    dom.pdfViewerJump.classList.toggle('hidden', !isNotes);
    if (!isNotes) {
      dom.pdfViewerJump.innerHTML = '';
      return;
    }
    const options = ['<option value="">Jump to question or essay…</option>'];
    options.push('<optgroup label="Questions">');
    QUESTIONS.forEach(q => {
      const page = courseNotePage(courseNoteRef('question', q.id), docKey);
      if (!page) return;
      const prompt = String(q.prompt || '').replace(/\s+/g, ' ').trim();
      const short = prompt.length > 58 ? `${prompt.slice(0, 57)}…` : prompt;
      options.push(`<option value="question:${q.id}" data-page="${page}">Q${q.id} · ${escapeHtml(short)} · p. ${page}</option>`);
    });
    options.push('</optgroup><optgroup label="Essays">');
    ESSAY_BANK.forEach((essay, index) => {
      const page = courseNotePage(courseNoteRef('essay', essay.id), docKey);
      if (!page) return;
      options.push(`<option value="essay:${escapeHtml(essay.id)}" data-page="${page}">Essay ${index + 1} · ${escapeHtml(essay.title)} · p. ${page}</option>`);
    });
    options.push('</optgroup>');
    dom.pdfViewerJump.innerHTML = options.join('');
    if (selectedValue) dom.pdfViewerJump.value = selectedValue;
  }

  function pdfTargetText(selection) {
    const [kind, rawId] = String(selection || '').split(':');
    if (kind === 'question') {
      const q = questionById.get(Number(rawId));
      return q ? [q.category, q.prompt, q.explanation].filter(Boolean).join(' ') : '';
    }
    if (kind === 'essay') {
      const essay = ESSAY_BANK.find(item => item.id === rawId);
      if (!essay) return '';
      const facts = essay.facts?.flatMap(fact => [essayNameText(fact), essayPositionText(fact)]) || [];
      return [essay.title, essay.prompt, essay.modelAnswer, ...facts].filter(Boolean).join(' ');
    }
    return '';
  }

  const PDF_SEARCH_STOPWORDS = new Set([
    'the','and','that','this','with','from','into','what','which','when','where','while','there','their','then','than','they','them','will','would','should','could',
    'course','statement','correct','matches','best','case','cases','rule','rules','according','discuss','include','including','about','after','before','later','still',
    'first','second','same','one','two','may','can','does','not','for','are','was','were','has','have','had','but','its','his','her','your','you','how','why','who',
    'all','each','both','true','false','select','apply','practical','position','positions','opinion','opinions','major','relevant','framework'
  ]);

  function pdfSearchTokens(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0591-\u05c7]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(token => token && !PDF_SEARCH_STOPWORDS.has(token) && (/^[\u0590-\u05ff]+$/.test(token) ? token.length >= 2 : token.length >= 3));
  }

  function pdfTargetLabel(selection) {
    const [kind, rawId] = String(selection || '').split(':');
    if (kind === 'question') return `Q${rawId}`;
    if (kind === 'essay') {
      const index = ESSAY_BANK.findIndex(item => item.id === rawId);
      return index >= 0 ? `Essay ${index + 1}` : 'Essay';
    }
    return '';
  }

  function setPdfViewerStatus(message = '') {
    if (!dom.pdfViewerStatus) return;
    dom.pdfViewerStatus.textContent = message;
    dom.pdfViewerStatus.classList.toggle('hidden', !message);
  }

  function pdfPageElement(pageNumber) {
    return dom.pdfViewerPages?.querySelector(`[data-pdf-page="${pageNumber}"]`) || null;
  }

  async function renderPdfPage(pageNumber) {
    const viewer = activePdfViewer;
    if (!viewer?.pdf || !dom.pdfViewerPages) return null;
    const number = Math.max(1, Math.min(viewer.pdf.numPages, Number(pageNumber) || 1));
    if (viewer.renderedPages.has(number)) return viewer.pageCache.get(number) || null;
    if (viewer.renderPromises.has(number)) return viewer.renderPromises.get(number);

    const promise = (async () => {
      const page = await viewer.pdf.getPage(number);
      if (activePdfViewer !== viewer) return null;
      viewer.pageCache.set(number, page);
      const holder = pdfPageElement(number);
      if (!holder) return page;

      const baseViewport = page.getViewport({ scale: 1 });
      const available = Math.max(280, Math.min(980, (dom.pdfViewerBody?.clientWidth || window.innerWidth) - (window.innerWidth <= 780 ? 12 : 28)));
      const cssScale = available / baseViewport.width;
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const renderViewport = page.getViewport({ scale: cssScale * dpr });
      const canvas = holder.querySelector('canvas');
      if (!canvas) return page;
      canvas.width = Math.ceil(renderViewport.width);
      canvas.height = Math.ceil(renderViewport.height);
      canvas.style.width = `${Math.round(baseViewport.width * cssScale)}px`;
      canvas.style.height = `${Math.round(baseViewport.height * cssScale)}px`;
      holder.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;

      const context = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      if (activePdfViewer !== viewer) return page;
      holder.classList.add('rendered');
      viewer.renderedPages.add(number);
      return page;
    })().finally(() => viewer.renderPromises.delete(number));

    viewer.renderPromises.set(number, promise);
    return promise;
  }

  function setupPdfPageObserver(viewer) {
    viewer.observer?.disconnect();
    viewer.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const pageNumber = Number(entry.target.dataset.pdfPage);
        if (pageNumber) void renderPdfPage(pageNumber);
      });
    }, { root: dom.pdfViewerBody, rootMargin: '900px 0px', threshold: 0.01 });

    dom.pdfViewerPages?.querySelectorAll('[data-pdf-page]').forEach(node => viewer.observer.observe(node));
  }

  async function bestPdfTargetFraction(page, selection) {
    const query = pdfTargetText(selection);
    const queryTokens = [...new Set(pdfSearchTokens(query))];
    if (!queryTokens.length || !page) return 0.05;
    const querySet = new Set(queryTokens);
    const content = await page.getTextContent();
    const height = Math.max(1, Number(page.view?.[3]) - Number(page.view?.[1]));
    const lines = new Map();

    (content.items || []).forEach(item => {
      const text = String(item?.str || '').trim();
      const y = Number(item?.transform?.[5]);
      if (!text || !Number.isFinite(y)) return;
      const bucket = Math.round(y / 6) * 6;
      const row = lines.get(bucket) || [];
      row.push(text);
      lines.set(bucket, row);
    });

    const ordered = [...lines.entries()]
      .map(([y, parts]) => ({ y, text: parts.join(' ') }))
      .sort((left, right) => right.y - left.y);
    if (!ordered.length) return 0.05;

    let best = { score: -1, y: ordered[0].y };
    for (let i = 0; i < ordered.length; i++) {
      const windowRows = ordered.slice(i, i + 4);
      const text = windowRows.map(row => row.text).join(' ');
      const tokens = new Set(pdfSearchTokens(text));
      let score = 0;
      querySet.forEach(token => {
        if (!tokens.has(token)) return;
        const hebrew = /^[\u0590-\u05ff]+$/.test(token);
        score += (hebrew ? 3.2 : 1.5) + Math.min(2.5, token.length / 6);
      });
      if (score > best.score) best = { score, y: windowRows[0].y };
    }

    if (best.score < 2) return 0.05;
    const fraction = 1 - ((best.y - Number(page.view?.[1] || 0)) / height);
    return Math.max(0.02, Math.min(0.94, fraction - 0.025));
  }

  function showPdfTargetMarker(pageNumber, fraction, selection) {
    dom.pdfViewerPages?.querySelectorAll('.pdf-target-marker').forEach(node => node.remove());
    const holder = pdfPageElement(pageNumber);
    if (!holder || !selection) return;
    const marker = document.createElement('div');
    marker.className = 'pdf-target-marker';
    marker.style.top = `${Math.max(1, Math.min(96, fraction * 100))}%`;
    marker.innerHTML = `<span>${escapeHtml(pdfTargetLabel(selection))}</span>`;
    holder.append(marker);
    window.setTimeout(() => marker.classList.add('settled'), 1700);
  }

  async function scrollPdfViewerTo(pageNumber, selection = '') {
    const viewer = activePdfViewer;
    if (!viewer?.pdf || !dom.pdfViewerBody) return;
    const page = Math.max(1, Math.min(viewer.pdf.numPages, Number(pageNumber) || 1));
    viewer.page = page;
    viewer.selection = selection || '';

    const holder = pdfPageElement(page);
    if (!holder) return;
    dom.pdfViewerBody.scrollTo({ top: Math.max(0, holder.offsetTop - 8), behavior: 'auto' });
    const pdfPage = await renderPdfPage(page);
    if (activePdfViewer !== viewer || !pdfPage) return;

    let fraction = 0.03;
    if (selection && (viewer.docKey === 'compact' || viewer.docKey === 'full')) {
      const cacheKey = `${page}:${selection}`;
      if (viewer.anchorCache.has(cacheKey)) fraction = viewer.anchorCache.get(cacheKey);
      else {
        fraction = await bestPdfTargetFraction(pdfPage, selection);
        viewer.anchorCache.set(cacheKey, fraction);
      }
    }

    requestAnimationFrame(() => {
      if (activePdfViewer !== viewer) return;
      const currentHolder = pdfPageElement(page);
      if (!currentHolder) return;
      const top = currentHolder.offsetTop + (currentHolder.clientHeight * fraction) - 14;
      dom.pdfViewerBody.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      showPdfTargetMarker(page, fraction, selection);
    });
  }

  async function loadPdfViewerDocument(viewer) {
    try {
      setPdfViewerStatus('Loading PDF…');
      const pdfjs = await getPdfJs();
      if (activePdfViewer !== viewer) return;
      const loadingTask = pdfjs.getDocument({
        url: absoluteUrl(viewer.url),
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true
      });
      viewer.loadingTask = loadingTask;
      const pdf = await loadingTask.promise;
      if (activePdfViewer !== viewer) { try { await pdf.destroy(); } catch (_) {} return; }
      viewer.pdf = pdf;

      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const ratio = `${firstViewport.width} / ${firstViewport.height}`;
      if (activePdfViewer !== viewer) return;

      const fragment = document.createDocumentFragment();
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const holder = document.createElement('section');
        holder.className = 'pdf-viewer-page';
        holder.dataset.pdfPage = String(pageNumber);
        holder.style.aspectRatio = ratio;
        holder.setAttribute('aria-label', `Page ${pageNumber}`);
        holder.innerHTML = `<canvas aria-hidden="true"></canvas><span class="pdf-page-number">${pageNumber}</span>`;
        fragment.append(holder);
      }
      dom.pdfViewerPages.innerHTML = '';
      dom.pdfViewerPages.append(fragment);
      setPdfViewerStatus('');
      await scrollPdfViewerTo(viewer.page, viewer.selection);
      if (activePdfViewer !== viewer) return;
      setupPdfPageObserver(viewer);
      void renderPdfPage(Math.max(1, viewer.page - 1));
      void renderPdfPage(Math.min(pdf.numPages, viewer.page + 1));
    } catch (error) {
      if (activePdfViewer !== viewer) return;
      console.warn('Could not load PDF viewer:', error);
      setPdfViewerStatus('Could not render this PDF in the app. You can still share, print, or download it.');
    }
  }

  function openPdfViewer({ url, title = 'SCP Study PDF', page = 1, docKey = null, selection = '' } = {}) {
    if (!url || !dom.pdfViewerDialog || !dom.pdfViewerPages) return;
    closePdfViewer({ closeDialog: false });
    const viewer = {
      url,
      title,
      page: Math.max(1, Number(page) || 1),
      docKey,
      selection,
      pdf: null,
      loadingTask: null,
      observer: null,
      renderedPages: new Set(),
      renderPromises: new Map(),
      pageCache: new Map(),
      anchorCache: new Map()
    };
    activePdfViewer = viewer;
    if (dom.pdfViewerTitle) dom.pdfViewerTitle.textContent = title;
    buildCourseNoteJump(docKey, selection);
    if (dom.pdfViewerPages) dom.pdfViewerPages.innerHTML = '';
    setPdfViewerStatus('Loading PDF…');
    if (!dom.pdfViewerDialog.open) dom.pdfViewerDialog.showModal();
    if (dom.pdfViewerBody) dom.pdfViewerBody.scrollTop = 0;
    void loadPdfViewerDocument(viewer);
  }

  function closePdfViewer({ closeDialog = true } = {}) {
    const viewer = activePdfViewer;
    activePdfViewer = null;
    viewer?.observer?.disconnect();
    try { viewer?.loadingTask?.destroy?.(); } catch (_) {}
    try { viewer?.pdf?.destroy?.(); } catch (_) {}
    if (dom.pdfViewerPages) dom.pdfViewerPages.innerHTML = '';
    setPdfViewerStatus('');
    if (closeDialog && dom.pdfViewerDialog?.open) dom.pdfViewerDialog.close();
  }

  function openCourseNote(docKey, kind, id) {
    const doc = courseNoteDoc(docKey);
    const ref = courseNoteRef(kind, id);
    const page = courseNotePage(ref, docKey);
    if (!doc || !page) return;
    const question = kind === 'question' ? questionById.get(Number(id)) : null;
    queueResourceAnalytics({
      resourceType:'notes',
      resourceId:`${docKey}:p${page}`,
      resourceLabel:`${doc.title} · p. ${page}`,
      resourceVariant:docKey,
      page,
      source:kind,
      contextKind:kind,
      contextId:id,
      category:question?.category || null
    });
    openPdfViewer({
      url: doc.url,
      title: doc.title,
      page,
      docKey,
      selection: `${kind}:${id}`
    });
  }

  function printPdf(url) {
    const absolute = absoluteUrl(url);
    const win = window.open(absolute, '_blank');
    if (!win) return;
    const trigger = () => { try { win.focus(); win.print(); } catch (_) {} };
    try { win.addEventListener('load', () => setTimeout(trigger, 350), { once: true }); }
    catch (_) { setTimeout(trigger, 900); }
  }

  function pdfFilename(url) {
    try { return decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || 'SCP-Study.pdf'); }
    catch (_) { return 'SCP-Study.pdf'; }
  }

  async function fetchPdfFile(url) {
    const response = await fetch(absoluteUrl(url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load PDF (${response.status})`);
    return new File([await response.blob()], pdfFilename(url), { type: 'application/pdf' });
  }

  async function sharePdf(url, title = 'SCP Study PDF') {
    try {
      const file = await fetchPdfFile(url);
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, files: [file] });
        return;
      }
      if (navigator.share) { await navigator.share({ title, url: absoluteUrl(url) }); return; }
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(absoluteUrl(url)); alert('PDF link copied to the clipboard.'); return; }
      window.open(absoluteUrl(url), '_blank', 'noopener');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Could not share PDF:', error);
      alert('Could not share this PDF. Please try again.');
    }
  }

  async function savePdf(url, title = 'SCP Study PDF') {
    try {
      // A PDF navigation inside an iOS standalone PWA has no useful browser
      // chrome. Sharing the actual File opens the native sheet, including
      // "Save to Files".
      if (isIOSDevice() && navigator.share) {
        const file = await fetchPdfFile(url);
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ title, files: [file] });
          return;
        }
      }
      const response = await fetch(absoluteUrl(url), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load PDF (${response.status})`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = pdfFilename(url);
      link.rel = 'noopener';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Could not save PDF:', error);
      alert('Could not save this PDF. Please try again.');
    }
  }

  async function withResourceButtonBusy(button, work) {
    if (!button || button.disabled) return;
    const prior = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparing…';
    try { await work(); }
    finally { button.disabled = false; button.textContent = prior; }
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

  const MATERIALS_TABS = new Set(['audio', 'questions', 'essays', 'glossary', 'downloads', 'settings']);

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
    if (next === 'questions') renderMaterialsQuestions();
    if (next === 'essays') renderMaterialsEssays(dom.materialsEssayInput?.value || '');
    if (next === 'settings') {
      updateAnalyticsUi();
      syncChaburaSettingsUi();
    }
  }

  function renderMaterialsQuestions() {
    if (dom.materialsQuestionCount) dom.materialsQuestionCount.textContent = `${QUESTIONS.length} questions`;
    const qid = currentQuestion()?.id;
    if (dom.materialsCurrentQuestionBtn) {
      dom.materialsCurrentQuestionBtn.textContent = qid ? `Open question ${qid}` : 'Open current question';
      dom.materialsCurrentQuestionBtn.disabled = !qid;
    }
    if (!dom.materialsQuestionCategories || dom.materialsQuestionCategories.childElementCount) return;
    const fragment = document.createDocumentFragment();
    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'materials-question-category';
      button.dataset.questionCategory = category;
      const count = QUESTIONS.filter(q => q.category === category).length;
      const label = document.createElement('span');
      label.textContent = category;
      const meta = document.createElement('small');
      meta.textContent = `${count} question${count === 1 ? '' : 's'}`;
      button.append(label, meta);
      fragment.append(button);
    });
    dom.materialsQuestionCategories.append(fragment);
  }

  function renderMaterialsEssays(query = '') {
    if (!dom.materialsEssayList) return;
    const term = String(query || '').trim().toLowerCase();
    const rows = ESSAY_BANK
      .map((essay, index) => ({ essay, index }))
      .filter(({ essay }) => !term || essayLibraryHaystack(essay).includes(term));

    if (dom.materialsEssayCount) dom.materialsEssayCount.textContent = `${rows.length} essay${rows.length === 1 ? '' : 's'}`;
    dom.materialsEssayList.innerHTML = '';

    rows.forEach(({ essay, index }) => {
      const progress = essayProgressState.essays?.[essay.id] || {};
      const mastered = essay.facts.filter(fact => essayFactStat(fact.id).mastery >= 2).length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'materials-essay-card';
      button.dataset.materialsEssayId = essay.id;
      button.innerHTML = `
        <span class="materials-essay-number">Essay ${index + 1}</span>
        <span class="materials-essay-copy">
          <strong>${escapeHtml(essay.title)}</strong>
          <small>${mastered}/${essay.facts.length} facts mastered${Number(progress.attempts) ? ` · ${Number(progress.attempts)} practice round${Number(progress.attempts) === 1 ? '' : 's'}` : ''}</small>
        </span>
        <span class="materials-essay-chevron" aria-hidden="true">›</span>`;
      dom.materialsEssayList.append(button);
    });

    dom.materialsEssayEmpty?.classList.toggle('hidden', rows.length > 0);
    dom.materialsEssaySearchClear?.classList.toggle('hidden', !term);
  }

  function openMaterialsEssay(essayId) {
    const essay = ESSAY_BANK.find(item => item.id === essayId);
    if (!essay || mode === 'test') return;
    if (dom.materialsDialog?.open) dom.materialsDialog.close();
    flushQuestionTime();
    if (dom.essayIntroDialog?.open) dom.essayIntroDialog.close();
    if (dom.essayLibrarySearch) dom.essayLibrarySearch.value = essay.title;
    renderEssayLibrary(essay.title);
    if (!dom.essayLibraryDialog.open) dom.essayLibraryDialog.showModal();
  }

  function launchMaterialsQuestionSearch() {
    openQuestionSearch(dom.materialsQuestionInput?.value || '');
  }

  function setSettingsStatus(message = '') {
    if (dom.settingsStatus) dom.settingsStatus.textContent = message;
  }

  async function clearOfflineCache() {
    const msg = 'Clear downloaded audio and cached app files? Your study statistics and settings will not be erased.';
    if (!confirm(msg)) return;
    if (!('caches' in window)) {
      setSettingsStatus('Offline cache controls are not available in this browser.');
      return;
    }
    if (dom.clearCacheBtn) dom.clearCacheBtn.disabled = true;
    setSettingsStatus('Clearing cache…');
    try {
      const keys = await caches.keys();
      const appKeys = keys.filter(key => key.startsWith('scp-study-'));
      await Promise.all(appKeys.map(key => caches.delete(key)));
      cachedAudioUrls.clear();
      updateAudioCacheStatus();
      renderAudioPlaylist();
      setSettingsStatus('Cache cleared. Files will download again as needed.');
    } catch (err) {
      console.warn('Could not clear offline cache:', err);
      setSettingsStatus('Could not clear the cache. Please try again.');
    } finally {
      if (dom.clearCacheBtn) dom.clearCacheBtn.disabled = false;
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

  function renderEssayRelevantAudio(fact, container) {
    if (!container) return;
    const refs = ESSAY_AUDIO_MAP?.[String(fact?.id)] || [];
    if (!refs.length) { container.innerHTML = ''; container.classList.add('hidden'); return; }
    const rows = refs.map(ref => {
      const track = AUDIO_REVIEW_DATA.find(t => Number(t.id) === Number(ref.review));
      if (!track) return '';
      return `<div class="question-audio-row"><button class="question-audio-play" type="button" data-related-review="${ref.review}" data-related-start="${ref.start}"><span class="question-audio-playicon" aria-hidden="true">▶</span><span class="question-audio-copy"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(ref.label || 'Relevant section')}</small></span><span class="question-audio-time">${formatAudioTime(ref.start)}</span></button><button class="question-audio-transcript" type="button" data-related-transcript="${ref.review}" data-related-start="${ref.start}" aria-label="Open transcript at ${formatAudioTime(ref.start)}">Transcript</button></div>`;
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

  function openQuestionSearch(initialQuery = '') {
    const query = typeof initialQuery === 'string' ? initialQuery.trim() : '';
    const qid = currentQuestion()?.id || QUESTIONS[0]?.id;
    if (dom.materialsDialog?.open) dom.materialsDialog.close();
    openQuestionReviewAll(qid);
    if (query && dom.reviewSearchInput) {
      dom.reviewSearchInput.value = query;
      applyQuestionReviewSearch(query, { preserveQuestion: false });
    }
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
    renderCourseNoteLinks(dom.reviewNoteLinks, 'question', q.id);
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

  function renderEssayStudyStats() {
    const summary = essayMasterySummary();
    const rows = ESSAY_BANK.map(essay => {
      const progress = essayProgressState.essays?.[essay.id] || {};
      const attempts = Math.max(0, Number(progress.attempts) || 0);
      const perfect = Math.max(0, Number(progress.perfect) || 0);
      const mastered = essay.facts.filter(fact => essayFactStat(fact.id).mastery >= 2).length;
      const seen = essay.facts.filter(fact => essayFactStat(fact.id).seen > 0).length;
      const lastTotal = Math.max(0, Number(progress.lastTotal) || 0);
      const lastScore = Math.max(0, Number(progress.lastScore) || 0);
      return {
        essay,
        attempts,
        perfect,
        mastered,
        seen,
        last: attempts && lastTotal ? `${lastScore}/${lastTotal}` : '—'
      };
    });
    const practiced = rows.filter(row => row.attempts > 0).length;
    const perfectEssays = rows.filter(row => row.perfect > 0).length;
    const totalRounds = rows.reduce((sum, row) => sum + row.attempts, 0);
    const perfectRounds = rows.reduce((sum, row) => sum + row.perfect, 0);
    const practicedRows = rows.filter(row => row.attempts > 0 || row.seen > 0).map(row =>
      `<tr><td>${escapeHtml(row.essay.title)}</td><td>${row.seen}/${row.essay.facts.length}</td><td>${row.mastered}/${row.essay.facts.length}</td><td>${row.attempts}</td><td>${row.perfect}</td><td>${row.last}</td></tr>`
    ).join('');

    return `
      <div class="stat-section">
        <h3>Essay practice</h3>
        <div class="stat-grid">
          ${statCard('Facts mastered', `${summary.mastered}/${summary.total}`)}
          ${statCard('Facts seen', `${summary.seen}/${summary.total}`)}
          ${statCard('Essays practiced', `${practiced}/${ESSAY_BANK.length}`)}
          ${statCard('Perfect essays', perfectEssays)}
          ${statCard('Practice rounds', totalRounds)}
          ${statCard('Perfect rounds', perfectRounds)}
        </div>
        ${practicedRows
          ? `<details><summary>Per-essay progress</summary><div class="details-body table-wrap"><table><thead><tr><th>Essay</th><th>Facts seen</th><th>Mastered</th><th>Rounds</th><th>Perfect</th><th>Last score</th></tr></thead><tbody>${practicedRows}</tbody></table></div></details>`
          : '<div class="callout"><strong>No essay practice yet</strong><p>Essay fact mastery, completed rounds, perfect rounds, and per-essay progress will appear here.</p></div>'}
      </div>`;
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
      ${renderEssayStudyStats()}
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

  function resetAllProgress(options = {}) {
    const closeStats = options?.closeStats !== false;
    const msg = 'Reset all study history, timing, category filters, and practice-test results for this Zman? This cannot be undone.';
    if (options?.confirm !== false && !confirm(msg)) return false;
    flushQuestionTime();
    flushStudyTime();
    state = defaultState();
    mode = 'study';
    lastFinishedTest = null;
    essayProgressState = defaultEssayProgress();
    essayRun = null;
    essayAnalyticsSessionId = null;
    removeScopedValue(ESSAY_PRACTICE_KEY);
    removeScopedValue(ESSAY_CATEGORY_FILTER_KEY);
    saveState();
    updateEssayProgressUi();
    if (closeStats && dom.statsDialog.open) dom.statsDialog.close();
    appendStudyQuestion();
    beginStudyTimeIfNeeded();
    render();
    renderMaterialsQuestions();
    return true;
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
    dom.questionNumber?.addEventListener('change', event => {
      const currentId = currentQuestion()?.id;
      const nextId = Number(event.currentTarget.value);
      if (nextId && nextId !== currentId) goToQuestionNumber(nextId);
    });

    [dom.brandLogo, dom.brandTitle].forEach(node => {
      node?.addEventListener('click', openAppInfo);
      node?.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openAppInfo();
      });
    });

    dom.settingsCohortSelect?.addEventListener('change', syncCohortSettingsUi);
    dom.switchCohortBtn?.addEventListener('click', switchStudyCohort);
    dom.settingsChaburaLocation?.addEventListener('change', e => {
      fillChaburaSelect(dom.settingsChaburaSelect, e.currentTarget.value, '');
      if (dom.chaburaSettingsStatus) dom.chaburaSettingsStatus.textContent = 'Choose a chabura, then save.';
    });
    dom.saveChaburaSettingsBtn?.addEventListener('click', () => {
      if (setChaburaProfile(dom.settingsChaburaLocation?.value, dom.settingsChaburaSelect?.value)) {
        if (dom.chaburaSettingsStatus) dom.chaburaSettingsStatus.textContent = 'Saved.';
      } else if (dom.chaburaSettingsStatus) dom.chaburaSettingsStatus.textContent = 'Choose both a location and chabura.';
    });
    dom.chaburaDialogLocation?.addEventListener('change', e => {
      fillChaburaSelect(dom.chaburaDialogSelect, e.currentTarget.value, '');
      if (dom.saveChaburaDialogBtn) dom.saveChaburaDialogBtn.disabled = true;
    });
    dom.chaburaDialogSelect?.addEventListener('change', () => {
      if (dom.saveChaburaDialogBtn) dom.saveChaburaDialogBtn.disabled = !validChaburaSettings({
        location: dom.chaburaDialogLocation?.value,
        chabura: dom.chaburaDialogSelect?.value
      });
    });
    dom.saveChaburaDialogBtn?.addEventListener('click', () => {
      if (!setChaburaProfile(dom.chaburaDialogLocation?.value, dom.chaburaDialogSelect?.value)) return;
      dom.chaburaDialog?.close();
    });
    dom.chaburaDialog?.addEventListener('cancel', e => e.preventDefault());

    dom.prevBtn.addEventListener('click', goPrevious);
    dom.nextBtn.addEventListener('click', goNext);
    dom.categoriesBtn.addEventListener('click', openCategories);
    dom.materialsBtn.addEventListener('click', openMaterials);
    dom.questionSearchFab?.addEventListener('click', () => {
      if (essayModeActive && mode === 'study') openEssaySearch();
      else openQuestionSearch();
    });
    const openCurrentExplorer = kind => {
      const q = currentQuestion();
      const entry = currentEntry();
      if (!q || !entry?.answered) return;
      if (kind === 'category') openQuestionReview(q.id, QUESTIONS.filter(x => x.category === q.category).map(x => x.id), `Category: ${q.category}`);
      else openQuestionReviewAll(q.id);
    };
    dom.questionCategory.addEventListener('click', () => openCurrentExplorer('category'));
    dom.questionCategory.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (dom.questionCategory.getAttribute('aria-disabled') === 'true') return;
      e.preventDefault();
      openCurrentExplorer('category');
    });

    dom.questionReportBtn?.addEventListener('click', () => {
      const q = currentQuestion();
      if (q) openContentFeedback(questionFeedbackTarget(q, mode));
    });
    dom.reviewQuestionReportBtn?.addEventListener('click', () => {
      if (!reviewContext?.ids?.length) return;
      const q = questionById.get(reviewContext.ids[reviewContext.index]);
      if (q) openContentFeedback(questionFeedbackTarget(q, 'question_review'));
    });
    dom.essayPromptReportBtn?.addEventListener('click', () => {
      if (essayRun?.essay) openContentFeedback(essayPromptFeedbackTarget(essayRun.essay, 'essay_practice'));
    });
    dom.essayPairingReportBtn?.addEventListener('click', () => {
      const fact = currentEssayFact();
      if (essayRun?.essay && fact) openContentFeedback(essayPairingFeedbackTarget(essayRun.essay, fact, 'essay_practice'));
    });
    dom.essayAnswerZone?.addEventListener('click', e => {
      const button = e.target.closest('[data-report-essay-pairing]');
      if (!button || !essayRun?.essay) return;
      const fact = essayRun.essay.facts.find(item => item.id === button.dataset.reportEssayPairing);
      if (fact) openContentFeedback(essayPairingFeedbackTarget(essayRun.essay, fact, 'essay_practice'));
    });

    dom.pdfViewerBackBtn?.addEventListener('click', closePdfViewer);
    dom.pdfViewerDialog?.addEventListener('cancel', e => { e.preventDefault(); closePdfViewer(); });
    dom.pdfViewerShareBtn?.addEventListener('click', () => {
      if (activePdfViewer) void withResourceButtonBusy(dom.pdfViewerShareBtn, () => sharePdf(activePdfViewer.url, activePdfViewer.title));
    });
    dom.pdfViewerPrintBtn?.addEventListener('click', () => {
      if (activePdfViewer) printPdf(activePdfViewer.url);
    });
    dom.pdfViewerDownloadBtn?.addEventListener('click', () => {
      if (activePdfViewer) void withResourceButtonBusy(dom.pdfViewerDownloadBtn, () => savePdf(activePdfViewer.url, activePdfViewer.title));
    });
    dom.pdfViewerJump?.addEventListener('change', e => {
      const option = e.currentTarget.selectedOptions?.[0];
      const page = Number(option?.dataset?.page);
      if (page && activePdfViewer) void scrollPdfViewerTo(page, e.currentTarget.value || '');
    });

    dom.statsBtn.addEventListener('click', openStats);
    dom.closeAppInfo?.addEventListener('click', () => dom.appInfoDialog.close());
    dom.appInfoMcBtn?.addEventListener('click', () => chooseModeFromAppInfo('mc'));
    dom.appInfoEssayBtn?.addEventListener('click', () => chooseModeFromAppInfo('essay'));
    dom.appInfoTestBtn?.addEventListener('click', () => chooseModeFromAppInfo('test'));
    dom.appInfoShareBtn?.addEventListener('click', () => void shareStudyApp());
    dom.appInfoUpdateBtn?.addEventListener('click', () => {
      dom.appInfoDialog?.close();
      void checkForAppUpdate({ manual: true });
    });
    dom.appInfoSettingsBtn?.addEventListener('click', openSettingsFromAppInfo);
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

    dom.essayBtn?.addEventListener('click', handleEssayModeButton);
    dom.closeEssayIntro?.addEventListener('click', () => dom.essayIntroDialog.close());
    dom.cancelEssayStart?.addEventListener('click', () => dom.essayIntroDialog.close());
    dom.startEssayFromIntroBtn?.addEventListener('click', startEssayPractice);
    dom.viewEssayLibraryBtn?.addEventListener('click', openEssayLibrary);
    dom.essayQuickNav?.addEventListener('change', event => {
      const essayId = event.currentTarget.value;
      if (essayId && essayId !== essayRun?.essay?.id) startSpecificEssay(essayId);
    });
    dom.closeMcIntro?.addEventListener('click', () => dom.mcIntroDialog.close());
    dom.cancelMcStart?.addEventListener('click', () => dom.mcIntroDialog.close());
    dom.startMcFromIntroBtn?.addEventListener('click', leaveEssayMode);
    dom.closeEssayLibrary?.addEventListener('click', () => dom.essayLibraryDialog.close());
    dom.doneEssayLibrary?.addEventListener('click', () => dom.essayLibraryDialog.close());
    dom.essayLibrarySearch?.addEventListener('input', e => renderEssayLibrary(e.currentTarget.value));
    dom.essayLibrarySearchClear?.addEventListener('click', () => {
      if (dom.essayLibrarySearch) {
        dom.essayLibrarySearch.value = '';
        dom.essayLibrarySearch.focus();
      }
      renderEssayLibrary('');
    });
    dom.essayLibraryList?.addEventListener('click', e => {
      const practice = e.target.closest('[data-essay-library-practice]');
      if (practice) {
        startSpecificEssay(practice.dataset.essayLibraryPractice);
        return;
      }
      const promptReport = e.target.closest('[data-report-essay-prompt]');
      if (promptReport) {
        const essay = ESSAY_BANK.find(item => item.id === promptReport.dataset.reportEssayPrompt);
        if (essay) openContentFeedback(essayPromptFeedbackTarget(essay, 'essay_library'));
        return;
      }
      const pairingReport = e.target.closest('[data-report-essay-pairing]');
      if (pairingReport) {
        const essay = ESSAY_BANK.find(item => item.id === pairingReport.dataset.reportEssayId);
        const fact = essay?.facts.find(item => item.id === pairingReport.dataset.reportEssayPairing);
        if (essay && fact) openContentFeedback(essayPairingFeedbackTarget(essay, fact, 'essay_library'));
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
    dom.materialsQuestionGoBtn?.addEventListener('click', launchMaterialsQuestionSearch);
    dom.materialsEssayInput?.addEventListener('input', e => renderMaterialsEssays(e.currentTarget.value));
    dom.materialsEssayInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape' && e.currentTarget.value) {
        e.preventDefault();
        e.currentTarget.value = '';
        renderMaterialsEssays('');
      }
    });
    dom.materialsEssaySearchClear?.addEventListener('click', () => {
      if (!dom.materialsEssayInput) return;
      dom.materialsEssayInput.value = '';
      dom.materialsEssayInput.focus();
      renderMaterialsEssays('');
    });
    dom.materialsBrowseAllEssays?.addEventListener('click', () => {
      if (dom.materialsDialog?.open) dom.materialsDialog.close();
      openEssayLibrary();
    });
    dom.materialsEssayList?.addEventListener('click', e => {
      const button = e.target.closest('[data-materials-essay-id]');
      if (button) openMaterialsEssay(button.dataset.materialsEssayId);
    });
    dom.materialsQuestionInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        launchMaterialsQuestionSearch();
      } else if (e.key === 'Escape' && e.currentTarget.value) {
        e.preventDefault();
        e.currentTarget.value = '';
      }
    });
    dom.essayChoiceList?.addEventListener('click', e => {
      const button = e.target.closest('[data-essay-choice]');
      if (button) handleEssayChoice(button.dataset.essayChoice);
    });
    dom.essayTryAgainBtn?.addEventListener('click', retryEssayPractice);
    dom.essayNextBtn?.addEventListener('click', nextEssayPractice);
    dom.closeContentFeedback?.addEventListener('click', () => dom.contentFeedbackDialog.close());
    dom.cancelContentFeedback?.addEventListener('click', () => dom.contentFeedbackDialog.close());
    dom.contentFeedbackDialog?.addEventListener('change', e => {
      if (e.target.matches('input[name="contentFeedbackReason"]')) updateContentFeedbackSubmitState();
    });
    dom.contentFeedbackDetails?.addEventListener('input', e => {
      const value = String(e.currentTarget.value || '').slice(0, 500);
      if (value !== e.currentTarget.value) e.currentTarget.value = value;
      if (dom.contentFeedbackCount) dom.contentFeedbackCount.textContent = `${value.length}/500`;
    });
    dom.submitContentFeedback?.addEventListener('click', () => void submitActiveContentFeedback());
    dom.materialsBrowseAllQuestions?.addEventListener('click', () => openQuestionSearch(''));
    dom.materialsCurrentQuestionBtn?.addEventListener('click', () => {
      const qid = currentQuestion()?.id || QUESTIONS[0]?.id;
      if (dom.materialsDialog?.open) dom.materialsDialog.close();
      openQuestionReviewAll(qid);
    });
    dom.materialsQuestionCategories?.addEventListener('click', e => {
      const button = e.target.closest('[data-question-category]');
      if (!button) return;
      const category = button.dataset.questionCategory;
      if (dom.materialsDialog?.open) dom.materialsDialog.close();
      openQuestionReviewCategory(category);
    });
    dom.clearCacheBtn?.addEventListener('click', () => void clearOfflineCache());
    // v53 reset statistics is handled by resetStatisticsFromSettings(), which supports this Zman or all Zmanim.
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
    document.addEventListener('click', e => {
      const note = e.target.closest('[data-course-note-doc]');
      if (!note) return;
      openCourseNote(note.dataset.courseNoteDoc, note.dataset.courseNoteKind, note.dataset.courseNoteId);
    });

    document.addEventListener('click', e => {
      const audio = e.target.closest('[data-pairing-audio-fact]');
      if (!audio) return;
      const essay = ESSAY_BANK.find(item => item.id === audio.dataset.pairingAudioEssay);
      const fact = essay?.facts.find(item => item.id === audio.dataset.pairingAudioFact);
      const ref = fact ? ESSAY_AUDIO_MAP?.[fact.id]?.[0] : null;
      if (!ref) return;
      const context = audio.dataset.pairingAudioContext || 'library';
      if (context === 'practice' && essayRun?.essay?.id === essay?.id) essayRun.stepAudioUsed = true;
      void playAudioReference(Number(ref.review), Number(ref.start), {
        autoplay: context === 'practice',
        openMaterials: context !== 'practice'
      });
    });

    dom.materialsDialog.addEventListener('click', e => {
      const view = e.target.closest('[data-view-pdf]');
      if (view) {
        openPdfViewer({
          url: view.dataset.viewPdf,
          title: view.dataset.pdfTitle || 'SCP Study PDF',
          page: 1,
          docKey: view.dataset.courseNotes || null
        });
        return;
      }
      const print = e.target.closest('[data-print-pdf]');
      if (print) { printPdf(print.dataset.printPdf); return; }
      const save = e.target.closest('[data-save-pdf]');
      if (save) { void withResourceButtonBusy(save, () => savePdf(save.dataset.savePdf, save.dataset.pdfTitle || 'SCP Study PDF')); return; }
      const share = e.target.closest('[data-share-pdf]');
      if (share) void withResourceButtonBusy(share, () => sharePdf(share.dataset.sharePdf, share.dataset.pdfTitle || 'SCP Study PDF'));
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
    dom.audioPlayer.addEventListener('play', () => {
      miniAudioStopped = false;
      const track = currentAudioTrack();
      if (track) {
        const question = !essayModeActive ? currentQuestion() : null;
        queueResourceAnalytics({
          resourceType:'audio',
          resourceId:String(track.id ?? track.src ?? track.title ?? 'audio'),
          resourceLabel:track.title || track.name || `Audio review ${audioTrackIndex + 1}`,
          resourceVariant:track.src || null,
          source:essayModeActive ? 'essay' : (dom.materialsDialog?.open && activeMaterialsTab === 'audio' ? 'materials' : 'player'),
          contextKind:essayModeActive ? 'essay' : (question ? 'question' : 'other'),
          contextId:essayModeActive ? essayRun?.essay?.id : question?.id,
          category:question?.category || null
        });
      }
      setMediaPlaybackState('playing'); updateMediaPositionState(); renderAudioPlaylist(); updateMiniAudio();
    });
    dom.audioPlayer.addEventListener('pause', () => { if (!dom.audioPlayer.ended) setMediaPlaybackState('paused'); saveAudioPlaybackState(true); updateMediaPositionState(); renderAudioPlaylist(); updateMiniAudio(); });
    dom.audioPlayer.addEventListener('timeupdate', () => { saveAudioPlaybackState(false); syncTranscriptToAudio(false); updateMediaPositionState(); updateMiniAudio(); });
    dom.audioPlayer.addEventListener('durationchange', updateMediaPositionState);
    dom.audioPlayer.addEventListener('ratechange', updateMediaPositionState);

    dom.closeStats.addEventListener('click', () => dom.statsDialog.close());
    dom.doneStatsBtn.addEventListener('click', () => dom.statsDialog.close());
    dom.resetStatsBtn.addEventListener('click', promptResetStatisticsScope);

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
      openGlossaryEntry(term.dataset.glossaryId, term.closest('#glossaryList') ? 'materials' : (term.closest('#essayLibraryDialog, #essayPracticeMain') ? 'other' : 'question'));
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
      openGlossaryEntry(term.dataset.glossaryId, term.closest('#glossaryList') ? 'materials' : (term.closest('#essayLibraryDialog, #essayPracticeMain') ? 'other' : 'question'));
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

    window.addEventListener('online', () => {
      void flushAnalyticsQueue();
      void flushContentFeedbackQueue();
    });

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


  function activeZmanEntries() {
    return Array.isArray(COHORT_REGISTRY.cohorts) ? COHORT_REGISTRY.cohorts : [];
  }

  function syncActiveZmanDocuments() {
    const documents = ACTIVE_COHORT.documents && typeof ACTIVE_COHORT.documents === 'object' ? ACTIVE_COHORT.documents : {};
    document.querySelectorAll('[data-document-key]').forEach(button => {
      const url = String(documents[button.dataset.documentKey] || '');
      if (!url) return;
      if (button.hasAttribute('data-view-pdf')) button.dataset.viewPdf = url;
      if (button.hasAttribute('data-print-pdf')) button.dataset.printPdf = url;
      if (button.hasAttribute('data-save-pdf')) button.dataset.savePdf = url;
      if (button.hasAttribute('data-share-pdf')) button.dataset.sharePdf = url;
    });
  }

  function maybePromptLatestZman() {
    const latestId = String(COHORT_REGISTRY.latestZmanId || '');
    if (!latestId || latestId === COHORT_ID) return;
    const latest = activeZmanEntries().find(item => String(item.id) === latestId);
    if (!latest) return;
    const promptKey = `${LATEST_ZMAN_PROMPT_KEY}:${latestId}`;
    try { if (localStorage.getItem(promptKey)) return; } catch (_) {}
    const shouldSwitch = confirm(`${latest.name || latestId} is now available. Switch to the new Zman?`);
    try { localStorage.setItem(promptKey, shouldSwitch ? 'switched' : 'dismissed'); } catch (_) {}
    if (!shouldSwitch) return;
    try { localStorage.setItem(COHORT_SELECTION_KEY, latestId); } catch (_) {}
    window.location.reload();
  }

  function reminderSettings() {
    const defaults = { pushEnabled:false, dailyEnabled:false, dailyRequested:false, time:'19:00', israelCalendar:false };
    try {
      const saved = JSON.parse(localStorage.getItem(STUDY_REMINDER_SETTINGS_KEY) || '{}');
      const value = { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
      if (!Object.prototype.hasOwnProperty.call(saved || {}, 'dailyRequested')) value.dailyRequested = !!value.dailyEnabled;
      if (!value.pushEnabled) value.dailyEnabled = false;
      return value;
    } catch (_) { return defaults; }
  }

  function saveReminderSettings(value) {
    try { localStorage.setItem(STUDY_REMINDER_SETTINGS_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function setReminderStatus(message = '') {
    const node = el('studyReminderStatus');
    if (node) node.textContent = message;
  }

  function conciseReminderTime(value) {
    const match=/^(\d{2}):(\d{2})$/.exec(String(value||''));if(!match)return value||'';
    const hour=Number(match[1]),minute=Number(match[2]),suffix=hour>=12?'pm':'am',h=hour%12||12;
    return `${h}${minute?':'+String(minute).padStart(2,'0'):''}${suffix}`;
  }

  async function refreshReminderSummary() {
    const settings=reminderSettings(),time=conciseReminderTime(settings.time||'19:00');
    if(!settings.dailyEnabled){
      setReminderStatus('Study reminders are disabled');
      return;
    }
    if(!settings.pushEnabled||typeof Notification==='undefined'||Notification.permission!=='granted'){
      setReminderStatus('Study reminders are disabled');
      return;
    }
    try{
      const url=new URL(NEXT_REMINDER_ENDPOINT);
      url.searchParams.set('installationId',analyticsInstallationId());
      url.searchParams.set('zman',ANALYTICS_COHORT);
      const response=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||'Could not load reminder schedule');
      if(!data.enabled){setReminderStatus('Study reminders are disabled');return}
      if(data.reason==='today')setReminderStatus(`You'll get a study reminder at ${time} today`);
      else if(data.reason==='after_yom_tov')setReminderStatus(`You'll get a study reminder at ${time} after Yom Tov`);
      else if(data.reason==='after_shabbat')setReminderStatus(`You'll get a study reminder at ${time} after Shabbat`);
      else if(data.reason==='tomorrow')setReminderStatus(`You'll get a study reminder at ${time} tomorrow`);
      else setReminderStatus(`Your next study reminder is at ${time}`);
    }catch(error){
      console.warn('Could not load next reminder:',error);
      setReminderStatus(`Daily reminder is on for ${time}`);
    }
  }

  function syncNotificationPermissionNag() {
    const nag=el('notificationPermissionNag'),copy=el('notificationPermissionNagText');
    if(!nag||!copy)return;
    if(typeof Notification==='undefined'||!('serviceWorker' in navigator)||!('PushManager' in window)){
      nag.classList.add('hidden');return;
    }
    const settings=reminderSettings(),enabled=Notification.permission==='granted'&&settings.pushEnabled;
    nag.classList.toggle('hidden',enabled);
    if(enabled)return;
    copy.textContent=Notification.permission==='denied'
      ? 'Push notifications are blocked in your browser. Tap to try again or enable them in site settings.'
      : 'Push notifications are off. Tap to enable them.';
  }

  function syncReminderSettingsUi() {
    const settings = reminderSettings();
    if (el('pushNotificationsToggle')) el('pushNotificationsToggle').checked = !!settings.pushEnabled;
    if (el('dailyReminderToggle')) el('dailyReminderToggle').checked = !!settings.dailyEnabled;
    if (el('studyReminderTime')) el('studyReminderTime').value = /^\d{2}:\d{2}$/.test(settings.time || '') ? settings.time : '19:00';
    if (el('reminderCalendarMode')) el('reminderCalendarMode').value = settings.israelCalendar ? 'israel' : 'diaspora';
    syncNotificationPermissionNag();
    void refreshReminderSummary();
  }

  function urlBase64ToUint8Array(value) {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method:'POST', mode:'cors', credentials:'omit', cache:'no-store',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }

  async function currentPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  async function syncPushSubscription() {
    const settings = reminderSettings();
    if (!settings.pushEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const response = await fetch(PUSH_CONFIG_ENDPOINT, { mode:'cors', credentials:'omit', cache:'no-store' });
      const data = await response.json();
      if (!response.ok || !data?.publicKey) throw new Error(data?.error || 'Could not load push configuration');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(data.publicKey)
      });
    }
    await postJson(PUSH_SUBSCRIBE_ENDPOINT, {
      installationId:analyticsInstallationId(),
      zman:ANALYTICS_COHORT,
      subscription:subscription.toJSON(),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      reminderEnabled:!!settings.dailyEnabled,
      reminderTime:settings.time || '19:00',
      israelCalendar:!!settings.israelCalendar
    });
    return subscription;
  }

  async function enablePushNotifications({ interactive=true } = {}) {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      showAppToast('Push notifications are not supported in this browser.');
      return false;
    }
    let permission = Notification.permission;
    if (permission === 'default' && interactive) permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      const settings = reminderSettings();
      settings.pushEnabled = false;
      settings.dailyEnabled = false;
      saveReminderSettings(settings);
      syncReminderSettingsUi();
      showAppToast(permission === 'denied' ? 'Notifications are blocked in browser settings.' : 'Notification permission was not enabled.');
      syncNotificationPermissionNag();
      void refreshReminderSummary();
      return false;
    }
    const settings = reminderSettings();
    settings.pushEnabled = true;
    settings.dailyEnabled = !!settings.dailyRequested;
    saveReminderSettings(settings);
    syncReminderSettingsUi();
    try {
      await syncPushSubscription();
      syncNotificationPermissionNag();
      void refreshReminderSummary();
      return true;
    } catch (error) {
      console.warn('Push setup failed:', error);
      showAppToast('Could not enable push notifications: ' + error.message);
      syncNotificationPermissionNag();
      return false;
    }
  }

  async function disablePushNotifications() {
    const settings = reminderSettings();
    if (!Object.prototype.hasOwnProperty.call(settings, 'dailyRequested')) settings.dailyRequested = !!settings.dailyEnabled;
    settings.pushEnabled = false;
    settings.dailyEnabled = false;
    saveReminderSettings(settings);
    try {
      const subscription = await currentPushSubscription();
      if (subscription) {
        try { await postJson(PUSH_UNSUBSCRIBE_ENDPOINT, { installationId:analyticsInstallationId(), endpoint:subscription.endpoint }); } catch (_) {}
        await subscription.unsubscribe();
      }
    } catch (error) { console.warn('Push unsubscribe failed:', error); }
    syncReminderSettingsUi();
    syncNotificationPermissionNag();
    void refreshReminderSummary();
  }

  async function applyDailyReminderToggle(enabled) {
    let settings = reminderSettings();
    settings.dailyRequested = !!enabled;
    settings.dailyEnabled = !!enabled && !!settings.pushEnabled;
    saveReminderSettings(settings);
    syncReminderSettingsUi();

    if (enabled && !settings.pushEnabled) {
      await enablePushNotifications({ interactive:true });
      settings = reminderSettings();
      settings.dailyEnabled = !!settings.pushEnabled && !!settings.dailyRequested;
      saveReminderSettings(settings);
    }

    try {
      if (reminderSettings().pushEnabled) await syncPushSubscription();
    } catch (error) {
      console.warn('Could not update daily reminder:', error);
      showAppToast('Could not update the daily reminder: ' + error.message);
    }
    syncReminderSettingsUi();
    await refreshReminderSummary();
  }

  async function saveReminderSettingsFromUi() {
    const time = String(el('studyReminderTime')?.value || '19:00');
    const israelCalendar = el('reminderCalendarMode')?.value === 'israel';
    const settings = reminderSettings();
    settings.time = /^\d{2}:\d{2}$/.test(time) ? time : '19:00';
    settings.israelCalendar = israelCalendar;
    saveReminderSettings(settings);
    try {
      if (settings.pushEnabled) await syncPushSubscription();
      await refreshReminderSummary();
    } catch (error) {
      showAppToast('Could not save reminder settings: ' + error.message);
      await refreshReminderSummary();
    }
    syncReminderSettingsUi();
  }

  let notificationInboxCache = [];

  function safeNotificationUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), window.location.origin);
      if (url.origin === window.location.origin || url.protocol === 'https:') return url.href;
    } catch (_) {}
    return '';
  }

  function sanitizeNotificationHtml(value) {
    if (!value) return '';
    const template = document.createElement('template');
    template.innerHTML = String(value);
    const allowed = new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','A']);
    const out = document.createElement('div');
    const copy = (node, parent) => {
      if (node.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(node.textContent || ''));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toUpperCase();
      if (!allowed.has(tag)) {
        [...node.childNodes].forEach(child => copy(child, parent));
        return;
      }
      const clean = document.createElement(tag.toLowerCase());
      if (tag === 'A') {
        const href = safeNotificationUrl(node.getAttribute('href') || '');
        if (!href) {
          [...node.childNodes].forEach(child => copy(child, parent));
          return;
        }
        clean.href = href;
        clean.target = '_blank';
        clean.rel = 'noopener';
      }
      [...node.childNodes].forEach(child => copy(child, clean));
      parent.appendChild(clean);
    };
    [...template.content.childNodes].forEach(node => copy(node, out));
    return out.innerHTML;
  }

  function renderNotificationInbox(payload = {}) {
    notificationInboxCache = Array.isArray(payload.notifications) ? payload.notifications : [];
    const unread = Number(payload.unread) || 0;
    const badge = el('notificationBadge');
    if (badge) {
      badge.textContent = unread ? '!' : '';
      badge.classList.toggle('hidden', unread === 0);
    }
    const notificationButton = el('notificationsBtn');
    if (notificationButton) {
      notificationButton.setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
      notificationButton.title = unread ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'Notifications';
    }
    const list = el('notificationInboxList');
    if (!list) return;
    if (!notificationInboxCache.length) {
      list.innerHTML = '<div class="callout"><strong>No notifications</strong><p>Nothing is waiting for this Zman.</p></div>';
      return;
    }
    list.innerHTML = notificationInboxCache.map(item => {
      const read = !!item.readAt, archived = !!item.archivedAt;
      const actionUrl = safeNotificationUrl(item.action?.url);
      const action = actionUrl ? `<a href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener" data-notification-open="${escapeHtml(item.id)}">${escapeHtml(item.action?.label || 'Open')}</a>` : '';
      const kind = String(item.kind || 'notification').replaceAll('_',' ');
      return `<article class="notification-item ${read ? '' : 'unread'} ${archived ? 'archived' : ''}">
        <div class="notification-item-head"><div><span class="notification-item-kind">${escapeHtml(kind)}</span><br><strong>${escapeHtml(item.title || 'SCP Study')}</strong></div><span class="notification-item-meta">${escapeHtml(new Date(item.createdAt).toLocaleString())}</span></div>
        <div class="notification-item-body notification-rich-body">${item.bodyHtml ? sanitizeNotificationHtml(item.bodyHtml) : escapeHtml(item.body || '')}</div>
        <div class="notification-item-actions">
          ${action}
          <button class="secondary" type="button" data-notification-read="${escapeHtml(item.id)}" data-read-value="${read ? '0' : '1'}">${read ? 'Mark unread' : 'Mark read'}</button>
          <button class="secondary" type="button" data-notification-archive="${escapeHtml(item.id)}" data-archive-value="${archived ? '0' : '1'}">${archived ? 'Unarchive' : 'Archive'}</button>
        </div>
      </article>`;
    }).join('');
  }

  async function loadNotificationInbox({ includeArchived = !!el('notificationShowArchived')?.checked } = {}) {
    const status = el('notificationInboxStatus');
    if (status) status.textContent = 'Loading…';
    try {
      const url = new URL(NOTIFICATIONS_ENDPOINT);
      url.searchParams.set('zman', ANALYTICS_COHORT);
      url.searchParams.set('installationId', analyticsInstallationId());
      if (includeArchived) url.searchParams.set('includeArchived','1');
      const response = await fetch(url, { mode:'cors', credentials:'omit', cache:'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not load notifications');
      renderNotificationInbox(data);
      syncNotificationPermissionNag();
      if (status) status.textContent = '';
      return data;
    } catch (error) {
      if (status) status.textContent = 'Could not load notifications: ' + error.message;
      return null;
    }
  }

  async function updateNotificationState(id, changes) {
    await postJson(NOTIFICATION_STATE_ENDPOINT, { installationId:analyticsInstallationId(), id, ...changes });
    return loadNotificationInbox();
  }

  function openNotificationInbox() {
    const dialog = el('notificationInboxDialog');
    if (dialog && !dialog.open) dialog.showModal();
    void loadNotificationInbox();
  }

  async function handleNotificationBellClick() {
    if(typeof Notification!=='undefined'&&Notification.permission==='default'&&!reminderSettings().pushEnabled){
      await enablePushNotifications({interactive:true});
    }
    openNotificationInbox();
    syncNotificationPermissionNag();
  }

  async function handleInboxPushNag() {
    const enabled=await enablePushNotifications({interactive:true});
    if(!enabled&&typeof Notification!=='undefined'&&Notification.permission==='denied'){
      showAppToast('Push notifications are blocked in browser settings.');
    }
    syncNotificationPermissionNag();
  }

  function exportGroupForKey(key) {
    if (key === STORAGE_KEY || key.startsWith(ESSAY_PRACTICE_KEY) || key.startsWith(ESSAY_CATEGORY_FILTER_KEY)) return 'stats';
    if (key === ANALYTICS_SETTINGS_KEY || key === COHORT_SELECTION_KEY || key === STUDY_REMINDER_SETTINGS_KEY || key.startsWith(CHABURA_SETTINGS_KEY)) return 'settings';
    if (key.startsWith(AUDIO_PLAYBACK_KEY) || key === MATERIALS_TAB_KEY || key === MATERIALS_TRANSCRIPT_KEY) return 'data';
    return '';
  }

  function selectedTransferGroups() {
    return {
      stats: !!el('exportStatsCheck')?.checked,
      settings: !!el('exportSettingsCheck')?.checked,
      data: !!el('exportDataCheck')?.checked
    };
  }

  async function exportAppData() {
    const selected = selectedTransferGroups();
    const groups = { stats:{}, settings:{}, data:{} };
    for (let index=0; index<localStorage.length; index++) {
      const key = localStorage.key(index);
      const group = key ? exportGroupForKey(key) : '';
      if (!group || !selected[group]) continue;
      groups[group][key] = localStorage.getItem(key);
    }
    const payload = {
      format:'scp-study-export',
      version:1,
      createdAt:new Date().toISOString(),
      activeZman:COHORT_ID,
      groups
    };
    const filename = `scp-study-backup-${new Date().toISOString().slice(0,10)}.json`;
    const json = JSON.stringify(payload,null,2);
    const file = new File([json], filename, { type:'application/json' });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files:[file] }))) {
      try {
        await navigator.share({ title:'SCP Study backup', files:[file] });
        setSettingsStatus('Export shared.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          setSettingsStatus('Export canceled.');
          return;
        }
        console.warn('Could not share export; falling back to download:', error);
      }
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSettingsStatus('Export created.');
  }

  async function importAppDataFile(file) {
    if (!file) return;
    const selected = selectedTransferGroups();
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.format !== 'scp-study-export' || !payload.groups || typeof payload.groups !== 'object') throw new Error('This is not an SCP Study export.');
      let count = 0;
      for (const group of ['stats','settings','data']) {
        if (!selected[group]) continue;
        const values = payload.groups[group];
        if (!values || typeof values !== 'object') continue;
        for (const [key,value] of Object.entries(values)) {
          if (exportGroupForKey(key) !== group || typeof value !== 'string') continue;
          localStorage.setItem(key,value);
          count += 1;
        }
      }
      if (!count) throw new Error('No selected data groups were found in the file.');
      setSettingsStatus(`Imported ${count} saved values. Reloading…`);
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setSettingsStatus('Import failed: ' + error.message);
    }
  }

  function removeLocalKeysByPrefix(prefix) {
    const keys = [];
    for (let index=0; index<localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(key => localStorage.removeItem(key));
  }

  function resetStatisticsForScope(scope = 'current', { closeStats = false } = {}) {
    const normalized = scope === 'all' ? 'all' : 'current';
    const label = normalized === 'all' ? 'all Zmanim' : COHORT_NAME;
    if (!confirm(`Reset study statistics for ${label}? This cannot be undone.`)) return false;
    if (normalized === 'current') {
      const reset = resetAllProgress({ closeStats, confirm:false });
      if (reset) {
        if (!closeStats && dom.statsDialog?.open) renderStats();
        setSettingsStatus('Statistics reset for this Zman.');
      }
      return reset;
    }
    flushQuestionTime();
    flushStudyTime();
    localStorage.removeItem(STORAGE_KEY);
    removeLocalKeysByPrefix(ESSAY_PRACTICE_KEY);
    removeLocalKeysByPrefix(ESSAY_CATEGORY_FILTER_KEY);
    setSettingsStatus('Statistics reset for all Zmanim. Reloading…');
    window.setTimeout(() => window.location.reload(), 350);
    return true;
  }

  function resetStatisticsFromSettings() {
    return resetStatisticsForScope(el('resetStatsScope')?.value || 'current', { closeStats:false });
  }

  function promptResetStatisticsScope() {
    const choice = prompt(`Reset statistics for this Zman or all Zmanim?\nType "this" or "all".`, 'this');
    if (choice == null) return;
    const normalized = String(choice).trim().toLowerCase();
    if (['this','current','zman'].includes(normalized)) {
      resetStatisticsForScope('current', { closeStats:true });
      return;
    }
    if (['all','all zmanim','zmanim'].includes(normalized)) {
      resetStatisticsForScope('all', { closeStats:true });
      return;
    }
    alert('Enter "this" for the current Zman or "all" for all Zmanim.');
  }

  async function deleteLocalAppData() {
    try {
      const subscription = await currentPushSubscription();
      if (subscription) await subscription.unsubscribe();
    } catch (_) {}
    localStorage.clear();
    try {
      await new Promise(resolve => {
        const request = indexedDB.deleteDatabase(AUDIO_DB_NAME);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
    } catch (_) {}
    if ('caches' in window) {
      try { await Promise.all((await caches.keys()).filter(key => key.startsWith('scp-study-')).map(key => caches.delete(key))); } catch (_) {}
    }
  }

  async function deleteAllDataFromSettings() {
    const scope = el('deleteDataScope')?.value || 'local';
    const includeServer = scope === 'server';
    const message = includeServer
      ? 'Delete all local SCP Study data AND anonymous server data tied to this device ID? This cannot be undone.'
      : 'Delete all local SCP Study data on this device? Anonymous server analytics already sent will remain. This cannot be undone.';
    if (!confirm(message)) return;
    if (includeServer) {
      setSettingsStatus('Deleting anonymous server data…');
      try {
        await postJson(SERVER_DATA_DELETE_ENDPOINT, { installationId:analyticsInstallationId() });
      } catch (error) {
        setSettingsStatus('Server deletion failed; local data was not deleted. ' + error.message);
        return;
      }
    }
    setSettingsStatus('Deleting local data…');
    await deleteLocalAppData();
    window.location.reload();
  }

  function syncV53SettingsUi() {
    syncReminderSettingsUi();
  }

  function initNotificationAndSettingsFeatures() {
    syncV53SettingsUi();

    el('notificationsBtn')?.addEventListener('click', () => void handleNotificationBellClick());
    el('closeNotificationInbox')?.addEventListener('click', () => el('notificationInboxDialog')?.close());
    el('doneNotificationInbox')?.addEventListener('click', () => el('notificationInboxDialog')?.close());
    el('refreshNotificationInbox')?.addEventListener('click', () => void loadNotificationInbox());
    el('notificationShowArchived')?.addEventListener('change', () => void loadNotificationInbox());
    el('notificationPermissionNag')?.addEventListener('click', () => void handleInboxPushNag());

    el('notificationInboxList')?.addEventListener('click', event => {
      const read = event.target.closest('[data-notification-read]');
      if (read) { void updateNotificationState(read.dataset.notificationRead, { read:read.dataset.readValue === '1' }); return; }
      const archive = event.target.closest('[data-notification-archive]');
      if (archive) { void updateNotificationState(archive.dataset.notificationArchive, { archived:archive.dataset.archiveValue === '1' }); return; }
      const open = event.target.closest('[data-notification-open]');
      if (open) void updateNotificationState(open.dataset.notificationOpen, { read:true });
    });

    el('pushNotificationsToggle')?.addEventListener('change', event => {
      if (event.currentTarget.checked) void enablePushNotifications({ interactive:true });
      else void disablePushNotifications();
    });
    el('dailyReminderToggle')?.addEventListener('change', event => {
      void applyDailyReminderToggle(event.currentTarget.checked);
    });
    el('saveReminderSettingsBtn')?.addEventListener('click', () => void saveReminderSettingsFromUi());

    el('exportDataBtn')?.addEventListener('click', () => void exportAppData());
    el('importDataBtn')?.addEventListener('click', () => el('importDataFile')?.click());
    el('importDataFile')?.addEventListener('change', event => {
      const file = event.currentTarget.files?.[0] || null;
      void importAppDataFile(file);
      event.currentTarget.value = '';
    });
    el('settingsResetStatsBtn')?.addEventListener('click', resetStatisticsFromSettings);
    el('deleteAllDataBtn')?.addEventListener('click', () => void deleteAllDataFromSettings());

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void loadNotificationInbox();
    });
    window.addEventListener('online', () => {
      void loadNotificationInbox();
      if (reminderSettings().pushEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') void syncPushSubscription().then(() => refreshReminderSummary());
    });

    if (reminderSettings().pushEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void syncPushSubscription().catch(error => console.warn('Push sync failed:', error));
    }
    void loadNotificationInbox();

    const url = new URL(window.location.href);
    if (url.searchParams.get('notifications') === '1') {
      url.searchParams.delete('notifications');
      history.replaceState(null,'',url.pathname+(url.search ? url.search : '')+url.hash);
      window.setTimeout(openNotificationInbox, 250);
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    const hadControllerAtStart = !!navigator.serviceWorker.controller;
    let reloadScheduled = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtStart || reloadScheduled) return;
      reloadScheduled = true;
      window.setTimeout(() => {
        const target = new URL(window.location.href);
        target.searchParams.set('scp_updated', '1');
        window.location.replace(target.href);
      }, 900);
    }, { once: true });

    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'SCP_NOTIFICATION_RECEIVED') {
        void loadNotificationInbox();
        return;
      }
      if (event.data?.type !== 'SCP_APP_UPDATED') return;
      if (event.data?.version) showAppToast(`Updated app shell to v${event.data.version}. Reloading…`, 1800);
    });

    return checkForAppUpdate({ manual: false });
  }

  function init() {
    populateQuestionNumberDropdown();
    populateEssayQuickNav();
    bindEvents();
    syncActiveZmanDocuments();
    initNotificationAndSettingsFeatures();
    maybePromptLatestZman();
    updateAppVersionUi();
    consumeUpdateAnnouncement();
    setupPullToCheckUpdates();
    void registerServiceWorker();
    setupMediaSession();
    updateBrandShareAffordance();
    updateInstallButtonVisibility();
    updateAnalyticsUi();
    syncCohortSettingsUi();
    syncChaburaSettingsUi();
    updateEssayProgressUi();
    queueChaburaProfileAnalytics();
    void flushAnalyticsQueue();
    void flushContentFeedbackQueue();
    activeMaterialsTab = savedMaterialsTab();
    setMaterialsTab(activeMaterialsTab, { remember: false });
    setTranscriptExpanded(savedTranscriptExpanded(), { remember: false });
    renderGlossary('');
    renderMaterialsQuestions();
    void loadAudioLibrary({ preserveCurrent: false }).then(() => refreshAudioCacheState());
    const expired = checkExpiredTestOnLoad();
    if (!expired) {
      if (mode === 'study' && !state.study.history.length) appendStudyQuestion();
      beginStudyTimeIfNeeded();
      render();
    }
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    prepareChaburaOnboarding();
  }

  init();
})();
