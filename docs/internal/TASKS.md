# Project Task Board

> Reconciled to code at commit 7eea5c7 on 2026-07-06.

## Backlog

### Phase 1: Make It Trustworthy (Weeks 4-6)
- [x] Approval-Ready Summaries — Structured artifact cards instead of raw logs
- [x] Diff Preview — Inline code diff with syntax highlighting
- [x] Approval Reason Capture — Log rejection reasons
- [x] Session Timeline — Replay key decision points
- [ ] Resumable Workflows hardening — complete Temporal signal/resume path

### Phase 2: Make It Operational (Weeks 7-10)
- [x] Kanban Task Board — statuses + board UI (`routes/tasks.ts`, `screens/KanbanBoard.tsx`)
- [x] Task Assignment — `assigned_agent_id` on tasks
- [x] Priority & Labels — P0-P3 priority + custom labels
- [~] Git Worktree Isolation — operations scaffold computes a worktree path/terminal session, but does not yet create real git worktrees (`routes/operations.ts`)
- [ ] WebAssembly Terminal — ghostty-web for mobile SSH fallback

### Phase 3: Team Features (Weeks 11+)
- [x] RBAC — Admin/Developer/Viewer roles enforced via `requireRole`
- [~] Multi-user support — multi-tenant via `team_id` scoping on SQLite; PostgreSQL migration still pending
- [ ] Team Steering — Propose-and-Approve vs Supervised Remote Control
- [ ] Compliance Dashboard — Review Drift analytics

---

## Ready

- [x] Generate VAPID keys on first run (`utils/vapidKeys.ts`)
- [x] Write unit tests for relay server (`packages/relay/src/__tests__/`)
- [ ] Create PWA manifest and icons (wire `vite-plugin-pwa`)
- [ ] Write unit tests for UI components
- [ ] Set up CI/CD pipeline
- [ ] Add end-to-end SDK example / smoke test

---

## In Progress

- [x] Phase 0: Monorepo scaffold ✅
- [x] Phase 0: Relay Server & Temporal ✅
- [x] Phase 0: Agent Registry API ✅
- [x] Phase 0: Approval Queue API ✅
- [x] Phase 0: Risk Policy Engine ✅
- [x] Phase 0: Push Notifications ✅
- [x] Phase 0: Mobile Dashboard PWA ✅
- [x] SDK scaffold replaced with working source ✅

---

## Blocked

- [ ] (none)

---

## Done

### Phase 0: The Wedge ✅

> **Prove: "I can leave my desk and still control my agents."**

- [x] Monorepo scaffold with npm workspaces
- [x] Relay Server with Express + TypeScript + SQLite
- [x] Temporal.io workflows for durable execution
- [x] Agent Registry API (register, heartbeat, list)
- [x] Approval Queue API (request, list, decide)
- [x] Risk Policy Engine (OWASP MCP Top 10 patterns)
- [x] Push Notifications (web-push, VAPID keys)
- [x] Mobile Dashboard PWA (React + Vite + Tailwind)
- [x] Audit Log (append-only SQLite table)
- [x] All documentation (README, ARCHITECTURE, etc.)

**Phase 0 Status:** ✅ **COMPLETE** — Base loop exists.

**Current overall repo state:** 🟡 **PROTOTYPE** — approval loop, conversations, connector pairing, and a security baseline are in place; multi-agent fan-out, most connector implementations, and production hardening remain. Usable demo, not production-ready.

---

## Challenge History (Mentor MCP)

| Challenge | Status | Submission ID |
|-----------|--------|---------------|
| ch_1773777708632 | ✅ PASS | Monorepo Scaffold |
| ch_1773783530054 | ✅ PASS | Relay Server & Temporal |
| ch_1773784015418 | ✅ PASS | Product Context & Vision |
| ch_1773790758446 | ✅ PASS | Agent Registry API |
| ch_1773855079920 | ✅ PASS | Approval Queue & Risk Policy |
| ch_1773856174864 | ✅ PASS | Web Push Notifications |
| ch_1773857421178 | ✅ PASS | Mobile Dashboard PWA |

**All Phase 0 challenges complete.**
