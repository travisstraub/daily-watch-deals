// Builds an isolated Ads-disabled rollback fixture and uses a mock Google tag. No Google or Amazon request leaves the test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const origin = 'https://dailywatchfinds.com';
const comparison = '/compare/casio-f91w-vs-ae1200/';
const output = process.argv[2] || '/tmp/dwf-consent-evidence';
const key = 'dwf.analytics-consent.v1';
const mockTag = `(() => {
  window.mockCommands = [];
  let consent = 'denied';
  function process(args) {
    const command = Array.from(args); window.mockCommands.push(command);
    if (command[0] === 'consent') consent = command[2].analytics_storage;
    if (window['ga-disable-G-LSGXWGSM9T'] || consent !== 'granted') return;
    if (command[0] === 'config') document.cookie = '_ga=mock-client; Path=/; SameSite=Lax; Secure';
    if (command[0] === 'event') fetch('https://www.google-analytics.com/g/collect', { method: 'POST', body: JSON.stringify(command), keepalive: true });
  }
  window.dataLayer.forEach(process);
  const push = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function(args) { process(args); return push(args); };
})();`;

(async () => {
  await fs.mkdir(output, { recursive: true });
  const fixtureRoot=await fs.mkdtemp(path.join(os.tmpdir(),'dwf-rollback-fixture-'));
  for(const name of ['src','scripts','content'])await fs.cp(path.join(process.cwd(),name),path.join(fixtureRoot,name),{recursive:true});
  await fs.mkdir(path.join(fixtureRoot,'public'));
  for(const name of ['style.css','favicon.svg'])await fs.copyFile('public/'+name,path.join(fixtureRoot,'public',name));
  await fs.writeFile(path.join(fixtureRoot,'package.json'),'{"type":"module"}');
  const configPath=path.join(fixtureRoot,'src/ads-config.js');
  await fs.writeFile(configPath,(await fs.readFile(configPath,'utf8')).replace('enabled: true','enabled: false'));
  execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixtureRoot,stdio:'pipe'});
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const report = { type: 'Ads-disabled rollback fixture with mock tag; no live GA4 receipt claimed', passed: [], errors: [] };
  async function fixture({ signal, stored, mode = 'success', viewport = 390, site = origin, storageBlocked = false, staleAds = false } = {}) {
    const context = await browser.newContext({ viewport: { width: viewport, height: 900 } });
    const google = [], collected = [];
    await context.addInitScript(({ signal, stored, key, storageBlocked, staleAds }) => {
      if (signal === 'gpc') Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
      if (signal === 'dnt') Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
      if (stored && !sessionStorage.getItem('test-seeded')) {
        localStorage.setItem(key, JSON.stringify({ choice: stored, at: Date.now() })); sessionStorage.setItem('test-seeded', 'yes');
      }
      if (staleAds) { localStorage.setItem('_gcl_ls','stale-linker');localStorage.setItem('unrelated','keep');document.cookie='_gcl_aw=stale; Path=/; Secure'; }
      if (storageBlocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked storage'); } });
    }, { signal, stored, key, storageBlocked, staleAds });
    let completeTag;
    const tagGate = new Promise(resolve => { completeTag = resolve; });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname === 'www.googletagmanager.com') {
        assert.equal(request.headers().referer, undefined, 'Google script must not receive the page URL');
        google.push(request.url());
        if (mode === 'blocked') return route.abort('blockedbyclient');
        if (mode === 'pending') await tagGate;
        return route.fulfill({ status: 200, contentType: 'text/javascript', body: mockTag }).catch(() => {});
      }
      if (url.hostname.endsWith('google-analytics.com')) {
        google.push(request.url()); collected.push(JSON.parse(request.postData()));
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
      }
      if (url.hostname === 'www.amazon.com') return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Local intercepted Amazon navigation</title>' });
      if (url.origin === site) {
        const file = path.join(fixtureRoot, 'public', url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
        const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
        return route.fulfill({ status: 200, contentType: type, body: await fs.readFile(file) });
      }
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(site + comparison + '?utm_source=google&utm_medium=cpc&utm_campaign=first50&utm_content=comparison&email=secret@example.test&gclid=secret#private', { waitUntil: 'networkidle' });
    await page.waitForSelector('#analytics-settings:not([hidden])');
    return { context, page, google, collected, completeTag };
  }
  async function navigate(page, action) {
    const popup = page.waitForEvent('popup'); await action(); const opened = await popup;
    await opened.waitForLoadState('domcontentloaded');
    assert.equal(opened.url(), 'https://www.amazon.com/dp/B0094B79CI?tag=straubmediagr-20');
    assert.equal(await opened.title(), 'Local intercepted Amazon navigation'); await opened.close();
  }
  try {
    const rollback = await fixture({staleAds:true,stored:'rejected'});
    assert.equal(rollback.google.length,0);
    assert.equal(await rollback.page.evaluate(()=>localStorage.getItem('_gcl_ls')),null);
    assert.equal(await rollback.page.evaluate(()=>localStorage.getItem('unrelated')),'keep');
    assert.equal(await rollback.page.evaluate(k=>JSON.parse(localStorage.getItem(k)).choice,key),'rejected');
    assert.equal((await rollback.context.cookies()).some(c=>c.name==='_gcl_aw'),false);
    await rollback.context.close();report.passed.push('disabled Ads rollback clears linker storage and Ads cookies, preserving unrelated data and preferences');
    const f = await fixture();
    assert.equal(f.google.length, 0); assert.deepEqual(await f.context.cookies(), []);
    assert.equal(await f.page.locator('#analytics-consent').isVisible(), true);
    const sizes = await f.page.locator('.consent-actions button').evaluateAll(buttons => buttons.map(b => ({ width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height })));
    assert.equal(sizes[0].width, sizes[1].width); assert.equal(sizes[0].height, sizes[1].height);
    assert.ok(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await f.page.screenshot({ path: path.join(output, 'consent-mobile.png'), fullPage: true });
    await navigate(f.page, () => f.page.locator('[data-amazon-model="casio-ae1200"][data-placement="comparison_pick"]').click());
    assert.equal(f.google.length, 0);
    await f.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await f.page.reload({ waitUntil: 'networkidle' });
    assert.equal(f.google.length, 0); assert.equal(await f.page.locator('#analytics-consent').isVisible(), false);
    report.passed.push('initial visit, pre-consent navigation and persisted rejection: zero Google requests/cookies');
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    await f.page.waitForFunction(() => window.mockCommands?.some(c => c[0] === 'event' && c[1] === 'page_view'));
    assert.equal(f.google.filter(url => url.includes('gtag/js')).length, 1);
    assert.equal((await f.context.cookies()).filter(c => c.name === '_ga').length, 1);
    const link = f.page.locator('[data-amazon-model="casio-ae1200"][data-placement="comparison_pick"]');
    await navigate(f.page, () => link.click()); await navigate(f.page, () => link.click());
    await link.focus(); await navigate(f.page, () => f.page.keyboard.press('Enter'));
    await link.click({ button: 'middle' });
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    const finalLink = f.page.locator('[data-amazon-model="casio-ae1200"][data-placement="comparison_final"]');
    await navigate(f.page, () => finalLink.click());
    await finalLink.focus(); await navigate(f.page, () => f.page.keyboard.press('Enter'));
    const commands = await f.page.evaluate(() => window.mockCommands);
    assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 1);
    assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'outbound_amazon_click').length, 6);
    assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'outbound_amazon_click' && c[2].placement === 'comparison_final').length, 2);
    assert.doesNotMatch(JSON.stringify(commands), /secret|private|email|gclid|purchase/);
    assert.ok(commands.filter(c => c[0] === 'event').every(c => c[2].page_location === origin + comparison && c[2].page_referrer === ''));
    report.passed.push('one tag/manual page view; repeated, keyboard and middle activations; sanitized fixed fields');
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    assert.equal(await f.page.evaluate(() => window['ga-disable-G-LSGXWGSM9T']), true);
    assert.equal((await f.context.cookies()).filter(c => c.name.startsWith('_ga')).length, 0);
    const count = f.google.length;
    await navigate(f.page, () => link.click());
    await f.page.reload({ waitUntil: 'networkidle' }); assert.equal(f.google.length, count);
    report.passed.push('revocation clears GA cookies, disables provider and listeners, persists with no later Google requests');
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    await f.page.waitForFunction(() => window.mockCommands?.some(c => c[1] === 'page_view'));
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    const withdrawn = f.google.length;
    await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    assert.equal(f.google.length, withdrawn);
    assert.match(await f.page.locator('#analytics-summary').textContent(), /next page visit/);
    await f.page.reload({ waitUntil: 'networkidle' });
    await f.page.waitForFunction(() => window.mockCommands?.some(c => c[1] === 'page_view'));
    report.passed.push('reacceptance after withdrawal waits for the next document, with one page view');
    await f.context.close();

    for (const signal of ['gpc', 'dnt']) {
      const f = await fixture({ signal, stored: 'accepted' });
      assert.equal(f.google.length, 0); assert.deepEqual(await f.context.cookies(), []);
      await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
      assert.equal(await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).isDisabled(), true);
      report.passed.push(signal + ' overrides stored acceptance'); await f.context.close();
    }
    for (const mode of ['blocked', 'pending']) {
      const f = await fixture({ mode });
      await f.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
      await navigate(f.page, () => f.page.locator('[data-amazon-model="casio-ae1200"][data-placement="comparison_pick"]').click());
      await f.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
      await f.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
      f.completeTag(); await f.page.waitForLoadState('networkidle');
      assert.equal(f.collected.length, 0); assert.equal((await f.context.cookies()).filter(c => c.name.startsWith('_ga')).length, 0);
      report.passed.push(mode + ' provider: navigation works, revoke prevents queued replay/cookies'); await f.context.close();
    }
    const preview = await fixture({ site: 'https://preview.vercel.app', viewport: 1440 });
    await preview.page.screenshot({ path: path.join(output, 'consent-desktop.png'), fullPage: true });
    await preview.page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    assert.equal(preview.google.length, 0); report.passed.push('preview acceptance sends no production analytics'); await preview.context.close();

    const blocked = await fixture({ storageBlocked: true });
    await blocked.page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await blocked.page.reload({ waitUntil: 'networkidle' }); assert.equal(blocked.google.length, 0);
    report.passed.push('blocked preference storage fails closed'); await blocked.context.close();

    const cross = await fixture({ stored: 'accepted' });
    await cross.page.waitForFunction(() => window.mockCommands?.some(c => c[1] === 'page_view'));
    const other = await cross.context.newPage(); await other.goto(origin + '/privacy/', { waitUntil: 'networkidle' });
    await other.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await other.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await cross.page.waitForFunction(() => window['ga-disable-G-LSGXWGSM9T'] === true);
    report.passed.push('cross-tab rejection stops an already active document'); await cross.context.close();
    assert.deepEqual(report.errors, []); report.status = 'PASS';
  } catch (error) { report.status = 'FAIL'; report.failure = error.stack; process.exitCode = 1; }
  finally { await browser.close(); await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); }
})();
