import { getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, doc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const DEFAULTS={
  f4:{name:'4F 베이직',color:'#f8d7bf'},f5:{name:'5F 워터가든',color:'#cfe7f7'},
  meal:{name:'식사',color:'#fff0a8'},play:{name:'놀이터',color:'#d8efc9'},free:{name:'자율관람',color:'#edf0ed'}
};
const SHORT={f4:'4F',f5:'5F',meal:'식',play:'놀',free:'자율'};
let db=null,auth=null,unsub=null,unsubCatalog=null,contacts=new Map(),segInfo=new Map(),catalog=new Map(Object.entries(DEFAULTS)),pending=false;

function currentDate(){return $('date')?.value||''}
function cardId(card){return card.querySelector('.detail[data-e]')?.dataset.e||card.querySelector('[data-seg][data-g]')?.dataset.g||''}
function infoFor(el){
  const gid=el.dataset.g||el.closest('.card')?.querySelector('[data-seg][data-g]')?.dataset.g||'';
  const sid=el.dataset.seg||'';
  return segInfo.get(`${gid}:${sid}`)||null;
}
function labelFor(s){const c=catalog.get(s?.type);return s?.label||c?.name||DEFAULTS[s?.type]?.name||'자율관람'}
function colorFor(s){const c=catalog.get(s?.type);return s?.color||c?.color||DEFAULTS[s?.type]?.color||'#edf0ed'}
function shortFor(s,label){return SHORT[s?.type]||(label||'').slice(0,2)||'자율'}
function fixSegments(){
  document.querySelectorAll('.seg[data-seg]').forEach(el=>{
    const s=infoFor(el),b=el.querySelector('b');if(!s||!b)return;
    const label=labelFor(s),w=el.getBoundingClientRect().width,want=w>0&&w<54?shortFor(s,label):label;
    if(b.textContent!==want)b.textContent=want;
    el.style.background=colorFor(s);el.classList.toggle('zr-short-seg',w>0&&w<54);
    const small=el.querySelector('small')?.textContent||`${s.start||''}~${s.end||''}`;el.title=label+(small?' '+small:'');
  });
}
function fixPhones(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const gid=cardId(card),head=card.querySelector('.head');if(!gid||!head)return;
    const phone=String(contacts.get(gid)||'').trim();let tag=head.querySelector('.zr-phone-tag');
    if(!phone){tag?.remove();return}
    if(!tag){tag=document.createElement('a');tag.className='tag zr-phone-tag'}
    const org=head.querySelector('.org');if(org&&org.nextElementSibling!==tag)org.insertAdjacentElement('afterend',tag);else if(!org&&!tag.parentElement)head.prepend(tag);
    tag.href='tel:'+phone.replace(/[^0-9+]/g,'');const want='☎ '+phone;if(tag.textContent!==want)tag.textContent=want;tag.title='예약자 전화번호';
  });
}
function fixLegend(){
  const root=document.querySelector('.legend');if(!root)return;
  const base=[['f4','.f4'],['f5','.f5'],['meal','.mealC'],['play','.play']];
  base.forEach(([id,sel])=>{const el=root.querySelector(sel),c=catalog.get(id)||DEFAULTS[id];if(el&&c){el.textContent=c.name;el.style.background=c.color}});
  root.querySelectorAll('[data-custom-legend]').forEach(x=>x.remove());
  [...catalog.entries()].filter(([id])=>id.startsWith('custom_')).forEach(([id,c])=>{const s=document.createElement('span');s.dataset.customLegend=id;s.textContent=c.name;s.style.background=c.color;root.appendChild(s)});
}
function enhance(){fixSegments();fixPhones();fixLegend()}
function scheduleEnhance(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;enhance()})}
function subscribe(){
  if(unsub){unsub();unsub=null}contacts.clear();segInfo.clear();
  const d=currentDate();if(!db||!auth?.currentUser||!d)return;
  try{
    const q=query(collection(db,'scheduleGroups'),where('date','==',d));
    unsub=onSnapshot(q,s=>{
      contacts=new Map();segInfo=new Map();
      s.docs.forEach(x=>{const g=x.data()||{};contacts.set(x.id,g.contact||'');(g.segments||[]).forEach(seg=>segInfo.set(`${x.id}:${seg.id}`,seg))});
      scheduleEnhance();
    },e=>console.debug('schedule display groups',e));
  }catch(e){console.debug('schedule display subscribe',e)}
}
function subscribeCatalog(){
  if(unsubCatalog){unsubCatalog();unsubCatalog=null}if(!db||!auth?.currentUser)return;
  unsubCatalog=onSnapshot(doc(db,'scheduleGroups','__content_catalog__'),s=>{
    catalog=new Map(Object.entries(DEFAULTS));
    const list=s.exists()&&Array.isArray(s.data()?.catalog)?s.data().catalog:[];
    list.forEach(x=>{if(x?.id)catalog.set(x.id,{name:String(x.name||x.id),color:x.color||'#edf0ed'})});scheduleEnhance();
  },e=>console.debug('schedule catalog',e));
}
function injectStyle(){
  if($('zrScheduleDisplayV8Style'))return;const s=document.createElement('style');s.id='zrScheduleDisplayV8Style';s.textContent=`
  .zr-phone-tag{background:#eef6f1!important;color:#2f6b4f!important;text-decoration:none;white-space:nowrap;flex:none}
  .seg.zr-short-seg{padding-left:2px!important;padding-right:2px!important;text-align:center!important;align-items:center!important}
  .seg.zr-short-seg b{font-size:9px!important;letter-spacing:-.5px!important;text-align:center!important;width:100%}
  `;document.head.appendChild(s)
}
function hookUi(){
  $('date')?.addEventListener('change',()=>setTimeout(subscribe,20));
  ['prev','next','today','refreshBtn'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(subscribe,80)));
  new MutationObserver(scheduleEnhance).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',scheduleEnhance);
}
function boot(){
  injectStyle();hookUi();
  const t=setInterval(()=>{if(!getApps().length)return;clearInterval(t);auth=getAuth(getApps()[0]);db=getFirestore(getApps()[0]);onAuthStateChanged(auth,()=>{setTimeout(subscribe,20);subscribeCatalog()});subscribe();subscribeCatalog();scheduleEnhance()},200);setTimeout(()=>clearInterval(t),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
