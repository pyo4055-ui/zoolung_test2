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
  scheduleFix();
  const root=document.getElementById('adminView')||document.body;
  new MutationObserver(scheduleFix).observe(root,{childList:true,subtree:true});
  window.addEventListener('resize',scheduleFix);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
