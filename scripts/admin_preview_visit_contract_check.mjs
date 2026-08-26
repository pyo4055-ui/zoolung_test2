import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_preview_visit_v1.js';
const s=read(file);
syntax(file);
for(const needle of [
  "const STORE_KEY='zr_inquiries'",
  "btn.textContent='사전답사 관리'",
  "sec.id='tab-preview-visit'",
  '사전답사 문의',
  '사전답사 확정',
  '방문 희망일',
  '방문 희망시간',
  '사전답사 인원',
  'data-pv-edit',
  'data-pv-confirm',
  '수정 저장',
  "['00','30'].includes",
  '확정완료',
  'zrPreviewStatusFilter',
  'zrPreviewStartDateFilter',
  'zrPreviewEndDateFilter',
  '조회 시작일',
  '조회 종료일',
  '처리 상태',
  '사전답사 현황 조회',
  '<option value="all">전체 조회</option>',
  '<option value="received">접수</option>',
  '<option value="confirmed">확정</option>',
  'grid-template-columns:repeat(12,minmax(0,1fr))',
  '방문일 기준으로 조회합니다.',
  "f.status==='received'&&p.confirmed",
  "f.status==='confirmed'&&!p.confirmed",
  'f.start&&p.date<f.start',
  'f.end&&p.date>f.end',
  '조회 시작일은 종료일보다 늦을 수 없습니다.',
  'zr-pv-info',
  '<b>방문</b>',
  '<b>인원</b>',
  '<b>문의자</b>',
  '<b>연락처</b>',
  '<b>문의내용</b>',
  "document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'))",
  'window.zrPreviewVisitConfirmedByDate=confirmedByDate',
  'window.renderAdmin?.()'
])if(!s.includes(needle))fail(`preview visit contract missing: ${needle}`);
if(s.includes('zrPreviewDateFilter'))fail('single-day preview visit filter must not remain after date-range conversion');
if(s.includes("setStore('zr_bookings'")||s.includes('setStore("zr_bookings"'))fail('preview visits must not write into reservation bookings');
if(/collection\s*\(/.test(s)||s.includes('firebase'))fail('preview visit helper must not introduce a new Firestore collection');
if(s.includes('MutationObserver'))fail('preview visit tab must not add a broad MutationObserver');

const queryUi=read('admin_preview_visit_query_ui_v1.js');
syntax('admin_preview_visit_query_ui_v1.js');
for(const needle of [
  "timeZone:'Asia/Seoul'",
  "start.value=`${today.slice(0,8)}01`",
  'end.value=today',
  "$('zrPreviewResetFilter')?.remove()",
  '#zrPreviewApplyFilter{grid-column:10/13!important;grid-row:1!important',
  '#tab-preview-visit .zr-pv-filterfield.status{grid-column:7/10!important;grid-row:1!important'
])if(!queryUi.includes(needle))fail(`preview visit query UI missing: ${needle}`);
if(queryUi.includes('MutationObserver'))fail('preview visit query UI must not add a broad MutationObserver');

const cal=read('admin_calendar_status_summary_v1.js');
syntax('admin_calendar_status_summary_v1.js');
for(const needle of [
  'zrPreviewVisitConfirmedByDate',
  '답사 ${preview}',
  '.preview{color:',
  "document.addEventListener('zr:preview-visits-changed'"
])if(!cal.includes(needle))fail(`calendar preview marker missing: ${needle}`);

const loader=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of [
  'zrAdminPreviewVisitV1','./admin_preview_visit_v1.js?v=1','loadAdminPreviewVisit()',
  'zrAdminPreviewVisitQueryUiV1','./admin_preview_visit_query_ui_v1.js?v=1','loadAdminPreviewVisitQueryUi()'
])if(!loader.includes(needle))fail(`preview visit loader missing: ${needle}`);

if(failed)process.exit(1);
ok('preview visit management matches the reservation-style toolbar, defaults to current-month start through today, removes reset, keeps compact one-line cards, and preserves date/status filtering');
