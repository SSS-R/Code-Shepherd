import { CodeShepherdClient } from './client';

export function startAgentHeartbeat(client: CodeShepherdClient, intervalMs?: number, agentId?: string): () => void {
    client.startHeartbeat(agentId, intervalMs);
    return () => client.stopHeartbeat();
}
