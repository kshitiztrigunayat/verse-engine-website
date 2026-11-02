// Verifies the built single-page app in dist/. Run after `npm run build`.
//   node tools/verify.mjs                     static checks
//   node tools/verify.mjs --http=http://127.0.0.1:4173   also fetches every route from a running server
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), dist=path.join(project,'dist');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const errors=[];const err=m=>errors.push(m);
const exists=f=>fs.existsSync(f);
const read=f=>fs.readFileSync(f,'utf8');

// --- manifest and route payloads ---
const manifestFile=path.join(dist,'content/manifest.json');
if(!exists(path.join(dist,'index.html')))err('dist/index.html is missing');
if(!exists(manifestFile))err('content/manifest.json is missing');
const manifest=exists(manifestFile)?JSON.parse(read(manifestFile)):[];
const routes=new Set(manifest.map(r=>r.path));
const fileFor=route=>route==='/'?'index':route.slice(1).replaceAll('/','__');
const REQUIRED=['path','kind','chrome','title','description','bodyClass','html'];
const payloads=new Map();
for(const {path:route} of manifest){
  const f=path.join(dist,'content',fileFor(route)+'.json');
  if(!exists(f)){err('missing payload for '+route);continue}
  let p;try{p=JSON.parse(read(f))}catch{err('invalid JSON: '+f);continue}
  for(const k of REQUIRED)if(p[k]===undefined)err(`${route}: payload lacks "${k}"`);
  payloads.set(route,p);
}
if(!exists(path.join(dist,'content/404.json')))err('content/404.json is missing');

// --- links, ids, resources ---
let checkedReferences=0;
function resolveRef(raw,from){
  const ref=raw.replaceAll('&amp;','&');if(!ref||/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(ref))return;
  let pathname;try{pathname=decodeURIComponent(ref.split(/[?#]/)[0])}catch{err('Invalid URL in '+from);return}
  if(!pathname)return;
  checkedReferences++;
  if(!pathname.startsWith('/')){const t=path.resolve(path.dirname(from),pathname);if(!exists(t))err(`${path.relative(dist,from)} -> ${ref}`);return}
  const route=pathname.replace(/\/+$/,'')||'/';
  if(routes.has(route)||exists(path.join(dist,pathname))&&fs.statSync(path.join(dist,pathname)).isFile())return;
  err(`${from.startsWith(dist)?path.relative(dist,from):from} -> ${ref}`);
}
// The shell markup is the React component src/Shell.jsx (index.html only holds <head> and an empty <body>).
const shell=read(path.join(dist,'index.html'))+read(path.join(project,'src/Shell.jsx'));
const shellIds=[...shell.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
const dup=ids=>ids.filter((id,i)=>ids.indexOf(id)!==i);
for(const d of dup(shellIds))err('duplicate id in shell: '+d);
for(const m of shell.matchAll(/(?:href|src)="([^"]+)"/g))resolveRef(m[1],path.join(dist,'index.html'));
for(const [route,p] of payloads){
  const ids=[...p.html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  for(const d of dup([...shellIds,...ids]))err(`duplicate id on ${route}: ${d}`);
  for(const m of p.html.matchAll(/(?:href|src)="([^"]+)"/g))resolveRef(m[1],`content:${route}`);
}
for(const f of walk(dist)){
  if(f.includes(path.sep+'vendor'+path.sep))continue;
  const ext=path.extname(f);
  if(ext==='.css')for(const m of read(f).matchAll(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g))resolveRef(m[1],f);
  if(ext==='.js'||ext==='.mjs'){
    const t=read(f);
    for(const m of t.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g))resolveRef(m[1],f);
    const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)err(r.stderr);
  }
  if(ext==='.json'){try{JSON.parse(read(f))}catch{err('Invalid JSON: '+path.relative(dist,f))}}
}

// --- optional HTTP pass ---
const origin=process.argv.find(a=>a.startsWith('--http='))?.slice(7);let httpRoutes=0;
if(origin){
  const list=[...routes];
  for(let i=0;i<list.length;i+=8)await Promise.all(list.slice(i,i+8).map(async route=>{
    try{
      const page=await fetch(new URL(route,origin)),body=await page.text();
      if(!page.ok||!body.includes('<body id="app-body">'))err(`HTTP ${page.status} (shell) ${route}`);
      const data=await fetch(new URL('/content/'+fileFor(route)+'.json',origin));if(!data.ok)err(`HTTP ${data.status} payload ${route}`);else{await data.arrayBuffer();httpRoutes++}
    }catch(e){err(route+': '+e.message)}}));
  const unknown=await fetch(new URL('/no-such-route-xyz',origin));if(!(await unknown.text()).includes('<body id="app-body">'))err('Unknown routes should receive the app shell');
  const missing=await fetch(new URL('/assets/missing-file.png',origin));if(missing.status!==404)err('Missing static files should return 404');
}
const report={ok:errors.length===0,routes:routes.size,runtimeFiles:walk(dist).length,checkedReferences,httpRoutes,errors:errors.slice(0,40)};
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
