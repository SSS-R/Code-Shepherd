# Code Shepherd - Remaining Work Tracker

> Audited: 2026-07-06 (reconciled against code at commit 7eea5c7)
> Current phase: Core relay/UI integration, conversations, connector pairing, and the security baseline are in place
> Product rule: Code Shepherd is a control plane for existing agents, and the Shepherd Guide should attach through OpenClaw via an MCP server path rather than act as a separate model runtime.

---

## Completed in this pass

### Relay and operator state

- [x] Added `GET /auth/me` for current operator profile, team, and role context
- [x] Added `GET /auth/preferences` and `PUT /auth/preferences`
- [x] Persisted operator preferences in a relay-side `user_preferences` table
- [x] Normalized `GET /audit-logs` to return icon/category/status metadata for UI rendering

### UI to relay integration

- [x] Dashboard wired to agents, approvals, audit logs, conversations, and operations
- [x] Agents Overview wired to live agent registry plus audit-backed execution stream
- [x] Agent Detail wired to live agent data, timeline, assigned tasks, and thread counts
- [x] Approval Queue wired to pending/all approvals plus approve/reject actions
- [x] Inbox wired to conversations, ensure/create flow, message send, and reply polling
- [x] Kanban Board wired to task create, update, assign, and delete actions
- [x] Timeline wired to live audit data
- [x] Settings wired to connector create, revoke, rotate-secret, and preference toggles
- [x] Operator Profile wired to `/auth/me`, relay-backed preferences, and recent audit stream
- [x] Notification dropdown replaced with realtime WebSocket notifications plus audit bootstrap

### Product alignment

- [x] Settings now frames OpenClaw as an MCP-backed connector path
- [x] Planning tracker updated to reflect the new OpenClaw/MCP positioning

---

## Remaining priorities

### Priority 1 - Security hardening

Most of this is now done (see [`utils/authSecurity.ts`](../../packages/relay/src/utils/authSecurity.ts), [`middleware/auth.ts`](../../packages/relay/src/middleware/auth.ts), [`realtime.ts`](../../packages/relay/src/realtime.ts), and the CSP block in [`index.ts`](../../packages/relay/src/index.ts)).

- [x] Replace header-trusted auth with signed JWT auth (HS256 access tokens + hashed refresh sessions)
- [x] Migrate password hashing off plain SHA-256 — implemented with **scrypt** (not argon2id/bcrypt) plus a legacy-SHA-256 auto-upgrade path; revisit if argon2id is required
- [x] Add rate limiting and account lockout (global 240/min limiter + per-IP/email auth limiter; 5-attempt / 15-min lockout)
- [x] Secure `/realtime` with authenticated handshake (`verifyClient` → `verifyAccessToken`)
- [x] Move browser auth storage from `localStorage` to secure cookies (httpOnly, SameSite)
- [x] Add CSP and broader HTTP hardening (CSP, HSTS-style headers, strict CORS allowlist)
- [~] Add request validation across relay endpoints — only auth inputs are validated; other routes still need schema validation
- [ ] Rotate `AUTH_SECRET` off its insecure dev default and document production secret management

### Priority 2 - Connector/runtime depth

The universal MCP gateway and pairing/onboarding flow now exist ([`packages/universal-mcp-gateway`](../../packages/universal-mcp-gateway), [`routes/connectors.ts`](../../packages/relay/src/routes/connectors.ts)).

- [x] Build generic MCP connector onboarding flow (trust → pairing code → launch command → gateway session)
- [x] Antigravity connector implementation (adapter + companion bridge + installer)
- [x] Codex connector implementation (gateway `codexCli` adapter)
- [ ] Implement a real OpenClaw MCP connector bridge
- [ ] Add Claude Code and VS Code connector implementations
- [ ] Add connector verification and health checks beyond trust registration

### Priority 3 - Council Board (multi-agent coordination with a Commander)

Full design: [`council-board.md`](./council-board.md). Decisions locked 2026-07-06: commander = a connected IDE agent; worktrees per subtask; fan-out first.

- [ ] Phase 1: multi-agent fan-out (`target_agent_ids[]` on message send + UI multi-select)
- [ ] Phase 2: council conversations (`kind='council'`, membership, budgets, reply lanes)
- [ ] Phase 3: commander protocol (`CouncilPlan` types, validation, state machine, gateway prompt wrapper)
- [ ] Phase 4: cross-review, results digest, real git worktrees, pause/resume, offline reassignment

### Priority 4 - Context Optimizer

- [ ] Create `packages/context-optimizer/`
- [ ] Add optimizer middleware to relay command flow
- [ ] Extend command and audit schemas for token savings
- [ ] Surface optimizer stats in the UI

### Priority 5 - Missing API surface

- [ ] Policies CRUD (no policy route exists yet)
- [x] Team invitations: create, list, and accept ([`routes/auth.ts`](../../packages/relay/src/routes/auth.ts))
- [~] Team lifecycle: a team is created at signup only — still missing a standalone team-create endpoint, team detail, and member role update

### Priority 6 - PWA and production assets

- [ ] Generate app icons and favicon set
- [ ] Add SVG logo source and social share image
- [ ] Wire `vite-plugin-pwa`
- [ ] Test offline caching behavior

### Priority 7 - State management upgrade

- [ ] Introduce centralized client state (`zustand` and/or React Query)
- [ ] Replace polling-heavy screen state with shared server-state caching
- [ ] Centralize realtime subscription and notification state

---

## Status snapshot

| Area | Status | Completion |
|---|---|---|
| Architecture and docs | Reconciled to code | ~95% |
| Relay core routes | Done | ~92% |
| Shared types and SDK | Done | ~90% |
| UI shell and screens | Done | ~95% |
| UI to relay integration | Core workflow done | ~85% |
| Conversations, commands, connector pairing | Done | ~85% |
| Shepherd Guide base loop | Done | ~90% |
| Security hardening | Baseline done, edges remain | ~85% |
| Connector runtime implementations | Codex + Antigravity done; OpenClaw/Claude/VSCode pending | ~45% |
| Multi-agent fan-out | Not started | 0% |
| Context optimizer | Not started | 0% |
| PWA polish and assets | Service worker + push only; plugin/manifest pending | ~25% |
| Automated tests | Relay unit tests only; UI none | ~20% |

---

## Working rule

Every new feature should strengthen at least one of these:

1. Unified communication with existing agents
2. Remote intervention and approvals
3. Simultaneous multi-agent coordination
4. Auditability and safe operation
