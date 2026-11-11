// Each page's meta: what the router sets on <head> and <body> for the route, and how the
// shell looks around it. Edit a page's title or description here.
//   kind:       landing | page | legal | app | notfound | resources (decides the page's stylesheets)
//   chrome:     full (header and footer) | header (header only) | none
//   bodyClass, mainClass: classes for <body> and <main>
//   navCurrent: header link shown as the current section ("" for none)
//   noindex:    keep the page out of search results
//   ogDescription: og:description when it should differ from description
//   ogTitle, ogImage: the page's social card (link previews); without them the title and
//               OG_DEFAULT are used. A page with its own image gets an empty og:image:alt
//               (OG_DEFAULT's describes the default image only)
//   staticHead: also write title, description, robots and canonical into the page's HTML at
//               build time (vite.config.js), as the SEO blueprint (Part C) asks
//   prerender:  also build the page's content, stylesheets and structured data into its HTML, for
//               crawlers and readers without JavaScript (vite.config.js, src/prerender.jsx; Part E)
//   jsonld:     structured data for search engines (home page, Resources pages)
// Documentation pages get theirs from source/ (npm run content).
import { resourcesJsonLd } from "./resources/schema.js";
import { RESOURCE_PAGES, ROUTES } from "./resources/data.js";

/** The site's default social card image and its description (as in index.html). */
export const OG_DEFAULT = { ogImage: "/assets/og/verse-engine-by-ctruh-1200x630.jpg", ogImageAlt: "Verse Engine by Ctruh: a 3D scene opened from one link in a browser" };

// Shared by the Resources pages (their structured data is added below META).
const RESOURCE_PAGE = { bodyClass: "site-page", mainClass: "", noindex: false, staticHead: true, prerender: true };

// Breadcrumb structured data for a documentation page (/docs/...): Docs > this page.
// Used by the router (in the browser) and by vite.config.js (in each page's server HTML).
export const docsBreadcrumb = (path, title, origin) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Docs", item: origin + "/docs/what-is-verse-engine" },
    { "@type": "ListItem", position: 2, name: title.replace(/ \| Verse Engine by Ctruh$/, ""), item: origin + path },
  ],
});

// Structured data for a documentation page: the breadcrumb, plus a TechArticle for blog posts
// (page.article: headline, datePublished and author from the post's frontmatter).
export function docsJsonLd(path, page, origin) {
  const breadcrumb = docsBreadcrumb(path, page.title, origin);
  const a = page.article;
  if (!a) return breadcrumb;
  const article = {
    "@type": "TechArticle",
    headline: a.headline,
    datePublished: a.datePublished,
    ...(a.author && { author: { "@type": "Person", name: a.author } }),
    publisher: { "@id": "https://www.ctruh.com/#organization" },
  };
  const { "@context": context, ...crumbs } = breadcrumb;
  return { "@context": context, "@graph": [article, crumbs] };
}

export const META = {
  "/": {
    kind: "landing",
    chrome: "header",
    title: "Verse Engine by Ctruh | Browser-Native 3D and XR Engine",
    description: "Create, stream and deploy interactive 3D and XR experiences through the browser. Explore Verse Engine by Ctruh, built for browser-native 3D infrastructure.",
    ogTitle: "Verse Engine by Ctruh: any 3D, one link",
    ogDescription: "From a product to a whole city: turn any 3D file, scan, floor plan or editor project into one link that opens in the browser. No app.",
    ogImage: "/assets/og/og-landing.jpg",
    staticHead: true,
    bodyClass: "point-story",
    mainClass: "",
    navCurrent: "",
    noindex: false,
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://www.ctruh.com/#organization",
          "name": "Ctruh",
          "legalName": "CTRUH Technologies Private Limited",
          "url": "https://www.ctruh.com/",
          "logo": "https://verse.ctruh.com/assets/brand/ctruh-logo-512.png",
          "email": "hello@ctruh.com",
          "sameAs": [
            "https://www.linkedin.com/company/ctruh/",
            "https://www.youtube.com/@Ctruh",
            "https://www.instagram.com/ctruh.official/"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://verse.ctruh.com/#website",
          "name": "Verse Engine by Ctruh",
          "url": "https://verse.ctruh.com/",
          "publisher": {
            "@id": "https://www.ctruh.com/#organization"
          }
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://verse.ctruh.com/#verse-engine",
          "name": "Verse Engine by Ctruh",
          "applicationCategory": "DeveloperApplication",
          "applicationSubCategory": "Browser-native 3D engine",
          "operatingSystem": "Web browser (WebGPU or WebGL2)",
          "url": "https://verse.ctruh.com/",
          "description": "Verse Engine by Ctruh turns 3D files, scans, floor plans and Blender, Unity or Unreal projects into one link that opens in a modern web browser.",
          "publisher": {
            "@id": "https://www.ctruh.com/#organization"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free plan",
            "url": "https://verse.ctruh.com/pricing"
          }
        }
      ]
    },
  },
  "/about": {
    kind: "page",
    chrome: "full",
    title: "About | Verse Engine by Ctruh",
    description: "Ctruh builds 3D, XR and AI infrastructure. Learn how Verse Engine by Ctruh, our browser-native 3D engine, fits with VersaAI and Ctruh Studio.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/about",
    noindex: false,
  },
  "/developers": {
    kind: "page",
    chrome: "full",
    title: "Verse Engine Developers | 3D API, SDK, Embeds and MCP",
    description: "Upload, publish and embed streamable 3D with the Verse Engine REST API and SDK, React and Vue wrappers, signed webhooks, a one-tag embed and an MCP server.",
    ogTitle: "Verse Engine for developers: one upload in, a link or an embed out",
    ogDescription: "REST API, SDK, React and Vue wrappers, signed webhooks, a one-tag embed and an MCP server for AI assistants.",
    ogImage: "/assets/og/og-developers.jpg",
    staticHead: true,
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/developers",
    noindex: false,
  },
  "/pricing": {
    kind: "page",
    chrome: "full",
    title: "Pricing and Plans | Verse Engine by Ctruh",
    description: "Compare Verse Engine by Ctruh plans: start free, then upgrade for more storage, bandwidth, API calls and private links. Viewers never pay.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/pricing",
    noindex: false,
  },
  "/samples": {
    kind: "page",
    chrome: "full",
    title: "3D Examples and Samples | Verse Engine by Ctruh",
    description: "Open real Verse Engine by Ctruh scenes in your browser: apartments, interiors, products and web game worlds, each shared as one link.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/samples",
    noindex: false,
  },
  "/plugins": {
    kind: "page",
    chrome: "full",
    title: "Blender, Unity & Unreal Plug-ins | Verse Engine by Ctruh",
    description: "Publish scenes to a shareable 3D link straight from Blender, Unity or Unreal Engine. Beta plug-ins cover SketchUp, Revit, Rhino, 3ds Max and more.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/plugins",
    noindex: false,
  },
  "/plugins/blender": {
    kind: "page",
    chrome: "full",
    title: "Blender install guide | Verse Engine by Ctruh",
    description: "Blender 4.2 or newer. Extension zip; also installs as a legacy add-on.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/plugins",
    noindex: false,
  },
  "/plugins/unity": {
    kind: "page",
    chrome: "full",
    title: "Unity install guide | Verse Engine by Ctruh",
    description: "Unity 2021.3 or newer (URP, HDRP, Built-in). UPM tarball; glTFast is pulled in for you.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/plugins",
    noindex: false,
  },
  "/plugins/unreal": {
    kind: "page",
    chrome: "full",
    title: "Unreal Engine install guide | Verse Engine by Ctruh",
    description: "Unreal Engine 5.8 with a C++ toolchain (Xcode on macOS, Visual Studio 2022 on Windows). Source plug-in; the editor compiles it on first open.",
    bodyClass: "site-page",
    mainClass: "",
    navCurrent: "/plugins",
    noindex: false,
  },
  "/challenge": {
    kind: "page",
    chrome: "full",
    title: "The Verse Challenge | Verse Engine by Ctruh",
    description: "We’ll turn it into a link anyone can open. We have already opened a 1.8-billion-triangle scene from a link in a desktop browser. Upload yours, send us a link…",
    bodyClass: "site-page",
    mainClass: "challenge-page",
    navCurrent: "",
    noindex: false,
  },
  "/signin": {
    kind: "app",
    chrome: "none",
    title: "Sign in | Verse Engine by Ctruh",
    description: "Sign in to Verse Engine by Ctruh to upload, publish and share 3D scenes.",
    bodyClass: "studio-page signin-page",
    mainClass: "",
    navCurrent: "",
    noindex: true,
  },
  "/studio": {
    kind: "app",
    chrome: "none",
    title: "Playground | Verse Engine by Ctruh",
    description: "The Verse Playground: upload, review, preview, share and track 3D scenes. Runs in your browser.",
    bodyClass: "studio-page",
    mainClass: "",
    navCurrent: "",
    noindex: true,
  },
  "/404": {
    kind: "notfound",
    chrome: "none",
    title: "Page not found | Verse Engine",
    description: "",
    bodyClass: "site-page",
    mainClass: "not-found",
    navCurrent: "",
    noindex: true,
  },
  "/privacy": {
    kind: "legal",
    chrome: "full",
    title: "Privacy Policy | Verse Engine by Ctruh",
    description: "Privacy policy for Verse by Ctruh: accounts, uploads, analytics, WhatsApp, payments.",
    bodyClass: "site-page",
    mainClass: "legal-page",
    navCurrent: "",
    noindex: false,
  },
  "/terms": {
    kind: "legal",
    chrome: "full",
    title: "Terms of Service | Verse Engine by Ctruh",
    description: "Terms of service for Verse by Ctruh.",
    bodyClass: "site-page",
    mainClass: "legal-page",
    navCurrent: "",
    noindex: false,
  },
  "/refunds": {
    kind: "legal",
    chrome: "full",
    title: "Refund Policy | Verse Engine by Ctruh",
    description: "Refund policy for Verse subscriptions.",
    bodyClass: "site-page",
    mainClass: "legal-page",
    navCurrent: "",
    noindex: false,
  },  // Resources pages (src/pages/resources/), listed under Resources in the header.
  "/use-cases/3d-commerce": {
    kind: "resources",
    chrome: "full",
    title: "Browser-Based 3D Product Visualization for E-commerce | Ctruh",
    description: "Publish interactive 3D products that shoppers can orbit, zoom and view in AR from one link. Embed Verse Engine by Ctruh on Shopify, WordPress and more.",
    ogDescription: "Let shoppers orbit, zoom and place a product in their room, in the browser. Embed it on your product page with one tag.",
    ogTitle: "Interactive 3D product views, from one link",
    ogImage: "/assets/og/og-3d-commerce.jpg",
    navCurrent: "/use-cases/3d-commerce",
    ...RESOURCE_PAGE,
  },
  "/use-cases/architecture-real-estate": {
    kind: "resources",
    chrome: "full",
    title: "Browser-Based 3D for Architecture and Real Estate | Ctruh",
    description: "Share walkable 3D apartments, BIM models, scans and floor-plan-to-3D homes from one browser link. No app for clients or buyers. Built on Verse Engine by Ctruh.",
    ogDescription: "Floor plans, BIM models, scans and whole townships as walkable 3D, opened in the browser.",
    ogTitle: "Walk the apartment before it is built, from one link",
    ogImage: "/assets/og/og-architecture-real-estate.jpg",
    navCurrent: "/use-cases/architecture-real-estate",
    ...RESOURCE_PAGE,
  },
  "/ai-3d-infrastructure": {
    kind: "resources",
    chrome: "full",
    title: "AI and 3D Infrastructure: From Creation to Deployment | Ctruh",
    description: "How Ctruh connects AI-powered 3D creation (VersaAI) with browser-native 3D delivery (Verse Engine), from images, floor plans and scans to a streamable link.",
    ogDescription: "VersaAI creates. Verse Engine prepares, streams and deploys. How Ctruh connects the two.",
    ogTitle: "From AI-created 3D to a link anyone can open",
    ogImage: "/assets/og/og-ai-3d-infrastructure.jpg",
    navCurrent: "/ai-3d-infrastructure",
    ...RESOURCE_PAGE,
  },
  "/demos/lyon": {
    kind: "resources",
    chrome: "full",
    title: "Explore the Lyon 3D City Demo | Verse Engine by Ctruh",
    description: "Open a 10.3-billion-triangle photomesh of Lyon from one link in your browser. See how Verse Engine streams a 556 GB city file and how it was measured.",
    ogDescription: "A real city in one 556 GB file, streamed into Chrome on a laptop. Open it, and see how it was measured.",
    ogTitle: "Lyon: 10.3 billion triangles, opened from a link",
    ogImage: "/assets/og/og-lyon.jpg",
    navCurrent: "/demos/lyon",
    ...RESOURCE_PAGE,
  },
};

// Structured data for the Resources pages, from their meta title and description.
for (const key of Object.keys(RESOURCE_PAGES)) META[ROUTES[key].path].jsonld = resourcesJsonLd(key, META[ROUTES[key].path]);
