# Publish from 3ds Max

> **Status: 4.0.0-beta.1 — upload core tested, needs a real 3ds Max
> install.** The pymxs script imports cleanly outside Max and its shared
> Python helper published GLB, OBJ (with units), IFC and **FBX** (the
> fallback this plug-in uses), one-shot and resumable, to a real local Verse
> server; every scene finished and opened; a dead server and a cancel each
> gave one plain sentence (`web/test/fix-verify-aec.mjs`). The MAXScript
> macros cannot be syntax-checked outside Max, and nothing has **been run
> inside 3ds Max** yet.

**Publish to Verse** as a toolbar button or quad-menu entry: the scene — or
the selection — is exported with 3ds Max's own **glTF exporter** (Physical /
Standard materials → PBR, system units → metres, Z-up → Y-up, textures
embedded), uploaded with progress, and the share link is copied and opened.
If the glTF exporter is not installed, it falls back to **FBX with embedded
media** and the server converts it.

**You need:** 3ds Max **2023 or newer** (Python 3 + pymxs; the glTF exporter
ships with 2023+). Windows.

## 1. Install

Download **`VersePublish-3dsMax-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/3dsmax/make_package.sh   # -> integrations/aec/3dsmax/dist/VersePublish-3dsMax-4.0.0-beta.1.zip
```

Unzip somewhere stable and keep the files together (`verse_publish_max.py`,
`verse_upload.py`, `verse_settings.py`, `VersePublish.ms`). Then
**Scripting ▸ Run Script… ▸ `VersePublish.ms`** — it registers three macros
in category **Verse** (*Publish to Verse*, *Publish selection to Verse*,
*Verse settings*). Drag them onto a toolbar from **Customize ▸ Customize User
Interface ▸ Toolbars**, or copy `VersePublish.ms` into
`<3ds Max>\scripts\startup\` to have them at every start (it finds the
Python files next to the original).

## 2. Server and key

The **Verse settings** macro asks for server URL (default
`https://verse.ctruh.com`), API key, account token (from Studio) and bake
lighting (blank / preview / final) at the MAXScript prompt.

Nothing is compiled in. They are stored in the per-user file every Verse
plug-in shares, `%APPDATA%\Ctruh\VersePublish\settings.json`, in its
`3dsmax` section; a server and key saved as shared from another tool apply
unless Max sets its own. `VERSE_SERVER`, `VERSE_API_KEY`, `VERSE_TOKEN`
override the file. A 4.0.0-beta.1 `~/.verse-publish.json` is imported once.

## 3. Publish

1. Run **Publish to Verse** (or **Publish selection to Verse**).
2. Max's progress bar shows *exporting → uploading % → building*; stages
   are logged in the MAXScript Listener. The progress bar's **Cancel**
   stops it and tells you whether anything was published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); the scene opens in metres whatever the system unit.

Files over 100 MB use the resumable upload: a dropped connection continues where the server got to. When the bundled
`verse-prepare` is present, GLB exports are prepared first.

## What gets exported

- **glTF road (2023+):** `exportFile … .glb` with the glTF exporter — PBR
  materials, metres, Y-up, textures embedded.
- **FBX fallback:** FBX with embedded media and `ConvertUnit m`; the server
  converts it (`convert.kind: fbx`, units from the FBX header) —
  [Upload FBX and OBJ](upload-fbx-obj.md).
- V-Ray / Corona materials are not translated by the glTF exporter; convert
  them to Physical materials first for the best match.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in **Verse settings** (the *Verse* macro) (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in **Verse settings** (the *Verse* macro). |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| No **Verse** category in *Customize ▸ Toolbars* | `VersePublish.ms` was not run (or was moved). | **Scripting ▸ Run Script** ▸ `VersePublish.ms` from the unzipped folder, then customise again. |
| *"The scene is empty — there is nothing to publish."* | No visible objects. | Unhide the scene, then publish again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Script imports and exits cleanly outside Max; `py_compile` | tested |
| Shared Python helper → real server (GLB / OBJ+units / IFC / FBX, one-shot + resumable, scene done and opening, dead server, cancel) | tested |
| Settings file shared with the Ruby and C# plug-ins | tested |
| `VersePublish.ms` syntax | **not checkable** without 3ds Max |
| Macros, exporter detection, progress bar, clipboard inside 3ds Max | **needs a real install** |

## Next

- [Publish from SketchUp](publish-from-sketchup.md) · [Revit](publish-from-revit.md) · [Rhino](publish-from-rhino.md) · [Archicad](publish-from-archicad.md)
- [Make it look good](make-it-look-good.md)
