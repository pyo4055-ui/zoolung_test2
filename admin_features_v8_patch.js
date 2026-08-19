(()=>{
  if(window.__ZR_ADMIN_V8_INSTALLED)return;
  window.__ZR_ADMIN_V8_INSTALLED=true;

  const style=document.createElement('style');
  style.textContent=`
    #adminCalendar .day.zr8-manual-closed{
      background:#f0f2f3!important;
      border-color:#c9ced2!important;
      box-shadow:none!important;
    }
    #adminCalendar .day.zr8-manual-closed:hover{
      background:#e9ecee!important;
    }
    #adminCalendar .day.zr8-manual-closed .status.zr8-manual-badge{
      background:#dfe3e5!important;
      color:#4f585e!important;
      border-color:#c3c9cc!important;
    }
  `;
  document.head.appendChild(style);

  function manualClosedSet(){
    try{return new Set(settings().manualClosed||[]);}catch{return new Set();}
  }

  function paintManualClosedDays(){
    const root=document.getElementById('adminCalendar');
    if(!root)return;
    const manual=manualClosedSet();
    root.querySelectorAll('.day').forEach(day=>{
      const detailBtn=[...day.querySelectorAll('button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('openDay('));
      const code=detailBtn?.getAttribute('onclick')||'';
      const match=code.match(/openDay\(['\"](\d{4}-\d{2}-\d{2})['\"]\)/);
      const date=match?.[1]||'';
      const isManual=!!date&&manual.has(date);
      day.classList.toggle('zr8-manual-closed',isManual);
      day.querySelectorAll('.status.rejected').forEach(badge=>{
        if((badge.textContent||'').trim()==='마감')badge.classList.toggle('zr8-manual-badge',isManual);
      });
    });
  }

  if(typeof renderAdmin==='function'){
    const baseRenderAdmin=renderAdmin;
    renderAdmin=function(){
      const out=baseRenderAdmin.apply(this,arguments);
      paintManualClosedDays();
      return out;
    };
    window.renderAdmin=renderAdmin;
  }

  if(typeof window.toggleManualClose==='function'){
    const baseToggleManualClose=window.toggleManualClose;
    window.toggleManualClose=function(){
      const out=baseToggleManualClose.apply(this,arguments);
      setTimeout(paintManualClosedDays,0);
      return out;
    };
    try{toggleManualClose=window.toggleManualClose;}catch{}
  }

  paintManualClosedDays();
})();
