// Architecture and real estate page. Content: RESOURCE_PAGES.archRe in ./data.js; layout: ./ResourcePage.jsx.
import ResourcePage from "./ResourcePage.tsx";
import { RESOURCE_PAGES } from "./data.ts";

export default function ArchitectureRealEstate() {
  return <ResourcePage page={RESOURCE_PAGES.archRe} />;
}
