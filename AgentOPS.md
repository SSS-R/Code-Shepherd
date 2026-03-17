# AgentOps — Product Roadmap

**Version:** 2.0 | **Date:** March 18, 2026 | **Status:** Pre-Launch

> **The control plane for AI coding agents.**

AgentOps gives developers a mobile-first command surface to monitor agents, approve risky actions, recover interrupted workflows, and maintain a searchable audit trail across every session. Instead of babysitting terminals, developers get durable, policy-aware control over AI work in progress.

---

## The Killer Loop

This is the core product experience everything else is built around:

```
Agent starts work
       ↓
Agent hits a risky or uncertain action
       ↓
Push notification fires to developer's phone
       ↓
Developer sees Approval-Ready Summary (context, risk, diff)
       ↓
Developer approves or rejects — from anywhere
       ↓
Workflow resumes (or halts) — durably, with no state loss
       ↓
Action logged to immutable audit trail
```

**Every feature in this roadmap serves this loop.**

---

## 1. The Problem

Software development has entered the agentic era. Developers now run multiple AI coding agents — Claude Code in VS Code, Google Antigravity in another IDE, custom agents in the terminal — often simultaneously. But managing these agents happens in isolated silos, creating what we call the **Agent Visibility Gap** — where an agent's state is locked locally on one developer's machine, making it impossible to govern, audit, or recover from failures.

### Pain Points

| # | Problem | Who Feels It | Impact |
|---|---------|-------------|--------|
| 1 | **Silent Stalls** — Agents get stuck waiting for approval, but the developer doesn't know until they check manually | Solo Developers | Lost hours of agent productivity |
| 2 | **The Agent Visibility Gap** — No single view of what 3+ agents are doing across different IDEs and terminals | Power Users | Context-switching overhead, duplicated work |
| 3 | **No Audit Trail** — Security teams cannot review what AI agents generated, approved, or executed | Enterprise Teams | Compliance risk, security blind spot |
| 4 | **Desk-Bound Interaction** — Developers must sit at their computer to interact with agents | Everyone | Quality-of-life friction |
| 5 | **State Loss on Failure** — Server crashes or network drops destroy long-running agent workflows | All Users | Wasted compute, broken context |
| 6 | **Review Drift** — Developers increasingly trust agent output without critical review, introducing silent regressions. Studies on AI productivity tools have found that review discipline decays as reliance grows, sometimes negating expected productivity gains. | Teams & Managers | Quality degradation, security risk |

**Core Insight:** The developer's phone is always with them. If agents push notifications and accept approvals from a mobile app, developers can govern AI work from anywhere — and if the execution layer persists state durably, no work is ever lost.

---

## 2. The Solution

A **mobile-first Progressive Web App (PWA)** connecting to any MCP-compatible AI coding agent through a durable execution relay server — providing crash-resilient orchestration, human-in-the-loop approvals, and policy-governed audit trails.

### Core Value Propositions

| Value | Description |
|-------|-------------|
| 📱 **Mobile Command Center** | Monitor all your agents from your phone. Live status across every tool. |
| 🔔 **Approval Workflow** | Push notification → Approval-Ready Summary → one-tap approve or reject. No IDE required. |
| 🏗️ **Durable Execution** | Temporal.io — workflows persist through crashes and network drops. Designed for resumability, not just retry. |
| 🛡️ **Layered Policy Enforcement** | Trusted tool registry, schema validation, risk scoring, sandboxing, scoped credentials, egress controls, and approval gates. Based on OWASP MCP Top 10. |
| 📊 **Execution Timeline** | Searchable log of tool activity, approvals, outputs, and system events. Not raw logs — structured, auditable records. |
| 🎯 **Team Steering** | Two modes: *Propose-and-Approve* (suggestion requires local dev acceptance) and *Supervised Remote Control* (full steering with explicit consent and session recording). |

---

## 3. Target Architecture

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
│                    AGENTOPS RELAY SERVER                          │
│         (Node.js + Express + Temporal.io Workers)                 │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Agent     │  │  Approval   │  │   Immutable Audit Log   │  │
│  │  Registry   │  │    Queue    │  │  (Execution Timeline)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────────┘  │
│  ┌──────┴────────────────┴────────────────────┴──────────────┐   │
│  │             Temporal.io — Durable Execution Engine         │   │
│  └──────────────────────────┬─────────────────────────────── ┘   │
│  ┌──────────────────────────┴────────────────────────────────┐   │
│  │  Notification Engine (Web Push / Slack / Email / Webhook)  │   │
│  └──────────────────────────┬─────────────────────────────── ┘   │
│  ┌──────────────────────────┴────────────────────────────────┐   │
│  │             MCP Policy Enforcement Layer                   │   │
│  │  Trusted Registry · Schema Validation · Risk Scoring       │   │
│  │  Sandboxing · Scoped Credentials · Egress Controls         │   │
│  └──────────────────────────┬─────────────────────────────── ┘   │
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

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Durable Execution | Temporal.io | Persists workflow state through crashes, container restarts, and network drops. Supports human-in-the-loop pauses via Signals/Queries. Official OpenAI Agents SDK integration. |
| PWA first | PWA | Ships to Android + Desktop Chrome/Edge immediately, no app store. iOS is supported for Home Screen web apps (Web Push landed in iOS 16.4, Declarative Web Push in iOS 18.4) but higher onboarding friction makes it a secondary optimization target for v1. |
| Relay server | Centralized relay | Agents run behind NATs and firewalls. Relay solves connectivity, centralizes policy enforcement, and owns the audit log. |
| MCP protocol | Model Context Protocol | Vendor-neutral. Claude, Antigravity, Cline, and custom agents all support it. |
| MCP Security | Layered policy enforcement | Based on OWASP MCP Top 10. Not just scanning — trusted registry, schema validation, risk scoring, sandboxing, egress controls, approval gates. |
| WebAssembly terminal | ghostty-web over xterm.js | xterm.js has poor mobile touch support (broken pinch-to-zoom, no proper text selection handles). ghostty-web is ~400KB WASM, GPU-accelerated, handles Unicode correctly on mobile. |
| Git Worktrees | Per-task isolation | Each agent task gets an isolated git worktree + terminal session (tmux/zellij). Prevents cross-agent merge conflicts. |
| SQLite → PostgreSQL | Progressive | Zero-config for solo users. Postgres when teams are added. |

### Orchestration Framework Evaluation

AgentOps is **framework-agnostic** — we orchestrate agent *sessions* (registration, heartbeats, approvals, audit) via Temporal.io. Developers can use any framework inside their agents:

| Framework | Strength | Our Assessment |
|-----------|----------|----------------|
| **LangGraph** | Cyclical graphs with native checkpoints | Strong candidate for complex workflow logic inside agents |
| **CrewAI** | Role-based agent swarms | Good for rapid prototyping, less production control |
| **AutoGen** | Conversation-driven collaboration | Better for research than production orchestration |
| **OpenAI Agents SDK** | Native handoff triggers + Temporal integration | Excellent, vendor lock-in risk |
| **LlamaIndex** | Data-centric RAG orchestration | Complementary, not a session orchestrator |

---

## 4. Product Roadmap

The roadmap is structured around four phases. Each phase proves one thing before adding the next.

---

### Phase 0: The Wedge *(Weeks 1–3)*

> **Prove: "I can leave my desk and still control my agents."**
>
> Ship only the killer loop. Nothing else.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Monorepo Scaffold** | `packages/relay`, `packages/ui`, `packages/sdk`, `packages/shared` — with npm workspaces, TypeScript configs | 🔴 Critical |
| **Relay Server (Temporal scaffold)** | Express + TypeScript + Temporal workers. Auth, CORS, SQLite. Crash-resilient from day one. | 🔴 Critical |
| **Agent Registry API** | `POST /agents/register`, heartbeat every 30s, marked Offline after 90s silence. State persisted in Temporal. | 🔴 Critical |
| **Approval Queue API** | `POST /approvals`, `GET /approvals/pending`, `PATCH /approvals/:id` | 🔴 Critical |
| **Risk Policy Engine** | Block auto-approval for: secrets/env files, destructive commands, production branch merges, infra changes | 🔴 Critical |
| **Push Notifications** | Web Push via Service Worker. Android + Desktop Chrome/Edge primary. Slack/Discord as fallback. | 🔴 Critical |
| **Mobile Dashboard** | Agent status (Online / Busy / Stalled / Offline). Approval Queue. Swipe-to-approve cards. | 🔴 Critical |
| **Append-Only Audit Log** | Every agent action, approval, and system event logged with timestamp, agent ID, action type, outcome | 🔴 Critical |
| **Agent-Side SDK** | `@agentops/sdk` — npm package agents import to register, send heartbeats, request approvals | 🟡 High |

**Phase 0 Deliverable:** A developer installs the SDK, registers 2 agents, walks away from their desk. One agent requests a risky approval. Their phone buzzes. They swipe approve. The workflow resumes. If their server crashes mid-session, the workflow resumes exactly where it left off.

---

### Phase 1: Make It Trustworthy *(Weeks 4–6)*

> **Prove: "I can trust what I'm approving."**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Approval-Ready Summaries** | Replace raw log diffs with structured artifact cards: what the agent wants to do, why, what changes, risk level | 🔴 Critical |
| **Diff Preview** | Inline code diff with syntax highlighting in approval cards | 🔴 Critical |
| **Approval Reason Capture** | Developers add a reason when rejecting. Logged to audit trail. Builds a training signal. | 🟡 High |
| **Session Replay (lite)** | Replay key decision points of a completed agent session — approvals requested, what was shown, what was decided | 🟡 High |
| **Resumable Workflows** | Explicit UI to see interrupted sessions and manually trigger resume | 🟡 High |
| **Approval Timeout & Escalation** | Auto-reject after configurable timeout. Escalate to a fallback contact. | 🟡 High |
| **Execution Timeline (basic)** | Structured, searchable log of tool activity, approvals, outputs, and system events — replaces raw terminal streaming | 🟡 High |

**Phase 1 Deliverable:** A developer opens an approval notification, sees a clear summary of what the agent wants to do and why, reviews the exact diff, adds a rejection reason, and the agent receives structured feedback. Every decision is logged.

---

### Phase 2: Make It Operational *(Weeks 7–10)*

> **Prove: "I can run multiple agents cleanly."**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Kanban Task Board** | Drag-and-drop board. States: `Queued → In Progress → Blocked → Done → Failed`. Backed by Temporal. | 🔴 Critical |
| **Task Assignment** | Assign tasks to specific agents from the mobile UI | 🟡 High |
| **Git Worktree Isolation** | On task creation, auto-create an isolated git worktree + tmux terminal session for the agent. No cross-agent conflicts. | 🟡 High |
| **Priority & Labels** | P0–P3 priority levels, custom color-coded labels | 🟡 High |
| **WebAssembly Terminal (fallback)** | ghostty-web embedded terminal — SSH into agent environment when approval summaries aren't enough context | 🟡 High |
| **Execution Timeline (full)** | Full audit export: date range, agent filter, action type filter, CSV/JSON download | 🟢 Medium |
| **Task Dependencies** | Mark tasks as "blocked by" another task. Visualize the dependency chain. | 🟢 Medium |

**Phase 2 Deliverable:** A developer manages 3 parallel agents from their phone. Each runs in an isolated worktree. Tasks are prioritized and tracked. When one agent gets stuck, the developer opens the terminal fallback, diagnoses the issue, and resumes.

---

### Phase 3: Make It Collaborative *(Months 3–4)*

> **Prove: "Teams can govern this — not just solo hackers."**

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Sign up / login with email + password or OAuth (GitHub, Google) | 🔴 Critical |
| **Team Management** | Create teams, invite members, manage seats | 🔴 Critical |
| **Role-Based Access Control** | Admin (full), Developer (approve + view), Viewer (read-only audit) | 🟡 High |
| **Propose-and-Approve Steering** | Remote teammate suggests a prompt → local dev must accept before it's sent | 🟡 High |
| **Supervised Remote Control** | Full remote steering with explicit local consent + session recording for audit | 🟡 High |
| **Compliance Dashboard** | AI-generated line counts, approval rate, rejection reasons, Review Drift index (ratio of rubber-stamp approvals to reasoned reviews) | 🟡 High |
| **SSO / SAML / OIDC** | Enterprise single sign-on | 🟡 High |
| **Tenant-Scoped Audit Partitions** | Each team's logs are strictly isolated | 🟢 Medium |
| **On-Premises Deployment** | Self-hosted option for enterprises that cannot use cloud | 🟢 Medium |

**Phase 3 Deliverable:** A 5-person engineering team uses AgentOps with GitHub SSO. The engineering manager can view all agents, audit all AI-generated code, and track review discipline. Nothing runs on production infrastructure without a logged human approval.

---

## 5. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile UI** | React + Vite + TypeScript + Tailwind CSS (PWA) | Cross-platform, installable on Android + Desktop, no app store |
| **Embedded Terminal** | ghostty-web (WebAssembly + WebGL) | ~400KB WASM bundle, GPU-accelerated, proper mobile touch gestures. xterm.js has open mobile touch bugs. |
| **Relay Server** | Node.js + Express + TypeScript | MCP SDK support, same language as frontend |
| **Durable Execution** | Temporal.io | Persists workflow state. Human-in-the-loop via Signals/Queries. OpenAI Agents SDK integration available. |
| **Database** | SQLite (Phase 0) → PostgreSQL (Phase 3) | Zero-config solo, Postgres for teams |
| **Push Notifications** | Web Push API + Service Worker | Android + Desktop. iOS supported (Home Screen web apps, 16.4+) but secondary optimization target. |
| **Real-time** | WebSocket (`ws`) | Agent status updates, execution timeline streaming |
| **Agent Protocol** | Model Context Protocol (MCP) | Vendor-neutral standard across Claude, Antigravity, Cline, custom agents |
| **MCP Security** | Layered policy enforcement (OWASP MCP Top 10) | Trusted registry, schema validation, risk scoring, sandboxing, egress controls |
| **Task Isolation** | Git Worktrees + tmux/zellij | Isolated branch + terminal per agent task |
| **Auth** | JWT + bcrypt (Phase 0) → OAuth2 / OIDC (Phase 3) | Simple start, clear upgrade path |
| **QA** | 5-layer testing stack (see Section 9) | Deterministic + replay + adversarial + model-as-a-judge + human canaries |
| **CI/CD** | GitHub Actions | Tests, linting, deployment |

---

## 6. Project Structure (Monorepo)

```
agentops/
├── packages/
│   ├── relay/                    # AgentOps Relay Server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── agents.ts     # Registration & heartbeat
│   │   │   │   ├── approvals.ts  # Approval queue
│   │   │   │   ├── tasks.ts      # Kanban CRUD
│   │   │   │   ├── audit.ts      # Execution timeline
│   │   │   │   └── steering.ts   # Propose-and-Approve / Supervised Remote Control
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/       # Auth, CORS, rate limiting
│   │   │   ├── security/         # MCP policy enforcement
│   │   │   │   ├── registry.ts   # Trusted tool registry (signed, version-locked)
│   │   │   │   ├── validator.ts  # Schema validation + risk scoring
│   │   │   │   ├── sandbox.ts    # Execution sandboxing + egress controls
│   │   │   │   └── policies.ts   # Security gate rules
│   │   │   └── temporal/
│   │   │       ├── workflows.ts
│   │   │       ├── activities.ts
│   │   │       └── worker.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                       # React PWA (Mobile-First)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   ├── ApprovalCard.tsx      # Approval-Ready Summary card
│   │   │   │   ├── ArtifactViewer.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── AuditEntry.tsx
│   │   │   │   └── Terminal.tsx          # ghostty-web WASM wrapper
│   │   │   ├── screens/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   ├── ExecutionTimeline.tsx # Renamed from AuditLog
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── Steering.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── stores/           # Zustand
│   │   │   └── types/
│   │   ├── public/sw.js          # Service worker for push
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── sdk/                      # @agentops/sdk (npm package)
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── heartbeat.ts
│   │   │   ├── approvals.ts
│   │   │   ├── artifacts.ts      # Approval-Ready Summary helpers
│   │   │   ├── worktree.ts
│   │   │   └── reporting.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── shared/
│       ├── src/
│       │   ├── types.ts
│       │   ├── security.ts
│       │   └── constants.ts
│       └── package.json
│
├── docs/
├── scripts/
├── .github/workflows/
├── package.json                  # npm workspaces root
├── tsconfig.base.json
└── README.md
```

---

## 7. Competitive Landscape

Our differentiation is not "they don't do audit logs." They do. Our differentiation is:

> **They optimize agent development visibility. We optimize mobile intervention, resumable execution, and policy-governed human approval for coding agents.**

| Product | What They Do Well | The Gap AgentOps Fills |
|---------|------------------|----------------------|
| **Langfuse** | Open-source LLM tracing, evals, prompt management. Self-hostable. ~15% overhead. | They trace LLM calls. We govern agent workflows and own the approval loop. |
| **LangSmith** | Deep LangChain/LangGraph debugging, near-zero overhead. | Ecosystem lock-in. No mobile, no approval workflow, no durable execution. |
| **AgentOps.ai** | Agent session replays, cost/token tracking. Cloud-only. ~12% overhead. | No mobile-first, no push approvals, no durable state, no self-hosting. |
| **Portkey** | LLM gateway, provider routing, guardrails, budget enforcement. | API gateway layer. No task board, no mobile control, no approval system. |
| **Maxim AI** | Pre-release simulation, span evaluation, edge-case-to-test conversion. | Testing-focused. No real-time orchestration, no mobile UI. |
| **Vibe Kanban / KanVibe** | AI agent Kanban, worktree isolation, browser terminal, review flows. | Closest competitor. No mobile-first, no push notifications, no durable execution. |

---

## 8. Revenue Model

| Tier | Price | Target | Key Features |
|------|-------|--------|-------------|
| **Solo (Free)** | $0/mo | Individual devs | 1 user, 2 agents, 7-day timeline, push notifications |
| **Pro** | $19/mo | Power users | Unlimited agents, 90-day timeline, webhooks, WASM terminal, session replay |
| **Team** | $49/mo/seat | Teams (2–20) | Multi-user, RBAC, Propose-and-Approve, 1-year timeline, compliance dashboard |
| **Enterprise** | Custom | Large orgs (20+) | SSO/SAML, Review Drift analytics, on-prem, SLA, dedicated support |

### Revenue Projections (Conservative)

| Milestone | Users | MRR |
|-----------|-------|-----|
| Phase 0 shipped | 50 free, 10 Pro | $190 |
| Phase 1 shipped | 200 free, 40 Pro, 2 Teams (5 seats) | $1,250 |
| Phase 3 shipped | 1,000 free, 150 Pro, 10 Teams (5 seats avg) | $5,300 |

---

## 9. Quality Assurance Strategy

AI agents produce **probabilistic outputs** — the same input can yield multiple valid but structurally different results. Traditional exact-match testing is wholly insufficient. Our QA strategy is a 5-layer stack:

### Layer 1 — Deterministic Tests
Covers: API contracts, approval state machine, RBAC rules, auth flows, notification routing, policy engine rules, audit log integrity.
Tools: Jest, Supertest.

### Layer 2 — Replay Tests
Saved real workflow scenarios tested on every release:
- Approval requested → approved → resumed
- Approval requested → rejected → agent halted
- Agent reconnect after network drop
- Workflow resume after server crash
- Duplicate webhook handling
- Offline agent recovery

### Layer 3 — Adversarial Security Tests
Based on OWASP MCP Top 10:
- Poisoned tool descriptions
- Prompt injection through artifact content
- Command escalation attempts
- Secret exfiltration via tool call
- Confused deputy OAuth flows

### Layer 4 — Model-as-a-Judge
LLM-based probabilistic evaluation of agent-facing outputs:

| Dimension | Pass Criteria |
|-----------|--------------|
| **Faithfulness** — is the summary grounded in the actual agent output? | 100% grounded |
| **Relevancy** — does the approval card capture the actual decision? | No missing context |
| **Clarity** — would a developer understand this in 10 seconds on a phone? | Readable at a glance |
| **Safety** — does the output expose secrets or bypass policy? | Zero violations |

### Layer 5 — Human Review Canaries
Before each release:
- 10 known-good workflows
- 10 high-risk workflows
- 5 degraded-network sessions
- 5 mobile-only approval sessions

---

## 10. Security Architecture

Security is based on the **OWASP MCP Top 10** — not a catch-all scanner, but layered defense.

### MCP Threat Coverage

| Threat | Mitigation |
|--------|-----------|
| **Prompt Injection** | Treat all model-generated content as untrusted. Context sanitization on all inbound tool call content. |
| **Tool Poisoning** | Signed, version-locked tool registry. Strict metadata validation. Lookalike/shadowed tool detection. |
| **Confused Deputy** | Per-user approved client ID registry. Exact redirect URI matching. Short-lived, audience-scoped tokens. |
| **Data Exfiltration** | Outbound egress restrictions per tool. Secret-file classification layer. Tenant-scoped data partitions. |
| **Unauthorized Execution** | All local tool execution in containerized sandboxes. Stripped default privileges and network egress. |
| **Privilege Escalation** | Command risk scoring. Mandatory human approval for P0 actions (infra changes, production merges, secrets). |

### Security Controls Matrix

| Control | Implemented In |
|---------|---------------|
| Trusted tool registry (signed, version-locked) | Phase 0 |
| Schema validation + risk scoring | Phase 0 |
| Approval gates for sensitive actions | Phase 0 |
| Outbound egress restrictions | Phase 0 |
| Secret-file classification | Phase 0 |
| Execution sandboxing | Phase 1 |
| Scoped, short-lived credentials | Phase 1 |
| Tenant-scoped audit partitions | Phase 3 |
| Immutable event log | Phase 0 |
| Human override trail (rejection reasons) | Phase 1 |
| False-positive review queue for security blocks | Phase 2 |

---

## 11. Go-To-Market Strategy

### Content Strategy: SEO + AI Citation Optimization

Traditional SEO (keyword density, backlinks) still matters for Google. But generative engines — ChatGPT, Perplexity, Google AI Overviews — increasingly synthesize answers directly. Visibility in both channels requires content that is helpful, structured, and machine-readable.

**Content moat strategy** — build extractable operational documents, not fluffy blog posts:

| Content Type | Examples |
|-------------|---------|
| **Category pages** | "AI coding agent control plane", "mobile approvals for AI agents", "audit trail for coding agents" |
| **Comparison pages** | "AgentOps vs Vibe Kanban", "AgentOps vs AgentOps.ai", "Temporal vs queue-based orchestration" |
| **Integration pages** | "Claude Code mobile approvals", "Antigravity remote approvals", "Cline audit trail setup" |
| **Research pages** | "approval latency benchmark", "crash-recovery benchmark", "risky action categories in AI coding" |
| **Security pages** | "MCP risk policy templates", "secure tool registry design", "approval gates for destructive commands" |

### Phase 1: Developer Community (Month 1–3)
- Open-source the Relay Server and SDK
- Launch blog post: *"I got tired of babysitting 3 AI coding agents, so I built this"*
- Hacker News, Reddit r/programming, Dev.to
- 60-second demo: phone notification → Approval-Ready Summary → one-tap approve → workflow resumes

### Phase 2: Thought Leadership (Month 3–6)
- Integration guides for Claude Code, Antigravity, Cursor, Cline
- Pitch to Engineering Managers: *"Your team's AI review discipline is decaying. AgentOps makes it measurable and enforceable."*
- Partner with MCP ecosystem projects
- Publish approval latency and crash-recovery benchmarks

### Phase 3: Enterprise (Month 6+)
- Pitch to CISOs: *"Your developers are running unaudited AI agents on production code."*
- Free Team tier trials for qualified enterprises
- Position as: **The control plane for AI coding agents**

### Target Queries
- *"How to manage multiple AI coding agents"*
- *"Control plane for AI agents"*
- *"Mobile approvals for AI coding workflows"*
- *"Durable execution for agent workflows"*
- *"MCP security for engineering teams"*
- *"AI coding audit trail enterprise compliance"*

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP protocol changes | Low | High | Abstract MCP behind our own policy layer. Support multiple protocols. |
| MCP prompt injection | High | Critical | Layered policy enforcement. OWASP MCP Top 10 as baseline. |
| MCP tool poisoning | High | Critical | Signed, version-locked trusted registry. Metadata validation. |
| MCP confused deputy | Medium | Critical | Per-user client ID registry. Short-lived audience-scoped tokens. |
| MCP unauthorized execution | Medium | Critical | Containerized sandbox execution. Restricted egress. |
| Vibe Kanban / KanVibe gains traction | Medium | High | Ship Phase 0 fast. Our moat is mobile + durable execution, not Kanban. |
| IDE vendors build native dashboards | Medium | High | Cross-platform, framework-agnostic. They'll only support their own IDE. |
| iOS install friction reduces push reach | High | Medium | Android + Desktop are primary in v1. iOS is secondary optimization target. |
| Review Drift worsens with auto-approvals | High | Medium | Rejection reason capture. Review Drift analytics in compliance dashboard. |
| Temporal.io adds operational complexity | Medium | Medium | Docker Compose setup. Start with basic Express, add Temporal progressively. |
| Absolute claims damage credibility | Low | High | No "zero data loss" absolutes. Use "designed for resumability", "persists execution state". |

---

## 13. Success Metrics

| Metric | Phase 0 | Phase 3 |
|--------|---------|---------|
| Registered users | 60 | 1,200 |
| Active agents connected | 100 | 5,000 |
| Approval response time (median) | < 3 min | < 60 sec |
| Push delivery rate (Android + Desktop) | > 95% | > 99% |
| Workflow recovery success rate | > 98% | > 99.9% |
| Security gate block accuracy | Tracking starts | < 1% false positive |
| MRR | $190 | $5,300 |
| GitHub stars (relay + SDK) | 200 | 2,000 |

---

## 14. Future Expansion

Intentionally deferred to post-revenue:

### iOS Native App
iOS PWA has higher onboarding friction (manual "Add to Home Screen", no auto-install prompt). Web Push and Declarative Web Push are supported since iOS 16.4 and 18.4 respectively — but until install friction is meaningfully reduced, React Native is a better investment. Strategy: generate revenue on Android + Desktop, then ship a React Native wrapper.

### Autonomous Marketing Agents
After v1 is live: deploy internal agents for competitive intelligence (monitor rival pricing, feature rollouts) and GEO content generation (analyze search gaps, generate extractable operational documents automatically).

---

## 15. Current Progress

| Component | Status | Phase |
|-----------|--------|-------|
| Backend prototype (`mobile-agent-pc`) | ✅ MVP Complete | Pre-Phase 0 |
| Frontend prototype (`mobile-agent-ui`) | ✅ MVP Complete | Pre-Phase 0 |
| Mentorship MCP Server (`lyra-mentor-mcp`) | ✅ Running | Pre-Phase 0 |
| AI Engineering Agent (Lyra) | ✅ Phase 2 Graduate | Pre-Phase 0 |
| Monorepo scaffold | 🔄 In Progress (Lyra) | Phase 0 |
| Relay Server + Temporal | ⏳ Queued | Phase 0 |
| Agent Registry + Heartbeat | ⏳ Queued | Phase 0 |
| Approval Queue + Risk Policy Engine | ⏳ Queued | Phase 0 |
| Push Notifications | ⏳ Queued | Phase 0 |
| Mobile Dashboard | ⏳ Queued | Phase 0 |
| Approval-Ready Summaries | ⏳ Queued | Phase 1 |
| Session Replay | ⏳ Queued | Phase 1 |
| Kanban Board + Worktrees | ⏳ Queued | Phase 2 |
| ghostty-web Terminal | ⏳ Queued | Phase 2 |
| Team Steering + RBAC | ⏳ Queued | Phase 3 |
| iOS Native App | 🔮 Future | Post-revenue |

---

*This document is a living roadmap. Last updated March 18, 2026.*
*Reviews incorporated: NotebookLM (architecture, security, GTM), Gemini Research (orchestration, QA, terminal), GPT-5.4 Thinking (positioning, phasing, narrative, copy)*
