# Phase 1 Implementation Plan: Make It Trustworthy

**Timeline:** Weeks 4-6  
**Goal:** Prove developers can trust what they're approving

---

## Overview

Phase 1 focuses on transforming raw agent actions into **trustworthy, understandable approval requests**. Instead of showing developers raw logs or cryptic command strings, we provide clear, structured summaries with visual diffs and context.

---

## Feature 1: Approval-Ready Summaries

**Problem:** Current approvals show raw `action_type` strings like `"file_delete"` with JSON details. Developers need plain English explanations.

**Solution:** Generate human-readable summaries for each approval request.

### Implementation

**Backend Changes:**
- Add `summary_generator.ts` module with templates for each action type
- Modify `POST /approvals` to include `summary` field
- Store summary in database for audit trail

**Example Output:**
```json
{
  "action_type": "file_delete",
  "action_details": { "path": "/tmp/test.txt", "size": 1024 },
  "summary": "Delete file '/tmp/test.txt' (1 KB)"
}
```

**Files to Create:**
- `packages/relay/src/utils/summaryGenerator.ts`
- `packages/relay/src/utils/summaryTemplates.ts`

**Files to Modify:**
- `packages/relay/src/routes/approvals.ts`
- `packages/relay/src/routes/approvals.ts` (database schema)

**Estimated Effort:** 4-6 hours

---

## Feature 2: Diff Preview

**Problem:** Developers can't see what changes an agent wants to make before approving.

**Solution:** Show inline code diffs with syntax highlighting for file modifications.

### Implementation

**Backend Changes:**
- Add `diff_generator.ts` module
- For file edits: compute unified diff before/after
- Store diff in approval record

**Frontend Changes:**
- Install `react-diff-viewer` or similar library
- Create `DiffPreview` component
- Integrate into `ApprovalQueue` screen

**Files to Create:**
- `packages/relay/src/utils/diffGenerator.ts`
- `packages/ui/src/components/DiffPreview.tsx`

**Files to Modify:**
- `packages/relay/src/routes/approvals.ts`
- `packages/ui/src/screens/ApprovalQueue.tsx`

**Estimated Effort:** 6-8 hours

---

## Feature 3: Approval Reason Capture

**Problem:** No training signal for why approvals are rejected. Can't improve risk policy without feedback.

**Solution:** Add optional text field for developers to explain their decision.

### Implementation

**Frontend Changes:**
- Add textarea in `ApprovalQueue` for rejection reason
- Make reason required for rejections, optional for approvals

**Backend Changes:**
- Already have `decision_reason` field in database
- Add analytics endpoint to aggregate rejection reasons

**Files to Modify:**
- `packages/ui/src/screens/ApprovalQueue.tsx`
- `packages/relay/src/routes/analytics.ts` (new)

**Estimated Effort:** 2-3 hours

---

## Feature 4: Session Replay (Lite)

**Problem:** Developers can't see what an agent did during a session. Hard to debug or audit.

**Solution:** Timeline view of agent actions with timestamps and outcomes.

### Implementation

**Backend Changes:**
- Query `audit_logs` table for agent session
- Group by session ID or time window
- Return structured timeline

**Frontend Changes:**
- Create `SessionTimeline` component
- Add route `/agents/:id/session`
- Display timeline with icons for each action type

**Files to Create:**
- `packages/ui/src/components/SessionTimeline.tsx`
- `packages/ui/src/screens/AgentSession.tsx`

**Files to Modify:**
- `packages/relay/src/routes/audit.ts` (enhance existing)

**Estimated Effort:** 6-8 hours

---

## Feature 5: Resumable Workflows UI

**Problem:** Developers can't see which workflows are interrupted/waiting for approval.

**Solution:** Dashboard section showing all active workflows with status.

### Implementation

**Backend Changes:**
- Query Temporal for open workflows
- Add `GET /workflows` endpoint
- Include workflow ID, status, waiting_since, agent_id

**Frontend Changes:**
- Create `ActiveWorkflows` component
- Add to Dashboard or separate screen
- Show resume/cancel actions

**Files to Create:**
- `packages/ui/src/components/ActiveWorkflows.tsx`

**Files to Modify:**
- `packages/relay/src/routes/workflows.ts` (new)
- `packages/ui/src/screens/Dashboard.tsx`

**Estimated Effort:** 4-6 hours

---

## Implementation Order

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| **P0** | Approval-Ready Summaries | 4-6h | None |
| **P0** | Approval Reason Capture | 2-3h | None |
| **P1** | Diff Preview | 6-8h | Summaries |
| **P1** | Session Replay (lite) | 6-8h | Audit logs |
| **P2** | Resumable Workflows UI | 4-6h | Temporal API |

**Total Estimated Effort:** 22-31 hours

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Approval response time | < 2 min | Median time from request to decision |
| Rejection rate with reason | > 80% | % of rejections with explanation |
| User trust score | > 4/5 | Post-phase user survey |
| False positive rate | < 5% | % of legitimate actions flagged as risky |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Diff generation slow for large files | High | Limit diff to 1000 lines, show "File too large" warning |
| Summary templates incomplete | Medium | Start with top 5 action types, expand iteratively |
| Temporal workflow API complex | Medium | Use Temporal TypeScript SDK examples as reference |

---

## Next Steps

1. ✅ Complete Phase 0 UI polish (this task)
2. ⏳ Implement Approval-Ready Summaries
3. ⏳ Implement Approval Reason Capture
4. ⏳ Implement Diff Preview
5. ⏳ Implement Session Replay (lite)
6. ⏳ Implement Resumable Workflows UI

---

**Phase 1 Goal:** By the end, developers should feel **confident** approving agent actions because they understand exactly what they're approving.
