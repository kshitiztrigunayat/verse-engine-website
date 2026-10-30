# Publish from Houdini

> **Status: 4.0.0-beta.1 — built and unit-tested, needs a real Houdini
> install.** The plug-in's code ran against a fake `hou`: the glTF / FBX ROP
> choice and parameters, cleanup of the temporary ROP, the world-space
> bounding box, scene-unit scaling, the interruptable operation (Esc =
> cancel), batch mode, settings, the shelf file and the package file. A GLB
> it exported was published to a real local Verse server and finished
> (`web/test/fix-verify-aec.mjs`). Nothing has **been run inside Houdini**
> yet.

A **Verse** shelf with **Publish to Verse**, **Publish Selection** and
**Verse Settings**. The geometry in `/obj` is written to GLB by a temporary
**ROP glTF Output**, uploaded with progress, and the share link is copied
and opened — a link that opens on any phone.

**You need:** Houdini **19.5 or newer** (Python 3). Windows, macOS or Linux.

## 1. Install

Download **`VersePublish-Houdini-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/houdini/make_package.sh   # -> integrations/aec/houdini/dist/VersePublish-Houdini-4.0.0-beta.1.zip
```

Unzip somewhere stable. In Houdini's **Windows ▸ Python Shell**:

```python
exec(open(r"C:/Tools/VersePublish-Houdini/install_houdini.py").read())
```

It writes `packages/VersePublish.json` in your Houdini preferences folder,
pointing at the unzipped `VersePublish` folder. Restart Houdini and add the
shelf with the shelf set's **+ ▸ Shelves ▸ Verse**.

## 2. Server and key

**Verse Settings** — server URL (default `https://verse.ctruh.com`), API key,
account token, bake lighting and **scene unit**. *Save for every Verse
plug-in* shares server, key and token with the other tools.

Nothing is compiled in. Settings live in the per-user `settings.json` every
Verse plug-in shares, `houdini` section (`%APPDATA%\Ctruh\VersePublish\` on
Windows, `~/Library/Application Support/Ctruh/VersePublish/` on macOS,
`~/.config/ctruh/verse-publish/` on Linux). `VERSE_SERVER`, `VERSE_API_KEY`,
`VERSE_TOKEN` override it — handy on a farm.

## 3. Publish

1. **Publish to Verse** (all geometry OBJ nodes in `/obj`) or select OBJ
   nodes and **Publish Selection**.
2. Houdini's interrupt dialog shows *uploading % → building stages*. **Esc**
   or its stop button cancels and tells you whether anything was published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); the geometry opens at its real size in metres.

**Batch / farm:** `hython -c "import verse_publish_houdini as v; v.publish_hip('shot.hip')"`
publishes `/obj` of a hip file and prints the link (no dialogs).

## What gets exported

- **GLB** through a temporary ROP glTF Output (`/out`, removed afterwards).
- **FBX** through a ROP FBX Output with embedded media if the glTF ROP is not
  available; the server converts it. Without the glTF ROP, *Publish
  Selection* takes one OBJ node at a time.
- **Units.** Houdini's convention, 1 unit = 1 metre, is glTF's, so nothing
  changes by default. A hip built in centimetres (or mm / in / ft) sets
  **Scene unit**; the GLB is then measured against the scene and wrapped in
  one metre-scale root node if needed.
- Packed primitives, instances and USD/Solaris stages: export what the glTF
  ROP supports; for a LOP network, publish its USD from the
  [IFC and USD guide](publish-from-ifc.md) instead.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in the **Verse Settings** shelf tool (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in the **Verse Settings** shelf tool. |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| No **Verse** shelf to add | The Houdini package from `install_houdini.py` was not loaded. | Run `install_houdini.py` again in the Python Shell and restart Houdini. |
| *"Houdini could not export the scene as glTF or FBX. …"* | No glTF / FBX ROP could render the scene. | Check a ROP glTF Output renders by hand, then publish again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| ROP choice and parameters, temporary ROP removed, world bounding box, scene unit, multi-selection FBX refusal, empty `/obj` / selection sentences, interrupt = cancel, batch mode, settings, shelf XML, package JSON — against a fake `hou` | tested |
| A GLB exported through the plug-in published to a real local server, scene done | tested |
| The glTF and FBX ROPs' parameter names in your build, the interrupt dialog during an upload, package + shelf loading inside Houdini | **needs a real install** |

## Next

- [Publish from Maya](publish-from-maya.md) · [Cinema 4D](publish-from-cinema4d.md) · [Blender](publish-from-blender.md)
- [Make it look good](make-it-look-good.md)
