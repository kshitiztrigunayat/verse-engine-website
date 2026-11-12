// Site header: brand, main navigation (current route marked), actions and the menu button.
import Logo from "./Logo.tsx";
import ResourcesNav from "./ResourcesNav.tsx";

export default function Header({ view, menuOpen, menuButtonRef, onOpenMenu }) {
  return (
    <header
      id="site-header"
      className="site-header growth-header"
      hidden={view.headerHidden}
    >
      <a
        id="lnk-brand"
        className="brand"
        href="/"
        aria-label="Verse Engine by Ctruh – Home"
      >
        <Logo className="h-10 md:h-12" />
      </a>
      <nav id="nav-main" className="desktop-nav" aria-label="Main navigation">
        <a
          className="nav-link"
          href="/#story"
          id="lnk-the-engine"
          aria-current={view.navCurrent === "/#story" ? "page" : undefined}
        >
          {"The engine"}
        </a>
        <a
          className="nav-link"
          href="/developers"
          id="lnk-developers"
          aria-current={view.navCurrent === "/developers" ? "page" : undefined}
        >
          {"Developers"}
        </a>
        <a
          className="nav-link"
          href="/pricing"
          id="lnk-pricing"
          aria-current={view.navCurrent === "/pricing" ? "page" : undefined}
        >
          {"Pricing"}
        </a>
        <a
          className="nav-link"
          href="/plugins"
          id="lnk-plug-ins"
          aria-current={view.navCurrent === "/plugins" ? "page" : undefined}
        >
          {"Plug-ins"}
        </a>
        <ResourcesNav current={view.navCurrent} />
        <a
          className="nav-link"
          href="/about"
          id="lnk-about"
          aria-current={view.navCurrent === "/about" ? "page" : undefined}
        >
          {"About"}
        </a>
        <a
          className="nav-link"
          href="/docs/what-is-verse-engine"
          id="lnk-docs"
          aria-current={
            view.navCurrent === "/docs/what-is-verse-engine"
              ? "page"
              : undefined
          }
        >
          {"Docs"}
        </a>
      </nav>
      <div id="hdr-actions" className="header-actions">
        <a
          id="btn-header-challenge"
          className="header-cta header-challenge"
          href="/challenge"
        >
          <span>{"Take the Challenge"}</span>
        </a>
        <a id="btn-header-explore" className="header-cta" href="/studio">
          <span>{"Explore Verse Engine"}</span>
        </a>
        <button
          id="btn-menu-open"
          ref={menuButtonRef}
          className="menu-button"
          aria-label="Open navigation"
          aria-controls="menu-dialog"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <svg
            className="menu-icon"
            viewBox="0 0 24 24"
            width="26"
            height="26"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 7h18M3 12h18M3 17h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
