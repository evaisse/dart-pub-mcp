# dart-pub-mcp

Model Context Protocol (MCP) server that exposes metadata, release notes, documentation assets, and source files from the public [pub.dev](https://pub.dev) registry as well as the local Dart/Flutter pub cache.

## Features

- Mirrors official pub.dev API endpoints documented at [pub.dev/help/api](https://pub.dev/help/api) for package metadata, scores, and publisher information.
- Streams package archives from pub.dev to expose READMEs, changelogs, and arbitrary source files.
- Reads files already downloaded into the local pub cache (defaults to `~/.pub-cache`, override with `PUB_CACHE`).
- Provides discovery helpers for packages, versions, and file listings to guide MCP clients.

## Supported resources

Remote resources (`pub.dev://` URIs):

- `pub.dev://package/{package}` – package summary (JSON from `/api/packages/{package}`).
- `pub.dev://package/{package}/score` – scoring metadata (`/api/packages/{package}/score`).
- `pub.dev://package/{package}/publisher` – publisher info (`/api/packages/{package}/publisher`).
- `pub.dev://package/{package}/version/{version}` – version metadata (`/api/packages/{package}/versions/{version}`). Use `latest` for the most recent release.
- `pub.dev://package/{package}/version/{version}/files` – JSON list of files contained in the published archive.
- `pub.dev://package/{package}/version/{version}/file/{+filePath}` – raw file contents from the archive (e.g. `.../file/README.md` or `.../file/lib/src/foo.dart`).

Local cache resources (`pubcache://` URIs):

- `pubcache://package/{package}/versions` – versions available locally, grouped by hosting source.
- `pubcache://package/{package}/version/{version}/files` – JSON list of files on disk for a cached version.
- `pubcache://package/{package}/version/{version}/file/{+filePath}` – raw file from the local pub cache.

## Installation

```bash
npm install
```

## Running the server

```bash
npm start
```

The server communicates over stdio, so you can connect with any MCP-compatible client (Claude Desktop, Claude Code, Cursor, the MCP Inspector, etc.). Use the resource URIs above to request data once connected.

### Client configuration examples

Below are sample configurations that call the server via `npx` (useful once the package is published to npm). Replace `X.Y.Z` with the desired version or omit it to always pull the latest.

#### Claude Code / Claude Desktop (Claude CLI)

```bash
claude mcp add dart-pub-mcp \
  --transport stdio \
  --command npx \
  --arg dart-pub-mcp@X.Y.Z \
  --arg start
```

#### Gemini Code Assist (VS Code `google-gemini.json`)

```json
{
  "mcpServers": [
    {
      "name": "dart-pub-mcp",
      "type": "stdio",
      "command": "npx",
      "args": ["dart-pub-mcp@X.Y.Z", "start"]
    }
  ]
}
```

#### OpenAI Codex / o1-coder (VS Code `openai.json`)

```json
{
  "mcpServers": {
    "dart-pub-mcp": {
      "command": "npx",
      "args": ["dart-pub-mcp@X.Y.Z", "start"],
      "transport": "stdio"
    }
  }
}
```

## Environment variables

- `PUB_CACHE` – custom location of the pub cache. If unset, the server falls back to `~/.pub-cache`.

## Development

```bash
# Type checks & build artefacts
npm run build

# Run automated tests
npm test

# Watch mode for local iteration
npm run dev
```

The repository uses TypeScript with `tsx` for local development. Build output is emitted to `dist/`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and [AGENTS.md](AGENTS.md) for MCP client integration details.

## Notes on the pub.dev API

The implementation follows the publicly documented endpoints at [pub.dev/help/api](https://pub.dev/help/api):

- `/api/package-name-completion-data` – used for lightweight package discovery inside the MCP resource template.
- `/api/packages/<package>/score` and `/api/packages/<package>/publisher` – expose score and publisher metadata.
- `/api/package-names` – available for exhaustive package listings (not currently auto-exposed to avoid large payloads, but the helper is implemented).

For package version metadata and archives we rely on the [Hosted Pub Repository Specification v2](https://dart.dev/tools/pub/repository-spec) that the `pub` CLI uses. This provides `/api/packages/<package>` and `/api/packages/<package>/versions/<version>`, along with `archive_url` pointers that the server streams to surface files such as `README.md` and `CHANGELOG.md`.

## License

Released under the ISC license. See [LICENSE](LICENSE).
