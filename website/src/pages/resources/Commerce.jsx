// 3D commerce page. Content: RESOURCE_PAGES.commerce in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.jsx";
import { RESOURCE_PAGES } from "./data.js";

export default function Commerce() {
  return <ResourcePage page={RESOURCE_PAGES.commerce} />;
}
