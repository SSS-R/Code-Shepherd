# AgentOps — Remaining Tasks

> **Status:** Phase 0 ✅ | Phase 1 ✅ | Phase 2 ⏳ | Phase 3 ⏳
> **Owner:** Rafi + Antigravity (no more Lyra)
> **Goal:** Ship a monetizable MVP that proves the Killer Loop end-to-end.

---

## What's Already Done

| Feature | Phase | Status |
|---------|-------|--------|
| Monorepo scaffold (`relay`, `ui`, `shared`) | P0 | ✅ |
| Relay Server (Express + Temporal + SQLite) | P0 | ✅ |
| Agent Registry + Heartbeat API | P0 | ✅ |
| Approval Queue API (POST/GET/PATCH) | P0 | ✅ |
| Push Notifications (Web Push + Service Worker) | P0 | ✅ |
| Mobile Dashboard (agent cards, stats) | P0 | ✅ |
| Append-Only Audit Log | P0 | ✅ |
| Approval-Ready Summaries | P1 | ✅ |
| Diff Preview (inline code diff) | P1 | ✅ |
| Rejection Reason Capture | P1 | ✅ |
| Session Timeline (agent history) | P1 | ✅ |
| Active Workflows Dashboard (Temporal queries) | P1 | ✅ |

---

## What Remains (Prioritized by Revenue Impact)

### 🔴 CRITICAL — Must Ship Before First Users

These are the features that complete the "Killer Loop" and make the product usable enough to charge for.

#### 1. UI Overhaul — Premium Mobile-First Design
**Why:** Current UI is functional but not premium. First impressions decide if users pay $19/mo.
- [ ] Replace all emoji icons with SVG (Lucide React)
- [ ] Implement proper design system (color tokens, type scale, spacing)
- [ ] Swipe-to-approve gesture on approval cards
- [ ] Proper loading skeletons (not spinners)
- [ ] Bottom navigation with 4 tabs (Dashboard, Approvals, Timeline, Settings)
- [ ] Responsive: test at 375px, 768px, 1024px, 1440px
- [ ] Dark mode by default with proper contrast ratios (4.5:1 AA)
- [ ] `prefers-reduced-motion` respected
- **Estimated effort:** 2–3 sessions

#### 2. Agent-Side SDK (`@agentops/sdk`)
**Why:** Without this, no agent can actually connect. This enables the entire product.
- [ ] Create `packages/sdk/` with `client.ts`, `heartbeat.ts`, `approvals.ts`
- [ ] `AgentOps.register({ name, capabilities })` → POST /agents
- [ ] Auto-heartbeat every 30s → POST /agents/:id/heartbeat
- [ ] `AgentOps.requestApproval({ action_type, details })` → POST /approvals
- [ ] Wait for approval signal (poll or WebSocket)
- [ ] Publish to npm as `@agentops/sdk`
- **Estimated effort:** 1–2 sessions

#### 3. Risk Policy Engine
**Why:** Auto-approving everything defeats the purpose. Users need trust.
- [ ] Create `packages/relay/src/security/policies.ts`
- [ ] Block auto-approval for: secrets/env files, `rm -rf`, production branch merges, infra changes
- [ ] Risk scoring: `low` / `medium` / `high` / `critical` based on action type + file path
- [ ] Configurable rules (JSON/YAML policy file)
- **Estimated effort:** 1 session

#### 4. Approval Timeout & Escalation
**Why:** Agents can't wait forever. Unattended approvals need a fallback.
- [ ] Configurable timeout per risk level (e.g., low=5min, high=30min, critical=never)
- [ ] Auto-reject on timeout with audit log entry
- [ ] Optional: escalate to fallback contact (email/webhook)
- **Estimated effort:** 1 session

#### 5. Execution Timeline Screen (Full)
**Why:** Users need to search and filter past actions — not just see a list.
- [ ] Create `packages/ui/src/screens/ExecutionTimeline.tsx`
- [ ] Filters: date range, agent, action type, outcome
- [ ] Searchable by keyword
- [ ] CSV/JSON export
- [ ] Add to bottom nav
- **Estimated effort:** 1 session

---

### 🟡 HIGH — Ship Within 2 Weeks of Launch

These features make the product competitive and differentiate it from Vibe Kanban / AgentOps.ai.

#### 6. Kanban Task Board
**Why:** This is Phase 2's centerpiece. Users need to assign and track agent work.
- [ ] Create `packages/relay/src/routes/tasks.ts` (CRUD API)
- [ ] States: `Queued → In Progress → Blocked → Done → Failed`
- [ ] Create `packages/ui/src/screens/KanbanBoard.tsx`
- [ ] Drag-and-drop (use `@dnd-kit/core` or similar)
- [ ] Assign tasks to specific agents
- [ ] Priority levels (P0–P3) + color-coded labels
- [ ] Backed by Temporal (durable task state)
- **Estimated effort:** 3–4 sessions

#### 7. WebSocket Real-Time Updates
**Why:** Currently the UI polls. Real-time updates make it feel alive.
- [ ] Add `ws` to relay server
- [ ] Broadcast events: agent status change, new approval, workflow update
- [ ] UI subscribes and updates in real-time (no refresh needed)
- **Estimated effort:** 1 session

#### 8. Settings Screen
**Why:** Users need to configure notifications, policies, and API keys.
- [ ] Create `packages/ui/src/screens/Settings.tsx`
- [ ] Notification preferences (push on/off, risk level threshold)
- [ ] Policy editor (which actions require approval)
- [ ] API key display (for SDK integration)
- [ ] About / version info
- **Estimated effort:** 1 session

---

### 🟢 MEDIUM — Ship Before Team Features

#### 9. Task Dependencies
- [ ] "Blocked by" relationships between tasks
- [ ] Visual dependency chain on Kanban
- **Estimated effort:** 1 session

#### 10. Git Worktree Isolation
- [ ] Auto-create isolated git worktree per task
- [ ] tmux/terminal session per agent
- **Estimated effort:** 2 sessions

#### 11. WebAssembly Terminal (ghostty-web fallback)
- [ ] Embedded terminal for when approval summaries aren't enough
- [ ] SSH into agent environment
- **Estimated effort:** 2–3 sessions

---

### 🔵 FUTURE — Phase 3 (Team/Enterprise)

| Feature | Priority |
|---------|----------|
| User Auth (email/password + OAuth) | 🔴 |
| Team Management (invite, seats) | 🔴 |
| RBAC (Admin, Developer, Viewer) | 🟡 |
| Propose-and-Approve Steering | 🟡 |
| Compliance Dashboard | 🟡 |
| SSO / SAML / OIDC | 🟡 |
| On-Premises Deployment | 🟢 |

---

## Recommended Build Order (Sprint Plan)

| Sprint | Features | Sessions | Milestone |
|--------|----------|----------|-----------|
| **Sprint 1** | UI Overhaul + SDK | 4 | Killer Loop works end-to-end |
| **Sprint 2** | Risk Engine + Timeout + Timeline | 3 | Product is trustworthy |
| **Sprint 3** | Kanban + WebSocket + Settings | 5 | Product is operational |
| **Sprint 4** | Polish + Deploy + Launch | 2 | First users 🚀 |

**Total estimated sessions to MVP launch: ~14 sessions**

---

*This is a living document. Update as features are completed.*
