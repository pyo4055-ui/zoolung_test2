import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_inquiry_reply_v1.js';
const s=read(file);
syntax(file);
for(const needle of [
  "const INQUIRY_KEY='zr_inquiries'",
  "const TEMPLATE_KEY='zr_inquiry_reply_templates_v1'",
  "const REPLY_MARKER='\\n\\n[관리자 답변]\\n'",
  '1:1 문의 현황 조회',
  '조회 시작일',
  '조회 종료일',
  '처리 상태',
  '<option value="pending">미답변</option>',
  '<option value="done">답변완료</option>',
  '접수일 기준으로 조회합니다.',
  "isPreviewInquiry(item)",
  '사전답사 문의',
  '사전답사 확정',
  'data-ir-reply',
  '답변하기',
  '답변 내용 확인',
  '수신번호',
  '수정하기',
  '보내기',
  'sms:',
  'body=${body}',
  "['mobile','mobilePhone','cellphone','cellPhone','hp','inqMobile','contact']",
  '답변일:',
  '답변내용:',
  '답변예시 관리',
  '답변예시 불러오기',
  'zrInquiryReplyTemplate',
  'zrInquiryTemplateTitle',
  'zrInquiryTemplateText',
  '예시 저장',
  '수정 저장',
  '삭제',
  'list.push({id:`tpl_',
  "templates.map(t=>`<option value=",
  "timeZone:'Asia/Seoul'",
  "start.value=`${today.slice(0,8)}01`",
  'end.value=today'
])if(!s.includes(needle))fail(`inquiry reply contract missing: ${needle}`);

for(const forbidden of [
  "setStore('zr_bookings'",
  'setDoc(',
  'collection(',
  'reservationAvailability',
  'scheduleGroups',
  'MutationObserver'
])if(s.includes(forbidden))fail(`inquiry reply helper must not touch protected reservation/schedule contracts: ${forbidden}`);

const layout=read('admin_inquiry_reply_layout_v1.js');
syntax('admin_inquiry_reply_layout_v1.js');
for(const needle of [
  "$('zrInquiryReplyExampleTabBtn')?.remove()",
  'if(examples.parentElement!==main)main.appendChild(examples)',
  'zrInquiryReplyInnerTabs',
  'zrInquiryReplyInquirySubtab',
  'zrInquiryReplyExampleSubtab',
  '>문의현황<',
  '>답변예시<',
  "setSubtab('examples')",
  '@media(min-width:721px)',
  '.zr-ir-field.status{position:relative!important;top:4px!important}',
  'background:#eef3ef',
  'border:1px solid #d7e1da',
  'button.btn-primary{background:#fff!important;color:#2f6b4f!important',
  "nav.setAttribute('aria-label','1:1 문의 내부 메뉴')",
  'const PREVIEW_LIMIT=20',
  'function decorateInquiryCards()',
  'data-ir-content',
  'zr-ir-content-preview',
  'zrInquiryContentModal',
  'zrInquiryContentFull',
  '<h2>문의내용</h2>',
  '>닫기</button>',
  'white-space:pre-wrap',
  'line.dataset.zrFullContent=raw',
  'line.innerHTML=`<b>문의내용</b><span class="zr-ir-content-preview">',
  "btn.className='btn-gray zr-ir-content-btn'",
  'if(reply)actions.insertBefore(btn,reply);else actions.appendChild(btn)'
])if(!layout.includes(needle))fail(`nested inquiry reply layout missing: ${needle}`);
if(layout.includes('MutationObserver'))fail('inquiry reply layout must not add a broad MutationObserver');

const loader=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of [
  'loadAdminInquiryReply()',
  "s.id='zrAdminInquiryReplyV1'",
  "s.src='./admin_inquiry_reply_v1.js?v=1'",
  'loadAdminInquiryReplyLayout()',
  "s.id='zrAdminInquiryReplyLayoutV1'",
  "s.src='./admin_inquiry_reply_layout_v1.js?v=1'"
])if(!loader.includes(needle))fail(`inquiry reply loader missing: ${needle}`);

if(failed)process.exit(1);
ok('1:1 inquiry management supports receipt-date filtering, reply status, two-step SMS handoff, multiple titled reply examples, distinct nested subtabs, 20-character inquiry previews, and a pinned inquiry-content action beside reply while keeping preview visits and reservation data separate');
