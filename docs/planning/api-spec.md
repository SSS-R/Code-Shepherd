# AgentOps — Backend API Specification

> **Base URL:** `http://localhost:3000` (dev) · `https://api.agentops.dev` (prod)
> **Protocol:** REST over HTTPS · **Format:** JSON
> **Auth:** Bearer JWT (Phase 3) · Currently unauthenticated (Phase 0-2)

---

## API Overview

| Group | Base Path | Routes | Status |
|-------|-----------|--------|--------|
| Health | `/health` | 1 | ✅ Built |
| Agents | `/agents` | 4 | ✅ Built |
| Approvals | `/approvals` | 4 | ✅ Built |
| Audit Logs | `/audit-logs` | 2 | ✅ Built |
| Workflows | `/workflows` | 1 | ✅ Built |
| Notifications | `/notifications` | 3 | ✅ Built |
| Tasks | `/tasks` | 5 | ⏳ Phase 2 |
| Policies | `/policies` | 3 | ⏳ Phase 2 |
| Auth | `/auth` | 4 | ⏳ Phase 3 |
| Teams | `/teams` | 4 | ⏳ Phase 3 |

---

## Common Response Patterns

### Success
```json
{ "id": "...", "status": "...", ...fields }
```

### Error
```json
{ "error": "Human-readable error message" }
```

### HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `400` | Bad Request — missing/invalid fields |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — resource already exists / duplicate |
| `500` | Internal Server Error |

---

## 1. Health Check

### `GET /health`
Server status and connectivity.

**Response `200`:**
```json
{
  "status": "ok",
  "temporal": "connected" | "disconnected",
  "agents": { "count": 5 },
  "version": "0.1.0",
  "uptime": 3600
}
```

---

## 2. Agent Registry (`/agents`)

### `POST /agents/register`
Register a new agent or update an existing one.

**Request Body:**
```json
{
  "id": "agent-abc-123",          // required, unique
  "name": "Claude Code Agent",    // required
  "capabilities": ["file_read", "file_write", "command_execute"]  // optional
}
```

**Response `201`:**
```json
{
  "id": "agent-abc-123",
  "name": "Claude Code Agent",
  "capabilities": ["file_read", "file_write", "command_execute"],
  "status": "online",
  "message": "Agent registered successfully"
}
```

---

### `POST /agents/:id/heartbeat`
Keep agent alive. Must be called every 30s. Agent marked offline after 90s silence.

**Response `200`:**
```json
{
  "id": "agent-abc-123",
  "status": "online",
  "message": "Heartbeat received"
}
```

**Response `404`:** Agent not found.

---

### `GET /agents`
List all registered agents.

**Response `200`:**
```json
[
  {
    "id": "agent-abc-123",
    "name": "Claude Code Agent",
    "capabilities": ["file_read", "file_write"],
    "status": "online",
    "last_heartbeat": "2026-03-20T02:00:00.000Z",
    "created_at": "2026-03-19T20:00:00.000Z"
  }
]
```

---

### `GET /agents/:id`
Get a specific agent's details.

**Response `200`:** Single agent object (same shape as list item).
**Response `404`:** Agent not found.

---

## 3. Approval Queue (`/approvals`)

### `POST /approvals`
Agent requests human approval for an action.

**Request Body:**
```json
{
  "id": "appr-uuid-001",           // required, unique
  "agent_id": "agent-abc-123",     // required
  "action_type": "file_write",     // required: file_write | file_delete | command_execute | api_call
  "action_details": {              // required, varies by action_type
    "path": "src/utils/parser.ts",
    "old_content": "// existing code",
    "new_content": "// new code here",
    "description": "Refactor parser utility"
  },
  "risk_level": "medium",         // optional: low | medium | high | critical
  "risk_reason": "Modifies utility used by 12 files"  // optional
}
```

**Response `201`:**
```json
{
  "id": "appr-uuid-001",
  "agent_id": "agent-abc-123",
  "action_type": "file_write",
  "summary": "Write 47 lines to src/utils/parser.ts",
  "diff": "--- a/src/utils/parser.ts\n+++ b/src/utils/parser.ts\n...",
  "is_new_file": false,
  "action_details": { ... },
  "risk_level": "medium",
  "risk_reason": "Modifies utility used by 12 files",
  "status": "pending",
  "message": "Approval request created"
}
```

---

### `GET /approvals/pending`
List all pending approvals, oldest first.

**Response `200`:** Array of approval objects with `status: "pending"`.

---

### `GET /approvals/:id`
Get a specific approval with full details.

**Response `200`:** Single approval object including `diff`, `summary`, `is_new_file`.
**Response `404`:** Approval not found.

---

### `PATCH /approvals/:id`
Approve or reject a pending approval.

**Request Body:**
```json
{
  "decision": "approved",         // required: "approved" | "rejected"
  "decision_reason": "Looks good" // optional (recommended for rejections)
}
```

**Response `200`:**
```json
{
  "id": "appr-uuid-001",
  "status": "approved",
  "decided_at": "2026-03-20T02:15:00.000Z",
  "message": "Approval approved"
}
```

**Response `404`:** Approval not found.
**Response `400`:** Invalid decision value or already decided.

---

## 4. Audit Logs (`/audit-logs`)

### `GET /audit-logs`
List all audit events (admin view).

**Query params:** `?limit=100`

**Response `200`:**
```json
[
  {
    "id": 42,
    "event_type": "approval_requested",
    "event_details": { "action_type": "file_write", "agent_id": "agent-abc-123" },
    "agent_id": "agent-abc-123",
    "approval_id": "appr-uuid-001",
    "timestamp": "2026-03-20T02:00:00.000Z"
  }
]
```

---

### `GET /audit-logs/:agentId/timeline`
Get chronological timeline for a specific agent with icons and categories.

**Query params:** `?limit=50`

**Response `200`:**
```json
[
  {
    "id": 42,
    "event_type": "approval_decided",
    "event_details": { "decision": "approved" },
    "agent_id": "agent-abc-123",
    "timestamp": "2026-03-20T02:10:00.000Z",
    "icon": "✅",
    "category": "approval",
    "status": "success"
  }
]
```

**Event Categories:** `tool` | `approval` | `system`
**Event Statuses:** `success` | `failure` | `pending`

---

## 5. Workflows (`/workflows`)

### `GET /workflows`
List open Temporal workflows.

**Response `200`:**
```json
[
  {
    "workflowId": "wf-approval-001",
    "workflowType": "ApprovalWorkflow",
    "status": "running",
    "waitingSince": "2026-03-20T01:00:00.000Z",
    "agentId": "agent-abc-123",
    "description": "Waiting for human interaction or timeout"
  }
]
```

Returns `[]` if Temporal is disconnected (graceful fallback).

---

## 6. Push Notifications (`/notifications`)

### `POST /notifications/subscribe`
Subscribe browser to Web Push.

**Request Body:** Standard `PushSubscription` JSON from browser.
**Response `201`:** `{ "message": "Subscribed" }`

### `DELETE /notifications/subscribe`
Unsubscribe from push.

**Request Body:** `{ "endpoint": "https://..." }`
**Response `200`:** `{ "message": "Unsubscribed" }`

### `POST /notifications/test`
Send a test push notification to all subscribers.

**Response `200`:** `{ "sent": 3, "failed": 0 }`

---

## 7. Tasks — Kanban Board (`/tasks`) ⏳ Phase 2

### `POST /tasks`
Create a new task and assign to an agent.

```json
{
  "title": "Refactor authentication module",
  "description": "Extract auth logic into middleware",
  "agent_id": "agent-abc-123",     // optional — unassigned if null
  "priority": "P1",                // P0 | P1 | P2 | P3
  "labels": ["refactor", "auth"]   // optional
}
```

### `GET /tasks`
List all tasks. Filter: `?status=in_progress&agent_id=abc&priority=P0`

### `GET /tasks/:id`
Get task details including linked approvals and worktree info.

### `PATCH /tasks/:id`
Update task: change status, reassign, update priority.

**Status transitions:** `queued → in_progress → blocked → done | failed`

### `DELETE /tasks/:id`
Soft-delete a task (move to archived).

---

## 8. Risk Policies (`/policies`) ⏳ Phase 2

### `GET /policies`
List all active risk policies.

### `POST /policies`
Create a new policy rule.

```json
{
  "name": "Block env file writes",
  "action_type": "file_write",
  "path_pattern": "*.env*",
  "decision": "block",           // block | require_approval | allow
  "risk_level": "critical"
}
```

### `PUT /policies/:id`
Update a policy rule.

---

## 9. Authentication (`/auth`) ⏳ Phase 3

### `POST /auth/register`
Create user account.

### `POST /auth/login`
Login → returns JWT.

### `POST /auth/refresh`
Refresh expired JWT.

### `GET /auth/me`
Get current user profile.

---

## 10. Teams (`/teams`) ⏳ Phase 3

### `POST /teams`
Create a team.

### `GET /teams/:id`
Get team details + members.

### `POST /teams/:id/invite`
Invite a member by email.

### `PATCH /teams/:id/members/:userId`
Update member role: `admin | developer | viewer`

---

## Database Schema (SQLite)

```sql
-- Current tables (Phase 0-1)
agents(id, name, capabilities, status, last_heartbeat, created_at)
approvals(id, agent_id, action_type, summary, diff, is_new_file, action_details, risk_level, risk_reason, status, decision, decision_reason, requested_at, decided_at)
audit_logs(id, event_type, event_details, agent_id, approval_id, timestamp)
push_subscriptions(id, endpoint, p256dh, auth, created_at)

-- Phase 2
tasks(id, title, description, agent_id, priority, labels, status, worktree_path, created_at, updated_at)
policies(id, name, action_type, path_pattern, decision, risk_level, enabled, created_at)

-- Phase 3
users(id, email, password_hash, name, role, team_id, created_at)
teams(id, name, plan, seats_max, created_at)
sessions(id, user_id, token_hash, expires_at)
```

---

*This spec is the contract between the relay server and all clients (PWA, SDK, future mobile app).*
*Update this document when adding or changing endpoints.*
