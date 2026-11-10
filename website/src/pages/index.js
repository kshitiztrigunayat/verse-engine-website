// Routes whose page is a React component (the payload then only carries the page's meta).
// Documentation pages use src/pages/docs/DocsPage.jsx (see router.js).
import About from "./About.jsx";
import Challenge from "./Challenge.jsx";
import Developers from "./Developers.jsx";
import Landing from "./Landing.jsx";
import NotFound from "./NotFound.jsx";
import Pricing from "./Pricing.jsx";
import Samples from "./Samples.jsx";
import Signin from "./Signin.jsx";
import Plugins from "./plugins/Plugins.jsx";
import PluginBlender from "./plugins/PluginBlender.jsx";
import PluginUnity from "./plugins/PluginUnity.jsx";
import PluginUnreal from "./plugins/PluginUnreal.jsx";
import Studio from "./studio/Studio.jsx";
import Privacy from "./legal/Privacy.jsx";
import Terms from "./legal/Terms.jsx";
import Refunds from "./legal/Refunds.jsx";
import Commerce from "./resources/Commerce.jsx";
import ArchitectureRealEstate from "./resources/ArchitectureRealEstate.jsx";
import AiInfrastructure from "./resources/AiInfrastructure.jsx";
import LyonDemo from "./resources/LyonDemo.jsx";

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
  "/use-cases/3d-commerce": Commerce,
  "/use-cases/architecture-real-estate": ArchitectureRealEstate,
  "/ai-3d-infrastructure": AiInfrastructure,
  "/demos/lyon": LyonDemo,
  "/404": NotFound,
};
