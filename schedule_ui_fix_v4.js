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
  .zr-customer-ruler span:first-child{left:0!important;transform:none!important;text-align:left!important}
  .zr-customer-ruler span:last-child{transform:translateX(-100%)!important;text-align:right!important}
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

let pending=false;
function scheduleFix(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{
    pending=false;
    injectStyle();
    fixAdminScheduleTimes();
  });
}

function boot(){
  injectStyle();
  installCustomContentSaveFix();
  scheduleFix();
  const root=document.getElementById('adminView')||document.body;
  new MutationObserver(scheduleFix).observe(root,{childList:true,subtree:true});
  window.addEventListener('resize',scheduleFix);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
