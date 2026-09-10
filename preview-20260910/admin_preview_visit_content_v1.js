(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_CONTENT_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_CONTENT_V1=true;

const INQUIRY_KEY='zr_inquiries';
const PREVIEW_LIMIT=20;
const $=id=>document.getElementById(id);
let installed=false;

function readInquiries(){
  try{const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function contentOf(item){
  for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return String(item[k]??'');
  return '';
}
function parsePreview(content){
  const text=String(content||'').replace(/\r\n/g,'\n');
  const re=/^\[(사전답사 문의|사전답사 확정)\]\n단체명:\s*(.*?)\n방문 희망일:\s*(\d{4}-\d{2}-\d{2})\n방문 희망시간:\s*([0-2]\d:[0-5]\d)\n사전답사 인원:\s*(\d+)명(?:\n\n)?/;
  const m=text.match(re);if(!m)return null;
  return {body:text.slice(m[0].length).trim()||'문의내용 없음'};
}
function shortText(value){
  const oneLine=String(value||'').replace(/\s+/g,' ').trim()||'문의내용 없음';
  const chars=Array.from(oneLine);
  return chars.length>PREVIEW_LIMIT?`${chars.slice(0,PREVIEW_LIMIT).join('')}…`:oneLine;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function installStyle(){
  if($('zrPreviewVisitContentStyleV1'))return;
  const s=document.createElement('style');s.id='zrPreviewVisitContentStyleV1';s.textContent=`
    #tab-preview-visit .zr-pv-line2{display:flex;align-items:center;gap:7px;min-width:0}
    #tab-preview-visit .zr-pv-content-preview{display:block;min-width:0;max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)}
    #tab-preview-visit .zr-pv-actions [data-pv-content]{min-width:72px}
    #zrPreviewVisitContentModal .modal-card{width:min(680px,100%);max-height:min(82vh,720px);display:flex;flex-direction:column}
    #zrPreviewVisitContentModal h2{margin:0 0 14px}
    #zrPreviewVisitContentModal .zr-pvc-full{min-height:120px;max-height:56vh;overflow:auto;border:1px solid var(--line);border-radius:13px;background:#fafcf9;padding:16px;font-size:14px;line-height:1.7;color:var(--text);white-space:pre-wrap;word-break:break-word}
    #zrPreviewVisitContentModal .modal-actions{display:flex;justify-content:flex-end;margin-top:16px}
    #zrPreviewVisitContentModal .modal-actions button{min-width:84px}
    @media(max-width:720px){#tab-preview-visit .zr-pv-content-preview{max-width:190px}#zrPreviewVisitContentModal .zr-pvc-full{max-height:58vh;padding:14px}}
  `;document.head.appendChild(s);
}
function ensureModal(){
  if($('zrPreviewVisitContentModal'))return;
  const modal=document.createElement('div');modal.id='zrPreviewVisitContentModal';modal.className='modal hidden';
  modal.innerHTML='<div class="modal-card"><h2>문의내용</h2><div class="zr-pvc-full" id="zrPreviewVisitContentFull"></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrPreviewVisitContentClose">닫기</button></div></div>';
  document.body.appendChild(modal);$('zrPreviewVisitContentClose').onclick=()=>modal.classList.add('hidden');
}
function openContent(index){
  const item=readInquiries()[index],p=item?parsePreview(contentOf(item)):null;
  if(!p)return;
  $('zrPreviewVisitContentFull').textContent=p.body;
  $('zrPreviewVisitContentModal').classList.remove('hidden');
  $('zrPreviewVisitContentModal').querySelector('.modal-card')?.scrollTo?.({top:0});
}
function decorate(){
  const inquiries=readInquiries(),tab=$('tab-preview-visit');if(!tab)return;
  tab.querySelectorAll('.zr-pv-card[data-index]').forEach(card=>{
    const index=Number(card.dataset.index),p=parsePreview(contentOf(inquiries[index]));if(!p)return;
    const line=card.querySelector('.zr-pv-line2'),actions=card.querySelector('.zr-pv-actions');if(!line||!actions)return;
    line.removeAttribute('title');
    line.innerHTML=`<b>문의내용</b><span class="zr-pv-content-preview">${esc(shortText(p.body))}</span>`;
    if(!actions.querySelector('[data-pv-content]')){
      const btn=document.createElement('button');btn.type='button';btn.className='btn-gray';btn.dataset.pvContent=String(index);btn.textContent='문의내용';
      actions.insertBefore(btn,actions.firstChild);
    }
  });
}
function schedule(){setTimeout(decorate,0)}
function install(){
  if(installed)return true;const tab=$('tab-preview-visit'),tabBtn=$('zrPreviewVisitTabBtn');if(!tab||!tabBtn)return false;
  installStyle();ensureModal();
  tab.addEventListener('click',e=>{
    const content=e.target?.closest?.('[data-pv-content]');
    if(content){e.preventDefault();e.stopPropagation();openContent(Number(content.dataset.pvContent));return}
    if(e.target?.closest?.('#zrPreviewApplyFilter')||e.target?.closest?.('[data-pv-edit]')||e.target?.closest?.('[data-pv-confirm]'))schedule();
  },true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#zrPreviewVisitTabBtn'))schedule()},true);
  document.addEventListener('zr:preview-visits-changed',schedule);
  window.addEventListener('storage',e=>{if(e.key===INQUIRY_KEY)schedule()});
  schedule();installed=true;return true;
}
function boot(){if(install())return;let tries=0;const t=setInterval(()=>{if(install()||++tries>80)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
