# Automate Verse with Make

**Status:** the app definition is validated structurally (every module,
the connection and the webhook parse and reference the right Verse routes)
— it is **not yet published** to Make's app directory. Until it is, the
app is imported into your own Make organisation from
`integrations/automation/make/` in the repo and invited where it is needed.

A Make scenario can wait for a scene to finish compiling or for a client
to pin a comment, then post to Slack, write a sheet row or mail the share
link. Going the other way, it can hand Verse a Dropbox or Drive link and
get a scene back.

**You need:** a Verse account token (see
[Share privately with tokens](share-privately.md#1-get-an-account-and-own-the-scene))
and a Make account with the Verse Engine app installed.

## 1. Connect your account

When you add the first Verse Engine module, create a connection:

- **Verse server** — the origin your account lives on (prefilled with the
  public host; self-hosters paste their own).
- **Account token** — the 64-hex token from `POST /v1/account` or `/studio`.

Make tests the connection with `GET /v1/account` and names it after your
account.

## 2. Modules

| | Module | What it does |
| --- | --- | --- |
| Instant trigger | **Watch scene ready** | Runs when an upload you own finishes or fails: `data.job` (the scene id), `data.url`, `data.vpkUrl`, or `data.error` + `data.code`. |
| Instant trigger | **Watch review comments** | Runs when a reviewer pins a comment: `data.scene`, `data.comment.text`, `.author`, `.pos`. |
| Action | **Upload a model from a URL** | Hands Verse a public file link (GLB, IFC, USD, FBX/OBJ zip, splat, point cloud); returns `job` and the share link it will have. |
| Action | **Create a share link** | Mints a tokened link for a scene you own — what opens a private scene. |
| Action | **Get scene analytics** | Views, unique viewers, time spent, funnel, rooms and daily counts over 7, 30 or 90 days. |
| Search | **List scenes** | Every scene you own with its link, visibility, stats and open review count. |

Both triggers use one **Verse events** webhook. When you add the first
one, Make asks which events to subscribe to; it registers the hook on
your account (`POST /v1/account/webhooks`) and removes it when you delete
the webhook. If one hook carries several events, add a filter on `event`
after the trigger.

## 3. Worked example: new scene → Slack

1. **Watch scene ready** → *Add* a webhook, tick **Scene ready**.
2. **Slack → Create a Message**. Text:

   ```
   New scene ready: {{1.data.job}}
   {{1.data.url}}
   ```

3. Turn the scenario on. The next upload you own posts its link the moment
   the compile finishes.

## 4. Worked example: Dropbox file → Verse scene

1. **Dropbox → Watch Files** on a `publish/` folder, then **Dropbox → Get a
   Link** (direct).
2. **Verse Engine → Upload a model from a URL**. **File URL:** the direct
   link (`dl=1`). **Scene name:** the file name without extension.
3. The module returns `job`; the scene is live when *Watch scene ready*
   fires for it, or when `GET /v1/ingest/<job>` says `status: done`.

Uploads count against your account's ingest rate (20 per hour per token)
and the same 512 MB cap as a direct upload; the server fetches the file
itself, so the link must be public and direct.

## The same thing over HTTP

Every module is a documented call: subscribe with
[`POST /v1/account/webhooks`](../api.md#webhooks-2-7), upload with
`POST /v1/ingest/url` `{ "url": "https://…/model.glb", "name": "flat" }`,
mint a link with [`POST /v1/scenes/<id>/share`](../api.md#scenes). Make's
generic **HTTP** and **Webhooks** modules can do the same while the app is
unlisted.
