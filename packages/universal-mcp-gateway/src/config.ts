import os from 'os'
import { readGatewaySession, resolveDefaultSessionFilePath } from './localSession'
import type { GatewayConfig } from './types'

function parseList(raw: string | undefined, fallback: string[] = []): string[] {
    if (!raw) return fallback
    return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseJsonArray(raw: string | undefined): string[] {
    if (!raw) return []

    try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
            return parsed.map((value) => String(value))
        }
    } catch {
        // fall back to CSV parsing below
    }

    return parseList(raw)
}

function parseNumber(raw: string | undefined, fallback: number): number {
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseCliArgs(argv: string[]): Record<string, string> {
    const parsed: Record<string, string> = {}

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]
        if (!token.startsWith('--')) {
            continue
        }

        const key = token.slice(2)
        const nextToken = argv[index + 1]
        if (nextToken && !nextToken.startsWith('--')) {
            parsed[key] = nextToken
            index += 1
        } else {
            parsed[key] = 'true'
        }
    }

    return parsed
}

export function loadGatewayConfig(): GatewayConfig {
    const argv = process.argv[1]?.startsWith('--') ? process.argv.slice(1) : process.argv.slice(2)
    const cli = parseCliArgs(argv)
    const sessionFilePath = cli['session-file'] ?? process.env.GATEWAY_SESSION_FILE ?? resolveDefaultSessionFilePath()
    const savedSession = readGatewaySession(sessionFilePath)

    return {
        relayUrl: (cli['relay-url'] ?? process.env.RELAY_URL ?? savedSession?.relayUrl ?? 'http://localhost:3000').replace(/\/$/, ''),
        connectorId: cli['connector-id'] ?? process.env.CONNECTOR_ID ?? savedSession?.connectorId ?? '',
        connectorSecret: process.env.CONNECTOR_SECRET?.trim() || savedSession?.connectorSecret,
        connectorAccessToken: process.env.CONNECTOR_ACCESS_TOKEN?.trim() || savedSession?.connectorAccessToken,
        agentId: cli['agent-id'] ?? (process.env.AGENT_ID?.trim() || savedSession?.agentId || 'codex-mcp-bridge'),
        agentName: cli['agent-name'] ?? (process.env.AGENT_NAME?.trim() || savedSession?.agentName || 'Codex MCP Bridge'),
        agentCapabilities: parseList(process.env.AGENT_CAPABILITIES, savedSession?.agentCapabilities ?? ['mcp', 'bridge', 'chat']),
        adapterId: cli['adapter-id'] ?? (process.env.GATEWAY_ADAPTER?.trim() || savedSession?.adapterId || 'mock-echo'),
        heartbeatIntervalMs: parseNumber(process.env.HEARTBEAT_INTERVAL_MS, 30_000),
        commandPollIntervalMs: parseNumber(process.env.COMMAND_POLL_INTERVAL_MS, 2_000),
        upstreamCommand: process.env.UPSTREAM_AGENT_COMMAND?.trim() || savedSession?.upstreamCommand || undefined,
        upstreamArgs: process.env.UPSTREAM_AGENT_ARGS ? parseJsonArray(process.env.UPSTREAM_AGENT_ARGS) : (savedSession?.upstreamArgs ?? []),
        upstreamWorkdir: process.env.UPSTREAM_AGENT_WORKDIR?.trim() || savedSession?.upstreamWorkdir || undefined,
        pairingCode: cli['pairing-code'] ?? process.env.PAIRING_CODE ?? undefined,
        machineLabel: cli['machine-label'] ?? process.env.MACHINE_LABEL ?? savedSession?.machineLabel ?? os.hostname(),
        sessionFilePath,
        codexCliPath: cli['codex-path'] ?? process.env.CODEX_CLI_PATH?.trim() ?? savedSession?.codexCliPath ?? undefined,
        codexModel: cli['codex-model'] ?? process.env.CODEX_MODEL?.trim() ?? savedSession?.codexModel ?? undefined,
        codexProfile: cli['codex-profile'] ?? process.env.CODEX_PROFILE?.trim() ?? savedSession?.codexProfile ?? undefined,
        codexSandboxMode: (cli['codex-sandbox'] ?? process.env.CODEX_SANDBOX?.trim() ?? savedSession?.codexSandboxMode ?? 'workspace-write') as GatewayConfig['codexSandboxMode'],
        codexExtraArgs: process.env.CODEX_EXTRA_ARGS ? parseJsonArray(process.env.CODEX_EXTRA_ARGS) : (savedSession?.codexExtraArgs ?? []),
        antigravityCliPath: cli['antigravity-path'] ?? process.env.ANTIGRAVITY_CLI_PATH?.trim() ?? savedSession?.antigravityCliPath ?? undefined,
        antigravityMode: cli['antigravity-mode'] ?? process.env.ANTIGRAVITY_MODE?.trim() ?? savedSession?.antigravityMode ?? 'agent',
    }
}
