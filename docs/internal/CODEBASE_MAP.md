# Codebase Map: Code Shepherd

> Reconciled to code at commit 7eea5c7 on 2026-07-06.

## Project Type

Monorepo (npm workspaces) — unified control plane for coding agents.

## Packages and Frameworks

| Package | Framework / Role |
|---------|------------------|
| `@code-shepherd/relay` | Express.js + Temporal.io + better-sqlite3 + ws (WebSocket) + web-push. The central server. |
| `@code-shepherd/ui` | React 18 + Vite + Tailwind CSS. Mobile-first PWA shell. |
| `@code-shepherd/sdk` | TypeScript client for agent registration, heartbeat, approvals, polling. |
| `@code-shepherd/shared` | Shared TypeScript types (capability tiers, adapters, conversations, commands). |
| `@code-shepherd/universal-mcp-gateway` | Local helper: pairs via one-time code, polls relay for commands, bridges to adapters (Codex, Antigravity, mock). |
| `code-shepherd-antigravity-companion` | Antigravity IDE companion bridge + pairing helper. |

## Entry Points

| Package | Entry Point |
|---------|-------------|
| relay | `packages/relay/src/index.ts` |
| ui | `packages/ui/src/main.tsx` |
| sdk | `packages/sdk/src/index.ts` |
| shared | `packages/shared/src/index.ts` |
| universal-mcp-gateway | `packages/universal-mcp-gateway/src/index.ts` |
| antigravity-companion | `packages/antigravity-companion/extension.js` |

## Relay Route Surface

Mounted in `packages/relay/src/index.ts`:

| Route | Purpose |
|-------|---------|
| `/health` | Liveness + Temporal/agent counts |
| `/agents` | Registry, heartbeat, timeline |
| `/approvals` | Create, list, decide (with Temporal client) |
| `/audit-logs` | Normalized audit stream (icon/category/status) |
| `/notifications` | Web push (VAPID) |
| `/auth` | Signup, login, refresh, logout, me, preferences, teams, invitations |
| `/demo` | Local QA seed data |
| `/workflows` | Temporal workflow queries |
| `/conversations` | Threads, messages, commands (poll/ack/replies), message feedback |
| `/tasks` | Task CRUD / assignment (kanban) |
| `/operations` | Parallel sessions, worktree provisioning, terminal activation |
| `/connectors` | Trust, pairing exchange, secret rotation, pairing sessions, events |

Middleware: `auth` (JWT bearer + cookie), `connectorAuth` (hashed scoped tokens), `rateLimit`, `riskPolicy`.

## UI Screens

`Dashboard` (Command Center), `AgentsOverview`, `AgentDetail`, `Inbox`, `ApprovalQueue`,
`KanbanBoard`, `ExecutionTimeline`, `Settings`, `OperatorProfile`, `LoginPreview`, plus the
`shepherd-guide/` assistant components. Navigation is defined in `src/routes/routeConfig.ts`.

## Directory Structure

```
code-shepherd/
├── package.json              # Root workspace config + build/dev/gateway scripts
├── tsconfig.json
├── README.md
├── CODE_SHEPHERD.md          # Product roadmap (v3.0)
├── docs/                     # ARCHITECTURE, SECURITY_AUDIT, planning/, internal/, guides/
├── scripts/                  # start-gateway.cjs, install-antigravity-companion.cjs
└── packages/
    ├── relay/                # Express server
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── routes/       # agents, approvals, audit, auth, connectors, conversations, ...
    │   │   ├── middleware/   # auth, connectorAuth, rateLimit, riskPolicy
    │   │   ├── activities/   # Temporal activities
    │   │   ├── workflows/    # Temporal workflows (agentSession, approvalWorkflow)
    │   │   ├── guide/        # Shepherd Guide logic
    │   │   ├── contracts/    # adapter contracts
    │   │   ├── utils/        # authSecurity, diffGenerator, summaryGenerator, vapidKeys, ...
    │   │   └── __tests__/    # approvalTimeout, approvalWorkflow, riskPolicy
    │   └── tsconfig.json
    ├── ui/                   # React PWA
    ├── sdk/                  # Agent SDK
    ├── shared/               # Shared types
    ├── universal-mcp-gateway/# Local gateway + adapters
    └── antigravity-companion/# Antigravity bridge
```

## Build System

```bash
npm install            # install all workspaces
npm run build          # build shared → relay → sdk → gateway → companion → ui
npm run dev:relay      # relay dev server
npm run dev:ui         # UI dev server
npm run start:gateway  # universal MCP gateway
npm test               # workspace tests (relay has unit tests; UI has none yet)
```

## Current Limitations

- UI has no automated tests (relay has unit tests under `src/__tests__/`).
- Temporal server is optional; the relay logs a disconnected state when `localhost:7233` is absent.
- SQLite database file is gitignored and created on first run.
- PWA is not fully wired (`vite-plugin-pwa`, manifest, and icons pending).
