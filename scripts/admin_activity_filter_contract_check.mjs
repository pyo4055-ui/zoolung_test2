import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_activity_filter_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "let applied=null",
  "const startControl=()=>$('activityStart')||$('activityStartDate')",
  "const endControl=()=>$('activityEnd')||$('activityEndDate')",
  "const statusControl=()=>$('zrActivityStatusFilter')",
  "const ACTIVITY_STATUS_KEY='zr_activity_status_filter_v1'",
  "function readControls(){return {start:startControl()?.value||'',end:endControl()?.value||'',mode:controlBasis(),status:controlStatus()}}",
  "mode==='reservation'?String(b?.date||''):seoulDate(b?.createdAt)",
  "timeZone:'Asia/Seoul'",
  "if(s.start&&key<s.start)return false",
  "if(s.end&&key>s.end)return false",
  "if(!matchesStatus(b,s.status))return false",
  "if(status==='confirmed')return b?.status==='confirmed'&&!isSettled(b)",
  "if(status==='pending')return b?.status==='pending'",
  "if(status==='cancelled')return b?.status==='cancelled'||b?.status==='rejected'",
  "if(status==='completed')return isSettled(b)",
  "function applyFromControls()",
  "applied={...next}",
  "window.activityFilteredBookings=()=>filterByState(applied||readControls())",
  "window.renderActivity=renderMain",
  "search.onclick=e=>",
  "today.onclick=e=>",
  "search.dataset.zrActivityDateOwner='1'",
  "e.stopImmediatePropagation();applyFromControls()",
  "e.stopImmediatePropagation();applyToday()",
  "zrActivityStatusWrap",
  "<span>처리 상태</span>",
  "<option value=\"all\">전체 조회</option>",
  "<option value=\"confirmed\">확정</option>",
  "<option value=\"pending\">접수 대기</option>",
  "<option value=\"cancelled\">취소</option>",
  "<option value=\"completed\">완료</option>",
  "#tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/9!important;grid-row:1!important}",
  "#tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:9/11!important;grid-row:1!important",
  "#tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:11/13!important;grid-row:1!important",
  "zrActivityOrgModalBtn",
  "zrActivityOrgSearchModal",
  "날짜 조회와 별개로 전체 예약에서 단체명을 찾습니다.",
  "readBookings().filter(b=>norm(b.orgName).includes(nq))",
  "q.disabled=true",
  "basis.disabled=false",
  "zr-activity-inline-search-disabled",
  "#zrActivityOrgSearchModal #zrActivityOrgModalClose{position:absolute;top:14px;right:14px",
  "list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length",
  "list.filter(b=>b.status==='pending').length",
  "list.filter(b=>b.status==='cancelled'||b.status==='rejected').length",
  "const settled=list.filter(isSettled).length"
])if(!s.includes(needle))fail(`activity filter contract missing: ${needle}`);

for(const forbidden of [
  'if(q)return readBookings().filter',
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'firebase-firestore',
  'scheduleGroups',
  'adminCalendar',
  'dayDetailContent',
  'function downloadActivity',
  'buildActivityXlsx'
])if(s.includes(forbidden))fail(`activity filter fix must stay isolated/display-only: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
for(const needle of ['zrAdminActivityFilterFixV1','./admin_activity_filter_fix_v1.js?v=3'])if(!loader.includes(needle))fail(`activity filter loader missing: ${needle}`);

if(failed)process.exit(1);
ok('activity date/status filters own the query buttons, toolbar stays ordered, and group-name search stays isolated in a modal');
