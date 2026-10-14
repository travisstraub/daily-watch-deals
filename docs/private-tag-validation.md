# Private Google Ads tag validation — never merge this branch

**Run consumed: one real conversion at `2026-10-14T13:11:17.375Z`. Do not send another event.**

The user approved one clearly identified Google Ads test event without buying
traffic, clicking an ad, visiting Amazon or making a purchase. They also approved
the withdrawal behavior: a page reload and a possible cookie-free consent-status
signal. Production Ads remains disabled; this branch must never be merged.

## Exact test URL

https://daily-watch-deals-git-codex-priv-26a54f-travis-straubs-projects.vercel.app/__tag-validation/dwf-ads-validation-20261014-01/

The hostname was taken from Vercel's Ready deployment for PR #9, initial commit
`c953b7519e5b79376e0a454b0a3dbfd1cd09f293`. Only this HTTPS origin **and this path**
can enable test mode. Production, other previews, localhost, different ports,
subdomains and other paths cannot enable it. Use the branch alias above, not an
immutable deployment hostname. There is no URL/storage/environment switch.

The preview inherits the project's existing Vercel Authentication; no protection,
credentials, bypass or project settings were changed. The authorized browser
operator must confirm protected access before opting in. The coding environment
cannot independently establish live protection/rendering through its blocked
network path. Local mocked routing does not test Vercel Authentication.

## What is reused and isolated

`src/google-tag.js`, `src/ga4.js` and their built copies are byte-identical to
production commit `77680af11d6d749322f3dcc221641a28f7b654b2`. Test mode supplies
only the exact preview origin, one known private page and an Ads-enabled copy of
the configuration to the same adapter through the existing consent controller.
The source and generated **production** `ads-config.js` still say `enabled: false`.
GA4 is disabled on the private test page, and the Analytics checkbox is unavailable.

The production consent controller provides opt-in, GPC/DNT, expiry, failure,
withdrawal, storage cleanup and reload. Ordinary outbound-link listeners are not
installed in test mode; the page has no Amazon link. A manual test button calls
the same validated conversion adapter with a known catalog payload. Only Ads
receives a conversion; no GA4 page view/click, value, currency, transaction/order
identifier, user data or purchase event is added.

The fixed `page_location` and `page_title` identify the event through the unique
private test path and run ID. This is a synthetic control invocation, not evidence
that an Amazon link was followed. All query/fragment text, including ad-click and
debug identifiers, is removed before this test page initializes consent. No tag
runs before opt-in. Opt-in may generate Google's own initialization/consent
traffic; the one-event guard limits the site's manual labeled conversion request,
not the total number of Google HTTP requests.

## Archived operator procedure — completed; do not repeat

1. Open the exact test URL in the authorized, Vercel-authenticated browser. Check
   that the run is `DWF-ADS-VALIDATION-20261014-01`, the browser ledger says NOT SENT,
   Ads is initially off and Analytics is disabled. Confirm the shared ledger below
   is still unused. Do not use another browser/profile to repeat this run.
2. Connect Google Tag Assistant to the exact URL. **Uncheck “Include debug signal
   in URL”.** Normal privacy sanitization is retained; do not add debug, campaign,
   gclid, gbraid or wbraid parameters to work around it.
3. Select **Advertising measurement** and click **Save choices**. Confirm Tag
   Assistant detects `AW-18511081247`. No manual conversion should have been
   requested yet. If tag detection fails, stop and record the failure; do not use
   repeated conversion clicks to troubleshoot.
4. Click **Send ONE real Google Ads TEST event** once. It waits for SDK readiness,
   rechecks consent, reserves the browser ledger, then invokes the existing
   adapter. Expected conversion destination:
   `AW-18511081247/3QZeCKShgZwdEJ_e4vpE`. Match the dedicated preview path in event
   context. No Amazon navigation, ad click, purchase, value or currency is expected.
5. Record UTC time, preview commit, browser ledger, exact destination, Tag Assistant
   observations and available request evidence below. “Requested” is not proof of
   Google receipt or conversion attribution. If the result is ambiguous, stop;
   the run is consumed and must not be repeated without new authorization.
6. Open **Measurement choices**, then **Reject all**. Expect a full-page reload,
   rejected consent, accessible Ads cookie/`_gcl_ls` cleanup and the test ledger
   retained. A cookie-free consent-status signal and in-flight requests are possible.
   Inspect network/storage separately if the browser tools permit; UI state alone
   is not proof that all network activity or storage stopped.

The browser ledger key is
`dwf.private-tag-test.DWF-ADS-VALIDATION-20261014-01`. A Web Lock plus persistent
local storage prevents duplicate requests across simultaneous clicks, tabs and
reloads in that browser. Missing Web Locks or blocked storage fail closed. The
reservation remains consumed after a send failure; there is no reset button or
automatic retry. This is **not a global cross-device lock**. Clearing browser data,
a different profile or a modified client can bypass a browser-local guard; the
shared operator ledger and the one-event instruction govern those cases.

## One-event operator ledger

| Run | Authorization | Real event status | UTC / evidence | Google receipt |
| --- | --- | --- | --- | --- |
| DWF-ADS-VALIDATION-20261014-01 | One manual Ads test event; withdrawal reload/status signal approved | **CONSUMED — one real conversion sent; no repeat authorized** | `2026-10-14T13:11:17.375Z`, authoritative operator report | Dashboard receipt/attribution not established by this ledger |

The operator-reported conversion above supersedes the former NOT SENT placeholder.
No second conversion was sent during the subsequent privacy check. Local mock
conversions are not additional real events. The coding agent has not operated the
live conversion control and is updating documentation only.

## Real SDK privacy check — operator-reported Mac Chrome DevTools evidence

The user supplied these observations from ordinary Mac Chrome DevTools on October
14, 2026. The coding agent did not independently reproduce this live check:

| Stage | Network observed | Origin storage observed |
| --- | --- | --- |
| Before consent, including reload | No Google or DoubleClick requests | Empty origin localStorage; no `_g` cookies |
| Ads-only opt-in, Analytics rejected | Real Google SDK 200; Google `ccm` `page_view` 200 with Ads destination and `npa=1`; DoubleClick `ccm` collect 204 | `_gcl_au` and `_gcl_ls` appeared |
| Reject all | Page reloaded | Both `_gcl_au` and `_gcl_ls` removed |
| Another reload after rejection | No Google requests resumed | Rejected preferences persisted; neither measurement store returned |

Analytics remained rejected throughout. The observed Ads initialization page-view
traffic is not a second manual conversion or a GA4 grant. These observations pass
the requested real-SDK privacy gate for the tested Mac Chrome flow. They do not
prove all-browser behavior, Ads dashboard attribution, or an Amazon sale. The
single event at `2026-10-14T13:11:17.375Z` remains the authoritative consumed run.

## Local verification and limitations

- Build and 55 Node tests pass, including exact-host/path gating, production-off,
  consent/readiness, local/cross-tab guard, persistent reservation and storage failure.
- The private-page Chromium suite intercepts every external request, blocks service
  workers/WebSockets, and uses a mock SDK. It covers one trusted control activation,
  no GA4, no purchase/value fields, no Amazon navigation, reload/tab duplicates,
  withdrawal, wrong origins, GPC, blocked storage and SDK failure. Desktop 1165px
  and mobile 390px layouts were inspected with no horizontal overflow.
- Existing GA-only (12 scenarios) and enabled Ads (19 scenarios) mock suites passed as regressions. Existing
  public pages, product claims, ASIN variants, sitemap 41 and ownership bytes remain
  unchanged; production main is not changed by this branch.
- The test page is `noindex,nofollow`, absent from the sitemap and public navigation.
- The reported real SDK/privacy observations above supplement the local mocks.
  Ads dashboard receipt/attribution and behavior outside the tested browser flow
  remain unestablished. No outcome proves a qualifying Amazon sale. No Ads campaign, paid traffic,
  account linkage, credentials or production enablement is included.

Commands: `npm run build`, `npm test`, `node test/tag-test-browser.cjs`,
`node test/consent-browser.cjs`, `node test/ads-browser.cjs`.

[Local mock reports and screenshots](../planning/evidence/private-tag-validation/)
