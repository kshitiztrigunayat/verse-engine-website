import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(project,'dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(dist),errors=[];let checkedReferences=0;
function checkReference(raw,file){
 const ref=raw.replaceAll('&amp;','&');if(!ref||/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(ref))return;
 let pathname;try{pathname=decodeURIComponent(ref.split(/[?#]/)[0])}catch{errors.push('Invalid URL in '+path.relative(dist,file));return}
 if(!pathname)return;let target=path.resolve(pathname.startsWith('/')?dist:path.dirname(file),'.'+(pathname.startsWith('/')?pathname:'/'+pathname));
 if(!target.startsWith(dist+path.sep)&&target!==dist){errors.push('Path escapes dist: '+ref);return}
 if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
 checkedReferences++;if(!fs.existsSync(target))errors.push(path.relative(dist,file)+' → '+ref);
}
for(const file of files){
 const ext=path.extname(file);if(!['.html','.css','.js','.mjs','.json'].includes(ext))continue;
 const text=fs.readFileSync(file,'utf8');
 if(ext==='.html')for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g))checkReference(m[1],file);
 if(ext==='.css')for(const m of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))checkReference(m[1],file);
 if(['.js','.mjs'].includes(ext))for(const m of text.matchAll(/(?:from\s*|import\s*\(\s*)['"](\.[^'"]+)['"]/g))checkReference(m[1],file);
 if(ext==='.json')try{JSON.parse(text)}catch{errors.push('Invalid JSON: '+path.relative(dist,file))}
 if(['.js','.mjs'].includes(ext)&&!file.includes(path.sep+'vendor'+path.sep)){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)errors.push(result.stderr);
 }
}
const routes=files.filter(f=>f.endsWith('index.html')).map(f=>'/'+path.relative(dist,f).replaceAll('\\','/').replace(/index\.html$/,''));
const origin=process.argv.find(a=>a.startsWith('--http='))?.slice(7);let httpRoutes=0;
if(origin){for(let i=0;i<routes.length;i+=8)await Promise.all(routes.slice(i,i+8).map(async route=>{try{const r=await fetch(new URL(route,origin));if(!r.ok)errors.push('HTTP '+r.status+' '+route);else httpRoutes++;await r.arrayBuffer()}catch(e){errors.push(route+': '+e.message)}}));const missing=await fetch(new URL('/missing-handoff-route/',origin));if(missing.status!==404)errors.push('Unknown routes should return 404');}
const report={ok:errors.length===0,routes:routes.length,runtimeFiles:files.length,checkedReferences,httpRoutes,errors};
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
