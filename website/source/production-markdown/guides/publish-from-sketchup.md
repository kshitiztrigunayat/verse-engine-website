# Publish from SketchUp

> **Status: 4.0.0-beta.1 — upload core tested, needs a real SketchUp install.**
> The extension's shared Ruby helper published GLB, OBJ (with units) and IFC
> files, one-shot and resumable, to a real local Verse server; every scene
> finished and opened; a dead server and a cancel each gave one plain
> sentence (`web/test/fix-verify-aec.mjs`). The zip writer's output passes
> Python's `zipfile.testzip()`. The SketchUp side — menu, exporter options,
> progress dialog — is written to SketchUp's documented Ruby API but has
> **not been run inside SketchUp** yet.

**Extensions ▸ Verse ▸ Publish to Verse** exports the open model with
SketchUp's own exporter, uploads it, shows the server's build stages, and
gives you a streaming share link — copied to the clipboard and opened in the
browser. Built for architects and real-estate teams who want a client link
without leaving SketchUp.

**You need:** SketchUp **2021 or newer**. SketchUp 2025+ exports GLB
directly; older versions export OBJ or FBX, which needs **SketchUp Pro**
(Free/Make cannot export them).

## 1. Install

Download **`verse_publish-sketchup-4.0.0-beta.1.rbz`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it from the repo:

```sh
sh integrations/aec/sketchup/make_rbz.sh   # -> integrations/aec/sketchup/dist/verse_publish-sketchup-4.0.0-beta.1.rbz
```

In SketchUp: **Window ▸ Extension Manager ▸ Install Extension**, pick the
`.rbz`. No restart needed. A **Verse** submenu appears under **Extensions**.

## 2. Server and key

**Extensions ▸ Verse ▸ Settings…** asks for:

| Field | What it is |
| --- | --- |
| Server URL | `https://verse.ctruh.com` by default; your own deployment works the same ([run your own server](run-your-own-server.md)) |
| API key | for servers that require one |
| Account token | from Studio — the scene becomes account-owned and you draw from your account's upload limit |
| Export format | auto (GLB on 2025+, else OBJ), glb, obj or fbx |
| Open the link when done / Selection only | |
| Use server + key for every Verse plug-in | saves them for Revit, Rhino, 3ds Max and Archicad too |

Nothing is compiled into the extension. Settings live in one per-user file
that every Verse plug-in shares — `%APPDATA%\Ctruh\VersePublish\settings.json`
on Windows, `~/Library/Application Support/Ctruh/VersePublish/settings.json`
on macOS — in a `sketchup` section (or the `shared` section when you tick
"every plug-in"). The file is owner-only on macOS. `VERSE_SERVER`,
`VERSE_API_KEY` and `VERSE_TOKEN` in the environment override it.

## 3. Publish

1. **Extensions ▸ Verse ▸ Publish to Verse** (or the toolbar button).
2. A progress dialog walks through **exporting → uploading % → building
   (stage) → done**. **Cancel** stops it; you are told whether anything
   reached the server.
3. The link is shown, copied, and opened when that setting is on.

**Success looks like:** the dialog ends with the link (also on the clipboard, and opened in the browser); the scene opens on any device at the real size — a 10 m wall measures 10 m.

Files over 100 MB use the resumable upload: a dropped connection resumes
where the server got to.

## What gets exported

- **SketchUp 2025+:** `model.export("….glb")` — binary glTF with materials
  and textures, uploaded as is.
- **Older, or format obj / fbx:** SketchUp's exporter with `units: "m"`,
  Y-up, texture maps on, faces triangulated; the model, its `.mtl` and
  texture folder are zipped and the server converts them
  ([Upload FBX and OBJ](upload-fbx-obj.md)).
- **Units:** SketchUp works in inches internally; the exporter writes
  metres, so a 10 m wall is 10 m in the link.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in **Extensions ▸ Verse ▸ Settings…** (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in **Extensions ▸ Verse ▸ Settings…**. |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| *"SketchUp could not export OBJ. OBJ export needs SketchUp Pro."* | SketchUp before 2025 has no GLB export, and Free/Make has no OBJ / FBX export. | Use SketchUp Pro, or SketchUp 2025+ with **Export format: glb**. |
| *"There is nothing to publish — the model is empty."* | No visible geometry (or nothing selected with *Selection only*). | Unhide the model or select it, then publish again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Shared Ruby helper → real server: GLB / OBJ+units / IFC, one-shot + resumable, scene done and opening, dead server, cancel | tested |
| Settings file shared with the Python and C# plug-ins (same values read back, env overrides, bad URL refused) | tested |
| `ruby -c` on every file; `.rbz` contents | tested |
| Menu, exporter calls, progress dialog, thread pumping inside SketchUp | **needs a real install** |

## Next

- [Publish from Revit](publish-from-revit.md) · [Rhino](publish-from-rhino.md) · [3ds Max](publish-from-3dsmax.md) · [Archicad](publish-from-archicad.md)
- [Share privately with tokens](share-privately.md)
- [Author a guided tour](author-a-guided-tour.md)
