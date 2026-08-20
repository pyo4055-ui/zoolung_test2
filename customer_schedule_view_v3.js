(()=>{
'use strict';
if(window.__ZR_CUSTOMER_SCHEDULE_V3)return;
window.__ZR_CUSTOMER_SCHEDULE_V3=true;

const $=id=>document.getElementById(id),START=600,MAX=1080,SLOT=15;
const LABEL={f4:'4F 베이직',f5:'5F 워터가든',meal:'식사',play:'놀이터'},SHORT={f4:'4F',f5:'5F',meal:'식',play:'놀'},CLS={f4:'zrsc-f4',f5:'zrsc-f5',meal:'zrsc-meal',play:'zrsc-play'};
const pad=n=>String(n).padStart(2,'0'),tm=m=>pad(Math.floor(m/60))+':'+pad(m%60),mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),tel=s=>String(s||'').replace(/\D/g,'');
function read(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function axis(b,segs){let end=mn(b.exitTime)||900;for(const s of segs){const z=mn(s.end);if(z!=null)end=Math.max(end,z)}end=Math.max(900,Math.ceil(end/60)*60);return {start:START,end:Math.min(MAX,end)}}
function pct(t,a){const m=mn(t);return m==null?0:Math.max(0,Math.min(100,(m-a.start)/(a.end-a.start)*100))}
function segHtml(s,a,zoom=false){if(!s?.start||!s?.end)return'';const w=Math.max(1,pct(s.end,a)-pct(s.start,a)),label=w<(zoom?7:9)?(SHORT[s.type]||s.type):(LABEL[s.type]||s.type);return `<div class="zr-customer-seg ${CLS[s.type]||''} ${w<(zoom?7:9)?'compact':''}" style="left:${pct(s.start,a)}%;width:${w}%" title="${esc((LABEL[s.type]||s.type)+' '+s.start+'~'+s.end)}"><b>${esc(label)}</b>${w>=(zoom?7:14)?`<small>${esc(s.start)}~${esc(s.end)}</small>`:''}</div>`}
function ruler(a){let h='';for(let m=a.start;m<=a.end;m+=30)h+=`<span style="left:${(m-a.start)/(a.end-a.start)*100}%">${tm(m)}</span>`;return h}

function style(){
  if($('zrCustomerScheduleStyleV3'))return;
  const s=document.createElement('style');s.id='zrCustomerScheduleStyleV3';s.textContent=`
  .zr-customer-schedule{margin-top:12px;border:1px solid #cfe3d6;background:#f8fcf9;border-radius:14px;padding:13px}
  .zr-customer-schedule h3{margin:0;font-size:15px}.zr-customer-schedule-top{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:5px}
  .zr-customer-zoom-btn{border:1px solid #c6decf;background:#e9f3ed;color:#2f6b4f;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800}
  .zr-customer-line{position:relative;height:56px;margin-top:9px;border:1px solid #dfe5df;border-radius:10px;background:#fff;overflow:hidden}
  .zr-customer-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.10) 1px,transparent 1px)}
  .zr-customer-seg{position:absolute;top:4px;bottom:4px;border-radius:7px;padding:4px 5px;box-sizing:border-box;overflow:hidden;font-size:10px;z-index:2;display:flex;flex-direction:column;justify-content:center}
  .zr-customer-seg.compact{padding:3px 2px;text-align:center;align-items:center}.zr-customer-seg.compact b{font-size:9px;letter-spacing:-.4px}
  .zr-customer-seg b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.zr-customer-seg small{font-size:9px;white-space:nowrap}
  .zrsc-f4{background:#f8d7bf}.zrsc-f5{background:#cfe7f7}.zrsc-meal{background:#fff0a8}.zrsc-play{background:#d8efc9}
  .zr-customer-legend{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.zr-customer-legend span{font-size:10px;padding:4px 6px;border-radius:7px}
  .zr-customer-zoom{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:14px}
  .zr-customer-zoom.hidden{display:none!important}.zr-customer-zoom-card{width:min(980px,100%);max-height:92vh;background:#fff;border-radius:16px;padding:14px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}
  .zr-customer-zoom-head{display:flex;gap:10px;align-items:center;justify-content:space-between}.zr-customer-zoom-head h3{margin:0;font-size:17px}.zr-customer-zoom-close{border:0;background:#eef1ee;border-radius:9px;padding:8px 11px;font-weight:800}
  .zr-customer-scroll{overflow-x:auto;padding:8px 0 12px;-webkit-overflow-scrolling:touch}.zr-customer-wide{min-width:900px;position:relative}
  .zr-customer-wide .zr-customer-line{height:86px;margin-top:22px}.zr-customer-wide .zr-customer-seg{font-size:12px;padding:6px 8px}.zr-customer-wide .zr-customer-seg.compact b{font-size:11px}.zr-customer-wide .zr-customer-seg small{font-size:10px}
  .zr-customer-ruler{position:relative;height:22px;margin-top:8px}.zr-customer-ruler span{position:absolute;transform:translateX(-50%);font-size:10px;color:#6d756f;white-space:nowrap}
  `;document.head.appendChild(s)
}
function ensureModal(){
  if($('zrCustomerScheduleZoom'))return;
  const m=document.createElement('div');m.id='zrCustomerScheduleZoom';m.className='zr-customer-zoom hidden';m.innerHTML='<div class="zr-customer-zoom-card"><div class="zr-customer-zoom-head"><h3 id="zrCustomerZoomTitle">확정 스케줄</h3><button class="zr-customer-zoom-close" id="zrCustomerZoomClose">닫기</button></div><div class="help" style="margin-top:5px">좌우로 움직여 시간표를 크게 확인할 수 있습니다.</div><div class="zr-customer-scroll"><div class="zr-customer-wide"><div class="zr-customer-ruler" id="zrCustomerZoomRuler"></div><div class="zr-customer-line" id="zrCustomerZoomLine"></div></div></div></div>';
  document.body.appendChild(m);$('zrCustomerZoomClose').onclick=()=>m.classList.add('hidden');m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')});
}
function matching(){
  const manager=$('startManager')?.value.trim()||'',contact=tel($('startContact')?.value||'');if(!manager||!contact)return[];
  return read().filter(b=>b&&!b.__availabilityOnly&&b.status==='confirmed'&&b.schedulePublished&&b.customerSchedule&&String(b.managerName||'').trim()===manager&&tel(b.contact)===contact);
}
function openZoom(id){
  const b=matching().find(x=>String(x.id)===String(id));if(!b)return;
  const cs=b.customerSchedule||{},segs=Array.isArray(cs.segments)?[...cs.segments].sort((a,z)=>String(a.start).localeCompare(String(z.start))):[],a=axis(b,segs),grid=`${SLOT/(a.end-a.start)*100}% 100%`;
  $('zrCustomerZoomTitle').textContent=`${b.orgName||cs.org||'예약'} · 확정 스케줄`;$('zrCustomerZoomRuler').innerHTML=ruler(a);$('zrCustomerZoomLine').innerHTML=`<div class="zr-customer-grid" style="background-size:${grid}"></div>${segs.map(s=>segHtml(s,a,true)).join('')}`;$('zrCustomerScheduleZoom').classList.remove('hidden');
}
function render(){
  const list=$('existingBookingList');if(!list)return;let box=$('zrCustomerScheduleBox');if(!box){box=document.createElement('div');box.id='zrCustomerScheduleBox';list.insertAdjacentElement('afterend',box)}
  const found=matching();box.innerHTML=found.map(b=>{const cs=b.customerSchedule||{},segs=Array.isArray(cs.segments)?[...cs.segments].sort((a,z)=>String(a.start).localeCompare(String(z.start))):[],a=axis(b,segs),grid=`${SLOT/(a.end-a.start)*100}% 100%`;return `<div class="zr-customer-schedule"><div class="zr-customer-schedule-top"><h3>${esc(b.orgName||cs.org||'예약')} · 확정 스케줄</h3><button class="zr-customer-zoom-btn" data-zr-zoom="${esc(b.id)}">🔍 크게 보기</button></div><div class="help">관리자가 확정한 방문 스케줄입니다. 예약 ${esc(b.entryTime||cs.entryTime||'')}~${esc(b.exitTime||cs.exitTime||'')}</div><div class="zr-customer-line"><div class="zr-customer-grid" style="background-size:${grid}"></div>${segs.map(s=>segHtml(s,a,false)).join('')}</div><div class="zr-customer-legend"><span class="zrsc-f4">4F 베이직</span><span class="zrsc-f5">5F 워터가든</span><span class="zrsc-meal">식사</span><span class="zrsc-play">놀이터</span></div></div>`}).join('');box.querySelectorAll('[data-zr-zoom]').forEach(b=>b.onclick=()=>openZoom(b.dataset.zrZoom));
}
function hook(){
  style();ensureModal();['lookupBooking','checkExisting'].forEach(id=>{const e=$(id);if(e&&!e.dataset.zrCustomerScheduleV3){e.dataset.zrCustomerScheduleV3='1';e.addEventListener('click',()=>setTimeout(render,300))}});
  const list=$('existingBookingList');if(list&&!list.dataset.zrCustomerScheduleV3){list.dataset.zrCustomerScheduleV3='1';new MutationObserver(()=>setTimeout(render,0)).observe(list,{childList:true,subtree:true})}
}
function boot(){const t=setInterval(()=>{hook();if($('lookupBooking')&&$('existingBookingList'))clearInterval(t)},300);setTimeout(()=>clearInterval(t),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();