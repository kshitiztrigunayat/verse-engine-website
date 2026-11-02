# Integrations and release

## Frontend and production responsibilities

| Journey | Current destination or implementation |
| --- | --- |
| Explore Verse Engine / account entry | `https://verse.ctruh.com/app` |
| Existing Studio workflows | `https://verse.ctruh.com/studio` |
| Plan checkout | Production `/pricing?plan=<plan>&period=month` or `period=year` |
| Extra-seat configuration | Production `/pricing?period=<period>#plans`; user confirms seats there before checkout |
| Enterprise callback | `https://verse.ctruh.com/pricing#enterprise` |
| Challenge | `https://verse.ctruh.com/challenge` |
| Plug-in files and checksums | Production `/downloads/` and `/downloads/SHA256SUMS` |
| Real samples | Production `/view?vpk=...` URLs in `production-samples.json` |
| Docs, pricing, Developers and marketing navigation | Client-side routes (single-page app, payloads in `dist/content/`) |

The marketing frontend does not own authentication, billing, upload processing, callback submission, or the Verse engine runtime. Keep these as genuine production handoffs unless a separate integration is implemented. Do not put product service credentials into this static package.

Developer code snippets demonstrate the production `embed.js`, `<verse-viewer>` and `/v1/ingest` API; the marketing website itself does not upload a scene. API compatibility, credentials and deployment-specific behavior remain the product service's responsibility.

## Pricing behavior

The captured USD monthly base prices are Free $0, Starter $29, Pro $99 and Scale $499. Included seats are 1, 1, 3 and 10 respectively. Paid-plan extra seats are $15 per seat/month; annual estimates use ten monthly units. These are the handed-off snapshot, not a promise that production prices never change.

The displayed estimate is `(base + extra seats × seat price) × billing factor`, where the annual factor is 10. Example: annual Pro with five seats is `(99 + 2 × 15) × 10 = $1,290/year`. Taxes and final seats are confirmed on the live service. Pay-as-you-go stays labelled Coming soon. Enterprise, trial discounts, broker packs and allowances must be refreshed from product content together.

The callback form is intentionally on the production site; a public cross-origin callback endpoint was not established for this frontend. There is no local form pretending a request has been sent. Unused generic mailto and feedback handlers remain in `site.js`, but current production templates do not expose them as a backend.

## Samples and demonstrative interactions

- Two actual viewer examples are the furnished showflat and antique-camera product. Other cards open their documented destinations.
- The Architects/interior card currently opens the IFC guide; Verse Play opens the Unreal guide because the supplied source did not provide working matching scene destinations. Their sample-page actions explicitly say Read the guide.
- Documentation search filters article navigation titles, not full article content. Adding full-text search is separate work.
- The landing share control copies an example `https://verse.ctruh.com/s/your-scene` URL. It does not publish a scene or produce a valid visitor-specific link.
- Challenge zoom/pan operates on concept imagery. It does not demonstrate live triangle streaming or engine lighting.
- Plug-in diagrams are workflow illustrations, not captured editor screens. Timing numbers are approved source claims, not measurements taken by this website.
- The billion-triangle and first-picture claims retain supplied source attribution and variable-results notes. No new product performance measurements were made for this handoff.

## Asset and dependency notes

All runtime imagery, fonts and main animation libraries are local. Keep current filenames and paths. Generated architectural concept imagery is disclosed on the website. The samples are supplied production thumbnails; the game-world sample carries Amazon Lumberyard Bistro, CC BY 4.0 credit and links to article attributions.

The retained watch asset under `assets/real-model/` is unused by the current particle renderer. Its model license, credit files and trademark notes are preserved in that directory. Other historical asset/vendor files also remain in the frozen runtime; confirm import/resource reachability before pruning them.

Preserve vendor notices: GSAP/ScrollTrigger 3.13.0 include GreenSock licensing notices; Three.js files identify MIT; Lenis identifies version 1.3.11. Confirm the organization's font usage rights for Degular and Metropolis before moving to a new public distribution; the package contains the site font files, not font purchase agreements. This handoff does not grant a new license to third-party assets or trademarks.

## Hosting and domain changes

Upload `website/dist/` as the static web root and rewrite every extension-less path to `/index.html` (`vercel.json` does this); real files must still be served as files, with JS module MIME types, JSON, font types, SVG and image delivery. Use HTTPS for clipboard and browser capabilities. Unknown routes render the in-app 404 view with HTTP 200 (a soft 404); missing static files return a real 404. Content is rendered by JavaScript, so link previews outside Google/Bing-style crawlers show the generic home meta.

For a new domain, build with `SITE_ORIGIN=https://your-domain npm run build`. It sets the origin used by the shell, route canonicals, Open Graph URLs, `sitemap.xml` and `robots.txt`. Scan the output for the old origin afterwards. Preserve real product-service URLs unless changing product infrastructure too.

The existing design Site's audience is owner-controlled. Publishing this archive on another host is a separate release decision; no credentials or account access are bundled here. The local preview server is not intended for public hosting.

## Release checks

1. Back up the current runtime and content snapshots. Make changes in source templates or the owned runtime modules, not generated article HTML alone.
2. Rebuild from `website/` and run `node tools/verify.mjs`.
3. Start the local server; run `node tools/verify.mjs --http=http://127.0.0.1:4173`.
4. Review Home, Developers, Pricing, Plug-ins, all three install guides, About, Samples, a long API article and an article with a wide table at 320/390/768/1440px.
5. Check all particle stages, visible table legs, device centering, Web/AR/XR transitions, gallery keyboard controls, inspector pan/zoom, navigation, FAQ, and reduced-motion/WebGL fallback.
6. Verify monthly/annual calculations, extra seats and final checkout targets without completing a payment. Check code copying, article search, About tabs and downloads/checksums.
7. Refresh time-sensitive product prices, releases, offers, URLs and claims from the production owner. Confirm About placeholders remain hidden.
8. Confirm production domain metadata, asset credits, font rights and actual link destinations. Perform accessibility and performance review on target devices.
9. Deploy the complete `dist/` tree. Check direct deep links, a missing route, fonts, modules and local JSON on the deployed host. Keep the previous release available for rollback.

Prior visual QA covered the listed widths and interactive journeys; it did not establish a Lighthouse score, hardware/browser coverage matrix, formal accessibility audit or a frame-rate guarantee. The handoff QA report records which checks were rerun for this package.
