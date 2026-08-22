import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const packed=(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8')).replace(/[^A-Za-z0-9+/=]/g,'');
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const needles=['function activityFilteredBookings','function renderActivity','function customerMatches','function openCustomerCancel','checkExisting.onclick','cancelExisting.onclick','cancelledBy','status===\'cancelled\'','status!==\'cancelled\''];
for(const needle of needles){
 let at=source.indexOf(needle);console.log(`\n===== ${needle} @ ${at} =====`);if(at>=0)console.log(source.slice(Math.max(0,at-1700),Math.min(source.length,at+6000)));
}
