// Lyon 3D city demo page. Content: RESOURCE_PAGES.lyon in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.tsx";
import { RESOURCE_PAGES } from "./data.ts";

export default function LyonDemo() {
  return <ResourcePage page={RESOURCE_PAGES.lyon} />;
}
