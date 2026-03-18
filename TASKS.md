# Project Task Board

## Backlog

### Phase 1: Make It Trustworthy (Weeks 4-6)
- [ ] Approval-Ready Summaries — Structured artifact cards instead of raw logs
- [ ] Diff Preview — Inline code diff with syntax highlighting
- [ ] Approval Reason Capture — Log rejection reasons
- [ ] Session Replay (lite) — Replay key decision points
- [ ] Resumable Workflows UI — See interrupted sessions

### Phase 2: Make It Operational (Weeks 7-10)
- [ ] Kanban Task Board — Drag-and-drop board with states
- [ ] Task Assignment — Assign tasks to specific agents
- [ ] Git Worktree Isolation — Per-task git worktrees
- [ ] Priority & Labels — P0-P3 priority, custom labels
- [ ] WebAssembly Terminal — ghostty-web for mobile SSH fallback

### Phase 3: Team Features (Weeks 11+)
- [ ] Team Steering — Propose-and-Approve vs Supervised Remote Control
- [ ] RBAC — Role-based access control
- [ ] Compliance Dashboard — Review Drift analytics
- [ ] Multi-user support — PostgreSQL migration

---

## Ready

- [ ] Generate VAPID keys on first run
- [ ] Create PWA manifest and icons
- [ ] Write unit tests for relay server
- [ ] Write unit tests for UI components
- [ ] Set up CI/CD pipeline

---

## In Progress

- [x] Phase 0: Monorepo scaffold ✅
- [x] Phase 0: Relay Server & Temporal ✅
- [x] Phase 0: Agent Registry API ✅
- [x] Phase 0: Approval Queue API ✅
- [x] Phase 0: Risk Policy Engine ✅
- [x] Phase 0: Push Notifications ✅
- [x] Phase 0: Mobile Dashboard PWA ✅

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

**Phase 0 Status:** ✅ **COMPLETE** — The Killer Loop is fully functional.

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
