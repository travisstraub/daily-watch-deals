# Separate-consent Ads activation — review only

This proposal starts from production main
`77680af11d6d749322f3dcc221641a28f7b654b2`. It does not include or merge PR #9's
private test page, host override, one-event button or test ledger code.
**Do not merge or release this activation until the review is complete.**

To honor the deployment hold, `vercel.json` disables automatic Git deployments
for `codex/activate-consented-ads` only, using Vercel's documented
[`git.deploymentEnabled` branch setting](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled).
All other branches keep their existing deployment behavior. No account/project
setting or credential is changed. There is intentionally no activation preview
release in this review batch.

## Minimal implementation change

The only runtime source change is `src/ads-config.js`: `enabled: false` becomes
`enabled: true`, with the same approved public destination
`AW-18511081247/3QZeCKShgZwdEJ_e4vpE`. Both measurement adapters, consent controller,
GA4 config, event payload rules, campaign allowlist and outbound-link code are
unchanged. The existing build produces the separate unchecked purpose choices
and corresponding privacy text on every editorial page.

The privacy addition explains Google/DoubleClick initialization and page-visit
requests after Ads opt-in, including before an Amazon click and while Analytics
is rejected. It retains the reviewed withdrawal reload, possible cookieless
consent-status request, storage cleanup and inability to recall in-flight requests.

Only known canonical pages on `https://dailywatchfinds.com` can start measurement.
Preview/localhost acceptance sends no Google requests. Existing Analytics consent
never grants Ads consent; Analytics-only configures no Ads destination and Ads-only
configures no GA4 destination. Personalization stays denied. No purchase/value/
currency/order/user-data fields or navigation delays are introduced.

## Account, campaign and content scope

No Google account or campaign operation is performed. Preserve operator-approved
conversion action `7843369124`: Secondary, no value, Count One, excluded from
account-level goals and without custom goals. No account linking, GA4 conversion
import, bidding goal, audience, credential, paid traffic or budget change is made.
The traffic plan remains review-only with its existing total nonrecurring cap.

GA4 remains `G-LSGXWGSM9T` with the same explicit page/outbound event fields,
allowlisted campaigns and account assumptions. A new regression compares the
analytics-only page/click payloads against the existing approved GA4 adapter.
The reviewed shared adapter refreshes the page when granted purposes change;
there is one manual GA4 view per document, so a consent refresh may add a view.

All 30 model references, seven direct ASINs, other search destinations, affiliate
tag `straubmediagr-20`, disclosures, rel attributes, claims, internal links,
41 sitemap URLs and the exact Search Console verification bytes are preserved.
The larger generated HTML diff is the existing dual-purpose notice/footer applied
through the build, plus the privacy page. It is not new product content.

## Authoritative real evidence supplied by the operator

The [corrected PR #9 ledger](https://github.com/travisstraub/daily-watch-deals/blob/68cdb42cf726f916197dc6a2f9458f4a9461ea7d/docs/private-tag-validation.md)
records the consumed run `DWF-ADS-VALIDATION-20261014-01`: exactly one authorized
real conversion at **2026-10-14T13:11:17.375Z**. The former NOT SENT documentation
was stale. No second conversion is authorized or sent in this activation work.

The user reported ordinary Mac Chrome DevTools observations:

- Before consent and after reload: no Google/DoubleClick requests; empty origin
  localStorage; no `_g` cookies.
- Ads-only opt-in, Analytics rejected: real Google SDK 200; Google `ccm`
  `page_view` 200 with Ads destination and `npa=1`; DoubleClick `ccm` collect 204.
  `_gcl_au` and `_gcl_ls` appeared.
- Reject all reloaded the page and removed both measurement stores. Another
  reload preserved rejected choices without renewed Google requests or storage.
  Analytics remained rejected. No additional conversion was sent.

These supplied observations pass the requested real-SDK privacy gate for that
Mac Chrome flow. They are distinct from this coding agent's local mocks, do not
establish all-browser behavior or Ads dashboard attribution, and do not prove an
Amazon sale. The user approved the reload/possible consent-status-signal tradeoff.
No new real SDK/conversion testing is performed for this PR.

## Review validation

Run `npm run build` and `npm test`; then the mocked browser suites:

```
node test/ads-browser.cjs /tmp/dwf-activation-ads
node test/consent-browser.cjs /tmp/dwf-activation-rollback
node test/conversion-browser.cjs http://127.0.0.1:4182 /tmp/dwf-activation-layout
node test/browser.cjs http://127.0.0.1:4182 /tmp/dwf-activation-navigation
```

The Ads suite now tests a copy of the actual candidate without overriding its
flag. The legacy GA4 suite explicitly builds an isolated disabled rollback copy;
it does not change this branch. Both intercept all Google/Amazon requests. The
layout/navigation checks use a local server. None sends a real conversion.

The review must assess the final diff, regenerated privacy/consent UI, test
results, operator evidence and unchanged production-only guard before a release.
Google receipt/attribution and qualifying Amazon sales remain separate measures.
The code-only flag provides a rollback path, with existing rejected-purpose
storage cleanup; changing account/campaign settings is outside this PR.


### Recorded local results

- Build: PASS; generated public output refreshed through `npm run build`.
- Node: **51 passed, 0 failed, 0 skipped**, including analytics-only parity with
  the previously approved GA4 event payloads.
- Browser: **four suites passed**. The actual enabled candidate passed 19 mocked
  scenarios; the isolated Ads-disabled rollback passed 12. Layout checks passed
  at 1165, 390 and 320 px, with both desktop shopping buttons visible at 1165 ×
  747. Navigation checks passed at 1440 and 390 px, including repeated/middle/
  keyboard clicks and thrown/rejected/pending trackers, blocked consent code
  and JavaScript disabled. All ten tested outbound navigations were intercepted.
- `git diff --check`: PASS. Compared against base main, the consent controller,
  both adapters, campaign configuration, catalog, sitemap and verification file
  are unchanged. After removing the consent section and normalizing the footer
  control label, all 42 non-privacy HTML files (including the 404 and ownership file) are
  byte-identical to base main.
- Manufacturer-hosted images were unavailable from this execution environment
  (nine external image URLs in the navigation report). This does not establish
  their availability in an ordinary visitor browser; no image/content edits
  were made in this activation proposal.

Evidence: [Node output](../planning/evidence/ads-activation/node-tests.txt),
[enabled Ads mocks](../planning/evidence/ads-activation/ads-mock.json),
[GA4 rollback mocks](../planning/evidence/ads-activation/ga4-rollback-mock.json),
[layout checks](../planning/evidence/ads-activation/layout.json),
[navigation checks](../planning/evidence/ads-activation/navigation.json),
[desktop capture](../planning/evidence/ads-activation/comparison-desktop.png) and
[390 px capture](../planning/evidence/ads-activation/comparison-mobile-390.png).
These are local checks, not live receipt or attribution evidence.

Not run in this batch: another real conversion, production activation/deployment
or live activation verification. Those actions are outside this review request.
Any authorized later release still needs its own exact-commit deployment check;
checking a release must not consume another real conversion without permission.
