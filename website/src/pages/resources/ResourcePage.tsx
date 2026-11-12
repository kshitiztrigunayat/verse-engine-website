// Renders a Resources page (3D commerce, architecture and real estate, AI and 3D infrastructure,
// Lyon demo) from its data in ./data.js. Styled by /css/resources.css in the site's light theme;
// the site's header and footer come from the shell.
import { Fragment, useEffect, useState } from "react";
import { claimOk } from "./utils.ts";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
} // GTM / GA4 (index.html)

const nn = (i) => String(i + 1).padStart(2, "0");
const shown = (items) => items.filter((item) => claimOk(item.claim));
const each = (items, render) =>
  shown(items).map((item, i) => <Fragment key={i}>{render(item, i)}</Fragment>);

/* ───────────── Rich text (see the part helpers in utils.js) ───────────── */

function Part({ p }) {
  if (typeof p === "string") return p;
  if ("claim" in p)
    return <Rich value={claimOk(p.claim) ? p.parts : p.fallback} />;
  if ("link" in p) {
    const { link, href, ...attrs } = p;
    return (
      <a href={href} {...attrs}>
        {link}
      </a>
    );
  }
  if ("strong" in p) return <strong>{p.strong}</strong>;
  if ("code" in p) return <code>{p.code}</code>;
  if ("muted" in p) return <span className="rs-muted">{p.muted}</span>;
  if ("pill" in p)
    return (
      <span className={"rs-pill" + (p.tone ? " rs-pill-" + p.tone : "")}>
        {p.pill}
      </span>
    );
  throw new Error("Unknown rich text part " + JSON.stringify(p));
}
function Rich({ value }) {
  if (value == null) return null;
  return Array.isArray(value) ? (
    value.map((p, i) => <Part key={i} p={p} />)
  ) : (
    <Part p={value} />
  );
}

/* ───────────── Pieces ───────────── */

/** A call-to-action link styled as the site's button (outlined when `outline`). */
const Action = ({ a }) => (
  <a
    className={"site-button" + (a.outline ? " rs-outline" : "")}
    href={a.href}
    data-event="cta_click"
    data-cta={a.event}
  >
    {a.label}
  </a>
);

function Figure({
  src,
  alt,
  caption,
  width = 1600,
  height = 900,
  eager = false,
}) {
  return (
    <figure className="rs-figure">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Click-to-load live 3D scene. Until embedding is confirmed (`embedClaim`), the poster is a link
    that opens the live scene in a new tab. */
function LiveDemo({
  src,
  title,
  poster,
  posterAlt,
  openLabel,
  embedClaim = "demo-iframe",
  note,
  buttonId,
}) {
  const [on, setOn] = useState(false);
  const newTab = {
    href: src,
    target: "_blank",
    rel: "noopener",
    "data-event": "demo_open_new_tab",
    "data-demo": title,
  };
  const posterWith = (label) => (
    <>
      <img
        src={poster}
        alt={posterAlt}
        width="1600"
        height="900"
        loading="lazy"
        decoding="async"
      />
      <span className="rs-demo-play">
        <span aria-hidden="true">▶</span> {label}
      </span>
    </>
  );
  return (
    <div className="rs-demo">
      {!claimOk(embedClaim) ? (
        <a className="rs-demo-poster" {...newTab}>
          {posterWith("Open the live 3D scene")}
        </a>
      ) : on ? (
        <iframe
          src={src}
          title={title}
          allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          className="rs-demo-poster"
          id={buttonId}
          onClick={() => setOn(true)}
          data-event="demo_load"
          data-demo={title}
        >
          {posterWith("Load the live 3D scene here")}
        </button>
      )}
      <div className="rs-demo-bar">
        <span className="rs-small rs-muted">{note}</span>
        <a className="site-button rs-outline rs-sm" {...newTab}>
          {openLabel} ↗
        </a>
      </div>
    </div>
  );
}

function Table({ head, rows, caption }) {
  return (
    <div
      className={"rs-table" + (head.length >= 4 ? " rs-t-wide" : "")}
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown(rows).map((r, i) => (
            <tr key={i}>
              {(r.cells || r).map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    <Rich value={c} />
                  </th>
                ) : (
                  <td key={j}>
                    <Rich value={c} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────── Blocks: the content of a section, from the data files ───────────── */

const BLOCKS = {
  p: (b) => (
    <p className={b.className}>
      <Rich value={b.text} />
    </p>
  ),
  h3: (b) => <h3>{b.text}</h3>,
  list: (b) => (
    <ul className={b.ticks ? "rs-ticks" : undefined}>
      {each(b.items, (it) => (
        <li>
          <Rich value={it.text ?? it} />
        </li>
      ))}
    </ul>
  ),
  answer: (b) => (
    <div className="rs-answer" role="note">
      <p className="rs-answer-q">{b.q}</p>
      <p className="rs-answer-a">
        <Rich value={b.a} />
      </p>
    </div>
  ),
  cards: (b) => (
    <div className={"rs-cards rs-cols-" + (b.cols || 3)}>
      {each(b.items, (c) => (
        <article className="rs-card">
          {c.kicker && <p className="rs-kicker">{c.kicker}</p>}
          <h3>{c.title}</h3>
          <p>
            <Rich value={c.body} />
          </p>
        </article>
      ))}
    </div>
  ),
  card: (b) => (
    <div className="rs-card">
      <h3>{b.title}</h3>
      <p>{b.text}</p>
    </div>
  ),
  steps: (b) => (
    <ol className="rs-steps">
      {b.items.map((s, i) => (
        <li key={i} className="rs-step">
          <span className="rs-step-n " aria-hidden="true">
            {nn(i)}
          </span>
          <div>
            <h3>{s.title}</h3>
            <p>
              <Rich value={s.body} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  ),
  callout: (b) => (
    <div className="rs-callout">
      <h3>{b.title}</h3>
      <Blocks blocks={b.blocks} />
    </div>
  ),
  cols: (b) => (
    <div className="rs-two-col">
      <Blocks blocks={b.cols} />
    </div>
  ),
  group: (b) => (
    <div>
      <Blocks blocks={b.blocks} />
    </div>
  ),
  fragment: (b) => <Blocks blocks={b.blocks} />,
  code: (b) => (
    <pre className="rs-code" aria-label={b.label}>
      <code>{b.text}</code>
    </pre>
  ),
  figure: (b) => <Figure {...b} />,
  table: (b) => <Table {...b} />,
  demo: (b) => <LiveDemo {...b} />,
  video: (b) => (
    <figure className="rs-demo">
      <video
        controls
        muted
        playsInline
        preload="none"
        poster={b.poster}
        width="1920"
        height="1080"
        aria-label={b.label}
      >
        <source src={b.smallSrc} type="video/mp4" media="(max-width: 800px)" />
        <source src={b.src} type="video/mp4" />
      </video>
    </figure>
  ),
  flow: (b) => (
    <ol className="rs-flow" aria-label={b.label}>
      {b.stages.map((s) => (
        <li
          key={s.n}
          className={"rs-flow-stage" + (s.verse ? " is-verse" : "")}
        >
          <span className="rs-flow-n">{s.n}</span>
          <h3>{s.name}</h3>
          <p className="rs-flow-owner">{s.owner}</p>
          <ul>
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  ),
  details: (b) => (
    <details className={b.className}>
      <summary>{b.summary}</summary>
      <ol>
        {b.items.map((it, i) => (
          <li key={i}>
            <Rich value={it} />
          </li>
        ))}
      </ol>
    </details>
  ),
  noscript: (b) => (
    <noscript>
      <p>
        <Rich value={b.text} />
      </p>
    </noscript>
  ),
};
function Blocks({ blocks }) {
  return each(blocks, (b) => {
    if (!BLOCKS[b.type]) throw new Error("Unknown block " + b.type);
    return BLOCKS[b.type](b);
  });
}

/* ───────────── Page parts ───────────── */

function Hero({ h }) {
  const actions = (
    <div
      className={
        "rs-hero-actions" + (h.variant === "center" ? " rs-center" : "")
      }
    >
      {h.actions.map((a) => (
        <Action key={a.event} a={a} />
      ))}
    </div>
  );
  const copy = (
    <>
      <p className="eyebrow">{h.eyebrow}</p>
      <h1 id="hero-h">{h.title}</h1>
      <p className="rs-hero-sub">
        <Rich value={h.sub} />
      </p>
      {actions}
      {h.points && (
        <ul className="rs-hero-points">
          {h.points.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </>
  );
  if (h.variant === "image")
    return (
      <section className="rs-hero rs-hero-image" aria-labelledby="hero-h">
        <img
          className="rs-hero-bg"
          src={h.image.src}
          alt=""
          width={h.image.width}
          height={h.image.height}
          fetchPriority="high"
        />
        <div className="content-width rs-hero-copy">{copy}</div>
      </section>
    );
  return (
    <section className="rs-hero" aria-labelledby="hero-h">
      {h.variant === "center" ? (
        <div className="content-width rs-narrow rs-center">{copy}</div>
      ) : (
        <div className="content-width rs-hero-grid">
          <div>{copy}</div>
          <Figure {...h.figure} eager />
        </div>
      )}
    </section>
  );
}

function Section({ s }) {
  return (
    <section
      id={s.id}
      className={"rs-section" + (s.tone ? " rs-tone-" + s.tone : "")}
      aria-labelledby={s.id + "-h"}
    >
      <div className={"content-width" + (s.narrow ? " rs-narrow" : "")}>
        {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
        <h2 id={s.id + "-h"}>{s.title}</h2>
        {s.intro && <p className="rs-lead mt-3!">{s.intro}</p>}
        <Blocks blocks={s.blocks} />
      </div>
    </section>
  );
}

/** FAQ as native <details>: crawlable and works without JavaScript. */
function FAQ({ items }) {
  return (
    <section id="faq" className="rs-section" aria-labelledby="faq-h">
      <div className="content-width rs-narrow">
        <h2 id="faq-h">Frequently asked questions</h2>
        <div className="rs-faq">
          {shown(items).map((f, i) => (
            <details
              key={i}
              data-event="faq_open"
              data-faq={f.q}
              open={i === 0}
            >
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <div className="rs-faq-a">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ c }) {
  return (
    <section className="rs-cta" id="cta" aria-labelledby="cta-h">
      <div className="content-width rs-cta-inner">
        <div>
          <h2 id="cta-h">{c.title}</h2>
          <p>{c.body}</p>
        </div>
        <div className="rs-cta-actions">
          {c.actions.map((a, i) => (
            <Action key={a.event} a={{ ...a, outline: i > 0 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Analytics (SEO blueprint, Part E) ─────────────
   While a Resources page is shown: a click on an element with data-event, an opened FAQ, and scrolling past 25, 50,
   75 and 90% of the page push to window.dataLayer (GTM / GA4 ready). */
function useAnalytics() {
  useEffect(() => {
    const dataLayer = (window.dataLayer = window.dataLayer || []);
    const push = (event, extra) =>
      dataLayer.push({ event, page_path: location.pathname, ...extra });
    const onClick = (e) => {
      const el = e.target.closest?.("[data-event]");
      if (!el) return;
      // An FAQ (<details>): only when the reader opens it (click or keyboard on its question), not the one open on load.
      if (el.tagName === "DETAILS") {
        if (e.target.closest("summary") && !el.open)
          push(el.dataset.event, { faq_question: el.dataset.faq });
        return;
      }
      const { event, ...rest } = el.dataset;
      push(event, {
        ...rest,
        link_url: el.getAttribute("href") || undefined,
        link_text: el.textContent.trim().slice(0, 80),
      });
    };
    const seen = new Set();
    const onScroll = () => {
      const percent =
        (100 * (scrollY + innerHeight)) / document.documentElement.scrollHeight;
      for (const mark of [25, 50, 75, 90])
        if (percent >= mark && !seen.has(mark)) {
          seen.add(mark);
          push("scroll_depth", { percent: mark });
        }
    };
    document.addEventListener("click", onClick, true);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      removeEventListener("scroll", onScroll);
    };
  }, []);
}

export default function ResourcePage({ page }) {
  useAnalytics();
  return (
    <div className="rs">
      <nav aria-label="Breadcrumb" className="rs-crumbs content-width">
        <ol>
          {page.crumbs.map((c, i) => (
            <li key={i}>
              {i < page.crumbs.length - 1 ? (
                <a href={c.href}>{c.name}</a>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <Hero h={page.hero} />
      {shown(page.sections).map((s) => (
        <Section key={s.id} s={s} />
      ))}
      <FAQ items={page.faq} />
      <CTA c={page.cta} />
    </div>
  );
}
