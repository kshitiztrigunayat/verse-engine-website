# Hotspots and doors

Make a scene respond. Pin a price card to a room, let buyers open the front door, switch the lights, or
empty the furniture, all without leaving the link.

## Add hotspots

1. Open your scene while signed in and add `?interact=edit` to the link.
2. Click a surface and choose **Add hotspot**. A pin appears there.
3. Fill the card: title, text, image, a price tag, an icon style, and an optional call-to-action button, such as **Book a visit** (a link, a `tel:`, `mailto:` or WhatsApp link). **Fly there** moves the camera to a view you pick.
4. **Save.** Everyone who opens the scene sees the pins.

## Make objects interactive

Click a door, a sofa or a lamp in edit mode and choose what it does:

| Action | Result |
| --- | --- |
| Door | Opens and closes by swinging on a hinge or sliding. Verse guesses the hinge from the edge of the door. An open door frees the floor for walking. |
| Show / hide | Toggle a part of the scene. |
| Finish | Switch a material, such as the flooring. |
| Light | Turn a lamp on and off. |
| Animation | Play a clip from the file. |

Choose a trigger: **click or tap**, **walking near** it (with a radius), or a **stop in a guided tour**. Big
streamed scenes work too: doors really swing in both the high-end and the compatibility renderers.

## Scene toggles

Switch on any of: **Day / Evening / Night**, **Empty room** (hides the furniture group) and
**Measure**.

## Limits

Up to 64 hotspots and 64 interactive objects per scene, 64 KB in all. Links must be `https:`, `http:`,
`tel:`, `mailto:`, `whatsapp:` or a path on the same site; images must be `https:` or the same site.

## See what visitors do

Hotspot opens, button clicks and objects used appear in the scene's [analytics](#/guides/analytics).
For developers the data is `GET` and `PUT /v1/scenes/<id>/interact`; see the
[API reference](#/api).
