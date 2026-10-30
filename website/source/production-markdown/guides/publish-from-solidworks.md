# Publish from SolidWorks (product CAD)

> **Status: 4.0.0-beta.1 — skeleton; the logic is unit-tested, the add-in
> needs a real SolidWorks install to build and run.** `PublishCore.cs` —
> what to export, the units check, the upload with progress and cancel,
> every error sentence — ran against a mock SolidWorks host, and a GLB and
> an IFC it exported were published to a real local Verse server and
> finished (`web/test/fix-verify-aec.mjs`). The add-in shell (`SwAddin.cs`,
> `SwHost.cs`, the forms) compiles only against the SolidWorks interop
> assemblies, which come with SolidWorks — it has **not been compiled or
> run** here. **STEP is not uploaded: the server cannot build CAD STEP yet**
> (below).

A **Verse** command group (menu and toolbar) in SolidWorks: **Publish to
Verse** exports the active part or assembly and uploads it with progress;
the share link is copied and opened — a link that opens on any phone.

**You need:** SolidWorks **2019 or newer**, Windows x64.

## 1. Build and install

Download **`VersePublish-SolidWorks-4.0.0-beta.1.zip`** from the
[downloads page](https://verse.ctruh.com/downloads) and unzip it. The
package is source until it is built on a machine with SolidWorks (the
interop DLLs are referenced from the install and never shipped):

```sh
sh integrations/aec/solidworks/make_package.sh   # -> dist/VersePublish-SolidWorks-4.0.0-beta.1.zip (source)
# on Windows with SolidWorks and the .NET SDK:
dotnet build -c Release -p:SolidWorksApi="C:\Program Files\SOLIDWORKS Corp\SOLIDWORKS\api\redist"
```

Then, in an administrator prompt:

```bat
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\RegAsm.exe /codebase VersePublishSolidWorks.dll
```

and tick **Verse Publish** under **Tools ▸ Add-Ins**. `RegAsm /u` removes it.

## 2. Server and key

**Verse settings…** — server URL (default `https://verse.ctruh.com`), API
key, account token, **export as** (auto / glb / ifc), bake lighting, open the
link when done, and *Use … for every Verse plug-in*.

Nothing is compiled in. Settings live in the per-user
`%APPDATA%\Ctruh\VersePublish\settings.json` every Verse plug-in shares,
`solidworks` section. `VERSE_SERVER`, `VERSE_API_KEY`, `VERSE_TOKEN`
override it.

## 3. Publish

1. Open a part or an assembly (the command is disabled for drawings) and
   choose **Publish to Verse**.
2. A progress window shows *uploading % → building stages*; **Cancel** stops
   it and tells you whether anything was published.
3. *Published!* — the link is on the clipboard and opens in the browser.

**Success looks like:** *Published!* with the link (also on the clipboard, and opened in the browser); a 250 mm part measures 0.25 m in the viewer.

## What gets exported

- **auto** (default): **GLB** through SolidWorks' own *Save As* when your
  version offers glTF/GLB; otherwise **IFC** (SolidWorks' IFC 2x3 / IFC 4
  export). The server builds IFC into one clickable object per product with
  its properties — [Publish IFC](publish-from-ifc.md).
- **Units.** SolidWorks reports the model's size in metres. The GLB is
  measured against it; if the exporter wrote millimetres (or cm, inches,
  feet), the scene is wrapped in one metre-scale root node — a 250 mm block
  measures 0.25 m in the link. IFC carries its own units.
- Appearances become glTF materials as SolidWorks' exporter writes them;
  decals and RealView-only effects do not carry over.

## STEP and the server-side CAD path

**Not available yet — nothing here pretends otherwise.** The Verse server
converts glTF, FBX, OBJ, IFC, USD, splats and point clouds; it has **no
B-rep / CAD kernel**, so it cannot tessellate STEP (AP203 / AP214 / AP242),
IGES, Parasolid or native SolidWorks files. A STEP file even begins with the
same `ISO-10303-21` line as IFC, so the server would try to read it as a
building model and fail with a confusing IFC error. Every Verse upload
helper (Python, Ruby, C#, JavaScript) now refuses those files before
uploading, with: *"Verse cannot build STEP files yet. Export the model as GLB
(or FBX / OBJ) and publish that file instead."*

**Next step (not built):** a server-side `step → glb` converter beside
`tools/ifc-convert` — an Open CASCADE-based tessellator (for example
`occt-import-js`, WASM, LGPL-2.1 with the OCCT exception — licence review
needed) behind `X-Verse-Kind: step`, with the sniffer telling STEP from IFC
by `FILE_SCHEMA` (`AUTOMOTIVE_DESIGN` / `AP242_…` vs. `IFC2X3` / `IFC4`),
one node per product with its name, chordal tolerance chosen from the model
size, then the ordinary mesh road. Until then: GLB or IFC from the add-in.

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
| *"Drawings have no 3D model to publish. …"* | The command works on parts and assemblies. | Open the part or assembly instead. |
| **Verse Publish** missing in *Tools ▸ Add-Ins* | The DLL was not registered for COM. | `RegAsm /codebase VersePublishSolidWorks.dll` from an administrator prompt, then restart SolidWorks. |

Anything else: send the whole sentence (and, for a build error, the scene name) to hello@ctruh.com.

## What has been tested

| | |
| --- | --- |
| Export choice (GLB → IFC fallback, forced GLB / IFC, STEP refused), drawing / no document / empty part sentences, GLB unit check (mm, in, metres), settings, dead server, cancel — mock SolidWorks host | tested |
| The mock host's GLB and IFC published to a real local server, scenes done | tested |
| Compiling the add-in shell; registration, menus, *Save As* to GLB (which versions offer it) and IFC, the bounding box calls, the forms inside SolidWorks | **needs a real install** |

## Next

- [Publish IFC](publish-from-ifc.md) · [Fidelity mode for products](fidelity-mode.md) · [View in AR](view-in-ar.md)
