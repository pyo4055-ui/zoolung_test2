import fs from 'node:fs';

const helper=fs.readFileSync('customer_inquiry_visit_v1.js','utf8');
const loader=fs.readFileSync('admin_tab_active_fix_v1.js','utf8');

const required=[
  '사전답사 문의',
  '단체 문의',
  'inqVisitDate',
  'inqVisitTime',
  'step="1800"',
  '사전답사 인원',
  '단체 인원',
  'inqOrgName',
  '단체명: ${orgName}',
  '이메일 (선택)',
  'email.required=false',
  'zr-inquiry-visit-grid',
  'grid-template-columns:minmax(0,1fr) minmax(0,1fr)',
  'grid-template-areas:"name phone" "org email" "mobile mobile"',
  'zr-inquiry-mobile',
  '#zrInquiryVisitFields .zr-inquiry-people{width:100%',
  '단체예약 접수 및 관리, 예약 확인·변경·취소, 이용 안내를 위해 단체명, 예약자명, 연락처, 이메일(선택), 예약 관련 요청사항 등 예약 과정에서 입력한 정보를 수집·이용합니다.',
  '수집된 개인정보는 이용 목적 달성 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.',
  '방문시간은 30분 단위로 선택해주세요.',
  'content.value=`${prefix}\\n\\n${original}`',
  "submit.addEventListener('click'",
];

for(const needle of required){
  if(!helper.includes(needle)){
    console.error(`Inquiry visit helper is missing contract marker: ${needle}`);
    process.exit(1);
  }
}

if(helper.includes('테스트 버전에서는 현재 브라우저에만 저장됩니다.')){
  console.error('Inquiry privacy notice must not show the obsolete browser-only test wording.');
  process.exit(1);
}

if(helper.includes('setStore("zr_inquiries"')||helper.includes("setStore('zr_inquiries'")){
  console.error('Inquiry visit helper must not replace the existing zr_inquiries storage contract.');
  process.exit(1);
}

if(helper.includes('MutationObserver')){
  console.error('Inquiry visit helper must not use a broad MutationObserver.');
  process.exit(1);
}

if(!loader.includes("./customer_inquiry_visit_v1.js?v=1")){
  console.error('Inquiry visit helper is not loaded by the existing UI helper chain.');
  process.exit(1);
}

console.log('OK: inquiry desktop layout, booking privacy wording, optional email and existing storage contract are preserved.');
