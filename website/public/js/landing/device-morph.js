export function createDeviceMorph({gsap,reduced}){
 const root=document.querySelector('.device-morph'),outline=root.querySelector('.device-outline'),chrome=[...root.querySelectorAll('[data-chrome]')];
 const count=128,shapes=['web','ar','xr'].map(name=>{const path=root.querySelector(`[data-outline="${name}"]`),length=path.getTotalLength();return Array.from({length:count},(_,i)=>{const p=path.getPointAtLength(i/count*length);return[p.x,p.y]})});
 const driver={value:0};let tween=null,last=-1;
 function render(value){if(Math.abs(last-value)<.00001)return;last=value;driver.value=value;const a=Math.min(1,Math.floor(value)),f=value-a;const d=shapes[a].map((p,i)=>{const q=shapes[a+1][i];return `${i?'L':'M'}${(p[0]+(q[0]-p[0])*f).toFixed(2)},${(p[1]+(q[1]-p[1])*f).toFixed(2)}`}).join('')+'Z';outline.setAttribute('d',d);chrome.forEach((group,i)=>group.style.opacity=String(Math.max(0,1-Math.abs(value-i))))}
 render(0);
 return{render,to(value,instant=false){tween?.kill();if(instant||reduced)render(value);else tween=gsap.to(driver,{value,duration:.25,ease:'power2.inOut',onUpdate:()=>render(driver.value),overwrite:true})},dispose(){tween?.kill()}};
}
