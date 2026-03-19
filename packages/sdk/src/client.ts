import {
    AgentHeartbeatResponse,
    AgentOpsClientOptions,
    AgentOpsRegistrationOptions,
    AgentRegistrationResponse,
    ApprovalDecisionResponse,
    ApprovalRecord,
    ApprovalRequestPayload,
    WaitForApprovalOptions,
} from '@agentops/shared';

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class AgentOpsClient {
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;
    private readonly defaultHeartbeatIntervalMs: number;
    private readonly defaultApprovalPollIntervalMs: number;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private registeredAgentId: string | null;

    constructor(options: AgentOpsClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.defaultHeartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000;
        this.defaultApprovalPollIntervalMs = options.approvalPollIntervalMs ?? 2_000;
        this.registeredAgentId = options.agentId ?? null;
    }

    get agentId(): string | null {
        return this.registeredAgentId;
    }

    async register(options: AgentOpsRegistrationOptions): Promise<AgentRegistrationResponse> {
        const payload = {
            id: options.id ?? this.registeredAgentId ?? createId('agent'),
            name: options.name,
            capabilities: options.capabilities ?? [],
        };

        const response = await this.request<AgentRegistrationResponse>('/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        this.registeredAgentId = response.id;
        return response;
    }

    async heartbeat(agentId?: string): Promise<AgentHeartbeatResponse> {
        const resolvedAgentId = this.requireAgentId(agentId);
        return this.request<AgentHeartbeatResponse>(`/agents/${resolvedAgentId}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    }

    startHeartbeat(agentId?: string, intervalMs = this.defaultHeartbeatIntervalMs): void {
        const resolvedAgentId = this.requireAgentId(agentId);
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            void this.heartbeat(resolvedAgentId).catch((error: unknown) => {
                console.error('AgentOps heartbeat failed:', error);
            });
        }, intervalMs);
    }

    stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    async requestApproval(payload: Omit<ApprovalRequestPayload, 'agent_id' | 'id'> & { agent_id?: string; id?: string }): Promise<ApprovalRecord> {
        const requestPayload: ApprovalRequestPayload = {
            id: payload.id ?? createId('approval'),
            agent_id: payload.agent_id ?? this.requireAgentId(),
            action_type: payload.action_type,
            action_details: payload.action_details,
            risk_level: payload.risk_level,
            risk_reason: payload.risk_reason,
        };

        return this.request<ApprovalRecord>('/approvals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
        });
    }

    async getApproval(id: string): Promise<ApprovalRecord> {
        return this.request<ApprovalRecord>(`/approvals/${id}`, { method: 'GET' });
    }

    async waitForApprovalDecision(id: string, options: WaitForApprovalOptions = {}): Promise<ApprovalDecisionResponse> {
        const timeoutMs = options.timeoutMs ?? 5 * 60_000;
        const pollIntervalMs = options.pollIntervalMs ?? this.defaultApprovalPollIntervalMs;
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            const approval = await this.getApproval(id);
            if (approval.status === 'approved' || approval.status === 'rejected') {
                return {
                    id: approval.id,
                    status: approval.status,
                    decision: approval.status,
                    decision_reason: approval.decision_reason ?? undefined,
                    message: `Approval ${approval.status}`,
                };
            }

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error(`Timed out waiting for approval decision for ${id}`);
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AgentOps request failed (${response.status}): ${errorText}`);
        }

        return response.json() as Promise<T>;
    }

    private requireAgentId(agentId?: string): string {
        const resolvedAgentId = agentId ?? this.registeredAgentId;
        if (!resolvedAgentId) {
            throw new Error('Agent ID is required. Register the agent first or pass agentId explicitly.');
        }

        return resolvedAgentId;
    }
}
