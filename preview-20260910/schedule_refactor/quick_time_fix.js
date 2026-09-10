import {state,savePatch,writeError,toast} from './core.js';

if(!window.__ZR_ONSITE_QUICK_TIME_FIX_V1){
  window.__ZR_ONSITE_QUICK_TIME_FIX_V1=true;

  const STYLE_ID='zrOnsiteQuickTimeFixV1Style';
  function injectStyle(){
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
  async function editQuickTime(button){
    if(!state.editMode){toast("상단에서 '수정 가능'을 먼저 켜주세요.");return}
    const kind=String(button?.dataset?.q||'');
    if(kind!=='eta'&&kind!=='aend')return;
    const gid=String(button?.dataset?.id||'');
    const g=state.data.groups.find(z=>String(z?.id??'')===gid);
    if(!g){toast('단체 정보를 찾지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
    const old=String(g[kind]||'');
    const label=kind==='eta'?'도착예정':'퇴장예정';
    const value=prompt(`${label} 시간 (예: 15:30)`,old);
    if(value===null)return;
    const next=String(value||'').trim();
    if(next!==''&&!/^\d{2}:\d{2}$/.test(next)){toast('시간을 15:30 형식으로 입력해주세요.');return}
    if(next!==''&&(()=>{const [h,m]=next.split(':').map(Number);return h>23||m>59})()){toast('올바른 시간을 입력해주세요.');return}
    g[kind]=next;
    paint(button,kind,next);
    try{await savePatch(g.id,{[kind]:next})}
    catch(e){g[kind]=old;paint(button,kind,old);writeError(e)}
  }

  injectStyle();
  document.addEventListener('click',e=>{
    const button=e.target?.closest?.('#list .zr-quick-time[data-q][data-id]');
    if(!button)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    editQuickTime(button);
  },true);
}
