/**
 * Temporal.io Activities for CodeShepherd
 */

export async function processAgentTask(agentId: number, task: string): Promise<string> {
  // Simulate agent task processing
  console.log(`Processing task ${task} for agent ${agentId}`);
  return `Task ${task} completed for agent ${agentId}`;
}
