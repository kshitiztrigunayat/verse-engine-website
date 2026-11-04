// Samples page (/samples).
export default function Samples() {
  return (
    <>
      <header className="page-hero content-width" id="hdr-page-hero">
        <p className="eyebrow">REAL SCENES · REAL POSSIBILITIES</p>
        <h1>
          Put 3D
          <br />
          <span>to work.</span>
        </h1>
        <p className="hero-description">
          Links and embeds anywhere. Verse for Real Estate, Verse for Commerce, Verse Play for games, and the Verse API, SDK and MCP for developers and AI agents.
        </p>
      </header>
      <section className="samples-grid content-width section-space" id="sec-samples-grid">
        <article className="sample-card" id="art-sample-card">
          <a href="https://verse.ctruh.com/view?vpk=ingest/showflat-2026-0c5cab173679.vpk" aria-label="Walk the apartment" id="lnk-walk-the-apartment">
            <img src="/assets/sample-0.webp" alt="A furnished living room and dining area, rendered live in the browser" width="720" height="450" loading="eager" />
            <div>
              <span className="step-number">01</span>
              <h2>Verse for Real Estate</h2>
              <p>{"Sell homes before they're built. A walkable home on every buyer's phone, from a floor plan, in a minute."}</p>
              <span className="sample-action">Walk the apartment</span>
            </div>
          </a>
        </article>
        <article className="sample-card" id="art-sample-card-2">
          <a href="/docs/guides/publish-from-ifc" aria-label="Open the interior" id="lnk-open-the-interior">
            <img src="/assets/sample-1.webp" alt="A designed reception interior with lounge seating and floor-to-ceiling glazing" width="720" height="450" loading="lazy" />
            <div>
              <span className="step-number">02</span>
              <h2>Architects and interior designers</h2>
              <p>Share the whole design at full detail, straight from your design tool with a Verse plug-in.</p>
              <span className="sample-action">Read the IFC guide</span>
            </div>
          </a>
        </article>
        <article className="sample-card" id="art-sample-card-3">
          <a href="https://verse.ctruh.com/view?vpk=ingest/demo-antique-camera.vpk" aria-label="See a product" id="lnk-see-a-product">
            <img src="/assets/sample-2.webp" alt="An antique bellows camera on a wooden tripod, lit like a product shot" width="720" height="450" loading="lazy" />
            <div>
              <span className="step-number">03</span>
              <h2>Verse for Commerce</h2>
              <p>Products that look exactly as designed, on any store, any phone.</p>
              <span className="sample-action">See a product</span>
            </div>
          </a>
        </article>
        <article className="sample-card" id="art-sample-card-4">
          <a href="/docs/guides/publish-from-unreal" aria-label="Explore a world" id="lnk-explore-a-world">
            <img src="/assets/sample-3.webp" alt="A large game-world street scene with buildings, trees and a market square (Amazon Lumberyard Bistro, CC BY 4.0)" width="720" height="450" loading="lazy" />
            <div>
              <span className="step-number">04</span>
              <h2>Verse Play</h2>
              <p>Your Blender, Unity or Unreal world in a browser tab, not a download. Host web games on a fast, isolated domain.</p>
              <span className="sample-action">Read the Unreal guide</span>
            </div>
          </a>
        </article>
        <article className="sample-card" id="art-sample-card-5">
          <a href="/developers" aria-label="Build with Verse" id="lnk-build-with-verse">
            <img src="/assets/sample-4.webp" alt="A photo-scanned marble bust, streamed at full detail" width="720" height="450" loading="lazy" />
            <div>
              <span className="step-number">05</span>
              <h2>Verse API, SDK and MCP</h2>
              <p>For developers and AI agents. One line of code, or one AI tool call, turns any 3D into a link.</p>
              <span className="sample-action">Build with Verse</span>
            </div>
          </a>
        </article>
      </section>
      <p className="sample-credits content-width">
        {"Sample imagery from Verse by Ctruh. Game-world image: Amazon Lumberyard Bistro, CC BY 4.0. "}
        <a href="/docs/attributions" id="lnk-demo-scene-credits">Demo scene credits</a>
      </p>
    </>
  );
}
