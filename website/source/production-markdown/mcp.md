<!-- release-6: UNRELEASED. The package is prepared but not published; do not announce until docs/handover/mcp-publish.md has been run. -->

# Verse for AI agents (MCP)

> **Early access.** The hosted endpoint at `/mcp` is live (Bearer key required). The `@ctruhtech/verse-mcp` npm package is prepared and waiting to be published (see `docs/handover/mcp-publish.md`).

`@ctruhtech/verse-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server. Add it to Claude, ChatGPT, Cursor or VS Code and the assistant can take a 3D file (a path on your machine, or a public URL) and hand you back a Verse link that opens in any browser, plus embed code, private links and a guided tour.

It does nothing the REST API cannot: each tool is a thin wrapper over [`/v1/*`](api.md) through the [JS SDK](sdk.md), including the resumable upload for big files.

## Install

Stdio (Claude Desktop, Claude Code, Cursor, VS Code), Node 20+:

```json
{ "mcpServers": { "verse": { "command": "npx", "args": ["-y", "@ctruhtech/verse-mcp"], "env": { "VERSE_API_KEY": "your account token" } } } }
```

Remote (Streamable HTTP) at `https://verse.ctruh.com/mcp`, with `Authorization: Bearer <your key>`. Copy-paste setups for each client are in the package README (`sdk/mcp/README.md`).

## Credentials

`VERSE_API_KEY` takes your **account token** (Studio, `/studio`) or an upload key `vk_...` (see [Authentication](api.md#authentication)). The account token is what owns scenes and unlocks `list_scenes`, visibility, private links and camera paths. `VERSE_BASE_URL` points at another origin. The key is sent only to that origin as a header and never logged or returned.

## Tools

| Tool | REST routes |
| --- | --- |
| `upload_scene` | `POST /v1/ingest` or the resumable `begin` / `part` / `commit` (from 100 MB, or on request); `POST /v1/ingest/url` for URLs; polls `GET /v1/ingest/<job>` |
| `get_scene_status` | `GET /v1/ingest/<job>`, then `GET /v1/account/scenes` for older scenes |
| `list_scenes` | `GET /v1/account/scenes` |
| `create_share_link` | `PATCH /v1/scenes/<id>` (visibility), `POST /v1/scenes/<id>/share` |
| `revoke_share_link` | `GET` / `DELETE /v1/scenes/<id>/share[/<shareId>]` |
| `get_embed_code` | builds the iframe / `<verse-viewer>` from the scene's link |
| `list_camera_paths`, `set_camera_path`, `reset_auto_camera_path` | `GET` / `POST /v1/scenes/<id>/paths`, `POST .../paths/auto` |

Not included, because the API does not offer it: world generation from a prompt or photo, and link expiry (share tokens last until revoked).

Errors are one plain sentence (the server's own friendly error where there is one). Large uploads report progress as MCP progress notifications.

## Remote server notes

The HTTP transport is stateless and bring-your-own-key: each request builds a server bound to the caller's header. Local file paths are refused (a hosted server cannot see your disk); give it a public URL, or use stdio. It is a Node `(req, res)` handler (`createHttpHandler`) or `verse-mcp --http`.

## For AI 3D generators

`integrations/ai-generators/` has a tiny JS and Python helper and a "Share as Verse link" button that takes a GLB / PLY / SPZ URL or blob and returns a link and embed code. See its README.
