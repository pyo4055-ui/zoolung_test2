(()=>{
'use strict';
if(window.__ZR_ADMIN_ACTIVITY_ORG_DETAIL_MODAL_FIX_V1)return;
window.__ZR_ADMIN_ACTIVITY_ORG_DETAIL_MODAL_FIX_V1=true;

function bookingIdFromButton(btn){
  const code=String(btn?.getAttribute?.('onclick')||'');
  const m=code.match(/openAdminBookingDetail\('([^']+)'\)/);
  return m?m[1]:'';
}

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#zrActivityOrgSearchModal button');
  if(!btn)return;
  const id=bookingIdFromButton(btn);
  if(!id)return;

  e.preventDefault();
  e.stopImmediatePropagation();
  document.getElementById('zrActivityOrgSearchModal')?.classList.add('hidden');

  requestAnimationFrame(()=>{
    if(typeof window.openAdminBookingDetail==='function')window.openAdminBookingDetail(id);
  });
},true);
})();
