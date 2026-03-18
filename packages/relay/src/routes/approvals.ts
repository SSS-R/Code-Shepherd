/**
 * Approval Queue API Routes
 * 
 * Endpoints:
 * - POST /approvals — Request approval for an action
 * - GET /approvals/pending — List pending approvals
 * - GET /approvals — List all approvals
 * - PATCH /approvals/:id — Approve or reject an approval
 */

import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { sendPushNotification } from './notifications';
import { getVapidKeys } from '../utils/vapidKeys';

export function createApprovalRoutes(db: Database): ReturnType<typeof require>['Router'] {
  const vapidKeys = getVapidKeys();
  const router = require('express').Router();

  // Initialize approvals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_details TEXT,
      risk_level TEXT DEFAULT 'medium',
      risk_reason TEXT,
      status TEXT DEFAULT 'pending',
      decision TEXT,
      decision_reason TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      decided_at DATETIME,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

  // Initialize audit_logs table (append-only)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_details TEXT,
      agent_id TEXT,
      approval_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /**
   * POST /approvals
   * Request approval for an action (agent-initiated)
   */
  router.post('/', (req: Request, res: Response) => {
    try {
      const { id, agent_id, action_type, action_details, risk_level, risk_reason } = req.body as {
        id: string;
        agent_id: string;
        action_type: string;
        action_details?: Record<string, unknown>;
        risk_level?: string;
        risk_reason?: string;
      };

      if (!id || !agent_id || !action_type) {
        return res.status(400).json({ error: 'id, agent_id, and action_type are required' });
      }

      // Insert approval request
      const stmt = db.prepare(`
        INSERT INTO approvals (id, agent_id, action_type, action_details, risk_level, risk_reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `);

      stmt.run(id, agent_id, action_type, JSON.stringify(action_details || {}), risk_level, risk_reason);

      // Log to audit trail
      const auditStmt = db.prepare(`
        INSERT INTO audit_logs (event_type, event_details, agent_id, approval_id)
        VALUES ('approval_requested', ?, ?, ?)
      `);
      auditStmt.run(JSON.stringify({ action_type, action_details }), agent_id, id);

      return res.status(201).json({
        id,
        agent_id,
        action_type,
        action_details: action_details || {},
        risk_level: risk_level || 'medium',
        risk_reason: risk_reason || null,
        status: 'pending',
        message: 'Approval request created'
      });
    } catch (error: unknown) {
      console.error('Create approval error:', error);
      return res.status(500).json({ error: 'Failed to create approval request' });
    }
  });

  /**
   * GET /approvals/pending
   * List all pending approvals
   */
  router.get('/pending', (req: Request, res: Response) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM approvals 
        WHERE status = 'pending' 
        ORDER BY requested_at ASC
      `);
      const approvals = stmt.all().map((approval: any): any => ({
        ...approval,
        action_details: JSON.parse(approval.action_details || '{}')
      }));

      return res.json(approvals);
    } catch (error: unknown) {
      console.error('List pending approvals error:', error);
      return res.status(500).json({ error: 'Failed to list pending approvals' });
    }
  });

  /**
   * GET /approvals
   * List all approvals (with optional status filter)
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const { status } = req.query as { status?: string };
      const params: unknown[] = [];

      let query = 'SELECT * FROM approvals';

      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY requested_at DESC';

      const stmt = db.prepare(query);
      const approvals = stmt.all(...params).map((approval: any): any => ({
        ...approval,
        action_details: JSON.parse(approval.action_details || '{}')
      }));

      return res.json(approvals);
    } catch (error: unknown) {
      console.error('List approvals error:', error);
      return res.status(500).json({ error: 'Failed to list approvals' });
    }
  });

  /**
   * GET /approvals/:id
   * Get a specific approval
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const stmt = db.prepare('SELECT * FROM approvals WHERE id = ?');
      const approval = stmt.get(id) as any;

      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      return res.json({
        ...approval,
        action_details: JSON.parse(approval.action_details || '{}')
      });
    } catch (error: unknown) {
      console.error('Get approval error:', error);
      return res.status(500).json({ error: 'Failed to get approval' });
    }
  });

  /**
   * PATCH /approvals/:id
   * Approve or reject an approval (human decision)
   */
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const { decision, decision_reason } = req.body as { decision: string; decision_reason: string };

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
      }

      // Update approval status
      const stmt = db.prepare(`
        UPDATE approvals 
        SET status = ?, decision = ?, decision_reason = ?, decided_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'
      `);

      const result = stmt.run(decision === 'approved' ? 'approved' : 'rejected', decision, decision_reason, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Approval not found or already decided' });
      }

      // Log to audit trail
      const auditStmt = db.prepare(`
        INSERT INTO audit_logs (event_type, event_details, approval_id)
        VALUES ('approval_decided', ?, ?)
      `);
      auditStmt.run(JSON.stringify({ decision, decision_reason }), id);

      return res.json({
        id,
        status: decision === 'approved' ? 'approved' : 'rejected',
        decision,
        decision_reason,
        message: `Approval ${decision}`
      });
    } catch (error: unknown) {
      console.error('Decide approval error:', error);
      return res.status(500).json({ error: 'Failed to decide approval' });
    }
  });

  /**
   * GET /audit-logs
   * List audit logs (append-only log of all actions)
   */
  router.get('/audit-logs', (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query as { limit?: string };
      const stmt = db.prepare(`
        SELECT * FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      const logs = stmt.all(Number(limit)).map((log: any): any => ({
        ...log,
        event_details: JSON.parse(log.event_details || '{}')
      }));

      return res.json(logs);
    } catch (error: unknown) {
      console.error('List audit logs error:', error);
      return res.status(500).json({ error: 'Failed to list audit logs' });
    }
  });

  return router;
}
