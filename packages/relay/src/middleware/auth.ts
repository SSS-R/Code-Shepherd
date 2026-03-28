import { Request, Response } from 'express';
import {
    ACCESS_COOKIE_NAME,
    extractBearerToken,
    parseCookies,
    UserRole,
    verifyAccessToken,
} from '../utils/authSecurity';

export interface AuthContext {
    userId: string;
    teamId: string | null;
    role: UserRole;
    tokenId: string;
}

declare module 'express-serve-static-core' {
    interface Request {
        auth?: AuthContext;
    }
}

function resolveAccessToken(req: Request): string | null {
    const bearerToken = extractBearerToken(req);
    if (bearerToken) {
        return bearerToken;
    }

    const cookies = parseCookies(req.headers.cookie);
    return cookies[ACCESS_COOKIE_NAME] || null;
}

export function requireAuth(req: Request, res: Response, next: Function) {
    const token = resolveAccessToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.auth = {
        userId: payload.sub,
        teamId: payload.teamId,
        role: payload.role,
        tokenId: payload.jti,
    };

    return next();
}

export function requireRole(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: Function) => {
        if (!req.auth) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.auth.role)) {
            return res.status(403).json({ error: 'Insufficient role' });
        }

        return next();
    };
}
