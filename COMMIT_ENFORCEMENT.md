# Commit Enforcement System

**Purpose:** Prevent repeated careless mistakes by enforcing a mandatory pre-commit checklist.

---

## What Was Created

| File | Purpose |
|------|---------|
| `PRE_COMMIT_CHECKLIST.md` | Master checklist - READ BEFORE EVERY COMMIT |
| `scripts/verify-commit.sh` | Automated verification script |
| `.git/hooks/pre-commit` | Git hook that runs before every commit |
| `commits/TEMPLATE.md` | Template for saving completed checklists |
| `skills/pre-commit-checklist/SKILL.md` | Lyra skill that enforces the checklist |

---

## How It Works

### 1. Before Coding
Lyra reads `PRE_COMMIT_CHECKLIST.md` to understand requirements.

### 2. While Coding
Lyra checks off items as she implements each part.

### 3. Before Commit
Lyra MUST:
1. Fill out the verification table in `PRE_COMMIT_CHECKLIST.md`
2. Run `./scripts/verify-commit.sh`
3. Save the completed checklist to `commits/DATE-task.md`

### 4. Git Hook Enforcement
The `.git/hooks/pre-commit` hook will:
- Warn if checklist wasn't updated
- Run the verification script
- Block commit if verification fails

---

## Bypass (Emergency Only)

```bash
git commit --no-verify -m "message"
```

**Use only for:** Hotfixes, emergencies, non-code changes.

**Don't use for:** Regular feature development.

---

## What This Prevents

| Mistake | How It's Caught |
|---------|-----------------|
| Routes not mounted | `verify-commit.sh` checks `app.use()` |
| Interface not exported | Checklist question #7 |
| Duplicate interfaces | `rg` search in verification script |
| Props not wired | Checklist question #8 |
| Missing imports | Checklist question #6 |
| Incomplete API response | Checklist questions #2-4 |

---

## For Rafi

### To Review Lyra's Work

1. Check `commits/` folder for completed checklists
2. Verify she filled out ALL questions
3. Check the "Evidence" column for file references
4. Run `git log --oneline` to see commit history

### To Add New Checks

Edit `PRE_COMMIT_CHECKLIST.md` and add a row to the table. The verification script will automatically enforce it.

### To Disable (Not Recommended)

```bash
# Remove the hook
rm .git/hooks/pre-commit

# Or bypass per-commit
git commit --no-verify -m "message"
```

---

## For Lyra

**This system exists because you made the same mistakes 3+ times.**

| Mistake | Count |
|---------|-------|
| Missing DB migrations | 3x |
| Incomplete API responses | 3x |
| Routes not mounted | 2x |
| Interfaces not exported | 2x |
| Props not wired | 2x |

**The checklist is not optional. It is mandatory.**

If you skip it:
1. The git hook will warn you
2. The verification script may fail
3. Rafi will see incomplete checklists in `commits/`
4. You'll waste more time fixing avoidable errors

**Use the checklist. Every time. No exceptions.** 🎯

---

## Quick Reference

```bash
# Before commit
./scripts/verify-commit.sh

# If it passes
git add -A
git commit -m "feat: description"

# Save checklist
cp PRE_COMMIT_CHECKLIST.md commits/$(date +%Y-%m-%d)-task.md
git add commits/*.md
git commit --amend --no-edit
```
