# Show your clients who looked

Studio's **Analytics** page answers the questions a developer or an agency
gets asked after sending a walkthrough link: how many people opened it, how
long they stayed, which rooms they spent time in, whether they got as far as
asking about the property, and on what devices. Every number can be
exported as a CSV or sent as a printable report.

**You need:** a Studio account and scenes you own (see
[Share privately](share-privately.md) for accounts and owned uploads).

## 1. Open the dashboard

Sign in at `/studio` and click **Analytics** in the top bar, or open a
scene's **Analytics** panel and pick **Full analytics & client report**.

- **All scenes** (the default) adds up every scene you own and lists each one
  with its views, unique viewers, median time and enquiries. Click a scene to
  drill into it.
- **7 / 30 / 90 days** picks the range. Days are UTC.

| Number | What it counts |
| --- | --- |
| Views | each time the link was opened in a browser tab |
| Unique viewers | different browsers (a random id the browser keeps; no name or login) |
| Returning viewers | browsers that opened the scene more than once in the range |
| Median / total time | time the scene was open **and on screen** (sampled every 2 s; a tab left in the background does not count) |
| Enquiries | clicks on the scene's enquiry button |

## 2. Add an enquiry button

The last step of the funnel is your call to action. On a scene's analytics
page, under **Enquiry button**, set a label and a link:

- `https://…` — your contact form, a booking page or a WhatsApp link
  (`https://wa.me/91…`)
- `mailto:sales@yourcompany.com`
- `tel:+91 80 1234 5678`

Every viewer of that scene then sees the button over the walkthrough. The
funnel reads **Opened → Interacted** (dragged, tapped, walked or pressed a
key) **→ Stayed 30 s+ → Enquired**.

The same setting over the API:

```sh
curl -X PUT https://HOST/v1/scenes/SCENE/enquiry -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" -d '{"label":"Book a site visit","url":"https://wa.me/918012345678"}'
```

## 3. Where people looked and which rooms they saw

For an interior with a floor plan, the scene page shows:

- **Where people looked:** a heatmap over the plan. Blue cells show where
  visitors stood; amber cells show where they waited for the scene to load.
- **Rooms visited:** the plan is split into rooms at the doorways (open-plan
  spaces stay one room, corridors are their own). A room takes the name of a
  hotspot inside it (author one per room in the default experience, see
  [Author a guided tour](author-a-guided-tour.md)), otherwise "Room 1",
  "Room 2"… from largest to smallest. Rooms nobody entered are listed with 0,
  which is also worth knowing. Time spent on a terrace or in the garden reads
  **Outdoors**; time spent looking at the house from the opening overview
  reads **Overview (outside the floor plan)**.
- **Name your rooms:** click a room on the plan (or ✎ in the list) and type
  "Kitchen", "Master bedroom"… The name is used everywhere: dashboard, CSV
  and client report, for past days too.
- **Top viewpoints:** the five spots where visitors spent the most time, as
  "Kitchen · facing north-west", with numbered pins on the plan.

A scene without an interior floor plan (an object, an open-air scene) has no
rooms; the dashboard says so and still shows where people looked.

Scenes plan the storey you start on, with interior walls
and the garden marked; re-upload an older multi-storey scene (a new version)
to get its rooms.

## 4. Devices

Phone / tablet / desktop, iOS / Android / desktop systems, the in-app
browser (Instagram, Facebook, WhatsApp, LinkedIn…) and how people arrived:
a direct link, a [private share link](share-privately.md) or an embed on
your site. People opening a share link are counted, but stay anonymous like
everyone else.

## 5. Send it to your client

- **Download CSV** gives the same numbers as a spreadsheet: headline
  metrics, one row per day, the funnel, rooms and device split (and, for
  All scenes, one row per scene).
- **Client report** opens a clean one-page report for the scene (or all
  scenes) and range. Press **Print / Save as PDF**: it prints on white
  paper, A4, with how it was measured at the bottom.

## 6. Share a viewer report with a link

The **viewer report** is the client-ready page for one scene: who opened it
(anonymous viewers, how many times, on what device, and where they came from:
WhatsApp, Instagram, Google, an e-mail, your website's embed…), the time spent in
each room as a heatmap over the floor plan, the hotspots they opened, how many
questions they asked Ask Verse, average and median time, and the funnel to your
enquiry button. It works on a phone.

1. In **Studio → Analytics**, pick the scene and press **Share report** (or
   open **Client report** and press **Share link**).
2. Name the link after who it is for (for example "Sharma family"), pick the
   window (last 7, 30 or 90 days) and press **Create link**.
3. **Copy** the link and send it. It is shown once — the server keeps only a
   fingerprint of it.
4. To stop sharing, press **Revoke** next to the link. It stops working at
   once, for the page and the CSV alike. Deleting the scene revokes every link.

Anyone with the link sees the report and can download its CSV. They never see
your account, your other scenes or your enquiry link. If the scene is
**private**, the report still opens but does not link to the scene or show the
floor-plan image — the rooms are drawn from their outlines instead — so a
report link never becomes a way into a private scene. Viewers appear as codes
like `V-4AF8C3`: one code is one browser, never a name.

The same exports over the API: `GET /v1/scenes/<id>/analytics.csv?days=30`
and `GET /v1/account/analytics.csv?days=30`; the viewer report is
`GET /v1/scenes/<id>/report[.csv]`, its links `/v1/scenes/<id>/report/links`
([API](../api.md#analytics)).

## Privacy, in short

- No names, e-mail addresses, phone numbers or IP addresses are stored for
  analytics. A visitor is a random id their browser keeps in local storage;
  the server keeps only a keyed hash of it.
- Device class, system and in-app browser are worked out **on the
  device**; the browser's user-agent string is not stored with the
  analytics rows.
- Visitors with **Do Not Track** or **Global Privacy Control** switched on are
  never counted. A link with `?analytics=0` is not counted; `?analytics=never`
  turns counting off on that browser for good (`?analytics=1` turns it back
  on); an embed with `analytics: false` is never counted.
- Storage is bounded: raw samples live in a rotating log; completed days
  are kept as daily totals per scene for `VERSE_ANALYTICS_KEEP_DAYS` (400
  days by default) and then deleted. Deleting a scene deletes its analytics.
