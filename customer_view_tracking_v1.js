(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VIEW_TRACKING_V1)return;
window.__ZR_CUSTOMER_VIEW_TRACKING_V1=true;

// Temporarily disabled while customer popup behavior is re-verified on mobile.
// Today remains read-only and will show customer view states as unconfirmed.
// No event listeners, observers, storage writes, or Firestore writes are installed here.
window.zrCustomerViewTrackingV1={disabled:true,reason:'mobile-popup-regression-check'};
})();
