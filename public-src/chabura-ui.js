(() => {
  'use strict';

  const el = id => document.getElementById(id);
  const activeZman = window.SCP_ZMAN_CONFIG || window.SCP_COHORT_CONFIG || window.SCP_ACTIVE_ZMAN || window.SCP_ACTIVE_COHORT || {};
  const zid = String(activeZman.id || 'default');
  const legacyIds = Array.isArray(activeZman.legacyIds) ? activeZman.legacyIds.map(String) : [];
  const PROFILE_BASE = 'scpStudy.chabura.v1';

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function canonicalLocations() {
    const questions = Array.isArray(window.SCP_CHABURA_DATA?.questions) ? window.SCP_CHABURA_DATA.questions : [];
    const row = questions.find(item => item?.id === 'location');
    return Array.isArray(row?.options) ? row.options.map(String) : [];
  }

  function ravMap() {
    const questions = Array.isArray(window.SCP_CHABURA_DATA?.questions) ? window.SCP_CHABURA_DATA.questions : [];
    const row = questions.find(item => item?.id === 'chabura');
    return row?.optionsByLocation && typeof row.optionsByLocation === 'object' ? row.optionsByLocation : {};
  }

  function validProfile(value) {
    if (!value || typeof value !== 'object') return null;
    const location = String(value.location || '').trim();
    const chabura = String(value.chabura || '').trim();
    if (!location || !chabura) return null;
    const locations = canonicalLocations();
    const ravs = Array.isArray(ravMap()?.[location]) ? ravMap()[location].map(String) : [];
    if (locations.length && !locations.includes(location)) return null;
    if (ravs.length && !ravs.includes(chabura) && chabura !== 'Not listed / unsure') return null;
    return { location, chabura };
  }

  function readProfile() {
    const candidates = [
      `${PROFILE_BASE}:${zid}`,
      ...legacyIds.map(id => `${PROFILE_BASE}:${id}`),
      PROFILE_BASE
    ];
    for (const key of candidates) {
      const profile = validProfile(readJson(key));
      if (profile) return profile;
    }
    return null;
  }

  function nativeOptions(select) {
    if (!select) return [];
    return [...select.options]
      .map(option => ({ value:String(option.value || ''), label:String(option.textContent || option.value || '').trim() }))
      .filter(option => option.value);
  }

  function ensureNativeOptions(select, location) {
    if (!select || nativeOptions(select).length) return;
    const values = Array.isArray(ravMap()?.[location]) ? [...ravMap()[location].map(String), 'Not listed / unsure'] : [];
    select.innerHTML = '<option value="">Choose a chabura…</option>' + values.map(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      return option.outerHTML;
    }).join('');
  }

  function installRavCombobox(select, { label = 'Search for your Rav' } = {}) {
    if (!select || select.dataset.uiRavCombobox === '1') return;
    select.dataset.uiRavCombobox = '1';
    select.classList.add('ui-rav-native-select');

    const wrap = document.createElement('div');
    wrap.className = 'ui-rav-combobox';
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'ui-rav-search';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'Type a Rav name…';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-label', label);

    const list = document.createElement('div');
    list.className = 'ui-rav-suggestions';
    list.hidden = true;
    list.setAttribute('role', 'listbox');
    list.id = `${select.id || 'rav'}-suggestions`;
    input.setAttribute('aria-controls', list.id);

    wrap.append(input, list);
    select.insertAdjacentElement('afterend', wrap);

    let activeIndex = -1;
    let filtered = [];

    function closeList() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }

    function choose(option, { focus = true } = {}) {
      if (!option) return;
      select.value = option.value;
      input.value = option.label;
      closeList();
      select.dispatchEvent(new Event('change', { bubbles:true }));
      if (focus) input.focus({ preventScroll:true });
    }

    function activate(index) {
      const buttons = [...list.querySelectorAll('.ui-rav-option')];
      if (!buttons.length) return;
      activeIndex = Math.min(Math.max(0, index), buttons.length - 1);
      buttons.forEach((button, i) => button.classList.toggle('active', i === activeIndex));
      const button = buttons[activeIndex];
      input.setAttribute('aria-activedescendant', button.id);
      button.scrollIntoView({ block:'nearest' });
    }

    function renderSuggestions(query = input.value) {
      const term = String(query || '').trim().toLocaleLowerCase();
      filtered = nativeOptions(select).filter(option => !term || option.label.toLocaleLowerCase().includes(term));
      list.innerHTML = '';
      activeIndex = -1;
      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'ui-rav-empty';
        empty.textContent = 'No matching Rav';
        list.append(empty);
      } else {
        filtered.forEach((option, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ui-rav-option';
          button.id = `${list.id}-option-${index}`;
          button.setAttribute('role', 'option');
          button.textContent = option.label;
          button.addEventListener('pointerdown', event => event.preventDefault());
          button.addEventListener('click', () => choose(option));
          list.append(button);
        });
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function syncFromNative() {
      const selected = nativeOptions(select).find(option => option.value === String(select.value || ''));
      if (document.activeElement !== input || !input.value.trim()) input.value = selected?.label || '';
      if (!list.hidden && document.activeElement === input) renderSuggestions(input.value);
    }

    input.addEventListener('focus', () => renderSuggestions(input.value));
    input.addEventListener('input', () => {
      const selected = nativeOptions(select).find(option => option.label === input.value);
      if (!selected || selected.value !== select.value) {
        select.value = '';
        if (select.id === 'chaburaDialogSelect' && el('saveChaburaDialogBtn')) el('saveChaburaDialogBtn').disabled = true;
      }
      renderSuggestions(input.value);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (list.hidden) renderSuggestions(input.value);
        activate(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) renderSuggestions(input.value);
        activate(activeIndex < 0 ? filtered.length - 1 : activeIndex - 1);
      } else if (event.key === 'Enter') {
        if (activeIndex >= 0 && filtered[activeIndex]) {
          event.preventDefault();
          choose(filtered[activeIndex]);
        } else {
          const exact = filtered.find(option => option.label.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase());
          if (exact) {
            event.preventDefault();
            choose(exact);
          }
        }
      } else if (event.key === 'Escape') {
        if (!list.hidden) {
          event.preventDefault();
          closeList();
        }
      }
    });
    input.addEventListener('blur', () => window.setTimeout(closeList, 120));
    select.addEventListener('change', syncFromNative);
    new MutationObserver(syncFromNative).observe(select, { childList:true, subtree:true, attributes:true, attributeFilter:['selected'] });
    syncFromNative();
  }

  function fillLocationIfNeeded(select) {
    if (!select || select.options.length > 1) return;
    const locations = canonicalLocations();
    if (!locations.length) return;
    select.innerHTML = '<option value="">Choose a location…</option>' + locations.map(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      return option.outerHTML;
    }).join('');
  }

  function prepareChaburaDialog() {
    const location = el('chaburaDialogLocation');
    const rav = el('chaburaDialogSelect');
    fillLocationIfNeeded(location);
    ensureNativeOptions(rav, location?.value || '');
    installRavCombobox(rav, { label:'Search for your SCP Rav' });
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
      <span>Chabura / Rav</span>
      <strong id="appInfoChabura">Not selected</strong>
      <small id="appInfoChaburaRegion"></small>
      <button class="app-info-chabura-action" id="appInfoChooseChabura" type="button">Choose chabura</button>`;
    grid.append(card);
    el('appInfoChooseChabura')?.addEventListener('click', () => {
      const about = el('appInfoDialog');
      const dialog = el('chaburaDialog');
      prepareChaburaDialog();
      if (about?.open) about.close();
      if (dialog && !dialog.open) dialog.showModal();
      window.setTimeout(() => {
        el('chaburaDialogLocation')?.focus({ preventScroll:true });
        void applySuggestedRegion();
      }, 0);
    });
    return card;
  }

  function hydrateAboutChabura() {
    ensureAboutChaburaCard();
    const profile = readProfile();
    const rav = el('appInfoChabura');
    const region = el('appInfoChaburaRegion');
    const action = el('appInfoChooseChabura');
    if (rav) rav.textContent = profile?.chabura || 'Not selected';
    if (region) region.textContent = profile?.location || 'Choose your SCP region and Rav';
    if (action) action.hidden = !!profile;
  }

  async function applySuggestedRegion() {
    if (readProfile()) return;
    const controls = [el('chaburaDialogLocation'), el('settingsChaburaLocation')].filter(Boolean);
    if (!controls.length || controls.every(select => select.value)) return;
    try {
      const response = await fetch('/api/client-location', { cache:'no-store', credentials:'same-origin' });
      if (!response.ok) return;
      const data = await response.json();
      const suggestion = String(data?.suggestedChaburaRegion || '');
      if (!suggestion) return;
      for (const select of controls) {
        fillLocationIfNeeded(select);
        if (select.value || ![...select.options].some(option => option.value === suggestion)) continue;
        select.value = suggestion;
        select.dispatchEvent(new Event('change', { bubbles:true }));
      }
    } catch (_) {}
  }

  function install() {
    prepareChaburaDialog();
    installRavCombobox(el('settingsChaburaSelect'), { label:'Search for your SCP Rav' });
    hydrateAboutChabura();

    const about = el('appInfoDialog');
    if (about) {
      new MutationObserver(() => {
        if (about.open) hydrateAboutChabura();
      }).observe(about, { attributes:true, attributeFilter:['open'] });
    }

    for (const id of ['settingsAboutBtn', 'brandLogo', 'saveChaburaDialogBtn', 'saveChaburaSettingsBtn']) {
      el(id)?.addEventListener('click', () => window.setTimeout(hydrateAboutChabura, 0));
    }
    window.addEventListener('storage', event => {
      if (String(event.key || '').startsWith(PROFILE_BASE)) hydrateAboutChabura();
    });

    void applySuggestedRegion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
