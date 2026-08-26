import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');

for(const file of ['admin_tab_active_fix_v1.js','admin_activity_org_detail_modal_fix_v1.js','admin_mobile_date_input_fix_v1.js','admin_list_pagination_v1.js','admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}
}

const fix=read('admin_tab_active_fix_v1.js');
const orgDetail=read('admin_activity_org_detail_modal_fix_v1.js');
const mobileDate=read('admin_mobile_date_input_fix_v1.js');
const pagination=read('admin_list_pagination_v1.js');
const loader=read('admin_features_v2_loader.js');

for(const needle of [
  "#adminView .admin-tabs button",
  "clicked.id!=='zrScheduleTabBtn'",
  "clicked.id!=='zrGuideAdminTab'",
  "gray('zrScheduleTabBtn')",
  "gray('zrGuideAdminTab')",
  "btn.className='btn-gray'",
  'loadActivityOrgDetailFix()',
  "s.src='./admin_activity_org_detail_modal_fix_v1.js?v=1'",
  'loadMobileDateInputFix()',
  "s.src='./admin_mobile_date_input_fix_v1.js?v=1'",
  'loadAdminListPagination()',
  "s.src='./admin_list_pagination_v1.js?v=1'"
])if(!fix.includes(needle))fail(`admin tab/UI cleanup missing: ${needle}`);

for(const needle of [
  '#zrActivityOrgSearchModal button',
  "openAdminBookingDetail\\('([^']+)'\\)",
  "document.getElementById('zrActivityOrgSearchModal')?.classList.add('hidden')",
  "typeof window.openAdminBookingDetail==='function'",
  'e.stopImmediatePropagation()',
  'requestAnimationFrame'
])if(!orgDetail.includes(needle))fail(`group search detail modal transition missing: ${needle}`);

for(const needle of [
  '@media(max-width:720px)',
  '#adminView input[type="date"]',
  'width:calc(100% - 12px)!important',
  'max-width:calc(100% - 12px)!important',
  'margin-left:auto!important',
  'margin-right:auto!important',
  'min-width:0!important',
  'box-sizing:border-box!important'
])if(!mobileDate.includes(needle))fail(`mobile admin date containment missing: ${needle}`);

for(const forbidden of ['setStore(','setDoc(','localStorage.setItem(','reservationAvailability','scheduleGroups']){
  if(mobileDate.includes(forbidden))fail(`mobile date UI fix must not touch data/business logic: ${forbidden}`);
}

for(const needle of [
  "outsourcing:{rootId:'outsourceList',itemSelector:'.booking-item',pageSize:8}",
  "inquiry:{rootId:'zrInquiryReplyList',itemSelector:'.zr-ir-card',pageSize:15}",
  "preview:{rootId:'zrPreviewVisitList',itemSelector:'.zr-pv-card',pageSize:15}",
  "data-zr-list-page",
  "data-zr-list-page-hidden",
  "observer.observe(root,{childList:true})",
  "#outsourceSearch",
  "#zrInquiryApply",
  "#zrPreviewApplyFilter",
  "zr:inquiry-replies-changed",
  "zr:preview-visits-changed"
])if(!pagination.includes(needle))fail(`admin list pagination missing: ${needle}`);
for(const forbidden of ['setStore(','setDoc(','updateDoc(','deleteDoc(','localStorage.setItem(','reservationAvailability','scheduleGroups']){
  if(pagination.includes(forbidden))fail(`admin list pagination must stay display-only: ${forbidden}`);
}

if(!loader.includes("['zrAdminTabActiveFixV1','./admin_tab_active_fix_v1.js?v=1']"))fail('admin tab active fix is not loaded by active admin loader');

if(failed){console.error('\nAdmin tab active contract failed.');process.exit(1)}
console.log('Admin tab active contract passed.');