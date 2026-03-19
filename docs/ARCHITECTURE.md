# Architecture: AgentOps

## System Overview

AgentOps is a **mobile-first agent orchestration platform** with crash-resilient workflow execution via Temporal.io.

**Core Insight:** The developer's phone is always with them. If agents push notifications and accept approvals from a mobile app, developers can govern AI work from anywhere.

---

## Components

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
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │         MCP Policy Enforcement Layer                     │  │
│  │  Trusted Registry · Schema Validation · Risk Scoring     │  │
│  └──────────────────────────┬──────────────────────────────┘  │
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

## Data Flow

1. **Agent connects** → SDK registers with relay server, starts heartbeat (every 30s)
2. **Agent hits risky action** → Sends approval request to relay server
3. **Relay server** → Stores in Approval Queue, fires push notification
4. **Developer approves** → PWA sends approval decision
5. **Temporal worker** → Resumes workflow with decision
6. **Audit Log** → Every action, approval, system event logged immutably

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Durable Execution** | Temporal.io | Persists workflow state through crashes, container restarts, network drops. Supports human-in-the-loop pauses via Signals/Queries. |
| **PWA First** | Progressive Web App | Ships to Android + Desktop Chrome/Edge immediately. No app store friction. iOS supported via Home Screen web apps. |
| **Centralized Relay** | Node.js + Express | Agents run behind NATs and firewalls. Relay solves connectivity, centralizes policy enforcement, owns audit log. |
| **MCP Protocol** | Model Context Protocol | Vendor-neutral. Claude, Antigravity, Cline, custom agents all support it. |
| **Layered Policy Enforcement** | OWASP MCP Top 10 | Trusted registry, schema validation, risk scoring, sandboxing, approval gates. |
| **SQLite → PostgreSQL** | Progressive | Zero-config for solo users. Postgres when teams are added. |

---

## Security Considerations

| Layer | Protection |
|-------|------------|
| **Authentication** | Agent registration with client ID registry |
| **Authorization** | Per-user scoped tokens, short-lived |
| **Policy Enforcement** | Trusted tool registry, schema validation, risk scoring |
| **Sandboxing** | Containerized execution for risky commands |
| **Audit Trail** | Append-only, immutable log of all actions |

Based on **OWASP MCP Top 10** security guidelines.

---

## Scalability Notes

- **SQLite** can be upgraded to PostgreSQL for teams
- **Temporal.io** supports distributed workers across regions
- **npm workspaces** allow independent package versioning
- **PWA** scales via CDN (no app store deployment)

---

## Orchestration Framework

AgentOps is **framework-agnostic** — we orchestrate agent *sessions* (registration, heartbeats, approvals, audit) via Temporal.io. Developers can use any framework inside their agents:

| Framework | Strength | Our Assessment |
|-----------|----------|----------------|
| **LangGraph** | Cyclical graphs with native checkpoints | Strong candidate for complex workflow logic |
| **CrewAI** | Role-based agent swarms | Good for rapid prototyping |
| **AutoGen** | Conversation-driven collaboration | Better for research than production |
| **OpenAI Agents SDK** | Native handoff + Temporal integration | Excellent, vendor lock-in risk |

---

## Future Considerations

- **iOS Native App** — React Native wrapper after v1 revenue
- **Git Worktrees** — Per-task isolation to prevent cross-agent conflicts
- **WebAssembly Terminal** — ghostty-web for mobile SSH fallback
- **Team Steering** — Propose-and-Approve vs Supervised Remote Control modes
