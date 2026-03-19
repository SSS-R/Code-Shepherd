/**
 * Temporal Workflow: Approval Request Management
 * 
 * Manages approval request state and waits for human decision
 * via Temporal Signals.
 */

import {
  proxyActivities,
  sleep,
  condition,
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
  timeoutMs?: number;
}

export interface DecisionSignalPayload {
  decision: 'approved' | 'rejected';
  decision_reason: string;
  decidedBy: string;
}

// Define decision signal
export const decisionSignal = defineSignal<[DecisionSignalPayload]>('decision');
export const resumeSignal = defineSignal<[]>('resume');

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
  let resumeRequested = false;
  const timeoutMs = state.timeoutMs ?? 24 * 60 * 60 * 1000;

  // Set up decision signal handler within workflow body
  setHandler(decisionSignal, (payload: DecisionSignalPayload): void => {
    decisionReceived = true;
    decision = payload.decision;
    decision_reason = payload.decision_reason;
    decidedBy = payload.decidedBy;
  });

  setHandler(resumeSignal, (): void => {
    resumeRequested = true;
  });

  const decisionArrived = await condition(() => decisionReceived || resumeRequested, timeoutMs);

  if (!decisionArrived) {
    state.status = 'timeout';
    decision = 'timeout';
    decision_reason = `Approval request timed out after ${Math.round(timeoutMs / 60000)} minutes`;
    decidedBy = 'system-timeout';
  } else if (resumeRequested && !decisionReceived) {
    state.status = 'pending';
    decision_reason = 'Workflow resumed without a final approval decision';
    decidedBy = 'manual-resume';
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
