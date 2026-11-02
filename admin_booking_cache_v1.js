// Compatibility adapter for legacy reservation cache readers.
// Firestore is authoritative; full administrator history must not fill LocalStorage.
(()=>{
'use strict';
if(window.ZRBookingCache)return;
const KEY='zr_bookings',storage=window.localStorage,proto=Storage.prototype;
const get=proto.getItem,set=proto.setItem,remove=proto.removeItem,clear=proto.clear;
let value=null;
function read(){
  if(value!==null)return value;
  try{return get.call(storage,KEY)}catch{return null}
}
function write(serialized){
  value=String(serialized);
  // Only remove the redundant reservation cache, never settings or draft stores.
  try{remove.call(storage,KEY)}catch{}
}
proto.getItem=function(key){return this===storage&&String(key)===KEY?read():get.apply(this,arguments)};
proto.setItem=function(key,serialized){
  if(this===storage&&String(key)===KEY&&arguments.length>=2){write(serialized);return}
  return set.apply(this,arguments);
};
proto.removeItem=function(key){
  const result=remove.apply(this,arguments);
  if(this===storage&&String(key)===KEY)value=null;
  return result;
};
proto.clear=function(){
  const result=clear.apply(this,arguments);
  if(this===storage)value=null;
  return result;
};
window.ZRBookingCache=Object.freeze({read,write});
})();
