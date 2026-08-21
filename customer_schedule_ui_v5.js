(()=>{
'use strict';
if(window.__ZR_CUSTOMER_SCHEDULE_UI_V5)return;
window.__ZR_CUSTOMER_SCHEDULE_UI_V5=true;

const START=600,MAX=1080,SLOT=15;
const $=id=>document.getElementById(id);
const mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const pct=(m,a)=>Math.max(0,Math.min(100,(m-a.start)/(a.end-a.start)*100));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function readBookings(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function bookingById(id){return readBookings().find(b=>String(b?.id||'')===String(id))||null}
function segmentTimes(el){
  const m=(el.getAttribute('title')||'').match(/(\d{2}:\d{2})~(\d{2}:\d{2})/);
  if(!m)return null;
  const start=mn(m[1]),end=mn(m[2]);
  return start!=null&&end!=null?{start,end,startText:m[1],endText:m[2]}:null;
}
function scheduleBounds(items){
  if(!items.length)return null;
  return {start:Math.min(...items.map(x=>x.start)),end:Math.max(...items.map(x=>x.end))};
}
function axisFor(b,bounds){
  const starts=[mn(b?.entryTime),bounds?.start].filter(Number.isFinite);
  const ends=[mn(b?.exitTime),bounds?.end].filter(Number.isFinite);
  let start=starts.length?Math.max(START,Math.min(...starts)):630;
  let end=ends.length?Math.min(MAX,Math.max(...ends)):Math.min(MAX,start+240);
  if(end<=start)end=Math.min(MAX,start+60);
  return {start,end};
}
function timeText(m){const h=Math.floor(m/60),v=m%60;return `${String(h).padStart(2,'0')}:${String(v).padStart(2,'0')}`}

function injectStyle(){
  if($('zrCustomerScheduleUiV5Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerScheduleUiV5Style';
  s.textContent=`
  .zr-customer-schedule .zr-customer-line{height:64px!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always{padding:4px 4px!important;line-height:1.02!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always small{display:block!important;margin-top:2px!important;font-size:8px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.35px!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always.compact{padding:2px 1px!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always.compact b{font-size:8px!important;line-height:1!important;letter-spacing:-.55px!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always.compact small{font-size:7px!important;line-height:.95!important;letter-spacing:-.55px!important}
  .zr-customer-schedule .zr-customer-seg.zr-time-always.compact small span{display:block!important}
  .zr-customer-schedule .zr-customer-time-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .zr-customer-schedule .zr-customer-time-pill{display:inline-flex;align-items:center;padding:5px 8px;border-radius:8px;background:#eef5f0;border:1px solid #d3e3d8;color:#315c46;font-size:11px;font-weight:800}
  .zr-customer-schedule .zr-customer-time-pill.mismatch{background:#fff5e5;border-color:#edcf9c;color:#8b5b10}
  .zr-customer-schedule .zr-customer-notice{margin-top:9px;padding:9px 10px;border-radius:9px;background:#fff8e8;border:1px solid #ecd59b;color:#6e5212;font-size:11px;font-weight:900;line-height:1.45}
  `;
  document.head.appendChild(s);
}

function patchCard(card){
  const btn=card.querySelector('[data-zr-zoom]');
  const id=btn?.dataset?.zrZoom;
  const b=id?bookingById(id):null;
  if(!b)return;

  const segEls=[...card.querySelectorAll('.zr-customer-line .zr-customer-seg')];
  const items=segEls.map(el=>({el,time:segmentTimes(el)})).filter(x=>x.time);
  const bounds=scheduleBounds(items.map(x=>x.time));
  const axis=axisFor(b,bounds);
  const span=Math.max(1,axis.end-axis.start);
  const grid=card.querySelector('.zr-customer-line .zr-customer-grid');
  if(grid){const size=`${SLOT/span*100}% 100%`;if(grid.style.backgroundSize!==size)grid.style.backgroundSize=size}

  items.forEach(({el,time})=>{
    const left=pct(time.start,axis),width=Math.max(1,pct(time.end,axis)-left);
    el.style.left=`${left}%`;el.style.width=`${width}%`;
    el.classList.add('zr-time-always');
    if(width<9)el.classList.add('compact');else el.classList.remove('compact');
    let small=el.querySelector('small');
    if(!small){small=document.createElement('small');el.appendChild(small)}
    const html=width<9?`<span>${esc(time.startText)}</span><span>${esc(time.endText)}</span>`:`${esc(time.startText)}~${esc(time.endText)}`;
    if(small.innerHTML!==html)small.innerHTML=html;
  });

  const help=card.querySelector('.zr-customer-schedule-top + .help');
  if(help){
    const rs=String(b.entryTime||b.customerSchedule?.entryTime||''),re=String(b.exitTime||b.customerSchedule?.exitTime||'');
    const scheduleStart=bounds?timeText(bounds.start):'',scheduleEnd=bounds?timeText(bounds.end):'';
    const mismatch=!!(rs&&re&&scheduleStart&&scheduleEnd&&(rs!==scheduleStart||re!==scheduleEnd));
    const html=`<div>관리자가 확정한 동물원 관람 및 체험 일정입니다.</div><div class="zr-customer-time-row"><span class="zr-customer-time-pill">예약시간 ${esc(rs)}~${esc(re)}</span>${mismatch?`<span class="zr-customer-time-pill mismatch">확정 일정 ${esc(scheduleStart)}~${esc(scheduleEnd)}</span>`:''}</div>`;
    if(help.innerHTML!==html)help.innerHTML=html;
  }

  let notice=card.querySelector('.zr-customer-notice');
  const legend=card.querySelector('.zr-customer-legend');
  if(legend){
    legend.className='zr-customer-notice';
    notice=legend;
  }
  if(!notice){
    notice=document.createElement('div');notice.className='zr-customer-notice';
    card.querySelector('.zr-customer-line')?.insertAdjacentElement('afterend',notice);
  }
  const noticeText='※ 오전 10:30 이전에 도착하셔도 동물 관람은 10:30부터 가능합니다.';
  if(notice&&notice.textContent!==noticeText)notice.textContent=noticeText;
}

let pending=false;
function patch(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{
    pending=false;
    injectStyle();
    document.querySelectorAll('.zr-customer-schedule').forEach(patchCard);
  });
}
function boot(){
  injectStyle();
  patch();
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
  ['lookupBooking','checkExisting'].forEach(id=>{
    const el=$(id);if(!el)return;
    el.addEventListener('click',()=>{setTimeout(patch,0);setTimeout(patch,300);setTimeout(patch,800);setTimeout(patch,1500)});
  });
  const timer=setInterval(patch,300);
  setTimeout(()=>clearInterval(timer),15000);
  window.addEventListener('resize',patch);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
