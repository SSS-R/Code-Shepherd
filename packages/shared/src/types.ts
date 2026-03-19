export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgentRegistrationRequest {
    id: string;
    name: string;
    capabilities?: string[];
}

export interface AgentRegistrationResponse {
    id: string;
    name: string;
    capabilities: string[];
    status: 'online' | 'offline';
    message: string;
}

export interface AgentHeartbeatResponse {
    id: string;
    status: 'online';
    message: string;
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
    action_type: string;
    summary: string | null;
    action_details: ApprovalActionDetails;
    risk_level: RiskLevel;
    risk_reason: string | null;
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

export interface AgentOpsClientOptions {
    baseUrl: string;
    agentId?: string;
    heartbeatIntervalMs?: number;
    approvalPollIntervalMs?: number;
    fetchImpl?: typeof fetch;
}

export interface WaitForApprovalOptions {
    timeoutMs?: number;
    pollIntervalMs?: number;
}

export interface AgentOpsRegistrationOptions {
    id?: string;
    name: string;
    capabilities?: string[];
}
