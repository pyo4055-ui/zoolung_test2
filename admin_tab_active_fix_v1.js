(()=>{
'use strict';
if(window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1)return;
window.__ZR_ADMIN_TAB_ACTIVE_FIX_V1=true;

function gray(id){
  const btn=document.getElementById(id);
  if(btn)btn.className='btn-gray';
}

document.addEventListener('click',e=>{
  const clicked=e.target?.closest?.('#adminView .admin-tabs button');
  if(!clicked)return;
  if(clicked.id!=='zrScheduleTabBtn')gray('zrScheduleTabBtn');
  if(clicked.id!=='zrGuideAdminTab')gray('zrGuideAdminTab');
},true);
})();
