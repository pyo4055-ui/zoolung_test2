import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const fixFile='schedule_refactor/quick_time_fix.js';

for(const file of [fixFile,'schedule_refactor/app.js','schedule_refactor/display.js','schedule_refactor/core.js']){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}
  catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}
}

const fix=fs.readFileSync(fixFile,'utf8');
const page=fs.readFileSync('schedule.html','utf8');
const display=fs.readFileSync('schedule_refactor/display.js','utf8');

for(const needle of [
  "#list .zr-quick-time[data-q][data-id]",
  "kind!=='eta'&&kind!=='aend'",
  "String(z?.id??'')===gid",
  "savePatch(g.id,{[kind]:next})",
  "e.stopImmediatePropagation()",
  "document.addEventListener('click'",
  "color:#667169!important",
  "-webkit-text-fill-color:currentColor!important",
  "#list .zr-quick-time.has",
  "color:var(--green)!important",
  "background:#e7f4ea!important",
  "도착예정",
  "퇴장예정"
])if(!fix.includes(needle))fail(`quick-time fix missing: ${needle}`);

for(const forbidden of [
  "actualPaid",
  "actualChap",
  "mealLoc",
  "appearance",
  "scheduleSharedMemos",
  "reservationAvailability",
  "reservations"
])if(fix.includes(forbidden))fail(`quick-time fix must stay scoped to eta/aend: ${forbidden}`);

if(!page.includes('<script type="module" src="./schedule_refactor/quick_time_fix.js?v=1"></script>'))fail('schedule page does not load quick-time fix module');
for(const needle of [
  'class="live zr-quick-time ${g.eta?"has":""}" data-q="eta"',
  'class="live zr-quick-time ${g.aend?"has":""}" data-q="aend"',
  'type="button"'
])if(!display.includes(needle))fail(`onsite display quick-time control missing: ${needle}`);

if(failed)process.exit(1);
ok('onsite arrival/departure quick controls have direct capture handling, string-safe ids, Firebase save, and mobile-safe text colors');
