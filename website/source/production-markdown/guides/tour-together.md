# Tour together, live

Walk a buyer through a home from wherever they are. You open the scene,
tap **Tour together**, and send one link. Whoever opens it — on any
phone, from WhatsApp or Instagram's in-app browser, with no account and
nothing to install — lands in the same scene and follows your camera.
They can break away to look around, rejoin, see where everyone else is,
and point at things; you can open hotspots and change styles for the
whole group as you talk.

**You need:** a published scene (an `ingest/…` link — a scene you
uploaded, so the link opens for someone with no file of their own). No
account is needed by you or your guests. Everyone can talk with **Join
voice** (see Voice below).

## 1. Start the tour

Open the scene in `/app` or on its `/view` link and tap **Tour together**
(in the share row; on a phone or a `/view` page it is the *Tour together*
chip in the scene tools). A card appears with:

- a **QR code** a guest can scan from a laptop screen,
- the **short link** (`https://…/t/<code>`) with **Copy**,
- **Share invite** — the phone's own share sheet (WhatsApp, Messages,
  Mail…) where the browser has one, or **Start touring** on a desktop,
- **WhatsApp**, which opens the message ready to send.

From that moment you are the **host**: the room has your camera as its
reference, your minimap is on, and the viewers panel (bottom right) shows
everyone who joins.

**Invite** (in the tour panel) sends the link again at any time. On a
phone it opens the share sheet straight away: pick the chat, send, come
back — you are still hosting, in the same place, and everyone is still
following you. On a desktop it copies the link ("Invite link copied —
paste it into WhatsApp") and shows the card with the QR code.

A link lasts a day and opens the same room each time; up to 32 people
share a room. The code only shortens the room name — the room name is
the secret, so share the link only with the people you want in the tour.

### The tour chip

On a phone the panel folds into one chip at the bottom right, so the home
keeps the screen. It always says where things stand:

| The chip says | Meaning |
| --- | --- |
| **Waiting for viewers…** | You are hosting; nobody has joined yet. |
| **Presenting · 3 in tour** | You are hosting; everyone follows your camera. |
| **Following Vinay · 3** | You are a guest, following the host. |
| **Vinay stepped away** | The host's phone is in another app; look around meanwhile. |
| **· 1 away** | Someone's phone is in another app; they are still in the tour. |
| **Reconnecting…** | The network dropped; it heals on its own. |

Tap the chip to open the full panel (everyone in the tour, Invite, Point,
End tour). The round **mic** button beside it is voice — see Voice below.

## 2. What a guest sees

The link opens the scene in the immersive layout. On a phone the usual
**Enter experience** gate comes first (the tap is what lets the browser
go full screen), then a small chip asks for a name — optional, kept only
in that browser tab (so a reload does not ask again), never stored on the
server. Then:

- their camera **follows yours** — smoothly, a second behind, with a
  "Following <your name>" chip and a **Take control** button;
- the viewers panel lists everyone, with you marked **(host)**;
- every other guest is a coloured avatar in the scene and a dot on the
  minimap, in the colour of their row in the panel.

**Break away / rejoin.** *Take control* gives a guest their own camera
(the veil goes away; your hotspot and style actions no longer apply to
them). **Rejoin the tour** in the tour bar (or the chip at the top) puts
them back behind your camera.

**Look here.** Anyone — host or guest — taps **Point** in the tour bar and
then something in the scene: a pulsing ring appears at that spot on every
screen, with the pointer's name, for a few seconds. On a phone Point
stays on until tapped again; on a desktop one click sends one ping.

**Hotspots and styles.** While hosting, every hotspot you open, variant
or style you pick, light change, section cut and guided-tour step is
applied on the guests' screens as you make it (the same channel as
[Present a scene](present-a-scene.md)).

## 3. Switching apps, losing signal, reloading

Phones leave the browser all the time — to send the invite on WhatsApp,
to take a call. The tour is built for it:

- **When you (the host) switch apps**, every guest sees a calm card —
  "*Vinay stepped away — the tour continues when they're back*" — and
  gets their own camera to look around meanwhile. Nothing freezes without
  a word. When you come back, the card goes and everyone glides back
  behind your camera on their own; you are still hosting, in the same
  spot, and a small "Back in the tour" chip says so.
- **When a guest switches apps**, your panel marks them *away* (and the
  chip says "· 1 away"). When they come back they are following you again
  — no tap needed.
- **If the phone closed the page in the background** (iPhones do this to
  save memory), coming back reloads it straight into the same tour: same
  role, same name, same place in the home, voice back on if it was on.
  The others only ever saw "stepped away".
- **Wi-Fi to 4G**, a tunnel, a weak signal: the tour reconnects on its own
  in the background. Only if the network stays down for a while does the
  chip say *Reconnecting…*.

If the viewer has to restart its graphics (a phone running out of
memory), the page goes straight back into the same tour in the same role.

If **you** close the page for good, guests see "The agent left the tour"
within a few seconds and keep their own cameras; the room stays open, so
coming back on the same link puts you back in charge. Any guest can also
take over with **Host this tour** in the tour bar.

**Faster for late joiners.** Once a tour starts, each phone quietly saves
the rest of the home to its own storage in the background, so walking
into a new room — or coming back after a break — does not wait on the
network. It is skipped when the phone is in data-saver mode or on a slow
connection, and it never takes more than a modest share of the phone's
storage.

## 4. Hand over and end

- **Hand over** on a guest's row makes them the host; everyone follows
  them.
- **End tour** gives everyone their own camera and shows "The tour has
  ended". **Host again** restarts it in the same room.

## 5. What is recorded

Nothing from the tour is kept: poses live in memory for 10 s (10 minutes
for someone who stepped away), names ride
the roster only, the invite table holds `{scene, room, expiry}` and
nothing else, and no audio or video exists. The one trace is analytics:
a session that was part of a live tour counts as a **live tour** in the
scene's analytics (Studio → Analytics shows *Live tours* beside views and
enquiries; the CSV carries `live_tour_sessions`). The same privacy rules
as the rest of analytics apply — no names, no addresses.

## Voice

Everyone in the tour can talk. Tap the round **mic** button on the tour
chip (or **Join voice** in the panel); the browser asks for the
microphone once. Then the mic shows its state at a glance:

- **green** — your mic is on; it glows while you speak. Tap to mute.
- **red, crossed out** — muted. Tap to unmute, or **press and hold** to
  talk just while you hold it (like a walkie-talkie), then let go.

Up to six people speak at a time; voices are spatial — each comes from
where that person stands in the scene — with a stereo toggle, per-person
mute and a speaking indicator in the panel. Audio goes browser to
browser; it never passes through Verse's server.

Switching apps: Android phones and desktops keep talking in the
background. An iPhone pauses the microphone while you are in another app;
when you come back, voice reconnects on its own. If the phone had to
reload the page, voice comes back on too (if the browser asks again for
the microphone, allow it, or tap the mic).

Phones on mobile data usually cannot reach each other directly, so voice
uses a **TURN relay** when the server has one configured
(`VERSE_TURN_URLS` plus either `VERSE_TURN_SECRET` for short-lived
per-person credentials, or a provider's `VERSE_TURN_USERNAME` /
`VERSE_TURN_CREDENTIAL`). Without a relay, voice still works between
devices that can reach each other directly; the panel says so when a pair
cannot connect.

## Links and knobs

- `/t/<code>` → `/view?vpk=<scene>&room=<room>&live=1` (a guest).
  `?room=<room>&host=1` hosts a room at once; a plain `?room=` is the 2.7
  viewer with the tour bar.
- API: `POST /v1/tour/invite`, `GET /v1/tour/invite/<code>`,
  `POST /v1/room/<room>/leave` — [api.md](../api.md#tour-together-live).
- Server: `VERSE_TOUR_INVITE_TTL_H` (24) how long a link lasts;
  `VERSE_TOUR_INVITES_PER_HOUR` (60) invites per address per hour;
  `VERSE_ROOM_AWAY_TTL_S` (600) how long someone whose phone is in another
  app stays "away" before they count as gone.
- `?prefetch=0` turns the background save off for one page.

## Testing

`cd web/test && QA_PORT=8935 node fix-verify-tour-polish.mjs` (ports
8930–8939) checks stepping away and coming back, reloads, the invite share
round trip, the background save and voice across an app switch.

`cd web/test && QA_PORT=10254 node fix-verify-tourlive.mjs` (ports
10250–10299) runs a desktop host, two iPhone 13s and a WhatsApp in-app
browser, each in its own Chromium. Without a GPU it runs on SwiftShader:
expect several "GPU context recovered" device losses per run (none on
real GPUs). The gate re-asserts the host's teleport after each one, and
gives the follow checks a 40 s window because four software renderers
share the CPU; on a real phone the glide lands in about a second. The
pixels (pings drawn over the right object, the follow glide's
smoothness) and real in-app browsers need a device check.
