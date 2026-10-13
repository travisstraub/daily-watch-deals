import { analytics } from './analytics-config.js';
import { installOutboundTracking } from './analytics.js';
import { createGA4 } from './ga4.js';

export const consentKey = 'dwf.analytics-consent.v1';
export const consentLifetime = 180 * 24 * 60 * 60 * 1000;
export function privacySignal(window) {
  const nav = window.navigator;
  return nav.globalPrivacyControl === true || [nav.doNotTrack, window.doNotTrack, nav.msDoNotTrack]
    .some(value => value === '1' || value === 'yes');
}
export function readChoice(window, now = Date.now()) {
  try {
    const value = JSON.parse(window.localStorage.getItem(consentKey));
    if (!['accepted', 'rejected'].includes(value?.choice) || !Number.isFinite(value.at) || value.at > now || now - value.at >= consentLifetime) {
      if (value !== null) window.localStorage.removeItem(consentKey);
      return null;
    }
    return value.choice;
  } catch { return null; }
}
export function saveChoice(window, choice) {
  try { window.localStorage.setItem(consentKey, JSON.stringify({ choice, at: Date.now() })); return true; }
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
  let choice = readChoice(window), blocked = privacySignal(window), stopped = false;
  let removeClicks = () => {};
  const consentGranted = () => choice === 'accepted' && !privacySignal(window) && !stopped;
  const provider = createGA4({ window, document, config: analytics, catalog, pages, consentGranted });
  const isProduction = window.location.origin === analytics.productionOrigin;

  function reflect() {
    accept.disabled = blocked;
    status.textContent = blocked ? 'Analytics is off because your browser sends a privacy signal.'
      : choice === 'accepted' ? (stopped ? 'Analytics will use your new choice on your next page visit.' : 'Analytics accepted. You can reject it at any time.')
      : 'Analytics is off.';
    summary.textContent = status.textContent;
  }
  function stop() {
    removeClicks(); removeClicks = () => {};
    provider.stop();
  }
  function activate() {
    if (!consentGranted() || !isProduction) return;
    removeClicks = installOutboundTracking({ document, location: window.location, catalog, pages, enabled: true, send: provider.send });
    provider.start().catch(() => stop());
  }
  function choose(next) {
    if (next === 'accepted' && privacySignal(window)) return;
    const previous = choice;
    choice = next;
    saveChoice(window, next);
    if (next === 'accepted') activate();
    else {
      stop();
      if (previous === 'accepted') stopped = true;
    }
    panel.hidden = true;
    reflect();
    settings.focus({ preventScroll: true });
  }
  function synchronize() {
    const newBlocked = privacySignal(window);
    if (newBlocked || readChoice(window) !== 'accepted') {
      if (choice === 'accepted') stopped = true;
      choice = newBlocked ? 'rejected' : readChoice(window);
      if (newBlocked) saveChoice(window, 'rejected');
      blocked = newBlocked;
      stop(); reflect();
    }
  }
  accept.addEventListener('click', () => choose('accepted'));
  reject.addEventListener('click', () => choose('rejected'));
  settings.addEventListener('click', () => {
    synchronize(); panel.hidden = false;
    panel.scrollIntoView({ block: 'nearest' });
    (blocked ? reject : accept).focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => { if (event.key === consentKey || event.key === null) synchronize(); });
  window.addEventListener('focus', synchronize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) synchronize(); });
  settings.hidden = false;
  panel.hidden = choice !== null || blocked;
  if (blocked) {
    if (choice === 'accepted') { choice = 'rejected'; saveChoice(window, choice); }
    stop();
  } else activate();
  reflect();
  const controller = { reject: () => choose('rejected') };
  installed.set(document, controller);
  return controller;
}
