(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_QUERY_UI_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_QUERY_UI_V1=true;

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const STORE_KEY='zr_inquiries';
const BASIS_KEY='zr_preview_visit_date_basis_v1';
let installed=false;

function seoulDate(){
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    const y=get('year'),m=get('month'),d=get('day');
    if(y&&m&&d)return `${y}-${m}-${d}`;
  }catch{}
  const now=new Date();
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
function basis(){return localStorage.getItem(BASIS_KEY)==='visit'?'visit':'reception'}
function dateOnly(v){const m=String(v||'').match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:''}
function readInquiries(){try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function contentOf(item){for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return String(item[k]??'');return ''}
function isPreview(item){return /^\[(사전답사 문의|사전답사 확정)\]/.test(contentOf(item))}
function isConfirmed(item){return /^\[사전답사 확정\]/.test(contentOf(item))}
function receptionDate(item){for(const k of ['createdAt','created','submittedAt','dateTime']){const d=dateOnly(item?.[k]);if(d)return d}return ''}

function installStyle(){
  if($('zrPreviewVisitQueryUiStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrPreviewVisitQueryUiStyleV1';
  style.textContent=`
    #tab-preview-visit .zr-pv-filterfield{align-self:end!important}
    #tab-preview-visit .zr-pv-filterfield>label{min-height:15px!important;display:flex!important;align-items:flex-end!important;line-height:15px!important}
    #tab-preview-visit .zr-pv-filterfield input,#tab-preview-visit .zr-pv-filterfield select{height:44px!important;min-height:44px!important;margin:0!important}
    #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/4!important;grid-row:1!important}
    #tab-preview-visit .zr-pv-filterfield.end{grid-column:4/7!important;grid-row:1!important}
    #tab-preview-visit .zr-pv-filterfield.basis{grid-column:7/9!important;grid-row:1!important}
    #tab-preview-visit .zr-pv-filterfield.status{grid-column:9/11!important;grid-row:1!important}
    #tab-preview-visit #zrPreviewApplyFilter{grid-column:11/13!important;grid-row:1!important;width:100%!important;height:44px!important;min-height:44px!important;margin:0!important;align-self:end!important}
    @media(max-width:900px){
      #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/7!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.end{grid-column:7/13!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.basis{grid-column:1/5!important;grid-row:2!important}
      #tab-preview-visit .zr-pv-filterfield.status{grid-column:5/9!important;grid-row:2!important}
      #tab-preview-visit #zrPreviewApplyFilter{grid-column:9/13!important;grid-row:2!important}
    }
    @media(max-width:720px){
      #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/13!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.end{grid-column:1/13!important;grid-row:2!important}
      #tab-preview-visit .zr-pv-filterfield.basis{grid-column:1/7!important;grid-row:3!important}
      #tab-preview-visit .zr-pv-filterfield.status{grid-column:7/13!important;grid-row:3!important}
      #tab-preview-visit #zrPreviewApplyFilter{grid-column:1/13!important;grid-row:4!important}
    }
  `;
  document.head.appendChild(style);
}

function ensureBasisUi(){
  let sel=$('zrPreviewDateBasis');
  if(sel){sel.value=basis();return sel}
  const status=$('zrPreviewStatusFilter')?.closest('.zr-pv-filterfield.status');
  if(!status)return null;
  const wrap=document.createElement('div');wrap.className='zr-pv-filterfield basis';
  wrap.innerHTML='<label for="zrPreviewDateBasis">조회 기준</label><select id="zrPreviewDateBasis"><option value="reception">접수일 기준</option><option value="visit">방문일 기준</option></select>';
  status.insertAdjacentElement('beforebegin',wrap);
  sel=$('zrPreviewDateBasis');sel.value=basis();
  sel.onchange=()=>{localStorage.setItem(BASIS_KEY,sel.value);updateHelp()};
  return sel;
}
function setInitialRange(){
  const start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter');
  if(!start||!end)return false;
  const today=seoulDate();
  if(!start.value)start.value=`${today.slice(0,8)}01`;
  if(!end.value)end.value=today;
  return true;
}
function updateHelp(){
  const help=document.querySelector('#tab-preview-visit .zr-pv-query-help');if(!help)return;
  const prefix=basis()==='reception'?'접수일 기준으로 조회합니다.':'방문일 기준으로 조회합니다.';
  help.textContent=`${prefix} 1:1 문의로 접수된 사전답사를 확인하고, 전화 확인 후 내용을 수정·확정할 수 있습니다.`;
}
function range(){return {start:$('zrPreviewStartDateFilter')?.value||'',end:$('zrPreviewEndDateFilter')?.value||''}}
function invalidRange(){const r=range();return !!(r.start&&r.end&&r.start>r.end)}
function clearReceptionEmpty(){$('zrPreviewReceptionEmpty')?.remove()}
function postFilterReception(){
  if(basis()!=='reception')return;
  clearReceptionEmpty();
  const list=$('zrPreviewVisitList');if(!list)return;
  const inquiries=readInquiries(),r=range();let visible=0;
  list.querySelectorAll('.zr-pv-card[data-index]').forEach(card=>{
    const item=inquiries[Number(card.dataset.index)],d=receptionDate(item);
    const show=(!r.start||d>=r.start)&&(!r.end||d<=r.end);
    card.style.display=show?'':'none';if(show)visible++;
  });
  const all=inquiries.filter(isPreview),count=$('zrPreviewVisitCount');
  if(count)count.textContent=`조회 ${visible}건 · 전체 ${all.length}건 · 미확정 ${all.filter(x=>!isConfirmed(x)).length}건`;
  if(!visible){
    const empty=document.createElement('div');empty.id='zrPreviewReceptionEmpty';empty.className='zr-pv-empty';empty.textContent='조건에 맞는 사전답사 내역이 없습니다.';list.appendChild(empty);
  }
}
function runBase(base,ctx,args){
  if(typeof base!=='function')return;
  updateHelp();clearReceptionEmpty();
  if(basis()!=='reception')return base.apply(ctx,args);
  if(invalidRange())return base.apply(ctx,args);
  const start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter'),sv=start?.value||'',ev=end?.value||'';
  if(start)start.value='';if(end)end.value='';
  let out;
  try{out=base.apply(ctx,args)}finally{if(start)start.value=sv;if(end)end.value=ev}
  postFilterReception();return out;
}
function wrapAction(el){
  if(!el||el.dataset.zrPreviewBasisWrapped==='1'||typeof el.onclick!=='function')return false;
  const base=el.onclick;el.dataset.zrPreviewBasisWrapped='1';
  el.onclick=function(){return runBase(base,this,arguments)};
  return true;
}
function applyCurrentView(){
  if(basis()!=='reception')return;
  const tab=$('tab-preview-visit');if(!tab||tab.classList.contains('hidden'))return;
  $('zrPreviewApplyFilter')?.click();
}

function install(){
  if(installed)return true;
  const tab=$('tab-preview-visit'),start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter'),status=$('zrPreviewStatusFilter'),search=$('zrPreviewApplyFilter'),tabBtn=$('zrPreviewVisitTabBtn');
  if(!tab||!start||!end||!status||!search||!tabBtn)return false;
  installStyle();$('zrPreviewResetFilter')?.remove();ensureBasisUi();setInitialRange();updateHelp();
  if(!wrapAction(search)||!wrapAction(tabBtn))return false;
  document.addEventListener('zr:preview-visits-changed',()=>setTimeout(applyCurrentView,0));
  installed=true;
  if(!tab.classList.contains('hidden'))applyCurrentView();
  return true;
}
function boot(){if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>60)clearInterval(timer)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
