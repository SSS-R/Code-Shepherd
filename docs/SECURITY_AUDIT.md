# Code Shepherd Security Audit

## Scope

This audit reviews the current repository as an early SaaS-oriented prototype with:

- relay APIs
- connector governance
- agent conversations and commands
- approval flows
- team scaffolding

It is **not** a penetration test. It is an engineering security review of the current implementation state.

---

## Executive summary

Current security posture is **prototype-grade, not production-grade**.

The project now has a better trust model than before because it includes:

- connector trust and revocation
- hashed connector secrets
- scoped connector authentication for agent-facing command polling and acknowledgements
- audit logging for approvals, connector lifecycle, coordination, and replies

But the system is **not yet secure enough for a real SaaS launch**.

---

## High-priority findings

### 1. User authentication is insecure
Current auth in [`packages/relay/src/middleware/auth.ts`](../packages/relay/src/middleware/auth.ts) trusts `x-user-id`, `x-team-id`, and `x-role` headers directly.

**Risk:** any client can impersonate any user or role.

**Required fix:**
- replace header trust with signed session tokens or JWTs
- validate team membership from database on every privileged request
- never accept role from the client as a source of truth

### 2. Password storage is weak
Current password handling in [`packages/relay/src/routes/auth.ts`](../packages/relay/src/routes/auth.ts) uses SHA-256 without adaptive hashing.

**Risk:** passwords are too cheap to brute-force if leaked.

**Required fix:**
- use `argon2id` or `bcrypt`
- add login rate limiting
- add account lockout or risk-based throttling

### 3. Connector secrets are only the first step
The new connector secret model improves security, but still needs hardening.

**Remaining risks:**
- no secret expiry policy
- no per-connector IP/device trust policy
- no nonce or replay protection
- no mutual TLS or signed request model

**Required fix:**
- add rotating short-lived tokens derived from long-lived credentials
- add issued-at / expiry semantics
- add request signing for bridge traffic

### 4. No rate limiting
The relay currently lacks endpoint-level throttling.

**Risk:** brute force, abuse, and DoS are easier.

**Required fix:**
- add IP and identity-based rate limiting for auth, approvals, conversations, and connector endpoints

### 5. No robust input validation layer
Most routes use manual checks only.

**Risk:** malformed payloads, type confusion, and inconsistent validation.

**Required fix:**
- add schema validation with `zod` or equivalent for every public route

### 6. Unauthenticated Realtime WebSockets
The `/realtime` WebSocket endpoint broadcasts system events without any authentication check.

**Risk:** unauthorized clients can connect and intercept sensitive event metadata (`workflows.updated`, `approvals.updated`, `agents.updated`), leading to broad information disclosure.

**Required fix:**
- require auth tokens during the WebSocket handshake (`upgrade` request or via first message)
- drop unauthenticated socket connections immediately

---

## Medium-priority findings

### 6. No encryption-at-rest strategy
SQLite files are plaintext by default.

### 7. No secret management strategy
Environment and connector secret handling are still basic.

### 8. No tenant isolation hardening
The project uses `team_id` scoping, but not all tables and queries are guaranteed hardened for a SaaS threat model.

### 9. No CSRF/session protection model
If the product moves to cookie auth later, CSRF protections will be required.

### 10. No security headers / CORS policy hardening
The relay currently does not implement a hardened production web security policy.

### 11. No Content Security Policy (CSP) and Insecure Token Storage
The UI stores session data in `localStorage` (via `authSession.ts`), which exposes it to Cross-Site Scripting (XSS). There is also no strict CSP.

**Risk:** If an agent returns malicious markdown or HTML that gets rendered in the UI, an attacker could execute an XSS payload and steal session tokens or forge approvals.

**Required fix:**
- migrate session tokens to `HttpOnly`, `Secure` cookies
- implement a strict Content Security Policy (`script-src`, `connect-src`) for the web app

### 12. Unencrypted Temporal Traffic (Missing mTLS)
The Relay connects to the Temporal cluster without Mutual TLS (mTLS) configured.

**Risk:** Workflow data, including sensitive agent commands and approval contexts, is transmitted in plaintext across the network to the Temporal server.

**Required fix:**
- configure mTLS for all Temporal Client and Worker connections in production

### 13. High Command Injection / RCE Risk in Agent Bridges
The audit delegates "sandboxing" to a lower priority, but since this system dispatches tasks to coding agents, local Command Injection / Remote Code Execution (RCE) on the agent host is a primary threat.

**Risk:** Malicious or hallucinated inputs from the Relay could be blindly executed by local agent runners as raw shell commands.

**Required fix:**
- strictly validate all command payloads *on the agent side* before local execution
- strictly separate "instructions to the LLM agent" from "commands to the host OS"

---

## Lower-priority or future hardening items

- outbound egress controls for bridges
- sandboxing or isolation for local helper execution
- signed connector manifests
- verified plugin provenance
- tamper-evident audit chain
- anomaly detection for agent behavior

---

## What was improved in this implementation round

- connector trust persistence
- connector revocation flow
- hashed connector secret storage
- scoped connector auth middleware in [`packages/relay/src/middleware/connectorAuth.ts`](../packages/relay/src/middleware/connectorAuth.ts)
- authenticated command polling and acknowledgement routes in [`packages/relay/src/routes/conversations.ts`](../packages/relay/src/routes/conversations.ts)
- improved audit events for replies, coordination, and connector lifecycle

---

## Required remediation before SaaS launch

### Blocker list
1. replace header-based auth with signed server-issued auth
2. migrate password hashing to Argon2id or bcrypt
3. add schema validation for all external endpoints
4. add rate limiting and abuse protection
5. harden connector authentication with rotation and expiry semantics
6. review every `team_id` query for strict tenant isolation
7. add production security headers, HTTPS-only deployment rules, and secure cookie/token policies
8. secure the WebSocket `/realtime` endpoint with authentication
9. restrict Agent Bridges against command injection / RCE payloads
10. implement strict CSP and move session tokens out of `localStorage`

---

## Final assessment

Code Shepherd is moving in the right direction, but it is still a **prototype with partial security controls**.

It now has the beginnings of:

- bridge trust
- scoped connector auth
- auditability
- governance surfaces

It does **not** yet meet the standard expected for a production SaaS handling organizational agent traffic.

The highest-value next security work is replacing the current user auth model and adding full schema validation plus rate limiting.
