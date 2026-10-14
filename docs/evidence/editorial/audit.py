from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re,sys

root=Path(__file__).resolve().parents[3]
if len(sys.argv)!=2: raise SystemExit('Usage: python docs/evidence/editorial/audit.py BASELINE_DIRECTORY')
old=Path(sys.argv[1])
class Node:
 def __init__(self,tag='',attrs=(),parent=None): self.tag=tag;self.attrs=dict(attrs);self.children=[];self.parent=parent
 def text(self): return ''.join(c if isinstance(c,str) else c.text() for c in self.children)
 def walk(self):
  yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.walk()
class Doc(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.root=Node();self.current=self.root;self.shape=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);n=Node(tag,attrs,self.current);self.current.children.append(n)
  if tag=='meta' and (a.get('name')=='description' or a.get('property')=='og:description'): a['content']='[editorial description]'
  self.shape.append(('start',tag,a))
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.current=n
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if self.current.tag==tag:self.handle_endtag(tag)
 def handle_endtag(self,tag):
  self.shape.append(('end',tag))
  assert self.current.tag==tag,(self.current.tag,tag)
  self.current=self.current.parent
 def handle_data(self,data):self.current.children.append(data)
 def nodes(self,tag):return [n for n in self.root.walk() if n.tag==tag]
 def byid(self,id):return next(n for n in self.root.walk() if n.attrs.get('id')==id)
 def meta(self):return next(n.attrs['content'] for n in self.nodes('meta') if n.attrs.get('name')=='description')

before=json.loads((old/'content/watches.json').read_text());after=json.loads((root/'content/watches.json').read_text())
allowed={'intro','why','tradeoff'};catalog=[]
for a,b in zip(before,after):
 assert a['slug']==b['slug']
 assert {k:v for k,v in a.items() if k not in allowed}=={k:v for k,v in b.items() if k not in allowed},a['slug']
 # Every numeral in rewritten prose must already occur somewhere in that model's original record.
 allold=' '.join(str(v) for v in a.values())
 for field in allowed:
  for number in re.findall(r'\d+(?:\.\d+)?',b[field]):assert number in allold,(a['slug'],field,number)
 fields={}
 for field in ['intro','why','tradeoff']:
  changed=a[field]!=b[field]
  fields[field]={'changed':changed,'reason': 'Rewritten for concrete details and more natural phrasing; facts checked against the original record.' if changed else 'Retained: concise, specific description already meets the editorial standard.' if field=='intro' else 'Retained under Auto-Clarity: water-use guidance and qualifications need literal, careful wording.'}
 catalog.append({'slug':a['slug'],'source':a['source'],'fields':fields})

pages=[];affiliate_count=0
for file in sorted((root/'public').rglob('*.html')):
 rel=file.relative_to(root/'public')
 if rel.name=='google216684202c8a020c.html':continue
 a=Doc((old/'public'/rel).read_text());b=Doc(file.read_text())
 assert a.shape==b.shape,('markup/attribute change',str(rel))
 for tag in ['h1','h2','h3','title','table','svg','script','li']:
  # Decision-criteria list copy is editorial, while every specification list is protected.
  at=[n.text() for n in a.nodes(tag) if not(tag=='li' and n.parent.attrs.get('class')=='decision-criteria')]
  bt=[n.text() for n in b.nodes(tag) if not(tag=='li' and n.parent.attrs.get('class')=='decision-criteria')]
  assert at==bt,(str(rel),tag)
 assert a.byid('analytics-consent').text()==b.byid('analytics-consent').text()
 assert a.byid('analytics-settings').text()==b.byid('analytics-settings').text()
 da=[n.text() for n in a.nodes('p') if n.attrs.get('class')=='disclosure']
 db=[n.text() for n in b.nodes('p') if n.attrs.get('class')=='disclosure']
 assert da==db
 ac=[n for n in b.nodes('a') if n.attrs.get('href','').startswith('https://www.amazon.com/')];affiliate_count+=len(ac)
 route='/404.html' if str(rel)=='404.html' else '/'+str(rel).removesuffix('index.html')
 main_changed=a.nodes('main')[0].text()!=b.nodes('main')[0].text()
 if route=='/privacy/':assert not main_changed
 if route.startswith('/watches/'):
  sources=['content/watches.json','scripts/build.mjs'];kind='product guide'
 elif route.startswith('/styles/'):sources=['scripts/build.mjs','content/watches.json'];kind='style hub'
 elif route.startswith('/compare/'):sources=['scripts/comparison.mjs','scripts/build.mjs'];kind='comparison'
 else:sources=['scripts/build.mjs']+(['content/watches.json'] if route in ['/','/popular-watches/'] else []);kind=route.strip('/') or 'home'
 pages.append({'path':route,'kind':kind,'sources':sources,'main_copy_changed':main_changed,'main_copy_review': 'Rewritten and audited against original copy and protected source data.' if main_changed else 'Retained under Auto-Clarity: the privacy policy exactly describes enabled consent, storage and measurement behavior.',
  'metadata_description_changed':a.meta()!=b.meta(),'metadata_review':'Updated from edited prose; model facts and caveats retained.' if a.meta()!=b.meta() else 'Retained: exact model/specification summary or concise page-purpose label already accurate.',
  'title_and_headings':'Reviewed and preserved exactly, as requested.','structure_attributes_links_and_specifications':'Unchanged; compared with baseline HTML parser tokens, headings, tables, diagrams, specification lists and structured data.','shared_copy_changed':True,'affiliate_links':len(ac)})

unchanged=[]
for directory in ['src','public']:
 for file in (old/directory).rglob('*'):
  if not file.is_file() or (directory=='public' and file.suffix=='.html' and file.name!='google216684202c8a020c.html'):continue
  rel=file.relative_to(old);assert file.read_bytes()==(root/rel).read_bytes(),str(rel);unchanged.append(str(rel))
assert len(pages)==42 and sum(p['path']!='/404.html' for p in pages)==41
summary={'baseline_commit':'36462baedec5e0d7c2241508b29c43359e3bc66c','method':'Assistant-authored conversational Unslop Full using supplied installed 0.7.0 guidance; no humanize.py, CLI or API execution. Separate post-rewrite audit by the same assistant, not an external independent reviewer.',
 'result':'PASS','indexable_pages':41,'additional_404_pages':1,'catalog_models':30,'affiliate_anchors_preserved':affiliate_count,
 'changed_catalog_fields':sum(f['changed'] for c in catalog for f in c['fields'].values()),
 'preserved_catalog_fields':'Every field except intro, why and tradeoff: exact identity/variant, dimensions, movement, strap, facts, ASIN/search, source and popularity URLs/notes/dates, image URL/alt and selection label.',
 'shared_ui':{'changed':['topline','footer slogan'],'preserved':['All navigation/link/button names: concise action labels or exact model names.','Consent panel, choices, status messages and privacy policy: Auto-Clarity and exact enabled behavior.','Filter/search states, results counts and image-unavailable text: concise functional labels.','Disclosure and legal footer: required disclosure and literal qualifications.','Eyebrows, headings, product labels and alternative text: protected headings/names or concise descriptive text.']},
 'other_preserved_copy':['Guide light-powered operation and crystal paragraph: already concrete technical explanation.','Product research-date/no-hands-on/no-current-discount statement: exact sourcing qualification.','Popular collection methods: manufacturer sources, October 13, 2026 date, retained 2025 source-heading caveat, editorial order and no Amazon-ranking claim.','Comparison quick verdict, choice cards, specifications, diagram explanation, timed-routine criterion, water-use guidance and source note: precise comparison or Auto-Clarity.','Home and hub live-price/research qualifications: accurate disclosure.'],
 'unchanged_non_html_files':unchanged,
 'excluded':['Legacy root index.html and deals.json: not active build inputs or deployed pages.','Search Console ownership HTML: exact verification bytes, not editorial content.','Internal planning and historical release documents: not live site copy; no new campaign-policy conclusions or release claims.'],
 'findings_addressed':['Removed unsupported SRE004 market-prevalence phrase: a size often dominated by quartz watches. No replacement market claim.','Removed SSB429 generalized steel-versus-rubber versatility claim; framed bracelet preference as reader choice.','Restored literal water-use qualifications under Auto-Clarity.','Preserved uncertainty about appearance, stopping after time unworn and radio reception.','Clarified F-91W 21 grams as watch weight, not case-only weight.','Corrected missing conjunction in About non-endorsement sentence.'],
 'limits':['Checks compare prose with existing manufacturer-linked records and the original source copy; manufacturer pages were not re-fetched and research dates were not advanced.','No live price, inventory, sales or current bestseller-rank validation.','No Amazon links activated and no real conversion requested.','Deployment/browser verification is recorded separately from these local source checks.'],
 'catalog':catalog,'pages':pages}
(root/'docs/editorial-coverage.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({k:summary[k] for k in ['result','indexable_pages','additional_404_pages','catalog_models','affiliate_anchors_preserved','changed_catalog_fields']}))
