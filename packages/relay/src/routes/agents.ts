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
import { getRuntimeCatalogEntry } from '../runtimeCatalog';

export function createAgentRoutes(db: Database) {
  const router = require('express').Router();

  // Initialize agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capabilities TEXT,
      connector_id TEXT,
      adapter_id TEXT,
      runtime_transport TEXT,
      status TEXT DEFAULT 'online',
      terminated_at DATETIME,
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.exec('ALTER TABLE agents ADD COLUMN connector_id TEXT');
  } catch {
    // column already exists
  }

  try {
    db.exec('ALTER TABLE agents ADD COLUMN runtime_transport TEXT');
  } catch {
    // column already exists
  }

  try {
    db.exec('ALTER TABLE agents ADD COLUMN adapter_id TEXT');
  } catch {
    // column already exists
  }

  try {
    db.exec('ALTER TABLE agents ADD COLUMN terminated_at DATETIME');
  } catch {
    // column already exists
  }

  /**
   * POST /agents/register
   * Register a new agent with the relay server
   */
  router.post('/register', (req: Request, res: Response) => {
    try {
      const { id, name, capabilities, connector_id = null, adapter_id = null, runtime_transport = null } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      // Insert or update agent record
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO agents (id, name, capabilities, connector_id, adapter_id, runtime_transport, status, last_heartbeat)
        VALUES (?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
      `);

      stmt.run(id, name, JSON.stringify(capabilities || []), connector_id, adapter_id, runtime_transport);

      broadcastRealtimeEvent('agents.updated', { action: 'registered', agentId: id });

      return res.status(201).json({
        id,
        name,
        capabilities: capabilities || [],
        connector_id,
        adapter_id,
        runtime_transport,
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
      const { id, name, capabilities = [], connector_id = null, adapter_id = null, runtime_transport = null, status = 'online' } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      db.prepare(`
        INSERT INTO agents (id, name, capabilities, connector_id, adapter_id, runtime_transport, status, last_heartbeat)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, name, JSON.stringify(capabilities), connector_id, adapter_id, runtime_transport, status);

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
      const stmt = db.prepare(`SELECT * FROM agents WHERE status != 'terminated' ORDER BY last_heartbeat DESC`);
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
        connector_id = existing.connector_id ?? null,
        adapter_id = existing.adapter_id ?? null,
        runtime_transport = existing.runtime_transport ?? null,
        status = existing.status,
      } = req.body as { name?: string; capabilities?: string[]; connector_id?: string | null; adapter_id?: string | null; runtime_transport?: string | null; status?: string };

      db.prepare(`
        UPDATE agents
        SET name = ?, capabilities = ?, connector_id = ?, adapter_id = ?, runtime_transport = ?, status = ?, last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, JSON.stringify(capabilities), connector_id, adapter_id, runtime_transport, status, id);

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
      const result = db.prepare(`
        UPDATE agents
        SET status = 'terminated', terminated_at = CURRENT_TIMESTAMP, last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      broadcastRealtimeEvent('agents.updated', { action: 'deleted', agentId: id });
      return res.json({ id, message: 'Agent terminated' });
    } catch (error: any) {
      console.error('Delete agent error:', error);
      return res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  router.get('/:id/models', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const runtime = getRuntimeCatalogEntry(agent.adapter_id ?? null);

      return res.json({
        agent_id: id,
        adapter_id: runtime.adapterId,
        adapter_label: runtime.label,
        description: runtime.description,
        model_selection_mode: runtime.modelSelectionMode,
        supports_custom_model: runtime.supportsCustomModel,
        launch_behavior: runtime.launchBehavior,
        models: runtime.models,
      });
    } catch (error: any) {
      console.error('Get agent models error:', error);
      return res.status(500).json({ error: 'Failed to get agent models' });
    }
  });

  return router;
}
