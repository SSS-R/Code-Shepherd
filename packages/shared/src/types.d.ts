export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CapabilityTier = 'monitor' | 'approval' | 'chat' | 'steering';
export type AgentConnectionStatus = 'online' | 'offline' | 'degraded' | 'connecting';
export type AdapterKind = 'native-ide' | 'mcp' | 'bridge' | 'direct-session' | 'custom';
export type AdapterTransport = 'http' | 'https' | 'websocket' | 'mcp' | 'stdio' | 'process' | 'direct';
export type AgentPresenceReason = 'registered' | 'heartbeat' | 'reconnected' | 'manual-offline' | 'machine-offline' | 'bridge-error';
export type MessageSenderType = 'user' | 'agent' | 'system';
export type MessageType = 'text' | 'command' | 'status' | 'approval-request' | 'approval-decision' | 'artifact' | 'event';
export type CommandStatus = 'queued' | 'sent' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ConversationStatus = 'active' | 'idle' | 'blocked' | 'resolved' | 'archived';
export type ApprovalPresentationMode = 'queue-and-thread' | 'thread-only' | 'queue-only';
export interface AgentCapabilityDescriptor {
    key: string;
    label?: string;
    description?: string;
    requiresApproval?: boolean;
    supported?: boolean;
}
export interface AgentAdapterDescriptor {
    id: string;
    kind: AdapterKind;
    name: string;
    vendor?: string;
    version?: string;
    transport: AdapterTransport;
    supportsMultipleAgents?: boolean;
    supportsDirectSession?: boolean;
    metadata?: Record<string, unknown>;
}
export interface AgentReconnectPolicy {
    heartbeatIntervalMs?: number;
    offlineAfterMs?: number;
    retryBackoffMs?: number[];
    requiresSourceMachineOnline: boolean;
}
export interface CapabilityNegotiation {
    requestedTier: CapabilityTier;
    grantedTier: CapabilityTier;
    availableCapabilities: AgentCapabilityDescriptor[];
    missingCapabilities?: string[];
    notes?: string | null;
}
export interface BridgeInstallStep {
    id: string;
    title: string;
    description: string;
    command?: string;
    optional?: boolean;
    platform?: 'windows' | 'macos' | 'linux' | 'cross-platform';
}
export interface ConnectorOnboardingFlow {
    connectorId: string;
    title: string;
    installMethod: 'plugin' | 'helper-process' | 'command' | 'mcp-config' | 'direct-session';
    requiresRestart?: boolean;
    steps: BridgeInstallStep[];
    verificationCommand?: string;
    docsUrl?: string;
}
export interface AgentConnectionProfile {
    sourceMachineLabel?: string;
    sourceMachineOnline?: boolean;
    workspacePath?: string;
    sessionId?: string;
    lastSeenAt?: string;
    metadata?: Record<string, unknown>;
}
export interface AgentRegistrationRequest {
    id: string;
    name: string;
    capabilities?: string[];
    capability_tier?: CapabilityTier;
    adapter?: AgentAdapterDescriptor;
    transport?: AdapterTransport;
    reconnect_policy?: AgentReconnectPolicy;
    connection_profile?: AgentConnectionProfile;
    labels?: string[];
    metadata?: Record<string, unknown>;
}
export interface AgentRegistrationResponse {
    id: string;
    name: string;
    capabilities: string[];
    capability_tier: CapabilityTier;
    status: AgentConnectionStatus;
    adapter?: AgentAdapterDescriptor;
    transport?: AdapterTransport;
    reconnect_policy?: AgentReconnectPolicy;
    connection_profile?: AgentConnectionProfile;
    labels?: string[];
    metadata?: Record<string, unknown>;
    message: string;
}
export interface AgentHeartbeatResponse {
    id: string;
    status: Extract<AgentConnectionStatus, 'online' | 'degraded'>;
    sourceMachineOnline?: boolean;
    last_seen_at?: string;
    reason?: AgentPresenceReason;
    message: string;
}
export interface AgentRecord {
    id: string;
    name: string;
    status: AgentConnectionStatus;
    capability_tier: CapabilityTier;
    capabilities: string[];
    adapter?: AgentAdapterDescriptor;
    transport?: AdapterTransport;
    reconnect_policy?: AgentReconnectPolicy;
    connection_profile?: AgentConnectionProfile;
    negotiation?: CapabilityNegotiation;
    labels?: string[];
    metadata?: Record<string, unknown>;
    last_heartbeat?: string;
    created_at?: string;
    updated_at?: string;
}
export interface ConversationRecord {
    id: string;
    agent_id: string;
    task_id?: string | null;
    title: string;
    status: ConversationStatus;
    participant_agent_ids?: string[];
    latest_message_preview?: string | null;
    last_message_at?: string | null;
    created_at: string;
    updated_at: string;
}
export interface MessageRecord {
    id: string;
    conversation_id: string;
    sender_type: MessageSenderType;
    sender_id: string;
    message_type: MessageType;
    content: string;
    command_id?: string | null;
    approval_id?: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
}
export interface CommandRecord {
    id: string;
    conversation_id: string;
    target_agent_id: string;
    issued_by: string;
    content: string;
    status: CommandStatus;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface ApprovalActionDetails {
    path?: string;
    old_content?: string;
    new_content?: string;
    content?: string;
    command?: string;
    method?: string;
    url?: string;
    [key: string]: unknown;
}
export interface ApprovalRequestPayload {
    id: string;
    agent_id: string;
    action_type: string;
    action_details: ApprovalActionDetails;
    risk_level?: RiskLevel;
    risk_reason?: string;
}
export interface ApprovalRecord {
    id: string;
    agent_id: string;
    conversation_id?: string | null;
    command_id?: string | null;
    action_type: string;
    summary: string | null;
    action_details: ApprovalActionDetails;
    risk_level: RiskLevel;
    risk_reason: string | null;
    presentation_mode?: ApprovalPresentationMode;
    status: 'pending' | 'approved' | 'rejected' | 'timeout';
    decision?: 'approved' | 'rejected' | 'timeout';
    decision_reason?: string | null;
    requested_at: string;
    decided_at?: string | null;
    diff?: string | null;
    is_new_file?: boolean;
}
export interface ApprovalDecisionPayload {
    decision: 'approved' | 'rejected';
    decision_reason?: string;
    decidedBy?: string;
}
export interface ApprovalDecisionResponse {
    id: string;
    status: 'approved' | 'rejected';
    decision: 'approved' | 'rejected';
    decision_reason?: string;
    message: string;
}
export interface CodeShepherdClientOptions {
    baseUrl: string;
    agentId?: string;
    adapter?: AgentAdapterDescriptor;
    heartbeatIntervalMs?: number;
    approvalPollIntervalMs?: number;
    fetchImpl?: typeof fetch;
}
export interface WaitForApprovalOptions {
    timeoutMs?: number;
    pollIntervalMs?: number;
}
export interface CodeShepherdRegistrationOptions {
    id?: string;
    name: string;
    capabilities?: string[];
    capabilityTier?: CapabilityTier;
    adapter?: AgentAdapterDescriptor;
    transport?: AdapterTransport;
    reconnectPolicy?: AgentReconnectPolicy;
    connectionProfile?: AgentConnectionProfile;
    labels?: string[];
    metadata?: Record<string, unknown>;
}
export interface SendAgentMessageRequest {
    conversation_id: string;
    target_agent_id: string;
    content: string;
    message_type?: Extract<MessageType, 'text' | 'command'>;
    metadata?: Record<string, unknown>;
}
export interface SendAgentMessageResponse {
    message: MessageRecord;
    command?: CommandRecord;
}
export interface CodeShepherdAdapterContext {
    relayBaseUrl: string;
    adapter: AgentAdapterDescriptor;
}
export interface CodeShepherdAdapter {
    descriptor: AgentAdapterDescriptor;
    onboarding?: ConnectorOnboardingFlow;
    reconnectPolicy?: AgentReconnectPolicy;
    registerAgent(input: CodeShepherdRegistrationOptions): Promise<AgentRegistrationRequest> | AgentRegistrationRequest;
    negotiateCapabilities?(requestedTier: CapabilityTier, capabilities: AgentCapabilityDescriptor[]): Promise<CapabilityNegotiation> | CapabilityNegotiation;
}
