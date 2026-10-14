import { outboundEvent } from './analytics.js';
import { pageContext, deniedConsent } from './ga4.js';
export { pageContext, deniedConsent } from './ga4.js';

export function clearMeasurementCookies(document, hostname, purposes = { analytics: true, advertising: true }) {
  // The adapter uses host-only, root-path GA cookies. Also remove legacy domain cookies.
  const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0])
    .filter(name => (purposes.analytics && /^_ga(?:_|$)/.test(name)) || (purposes.advertising && /^_g(?:cl|ac)_/.test(name)));
  const domains = ['', hostname, '.' + hostname];
  for (const name of names) for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
  }
}

// Only Ads opt-in permits the tag to see these pseudonymous ad-click identifiers.
// Never forward an entire query, fragment, arbitrary parameter or referrer.
export function adClickQuery(search) {
  const input = new URLSearchParams(search), output = new URLSearchParams();
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const values = input.getAll(key);
    if (values.length === 1 && /^[A-Za-z0-9_-]{10,256}$/.test(values[0])) output.set(key, values[0]);
  }
  return output.toString();
}

// The Google SDK runs in a removable, same-origin browsing context. Removing a
// script alone cannot unload it. Destroying the frame stops its timers/listeners
// on withdrawal without sending denied-consent pings. This is lifecycle isolation,
// not a security boundary from the trusted Google script. No tag runs in the parent.
export function createGoogleTag({ window, document, config, advertising, catalog, pages, consent }) {
  let session, failed = false, viewed = false;
  const context = () => pageContext({ location: window.location, page: document.body.dataset.page, pages, config });
  const grants = () => {
    const choice = consent();
    return {
      analytics: choice.analytics === true && config.enabled === true && /^G-[A-Z0-9]+$/.test(config.measurementId),
      advertising: choice.advertising === true && advertising.enabled === true && /^AW-\d+$/.test(advertising.conversionId) && /^[A-Za-z0-9_-]+$/.test(advertising.conversionLabel),
    };
  };
  const same = (a, b) => a.analytics === b.analytics && a.advertising === b.advertising;
  const current = s => session === s && !s.closed && context() && same(s.grants, grants());
  function destroy() {
    const s = session; session = undefined;
    if (!s) return;
    s.closed = true; s.pending = [];
    window.clearTimeout(s.timer);
    try {
      // Disable GA before tearing down. Ads is stopped by destroying its context.
      s.frame.contentWindow['ga-disable-' + config.measurementId] = true;
      s.frame.contentWindow.dataLayer = [];
    } catch { /* Already detached. */ }
    s.frame.remove();
    s.resolve(false);
  }
  function clear(purposes) {
    try { clearMeasurementCookies(document, window.location.hostname, purposes); }
    catch { /* Storage restrictions never re-enable measurement. */ }
  }
  function update() {
    const next = grants();
    if (!context()) { destroy(); return Promise.resolve(false); }
    if (session && same(session.grants, next)) return session.promise;
    destroy();
    clear({ analytics: !next.analytics, advertising: !next.advertising });
    if (failed || (!next.analytics && !next.advertising)) return Promise.resolve(false);
    const s = { grants: next, pending: [], ready: false, closed: false };
    session = s;
    s.promise = new Promise(resolve => { s.resolve = resolve; });
    const fail = () => {
      if (session !== s) return;
      failed = true; destroy(); clear(next);
    };
    const frame = document.createElement('iframe');
    s.frame = frame;
    frame.hidden = true; frame.title = 'Optional measurement';
    frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
    frame.referrerPolicy = 'no-referrer';
    const clickQuery = next.advertising ? adClickQuery(window.location.search) : '';
    frame.src = config.productionOrigin + '/measurement-frame.html' + (clickQuery ? '?' + clickQuery : '');
    frame.onload = () => {
      if (!current(s)) { if (session === s) destroy(); return; }
      // A frame can receive another load notification; initialize only once.
      if (s.initialized) return;
      s.initialized = true;
      try {
        const runtime = frame.contentWindow, doc = frame.contentDocument;
        const safe = context();
        runtime.dataLayer = [];
        s.command = (...args) => {
          if (!current(s)) return;
          function gtag() { runtime.dataLayer.push(arguments); }
          gtag(...args);
        };
        s.command('consent', 'default', { ...deniedConsent });
        s.command('set', {
          ...safe, send_page_view: false, allow_google_signals: false,
          allow_ad_personalization_signals: false, ads_data_redaction: true,
          url_passthrough: false,
        });
        s.command('consent', 'update', {
          ...deniedConsent,
          analytics_storage: next.analytics ? 'granted' : 'denied',
          ad_storage: next.advertising ? 'granted' : 'denied',
          ad_user_data: next.advertising ? 'granted' : 'denied',
        });
        s.command('js', new Date());
        if (next.analytics) s.command('config', config.measurementId, {
          ...safe, send_page_view: false, allow_google_signals: false,
          allow_ad_personalization_signals: false, cookie_domain: 'none',
          cookie_path: '/', cookie_expires: 2592000, cookie_update: false,
          cookie_flags: 'SameSite=Lax;Secure',
        });
        if (next.advertising) s.command('config', advertising.conversionId, {
          ...safe, send_page_view: false, allow_ad_personalization_signals: false,
          allow_enhanced_conversions: false, cookie_domain: 'none', cookie_path: '/',
        });
        const script = doc.createElement('script');
        script.async = true; script.referrerPolicy = 'no-referrer';
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + (next.analytics ? config.measurementId : advertising.conversionId);
        script.onerror = fail;
        script.onload = () => {
          if (!current(s)) { if (session === s) destroy(); return; }
          window.clearTimeout(s.timer); s.ready = true;
          if (next.analytics && !viewed) {
            viewed = true;
            s.command('event', 'page_view', { send_to: config.measurementId, ...safe, page: document.body.dataset.page });
          }
          for (const event of s.pending) transmit(s, event);
          s.pending = []; s.resolve(true);
        };
        doc.head.append(script);
      } catch { fail(); }
    };
    frame.onerror = fail;
    s.timer = window.setTimeout(fail, 8000);
    document.body.append(frame);
    return s.promise;
  }
  function validate(event) {
    if (event?.event !== 'outbound_amazon_click') return null;
    const entry = Object.entries(catalog).find(([, watch]) => watch.model === event.model);
    if (!entry) return null;
    const [slug, watch] = entry;
    return outboundEvent({ dataset: { amazonModel: slug, placement: event.placement }, href: watch.destination }, {
      catalog, pages, page: document.body.dataset.page, search: window.location.search,
    });
  }
  function transmit(s, event) {
    if (!current(s) || !s.ready) return;
    const { event: name, ...dimensions } = event;
    if (s.grants.analytics) s.command('event', name, { send_to: config.measurementId, ...context(), ...dimensions });
    if (s.grants.advertising) s.command('event', 'conversion', {
      send_to: advertising.conversionId + '/' + advertising.conversionLabel,
      ...context(), // No value, currency, transaction ID, user data or custom URL.
    });
  }
  function send(event) {
    const s = session;
    if (!s || !current(s)) return;
    const safe = validate(event);
    if (!safe) return;
    if (s.ready) transmit(s, safe);
    else if (s.pending.length < 20) s.pending.push(safe);
  }
  function stop() { destroy(); clear({ analytics: true, advertising: true }); }
  return { update, send, stop };
}
