(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_V1=true;

const STORE_KEY='zr_inquiries';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
let installed=false,editIndex=-1;

function toastSafe(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}
  alert(msg);
}
function readInquiries(){
  try{
    const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');
    return Array.isArray(v)?v:[];
  }catch{return []}
}
function writeInquiries(list){
  if(typeof window.setStore==='function')window.setStore(STORE_KEY,list);
  else localStorage.setItem(STORE_KEY,JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'));
}
function contentKey(item){
  for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return k;
  return 'content';
}
function contentOf(item){return String(item?.[contentKey(item)]??'')}
function pick(item,keys){
  for(const k of keys){const v=String(item?.[k]??'').trim();if(v)return v}
  return '';
}
function contactOf(item){
  return pick(item,['mobile','mobilePhone','cellphone','cellPhone','hp','contact','phone'])||pick(item,['phone','tel','telephone']);
}
function nameOf(item){return pick(item,['name','customerName','managerName','inqName','writer'])}
function emailOf(item){return pick(item,['email','inqEmail'])}
function createdOf(item){return pick(item,['createdAt','created','submittedAt','dateTime'])}
function parsePreview(content){
  const text=String(content||'').replace(/\r\n/g,'\n');
  const re=/^\[(사전답사 문의|사전답사 확정)\]\n단체명:\s*(.*?)\n방문 희망일:\s*(\d{4}-\d{2}-\d{2})\n방문 희망시간:\s*([0-2]\d:[0-5]\d)\n사전답사 인원:\s*(\d+)명(?:\n\n)?/;
  const m=text.match(re);if(!m)return null;
  return {confirmed:m[1]==='사전답사 확정',orgName:m[2].trim(),date:m[3],time:m[4],people:Number(m[5]||0),body:text.slice(m[0].length)};
}
function buildPreview(p,body,confirmed){
  return `[${confirmed?'사전답사 확정':'사전답사 문의'}]\n단체명: ${String(p.orgName||'').trim()}\n방문 희망일: ${p.date}\n방문 희망시간: ${p.time}\n사전답사 인원: ${Math.max(1,Math.trunc(Number(p.people)||1))}명\n\n${String(body||'').trim()}`.trimEnd();
}
function previewRows(){
  return readInquiries().map((item,index)=>({item,index,p:parsePreview(contentOf(item))})).filter(x=>x.p);
}
function confirmedByDate(date){return previewRows().filter(x=>x.p.confirmed&&x.p.date===date).length}
window.zrPreviewVisitConfirmedByDate=confirmedByDate;

function installStyle(){
  if($('zrPreviewVisitStyleV1'))return;
  const s=document.createElement('style');s.id='zrPreviewVisitStyleV1';s.textContent=`
  #tab-preview-visit .zr-pv-head{display:flex;gap:10px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}
  #tab-preview-visit .zr-pv-filterbar{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#f8faf8}
  #tab-preview-visit .zr-pv-filterfield{display:grid;gap:5px}
  #tab-preview-visit .zr-pv-filterfield label{margin:0;font-size:11px;color:var(--muted);font-weight:800}
  #tab-preview-visit .zr-pv-filterfield select,#tab-preview-visit .zr-pv-filterfield input{height:40px;min-height:40px;padding:0 10px}
  #tab-preview-visit .zr-pv-filterfield.status select{width:120px}
  #tab-preview-visit .zr-pv-filterfield.date input{width:170px}
  #tab-preview-visit .zr-pv-filter-actions{display:flex;gap:7px;align-items:center}
  #tab-preview-visit .zr-pv-filter-actions button{height:40px;padding:0 13px}
  #tab-preview-visit .zr-pv-list{display:grid;gap:8px}
  #tab-preview-visit .zr-pv-card{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:14px;row-gap:7px;border:1px solid var(--line);border-radius:14px;padding:11px 13px;background:#fff;box-shadow:0 2px 8px rgba(30,50,36,.035)}
  #tab-preview-visit .zr-pv-summary{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden}
  #tab-preview-visit .zr-pv-status{flex:0 0 auto;font-size:11px;font-weight:900;padding:4px 7px;border-radius:999px;background:#fff4df;color:#956200;border:1px solid #ead4a5}
  #tab-preview-visit .zr-pv-status.confirmed{background:#eee9f8;color:#6b50a0;border-color:#d9cdef}
  #tab-preview-visit .zr-pv-org{flex:0 1 auto;min-width:90px;max-width:180px;font-size:15px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #tab-preview-visit .zr-pv-info{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:5px 8px;border-radius:9px;background:#f6f8f6;border:1px solid #e2e8e3;font-size:12px;line-height:1;color:#46544c;white-space:nowrap}
  #tab-preview-visit .zr-pv-info b{font-size:10px;color:#7b8780;font-weight:800}
  #tab-preview-visit .zr-pv-created{margin-left:auto;flex:0 0 auto;font-size:11px;color:var(--muted);white-space:nowrap}
  #tab-preview-visit .zr-pv-line2{min-width:0;color:var(--muted);font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:1px}
  #tab-preview-visit .zr-pv-line2 b{color:#56645c;margin-right:7px;font-size:11px}
  #tab-preview-visit .zr-pv-actions{grid-column:2;grid-row:1/3;display:flex;align-items:center;justify-content:flex-end;gap:7px;align-self:center}
  #tab-preview-visit .zr-pv-actions button{min-width:54px;padding:9px 12px}
  #tab-preview-visit .zr-pv-empty{padding:32px 12px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px;background:#fafbf9}
  #zrPreviewEditModal .zr-pv-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  #zrPreviewEditModal textarea{min-height:120px;resize:vertical}
  #zrPreviewEditModal .zr-pv-readonly{background:#f7f8f6;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.55;color:var(--muted)}
  @media(max-width:900px){
    #tab-preview-visit .zr-pv-summary{gap:6px;overflow-x:auto;scrollbar-width:none}
    #tab-preview-visit .zr-pv-summary::-webkit-scrollbar{display:none}
    #tab-preview-visit .zr-pv-created{display:none}
    #tab-preview-visit .zr-pv-org{min-width:110px;max-width:160px}
  }
  @media(max-width:720px){
    #zrPreviewEditModal .zr-pv-edit-grid{grid-template-columns:1fr}
    #tab-preview-visit .zr-pv-card{padding:10px 11px;column-gap:8px}
    #tab-preview-visit .zr-pv-info{padding:5px 7px}
    #tab-preview-visit .zr-pv-actions button{min-width:50px;padding:8px 10px}
    #tab-preview-visit .zr-pv-filterbar{gap:8px}
    #tab-preview-visit .zr-pv-filterfield.status select{width:105px}
    #tab-preview-visit .zr-pv-filterfield.date input{width:145px}
  }
  `;document.head.appendChild(s);
}
function ensureModal(){
  if($('zrPreviewEditModal'))return;
  const modal=document.createElement('div');modal.id='zrPreviewEditModal';modal.className='modal hidden';modal.innerHTML=`
    <div class="modal-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 style="margin:0">사전답사 내용 수정</h2><button type="button" class="btn-gray" id="zrPreviewEditClose">✕</button></div>
      <div class="zr-pv-edit-grid" style="margin-top:14px">
        <div><label class="req">방문 희망일</label><input type="date" id="zrPreviewEditDate"></div>
        <div><label class="req">방문 희망시간</label><input type="time" step="1800" id="zrPreviewEditTime"></div>
        <div><label class="req">단체명</label><input id="zrPreviewEditOrg"></div>
        <div><label class="req">사전답사 인원</label><input type="number" min="1" step="1" id="zrPreviewEditPeople"></div>
      </div>
      <div style="margin-top:12px"><label>문의자 / 연락처</label><div class="zr-pv-readonly" id="zrPreviewEditContact"></div></div>
      <div style="margin-top:12px"><label>문의내용</label><textarea id="zrPreviewEditBody"></textarea></div>
      <div class="modal-actions"><button type="button" class="btn-gray" id="zrPreviewEditCancel">취소</button><button type="button" class="btn-primary" id="zrPreviewEditSave">수정 저장</button></div>
    </div>`;
  document.body.appendChild(modal);
  $('zrPreviewEditClose').onclick=closeEdit;$('zrPreviewEditCancel').onclick=closeEdit;$('zrPreviewEditSave').onclick=saveEdit;
}
function hideOtherTabs(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('tab-preview-visit')?.classList.remove('hidden');
  if($('zrPreviewVisitTabBtn'))$('zrPreviewVisitTabBtn').className='btn-primary';
}
function formatCreated(v){
  if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function readFilters(){
  return {status:$('zrPreviewStatusFilter')?.value||'all',start:$('zrPreviewStartDateFilter')?.value||'',end:$('zrPreviewEndDateFilter')?.value||''};
}
function validFilters(f){return !(f.start&&f.end&&f.start>f.end)}
function filteredRows(filters){
  const f=filters||readFilters();
  return previewRows().filter(({p})=>{
    if(f.status==='received'&&p.confirmed)return false;
    if(f.status==='confirmed'&&!p.confirmed)return false;
    if(f.start&&p.date<f.start)return false;
    if(f.end&&p.date>f.end)return false;
    return true;
  });
}
function render(filters){
  const list=$('zrPreviewVisitList');if(!list)return;
  const f=filters||readFilters();
  if(!validFilters(f)){toastSafe('조회 시작일은 종료일보다 늦을 수 없습니다.');return}
  const all=previewRows();
  const rows=filteredRows(f).sort((a,b)=>Number(a.p.confirmed)-Number(b.p.confirmed)||String(a.p.date).localeCompare(String(b.p.date))||String(a.p.time).localeCompare(String(b.p.time)));
  $('zrPreviewVisitCount').textContent=`조회 ${rows.length}건 · 전체 ${all.length}건 · 미확정 ${all.filter(x=>!x.p.confirmed).length}건`;
  if(!rows.length){list.innerHTML='<div class="zr-pv-empty">조건에 맞는 사전답사 내역이 없습니다.</div>';return}
  list.innerHTML=rows.map(({item,index,p})=>{
    const name=nameOf(item)||'문의자 미입력',contact=contactOf(item)||'연락처 미입력',body=p.body.replace(/\s+/g,' ').trim()||'문의내용 없음',created=formatCreated(createdOf(item));
    return `<article class="zr-pv-card" data-index="${index}">
      <div class="zr-pv-summary">
        <span class="zr-pv-status ${p.confirmed?'confirmed':''}">${p.confirmed?'확정':'문의접수'}</span>
        <span class="zr-pv-org" title="${esc(p.orgName)}">${esc(p.orgName)}</span>
        <span class="zr-pv-info"><b>방문</b>${esc(p.date)} ${esc(p.time)}</span>
        <span class="zr-pv-info"><b>인원</b>${p.people}명</span>
        <span class="zr-pv-info"><b>문의자</b>${esc(name)}</span>
        <span class="zr-pv-info"><b>연락처</b>${esc(contact)}</span>
        ${created?`<span class="zr-pv-created">접수 ${esc(created)}</span>`:''}
      </div>
      <div class="zr-pv-line2" title="${esc(body)}"><b>문의내용</b>${esc(body)}</div>
      <div class="zr-pv-actions"><button type="button" class="btn-gray" data-pv-edit="${index}">수정</button><button type="button" class="${p.confirmed?'btn-gray':'btn-primary'}" data-pv-confirm="${index}" ${p.confirmed?'disabled':''}>${p.confirmed?'확정완료':'확정'}</button></div>
    </article>`;
  }).join('');
}
function applyFilters(){
  const f=readFilters();
  if(!validFilters(f)){toastSafe('조회 시작일은 종료일보다 늦을 수 없습니다.');return false}
  render(f);return true;
}
function openTab(){hideOtherTabs();render()}
function openEdit(index){
  const list=readInquiries(),item=list[index],p=parsePreview(contentOf(item));if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  editIndex=index;$('zrPreviewEditDate').value=p.date;$('zrPreviewEditTime').value=p.time;$('zrPreviewEditOrg').value=p.orgName;$('zrPreviewEditPeople').value=p.people;$('zrPreviewEditBody').value=p.body;
  const info=[nameOf(item),contactOf(item),emailOf(item)].filter(Boolean).join(' · ')||'문의자 정보 없음';$('zrPreviewEditContact').textContent=info;$('zrPreviewEditModal').classList.remove('hidden');
}
function closeEdit(){$('zrPreviewEditModal')?.classList.add('hidden');editIndex=-1}
function validTime(t){const m=/^(\d{2}):(\d{2})$/.exec(String(t||''));return !!m&&['00','30'].includes(m[2])}
function saveEdit(){
  if(editIndex<0)return;const date=$('zrPreviewEditDate').value,time=$('zrPreviewEditTime').value,org=$('zrPreviewEditOrg').value.trim(),people=Math.trunc(Number($('zrPreviewEditPeople').value)),body=$('zrPreviewEditBody').value;
  if(!date||!time||!org||!Number.isFinite(people)||people<1){toastSafe('방문일, 방문시간, 단체명, 인원을 확인해주세요.');return}
  if(!validTime(time)){toastSafe('방문시간은 30분 단위로 입력해주세요.');return}
  const list=readInquiries(),item=list[editIndex],p=parsePreview(contentOf(item));if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  item[contentKey(item)]=buildPreview({date,time,orgName:org,people},body,p.confirmed);writeInquiries(list);closeEdit();render();toastSafe('사전답사 내용을 수정했습니다.');
}
function confirmPreview(index){
  const list=readInquiries(),item=list[index],p=parsePreview(contentOf(item));if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  if(p.confirmed)return;
  if(!confirm(`${p.orgName} · ${p.date} ${p.time}\n사전답사를 확정할까요?`))return;
  item[contentKey(item)]=buildPreview(p,p.body,true);writeInquiries(list);render();try{window.renderAdmin?.()}catch{};toastSafe('사전답사를 확정했습니다.');
}
function resetFilters(){
  const status=$('zrPreviewStatusFilter'),start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter');
  if(status)status.value='all';if(start)start.value='';if(end)end.value='';render();
}
function installTab(){
  if(installed)return true;const tabs=document.querySelector('#adminView .admin-tabs'),admin=$('adminView');if(!tabs||!admin)return false;installStyle();ensureModal();
  let btn=$('zrPreviewVisitTabBtn');if(!btn){btn=document.createElement('button');btn.id='zrPreviewVisitTabBtn';btn.className='btn-gray';btn.textContent='사전답사 관리';tabs.appendChild(btn)}
  let sec=$('tab-preview-visit');if(!sec){sec=document.createElement('section');sec.id='tab-preview-visit';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><div class="zr-pv-head"><div><h2 style="margin:0 0 4px">사전답사 관리</h2><div class="help">1:1 문의로 접수된 사전답사를 확인하고, 전화 확인 후 내용을 수정·확정할 수 있습니다.</div></div><div class="help" id="zrPreviewVisitCount"></div></div><div class="zr-pv-filterbar"><div class="zr-pv-filterfield date"><label>조회 시작일</label><input type="date" id="zrPreviewStartDateFilter"></div><div class="zr-pv-filterfield date"><label>조회 종료일</label><input type="date" id="zrPreviewEndDateFilter"></div><div class="zr-pv-filterfield status"><label>상태</label><select id="zrPreviewStatusFilter"><option value="all">전체</option><option value="received">접수</option><option value="confirmed">확정</option></select></div><div class="zr-pv-filter-actions"><button type="button" class="btn-primary" id="zrPreviewApplyFilter">조회</button><button type="button" class="btn-gray" id="zrPreviewResetFilter">초기화</button></div></div><div class="zr-pv-list" id="zrPreviewVisitList"></div></div>`;admin.appendChild(sec)}
  btn.onclick=openTab;
  $('zrPreviewApplyFilter').onclick=applyFilters;$('zrPreviewResetFilter').onclick=resetFilters;
  sec.addEventListener('click',e=>{const edit=e.target.closest('[data-pv-edit]'),ok=e.target.closest('[data-pv-confirm]');if(edit)openEdit(Number(edit.dataset.pvEdit));if(ok&&!ok.disabled)confirmPreview(Number(ok.dataset.pvConfirm))});
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#adminView .admin-tabs button');if(b&&b.id!=='zrPreviewVisitTabBtn')sec.classList.add('hidden')},true);
  document.addEventListener('zr:preview-visits-changed',()=>{if(!sec.classList.contains('hidden'))render()});
  installed=true;return true;
}
function boot(){if(installTab())return;let tries=0;const timer=setInterval(()=>{if(installTab()||++tries>25)clearInterval(timer)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();