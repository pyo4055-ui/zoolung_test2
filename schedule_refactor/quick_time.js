import {state,savePatch,toast} from './core.js?v=release-1792586551421';

const STYLE_ID='zrOnsiteQuickTimeFixV1Style';
export function injectQuickTimeStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    #list .zr-quick-time{
      appearance:none!important;
      -webkit-appearance:none!important;
      color:#667169!important;
      -webkit-text-fill-color:currentColor!important;
      background:#f3f5f3!important;
      border:0!important;
      border-radius:6px!important;
      padding:4px 5px!important;
      min-height:22px!important;
      font:inherit!important;
      line-height:1!important;
      text-decoration:none!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:rgba(0,0,0,.08);
      cursor:pointer!important;
    }
    #list .zr-quick-time.has{
      color:var(--green)!important;
      -webkit-text-fill-color:currentColor!important;
      background:#e7f4ea!important;
      font-weight:800!important;
    }
  `;
  document.head.appendChild(s);
}

function buttonText(kind,value){
  return `${kind==='eta'?'도착예정':'퇴장예정'} ${value||'--:--'}`;
}
function paint(button,kind,value){
  if(!button||!button.isConnected)return;
  button.textContent=buttonText(kind,value);
  button.classList.toggle('has',!!value);
}
export async function editQuickTime(button){
  if(!state.editMode){toast("상단에서 '수정 가능'을 먼저 켜주세요.");return}
  const kind=String(button?.dataset?.q||'');
  if(kind!=='eta'&&kind!=='aend')return;
  const gid=String(button?.dataset?.id||'');
  const g=state.data.groups.find(z=>String(z?.id??'')===gid);
  if(!g){toast('단체 정보를 찾지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  const old=String(g[kind]||'');
  const label=kind==='eta'?'도착예정':'퇴장예정';
  await window.ZRDialogs.prompt(`${label} 시간`,old,'time',async value=>{
    const next=String(value||'').trim();
    if(next!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(next))throw Error('올바른 시간을 입력해주세요.');
    await savePatch(g.id,{[kind]:next});g[kind]=next;paint(button,kind,next);return true;
  });
}
