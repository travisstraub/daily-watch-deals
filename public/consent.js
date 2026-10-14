import { analytics } from './analytics-config.js';
import { advertising } from './ads-config.js';
import { installOutboundTracking } from './analytics.js';
import { createGA4 } from './ga4.js';
import { createGoogleTag, clearMeasurementCookies } from './google-tag.js';

export const consentKey = 'dwf.analytics-consent.v1';
export const advertisingConsentKey = 'dwf.advertising-consent.v1';
export const consentLifetime = 180 * 24 * 60 * 60 * 1000;
const keyFor = purpose => purpose === 'advertising' ? advertisingConsentKey : consentKey;
export function privacySignal(window) {
  const nav = window.navigator;
  return nav.globalPrivacyControl === true || [nav.doNotTrack, window.doNotTrack, nav.msDoNotTrack]
    .some(value => value === '1' || value === 'yes');
}
export function readChoice(window, now = Date.now(), purpose = 'analytics') {
  try {
    const key = keyFor(purpose), value = JSON.parse(window.localStorage.getItem(key));
    if (!['accepted', 'rejected'].includes(value?.choice) || !Number.isFinite(value.at) || value.at > now || now - value.at >= consentLifetime) {
      if (value !== null) window.localStorage.removeItem(key);
      return null;
    }
    return value.choice;
  } catch { return null; }
}
export function saveChoice(window, choice, purpose = 'analytics') {
  if (!['accepted', 'rejected'].includes(choice)) return false;
  try { window.localStorage.setItem(keyFor(purpose), JSON.stringify({ choice, at: Date.now() })); return true; }
  catch { return false; }
}

const installed = new WeakMap();
export function installConsent({ window, document, catalog, pages }) {
  if (installed.has(document)) return installed.get(document);
  const panel = document.querySelector('#analytics-consent');
  if (!panel) return;
  const accept = panel.querySelector('[data-consent="accepted"]');
  const reject = panel.querySelector('[data-consent="rejected"]');
  const status = document.querySelector('#analytics-status');
  const summary = document.querySelector('#analytics-summary');
  const settings = document.querySelector('#analytics-settings');
  const analyticsInput = panel.querySelector('[data-purpose="analytics"]');
  const adsInput = panel.querySelector('[data-purpose="advertising"]');
  const adsEnabled = advertising.enabled === true;
  let blocked = privacySignal(window), stopped = false, removeClicks = () => {};
  const choice = purpose => readChoice(window, Date.now(), purpose);
  const selected = { analytics: choice('analytics'), advertising: choice('advertising') };
  const grants = () => ({
    analytics: !stopped && !privacySignal(window) && selected.analytics === 'accepted' && choice('analytics') === 'accepted',
    advertising: adsEnabled && !privacySignal(window) && selected.advertising === 'accepted' && choice('advertising') === 'accepted',
  });
  // The reviewed GA-only lifecycle remains unchanged while the Ads release gate is off.
  const provider = adsEnabled
    ? createGoogleTag({ window, document, config: analytics, advertising, catalog, pages, consent: grants })
    : createGA4({ window, document, config: analytics, catalog, pages, consentGranted: () => grants().analytics });
  const isProduction = window.location.origin === analytics.productionOrigin;

  function reflect() {
    blocked = privacySignal(window);
    accept.disabled = blocked;
    if (analyticsInput) { analyticsInput.checked = selected.analytics === 'accepted' && !blocked; analyticsInput.disabled = blocked; }
    if (adsInput) { adsInput.checked = selected.advertising === 'accepted' && !blocked; adsInput.disabled = blocked; }
    status.textContent = blocked ? 'Optional measurement is off because your browser sends a privacy signal.'
      : adsEnabled ? `Analytics ${grants().analytics ? 'on' : 'off'}. Advertising measurement ${grants().advertising ? 'on' : 'off'}. You can change either choice at any time.`
      : selected.analytics === 'accepted' ? (stopped ? 'Analytics will use your new choice on your next page visit.' : 'Analytics accepted. You can reject it at any time.') : 'Analytics is off.';
    summary.textContent = status.textContent;
  }
  function apply() {
    removeClicks(); removeClicks = () => {};
    const allowed = grants();
    if (!isProduction) return;
    if (adsEnabled) {
      provider.update().catch(() => provider.stop());
    } else if (allowed.analytics) {
      provider.start().catch(() => provider.stop());
    } else provider.stop();
    if (allowed.analytics || allowed.advertising) {
      removeClicks = installOutboundTracking({ document, location: window.location, catalog, pages, enabled: true, send: provider.send });
    }
  }
  function choose(next) {
    if (next === 'accepted' && privacySignal(window)) return;
    const previous = selected.analytics;
    const selection = { analytics: next === 'accepted' && (!adsEnabled || analyticsInput?.checked) ? 'accepted' : 'rejected', advertising: next === 'accepted' && adsInput?.checked ? 'accepted' : 'rejected' };
    for (const purpose of adsEnabled ? ['analytics','advertising'] : ['analytics']) {
      selected[purpose] = saveChoice(window, selection[purpose], purpose) ? selection[purpose] : 'rejected';
    }
    if (!adsEnabled && next === 'rejected' && previous === 'accepted') stopped = true;
    apply(); panel.hidden = true; reflect(); settings.focus({ preventScroll: true });
  }
  function synchronize() {
    if (privacySignal(window)) {
      saveChoice(window, 'rejected');
      saveChoice(window, 'rejected', 'advertising');
    }
    if (!adsEnabled && selected.analytics === 'accepted' && choice('analytics') !== 'accepted') stopped = true;
    for (const purpose of ['analytics','advertising']) if (privacySignal(window) || choice(purpose) !== 'accepted') selected[purpose] = 'rejected';
    apply(); reflect();
  }
  accept.addEventListener('click', () => choose('accepted'));
  reject.addEventListener('click', () => choose('rejected'));
  settings.addEventListener('click', () => {
    synchronize(); panel.hidden = false; panel.scrollIntoView({ block: 'nearest' });
    (blocked ? reject : (analyticsInput || accept)).focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => {
    if ([consentKey, advertisingConsentKey, null].includes(event.key)) synchronize();
  });
  window.addEventListener('focus', synchronize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) synchronize(); });
  // Re-evaluate expiry/privacy signals even on long-lived pages, without network work.
  window.setInterval(synchronize, 60000);
  settings.hidden = false;
  panel.hidden = (choice('analytics') !== null && (!adsEnabled || choice('advertising') !== null)) || blocked;
  if (blocked) {
    saveChoice(window, 'rejected'); saveChoice(window, 'rejected', 'advertising');
    provider.stop();
  } else apply();
  if (!adsEnabled) {
    try { clearMeasurementCookies(document, window.location.hostname, { advertising: true }); } catch { /* Fail closed. */ }
  }
  reflect();
  const controller = { reject: () => choose('rejected') };
  installed.set(document, controller);
  return controller;
}
