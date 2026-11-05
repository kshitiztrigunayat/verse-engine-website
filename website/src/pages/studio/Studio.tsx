// Playground (/studio): a workspace that runs entirely in this browser (localStorage); nothing is
// uploaded or published. Sign-in is a prototype (see Signin.tsx). Its pages are #/ addresses:
// #/scenes, #/scene/<id>, #/analytics[/<id>], #/webhooks, #/plugins, #/new[/review|/share].
// The 3D preview is Three.js (viewer.ts). (Was public/js/studio.js.)
//
// How it updates (same as before): moving to another #/ address, or a change that affects the page,
// rebuilds the view (fresh elements, keeping scroll position and focus); a few things change in
// place (the floor plan editor, the confirm counter, the drop zone highlight, the toast).
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import StudioGate from "./StudioGate.tsx";
import { LiveContext, dialogs, viewFor } from "./views.tsx";
import { KEY, SESSION, WALLS0, dayLabel, emptyDraft, freshPlan, loadState, nearestOnWall, now, saveState, sceneUrl, series } from "./data.ts";

const TITLE = "Playground | Verse Engine by Ctruh";
const $ = (s, r = document) => r.querySelector(s);
const go = (href, options = {}) => document.dispatchEvent(new CustomEvent("verse:navigate", { detail: { href, ...options } }));
const route0 = () => location.hash.replace(/^#\/?/, "").split("/")[0] || "scenes";
function readUser() { try { return JSON.parse(localStorage.getItem(SESSION)); } catch { return null; } }

export default function Studio() {
  const [user] = useState(() => { const u = readUser(); return u && u.name ? u : null; });
  // The Playground's data and what the views are showing (read when a view is built).
  const S = useRef(null);
  if (!S.current && user) S.current = { state: loadState(), draft: emptyDraft(), qs: { scenes: "", analytics: "", webhooks: "", plugins: "" }, filter: "all", anRange: 30, anId: null, whSel: "wh1" };
  const seq = useRef(0), dialogSeq = useRef(0), toastTimer = useRef<ReturnType<typeof setTimeout> | 0>(0);
  const mainRef = useRef(null), dialogRef = useRef(null);
  const redirect = (h) => { setTimeout(() => { location.hash = h; }, 0); return null; };
  const build = () => ({ key: ++seq.current, ...viewFor(S.current, location.hash, redirect) });
  const [screen, setScreen] = useState(() => (user ? build() : null));
  const [live, setLive] = useState({ tick: 0, planKey: 0 });
  const [dialog, setDialog] = useState(null);
  const [toastState, setToast] = useState({ msg: "", on: false });
  const current = (nav) => (screen && screen.nav === nav ? ("page" as const) : undefined);

  const save = () => saveState(S.current.state);
  function route() {
    flushSync(() => setScreen(build()));
    document.title = TITLE;
    window.scrollTo(0, 0);
  }
  function rerender() {
    const y = scrollY, f = document.activeElement?.id;
    route();
    scrollTo(0, y);
    if (f) $("#" + f)?.focus();
  }
  /** Update the parts that change in place; `plan` also redraws the floor plan. */
  const refresh = (plan = false) => flushSync(() => setLive((l) => ({ tick: l.tick + 1, planKey: l.planKey + (plan ? 1 : 0) })));
  function toast(msg) {
    setToast({ msg, on: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), 2600);
  }
  async function copy(text, msg = "Copied") {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select(); try { document.execCommand("copy"); toast(msg); } catch { toast("Copy is blocked by the browser"); } t.remove(); }
  }
  function openDialog(content) {
    flushSync(() => setDialog({ key: ++dialogSeq.current, content }));
    if (!dialogRef.current.open) dialogRef.current.showModal();
  }
  const closeDialog = () => dialogRef.current.close();

  useLayoutEffect(() => {
    if (!user) { go("/signin?next=" + encodeURIComponent("/studio" + location.hash), { replace: true }); return; }
    document.title = TITLE;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    addEventListener("hashchange", route);
    // A demo scene that was processing becomes ready: refresh the scenes list (unless the visitor is typing in it).
    const readyTimer = setInterval(() => {
      const { state } = S.current;
      if (route0() === "scenes" && state.scenes.some((s) => s.readyAt && s.readyAt <= now() && !s.notified)) {
        state.scenes.forEach((s) => { if (s.readyAt && s.readyAt <= now()) s.notified = true; });
        save();
        if (document.activeElement === document.body || !mainRef.current.contains(document.activeElement)) rerender();
      }
    }, 2000);
    // Field changes that take effect when the field is committed (native "change").
    const main = mainRef.current;
    main.addEventListener("change", onChange);
    return () => { removeEventListener("hashchange", route); clearInterval(readyTimer); main.removeEventListener("change", onChange); clearTimeout(toastTimer.current); };
  }, []);

  /* ---------- events ---------- */
  const activeScene = (id) => { const { draft, state } = S.current; return draft.tmp && draft.tmp.id === id ? draft.tmp : state.scenes.find((s) => s.id === id); };
  function setFile(f, sample = false) { Object.assign(S.current.draft, { file: { name: f.name, size: f.size }, sample, name: "", plan: null, tmp: null }); rerender(); }
  function onChange(e) {
    const t = e.target, { draft } = S.current;
    if (t.id === "file" && t.files[0]) setFile(t.files[0]);
    else if (t.id === "an-scene") { S.current.anId = t.value; rerender(); }
    else if (t.id === "scene-name") draft.name = t.value;
    else if (t.id === "quality") draft.quality = t.value;
    else if (t.dataset.action === "opt") { const s = activeScene(t.dataset.id); s.opts[t.dataset.k] = t.checked; save(); }
    else if (t.dataset.action === "confirm") { draft.plan.checks[+t.dataset.i] = t.checked; refresh(); }
    else if (t.dataset.field === "title") { const s = activeScene(t.dataset.id); s.title = t.value.trim() || s.title; save(); }
  }
  function onInput(e) {
    const t = e.target, { qs, draft } = S.current;
    if (t.id === "q" && t.dataset.scope in qs) { qs[t.dataset.scope] = t.value; const pos = t.selectionStart; rerender(); const q = $("#q"); q.focus(); q.setSelectionRange(pos, pos); }
    else if (t.id === "scene-name") draft.name = t.value;
  }
  function onKeyDown(e) {
    if (e.key === "Enter" && e.target.id === "q" && e.target.dataset.scope === "scene") { S.current.qs.scenes = e.target.value; S.current.filter = "all"; location.hash = "#/scenes"; }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".hit")) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 0, clientY: 0 })); }
  }
  const onDrag = (ev) => (e) => {
    const d = e.target.closest("#drop"); if (!d) return; e.preventDefault();
    d.classList.toggle("over", ev === "dragover"); if (ev === "drop" && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };
  // Hovering or focusing a "please confirm" item highlights it on the plan.
  const setFocus = (i) => { const s = $("#plan"); if (s) { if (i == null) delete s.dataset.focus; else s.dataset.focus = i; } };
  const onOver = (e) => { const c = e.target.closest("[data-focus]"); if (c) setFocus(c.dataset.focus); };
  const onOut = (e) => { if (e.target.closest("[data-focus]")) setFocus(null); };

  function svgPoint(svgEl, e) { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const g = svgEl.querySelector("g"); return pt.matrixTransform(g.getScreenCTM().inverse()); }
  function handle(e) {
    const st = S.current, { draft } = st;
    const wall = e.target.closest("[data-wall]"), door = e.target.closest("[data-door]"), win = e.target.closest("[data-win]");
    if (draft.plan && (wall || door || win)) {
      const p = draft.plan;
      if (door && p.tool !== "win") { p.doors.splice(+door.dataset.door, 1); }
      else if (win && p.tool !== "door") { p.wins.splice(+win.dataset.win, 1); }
      else if (door || win) return;
      else if (wall) {
        const i = +wall.dataset.wall;
        const pt = e.clientX || e.clientY ? svgPoint($("#plan"), e) : { x: (WALLS0[i][0] + WALLS0[i][2]) / 2, y: (WALLS0[i][1] + WALLS0[i][3]) / 2 };
        if (p.tool === "door") p.doors.push(nearestOnWall(WALLS0[i], pt));
        else if (p.tool === "win") p.wins.push(nearestOnWall(WALLS0[i], pt));
        else if (p.tool === "gap") p.walls[i] = p.walls[i] === "gap" ? "solid" : "gap";
        else p.walls[i] = p.walls[i] === "off" ? "solid" : "off";
      } else return;
      const f = $("#plan").dataset.focus; refresh(true); if (f != null) setFocus(f); return;
    }
    const b = e.target.closest("[data-action]"); if (!b) return;
    const a = b.dataset.action, id = b.dataset.id, v = b.dataset.v, { state } = st;
    switch (a) {
      case "filter": st.filter = v; rerender(); break;
      case "copy-scene": copy(sceneUrl(id), "Link copied"); break;
      case "src": st.draft = { ...draft, type: v, file: null, sample: false, plan: null, tmp: null }; rerender(); break;
      case "sample": setFile(draft.type === "plan" ? { name: "koramangala-2bhk-plan.pdf", size: 482000 } : { name: "living-room-set.glb", size: 18400000 }, true); break;
      case "need-file": e.preventDefault(); toast("Choose a file or use a sample first"); break;
      case "cancel": st.draft = emptyDraft(); break;
      case "rot": draft.plan.rot = (draft.plan.rot + 90) % 360; refresh(true); break;
      case "flip": draft.plan[v === "x" ? "fx" : "fy"] *= -1; refresh(true); break;
      case "tool": draft.plan.tool = v; rerender(); break;
      case "reset-plan": draft.plan = freshPlan(); rerender(); break;
      case "privacy": { const s = activeScene(id); s.privacy = v; save(); rerender(); break; }
      case "revoke": { const s = activeScene(id); s.rev = (s.rev || 0) + 1; save(); toast("Previous link revoked (Playground links are local)"); break; }
      case "save-scene": { const s = draft.tmp; state.scenes.unshift(s); state.next++; save(); st.draft = emptyDraft(); toast("Saved to your Playground"); location.hash = "#/scenes"; break; }
      case "export": openDialog(dialogs.export(activeScene(id))); break;
      case "queue-export": closeDialog(); toast("Export queued (Playground simulation)"); break;
      case "embed": openDialog(dialogs.embed(activeScene(id))); break;
      case "tour": { const s = activeScene(id); s.tour = s.tour || String(Math.floor(100000 + Math.random() * 900000)); openDialog(dialogs.tour(s)); break; }
      case "phone": openDialog(dialogs.phone(activeScene(id))); break;
      case "copy-text": copy(b.dataset.t); break;
      case "export-csv": {
        const s = state.scenes.find((x) => x.id === st.anId); if (!s) break;
        const vals = series(s.id + "v", s.views * 3 || 0).map((x) => (s.views ? x : 0)).slice(-st.anRange);
        const csv = "date,views\n" + vals.map((x, i) => `${dayLabel(i, st.anRange)},${x}`).join("\n");
        const a2 = document.createElement("a"); a2.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a2.download = `${s.id}-views-${st.anRange}d.csv`; document.body.append(a2); a2.click(); a2.remove(); toast("CSV downloaded"); break;
      }
      case "range": st.anRange = +v; rerender(); break;
      case "sel-hook": st.whSel = id; rerender(); break;
      case "toggle-hook": { const h = state.hooks.find((x) => x.id === id); h.status = h.status === "paused" ? "active" : "paused"; save(); rerender(); break; }
      case "del-hook": openDialog(dialogs.deleteHook(id)); break;
      case "del-hook-ok": state.hooks = state.hooks.filter((x) => x.id !== id); save(); closeDialog(); rerender(); toast("Webhook deleted"); break;
      case "test-hook": { const h = state.hooks.find((x) => x.id === id), ev = h.events[0]; (state.deliveries[id] ||= []).unshift([ev, "Just now", h.status === "failing" ? "✕ 503 (simulated)" : "✓ 200 OK (simulated)"]); save(); rerender(); toast("Test event simulated. Nothing was sent."); break; }
      case "new-hook": openDialog(dialogs.newHook((ev) => {
        ev.preventDefault();
        const f = new FormData(ev.target), events = f.getAll("ev");
        if (!events.length) return toast("Pick at least one event");
        const h = { id: "wh" + now(), name: f.get("name"), url: f.get("url"), status: "active", events };
        state.hooks.unshift(h); st.whSel = h.id; save(); closeDialog(); rerender(); toast("Webhook created");
      })); break;
      case "new-key": openDialog(dialogs.newKey((ev) => {
        ev.preventDefault();
        const r = crypto.getRandomValues(new Uint8Array(18));
        state.keys.unshift({ id: "k" + now(), name: new FormData(ev.target).get("name"), secret: "vk_play_" + [...r].map((x) => x.toString(16).padStart(2, "0")).join(""), shown: true });
        save(); closeDialog(); rerender();
      })); break;
      case "show-key": { const k = state.keys.find((x) => x.id === id); k.shown = !k.shown; save(); rerender(); break; }
      case "copy-key": copy(state.keys.find((x) => x.id === id).secret, "Key copied"); break;
      case "reset-all": openDialog(dialogs.reset()); break;
      case "reset-ok": try { localStorage.removeItem(KEY); } catch { /* ignore */ } st.state = loadState(); st.draft = emptyDraft(); closeDialog(); if (location.hash === "#/scenes") route(); else location.hash = "#/scenes"; toast("Playground reset"); break;
      case "del-key": state.keys = state.keys.filter((x) => x.id !== id); save(); rerender(); toast("Key revoked"); break;
    }
  }
  function onDialogClick(e) {
    if (e.target === dialogRef.current || e.target.closest('[data-action="close"]')) closeDialog();
    handle(e);
  }
  function signOut() { try { localStorage.removeItem(SESSION); } catch { /* ignore */ } go("/signin"); }
  const mainHandlers = user ? { onClick: handle, onInput, onKeyDown, onDragOver: onDrag("dragover"), onDragLeave: onDrag("dragleave"), onDrop: onDrag("drop"), onMouseOver: onOver, onMouseOut: onOut, onFocus: onOver, onBlur: onOut } : {};

  return (
      <>
        <a className="skip" href="#studio-main" id="lnk-skip-to-content">Skip to content</a>
        <h1 className="visually-hidden">Verse Engine Playground</h1>
        <div className="st-shell">
          <aside className="st-side" aria-label="Playground" id="asd-playground">
            <a className="brand" href="/" aria-label="Verse Engine home" id="lnk-verse-engine-home-2">
              <svg viewBox="0 0 38 40" fill="none" aria-hidden="true">
                <path d="m19 2 16 9v19l-16 9-16-9V11L19 2Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="m3 11 16 10 16-10M19 21v18" stroke="currentColor" strokeWidth="1.7" />
                <path d="m11 6 16 10" stroke="#0066cc" strokeWidth="2.4" />
              </svg>
              <span>
                Verse Engine
                <small>PLAYGROUND · BY CTRUH</small>
              </span>
            </a>
            <a className="btn st-new" href="#/new" id="lnk-new-scene">+ New scene</a>
            <nav className="st-nav" aria-label="Playground sections" id="nav-playground-sections">
              <a href="#/scenes" data-nav="scenes" id="lnk-scenes" aria-current={current("scenes")}>
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="11" y="3" width="6" height="6" rx="1" />
                  <rect x="3" y="11" width="6" height="6" rx="1" />
                  <rect x="11" y="11" width="6" height="6" rx="1" />
                </svg>
                <span>Scenes</span>
              </a>
              <a href="#/analytics" data-nav="analytics" id="lnk-analytics" aria-current={current("analytics")}>
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 17V9M8 17V4M13 17v-6M18 17H2" />
                </svg>
                <span>Analytics</span>
              </a>
              <a href="#/webhooks" data-nav="webhooks" id="lnk-webhooks" aria-current={current("webhooks")}>
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 3v6l4 2M3 10a7 7 0 1 0 2-5" />
                </svg>
                <span>Webhooks</span>
              </a>
              <a href="#/plugins" data-nav="plugins" id="lnk-plug-ins-api" aria-current={current("plugins")}>
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0V7zM10 15v2" />
                </svg>
                <span>{"Plug-ins & API"}</span>
              </a>
            </nav>
            <p className="st-eyebrow">HELP</p>
            <nav className="st-nav st-help" aria-label="Help" id="nav-help">
              <a href="/docs/what-is-verse-engine" id="lnk-documentation-3">
                <span>Documentation</span>
              </a>
              <a href="/developers" id="lnk-api-sdk-2">
                <span>{"API & SDK"}</span>
              </a>
            </nav>
            <div className="st-account">
              <div className="st-acc-top">
                <div className="st-who">
                  <div>
                    <b id="st-name">{user ? user.name : "Guest"}</b>
                    <small>FREE PLAN · LOCAL</small>
                  </div>
                </div>
                <button className="st-reset" data-action="reset-all" id="btn-reset" onClick={handle}>Reset</button>
              </div>
              <a className="btn ghost sm st-upgrade" href="/pricing" id="lnk-upgrade-plan">Upgrade plan</a>
              <div className="st-account-actions">
                <button type="button" className="st-pillbtn" id="st-signout" onClick={signOut}>Sign out</button>
              </div>
            </div>
          </aside>
          <main id="studio-main" className="st-main" tabIndex={-1} ref={mainRef} {...mainHandlers}>
            <LiveContext.Provider value={{ S: S.current, planKey: live.planKey, tick: live.tick }}>
              {screen && <Fragment key={screen.key}>{screen.view}</Fragment>}
            </LiveContext.Provider>
          </main>
        </div>
        <div className="st-toast-spacer" />
        {"\n"}
        <StudioGate path="/studio" />
        {"\n"}
        <dialog className="st-dialog" id="st-dialog" ref={dialogRef} onClick={onDialogClick}>
          {dialog && <div className="dlg" key={dialog.key}>{dialog.content}</div>}
        </dialog>
        <div className={"st-toast" + (toastState.on ? " on" : "")} id="st-toast" role="status" aria-live="polite">{toastState.msg}</div>
      </>
  );
}
