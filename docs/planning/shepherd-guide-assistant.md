# Shepherd Guide — In-App Assistant

## What It Is

Shepherd Guide is a first-party AI assistant embedded inside Code Shepherd that helps users navigate the product, understand features, and get unstuck — without needing to contact support or read documentation externally.

It is powered by OpenClaw running a lightweight model (Phi3mini), pre-loaded with a system prompt describing Code Shepherd's UI, features, and workflows.

Simultaneously, every conversation the assistant handles is logged. This gives passive, ongoing insight into where users are confused or struggling.

---

## Why Build This

### For users
- Code Shepherd is a multi-agent control plane — the concepts (connectors, capability tiers, approvals, conversations) are non-trivial for new users.
- Instead of dropping into docs or submitting a support ticket, they ask the assistant inline.
- Fast answers from a model that only knows about Code Shepherd = low friction, high trust.

### For the product
- Every question is a signal. "How do I connect an agent?" means onboarding is unclear. "Why isn't my approval showing?" means the approval UX has a gap.
- This is free, always-on user research — no surveys, no interviews needed.
- Reduces support load over time.

---

## Model Choice — Why Phi3mini

OpenClaw currently runs on Qwen 3.5+, which is powerful but heavier than needed for this use case.

For Shepherd Guide, the model does **not** need to be smart — it needs to be fast and instruction-following. The knowledge comes entirely from the system prompt (the Code Shepherd instruction doc), not from the model's own reasoning.

Phi3mini is the right fit:
- Runs locally on OpenClaw with low resource usage
- Low latency — feels snappy for a chat assistant
- No per-query API costs (self-hosted)
- Sufficient for Q&A, navigation help, and feature explanations

If a question is too complex for Phi3mini, the fallback is a link to docs or a human support route — not a hallucinated answer.

---

## How It Works

### User flow

```
User is confused mid-session
        ↓
Opens Shepherd Guide (floating "?" button or sidebar tab)
        ↓
Types a question: "How do I connect Claude Code?"
        ↓
Message routed to OpenClaw (Phi3mini + Code Shepherd system prompt)
        ↓
OpenClaw replies with a clear, product-specific answer
        ↓
Conversation logged to relay → audit timeline
```

### System prompt approach

The system prompt is a markdown document written by hand, covering:

- What each screen does (Inbox, Agents, Approvals, Timeline, Tasks)
- How to connect agents (each connector type)
- What Free / Pro / Max each get
- Common troubleshooting steps
- What Shepherd Guide cannot help with (billing, account issues → redirect)

This doc is maintained by Rafi and updated as the product evolves. OpenClaw reads it at session start. No fine-tuning needed.

---

## Architecture

Shepherd Guide is a **first-party agent** inside the relay — not an external integration.

```
Code Shepherd Relay
  → Agent Registry
      → "shepherd-guide" (internal, type: first-party)
          → Connected to OpenClaw (Phi3mini)
          → System prompt: Code Shepherd instructions doc
          → All conversations stored in messages table
          → Audit logs tagged: source = "guide"
```

It reuses the existing conversation, message, and audit infrastructure.  
No new tables needed. No new relay endpoints needed.

The UI gets a new entry point: a Guide button / chat panel that opens a conversation scoped to `shepherd-guide` agent.

---

## Feedback Collection

Every conversation is stored with full message history. A simple query against `audit_logs` or `messages` filtered by `agent_id = 'shepherd-guide'` gives:

- Most common questions (frequency count)
- Unanswered or escalated queries (fallback triggered)
- Time of day / plan tier of users asking (from `team_id` / auth context)

This can be reviewed manually or later visualized in an internal analytics view.

---

## Implementation Plan

### Phase 1 — OpenClaw instruction doc

Write the Code Shepherd instruction markdown that becomes the system prompt:
- All screens and what they do
- All connector types and how to set them up
- Tier differences (Free / Pro / Max)
- FAQ section
- Explicit "I cannot help with X, please contact support" rules

This is the most important phase. A weak instruction doc = a weak assistant.

### Phase 2 — Shepherd Guide agent registration

Register `shepherd-guide` as a permanent first-party agent in the relay:
- Fixed agent ID: `shepherd-guide`
- Adapter type: `first-party`
- Capability tier: Tier 3 (chat capable)
- Auto-created on relay startup if not present

### Phase 3 — OpenClaw connection

Connect OpenClaw (Phi3mini) to the relay under the `shepherd-guide` agent ID using the existing SDK / connector.

Load the instruction doc as the system prompt on startup.

### Phase 4 — UI entry point

Add a Shepherd Guide entry point to the app:
- Floating `?` button available on all screens
- Opens a conversation panel scoped to `shepherd-guide`
- Standard message input, same as inbox conversations
- Label: **"Shepherd Guide"** with a small AI indicator

No new UI components needed — reuse the existing conversation thread component.

### Phase 5 — Internal review tooling

Simple internal view (admin only) showing:
- Top 20 questions asked this week
- Queries that triggered the fallback response
- Plan tier breakdown of who is asking

This can be a basic query on top of existing logs — no new tables.

---

## Tier Access

| Tier | Access |
|---|---|
| Free | ✅ Full access — helps with onboarding friction |
| Pro | ✅ Full access |
| Max | ✅ Full access + priority response (if rate limiting ever applies) |

Shepherd Guide should be available to all tiers. The business reason: reducing confusion at the Free tier increases the chance of conversion to Pro. It is not a premium differentiator — it is a product quality baseline.

---

## Open Questions

- Should Shepherd Guide conversations be visible in the main inbox, or kept in a separate "Help" tab?
- Should users be able to rate responses (👍 / 👎)? Useful signal but adds UI complexity.
- If OpenClaw is offline, show a "Guide is unavailable" message or hard-coded FAQ fallback?
- Should the instruction doc be version-controlled alongside the codebase?

---

## What This Is Not

- Not a general-purpose AI chatbot. It only answers questions about Code Shepherd.
- Not a replacement for real documentation. Docs should still exist. The guide is a faster on-ramp.
- Not a support ticket system. Billing, account issues, and bugs go to human support.
