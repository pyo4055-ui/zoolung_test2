import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const memo=fs.readFileSync('admin_daily_memo_v1.js','utf8');
const onsite=fs.readFileSync('schedule_refactor/app.js','utf8');
function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_daily_memo_v1.js?v=1'),'admin entry must load the shared daily memo.');
for(const required of [
  "const COLLECTION='scheduleSharedMemos'",
  "id='zrAdminDailyMemoV1'",
  '오늘의 메모장',
  "id=\"zrAdminDailyMemoPrev\"",
  "id=\"zrAdminDailyMemoNext\"",
  "id=\"zrAdminDailyMemoToday\"",
  "id=\"zrAdminDailyMemoText\"",
  "id=\"zrAdminDailyMemoSave\"",
  "move(shift(selected,-1))",
  "move(shift(selected,1))",
  "move(today())",
  "FS.onSnapshot(ref",
  "FS.setDoc(FS.doc(db,COLLECTION,selected)",
  "updatedAt:FS.serverTimestamp()",
  "window.zrReservationFirebase?.isStaff?.()",
  "if(dirty&&!(await saveCurrent(true)))return"
])need(memo.includes(required),`admin daily memo contract missing: ${required}`);
need(onsite.includes('F.doc(db,"scheduleSharedMemos",state.date)'),'onsite schedule must still use the same date-keyed shared memo documents.');
for(const forbidden of ["COLLECTION='reservations'","COLLECTION='reservationAvailability'","COLLECTION='scheduleGroups'","localStorage.setItem(","sessionStorage.setItem("])
  need(!memo.includes(forbidden),`admin daily memo must not create unrelated storage/data writes: ${forbidden}`);
console.log('OK: admin daily memo navigates previous/next/today dates, saves before date changes, and shares the existing scheduleSharedMemos documents with onsite schedule.');
