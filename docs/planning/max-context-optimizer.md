# Max Tier — Context Optimizer Feature

## What It Is

Context Optimizer is a **Max-exclusive** feature that automatically compresses every command a user sends to their agents before it reaches them.

When a Max user types a command in the Code Shepherd inbox, the relay intercepts it, runs it through an optimization engine, and forwards a leaner version to the agent. The agent receives the same intent, but in fewer tokens.

The user sees the original message in the UI. The agent gets the compressed version.

---

## Why It Matters

Code Shepherd users connect many agents in parallel. Each of those agents runs on LLM APIs — Claude, GPT-4, Gemini — where every token costs money.

The problem today:
- Commands with pasted code, file paths, or long identifiers are token-heavy by default.
- Agents process them fine, but users pay for the noise — comments, empty lines, verbose variable names, repeated context.
- At scale (multi-agent, high-frequency sessions), this waste compounds fast.

Context Optimizer eliminates the waste without the user having to think about it.

**This is a real dollar-value feature.** Max users at $50/month running heavy workloads could save 30-70% on LLM API costs depending on how code-heavy their commands are.

---

## How It Works

The optimizer is a pure text transformation pipeline with three stages:

### Stage 1 — Compressor
Strips noise from code content:
- Removes inline comments (`//`, `/* */`, `#`)
- Removes blank lines
- Halves indentation depth
- Drops lines that are only closing brackets

Typical saving: **20-40%** on code-heavy input.

### Stage 2 — Symbol Map
Finds identifiers longer than 12 characters and replaces them with short aliases (`α1`, `α2`, etc.).
Appends a `§MAP` lookup table at the end so the agent can decode them.

Example:
```
Before: useAuthenticationContext
After: α1

§MAP:
  α1=useAuthenticationContext
```

Typical saving: **8-25%** additional on top of Stage 1.

### Stage 3 — Token Counter
Measures token counts before and after using the same tokenizer as OpenAI models (`o200k_base`). Used to calculate and record savings stats.

---

## Where It Lives in the Architecture

The optimizer runs as middleware inside the relay, between the user's message submission and the command being stored:

```
User sends command (POST /conversations/:id/messages)
        ↓
[ Tier Check ] — Is this user on Max?
        ↓ yes
[ Context Optimizer Middleware ]
  • Run through Compressor
  • Run through Symbol Map
  • Record original vs compressed token counts
        ↓
Compressed command stored → agent polls via GET /commands/poll
        ↓
Agent receives optimized prompt
```

User-facing message in the UI always shows the original. The compression is transparent.

---

## Realistic Savings Estimates

| Message type | Compression potential |
|---|---|
| Pure natural language command | 5–15% |
| Command with pasted code block | 40–60% |
| Command with long variable names | +8–25% on top |
| Agent reply with code (stored for context) | 40–70% |

---

## Implementation Plan

### Phase 1 — Core Engine (`@code-shepherd/context-optimizer` package)

New package at `packages/context-optimizer/`:

```
src/
  compressor.ts      — Strip comments, blank lines, normalize indent
  symbolMap.ts       — Replace long identifiers with α-aliases
  tokenCounter.ts    — Wrap gpt-tokenizer for before/after counts
  index.ts           — optimize(content) → { compressed, stats }
```

Dependency: `gpt-tokenizer` (npm, zero native deps).

This is a self-contained package with no side effects — easy to test and iterate.

### Phase 2 — Relay Middleware

In `packages/relay/src/`:

```
middleware/
  contextOptimizer.ts   — NEW: wraps optimize(), checks tier, records stats
```

Hook into `conversations.ts` → `POST /:id/messages`:
- Check user plan === `max`
- Run content through optimizer
- Store both `content` (original for UI) and `optimized_content` (for agent command)
- Add `optimization_stats` to command metadata

### Phase 3 — Stats Tracking

Extend the `commands` table with:
- `original_token_count` — tokens before compression
- `optimized_token_count` — tokens after compression
- `tokens_saved` — delta

Extend `audit_logs` with an `optimization_applied` event.

### Phase 4 — UI (Max Dashboard)

New card on the agent profile or settings view:

- **Tokens Saved This Month** — running total
- **Savings Rate** — average % per command
- **Estimated Cost Saved** — calculated at ~$0.01/1K tokens (configurable)
- **Commands Optimized** — count

Label it **"Context Optimizer"** with a Max badge. Free/Pro users see it greyed out with an upgrade prompt.

---

## What Makes This a Real Max Feature (Not Just a Gimmick)

1. **Zero configuration** — Max users get it automatically. No setup, no binary to install.
2. **Transparent** — They always see their original message. The compression is invisible.
3. **Measurable ROI** — The savings dashboard gives them a concrete dollar figure, not just a vague "we made it better."
4. **Scales with usage** — The heavier they use Code Shepherd, the more they save. This rewards the exact users who need Max.

The value proposition: **Max costs $50/month. If a heavy user saves $30-80/month in LLM API costs, the tier partially pays for itself.**

---

## Open Questions

- Do we also compress agent replies when they are stored as conversation history (for context window re-use)?
- Should Free/Pro users see the optimizer stats in read-only mode to nudge upgrades?
- Should users be able to toggle optimizer off (e.g. for debugging commands where they want exact token fidelity)?
- Should we support different modes: `standard` (Stage 1 only) vs `aggressive` (Stage 1 + 2)?

---

## Inspired By

This feature is inspired by [lean-ctx](https://github.com/yvgude/lean-ctx) (MIT License) — a Rust-based CLI tool that uses the same compression strategies for local LLM sessions. We are reimplementing the core compression logic in TypeScript as a native relay middleware — no binary dependency, no installation required for users.
