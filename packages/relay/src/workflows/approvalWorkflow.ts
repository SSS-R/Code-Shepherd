/**
 * Temporal Workflow: Approval Request Management
 * 
 * Manages approval request state and waits for human decision
 * via Temporal Signals.
 */

import { 
  proxyActivities, 
  sleep,
  defineSignal,
  setHandler
} from '@temporalio/workflow';
import type * as activities from '../activities/index';

const { updateApprovalStatus } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute'
});

export interface ApprovalState {
  approvalId: string;
  agentId: string;
  action_type: string;
  action_details: Record<string, unknown>;
  risk_level: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  decidedBy?: string;
  decision_reason?: string;
}

export interface DecisionSignalPayload {
  decision: 'approved' | 'rejected';
  decision_reason: string;
  decidedBy: string;
}

// Define decision signal
export const decisionSignal = defineSignal<[DecisionSignalPayload]>('decision');

/**
 * Approval Request Workflow
 * 
 * This workflow waits for a human decision signal.
 * It can timeout after a configurable period (default: 24 hours).
 */
export async function approvalRequestWorkflow(
  state: ApprovalState
): Promise<void> {
  let decisionReceived = false;
  let decision: 'approved' | 'rejected' | 'timeout' = 'timeout';
  let decision_reason = '';
  let decidedBy = '';

  // Set up decision signal handler within workflow body
  setHandler(decisionSignal, (payload: DecisionSignalPayload): void => {
    decisionReceived = true;
    decision = payload.decision;
    decision_reason = payload.decision_reason;
    decidedBy = payload.decidedBy;
  });

  // Wait for decision or timeout (24 hours)
  await sleep(86400000); // 24 hours

  // If no decision received, mark as timeout
  if (!decisionReceived) {
    state.status = 'timeout';
    decision = 'timeout';
    decision_reason = 'Approval request timed out after 24 hours';
  } else {
    state.status = decision;
    state.decidedBy = decidedBy;
    state.decision_reason = decision_reason;
  }

  // Update approval status in database
  await updateApprovalStatus(
    state.approvalId,
    state.status,
    decision,
    decision_reason,
    decidedBy
  );
}
