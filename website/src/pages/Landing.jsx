// Home page (/). Content lives in ./landing/data.ts and is rendered here with .map().
// The scroll story, 3D model and other animations are src/animations/landing/ (GSAP, Three.js), mounted on this markup by the router;
// the sections after the story are wired up by src/animations/landing/sections.js and styled by public/css/landing-sections.css.
import { Fragment } from "react";
import {
  heroAside, realityModes, storyChapters, chapterNav,
  lyonHeading, lyonViews, lyonSquaresLegend, lyonStops,
  proofHeading, proofStats,
  benchHeading, benchEngines, benchMeasures, benchTable,
  raceHeading, raceLanes, raceMatrix,
  workflowCards, shareBadges,
  createHeading, createRoutes,
  galleryCards,
  tryHeading, tryScenes,
  engineHeading, engineLayers, techniques,
  costHeading, costScale,
  plugins, publishingLabels, pluginMeshes,
  devHeading, devTabs, devFeatures,
  pricingHeading, plans, contactUrl,
  faqs,
  footerNav, socials, legalLinks,
} from "./landing/data.ts";

/** "01", "02", … */
const nn = (i) => String(i + 1).padStart(2, "0");

/** Lines joined with <br />. */
const Lines = ({ lines }) => lines.map((line, i) => <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>);

/** Section header used by the mx- sections: number, two-line heading (second line accented), intro and an optional link under it. */
function SectionHead({ heading }) {
  return (
    <header className="mx-head">
      <div>
        <span className="section-number">{heading.number}</span>
        <h2 id={heading.id}>
          {heading.title}
          <br />
          <span>{heading.accent}</span>
        </h2>
      </div>
      <p>
        {heading.text}
        {heading.link && (
          <>
            <br />
            <a className="under-link" href={heading.link.href} id={heading.link.id}>{heading.link.label}</a>
          </>
        )}
      </p>
    </header>
  );
}

/** Tab button attributes: first tab selected. */
const tab = (i) => ({ role: "tab", "aria-selected": String(i === 0) });

// ---------------------------------------------------------------- Story

function StoryChapter({ c }) {
  return (
    <article className={`story-panel ${c.className}`} id={`chapter-${c.chapter}`} data-chapter={c.chapter}>
      <div className="panel-copy">
        <p className="chapter-label">{c.label}</p>
        <h2><Lines lines={c.title} /></h2>
        <p id={c.bodyId}><Lines lines={c.body} /></p>
        {c.stat && (
          <div className="inline-stat">
            <strong>{c.stat.value}</strong>
            <span>{c.stat.label}</span>
          </div>
        )}
        {c.note && (
          <small className="benchmark-note">
            {c.note.text}
            <a href={c.note.link.href} id={c.note.link.id}>{c.note.link.label}</a>
            <br />
            {c.note.after}
          </small>
        )}
        {c.features && (
          <div className="link-features">
            {c.features.map((f) => <span key={f}>{f}</span>)}
          </div>
        )}
        {c.modes && (
          <>
            <div className="reality-tabs" role="tablist" aria-label="Experience types">
              {realityModes.map((m, i) => (
                <button key={m.mode} {...tab(i)} id={`mode-${m.mode}`} aria-controls="mode-description" data-mode={m.mode} tabIndex={i === 0 ? undefined : "-1"}>{m.label}</button>
              ))}
            </div>
            <div id="mode-description" role="tabpanel" aria-labelledby={`mode-${realityModes[0].mode}`}>{realityModes[0].note}</div>
          </>
        )}
        {c.cta && (
          <>
            <a className="button action" href={c.cta.button.href} id={c.cta.button.id}>
              <span>{c.cta.button.label}</span>
            </a>
            <a className="under-link" href={c.cta.link.href} id={c.cta.link.id}>{c.cta.link.label}</a>
          </>
        )}
      </div>
      {c.callout && (
        <div className="detail-callout">
          <span>{c.callout.mark}</span>
          <p>{c.callout.text}</p>
          <small>{c.callout.small}</small>
        </div>
      )}
      {c.meta && (
        <div className="stream-meta">
          <span className="live-dot" />
          {c.meta.text}
          <span className="data-bits">{c.meta.bits}</span>
        </div>
      )}
      {c.workflow && (
        <div className="link-workflow">
          {c.workflow.map((step, i) => (
            <Fragment key={step}>
              {i > 0 && <i>→</i>}
              <span>{step}</span>
            </Fragment>
          ))}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------- How to start: card illustrations

function UploadVisual() {
  return (
    <div className="workflow-visual upload-visual" role="img" aria-label="Supported scene formats">
                <div className="upload-target">
                  <span className="upload-icon">↑</span>
                  <strong>Drag anything 3D here</strong>
                  <p>.glb   .fbx   .usdz   .ifc   floor-plan.pdf</p>
                  <small>20+ TYPES</small>
                </div>
                <div className="upload-file">
                  <span>◇</span>
                  <strong>hsr-office-scan.e57</strong>
                  <small>3.4 GB</small>
                </div>
              </div>
  );
}

function PrepareVisual() {
  return (
    <div className="workflow-visual prepare-visual">
                <div className="prepare-file">
                  <strong>warehouse_twin_final.fbx</strong>
                  <span>RUNS ONCE</span>
                </div>
                <div className="prepare-label">
                  <span>Scene streaming prep</span>
                  <small>processing</small>
                </div>
                <div className="prepare-progress">
                  <i />
                </div>
                <div className="security-sign">
                  <span className="security-icon">✓</span>
                  <div>
                    <strong>Security signing</strong>
                    <p>Signature attached · ready for phones, laptops, headsets</p>
                  </div>
                </div>
                <div className="prepare-ready">
                  <i />
                  Ready to stream
                </div>
              </div>
  );
}

function ShareVisual() {
  return (
    <div className="workflow-visual share-visual">
      <div className="scene-share">
        <span>verse.ctruh.com/s/your-scene</span>
        <button data-copy-scene="" aria-label="Copy link" id="btn-copy-link">
          {"Copy link "}
          <i>⧉</i>
        </button>
      </div>
      <div className="share-badges">
        {shareBadges.map((b) => <span key={b}>{b}</span>)}
      </div>
      <span className="share-feedback" aria-live="polite" />
    </div>
  );
}

const workflowVisuals = { upload: UploadVisual, prepare: PrepareVisual, share: ShareVisual };

// ---------------------------------------------------------------- Footer social icons

const socialIcons = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 9v11M5 4v.5M10 20V9h4v2c1-3 6-3 6 2v7M14 13v7" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// ---------------------------------------------------------------- Page

export default function Landing() {
  const firstMeasure = benchMeasures[0];
  const firstRoute = createRoutes[0];
  const firstScene = tryScenes[0];
  const firstPlugin = plugins[0];
  return (
    <>
      <section className="story" id="story" aria-label="From a 3D model to every reality">
        <div className="story-stage">
          <div className="stage-wash" aria-hidden="true" />
          <div className="stage-grid" aria-hidden="true" />
          <div className="ghost-type" aria-hidden="true">VERSE</div>
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <div className="stage-three" id="stage-three" aria-hidden="true" />
          <div className="scene-scale" id="scene-scale" aria-hidden="true">01 / OBJECT</div>
          <img className="headset-poster" alt="Vertex point-cloud study of an object, table and furnished space" width="1000" height="800" fetchPriority="high" src="/assets/point-world-poster.svg" />
          <div className="geometry-number" aria-hidden="true">
            10.3
            <span>B</span>
          </div>
          <div className="stream-line" aria-hidden="true" />
          <div className="device-frame" data-mode="web" aria-hidden="true">
            <svg className="device-morph" viewBox="0 0 720 420" fill="none">
              <defs>
                <path data-outline="web" d="M80 80C80 62 95 50 115 50H605C625 50 640 62 640 80V340C640 358 625 370 605 370H115C95 370 80 358 80 340Z" />
                <path data-outline="ar" d="M260 40C260 23 274 14 290 14H430C446 14 460 23 460 40V382C460 399 446 408 430 408H290C274 408 260 399 260 382Z" />
                <path data-outline="xr" d="M105 133C119 81 236 76 360 76S601 81 615 133L641 280C650 337 622 374 564 379L460 384C427 385 408 364 394 341C378 314 342 314 326 341C312 364 293 385 260 384L156 379C98 374 70 337 79 280Z" />
              </defs>
              <path className="device-outline" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" d="M80.00,80.00L82.95,67.12L91.51,57.06L103.51,51.44L116.72,50.00L130.05,50.00L143.38,50.00L156.71,50.00L170.04,50.00L183.37,50.00L196.70,50.00L210.04,50.00L223.37,50.00L236.70,50.00L250.03,50.00L263.36,50.00L276.69,50.00L290.03,50.00L303.36,50.00L316.69,50.00L330.02,50.00L343.35,50.00L356.68,50.00L370.02,50.00L383.35,50.00L396.68,50.00L410.01,50.00L423.34,50.00L436.67,50.00L450.01,50.00L463.34,50.00L476.67,50.00L490.00,50.00L503.33,50.00L516.66,50.00L529.99,50.00L543.33,50.00L556.66,50.00L569.99,50.00L583.32,50.00L596.65,50.00L609.98,50.26L622.79,53.70L633.39,61.61L639.29,73.42L640.00,86.70L640.00,100.03L640.00,113.36L640.00,126.69L640.00,140.03L640.00,153.36L640.00,166.69L640.00,180.02L640.00,193.35L640.00,206.68L640.00,220.02L640.00,233.35L640.00,246.68L640.00,260.01L640.00,273.34L640.00,286.67L640.00,300.01L640.00,313.34L640.00,326.67L640.00,340.00L637.05,352.88L628.49,362.94L616.49,368.56L603.28,370.00L589.95,370.00L576.62,370.00L563.29,370.00L549.96,370.00L536.63,370.00L523.30,370.00L509.96,370.00L496.63,370.00L483.30,370.00L469.97,370.00L456.64,370.00L443.31,370.00L429.97,370.00L416.64,370.00L403.31,370.00L389.98,370.00L376.65,370.00L363.32,370.00L349.98,370.00L336.65,370.00L323.32,370.00L309.99,370.00L296.66,370.00L283.33,370.00L269.99,370.00L256.66,370.00L243.33,370.00L230.00,370.00L216.67,370.00L203.34,370.00L190.01,370.00L176.67,370.00L163.34,370.00L150.01,370.00L136.68,370.00L123.35,370.00L110.02,369.74L97.21,366.30L86.61,358.39L80.71,346.58L80.00,333.30L80.00,319.97L80.00,306.64L80.00,293.31L80.00,279.97L80.00,266.64L80.00,253.31L80.00,239.98L80.00,226.65L80.00,213.32L80.00,199.98L80.00,186.65L80.00,173.32L80.00,159.99L80.00,146.66L80.00,133.33L80.00,119.99L80.00,106.66L80.00,93.33Z" />
              <g data-chrome="web">
                <path d="M81 97H639" stroke="currentColor" opacity=".4" />
                <circle cx="111" cy="74" r="3" fill="currentColor" />
                <circle cx="126" cy="74" r="3" fill="currentColor" />
                <circle cx="141" cy="74" r="3" fill="currentColor" />
                <text x="360" y="78" textAnchor="middle" fill="currentColor">verse.ctruh.com / your-scene</text>
              </g>
              <g data-chrome="ar">
                <path d="M331 29H389M337 393H383" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M282 110V89H303M417 89H438V110M282 312V333H303M417 333H438V312" stroke="currentColor" opacity=".45" />
              </g>
              <g data-chrome="xr">
                <path d="M111 151C119 45 227 24 360 24S601 45 609 151" stroke="currentColor" strokeWidth="20" opacity=".24" />
                <path d="M130 151C147 115 246 114 360 114S573 115 590 151L611 268C617 303 599 331 561 335L469 340C430 342 412 297 360 297S290 342 251 340L159 335C121 331 103 303 109 268Z" stroke="currentColor" opacity=".35" />
                <ellipse cx="240" cy="221" rx="86" ry="65" stroke="currentColor" opacity=".15" />
                <ellipse cx="480" cy="221" rx="86" ry="65" stroke="currentColor" opacity=".15" />
              </g>
            </svg>
            <span className="device-status">WEB 3D · BROWSER</span>
          </div>
          <div className="link-capsule" aria-hidden="true">
            <span>
              verse.ctruh.com/s/
              <strong>your-world</strong>
            </span>
            <span className="link-check">✓</span>
          </div>
          <article className="story-panel hero-panel" id="chapter-0" data-chapter="0">
            <div className="panel-copy">
              <h1>
                <span className="hero-kicker">
                  <span />
                  Verse Engine by Ctruh · the streaming layer for 3D
                </span>
                <span className="hero-display">
                  <span>Any 3D.</span>
                  <br />
                  <span>One link.</span>
                </span>
              </h1>
              <p className="hero-description">
                From a product to a whole city. Turn any 3D file, scan, floor plan or Blender, Unity or Unreal project into one link that opens in the browser on phones, laptops and headsets. No app. No download.
              </p>
              <a className="button action" href="/studio" id="lnk-explore-verse-engine-2">
                <span>Try it free</span>
              </a>
              <div className="hero-aside">
                {heroAside.map((t) => <span key={t}>{t}</span>)}
              </div>
            </div>
            <div className="object-annotation">
              <span className="annotation-line" />
              <p>
                One scene.
                <br />
                <strong>Infinite possibilities.</strong>
              </p>
              <small>Product → interior → city</small>
            </div>
            <a className="scroll-invitation" href="#chapter-1" data-jump="1" id="lnk-scroll-to-cross-the-boundary">
              <span className="scroll-track">
                <i />
              </span>
              {"Scroll to cross the boundary "}
              <span>↓</span>
            </a>
          </article>
          {storyChapters.map((c) => <StoryChapter key={c.chapter} c={c} />)}
          <a className="button action story-cta" href="/studio" id="lnk-explore-verse-engine-4">
            <span>Try it free</span>
          </a>
          <div className="story-rail">
            <div className="rail-index">
              <span id="current-chapter">00</span>
              <span>{`/ ${String(chapterNav.length - 1).padStart(2, "0")}`}</span>
            </div>
            <div className="rail-progress">
              <i />
            </div>
            <nav className="chapter-nav" aria-label="Story chapters" id="nav-story-chapters">
              {chapterNav.map((c, i) => (
                <button key={c.id} className={i === 0 ? "selected" : undefined} data-jump={i} aria-label={c.aria} aria-current={i === 0 ? "step" : undefined} id={c.id}>
                  <span>{c.label}</span>
                </button>
              ))}
            </nav>
            <button className="motion-toggle" aria-label="Pause ambient animation" aria-pressed="false" id="btn-pause-ambient-animation">
              <span>Ⅱ</span>
              <small>Pause motion</small>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-lyon" id="lyon" aria-labelledby="lyon-heading">
        <div className="mx-inner">
          <SectionHead heading={lyonHeading} />
          <div className="mx-lyon-stage" data-lyon="">
            <div className="mx-lyon-views">
              {lyonViews.map((v, i) => (
                <img key={v.src} className={i === 0 ? "on" : undefined} src={v.src} alt={v.alt} width={v.width} height={v.height} loading={i === 0 ? undefined : "lazy"} />
              ))}
            </div>
            <div className="mx-lyon-hud">
              <span className="mx-live">
                <i />
                LIVE · CHROME · NO APP
              </span>
              <span className="mx-lyon-url">
                verse.ctruh.com/s/
                <strong>lyon</strong>
              </span>
            </div>
            <div className="mx-lyon-panel">
              <div className="mx-lyon-read">
                <strong data-lyon-fig="">
                  {lyonViews[0].fig}
                  <span>{lyonViews[0].unit}</span>
                </strong>
                <small data-lyon-note="">{lyonViews[0].note}</small>
              </div>
              <div className="mx-lyon-tabs" role="tablist" aria-label="Lyon views">
                {lyonViews.map((v, i) => <button key={v.tab} id={v.id} {...tab(i)} data-view={i}>{v.tab}</button>)}
              </div>
            </div>
          </div>
          <div className="mx-lyon-grid">
            <figure className="mx-squares-card">
              <div className="mx-squares" data-squares="" role="img" aria-label="2,000 squares stand for the 556 GB file; one lit square is what it takes to show the whole city" />
              <figcaption>
                {lyonSquaresLegend.map((l) => (
                  <span key={l.label}>
                    <b className={l.lit ? "lit" : undefined}>{l.label}</b>
                    {l.text}
                  </span>
                ))}
              </figcaption>
            </figure>
            <div className="mx-lyon-copy">
              <span className="section-number">WHY IT OPENS AT ALL</span>
              <h3>
                The file stays put.
                <br />
                <span>The view comes to you.</span>
              </h3>
              <p>
                {"Instead of sending the whole file, Verse streams only the part you are looking at, in the detail your screen can show. Showing all of Lyon takes about "}
                <strong data-count="0.05" data-dec="2">0.05</strong>
                % of the file. The rest streams as you move.
              </p>
              <ul className="mx-stops">
                {lyonStops.map((s) => (
                  <li key={s.label}>
                    <b>{s.label}</b>
                    {s.text}
                  </li>
                ))}
              </ul>
              <p className="mx-claim">We know of no other engine that streams a real, non-repeating scene of this size from a single file.</p>
            </div>
          </div>
          <p className="mx-credit">Stills from a screen recording of the engine running live. City data: Métropole de Lyon, 2023 photomesh, Licence Ouverte 2.0.</p>
        </div>
      </section>

      <section className="mx-proof section-pad" id="proof" aria-labelledby="proof-heading">
        <SectionHead heading={proofHeading} />
        <div className="mx-proof-grid">
          {proofStats.map((s) => (
            <button key={s.label} id={s.id} className="mx-stat" type="button">
              <strong>
                {s.prefix || null}
                <span data-count={s.count} data-dec={s.dec}>{s.count}</span>
                {s.suffix || null}
              </strong>
              <em>{s.label}</em>
              <small>{s.note}</small>
            </button>
          ))}
        </div>
        <p className="mx-credit">
          {"Desktop browser benchmarks unless noted. Results vary with scene, device and connection. "}
          <a className="inline-link" href="/docs/how-we-measure">How we measure ↗</a>
        </p>
      </section>

      <section className="mx-bench section-pad" id="benchmarks" aria-labelledby="bench-heading">
        <SectionHead heading={benchHeading} />
        <div className="mx-bench-board" data-bench="">
          <div className="mx-bench-tabs" role="tablist" aria-label="Benchmark measures">
            {benchMeasures.map((m, i) => <button key={m.tab} id={m.id} {...tab(i)} data-m={i}>{m.tab}</button>)}
          </div>
          <div className="mx-bench-chart">
            <p className="mx-bench-q" data-bench-q="">{firstMeasure.question}</p>
            <div className="mx-bars" data-bars="">
              {benchEngines.map((name, i) => (
                <div key={name} className={i === 0 ? "mx-bar us" : "mx-bar"}>
                  <span className="mx-bar-name">{name}</span>
                  <div className="mx-bar-track">
                    <i />
                  </div>
                  <b>{firstMeasure.rows[i]?.[2]}</b>
                </div>
              ))}
            </div>
            <p className="mx-bench-verdict" data-bench-verdict="">
              <strong>{firstMeasure.verdict.strong}</strong>
              {firstMeasure.verdict.text}
            </p>
          </div>
        </div>
        <details className="mx-bench-table">
          <summary>See the full table</summary>
          <div className="mx-table-box">
            <table>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  {benchEngines.map((name, i) => <th key={name} scope="col" className={i === 0 ? "us" : undefined}>{name}</th>)}
                </tr>
              </thead>
              <tbody>
                {benchTable.map((row) => (
                  <tr key={row.measure}>
                    <th scope="row">{row.measure}</th>
                    {row.cells.map((cell, i) => <td key={i} className={i === 0 ? "us" : i === row.win ? "win" : undefined}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <p className="mx-credit">
          Apple M5 Pro, Chrome, served from a CDN, 4–5 November 2026. CesiumJS 1.146 ran the city's own published 3D Tiles, its strongest setup. Google's tiles are Google's own capture of Lyon. On Windows with an RTX 5060, Verse ran Lyon at about 45–60 fps.
        </p>
      </section>

      <section className="mx-race section-pad" id="old-way" aria-labelledby="race-heading">
        <SectionHead heading={raceHeading} />
        <div className="mx-race-board" data-race="">
          {raceLanes.map((lane) => (
            <div key={lane.className} className={`mx-lane ${lane.className}`}>
              <div className="mx-lane-head">
                <strong>{lane.title}</strong>
                <span {...{ [lane.statusAttr]: "" }}>Waiting to start</span>
              </div>
              <ol>
                {lane.steps.map((s) => (
                  <li key={s.label}>
                    <b>{s.label}</b>
                    <i>{s.cost}</i>
                  </li>
                ))}
              </ol>
              <div className="mx-lane-bar">
                <i />
              </div>
            </div>
          ))}
          <button className="mx-race-replay" type="button" data-race-replay="" id="btn-race-replay">↻ Run it again</button>
        </div>
        <div className="mx-matrix-box">
          <table className="mx-matrix">
            <thead>
              <tr>
                <th scope="col" />
                {raceMatrix.columns.map((c) => <th key={c} scope="col">{c}</th>)}
                <th scope="col" className="us">{raceMatrix.verse}</th>
              </tr>
            </thead>
            <tbody>
              {raceMatrix.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map(([text, mark], i) => <td key={i} className={mark}>{text}</td>)}
                  <td className="us">{row.verse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-section section-pad" id="how-to-start" aria-labelledby="workflow-heading">
        <div className="workflow-intro">
          <span className="section-number">HOW TO START</span>
          <h2 id="workflow-heading">
            Drop. Cook.
            <br />
            <span>SEND IT FLYING.</span>
          </h2>
          <p>THREE MOVES. ZERO INSTALLS. THE WHOLE TRIP TAKES LESS TIME THAN EXPORTING A RENDER.</p>
        </div>
        <div className="workflow-stack">
          {workflowCards.map((card) => {
            const Visual = workflowVisuals[card.visual];
            return (
              <article key={card.id} className="workflow-card" id={card.id}>
                <header id={card.headerId}>
                  <span>{card.n}</span>
                  <h3>{card.title}</h3>
                  <small>{card.sub}</small>
                </header>
                <div className="workflow-content">
                  <p>{card.text}</p>
                  <Visual />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-create section-pad" id="create" aria-labelledby="create-heading">
        <SectionHead heading={createHeading} />
        <div className="mx-create-body" data-create="">
          <div className="mx-create-list" role="tablist" aria-label="Ways to create">
            {createRoutes.map((r, i) => (
              <button key={r.title} id={r.id} {...tab(i)} data-route={i}>
                <span className={`mx-badge ${r.badge.className}`}>{r.badge.label}</span>
                <strong>{r.title}</strong>
                <small>{r.text}</small>
                <i />
              </button>
            ))}
          </div>
          <figure className="mx-create-stage">
            {createRoutes.map(({ image }, i) => (
              <img key={image.src} className={i === 0 ? "on" : undefined} src={image.src} alt={image.alt} width={image.width} height={image.height} loading={i === 0 ? undefined : "lazy"} />
            ))}
            <figcaption>
              <span className="mx-route-in" data-route-in="">{firstRoute.input}</span>
              <span className="mx-route-arrow">→</span>
              <span className="mx-route-out" data-route-out="">{firstRoute.output}</span>
            </figcaption>
            <span className="mx-route-tag" data-route-tag="">{firstRoute.tag}</span>
          </figure>
        </div>
      </section>

      <section className="possibility-gallery" id="possibilities" aria-labelledby="gallery-heading">
        <div className="gallery-stage">
          <header className="gallery-heading" id="hdr-gallery-heading">
            <div>
              <span className="section-number">USE CASES / OPEN POSSIBILITIES</span>
              <h2 id="gallery-heading">
                Made for the people who
                <br />
                {"build "}
                <span>what comes next.</span>
              </h2>
            </div>
            <p>
              The same scene serves a buyer, a client, a shopper,
              <br />
              a player or an AI agent.
            </p>
          </header>
          <div className="gallery-viewport">
            <div className="gallery-track" id="gallery-track">
              {galleryCards.map((card, i) => (
                <a key={card.id} className={card.long ? "possibility-card long-title" : "possibility-card"} href={card.href} data-gallery-index={i} aria-label={card.label} id={card.id} aria-current={i === 0 ? "true" : undefined}>
                  <div className="gallery-picture">
                    <img alt={card.alt} width="720" height="450" loading="lazy" src={card.image} />
                    <span className="gallery-scrim" />
                  </div>
                  <span className="gallery-card-index">{nn(i)}</span>
                  <h3><Lines lines={card.title} /></h3>
                  <div className="gallery-card-bottom">
                    <span>REAL VERSE SAMPLE</span>
                    <strong>{card.label}</strong>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="gallery-controls">
            <span className="gallery-instruction">SCROLL TO EXPLORE</span>
            <div className="gallery-pagination">
              <span id="gallery-current" aria-live="polite">01</span>
              <span>{`/ ${nn(galleryCards.length - 1)}`}</span>
              <div className="gallery-progress">
                <i />
              </div>
            </div>
            <div className="gallery-arrows">
              <button data-gallery-prev="" aria-label="Previous possibility" id="btn-previous-possibility" disabled>←</button>
              <button data-gallery-next="" aria-label="Next possibility" id="btn-next-possibility">→</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-tryit section-pad" id="try-live" aria-labelledby="try-heading">
        <SectionHead heading={tryHeading} />
        <div className="mx-try" data-try="">
          <div className="mx-try-list" role="tablist" aria-label="Live scenes">
            {tryScenes.map((s, i) => (
              <button key={s.scene} id={s.id} {...tab(i)} data-scene={s.scene} data-img={s.image}>
                <span>{nn(i)}</span>
                <strong>{s.title}</strong>
                <small>{s.text}</small>
              </button>
            ))}
          </div>
          <div className="mx-try-stage">
            <img data-try-img="" src={firstScene.image} alt="Preview of the selected live scene" width="720" height="450" />
            <div className="mx-try-card">
              <div className="mx-qr" data-qr="" aria-label="QR code that opens the selected scene on your phone" role="img" />
              <div className="mx-try-copy">
                <strong>Scan to open on your phone</strong>
                <span>No app. No sign-up. The link opens straight into the scene.</span>
                <a className="button action" data-try-open="" href={firstScene.scene} target="_blank" rel="noopener">
                  <span>Open it here ↗</span>
                </a>
              </div>
            </div>
            <span className="mx-try-url" data-try-url="">{firstScene.scene.replace("https://", "")}</span>
          </div>
        </div>
      </section>

      <section className="mx-engine section-pad" id="engine" aria-labelledby="engine-heading">
        <SectionHead heading={engineHeading} />
        <div className="mx-layers" data-layers="">
          {engineLayers.map((l) => (
            <article key={l.label} className="mx-layer">
              <span>{l.label}</span>
              <h3>{l.title}</h3>
              <p>{l.text}</p>
            </article>
          ))}
        </div>
        <div className="mx-tech" data-tech="">
          <div className="mx-tech-list" role="tablist" aria-label="Nine techniques">
            {techniques.map((t, i) => (
              <button key={t.title} id={t.id} {...tab(i)} data-t={i}>
                <span>{nn(i)}</span>
                {t.title}
              </button>
            ))}
          </div>
          <div className="mx-tech-view" role="tabpanel" aria-live="polite">
            <span className="mx-tech-n" data-tech-n="">{nn(0)}</span>
            <h3 data-tech-title="">{techniques[0].title}</h3>
            <p data-tech-copy="">{techniques[0].text}</p>
            <canvas className="mx-tech-canvas" data-tech-canvas="" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-cost section-pad" id="cost" aria-labelledby="cost-heading">
        <SectionHead heading={costHeading} />
        <div className="mx-calc" data-calc="">
          <div className="mx-calc-input">
            <label htmlFor="calc-hours">Viewer-hours a month</label>
            <output data-calc-hours="">10,000</output>
            <input id="calc-hours" type="range" min="0" max="300" step="1" defaultValue="100" data-calc-range="" />
            <div className="mx-calc-scale">
              {costScale.map((s) => <span key={s}>{s}</span>)}
            </div>
            <p>A viewer-hour is one person exploring a scene for an hour. 10,000 is about 2,000 buyers spending five minutes each, every day of the month.</p>
          </div>
          <div className="mx-calc-out">
            <div className="mx-calc-row us">
              <span>Verse Engine</span>
              <div className="mx-calc-track">
                <i data-calc-bar-us="" />
              </div>
              <strong data-calc-us="">≤ $2,520</strong>
            </div>
            <div className="mx-calc-row">
              <span>Cloud GPU streaming</span>
              <div className="mx-calc-track">
                <i data-calc-bar-gpu="" />
              </div>
              <strong data-calc-gpu="">$4,980–$60,000</strong>
            </div>
            <div className="mx-calc-save">
              <small>Cheaper to deliver, at least</small>
              <strong data-calc-save="">$2,460 / month</strong>
            </div>
          </div>
        </div>
        <p className="mx-credit">
          Delivery cost to serve the scene: Verse at most about $252 per thousand viewer-hours; cloud GPU streaming $498–$6,000. Your plan price is separate, and starts free.
        </p>
      </section>

      <section className="challenge-section challenge-editorial" id="challenge" aria-labelledby="challenge-heading">
        <header className="challenge-editorial-head" id="hdr-challenge-editorial-head">
          <div>
            <p className="section-label">THE VERSE ENGINE CHALLENGE IS LIVE</p>
            <h2 id="challenge-heading">
              Bring a scene
              <br />
              <span>
                NO BROWSER
                <br />
                CAN OPEN.
              </span>
            </h2>
          </div>
          <div className="challenge-invitation">
            <p>
              A real 10.3-billion-triangle city already opens from a link. Think yours is bigger? Send your heaviest file. If Verse Engine fails to stream it, you win.
            </p>
            <a className="button action" href="/challenge" id="lnk-take-the-challenge">
              <span>Take the Challenge</span>
            </a>
          </div>
        </header>
        <p className="technical-note">
          Performance figures are desktop browser benchmarks. Results vary with scene, device and connection. The point-cloud story above is an illustrative visualization; Lyon and the use-case samples are real Verse scenes.
        </p>
      </section>

      <section className="tools-section plugin-section section-pad" id="tools" aria-labelledby="publish-heading">
        <header className="plugin-heading" id="hdr-plugin-heading">
          <div>
            <p className="plugin-eyebrow">YOUR TOOLS, UNTOUCHED</p>
            <h2 id="publish-heading">
              Your tools.
              <br />
              <span>A bigger stage.</span>
            </h2>
          </div>
          <div className="plugin-intro">
            <p>No export dance. One button inside the editor you already live in, on Mac and Windows. Substance 3D Painter is in beta.</p>
            <a className="button action" href="/plugins" id="lnk-see-all-plug-ins">
              <span>See all plug-ins</span>
            </a>
          </div>
        </header>
        <div className="plugin-tabs" role="tablist" aria-label="Publishing tools" aria-orientation="horizontal">
          {plugins.map((p, i) => (
            <button key={p.model} id={`publisher-${p.model}`} {...tab(i)} aria-controls="plugin-view" tabIndex={i === 0 ? undefined : "-1"} data-publisher={i}>
              <span className="plugin-order" aria-hidden="true">{nn(i)}</span>
              <span>{p.name}</span>
              <i aria-hidden="true">↓</i>
            </button>
          ))}
        </div>
        <div className="plugin-view" id="plugin-view" role="tabpanel" tabIndex="0" aria-labelledby={`publisher-${firstPlugin.model}`}>
          <div className="plugin-details">
            <div className="plugin-selected">
              <span className="plugin-source-label">{`${firstPlugin.name} → Verse Engine`}</span>
              <h3 id="plugin-name">{firstPlugin.name}</h3>
              <p id="plugin-description">{firstPlugin.description}</p>
            </div>
            <div className="plugin-timing">
              <strong id="plugin-time">
                {firstPlugin.time}
                <span>s</span>
              </strong>
              <div>
                <span id="plugin-timing-label">{firstPlugin.label}</span>
                <small>Desktop browser benchmark</small>
              </div>
            </div>
            <a className="plugin-transfer" href="/plugins" aria-label="See all plug-ins" id="lnk-see-all-plug-ins-2">→</a>
          </div>
          <figure className="plugin-scene plugin-workflow" id="fig-plugin-scene">
            <div className="plugin-publishing" data-plugin-visual="">
              <div className="publishing-heading">
                <span className="workflow-editor">{firstPlugin.name}</span>
                <span className="publishing-arrow" aria-hidden="true">→</span>
                <span>Verse Engine</span>
              </div>
              <svg className="publishing-drawing" viewBox="0 0 760 300" role="img" aria-label={firstPlugin.alt}>
                <defs>
                  {plugins.map(({ model }) => (
                    <g key={model} id={`plugin-mesh-${model}`} fill="none" stroke="currentColor" strokeWidth={pluginMeshes[model].strokeWidth} strokeLinejoin="round">
                      {pluginMeshes[model].paths.map((d, i) => <path key={i} d={d} />)}
                    </g>
                  ))}
                </defs>
                <rect x="24" y="19" width="310" height="250" rx="8" fill="#fff" stroke="#d2d2d7" />
                <path d="M24 49h310M74 49v220" fill="none" stroke="#e0e0e0" />
                <g fill="#d2d2d7">
                  <circle cx="40" cy="34" r="3" />
                  <circle cx="52" cy="34" r="3" />
                  <circle cx="64" cy="34" r="3" />
                  <rect x="38" y="70" width="23" height="3" rx="1.5" />
                  <rect x="38" y="84" width="18" height="3" rx="1.5" />
                  <rect x="38" y="98" width="24" height="3" rx="1.5" />
                </g>
                <path d="M89 213l106-37 122 34-108 39Z M119 225l104-38M151 235l101-39 M124 201l112 35M160 188l111 35" fill="none" stroke="#e0e0e0" />
                <use data-publishing-model="" href="#plugin-mesh-blender" x="84" y="93" color="#6e6e73" />
                <path d="M334 147h96" stroke="#0066cc" strokeWidth="1.5" />
                <path d="m421 141 9 6-9 6" fill="none" stroke="#0066cc" strokeWidth="1.5" />
                <circle cx="381" cy="147" r="17" fill="#0066cc" />
                <path d="M381 155v-16m-5 5 5-5 5 5" fill="none" stroke="#fff" strokeWidth="1.5" />
                <rect x="434" y="49" width="302" height="210" rx="11" fill="#fff" stroke="#c0d6ed" />
                <path d="M434 78h302" stroke="#c0d6ed" />
                <g fill="#0066cc">
                  <circle cx="451" cy="64" r="2.5" />
                  <circle cx="461" cy="64" r="2.5" />
                  <circle cx="471" cy="64" r="2.5" />
                </g>
                <rect x="503" y="58" width="163" height="12" rx="6" fill="#f5f5f7" />
                <use data-publishing-model="" href="#plugin-mesh-blender" x="465" y="110" color="#0066cc" />
              </svg>
              <div className="publishing-labels">
                {publishingLabels.map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
            <figcaption>
              <span id="plugin-scene-label">{firstPlugin.scene}</span>
              <span>Workflow illustration</span>
            </figcaption>
          </figure>
        </div>
        <div className="plugin-upcoming">
          <span>Coming soon</span>
          <p>
            {"Revit, SketchUp, Rhino, 3ds Max, Archicad, Maya, Cinema 4D, Houdini and more. BIM models arrive through IFC today. "}
            <a href="/plugins#aec" id="lnk-explore-beta-plug-ins">Explore beta plug-ins</a>
          </p>
        </div>
      </section>

      <section className="mx-dev section-pad" id="developers" aria-labelledby="dev-heading">
        <SectionHead heading={devHeading} />
        <div className="mx-dev-body" data-dev="">
          <div className="mx-console">
            <div className="mx-console-top">
              <div className="mx-console-tabs" role="tablist" aria-label="Code samples">
                {devTabs.map((t, i) => (
                  <button key={t.code} id={t.id} {...tab(i)} data-code={t.code}>
                    {t.label}
                    {t.badge && <em>{t.badge}</em>}
                  </button>
                ))}
              </div>
              <button className="mx-copy" type="button" data-copy-code="" id="btn-dev-copy-code">Copy</button>
            </div>
            <pre data-pane="embed"><code><span className="c">{"<!-- the whole embed -->"}</span>{"\n"}<span className="k">{"<script"}</span>{" src\x3d"}<span className="s">{"\"https://verse.ctruh.com/embed.js\""}</span>{"\n        data-scene="}<span className="s">{"\"your-scene\""}</span><span className="k">{"></script>"}</span>{"\n\n"}<span className="c">{"<!-- or as a component -->"}</span>{"\n"}<span className="k">{"<verse-viewer"}</span>{" scene="}<span className="s">{"\"your-scene\""}</span><span className="k">{"></verse-viewer>"}</span></code></pre>
            <pre data-pane="rest" hidden><code><span className="c">{"# Upload any 3D file. Get a streamable scene back."}</span>{"\ncurl -X POST https://verse.ctruh.com/v1/ingest \\\n  -H "}<span className="s">{"\"Authorization: Bearer $VERSE_API_KEY\""}</span>{" \\\n  --data-binary @scene.glb\n\n"}<span className="c">{"# → { \"job\": \"…\" }  poll it, or get a webhook when it's live"}</span></code></pre>
            <pre data-pane="mcp" hidden><code><span className="c">{"# Connect the Verse MCP server to your AI assistant, then ask:"}</span>{"\n\n"}<span className="s">{"\"Publish warehouse.fbx to Verse as a private link.\""}</span>{"\n\n"}<span className="c">{"# The assistant uploads the file and hands back"}</span>{"\n"}<span className="c">{"# a published, signed link."}</span></code></pre>
          </div>
          <ul className="mx-dev-list">
            {devFeatures.map((f) => (
              <li key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </li>
            ))}
            <li>
              <a className="under-link" href="/developers">Read the docs →</a>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-pricing section-pad" id="pricing" aria-labelledby="pricing-heading">
        <SectionHead heading={pricingHeading} />
        <div className="mx-plans">
          {plans.map((p) => (
            <article key={p.name} className={p.className ? `mx-plan ${p.className}` : "mx-plan"}>
              <h3>
                {p.badge ? `${p.name} ` : p.name}
                {p.badge && <em>{p.badge}</em>}
              </h3>
              <strong>
                {p.from && <small>{"from "}</small>}
                {p.price}
                {p.monthly && <small>/mo</small>}
              </strong>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
        <div className="mx-pricing-foot">
          <a className="button action" href="/pricing">
            <span>Compare plans</span>
          </a>
          <a className="under-link" href={contactUrl}>Talk to us</a>
        </div>
      </section>

      <section className="faq-section section-pad" id="sec-faq-section">
        <div>
          <span className="section-number">A little clarity</span>
          <h2>
            A few things
            <br />
            before you go.
          </h2>
          <a className="under-link" href="/docs/what-is-verse-engine" id="lnk-read-the-documentation">Read the documentation</a>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                {f.q}
                <span>{i === 0 ? "−" : "+"}</span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="finale" id="footer">
        <section className="footer-cta footer-world" aria-labelledby="footer-heading" id="sec-footer-heading">
          <header id="hdr-item-4">
            <span className="footer-eyebrow">EVERY GREAT WORLD STARTS SOMEWHERE.</span>
            <h2 id="footer-heading">
              What will
              <br />
              you open?
            </h2>
            <div className="footer-cta-actions">
              <a className="button action" href="/studio" id="lnk-explore-verse-engine-5">
                <span>Try it free</span>
              </a>
              <a className="under-link" href="/pricing" id="lnk-see-pricing">See pricing</a>
            </div>
          </header>
          <figure className="footer-landscape footer-film" data-film="" id="fig-verse-film">
            <video muted loop playsInline preload="none" poster="/media/verse-film-poster.webp" width="1920" height="1080" aria-label="Verse Engine launch film (no sound): the 10-billion-triangle city of Lyon, opened in a browser">
              <source src="/media/verse-film-720.mp4" type="video/mp4" media="(max-width: 800px)" />
              <source src="/media/verse-film-1080.mp4" type="video/mp4" />
            </video>
            <button type="button" className="film-toggle" data-film-play="" id="btn-film-play" aria-label="Play the film">
              <span className="film-icon" aria-hidden="true">
                <svg className="film-icon-play" viewBox="0 0 24 24">
                  <path d="M8 5.5v13l11-6.5Z" fill="currentColor" />
                </svg>
                <svg className="film-icon-pause" viewBox="0 0 24 24">
                  <path d="M7 5h3.5v14H7ZM13.5 5H17v14h-3.5Z" fill="currentColor" />
                </svg>
              </span>
            </button>
          </figure>
          <p className="footer-scene-caption">Lyon · 10.3 billion triangles · one link</p>
        </section>
        <div className="footer-directory">
          <div className="footer-identity">
            <a href="#" className="footer-wordmark" aria-label="Verse Engine home" id="lnk-verse-engine-home-2">
              Verse Engine
              <span>BY CTRUH</span>
            </a>
            <a href="https://www.ctruh.com/" className="footer-parent" id="lnk-ctruh-2">Ctruh</a>
          </div>
          {footerNav.map((group) => (
            <nav key={group.id} aria-label={group.label} id={group.id}>
              <h3>{group.title}</h3>
              {group.links.map((l) => <a key={l.label} href={l.href} data-jump={l.jump} id={l.id}>{l.label}</a>)}
              {group.socials && (
                <div className="footer-socials">
                  {socials.map((s) => (
                    <a key={s.network} href={s.href} aria-label={s.label} id={s.id}>
                      {socialIcons[s.network]}
                    </a>
                  ))}
                </div>
              )}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 CTRUH Technologies Private Limited. Verse Engine by Ctruh is a product of Ctruh.</span>
          <div>
            {legalLinks.map((l) => <a key={l.id} href={l.href} id={l.id}>{l.label}</a>)}
          </div>
          <a href="#" className="back-top" id="lnk-back-to-the-beginning">Back to the beginning ↑</a>
        </div>
      </footer>
    </>
  );
}
