# Outbound click integration — disabled

No analytics provider/account or approved backend exists in this repository. No
third-party tracking was installed. `src/analytics-config.js` sets `enabled: false`
and `send: null`; visitors' clicks are not collected, stored or queued. The app
loads only this local configuration while disabled, not the event module/catalog.
Search/filter choices stay in the browser. Hosting and manufacturer image requests
remain covered by the privacy page.

The future flow is an ordinary Amazon anchor activation → validated event → an
explicitly configured sender. Anchors continue working with JavaScript disabled,
module-load failure, a missing sender, a synchronous exception, a rejected promise,
or a sender that never settles. There are no retries or delayed redirects. The
future sender must be nonblocking and return promptly (optionally a promise).

## Event contract

`outbound_amazon_click` has these fields:

| Field | Allowed source |
| --- | --- |
| `event` | Literal `outbound_amazon_click` |
| `model` | Exact reference from the generated watch catalog |
| `page` | Generated canonical path, with no query or fragment |
| `placement` | `catalog_card`, `related_card`, `product_primary`, `product_details`, `product_mobile`, `comparison_pick` |
| `destination_type` | `direct_product` or `model_search` |
| Optional `utm_source` | `google` |
| Optional `utm_medium` | `cpc` |
| Optional `utm_campaign` | `first50` |
| Optional `utm_content` | `comparison` |

These campaign values describe the existing review-only traffic-plan URL; they do
not authorize or activate advertising. Missing, duplicate or unapproved parameter
values are omitted. No arbitrary query strings, UTM terms, click IDs (including
gclid/fbclid), destination URLs, referrers, search text, user/session identifiers,
timestamps, cookies or browser storage enter the event. Campaign dimensions apply
only to the current page; there is no cross-page persistence or cross-device identity.

Only catalog-matched Amazon destinations with the existing `straubmediagr-20` tag
qualify. Left clicks, keyboard activations and middle clicks are supported.
Repeated intentional activations each produce one event; installing the listener
twice does not double-count. Synthetic events, right clicks and already cancelled
events are ignored. The return value from installation removes the listeners.

## Before enabling

1. Select and approve a provider/account, destination, retention and consent design.
   Confirm what request metadata the provider receives; a minimal payload alone
   cannot prevent a server from receiving IP/browser information.
2. Implement a nonblocking `send(event)` adapter and its consent gate. Preserve the
   field/value allowlist; do not add automatic page-view tracking, identifiers or
   third-party SDKs without review. No endpoint is provided by this batch.
3. Review accurate privacy text alongside that actual behavior, then change the
   source configuration and rebuild. There is deliberately no environment or URL
   flag that silently enables collection.
4. Verify receipt using the approved backend and preview, including navigation and
   sender failure; record evidence before release. Current tests use an in-memory
   fake sender and do **not** establish live analytics collection.

An event measures an outbound activation, not an arrival, unique visitor, checkout,
order, shipped item or qualifying sale. Only Amazon reporting establishes sales,
returns and commissions. No purchase conversion or revenue event is emitted.

Run `npm run build && npm test`; browser verification is described in the release
evidence. Edit `src/` and `content/`, then rebuild their generated `public/` files.
