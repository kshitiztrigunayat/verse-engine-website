// Builds /challenge from the shared page shell (header, menu, footer taken from /about).
// Run after build-production-pages.ts. The entry form itself is hosted by the live Verse service.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=process.env.VERSE_DIST||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const LIVE='https://verse.ctruh.com/challenge', PRIVACY='https://verse.ctruh.com/privacy', WA='https://wa.me/917411597778';
const ext='target="_blank" rel="noopener"';
const main=`<main id="main" class="challenge-page">
<header class="page-hero content-width"><p class="eyebrow">THE VERSE CHALLENGE</p><h1>Send us a 3D scene<br><span>no browser engine can open.</span></h1><p class="hero-description">We’ll turn it into a link anyone can open. We have already opened a 1.8-billion-triangle scene from a link in a desktop browser. Upload yours, send us a link to it, or WhatsApp it. It stays private unless you say otherwise.</p></header>
<section class="content-width section-space ch-enter" id="enter" aria-labelledby="ch-enter"><div><p class="eyebrow">ENTER THE CHALLENGE</p><h2 id="ch-enter">Name, email and company,<br>then the file.</h2><p class="ch-lede">We reply with a link you can open in a browser.</p></div>
<form class="ch-form" id="ch-form" novalidate>
<p class="ch-preview" role="note"><strong>Preview.</strong> This form is a design mockup. Nothing you enter is sent or stored. To enter for real, use the <a href="${LIVE}" ${ext}>live form</a>.</p>
<div class="ch-tabs" role="tablist" aria-label="How to send your scene"><button type="button" role="tab" id="t-upload" aria-selected="true" aria-controls="p-upload" data-tab="upload">Upload the file</button><button type="button" role="tab" id="t-link" aria-selected="false" aria-controls="p-link" tabindex="-1" data-tab="link">Send a link</button><button type="button" role="tab" id="t-wa" aria-selected="false" aria-controls="p-wa" tabindex="-1" data-tab="wa">WhatsApp it</button></div>
<div class="ch-grid"><label>Your name<input name="name" autocomplete="name" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label class="ch-wide">Company<input name="company" autocomplete="organization" required></label></div>
<div class="ch-panel" id="p-upload" role="tabpanel" aria-labelledby="t-upload"><label class="ch-drop" for="ch-file"><span class="ch-drop-icon" aria-hidden="true">↑</span><strong id="ch-file-name">Choose your 3D file</strong><span>GLB, glTF, FBX, OBJ, USDZ or a ZIP, up to 1 GB</span><input id="ch-file" name="file" type="file" accept=".glb,.gltf,.fbx,.obj,.usdz,.zip"></label></div>
<div class="ch-panel" id="p-link" role="tabpanel" aria-labelledby="t-link" hidden><label class="ch-wide">Link to the hosted file<input name="link" type="url" placeholder="https://"></label><p class="ch-help">Drive, Dropbox, S3, WeTransfer… up to 20 GB.</p></div>
<div class="ch-panel" id="p-wa" role="tabpanel" aria-labelledby="t-wa" hidden><p class="ch-help">Send the file to <strong>+91 74115 97778</strong> on WhatsApp, from any number. Submit this form too, so we can match your file to you.</p><a class="site-button" href="${WA}" ${ext}>Open WhatsApp<span aria-hidden="true"></span></a></div>
<div class="ch-grid"><label class="ch-wide">What makes it hard? <em>(optional)</em><textarea name="hard" rows="3"></textarea></label><label class="ch-wide">Website <em>(optional)</em><input name="website" type="url" placeholder="https://"></label></div>
<label class="ch-check"><input type="checkbox" name="hall"><span>You may show this scene in the public hall of fame once a person at Ctruh approves it. Leave this unticked and it stays private.</span></label>
<label class="ch-check"><input type="checkbox" name="rights" required><span>I have the right to send this file and accept the <a href="#rules">challenge rules</a> and the <a href="${PRIVACY}" ${ext}>privacy policy</a>.</span></label>
<p class="ch-error" id="ch-error" role="alert" hidden></p>
<button class="site-button" type="submit">Send it to Verse<span aria-hidden="true"></span></button>
<div class="ch-done" id="ch-done" role="status" hidden><h3>This is a preview.</h3><p>Your entry was not sent. To take the challenge, continue on the live form.</p><a class="site-button" href="${LIVE}" ${ext}>Open the live form<span aria-hidden="true"></span></a></div>
</form></section>
<section class="page-band ch-proof" aria-labelledby="ch-proof"><div class="content-width"><p class="eyebrow">PROOF</p><h2 id="ch-proof"><span class="ch-badge">Verified</span> 1,805,458,557 triangles in the scene. 2&nbsp;GB compiled. Opens from a link in a desktop browser.</h2><p>A production city scene with 1,805,458,557 triangles in the scene, compiled to 2&nbsp;GB, opens from a link in a desktop browser. No app, no plug-in.</p></div></section>
<section class="content-width section-space" aria-labelledby="ch-hall"><p class="eyebrow">HALL OF FAME</p><h2 id="ch-hall">Scenes whose owners said yes,<br>approved by us.</h2><p class="ch-lede">Open any of them from its link.</p><p class="ch-empty">No scenes here yet. The first entry that survives the challenge, and gets approved, lands here.</p></section>
<section class="content-width section-space ch-rules" id="rules" aria-labelledby="ch-rules"><p class="eyebrow">RULES AND TERMS</p><h2 id="ch-rules">Rules and terms</h2><div class="ch-rule-grid">
<article><h3>What we do with your file</h3><ul><li>Your file is private by default. Only you and Ctruh staff handling the challenge can see it.</li><li>We publish a scene to the hall of fame only if you ticked permission on the form and a person at Ctruh approved it. You can ask us to remove it any time at <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>.</li><li>We use your name, email and company to reply and to follow up about Verse. We do not sell them.</li><li>Unpublished files are deleted on request.</li></ul></article>
<article><h3>Limits and fair play</h3><ul><li>Upload limit: 1 GB in the browser. Bigger files: send a link (up to 20 GB) or WhatsApp.</li><li>Only send files you have the right to share.</li><li>We make no promise that every scene opens. If one does not, we tell you why.</li><li>The challenge is open to everyone and may change or end without notice.</li></ul></article></div></section>
</main>`;
let h=fs.readFileSync(path.join(dist,'about/index.html'),'utf8');
h=h.replace(/<main[\s\S]*?<\/main>/,()=>main);
const title='The Verse Challenge | Verse Engine by Ctruh';
h=h.replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`);
h=h.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Send us a 3D scene no browser engine can open. We’ll turn it into a link anyone can open. Upload a file, send a link or WhatsApp it.">');
h=h.replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="https://verse-engine-ctruh-design.rajat83.chatgpt.site/challenge">');
h=h.replace(/<meta property="og:(title|description|url)"[^>]*>/g,'');
h=h.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/,'');
h=h.replace(/(<a class="nav-link"[^>]*) aria-current="page"/g,'$1');
fs.mkdirSync(path.join(dist,'challenge'),{recursive:true});
fs.writeFileSync(path.join(dist,'challenge/index.html'),h);
const sm=path.join(dist,'sitemap.xml');let s=fs.readFileSync(sm,'utf8');
if(!s.includes('/challenge</loc>')){const o=(s.match(/<loc>(https?:\/\/[^/<]+)/)||[,''])[1];s=s.replace('</urlset>',`<url><loc>${o}/challenge</loc></url></urlset>`);fs.writeFileSync(sm,s)}
console.log('challenge page built');
