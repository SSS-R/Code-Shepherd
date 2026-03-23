import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../realtime';

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
      trust_status TEXT NOT NULL DEFAULT 'trusted',
      scopes TEXT DEFAULT '[]',
      last_verified_at DATETIME,
      revoked_at DATETIME,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

            db.prepare(`
        INSERT INTO trusted_connectors (id, connector_id, connector_name, adapter_kind, transport, trust_status, scopes, last_verified_at, team_id)
        VALUES (?, ?, ?, ?, ?, 'trusted', ?, ?, ?)
      `).run(id, connector_id, connector_name, adapter_kind, transport, JSON.stringify(scopes), last_verified_at, req.auth?.teamId ?? null);

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
            return res.status(201).json({ ...connector, scopes: JSON.parse(connector.scopes || '[]') });
        } catch (error) {
            console.error('Trust connector error:', error);
            return res.status(500).json({ error: 'Failed to trust connector' });
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

    return router;
}
