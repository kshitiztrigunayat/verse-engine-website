// Site footer. Privacy and Terms link to verse.ctruh.com, as before. FOOTER_LINKS adds the Resources
// pages and related links to the columns.
import Logo from "./Logo.tsx";
import { FOOTER_LINKS, PRODUCT } from "../pages/resources/data.ts";

const extra = (links) =>
  links.map((l) => (
    <a key={l.id} href={l.href} id={l.id}>
      {l.label}
    </a>
  ));

export default function Footer({ hidden, intro }) {
  return (
    <footer id="site-footer" className="page-footer" hidden={hidden}>
      {intro && (
        <div className="footer-intro">
          <p>
            {"Any 3D world,"}
            <br />
            <strong>{"as a link."}</strong>
          </p>
          <a className="site-button" href="/studio" id="lnk-explore-verse-engine">
            {"Explore Verse Engine"}
            <span aria-hidden="true" />
          </a>
          <span>{"Built in Bengaluru and San Francisco."}</span>
        </div>
      )}
      <div className={"footer-links" + (intro ? "" : " border-t-0! pt-0!")}>
        <div>
          <a
            className="brand"
            href="/"
            aria-label="Verse Engine by Ctruh – Home"
            id="lnk-verse-engine-home"
          >
            <Logo className="h-12" />
          </a>
          <p>{PRODUCT.definition}</p>
          <p>
            {"3D, XR and AI infrastructure"}
            <br />
            {"for the spatial internet."}
          </p>
        </div>
        <nav aria-label="Engine resources" id="nav-engine-resources">
          <h3>{"EXPLORE"}</h3>
          <a href="/" id="lnk-the-engine-3">
            {"The engine"}
          </a>
          <a href="/pricing" id="lnk-pricing-3">
            {"Pricing"}
          </a>
          <a href="/about" id="lnk-about-ctruh">
            {"About Ctruh"}
          </a>
          <a href="/about#verse-engine" id="lnk-about-verse-engine">
            {"About Verse Engine"}
          </a>
          {extra(FOOTER_LINKS.explore)}
        </nav>
        <nav aria-label="Developer resources" id="nav-developer-resources">
          <h3>{"BUILD"}</h3>
          <a href="/developers" id="lnk-api-sdk">
            {"API & SDK"}
          </a>
          <a href="/docs/what-is-verse-engine" id="lnk-documentation-2">
            {"Documentation"}
          </a>
          <a href="/studio#/plugins" id="lnk-get-an-api-key">
            {"Get an API key"}
          </a>
          <a href="/signin" id="lnk-sign-in">
            {"Sign in"}
          </a>
          {extra(FOOTER_LINKS.build)}
        </nav>
        <nav aria-label="Editor plug-ins" id="nav-editor-plug-ins">
          <h3>{"PLUG-INS"}</h3>
          <a href="/plugins/blender" id="lnk-blender-2">
            {"Blender"}
          </a>
          <a href="/plugins/unity" id="lnk-unity-2">
            {"Unity"}
          </a>
          <a href="/plugins/unreal" id="lnk-unreal-engine">
            {"Unreal Engine"}
          </a>
          <a href="/plugins" id="lnk-all-plug-ins-2">
            {"All plug-ins"}
          </a>
        </nav>
        <nav aria-label="Contact Ctruh" id="nav-contact-ctruh">
          <h3>{"CONNECT"}</h3>
          <a href="mailto:hello@ctruh.com" id="lnk-hello-ctruh-com">
            {"hello@ctruh.com"}
          </a>
          <a href="https://www.ctruh.com/" id="lnk-ctruh">
            {"Ctruh"}
          </a>
          <a href="https://www.linkedin.com/company/ctruh/" id="lnk-linkedin">
            {"LinkedIn"}
          </a>
          <a href="/docs/blog/index" id="lnk-blogs-research-events">
            {"Blogs, research & events"}
          </a>
          {extra(FOOTER_LINKS.connect)}
        </nav>
      </div>
      <div className="page-footer-bottom">
        <span>
          {
            "© 2026 CTRUH Technologies Private Limited. Verse Engine by Ctruh is a product of Ctruh."
          }
        </span>
        <a href="https://verse.ctruh.com/privacy" id="lnk-privacy">
          {"Privacy"}
        </a>
        <a href="https://verse.ctruh.com/terms" id="lnk-terms">
          {"Terms"}
        </a>
        <a href="#main" id="lnk-back-to-top">
          {"Back to top ↑"}
        </a>
      </div>
    </footer>
  );
}
