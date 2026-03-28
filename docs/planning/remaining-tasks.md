# Code Shepherd — Project Audit & Progress Tracker

> **Audited:** 2026-03-28  
> **Current Phase:** Architecture aligned, backend core done, UI screens done, integration & security hardening remain  
> **Product Goal:** Unified multi-agent communication and control plane

---

## ✅ COMPLETED — What Is Already Done

### Architecture & Documentation

- [x] Product thesis rewritten — Code Shepherd repositioned as a multi-agent control plane (not approvals-only)
- [x] `CODE_SHEPHERD.md` — Full product roadmap with phases A–F, killer loop, capability tiers, architecture diagram
- [x] `api-spec.md` — Complete backend API contract (REST + WebSocket spec)
- [x] `final_design_system.md` — Full "Crystalline Architecture" design system, Obsidian + Platinum modes, all 11 screens specified
- [x] `shepherd_guide_design.md` — Complete Shepherd Guide component spec (trigger, preview, modal — all 3 states, responsive behavior, animations)
- [x] `max-context-optimizer.md` — Context Optimizer Max-tier feature fully planned (3-stage pipeline, relay middleware plan, DB schema extension, UI stats card)
- [x] `SECURITY_AUDIT.md` — Full security audit with 10 blocker items documented
- [x] `phase-1-plan.md` — **Deleted** (outdated, superseded by CODE_SHEPHERD.md phases)

---

### Backend — Relay (`packages/relay`)

- [x] Express server with SQLite (`better-sqlite3`) — running on port 3000
- [x] Temporal.io integration — worker + workflow client wired up (graceful fallback if not running)
- [x] `GET /health` — server status with Temporal + agent count
- [x] **Agent Registry** (`/agents`) — register, heartbeat, list, get-by-id
- [x] **Approval Queue** (`/approvals`) — create, list pending, get, decide (approve/reject)
- [x] **Audit Logs** (`/audit-logs`) — list all events, per-agent timeline with icons/categories
- [x] **Push Notifications** (`/notifications`) — subscribe, unsubscribe, test send (Web Push / VAPID)
- [x] **Workflows** (`/workflows`) — list Temporal open workflows
- [x] **Auth routes** (`/auth`) — register, login, refresh, me (SHA-256 passwords — insecure, documented)
- [x] **Tasks / Kanban** (`/tasks`) — full CRUD with status transitions
- [x] **Conversations** (`/conversations`) — full conversation + message + command + reply system
- [x] **Connectors** (`/connectors`) — connector registration, trust, revocation, hashed secrets
- [x] **Operations** (`/operations`) — operational runtime scaffolding
- [x] **Demo** (`/demo`) — seed data routes for local dev
- [x] Realtime WebSocket (`/realtime`) — event broadcasting (unauthenticated — security blocker)
- [x] Risk policy middleware (`middleware/riskPolicy.ts`)
- [x] Connector auth middleware (`middleware/connectorAuth.ts`) — scoped connector auth for command polling
- [x] Header-based user auth middleware (`middleware/auth.ts`) — placeholder, not production-safe
- [x] Temporal workflows — `approvalWorkflow.ts`, `agentSession.ts`
- [x] Utilities: `diffGenerator.ts`, `summaryGenerator.ts`, `approvalTimeout.ts`, `vapidKeys.ts`
- [x] Adapter contracts defined (`contracts/adapters.ts`)

---

### Shared Types (`packages/shared`)

- [x] `CapabilityTier` — monitor / approval / chat / steering
- [x] `AdapterKind` — native-ide / mcp / bridge / direct-session / custom
- [x] `AdapterTransport` types
- [x] `AgentAdapterDescriptor`, `AgentReconnectPolicy`, `CapabilityNegotiation`
- [x] `ConnectorOnboardingFlow`, `BridgeInstallStep`
- [x] `ConversationRecord`, `MessageRecord`, `CommandRecord`
- [x] `ApprovalRecord`, `ApprovalRequestPayload`, `ApprovalDecisionPayload`
- [x] `CodeShepherdAdapter` interface — full adapter contract defined
- [x] Full registration / heartbeat / message request+response types

---

### SDK (`packages/sdk`)

- [x] `client.ts` — `CodeShepherdClient` wrapping all key relay calls
- [x] `adapter.ts` — SDK adapter base
- [x] `approvals.ts` — approval helpers
- [x] `heartbeat.ts` — heartbeat utility
- [x] `index.ts` — SDK exports

---

### Frontend — UI (`packages/ui`)

#### Design System

- [x] `index.css` — CSS custom properties for Obsidian (dark) + Platinum (light) — full token layer
- [x] Theme switching — `data-theme` attribute toggled on `<html>`, persisted in `localStorage`
- [x] Crystalline Architecture: zero border-radius, diamond status indicators, ghost borders, tonal surface system
- [x] Typography — Space Grotesk + Manrope + JetBrains Mono loaded and applied
- [x] Custom scrollbar styles

#### Routing & Shell

- [x] `AppRouter.tsx` — custom client-side hash/URL routing (replaces `useState<Screen>` anti-pattern)
- [x] `routeConfig.ts` — route definitions for all screens
- [x] Sidebar — collapsible icon-rail toggle on desktop, hamburger overlay on mobile
- [x] Top bar — theme toggle, notification dropdown (4 hardcoded items), relay status indicator
- [x] Bottom status bar — system online / latency

#### Screens (10 total)

- [x] `LoginPreview.tsx` — login / registration UI (no auth wired)
- [x] `Dashboard.tsx` — control plane, hero metrics, activity feed, system health panel, active threads
- [x] `AgentsOverview.tsx` — agent table, live execution stream, node health
- [x] `AgentDetail.tsx` — breadcrumb, agent header, activity/tasks/configuration tabs, performance metrics
- [x] `ApprovalQueue.tsx` — approval cards with inline diff, risk severity bars, approve/reject actions
- [x] `Inbox.tsx` — 3-panel communication hub (sessions list, thread, tools panel)
- [x] `KanbanBoard.tsx` — mission control task board, kanban columns, task cards
- [x] `ExecutionTimeline.tsx` — audit timeline with analytics sidebar
- [x] `Settings.tsx` — system configuration, connector management, theme selector
- [x] `OperatorProfile.tsx` — operator identity, security settings, interface config

#### Components

- [x] `DiffViewer.tsx` — inline diff rendering for approvals
- [x] `SessionTimeline.tsx` — timeline component
- [x] `ActiveWorkflows.tsx` — workflow display component

#### Shepherd Guide (all 7 components built)

- [x] `ShepherdGuideProvider.tsx` — context: open/close state, messages, connection
- [x] `ShepherdGuideTrigger.tsx` — floating button + unread badge
- [x] `ShepherdGuidePreview.tsx` — preview tooltip (proactive message)
- [x] `ShepherdGuideModal.tsx` — full chat modal container
- [x] `ShepherdGuideMessage.tsx` — individual message (user/assistant variants)
- [x] `ShepherdGuideSuggestions.tsx` — quick suggestion chips
- [x] `ShepherdGuideInput.tsx` — input field + send + disclaimer
- [x] Shepherd Guide wired into `AppRouter.tsx` inside `<ShepherdGuideProvider>` — rendered on all authenticated pages

#### PWA

- [x] `service-worker.js` — push notification handling, offline cache shell
- [x] `pushNotifications.ts` — browser subscription utility

---

## ⏳ REMAINING — What Still Needs To Be Done

### Priority 1 — Backend ↔ UI Integration (Blocking real product value)

These screens exist as UI only — they render mock/hardcoded data. None are connected to the live relay API yet.

- [ ] **Dashboard** — connect to `GET /agents`, `GET /approvals/pending`, `GET /audit-logs` for live data
- [ ] **Agents Overview** — connect to `GET /agents`, live status polling or WebSocket subscription
- [ ] **Agent Detail** — connect to `GET /agents/:id`, `GET /audit-logs/:agentId/timeline`
- [ ] **Approval Queue** — connect to `GET /approvals/pending`, `PATCH /approvals/:id` (approve/reject); real diffs from relay
- [ ] **Inbox** — connect to `GET /conversations`, `POST /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`; wire agent reply polling
- [ ] **Kanban Board** — connect to `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
- [ ] **Timeline** — connect to `GET /audit-logs` with grouping and filtering
- [ ] **Settings** — connect to `GET /connectors`, connector registration and revocation
- [ ] **Operator Profile** — connect to `GET /auth/me` session data, theme/preferences persistence to backend
- [ ] **Notification dropdown** — replace hardcoded list with real-time events from WebSocket (`/realtime`)

---

### Priority 2 — Shepherd Guide Integration (Core path implemented)

The Shepherd Guide UI is now connected to the relay through the conversation system, with a scripted backend responder and feedback persistence. Remaining work is optional model-forwarding / review tooling, not the base in-app guide loop.

- [x] Pre-register `shepherd-guide` agent in the relay (first-party, auto-registered on startup)
- [x] Use existing conversation endpoints for Shepherd Guide sessions (`POST /conversations/ensure`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`)
- [x] Wire `ShepherdGuideProvider.tsx` to conversation endpoints — replace mock messages with real API calls
- [x] Implement Shepherd Guide response logic in relay (scripted Q&A about Code Shepherd features)
- [x] Store feedback (thumbs up/down) on message records via `metadata` field
- [x] Add `ShepherdGuideHeader.tsx` component

---

### Priority 3 — Context Optimizer (Max Tier Feature, planned but not built)

Fully designed in `max-context-optimizer.md`, zero code written.

- [ ] Create `packages/context-optimizer/` package
  - [ ] `compressor.ts` — strip comments, blank lines, normalize indent
  - [ ] `symbolMap.ts` — α-alias replacement for identifiers >12 chars + §MAP lookup
  - [ ] `tokenCounter.ts` — wrap `gpt-tokenizer` for before/after token counts
  - [ ] `index.ts` — `optimize(content) → { compressed, stats }`
- [ ] Add relay middleware `middleware/contextOptimizer.ts` — tier check + pipeline execution
- [ ] Extend `commands` DB schema: `original_token_count`, `optimized_token_count`, `tokens_saved`
- [ ] Extend `audit_logs` with `optimization_applied` event
- [ ] Add Context Optimizer stats card to UI (agent profile or settings — Max-only, greyed out for Free/Pro)

---

### Priority 4 — Real Authentication (Security blocker)

Current auth is prototype-grade. All 10 security blockers from `SECURITY_AUDIT.md` must be resolved before any real deployment.

- [ ] Replace `x-user-id` / `x-role` header trust with signed JWT middleware
- [ ] Migrate password hashing from SHA-256 to `argon2id` or `bcrypt`
- [ ] Add login rate limiting and account lockout
- [ ] Add Zod schema validation on all relay endpoints
- [ ] Add IP and identity-based rate limiting (`express-rate-limit` or equivalent)
- [ ] Harden connector authentication — add expiry + rotation semantics for connector secrets
- [ ] Review all `team_id` queries for strict tenant isolation
- [ ] Add HTTP security headers (HSTS, CSP, X-Frame-Options) — consider `helmet`
- [ ] Secure WebSocket `/realtime` endpoint — require auth token during handshake
- [ ] Restrict agent bridge command payloads — validate against command injection / RCE
- [ ] Migrate session tokens from `localStorage` to `HttpOnly` + `Secure` cookies (currently in `authSession.ts`)
- [ ] Implement strict Content Security Policy in the UI

---

### Priority 5 — Missing API Surface (Spec exists, not yet built)

Per `api-spec.md`:

- [ ] `GET /policies` — list active risk policies
- [ ] `POST /policies` — create new policy rule
- [ ] `PUT /policies/:id` — update policy rule
- [ ] `POST /teams` — create team
- [ ] `GET /teams/:id` — get team + members
- [ ] `POST /teams/:id/invite` — invite member by email
- [ ] `PATCH /teams/:id/members/:userId` — update member role

---

### Priority 6 — PWA & Assets (Polish + Production Readiness)

- [ ] Generate and add PWA icons in all required sizes: 72, 96, 128, 144, 152, 192, 384, 512px
- [ ] Add favicon — 16×16 and 32×32
- [ ] Create logo SVG vector source for clean scaling
- [ ] Create OG/social share image (1200×630px)
- [ ] Wire `vite-plugin-pwa` for full service worker + manifest generation
- [ ] Test offline experience via service worker caching

---

### Priority 7 — State Management Upgrade (Optional but strongly recommended)

Current UI uses `useState` locally in each screen. Per `final_design_system.md` recommendation:

- [ ] Install and configure `zustand`
- [ ] Create `useThemeStore` — centralized theme (currently duplicated via localStorage + AppRouter)
- [ ] Create `useAuthStore` — session data, JWT, operator identity
- [ ] Create `useAgentStore` — registry state, online/offline, last heartbeat
- [ ] Create `useNotificationStore` — unread count, notification list
- [ ] Create `useWebSocketStore` — WebSocket connection status, event subscriptions, reconnect logic
- [ ] Install `@tanstack/react-query` for server state caching (API calls, stale/refresh logic)

---

### Priority 8 — Connector Implementations (Future — Phase B/C)

These require external integration work. None started.

- [ ] Claude Code connector (IDE native bridge)
- [ ] Antigravity connector (MCP or direct session)
- [ ] VS Code extension plugin bridge
- [ ] Generic MCP connector
- [ ] OpenClaw direct-session integration
- [ ] Connector onboarding flow UI — step-by-step install wizard for each bridge type

---

## 📊 Overall Progress Summary

| Area | Status | Completion |
|------|--------|------------|
| Product architecture & docs | ✅ Done | 100% |
| Design system spec | ✅ Done | 100% |
| Shepherd Guide design spec | ✅ Done | 100% |
| Context Optimizer spec | ✅ Done | 100% |
| Security audit | ✅ Done | 100% |
| Backend relay (routes + DB) | ✅ Done | ~90% |
| Shared types + SDK | ✅ Done | ~90% |
| UI screens (visual) | ✅ Done | ~95% |
| Shepherd Guide UI components | ✅ Done | 100% |
| UI ↔ Backend integration | ❌ Not started | 0% |
| Shepherd Guide backend | ✅ Core loop done | ~85% |
| Context Optimizer package | ❌ Not started | 0% |
| Real auth / security hardening | ❌ Not started | 0% |
| PWA assets | ❌ Not started | 0% |
| State management (Zustand) | ❌ Not started | 0% |
| Connector implementations | ❌ Not started | 0% |

---

## Working Rule

Every new feature should answer:

1. Does it improve unified communication with existing agents?
2. Does it improve remote control or intervention?
3. Does it improve simultaneous multi-agent coordination?
4. Does it improve auditability and safe operation?

If not, it is a secondary priority.
