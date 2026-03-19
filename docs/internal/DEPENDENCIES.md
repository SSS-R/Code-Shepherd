# Dependencies: AgentOps

## Root Workspace

| Dependency | Purpose |
|------------|---------|
| npm workspaces | Monorepo package linking |

## @agentops/relay

| Dependency | Purpose |
|------------|---------|
| express | HTTP server |
| @types/express | TypeScript types |
| better-sqlite3 | SQLite database |
| @temporalio/client | Temporal.io workflow client |
| @temporalio/worker | Temporal.io workflow worker |
| node:test | Built-in Node.js test runner for relay coverage |

## @agentops/ui

| Dependency | Purpose |
|------------|---------|
| react | UI framework |
| react-dom | React DOM renderer |
| vite | Build tool |
| @vitejs/plugin-react | Vite React plugin |

## @agentops/sdk

| Dependency | Purpose |
|------------|---------|
| (none yet) | Agent-side SDK (TBD) |

## @agentops/shared

| Dependency | Purpose |
|------------|---------|
| (none yet) | Shared TypeScript types |

## Security Notes

- No hardcoded secrets
- Database file gitignored
- Temporal connection localhost only (dev)

## Version Policy

- All packages start at 1.0.0
- Semantic versioning enforced
- Shared types versioned independently
