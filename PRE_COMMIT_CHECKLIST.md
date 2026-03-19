# PRE-COMMIT CHECKLIST

**MANDATORY: Read and answer EVERY question before `git commit`. No exceptions.**

---

## 📋 Checklist (Copy-Paste This Section)

```markdown
### Pre-Commit Verification — [TASK_NAME]

**Date:** YYYY-MM-DD
**Commit:** feat/fix/...: description

| # | Check | Answer | Evidence |
|---|-------|--------|----------|
| 1 | New DB columns? → Migration added? | YES / N/A | File: `migrations/*.sql` |
| 2 | POST /create returns ALL fields? | YES / N/A | File: `routes/*.ts` line # |
| 3 | GET /list returns ALL fields? | YES / N/A | File: `routes/*.ts` line # |
| 4 | GET /:id returns ALL fields? | YES / N/A | File: `routes/*.ts` line # |
| 5 | Frontend interface has ALL fields? | YES / N/A | File: `*.tsx` line # |
| 6 | All functions actually CALLED? | YES / N/A | File: `index.ts` + imports |
| 7 | Shared interfaces EXPORTED? | YES / N/A | File: `*.ts` has `export` |
| 8 | Props actually WIRED UP? | YES / N/A | File: `*.tsx` onClick/handlers |
| 9 | Full flow tested? | YES / NO | Backend → API → Frontend |
| 10 | No duplicate code? | YES / NO | Searched for duplicates |

**Verification Commands Run:**
```bash
# List commands you ran to verify (git diff, grep, curl tests, etc.)
```

**Status:** READY TO COMMIT / NOT READY (see notes)
```

---

## 🔴 Common Mistakes (Learn from History)

| Mistake | Example | Fix |
|---------|---------|-----|
| Forgot to mount routes | Created `createAuditRoutes()` but didn't `app.use()` it | Check `index.ts` for all route mounts |
| Interface not exported | `interface TimelineEvent` without `export` | Add `export` keyword |
| Duplicate interfaces | Defined `TimelineEvent` in 2 files | Import from shared location |
| Props not wired | `onClick` in interface but not passed to component | Add `onClick={onClick}` |
| Missing imports | Component created but not imported in parent | Check all `import` statements |
| Incomplete API response | Added DB field but didn't include in response object | Verify ALL response projections |

---

## ✅ Definition of "Done"

A feature is **NOT done** until:

- [ ] Database schema updated (if needed)
- [ ] Migration script written (if needed)
- [ ] Backend API returns complete data
- [ ] Frontend interface matches API response
- [ ] All imports present
- [ ] All exports correct
- [ ] All props wired up
- [ ] No duplicate code
- [ ] Full flow tested end-to-end

**"Code written" ≠ "Done"**
**"Feature working end-to-end" = Done**

---

## 🛠️ Verification Commands

```bash
# 1. Check for uncommitted changes
git status

# 2. See what you're about to commit
git diff --stat

# 3. Search for duplicate interfaces
rg "interface TimelineEvent" --type ts

# 4. Verify route mounts
rg "app.use\(" packages/relay/src/index.ts

# 5. Check exports
rg "export interface" packages/ui/src/components/

# 6. Test API endpoints
curl http://localhost:3000/agents | jq
curl http://localhost:3000/approvals/pending | jq

# 7. Verify build passes
npm run build --workspace=@agentops/relay
npm run build --workspace=@agentops/ui
```

---

## 📝 How to Use

1. **Before coding:** Read this checklist
2. **While coding:** Keep this open, check off items as you go
3. **Before commit:** Fill out the verification table above
4. **After commit:** Save the filled checklist to `commits/YYYY-MM-DD-task.md`

---

**This checklist exists because of repeated mistakes. Use it or break the build.**
