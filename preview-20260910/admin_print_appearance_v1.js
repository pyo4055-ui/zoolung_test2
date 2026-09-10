(()=>{
'use strict';
// Copy appearance before the print builders remove controls from their clones.
// Never copy geometry, typography size/weight, graph data, or page rules.
const properties=Object.freeze([
  'color','-webkit-text-fill-color','font-family','background-color','background-image',
  'border-top-color','border-right-color','border-bottom-color','border-left-color',
  'fill','stroke','text-decoration-color'
]);
window.zrCopyAdminPrintAppearanceV1=(source,clone)=>{
  const originals=[source,...source.querySelectorAll('*')];
  const copies=[clone,...clone.querySelectorAll('*')];
  if(originals.length!==copies.length)throw new Error('Print appearance requires an unchanged clone');
  originals.forEach((element,index)=>{
    const style=getComputedStyle(element),target=copies[index];
    properties.forEach(property=>{
      const value=style.getPropertyValue(property);
      if(value)target.style.setProperty(property,value,'important');
    });
  });
};
})();
