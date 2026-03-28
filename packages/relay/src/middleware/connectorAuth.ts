import { createHash, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';

export interface ConnectorAuthContext {
    connectorId: string;
    teamId: string | null;
    scopes: string[];
}

declare module 'express-serve-static-core' {
    interface Request {
        connectorAuth?: ConnectorAuthContext;
    }
}

function hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
}

export function requireConnectorAuth(db: Database, requiredScopes: string[] = []) {
    return (req: Request, res: Response, next: Function) => {
        const connectorId = req.header('x-connector-id');
        const connectorSecret = req.header('x-connector-secret');

        if (!connectorId || !connectorSecret) {
            return res.status(401).json({ error: 'Missing connector authentication headers' });
        }

        const connector = db.prepare(`
      SELECT connector_id, team_id, scopes, trust_status, connector_secret_hash, secret_expires_at
      FROM trusted_connectors
      WHERE connector_id = ?
    `).get(connectorId) as { connector_id: string; team_id: string | null; scopes: string; trust_status: string; connector_secret_hash: string | null; secret_expires_at?: string | null } | undefined;

        if (!connector || connector.trust_status !== 'trusted' || !connector.connector_secret_hash) {
            return res.status(401).json({ error: 'Connector is not trusted' });
        }

        if (connector.secret_expires_at && new Date(connector.secret_expires_at).getTime() <= Date.now()) {
            return res.status(401).json({ error: 'Connector secret has expired and must be rotated' });
        }

        const expected = Buffer.from(connector.connector_secret_hash, 'hex');
        const provided = Buffer.from(hashSecret(connectorSecret), 'hex');

        if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
            return res.status(401).json({ error: 'Invalid connector secret' });
        }

        const scopes = JSON.parse(connector.scopes || '[]') as string[];
        const hasRequiredScopes = requiredScopes.every((scope) => scopes.includes(scope));

        if (!hasRequiredScopes) {
            return res.status(403).json({ error: 'Connector scope is insufficient' });
        }

        req.connectorAuth = {
            connectorId: connector.connector_id,
            teamId: connector.team_id,
            scopes,
        };

        return next();
    };
}

export { hashSecret };
