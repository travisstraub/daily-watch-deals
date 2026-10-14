// Local layout and keyboard regression checks. No Google or Amazon traffic.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const baseURL = process.argv[2] || 'http://127.0.0.1:4180';
const output = process.argv[3] || '/tmp/dwf-conversion-evidence';
(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const report={baseURL,layouts:[],checked:[],errors:[]};
  try {
    for(const viewport of [{width:1165,height:747},{width:390,height:900},{width:320,height:800}]){
      const context=await browser.newContext({viewport});
      const external=[];
      await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():(external.push(route.request().url()),route.abort()));
      const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
      await page.goto(baseURL+'/compare/casio-f91w-vs-ae1200/',{waitUntil:'networkidle'});
      await page.waitForSelector('#analytics-settings:not([hidden])');
      const measurements=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {consent:rect(document.querySelector('#analytics-consent')),choices:[...document.querySelectorAll('.consent-actions button')].map(rect),primary:[...document.querySelectorAll('[data-placement="comparison_pick"]')].map(rect),overflow:document.documentElement.scrollWidth>innerWidth};
      });
      assert.equal(measurements.overflow,false);
      assert.equal(measurements.choices[0].width,measurements.choices[1].width);
      assert.equal(measurements.choices[0].height,measurements.choices[1].height);
      assert.ok(measurements.choices.every(r=>r.height>=44));
      if(viewport.width===1165)assert.ok(measurements.primary.every(r=>r.top>=0&&r.bottom<=viewport.height),'both Amazon choices must fit with consent visible');
      report.layouts.push({viewport,...measurements});
      await page.screenshot({path:path.join(output,`comparison-${viewport.width}.png`)});
      await page.keyboard.press('Tab');assert.equal(await page.locator('.skip').evaluate(e=>e===document.activeElement),true);
      await page.getByRole('button',{name:'Save choices',exact:true}).focus();await page.keyboard.press('Tab');
      assert.equal(await page.getByRole('button',{name:'Reject all',exact:true}).evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Enter');assert.equal(await page.locator('#analytics-consent').isVisible(),false);
      assert.equal(await page.locator('#analytics-settings').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Enter');assert.equal(await page.locator('#analytics-consent').isVisible(),true);
      assert.equal(await page.locator('[data-purpose="analytics"]').evaluate(e=>e===document.activeElement),true);
      await page.getByRole('button',{name:'Reject all',exact:true}).click();
      await page.locator('.final-picks').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('.final-picks .buy').count(),2);
      for(const model of ['F-91W-1','AE-1200WHD-1AV'])assert.equal(await page.getByRole('link',{name:`Check on Amazon: Casio ${model}`,exact:true}).count(),2);
      await page.screenshot({path:path.join(output,`final-choices-${viewport.width}.png`)});
      if(viewport.width===390)await page.screenshot({path:path.join(output,'comparison-mobile-full.png'),fullPage:true});
      assert.equal(external.length,0);await context.close();
    }
    report.checked.push('1165x747 primary buttons visible before consent choice','390px and 320px layouts have no page overflow','equal save/reject geometry; at least 44px high','skip link and consent choice/withdrawal keyboard focus','exact-model accessible link names at both placements','zero external requests on comparison');
    assert.deepEqual(report.errors,[]);report.status='PASS';
  }catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
  finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
