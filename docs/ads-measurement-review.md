# Historical review: separate Google Ads measurement — disabled build

**Historical PR #8 evidence.** For the current activation proposal and the later
operator-reported real-SDK privacy check, see [ads-activation-review.md](ads-activation-review.md).
The disabled-state statements and pending gates below describe that earlier review.

This draft was stacked on PR #7 (`bcea4e0e4e58778d5f5b68b12d3fa9eb01aa59aa`).
Neither PR #7 nor production is merged or changed by this work.

The operator supplied the public destination
`AW-18511081247/3QZeCKShgZwdEJ_e4vpE` and verified action `7843369124`:
Secondary, no value, Count One, excluded from account-level goals, no custom goals.
It measures an outbound Amazon click, never a purchase, qualifying sale or revenue.

`src/ads-config.js` remains `enabled: false`; no runtime override exists. The
normal build retains the analytics-only interface and existing GA4 adapter. Its
privacy page says Ads measurement is disabled. No account linking, conversion
import, ad launch, paid traffic, paid service or production deployment is included.

## Supported architecture and independent consent

The iframe design has been removed, including its generated helper and framing
header exception. All pages again use `X-Frame-Options: DENY`. Google explicitly
advises against conversion tags in iframes; its reporting documentation also warns
about parent URL attribution. The new, still-disabled adapter loads one shared
Google tag in the **top-level document**, only after an explicit accepted purpose.
Sources: [sitewide tagging guidance](https://support.google.com/google-ads/answer/9148089?hl=en),
[conversion webpages limitations](https://support.google.com/google-ads/answer/15299266).

Analytics and Advertising measurement have separate unchecked choices and stored
preferences. Save choices and Reject all have equal styling. Existing analytics
acceptance never grants Ads permission. Configuration includes only accepted
destinations on known production pages. Ads-only sends no GA4 page view;
analytics-only configures no Ads destination. Before either opt-in, no Google
script or measurement request is made. Both choices rejected on a fresh document
also means no Google script or requests.

All consent defaults are denied; accepted analytics storage and/or advertising
storage/ad user data are granted before loading. Ad personalization remains
denied. Signals, personalization signals, enhanced conversions and URL
passthrough stay off. The site adds no remarketing event, audience import or
account link. A future real-SDK review must inspect Google's automatic requests.

The same validated native click listener supplies stable model/page/placement/
destination-type and approved campaign dimensions to GA4. Ads receives only its
exact conversion destination and canonical context, without value, currency,
transaction ID, user data or an event callback. Intentional repeated clicks each
send once to each accepted destination. Count One is an Ads reporting setting.
Native navigation is never prevented or delayed by awaiting measurement.

## Withdrawal, failure and storage

Removing an executed script cannot unload its SDK, and GA4's disable flag does
not stop Ads. Once the enabled adapter requests a tag, **any change of granted
purposes reloads the full page**. Before reload, it stops dispatching, drops queued
events, disables GA4, updates Google consent to denied, clears revoked-purpose
storage and persists revocations. Reload is scheduled for the next task so an
ordinary Amazon activation can finish. The refreshed document rechecks consent,
cleans rejected-purpose storage again, and loads only still-accepted destinations.
There is one manual GA4 view per document; a consent-triggered refresh can create
a new page view when analytics remains accepted. It never replays the prior click.

Following [Google's consent update guidance](https://developers.google.com/tag-platform/security/guides/consent),
the existing SDK is told about withdrawal before navigation. It **may send a
cookieless consent-status request during withdrawal**, and requests already sent
or in flight cannot be recalled. We do not claim script removal alone stops SDK
timers or that withdrawal emits zero requests. If reload is browser-blocked, our
own event dispatch remains terminally off, but SDK shutdown is not guaranteed.
These tradeoffs and the enabled privacy wording require review before activation.

Cleanup is restricted to root-path `_ga`/`_ga_*` cookies for analytics and
`_gcl_*`/`_gac_*` cookies plus the exact local-storage key `_gcl_ls` for Ads. It
attempts host-only and current-domain cookies. Cookie and local-storage cleanup
are independent, so one blocked store cannot skip the other. Unrelated storage
and consent preferences are retained. The default linker key and root cookie
scope follow [Google's conversion linker documentation](https://support.google.com/tagmanager/answer/7549390).
There are no configured custom cookie prefixes or other Ads storage keys.

Preference writes that throw attempt removal of stale acceptance and set a
minimal first-party refusal cookie (`dwf_analytics_denied` or
`dwf_advertising_denied`, value `1`, up to 180 days). A later explicit successful
acceptance clears that refusal. Reading an accepted local-storage record also
checks writability by rewriting identical bytes, without extending its expiry.
A readable but read-only store therefore cannot silently revive old permission
on reload, even when removal is blocked. If all browser storage writes are blocked,
no code can persist a new choice; measurement stays off while that restriction
holds. A fallback refusal cookie protects against subsequent local-storage recovery
when cookies are available. No refusal flag is sent as a measurement event.

Every click and SDK-load callback rechecks consent and initiates shutdown on a
mismatch, rather than merely dropping that event. Expiry and newly appearing
GPC/DNT therefore work without focus/visibility events. Cross-tab withdrawal,
focus, visibility and periodic checks provide additional reconciliation. SDK
failure revokes both purposes and refreshes once; no retry loop or event replay.
The post-consent pending queue is bounded to 20 and times out after eight seconds.

## URL scope and attribution tradeoffs

Before loading the enabled top-level SDK, the address is sanitized with
`history.replaceState`: only exact allowlisted campaign values survive; Ads
opt-in additionally permits one bounded `gclid`, `gbraid` or `wbraid`. Arbitrary
query text, duplicate/malformed IDs and fragments are removed. If sanitization
fails, the SDK is not loaded. The SDK can itself inspect its top-level location,
so event payload overrides alone are not used as the URL privacy boundary.

Analytics-only strips click IDs. If Ads is accepted later, the removed identifier
is not recovered or replayed, which can reduce attribution. URL fragments are
also removed when measurement starts. Page/event context remains canonical and
omits referrers; no identifiers are appended to Amazon links. Google technical
request metadata and its cookies are pseudonymous, not anonymous.

## Verification and remaining release gates

Run `npm run build` and `npm test`. Browser commands require existing Playwright
and Chromium, and install no dependencies:

```
node test/consent-browser.cjs /tmp/dwf-ads-disabled-redesign
node test/ads-browser.cjs /tmp/dwf-ads-redesign-final
node test/conversion-browser.cjs http://127.0.0.1:4181 /tmp/dwf-ads-layout-final
node test/browser.cjs http://127.0.0.1:4181 /tmp/dwf-ads-navigation-final
```

The Ads harness enables the gate only in a temporary copy of source/build inputs.
Every external request is intercepted. Its mock deliberately writes Ads cookies
and `_gcl_ls` repeatedly so cleanup is checked after a real document reload. It
also covers independent purposes, repeated/pointer/keyboard/middle activation,
expiry/GPC without focus, blocked writes/removal, provider failures, cross-tab
revocation, native navigation and 1165px/390px rendering.

A real-SDK compatibility attempt on October 14, 2026 stopped at the prerequisite
SDK download: an ordinary unauthenticated GET of the approved Ads `gtag/js` URL
returned **HTTP 403**. No SDK bytes were available or executed; no collection
endpoint was contacted. No alternate path, credentials or protection bypass was
attempted. [Attempt evidence](../planning/evidence/ads-measurement/real-sdk-attempt.json).

The intended next isolated check is a fresh browser with service workers and
WebSockets blocked, all requests intercepted, and only separately downloaded,
reviewed Google JavaScript resources served locally. All collection/image/beacon/
XHR/fetch endpoints must be blocked before leaving the browser; inspect attempted
payloads, destination/label, canonical URL, consent flags and storage after reload.
No real ad click, purchase or conversion submission is authorized. Even a passing
blocked-collection compatibility check cannot prove Google receipt or attribution.

Before enabling: review the reload/consent-status-ping tradeoff and updated privacy,
complete actual-SDK inspection, reconfirm Secondary/no value/Count One/no bidding
or custom goal, and obtain explicit activation/release approval. Preview is Vercel
auth-protected; authenticated rendering remains a reviewer check. Protection and
scoped-read denials are respected. Production verification and any authorized
Tag Assistant/Google receipt check are separate from qualifying Amazon sales.

## Recorded results

- Build and all 49 Node tests passed; no failures or skipped tests.
- All four Chromium suites passed: 19 enabled Ads scenarios, 12 disabled GA4
  scenarios, comparison layout/accessibility and general navigation.
- Desktop 1165×747 and mobile 390×900 enabled controls were inspected; no overflow,
  equal choice buttons, keyboard access and both desktop shopping buttons visible.
  Disabled layout also passed at 320px; general pages passed at 1440px/390px.
- Ten Amazon navigations were intercepted successfully. Manufacturer image
  requests were unavailable in this environment, so live image availability is
  not established by those local tests.
- The 41 sitemap URLs, seven direct ASINs, affiliate tags/disclosures, ownership
  file and PR #7 comparison content remain unchanged.

The committed evidence directory contains the latest reports and enabled privacy
output. Mock results establish application behavior only. They do not establish
real SDK compatibility, Google dashboard receipt, attribution or live preview
rendering. Ads remains disabled.
