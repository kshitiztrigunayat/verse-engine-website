# Take the guided tour

Every page of Verse has a guided tour: the product page, the app, Studio
and these docs. It points at the real controls, one at a time, and says in
a sentence or two what each one does. Several steps ask you to try the
control yourself (drag the scene, press **Walk**) and move on when you
have.

**You need:** nothing. No account, no upload. The app tour loads a demo
scene for you.

## Start it

- **First visit:** a small invitation appears on the page: "New here?
  Take the 2-minute tour". Click it to start, or close it; it does not
  come back once dismissed.
- **Any time:** the **Tour** entry in the navigation of every page opens
  the chapter list. Start from the beginning, resume where you stopped, or
  jump straight to a chapter such as "Uploading your model".
- **By link:** add `?guide=<surface>` to a page address. The surfaces are
  `app`, `studio` and `docs`; the product page uses `/#guide=landing`
  (a query on `/` opens the app). A chapter or step id after a colon opens
  the tour there.

| Link | Opens |
| --- | --- |
| `/#guide=landing` | The product tour, from the top |
| `/app?guide=app` | The app tour, from the top |
| `/app?guide=app:upload` | The app tour at "Uploading your model" |
| `/studio?guide=studio` | The Studio tour |
| `/docs/?guide=docs` | The docs tour |
| any page with `?guide=0` | No chip and no tour on that visit |

Nothing ever opens by itself. The tour does not appear inside an embedded
viewer. (`?tour=` is a different thing: in the app it plays a recorded
camera tour.)

## Chapters

Use these ids after the colon, or pick the chapter from the list.

| Page | Chapter ids |
| --- | --- |
| Product page (`landing`) | `what` · `how` · `features` · `start` |
| App (`app`) | `scene` · `navigate` · `walk` · `auto-tour` · `review` · `export` · `quality` · `share` · `upload` |
| Studio (`studio`) | `account` · `library` · `sharing` |
| Docs (`docs`) | `navigate` · `guides` · `reference` · `news` |

From code, `window.verseOnboarding.start("app", "upload")` does the same
thing, and `window.verseOnboarding.chapters("app")` lists them.

## Move through it

| Control | Does |
| --- | --- |
| **Next** or the right arrow key | Next step |
| **Back** or the left arrow key | Previous step |
| **Skip**, the close button, or `Esc` | Close the tour; your place is remembered |
| The list button in the panel | Chapter list: jump anywhere |

A step marked **Try it** waits for you to use the highlighted control and
then advances. You can always press **Next** instead. While you are in
walk mode the arrow keys belong to walking, so use the buttons there.

## What each tour covers

- **Product page:** what Verse is, the live demo, how a file
  becomes a link, what you can do with one, and where to start. Its last
  step opens the app and the tour carries on there.
- **App:** loading a demo scene; orbit, zoom and keyboard control; the
  measure tool; walk mode and the floor-plan minimap; the automatic camera
  tour; review comments; video export; quality options; sharing; and
  uploading your own model, with the formats and limits read from the
  server.
- **Studio:** the account token, your scene library and its numbers,
  unlisted and private visibility, per-person share links, embed snippets,
  deleting and claiming scenes.
- **Docs:** the sidebar and search, the how-to guides, the exporters for
  Blender, Unity and Unreal, the API, the changelog and the blog.

If a control is not on the page (the outline column on a narrow screen,
for example) the tour skips that step rather than point at nothing.

## What it stores and sends

Progress is kept in your browser's local storage under the key
`verse-onboarding`: which step you reached on each page, whether you
finished, and whether you closed the chip. Clear it to see the chip again.
Nothing about you is stored on the server.

The tour reports four anonymous events through the same telemetry channel
the viewer uses: started, furthest step reached, completed, and skipped at
step N. Each carries the page name and the step id only. See the
[telemetry schema](../telemetry.md).

## Related

- [Getting started](../getting-started.md) covers the same ground as the
  app tour, in writing.
- [Collect client review comments](collect-review-comments.md),
  [Export a flythrough video](export-video.md) and
  [Share privately with tokens](share-privately.md) go deeper on the
  features the tour introduces.
