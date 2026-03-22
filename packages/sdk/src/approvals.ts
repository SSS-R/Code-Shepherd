import { ApprovalActionDetails, ApprovalDecisionResponse, RiskLevel, WaitForApprovalOptions } from '@code-shepherd/shared';
import { CodeShepherdClient } from './client';

export interface RequestApprovalOptions {
    action_type: string;
    action_details: ApprovalActionDetails;
    risk_level?: RiskLevel;
    risk_reason?: string;
    agent_id?: string;
    id?: string;
}

export async function requestApprovalAndWait(
    client: CodeShepherdClient,
    approval: RequestApprovalOptions,
    waitOptions?: WaitForApprovalOptions
): Promise<ApprovalDecisionResponse> {
    const createdApproval = await client.requestApproval(approval);
    return client.waitForApprovalDecision(createdApproval.id, waitOptions);
}
