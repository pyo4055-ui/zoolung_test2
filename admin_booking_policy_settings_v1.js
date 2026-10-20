(()=>{
'use strict';
if(window.ZRBookingPolicySettings)return;
const $=id=>document.getElementById(id),specs=[['Closure','정기휴무','regularClosurePeriods'],['Peak','성수기','peakSeasonPeriods']];
const drafts=window.ZRAdminDraftOwners||(window.ZRAdminDraftOwners=new Map());
const read=()=>window.settings?.()||{};
const date=v=>{const value=String(v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';const parsed=new Date(value+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:''};
function closureDates(periods){const days=new Set();for(const p of periods||[]){if(!date(p.start)||!date(p.end)||p.start>p.end)continue;for(let d=new Date(p.start+'T00:00:00Z');d.toISOString().slice(0,10)<=p.end;d.setUTCDate(d.getUTCDate()+1))days.add(d.toISOString().slice(0,10))}return [...days].sort().map(d=>({start:d,end:d}))}
function policyRows(key,periods){return (key==='Closure'?closureDates(periods):periods||[]).map(row=>key==='Closure'?'<div data-policy-row class="zr-closure-date-row"><label>휴무일<input type="date" aria-label="휴무일" data-policy-start value="'+date(row.start)+'"></label><button type="button" class="btn-gray" data-policy-remove>날짜 삭제</button></div>':rowHtml(row)).join('')}
function rowHtml(row={}){return `<div class="grid2" data-policy-row style="margin-top:10px"><div><label>시작일</label><input type="date" aria-label="시작일" data-policy-start value="${date(row.start)}"></div><div><label>종료일</label><div style="display:flex;gap:8px;align-items:center"><input type="date" aria-label="종료일" data-policy-end value="${date(row.end)}" style="min-width:0"><button type="button" class="btn-gray" style="flex:0 0 auto;white-space:nowrap" data-policy-remove>기간 삭제</button></div></div></div>`}
async function persist(patch,button){
  if(!window.adminGuard?.(false))return;
  const api=window.zrReservationSettingsFirebaseSyncV1Api;if(!api?.save)return window.toast?.('예약설정 DB 연결을 확인해주세요.');
  button.disabled=true;
  try{if(!await api.save({...read(),...patch},button.id==='zrBookingLeadSave'?'booking-lead':Object.hasOwn(patch,'regularClosurePeriods')?'booking-Closure':'booking-Peak'))throw Error();window.toast?.('예약설정을 저장했습니다.');window.renderVisitDays?.();return true}
  catch{window.toast?.('설정을 저장하지 못했습니다. 연결을 확인한 뒤 다시 저장해주세요.')}
  finally{button.disabled=false}
}
function mount(){
  const section=$('tab-settings'),bar=$('zrSettingsSubtabsV1');if(!section||!bar)return;
  const operation=$('zrSettingsOperationPanelV1');
  if(operation&&!$('zrBookingLeadDays')){
    const card=document.createElement('div');card.className='card';
    card.innerHTML='<h3>예약 사전 마감일</h3><label for="zrBookingLeadDays">오늘부터 예약 가능한 방문일까지</label><select id="zrBookingLeadDays">'+Array.from({length:30},(_,i)=>`<option value="${i+1}">${i+1}일</option>`).join('')+'</select><div class="help" data-zr-help-only style="margin:8px 0">예: 오늘이 10월 3일이고 7일로 설정하면 10월 10일부터 예약 가능합니다. 이전 날짜에는 예약 마감이 표시됩니다.</div><div class="zr-settings-actions"><button type="button" class="btn-primary" id="zrBookingLeadSave">저장</button></div>';
    operation.appendChild(card);$('zrBookingLeadDays').value=String(window.ZRBookingRules.bookingLeadDays(read()));
    $('zrBookingLeadDays').onchange=()=>{$('zrBookingLeadDays').dataset.dirty='1'};
    $('zrBookingLeadSave').onclick=async()=>{const input=$('zrBookingLeadDays');input.disabled=true;try{if(await persist({bookingLeadDays:Number(input.value)},$('zrBookingLeadSave'))){delete input.dataset.dirty;return true}return false}finally{input.disabled=false}};
  }
  if($('zrBookingLeadDays'))drafts.set('booking-lead',{label:'예약 마감일',dirty:()=>!!$('zrBookingLeadDays')?.dataset.dirty,save:()=> $('zrBookingLeadSave').onclick(),discard:()=>{delete $('zrBookingLeadDays').dataset.dirty;mount()}});
  if($('zrBookingLeadDays')&&!$('zrBookingLeadDays').dataset.dirty)$('zrBookingLeadDays').value=String(window.ZRBookingRules.bookingLeadDays(read()));
  for(const [key,label,field] of specs){
    const id=`zrSettings${key}SubtabV1`,panelId=`zrSettings${key}PanelV1`;
    if($(id)){const panel=$(panelId),rows=panel?.querySelector('[data-policy-rows]'),signature=JSON.stringify(read()[field]||[]);if(rows&&!panel.dataset.dirty&&panel.dataset.savedRows!==signature){rows.innerHTML=policyRows(key,read()[field]);panel.dataset.savedRows=signature}continue}
    const button=document.createElement('button');button.type='button';button.id=id;button.dataset.zrSubtabMode=key.toLowerCase();button.textContent=label+' 설정';bar.appendChild(button);
    const panel=document.createElement('div');panel.id=panelId;panel.className='hidden';
    panel.innerHTML=`<div class="card"><h3>${label} 설정</h3><div class="help" data-zr-help-only>${key==='Closure'?'휴무일을 날짜별로 추가해주세요.':'시작일과 종료일을 포함해 예약을 차단합니다.'}</div><div data-policy-rows></div><div class="zr-settings-actions zr-settings-actions-split"><button type="button" class="btn-soft" data-policy-add>${key==='Closure'?'휴무일 추가':'기간 추가'}</button><button type="button" class="btn-primary" data-policy-save>저장</button></div></div>`;
    section.appendChild(panel);const rows=panel.querySelector('[data-policy-rows]');rows.innerHTML=policyRows(key,read()[field]);
    panel.dataset.savedRows=JSON.stringify(read()[field]||[]);
    panel.addEventListener('input',()=>{panel.dataset.dirty='1'});
    panel.querySelector('[data-policy-add]').onclick=()=>{panel.dataset.dirty='1';rows.insertAdjacentHTML('beforeend',key==='Closure'?'<div data-policy-row class="zr-closure-date-row"><label>휴무일<input type="date" aria-label="휴무일" data-policy-start></label><button type="button" class="btn-gray" data-policy-remove>날짜 삭제</button></div>':rowHtml())};
    panel.addEventListener('click',e=>{const row=e.target.closest('[data-policy-remove]')?.closest('[data-policy-row]');if(row){panel.dataset.dirty='1';row.remove()}});
    const save=panel.querySelector('[data-policy-save]');save.onclick=async()=>{
      const periods=[...rows.querySelectorAll('[data-policy-row]')].map(row=>({start:row.querySelector('[data-policy-start]').value,end:key==='Closure'?row.querySelector('[data-policy-start]').value:row.querySelector('[data-policy-end]').value}));
      if(periods.some(r=>!date(r.start)||!date(r.end)||r.start>r.end))return window.toast?.(key==='Closure'?'휴무일을 확인해주세요.':'시작일과 종료일을 확인해주세요.');
      const controls=[...panel.querySelectorAll('input,button')];controls.forEach(el=>el.disabled=true);
      try{if(await persist({[field]:periods},save)){delete panel.dataset.dirty;panel.dataset.savedRows=JSON.stringify(periods);return true}return false}finally{controls.forEach(el=>el.disabled=false)}
    };
    drafts.set('booking-'+key,{label:label+' 설정',dirty:()=>!!panel.dataset.dirty,save:()=>save.onclick(),discard:()=>{delete panel.dataset.dirty;panel.dataset.savedRows='';mount()}});
  }
}
window.ZRBookingPolicySettings=Object.freeze({mount});
window.ZRAdminSettingsViews?.register('booking-policy',mount);
document.addEventListener('zr:admin-runtime-ready',mount);
document.addEventListener('zr:reservation-settings-synced',mount);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
