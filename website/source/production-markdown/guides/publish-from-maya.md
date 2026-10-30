# Publish from Maya

> **Status: 4.0.0-beta.1 — built and unit-tested, needs a real Maya
> install.** The plug-in's own code ran against a fake `maya.cmds`: which
> exporter it picks, the FBX flags, the units check, progress and Esc
> cancel, the menu and shelf commands, the settings and the drag
> installer. A GLB it exported (through the fake host) was published to a
> real local Verse server and finished (`web/test/fix-verify-aec.mjs`).
> Nothing has **been run inside Maya** yet.

**Publish to Verse** from a **Verse** menu and a **Verse** shelf: the scene —
or the selection — is exported as **GLB**, uploaded with progress, and the
share link is copied and opened. You get a link that opens on any phone.

**You need:** Maya **2022 or newer** (Python 3). Windows, macOS or Linux.

## 1. Install

Download **`VersePublish-Maya-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/maya/make_package.sh   # -> integrations/aec/maya/dist/VersePublish-Maya-4.0.0-beta.1.zip
```

Unzip somewhere stable and **drag `drag_to_install.py` onto a Maya
viewport**. It writes `VersePublish.mod` into your Maya `modules` folder
(pointing at the unzipped folder), adds the **Verse** menu and shelf now, and
`scripts/userSetup.py` adds them again at every start. To uninstall, delete
the `.mod` file the install dialog names.

## 2. Server and key

**Verse ▸ Verse settings…** — server URL (default `https://verse.ctruh.com`),
API key, account token (from Studio), bake lighting, open the link when
done. Tick *Use … for every Verse plug-in* to share server, key and token
with SketchUp, Revit, Rhino, Cinema 4D, Houdini and the rest.

Nothing is compiled in. Settings live in the per-user `settings.json` every
Verse plug-in shares (`%APPDATA%\Ctruh\VersePublish\settings.json` on
Windows, `~/Library/Application Support/Ctruh/VersePublish/settings.json` on
macOS, `~/.config/ctruh/verse-publish/settings.json` on Linux), `maya`
section. `VERSE_SERVER`, `VERSE_API_KEY`, `VERSE_TOKEN` override it.

## 3. Publish

1. **Verse ▸ Publish to Verse** (or the shelf button), or **Publish
   selection to Verse**.
2. Maya's progress window shows *uploading % → building stages*. **Esc**
   cancels and tells you whether anything was published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); a 250 cm cube measures 2.5 m in the viewer.

Files over 100 MB use the resumable upload: a dropped connection continues where the server got to.

## What gets exported

- **GLB**, when a glTF exporter is registered with Maya (*File ▸ Export All ▸
  Files of type* lists glTF / GLB). Maya does not ship one in every version;
  the plug-in uses any translator with "glTF" or "GLB" in its name and tries
  to load the common ones quietly.
- **Otherwise FBX** with embedded textures, through Maya's own `fbxmaya`
  plug-in, converted to metres and Y-up; the server converts it —
  [Upload FBX and OBJ](upload-fbx-obj.md).
- **Units.** Maya works in centimetres by default and glTF is metres. The
  plug-in measures the exported GLB against the scene's bounding box: if
  the exporter wrote the raw centimetre numbers, the scene is wrapped in one
  root node scaled to metres (no vertex is changed); if it already wrote
  metres, the file is left alone. A 250 cm cube measures 2.5 m in the link.
- Arnold / V-Ray shaders are not glTF materials; use *Standard Surface* or
  *aiStandardSurface* with plain textures for the best match.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in **Verse ▸ Verse settings…** (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in **Verse ▸ Verse settings…**. |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| No **Verse** menu after a restart | The Maya module written by `drag_to_install.py` is missing or moved. | Drag `drag_to_install.py` onto a viewport again from the folder you keep. |
| *"There is no geometry to publish."* | No mesh in the scene (or the selection has none). | Select meshes or their groups, then publish again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Exporter choice, FBX flags, GLB unit check, empty scene / selection sentences, progress + Esc, menu + shelf, settings, drag installer — against a fake `maya.cmds` | tested |
| A GLB exported through the plug-in published to a real local server, scene done | tested |
| The FBX road to the server | tested when the gate machine has Blender (the server converts FBX with it) |
| Which glTF exporter your Maya has, its options, the progress window, the Qt clipboard, menu + shelf inside Maya | **needs a real install** |

## Next

- [Publish from Cinema 4D](publish-from-cinema4d.md) · [Houdini](publish-from-houdini.md) · [3ds Max](publish-from-3dsmax.md) · [Blender](publish-from-blender.md)
- [Make it look good](make-it-look-good.md)
