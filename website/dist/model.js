import * as THREE from './vendor/three.module.js';
import {buildWorld} from './world-data.js';

export async function createExperience(host){
 const mobile=innerWidth<600;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(mobile?43:36,1,.015,1600);
 const data=buildWorld(mobile?.48:1),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geometry.setAttribute('aColor',new THREE.BufferAttribute(data.colors,3));geometry.setAttribute('aNormal',new THREE.BufferAttribute(data.normals,3));geometry.setAttribute('aLevel',new THREE.BufferAttribute(data.levels,1));geometry.setAttribute('aSeed',new THREE.BufferAttribute(data.seeds,1));
 const uniforms={uReveal:{value:.43},uDark:{value:0},uFocus:{value:0},uHeight:{value:900},uPixelRatio:{value:renderer.getPixelRatio()}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`
 attribute vec3 aColor;attribute vec3 aNormal;attribute float aLevel;attribute float aSeed;
 uniform float uReveal;uniform float uDark;uniform float uFocus;uniform float uHeight;uniform float uPixelRatio;
 varying vec3 vColor;varying float vAlpha;
 void main(){
  float stage=floor(aLevel);float born=smoothstep(aLevel-.48,aLevel+.12,uReveal);
  vec3 jitter=vec3(sin(aSeed*137.2),cos(aSeed*83.7),sin(aSeed*271.1));
  vec3 p=position+jitter*(1.-born)*(1.-born)*(.035+stage*stage*.045);
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  float physical=mix(.0022,.15,clamp(aLevel/4.,0.,1.));if(aLevel<.5)physical=.0018;
  gl_PointSize=clamp(physical*uHeight/max(.02,-mv.z),1.35,2.6)*uPixelRatio;
  float shade=.64+.36*abs(dot(normalize(aNormal),normalize(vec3(-.6,1.,.7))));
  vec3 ink=mix(vec3(.055,.075,.11),aColor*.45,.34);
  vec3 luminous=mix(vec3(.96,.98,1.),aColor,.10);
  vColor=mix(ink*shade,luminous*max(.9,shade),uDark);
  float context=mix(1.,.28,smoothstep(stage+1.8,stage+2.8,uReveal));
  float focusAlpha=stage>3.5?.025:stage<2.5?.25:1.;
  vAlpha=born*(.72+aSeed*.24)*context*mix(1.,focusAlpha,uFocus);
  if(born<.005)gl_PointSize=0.;
 }`,fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);if(r>.5||vAlpha<.005)discard;float alpha=(1.-smoothstep(.18,.5,r))*vAlpha;gl_FragColor=vec4(vColor,alpha);}`});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);
 const radii=[.9,4.6,21.5,64,260,600];
 const targets=[[0,.98,0],[.1,.62,-.1],[-.6,1.05,-.6],[-.5,8,-.5],[0,8,-17],[0,8,-17]];
 const directions=[[.85,.34,1.35],[1,.47,1.5],[1,.82,1.3],[1,1.05,1.3],[1,1.12,1.45],[1,1.22,1.35]];
 const eye=new THREE.Vector3(),target=new THREE.Vector3(),direction=new THREE.Vector3(),focusTarget=new THREE.Vector3(-.5,11.5,-.5),focusEye=new THREE.Vector3(),viewTarget=new THREE.Vector3();let w=1,h=1,device={x:0,y:0,scale:1};
 const buildingCorners=[];for(const x of [-5.6,4.6])for(const y of [0,23])for(const z of [-4.7,3.7])buildingCorners.push(new THREE.Vector3(x,y,z));
 const projected=new THREE.Vector3();
 function projectedBounds(){let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;camera.updateMatrixWorld(true);for(const p of buildingCorners){projected.copy(p).project(camera);const x=(projected.x*.5+.5)*w,y=(.5-projected.y*.5)*h;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return{width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};}
 function resize(){const rect=host.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();uniforms.uHeight.value=h;const svg=document.querySelector('.device-morph'),r=svg.getBoundingClientRect(),scale=Math.min(r.width/720,r.height/420);device={x:r.left-rect.left+(r.width-720*scale)/2,y:r.top-rect.top+(r.height-420*scale)/2,scale};}
 resize();const observer=new ResizeObserver(resize);observer.observe(host);
 const ease=x=>x*x*(3-2*x);
 function update(pose,time,pointer,paused=false){
  const progress=Math.max(0,Math.min(5,pose.progress??0)),i=Math.min(4,Math.floor(progress)),f=ease(progress-i);
  const mobileScale=[1.5,1.8,2.0,1.4,2.0,1.45];
  const radius=Math.exp(THREE.MathUtils.lerp(Math.log(radii[i]),Math.log(radii[i+1]),f))*(mobile?THREE.MathUtils.lerp(mobileScale[i],mobileScale[i+1],f):1);
  for(let k=0;k<3;k++){target.setComponent(k,THREE.MathUtils.lerp(targets[i][k],targets[i+1][k],f));direction.setComponent(k,THREE.MathUtils.lerp(directions[i][k],directions[i+1][k],f));}
  if(!paused){direction.x+=pointer.x*.07+Math.sin(time*.18)*.004;direction.y+=pointer.y*.025;}
  const focus=pose.focus??0;
  if(pose.view!=null){direction.x+=pose.view*.14;direction.y-=pose.view*.025;}direction.normalize();eye.copy(target).addScaledVector(direction,radius);
  let px=pose.x??.74,py=pose.y??.49;
  if(focus>0){
   const view=Math.min(2,Math.max(0,pose.view??0)),a=Math.min(1,Math.floor(view)),f=view-a,regions=[[82,105,638,366],[272,50,448,377],[120,100,600,342]],region=regions[a].map((v,k)=>THREE.MathUtils.lerp(v,regions[a+1][k],f));
   const cx=device.x+(region[0]+region[2])/2*device.scale,cy=device.y+(region[1]+region[3])/2*device.scale,destW=(region[2]-region[0])*device.scale*.86,destH=(region[3]-region[1])*device.scale*.76;
   let distance=130;camera.setViewOffset(w,h,(.5-cx/w)*w,(.5-cy/h)*h,w,h);
   for(let n=0;n<3;n++){camera.position.copy(focusTarget).addScaledVector(direction,distance);camera.lookAt(focusTarget);const bounds=projectedBounds();distance*=Math.max(bounds.width/destW,bounds.height/destH);}
   camera.position.copy(focusTarget).addScaledVector(direction,distance);camera.lookAt(focusTarget);const bounds=projectedBounds(),fitX=cx/w+(cx-bounds.x)/w,fitY=cy/h+(cy-bounds.y)/h;
   focusEye.copy(focusTarget).addScaledVector(direction,distance);camera.position.lerpVectors(eye,focusEye,focus);viewTarget.lerpVectors(target,focusTarget,focus);camera.lookAt(viewTarget);px=THREE.MathUtils.lerp(px,fitX,focus);py=THREE.MathUtils.lerp(py,fitY,focus);
  }else{camera.position.copy(eye);camera.lookAt(target);}
  camera.setViewOffset(w,h,(.5-px)*w,(.5-py)*h,w,h);
  host.style.maskImage=focus>.95||mobile?'none':px>.6?'linear-gradient(90deg,transparent 0%,transparent 38%,#000 51%,#000 100%)':px<.4?'linear-gradient(90deg,#000 0%,#000 48%,transparent 63%,transparent 100%)':'none';
  uniforms.uReveal.value=.43+progress*.95;uniforms.uDark.value=Math.max(0,Math.min(1,pose.dark??0));uniforms.uFocus.value=focus;
  renderer.render(scene,camera);
 }
 host.dataset.vertexCount=String(data.count);
 return{update,resize,renderer,dispose(){observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();}};
}
