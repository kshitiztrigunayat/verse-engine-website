// Playground views (the pages inside #studio-main) and dialogs. Each view is built from the store
// when the Playground routes or re-renders (see Studio.tsx), with the same markup as before
// (public/js/studio.js), including the line breaks between blocks.
import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { mountViewer } from "./viewer.ts";
import {
  CONFIRMS, EVENTS, FOCUS, FORMATS, HEAVY, PLUGINS, ROOMS, THUMBS, WALLS0,
  bytes, dayLabel, fmt, fmtDate, freshPlan, hms, now, sceneUrl, series, status,
} from "./data.ts";

const NL = "\n  ", NL4 = "\n    ";
const slug = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- live parts (updated in place, without rebuilding the view) ---------- */
export const LiveContext = createContext(null);

/* ---------- shared bits ---------- */
const PH = { scenes: "Search scenes", analytics: "Search scenes to analyze", webhooks: "Search webhooks", plugins: "Search plug-ins and keys", scene: "Search scenes" };
const NewButton = () => <a className="btn" href="/studio/new">+ New scene</a>;

function StudioHead({ S, title, sub, scope = "scenes", action = <NewButton /> }: { S: { qs: Record<string, string> }; title: string; sub?: string; scope?: keyof typeof PH; action?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">STUDIO</p>
        <h1>{title}</h1>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      <div className="row">
        <input className="search" id="q" data-scope={scope} type="search" placeholder={PH[scope]} aria-label={PH[scope]} defaultValue={S.qs[scope] || ""} />
        {action}
      </div>
    </header>
  );
}

function Pill({ s }) {
  return status(s) === "ready" ? <span className="pill ok">● Ready</span> : <span className="pill proc">◐ Processing</span>;
}

export function BarChart({ values, labelFn }) {
  const w = 720, h = 100, max = Math.max(...values, 1), bw = w / values.length;
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Bar chart, ${values.length} days, peak ${fmt(max)}`}>
        {values.map((v, i) => {
          const bh = Math.max(2, ((h - 4) * v) / max);
          return (
            <rect key={i} className={"bar" + (i === values.length - 1 ? " last" : "")} x={(i * bw + 1).toFixed(1)} y={(h - bh).toFixed(1)} width={Math.max(1, bw - 2).toFixed(1)} height={bh.toFixed(1)}>
              <title>{`${labelFn(i)}: ${fmt(v)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="chart-axis">
        <span>{`${values.length} DAYS AGO`}</span>
        <span>TODAY</span>
      </div>
    </>
  );
}
const peakLabel = (v, f) => { const m = Math.max(...v); const i = v.lastIndexOf(m); return `PEAK ${fmt(m)} ${i === v.length - 1 ? "TODAY" : "· " + f(i).toUpperCase()}`; };

/** The 3D preview; a new one is made whenever the view is rebuilt (as before). */
function Viewer({ kind }) {
  const el = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  useLayoutEffect(() => {
    const cleanups = [];
    let active = true;
    setUnavailable(false);
    mountViewer(el.current, kind, cleanups)
      .then((available) => { if (active && available === false) setUnavailable(true); })
      .catch((error) => {
        console.error("Unable to initialize the Studio 3D preview.", error);
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
      cleanups.forEach((fn) => fn());
    };
  }, [kind]);
  return (
    <div className="viewer" data-viewer={kind} ref={el}>
      {unavailable && <div className="fallback">The 3D preview needs WebGL. The scene is still saved.</div>}
      <span className="hint">DRAG TO LOOK · WASD TO WALK · SCROLL TO ZOOM</span>
    </div>
  );
}

/* ---------- scenes ---------- */
function SceneCard({ s }) {
  return (
    <article className="scene-card">
      <a className="scene-thumb" href={`/studio/scene/${s.id}`} tabIndex={-1} aria-hidden="true">
        <img src={THUMBS[s.kind] || THUMBS.room} alt="" loading="lazy" />
        <span className="badges">
          <Pill s={s} />
          <span className="pill">{s.source}</span>
        </span>
      </a>
      <div className="scene-body">
        <h3>{s.title}</h3>
        <div className="meta">
          <span><b>{fmt(s.views)}</b>{" views"}</span>
          <span><b>{fmt(s.sessions)}</b>{" sessions"}</span>
          <span>{fmtDate(s.date)}</span>
        </div>
      </div>
      <div className="scene-actions">
        <button className="btn ghost sm" data-action="copy-scene" data-id={s.id} id={`btn-scene-card-copy-link-${s.id}`}>Copy link</button>
        <a className="btn ghost sm" href={`/studio/analytics/${s.id}`}>Analytics</a>
        <a className="btn sm" href={`/studio/scene/${s.id}`}>Open</a>
      </div>
    </article>
  );
}

function viewScenes(S) {
  const { state } = S;
  const views = state.scenes.reduce((a, s) => a + s.views, 0), sessions = state.scenes.reduce((a, s) => a + s.sessions, 0), watch = state.scenes.reduce((a, s) => a + s.watch, 0);
  const total = series("all", views).slice(-30), dl = (i) => dayLabel(i, 30);
  const list = state.scenes.filter((s) => (S.filter === "all" || status(s) === S.filter) && s.title.toLowerCase().includes(S.qs.scenes.toLowerCase()));
  return (
    <>
      <StudioHead S={S} title="Your scenes" sub="Everything you’ve uploaded or published from a plug-in." />
      {NL}
      <p className="section-label">GLOBAL ANALYTICS · LAST 30 DAYS</p>
      {NL}
      <div className="stats">
        <div className="stat"><span>Scenes created</span><b>{String(state.scenes.length)}</b></div>
        <div className="stat"><span>Total views</span><b>{fmt(views)}</b></div>
        <div className="stat"><span>Total watch time</span><b>{hms(watch)}</b></div>
        <div className="stat"><span>Unique sessions</span><b>{fmt(sessions)}</b></div>
      </div>
      {NL}
      <section className="card" aria-labelledby="all-views">
        <div className="chart-head">
          <h3 id="all-views">Views across all scenes</h3>
          <span className="peak">{peakLabel(total, dl)}</span>
        </div>
        <BarChart values={total} labelFn={dl} />
      </section>
      {NL}
      <div className="toolbar">
        <p className="section-label" style={{ margin: "0" }}>{`ALL SCENES (${state.scenes.length})`}</p>
        <div className="tabs" role="group" aria-label="Filter scenes">
          {[["all", "All"], ["ready", "Ready"], ["processing", "Processing"]].map(([k, l]) => (
            <button key={k} className="tab" data-action="filter" data-v={k} id={`btn-filter-${k}`} aria-pressed={S.filter === k}>{l}</button>
          ))}
        </div>
      </div>
      {NL}
      {list.length ? (
        <div className="scene-grid">{list.map((s) => <SceneCard key={s.id} s={s} />)}</div>
      ) : (
        <div className="empty">No scenes match. Try another filter, or create a new scene.</div>
      )}
    </>
  );
}

/* ---------- one scene ---------- */
function ShareControls({ s }) {
  return (
    <>
      <div className="card">
        <p className="label">Share one link</p>
        <div className="linkbox" style={{ marginTop: "12px" }}>
          <input readOnly aria-label="Scene link" defaultValue={sceneUrl(s.id)} />
          <button className="btn sm" data-action="copy-scene" data-id={s.id} id={`btn-share-copy-link-${s.id}`}>Copy</button>
        </div>
        {NL}
        <p className="note" style={{ marginTop: "10px" }}>This link opens the scene in this Playground only.</p>
      </div>
      {NL}
      <div className="card">
        <label className="field">
          Scene name
          <input data-field="title" data-id={s.id} defaultValue={s.title} />
        </label>
        {NL}
        <p className="label" style={{ margin: "18px 0 10px" }}>Who can open it</p>
        <div className="seg" role="group" aria-label="Privacy">
          <button data-action="privacy" data-id={s.id} data-v="private" id={`btn-privacy-private-${s.id}`} aria-pressed={s.privacy === "private"}>Private link</button>
          <button data-action="privacy" data-id={s.id} data-v="public" id={`btn-privacy-public-${s.id}`} aria-pressed={s.privacy === "public"}>Public</button>
        </div>
        {NL}
        <p className="note" style={{ marginTop: "10px" }}>
          {s.privacy === "private" ? "Only people with the link can open a private scene. You can revoke the link at any time." : "Anyone can find and open a public scene."}
        </p>
        {NL}
        <button className="under-link" data-action="revoke" data-id={s.id} id={`btn-revoke-link-${s.id}`}>Revoke and regenerate link</button>
      </div>
      {NL}
      <div className="toggles">
        {[["comments", "Allow comments"], ["branding", "Show Verse Engine branding"], ["expires", "Link expires in 30 days"]].map(([k, l]) => (
          <label key={k} className="toggle">
            <span>{l}</span>
            <input type="checkbox" data-action="opt" data-id={s.id} data-k={k} defaultChecked={!!s.opts[k]} />
          </label>
        ))}
      </div>
      {NL}
      <div className="row">
        <button className="btn ghost sm" data-action="export" data-id={s.id} id={`btn-export-video-${s.id}`}>Export video</button>
        <button className="btn ghost sm" data-action="embed" data-id={s.id} id={`btn-embed-${s.id}`}>Embed</button>
        <button className="btn ghost sm" data-action="tour" data-id={s.id} id={`btn-live-tour-${s.id}`}>Start live tour</button>
        <button className="btn ghost sm" data-action="phone" data-id={s.id} id={`btn-open-on-phone-${s.id}`}>Open on phone</button>
      </div>
    </>
  );
}

function viewScene(S, id) {
  const s = S.state.scenes.find((x) => x.id === id);
  if (!s) return viewNotFound();
  return (
    <>
      <StudioHead S={S} title={s.title} sub={`${s.source} · ${status(s) === "ready" ? "Ready" : "Processing"}`} scope="scene" action={<button className="btn" data-action="copy-scene" data-id={s.id} id={`btn-scene-copy-link-${s.id}`}>Copy link</button>} />
      <div className="row" style={{ marginBottom: "20px" }}>
        <a className="btn ghost" href="/studio/scenes">← Scenes</a>
        <a className="btn ghost" href={`/studio/analytics/${s.id}`}>Analytics</a>
      </div>
      <div className="split">
        <div>
          {status(s) === "ready" ? (
            <Viewer kind={s.kind} />
          ) : (
            <div className="viewer"><div className="fallback">This scene is still processing. It opens here as soon as it’s ready.</div></div>
          )}
        </div>
        <div className="grid" style={{ display: "grid", gap: "20px" }}>
          <ShareControls s={s} />
        </div>
      </div>
    </>
  );
}

/* ---------- analytics ---------- */
function viewAnalytics(S, id = undefined) {
  const { state } = S;
  if (id) S.anId = id;
  if (!state.scenes.find((x) => x.id === S.anId)) S.anId = state.scenes[0]?.id;
  const s = state.scenes.find((x) => x.id === S.anId);
  if (!s) return (<><StudioHead S={S} title="Analytics" sub="How your scenes are landing." scope="analytics" action="" /><div className="empty">Create a scene to see analytics.</div></>);
  const full = series(s.id + "v", s.views * 3 || 0).map((v) => (s.views ? v : 0)), vals = full.slice(-S.anRange), sum = vals.reduce((a, b) => a + b, 0);
  const ses = Math.round(sum * (s.views ? s.sessions / s.views : 0)), watch = Math.round(sum * (s.views ? s.watch / s.views : 0));
  const dev = [["Phone", 58], ["Desktop", 34], ["Headset", 8]];
  const rows = s.views ? [["Today 10:42", "Phone · Chrome", "Bengaluru", "6m 12s"], ["Today 09:15", "Desktop · Safari", "Mumbai", "11m 40s"], ["Yesterday 21:03", "Phone · Safari", "Pune", "3m 05s"], ["Yesterday 18:27", "Headset · Quest Browser", "San Francisco", "14m 22s"], ["20 Oct 16:50", "Desktop · Edge", "Hyderabad", "7m 48s"]] : [];
  const aq = S.qs.analytics.toLowerCase(), amatch = state.scenes.filter((x) => x.title.toLowerCase().includes(aq)), aopts = amatch.length ? amatch : state.scenes;
  if (!aopts.some((x) => x.id === S.anId)) { S.anId = aopts[0].id; return viewAnalytics(S); }
  const range = S.anRange;
  return (
    <>
      <StudioHead S={S} title="Analytics" sub="How your scenes are landing. Demo scenes use sample figures." scope="analytics" action={<button className="btn" data-action="export-csv" id="btn-export-csv">Export CSV</button>} />
      {NL}
      <div className="toolbar">
        <label className="field" style={{ minWidth: "min(100%,320px)" }}>
          Scene
          <select id="an-scene" defaultValue={S.anId}>
            {aopts.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
        </label>
        {NL}
        <div className="seg" role="group" aria-label="Date range">
          {[7, 30, 90].map((d) => <button key={d} data-action="range" data-v={String(d)} id={`btn-range-${d}d`} aria-pressed={range === d}>{`${d} days`}</button>)}
        </div>
      </div>
      {NL}
      <div className="card paper" style={{ marginBottom: "24px" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="label">{`${s.source} · ${s.privacy}`}</p>
            <p className="mono" style={{ marginTop: "6px" }}>{sceneUrl(s.id)}</p>
            <p className="note">{`Published ${fmtDate(s.date)}`}</p>
          </div>
          <div className="row">
            <button className="btn ghost sm" data-action="copy-scene" data-id={s.id} id={`btn-analytics-copy-link-${s.id}`}>Copy link</button>
            <a className="btn sm" href={`/studio/scene/${s.id}`}>Open</a>
          </div>
        </div>
      </div>
      {NL}
      <div className="stats" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        <div className="stat"><span>{`Views · last ${range} days`}</span><b>{fmt(sum)}</b></div>
        <div className="stat"><span>Unique sessions</span><b>{fmt(ses)}</b></div>
        <div className="stat"><span>Watch time</span><b>{hms(watch)}</b></div>
      </div>
      {NL}
      <div className="split">
        <section className="card">
          <h3 style={{ marginBottom: "16px" }}>Views per day</h3>
          <BarChart values={vals} labelFn={(i) => dayLabel(i, range)} />
        </section>
        <section className="card">
          <h3 style={{ marginBottom: "8px" }}>Where people watched</h3>
          {dev.map(([n, p]) => (
            <div key={n} className="bar-row">
              <span>{n}</span>
              <span className="track"><i style={{ width: `${s.views ? p : 0}%` }} /></span>
              <span>{`${s.views ? p : 0}%`}</span>
            </div>
          ))}
        </section>
      </div>
      {NL}
      <h3 style={{ margin: "32px 0 14px" }}>Recent sessions</h3>
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Device</th><th>City</th><th>Watch time</th></tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No sessions yet. Share the link to start collecting views.</div>
      )}
    </>
  );
}

/* ---------- webhooks ---------- */
function HookBadge({ status: st }) {
  return st === "active" ? <span className="pill ok">● Active</span> : st === "paused" ? <span className="pill">‖ Paused</span> : <span className="pill bad">! Failing</span>;
}
function viewWebhooks(S) {
  const { state } = S;
  const wq = S.qs.webhooks.toLowerCase(), hooks = state.hooks.filter((x) => (x.name + " " + x.url).toLowerCase().includes(wq));
  const h = hooks.find((x) => x.id === S.whSel) || hooks[0];
  if (h) S.whSel = h.id;
  const dl = h ? state.deliveries[h.id] || [] : [];
  const base = [["scene.ready", "Today, 10:40", "✓ 200 OK"], ["scene.viewed", "Today, 10:42", "✓ 200 OK"], ["scene.viewed", "Yesterday, 18:27", "✓ 200 OK"]];
  const rows = [...dl, ...(h && h.status === "failing" ? [["scene.ready", "Yesterday, 11:03", "✕ 503 Service Unavailable"]] : base.filter((r) => h && h.events.includes(r[0])))];
  const head = <StudioHead S={S} title="Webhooks" sub="Get notified when a scene is ready, viewed or fails. Deliveries here are simulated." scope="webhooks" action={<button className="btn" data-action="new-hook" id="btn-new-webhook">+ Create webhook</button>} />;
  if (!h) return (<>{head}<div className="empty">{state.hooks.length ? "No webhooks match your search." : "No webhooks yet. Create one to get started."}</div></>);
  return (
    <>
      {head}
      {NL}
      <div className="wh-layout">
        <div className="wh-list">
          {hooks.map((x) => (
            <button key={x.id} className="wh-item" data-action="sel-hook" data-id={x.id} id={`btn-select-webhook-${x.id}`} aria-pressed={x.id === S.whSel}>
              <span><HookBadge status={x.status} /></span>
              <b>{x.name}</b>
              <small>{x.url}</small>
            </button>
          ))}
        </div>
        {NL}
        <div>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h3>{h.name}</h3>
                <p className="mono" style={{ marginTop: "6px", overflowWrap: "anywhere" }}>{h.url}</p>
              </div>
              <HookBadge status={h.status} />
            </div>
            {NL}
            <p className="label" style={{ margin: "18px 0 8px" }}>Subscribed events</p>
            <div className="pills">{h.events.map((e) => <span key={e} className="pill mono">{e}</span>)}</div>
            {NL}
            <div className="row" style={{ marginTop: "20px" }}>
              <button className="btn ghost sm" data-action="test-hook" data-id={h.id} id={`btn-test-webhook-${h.id}`}>Send test event</button>
              <button className="btn ghost sm" data-action="toggle-hook" data-id={h.id} id={`btn-toggle-webhook-${h.id}`}>{h.status === "paused" ? "Resume" : "Pause"}</button>
              <button className="btn danger sm" data-action="del-hook" data-id={h.id} id={`btn-delete-webhook-${h.id}`}>Delete</button>
            </div>
          </div>
          {NL}
          <div className="metrics">
            <div><span className="label">Views</span><b>4,320</b></div>
            <div><span className="label">Unique sessions</span><b>2,980</b></div>
            <div><span className="label">Watch time</span><b>86h</b></div>
            <div><span className="label">Delivered OK</span><b>{h.status === "failing" ? "41.0%" : "99.6%"}</b></div>
          </div>
          {NL}
          <section className="card">
            <h3 style={{ marginBottom: "16px" }}>Events delivered per day</h3>
            <BarChart values={series(h.id, 120, 30)} labelFn={(i) => dayLabel(i, 30)} />
          </section>
          {NL}
          <h3 style={{ margin: "28px 0 14px" }}>Recent deliveries</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Event</th><th>When</th><th>Result</th></tr></thead>
              <tbody>
                {rows.length ? rows.map((r, i) => <tr key={i}><td className="mono">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>) : <tr><td colSpan={3}>No deliveries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- plug-ins & API ---------- */
export const QUICKSTART = `curl -X POST https://api.verse.example/v1/scenes \\\n  -H "Authorization: Bearer $VERSE_KEY" \\\n  -F "file=@living-room.glb"`;
function viewPlugins(S) {
  const { state } = S;
  const pq = S.qs.plugins.toLowerCase(), plugs = PLUGINS.filter((p) => (p[0] + " " + p[1]).toLowerCase().includes(pq)), keys = state.keys.filter((k) => k.name.toLowerCase().includes(pq));
  return (
    <>
      <StudioHead S={S} title="Plug-ins & API" sub="Publish from your editor, or drive Verse from code. Playground keys are placeholders." scope="plugins" action={<button className="btn" data-action="new-key" id="btn-new-api-key">+ Create key</button>} />
      {NL}
      <h2 style={{ marginBottom: "16px" }}>Plug-ins</h2>
      <div className="plug-grid">
        {plugs.length ? plugs.map((p) => (
          <article key={p[0]} className="card">
            <p className="label">{`Typical publish · ${p[2]}s`}</p>
            <h3>{p[0]}</h3>
            <p className="note">{p[1]}</p>
            <div className="row">
              <a className="btn sm" href={p[3]}>Install guide</a>
              <a className="under-link" href={p[4]}>Docs</a>
            </div>
          </article>
        )) : <div className="empty" style={{ gridColumn: "1/-1" }}>No plug-ins match your search.</div>}
      </div>
      {NL}
      <h2 style={{ margin: "40px 0 16px" }}>API keys</h2>
      {NL}
      <div className="keys">
        {keys.length ? keys.map((k) => (
          <div key={k.id} className="key-row">
            <div>
              <b>{k.name}</b>
              <p className="mono">{k.shown ? k.secret : k.secret.slice(0, 8) + "••••••••••••••••"}</p>
            </div>
            <div className="row">
              <button className="btn ghost sm" data-action="show-key" data-id={k.id} id={`btn-show-key-${k.id}`}>{k.shown ? "Hide" : "Reveal"}</button>
              <button className="btn ghost sm" data-action="copy-key" data-id={k.id} id={`btn-copy-key-${k.id}`}>Copy</button>
              <button className="btn danger sm" data-action="del-key" data-id={k.id} id={`btn-delete-key-${k.id}`}>Revoke</button>
            </div>
          </div>
        )) : <div className="empty">{state.keys.length ? "No keys match your search." : "No keys yet."}</div>}
      </div>
      {NL}
      <h2 style={{ margin: "40px 0 16px" }}>Quickstart</h2>
      <div className="card" style={{ padding: "0" }}><pre className="code">{QUICKSTART}</pre></div>
      <div className="row" style={{ marginTop: "14px" }}>
        <button className="btn ghost sm" data-action="copy-text" data-t={QUICKSTART} id="btn-copy-quickstart">Copy snippet</button>
        <a className="under-link" href="/developers">API &amp; SDK</a>
        <a className="under-link" href="/docs/scenes-api">Scenes API</a>
      </div>
    </>
  );
}

/* ---------- new scene: upload → review → preview & share ---------- */
function Stepper({ n }) {
  return (
    <ol className="stepper" aria-label="Progress">
      {["1 UPLOAD", "2 REVIEW", "3 PREVIEW & SHARE"].map((l, i) => (
        <li key={l} aria-current={i + 1 === n ? "step" : undefined} className={i + 1 < n ? "done" : ""}>{(i + 1 < n ? "✓ " : "") + l}</li>
      ))}
    </ol>
  );
}

function viewNew(S) {
  const { draft } = S, ok = !!draft.file;
  return (
    <>
      <a className="under-link" href="/studio/scenes">← Back to Playground</a>
      <div className="page-head" style={{ marginTop: "12px" }}>
        <div>
          <p className="eyebrow">NEW SCENE</p>
          <h1>Upload</h1>
        </div>
        <span className="st-badge">LOCAL · FILES STAY IN THIS BROWSER</span>
      </div>
      <Stepper n={1} />
      {NL}
      <div className="src-opts">
        <button className="src-opt" data-action="src" data-v="3d" id="btn-source-3d" aria-pressed={draft.type === "3d"}><b>3D file or scan</b><span>Models, point clouds, splats and BIM.</span></button>
        <button className="src-opt" data-action="src" data-v="plan" id="btn-source-plan" aria-pressed={draft.type === "plan"}><b>Floor plan → 3D home</b><span>A PNG, JPG or PDF plan becomes a walkable home.</span></button>
      </div>
      {NL}
      <div className="drop" id="drop">
        <span className="label">{`DROP YOUR ${draft.type === "plan" ? "FLOOR PLAN" : "3D FILE OR SCAN"} HERE`}</span>
        {ok ? (
          <>
            <h3>{draft.file.name}</h3>
            <p className="note">{bytes(draft.file.size) + (draft.sample ? " · sample file" : "")}</p>
          </>
        ) : (
          <p className="note">{`${draft.type === "plan" ? "PNG, JPG or PDF." : "Accepts models, point clouds, splats and BIM."} FBX, OBJ and ZIP files are converted for you.`}</p>
        )}
        {NL}
        <div className="row" style={{ justifyContent: "center" }}>
          <label className="btn ghost" style={{ cursor: "pointer" }}>
            <input id="file" type="file" hidden accept={draft.type === "plan" ? ".png,.jpg,.jpeg,.pdf" : undefined} />
            Choose file
          </label>
          <button className="btn ghost" data-action="sample" id="btn-use-sample">Use a sample file</button>
        </div>
      </div>
      {NL}
      <div className="formats" aria-label="Supported formats">
        {FORMATS.map(([f, c]) => <span key={f} className={c ? "conv" : ""} title={c ? "Converted for you" : undefined}>{f}</span>)}
      </div>
      <p className="note" style={{ marginTop: "8px" }}>Dashed formats are converted for you.</p>
      {NL}
      <div className="step-actions">
        <a className="btn ghost" href="/studio/scenes" data-action="cancel">Cancel</a>
        <a className="btn" href="/studio/new/review" aria-disabled={ok ? undefined : "true"} data-action={ok ? undefined : "need-file"}>Continue</a>
      </div>
    </>
  );
}

const rotate = (o, x, y) => (o === "v" ? `rotate(90 ${x} ${y})` : undefined);
export function PlanSvg({ p }) {
  return (
    <svg className="plan-svg" id="plan" viewBox="12 -18 396 356" role="group" aria-label="Floor plan editor">
      <g transform={`translate(210 160) rotate(${p.rot}) scale(${p.fx} ${p.fy}) translate(-210 -160)`}>
        {ROOMS.map(([n, x, y, w, h], i) => <rect key={"r" + i} className={`roomfill r${i}`} x={x} y={y} width={w} height={h} />)}
        {p.walls.map((s, i) => { const w = WALLS0[i]; return <line key={"w" + i} className={`wall ${s}`} x1={w[0]} y1={w[1]} x2={w[2]} y2={w[3]} />; })}
        {p.doors.map(([x, y, o], i) => (
          <g key={"d" + i} className="door" data-door={i} transform={rotate(o, x, y)}>
            <title>Door. Click to remove.</title>
            <rect x={x - 14} y={y - 5} width="28" height="10" fill="var(--pearl)" />
            <path d={`M${x - 13} ${y - 22}V${y}M${x - 13} ${y - 22}A22 22 0 0 1 ${x + 9} ${y}`} fill="none" stroke="var(--brand-blue)" strokeWidth="2" />
          </g>
        ))}
        {p.wins.map(([x, y, o], i) => (
          <g key={"n" + i} className="win" data-win={i} transform={rotate(o, x, y)}>
            <title>Window. Click to remove.</title>
            <rect x={x - 14} y={y - 4} width="28" height="8" fill="var(--surface)" stroke="var(--brand-blue)" strokeWidth="2" />
            <line x1={x - 14} x2={x + 14} y1={y} y2={y} stroke="var(--brand-blue)" strokeWidth="1" />
          </g>
        ))}
        {ROOMS.map(([n, x, y, w, h]) => { const cx = x + w / 2, cy = y + h * 0.4; return <text key={"t" + n} className="room" x={cx} y={cy} transform={`translate(${cx} ${cy}) scale(${p.fx} ${p.fy}) rotate(${-p.rot}) translate(${-cx} ${-cy})`}>{n}</text>; })}
        {FOCUS.map(([x, y], i) => <circle key={"f" + i} className={`pulse f${i}`} cx={x} cy={y} r="20" />)}
        {WALLS0.map((w, i) => <line key={"h" + i} className="hit" data-wall={i} x1={w[0]} y1={w[1]} x2={w[2]} y2={w[3]} tabIndex={0} role="button" aria-label={`Wall ${i + 1}, ${p.walls[i] === "solid" ? "solid" : p.walls[i] === "gap" ? "open archway" : "removed"}`} />)}
      </g>
    </svg>
  );
}
// Parts of the review page that change in place while editing the plan.
function LivePlan() { const { S, planKey } = useContext(LiveContext); return <PlanSvg key={planKey} p={S.draft.plan} />; }
function LiveCount({ of }) { const { S } = useContext(LiveContext); return String(S.draft.plan[of].length); }
function LiveChecked() { const { S } = useContext(LiveContext); return String(S.draft.plan.checks.filter(Boolean).length); }
function LiveBar() { const { S } = useContext(LiveContext); const n = S.draft.plan.checks.filter(Boolean).length; return <i id="c-bar" style={{ width: (n / 3) * 100 + "%" }} />; }

const TIPS = { select: "Click a wall to remove it or bring it back.", door: "Click a wall to place a door. Click a door to remove it.", win: "Click a wall to place a window. Click a window to remove it.", gap: "Click a wall to turn it into an open archway, and again to close it." };
function viewReview(S, redirect) {
  const { draft } = S;
  if (!draft.file) return redirect("new");
  if (draft.type === "plan") {
    const p = draft.plan || (draft.plan = freshPlan());
    return (
      <>
        <a className="under-link" href="/studio/new">← Back</a>
        <div className="page-head" style={{ marginTop: "8px" }}>
          <div>
            <p className="eyebrow">{`NEW SCENE · ${draft.file.name}`}</p>
            <h1>Review floor plan</h1>
            <p className="sub">Check what we detected, fix anything that’s off, then build your 3D home.</p>
          </div>
        </div>
        <Stepper n={2} />
        {NL4}
        <div className="review">
          <div className="card plan-card">
            <div className="plan-tools">
              <div className="seg" role="group" aria-label="Tool">
                {[["select", "Select"], ["door", "+ Door"], ["win", "+ Window"], ["gap", "Open gap"]].map(([k, l]) => <button key={k} data-action="tool" data-v={k} id={`btn-plan-tool-${k}`} aria-pressed={p.tool === k}>{l}</button>)}
              </div>
              <div className="row" style={{ gap: "6px" }}>
                <button className="btn ghost sm" data-action="rot" id="btn-plan-rotate" aria-label="Rotate 90 degrees">⟳ Rotate</button>
                <button className="btn ghost sm" data-action="flip" data-v="x" id="btn-plan-flip-x" aria-label="Flip horizontal">⇋ Flip H</button>
                <button className="btn ghost sm" data-action="flip" data-v="y" id="btn-plan-flip-y" aria-label="Flip vertical">⇅ Flip V</button>
                <button className="btn ghost sm" data-action="reset-plan" id="btn-plan-reset">Reset</button>
              </div>
            </div>
            {NL4}
            <div className="plan-wrap"><LivePlan /></div>
            {NL4}
            <div className="plan-foot">
              <p className="note" id="plan-tip">{TIPS[p.tool]}</p>
              <p className="legend">
                <span><i className="lg door" />Door</span>
                <span><i className="lg win" />Window</span>
                <span><i className="lg gap" />Open archway</span>
              </p>
            </div>
          </div>
          {NL4}
          <aside className="review-side">
            <div className="card">
              <p className="section-label">WHAT WE FOUND</p>
              <div className="found">
                <div><b id="c-rooms">{String(ROOMS.length)}</b><span>Rooms</span></div>
                <div><b id="c-doors"><LiveCount of="doors" /></b><span>Doors</span></div>
                <div><b id="c-wins"><LiveCount of="wins" /></b><span>Windows</span></div>
              </div>
            </div>
            {NL4}
            <div className="card confirm-card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <p className="section-label" style={{ margin: "0" }}>PLEASE CONFIRM</p>
                <span className="note"><b id="c-n"><LiveChecked /></b>{" of 3"}</span>
              </div>
              <div className="progress" aria-hidden="true"><LiveBar /></div>
              <p className="note" style={{ marginTop: "10px" }}>We weren’t sure about three things. Hover one to see it on the plan.</p>
              <div className="checks">
                {CONFIRMS.map((c, i) => (
                  <label key={i} className="check" data-focus={i}>
                    <input type="checkbox" data-action="confirm" data-i={i} defaultChecked={p.checks[i]} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
            {NL4}
            <div className="review-actions">
              <a className="btn ghost" href="/studio/new" style={{ flex: "0 0 auto" }}>Back</a>
              <a className="btn" href="/studio/new/share" style={{ flex: "1" }}>Build 3D home</a>
            </div>
          </aside>
        </div>
      </>
    );
  }
  const ext = (draft.file.name.split(".").pop() || "").toUpperCase(), heavy = HEAVY.test(draft.file.name);
  return (
    <>
      <a className="under-link" href="/studio/new">← Back</a>
      <div className="page-head" style={{ marginTop: "12px" }}>
        <div>
          <p className="eyebrow">{`NEW SCENE · ${draft.file.name}`}</p>
          <h1>Review file</h1>
        </div>
      </div>
      <Stepper n={2} />
      {NL}
      <div className="split">
        <div className="card">
          <label className="field">
            Scene name
            <input id="scene-name" defaultValue={draft.name || draft.file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")} />
          </label>
          {NL}
          <label className="field" style={{ marginTop: "18px" }}>
            Optimisation
            <select id="quality" defaultValue={draft.quality}>
              <option value="balanced">Balanced (recommended)</option>
              <option value="fast">Fastest to open</option>
              <option value="max">Maximum fidelity</option>
            </select>
          </label>
        </div>
        {NL}
        <div className="card paper">
          <p className="label">What we found</p>
          <dl className="kv" style={{ marginTop: "12px" }}>
            <dt>File</dt><dd>{draft.file.name}</dd>
            <dt>Format</dt><dd>{ext + (/^(fbx|obj|zip)$/i.test(ext) ? " · converted for you" : "")}</dd>
            <dt>Size</dt><dd>{bytes(draft.file.size)}</dd>
            <dt>Processing</dt><dd>{heavy ? "Heavier capture, takes longer" : "Quick"}</dd>
          </dl>
        </div>
      </div>
      {NL}
      <div className="step-actions">
        <a className="btn ghost" href="/studio/new">Back</a>
        <a className="btn" href="/studio/new/share" data-action="to-share">Continue</a>
      </div>
    </>
  );
}

function viewShare(S, redirect) {
  const { draft, state } = S;
  if (!draft.file) return redirect("new");
  if (!draft.tmp) draft.tmp = { id: "sc-" + state.next, title: draft.name || draft.file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") || "Untitled scene", source: draft.type === "plan" ? "Floor plan" : "Upload · " + (draft.file.name.split(".").pop() || "").toUpperCase(), kind: draft.type === "plan" ? "room" : /\.(e57|las|laz|xyz|ply|splat)$/i.test(draft.file.name) ? "scan" : "room", views: 0, sessions: 0, watch: 0, date: new Date().toISOString().slice(0, 10), privacy: "private", opts: { comments: true, branding: true, expires: false }, readyAt: HEAVY.test(draft.file.name) ? now() + 12000 : 0 };
  const s = draft.tmp;
  return (
    <>
      <a className="under-link" href="/studio/new/review">← Back</a>
      <div className="page-head" style={{ marginTop: "12px" }}>
        <div>
          <p className="eyebrow">NEW SCENE · PREVIEW AND SHARE</p>
          <h1>Your scene is ready</h1>
          <p className="sub">It works on every device.</p>
        </div>
      </div>
      <Stepper n={3} />
      {NL}
      <div className="split">
        <div><Viewer kind={s.kind} /></div>
        <div style={{ display: "grid", gap: "20px" }}><ShareControls s={s} /></div>
      </div>
      {NL}
      <div className="step-actions">
        <span className="note">Save to keep it in your Playground scenes.</span>
        <button className="btn" data-action="save-scene" id="btn-save-scene">Save to Playground</button>
      </div>
    </>
  );
}

function viewNotFound() {
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">PLAYGROUND</p>
          <h1>Not found</h1>
          <p className="sub">That page doesn’t exist.</p>
        </div>
      </header>
      <a className="btn" href="/studio/scenes">Back to scenes</a>
    </>
  );
}

/** The view for the current Playground address (below /studio), and which sidebar entry is current. */
export function viewFor(S, page, redirect) {
  const [a, b] = (page || "scenes").split("/");
  if (a === "scenes") return { nav: a, view: viewScenes(S) };
  if (a === "scene") return { nav: "scenes", view: viewScene(S, b) };
  if (a === "analytics") return { nav: a, view: viewAnalytics(S, b) };
  if (a === "webhooks") return { nav: a, view: viewWebhooks(S) };
  if (a === "plugins") return { nav: a, view: viewPlugins(S) };
  if (a === "new") return { nav: "scenes", view: b === "review" ? viewReview(S, redirect) : b === "share" ? viewShare(S, redirect) : viewNew(S) };
  return { nav: a, view: viewNotFound() };
}

/* ---------- dialogs ---------- */
const DialogHead = ({ title }) => (
  <div className="dlg-head">
    <h3>{title}</h3>
    <button className="dlg-x" data-action="close" id={`btn-dialog-close-${slug(title)}`}>Close ×</button>
  </div>
);
const embedSnippet = (s) => `<iframe src="${sceneUrl(s.id)}" width="100%" height="480" allow="xr-spatial-tracking; fullscreen" title="${s.title}"></iframe>`;

export const dialogs = {
  export: (s) => (
    <>
      <DialogHead title="Export video" />
      <label className="field">Resolution<select><option>1080p</option><option>1440p</option><option>4K</option></select></label>
      <label className="field">Camera path<select><option>Orbit</option><option>Walkthrough</option></select></label>
      <p className="note">Video export runs on the Verse service. In the Playground this only queues a placeholder.</p>
      <div className="row"><button className="btn" data-action="queue-export" data-id={s.id} id={`btn-queue-export-${s.id}`}>Queue export</button></div>
    </>
  ),
  embed: (s) => (
    <>
      <DialogHead title="Embed" />
      <p className="label">iframe</p>
      <pre className="code" id="emb">{embedSnippet(s)}</pre>
      <div className="row">
        <button className="btn" data-action="copy-text" data-t={embedSnippet(s)} id="btn-copy-embed-code">Copy snippet</button>
        <a className="under-link" href="/docs/embed-sdk">Embed SDK</a>
      </div>
    </>
  ),
  tour: (s) => (
    <>
      <DialogHead title="Live tour" />
      <p>Share this code so others can join your tour.</p>
      <p className="stat"><b className="mono" style={{ fontSize: "40px" }}>{s.tour}</b></p>
      <p className="note">Live tours run on the Verse service. This code is a Playground placeholder and cannot be joined by others.</p>
      <div className="row"><button className="btn" data-action="copy-text" data-t={s.tour} id="btn-copy-tour-link">Copy code</button></div>
    </>
  ),
  phone: (s) => (
    <>
      <DialogHead title="Open on phone" />
      <p>Send yourself this link, then open it on your phone. Playground scenes live in this browser, so the link only resolves here.</p>
      <div className="linkbox">
        <input readOnly aria-label="Link" defaultValue={sceneUrl(s.id)} />
        <button className="btn sm" data-action="copy-text" data-t={sceneUrl(s.id)} id="btn-copy-phone-link">Copy</button>
      </div>
    </>
  ),
  deleteHook: (id) => (
    <>
      <DialogHead title="Delete webhook?" />
      <p>This removes it from the Playground.</p>
      <div className="row">
        <button className="btn danger" data-action="del-hook-ok" data-id={id} id="btn-delete-webhook-confirm">Delete</button>
        <button className="btn ghost" data-action="close" id="btn-delete-webhook-cancel">Cancel</button>
      </div>
    </>
  ),
  newHook: (onSubmit) => (
    <>
      <DialogHead title="Create webhook" />
      <form id="hook-form" className="dlg" style={{ padding: "0" }} onSubmit={onSubmit}>
        <label className="field">Name<input name="name" required maxLength={40} autoComplete="off" /></label>
        <label className="field">Endpoint URL<input name="url" type="url" required placeholder="https://example.com/hook" /></label>
        <fieldset className="event-pick" style={{ border: "0", padding: "0", margin: "0" }}>
          <legend className="label">Events</legend>
          {EVENTS.map((x, i) => (
            <label key={x} className="check">
              <input type="checkbox" name="ev" value={x} defaultChecked={i < 2} />
              <span className="mono">{x}</span>
            </label>
          ))}
        </fieldset>
        <div className="row">
          <button className="btn" type="submit" id="btn-create-webhook-submit">Create webhook</button>
          <button className="btn ghost" type="button" data-action="close" id="btn-create-webhook-cancel">Cancel</button>
        </div>
      </form>
    </>
  ),
  newKey: (onSubmit) => (
    <>
      <DialogHead title="Create API key" />
      <form id="key-form" className="dlg" style={{ padding: "0" }} onSubmit={onSubmit}>
        <label className="field">Key name<input name="name" required maxLength={40} autoComplete="off" defaultValue="Playground key" /></label>
        <p className="note">Playground keys are random placeholders. They do not authenticate with the production API.</p>
        <div className="row">
          <button className="btn" type="submit" id="btn-create-api-key-submit">Create key</button>
          <button className="btn ghost" type="button" data-action="close" id="btn-create-api-key-cancel">Cancel</button>
        </div>
      </form>
    </>
  ),
  reset: () => (
    <>
      <DialogHead title="Reset Playground?" />
      <p>This clears the scenes, webhooks and keys stored in this browser and restores the demo data.</p>
      <div className="row">
        <button className="btn danger" data-action="reset-ok" id="btn-reset-confirm">Reset</button>
        <button className="btn ghost" data-action="close" id="btn-reset-cancel">Cancel</button>
      </div>
    </>
  ),
};
