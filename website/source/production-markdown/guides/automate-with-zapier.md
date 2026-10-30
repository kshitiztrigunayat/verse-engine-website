# Automate Verse with Zapier

**Status:** the app is validated against the Zapier platform schema and
`zapier validate` (local), and its triggers and actions are exercised
against a mock server — it is **not yet published** to Zapier's app
directory. Until it is, it runs as a private integration you are invited
to; the source is `integrations/automation/zapier/` in the repo.

When a scene finishes compiling, a client pins a review comment, or a
compile fails, Zapier can post to Slack, drop a row in a sheet, or mail
the share link — without any code on your side. Going the other way, a
Zap can hand Verse a file link from Dropbox or Drive and get a scene back.

**You need:** a Verse account token (see
[Share privately with tokens](share-privately.md#1-get-an-account-and-own-the-scene))
and a Zapier account.

## 1. Connect your account

Add the **Verse Engine** app to a Zap. Zapier asks for two things:

- **Verse server** — the origin your account lives on (prefilled with the
  public host; self-hosters paste their own).
- **Account token** — the 64-hex token from `POST /v1/account` or `/studio`.

Zapier tests the connection with `GET /v1/account` and labels it with your
account name.

## 2. Triggers and actions

| | Name | What it does |
| --- | --- | --- |
| Trigger | **New Scene Ready** | Fires when an upload you own finishes: `job` (the scene id), `url` (the share link), `vpkUrl`. |
| Trigger | **Scene Failed** | Fires when a compile fails: `job`, the friendly `error` and its `code`. |
| Trigger | **New Review Comment** | Fires when a reviewer pins a comment: `scene`, `comment.text`, `comment.author`, `comment.pos`. |
| Action | **Upload Model From URL** | Hands Verse a public file link (GLB, IFC, USD, FBX/OBJ zip, splat, point cloud); returns the `job` id and the share link it will have. |
| Action | **Create Share Link** | Mints a tokened link for a scene you own — what opens a private scene. |
| Search | **Get Scene Analytics** | Views, unique viewers, time spent, funnel and rooms over the last 7, 30 or 90 days. |

The triggers are **instant**: turning a Zap on registers a webhook on your
account (`POST /v1/account/webhooks`, one event each); turning it off
deletes it. Nothing polls.

## 3. Worked example: new scene → Slack

1. **Trigger:** Verse Engine → *New Scene Ready*. Zapier loads your
   existing scenes as sample data so you can map fields before the first
   real upload.
2. **Action:** Slack → *Send Channel Message*. Message:

   ```
   New scene ready: {{job}}
   {{url}}
   ```

3. Turn the Zap on. The next upload you own (from `/app`, the Blender
   add-on, or the action below) posts its link the moment the compile
   finishes.

## 4. Worked example: Dropbox file → Verse scene

1. **Trigger:** Dropbox → *New File in Folder* (a `publish/` folder).
2. **Action:** Verse Engine → *Upload Model From URL*. **File URL:**
   Dropbox's *Direct Media Link* (or a shared link with `dl=1`). **Scene
   name:** the file name without extension.
3. The action returns `job`; the scene is live when a *New Scene Ready*
   Zap fires for it, or when `GET /v1/ingest/<job>` says `status: done`.

Uploads count against your account's ingest rate (20 per hour per token)
and the same 512 MB cap as a direct upload; the server fetches the file
itself, so the link must be public and direct.

## The same thing over HTTP

Everything the app does is a documented call: subscribe with
[`POST /v1/account/webhooks`](../api.md#webhooks-2-7), upload with
`POST /v1/ingest/url` `{ "url": "https://…/model.glb", "name": "flat" }`,
mint a link with [`POST /v1/scenes/<id>/share`](../api.md#scenes). A
Zapier *Webhooks by Zapier* step can do the same if you prefer not to
wait for the directory listing.
