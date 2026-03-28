import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../realtime';
import { hashSecret } from '../middleware/connectorAuth';

type ConnectorTrustStatus = 'trusted' | 'revoked';

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createConnectorRoutes(db: Database) {
    const router = require('express').Router();
    router.use(requireAuth);

    db.exec(`
    CREATE TABLE IF NOT EXISTS trusted_connectors (
      id TEXT PRIMARY KEY,
      connector_id TEXT NOT NULL,
      connector_name TEXT NOT NULL,
      adapter_kind TEXT NOT NULL,
      transport TEXT NOT NULL,
      connector_secret_hash TEXT,
      trust_status TEXT NOT NULL DEFAULT 'trusted',
      scopes TEXT DEFAULT '[]',
      secret_expires_at DATETIME,
      last_rotated_at DATETIME,
      last_verified_at DATETIME,
      revoked_at DATETIME,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    try {
        db.exec('ALTER TABLE trusted_connectors ADD COLUMN connector_secret_hash TEXT');
    } catch {
        // already exists
    }

    try {
        db.exec('ALTER TABLE trusted_connectors ADD COLUMN secret_expires_at DATETIME');
    } catch {
        // already exists
    }

    try {
        db.exec('ALTER TABLE trusted_connectors ADD COLUMN last_rotated_at DATETIME');
    } catch {
        // already exists
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS connector_events (
      id TEXT PRIMARY KEY,
      connector_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_details TEXT,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    router.get('/', (req: Request, res: Response) => {
        try {
            const connectors = db.prepare(`
        SELECT * FROM trusted_connectors
        WHERE (team_id IS ? OR team_id = ?)
        ORDER BY updated_at DESC
      `).all(req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any[];

            return res.json(connectors.map((connector) => ({
                ...connector,
                scopes: JSON.parse(connector.scopes || '[]'),
            })));
        } catch (error) {
            console.error('List connectors error:', error);
            return res.status(500).json({ error: 'Failed to list connectors' });
        }
    });

    router.get('/events', (req: Request, res: Response) => {
        try {
            const events = db.prepare(`
        SELECT * FROM connector_events
        WHERE (team_id IS ? OR team_id = ?)
        ORDER BY created_at DESC
        LIMIT 100
      `).all(req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any[];

            return res.json(events.map((event) => ({
                ...event,
                event_details: event.event_details ? JSON.parse(event.event_details) : {},
            })));
        } catch (error) {
            console.error('List connector events error:', error);
            return res.status(500).json({ error: 'Failed to list connector events' });
        }
    });

    router.get('/:connectorId', (req: Request, res: Response) => {
        try {
            const connector = db.prepare(`
                SELECT * FROM trusted_connectors
                WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
            `).get(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (!connector) {
                return res.status(404).json({ error: 'Connector not found' });
            }

            return res.json({
                ...connector,
                scopes: JSON.parse(connector.scopes || '[]'),
            });
        } catch (error) {
            console.error('Get connector error:', error);
            return res.status(500).json({ error: 'Failed to get connector' });
        }
    });

    router.post('/', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const {
                connector_id,
                connector_name,
                adapter_kind,
                transport,
                scopes = [],
                last_verified_at = new Date().toISOString(),
            } = req.body as {
                connector_id?: string;
                connector_name?: string;
                adapter_kind?: string;
                transport?: string;
                scopes?: string[];
                last_verified_at?: string;
            };

            if (!connector_id || !connector_name || !adapter_kind || !transport) {
                return res.status(400).json({ error: 'connector_id, connector_name, adapter_kind, and transport are required' });
            }

            const id = createId('connector');
            const connectorSecret = `cs_${Math.random().toString(36).slice(2)}${Date.now()}`;
            const secretExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            db.prepare(`
        INSERT INTO trusted_connectors (id, connector_id, connector_name, adapter_kind, transport, connector_secret_hash, trust_status, scopes, secret_expires_at, last_rotated_at, last_verified_at, team_id)
        VALUES (?, ?, ?, ?, ?, ?, 'trusted', ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(id, connector_id, connector_name, adapter_kind, transport, hashSecret(connectorSecret), JSON.stringify(scopes), secretExpiresAt, last_verified_at, req.auth?.teamId ?? null);

            db.prepare(`
        INSERT INTO connector_events (id, connector_id, event_type, event_details, team_id)
        VALUES (?, ?, 'trusted', ?, ?)
      `).run(createId('connector-event'), connector_id, JSON.stringify({ connector_name, scopes, actor: req.auth?.userId ?? 'dashboard-user' }), req.auth?.teamId ?? null);

            db.prepare(`
        INSERT INTO audit_logs (event_type, event_details, team_id)
        VALUES ('connector_trusted', ?, ?)
      `).run(JSON.stringify({ connector_id, connector_name, scopes }), req.auth?.teamId ?? null);

            broadcastRealtimeEvent('connectors.updated' as any, { action: 'trusted', connectorId: connector_id });

            const connector = db.prepare('SELECT * FROM trusted_connectors WHERE id = ?').get(id) as any;
            return res.status(201).json({ ...connector, scopes: JSON.parse(connector.scopes || '[]'), connector_secret: connectorSecret });
        } catch (error) {
            console.error('Trust connector error:', error);
            return res.status(500).json({ error: 'Failed to trust connector' });
        }
    });

    router.post('/:connectorId/rotate-secret', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const { connectorId } = req.params as { connectorId: string };
            const connectorSecret = `cs_${Math.random().toString(36).slice(2)}${Date.now()}`;
            const secretExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            const result = db.prepare(`
        UPDATE trusted_connectors
        SET connector_secret_hash = ?, secret_expires_at = ?, last_rotated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
      `).run(hashSecret(connectorSecret), secretExpiresAt, connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Connector not found' });
            }

            db.prepare(`
        INSERT INTO connector_events (id, connector_id, event_type, event_details, team_id)
        VALUES (?, ?, 'secret_rotated', ?, ?)
      `).run(createId('connector-event'), connectorId, JSON.stringify({ actor: req.auth?.userId ?? 'dashboard-user' }), req.auth?.teamId ?? null);

            return res.json({ connector_id: connectorId, connector_secret: connectorSecret });
        } catch (error) {
            console.error('Rotate connector secret error:', error);
            return res.status(500).json({ error: 'Failed to rotate connector secret' });
        }
    });

    router.patch('/:connectorId', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const existing = db.prepare(`
                SELECT * FROM trusted_connectors
                WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
            `).get(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (!existing) {
                return res.status(404).json({ error: 'Connector not found' });
            }

            const {
                connector_name = existing.connector_name,
                adapter_kind = existing.adapter_kind,
                transport = existing.transport,
                scopes = JSON.parse(existing.scopes || '[]'),
                trust_status = existing.trust_status,
            } = req.body as {
                connector_name?: string;
                adapter_kind?: string;
                transport?: string;
                scopes?: string[];
                trust_status?: string;
            };

            db.prepare(`
                UPDATE trusted_connectors
                SET connector_name = ?, adapter_kind = ?, transport = ?, scopes = ?, trust_status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
            `).run(connector_name, adapter_kind, transport, JSON.stringify(scopes), trust_status, req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null);

            const updated = db.prepare('SELECT * FROM trusted_connectors WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)').get(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;
            broadcastRealtimeEvent('connectors.updated' as any, { action: 'updated', connectorId: req.params.connectorId });

            return res.json({
                ...updated,
                scopes: JSON.parse(updated.scopes || '[]'),
            });
        } catch (error) {
            console.error('Update connector error:', error);
            return res.status(500).json({ error: 'Failed to update connector' });
        }
    });

    router.post('/:connectorId/revoke', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const { connectorId } = req.params as { connectorId: string };
            const result = db.prepare(`
        UPDATE trusted_connectors
        SET trust_status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
      `).run(connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Connector not found' });
            }

            db.prepare(`
        INSERT INTO connector_events (id, connector_id, event_type, event_details, team_id)
        VALUES (?, ?, 'revoked', ?, ?)
      `).run(createId('connector-event'), connectorId, JSON.stringify({ actor: req.auth?.userId ?? 'dashboard-user' }), req.auth?.teamId ?? null);

            db.prepare(`
        INSERT INTO audit_logs (event_type, event_details, team_id)
        VALUES ('connector_revoked', ?, ?)
      `).run(JSON.stringify({ connector_id: connectorId }), req.auth?.teamId ?? null);

            broadcastRealtimeEvent('connectors.updated' as any, { action: 'revoked', connectorId });
            return res.json({ connector_id: connectorId, trust_status: 'revoked' as ConnectorTrustStatus });
        } catch (error) {
            console.error('Revoke connector error:', error);
            return res.status(500).json({ error: 'Failed to revoke connector' });
        }
    });

    router.delete('/:connectorId', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const result = db.prepare(`
                DELETE FROM trusted_connectors
                WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
            `).run(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Connector not found' });
            }

            broadcastRealtimeEvent('connectors.updated' as any, { action: 'deleted', connectorId: req.params.connectorId });
            return res.json({ connector_id: req.params.connectorId, message: 'Connector deleted' });
        } catch (error) {
            console.error('Delete connector error:', error);
            return res.status(500).json({ error: 'Failed to delete connector' });
        }
    });

    return router;
}
