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
  s.src='./admin_calendar_status_summary_v1.js?v=1';
  document.body.appendChild(s);
}

document.addEventListener('click',e=>{
  const clicked=e.target?.closest?.('#adminView .admin-tabs button');
  if(!clicked)return;
  if(clicked.id!=='zrScheduleTabBtn')gray('zrScheduleTabBtn');
  if(clicked.id!=='zrGuideAdminTab')gray('zrGuideAdminTab');
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCalendarSummary,{once:true});
else loadCalendarSummary();
})();
