// Lyon 3D city demo page. Content: RESOURCE_PAGES.lyon in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.jsx";
import { RESOURCE_PAGES } from "./data.js";

export default function LyonDemo() {
  return <ResourcePage page={RESOURCE_PAGES.lyon} />;
}
