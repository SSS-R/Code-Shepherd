# Council Board — Multi-Agent Coordination with a Commander

> Status: **Approved direction, pre-implementation**
> Created: 2026-07-06
> Decisions locked: commander = a connected IDE agent (not relay-side API calls);
> same-repo conflict strategy = git worktrees per subtask; build order = Phase 1 fan-out first.

---

## 1. Concept

A **Council** is a group conversation where multiple connected agents from different
IDEs/runtimes sit at one table and work on one goal together.

| Role | Who | Responsibility |
|---|---|---|
| **Head** | The user | Sets the goal, approves risky actions, merges results |
| **Commander** | One steering-tier connected agent (e.g., a Claude Code session) | Decomposes the goal into subtasks, assigns them, reviews results |
| **Workers** | Any chat-tier+ connected agents (Codex, Antigravity, OpenClaw, Hermes, custom) | Execute one scoped subtask each |
| **Reviewer** (optional) | Any member other than the subtask's author | Second-eye pass on a completed subtask |

The commander is **not** a new model runtime inside Code Shepherd. It is any already-connected
agent promoted to the commander role for that council. Code Shepherd stays a control plane —
it routes, validates, budgets, and audits; it never thinks.

### Why this exists (product rationale)

1. **Token cost**: one expensive model plans once; cheap/subscription-billed agents execute
   narrow subtasks. Work routed to IDE agents on flat subscriptions (Claude Code Max, Codex
   plan) costs zero marginal API tokens.
2. **Second-eye quality**: results are reviewed by a *different* model than the one that
   produced them, catching model-specific blind spots.
3. **Parallelism**: N agents on N machines progress simultaneously; the user supervises from
   one thread instead of five IDE windows.

This strengthens all four roadmap criteria in `CODE_SHEPHERD.md` §15 (communication,
intervention, multi-agent coordination, auditability) and implements Phase E (Parallel
Operations) of the roadmap.

---

## 2. The token-economics contract (non-negotiable design rule)

A naive group chat that broadcasts every message to every member multiplies token spend by
council size. The council must therefore obey:

- **Scoped context by default.** A worker receives ONLY: its subtask brief, the files/paths in
  scope, and acceptance criteria. Never the full council transcript, never sibling subtasks.
- **Full-context moments are explicit.** Only the commander sees the whole board. Reviewers
  see one diff + one brief. The Head sees everything (UI-side, costs nothing).
- **Budgets are enforced, not suggested.** Each council session carries `max_subtasks`,
  `max_commands_per_member`, and an optional token estimate ceiling. Exceeding a cap pauses
  the council and pings the Head.

---

## 3. What already exists (reuse map)

| Need | Existing code | Change required |
|---|---|---|
| Group membership | `conversations.participant_agent_ids` (stored, unused) | Start routing on it |
| Command dispatch | `commands` queue → poll → ack → reply in `routes/conversations.ts` | Fan-out: N rows per send |
| Multi-IDE transport | `universal-mcp-gateway` per-machine polling | None — works as-is |
| Special in-thread agent | Shepherd Guide pattern (`guide/shepherdGuide.ts`) | Template for commander wiring |
| Subtask tracking | `tasks` table (priority, labels, `assigned_agent_id`, `blocked_by_task_id`) | Add `council_id`, `subtask_spec` columns |
| Same-repo isolation | `routes/operations.ts` worktree scaffold | Make it create real git worktrees |
| Risky-action gating | Approvals + `presentation_mode: 'queue-and-thread'` | None — approval cards land in the council thread |
| Capability tiers | Modeled in `shared/types.ts`, never enforced | Enforce: commander requires `steering` |
| Realtime updates | `broadcastRealtimeEvent` | New event types: `council.*` |

The only genuinely new machinery: the **commander protocol** (§5) and the **council state
machine** (§6).

---

## 4. Data model changes

### 4.1 `conversations` (extend)

```sql
ALTER TABLE conversations ADD COLUMN kind TEXT DEFAULT 'direct';          -- 'direct' | 'council'
ALTER TABLE conversations ADD COLUMN commander_agent_id TEXT;             -- required when kind='council'
ALTER TABLE conversations ADD COLUMN council_budget TEXT;                 -- JSON: {max_subtasks, max_commands_per_member}
ALTER TABLE conversations ADD COLUMN council_state TEXT DEFAULT 'idle';   -- 'idle'|'planning'|'executing'|'reviewing'|'paused'|'done'
```

`participant_agent_ids` becomes authoritative for council membership.

### 4.2 `tasks` (extend — subtasks ARE tasks, visible on the Kanban board)

```sql
ALTER TABLE tasks ADD COLUMN council_id TEXT;        -- FK → conversations.id (kind='council')
ALTER TABLE tasks ADD COLUMN subtask_spec TEXT;      -- JSON CouncilSubtask (brief, scope, acceptance)
ALTER TABLE tasks ADD COLUMN reviewer_agent_id TEXT; -- second-eye assignee, nullable
ALTER TABLE tasks ADD COLUMN worktree_branch TEXT;   -- e.g. council/<councilId>/<taskId>
```

### 4.3 Shared types (new, in `packages/shared/src/types.ts`)

```ts
export type CouncilRole = 'commander' | 'worker' | 'reviewer';
export type CouncilState = 'idle' | 'planning' | 'executing' | 'reviewing' | 'paused' | 'done';

export interface CouncilSubtask {
  id: string;                    // assigned by relay, not commander
  title: string;
  brief: string;                 // the ONLY context the worker gets
  assigned_agent_id: string;     // must be a council member, never the commander
  scope_paths?: string[];        // advisory file scope; informs worktree + review
  acceptance_criteria: string[];
  depends_on?: string[];         // subtask ids → maps to blocked_by_task_id
  reviewer_agent_id?: string;    // must differ from assigned_agent_id
}

export interface CouncilPlan {
  version: 1;
  goal_summary: string;
  subtasks: CouncilSubtask[];    // relay enforces 1..max_subtasks
  execution_notes?: string;
}
```

---

## 5. The commander protocol

How the relay tells "a plan" apart from ordinary chat, without trusting free text:

1. **Head → council**: user posts a goal. Relay routes it as a command to the
   **commander only** (`metadata.council_role_hint: 'commander'`,
   `metadata.expects: 'council_plan'`).
2. **Commander → relay**: the commander's gateway replies with
   `message_type: 'command'` and `metadata.council_plan = <CouncilPlan JSON>`.
   Plain-text replies without a plan are treated as clarifying questions and surfaced to
   the Head — that is allowed and normal.
3. **Relay validates** (hard rules, reject with reasons back into the thread):
   - every `assigned_agent_id` is a council member with tier ≥ `chat`
   - no subtask assigned to the commander itself (**loop guard #1**)
   - `subtasks.length ≤ council_budget.max_subtasks` (**loop guard #2**)
   - `reviewer_agent_id ≠ assigned_agent_id`
   - dependency graph is acyclic
4. **Relay dispatches**: creates one `tasks` row + one `commands` row per ready subtask
   (dependencies gate later waves). Each command's content is ONLY the rendered brief.
5. **Workers execute** via their gateways exactly as today (poll → ack → reply). A reply
   with `command_id` completes the subtask command; the relay advances dependents.
6. **Review wave**: if a subtask has a reviewer, its result (diff/summary) is dispatched to
   the reviewer as a scoped review command. Reviewer replies approve/flag.
7. **Commander wrap-up**: when all subtasks complete/fail, the relay sends the commander a
   compact results digest; the commander replies with the final summary for the Head.
8. **Risky actions anywhere** in this flow raise approvals into the council thread + queue,
   exactly as today.

Additional guards:
- Per-member command cap per session (**loop guard #3**).
- Council `paused` state: the Head can freeze all dispatch with one action.
- Worker offline > threshold → subtask flagged; commander may reassign in a revised plan
  (same validation path).

### Commander onboarding prompt

The gateway needs to teach an arbitrary IDE agent to be a commander. When a command carries
`expects: 'council_plan'`, the gateway wraps it with a standard instruction preamble
(kept in `packages/universal-mcp-gateway/src/councilPrompt.ts`) that explains the
CouncilPlan JSON contract and lists members + their capability tiers. This keeps the protocol
model-agnostic — any competent agent can command.

---

## 6. Council state machine (relay-owned)

```
idle → planning        Head posts goal; command sent to commander
planning → executing   Valid CouncilPlan received; wave 1 dispatched
executing → reviewing  All subtasks terminal; review commands out (skip if no reviewers)
reviewing → done       Commander digest + final summary delivered
any → paused           Head pause, budget breach, or repeated validation failure
paused → executing     Head resumes
```

State transitions are audit-logged (`council_state_changed`) and broadcast
(`council.updated` realtime event) so the UI board stays live.

---

## 7. Same-repo strategy: worktrees per subtask (locked decision)

Flesh out `routes/operations.ts` from scaffold to real:

- On dispatch of a subtask whose agent workspace matches the council repo, relay asks the
  **gateway** (which lives on the machine with the repo) to run:
  `git worktree add ../worktrees/<taskId> -b council/<councilId>/<taskId>`
- The subtask brief includes the worktree path; the worker is instructed to operate there.
- Merge is a Head-approved action at wrap-up (commander proposes merge order based on the
  dependency graph; conflicts fall back to the Head).
- `scope_paths` overlaps between parallel subtasks produce a warning in the plan-validation
  step — allowed, but the Head sees it before execution starts.

Gateway gains a small `workspace` capability (`worktree.create`, `worktree.remove`,
`worktree.status`) — these are host-OS commands, so they run through the same
risk-policy/approval gate as any other risky action (see SECURITY_AUDIT §3 on RCE).

---

## 8. Phases

### Phase 1 — Fan-out (prerequisite, small)
- `POST /conversations/:id/messages` accepts `target_agent_ids: string[]` (back-compat with
  singular field); creates N command rows; system message notes the fan-out.
- Inbox UI: multi-select member picker on send.
- **Exit test**: one instruction reaches two gateways on two machines; both replies land in
  the same thread.

### Phase 2 — Council conversations
- `kind='council'`, membership management endpoints, council creation flow in UI
  (pick members from online agents), per-agent reply lanes in the thread view.
- Budgets stored + enforced on raw fan-out.
- **Exit test**: 3-member council, group instruction, budget cap blocks the 4th command.

### Phase 3 — Commander
- Shared `CouncilPlan` types; plan validation; state machine; commander routing;
  gateway commander-prompt wrapper; Kanban shows council subtasks.
- **Exit test**: goal → commander (Claude Code) plans → 2 workers (Codex, Antigravity)
  execute scoped briefs → replies complete subtasks.

### Phase 4 — Review, worktrees, wrap-up
- Reviewer dispatch, results digest, final summary, real worktree lifecycle,
  merge-order proposal, `paused`/resume, offline reassignment.
- **Exit test**: same-repo council where two subtasks land in separate worktrees, one gets
  cross-reviewed by a different model, Head approves the merge from the thread.

Non-goals for v1: cross-council scheduling, automatic model-price-aware assignment,
relay-side LLM calls (explicitly rejected), agent-to-agent free chat without Head visibility.

---

## 9. Open questions (decide during Phase 2/3 build)

1. Does the commander see worker replies live (streaming board) or only the final digest?
   Digest-only is cheapest; live costs more tokens but catches derailment earlier.
   *Leaning: digest-only in v1, with a "consult commander now" button for the Head.*
2. Reviewer selection: commander picks, round-robin, or Head picks? *Leaning: commander
   proposes in the plan, Head can override before execution.*
3. Should a worker be able to ask the Head a clarifying question mid-subtask? (Today a
   reply completes the command.) Likely needs a `needs_input` command status.
4. Budget units: command counts are enforceable today; token counts need the (unbuilt)
   context-optimizer package. Ship counts first, tokens later.
