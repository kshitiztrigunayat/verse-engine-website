// "Your screen is too small" notice shown over the Playground and sign-in on small screens (CSS decides
// when). "Email me a link" emails a link to this page. (The link was set by the router before.)
const mailHref = (path) => "mailto:?subject=" + encodeURIComponent("Open the Verse Playground on a laptop") + "&body=" + encodeURIComponent("Open this link on a laptop or desktop: " + location.origin + path);

export default function StudioGate({ path }) {
  return (
    <div className="st-gate" id="st-gate" role="alertdialog" aria-modal="true" aria-labelledby="st-gate-title" aria-describedby="st-gate-text">
      <div className="st-gate-card">
        <svg className="st-gate-icon" viewBox="0 0 120 90" fill="none" stroke="#0066cc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M70 18H18a6 6 0 0 0-6 6v36a6 6 0 0 0 6 6h60a6 6 0 0 0 6-6V44" />
          <path d="M45 66v10M30 78h30" />
          <rect x="62" y="40" width="30" height="44" rx="6" />
          <path d="M77 76h.1" />
          <path d="M104 40c8 0 12-4 12-10s-4-10-12-10H88m0 0 8-7m-8 7 8 7" />
        </svg>
        <p className="st-gate-eyebrow" aria-hidden="true">PLAYGROUND</p>
        <h2 id="st-gate-title">Your screen is too small</h2>
        <p id="st-gate-text">Please access the Playground from a laptop or desktop device.</p>
        <a className="st-gate-btn" id="st-gate-mail" href={mailHref(path)}>
          Email me a link
        </a>
        <a className="st-gate-link" href="/" id="lnk-back-to-the-website">Back to the website</a>
      </div>
    </div>
  );
}
