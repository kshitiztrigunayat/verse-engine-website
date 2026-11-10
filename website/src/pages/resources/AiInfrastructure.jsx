// AI and 3D infrastructure page. Content: RESOURCE_PAGES.aiInfra in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.jsx";
import { RESOURCE_PAGES } from "./data.js";

export default function AiInfrastructure() {
  return <ResourcePage page={RESOURCE_PAGES.aiInfra} />;
}
