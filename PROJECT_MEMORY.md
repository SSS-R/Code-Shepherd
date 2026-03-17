# Project Memory: AgentOps

**Created:** 2026-03-17  
**Type:** Monorepo — Agent Orchestration Platform  
**Status:** Phase 0 — Scaffold  
**Version:** 2.0 (Pre-Launch)

---

## Vision

**The control plane for AI coding agents.**

AgentOps gives developers a mobile-first command surface to:
- Monitor agents from anywhere
- Approve risky actions with one tap
- Recover interrupted workflows
- Maintain searchable audit trails

---

## The Killer Loop

```
Agent starts work → Hits risky action → Push notification → 
Developer approves from phone → Workflow resumes → Logged to audit trail
```

**Every feature serves this loop.**

---

## Stack

| Package | Stack | Purpose |
|---------|-------|---------|
| **relay** | Express.js + TypeScript + Temporal.io + SQLite | Durable execution relay server |
| **ui** | React 18 + Vite + TypeScript + PWA | Mobile-first dashboard |
| **sdk** | TypeScript (npm package) | Agent-side registration & heartbeats |
| **shared** | TypeScript types | Shared types across packages |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Durable Execution** | Temporal.io | Persists workflow state through crashes. Supports human-in-the-loop pauses. |
| **PWA First** | Progressive Web App | Ships to Android + Desktop immediately. No app store friction. |
| **Centralized Relay** | Node.js + Express | Agents run behind NATs. Relay solves connectivity + policy enforcement. |
| **MCP Protocol** | Model Context Protocol | Vendor-neutral. Supports Claude, Antigravity, Cline, custom agents. |
| **SQLite → PostgreSQL** | Progressive | Zero-config for solo users. Postgres for teams. |

---

## Current Status

| Component | Status | Phase |
|-----------|--------|-------|
| Monorepo scaffold | ✅ Complete | Phase 0 |
| Relay Server + Temporal | 🔄 In Progress | Phase 0 |
| Agent Registry + Heartbeat | ⏳ Queued | Phase 0 |
| Approval Queue + Risk Policy | ⏳ Queued | Phase 0 |
| Push Notifications | ⏳ Queued | Phase 0 |
| Mobile Dashboard | ⏳ Queued | Phase 0 |
| Approval-Ready Summaries | ⏳ Queued | Phase 1 |
| Kanban Board + Worktrees | ⏳ Queued | Phase 2 |

---

## Known Issues

- [ ] Temporal server not running (expected in dev)
- [ ] No tests written yet
- [ ] No CI/CD configured
- [ ] iOS PWA install friction (secondary target for v1)

---

## Next Priorities

1. ✅ Complete Temporal scaffold (ch_1773783530054)
2. ⏳ Implement agent registration API
3. ⏳ Create UI scaffold with basic dashboard
4. ⏳ Add approval queue API
5. ⏳ Implement risk policy engine

---

## Key Metrics (Phase 0 Targets)

| Metric | Target |
|--------|--------|
| Registered users | 60 |
| Active agents connected | 100 |
| Approval response time (median) | < 3 min |
| Push delivery rate (Android + Desktop) | > 95% |
| Workflow recovery success rate | > 98% |

---

## References

- [Full Roadmap](AgentOPS.md)
- [Architecture Details](ARCHITECTURE.md)
- [Codebase Map](CODEBASE_MAP.md)
