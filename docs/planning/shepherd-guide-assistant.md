# Shepherd Guide - Integration Notes

## Product position

Shepherd Guide is an in-app help surface for Code Shepherd.

It is **not** a separate product model that Code Shepherd owns or trains. The intended production path is:

1. Code Shepherd creates or ensures a first-party `shepherd-guide` conversation target in the relay
2. That target is backed by the user's OpenClaw environment
3. OpenClaw is reached through an MCP server integration path
4. Relay conversations, audit logs, and feedback stay inside Code Shepherd

This keeps the product aligned with the main thesis: Code Shepherd is the control plane, and external agent runtimes stay external.

## Current repo state

- The UI guide loop is already wired through conversations
- The relay already seeds and persists the `shepherd-guide` conversation
- Feedback is stored on guide message metadata
- The current backend reply path is scripted, which is acceptable as a local fallback

## Production target

- Replace scripted relay replies with an MCP-backed OpenClaw connector path
- Keep the same conversation schema and feedback flow
- Preserve audit events for guide usage and fallback cases
- Avoid introducing a standalone guide-only model runtime inside Code Shepherd

## Why this matters

- It matches the multi-agent control-plane architecture
- It avoids turning Shepherd Guide into a special-case LLM product inside the app
- It lets the same connector and trust model apply to Guide as it does to other agents
- It keeps OpenClaw as the runtime boundary the user already owns
