(() => {
  'use strict';

  const config = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  const zid = String(config.id || 'default');
  const analyticsZman = String(config.analyticsKey || zid);
  const MAIN = 'courseReviewSpacedRepetition.v1';
  const HISTORY = `scpStudy.testReviewHistory.v1:${zid}`;
  const SENT = `scpStudy.testAttemptAnalyticsSent.v1:${zid}`;
  const SETTINGS = 'scpStudy.analytics.v1';
  const INSTALLATION = 'scpStudy.analyticsInstallation.v1';
  const ENDPOINT = 'https://scp-study-analytics.ksariash.workers.dev/api/test-attempts';

  const parse = (value, fallback) => {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };
  const analyticsEnabled = () => parse(localStorage.getItem(SETTINGS) || '{}', {}).enabled !== false;
  const installationId = () => localStorage.getItem(INSTALLATION) || '';
  const appVersion = () => String((document.getElementById('appVersionFooter')?.textContent || '').match(/v(\d+)/i)?.[1] || '');
  const configuredQuestionCount = () => {
    if (typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS)) return QUESTIONS.length;
    if (Array.isArray(window.QUESTIONS)) return window.QUESTIONS.length;
    return Number(config.questionCount) || 0;
  };

  function mainState() {
    const raw = parse(localStorage.getItem(MAIN), null);
    if (!raw) return null;
    return raw.scopeVersion === 1 && raw.cohorts && typeof raw.cohorts === 'object' ? raw.cohorts[zid] || null : raw;
  }

  function detailedRows() {
    const rows = parse(localStorage.getItem(HISTORY), []);
    return Array.isArray(rows) ? rows : [];
  }

  function summaryRows() {
    const rows = mainState()?.tests;
    return Array.isArray(rows) ? rows : [];
  }

  function payloadFromDetailed(row) {
    const questions = Array.isArray(row.questions) ? row.questions : [];
    const essays = Array.isArray(row.essays) ? row.essays : [];
    const ended = Number(row.endedAt || row.date) || Date.now();
    const questionTotal = questions.length || Number(row.questionTotal) || configuredQuestionCount();
    return {
      eventId:`test-${row.id}`,
      installationId:installationId(),
      zman:analyticsZman,
      appVersion:appVersion(),
      clientTs:new Date(ended).toISOString(),
      startedAt:row.startedAt ? new Date(Number(row.startedAt)).toISOString() : null,
      endedAt:new Date(ended).toISOString(),
      reason:row.reason || (row.completed ? 'completed' : 'exited'),
      completed:!!row.completed,
      questionTotal,
      questionAnswered:questions.length ? questions.filter(q => q.answered).length : Math.max(0, questionTotal - (Number(row.unanswered) || 0)),
      correct:Number(row.correct) || 0,
      partial:Number(row.partial) || 0,
      incorrect:Number(row.incorrect) || 0,
      unanswered:Number(row.unanswered) || 0,
      scorePct:Number(row.scorePct) || 0,
      essayTotal:essays.length || Number(row.essayTotal) || 0,
      essayAnswered:essays.length ? essays.filter(e => Array.isArray(e.pairings) && e.pairings.length && e.pairings.every(p => p.selectedId)).length : Number(row.essayAnswered) || 0,
      essayPairCorrect:Number(row.essayPairCorrect) || 0,
      essayPairTotal:Number(row.essayPairTotal) || 0,
      essayScorePct:Number(row.essayScorePct) || 0,
      durationMs:Number(row.totalTimeMs) || 0,
      followUpQuestionCount:questions.filter(q => q.followUp).length,
      followUpEssayCount:essays.filter(e => e.flagged).length,
      followUpPairingCount:essays.reduce((sum,e) => sum + (Array.isArray(e.pairings) ? e.pairings.filter(p => p.flagged).length : 0), 0),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || null
    };
  }

  function payloadFromSummary(row) {
    const ended = Number(row.date) || Date.now();
    const questionTotal = Number(row.questionTotal) || configuredQuestionCount();
    const unanswered = Number(row.unanswered) || 0;
    return {
      eventId:`test-${row.id}`,
      installationId:installationId(),
      zman:analyticsZman,
      appVersion:appVersion(),
      clientTs:new Date(ended).toISOString(),
      startedAt:row.startedAt ? new Date(Number(row.startedAt)).toISOString() : null,
      endedAt:new Date(ended).toISOString(),
      reason:row.reason || (row.completed ? 'completed' : 'exited'),
      completed:!!row.completed,
      questionTotal,
      questionAnswered:Math.max(0, questionTotal - unanswered),
      correct:Number(row.correct) || 0,
      partial:Number(row.partial) || 0,
      incorrect:Number(row.incorrect) || 0,
      unanswered,
      scorePct:Number(row.scorePct) || 0,
      essayTotal:Number(row.essayTotal) || 0,
      essayAnswered:Number(row.essayAnswered) || 0,
      essayPairCorrect:Number(row.essayPairCorrect) || 0,
      essayPairTotal:Number(row.essayPairTotal) || 0,
      essayScorePct:Number(row.essayScorePct) || 0,
      durationMs:Number(row.totalTimeMs) || 0,
      followUpQuestionCount:Number(row.followUpQuestionCount) || 0,
      followUpEssayCount:Number(row.followUpEssayCount) || 0,
      followUpPairingCount:Number(row.followUpPairingCount) || 0,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || null
    };
  }

  async function retry() {
    if (!analyticsEnabled() || !navigator.onLine || !installationId()) return;
    const sent = new Set(parse(localStorage.getItem(SENT), []) || []);
    const detailed = new Map(detailedRows().map(row => [String(row.id), row]));
    const combined = new Map();
    for (const row of summaryRows()) if (row?.id != null) combined.set(String(row.id), { row, detailed:false });
    for (const [id,row] of detailed) combined.set(id, { row, detailed:true });

    for (const [id,entry] of combined) {
      if (sent.has(id)) continue;
      const payload = entry.detailed ? payloadFromDetailed(entry.row) : payloadFromSummary(entry.row);
      if (!payload.eventId || !payload.questionTotal) continue;
      try {
        const response = await fetch(ENDPOINT, {
          method:'POST',
          headers:{'Content-Type':'application/json','X-SCP-Analytics-Version':'1'},
          body:JSON.stringify(payload),
          keepalive:true
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sent.add(id);
        localStorage.setItem(SENT, JSON.stringify([...sent].slice(-100)));
      } catch (error) {
        console.warn('Practice-test analytics backfill deferred:', error);
        break;
      }
    }
  }

  window.addEventListener('online', () => void retry());
  window.setTimeout(() => void retry(), 800);
})();