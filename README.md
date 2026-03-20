# AgentOps

> Mobile-first control plane for AI coding agents: approvals, audit history, agent visibility, and workflow state in one local-first prototype.

[![Status](https://img.shields.io/badge/status-phase%201%20prototype-blue)](./AgentOPS.md)
[![UI](https://img.shields.io/badge/ui-react%20pwa-61dafb)](./packages/ui)
[![Relay](https://img.shields.io/badge/relay-express%20%2B%20temporal-111827)](./packages/relay)
[![SDK](https://img.shields.io/badge/sdk-typescript-3178c6)](./packages/sdk)

## What this repo currently is

AgentOps is a monorepo prototype for supervising coding agents from a browser or phone-sized PWA.

The current implementation is centered on the approval loop:

1. an agent registers with the relay
2. it sends heartbeats and appears in the dashboard
3. it creates approval requests for risky work
4. a human reviews the summary and diff/context
5. the approval is approved, rejected, or timed out
6. the decision is visible in audit/timeline views

This repo already includes working UI screens, relay APIs, a local SQLite-backed datastore, realtime broadcasts, auth/team scaffolding, demo seeding, and an SDK package.

This repo does **not** yet represent the full long-term vision described in [`AgentOPS.md`](./AgentOPS.md). Some planned features remain partial or prototype-grade.

## Current state at a glance

### Implemented now

- agent registration and heartbeat tracking
- approval request creation, listing, and decision handling
- approval summaries and code diff previews
- audit log and agent timeline endpoints
- realtime websocket event broadcasting
- local auth, teams, invitations, and role-aware routes
- task API and kanban-style UI surface
- settings screen for local signup/login/demo loading
- demo seed endpoint for local QA flows
- TypeScript SDK for agent registration, heartbeats, approvals, and polling helpers
- React/Vite PWA shell optimized for dashboard-style use

### Partial / prototype-grade

- Temporal durable execution is wired in, but local development can run with Temporal disconnected and some resumability semantics are still being hardened
- risk policy enforcement exists, but is not yet a complete policy platform
- collaboration/auth flows are local prototype scaffolding, not production auth
- kanban and operations surfaces exist, but product behavior is still evolving

### Not done yet

- production deployment story
- npm publishing for the SDK
- full enterprise/RBAC/compliance feature set
- hardened multi-tenant architecture
- full notification channel coverage beyond web push

## Monorepo layout

```text
agentops/
├── packages/
│   ├── relay/   # Express relay, SQLite persistence, Temporal hooks, APIs
│   ├── ui/      # React + Vite PWA
│   ├── sdk/     # Agent-facing TypeScript client
│   └── shared/  # Shared TS types
├── docs/
│   ├── ARCHITECTURE.md
│   ├── internal/
│   └── planning/
├── AgentOPS.md
├── README.md
└── .env.example
```

## Package summary

| Package | Purpose | Notes |
|---|---|---|
| `@agentops/relay` | Express API, SQLite persistence, Temporal worker/client wiring, websocket broadcasts | Main backend runtime |
| `@agentops/ui` | Mobile-first React PWA for dashboards, approvals, timeline, kanban, settings | Connects to `http://localhost:3000` |
| `@agentops/sdk` | TypeScript helper package for agent registration, heartbeat, and approval flow | Local package, not published yet |
| `@agentops/shared` | Shared types | Workspace dependency |

## Main user-visible surfaces in the current prototype

### Relay APIs

The relay server exposes routes for:

- `/health`
- `/agents`
- `/approvals`
- `/audit-logs`
- `/notifications`
- `/auth`
- `/demo`
- `/workflows`
- `/tasks`
- `/operations`

The server bootstrap lives in [`packages/relay/src/index.ts`](./packages/relay/src/index.ts).

### UI screens

The current PWA navigation includes:

- dashboard
- approvals
- timeline
- kanban
- settings

The main app shell lives in [`packages/ui/src/App.tsx`](./packages/ui/src/App.tsx).

### Demo and QA helpers

- seeded demo data via [`packages/relay/src/routes/demo.ts`](./packages/relay/src/routes/demo.ts)
- signup/login/team/invitation flows via [`packages/relay/src/routes/auth.ts`](./packages/relay/src/routes/auth.ts)
- local session persistence in [`packages/ui/src/utils/authSession.ts`](./packages/ui/src/utils/authSession.ts)

## Local development setup

### Prerequisites

- Node.js 18+
- npm 9+
- optional: Temporal running at `localhost:7233` if you want workflow connectivity instead of the expected disconnected-dev fallback

### Install dependencies

From the repo root:

```bash
npm install
```

The workspace is configured in [`package.json`](./package.json), so a root install covers the packages.

### Configure environment

Copy [`.env.example`](./.env.example) to `.env` in the repo root and adjust values if needed.

Important defaults:

```bash
PORT=3000
DATABASE_PATH=./relay.db
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=agentops-queue
```

For push notifications, generate VAPID keys with:

```bash
cd packages/relay && npx ts-node src/utils/vapidKeys.ts
```

If you do not need push testing immediately, the rest of the app can still be documented and explored locally.

## Running the prototype locally

Open two terminals from the repo root.

### Terminal 1: relay

```bash
npm run dev:relay
```

This runs the relay TypeScript compiler in watch mode as defined in [`packages/relay/package.json`](./packages/relay/package.json).

For an actual running server build, use:

```bash
npm run build:relay
npm run start --workspace=@agentops/relay
```

### Terminal 2: UI

```bash
npm run dev:ui
```

This starts the Vite app from [`packages/ui/package.json`](./packages/ui/package.json), typically at `http://localhost:5173`.

### Health checks

- relay health: `http://localhost:3000/health`
- UI: `http://localhost:5173`
- realtime websocket: `ws://localhost:3000/realtime`

## Recommended local workflow

1. install deps with `npm install`
2. create `.env` from [`.env.example`](./.env.example)
3. build the relay at least once
4. run the relay server
5. run the UI
6. open the Settings screen and either:
   - sign up a user/team, or
   - load demo data
7. review dashboard, approvals, timeline, kanban, and settings flows

## Temporal behavior in development

The relay tries to connect to Temporal during startup. In development, a failed Temporal connection is currently treated as expected and logged rather than crashing the whole server.

That means:

- basic local API/UI work can still be explored without Temporal
- workflow-related behavior is more complete when Temporal is actually running
- docs should describe durable execution as **present but not fully hardened**

## Current documentation map

| File | Purpose |
|---|---|
| [`AgentOPS.md`](./AgentOPS.md) | Product vision and broader roadmap |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Target architecture vs current prototype reality |
| [`docs/internal/PROJECT_MEMORY.md`](./docs/internal/PROJECT_MEMORY.md) | Ongoing project context and decisions |
| [`docs/planning/remaining-tasks.md`](./docs/planning/remaining-tasks.md) | Remaining work and roadmap slices |
| [`docs/qa-beta-testing.md`](./docs/qa-beta-testing.md) | QA and beta tester guide |

## Build verification

The root build command is:

```bash
npm run build
```

It builds shared, relay, sdk, and ui in sequence as defined in [`package.json`](./package.json).

## Reality check for contributors

When updating docs or demo instructions, describe the repository honestly:

- present implemented screens and routes as working prototype features
- present Temporal durability as partial/hardening-in-progress
- present auth/teams as local prototype scaffolding
- avoid promising production-ready security, compliance, or enterprise isolation

That distinction already matches the intent of [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and should stay consistent across future edits.
