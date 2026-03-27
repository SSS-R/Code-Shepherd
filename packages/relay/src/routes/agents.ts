/**
 * Agent Registry API Routes
 * 
 * Endpoints:
 * - POST /agents/register — Register a new agent
 * - POST /agents/:id/heartbeat — Send heartbeat to keep agent alive
 * - GET /agents — List all agents with status
 */

import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { broadcastRealtimeEvent } from '../realtime';

export function createAgentRoutes(db: Database) {
  const router = require('express').Router();

  // Initialize agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capabilities TEXT,
      status TEXT DEFAULT 'online',
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /**
   * POST /agents/register
   * Register a new agent with the relay server
   */
  router.post('/register', (req: Request, res: Response) => {
    try {
      const { id, name, capabilities } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      // Insert or update agent record
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO agents (id, name, capabilities, status, last_heartbeat)
        VALUES (?, ?, ?, 'online', CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(id, name, JSON.stringify(capabilities || []));

      broadcastRealtimeEvent('agents.updated', { action: 'registered', agentId: id });

      return res.status(201).json({
        id,
        name,
        capabilities: capabilities || [],
        status: 'online',
        message: 'Agent registered successfully'
      });
    } catch (error: any) {
      console.error('Agent registration error:', error);
      return res.status(500).json({ error: 'Failed to register agent' });
    }
  });

  router.post('/', (req: Request, res: Response) => {
    try {
      const { id, name, capabilities = [], status = 'online' } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      db.prepare(`
        INSERT INTO agents (id, name, capabilities, status, last_heartbeat)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, name, JSON.stringify(capabilities), status);

      const created = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
      broadcastRealtimeEvent('agents.updated', { action: 'created', agentId: id });

      return res.status(201).json({
        ...created,
        capabilities: JSON.parse(created.capabilities || '[]')
      });
    } catch (error: any) {
      console.error('Create agent error:', error);
      return res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  /**
   * POST /agents/:id/heartbeat
   * Send heartbeat to keep agent alive (resets 90s timeout)
   */
  router.post('/:id/heartbeat', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Update last heartbeat timestamp
      const stmt = db.prepare(`
        UPDATE agents 
        SET last_heartbeat = CURRENT_TIMESTAMP, status = 'online'
        WHERE id = ?
      `);

      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      broadcastRealtimeEvent('agents.updated', { action: 'heartbeat', agentId: id });

      return res.json({
        id,
        status: 'online',
        message: 'Heartbeat received'
      });
    } catch (error: any) {
      console.error('Heartbeat error:', error);
      return res.status(500).json({ error: 'Failed to process heartbeat' });
    }
  });

  /**
   * GET /agents
   * List all agents with their current status
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const stmt = db.prepare('SELECT * FROM agents ORDER BY last_heartbeat DESC');
      const agents = stmt.all().map((agent: any) => ({
        ...agent,
        capabilities: JSON.parse(agent.capabilities || '[]')
      }));

      return res.json(agents);
    } catch (error: any) {
      console.error('List agents error:', error);
      return res.status(500).json({ error: 'Failed to list agents' });
    }
  });

  /**
   * GET /agents/:id
   * Get a specific agent's status
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
      const agent = stmt.get(id) as any;

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      return res.json({
        ...agent,
        capabilities: JSON.parse(agent.capabilities || '[]')
      });
    } catch (error: any) {
      console.error('Get agent error:', error);
      return res.status(500).json({ error: 'Failed to get agent' });
    }
  });

  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;

      if (!existing) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const {
        name = existing.name,
        capabilities = JSON.parse(existing.capabilities || '[]'),
        status = existing.status,
      } = req.body as { name?: string; capabilities?: string[]; status?: string };

      db.prepare(`
        UPDATE agents
        SET name = ?, capabilities = ?, status = ?, last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, JSON.stringify(capabilities), status, id);

      const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
      broadcastRealtimeEvent('agents.updated', { action: 'updated', agentId: id });

      return res.json({
        ...updated,
        capabilities: JSON.parse(updated.capabilities || '[]')
      });
    } catch (error: any) {
      console.error('Update agent error:', error);
      return res.status(500).json({ error: 'Failed to update agent' });
    }
  });

  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      broadcastRealtimeEvent('agents.updated', { action: 'deleted', agentId: id });
      return res.json({ id, message: 'Agent deleted' });
    } catch (error: any) {
      console.error('Delete agent error:', error);
      return res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  return router;
}
