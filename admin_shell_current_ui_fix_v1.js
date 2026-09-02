(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1)return;
window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1=true;
const $=id=>document.getElementById(id);
let observer=null;

function ensureSafariTheme(){
  if(!$('zrAdminSafariThemeV1')){
    const link=document.createElement('link');
    link.id='zrAdminSafariThemeV1';link.rel='stylesheet';link.href='./admin_safari_theme_v1.css?v=1';
    document.head.appendChild(link);
  }
  if(!$('zrAdminSafariThemeV2')){
    const link=document.createElement('link');
    link.id='zrAdminSafariThemeV2';link.rel='stylesheet';link.href='./admin_safari_theme_v2.css?v=1';
    document.head.appendChild(link);
  }
  if(!$('zrAdminSafariThemeV3')){
    const link=document.createElement('link');
    link.id='zrAdminSafariThemeV3';link.rel='stylesheet';link.href='./admin_safari_theme_v3.css?v=1';
    document.head.appendChild(link);
  }
}
function injectStyle(){
  if($('zrAdminShellCurrentUiFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminShellCurrentUiFixV1Style';s.textContent=`
    .zr-admin-legacy-chrome-hidden,.zr-admin-legacy-time-pill-hidden{display:none!important}
    .zr-admin-shell-refresh{height:40px;min-width:78px;border:1px solid #e2dad2!important;border-radius:10px!important;background:#fff!important;color:#57514b!important;box-shadow:none!important;padding:0 12px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap}
    .zr-admin-shell-refresh:hover{background:#f7f3ee!important}
    .zr-admin-smart-summary-card{border:1px solid #e8dfd7!important;border-radius:12px!important;background:#faf7f3!important;padding:11px!important}
    .zr-admin-smart-summary-card:first-child{background:#f5f8f5!important;border-color:#dfe8e1!important}
    .zr-admin-smart-type-list{margin-top:9px!important;padding-top:8px!important;border-top:1px dashed #ddd6cf!important}
    .zr-admin-smart-type-row{font-size:11.5px!important;color:#716a64!important}.zr-admin-smart-type-row b{font-size:11.5px!important;color:#413c37!important}
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
  if(sub){sub.textContent='예약관리'}
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
  root.querySelectorAll('button').forEach(btn=>{
    if(btn.id==='zrAdminShellRefresh')return;
    const text=exactText(btn),onclick=String(btn.getAttribute('onclick')||'');
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
