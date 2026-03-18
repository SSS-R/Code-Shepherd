/**
 * Temporal Workflow: Agent Session Management
 * 
 * Manages agent session state and marks agents offline
 * if no heartbeat is received within 90 seconds.
 */

import { 
  proxyActivities, 
  sleep,
  defineSignal,
  setHandler
} from '@temporalio/workflow';
import type * as activities from '../activities';

const { markAgentOffline } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute'
});

export interface AgentSessionState {
  agentId: string;
  name: string;
  status: 'online' | 'offline';
  lastHeartbeat: string;
  heartbeatCount: number;
}

export interface HeartbeatSignal {
  timestamp: string;
}

// Define heartbeat signal
export const heartbeatSignal = defineSignal<HeartbeatSignal>('heartbeat');

/**
 * Agent Session Workflow
 * 
 * This workflow runs for the lifetime of an agent session.
 * It waits for heartbeat signals and marks the agent offline
 * if no heartbeat is received within 90 seconds.
 */
export async function agentSessionWorkflow(
  state: AgentSessionState
): Promise<void> {
  let heartbeatReceived = false;

  // Set up heartbeat signal handler
  setHandler(heartbeatSignal, (payload: HeartbeatSignal) => {
    heartbeatReceived = true;
    state.lastHeartbeat = payload.timestamp;
    state.heartbeatCount += 1;
  });

  // Main loop: wait for heartbeat or timeout
  while (true) {
    heartbeatReceived = false;

    // Wait up to 90 seconds for a heartbeat
    await sleep(90000); // 90 seconds

    // If no heartbeat received, mark agent offline
    if (!heartbeatReceived) {
      state.status = 'offline';
      
      // Call activity to update database
      await markAgentOffline(state.agentId);
      
      // Workflow ends when agent goes offline
      return;
    }

    // Heartbeat received, continue monitoring
  }
}
