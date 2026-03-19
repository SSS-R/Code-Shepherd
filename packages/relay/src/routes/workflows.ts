/**
 * Workflows API Routes
 * 
 * Endpoints:
 * - GET /workflows — List all active/pending workflows from Temporal
 */

import { Request, Response } from 'express';

interface WorkflowInfo {
  workflowId: string;
  workflowType: string;
  status: 'running' | 'waiting' | 'pending';
  waitingSince?: string;
  agentId?: string;
  description: string;
}

export function createWorkflowRoutes(): ReturnType<typeof require>['Router'] {
  const router = require('express').Router();

  /**
   * GET /workflows
   * List all active workflows (mock data until Temporal integration)
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      // Mock data - will be replaced with actual Temporal client query
      const workflows: WorkflowInfo[] = [
        {
          workflowId: 'wf-approval-001',
          workflowType: 'ApprovalWorkflow',
          status: 'waiting',
          waitingSince: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          agentId: 'agent-001',
          description: 'Waiting for approval on file_write action'
        },
        {
          workflowId: 'wf-session-002',
          workflowType: 'AgentSessionWorkflow',
          status: 'running',
          agentId: 'agent-002',
          description: 'Agent session active, monitoring heartbeats'
        }
      ];

      res.json(workflows);
    } catch (error: unknown) {
      console.error('Get workflows error:', error);
      res.status(500).json({ error: 'Failed to get workflows' });
    }
  });

  return router;
}
