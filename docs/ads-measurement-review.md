# Separate Google Ads measurement — disabled review build

This branch is stacked on PR #7 at `bcea4e0e4e58778d5f5b68b12d3fa9eb01aa59aa`.
PR #7 and production are not modified or merged by this work.

The operator supplied and verified the following on October 13 Pacific:

- Destination: `AW-18511081247/3QZeCKShgZwdEJ_e4vpE` (public tag ID/label, not a credential).
- Conversion action `7843369124`: Secondary, no value, Count One, excluded from
  account-level goals; no custom goals. This is an outbound Amazon click, not a
  purchase, qualifying sale, revenue or commission.

`src/ads-config.js` has `enabled: false`. There is no query, storage or environment
switch to activate it. The normal build retains the current analytics-only notice
and GA4 adapter. Its privacy page explicitly says Ads measurement is disabled.
The enabled interface and SDK are exercised only in an isolated local test build.
No credentials, account links, audience imports, ads or paid services were created.

## Enabled design for review

- Analytics and Advertising measurement are separate unchecked choices. Save
  choices and Reject all have equal styling and size. Each preference/date is
  stored under its own key for up to 180 days. Existing analytics acceptance never
  supplies Ads permission. A failed storage write cannot grant permission.
- The enabled code configures only accepted destinations, and only on the known
  production origin/canonical pages. Both purposes share one Google tag loader.
  No consent means no Google request. Analytics-only never configures Ads;
  Ads-only never configures GA4 or sends a GA4 page view.
- Default consent is denied for every purpose. Only accepted analytics storage
  and/or accepted ad storage/ad user data are granted before loading the tag.
  `ad_personalization` remains denied. Google Signals, personalization signals,
  enhanced conversions and URL passthrough stay off. No remarketing event or
  audience/account linking is implemented.
- A single existing validated click listener dispatches once to each accepted
  purpose. GA4 retains `outbound_amazon_click` and its model/page/placement/type
  dimensions. Ads receives `conversion` with the exact destination and sanitized
  canonical context. It receives no invented value, currency, transaction ID,
  user data or callback URL. Count One is an Ads reporting setting, not suppression
  of intentional repeated browser clicks. No duplicate GA4 import is created.
- Native Amazon anchors, tag/disclosure/rel attributes and navigation are unchanged.
  Blocked, failed, pending or absent tracking cannot cancel or delay navigation.

## SDK lifetime and withdrawal

An already executed Google Ads SDK cannot be unloaded by removing its script,
and GA4's disable flag is not an Ads kill switch. The enabled path therefore runs
one shared tag inside a hidden same-origin helper frame. The helper is inert
when visited directly, has `noindex,nofollow`, and is absent from the sitemap.
All ordinary pages retain `X-Frame-Options: DENY`; only `/measurement-frame.html`
permits `SAMEORIGIN`, allowing the site's own tag context.

Changing granted purposes destroys the old frame, discards pending events and
clears accessible root-path `_ga`/`_ga_*` cookies for revoked analytics and
`_gcl_*`/`_gac_*` cookies for revoked advertising. A still-accepted purpose starts
in a fresh frame. The top-level document tracks whether its one manual GA4 view
was already sent, preventing another view when consent combinations change.
No denied-consent update is sent to the old SDK during destruction. Already sent
requests cannot be recalled. Mock browser coverage includes a cookie-writing
SDK timer to check that teardown stops more than the site's click listener.

GPC/DNT override both grants; cross-tab withdrawal, returning to the page,
preference expiry and periodic rechecks apply the same teardown. The click path
also rechecks stored consent synchronously. Regrant starts a fresh context and
never replays pre-consent or discarded clicks. Failure is terminal for that
page's SDK instance; queues are capped at 20 and time out after eight seconds.

## Attribution and data scope

Only after advertising opt-in may the helper URL contain a single `gclid`,
`gbraid` or `wbraid`, bounded to 10–256 ASCII letters/digits/underscore/hyphen.
Duplicate, malformed or other parameters are discarded. The helper request is
same-origin, so hosting can process those consented pseudonymous IDs. The tag
can use the helper URL for its standard click-linking behavior; the parent URL,
fragment and referrer are not copied. Google request metadata/cookies remain
pseudonymous, not anonymous. GA4 event context remains canonical and excludes
click IDs and arbitrary queries. No identifiers are added to Amazon links.

This adapter is not a claim that Google has verified iframe-based attribution.
The real SDK's handling of the helper URL, cookies, canonical event context and
conversion attribution must be checked before enabling. The hidden SDK context
also means automatic visibility/engagement behavior may differ from a top-level
tag. The site's explicit page and click events are covered by tests. The current
GA4 adapter is retained while the review flag is off.

## Verification and release gate

Run `npm run build` and `npm test`. Browser commands require local Playwright and
Chromium but install no dependencies:

```
node test/consent-browser.cjs /tmp/dwf-ads-disabled-regression
node test/ads-browser.cjs /tmp/dwf-ads-final-evidence
node test/conversion-browser.cjs http://127.0.0.1:4181 /tmp/dwf-ads-layout
node test/browser.cjs http://127.0.0.1:4181 /tmp/dwf-ads-navigation
```

The Ads browser harness copies only source/build inputs to a fresh temporary
folder and enables the flag there. It does not modify the repository flag. All
Google and Amazon traffic is intercepted. It exercises the generated enabled
markup/privacy text and the same header rules used by the Vercel project.

Before any separately approved enablement/release, review the generated enabled
privacy/UI and the new SDK architecture; confirm the action is still Secondary,
valueless, Count One and not in a bidding/custom goal. Inspect actual preview
headers where access permits. A later controlled, consented real-SDK test must
check canonical data, cookie attribution, no denied or personalized traffic,
withdrawal, and the exact Ads label with Tag Assistant. An Ads diagnostic/receipt
is separate from evidence of a qualifying Amazon sale. No paid test traffic is
needed or authorized. This PR does not grant activation or production release.

Sources: [Google tag reuse](https://support.google.com/google-ads/answer/7548399),
[consent modes](https://developers.google.com/tag-platform/security/concepts/consent-mode),
[personalization controls](https://support.google.com/google-ads/answer/9606827),
[secondary action caveat](https://support.google.com/google-ads/answer/11461796).

## Recorded results

- Build passed; 45 automated tests passed, none failed or skipped.
- Existing GA4 consent browser suite passed with Ads disabled.
- Enabled Ads browser suite passed all 17 scenarios, including applying the
  project's framing headers in Chromium. This includes pointer, repeated,
  keyboard and middle activation, both independent withdrawals, no replay,
  provider failure, privacy signals and cross-tab behavior.
- Disabled-build comparison layout suite passed at 1165×747, 390×900 and 320×800.
  Enabled consent was inspected at 1165×747 and 390×900; both comparison Amazon
  buttons remain in the 747px desktop viewport, and neither layout overflows.
- General site/navigation browser suite passed at 1440px/390px with ten
  intercepted Amazon navigations, including tracking failures and no JavaScript.
  Manufacturer image requests remain unavailable in this environment; their
  production availability is not established by these tests.
- All product destinations, disclosed affiliate tag, 41 sitemap entries,
  ownership-file bytes and PR #7 comparison content remain unchanged.

[Reports, enabled-interface screenshots and enabled privacy output](../planning/evidence/ads-measurement/)
are local/mock evidence. They do not establish real Google tag compatibility,
Ads attribution, dashboard receipt, or live preview rendering. Those remain
explicit release gates; the flag remains false.
