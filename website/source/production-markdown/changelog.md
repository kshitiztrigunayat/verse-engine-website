# What's new in Verse

A plain-language record of what has changed in Verse, newest first. Each release says when it went live. For changes to the API, see the [API changelog](#/api-changelog).

## Release 5 — 2026-10-25

- **New plans.** Free, Starter, Pro, Scale and Enterprise, each with clear monthly allowances for storage, bandwidth, API calls, Verse Homes, films, room captures and renders. New accounts get a 14-day trial with Pro features, and upgrading during the trial takes 25% off your first 3 months (or 20% off your first year). Broker packs add prepaid homes and films for WhatsApp, and discount codes work at checkout or from a link. Existing subscribers keep their plan and price. See [Plans and pricing](#/guides/plans-and-pricing).
- **Every scene gets a camera path.** As soon as a scene is published it has a **Walkthrough** (interiors), **Fly-through** (outdoor scenes) or **360° view** (products) button, planned for you. Open **Path** to move keys, change altitude, set speeds and save; **Reset to auto** brings the planned one back. Exteriors also get a **Drone** mode, and every path exports as MP4, WebM or a camera file for Blender, Unreal or After Effects. See [Camera paths](#/guides/camera-paths).
- **Hotspots and doors.** Pin price cards and **Book a visit** buttons to a scene, make doors swing, switch lights and finishes, and switch Day, Evening, Night or Empty room, all from the link. See [Hotspots and doors](#/guides/hotspots-and-doors).
- **Film a room (beta).** Film a room on your phone, or send the video on WhatsApp, and get a walkable 3D space. See [Film a room](#/guides/film-a-room).
- **Light and dark theme.** Verse follows your device or lets you choose, on every page. See [Light and dark theme](#/guides/light-and-dark-theme).
- **A new bar when you are signed in.** Tabs, a workspace switcher, your credits, **Upload** and your account in one place.
- **Prices in your currency.** Customers in India see and pay in rupees (Starter ₹1,999, Pro ₹7,999 and Scale ₹41,999 a month, + 18% GST added at checkout), everyone else in US dollars. See [Plans and pricing](#/guides/plans-and-pricing).
- **For developers.** A developer hub at `/developers` with a playground, runnable examples, and the npm packages `@ctruhtech/verse-sdk`, `-viewer`, `-react` and `-vue`; Framer, Webflow and Figma tools. See [Developers](#/developers).

## Release 4 — 24 October 2026

- **Sign in with a code.** A six-digit code by email or WhatsApp replaces passwords, with a list of where you are signed in and **Sign out everywhere**. See [Sign in](#/guides/sign-in).
- **Camera paths.** Record a track through a scene, play it from a link with chapters, and export a flythrough video at 720p, 1080p or 4K. See [Camera paths](#/guides/camera-paths).
- **Spatial Bench.** A one-and-a-half-minute test of how your device handles heavy 3D, with a score you can share. See [Spatial Bench](#/guides/spatial-bench).
- **Host a web game.** Upload an HTML5 game as a zip (Unity WebGL, Godot, three.js and more) and play or embed it from play.ctruh.io. See [Host a web game](#/guides/host-a-web-game).
- **Large Gaussian-splat captures.** Splat captures with millions of splats now stream like meshes, on phones and laptops alike, and can be combined with a streamed building in one scene.
- **Safer checkout.** Pressing Upgrade twice returns the checkout you already opened instead of starting a second one.
- **WhatsApp demos.** The demo links in the Verse WhatsApp assistant open the live showcase scenes.

## Release 3 — 24 October 2026

- **More files open.** A glTF folder zipped with its textures (the way model libraries ship it), STL files, and glTF files made with gltfpack colour compression or hidden parts now upload.
- **Clearer messages.** A damaged texture is named in the result instead of leaving a plain surface, a zip with no model says so, and files with animation data Verse cannot play still open with the animation left out.
- **Skinned and morphing models.** Draco-compressed characters, and models saved in a posed blend-shape state, show correctly.
- **Compatibility renderer.** Compressed (KTX2) textures show correctly on devices that use the compatibility renderer.
- **Better calls on what a file is.** A product-sized model with no inside to stand in opens as a product, not as an empty room.

## Release 2 — 24 October 2026

- **Faster first visit.** Smaller pages, compressed responses and fonts that no longer delay the first paint; scene pages load the product and the engine in parallel.
- **Products fill the frame.** A product opens framed to its silhouette instead of at about half the frame, and phones skip the "Enter experience" step for products.
- **A nicer object viewer.** Smooth orbit with inertia, pan, zoom to the cursor, double-tap to focus, and a simple Reset and Full screen bar.
- **More dependable links.** A dropped connection retries by itself and says so with a Retry button; scene files that live in storage keep opening after a restart.
- **Plans, billing and policies.** Plans with a 14-day Pro trial, team workspaces with credits, and approved Terms, Privacy and Refund policies. A plan bought during the trial applies at once.
- **Verse on WhatsApp.** Send a floor-plan photo, a 3D file or a question and get a link or an answer.
- **Large scenes.** Scenes with many repeated objects take far less space and open faster; very large scenes use graphics memory more carefully, and a tab left in the background hands it back.

Also in release 2, from 17 to 18 October:

**Big outdoor scenes open like a film.** A very large outdoor scene — a
whole neighbourhood or campus — now opens on a view of its most finished
area with the sky and sunlight already on, waits until that view is sharp,
then glides down to street level so you can start walking on a real road.
Any tap or key skips the glide. Other scenes open exactly as before.

**Big outdoor scenes look finished sooner.** Distant houses stay clean,
solid shapes while their detail arrives, instead of broken pieces; far trees
and flower beds no longer go missing; facades and plants close to you
sharpen in seconds once you stop moving; and street-level views move more
smoothly on a laptop.

**More natural outdoor light.** A clear-sky atmosphere with a warm sun and
a gentle haze in the distance is the default for big exteriors. Metal
surfaces reflect the sky and the sunlit ground, shaded walls facing away
from the sun no longer turn dark, and glass and everyday surfaces (plaster,
stone, wood, fabric) that some exporters save with the wrong settings now
look like glass and plaster rather than solid white panes or dark metal.

**Fewer "graphics stopped" moments.** Very large scenes use less of your
computer's graphics memory, a tab you leave in the background hands memory
back, and a scene the browser could not find memory for reopens once with
a lighter setting instead of failing. If your browser does stop its
graphics, [Help & troubleshooting](#/help)
says what to do.

**Phones.** Big scenes keep more of what is around you on a phone, so
nearby trees and houses stay in view, and tapping to enter no longer cuts
the opening glide short.

**Faster first visits.** The viewer's own code is smaller, so a first visit
downloads about a fifth less before the scene starts.

**Links to scenes that are still building.** Opening a share link before
the upload has finished now says the scene is still being prepared, and the
page opens it by itself when it is ready, instead of saying the link has
expired.

**Tour together.** Voice can now go through a relay server when the server
has one set up, so people on mobile data can hear each other. On a phone
the tour panel folds into a small "N in tour" button, a guest whose name is
already in the link is not asked for it again, and switching to another
tab no longer drops you out of a live tour.

**Verse Home reads open-plan homes.** A living room, dining area and
kitchen drawn as one open space are read as open. Rooms that a plan leaves
unreachable get a door added automatically (and marked, so you can check
it), and in **Check rooms** you can add, change, move or remove doors
yourself with a tap.

**Plug-ins.** The Unity plug-in publishes every scene you have open, not
only the active one. The Blender add-on publishes a file even when a
texture tile is missing or two linked materials share a name.

**Help when you need it.** A new [Help & troubleshooting](#/help)
page covers links that will not open on phones and desktops, slow networks,
every upload error with its fix, live tours and voice on mobile data, and
who can open your links.

## Release 1 — 16 October 2026 (launch)

- **Any 3D world, as a link.** Upload 20+ file types (glTF/GLB, FBX, OBJ, USD/USDZ, IFC and more) and get a link that opens on any device with a modern browser — no install.
- **Huge scenes that stream.** Walk through full interiors and large outdoor scenes; the device fetches only what it can see.
- **Floor plan → furnished 3D home.** Upload a plan and walk through a furnished home in about a minute; restyle it by asking in plain words — swap furniture, change floors and walls, or apply a whole-home look, with Undo.
- **Plug-ins.** Publish straight from Blender, Unity and Unreal; Revit, SketchUp, Rhino, 3ds Max, Maya, Cinema 4D and Houdini in beta.
- **Teams and plans.** Workspaces with roles, usage and credits, and a 14-day Pro trial for new accounts.
- **Live tours, embeds, video export and an API** with a ready-to-run Postman collection.
