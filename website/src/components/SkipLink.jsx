// "Skip to content" link (hidden on app routes).
export default function SkipLink({ hidden }) {
  return (
    <a id="lnk-skip" className="skip" href="#app-main" hidden={hidden}>{"Skip to content"}</a>
  );
}
