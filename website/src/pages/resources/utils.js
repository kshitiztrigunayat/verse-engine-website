// Helpers shared by the Resources pages, their data (data.js) and their structured data (schema.js).
// data.js and this file import each other, so every helper here is a function declaration: those are
// ready before either module runs, whichever is loaded first.
import { CLAIMS, SITE, ROUTES } from "./data.js";

/** The link for a route key (planned pages fall back to a section of the home page). */
export function href(key) {
  const r = ROUTES[key];
  if (!r) throw new Error("Unknown route " + key);
  return r.status === "planned" ? r.fallback : r.path;
}
export function canonical(key) {
  return SITE + ROUTES[key].path;
}

/** True when content tied to a claim may be shown (no claim, or a confirmed one). */
export function claimOk(id) {
  if (!id) return true;
  if (!CLAIMS[id]) throw new Error("Unknown claim " + id);
  return CLAIMS[id].confirmed === true;
}

// Rich text in data.js: a string, or a list of strings and these parts (rendered by <Rich> in ResourcePage.jsx).
export function link(label, to, attrs) { return { link: label, href: to, ...attrs }; }
export function strong(text) { return { strong: text }; }
export function code(text) { return { code: text }; }
export function muted(text) { return { muted: text }; }
export function pill(text, tone) { return { pill: text, tone }; }
/** Text shown only once claim `id` is confirmed; until then `fallback` (if any). */
export function claim(id, parts, fallback) { return { claim: id, parts, fallback }; }
