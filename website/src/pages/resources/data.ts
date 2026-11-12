// All data for the Resources pages (3D commerce, architecture and real estate, AI and 3D
// infrastructure, Lyon demo), section by section: shared facts and links (and the header's
// Resources menu), the claims register, then each page's content. Rendered by ResourcePage.jsx.
import { href, link, strong, code, muted, pill, claim } from "./utils.ts";

// ── Shared ──
export const SITE = "https://verse.ctruh.com";

/** Organisation facts used in structured data. Same entities as the home page (src/pages/meta.js). */
export const ORG = {
  id: "https://www.ctruh.com/#organization",
  legalName: "CTRUH Technologies Private Limited",
  name: "Ctruh",
  url: "https://www.ctruh.com/",
  logo: `${SITE}/assets/brand/ctruh-logo-512.png`,
  sameAs: [
    "https://www.linkedin.com/company/ctruh/",
    "https://www.youtube.com/@Ctruh",
    "https://www.instagram.com/ctruh.official/",
  ],
  email: "hello@ctruh.com",
};

export const PRODUCT = {
  name: "Verse Engine by Ctruh",
  short: "Verse Engine",
  url: `${SITE}/`,
  // One-sentence definition reused verbatim across pages for answer-engine consistency.
  definition:
    "Verse Engine by Ctruh is a browser-native 3D and XR engine that prepares, streams and renders 3D scenes so they open from a single link in a modern browser, with no app to install.",
};

/** Pages of this site and other links the Resources pages use. */
export const EXISTING = {
  landing: "/",
  signin: "/signin",
  samples: "/samples",
  challenge: "/challenge",
  contact: "https://www.ctruh.com/about/company/contact-us",
  ctruh: "https://www.ctruh.com/",
  // Real Verse sample scenes linked from the landing page.
  demoCamera: `${SITE}/view?vpk=ingest/demo-antique-camera.vpk`,
  demoShowflat: `${SITE}/view?vpk=ingest/demo-showflat-v2.vpk`,
  demoReception: `${SITE}/view?vpk=ingest/demo-reception-v2.vpk`,
  demoBistro: `${SITE}/view?vpk=ingest/demo-bistro-v2.vpk`,
  // Lyon share link as printed on the landing page (claim "lyon-url").
  lyonLive: `${SITE}/s/lyon`,
  // Official VersaAI page not confirmed yet (claim "versaai-url").
  versaai: "https://www.ctruh.com/",
};

/**
 * Routes the pages link to. "page": a Resources page; "live": an existing page of this site;
 * "planned": no page yet, so links go to `fallback`.
 */
export const ROUTES = {
  commerce: { path: "/use-cases/3d-commerce", status: "page" },
  archRe: { path: "/use-cases/architecture-real-estate", status: "page" },
  aiInfra: { path: "/ai-3d-infrastructure", status: "page" },
  lyon: { path: "/demos/lyon", status: "page" },
  developers: { path: "/developers", status: "live" },
  howItWorks: { path: "/how-it-works", status: "planned", fallback: "/#engine" },
  formats: { path: "/supported-formats", status: "planned", fallback: "/#how-to-start" },
  faq: { path: "/faq", status: "planned", fallback: "/#sec-faq-section" },
};

/** Calls to action used on several pages. */
export const ACTIONS = {
  talk: { label: "Talk to Ctruh", href: EXISTING.contact, event: "footer_talk_to_ctruh" },
  tryFree: { label: "Try it free", href: EXISTING.signin, event: "footer_try_free" },
};

/** First breadcrumbs. */
export const CRUMB = {
  home: { name: "Verse Engine", href: EXISTING.landing },
  useCases: { name: "Use cases", href: EXISTING.landing + "#possibilities" },
};

/** The header's "Resources" menu (desktop dropdown and mobile menu group).
    `id` is the desktop link's id, `mobileId` the mobile menu link's. */
export const RESOURCES_MENU = [
  { href: EXISTING.samples, label: "Samples", id: "lnk-samples", mobileId: "lnk-samples-2" },
  { href: ROUTES.commerce.path, label: "3D commerce", id: "lnk-3d-commerce", mobileId: "lnk-3d-commerce-2" },
  { href: ROUTES.archRe.path, label: "Architecture and real estate", id: "lnk-architecture-real-estate", mobileId: "lnk-architecture-real-estate-2" },
  { href: ROUTES.aiInfra.path, label: "AI and 3D infrastructure", id: "lnk-ai-3d-infrastructure", mobileId: "lnk-ai-3d-infrastructure-2" },
  { href: ROUTES.lyon.path, label: "Lyon demo", id: "lnk-lyon-demo", mobileId: "lnk-lyon-demo-2" },
  // SEO blueprint, Part A (header links); planned pages, so these go to their home page section until they exist.
  { href: href("howItWorks"), label: "How Verse Engine works", id: "lnk-how-verse-engine-works-3", mobileId: "lnk-how-verse-engine-works-4" },
  { href: href("formats"), label: "Supported formats", id: "lnk-supported-formats-3", mobileId: "lnk-supported-formats-4" },
  { href: href("faq"), label: "FAQs", id: "lnk-faqs-3", mobileId: "lnk-faqs-4" },
];

/** Links the footers add to their columns (SEO blueprint, Part A): the four pages, plus how it works,
    supported formats and FAQ, which go to their home page section until those pages exist (ROUTES).
    `id` for the site footer, `homeId` for the home page footer. Labels as in the verse-seo-pages footer. */
export const FOOTER_LINKS = {
  explore: [
    { href: href("commerce"), label: "3D commerce", id: "lnk-3d-commerce-3", homeId: "lnk-3d-commerce-4" },
    { href: href("archRe"), label: "Architecture and real estate", id: "lnk-architecture-real-estate-3", homeId: "lnk-architecture-real-estate-4" },
    { href: href("aiInfra"), label: "AI and 3D infrastructure", id: "lnk-ai-3d-infrastructure-3", homeId: "lnk-ai-3d-infrastructure-4" },
    { href: href("lyon"), label: "Lyon 3D city demo", id: "lnk-lyon-3d-city-demo", homeId: "lnk-lyon-3d-city-demo-2" },
    { href: href("howItWorks"), label: "How Verse Engine works", id: "lnk-how-verse-engine-works", homeId: "lnk-how-verse-engine-works-2" },
  ],
  build: [{ href: href("formats"), label: "Supported formats", id: "lnk-supported-formats", homeId: "lnk-supported-formats-2" }],
  connect: [{ href: href("faq"), label: "FAQs", id: "lnk-faqs", homeId: "lnk-faqs-2" }],
};

// ── Claims ──
// Content that still needs confirmation carries its claim id (a `claim` field, or the claim() text
// helper in utils.js). It is shown ONLY when its claim is confirmed: true; until then the page shows
// the claim's fallback (usually nothing), as in the verse-seo-pages production build.
// To approve a claim: set confirmed: true (add `confirmedBy` and `date` if you like) and rebuild.
export const CLAIMS = {
  "ar-tech": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Which AR technology powers 'View in AR' (WebXR, Android Scene Viewer, iOS AR Quick Look)? Which iOS and Android versions are supported? Does Verse generate a USDZ for iOS automatically from any uploaded format?",
    confirmed: false,
  },
  "ar-scale": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Does View in AR place products at true real-world scale by default? Can shoppers resize or is scale locked?",
    confirmed: false,
  },
  "configurator": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Can a Verse Engine scene switch product variants (colour, material, size) for shoppers, or is that a Ctruh Studio capability only?",
    confirmed: false,
  },
  "analytics-detail": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "The site says 'see who opened it'. Which metrics are available per scene (opens, unique viewers, time in scene, device, location)? Can they be exported or sent to Google Analytics?",
    confirmed: false,
  },
  "embed-lazy": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Does embed.js / <verse-viewer> lazy-load (start streaming only when visible or clicked)? What is the script size and does it block page rendering?",
    confirmed: false,
  },
  "cad-formats": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "The site lists 'CAD' among 20+ formats. Which CAD formats exactly (STEP, IGES, DWG, other)? Publish the full list of 20+ formats.",
    confirmed: false,
  },
  "homes-inputs": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Ctruh Homes inputs: which floor-plan formats are accepted (PDF, JPG/PNG, phone photo, DWG)? Are room dimensions taken from the plan, and how accurate is scale? What are the limits (floors, plan complexity)?",
    confirmed: false,
  },
  "homes-pricing": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Is Ctruh Homes included in Verse Engine plans (Free, Starter, Pro, Scale) or priced separately? Is it available in all regions?",
    confirmed: false,
  },
  "capture-access": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Ctruh Capture is in private beta. How do teams request access (form URL or email)?",
    confirmed: false,
  },
  "lyon-url": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "The landing page prints verse.ctruh.com/s/lyon as the Lyon link. Confirm it is the stable public URL, and that it can be embedded in an iframe on /demos/lyon/ (X-Frame-Options / CSP frame-ancestors), and with which allow attributes (fullscreen, xr-spatial-tracking)?",
    confirmed: false,
  },
  "demo-iframe": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Can sample scenes (/view?vpk=…) be embedded in an iframe on verse.ctruh.com pages (X-Frame-Options / CSP frame-ancestors 'self')? Until confirmed, production shows a link that opens the scene in a new tab.",
    confirmed: false,
  },
  "lyon-controls": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Document the exact controls in the Lyon viewer: mouse, trackpad, touch and keyboard (orbit, pan, zoom, walk mode, preset views).",
    confirmed: false,
  },
  "lyon-mobile": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Has Lyon been measured on phones and tablets? If so, which devices, browsers and results. If not, what should mobile visitors expect?",
    confirmed: false,
  },
  "lyon-min-spec": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Minimum requirements for the Lyon demo: browser versions, WebGPU vs WebGL2 path, minimum GPU memory and RAM, bandwidth.",
    confirmed: false,
  },
  "lyon-repeat": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "For each benchmark: number of runs, spread (min/median/max), engine build or version, cache state (cold/warm), network profile, and whether a third party can reproduce it with a published script.",
    confirmed: false,
  },
  "lyon-conversion": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "What was the original Lyon source format (e.g. 3D Tiles, OBJ, other) and how long did conversion into the Verse file format take, on what hardware?",
    confirmed: false,
  },
  "lyon-video": {
    tag: "MARKETING CONFIRMATION REQUIRED", owner: "Marketing",
    question: "Upload the screen-recorded Lyon walkthrough (YouTube or self-hosted MP4), and provide its URL, duration, upload date, thumbnail and transcript.",
    confirmed: true,
  },
  "versaai-inputs": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Ctruh's May 2026 funding announcement describes VersaAI as converting images, text and video into production-ready 3D assets. Confirm which inputs are generally available today, typical generation time, and output formats.",
    confirmed: false,
  },
  "versaai-handoff": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "Is there a direct VersaAI → Verse Engine handoff (one-click publish of a VersaAI asset as a Verse link)? If not, confirm the manual route (export GLB from VersaAI or Ctruh Studio, upload to Verse).",
    confirmed: false,
  },
  "versaai-url": {
    tag: "MARKETING CONFIRMATION REQUIRED", owner: "Marketing",
    question: "Provide the canonical URL of the official VersaAI page. Until then, links point to https://www.ctruh.com/.",
    confirmed: false,
  },
  "tech-stack-public": {
    tag: "ENGINEERING CONFIRMATION REQUIRED", owner: "Engineering",
    question: "The brief lists Rust and WebAssembly in the Verse Engine stack (WebGPU and WebGL2 are on the public site). Confirm Rust and WebAssembly may be stated publicly.",
    confirmed: false,
  },
  "worlds-models": {
    tag: "PRODUCT CONFIRMATION REQUIRED", owner: "Product",
    question: "Ctruh Worlds (coming soon) runs 'on our own open models'. Is that the same model family as VersaAI, or separate? Expected availability date?",
    confirmed: false,
  },
};

// ── 3D commerce page (/use-cases/3d-commerce) ──
const COMMERCE = {
  crumbs: [CRUMB.home, CRUMB.useCases, { name: "3D commerce", href: href("commerce") }],

  hero: {
    eyebrow: "Use case · 3D commerce",
    title: "Interactive 3D Product Experiences for E-commerce",
    sub: "Turn a product's 3D file into one link that shoppers can rotate, zoom and, on a phone, place in their room. Verse Engine by Ctruh streams it in the browser, so there is no app to install, and you can embed it on any product page with one tag.",
    actions: [
      { label: "Discuss your 3D commerce use case", href: "#cta", event: "hero_discuss" },
      { label: "See a product in 3D", href: "#demo", event: "hero_see_demo", outline: true },
    ],
    points: ["No app or plug-in for shoppers", "One-tag embed, plus Shopify, WordPress and more", "View in AR on phones"],
    figure: {
      src: "/assets/sample-2.webp", width: "720", height: "450",
      alt: "Antique bellows camera shown as an interactive 3D product in a browser, a real Verse Engine sample",
      caption: "A real Verse scene: an antique camera, streamed in the browser and viewable in AR on a phone.",
    },
  },

  sections: [
    {
      id: "what", title: "What browser-based 3D product visualization means", narrow: true,
      blocks: [{ type: "answer", q: "In one sentence", a: `Browser-based 3D product visualization lets shoppers rotate, zoom and inspect a true 3D model of a product inside a normal web page, with nothing to install. ${PRODUCT.name} prepares the model once, streams it to the shopper's device and renders it there.` }],
    },
    {
      id: "problem", eyebrow: "The problem", title: "Why product photos and typical 3D viewers fall short",
      intro: "Online shoppers judge size, shape, material and finish from a handful of flat images. Teams that try to fix this with 3D usually hit one of four walls.",
      blocks: [{ type: "cards", cols: 2, items: [
        { title: "Photos are flat", body: "Even a good gallery shows fixed angles. Shoppers cannot turn the product, look underneath or check how a surface catches the light." },
        { title: "Detailed models are heavy", body: "Most web viewers hold the whole model in memory, so teams cut the model down and bake textures until it fits. Detail is lost and the rework takes hours." },
        { title: "A viewer is a build project", body: "A 3D library gives you parts to assemble. Loading, streaming, compression, hosting, sharing and analytics are yours to build and maintain." },
        { title: "Apps and installs lose people", body: "Native AR or 3D apps ask every shopper to install something first. Most shoppers never do, so the experience is never seen." },
      ] }],
    },
    {
      id: "how", eyebrow: "How it works", title: "How browser-based 3D product exploration works with Verse Engine",
      intro: "Three steps take a product from a 3D file to a link a shopper can open. The heavy work happens once, on Ctruh's side, not on every shopper's phone.",
      blocks: [
        { type: "steps", items: [
          { title: "Bring the product's 3D file", body: ["Upload a model in any of 20+ formats, including glTF/GLB, FBX, OBJ and USDZ, or press Publish inside Blender, Unity or Unreal. See ", link("supported formats", href("formats")), "."] },
          { title: "Verse Engine prepares it once", body: "Like a film prepared for streaming, the scene is sliced for every kind of device and signed so viewers know it is genuine. This runs one time, and a failed step recovers on its own." },
          { title: "Share one link or embed it", body: "Paste the link into a message, an ad or a campaign page, or embed it on the product page. When a shopper opens it, their device receives only what it can see, in the detail its screen can show, and draws it locally." },
        ] },
        { type: "callout", title: "Why it opens fast on everyday phones", blocks: [
          { type: "p", text: ["Verse Engine streams only the part of the scene the camera sees, at the detail the screen can show; the rest waits until the shopper moves. Rendering happens on the shopper's own device using WebGPU where available and WebGL2 elsewhere, so no cloud GPU sits behind each viewer. In Ctruh's own tests, about 1 MB arrives before the first pixel and a detailed interior shows its first picture in 0.9 s. ", muted("Desktop browser benchmarks; results vary by scene, device and connection.")] },
        ] },
      ],
    },
    {
      id: "views", eyebrow: "Interactive 3D product views", title: "What shoppers can do in a Verse product view",
      blocks: [{ type: "cards", items: [
        { kicker: "Explore", title: "Orbit, zoom and inspect", body: "Shoppers turn the product, zoom into stitching, joints or textures, and explore without an app or plug-in." },
        { kicker: "Fidelity", title: "Materials that hold up", body: "Faithful material capture keeps surfaces like polished wood and lacquer convincing. Ctruh measured a phone-to-desktop colour gap of ΔE 0.3, below what the eye can see." },
        { kicker: "Detail", title: "Keep the full model", body: "Because Verse streams what is on screen instead of loading the whole file, you do not have to decimate a detailed model to make it fit in the browser." },
        { kicker: "Reality", title: "Web 3D, AR and XR from one link", body: "The same product link opens as Web 3D on a laptop, in AR on a phone and in a headset browser." },
        { kicker: "Trust", title: "Signed scenes", body: "Every scene is signed, so shoppers and partners can trust that the product they see is the one you published." },
        { kicker: "Variants", title: "Colours and materials", claim: "configurator", body: "Switching colour, material or size inside the 3D view." },
      ] }],
    },
    {
      id: "embed", eyebrow: "Embedding", title: "Embed 3D product experiences on your store and product pages",
      intro: "Verse fits into the store you already run. Choose the route that matches your stack.",
      blocks: [
        { type: "cols", cols: [
          { type: "group", blocks: [
            { type: "h3", text: "One tag on any page" },
            { type: "p", text: ["Add the Verse embed script with the scene's ID, or use the ", code("<verse-viewer>"), " component. It works on custom storefronts and headless builds."] },
            { type: "code", label: "Embed code example", text: `<!-- the whole embed -->
<script src="https://verse.ctruh.com/embed.js"
        data-scene="your-scene"></script>

<!-- or as a component -->
<verse-viewer scene="your-scene"></verse-viewer>` },
          ] },
          { type: "group", blocks: [
            { type: "h3", text: "Ready-made platform embeds" },
            { type: "p", text: "Ready-made embeds are available for:" },
            { type: "list", ticks: true, items: ["Shopify", "Webflow", "WordPress", "Wix", "Squarespace"] },
            { type: "h3", text: "Automate your catalogue" },
            { type: "p", text: ["The REST API and SDK handle upload, publishing, private links and analytics, with React and Vue wrappers and signed webhooks that tell your system when a scene is live. The Free plan includes 5,000 API calls a month. See ", link("Verse Engine for developers", href("developers")), "."] },
          ] },
        ] },
        { type: "callout", title: "Placement guidance for product pages", blocks: [
          { type: "list", items: [
            "Place the 3D view as one slide in the product gallery or directly below it, with a still image as the first frame so the page stays fast.",
            "Label it clearly (\"View in 3D\", \"View in your room\") so shoppers know it is interactive.",
            { claim: "embed-lazy", text: "Load the viewer when the shopper taps it or scrolls to it, so it does not delay the rest of the page." },
          ] },
        ] },
      ],
    },
    {
      id: "ar", eyebrow: "Augmented reality", title: "See it in the room: AR workflows", tone: "alt",
      blocks: [{ type: "cols", cols: [
        { type: "group", blocks: [
          { type: "h3", text: "On a phone" },
          { type: "p", text: ["Shoppers tap ", strong("View in AR"), " and the product is placed in the room through the phone's camera. No separate app is needed."] },
          { type: "h3", text: "On a desktop" },
          { type: "p", text: "A QR code opens the same product on the shopper's phone, where they can place it in their space." },
        ] },
        { type: "group", blocks: [
          { type: "h3", text: "Good to know" },
          { type: "p", text: "AR uses the same scene link, so there is nothing extra to publish or host. Shoppers stay in the browser the whole time." },
          { type: "p", claim: "ar-tech", text: "Supported AR technologies and iOS and Android versions: [to be listed by engineering]." },
          { type: "p", claim: "ar-scale", text: "Products are placed at true real-world scale." },
        ] },
      ] }],
    },
    {
      id: "share", eyebrow: "Deployment and sharing", title: "Share a product link anywhere, and stay in control",
      blocks: [{ type: "cards", items: [
        { title: "Share one link", body: "Send it on WhatsApp, drop it into an email or ad, or add it to a pitch deck. It opens straight into the scene." },
        { title: "Embed it", body: "Put the same scene on your product page, a landing page or a partner's site." },
        { title: "Update without breaking links", body: "Change the model after launch and the link stays the same, so every embed and message keeps working." },
        { title: "Private and revocable", body: "Lock a scene to private for pre-launch products, and revoke a link when a campaign ends." },
        { title: "Comments and video", body: "Collect comments from your team and export a video of the scene for social and ads." },
        { title: "See who opened it", body: ["Know when a scene is opened, so you can follow up at the right time.", claim("analytics-detail", " Detailed per-scene metrics and analytics export.")] },
      ] }],
    },
    {
      id: "demo", eyebrow: "Product demonstration", title: "Open a real product scene",
      intro: "This antique camera is a real Verse scene streamed by the engine, not a video. Open it on your phone and try View in AR.",
      blocks: [
        { type: "demo", buttonId: "btn-load-camera-demo", src: EXISTING.demoCamera, title: "Antique camera: Verse Engine product demo", openLabel: "Open the camera in a new tab",
          poster: "/assets/sample-2.webp", posterAlt: "Antique bellows camera, Verse Engine 3D product sample, before loading", note: "Real Verse sample · Works on phones, laptops and headsets." },
        { type: "p", className: "rs-small rs-muted", text: ["More samples: ", link("show flat", EXISTING.demoShowflat), ", ", link("reception interior", EXISTING.demoReception), ", ", link("bistro street", EXISTING.demoBistro), ", or browse ", link("all samples", EXISTING.samples), "."] },
      ],
    },
    {
      id: "industries", eyebrow: "Industry applications", title: "Where interactive 3D helps shoppers decide",
      intro: "These are the product categories where turning, zooming and placing a product in a room answers questions that photos cannot. They describe how teams can use Verse Engine, not customer results.",
      // Team note: add approved Verse Engine commerce case studies here as cards (customer name, product, what they published, permission to name); no uplift or revenue figures without evidence.
      blocks: [{ type: "cards", items: [
        { title: "Furniture and home décor", body: "Check size, proportions and finish, then place a sofa or table in the room with AR before buying." },
        { title: "Consumer electronics", body: "Inspect ports, buttons and finishes from every angle, at the detail of the original model." },
        { title: "Lighting and fixtures", body: "Show form and materials in 3D, and let shoppers see scale on their own wall or ceiling with AR." },
        { title: "Collectibles and luxury goods", body: "Present intricate craftsmanship, like the antique camera sample, without cutting detail." },
        { title: "Appliances and equipment", body: "Let buyers check dimensions and placement in their kitchen, office or site." },
        { title: "Marketplaces and D2C brands", body: "Publish many products through the REST API and SDK, and embed each one on its product page." },
      ] }],
    },
  ],

  // FAQ answers are plain text: they drive both the visible FAQ and the FAQPage structured data.
  faq: [
    { q: "What is browser-based 3D product visualization?",
      a: "Browser-based 3D product visualization lets a shopper rotate, zoom and inspect a 3D model of a product inside a normal web page, without installing an app or plug-in. With Verse Engine by Ctruh, you upload the product's 3D file once and get a link or an embed that opens in any modern browser on phones, laptops and headsets." },
    { q: "Do shoppers need to install an app to see a product in 3D?",
      a: "No. A Verse link opens in a modern browser on Windows, macOS, Linux, Android and iOS. The shopper's own device draws the product, and it only receives the parts of the scene it can see." },
    { q: "How do I add a 3D product view to my product page?",
      a: "Add one script tag or the <verse-viewer> component to the page, or use the ready-made embeds for Shopify, Webflow, WordPress, Wix and Squarespace. Developers can also automate uploads and publishing with the Verse REST API and SDK, which include React and Vue wrappers and signed webhooks." },
    { q: "Can shoppers see the product in their own room?",
      a: "Yes. On a phone, View in AR places the product in the room. On a desktop, a QR code opens the same product on the shopper's phone so they can place it there." },
    { q: "Which 3D file formats can I upload for products?",
      a: "Verse Engine accepts more than 20 formats, including glTF and GLB, FBX, OBJ, USDZ, CAD, scans and splats. Teams that model in Blender, Unity or Unreal can publish with one button from inside the editor." },
    { q: "Will the product look the same on every screen?",
      a: "Ctruh measured a colour difference of ΔE 0.3 between phone and desktop, which is below what the human eye can see. Results vary by scene, device and connection." },
    { q: "Can I update a product model without changing the link?",
      a: "Yes. You can update a scene after sharing it and the link stays the same, so embeds on product pages, ads and messages keep working. Links can also be private or revoked, and every scene is signed." },
    { q: "Can shoppers switch colours or materials in the 3D view?",
      a: "Variant switching is being confirmed with the product team. Contact Ctruh to discuss configurator requirements for your catalogue.", claim: "configurator" },
    { q: "How much does Verse Engine cost for e-commerce?",
      a: "Verse Engine is free to start. Paid plans are Starter at $29, Pro at $99 and Scale at $499 a month, and Enterprise starts at $2,000 a month. Every new account gets a 14-day Pro trial. Shoppers never pay to view a product." },
  ],

  cta: {
    title: "Discuss your 3D commerce use case",
    body: "Tell us about your catalogue, your store platform and the products you want shoppers to explore. Ctruh's team will show you the right route, from a single embed to an automated catalogue pipeline.",
    actions: [ACTIONS.talk, ACTIONS.tryFree],
  },
};

// ── Architecture and real estate page (/use-cases/architecture-real-estate) ──
const showFlat = "/assets/sample-0.webp";

const ARCH_RE = {
  crumbs: [CRUMB.home, CRUMB.useCases, { name: "Architecture and real estate", href: href("archRe") }],

  hero: {
    eyebrow: "Use case · Architecture and real estate",
    title: "Explore Architectural and Real Estate Spaces in 3D",
    sub: "Share a walkable apartment, a BIM model, a laser scan or a whole township as one link. Buyers and clients open it in their browser, on a phone or laptop, with no app. Built on Verse Engine by Ctruh.",
    actions: [
      { label: "Talk to us about your project", href: "#cta", event: "hero_talk" },
      { label: "Walk a show flat", href: "#demo", event: "hero_walk_flat", outline: true },
    ],
    points: ["Floor plan to furnished 3D home in about a minute", "BIM through IFC, scans and splats", "From one room to a whole city"],
    figure: {
      src: showFlat, width: "720", height: "450",
      alt: "Furnished living and dining room of a show flat, explorable in 3D in the browser, a real Verse Engine sample",
      caption: "A real Verse scene: a furnished show flat generated from a floor plan.",
    },
  },

  sections: [
    {
      id: "what", title: "Exploring spaces through a browser link", narrow: true,
      blocks: [{ type: "answer", q: "How it works, in brief", a: `With ${PRODUCT.name}, an architectural model, a scan or a floor plan becomes a link. Anyone who opens it can walk through the space in a modern browser, while the engine streams only the part of the building they are looking at and their own device renders it.` }],
    },
    {
      id: "challenges", eyebrow: "The challenge", title: "Why sharing architectural 3D is still hard",
      intro: "Architects, developers and sales teams already have rich 3D models. Getting them in front of a client or buyer is where things break.",
      blocks: [{ type: "cards", cols: 2, items: [
        { title: "Models are too heavy to send", body: "BIM models, scans and detailed interiors run to gigabytes. Most web viewers hold the whole model in memory, so teams cut the model down and lose the detail that sells the space." },
        { title: "Renders and videos are fixed", body: "Still renders and fly-through videos show only the angles someone chose. A buyer cannot walk to the balcony or check the view from the second bedroom." },
        { title: "Clients will not install software", body: "Desktop viewers and native apps ask every buyer, investor or council officer to install something first. Most will not." },
        { title: "Streaming servers cost per viewer", body: "Cloud streaming runs a GPU server for every person watching, billed by the minute, which gets expensive at the scale of a launch campaign." },
      ] }],
    },
    {
      id: "archviz", eyebrow: "Architectural visualization", title: "Present designs in 3D, from the tools you already use",
      blocks: [{ type: "cols", cols: [
        { type: "group", blocks: [
          { type: "p", text: "Publish a design straight from the tool where it was made, or upload the file. Verse Engine prepares it once and gives you a link to send to a client, embed in a proposal site or open in a meeting." },
          { type: "h3", text: "Bring your model" },
          { type: "list", ticks: true, items: [
            [strong("BIM:"), " IFC models today"],
            [strong("Editors:"), " one-button Publish in Blender, Unity and Unreal, on Mac and Windows"],
            [strong("Files:"), " 20+ formats including glTF, FBX, OBJ, USDZ, CAD, scans and splats", claim("cad-formats", " (exact CAD formats to be listed)")],
            [strong("Coming soon:"), " Revit, SketchUp, Rhino, 3ds Max, Archicad, Maya, Cinema 4D and Houdini plug-ins"],
          ] },
          { type: "h3", text: "Keep the design intent" },
          { type: "p", text: "Faithful material capture keeps glass, light and stone convincing, as the reception interior sample shows. Signed scenes mean a client sees the version you published." },
        ] },
        { type: "figure", src: "/assets/sample-1.webp", width: "720", height: "450",
          alt: "Designed reception interior with glass, stone and lighting, explorable in 3D in the browser, a real Verse Engine sample",
          caption: "Reception interior: glass, light and stone, streamed live." },
      ] }],
    },
    {
      id: "walkthroughs", eyebrow: "Property walkthroughs", title: "Interactive property walkthroughs buyers open from a message", tone: "alt",
      blocks: [
        { type: "steps", items: [
          { title: "Publish the space", body: "Upload the apartment, villa or office, or generate it from a floor plan with Ctruh Homes." },
          { title: "Send the link", body: "Paste it into WhatsApp, an email, a brochure QR code or a listing. It opens straight into the scene, with no sign-up for the viewer." },
          { title: "Let buyers walk it", body: "Buyers orbit, zoom and move through rooms on their own phone or laptop, at their own pace." },
          { title: "Keep it current", body: "Update finishes or layouts without changing the link, lock it to private, collect comments and export a video for ads. See who opened it." },
        ] },
        { type: "p", claim: "analytics-detail", className: "rs-small rs-muted", text: "Per-scene viewing metrics for sales follow-up." },
      ],
    },
    {
      id: "floor-plan", eyebrow: "Floor-plan-to-3D", title: "From floor plan to walkable 3D home",
      blocks: [
        { type: "cols", cols: [
          { type: "group", blocks: [
            { type: "p", text: [strong("Ctruh Homes"), " ", pill("Available", "ok"), " turns a floor plan into a walkable, furnished home in about a minute. You can then restyle it in a sentence, for example to try a different interior style, and share it as a Verse link."] },
            { type: "table", caption: "Floor-plan-to-3D: what is confirmed and what is being confirmed", head: ["Item", "Status"], rows: [
              ["Floor plan → walkable, furnished home", "Confirmed (about one minute)"],
              ["Restyle the home with a sentence", "Confirmed"],
              ["Output is a shareable Verse link", "Confirmed"],
              ["Floor plan as a PDF or a phone photo of the plan", "Shown on verse.ctruh.com"],
              { claim: "homes-inputs", cells: ["Accepted file types, scale accuracy and plan limits", "[to be confirmed by product]"] },
              { claim: "homes-pricing", cells: ["Plan and pricing for Ctruh Homes", "[to be confirmed by product]"] },
            ] },
          ] },
          { type: "figure", src: showFlat, width: "720", height: "450",
            alt: "Walkable furnished apartment produced by Ctruh Homes from a floor plan, viewed in a browser",
            caption: "Floor plan in, walkable home out: about one minute with Ctruh Homes." },
        ] },
        { type: "callout", title: "Capture an existing room", blocks: [
          { type: "p", text: [strong("Ctruh Capture"), " ", pill("Private beta", "warn"), " lets you walk around a room with a camera and get a walkable space back as a link, useful for resale listings, renovations and as-built records. ",
            claim("capture-access", "Request beta access: [form URL].", link("Ask Ctruh about beta access.", EXISTING.contact))] },
        ] },
      ],
    },
    {
      id: "large-scenes", eyebrow: "Large-scene streaming", title: "From one room to a township, in the same browser tab", tone: "alt",
      blocks: [{ type: "cols", cols: [
        { type: "group", blocks: [
          { type: "p", text: "The same engine opens an object, a furnished interior, an apartment building, a neighbourhood or a whole city. Verse Engine never sends the whole file. It streams only what the camera can see, in the detail the screen can show, and the rest arrives as the viewer moves." },
          { type: "list", ticks: true, items: [
            [strong("Scans:"), " laser scans (for example a 3.4 GB E57 office scan) and splats stream as links"],
            [strong("Masterplans:"), " a township or campus stays one scene, not a set of cut-down tiles"],
            [strong("Proof of scale:"), " Lyon, 10.3 billion triangles in one 556 GB file, opens in Chrome on a laptop"],
          ] },
          { type: "p", text: link("Explore the Lyon 3D city demo →", href("lyon"), { className: "site-button rs-outline rs-sm", "data-event": "internal_link", "data-target": "lyon" }) },
        ] },
        { type: "figure", src: "/media/city-oblique.webp", width: "1600", height: "900",
          alt: "Aerial view of Lyon at dusk streamed in a browser by Verse Engine, showing city-scale 3D",
          caption: "Lyon, streamed live. City data: Métropole de Lyon, 2023 photomesh, Licence Ouverte 2.0." },
      ] }],
    },
    {
      id: "applications", eyebrow: "Applications", title: "How developers, architects and designers can use Verse",
      intro: "Typical ways teams can put browser-based 3D to work. These describe possible uses, not customer results.",
      blocks: [{ type: "cards", items: [
        { kicker: "Real estate developers", title: "Sell before it is built", body: "Share walkable show flats and township overviews in launch campaigns, at site offices and through channel partners, all from one link." },
        { kicker: "Brokers and agents", title: "Answer questions remotely", body: "Send a walkthrough to an out-of-town or overseas buyer on WhatsApp and let them explore on their own phone." },
        { kicker: "Architects", title: "Faster client reviews", body: "Publish a design option from Blender or as IFC, send the link, and update the same link after each round of feedback." },
        { kicker: "Interior designers", title: "Proposals clients can walk", body: "Turn a floor plan into a furnished home with Ctruh Homes, restyle it in a sentence and present options side by side." },
        { kicker: "Facilities and owners", title: "As-built records", body: "Share laser scans of offices and buildings with contractors and stakeholders without sending gigabytes of files." },
        { kicker: "Developers' web teams", title: "3D on the project website", body: "Embed the walkthrough on the project page with one tag or a ready-made WordPress, Webflow, Wix or Squarespace embed." },
      ] }],
    },
    {
      id: "ctruh-homes", eyebrow: "Ctruh Homes", title: "Ctruh Homes: floor plans to furnished homes", tone: "alt", narrow: true,
      // Team note: add a link to the Ctruh Homes product page or sign-up route, plus 2–3 screenshots of the flow (upload plan → result → restyle); confirm whether Ctruh Homes is under Verse Engine plans or separate.
      blocks: [{ type: "p", text: "Ctruh Homes is one of four ways to make a space on Verse, and it is available today. It is built for the moment a buyer has only a floor plan: within about a minute the plan becomes a furnished home they can walk through, and the team can restyle it with a short instruction before sharing the link. Every Ctruh Homes result is a normal Verse scene, so it can be made private, embedded, updated and tracked like any other." }],
    },
    {
      id: "demo", eyebrow: "Product demonstration", title: "Walk a real show flat",
      intro: "This show flat is a real Verse scene, not a video. Open it here or on your phone.",
      blocks: [
        { type: "demo", buttonId: "btn-load-show-flat-demo", src: EXISTING.demoShowflat, title: "Show flat: Verse Engine real estate demo", openLabel: "Open the show flat in a new tab",
          poster: showFlat, posterAlt: "Show flat living room, Verse Engine real estate sample, before loading", note: "Real Verse sample · No app, no sign-up." },
        { type: "p", className: "rs-small rs-muted", text: ["Also try the ", link("reception interior", EXISTING.demoReception), " or the ", link("Lyon city demo", href("lyon")), "."] },
      ],
    },
  ],

  // FAQ answers are plain text: they drive both the visible FAQ and the FAQPage structured data.
  faq: [
    { q: "How can buyers or clients explore a property in 3D without an app?",
      a: "Share a Verse link. It opens in a modern browser on Windows, macOS, Linux, Android and iOS, and the viewer can orbit, zoom and walk through the space. The viewer's own device draws the scene and receives only what it can see, so nothing has to be installed." },
    { q: "Can I turn a floor plan into a 3D walkthrough?",
      a: "Yes. Ctruh Homes turns a floor plan into a walkable, furnished home in about a minute, and you can restyle it in a sentence. The result is a Verse link you can share like any other scene." },
    { q: "Can Verse Engine open BIM models?",
      a: "Yes. BIM models arrive through IFC today. Direct plug-ins for Revit, SketchUp, Rhino, 3ds Max and Archicad are coming soon." },
    { q: "Can I share a laser scan or point cloud of a building?",
      a: "Yes. Verse Engine accepts scans and splats among its 20+ formats. For example, an E57 laser scan of an office can be uploaded and shared as a link." },
    { q: "How large can an architectural scene be?",
      a: "Verse Engine streams only what the camera sees, so scene size is not limited by the viewer's memory. Ctruh's largest public demonstration is the city of Lyon: 10.3 billion triangles in one 556 GB file, opened from a link in Chrome on a laptop." },
    { q: "Can I keep a project private before launch?",
      a: "Yes. Links can be private and revocable, and every scene is signed. You can update the scene, for example after a design change, without changing the link you have already shared." },
    { q: "Can I put a 3D walkthrough on a property website?",
      a: "Yes. Embed it with one script tag or the <verse-viewer> component, or use the ready-made embeds for Webflow, WordPress, Wix and Squarespace." },
    { q: "What does it cost for an agent, architect or developer?",
      a: "Verse Engine is free to start. Starter at $29 a month suits an agent or designer sharing a few spaces a month, Pro at $99 suits professionals who show spaces every week, and Scale at $499 suits teams. Enterprise starts at $2,000 a month with SSO, white-label and an SLA. Viewers never pay." },
  ],

  cta: {
    title: "Bring your next project to life in 3D",
    body: "Share a plan, a model or a scan with us. Ctruh will show you how to turn it into a walkthrough that buyers and clients can open from one link.",
    actions: [ACTIONS.talk, ACTIONS.tryFree],
  },
};

// ── AI and 3D infrastructure page (/ai-3d-infrastructure) ──
const verse = "Verse Engine";

const AI_INFRA = {
  crumbs: [CRUMB.home, { name: "AI and 3D infrastructure", href: href("aiInfra") }],

  hero: {
    variant: "center",
    eyebrow: "Ctruh · 3D, XR and AI infrastructure",
    title: "Connecting AI-Powered 3D Creation with Browser-Native Delivery",
    sub: ["Making 3D and delivering 3D are two different problems. Ctruh works on both: ", strong("VersaAI"), " for AI-powered 3D creation, and ", strong("Verse Engine by Ctruh"), " for preparing, streaming, rendering and deploying 3D in the browser. This page explains how they fit together."],
    actions: [
      { label: "Explore Verse Engine", href: EXISTING.landing, event: "hero_explore_verse" },
      { label: "See the workflow", href: "#workflow", event: "hero_see_workflow", outline: true },
    ],
  },

  sections: [
    {
      id: "ecosystem", title: "Ctruh, VersaAI and Verse Engine at a glance", narrow: true,
      blocks: [
        { type: "answer", q: "Who does what", a: "Ctruh is the company. VersaAI is Ctruh's AI-powered 3D creation layer. Verse Engine by Ctruh is Ctruh's browser-native 3D and XR engine for preparing, streaming, rendering and deploying 3D. They are connected, but they are not the same product." },
        { type: "table", caption: "The Ctruh ecosystem: three distinct layers", head: ["Layer", "What it is", "Job to be done", "Where to start"], rows: [
          ["Ctruh", "The company (CTRUH Technologies Private Limited)", "Builds 3D, XR and AI infrastructure for the Spatial Internet and the industry applications on top of it", link("ctruh.com", EXISTING.ctruh)],
          ["VersaAI", "AI-powered 3D creation and transformation", "Helps produce 3D content", claim("versaai-url", link("VersaAI page", EXISTING.versaai), link("ctruh.com", EXISTING.ctruh))],
          ["Verse Engine by Ctruh", "Browser-native 3D and XR engine", "Prepares, streams, renders and deploys 3D so it opens from one link", link("verse.ctruh.com", EXISTING.landing)],
        ] },
      ],
    },
    {
      id: "two-problems", eyebrow: "Two different challenges", title: "Why creating 3D and delivering 3D are different problems",
      blocks: [
        { type: "cols", cols: [
          { type: "card", title: "Creation: getting a model to exist", text: "Traditionally this means skilled modelling hours, photogrammetry rigs or laser scanners. The bottlenecks are time, skills and cost per asset. AI changes this layer by generating or transforming content from inputs people already have, such as photos, plans and descriptions." },
          { type: "card", title: "Delivery: getting a model to open", text: "A finished model still has to reach a shopper's phone, a client's laptop or a headset. The bottlenecks are file size, device memory, bandwidth, rendering power, security and installs. Most web viewers hold the whole scene in memory, which caps them at tens of millions of triangles." },
        ] },
        { type: "p", className: "rs-lead", text: "Solving one does not solve the other. A team can generate a thousand products with AI and still have no way to show them on a product page, or own a perfect city model that no browser can open. Infrastructure has to cover the full path." },
      ],
    },
    {
      id: "ai-role", eyebrow: "AI in 3D creation", title: "The role of AI in 3D content creation", tone: "alt",
      blocks: [{ type: "cards", cols: 2, items: [
        { title: "From inputs people already have", body: "AI can start from the material a business already owns, like product photos, floor plans and written descriptions, instead of waiting for a 3D artist." },
        { title: "Transformation, not just generation", body: "AI can restyle what already exists. In Ctruh Homes you restyle a furnished home with one sentence." },
        { title: "Speed at catalogue scale", body: "Creation that took days per asset becomes a step that can run for a whole catalogue or a whole project." },
        { title: "AI agents as operators", body: "Assistants can now call tools. The Verse MCP server lets an AI assistant upload a 3D file and return a published link." },
      ] }],
    },
    {
      id: "versaai", eyebrow: "Introducing VersaAI", title: "VersaAI: Ctruh's AI-powered 3D creation layer",
      blocks: [{ type: "cols", cols: [
        { type: "group", blocks: [
          { type: "p", text: "VersaAI is the part of the Ctruh ecosystem that creates and transforms 3D content with AI. It sits upstream of delivery: its job is to produce 3D assets, not to stream them." },
          { type: "p", claim: "versaai-inputs", text: "Ctruh's May 2026 funding announcement describes VersaAI as a generative AI engine that converts images, text and video into production-ready 3D assets, and it powers image-to-3D in Ctruh Studio." },
          { type: "p", text: "Because VersaAI and Verse Engine are separate layers, content created with VersaAI still needs to be prepared and delivered before people can open it on their devices. That delivery step is what Verse Engine does." },
          { type: "p", claim: "versaai-url", text: link("Learn more about VersaAI", EXISTING.versaai, { "data-event": "internal_link", "data-target": "versaai" }) },
        ] },
        { type: "card", title: "What VersaAI is not", text: "VersaAI is not the Verse Engine renderer, and Verse Engine is not an AI model. Some third-party coverage has described VersaAI as a browser-native engine; that description belongs to Verse Engine by Ctruh." },
      ] }],
    },
    {
      id: "verse-engine", eyebrow: "Introducing Verse Engine", title: "Verse Engine by Ctruh: preparing, streaming and deploying 3D", tone: "alt",
      blocks: [
        { type: "p", className: "rs-lead", text: `${PRODUCT.definition} Ctruh's deep-tech team in Bengaluru and San Francisco wrote all three layers itself, and the core technology is patented.` },
        { type: "cards", items: [
          { kicker: "Layer 03", title: "The streaming layer", body: "Decides what to send, when and in how much detail, as the camera moves." },
          { kicker: "Layer 02", title: "The file format", body: "One file, built to be read a piece at a time, whether it holds a chair or a city." },
          { kicker: "Layer 01", title: "The renderer", body: "Draws every scene on the viewer's own device, with no cloud GPU behind it." },
        ] },
        { type: "p", text: ["Inside the engine: virtualized geometry streaming, safe paged memory, a GPU feed controller, an adaptive engine router, streamed textures, device-adaptive rendering, faithful material capture, signed scenes and Instant Home. It renders with WebGPU where available and WebGL2 elsewhere. ",
          claim("tech-stack-public", "The engine is written in Rust and compiled to WebAssembly (WASM). "), "Read ", link("how Verse Engine works", href("howItWorks")), "."] },
      ],
    },
    {
      id: "connect", eyebrow: "How they connect", title: "How AI-powered creation and browser-native delivery connect",
      blocks: [
        { type: "p", className: "rs-lead", text: "Every creation route ends in the same place: a Verse link. AI makes the content; Verse Engine makes it openable anywhere." },
        { type: "table", caption: "Creation routes and how each reaches a Verse link", head: ["Route", "Status", "Input", "How it reaches a Verse link"], rows: [
          ["Ctruh Homes", pill("Available", "ok"), "A floor plan", "Generates a walkable, furnished home in about a minute; output is a Verse scene"],
          ["Verse plug-ins and uploads", pill("Available", "ok"), "Blender, Unity, Unreal projects; 20+ file types", "One-button Publish or upload; Verse prepares it once"],
          ["MCP server", pill("Early", "warn"), "A 3D file, via an AI assistant", "The assistant uploads the file and returns a published, signed link"],
          ["Ctruh Capture", pill("Private beta", "warn"), "A room, walked with a camera", "Returns a walkable space as a link"],
          ["Ctruh Worlds", pill("Coming soon"), "A description or a photo", ["Returns a 3D world to explore, on Ctruh's own open models.", claim("worlds-models", " Relationship to VersaAI.")]],
          { claim: "versaai-handoff", cells: ["VersaAI", claim("versaai-inputs", "[status]"), "Images, text, video", "Direct handoff to Verse Engine, or export a GLB and upload it"] },
        ] },
      ],
    },
    {
      id: "workflow", eyebrow: "The workflow", title: "From 3D creation to deployment, step by step", tone: "alt",
      blocks: [
        // The five-stage workflow as semantic HTML, readable by crawlers and screen readers.
        { type: "flow", label: "Workflow from inputs to deployment", stages: [
          { n: "01", name: "Inputs", owner: "Your content", items: ["Product images, text, video", "Floor plans (PDF or photo)", "Rooms captured with a camera", "CAD and BIM (IFC) models", "Blender, Unity, Unreal projects", "Scans and splats"] },
          { n: "02", name: "Create", owner: "VersaAI · Ctruh creation routes", items: ["VersaAI: AI-powered 3D creation", "Ctruh Homes: plan → furnished home (available)", "Ctruh Capture: room → space (private beta)", "Ctruh Worlds: text or photo → world (coming soon)", "Editor plug-ins: one-button Publish"] },
          { n: "03", name: "Prepare", owner: verse, verse: true, items: ["Converted once into the Verse file format", "Sliced for every kind of device", "Signed so viewers know it is genuine", "Failed steps recover on their own"] },
          { n: "04", name: "Stream and render", owner: verse, verse: true, items: ["Streams only what the camera sees", "Detail matched to the screen", "Rendered on the viewer's device", "WebGPU, or WebGL2 where needed"] },
          { n: "05", name: "Deploy", owner: verse, verse: true, items: ["One shareable link", "Embeds and platform plug-ins", "REST API, SDK, webhooks", "MCP server for AI agents", "Web 3D, AR and XR"] },
        ] },
        { type: "p", className: "rs-small rs-muted", text: "Stages 01–02 cover creation (VersaAI and Ctruh's creation routes). Stages 03–05 cover delivery (Verse Engine by Ctruh)." },
      ],
    },
    {
      id: "applications", eyebrow: "Applications", title: "Where the full pipeline matters",
      blocks: [{ type: "cards", cols: 2, items: [
        { title: "Commerce", body: ["Create product models from existing assets, then let shoppers rotate them and view them in AR from an embed on the product page. ", link("3D commerce with Verse", href("commerce")), "."] },
        { title: "Architecture and real estate", body: ["Turn floor plans into furnished homes with Ctruh Homes, open BIM models through IFC, and share whole townships as one link. ", link("Architecture and real estate", href("archRe")), "."] },
        { title: "Interactive experiences and games", body: "Publish full game-world scenes from Unity or Unreal and let players explore them in a browser tab, as the Bistro street sample shows." },
        { title: "Developers and AI agents", body: ["Automate the path from asset to link with the REST API, SDK and webhooks, or let an AI assistant publish through the MCP server. ", link("Developers", href("developers")), "."] },
      ] }],
    },
    {
      id: "why-browser", eyebrow: "Why browser-native", title: "Why browser-native 3D infrastructure matters", tone: "alt",
      blocks: [
        { type: "cards", cols: 2, items: [
          { title: "Reach", body: "A link opens in a modern browser on Windows, macOS, Linux, Android and iOS, and in headsets. Nobody has to install an app, so the people you send it to can actually see it." },
          { title: "Scale", body: "Streaming only what is on screen removes the memory ceiling of typical web viewers. Ctruh's Lyon demonstration opens 10.3 billion triangles from one 556 GB file in Chrome on a laptop." },
          { title: "Cost", body: "The viewer's device draws the scene, so there is no GPU server per viewer. Ctruh estimates delivery at most about $252 per thousand viewer-hours, against $498–$6,000 for cloud GPU streaming. Plan price is separate and starts free." },
          { title: "Control", body: "Scenes are signed, links can be private or revoked, and you can update a scene without changing its link." },
        ] },
        { type: "p", className: "rs-small rs-muted", text: ["Figures are Ctruh's own desktop browser benchmarks and delivery-cost estimates. Results vary by scene, device and connection. See ", link("how the Lyon demo was measured", href("lyon")), "."] },
      ],
    },
  ],

  // FAQ answers are plain text: they drive both the visible FAQ and the FAQPage structured data.
  faq: [
    { q: "What is the difference between VersaAI and Verse Engine?",
      a: "They are separate Ctruh products that solve different problems. VersaAI is Ctruh's AI-powered 3D creation layer: it helps produce 3D content. Verse Engine by Ctruh is the browser-native 3D and XR engine that prepares, streams, renders and deploys 3D content so it opens from a single link." },
    { q: "Is Verse Engine an AI model?",
      a: "No. Verse Engine is a 3D engine: a streaming layer, a file format and a renderer written by Ctruh. AI appears around it, in creation routes such as Ctruh Homes and in an MCP server that lets AI assistants publish scenes, but the engine itself delivers 3D rather than generating it." },
    { q: "What is AI 3D infrastructure?",
      a: "AI 3D infrastructure is the set of systems that take 3D content from creation to the people who use it. It covers AI-assisted creation, preparation of the content for many devices, streaming and rendering, and deployment through links, embeds and APIs. Ctruh builds across these layers with VersaAI and Verse Engine by Ctruh." },
    { q: "Why are creating 3D and delivering 3D different problems?",
      a: "Creation is about getting a model to exist, through modelling, scanning or AI generation. Delivery is about getting that model to open quickly and reliably on everyday devices, which depends on file size, memory, bandwidth, rendering and security. A great model is useless if viewers cannot open it, and a great viewer has nothing to show without content." },
    { q: "Can AI assistants publish 3D scenes with Verse Engine?",
      a: "Yes. The Verse MCP server, currently in early access, lets AI assistants upload a 3D file and hand back a published, signed link. For example, an assistant can be asked to publish a warehouse model as a private link." },
    { q: "Which AI-powered creation routes end in a Verse link today?",
      a: "Ctruh Homes is available today and turns a floor plan into a walkable, furnished home in about a minute, which you can restyle in a sentence. Ctruh Worlds, coming soon, will turn a description or a photo into a 3D world to explore." },
    { q: "Does browser-native 3D need a powerful device or a cloud GPU?",
      a: "No cloud GPU is needed. With Verse Engine the viewer's own device draws the scene, using WebGPU where available and WebGL2 elsewhere, and it receives only what it can see. That is why Verse links open on everyday phones and laptops." },
    { q: "What does Ctruh mean by the Spatial Internet?",
      a: "Ctruh uses the Spatial Internet to describe a web where 3D spaces and objects are as easy to open and share as web pages are today. Ctruh's goal is to build the 3D, XR and AI infrastructure that makes that possible." },
  ],

  // Team note: add a third action "Explore VersaAI" once the official VersaAI page URL is confirmed (claim versaai-url).
  cta: {
    title: "Explore Verse Engine, and the AI that feeds it",
    body: "Start with Verse Engine free and publish your first scene as a link, or talk to Ctruh about connecting AI-powered creation to your 3D delivery.",
    actions: [{ label: "Explore Verse Engine", href: EXISTING.landing, event: "footer_explore_verse" }, ACTIONS.talk],
  },
};

// ── Lyon 3D city demo page (/demos/lyon) ──
const cityHero = "/media/city-hero.webp";
const m5 = "Apple M5 Pro, Chrome, CDN, 4–5 Nov 2026";

/** The screen recording (claim "lyon-video"). Also used for the VideoObject structured data. */
export const VIDEO = {
  title: "Lyon in a browser: 10.3 billion triangles streamed by Verse Engine",
  description: "A screen recording of Verse Engine by Ctruh opening a 10.3-billion-triangle photomesh of Lyon, France, from a single 556 GB file, in Chrome on a laptop: from the city overview to Fourvière and down to street level. No app, no pre-rendered video. City data: Métropole de Lyon, 2023 photomesh, Licence Ouverte 2.0.",
  // Self-hosted: the same film as the home page footer (/media, added 9 Nov 2026), muted (no sound).
  // smallUrl is the 720p copy for screens up to 800 px.
  embedUrl: "", contentUrl: "/media/verse-film-1080.mp4", smallUrl: "/media/verse-film-720.mp4",
  uploadDate: "2026-11-09", duration: "PT1M", thumbnailUrl: "/media/verse-film-poster.webp",
};

const LYON = {
  crumbs: [CRUMB.home, { name: "Demos", href: EXISTING.samples }, { name: "Lyon 3D city", href: href("lyon") }],

  hero: {
    variant: "image",
    image: { src: cityHero, width: "2400", height: "1290" },
    eyebrow: "Live demo · Lyon, France",
    title: "Explore a Large-Scale 3D City in Your Browser",
    sub: "10.3 billion triangles of real, textured city in one 556 GB file, opened from a link and walkable at street level. No app, no download: Verse Engine by Ctruh streams only what you can see.",
    actions: [
      { label: "Open the live city", href: "#live", event: "hero_open_demo" },
      { label: "How it was measured", href: "#measured", event: "hero_how_measured", outline: true },
    ],
  },

  sections: [
    {
      id: "what", title: "What you are exploring", narrow: true,
      blocks: [
        { type: "answer", q: "The demo in one paragraph", a: `The Lyon demo is a live ${PRODUCT.name} scene of Lyon, France, built from the Métropole de Lyon 2023 photomesh. The whole city sits in one 556 GB file on the server. When you open the link, Verse Engine streams only the part of the city your camera can see, about 0.05% of the file for a full city view, and your own device draws it.` },
        { type: "cards", items: [
          { kicker: "View 1", title: "City overview", body: "The whole of Lyon from above, from the rivers to the hills." },
          { kicker: "View 2", title: "Fourvière", body: "The hill and basilica above the old town, with real texture and geometry." },
          { kicker: "View 3", title: "Street level", body: "Drop to the street and walk; detail streams in around you." },
        ] },
      ],
    },
    {
      id: "live", eyebrow: "Live interactive demo", title: "Open the Lyon 3D city", tone: "alt",
      blocks: [
        { type: "demo", buttonId: "btn-load-lyon-demo", src: EXISTING.lyonLive, embedClaim: "lyon-url", title: "Lyon 3D city: Verse Engine live demo", openLabel: "Open Lyon in a new tab",
          poster: cityHero, posterAlt: "Aerial view of Lyon streamed in Chrome by Verse Engine, before the live scene loads", note: "Best on a recent laptop in Chrome. The scene streams as you move." },
        { type: "fragment", claim: "lyon-controls", blocks: [
          { type: "h3", text: "How to explore" },
          { type: "list", items: [
            "Drag to orbit around the city; scroll or pinch to zoom.",
            "Use the preset views to jump between the city overview, Fourvière and street level.",
            "At street level, move to walk; detail sharpens wherever you look.",
          ] },
        ] },
        { type: "noscript", text: ["The live scene needs JavaScript. You can still ", link("open Lyon directly", EXISTING.lyonLive), " or read how it works below."] },
      ],
    },
    {
      id: "video", eyebrow: "Screen recording", title: "Watch the Lyon demo", claim: "lyon-video",
      blocks: [
        { type: "video", src: VIDEO.contentUrl, smallSrc: VIDEO.smallUrl, poster: VIDEO.thumbnailUrl, label: VIDEO.title },
        { type: "h3", text: VIDEO.title },
        { type: "p", text: VIDEO.description },
      ],
    },
    {
      id: "how", eyebrow: "Streaming and rendering", title: "How Verse Engine streams a city into a browser tab", tone: "alt",
      blocks: [
        { type: "steps", items: [
          { title: "The file stays on the server", body: "The 556 GB Lyon file is never downloaded. It is stored once in the Verse file format, which is built to be read a piece at a time." },
          { title: "The streaming layer decides what to send", body: "As the camera moves, Verse works out which parts of the city are visible and at what detail the screen can show them, then sends only those. This is virtualized geometry streaming, with textures streamed the same way." },
          { title: "Memory stays safe", body: "Safe paged memory and a GPU feed controller keep the browser within the device's limits, so a city-sized scene does not exhaust memory." },
          { title: "Your device draws it", body: "The renderer runs on your own device with WebGPU where available and WebGL2 elsewhere, adapting to what the device can handle. No cloud GPU streams video to you." },
        ] },
        { type: "p", text: ["Read more in ", link("how Verse Engine works", href("howItWorks")), "."] },
      ],
    },
    {
      id: "source", eyebrow: "Source data", title: "Scene information",
      blocks: [{ type: "table", caption: "Lyon scene facts", head: ["Item", "Detail"], rows: [
        ["Place", "Lyon, France"],
        ["Source data", "Métropole de Lyon, 2023 photomesh"],
        ["Licence", "Licence Ouverte 2.0 (open licence)"],
        ["Scene size", "10.3 billion unique triangles"],
        ["File", "One 556 GB Verse file on the server"],
        ["Delivery", "Served from a CDN, streamed to the browser"],
        { claim: "lyon-conversion", cells: ["Original format and conversion time", "[to be confirmed by engineering]"] },
      ] }],
    },
    {
      id: "measured", eyebrow: "Measured, not rendered", title: "Technical measurements and how they were taken", tone: "alt",
      // Team note: for each metric, state what exactly is measured, source data, hardware and browser, test conditions,
      // what it demonstrates and whether it is repeatable; publish a "How we measure" page and link it here.
      blocks: [
        { type: "p", className: "rs-lead", text: "Every number below comes from the engine running in a browser, measured by Ctruh. They are Ctruh's internal measurements, not independent certification. Results vary with scene, device and connection." },
        // Benchmark rows: value, what is measured, conditions, what it shows.
        { type: "table", caption: "Lyon measurements: what each number means", head: ["Result", "What is measured", "Conditions", "What it demonstrates"], rows: [
          ["10.3 billion", "Unique triangles in the scene", "Lyon 556 GB photomesh, one file, Chrome on a laptop", "Scene size Verse can stream from a single file"],
          ["556 GB", "Size of the source file on the server", "Single Verse file of the Lyon photomesh", "The viewer never downloads it"],
          ["≈ 0.05%", "Share of the file needed to draw the whole city on screen", "City overview in Chrome", "Streaming sends only what is visible"],
          ["5.9 M", "Triangles on screen, city overview", m5, "Detail drawn per frame"],
          ["≈ 8.5 s", "Time until street detail appears after arriving", m5, "How quickly detail streams in at street level"],
          ["14–15 ms", "Frame time while walking (95% of frames under)", m5, "Smoothness while moving"],
          ["1.7 s best case", "Time to first picture", "Apple M5 Pro, Chrome, CDN; 2–8 s across Ctruh's test laptops", "How fast the city first appears"],
          ["≈ 45–60 fps", "Frame rate", "Windows laptop with an RTX 5060", "Performance on a second platform"],
        ] },
        { type: "h3", text: "Same city, same laptop: comparison" },
        { type: "table", caption: "Verse Engine, CesiumJS and Google 3D Tiles on Lyon (Apple M5 Pro, Chrome, CDN, 4–5 November 2026)", head: ["Measure", "Verse Engine", "CesiumJS 1.146", "Google 3D Tiles"], rows: [
          ["Opens your own 10B-triangle file", "Yes, one file", "Only after a tiling pipeline", "No, Google's capture only"],
          ["Files to host for this city", "1", "6.1 million", "Hosted by Google"],
          ["Triangles on screen, city overview", "5.9 M", "0.52 M", "Not compared"],
          ["Street detail after arriving", "about 8.5 s", "11–26 s", "13.7 s"],
          ["Frame time while walking (95% under)", "14–15 ms", "10–20 ms", "24.9 ms"],
          ["First picture", "1.7 s best case", "7.5–11.6 s", "1.34 s"],
        ] },
        { type: "p", className: "rs-small rs-muted", text: "CesiumJS 1.146 ran the city's own published 3D Tiles, its strongest setup. Google's tiles are Google's own capture of Lyon. The table includes the row Verse Engine did not win (first picture). Lower is better for times." },
        { type: "h3", text: "Methodology" },
        { type: "list", items: [
          [strong("Hardware and browser:"), " Apple M5 Pro laptop, Chrome; second platform Windows with an RTX 5060."],
          [strong("Network:"), " scene served from a CDN."],
          [strong("Dates:"), " 4–5 November 2026."],
          [strong("Source data:"), " Métropole de Lyon 2023 photomesh (Verse, CesiumJS); Google's own capture (Google 3D Tiles)."],
          { claim: "lyon-repeat", text: [strong("Repeatability:"), " [runs per metric, spread, engine version, cache state, network profile, link to the test script]"] },
        ] },
      ],
    },
    {
      id: "compatibility", eyebrow: "Compatibility", title: "Browser and device notes",
      blocks: [
        { type: "table", caption: "Where the Lyon demo has been tested", head: ["Platform", "Status"], rows: [
          ["Chrome on laptops (macOS, Apple M5 Pro)", "Measured by Ctruh; first picture 2–8 s across test laptops"],
          ["Chrome on Windows laptop with RTX 5060", "Measured by Ctruh; about 45–60 fps"],
          ["Rendering path", "WebGPU where available; WebGL2 elsewhere"],
          { claim: "lyon-mobile", cells: ["Phones and tablets", "[results to be supplied by engineering]"] },
          { claim: "lyon-min-spec", cells: ["Minimum requirements", "[to be supplied by engineering]"] },
        ] },
        { type: "p", text: ["Verse links in general open in a modern browser on Windows, macOS, Linux, Android and iOS. Lyon is the heaviest public scene; smaller scenes such as the ", link("show flat", EXISTING.demoShowflat), " are the best test on a phone."] },
      ],
    },
    {
      id: "demonstrates", eyebrow: "Why it matters", title: "What the Lyon demo shows about Verse Engine", tone: "alt",
      blocks: [{ type: "cards", cols: 2, items: [
        { title: "Scale without cutting", body: "A real, non-repeating scene of 10.3 billion triangles opens from one file, instead of being cut into millions of tiles or reduced until it fits." },
        { title: "Your file, as is", body: "Verse streams the file you uploaded. There is no separate tiling pipeline to run before the scene can be shared." },
        { title: "No app, no cloud GPU", body: "A browser tab and the viewer's own device are enough. That keeps delivery cost low and reach high." },
        { title: "Everything smaller opens the same way", body: ["The same engine serves ", link("products", href("commerce")), ", ", link("apartments and buildings", href("archRe")), ", factories and game worlds."] },
      ] }],
    },
  ],

  // FAQ answers are plain text: they drive both the visible FAQ and the FAQPage structured data.
  faq: [
    { q: "What is the Lyon 3D city demo?",
      a: "It is a live Verse Engine scene of Lyon, France: a textured photomesh of the city with 10.3 billion unique triangles, stored in one 556 GB file and opened from a single link in a web browser. It is Ctruh's public demonstration that Verse Engine can stream a real city-scale scene without an app." },
    { q: "Do I need to download the 556 GB file to view it?",
      a: "No. The file stays on the server. Verse Engine streams only the part of the city your camera can see, in the detail your screen can show. Showing all of Lyon at once takes about 0.05% of the file; the rest streams as you move." },
    { q: "Is the Lyon demo a video or a real-time 3D scene?",
      a: "It is a real-time 3D scene running in your browser. The video on this page is a screen recording of that same live scene, for people who cannot open the demo on their current device." },
    { q: "Which browser and device should I use?",
      a: "Ctruh measured Lyon in Chrome on laptops. Across Ctruh's test laptops the first picture took 2–8 seconds. The benchmark table was measured on an Apple M5 Pro, and on Windows with an RTX 5060 Lyon ran at about 45–60 frames per second." },
    { q: "Where does the Lyon city data come from?",
      a: "The city data is the Métropole de Lyon 2023 photomesh, published under the Licence Ouverte 2.0 open licence." },
    { q: "How were the Lyon benchmarks measured?",
      a: "Ctruh measured Verse Engine, CesiumJS and Google 3D Tiles on the city of Lyon on an Apple M5 Pro in Chrome, served from a CDN, on 4–5 November 2026. CesiumJS 1.146 ran the city's own published 3D Tiles. Google's tiles are Google's own capture of Lyon. The figures are Ctruh's internal measurements and include the row Verse did not win." },
    { q: "Can Verse Engine stream my own large file the same way?",
      a: "Yes. The same engine opens a product, an interior, a building, a factory or a game world from one link. Upload a file in any of 20+ formats, or publish from Blender, Unity or Unreal. Lyon is the proof of scale; everything smaller opens the same way." },
    { q: "What is a photomesh?",
      a: "A photomesh is a 3D surface model of real places built from many overlapping aerial and street photographs. It captures real geometry and real texture, which is why a city photomesh has billions of unique, non-repeating triangles." },
  ],

  cta: {
    title: "Think your scene is bigger?",
    body: "Send your heaviest file. If Verse Engine fails to stream it, you win. Or start free and publish your own scene as a link.",
    actions: [{ label: "Take the Challenge", href: EXISTING.challenge, event: "footer_challenge" }, ACTIONS.tryFree],
  },
};

/** The Resources pages by route key (keys as in ROUTES). */
export const RESOURCE_PAGES = { commerce: COMMERCE, archRe: ARCH_RE, aiInfra: AI_INFRA, lyon: LYON };
