# Publish from Archicad

> **Status: 4.0.0-beta.1 — upload and IFC road tested, needs a real Archicad
> install.** `verse_publish_archicad.py` published a sample IFC4 house to a
> real local Verse server — converted on the server, `status: done`, the
> object index (`.props.json`) served, the link opening — using the server
> saved with `--save-settings`; with no Archicad running, `--from-archicad`
> says in one sentence how to fix it (`web/test/fix-verify-aec.mjs`). Talking
> to a **running Archicad** through its JSON API has not been tested yet.

Archicad has no scriptable exporter and no in-app Python, so the road is:
**Archicad saves IFC** — its best export; the Verse server reads IFC
natively, one object per `IfcProduct` with storeys and property sets, so a
click in the link names the wall ([Publish from IFC](publish-from-ifc.md)) —
**or FBX**, and `verse_publish_archicad.py` uploads it with progress, prints
the share link, copies it and opens it.

**You need:** Archicad **23+** (any version that writes IFC2x3 / IFC4),
Python **3.8+** on the same machine. For `--from-archicad`: Archicad **26+**
with the *JSON Interface for Archicad* add-on.

## 1. Install

Download **`VersePublish-Archicad-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) once the packages
are published, or build it:

```sh
sh integrations/aec/archicad/make_package.sh   # -> integrations/aec/archicad/dist/VersePublish-Archicad-4.0.0-beta.1.zip
```

Unzip anywhere and keep the three Python files together. Stdlib only —
nothing to `pip install`.

## 2. Server and key

Save them once:

```sh
python3 verse_publish_archicad.py --save-settings --server https://verse.ctruh.com --api-key <key>
```

Nothing is compiled in. They are stored in the per-user file every Verse
plug-in shares — `%APPDATA%\Ctruh\VersePublish\settings.json` on Windows,
`~/Library/Application Support/Ctruh/VersePublish/settings.json` on macOS —
in its `archicad` section; values saved as shared from another tool apply
too. Precedence: flags, then `VERSE_SERVER` / `VERSE_API_KEY` /
`VERSE_TOKEN`, then the file. `python3 verse_settings.py archicad` shows what
is in effect (keys masked).

## 3. Export and publish

1. In Archicad: **File ▸ Save as…**, type **IFC** (or **IFC zip**),
   translator *General Export* (Geometry *BREP* where available, *Export
   property sets* on). Save it **next to the `.pln`**.
2. Run either
   ```sh
   python3 verse_publish_archicad.py model.ifc
   python3 verse_publish_archicad.py --from-archicad   # asks the running Archicad for the project, finds the IFC beside it
   ```
3. You see *Uploading… 100%*, *Converting*, the build stages, then the
   link — copied and opened (`--no-open` to skip). The Verse page opens with
   the *Objects* panel listing storeys and element types.

**Success looks like:** the script prints the build stages and the link (copied, and opened unless `--no-open`); the Verse page opens with the *Objects* panel listing storeys and element types.

For one button: a **Publisher** set with an IFC item and a post-publish
hook that runs the script — Publisher saves IFC without the dialog.

Files over 100 MB use the resumable upload: a dropped connection continues where the server got to. `Ctrl-C` cancels with a plain
sentence saying whether anything was published.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at …"* | Wrong server URL, no internet, or a firewall / proxy blocking the plug-in. | Check **Server URL** in `--save-settings` (or `settings.json`) (default `https://verse.ctruh.com`) and open it in a browser. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, was revoked, or belongs to another server. Nothing was uploaded. | Copy the token again from **Studio**, or clear it to publish without an account. |
| *"The server did not accept your API key or account token …"* | This server only takes uploads with an API key; the sentence ends with its reason. | Enter the key from the server's operator in `--save-settings` (or `settings.json`). |
| *"Upload limit reached: …"* | The hourly upload limit, or the API key's daily quota. | Wait as the sentence says, or add an account token from Studio (a higher limit). |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"The upload kept failing …"* | The connection dropped again and again. | Publish again when the connection is steady; a large upload continues where it stopped. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | STEP / IGES / native CAD files are not built by the server yet. | Export GLB (or FBX / OBJ) and publish that. |
| *"Stopped waiting for the server. The scene is still being built …"* | You cancelled after the upload; the server keeps building. | The scene appears in your Verse dashboard (with an account token) when it is ready. |
| *"Could not reach Archicad's JSON API on port …"* | `--from-archicad` needs Archicad 26+ with the JSON interface add-on. | **Options ▸ Add-On Manager**, enable it; `--port` if you changed it — or pass the IFC file instead. |
| *"No IFC or FBX export found beside the project …"* | The IFC was not saved next to the `.pln`. | **File ▸ Save as… ▸ IFC** next to the `.pln`, then run again. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| IFC → real server: converted, done, object index served, link opens | tested |
| `--save-settings` → the shared settings file; no Archicad → plain sentence | tested |
| Shared Python helper (GLB / OBJ+units / IFC / FBX, one-shot + resumable, dead server, cancel) | tested |
| `--from-archicad` against a running Archicad (`IsAlive`, `GetProjectInfo` field names) | **needs a real install** |

## Next

- [Publish from IFC](publish-from-ifc.md) — what the object index gives you
- [Publish from SketchUp](publish-from-sketchup.md) · [Revit](publish-from-revit.md) · [Rhino](publish-from-rhino.md) · [3ds Max](publish-from-3dsmax.md)
