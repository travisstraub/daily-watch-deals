// "Best for" guide pages. Case sizes come only from the stated figures on each watch page (content/watches.json).
const picks = [
  { slug: 'seiko-swr046', line: 'The smallest of the six at 15.5 mm wide and 5.68 mm thick, a slim rectangle that reads more like a bracelet than a sports watch. The dial is tiny, so check that you can read it.' },
  { slug: 'seiko-sre004', line: 'A 28 mm automatic with day/date. It’s the smallest mechanical pick here, but at 11.2 mm thick it isn’t slim.' },
  { slug: 'seiko-sur633', line: 'A 29.8 mm steel case with a sapphire crystal and quartz movement. At 8.33 mm thick, it’s a much shallower case than the SRE004.' },
  { slug: 'timex-tw2r47900', line: 'A 34 mm case with a traditional round dress-watch look. It’s hand-wound, so you’ll wind it yourself.' },
  { slug: 'casio-f91w', line: 'A resin case 38.2 mm long, 35.2 mm wide and 8.5 mm thick, weighing 21 g. Light and shallow, but longer than it is wide, so check the length against your wrist.' },
  { slug: 'seiko-srpj85', line: 'A 36.4 mm case, 44.4 mm long, in a field-watch style. It’s the largest pick here and 12.5 mm thick, so it suits someone who wants a field watch more than a dress watch.' }
];

export function smallWristsPage({ watches, buy, disclosure }) {
  const items = picks.map(p => {
    const w = watches.find(x => x.slug === p.slug);
    if (!w) throw new Error(`best-for: unknown slug ${p.slug}`);
    return `<div class="decision-picks"><div><h3><a href="/watches/${w.slug}/">${w.brand} ${w.model}: ${w.name}</a></h3><p><strong>${w.movement} · ${w.size}</strong><br>${p.line}</p>${buy(w, 'comparison_pick')}<a class="text-link" href="/watches/${w.slug}/">Read the ${w.model} guide →</a></div></div>`;
  }).join('');
  return `<article class="article section"><p class="eyebrow"><a href="/guide/">BUYING GUIDE</a> / BEST FOR SMALL WRISTS</p>
<h1>Best watches for small wrists</h1>
<p class="lead">Six watches on this site with small, documented cases, from a 15.5 mm rectangle to a 36.4 mm field watch. Sizes are the manufacturers’ published figures.</p>
<p class="research-note">Based on published specifications, not hands-on testing. We don’t know your wrist, so treat this as a shortlist of small cases, not a promise of fit.</p>
${disclosure}
<h2>Six compact picks, smallest first</h2>
${items}
<h2>How to judge fit</h2>
<p>Diameter is only part of it. Lug-to-lug length, the distance from the tip of one lug to the other, decides whether a case overhangs the sides of your wrist, and the watch pages state it for only some of these models. Where it isn’t stated, compare the case size and thickness with a watch you already wear. Then check the strap or bracelet: a bracelet may need links removed, and a strap sized for a larger wrist may not tighten enough. A round and a rectangular case of similar width wear differently, so don’t compare them on one number.</p>
<p>The Citizen Tsuyosa is a common search on this topic. Its stated case is 40 mm, so it isn’t on this list; see <a href="/watches/citizen-tsuyosa/">its guide</a> to check its other dimensions yourself.</p>
<h2>Keep looking</h2>
<p><a class="text-link" href="/styles/everyday/">Everyday watches →</a> <a class="text-link" href="/styles/dress/">Dress watches →</a> <a class="text-link" href="/guide/">Read the buying guide →</a></p>
</article>`;
}
