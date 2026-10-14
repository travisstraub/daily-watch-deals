// Read every editorial page at desktop/mobile widths; never activate affiliate links.
// All requests are served from the build or blocked/mocked. No live measurement.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const origin = 'https://dailywatchfinds.com';
const output = process.argv[2] || '/tmp/dwf-editorial-browser';
(async () => {
  await fs.mkdir(output, {recursive:true});
  const sitemap = await fs.readFile('public/sitemap.xml','utf8');
  const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname).concat('/404.html');
  const screenshots = new Set(['/','/guide/','/compare/casio-f91w-vs-ae1200/','/watches/casio-f91w/','/watches/citizen-brycen/','/styles/everyday/']);
  const report = {type:'Local generated files at simulated production origin; external images mocked; no affiliate activation',pages:[],errors:[],measurementRequests:[],affiliateRequests:[]};
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
      const context = await browser.newContext({viewport});
      await context.route('**/*',async route=>{
        const request=route.request(),url=new URL(request.url());
        if (/googletagmanager|google-analytics|googleadservices|doubleclick/.test(url.hostname)) report.measurementRequests.push(url.href);
        if (/(^|\.)amazon\.com$/.test(url.hostname)) report.affiliateRequests.push(url.href);
        if (url.origin!==origin) {
          if(request.resourceType()==='image') return route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"><rect width="700" height="700" fill="#e7e9df"/><text x="350" y="350" text-anchor="middle" fill="#526052">Product image mocked for local check</text></svg>'});
          return route.abort();
        }
        const file=path.join(process.cwd(),'public',url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
        const contentType=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
        try {return route.fulfill({status:200,contentType,body:await fs.readFile(file)});}
        catch {return route.fulfill({status:404,body:''});}
      });
      const page=await context.newPage();
      page.on('pageerror',e=>report.errors.push(e.message));
      for (const pagePath of routes) {
        await page.goto(origin+pagePath,{waitUntil:'networkidle'});
        await page.waitForSelector('#analytics-settings:not([hidden])');
        const state=await page.evaluate(()=>{
          const panel=document.querySelector('#analytics-consent');
          const main=document.querySelector('main');
          return {title:document.title,h1s:main.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,
            choices:[...document.querySelectorAll('[data-purpose]')].map(el=>el.checked),panelVisible:!panel.hidden,
            affiliateLinks:main.querySelectorAll('a[data-amazon-model]').length,
            mainOverflow:main.scrollWidth>main.clientWidth+1};
        });
        assert.equal(state.h1s,1,pagePath);assert.equal(state.overflow,false,pagePath);assert.equal(state.mainOverflow,false,pagePath);
        assert.equal(state.panelVisible,true);assert.deepEqual(state.choices,[false,false]);
        if(screenshots.has(pagePath)) {
          const name=pagePath==='/'?'home':pagePath.replace(/^\/|\/$/g,'').replaceAll('/','-');
          await page.screenshot({path:path.join(output,`${name}-${viewport.width}-consent.png`)});
        }
        // Scroll the current content region to ensure the footer remains reachable.
        await page.locator('#site-content').evaluate(el=>{el.scrollTop=el.scrollHeight;});
        const footerReachable=await page.locator('#analytics-settings').evaluate(el=>{
          const r=el.getBoundingClientRect(),panel=document.querySelector('#analytics-consent').getBoundingClientRect();
          return r.top>=0&&r.bottom<=panel.top;
        });
        assert.equal(footerReachable,true,pagePath+' footer');
        report.pages.push({path:pagePath,viewport,...state,footerReachable});
      }
      await context.close();
    }
    assert.equal(report.pages.length,84);assert.deepEqual(report.errors,[]);
    assert.deepEqual(report.measurementRequests,[]);assert.deepEqual(report.affiliateRequests,[]);
    report.status='PASS';
  } catch(e) {report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
  finally {await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,pages:report.pages.length,errors:report.errors,failure:report.failure,measurementRequests:report.measurementRequests,affiliateRequests:report.affiliateRequests},null,2));}
})();
