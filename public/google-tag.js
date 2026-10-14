import { campaignDimensions, outboundEvent } from './analytics.js';
import { pageContext, deniedConsent } from './ga4.js';
export { pageContext, deniedConsent } from './ga4.js';

export function clearMeasurementStorage(window, document, purposes = { analytics: true, advertising: true }) {
  // Only storage owned by these configured tags. Never clear unrelated site storage.
  // Cookies and local storage are independent: one being blocked must not skip the other.
  try {
    const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0])
      .filter(name => (purposes.analytics && /^_ga(?:_|$)/.test(name)) || (purposes.advertising && /^_g(?:cl|ac)_/.test(name)));
    for (const name of names) for (const domain of ['', window.location.hostname, '.' + window.location.hostname]) {
      try { document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`; } catch { /* Continue other deletions. */ }
    }
  } catch { /* Cookie restrictions must not skip local storage. */ }
  if (purposes.advertising) {
    try { window.localStorage.removeItem('_gcl_ls'); } catch { /* Storage may be blocked. */ }
  }
}

export function adClickQuery(search) {
  const input = new URLSearchParams(search), output = new URLSearchParams();
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const values = input.getAll(key);
    if (values.length === 1 && /^[A-Za-z0-9_-]{10,256}$/.test(values[0])) output.set(key, values[0]);
  }
  return output.toString();
}

// Supported top-level Google tag. Once requested, changing purposes requires a
// full document reload: removing a script cannot unload its executed SDK.
export function createGoogleTag({ window, document, config, advertising, catalog, pages, consent, restart }) {
  let session, ended = false;
  const context = () => pageContext({ location: window.location, page: document.body.dataset.page, pages, config });
  const grants = () => {
    const choice = consent();
    return {
      analytics: choice.analytics === true && config.enabled === true && /^G-[A-Z0-9]+$/.test(config.measurementId),
      advertising: choice.advertising === true && advertising.enabled === true && /^AW-\d+$/.test(advertising.conversionId) && /^[A-Za-z0-9_-]+$/.test(advertising.conversionLabel),
    };
  };
  const same = (a, b) => a.analytics === b.analytics && a.advertising === b.advertising;
  function command(...args) {
    function gtag() { window.dataLayer.push(arguments); }
    gtag(...args);
  }
  function shutdown(next, reason) {
    const s = session;
    if (!s || ended) return;
    ended = true; s.pending = []; s.ready = false;
    window.clearTimeout(s.timer);
    window['ga-disable-' + config.measurementId] = true;
    // Update consent before navigation, as Google documents. The loaded SDK may
    // send a cookieless consent-status ping; do not promise zero withdrawal traffic.
    try { command('consent', 'update', { ...deniedConsent }); } catch { /* Reload still required. */ }
    s.script?.remove(); // Resource cleanup only; this is NOT an SDK kill switch.
    clearMeasurementStorage(window, document, { analytics: !next.analytics, advertising: !next.advertising });
    s.resolve(false);
    restart(next, reason);
  }
  function current() {
    if (!session || ended) return false;
    const next = grants();
    if (!context() || !same(session.grants, next)) {
      shutdown(context() ? next : { analytics: false, advertising: false }, 'consent-change');
      return false;
    }
    return true;
  }
  function update() {
    const next = grants();
    if (session) { current(); return session.promise; }
    clearMeasurementStorage(window, document, { analytics: !next.analytics, advertising: !next.advertising });
    if (ended || !context() || (!next.analytics && !next.advertising)) return Promise.resolve(false);
    // The SDK can read location itself. Remove arbitrary URL text before loading,
    // retaining only reviewed campaign values and separately consented click IDs.
    const query = new URLSearchParams(campaignDimensions(window.location.search));
    if (next.advertising) for (const [key, value] of new URLSearchParams(adClickQuery(window.location.search))) query.set(key, value);
    const safeURL = context().page_location + (query.size ? '?' + query : '');
    try { window.history.replaceState(window.history.state, '', safeURL); }
    catch { return Promise.resolve(false); } // No unsanitized SDK fallback.
    const safe = context();
    const s = { grants: next, pending: [], ready: false };
    session = s;
    s.promise = new Promise(resolve => { s.resolve = resolve; });
    window.dataLayer = [];
    window['ga-disable-' + config.measurementId] = !next.analytics;
    command('consent', 'default', { ...deniedConsent });
    command('set', { ...safe, send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, ads_data_redaction: true, url_passthrough: false });
    command('consent', 'update', { ...deniedConsent,
      analytics_storage: next.analytics ? 'granted' : 'denied',
      ad_storage: next.advertising ? 'granted' : 'denied',
      ad_user_data: next.advertising ? 'granted' : 'denied' });
    command('js', new Date());
    if (next.analytics) command('config', config.measurementId, {
      ...safe, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_domain: 'none', cookie_path: '/', cookie_expires: 2592000, cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure' });
    if (next.advertising) command('config', advertising.conversionId, {
      ...safe, send_page_view: false, allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false, cookie_domain: 'none', cookie_path: '/' });
    const script = document.createElement('script'); s.script = script;
    script.async = true; script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + (next.analytics ? config.measurementId : advertising.conversionId);
    const fail = () => shutdown({ analytics: false, advertising: false }, 'provider-failure');
    script.onerror = fail;
    script.onload = () => {
      if (!current() || s.ready) return;
      window.clearTimeout(s.timer); s.ready = true;
      if (next.analytics) command('event', 'page_view', { send_to: config.measurementId, ...safe, page: document.body.dataset.page });
      for (const event of s.pending) transmit(event);
      s.pending = []; s.resolve(true);
    };
    s.timer = window.setTimeout(fail, 8000);
    document.head.append(script);
    return s.promise;
  }
  function validate(event) {
    if (event?.event !== 'outbound_amazon_click') return null;
    const entry = Object.entries(catalog).find(([, watch]) => watch.model === event.model);
    if (!entry) return null;
    const [slug, watch] = entry;
    return outboundEvent({ dataset: { amazonModel: slug, placement: event.placement }, href: watch.destination }, {
      catalog, pages, page: document.body.dataset.page, search: window.location.search });
  }
  function transmit(event) {
    if (!current() || !session.ready) return;
    const { event: name, ...dimensions } = event;
    if (session.grants.analytics) command('event', name, { send_to: config.measurementId, ...context(), ...dimensions });
    if (session.grants.advertising) command('event', 'conversion', {
      send_to: advertising.conversionId + '/' + advertising.conversionLabel,
      ...context(), // No value, currency, transaction ID, user data or callback.
    });
  }
  function send(event) {
    // Lost/expired consent triggers shutdown, not just suppression of this click.
    if (!current()) return;
    const safe = validate(event);
    if (!safe) return;
    if (session.ready) transmit(safe);
    else if (session.pending.length < 20) session.pending.push(safe);
  }
  function stop() {
    shutdown({ analytics: false, advertising: false }, 'stop');
    clearMeasurementStorage(window, document);
  }
  return { update, send, stop };
}
