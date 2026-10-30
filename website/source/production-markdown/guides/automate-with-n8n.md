# Automate Verse with n8n

**Status:** the `n8n-nodes-verse` package type-checks and builds, its
manifest and webhook-signature check are verified — it is **not yet
published** to npm or n8n's verified community nodes. Until it is, install
it from `integrations/automation/n8n/` in the repo (`npm link`) or from a
tarball on a self-hosted n8n.

n8n is the self-hosted option: a workflow waits for a scene to finish or a
comment to land, then does whatever its 400-odd other nodes do — Slack,
mail, sheets, your CRM. Going the other way, it can hand Verse a file
link, or the bytes of a file it already holds, and get a scene back.

**You need:** a Verse account token (see
[Share privately with tokens](share-privately.md#1-get-an-account-and-own-the-scene))
and an n8n instance (self-hosted, or cloud once the package is verified).

## 1. Install and connect

Self-hosted: *Settings → Community nodes → Install* `n8n-nodes-verse`
(after it is on npm), or `npm link` the folder into `~/.n8n/nodes`. Then
create a **Verse Engine API** credential:

- **Verse Server** — the origin your account lives on (prefilled with the
  public host; self-hosters paste their own).
- **Account Token** — the 64-hex token from `POST /v1/account` or `/studio`.

The credential test calls `GET /v1/account`.

## 2. Nodes

| Node | Resource · operation | What it does |
| --- | --- | --- |
| **Verse Engine Trigger** | events: Scene Ready, Scene Failed, Comment Added, Version Promoted, Configuration Changed | Registers a webhook on your account when the workflow is activated and removes it on deactivation. Each delivery is checked against the hook's secret (`X-Verse-Signature`) before the workflow runs. Output: `id`, `event`, `t`, `account` and the event's fields (`job`, `url`, `scene`, `comment`, …). |
| **Verse Engine** | scene · List | Every scene you own with link, visibility, stats, open review count. |
| | scene · Get Analytics | Views, unique viewers, time spent, funnel, rooms over 7, 30 or 90 days. |
| | scene · Create Share Link | Mints a tokened link (`shareUrl`) — what opens a private scene. |
| | scene · Set Visibility | `public`, `unlisted` or `private`. |
| | upload · From URL | Hands Verse a public file link; returns `job` and the share link it will have. |
| | upload · From Binary File | Sends the item's binary bytes to `POST /v1/ingest` — for files n8n already fetched (a Read Binary File, HTTP Request or Dropbox download node before it). |

## 3. Worked example: new scene → Slack

1. **Verse Engine Trigger**, events **Scene Ready**.
2. **Slack → Send a message**. Text:

   ```
   New scene ready: {{ $json.job }}
   {{ $json.url }}
   ```

3. Activate the workflow. n8n registers the webhook; the next upload you
   own posts its link the moment the compile finishes. Deactivating
   deletes the webhook.

## 4. Worked example: Dropbox file → Verse scene

Two ways, pick one:

- **By link** — Dropbox Trigger (new file) → **Dropbox → Get a shared
  link** → **Verse Engine → upload · From URL** with that link (`dl=1`)
  and the file name as **Scene Name**.
- **By bytes** — Dropbox Trigger → **Dropbox → Download** → **Verse Engine
  → upload · From Binary File** (binary property `data`). No public link is
  needed; the file goes from n8n straight to Verse, under the same 512 MB
  cap.

Either returns `job`; the scene is live when the trigger fires
`scene.ready` for it, or when `GET /v1/ingest/<job>` says `status: done`.
Uploads count against your account's ingest rate (20 per hour per token).

## The same thing over HTTP

Every operation is a documented call, so an **HTTP Request** node with the
bearer header does the same while the package is unlisted: subscribe with
[`POST /v1/account/webhooks`](../api.md#webhooks-2-7), upload with
`POST /v1/ingest/url` `{ "url": "https://…/model.glb", "name": "flat" }`,
mint a link with [`POST /v1/scenes/<id>/share`](../api.md#scenes). Verify
deliveries the way the [webhook section](../api.md#webhooks-2-7) shows.
