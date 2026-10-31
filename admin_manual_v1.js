(()=>{
'use strict';
if(window.__zrManualV1)return;window.__zrManualV1=true;
let contentPromise,dialog,returnFocus;
const style=document.createElement('style');style.textContent=`
#zrManualOpen{flex:0 0 32px;width:32px;height:32px;border:1px solid #ddcec1;border-radius:9px;background:#fff;color:#665346;cursor:pointer;font-weight:800}
#zrManualDialog{width:min(960px,calc(100vw - 28px));max-height:90dvh;padding:0;border:0;border-radius:20px;color:#26352d;background:#fff;box-shadow:0 20px 70px #0004}
#zrManualDialog::backdrop{background:#0007}#zrManualDialog header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#fc5404;color:white;position:sticky;top:0;z-index:1}#zrManualDialog button{cursor:pointer;border:1px solid #ded6cf;border-radius:8px;background:#fff;color:#30483c;padding:9px 12px;font:inherit}#zrManualDialog .manual-body{padding:20px}#zrManualDialog input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:12px 0}#zrManualDialog nav{display:flex;flex-wrap:wrap;gap:6px;max-height:180px;overflow:auto;margin-bottom:18px}#zrManualDialog article{border-top:2px solid #fc5404;padding-top:12px;line-height:1.7}#zrManualDialog dt{font-weight:700;margin-top:14px}#zrManualDialog dd{margin:4px 0 0}#zrManualDialog .manual-actions{display:flex;gap:8px;flex-wrap:wrap}#zrManualDialog [hidden]{display:none!important}
@media print{body>*:not(#zrManualDialog){display:none!important}#zrManualDialog{position:static!important;max-height:none!important;width:100%!important;box-shadow:none!important;overflow:visible!important}#zrManualDialog header,#zrManualDialog nav,#zrManualDialog input,#zrManualDialog .manual-actions{display:none!important}#zrManualDialog article{break-inside:avoid}}
`;document.head.append(style);
function text(tag,value){const el=document.createElement(tag);el.textContent=value;return el}
async function open(){
 returnFocus=document.activeElement;
 if(!dialog){dialog=document.createElement('dialog');dialog.id='zrManualDialog';dialog.setAttribute('aria-label','사용 매뉴얼');const head=document.createElement('header');head.append(text('strong','단체 사이트 사용 매뉴얼'));const close=text('button','닫기');close.type='button';close.onclick=()=>dialog.close();head.append(close);dialog.append(head);document.body.append(dialog);dialog.addEventListener('close',()=>returnFocus?.focus());}
 dialog.querySelector('.manual-body')?.remove();const body=document.createElement('div');body.className='manual-body';body.textContent='매뉴얼을 불러오고 있습니다.';dialog.append(body);if(!dialog.open)dialog.showModal();
 try{contentPromise??=fetch('./admin_manual_content_v1.json?v=20261031').then(r=>{if(!r.ok)throw Error();return r.json()}).catch(e=>{contentPromise=null;throw e});const pages=await contentPromise;if(!dialog.open)return;body.textContent='';
 const actions=document.createElement('div');actions.className='manual-actions';const all=text('button','전체 목차');const print=text('button','전체 인쇄 / PDF 저장');actions.append(all,print);body.append(actions);const search=document.createElement('input');search.type='search';search.placeholder='매뉴얼 검색';search.setAttribute('aria-label','매뉴얼 검색');body.append(search);const nav=document.createElement('nav');nav.setAttribute('aria-label','매뉴얼 목차');body.append(nav);const sections=document.createElement('div');body.append(sections);
 function show(indices){sections.textContent='';for(const i of indices){const p=pages[i],a=document.createElement('article');a.append(text('h2',p.title),text('p',p.lead));const dl=document.createElement('dl');for(const [label,desc] of p.items){dl.append(text('dt',label),text('dd',desc))}a.append(dl);if(p.note)a.append(text('p',p.note));sections.append(a)}}
 function menu(){nav.textContent='';const q=search.value.trim();pages.forEach((p,i)=>{if(q&&!JSON.stringify(p).includes(q))return;const b=text('button',p.title);b.type='button';b.onclick=()=>show([i]);nav.append(b)})}search.oninput=menu;all.onclick=()=>{search.value='';menu();show(pages.map((_,i)=>i))};print.onclick=()=>{show(pages.map((_,i)=>i));window.print()};menu();const title=(document.getElementById('zrAdminShellPageTitle')?.textContent||'').replace(/\s/g,'');let index=pages.findIndex(p=>title&&p.title.replace(/\s/g,'').includes(title));show([index<0?1:index]);
 }catch{body.textContent='매뉴얼을 불러오지 못했습니다. 닫은 뒤 다시 눌러주세요.'}
}
function mount(){const status=document.querySelector('.zr-admin-shell-header .zr-admin-shell-status');if(!status||document.getElementById('zrManualOpen'))return;const b=text('button','?');b.id='zrManualOpen';b.type='button';b.title='사용 매뉴얼';b.setAttribute('aria-label','사용 매뉴얼');b.onclick=open;status.after(b)}
document.addEventListener('zr:admin-runtime-ready',mount);window.addEventListener('load',mount);mount();
// A bounded startup retry handles the asynchronously constructed administrator header.
let attempts=0;const timer=setInterval(()=>{mount();if(document.getElementById('zrManualOpen')||++attempts>=30)clearInterval(timer)},500);
})();

