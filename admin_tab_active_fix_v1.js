(()=>{
'use strict';
if(window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1)return;
window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1=true;

function gray(id){
  const btn=document.getElementById(id);
  if(btn)btn.className='btn-gray';
}
function loadCalendarSummary(){
  if(document.getElementById('zrAdminCalendarStatusSummaryV1'))return;
  const s=document.createElement('script');
  s.id='zrAdminCalendarStatusSummaryV1';
  s.async=false;
  s.src='./admin_calendar_status_summary_v1.js?v=2';
  document.body.appendChild(s);
}
function loadTodayGroupSummary(){
  if(document.getElementById('zrAdminTodayGroupSummaryV1Script'))return;
  const s=document.createElement('script');
  s.id='zrAdminTodayGroupSummaryV1Script';
  s.async=false;
  s.src='./admin_today_group_summary_v1.js?v=1';
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
function loadUiFixes(){
  loadCalendarSummary();
  loadTodayGroupSummary();
  loadActivityOrgDetailFix();
  loadMobileDateInputFix();
}

document.addEventListener('click',e=>{
  const clicked=e.target?.closest?.('#adminView .admin-tabs button');
  if(!clicked)return;
  if(clicked.id!=='zrScheduleTabBtn')gray('zrScheduleTabBtn');
  if(clicked.id!=='zrGuideAdminTab')gray('zrGuideAdminTab');
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUiFixes,{once:true});
else loadUiFixes();
})();
