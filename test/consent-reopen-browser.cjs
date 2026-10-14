// Reproduce footer reopening with persisted rejection; no affiliate clicks or live requests.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = process.argv[2] || '/tmp/dwf-consent-reopen';
const origin = 'https://dailywatchfinds.com';
(async () => {
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const report = {cases:[],errors:[],measurementRequests:[],affiliateRequests:[],failures:[],type:'Local files, mocked images, persisted measurement rejection; no live requests'};
  try {
    for (const viewport of [{width:1165,height:747},{width:1440,height:900},{width:390,height:844},{width:320,height:568}]) {
      for (const route of ['/','/compare/casio-f91w-vs-ae1200/']) {
        for (const interaction of ['pointer','keyboard']) {
        const context = await browser.newContext({viewport});
        await context.addInitScript(() => {
          for (const key of ['dwf.analytics-consent.v1','dwf.advertising-consent.v1']) localStorage.setItem(key,JSON.stringify({choice:'rejected',at:Date.now()}));
        });
        await context.route('**/*',async interception => {
          const req=interception.request(),url=new URL(req.url());
          if (/googletagmanager|google-analytics|googleadservices|doubleclick/.test(url.hostname)) report.measurementRequests.push(url.href);
          if (/amazon\.com$/.test(url.hostname)) report.affiliateRequests.push(url.href);
          if (url.origin!==origin) {
            if (req.resourceType()==='image') return interception.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"><rect width="700" height="700" fill="#e7e9df"/></svg>'});
            return interception.abort();
          }
          const file=path.join(process.cwd(),'public',url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
          const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
          try {return interception.fulfill({status:200,contentType:type,body:await fs.readFile(file)});} catch {return interception.fulfill({status:404,body:''});}
        });
        const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
        const state=()=>page.evaluate(()=>{
          const content=document.querySelector('#site-content'),panel=document.querySelector('#analytics-consent');
          const c=content.getBoundingClientRect(),p=panel.getBoundingClientRect(),footer=document.querySelector('footer').getBoundingClientRect();
          const hit=document.elementFromPoint(innerWidth/2,Math.min(innerHeight/3,p.top/2));
          return {documentTop:scrollY,documentHeight:document.documentElement.scrollHeight,contentTop:c.top,contentBottom:c.bottom,contentScroll:content.scrollTop,contentHeight:content.scrollHeight,contentClient:content.clientHeight,panelTop:p.top,panelHidden:panel.hidden,footerTop:footer.top,footerBottom:footer.bottom,paintedContent:!!hit&&content.contains(hit),active:document.activeElement?.id||document.activeElement?.tagName,choices:[...document.querySelectorAll('[data-purpose]')].map(el=>el.checked)};
        });
        await page.goto(origin+route,{waitUntil:'networkidle'});
        await page.waitForSelector('#analytics-settings:not([hidden])');
        assert.equal((await state()).panelHidden,true);
        await page.keyboard.press('Control+End');
        await page.waitForFunction(()=>{const r=document.querySelector('#analytics-settings').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});
        await page.waitForTimeout(200);
        const before=await state();
        if (interaction==='pointer') {
          const button=await page.locator('#analytics-settings').boundingBox();
          await page.mouse.click(button.x+button.width/2,button.y+button.height/2);
        } else {
          await page.keyboard.press('Shift+Tab');
          assert.equal(await page.locator('#analytics-settings').evaluate(el=>el===document.activeElement),true);
          await page.keyboard.press('Enter');
        }
        await page.waitForFunction(()=>document.documentElement.classList.contains('consent-open'));
        await page.waitForTimeout(250);
        const after=await state();
        const entry={viewport,route,interaction,before,after,pass:Math.abs(after.contentTop)<1&&after.contentBottom>0&&after.paintedContent&&after.documentHeight<=viewport.height+1};
        report.cases.push(entry);
        if(!entry.pass)report.failures.push(`${viewport.width}px ${route} ${interaction}: page blank/offscreen after footer reopen`);
        await page.screenshot({path:path.join(output,`${route==='/'?'home':'comparison'}-${viewport.width}-${interaction}.png`)});
        assert.deepEqual(after.choices,[false,false]);
        if (entry.pass) {
          assert.ok(Math.abs(after.contentScroll-before.documentTop)<=1,'opening preserves the reading position');
          assert.equal(await page.locator('[data-purpose="analytics"]').evaluate(el=>el===document.activeElement),true);
          entry.cycles=[];
          for (let cycle=0;cycle<2;cycle++) {
            const position=(await state()).contentScroll;
            if (interaction==='pointer') await page.getByRole('button',{name:'Reject all',exact:true}).click();
            else {
              await page.keyboard.press('Tab'); // Advertising checkbox.
              await page.keyboard.press('Tab'); // Save.
              await page.keyboard.press('Tab'); // Reject.
              await page.keyboard.press('Enter');
            }
            await page.waitForFunction(()=>!document.documentElement.classList.contains('consent-open'));
            const closed=await state();
            assert.ok(Math.abs(closed.documentTop-position)<=1,'closing preserves the reading position');
            assert.equal(closed.active,'analytics-settings');
            if (interaction==='pointer') await page.locator('#analytics-settings').click();
            else await page.keyboard.press('Enter');
            await page.waitForFunction(()=>document.documentElement.classList.contains('consent-open'));
            const reopened=await state();
            assert.equal(reopened.documentTop,0);assert.equal(reopened.contentTop,0);assert.equal(reopened.paintedContent,true);
            assert.ok(Math.abs(reopened.contentScroll-closed.documentTop)<=1);
            assert.deepEqual(reopened.choices,[false,false]);
            entry.cycles.push({closed,reopened});
          }
        }
        await context.close();
        }
      }
    }
    assert.deepEqual(report.measurementRequests,[]);assert.deepEqual(report.affiliateRequests,[]);assert.deepEqual(report.errors,[]);
    report.status=report.failures.length?'FAIL':'PASS';if(report.failures.length)process.exitCode=1;
  }catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
  finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
