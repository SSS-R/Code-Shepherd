import { Request, Response } from 'express';

export interface AuthContext {
    userId: string;
    teamId: string | null;
    role: 'Admin' | 'Developer' | 'Viewer';
}

declare module 'express-serve-static-core' {
    interface Request {
        auth?: AuthContext;
    }
}

export function requireAuth(req: Request, res: Response, next: Function) {
    const userId = req.header('x-user-id');
    const teamId = req.header('x-team-id') || null;
    const role = (req.header('x-role') || 'Developer') as AuthContext['role'];

    if (!userId) {
        return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    req.auth = { userId, teamId, role };
    return next();
}

export function requireRole(allowedRoles: AuthContext['role'][]) {
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
