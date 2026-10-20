import {esc} from './core.js?v=release-1792536903563';

function asDate(value){
  if(!value)return null;
  try{
    if(typeof value.toDate==='function')return value.toDate();
    if(Number.isFinite(value.seconds))return new Date(value.seconds*1000);
    if(Number.isFinite(value._seconds))return new Date(value._seconds*1000);
    const d=new Date(value);
    return Number.isNaN(d.getTime())?null:d;
  }catch{return null}
}
function pad(n){return String(n).padStart(2,'0')}
function timeText(value){
  const d=asDate(value);if(!d)return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function editMetaHtml(group){
 const by=String(group?.onsiteLastModifiedBy||'').trim(),at=timeText(group?.onsiteLastModifiedAt);
 if(!by||!at)return '';
 return `<span class="zr-last-edit" title="${esc('마지막 수정자 '+by+' · '+at)}">마지막 수정 · <strong>${esc(by)}</strong> · ${at}</span>`;
}
