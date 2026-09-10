(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_MAP_ADMIN_UI_V2)return;
window.__ZR_CUSTOMER_GUIDE_MAP_ADMIN_UI_V2=true;

const $=id=>document.getElementById(id);
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
let guideMapDraft='';
let guideMapDirty=false;

function injectStyle(){
  if($('zrGuideMapAdminUiV2Style'))return;
  const s=document.createElement('style');
  s.id='zrGuideMapAdminUiV2Style';
  s.textContent=`
  #zrGuideMapAdminSection{margin-top:18px;padding:14px;border:1px solid #d9e3dc;border-radius:14px;background:#f8fbf9}
  #zrGuideMapAdminSection h3{margin:0}.zr-gmap-help{margin:5px 0 11px;color:#6d756f;font-size:12px;line-height:1.55}
  .zr-gmap-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.zr-gmap-row label{display:block;font-size:11px;font-weight:850;color:#68736b;margin-bottom:4px}
  .zr-gmap-row input{width:100%;box-sizing:border-box}.zr-gmap-row button{min-height:40px;white-space:nowrap}
  .zr-gmap-preview{margin-top:11px;border:1px solid #dde4df;border-radius:12px;background:#fff;overflow:hidden;min-height:58px;display:flex;align-items:center;justify-content:center}
  .zr-gmap-preview img{display:none;width:100%;max-height:420px;object-fit:contain;background:#f5f7f5}.zr-gmap-preview.has-image img{display:block}.zr-gmap-empty{padding:18px;text-align:center;color:#727d75;font-size:12px}.zr-gmap-preview.has-image .zr-gmap-empty{display:none}
  @media(max-width:620px){.zr-gmap-row{grid-template-columns:1fr}.zr-gmap-row button{width:100%}}
  `;
  document.head.appendChild(s);
}
function renderPreview(){
  const input=$('zrGuideMapImageUrl'),box=$('zrGuideMapPreview'),img=$('zrGuideMapPreviewImage');
  if(!input||!box||!img)return;
  const url=safeUrl(input.value);
  if(url){
    if(img.dataset.url!==url){img.dataset.url=url;img.src=url}
    box.classList.add('has-image');
  }else{
    img.removeAttribute('src');img.dataset.url='';box.classList.remove('has-image');
  }
}
function rememberDraft(){
  const input=$('zrGuideMapImageUrl');if(!input)return;
  guideMapDraft=String(input.value||'');
  guideMapDirty=true;
  input.dataset.zrGuideMapDirty='1';
  renderPreview();
}
function restoreDraft(){
  if(!guideMapDirty)return;
  const input=$('zrGuideMapImageUrl');if(!input)return;
  if(input.value===guideMapDraft)return;
  input.value=guideMapDraft;
  renderPreview();
}
function syncSaveReady(){
  const btn=$('zrGuideMapSave');
  if(btn)btn.disabled=!window.__ZR_PARKING_INFO_V31;
}
function bindDraftProtection(){
  const input=$('zrGuideMapImageUrl'),btn=$('zrGuideMapSave');
  if(input&&input.dataset.zrDraftBound!=='1'){
    input.dataset.zrDraftBound='1';
    input.addEventListener('input',rememberDraft);
    input.addEventListener('blur',()=>{queueMicrotask(restoreDraft);setTimeout(restoreDraft,0);setTimeout(restoreDraft,80)});
  }
  if(btn&&btn.dataset.zrDraftBound!=='1'){
    btn.dataset.zrDraftBound='1';
    btn.addEventListener('click',restoreDraft,true);
  }
}
function ensureUi(){
  const sec=$('zrGuideAdminSection');if(!sec)return false;
  let root=$('zrGuideMapAdminSection');
  if(!root){
    root=document.createElement('section');root.id='zrGuideMapAdminSection';
    const parking=$('zrParkingAdminSection'),savebar=sec.querySelector('.zrga-savebar');
    if(parking)parking.insertAdjacentElement('beforebegin',root);
    else if(savebar)savebar.insertAdjacentElement('beforebegin',root);
    else sec.appendChild(root);
    root.innerHTML='<h3>가이드맵 이미지</h3><div class="zr-gmap-help">고객 예약확인 화면의 ‘가이드맵’ 버튼에 표시할 이미지 URL을 등록합니다.</div><div class="zr-gmap-row"><div><label for="zrGuideMapImageUrl">가이드맵 이미지 URL</label><input id="zrGuideMapImageUrl" type="url" placeholder="https://..." autocomplete="off"></div><button type="button" class="btn-primary" id="zrGuideMapSave">가이드맵 저장</button></div><div class="zr-gmap-preview" id="zrGuideMapPreview"><img id="zrGuideMapPreviewImage" alt="가이드맵 미리보기"><div class="zr-gmap-empty">등록된 가이드맵 이미지가 없습니다.</div></div>';
    $('zrGuideMapPreviewImage')?.addEventListener('error',()=>{
      const box=$('zrGuideMapPreview');if(box)box.classList.remove('has-image');
      const empty=box?.querySelector('.zr-gmap-empty');if(empty)empty.textContent='이미지를 불러오지 못했습니다. URL을 확인해주세요.';
    });
    $('zrGuideMapPreviewImage')?.addEventListener('load',()=>{
      const empty=$('zrGuideMapPreview')?.querySelector('.zr-gmap-empty');if(empty)empty.textContent='등록된 가이드맵 이미지가 없습니다.';
    });
  }
  bindDraftProtection();syncSaveReady();restoreDraft();renderPreview();return true;
}
let pending=false;
function sync(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;injectStyle();ensureUi()});
}
function boot(){
  injectStyle();sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  const timer=setInterval(()=>{syncSaveReady();bindDraftProtection();restoreDraft();renderPreview()},100);
  setTimeout(()=>clearInterval(timer),30000);
  const tabTimer=setInterval(()=>{
    const tab=$('zrGuideAdminTab');if(!tab)return;
    tab.addEventListener('click',()=>setTimeout(sync,80));clearInterval(tabTimer);
  },250);
  setTimeout(()=>clearInterval(tabTimer),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
