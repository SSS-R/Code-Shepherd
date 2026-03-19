# Commit Enforcement System

**Purpose:** Prevent repeated careless mistakes by enforcing mandatory checklists with progress tracking.

---

## What Was Created

| File | Purpose |
|------|---------|
| `TASK_CHECKLIST.md` | **Per-task progress tracker** — survives timeouts, supports resume |
| `PRE_COMMIT_CHECKLIST.md` | **Per-commit verification** — final checks before git commit |
| `scripts/verify-commit.sh` | Automated verification (routes, exports, duplicates, TypeScript) |
| `scripts/task-checklist.sh` | Task checklist manager (create, save, resume, list) |
| `.git/hooks/pre-commit` | Git hook that runs before every commit |
| `commits/TEMPLATE.md` | Template for saving completed checklists |
| `commits/checklists/` | Stores per-task progress files |
| `skills/pre-commit-checklist/SKILL.md` | Lyra skill that enforces the system |

---

## How It Works

### New Task Flow

```
1. Create task checklist
   ./scripts/task-checklist.sh create "feature-name"

2. Work through phases (1-7)
   - Mark each phase complete
   - Fill in evidence sections
   - Save progress after each phase

3. Timeout/interruption?
   ./scripts/task-checklist.sh resume
   → Shows last completed phase
   → Shows next action
   → Continue from there

4. All phases complete?
   - Fill out PRE_COMMIT_CHECKLIST.md
   - Run ./scripts/verify-commit.sh
   - Git commit

5. Save checklists
   - Task checklist → commits/checklists/
   - Pre-commit checklist → commits/DATE-task.md
```

### Git Hook Enforcement

The `.git/hooks/pre-commit` hook will:
- Warn if checklists weren't updated
- Run the verification script
- Block commit if verification fails

---

## Task Checklist Phases

| Phase | Purpose | Key Checks |
|-------|---------|------------|
| 1. Planning | Understand requirements | Identify files, fields, duplicates |
| 2. Database | Schema + migrations | ALTER TABLE, try/catch, idempotent |
| 3. Backend API | Complete responses | POST/GET/list/single all fields |
| 4. Frontend | UI matches API | Interfaces, exports, no duplicates |
| 5. Integration | Wire everything up | Routes mounted, imports, props |
| 6. Verification | Test full flow | Builds, curl tests, no errors |
| 7. Commit | Clean commit | Checklists filled, verify passed |

---

## What This Prevents

| Mistake | Caught By |
|---------|-----------|
| Routes not mounted | `verify-commit.sh` + Phase 5 |
| Interface not exported | Phase 4 + Checklist Q#7 |
| Duplicate interfaces | `rg` search in script + Phase 4 |
| Props not wired | Phase 5 + Checklist Q#8 |
| Missing imports | Phase 5 + Checklist Q#6 |
| Incomplete API response | Phase 3 + Checklist Q#2-4 |
| Lost progress on timeout | Task checklist resume |

---

## For Rafi

### To Review Lyra's Work

```bash
# See all task checklists
ls commits/checklists/

# See most recent progress
./scripts/task-checklist.sh resume

# See completed pre-commit checklists
ls commits/*.md

# View a specific checklist
cat commits/checklists/2026-03-19-*/audit-timeline*.md
```

### To Add New Checks

Edit `TASK_CHECKLIST.md` and add items to relevant phases.

### To Bypass (Emergency Only)

```bash
git commit --no-verify -m "message"
```

**Use only for:** Hotfixes, emergencies, non-code changes.

---

## For Lyra

### Why This System Exists

You made these mistakes 3+ times:

| Mistake | Count |
|---------|-------|
| Missing DB migrations | 3x |
| Incomplete API responses | 3x |
| Routes not mounted | 2x |
| Interfaces not exported | 2x |
| Props not wired | 2x |

You said "I'll use a checklist" but didn't follow through.

### New Rules

1. **Every task starts with a checklist** — no exceptions
2. **Save progress after each phase** — survives timeouts
3. **Resume from last checkpoint** — no restarting
4. **Pre-commit verification mandatory** — git hook enforces
5. **"Done" = end-to-end working** — not just "code written"

### Timeout Recovery

**Before:** Timeout → lose context → start over → make same mistakes

**After:** Timeout → resume → see last phase → continue → no lost work

```bash
# After timeout
./scripts/task-checklist.sh resume

# Output:
# === Last Completed Phase ===
# Phase 3: Backend API ✅
# 
# === Next Action ===
# Update AgentDetail.tsx to use new interface
#
# Continue from there.
```

### The Checklist Is Mandatory

Not optional. Every task. Every commit. No exceptions.

---

## Quick Reference

### Starting a Task

```bash
./scripts/task-checklist.sh create "feature-name"
```

### Saving Progress

```bash
./scripts/task-checklist.sh save "feature-name"
```

### Resuming After Timeout

```bash
./scripts/task-checklist.sh resume
```

### Before Commit

```bash
# 1. Fill PRE_COMMIT_CHECKLIST.md
# 2. Run verification
./scripts/verify-commit.sh

# 3. If passes, commit
git add -A
git commit -m "feat: description"

# 4. Save checklists
git add commits/ && git commit --amend --no-edit
```

### List All Checklists

```bash
./scripts/task-checklist.sh list
```

---

## Session Continuity

**Problem:** Discord sessions timeout. Context is lost. Work is redone.

**Solution:** Task checklists live in files, not memory.

| Before | After |
|--------|-------|
| Work in session memory | Work in checklist file |
| Timeout → lost | Timeout → saved |
| Restart from scratch | Resume from last phase |
| Make same mistakes | See what was checked |

**The file is the source of truth. Not the session.**

---

**This system stops the cycle of repeated mistakes. Use it.** 🎯
