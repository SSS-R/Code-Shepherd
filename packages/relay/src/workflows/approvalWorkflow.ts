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

export interface ApprovalResolution {
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  decision: 'approved' | 'rejected' | 'timeout';
  decision_reason: string;
  decidedBy: string;
}

// Define decision signal
export const decisionSignal = defineSignal<[DecisionSignalPayload]>('decision');
export const resumeSignal = defineSignal<[]>('resume');

export function resolveApprovalOutcome(params: {
  decisionReceived: boolean;
  resumeRequested: boolean;
  timeoutMs: number;
  decision: 'approved' | 'rejected' | 'timeout';
  decision_reason: string;
  decidedBy: string;
}): ApprovalResolution {
  const {
    decisionReceived,
    resumeRequested,
    timeoutMs,
    decision,
    decision_reason,
    decidedBy,
  } = params;

  if (!decisionReceived && !resumeRequested) {
    return {
      status: 'timeout',
      decision: 'timeout',
      decision_reason: `Approval request timed out after ${Math.round(timeoutMs / 60000)} minutes`,
      decidedBy: 'system-timeout',
    };
  }

  if (resumeRequested && !decisionReceived) {
    return {
      status: 'pending',
      decision: 'timeout',
      decision_reason: 'Workflow resumed without a final approval decision',
      decidedBy: 'manual-resume',
    };
  }

  return {
    status: decision,
    decision,
    decision_reason,
    decidedBy,
  };
}

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

  const resolution = resolveApprovalOutcome({
    decisionReceived: decisionArrived && decisionReceived,
    resumeRequested,
    timeoutMs,
    decision,
    decision_reason,
    decidedBy,
  });

  state.status = resolution.status;
  state.decidedBy = resolution.decidedBy;
  state.decision_reason = resolution.decision_reason;

  // Update approval status in database
  await updateApprovalStatus(
    state.approvalId,
    resolution.status,
    resolution.decision,
    resolution.decision_reason,
    resolution.decidedBy
  );
}
