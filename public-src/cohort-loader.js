(() => {
  'use strict';
  const registry = window.SCP_ZMAN_REGISTRY || {};
  const zmanim = Array.isArray(registry.zmanim) ? registry.zmanim : (window.SCP_COHORT_REGISTRY?.cohorts || []);
  const selectionKey = 'scpStudy.activeZman.v1';
  const legacySelectionKey = 'scpStudy.activeCohort.v1';
  let selected = '';
  try { selected = localStorage.getItem(selectionKey) || localStorage.getItem(legacySelectionKey) || ''; } catch (_) {}
  let zman = zmanim.find(item => item.id === selected)
    || zmanim.find(item => Array.isArray(item.legacyIds) && item.legacyIds.includes(selected))
    || zmanim.find(item => item.id === registry.defaultZmanId)
    || zmanim[0]
    || null;
  if (!zman) throw new Error('No SCP Study Zman is configured.');
  try {
    localStorage.setItem(selectionKey, zman.id);
    localStorage.removeItem(legacySelectionKey);
  } catch (_) {}
  window.SCP_ACTIVE_ZMAN = zman;
  window.SCP_ACTIVE_COHORT = zman;
  const base = String(zman.path || ('cohorts/' + zman.id)).replace(/\/$/, '');
  const files = ['cohort.js','questions.js','chaburos.js','audio-reviews.js','glossary.js','essay-practice.js','course-notes.js'];

  // Shared shell/design normalization and the combined-test controller load
  // before app.js so their capture-phase entry contracts are established first.
  for (const href of ['ui-system.css', 'test-mode.css', 'test-mode-polish.css', 'chabura-ui.css']) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }

  document.write(
    files.map(file => '<script src="' + base + '/' + file + '"><\/script>').join('') +
    '<script src="ui-system.js"><\/script>' +
    '<script src="test-mode.js"><\/script>'
  );

  // test-mode-polish.js intentionally loads after app.js. It augments the core
  // test state rather than competing with the native start/submit handlers.
  window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'test-mode-polish.js';
    script.async = false;
    document.body.append(script);
  }, { once:true });
})();