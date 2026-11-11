import { useLayoutEffect, useState } from "react";
import Shell from "./Shell.jsx";
import { connectView, currentView } from "./router.js";

// Holds the route-dependent state of the shell. The router updates it with
// flushSync, so the DOM changes at exactly the same moments as before.
export default function App() {
  const [view, setView] = useState(currentView);
  useLayoutEffect(() => connectView(setView), []);
  return <Shell view={view} />;
}
