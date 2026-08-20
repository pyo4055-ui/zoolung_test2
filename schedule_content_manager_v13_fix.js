(()=>{
'use strict';
if(window.__ZR_SCHEDULE_CONTENT_MANAGER_V13_FIX)return;
window.__ZR_SCHEDULE_CONTENT_MANAGER_V13_FIX=true;
const FV='12.17.1',$=id=>document.getElementById(id);
let db=null,auth=null,F=null,unsub=null,date='';
function markDirty(e){const box=e.target?.closest?.('.zr13-custom-box');if(box&&e.target.matches('select'))box.dataset.zr13Dirty='1'}
function syncDoc(id,g){
  const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`);if(!card)return;
  card.querySelectorAll('.zr13-custom-box[data-custom-type]').forEach(box=>{
    if(box.dataset.zr13Dirty==='1')return;
    const s=(g?.segments||[]).find(x=>x.type===box.dataset.customType)||{};
    const a=box.querySelector('[data-custom-start]'),z=box.querySelector('[data-custom-end]');
    if(a&&[...a.options].some(o=>o.value===(s.start||'')))a.value=s.start||'';
    if(z&&[...z.options].some(o=>o.value===(s.end||'')))z.value=s.end||'';
  });
}
function subscribe(){
  const d=$('zrscDate')?.value||'';if(!db||!auth?.currentUser||!d)return;if(unsub){unsub();unsub=null}date=d;
  const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',d));
  unsub=F.onSnapshot(q,s=>{if(($('zrscDate')?.value||'')!==date)return;s.docs.forEach(x=>syncDoc(x.id,x.data()||{}))},e=>console.debug('v13 custom field sync',e));
}
async function boot(){
  document.addEventListener('change',markDirty,true);
  document.addEventListener('change',e=>{if(e.target?.id==='zrscDate')setTimeout(subscribe,70)},true);
  document.addEventListener('click',e=>{if(['zrscPrev','zrscNext','zrscToday'].includes(e.target?.id))setTimeout(subscribe,120)},true);
  try{
    const [am,au,fs]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)]);
    const app=am.getApps()[0];if(!app)return;auth=au.getAuth(app);db=fs.getFirestore(app);F=fs;au.onAuthStateChanged(auth,()=>setTimeout(subscribe,80));
  }catch(e){console.debug('v13 fix init',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
