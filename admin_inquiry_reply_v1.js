(()=>{
'use strict';
if(window.__ZR_ADMIN_INQUIRY_REPLY_V1)return;
window.__ZR_ADMIN_INQUIRY_REPLY_V1=true;

const INQUIRY_KEY='zr_inquiries';
const TEMPLATE_KEY='zr_inquiry_reply_templates_v1';
const REPLY_MARKER='\n\n[관리자 답변]\n';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false,inquiryTabButton=null,currentReplyIndex=-1,templateEditId='';

function toastSafe(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}
  alert(msg);
}
function seoulDate(){
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    const y=get('year'),m=get('month'),d=get('day');
    if(y&&m&&d)return `${y}-${m}-${d}`;
  }catch{}
  const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function dateOnly(v){const m=String(v||'').match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:''}
function formatCreated(v){
  if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function readInquiries(){
  try{const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function writeInquiries(list){
  if(typeof window.setStore==='function')window.setStore(INQUIRY_KEY,list);
  else localStorage.setItem(INQUIRY_KEY,JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('zr:inquiry-replies-changed'));
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
function nameOf(item){return pick(item,['name','customerName','managerName','inqName','writer'])}
function mobileOf(item){return pick(item,['mobile','mobilePhone','cellphone','cellPhone','hp','inqMobile','contact'])||pick(item,['phone','inqPhone','tel','telephone'])}
function emailOf(item){return pick(item,['email','inqEmail'])}
function createdOf(item){return pick(item,['createdAt','created','submittedAt','dateTime'])}
function isPreviewInquiry(item){return /^\[(사전답사 문의|사전답사 확정)\]/.test(contentOf(item))}
function splitReply(content){
  const text=String(content||''),i=text.lastIndexOf(REPLY_MARKER);
  if(i<0)return {question:text.trim(),replied:false,reply:'',repliedAt:''};
  const question=text.slice(0,i).trim(),tail=text.slice(i+REPLY_MARKER.length);
  const m=tail.match(/^답변일:\s*(.*?)\n답변내용:\n([\s\S]*)$/);
  return {question,replied:true,repliedAt:String(m?.[1]||'').trim(),reply:String(m?.[2]??tail).trim()};
}
function parseGroupQuestion(text){
  const q=String(text||'').replace(/\r\n/g,'\n');
  const re=/^\[단체 문의\]\n단체명:\s*(.*?)\n방문 희망일:\s*(\d{4}-\d{2}-\d{2})\n방문 희망시간:\s*([0-2]\d:[0-5]\d)\n단체 인원:\s*(\d+)명(?:\n\n)?/;
  const m=q.match(re);if(!m)return null;
  return {orgName:m[1].trim(),date:m[2],time:m[3],people:Number(m[4]||0),body:q.slice(m[0].length).trim()};
}
function inquiryInfo(item){
  const split=splitReply(contentOf(item)),group=parseGroupQuestion(split.question);
  return {
    replied:split.replied,reply:split.reply,repliedAt:split.repliedAt,
    orgName:group?.orgName||pick(item,['orgName','groupName','organization'])||'단체명 미입력',
    date:group?.date||'',time:group?.time||'',people:group?.people||0,
    body:group?.body||split.question.replace(/^\[[^\]]+\]\s*/,'').trim()||'문의내용 없음',
    name:nameOf(item)||'문의자 미입력',mobile:mobileOf(item)||'',email:emailOf(item),created:createdOf(item),createdDate:dateOnly(createdOf(item))
  };
}
function generalRows(){
  return readInquiries().map((item,index)=>({item,index,info:inquiryInfo(item)})).filter(x=>!isPreviewInquiry(x.item));
}
function readFilters(){return {start:$('zrInquiryStart')?.value||'',end:$('zrInquiryEnd')?.value||'',status:$('zrInquiryStatus')?.value||'all'}}
function validFilters(f){return !(f.start&&f.end&&f.start>f.end)}
function filteredRows(f){
  return generalRows().filter(x=>{
    if(f.status==='pending'&&x.info.replied)return false;
    if(f.status==='done'&&!x.info.replied)return false;
    const d=x.info.createdDate;
    if(f.start&&(!d||d<f.start))return false;
    if(f.end&&(!d||d>f.end))return false;
    return true;
  }).sort((a,b)=>Number(a.info.replied)-Number(b.info.replied)||String(b.info.created||'').localeCompare(String(a.info.created||'')));
}

function installStyle(){
  if($('zrInquiryReplyStyleV1'))return;
  const s=document.createElement('style');s.id='zrInquiryReplyStyleV1';s.textContent=`
  #tab-inquiry-reply-v1 .zr-ir-panel,#tab-inquiry-reply-examples .zr-ir-panel{padding:20px 22px 18px}
  #tab-inquiry-reply-v1 .zr-ir-head,#tab-inquiry-reply-examples .zr-ir-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px}
  #tab-inquiry-reply-v1 .zr-ir-head h2,#tab-inquiry-reply-examples .zr-ir-head h2{margin:0;font-size:22px;line-height:1.25}
  #tab-inquiry-reply-v1 .zr-ir-count{align-self:center;color:var(--muted);font-size:12px;white-space:nowrap}
  #tab-inquiry-reply-v1 .zr-ir-filterbar{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px 12px;align-items:end}
  #tab-inquiry-reply-v1 .zr-ir-field{display:flex;flex-direction:column;gap:5px;min-width:0;align-self:end}
  #tab-inquiry-reply-v1 .zr-ir-field label{min-height:15px;display:flex;align-items:flex-end;margin:0;font-size:12px;line-height:15px;font-weight:800;color:var(--text)}
  #tab-inquiry-reply-v1 .zr-ir-field input,#tab-inquiry-reply-v1 .zr-ir-field select{width:100%;height:44px;min-height:44px;margin:0;box-sizing:border-box}
  #tab-inquiry-reply-v1 .zr-ir-field.start{grid-column:1/4}#tab-inquiry-reply-v1 .zr-ir-field.end{grid-column:4/7}
  #tab-inquiry-reply-v1 .zr-ir-field.status{grid-column:7/10}
  #tab-inquiry-reply-v1 #zrInquiryApply{grid-column:10/13;width:100%;height:44px;min-height:44px;margin:0;align-self:end}
  #tab-inquiry-reply-v1 .zr-ir-help{margin:12px 0 18px;font-size:12px;line-height:1.55;color:var(--muted)}
  #tab-inquiry-reply-v1 .zr-ir-list{display:grid;gap:8px}
  #tab-inquiry-reply-v1 .zr-ir-card{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:14px;row-gap:7px;border:1px solid var(--line);border-radius:14px;padding:11px 13px;background:#fff;box-shadow:0 2px 8px rgba(30,50,36,.035)}
  #tab-inquiry-reply-v1 .zr-ir-summary{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden}
  #tab-inquiry-reply-v1 .zr-ir-status{flex:0 0 auto;font-size:11px;font-weight:900;padding:4px 7px;border-radius:999px;background:#fff4df;color:#956200;border:1px solid #ead4a5}
  #tab-inquiry-reply-v1 .zr-ir-status.done{background:#e8f3ed;color:#2f6b4f;border-color:#cfe2d6}
  #tab-inquiry-reply-v1 .zr-ir-org{flex:0 1 auto;min-width:90px;max-width:180px;font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #tab-inquiry-reply-v1 .zr-ir-info{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:5px 8px;border-radius:9px;background:#f6f8f6;border:1px solid #e2e8e3;font-size:12px;line-height:1;color:#46544c;white-space:nowrap}
  #tab-inquiry-reply-v1 .zr-ir-info b{font-size:10px;color:#7b8780;font-weight:800}
  #tab-inquiry-reply-v1 .zr-ir-created{margin-left:auto;flex:0 0 auto;font-size:11px;color:var(--muted);white-space:nowrap}
  #tab-inquiry-reply-v1 .zr-ir-line2{min-width:0;color:var(--muted);font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:1px}
  #tab-inquiry-reply-v1 .zr-ir-line2 b{color:#56645c;margin-right:7px;font-size:11px}
  #tab-inquiry-reply-v1 .zr-ir-actions{grid-column:2;grid-row:1/3;display:flex;align-items:center;justify-content:flex-end;align-self:center}
  #tab-inquiry-reply-v1 .zr-ir-actions button{min-width:78px;padding:9px 12px}
  #tab-inquiry-reply-v1 .zr-ir-empty{padding:32px 12px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px;background:#fafbf9}
  #zrInquiryReplyModal .modal-card{width:min(760px,100%)}
  #zrInquiryReplyModal .zr-ir-source{border:1px solid var(--line);border-radius:13px;background:#f8faf8;padding:12px 14px;font-size:13px;line-height:1.6;color:#46544c}
  #zrInquiryReplyModal .zr-ir-source b{color:var(--text)}
  #zrInquiryReplyModal textarea{min-height:150px;resize:vertical}
  #zrInquiryReplyModal .zr-ir-review{border:1px solid var(--line);border-radius:14px;background:#fafcf9;padding:14px 15px}
  #zrInquiryReplyModal .zr-ir-review-row{padding:9px 0;border-bottom:1px solid #e7ece8}
  #zrInquiryReplyModal .zr-ir-review-row:last-child{border-bottom:0}
  #zrInquiryReplyModal .zr-ir-review-row span{display:block;font-size:11px;font-weight:800;color:var(--muted);margin-bottom:4px}
  #zrInquiryReplyModal .zr-ir-review-row div{font-size:14px;font-weight:800;line-height:1.55;white-space:pre-wrap;word-break:break-word}
  #tab-inquiry-reply-examples .zr-ir-template-editor{display:grid;grid-template-columns:minmax(180px,260px) minmax(0,1fr) auto;gap:10px;align-items:end;margin-bottom:18px}
  #tab-inquiry-reply-examples .zr-ir-template-editor textarea{min-height:72px;resize:vertical}
  #tab-inquiry-reply-examples .zr-ir-template-list{display:grid;gap:8px}
  #tab-inquiry-reply-examples .zr-ir-template-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:13px;padding:11px 13px;background:#fff}
  #tab-inquiry-reply-examples .zr-ir-template-title{font-weight:900;margin-bottom:4px}
  #tab-inquiry-reply-examples .zr-ir-template-text{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #tab-inquiry-reply-examples .zr-ir-template-actions{display:flex;gap:7px}
  @media(max-width:900px){
    #tab-inquiry-reply-v1 .zr-ir-field.start{grid-column:1/7}#tab-inquiry-reply-v1 .zr-ir-field.end{grid-column:7/13}
    #tab-inquiry-reply-v1 .zr-ir-field.status{grid-column:1/7;grid-row:2}
    #tab-inquiry-reply-v1 #zrInquiryApply{grid-column:7/13;grid-row:2}
    #tab-inquiry-reply-v1 .zr-ir-summary{overflow-x:auto;scrollbar-width:none}#tab-inquiry-reply-v1 .zr-ir-summary::-webkit-scrollbar{display:none}
    #tab-inquiry-reply-v1 .zr-ir-created{display:none}
    #tab-inquiry-reply-examples .zr-ir-template-editor{grid-template-columns:1fr 1fr}#tab-inquiry-reply-examples .zr-ir-template-editor .text{grid-column:1/3}#tab-inquiry-reply-examples .zr-ir-template-editor .actions{grid-column:1/3}
  }
  @media(max-width:720px){
    #tab-inquiry-reply-v1 .zr-ir-panel,#tab-inquiry-reply-examples .zr-ir-panel{padding:16px 14px}
    #tab-inquiry-reply-v1 .zr-ir-field.start,#tab-inquiry-reply-v1 .zr-ir-field.end,#tab-inquiry-reply-v1 .zr-ir-field.status,#tab-inquiry-reply-v1 #zrInquiryApply{grid-column:1/13;grid-row:auto}
    #tab-inquiry-reply-v1 .zr-ir-card{padding:10px 11px;column-gap:8px}
    #tab-inquiry-reply-v1 .zr-ir-actions button{min-width:70px;padding:8px 10px}
    #tab-inquiry-reply-examples .zr-ir-template-editor{grid-template-columns:1fr}#tab-inquiry-reply-examples .zr-ir-template-editor .text,#tab-inquiry-reply-examples .zr-ir-template-editor .actions{grid-column:auto}
  }`;
  document.head.appendChild(s);
}

function setInitialRange(){
  const start=$('zrInquiryStart'),end=$('zrInquiryEnd');if(!start||!end)return;
  const today=seoulDate();if(!start.value)start.value=`${today.slice(0,8)}01`;if(!end.value)end.value=today;
}
function renderInquiriesV1(){
  const list=$('zrInquiryReplyList');if(!list)return;
  const f=readFilters();if(!validFilters(f)){toastSafe('조회 시작일은 종료일보다 늦을 수 없습니다.');return}
  const all=generalRows(),rows=filteredRows(f),pending=all.filter(x=>!x.info.replied).length;
  if($('zrInquiryReplyCount'))$('zrInquiryReplyCount').textContent=`조회 ${rows.length}건 · 전체 ${all.length}건 · 미답변 ${pending}건`;
  if(!rows.length){list.innerHTML='<div class="zr-ir-empty">조건에 맞는 1:1 문의가 없습니다.</div>';return}
  list.innerHTML=rows.map(({index,info})=>{
    const visit=info.date?`${info.date}${info.time?` ${info.time}`:''}`:'-',people=info.people?`${info.people}명`:'-',created=formatCreated(info.created),mobile=info.mobile||'연락처 미입력';
    return `<article class="zr-ir-card" data-index="${index}">
      <div class="zr-ir-summary">
        <span class="zr-ir-status ${info.replied?'done':''}">${info.replied?'답변완료':'미답변'}</span>
        <span class="zr-ir-org" title="${esc(info.orgName)}">${esc(info.orgName)}</span>
        <span class="zr-ir-info"><b>방문</b>${esc(visit)}</span>
        <span class="zr-ir-info"><b>인원</b>${esc(people)}</span>
        <span class="zr-ir-info"><b>문의자</b>${esc(info.name)}</span>
        <span class="zr-ir-info"><b>연락처</b>${esc(mobile)}</span>
        ${created?`<span class="zr-ir-created">접수 ${esc(created)}</span>`:''}
      </div>
      <div class="zr-ir-line2" title="${esc(info.body)}"><b>문의내용</b>${esc(info.body)}</div>
      ${info.replied?'':`<div class="zr-ir-actions"><button type="button" class="btn-primary" data-ir-reply="${index}">답변하기</button></div>`}
    </article>`;
  }).join('');
}

function refreshTemplateSelect(){
  const sel=$('zrInquiryReplyTemplate');if(!sel)return;
  const cur=sel.value,templates=readTemplates();
  sel.innerHTML='<option value="">답변예시 선택</option>'+templates.map(t=>`<option value="${esc(t.id)}">${esc(t.title||'제목 없음')}</option>`).join('');
  if(templates.some(t=>String(t.id)===cur))sel.value=cur;
}
function ensureReplyModal(){
  if($('zrInquiryReplyModal'))return;
  const modal=document.createElement('div');modal.id='zrInquiryReplyModal';modal.className='modal hidden';modal.innerHTML=`
  <div class="modal-card">
    <div id="zrInquiryReplyCompose">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 style="margin:0">1:1 문의 답변</h2><button type="button" class="btn-gray" id="zrInquiryReplyClose">✕</button></div>
      <div class="zr-ir-source" id="zrInquiryReplySource" style="margin-top:14px"></div>
      <div style="margin-top:14px"><label>답변예시 불러오기</label><select id="zrInquiryReplyTemplate"><option value="">답변예시 선택</option></select></div>
      <div style="margin-top:12px"><label class="req">답변내용</label><textarea id="zrInquiryReplyText" placeholder="고객에게 보낼 답변을 입력해주세요."></textarea></div>
      <div class="modal-actions"><button type="button" class="btn-gray" id="zrInquiryReplyCancel">취소</button><button type="button" class="btn-primary" id="zrInquiryReplyReviewBtn">답변하기</button></div>
    </div>
    <div id="zrInquiryReplyReview" class="hidden">
      <h2 style="margin:0 0 8px">답변 내용 확인</h2><div class="help" style="margin-bottom:14px">보내기 전에 수신번호와 답변내용을 한 번 더 확인해주세요.</div>
      <div class="zr-ir-review"><div class="zr-ir-review-row"><span>수신번호</span><div id="zrInquiryReplyReviewPhone"></div></div><div class="zr-ir-review-row"><span>답변내용</span><div id="zrInquiryReplyReviewText"></div></div></div>
      <div class="modal-actions"><button type="button" class="btn-gray" id="zrInquiryReplyBack">수정하기</button><button type="button" class="btn-primary" id="zrInquiryReplySend">보내기</button></div>
    </div>
  </div>`;
  document.body.appendChild(modal);
  $('zrInquiryReplyClose').onclick=closeReply;$('zrInquiryReplyCancel').onclick=closeReply;$('zrInquiryReplyBack').onclick=()=>showReplyStage('compose');
  $('zrInquiryReplyReviewBtn').onclick=reviewReply;$('zrInquiryReplySend').onclick=sendReply;
  $('zrInquiryReplyTemplate').onchange=e=>{
    const t=readTemplates().find(x=>String(x.id)===String(e.target.value));if(t)$('zrInquiryReplyText').value=String(t.text||'');
  };
  refreshTemplateSelect();
}
function showReplyStage(stage){$('zrInquiryReplyCompose')?.classList.toggle('hidden',stage!=='compose');$('zrInquiryReplyReview')?.classList.toggle('hidden',stage!=='review')}
function openReply(index){
  const item=readInquiries()[index];if(!item||isPreviewInquiry(item)){toastSafe('문의 정보를 찾지 못했습니다.');return}
  const info=inquiryInfo(item);if(info.replied){toastSafe('이미 답변완료된 문의입니다.');renderInquiriesV1();return}
  currentReplyIndex=index;refreshTemplateSelect();$('zrInquiryReplyTemplate').value='';$('zrInquiryReplyText').value='';
  $('zrInquiryReplySource').innerHTML=`<b>${esc(info.orgName)}</b> · ${esc(info.name)}${info.mobile?` · ${esc(info.mobile)}`:''}<br>${info.date?`방문 ${esc(info.date)} ${esc(info.time)} · ${info.people}명<br>`:''}<span style="white-space:pre-wrap">${esc(info.body)}</span>`;
  showReplyStage('compose');$('zrInquiryReplyModal').classList.remove('hidden');
}
function closeReply(){$('zrInquiryReplyModal')?.classList.add('hidden');currentReplyIndex=-1;showReplyStage('compose')}
function reviewReply(){
  if(currentReplyIndex<0)return;const item=readInquiries()[currentReplyIndex],info=item?inquiryInfo(item):null,text=$('zrInquiryReplyText')?.value.trim()||'';
  if(!item||!info){toastSafe('문의 정보를 찾지 못했습니다.');return}
  if(!info.mobile){toastSafe('휴대폰번호가 없어 문자 답변을 연결할 수 없습니다.');return}
  if(!text){toastSafe('답변내용을 입력해주세요.');$('zrInquiryReplyText')?.focus();return}
  $('zrInquiryReplyReviewPhone').textContent=info.mobile;$('zrInquiryReplyReviewText').textContent=text;showReplyStage('review');
}
function smsUrl(phone,text){
  const number=String(phone||'').replace(/[^0-9+]/g,'');
  const body=encodeURIComponent(text),ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  return `sms:${number}${ios?'&':'?'}body=${body}`;
}
function sendReply(){
  if(currentReplyIndex<0)return;const list=readInquiries(),item=list[currentReplyIndex];if(!item||isPreviewInquiry(item)){toastSafe('문의 정보를 찾지 못했습니다.');return}
  const info=inquiryInfo(item),reply=$('zrInquiryReplyText')?.value.trim()||'';if(!reply||!info.mobile)return reviewReply();
  const key=contentKey(item),base=splitReply(contentOf(item)).question.trimEnd(),sentAt=new Date().toISOString();
  item[key]=`${base}${REPLY_MARKER}답변일: ${sentAt}\n답변내용:\n${reply}`;
  writeInquiries(list);renderInquiriesV1();closeReply();
  const smsText=`[주렁주렁 동탄점]\n${reply}`;
  if(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&navigator.clipboard?.writeText){navigator.clipboard.writeText(smsText).catch(()=>{});toastSafe('답변완료 처리했습니다. 문자 앱 연결을 시도하며, PC에서는 답변내용도 복사됩니다.')}
  window.location.href=smsUrl(info.mobile,smsText);
}

function renderTemplates(){
  const list=$('zrInquiryTemplateList');if(!list)return;const templates=readTemplates();
  if(!templates.length){list.innerHTML='<div class="zr-ir-empty">저장된 답변예시가 없습니다. 위에서 자주 쓰는 답변을 등록해주세요.</div>';return}
  list.innerHTML=templates.map(t=>`<article class="zr-ir-template-card" data-template-id="${esc(t.id)}"><div><div class="zr-ir-template-title">${esc(t.title||'제목 없음')}</div><div class="zr-ir-template-text" title="${esc(t.text||'')}">${esc(t.text||'')}</div></div><div class="zr-ir-template-actions"><button type="button" class="btn-gray" data-template-edit="${esc(t.id)}">수정</button><button type="button" class="btn-gray" data-template-delete="${esc(t.id)}">삭제</button></div></article>`).join('');
}
function resetTemplateEditor(){templateEditId='';if($('zrInquiryTemplateTitle'))$('zrInquiryTemplateTitle').value='';if($('zrInquiryTemplateText'))$('zrInquiryTemplateText').value='';if($('zrInquiryTemplateSave'))$('zrInquiryTemplateSave').textContent='예시 저장';$('zrInquiryTemplateCancelEdit')?.classList.add('hidden')}
function saveTemplate(){
  const title=$('zrInquiryTemplateTitle')?.value.trim()||'',text=$('zrInquiryTemplateText')?.value.trim()||'';if(!title||!text){toastSafe('답변예시 제목과 내용을 모두 입력해주세요.');return}
  const list=readTemplates();
  if(templateEditId){const t=list.find(x=>String(x.id)===String(templateEditId));if(t){t.title=title;t.text=text;t.updatedAt=new Date().toISOString()}}
  else list.push({id:`tpl_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,title,text,updatedAt:new Date().toISOString()});
  writeTemplates(list);resetTemplateEditor();toastSafe('답변예시를 저장했습니다.');
}
function editTemplate(id){const t=readTemplates().find(x=>String(x.id)===String(id));if(!t)return;templateEditId=String(t.id);$('zrInquiryTemplateTitle').value=t.title||'';$('zrInquiryTemplateText').value=t.text||'';$('zrInquiryTemplateSave').textContent='수정 저장';$('zrInquiryTemplateCancelEdit').classList.remove('hidden');$('zrInquiryTemplateTitle').focus()}
function deleteTemplate(id){const list=readTemplates(),t=list.find(x=>String(x.id)===String(id));if(!t)return;if(!confirm(`답변예시 '${t.title}'을 삭제할까요?`))return;writeTemplates(list.filter(x=>String(x.id)!==String(id)));if(templateEditId===String(id))resetTemplateEditor();toastSafe('답변예시를 삭제했습니다.')}

function hideAdminSections(){document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray')}
function openInquiryTab(){hideAdminSections();$('tab-inquiry-reply-v1')?.classList.remove('hidden');if(inquiryTabButton)inquiryTabButton.className='btn-primary';setInitialRange();renderInquiriesV1()}
function openTemplateTab(){hideAdminSections();$('tab-inquiry-reply-examples')?.classList.remove('hidden');if($('zrInquiryReplyExampleTabBtn'))$('zrInquiryReplyExampleTabBtn').className='btn-primary';renderTemplates()}
function ensureSections(){
  const admin=$('adminView');if(!admin)return false;
  if(!$('tab-inquiry-reply-v1')){
    const sec=document.createElement('section');sec.id='tab-inquiry-reply-v1';sec.className='hidden';sec.innerHTML=`<div class="card zr-ir-panel" style="margin-top:14px"><div class="zr-ir-head"><h2>1:1 문의 현황 조회</h2><div class="zr-ir-count" id="zrInquiryReplyCount"></div></div><div class="zr-ir-filterbar"><div class="zr-ir-field start"><label>조회 시작일</label><input type="date" id="zrInquiryStart"></div><div class="zr-ir-field end"><label>조회 종료일</label><input type="date" id="zrInquiryEnd"></div><div class="zr-ir-field status"><label>처리 상태</label><select id="zrInquiryStatus"><option value="all">전체 조회</option><option value="pending">미답변</option><option value="done">답변완료</option></select></div><button type="button" class="btn-primary" id="zrInquiryApply">조회하기</button></div><div class="zr-ir-help">접수일 기준으로 조회합니다. 사전답사 문의는 사전답사 관리 탭에서 별도로 확인합니다.</div><div class="zr-ir-list" id="zrInquiryReplyList"></div></div>`;admin.appendChild(sec);
    $('zrInquiryApply').onclick=renderInquiriesV1;sec.addEventListener('click',e=>{const b=e.target.closest('[data-ir-reply]');if(b)openReply(Number(b.dataset.irReply))});setInitialRange();
  }
  if(!$('tab-inquiry-reply-examples')){
    const sec=document.createElement('section');sec.id='tab-inquiry-reply-examples';sec.className='hidden';sec.innerHTML=`<div class="card zr-ir-panel" style="margin-top:14px"><div class="zr-ir-head"><div><h2>답변예시 관리</h2><div class="help" style="margin-top:6px">자주 사용하는 답변을 저장해두고 1:1 문의 답변창에서 바로 불러올 수 있습니다.</div></div></div><div class="zr-ir-template-editor"><div><label>예시 제목</label><input id="zrInquiryTemplateTitle" placeholder="ex) 단체 문의 기본 답변"></div><div class="text"><label>답변내용</label><textarea id="zrInquiryTemplateText" placeholder="자주 사용하는 답변을 입력해주세요."></textarea></div><div class="actions" style="display:flex;gap:7px"><button type="button" class="btn-gray hidden" id="zrInquiryTemplateCancelEdit">취소</button><button type="button" class="btn-primary" id="zrInquiryTemplateSave">예시 저장</button></div></div><div class="zr-ir-template-list" id="zrInquiryTemplateList"></div></div>`;admin.appendChild(sec);
    $('zrInquiryTemplateSave').onclick=saveTemplate;$('zrInquiryTemplateCancelEdit').onclick=resetTemplateEditor;
    sec.addEventListener('click',e=>{const edit=e.target.closest('[data-template-edit]'),del=e.target.closest('[data-template-delete]');if(edit)editTemplate(edit.dataset.templateEdit);if(del)deleteTemplate(del.dataset.templateDelete)});
  }
  return true;
}
function ensureTabs(){
  const tabs=document.querySelector('#adminView .admin-tabs');if(!tabs)return false;
  inquiryTabButton=[...tabs.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='1:1 문의')||null;if(!inquiryTabButton)return false;
  if(inquiryTabButton.dataset.zrInquiryReplyBound!=='1'){
    inquiryTabButton.dataset.zrInquiryReplyBound='1';
    inquiryTabButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openInquiryTab()},true);
  }
  let btn=$('zrInquiryReplyExampleTabBtn');if(!btn){btn=document.createElement('button');btn.id='zrInquiryReplyExampleTabBtn';btn.className='btn-gray';btn.textContent='답변예시';inquiryTabButton.insertAdjacentElement('afterend',btn);btn.onclick=openTemplateTab}
  return true;
}
function install(){
  if(installed)return true;if(!ensureSections()||!ensureTabs())return false;installStyle();ensureReplyModal();
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#adminView .admin-tabs button');if(!b||b===inquiryTabButton||b.id==='zrInquiryReplyExampleTabBtn')return;$('tab-inquiry-reply-v1')?.classList.add('hidden');$('tab-inquiry-reply-examples')?.classList.add('hidden');$('zrInquiryReplyExampleTabBtn')?.classList.remove('btn-primary');$('zrInquiryReplyExampleTabBtn')?.classList.add('btn-gray')},true);
  document.addEventListener('zr:inquiry-replies-changed',()=>{if(!$('tab-inquiry-reply-v1')?.classList.contains('hidden'))renderInquiriesV1()});
  window.addEventListener('storage',e=>{if(e.key===INQUIRY_KEY&&!$('tab-inquiry-reply-v1')?.classList.contains('hidden'))renderInquiriesV1();if(e.key===TEMPLATE_KEY){refreshTemplateSelect();renderTemplates()}});
  installed=true;return true;
}
function boot(){if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>60)clearInterval(timer)},150)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
