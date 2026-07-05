# Project Memory: Code Shepherd

**Created:** 2026-03-17
**Reconciled:** 2026-07-06 (against code at commit 7eea5c7)
**Type:** Monorepo — unified control plane for coding agents
**Status:** Prototype — approval foundations plus conversations, connectors, and a security baseline

> **Note:** The product vision was reset to v3.0 in [`CODE_SHEPHERD.md`](../../CODE_SHEPHERD.md).
> The old "mobile approval dashboard" framing below is superseded by the multi-agent
> communication and control-plane framing. This file now tracks build memory, not vision.

---

## Vision (current)

**One place to communicate with, supervise, and coordinate many coding agents.**

Connect existing agents (Claude Code, Antigravity, Codex, Copilot, OpenClaw, custom) into one
interface to see presence, message them, approve risky actions, and keep an audit trail — from
desktop or phone. See [`CODE_SHEPHERD.md`](../../CODE_SHEPHERD.md) for the full roadmap.

The earlier "killer loop" (agent hits risky action → push → approve from phone → resume → audit)
is now one flow inside the broader inbox-first communication model, not the whole product.

---

## Stack

| Package | Stack | Purpose |
|---------|-------|---------|
| **relay** | Express + TypeScript + Temporal.io + better-sqlite3 + ws + web-push | Central relay server |
| **ui** | React 18 + Vite + Tailwind + PWA shell | Mobile-first control surface |
| **sdk** | TypeScript | Agent-side registration, heartbeat, approvals |
| **shared** | TypeScript types | Cross-package contracts |
| **universal-mcp-gateway** | TypeScript | Local helper: pairing + command polling + adapters |
| **antigravity-companion** | JS | Antigravity IDE bridge |

---

## Current Status

| Component | Status | Files |
|-----------|--------|-------|
| Monorepo scaffold | ✅ Complete | All packages configured |
| Relay server + SQLite | ✅ Complete | `packages/relay/src/` |
| Agent Registry API | ✅ Complete | `routes/agents.ts` |
| Approval Queue API | ✅ Complete | `routes/approvals.ts` |
| Approval summaries & diff preview | ✅ Complete | `utils/summaryGenerator.ts`, `utils/diffGenerator.ts` |
| Conversations, messages, commands | ✅ Complete | `routes/conversations.ts` |
| Connector trust + pairing | ✅ Complete | `routes/connectors.ts` |
| Universal MCP gateway + adapters | ✅ Codex + Antigravity + mock | `packages/universal-mcp-gateway/` |
| Auth (JWT, scrypt, cookies, lockout) | ✅ Complete | `utils/authSecurity.ts`, `routes/auth.ts` |
| Realtime WebSocket (authenticated) | ✅ Complete | `realtime.ts` |
| Push Notifications | ✅ Complete | `routes/notifications.ts`, `utils/vapidKeys.ts` |
| Mobile UI shell + screens | ✅ Complete | `packages/ui/src/` |
| Agent-side SDK | ✅ Complete | `packages/sdk/src/` |
| Risk enforcement | 🟡 Basic | `middleware/riskPolicy.ts` |
| Temporal workflows | 🟡 Partial | `packages/relay/src/workflows/` |
| Relay unit tests | ✅ Present | `packages/relay/src/__tests__/` |

---

## Known Issues / Open Work

- [ ] Multi-agent fan-out (one command → many agents) not implemented
- [ ] Real OpenClaw MCP bridge, plus Claude Code / VS Code connectors, not implemented
- [ ] Capability tiers modeled but not enforced at the routing layer
- [ ] Policies CRUD and standalone team-create / role-update endpoints missing
- [ ] Context optimizer package not started
- [ ] `vite-plugin-pwa`, manifest, and icons not wired (service worker + push exist)
- [ ] UI has no automated tests
- [ ] Temporal pause/resume path needs hardening
- [ ] `AUTH_SECRET` still defaults to an insecure dev value

---

## References

- [Full Roadmap](../../CODE_SHEPHERD.md)
- [Architecture](../ARCHITECTURE.md)
- [Codebase Map](CODEBASE_MAP.md)
- [Remaining Work Tracker](../planning/remaining-tasks.md)
- [Security Audit](../SECURITY_AUDIT.md)
