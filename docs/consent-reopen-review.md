# Homepage footer reopening — narrow fix for review

Base production commit: `06861c46a0d0cb9fbc6ddf9f45079598847e6cf1`.
This candidate is prepared locally. Do not merge or deploy it before review.

## Reproduction and cause

With both measurement purposes rejected, load the homepage, use Ctrl+End to reach
the footer, and click Measurement choices. The panel reopens but the page above
it is blank. Local Chromium reproduced this at 1165 × 747, 1440 × 900, 390 × 844
and 320 × 568. The comparison page passed the same baseline checks.

The homepage contains absolutely positioned `.sr-only` text, including the
comparison table caption. Because the open `#site-content` scroll area was still
statically positioned, that text remained anchored outside it. On desktop the
caption extended the outer document to 9,207 px; the browser retained an outer
scroll offset of 8,460 px even though the page now scrolled inside a 546 px area.
That put the whole content area above the viewport. The panel stayed visible
because it is fixed to the viewport.

## Fix

Add **`position: relative`** to `.consent-open #site-content`. This makes the page
scroll area the containing block for its absolutely positioned accessibility text.
The outer document now fits the viewport and resets to scroll position zero, while
the existing layout helper preserves the original reading position inside the
page scroll area. No screen-reader text is removed or hidden from accessibility.

This is the only runtime change, in `public/style.css`. All JavaScript, consent
controllers/adapters/defaults, measurement configuration, event rules, generated
HTML, affiliate links, content, privacy wording and Vercel settings are unchanged.

## Evidence

- `npm run build`: PASS. No generated HTML/JavaScript differences.
- `npm test`: **51 passed, 0 failed, 0 skipped**.
- `node test/consent-reopen-browser.cjs`: **16 cases passed** (homepage and
  comparison × four widths × pointer/keyboard activation), plus **32 repeated
  close/reopen cycles**. Assertions verify visible content, a viewport-sized outer
  document, preserved reading position, focus handoff and unchecked choices.
- `node test/initial-keyboard-browser.cjs`: **18/18 fresh-load cases
  passed across homepage and comparison**, plus reverse/Home/End keys, native control handling and document
  scrolling after dismissal. The suite now accepts a page-path argument for reuse
  on the homepage. The homepage run uses `node test/initial-keyboard-browser.cjs
  /tmp/dwf-reopen-home-keyboard /`.
- `git diff --check`: PASS.

All browser requests are fulfilled locally or blocked, with persisted rejection.
Homepage image requests in the reopening suite receive local placeholders. No
measurement request, affiliate request, affiliate-link activation or real
conversion occurs. Screenshot differences show the actual page visibility fix;
they are local test captures, not a deployed preview.

[Baseline report](../planning/evidence/consent-reopen-fix/before.json) ·
[Reopening and cycle results](../planning/evidence/consent-reopen-fix/reopen.json) ·
[Comparison keyboard results](../planning/evidence/consent-reopen-fix/comparison-keyboard.json) ·
[Homepage keyboard results](../planning/evidence/consent-reopen-fix/home-keyboard.json) ·
[Node output](../planning/evidence/consent-reopen-fix/node-tests.txt)

[Before desktop](../planning/evidence/consent-reopen-fix/before-desktop.png) ·
[After desktop](../planning/evidence/consent-reopen-fix/after-desktop.png) ·
[Before mobile](../planning/evidence/consent-reopen-fix/before-mobile.png) ·
[After 390 px](../planning/evidence/consent-reopen-fix/after-mobile-390.png) ·
[After 320 px keyboard](../planning/evidence/consent-reopen-fix/after-mobile-320-keyboard.png)
