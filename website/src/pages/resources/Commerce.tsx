// 3D commerce page. Content: RESOURCE_PAGES.commerce in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.tsx";
import { RESOURCE_PAGES } from "./data.ts";

export default function Commerce() {
  return <ResourcePage page={RESOURCE_PAGES.commerce} />;
}
