import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const uiFile='customer_reservation_change_request_v1.js';
const tagFile='customer_reservation_change_request_tag_v1.js';
const adminFile='admin_reservation_change_requests_shared_v1.js';
const bridgeFile='reservation_firebase_bridge.js';
const ui=read(uiFile),tag=read(tagFile),admin=read(adminFile),bridge=read(bridgeFile);

[uiFile,tagFile,adminFile].forEach(syntax);

for(const needle of [
  'zrChangePlayMode','zrChangePlayStart','zrChangePlayDuration',
  'zrChangeMealMode','zrChangeMealStart','zrChangeMealEnd',
  '현재 예약 유지','validateExtraChanges','놀이터 시작시간과 이용시간을 확인해주세요.',
  '식사 시작·종료시간을 확인해주세요.'
])if(!ui.includes(needle))fail(`customer change UI missing: ${needle}`);

for(const needle of [
  'changePlay','playUse','playStart','playEnd','playDuration',
  'changeMeal','mealType','mealStart','mealEnd',
  'booking.reservationChangeRequest={','structuredContent(ctx)','attachBookingRequest(ctx'
])if(!tag.includes(needle))fail(`customer change persistence missing: ${needle}`);

for(const needle of [
  'r.changePlay===true','r.changeMeal===true',
  'booking.playUse=appliedPlayUse','booking.playStart=appliedPlayStart','booking.playEnd=appliedPlayEnd','booking.playDuration=appliedPlayDuration',
  'booking.mealType=appliedMealType','booking.mealStart=appliedMealStart','booking.mealEnd=appliedMealEnd',
  "booking.cafe={...booking.cafe,items:[]}",
  'zrSharedChangeApplyPlayWrap','zrSharedChangeApplyMealWrap','예약 변경 내용을 반영했습니다.'
])if(!admin.includes(needle))fail(`admin change apply missing: ${needle}`);

for(const needle of [
  'playUse:b.playUse','playStart:b.playStart','playEnd:b.playEnd',
  "entryTime:'',exitTime:'',mealType:'none',mealStart:'',mealEnd:''"
])if(!bridge.includes(needle))fail(`existing reservation data contract missing: ${needle}`);

for(const [name,source] of [[uiFile,ui],[tagFile,tag],[adminFile,admin]]){
  for(const forbidden of ['collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc(']){
    if(source.includes(forbidden))fail(`${name} must use the existing reservation bridge, not direct Firestore writes: ${forbidden}`);
  }
}

if(failed)process.exit(1);
ok('reservation change flow reuses existing play/meal booking fields and applies only explicitly requested option changes');
