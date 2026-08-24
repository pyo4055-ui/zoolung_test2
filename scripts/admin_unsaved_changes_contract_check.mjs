import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_unsaved_changes_guard_v1.js';
const s=fs.readFileSync(file,'utf8');

for(const f of [file,'admin_features_v9_patch.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  '저장하지 않은 변경사항이 있습니다',
  '수정 저장 후 닫기',
  '예약 등록 후 닫기',
  '스케줄 반영 후 이동',
  '저장 안 하고 이동',
  '계속 수정',
  "t.id==='zr2EditCancel'",
  "t.id==='zr2QuickCancel'",
  "t.matches('#zrscPrev,#zrscNext,#zrscToday')",
  "t.matches('#adminView .admin-tabs button')",
  "t?.matches?.('#tab-schedule .zrsc-card select')",
  "t.id==='zr14SaveSettings'",
  "t.matches('#tab-schedule [data-custom-delete]')",
  'beforeunload',
  'saveDirtySchedules()',
  "card?.querySelector('[data-apply]')",
  "runBypass(()=>btn.click())",
  'serialize($(\'zr2EditBody\'))',
  'serialize($(\'zr2QuickBody\'))'
])if(!s.includes(needle))fail(`unsaved changes contract missing: ${needle}`);

for(const forbidden of [
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'reservationAvailability',
  'scheduleGroups',
  "localStorage.setItem('zr_bookings'",
  'firebase-firestore'
])if(s.includes(forbidden))fail(`unsaved guard must reuse existing save actions only: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v9_patch.js','utf8');
if(!loader.includes("addScript('zrAdminUnsavedChangesGuardV1','./admin_unsaved_changes_guard_v1.js?v=1')"))fail('unsaved changes guard is not loaded by active admin patch chain');

if(failed)process.exit(1);
ok('admin unsaved-change warning reuses existing reservation and schedule save controls without touching data contracts');
