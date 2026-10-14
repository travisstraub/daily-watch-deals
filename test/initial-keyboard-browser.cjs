// Fresh keyboard scrolling before any pointer interaction or content focus.
// Every request is fulfilled from local files or a mock; no live network traffic.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = process.argv[2] || '/tmp/dwf-initial-keyboard';
const origin = 'https://dailywatchfinds.com';
const pagePath = process.argv[3] || '/compare/casio-f91w-vs-ae1200/';
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
  const report = { pagePath, cases:[], controlChecks:[], errors:[], measurementRequests:[], failures:[], type:'Local files at simulated production origin; all measurement mocked' };
  try {
    for (const viewport of [{width:1165,height:747},{width:390,height:844},{width:320,height:568}]) {
      for (const key of ['PageDown','Space','ArrowDown']) {
        const context = await browser.newContext({ viewport });
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (/googletagmanager|google-analytics|googleadservices|doubleclick/.test(url.hostname)) {
            report.measurementRequests.push(url.href);
            return route.fulfill({status:200,contentType:'text/javascript',body:'/* intercepted measurement mock */'});
          }
          if (url.origin !== origin) return route.abort();
          const file = path.join(process.cwd(),'public',url.pathname.endsWith('/') ? url.pathname+'index.html' : url.pathname);
          const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
          try { return route.fulfill({status:200,contentType:type,body:await fs.readFile(file)}); }
          catch { return route.fulfill({status:404,body:''}); }
        });
        const page = await context.newPage();
        page.on('pageerror',e => report.errors.push(e.message));
        await page.goto(origin+pagePath,{waitUntil:'networkidle'});
        await page.waitForSelector('.consent-open #site-content');
        const state = () => page.evaluate(() => ({ content:document.querySelector('#site-content').scrollTop, document:scrollY, active:document.activeElement.tagName, checked:[...document.querySelectorAll('[data-purpose]')].map(el=>el.checked), visible:!document.querySelector('#analytics-consent').hidden }));
        const before = await state();
        assert.equal(before.active,'BODY','test must begin with no content/control focus');
        assert.equal(before.content,0); assert.equal(before.document,0);
        await page.keyboard.press(key);
        await page.waitForTimeout(350);
        const after = await state();
        const entry = {viewport,key,before,after,pass:after.content>before.content};
        report.cases.push(entry);
        if (!entry.pass) report.failures.push(`${viewport.width}px ${key}: page did not scroll`);
        assert.deepEqual(after.checked,[false,false]); assert.equal(after.visible,true);
        assert.equal(after.active,'BODY','scrolling must not move focus');
        if (entry.pass) {
          const reverse = key === 'Space' ? 'Shift+Space' : key === 'PageDown' ? 'PageUp' : 'ArrowUp';
          await page.keyboard.press(reverse);
          await page.waitForTimeout(100);
          entry.reverse = { key:reverse, content:(await state()).content };
          assert.ok(entry.reverse.content < after.content);
        }
        if (entry.pass && key === 'PageDown') {
          await page.keyboard.press('End');
          assert.ok((await state()).content > after.content);
          await page.keyboard.press('Home');
          assert.equal((await state()).content,0);
          // Use only Tab/Space to reach and operate controls, not focus()/click().
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('.skip').evaluate(el=>el===document.activeElement),true);
          await page.keyboard.press('Tab'); // Privacy link.
          await page.keyboard.press('Tab'); // Analytics checkbox.
          assert.equal(await page.locator('[data-purpose="analytics"]').evaluate(el=>el===document.activeElement),true);
          await page.keyboard.press('Space');
          assert.equal(await page.locator('[data-purpose="analytics"]').isChecked(),true);
          assert.equal((await state()).content,0);
          await page.keyboard.press('Space'); // Restore unchecked before saving.
          await page.keyboard.press('Tab');
          await page.keyboard.press('Space');
          assert.equal(await page.locator('[data-purpose="advertising"]').isChecked(),true);
          await page.keyboard.press('Space');
          await page.keyboard.press('Tab'); // Save choices.
          await page.keyboard.press('Space');
          await page.waitForFunction(()=>!document.documentElement.classList.contains('consent-open'));
          assert.equal((await state()).visible,false);
          await page.reload({waitUntil:'networkidle'});
          const dismissed = await state();
          assert.equal(dismissed.visible,false); assert.equal(dismissed.active,'BODY');
          await page.keyboard.press('PageDown');
          await page.waitForTimeout(350);
          assert.ok((await state()).document>0,'normal document keyboard scroll resumes with panel closed');
          report.controlChecks.push(`${viewport.width}px: reverse/Home/End keys, first Tab skip link, native checkbox/button Space, persisted rejection and normal document scroll`);
        }
        await context.close();
      }
    }
    assert.deepEqual(report.measurementRequests,[]); assert.deepEqual(report.errors,[]);
    report.status = report.failures.length ? 'FAIL' : 'PASS';
    if (report.failures.length) process.exitCode=1;
  } catch(e) {report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
  finally {await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
