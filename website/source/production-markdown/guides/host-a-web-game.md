# Host a web game

Upload a finished HTML5 game as a `.zip` and get a link people can play in the browser, an
`<iframe>` embed and a `<verse-viewer>` tag. Games run on their own site, **play.ctruh.io**, so a
game can never read your Verse account.

## Upload

1. Studio → **Web games → Host a game** (or drop a `.zip` on the upload page).
2. Wait for the checks to finish. You get:
   - a player page: `https://verse.ctruh.com/play/<id>`;
   - the game itself: `https://play.ctruh.io/g/<id>/`;
   - copy-paste embed code.
3. Optional: add a cover image (PNG, JPG or WebP up to 3 MB), set an orientation, or make the game private and share it with a code.

To update a game keep the same link: **Replace build** and upload the new zip.

## Embed it

```html
<script type="module" src="https://verse.ctruh.com/sdk/verse-viewer.js"></script>
<verse-viewer type="game" src="YOUR_GAME_ID"></verse-viewer>
```

or an `<iframe src="https://play.ctruh.io/g/YOUR_GAME_ID/" allowfullscreen>`.

## What works

Anything that is a static web build: three.js, Babylon, Phaser, plain canvas, Unity WebGL
(`Build/*.loader.js`, `.framework.js.br`, `.data.br`, `.wasm.br`), Godot 4 web exports. Compressed
Unity builds are served with the right headers.

| Limit | Free | Starter | Pro | Scale |
| --- | --- | --- | --- | --- |
| Games | 3 | unlimited | unlimited | unlimited |
| Zip size | 100 MB | 500 MB | 1 GB | 2 GB |

The zip may hold up to 4,000 files and may unpack to at most five times your plan's size. Symlinks,
absolute or `..` paths and password-protected zips are refused. Server-side scripts (`.php`, `.py`,
`.sh`, `.exe`), hidden files and `__MACOSX` folders are dropped, and the upload tells you how many.

## Good to know

- A game is somebody's code. It runs on `play.ctruh.io` with its own storage (saves in localStorage and IndexedDB work) and none of your Verse cookies.
- Games on `play.ctruh.io` are isolated so multi-threaded Unity and Godot builds work when the game is opened there. A game embedded on another site is isolated only if that site is too; single-threaded builds work anywhere.
- Export with Brotli or gzip compression, as Unity does. Uncompressed `.wasm` is served as is.
- Very old Unity builds (`.unityweb`, Unity 2019 and earlier) are served as plain files.

API: `POST /v1/games` with the zip as the body. See the [API reference](#/api).
