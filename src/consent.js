import { testMode } from './tag-test-config.js';
import { createTestOnce } from './tag-test-once.js';
import { analytics } from './analytics-config.js';
import { advertising } from './ads-config.js';
import { installOutboundTracking } from './analytics.js';
import { createGA4 } from './ga4.js';
import { createGoogleTag, clearMeasurementStorage } from './google-tag.js';

export const consentKey = 'dwf.analytics-consent.v1';
export const advertisingConsentKey = 'dwf.advertising-consent.v1';
export const consentLifetime = 180 * 24 * 60 * 60 * 1000;
const keyFor = purpose => purpose === 'advertising' ? advertisingConsentKey : consentKey;
const vetoName = purpose => 'dwf_' + (purpose === 'advertising' ? 'advertising' : 'analytics') + '_denied';
const vetoed = (window, purpose) => window.document?.cookie.split(';').some(cookie => cookie.trim() === vetoName(purpose) + '=1') === true;
function saveVeto(window, purpose, denied) {
  try {
    if (window.document) window.document.cookie = `${vetoName(purpose)}=${denied ? '1' : ''}; Max-Age=${denied ? consentLifetime / 1000 : 0}; Path=/; SameSite=Lax; Secure`;
  } catch { /* The storage writability check still fails closed. */ }
}
export function privacySignal(window) {
  const nav = window.navigator;
  return nav.globalPrivacyControl === true || [nav.doNotTrack, window.doNotTrack, nav.msDoNotTrack]
    .some(value => value === '1' || value === 'yes');
}
export function readChoice(window, now = Date.now(), purpose = 'analytics') {
  try {
    if (vetoed(window, purpose)) return 'rejected';
    const key = keyFor(purpose), value = JSON.parse(window.localStorage.getItem(key));
    if (!['accepted', 'rejected'].includes(value?.choice) || !Number.isFinite(value.at) || value.at > now || now - value.at >= consentLifetime) {
      if (value !== null) window.localStorage.removeItem(key);
      return null;
    }
    // A readable but read-only store must not revive a stale accepted record
    // after withdrawal/reload. Rewriting identical bytes does not renew consent.
    if (value.choice === 'accepted') window.localStorage.setItem(key, JSON.stringify(value));
    return value.choice;
  } catch { return null; }
}
export function saveChoice(window, choice, purpose = 'analytics') {
  if (!['accepted', 'rejected'].includes(choice)) return false;
  try {
    window.localStorage.setItem(keyFor(purpose), JSON.stringify({ choice, at: Date.now() }));
    if (choice === 'accepted') { saveVeto(window, purpose, false); if (vetoed(window, purpose)) return false; }
    return true;
  }
  catch {
    // A minimal first-party refusal cookie survives a later storage recovery.
    // It is a preference only, never an identifier or a measurement permission.
    saveVeto(window, purpose, true);
    // Quota/read-only failures must not leave an earlier acceptance in place.
    try { window.localStorage.removeItem(keyFor(purpose)); } catch { /* readChoice also fails closed on read-only storage. */ }
    return false;
  }
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
  const mode = testMode(window.location);
  const config = mode ? { ...analytics, enabled: false, productionOrigin: mode.origin } : analytics;
  const ads = mode ? { ...advertising, enabled: true } : advertising;
  const allowedPages = mode ? [mode.path] : pages;
  const adsEnabled = ads.enabled === true;
  let blocked = privacySignal(window), stopped = false, removeClicks = () => {};
  const choice = purpose => readChoice(window, Date.now(), purpose);
  const selected = { analytics: choice('analytics'), advertising: choice('advertising') };
  const grants = () => ({
    analytics: config.enabled && !stopped && !privacySignal(window) && selected.analytics === 'accepted' && choice('analytics') === 'accepted',
    advertising: adsEnabled && !privacySignal(window) && selected.advertising === 'accepted' && choice('advertising') === 'accepted',
  });
  // The reviewed GA-only lifecycle remains unchanged while the Ads release gate is off.
  const provider = adsEnabled
    ? createGoogleTag({ window, document, config, advertising: ads, catalog, pages: allowedPages, consent: grants, restart })
    : createGA4({ window, document, config, catalog, pages, consentGranted: () => grants().analytics });
  const isProduction = window.location.origin === config.productionOrigin;

  let restarting = false;
  function restart(next) {
    if (restarting) return;
    restarting = true;
    removeClicks(); removeClicks = () => {};
    // Persist revocations detected on the click/load path, including expiry/GPC.
    for (const purpose of ['analytics', 'advertising']) if (!next[purpose]) {
      saveChoice(window, 'rejected', purpose); selected[purpose] = 'rejected';
    }
    // Let the native Amazon click finish first. A new document, not script removal,
    // unloads the initialized third-party SDK. Recheck/clean storage on that load.
    window.setTimeout(() => window.location.reload(), 0);
  }
  function reflect() {
    blocked = privacySignal(window);
    accept.disabled = blocked;
    if (analyticsInput) { analyticsInput.checked = config.enabled && selected.analytics === 'accepted' && !blocked; analyticsInput.disabled = blocked || Boolean(mode); }
    if (adsInput) { adsInput.checked = selected.advertising === 'accepted' && !blocked; adsInput.disabled = blocked; }
    status.textContent = blocked ? 'Optional measurement is off because your browser sends a privacy signal.'
      : adsEnabled ? `Analytics ${grants().analytics ? 'on' : 'off'}. Advertising measurement ${grants().advertising ? 'on' : 'off'}. You can change either choice at any time.`
      : selected.analytics === 'accepted' ? (stopped ? 'Analytics will use your new choice on your next page visit.' : 'Analytics accepted. You can reject it at any time.') : 'Analytics is off.';
    summary.textContent = status.textContent;
  }
  function apply() {
    removeClicks(); removeClicks = () => {};
    const allowed = grants();
    if (!isProduction || restarting) return;
    if (adsEnabled) {
      provider.update().catch(() => provider.stop());
    } else if (allowed.analytics) {
      provider.start().catch(() => provider.stop());
    } else provider.stop();
    if (!mode && !restarting && (allowed.analytics || allowed.advertising)) {
      removeClicks = installOutboundTracking({ document, location: window.location, catalog, pages, enabled: true, send: provider.send });
    }
  }
  function choose(next) {
    if (next === 'accepted' && privacySignal(window)) return;
    const previous = selected.analytics;
    const selection = { analytics: config.enabled && next === 'accepted' && (!adsEnabled || analyticsInput?.checked) ? 'accepted' : 'rejected', advertising: next === 'accepted' && adsInput?.checked ? 'accepted' : 'rejected' };
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
    clearMeasurementStorage(window, document, { advertising: true });
  }
  reflect();
  const controller = { reject: () => choose('rejected') };
  if (mode) controller.testAllowed = () => {
    const allowed = !restarting && grants().advertising;
    // The disabled button must not hide a lost grant from the running adapter.
    if (!allowed && !restarting) provider.update().catch(() => provider.stop());
    return allowed;
  };
  if (mode) controller.requestTest = createTestOnce({
    window,
    allowed: controller.testAllowed,
    prepare: () => provider.update(),
    // Same validated conversion adapter; synthetic control, never an Amazon visit.
    // Test identity is the unique preview page_location/page_title, not purchase data.
    send: () => provider.send({ event: 'outbound_amazon_click', model: catalog['casio-ae1200'].model, placement: 'comparison_final' }),
  });
  installed.set(document, controller);
  return controller;
}
