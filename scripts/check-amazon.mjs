import { pathToFileURL } from 'node:url';

// Diagnostic only: never writes product data, credentials, tokens, or raw errors.
export async function checkAmazon(env, fetcher = fetch) {
  const required = ['AMAZON_CREATORS_CLIENT_ID', 'AMAZON_CREATORS_CLIENT_SECRET', 'AMAZON_CREATORS_CREDENTIAL_VERSION', 'AMAZON_ASSOCIATE_TAG'];
  const missing = required.filter(key => !env[key]?.trim());
  if (missing.length) return { ok: false, stage: 'configuration', missing };
  const endpoints = {
    '3.1': 'https://api.amazon.com/auth/o2/token',
    '3.2': 'https://api.amazon.co.uk/auth/o2/token',
    '3.3': 'https://api.amazon.co.jp/auth/o2/token',
  };
  const endpoint = endpoints[env.AMAZON_CREATORS_CREDENTIAL_VERSION.trim()];
  if (!endpoint) return { ok: false, stage: 'configuration', reason: 'Unsupported credential version; use a Creators API 3.x credential.' };
  let stage = 'authentication';
  try {
    const auth = await fetcher(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: env.AMAZON_CREATORS_CLIENT_ID.trim(), client_secret: env.AMAZON_CREATORS_CLIENT_SECRET.trim(), scope: 'creatorsapi::default' }),
    });
    if (!auth.ok) return { ok: false, stage, httpStatus: auth.status };
    const token = await auth.json();
    if (typeof token.access_token !== 'string' || !token.access_token) return { ok: false, stage, reason: 'Missing access token' };
    stage = 'catalog';
    const result = await fetcher('https://creatorsapi.amazon/catalog/v1/getItems', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.access_token}`, 'x-marketplace': 'www.amazon.com' },
      body: JSON.stringify({ itemIds: ['B0FJMQ4T64'], itemIdType: 'ASIN', marketplace: 'www.amazon.com', partnerTag: env.AMAZON_ASSOCIATE_TAG.trim(), resources: ['itemInfo.title'] }),
    });
    if (!result.ok) {
      const error = await result.json().catch(() => ({}));
      const reasons = ['AssociateNotEligible', 'AuthorizationFailed', 'InvalidAssociate', 'InvalidPartnerTag', 'TokenExpired', 'InvalidToken', 'InvalidIssuer', 'MissingClaim', 'MissingKeyId', 'UnsupportedClient', 'InvalidClient', 'MissingCredential', 'FieldValidationFailed'];
      return { ok: false, stage, httpStatus: result.status, ...(reasons.includes(error.reason) ? { reason: error.reason } : {}) };
    }
    const data = await result.json();
    const items = Array.isArray(data.itemsResult?.items) ? data.itemsResult.items : [];
    const found = items.some(item => item.asin === 'B0FJMQ4T64' && item.itemInfo?.title?.displayValue);
    return { ok: Boolean(found), stage, httpStatus: result.status, returnedItems: items.length, ...(found ? {} : { reason: 'No matching product returned; eligibility or product availability needs checking.' }) };
  } catch {
    return { ok: false, stage, reason: 'Request failed; check connectivity and configuration.' };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkAmazon(process.env);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
