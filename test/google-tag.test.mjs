import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleTag, clearMeasurementStorage, deniedConsent, adClickQuery } from '../src/google-tag.js';
import { analytics as config } from '../src/analytics-config.js';
import { advertising } from '../src/ads-config.js';
import { catalog, pages } from '../public/tracking-catalog.js';
import { readChoice, saveChoice, consentKey, advertisingConsentKey } from '../src/consent.js';
const page='/compare/casio-f91w-vs-ae1200/';
function fixture({choices={analytics:false,advertising:false},adsEnabled=true,origin=config.productionOrigin,path=page}={}){
 const scripts=[],expired=[],restarts=[],timers=new Map(),storage=new Map([['_gcl_ls','ad-click'],['necessary','keep']]); let grants={...choices};
 const window={location:new URL(origin+path+'?gclid=Valid_Click_Id_12345&email=secret@example.test#private'),localStorage:{removeItem:key=>storage.delete(key)},setTimeout(fn){const id=Symbol();timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}};
 window.history={replaceState(state,unused,url){window.location=new URL(url)}};
 const document={body:{dataset:{page}},head:{append(script){scripts.push(script)}},
  get cookie(){return '_ga=old; _ga_LSGXWGSM9T=old; _gcl_aw=old; _gcl_au=old; _gac_UA_1=old; necessary=keep'},
  set cookie(s){expired.push(s)},createElement(type){assert.equal(type,'script');return {remove(){this.removed=true}}}};
 const adapter=createGoogleTag({window,document,config,advertising:{...advertising,enabled:adsEnabled},catalog,pages,consent:()=>grants,restart:(next,reason)=>restarts.push({next,reason})});
 const commands=()=>(window.dataLayer||[]).map(args=>[...args]);
 const event={event:'outbound_amazon_click',model:'AE-1200WHD-1AV',placement:'comparison_final',email:'secret@example.test',page:'/secret',destination_type:'private'};
 async function ready(){const promise=adapter.update();scripts.at(-1).onload();assert.equal(await promise,true);}
 return {adapter,scripts,expired,timers,window,document,storage,restarts,event,commands,ready,set(v){grants={...v}}};
}
test('Ads activation retains the exact approved destination and production-only origin',()=>{
 assert.equal(advertising.enabled,true);assert.equal(config.productionOrigin,'https://dailywatchfinds.com');assert.equal(config.measurementId,'G-LSGXWGSM9T');assert.equal(advertising.conversionId+'/'+advertising.conversionLabel,'AW-18511081247/3QZeCKShgZwdEJ_e4vpE');
});
test('all consent combinations configure only granted top-level destinations with one shared loader',async()=>{
 for(const analytics of [false,true])for(const ads of [false,true]){
  const f=fixture({choices:{analytics,advertising:ads}});
  if(!analytics&&!ads){assert.equal(await f.adapter.update(),false);assert.equal(f.scripts.length,0);continue;}
  await f.ready();await f.adapter.update();assert.equal(f.scripts.length,1);
  const cmd=f.commands();assert.deepEqual(cmd[0],['consent','default',deniedConsent]);
  assert.deepEqual(cmd.find(c=>c[0]==='consent'&&c[1]==='update')[2],{analytics_storage:analytics?'granted':'denied',ad_storage:ads?'granted':'denied',ad_user_data:ads?'granted':'denied',ad_personalization:'denied'});
  assert.deepEqual(cmd.filter(c=>c[0]==='config').map(c=>c[1]),[...(analytics?[config.measurementId]:[]),...(ads?[advertising.conversionId]:[])]);
  assert.ok(cmd.filter(c=>c[0]==='config').every(c=>c[2].send_page_view===false));
  assert.equal(cmd.filter(c=>c[1]==='page_view').length,analytics?1:0);
  f.adapter.send(f.event);f.adapter.send(f.event);
  const events=f.commands().filter(c=>c[0]==='event');
  assert.equal(events.filter(c=>c[1]==='outbound_amazon_click').length,analytics?2:0);
  assert.equal(events.filter(c=>c[1]==='conversion').length,ads?2:0);
  for(const e of events.filter(c=>c[1]==='conversion')){assert.equal(e[2].send_to,advertising.conversionId+'/'+advertising.conversionLabel);for(const key of ['value','currency','transaction_id','user_data','event_callback','model','gclid'])assert.ok(!(key in e[2]));}
  assert.doesNotMatch(JSON.stringify(f.commands()),/secret|private|email|purchase/);
  assert.equal(f.window.location.href,config.productionOrigin+page+(ads?'?gclid=Valid_Click_Id_12345':''));
 }
});
test('disabled Ads, previews, unknown paths and failed URL sanitization load no SDK',async()=>{
 for(const opts of [{adsEnabled:false,choices:{advertising:true}},{origin:'https://preview.vercel.app',choices:{analytics:true,advertising:true}},{path:'/unknown',choices:{analytics:true,advertising:true}}]){
  const f=fixture(opts);assert.equal(await f.adapter.update(),false);f.adapter.send(f.event);assert.equal(f.scripts.length,0);
 }
 const f=fixture({choices:{advertising:true}});f.window.history.replaceState=()=>{throw Error('blocked')};assert.equal(await f.adapter.update(),false);assert.equal(f.scripts.length,0);
});
test('withdrawing either purpose requests full reload, drops queues and clears only revoked storage',async()=>{
 for(const withdrawn of ['analytics','advertising']){
  const f=fixture({choices:{analytics:true,advertising:true}});await f.ready();f.adapter.send(f.event);
  const next={analytics:withdrawn!=='analytics',advertising:withdrawn!=='advertising'};f.set(next);await f.adapter.update();
  assert.deepEqual(f.restarts,[{next,reason:'consent-change'}]);assert.equal(f.scripts[0].removed,true);
  assert.deepEqual(f.commands().at(-1),['consent','update',deniedConsent]);
  const count=f.commands().length;f.adapter.send(f.event);assert.equal(f.commands().length,count);assert.equal(f.scripts.length,1);
  assert.equal(f.storage.has('_gcl_ls'),withdrawn!=='advertising');assert.equal(f.storage.get('necessary'),'keep');
  assert.ok(f.expired.some(c=>c.startsWith(withdrawn==='analytics'?'_ga=':'_gcl_aw=')));
  assert.ok(f.expired.every(c=>!c.startsWith('necessary=')));
 }
});
test('send detects expiry/privacy-signal grant loss without focus/update and immediately initiates shutdown',async()=>{
 for(const reason of ['expiry','privacy-signal']){
  const f=fixture({choices:{analytics:true,advertising:true}});await f.ready();
  f.set({analytics:false,advertising:false});f.adapter.send(f.event);
  assert.equal(f.restarts.length,1,reason);assert.equal(f.commands().filter(c=>c[1]==='conversion').length,0);
  assert.equal(f.storage.has('_gcl_ls'),false);assert.equal(f.window['ga-disable-'+config.measurementId],true);
 }
});
test('consent loss before SDK load, rejected queues and provider failure cannot replay or retry',async()=>{
 for(const failure of ['consent','error','timeout']){
  const f=fixture({choices:{advertising:true}});const p=f.adapter.update();f.adapter.send(f.event);
  if(failure==='consent'){f.set({});f.scripts[0].onload()}
  if(failure==='error')f.scripts[0].onerror();if(failure==='timeout')[...f.timers.values()][0]();
  assert.equal(await p,false);assert.equal(f.restarts.length,1);assert.equal(f.storage.has('_gcl_ls'),false);
  f.set({advertising:true});await f.adapter.update();f.scripts[0].onload();
  assert.equal(f.scripts.length,1);assert.equal(f.commands().filter(c=>c[1]==='conversion').length,0);
 }
});
test('pending queue is bounded and payload rebuilt; pre-consent events are never replayed',async()=>{
 const f=fixture();f.adapter.send(f.event);f.set({analytics:true,advertising:true});const p=f.adapter.update();
 f.adapter.send({...f.event,model:'unknown'});f.adapter.send({...f.event,placement:'private'});
 for(let i=0;i<50;i++)f.adapter.send(f.event);f.scripts[0].onload();await p;
 assert.equal(f.commands().filter(c=>c[1]==='conversion').length,20);assert.equal(f.commands().filter(c=>c[1]==='outbound_amazon_click').length,20);
});
test('click identifiers are bounded, excluding duplicates and arbitrary values',()=>{
 assert.equal(adClickQuery('?gclid=Valid_Click_Id_12345&email=secret@example.test&gclid=duplicate'), '');
 assert.equal(adClickQuery('?gclid=secret@example.test&wbraid=Valid_Braid_12345&utm_term=secret'), 'wbraid=Valid_Braid_12345');
 assert.equal(adClickQuery('?gbraid='+ 'a'.repeat(257)), '');
});
test('Ads cleanup independently clears documented linker storage, preserving unrelated storage and consent',()=>{
 const f=fixture();f.storage.set(consentKey,'keep');f.storage.set(advertisingConsentKey,'keep');f.storage.set('_gcl_unrelated','keep');
 clearMeasurementStorage(f.window,f.document,{advertising:true});
 assert.equal(f.storage.has('_gcl_ls'),false);assert.equal(f.storage.get('_gcl_unrelated'),'keep');assert.equal(f.storage.get(consentKey),'keep');assert.equal(f.storage.get(advertisingConsentKey),'keep');
 assert.ok(f.expired.every(c=>!c.startsWith('_ga=')));assert.ok(f.expired.some(c=>c.startsWith('_gcl_au=')),'observed Google Ads cookie is removed');
 f.storage.set('_gcl_ls','again');clearMeasurementStorage(f.window,{get cookie(){throw Error('blocked')}},{advertising:true});assert.equal(f.storage.has('_gcl_ls'),false);
 f.window.localStorage.removeItem=()=>{throw Error('blocked')};f.expired.length=0;assert.doesNotThrow(()=>clearMeasurementStorage(f.window,f.document,{advertising:true}));assert.ok(f.expired.length>0);
});
test('separate preferences never inherit analytics consent and blocked storage fails closed',()=>{
 const data=new Map();const w={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
 saveChoice(w,'accepted');assert.equal(readChoice(w),'accepted');assert.equal(readChoice(w,Date.now(),'advertising'),null);
 saveChoice(w,'accepted','advertising');saveChoice(w,'rejected');assert.equal(readChoice(w,Date.now(),'advertising'),'accepted');
 assert.notEqual(consentKey,advertisingConsentKey);assert.equal(saveChoice(w,'invalid','advertising'),false);
 const blocked={get localStorage(){throw Error('blocked')}};assert.equal(saveChoice(blocked,'accepted','advertising'),false);assert.equal(readChoice(blocked,Date.now(),'advertising'),null);
});
test('failed rejection removes stale acceptance; fully read-only storage cannot regrant after reload',()=>{
 for(const removeBlocked of [false,true]){
  const data=new Map([[advertisingConsentKey,JSON.stringify({choice:'accepted',at:Date.now()})]]);
  const storage={getItem:k=>data.get(k)||null,setItem(){throw Error('quota/read-only')},removeItem:k=>{if(removeBlocked)throw Error('read-only');data.delete(k)}};
  assert.equal(saveChoice({localStorage:storage},'rejected','advertising'),false);
  assert.equal(data.has(advertisingConsentKey),removeBlocked);
  assert.equal(readChoice({localStorage:storage},Date.now(),'advertising'),null,'new document must not revive readable stale acceptance');
 }
});

test('refusal fallback survives local-storage recovery and only explicit acceptance clears it',()=>{
 const data=new Map([[advertisingConsentKey,JSON.stringify({choice:'accepted',at:Date.now()})]]);let blocked=true,cookie='';
 const document={get cookie(){return cookie},set cookie(value){cookie=value.includes('Max-Age=0')?'':value.split(';')[0]}};
 const w={document,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('read-only');data.set(k,v)},removeItem:k=>{if(blocked)throw Error('read-only');data.delete(k)}}};
 assert.equal(saveChoice(w,'rejected','advertising'),false);assert.equal(readChoice(w,Date.now(),'advertising'),'rejected');
 blocked=false;assert.equal(readChoice(w,Date.now(),'advertising'),'rejected');assert.equal(saveChoice(w,'accepted','advertising'),true);assert.equal(readChoice(w,Date.now(),'advertising'),'accepted');
});

test('analytics-only activation preserves the approved GA4 page-view and outbound-click payloads',async()=>{
 const { createGA4 } = await import('../src/ga4.js');
 const previous=fixture({choices:{analytics:true,advertising:false}});
 const ga4=createGA4({window:previous.window,document:previous.document,config,catalog,pages,consentGranted:()=>true});
 const loaded=ga4.start();previous.scripts[0].onload();await loaded;ga4.send(previous.event);ga4.send(previous.event);
 const activated=fixture({choices:{analytics:true,advertising:false}});await activated.ready();activated.adapter.send(activated.event);activated.adapter.send(activated.event);
 assert.deepEqual(activated.commands().filter(c=>c[0]==='event'),previous.commands().filter(c=>c[0]==='event'));
 assert.deepEqual(activated.commands().filter(c=>c[0]==='config').map(c=>c[1]),[config.measurementId]);
});
