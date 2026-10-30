# Ask Verse, the site assistant

**Ask Verse** is the button at the bottom-right of the product page, the
app, Studio and these docs. Type what you want in your own words — it
answers in a sentence or two and, where it can, does it for you by pressing
the page's own controls.

**You need:** nothing. It works on day one without any setup, in *basic*
mode. An operator can switch on *AI* mode with one environment variable
(see [Operator setup](#operator-setup)).

## What you can ask

| Say something like | What happens |
| --- | --- |
| "I want to show my apartment model to a client" | Opens the app and the upload panel |
| "How big can my file be?" | Answers, and shows the current limits card |
| "Open a demo scene" | Loads one of the public demo scenes |
| "Walk through this" · "Back to orbit" | Switches walk mode on or off |
| "Play the tour" · "Stop the tour" | Plays or stops the scene's automatic camera tour |
| "Make a video of this" | Opens the **Export video** options |
| "Share this scene" | Shows the scene link and copies it |
| "Collect comments on it" | Turns on review mode |
| "Make it private" | Takes you to Studio and says which control to use |
| "Embed this on my site" | Opens the embed guide |
| "Take me to the Blender exporter" | Opens that guide |
| "Show me around" | Starts the guided tour of the page |
| "How much does it cost?" | Points you to hello@ctruh.com |

Each thing it does appears under the reply as a small chip ("Switched to
walk mode"), with **Undo** or **Back** where that makes sense. The
conversation follows you when the assistant moves you to another page, and
is forgotten when you close the tab.

Keyboard: **Enter** sends, **Shift+Enter** adds a line, **Esc** closes the
panel. On a phone the panel is a full-height sheet.

## What it cannot do

- It cannot upload a file for you, sign in, or see or change your account,
  tokens or scenes. Making a scene private or revoking a link is done by
  you, in [Studio](share-privately.md).
- It only ever performs actions from a short fixed list (below), on this
  site. It cannot open other websites.
- It answers questions about using Verse Engine and nothing else.
- Rendering quality has no in-page menu, so it cannot change it — it opens
  [Tune quality knobs](tune-quality.md) instead.

The complete list of actions:

| Action | Does |
| --- | --- |
| `navigate` | Goes to `/`, `/app`, `/studio`, `/docs/` or a section of the product page |
| `open_upload` | Opens the upload panel / file picker in the app |
| `load_demo` | Opens a public demo scene |
| `start_tour` | Starts the guided product tour of a page |
| `set_view` | Walk, orbit, play or stop the scene tour, toggle the minimap or the measure tool |
| `export_video` | Opens the video export options |
| `open_review` | Turns on review mode |
| `share_link` | Shows and copies the scene link |
| `open_docs` | Opens a public documentation page |
| `show_limits` | Shows the upload limits |

Every action is checked against this list twice: by the server before it
is sent, and by the page before it runs. Anything else is dropped.

## Basic mode and AI mode

- **Basic** (the default): the server matches your request against a
  curated set of common tasks and searches the headings of these docs.
  Nothing leaves the server.
- **AI**: the server sends the conversation to Anthropic's Claude API and
  streams the reply back. The model is given the public guides and the
  current limits, and can only answer with text plus the actions above.

The small tag beside the panel title says which mode is on. If the AI
service is unreachable, that one reply falls back to basic mode.

## Privacy

- In AI mode, the messages you type (and which page you are on, and
  whether a scene is loaded) are sent to **Anthropic's API** to generate
  the reply. Do not type passwords or account tokens — the assistant never
  needs them.
- **Verse does not store your messages.** The server logs one line per
  request with counts only (message count, characters, latency, token
  usage) — never the text. The conversation lives in your browser tab's
  session storage and is gone when the tab closes.
- In basic mode nothing is sent to any third party.

## Turning it off

Add `?assistant=0` to any page URL to hide the button. It never appears
inside an embedded viewer (`embed.html`) or any iframe.

## Operator setup

The assistant needs no configuration. To enable AI mode on a server you
run, set:

| Variable | Default | Meaning |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | unset | Set it to switch on AI mode. Unset = basic mode. |
| `VERSE_ASSIST_MODEL` | `claude-haiku-4-5` | The Claude model. The default is the fast, inexpensive tier, which suits navigation help. |
| `VERSE_ASSIST_DAILY_CAP` | `1000` | Most AI requests answered per UTC day, across all visitors. Past it the endpoint answers `503` with a friendly message until the next day (or a restart). |
| `VERSE_ASSIST_PER_HOUR` | `40` | Messages per hour per IP address, both modes. |
| `VERSE_ASSIST_MAX_TOKENS` | `700` | Longest reply, in output tokens. |

Other built-in limits: 20 messages per conversation, 1,000 characters per
message, 3 actions per reply, a 25-second timeout, and at most 8 replies
being written at once. `GET /v1/assist/status` reports the mode; the
endpoint itself is documented in the [API reference](../api.md#post-v1-assist).

Cost, as a rough guide: the product knowledge sent with every request is
cached on Anthropic's side, so a typical exchange on the default model
costs a fraction of a US cent. The daily cap is the hard ceiling.
