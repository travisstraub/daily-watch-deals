// Local files + mocked Google SDK only. Every external request is intercepted.
// This never runs against the live preview and never submits a real Google event.
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const output=process.argv[2]||'/tmp/dwf-private-tag-evidence';
const mock=`(()=>{window.testCommands=[];function process(args){const c=Array.from(args);testCommands.push(c);if(c[0]==='config'){document.cookie='_gcl_aw=mock; Path=/; Secure';localStorage.setItem('_gcl_ls','mock')}if(c[0]==='event')fetch('https://www.googleadservices.com/pagead/conversion/18511081247/',{method:'POST',body:JSON.stringify(c)})}dataLayer.forEach(process);const push=dataLayer.push.bind(dataLayer);dataLayer.push=function(args){process(args);return push(args)}})();`;
(async()=>{
 const {tagTest}=await import('../src/tag-test-config.js');
 await fs.mkdir(output,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const report={scope:'Local mock only; zero real SDK/collection requests or live test events',passed:[],errors:[]};
 async function fixture({origin=tagTest.origin,signal,blockedStorage=false,mode='success',width=390}={}){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),requests=[],events=[];
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.addInitScript(({signal,blockedStorage})=>{if(signal)Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});if(blockedStorage)Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}})},{signal,blockedStorage});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='www.googletagmanager.com'){requests.push(req.url());assert.equal(req.headers().referer,undefined);if(mode==='failure')return route.abort();return route.fulfill({contentType:'text/javascript',body:mock})}
   if(url.hostname==='www.googleadservices.com'){events.push(JSON.parse(req.postData()));return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'},body:''})}
   if(url.origin===origin){const file=path.join(process.cwd(),'public',url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);try{return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:await fs.readFile(file)})}catch{return route.fulfill({status:404,body:''})}}
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+tagTest.path+'?email=secret@example.test&gclid=NOT_A_REAL_AD_CLICK&gtm_debug=x#private',{waitUntil:'networkidle'});
  return {context,page,requests,events};
 }
 async function accept(f){await f.page.locator('[data-purpose="advertising"]').check();await f.page.getByRole('button',{name:'Save choices',exact:true}).click();await f.page.waitForTimeout(100);await f.page.waitForLoadState('networkidle');}
 try{
  const f=await fixture();assert.equal(f.requests.length,0);assert.equal(await f.page.locator('#send-test').isDisabled(),true);assert.equal(await f.page.locator('[data-purpose="analytics"]').isDisabled(),true);assert.equal(f.page.url(),tagTest.origin+tagTest.path);
  await accept(f);await f.page.waitForFunction(()=>document.querySelector('#send-test').disabled===false);assert.equal(f.requests.length,1);assert.equal(f.events.length,0);
  const cmd=await f.page.evaluate(()=>testCommands);assert.deepEqual(cmd.filter(c=>c[0]==='config').map(c=>c[1]),['AW-18511081247']);assert.ok(cmd.filter(c=>c[0]==='consent').every(c=>c[2].analytics_storage==='denied'&&c[2].ad_personalization==='denied'));
  // Programmatic DOM click does not count as the operator's explicit activation.
  await f.page.locator('#send-test').evaluate(b=>b.click());assert.equal(f.events.length,0);
  await f.page.getByRole('button',{name:'Send ONE real Google Ads TEST event'}).click();await f.page.waitForTimeout(100);assert.equal(f.events.length,1);const event=f.events[0];assert.equal(event[1],'conversion');assert.equal(event[2].send_to,'AW-18511081247/3QZeCKShgZwdEJ_e4vpE');assert.equal(event[2].page_location,tagTest.origin+tagTest.path);
  for(const key of ['value','currency','transaction_id','user_data','model'])assert.ok(!(key in event[2]));assert.doesNotMatch(JSON.stringify(event),/email|secret|gclid|purchase/);assert.equal(f.page.url(),tagTest.origin+tagTest.path);assert.equal(f.context.pages().length,1);
  assert.equal(await f.page.locator('#send-test').isDisabled(),true);await f.page.reload({waitUntil:'networkidle'});assert.equal(await f.page.locator('#send-test').isDisabled(),true);assert.equal(f.events.length,1);
  const other=await f.context.newPage();await other.goto(tagTest.origin+tagTest.path,{waitUntil:'networkidle'});assert.equal(await other.locator('#send-test').isDisabled(),true);assert.equal(f.events.length,1);await other.close();
  await f.page.getByRole('button',{name:'Measurement choices',exact:true}).click();await f.page.getByRole('button',{name:'Reject all',exact:true}).click();await f.page.waitForTimeout(100);await f.page.waitForLoadState('networkidle');assert.equal(await f.page.evaluate(()=>localStorage.getItem('_gcl_ls')),null);assert.equal((await f.context.cookies()).some(c=>c.name==='_gcl_aw'),false);assert.equal(f.events.length,1);
  assert.match(await f.page.locator('#test-ledger').textContent(),/REQUEST_RESERVED_DELIVERY_UNVERIFIED/);await f.context.close();report.passed.push('Opt-in required; GA4 off; one trusted mock conversion with labeled preview URL, no Amazon navigation; repeated/reload/cross-tab guard; withdrawal reload and storage cleanup preserve ledger');
  for(const origin of ['https://dailywatchfinds.com','https://www.dailywatchfinds.com','https://other.vercel.app']){const f=await fixture({origin});assert.equal(f.requests.length,0);assert.equal(await f.page.locator('#send-test').isDisabled(),true);assert.match(await f.page.locator('#test-result').textContent(),/unavailable/);await f.context.close();}report.passed.push('Production, www and other preview origins cannot initialize test mode or send Google requests');
  for(const opts of [{signal:true},{blockedStorage:true},{mode:'failure'}]){const f=await fixture(opts);if(!opts.signal)await accept(f);assert.equal(f.events.length,0);assert.equal(await f.page.locator('#send-test').isDisabled(),true);await f.context.close();}report.passed.push('GPC, blocked storage and failed SDK fail closed without test-event replay');
  const lost=await fixture();await accept(lost);await lost.page.evaluate(()=>{window.oldDocument=true;Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true})});await lost.page.waitForFunction(()=>window.oldDocument===undefined);await lost.page.waitForLoadState('networkidle');assert.equal(lost.events.length,0);assert.equal(await lost.page.locator('#send-test').isDisabled(),true);assert.equal(await lost.page.evaluate(()=>localStorage.getItem('_gcl_ls')),null);await lost.context.close();report.passed.push('A newly appearing privacy signal unloads the initialized mock SDK without a test event, even when the test button becomes disabled');
  for(const width of [1165,390]){const f=await fixture({width});assert.ok(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await f.page.screenshot({path:path.join(output,'private-test-'+width+'.png'),fullPage:true});await f.context.close();}report.passed.push('1165px desktop and 390px mobile have no horizontal overflow; screenshots captured');
  assert.deepEqual(report.errors,[]);report.status='PASS';
 }catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1}finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
})();
