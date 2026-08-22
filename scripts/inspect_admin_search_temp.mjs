import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const packed=(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8')).replace(/[^A-Za-z0-9+/=]/g,'');
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const admin2=['admin2_part1.txt','admin2_part2.txt','admin2_part3.txt','admin2_part4.txt'].map(x=>fs.readFileSync(x,'utf8')).join('');
for(const [label,text,needles] of [
  ['base',source,['function activityFilteredBookings','activityToday']],
  ['admin2',admin2,['renderOutsourcingPayments','outsourceSearch','outsourceStart','outsourceVendorFilter','outsourceList']]
]){
  for(const needle of needles){
    let from=0,count=0;
    while(true){const at=text.indexOf(needle,from);if(at<0)break;count++;console.log(`\n===== ${label} ${needle} #${count} @ ${at} =====`);console.log(text.slice(Math.max(0,at-2200),Math.min(text.length,at+8000)));from=at+needle.length;if(count>=5)break}
    if(!count)console.log(`\n===== ${label} ${needle} NOT FOUND =====`);
  }
}
