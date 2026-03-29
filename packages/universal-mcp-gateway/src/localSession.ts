import fs from 'fs'
import os from 'os'
import path from 'path'
import type { GatewayConfig } from './types'

export function resolveDefaultSessionFilePath(): string {
    return path.join(os.homedir(), '.code-shepherd', 'gateway-session.json')
}

export function readGatewaySession(sessionFilePath: string): Partial<GatewayConfig> | null {
    try {
        if (!fs.existsSync(sessionFilePath)) {
            return null
        }

        const raw = fs.readFileSync(sessionFilePath, 'utf8')
        return JSON.parse(raw) as Partial<GatewayConfig>
    } catch {
        return null
    }
}

export function writeGatewaySession(sessionFilePath: string, config: GatewayConfig): void {
    fs.mkdirSync(path.dirname(sessionFilePath), { recursive: true })
    fs.writeFileSync(sessionFilePath, JSON.stringify({
        relayUrl: config.relayUrl,
        connectorId: config.connectorId,
        connectorAccessToken: config.connectorAccessToken,
        agentId: config.agentId,
        agentName: config.agentName,
        agentCapabilities: config.agentCapabilities,
        adapterId: config.adapterId,
        heartbeatIntervalMs: config.heartbeatIntervalMs,
        commandPollIntervalMs: config.commandPollIntervalMs,
        upstreamCommand: config.upstreamCommand,
        upstreamArgs: config.upstreamArgs,
        upstreamWorkdir: config.upstreamWorkdir,
        machineLabel: config.machineLabel,
        codexCliPath: config.codexCliPath,
        codexModel: config.codexModel,
        codexProfile: config.codexProfile,
        codexSandboxMode: config.codexSandboxMode,
        codexExtraArgs: config.codexExtraArgs,
        antigravityCliPath: config.antigravityCliPath,
        antigravityMode: config.antigravityMode,
        sessionFilePath,
    }, null, 2), { mode: 0o600 })
}
