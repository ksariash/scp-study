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

  // Load the shared UI component layer before app.js so it can normalize the
  // shell without duplicating product behavior in markup-specific handlers.
  const uiStyles = document.createElement('link');
  uiStyles.rel = 'stylesheet';
  uiStyles.href = 'ui-system.css';
  document.head.append(uiStyles);

  document.write(
    files.map(file => '<script src="' + base + '/' + file + '"><\\/script>').join('') +
    '<script src="ui-system.js"><\\/script>'
  );
})();
