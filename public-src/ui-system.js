(() => {
  'use strict';

  const MATERIALS_TAB_KEY = 'scpStudy.materialsTab.v1';
  const LAST_CONTENT_TAB_KEY = 'scpStudy.lastMaterialsContentTab.v1';
  const CHABURA_SETTINGS_KEY = 'scpStudy.chabura.v1';
  const CONTENT_TABS = new Set(['audio', 'questions', 'essays', 'glossary', 'downloads']);
  const el = id => document.getElementById(id);
  let networkRegionPromise = null;

  function activeZmanConfig() {
    return window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  }

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

  function chaburaData() {
    const questions = Array.isArray(window.SCP_CHABURA_DATA?.questions) ? window.SCP_CHABURA_DATA.questions : [];
    const locationQuestion = questions.find(item => item.id === 'location') || {};
    const chaburaQuestion = questions.find(item => item.id === 'chabura') || {};
    return {
      locations: Array.isArray(locationQuestion.options) ? locationQuestion.options.map(String) : [],
      byLocation: chaburaQuestion.optionsByLocation && typeof chaburaQuestion.optionsByLocation === 'object' ? chaburaQuestion.optionsByLocation : {}
    };
  }

  function loadUiChaburaProfile() {
    const active = activeZmanConfig();
    const ids = [active.id, ...(Array.isArray(active.legacyIds) ? active.legacyIds : [])].map(String).filter(Boolean);
    const data = chaburaData();
    try {
      for (const id of ids) {
        const raw = localStorage.getItem(`${CHABURA_SETTINGS_KEY}:${id}`);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const location = String(parsed?.location || '').trim();
        const chabura = String(parsed?.chabura || '').trim();
        const validRavs = Array.isArray(data.byLocation?.[location]) ? data.byLocation[location].map(String) : [];
        if (data.locations.includes(location) && (validRavs.includes(chabura) || chabura === 'Not listed / unsure')) return { location, chabura };
      }
    } catch (_) {}
    return null;
  }

  function ensureAboutChaburaCard() {
    const grid = el('appInfoDialog')?.querySelector('.app-info-meta-grid');
    if (!grid) return null;
    let card = el('appInfoChaburaCard');
    if (card) return card;
    card = document.createElement('div');
    card.id = 'appInfoChaburaCard';
    card.className = 'app-info-meta app-info-chabura';
    card.innerHTML = `
      <span>Chabura</span>
      <strong id="appInfoChabura">Not selected</strong>
      <small id="appInfoChaburaRegion"></small>
      <button type="button" class="app-info-chabura-action" id="appInfoChooseChabura">Choose chabura</button>`;
    grid.append(card);
    el('appInfoChooseChabura')?.addEventListener('click', () => void openChaburaChooser());
    return card;
  }

  function syncAboutChabura() {
    ensureAboutChaburaCard();
    const profile = loadUiChaburaProfile();
    const rav = el('appInfoChabura');
    const region = el('appInfoChaburaRegion');
    const choose = el('appInfoChooseChabura');
    if (rav) rav.textContent = profile?.chabura || 'Not selected';
    if (region) region.textContent = profile?.location || 'Choose your SCP chabura to personalize this device.';
    if (choose) choose.hidden = !!profile;
  }

  function syncAboutMetadata() {
    const active = activeZmanConfig();
    const zmanLabel = String(active.name || active.analyticsKey || active.id || '').trim();
    if (zmanLabel && el('appInfoZman')) el('appInfoZman').textContent = zmanLabel;

    // app.js owns the release number. Mirror its already-rendered value here so
    // the shell never needs a second hard-coded version constant.
    const settingsVersion = String(el('settingsAboutVersion')?.textContent || '').match(/\b(\d+)\b/);
    const footerVersion = String(el('appVersionFooter')?.textContent || '').match(/\bv(\d+)\b/i);
    const version = settingsVersion?.[1] || footerVersion?.[1] || '';
    if (version && el('appInfoVersion')) el('appInfoVersion').textContent = `v${version}`;
    syncAboutChabura();
  }

  function fillLocationSelectIfNeeded(select) {
    if (!select) return;
    const data = chaburaData();
    const values = [...select.options].map(option => option.value).filter(Boolean);
    if (data.locations.every(location => values.includes(location))) return;
    const selected = select.value;
    select.innerHTML = '<option value="">Choose a location…</option>';
    data.locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      select.append(option);
    });
    if (data.locations.includes(selected)) select.value = selected;
  }

  async function suggestedNetworkRegion() {
    if (!networkRegionPromise) {
      networkRegionPromise = fetch('/api/client-location', { cache:'no-store', credentials:'same-origin' })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          const value = String(data?.suggestedChaburaRegion || '');
          return chaburaData().locations.includes(value) ? value : '';
        })
        .catch(() => '');
    }
    return networkRegionPromise;
  }

  async function applyNetworkRegionSuggestion() {
    if (loadUiChaburaProfile()) return;
    const suggested = await suggestedNetworkRegion();
    if (!suggested || loadUiChaburaProfile()) return;
    for (const select of [el('settingsChaburaLocation'), el('chaburaDialogLocation')]) {
      fillLocationSelectIfNeeded(select);
      if (!select || select.value) continue;
      select.value = suggested;
      select.dispatchEvent(new Event('change', { bubbles:true }));
      select.dataset.networkSuggested = 'true';
    }
  }

  async function openChaburaChooser() {
    const dialog = el('chaburaDialog');
    const location = el('chaburaDialogLocation');
    const rav = el('chaburaDialogSelect');
    if (!dialog || !location || !rav) return;
    fillLocationSelectIfNeeded(location);
    const profile = loadUiChaburaProfile();
    const about = el('appInfoDialog');
    if (about?.open) about.close();

    if (profile) {
      location.value = profile.location;
      location.dispatchEvent(new Event('change', { bubbles:true }));
      window.setTimeout(() => {
        rav.value = profile.chabura;
        rav.dispatchEvent(new Event('change', { bubbles:true }));
      }, 0);
    } else if (!location.value) {
      const suggested = await suggestedNetworkRegion();
      if (suggested && !location.value) {
        location.value = suggested;
        location.dispatchEvent(new Event('change', { bubbles:true }));
      }
    }

    if (!dialog.open) dialog.showModal();
  }

  function installSearchableRavSelect(selectId, locationId, label) {
    const select = el(selectId);
    const location = el(locationId);
    if (!select || select.dataset.searchableRav === 'true') return;
    select.dataset.searchableRav = 'true';
    select.classList.add('ui-rav-native-select');

    const wrapper = document.createElement('div');
    wrapper.className = 'ui-rav-combobox';
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'ui-rav-search';
    input.id = `${selectId}Search`;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'Type to find a Rav…';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-label', label);

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'ui-rav-clear';
    clearButton.hidden = true;
    clearButton.setAttribute('aria-label', 'Clear Rav search');
    clearButton.title = 'Clear search';
    clearButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    const searchIcon = document.createElement('span');
    searchIcon.className = 'ui-rav-search-icon';
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';

    const list = document.createElement('div');
    list.className = 'ui-rav-suggestions';
    list.id = `${selectId}Suggestions`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    input.setAttribute('aria-controls', list.id);
    wrapper.append(input, clearButton, searchIcon, list);
    select.insertAdjacentElement('afterend', wrapper);

    let visible = [];
    let activeIndex = -1;
    const syncClearButton = () => {
      clearButton.hidden = !input.value.trim();
    };

    const values = () => [...select.options].map(option => option.value).filter(Boolean);
    const close = () => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
    };
    const choose = value => {
      if (!values().includes(value)) return;
      select.value = value;
      input.value = value;
      syncClearButton();
      select.dispatchEvent(new Event('change', { bubbles:true }));
      close();
    };
    const refreshActive = () => {
      [...list.querySelectorAll('.ui-rav-option')].forEach((button, index) => button.classList.toggle('active', index === activeIndex));
      const active = list.querySelectorAll('.ui-rav-option')[activeIndex];
      if (active) {
        input.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block:'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };
    const render = () => {
      const query = input.value.trim().toLocaleLowerCase();
      visible = values().filter(value => !query || value.toLocaleLowerCase().includes(query));
      list.innerHTML = '';
      if (!visible.length) {
        const empty = document.createElement('div');
        empty.className = 'ui-rav-empty';
        empty.textContent = 'No matching Rav. Try another spelling.';
        list.append(empty);
      } else {
        visible.forEach((value, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ui-rav-option';
          button.id = `${selectId}Option${index}`;
          button.setAttribute('role', 'option');
          button.textContent = value;
          button.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse') event.preventDefault();
          });
          button.addEventListener('click', () => choose(value));
          list.append(button);
        });
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      activeIndex = -1;
      refreshActive();
    };
    const syncFromSelect = ({ preserveQuery = false } = {}) => {
      const selected = String(select.value || '');
      if (selected) input.value = selected;
      else if (!preserveQuery) input.value = '';
      syncClearButton();
    };

    clearButton.addEventListener('pointerdown', event => event.preventDefault());
    clearButton.addEventListener('click', () => {
      input.value = '';
      if (select.value) {
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles:true }));
      }
      syncClearButton();
      input.focus({ preventScroll:true });
      render();
    });

    input.addEventListener('focus', render);
    input.addEventListener('input', () => {
      syncClearButton();
      const currentValues = values();
      const exact = currentValues.find(value => value.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase());
      if (exact) {
        if (select.value !== exact) {
          select.value = exact;
          select.dispatchEvent(new Event('change', { bubbles:true }));
        }
      } else if (select.value) {
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles:true }));
      }
      render();
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) render();
        if (!visible.length) return;
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        activeIndex = (activeIndex + delta + visible.length) % visible.length;
        refreshActive();
        return;
      }
      if (event.key === 'Enter') {
        if (!list.hidden && visible.length) {
          event.preventDefault();
          const value = visible[Math.max(0, activeIndex)];
          if (value) choose(value);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });
    input.addEventListener('blur', () => window.setTimeout(close, 120));
    select.addEventListener('change', () => syncFromSelect());
    location?.addEventListener('change', () => window.setTimeout(() => {
      syncFromSelect();
      if (document.activeElement === input) render();
    }, 0));
    new MutationObserver(() => window.setTimeout(() => syncFromSelect({ preserveQuery: document.activeElement === input }), 0))
      .observe(select, { childList:true, subtree:true });

    syncFromSelect();
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
        syncAboutMetadata();

        // Reuse app.js's canonical About opener when available. That keeps the
        // logo and Settings entry points on one hydration path instead of
        // directly showing a shared dialog with stale/default metadata.
        const canonicalButton = el('settingsAboutBtn');
        if (canonicalButton) {
          canonicalButton.click();
          if (dialog.open) return;
        }
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

  function installChaburaUi() {
    installSearchableRavSelect('settingsChaburaSelect', 'settingsChaburaLocation', 'Find your Rav');
    installSearchableRavSelect('chaburaDialogSelect', 'chaburaDialogLocation', 'Find your Rav');
    ensureAboutChaburaCard();
    syncAboutChabura();
    void applyNetworkRegionSuggestion();

    el('saveChaburaSettingsBtn')?.addEventListener('click', () => window.setTimeout(syncAboutMetadata, 0));
    el('saveChaburaDialogBtn')?.addEventListener('click', () => window.setTimeout(syncAboutMetadata, 0));
    el('chaburaDialog')?.addEventListener('close', () => window.setTimeout(syncAboutMetadata, 0));
    el('settingsAboutBtn')?.addEventListener('click', syncAboutMetadata, true);

    const infoDialog = el('appInfoDialog');
    if (infoDialog) {
      new MutationObserver(() => {
        if (infoDialog.open) syncAboutMetadata();
      }).observe(infoDialog, { attributes:true, attributeFilter:['open'] });
    }
  }

  function afterCoreInit() {
    refreshNavigationCopy();
    simplifySettingsSurface();
    installChaburaUi();
    syncAboutMetadata();
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