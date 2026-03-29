# Connect Codex

This guide is for a first-time Code Shepherd user who wants to connect a local Codex bridge so they can send chat messages and tasks from Code Shepherd.

## What you need

- Code Shepherd relay running
- Code Shepherd UI running
- a trusted connector in Settings
- a deployed agent record in Agents
- the universal MCP gateway package from this repo
- Codex installed and logged in on the same PC that will run the gateway

## What the gateway does

The universal MCP gateway is the middle layer between Code Shepherd and a real agent runtime.

Code Shepherd does not talk directly to your IDE session.
Instead, the gateway:

1. registers the agent with the relay
2. keeps heartbeats alive
3. polls conversation commands from Code Shepherd
4. forwards them to the local Codex CLI runtime
5. sends replies back into the Code Shepherd conversation thread
6. requests approvals when the upstream runtime asks for risky actions

## First-time pairing

From Code Shepherd Settings:

1. trust the connector
2. click `Generate Pairing`
3. copy the one-time launch command
4. run that command on the PC that hosts Codex

That command exchanges the pairing code for a helper-specific access token and stores the local gateway session automatically. The user does not need to edit env vars for the normal setup path.

If Codex is already installed normally, the `codex-proxy` adapter will try these paths automatically:

- `CODEX_CLI_PATH` if you explicitly set it
- a local copied binary at `commits/codex.exe`
- the Windows app alias at `%LOCALAPPDATA%\Microsoft\WindowsApps\codex.exe`
- `codex` or `codex.exe` on your system `PATH`

If auto-detection is not enough, you can still override the CLI path or behavior with optional env vars:

```powershell
$env:CODEX_CLI_PATH="C:\path\to\codex.exe"
$env:CODEX_SANDBOX="workspace-write"
$env:CODEX_MODEL="gpt-5.4"
$env:UPSTREAM_AGENT_WORKDIR="C:\path\to\your\repo"
```

If you want to confirm Codex is ready before pairing, run:

```powershell
codex login status
```

## Start the gateway

```powershell
npm run start:gateway -- --pairing-code XXXX-XXXX --relay-url http://localhost:3000
```

## What you should see

After the gateway starts:

- the `codex-mcp-bridge` agent should stay online in Agents
- new chat messages or commands for that agent will be polled by the gateway
- the gateway will run the task through local Codex
- replies will appear back inside Code Shepherd

## What happens after first pairing

The pairing code is one-time only.
After that first successful exchange, the gateway stores its local session and future reconnects are just:

```powershell
npm run start:gateway
```

## Current limitation

The Codex path is real now, but the approval handshake is still one-way on this integration.
Code Shepherd can already display and manage approvals at the platform level, but the Codex CLI path in this repo currently focuses on reliable task execution and returning Codex responses. Fine-grained Codex tool approval interception is still future bridge work.

That architecture is still what will let one universal gateway support Codex, OpenClaw, and other custom agents without forcing users to set up many unrelated MCP stacks.
