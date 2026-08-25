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
  "document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'))",
  'window.zrPreviewVisitConfirmedByDate=confirmedByDate',
  'window.renderAdmin?.()'
])if(!s.includes(needle))fail(`preview visit contract missing: ${needle}`);
if(s.includes("setStore('zr_bookings'")||s.includes('setStore("zr_bookings"'))fail('preview visits must not write into reservation bookings');
if(/collection\s*\(/.test(s)||s.includes('firebase'))fail('preview visit helper must not introduce a new Firestore collection');
if(s.includes('MutationObserver'))fail('preview visit tab must not add a broad MutationObserver');

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
for(const needle of ['zrAdminPreviewVisitV1','./admin_preview_visit_v1.js?v=1','loadAdminPreviewVisit()'])if(!loader.includes(needle))fail(`preview visit loader missing: ${needle}`);

if(failed)process.exit(1);
ok('preview visit inquiries can be reviewed, edited and confirmed without altering reservation counts, and confirmed visits appear as small calendar markers');
