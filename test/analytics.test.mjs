import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignDimensions, outboundEvent, installOutboundTracking } from '../src/analytics.js';
import { analytics } from '../src/analytics-config.js';
import { catalog, pages } from '../public/tracking-catalog.js';

const comparison = '/compare/casio-f91w-vs-ae1200/';
const search = '?utm_source=google&utm_medium=cpc&utm_campaign=first50&utm_content=comparison';
const anchor = (slug = 'casio-ae1200', placement = 'comparison_pick') => ({
  dataset: { amazonModel: slug, placement }, href: catalog[slug].destination,
});
function fixture(send, overrides = {}) {
  const handlers = new Map();
  const document = {
    body: { dataset: { page: comparison } },
    addEventListener(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(handler);
    },
    removeEventListener(type, handler) { handlers.get(type)?.delete(handler); },
  };
  const config = { document, location: { search }, catalog, pages, enabled: true, send, ...overrides };
  const cleanup = installOutboundTracking(config);
  function activate(options = {}, link = anchor()) {
    const target = { closest: () => link };
    const event = {
      type: 'click', button: 0, defaultPrevented: false, isTrusted: true, target,
      preventDefault() { assert.fail('tracking must not cancel navigation'); },
      stopPropagation() { assert.fail('tracking must not intercept activation'); },
      ...options,
    };
    for (const handler of handlers.get(event.type) ?? []) handler(event);
    assert.equal(event.defaultPrevented, options.defaultPrevented ?? false);
    return event;
  }
  return { config, cleanup, activate, handlers };
}

test('shipped integration is disabled, attaches no listeners and never reads campaigns', () => {
  assert.deepEqual(analytics, { enabled: false, send: null });
  const disabled = fixture(() => assert.fail('collection is disabled'), {
    enabled: analytics.enabled,
    location: { get search() { assert.fail('disabled configuration read the URL'); } },
  });
  disabled.activate();
  assert.equal(disabled.handlers.size, 0);
  assert.equal(fixture(undefined).handlers.size, 0);
  assert.equal(fixture(() => {}, { enabled: 'true' }).handlers.size, 0);
});

test('event contains stable catalog/page/placement/type plus approved campaign values only', () => {
  assert.deepEqual(outboundEvent(anchor(), { catalog, pages, page: comparison, search }), {
    event: 'outbound_amazon_click', model: 'AE-1200WHD-1AV', page: comparison,
    placement: 'comparison_pick', destination_type: 'direct_product',
    utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'first50', utm_content: 'comparison',
  });
  const event = outboundEvent(anchor('seiko-srpj85', 'product_mobile'), {
    catalog, pages, page: '/watches/seiko-srpj85/', search: '?email=private@example.test',
  });
  assert.equal(event.destination_type, 'model_search');
  assert.equal(event.model, 'SRPJ85');
  assert.deepEqual(Object.keys(event), ['event', 'model', 'page', 'placement', 'destination_type']);
});

test('campaign allowlist rejects personal data, arbitrary text, duplicate values and click IDs', () => {
  assert.deepEqual(campaignDimensions('?utm_source=private%40example.test&utm_medium=cpc&utm_campaign=first50&utm_campaign=first50&utm_content=my-name&utm_term=private&gclid=123&fbclid=456&query=secret'), { utm_medium: 'cpc' });
  assert.deepEqual(campaignDimensions('?utm_source=Google&utm_content=comparison%2Fsecret'), {});
  assert.deepEqual(campaignDimensions(''), {});
});

test('altered URLs, attribution, unknown models, placements and noncanonical pages are rejected', () => {
  const context = { catalog, pages, page: comparison };
  for (const href of [
    'https://www.amazon.com.evil.test/dp/B0094B79CI?tag=straubmediagr-20',
    'https://www.amazon.com/dp/B0094B79PA?tag=straubmediagr-20',
    'https://www.amazon.com/dp/B0094B79CI',
    catalog['casio-ae1200'].destination + '&email=secret@example.test',
  ]) assert.equal(outboundEvent({ ...anchor(), href }, context), null);
  assert.equal(outboundEvent({ ...anchor(), dataset: { amazonModel: '__proto__', placement: 'comparison_pick' } }, context), null);
  assert.equal(outboundEvent(anchor('casio-ae1200', 'private-name'), context), null);
  assert.equal(outboundEvent(anchor(), { ...context, page: '/unknown/private-name/' }), null);
  assert.equal(outboundEvent(anchor(), { ...context, page: comparison + '?email=secret' }), null);
});

test('repeated clicks, keyboard, modified and middle clicks each emit once; repeated install does not duplicate', () => {
  const events = [];
  const f = fixture(event => events.push(event));
  assert.equal(installOutboundTracking(f.config), f.cleanup);
  f.activate(); f.activate(); f.activate({ detail: 0 }); f.activate({ ctrlKey: true });
  f.activate({ type: 'auxclick', button: 1 });
  assert.equal(events.length, 5);
  f.activate({ type: 'auxclick', button: 2 });
  f.activate({ defaultPrevented: true });
  f.activate({ isTrusted: false });
  f.activate({}, null);
  assert.equal(events.length, 5);
  f.cleanup(); f.activate();
  assert.equal(events.length, 5);
  installOutboundTracking(f.config); f.activate();
  assert.equal(events.length, 6);
});

test('nested text targets work without collecting text content', () => {
  const events = [];
  const f = fixture(event => events.push(event));
  f.activate({ target: { textContent: 'private', parentElement: { closest: () => anchor() } } });
  assert.equal(events.length, 1);
  assert.ok(!JSON.stringify(events).includes('private'));
});

test('throwing, rejected and never-settling senders leave activation untouched', async () => {
  for (const send of [() => { throw new Error('adapter failure'); }, () => Promise.reject(new Error('network failure')), () => new Promise(() => {})]) {
    const f = fixture(send);
    f.activate(); f.activate();
    await new Promise(resolve => setImmediate(resolve));
    f.cleanup();
  }
});
