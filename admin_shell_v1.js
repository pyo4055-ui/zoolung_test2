(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_V1)return;
window.__ZR_ADMIN_SHELL_V1=true;

const PREF_KEY='zr_admin_nav_preferences_v1';
const GROUPS=[
  {id:'operation',label:'운영'},
  {id:'reservation',label:'예약 관리'},
  {id:'customer',label:'고객 응대'},
  {id:'sales',label:'매출'},
  {id:'outsourcing',label:'아웃소싱 정산'},
  {id:'settings',label:'설정'},
  {id:'records',label:'기록 정리'}
];
const ITEMS=[
  {id:'today',group:'operation',label:'오늘 운영',buttonId:'zrTodayTabBtn',sectionId:'tab-today'},
  {id:'calendar',group:'reservation',label:'예약 캘린더',dataTab:'calendar',sectionId:'tab-calendar'},
  {id:'schedule',group:'operation',label:'스케줄 관리',buttonId:'zrScheduleTabBtn',sectionId:'tab-schedule'},
  {id:'warning',group:'operation',label:'운영 경고',buttonId:'zrWarningTabBtn',sectionId:'tab-warning'},
  {id:'activity',group:'reservation',label:'예약 현황',dataTab:'activity',sectionId:'tab-activity'},
  {id:'meals',group:'operation',label:'식사 현황',dataTab:'meals',sectionId:'tab-meals'},
  {id:'cleanup',group:'records',label:'과거 예약 정리',buttonId:'zrCleanupTabBtn',sectionId:'tab-cleanup'},
  {id:'inquiries',group:'customer',label:'단체문의 관리',dataTab:'inquiries',sectionId:'tab-inquiries'},
  {id:'previewVisit',group:'customer',label:'사전답사 관리',buttonId:'zrPreviewVisitTabBtn',sectionId:'tab-preview-visit'},
  {id:'guide',group:'settings',label:'고객 안내 설정',buttonId:'zrGuideAdminTab',sectionId:'zrGuideAdminSection'},
  {id:'outsourcing',group:'outsourcing',label:'아웃소싱 정산',buttonId:'outsourceTabBtn',sectionId:'tab-outsourcing'},
  {id:'menuadmin',group:'settings',label:'카페 메뉴 설정',dataTab:'menuadmin',sectionId:'tab-menuadmin'},
  {id:'settings',group:'settings',label:'예약 설정',dataTab:'settings',sectionId:'tab-settings'}
];
ITEMS.push({id:'groupNotice',group:'settings',label:'단체 안내문구 설정',dataTab:'group-notice',sectionId:'tab-group-notice'});
ITEMS.push(
 {id:'smsSettings',group:'settings',label:'문자 설정',routeBase:'settings',buttonId:'zrSettingsConfirmSmsSubtabV1',sectionId:'zrSettingsConfirmSmsPanelV1'},
 {id:'vendorSettings',group:'settings',label:'아웃소싱 업체 설정',routeBase:'settings',buttonId:'zrSettingsOutsourceSubtabV1',sectionId:'zrSettingsOutsourcePanelV1'}
);
GROUPS.push({id:'legacy',label:'이전 예약'});ITEMS.push({id:'legacyUpload',group:'legacy',label:'(구) 예약접수 업로드',buttonId:'legacyUploadButton',sectionId:'tab-legacy-upload'});
const VALID_ITEM_IDS=new Set(ITEMS.map(x=>x.id));
const $=id=>document.getElementById(id);
let rail=null,header=null,editor=null,adminObserver=null,pendingSync=false,activeId='',stylePromise=null,editButton=null,collapseButton=null,readyTimer=null;

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
    return {hidden,collapsed:raw.collapsed===true,favoritesOnly:raw.favoritesOnly===true};
  }catch{return {hidden:[],collapsed:false}}
}
function savePrefs(next){
  try{
    const current=loadPrefs();
    const hidden=Array.isArray(next.hidden)?[...new Set(next.hidden)].filter(id=>VALID_ITEM_IDS.has(id)):current.hidden;
    const collapsed=typeof next.collapsed==='boolean'?next.collapsed:current.collapsed;
    localStorage.setItem(PREF_KEY,JSON.stringify({hidden,collapsed,favoritesOnly:typeof next.favoritesOnly==='boolean'?next.favoritesOnly:current.favoritesOnly===true}));
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
function setActive(id,fromSync=false){
  const changePanel=$('tab-inquiry-reply-v1');
  const changeSelected=['zrReservationChangeAdminRequestSubtab','zrReservationChangeAdminSmsSubtab'].some(key=>{const b=$(key);return b&&(b.classList.contains('btn-primary')||b.classList.contains('zr-subtab-active')||b.getAttribute('aria-selected')==='true')});
  if(id==='inquiries'&&(rail?.dataset.zrRouteIntent==='reservationChange'||(fromSync&&changeSelected&&changePanel&&!changePanel.classList.contains('hidden')&&getComputedStyle(changePanel).display!=='none')))id='reservationChange';
  const item=id==='reservationChange'?{id,group:'reservation',label:'예약변경 관리'}:ITEMS.find(x=>x.id===id);if(!item)return;
  activeId=id;
  rail?.querySelectorAll('[data-zr-admin-item]').forEach(b=>b.classList.toggle('is-active',b.dataset.zrAdminItem===id));
  const title=$('zrAdminShellPageTitle'),path=$('zrAdminShellPath');
  if(title&&title.textContent!==item.label)title.textContent=item.label;
  if(path&&path.textContent!==`${groupLabel(item.group)} / ${item.label}`)path.textContent=`${groupLabel(item.group)} / ${item.label}`;
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

let favoritePanel=null,favoriteOwner='',favoriteRenderQueued=false,favoriteSignature='';
function favoriteKey(){const id=String(localStorage.getItem('zr_admin_display_name_v1')||'').trim();return id?'zr_admin_favorites_v1:'+encodeURIComponent(id):null}
function readFavorites(){try{const key=favoriteKey();const value=key?JSON.parse(localStorage.getItem(key)||'[]'):[];return new Set(Array.isArray(value)?value.filter(x=>typeof x==='string'):[])}catch{return new Set()}}
function favoriteId(button){return button.dataset.zrAdminSubitem?'sub:'+button.dataset.zrAdminSubitem:button.dataset.zrAdminItem?'main:'+button.dataset.zrAdminItem:button.dataset.zrSalesRailMode?'sales:'+button.dataset.zrSalesRailMode:''}
function favoriteLabel(button){return (button.querySelector('.zr-admin-shell-item-label')?.textContent||[...button.childNodes].filter(n=>!n.classList?.contains('zr-menu-star')&&!n.classList?.contains('zr-admin-shell-submenu-chevron')).map(n=>n.textContent).join('')).trim()}
function favoriteButtons(){return [...(rail?.querySelectorAll('[data-zr-admin-item],[data-zr-admin-subitem],[data-zr-sales-rail-mode]')||[])].filter(b=>b.tagName==='BUTTON'&&favoriteId(b)&&b.dataset.zrAdminItem!=='warning'&&!b.hasAttribute('aria-haspopup'))}
function renderFavorites(){
 if(!favoritePanel||favoritePanel.hidden)return;
 const chosen=readFavorites(),items=favoriteButtons().filter(b=>chosen.has(favoriteId(b)));
 const signature=JSON.stringify([favoriteKey(),items.map(b=>[favoriteId(b),favoriteLabel(b)])]);if(signature===favoriteSignature)return;favoriteSignature=signature;favoritePanel.replaceChildren();
 const title=document.createElement('strong');title.textContent='즐겨찾기';favoritePanel.append(title);
 const list=document.createElement('div');list.className='zr-favorites-list';favoritePanel.append(list);
 for(const original of favoriteButtons().filter(b=>chosen.has(favoriteId(b)))){
  const button=document.createElement('button');button.type='button';button.textContent=favoriteLabel(original);button.addEventListener('click',()=>original.click());list.append(button);
 }
 if(!list.children.length){const empty=document.createElement('p');empty.textContent='메뉴 옆 별을 눌러 즐겨찾기를 추가하세요.';list.append(empty)}
}
function decorateFavorites(){
 const selected=readFavorites();
 rail?.querySelectorAll('[aria-haspopup] > .zr-menu-star,[data-zr-admin-item="warning"] > .zr-menu-star').forEach(star=>star.remove());
 for(const button of favoriteButtons()){
  let star=button.querySelector('.zr-menu-star');
  if(!star){star=document.createElement('span');star.className='zr-menu-star';star.setAttribute('role','button');star.tabIndex=0;button.append(star)}
  const on=selected.has(favoriteId(button)),label=favoriteLabel(button)+' 즐겨찾기 '+(on?'해제':'추가');
  if(star.textContent!==(on?'★':'☆'))star.textContent=on?'★':'☆';
  if(star.getAttribute('aria-label')!==label)star.setAttribute('aria-label',label);
  if(star.getAttribute('aria-pressed')!==String(on))star.setAttribute('aria-pressed',String(on));
 }
 const owner=favoriteKey();if(favoriteOwner!==owner){favoriteOwner=owner;favoriteSignature=''}
 renderFavorites();
}
function installFavorites(){
 favoritePanel=document.createElement('section');favoritePanel.id='zrAdminFavoritesPanel';favoritePanel.hidden=true;favoritePanel.setAttribute('aria-label','즐겨찾기 메뉴');rail.querySelector('.zr-admin-shell-brand').after(favoritePanel);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='zr-favorites-toggle';toggle.textContent='☆ 즐겨찾기';toggle.setAttribute('aria-label','즐겨찾기 메뉴 열기');toggle.title='즐겨찾기';rail.querySelector('.zr-admin-shell-brand').after(toggle);
 const toggleFavorite=e=>{const star=e.target.closest?.('.zr-menu-star');if(!star)return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();const key=favoriteKey();if(!key)return;const button=star.closest('button'),id=favoriteId(button),values=readFavorites();if(values.has(id))values.delete(id);else values.add(id);try{localStorage.setItem(key,JSON.stringify([...values]))}catch{window.ZRDialogs?.alert('즐겨찾기를 저장하지 못했습니다.');return}decorateFavorites();renderFavorites()};
 rail.addEventListener('click',toggleFavorite,true);rail.addEventListener('keydown',toggleFavorite,true);
 toggle.addEventListener('click',()=>{savePrefs({collapsed:false,favoritesOnly:!loadPrefs().favoritesOnly});applyCollapsedState()});
 new MutationObserver(()=>{if(favoriteRenderQueued)return;favoriteRenderQueued=true;queueMicrotask(()=>{favoriteRenderQueued=false;decorateFavorites()})}).observe(rail,{childList:true,subtree:true});
 window.addEventListener('storage',()=>{decorateFavorites();renderFavorites()});decorateFavorites();
}

function applyCollapsedState(){
  const {collapsed,favoritesOnly}=loadPrefs();
  document.documentElement.classList.toggle('zr-admin-shell-collapsed',collapsed);
  if(collapseButton){
    collapseButton.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/><path d="'+(collapsed?'m13 9 3 3-3 3':'m16 9-3 3 3 3')+'"/></svg>';
    const home=rail?.querySelector('.zr-admin-shell-brand');
    if(collapsed&&header&&collapseButton.parentElement!==header)header.prepend(collapseButton);
    else if(!collapsed&&home&&collapseButton.parentElement!==home)home.append(collapseButton);
    collapseButton.setAttribute('aria-expanded',collapsed?'false':'true');
    collapseButton.setAttribute('aria-label',collapsed?'왼쪽 메뉴 펼치기':'왼쪽 메뉴 접기');
    collapseButton.title=collapsed?'왼쪽 메뉴 펼치기':'왼쪽 메뉴 접기';
  }
  document.documentElement.classList.toggle('zr-admin-shell-favorites',favoritesOnly===true);
  const favoriteToggle=rail?.querySelector('.zr-favorites-toggle');
  if(favoriteToggle){favoriteToggle.textContent=favoritesOnly?'★ 즐겨찾기 · 전체 메뉴 보기':'☆ 즐겨찾기';favoriteToggle.setAttribute('aria-pressed',String(favoritesOnly===true))}
  if(favoritePanel){favoritePanel.hidden=collapsed||!favoritesOnly;renderFavorites()}
  if(collapsed)setEditorOpen(false);
}
function toggleCollapsed(){
  const collapsed=!loadPrefs().collapsed;
  savePrefs({collapsed});
  applyCollapsedState();
}
function syncActive(){
  pendingSync=false;syncAvailability();decorateFavorites();
  const salesSection=$('tab-sales-dashboard');
  if(salesSection&&!salesSection.classList.contains('hidden')&&getComputedStyle(salesSection).display!=='none'){
    activeId='salesDashboard';
    rail?.querySelectorAll('[data-zr-admin-item]').forEach(b=>b.classList.toggle('is-active',b.dataset.zrAdminItem==='salesDashboard'));
    const title=$('zrAdminShellPageTitle'),path=$('zrAdminShellPath');
    if(title&&title.textContent!=='매출 현황')title.textContent='매출 현황';
    if(path&&!path.textContent.startsWith('매출 / 매출 현황'))path.textContent='매출 / 매출 현황';
    return;
  }
  const special=[['smsSettings',['zrSettingsConfirmSmsPanelV1','zrSettingsScheduleSmsPanelV1','zrReservationChangeSmsPanel','zrPreviewNotifyTemplatePanel']],['vendorSettings',['zrSettingsOutsourcePanelV1']]].find(([,ids])=>ids.some(id=>{const el=$(id);return el&&!el.closest('.hidden,[hidden]')}));
  if(special)return setActive(special[0],true);
  const visible=ITEMS.filter(x=>!x.routeBase).find(sectionVisible);
  if(visible)return setActive(visible.id,true);
  const styled=ITEMS.find(originalLooksActive);
  if(styled)return setActive(styled.id,true);
  if(!activeId){const calendar=ITEMS.find(x=>x.id==='calendar');if(calendar)setActive(calendar.id)}
}
function scheduleSync(){if(pendingSync)return;pendingSync=true;requestAnimationFrame(syncActive)}
window.ZRAdminNavigate=id=>{const item=ITEMS.find(x=>x.id===id);if(item)forward(item)};
function forward(item){
  if(item.routeBase)forward(ITEMS.find(x=>x.id===item.routeBase));
  const target=findTarget(item);
  if(!target){syncAvailability();return}
  // Re-clicking the visible route used to invoke the legacy renderer again.
  // Several late UI decorators then repainted on the next frame, exposing the
  // undecorated calendar/section for a moment. An active route is a no-op.
  if(activeId===item.id&&sectionVisible(item)){scheduleSync();return}
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
    if(muts.every(m=>m.type==='attributes'&&m.oldValue===m.target.getAttribute(m.attributeName)))return;
    if(muts.some(m=>m.target===admin&&(m.attributeName==='style'||m.attributeName==='class')))syncVisibility();
    scheduleSync();
  });
  adminObserver.observe(admin,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','style','aria-selected']});
  document.addEventListener('click',e=>{
    const old=e.target?.closest?.('#adminView .admin-tabs button');if(old)setTimeout(syncActive,0);
    if(editor&&!editor.hidden&&!e.target?.closest?.('#zrAdminShellEditor')&&!e.target?.closest?.('.zr-admin-shell-edit'))setEditorOpen(false);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editor&&!editor.hidden)setEditorOpen(false)});
}
function mount(){
  if(rail)return true;
  if(!$('adminView'))return false;
  rail=buildRail();header=buildHeader();editor=buildEditor();rail.hidden=true;header.hidden=true;
  document.body.append(rail,header,editor);installFavorites();applyMenuPrefs();applyCollapsedState();installObservers();syncAvailability();syncVisibility();syncActive();
  document.dispatchEvent(new CustomEvent('zr:admin-shell-ready'));
  return true;
}
async function boot(){
  const styled=await ensureRuntimeStyle();
  if(!styled)return;
  if(mount()){if(readyTimer)clearInterval(readyTimer);readyTimer=null;return}
  if(readyTimer)return;
  let tries=0;readyTimer=setInterval(()=>{if(mount()||++tries>100){clearInterval(readyTimer);readyTimer=null}},100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
