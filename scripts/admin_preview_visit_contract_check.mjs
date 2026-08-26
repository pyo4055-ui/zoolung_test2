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
  '사전답사 문의','사전답사 확정','방문 희망일','방문 희망시간','사전답사 인원',
  'data-pv-edit','data-pv-confirm','수정 저장',"['00','30'].includes",'확정완료',
  'zrPreviewStatusFilter','zrPreviewStartDateFilter','zrPreviewEndDateFilter','조회 시작일','조회 종료일','처리 상태','사전답사 현황 조회',
  '<option value="all">전체 조회</option>','<option value="received">접수</option>','<option value="confirmed">확정</option>',
  'grid-template-columns:repeat(12,minmax(0,1fr))','방문일 기준으로 조회합니다.',
  "f.status==='received'&&p.confirmed","f.status==='confirmed'&&!p.confirmed",'f.start&&p.date<f.start','f.end&&p.date>f.end',
  '조회 시작일은 종료일보다 늦을 수 없습니다.','zr-pv-info','<b>방문</b>','<b>인원</b>','<b>문의자</b>','<b>연락처</b>','<b>문의내용</b>',
  "document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'))",'window.zrPreviewVisitConfirmedByDate=confirmedByDate','window.renderAdmin?.()'
])if(!s.includes(needle))fail(`preview visit contract missing: ${needle}`);
if(s.includes('zrPreviewDateFilter'))fail('single-day preview visit filter must not remain after date-range conversion');
if(s.includes("setStore('zr_bookings'")||s.includes('setStore("zr_bookings"'))fail('preview visits must not write into reservation bookings');
if(/collection\s*\(/.test(s)||s.includes('firebase'))fail('preview visit helper must not introduce a new Firestore collection');
if(s.includes('MutationObserver'))fail('preview visit tab must not add a broad MutationObserver');

const queryUi=read('admin_preview_visit_query_ui_v1.js');
syntax('admin_preview_visit_query_ui_v1.js');
for(const needle of [
  "timeZone:'Asia/Seoul'","start.value=`${today.slice(0,8)}01`",'end.value=today',"$('zrPreviewResetFilter')?.remove()",
  "const BASIS_KEY='zr_preview_visit_date_basis_v1'",'zrPreviewDateBasis','조회 기준','접수일 기준','방문일 기준',
  "basis()==='reception'?'접수일 기준으로 조회합니다.'",'receptionDate(item)','createdAt','submittedAt',
  '#tab-preview-visit .zr-pv-filterfield.basis{grid-column:7/9!important;grid-row:1!important',
  '#tab-preview-visit .zr-pv-filterfield.status{grid-column:9/11!important;grid-row:1!important',
  '#tab-preview-visit #zrPreviewApplyFilter{grid-column:11/13!important;grid-row:1!important',
  '.zr-pv-filterfield{align-self:end!important}','postFilterReception()','runBase(base,ctx,args)','wrapAction(search)','wrapAction(tabBtn)'
])if(!queryUi.includes(needle))fail(`preview visit query UI missing: ${needle}`);
if(queryUi.includes('MutationObserver'))fail('preview visit query UI must not add a broad MutationObserver');

const content=read('admin_preview_visit_content_v1.js');
syntax('admin_preview_visit_content_v1.js');
for(const needle of [
  "const INQUIRY_KEY='zr_inquiries'",'const PREVIEW_LIMIT=20','function shortText(value)','data-pv-content','zr-pv-content-preview',
  'zrPreviewVisitContentModal','zrPreviewVisitContentFull','<h2>문의내용</h2>','>닫기</button>','white-space:pre-wrap','actions.insertBefore(btn,actions.firstChild)',
  "document.addEventListener('zr:preview-visits-changed',schedule)"
])if(!content.includes(needle))fail(`preview inquiry content UI missing: ${needle}`);
if(content.includes('MutationObserver'))fail('preview inquiry content helper must not add a broad MutationObserver');

const notify=read('admin_preview_visit_notify_v1.js');
syntax('admin_preview_visit_notify_v1.js');
for(const needle of [
  "const INQUIRY_KEY='zr_inquiries'",
  "const TEMPLATE_KEY='zr_preview_confirm_templates_v1'",
  'zrPreviewNotifyInnerTabs','사전답사 현황','확정문자 예시','확정문자 예시 관리',
  'zrPreviewNotifyTemplateTitle','zrPreviewNotifyTemplateText','예시 저장','수정 저장','삭제','안내멘트',
  '단체명·방문일시·방문인원은 확정된 사전답사 데이터가 문자 아래에 자동으로 붙습니다.',
  'function fixedDetails(p)','단체명: ${p.orgName}','방문일시: ${p.date} ${p.time}','방문인원: ${p.people}명','function buildSms(intro,p)',
  'zrPreviewNotifyModal','사전답사 확정 안내','확정문자 예시 불러오기','문자 고정정보','확정 내용 확인','수신번호','수정하기','보내기',
  "e.target?.closest?.('[data-pv-confirm]')",'e.stopImmediatePropagation()','openNotify(Number(btn.dataset.pvConfirm))',
  "item[contentKey(item)]=buildPreview(p,p.body,true)","document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'))",'window.renderAdmin?.()',
  'sms:','body=${body}','[주렁주렁 동탄점]','navigator.clipboard?.writeText'
])if(!notify.includes(needle))fail(`preview confirmation SMS contract missing: ${needle}`);
for(const forbidden of ['applyVars(text,p)','{단체명}','{방문일}','{방문시간}','{인원}',"setStore('zr_bookings'",'reservationAvailability','scheduleGroups','MutationObserver','collection(','setDoc('])if(notify.includes(forbidden))fail(`preview confirmation SMS helper must not contain protected/legacy behavior: ${forbidden}`);

const cal=read('admin_calendar_status_summary_v1.js');
syntax('admin_calendar_status_summary_v1.js');
for(const needle of ['zrPreviewVisitConfirmedByDate','답사 ${preview}','.preview{color:',"document.addEventListener('zr:preview-visits-changed'"])
  if(!cal.includes(needle))fail(`calendar preview marker missing: ${needle}`);

const loader=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of [
  'zrAdminPreviewVisitV1','./admin_preview_visit_v1.js?v=1','loadAdminPreviewVisit()',
  'zrAdminPreviewVisitQueryUiV1','./admin_preview_visit_query_ui_v1.js?v=1','loadAdminPreviewVisitQueryUi()',
  'zrAdminPreviewVisitNotifyV1','./admin_preview_visit_notify_v1.js?v=1','loadAdminPreviewVisitNotify()',
  'zrAdminPreviewVisitContentV1','./admin_preview_visit_content_v1.js?v=1','loadAdminPreviewVisitContent()'
])if(!loader.includes(needle))fail(`preview visit loader missing: ${needle}`);

if(failed)process.exit(1);
ok('preview visit management supports compact inquiry previews with a full-content modal and confirmation SMS templates where only the intro is editable while org/date-time/people are always generated from current preview data');
