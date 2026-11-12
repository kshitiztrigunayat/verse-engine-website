// Verifies the built single-page app in dist/. Run after `npm run build`.
//   node tools/verify.ts                     static checks
//   node tools/verify.ts --unique            only the unique titles/descriptions check (part of `npm run build`)
//   node tools/verify.ts --http=http://127.0.0.1:4173   also fetches every route from a running server
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {META} from '../src/pages/meta.ts';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), dist=path.join(project,'dist');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const errors=[];const err=m=>errors.push(m);
const exists=f=>fs.existsSync(f);
const read=f=>fs.readFileSync(f,'utf8');

// --- manifest and route payloads ---
const manifestFile=path.join(dist,'content/manifest.json');
if(!exists(path.join(dist,'index.html')))err('dist/index.html is missing');
if(!exists(manifestFile))err('content/manifest.json is missing');
const manifest: { path: string; noindex?: boolean }[]=exists(manifestFile)?JSON.parse(read(manifestFile)):[];
const routes=new Set(manifest.map(r=>r.path));
const fileFor=route=>route==='/'?'index':route.slice(1).replaceAll('/','__');
// React pages: src/pages/index.ts maps a route to a loader of its component file; check that file's ids and links.
const pagesIndex=read(path.join(project,'src/pages/index.ts'));
const reactPages=new Map([...pagesIndex.matchAll(/^\s+"(\/[^"]*)": \(\) => import\("\.\/([^"]+)"\),/gm)].map(m=>[m[1],read(path.join(project,'src/pages',m[2]))]));
// React pages' meta (title, description, ...) is src/pages/meta.ts; other routes have a payload.
for(const r of Object.keys(META))if(!reactPages.has(r))err(`src/pages/meta.ts: ${r} has no page in src/pages/index.ts`);
for(const r of reactPages.keys())if(!META[r])err(`src/pages/index.ts: ${r} has no meta in src/pages/meta.ts`);
const REQUIRED=['path','kind','chrome','title','description','bodyClass'];
const payloads=new Map();
for(const {path:route} of [...manifest,{path:'/404'}]){
  if(META[route]){const p={path:route,...META[route]};for(const k of REQUIRED)if(p[k]===undefined)err(`${route}: meta lacks "${k}"`);payloads.set(route,p);continue}
  const f=path.join(dist,'content',fileFor(route)+'.json');
  if(!exists(f)){err('missing payload for '+route);continue}
  let p;try{p=JSON.parse(read(f))}catch{err('invalid JSON: '+f);continue}
  for(const k of REQUIRED)if(p[k]===undefined)err(`${route}: payload lacks "${k}"`);
  if(p.html===undefined&&p.docs===undefined&&!reactPages.has(route))err(`${route}: payload lacks "html" (or "docs")`);
  payloads.set(route,p);
}

// --- unique titles and descriptions (SEO blueprint, Part C) ---
// Indexable pages only: noindex pages and old addresses that vercel.json redirects (e.g. /docs/api) are left out.
const redirected=new Set(JSON.parse(read(path.join(project,'vercel.json'))).redirects.map(r=>r.source));
const indexable=manifest.filter(r=>!r.noindex&&!redirected.has(r.path)&&payloads.has(r.path)).map(r=>[r.path,payloads.get(r.path)]);
for(const key of ['title','description']){const seen=new Map();for(const [route,p] of indexable){if(seen.has(p[key]))err(`same ${key} on ${seen.get(p[key])} and ${route}`);else seen.set(p[key],route)}}
// `--unique` (run by `npm run build`): stop here, so only a duplicate (or a missing payload) fails the build.
if(process.argv.includes('--unique')){console.log(errors.length?errors.join('\n'):'Titles and descriptions are unique.');process.exit(errors.length?1:0)}

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
// The shell markup is the React component src/Shell.tsx (index.html only holds <head> and an empty <body>).
const shell=read(path.join(dist,'index.html'))+read(path.join(project,'src/Shell.tsx'));
const shellIds=[...shell.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
const dup=ids=>ids.filter((id,i)=>ids.indexOf(id)!==i);
for(const d of dup(shellIds))err('duplicate id in shell: '+d);
for(const m of shell.matchAll(/(?:href|src)="([^"]+)"/g))resolveRef(m[1],path.join(dist,'index.html'));
// Docs pages: the layout is src/pages/docs/DocsPage.tsx + nav.json; the payload holds the article, source link and "on this page" links.
const docsLayout=read(path.join(project,'src/pages/docs/DocsPage.tsx')),docsNav=JSON.parse(read(path.join(project,'src/pages/docs/nav.json')));
const docsNavHtml=[0,1].map(i=>docsNav.map(g=>`<section id="${g.ids[i]}">`+g.items.map(n=>`<a href="${n.href}" id="${n.ids[i]}">`).join('')).join('')).join('');
const htmlOf=p=>p.html??(reactPages.has(p.path)?reactPages.get(p.path):null)??[docsLayout.match(/\sid="[^"]+"/g).join(' '),docsNavHtml,p.docs.article,`<a href="${p.docs.source}">`,...p.docs.toc.map(t=>`<a href="${t.href}" id="${t.id}">`)].join('');
for(const [route,p] of payloads){
  p.html=htmlOf(p);
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
    // Vite's bundle (_app/) is checked by Vite itself; its minified text can look like an import.
    if(!f.includes(path.sep+'_app'+path.sep))for(const m of t.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g))resolveRef(m[1],f);
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
