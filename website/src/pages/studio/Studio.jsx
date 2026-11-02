// Playground (/studio): the frame (sidebar, account, gate, dialog, toast). The views inside
// #studio-main are drawn by public/js/studio.js, which the router mounts on this markup.
import StudioGate from "./StudioGate.jsx";

export default function Studio() {
  return (
    <>
      <a className="skip" href="#studio-main" id="lnk-skip-to-content">Skip to content</a>
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
            <a href="#/scenes" data-nav="scenes" id="lnk-scenes">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="11" y="3" width="6" height="6" rx="1" />
                <rect x="3" y="11" width="6" height="6" rx="1" />
                <rect x="11" y="11" width="6" height="6" rx="1" />
              </svg>
              <span>Scenes</span>
            </a>
            <a href="#/analytics" data-nav="analytics" id="lnk-analytics">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17V9M8 17V4M13 17v-6M18 17H2" />
              </svg>
              <span>Analytics</span>
            </a>
            <a href="#/webhooks" data-nav="webhooks" id="lnk-webhooks">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 3v6l4 2M3 10a7 7 0 1 0 2-5" />
              </svg>
              <span>Webhooks</span>
            </a>
            <a href="#/plugins" data-nav="plugins" id="lnk-plug-ins-api">
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
                  <b id="st-name">Guest</b>
                  <small>FREE PLAN · LOCAL</small>
                </div>
              </div>
              <button className="st-reset" data-action="reset-all" id="btn-reset">Reset</button>
            </div>
            <a className="btn ghost sm st-upgrade" href="/pricing" id="lnk-upgrade-plan">Upgrade plan</a>
            <div className="st-account-actions">
              <button type="button" className="st-pillbtn" id="st-signout">Sign out</button>
            </div>
          </div>
        </aside>
        <main id="studio-main" className="st-main" tabIndex="-1" />
      </div>
      <div className="st-toast-spacer" />
      {"\n"}
      <StudioGate path="/studio" />
      {"\n"}
      <dialog className="st-dialog" id="st-dialog" />
      <div className="st-toast" id="st-toast" role="status" aria-live="polite" />
    </>
  );
}
