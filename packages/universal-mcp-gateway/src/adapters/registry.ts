import type { GatewayAdapter, GatewayConfig } from '../types'
import { createAntigravityCliAdapter } from './antigravityCli'
import { createCommandRunnerAdapter } from './commandRunner'
import { createCodexCliAdapter } from './codexCli'
import { createMockEchoAdapter } from './mockEcho'

export function createGatewayAdapter(config: GatewayConfig): GatewayAdapter {
    switch (config.adapterId) {
        case 'codex-proxy':
            return createCodexCliAdapter()
        case 'antigravity-proxy':
            return createAntigravityCliAdapter()
        case 'openclaw-proxy':
            return createCommandRunnerAdapter({
                id: 'openclaw-proxy',
                displayName: 'OpenClaw Proxy Adapter',
                defaultCapabilities: ['mcp', 'openclaw', 'chat', 'bridge'],
            })
        case 'command-runner':
            return createCommandRunnerAdapter({
                id: 'command-runner',
                displayName: 'Generic Command Runner Adapter',
                defaultCapabilities: ['mcp', 'chat', 'bridge'],
            })
        case 'mock-echo':
        default:
            return createMockEchoAdapter()
    }
}
