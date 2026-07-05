# Code Shepherd Security Audit

> Reconciled to code at commit 7eea5c7 on 2026-07-06. An earlier revision of this audit
> predated the auth/security work in commit `d14b309`; findings it raised about header-trusted
> auth, SHA-256 passwords, `localStorage` tokens, missing CSP, unauthenticated WebSockets, and
> missing rate limiting have since been resolved (see "Resolved since last audit").

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

Current security posture is **prototype-grade with a solid baseline**, still short of production-grade.

The system now includes:

- signed JWT access tokens (HS256) with short TTL and hashed refresh sessions
- httpOnly/SameSite auth cookies (no browser-side token storage)
- scrypt password hashing with automatic upgrade from legacy SHA-256
- account lockout and per-IP/email + global rate limiting
- authenticated `/realtime` WebSocket handshake
- CSP, strict CORS allowlist, and standard hardening headers
- connector trust, revocation, hashed + scoped + expiring tokens, and secret rotation
- audit logging for approvals, connector lifecycle, coordination, and replies

It is **not yet secure enough for a real SaaS launch** — the gaps below remain.

---

## Resolved since last audit

- **Header-trusted auth → JWT.** `middleware/auth.ts` now verifies signed access tokens (bearer or httpOnly cookie); role/team come from the verified payload, not client headers.
- **SHA-256 → scrypt.** `utils/authSecurity.ts` hashes with scrypt and auto-upgrades legacy SHA-256 hashes on next login.
- **Rate limiting + lockout.** Global limiter plus a stricter per-IP/email auth limiter; 5-attempt / 15-minute account lockout.
- **Unauthenticated WebSockets → authenticated handshake.** `realtime.ts` rejects unverified `/realtime` upgrades via `verifyClient`.
- **`localStorage` tokens → httpOnly cookies.** Auth is carried in `HttpOnly`, `SameSite` cookies.
- **No CSP → CSP + headers.** `index.ts` sets CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a strict CORS allowlist.
- **Connector secret expiry.** Connector tokens are hashed, scoped, and carry expiry; secrets can be rotated.

---

## Open high-priority findings

### 1. Insecure default `AUTH_SECRET`
`getAuthSecret()` falls back to `'dev-only-change-me-before-production'`. If unset in production, all JWTs are forgeable.

**Required fix:** require `AUTH_SECRET` at boot in production and fail fast if it is the dev default.

### 2. Incomplete input validation
Only auth inputs are validated. Conversations, tasks, approvals, and connector routes still rely on manual checks.

**Required fix:** add schema validation (`zod` or equivalent) for every public route.

### 3. Command injection / RCE risk in agent bridges
This system dispatches tasks to coding agents; malicious or hallucinated payloads could be executed on the agent host.

**Required fix:** strictly validate command payloads on the agent side and separate "instructions to the LLM" from "commands to the host OS."

### 4. Connector auth still lacks replay/request-signing protection
Scoped expiring tokens exist, but there is no nonce/replay protection, per-connector device/IP policy, mutual TLS, or request signing.

**Required fix:** add issued-at/nonce semantics and request signing for bridge traffic.

---

## Medium-priority findings

- **Unencrypted Temporal traffic (missing mTLS).** Configure mTLS for Temporal client/worker connections in production.
- **No encryption at rest.** SQLite files are plaintext by default.
- **No secret management strategy.** Environment and connector secret handling are still basic.
- **Tenant isolation not fully hardened.** `team_id` scoping is used broadly but not every table/query is proven hardened for a SaaS threat model.
- **CSRF review for cookie auth.** Now that auth uses cookies (`SameSite=Lax`), confirm state-changing routes are safe against CSRF (or move to `SameSite=Strict` / add CSRF tokens where needed).

---

## Lower-priority or future hardening items

- outbound egress controls for bridges
- sandboxing or isolation for local helper execution
- signed connector manifests and verified plugin provenance
- tamper-evident audit chain
- anomaly detection for agent behavior

---

## Required remediation before SaaS launch

### Blocker list
1. enforce a non-default `AUTH_SECRET` in production
2. add schema validation for all external endpoints
3. harden connector auth with replay protection and request signing
4. review every `team_id` query for strict tenant isolation
5. configure Temporal mTLS
6. restrict agent bridges against command injection / RCE payloads
7. add encryption-at-rest and a real secret management strategy

---

## Final assessment

Code Shepherd now has a real security baseline — signed auth, hashed passwords, cookie-based
sessions, rate limiting, an authenticated realtime channel, CSP, and scoped connector trust.

It does **not** yet meet the standard expected for a production SaaS handling organizational
agent traffic. The highest-value next security work is enforcing a production `AUTH_SECRET`,
adding full schema validation, and hardening the agent-bridge execution path against RCE.
