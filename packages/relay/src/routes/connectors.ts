import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../realtime';
import { hashSecret } from '../middleware/connectorAuth';

type ConnectorTrustStatus = 'trusted' | 'revoked';

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPairingCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(8);
    let code = '';

    for (let index = 0; index < 8; index += 1) {
        code += alphabet[bytes[index] % alphabet.length];
    }

    return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function createAccessToken(): string {
    return `csgw_${randomBytes(24).toString('base64url')}`;
}

function normalizeScopes(value: unknown): string[] {
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function resolveRelayBaseUrl(req: Request): string {
    const protocol = req.header('x-forwarded-proto') ?? req.protocol;
    const host = req.header('x-forwarded-host') ?? req.get('host');
    return `${protocol}://${host}`;
}

function buildSessionFileName(agentId: string): string {
    const safe = agentId.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'gateway';
    return `${safe}.json`;
}

function buildLaunchCommand(relayBaseUrl: string, pairingCode: string, adapterId: string, sessionFileName: string): string {
    if (adapterId === 'antigravity-companion') {
        return `npm run pair:antigravity-companion -- --pairing-code ${pairingCode} --relay-url ${relayBaseUrl}`;
    }

    return `npm run start:gateway -- --pairing-code ${pairingCode} --relay-url ${relayBaseUrl} --session-file %USERPROFILE%\\.code-shepherd\\${sessionFileName}`;
}

const latestConnectorSelection = `
    SELECT *
    FROM trusted_connectors
    WHERE id IN (
        SELECT id
        FROM trusted_connectors AS candidate
        WHERE (candidate.team_id IS ? OR candidate.team_id = ?)
        GROUP BY candidate.connector_id, COALESCE(candidate.team_id, '')
        HAVING MAX(datetime(candidate.updated_at))
        ORDER BY MAX(datetime(candidate.updated_at)) DESC
    )
`;

export function createConnectorRoutes(db: Database) {
    const router = require('express').Router();

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

    db.exec(`
    CREATE TABLE IF NOT EXISTS connector_pairing_sessions (
      id TEXT PRIMARY KEY,
      pairing_code TEXT NOT NULL UNIQUE,
      connector_id TEXT NOT NULL,
      team_id TEXT,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      adapter_id TEXT NOT NULL,
      agent_capabilities TEXT DEFAULT '[]',
      created_by TEXT,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME,
      consumed_by_label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS connector_access_tokens (
      id TEXT PRIMARY KEY,
      connector_id TEXT NOT NULL,
      team_id TEXT,
      label TEXT,
      scopes TEXT DEFAULT '[]',
      access_token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    router.post('/pair/exchange', (req: Request, res: Response) => {
        try {
            const { pairing_code, machine_label } = req.body as { pairing_code?: string; machine_label?: string };

            if (!pairing_code || typeof pairing_code !== 'string') {
                return res.status(400).json({ error: 'pairing_code is required' });
            }

            const session = db.prepare(`
                SELECT connector_pairing_sessions.*, trusted_connectors.connector_name, trusted_connectors.adapter_kind, trusted_connectors.transport, trusted_connectors.scopes, trusted_connectors.trust_status
                FROM connector_pairing_sessions
                INNER JOIN trusted_connectors
                    ON trusted_connectors.id = (
                        SELECT id
                        FROM trusted_connectors AS candidate
                        WHERE candidate.connector_id = connector_pairing_sessions.connector_id
                          AND candidate.trust_status = 'trusted'
                          AND (candidate.team_id IS connector_pairing_sessions.team_id OR candidate.team_id = connector_pairing_sessions.team_id)
                        ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
                        LIMIT 1
                    )
                WHERE connector_pairing_sessions.pairing_code = ?
            `).get(pairing_code.trim().toUpperCase()) as {
                id: string;
                connector_id: string;
                connector_name: string;
                adapter_kind: string;
                transport: string;
                scopes: string;
                trust_status: string;
                team_id: string | null;
                agent_id: string;
                agent_name: string;
                adapter_id: string;
                agent_capabilities: string;
                expires_at: string;
                consumed_at?: string | null;
            } | undefined;

            if (!session || session.trust_status !== 'trusted') {
                return res.status(404).json({ error: 'Pairing code is invalid' });
            }

            if (session.consumed_at) {
                return res.status(410).json({ error: 'Pairing code has already been used' });
            }

            if (new Date(session.expires_at).getTime() <= Date.now()) {
                return res.status(410).json({ error: 'Pairing code has expired' });
            }

            const accessToken = createAccessToken();
            const accessTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            db.prepare(`
                INSERT INTO connector_access_tokens (id, connector_id, team_id, label, scopes, access_token_hash, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                createId('connector-access'),
                session.connector_id,
                session.team_id,
                machine_label?.trim() || session.agent_name,
                session.scopes,
                hashSecret(accessToken),
                accessTokenExpiresAt,
            );

            db.prepare(`
                UPDATE connector_pairing_sessions
                SET consumed_at = CURRENT_TIMESTAMP, consumed_by_label = ?
                WHERE id = ?
            `).run(machine_label?.trim() || session.agent_name, session.id);

            db.prepare(`
                INSERT INTO connector_events (id, connector_id, event_type, event_details, team_id)
                VALUES (?, ?, 'paired', ?, ?)
            `).run(
                createId('connector-event'),
                session.connector_id,
                JSON.stringify({ machine_label: machine_label?.trim() || session.agent_name, agent_id: session.agent_id }),
                session.team_id,
            );

            return res.json({
                relay_url: resolveRelayBaseUrl(req),
                connector_id: session.connector_id,
                connector_name: session.connector_name,
                connector_access_token: accessToken,
                connector_access_token_expires_at: accessTokenExpiresAt,
                scopes: normalizeScopes(JSON.parse(session.scopes || '[]')),
                agent: {
                    id: session.agent_id,
                    name: session.agent_name,
                    adapter_id: session.adapter_id,
                    capabilities: normalizeScopes(JSON.parse(session.agent_capabilities || '[]')),
                    transport: session.transport,
                    adapter_kind: session.adapter_kind,
                },
            });
        } catch (error) {
            console.error('Connector pairing exchange error:', error);
            return res.status(500).json({ error: 'Failed to exchange pairing code' });
        }
    });

    router.use(requireAuth);

    router.get('/', (req: Request, res: Response) => {
        try {
            const connectors = db.prepare(`
        SELECT *
        FROM trusted_connectors AS current
        WHERE (current.team_id IS ? OR current.team_id = ?)
          AND current.id = (
              SELECT candidate.id
              FROM trusted_connectors AS candidate
              WHERE candidate.connector_id = current.connector_id
                AND (candidate.team_id IS current.team_id OR candidate.team_id = current.team_id)
              ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
              LIMIT 1
          )
        ORDER BY datetime(current.updated_at) DESC, datetime(current.created_at) DESC
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
                WHERE id = (
                    SELECT candidate.id
                    FROM trusted_connectors AS candidate
                    WHERE candidate.connector_id = ? AND (candidate.team_id IS ? OR candidate.team_id = ?)
                    ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
                    LIMIT 1
                )
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

            const existing = db.prepare(`
                SELECT id
                FROM trusted_connectors
                WHERE connector_id = ? AND (team_id IS ? OR team_id = ?)
                ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
                LIMIT 1
            `).get(connector_id, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as { id: string } | undefined;

            const id = existing?.id ?? createId('connector');
            const connectorSecret = `cs_${Math.random().toString(36).slice(2)}${Date.now()}`;
            const secretExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            if (existing) {
                db.prepare(`
                    UPDATE trusted_connectors
                    SET connector_name = ?, adapter_kind = ?, transport = ?, connector_secret_hash = ?, trust_status = 'trusted', scopes = ?, secret_expires_at = ?, last_rotated_at = CURRENT_TIMESTAMP, last_verified_at = ?, revoked_at = NULL, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(connector_name, adapter_kind, transport, hashSecret(connectorSecret), JSON.stringify(scopes), secretExpiresAt, last_verified_at, id);
            } else {
                db.prepare(`
                    INSERT INTO trusted_connectors (id, connector_id, connector_name, adapter_kind, transport, connector_secret_hash, trust_status, scopes, secret_expires_at, last_rotated_at, last_verified_at, team_id)
                    VALUES (?, ?, ?, ?, ?, ?, 'trusted', ?, ?, CURRENT_TIMESTAMP, ?, ?)
                `).run(id, connector_id, connector_name, adapter_kind, transport, hashSecret(connectorSecret), JSON.stringify(scopes), secretExpiresAt, last_verified_at, req.auth?.teamId ?? null);
            }

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

    router.post('/:connectorId/pairing-sessions', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const connector = db.prepare(`
                SELECT *
                FROM trusted_connectors
                WHERE id = (
                    SELECT candidate.id
                    FROM trusted_connectors AS candidate
                    WHERE candidate.connector_id = ?
                      AND candidate.trust_status = 'trusted'
                      AND (candidate.team_id IS ? OR candidate.team_id = ?)
                    ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
                    LIMIT 1
                )
            `).get(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as {
                connector_id: string;
                connector_name: string;
                adapter_kind: string;
                transport: string;
                scopes: string;
                team_id: string | null;
            } | undefined;

            if (!connector) {
                return res.status(404).json({ error: 'Trusted connector not found' });
            }

            const {
                agent_id,
                agent_name,
                adapter_id,
                agent_capabilities,
                expires_in_minutes = 10,
            } = req.body as {
                agent_id?: string;
                agent_name?: string;
                adapter_id?: string;
                agent_capabilities?: string[];
                expires_in_minutes?: number;
            };

            const registeredAgent = agent_id
                ? db.prepare(`
                    SELECT *
                    FROM agents
                    WHERE id = ?
                `).get(agent_id) as {
                    id: string;
                    name: string;
                    capabilities: string;
                    adapter_id?: string | null;
                    connector_id?: string | null;
                } | undefined
                : undefined;

            const resolvedAgentId = agent_id ?? registeredAgent?.id ?? 'codex-mcp-bridge';
            const resolvedAgentName = agent_name ?? registeredAgent?.name ?? 'Codex MCP Bridge';
            const resolvedAdapterId = adapter_id ?? registeredAgent?.adapter_id ?? 'codex-proxy';
            const resolvedCapabilities = agent_capabilities
                ?? (registeredAgent ? JSON.parse(registeredAgent.capabilities || '[]') : ['mcp', 'codex', 'chat', 'bridge']);

            const pairingCode = createPairingCode();
            const expiresAt = new Date(Date.now() + Math.max(1, Math.min(30, Number(expires_in_minutes) || 10)) * 60 * 1000).toISOString();

            db.prepare(`
                INSERT INTO connector_pairing_sessions (id, pairing_code, connector_id, team_id, agent_id, agent_name, adapter_id, agent_capabilities, created_by, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                createId('connector-pair'),
                pairingCode,
                connector.connector_id,
                connector.team_id,
                resolvedAgentId,
                resolvedAgentName,
                resolvedAdapterId,
                JSON.stringify(resolvedCapabilities),
                req.auth?.userId ?? 'dashboard-user',
                expiresAt,
            );

            const sessionFileName = buildSessionFileName(resolvedAgentId);

            return res.status(201).json({
                pairing_code: pairingCode,
                relay_url: resolveRelayBaseUrl(req),
                connector_id: connector.connector_id,
                connector_name: connector.connector_name,
                agent_id: resolvedAgentId,
                agent_name: resolvedAgentName,
                adapter_id: resolvedAdapterId,
                agent_capabilities: resolvedCapabilities,
                expires_at: expiresAt,
                session_file: sessionFileName,
                launch_command: buildLaunchCommand(resolveRelayBaseUrl(req), pairingCode, resolvedAdapterId, sessionFileName),
            });
        } catch (error) {
            console.error('Create connector pairing session error:', error);
            return res.status(500).json({ error: 'Failed to create pairing session' });
        }
    });

    router.patch('/:connectorId', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const existing = db.prepare(`
                SELECT * FROM trusted_connectors
                WHERE id = (
                    SELECT candidate.id
                    FROM trusted_connectors AS candidate
                    WHERE candidate.connector_id = ? AND (candidate.team_id IS ? OR candidate.team_id = ?)
                    ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
                    LIMIT 1
                )
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

            const updated = db.prepare(`
                SELECT *
                FROM trusted_connectors
                WHERE id = (
                    SELECT candidate.id
                    FROM trusted_connectors AS candidate
                    WHERE candidate.connector_id = ? AND (candidate.team_id IS ? OR candidate.team_id = ?)
                    ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
                    LIMIT 1
                )
            `).get(req.params.connectorId, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;
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
