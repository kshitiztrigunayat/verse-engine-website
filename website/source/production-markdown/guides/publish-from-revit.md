# Publish from Revit

> **Status: 4.0.0-beta.1 — builds against the Revit 2024 and 2025 API, needs
> a real Revit install.** The add-in compiles for .NET Framework 4.8
> (Revit 2021–2024, against the 2024 API) and .NET 8 (Revit 2025+, against
> the 2025 API) with 0 errors. Its glTF writer's textured test cube passes
> the Khronos glTF-Validator with 0 errors and 0 warnings and builds on a
> real Verse server; the shared C# upload helper published GLB, OBJ (with
> units) and IFC, one-shot and resumable, and handled a dead server and a
> cancel (`web/test/fix-verify-aec.mjs`). The export of a real Revit model —
> tessellation, materials, links, the ribbon — has **not been run inside
> Revit** yet.

A **Verse** ribbon tab with **Publish to Verse**: the active 3D view is
walked by Revit's own tessellator and written as a binary glTF — one node
per element, so a click in the Verse link names the wall, door or family and
its level — with PBR materials from the render appearance. It uploads with
progress and gives you a streaming share link, copied and opened.

**You need:** Windows with Revit **2021–2024** (use `build/net48`) or
**2025+** (use `build/net8.0-windows`).

## 1. Install

Download **`VersePublish-Revit-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it (any OS with the .NET 8 SDK):

```sh
sh integrations/aec/revit/make_package.sh   # -> integrations/aec/revit/dist/VersePublish-Revit-4.0.0-beta.1.zip
```

From the zip, copy **`VersePublishRevit.dll`** and **`VersePublish.addin`**
from the folder matching your Revit (`build/net48/` or
`build/net8.0-windows/`) into `%APPDATA%\Autodesk\Revit\Addins\<year>\`.
Start Revit and accept the "load add-in" prompt once.

## 2. Server and key

**Verse ▸ Settings**: server URL (default `https://verse.ctruh.com`), API
key, account token (from Studio), bake lighting on the server (no / preview
/ final), tessellation detail 0–15, embed textures, open the link when done,
and **Use this server and key for every Verse plug-in**.

Nothing is compiled in. Settings live in the per-user file every Verse
plug-in shares, `%APPDATA%\Ctruh\VersePublish\settings.json`, in its `revit`
section (or `shared` when you tick "every plug-in"). A 4.0.0-beta.1 Revit
settings file at that path is read as-is. `VERSE_SERVER`, `VERSE_API_KEY`
and `VERSE_TOKEN` in the environment override the file — handy on a render
farm.

## 3. Publish

1. Open a 3D view (the `{3D}` view is fine).
2. **Verse ▸ Publish to Verse**. A window shows *Exporting… N elements*,
   then the upload %, then the server's build stages. **Cancel** works in
   every phase and tells you whether anything was published.
3. The *Published* dialog shows the link; it is on the clipboard and opens
   in the browser.

**Success looks like:** the *Published* dialog shows the link (also on the clipboard, and opened in the browser); the model opens upright, in metres, and clicking a wall names it.

Files over 100 MB use the resumable upload: a dropped connection continues where the server got to.

## What gets exported

- **Geometry:** every visible element in the view, through Revit's
  `CustomExporter` / `IExportContext`; family instances and Revit links keep
  their transforms. Feet → **metres**; Z-up → glTF Y-up.
- **Materials:** render-appearance colour, transparency, metal flag,
  glossiness → roughness; for *Generic* appearances, the base-colour bitmap
  at its real-world scale. If texture files are not found, the summary says
  so — set `VERSE_REVIT_TEXTURE_PATHS` (semicolon-separated) to your
  *Additional render appearance paths*.
- **Element data:** each node carries the Revit element id and category, so
  the link can name what was clicked.
- **Not exported:** RPC content (trees, people), lights — set *Bake* to let
  the server light the scene.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in **Verse ▸ Settings** (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in **Verse ▸ Settings**. |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| *"This project has no 3D view to export. Open or create a 3D view and publish again."* | Publishing exports a 3D view. | Open `{3D}` (or any 3D view) first. |
| *"The 3D view has no visible geometry to publish. …"* | Everything in the view is hidden or cut away. | Check the view's visibility settings and section box. |
| No **Verse** tab after starting Revit | Revit did not load the add-in (wrong folder or the wrong build for your Revit year). | `VersePublishRevit.dll` + `VersePublish.addin` from `build/net48` (2021–2024) or `build/net8.0-windows` (2025+) in `%APPDATA%\Autodesk\Revit\Addins\<year>\`; answer **Always Load**. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| `dotnet build`: net48 against the Revit 2024 API, net8.0-windows against the 2025 API | tested |
| GLB writer: textured cube → Khronos glTF-Validator 0 errors / 0 warnings; the server builds it | tested |
| Shared C# helper → real server (GLB / OBJ+units / IFC, one-shot + resumable, scene done and opening, dead server, cancel) | tested |
| Settings file shared with the Python and Ruby plug-ins | tested |
| Export of a real model, ribbon, dialogs inside Revit | **needs a real install** |

## Next

- [Publish from IFC](publish-from-ifc.md) — the other road out of Revit, with property sets
- [Publish from SketchUp](publish-from-sketchup.md) · [Rhino](publish-from-rhino.md) · [3ds Max](publish-from-3dsmax.md) · [Archicad](publish-from-archicad.md)
- [Bake for me](bake-for-me.md)
