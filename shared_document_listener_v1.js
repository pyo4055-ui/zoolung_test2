(()=>{
'use strict';
if(window.ZRDocumentListener)return;
function connect({auth,ref,onAuthStateChanged,onSnapshot,onData,onError=console.error}){
 let stopped=false,generation=0,unsubscribe=null,timer=null,attempt=0,suspended=false;
 function detach(){generation++;clearTimeout(timer);timer=null;if(unsubscribe){unsubscribe();unsubscribe=null}}
 function start(){
  detach();const user=auth.currentUser;if(stopped||suspended||!user)return;
  const token=generation,uid=user.uid;
  const current=()=>!stopped&&!suspended&&generation===token&&auth.currentUser?.uid===uid;
  unsubscribe=onSnapshot(ref,{includeMetadataChanges:true},snap=>{
   if(!current()||snap.metadata?.hasPendingWrites)return;attempt=0;onData(snap);
  },error=>{if(!current())return;onError(error);detach();timer=setTimeout(start,Math.min(30000,1000*2**Math.min(attempt++,5)))});
 }
 const stopAuth=onAuthStateChanged(auth,()=>{attempt=0;start()});
 const online=()=>{attempt=0;start()},hide=()=>{suspended=true;detach()},show=()=>{suspended=false;start()};
 window.addEventListener('online',online);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 return ()=>{if(stopped)return;stopped=true;detach();stopAuth();window.removeEventListener('online',online);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show)};
}
window.ZRDocumentListener=Object.freeze({connect});
})();
