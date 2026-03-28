# Code Shepherd - Remaining Work Tracker

> Audited: 2026-03-28
> Current phase: Core relay/UI integration is now in place
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

- [ ] Replace header-trusted auth with signed JWT auth
- [ ] Migrate password hashing from SHA-256 to `argon2id` or `bcrypt`
- [ ] Add request validation across relay endpoints
- [ ] Add rate limiting and account lockout
- [ ] Secure `/realtime` with authenticated handshake
- [ ] Move browser auth storage from `localStorage` to secure cookies
- [ ] Add CSP and broader HTTP hardening

### Priority 2 - Connector/runtime depth

- [ ] Implement a real OpenClaw MCP connector bridge
- [ ] Build generic MCP connector onboarding flow
- [ ] Add Claude Code, Antigravity, and VS Code connector implementations
- [ ] Add connector verification and health checks beyond trust registration

### Priority 3 - Context Optimizer

- [ ] Create `packages/context-optimizer/`
- [ ] Add optimizer middleware to relay command flow
- [ ] Extend command and audit schemas for token savings
- [ ] Surface optimizer stats in the UI

### Priority 4 - Missing API surface

- [ ] Policies CRUD
- [ ] Team creation, detail, invite, and member role update endpoints

### Priority 5 - PWA and production assets

- [ ] Generate app icons and favicon set
- [ ] Add SVG logo source and social share image
- [ ] Wire `vite-plugin-pwa`
- [ ] Test offline caching behavior

### Priority 6 - State management upgrade

- [ ] Introduce centralized client state (`zustand` and/or React Query)
- [ ] Replace polling-heavy screen state with shared server-state caching
- [ ] Centralize realtime subscription and notification state

---

## Status snapshot

| Area | Status | Completion |
|---|---|---|
| Architecture and docs | Done | 100% |
| Relay core routes | Done | ~92% |
| Shared types and SDK | Done | ~90% |
| UI shell and screens | Done | ~95% |
| UI to relay integration | Core workflow done | ~85% |
| Shepherd Guide base loop | Done | ~90% |
| Security hardening | Not started | ~10% |
| Connector runtime implementations | Early stage | ~15% |
| Context optimizer | Not started | 0% |
| PWA polish and assets | Not started | 0% |

---

## Working rule

Every new feature should strengthen at least one of these:

1. Unified communication with existing agents
2. Remote intervention and approvals
3. Simultaneous multi-agent coordination
4. Auditability and safe operation
