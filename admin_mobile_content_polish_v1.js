(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1)return;
window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1=true;

const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:900px)').matches;

function injectStyle(){
  if($('zrAdminMobileContentPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileContentPolishV1Style';
  s.textContent=`
  @media(max-width:900px){
    html.zr-admin-shell-mounted body #adminView,
    html.zr-admin-shell-mounted body #adminView *{box-sizing:border-box}

    /* Date/month controls only: compact, contained, vertically centered on iPhone Safari. */
    html.zr-admin-shell-mounted body #adminView input[type="date"],
    html.zr-admin-shell-mounted body #adminView input[type="month"]{
      min-width:0!important;max-width:100%!important;
      height:44px!important;min-height:44px!important;max-height:44px!important;
      padding-top:0!important;padding-bottom:0!important;
      font-size:16px!important;line-height:44px!important;
      box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-date-and-time-value,
    html.zr-admin-shell-mounted body #adminView input[type="month"]::-webkit-date-and-time-value{
      display:flex!important;align-items:center!important;
      width:100%!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0!important;line-height:42px!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-calendar-picker-indicator,
    html.zr-admin-shell-mounted body #adminView input[type="month"]::-webkit-calendar-picker-indicator{
      margin:0!important;padding:4px!important
    }
    html.zr-admin-shell-mounted body #adminView :where(div,label):has(> input[type="date"]),
    html.zr-admin-shell-mounted body #adminView :where(div,label):has(> input[type="month"]){
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }

    /* Reservation status: use actual runtime elements, not assumed legacy classes. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      grid-template-areas:
        "start end"
        "basis status"
        "org org"
        "search today"
        "excel excel"!important;
      gap:10px!important;align-items:end!important;width:100%!important;min-width:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>*{
      min-width:0!important;max-width:100%!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-start{grid-area:start!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-end{grid-area:end!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #activityDateBasisWrap{grid-area:basis!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityStatusWrap{grid-area:status!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgModalBtn{grid-area:org!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-search{grid-area:search!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-today{grid-area:today!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-excel{grid-area:excel!important}

    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(input,select,button){
      width:100%!important;min-width:0!important;max-width:100%!important;
      height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-start,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-end,
    html.zr-admin-shell-mounted body #adminView #tab-activity #activityDateBasisWrap,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityStatusWrap{
      display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-start>label,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mobile-act-end>label,
    html.zr-admin-shell-mounted body #adminView #tab-activity #activityDateBasisWrap>span,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityStatusWrap>span{
      line-height:1.25!important;margin:0!important
    }

    /* Existing screens keep their own layout; only stop date/month controls protruding. */
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field input[type="date"],
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input[type="month"],
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input[type="date"]{
      width:100%!important;inline-size:100%!important;max-width:100%!important;max-inline-size:100%!important;
      margin-left:0!important;margin-right:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field,
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter>label{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }
  }
  `;
  document.head.appendChild(s);
}

function tagActivityToolbar(){
  if(!mobile())return false;
  const toolbar=$('zr11ActivityToolbar');
  if(!toolbar)return false;
  const start=$('activityStart'),end=$('activityEnd');
  const startWrap=start?.closest('div'),endWrap=end?.closest('div');
  if(startWrap&&startWrap.parentElement===toolbar)startWrap.classList.add('zr-mobile-act-start');
  if(endWrap&&endWrap.parentElement===toolbar)endWrap.classList.add('zr-mobile-act-end');
  [...toolbar.querySelectorAll('button')].forEach(btn=>{
    const t=String(btn.textContent||'').replace(/\s+/g,'').trim();
    if(t==='조회하기')btn.classList.add('zr-mobile-act-search');
    else if(t==='오늘')btn.classList.add('zr-mobile-act-today');
    else if(t.includes('엑셀'))btn.classList.add('zr-mobile-act-excel');
  });
  return true;
}

function normalizeDateControls(){
  if(!mobile())return;
  document.querySelectorAll('#adminView input[type="date"],#adminView input[type="month"]').forEach(el=>{
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('height','44px','important');
    el.style.setProperty('min-height','44px','important');
    el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding-top','0','important');
    el.style.setProperty('padding-bottom','0','important');
    el.style.setProperty('line-height','44px','important');
    el.style.setProperty('box-sizing','border-box','important');
  });
}

function apply(){injectStyle();tagActivityToolbar();normalizeDateControls()}
function boot(){
  apply();
  let tries=0;
  const timer=setInterval(()=>{
    apply();
    if((tagActivityToolbar()&&++tries>=4)||++tries>=24)clearInterval(timer);
  },180);
  setTimeout(()=>clearInterval(timer),5000);
  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('#zrAdminMobileBottomNav,#zrAdminMobileSubnav,#zrAdminMobileTopbar,#adminView .admin-tabs')){
      setTimeout(apply,60);setTimeout(apply,220);
    }
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,0),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();