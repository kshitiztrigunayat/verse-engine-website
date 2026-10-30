# Share privately with tokens

By default a published scene is **unlisted**: anyone with the URL can open
it, and it is listed nowhere. For a client review, a pre-launch project or
a paying customer you often want more — a scene that only the people you
chose can open, and the ability to cut one of them off later without
touching the others. That is what **private scenes** and **share tokens**
do.

**You need:** an account (free; the token is your credential) and a scene
you own. Every call below was run against a live server; `HOST` is your
Verse origin and `TOKEN` your account token.

## 1. Get an account and own the scene

Create the account once. The token is returned **once** — store it like an
API key:

```sh
curl -sS -X POST https://HOST/v1/account \
  -H "Content-Type: application/json" -d '{"name":"Studio North"}'
# → {"accountId":"acct-5fab29f5aa8e","name":"Studio North","createdAt":…,
#    "token":"<64 hex, shown once>", "note":"This token is shown once and IS your credential …"}
```

Scenes you upload **with** the token are owned automatically — send
`Authorization: Bearer TOKEN` on the ingest (the Blender, Unity and Unreal
exporters do this when a token is set in their preferences). An existing
anonymous scene can be claimed by id:

```sh
curl -sS -X POST https://HOST/v1/scenes/docs-demo-718035483f84/claim \
  -H "Authorization: Bearer TOKEN"
# → {"id":"docs-demo-718035483f84","owner":"acct-5fab29f5aa8e"}
```

Owned scenes are **permanent** (never evicted by the disk budget) and show
up in `/studio` and `GET /v1/account/scenes`.

## 2. Make it private

```sh
curl -sS -X PATCH https://HOST/v1/scenes/docs-demo-718035483f84 \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"visibility":"private"}'
# → {"id":"docs-demo-718035483f84","visibility":"private"}
```

From now on **every** artifact of the scene — the `.vpk`, its
`.stage.json` and `.plan.svg` sidecars, its poster — answers `404` to
anyone without access. The body is byte-identical to a missing file's, so
existence is never advertised; the only tell is an `X-Verse-Private: 1`
header, which the viewer app uses to say "This scene is private" instead
of "expired":

```sh
curl -sS -D - -o /dev/null https://HOST/ingest/docs-demo-718035483f84.vpk
# HTTP/1.1 404 Not Found
# X-Verse-Private: 1
```

You still see it yourself, with the Bearer token or the `/studio` session
cookie.

## 3. Mint a share token per recipient

```sh
curl -sS -X POST https://HOST/v1/scenes/docs-demo-718035483f84/share \
  -H "Authorization: Bearer TOKEN"
# → {"id":"0ca2f454","suffix":"629b","created":…,"shareToken":"<32 hex, shown once>"}
```

Mint one per person (up to 32 per scene). The 32-hex `shareToken` is shown
once and stored only as a SHA-256 hash; `id` is what you revoke by, and
`suffix` is the last four characters so you can tell links apart in a
list.

The link you send is the normal share link plus the token:

```
https://HOST/?vpk=ingest/docs-demo-718035483f84.vpk&share=<shareToken>
```

The app threads `?share=` onto every artifact fetch, including the render
worker's byte-range requests, so the recipient streams normally:

```sh
curl -sS -D - -o /dev/null -H "Range: bytes=0-1023" \
  "https://HOST/ingest/docs-demo-718035483f84.vpk?share=<shareToken>"
# HTTP/1.1 206 Partial Content
# Cache-Control: private, no-store
```

Programmatic clients can send `X-Verse-Share: <shareToken>` instead of the
query parameter. In an embed, pass it as the `share` option — see
[Embed the viewer](embed-the-viewer.md#private-scenes).

## 4. See who has access, and revoke

```sh
curl -sS https://HOST/v1/scenes/docs-demo-718035483f84/share -H "Authorization: Bearer TOKEN"
# → {"scene":"docs-demo-718035483f84","shares":[{"id":"0ca2f454","suffix":"629b","created":…}]}

curl -sS -X DELETE https://HOST/v1/scenes/docs-demo-718035483f84/share/0ca2f454 \
  -H "Authorization: Bearer TOKEN"
# → {"revoked":"0ca2f454"}
```

A revoked holder gets plain `404`s from the next request on. Other
recipients are unaffected. Deleting the scene, or losing ownership, kills
every token at once.

`/studio` does all of this per scene card: a visibility selector plus
create / copy / revoke for each share link, listed by suffix.

## What private scenes give up

- **No CDN.** With `VERSE_CDN_BASE` set, public and unlisted scenes
  redirect to the edge; a private scene never does — CDN copies are public
  bytes with no auth in front. Remote reviewers of a private scene pay
  origin round trips by design. Flipping an already-viewed public scene
  private does not purge an edge's copy; purge it there if the bytes must
  disappear (an operator topic; ask your Verse contact).
- **Review comments follow the same gate.** A private scene's pinned
  comments are readable and postable only with the owner's auth or a share
  token — see [Collect client review comments](collect-review-comments.md).

## Reference

- [Accounts & Studio](../api.md#accounts-studio) and
  [Visibility & share tokens](../api.md#visibility-share-tokens) in the
  API reference.
