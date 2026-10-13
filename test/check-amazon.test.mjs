import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAmazon } from '../scripts/check-amazon.mjs';
const env = { AMAZON_CREATORS_CLIENT_ID: 'test-client', AMAZON_CREATORS_CLIENT_SECRET: 'test-secret', AMAZON_CREATORS_CREDENTIAL_VERSION: '3.1', AMAZON_ASSOCIATE_TAG: 'test-tag-20' };
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
test('missing credentials cause no requests', async () => {
  assert.equal((await checkAmazon({}, () => { throw Error('must not fetch'); })).stage, 'configuration');
});
test('unsupported versions cause no requests', async () => {
  const result = await checkAmazon({ ...env, AMAZON_CREATORS_CREDENTIAL_VERSION: '2.1' }, () => { throw Error('must not fetch'); });
  assert.equal(result.stage, 'configuration');
});
test('auth failure is sanitized', async () => {
  const result = await checkAmazon(env, async () => new Response('test-secret', { status: 401 }));
  assert.deepEqual(result, { ok: false, stage: 'authentication', httpStatus: 401 });
});
test('catalog access is verified without exposing response data or credentials', async () => {
  let calls = 0;
  const result = await checkAmazon(env, async (url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    if (calls === 1) {
      assert.equal(url, 'https://api.amazon.com/auth/o2/token');
      assert.equal(body.client_secret, env.AMAZON_CREATORS_CLIENT_SECRET);
      return json({ access_token: 'test-token' });
    }
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(body.partnerTag, 'test-tag-20');
    assert.deepEqual(body.itemIds, ['B0FJMQ4T64']);
    return json({ itemsResult: { items: [{ asin: 'B0FJMQ4T64', itemInfo: { title: { displayValue: 'Test watch' } } }] } });
  });
  assert.deepEqual(result, { ok: true, stage: 'catalog', httpStatus: 200, returnedItems: 1 });
  assert.equal(calls, 2);
});
test('empty catalog response is not reported as verified access', async () => {
  let calls = 0;
  const result = await checkAmazon(env, async () => ++calls === 1 ? json({ access_token: 'test-token' }) : json({ itemsResult: { items: [] } }));
  assert.equal(result.ok, false);
});
test('throttled catalog and exception text never leak secrets', async () => {
  let calls = 0;
  const result = await checkAmazon(env, async () => ++calls === 1 ? json({ access_token: 'test-token' }) : new Response('test-secret', { status: 429 }));
  assert.deepEqual(result, { ok: false, stage: 'catalog', httpStatus: 429 });
  assert.equal(JSON.stringify(await checkAmazon(env, () => { throw Error('test-secret'); })).includes('test-secret'), false);
});

test('only recognized catalog reasons are disclosed', async () => {
  for (const reason of ['AssociateNotEligible', 'test-secret']) {
    let calls = 0;
    const result = await checkAmazon(env, async () => ++calls === 1 ? json({ access_token: 'test-token' }) : new Response(JSON.stringify({ reason, message: 'test-secret' }), { status: 403 }));
    assert.equal(result.reason, reason === 'AssociateNotEligible' ? reason : undefined);
    assert.equal(JSON.stringify(result).includes('test-secret'), false);
  }
});
