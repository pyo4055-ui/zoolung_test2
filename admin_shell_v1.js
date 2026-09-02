(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_V1)return;
window.__ZR_ADMIN_SHELL_V1=true;

const PREF_KEY='zr_admin_nav_preferences_v1';
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
const VALID_ITEM_IDS=new Set(ITEMS.map(x=>x.id));
const $=id=>document.getElementById(id);
let rail=null,header=null,editor=null,adminObserver=null,pendingSync=false,activeId='',stylePromise=null,editButton=null,collapseButton=null;

async function ensureRuntimeStyle(){
  if($('zrAdminDesignTokensRuntimeV1'))return true;
  if(stylePromise)return stylePromise;
  stylePromise=(async()=>{
    try{
      const r=await fetch('./admin_design_tokens_v1.css?v=5',{cache:'no-store'});
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
function loadPrefs(){
  try{
    const raw=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
    const hidden=Array.isArray(raw.hidden)?raw.hidden.filter(id=>VALID_ITEM_IDS.has(id)):[];
    return {hidden,collapsed:raw.collapsed===true};
  }catch{return {hidden:[],collapsed:false}}
}
function savePrefs(next){
  try{
    const current=loadPrefs();
    const hidden=Array.isArray(next.hidden)?[...new Set(next.hidden)].filter(id=>VALID_ITEM_IDS.has(id)):current.hidden;
    const collapsed=typeof next.collapsed==='boolean'?next.collapsed:current.collapsed;
    localStorage.setItem(PREF_KEY,JSON.stringify({hidden,collapsed}));
  }catch{}
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
function applyMenuPrefs(){
  if(!rail)return;
  const hidden=new Set(loadPrefs().hidden);
  rail.querySelectorAll('[data-zr-admin-item]').forEach(b=>{b.hidden=hidden.has(b.dataset.zrAdminItem)});
  rail.querySelectorAll('.zr-admin-shell-group').forEach(group=>{
    group.hidden=![...group.querySelectorAll('[data-zr-admin-item]')].some(b=>!b.hidden);
  });
  const empty=$('zrAdminShellEmpty');
  if(empty)empty.hidden=ITEMS.some(item=>!hidden.has(item.id));
  editor?.querySelectorAll('[data-zr-pref-item]').forEach(input=>{input.checked=!hidden.has(input.dataset.zrPrefItem)});
}
function applyCollapsedState(){
  const collapsed=loadPrefs().collapsed;
  document.documentElement.classList.toggle('zr-admin-shell-collapsed',collapsed);
  if(collapseButton){
    collapseButton.textContent=collapsed?'›':'‹';
    collapseButton.setAttribute('aria-expanded',collapsed?'false':'true');
    collapseButton.setAttribute('aria-label',collapsed?'왼쪽 메뉴 펼치기':'왼쪽 메뉴 접기');
    collapseButton.title=collapsed?'왼쪽 메뉴 펼치기':'왼쪽 메뉴 접기';
  }
  if(collapsed)setEditorOpen(false);
}
function toggleCollapsed(){
  const collapsed=!loadPrefs().collapsed;
  savePrefs({collapsed});
  applyCollapsedState();
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
function setEditorOpen(open){
  if(!editor)return;
  if(open&&loadPrefs().collapsed)open=false;
  editor.hidden=!open;
  editButton?.setAttribute('aria-expanded',open?'true':'false');
  if(open){applyMenuPrefs();editor.querySelector('input')?.focus?.()}
}
function toggleItemPreference(id,visible){
  const prefs=loadPrefs();
  const hidden=new Set(prefs.hidden);
  if(visible)hidden.delete(id);else hidden.add(id);
  savePrefs({hidden:[...hidden]});
  applyMenuPrefs();
}
function buildEditor(){
  const panel=document.createElement('div');panel.className='zr-admin-shell-editor';panel.id='zrAdminShellEditor';panel.hidden=true;
  const head=document.createElement('div');head.className='zr-admin-shell-editor-head';
  head.innerHTML='<div class="zr-admin-shell-editor-copy"><div class="zr-admin-shell-editor-title">메뉴 편집</div><div class="zr-admin-shell-editor-help">왼쪽에 표시할 메뉴만 선택하세요. 기능은 삭제되지 않고 이 브라우저 화면에서만 숨겨집니다.</div></div>';
  const close=document.createElement('button');close.type='button';close.className='zr-admin-shell-editor-close';close.setAttribute('aria-label','메뉴 편집 닫기');close.textContent='×';close.addEventListener('click',()=>setEditorOpen(false));head.appendChild(close);panel.appendChild(head);
  GROUPS.forEach(group=>{
    const box=document.createElement('section');box.className='zr-admin-shell-editor-group';
    const title=document.createElement('div');title.className='zr-admin-shell-editor-group-title';title.textContent=group.label;box.appendChild(title);
    ITEMS.filter(item=>item.group===group.id).forEach(item=>{
      const label=document.createElement('label');label.className='zr-admin-shell-editor-row';
      const input=document.createElement('input');input.type='checkbox';input.dataset.zrPrefItem=item.id;input.checked=true;
      const text=document.createElement('span');text.textContent=item.label;
      input.addEventListener('change',()=>toggleItemPreference(item.id,input.checked));
      label.append(input,text);box.appendChild(label);
    });
    panel.appendChild(box);
  });
  const actions=document.createElement('div');actions.className='zr-admin-shell-editor-actions';
  const reset=document.createElement('button');reset.type='button';reset.className='zr-admin-shell-reset';reset.textContent='전체 표시';reset.addEventListener('click',()=>{savePrefs({hidden:[]});applyMenuPrefs()});actions.appendChild(reset);panel.appendChild(actions);
  return panel;
}
function buildRail(){
  const el=document.createElement('aside');el.className='zr-admin-shell-rail';el.id='zrAdminShellRail';
  const brand=document.createElement('div');brand.className='zr-admin-shell-brand';brand.innerHTML='<div class="zr-admin-shell-logo-slot" aria-hidden="true">Z</div><div class="zr-admin-shell-brand-copy"><div class="zr-admin-shell-brand-title">주렁주렁 동탄점</div><div class="zr-admin-shell-brand-sub">통합 예약관리 시스템</div></div>';
  collapseButton=document.createElement('button');collapseButton.type='button';collapseButton.className='zr-admin-shell-collapse';collapseButton.setAttribute('aria-controls','zrAdminShellNav');collapseButton.addEventListener('click',toggleCollapsed);brand.appendChild(collapseButton);
  const nav=document.createElement('nav');nav.className='zr-admin-shell-nav';nav.id='zrAdminShellNav';nav.setAttribute('aria-label','관리자 메뉴');
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
  const empty=document.createElement('div');empty.id='zrAdminShellEmpty';empty.className='zr-admin-shell-empty';empty.hidden=true;empty.textContent='표시 중인 메뉴가 없습니다. 아래 메뉴 편집에서 다시 선택할 수 있어요.';nav.appendChild(empty);
  const footer=document.createElement('div');footer.className='zr-admin-shell-footer';
  editButton=document.createElement('button');editButton.type='button';editButton.className='zr-admin-shell-edit';editButton.textContent='메뉴 편집';editButton.setAttribute('aria-expanded','false');editButton.addEventListener('click',()=>setEditorOpen(editor?.hidden!==false));
  const logout=document.createElement('button');logout.type='button';logout.className='zr-admin-shell-logout';logout.textContent='관리자 로그아웃';logout.addEventListener('click',()=>$('adminLogout')?.click());footer.append(editButton,logout);
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
  if(!on)setEditorOpen(false);
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
    if(editor&&!editor.hidden&&!e.target?.closest?.('#zrAdminShellEditor')&&!e.target?.closest?.('.zr-admin-shell-edit'))setEditorOpen(false);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editor&&!editor.hidden)setEditorOpen(false)});
}
function mount(){
  if(rail||!$('adminView'))return false;
  rail=buildRail();header=buildHeader();editor=buildEditor();rail.hidden=true;header.hidden=true;
  document.body.append(rail,header,editor);applyMenuPrefs();applyCollapsedState();installObservers();syncAvailability();syncVisibility();syncActive();
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
