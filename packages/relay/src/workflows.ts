/**
 * Temporal.io Workflows for CodeShepherd
 */

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
export { approvalRequestWorkflow, decisionSignal, resumeSignal } from './workflows/approvalWorkflow';

const { processAgentTask } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute'
});

export async function agentWorkflow(agentId: number, task: string): Promise<string> {
  return await processAgentTask(agentId, task);
}
