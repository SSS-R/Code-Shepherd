# Project Memory: AgentOps

**Created:** 2026-03-17
**Type:** Monorepo - Agent Orchestration Platform
**Status:** Phase 0 - Scaffold

---

## Purpose

AgentOps is a production-grade agent orchestration platform with:
- **Relay Server** - Express.js server with SQLite + Temporal.io
- **UI** - React PWA for monitoring and control
- **SDK** - Agent-side npm package
- **Shared** - Shared TypeScript types

---

## Stack

| Package | Stack |
|---------|-------|
| relay | Express.js + TypeScript + SQLite + Temporal.io |
| ui | React 18 + Vite + TypeScript |
| sdk | TypeScript (agent-side) |
| shared | TypeScript types |

---

## Architecture Decisions

1. **npm workspaces** - Simpler than yarn/pnpm for this use case
2. **Temporal.io** - Crash-resilient workflow execution from day one
3. **SQLite** - Lightweight database for relay server (can upgrade to PostgreSQL later)
4. **TypeScript everywhere** - Type safety across all packages

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase 0: Scaffold | ✅ Complete |
| Phase 1: Relay Server | 🔄 In Progress |
| Phase 2: UI | ⏳ Not started |
| Phase 3: SDK | ⏳ Not started |

---

## Known Issues

- [ ] Temporal server not running (expected in dev)
- [ ] No tests written yet
- [ ] No CI/CD configured

---

## Next Priorities

1. Complete Temporal scaffold (ch_1773783530054)
2. Add basic agent registration API
3. Create UI scaffold with basic dashboard
