import { ApprovalActionDetails, ApprovalDecisionResponse, RiskLevel, WaitForApprovalOptions } from '@agentops/shared';
import { AgentOpsClient } from './client';

export interface RequestApprovalOptions {
    action_type: string;
    action_details: ApprovalActionDetails;
    risk_level?: RiskLevel;
    risk_reason?: string;
    agent_id?: string;
    id?: string;
}

export async function requestApprovalAndWait(
    client: AgentOpsClient,
    approval: RequestApprovalOptions,
    waitOptions?: WaitForApprovalOptions
): Promise<ApprovalDecisionResponse> {
    const createdApproval = await client.requestApproval(approval);
    return client.waitForApprovalDecision(createdApproval.id, waitOptions);
}
