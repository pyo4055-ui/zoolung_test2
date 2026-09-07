(()=>{
'use strict';
if(window.__ZR_ADMIN_BOOKING_CACHE_BOOT_GUARD_V1)return;
window.__ZR_ADMIN_BOOKING_CACHE_BOOT_GUARD_V1=true;

/* Admin reservations are shared Firestore data. Do not let a stale browser-local
   zr_bookings snapshot become migration input when the reservation bridge boots.
   The bridge's staff listener repopulates this cache from the shared collection. */
try{
  const raw=localStorage.getItem('zr_bookings');
  let count=0;
  try{const rows=JSON.parse(raw||'[]');count=Array.isArray(rows)?rows.filter(x=>x&&!x.__availabilityOnly).length:0}catch{}
  window.__ZR_ADMIN_BOOKING_CACHE_PREBOOT_COUNT=count;
  localStorage.setItem('zr_bookings','[]');
}catch(e){
  console.warn('admin booking cache boot guard',e);
}
})();
