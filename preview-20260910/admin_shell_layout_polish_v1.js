(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_LAYOUT_POLISH_V1)return;
window.__ZR_ADMIN_SHELL_LAYOUT_POLISH_V1=true;

const $=id=>document.getElementById(id);
let installed=false,pathObserver=null,searchOpen=false;

function injectStyle(){
  if($('zrAdminShellLayoutPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminShellLayoutPolishV1Style';
  s.textContent=`
  :root{
    --zr-shell-gap:14px;
    --zr-shell-bg:#f4efe9;
    --zr-shell-panel:#fffdfa;
    --zr-shell-line:#e7ddd4;
    --zr-shell-text:#292622;
    --zr-shell-muted:#716a64;
    --zr-shell-shadow:0 8px 28px rgba(68,49,35,.055);
    --zr-admin-header-height:58px;
    --zr-admin-smart-width:300px;
  }
  html.zr-admin-shell-mounted,html.zr-admin-shell-mounted body{background:var(--zr-shell-bg)!important;color:var(--zr-shell-text)!important}

  /* Three independent rounded workspace panels */
  .zr-admin-shell-rail{
    top:var(--zr-shell-gap)!important;bottom:var(--zr-shell-gap)!important;left:var(--zr-shell-gap)!important;
    height:auto!important;border:1px solid var(--zr-shell-line)!important;border-radius:20px!important;
    background:var(--zr-shell-panel)!important;box-shadow:var(--zr-shell-shadow)!important;
  }
  .zr-admin-shell-brand{min-height:68px!important;border-bottom:1px solid #eee5dd!important;padding:12px 11px 12px 14px!important}
  .zr-admin-shell-nav{padding:13px 10px 16px!important}
  .zr-admin-shell-group{margin-bottom:15px!important}
  .zr-admin-shell-footer{border-top:1px solid #eee5dd!important;padding:10px!important}

  .zr-admin-shell-header{
    top:var(--zr-shell-gap)!important;height:var(--zr-admin-header-height)!important;
    left:calc(var(--zr-admin-rail-width) + (var(--zr-shell-gap) * 2))!important;
    right:calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2))!important;
    padding:8px 10px 8px 13px!important;border:1px solid var(--zr-shell-line)!important;border-radius:16px!important;
    background:rgba(255,253,250,.97)!important;box-shadow:var(--zr-shell-shadow)!important;backdrop-filter:blur(14px);
  }
  .zr-admin-shell-header-copy,.zr-admin-shell-eyebrow{display:none!important}
  .zr-admin-shell-breadcrumb{flex:0 0 auto;min-width:132px;max-width:230px;font-size:12px;font-weight:900;color:#5d5751;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 5px}
  .zr-admin-shell-breadcrumb strong{color:var(--zr-operation);font-weight:950}
  .zr-admin-shell-search-wrap{position:relative;min-width:180px;flex:1}
  .zr-admin-shell-search{width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;box-sizing:border-box!important;border:1px solid #e5ddd5!important;border-radius:11px!important;background:#fff!important;padding:0 13px 0 34px!important;font-size:13px!important;font-weight:650!important;color:#3d3935!important;box-shadow:none!important}
  .zr-admin-shell-search:focus{border-color:#a8bbae!important;box-shadow:0 0 0 3px rgba(63,111,90,.09)!important;outline:none!important}
  .zr-admin-shell-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:#8b847d;pointer-events:none}
  .zr-admin-shell-search-results{position:absolute;left:0;right:0;top:46px;z-index:110;display:grid;gap:4px;padding:7px;background:#fff;border:1px solid var(--zr-shell-line);border-radius:12px;box-shadow:0 16px 34px rgba(54,42,32,.15);max-height:320px;overflow:auto}
  .zr-admin-shell-search-results[hidden]{display:none!important}
  .zr-admin-shell-search-result{width:100%;min-height:38px;border:0!important;border-radius:8px!important;background:#fff!important;color:#47413c!important;box-shadow:none!important;padding:8px 10px!important;text-align:left!important;font-size:13px!important;font-weight:800!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important}
  .zr-admin-shell-search-result:hover,.zr-admin-shell-search-result.is-keyboard{background:var(--zr-operation-soft)!important;color:var(--zr-operation)!important}
  .zr-admin-shell-search-result small{font-size:10px!important;color:#8e8780!important;font-weight:750!important}
  .zr-admin-shell-header-edit{height:40px;min-width:70px;border:1px solid #e2dad2!important;border-radius:10px!important;background:#fff!important;color:#57514b!important;box-shadow:none!important;padding:0 11px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap}
  .zr-admin-shell-header-edit:hover{background:#f7f3ee!important}
  .zr-admin-shell-status{padding:7px 9px!important;font-size:10px!important;background:#fbfdfb!important}
  .zr-admin-shell-page-title-polish{display:none!important}

  /* Fixed right operations summary: no user collapse */
  .zr-admin-smart-panel{
    display:none!important;top:var(--zr-shell-gap)!important;right:var(--zr-shell-gap)!important;bottom:var(--zr-shell-gap)!important;left:auto!important;
    width:var(--zr-admin-smart-width)!important;height:auto!important;border:1px solid var(--zr-shell-line)!important;border-radius:20px!important;
    background:var(--zr-shell-panel)!important;box-shadow:var(--zr-shell-shadow)!important;overflow:hidden!important;
  }
  html.zr-admin-shell-mounted .zr-admin-smart-panel{display:flex!important;flex-direction:column!important}
  html.zr-admin-shell-mounted .zr-admin-smart-toggle{display:none!important}
  html.zr-admin-shell-mounted .zr-admin-smart-copy{display:block!important}
  html.zr-admin-shell-mounted .zr-admin-smart-body{display:grid!important}
  html.zr-admin-shell-mounted .zr-admin-smart-foot{display:flex!important}
  .zr-admin-smart-head{min-height:68px!important;padding:12px 15px!important;border-bottom:1px solid #eee5dd!important}
  .zr-admin-smart-title{font-size:16px!important;color:var(--zr-shell-text)!important}
  .zr-admin-smart-sub{font-size:11px!important;color:var(--zr-shell-muted)!important}
  .zr-admin-smart-body{padding:13px!important;gap:12px!important}
  .zr-admin-smart-section{border-color:#e8dfd7!important;border-radius:15px!important;background:#fff!important;padding:14px!important}
  .zr-admin-smart-section-title{font-size:16px!important;margin-bottom:12px!important;color:#332f2b!important}
  .zr-admin-smart-section-help{font-size:11.5px!important;color:#827b74!important}
  .zr-admin-smart-summary{gap:10px!important}.zr-admin-smart-summary-row{font-size:13px!important;color:#68615b!important}.zr-admin-smart-summary-row b{font-size:13px!important}.zr-admin-smart-summary-row strong{font-size:14px!important;color:#332f2b!important}
  .zr-admin-smart-pending{gap:7px!important}.zr-admin-smart-pending-row{min-height:46px!important;font-size:13px!important;padding:9px 10px!important;border-radius:11px!important}.zr-admin-smart-pending-row strong{font-size:18px!important}
  .zr-admin-smart-quick button{min-height:42px!important;font-size:12px!important;border-radius:11px!important}
  .zr-admin-smart-foot{font-size:10px!important;border-top:1px solid #eee5dd!important}

  /* Center workspace is its own rounded panel */
  @media(min-width:1201px){
    html.zr-admin-shell-mounted body #adminView{
      max-width:none!important;width:auto!important;box-sizing:border-box!important;
      margin:calc(var(--zr-shell-gap) + var(--zr-admin-header-height) + 12px) calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2)) var(--zr-shell-gap) calc(var(--zr-admin-rail-width) + (var(--zr-shell-gap) * 2))!important;
      padding:18px 18px 24px!important;min-height:calc(100vh - var(--zr-admin-header-height) - 40px)!important;
      background:var(--zr-shell-panel)!important;border:1px solid var(--zr-shell-line)!important;border-radius:20px!important;box-shadow:var(--zr-shell-shadow)!important;
      color:var(--zr-shell-text)!important;
      transition:margin-left .18s ease!important;
    }
    html.zr-admin-shell-collapsed .zr-admin-shell-header{left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}
    html.zr-admin-shell-collapsed body #adminView{margin-left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}
  }
  @media(min-width:901px) and (max-width:1200px){
    .zr-admin-smart-panel{display:none!important}
    .zr-admin-shell-header{right:var(--zr-shell-gap)!important}
    html.zr-admin-shell-mounted body #adminView{
      max-width:none!important;width:auto!important;box-sizing:border-box!important;
      margin:calc(var(--zr-shell-gap) + var(--zr-admin-header-height) + 12px) var(--zr-shell-gap) var(--zr-shell-gap) calc(var(--zr-admin-rail-width) + (var(--zr-shell-gap) * 2))!important;
      padding:18px!important;background:var(--zr-shell-panel)!important;border:1px solid var(--zr-shell-line)!important;border-radius:20px!important;box-shadow:var(--zr-shell-shadow)!important;
    }
    html.zr-admin-shell-collapsed .zr-admin-shell-header{left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}
    html.zr-admin-shell-collapsed body #adminView{margin-left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}
  }

  /* Readability pass for existing admin screens */
  @media screen and (min-width:901px){
    html.zr-admin-shell-mounted #adminView{font-size:14px!important;line-height:1.5!important}
    html.zr-admin-shell-mounted #adminView h1{font-size:28px!important;line-height:1.25!important;color:#282521!important}
    html.zr-admin-shell-mounted #adminView h2{font-size:22px!important;line-height:1.3!important;color:#2d2925!important}
    html.zr-admin-shell-mounted #adminView h3{font-size:18px!important;line-height:1.35!important;color:#332f2b!important}
    html.zr-admin-shell-mounted #adminView label{font-size:13px!important;font-weight:800!important;color:#4c4641!important}
    html.zr-admin-shell-mounted #adminView input,html.zr-admin-shell-mounted #adminView select,html.zr-admin-shell-mounted #adminView textarea{font-size:14px!important;color:#332f2b!important}
    html.zr-admin-shell-mounted #adminView button{font-size:13px!important}
    html.zr-admin-shell-mounted #adminView .help,html.zr-admin-shell-mounted #adminView small,html.zr-admin-shell-mounted #adminView .muted{font-size:12.5px!important;line-height:1.55!important;color:#746d66!important}
    html.zr-admin-shell-mounted #adminView table th,html.zr-admin-shell-mounted #adminView table td{font-size:13px!important;line-height:1.5!important;color:#403b36!important}
    html.zr-admin-shell-mounted #adminView .card{border-radius:16px!important;border-color:#e6ded6!important;box-shadow:0 4px 18px rgba(62,48,37,.045)!important}

    #tab-today .zr-today-date-title{font-size:14px!important}
    #tab-today .zr-today-db{font-size:12px!important}
    #tab-today .zr-today-metric label{font-size:13px!important}
    #tab-today .zr-today-metric strong{font-size:24px!important}
    #tab-today .zr-today-metric small{font-size:12px!important;line-height:1.45!important}
    #tab-today .zr-today-alert-head b{font-size:15px!important}#tab-today .zr-today-alert-head span{font-size:12.5px!important}.zr-today-chip{font-size:12px!important}
    #tab-today .zr-today-list-head h3{font-size:18px!important}#tab-today .zr-today-list-head span{font-size:12.5px!important}
    #tab-today .zr-today-time strong{font-size:21px!important}#tab-today .zr-today-time span{font-size:12.5px!important}
    #tab-today .zr-today-org{font-size:17px!important}.zr-today-badge{font-size:11.5px!important}
    #tab-today .zr-today-meta{font-size:13.5px!important}#tab-today .zr-today-note{font-size:13px!important}
    .zr-today-cafe-title{font-size:12px!important}.zr-today-cafe-items span{font-size:12px!important}
    #tab-today .zr-today-label{font-size:12.5px!important}#tab-today .zr-today-program-grid b{font-size:12px!important}#tab-today .zr-today-program-grid span{font-size:12.5px!important}
    .zr-today-check,.zr-today-check b{font-size:12.5px!important}.zr-today-schedule-title b{font-size:12.5px!important}.zr-today-schedule-title span{font-size:11px!important}.zr-today-schedule-seg b{font-size:12.5px!important}.zr-today-schedule-seg span{font-size:12px!important}.zr-today-schedule-empty{font-size:12.5px!important}
  }

  /* Prevent text from squeezing vertically while left rail width animates */
  html.zr-admin-shell-resizing .zr-admin-shell-brand-copy,
  html.zr-admin-shell-resizing .zr-admin-shell-nav,
  html.zr-admin-shell-resizing .zr-admin-shell-footer{opacity:0!important;pointer-events:none!important}
  .zr-admin-shell-brand-copy,.zr-admin-shell-nav,.zr-admin-shell-footer{transition:opacity .08s ease}

  @media(max-width:900px){
    .zr-admin-shell-search-results{display:none!important}
  }
  @media(prefers-reduced-motion:reduce){.zr-admin-shell-brand-copy,.zr-admin-shell-nav,.zr-admin-shell-footer{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function normalizePath(){
  const path=$('zrAdminShellPath');if(!path)return;
  const text=String(path.textContent||'').replace(/\s*\/\s*/g,' › ');
  if(path.textContent!==text)path.textContent=text;
}
function observePath(){
  const path=$('zrAdminShellPath');if(!path||pathObserver)return;
  normalizePath();
  pathObserver=new MutationObserver(normalizePath);
  pathObserver.observe(path,{subtree:true,childList:true,characterData:true});
}
function menuButtons(){
  const rail=$('zrAdminShellRail');if(!rail)return [];
  return [...rail.querySelectorAll('[data-zr-admin-item]')].filter(b=>!b.hidden&&b.getAttribute('aria-disabled')!=='true');
}
function groupName(button){
  const group=button?.dataset?.group||'';
  return ({operation:'운영',reservation:'예약',customer:'고객',sales:'매출',settings:'설정'})[group]||'';
}
function renderSearchResults(query=''){
  const box=$('zrAdminShellSearchResults'),input=$('zrAdminShellSearch');if(!box||!input)return;
  const q=String(query||'').trim().toLowerCase();
  if(!q){box.hidden=true;box.innerHTML='';searchOpen=false;return}
  const matches=menuButtons().filter(b=>String(b.querySelector('.zr-admin-shell-item-label')?.textContent||b.textContent||'').toLowerCase().includes(q)).slice(0,8);
  if(!matches.length){box.innerHTML='<div style="padding:9px 10px;font-size:12px;color:#8a837c">일치하는 메뉴가 없습니다.</div>';box.hidden=false;searchOpen=true;return}
  box.innerHTML='';
  matches.forEach((target,index)=>{
    const label=String(target.querySelector('.zr-admin-shell-item-label')?.textContent||target.textContent||'').trim();
    const b=document.createElement('button');b.type='button';b.className='zr-admin-shell-search-result';if(index===0)b.classList.add('is-keyboard');
    b.innerHTML=`<span></span><small>${groupName(target)}</small>`;b.querySelector('span').textContent=label;
    b.addEventListener('click',()=>{target.click();input.value='';box.hidden=true;searchOpen=false;input.blur()});box.appendChild(b);
  });
  box.hidden=false;searchOpen=true;
}
function installHeader(){
  const header=$('zrAdminShellHeader');if(!header||header.dataset.zrPolished==='1')return false;
  header.dataset.zrPolished='1';
  header.innerHTML=`<div class="zr-admin-shell-breadcrumb" id="zrAdminShellPath">운영 › 오늘 운영</div><div class="zr-admin-shell-page-title-polish" id="zrAdminShellPageTitle">오늘 운영</div><div class="zr-admin-shell-search-wrap"><span class="zr-admin-shell-search-icon" aria-hidden="true">⌕</span><input class="zr-admin-shell-search" id="zrAdminShellSearch" autocomplete="off" placeholder="메뉴 검색 (Ctrl+K)" aria-label="관리자 메뉴 검색"><div class="zr-admin-shell-search-results" id="zrAdminShellSearchResults" hidden></div></div><button type="button" class="zr-admin-shell-header-edit" id="zrAdminShellHeaderEdit">메뉴 편집</button><div class="zr-admin-shell-status">관리자 모드</div>`;
  const input=$('zrAdminShellSearch'),results=$('zrAdminShellSearchResults');
  input?.addEventListener('input',()=>renderSearchResults(input.value));
  input?.addEventListener('focus',()=>{if(input.value.trim())renderSearchResults(input.value)});
  input?.addEventListener('keydown',e=>{
    if(e.key==='Escape'){input.value='';results.hidden=true;searchOpen=false;input.blur();return}
    if(e.key==='Enter'){
      const first=results.querySelector('.zr-admin-shell-search-result');if(first){e.preventDefault();first.click()}
    }
  });
  $('zrAdminShellHeaderEdit')?.addEventListener('click',()=>$('zrAdminShellRail')?.querySelector('.zr-admin-shell-edit')?.click());
  document.addEventListener('click',e=>{if(searchOpen&&!e.target?.closest?.('.zr-admin-shell-search-wrap')){results.hidden=true;searchOpen=false}},true);
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){
      const active=document.activeElement,tag=String(active?.tagName||'').toLowerCase();
      if(['input','textarea','select'].includes(tag)&&active!==input)return;
      e.preventDefault();input?.focus();input?.select();
    }
  });
  observePath();
  return true;
}
function installResizeGuard(){
  const b=$('zrAdminShellRail')?.querySelector('.zr-admin-shell-collapse');if(!b||b.dataset.zrResizeGuard==='1')return;
  b.dataset.zrResizeGuard='1';
  b.addEventListener('click',()=>{
    const root=document.documentElement;root.classList.add('zr-admin-shell-resizing');
    clearTimeout(window.__ZR_ADMIN_SHELL_RESIZE_TIMER);
    window.__ZR_ADMIN_SHELL_RESIZE_TIMER=setTimeout(()=>root.classList.remove('zr-admin-shell-resizing'),210);
  },true);
}
function forceSmartPanelOpen(){document.documentElement.classList.add('zr-admin-smart-open')}
function install(){
  if(!$('zrAdminShellRail')||!$('zrAdminShellHeader')||!$('adminView'))return false;
  injectStyle();installHeader();installResizeGuard();forceSmartPanelOpen();installed=true;return true;
}
function boot(){
  if(install())return;
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>120)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
