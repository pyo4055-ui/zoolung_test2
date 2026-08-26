import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const helper=fs.readFileSync('customer_inquiry_visit_v1.js','utf8');
const loader=fs.readFileSync('admin_tab_active_fix_v1.js','utf8');

try{execFileSync(process.execPath,['--check','customer_inquiry_visit_v1.js'],{stdio:'pipe'});}
catch(e){console.error(e.stderr?.toString()||e.message);process.exit(1)}

const required=[
  '사전답사 문의',
  '단체 문의',
  'inqVisitMonth',
  'inqVisitDay',
  'inqVisitDate',
  'inqVisitTime',
  '월 선택',
  '일 선택',
  '방문시간 선택',
  '사전답사 인원',
  '단체 인원',
  'inqOrgName',
  '이메일 (선택)',
  "email.required=false",
  "email.removeAttribute('required')",
  'zr-inquiry-section-title',
  "sectionTitle(1,'문의 정보')",
  "ensureWrappedSection(contactGrid,'zrInquiryContactSection',2,'문의자 정보')",
  "ensureWrappedSection(contentWrap,'zrInquiryContentSection',3,'문의 내용')",
  "ensureWrappedSection(privacyBox,'zrInquiryPrivacySection',4,'개인정보 수집·이용')",
  'margin:0 0 18px!important',
  'zr-inquiry-date-selects',
  'grid-template-columns:minmax(0,1fr) minmax(0,1fr)',
  'grid-template-areas:"name phone" "org email" "mobile mobile"',
  'fillMonths()',
  'fillDays()',
  'fillTimeOptions()',
  "const start=isGroup?10*60+30:11*60",
  "n<=18*60",
  "'단체 10:30~18:00 · 30분 단위'",
  "'사전답사 11:00~18:00 · 30분 단위'",
  "mobile.setAttribute('inputmode','numeric')",
  "mobile.setAttribute('maxlength','11')",
  "mobile.setAttribute('pattern','010[0-9]{8}')",
  "mobile.setAttribute('placeholder','01012345678')",
  "if(!/^010[0-9]{8}$/.test(mobileNo))",
  '휴대폰번호는 010으로 시작하는 숫자 11자리로 입력해주세요.',
  'zrInquiryReviewStage',
  '문의 내용 확인',
  '수정하기',
  'zrInquiryReviewSubmit',
  '문의하기가 완료됐습니다.',
  'zrInquiryCompleteHome',
  '처음 화면으로',
  'OPTIONAL_EMAIL_SENTINEL',
  "window.toast=()=>{}",
  'clearOptionalEmailSentinel()',
  "if(after<=before)",
  '단체예약 접수 및 관리, 예약 확인·변경·취소, 이용 안내를 위해 단체명, 예약자명, 연락처, 이메일(선택), 예약 관련 요청사항 등 예약 과정에서 입력한 정보를 수집·이용합니다.',
  '수집된 개인정보는 이용 목적 달성 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.',
  "submit.addEventListener('click'",
];

for(const needle of required){
  if(!helper.includes(needle)){
    console.error(`Inquiry visit helper is missing contract marker: ${needle}`);
    process.exit(1);
  }
}

if(helper.includes('type="date"')||helper.includes('type="time"')){
  console.error('Inquiry visit date/time must use reservation-style selects rather than native browser date/time controls.');
  process.exit(1);
}
if(helper.includes('테스트 버전에서는 현재 브라우저에만 저장됩니다.')){
  console.error('Inquiry flow must not show obsolete browser-only test wording.');
  process.exit(1);
}
if(/const\s+STORE_KEY\s*=\s*['"](?!zr_inquiries)/.test(helper)){
  console.error('Inquiry flow must keep using zr_inquiries rather than introducing a replacement store key.');
  process.exit(1);
}
if(helper.includes('MutationObserver')){
  console.error('Inquiry flow must not use a broad MutationObserver.');
  process.exit(1);
}
if(!loader.includes("./customer_inquiry_visit_v1.js?v=1")){
  console.error('Inquiry visit helper is not loaded by the existing UI helper chain.');
  process.exit(1);
}

console.log('OK: inquiry uses booking-style month/day/time selects, strict 010 + 11-digit mobile validation, section spacing, review flow and zr_inquiries compatibility.');
