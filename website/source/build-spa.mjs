// Compile the generated multipage stage into the single-page app.
//   dist/index.html            the one HTML document (shell: header, menu, footer, mount points)
//   dist/content/<route>.json  per-route payload (meta, body class, HTML fragment)
//   dist/sitemap.xml, robots.txt, pricing-data.json, code-samples.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)), project=path.resolve(here,'..');
// Output goes to public/, which Vite serves and copies into dist/ unchanged.
const stage=process.env.VERSE_DIST, dist=path.join(project,'public');
if(!stage)throw new Error('VERSE_DIST (stage directory) is required');
const ORIGIN=(process.env.SITE_ORIGIN||'https://verse-engine-ctruh-design.rajat83.chatgpt.site').replace(/\/+$/,'');
const NOINDEX=new Set(['/studio','/signin','/404']);
const read=f=>fs.readFileSync(f,'utf8');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const unesc=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const clip=(s,n=158)=>s.length<=n?s:s.slice(0,s.lastIndexOf(' ',n-1)).replace(/[,;:\s]+$/,'')+'…';

// ---------- stable ids for interactive elements and key regions ----------
const PREFIX={a:'lnk',button:'btn',input:'inp',select:'sel',textarea:'txt',form:'frm',section:'sec',nav:'nav',details:'dtl',summary:'sum',dialog:'dlg',header:'hdr',footer:'ftr',aside:'asd',article:'art',figure:'fig'};
const TAGS=Object.keys(PREFIX).join('|');
const slug=s=>unesc(s).toLowerCase().replace(/<[^>]*>/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40).replace(/-+$/,'');
function addIds(html,used){
  return html.replace(new RegExp(`<(${TAGS})(\\s[^>]*?)?(/?)>`,'g'),(m,tag,attrs='',self,offset)=>{
    if(/\sid\s*=/.test(attrs))return m;
    const attr=n=>(attrs.match(new RegExp(`\\s${n}="([^"]*)"`))||[])[1];
    let base=attr('aria-label')||attr('name')||attr('data-doc-title')||'';
    if(!base&&/^(a|button|summary)$/.test(tag)){const tail=html.slice(offset+m.length,offset+m.length+400);base=(tail.match(/^([\s\S]*?)<\/(?:a|button|summary)>/)||[,''])[1].replace(/<svg[\s\S]*?<\/svg>/g,'')}
    if(!base&&tag==='a')base=(attr('href')||'').replace(/^https?:\/\//,'').replace(/^\//,'');
    if(!base&&tag==='section')base=attr('aria-labelledby')||((attrs.match(/class="([^"]*)"/)||[,''])[1].split(' ')[0]);
    if(!base)base=((attrs.match(/class="([^"]*)"/)||[,''])[1].split(' ')[0]);
    let id=`${PREFIX[tag]}-${slug(base)||'item'}`,n=1;const root=id;
    while(used.has(id))id=`${root}-${++n}`;
    used.add(id);
    return `<${tag}${attrs} id="${id}"${self}>`;
  });
}

// ---------- documentation pages: data for the React docs layout (src/pages/docs/DocsPage.jsx) ----------
// Every /docs page has the same layout (search boxes, chapter nav, article, source line, "on this page").
// Its payload keeps only what differs per page: { active, article, source, toc }. The chapter nav is the
// same on every page and is written once to src/pages/docs/nav.json. docsMarkup() is the same layout as
// DocsPage.jsx, as a string: each page is rebuilt from its data and must match the generated HTML exactly.
const docsNavFile=path.join(project,'src/pages/docs/nav.json');
let docsNav=null;
const navMarkup=(nav,i,active)=>`<div class="docs-nav-content">${nav.map(g=>`<section id="${g.ids[i]}"><h2>${esc(g.title)}</h2>${g.items.map(n=>`<a data-doc-item data-doc-title="${esc(n.docTitle)}" href="${esc(n.href)}"${n.href===active?' aria-current="page"':''} id="${n.ids[i]}">${esc(n.title)}</a>`).join('')}</section>`).join('')}<p class="docs-no-results" hidden>No matching guides.</p></div>`;
const searchMarkup=place=>`<label class="docs-search" for="doc-search-${place}"><span class="sr-only">Search documentation</span><input id="doc-search-${place}" type="search" placeholder="Search documentation" data-doc-search autocomplete="off"><kbd aria-hidden="true">⌘ K</kbd></label>`;
const docsMarkup=(d,nav)=>`<section class="documentation" id="sec-documentation"><div class="docs-mobile">${searchMarkup('mobile')}<details id="dtl-item"><summary id="sum-browse-documentation">Browse documentation <span aria-hidden="true">+</span></summary><nav aria-label="Documentation chapters" id="nav-documentation-chapters">${navMarkup(nav,0,d.active)}</nav></details></div><aside class="docs-sidebar" id="asd-docs-sidebar">${searchMarkup('desktop')}<nav aria-label="Documentation chapters" id="nav-documentation-chapters-2">${navMarkup(nav,1,d.active)}</nav></aside><div class="doc-body"><article class="doc-article" id="art-doc-article">${d.article}</article><div class="doc-source">Published documentation from <a href="${esc(d.source)}" id="lnk-verse-by-ctruh">Verse by Ctruh</a></div></div>${d.toc.length?`<aside class="docs-toc" id="asd-docs-toc"><p>ON THIS PAGE</p>${d.toc.map(t=>`<a href="${esc(t.href)}" id="${t.id}">${esc(t.text)}</a>`).join('')}</aside>`:''}</section>`;
function splitDocs(html,route){
  const fail=what=>{throw new Error(`docs page ${route}: ${what}`)};
  const navs=[...html.matchAll(/<div class="docs-nav-content">([\s\S]*?)<p class="docs-no-results" hidden>No matching guides\.<\/p><\/div>/g)].map(m=>[...m[1].matchAll(/<section id="([^"]+)"><h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)].map(g=>({id:g[1],title:unesc(g[2]),items:[...g[3].matchAll(/<a data-doc-item data-doc-title="([^"]*)" href="([^"]*)"( aria-current="page")? id="([^"]+)">([\s\S]*?)<\/a>/g)].map(a=>({docTitle:unesc(a[1]),href:unesc(a[2]),current:!!a[3],id:a[4],title:unesc(a[5])}))})));
  if(navs.length!==2)fail('expected two chapter navs');
  const [mobile,desktop]=navs;
  const nav=mobile.map((g,gi)=>({title:g.title,ids:[g.id,desktop[gi]?.id],items:g.items.map((n,ni)=>({href:n.href,title:n.title,docTitle:n.docTitle,ids:[n.id,desktop[gi]?.items[ni]?.id]}))}));
  const active=mobile.flatMap(g=>g.items).find(n=>n.current)?.href??null;
  const article=(html.match(/<article class="doc-article" id="art-doc-article">([\s\S]*)<\/article><div class="doc-source">/)||fail('article'))[1];
  const source=unesc((html.match(/<div class="doc-source">Published documentation from <a href="([^"]*)" id="lnk-verse-by-ctruh">Verse by Ctruh<\/a><\/div>/)||fail('source line'))[1]);
  const tocHtml=(html.match(/<aside class="docs-toc" id="asd-docs-toc"><p>ON THIS PAGE<\/p>([\s\S]*?)<\/aside>/)||[,''])[1];
  const toc=[...tocHtml.matchAll(/<a href="([^"]*)" id="([^"]+)">([\s\S]*?)<\/a>/g)].map(t=>({href:unesc(t[1]),id:t[2],text:unesc(t[3])}));
  const docs={active,article,source,toc};
  if(unesc(docsMarkup(docs,nav))!==unesc(html))fail('layout does not match DocsPage (rebuilt HTML differs)');
  if(docsNav&&JSON.stringify(docsNav)!==JSON.stringify(nav))fail('chapter nav differs from the other docs pages');
  docsNav=nav;
  return docs;
}

// ---------- routes whose page is a React component (keys of PAGES in src/pages/index.js) ----------
const REACT_PAGES=new Set([...read(path.join(project,'src/pages/index.js')).matchAll(/^\s+"(\/[^"]*)":/gm)].map(m=>m[1]));

// ---------- shell pieces (shared chrome) from the About page ----------
const aboutHtml=read(path.join(stage,'about/index.html'));
const pick=(re,html,label)=>{const m=html.match(re);if(!m)throw new Error('shell piece not found: '+label);return m[0]};
const header=pick(/<header class="site-header[\s\S]*?<\/header>/,aboutHtml,'header').replace(/ aria-current="page"/g,'');
const menu=pick(/<dialog class="menu-dialog[\s\S]*?<\/dialog>/,aboutHtml,'menu');
const footer=pick(/<footer class="page-footer">[\s\S]*?<\/footer>/,aboutHtml,'footer');

// ---------- per-route payloads ----------
const routes=[];
fs.rmSync(path.join(dist,'content'),{recursive:true,force:true});fs.mkdirSync(path.join(dist,'content'),{recursive:true});
const shellUsed=new Set();
const named=(html,pairs)=>pairs.reduce((out,[from,to])=>{if(!out.includes(from))throw new Error('shell anchor missing: '+from);return out.replace(from,to)},html);
const shellHeader=addIds(named(header,[
  ['<header class="site-header growth-header">','<header id="site-header" class="site-header growth-header">'],
  ['<a class="brand"','<a id="lnk-brand" class="brand"'],
  ['<nav class="desktop-nav"','<nav id="nav-main" class="desktop-nav"'],
  ['<div class="header-actions">','<div id="hdr-actions" class="header-actions">'],
  ['<a class="header-cta header-challenge"','<a id="btn-header-challenge" class="header-cta header-challenge"'],
  ['<a class="header-cta" ','<a id="btn-header-explore" class="header-cta" '],
  ['<button class="menu-button"','<button id="btn-menu-open" class="menu-button"']]),shellUsed);
const shellMenu=addIds(named(menu,[
  ['<button class="menu-close"','<button id="btn-menu-close" class="menu-close"'],
  ['<nav aria-label="Mobile navigation">','<nav id="nav-mobile" aria-label="Mobile navigation">'],
  ['<a class="site-button" ','<a id="btn-menu-explore" class="site-button" '],
  ['<a class="menu-challenge"','<a id="btn-menu-challenge" class="menu-challenge"']]),shellUsed);
const shellFooter=addIds(named(footer,[['<footer class="page-footer">','<footer id="site-footer" class="page-footer">']]),shellUsed);
const fileFor=route=>route==='/'?'index':route.slice(1).replaceAll('/','__');
const landingHead=read(path.join(stage,'index.html'));
const jsonld=(landingHead.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/)||[''])[0];

for(const file of walk(stage).filter(f=>f.endsWith('.html'))){
  const rel=path.relative(stage,file).replaceAll('\\','/');
  const route=rel==='404.html'?'/404':'/'+rel.replace(/index\.html$/,'').replace(/\/$/,'');
  const h=read(file);
  const title=unesc((h.match(/<title>([^<]*)<\/title>/)||[,'Verse Engine'])[1]);
  let description=unesc((h.match(/<meta name="description" content="([^"]*)"/)||[,''])[1]);
  const bodyClass=(h.match(/<body class="([^"]*)"/)||[,''])[1];
  const isApp=/studio-page/.test(bodyClass);
  let kind,chrome,mainClass='',html;
  if(isApp){
    kind='app';chrome='none';
    html=h.slice(h.indexOf('>',h.indexOf('<body'))+1,h.lastIndexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g,'').replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
  }else{
    const m=h.match(/<main([^>]*)>([\s\S]*)<\/main>/);if(!m)throw new Error('no <main> in '+rel);
    mainClass=(m[1].match(/class="([^"]*)"/)||[,''])[1];html=m[2];
    kind=route==='/'?'landing':route==='/404'?'notfound':'page';
    chrome=route==='/'?'header':route==='/404'?'none':'full';
  }
  if(route!=='/'&&!isApp&&route!=='/404'){
    for(const p of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)){const t=unesc(p[1].replace(/<[^>]+>/g,'')).replace(/\s+/g,' ').trim();if(t.length>=50){description=clip(t);break}}
  }
  const navCurrent=(h.match(/<a class="nav-link" href="([^"]*)" aria-current="page"/)||[,''])[1];
  html=html.replace(/(\s(?:src|href|poster|data-src)=")(?!\/|#|[a-z][a-z0-9+.-]*:|\.)/gi,'$1/').replace(/url\((['"]?)assets\//g,'url($1/assets/');   // routes live at any depth: use root-absolute URLs
  const used=new Set(shellUsed);
  html=addIds(html,used);
  // React pages (src/pages/index.js) render their own markup: their payload only carries the meta.
  const content=kind==='page'&&html.startsWith('<section class="documentation"')?{docs:splitDocs(html,route)}:REACT_PAGES.has(route)?{}:{html};
  const payload={path:route,kind,chrome,title,description,bodyClass,mainClass,navCurrent,noindex:NOINDEX.has(route),...(route==='/'?{jsonld}:{}),...content};
  fs.writeFileSync(path.join(dist,'content',fileFor(route===  '/404'?'/404':route)+'.json'),JSON.stringify(payload));
  if(kind!=='notfound')routes.push({path:route,kind,noindex:NOINDEX.has(route),title});
}
routes.sort((a,b)=>a.path.localeCompare(b.path));

// ---------- shell ----------
let shell=read(path.join(here,'templates/shell.html'));
shell=shell.replace('<!--@header-->',shellHeader).replace('<!--@menu-->',shellMenu).replace('<!--@footer-->',shellFooter).replaceAll('@ORIGIN@',ORIGIN);
// The shell is now the React component src/Shell.jsx (keep it in sync with templates/shell.html);
// write the generated shell for reference only, outside public/.
fs.writeFileSync(path.join(project,'.build-shell.html'),shell);

// ---------- docs chapter nav (shared by every docs page) ----------
if(!docsNav)throw new Error('no documentation pages found');
fs.mkdirSync(path.dirname(docsNavFile),{recursive:true});fs.writeFileSync(docsNavFile,JSON.stringify(docsNav,null,2)+'\n');

// ---------- static data + discovery files ----------
for(const f of ['pricing-data.json','code-samples.json'])fs.copyFileSync(path.join(stage,f),path.join(dist,f));
fs.writeFileSync(path.join(dist,'content/manifest.json'),JSON.stringify(routes.map(({path:p,kind,noindex})=>({path:p,kind,noindex}))));
const urls=routes.filter(r=>!r.noindex).map(r=>`<url><loc>${ORIGIN}${r.path==='/'?'/':r.path}</loc></url>`).join('');
fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);

// ---------- route inventory for the handoff package ----------
const referenceDir=path.resolve(project,'../reference');
if(fs.existsSync(referenceDir))fs.writeFileSync(path.join(referenceDir,'routes.json'),JSON.stringify(routes.map(r=>({route:r.path,kind:r.kind,payload:'content/'+fileFor(r.path)+'.json'})),null,2)+'\n');

// ---------- remove the legacy multipage output from dist ----------
for(const e of fs.readdirSync(dist,{withFileTypes:true})){
  if(e.isDirectory()&&!['assets','vendor','css','js','content'].includes(e.name))fs.rmSync(path.join(dist,e.name),{recursive:true,force:true});
}
fs.rmSync(path.join(dist,'404.html'),{force:true});
console.log(JSON.stringify({routes:routes.length,origin:ORIGIN}));
