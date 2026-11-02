/** Challenge entry form (design mockup: validates, never sends). */
export function mount(){
 const form=document.getElementById('ch-form');if(!form)return ()=>{};
 const tabs=[...form.querySelectorAll('[data-tab]')],panels={upload:'p-upload',link:'p-link',wa:'p-wa'};let active='upload';
 const err=document.getElementById('ch-error'),done=document.getElementById('ch-done'),file=document.getElementById('ch-file'),fname=document.getElementById('ch-file-name');
 function select(key,focus){active=key;tabs.forEach(t=>{const on=t.dataset.tab===key;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;document.getElementById(panels[t.dataset.tab]).hidden=!on;if(on&&focus)t.focus()})}
 tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(t.dataset.tab));t.addEventListener('keydown',e=>{const d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();select(tabs[(i+d+tabs.length)%tabs.length].dataset.tab,true)}})});
 file.addEventListener('change',()=>{const f=file.files[0];fname.textContent=f?f.name+' · '+(f.size/1048576).toFixed(1)+' MB':'Choose your 3D file'});
 form.addEventListener('submit',e=>{e.preventDefault();done.hidden=true;const f=new FormData(form),msg=[];
  if(!f.get('name').trim())msg.push('your name');
  if(!/^\S+@\S+\.\S+$/.test(f.get('email')))msg.push('a valid email');
  if(!f.get('company').trim())msg.push('your company');
  if(active==='upload'&&!file.files[0])msg.push('a 3D file');
  else if(active==='upload'&&file.files[0].size>1073741824)msg.push('a file under 1 GB, or send a link instead');
  if(active==='link'&&!/^https?:\/\/\S+/.test(f.get('link')||''))msg.push('a link to the file');
  if(!form.rights.checked)msg.push('confirmation that you have the right to send the file');
  if(msg.length){err.textContent='Please add '+msg.join(', ')+'.';err.hidden=false;return}
  err.hidden=true;done.hidden=false;done.scrollIntoView({block:'nearest',behavior:'smooth'})});
return ()=>{};
}
