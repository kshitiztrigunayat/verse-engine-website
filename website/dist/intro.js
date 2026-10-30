// Page transition. A globe of small dots shrinks and resolves into the Verse logo, then fades to reveal the page.
// Plays on every load and refresh. Clicking an internal link plays the globe-to-logo part before navigating, and the next page
// picks up from the finished logo, so the two pages read as one animation. Skipped for reduced motion, ?motion-off and ?poster;
// any click or key skips it.
(()=>{
const html=document.documentElement,NAV_KEY='verse-nav',SKIP_KEY='verse-skip-intro';
const uncover=()=>html.classList.remove('intro-on');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||/motion-off|poster/.test(location.search);
let fromNav=false,skipArrival=false;try{const k=+sessionStorage.getItem(SKIP_KEY);skipArrival=!!k&&Date.now()-k<8000;sessionStorage.removeItem(SKIP_KEY)}catch(e){}
try{const v=+sessionStorage.getItem(NAV_KEY);fromNav=v&&Date.now()-v<8000;sessionStorage.removeItem(NAV_KEY)}catch(e){}
if(reduced){uncover();return}
const BLUE=[61,117,243],INK=[29,29,31];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,k)=>a+(b-a)*k;
const inOut=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
let seed=11;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
const N=innerWidth<700?480:780;
// ---- shapes ----
// globe: fibonacci sphere of dots
const sph=[];{const ga=Math.PI*(3-Math.sqrt(5));for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),a=i*ga;sph.push([Math.cos(a)*r,y,Math.sin(a)*r])}}
// logo: the Verse mark (hexagon, inner Y, blue accent stroke), sampled along its lines
const segs=[[19,2,35,11,0],[35,11,35,30,0],[35,30,19,39,0],[19,39,3,30,0],[3,30,3,11,0],[3,11,19,2,0],[3,11,19,21,0],[19,21,35,11,0],[19,21,19,39,0],[11,6,27,16,1]];
const lens=segs.map(s=>Math.hypot(s[2]-s[0],s[3]-s[1])),total=lens.reduce((a,b)=>a+b,0);
let logo=[];segs.forEach((s,si)=>{const n=Math.max(2,Math.round(lens[si]/total*N));for(let k=0;k<n;k++){const u=(k+.5)/n;logo.push([(s[0]+(s[2]-s[0])*u-19)/20,(s[1]+(s[3]-s[1])*u-20.5)/20,s[4]])}});
while(logo.length>N)logo.pop();while(logo.length<N)logo.push(logo[logo.length-1]);
// shuffle which globe dot lands where, so the swarm crosses itself on the way in
const order=logo.map((_,i)=>i);for(let i=N-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
const dM=logo.map(()=>rnd()),ph=logo.map(()=>rnd()*6.28);
// ---- timeline (ms) ----
const MORPH0=800,MDUR=700,MDELAY=260,MEND=MORPH0+MDUR+MDELAY,HOLD=220,END=MEND+HOLD+380;
// ---- canvas ----
let cvs,ctx,W=0,H=0,dpr=1,raf=0,closed=false,mode='',prevOverflow='',run=0;
function setup(startOpacity){
 cancelAnimationFrame(raf);document.querySelectorAll('body>canvas[aria-hidden]').forEach(c=>c.remove());run++;closed=false;cvs=document.createElement('canvas');ctx=cvs.getContext('2d');if(!ctx)return false;
 Object.assign(cvs.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'9999',background:'#fff',opacity:String(startOpacity),transition:'opacity .4s ease',pointerEvents:'auto'});
 cvs.setAttribute('aria-hidden','true');if(html.style.overflow!=='hidden')prevOverflow=html.style.overflow;html.style.overflow='hidden';document.body.appendChild(cvs);size();addEventListener('resize',size);return true}
function size(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cvs.width=W*dpr;cvs.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
function teardown(){closed=true;cancelAnimationFrame(raf);removeEventListener('resize',size);removeEventListener('keydown',skip);if(cvs){const c=cvs;c.style.opacity='0';setTimeout(()=>c.remove(),450)}html.style.overflow=prevOverflow}
function skip(){if(mode==='intro')teardown()}
function draw(T){
 ctx.clearRect(0,0,W,H);
 const m=Math.min(W,H),cx=W/2,cy=H/2,Rg=m*.2,Ls=m*.14,sk=m/900+.55;
 const fadeIn=clamp(T/450,0,1);
 const g=inOut(clamp((T-MORPH0)/(MDUR+MDELAY),0,1));            // overall shrink
 const R=lerp(Rg,Ls*1.05,g);
 const ang=T*.0011+.6,ca=Math.cos(ang),sa=Math.sin(ang),tilt=.42,ct=Math.cos(tilt),st=Math.sin(tilt);
 for(let i=0;i<N;i++){
  const p=sph[i];
  const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca,y=p[1];
  const y2=y*ct-z*st,z2=y*st+z*ct;
  const ax=cx+x*R,ay=cy+y2*R;
  const lg=logo[order[i]];
  const bx=cx+lg[0]*Ls+Math.sin(T*.004+ph[i])*.5,by=cy+lg[1]*Ls+Math.cos(T*.004+ph[i])*.5;
  const e=inOut(clamp((T-MORPH0-dM[i]*MDELAY)/MDUR,0,1));
  const px=lerp(ax,bx,e),py=lerp(ay,by,e);
  const depth=(z2+1)/2;
  const al=lerp(.22+.78*depth,1,e)*fadeIn;
  const base=lg[2]?BLUE:INK;
  const r=lerp(BLUE[0],base[0],e)|0,gg=lerp(BLUE[1],base[1],e)|0,b=lerp(BLUE[2],base[2],e)|0;
  ctx.globalAlpha=al;ctx.fillStyle=`rgb(${r},${gg},${b})`;
  ctx.beginPath();ctx.arc(px,py,Math.max(.7,sk*lerp(.8+1.5*depth,lg[2]?1.5:1.35,e)),0,6.2832);ctx.fill()}
 ctx.globalAlpha=1}
// ---- sequences ----
function runIntro(){
 if(!setup(1)){uncover();return}uncover();mode='intro';
 addEventListener('keydown',skip);cvs.addEventListener('pointerdown',skip);
 let t0=null;const off=fromNav?MEND+40:0;               // arriving by transition: the logo is already formed
 const id=run,frame=ts=>{if(closed||id!==run)return;if(t0===null)t0=ts;const T=ts-t0+off;draw(Math.min(T,MEND+HOLD+400));
  if(T>=MEND+HOLD)cvs.style.opacity='0';if(T>=END+120){teardown();return}raf=requestAnimationFrame(frame)};
 raf=requestAnimationFrame(frame);setTimeout(()=>{if(!closed&&id===run)teardown()},END+2200)}
function runExit(href){
 if(!setup(0)){location.href=href;return}mode='exit';
 try{sessionStorage.setItem(NAV_KEY,String(Date.now()))}catch(e){}
 requestAnimationFrame(()=>{cvs.style.opacity='1'});
 let t0=null,go=false;const START=380,SPEED=1.9;        // join the globe part-way and run faster
 const id=run,frame=ts=>{if(closed||id!==run)return;if(t0===null)t0=ts;const T=Math.min(START+(ts-t0)*SPEED,MEND+40);draw(T);
  if(T>=MEND+40&&!go){go=true;location.href=href}
  raf=requestAnimationFrame(frame)};
 raf=requestAnimationFrame(frame);
 setTimeout(()=>{if(mode==='exit'&&id===run)teardown()},2500)}
// ---- hook up ----
addEventListener('pageshow',e=>{if(e.persisted){closed=true;cancelAnimationFrame(raf);document.querySelectorAll('body>canvas[aria-hidden]').forEach(c=>c.remove());html.style.overflow='';uncover()}});
document.addEventListener('click',e=>{
 if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const a=e.target.closest&&e.target.closest('a[href]');if(!a||mode==='exit')return;
 // Moving around inside the documentation (left nav) is plain navigation: no transition on either page.
 if(a.closest('.docs-sidebar,.docs-mobile,.docs-nav-content')){try{sessionStorage.setItem(SKIP_KEY,String(Date.now()))}catch(x){}return}
 if(a.target&&a.target!=='_self'||a.hasAttribute('download'))return;
 let u;try{u=new URL(a.href,location.href)}catch(x){return}
 if(u.origin!==location.origin)return;
 if(u.pathname===location.pathname&&u.search===location.search)return;     // same page / hash jumps
 if(/\.(zip|tgz|rbz|pdf|json|xml|txt|mp4|png|jpe?g|webp)$/i.test(u.pathname))return;
 e.preventDefault();runExit(u.href)},true);
const start=()=>{if(skipArrival){uncover();return}runIntro()};
if(document.body)start();else addEventListener('DOMContentLoaded',start);
})();
