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
        const accessTokenHeader = req.header('x-connector-access-token');
        const authorizationHeader = req.header('authorization');
        const bearerToken = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7).trim() : null;
        const accessToken = accessTokenHeader ?? bearerToken;

        if (accessToken) {
            const accessRecord = db.prepare(`
      SELECT
        connector_access_tokens.connector_id,
        connector_access_tokens.team_id,
        connector_access_tokens.scopes,
        connector_access_tokens.access_token_hash,
        connector_access_tokens.expires_at,
        connector_access_tokens.revoked_at,
        trusted_connectors.trust_status
      FROM connector_access_tokens
      INNER JOIN trusted_connectors
        ON trusted_connectors.id = (
          SELECT id
          FROM trusted_connectors AS candidate
          WHERE candidate.connector_id = connector_access_tokens.connector_id
            AND candidate.trust_status = 'trusted'
            AND (candidate.team_id IS connector_access_tokens.team_id OR candidate.team_id = connector_access_tokens.team_id)
          ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
          LIMIT 1
        )
      WHERE connector_access_tokens.access_token_hash = ?
    `).get(hashSecret(accessToken)) as {
                connector_id: string;
                team_id: string | null;
                scopes: string;
                access_token_hash: string;
                expires_at?: string | null;
                revoked_at?: string | null;
                trust_status: string;
            } | undefined;

            if (!accessRecord || accessRecord.trust_status !== 'trusted' || accessRecord.revoked_at) {
                return res.status(401).json({ error: 'Connector access token is invalid' });
            }

            if (accessRecord.expires_at && new Date(accessRecord.expires_at).getTime() <= Date.now()) {
                return res.status(401).json({ error: 'Connector access token has expired' });
            }

            const scopes = JSON.parse(accessRecord.scopes || '[]') as string[];
            const hasRequiredScopes = requiredScopes.every((scope) => scopes.includes(scope));

            if (!hasRequiredScopes) {
                return res.status(403).json({ error: 'Connector scope is insufficient' });
            }

            db.prepare(`
        UPDATE connector_access_tokens
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE access_token_hash = ?
      `).run(accessRecord.access_token_hash);

            req.connectorAuth = {
                connectorId: accessRecord.connector_id,
                teamId: accessRecord.team_id,
                scopes,
            };

            return next();
        }

        if (!connectorId || !connectorSecret) {
            return res.status(401).json({ error: 'Missing connector authentication headers' });
        }

        const connector = db.prepare(`
      SELECT connector_id, team_id, scopes, trust_status, connector_secret_hash, secret_expires_at
      FROM trusted_connectors
      WHERE id = (
        SELECT id
        FROM trusted_connectors AS candidate
        WHERE candidate.connector_id = ?
          AND candidate.trust_status = 'trusted'
        ORDER BY datetime(candidate.updated_at) DESC, datetime(candidate.created_at) DESC
        LIMIT 1
      )
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
