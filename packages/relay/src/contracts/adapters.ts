import {
    AgentAdapterDescriptor,
    AgentConnectionProfile,
    AgentPresenceReason,
    AgentRecord,
    AgentReconnectPolicy,
    AdapterTransport,
    CapabilityNegotiation,
    CapabilityTier,
    CodeShepherdRegistrationOptions,
} from '@code-shepherd/shared';

export interface RelayAgentRegistrationInput {
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
    negotiation?: CapabilityNegotiation;
}

export interface BridgeHeartbeatContext {
    agentId: string;
    occurredAt: string;
    sourceMachineOnline: boolean;
    reason: AgentPresenceReason;
}

const DEFAULT_RECONNECT_POLICY: AgentReconnectPolicy = {
    heartbeatIntervalMs: 30_000,
    offlineAfterMs: 90_000,
    retryBackoffMs: [1_000, 5_000, 15_000],
    requiresSourceMachineOnline: true,
};

export function normalizeRelayAgentRegistration(input: RelayAgentRegistrationInput): AgentRecord {
    const transport = input.transport ?? input.adapter?.transport ?? 'http';
    const reconnectPolicy = {
        ...DEFAULT_RECONNECT_POLICY,
        ...input.reconnect_policy,
    };
    const now = new Date().toISOString();

    return {
        id: input.id,
        name: input.name,
        status: 'online',
        capability_tier: input.capability_tier ?? 'monitor',
        capabilities: input.capabilities ?? [],
        adapter: input.adapter,
        transport,
        reconnect_policy: reconnectPolicy,
        connection_profile: {
            sourceMachineOnline: true,
            ...input.connection_profile,
            lastSeenAt: input.connection_profile?.lastSeenAt ?? now,
        },
        labels: input.labels ?? [],
        metadata: input.metadata,
        negotiation: input.negotiation,
        last_heartbeat: now,
        created_at: now,
        updated_at: now,
    };
}

export function buildBridgeHeartbeatContext(
    agent: Pick<AgentRecord, 'id' | 'connection_profile'>,
    reason: AgentPresenceReason = 'heartbeat',
): BridgeHeartbeatContext {
    return {
        agentId: agent.id,
        occurredAt: new Date().toISOString(),
        sourceMachineOnline: agent.connection_profile?.sourceMachineOnline ?? true,
        reason,
    };
}

export function buildCapabilityNegotiationSummary(options: CodeShepherdRegistrationOptions): CapabilityNegotiation {
    const availableCapabilities = (options.capabilities ?? []).map((key) => ({
        key,
        supported: true,
    }));

    return {
        requestedTier: options.capabilityTier ?? 'monitor',
        grantedTier: options.capabilityTier ?? 'monitor',
        availableCapabilities,
        missingCapabilities: [],
        notes: null,
    };
}
