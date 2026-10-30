# Collect client review comments

A share link doubles as a review round. Your client opens it, clicks any
spot in the scene and types a note; the comment is pinned to that exact 3D
position and everyone who opens the link sees the numbered pin. You, as the
owner, resolve or delete pins and watch the open count fall. No client
account is needed.

**You need:** a published scene. To moderate, you need to own it (see
[Share privately with tokens](share-privately.md#1-get-an-account-and-own-the-scene)
for creating an account and claiming a scene). Every call below was run
against a live server.

## 1. Send the link

Any share link works: `https://HOST/?vpk=ingest/<id>.vpk`. For a private
scene, send a per-reviewer tokened link
(`…&share=<shareToken>`) — comments are gated exactly like the scene
bytes, so a stranger without the token gets a `404` from the review routes
too.

## 2. What the reviewer does

1. Once the scene is up, a **Review** chip appears. They toggle it on.
2. They click a surface — orbit or walk mode alike (the pick is GPU-side,
   so it works on streamed scenes of any size) — and a small composer opens
   at that spot.
3. They type the note (up to 500 characters), optionally their name, and
   post. A numbered pin appears, projected from world to screen and faded
   with distance.

Existing pins open on click to show the note. Pins are capped at 200 per
scene; posting is rate-limited to 60 per hour per IP.

## 3. What you see

Open the same link signed in (the `/studio` session cookie, or the token
pasted into the playground) and every pin gains **Resolve** and
**Delete**. Resolved pins grey out and hide behind a **show resolved**
toggle. Your `/studio` scene cards show `open / total` per scene, as does
`GET /v1/account/scenes` (`reviews: { open, total }`).

## The same thing over HTTP

Useful for a review dashboard of your own, or to pull comments into an
issue tracker.

Post a comment (anonymous; `author` optional):

```sh
curl -sS -X POST "https://HOST/v1/review/docs-demo-718035483f84" \
  -H "Content-Type: application/json" \
  -d '{"pos":[1.2,0.9,-0.4],"text":"Can we see this wall in the oak finish?","author":"Priya"}'
# → {"id":"c76ae3e41a","t":1790833830642}
```

Read them all (oldest first, resolved ones included):

```sh
curl -sS "https://HOST/v1/review/docs-demo-718035483f84"
# → {"scene":"docs-demo-718035483f84","comments":[
#      {"id":"c76ae3e41a","t":1790833830642,"pos":[1.2,0.9,-0.4],
#       "text":"Can we see this wall in the oak finish?","author":"Priya","resolved":false}]}
```

On a private scene add `?share=<shareToken>` (or `X-Verse-Share:
<shareToken>`) to both calls.

Moderate as the owner:

```sh
curl -sS -X POST "https://HOST/v1/review/docs-demo-718035483f84/c76ae3e41a/resolve" \
  -H "Authorization: Bearer TOKEN"
# → {"id":"c76ae3e41a","resolved":true}

curl -sS -X DELETE "https://HOST/v1/review/docs-demo-718035483f84/c76ae3e41a" \
  -H "Authorization: Bearer TOKEN"
# → {"deleted":"c76ae3e41a"}
```

Errors follow the [error contract](../api.md#error-contract): `400` bad
shape, `404` no such scene (or private without access — existence is never
advertised), `413` text over 500 characters or the scene at 200 comments,
`429` rate limited, `401` moderation without account auth.

## In an embed on your own site

Pass `review: true` and wire your own toggle; the composer renders inside
the iframe, fits embeds down to 320 px wide, and fires events you can mirror
into a sidebar:

```js
const viewer = Verse.embed(el, { scene: "docs-demo-718035483f84", review: true });
toggle.onchange = () => viewer.setReviewMode(toggle.checked);
viewer.on("review-posted",   (d) => addToSidebar(d));          // { id, pos, text }
viewer.on("review-selected", (d) => highlightInSidebar(d.id));
const all = await viewer.getComments();                         // same shape as GET /v1/review/<id>
```

Owner moderation stays in the playground and `/studio` by design — an
embed viewer, even the owner, only ever sees the anonymous composer. Full
option list: [Embed SDK reference](../embed-sdk.md#client-review-pins-in-embeds).

## Where comments live

A per-scene append-only JSONL under the dotfile directory
`ingest/.reviews/` on the server — never served, skipped by the
sweeper, deleted with the scene (owner delete or disk-budget eviction).
