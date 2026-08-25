import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const file='admin_settlement_ui_stability_v1.js';
const s=read(file);
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1",
  "$('activityList')",
  "$('adminBookingDetailContent')",
  "new MutationObserver(schedule).observe(root,{childList:true,subtree:true})",
  "pay.textContent='실제결제'",
  "pay.onclick=()=>window.zrOpenSettlementWorkspace?.(id)",
  "done.textContent!=='정산완료'",
  "done.textContent='정산완료'",
  "root.querySelectorAll('.zr-settle-open').forEach(btn=>btn.remove())",
  "head.innerHTML.replace(/실제결제 입력완료/g,'정산완료')",
  "if(b?.status===HOLD)return '예약보류'"
])if(!s.includes(needle))fail(`settlement UI stability missing: ${needle}`);

for(const forbidden of [
  'setStore(','setDoc(','updateDoc(','addDoc(','deleteDoc(','firebase-firestore',
  'reservationAvailability','scheduleGroups','schedulePublished','customerSchedule',
  "b.status='confirmed'","b.status='hold'","b.status='cancelled'"
])if(s.includes(forbidden))fail(`settlement UI stability must remain display-only: ${forbidden}`);

const loader=read('admin_tab_active_fix_v1.js');
for(const needle of [
  'function loadSettlementUiStability()',
  "s.src='./admin_settlement_ui_stability_v1.js?v=1'",
  'loadSettlementUiStability();',
  "document.addEventListener('zr:admin-runtime-ready',loadSettlementUiStability,{once:true})"
])if(!loader.includes(needle))fail(`settlement UI stability loader missing: ${needle}`);

if(failed)process.exit(1);
ok('reservation activity cards keep 자세히 + 실제결제 across rerenders, completion wording stays 정산완료, and detail modal has no duplicate payment action');
