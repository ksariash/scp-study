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

  function installTimerResetProxy() {
    const timer = el('timerCard');
    const reset = el('timerResetBtn');
    if (!timer || !reset) return;
    if (reset.parentElement === timer && timer.parentElement) timer.parentElement.insertBefore(reset, timer.nextSibling);
    reset.classList.add('ui-timer-reset-proxy');
    reset.setAttribute('aria-hidden', 'true');
    reset.tabIndex = -1;

    const activate = event => {
      if (document.body.classList.contains('ui-test-active') || document.body.classList.contains('essay-mode-active')) return;
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      if (event.type === 'keydown') event.preventDefault();
      reset.click();
    };
    timer.addEventListener('click', activate);
    timer.addEventListener('keydown', activate);
  }

  function syncTimerSemantics() {
    const timer = el('timerCard');
    if (!timer) return;
    const interactive = !document.body.classList.contains('ui-test-active') && !document.body.classList.contains('essay-mode-active');
    timer.classList.toggle('ui-timer-reset-target', interactive);
    if (interactive) {
      timer.tabIndex = 0;
      timer.setAttribute('role', 'button');
      timer.setAttribute('aria-label', 'Session timer. Activate to reset the study session timer.');
      timer.title = 'Reset session timer';
    } else {
      timer.tabIndex = -1;
      timer.removeAttribute('role');
      timer.setAttribute('aria-label', document.body.classList.contains('ui-test-active') ? 'Practice test time remaining' : 'Study session timer');
      timer.removeAttribute('title');
    }
  }

  function groupQuestionContext() {
    const picker = el('questionNumberPicker');
    const category = el('questionCategory');
    const filter = el('categoriesBtn');
    const row = picker?.parentElement;
    if (!row || !category || !filter) return;
    row.classList.add('question-context-controls');

    const legacyGroup = row.querySelector('.question-category-group');
    if (legacyGroup) {
      row.insertBefore(category, legacyGroup);
      row.insertBefore(filter, legacyGroup);
      legacyGroup.remove();
    }
    filter.querySelector('.question-filter-label')?.remove();
    row.insertBefore(filter, picker);
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

  function simplifySettingsSurface() {
    const settingsPanel = el('materialsPanelSettings');
    const redundantHead = settingsPanel?.querySelector('.settings-section > .materials-section-head');
    redundantHead?.classList.add('ui-settings-redundant-head');
    settingsPanel?.querySelector('.settings-section')?.classList.add('ui-settings-content');
  }

  function installMaterialsBehavior() {
    const materialsButton = el('materialsBtn');
    const settingsButton = el('settingsBtn');
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
    settingsButton?.addEventListener('click', () => setMaterialsSurface('settings'), true);

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
      dialog.addEventListener('close', () => {
        if (!settingsPanel.hidden) prepareMaterialsDestination();
        setMaterialsSurface('materials');
      });
    }

    rememberContentTab(storedContentTab());
    simplifySettingsSurface();
  }

  function installAboutLogo() {
    const logo = el('brandLogo');
    const dialog = el('appInfoDialog');
    if (!logo || !dialog) return;
    logo.removeAttribute('aria-hidden');
    logo.setAttribute('role', 'button');
    logo.setAttribute('tabindex', '0');
    logo.setAttribute('aria-label', 'About SCP Study');
    logo.title = 'About SCP Study';
    const open = event => {
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      if (event.type === 'keydown') event.preventDefault();
      window.setTimeout(() => {
        if (!dialog.open) dialog.showModal();
      }, 0);
    };
    logo.addEventListener('click', open);
    logo.addEventListener('keydown', open);
  }

  function refreshNavigationCopy() {
    const chaburaDescription = el('chaburaDialog')?.querySelector('.modal-head p');
    if (chaburaDescription) chaburaDescription.textContent = 'Select your region and chabura. You can change this later in Settings.';
    setMaterialsSurface(el('materialsPanelSettings')?.hidden === false ? 'settings' : 'materials');
  }

  function afterCoreInit() {
    refreshNavigationCopy();
    simplifySettingsSurface();
    syncTimerSemantics();
    const bodyObserver = new MutationObserver(syncTimerSemantics);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  installUtilityIcons();
  installTimerResetProxy();
  groupQuestionContext();
  installMaterialsBehavior();
  installAboutLogo();
  refreshNavigationCopy();
  window.setTimeout(afterCoreInit, 0);
})();