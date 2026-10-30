# Publish from Spline (and put the link in Figma)

> **Status: 4.0.0-beta.1 — the Spline path works today through the existing
> uploaders; the Figma plug-in is a skeleton.** Spline has **no editor
> plug-in API**, so there is no Verse button inside Spline. A GLB exported
> from Spline publishes like any GLB. The Figma plug-in's *Insert a Verse
> link* works with any server; its *Publish a GLB* uses an upload core that
> was tested in Node against a real local Verse server (one-shot, resumable,
> resize, dead server, cancel; `web/test/fix-verify-aec.mjs`), but **from
> inside Figma it needs the server to accept cross-origin uploads, which
> today's server does not** (below). Nothing has been run inside Figma yet.

## Spline → Verse

1. In Spline: **Export ▸ 3D formats ▸ glTF** and download the binary
   **`.glb`** (a multi-file `.gltf` must be zipped with its files, or
   re-exported as GLB).
2. Publish the file, any of these ways:
   - drop it on the Verse upload screen in the browser;
   - `python3 integrations/aec/shared/python/verse_upload.py scene.glb --server https://verse.ctruh.com`
     (prints the link; `--open` opens it);
   - the Figma plug-in below, if your server accepts uploads from it.
3. Check the size with the viewer's measure tool. Spline does not state a
   unit for its scenes; if the object comes out far too large, publish again
   from the Figma plug-in with **Size ▸ 1 unit = 1 cm (÷100)** (or ÷1000).
   This wraps the scene in one scale node; nothing else changes.

Spline-only features — states, events, interactions, the Spline runtime's
materials — are not part of a GLB and do not come across. Plain PBR
materials and textures do.

## 1. Install the Figma plug-in

1. Download **`VersePublish-Figma-4.0.0-beta.1.zip`** from the
   [downloads page](https://verse.ctruh.com/downloads) (or build it:
   `sh integrations/aec/figma/make_package.sh`) and unzip it.
2. In the Figma **desktop** app: **Plugins ▸ Development ▸ Import plugin
   from manifest…** and pick `manifest.json`.
3. Run **Plugins ▸ Development ▸ Verse Publish**; set the server URL (and an
   API key / account token if you have them).

**Success looks like:** *Insert a Verse link* puts the link on the canvas
as hyperlinked text; clicking it opens the 3D scene in the browser.

## The Figma plug-in

Figma is a 2D tool; the useful thing a plug-in can do is put the 3D link on
the canvas next to the design.

- **Insert a Verse link:** paste a link, it lands on the canvas as
  hyperlinked text. Works today.
- **Publish a GLB** (for example a Spline export) with a *Size* choice,
  progress and **Cancel**, then insert its link. **Blocked on the server
  today:** a Figma plug-in's UI runs with origin `null`, and an upload with
  Verse's headers needs a CORS preflight; `OPTIONS /v1/ingest` answers 404
  without `Access-Control-*` headers. Allowing cross-origin uploads to
  `/v1/ingest*` is a product and security decision (any web page could then
  upload from a visitor's browser), so it has not been changed. Until it is,
  the plug-in says: *"Could not reach the Verse server … (From Figma this also
  happens when the server does not accept uploads from plug-ins …)"*.

**Settings.** Figma sandboxes plug-ins, so the plug-in cannot read the
`settings.json` the desktop plug-ins share; its server URL, API key and
token are kept in Figma's per-user plug-in storage (`figma.clientStorage`).
A self-hosted server must also be added to `networkAccess.allowedDomains` in
`manifest.json`.

## Troubleshooting

Every problem ends in one sentence; the first words tell you which row applies.

| You see | What it means | Do this |
| --- | --- | --- |
| *"Could not reach the Verse server at … (From Figma this also happens when the server does not accept uploads from plug-ins …)"* | From inside Figma: the server does not accept cross-origin uploads (true of verse.ctruh.com today). Otherwise a wrong URL or no internet. | Publish the GLB with the upload card or `verse_upload.py` and use *Insert a Verse link*; check the server URL. |
| *"The Verse server at … did not recognise the account token …"* | The token is mistyped, revoked, or from another server. Nothing was uploaded. | Copy it again from **Studio**, or clear it. |
| *"The server did not accept your API key or account token …"* | The server only takes uploads with an API key. | Enter the key from the server's operator. |
| *"Upload limit reached: …"* | The hourly upload limit, or the key's daily quota. | Wait as the sentence says, or add an account token. |
| *"The server is busy right now. …"* / *"The server is out of storage. …"* | The server's build queue or disk is full. Your file is fine. | Publish again in a few minutes. |
| *"Only a binary glTF (.glb) can be resized here."* | *Size* was set for a file that is not a GLB. | Export GLB from Spline, or publish at the exported size. |
| *"Verse cannot build … files yet. Export the model as GLB (or FBX / OBJ) and publish that file instead."* | A STEP / CAD file was picked. | Export GLB and publish that. |
| The model is 100× too big | Spline wrote centimetres. | Publish again with **Size ▸ 1 unit = 1 cm (÷100)**. |

## What has been tested

| | |
| --- | --- |
| A GLB published by the shared CLI / upload screen | tested (every 4.0 gate) |
| Figma upload core: slug, URL rule, resize, STEP / empty sentences, resumable part order — offline; GLB one-shot, resumable, ÷100 cube, dead server, cancel — against a real local server | tested |
| The Figma UI, inserting the link, clientStorage inside Figma | **needs a real install** |
| Publishing from inside Figma | **blocked on server CORS** for `/v1/ingest*` |
| A real Spline export's units and materials | **needs a real Spline export** |

## Next

- [What you can upload](what-you-can-upload.md) · [Fidelity mode for products](fidelity-mode.md) · [Embed anywhere](embed-anywhere.md)
