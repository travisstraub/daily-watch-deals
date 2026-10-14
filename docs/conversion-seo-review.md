# Comparison conversion and SEO review

Baseline: production merge `c33c256c96aae54e229f2f45dcc3263cc59320cb`.
This follow-up remains a draft for release review. No ads or paid services were
launched. The $50 advertising plan remains review-only, with Amazon paid-traffic
eligibility still requiring clarification. No improvement in rankings, affiliate
click rate or qualifying sales has been measured or promised.

## Finding and changes

On a fresh local visit at 1165×747, the baseline's consent notice was 212px high
and the two comparison Amazon buttons began at 1,026px. The revised notice is
148px high, and both buttons span 621–670px, inside that viewport before any consent
choice. Accept and Reject retain identical size and styling. The 390px layout
shows the first choice in the initial viewport; the second follows naturally
below it. Both choices remain accessible without consenting.

The heading now leads directly to the smaller/lighter versus world-time/timer
tradeoff. Exact references, bands and manufacturer weights distinguish the picks.
The sourced comparison, original relative-scale diagram and research limitations
remain. A second pair of model-labelled Amazon links follows the final buying
checks and a repeated affiliate disclosure. `comparison_final` is an allowlisted
click placement, not a sale event. No provider or consent lifecycle changed.

The Casio titles and descriptions now state the exact reference and relevant fit/
feature questions without repeating the F-91W name. Both guides link contextually
to the comparison. The digital hub links to it directly, and each guide links to
its corresponding style hub alongside its existing relevant alternative cards.
Comparison breadcrumb data describes Home → Digital watches → Comparison.

## Technical audit

- All 41 indexable pages have unique, nonempty titles and descriptions, one h1,
  canonical URLs and matching sitemap entries. Static internal links and fragment
  targets resolve. No indexable page has `noindex`; the 404 does.
- `robots.txt` allows crawling and points to the existing sitemap. Sitemap,
  robots, canonical paths, and the exact 53-byte ownership file are unchanged.
- All 267 Amazon anchors retain their catalog destination, `straubmediagr-20`,
  `sponsored nofollow noopener`, disclosure and event metadata. Seven models retain
  evidence-approved ASIN destinations; 23 uncertain references remain searches.
- No Offer, Product, Review or AggregateRating markup was added. Existing ItemList
  and breadcrumb data and the new comparison breadcrumb match visible content.
- Operator Search Console findings on October 13: sitemap Success, 41 discovered
  pages; homepage and canonical trailing-slash comparison indexed; both Casio
  guides discovered but not crawled. The earlier sitemap error cleared without a
  code fix or resubmission. No speculative indexing changes or repeated requests.

The contextual anchors follow [Google's crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
The comparison is not a single product with offers or ratings; no eligibility for
[Google product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
is claimed.

## Verification

- `npm run build` and `npm test`: 36 tests pass. Assertions cover exact links/tags,
  disclosure, final CTA placement and repeat clicks, failure isolation, consent,
  metadata, structured data, canonicals, sitemap and ownership-file preservation.
- `node test/conversion-browser.cjs http://127.0.0.1:4180`: pass at 1165×747,
  390×900 and 320×800. No page overflow; equal consent button dimensions with at
  least 44px height; keyboard skip/consent/settings focus; named model links;
  zero external requests on the image-free comparison.
- `node test/browser.cjs http://127.0.0.1:4180 /tmp/dwf-conversion-regression`:
  pass across home, comparison, AE-1200 guide, digital hub and privacy at 1440px
  and 390px. Ten Amazon navigations were intercepted locally. Repeated, keyboard,
  middle and final-placement events behave correctly; failed senders and disabled
  JavaScript preserve navigation. No real affiliate traffic was generated.
- `node test/consent-browser.cjs /tmp/dwf-conversion-consent`: pass with local
  files and a mocked Google tag, including two final-placement clicks without
  duplicates. Before consent and after rejection: zero Google requests. Also tests
  withdrawal, GPC/DNT, blocked/pending provider, unavailable storage, cross-tab
  rejection and preview-origin blocking. This does not prove live GA4 delivery.
- Manual visual inspection: desktop opening view and final choices, 390px opening
  view and final choices. Reports and screenshots: [evidence](../planning/evidence/conversion/).

Remaining release checks: authenticated preview review if accessible, real-origin
consent/network behavior after a separately approved release, and actual GA4
Realtime/DebugView receipt. The execution environment previously denied external
Vercel/site requests via its proxy; that is not evidence of a site defect. Detailed
Vercel scoped reads were denied, and no broader access or credentials were created.
Manufacturer image loads also fail from this environment; image availability on
production is not established by these local tests. No production release is
included in this PR.
