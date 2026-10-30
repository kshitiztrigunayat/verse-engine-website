# Publish from Cinema 4D

> **Status: 4.0.0-beta.1 — built and unit-tested, needs a real Cinema 4D
> install.** The plug-in's code ran against a fake `c4d` module: glTF vs.
> FBX, the exporter options, the document's units and bounding box, the
> units check, selection isolation, the dialog's timer-driven progress, the
> link on the clipboard, Cancel and the settings. A GLB it exported was
> published to a real local Verse server and finished
> (`web/test/fix-verify-aec.mjs`). `VersePublish.pyp` parses but has not
> **been run inside Cinema 4D** yet.

Three commands under **Extensions ▸ Verse Publish**: **Publish to Verse**,
**Publish selection to Verse** and **Verse settings…**. The document is
exported with Cinema 4D's own **glTF exporter** as GLB, uploaded with
progress, and the share link is copied and opened — a link that opens on
any phone.

**You need:** Cinema 4D **2023 or newer**. Windows or macOS.

## 1. Install

Download **`VersePublish-Cinema4D-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/cinema4d/make_package.sh   # -> integrations/aec/cinema4d/dist/VersePublish-Cinema4D-4.0.0-beta.1.zip
```

Unzip and copy the **`VersePublish`** folder into Cinema 4D's plugins folder
(**Preferences ▸ Open Preferences Folder… ▸ `plugins`**), or add the unzipped
folder under **Preferences ▸ Plugins ▸ Search Paths**. Restart Cinema 4D.

## 2. Server and key

**Extensions ▸ Verse Publish ▸ Verse settings…** — server URL (default
`https://verse.ctruh.com`), API key, account token (from Studio), bake
lighting, open the link when done, and *Use … for every Verse plug-in*.

Nothing is compiled in. Settings live in the per-user `settings.json` every
Verse plug-in shares (`%APPDATA%\Ctruh\VersePublish\settings.json` on
Windows, `~/Library/Application Support/Ctruh/VersePublish/settings.json` on
macOS), `cinema4d` section. `VERSE_SERVER`, `VERSE_API_KEY`, `VERSE_TOKEN`
override it.

## 3. Publish

1. **Publish to Verse** — or select objects and **Publish selection to
   Verse** (they are copied into a temporary document; yours is untouched).
2. A small dialog shows *uploading % → building stages*, and the status bar
   shows progress. Cinema 4D stays usable. **Cancel** (or closing the
   dialog) stops it and tells you whether anything was published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); a 100 cm cube measures 1 m in the viewer.

## What gets exported

- **GLB** through Cinema 4D's glTF exporter (binary, current frame).
- **FBX** with embedded textures if the glTF exporter is unavailable; the
  server converts it — [Upload FBX and OBJ](upload-fbx-obj.md).
- **Units.** Cinema 4D's default unit is the centimetre. The plug-in reads
  the document unit and measures the exported GLB against the document's
  bounding box; raw centimetre numbers are wrapped in one metre-scale root
  node (no vertex changed), metres are left alone. A 100 cm cube measures
  1 m in the link.
- Redshift / Octane materials are not glTF materials; bake or use standard
  materials with image textures for the best match.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in **Extensions ▸ Verse Publish ▸ Verse settings…** (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in **Extensions ▸ Verse Publish ▸ Verse settings…**. |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| No **Verse Publish** entries under **Extensions** | The `VersePublish` folder is not in Cinema 4D's `plugins` folder, or the Console shows a load error. | Copy the folder (not its contents) into `plugins`, restart, and check **Extensions ▸ Console**. |
| *"Cinema 4D could not export the document as glTF or FBX. …"* | Neither exporter ran. | Check **File ▸ Export** works by hand, then publish again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Export choice and options, units, bounding box through child matrices, selection isolation, empty document / selection sentences, the polled session, clipboard, Cancel, settings — against a fake `c4d` | tested |
| A GLB exported through the plug-in published to a real local server, scene done | tested |
| `VersePublish.pyp` parses | tested |
| The glTF exporter's option names in your version, `SaveDocument`, the async dialog and timer, the command registration inside Cinema 4D | **needs a real install** |

The plug-in uses Maxon's development-only command IDs (1000001–1000003); a
public release needs registered IDs.

## Next

- [Publish from Maya](publish-from-maya.md) · [Houdini](publish-from-houdini.md) · [Blender](publish-from-blender.md)
- [Make it look good](make-it-look-good.md)
