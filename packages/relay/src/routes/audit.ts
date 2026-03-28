/**
 * Audit Log API Routes
 *
 * Endpoints:
 * - GET /agents/:id/timeline - Get agent's session timeline
 * - GET /audit-logs - List all audit logs (admin)
 */

import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';

export interface TimelineEvent {
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

function normalizeEventDetails(eventDetails: unknown): Record<string, unknown> {
  if (!eventDetails) {
    return {};
  }

  if (typeof eventDetails === 'string') {
    try {
      return JSON.parse(eventDetails) as Record<string, unknown>;
    } catch {
      return { raw: eventDetails };
    }
  }

  return eventDetails as Record<string, unknown>;
}

export function categorizeEvent(eventType: string, eventDetails: Record<string, unknown>): {
  icon: string;
  category: 'tool' | 'approval' | 'system';
  status: 'success' | 'failure' | 'pending';
} {
  if (eventType === 'approval_requested') {
    return { icon: 'notice', category: 'approval', status: 'pending' };
  }

  if (eventType === 'approval_decided') {
    const details = eventDetails as { decision?: string };
    return {
      icon: details.decision === 'approved' ? 'approved' : 'rejected',
      category: 'approval',
      status: details.decision === 'approved' ? 'success' : 'failure',
    };
  }

  if (eventType === 'tool_execution' || eventType === 'command_execute') {
    return { icon: 'terminal', category: 'tool', status: 'success' };
  }

  if (eventType === 'tool_error') {
    return { icon: 'terminal', category: 'tool', status: 'failure' };
  }

  if (eventType === 'file_read' || eventType === 'file_write' || eventType === 'file_delete') {
    return { icon: 'file', category: 'tool', status: 'success' };
  }

  if (eventType === 'task_assignment_created') {
    return { icon: 'task', category: 'system', status: 'success' };
  }

  if (eventType === 'agent_reply_received' || eventType === 'guide_reply_generated') {
    return { icon: 'message', category: 'system', status: 'success' };
  }

  if (eventType === 'connector_trusted') {
    return { icon: 'connector', category: 'system', status: 'success' };
  }

  if (eventType === 'connector_revoked') {
    return { icon: 'connector', category: 'system', status: 'failure' };
  }

  if (eventType === 'guide_feedback_recorded') {
    return { icon: 'feedback', category: 'system', status: 'success' };
  }

  if (eventType.includes('error') || eventType.includes('failed') || eventType.includes('revoked')) {
    return { icon: 'alert', category: 'system', status: 'failure' };
  }

  return { icon: 'system', category: 'system', status: 'success' };
}

export function mapAuditLog(log: any): TimelineEvent {
  const eventDetails = normalizeEventDetails(log.event_details);
  const { icon, category, status } = categorizeEvent(log.event_type, eventDetails);

  return {
    id: log.id,
    event_type: log.event_type,
    event_details: eventDetails,
    agent_id: log.agent_id ?? null,
    approval_id: log.approval_id ?? null,
    timestamp: log.timestamp,
    icon,
    category,
    status,
  };
}

export function createAuditRoutes(db: Database): ReturnType<typeof require>['Router'] {
  const router = require('express').Router();
  router.use(requireAuth);

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

      const logs = stmt.all(id, `%${id}%`, Number(limit)) as any[];
      res.json(logs.map(mapAuditLog));
    } catch (error: unknown) {
      console.error('Get timeline error:', error);
      res.status(500).json({ error: 'Failed to get agent timeline' });
    }
  });

  router.get('/', requireRole(['Admin', 'Developer', 'Viewer']), (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query as { limit?: string };
      const stmt = db.prepare(`
        SELECT * FROM audit_logs
        WHERE team_id IS ? OR team_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      const logs = stmt.all(req.auth?.teamId ?? null, req.auth?.teamId ?? null, Number(limit)) as any[];
      res.json(logs.map(mapAuditLog));
    } catch (error: unknown) {
      console.error('List audit logs error:', error);
      res.status(500).json({ error: 'Failed to list audit logs' });
    }
  });

  return router;
}
