(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_SAVE_FIX_V17)return;
window.__ZR_CUSTOMER_GUIDE_SAVE_FIX_V17=true;

const FV='12.17.1';
const COLLECTION='reservationAvailability';
const DOC_ID='__customer_guide__';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let FS=null,bound=false;
const toast=s=>{try{window.toast?.(s)}catch{}};
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';

async function fs(){
  if(FS)return FS;
  FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
  return FS;
}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){
  const z=bridge(),u=z?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
}
function readScreen(){
  const contents=[...document.querySelectorAll('#zrGuideAdminContents .zrga-row[data-i]')].map((row,i)=>({
    id:`guide_${i+1}`,
    name:(row.querySelector('[data-k="name"]')?.value||'').trim()||`컨텐츠 ${i+1}`,
    duration:String(row.querySelector('[data-k="duration"]')?.value||'').replace(/[^0-9]/g,'').slice(0,3),
    imageUrl:safeUrl(row.querySelector('[data-k="imageUrl"]')?.value||''),
    description:String(row.querySelector('[data-k="description"]')?.value||''),
    enabled:!!row.querySelector('[data-k="enabled"]')?.checked
  }));
  const notices=[...document.querySelectorAll('#zrGuideAdminNotices .zrga-notice-row[data-i]')]
    .map((row,i)=>({id:`notice_${i+1}`,text:(row.querySelector('input')?.value||'').trim()}))
    .filter(x=>x.text);
  return {contents,notices};
}
async function save(ev){
  ev.preventDefault();
  ev.stopImmediatePropagation();
  const z=bridge();
  if(!z?.db||!z?.auth||!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  const btn=document.getElementById('zrGuideAdminSave');
  if(!btn||btn.disabled)return;
  const old=btn.textContent;
  btn.disabled=true;btn.textContent='저장 중...';
  try{
    const F=await fs();
    const payload=readScreen();
    await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{
      kind:'customerGuide',
      ownerUid:z.auth.currentUser.uid,
      date:'',status:'cancelled',playUse:'no',playStart:'',playEnd:'',
      contents:payload.contents,notices:payload.notices,
      updatedAt:F.serverTimestamp()
    },{merge:true});
    toast('고객 안내 설정을 저장했습니다.');
  }catch(e){
    console.error('customer guide v17 save',e);
    toast('고객 안내 설정 저장에 실패했습니다. DB 연결을 확인해주세요.');
  }finally{
    btn.disabled=false;btn.textContent=old;
  }
}
function bind(){
  const btn=document.getElementById('zrGuideAdminSave');
  if(!btn||btn.dataset.zrGuideSave17)return false;
  btn.dataset.zrGuideSave17='1';
  btn.addEventListener('click',save,true);
  bound=true;return true;
}
function boot(){
  const t=setInterval(()=>{if(bind())clearInterval(t)},200);
  setTimeout(()=>clearInterval(t),20000);
  new MutationObserver(()=>{if(!bound)bind()}).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
