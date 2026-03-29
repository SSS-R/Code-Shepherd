import type { MessageType, RiskLevel } from '@code-shepherd/shared'

export interface GatewayConfig {
    relayUrl: string
    connectorId: string
    connectorSecret?: string
    connectorAccessToken?: string
    agentId: string
    agentName: string
    agentCapabilities: string[]
    adapterId: string
    heartbeatIntervalMs: number
    commandPollIntervalMs: number
    upstreamCommand?: string
    upstreamArgs: string[]
    upstreamWorkdir?: string
    pairingCode?: string
    machineLabel?: string
    sessionFilePath?: string
    codexCliPath?: string
    codexModel?: string
    codexProfile?: string
    codexSandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access'
    codexExtraArgs: string[]
    antigravityCliPath?: string
    antigravityMode?: string
}

export interface RelayCommandEnvelope {
    id: string
    conversation_id: string
    target_agent_id: string
    content: string
    metadata?: Record<string, unknown>
    created_at: string
}

export interface GatewayReply {
    content: string
    messageType?: Extract<MessageType, 'text' | 'status' | 'artifact' | 'event'>
    metadata?: Record<string, unknown>
}

export interface ApprovalDraft {
    action_type: string
    action_details: Record<string, unknown>
    risk_level?: RiskLevel
    risk_reason?: string
}

export interface AdapterExecutionResult {
    replies: GatewayReply[]
    approvals?: ApprovalDraft[]
}

export interface GatewayLogger {
    info: (message: string, meta?: Record<string, unknown>) => void
    warn: (message: string, meta?: Record<string, unknown>) => void
    error: (message: string, meta?: Record<string, unknown>) => void
    debug: (message: string, meta?: Record<string, unknown>) => void
}

export interface GatewayAdapterContext {
    config: GatewayConfig
    logger: GatewayLogger
}

export interface GatewayAdapter {
    id: string
    displayName: string
    runtimeTransport: string
    defaultCapabilities: string[]
    handleCommand: (command: RelayCommandEnvelope, context: GatewayAdapterContext) => Promise<AdapterExecutionResult>
}

export interface ConnectorPairExchangeResponse {
    relay_url: string
    connector_id: string
    connector_name: string
    connector_access_token: string
    connector_access_token_expires_at: string
    scopes: string[]
    agent: {
        id: string
        name: string
        adapter_id: string
        capabilities: string[]
        transport: string
        adapter_kind: string
    }
}
