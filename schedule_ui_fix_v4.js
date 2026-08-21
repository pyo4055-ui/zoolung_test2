(()=>{
'use strict';
if(window.__ZR_SCHEDULE_UI_FIX_V4)return;
window.__ZR_SCHEDULE_UI_FIX_V4=true;

function injectStyle(){
  if(document.getElementById('zrScheduleUiFixV4Style'))return;
  const s=document.createElement('style');
  s.id='zrScheduleUiFixV4Style';
  s.textContent=`
  #tab-schedule .zrsc-seg.zr-force-time small{display:block!important;font-size:7.5px!important;line-height:1!important;margin-top:2px!important;white-space:nowrap!important}
  #tab-schedule .zrsc-seg.zr-force-time b{line-height:1.05!important}
  #tab-schedule .zrsc-card.zr-time-promoted .zrsc-org{margin-right:0!important}
  #tab-schedule .zrsc-reservation-time{margin-right:auto!important;padding:6px 10px!important;font-size:13px!important;font-weight:900!important;line-height:1.1!important;color:#245c43!important;background:#e8f4ec!important;border:1px solid #bcd8c7!important;box-shadow:0 1px 3px rgba(36,92,67,.08)!important;white-space:nowrap!important}
  .zr-customer-ruler span:first-child{left:0!important;transform:none!important;text-align:left!important}
  .zr-customer-ruler span:last-child{transform:translateX(-100%)!important;text-align:right!important}
  #zrScheduleMismatchModal .zr-mismatch-card{width:min(520px,100%)}
  #zrScheduleMismatchModal .zr-mismatch-copy{margin:9px 0 14px;color:#59645d;font-size:13px;line-height:1.6}
  #zrScheduleMismatchModal .zr-mismatch-times{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}
  #zrScheduleMismatchModal .zr-mismatch-timebox{border:1px solid #dfe5df;border-radius:12px;padding:12px;background:#f8faf8}
  #zrScheduleMismatchModal .zr-mismatch-timebox.warn{border-color:#efcf98;background:#fff8eb}
  #zrScheduleMismatchModal .zr-mismatch-timebox span{display:block;font-size:11px;color:#6d756f;margin-bottom:4px;font-weight:800}
  #zrScheduleMismatchModal .zr-mismatch-timebox b{display:block;font-size:18px;line-height:1.15}
  #zrScheduleMismatchModal .zr-mismatch-org{font-size:14px;font-weight:900;margin-top:5px}
  #zrScheduleMismatchModal .zr-mismatch-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}
  @media(max-width:520px){#zrScheduleMismatchModal .zr-mismatch-times{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function fixAdminScheduleTimes(){
  document.querySelectorAll('#tab-schedule .zrsc-seg').forEach(el=>{
    const title=el.getAttribute('title')||'';
    const m=title.match(/(\d{2}:\d{2})~(\d{2}:\d{2})/);
    if(!m)return;
    const width=el.getBoundingClientRect().width;
    if(width<60){
      el.classList.remove('zr-force-time');
      const old=el.querySelector('small[data-zr-force-time="1"]');
      if(old)old.remove();
      return;
    }
    let small=el.querySelector('small');
    if(!small){
      small=document.createElement('small');
      small.dataset.zrForceTime='1';
      el.appendChild(small);
    }
    const text=`${m[1]}~${m[2]}`;
    if(small.textContent!==text)small.textContent=text;
    el.classList.add('zr-force-time');
  });
}

function promoteReservationTimes(){
  document.querySelectorAll('#tab-schedule .zrsc-card').forEach(card=>{
    const head=card.querySelector('.zrsc-head');
    const org=head?.querySelector('.zrsc-org');
    if(!head||!org)return;
    const time=[...head.querySelectorAll('.zrsc-tag')].find(tag=>/^예약\s+\d{1,2}:\d{2}\s*~\s*\d{1,2}:\d{2}$/.test((tag.textContent||'').trim()));
    if(!time)return;
    time.classList.add('zrsc-reservation-time');
    card.classList.add('zr-time-promoted');
    if(org.nextElementSibling!==time)org.insertAdjacentElement('afterend',time);
  });
}

function fixedRowsSnapshot(){
  return JSON.stringify([...document.querySelectorAll('#zr14FixedRows [data-fixed]')].map(row=>({
    id:row.dataset.fixed||'',
    name:row.querySelector('input[type="text"]')?.value||'',
    color:row.querySelector('input[type="color"]')?.value||''
  })));
}

function installCustomContentSaveFix(){
  if(window.__ZR_CUSTOM_CONTENT_SAVE_FIX_V4)return;
  window.__ZR_CUSTOM_CONTENT_SAVE_FIX_V4=true;
  let fixedBaseline='';

  // The v14 content button opens/renders the modal at target phase. Capture the
  // fixed global catalog afterwards so custom-only edits can be distinguished.
  document.addEventListener('click',e=>{
    const open=e.target?.closest?.('#tab-schedule [data-content]');
    if(!open)return;
    setTimeout(()=>{fixedBaseline=fixedRowsSnapshot()},0);
  });

  // v14 always writes the global fixed catalog, even when only per-group custom
  // content changed. For custom-only edits, use v14's existing early-return path
  // after it has updated draftCustom/rendered the card, preventing the redundant
  // catalog write that can emit a false DB-save failure toast.
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#zr14SaveSettings');
    if(!btn||!fixedBaseline)return;
    const current=fixedRowsSnapshot();
    if(current!==fixedBaseline)return;

    const bridge=window.zrReservationFirebase;
    if(!bridge||typeof bridge.isStaff!=='function')return;
    const originalIsStaff=bridge.isStaff;
    const originalToast=window.toast;
    bridge.isStaff=()=>false;
    if(typeof originalToast==='function'){
      window.toast=function(msg){
        if(String(msg||'').includes('컨텐츠 설정은 화면에 적용했습니다. DB 저장은 관리자 DB 로그인 후 가능합니다.'))return;
        return originalToast.apply(this,arguments);
      };
    }

    setTimeout(()=>{
      bridge.isStaff=originalIsStaff;
      if(typeof originalToast==='function')window.toast=originalToast;
      document.getElementById('zr14ContentModal')?.classList.add('hidden');
      fixedBaseline='';
      try{originalToast?.('추가 컨텐츠 설정을 적용했습니다. 시간 지정 후 스케줄 반영을 눌러 저장해주세요.')}catch{}
    },0);
  },true);
}

function ensureMismatchModal(){
  if(document.getElementById('zrScheduleMismatchModal'))return;
  const modal=document.createElement('div');
  modal.id='zrScheduleMismatchModal';
  modal.className='zr14-modal hidden';
  modal.innerHTML=`<div class="zr14-modal-card zr-mismatch-card">
    <div class="zr14-title"><h2>예약시간과 스케줄 시간이 다릅니다</h2></div>
    <div class="zr-mismatch-org" id="zrMismatchOrg"></div>
    <div class="zr-mismatch-times">
      <div class="zr-mismatch-timebox"><span>예약시간</span><b id="zrMismatchReserved">--:-- ~ --:--</b></div>
      <div class="zr-mismatch-timebox warn"><span>편성 스케줄</span><b id="zrMismatchScheduled">--:-- ~ --:--</b></div>
    </div>
    <div class="zr-mismatch-copy">고객에게 노출할 스케줄의 시작·종료 시간이 예약시간과 다릅니다. 현재 편성한 시간대로 진행할지, 스케줄을 다시 수정할지 선택해주세요.</div>
    <div class="zr-mismatch-actions"><button type="button" class="btn-gray" id="zrMismatchEdit">스케줄 수정</button><button type="button" class="btn-primary" id="zrMismatchProceed">이 시간대로 확정</button></div>
  </div>`;
  document.body.appendChild(modal);
}

function publishMismatch(btn){
  const id=String(btn?.dataset?.publish||'');
  if(!id)return null;
  const api=window.zrScheduleAdminV14||window.zrScheduleAdminV3;
  if(!api?.getRows||!api?.segmentsForRow)return null;
  let row=null,segs=[];
  try{
    row=(api.getRows()||[]).find(x=>String(x?.b?.id||'')===id)||null;
    if(!row?.b||row.b.schedulePublished)return null;
    segs=api.segmentsForRow(row)||[];
  }catch{return null}
  const complete=segs.filter(s=>/^\d{2}:\d{2}$/.test(String(s?.start||''))&&/^\d{2}:\d{2}$/.test(String(s?.end||'')));
  if(!complete.length)return null;
  const starts=complete.map(s=>String(s.start)).sort();
  const ends=complete.map(s=>String(s.end)).sort();
  const scheduleStart=starts[0],scheduleEnd=ends[ends.length-1];
  const reservedStart=String(row.b.entryTime||''),reservedEnd=String(row.b.exitTime||'');
  if(!reservedStart||!reservedEnd)return null;
  if(scheduleStart===reservedStart&&scheduleEnd===reservedEnd)return null;
  return {id,org:String(row.b.orgName||''),reservedStart,reservedEnd,scheduleStart,scheduleEnd};
}

function installPublishMismatchGuard(){
  if(window.__ZR_PUBLISH_MISMATCH_GUARD_V4)return;
  window.__ZR_PUBLISH_MISMATCH_GUARD_V4=true;
  ensureMismatchModal();
  let pendingBtn=null;

  const close=()=>{
    document.getElementById('zrScheduleMismatchModal')?.classList.add('hidden');
  };

  document.getElementById('zrMismatchEdit').onclick=()=>{
    const card=pendingBtn?.closest?.('.zrsc-card');
    close();
    setTimeout(()=>card?.scrollIntoView?.({behavior:'smooth',block:'center'}),30);
    pendingBtn=null;
  };

  document.getElementById('zrMismatchProceed').onclick=()=>{
    const btn=pendingBtn;
    pendingBtn=null;
    close();
    if(!btn)return;
    btn.dataset.zrMismatchApproved='1';
    btn.click();
  };

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#tab-schedule [data-publish]');
    if(!btn)return;
    if(btn.dataset.zrMismatchApproved==='1'){
      delete btn.dataset.zrMismatchApproved;
      return;
    }
    const mismatch=publishMismatch(btn);
    if(!mismatch)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    pendingBtn=btn;
    document.getElementById('zrMismatchOrg').textContent=mismatch.org;
    document.getElementById('zrMismatchReserved').textContent=`${mismatch.reservedStart} ~ ${mismatch.reservedEnd}`;
    document.getElementById('zrMismatchScheduled').textContent=`${mismatch.scheduleStart} ~ ${mismatch.scheduleEnd}`;
    document.getElementById('zrScheduleMismatchModal').classList.remove('hidden');
  },true);
}

let pending=false;
function scheduleFix(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{
    pending=false;
    injectStyle();
    fixAdminScheduleTimes();
    promoteReservationTimes();
  });
}

function boot(){
  injectStyle();
  installCustomContentSaveFix();
  installPublishMismatchGuard();
  scheduleFix();
  const root=document.getElementById('adminView')||document.body;
  new MutationObserver(scheduleFix).observe(root,{childList:true,subtree:true});
  window.addEventListener('resize',scheduleFix);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
