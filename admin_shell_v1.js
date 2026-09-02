(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_V1)return;
window.__ZR_ADMIN_SHELL_V1=true;

const GROUPS=[
  {id:'operation',label:'운영'},
  {id:'reservation',label:'예약'},
  {id:'customer',label:'고객'},
  {id:'sales',label:'매출'},
  {id:'settings',label:'설정'}
];
const ITEMS=[
  {id:'today',group:'operation',label:'오늘 운영',buttonId:'zrTodayTabBtn',sectionId:'tab-today'},
  {id:'calendar',group:'operation',label:'예약 캘린더',dataTab:'calendar',sectionId:'tab-calendar'},
  {id:'schedule',group:'operation',label:'스케줄 관리',buttonId:'zrScheduleTabBtn',sectionId:'tab-schedule'},
  {id:'warning',group:'operation',label:'경고',buttonId:'zrWarningTabBtn',sectionId:'tab-warning'},
  {id:'activity',group:'reservation',label:'예약 현황',dataTab:'activity',sectionId:'tab-activity'},
  {id:'meals',group:'reservation',label:'식사 현황',dataTab:'meals',sectionId:'tab-meals'},
  {id:'cleanup',group:'reservation',label:'과거 예약 정리',buttonId:'zrCleanupTabBtn',sectionId:'tab-cleanup'},
  {id:'inquiries',group:'customer',label:'1:1 문의',dataTab:'inquiries',sectionId:'tab-inquiries'},
  {id:'previewVisit',group:'customer',label:'사전답사 관리',buttonId:'zrPreviewVisitTabBtn',sectionId:'tab-preview-visit'},
  {id:'guide',group:'customer',label:'고객 안내 관리',buttonId:'zrGuideAdminTab',sectionId:'zrGuideAdminSection'},
  {id:'outsourcing',group:'sales',label:'아웃소싱 결제대금',buttonId:'outsourceTabBtn',sectionId:'tab-outsourcing'},
  {id:'menuadmin',group:'sales',label:'카페 메뉴 관리',dataTab:'menuadmin',sectionId:'tab-menuadmin'},
  {id:'settings',group:'settings',label:'예약설정',dataTab:'settings',sectionId:'tab-settings'}
];
const $=id=>document.getElementById(id);
let rail=null,header=null,adminObserver=null,pendingSync=false,activeId='',stylePromise=null;

async function ensureRuntimeStyle(){
  if($('zrAdminDesignTokensRuntimeV1'))return true;
  if(stylePromise)return stylePromise;
  stylePromise=(async()=>{
    try{
      const r=await fetch('./admin_design_tokens_v1.css?v=3',{cache:'no-store'});
      if(!r.ok)throw new Error(`style ${r.status}`);
      const css=await r.text();
      if(!css.includes('--zr-admin-rail-width:')||!css.includes('.zr-admin-shell-rail'))throw new Error('invalid admin shell css');
      const style=document.createElement('style');
      style.id='zrAdminDesignTokensRuntimeV1';
      style.textContent=css;
      document.head.appendChild(style);
      return true;
    }catch(e){
      console.error('admin shell style load',e);
      return false;
    }
  })();
  return stylePromise;
}
function groupLabel(id){return GROUPS.find(g=>g.id===id)?.label||''}
function findTarget(item){
  if(item.buttonId){const b=$(item.buttonId);if(b)return b}
  if(item.dataTab)return document.querySelector(`#adminView .admin-tabs [data-tab="${CSS.escape(item.dataTab)}"]`);
  return null;
}
function sectionVisible(item){
  const sec=$(item.sectionId);if(!sec)return false;
  if(sec.hidden||sec.classList.contains('hidden'))return false;
  const cs=getComputedStyle(sec);return cs.display!=='none'&&cs.visibility!=='hidden';
}
function originalLooksActive(item){
  const t=findTarget(item);if(!t)return false;
  return t.classList.contains('btn-primary')||t.classList.contains('active')||t.getAttribute('aria-selected')==='true';
}
function setActive(id){
  const item=ITEMS.find(x=>x.id===id);if(!item)return;
  activeId=id;
  rail?.querySelectorAll('[data-zr-admin-item]').forEach(b=>b.classList.toggle('is-active',b.dataset.zrAdminItem===id));
  const title=$('zrAdminShellPageTitle'),path=$('zrAdminShellPath');
  if(title)title.textContent=item.label;
  if(path)path.textContent=`${groupLabel(item.group)} / ${item.label}`;
}
function syncAvailability(){
  rail?.querySelectorAll('[data-zr-admin-item]').forEach(b=>{
    const item=ITEMS.find(x=>x.id===b.dataset.zrAdminItem);if(!item)return;
    const ready=!!findTarget(item);
    b.classList.toggle('is-unavailable',!ready);
    b.setAttribute('aria-disabled',ready?'false':'true');
  });
}
function syncActive(){
  pendingSync=false;syncAvailability();
  const visible=ITEMS.find(sectionVisible);
  if(visible)return setActive(visible.id);
  const styled=ITEMS.find(originalLooksActive);
  if(styled)return setActive(styled.id);
  if(!activeId){const calendar=ITEMS.find(x=>x.id==='calendar');if(calendar)setActive(calendar.id)}
}
function scheduleSync(){if(pendingSync)return;pendingSync=true;requestAnimationFrame(syncActive)}
function forward(item){
  const target=findTarget(item);
  if(!target){syncAvailability();return}
  setActive(item.id);
  target.click();
  setTimeout(syncActive,30);
  setTimeout(syncActive,140);
}
function buildRail(){
  const el=document.createElement('aside');el.className='zr-admin-shell-rail';el.id='zrAdminShellRail';
  const brand=document.createElement('div');brand.className='zr-admin-shell-brand';brand.innerHTML='<div class="zr-admin-shell-logo-slot" aria-hidden="true">Z</div><div class="zr-admin-shell-brand-copy"><div class="zr-admin-shell-brand-title">주렁주렁 동탄점</div><div class="zr-admin-shell-brand-sub">통합 예약관리 시스템</div></div>';
  const nav=document.createElement('nav');nav.className='zr-admin-shell-nav';nav.setAttribute('aria-label','관리자 메뉴');
  GROUPS.forEach(group=>{
    const box=document.createElement('section');box.className='zr-admin-shell-group';box.dataset.group=group.id;
    const h=document.createElement('div');h.className='zr-admin-shell-group-title';h.textContent=group.label;box.appendChild(h);
    ITEMS.filter(x=>x.group===group.id).forEach(item=>{
      const b=document.createElement('button');b.type='button';b.className='zr-admin-shell-item';b.dataset.zrAdminItem=item.id;b.dataset.group=item.group;
      b.innerHTML='<span class="zr-admin-shell-item-dot" aria-hidden="true"></span><span class="zr-admin-shell-item-label"></span>';
      b.querySelector('.zr-admin-shell-item-label').textContent=item.label;
      b.addEventListener('click',()=>forward(item));box.appendChild(b);
    });
    nav.appendChild(box);
  });
  const footer=document.createElement('div');footer.className='zr-admin-shell-footer';
  const logout=document.createElement('button');logout.type='button';logout.className='zr-admin-shell-logout';logout.textContent='관리자 로그아웃';logout.addEventListener('click',()=>$('adminLogout')?.click());footer.appendChild(logout);
  el.append(brand,nav,footer);return el;
}
function buildHeader(){
  const el=document.createElement('header');el.className='zr-admin-shell-header';el.id='zrAdminShellHeader';
  el.innerHTML='<div class="zr-admin-shell-header-copy"><div class="zr-admin-shell-eyebrow">ZOOLUNG DONGTAN · ADMIN</div><div class="zr-admin-shell-page-title" id="zrAdminShellPageTitle">예약 캘린더</div><div class="zr-admin-shell-path" id="zrAdminShellPath">운영 / 예약 캘린더</div></div><div class="zr-admin-shell-status">관리자 모드</div>';
  return el;
}
function adminIsVisible(){
  const admin=$('adminView');if(!admin)return false;
  return !admin.classList.contains('hidden')&&getComputedStyle(admin).display!=='none';
}
function syncVisibility(){
  const on=adminIsVisible();
  document.documentElement.classList.toggle('zr-admin-shell-mounted',on);
  if(rail)rail.hidden=!on;if(header)header.hidden=!on;
  if(on)scheduleSync();
}
function installObservers(){
  const admin=$('adminView');if(!admin||adminObserver)return;
  adminObserver=new MutationObserver(muts=>{
    if(muts.some(m=>m.target===admin&&(m.attributeName==='style'||m.attributeName==='class')))syncVisibility();
    scheduleSync();
  });
  adminObserver.observe(admin,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-selected']});
  document.addEventListener('click',e=>{
    const old=e.target?.closest?.('#adminView .admin-tabs button');if(old)setTimeout(syncActive,0);
  },true);
}
function mount(){
  if(rail||!$('adminView'))return false;
  rail=buildRail();header=buildHeader();rail.hidden=true;header.hidden=true;
  document.body.append(rail,header);installObservers();syncAvailability();syncVisibility();syncActive();
  let ticks=0;const t=setInterval(()=>{syncAvailability();syncVisibility();syncActive();if(++ticks>=60)clearInterval(t)},500);
  return true;
}
async function boot(){
  const styled=await ensureRuntimeStyle();
  if(!styled)return;
  if(mount())return;
  let tries=0;const t=setInterval(()=>{if(mount()||++tries>100)clearInterval(t)},100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
