(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_MAP_V1)return;
window.__ZR_CUSTOMER_GUIDE_MAP_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const COLLECTION='customerGuides';
const DOC_ID='main';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=s=>{try{window.toast?.(s)}catch{}};
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';

let FS=null,db=null,unsub=null,imageUrl='';

function isStaff(){
  const u=window.zrReservationFirebase?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL;
}
function notify(){
  try{document.dispatchEvent(new CustomEvent('zr:guide-map-updated',{detail:{imageUrl}}))}catch{}
}
function expose(){
  window.zrCustomerGuideMapV1={
    get imageUrl(){return imageUrl},
    refreshAdmin:renderAdmin
  };
}
function injectStyle(){
  if($('zrGuideMapV1Style'))return;
  const s=document.createElement('style');s.id='zrGuideMapV1Style';s.textContent=`
  #zrGuideMapAdminSection{margin-top:18px;padding:14px;border:1px solid #d9e3dc;border-radius:14px;background:#f8fbf9}
  #zrGuideMapAdminSection h3{margin:0}.zr-gmap-help{margin:5px 0 11px;color:#6d756f;font-size:12px;line-height:1.55}
  .zr-gmap-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.zr-gmap-row label{display:block;font-size:11px;font-weight:850;color:#68736b;margin-bottom:4px}
  .zr-gmap-row input{width:100%;box-sizing:border-box}.zr-gmap-row button{min-height:40px;white-space:nowrap}
  .zr-gmap-preview{margin-top:11px;border:1px solid #dde4df;border-radius:12px;background:#fff;overflow:hidden}.zr-gmap-preview.hidden{display:none!important}
  .zr-gmap-preview img{display:block;width:100%;max-height:420px;object-fit:contain;background:#f5f7f5}.zr-gmap-empty{padding:18px;text-align:center;color:#727d75;font-size:12px}
  @media(max-width:620px){.zr-gmap-row{grid-template-columns:1fr}.zr-gmap-row button{width:100%}}
  `;document.head.appendChild(s);
}
function previewHtml(url){
  return url?`<img src="${esc(url)}" alt="가이드맵 미리보기" onerror="this.parentElement.innerHTML='<div class=&quot;zr-gmap-empty&quot;>이미지를 불러오지 못했습니다. URL을 확인해주세요.</div>'">`:'<div class="zr-gmap-empty">등록된 가이드맵 이미지가 없습니다.</div>';
}
function renderPreview(){
  const input=$('zrGuideMapImageUrl'),preview=$('zrGuideMapPreview');if(!preview)return;
  const raw=String(input?.value||'').trim();
  const url=safeUrl(raw);
  preview.innerHTML=raw&&url?previewHtml(url):previewHtml('');
}
function renderAdmin(){
  const sec=$('zrGuideAdminSection');if(!sec)return false;
  let root=$('zrGuideMapAdminSection');
  if(!root){
    root=document.createElement('section');root.id='zrGuideMapAdminSection';
    const parking=$('zrParkingAdminSection'),savebar=sec.querySelector('.zrga-savebar');
    if(parking)parking.insertAdjacentElement('beforebegin',root);
    else if(savebar)savebar.insertAdjacentElement('beforebegin',root);
    else sec.appendChild(root);
    root.innerHTML=`<h3>가이드맵 이미지</h3><div class="zr-gmap-help">고객 예약확인 화면의 ‘가이드맵’ 탭에 표시할 이미지 URL을 등록합니다. 비워서 저장하면 가이드맵 이미지를 숨깁니다.</div><div class="zr-gmap-row"><div><label for="zrGuideMapImageUrl">가이드맵 이미지 URL</label><input id="zrGuideMapImageUrl" type="url" placeholder="https://..." autocomplete="off"></div><button type="button" class="btn-primary" id="zrGuideMapSave">가이드맵 저장</button></div><div class="zr-gmap-preview" id="zrGuideMapPreview"></div>`;
    $('zrGuideMapImageUrl').addEventListener('input',renderPreview);
    $('zrGuideMapSave').onclick=saveGuideMap;
  }
  const input=$('zrGuideMapImageUrl');
  if(input&&document.activeElement!==input&&input.value!==imageUrl)input.value=imageUrl;
  renderPreview();
  return true;
}
async function saveGuideMap(){
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!db||!FS)return toast('가이드맵 DB 연결 중입니다. 잠시 후 다시 눌러주세요.');
  const input=$('zrGuideMapImageUrl'),raw=String(input?.value||'').trim(),url=safeUrl(raw);
  if(raw&&!url){toast('가이드맵 이미지는 http 또는 https URL로 입력해주세요.');input?.focus?.();return}
  const btn=$('zrGuideMapSave'),old=btn?.textContent||'가이드맵 저장';
  if(btn){btn.disabled=true;btn.textContent='저장 중...'}
  try{
    await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),{guideMapImageUrl:url,guideMapUpdatedAt:FS.serverTimestamp()},{merge:true});
    imageUrl=url;expose();renderPreview();notify();toast('가이드맵 이미지를 저장했습니다.');
  }catch(e){console.error('guide map save',e);toast('가이드맵 이미지 저장에 실패했습니다.');}
  finally{if(btn){btn.disabled=false;btn.textContent=old}}
}
async function initDb(){
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
    const z=window.zrReservationFirebase;if(!z?.db)throw new Error('Firebase DB bridge unavailable');db=z.db;
    if(unsub)unsub();
    unsub=FS.onSnapshot(FS.doc(db,COLLECTION,DOC_ID),snap=>{
      imageUrl=safeUrl(snap.exists()?snap.data()?.guideMapImageUrl:'');
      expose();renderAdmin();notify();
    },e=>console.error('guide map read',e));
  }catch(e){console.error('guide map init',e)}
}
let pending=false;
function syncAdmin(){
  if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;injectStyle();renderAdmin()});
}
function boot(){
  injectStyle();expose();syncAdmin();
  new MutationObserver(syncAdmin).observe(document.body,{childList:true,subtree:true});
  const tabTimer=setInterval(()=>{const tab=$('zrGuideAdminTab');if(!tab)return;tab.addEventListener('click',()=>setTimeout(renderAdmin,80));clearInterval(tabTimer)},250);setTimeout(()=>clearInterval(tabTimer),20000);
  const wait=setInterval(()=>{if(!window.zrReservationFirebase?.db)return;clearInterval(wait);initDb()},200);setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
