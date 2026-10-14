# Editorial work

Read `planning/traffic-plan.html` before changing acquisition or affiliate content. Edit `content/watches.json`, `scripts/build.mjs` and `scripts/comparison.mjs` as appropriate, then regenerate `public/` with `npm run build`. The root `index.html` and `deals.json` are legacy files, not the current build inputs.

The standing editorial standard is Unslop Full: make a strong, natural rewrite of prose, with concrete nouns, varied rhythm and a clear point of view. Remove stock filler, repetitive lists, hedging stacks and performative balance. Keep useful uncertainty and the writer’s substantive opinion. Do not invent enthusiasm, personal history or hands-on experience. Use conversational contractions where they fit. Review the draft again for repetitive phrasing and a flattened voice.

Apply this standard to extracted natural language, then reintegrate it into the correct source fields. Do not pass HTML, JavaScript, JSON or CSS files through a prose humanizer. An assistant-authored conversational pass is valid; report the actual method and do not claim CLI/API execution that did not happen.

Preserve facts, exact technical terms, model/variant names, numbers, dates, URLs, headings, source substance and required disclosures. Use Auto-Clarity for legal, compliance, financial and safety text: literal wording and accurate qualifications take priority over style. Flag unsupported claims separately instead of filling gaps with plausible details. Watch guides are based on published information, not hands-on reviews. Never invent prices, discounts, availability or sales. Outbound clicks are not qualifying purchases.

For a content-only pass, preserve layout, affiliate destinations and tags, consent choices and measurement behavior. Review all indexable pages, the 404 page, shared UI states, titles and metadata. Explain unchanged fields in a coverage record. After rewriting, audit the result separately against the original copy and source evidence, and address findings before submitting it.

Run the build, `npm test`, offline link checks and suitable desktop/mobile browser checks. Browser verification must not activate Amazon links or send real conversion events. Existing suites that click affiliate anchors are not suitable for this restriction even when they mock navigation; choose read-only layout checks instead. Clearly distinguish local/mocked checks from deployed-browser verification.

Prepare a reviewable draft PR with coverage, before/after examples and verification limits. Production release requires the project owner’s review of release evidence. Do not launch advertising, incur ad spend or enable paid services as part of editorial work.
