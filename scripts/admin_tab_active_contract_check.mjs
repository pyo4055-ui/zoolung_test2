import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');

for(const file of ['admin_tab_active_fix_v1.js','admin_activity_org_detail_modal_fix_v1.js','admin_mobile_date_input_fix_v1.js','admin_list_pagination_v1.js','admin_outsource_people_stability_v1.js','admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}
}

const fix=read('admin_tab_active_fix_v1.js');
const orgDetail=read('admin_activity_org_detail_modal_fix_v1.js');
const mobileDate=read('admin_mobile_date_input_fix_v1.js');
const pagination=read('admin_list_pagination_v1.js');
const outsourcePeople=read('admin_outsource_people_stability_v1.js');
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
  "activity:{rootId:'activityList',itemSelector:'.booking-item',pageSize:8,alwaysControls:true,nativePaginationSelector:'.zr-activity-pagination'}",
  "outsourcing:{rootId:'outsourceList',itemSelector:'.booking-item',pageSize:8,alwaysControls:true}",
  "inquiry:{rootId:'zrInquiryReplyList',itemSelector:'.zr-ir-card',pageSize:15,alwaysControls:true}",
  "preview:{rootId:'zrPreviewVisitList',itemSelector:'.zr-pv-card',pageSize:15,alwaysControls:true}",
  "data-zr-list-page",
  "data-zr-list-page-hidden",
  "observer.observe(root,{childList:true})",
  "if(itemChanged)paginate(key)",
  "cfg.nativePaginationSelector",
  "pages>1||cfg.alwaysControls",
  "#outsourceSearch",
  "#zrInquiryApply",
  "#zrPreviewApplyFilter",
  "isOutsourceFilterControl",
  "['outsourceStart','outsourceEnd','outsourceVendorFilter']",
  "e.stopImmediatePropagation()",
  "loadOutsourcePeopleStability()",
  "s.src='./admin_outsource_people_stability_v1.js?v=1'",
  "zr:inquiry-replies-changed",
  "zr:preview-visits-changed"
])if(!pagination.includes(needle))fail(`admin list pagination missing: ${needle}`);
for(const forbidden of ['setStore(','setDoc(','updateDoc(','deleteDoc(','localStorage.setItem(','reservationAvailability','scheduleGroups']){
  if(pagination.includes(forbidden))fail(`admin list pagination must stay display-only: ${forbidden}`);
}

for(const needle of [
  'window.__ZR_ADMIN_OUTSOURCE_PEOPLE_STABILITY_V1=true',
  "window.__ZR_ADMIN_OPS_V10",
  "const old=$('outsourceSearch')",
  'old.cloneNode(true)',
  "next.dataset.zrOutsourcePeopleStable='1'",
  'old.replaceWith(next)',
  'window.renderOutsourcingPayments()'
])if(!outsourcePeople.includes(needle))fail(`outsourcing people stability missing: ${needle}`);
for(const forbidden of ['MutationObserver','setStore(','setDoc(','updateDoc(','deleteDoc(','localStorage.setItem(','reservationAvailability','scheduleGroups']){
  if(outsourcePeople.includes(forbidden))fail(`outsourcing people stability must only remove legacy search listeners: ${forbidden}`);
}

if(!loader.includes("['zrAdminTabActiveFixV1','./admin_tab_active_fix_v1.js?v=1']"))fail('admin tab active fix is not loaded by active admin loader');

if(failed){console.error('\nAdmin tab active contract failed.');process.exit(1)}
console.log('Admin tab active contract passed.');