# QA / Beta Tester Guide

## Purpose

This guide is for local QA, design review, and early beta validation of the current AgentOps prototype.

It explains:

- how to install and run the app locally
- how to seed demo data
- what to expect from IDE/agent connections right now
- what features should be verified during a test pass

## What you are testing

You are testing the **current prototype**, not the full roadmap vision.

Focus on validating:

- relay starts successfully
- UI loads and can reach the relay
- auth/team/demo flows work locally
- seeded data appears in the UI
- approval, timeline, task, and settings surfaces behave coherently
- documented gaps are correctly understood as gaps, not bugs

## Prerequisites

- Node.js 18+
- npm 9+
- two terminal windows
- optional: Temporal running on `localhost:7233`

## Initial setup

From [`agentops/package.json`](../package.json), this is an npm workspace monorepo.

### 1. Install dependencies

From the `agentops` repo root:

```bash
npm install
```

### 2. Create local environment file

Copy [`agentops/.env.example`](../.env.example) to `.env`.

Default values are suitable for local testing:

```bash
PORT=3000
DATABASE_PATH=./relay.db
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=agentops-queue
NODE_ENV=development
```

### 3. Optional VAPID setup for push tests

If push notification testing is in scope, generate keys from [`agentops/packages/relay/src/utils/vapidKeys.ts`](../packages/relay/src/utils/vapidKeys.ts:1):

```bash
cd packages/relay && npx ts-node src/utils/vapidKeys.ts
```

Place the generated values into `.env`.

## Running localhost

### Relay server

Recommended for QA:

```bash
npm run build:relay
npm run start --workspace=@agentops/relay
```

Why this matters:

- [`agentops/packages/relay/package.json`](../packages/relay/package.json) uses `tsc --watch` for `dev`, which compiles but does not itself launch the Node server
- building then starting is the clearest way to validate the runnable relay for QA

Expected relay URLs:

- `http://localhost:3000/health`
- `ws://localhost:3000/realtime`

### UI

In a second terminal:

```bash
npm run dev:ui
```

Expected UI URL:

- `http://localhost:5173`

The UI expects the relay at `http://localhost:3000`, as seen in [`agentops/packages/ui/src/App.tsx`](../packages/ui/src/App.tsx:21) and related screen fetch calls.

## Expected startup behavior

### Healthy minimum state

You should be able to:

- open the UI
- see the connection indicator switch to connected if the relay is up
- navigate between Dashboard, Approvals, Timeline, Kanban, and Settings

### Temporal expectation

The relay attempts a Temporal connection in [`agentops/packages/relay/src/index.ts`](../packages/relay/src/index.ts:50).

If Temporal is not running:

- the relay may log a connection failure
- this is currently expected in dev
- non-Temporal parts of the prototype can still be tested

Do **not** file “Temporal unavailable locally” as a product bug unless the relay fully fails to start when testing a non-Temporal scenario.

## Demo seeding

The quickest test path is demo seeding.

### Option A: use the UI

Open Settings and click **Load Demo**.

This calls [`createDemoRoutes()`](../packages/relay/src/routes/demo.ts:5) through `POST /demo/seed` and creates:

- a demo user
- a demo team
- a demo team membership
- a demo agent
- a demo task
- a pending demo approval
- a related audit log entry

### Option B: hit the endpoint directly

```bash
curl -X POST http://localhost:3000/demo/seed -H "Content-Type: application/json"
```

On Windows without `curl`, use a REST client or browser tooling instead.

### Expected seeded results

After demo seed:

- Settings should show an active demo session
- Dashboard should show at least one agent
- Approvals should show a pending approval
- Kanban should show a seeded task
- timeline/audit-related surfaces should show seeded activity

## Signup/login/team flow

The local collaboration prototype is available from [`agentops/packages/relay/src/routes/auth.ts`](../packages/relay/src/routes/auth.ts:9) and [`agentops/packages/ui/src/screens/Settings.tsx`](../packages/ui/src/screens/Settings.tsx:17).

Testers can:

- create an account
- optionally create a team during signup
- log in with an existing local account
- refresh team memberships
- create invitations
- accept invitations as the current local user

Important expectation:

- this is **prototype auth**, not production security
- returned tokens are demo-style local tokens
- QA should test flow coherence, not security guarantees

## IDE / agent connection expectations

### What works now

The repo is designed to support coding agents via the local relay and SDK.

Current expectations:

- agents can register with the relay
- agents can send heartbeats
- agents can request approvals
- approvals can be reviewed from the UI

The SDK source is in [`agentops/packages/sdk/src/client.ts`](../packages/sdk/src/client.ts:1) and related files.

### What testers should expect from real IDE integrations

For local beta validation, assume integrations are **prototype/manual**, not polished product onboarding.

That means:

- you may need a custom local script or manual SDK usage to simulate an agent
- a live coding IDE session may not be auto-discovered by the app
- dashboard visibility depends on relay API activity, not magical IDE presence
- workflow durability is more convincing when Temporal is available

### When a missing IDE connection is not a bug

Do not report these as bugs by default:

- “I opened VS Code and AgentOps did not auto-connect”
- “No real coding agent appeared without registering through the relay”
- “Temporal-powered resume behavior was limited while Temporal was offline”

Report a bug when:

- a correctly registered demo or SDK-driven agent does not appear
- heartbeat updates do not refresh expected UI state
- approval requests are created but never show in the queue despite successful API responses

## Feature verification checklist

Use this as the standard QA pass.

### A. Startup and navigation

- [ ] Relay starts locally
- [ ] [`/health`](../packages/relay/src/index.ts:80) returns success
- [ ] UI loads at localhost
- [ ] Top connection indicator reflects relay availability
- [ ] Bottom navigation switches between all five screens

### B. Settings/auth/demo

- [ ] Sign up creates a local user
- [ ] Login works with the created user
- [ ] Team creation works during signup
- [ ] Team list refresh works
- [ ] Invitation creation works
- [ ] Invitation acceptance works for the current user
- [ ] **Load Demo** populates a usable local session

### C. Dashboard and agents

- [ ] Seeded or registered agents appear in the dashboard
- [ ] Agent status appears sensible
- [ ] Opening an agent detail view works
- [ ] Timeline/activity data is visible for the selected agent

### D. Approvals

- [ ] Seeded approval appears in Approval Queue
- [ ] Approval summary is readable
- [ ] Risk level is shown
- [ ] Approve action works
- [ ] Reject action works
- [ ] Rejection reason capture behaves correctly

### E. Timeline / audit

- [ ] Timeline screen renders
- [ ] Seeded activity appears after demo load
- [ ] Approval decisions are reflected in history/audit views

### F. Kanban / tasks

- [ ] Kanban screen renders
- [ ] Seeded task appears
- [ ] Task status and priority are visible
- [ ] Task data updates reflect correctly if edited through supported flows

### G. Realtime behavior

- [ ] Relay exposes websocket endpoint
- [ ] UI reflects updates without requiring a full page refresh where implemented

### H. Known non-blockers

- [ ] Temporal can be disconnected in local dev without invalidating all non-workflow testing
- [ ] Prototype auth is understood as local scaffolding
- [ ] Enterprise/security promises are not assumed from the current build

## Suggested QA sequence

1. start relay
2. start UI
3. verify health and connected indicator
4. go to Settings
5. click **Load Demo**
6. inspect Dashboard
7. inspect Approvals and take a decision
8. inspect Timeline
9. inspect Kanban
10. return to Settings and test signup/login/team flows if needed

## Known rough edges worth logging clearly

Report these if they behave inconsistently, crash, or contradict docs:

- relay cannot run locally after build
- UI cannot reach relay at expected localhost URLs
- demo seed fails or seeds incomplete data
- seeded approval/task/agent data does not appear in the expected screens
- auth/team/invitation flows break local session handling
- realtime updates silently fail for flows that should broadcast

## How to write bug reports for this repo

Include:

1. test environment: OS, Node version, npm version
2. whether Temporal was running
3. whether demo seed or manual signup was used
4. exact screen and action taken
5. expected result
6. actual result
7. console/network/server logs if available

Good bug reports will help distinguish real regressions from roadmap gaps.
