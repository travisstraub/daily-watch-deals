import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tagTest, testMode } from '../src/tag-test-config.js';
import { createTestOnce, testLedgerKey } from '../src/tag-test-once.js';
import { advertising } from '../src/ads-config.js';
function fixture({allowed=true,ready=true,storage=new Map()}={}) {
 let granted=allowed,prepared=0,sends=0;
 const window={location:new URL(tagTest.origin+tagTest.path),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{locks:{request:async(k,o,fn)=>fn({name:k})}}};
 const args={window,allowed:()=>granted,prepare:async()=>{prepared++;return ready},send:()=>{sends++}};
 const request=createTestOnce(args);
 return {window,storage,args,request,setGranted(v){granted=v},get prepared(){return prepared},get sends(){return sends}};
}
test('test mode is pinned to one verified HTTPS preview origin and one dedicated path; production Ads stays off',()=>{
 assert.equal(advertising.enabled,false);assert.equal(testMode(new URL(tagTest.origin+tagTest.path)),tagTest);
 for(const origin of ['https://dailywatchfinds.com','https://www.dailywatchfinds.com','https://preview.vercel.app','https://evil.example','http://'+new URL(tagTest.origin).hostname,tagTest.origin+':444','https://x.'+new URL(tagTest.origin).hostname])assert.equal(testMode(new URL(origin+tagTest.path)),null);
 for(const path of ['/','/privacy/',tagTest.path+'other',tagTest.path.slice(0,-1)])assert.equal(testMode(new URL(tagTest.origin+path)),null);
});
test('one explicit consented request reserves persistent ledger before sending; repeats/reloads cannot resend',async()=>{
 const f=fixture();assert.equal(await f.request(),'requested-delivery-unverified');assert.equal(f.sends,1);
 const record=JSON.parse(f.storage.get(testLedgerKey));assert.equal(record.run,tagTest.run);assert.equal(record.status,'REQUEST_RESERVED_DELIVERY_UNVERIFIED');assert.equal(record.page,tagTest.origin+tagTest.path);
 assert.equal(await f.request(),'already-reserved-or-storage-unavailable');assert.equal(await createTestOnce(f.args)(),'already-reserved-or-storage-unavailable');assert.equal(f.sends,1);
});
test('consent, exact origin, provider readiness and Web Locks are required; pre-consent click is never queued',async()=>{
 const f=fixture({allowed:false});assert.equal(await f.request(),'consent-required');assert.equal(f.prepared,0);assert.equal(f.sends,0);f.setGranted(true);assert.equal(await f.request(),'requested-delivery-unverified');
 const noSDK=fixture({ready:false});assert.equal(await noSDK.request(),'provider-unavailable');assert.equal(noSDK.sends,0);assert.equal(noSDK.storage.size,0);
 const noLock=fixture();noLock.window.navigator.locks=undefined;assert.equal(await noLock.request(),'lock-unavailable');assert.equal(noLock.sends,0);
 const foreign=fixture();foreign.window.location=new URL('https://dailywatchfinds.com'+tagTest.path);assert.equal(await foreign.request(),'wrong-preview');assert.equal(foreign.prepared,0);
});
test('double click and cross-tab lock contention cannot send twice; withdrawal during readiness sends nothing',async()=>{
 const f=fixture();let done;f.args.prepare=()=>new Promise(resolve=>{done=resolve});const request=createTestOnce(f.args);
 const first=request();assert.equal(await request(),'busy');f.setGranted(false);done(true);assert.equal(await first,'consent-required');assert.equal(f.sends,0);assert.equal(f.storage.size,0);
 const other=fixture();other.window.navigator.locks.request=async(k,o,fn)=>fn(null);assert.equal(await other.request(),'busy');assert.equal(other.sends,0);
});
test('blocked storage fails closed; failed send retains consumed ledger and never retries',async()=>{
 for(const method of ['getItem','setItem']){const f=fixture();f.window.localStorage[method]=()=>{throw Error('blocked')};await f.request();assert.equal(f.sends,0);}
 const f=fixture();f.args.send=()=>{throw Error('transport')};const request=createTestOnce(f.args);assert.equal(await request(),'reserved-send-failed');assert.ok(f.storage.has(testLedgerKey));assert.equal(await request(),'already-reserved-or-storage-unavailable');
});
test('private page is unindexed, identified and isolated from the 41 production URLs and Amazon navigation',async()=>{
 const html=await readFile(new URL('../public'+tagTest.path+'index.html',import.meta.url),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/Send ONE real Google Ads TEST event/);assert.ok(html.includes(tagTest.run));assert.doesNotMatch(html,/rel="canonical"|href="https:\/\/www.amazon.com/);
 assert.match(html,/Include debug signal in URL unchecked/);assert.match(html,/cookie-free consent-status signal/);assert.match(html,/id="send-test"[^>]*disabled/);
 const sitemap=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,41);assert.ok(!sitemap.includes('__tag-validation'));
 for(const name of ['tag-test.js','tag-test-config.js','tag-test-once.js'])assert.equal(await readFile(new URL('../public/'+name,import.meta.url),'utf8'),await readFile(new URL('../src/'+name,import.meta.url),'utf8'));
});
