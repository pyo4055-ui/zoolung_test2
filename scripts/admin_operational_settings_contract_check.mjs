import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const need=(ok,m)=>ok||fail(m);
const bridgeFile='admin_operational_settings_firebase_v1.js';
const bridge=fs.readFileSync(bridgeFile,'utf8');
const admin=fs.readFileSync('admin.html','utf8');

try{execFileSync(process.execPath,['--check',bridgeFile],{stdio:'pipe'})}
catch(e){fail(`syntax ${bridgeFile}: ${e.stderr?.toString()||e.message}`)}

for(const required of [
  "window.__ZR_ADMIN_OPERATIONAL_SETTINGS_FIREBASE_V1=true",
  "const COLLECTION='customerGuides'",
  "const DOC_ID='main'",
  "const FIELD='adminOperationalSettings'",
  "'zr_inquiry_reply_templates_v1'",
  "'zr_reservation_change_confirm_sms_v1'",
  'F.onSnapshot(',
  'F.setDoc(',
  "document.dispatchEvent(new CustomEvent('zr:admin-operational-settings-updated'",
  'setInterval(detectLocalChanges,700)'
])need(bridge.includes(required),`shared admin operational settings missing: ${required}`);

need(admin.includes('./admin_operational_settings_firebase_v1.js?v=1'),'admin entry must load shared operational settings bridge');

for(const forbidden of [
  "'zr_bookings'",'"zr_bookings"',
  "'zr_inquiries'",'"zr_inquiries"',
  "COLLECTION='reservations'",
  "COLLECTION='reservationAvailability'",
  "COLLECTION='scheduleGroups'",
  'window.setStore=',
  'setStore(',
  'deleteDoc(',
  'updateDoc('
])need(!bridge.includes(forbidden),`operational settings bridge must stay narrow: ${forbidden}`);

if(failed){console.error('\nAdmin operational settings contract failed.');process.exit(1)}
console.log('Admin operational settings contract passed.');
