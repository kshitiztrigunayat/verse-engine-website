// Documentation pages (/docs/...). Same markup as the generated docs pages; the build
// (source/build-spa.mjs, docsMarkup) checks every page against this layout.
// `page` comes from the route payload: { active, article, source, toc }, with `article`
// as a { __html } object made once per route. The chapter nav is ./nav.json.
// Behaviour ported from public/js/pages.js:
//   - typing in either search box filters the chapters and keeps both boxes in sync;
//     typing in the mobile box opens "Browse documentation"
//   - Ctrl/Cmd+K focuses the search box that is visible
//   - the "Copy ⧉" buttons on code blocks in the article
import { useEffect, useRef, useState } from "react";
import nav from "./nav.json";

const MOBILE = 0, DESKTOP = 1;

function DocsSearch({ place, inputRef, onSearch }) {
  return (
    <label className="docs-search" htmlFor={"doc-search-" + place}>
      <span className="sr-only">Search documentation</span>
      <input id={"doc-search-" + place} ref={inputRef} type="search" placeholder="Search documentation" data-doc-search="" autoComplete="off" onInput={onSearch} />
      <kbd aria-hidden="true">⌘ K</kbd>
    </label>
  );
}

function DocsNav({ which, active, query }) {
  let count = 0;
  const groups = nav.map((group) => {
    const items = group.items.map((item) => {
      const hidden = !item.docTitle.includes(query);
      if (!hidden) count++;
      return (
        <a key={item.ids[which]} data-doc-item="" data-doc-title={item.docTitle} href={item.href} aria-current={item.href === active ? "page" : undefined} id={item.ids[which]} hidden={hidden}>
          {item.title}
        </a>
      );
    });
    return (
      <section key={group.ids[which]} id={group.ids[which]} hidden={items.every((a) => a.props.hidden)}>
        <h2>{group.title}</h2>
        {items}
      </section>
    );
  });
  return (
    <div className="docs-nav-content">
      {groups}
      <p className="docs-no-results" hidden={count > 0}>No matching guides.</p>
    </div>
  );
}

async function copyCode(event) {
  const button = event.target.closest("[data-copy-local]");
  if (!button || !event.currentTarget.contains(button)) return;
  try {
    await navigator.clipboard.writeText(button.closest(".doc-code").querySelector("code").textContent);
    button.textContent = "Copied ✓";
  } catch {
    button.textContent = "Select code to copy";
  }
}

export default function DocsPage({ page }) {
  const [query, setQuery] = useState("");
  const inputs = useRef([]);
  const browse = useRef(null);

  function onSearch(event) {
    const input = event.currentTarget;
    inputs.current.forEach((other) => { if (other && other !== input) other.value = input.value; });
    const value = input.value.trim().toLowerCase();
    setQuery(value);
    if (value && input.closest(".docs-mobile")) browse.current.open = true;
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputs.current.find((input) => input && input.offsetParent !== null)?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="documentation" id="sec-documentation">
      <div className="docs-mobile">
        <DocsSearch place="mobile" inputRef={(el) => (inputs.current[MOBILE] = el)} onSearch={onSearch} />
        <details id="dtl-item" ref={browse}>
          <summary id="sum-browse-documentation">Browse documentation <span aria-hidden="true">+</span></summary>
          <nav aria-label="Documentation chapters" id="nav-documentation-chapters">
            <DocsNav which={MOBILE} active={page.active} query={query} />
          </nav>
        </details>
      </div>
      <aside className="docs-sidebar" id="asd-docs-sidebar">
        <DocsSearch place="desktop" inputRef={(el) => (inputs.current[DESKTOP] = el)} onSearch={onSearch} />
        <nav aria-label="Documentation chapters" id="nav-documentation-chapters-2">
          <DocsNav which={DESKTOP} active={page.active} query={query} />
        </nav>
      </aside>
      <div className="doc-body">
        <article className="doc-article" id="art-doc-article" onClick={copyCode} dangerouslySetInnerHTML={page.article} />
        <div className="doc-source">Published documentation from <a href={page.source} id="lnk-verse-by-ctruh">Verse by Ctruh</a></div>
      </div>
      {page.toc.length > 0 && (
        <aside className="docs-toc" id="asd-docs-toc">
          <p>ON THIS PAGE</p>
          {page.toc.map((t) => <a key={t.id} href={t.href} id={t.id}>{t.text}</a>)}
        </aside>
      )}
    </section>
  );
}
