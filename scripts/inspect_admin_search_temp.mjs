import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const packed=(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8')).replace(/[^A-Za-z0-9+/=]/g,'');
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
for(const needle of ['function renderOutsourcingPayments','outsourceSearch','outsourceStart','function activityFilteredBookings','activityToday']){
  let from=0,count=0;
  while(true){const at=source.indexOf(needle,from);if(at<0)break;count++;console.log(`\n===== ${needle} #${count} @ ${at} =====`);console.log(source.slice(Math.max(0,at-1800),Math.min(source.length,at+7000)));from=at+needle.length;if(count>=4)break}
  if(!count)console.log(`\n===== ${needle} NOT FOUND =====`);
}
