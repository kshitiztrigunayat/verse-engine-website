// Routes whose page is a React component (the payload then only carries the page's meta).
// Documentation pages use src/pages/docs/DocsPage.tsx (see App.tsx).
// Each page's code is loaded only when the page is shown (its own file in the build, SEO blueprint Part E:
// smaller first download); src/routes.ts loads and keeps them (App.tsx, main.tsx and src/prerender.tsx).
import type { ComponentType } from "react";

export const PAGES: Record<string, () => Promise<{ default: ComponentType }>> = {
  "/": () => import("./Landing.tsx"),
  "/about": () => import("./About.tsx"),
  "/developers": () => import("./Developers.tsx"),
  "/pricing": () => import("./Pricing.tsx"),
  "/samples": () => import("./Samples.tsx"),
  "/plugins": () => import("./plugins/Plugins.tsx"),
  "/plugins/blender": () => import("./plugins/PluginBlender.tsx"),
  "/plugins/unity": () => import("./plugins/PluginUnity.tsx"),
  "/plugins/unreal": () => import("./plugins/PluginUnreal.tsx"),
  "/challenge": () => import("./Challenge.tsx"),
  "/signin": () => import("./Signin.tsx"),
  "/studio": () => import("./studio/Studio.tsx"),
  "/privacy": () => import("./legal/Privacy.tsx"),
  "/terms": () => import("./legal/Terms.tsx"),
  "/refunds": () => import("./legal/Refunds.tsx"),
  "/use-cases/3d-commerce": () => import("./resources/Commerce.tsx"),
  "/use-cases/architecture-real-estate": () => import("./resources/ArchitectureRealEstate.tsx"),
  "/ai-3d-infrastructure": () => import("./resources/AiInfrastructure.tsx"),
  "/demos/lyon": () => import("./resources/LyonDemo.tsx"),
  "/404": () => import("./NotFound.tsx"),
};
