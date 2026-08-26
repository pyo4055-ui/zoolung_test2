(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_QUERY_UI_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_QUERY_UI_V1=true;

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
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

function installStyle(){
  if($('zrPreviewVisitQueryUiStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrPreviewVisitQueryUiStyleV1';
  style.textContent=`
    #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/4!important;grid-row:1!important}
    #tab-preview-visit .zr-pv-filterfield.end{grid-column:4/7!important;grid-row:1!important}
    #tab-preview-visit .zr-pv-filterfield.status{grid-column:7/10!important;grid-row:1!important}
    #tab-preview-visit #zrPreviewApplyFilter{grid-column:10/13!important;grid-row:1!important;width:100%!important;height:44px!important;min-height:44px!important;margin:0!important;align-self:end!important}
    @media(max-width:900px){
      #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/7!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.end{grid-column:7/13!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.status{grid-column:1/7!important;grid-row:2!important}
      #tab-preview-visit #zrPreviewApplyFilter{grid-column:7/13!important;grid-row:2!important}
    }
    @media(max-width:720px){
      #tab-preview-visit .zr-pv-filterfield.start{grid-column:1/13!important;grid-row:1!important}
      #tab-preview-visit .zr-pv-filterfield.end{grid-column:1/13!important;grid-row:2!important}
      #tab-preview-visit .zr-pv-filterfield.status{grid-column:1/7!important;grid-row:3!important}
      #tab-preview-visit #zrPreviewApplyFilter{grid-column:7/13!important;grid-row:3!important}
    }
  `;
  document.head.appendChild(style);
}

function setInitialRange(){
  const start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter');
  if(!start||!end)return false;
  const today=seoulDate();
  if(!start.value)start.value=`${today.slice(0,8)}01`;
  if(!end.value)end.value=today;
  return true;
}

function install(){
  if(installed)return true;
  const tab=$('tab-preview-visit'),start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter'),status=$('zrPreviewStatusFilter'),search=$('zrPreviewApplyFilter');
  if(!tab||!start||!end||!status||!search)return false;
  installStyle();
  $('zrPreviewResetFilter')?.remove();
  setInitialRange();
  installed=true;
  return true;
}

function boot(){
  if(install())return;
  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>60)clearInterval(timer)},120);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
