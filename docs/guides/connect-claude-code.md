# Connect Claude Code to Code Shepherd

Bridge a local Claude Code CLI into Code Shepherd so commands sent from the Inbox run
headlessly through `claude -p` and replies land back in the conversation thread.

## Prerequisites

- Claude Code CLI installed and authenticated on the machine (`claude --version` works)
- Code Shepherd relay reachable from that machine

## Steps

1. **Trust a connector** in Settings (adapter kind `bridge`, transport `mcp`).
2. **Create a pairing session** for the connector with:
   - `adapter_id`: `claude-code-proxy`
   - `agent_id` / `agent_name`: e.g. `claude-code-bridge` / `Claude Code Bridge`
3. **Run the launch command** shown in Settings on the machine that hosts Claude Code:

   ```bash
   npm run start:gateway -- --pairing-code <CODE> --relay-url <URL> --adapter-id claude-code-proxy
   ```

4. The gateway exchanges the pairing code, registers the agent, and starts polling.
   Send a message to the agent from the Inbox to verify the round trip.

## Configuration

| Setting | CLI flag / env | Default |
|---|---|---|
| CLI path | `--claude-path` / `CLAUDE_CLI_PATH` | auto-detect (`~/.local/bin/claude[.exe]`, then PATH) |
| Model | `--claude-model` / `CLAUDE_MODEL` (or per-message `selected_model`) | runtime default |
| Permission mode | `--claude-permission-mode` / `CLAUDE_PERMISSION_MODE` | `default` |
| Timeout | `CLAUDE_TIMEOUT_MS` | 600000 (10 min) |
| Extra args | `CLAUDE_EXTRA_ARGS` (JSON array or CSV) | none |
| Working dir | `UPSTREAM_AGENT_WORKDIR` | gateway cwd |

## Permission modes and safety

`default` means Claude Code cannot use tools that require interactive approval in headless
mode — good for Q&A, analysis, and read-only tasks. For tasks that edit files, set
`--claude-permission-mode acceptEdits` deliberately, and prefer pointing
`UPSTREAM_AGENT_WORKDIR` at a scratch checkout or worktree. Never use `bypassPermissions`
on a machine with anything you care about.

## Reply metadata

Each reply carries `claude_session_id`, `num_turns`, `total_cost_usd`, and token `usage`
so cost tracking and (future) session resume are possible from the relay side.
