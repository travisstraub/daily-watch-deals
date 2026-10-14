# Floating measurement panel — review candidate

Base: production `8f1f21cd152e6815dc2848d221169d842903ce31`.
This is a presentation change for preview review, not production release approval.

The existing measurement section now floats at the bottom with separate Analytics
and Advertising measurement choices. Both remain unchecked for a new visitor.
All consent wording, the consent controller, GA4 and Google Ads adapters, event
rules, account configuration, campaign allowlist and affiliate destinations are
unchanged. No default consent, conversion test or campaign/account change is part
of this work.

## Layout and access

- A local presentation helper measures the visible panel and reserves space for
  it. While open, the page scrolls in the clear area above the panel. Normal page
  scrolling resumes after saving/rejecting, preserving the reading position.
- The existing mobile Amazon bar sits above the panel. The page's scroll area
  also clears that bar, so neither fixed element covers focused shopping links.
- Desktop choices use two columns. Narrow screens stack the explanations with
  equal Save choices / Reject all buttons beside each other. On short screens or
  with enlarged explanatory text, the explanation scrolls while both actions
  remain visible. CSS safe-area insets protect the panel's bottom and side edges.
- No focus trap or initial focus grab is introduced. The skip link, normal
  keyboard flow, existing return focus and footer reopening remain available.
- If the layout module is blocked or observers are unavailable, the section stays
  in normal document flow and the independent consent controller still works.

The build adds a page-content wrapper and a class on the consent explanation,
then copies `src/consent-layout.js` into public output. Main, header and footer
content across all 42 editorial HTML files is byte-identical to production;
consent wording is also unchanged. Sitemap, canonicals, model data, exact ASINs,
affiliate tags and Search Console ownership bytes are preserved.

## Verification

- `npm run build`: PASS; generated HTML and browser modules refreshed.
- `npm test`: **51 passed, 0 failed, 0 skipped**.
- `test/ads-browser.cjs`: PASS, 19 mocked scenarios covering separate grants,
  rejection, persistence, withdrawal, GPC/DNT, failures and native navigation.
- `test/consent-browser.cjs`: PASS, 12 disabled-Ads rollback mock scenarios.
- `test/conversion-browser.cjs`: PASS, including both initial desktop shopping
  buttons above the panel, equal actions and keyboard/footer controls.
- `test/browser.cjs`: PASS, including repeated, middle and keyboard clicks,
  failure paths, JavaScript disabled and ten intercepted Amazon navigations.
- `test/consent-panel-browser.cjs`: PASS at 1165 × 747, 390 × 844, 320 × 568 and
  844 × 390; both comparison and product pages. Checks cover unchecked defaults,
  saved independent choices, reload persistence, unobscured focused shopping
  links, equal visible actions, enlarged explanatory text, footer reopening,
  reading-position preservation and a blocked layout-module fallback.
- `git diff --check`: PASS. The new layout suite recorded no Google measurement
  requests. All conversion scenarios use local mocks/interception; none is a
  real conversion test.

[Reports and test output](../planning/evidence/floating-consent-panel/) include
[desktop](../planning/evidence/floating-consent-panel/desktop.png),
[390 px initial state](../planning/evidence/floating-consent-panel/mobile-390.png),
[390 px shopping link](../planning/evidence/floating-consent-panel/shopping-link-390.png),
[390 px product](../planning/evidence/floating-consent-panel/product-390.png),
[320 px product](../planning/evidence/floating-consent-panel/product-320.png) and
[enlarged text](../planning/evidence/floating-consent-panel/enlarged-text-320.png)
captures. The enlarged-text capture includes a keyboard-selected checkbox as a
test action; it does not depict a new visitor's default state.

Nine manufacturer image URLs were unavailable from the execution environment in
the general navigation suite. This is an existing environment limitation, not an
image change. Preview deployment status and any remote-browser access limitation
will be recorded in the PR; local captures do not prove served preview behavior.
No production merge/deployment or additional real conversion is authorized here.
