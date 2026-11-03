export function createPluginShowcase({gsap,reduced}){
 const $=s=>document.querySelector(s),abort=new AbortController(),options={signal:abort.signal};
 const tabs=[...document.querySelectorAll('[data-publisher]')],visual=$('[data-plugin-visual]'),tablist=$('.plugin-tabs');let current=0;
 const data=[{model:'blender',alt:'Illustration of a detailed ceramic vessel published from Blender to a browser',name:'Blender',description:'Publish a scene in one click, straight from the sidebar.',time:45,label:'Scene to link',scene:'Scene → link'},{model:'unity',alt:'Illustration of an industrial hall scene published from Unity to a browser',name:'Unity',description:'Ship Unity scenes to the web without a WebGL build.',time:101,label:'Scene to link',scene:'Scene → link'},{model:'unreal',alt:'Illustration of an architectural level published from Unreal Engine to a browser',name:'Unreal Engine',description:'Cinematic Unreal levels that open on any phone.',time:70,label:'Level to link',scene:'Level → link'}];
 function select(index,focus=false,instant=false){
  current=index;tablist.dataset.input=instant?'keyboard':'pointer';const item=data[index];
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;if(focus&&i===index)tab.focus()});$('#plugin-view').setAttribute('aria-labelledby',tabs[index].id);
  $('#plugin-name').textContent=item.name;$('.plugin-source-label').textContent=`${item.name} → Verse Engine`;$('#plugin-description').textContent=item.description;$('#plugin-time').replaceChildren(document.createTextNode(String(item.time)),Object.assign(document.createElement('span'),{textContent:'s'}));$('#plugin-timing-label').textContent=item.label;$('#plugin-scene-label').textContent=item.scene;$('.workflow-editor').textContent=item.name;document.querySelectorAll('[data-publishing-model]').forEach(model=>model.setAttribute('href','#plugin-mesh-'+item.model));$('.publishing-drawing').setAttribute('aria-label',item.alt);
  gsap.killTweensOf(visual);visual.style.opacity='1';
  if(!reduced&&!instant)gsap.fromTo(visual,{opacity:.55},{opacity:1,duration:.25,ease:'power3.out',clearProps:'opacity'});
 }
 tabs.forEach((tab,index)=>{tab.addEventListener('click',event=>select(index,false,event.detail===0),options);tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(current+(['ArrowRight','ArrowDown'].includes(event.key)?1:2))%3;select(next,true,true)}},options)});
 return{dispose(){abort.abort();gsap.killTweensOf(visual)}};
}
