# Project Memory: AgentOps

**Created:** 2026-03-17  
**Type:** Monorepo — Agent Orchestration Platform  
**Status:** Phase 1 Prototype In Progress  
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
Agent hits risky action → Push notification → 
Developer approves from phone → Workflow resumes → Logged to audit trail
```

**Every feature serves this loop.**

---

## Stack

| Package | Stack | Purpose |
|---------|-------|---------|
| **relay** | Express.js + TypeScript + Temporal.io + SQLite + web-push | Durable execution relay server |
| **ui** | React 18 + Vite + TypeScript + Tailwind CSS + PWA | Mobile-first dashboard |
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
| **Risk Policy Engine** | OWASP MCP Top 10 | Layered security: trusted registry, schema validation, risk scoring, approval gates. |

---

## Current Status

| Component | Status | Files |
|-----------|--------|-------|
| Monorepo scaffold | ✅ Complete | All packages configured |
| Relay Server + SQLite | ✅ Complete | `packages/relay/src/` |
| Temporal scaffold | 🟡 Partial | `packages/relay/src/workflows/` |
| Agent Registry API | ✅ Complete | `routes/agents.ts` |
| Approval Queue API | ✅ Complete | `routes/approvals.ts` |
| Push Notifications | ✅ Complete | `routes/notifications.ts`, `utils/vapidKeys.ts` |
| Mobile Dashboard PWA | ✅ Complete | `packages/ui/src/` |
| Approval summaries & diff preview | ✅ Complete | `utils/summaryGenerator.ts`, `utils/diffGenerator.ts` |
| Agent-side SDK | ✅ Complete | `packages/sdk/src/` |
| Risk enforcement | 🟡 Basic | `middleware/riskPolicy.ts` |
| Audit Log | ✅ Complete | SQLite `audit_logs` table |

---

## Known Issues

- [ ] Temporal server not running (expected in dev)
- [ ] No automated tests yet
- [ ] VAPID keys need to be generated on first run
- [ ] PWA manifest/icons not created
- [ ] iOS PWA install friction (secondary target for v1)

---

## Next Priorities

### Phase 1: Make It Trustworthy (Weeks 4-6) 🟡 IN PROGRESS

1. ✅ Approval-Ready Summaries — Human-readable summaries for all actions
2. ✅ Diff Preview — Inline code diff viewer with syntax highlighting
3. ✅ Approval Reason Capture — Required rejection reasons
4. ✅ Session Timeline — Visual timeline of agent actions
5. 🟡 Resumable Workflows — UI hook present, Temporal signal flow still needs hardening
6. 🟡 Risk Enforcement — basic risk scoring present, not full policy system

### Phase 2: Operational Excellence (Weeks 7-10) ⏳ NEXT

1. ⏳ Kanban Task Board — Drag-and-drop task management
2. ⏳ Git Worktree Isolation — Per-task git worktrees
3. ⏳ Priority & Labels — Task prioritization system

---

## Key Metrics (Phase 0 Targets)

| Metric | Target | Current |
|--------|--------|---------|
| Registered users | 60 | 0 (pre-launch) |
| Active agents connected | 100 | 0 (pre-launch) |
| Approval response time (median) | < 3 min | N/A |
| Push delivery rate (Android + Desktop) | > 95% | N/A |
| Workflow recovery success rate | > 98% | N/A |

---

## Git History

| Commit | Description |
|--------|-------------|
| `25ddcd9` | Phase 0 complete - Agent Registry, Approval Queue, Push Notifications, Mobile PWA |
| `4e84656` | docs: Update all markdown files based on AgentOPS.md roadmap |
| `a0b7ff0` | chore: Initialize monorepo with all bootstrap files (7/7) |

---

## References

- [Full Roadmap](AgentOPS.md)
- [Architecture Details](ARCHITECTURE.md)
- [Codebase Map](CODEBASE_MAP.md)
markdown files based on AgentOPS.md roadmap |
| `a0b7ff0` | chore: Initialize monorepo with all bootstrap files (7/7) |

---

## References

- [Full Roadmap](AgentOPS.md)
- [Architecture Details](ARCHITECTURE.md)
- [Codebase Map](CODEBASE_MAP.md)
