# Sitewide Unslop Full editorial review

This pass replaces vague catalog language with the feature or choice each reader needs to assess. It covers all 41 indexable pages, the 404 page, shared UI and metadata. It changes prose and generated HTML, adds review evidence and a read-only browser check, and records the standing editorial requirement in `AGENTS.md`. Application behavior, layout markup and CSS are unchanged.

Baseline: `36462baedec5e0d7c2241508b29c43359e3bc66c`. This is an assistant-authored conversational Full pass using the supplied Unslop 0.7.0 guidance. No Unslop CLI, API or `humanize.py` was run. Prose was rewritten in individual source fields, then reviewed against the original text and existing manufacturer-linked records. The separate audit pass was performed by the same assistant; it is not an external independent review.

## Coverage and retained text

The [coverage manifest](editorial-coverage.json) lists each route, source, metadata result and retained-field reason. It records all 30 catalog entries individually, including the nine prose fields retained as written. Of the 90 `intro`, `why` and `tradeoff` fields, 81 changed. Descriptions changed on 33 pages; all titles and headings were preserved exactly.

| Pages | Treatment |
| --- | --- |
| Home | Rewrote the introduction, guide promotion and editorial explanation; catalog cards inherit revised product text. |
| 30 product guides | Rewrote model-specific introductions, reasons to choose and tradeoffs; shortened the shared pre-purchase paragraph. |
| Five style hubs | Rewrote each introduction and choosing advice; preserved style headings and category membership. |
| Popular watches | Rewrote introduction and listing guidance. Kept the dated manufacturer-popularity method and its ranking limitations. |
| Buying guide | Rewrote fit, upkeep, strap, offer and decision advice. Kept headings and literal technical explanations that were already clear. |
| Comparison | Rewrote fit and choice guidance without changing the quick verdict, choice cards, exact variants, specification table or original diagram. |
| About | Rewrote purpose and selection method; fixed a missing “or” in the non-endorsement statement. |
| Privacy | Reviewed under Auto-Clarity. Main policy text remains byte-for-byte unchanged in its generated main element. Only shared page copy changed. |
| 404 | Rewrote the missing-page message; retained its heading, noindex and return link. |
| Shared UI and metadata | Rewrote the topline and footer slogan. Reviewed all labels, descriptions, titles, alt text and consent states. |

Retained material has a reason:

- Exact names, headings, labels, dates, model specifications, source URLs, image descriptions and factual catalog fields are protected by the request. All catalog fields other than the three prose fields are unchanged.
- Affiliate disclosures, the legal footer, privacy/consent text and water-use qualifications use Auto-Clarity. Their precision matters more than stylistic variation. The required Amazon Associate disclosure is unchanged everywhere.
- Navigation, buttons, filters, result counts, search states and image-failure messages are already short functional labels. Their names and behavior remain unchanged.
- Six product introductions already describe a concrete feature concisely. Three water-related tradeoffs retain their original qualifications. The manifest identifies each one.
- The comparison’s quick choice, specification table, decision cards and sourced diagram already give a direct answer. Its lists compare distinct decisions; product lists contain specifications. Their structure remains useful, and changing it would violate the requested layout preservation.
- Unchanged metadata consists of exact model/specification summaries or concise page-purpose labels. Generated descriptions from revised prose changed where applicable. No title, canonical, Open Graph URL or structured-data object changed.
- Legacy root `index.html` and `deals.json`, the ownership-verification file, internal plans and historical release documents are outside live editorial copy. They are unchanged.

## Before and after

| Location | Before | After |
| --- | --- | --- |
| Citizen Tsuyosa introduction | A little color. A lot of character. | A green dial with an automatic movement behind it. |
| Citizen Brycen introduction | A weekend watch with useful details. | An ivory dial on brown leather, powered by light. |
| Seiko SRPD51 introduction | Blue dial. Mechanical character. | A blue sunray dial and a rotating bezel. |
| Timex Marlin hand-wound tradeoff | Choose quartz if you want convenience above all. The small case can look very different from modern sports watches, so compare dimensions before ordering. | If that winding routine sounds like a chore, choose quartz. Compare dimensions before ordering: the small case can look very different from a modern sports watch. |
| Buying guide opening | You don’t need to become a collector to make a considered choice. Start with the way you want a watch to fit into your day. | Start with a watch you already like wearing. Its size tells you more than a product photo. From there, decide how much upkeep you want and what you’re willing to spend. |
| Comparison, second time zone | the AE-1200 gives that task a dedicated function. If you only need local time, consider whether you want its extra modes. | the AE-1200 has a dedicated world-time function. If you only need local time, you may have little use for those extra modes. |

## Audit findings addressed

The self-review checked for repeated sales language, vague “character” claims, unnecessary hedging and wording that made a factual qualification stronger. The subsequent source audit checked the revised prose against the originals and the protected product records.

- Removed the SRE004 claim that its size is “often dominated by quartz watches.” The existing evidence did not establish market prevalence. Its 28 mm size, mechanical movement and day/date display remain.
- Replaced the SSB429’s generalized steel-bracelet versatility claim with a reader preference between steel and rubber.
- Restored literal water-use guidance under Auto-Clarity. Preserved uncertainty about appearance, radio reception and resetting an unworn automatic.
- Clarified that the F-91W’s 21 grams refers to the watch, not the case alone.
- Corrected the missing conjunction in About’s non-endorsement statement.

No manufacturer research date was advanced. This was an audit against existing source records, not a new live specification, popularity, price or inventory investigation. No product experience, discount, sale or new market-ranking evidence was invented. The current advertising and consent configuration is unchanged.

## Verification

All checks below passed on the revised build. Reports and representative screenshots are in [evidence/editorial](evidence/editorial/).

| Check | Result |
| --- | --- |
| `npm run build` | 42 editorial pages generated; ownership file retained. |
| `npm test` | 51 passed, 0 failed. Includes offline destination/tag/rel/disclosure checks, internal links/fragments, sitemap/canonicals, source copying, consent and failure-path unit tests. |
| Baseline HTML/source audit | All 42 pages retain element structure and attributes except permitted description text; all 267 affiliate anchors unchanged. Headings, tables, diagrams, specification lists, structured data, consent copy and every non-HTML public asset are unchanged. |
| `node test/editorial-browser.cjs /tmp/dwf-editorial-browser` | 84 page/viewport checks: all 42 pages at 1440×900 and 390×844. No page/main overflow; footer reachable; unchecked independent choices; no JavaScript errors. |
| `node test/conversion-browser.cjs http://127.0.0.1:4185 /tmp/dwf-editorial-conversion` | Comparison at 1165×747, 390×900 and 320×800; desktop primary links clear consent panel; equal choice geometry, accessible exact-model labels, keyboard focus and final links. No affiliate activation. |
| `node test/initial-keyboard-browser.cjs /tmp/dwf-editorial-keyboard` | Nine fresh comparison scrolling cases and control/persistence checks passed at 1165px, 390px and 320px. |
| `node test/initial-keyboard-browser.cjs /tmp/dwf-editorial-keyboard-home /` | Nine fresh home scrolling cases and control/persistence checks passed at the same widths. |
| `node test/consent-reopen-browser.cjs /tmp/dwf-editorial-reopen` | 16 pointer/keyboard reopening cases and 32 repeat cycles, home/comparison at 1165px, 1440px, 390px and 320px. |
| `git diff --check` | Passed. |

To reproduce the baseline audit, extract `scripts`, `content`, `src` and `public` from baseline commit `36462baedec5e0d7c2241508b29c43359e3bc66c` into a temporary directory, then run `python docs/evidence/editorial/audit.py BASELINE_DIRECTORY`. It regenerates the coverage manifest. The layout suite uses a local server started with `python -m http.server 4185 --bind 127.0.0.1 --directory public`.

Screenshots were inspected for home, product, comparison, hub and guide text wrapping. Manufacturer images were mocked in the all-page browser sweep; image availability was not tested. Tests served local build files or blocked external requests. No Amazon links were activated and no real measurement or conversion request was sent. Suites that activate affiliate links, the live Amazon API diagnostic and real Ads/GA validation were deliberately not run.

## Release status and remaining verification

This is a draft-PR review candidate. It is not authorized for production merge or deployment. The PR records the exact commit and Vercel preview status/URL once available. Vercel build success is separate from a deployed-browser check.

Direct deployed-page inspection from this execution environment has been blocked by the network proxy, and the connector’s scoped Vercel reads are denied. No credential creation or access workaround is part of this pass. An ordinary authorized browser should inspect the exact preview before release: home, product, comparison, guide and privacy at desktop and 390px; verify changed text, scrolling and consent reopening without clicking Amazon or enabling real measurement. After owner approval and production release, repeat those read-only checks on the production domain and confirm canonical/sitemap/ownership output against the approved commit.
