// Verse Playground: a client-side workspace. Everything here runs in the browser and is stored in localStorage;
// nothing is uploaded, no account is used and no scene is published to the production service.
const KEY = 'verse-playground-v1';
const $ = (s, r = document) => r.querySelector(s);
const main = $('#studio-main'), dialog = $('#st-dialog'), toastEl = $('#st-toast');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US');
const now = () => Date.now();

// Prototype session gate: sign-in is static for internal flow testing (see signin.js).
const SESSION = 'verse-playground-session';
let user = null;
try { user = JSON.parse(localStorage.getItem(SESSION)); } catch { /* storage unavailable */ }
if (!user || !user.name) { location.replace('/signin?next=' + encodeURIComponent('/studio' + location.hash)); }
else {
  $('#st-name').textContent = user.name;
  $('#st-signout').addEventListener('click', () => { try { localStorage.removeItem(SESSION); } catch { /* ignore */ } location.href = '/signin'; });
}

const THUMBS = { room: '/assets/real-estate.webp', sofa: '/assets/sofa-environment.webp', building: '/assets/interior.webp', scan: '/assets/industrial-environment.webp', shoe: '/assets/product.webp', villa: '/assets/coastal-world.webp' };
const FORMATS = [['GLB'], ['glTF embedded'], ['PLY splat'], ['SPLAT'], ['PLY point cloud'], ['LAS'], ['LAZ'], ['E57'], ['XYZ'], ['PLY scan mesh'], ['IFC'], ['USDZ'], ['USD'], ['FBX', 1], ['OBJ', 1], ['ZIP', 1], ['PNG'], ['JPG'], ['PDF']];
const HEAVY = /\.(e57|las|laz|ifc|xyz|ply|splat)$/i;

function seeded(seed) { let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7); return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function series(seed, total, n = 90) {
  const r = seeded(seed), raw = Array.from({ length: n }, (_, i) => 0.35 + r() + (i / n) * 0.6);
  const last30 = raw.slice(-30).reduce((a, b) => a + b, 0) || 1;
  return raw.map(v => Math.round(v * total / last30));
}
function dayLabel(i, n) { const d = new Date(Date.UTC(2026, 9, 30) - (n - 1 - i) * 864e5); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }); }

const seedScenes = () => [
  ['sc-1038', 'Prestige Lakeview 3BHK', 'Instant Home', 'villa', 1284, 902, '2026-10-18'],
  ['sc-1039', 'Aurora sofa configurator', 'Blender', 'sofa', 3410, 2205, '2026-10-15'],
  ['sc-1040', 'Indiranagar showroom tour', 'Unreal', 'building', 876, 540, '2026-10-12'],
  ['sc-1041', 'HSR office scan', 'Upload · E57', 'scan', 0, 0, '2026-10-21', 'processing'],
  ['sc-1042', 'Runner X sneaker drop', 'Unity', 'shoe', 5120, 3988, '2026-10-06'],
  ['sc-1037', 'Whitefield villa 12', 'Instant Home', 'room', 642, 410, '2026-10-02']
].map(([id, title, source, kind, views, sessions, date, st]) => ({ id, title, source, kind, views, sessions, date, privacy: 'private', opts: { comments: true, branding: true, expires: false }, readyAt: st ? now() + 15000 : 0, watch: views * 102 }));
const seedHooks = () => [
  { id: 'wh1', name: 'CRM sync', url: 'https://api.lakeview-homes.in/verse/crm', status: 'active', events: ['scene.ready', 'scene.viewed'] },
  { id: 'wh2', name: 'Slack alerts', url: 'https://hooks.slack.example/verse', status: 'active', events: ['scene.ready', 'scene.failed'] },
  { id: 'wh3', name: 'BI export', url: 'https://bi.example.com/ingest/verse', status: 'paused', events: ['scene.viewed'] },
  { id: 'wh4', name: 'Staging test', url: 'https://staging.example.com/hook', status: 'failing', events: ['scene.ready'] }
];
const EVENTS = ['scene.ready', 'scene.viewed', 'scene.failed'];

let state;
function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state || !state.scenes) state = { scenes: seedScenes(), hooks: seedHooks(), keys: [], deliveries: {}, next: 1043 };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: playground still works for this visit */ } }
load();

const status = s => s.readyAt > now() ? 'processing' : 'ready';
const sceneUrl = id => `${location.origin}/studio#/scene/${id}`;
const byId = id => state.scenes.find(s => s.id === id);
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const hms = sec => `${Math.floor(sec / 3600)}h ${String(Math.floor(sec % 3600 / 60)).padStart(2, '0')}m`;

let toastTimer;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600); }
async function copy(text, msg = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); try { document.execCommand('copy'); toast(msg); } catch { toast('Copy is blocked by the browser'); } t.remove(); }
}
function openDialog(html) { dialog.innerHTML = `<div class="dlg">${html}</div>`; if (!dialog.open) dialog.showModal(); }
dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-action="close"]')) dialog.close(); });

/* ---------- charts ---------- */
function barChart(values, labelFn) {
  const w = 720, h = 100, max = Math.max(...values, 1), bw = w / values.length;
  const bars = values.map((v, i) => { const bh = Math.max(2, (h - 4) * v / max); return `<rect class="bar${i === values.length - 1 ? ' last' : ''}" x="${(i * bw + 1).toFixed(1)}" y="${(h - bh).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${bh.toFixed(1)}"><title>${labelFn(i)}: ${fmt(v)}</title></rect>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Bar chart, ${values.length} days, peak ${fmt(max)}">${bars}</svg><div class="chart-axis"><span>${values.length} DAYS AGO</span><span>TODAY</span></div>`;
}
const peakLabel = (v, f) => { const m = Math.max(...v); const i = v.lastIndexOf(m); return `PEAK ${fmt(m)} ${i === v.length - 1 ? 'TODAY' : '· ' + f(i).toUpperCase()}`; };

/* ---------- viewer (three.js, rendered on demand) ---------- */
let cleanups = [];
async function mountViewer(el, kind) {
  let THREE;
  try { THREE = await import('/vendor/three.module.js'); } catch { el.insertAdjacentHTML('beforeend', '<div class="fallback">The 3D preview needs WebGL. The scene is still saved.</div>'); return; }
  if (!el.isConnected) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { el.insertAdjacentHTML('beforeend', '<div class="fallback">The 3D preview needs WebGL. The scene is still saved.</div>'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); el.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf5f5f7);
  const cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 200); cam.position.set(0, 1.6, 6);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdddde2, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(5, 8, 4); scene.add(sun);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const add = (g, c, x, y, z) => { const m = new THREE.Mesh(g, mat(c)); m.position.set(x, y, z); scene.add(m); return m; };
  add(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), 0xfafafc, 0, 0, 0);
  scene.add(new THREE.GridHelper(60, 60, 0xe0e0e0, 0xe0e0e0));
  const B = 0x0066cc, G = 0xd2d2d7, W = 0xffffff;
  const box = (w, h, d, c, x, z, y = 0) => add(new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z);
  if (kind === 'sofa') { box(3, .5, 1.2, B, 0, 0); box(3, .8, .3, B, 0, -.5, .5); box(.3, .7, 1.2, B, -1.5, 0); box(.3, .7, 1.2, B, 1.5, 0); box(1.4, .08, 1, W, 0, 2.2, .4); }
  else if (kind === 'shoe') { box(2.6, .3, 1, W, 0, 0); box(1.6, .7, .9, B, -.4, 0, .3); box(.9, .45, .8, B, .9, 0, .3); }
  else if (kind === 'scan') { const r = seeded('scan'); const pts = new Float32Array(9000); for (let i = 0; i < 3000; i++) { const f = r(); pts.set(f < .5 ? [(r() - .5) * 12, 0.01, (r() - .5) * 12] : f < .8 ? [(r() < .5 ? -6 : 6), r() * 3.2, (r() - .5) * 12] : [(r() - .5) * 12, r() * 3.2, -6], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pts, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: B, size: .06 }))); }
  else if (kind === 'building') { box(8, 3, .2, G, 0, -4, 0); box(.2, 3, 8, G, -4, 0); box(.2, 3, 8, G, 4, 0); box(1.5, .9, 1.5, B, -2, -2); box(1.5, .9, 1.5, B, 2, 1); box(3, .7, 1, W, 0, 3); }
  else { box(10, .15, 8, W, 0, 0); box(10, 3, .2, G, 0, -4); box(.2, 3, 8, G, -5, 0); box(.2, 1.1, 3, G, 5, -2.2); box(3, .5, 1.2, B, -1, -2.5); box(1.8, .5, 1.8, W, 0, -.2, .45); box(1.8, .08, 1.2, B, 0, -.2, 1); box(2, .45, 1, G, 2.5, 2.5); box(1.4, 2, .8, B, -3.5, 2.8); }
  let yaw = 0, pitch = -0.05, dist = 6, dirty = true; const target = new THREE.Vector3(0, 1.4, 0), keys = new Set(); let pos = new THREE.Vector3(0, 1.6, 6);
  const fwd = () => new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  function render() {
    const w = el.clientWidth, h = el.clientHeight; if (w && (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()))) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    cam.position.copy(pos); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0); cam.fov = 55 * (dist / 6); cam.fov = Math.min(95, Math.max(25, cam.fov)); cam.updateProjectionMatrix(); renderer.render(scene, cam); dirty = false;
  }
  let drag = null, raf = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  function tick() { raf = 0; if (keys.size) { const f = fwd(), r = new THREE.Vector3(f.z * -1, 0, f.x), s = 0.12; if (keys.has('w') || keys.has('arrowup')) pos.addScaledVector(f, s); if (keys.has('s') || keys.has('arrowdown')) pos.addScaledVector(f, -s); if (keys.has('a') || keys.has('arrowleft')) pos.addScaledVector(r, -s); if (keys.has('d') || keys.has('arrowright')) pos.addScaledVector(r, s); dirty = true; } if (dirty) render(); if (keys.size) kick(); }
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
  on(el, 'pointerdown', e => { drag = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); });
  on(el, 'pointermove', e => { if (!drag) return; yaw -= (e.clientX - drag[0]) * 0.005; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - drag[1]) * 0.005)); drag = [e.clientX, e.clientY]; dirty = true; kick(); });
  on(el, 'pointerup', () => { drag = null; });
  on(el, 'wheel', e => { e.preventDefault(); dist = Math.max(2, Math.min(12, dist + e.deltaY * 0.004)); dirty = true; kick(); }, { passive: false });
  el.tabIndex = 0; el.setAttribute('role', 'application'); el.setAttribute('aria-label', '3D scene preview. Drag to look, W A S D or arrow keys to walk, scroll to zoom.');
  on(el, 'keydown', e => { const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { e.preventDefault(); keys.add(k); kick(); } });
  on(el, 'keyup', e => { keys.delete(e.key.toLowerCase()); });
  on(el, 'blur', () => keys.clear());
  const ro = new ResizeObserver(() => { dirty = true; kick(); }); ro.observe(el);
  cleanups.push(() => { ro.disconnect(); cancelAnimationFrame(raf); renderer.dispose(); });
  render();
}
const viewerHtml = (kind) => `<div class="viewer" data-viewer="${kind}"><span class="hint">DRAG TO LOOK · WASD TO WALK · SCROLL TO ZOOM</span></div>`;

/* ---------- shared bits ---------- */
const qs = { scenes: '', analytics: '', webhooks: '', plugins: '' };
const PH = { scenes: 'Search scenes', analytics: 'Search scenes to analyze', webhooks: 'Search webhooks', plugins: 'Search plug-ins and keys', scene: 'Search scenes' };
const NEWBTN = '<a class="btn" href="#/new">+ New scene</a>';
const studioHead = (title, sub, scope = 'scenes', action = NEWBTN) => `<header class="page-head"><div><p class="eyebrow">STUDIO</p><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="row"><input class="search" id="q" data-scope="${scope}" type="search" placeholder="${PH[scope]}" aria-label="${PH[scope]}" value="${esc(qs[scope] || '')}">${action}</div></header>`;
const head = (eyebrow, title, sub, right = '') => `<header class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${right}</header>`;
const pillFor = s => status(s) === 'ready' ? '<span class="pill ok">● Ready</span>' : '<span class="pill proc">◐ Processing</span>';

/* ---------- views ---------- */
let filter = 'all';
function viewScenes() {
  const ready = state.scenes.filter(s => status(s) === 'ready'), proc = state.scenes.length - ready.length;
  const views = state.scenes.reduce((a, s) => a + s.views, 0), sessions = state.scenes.reduce((a, s) => a + s.sessions, 0), watch = state.scenes.reduce((a, s) => a + s.watch, 0);
  const total = series('all', views).slice(-30), dl = i => dayLabel(i, 30);
  const list = state.scenes.filter(s => (filter === 'all' || status(s) === filter) && s.title.toLowerCase().includes(qs.scenes.toLowerCase()));
  return studioHead('Your scenes', 'Everything you’ve uploaded or published from a plug-in.') + `
  <p class="section-label">GLOBAL ANALYTICS · LAST 30 DAYS</p>
  <div class="stats"><div class="stat"><span>Scenes created</span><b>${state.scenes.length}</b></div><div class="stat"><span>Total views</span><b>${fmt(views)}</b></div><div class="stat"><span>Total watch time</span><b>${hms(watch)}</b></div><div class="stat"><span>Unique sessions</span><b>${fmt(sessions)}</b></div></div>
  <section class="card" aria-labelledby="all-views"><div class="chart-head"><h3 id="all-views">Views across all scenes</h3><span class="peak">${peakLabel(total, dl)}</span></div>${barChart(total, dl)}</section>
  <div class="toolbar"><p class="section-label" style="margin:0">ALL SCENES (${state.scenes.length})</p><div class="tabs" role="group" aria-label="Filter scenes">${[['all', 'All'], ['ready', 'Ready'], ['processing', 'Processing']].map(([k, l]) => `<button class="tab" data-action="filter" data-v="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}</div></div>
  ${list.length ? `<div class="scene-grid">${list.map(sceneCard).join('')}</div>` : '<div class="empty">No scenes match. Try another filter, or create a new scene.</div>'}`;
}
const sceneCard = s => `<article class="scene-card"><a class="scene-thumb" href="#/scene/${s.id}" tabindex="-1" aria-hidden="true"><img src="${THUMBS[s.kind] || THUMBS.room}" alt="" loading="lazy"><span class="badges">${pillFor(s)}<span class="pill">${esc(s.source)}</span></span></a><div class="scene-body"><h3>${esc(s.title)}</h3><div class="meta"><span><b>${fmt(s.views)}</b> views</span><span><b>${fmt(s.sessions)}</b> sessions</span><span>${fmtDate(s.date)}</span></div></div><div class="scene-actions"><button class="btn ghost sm" data-action="copy-scene" data-id="${s.id}">Copy link</button><a class="btn ghost sm" href="#/analytics/${s.id}">Analytics</a><a class="btn sm" href="#/scene/${s.id}">Open</a></div></article>`

function viewScene(id) {
  const s = byId(id); if (!s) return notFound();
  return studioHead(esc(s.title), `${esc(s.source)} · ${status(s) === 'ready' ? 'Ready' : 'Processing'}`, 'scene', `<button class="btn" data-action="copy-scene" data-id="${s.id}">Copy link</button>`) + `<div class="row" style="margin-bottom:20px"><a class="btn ghost" href="#/scenes">← Scenes</a><a class="btn ghost" href="#/analytics/${s.id}">Analytics</a></div><div class="split"><div>${status(s) === 'ready' ? viewerHtml(s.kind) : '<div class="viewer"><div class="fallback">This scene is still processing. It opens here as soon as it’s ready.</div></div>'}</div><div class="grid" style="display:grid;gap:20px">${shareControls(s)}</div></div>`;
}

function shareControls(s) {
  return `<div class="card"><p class="label">Share one link</p><div class="linkbox" style="margin-top:12px"><input readonly aria-label="Scene link" value="${esc(sceneUrl(s.id))}"><button class="btn sm" data-action="copy-scene" data-id="${s.id}">Copy</button></div>
  <p class="note" style="margin-top:10px">This link opens the scene in this Playground only.</p></div>
  <div class="card"><label class="field">Scene name<input data-field="title" data-id="${s.id}" value="${esc(s.title)}"></label>
  <p class="label" style="margin:18px 0 10px">Who can open it</p><div class="seg" role="group" aria-label="Privacy"><button data-action="privacy" data-id="${s.id}" data-v="private" aria-pressed="${s.privacy === 'private'}">Private link</button><button data-action="privacy" data-id="${s.id}" data-v="public" aria-pressed="${s.privacy === 'public'}">Public</button></div>
  <p class="note" style="margin-top:10px">${s.privacy === 'private' ? 'Only people with the link can open a private scene. You can revoke the link at any time.' : 'Anyone can find and open a public scene.'}</p>
  <button class="under-link" data-action="revoke" data-id="${s.id}">Revoke and regenerate link</button></div>
  <div class="toggles">${[['comments', 'Allow comments'], ['branding', 'Show Verse Engine branding'], ['expires', 'Link expires in 30 days']].map(([k, l]) => `<label class="toggle"><span>${l}</span><input type="checkbox" data-action="opt" data-id="${s.id}" data-k="${k}" ${s.opts[k] ? 'checked' : ''}></label>`).join('')}</div>
  <div class="row"><button class="btn ghost sm" data-action="export" data-id="${s.id}">Export video</button><button class="btn ghost sm" data-action="embed" data-id="${s.id}">Embed</button><button class="btn ghost sm" data-action="tour" data-id="${s.id}">Start live tour</button><button class="btn ghost sm" data-action="phone" data-id="${s.id}">Open on phone</button></div>`;
}

let anRange = 30, anId = null;
function viewAnalytics(id) {
  if (id) anId = id; if (!byId(anId)) anId = state.scenes[0]?.id; const s = byId(anId); if (!s) return studioHead('Analytics', 'How your scenes are landing.', 'analytics', '') + '<div class="empty">Create a scene to see analytics.</div>';
  const full = series(s.id + 'v', s.views * 3 || 0).map((v, i, a) => s.views ? v : 0), vals = full.slice(-anRange), sum = vals.reduce((a, b) => a + b, 0);
  const ses = Math.round(sum * (s.views ? s.sessions / s.views : 0)), watch = Math.round(sum * (s.views ? s.watch / s.views : 0));
  const dev = [['Phone', 58], ['Desktop', 34], ['Headset', 8]];
  const rows = s.views ? [['Today 10:42', 'Phone · Chrome', 'Bengaluru', '6m 12s'], ['Today 09:15', 'Desktop · Safari', 'Mumbai', '11m 40s'], ['Yesterday 21:03', 'Phone · Safari', 'Pune', '3m 05s'], ['Yesterday 18:27', 'Headset · Quest Browser', 'San Francisco', '14m 22s'], ['20 Oct 16:50', 'Desktop · Edge', 'Hyderabad', '7m 48s']] : [];
  const aq = qs.analytics.toLowerCase(), amatch = state.scenes.filter(x => x.title.toLowerCase().includes(aq)), aopts = amatch.length ? amatch : state.scenes; if (!aopts.some(x => x.id === anId)) { anId = aopts[0].id; return viewAnalytics(); }
  return studioHead('Analytics', 'How your scenes are landing. Demo scenes use sample figures.', 'analytics', '<button class="btn" data-action="export-csv">Export CSV</button>') + `
  <div class="toolbar"><label class="field" style="min-width:min(100%,320px)">Scene<select id="an-scene">${aopts.map(x => `<option value="${x.id}" ${x.id === anId ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select></label>
  <div class="seg" role="group" aria-label="Date range">${[7, 30, 90].map(d => `<button data-action="range" data-v="${d}" aria-pressed="${anRange === d}">${d} days</button>`).join('')}</div></div>
  <div class="card paper" style="margin-bottom:24px"><div class="row" style="justify-content:space-between"><div><p class="label">${esc(s.source)} · ${s.privacy}</p><p class="mono" style="margin-top:6px">${esc(sceneUrl(s.id))}</p><p class="note">Published ${fmtDate(s.date)}</p></div><div class="row"><button class="btn ghost sm" data-action="copy-scene" data-id="${s.id}">Copy link</button><a class="btn sm" href="#/scene/${s.id}">Open</a></div></div></div>
  <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="stat"><span>Views · last ${anRange} days</span><b>${fmt(sum)}</b></div><div class="stat"><span>Unique sessions</span><b>${fmt(ses)}</b></div><div class="stat"><span>Watch time</span><b>${hms(watch)}</b></div></div>
  <div class="split"><section class="card"><h3 style="margin-bottom:16px">Views per day</h3>${barChart(vals, i => dayLabel(i, anRange))}</section><section class="card"><h3 style="margin-bottom:8px">Where people watched</h3>${dev.map(([n, p]) => `<div class="bar-row"><span>${n}</span><span class="track"><i style="width:${s.views ? p : 0}%"></i></span><span>${s.views ? p : 0}%</span></div>`).join('')}</section></div>
  <h3 style="margin:32px 0 14px">Recent sessions</h3>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Device</th><th>City</th><th>Watch time</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<div class="empty">No sessions yet. Share the link to start collecting views.</div>'}`;
}

let whSel = 'wh1';
const hookBadge = s => s === 'active' ? '<span class="pill ok">● Active</span>' : s === 'paused' ? '<span class="pill">‖ Paused</span>' : '<span class="pill bad">! Failing</span>';
function viewWebhooks() {
  const wq = qs.webhooks.toLowerCase(), hooks = state.hooks.filter(x => (x.name + ' ' + x.url).toLowerCase().includes(wq));
  const h = hooks.find(x => x.id === whSel) || hooks[0]; if (h) whSel = h.id;
  const dl = h ? (state.deliveries[h.id] || []) : [];
  const base = [['scene.ready', 'Today, 10:40', '✓ 200 OK'], ['scene.viewed', 'Today, 10:42', '✓ 200 OK'], ['scene.viewed', 'Yesterday, 18:27', '✓ 200 OK']];
  const rows = [...dl, ...(h && h.status === 'failing' ? [['scene.ready', 'Yesterday, 11:03', '✕ 503 Service Unavailable']] : base.filter(r => h && h.events.includes(r[0])))];
  return studioHead('Webhooks', 'Get notified when a scene is ready, viewed or fails. Deliveries here are simulated.', 'webhooks', '<button class="btn" data-action="new-hook">+ Create webhook</button>') + (h ? `
  <div class="wh-layout"><div class="wh-list">${hooks.map(x => `<button class="wh-item" data-action="sel-hook" data-id="${x.id}" aria-pressed="${x.id === whSel}"><span>${hookBadge(x.status)}</span><b>${esc(x.name)}</b><small>${esc(x.url)}</small></button>`).join('')}</div>
  <div><div class="card"><div class="row" style="justify-content:space-between"><div><h3>${esc(h.name)}</h3><p class="mono" style="margin-top:6px;overflow-wrap:anywhere">${esc(h.url)}</p></div>${hookBadge(h.status)}</div>
  <p class="label" style="margin:18px 0 8px">Subscribed events</p><div class="pills">${h.events.map(e => `<span class="pill mono">${e}</span>`).join('')}</div>
  <div class="row" style="margin-top:20px"><button class="btn ghost sm" data-action="test-hook" data-id="${h.id}">Send test event</button><button class="btn ghost sm" data-action="toggle-hook" data-id="${h.id}">${h.status === 'paused' ? 'Resume' : 'Pause'}</button><button class="btn danger sm" data-action="del-hook" data-id="${h.id}">Delete</button></div></div>
  <div class="metrics"><div><span class="label">Views</span><b>4,320</b></div><div><span class="label">Unique sessions</span><b>2,980</b></div><div><span class="label">Watch time</span><b>86h</b></div><div><span class="label">Delivered OK</span><b>${h.status === 'failing' ? '41.0%' : '99.6%'}</b></div></div>
  <section class="card"><h3 style="margin-bottom:16px">Events delivered per day</h3>${barChart(series(h.id, 120, 30), i => dayLabel(i, 30))}</section>
  <h3 style="margin:28px 0 14px">Recent deliveries</h3><div class="table-wrap"><table><thead><tr><th>Event</th><th>When</th><th>Result</th></tr></thead><tbody>${rows.length ? rows.map(r => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') : '<tr><td colspan="3">No deliveries yet.</td></tr>'}</tbody></table></div></div></div>` : `<div class="empty">${state.hooks.length ? 'No webhooks match your search.' : 'No webhooks yet. Create one to get started.'}</div>`);
}

const PLUGINS = [['Blender', 'Publish a scene in one click, straight from the sidebar.', 45, '/plugins/blender', '/docs/blender'], ['Unity', 'Ship Unity scenes to the web without a WebGL build.', 101, '/plugins/unity', '/docs/unity'], ['Unreal Engine', 'Cinematic Unreal levels that open on any phone.', 70, '/plugins/unreal', '/docs/unreal']];
function viewPlugins() {
  const pq = qs.plugins.toLowerCase(), plugs = PLUGINS.filter(p => (p[0] + ' ' + p[1]).toLowerCase().includes(pq)), keys = state.keys.filter(k => k.name.toLowerCase().includes(pq));
  const sample = `curl -X POST https://api.verse.example/v1/scenes \\\n  -H "Authorization: Bearer $VERSE_KEY" \\\n  -F "file=@living-room.glb"`;
  return studioHead('Plug-ins &amp; API', 'Publish from your editor, or drive Verse from code. Playground keys are placeholders.', 'plugins', '<button class="btn" data-action="new-key">+ Create key</button>') + `
  <h2 style="margin-bottom:16px">Plug-ins</h2><div class="plug-grid">${plugs.length ? plugs.map(p => `<article class="card"><p class="label">Typical publish · ${p[2]}s</p><h3>${p[0]}</h3><p class="note">${p[1]}</p><div class="row"><a class="btn sm" href="${p[3]}">Install guide</a><a class="under-link" href="${p[4]}">Docs ↗</a></div></article>`).join('') : '<div class="empty" style="grid-column:1/-1">No plug-ins match your search.</div>'}</div>
  <h2 style="margin:40px 0 16px">API keys</h2>
  <div class="keys">${keys.length ? keys.map(k => `<div class="key-row"><div><b>${esc(k.name)}</b><p class="mono">${k.shown ? esc(k.secret) : esc(k.secret.slice(0, 8) + '••••••••••••••••')}</p></div><div class="row"><button class="btn ghost sm" data-action="show-key" data-id="${k.id}">${k.shown ? 'Hide' : 'Reveal'}</button><button class="btn ghost sm" data-action="copy-key" data-id="${k.id}">Copy</button><button class="btn danger sm" data-action="del-key" data-id="${k.id}">Revoke</button></div></div>`).join('') : `<div class="empty">${state.keys.length ? 'No keys match your search.' : 'No keys yet.'}</div>`}</div>
  <h2 style="margin:40px 0 16px">Quickstart</h2><div class="card" style="padding:0"><pre class="code">${esc(sample)}</pre></div><div class="row" style="margin-top:14px"><button class="btn ghost sm" data-action="copy-text" data-t="${esc(sample)}">Copy snippet</button><a class="under-link" href="/developers">API &amp; SDK ↗</a><a class="under-link" href="/docs/scenes-api">Scenes API ↗</a></div>`;
}

/* ---------- new scene flow ---------- */
let draft = { type: '3d', file: null, name: '', sample: false, plan: null, quality: 'balanced' };
const stepper = n => `<ol class="stepper" aria-label="Progress">${['1 UPLOAD', '2 REVIEW', '3 PREVIEW & SHARE'].map((l, i) => `<li ${i + 1 === n ? 'aria-current="step"' : ''} class="${i + 1 < n ? 'done' : ''}">${i + 1 < n ? '✓ ' : ''}${esc(l)}</li>`).join('')}</ol>`;
const bytes = n => n > 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
function viewNew() {
  const ok = !!draft.file;
  return `<a class="under-link" href="#/scenes">← Back to Playground</a><div class="page-head" style="margin-top:12px"><div><p class="eyebrow">NEW SCENE</p><h1>Upload</h1></div><span class="st-badge">LOCAL · FILES STAY IN THIS BROWSER</span></div>${stepper(1)}
  <div class="src-opts"><button class="src-opt" data-action="src" data-v="3d" aria-pressed="${draft.type === '3d'}"><b>3D file or scan</b><span>Models, point clouds, splats and BIM.</span></button><button class="src-opt" data-action="src" data-v="plan" aria-pressed="${draft.type === 'plan'}"><b>Floor plan → 3D home</b><span>A PNG, JPG or PDF plan becomes a walkable home.</span></button></div>
  <div class="drop" id="drop"><span class="label">DROP YOUR ${draft.type === 'plan' ? 'FLOOR PLAN' : '3D FILE OR SCAN'} HERE</span>${ok ? `<h3>${esc(draft.file.name)}</h3><p class="note">${bytes(draft.file.size)}${draft.sample ? ' · sample file' : ''}</p>` : `<p class="note">${draft.type === 'plan' ? 'PNG, JPG or PDF.' : 'Accepts models, point clouds, splats and BIM.'} FBX, OBJ and ZIP files are converted for you.</p>`}
  <div class="row" style="justify-content:center"><label class="btn ghost" style="cursor:pointer"><input id="file" type="file" hidden ${draft.type === 'plan' ? 'accept=".png,.jpg,.jpeg,.pdf"' : ''}>Choose file</label><button class="btn ghost" data-action="sample">Use a sample file</button></div></div>
  <div class="formats" aria-label="Supported formats">${FORMATS.map(([f, c]) => `<span class="${c ? 'conv' : ''}" ${c ? 'title="Converted for you"' : ''}>${f}</span>`).join('')}</div><p class="note" style="margin-top:8px">Dashed formats are converted for you.</p>
  <div class="step-actions"><a class="btn ghost" href="#/scenes" data-action="cancel">Cancel</a><a class="btn" href="#/new/review" ${ok ? '' : 'aria-disabled="true" data-action="need-file"'}>Continue</a></div>`;
}

const WALLS0 = [[40, 40, 220, 40], [220, 40, 380, 40], [380, 40, 380, 160], [380, 160, 380, 280], [380, 280, 310, 280], [310, 280, 220, 280], [220, 280, 40, 280], [40, 280, 40, 160], [40, 160, 40, 40], [220, 40, 220, 160], [40, 160, 220, 160], [220, 160, 380, 160], [220, 160, 220, 280], [310, 160, 310, 280]];
const ROOMS = [['Kitchen', 40, 40, 180, 120], ['Living / Dining', 220, 40, 160, 120], ['Bedroom 1', 40, 160, 180, 120], ['Bedroom 2', 220, 160, 90, 120], ['Bath', 310, 160, 70, 120]];
const FOCUS = [[380, 100], [265, 280], [220, 100]];
function freshPlan() { return { rot: 0, fx: 1, fy: 1, tool: 'select', walls: WALLS0.map(() => 'solid'), doors: [[130, 160, 'h'], [220, 220, 'v'], [265, 160, 'h'], [310, 220, 'v'], [300, 40, 'h'], [380, 100, 'v']], wins: [[130, 40, 'h'], [40, 100, 'v'], [40, 220, 'v'], [130, 280, 'h'], [265, 280, 'h'], [380, 220, 'v'], [345, 280, 'h']], checks: [false, false, false] }; }
const CONFIRMS = ['Is there a door between Living / Dining and the balcony?', 'Is the blue mark on Bedroom 2 a window?', 'Is the gap between Kitchen and Living an open archway?'];
const rot = (o, x, y) => o === 'v' ? ` transform="rotate(90 ${x} ${y})"` : '';
function planSvg(p) {
  const walls = p.walls.map((s, i) => { const w = WALLS0[i]; return `<line class="wall ${s}" x1="${w[0]}" y1="${w[1]}" x2="${w[2]}" y2="${w[3]}"/>`; }).join('');
  const hits = WALLS0.map((w, i) => `<line class="hit" data-wall="${i}" x1="${w[0]}" y1="${w[1]}" x2="${w[2]}" y2="${w[3]}" tabindex="0" role="button" aria-label="Wall ${i + 1}, ${p.walls[i] === 'solid' ? 'solid' : p.walls[i] === 'gap' ? 'open archway' : 'removed'}"/>`).join('');
  const doors = p.doors.map(([x, y, o], i) => `<g class="door" data-door="${i}"${rot(o, x, y)}><title>Door. Click to remove.</title><rect x="${x - 14}" y="${y - 5}" width="28" height="10" fill="var(--pearl)"/><path d="M${x - 13} ${y - 22}V${y}M${x - 13} ${y - 22}A22 22 0 0 1 ${x + 9} ${y}" fill="none" stroke="var(--brand-blue)" stroke-width="2"/></g>`).join('');
  const wins = p.wins.map(([x, y, o], i) => `<g class="win" data-win="${i}"${rot(o, x, y)}><title>Window. Click to remove.</title><rect x="${x - 14}" y="${y - 4}" width="28" height="8" fill="var(--surface)" stroke="var(--brand-blue)" stroke-width="2"/><line x1="${x - 14}" x2="${x + 14}" y1="${y}" y2="${y}" stroke="var(--brand-blue)" stroke-width="1"/></g>`).join('');
  const rooms = ROOMS.map(([n, x, y, w, h], i) => `<rect class="roomfill r${i}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  const labels = ROOMS.map(([n, x, y, w, h]) => { const cx = x + w / 2, cy = y + h * 0.4; return `<text class="room" x="${cx}" y="${cy}" transform="translate(${cx} ${cy}) scale(${p.fx} ${p.fy}) rotate(${-p.rot}) translate(${-cx} ${-cy})">${n}</text>`; }).join('');
  const pulses = FOCUS.map(([x, y], i) => `<circle class="pulse f${i}" cx="${x}" cy="${y}" r="20"/>`).join('');
  return `<svg class="plan-svg" id="plan" viewBox="12 -18 396 356" role="group" aria-label="Floor plan editor"><g transform="translate(210 160) rotate(${p.rot}) scale(${p.fx} ${p.fy}) translate(-210 -160)">${rooms}${walls}${doors}${wins}${labels}${pulses}${hits}</g></svg>`;
}
function viewReview() {
  if (!draft.file) return redirect('#/new');
  if (draft.type === 'plan') {
    const p = draft.plan || (draft.plan = freshPlan()), n = p.checks.filter(Boolean).length;
    const tips = { select: 'Click a wall to remove it or bring it back.', door: 'Click a wall to place a door. Click a door to remove it.', win: 'Click a wall to place a window. Click a window to remove it.', gap: 'Click a wall to turn it into an open archway, and again to close it.' };
    return `<a class="under-link" href="#/new">← Back</a><div class="page-head" style="margin-top:8px"><div><p class="eyebrow">NEW SCENE · ${esc(draft.file.name)}</p><h1>Review floor plan</h1><p class="sub">Check what we detected, fix anything that’s off, then build your 3D home.</p></div></div>${stepper(2)}
    <div class="review"><div class="card plan-card"><div class="plan-tools"><div class="seg" role="group" aria-label="Tool">${[['select', 'Select'], ['door', '+ Door'], ['win', '+ Window'], ['gap', 'Open gap']].map(([k, l]) => `<button data-action="tool" data-v="${k}" aria-pressed="${p.tool === k}">${l}</button>`).join('')}</div><div class="row" style="gap:6px"><button class="btn ghost sm" data-action="rot" aria-label="Rotate 90 degrees">⟳ Rotate</button><button class="btn ghost sm" data-action="flip" data-v="x" aria-label="Flip horizontal">⇋ Flip H</button><button class="btn ghost sm" data-action="flip" data-v="y" aria-label="Flip vertical">⇅ Flip V</button><button class="btn ghost sm" data-action="reset-plan">Reset</button></div></div>
    <div class="plan-wrap">${planSvg(p)}</div>
    <div class="plan-foot"><p class="note" id="plan-tip">${tips[p.tool]}</p><p class="legend"><span><i class="lg door"></i>Door</span><span><i class="lg win"></i>Window</span><span><i class="lg gap"></i>Open archway</span></p></div></div>
    <aside class="review-side"><div class="card"><p class="section-label">WHAT WE FOUND</p><div class="found"><div><b id="c-rooms">${ROOMS.length}</b><span>Rooms</span></div><div><b id="c-doors">${p.doors.length}</b><span>Doors</span></div><div><b id="c-wins">${p.wins.length}</b><span>Windows</span></div></div></div>
    <div class="card confirm-card"><div class="row" style="justify-content:space-between"><p class="section-label" style="margin:0">PLEASE CONFIRM</p><span class="note"><b id="c-n">${n}</b> of 3</span></div><div class="progress" aria-hidden="true"><i id="c-bar" style="width:${n / 3 * 100}%"></i></div><p class="note" style="margin-top:10px">We weren’t sure about three things. Hover one to see it on the plan.</p><div class="checks">${CONFIRMS.map((c, i) => `<label class="check" data-focus="${i}"><input type="checkbox" data-action="confirm" data-i="${i}" ${p.checks[i] ? 'checked' : ''}><span>${c}</span></label>`).join('')}</div></div>
    <div class="review-actions"><a class="btn ghost" href="#/new" style="flex:0 0 auto">Back</a><a class="btn" href="#/new/share" style="flex:1">Build 3D home</a></div></aside></div>`;
  }
  const ext = (draft.file.name.split('.').pop() || '').toUpperCase(), heavy = HEAVY.test(draft.file.name);
  return `<a class="under-link" href="#/new">← Back</a><div class="page-head" style="margin-top:12px"><div><p class="eyebrow">NEW SCENE · ${esc(draft.file.name)}</p><h1>Review file</h1></div></div>${stepper(2)}
  <div class="split"><div class="card"><label class="field">Scene name<input id="scene-name" value="${esc(draft.name || draft.file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))}"></label>
  <label class="field" style="margin-top:18px">Optimisation<select id="quality"><option value="balanced" ${draft.quality === 'balanced' ? 'selected' : ''}>Balanced (recommended)</option><option value="fast" ${draft.quality === 'fast' ? 'selected' : ''}>Fastest to open</option><option value="max" ${draft.quality === 'max' ? 'selected' : ''}>Maximum fidelity</option></select></label></div>
  <div class="card paper"><p class="label">What we found</p><dl class="kv" style="margin-top:12px"><dt>File</dt><dd>${esc(draft.file.name)}</dd><dt>Format</dt><dd>${esc(ext)}${/^(fbx|obj|zip)$/i.test(ext) ? ' · converted for you' : ''}</dd><dt>Size</dt><dd>${bytes(draft.file.size)}</dd><dt>Processing</dt><dd>${heavy ? 'Heavier capture, takes longer' : 'Quick'}</dd></dl></div></div>
  <div class="step-actions"><a class="btn ghost" href="#/new">Back</a><a class="btn" href="#/new/share" data-action="to-share">Continue</a></div>`;
}
function viewShare() {
  if (!draft.file) return redirect('#/new');
  if (!draft.tmp) draft.tmp = { id: 'sc-' + state.next, title: draft.name || draft.file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'Untitled scene', source: draft.type === 'plan' ? 'Floor plan' : 'Upload · ' + (draft.file.name.split('.').pop() || '').toUpperCase(), kind: draft.type === 'plan' ? 'room' : /\.(e57|las|laz|xyz|ply|splat)$/i.test(draft.file.name) ? 'scan' : 'room', views: 0, sessions: 0, watch: 0, date: new Date().toISOString().slice(0, 10), privacy: 'private', opts: { comments: true, branding: true, expires: false }, readyAt: HEAVY.test(draft.file.name) ? now() + 12000 : 0 };
  const s = draft.tmp;
  return `<a class="under-link" href="#/new/review">← Back</a><div class="page-head" style="margin-top:12px"><div><p class="eyebrow">NEW SCENE · PREVIEW AND SHARE</p><h1>Your scene is ready</h1><p class="sub">It works on every device.</p></div></div>${stepper(3)}
  <div class="split"><div>${viewerHtml(s.kind)}</div><div style="display:grid;gap:20px">${shareControls(s)}</div></div>
  <div class="step-actions"><span class="note">Save to keep it in your Playground scenes.</span><button class="btn" data-action="save-scene">Save to Playground</button></div>`;
}
const notFound = () => head('PLAYGROUND', 'Not found', 'That page doesn’t exist.') + '<a class="btn" href="#/scenes">Back to scenes</a>';
function redirect(h) { setTimeout(() => { location.hash = h; }, 0); return ''; }

/* ---------- router ---------- */
function activeScene(id) { return draft.tmp && draft.tmp.id === id ? draft.tmp : byId(id); }
function route() {
  cleanups.forEach(f => f()); cleanups = [];
  const parts = (location.hash.replace(/^#\/?/, '') || 'scenes').split('/'), [a, b] = parts;
  let html, nav = a;
  if (a === 'scenes') html = viewScenes();
  else if (a === 'scene') { html = viewScene(b); nav = 'scenes'; }
  else if (a === 'analytics') html = viewAnalytics(b);
  else if (a === 'webhooks') html = viewWebhooks();
  else if (a === 'plugins') html = viewPlugins();
  else if (a === 'new') { html = b === 'review' ? viewReview() : b === 'share' ? viewShare() : viewNew(); nav = 'scenes'; }
  else html = notFound();
  main.innerHTML = html;
  document.querySelectorAll('[data-nav]').forEach(l => l.toggleAttribute('aria-current', false) || (l.dataset.nav === nav && l.setAttribute('aria-current', 'page')));
  const v = $('[data-viewer]'); if (v) mountViewer(v, v.dataset.viewer);
  document.title = 'Playground | Verse Engine by Ctruh';
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
const rerender = () => { const y = scrollY, f = document.activeElement?.id; cleanups.forEach(x => x()); cleanups = []; route(); scrollTo(0, y); if (f) $('#' + f)?.focus(); };
setInterval(() => { if ((location.hash.replace(/^#\/?/, '') || 'scenes') === 'scenes' && state.scenes.some(s => s.readyAt && s.readyAt <= now() && !s.notified)) { state.scenes.forEach(s => { if (s.readyAt && s.readyAt <= now()) s.notified = true; }); save(); if (document.activeElement === document.body || !main.contains(document.activeElement)) rerender(); } }, 2000);

/* ---------- events ---------- */
function setFile(f, sample = false) { draft.file = { name: f.name, size: f.size }; draft.sample = sample; draft.name = ''; draft.plan = null; draft.tmp = null; rerender(); }
main.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'file' && t.files[0]) setFile(t.files[0]);
  else if (t.id === 'an-scene') { anId = t.value; rerender(); }
  else if (t.id === 'scene-name') draft.name = t.value;
  else if (t.id === 'quality') draft.quality = t.value;
  else if (t.dataset.action === 'opt') { const s = activeScene(t.dataset.id); s.opts[t.dataset.k] = t.checked; save(); }
  else if (t.dataset.action === 'confirm') { draft.plan.checks[+t.dataset.i] = t.checked; { const n = draft.plan.checks.filter(Boolean).length; $('#c-n').textContent = n; $('#c-bar').style.width = (n / 3 * 100) + '%'; } }
  else if (t.dataset.field === 'title') { const s = activeScene(t.dataset.id); s.title = t.value.trim() || s.title; save(); }
});
const route0 = () => (location.hash.replace(/^#\/?/, '').split('/')[0] || 'scenes');
main.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'q' && e.target.dataset.scope === 'scene') { qs.scenes = e.target.value; filter = 'all'; location.hash = '#/scenes'; } });
main.addEventListener('input', e => { const t = e.target; if (t.id === 'q' && t.dataset.scope in qs) { qs[t.dataset.scope] = t.value; const pos = t.selectionStart; rerender(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } else if (t.id === 'scene-name') draft.name = t.value; });
['dragover', 'dragleave', 'drop'].forEach(ev => main.addEventListener(ev, e => {
  const d = e.target.closest('#drop'); if (!d) return; e.preventDefault();
  d.classList.toggle('over', ev === 'dragover'); if (ev === 'drop' && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
}));

function updatePlanCounts() { const p = draft.plan; $('#c-doors').textContent = p.doors.length; $('#c-wins').textContent = p.wins.length; }
function svgPoint(svgEl, e) { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const g = svgEl.querySelector('g'); return pt.matrixTransform(g.getScreenCTM().inverse()); }
function nearestOnWall(w, pt) { const [x1, y1, x2, y2] = w, dx = x2 - x1, dy = y2 - y1, t = Math.max(0.15, Math.min(0.85, ((pt.x - x1) * dx + (pt.y - y1) * dy) / (dx * dx + dy * dy))); return [Math.round(x1 + t * dx), Math.round(y1 + t * dy), dx === 0 ? 'v' : 'h']; }
const setFocus = i => { const s = $('#plan'); if (s) { if (i == null) delete s.dataset.focus; else s.dataset.focus = i; } };
main.addEventListener('mouseover', e => { const c = e.target.closest('[data-focus]'); if (c) setFocus(c.dataset.focus); });
main.addEventListener('mouseout', e => { if (e.target.closest('[data-focus]')) setFocus(null); });
main.addEventListener('focusin', e => { const c = e.target.closest('[data-focus]'); if (c) setFocus(c.dataset.focus); });
main.addEventListener('focusout', e => { if (e.target.closest('[data-focus]')) setFocus(null); });
main.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.hit')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 })); } });

function handle(e) {
  const wall = e.target.closest('[data-wall]'), door = e.target.closest('[data-door]'), win = e.target.closest('[data-win]');
  if (draft.plan && (wall || door || win)) {
    const p = draft.plan;
    if (door && p.tool !== 'win') { p.doors.splice(+door.dataset.door, 1); }
    else if (win && p.tool !== 'door') { p.wins.splice(+win.dataset.win, 1); }
    else if (door || win) return;
    else if (wall) {
      const i = +wall.dataset.wall;
      const pt = e.clientX || e.clientY ? svgPoint($('#plan'), e) : { x: (WALLS0[i][0] + WALLS0[i][2]) / 2, y: (WALLS0[i][1] + WALLS0[i][3]) / 2 };
      if (p.tool === 'door') p.doors.push(nearestOnWall(WALLS0[i], pt));
      else if (p.tool === 'win') p.wins.push(nearestOnWall(WALLS0[i], pt));
      else if (p.tool === 'gap') p.walls[i] = p.walls[i] === 'gap' ? 'solid' : 'gap';
      else p.walls[i] = p.walls[i] === 'off' ? 'solid' : 'off';
    } else return;
    const f = $('#plan').dataset.focus; $('#plan').outerHTML = planSvg(p); if (f != null) setFocus(f); updatePlanCounts(); return;
  }
  const b = e.target.closest('[data-action]'); if (!b) return;
  const a = b.dataset.action, id = b.dataset.id, v = b.dataset.v;
  switch (a) {
    case 'filter': filter = v; rerender(); break;
    case 'copy-scene': copy(sceneUrl(id), 'Link copied'); break;
    case 'src': draft = { ...draft, type: v, file: null, sample: false, plan: null, tmp: null }; rerender(); break;
    case 'sample': setFile(draft.type === 'plan' ? { name: 'koramangala-2bhk-plan.pdf', size: 482000 } : { name: 'living-room-set.glb', size: 18400000 }, true); break;
    case 'need-file': e.preventDefault(); toast('Choose a file or use a sample first'); break;
    case 'cancel': draft = { type: '3d', file: null, name: '', sample: false, plan: null, quality: 'balanced' }; break;
    case 'rot': draft.plan.rot = (draft.plan.rot + 90) % 360; $('#plan').outerHTML = planSvg(draft.plan); break;
    case 'flip': draft.plan[v === 'x' ? 'fx' : 'fy'] *= -1; $('#plan').outerHTML = planSvg(draft.plan); break;
    case 'tool': draft.plan.tool = v; rerender(); break;
    case 'reset-plan': draft.plan = freshPlan(); rerender(); break;
    case 'privacy': { const s = activeScene(id); s.privacy = v; save(); rerender(); break; }
    case 'revoke': { const s = activeScene(id); s.rev = (s.rev || 0) + 1; save(); toast('Previous link revoked (Playground links are local)'); break; }
    case 'save-scene': { const s = draft.tmp; state.scenes.unshift(s); state.next++; save(); draft = { type: '3d', file: null, name: '', sample: false, plan: null, quality: 'balanced' }; toast('Saved to your Playground'); location.hash = '#/scenes'; break; }
    case 'export': { const s = activeScene(id); openDialog(`<div class="dlg-head"><h3>Export video</h3><button class="dlg-x" data-action="close">Close ×</button></div><label class="field">Resolution<select><option>1080p</option><option>1440p</option><option>4K</option></select></label><label class="field">Camera path<select><option>Orbit</option><option>Walkthrough</option></select></label><p class="note">Video export runs on the Verse service. In the Playground this only queues a placeholder.</p><div class="row"><button class="btn" data-action="queue-export" data-id="${s.id}">Queue export</button></div>`); break; }
    case 'queue-export': dialog.close(); toast('Export queued (Playground simulation)'); break;
    case 'embed': { const s = activeScene(id), src = sceneUrl(s.id); openDialog(`<div class="dlg-head"><h3>Embed</h3><button class="dlg-x" data-action="close">Close ×</button></div><p class="label">iframe</p><pre class="code" id="emb">${esc(`<iframe src="${src}" width="100%" height="480" allow="xr-spatial-tracking; fullscreen" title="${s.title}"></iframe>`)}</pre><div class="row"><button class="btn" data-action="copy-text" data-t="${esc(`<iframe src="${src}" width="100%" height="480" allow="xr-spatial-tracking; fullscreen" title="${s.title}"></iframe>`)}">Copy snippet</button><a class="under-link" href="/docs/embed-sdk">Embed SDK ↗</a></div>`); break; }
    case 'tour': { const s = activeScene(id); s.tour = s.tour || String(Math.floor(100000 + Math.random() * 900000)); openDialog(`<div class="dlg-head"><h3>Live tour</h3><button class="dlg-x" data-action="close">Close ×</button></div><p>Share this code so others can join your tour.</p><p class="stat"><b class="mono" style="font-size:40px">${s.tour}</b></p><p class="note">Live tours run on the Verse service. This code is a Playground placeholder and cannot be joined by others.</p><div class="row"><button class="btn" data-action="copy-text" data-t="${s.tour}">Copy code</button></div>`); break; }
    case 'phone': { const s = activeScene(id); openDialog(`<div class="dlg-head"><h3>Open on phone</h3><button class="dlg-x" data-action="close">Close ×</button></div><p>Send yourself this link, then open it on your phone. Playground scenes live in this browser, so the link only resolves here.</p><div class="linkbox"><input readonly aria-label="Link" value="${esc(sceneUrl(s.id))}"><button class="btn sm" data-action="copy-text" data-t="${esc(sceneUrl(s.id))}">Copy</button></div>`); break; }
    case 'copy-text': copy(b.dataset.t); break;
    case 'export-csv': { const s = byId(anId); if (!s) break; const vals = series(s.id + 'v', s.views * 3 || 0).map(x => s.views ? x : 0).slice(-anRange); const csv = 'date,views\n' + vals.map((x, i) => `${dayLabel(i, anRange)},${x}`).join('\n'); const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a2.download = `${s.id}-views-${anRange}d.csv`; document.body.append(a2); a2.click(); a2.remove(); toast('CSV downloaded'); break; }
    case 'range': anRange = +v; rerender(); break;
    case 'sel-hook': whSel = id; rerender(); break;
    case 'toggle-hook': { const h = state.hooks.find(x => x.id === id); h.status = h.status === 'paused' ? 'active' : 'paused'; save(); rerender(); break; }
    case 'del-hook': openDialog(`<div class="dlg-head"><h3>Delete webhook?</h3><button class="dlg-x" data-action="close">Close ×</button></div><p>This removes it from the Playground.</p><div class="row"><button class="btn danger" data-action="del-hook-ok" data-id="${id}">Delete</button><button class="btn ghost" data-action="close">Cancel</button></div>`); break;
    case 'del-hook-ok': state.hooks = state.hooks.filter(x => x.id !== id); save(); dialog.close(); rerender(); toast('Webhook deleted'); break;
    case 'test-hook': { const h = state.hooks.find(x => x.id === id), ev = h.events[0]; (state.deliveries[id] ||= []).unshift([ev, 'Just now', h.status === 'failing' ? '✕ 503 (simulated)' : '✓ 200 OK (simulated)']); save(); rerender(); toast('Test event simulated. Nothing was sent.'); break; }
    case 'new-hook': openDialog(`<div class="dlg-head"><h3>Create webhook</h3><button class="dlg-x" data-action="close">Close ×</button></div><form id="hook-form" class="dlg" style="padding:0"><label class="field">Name<input name="name" required maxlength="40" autocomplete="off"></label><label class="field">Endpoint URL<input name="url" type="url" required placeholder="https://example.com/hook"></label><fieldset class="event-pick" style="border:0;padding:0;margin:0"><legend class="label">Events</legend>${EVENTS.map((x, i) => `<label class="check"><input type="checkbox" name="ev" value="${x}" ${i < 2 ? 'checked' : ''}><span class="mono">${x}</span></label>`).join('')}</fieldset><div class="row"><button class="btn" type="submit">Create webhook</button><button class="btn ghost" type="button" data-action="close">Cancel</button></div></form>`); $('#hook-form').addEventListener('submit', ev => { ev.preventDefault(); const f = new FormData(ev.target), events = f.getAll('ev'); if (!events.length) return toast('Pick at least one event'); const h = { id: 'wh' + now(), name: f.get('name'), url: f.get('url'), status: 'active', events }; state.hooks.unshift(h); whSel = h.id; save(); dialog.close(); rerender(); toast('Webhook created'); }); break;
    case 'new-key': openDialog(`<div class="dlg-head"><h3>Create API key</h3><button class="dlg-x" data-action="close">Close ×</button></div><form id="key-form" class="dlg" style="padding:0"><label class="field">Key name<input name="name" required maxlength="40" autocomplete="off" value="Playground key"></label><p class="note">Playground keys are random placeholders. They do not authenticate with the production API.</p><div class="row"><button class="btn" type="submit">Create key</button><button class="btn ghost" type="button" data-action="close">Cancel</button></div></form>`); $('#key-form').addEventListener('submit', ev => { ev.preventDefault(); const r = crypto.getRandomValues(new Uint8Array(18)); state.keys.unshift({ id: 'k' + now(), name: new FormData(ev.target).get('name'), secret: 'vk_play_' + [...r].map(x => x.toString(16).padStart(2, '0')).join(''), shown: true }); save(); dialog.close(); rerender(); }); break;
    case 'show-key': { const k = state.keys.find(x => x.id === id); k.shown = !k.shown; save(); rerender(); break; }
    case 'copy-key': copy(state.keys.find(x => x.id === id).secret, 'Key copied'); break;
    case 'reset-all': openDialog('<div class="dlg-head"><h3>Reset Playground?</h3><button class="dlg-x" data-action="close">Close ×</button></div><p>This clears the scenes, webhooks and keys stored in this browser and restores the demo data.</p><div class="row"><button class="btn danger" data-action="reset-ok">Reset</button><button class="btn ghost" data-action="close">Cancel</button></div>'); break;
    case 'reset-ok': try { localStorage.removeItem(KEY); } catch { /* ignore */ } state = null; load(); draft = { type: '3d', file: null, name: '', sample: false, plan: null, quality: 'balanced' }; dialog.close(); if (location.hash === '#/scenes') route(); else location.hash = '#/scenes'; toast('Playground reset'); break;
    case 'del-key': state.keys = state.keys.filter(x => x.id !== id); save(); rerender(); toast('Key revoked'); break;
  }
}
main.addEventListener('click', handle);
dialog.addEventListener('click', handle);
$('.st-side').addEventListener('click', e => { if (e.target.closest('[data-action="reset-all"]')) handle(e); });
route();
