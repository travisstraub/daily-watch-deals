// Look-alike comparisons: one style, several brands. Every spec here comes from the manufacturer page linked
// in content/watches.json (reviewed October 17, 2026). Write "Not listed" rather than filling a gap.
const NA = 'Not listed by the maker';

export const lookalikes = [
  {
    slug: 'tissot-prx-alternatives',
    style: 'everyday',
    title: 'Tissot PRX alternatives: integrated-bracelet watches compared',
    h1: 'Tissot PRX or a Citizen?',
    crumb: 'Tissot PRX alternatives',
    description: 'Compare the Tissot PRX Powermatic 80 with Citizen’s Tsuyosa and titanium Zenshin: three automatic, integrated-bracelet sports watches, spec by spec.',
    hub: 'The integrated-bracelet look: Tissot PRX against Citizen’s Tsuyosa and Zenshin.',
    eyebrow: 'INTEGRATED-BRACELET SPORTS WATCHES',
    verdict: 'PRX for the 80-hour power reserve and a published 10.93 mm case. Tsuyosa for the same 40 mm width and integrated look from Citizen. Zenshin for titanium and 100 m of water resistance.',
    intro: 'The PRX is the best-known affordable take on the slim steel sports watch with a built-in bracelet, and Citizen makes two of its own. All three are automatics with sapphire crystals and bracelets that flow straight out of the case, so the choice comes down to metal, water rating and how long each runs off the wrist.',
    rows: ['Movement', 'Power reserve', 'Case', 'Crystal', 'Water resistance', 'Bracelet'],
    picks: [
      { slug: 'tissot-prx', head: 'Swiss automatic · 40 mm · Steel', line: 'The watch the others are measured against. It has the longest power reserve here and the only published case thickness.',
        specs: ['Swiss automatic Powermatic 80, Nivachron balance spring', 'About 80 hours', '40 × 39.5 mm, 10.93 mm thick, 316L steel', 'Sapphire with anti-reflective coating; see-through caseback', '100 m', 'Integrated steel, quick-release'], final: 'Choose the longest power reserve.' },
      { slug: 'citizen-tsuyosa', head: 'Automatic · 40 mm · Steel', line: 'The same 40 mm width and the same integrated-bracelet idea. Citizen rates it to 50 m, half the PRX’s figure, and lists a 42-hour reserve.',
        specs: ['Caliber 8210 automatic', '42 hours', '40 mm, stainless steel (thickness not listed)', 'Anti-reflective sapphire', '50 m', 'Integrated matching steel bracelet'], final: 'Choose the 40 mm Citizen.' },
      { slug: 'citizen-zenshin', head: 'Automatic · 40.5 mm · Titanium', line: 'Swap steel for Citizen’s Super Titanium, case and bracelet alike, and keep the PRX’s 100 m rating.',
        specs: ['Caliber 8213 automatic with hacking seconds and date', NA, '40.5 mm Super Titanium', 'Sapphire', '100 m', 'Integrated matching Super Titanium bracelet'], final: 'Choose titanium and 100 m.' }
    ],
    criteria: [
      ['If you rotate watches', 'the PRX’s roughly 80-hour reserve can carry it over a weekend in a drawer. The Tsuyosa’s 42 hours may not.'],
      ['If you swim with it', 'the PRX and Zenshin are both rated to 100 m, the Tsuyosa to 50 m. Follow each maker’s water guidance rather than the number alone.'],
      ['If you want titanium', 'only the Zenshin uses it. The PRX and Tsuyosa are steel.'],
      ['If case height matters', 'Tissot publishes 10.93 mm for the PRX. Citizen doesn’t list a thickness for either of its watches, so try them on or compare listings before you order.'],
      ['If you’ll size the bracelet yourself', 'an integrated bracelet is shaped to its case, so an ordinary strap usually won’t fit. Tissot mentions a quick-release on the PRX; check the Citizen listings for how theirs come off.']
    ]
  },
  {
    slug: 'dive-watches-compared',
    style: 'sport',
    title: 'Dive-style watches compared: Seiko, Orient, Citizen and Timex',
    h1: 'Four dive watches, four brands',
    crumb: 'Dive-style watches compared',
    description: 'Seiko 5 Sports SRPD51, Orient Kamasu, Citizen Promaster Diver and Timex Deepwater Meridian 200: rotating bezels, 100 m to 200 m, automatic, solar or quartz.',
    hub: 'Rotating bezels from Seiko, Orient, Citizen and Timex, automatic to solar.',
    eyebrow: 'DIVE-STYLE WATCHES',
    verdict: 'Kamasu for 200 m with sapphire and an automatic movement. Promaster Diver if you never want to wind or replace a battery. Deepwater Meridian 200 for a 38 mm case. SRPD51 for the classic Seiko 5 Sports look on a bracelet.',
    intro: 'Each of these has a one-way rotating bezel for timing a dive and the bold, legible dial that goes with it. Under that shared style they run on three different power sources and carry two different water ratings.',
    rows: ['Power', 'Case', 'Crystal', 'Water resistance', 'Bezel', 'Strap'],
    picks: [
      { slug: 'orient-kamasu', head: 'Automatic · 41.8 mm · 200 m', line: 'The only automatic here with a sapphire crystal and a 200 m rating. Orient lists a screw-down crown and a 120-click bezel.',
        specs: ['In-house F6922 automatic, day and date, about 40 hours', '41.8 mm steel, 12.8 mm thick, 46.8 mm lug to lug', 'Sapphire', '200 m', '120-click, unidirectional', 'Steel bracelet'], final: 'Choose 200 m with sapphire.' },
      { slug: 'seiko-srpd51', head: 'Automatic · 42.5 mm · 100 m', line: 'The familiar Seiko 5 Sports diver look, with a see-through caseback. It has a Hardlex crystal and half the Kamasu’s rating.',
        specs: ['4R36 automatic with manual winding, day and date', '42.5 mm steel, 13.4 mm thick', 'Hardlex', '100 m', 'Unidirectional rotating', 'Steel bracelet'], final: 'Choose the Seiko 5 Sports look.' },
      { slug: 'citizen-promaster-diver', head: 'Eco-Drive solar · 44 mm · 200 m', line: 'Charged by light, so there’s nothing to wind. Citizen rates it for scuba diving. It’s the largest case here.',
        specs: ['E168 Eco-Drive, powered by light', '44 mm steel, 20 mm lug width', 'Anti-reflective mineral', '200 m (scuba)', 'One-way rotating elapsed-time', 'Polyurethane strap'], final: 'Choose light-powered and 200 m.' },
      { slug: 'timex-tw2y40400', head: 'Quartz · 38 mm · 200 m', line: 'A compact 38 mm diver with a sapphire crystal and Super-LumiNova on the hands and markers.',
        specs: ['Quartz', '38 mm steel', 'Anti-reflective sapphire', '200 m', 'Unidirectional ratcheting', 'HNBR rubber strap'], final: 'Choose the smallest case.' }
    ],
    criteria: [
      ['For the smallest wrist footprint', 'the Timex is 38 mm, against 41.8 mm to 44 mm for the others. We found a published thickness only for the Orient and Seiko.'],
      ['If you don’t want to think about power', 'the Citizen charges from light and the Timex runs on quartz. The two automatics need wear or winding and stop after roughly two days off the wrist.'],
      ['For water rating', 'three are rated to 200 m and the SRPD51 to 100 m. A rating isn’t blanket permission for every water activity; follow the maker’s guidance.'],
      ['For crystal', 'the Kamasu and Timex use sapphire, the Seiko Hardlex and the Citizen mineral glass. Sapphire is known for scratch resistance; none makes a watch indestructible.'],
      ['Bracelet or strap', 'the Seiko and Orient come on steel bracelets, the Citizen on polyurethane and the Timex on rubber.']
    ]
  },
  {
    slug: 'field-watches-compared',
    style: 'everyday',
    title: 'Field watches compared: Seiko 5 Sports Field vs Timex Expedition and MK1',
    h1: 'Three field watches, two takes',
    crumb: 'Field watches compared',
    description: 'Compare military-inspired field watches: the Seiko 5 Sports SRPJ85 automatic, the Timex Expedition Field Post Solar and the Timex MK1 Automatic.',
    hub: 'Military-style field watches from Seiko and Timex: automatic or solar.',
    eyebrow: 'FIELD WATCHES',
    verdict: 'Field Post Solar for a 36 mm case, sapphire and no battery changes. SRPJ85 for an automatic with day/date and 100 m. MK1 Automatic for a 40 mm case and a view of the movement.',
    intro: 'Field watches come from military-issue designs: a plain dial, big Arabic numerals, often a 24-hour scale, and a strap rather than a bracelet. Seiko says the SRPJ85 is inspired by vintage field and aviator watches; Timex calls the Field Post a classic field watch and gives the MK1 a classic military look. They share the look but differ in size, power and crystal.',
    rows: ['Movement', 'Case', 'Crystal', 'Water resistance', 'Dial', 'Strap'],
    picks: [
      { slug: 'timex-tw2v00200', head: 'Solar · 36 mm · Sapphire', line: 'The compact one. Timex scaled down its larger Field Post Solar to 36 mm and added a sapphire crystal.',
        specs: ['Solar', '36 mm', 'Sapphire', '100 m', 'Black, full Arabic numerals', '18 mm leather'], final: 'Choose solar in 36 mm.' },
      { slug: 'seiko-srpj85', head: 'Automatic · 36.4 mm · Day/date', line: 'An automatic of nearly the same width, with a 13–24 hour military scale on the dial and a day/date window.',
        specs: ['4R36 automatic with manual winding', '36.4 mm, 44.4 mm long, 12.5 mm thick', 'Curved Hardlex', '100 m', 'Black, 13–24 hour scale, day/date', 'Nylon'], final: 'Choose the automatic with day/date.' },
      { slug: 'timex-tw2y07800', head: 'Automatic · 40 mm · Exhibition back', line: 'The largest and most traditional-looking, with a domed acrylic crystal and a blue-tinted window onto its Japanese automatic movement.',
        specs: ['Japanese automatic, exhibition caseback', '40 mm steel', 'Domed acrylic', NA, 'Black, 12 and 24-hour numerals', '20 mm Cordura fabric, leather backing'], final: 'Choose the 40 mm automatic.' }
    ],
    criteria: [
      ['For a small wrist', 'the Field Post and SRPJ85 are about 36 mm across. The MK1 is 40 mm.'],
      ['If you don’t want to wind or wear it daily', 'the Field Post charges from light. Both automatics stop if left unworn long enough.'],
      ['For scratch resistance', 'only the Field Post has sapphire. The SRPJ85 uses Hardlex, and the MK1’s domed acrylic gives a vintage look but scratches more easily.'],
      ['For water', 'Timex and Seiko rate the Field Post and SRPJ85 to 100 m. We didn’t find a rating for the MK1 Automatic on the page we used, so check the listing.'],
      ['For changing straps', 'all three come on straps, not bracelets. Lug widths are 18 mm for the Field Post and 20 mm for the MK1; we haven’t confirmed one for the SRPJ85.']
    ]
  },
  {
    slug: 'dress-watches-compared',
    style: 'dress',
    title: 'Classic dress watches compared: Orient Bambino, Seiko Cocktail Time and Timex',
    h1: 'Four classic dress watches',
    crumb: 'Dress watches compared',
    description: 'Compare round dress watches on leather: Orient Bambino V7, Seiko Presage Cocktail Time SRPK15, Timex Waterbury Classic and the hand-wound Timex Marlin 1965.',
    hub: 'Round dress watches on leather from Orient, Seiko and Timex.',
    eyebrow: 'CLASSIC DRESS WATCHES',
    verdict: 'Bambino for a domed crystal and an automatic in 38.4 mm. Cocktail Time for a 40.5 mm automatic with a box-shaped crystal. Waterbury for quartz with day/date. Marlin 1965 for a 34 mm hand-wound watch.',
    intro: 'A plain round case, a clean dial and a leather strap: all four follow the same formula. The differences are in movement, size and crystal.',
    rows: ['Movement', 'Case', 'Crystal', 'Water resistance', 'Strap'],
    picks: [
      { slug: 'orient-bambino-v7', head: 'Automatic · 38.4 mm · Domed crystal', line: 'The domed crystal is the signature. Orient’s in-house automatic hand-winds and hacks, and you can see it through the caseback.',
        specs: ['In-house F6724 automatic, hand-winding and hacking, about 40 hours', '38.4 mm steel, 12.5 mm thick, 44 mm lug to lug', 'Domed mineral', '30 m', '20 mm leather'], final: 'Choose the domed-crystal automatic.' },
      { slug: 'seiko-srpk15', head: 'Automatic · 40.5 mm · Box crystal', line: 'A larger automatic with a box-shaped crystal and a see-through caseback, rated to 50 m.',
        specs: ['Caliber 4R35 automatic, about 41 hours', '40.5 mm steel, 11.8 mm thick, 47.5 mm long', 'Box-shaped Hardlex', '50 m', '20 mm brown leather'], final: 'Choose the 40.5 mm automatic.' },
      { slug: 'timex-waterbury', head: 'Quartz · 40 mm · Day/date', line: 'Quartz, so it keeps running in a drawer. It has Roman numerals on a cream dial and an 11 mm case.',
        specs: ['Quartz, day and date', '40 mm steel, 11 mm high', 'Mineral', '50 m', '20 mm quick-release leather'], final: 'Choose quartz with day/date.' },
      { slug: 'timex-tw2r47900', head: 'Hand-wound · 34 mm', line: 'The smallest and the most old-fashioned: a 1960s-inspired case you wind by hand.',
        specs: ['Hand-wound mechanical', '34 mm', NA, NA, 'Leather'], final: 'Choose the 34 mm hand-wound watch.' }
    ],
    criteria: [
      ['For under a cuff', 'the Waterbury publishes 11 mm and the Cocktail Time 11.8 mm. Orient lists 12.5 mm for the Bambino.'],
      ['For size', 'the Marlin is 34 mm, the Bambino 38.4 mm, and the Waterbury and Cocktail Time about 40 mm.'],
      ['For upkeep', 'the Waterbury is quartz. The Bambino and Cocktail Time are automatics that stop after roughly 40 hours unworn, and the Marlin needs winding by hand.'],
      ['For water', 'these are dress watches. Ratings run from 30 m to 50 m, and Timex’s Marlin page we used doesn’t list one. Check the maker’s guidance before swimming with any of them.']
    ]
  }
];

export function lookalikePage({ group, watches, buy, disclosure, styleName, badges = () => '', ourPicks = {} }) {
  const picks = group.picks.map(p => {
    const w = watches.find(x => x.slug === p.slug);
    if (!w) throw new Error(`lookalikes: unknown slug ${p.slug}`);
    if (p.specs.length !== group.rows.length) throw new Error(`lookalikes: ${p.slug} needs ${group.rows.length} specs`);
    return { ...p, w };
  });
  const name = w => `${w.brand} ${w.name.replace(/\s\d+mm$/, '')}`;
  const sources = picks.map((p, i) => `<a id="source-${p.w.slug}" href="${p.w.source}">[${i + 1}] ${p.w.brand} ${p.w.model} specifications</a>`).join('; ');
  return `<article class="article section comparison"><p class="eyebrow"><a href="/styles/${group.style}/">${styleName.toUpperCase()} WATCHES</a> / ${group.eyebrow}</p>
<h1>${group.h1}</h1>
<p class="lead quick-verdict"><strong>The quick choice:</strong> ${group.verdict}</p>
<p class="research-note">Based on each maker’s published specifications, not hands-on testing.</p>
${disclosure}
<div class="decision-picks">${picks.map(p => `<div><a class="pick-photo" href="/watches/${p.w.slug}/" tabindex="-1" aria-hidden="true"><img src="${p.w.image}" alt="" loading="lazy" width="700" height="700"></a>${badges(p.w)}<h2>${name(p.w)}</h2><p><strong>${p.head}</strong><br>${p.line}</p>${buy(p.w, 'comparison_pick')}<a class="text-link" href="/watches/${p.w.slug}/">Read the ${p.w.model} guide →</a></div>`).join('')}</div>
<p>${group.intro}</p>
<h2>The specifications side by side</h2>
<div class="table-wrap" tabindex="0" role="region" aria-label="Watch specifications; scroll horizontally on small screens"><table><caption>Manufacturer specifications ${picks.map((p, i) => `<a href="#source-${p.w.slug}">[${i + 1}]</a>`).join(' ')}</caption><thead><tr><th scope="col">Feature</th>${picks.map(p => `<th scope="col">${name(p.w)}<br>${p.w.model}</th>`).join('')}</tr></thead><tbody>
${group.rows.map((row, r) => `<tr><th scope="row">${row}</th>${picks.map(p => `<td>${p.specs[r]}</td>`).join('')}</tr>`).join('\n')}
<tr><th scope="row">Amazon</th>${picks.map(p => `<td>${buy(p.w, 'comparison_table')}</td>`).join('')}</tr>
</tbody></table></div>
<h2>Which one to choose</h2>
<ul class="decision-criteria">${group.criteria.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>
<h2>Match the listing before buying</h2>
<p>Similar-looking watches often share a listing with other colors and sizes. Confirm the exact reference, seller, condition and return terms. We haven’t verified live prices or availability.</p>
${disclosure}
<div class="decision-picks final-picks">${picks.map(p => `<div><h3>${name(p.w)} · ${p.w.model}</h3><p>${p.final}</p>${buy(p.w, 'comparison_final')}</div>`).join('')}</div>
<p><a href="/compare/">See all our watch comparisons</a>, <a href="/styles/${group.style}/">browse ${styleName.toLowerCase()} watch guides</a> or use the <a href="/guide/">first-watch buying guide</a> to check fit, movement and seller terms.</p>
<p class="micro">Sources reviewed October 17, 2026. ${sources}. “${NA}” means the manufacturer page we used doesn’t state it. Groupings and decision criteria are our analysis of those specifications, not measurements from watches we tested.</p>
</article>${(() => { const top = picks.find(p => ourPicks[p.w.slug]) || picks[0]; return `<aside class="mobile-buy" aria-label="Amazon purchase link"><span>${top.w.brand} ${top.w.model}<small>${ourPicks[top.w.slug] || 'Amazon affiliate link'}</small></span>${buy(top.w, 'product_mobile')}</aside>`; })()}`;
}

export function compareHubPage({ lookalikes, extra }) {
  const items = [...lookalikes.map(g => [g.slug, g.crumb, g.hub]), ...extra];
  return `<section class="article section"><p class="eyebrow">SIDE BY SIDE</p><h1>Watch comparisons</h1>
<p class="lead">Like the look of one watch but want to see what else does it? Each comparison lines up similar styles from different brands using the makers’ published specifications.</p>
<ul class="decision-criteria">${items.map(([slug, label, line]) => `<li><a class="text-link" href="/compare/${slug}/">${label} →</a><br>${line}</li>`).join('')}</ul>
<p class="micro">Research-based comparisons, not hands-on reviews. Amazon links on each comparison are affiliate links.</p>
</section>`;
}
