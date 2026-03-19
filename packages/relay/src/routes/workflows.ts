/**
 * Workflows API Routes
 * 
 * Endpoints:
 * - GET /workflows — List all active/pending workflows from Temporal
 */

import { Request, Response } from 'express';
import { WorkflowClient } from '@temporalio/client';

interface WorkflowInfo {
  workflowId: string;
  workflowType: string;
  status: 'running' | 'waiting' | 'pending';
  waitingSince?: string;
  agentId?: string;
  description: string;
}

export function createWorkflowRoutes(client: WorkflowClient | null): ReturnType<typeof require>['Router'] {
  const router = require('express').Router();

  /**
   * GET /workflows
   * List all active workflows from Temporal
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      if (!client) {
        return res.json([]);
      }

      // Query Temporal for open workflows
      const response = await client.connection.workflowService.listOpenWorkflowExecutions({
        namespace: 'default',
        maximumPageSize: 10,
      });

      const workflows: WorkflowInfo[] = (response.executions || []).map(execution => {
        const type = execution.type?.name || 'Unknown';
        const id = execution.execution?.workflowId || 'unknown';
        const startTime = execution.startTime ? new Date(Number(execution.startTime.seconds) * 1000).toISOString() : undefined;

        return {
          workflowId: id,
          workflowType: type,
          status: 'running', // Temporal listOpen shows running/pending
          waitingSince: startTime,
          description: getWorkflowDescription(type, id)
        };
      });

      return res.json(workflows);
    } catch (error: unknown) {
      console.error('Get workflows error:', error);
      // Fallback to empty if cluster is down to prevent UI crash
      return res.json([]);
    }
  });

  router.post('/:id/resume', async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      if (!client) {
        return res.status(503).json({ error: 'Temporal client unavailable' });
      }

      const handle = client.getHandle(id);
      await handle.signal('resume');

      return res.json({ id, message: 'Resume signal sent' });
    } catch (error: unknown) {
      console.error('Resume workflow error:', error);
      return res.status(500).json({ error: 'Failed to resume workflow' });
    }
  });

  return router;
}

function getWorkflowDescription(type: string, id: string): string {
  if (type === 'ApprovalWorkflow') return 'Waiting for human interaction or timeout';
  if (type === 'AgentSessionWorkflow') return 'Active agent control session';
  return `Execution of ${type} workflow`;
}
