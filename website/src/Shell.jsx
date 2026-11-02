// The app shell: everything inside <body>, same elements, attributes, ids and
// whitespace as the original index.html, built from components. Route-dependent
// parts (visibility, current nav link, page HTML, announcement) come from `view`,
// which the router sets for each route (see router.js).
import { useRef, useState } from "react";
import SkipLink from "./components/SkipLink.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import MobileMenu, { openMenu } from "./components/MobileMenu.jsx";
import Announcer from "./components/Announcer.jsx";

// Shown when JavaScript is off (also kept in index.html, which is what such visitors get).
const NOSCRIPT = { __html: '<p style="padding:24px;font-family:sans-serif">Verse Engine needs JavaScript to display this site.</p>' };

export default function Shell({ view }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef(null), menuButtonRef = useRef(null);
  return (
    <>
      {"\n"}
      <SkipLink hidden={view.skipHidden} />
      {"\n"}
      <Header view={view} menuOpen={menuOpen} menuButtonRef={menuButtonRef} onOpenMenu={() => openMenu(dialogRef, setMenuOpen)} />
      {"\n"}
      <main id="app-main" tabIndex="-1" className={view.mainClass} hidden={view.mainHidden} dangerouslySetInnerHTML={view.mainHtml} />
      {"\n"}
      <Footer hidden={view.footerHidden} />
      {"\n"}
      <MobileMenu dialogRef={dialogRef} menuButtonRef={menuButtonRef} setMenuOpen={setMenuOpen} />
      {"\n"}
      <div id="app-standalone" className={view.standaloneClass} hidden={view.standaloneHidden} dangerouslySetInnerHTML={view.standaloneHtml} />
      {"\n"}
      <Announcer text={view.announcement} />
      {"\n"}
      <noscript dangerouslySetInnerHTML={NOSCRIPT} />
      {"\n\n\n"}
    </>
  );
}
