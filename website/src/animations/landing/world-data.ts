// Deterministic surface vertices, in metres. Every reveal belongs to the same world.
export function buildWorld(density=1){
 const buckets=Array.from({length:5},()=>[]);let seed=7219;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 const palette={stone:[.69,.67,.62],wood:[.47,.31,.21],fabric:[.73,.74,.70],glass:[.47,.65,.71],metal:[.38,.42,.45],leaf:[.31,.43,.31],ground:[.45,.48,.43],white:[.82,.82,.78]};
 function point(x,y,z,l,c,nx=0,ny=1,nz=0){const r=rand(),v=.84+rand()*.22,k=Math.min(4,Math.round(l)),j=.001*(1+k*k);buckets[k].push(x+(rand()-.5)*j,y+(rand()-.5)*j,z+(rand()-.5)*j,c[0]*v,c[1]*v,c[2]*v,nx,ny,nz,l+r*.17,r);}
 function box(x,y,z,w,h,d,l,c,step=.1,round=0,angle=0){
  step/=Math.sqrt(density);const co=Math.cos(angle),si=Math.sin(angle),half=[w/2,h/2,d/2];
  for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
   const a=(axis+1)%3,b=(axis+2)%3,na=Math.max(1,Math.ceil(half[a]*2/step)),nb=Math.max(1,Math.ceil(half[b]*2/step));
   for(let i=0;i<=na;i++)for(let j=0;j<=nb;j++){
    const p=[0,0,0];p[axis]=half[axis]*side;p[a]=(i/na*2-1)*half[a];p[b]=(j/nb*2-1)*half[b];
    let normal=[0,0,0];normal[axis]=side;
    if(round){const core=p.map((v,k)=>Math.max(-half[k]+round,Math.min(half[k]-round,v))),delta=p.map((v,k)=>v-core[k]),len=Math.hypot(...delta)||1;normal=delta.map(v=>v/len);for(let k=0;k<3;k++)p[k]=core[k]+normal[k]*round;}
    point(x+p[0]*co+p[2]*si,y+p[1],z-p[0]*si+p[2]*co,l,c,normal[0]*co+normal[2]*si,normal[1],-normal[0]*si+normal[2]*co);
   }
  }
 }
 function tube(x,y,z,r,h,l,c,step=.08){const n=Math.max(10,Math.ceil(2*Math.PI*r/step)),rows=Math.max(2,Math.ceil(h/step));for(let j=0;j<=rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2;point(x+Math.cos(a)*r,y+j/rows*h,z+Math.sin(a)*r,l,c,Math.cos(a),0,Math.sin(a));}}
 function foliage(x,y,z,r,l){const count=Math.round(r*r*90*density);for(let i=0;i<count;i++){const a=rand()*Math.PI*2,v=rand()*2-1,s=Math.sqrt(1-v*v),radius=r*(.58+rand()*.42);point(x+Math.cos(a)*s*radius,y+v*radius*.85,z+Math.sin(a)*s*radius,l,palette.leaf,Math.cos(a)*s,v,Math.sin(a)*s);}}
 // 0. A fluted ceramic vessel, sitting at the centre of the coffee table.
 const profile=[[0,.075],[.025,.09],[.08,.118],[.18,.125],[.27,.09],[.31,.055],[.37,.052],[.385,.062]];
 for(let row=0;row<100;row++){const yy=row/99*.385;let k=0;while(k<profile.length-2&&yy>profile[k+1][0])k++;const t=(yy-profile[k][0])/(profile[k+1][0]-profile[k][0]);const radius=profile[k][1]*(1-t)+profile[k+1][1]*t;
  for(let i=0;i<130;i++){const a=i/130*Math.PI*2,rr=radius+.0019*Math.cos(a*28);point(Math.cos(a)*rr,.79+yy,Math.sin(a)*rr,0,palette.stone,Math.cos(a),.05,Math.sin(a));}
 }
 // 1. Table and companion seating. The vessel never changes position.
 box(0,.745,0,1.9,.09,1.05,.72,palette.stone,.026,.035);
 for(const x of [-.68,.68])box(x,.36,0,.13,.72,.67,1,palette.wood,.028,.025);
 box(2,.28,-.55,1,.16,.94,2,palette.wood,.045,.035);
 box(2,.47,-.55,.94,.24,.90,2,palette.fabric,.032,.1);
 box(2,.83,-.94,.98,.75,.18,2,palette.fabric,.035,.08,-.08);
 for(const xx of [1.62,2.38])for(const zz of [-.85,-.22])box(xx,.13,zz,.06,.26,.06,2,palette.wood,.04,.012);
 // 2. A furnished apartment: sofa, rug, lamps, shelving, window mullions and plants.
 box(-.8,-.025,-.4,8.8,.05,7.2,2,palette.stone,.10);
 box(-.5,.012,-.2,3.8,.018,2.9,2,[.53,.51,.46],.065);
 box(-.65,.26,-2.15,2.8,.22,.95,2,palette.wood,.06,.08);
 for(let i=0;i<3;i++){box(-1.55+i*.9,.47,-2.10,.86,.23,.88,2,palette.fabric,.043,.10);box(-1.55+i*.9,.84,-2.49,.88,.67,.20,2,palette.fabric,.045,.08);}
 for(const x of [-2.12,.82])box(x,.59,-2.15,.23,.56,.98,2,palette.fabric,.045,.08);
 box(-4.3,1.65,-.4,.16,3.3,7.2,2,palette.white,.13);
 box(-.8,1.65,-4,8.8,3.3,.12,2,palette.white,.12);
 for(let i=0;i<6;i++){box(-4.15,.4+i*.45,-.7,.42,.055,2.4,2,palette.wood,.055);for(let j=0;j<8;j++)box(-4.13,.56+i*.45,-1.65+j*.26,.25,.29,.055,2,[.35+j*.035,.37+j*.025,.39+j*.02],.07);}
 for(const x of [-3.3,-1.5,.3,2.1,3.3]){box(x,1.65,3.2,.055,3.3,.055,2,palette.metal,.07);box(x+.7,1.5,3.2,1.35,2.8,.015,2.1,palette.glass,.23);}
 box(0,3.25,3.2,7,.055,.07,2,palette.metal,.07);
 tube(1.4,.04,-2.6,.12,.035,2,palette.metal);tube(1.4,.07,-2.6,.025,1.55,2,palette.metal,.04);tube(1.4,1.55,-2.6,.24,.30,2,palette.fabric,.045);
 for(const [x,z] of [[-3.3,2.2],[2.8,-3.2]]){tube(x,.02,z,.24,.42,2,palette.stone,.06);tube(x,.4,z,.025,.9,2,palette.wood,.04);foliage(x,1.25,z,.58,2);}
 // 3. The apartment belongs to a residential building, with real storeys and facade details.
 function building(x,z,w,d,floors,l,detail=1){const height=floors*3.15,c=palette.white;
  box(x,height/2,z,w,height,d,l,c,detail?.67:1.35);
  for(let floor=0;floor<floors;floor++){
   const yy=floor*3.15;
   box(x,yy+.15,z+d/2+.18,w+.4,.18,.48,l,palette.stone,detail?.48:1.2);
   for(let xx=-w/2+.85;xx<w/2-.2;xx+=2.15){
    box(x+xx,yy+1.65,z+d/2+.025,1.35,1.65,.06,l,palette.glass,detail?.24:.55);
    if(detail){box(x+xx,yy+2.5,z+d/2+.08,1.4,.06,.08,l,palette.metal,.25);box(x+xx-.7,yy+1.65,z+d/2+.08,.06,1.75,.08,l,palette.metal,.25);}
    box(x+xx,yy+1.65,z-d/2-.025,1.35,1.65,.06,l,palette.glass,detail?.28:.65);
   }
   for(let zz=-d/2+1;zz<d/2-.2;zz+=2.2)box(x+w/2+.025,yy+1.65,z+zz,.06,1.65,1.4,l,palette.glass,detail?.3:.65);
  }
  box(x,height+.12,z,w+.5,.25,d+.5,l,palette.stone,detail?.55:1.1);
  for(let i=0;i<3;i++)box(x-w*.24+i*w*.25,height+.6,z,1.25,.8,1.4,l,palette.metal,.45);
 }
 building(-.5,-.5,10.2,8.4,7,3,1);
 // 4. A neighbourhood grows around that same building, with roads and shared amenities.
 const blocks=[[-38,-38,8],[-38,0,6],[-38,38,9],[0,-38,9],[0,38,6],[38,-38,7],[38,0,10],[38,38,8],[-76,-38,6],[-76,0,8],[-76,38,7],[76,-38,8],[76,0,6],[76,38,9],[-38,-76,7],[0,-76,9],[38,-76,7]];
 blocks.forEach(([x,z,f])=>building(x,z,13+(Math.abs(x)%3),11,f,4,0));
 box(0,-.18,-16,210,.10,175,4,palette.ground,2.5);
 for(const x of [-57,-19,19,57]){box(x,-.09,-16,8,.04,175,4,[.36,.39,.42],1.5);for(let z=-96;z<70;z+=8)box(x,-.06,z,.12,.01,3,4,palette.white,.6);}
 for(const z of [-57,-19,19,57])box(0,-.085,z,210,.04,7,4,[.37,.40,.43],1.6);
 box(48,.03,72,28,.12,11,4,palette.stone,.7);box(48,.11,72,25,.08,8.5,4,[.30,.57,.66],.65);
 for(let x=-90;x<=90;x+=12)for(const z of [-91,76]){tube(x,0,z,.22,2.2,4,palette.wood,.4);foliage(x,4,z,2.6,4);}
 for(let i=0;i<20;i++){const x=-85+(i%10)*18,z=i<10?-17:20;tube(x,0,z,.18,1.8,4,palette.wood,.4);foliage(x,3.2,z,2.0,4);}
 for(let i=0;i<18;i++){const x=i%2?-18:18,z=-83+i*8.7;box(x,.65,z,1.85,1.3,4.1,4,[.49,.52,.54],.65,.24);box(x,1.35,z-.15,1.65,.55,2.2,4,palette.glass,.6,.17);}
 const budget=[11000,15000,38000,24000,85000].map(n=>Math.round(n*density));
 const selected=buckets.map((b,k)=>{const count=b.length/11,limit=Math.min(count,budget[k]),out=[];for(let j=0;j<limit;j++){const at=Math.floor(j*count/limit)*11;for(let q=0;q<11;q++)out.push(b[at+q]);}return out;});
 const count=selected.reduce((n,b)=>n+b.length/11,0),positions=new Float32Array(count*3),colors=new Float32Array(count*3),normals=new Float32Array(count*3),levels=new Float32Array(count),seeds=new Float32Array(count);let cursor=0;
 selected.forEach(b=>{for(let j=0;j<b.length;j+=11){positions.set(b.slice(j,j+3),cursor*3);colors.set(b.slice(j+3,j+6),cursor*3);normals.set(b.slice(j+6,j+9),cursor*3);levels[cursor]=b[j+9];seeds[cursor]=b[j+10];cursor++;}});
 return{positions,colors,normals,levels,seeds,count,counts:selected.map(b=>b.length/11)};
}
