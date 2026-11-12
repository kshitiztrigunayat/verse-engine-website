// The Verse Engine by Ctruh logo. Its height comes from className (Tailwind, e.g. "h-11"); the link around it
// carries the accessible name, so the image itself is decorative.
export default function Logo({ className }: { className: string }) {
  return <img className={"block w-auto " + className} src="/assets/brand/verse-engine-logo.svg" alt="" width="1915" height="654" />;
}
