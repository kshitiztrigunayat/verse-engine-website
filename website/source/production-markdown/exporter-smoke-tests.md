# Exporter smoke tests — runs in the real editors

All three "Publish to Verse" plug-ins have been run in the real editors.
This page records those runs and is the checklist to repeat on a new editor
version or before publishing new plug-in packages. Each run takes about 15
minutes; note the exact text of anything that fails.

| Plug-in | Verified on | Plug-in commit | What was run |
| --- | --- | --- | --- |
| Blender (`integrations/blender/verse_publish`) | Blender 5.0.1, Apple silicon, 2026-10-13 | packaged in 3.0.0-beta.1 | Installed as an Extension, N-panel publish (export → verse-prepare → upload → compile → link), dead-server error, bake-on-publish on four scenes. Also machine-tested headless by `web/test/fix-verify-blender.mjs`. |
| Unity (`integrations/unity/com.ctruh.verse-publish`) | Unity 6000.6.5f1, Apple silicon, 2026-10-13 | `9a7eed9` | Tarball install (glTFast resolved automatically), one-shot and resumable publish, link rendered textured; bake-on-publish on Boat Attack (URP 17, terrain), a URP interior and an HDRP room ([measured](guides/publish-from-unity.md#measured)). |
| Unreal (`integrations/unreal/VersePublish`) | Unreal Engine 5.8.3, Apple silicon, 2026-10-13 | `885fa8e` | Plug-in compiled by the editor, Tools ▸ Verse ▸ Publish to Verse clicked through on a Lightmass-lit level by the automation test that ships with the plug-in (`VersePublish.Window.PublishClickThrough`), console command and CI path on the same level. `IsBetaVersion` is `false`. |

The packages on [/downloads](https://verse.ctruh.com/downloads) are the
3.0.0-beta.1 builds of these commits; they work with a Verse Engine server
(the upload protocol is unchanged).

## Unity (Unity 6 recommended, 2021.3 minimum)

1. Build the package: `cd integrations/unity && ./make_tarball.sh` →
   `dist/com.ctruh.verse-publish-<version>.tgz`. Copy it to the Unity machine.
2. In a throwaway URP (or HDRP) project: Window ▸ Package Manager ▸ + ▸
   "Add package from tarball…" → select the .tgz. It must install with no
   console errors and pull `com.unity.cloud.gltfast` automatically.
3. Open **Tools ▸ Verse ▸ Publish Scene**. Expected: window with scene name
   (defaults to the open scene), server URL prefilled with production,
   token field (leave empty for an anonymous test), selection toggle.
4. Add a few cubes with materials + one textured object. Press Publish.
   Expected: progress runs export → upload % → "Compiling — <stage>" →
   done; the result URL is shown and auto-copied. Editor must stay
   responsive throughout; Cancel must work mid-upload if you retry.
5. Open the URL — the scene must load and match what you built.
6. Seams to watch: glTFast export API drift (errors mentioning
   `GameObjectExport`/`ExportSettings`) and textures arriving downscaled
   (they must be source resolution).

## Unreal (5.3 or newer; verified on 5.8.3)

1. Build the zip: `cd integrations/unreal/VersePublish &&
   ./make_plugin_zip.sh` → `dist/VersePublish-UE<engine>-<version>.zip`. On
   the Unreal machine, unzip into `<Project>/Plugins/VersePublish/`.
2. Open the project. When prompted, let it compile the plugin module
   (needs the engine's C++ toolchain) — record any build error verbatim.
3. Enable the built-in **glTF Exporter** plugin if prompted; restart.
4. Project Settings ▸ Plugins ▸ Verse Publish: confirm server URL default;
   token optional (stored per-user, never in shared config).
5. Tools ▸ Verse ▸ **Publish to Verse** (also on the level-editor
   toolbar). With a small test level: Publish. Expected: progress with
   upload % then compile stage text, result URL row with Copy/Open,
   auto-copy on success, Cancel functional, editor responsive. Or run the
   shipped automation test `VersePublish.Window.PublishClickThrough`.
6. Open the URL — level must load with textures at source resolution.
7. Seams to watch: GLTFExporter API drift
   (`UGLTFExporter::ExportToGLTF` / `UGLTFExportOptions`), the 5.3 vs 5.4
   progress-delegate split, Lightmass on Apple silicon
   (`ROSETTA_ADVERTISE_AVX=1`, see the guide).

## Still open

- The package versions still carry the `-beta.1` suffix (manifests:
  `blender_manifest.toml`, Unity `package.json`, `VersePublish.uplugin`
  `VersionName`). Dropping it means rebuilding the three packages and
  publishing them with `scripts/publish-downloads.mjs`.
- Store listings (Blender Extensions, Unity Asset Store, Fab) are not
  submitted.
