// One synchronous cache entry point, with one owner per LocalStorage key.
// Owners retain their existing preparation, remote guards and write queues.
(()=>{
'use strict';
if(window.ZRStoreDispatch)return;
const states=new WeakMap();
function register(current,owner){
  if(current?.__zrSetStoreChain?.includes(owner.id))return current;
  if(typeof current!=='function')return null;
  let state=states.get(current),wrapped=current;
  if(!state){
    state={base:current,owners:new Map()};
    wrapped=function(k){
      const handler=state.owners.get(k);
      return handler?handler.call(this,state.base,arguments):state.base.apply(this,arguments);
    };
    wrapped.__zrSetStoreChain=Array.isArray(current.__zrSetStoreChain)?[...current.__zrSetStoreChain]:[];
    states.set(wrapped,state);
  }
  if(state.owners.has(owner.key))throw new Error('Store key already has a synchronization owner');
  state.owners.set(owner.key,owner.handle);
  wrapped.__zrSetStoreChain=[...wrapped.__zrSetStoreChain,owner.id];
  wrapped[owner.marker]=true;
  return wrapped;
}
window.ZRStoreDispatch=Object.freeze({register});
})();
