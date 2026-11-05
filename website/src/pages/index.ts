// Routes whose page is a React component (the payload then only carries the page's meta).
// Documentation pages use src/pages/docs/DocsPage.tsx, rendered by App.tsx.
import About from "./About.tsx";
import Challenge from "./Challenge.tsx";
import Developers from "./Developers.tsx";
import Landing from "./Landing.tsx";
import NotFound from "./NotFound.tsx";
import Pricing from "./Pricing.tsx";
import Samples from "./Samples.tsx";
import Signin from "./Signin.tsx";
import Plugins from "./plugins/Plugins.tsx";
import PluginBlender from "./plugins/PluginBlender.tsx";
import PluginUnity from "./plugins/PluginUnity.tsx";
import PluginUnreal from "./plugins/PluginUnreal.tsx";
import Studio from "./studio/Studio.tsx";
import Privacy from "./legal/Privacy.tsx";
import Terms from "./legal/Terms.tsx";
import Refunds from "./legal/Refunds.tsx";

export const PAGES = {
  "/": Landing,
  "/about": About,
  "/developers": Developers,
  "/pricing": Pricing,
  "/samples": Samples,
  "/plugins": Plugins,
  "/plugins/blender": PluginBlender,
  "/plugins/unity": PluginUnity,
  "/plugins/unreal": PluginUnreal,
  "/challenge": Challenge,
  "/signin": Signin,
  "/studio": Studio,
  "/privacy": Privacy,
  "/terms": Terms,
  "/refunds": Refunds,
  "/404": NotFound,
};
