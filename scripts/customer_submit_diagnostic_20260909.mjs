import fs from 'node:fs';
import zlib from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const a=clean(fs.readFileSync('data1.txt','utf8'));
const b=clean(fs.readFileSync('data2.txt','utf8'));
const html=zlib.gunzipSync(Buffer.from(a+b,'base64')).toString('utf8');

function excerpt(needle,before=1800,after=5200,max=8){
  const out=[];
  let from=0,count=0;
  while(count<max){
    const at=html.indexOf(needle,from);
    if(at<0)break;
    count++;
    out.push(`===== ${needle} #${count} @ ${at} =====\n${html.slice(Math.max(0,at-before),Math.min(html.length,at+after))}`);
    from=at+needle.length;
  }
  if(!out.length)out.push(`===== ${needle}: NOT FOUND =====`);
  return out.join('\n\n');
}

const sections=[
  excerpt('submitBooking',2200,7000,10),
  excerpt('bookingResult',1800,5000,8),
  excerpt('successView',1800,5000,8),
  excerpt('function bookingData',1400,6200,4),
  excerpt('function setStore',1400,4800,4),
  excerpt('.disabled',700,1800,30),
  excerpt('disabled = true',900,2200,20),
  excerpt('disabled=true',900,2200,20),
  excerpt('zr_bookings',1200,3800,10)
];
let output=sections.join('\n\n--------------------\n\n');
if(output.length>90000)output=output.slice(0,90000)+'\n[TRUNCATED]';
fs.writeFileSync('diagnostic_output.txt',output,'utf8');
console.log('wrote diagnostic_output.txt',output.length);
