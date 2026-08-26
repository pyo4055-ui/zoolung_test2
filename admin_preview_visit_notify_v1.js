(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_NOTIFY_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_NOTIFY_V1=true;

const INQUIRY_KEY='zr_inquiries';
const TEMPLATE_KEY='zr_preview_confirm_templates_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false,currentIndex=-1,templateEditId='';

function toastSafe(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}
  alert(msg);
}
function readInquiries(){
  try{const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function writeInquiries(list){
  if(typeof window.setStore==='function')window.setStore(INQUIRY_KEY,list);
  else localStorage.setItem(INQUIRY_KEY,JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'));
}
function readTemplates(){
  try{const v=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]}
  catch{return []}
}
function writeTemplates(list){
  localStorage.setItem(TEMPLATE_KEY,JSON.stringify(list));
  refreshTemplateSelect();renderTemplates();
}
function contentKey(item){
  for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return k;
  return 'content';
}
function contentOf(item){return String(item?.[contentKey(item)]??'')}
function pick(item,keys){for(const k of keys){const v=String(item?.[k]??'').trim();if(v)return v}return''}
function contactOf(item){return pick(item,['mobile','mobilePhone','cellphone','cellPhone','hp','contact','inqMobile'])||pick(item,['phone','inqPhone','tel','telephone'])}
function nameOf(item){return pick(item,['name','customerName','managerName','inqName','writer'])}
function parsePreview(content){
  const text=String(content||'').replace(/\r\n/g,'\n');
  const re=/^\[(사전답사 문의|사전답사 확정)\]\n단체명:\s*(.*?)\n방문 희망일:\s*(\d{4}-\d{2}-\d{2})\n방문 희망시간:\s*([0-2]\d:[0-5]\d)\n사전답사 인원:\s*(\d+)명(?:\n\n)?/;
  const m=text.match(re);if(!m)return null;
  return {confirmed:m[1]==='사전답사 확정',orgName:m[2].trim(),date:m[3],time:m[4],people:Number(m[5]||0),body:text.slice(m[0].length)};
}
function buildPreview(p,body,confirmed){
  return `[${confirmed?'사전답사 확정':'사전답사 문의'}]\n단체명: ${String(p.orgName||'').trim()}\n방문 희망일: ${p.date}\n방문 희망시간: ${p.time}\n사전답사 인원: ${Math.max(1,Math.trunc(Number(p.people)||1))}명\n\n${String(body||'').trim()}`.trimEnd();
}
function applyVars(text,p){
  return String(text||'')
    .replaceAll('{단체명}',String(p?.orgName||''))
    .replaceAll('{방문일}',String(p?.date||''))
    .replaceAll('{방문시간}',String(p?.time||''))
    .replaceAll('{인원}',String(p?.people||''));
}
function defaultMessage(p){
  return `사전답사 일정이 확정되었습니다.\n단체명: ${p.orgName}\n방문일시: ${p.date} ${p.time}\n사전답사 인원: ${p.people}명`;
}
function smsUrl(phone,text){
  const number=String(phone||'').replace(/[^0-9+]/g,'');
  const body=encodeURIComponent(text),ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  return `sms:${number}${ios?'&':'?'}body=${body}`;
}

function installStyle(){
  if($('zrPreviewNotifyStyleV1'))return;
  const s=document.createElement('style');s.id='zrPreviewNotifyStyleV1';s.textContent=`
    #zrPreviewNotifyInnerTabs{display:inline-flex;align-items:center;gap:4px;margin:14px 0 8px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04)}
    #zrPreviewNotifyInnerTabs button{position:relative;min-width:118px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1!important}
    #zrPreviewNotifyInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}
    #zrPreviewNotifyInnerTabs button.btn-primary::after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
    #zrPreviewNotifyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}
    #zrPreviewNotifyTemplatePanel{margin-top:12px;padding:20px 22px 18px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:20px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-head h2{margin:0;font-size:22px;line-height:1.25}
    #zrPreviewNotifyTemplatePanel .zr-pvn-editor{display:grid;grid-template-columns:minmax(180px,260px) minmax(0,1fr) auto;gap:10px;align-items:end;margin-bottom:18px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-editor textarea{min-height:82px;resize:vertical}
    #zrPreviewNotifyTemplatePanel .zr-pvn-list{display:grid;gap:8px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:13px;padding:11px 13px;background:#fff}
    #zrPreviewNotifyTemplatePanel .zr-pvn-title{font-weight:900;margin-bottom:4px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-text{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #zrPreviewNotifyTemplatePanel .zr-pvn-actions{display:flex;gap:7px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-empty{padding:28px 12px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px;background:#fafbf9}
    #zrPreviewNotifyModal .modal-card{width:min(760px,100%)}
    #zrPreviewNotifyModal .zr-pvn-source{border:1px solid var(--line);border-radius:13px;background:#f8faf8;padding:12px 14px;font-size:13px;line-height:1.65;color:#46544c}
    #zrPreviewNotifyModal .zr-pvn-source b{color:var(--text)}
    #zrPreviewNotifyModal textarea{min-height:150px;resize:vertical}
    #zrPreviewNotifyModal .zr-pvn-review{border:1px solid var(--line);border-radius:14px;background:#fafcf9;padding:14px 15px}
    #zrPreviewNotifyModal .zr-pvn-review-row{padding:9px 0;border-bottom:1px solid #e7ece8}
    #zrPreviewNotifyModal .zr-pvn-review-row:last-child{border-bottom:0}
    #zrPreviewNotifyModal .zr-pvn-review-row span{display:block;font-size:11px;font-weight:800;color:var(--muted);margin-bottom:4px}
    #zrPreviewNotifyModal .zr-pvn-review-row div{font-size:14px;font-weight:800;line-height:1.55;white-space:pre-wrap;word-break:break-word}
    @media(max-width:720px){
      #zrPreviewNotifyInnerTabs{display:grid;grid-template-columns:1fr 1fr;width:100%;box-sizing:border-box}
      #zrPreviewNotifyInnerTabs button{width:100%;min-width:0}
      #zrPreviewNotifyTemplatePanel{padding:16px 14px}
      #zrPreviewNotifyTemplatePanel .zr-pvn-editor{grid-template-columns:1fr}
    }
  `;document.head.appendChild(s);
}

function directPreviewPanel(tab){return [...tab.children].find(el=>el.classList?.contains('zr-pv-panel'))||null}
function setSubtab(mode){
  const tab=$('tab-preview-visit'),panel=tab?directPreviewPanel(tab):null,templates=$('zrPreviewNotifyTemplatePanel');
  if(!tab||!panel||!templates)return;
  const templateOpen=mode==='templates';
  panel.classList.toggle('hidden',templateOpen);templates.classList.toggle('hidden',!templateOpen);
  if($('zrPreviewNotifyVisitSubtab'))$('zrPreviewNotifyVisitSubtab').className=templateOpen?'btn-gray':'btn-primary';
  if($('zrPreviewNotifyTemplateSubtab'))$('zrPreviewNotifyTemplateSubtab').className=templateOpen?'btn-primary':'btn-gray';
  if(templateOpen)renderTemplates();
}
function ensureSubtabs(){
  const tab=$('tab-preview-visit'),panel=tab?directPreviewPanel(tab):null;if(!tab||!panel)return false;
  let nav=$('zrPreviewNotifyInnerTabs');
  if(!nav){
    nav=document.createElement('div');nav.id='zrPreviewNotifyInnerTabs';nav.setAttribute('aria-label','사전답사 관리 내부 메뉴');
    nav.innerHTML='<button type="button" class="btn-primary" id="zrPreviewNotifyVisitSubtab">사전답사 현황</button><button type="button" class="btn-gray" id="zrPreviewNotifyTemplateSubtab">확정문자 예시</button>';
    tab.insertBefore(nav,panel);
  }
  let templates=$('zrPreviewNotifyTemplatePanel');
  if(!templates){
    templates=document.createElement('div');templates.id='zrPreviewNotifyTemplatePanel';templates.className='card hidden';
    templates.innerHTML=`<div class="zr-pvn-head"><div><h2>확정문자 예시 관리</h2><div class="help" style="margin-top:6px">자주 사용하는 사전답사 확정 문자를 저장해두고 확정할 때 불러올 수 있습니다. {단체명}, {방문일}, {방문시간}, {인원}을 사용할 수 있습니다.</div></div></div><div class="zr-pvn-editor"><div><label>예시 제목</label><input id="zrPreviewNotifyTemplateTitle" placeholder="ex) 사전답사 기본 확정 안내"></div><div><label>문자내용</label><textarea id="zrPreviewNotifyTemplateText" placeholder="ex) {단체명} 사전답사 일정이 확정되었습니다.\n방문일시: {방문일} {방문시간}"></textarea></div><div style="display:flex;gap:7px"><button type="button" class="btn-gray hidden" id="zrPreviewNotifyTemplateCancel">취소</button><button type="button" class="btn-primary" id="zrPreviewNotifyTemplateSave">예시 저장</button></div></div><div class="zr-pvn-list" id="zrPreviewNotifyTemplateList"></div>`;
    tab.appendChild(templates);
  }
  $('zrPreviewNotifyVisitSubtab').onclick=()=>setSubtab('visits');
  $('zrPreviewNotifyTemplateSubtab').onclick=()=>setSubtab('templates');
  $('zrPreviewNotifyTemplateSave').onclick=saveTemplate;$('zrPreviewNotifyTemplateCancel').onclick=resetTemplateEditor;
  if(templates.dataset.zrBound!=='1'){
    templates.dataset.zrBound='1';templates.addEventListener('click',e=>{
      const edit=e.target.closest('[data-pvn-template-edit]'),del=e.target.closest('[data-pvn-template-delete]');
      if(edit)editTemplate(edit.dataset.pvnTemplateEdit);if(del)deleteTemplate(del.dataset.pvnTemplateDelete);
    });
  }
  return true;
}

function refreshTemplateSelect(){
  const sel=$('zrPreviewNotifyTemplate');if(!sel)return;
  const cur=sel.value,templates=readTemplates();
  sel.innerHTML='<option value="">확정문자 예시 선택</option>'+templates.map(t=>`<option value="${esc(t.id)}">${esc(t.title||'제목 없음')}</option>`).join('');
  if(templates.some(t=>String(t.id)===cur))sel.value=cur;
}
function renderTemplates(){
  const list=$('zrPreviewNotifyTemplateList');if(!list)return;const templates=readTemplates();
  if(!templates.length){list.innerHTML='<div class="zr-pvn-empty">저장된 확정문자 예시가 없습니다.</div>';return}
  list.innerHTML=templates.map(t=>`<article class="zr-pvn-card"><div><div class="zr-pvn-title">${esc(t.title||'제목 없음')}</div><div class="zr-pvn-text" title="${esc(t.text||'')}">${esc(t.text||'')}</div></div><div class="zr-pvn-actions"><button type="button" class="btn-gray" data-pvn-template-edit="${esc(t.id)}">수정</button><button type="button" class="btn-gray" data-pvn-template-delete="${esc(t.id)}">삭제</button></div></article>`).join('');
}
function resetTemplateEditor(){
  templateEditId='';if($('zrPreviewNotifyTemplateTitle'))$('zrPreviewNotifyTemplateTitle').value='';if($('zrPreviewNotifyTemplateText'))$('zrPreviewNotifyTemplateText').value='';
  if($('zrPreviewNotifyTemplateSave'))$('zrPreviewNotifyTemplateSave').textContent='예시 저장';$('zrPreviewNotifyTemplateCancel')?.classList.add('hidden');
}
function saveTemplate(){
  const title=$('zrPreviewNotifyTemplateTitle')?.value.trim()||'',text=$('zrPreviewNotifyTemplateText')?.value.trim()||'';
  if(!title||!text){toastSafe('확정문자 예시 제목과 내용을 모두 입력해주세요.');return}
  const list=readTemplates();
  if(templateEditId){const t=list.find(x=>String(x.id)===String(templateEditId));if(t){t.title=title;t.text=text;t.updatedAt=new Date().toISOString()}}
  else list.push({id:`pvt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,title,text,updatedAt:new Date().toISOString()});
  writeTemplates(list);resetTemplateEditor();toastSafe('확정문자 예시를 저장했습니다.');
}
function editTemplate(id){
  const t=readTemplates().find(x=>String(x.id)===String(id));if(!t)return;templateEditId=String(t.id);
  $('zrPreviewNotifyTemplateTitle').value=t.title||'';$('zrPreviewNotifyTemplateText').value=t.text||'';$('zrPreviewNotifyTemplateSave').textContent='수정 저장';$('zrPreviewNotifyTemplateCancel').classList.remove('hidden');$('zrPreviewNotifyTemplateTitle').focus();
}
function deleteTemplate(id){
  const list=readTemplates(),t=list.find(x=>String(x.id)===String(id));if(!t)return;
  if(!confirm(`확정문자 예시 '${t.title}'을 삭제할까요?`))return;
  writeTemplates(list.filter(x=>String(x.id)!==String(id)));if(templateEditId===String(id))resetTemplateEditor();toastSafe('확정문자 예시를 삭제했습니다.');
}

function ensureNotifyModal(){
  if($('zrPreviewNotifyModal'))return;
  const modal=document.createElement('div');modal.id='zrPreviewNotifyModal';modal.className='modal hidden';modal.innerHTML=`<div class="modal-card"><div id="zrPreviewNotifyCompose"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 style="margin:0">사전답사 확정 안내</h2><button type="button" class="btn-gray" id="zrPreviewNotifyClose">✕</button></div><div class="zr-pvn-source" id="zrPreviewNotifySource" style="margin-top:14px"></div><div style="margin-top:14px"><label>확정문자 예시 불러오기</label><select id="zrPreviewNotifyTemplate"><option value="">확정문자 예시 선택</option></select></div><div style="margin-top:12px"><label class="req">문자내용</label><textarea id="zrPreviewNotifyText"></textarea></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrPreviewNotifyCancel">취소</button><button type="button" class="btn-primary" id="zrPreviewNotifyReviewBtn">확정하기</button></div></div><div id="zrPreviewNotifyReview" class="hidden"><h2 style="margin:0 0 8px">확정 내용 확인</h2><div class="help" style="margin-bottom:14px">사전답사를 확정하고 문자 앱을 열기 전에 내용을 한 번 더 확인해주세요.</div><div class="zr-pvn-review"><div class="zr-pvn-review-row"><span>수신번호</span><div id="zrPreviewNotifyReviewPhone"></div></div><div class="zr-pvn-review-row"><span>방문 일정</span><div id="zrPreviewNotifyReviewVisit"></div></div><div class="zr-pvn-review-row"><span>문자내용</span><div id="zrPreviewNotifyReviewText"></div></div></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrPreviewNotifyBack">수정하기</button><button type="button" class="btn-primary" id="zrPreviewNotifySend">보내기</button></div></div></div>`;
  document.body.appendChild(modal);
  $('zrPreviewNotifyClose').onclick=closeNotify;$('zrPreviewNotifyCancel').onclick=closeNotify;$('zrPreviewNotifyBack').onclick=()=>showNotifyStage('compose');$('zrPreviewNotifyReviewBtn').onclick=reviewNotify;$('zrPreviewNotifySend').onclick=sendNotify;
  $('zrPreviewNotifyTemplate').onchange=e=>{
    const t=readTemplates().find(x=>String(x.id)===String(e.target.value));if(!t||currentIndex<0)return;
    const item=readInquiries()[currentIndex],p=item?parsePreview(contentOf(item)):null;if(p)$('zrPreviewNotifyText').value=applyVars(t.text,p);
  };
  refreshTemplateSelect();
}
function showNotifyStage(stage){$('zrPreviewNotifyCompose')?.classList.toggle('hidden',stage!=='compose');$('zrPreviewNotifyReview')?.classList.toggle('hidden',stage!=='review')}
function openNotify(index){
  const item=readInquiries()[index],p=item?parsePreview(contentOf(item)):null;if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  if(p.confirmed){toastSafe('이미 확정된 사전답사입니다.');return}
  currentIndex=index;refreshTemplateSelect();$('zrPreviewNotifyTemplate').value='';$('zrPreviewNotifyText').value=defaultMessage(p);
  const name=nameOf(item)||'문의자 미입력',contact=contactOf(item)||'연락처 미입력';
  $('zrPreviewNotifySource').innerHTML=`<b>${esc(p.orgName)}</b> · ${esc(name)} · ${esc(contact)}<br>방문 ${esc(p.date)} ${esc(p.time)} · ${p.people}명`;
  showNotifyStage('compose');$('zrPreviewNotifyModal').classList.remove('hidden');
}
function closeNotify(){$('zrPreviewNotifyModal')?.classList.add('hidden');currentIndex=-1;showNotifyStage('compose')}
function reviewNotify(){
  if(currentIndex<0)return;const item=readInquiries()[currentIndex],p=item?parsePreview(contentOf(item)):null,text=$('zrPreviewNotifyText')?.value.trim()||'';
  if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  if(p.confirmed){toastSafe('이미 확정된 사전답사입니다.');closeNotify();return}
  const phone=contactOf(item);if(!phone){toastSafe('휴대폰번호가 없어 확정 문자를 연결할 수 없습니다.');return}
  if(!text){toastSafe('문자내용을 입력해주세요.');$('zrPreviewNotifyText')?.focus();return}
  $('zrPreviewNotifyReviewPhone').textContent=phone;$('zrPreviewNotifyReviewVisit').textContent=`${p.orgName} · ${p.date} ${p.time} · ${p.people}명`;$('zrPreviewNotifyReviewText').textContent=`[주렁주렁 동탄점]\n${text}`;showNotifyStage('review');
}
function sendNotify(){
  if(currentIndex<0)return;const list=readInquiries(),item=list[currentIndex],p=item?parsePreview(contentOf(item)):null,body=$('zrPreviewNotifyText')?.value.trim()||'';
  if(!item||!p){toastSafe('사전답사 문의를 찾지 못했습니다.');return}
  if(p.confirmed){toastSafe('이미 확정된 사전답사입니다.');closeNotify();return}
  const phone=contactOf(item);if(!phone||!body)return reviewNotify();
  item[contentKey(item)]=buildPreview(p,p.body,true);writeInquiries(list);try{window.renderAdmin?.()}catch{}
  const smsText=`[주렁주렁 동탄점]\n${body}`;closeNotify();
  if(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&navigator.clipboard?.writeText){navigator.clipboard.writeText(smsText).catch(()=>{});toastSafe('사전답사를 확정했습니다. PC에서는 문자내용도 복사됩니다.')}
  window.location.href=smsUrl(phone,smsText);
}

function install(){
  if(installed)return true;const tab=$('tab-preview-visit'),tabBtn=$('zrPreviewVisitTabBtn');if(!tab||!tabBtn)return false;
  installStyle();ensureNotifyModal();if(!ensureSubtabs())return false;
  if(tab.dataset.zrPreviewNotifyBound!=='1'){
    tab.dataset.zrPreviewNotifyBound='1';tab.addEventListener('click',e=>{
      const btn=e.target?.closest?.('[data-pv-confirm]');if(!btn||btn.disabled)return;
      e.preventDefault();e.stopImmediatePropagation();openNotify(Number(btn.dataset.pvConfirm));
    },true);
  }
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#adminView .admin-tabs button');if(b?.id==='zrPreviewVisitTabBtn')setTimeout(()=>setSubtab('visits'),0)},true);
  window.addEventListener('storage',e=>{if(e.key===TEMPLATE_KEY){refreshTemplateSelect();renderTemplates()}});
  setSubtab('visits');installed=true;return true;
}
function boot(){if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
