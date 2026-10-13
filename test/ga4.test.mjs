import test from 'node:test';
import assert from 'node:assert/strict';
import { createGA4, pageContext, deniedConsent } from '../src/ga4.js';
import { privacySignal, readChoice, saveChoice, consentKey, consentLifetime } from '../src/consent.js';
import { analytics as config } from '../src/analytics-config.js';
import { catalog, pages } from '../public/tracking-catalog.js';

const page = '/compare/casio-f91w-vs-ae1200/';
const raw = '?utm_source=google&utm_medium=cpc&utm_campaign=first50&utm_content=comparison&email=secret@example.test&utm_term=private&gclid=secret';
function fixture({ granted = false, origin = config.productionOrigin, path = page } = {}) {
  const scripts = [], timers = new Map(), expired = [];
  const window = {
    location: { origin, hostname: new URL(origin).hostname, pathname: path, search: raw, hash: '#secret' },
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const document = {
    body: { dataset: { page } },
    get cookie() { return '_ga=old; _ga_LSGXWGSM9T=old-session; necessary=keep'; },
    set cookie(value) { expired.push(value); },
    get referrer() { assert.fail('raw referrer must not be read'); },
    createElement() { return { remove() { this.removed = true; } }; },
    head: { append(script) { scripts.push(script); } },
  };
  const adapter = createGA4({ window, document, config, catalog, pages, consentGranted: () => granted });
  const commands = () => (window.dataLayer || []).map(args => [...args]);
  const event = { event: 'outbound_amazon_click', model: 'AE-1200WHD-1AV', placement: 'comparison_pick', email: 'secret@example.test', page: '/secret', destination_type: 'private' };
  return { adapter, window, document, scripts, timers, expired, event, commands, grant: value => { granted = value; } };
}

test('no consent, previews and unknown routes never load or configure Google', async () => {
  for (const options of [{}, { granted: true, origin: 'https://preview.vercel.app' }, { granted: true, path: '/private/person@example.test' }]) {
    const f = fixture(options);
    assert.equal(await f.adapter.start(), false);
    f.adapter.send(f.event);
    assert.equal(f.scripts.length, 0); assert.deepEqual(f.commands(), []);
    assert.equal(f.expired.length, 0);
  }
});

test('safe page context uses canonical catalog paths and allowed campaigns, with no raw URLs', () => {
  const f = fixture();
  const result = pageContext({ location: f.window.location, page, pages, config });
  assert.equal(result.page_location, config.productionOrigin + page);
  assert.equal(result.page_referrer, ''); assert.equal(result.campaign_term, '(not set)');
  assert.equal(result.campaign_source, 'google');
  assert.doesNotMatch(JSON.stringify(result), /secret|private|gclid|email/);
  for (const alias of [page.slice(0, -1), page + 'index.html']) {
    assert.equal(pageContext({ location: { ...f.window.location, pathname: alias }, page, pages, config }).page_location, config.productionOrigin + page);
  }
  f.window.location.search = '?utm_source=someone@example.test&utm_campaign=first50&utm_campaign=first50';
  const invalid = pageContext({ location: f.window.location, page, pages, config });
  assert.equal(invalid.campaign_source, '(direct)'); assert.equal(invalid.campaign_name, '(not set)');
});

test('grant loads one tag, denies ads/signals, sends one manual page view and exact sanitized events', async () => {
  const f = fixture({ granted: true });
  const promise = f.adapter.start();
  assert.equal(f.adapter.start(), promise);
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-LSGXWGSM9T');
  assert.equal(f.scripts[0].referrerPolicy, 'no-referrer');
  assert.deepEqual(f.commands()[0], ['consent', 'default', deniedConsent]);
  const settings = f.commands().find(c => c[0] === 'config')[2];
  assert.equal(settings.send_page_view, false);
  assert.equal(settings.allow_google_signals, false);
  assert.equal(settings.allow_ad_personalization_signals, false);
  assert.equal(settings.cookie_domain, 'none'); assert.equal(settings.cookie_expires, 2592000);
  f.adapter.send(f.event); // Queued after consent while the script is loading.
  assert.equal(f.commands().filter(c => c[0] === 'event').length, 0);
  f.scripts[0].onload(); assert.equal(await promise, true);
  await f.adapter.start(); f.adapter.send(f.event);
  const events = f.commands().filter(c => c[0] === 'event');
  assert.equal(events.filter(c => c[1] === 'page_view').length, 1);
  assert.equal(events.filter(c => c[1] === 'outbound_amazon_click').length, 2);
  const click = events.find(c => c[1] === 'outbound_amazon_click')[2];
  assert.equal(click.model, 'AE-1200WHD-1AV'); assert.equal(click.page, page);
  assert.equal(click.destination_type, 'direct_product'); assert.equal(click.utm_campaign, 'first50');
  assert.doesNotMatch(JSON.stringify(f.commands()), /secret|private|email|purchase/);
});

test('revocation disables the SDK, clears only GA cookies, discards pending clicks and cannot restart this document', async () => {
  const f = fixture({ granted: true });
  const pending = f.adapter.start(); f.adapter.send(f.event);
  f.grant(false); f.adapter.stop();
  assert.equal(f.window['ga-disable-G-LSGXWGSM9T'], true);
  assert.ok(f.scripts[0].removed);
  assert.ok(f.expired.some(cookie => cookie.startsWith('_ga=')));
  assert.ok(f.expired.every(cookie => !cookie.includes('necessary')));
  f.scripts[0].onload(); assert.equal(await pending, false);
  f.grant(true); assert.equal(await f.adapter.start(), false);
  f.adapter.send(f.event); assert.equal(f.commands().filter(c => c[0] === 'event').length, 0);
  assert.deepEqual(f.commands().at(-1), ['consent', 'update', deniedConsent]);
});

test('blocked, failed and stalled providers drop events without automatic retries', async () => {
  for (const mode of ['error', 'timeout']) {
    const f = fixture({ granted: true }); const pending = f.adapter.start();
    f.adapter.send(f.event);
    if (mode === 'error') f.scripts[0].onerror(); else [...f.timers.values()][0]();
    assert.equal(await pending, false);
    assert.equal(await f.adapter.start(), false); f.adapter.send(f.event);
    assert.equal(f.scripts.length, 1); assert.equal(f.window['ga-disable-G-LSGXWGSM9T'], true);
    assert.equal(f.commands().filter(c => c[0] === 'event').length, 0);
  }
});

test('post-consent pending queue is bounded and broken cookie access cannot prevent withdrawal', async () => {
  const f = fixture({ granted: true }); const pending = f.adapter.start();
  for (let i = 0; i < 50; i++) f.adapter.send(f.event);
  f.scripts[0].onload(); await pending;
  assert.equal(f.commands().filter(c => c[1] === 'outbound_amazon_click').length, 20);
  Object.defineProperty(f.document, 'cookie', { get() { throw new Error('blocked cookies'); } });
  assert.doesNotThrow(() => f.adapter.stop());
  assert.equal(f.window['ga-disable-G-LSGXWGSM9T'], true);
});

test('consent storage is bounded and malformed, expired, blocked storage fail closed', () => {
  const values = new Map();
  const window = { localStorage: { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) } };
  assert.equal(readChoice(window), null); assert.equal(saveChoice(window, 'accepted'), true);
  assert.equal(readChoice(window), 'accepted');
  assert.equal(readChoice(window, Date.now() + consentLifetime + 1000), null);
  values.set(consentKey, '{bad json'); assert.equal(readChoice(window), null);
  values.set(consentKey, JSON.stringify({ choice: 'yes', at: Date.now() })); assert.equal(readChoice(window), null);
  const blocked = { get localStorage() { throw new Error('blocked'); } };
  assert.equal(readChoice(blocked), null); assert.equal(saveChoice(blocked, 'accepted'), false);
});

test('GPC and current/legacy DNT signals override consent', () => {
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { doNotTrack: 'yes' }, { msDoNotTrack: '1' }]) assert.equal(privacySignal({ navigator }), true);
  assert.equal(privacySignal({ navigator: {}, doNotTrack: '1' }), true);
  assert.equal(privacySignal({ navigator: { doNotTrack: '0' } }), false);
});
