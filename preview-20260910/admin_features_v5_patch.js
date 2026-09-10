(()=>{
  if(window.__ZR_ADMIN_V5_INSTALLED)return;
  window.__ZR_ADMIN_V5_INSTALLED=true;

  const style=document.createElement('style');
  style.textContent=`
    .zr4-complete{background:#ece7ff!important;color:#5942a8!important;border:1px solid #cfc4ff!important}
    .status.pending{background:#fff0d8!important;color:#9a5b00!important;border-color:#f2d29e!important}
    .zr5-refresh{background:#e8f1ff!important;color:#245d9a!important;border:1px solid #bfd5f2!important;font-weight:800!important}
    .zr5-refresh:hover{filter:brightness(.98)}
  `;
  document.head.appendChild(style);

  function paintRefresh(){
    const root=document.getElementById('adminView')||document;
    root.querySelectorAll('button').forEach(btn=>{
      if((btn.textContent||'').trim().includes('새로고침'))btn.classList.add('zr5-refresh');
    });
  }

  paintRefresh();
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(paintRefresh,0)));
  const obs=new MutationObserver(()=>paintRefresh());
  const admin=document.getElementById('adminView');
  if(admin)obs.observe(admin,{childList:true,subtree:true});
})();
