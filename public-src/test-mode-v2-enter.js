(() => {
  'use strict';

  // The core app's global Enter shortcut calls submitCurrentAnswer() directly,
  // bypassing the Submit button click that the combined-test controller uses to
  // schedule auto-advance. Route only the unfocused/background Enter shortcut
  // through the visible Submit control. Intentional Enter activation of a
  // Tab-focused button/input/link remains native and untouched.
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!document.body.classList.contains('ui-test-active') || document.body.classList.contains('ui-test-essays')) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]')) return;
    const submit = document.getElementById('submitBtn');
    if (!submit || submit.disabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    submit.click();
  }, true);
})();
