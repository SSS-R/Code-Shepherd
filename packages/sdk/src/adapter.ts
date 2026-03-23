import {
    AgentAdapterDescriptor,
    AgentCapabilityDescriptor,
    CapabilityNegotiation,
    CapabilityTier,
    CodeShepherdAdapter,
    CodeShepherdRegistrationOptions,
    ConnectorOnboardingFlow,
} from '@code-shepherd/shared';

export interface AdapterRegistrationBlueprint {
    descriptor: AgentAdapterDescriptor;
    onboarding?: ConnectorOnboardingFlow;
    defaultTier?: CapabilityTier;
    capabilities?: AgentCapabilityDescriptor[];
}

function createRegistrationId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAdapterBlueprint(input: AdapterRegistrationBlueprint): CodeShepherdAdapter {
    return {
        descriptor: input.descriptor,
        onboarding: input.onboarding,
        registerAgent(options: CodeShepherdRegistrationOptions) {
            return {
                id: options.id ?? createRegistrationId('agent'),
                name: options.name,
                metadata: options.metadata,
                adapter: options.adapter ?? input.descriptor,
                capability_tier: options.capabilityTier ?? input.defaultTier ?? 'monitor',
                capabilities: options.capabilities ?? input.capabilities?.map((capability) => capability.key) ?? [],
                transport: options.transport ?? input.descriptor.transport,
                reconnect_policy: options.reconnectPolicy,
                connection_profile: options.connectionProfile,
                labels: options.labels,
            };
        },
        negotiateCapabilities(requestedTier: CapabilityTier): CapabilityNegotiation {
            const capabilities = input.capabilities ?? [];
            const grantedTier = requestedTier;

            return {
                requestedTier,
                grantedTier,
                availableCapabilities: capabilities,
                missingCapabilities: [],
                notes: null,
            };
        },
    };
}
