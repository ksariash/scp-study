(() => {
  'use strict';
  const registry = window.SCP_COHORT_REGISTRY || { cohorts: [] };
  const cohorts = Array.isArray(registry.cohorts) ? registry.cohorts : [];
  const selectionKey = 'scpStudy.activeCohort.v1';
  let selected = '';
  try { selected = localStorage.getItem(selectionKey) || ''; } catch (_) {}
  let cohort = cohorts.find(item => item.id === selected)
    || cohorts.find(item => item.id === registry.defaultCohortId)
    || cohorts[0]
    || null;
  if (!cohort) throw new Error('No SCP Study cohort is configured.');
  try { localStorage.setItem(selectionKey, cohort.id); } catch (_) {}
  window.SCP_ACTIVE_COHORT = cohort;
  const base = String(cohort.path || ('cohorts/' + cohort.id)).replace(/\/$/, '');
  const files = ['cohort.js','questions.js','chaburos.js','audio-reviews.js','glossary.js','essay-practice.js','course-notes.js'];
  document.write(files.map(file => '<script src="' + base + '/' + file + '"><\/script>').join(''));
})();
