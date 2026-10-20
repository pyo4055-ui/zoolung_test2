(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_VISIT_NOTIFY_V1)return;
window.__ZR_ADMIN_PREVIEW_VISIT_NOTIFY_V1=true;

const INQUIRY_KEY='zr_inquiries';
const TEMPLATE_KEY='zr_preview_confirm_templates_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false,templateEditId='',templateSaving=false;

function toastSafe(msg){try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}window.ZRDialogs.alert(msg)}
function readInquiries(){try{const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function readTemplates(){try{const v=JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]}catch{return []}}
function contentKey(item){for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return k;return'content'}
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
function buildPreview(p,body,confirmed){return `[${confirmed?'사전답사 확정':'사전답사 문의'}]\n단체명: ${String(p.orgName||'').trim()}\n방문 희망일: ${p.date}\n방문 희망시간: ${p.time}\n사전답사 인원: ${Math.max(1,Math.trunc(Number(p.people)||1))}명\n\n${String(body||'').trim()}`.trimEnd()}
function fixedDetails(p){return `단체명: ${p.orgName}\n방문일시: ${p.date} ${p.time}\n방문인원: ${p.people}명`}
function defaultIntro(){return '사전답사 일정이 확정되었습니다.'}
function fullTemplate(t){return t?.templateVersion===2?t.text:'[주렁주렁 동탄점]\n'+(t?.text||defaultIntro())+'\n\n단체명: {단체명}\n방문일시: {방문일} {방문시간}\n방문인원: {방문인원}명'}
function buildSms(text,p){return text.replaceAll('{단체명}',p.orgName).replaceAll('{방문일}',p.date).replaceAll('{방문시간}',p.time).replaceAll('{방문인원}',String(p.people))}


function installStyle(){
  if($('zrPreviewNotifyStyleV1'))return;
  const s=document.createElement('style');s.id='zrPreviewNotifyStyleV1';s.textContent=`
    #zrPreviewNotifyInnerTabs{display:inline-flex;align-items:center;gap:4px;margin:14px 0 8px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04)}
    #zrPreviewNotifyInnerTabs button{position:relative;min-width:118px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1!important}
    #zrPreviewNotifyInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}
    #zrPreviewNotifyInnerTabs button.btn-primary::after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
    #zrPreviewNotifyTemplatePanel{margin-top:12px;padding:20px 22px 18px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-head{margin-bottom:20px}#zrPreviewNotifyTemplatePanel .zr-pvn-head h2{margin:0;font-size:22px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-editor{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:stretch;margin-bottom:18px}
    #zrPreviewNotifyTemplatePanel .zr-pvn-editor>div{min-width:0}#zrPreviewNotifyTemplatePanel .zr-pvn-editor label{display:block;margin-bottom:6px}#zrPreviewNotifyTemplatePanel .zr-pvn-editor input,#zrPreviewNotifyTemplatePanel .zr-pvn-editor textarea{width:100%;box-sizing:border-box}#zrPreviewNotifyTemplatePanel .zr-pvn-editor textarea{min-height:145px;resize:vertical}#zrPreviewNotifyTemplatePanel .zr-pvn-save{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}#zrPreviewNotifyTemplatePanel .zr-pvn-preview pre{margin:0;padding:14px;border:1px solid var(--line);border-radius:12px;background:#fff;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
    #zrPreviewNotifyTemplatePanel .zr-pvn-list{display:grid;gap:8px}.zr-pvn-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:13px;padding:11px 13px;background:#fff}
    .zr-pvn-title{font-weight:900;margin-bottom:4px}.zr-pvn-text{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zr-pvn-actions{display:flex;gap:7px}.zr-pvn-empty{padding:28px 12px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px;background:#fafbf9}
    #zrPreviewNotifyModal .modal-card{width:min(760px,100%)}#zrPreviewNotifyModal .zr-pvn-source,#zrPreviewNotifyModal .zr-pvn-fixed{border:1px solid var(--line);border-radius:13px;background:#f8faf8;padding:12px 14px;font-size:13px;line-height:1.65;color:#46544c}
    #zrPreviewNotifyModal textarea{min-height:110px;resize:vertical}.zr-pvn-fixed{white-space:pre-wrap}.zr-pvn-review{border:1px solid var(--line);border-radius:14px;background:#fafcf9;padding:14px 15px}.zr-pvn-review-row{padding:9px 0;border-bottom:1px solid #e7ece8}.zr-pvn-review-row:last-child{border-bottom:0}.zr-pvn-review-row span{display:block;font-size:11px;font-weight:800;color:var(--muted);margin-bottom:4px}.zr-pvn-review-row div{font-size:14px;font-weight:800;line-height:1.55;white-space:pre-wrap;word-break:break-word}
    @media(max-width:720px){#zrPreviewNotifyInnerTabs{display:grid;grid-template-columns:1fr 1fr;width:100%}#zrPreviewNotifyInnerTabs button{width:100%;min-width:0}#zrPreviewNotifyTemplatePanel{padding:16px 14px}#zrPreviewNotifyTemplatePanel .zr-pvn-editor{grid-template-columns:1fr}}
  `;document.head.appendChild(s)
}
function directPreviewPanel(tab){return [...tab.children].find(el=>el.classList?.contains('zr-pv-panel'))||null}
function setSubtab(mode){const tab=$('tab-preview-visit'),panel=tab?directPreviewPanel(tab):null,templates=$('zrPreviewNotifyTemplatePanel');if(!tab||!panel||!templates)return;const open=mode==='templates';panel.classList.toggle('hidden',open);templates.classList.toggle('hidden',!open);$('zrPreviewNotifyVisitSubtab').className=open?'btn-gray':'btn-primary';$('zrPreviewNotifyTemplateSubtab').className=open?'btn-primary':'btn-gray';if(open)renderTemplates()}
function ensureSubtabs(){
  const tab=$('tab-preview-visit'),panel=tab?directPreviewPanel(tab):null;if(!tab||!panel)return false;
  let nav=$('zrPreviewNotifyInnerTabs');if(!nav){nav=document.createElement('div');nav.id='zrPreviewNotifyInnerTabs';nav.setAttribute('aria-label','사전답사 관리 내부 메뉴');nav.innerHTML='<button type="button" class="btn-primary" id="zrPreviewNotifyVisitSubtab">사전답사 현황</button><button type="button" class="btn-gray" id="zrPreviewNotifyTemplateSubtab">사전답사 확정문자</button>';tab.insertBefore(nav,panel)}
  let templates=$('zrPreviewNotifyTemplatePanel');if(!templates){templates=document.createElement('div');templates.id='zrPreviewNotifyTemplatePanel';templates.className='card hidden';templates.innerHTML=`<div class="zr-pvn-head"><h2>사전답사 확정문자</h2><div class="help" data-zr-help-only style="margin-top:6px">알림 문구를 저장합니다. {단체명}, {방문일}, {방문시간}, {방문인원}은 실제 예약 정보로 바뀝니다.</div></div><div class="zr-pvn-editor"><div class="zr-pvn-preview"><label>문자 미리보기</label><pre id="zrPreviewSmsLivePreview"></pre></div><div><label>알림 문구</label><textarea id="zrPreviewNotifyTemplateText" placeholder="ex) 사전답사 일정이 확정되었습니다."></textarea></div><div class="zr-pvn-save"><button type="button" class="btn-primary" id="zrPreviewNotifyTemplateSave">저장</button></div></div><div class="help" data-zr-help-only style="margin:-6px 0 16px">문자 고정정보: 단체명 / 방문일시 / 방문인원</div>`;tab.appendChild(templates)}
  $('zrPreviewNotifyVisitSubtab').onclick=()=>setSubtab('visits');$('zrPreviewNotifyTemplateSubtab').onclick=()=>setSubtab('templates');$('zrPreviewNotifyTemplateSave').onclick=saveTemplate;$('zrPreviewNotifyTemplateText').oninput=updateTemplatePreview;renderTemplates();
  return true;
}
function renderTemplates(force=false){
 if(!force&&(templateSaving||window.ZRAdminFormDrafts?.isDirty?.('previewTemplate')))return;
 const t=readTemplates().find(x=>x.id==='preview-default')||readTemplates()[0];
 if(!document.getElementById('zrPreviewNotifyTemplateText'))return;
 templateEditId=t?.id||'';
 $('zrPreviewNotifyTemplateText').value=fullTemplate(t);
 window.ZRAdminEditMeta?.publish('previewTemplate',t?.adminEditMeta||null);
 updateTemplatePreview();
}
function updateTemplatePreview(){const preview=$('zrPreviewSmsLivePreview');if(preview)preview.textContent=buildSms($('zrPreviewNotifyTemplateText')?.value||'',{orgName:'예시 단체',date:'2026-10-20',time:'10:30',people:2})}
async function saveTemplate(){
 if(templateSaving)return false;
 const text=$('zrPreviewNotifyTemplateText')?.value.trim()||'';
 if(!text){toastSafe('알림 문구를 입력해주세요.');return false}
 const list=readTemplates(),old=list.find(x=>x.id===templateEditId),meta=window.ZRAdminEditMeta?.make()||null;
 const item={...old,id:'preview-default',title:'사전답사 확정문자',text,templateVersion:2,adminEditMeta:meta,updatedAt:new Date().toISOString()};
 const next=[item,...list.filter(x=>x.id!=='preview-default')];
 const input=$('zrPreviewNotifyTemplateText'),button=$('zrPreviewNotifyTemplateSave');
 templateSaving=true;if(input)input.disabled=true;if(button){button.disabled=true;button.textContent='저장 중...'}
 try{
  if(!await window.zrAdminOperationalSettings?.save(TEMPLATE_KEY,JSON.stringify(next))){toastSafe('문구를 저장하지 못했습니다. 다시 시도해주세요.');return false}
  renderTemplates(true);window.ZRAdminEditMeta?.publish('previewTemplate',meta);
  window.ZRAdminFormDrafts?.saved('previewTemplate');toastSafe('저장했습니다.');return true;
 }finally{templateSaving=false;if(input)input.disabled=false;if(button){button.disabled=false;button.textContent='저장'}}
}

async function openNotify(index){
 const list=readInquiries(),item=list[index],p=item?parsePreview(contentOf(item)):null;
 if(!item||!p||p.confirmed)return;
 const phone=contactOf(item);if(!phone){toastSafe('고객 연락처를 확인해주세요.');return}
 const saved=readTemplates().find(x=>x.id==='preview-default')||readTemplates()[0];
 const message=buildSms(fullTemplate(saved),p);
 if(!await window.ZRDialogs.sms({phone,message,title:'사전답사 확정 문자 연결'}))return;
 const latest=readInquiries(),target=latest.find(x=>String(x.sharedInquiryId||x.id)===String(item.sharedInquiryId||item.id));
 if(!target)return;
 if(contentOf(target)!==contentOf(item)){toastSafe('문의 내용이 변경되었습니다. 다시 확인해주세요.');return}
 const current=parsePreview(contentOf(target));if(!current||current.confirmed)return;
 const updated={...target,[contentKey(target)]:buildPreview(current,current.body,true)};
 if(!await window.zrInquiryFirebase?.save(updated)){toastSafe('확정 내용을 저장하지 못했습니다. 다시 시도해주세요.');return}
 document.dispatchEvent(new CustomEvent('zr:preview-visits-changed'));
 try{window.renderAdmin?.()}catch{}
}

function install(){if(installed)return true;const tab=$('tab-preview-visit'),tabBtn=$('zrPreviewVisitTabBtn');if(!tab||!tabBtn)return false;installStyle();if(!ensureSubtabs())return false;if(tab.dataset.zrPreviewNotifyBound!=='1'){tab.dataset.zrPreviewNotifyBound='1';tab.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-pv-confirm]');if(!btn||btn.disabled)return;e.preventDefault();e.stopImmediatePropagation();openNotify(Number(btn.dataset.pvConfirm))},true)}document.addEventListener('click',e=>{const b=e.target?.closest?.('#adminView .admin-tabs button');if(b?.id==='zrPreviewVisitTabBtn')setSubtab('visits')},true);window.addEventListener('storage',e=>{if(e.key===TEMPLATE_KEY){renderTemplates()}});setSubtab('visits');installed=true;return true}
let bootTimer=0;
function boot(){
  if(install()){if(bootTimer)clearInterval(bootTimer);bootTimer=0;return}
  if(bootTimer)return;
  let tries=0;
  bootTimer=setInterval(()=>{if(install()||++tries>80){clearInterval(bootTimer);bootTimer=0}},120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
(window.ZRAdminRefreshViews||(window.ZRAdminRefreshViews=new Map())).set('zrPreviewNotifyTemplatePanel',()=>{renderTemplates();updateTemplatePreview()});
})();
