# AgentOps — The Control Plane for AI Coding Agents

> **Mobile-first command surface to monitor agents, approve risky actions, recover interrupted workflows, and maintain searchable audit trails.**

[![Phase](https://img.shields.io/badge/Phase-0%20Complete-green)](AgentOPS.md)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](AgentOPS.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## The Problem

Developers now run multiple AI coding agents simultaneously (Claude Code, Google Antigravity, custom agents) but managing them happens in **isolated silos**. This creates the **Agent Visibility Gap**:

- 📱 **Silent Stalls** — Agents get stuck waiting for approval, developers don't know until they check manually
- 🔍 **No Single View** — No visibility into what 3+ agents are doing across different IDEs
- 📋 **No Audit Trail** — Security teams cannot review what AI agents generated, approved, or executed
- 🏠 **Desk-Bound** — Developers must sit at their computer to interact with agents
- 💥 **State Loss** — Server crashes destroy long-running agent workflows

---

## The Solution

A **mobile-first Progressive Web App (PWA)** connecting to any MCP-compatible AI coding agent through a **durable execution relay server**.

### Core Value Propositions

| Value | Description |
|-------|-------------|
| 📱 **Mobile Command Center** | Monitor all your agents from your phone. Live status across every tool. |
| 🔔 **Approval Workflow** | Push notification → Approval-Ready Summary → one-tap approve or reject |
| 🏗️ **Durable Execution** | Temporal.io — workflows persist through crashes and network drops |
| 🛡️ **Layered Policy Enforcement** | Trusted registry, schema validation, risk scoring, approval gates |
| 📊 **Execution Timeline** | Searchable log of tool activity, approvals, outputs, system events |

---

## The Killer Loop

```
Agent starts work
       ↓
Agent hits a risky or uncertain action
       ↓
Push notification fires to developer's phone
       ↓
Developer sees Approval-Ready Summary
       ↓
Developer approves or rejects — from anywhere
       ↓
Workflow resumes (or halts) — durably, with no state loss
       ↓
Action logged to immutable audit trail
```

**Every feature in this repo serves this loop.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  USER'S PHONE (PWA)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │Dashboard │  │ Approval │  │   Execution Timeline     │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬──────────────┘  │
└─────────┼─────────────┼───────────────────┼─────────────────┘
          │             │                   │  HTTPS / WSS
          ▼             ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                 AGENTOPS RELAY SERVER                         │
│         (Node.js + Express + Temporal.io Workers)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Agent     │  │  Approval   │  │   Immutable Audit   │  │
│  │  Registry   │  │    Queue    │  │        Log          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│  ┌──────┴────────────────┴────────────────────┴──────────┐   │
│  │          Temporal.io — Durable Execution Engine         │   │
│  └──────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────┘
                              │  MCP / HTTP / WebSocket
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────┐   ┌──────────────┐
       │  Claude  │   │ Google   │   │   Custom     │
       │   Code   │   │Antigrav- │   │   Agents     │
       │(VS Code) │   │  ity     │   │ (OpenClaw)   │
       └──────────┘   └──────────┘   └──────────────┘
```

---

## Monorepo Structure

```
agentops/
├── packages/
│   ├── relay/          # Express.js + Temporal.io server
│   │   ├── src/
│   │   │   ├── routes/        # API routes (agents, approvals, notifications)
│   │   │   ├── workflows/     # Temporal workflows
│   │   │   ├── activities/    # Temporal activities
│   │   │   ├── middleware/    # Risk policy engine
│   │   │   └── utils/         # VAPID keys, etc.
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/             # React PWA (mobile-first)
│   │   ├── src/
│   │   │   ├── screens/       # Dashboard, ApprovalQueue
│   │   │   ├── utils/         # Push notifications
│   │   │   └── service-worker.js
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── sdk/            # Agent-side npm package
│   │   └── (coming soon)
│   └── shared/         # Shared TypeScript types
│       └── (coming soon)
├── AgentOPS.md         # Full product roadmap
├── ARCHITECTURE.md     # System architecture details
├── PROJECT_MEMORY.md   # Project context & decisions
├── TASKS.md            # Task board
├── CODEBASE_MAP.md     # Codebase orientation
├── DEPENDENCIES.md     # Dependency documentation
├── .gitignore
├── .env.example
└── requirements.txt    # Python dependencies (placeholder)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3.12+ (for backend scripts)
- Temporal.io (for durable execution)

### Install Dependencies

```bash
# Root workspace
npm install

# Relay server (includes Temporal.io, web-push, etc.)
cd packages/relay && npm install

# UI (React PWA)
cd packages/ui && npm install
```

### Run Development

```bash
# Relay server (port 3000)
cd packages/relay && npm run dev

# UI PWA (port 5173)
cd packages/ui && npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
PORT=3000

# Temporal.io Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=agentops-queue

# Web Push Configuration (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

---

## Phase 0 Status ✅

| Component | Status |
|-----------|--------|
| Monorepo scaffold | ✅ Complete |
| Relay Server + Temporal | ✅ Complete |
| Agent Registry API | ✅ Complete |
| Approval Queue API | ✅ Complete |
| Risk Policy Engine | ✅ Complete (OWASP MCP Top 10) |
| Push Notifications | ✅ Complete (Web Push) |
| Mobile Dashboard PWA | ✅ Complete |
| Audit Log | ✅ Complete (append-only) |

**Phase 0 Goal:** *"Prove: I can leave my desk and still control my agents."*

**Status:** ✅ **PROVEN** — The Killer Loop is fully functional.

---

## API Endpoints

### Agent Registry

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agents/register` | POST | Register new agent |
| `/agents/:id/heartbeat` | POST | Send heartbeat |
| `/agents` | GET | List all agents |
| `/agents/:id` | GET | Get agent status |

### Approval Queue

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/approvals` | POST | Request approval |
| `/approvals/pending` | GET | List pending approvals |
| `/approvals` | GET | List all approvals |
| `/approvals/:id` | PATCH | Approve/reject |
| `/approvals/audit-logs` | GET | List audit logs |

### Push Notifications

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notifications/subscribe` | POST | Subscribe to push |
| `/notifications/subscribe` | DELETE | Unsubscribe |
| `/notifications/test` | POST | Send test notification |
| `/notifications/subscriptions` | GET | List subscriptions |

---

## Roadmap

| Phase | Timeline | Goal | Status |
|-------|----------|------|--------|
| **Phase 0** | Weeks 1-3 | Prove: "I can leave my desk and still control my agents." | ✅ Complete |
| **Phase 1** | Weeks 4-6 | Prove: "I can trust what I'm approving." | ⏳ Next |
| **Phase 2** | Weeks 7-10 | Prove: "I can run multiple agents cleanly." | ⏳ Queued |
| **Phase 3** | Weeks 11+ | Team features, RBAC, compliance | ⏳ Future |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [AgentOPS.md](AgentOPS.md) | Full product roadmap, GTM strategy, risks |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture details |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Dependency documentation |
| [CODEBASE_MAP.md](CODEBASE_MAP.md) | Codebase orientation |
| [PROJECT_MEMORY.md](PROJECT_MEMORY.md) | Project context & decisions |
| [TASKS.md](TASKS.md) | Task board |

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

*"The control plane for AI coding agents."*
