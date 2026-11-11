// Routes whose page is a React component (the payload then only carries the page's meta).
// Documentation pages use src/pages/docs/DocsPage.jsx (see router.js).
// Each page's code is loaded only when the page is shown (its own file in the build, SEO blueprint Part E:
// smaller first download); the router and src/prerender.jsx await the loader.
export const PAGES = {
  "/": () => import("./Landing.jsx"),
  "/about": () => import("./About.jsx"),
  "/developers": () => import("./Developers.jsx"),
  "/pricing": () => import("./Pricing.jsx"),
  "/samples": () => import("./Samples.jsx"),
  "/plugins": () => import("./plugins/Plugins.jsx"),
  "/plugins/blender": () => import("./plugins/PluginBlender.jsx"),
  "/plugins/unity": () => import("./plugins/PluginUnity.jsx"),
  "/plugins/unreal": () => import("./plugins/PluginUnreal.jsx"),
  "/challenge": () => import("./Challenge.jsx"),
  "/signin": () => import("./Signin.jsx"),
  "/studio": () => import("./studio/Studio.jsx"),
  "/privacy": () => import("./legal/Privacy.jsx"),
  "/terms": () => import("./legal/Terms.jsx"),
  "/refunds": () => import("./legal/Refunds.jsx"),
  "/use-cases/3d-commerce": () => import("./resources/Commerce.jsx"),
  "/use-cases/architecture-real-estate": () => import("./resources/ArchitectureRealEstate.jsx"),
  "/ai-3d-infrastructure": () => import("./resources/AiInfrastructure.jsx"),
  "/demos/lyon": () => import("./resources/LyonDemo.jsx"),
  "/404": () => import("./NotFound.jsx"),
};
