# Present a scene to a room

Walk clients through a flat, a showroom or a product together: everyone
opens the same room link, you take the floor, their cameras follow yours,
your voice reaches them from where your avatar stands, and every tour
step, hotspot, material variant, light change and section cut you make
appears on their screens as you make it.

**You need:** a scene link (any share link works, public or private) and
a room name. No account; the room name is the only secret, so pick one
nobody will guess (`showflat-42-tue-3pm`, not `demo`).

## 1. Open the room

Add `?room=<name>` to the scene link and send it round. Each viewer can
add `&as=<their name>`; otherwise they appear as "guest". The **viewers
panel** (bottom right) lists everyone in the room with a coloured dot —
the same colour as their in-world avatar.

Up to 32 viewers share a room. Everyone sees everyone's avatar move live.

## 2. Talk

Click **Join voice**. The browser asks for the microphone once. From then
on:

- **Mute / Unmute** your own microphone.
- **Open mic** ↔ **Push-to-talk**: with push-to-talk, hold **T** (or the
  *Hold to talk* button) while you speak.
- **Spatial** ↔ **Stereo**: by default each voice comes from where that
  person's avatar stands and fades with distance (useful in a large
  flat); Stereo plays everyone flat and at full level.
- **Mute** next to a name silences that one person for you only.

The dot next to a name pulses while they speak, and their avatar
brightens in the scene. "muted" next to a name means they muted
themselves.

Voice is peer-to-peer between the browsers: nothing is recorded and no
audio passes through the Verse server (only the connection handshake
does). Two limits follow from that:

- **Six talkers per room.** A seventh person who joins voice sees "Voice
  is limited to 6 talkers" and hears nothing; viewers who do not join
  voice are not counted. For larger audiences, present with voice among
  the six and let the rest watch.
- **Direct connections first, a relay when the server has one.** Most home
  and office networks connect directly. Phones on mobile data (carrier
  NAT) and strict corporate firewalls often cannot; voice then goes
  through a TURN relay if the server has one configured (see
  [Tour together § Voice](tour-together.md#voice)). Without a relay, a
  pair that cannot connect sees "No audio with <name> — the network blocks
  a direct connection"; a phone hotspot or a different network on one side
  fixes
  it. Everything else in the room keeps working.

Add `&voice=1` (open mic) or `&voice=ptt` to the link to join voice as
the page opens.

## 3. Present

Click **Present** in the viewers panel (or open the link with
`&present=1`). For everyone else:

- their camera glides to yours and stays with it — you walk, they walk;
- a veil over their viewport says *Following <you>* with two buttons:
  **Take control** (their own camera again; a *Rejoin the presenter* chip
  brings them back) and **Raise hand**;
- your **Play tour**, hotspot jumps, **Variant**, **Lights** and
  **Section** changes happen on their screens too;
- the point under your pointer is drawn for them as a red laser dot.

A raised hand pulses that person's row in your panel for a few seconds.
**Hand over** next to a name makes them the presenter (you start
following them); **Stop presenting** gives everyone their camera back.
If someone else clicks Present while you are presenting, they take over
— the panel tells you.

## 4. In an embed

The same room works inside your own page through the embed SDK:

```js
const viewer = Verse.embed(el, { model: "ingest/<id>.vpk" });
viewer.joinRoom("showflat-42", { name: "Alex", voice: true });
viewer.present(true);                       // take the floor
viewer.on("speaking", (s) => roster.mark(s.id, s.speaking));
viewer.on("peer", (p) => p.state === "hand" && toast(`${p.name} raised a hand`));
viewer.on("room", (r) => r.state === "notice" && toast(r.message));
```

The follower veil, laser dot and the presenter's actions all render
inside the frame; `setVoice({ muted, pushToTalk, talking, spatial })`
drives the voice knobs from your own controls. Reference:
[embed-sdk.md](../embed-sdk.md).

## Good to know

- Rooms are memory-only on the server: a restart empties them and
  everyone's page reconnects by itself.
- Voice needs HTTPS (or `localhost`) — browsers do not expose the
  microphone on plain HTTP.
- Voice uses the WebRTC and Web Audio panner APIs every current browser
  ships; the automated gate exercises Chromium, so treat Safari and
  Firefox as "should work, not yet proven".
- Headsets (WebXR) show the avatars and hear the voices; presenting from
  inside a headset is not offered.
