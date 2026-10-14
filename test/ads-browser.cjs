// Build an isolated enabled fixture. The committed Ads configuration stays disabled.
// Every request is intercepted; no Google/Amazon traffic or real conversions.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const origin='https://dailywatchfinds.com', comparison='/compare/casio-f91w-vs-ae1200/';
const output=process.argv[2]||'/tmp/dwf-ads-evidence';
const keys={analytics:'dwf.analytics-consent.v1',advertising:'dwf.advertising-consent.v1'};
const mockTag=`(() => {
 const states={}; parent.testCommands ||= [];
 function process(args){
  const c=Array.from(args);parent.testCommands.push(c);
  if(c[0]==='consent')Object.assign(states,c[2]);
  if(c[0]==='config' && c[1].startsWith('G-') && states.analytics_storage==='granted')document.cookie='_ga=mock; Path=/; SameSite=Lax; Secure';
  if(c[0]==='config' && c[1].startsWith('AW-') && states.ad_storage==='granted'){
   document.cookie='_gcl_aw=mock; Path=/; SameSite=Lax; Secure';localStorage.setItem('_gcl_ls','mock-linker');
   setInterval(()=>{try{document.cookie='_gcl_aw=mock; Path=/; SameSite=Lax; Secure';localStorage.setItem('_gcl_ls','mock-linker')}catch{}},20);
  }
  if(c[0]==='event')fetch(c[1]==='conversion'?'https://www.googleadservices.com/pagead/conversion/18511081247/':'https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(c)});
 }
 dataLayer.forEach(process);const push=dataLayer.push.bind(dataLayer);dataLayer.push=function(args){process(args);return push(args)};
})();`;
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const fixtureRoot=await fs.mkdtemp(path.join(os.tmpdir(),'dwf-ads-fixture-'));
 for(const name of ['src','scripts','content'])await fs.cp(path.join(process.cwd(),name),path.join(fixtureRoot,name),{recursive:true});
 await fs.mkdir(path.join(fixtureRoot,'public'));
 await fs.copyFile('public/style.css',path.join(fixtureRoot,'public/style.css'));
 await fs.copyFile('public/favicon.svg',path.join(fixtureRoot,'public/favicon.svg'));
 const headerRules=JSON.parse(await fs.readFile('vercel.json','utf8')).headers;
 await fs.writeFile(path.join(fixtureRoot,'package.json'),'{"type":"module"}');
 const configPath=path.join(fixtureRoot,'src/ads-config.js');
 await fs.writeFile(configPath,(await fs.readFile(configPath,'utf8')).replace('enabled: false','enabled: true'));
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixtureRoot,stdio:'pipe'});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const report={type:'Isolated enabled build with mock tag; no live Ads/GA4 receipt',passed:[],errors:[],fixtureRoot};
 async function fixture({stored={},signal,blockedStorage=false,mode='success',width=390,site=origin}={}){
  const context=await browser.newContext({viewport:{width,height:width===1165?747:900}}), requests=[],events=[];
  await context.addInitScript(({stored,signal,keys,blockedStorage})=>{
   if(window.top!==window)return;
   if(sessionStorage.readOnly){Storage.prototype.setItem=function(){throw Error('read-only')};if(sessionStorage.readOnly==='all')Storage.prototype.removeItem=function(){throw Error('read-only')};}
   if(!sessionStorage.seeded){for(const [purpose,choice]of Object.entries(stored))localStorage.setItem(keys[purpose],JSON.stringify({choice,at:Date.now()}));sessionStorage.seeded='yes';}
   if(signal==='gpc')Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});
   if(signal==='dnt')Object.defineProperty(navigator,'doNotTrack',{get:()=>'1'});
   if(blockedStorage)Object.defineProperty(window,'localStorage',{get(){throw Error('storage blocked')}});
  },{stored,signal,keys,blockedStorage});
  let completeTag;const gate=new Promise(resolve=>{completeTag=resolve});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='www.googletagmanager.com'){
    requests.push(req.url());assert.equal(req.headers().referer,undefined);
    if(mode==='blocked')return route.abort('blockedbyclient');
    if(mode==='pending')await gate;
    return route.fulfill({status:200,contentType:'text/javascript',body:mockTag}).catch(()=>{});
   }
   if(/google-analytics|googleadservices|doubleclick|googlesyndication/.test(url.hostname)){
    requests.push(req.url());events.push(JSON.parse(req.postData()));return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'},body:''});
   }
   if(url.hostname==='www.amazon.com')return route.fulfill({status:200,contentType:'text/html',body:'<title>Intercepted Amazon</title>'});
   if(url.origin===site){
    const file=path.join(fixtureRoot,'public',url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
    const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';
    const headers={};for(const rule of headerRules)if(new RegExp('^'+rule.source+'$').test(url.pathname))for(const h of rule.headers)headers[h.key]=h.value;
    try{return route.fulfill({status:200,contentType:type,headers,body:await fs.readFile(file)})}catch{return route.fulfill({status:404,body:''})}
   }
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(site+comparison+'?gclid=Valid_Click_Id_12345&utm_source=google&utm_medium=cpc&utm_campaign=first50&email=secret@example.test#private',{waitUntil:'networkidle'});
  await page.waitForSelector('#analytics-settings:not([hidden])');
  return {context,page,requests,events,completeTag};
 }
 async function select(f,analytics,advertising){
  if(!await f.page.locator('#analytics-consent').isVisible())await f.page.locator('#analytics-settings').click();
  await f.page.locator('[data-purpose="analytics"]').setChecked(analytics);
  await f.page.locator('[data-purpose="advertising"]').setChecked(advertising);
  await f.page.getByRole('button',{name:'Save choices',exact:true}).click();
  await f.page.waitForTimeout(100);await f.page.waitForLoadState('networkidle');await f.page.waitForSelector('#analytics-settings:not([hidden])');
 }
 const commands=f=>f.page.evaluate(()=>window.testCommands||[]);
 const count=(f,name)=>f.events.filter(e=>e[1]===name).length;
 async function ready(f,ads=false){await f.page.waitForFunction(id=>window.testCommands?.some(c=>c[0]==='config'&&c[1]===id),ads?'AW-18511081247':'G-LSGXWGSM9T');}
 async function click(f,placement='comparison_pick',keyboard=false){const link=f.page.locator(`[data-amazon-model="casio-ae1200"][data-placement="${placement}"]`);const promise=f.page.waitForEvent('popup');if(keyboard){await link.focus();await f.page.keyboard.press('Enter')}else await link.click();const popup=await promise;await popup.waitForLoadState('domcontentloaded');assert.equal(popup.url(),'https://www.amazon.com/dp/B0094B79CI?tag=straubmediagr-20');await popup.close();}
 try{
  const fresh=await fixture();assert.equal(fresh.requests.length,0);
  assert.equal(await fresh.page.locator('[data-purpose="advertising"]').isChecked(),false);
  assert.equal(await fresh.page.locator('[data-purpose="analytics"]').isChecked(),false);
  await click(fresh);assert.equal(fresh.requests.length,0);
  await fresh.page.getByRole('button',{name:'Reject all',exact:true}).click();await fresh.page.reload({waitUntil:'networkidle'});assert.equal(fresh.requests.length,0);await fresh.context.close();
  report.passed.push('initial choices off; pre-consent links and persisted rejection send zero Google requests');
  for(const [analytics,ads]of [[true,false],[false,true],[true,true]]){
   const f=await fixture();await select(f,analytics,ads);await ready(f,ads);
   await click(f);await click(f);await click(f,'comparison_final',true);
   await f.page.locator('[data-amazon-model="casio-ae1200"][data-placement="comparison_final"]').click({button:'middle'});
   await f.page.waitForTimeout(100);
   assert.equal(count(f,'outbound_amazon_click'),analytics?4:0);assert.equal(count(f,'conversion'),ads?4:0);assert.equal(count(f,'page_view'),analytics?1:0);
   assert.equal(f.requests.filter(u=>u.includes('gtag/js')).length,1);
   assert.equal(await f.page.locator('iframe').count(),0);
   assert.equal(await f.page.evaluate(()=>typeof window.gtag),'undefined');
   const cmd=await commands(f);assert.doesNotMatch(JSON.stringify(cmd),/secret|private|email|purchase|transaction_id|event_callback/);
   assert.equal(cmd.filter(c=>c[0]==='config').length,Number(analytics)+Number(ads));
   assert.ok(cmd.filter(c=>c[0]==='consent').every(c=>c[2].ad_personalization==='denied'));
   assert.ok(cmd.filter(c=>c[1]==='conversion').every(c=>c[2].send_to==='AW-18511081247/3QZeCKShgZwdEJ_e4vpE'&&!('value'in c[2])&&!('currency'in c[2])));
   assert.equal(new URL(f.page.url()).searchParams.has('gclid'),ads);assert.doesNotMatch(f.page.url(),/email|secret|private/);
   assert.equal(await f.page.evaluate(()=>localStorage.getItem('_gcl_ls')!==null),ads);
   const cookies=await f.context.cookies();assert.equal(cookies.some(c=>c.name==='_ga'),analytics);assert.equal(cookies.some(c=>c.name==='_gcl_aw'),ads);
   // Save unchanged choices: no second SDK, no duplicate view/events.
   await select(f,analytics,ads);assert.equal(f.requests.filter(u=>u.includes('gtag/js')).length,1);
   await f.context.close();report.passed.push(`analytics=${analytics}, advertising=${ads}: exact destinations, four intentional activations, one shared loader, scoped cookies`);
  }
  for(const revoked of ['analytics','advertising']){
   const f=await fixture();await select(f,true,true);await ready(f,true);await click(f);
   await f.page.evaluate(()=>{window.oldDocument=true;localStorage.setItem('unrelated','keep')});
   await select(f,revoked!=='analytics',revoked!=='advertising');await ready(f,revoked==='analytics');
   await click(f,'comparison_final');await f.page.waitForTimeout(100);
   assert.equal(await f.page.evaluate(()=>window.oldDocument),undefined);
   assert.equal(count(f,'page_view'),revoked==='analytics'?1:2);assert.equal(count(f,'conversion'),revoked==='advertising'?1:2);assert.equal(count(f,'outbound_amazon_click'),revoked==='analytics'?1:2);
   const cookies=await f.context.cookies();assert.equal(cookies.some(c=>c.name==='_ga'),revoked!=='analytics');assert.equal(cookies.some(c=>c.name==='_gcl_aw'),revoked!=='advertising');
   assert.equal(await f.page.evaluate(()=>localStorage.getItem('_gcl_ls')!==null),revoked!=='advertising');
   assert.equal(await f.page.evaluate(()=>localStorage.getItem('unrelated')),'keep');
   await select(f,false,false);const before=f.requests.length;await click(f);await f.page.waitForTimeout(100);assert.equal(f.requests.length,before);assert.equal(await f.page.locator('iframe').count(),0);
   assert.equal((await f.context.cookies()).filter(c=>/^_g/.test(c.name)).length,0);
   await select(f,true,true);await ready(f,true);await click(f);assert.equal(count(f,'page_view'),revoked==='analytics'?2:3);
   await f.context.close();report.passed.push(`withdraw ${revoked}: full document reload, other purpose continues, one view per document, linker storage and cookie timer cleared; regrant has no replay`);
  }
  const legacy=await fixture({stored:{analytics:'accepted'}});await ready(legacy);assert.equal(await legacy.page.locator('[data-purpose="advertising"]').isChecked(),false);assert.equal((await commands(legacy)).filter(c=>c[0]==='config'&&c[1].startsWith('AW-')).length,0);await legacy.context.close();report.passed.push('legacy analytics permission never authorizes advertising');
  for(const signal of ['gpc','dnt']){const f=await fixture({signal,stored:{analytics:'accepted',advertising:'accepted'}});assert.equal(f.requests.length,0);await f.page.locator('#analytics-settings').click();assert.equal(await f.page.locator('[data-purpose="advertising"]').isDisabled(),true);assert.equal(await f.page.getByRole('button',{name:'Save choices',exact:true}).isDisabled(),true);await f.context.close();report.passed.push(signal+' overrides both stored grants');}
  for(const mode of ['blocked','pending']){const f=await fixture({mode});await select(f,true,true);await click(f);await select(f,false,false);f.completeTag();await f.page.waitForTimeout(150);assert.equal(f.events.length,0);assert.equal((await f.context.cookies()).filter(c=>/^_g/.test(c.name)).length,0);await f.context.close();report.passed.push(mode+' provider preserves native navigation and drops revoked queues');}
  const storage=await fixture({blockedStorage:true});await select(storage,true,true);await click(storage);assert.equal(storage.requests.length,0);await storage.context.close();report.passed.push('blocked storage cannot grant either purpose');
  const preview=await fixture({site:'https://preview.vercel.app'});await select(preview,true,true);assert.equal(preview.requests.length,0);await preview.context.close();report.passed.push('preview origins never load measurement even in enabled fixture');
  const cross=await fixture({stored:{analytics:'accepted',advertising:'accepted'}});await ready(cross,true);const other=await cross.context.newPage();await other.goto(origin+comparison,{waitUntil:'networkidle'});await other.evaluate(k=>localStorage.setItem(k,JSON.stringify({choice:'rejected',at:Date.now()})),keys.advertising);await cross.page.waitForTimeout(100);await cross.page.waitForLoadState('networkidle');await ready(cross);await click(cross);assert.equal(count(cross,'conversion'),0);assert.equal(count(cross,'outbound_amazon_click'),1);await cross.context.close();report.passed.push('cross-tab Ads withdrawal immediately preserves analytics-only operation');
  for(const reason of ['gpc','expiry']){
   const dynamic=await fixture({stored:{analytics:'accepted',advertising:'accepted'}});await ready(dynamic,true);
   await dynamic.page.evaluate(({reason,keys})=>{window.oldDocument=true;if(reason==='gpc')Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});else for(const key of Object.values(keys))localStorage.setItem(key,JSON.stringify({choice:'accepted',at:1}));},{reason,keys});
   await click(dynamic);await dynamic.page.waitForTimeout(100);await dynamic.page.waitForLoadState('networkidle');
   assert.equal(await dynamic.page.evaluate(()=>window.oldDocument),undefined);assert.equal(count(dynamic,'conversion'),0);
   assert.equal(await dynamic.page.evaluate(()=>localStorage.getItem('_gcl_ls')),null);
   const stoppedRequests=dynamic.requests.length;await click(dynamic);assert.equal(dynamic.requests.length,stoppedRequests);await dynamic.context.close();report.passed.push(reason+' detected on click without focus/update: immediate shutdown and reload, native navigation preserved');
  }
  for(const readOnly of ['writes','all']){
   const f=await fixture({stored:{analytics:'accepted',advertising:'accepted'}});await ready(f,true);
   await f.page.locator('#analytics-settings').click();
   await f.page.evaluate(mode=>{sessionStorage.readOnly=mode;Storage.prototype.setItem=function(){throw Error('read-only')};if(mode==='all')Storage.prototype.removeItem=function(){throw Error('read-only')};},readOnly);
   await f.page.getByRole('button',{name:'Reject all',exact:true}).click();await f.page.waitForTimeout(100);await f.page.waitForLoadState('networkidle');
   const before=f.requests.length;await f.page.reload({waitUntil:'networkidle'});await click(f);assert.equal(f.requests.length,before);assert.equal(count(f,'conversion'),0);
   await f.context.close();report.passed.push('rejection with '+readOnly+' blocked cannot regrant stale acceptance after reload');
  }
  for(const width of [1165,390]){const f=await fixture({width});assert.ok(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===1165)assert.ok(await f.page.locator('[data-placement="comparison_pick"]').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().bottom<=747)));const sizes=await f.page.locator('.consent-actions button').evaluateAll(es=>es.map(e=>({w:e.offsetWidth,h:e.offsetHeight})));assert.deepEqual(sizes[0],sizes[1]);assert.ok(sizes[0].h>=44);await f.page.screenshot({path:path.join(output,`consent-${width}.png`)});await f.page.locator('[data-purpose="analytics"]').focus();await f.page.keyboard.press('Space');await f.page.keyboard.press('Tab');assert.equal(await f.page.locator('[data-purpose="advertising"]').evaluate(e=>document.activeElement===e),true);await f.context.close();}report.passed.push('1165px/390px no overflow, equal save/reject buttons, keyboard-operable separate purposes');
  assert.deepEqual(report.errors,[]);assert.match(await fs.readFile('src/ads-config.js','utf8'),/enabled: false/);report.status='PASS';
 }catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
 finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
