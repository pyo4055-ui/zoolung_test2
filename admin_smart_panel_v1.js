(()=>{
'use strict';
if(window.__ZR_ADMIN_SMART_PANEL_V1)return;
window.__ZR_ADMIN_SMART_PANEL_V1=true;

const INQUIRY_KEY='zr_inquiries';
const REPLY_MARKER='\n\n[관리자 답변]\n';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
let panel=null,handle=null,timer=null,observer=null;

function today(){
  const d=new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function allBookings(){
  try{
    if(typeof window.bookings==='function')return window.bookings();
    const v=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(v)?v:[];
  }catch{return []}
}
function inquiryList(){
  try{
    const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');
    return Array.isArray(v)?v:[];
  }catch{return []}
}
function contentOf(item){
  for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return String(item?.[k]??'');
  return '';
}
function isPreview(text){return /^\[(사전답사 문의|사전답사 확정)\]/.test(String(text||''))}
function hasReply(text){return String(text||'').lastIndexOf(REPLY_MARKER)>=0}
function counts(){
  const date=today();
  const bookings=allBookings().filter(b=>b&&!b.__availabilityOnly&&String(b.status||'')==='confirmed'&&String(b.date||'')===date);
  const inquiries=inquiryList();
  const pendingInquiry=inquiries.filter(x=>{const t=contentOf(x);return !isPreview(t)&&!hasReply(t)}).length;
  const pendingPreview=inquiries.filter(x=>/^\[사전답사 문의\]/.test(contentOf(x))).length;
  const urgentText=String($('zrWarningUrgent')?.textContent||'');
  const urgentParsed=parseInt(urgentText.replace(/[^0-9]/g,''),10);
  const urgent=Number.isFinite(urgentParsed)?urgentParsed:0;
  return {today:bookings.length,urgent,pendingInquiry,pendingPreview};
}
function injectStyle(){
  if($('zrAdminSmartPanelStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrAdminSmartPanelStyleV1';
  style.textContent=`
    :root{--zr-admin-smart-width:286px}
    .zr-admin-smart-panel,.zr-admin-smart-handle{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif}
    .zr-admin-smart-panel{position:fixed;top:calc(var(--zr-admin-header-height) + 14px);right:14px;bottom:14px;z-index:58;width:var(--zr-admin-smart-width);box-sizing:border-box;background:rgba(255,255,255,.97);border:1px solid var(--zr-brand-line);border-radius:16px;box-shadow:0 12px 34px rgba(28,43,34,.11);display:flex;flex-direction:column;overflow:hidden;transform:translateX(calc(100% + 20px));opacity:0;pointer-events:none;transition:transform .2s ease,opacity .18s ease}
    html.zr-admin-smart-open .zr-admin-smart-panel{transform:translateX(0);opacity:1;pointer-events:auto}
    .zr-admin-smart-head{display:flex;align-items:flex-start;gap:10px;padding:16px 15px 13px;border-bottom:1px solid #edf0ed}
    .zr-admin-smart-copy{min-width:0;flex:1}.zr-admin-smart-title{font-size:16px;font-weight:950;color:var(--zr-brand-ink);line-height:1.2}.zr-admin-smart-sub{font-size:10px;color:var(--zr-brand-muted);margin-top:4px;line-height:1.45}
    .zr-admin-smart-close{width:30px;height:30px;flex:none;border:1px solid #dfe5df!important;border-radius:9px!important;background:#fff!important;color:#59665e!important;font-size:18px!important;font-weight:900!important;line-height:1!important;padding:0!important;box-shadow:none!important;display:grid!important;place-items:center!important}
    .zr-admin-smart-close:hover{background:#f3f6f3!important}
    .zr-admin-smart-body{padding:12px;display:grid;gap:8px;overflow:auto;scrollbar-width:thin}
    .zr-admin-smart-card{--zr-smart-color:var(--zr-operation);--zr-smart-soft:var(--zr-operation-soft);width:100%;min-height:76px;border:1px solid #e1e6e2!important;border-radius:13px!important;background:#fff!important;padding:11px 12px!important;box-shadow:none!important;text-align:left!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px!important;align-items:center!important;color:var(--zr-brand-ink)!important}
    .zr-admin-smart-card:hover{background:var(--zr-smart-soft)!important;border-color:color-mix(in srgb,var(--zr-smart-color) 28%,#e1e6e2)!important;transform:translateY(-1px)}
    .zr-admin-smart-card[data-kind="warning"]{--zr-smart-color:var(--zr-action-danger);--zr-smart-soft:#fff0f0}
    .zr-admin-smart-card[data-kind="inquiry"]{--zr-smart-color:var(--zr-customer);--zr-smart-soft:var(--zr-customer-soft)}
    .zr-admin-smart-card[data-kind="preview"]{--zr-smart-color:#765f8b;--zr-smart-soft:#f2eef6}
    .zr-admin-smart-label{font-size:12px;font-weight:900;color:#5b675f;line-height:1.2}.zr-admin-smart-value{grid-column:2;grid-row:1/3;min-width:48px;text-align:right;font-size:24px;font-weight:950;color:var(--zr-smart-color);line-height:1}.zr-admin-smart-help{font-size:10px;color:#89928c;line-height:1.35}.zr-admin-smart-value[data-alert="1"]{color:var(--zr-action-danger)}
    .zr-admin-smart-foot{margin-top:auto;padding:10px 14px 12px;border-top:1px solid #edf0ed;font-size:10px;color:#8a938d;display:flex;justify-content:space-between;gap:8px}
    .zr-admin-smart-handle{position:fixed;right:0;top:132px;z-index:59;border:1px solid #dce4de!important;border-right:0!important;border-radius:12px 0 0 12px!important;background:#fff!important;color:var(--zr-operation)!important;box-shadow:0 7px 22px rgba(28,43,34,.11)!important;padding:10px 8px!important;font-size:11px!important;font-weight:900!important;line-height:1.25!important;writing-mode:vertical-rl;letter-spacing:.02em}
    html.zr-admin-smart-open .zr-admin-smart-handle{display:none!important}
    @media(min-width:1201px){html.zr-admin-smart-open.zr-admin-shell-mounted #adminView{padding-right:calc(var(--zr-admin-smart-width) + 32px)!important;transition:padding-left .18s ease,padding-right .2s ease}}
    @media(min-width:901px) and (max-width:1200px){.zr-admin-smart-panel{box-shadow:0 16px 44px rgba(28,43,34,.19)}}
    @media(max-width:900px){.zr-admin-smart-panel,.zr-admin-smart-handle{display:none!important}}
    @media(prefers-reduced-motion:reduce){.zr-admin-smart-panel,html.zr-admin-smart-open.zr-admin-shell-mounted #adminView{transition:none!important}.zr-admin-smart-card:hover{transform:none}}
  `;
  document.head.appendChild(style);
}
function navButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function go(id){
  const button=navButton(id);
  if(button){button.click();return true}
  return false;
}
function setOpen(open){
  document.documentElement.classList.toggle('zr-admin-smart-open',!!open);
  panel?.setAttribute('aria-hidden',open?'false':'true');
  handle?.setAttribute('aria-expanded',open?'true':'false');
}
function render(){
  if(!panel)return;
  const c=counts();
  const map={
    today:['zrSmartToday',c.today],
    urgent:['zrSmartUrgent',c.urgent],
    inquiry:['zrSmartInquiry',c.pendingInquiry],
    preview:['zrSmartPreview',c.pendingPreview]
  };
  for(const [key,[id,value]] of Object.entries(map)){
    const el=$(id);if(!el)continue;el.textContent=String(value);el.dataset.alert=key!=='today'&&value>0?'1':'0';
  }
  const now=new Date();
  const time=$('zrSmartUpdated');if(time)time.textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function build(){
  if($('zrAdminSmartPanelV1')){panel=$('zrAdminSmartPanelV1');handle=$('zrAdminSmartHandleV1');return true}
  if(!$('zrAdminShellRail')||!$('adminView'))return false;
  injectStyle();
  panel=document.createElement('aside');
  panel.id='zrAdminSmartPanelV1';panel.className='zr-admin-smart-panel';panel.setAttribute('aria-label','운영 요약');panel.setAttribute('aria-hidden','false');
  panel.innerHTML=`<div class="zr-admin-smart-head"><div class="zr-admin-smart-copy"><div class="zr-admin-smart-title">운영 요약</div><div class="zr-admin-smart-sub">지금 확인할 항목을 빠르게 모아봅니다.</div></div><button type="button" class="zr-admin-smart-close" id="zrAdminSmartClose" aria-label="운영 요약 접기">›</button></div><div class="zr-admin-smart-body"><button type="button" class="zr-admin-smart-card" data-smart-go="today" data-kind="today"><span class="zr-admin-smart-label">오늘 예약</span><span class="zr-admin-smart-help">오늘 확정된 단체</span><strong class="zr-admin-smart-value" id="zrSmartToday">0</strong></button><button type="button" class="zr-admin-smart-card" data-smart-go="warning" data-kind="warning"><span class="zr-admin-smart-label">긴급 경고</span><span class="zr-admin-smart-help">즉시 확인이 필요한 항목</span><strong class="zr-admin-smart-value" id="zrSmartUrgent">0</strong></button><button type="button" class="zr-admin-smart-card" data-smart-go="inquiries" data-kind="inquiry"><span class="zr-admin-smart-label">미답변 1:1 문의</span><span class="zr-admin-smart-help">아직 답변하지 않은 문의</span><strong class="zr-admin-smart-value" id="zrSmartInquiry">0</strong></button><button type="button" class="zr-admin-smart-card" data-smart-go="previewVisit" data-kind="preview"><span class="zr-admin-smart-label">사전답사 요청</span><span class="zr-admin-smart-help">아직 확정되지 않은 요청</span><strong class="zr-admin-smart-value" id="zrSmartPreview">0</strong></button></div><div class="zr-admin-smart-foot"><span>자동 갱신</span><span id="zrSmartUpdated">--:--:--</span></div>`;
  document.body.appendChild(panel);
  handle=document.createElement('button');handle.type='button';handle.id='zrAdminSmartHandleV1';handle.className='zr-admin-smart-handle';handle.textContent='운영 요약';handle.setAttribute('aria-expanded','true');handle.setAttribute('aria-controls','zrAdminSmartPanelV1');
  document.body.appendChild(handle);
  $('zrAdminSmartClose').addEventListener('click',()=>setOpen(false));
  handle.addEventListener('click',()=>setOpen(true));
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-smart-go]');if(b)go(b.dataset.smartGo||'')});
  document.documentElement.classList.add('zr-admin-smart-open');
  render();
  return true;
}
function observe(){
  if(observer)return;
  observer=new MutationObserver(render);
  const urgent=$('zrWarningUrgent');if(urgent)observer.observe(urgent,{subtree:true,childList:true,characterData:true});
  document.addEventListener('zr:inquiry-replies-changed',render);
  document.addEventListener('zr:preview-visits-changed',render);
  window.addEventListener('storage',e=>{if([INQUIRY_KEY,'zr_bookings'].includes(e.key||''))render()});
}
function ensureTimer(){if(!timer)timer=setInterval(render,3000)}
function boot(){
  ensureTimer();
  if(!build()){
    let tries=0;const wait=setInterval(()=>{if(build()||++tries>120){clearInterval(wait);if(panel)observe()}},100);return;
  }
  observe();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
ensureTimer();
})();
