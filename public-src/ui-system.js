(() => {
  'use strict';

  const MATERIALS_TAB_KEY = 'scpStudy.materialsTab.v1';
  const LAST_CONTENT_TAB_KEY = 'scpStudy.lastMaterialsContentTab.v1';
  const CONTENT_TABS = new Set(['audio', 'questions', 'essays', 'glossary', 'downloads']);
  const el = id => document.getElementById(id);

  function replaceUtilityIcon(button, svg, { label, title = label } = {}) {
    if (!button) return;
    button.innerHTML = svg;
    if (label) button.setAttribute('aria-label', label);
    if (title) button.title = title;
  }

  function installUtilityIcons() {
    replaceUtilityIcon(el('materialsBtn'), `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 5.8c3.1-1 5.3-.5 7.5 1.2v11.2c-2.2-1.7-4.4-2.2-7.5-1.2V5.8Z"/>
        <path d="M19.5 5.8c-3.1-1-5.3-.5-7.5 1.2v11.2c2.2-1.7 4.4-2.2 7.5-1.2V5.8Z"/>
        <path d="M12 7v11.2"/>
      </svg>`, { label: 'Course materials', title: 'Course materials' });

    replaceUtilityIcon(el('statsBtn'), `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19.5h16"/>
        <rect x="5" y="11" width="3.2" height="6" rx="1"/>
        <rect x="10.4" y="7" width="3.2" height="10" rx="1"/>
        <rect x="15.8" y="4" width="3.2" height="13" rx="1"/>
      </svg>`, { label: 'Progress and stats', title: 'Progress & stats' });

    replaceUtilityIcon(el('settingsBtn'), `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/>
        <circle cx="14" cy="6" r="2"/>
        <circle cx="8" cy="12" r="2"/>
        <circle cx="16" cy="18" r="2"/>
      </svg>`, { label: 'Settings', title: 'Settings' });
  }

  function separateSessionReset() {
    const timer = el('timerCard');
    const reset = el('timerResetBtn');
    const actions = timer?.parentElement;
    if (!timer || !reset || !actions || reset.parentElement !== timer) return;
    actions.insertBefore(reset, timer.nextSibling);
    reset.setAttribute('aria-label', 'Reset study session timer');
    reset.title = 'Reset session timer';
  }

  function groupQuestionContext() {
    const picker = el('questionNumberPicker');
    const category = el('questionCategory');
    const filter = el('categoriesBtn');
    const row = picker?.parentElement;
    if (!row || !category || !filter) return;
    row.classList.add('question-context-controls');
    if (!row.querySelector('.question-category-group')) {
      const group = document.createElement('span');
      group.className = 'question-category-group';
      row.insertBefore(group, category);
      group.append(category, filter);
    }
    if (!filter.querySelector('.question-filter-label')) {
      const label = document.createElement('span');
      label.className = 'question-filter-label';
      label.textContent = 'Filter';
      filter.append(label);
    }
    filter.setAttribute('aria-label', 'Filter study categories');
    filter.title = 'Filter study categories';
  }

  function storedContentTab() {
    try {
      const explicit = localStorage.getItem(LAST_CONTENT_TAB_KEY);
      if (CONTENT_TABS.has(explicit)) return explicit;
      const legacy = localStorage.getItem(MATERIALS_TAB_KEY);
      if (CONTENT_TABS.has(legacy)) return legacy;
    } catch (_) {}
    return 'audio';
  }

  function rememberContentTab(tab) {
    if (!CONTENT_TABS.has(tab)) return;
    try { localStorage.setItem(LAST_CONTENT_TAB_KEY, tab); } catch (_) {}
  }

  function prepareMaterialsDestination() {
    try { localStorage.setItem(MATERIALS_TAB_KEY, storedContentTab()); } catch (_) {}
  }

  function setMaterialsSurface(kind) {
    const dialog = el('materialsDialog');
    if (!dialog) return;
    const settings = kind === 'settings';
    dialog.classList.toggle('settings-entry-surface', settings);
    const heading = dialog.querySelector('.materials-modal-head h2');
    const description = dialog.querySelector('.materials-modal-head p');
    if (heading) heading.textContent = settings ? 'Settings' : 'Course materials';
    if (description) description.textContent = settings
      ? 'Display, Zman, reminders, privacy, storage, and study data.'
      : 'Audio, questions, essays, glossary, and downloads.';
  }

  function installMaterialsBehavior() {
    const materialsButton = el('materialsBtn');
    const tabs = el('materialsTabs');
    const dialog = el('materialsDialog');
    const settingsTab = el('materialsTabSettings');
    const settingsPanel = el('materialsPanelSettings');

    if (settingsTab) {
      settingsTab.classList.add('ui-settings-tab-hidden');
      settingsTab.setAttribute('aria-hidden', 'true');
      settingsTab.tabIndex = -1;
    }

    materialsButton?.addEventListener('click', () => {
      prepareMaterialsDestination();
      setMaterialsSurface('materials');
    }, true);

    tabs?.addEventListener('click', event => {
      const tab = event.target.closest?.('[data-materials-tab]')?.dataset.materialsTab;
      if (!CONTENT_TABS.has(tab)) return;
      rememberContentTab(tab);
      setMaterialsSurface('materials');
    }, true);

    if (dialog && settingsPanel) {
      const syncSurface = () => {
        if (!dialog.open) return;
        setMaterialsSurface(settingsPanel.hidden ? 'materials' : 'settings');
      };
      new MutationObserver(syncSurface).observe(dialog, {
        subtree: true,
        attributes: true,
        attributeFilter: ['open', 'hidden']
      });
      dialog.addEventListener('close', () => setMaterialsSurface('materials'));
    }

    rememberContentTab(storedContentTab());
  }

  installUtilityIcons();
  separateSessionReset();
  groupQuestionContext();
  installMaterialsBehavior();
})();
