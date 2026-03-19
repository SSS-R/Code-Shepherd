# Architecture: AgentOps

## Document Scope

This document describes two things clearly:

1. **Target Architecture** — the intended system from [`agentops/AgentOPS.md`](agentops/AgentOPS.md)
2. **Current Prototype Reality** — what the repository currently implements

This separation prevents roadmap goals from being mistaken for completed implementation.

---

## System Overview

AgentOps is a **mobile-first control plane for AI coding agents** with durable execution, approval workflows, and searchable audit history.

**Core Insight:** The developer's phone is always with them. If agents can push approval requests to a mobile app and resume cleanly after human decisions, developers can govern agent work from anywhere.

---

## Target Architecture

The target architecture in [`agentops/AgentOPS.md`](agentops/AgentOPS.md) is:

```
┌───────────────────────────────────────────────────────────────────┐
│                       USER'S PHONE (PWA)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐    │
│  │Dashboard │  │ Approval │  │Execution │  │    Kanban     │    │
│  │ (Home)   │  │  Queue   │  │ Timeline │  │    Board      │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘    │
│  ┌────┴──────────────┴─────────────┴────────────────┴────────┐   │
│  │     AgentOps API Client + WebAssembly Terminal (fallback)  │   │
│  └──────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────┘
                              │  HTTPS / WSS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AGENTOPS RELAY SERVER                         │
│         (Node.js + Express + Temporal.io Workers)               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Agent     │  │  Approval   │  │   Immutable Audit Log   │  │
│  │  Registry   │  │    Queue    │  │  (Execution Timeline)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────────┘  │
│  ┌──────┴────────────────┴────────────────────┴──────────────┐   │
│  │             Temporal.io — Durable Execution Engine         │   │
│  └──────────────────────────┬────────────────────────────────┘   │
│  ┌──────────────────────────┴────────────────────────────────┐   │
│  │ Notification Engine (Web Push / Slack / Email / Webhook)  │   │
│  └──────────────────────────┬────────────────────────────────┘   │
│  ┌──────────────────────────┴────────────────────────────────┐   │
│  │             MCP Policy Enforcement Layer                   │   │
│  │  Trusted Registry · Schema Validation · Risk Scoring       │   │
│  │  Sandboxing · Scoped Credentials · Egress Controls         │   │
│  └──────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────┘
                              │  MCP / HTTP / WebSocket
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐   ┌──────────┐   ┌──────────────┐
       │  Claude  │   │ Google   │   │   Custom     │
       │   Code   │   │Antigrav- │   │   Agents     │
       │(VS Code) │   │  ity     │   │ (OpenClaw,   │
       └──────────┘   └──────────┘   │  Cline...)   │
                                     └──────────────┘
```

---

## Current Prototype Architecture

The repository currently implements a **working prototype subset** of the target:

```
┌─────────────────────────────────────────────────────────────┐
│                  USER'S PHONE / BROWSER                    │
│  Dashboard · Approval Queue · Agent Detail · Timeline      │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  RELAY SERVER (Express)                    │
│  Agents API · Approvals API · Audit API · Notifications    │
│  Workflow list/resume scaffold · SQLite persistence        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                    Temporal scaffold + workers
                              │
                              ▼
                      Connected coding agents
```

### Implemented now
- Agent registration and heartbeat
- Approval creation and decision flow
- Approval summaries and code diff preview
- Push notification subscription/test support
- Agent timeline and active workflow UI
- Agent-side SDK for registration, heartbeat, and approval polling

### Not fully implemented yet
- Full Kanban/task orchestration
- WebAssembly terminal fallback
- Real-time WebSocket streaming
- Full MCP policy enforcement stack
- Containerized sandbox execution
- Team steering / RBAC / multi-tenant architecture
- Complete Temporal-driven resumability semantics

---

## Core Data Flow

1. Agent registers with the relay through the SDK
2. Agent sends heartbeats to remain visible in the dashboard
3. Agent hits a risky or uncertain action
4. Relay stores an approval request and sends a push notification
5. Developer reviews the approval card in the PWA
6. Developer approves or rejects the request
7. Agent resumes, halts, or times out depending on workflow logic
8. Audit events are recorded for the full interaction path

This matches the killer loop defined in [`agentops/AgentOPS.md`](agentops/AgentOPS.md), even though some target-state subsystems are still partial.

---

## Key Architecture Decisions

| Decision | Choice | Status | Rationale |
|----------|--------|--------|-----------|
| **Durable Execution** | Temporal.io | Partial | Persists workflow state through crashes and pauses; current repo has worker/client scaffolding and workflow routes, but resume hardening is still ongoing. |
| **PWA First** | Progressive Web App | Active | Ships to Android + Desktop quickly without app store friction. |
| **Relay Server** | Centralized Node.js + Express relay | Active | Solves connectivity, centralizes approvals, notifications, and audit logging. |
| **MCP Protocol** | Model Context Protocol | Strategic target | Keeps the system vendor-neutral across agent frameworks and IDEs. |
| **MCP Security** | Layered enforcement | Partial | Risk scoring exists now; trusted registry, sandboxing, scoped credentials, and egress controls are target-state items. |
| **WebAssembly Terminal** | `ghostty-web` over `xterm.js` | Planned | Better mobile terminal UX than traditional browser terminals. |
| **Git Worktrees** | Per-task isolation | Planned | Prevents cross-agent conflicts during parallel execution. |
| **SQLite → PostgreSQL** | Progressive migration path | Active plan | SQLite is enough for solo/beta; PostgreSQL is for multi-user/team phases. |

---

## Security Architecture

### Target Security Model

The target model from [`agentops/AgentOPS.md`](agentops/AgentOPS.md) includes:
- trusted tool registry
- schema validation
- risk scoring
- approval gates
- sandboxing
- scoped credentials
- outbound egress controls
- immutable audit trail

### Current Prototype Security Reality

The current repository implements only part of that model:
- **basic risk scoring** in the relay
- **approval gating** through the approval queue
- **append-only style audit logging** in SQLite

The following are **not yet implemented as full architecture components** and should not be described as complete in beta-facing docs:
- per-user scoped auth tokens
- approved client ID registry
- containerized sandbox execution
- outbound egress restrictions
- tenant-scoped audit isolation

---

## Notification Architecture

### Target State
- Web Push
- Slack
- Email
- Webhook escalation

### Current State
- Web Push API support is implemented
- other channels remain roadmap items

---

## UI Architecture

### Target State
- Dashboard
- Approval Queue
- Execution Timeline
- Kanban Board
- Settings
- Terminal fallback

### Current State
- Dashboard
- Approval Queue
- Agent Detail
- Session Timeline
- Active Workflows widget

---

## Orchestration Framework Position

AgentOps is **framework-agnostic**. It orchestrates agent sessions rather than forcing one internal agent framework.

| Framework | Strength | Assessment |
|-----------|----------|------------|
| **LangGraph** | Cyclical graphs with checkpoints | Strong candidate for complex workflow logic inside agents |
| **CrewAI** | Role-based agent swarms | Good for rapid prototyping, less production control |
| **AutoGen** | Conversation-driven collaboration | Better for research than production orchestration |
| **OpenAI Agents SDK** | Native handoffs + Temporal integration | Strong option, but comes with vendor lock-in risk |
| **LlamaIndex** | Data-centric RAG orchestration | Complementary, not a session orchestrator |

---

## Scalability Notes

- SQLite is acceptable for solo usage and beta validation
- PostgreSQL should be introduced before team/multi-tenant rollout
- Temporal workers can scale horizontally as workflow volume grows
- PWA delivery can scale through standard static hosting/CDN patterns

---

## Near-Term Architecture Priorities

Before beta, architecture work should focus on:

1. workflow hardening in [`agentops/packages/relay/src/workflows/approvalWorkflow.ts`](agentops/packages/relay/src/workflows/approvalWorkflow.ts)
2. stronger policy enforcement in [`agentops/packages/relay/src/middleware/riskPolicy.ts`](agentops/packages/relay/src/middleware/riskPolicy.ts)
3. tests and CI from [`agentops/docs/planning/remaining-tasks.md`](agentops/docs/planning/remaining-tasks.md)
4. execution-timeline and workflow behavior validation end-to-end

---

## Future Architecture Considerations

- Kanban-backed task orchestration
- Git worktree isolation
- WebAssembly terminal fallback
- Team steering modes
- RBAC and team management
- tenant-scoped audit partitions
- on-prem deployment model
