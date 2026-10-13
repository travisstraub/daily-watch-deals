import { campaignDimensions, outboundEvent } from './analytics.js';

export const deniedConsent = Object.freeze({
  analytics_storage: 'denied', ad_storage: 'denied',
  ad_user_data: 'denied', ad_personalization: 'denied',
});

// Never read document.referrer/title or forward arbitrary paths, query strings or hashes.
export function pageContext({ location, page, pages, config }) {
  const matchingPath = location.pathname === page || location.pathname + '/' === page || location.pathname === page + 'index.html';
  if (location.origin !== config.productionOrigin || !pages.includes(page) || !matchingPath) return null;
  const campaign = campaignDimensions(location.search);
  return {
    page_location: config.productionOrigin + page,
    page_referrer: '',
    page_title: 'Daily Watch Finds | ' + page,
    ignore_referrer: true,
    campaign_source: campaign.utm_source || '(direct)',
    campaign_medium: campaign.utm_medium || '(none)',
    campaign_name: campaign.utm_campaign || '(not set)',
    campaign_content: campaign.utm_content || '(not set)',
    campaign_id: '(not set)', campaign_term: '(not set)',
  };
}

export function clearAnalyticsCookies(document, hostname) {
  // The adapter uses host-only, root-path GA cookies. Also remove legacy domain cookies.
  const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0])
    .filter(name => /^_ga(?:_|$)/.test(name));
  const domains = ['', hostname, '.' + hostname];
  for (const name of names) for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
  }
}

export function createGA4({ window, document, config, catalog, pages, consentGranted }) {
  const id = config.measurementId;
  const disableKey = 'ga-disable-' + id;
  let active = false, ready = false, requested = false, configured = false, viewed = false, ended = false;
  let script, timer, pending = [], startPromise;
  const allowed = () => active && consentGranted() && config.enabled === true;
  const context = () => pageContext({ location: window.location, page: document.body.dataset.page, pages, config });
  const command = (...args) => {
    // gtag's documented queue format is an Arguments object, not an array.
    function gtag() { window.dataLayer.push(arguments); }
    gtag(...args);
  };
  window[disableKey] = true;

  function start() {
    if (ended || !consentGranted() || !context() || config.enabled !== true || !/^G-[A-Z0-9]+$/.test(id)) return Promise.resolve(false);
    active = true;
    if (startPromise) return startPromise;
    requested = true;
    // Failure is terminal for this document: no retry loop and no replay after revoke.
    startPromise = new Promise(resolve => {
      window.dataLayer = [];
      window[disableKey] = false;
      command('consent', 'default', { ...deniedConsent });
      command('set', {
        allow_google_signals: false, allow_ad_personalization_signals: false,
        ads_data_redaction: true, url_passthrough: false,
        send_page_view: false, ...context(),
      });
      command('consent', 'update', { ...deniedConsent, analytics_storage: 'granted' });
      command('js', new Date());
      command('config', id, {
        ...context(), send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: 'none', cookie_path: '/', cookie_expires: 2592000,
        cookie_update: false, cookie_flags: 'SameSite=Lax;Secure',
      });
      configured = true;
      const fail = () => { stop(); resolve(false); };
      script = document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      script.onerror = fail;
      script.onload = () => {
        window.clearTimeout(timer);
        if (!allowed() || !context()) { fail(); return; }
        ready = true;
        if (!viewed) {
          viewed = true;
          command('event', 'page_view', { send_to: id, ...context(), page: document.body.dataset.page });
        }
        for (const event of pending) transmit(event);
        pending = [];
        resolve(true);
      };
      timer = window.setTimeout(fail, 8000);
      document.head.append(script);
    });
    return startPromise;
  }

  function validate(event) {
    if (event?.event !== 'outbound_amazon_click') return null;
    const entry = Object.entries(catalog).find(([, watch]) => watch.model === event.model);
    if (!entry) return null;
    const [slug, watch] = entry;
    // Rebuild the payload from known catalog values; never forward extra fields.
    return outboundEvent({ dataset: { amazonModel: slug, placement: event.placement }, href: watch.destination }, {
      catalog, pages, page: document.body.dataset.page, search: window.location.search,
    });
  }
  function transmit(event) {
    if (!allowed() || !ready || !context()) return;
    const { event: name, ...dimensions } = event;
    command('event', name, { send_to: id, ...context(), ...dimensions });
  }
  function send(event) {
    if (!allowed() || !context()) return;
    const safe = validate(event);
    if (!safe) return;
    if (ready) transmit(safe);
    else if (requested && pending.length < 20) pending.push(safe);
  }
  function stop() {
    ended = ended || requested; active = false; ready = false; pending = [];
    window[disableKey] = true; // Stops Google sends/cookie writes before any other work.
    window.clearTimeout(timer);
    try {
      if (configured) {
        window.dataLayer.length = 0;
        command('consent', 'update', { ...deniedConsent });
      }
    } catch { /* A broken provider cannot prevent withdrawal. */ }
    script?.remove();
    try { clearAnalyticsCookies(document, window.location.hostname); }
    catch { /* Browser storage restrictions do not re-enable collection. */ }
  }
  // A second grant after revocation is applied on the next ordinary page load.
  // This avoids reviving an old provider instance or replaying queued events.
  return { start, send, stop };
}
