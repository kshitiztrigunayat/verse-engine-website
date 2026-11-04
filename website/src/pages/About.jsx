// About page (/about): two tabs, "About Ctruh" and "About Verse Engine".
// The URL hash picks the tab (#verse-engine, otherwise Ctruh); choosing a tab updates the
// hash without a new history entry. Arrow keys, Home and End move between the tabs.
// (Was the About part of public/js/pages.js.)
import { useEffect, useRef, useState } from "react";

const TABS = ["ctruh", "verse-engine"];
const fromHash = () => (location.hash === "#verse-engine" ? "verse-engine" : "ctruh");

export default function About() {
  const [tab, setTab] = useState(fromHash);
  const buttons = useRef([]);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function choose(key) {
    setTab(key);
    history.replaceState(history.state, "", location.pathname + (key === "verse-engine" ? "#verse-engine" : "#ctruh"));
  }
  function onKeyDown(event, index) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
    buttons.current[next].click();
    buttons.current[next].focus();
  }
  const tabProps = (key, index) => ({
    ref: (el) => (buttons.current[index] = el),
    "aria-selected": String(tab === key),
    tabIndex: tab === key ? 0 : -1,
    onClick: () => choose(key),
    onKeyDown: (e) => onKeyDown(e, index),
  });

  return (
    <>
      <div className="about-switch content-width" role="tablist" aria-label="About">
        <button id="about-ctruh" role="tab" aria-controls="about-company" data-about-tab="ctruh" {...tabProps(TABS[0], 0)}>About Ctruh</button>
        <button id="about-verse" role="tab" aria-controls="about-engine" data-about-tab="verse-engine" {...tabProps(TABS[1], 1)}>
          About Verse Engine
        </button>
      </div>
      <div id="about-company" role="tabpanel" aria-labelledby="about-ctruh" tabIndex="0" hidden={tab !== "ctruh"}>
        <header className="page-hero content-width" id="hdr-page-hero">
          <p className="eyebrow">ABOUT CTRUH</p>
          <h1>
            About Ctruh and
            <br />
            <span>Verse Engine by Ctruh</span>
          </h1>
          <p className="hero-description tagline">Building the spatial internet.</p>
          <p className="hero-description">
            Ctruh is a deep-tech company building 3D, XR and AI infrastructure for the spatial internet, with teams in Bengaluru and San Francisco. Verse Engine by Ctruh is our browser-native 3D engine: it lets anyone share a 3D world as a link.
          </p>
        </header>
        <figure className="about-panorama" id="fig-about-panorama">
          <img src="/assets/coastal-world.webp" width="1536" height="1024" alt="Photoreal coastal architectural environment" loading="eager" />
          <figcaption>Spatial environment · Concept visualization</figcaption>
        </figure>
        <section className="about-story content-width section-space" id="sec-about-story">
          <div>
            <p className="eyebrow">OUR STORY</p>
            <h2>
              From room-sized rigs
              <br />
              to a link in your pocket.
            </h2>
          </div>
          <p>
            Ctruh is a deep-tech company building 3D, XR and AI infrastructure for the spatial internet, with teams in Bengaluru and San Francisco. Verse Engine by Ctruh is our browser-native 3D engine: it lets anyone share a 3D world as a link.
          </p>
        </section>
        <section className="ctruh-products content-width section-space" id="sec-ctruh-products">
          <h2>How Verse Engine by Ctruh fits with other Ctruh products</h2>
          <ul>
            <li><strong>Ctruh</strong>: the company. Builds 3D, XR and AI infrastructure.</li>
            <li><strong>Verse Engine by Ctruh</strong>: the browser-native 3D engine that prepares, streams and shows 3D scenes as a link.</li>
            <li><strong>VersaAI</strong>: Ctruh&apos;s AI that creates 3D models from photos and video.</li>
            <li><strong>Ctruh Studio</strong>: Ctruh&apos;s no-code builder for immersive experiences.</li>
          </ul>
        </section>
        <section className="company-facts content-width section-space" id="sec-company-facts">
          <article id="art-item">
            <p className="eyebrow">WHERE WE BUILD</p>
            <h3>
              {"Bengaluru &"}
              <br />
              San Francisco
            </h3>
            <p>One team across two time zones, shipping around the clock.</p>
          </article>
          <article id="art-item-2">
            <p className="eyebrow">THE ENGINE</p>
            <h3>
              Patents
              <br />
              pending
            </h3>
            <p>On the streaming engine that powers every Verse Engine link.</p>
          </article>
          <article id="art-item-3">
            <p className="eyebrow">SAY HELLO</p>
            <h3>
              <a href="mailto:hello@ctruh.com" id="lnk-hello-ctruh-com-2">
                hello@
                <br />
                ctruh.com
              </a>
            </h3>
            <p>Partnerships, press and careers.</p>
          </article>
        </section>
      </div>
      <div id="about-engine" role="tabpanel" aria-labelledby="about-verse" tabIndex="0" hidden={tab !== "verse-engine"}>
        <header className="page-hero content-width" id="hdr-page-hero-2">
          <p className="eyebrow">ABOUT VERSE ENGINE</p>
          <h2 className="page-title">
            Our own engine,
            <br />
            <span>built for the browser.</span>
          </h2>
          <p className="hero-description">Verse Engine streams huge 3D scenes to any device, with no app store and no cloud GPU.</p>
          <div className="page-actions">
            <a className="site-button" href="/studio" id="lnk-explore-verse-engine-2">
              Explore Verse Engine
              <span aria-hidden="true" />
            </a>
          </div>
        </header>
        <section className="engine-principles page-band" id="sec-engine-principles">
          <div className="content-width">
            <article id="art-item-4">
              <span className="step-number">01</span>
              <h2>Modern browsers, every screen</h2>
              <p>
                Runs on phones, laptops and headsets, using WebGPU where available and WebGL2 otherwise. <a className="inline-link" href="/docs/browser-support">See browser support</a>
              </p>
            </article>
            <article id="art-item-5">
              <span className="step-number">02</span>
              <h2>Lower streaming cost</h2>
              <p>No rented cloud GPUs — the viewer’s own device does the drawing.</p>
            </article>
            <article id="art-item-6">
              <span className="step-number">03</span>
              <h2>20+ file types</h2>
              <p>Models, scans, splats, point clouds and IFC.</p>
            </article>
            <article id="art-item-7">
              <span className="step-number">04</span>
              <h2>Faithful materials</h2>
              <p>Glass, metal, car paint, fabric and real light.</p>
            </article>
          </div>
        </section>
        <section className="stream-cost content-width section-space" id="sec-stream-cost">
          <header id="hdr-item">
            <p className="eyebrow">STREAMING COST</p>
            <h2>
              Per thousand
              <br />
              viewer-hours.
            </h2>
          </header>
          <div>
            <div className="cost-row">
              <span>Verse Engine</span>
              <strong>About $252</strong>
              <i style={{ "--bar": "4.2%" }} />
            </div>
            <div className="cost-row">
              <span>Cloud GPU streaming</span>
              <strong>$498 – $6,000</strong>
              <i style={{ "--bar": "100%" }} />
            </div>
          </div>
        </section>
        <section className="engine-benchmarks content-width section-space" id="sec-engine-benchmarks">
          <div>
            <strong>1.8B</strong>
            <span>Triangles in one scene</span>
          </div>
          <div>
            <strong>0.9s</strong>
            <span>To first picture</span>
          </div>
          <div>
            <strong>29s</strong>
            <span>Large interior on mobile data</span>
          </div>
          <div>
            <strong>45s</strong>
            <span>Blender project to link</span>
          </div>
          <p className="benchmark-note">Desktop browser benchmarks. Results vary with scene, device and connection.</p>
        </section>
      </div>
    </>
  );
}
