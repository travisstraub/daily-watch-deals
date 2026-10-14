import { installConsent } from './consent.js';
import { catalog, pages } from './tracking-catalog.js';
import { testMode } from './tag-test-config.js';
import { readTestLedger } from './tag-test-once.js';
const status = document.querySelector('#test-result');
const button = document.querySelector('#send-test');
const ledger = document.querySelector('#test-ledger');
const mode = testMode(window.location);
if (!mode) {
  status.textContent = 'Test mode is unavailable at this URL. No Google tag was started.';
} else {
  try {
    // This synthetic run must not inherit campaign/ad-click/debug identifiers.
    window.history.replaceState(window.history.state, '', mode.origin + mode.path);
    const controller = installConsent({ window, document, catalog, pages });
    let pending = false;
    const refresh = () => {
      const record = readTestLedger(window);
      ledger.textContent = record || 'NOT SENT — no event request reserved in this browser.';
      button.disabled = pending || Boolean(record) || !controller.testAllowed();
    };
    status.textContent = 'No event requested. Connect Tag Assistant, then opt in to Advertising measurement.';
    refresh(); window.addEventListener('storage', refresh);
    window.setInterval(refresh, 500);
    button.addEventListener('click', async event => {
      if (!event.isTrusted || button.disabled) return;
      pending = true; button.disabled = true;
      status.textContent = 'Checking consent and the one-event guard…';
      const result = await controller.requestTest();
      const messages = {
        'consent-required': 'Nothing sent. Select Advertising measurement and save your choice first.',
        'provider-unavailable': 'Nothing submitted by the test control. Tag readiness could not be established. Do not retry without reviewing the ledger.',
        'requested-delivery-unverified': 'One test event was requested. Receipt is unverified. Inspect Tag Assistant and update the shared ledger; do not repeat.',
      };
      status.textContent = messages[result] || 'No additional event requested: ' + result + '. Review the ledger before proceeding.';
      pending = false; refresh();
    });
  } catch {
    status.textContent = 'Test setup is unavailable. No test event was requested.';
    button.disabled = true;
  }
}
