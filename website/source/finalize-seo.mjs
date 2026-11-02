// Post-build pass: per-page SEO metadata, social tags, production origin.
// Idempotent. Usage: SITE_ORIGIN=https://example.com node source/finalize-seo.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const STAGING='https://verse-engine-ctruh-design.rajat83.chatgpt.site';
const origin=(process.env.SITE_ORIGIN||STAGING).replace(/\/+$/,'');
const NOINDEX=new Set(['/studio','/signin']);
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const unesc=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.name==='vendor'?[]:walk(path.join(d,e.name))):[path.join(d,e.name)]);
const clip=(s,n=158)=>s.length<=n?s:s.slice(0,s.lastIndexOf(' ',n-1)).replace(/[,;:\s]+$/,'')+'…';
let pages=0;
for(const file of walk(dist).filter(f=>f.endsWith('index.html')||f.endsWith('404.html'))){
 let h=fs.readFileSync(file,'utf8');
 const rel='/'+path.relative(dist,file).replace(/\\/g,'/').replace(/index\.html$/,'').replace(/\/$/,'');
 const route=rel===''?'/':rel;
 const is404=file.endsWith('404.html');
 const title=unesc((h.match(/<title>([^<]*)<\/title>/)||[,'Verse Engine'])[1]);
 // unique description from first substantial paragraph of <main>
 let desc=null;
 if(route!=='/'){
  const main=(h.match(/<main[\s\S]*?<\/main>/)||[''])[0];
  for(const m of main.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)){
   const t=unesc(m[1].replace(/<[^>]+>/g,'')).replace(/\s+/g,' ').trim();
   if(t.length>=50){desc=clip(t);break}
  }
 }
 if(desc)h=h.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(desc)}">`);
 const finalDesc=unesc((h.match(/<meta name="description" content="([^"]*)"/)||[,''])[1]);
 // origin rewrite
 h=h.split(STAGING).join(origin);
 // strip previously injected block
 h=h.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/,'');
 const url=origin+(route==='/'?'/':route);
 const img=origin+'/assets/coastal-world.webp';
 const tags=[`<meta name="robots" content="${is404||NOINDEX.has(route)?'noindex,follow':'index,follow,max-image-preview:large'}">`];
 if(!is404){
  if(!/rel="canonical"/.test(h))tags.push(`<link rel="canonical" href="${url}">`);
  tags.push(`<meta property="og:site_name" content="Verse Engine by Ctruh"><meta property="og:url" content="${url}"><meta property="og:locale" content="en_US">`);
  if(!/property="og:title"/.test(h))tags.push(`<meta property="og:title" content="${esc(title)}">`);
  if(!/property="og:description"/.test(h)&&finalDesc)tags.push(`<meta property="og:description" content="${esc(finalDesc)}">`);
  if(!/property="og:type"/.test(h))tags.push('<meta property="og:type" content="website">');
  if(!/property="og:image"/.test(h))tags.push(`<meta property="og:image" content="${img}">`);
  if(!/name="twitter:card"/.test(h))tags.push('<meta name="twitter:card" content="summary_large_image">');
 }
 if(!/rel="icon"/.test(h))tags.push('<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">');
 h=h.replace('</head>',`<!--seo-->${tags.join('')}<!--/seo--></head>`);
 fs.writeFileSync(file,h);pages++;
}
for(const f of ['sitemap.xml','robots.txt']){
 const p=path.join(dist,f);let t=fs.readFileSync(p,'utf8').split(STAGING).join(origin);
 if(f==='sitemap.xml'){t=t.replace(/<url><loc>[^<]*\/(studio|signin)<\/loc><\/url>/g,'')}
 fs.writeFileSync(p,t);
}
console.log(`SEO pass: ${pages} pages, origin ${origin}`);
