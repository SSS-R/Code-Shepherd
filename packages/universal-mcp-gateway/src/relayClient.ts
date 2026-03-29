import type { GatewayAdapter, GatewayConfig, GatewayReply, RelayCommandEnvelope, ApprovalDraft, GatewayLogger, ConnectorPairExchangeResponse } from './types'

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class UniversalGatewayRelayClient {
    constructor(
        private readonly config: GatewayConfig,
        private readonly logger: GatewayLogger,
    ) {}

    async registerAgent(adapter: GatewayAdapter): Promise<void> {
        await this.request('/agents/register', {
            method: 'POST',
            body: JSON.stringify({
                id: this.config.agentId,
                name: this.config.agentName,
                capabilities: this.config.agentCapabilities.length ? this.config.agentCapabilities : adapter.defaultCapabilities,
                connector_id: this.config.connectorId,
                adapter_id: adapter.id,
                runtime_transport: adapter.runtimeTransport,
            }),
        }, false)

        this.logger.info('Registered gateway agent with relay', {
            agentId: this.config.agentId,
            adapter: adapter.id,
        })
    }

    async heartbeat(): Promise<void> {
        await this.request(`/agents/${encodeURIComponent(this.config.agentId)}/heartbeat`, {
            method: 'POST',
        }, false)
    }

    async pollCommands(): Promise<RelayCommandEnvelope[]> {
        return this.request<RelayCommandEnvelope[]>(`/conversations/commands/poll?agent_id=${encodeURIComponent(this.config.agentId)}`, {
            method: 'GET',
        }, true)
    }

    async ackCommand(commandId: string): Promise<void> {
        await this.request(`/conversations/commands/${encodeURIComponent(commandId)}/ack`, {
            method: 'POST',
        }, true)
    }

    async sendReply(conversationId: string, commandId: string, reply: GatewayReply): Promise<void> {
        await this.request(`/conversations/${encodeURIComponent(conversationId)}/replies`, {
            method: 'POST',
            body: JSON.stringify({
                agent_id: this.config.agentId,
                content: reply.content,
                message_type: reply.messageType ?? 'text',
                command_id: commandId,
                metadata: reply.metadata,
            }),
        }, true)
    }

    async createApproval(command: RelayCommandEnvelope, approval: ApprovalDraft): Promise<void> {
        await this.request('/approvals', {
            method: 'POST',
            body: JSON.stringify({
                id: createId('approval'),
                agent_id: this.config.agentId,
                conversation_id: command.conversation_id,
                command_id: command.id,
                action_type: approval.action_type,
                action_details: approval.action_details,
                risk_level: approval.risk_level,
                risk_reason: approval.risk_reason,
            }),
        }, true)
    }

    async exchangePairingCode(pairingCode: string, machineLabel?: string): Promise<ConnectorPairExchangeResponse> {
        return this.request<ConnectorPairExchangeResponse>('/connectors/pair/exchange', {
            method: 'POST',
            body: JSON.stringify({
                pairing_code: pairingCode,
                machine_label: machineLabel,
            }),
        }, false)
    }

    private async request<T = unknown>(path: string, init: RequestInit, connectorAuth: boolean): Promise<T> {
        const headers = new Headers(init.headers)
        headers.set('Content-Type', 'application/json')

        if (connectorAuth) {
            if (this.config.connectorAccessToken) {
                headers.set('x-connector-access-token', this.config.connectorAccessToken)
            } else {
                headers.set('x-connector-id', this.config.connectorId)
                headers.set('x-connector-secret', this.config.connectorSecret ?? '')
            }
        }

        const response = await fetch(`${this.config.relayUrl}${path}`, {
            ...init,
            headers,
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Relay request failed (${response.status}) on ${path}: ${text}`)
        }

        if (response.status === 204) {
            return undefined as T
        }

        return response.json() as Promise<T>
    }
}
