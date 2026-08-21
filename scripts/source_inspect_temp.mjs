import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const packed=clean(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8'));
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const needles=['3. 예약 취소','예약 내역 취소','예약취소','예약 취소','cancelConfirmModal','existingBookingList','cancelSuccessView'];
for(const needle of needles){
  let from=0,count=0;
  while(true){
    const at=source.indexOf(needle,from);
    if(at<0)break;
    count++;
    console.log(`\n===== SOURCE INSPECT: ${needle} #${count} @ ${at} =====`);
    console.log(source.slice(Math.max(0,at-900),Math.min(source.length,at+1800)));
    from=at+needle.length;
    if(count>=5)break;
  }
  if(!count)console.log(`\n===== SOURCE INSPECT: ${needle} NOT FOUND =====`);
}
