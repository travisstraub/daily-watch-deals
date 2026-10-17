import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { catalog, pages as canonicalPaths } from '../public/tracking-catalog.js';
import { placements } from '../src/analytics.js';
const root=new URL('../public/',import.meta.url);
async function pages(dir=root){const list=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=new URL(entry.name+(entry.isDirectory()?'/':''),dir);if(entry.isDirectory())list.push(...await pages(path));else if(entry.name.endsWith('.html')&&entry.name!=='google216684202c8a020c.html')list.push(path);}return list;}
// Explicit, short list of pages that are deliberately noindex and out of the sitemap.
const noindexPages=['/from-instagram/'];
const urlPath=page=>'/'+page.pathname.slice(root.pathname.length).replace(/index\.html$/,'');
test('all internal destinations resolve and affiliate links carry attribution',async()=>{let links=0;for(const page of await pages()){const html=await readFile(page,'utf8');assert.match(html,/As an Amazon Associate I earn from qualifying purchases/);for(const [,href] of html.matchAll(/href="([^"]+)"/g)){if(href.startsWith('/')&&!href.startsWith('//')){let path=href.split('#')[0];if(path.endsWith('/'))path+='index.html';await access(new URL(path.slice(1),root));}if(href.startsWith('https://www.amazon.com/')){assert.equal(new URL(href.replaceAll('&amp;','&')).searchParams.get('tag'),'straubmediagr-20');links++;}}assert.doesNotMatch(html,/\$\d|% OFF|HOT DEAL|SHEET_JSON_URL|AMAZON_CREATORS_CLIENT_SECRET/);}assert.ok(links>=6);});
test('each curated model has a dedicated detail page and source',async()=>{const watches=JSON.parse(await readFile(new URL('../content/watches.json',import.meta.url)));assert.equal(new Set(watches.map(w=>w.slug)).size,watches.length);for(const w of watches){const html=await readFile(new URL(`watches/${w.slug}/index.html`,root),'utf8');assert.ok(html.includes(w.model));assert.ok(html.includes(w.source));assert.ok(w.tradeoff.length>30);assert.ok(w.image.startsWith('https://'));}});

test('indexable pages have unique canonical URLs and sitemap coverage',async()=>{
 const seen=new Set();const sitemap=await readFile(new URL('sitemap.xml',root),'utf8');
 for(const page of await pages()){
  const html=await readFile(page,'utf8');if(page.pathname.endsWith('/404.html')){assert.match(html,/name="robots" content="noindex"/);continue;}
  if(noindexPages.includes(urlPath(page))){assert.match(html,/<meta name="robots" content="noindex,follow">/);assert.doesNotMatch(html,/rel="canonical"/);assert.ok(!sitemap.includes(`https://dailywatchfinds.com${urlPath(page)}`));continue;}
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];assert.ok(canonical.startsWith('https://dailywatchfinds.com/'));assert.ok(!seen.has(canonical));seen.add(canonical);assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
  if(page.pathname.includes('/watches/')){assert.match(html,/class="mobile-buy"/);assert.match(html,/Amazon affiliate link/);}
 }
 const watches=JSON.parse(await readFile(new URL('../content/watches.json',import.meta.url)));const indexable=canonicalPaths.filter(p=>!noindexPages.includes(p));assert.equal(seen.size,indexable.length);
 for(const w of watches)assert.ok(indexable.includes(`/watches/${w.slug}/`));
 assert.deepEqual(canonicalPaths.filter(p=>noindexPages.includes(p)),noindexPages);
});

test('seven direct destinations agree with identity evidence; uncertain references remain searches',async()=>{
 const watches=JSON.parse(await readFile(new URL('../content/watches.json',import.meta.url)));
 const evidence=JSON.parse(await readFile(new URL('../content/amazon-link-evidence.json',import.meta.url)));
 assert.equal(watches.filter(w=>w.asin).length,7);
 assert.equal(watches.filter(w=>w.search).length,23);
 for(const w of watches){
  assert.notEqual(Boolean(w.asin),Boolean(w.search),'one destination type per watch');
  if(w.asin){
   const entry=evidence.approved.find(e=>e.slug===w.slug);
   assert.equal(entry.asin,w.asin);assert.equal(entry.model,w.model);
   assert.equal(entry.amazonSource,`https://www.amazon.com/dp/${w.asin}`);
   assert.equal(entry.liveAvailabilityVerified,false);assert.equal(entry.livePriceVerified,false);
  }
 }
 for(const entry of evidence.deferred)assert.ok(watches.find(w=>w.slug===entry.slug).search);
 assert.equal(watches.find(w=>w.slug==='casio-ae1200').asin,'B0094B79CI');
});

test('all Amazon anchors have exact destinations, safe rel, disclosures and stable event metadata',async()=>{
 let links=0;const observedPlacements=new Set();
 for(const page of await pages()){
  const html=await readFile(page,'utf8');
  const pagePath=html.match(/<body data-page="([^"]+)"/)[1];
  assert.ok(canonicalPaths.includes(pagePath));
  for(const match of html.matchAll(/<a\b[^>]*href="https:\/\/www\.amazon\.com\/[^>]*>[\s\S]*?<\/a>/g)){
   const anchor=match[0];const attrs=Object.fromEntries([...anchor.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,k,v])=>[k,v.replaceAll('&amp;','&')]));
   const entry=catalog[attrs['data-amazon-model']];assert.ok(entry);
   assert.equal(attrs.href,entry.destination);
   assert.equal(new URL(attrs.href).searchParams.getAll('tag').length,1);
   assert.equal(new URL(attrs.href).searchParams.get('tag'),'straubmediagr-20');
   for(const rel of ['sponsored','nofollow','noopener'])assert.ok(attrs.rel.split(' ').includes(rel));
   assert.equal(attrs.target,'_blank');assert.ok(placements.includes(attrs['data-placement']));
   observedPlacements.add(attrs['data-placement']);
   assert.ok(html.indexOf('As an Amazon Associate I earn from qualifying purchases')<match.index);
   assert.ok(anchor.includes(entry.destination_type==='direct_product'?'Check on Amazon':'Find this model on Amazon'));
   links++;
  }
 }
 assert.ok(links>150);assert.deepEqual([...observedPlacements].sort(),[...placements].sort());
});

test('sitemap exactly matches canonicals and internal fragments exist',async()=>{
 const sitemap=await readFile(new URL('sitemap.xml',root),'utf8');
 const locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 const indexable=canonicalPaths.filter(p=>!noindexPages.includes(p));
 assert.equal(locations.length,indexable.length);assert.equal(new Set(locations).size,locations.length);
 assert.deepEqual(locations.sort(),indexable.map(p=>'https://dailywatchfinds.com'+p).sort());
 for(const page of await pages()){
  const html=await readFile(page,'utf8');
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
   if(!href.startsWith('/')&&!href.startsWith('#'))continue;
   const [path,fragment]=href.split('#');if(!fragment)continue;
   const target=path?new URL(path.slice(1)+(path.endsWith('/')?'index.html':''),root):page;
   assert.ok((await readFile(target,'utf8')).includes(`id="${fragment}"`),`${page.pathname} -> ${href}`);
  }
 }
});

test('comparison gives sourced exact variants and original accessible dimension diagrams',async()=>{
 const html=await readFile(new URL('compare/casio-f91w-vs-ae1200/index.html',root),'utf8');
 for(const text of ['F-91W-1 with black resin strap','AE-1200WHD-1AV with silver steel bracelet','AE1200WHD-1A','38.2 × 35.2 × 8.5 mm','45 × 42.1 × 12.5 mm','91 g','not hands-on testing','Original dimension diagram','not exact silhouettes','6.9 mm wider and 4 mm thicker'])assert.ok(html.includes(text),text);
 assert.equal([...html.matchAll(/<svg[^>]*role="img"[^>]*aria-label=/g)].length,2);assert.doesNotMatch(html,/<img\b/);
 assert.doesNotMatch(html,/B0094B79PA|AE-1200 link searches|39 g/);
 for(const slug of ['casio-f91w','casio-ae1200'])assert.ok(html.includes(catalog[slug].destination.replaceAll('&','&amp;')));
});

test('built browser sources match source files and privacy describes optional consent-based analytics',async()=>{
 for(const name of ['app.js','analytics.js','analytics-config.js','ads-config.js','consent.js','consent-layout.js','ga4.js','google-tag.js'])assert.equal(await readFile(new URL(name,root),'utf8'),await readFile(new URL('../src/'+name,import.meta.url),'utf8'));
 const privacy=await readFile(new URL('privacy/index.html',root),'utf8');
 assert.match(privacy,/Google and DoubleClick services/);assert.match(privacy,/while Analytics is off/);assert.match(privacy,/_gcl_ls/);assert.match(privacy,/cookieless consent-status request/);assert.match(privacy,/The page reloads/);assert.doesNotMatch(privacy,/Google Ads measurement is disabled/);
 assert.match(privacy,/only after you explicitly select Analytics and save your choices/);assert.match(privacy,/A click is not an order/);assert.match(privacy,/Global Privacy Control and Do Not Track/);
 for(const page of await pages()){
  const html=await readFile(page,'utf8');
  const sources=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(sources,['/app.js']);
 }
});

test('catalog has 30 distinct references with clear affiliate destinations and valid structured data',async()=>{
 const watches=JSON.parse(await readFile(new URL('../content/watches.json',import.meta.url)));assert.equal(watches.length,30);assert.equal(new Set(watches.map(w=>w.model)).size,30);
 for(const page of await pages()){const html=await readFile(page,'utf8');for(const [,raw] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)){const data=JSON.parse(raw);assert.equal(data['@context'],'https://schema.org');}assert.doesNotMatch(html,/010 \/ THE SHORTLIST|Five watches/);}
});

test('approved Search Console verification survives the build with exact bytes',async()=>{
 assert.equal(await readFile(new URL('google216684202c8a020c.html',root),'utf8'),'google-site-verification: google216684202c8a020c.html');
});

test('every editorial page offers equal consent choices and an accessible later settings control',async()=>{
 for(const page of await pages()){const html=await readFile(page,'utf8');
  assert.match(html,/id="analytics-consent"[^>]+hidden/);
  assert.match(html,/<button class="button" type="button" data-consent="accepted">Save choices<\/button>/);
  assert.match(html,/<button class="button" type="button" data-consent="rejected">Reject all<\/button>/);
  assert.match(html,/id="analytics-settings" type="button" hidden>Measurement choices/);
  for(const purpose of ['analytics','advertising']){const input=html.match(new RegExp('<input[^>]*data-purpose="'+purpose+'"[^>]*>'))?.[0];assert.ok(input);assert.doesNotMatch(input,/checked/);}
  assert.doesNotMatch(html,/googletagmanager\.com|google-analytics\.com|rel="preconnect"/);
 }
});

test('comparison shopping links follow the verdict and final guidance with disclosure',async()=>{
 const html=await readFile(new URL('compare/casio-f91w-vs-ae1200/index.html',root),'utf8');
 assert.ok(html.indexOf('The quick choice:')<html.indexOf('data-placement="comparison_pick"'));
 const final=html.slice(html.indexOf('<h2>Match the listing before buying</h2>'));
 assert.ok(final.indexOf('As an Amazon Associate')<final.indexOf('data-placement="comparison_final"'));
 assert.equal((html.match(/data-placement="comparison_pick"/g)||[]).length,2);
 assert.equal((final.match(/data-placement="comparison_final"/g)||[]).length,2);
 for(const model of ['F-91W-1','AE-1200WHD-1AV'])assert.ok(final.includes(`aria-label="Check on Amazon: Casio ${model}"`));
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
 assert.equal(data['@type'],'BreadcrumbList');
 assert.deepEqual(data.itemListElement.map(e=>e.item),['https://dailywatchfinds.com/','https://dailywatchfinds.com/styles/digital/','https://dailywatchfinds.com/compare/casio-f91w-vs-ae1200/']);
});

test('descriptive metadata, crawlable contextual links and honest structured data',async()=>{
 const titles=new Set(),descriptions=new Set();
 for(const page of await pages()){
  const html=await readFile(page,'utf8');if(page.pathname.endsWith('/404.html'))continue;
  const title=html.match(/<title>(.*?)<\/title>/)[1];const description=html.match(/name="description" content="([^"]+)"/)[1];
  assert.ok(title.trim()&&description.trim(),page.pathname);assert.ok(!titles.has(title));assert.ok(!descriptions.has(description));titles.add(title);descriptions.add(description);
  assert.doesNotMatch(html,/<meta name="robots" content="noindex"/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  for(const [,raw] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))assert.doesNotMatch(raw,/"@type":"(?:Offer|Product|Review|AggregateRating)"/);
 }
 for(const slug of ['casio-f91w','casio-ae1200']){
  const html=await readFile(new URL(`watches/${slug}/index.html`,root),'utf8');
  const related=html.slice(html.indexOf('<section class="related">'));
  assert.match(related,/<a[^>]+href="\/compare\/casio-f91w-vs-ae1200\/">Compare the F-91W with the steel-bracelet AE-1200/);
  assert.match(related,/href="\/styles\/digital\/"/);
  assert.doesNotMatch(html,/<title>[^<]*F-91W-1 F-91W Digital/);
 }
 const hub=await readFile(new URL('styles/digital/index.html',root),'utf8');
 assert.match(hub,/<a[^>]+href="\/compare\/casio-f91w-vs-ae1200\/">F-91W vs steel-bracelet AE-1200/);
 const robots=await readFile(new URL('robots.txt',root),'utf8');
 assert.equal(robots,'User-agent: *\nAllow: /\nSitemap: https://dailywatchfinds.com/sitemap.xml\n');
});

test('all pages retain framing denial and no measurement helper is generated',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.headers.length,1);
 assert.ok(config.headers[0].headers.some(h=>h.key==='X-Frame-Options'&&h.value==='DENY'));
 await assert.rejects(readFile(new URL('measurement-frame.html',root)),{code:'ENOENT'});
});

test('production activation excludes the private test fixture and leaves shared campaign/account options unchanged',async()=>{
 for(const path of ['tag-test.js','tag-test-config.js','tag-test-once.js','__tag-validation/dwf-ads-validation-20261014-01/index.html'])await assert.rejects(readFile(new URL(path,root)),{code:'ENOENT'});
 const config=await import('../src/analytics-config.js');assert.equal(config.analytics.measurementId,'G-LSGXWGSM9T');assert.equal(config.analytics.productionOrigin,'https://dailywatchfinds.com');
 const source=await readFile(new URL('../src/google-tag.js',import.meta.url),'utf8');assert.doesNotMatch(source,/DWF-ADS-VALIDATION|tag-test|transaction_id:|currency:|value:/);
});
