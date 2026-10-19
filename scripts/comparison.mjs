function caseDiagram({ model, width, length, thickness, weight, color }) {
  const x = (260 - width * 4) / 2;
  const bottom = 64 + length * 4;
  return `<div class="fit-panel"><h3>${model}</h3><svg class="fit-drawing" viewBox="0 0 260 310" role="img" aria-label="${model}: ${length} mm long, ${width} mm wide, ${thickness} mm thick; ${weight} g"><rect x="${x}" y="64" width="${width * 4}" height="${length * 4}" fill="${color}" stroke="#193a30" stroke-width="2"/><g fill="none" stroke="#526052" stroke-width="1"><path d="M${x} 40 H${x + width * 4} M${x} 34 V46 M${x + width * 4} 34 V46"/><path d="M20 64 V${bottom} M14 64 H26 M14 ${bottom} H26"/></g><g fill="#193a30" font-family="Arial,sans-serif" font-size="14"><text x="130" y="27" text-anchor="middle">${width} mm wide</text><text x="130" y="${64 + length * 2}" text-anchor="middle">${length} mm long</text><text x="130" y="${bottom + 28}" text-anchor="middle">${thickness} mm thick · ${weight} g</text><text x="181" y="291">10 mm</text></g><path d="M128 287 H168 M128 282 V292 M168 282 V292" stroke="#193a30" stroke-width="2"/></svg></div>`;
}

export function comparisonPage({ f91, ae, buy, disclosure }) {
  return `<article class="article section comparison"><p class="eyebrow"><a href="/styles/digital/">DIGITAL WATCHES</a> / EXACT-VARIANT COMPARISON</p>
<h1>Casio F-91W vs AE-1200</h1>
<p class="lead quick-verdict"><strong>The quick choice:</strong> F-91W for a smaller, lighter watch. AE-1200 on a steel bracelet for world time, countdowns and more alarms.</p>
<p class="research-note">Based on Casio’s published specifications, not hands-on testing.</p>
${disclosure}
<div class="decision-picks"><div><h2>F-91W-1</h2><p><strong>21 g · Black resin strap</strong><br>Smaller case, one alarm and a stopwatch.</p>${buy(f91, 'comparison_pick')}<a class="text-link" href="/watches/casio-f91w/">Read the F-91W guide →</a></div><div><h2>AE-1200WHD-1AV</h2><p><strong>91 g · Silver steel bracelet</strong><br>World time, countdown timer and five alarms.</p>${buy(ae, 'comparison_pick')}<a class="text-link" href="/watches/casio-ae1200/">Read the AE-1200 guide →</a></div></div>
<p class="variant-context">This comparison covers the <strong>F-91W-1 with black resin strap</strong> and the <strong>AE-1200WHD-1AV with silver steel bracelet</strong>. The AE-1200 has a silver resin case and black face; Casio’s US name for it is <a href="https://www.casio.com/us/watches/casio/product.AE-1200WHD-1AV/">AE1200WHD-1A</a>.</p>
<h2>Compare the space on your wrist</h2>
<figure class="fit-figure"><div class="fit-panels">${caseDiagram({model:'F-91W-1',width:35.2,length:38.2,thickness:8.5,weight:21,color:'#d9edaa'})}${caseDiagram({model:'AE-1200WHD-1AV',width:42.1,length:45,thickness:12.5,weight:91,color:'#d9ddd3'})}</div><figcaption>Original dimension diagram from Casio’s published case measurements <a href="#source-f91">[1]</a> <a href="#source-ae">[2]</a>. Rectangles show case envelopes at a shared relative scale, not exact silhouettes, strap shapes or a life-size ruler. Weight includes the supplied band.</figcaption></figure>
<p>The AE-1200 is <strong>6.9 mm wider and 4 mm thicker</strong>; with its bracelet it weighs 70 g more. Compare those measurements with a watch you already wear, including its length. They help you judge size, but can’t guarantee comfort. The bracelet may also need sizing.</p>
<h2>The specifications behind the choice</h2>
<div class="table-wrap" tabindex="0" role="region" aria-label="Casio specifications; scroll horizontally on small screens"><table><caption>Manufacturer specifications for these two variants <a href="#source-f91">[1]</a> <a href="#source-ae">[2]</a></caption><thead><tr><th scope="col">Feature</th><th scope="col">F-91W-1<br>Black resin strap</th><th scope="col">AE-1200WHD-1AV<br>Steel bracelet</th></tr></thead><tbody>
<tr><th scope="row">Case length × width × thickness</th><td>38.2 × 35.2 × 8.5 mm</td><td>45 × 42.1 × 12.5 mm</td></tr>
<tr><th scope="row">Weight</th><td>21 g</td><td>91 g</td></tr>
<tr><th scope="row">Case / glass</th><td>Resin / resin</td><td>Resin / resin</td></tr>
<tr><th scope="row">Band</th><td>Resin strap</td><td>Stainless-steel bracelet</td></tr>
<tr><th scope="row">Alarms</th><td>One daily alarm</td><td>Five daily or one-time alarms</td></tr>
<tr><th scope="row">World time</th><td>No</td><td>31 time zones, 48 cities + UTC</td></tr>
<tr><th scope="row">Countdown timer</th><td>No</td><td>Up to 24 hours</td></tr>
<tr><th scope="row">Water rating</th><td>Basic water resistance</td><td>100 m</td></tr>
</tbody></table></div>
<h2>Which tradeoff would you notice?</h2>
<ul class="decision-criteria"><li><strong>For a modest case:</strong> start with the F-91W’s smaller dimensions. If bulk or sleeve clearance worries you, try a similarly sized watch before ordering.</li><li><strong>For a recurring second time zone:</strong> the AE-1200 has a dedicated world-time function. If you only need local time, you may have little use for those extra modes.</li><li><strong>For timed routines:</strong> choose the AE-1200 for countdowns and multiple alarms. The F-91W covers an elapsed-time stopwatch and one daily alarm.</li><li><strong>For the silver look:</strong> the AE-1200’s bracelet is steel; its case is resin. The silver finish doesn’t make it an all-metal watch. Check that the listing is for this bracelet version, not the lighter black resin-band AE-1200 variant.</li></ul>
<p>For water activities, follow Casio’s usage guidance rather than treating a depth rating as a universal permission. The F-91W’s basic rating and the AE-1200’s 100 m rating are different; neither comparison is a test of real-world durability.</p>
<h2>Match the listing before buying</h2>
<p>These Amazon links open identity-matched product listings. Confirm the selected reference, band, color, seller, condition and return terms. We haven’t verified live prices or availability. An Amazon listing may switch between variants.</p>
${disclosure}
<div class="decision-picks final-picks"><div><h3>F-91W-1 · Black resin strap</h3><p>Choose the smaller, lighter option for basic timekeeping.</p>${buy(f91, 'comparison_final')}</div><div><h3>AE-1200WHD-1AV · Steel bracelet</h3><p>Choose world time and countdowns in the larger case.</p>${buy(ae, 'comparison_final')}</div></div>
<p><a href="/styles/digital/">Browse our digital watch guides</a> for more on either model, or use the <a href="/guide/">first-watch buying guide</a> to check fit, movement and seller terms.</p>
<p class="micro">Sources reviewed October 13, 2026. <a id="source-f91" href="${f91.source}">[1] Casio F-91W-1 specifications</a>; <a id="source-ae" href="${ae.source}">[2] Casio AE-1200WHD-1AV specifications</a>. Size comparisons and decision criteria are our analysis of those specifications, not measurements from watches we tested.</p>
</article>`;
}

export function tsuyosaSeikoPage({ tsu, seiko, buy, disclosure }) {
  return `<article class="article section comparison"><p class="eyebrow"><a href="/styles/everyday/">EVERYDAY WATCHES</a> / EXACT-VARIANT COMPARISON</p>
<h1>Citizen Tsuyosa vs Seiko 5 Sports</h1>
<p class="lead quick-verdict"><strong>The quick choice:</strong> Tsuyosa NJ0150-56X for a 40 mm case, sapphire crystal and a green dial. Seiko SRPD51 for 100 m water resistance, a rotating bezel and a see-through caseback.</p>
<p class="research-note">Based on Citizen’s and Seiko’s published specifications, not hands-on testing.</p>
${disclosure}
<div class="decision-picks"><div><h2>Citizen Tsuyosa NJ0150-56X</h2><p><strong>Automatic · 40 mm · Green dial</strong><br>Sapphire crystal and a steel bracelet.</p>${buy(tsu, 'comparison_pick')}<a class="text-link" href="/watches/citizen-tsuyosa/">Read the Tsuyosa guide →</a></div><div><h2>Seiko 5 Sports SRPD51</h2><p><strong>Automatic · 42.5 mm · Blue dial</strong><br>100 m water resistance and a steel bracelet.</p>${buy(seiko, 'comparison_pick')}<a class="text-link" href="/watches/seiko-srpd51/">Read the SRPD51 guide →</a></div></div>
<p class="variant-context">This comparison covers the <strong>Citizen NJ0150-56X</strong> with its green dial and the <strong>Seiko SRPD51</strong> with its blue sunray dial. Both are automatics on stainless-steel bracelets, so the choice comes down to case, crystal, water rating and look.</p>
<h2>The specifications behind the choice</h2>
<div class="table-wrap" tabindex="0" role="region" aria-label="Watch specifications; scroll horizontally on small screens"><table><caption>Manufacturer specifications for these two references <a href="#source-tsu">[1]</a> <a href="#source-seiko">[2]</a></caption><thead><tr><th scope="col">Feature</th><th scope="col">Citizen NJ0150-56X<br>Tsuyosa</th><th scope="col">Seiko SRPD51<br>5 Sports</th></tr></thead><tbody>
<tr><th scope="row">Movement</th><td>Caliber 8210 automatic</td><td>Caliber 4R36 automatic, with manual winding</td></tr>
<tr><th scope="row">Power reserve</th><td>42 hours</td><td>Approximately 41 hours</td></tr>
<tr><th scope="row">Case size</th><td>40 mm wide</td><td>42.5 mm diameter, 13.4 mm thick</td></tr>
<tr><th scope="row">Crystal</th><td>Sapphire</td><td>Hardlex</td></tr>
<tr><th scope="row">Water resistance</th><td>50 m (5 bar), rated for still-water swimming</td><td>100 m (10 bar)</td></tr>
<tr><th scope="row">Dial</th><td>Green sunray, with date</td><td>Blue sunray, with day and date</td></tr>
<tr><th scope="row">Bracelet</th><td>Stainless steel, fold-over clasp with push buttons</td><td>Stainless steel</td></tr>
<tr><th scope="row">Caseback</th><td>Not listed</td><td>See-through</td></tr>
</tbody></table></div>
<p>Citizen doesn’t list a case thickness for the Tsuyosa, so this comparison can’t say which watch sits lower on the wrist. The Seiko’s 13.4 mm is worth checking against your cuffs.</p>
<h2>Which one to choose</h2>
<ul class="decision-criteria"><li><strong>For a smaller case:</strong> the Tsuyosa is 2.5 mm narrower. Try a watch of a similar diameter before you order.</li><li><strong>For more water resistance:</strong> the SRPD51 is rated to 100 m against the Tsuyosa’s 50 m. Follow each maker’s usage guidance rather than treating a rating as permission for any water activity.</li><li><strong>For a harder crystal:</strong> the Tsuyosa has sapphire; the SRPD51 has Hardlex. Sapphire is known for scratch resistance, though no crystal makes a watch indestructible.</li><li><strong>For a sporty look:</strong> the SRPD51 has a rotating bezel and a see-through caseback that shows the movement. The Tsuyosa is the plainer design.</li><li><strong>For wearing it irregularly:</strong> both are automatics with roughly two days of power reserve (42 and about 41 hours), so either may need resetting after time off the wrist.</li></ul>
<h2>What “5 Sports” means</h2>
<p>Seiko’s own product page titles the SRPD51 “Men’s Seiko 5 Sports” and lists its collection as Seiko 5 Sports. That’s the line name, and SRPD51 is the specific reference. Match the reference before you buy, since a listing may show a different 5 Sports model.</p>
<h2>Match the listing before buying</h2>
<p>These Amazon links open identity-matched product listings. Confirm the selected reference, color, seller, condition and return terms. We haven’t verified live prices or availability. An Amazon listing may switch between variants.</p>
${disclosure}
<div class="decision-picks final-picks"><div><h3>Citizen Tsuyosa NJ0150-56X</h3><p>Choose the smaller case and sapphire crystal.</p>${buy(tsu, 'comparison_final')}</div><div><h3>Seiko 5 Sports SRPD51</h3><p>Choose the 100 m rating and rotating bezel.</p>${buy(seiko, 'comparison_final')}</div></div>
<p><a href="/styles/everyday/">Browse our everyday watch guides</a> for more options, see how a <a href="/compare/casio-f91w-vs-ae1200/">smaller and larger Casio compare</a>, or use the <a href="/guide/">first-watch buying guide</a> to check fit, movement and seller terms.</p>
<p class="micro">Sources reviewed October 17, 2026. <a id="source-tsu" href="${tsu.source}">[1] Citizen NJ0150-56X specifications</a>; <a id="source-seiko" href="${seiko.source}">[2] Seiko SRPD51 specifications</a>. Decision criteria are our analysis of those specifications, not measurements from watches we tested.</p>
</article>`;
}

export function casioTrioPage({ f91, a168, a158, buy, disclosure }) {
  return `<article class="article section comparison"><p class="eyebrow"><a href="/styles/digital/">DIGITAL WATCHES</a> / THREE-WAY COMPARISON</p>
<h1>Casio A168W vs A158WA vs F-91W</h1>
<p class="lead quick-verdict"><strong>The quick choice:</strong> F-91W for the lightest watch on a resin strap. A158WA for the slimmest steel-bracelet case. A168W for the widest of the three, with the electro-luminescent backlight.</p>
<p class="research-note">Based on Casio’s published specifications as recorded in our watch guides, not hands-on testing.</p>
${disclosure}
<div class="decision-picks"><div><h2>F-91W-1</h2><p><strong>21 g · Resin strap</strong><br>Smallest and lightest of the three.</p>${buy(f91, 'comparison_pick')}<a class="text-link" href="/watches/casio-f91w/">Read the F-91W guide →</a></div><div><h2>A168W-1</h2><p><strong>50 g · Steel bracelet</strong><br>Electro-luminescent backlight, 36.3 mm wide.</p>${buy(a168, 'comparison_pick')}<a class="text-link" href="/watches/casio-a168w/">Read the A168W guide →</a></div><div><h2>A158WA-1</h2><p><strong>46 g · Steel bracelet</strong><br>8.2 mm thick, with an LED light.</p>${buy(a158, 'comparison_pick')}<a class="text-link" href="/watches/casio-a158wa/">Read the A158WA guide →</a></div></div>
<p class="variant-context">This comparison covers the <strong>F-91W-1</strong>, the <strong>A168W-1</strong> and the <strong>A158WA-1</strong>. Casio’s US page for the A168W-1 is listed as <a href="${a168.source}">A168WA-1</a>. Wondering about a bigger Casio digital with world time? See the <a href="/watches/casio-ae1200/">AE-1200</a> and our <a href="/compare/casio-f91w-vs-ae1200/">F-91W vs AE-1200 comparison</a>.</p>
<h2>Compare the space on your wrist</h2>
<figure class="fit-figure"><div class="fit-panels">${caseDiagram({model:'F-91W-1',width:35.2,length:38.2,thickness:8.5,weight:21,color:'#d9edaa'})}${caseDiagram({model:'A168W-1',width:36.3,length:38.6,thickness:9.6,weight:50,color:'#d9ddd3'})}${caseDiagram({model:'A158WA-1',width:33.2,length:36.8,thickness:8.2,weight:46,color:'#e4e0d0'})}</div><figcaption>Original dimension diagram from Casio’s published case measurements <a href="#source-f91">[1]</a> <a href="#source-a168">[2]</a> <a href="#source-a158">[3]</a>. Rectangles show case envelopes at a shared relative scale, not exact silhouettes, strap shapes or a life-size ruler. Weight includes the supplied band.</figcaption></figure>
<p>The A168W is the widest at 36.3 mm, the F-91W is 35.2 mm and the A158WA is the narrowest at 33.2 mm. The A158WA is also the thinnest (8.2 mm against 8.5 mm and 9.6 mm) and the shortest case (36.8 mm). The weight gap comes mostly from the band: the F-91W weighs 21 g, while the two steel-bracelet models weigh 46 g and 50 g. Compare these numbers with a watch you already wear, including its length. They help you judge size, but can’t guarantee comfort. A bracelet may also need sizing.</p>
<h2>The specifications behind the choice</h2>
<div class="table-wrap" tabindex="0" role="region" aria-label="Casio specifications; scroll horizontally on small screens"><table><caption>Specifications for these three references <a href="#source-f91">[1]</a> <a href="#source-a168">[2]</a> <a href="#source-a158">[3]</a></caption><thead><tr><th scope="col">Feature</th><th scope="col">F-91W-1<br>Resin strap</th><th scope="col">A168W-1<br>Steel bracelet</th><th scope="col">A158WA-1<br>Steel bracelet</th></tr></thead><tbody>
<tr><th scope="row">Case length × width × thickness</th><td>38.2 × 35.2 × 8.5 mm</td><td>38.6 × 36.3 × 9.6 mm</td><td>36.8 × 33.2 × 8.2 mm</td></tr>
<tr><th scope="row">Weight</th><td>21 g</td><td>50 g</td><td>46 g</td></tr>
<tr><th scope="row">Case</th><td>Resin</td><td>Chrome-plated metal</td><td>Metal</td></tr>
<tr><th scope="row">Glass</th><td>Resin</td><td>Resin</td><td>Resin</td></tr>
<tr><th scope="row">Band</th><td>Resin strap</td><td>Steel bracelet</td><td>Steel bracelet</td></tr>
<tr><th scope="row">Backlight</th><td>Not listed in our guide</td><td>Electro-luminescent</td><td>LED light</td></tr>
<tr><th scope="row">Alarm and timing</th><td>Daily alarm, stopwatch</td><td>Daily alarm, 1/100-second stopwatch</td><td>Daily alarm, hourly signal, 1/100-second stopwatch</td></tr>
<tr><th scope="row">Water resistance</th><td>Basic</td><td>Basic</td><td>Basic</td></tr>
<tr><th scope="row">Battery</th><td>About 7 years</td><td>About 7 years (CR2016)</td><td>About 7 years (CR2016)</td></tr>
</tbody></table></div>
<p>Where a cell says “not listed”, our guide doesn’t record that detail, so we haven’t stated it. Check Casio’s page for the exact reference before you decide on that point.</p>
<h2>Which one to choose</h2>
<ul class="decision-criteria"><li><strong>For the lightest watch:</strong> the F-91W at 21 g. It’s the only resin-strap model of the three, and the only one with a resin case.</li><li><strong>For the slimmest metal watch:</strong> the A158WA at 8.2 mm thick and 33.2 mm wide, the narrowest of the three. Its LED light is weaker than an electro-luminescent backlight.</li><li><strong>For the strongest backlight:</strong> the A168W has an electro-luminescent backlight. It’s also the widest and thickest, at 36.3 × 9.6 mm.</li><li><strong>For a steel look:</strong> the A168W and A158WA both come on steel bracelets. The A158WA is the smaller of the two; the A168W has the chrome-plated case.</li><li><strong>For the basics:</strong> all three have a daily alarm, a stopwatch and about seven years of battery life.</li></ul>
<p>All three carry only the basic water-resistance rating and resin glass, so none is a swimming watch and all call for care around scratches. Follow Casio’s usage guidance rather than treating a rating as permission for any water activity.</p>
<h2>Match the listing before buying</h2>
<p>These Amazon links open identity-matched product listings or model searches. Confirm the selected reference, band, color, seller, condition and return terms. We haven’t verified live prices or availability. An Amazon listing may switch between variants.</p>
${disclosure}
<div class="decision-picks final-picks"><div><h3>F-91W-1 · Resin strap</h3><p>Choose the lightest option for basic timekeeping.</p>${buy(f91, 'comparison_final')}</div><div><h3>A168W-1 · Steel bracelet</h3><p>Choose the electro-luminescent backlight.</p>${buy(a168, 'comparison_final')}</div><div><h3>A158WA-1 · Steel bracelet</h3><p>Choose the slimmest metal case.</p>${buy(a158, 'comparison_final')}</div></div>
<p><a href="/styles/digital/">Browse our digital watch guides</a> for more on each model, or use the <a href="/guide/">first-watch buying guide</a> to check fit, movement and seller terms.</p>
<p class="micro">Sources reviewed October 19, 2026. <a id="source-f91" href="${f91.source}">[1] Casio F-91W-1 specifications</a>; <a id="source-a168" href="${a168.source}">[2] Casio A168WA-1 specifications</a>; <a id="source-a158" href="${a158.source}">[3] Casio A158WA-1 specifications</a>. Figures are those recorded in our guides, checked against Casio’s pages when those guides were written. Casio’s site blocked our automated fetch on this date, so we couldn’t re-read the pages. Size comparisons and decision criteria are our analysis, not measurements from watches we tested.</p>
</article>`;
}
