# Verse API — Quickstart

Everything Verse does is a plain HTTP API — the playground, the embed SDK, and the
Blender, Unity and Unreal exporters are all clients of the same endpoints. Anything that can send
an HTTP request (a game-engine plugin, a Blender add-on, a CI pipeline, curl) can
turn a 3D file into a signed, streamed share link.

- **Base URL:** `https://verse.ctruh.com` (self-hosted: your origin)
- **Postman collection:** [/verse-api.postman_collection.json](/verse-api.postman_collection.json) — import and try every call
- **Full reference:** [docs/api.md](api.md) · Embed SDK: [docs/embed-sdk.md](embed-sdk.md) · JS/TS client: [docs/sdk.md](sdk.md) (`@ctruhtech/verse-sdk` — not on npm yet; build it from `sdk/` or load `/sdk/verse-sdk.js`)

## Authentication

Two modes, set by the server operator:

- **Open mode** (no key file configured — current default): no auth header needed.
  Uploads are rate-limited to **6/hour per IP** (**20/hour** per account
  token sent as `Authorization: Bearer`); publish endpoints (tour/poster/
  experience) to 30/hour per IP. Files up to **512 MB**, or **2 GB** when
  [prepared](guides/verse-prepare.md) and sent through the resumable
  upload; `GET /v1/limits` returns the live numbers.
- **Keyed mode**: send `X-Api-Key: <your key>` on uploads. Each key has a daily
  upload quota (default 512 MB/day). Bad or missing key → `401`; over quota → `429`.
  Keys are provisioned by the operator in `ingest/.verse-keys.json` (see
  [docs/api.md](api.md#authentication)).

## The core flow: file in → share link out

**1. Upload** — POST the raw bytes (no multipart):

```bash
curl -sS -X POST "$BASE/v1/ingest" \
  -H "Content-Type: model/gltf-binary" \
  -H "X-Verse-Name: my-apartment" \
  --data-binary @scene.glb
# → 202 {"job":"my-apartment-1a2b3c4d5e6f"}
```

Accepted inputs, auto-detected by magic bytes:

| You send | Detected as | Compiles to |
|---|---|---|
| `.glb` (binary glTF; Draco + KTX2 supported) | mesh scene | streamed `.vpk` |
| `.ply` or `.splat` (Gaussian-splat capture) | splat | streamed `.vsp` |
| `.ply` (points), `.las` / `.laz`, `.e57`, `.xyz` / `.pts` | point cloud | streamed point cloud |
| `.ifc`, `.usdz` / `.usd*`, `.fbx`, `.obj` (alone or zipped with textures), PLY mesh | converted to GLB on the server | streamed `.vpk` |
| a phone / LiDAR capture, a 3D tour export bundle's `.zip` | scan (cleaned up first) | Fidelity or streamed — see [Import a scan](scan-import.md) |

Force the kind for headerless formats with `X-Verse-Kind` (`splat`, `cloud`,
`ifc`, `usd`, `fbx`, `obj`, `ply`); the full header list (bake, Fidelity
path, look, scan, up axis, units) is in
[`POST /v1/ingest`](api.md#post-v1-ingest).
`X-Verse-Name` is optional (lowercase letters, digits, `-`, `_`); it prefixes the id.
Max body: **512 MB** (20 GB for a prepared GLB through the resumable upload).

**2. Poll** the job until `done` (typical: ~8 s per source MB, floor 15 s — the
record carries a live `stage` and `estimateS` so you can show honest progress):

```bash
curl -sS "$BASE/v1/ingest/my-apartment-1a2b3c4d5e6f"
```

```json
{
  "status": "done",
  "url":    "https://…/?vpk=ingest/my-apartment-1a2b3c4d5e6f.vpk",
  "vpkUrl": "https://…/ingest/my-apartment-1a2b3c4d5e6f.vpk",
  "stats":  { "tris": 182340, "clusters": 3271 },
  "signed": true
}
```

While compiling you get `{"status":"compiling","stage":"…","estimateS":…}`;
on failure `{"status":"error","error":"…","errorInfo":{…}}`. Splat jobs return `vspUrl` and
`stats: {splats, chunks}` instead. `signed: true` means the artifact carries an
Ed25519 signature the browser verifies against [`/v1/pubkey`](/v1/pubkey).

**3. Share.** `url` is the ready-to-open walkthrough. Embed it with the SDK
([docs/embed-sdk.md](embed-sdk.md)) or an iframe. Scenes uploaded with an
account token are kept; anonymous ones are kept best-effort and the
least-recently-opened are removed when the server's disk budget fills
([Retention](api.md#retention)).

## Publishing extras

| Endpoint | Body | Returns |
|---|---|---|
| `POST /v1/experience` | JSON `{scene, …}` per [experience-format](experience-format.md), ≤128 KB | `{path, url}` — a `?experience=` link |
| `POST /v1/tour` | JSON `{scene, samples:[[t,x,y,z,fx,fy,fz]×2..6000]}`, ≤512 KB | `{path, url}` — a `?tour=` link |
| `POST /v1/poster` | raw PNG, ≤4 MB | `{path, url}` — a poster image URL |

## Live presence (shared tours)

- `GET /v1/room/<id>/events` — Server-Sent Events roster stream (`id` = `[A-Za-z0-9_-]{1,64}`).
- `POST /v1/room/<id>/pose` — JSON `{id, name, color:"#rrggbb", pose:[x,y,z,fx,fy,fz]}` ≤2 KB, ~8 Hz.
  Peers expire after 10 s of silence; 32 peers per room. Rooms are ephemeral,
  in-memory, unauthenticated — treat room ids as capability URLs.

## Large files: resumable upload

Above ~100 MB, use the resumable flow so an edge hiccup resumes instead of
restarting: `POST /v1/ingest/begin {size, name}` → `{uploadId}`, ordered
`PUT /v1/ingest/part/<uploadId>` with `Content-Range`, then
`POST /v1/ingest/commit/<uploadId>` → the same `202 {job}`. An out-of-order
part answers `409` with the server's `received` offset to resume from.
Details: [Resumable uploads](api.md#resumable-uploads).

## Own, protect, review

- `POST /v1/account {name}` → a token (shown once) that owns what you upload
  with `Authorization: Bearer <token>`: permanent scenes, `/studio`, analytics.
- `PATCH /v1/scenes/<id> {"visibility":"private"}` + `POST /v1/scenes/<id>/share`
  → per-recipient share tokens; `?share=<token>` on the link.
  [Guide](guides/share-privately.md).
- `POST /v1/review/<id> {pos, text}` / `GET /v1/review/<id>` — comments
  pinned in 3D on the shared scene. [Guide](guides/collect-review-comments.md).

## Errors

Every error the app generates is JSON `{"error":"…"}` with a real status
**and the header `X-Verse-Error: 1`**: `401` unknown key, `404` unknown job,
`409` out-of-order part, `413` body too large, `429` rate/quota, `503` compile
queue full, `507` storage full. An error **without** the header came from the
network edge, not the app — that one is worth a retry. Back off on `429`/`503`;
re-upload on `error`. Full rule: [Error contract](api.md#error-contract).

## Building a plugin (Blender / Unity / Unreal)

An exporter needs exactly three calls: export the scene to GLB, `POST
/v1/ingest` (or the resumable trio), poll `GET /v1/ingest/<job>`, then hand
the user the `url`. The shipped integrations are the reference
implementations: `integrations/blender/verse_publish` (Extensions add-on,
stdlib-only, verified in Blender 5.0.1), `integrations/unity/com.ctruh.verse-publish`
(UPM package, verified in Unity 6000.6.5f1) and `integrations/unreal/VersePublish`
(editor plugin, verified in Unreal Engine 5.8.3). Each has a README and a how-to guide; the server URL is configurable,
so they work against the hosted service or a self-hosted origin identically.
Minimal single-file protocol examples remain under `tools/verselink-*`.
