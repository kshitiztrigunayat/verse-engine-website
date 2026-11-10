// "Resources" in the header: a dropdown with Samples and the Resources pages (RESOURCES_MENU in pages/resources/data.js).
// The mobile menu (MobileMenu.jsx) lists the same links in a "Resources" group.
import { useEffect, useRef, useState } from "react";
import { RESOURCES_MENU } from "../pages/resources/data.js";

/** The down chevron of the navigation groups (also used by the mobile menu). */
export const Chevron = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="m5 9 7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function ResourcesNav({ current }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null), buttonRef = useRef(null), openedByHover = useRef(false);

  // Close when the route changes, on Escape, and on a click or tap outside.
  useEffect(() => setOpen(false), [current]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!rootRef.current.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === "Escape") { setOpen(false); buttonRef.current.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  // A mouse opens it on hover; a click (touch, keyboard, or mouse) toggles it.
  const onPointerEnter = (event) => { if (event.pointerType === "mouse" && !open) { openedByHover.current = true; setOpen(true); } };
  const onPointerLeave = (event) => { if (event.pointerType === "mouse") { openedByHover.current = false; setOpen(false); } };
  const onToggle = () => {
    if (openedByHover.current) { openedByHover.current = false; return; }
    setOpen((o) => !o);
  };
  const onBlur = (event) => { if (!rootRef.current.contains(event.relatedTarget)) setOpen(false); };
  const onMenuClick = (event) => { if (event.target.closest("a")) setOpen(false); };

  const active = RESOURCES_MENU.some((r) => r.href === current);
  return (
    <div className={"nav-drop" + (open ? " is-open" : "")} ref={rootRef} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={onBlur}>
      <button type="button" id="btn-nav-resources" ref={buttonRef} className="nav-link nav-drop-toggle" aria-expanded={String(open)} aria-controls="nav-resources-menu" data-current={active ? "true" : undefined} onClick={onToggle}>
        {"Resources"}<Chevron className="nav-drop-chev" />
      </button>
      <div className="nav-drop-menu" id="nav-resources-menu" hidden={!open} onClick={onMenuClick}>
        {RESOURCES_MENU.map((r) => (
          <a key={r.href} href={r.href} id={r.id} aria-current={current === r.href ? "page" : undefined}>{r.label}</a>
        ))}
      </div>
    </div>
  );
}
