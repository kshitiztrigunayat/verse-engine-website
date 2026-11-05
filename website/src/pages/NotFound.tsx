// Page not found (/404, and any unknown address).
export default function NotFound() {
  return (
    <>
      <p className="eyebrow">404 / OUTSIDE THE FRAME</p>
      <h1>
        This scene
        <br />
        has moved on.
      </h1>
      <p>There’s a whole world waiting at the beginning.</p>
      <a className="site-button" href="/" id="lnk-return-to-verse-engine">
        Return to Verse Engine
        <span aria-hidden="true">→</span>
      </a>
    </>
  );
}
