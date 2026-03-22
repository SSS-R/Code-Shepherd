# Code Shepherd

> Unified control plane for coding agents across IDEs, local runtimes, MCP bridges, and custom agent systems.

[![Status](https://img.shields.io/badge/status-architecture%20reset-orange)](./CODE_SHEPHERD.md)
[![UI](https://img.shields.io/badge/ui-react%20pwa-61dafb)](./packages/ui)
[![Relay](https://img.shields.io/badge/relay-express%20%2B%20temporal-111827)](./packages/relay)
[![SDK](https://img.shields.io/badge/sdk-typescript-3178c6)](./packages/sdk)

## What Code Shepherd is

Code Shepherd is being shaped into a **multi-agent communication and control layer**.

The product goal is not to create a new model, a new IDE, or a new agent framework.
The goal is to let developers connect existing systems such as Claude Code, Antigravity, Codex, Copilot, Kilo Code, OpenClaw, and custom agents into one place so they can:

- see which agents are online
- send tasks or follow-up commands
- receive replies and status updates
- approve risky actions remotely
- manage multiple agents at the same time
- keep an audit trail across all sessions

## Core product principle

Code Shepherd should work even when the connected agent does not natively support Code Shepherd.

That means the platform must support multiple connection patterns:

- native MCP integrations
- custom bridges or local companion processes
- IDE plugins or extension-based bridges
- command-driven installers or local helper software
- monitor-only integrations for tools that do not yet allow full bidirectional control

The user must keep the source machine online. If the PC, laptop, IDE, or local agent session is offline, Code Shepherd can show the last known state but cannot actively communicate with that agent.

## Product direction

The product center is now:

1. **Inbox and conversations** with connected agents
2. **Agent registry and presence** across devices and IDEs
3. **Approvals and intervention** for risky actions
4. **Parallel multi-agent coordination**
5. **Audit and replay** across sessions

Approvals remain critical, but they are now part of a broader multi-agent control flow rather than the entire product identity.

## Current repository reality

This repository is still a **prototype**. It already includes meaningful building blocks, but it does **not** yet implement the full unified agent inbox experience.

### Implemented now

- agent registration and heartbeat tracking
- approval request creation, listing, and decision handling
- approval summaries and code diff previews
- audit log and agent timeline endpoints
- realtime event broadcasting foundation
- local auth, teams, invitations, and role-aware routes
- task API and kanban-oriented UI surface
- demo seed endpoint for local QA flows
- TypeScript SDK for agent registration, heartbeats, approvals, and polling helpers
- React and Vite PWA shell for mobile-first supervision

### Not implemented yet

- conversation threads between user and agents
- message routing to connected agents
- adapter layer for IDE-specific and custom-agent bridges
- agent capability tiers such as monitor-only, approval-capable, and full chat control
- unified inbox for simultaneous multi-agent communication
- connector installation flow for bridges, plugins, and local helpers

## Target connection model

Every connected agent should appear inside Code Shepherd as a normalized session with:

- identity
- adapter type
- connection status
- capability level
- active conversation or task context
- pending approvals
- last known activity

Examples of future integration categories:

- IDE-native agents like Claude Code, Antigravity, Codex, Copilot, and Kilo Code
- MCP-capable agents
- custom local agents started by scripts or CLIs
- bridge-connected tools that require a plugin, extension, or helper daemon
- direct session integrations such as the OpenClaw main session path

## Monorepo layout

```text
code-shepherd/
├── packages/
│   ├── relay/   # Relay server, workflows, approvals, audit, future adapter runtime
│   ├── ui/      # PWA for inbox, agent visibility, approvals, timeline, settings
│   ├── sdk/     # Agent and bridge-facing TypeScript client
│   └── shared/  # Shared types and future cross-adapter contracts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── internal/
│   └── planning/
├── CODE_SHEPHERD.md
├── README.md
└── .env.example
```

## What the next product slice should deliver

The next architecture-aligned milestone should prove this experience:

1. two or more agents register from different tools
2. the user sees them in one shared interface
3. the user selects one or more agents and sends instructions
4. agents respond back into their own threads or work queues
5. risky actions still require approval
6. the user can intervene from desktop or phone without sitting at the original machine

## Local development setup

### Prerequisites

- Node.js 18+
- npm 9+
- optional: Temporal running at `localhost:7233`

### Install dependencies

From the repo root:

```bash
npm install
```

### Configure environment

Copy [`.env.example`](./.env.example) to [`.env`](./.env) and adjust values if needed.

Important defaults:

```bash
PORT=3000
DATABASE_PATH=./relay.db
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=code-shepherd-queue
```

For push notifications, generate VAPID keys with:

```bash
cd packages/relay && npx ts-node src/utils/vapidKeys.ts
```

## Running the current prototype locally

Open two terminals from the repo root.

### Terminal 1: relay

```bash
npm run dev:relay
```

### Terminal 2: UI

```bash
npm run dev:ui
```

### Health checks

- relay health: `http://localhost:3000/health`
- UI: `http://localhost:5173`
- realtime websocket: `ws://localhost:3000/realtime`

## Documentation map

| File | Purpose |
|---|---|
| [`CODE_SHEPHERD.md`](./CODE_SHEPHERD.md) | Product vision, revised architecture direction, phased roadmap |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Target system and prototype reality |
| [`docs/planning/remaining-tasks.md`](./docs/planning/remaining-tasks.md) | Execution order for the next product-defining work |

## Reality check for contributors

When describing the project, keep this distinction clear:

- **current repo:** approval-centric prototype with agent visibility foundations
- **target product:** unified communication and control plane for many external agents

Do not describe the current repository as if cross-agent chat, bridge installation, or multi-agent command dispatch is already complete.
