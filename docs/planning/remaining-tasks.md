# Code Shepherd — Remaining Tasks

> **Status:** Architecture reset in progress
> **Goal:** Reframe Code Shepherd as a unified multi-agent communication and control plane

---

## What is already true in the repo

These foundations already exist and should be preserved:

- monorepo structure for relay, UI, shared types, and SDK
- agent registration and heartbeat APIs
- approval request and decision flow
- risk scoring foundation
- audit and timeline foundation
- realtime event broadcasting foundation
- local auth and team scaffolding
- task and workflow scaffolding

These are valuable because they form the operational backbone for the larger product direction.

---

## What changes in product direction

Code Shepherd is no longer being treated as an approvals-only mobile dashboard.

The new primary goal is:

> connect many existing agents from IDEs and local systems into one place so the user can communicate with them, control them, approve risky actions, and manage them simultaneously from any device.

That means the next work should prioritize:

- conversations
- message routing
- adapters and bridges
- capability tiers
- multi-agent control UX

---

## Priority order

## Phase 1 — Product and data-model alignment

### Critical
- [ ] Define canonical entities for `Agent`, `Adapter`, `Conversation`, `Message`, `Command`, and `Approval`
- [ ] Define capability tiers for monitor, approval, chat, and steering modes
- [ ] Decide how approvals appear inside conversations while still supporting a separate approval queue
- [ ] Define the normalized adapter contract for native integrations and custom bridges
- [ ] Update shared documentation so all future implementation follows the same product center

### Outcome
After this phase, the repo should have a stable product language and system model.

---

## Phase 2 — Adapter and bridge foundation

### Critical
- [ ] Design adapter interfaces for IDE-native agents, MCP agents, and custom bridges
- [ ] Define connector onboarding flow for plugin install, helper process install, or command-based setup
- [ ] Support direct-session integrations such as the OpenClaw main session path
- [ ] Define heartbeat, reconnect, and offline semantics for bridge-connected agents
- [ ] Define capability negotiation so each integration advertises what it can actually do

### Outcome
After this phase, Code Shepherd can connect many types of external agents realistically.

---

## Phase 3 — Inbox and communication surface

### Critical
- [ ] Add a first-class inbox model to the UI and backend design
- [ ] Create conversation threads per agent or per task context
- [ ] Add message send and receive flows through the relay
- [ ] Support one-agent and multi-agent selection flows
- [ ] Decide how live status, agent replies, and system events appear in a shared thread model

### Outcome
After this phase, the product finally delivers the core user promise of talking to many agents from one place.

---

## Phase 4 — Embedded approvals and remote intervention

### Critical
- [ ] Keep approval queue support for fast triage
- [ ] Also render approval requests inside the related conversation or task thread
- [ ] Support reject with reason, revise instruction, and resume actions from the same control surface
- [ ] Define how approval decisions map back into bridge-specific agent behavior
- [ ] Harden workflow pause and resume semantics for disconnected sessions

### Outcome
After this phase, approvals become part of the communication workflow instead of a separate product island.

---

## Phase 5 — Parallel multi-agent operations

### Critical
- [ ] Support sending tasks to multiple agents in parallel
- [ ] Support viewing several active sessions at once
- [ ] Define task assignment and ownership across agents
- [ ] Align Kanban with conversation and approval flows instead of keeping it isolated
- [ ] Preserve audit trace across multi-agent coordination events

### Outcome
After this phase, Code Shepherd becomes an operational hub instead of a single-thread monitor.

---

## Phase 6 — Connector hardening and SaaS readiness

### Critical
- [ ] Add connector trust and permission model
- [ ] Define secure registration and revocation for local bridges
- [ ] Improve audit completeness across messages, approvals, tasks, and reconnects
- [ ] Prepare team-safe multi-user and organization-level governance
- [ ] Separate local-prototype assumptions from hosted SaaS deployment assumptions

### Outcome
After this phase, the architecture is credible as a cross-agent SaaS control plane.

---

## Immediate next markdown-to-code handoff

Before writing new product code, the implementation plan should follow this sequence:

1. define shared types for conversations, messages, adapters, and capability tiers
2. design relay routes for communication flows
3. redesign UI navigation around inbox, agents, approvals, timeline, tasks, and settings
4. decide the first connector target and bridge strategy
5. implement one end-to-end communication slice before broad connector expansion

---

## Recommended first implementation slice

The smallest useful next build slice is:

- one conversation model
- one message route
- one agent-thread UI
- one adapter contract
- one real connector path or bridge proof of concept

This should be done before broad polishing or deeper enterprise work.

---

## Notable de-prioritization for now

These items still matter, but they should not lead the roadmap until communication is first-class:

- cosmetic UI polish without inbox functionality
- enterprise compliance surfaces before connector usability
- advanced worktree automation before agent communication is unified
- broad marketplace support before the base adapter model is stable

---

## Working rule for future tasks

Every new feature proposal should answer:

1. does it improve unified communication with existing agents
2. does it improve remote control or intervention
3. does it improve simultaneous multi-agent coordination
4. does it improve auditability and safe operation

If not, it is probably a secondary priority.
