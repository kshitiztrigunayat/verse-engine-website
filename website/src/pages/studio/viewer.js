// 3D preview of a Playground scene (Three.js, rendered on demand): drag to look, W A S D or arrow
// keys to walk, scroll to zoom. Unchanged from public/js/studio.js; `cleanups` collects what to undo.
import { seeded } from "./data.js";

// Three.js is served from public/vendor. The full URL makes the dev server serve it as it is.
const importVendor = (path) => import(/* @vite-ignore */ location.origin + path);

export async function mountViewer(el, kind, cleanups) {
  let THREE;
  try { THREE = await importVendor('/vendor/three.module.js'); } catch { el.insertAdjacentHTML('beforeend', '<div class="fallback">The 3D preview needs WebGL. The scene is still saved.</div>'); return; }
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
