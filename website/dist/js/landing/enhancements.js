export function createEnhancements({gsap,ST,reduced,scrollToTarget}){
 const $=s=>document.querySelector(s),cards=[...document.querySelectorAll('.possibility-card')];
 const section=$('.possibility-gallery'),viewport=$('.gallery-viewport'),track=$('.gallery-track');
 const abort=new AbortController(),options={signal:abort.signal};let tween=null,index=0;
 const total=cards.length;
 function setIndex(next){index=Math.max(0,Math.min(total-1,next));$('#gallery-current').textContent=String(index+1).padStart(2,'0');$('[data-gallery-prev]').disabled=index===0;$('[data-gallery-next]').disabled=index===total-1;$('.gallery-progress i').style.transform=`scaleX(${(index+1)/total})`;cards.forEach((card,i)=>{if(i===index)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});}
 function positionCards(){
  const center=viewport.getBoundingClientRect().left+viewport.clientWidth/2;
  let closest=0,distance=Infinity;
  const trackLeft=track.getBoundingClientRect().left;
  cards.forEach((card,i)=>{const offset=(trackLeft+card.offsetLeft+card.offsetWidth/2-center)/viewport.clientWidth,amount=Math.max(-1.6,Math.min(1.6,offset));const d=Math.abs(offset);if(d<distance){distance=d;closest=i;}
  });
  const progress=tween?tween.progress():viewport.scrollLeft/Math.max(1,maxTravel());
  setIndex(tween||innerWidth>800?Math.round(progress*(total-1)):closest);
 }
 const maxTravel=()=>Math.max(0,track.scrollWidth-viewport.clientWidth);
 function goTo(next,instant=false){
  const target=Math.max(0,Math.min(total-1,next));
  if(tween){const s=tween.scrollTrigger;scrollToTarget(s.start+(target/(total-1))*(s.end-s.start),instant);if(instant)tween.progress(target/(total-1));}
  else{const left=innerWidth>800?maxTravel()*target/(total-1):cards[target].offsetLeft-(viewport.clientWidth-cards[target].offsetWidth)/2;viewport.scrollTo({left,behavior:instant||reduced?'instant':'smooth'});}
  setIndex(target);
 }
 $('[data-gallery-prev]').addEventListener('click',event=>goTo(index-1,event.detail===0),options);
 $('[data-gallery-next]').addEventListener('click',event=>goTo(index+1,event.detail===0),options);
 viewport.addEventListener('scroll',positionCards,{...options,passive:true});
 cards.forEach((card,i)=>card.addEventListener('focus',()=>goTo(i,true),options));
 section.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();goTo(event.key==='Home'?0:event.key==='End'?total-1:index+(event.key==='ArrowRight'?1:-1),true);},options);
 const copy=$('[data-copy-scene]');copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('https://verse.ctruh.com/s/your-scene');$('.share-feedback').textContent='Copy link ✓';}catch{$('.share-feedback').textContent='verse.ctruh.com/s/your-scene';}},options);
 setIndex(0);
 return{
  mount(){
   if(reduced||innerWidth<=800||!gsap||!ST){positionCards();return;}
   section.dataset.pinned='true';
   tween=gsap.to(track,{x:()=>-maxTravel(),ease:'none',onUpdate:positionCards,scrollTrigger:{trigger:section,start:'top top',end:()=>'+='+Math.max(innerWidth*1.3,maxTravel()*1.25),pin:'.gallery-stage',scrub:.65,invalidateOnRefresh:true,onRefresh:positionCards}});
   positionCards();
  },
  dispose(){abort.abort();tween?.scrollTrigger?.kill();tween?.kill();}
 };
}
