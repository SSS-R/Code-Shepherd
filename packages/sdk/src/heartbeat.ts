import { AgentOpsClient } from './client';

export function startAgentHeartbeat(client: AgentOpsClient, intervalMs?: number, agentId?: string): () => void {
    client.startHeartbeat(agentId, intervalMs);
    return () => client.stopHeartbeat();
}
