import fs from 'node:fs';
import zlib from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const a=clean(fs.readFileSync('data1.txt','utf8'));
const b=clean(fs.readFileSync('data2.txt','utf8'));
const html=zlib.gunzipSync(Buffer.from(a+b,'base64')).toString('utf8');

for(const needle of ['submitBooking','confirmCustomerCancel','cancelConfirmModal','successView']){
  let from=0,count=0;
  while(true){
    const at=html.indexOf(needle,from);
    if(at<0)break;
    count++;
    const start=Math.max(0,at-2200),end=Math.min(html.length,at+4200);
    console.log(`\n===== ${needle} occurrence ${count} @ ${at} =====\n`);
    console.log(html.slice(start,end));
    from=at+needle.length;
    if(count>=8)break;
  }
  if(!count)console.log(`\n===== ${needle}: NOT FOUND =====\n`);
}
