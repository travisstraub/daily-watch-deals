// Optional browser verification; requires Playwright and Chromium in the environment.
// Amazon navigation is intercepted locally: these checks never send affiliate clicks.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const baseURL = process.argv[2] || 'http://127.0.0.1:4173';
const output = process.argv[3] || '/tmp/dwf-browser-evidence';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'],
  });
  const report = { baseURL, checked: [], outboundNavigationsIntercepted: 0, imageFailures: [], errors: [] };
  try {
    const context = await browser.newContext();
    await context.route('https://www.amazon.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Intercepted navigation</title>' }));
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    const routes = [
      ['home', '/'], ['comparison', '/compare/casio-f91w-vs-ae1200/'],
      ['product', '/watches/casio-ae1200/'], ['digital', '/styles/digital/'],
      ['privacy', '/privacy/'],
    ];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, route] of routes) {
        const response = await page.goto(baseURL + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflows at ${width}px`);
        if (name === 'comparison') {
          assert.equal(await page.locator('.fit-drawing').count(), 2);
          assert.equal(await page.locator('a[data-placement="comparison_pick"]').count(), 2);
          assert.equal(await page.locator('a[data-amazon-model="casio-ae1200"]').getAttribute('href'), 'https://www.amazon.com/dp/B0094B79CI?tag=straubmediagr-20');
          if (width === 390) assert.ok(await page.locator('.table-wrap').evaluate(el => el.scrollWidth > el.clientWidth));
        }
        if (name === 'product') assert.equal(await page.locator('.mobile-buy').isVisible(), width === 390);
        if (name === 'home') {
          await page.locator('[data-filter="Digital"]').click();
          await page.locator('#search').fill('F-91W');
          assert.equal(await page.locator('.card:visible').count(), 1);
          await page.locator('#search').fill('not a watch');
          assert.equal(await page.locator('#empty').isVisible(), true);
          await page.locator('#reset').click();
          assert.equal(await page.locator('.card:visible').count(), 30);
        }
        const broken = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src));
        report.imageFailures.push(...broken);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
        report.checked.push(`${name}: ${width}px, no page overflow`);
      }
    }
    assert.ok(!requests.some(url => /google-analytics|googletagmanager|plausible|segment|vercel-insights/.test(url)), 'third-party analytics requested');
    const comparison = '/compare/casio-f91w-vs-ae1200/';
    await page.goto(baseURL + comparison + '?utm_source=google&utm_medium=cpc&utm_campaign=first50&utm_content=comparison&email=private@example.test&gclid=private', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { installOutboundTracking } = await import('/analytics.js');
      const { catalog, pages } = await import('/tracking-catalog.js');
      window.testEvents = [];
      window.stopTestTracking = installOutboundTracking({ document, location, catalog, pages, enabled: true, send: event => window.testEvents.push(event) });
    });
    const link = page.locator('[data-amazon-model="casio-ae1200"]');
    async function navigate(action) {
      const popupPromise = page.waitForEvent('popup');
      await action();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(popup.url(), 'https://www.amazon.com/dp/B0094B79CI?tag=straubmediagr-20');
      assert.equal(await popup.title(), 'Intercepted navigation');
      report.outboundNavigationsIntercepted++;
      await popup.close();
    }
    await navigate(() => link.click());
    await navigate(() => link.click());
    await link.focus();
    await navigate(() => page.keyboard.press('Enter'));
    await link.click({ button: 'middle' });
    report.checked.push('middle activation emits once; headless Chromium does not open a tab for this action');
    const events = await page.evaluate(() => window.testEvents);
    assert.equal(events.length, 4);
    assert.deepEqual(events[0], {
      event: 'outbound_amazon_click', model: 'AE-1200WHD-1AV', page: comparison,
      placement: 'comparison_pick', destination_type: 'direct_product',
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'first50', utm_content: 'comparison',
    });
    assert.ok(!JSON.stringify(events).includes('private'));
    for (const mode of ['throw', 'reject', 'pending']) {
      await page.evaluate(async mode => {
        window.stopTestTracking();
        const { installOutboundTracking } = await import('/analytics.js');
        const { catalog, pages } = await import('/tracking-catalog.js');
        window.stopTestTracking = installOutboundTracking({ document, location, catalog, pages, enabled: true, send: () => {
          if (mode === 'throw') throw new Error('test sender failure');
          if (mode === 'reject') return Promise.reject(new Error('test sender rejection'));
          return new Promise(() => {});
        } });
      }, mode);
      await navigate(() => link.click());
      report.checked.push(`ordinary navigation with ${mode} sender`);
    }
    await page.evaluate(() => window.stopTestTracking());
    await page.route('**/consent.js', route => route.abort());
    await page.reload({ waitUntil: 'networkidle' });
    await navigate(() => link.click());
    report.checked.push('ordinary navigation when consent controls fail to load');
    await context.close();
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    await noJS.route('https://www.amazon.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: 'Intercepted navigation' }));
    const plain = await noJS.newPage();
    await plain.goto(baseURL + comparison);
    const popupPromise = plain.waitForEvent('popup');
    await plain.locator('[data-amazon-model="casio-ae1200"]').click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(), 'https://www.amazon.com/dp/B0094B79CI?tag=straubmediagr-20');
    report.outboundNavigationsIntercepted++;
    report.checked.push('ordinary navigation with JavaScript disabled');
    await noJS.close();
    assert.deepEqual(report.errors, []);
    report.imageFailures = [...new Set(report.imageFailures)];
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL'; report.failure = error.stack; process.exitCode = 1;
  } finally {
    await browser.close();
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  }
})();
