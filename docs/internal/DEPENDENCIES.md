# Dependencies: Code Shepherd

> Reconciled to code at commit 7eea5c7 on 2026-07-06.

## Root Workspace

| Dependency | Purpose |
|------------|---------|
| npm workspaces | Monorepo package linking |
| lucide-react | Shared icon set |

## @code-shepherd/relay

| Dependency | Purpose |
|------------|---------|
| express | HTTP server |
| better-sqlite3 | SQLite database |
| @temporalio/client | Temporal.io workflow client |
| @temporalio/worker | Temporal.io workflow worker |
| ws | WebSocket server for `/realtime` |
| web-push | Web push notifications (VAPID) |
| diff | Code diff generation for approval previews |
| node:test | Built-in Node.js test runner for relay coverage |

Auth (JWT, scrypt hashing, cookies) is built on Node's built-in `crypto` — no external auth library.

## @code-shepherd/ui

| Dependency | Purpose |
|------------|---------|
| react / react-dom | UI framework |
| vite / @vitejs/plugin-react | Build tool + React plugin |
| tailwindcss / @tailwindcss/vite | Styling |
| postcss / autoprefixer | CSS pipeline |

## @code-shepherd/sdk

| Dependency | Purpose |
|------------|---------|
| @code-shepherd/shared | Shared types (workspace) |

Agent-side client: registration, heartbeat, approvals, polling helpers.

## @code-shepherd/shared

| Dependency | Purpose |
|------------|---------|
| (none) | Shared TypeScript types only |

## @code-shepherd/universal-mcp-gateway

| Dependency | Purpose |
|------------|---------|
| @code-shepherd/shared | Shared types (workspace) |

Pairs with the relay, polls commands, and bridges to Codex / Antigravity / mock adapters.

## code-shepherd-antigravity-companion

Antigravity IDE companion bridge and pairing helper (see `packages/antigravity-companion`).

## Security Notes

- No hardcoded secrets in source; `AUTH_SECRET` defaults to an insecure dev value and must be set in production.
- Passwords hashed with scrypt; connector and refresh tokens hashed at rest.
- Database file gitignored.
- Temporal connection localhost only (dev).

## Version Policy

- All packages start at 1.0.0
- Semantic versioning enforced
- Shared types versioned independently
