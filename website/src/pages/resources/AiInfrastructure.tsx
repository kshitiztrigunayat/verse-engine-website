// AI and 3D infrastructure page. Content: RESOURCE_PAGES.aiInfra in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.tsx";
import { RESOURCE_PAGES } from "./data.ts";

export default function AiInfrastructure() {
  return <ResourcePage page={RESOURCE_PAGES.aiInfra} />;
}
