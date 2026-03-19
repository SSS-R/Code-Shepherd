# Task Checklist — [TASK_NAME]

**Created:** YYYY-MM-DD HH:MM
**Status:** NOT_STARTED / IN_PROGRESS / READY_FOR_COMMIT / COMPLETE
**Session:** [session-id or "discord"]

---

## Progress Tracker

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| 1. Planning | ⬜ | | | |
| 2. Database | ⬜ | | | |
| 3. Backend API | ⬜ | | | |
| 4. Frontend | ⬜ | | | |
| 5. Integration | ⬜ | | | |
| 6. Verification | ⬜ | | | |
| 7. Commit | ⬜ | | | |

---

## Phase 1: Planning

**Goal:** Understand requirements before coding

- [ ] Read task requirements
- [ ] Identify affected files (backend, frontend, DB)
- [ ] Identify new fields/columns needed
- [ ] Check existing interfaces for duplicates
- [ ] Write implementation plan

**Evidence:**
```
Files to modify:
- 
- 

New fields:
-
```

---

## Phase 2: Database

**Goal:** Schema + migrations before any code

- [ ] Add new columns to schema
- [ ] Write migration script (`migrations/YYYYMMDD_description.sql`)
- [ ] Migration has try/catch for idempotency
- [ ] Tested migration locally

**Evidence:**
```sql
-- Migration file: migrations/*.sql
ALTER TABLE ...
```

---

## Phase 3: Backend API

**Goal:** Complete API responses (all fields)

### POST /create
- [ ] Returns ALL new fields in response
- [ ] Response matches schema

### GET /list
- [ ] Returns ALL new fields in array items
- [ ] .map() projection includes all fields

### GET /:id
- [ ] Returns ALL new fields in single item
- [ ] Response matches schema

**Evidence:**
```typescript
// File: packages/relay/src/routes/*.ts
// Line numbers:
POST: line #
GET list: line #
GET single: line #
```

---

## Phase 4: Frontend

**Goal:** UI matches API

- [ ] TypeScript interface has ALL fields from API
- [ ] Interface is EXPORTED (if shared)
- [ ] No duplicate interface definitions
- [ ] Components use shared interfaces (import, don't redefine)

**Evidence:**
```typescript
// File: packages/ui/src/**/*.tsx
// Line numbers:
Interface: line #
Import: line #
```

---

## Phase 5: Integration

**Goal:** Everything wired up

- [ ] All new routes mounted in `index.ts`
- [ ] All imports present (no missing imports)
- [ ] All props wired up (onClick, handlers, etc.)
- [ ] No unused functions

**Evidence:**
```typescript
// File: packages/relay/src/index.ts
app.use('/new-route', createNewRoutes(db))

// File: packages/ui/src/**/*.tsx
import { Component } from './Component'
<Component onClick={handleClick} />
```

---

## Phase 6: Verification

**Goal:** Test full flow before commit

- [ ] Backend builds (0 errors)
- [ ] Frontend builds (0 errors)
- [ ] API tested with curl/Postman
- [ ] Flow tested: Backend → API → Frontend → Component
- [ ] No duplicate code (rg search)
- [ ] No TypeScript errors

**Verification Commands:**
```bash
npm run build --workspace=@agentops/relay
npm run build --workspace=@agentops/ui
curl http://localhost:3000/endpoint | jq
rg "interface MyInterface" --type ts
```

**Output:**
```
Paste build output and test results here
```

---

## Phase 7: Commit

**Goal:** Clean commit with checklist

- [ ] Filled out PRE_COMMIT_CHECKLIST.md
- [ ] Ran ./scripts/verify-commit.sh (passed)
- [ ] Saved this checklist to commits/
- [ ] Git add, commit, push
- [ ] Checklist saved to commits/YYYY-MM-DD-task.md

**Commit Details:**
```
Commit hash:
Message:
Files changed:
```

---

## Session Notes

**Timeouts / Interruptions:**
```
[YYYY-MM-DD HH:MM] Timeout on git pull approval - resumed at Phase 4
```

**Issues Found:**
```
[Any blockers or problems discovered]
```

**Decisions Made:**
```
[Important implementation decisions]
```

---

## Quick Status (For Session Resume)

**Last Completed Phase:** Phase X
**Next Action:** [specific next step]
**Blockers:** [none / describe]

```
Copy this section when session times out:

STATUS: Phase 3 complete, Phase 4 in progress
- Database: ✅ Migration written and tested
- Backend: ✅ POST/GET endpoints complete
- Frontend: ⏳ Interface defined, need to update components
- Next: Update AgentDetail.tsx to use new interface
```

---

**This checklist saves progress. Update it as you go. Resume from last checkpoint after timeouts.**
