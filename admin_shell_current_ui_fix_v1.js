(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1)return;
window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1=true;
const $=id=>document.getElementById(id);
let observer=null;

function ensureSafariTheme(){
  ['zrAdminSafariThemeV1','zrAdminSafariThemeV2'].forEach(id=>$(id)?.remove());
  if(!$('zrAdminSafariThemeV3')){
    const link=document.createElement('link');
    link.id='zrAdminSafariThemeV3';link.rel='stylesheet';link.href='./admin_safari_theme_v3.css?v=4';
    document.head.appendChild(link);
  }
}
function injectStyle(){
  if($('zrAdminShellCurrentUiFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminShellCurrentUiFixV1Style';s.textContent=`
    .zr-admin-legacy-chrome-hidden,.zr-admin-legacy-time-pill-hidden{display:none!important}
    .zr-admin-shell-refresh{height:40px;min-width:78px;border-radius:10px!important;padding:0 12px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap}
    .zr-admin-smart-summary-card{border-radius:12px!important;padding:11px!important}
    .zr-admin-smart-type-list{margin-top:9px!important;padding-top:8px!important;border-top:1px dashed #ddd6cf!important}
    .zr-admin-smart-type-row{font-size:11.5px!important}.zr-admin-smart-type-row b{font-size:11.5px!important}

    /* The sidebar owns preview-visit subtabs; keep original controls clickable but not visible. */
    #zrPreviewNotifyInnerTabs{display:none!important}

    /* One navigation language: old per-group hover/active colors must never reappear. */
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item{
      --zr-group-color:var(--zr-v3-green)!important;
      --zr-group-soft:#fff7ef!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item:not([data-zr-admin-item="warning"]) .zr-admin-shell-item-dot{
      background:var(--zr-v3-green)!important;opacity:.7!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item:not([data-zr-admin-item="warning"]):hover{
      background:#fff7ef!important;color:var(--zr-v3-green)!important;border-color:#f0cfb3!important;
      box-shadow:inset 4px 0 0 rgba(252,84,4,.48)!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item:not([data-zr-admin-item="warning"]):hover .zr-admin-shell-item-dot,
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item:not([data-zr-admin-item="warning"]).is-active .zr-admin-shell-item-dot{
      background:var(--zr-v3-orange)!important;opacity:1!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item:not([data-zr-admin-item="warning"]).is-active{
      background:#fff7ef!important;color:var(--zr-v3-green)!important;border-color:#efc6a5!important;
      box-shadow:inset 4px 0 0 var(--zr-v3-orange)!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item-wrap{
      --zr-sub-color:var(--zr-v3-green)!important;--zr-sub-soft:#fff7ef!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-item-wrap.is-submenu-open .zr-admin-shell-submenu-chevron{
      color:var(--zr-v3-orange)!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-submenu-inner{
      border-left-color:#efc6a5!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-subitem:before{
      background:var(--zr-v3-green)!important;opacity:.42!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-subitem:hover{
      background:#fff7ef!important;color:var(--zr-v3-green)!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-subitem.is-active{
      background:#fff1e5!important;color:var(--zr-v3-green)!important;
      box-shadow:inset 3px 0 0 var(--zr-v3-orange)!important;
    }
    html.zr-admin-shell-mounted #zrAdminShellRail .zr-admin-shell-subitem.is-active:before{
      background:var(--zr-v3-orange)!important;opacity:1!important;
    }

    /* Same role = same color everywhere. */
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-primary,
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-print{
      background:var(--zr-v3-orange)!important;border-color:var(--zr-v3-orange)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 4px 10px rgba(252,84,4,.14)!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-primary:hover,
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-print:hover{
      background:var(--zr-v3-orange-dark)!important;border-color:var(--zr-v3-orange-dark)!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-current{
      background:var(--zr-v3-green)!important;border-color:var(--zr-v3-green)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-current:hover{
      background:var(--zr-v3-green-dark)!important;border-color:var(--zr-v3-green-dark)!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-date-nav{
      background:#fff!important;border:1.5px solid var(--zr-v3-green)!important;
      color:var(--zr-v3-green)!important;-webkit-text-fill-color:var(--zr-v3-green)!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-date-nav:hover{
      background:var(--zr-v3-green-soft)!important;border-color:var(--zr-v3-green)!important;
      color:var(--zr-v3-green-dark)!important;-webkit-text-fill-color:var(--zr-v3-green-dark)!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-export{
      background:#fff!important;border:1.5px solid var(--zr-v3-green)!important;
      color:var(--zr-v3-green)!important;-webkit-text-fill-color:var(--zr-v3-green)!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-export:hover{
      background:var(--zr-v3-green)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
    }

    /* Reservation activity: filter flow on row 1, supporting actions aligned on row 2. */
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar{
      grid-template-columns:repeat(15,minmax(0,1fr))!important;gap:10px 12px!important;align-items:end!important;
    }
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/4!important;grid-row:1!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:4/7!important;grid-row:1!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/10!important;grid-row:1!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:10/13!important;grid-row:1!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:13/16!important;grid-row:1!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:7/10!important;grid-row:2!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:10/13!important;grid-row:2!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:13/16!important;grid-row:2!important}
    html.zr-admin-shell-mounted #tab-activity #zr11ActivityToolbar button{min-height:42px!important;width:100%!important;margin:0!important}

    /* Organisation search is a separate information/search action, not another orange primary CTA. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{
      background:var(--zr-v3-blue)!important;border-color:var(--zr-v3-blue)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 4px 10px rgba(47,107,134,.14)!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn:hover{
      background:#24566d!important;border-color:#24566d!important;
    }

    @media(min-width:901px){
      html.zr-admin-shell-mounted #adminView>section:not(.hidden){margin-top:0!important}
      html.zr-admin-shell-mounted #tab-today{margin-top:0!important}
    }
  `;document.head.appendChild(s);
}
function exactText(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function allButtonsByText(text){return [...document.querySelectorAll('#adminView button')].filter(b=>b.id!=='zrAdminShellRefresh'&&exactText(b)===text)}
function commonAncestor(nodes,stop){
  if(!nodes.length)return null;
  let cur=nodes[0];
  while(cur&&cur!==stop){if(nodes.every(n=>cur.contains(n)))return cur;cur=cur.parentElement}
  return null;
}
function decorateBrand(){
  const title=document.querySelector('#zrAdminShellRail .zr-admin-shell-brand-title');
  const sub=document.querySelector('#zrAdminShellRail .zr-admin-shell-brand-sub');
  if(title){title.dataset.zrSafariBrand='1';title.innerHTML='<span class="zr-admin-brand-dongtan">동탄점</span>'}
  if(sub)sub.textContent='예약관리';
}
function decorateCalendar(){
  const cal=$('adminCalendar');if(!cal)return;
  const ym=String($('adminMonth')?.value||'');
  if(!/^\d{4}-\d{2}$/.test(ym))return;
  const [year,month]=ym.split('-').map(Number);
  const now=new Date();
  const todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  cal.querySelectorAll('.weekday').forEach((el,i)=>{
    el.classList.toggle('zr-cal-sun',i===0);
    el.classList.toggle('zr-cal-sat',i===6);
  });
  cal.querySelectorAll('.day').forEach(day=>{
    const text=String(day.querySelector(':scope > .num')?.textContent||day.textContent||'');
    const m=text.match(/(\d{1,2})일/);if(!m)return;
    const d=Number(m[1]);
    const dow=new Date(year,month-1,d,12,0,0).getDay();
    const key=`${ym}-${String(d).padStart(2,'0')}`;
    const whole=exactText(day);
    const hasBooking=/(^|\s)([1-9]\d*)팀\s*\/\s*([1-9]\d*)명/.test(whole)||/(확정|접수|보류|완료)\s*[1-9]\d*/.test(whole);
    const holiday=day.classList.contains('holiday')||day.dataset.holiday==='true'||/공휴일/.test(whole);
    day.classList.toggle('zr-cal-sun',dow===0);
    day.classList.toggle('zr-cal-sat',dow===6);
    day.classList.toggle('zr-cal-today',key===todayKey);
    day.classList.toggle('zr-cal-has-booking',hasBooking);
    day.classList.toggle('zr-cal-holiday',holiday);
  });
}
function decorateActionButtons(){
  const root=$('adminView');if(!root)return;
  const roleClasses=['zr-safari-role-primary','zr-safari-role-current','zr-safari-role-date-nav','zr-safari-role-export','zr-safari-role-print'];
  root.querySelectorAll('button').forEach(btn=>{
    if(btn.id==='zrAdminShellRefresh')return;
    const text=exactText(btn),onclick=String(btn.getAttribute('onclick')||'');
    const compact=text.replace(/\s+/g,'');
    roleClasses.forEach(c=>btn.classList.remove(c));
    const inCalendarDay=!!btn.closest('#adminCalendar .day');
    if(inCalendarDay&&text==='자세히'){
      btn.classList.remove('zr-safari-popup-trigger','zr-safari-payment-trigger');
      return;
    }
    const payment=text==='실제결제'||btn.classList.contains('zr-settle-open');
    const detail=text==='자세히'||text==='상세보기'||text==='상세'||/openAdminBookingDetail\s*\(/.test(onclick);
    const popupText=['문의 보기','답변 보기','답변하기','가이드맵','주차 안내','예약 상세','예약 상세보기'];
    const popup=detail||popupText.includes(text)||/openModal\s*\(/.test(onclick);
    btn.classList.toggle('zr-safari-payment-trigger',payment);
    if(!payment)btn.classList.toggle('zr-safari-popup-trigger',popup);

    const isDateCurrent=/^(오늘|이번달|이번달로이동)$/.test(compact);
    const isDateNav=/(?:이전|저번)(?:날|일|달|월)|다음(?:날|일|달|월)/.test(compact);
    const isExport=/^엑셀\s*(내려받기|다운로드)$/.test(text);
    const isPrint=/인쇄/.test(text);
    const isPrimary=['조회하기','단체명 검색'].includes(text);
    btn.classList.toggle('zr-safari-role-current',isDateCurrent);
    btn.classList.toggle('zr-safari-role-date-nav',isDateNav&&!isDateCurrent);
    btn.classList.toggle('zr-safari-role-export',isExport);
    btn.classList.toggle('zr-safari-role-print',isPrint);
    btn.classList.toggle('zr-safari-role-primary',isPrimary&&!popup&&!payment);
  });
}
function hideLegacyChrome(){
  const admin=$('adminView');if(!admin)return;
  const labels=['새로고침','고객 화면','로그아웃'];
  const actions=labels.flatMap(allButtonsByText);
  const title=[...admin.querySelectorAll('h1,h2,h3,strong,b')].find(el=>exactText(el)==='단체예약 관리자');
  let target=null;
  if(actions.length>=2){
    const nodes=title?[title,...actions]:actions;
    target=commonAncestor(nodes,admin);
    if(target===admin)target=null;
  }
  if(!target&&title){
    let cur=title.parentElement;
    for(let i=0;cur&&cur!==admin&&i<5;i++,cur=cur.parentElement){
      const texts=[...cur.querySelectorAll('button')].map(exactText);
      if(texts.some(x=>labels.includes(x))){target=cur;break}
    }
  }
  if(target)target.classList.add('zr-admin-legacy-chrome-hidden');
  else{
    title?.classList.add('zr-admin-legacy-chrome-hidden');
    actions.forEach(x=>x.classList.add('zr-admin-legacy-chrome-hidden'));
  }
  [...admin.querySelectorAll('button,span,div')].forEach(el=>{
    const t=exactText(el);if(/^↻?\s*오전\s*\d{1,2}:\d{2}\s*기준$/.test(t))el.classList.add('zr-admin-legacy-time-pill-hidden');
  });
}
function legacyRefresh(){
  const btn=allButtonsByText('새로고침')[0];
  if(btn){btn.click();return}
  location.reload();
}
function buildRefresh(){
  const header=$('zrAdminShellHeader');if(!header||$('zrAdminShellRefresh'))return false;
  const btn=document.createElement('button');btn.type='button';btn.id='zrAdminShellRefresh';btn.className='zr-admin-shell-refresh';btn.textContent='새로고침';btn.addEventListener('click',legacyRefresh);
  const edit=$('zrAdminShellHeaderEdit'),status=header.querySelector('.zr-admin-shell-status');
  header.insertBefore(btn,edit||status||null);return true;
}
function apply(){injectStyle();ensureSafariTheme();hideLegacyChrome();buildRefresh();decorateBrand();decorateActionButtons();decorateCalendar()}
function boot(){
  apply();let tries=0;const wait=setInterval(()=>{apply();if(($('zrAdminShellRefresh')&&$('adminView'))||++tries>120)clearInterval(wait)},100);
  const admin=$('adminView');if(admin&&!observer){observer=new MutationObserver(()=>{hideLegacyChrome();decorateBrand();decorateActionButtons();decorateCalendar()});observer.observe(admin,{subtree:true,childList:true})}
  document.addEventListener('change',e=>{if(e.target?.id==='adminMonth')setTimeout(decorateCalendar,0)},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();