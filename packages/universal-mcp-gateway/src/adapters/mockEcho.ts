import type { GatewayAdapter } from '../types'

export function createMockEchoAdapter(): GatewayAdapter {
    return {
        id: 'mock-echo',
        displayName: 'Mock Echo Adapter',
        runtimeTransport: 'mcp',
        defaultCapabilities: ['mcp', 'chat', 'bridge'],
        async handleCommand(command) {
            return {
                replies: [
                    {
                        content: `Mock gateway received: ${command.content}`,
                        messageType: 'text',
                        metadata: { adapter: 'mock-echo' },
                    },
                ],
            }
        },
    }
}
