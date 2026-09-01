import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const adminBootstrap=fs.readFileSync('admin_entry_bootstrap_v1.js','utf8');
const customer=fs.readFileSync('customer.html','utf8');
const customerBootstrap=fs.readFileSync('customer_entry_bootstrap_v1.js','utf8');
const customerLoader=fs.readFileSync('customer_features_loader_v1.js','utf8');
const customerBridge=fs.readFileSync('customer_reservation_firebase_bridge_v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const bridgeMarker=String.raw`<script src="./reservation_firebase_bridge.js?v=1"><\/script></body>`;

function need(ok,message){
  if(!ok){console.error(message);process.exit(1)}
}

need(admin.includes("fetch('./index.html?v=admin-entry-1'"),'admin.html must reuse the frozen reservation runtime instead of copying business logic.');
need(admin.includes('admin_entry_bootstrap_v1.js?v=1'),'admin.html must inject the dedicated admin bootstrap.');
need(admin.includes('reservation_firebase_bridge.js?v=1'),'admin.html must preserve the existing administrator reservation Firebase bridge.');
need(!admin.includes('setDoc(')&&!admin.includes('updateDoc(')&&!admin.includes('deleteDoc(')&&!admin.includes('setStore('),'admin.html must remain an entry-only compatibility shell with no data writes.');

need(adminBootstrap.includes("$('adminLoginModal')"),'dedicated admin entry must use the existing admin login modal.');
need(adminBootstrap.includes("$('adminLoginSubmit')"),'dedicated admin entry must preserve the existing login submit control.');
need(adminBootstrap.includes("$('adminPassword')"),'dedicated admin entry must preserve the existing password field.');
need(adminBootstrap.includes("window.openModal==='function'"),'dedicated admin entry must forward to the existing modal behavior when available.');
need(adminBootstrap.includes("#startView")&&adminBootstrap.includes("#customerView")&&adminBootstrap.includes("#successView")&&adminBootstrap.includes("#cancelSuccessView"),'dedicated admin entry must hide customer-only surfaces.');
need(adminBootstrap.includes("#adminLogout"),'dedicated admin entry must return logout to the admin login gate, not the customer landing page.');
need(!adminBootstrap.includes('setDoc(')&&!adminBootstrap.includes('updateDoc(')&&!adminBootstrap.includes('deleteDoc(')&&!adminBootstrap.includes('setStore('),'admin entry bootstrap must be UI-only and must not write reservation data.');

need(customer.includes("fetch('./index.html?v=customer-entry-2'"),'customer.html must reuse the frozen reservation runtime instead of copying booking business logic.');
need(customer.includes("source.replace(adminLoader,customerLoader)"),'customer.html must replace the admin extension loader with the customer-only loader.');
need(customer.includes('customer_features_loader_v1.js?v=1'),'customer.html must use the dedicated customer runtime loader.');
need(customer.includes('customer_entry_bootstrap_v1.js?v=1'),'customer.html must inject the customer-only surface bootstrap.');
need(customer.includes('customer_reservation_firebase_bridge_v1.js?v=1'),'customer.html must replace the shared default Auth bridge with the isolated customer bridge.');
need(customer.includes("source.replace(bridgeMarker,customerMarker)"),'customer.html must replace the frozen bridge injection point at entry time.');
need(!customer.includes('setDoc(')&&!customer.includes('updateDoc(')&&!customer.includes('deleteDoc(')&&!customer.includes('setStore('),'customer.html must remain an entry-only compatibility shell with no data writes.');

need(customerBootstrap.includes('#adminView')&&customerBootstrap.includes('#adminLoginModal'),'customer entry bootstrap must keep administrator surfaces out of the customer entry.');
need(!customerBootstrap.includes('setDoc(')&&!customerBootstrap.includes('updateDoc(')&&!customerBootstrap.includes('deleteDoc(')&&!customerBootstrap.includes('setStore('),'customer entry bootstrap must stay UI-only.');

for(const required of [
  'customer_booking_ux_v24.js?v=31',
  'customer_visit_guide_v16.js?v=31',
  'customer_visit_guide_fix_v20.js?v=31',
  'parking_info_v31.js?v=32',
  'customer_lookup_actions_v1.js?v=2',
  'customer_info_tabs_v1.js?v=4',
  'customer_status_banner_v1.js?v=1',
  'customer_time_guide_guard_v2.js?v=1',
  'customer_playground_booking_guard_v1.js?v=1',
  'customer_holiday_booking_setting_v1.js?v=1',
  'customer_return_home_v1.js?v=1',
  'customer_inquiry_visit_v1.js?v=1',
  'customer_group_minimum_v1.js?v=1',
  'customer_view_tracking_v1.js?v=3',
  'customer_schedule_view_v3.js?v=12',
  'customer_booking_rules_v3.js?v=3',
  'customer_schedule_ui_v5.js?v=5'
])need(customerLoader.includes(required),`customer runtime missing required module: ${required}`);

for(const forbidden of [
  'admin2_part1.txt','admin2_part2.txt','admin2_part3.txt','admin2_part4.txt',
  'admin_features_v3_patch.js','admin_features_v4_patch.js','admin_features_v6_patch.js','admin_features_v9_patch.js',
  'admin_group_search_v2.js','admin_schedule_tab.js','admin_schedule_tab_v14.js',
  'admin_activity_filter_fix_v1.js','admin_tab_active_fix_v1.js','admin_cancel_visibility_v1.js'
])need(!customerLoader.includes(forbidden),`customer runtime must not load admin-only module: ${forbidden}`);

for(const transform of [
  "return el.id==='entryTime';",
  "function openCustomerGuide(control){if(control?.id!=='entryTime')return;if(window.__ZR_ZOO_GUIDE_ACK_ONCE)return;",
  'function acknowledgementOk(control){if(window.__ZR_ZOO_GUIDE_ACK_ONCE)return true;',
  'window.__ZR_ZOO_GUIDE_ACK_ONCE=true;',
  'function interceptBooking(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;',
  'function interceptSubmit(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;',
  'function playAcknowledged(){if(window.__ZR_FINAL_DIRECT_SUBMIT)return true;if(window.__ZR_PLAY_GUIDE_ACK_ONCE)return true;',
  'function openPlayGuide(){if(window.__ZR_PLAY_GUIDE_ACK_ONCE)return;',
  'window.__ZR_PLAY_GUIDE_ACK_ONCE=true;',
  "parking=parking.replace(finalBindNeedle,\"function bindFinal(){\\n  document.addEventListener('click',e=>{\")"
])need(customerLoader.includes(transform),`customer compatibility transform missing: ${transform}`);

for(const required of [
  "CUSTOMER_APP_NAME='zrCustomerReservation'",
  "initializeApp(firebaseConfig,CUSTOMER_APP_NAME)",
  "getAuth(app)",
  "getFirestore(app)",
  "browserLocalPersistence",
  "signInAnonymously(auth)",
  "BOOKING_KEY='zr_bookings'",
  "FULL_COLLECTION='reservations'",
  "AVAIL_COLLECTION='reservationAvailability'",
  "isStaff:()=>false"
])need(customerBridge.includes(required),`isolated customer Firebase bridge contract missing: ${required}`);
need(!customerBridge.includes('signInWithEmailAndPassword'),'customer Firebase bridge must never sign into the administrator account.');
need(!customerBridge.includes("appMod.getApp()"),'customer Firebase bridge must never bind to the administrator default Firebase app.');
need(!customerBridge.includes('adminLoginSubmit')&&!customerBridge.includes('adminLogout'),'customer Firebase bridge must not hook administrator authentication controls.');

need(index.includes("fetch('./data1.txt?v=27'")&&index.includes("fetch('./data2.txt?v=27'"),'frozen reservation runtime loader changed unexpectedly.');
need(index.includes('./admin_features_v2_loader.js?v=31')&&index.includes('./reservation_firebase_bridge.js?v=1'),'compatibility index dependencies changed unexpectedly before cutover.');
need(index.includes(bridgeMarker),'entry compatibility injection point no longer exists in index.html.');

console.log('OK: customer and admin entries share Firestore/data contracts but use isolated Firebase Auth apps; customer entry excludes administrator patch chains and customer zoo/playground guides acknowledge once per page.');
