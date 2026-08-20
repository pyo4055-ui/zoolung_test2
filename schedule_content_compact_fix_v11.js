(()=>{
'use strict';
if(window.__ZR_SCHEDULE_CONTENT_COMPACT_FIX_V11)return;window.__ZR_SCHEDULE_CONTENT_COMPACT_FIX_V11=true;
const short={f4:'4F',f5:'5F',meal:'식',play:'놀'};let pending=false;
function typeOf(el){const t=el.getAttribute('title')||'';if(t.startsWith('4F 베이직 '))return'f4';if(t.startsWith('5F 워터가든 '))return'f5';if(t.startsWith('식사 '))return'meal';if(t.startsWith('놀이터 '))return'play';return t.match(/^(custom_[^ ]+)\s/)?.[1]||''}
function fix(){document.querySelectorAll('#tab-schedule .zrsc-seg.compact').forEach(el=>{const b=el.querySelector('b');if(!b)return;const t=typeOf(el);b.textContent=short[t]||(b.textContent||'').slice(0,2)})}
function run(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fix()})}
function boot(){run();new MutationObserver(run).observe(document.getElementById('adminView')||document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
