(()=>{
'use strict';
if(window.ZRDisplaySafety)return;
function html(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// Only for values inside quoted JavaScript arguments in legacy HTML handlers.
// HTML entity encoding alone is insufficient: the browser decodes it first.
function inlineString(value){return String(value??'').replace(/[\\'"<>&\r\n\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))}
function httpUrl(value){
 const text=String(value??'').trim();if(!/^https?:\/\//i.test(text)||/[\u0000-\u0020\u007f]/.test(text))return '';
 try{const url=new URL(text);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?text:''}catch{return ''}
}
window.ZRDisplaySafety=Object.freeze({html,inlineString,httpUrl});
})();
