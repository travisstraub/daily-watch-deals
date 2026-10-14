// TEST-ONLY BRANCH: never merge. Host verified from PR #9's Vercel deployment.
// No production/wildcard/URL/storage/env override. Production Ads config stays false.
export const tagTest = Object.freeze({
  enabled: true,
  origin: 'https://daily-watch-deals-git-codex-priv-26a54f-travis-straubs-projects.vercel.app',
  path: '/__tag-validation/dwf-ads-validation-20261014-01/',
  run: 'DWF-ADS-VALIDATION-20261014-01',
});
export function testMode(location) {
  return tagTest.enabled === true && location.origin === tagTest.origin && location.pathname === tagTest.path ? tagTest : null;
}
