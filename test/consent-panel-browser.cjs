// Presentation regressions only. All non-local traffic is intercepted; no live conversions.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const baseURL = process.argv[2] || 'http://127.0.0.1:4183';
const output = process.argv[3] || '/tmp/dwf-consent-panel';
const comparison = '/compare/casio-f91w-vs-ae1200/';
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const report = { baseURL, layouts: [], passed: [], errors: [], measurementRequests: [] };
  async function fixture(viewport, layoutBlocked = false) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (/google-analytics|googletagmanager|googleadservices|doubleclick/.test(url.hostname)) report.measurementRequests.push(url.href);
      if (layoutBlocked && url.pathname === '/consent-layout.js') return route.abort();
      return url.origin === new URL(baseURL).origin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(baseURL + comparison, { waitUntil: 'networkidle' });
    await page.waitForSelector('#analytics-settings:not([hidden])');
    return { context, page };
  }
  async function measurements(page) {
    return page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, width:r.width, height:r.height }; };
      const panel = document.querySelector('#analytics-consent'), content = document.querySelector('#site-content'), copy = panel.querySelector('.consent-copy');
      const bar = document.querySelector('.mobile-buy');
      return { panel:rect(panel), content:rect(content), buttons:[...panel.querySelectorAll('button')].map(rect), bar:bar && rect(bar), panelScrollable:copy.scrollHeight > copy.clientHeight, horizontalOverflow:[document.documentElement,content,panel,copy].some(el => el.scrollWidth > el.clientWidth + 1), offset:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--consent-offset')) };
    });
  }
  async function checkLayout(page, viewport) {
    const m = await measurements(page);
    assert.equal(m.horizontalOverflow, false);
    assert.ok(m.panel.top >= 0 && m.panel.bottom <= viewport.height, 'panel fits viewport');
    assert.ok(m.content.bottom <= m.panel.top - 10, 'page scroll area ends above panel');
    assert.ok(m.buttons.every(b => b.top >= m.panel.top && b.bottom <= m.panel.bottom && b.height >= 44), 'both actions remain visible');
    assert.equal(m.buttons[0].width, m.buttons[1].width);
    assert.equal(m.buttons[0].height, m.buttons[1].height);
    if (m.bar?.height) { assert.ok(m.bar.bottom <= m.panel.top - 10, 'fixed Amazon bar clears panel'); assert.ok(m.content.bottom <= m.bar.top - 10, 'page content clears fixed Amazon bar'); }
    return m;
  }
  async function checkReachable(page, selector) {
    const target = page.locator(selector).first();
    await target.focus();
    await page.waitForTimeout(50);
    const result = await target.evaluate(el => {
      const r = el.getBoundingClientRect(), content = document.querySelector('#site-content').getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const bar = document.querySelector('.mobile-buy')?.getBoundingClientRect();
      return { top:r.top, bottom:r.bottom, limit:el.closest('.mobile-buy') ? bar.bottom : content.bottom, hit:el.contains(hit), focused:document.activeElement === el };
    });
    assert.ok(result.focused && result.hit && result.top >= 0 && result.bottom <= result.limit, JSON.stringify({selector,...result}));
  }
  try {
    for (const viewport of [{width:1165,height:747},{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      const { context, page } = await fixture(viewport);
      assert.equal(await page.locator('[data-purpose="analytics"]').isChecked(), false);
      assert.equal(await page.locator('[data-purpose="advertising"]').isChecked(), false);
      report.layouts.push({ viewport, page:'comparison', ...await checkLayout(page, viewport) });
      await page.screenshot({ path:path.join(output,`initial-${viewport.width}.png`) });
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip').evaluate(el => el === document.activeElement), true);
      for (const slug of ['casio-f91w','casio-ae1200']) await checkReachable(page, `[data-placement="comparison_pick"][data-amazon-model="${slug}"]`);
      if (viewport.width === 390) await page.screenshot({ path:path.join(output,'shopping-link-390.png') });
      await checkReachable(page, '[data-placement="comparison_final"]');
      // Closing/reopening the panel must not reset the reading position.
      await page.locator('#site-content').evaluate(el => el.scrollTop = 300);
      const before = await page.locator('#site-content').evaluate(el => el.scrollTop);
      await page.getByRole('button',{name:'Reject all',exact:true}).click();
      await page.waitForFunction(() => !document.documentElement.classList.contains('consent-open'));
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - before) <= 1);
      assert.equal(await page.locator('#analytics-settings').evaluate(el => el === document.activeElement), true);
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await page.locator('#analytics-consent').isVisible(), false);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('consent-open')), false);
      await page.locator('#analytics-settings').click();
      assert.equal(await page.locator('[data-purpose="analytics"]').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Space');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('[data-purpose="advertising"]').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.getByRole('button',{name:'Save choices',exact:true}).evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Enter');
      await page.reload({waitUntil:'networkidle'});
      await page.locator('#analytics-settings').click();
      assert.equal(await page.locator('[data-purpose="analytics"]').isChecked(), true);
      assert.equal(await page.locator('[data-purpose="advertising"]').isChecked(), false);
      await page.getByRole('button',{name:'Reject all',exact:true}).click();
      // Fresh product page: the mobile Amazon bar must remain separately reachable.
      await page.evaluate(() => localStorage.clear());
      await page.goto(baseURL + '/watches/casio-ae1200/',{waitUntil:'networkidle'});
      report.layouts.push({ viewport, page:'product', ...await checkLayout(page, viewport) });
      await checkReachable(page, '[data-placement="product_primary"]');
      if (viewport.width <= 640) await checkReachable(page, '[data-placement="product_mobile"]');
      await page.screenshot({path:path.join(output,`product-${viewport.width}.png`)});
      await page.locator('#analytics-settings').click();
      await checkLayout(page, viewport);
      await context.close();
    }
    report.passed.push('unchecked defaults; independent saved choices and rejection persist after reload at four viewport sizes', 'page scroll area and sticky Amazon bar clear panel; primary/final/product links remain focusable and unobscured', 'equal visible Save/Reject buttons, skip link, keyboard selection, footer reopening and preserved reading position');
    const enlarged = await fixture({width:320,height:568});
    await enlarged.page.addStyleTag({content:'.consent-floating p,.consent-floating .consent-purposes label{font-size:26px!important}.consent-floating h2{font-size:36px!important}'});
    await enlarged.page.waitForTimeout(100);
    const large = await checkLayout(enlarged.page,{width:320,height:568});
    assert.equal(large.panelScrollable,true);
    await enlarged.page.locator('[data-purpose="advertising"]').focus();
    await enlarged.page.keyboard.press('Space');
    await enlarged.page.keyboard.press('Tab');
    assert.equal(await enlarged.page.getByRole('button',{name:'Save choices',exact:true}).evaluate(el => el === document.activeElement),true);
    await enlarged.page.screenshot({path:path.join(output,'enlarged-text-320.png')});
    await enlarged.context.close();
    const fallback = await fixture({width:390,height:844},true);
    assert.equal(await fallback.page.locator('#analytics-consent').evaluate(el => getComputedStyle(el).position), 'static');
    await fallback.page.getByRole('button',{name:'Reject all',exact:true}).click();
    assert.equal(await fallback.page.locator('#analytics-consent').isVisible(),false);
    await fallback.context.close();
    report.passed.push('enlarged explanatory text scrolls with both actions visible; blocked layout module retains working in-flow controls');
    assert.deepEqual(report.measurementRequests,[]);
    assert.deepEqual(report.errors,[]);
    report.status='PASS';
  } catch(e) { report.status='FAIL'; report.failure=e.stack; process.exitCode=1; }
  finally { await browser.close(); await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report,null,2)); }
})();
