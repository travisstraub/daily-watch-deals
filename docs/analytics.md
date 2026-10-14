# Consent-gated GA4 integration

The approved public measurement ID is `G-LSGXWGSM9T`. The consent-gated integration was released in PR #6 (merge
`c33c256c96aae54e229f2f45dcc3263cc59320cb`). Live dashboard receipt still needs
independent verification; code and mock tests do not establish delivery. The independent Ads opt-in proposal is described in
[ads-activation-review.md](ads-activation-review.md); no cross-product account link is configured. Account operator details do not belong in this public repository.

## Consent and provider lifecycle

- Every editorial page offers equally styled **Save choices** and **Reject all**
  buttons with separate Analytics and Advertising measurement checkboxes. The
  footer's **Measurement choices** control reopens them. Existing analytics
  permission does not grant advertising permission.
- Before affirmative consent there is no Google script, preconnect, beacon, analytics
  cookie or denied-consent ping. This is basic consent mode, not advanced mode.
- Only `https://dailywatchfinds.com` can start the provider. Acceptance on previews
  and localhost never contacts GA4. No URL parameter or environment flag overrides it.
- Global Privacy Control or Do Not Track overrides stored acceptance. Rejection is
  synchronized across tabs and on return to a page. The preference and date are stored
  locally for up to 180 days; unavailable, read-only or expired storage fails closed.
  Failed preference writes attempt removal of old permission and a minimal refusal
  cookie, so restored local storage does not revive an old acceptance when that
  cookie is available. The privacy page describes this fallback.
- With analytics-only consent the tag receives denied defaults, then grants only
  analytics storage. `ad_storage` and `ad_user_data` require the separate Ads choice;
  `ad_personalization` always stays denied. Google Signals and
  ad-personalization signals are false; URL passthrough is false and ads redaction true.
- The adapter requests host-only root-path GA cookies, 30-day expiry and no expiry
  extension on every hit. GA may use pseudonymous identifiers and request metadata;
  the data is not anonymous. No custom user ID or user properties are sent.
- Rejecting stops listeners and pending sends, sets Google's documented
  `ga-disable-G-LSGXWGSM9T` flag before the denied consent update, removes the script
  element and expires accessible `_ga` / `_ga_*` cookies. The enabled shared
  adapter reloads the document on permission changes to unload the running SDK;
  script removal alone does not unload it. A cookieless consent-status signal may
  occur, and in-flight requests cannot be recalled. A still-accepted purpose can
  start on the refreshed page, with one manual GA4 view per document and no replay.
- Provider failure/timeout drops data without retries. Up to 20 intentional clicks
  after consent may wait in memory while the tag loads, for at most eight seconds.
  They are discarded on failure or withdrawal. Nothing before consent is replayed.

## Events and data minimization

`send_page_view: false` prevents the configuration command's automatic view; the
adapter sends one manual `page_view` per document after the tag loads. The only
other event this site explicitly sends is `outbound_amazon_click`.

| Custom click field | Allowed source |
| --- | --- |
| `model` | Exact catalog reference |
| `page` | Generated canonical path, no query/fragment |
| `placement` | `catalog_card`, `related_card`, `product_primary`, `product_details`, `product_mobile`, `comparison_pick`, `comparison_final` |
| `destination_type` | `direct_product` or `model_search` |
| Optional `utm_source` | `google` |
| Optional `utm_medium` | `cpc` |
| Optional `utm_campaign` | `first50` |
| Optional `utm_content` | `comparison` |

These campaign values describe a review-only traffic plan, not a launched campaign.
Duplicate or unapproved values are omitted. GA's standard campaign fields also use
only those values or fixed direct/not-set labels; arbitrary IDs and terms are not
forwarded. Canonical page location and a fixed title are explicitly set before
configuration and on each event. Referrer is always empty and ignored. No raw
referrer, query, hash, search input, destination URL, email, click ID or form data
is sent by the event code. The external script uses `no-referrer`.

The adapter reconstructs click dimensions from the catalog and discards extra
caller fields. Each intentional repeated/keyboard/middle activation is one click;
listener initialization is idempotent. Native links are never cancelled or delayed.
They remain usable when JavaScript, consent code or Google is blocked or fails.
GA itself may produce standard session/engagement bookkeeping after consent; these
must not be presented as purchases or unique qualifying customers.

## Dashboard settings and release validation

1. Keep **all Enhanced Measurement off** (the account operator confirmed this before PR #6 released), including automatic page views/history
   changes and outbound clicks. `send_page_view: false` alone does not disable
   Enhanced Measurement history events; automatic `click` would also overlap the
   custom Amazon event. Recheck the approved stream if duplicate events appear.
2. Keep optional data sharing, Google Signals, user-provided data, granular device/
   location collection and ad personalization off. Do not link Ads or other products.
   These are dashboard settings; code tests cannot prove their current values.
3. Keep follow-up PRs draft until the code, applicable privacy wording and preview
   evidence have been reviewed. The production-only guard intentionally prevents preview pollution.
4. After an approved production release, inspect real requests with one consenting
   test browser. Verify one page view, the named custom event/fields, clean URLs,
   denied ad consent when Advertising measurement is unchecked, no automatic
   outbound duplicate, and withdrawal. Confirm the
   events in GA4 Realtime/DebugView before claiming collection works. Request success
   or mocked tests alone are not dashboard delivery evidence.
5. Amazon reports remain the source of orders, shipped qualifying items, returns and
   commissions. Never mark an outbound click as a purchase or infer affiliate sales
   from GA4. No purchase or revenue is emitted. A separate Ads opt-in allows
   the approved Secondary outbound-click conversion, never a purchase conversion.

## Reproducible verification

`npm run build && npm test` checks the event contract, consent, adapter, failure and
site output. `node test/ads-browser.cjs` tests the actual activation configuration,
including analytics-only payloads and independent withdrawal.
`node test/consent-browser.cjs` builds an isolated Ads-disabled rollback copy at a simulated
production origin and intercepts every request with a mock tag. It checks consent,
cookies, request gating, sanitization, revocation, cross-tab changes, GPC/DNT,
provider failure, preview exclusion and native navigation without sending data to
Google or Amazon. `node test/browser.cjs` checks local layout and the existing flow.
Neither browser test establishes real GA4 collection. Edit `src/`, then rebuild.

Official implementation references (reviewed October 13, 2026):
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/security/guides/privacy
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://developers.google.com/analytics/devguides/collection/ga4/views

## Separate Ads opt-in activation proposal

This branch sets `advertising.enabled` to true for the already-reviewed shared
adapter, still restricted to known pages on `https://dailywatchfinds.com` and
explicit per-purpose consent. Previews and localhost never send production events.
The live main branch remains disabled until this proposal is separately reviewed
and released. Both GA4 ID/event fields and Ads destination/account settings are
preserved. No account link, conversion import, new real conversion test or paid
campaign is part of this PR. See [ads-activation-review.md](ads-activation-review.md).
