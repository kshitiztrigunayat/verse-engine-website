# Publish from Rhino

> **Status: 4.0.0-beta.1 — upload core tested, plug-in builds, needs a real
> Rhino install.** The Rhino 8 script imports cleanly outside Rhino and its
> shared Python helper published GLB, OBJ (with units) and IFC, one-shot and
> resumable, to a real local Verse server; every scene finished and opened;
> a dead server and a cancel each gave one plain sentence. The RhinoCommon
> plug-in compiles for Rhino 7 (net48, RhinoCommon 7) and Rhino 8 (net7.0,
> RhinoCommon 8) with 0 errors (`web/test/fix-verify-aec.mjs`). Neither has
> **been run inside Rhino** yet.

Two ways in, same flow — Rhino's own glTF exporter writes the model (metres,
Y-up, materials and textures), it uploads with progress, and the share link
is copied and opened:

| | Rhino 8 Python script | RhinoCommon plug-in |
| --- | --- | --- |
| Rhino | 8 (CPython 3) | 7 and 8, Windows and Mac |
| Start | **Tools ▸ Script ▸ Run** → `VersePublishRhino.py` | `VersePublish` command |
| Settings | *Settings* option of the script | `VersePublishSettings` command |
| Cancel | **Esc** | **Esc** |

**You need:** Rhino **8** for the glTF exporter. On Rhino 7 the plug-in
loads but there is no glTF exporter: export OBJ or FBX yourself and upload
it with `python3 verse_upload.py <file> --units <unit>`.

## 1. Install

Download **`VersePublish-Rhino-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/rhino/make_package.sh   # -> integrations/aec/rhino/dist/VersePublish-Rhino-4.0.0-beta.1.zip
```

- **Script:** unzip and keep `script/` together (`VersePublishRhino.py`
  needs `verse_upload.py` and `verse_settings.py` beside it). Run it with
  **Tools ▸ Script ▸ Run**, or put `! _-RunPythonScript "<path>\VersePublishRhino.py"`
  on a toolbar button.
- **Plug-in:** drag `build/net48/VersePublishRhino.rhp` (Rhino 7, or Rhino 8
  on Windows) or `build/net7.0/VersePublishRhino.rhp` (Rhino 8's .NET 7
  runtime) onto Rhino, or **Tools ▸ Options ▸ Plug-ins ▸ Install**.

## 2. Server and key

The script's *Settings* option and the plug-in's `VersePublishSettings`
both ask for server URL (default `https://verse.ctruh.com`), API key,
account token (from Studio) and bake lighting; the script also has *open
link* and *run verse-prepare when found*.

Nothing is compiled in. Both store them in the per-user file every Verse
plug-in shares — `%APPDATA%\Ctruh\VersePublish\settings.json` on Windows,
`~/Library/Application Support/Ctruh/VersePublish/settings.json` on macOS —
in its `rhino` section, so the script and the plug-in always agree. Values
saved as shared from another tool (e.g. "every plug-in" in SketchUp or
Revit) apply unless Rhino sets its own. `VERSE_SERVER`, `VERSE_API_KEY`,
`VERSE_TOKEN` override the file. A 4.0.0-beta.1 `~/.verse-publish.json` is
imported once.

## 3. Publish

1. Script: choose **Publish** or **PublishSelection**. Plug-in: run
   `VersePublish` (option `SelectionOnly`).
2. The status bar / command prompt shows *exporting glTF → uploading % →
   building (stage)*. **Esc** cancels and tells you whether anything was
   published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); the model opens at its real size in metres.

If `-_Export` shows the glTF options dialog the first time, accept the
defaults once; Rhino remembers them for scripted exports.

## What gets exported

Everything visible (or the selection), as Rhino 8's glTF exporter writes it:
model units converted to **metres**, Y-up, render materials as PBR with
textures. When the bundled `verse-prepare` is present the script runs it
first ([verse-prepare](verse-prepare.md)). Files over 100 MB use the
resumable upload.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in the plug-in's settings (first run, or `VersePublishSettings`) (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in the plug-in's settings (first run, or `VersePublishSettings`). |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| *"Rhino did not write the glTF file. The glTF exporter needs Rhino 8; …"* | Rhino 7's script path has no glTF exporter. | Use the C# plug-in (`.rhp`) on Rhino 7, or Rhino 8. |
| *"Nothing is selected. Select the objects to publish, or turn off 'selection only'."* | *PublishSelection* with nothing selected. | Select objects, or run *Publish*. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Script imports and exits cleanly outside Rhino; `py_compile` | tested |
| Shared Python helper → real server (GLB / OBJ+units / IFC / FBX, one-shot + resumable, scene done and opening, dead server, cancel) | tested |
| Plug-in `dotnet build` for RhinoCommon 7 (net48) and 8 (net7.0) | tested |
| Settings file shared with the Ruby and C# plug-ins | tested |
| Export, progress, clipboard inside a running Rhino | **needs a real install** |

## Next

- [Publish from SketchUp](publish-from-sketchup.md) · [Revit](publish-from-revit.md) · [3ds Max](publish-from-3dsmax.md) · [Archicad](publish-from-archicad.md)
- [Upload FBX and OBJ](upload-fbx-obj.md) — the Rhino 7 road
