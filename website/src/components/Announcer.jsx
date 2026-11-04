// Screen-reader announcement of the current page title after each navigation.
export default function Announcer({ text }) {
  return (
    <div id="app-announcer" role="status" aria-live="polite" style={{position: "fixed", top: "0", left: "0", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)"}}>{text}</div>
  );
}
