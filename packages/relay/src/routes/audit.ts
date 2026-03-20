/**
 * Audit Log API Routes
 * 
 * Endpoints:
 * - GET /agents/:id/timeline — Get agent's session timeline
 * - GET /audit-logs — List all audit logs (admin)
 */

import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';

interface TimelineEvent {
  id: number;
  event_type: string;
  event_details: Record<string, unknown>;
  agent_id: string | null;
  approval_id: string | null;
  timestamp: string;
  icon: string;
  category: 'tool' | 'approval' | 'system';
  status: 'success' | 'failure' | 'pending';
}

export function createAuditRoutes(db: Database): ReturnType<typeof require>['Router'] {
  const router = require('express').Router();
  router.use(requireAuth);

  /**
   * GET /agents/:id/timeline
   * Get chronological timeline of agent's actions
   */
  router.get('/:id/timeline', (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const { limit = 50 } = req.query as { limit?: string };

      const stmt = db.prepare(`
        SELECT * FROM audit_logs 
        WHERE agent_id = ? OR event_details LIKE ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      // Search for agent_id in agent_id column OR in event_details JSON
      const logs = stmt.all(id, `%${id}%`, Number(limit)) as TimelineEvent[];

      // Format events with icons and categories
      const timeline = logs.map((log): TimelineEvent => {
        const { icon, category, status } = categorizeEvent(log.event_type, log.event_details);

        return {
          ...log,
          event_details: typeof log.event_details === 'string'
            ? JSON.parse(log.event_details)
            : log.event_details,
          icon,
          category,
          status
        };
      });

      res.json(timeline);
    } catch (error: unknown) {
      console.error('Get timeline error:', error);
      res.status(500).json({ error: 'Failed to get agent timeline' });
    }
  });

  /**
   * GET /audit-logs
   * List all audit logs (admin endpoint)
   */
  router.get('/', requireRole(['Admin', 'Developer', 'Viewer']), (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query as { limit?: string };
      const stmt = db.prepare(`
        SELECT * FROM audit_logs 
        WHERE team_id IS ? OR team_id = ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      const logs = stmt.all(req.auth?.teamId ?? null, req.auth?.teamId ?? null, Number(limit)).map((log: any) => ({
        ...log,
        event_details: typeof log.event_details === 'string'
          ? JSON.parse(log.event_details)
          : log.event_details
      }));

      res.json(logs);
    } catch (error: unknown) {
      console.error('List audit logs error:', error);
      res.status(500).json({ error: 'Failed to list audit logs' });
    }
  });

  return router;
}

/**
 * Categorize event type for UI display
 */
function categorizeEvent(event_type: string, event_details: Record<string, unknown>): {
  icon: string;
  category: 'tool' | 'approval' | 'system';
  status: 'success' | 'failure' | 'pending';
} {
  // Approval events
  if (event_type === 'approval_requested') {
    return { icon: '📢', category: 'approval', status: 'pending' };
  }
  if (event_type === 'approval_decided') {
    const details = event_details as { decision?: string };
    return {
      icon: details.decision === 'approved' ? '✅' : '❌',
      category: 'approval',
      status: details.decision === 'approved' ? 'success' : 'failure'
    };
  }

  // Tool execution events
  if (event_type === 'tool_execution') {
    return { icon: '⚙️', category: 'tool', status: 'success' };
  }
  if (event_type === 'tool_error') {
    return { icon: '⚙️', category: 'tool', status: 'failure' };
  }

  // File operations
  if (event_type === 'file_read') {
    return { icon: '📝', category: 'tool', status: 'success' };
  }
  if (event_type === 'file_write') {
    return { icon: '📝', category: 'tool', status: 'success' };
  }
  if (event_type === 'file_delete') {
    return { icon: '📝', category: 'tool', status: 'success' };
  }

  // Command execution
  if (event_type === 'command_execute') {
    return { icon: '⚙️', category: 'tool', status: 'success' };
  }

  // Default
  return { icon: '📢', category: 'system', status: 'success' };
}
