import { getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const LABEL={f4:'4F 베이직',f5:'5F 워터가든',meal:'식사',play:'놀이터',free:'자율관람'};
const SHORT={f4:'4F',f5:'5F',meal:'식사',play:'놀이터',free:'자율'};
let db=null,auth=null,unsub=null,contacts=new Map(),pending=false;

function typeOf(el){return ['f4','f5','meal','play','free'].find(x=>el.classList.contains(x))||''}
function fixSegments(){
  document.querySelectorAll('.seg').forEach(el=>{
    const type=typeOf(el),b=el.querySelector('b');if(!type||!b)return;
    const w=el.getBoundingClientRect().width;
    const want=w>0&&w<54?SHORT[type]:LABEL[type];if(b.textContent!==want)b.textContent=want;
    el.classList.toggle('zr-short-seg',w>0&&w<54);
    if(!el.title){const small=el.querySelector('small')?.textContent||'';el.title=(LABEL[type]||type)+(small?' '+small:'')}
  });
}
function cardId(card){return card.querySelector('.detail[data-e]')?.dataset.e||card.querySelector('[data-seg][data-g]')?.dataset.g||''}
function fixPhones(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const gid=cardId(card),head=card.querySelector('.head');if(!gid||!head)return;
    const phone=String(contacts.get(gid)||'').trim();let tag=head.querySelector('.zr-phone-tag');
    if(!phone){tag?.remove();return}
    if(!tag){tag=document.createElement('a');tag.className='tag zr-phone-tag';const detail=head.querySelector('.detail');if(detail)head.insertBefore(tag,detail);else head.appendChild(tag)}
    tag.href='tel:'+phone.replace(/[^0-9+]/g,'');const want='☎ '+phone;if(tag.textContent!==want)tag.textContent=want;tag.title='예약자 전화번호';
  });
}
function enhance(){fixSegments();fixPhones()}
function scheduleEnhance(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;enhance()})}
function currentDate(){return $('date')?.value||''}
function subscribe(){
  if(unsub){unsub();unsub=null}contacts.clear();
  const d=currentDate();if(!db||!auth?.currentUser||!d)return;
  try{
    const q=query(collection(db,'scheduleGroups'),where('date','==',d));
    unsub=onSnapshot(q,s=>{contacts=new Map(s.docs.map(x=>[x.id,x.data()?.contact||'']));scheduleEnhance()},e=>console.debug('schedule contact display',e));
  }catch(e){console.debug('schedule contact subscribe',e)}
}
function injectStyle(){
  if($('zrScheduleDisplayV8Style'))return;const s=document.createElement('style');s.id='zrScheduleDisplayV8Style';s.textContent=`
  .zr-phone-tag{background:#eef6f1!important;color:#2f6b4f!important;text-decoration:none;white-space:nowrap}
  .seg.zr-short-seg{padding-left:2px!important;padding-right:2px!important;text-align:center!important;align-items:center!important}
  .seg.zr-short-seg b{font-size:9px!important;letter-spacing:-.5px!important;text-align:center!important;width:100%}
  `;document.head.appendChild(s)
}
function hookUi(){
  ['date'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(subscribe,20)));
  ['prev','next','today','refreshBtn'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(subscribe,80)));
  new MutationObserver(scheduleEnhance).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',scheduleEnhance);
}
function boot(){
  injectStyle();hookUi();
  const t=setInterval(()=>{if(!getApps().length)return;clearInterval(t);auth=getAuth(getApps()[0]);db=getFirestore(getApps()[0]);onAuthStateChanged(auth,()=>setTimeout(subscribe,20));subscribe();scheduleEnhance()},200);setTimeout(()=>clearInterval(t),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
