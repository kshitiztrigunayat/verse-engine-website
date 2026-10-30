# Publish from Unreal

> **Status: verified on Unreal Engine 5.8.3 (Apple silicon), 2026-10-13.**
> The Publish to Verse window was clicked through on a real lit level (the
> Lumberyard Bistro interior, 1 M triangles, Unreal-native materials,
> Lightmass lighting): Tools ▸ Verse ▸ Publish to Verse → Publish → upload
> progress ("Uploading… 31 % (resumable, 8 MB parts)") → the server's
> compile stages → the link. The click-through is an editor automation test
> that ships with the plug-in (`VersePublish.Window.PublishClickThrough`,
> below). The console command and CI path are verified on the same level.

**Tools ▸ Verse ▸ Publish to Verse** exports the current level (or the
selected actors) to GLB with Epic's bundled glTF Exporter, streams the
upload with progress, shows the server's compile stages in the window,
and hands back a streaming link.

**You need:** Unreal Engine 5.3 or newer (verified on 5.8.3) with a C++
toolchain (Visual Studio or Xcode) — or a prebuilt plugin (below) — and the
engine's **GLTF Exporter** plugin (declared as a dependency, normally
enabled for you).

## 1. Install the plugin

### Download

Download **[VersePublish-UE5.8-3.0.0.zip](https://verse.ctruh.com/downloads/VersePublish-UE5.8-3.0.0.zip)**
(3.0 MB) from the [downloads page](https://verse.ctruh.com/downloads). It
is the source plug-in (the editor compiles it) with verse-prepare for
macOS (Apple silicon and Intel), Windows and Linux under `Resources/bin/`.
Check it before installing:

```sh
shasum -a 256 VersePublish-UE5.8-3.0.0.zip   # Windows: Get-FileHash VersePublish-UE5.8-3.0.0.zip -Algorithm SHA256
# 32385ecc8f96b71d04034f940b497a10432e5e680926727881e33c36a5a49ea3
```

Close the editor and unzip into your project so the descriptor lands at
`<Project>/Plugins/VersePublish/VersePublish.uplugin` (create `Plugins/`
next to the `.uproject` if needed).

Building from source instead:
`cd integrations/unreal/VersePublish && ./make_plugin_zip.sh` (→
`dist/VersePublish-UE5.8-3.0.0.zip`), then unzip it the same way.

Open the project. Let the editor compile the
plugin module when prompted; enable the GLTF Exporter plugin if asked and
restart.

Blueprint-only projects cannot compile plugin code on open. Build it once
against your engine and drop the result in instead:

```sh
"<UE>/Engine/Build/BatchFiles/RunUAT.sh" BuildPlugin \
  -Plugin="$PWD/integrations/unreal/VersePublish/VersePublish.uplugin" \
  -Package=/tmp/VersePublish-built -TargetPlatforms=Mac   # Win64 on Windows
```

Copy `/tmp/VersePublish-built` (minus `HostProject/`) to
`<Project>/Plugins/VersePublish/` and add the verse-prepare binary for your
platform under `Resources/bin/` (the zip from `make_plugin_zip.sh` already
carries it).

## 2. Settings

**Project Settings ▸ Plugins ▸ Verse Publish** (the window's **Settings…**
button jumps there):

| Setting | What it does |
| --- | --- |
| **Server URL** | Defaults to the hosted service. Set your own origin when you [run your own server](run-your-own-server.md). |
| **Resumable upload above (MB)** | Default 100. Exports larger than this go through the resumable upload (begin / 8 MB parts / commit): a dropped connection resumes where the server stopped instead of starting over. The window shows "(resumable, 8 MB parts)" next to the percentage. |
| **Account token** | Optional. Sent as `Authorization: Bearer`; owned scenes are permanent and managed from `/studio`, and draw from the per-token rate bucket (20/hour). Stored in **your per-user** `EditorPerProjectUserSettings.ini`, never in shared, source-controlled config. |

Setting the Server URL in an `.ini` by hand? Quote it —
`ServerUrl="http://localhost:8080"` — because `//` starts a comment in
Unreal config files and an unquoted URL is cut to `http:`. The plugin
detects that and says so instead of failing to connect.

## 3. Publish

1. **Tools ▸ Verse ▸ Publish to Verse** (also a toolbar button).
2. The scene name defaults to the level name. Tick **Selected actors only**
   for a subset.
3. Press **Publish to Verse**.

The window shows upload % and then the server's compile stage text
verbatim ("Compiling — geometry (41 s)"). **Cancel** works at any time; the
whole publish has a 30-minute budget. On success the URL appears with
**Copy** and **Open in Browser** and is copied to the clipboard; on failure
the server's error text is shown verbatim (quota, limit and auth messages
come straight from the app — the `X-Verse-Error` header is how the plugin
tells app errors from edge failures, and only the latter are retried once).

If the server cannot be reached at all, the window says so in plain
words ("Could not reach the Verse server at <host>. Check the Server URL …")
instead of a transport error.

## Publish from a script or CI

The console command runs the same export → prepare → upload → compile
chain without the window:

```
VersePublish.Publish [scene-name] [server=<url>] [bake=auto|on|off] [quality=draft|high] [resumable=<MB>] [from=<glb>] [strict=1] [wait] [quit]
VersePublish.BakeGlb <in.glb> [out.glb] [high]     # the lighting bake on a saved export
```

From the Output Log, `-ExecCmds`, or Python
(`unreal.SystemLibrary.execute_console_command(None, "VersePublish.Publish my-scene wait quit")`
in a script passed with `UnrealEditor-Cmd <project> -ExecutePythonScript=…`).
`wait` pumps HTTP until done (needed when the script would otherwise
return first); `quit` exits with status 0 on success, 1 on failure. Each
phase is logged under `LogVersePublishHeadless` and the result is written
to `Saved/VersePublish/last-publish.json` (with `uploadBytes`,
`resumable`, `missingMaterials`, `keptExport`, `retry` and per-phase
`timings`).

- **A failure never deletes the export.** After the export has finished, a
  failed prepare / upload / compile moves the GLB to
  `Saved/VersePublish/failed/<scene>-<yyyymmdd-hhmmss>.glb` (the newest 2
  are kept) and logs `retry from this export: VersePublish.Publish <scene>
  from=failed/<file>.glb wait` plus the full `UnrealEditor-Cmd` line.
  `from=<glb>` (absolute, or relative to `Saved/VersePublish/`) publishes
  that file without re-exporting; one already marked by verse-prepare is
  uploaded as is.
- **Missing material libraries** are checked before the export: packages
  the level's meshes and materials reference that do not exist (Megascans /
  Fab content without the Fab plug-in — `/Bridge/MSPresets/…`,
  `/Fab/Materials/Standard/M_MS_Srf`) and material instances whose parent
  did not load. Each is logged as a warning with the fix (install the Fab
  plug-in for Unreal 5.8 from the Epic Games Launcher); the window shows
  the same in yellow. `strict=1` refuses to export instead.
- **Invalid numbers.** Unreal 5.8's glTF exporter can write `inf` / `nan`
  (`"ior":inf`), which is not JSON; they are replaced with safe values right
  after the export (`export fix — … ior: inf -> 1.5` in the log).
- **Two Sided Foliage** materials (exported by the engine as Default Lit)
  become double-sided foliage: BLEND → MASK at 0.5,
  `extras.verse.material = "foliage"` (two-sided leaf shading with back-lit
  translucency and wind sway in Verse) and
  `KHR_materials_diffuse_transmission` 0.35 for other viewers. The
  subsurface colour and its per-pixel mask are approximated (white
  transmission tinted by the base colour).
- **verse-prepare not found** (optional — without it the server prepares the export): the log names
  the exact path to put the binary at (`<plugin>/Resources/bin/verse-prepare-darwin-arm64`
  on Apple silicon) and where to get it. A plug-in built from source in the
  repo finds `target/release/verse-prepare`; `sh bundle_prepare.sh` puts
  the Mac binaries into `Resources/bin` before RunUAT BuildPlugin. A window publish logs every phase
under `LogVersePublishWindow` and writes
`Saved/VersePublish/last-window-publish.json`.

**Click-through test.** The plug-in carries an editor automation test that
does what a person does: checks the Tools ▸ Verse ▸ Publish to Verse entry,
opens the window, presses **Publish to Verse** and waits for the link,
saving snapshots of the window (`Saved/VersePublish/window-*.png`):

```
UnrealEditor <proj> <map> -ExecCmds="Automation RunTests VersePublish.Window.PublishClickThrough;Quit"
```

The export fixes and the kept export have editor-free tests too:

```
UnrealEditor-Cmd <proj> -ExecCmds="Automation RunTests VersePublish.GlbFix;Quit" -unattended -nullrhi
```

## Bake materials & lighting (bake-on-publish)

Unreal materials are graphs, and built (Lightmass) lighting lives in
lightmaps that only Unreal's own viewer reads, so a plain glTF export loses
the lighting and scenes arrive flat. The window's **Bake materials &
lighting** checkbox (and Project Settings ▸ Plugins ▸ Verse Publish ▸ Bake)
bakes them in the editor before upload:

| Setting | |
| --- | --- |
| **Bake materials & lighting** (tri-state: Auto / On / Off) | Auto is **on for scenes** (built lighting present, 6+ static meshes, 2+ lights or ≥ 3 m across) and **off for a single product**. |
| **High quality** | Off (Draft): material bakes up to 1K, lightmap bakes up to 1K per actor at 96 px/m. On (High): material bakes up to 2K, lightmap bakes up to 4K per actor at 256 px/m. |

**Materials.** The engine's glTF exporter renders every non-trivial
material input (node graphs, material functions, layers) through the
Material Baking module (`BakeMaterialInputs = UseMeshData`); the bake sets
its size from the largest texture in the graph, capped by the quality.

**Lighting.** The exporter carries each actor's lightmap
(`EPIC_lightmap_textures`). The plug-in then rewrites the GLB: every
triangle of a lit actor is rasterised in its lightmap UV space; per texel the
base colour (the exporter's baked texture × factor) is multiplied by the
lightmap decoded with Unreal's own HQ formula (LightmapCommon.ush — log
luminance with the second layer's residual, black point, UVW scale/add) plus
emission, then put through the editor's filmic tone curve. The actor is
exported with one emissive-only `<actor>_Baked` material on the lightmap UV
set — the shape Verse renders unlit. Movable actors in a baked level get an
emissive copy of their material lit by the level's average baked light (never
black), the punctual lights are dropped (they are in the bake) and the
extension is removed. Only the JSON and the touched accessors/images are
read; the binary chunk streams into the new file in 16 MB blocks. Progress
and Cancel: `Baking lightmaps 12 / 48` (FScopedSlowTask).

Console / CI: `VersePublish.Publish <name> bake=auto|on|off quality=draft|high
[server=<url>] wait quit`; `Saved/VersePublish/last-publish.json` carries a
`bake` object (lightmaps carried, materials made, textures, ambient-lit,
lights removed, seconds).

**Exposure and tone.** The bake applies what the viewport applies: the
level's exposure (an unbound post-process volume with manual exposure is
reproduced exactly; auto exposure is estimated from the baked light — middle
grey on the log-average) and Unreal's own tone mapper (the filmic curve in
ACEScg with gamut expansion and blue correction). Metals keep only a dim
share of their base colour (Unreal gives them no diffuse light; their
reflections cannot be baked). A level whose lights are all Movable has
empty lightmaps: the plug-in then leaves the lighting live instead of
baking a black scene. Lightmaps leave the engine's glTF exporter
gamma-encoded (its canvas renders at gamma 2.2); the bake decodes that.

**Building lighting on macOS (Apple silicon).** Lightmass works — a
Preview build of the 1 M-triangle Bistro interior with 11 static lights
takes about 15 s — once two things are true:

1. **`ROSETTA_ADVERTISE_AVX=1` is in the editor's environment.**
   UnrealLightmass on Mac ships as an x86_64 binary and runs under Rosetta
   2, which does not advertise AVX by default; Embree then fails to create
   its device and Lightmass dies with
   `Assertion failed: rtcGetDeviceError(EmbreeDevice) == RTC_ERROR_NONE`
   (`Engine/Programs/UnrealLightmass/Saved/Logs`, or
   `~/Library/Logs/Unreal Engine/UnrealLightmass`). The editor only says
   "Lighting build failed". Start the editor from a shell with the
   variable set (`ROSETTA_ADVERTISE_AVX=1 open -a UnrealEditor` does not
   pass it — launch the binary
   `.../UnrealEditor.app/Contents/MacOS/UnrealEditor` directly, or set it
   with `launchctl setenv ROSETTA_ADVERTISE_AVX 1` before opening the
   editor).
2. **The build runs in a ticking editor with no other Unreal editor
   open.** There is no Swarm Agent on Mac: the editor and Lightmass pair
   over UDP messaging (`SwarmInterfaceLocal.cpp`) and Lightmass takes the
   first editor that answers its ping. A second open editor can take the
   job; a commandlet (`-run=resavepackages -buildlighting`) never answers
   (its game thread is blocked) and Lightmass gives up with "Timed out
   waiting for the recipient". A Wi-Fi network change during a build also
   lost the pairing once — rebuild.

`integrations/bake-proof/unreal_build_lighting.py` builds a map from a
script this way; `integrations/bake-proof/unreal_bistro_level.py` builds the
whole proof level (import, materials, lights, Lightmass).

**Measured (2026-10-13, UE 5.8.3, M5 Pro).** The Bistro interior (OBJ →
GLB, 66 meshes, 1 M triangles), dressed in Unreal-native materials — a
master material with parameters calling a material function (`MF_Grime`),
14 material instances of it, a layered material (brass / iron attribute
layers blended by a mask) and a procedural tile floor — lit by 11 static
point lights at the model's own lamps (Lightmass Preview, lightmaps
32–256). Editor frame vs the published link at the editor camera,
CIEDE2000 mean over the frame (`compare.mjs`, black backdrop like the
editor's):

| | bake off | Draft | High |
| --- | --- | --- | --- |
| ΔE2000 mean / median | 45.5 / 46.8 | **17.9 / 16.7** | 19.1 / 14.1 |
| SSIM | 0.02 | 0.57 | 0.58 |
| publish, click to link | 26 s | 36 s (1.4×) | 123 s |
| bake step | — | 5.6 s | 63 s |

Bake off arrives flat and, on this level, through the compatibility
fallback (the streamed compile rejected the export's light nodes as out of
bounds), so it does not frame like the editor at all. The remaining gap
with the bake on is mostly the viewer's own finishing (it re-exposes a
baked scene to a median of 0.40 and adds its post effects) and the tone
mapper's red handling (Unreal's RRT red modifier and glow are not
reproduced); the target of ΔE ≤ 15 is met on the median for High, not on
the mean.

**Limits.** Directionality is approximated (Unreal's non-directional 0.6
factor); stationary/movable lights' direct light is not in a lightmap and
therefore not in the bake. Translucent and masked primitives keep their live
material. Without built lighting the bake only raises the material bake
size.

## The prepare step (2.3)

Between export and upload the plug-in runs **verse-prepare** on the GLB:
textures are right-sized to the texel density the scene can show (default
2048 px/m — one texel per screen pixel at arm's length), opaque base colour
goes to JPEG 92 (everything else stays lossless), duplicate meshes are
instanced and unreferenced data is dropped. The panel shows the tool's own
progress and result. Prepared files may be up to **20 GB**; without the tool,
exports upload as they are up to the plan's raw upload limit (the server
prepares them) and the log carries the install hint. Preferences: prepare on/off, the
binary path, texels per metre, lossless. Details, flags and how the binaries
are bundled: [verse-prepare](verse-prepare.md).

## What gets exported

GLB with embedded textures at **source resolution** — nothing is
downscaled or recompressed. The Verse pipeline preserves up to 4K per
material on its hero tier, and base colour above 4K (8K, 16K) at full
detail through virtual texturing, so bake lightmaps at the quality
you want published; downscaling before upload permanently caps the result.

## Known issues with Unreal exports (October 2026)

Found reviewing a large Unreal exterior against Unreal's own
renders of the same cameras. Where Verse now corrects for the exporter it
says so; the rest are open.

- **Sun direction: under investigation, not fixed.** The export's
  directional light (the level's Unreal Sun) arrives as engine azimuth
  101.1°, elevation 25.6°. On the review cameras, Unreal's rendered
  shadows match azimuth 281°: the same elevation, the opposite side of
  the sky. Whether the sign is lost in the glTF exporter or in how Verse
  reads the light is not yet known. Until it is, check the shadows on the
  link against the editor and set the sun on the link (`?sun=`) or in the
  Sun panel (and save the look) if they disagree.
- **Ultra Dynamic Sky drives the sun at runtime.** Its Blueprint sets the
  sun's direction, colour and intensity when the game runs, so the
  directional light the exporter sees is the editor-time actor and need
  not match what Unreal renders. Its sky dome is exported as a mesh
  (reported as "sky dome"); Verse draws its own sky.
- **Unset materials arrive as rough metal.** Where the exporter does not
  write a material's surface (graph-driven plaster, slate, travertine,
  wood, concrete, fabric), it leaves glTF's defaults, metallic 1 /
  roughness 1, which renders dark. The compiler in the next release (not yet on
  production) reads exactly (1, 1) with no metallic-roughness texture as
  a non-metal, unless the material's name contains a metal word (metal,
  steel, chrome, silver, gold, bronze, brass, copper, aluminium, iron,
  nickel, titanium): name real metals accordingly. Leaves and walls
  exported with metallic factor 1 and the real ~0 in the texture are
  handled on staging by folding in the texture's mean.
- **Graph-driven roughness is lost.** A roughness computed in the material
  graph can be exported as a bare factor: one scene's pavers arrived at
  roughness 0.1 (a mirror of the sky) and its asphalt at 50 % metal. This
  is not detected. Fix it in Unreal with a plain roughness/metallic input,
  or patch the compiled scene with `verse-matfix --surface
  PREFIX=rough,metal` (an operator tool).
- **Translucent glass arrives OPAQUE.** The exporter drops a Translucent
  material's blend mode. On staging, an opaque material whose name says
  glass or glazing (whole word) is drawn as glass with 0.8 transmission;
  other translucent materials need a glass name or
  `KHR_materials_transmission`.
- **Baked re-exports carry no lights.** A level exported with baked
  lighting has no `KHR_lights_punctual`, so the scene falls back to the
  default sun. Set the sun on the link, or (operators) copy the
  directional lights of an unbaked export of the same level into the
  scene's stage with the stage-sun tool in the repository's `tools/` folder.

## Known seams to watch

- GLTFExporter API drift (`UGLTFExporter::ExportToGLTF`,
  `UGLTFExportOptions`, the lightmap canvas gamma) — unchanged through 5.8.
- The 5.3 vs 5.4 progress-delegate split.
- Lightmass on Apple silicon needs `ROSETTA_ADVERTISE_AVX=1` (above).

## Next

- [Share privately with tokens](share-privately.md)
- [Embed the viewer](embed-the-viewer.md)
- [Publish from Unity](publish-from-unity.md)
