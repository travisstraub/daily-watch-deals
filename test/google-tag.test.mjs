import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleTag, deniedConsent, adClickQuery } from '../src/google-tag.js';
import { analytics as config } from '../src/analytics-config.js';
import { advertising } from '../src/ads-config.js';
import { catalog, pages } from '../public/tracking-catalog.js';
import { readChoice, saveChoice, consentKey, advertisingConsentKey } from '../src/consent.js';
const page='/compare/casio-f91w-vs-ae1200/';
function fixture({choices={analytics:false,advertising:false},adsEnabled=true,origin=config.productionOrigin,path=page}={}){
 const frames=[],expired=[],timers=new Map(); let grants={...choices};
 const window={location:{origin,hostname:new URL(origin).hostname,pathname:path,search:'?gclid=Valid_Click_Id_12345&email=secret@example.test&token=private#secret'},setTimeout(fn){const id=Symbol();timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}};
 const document={
  body:{dataset:{page},append(frame){frames.push(frame)}},
  get cookie(){return '_ga=old; _ga_LSGXWGSM9T=old; _gcl_aw=old; _gcl_au=old; _gac_UA_1=old; necessary=keep'},
  set cookie(s){expired.push(s)},
  createElement(type){
   assert.equal(type,'iframe');const scripts=[];
   return {scripts,setAttribute(){},remove(){this.removed=true},
    contentWindow:{history:{replaceState(a,b,url){this.url=url}},dataLayer:[]},
    contentDocument:{head:{append(s){scripts.push(s)}},createElement(){return {}}}
   };
  }
 };
 const adapter=createGoogleTag({window,document,config,advertising:{...advertising,enabled:adsEnabled},catalog,pages,consent:()=>grants});
 const commands=frame=>(frame.contentWindow.dataLayer||[]).map(args=>[...args]);
 const event={event:'outbound_amazon_click',model:'AE-1200WHD-1AV',placement:'comparison_final',email:'secret@example.test',page:'/secret',destination_type:'private'};
 async function ready(){const promise=adapter.update();const frame=frames.at(-1);frame.onload();frame.scripts[0].onload();assert.equal(await promise,true);return frame;}
 return {adapter,frames,expired,timers,window,event,commands,ready,set(v){grants={...v}}};
}
test('Ads gate is off with exact operator-supplied public ID and label',()=>{
 assert.equal(advertising.enabled,false);assert.equal(advertising.conversionId+'/'+advertising.conversionLabel,'AW-18511081247/3QZeCKShgZwdEJ_e4vpE');
});
test('all consent combinations configure only granted destinations with one shared loader',async()=>{
 for(const analytics of [false,true])for(const ads of [false,true]){
  const f=fixture({choices:{analytics,advertising:ads}});
  if(!analytics&&!ads){assert.equal(await f.adapter.update(),false);assert.equal(f.frames.length,0);continue;}
  const frame=await f.ready();await f.adapter.update();frame.onload();
  assert.equal(f.frames.length,1);assert.equal(frame.scripts.length,1);
  const cmd=f.commands(frame);assert.deepEqual(cmd[0],['consent','default',deniedConsent]);
  assert.deepEqual(cmd.find(c=>c[0]==='consent'&&c[1]==='update')[2],{analytics_storage:analytics?'granted':'denied',ad_storage:ads?'granted':'denied',ad_user_data:ads?'granted':'denied',ad_personalization:'denied'});
  assert.deepEqual(cmd.filter(c=>c[0]==='config').map(c=>c[1]),[...(analytics?[config.measurementId]:[]),...(ads?[advertising.conversionId]:[])]);
  assert.ok(cmd.filter(c=>c[0]==='config').every(c=>c[2].send_page_view===false));
  assert.equal(cmd.filter(c=>c[1]==='page_view').length,analytics?1:0);
  f.adapter.send(f.event);f.adapter.send(f.event);
  const events=f.commands(frame).filter(c=>c[0]==='event');
  assert.equal(events.filter(c=>c[1]==='outbound_amazon_click').length,analytics?2:0);
  assert.equal(events.filter(c=>c[1]==='conversion').length,ads?2:0);
  for(const e of events.filter(c=>c[1]==='conversion')){assert.equal(e[2].send_to,advertising.conversionId+'/'+advertising.conversionLabel);for(const key of ['value','currency','transaction_id','user_data','event_callback','model','gclid'])assert.ok(!(key in e[2]));}
  assert.doesNotMatch(JSON.stringify(f.commands(frame)),/secret|private|email|purchase/);
  assert.equal(frame.src,config.productionOrigin+'/measurement-frame.html'+(ads?'?gclid=Valid_Click_Id_12345':''));
 }
});
test('disabled Ads, previews, and unknown paths cannot configure an Ads destination',async()=>{
 for(const opts of [{adsEnabled:false,choices:{advertising:true}},{origin:'https://preview.vercel.app',choices:{analytics:true,advertising:true}},{path:'/unknown',choices:{analytics:true,advertising:true}}]){
  const f=fixture(opts);assert.equal(await f.adapter.update(),false);f.adapter.send(f.event);assert.equal(f.frames.length,0);
 }
 const f=fixture({adsEnabled:false,choices:{analytics:true,advertising:true}});const frame=await f.ready();assert.deepEqual(f.commands(frame).filter(c=>c[0]==='config').map(c=>c[1]),[config.measurementId]);
});
test('withdraw either purpose destroys old SDK without a denied ping, preserves other purpose and avoids duplicate page view',async()=>{
 for(const withdrawn of ['analytics','advertising']){
  const f=fixture({choices:{analytics:true,advertising:true}});const old=await f.ready();f.adapter.send(f.event);
  const before=f.commands(old).length;f.set({analytics:withdrawn!=='analytics',advertising:withdrawn!=='advertising'});
  const frame=await f.ready();assert.equal(old.removed,true);assert.equal(f.commands(old).length,0);
  assert.equal(f.commands(frame).filter(c=>c[1]==='page_view').length,0);
  f.adapter.send(f.event);assert.equal(f.commands(frame).filter(c=>c[1]===(withdrawn==='analytics'?'conversion':'outbound_amazon_click')).length,1);
  assert.equal(f.commands(frame).filter(c=>c[1]===(withdrawn==='analytics'?'outbound_amazon_click':'conversion')).length,0);
  assert.ok(before>0);assert.ok(f.expired.some(c=>c.startsWith(withdrawn==='analytics'?'_ga=':'_gcl_aw=')));
  assert.ok(f.expired.every(c=>!c.startsWith('necessary=')));
 }
});
test('consent changes before event/load, rejected queues and provider failure never replay data',async()=>{
 const f=fixture({choices:{analytics:true,advertising:true}});const promise=f.adapter.update();const old=f.frames[0];old.onload();f.adapter.send(f.event);
 f.set({analytics:false,advertising:false});f.adapter.send(f.event);await f.adapter.update();assert.equal(await promise,false);old.scripts[0].onload();assert.equal(old.removed,true);
 f.set({analytics:true,advertising:true});const frame=await f.ready();assert.equal(f.commands(frame).filter(c=>c[1]==='conversion').length,0);
 for(const failure of ['error','timeout']){
  const f=fixture({choices:{advertising:true}});const p=f.adapter.update();const frame=f.frames[0];frame.onload();f.adapter.send(f.event);
  if(failure==='error')frame.scripts[0].onerror();else [...f.timers.values()][0]();
  assert.equal(await p,false);assert.equal(frame.removed,true);assert.equal(await f.adapter.update(),false);assert.equal(f.frames.length,1);
 }
});
test('pending queue is bounded, input rebuilt, and no event received before consent is replayed',async()=>{
 const f=fixture();f.adapter.send(f.event);f.set({analytics:true,advertising:true});const p=f.adapter.update();const frame=f.frames[0];frame.onload();
 f.adapter.send({...f.event,model:'unknown'});f.adapter.send({...f.event,placement:'private'});
 for(let i=0;i<50;i++)f.adapter.send(f.event);frame.scripts[0].onload();await p;
 assert.equal(f.commands(frame).filter(c=>c[1]==='conversion').length,20);
 assert.equal(f.commands(frame).filter(c=>c[1]==='outbound_amazon_click').length,20);
});
test('click identifiers are bounded and separate from arbitrary queries and duplicate parameters',()=>{
 assert.equal(adClickQuery('?gclid=Valid_Click_Id_12345&email=secret@example.test&gclid=duplicate'), '');
 assert.equal(adClickQuery('?gclid=secret@example.test&wbraid=Valid_Braid_12345&utm_term=secret'), 'wbraid=Valid_Braid_12345');
 assert.equal(adClickQuery('?gbraid='+ 'a'.repeat(257)), '');
});
test('separate preferences never inherit analytics consent and blocked storage fails closed',()=>{
 const data=new Map();const w={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
 saveChoice(w,'accepted');assert.equal(readChoice(w),'accepted');assert.equal(readChoice(w,Date.now(),'advertising'),null);
 saveChoice(w,'accepted','advertising');saveChoice(w,'rejected');assert.equal(readChoice(w,Date.now(),'advertising'),'accepted');
 assert.notEqual(consentKey,advertisingConsentKey);assert.equal(saveChoice(w,'invalid','advertising'),false);
 const blocked={get localStorage(){throw Error('blocked')}};assert.equal(saveChoice(blocked,'accepted','advertising'),false);assert.equal(readChoice(blocked,Date.now(),'advertising'),null);
});
