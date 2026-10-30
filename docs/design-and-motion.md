# Design system and interactions

## Visual rules

The current system combines Ctruh typography with the owner's Apple design reference for colors, controls and spacing. Preserve the fonts and page flow. Use rectangular photographic cards, realistic environment imagery, blue primary actions and white or pale surfaces. The hero uses dark text on white. Blue story chapters use white type. Avoid black section backgrounds and decorative gradients or generic illustrations.

| Token | Value | Use |
| --- | --- | --- |
| `--brand-blue` | `#0066cc` | Primary actions, links and blue story chapters |
| `--focus` | `#0071e3` | Keyboard focus |
| `--ink` | `#1d1d1f` | Text on light surfaces |
| `--muted` | `#6e6e73` | Supporting text on shared pages |
| `--paper` | `#f5f5f7` | Parchment section surfaces |
| `--pearl` | `#fafafc` | Soft white surfaces |
| `--hairline` | `#e0e0e0` | Borders and dividers |
| `--gutter` | `clamp(24px, 4.5vw, 80px)` | Shared horizontal page inset |

Degular Medium/Semibold supplies headings and wordmarks; Metropolis Regular/Semibold supplies body text and controls. Font files are local. Shared-page body text is 16px at 1.6 line height. Large headings use fluid `clamp()` values; copy these rules from `site.css` rather than freezing a desktop screenshot size. Shared header height is 84px, with a 106px document scroll-padding offset.

Primary actions have a blue fill, white text, pill radius, approximately 11px × 22px padding and at least 44px targets. Secondary controls use readable blue/ink outlines or lighter surfaces. Press feedback may scale to .95. Body sections generally use an 80px desktop / 48px phone rhythm; individual templates adjust this for editorial layouts.

## Landing story contract

The story uses a single procedural point-cloud scene and one camera. Geometry levels gradually reveal the vessel, table/furniture, interior, building and neighbourhood in shared world coordinates. Surface points are illustrative vertices; the scene is not a production Verse model or a photogrammetry capture.

`app.js` drives raw timeline values 0–7. Values 0–4 move through the first chapters. Values 4–6 hold the experience chapter while the device changes Web 3D → AR → XR. Values 6–7 resolve to the final chapter. Chapter seeking and experience tabs share that timeline; they should not start separate competing animation clocks.

ScrollTrigger pins the stage for roughly eight viewport heights on desktop and 7.4 on phone, with a .7 scrub. Lenis is initialized above 800px. The 3D renderer samples less geometry below 600px and caps pixel ratio at 1.3 on mobile / 1.6 elsewhere. These are implementation values, not measured frame-rate guarantees.

The device outline is sampled at 128 points per source SVG path and interpolated by `device-morph.js`. Browser, phone and headset chrome fade according to the same phase. `model.js` projects the primary building bounds into the usable device region and compensates for SVG letterboxing. If changing SVG shapes, update their corresponding fit regions too.

The pause control stops ambient camera motion; it does not disable user-driven scroll progress. Reduced motion uses a static, sequentially readable layout. WebGL import/initialization failure selects the static story; `fallback.js` also reveals static content after a five-second enhancement timeout. Keep the poster SVG available. When changing the story, test both enhancement success and the static fallback.

## Other interaction contracts

| Area | Behavior to preserve |
| --- | --- |
| Navigation | Fixed header; native mobile dialog; close/Escape and focus restoration; accurate expanded state |
| Possibilities | Five rectangular cards; desktop pinned horizontal travel above 800px; native horizontal scrolling otherwise; previous/next and Arrow/Home/End controls |
| Challenge | Image zoom from 1× to 2.4×; bounded pointer pan after zoom; keyboard arrows, plus/minus and Home; double-click zoom/reset |
| Publishing workflow | Overlapping step cards, approved three-step copy; example link-copy control |
| Plug-in workbench | Blender / Unity / Unreal tabs update benefits, source timing and BOTH illustration sides; keyboard arrows/Home/End; .25s pointer fade, instant keyboard/reduced-motion changes |
| FAQ | Native details/summary; landing keeps one question open at a time |
| Footer | Architectural image, CTA and light directory; restrained image parallax when motion is enabled |
| Pricing | Monthly/annual switch; seat estimates; correct production checkout handoff |
| Developers | Embed / curl / JavaScript tabs; keyboard navigation; copy visible code |
| Documentation | Title-based navigation filter; Ctrl/Cmd K focus; mobile chapter disclosure; TOC links; copy code; local overflow for long tables/code |
| About | Company / engine tabs; matching hash and selected state; unfinished story/team blocks hidden |

## Responsive and accessibility expectations

Previously reviewed widths were 320px, 390px, 768px and 1440px. Use these as regression points and also resize between them. This CSS has component-specific breakpoints rather than one universal mobile cutover. The landing timeline and renderer also make width decisions in JavaScript; reload after crossing breakpoints when testing initial setup. Live cross-breakpoint behavior warrants explicit regression review.

At narrow widths, titles must fit, device content must remain centered, tables/code must scroll within their region, and gallery cards must remain rectangular. Do not hide overflow globally to disguise a layout defect.

Preserve native links/buttons, skip links, visible focus, real labels, tab ARIA relationships, inactive story-panel `inert` state, reduced-motion handling, image alt text and 44px action targets. Validate keyboard-only operation and contrast after edits. Prior manual checks are not an accessibility certification.

## Page transition (`dist/intro.js`)

On every load and refresh, about 780 small dots form a rotating globe that shrinks and resolves into the Verse logo, then fades out to reveal the page. Clicking an internal link plays the globe-to-logo part and then navigates; the next page starts from the finished logo so the two pages read as one animation. It is skipped for `prefers-reduced-motion`, `?motion-off` and `?poster`, and any click or key press skips it. Same-page and hash links, new-tab links, modifier-clicks, external links and file downloads are not intercepted. The head snippet (white cover plus a 4.5 s failsafe) and the script tag are injected into every HTML page by `build-production-pages.mjs`; if `intro.js` fails to load, the page shows normally.
