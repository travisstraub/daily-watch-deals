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
