(()=>{
'use strict';
if(window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1)return;
window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1=true;

function gray(id){
  const btn=document.getElementById(id);
  if(btn)btn.className='btn-gray';
}
function renameSettingsTab(){
  document.querySelectorAll('#adminView .admin-tabs button').forEach(btn=>{
    if(btn.textContent.trim()==='설정')btn.textContent='예약설정';
  });
}
function loadCustomerInquiryVisit(){
  if(document.getElementById('zrCustomerInquiryVisitV1')||window.__ZR_CUSTOMER_INQUIRY_VISIT_V1)return;
  const s=document.createElement('script');
  s.id='zrCustomerInquiryVisitV1';
  s.async=false;
  s.src='./customer_inquiry_visit_v1.js?v=1';
  document.body.appendChild(s);
}
function loadAdminPreviewVisit(){
  if(document.getElementById('zrAdminPreviewVisitV1')||window.__ZR_ADMIN_PREVIEW_VISIT_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminPreviewVisitV1';
  s.async=false;
  s.src='./admin_preview_visit_v1.js?v=1';
  document.body.appendChild(s);
}
function loadAdminPreviewVisitQueryUi(){
  if(document.getElementById('zrAdminPreviewVisitQueryUiV1')||window.__ZR_ADMIN_PREVIEW_VISIT_QUERY_UI_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminPreviewVisitQueryUiV1';
  s.async=false;
  s.src='./admin_preview_visit_query_ui_v1.js?v=1';
  document.body.appendChild(s);
}
function loadAdminPreviewVisitNotify(){
  if(document.getElementById('zrAdminPreviewVisitNotifyV1')||window.__ZR_ADMIN_PREVIEW_VISIT_NOTIFY_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminPreviewVisitNotifyV1';
  s.async=false;
  s.src='./admin_preview_visit_notify_v1.js?v=1';
  document.body.appendChild(s);
}
function loadAdminInquiryReply(){
  if(document.getElementById('zrAdminInquiryReplyV1')||window.__ZR_ADMIN_INQUIRY_REPLY_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminInquiryReplyV1';
  s.async=false;
  s.src='./admin_inquiry_reply_v1.js?v=1';
  document.body.appendChild(s);
}
function loadAdminInquiryReplyLayout(){
  if(document.getElementById('zrAdminInquiryReplyLayoutV1')||window.__ZR_ADMIN_INQUIRY_REPLY_LAYOUT_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminInquiryReplyLayoutV1';
  s.async=false;
  s.src='./admin_inquiry_reply_layout_v1.js?v=1';
  document.body.appendChild(s);
}
function loadCalendarSummary(){
  if(document.getElementById('zrAdminCalendarStatusSummaryV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminCalendarStatusSummaryV1';
  s.async=false;
  s.src='./admin_calendar_status_summary_v1.js?v=3';
  document.body.appendChild(s);
}
function loadActivityOrgDetailFix(){
  if(document.getElementById('zrAdminActivityOrgDetailModalFixV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminActivityOrgDetailModalFixV1';
  s.async=false;
  s.src='./admin_activity_org_detail_modal_fix_v1.js?v=1';
  document.body.appendChild(s);
}
function loadMobileDateInputFix(){
  if(document.getElementById('zrAdminMobileDateInputFixV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminMobileDateInputFixV1';
  s.async=false;
  s.src='./admin_mobile_date_input_fix_v1.js?v=1';
  document.body.appendChild(s);
}
function loadScheduleCustomerNotify(){
  if(document.getElementById('zrAdminScheduleCustomerNotifyV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminScheduleCustomerNotifyV1';
  s.async=false;
  s.src='./admin_schedule_customer_notify_v1.js?v=1';
  document.body.appendChild(s);
}
function loadBookingHold(){
  if(document.getElementById('zrAdminBookingHoldV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminBookingHoldV1';
  s.async=false;
  s.src='./admin_booking_hold_v1.js?v=1';
  document.body.appendChild(s);
}
function loadBookingHoldQueryFix(){
  if(document.getElementById('zrAdminBookingHoldQueryFixV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminBookingHoldQueryFixV1';
  s.async=false;
  s.src='./admin_booking_hold_query_fix_v1.js?v=1';
  document.body.appendChild(s);
}
function loadCalendarStatusSelect(){
  if(document.getElementById('zrAdminCalendarStatusSelectV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminCalendarStatusSelectV1';
  s.async=false;
  s.src='./admin_calendar_status_select_v1.js?v=1';
  document.body.appendChild(s);
}
function loadSettlementWorkspace(){
  if(document.getElementById('zrAdminSettlementWorkspaceV1')||window.__ZR_ADMIN_SETTLEMENT_WORKSPACE_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminSettlementWorkspaceV1';
  s.async=false;
  s.src='./admin_settlement_workspace_v1.js?v=1';
  document.body.appendChild(s);
}
function loadSettlementUiStability(){
  if(document.getElementById('zrAdminSettlementUiStabilityV1')||window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminSettlementUiStabilityV1';
  s.async=false;
  s.src='./admin_settlement_ui_stability_v1.js?v=1';
  document.body.appendChild(s);
}
function loadCustomerGroupMinimum(){
  if(document.getElementById('zrCustomerGroupMinimumV1'))return;
  const s=document.createElement('script');
  s.id='zrCustomerGroupMinimumV1';
  s.async=false;
  s.src='./customer_group_minimum_v1.js?v=1';
  document.body.appendChild(s);
}
function loadUnsavedChangesGuard(){
  if(document.getElementById('zrAdminUnsavedChangesGuardV1')||window.__ZR_ADMIN_UNSAVED_CHANGES_GUARD_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminUnsavedChangesGuardV1';
  s.async=false;
  s.src='./admin_unsaved_changes_guard_v1.js?v=1';
  document.body.appendChild(s);
}
function loadExcelReliabilityFix(){
  if(document.getElementById('zrAdminExcelReliabilityFixV1')||window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1)return;
  const s=document.createElement('script');
  s.id='zrAdminExcelReliabilityFixV1';
  s.async=false;
  s.src='./admin_excel_reliability_fix_v1.js?v=3';
  document.body.appendChild(s);
}
function loadUiFixes(){
  renameSettingsTab();
  loadCustomerInquiryVisit();
  loadAdminPreviewVisit();
  loadAdminPreviewVisitQueryUi();
  loadAdminPreviewVisitNotify();
  loadAdminInquiryReply();
  loadAdminInquiryReplyLayout();
  loadCalendarSummary();
  loadActivityOrgDetailFix();
  loadMobileDateInputFix();
  loadScheduleCustomerNotify();
  loadBookingHold();
  loadBookingHoldQueryFix();
  loadCalendarStatusSelect();
  loadSettlementWorkspace();
  loadSettlementUiStability();
  loadCustomerGroupMinimum();
  loadUnsavedChangesGuard();
  loadExcelReliabilityFix();
}

document.addEventListener('click',e=>{
  const clicked=e.target?.closest?.('#adminView .admin-tabs button');
  if(!clicked)return;
  if(clicked.id!=='zrScheduleTabBtn')gray('zrScheduleTabBtn');
  if(clicked.id!=='zrGuideAdminTab')gray('zrGuideAdminTab');
  if(clicked.id!=='zrPreviewVisitTabBtn')gray('zrPreviewVisitTabBtn');
},true);

document.addEventListener('zr:admin-runtime-ready',loadCustomerInquiryVisit,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadAdminPreviewVisit,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadAdminPreviewVisitQueryUi,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadAdminPreviewVisitNotify,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadAdminInquiryReply,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadAdminInquiryReplyLayout,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadExcelReliabilityFix,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadSettlementWorkspace,{once:true});
document.addEventListener('zr:admin-runtime-ready',loadSettlementUiStability,{once:true});
if(window.__ZR_ADMIN_REFACTOR_READY){setTimeout(loadCustomerInquiryVisit,0);setTimeout(loadAdminPreviewVisit,0);setTimeout(loadAdminPreviewVisitQueryUi,0);setTimeout(loadAdminPreviewVisitNotify,0);setTimeout(loadAdminInquiryReply,0);setTimeout(loadAdminInquiryReplyLayout,0);setTimeout(loadExcelReliabilityFix,0);setTimeout(loadSettlementWorkspace,0);setTimeout(loadSettlementUiStability,0);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUiFixes,{once:true});
else loadUiFixes();
})();
