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

console.log('OK: inquiry organization, optional email, compact visit layout and existing storage contract are preserved.');
