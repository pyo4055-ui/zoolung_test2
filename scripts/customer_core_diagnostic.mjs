import fs from 'node:fs';
import zlib from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const a=clean(fs.readFileSync('data1.txt','utf8'));
const b=clean(fs.readFileSync('data2.txt','utf8'));
const html=zlib.gunzipSync(Buffer.from(a+b,'base64')).toString('utf8');

function dump(text,label,needles,before=1500,after=3800){
  for(const needle of needles){
    let from=0,count=0;
    while(true){
      const at=text.indexOf(needle,from);if(at<0)break;count++;
      console.log(`\n===== ${label}: ${needle} occurrence ${count} @ ${at} =====\n`);
      console.log(text.slice(Math.max(0,at-before),Math.min(text.length,at+after)));
      from=at+needle.length;if(count>=4)break;
    }
    if(!count)console.log(`\n===== ${label}: ${needle}: NOT FOUND =====\n`);
  }
}

dump(html,'CORE',['function bookingData','function setStore','function addActivity','submitBooking','confirmCustomerCancel']);
const parking=fs.readFileSync('parking_info_v31.js','utf8');
dump(parking,'PARKING',['function bindFinal','submitBypass','pendingButton','__ZR_FINAL_DIRECT_SUBMIT'],1200,5000);
const bridge=fs.readFileSync('customer_reservation_firebase_bridge_v1.js','utf8');
dump(bridge,'BRIDGE',['function queueBookingSync','function patchSetStore','writeChain=writeChain.then','function clean'],1200,5000);
