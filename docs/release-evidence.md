# First-sales foundation — review evidence

This batch is a draft release. It does not launch advertising, enable a paid service,
collect analytics, merge to main, or claim any sales.

## Changes

- Four new identity-matched ASIN destinations: AE-1200WHD-1AV, Marlin TW2W10400,
  Seiko SUR527 and SRPD51. Seven catalog models now have direct links; 23 keep
  transparent model searches. All affiliate tags remain `straubmediagr-20`.
- `content/amazon-link-evidence.json` records model/variant identity, source URLs,
  evidence freshness, uncertain references and Amazon metadata conflicts. It does
  not claim live price, seller or inventory verification.
- A disabled outbound-click integration with an explicit provider adapter, fixed
  dimensions and exact campaign-value allowlists. No backend or third-party SDK
  exists. `docs/analytics.md` explains the contract, limitations and enablement work.
- A sourced exact-variant F-91W / steel-bracelet AE-1200 comparison and original
  accessible case-size diagrams. No hands-on, discount or live offer claims.
- Stable link placement metadata, regenerated public HTML/browser modules, accurate
  privacy text, and a 390px product-grid overflow fix discovered during verification.
- The traffic plan remains review-only: own-site destination, $50 total nonrecurring
  cap, no auto-renewal, separate visits/clicks/Amazon qualifying-sales measurements.

## Verification

`npm run build && npm test` checks the diagnostic, catalog evidence, every affiliate
anchor/tag/rel/disclosure/placement, canonicals, 41 sitemap entries, internal links
and fragments, copied browser sources, privacy text, dimensions and analytics failure
cases. See the PR for the final test count and commit.

Optional browser check (Playwright 1.62.1 and installed Chromium used here):

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
node test/browser.cjs http://127.0.0.1:4173 /tmp/dwf-browser-evidence
```

The recorded browser run passed home, comparison, AE-1200 product, digital hub and
privacy at 1440px and 390px with no page overflow or JavaScript errors. Filtering,
empty/reset behavior, mobile purchase controls, disabled collection, repeated/keyboard
clicks, middle-click event emission, throwing/rejecting/pending senders, module-load
failure and JavaScript-disabled navigation were checked. Eight Amazon navigations
were intercepted locally, so the tests did not send affiliate clicks to Amazon.
Headless Chromium emitted the middle-click event but did not open a tab; normal
middle-button tab opening remains a manual browser check.

- [Browser report](../planning/evidence/browser-report.json)
- [Desktop comparison](../planning/evidence/comparison-desktop.png)
- [390px comparison](../planning/evidence/comparison-mobile.png)

An initial browser check exposed a 390px product-image grid overflow; the minimum
width fix passed the rerun. A popup assertion for headless middle clicks was narrowed
to the actual observable event, with tab opening explicitly left unverified.

## Limits and release gates

- Several existing manufacturer image requests fail in this environment's restricted
  network (listed in the browser report). Layout and the self-contained comparison
  diagrams were checked; deployed image delivery needs a browser with network access.
- No live analytics collection was tested or enabled. All event tests use fake,
  in-memory senders. Clicks never establish orders, revenue or qualifying sales.
- Review the exact draft commit and its Vercel build. Remote previews may require
  existing Vercel authentication. Do not disable protection or create credentials.
- Before any production release of this batch: inspect the authenticated preview at
  desktop and 390px, verify images and the four new destination variants, and approve
  the release evidence. After release, recheck canonical/sitemap/robots, disclosure,
  direct links, mobile layout and the disabled configuration on the production domain.
- The separately approved Search Console file was released through isolated PR #5.
  Preserve it through future builds; ownership verification is handled by the parent.
