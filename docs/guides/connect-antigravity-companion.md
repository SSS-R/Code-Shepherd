# Connect Antigravity Companion

This companion is the round-trip Antigravity path for Code Shepherd.

## What It Does

- pairs a deployed `antigravity-companion` agent with the relay
- keeps the agent online from inside Antigravity
- receives tasks from Code Shepherd
- lets you reply back into the same Shepherd conversation from Antigravity

## First-Time Setup

1. In Code Shepherd, go to `Agents`.
2. Deploy a new agent using the `Antigravity Companion` runtime profile.
3. In `Settings`, choose the trusted connector and select that deployed agent in the pairing dropdown.
4. Generate pairing.
5. Run the copied command:

```powershell
npm run pair:antigravity-companion -- --pairing-code ABCD-EFGH --relay-url http://localhost:3000
```

6. Install the companion into Antigravity:

```powershell
npm run install:antigravity-companion
```

7. Restart Antigravity.
8. Run `Code Shepherd: Connect Antigravity Companion`.

## Session File

The pairing command stores the session here:

`%USERPROFILE%\.code-shepherd\antigravity-companion-session.json`

After that, the extension can reconnect without a new pairing code until the access token expires or is rotated.

## Reply Flow

When a new Shepherd task arrives inside Antigravity:

- it appears in the `Shepherd` activity bar panel
- you can reply with:
  - `Code Shepherd: Reply to Task with Input`
  - `Code Shepherd: Reply to Task with Active Selection`

Those replies are posted back into the same Code Shepherd conversation.

## Current Limitation

This companion gives Antigravity a real reply path back into Shepherd, but it does not yet auto-capture Antigravity's built-in AI chat output. The current healthy path is companion-assisted round-trip, not invisible background extraction of internal Antigravity chat state.
