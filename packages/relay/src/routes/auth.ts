import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';
import {
    ACCESS_COOKIE_NAME,
    clearAuthCookies,
    createAccessToken,
    createPasswordHash,
    createRefreshTokenRecord,
    extractClientIp,
    hashOpaqueToken,
    isSecureRequest,
    parseCookies,
    REFRESH_COOKIE_NAME,
    setAuthCookies,
    UserRole,
    verifyPassword,
} from '../utils/authSecurity';

type ThemeMode = 'dark' | 'light';

interface OperatorPreferences {
    theme_mode: ThemeMode;
    density_mode: boolean;
    motion_reduction: boolean;
    desktop_notifications: boolean;
    auto_scale_workers: boolean;
}

interface TeamMembership {
    id: string;
    name: string;
    role: UserRole;
}

const DEFAULT_PREFERENCES: OperatorPreferences = {
    theme_mode: 'dark',
    density_mode: false,
    motion_reduction: false,
    desktop_notifications: true,
    auto_scale_workers: true,
};

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function ensurePreferencesTable(db: Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      theme_mode TEXT NOT NULL DEFAULT 'dark',
      density_mode INTEGER NOT NULL DEFAULT 0,
      motion_reduction INTEGER NOT NULL DEFAULT 0,
      desktop_notifications INTEGER NOT NULL DEFAULT 1,
      auto_scale_workers INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

function ensureRefreshSessionsTable(db: Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      team_id TEXT,
      role TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      replaced_by_session_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

function mapPreferences(row?: any): OperatorPreferences {
    return {
        theme_mode: row?.theme_mode === 'light' ? 'light' : DEFAULT_PREFERENCES.theme_mode,
        density_mode: row ? row.density_mode === 1 : DEFAULT_PREFERENCES.density_mode,
        motion_reduction: row ? row.motion_reduction === 1 : DEFAULT_PREFERENCES.motion_reduction,
        desktop_notifications: row ? row.desktop_notifications === 1 : DEFAULT_PREFERENCES.desktop_notifications,
        auto_scale_workers: row ? row.auto_scale_workers === 1 : DEFAULT_PREFERENCES.auto_scale_workers,
    };
}

function getUserPreferences(db: Database, userId: string): OperatorPreferences {
    ensurePreferencesTable(db);
    const row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any;
    return mapPreferences(row);
}

function upsertUserPreferences(db: Database, userId: string, input: Partial<OperatorPreferences>): OperatorPreferences {
    const current = getUserPreferences(db, userId);
    const next: OperatorPreferences = {
        theme_mode: input.theme_mode === 'light' ? 'light' : input.theme_mode === 'dark' ? 'dark' : current.theme_mode,
        density_mode: typeof input.density_mode === 'boolean' ? input.density_mode : current.density_mode,
        motion_reduction: typeof input.motion_reduction === 'boolean' ? input.motion_reduction : current.motion_reduction,
        desktop_notifications: typeof input.desktop_notifications === 'boolean' ? input.desktop_notifications : current.desktop_notifications,
        auto_scale_workers: typeof input.auto_scale_workers === 'boolean' ? input.auto_scale_workers : current.auto_scale_workers,
    };

    db.prepare(`
        INSERT INTO user_preferences (user_id, theme_mode, density_mode, motion_reduction, desktop_notifications, auto_scale_workers)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            theme_mode = excluded.theme_mode,
            density_mode = excluded.density_mode,
            motion_reduction = excluded.motion_reduction,
            desktop_notifications = excluded.desktop_notifications,
            auto_scale_workers = excluded.auto_scale_workers,
            updated_at = CURRENT_TIMESTAMP
    `).run(
        userId,
        next.theme_mode,
        next.density_mode ? 1 : 0,
        next.motion_reduction ? 1 : 0,
        next.desktop_notifications ? 1 : 0,
        next.auto_scale_workers ? 1 : 0,
    );

    return next;
}

function validateEmail(email: unknown): email is string {
    return typeof email === 'string' && email.length >= 5 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: unknown): password is string {
    return typeof password === 'string' && password.length >= 10 && password.length <= 128;
}

function validateName(name: unknown): name is string {
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 80;
}

function getMemberships(db: Database, userId: string): TeamMembership[] {
    return db.prepare(`
        SELECT teams.id, teams.name, team_members.role
        FROM team_members
        JOIN teams ON teams.id = team_members.team_id
        WHERE team_members.user_id = ?
        ORDER BY teams.created_at ASC
    `).all(userId) as TeamMembership[];
}

function buildSessionResponse(db: Database, userId: string, preferredTeamId?: string | null) {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId) as { id: string; email: string; name: string; created_at: string } | undefined;
    const teams = getMemberships(db, userId);
    const activeTeam = preferredTeamId
        ? teams.find((team) => team.id === preferredTeamId) ?? null
        : teams[0] ?? null;

    return {
        user: user ?? null,
        teams,
        activeTeam,
        role: activeTeam?.role ?? 'Developer',
        preferences: getUserPreferences(db, userId),
    };
}

function revokeRefreshSession(db: Database, sessionId: string | null): void {
    if (!sessionId) {
        return;
    }

    db.prepare(`
        UPDATE refresh_sessions
        SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
        WHERE id = ?
    `).run(sessionId);
}

function issueSession(db: Database, req: Request, res: Response, input: { userId: string; teamId: string | null; role: UserRole; replaceSessionId?: string | null }) {
    ensureRefreshSessionsTable(db);

    const refreshSession = createRefreshTokenRecord();
    const accessToken = createAccessToken({
        userId: input.userId,
        teamId: input.teamId,
        role: input.role,
        jti: refreshSession.id,
    });

    db.prepare(`
        INSERT INTO refresh_sessions (id, user_id, team_id, role, refresh_token_hash, expires_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        refreshSession.id,
        input.userId,
        input.teamId,
        input.role,
        refreshSession.hash,
        refreshSession.expiresAt,
        req.header('user-agent') ?? null,
        extractClientIp(req),
    );

    if (input.replaceSessionId) {
        db.prepare(`
            UPDATE refresh_sessions
            SET revoked_at = CURRENT_TIMESTAMP, replaced_by_session_id = ?
            WHERE id = ? AND revoked_at IS NULL
        `).run(refreshSession.id, input.replaceSessionId);
    }

    setAuthCookies(res, accessToken, refreshSession.token, isSecureRequest(req));
    return refreshSession.id;
}

function extractRefreshSession(db: Database, req: Request) {
    ensureRefreshSessionsTable(db);
    const cookies = parseCookies(req.headers.cookie);
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
        return null;
    }

    const session = db.prepare(`
        SELECT *
        FROM refresh_sessions
        WHERE refresh_token_hash = ?
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
    `).get(hashOpaqueToken(refreshToken)) as {
        id: string;
        user_id: string;
        team_id: string | null;
        role: UserRole;
        expires_at: string;
    } | undefined;

    return session ?? null;
}

function clearFailedLoginState(db: Database, userId: string) {
    db.prepare(`
        UPDATE users
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(userId);
}

function registerFailedLogin(db: Database, userId: string) {
    const user = db.prepare('SELECT failed_login_attempts FROM users WHERE id = ?').get(userId) as { failed_login_attempts?: number } | undefined;
    const nextAttempts = (user?.failed_login_attempts ?? 0) + 1;
    const lockedUntil = nextAttempts >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;

    db.prepare(`
        UPDATE users
        SET failed_login_attempts = ?, locked_until = ?
        WHERE id = ?
    `).run(nextAttempts, lockedUntil, userId);
}

export function createAuthRoutes(db: Database): ReturnType<typeof require>['Router'] {
    const router = require('express').Router();
    const authLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: 'Too many authentication attempts. Please try again later.',
        keyGenerator: (req) => `${extractClientIp(req)}:${String(req.body?.email ?? 'anonymous').toLowerCase()}`,
    });

    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until DATETIME,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    ensurePreferencesTable(db);
    ensureRefreshSessionsTable(db);

    db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Developer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS team_invitations (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Developer',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `);

    const ensureTenantColumns = [
        'ALTER TABLE tasks ADD COLUMN team_id TEXT',
        'ALTER TABLE approvals ADD COLUMN team_id TEXT',
        'ALTER TABLE audit_logs ADD COLUMN team_id TEXT',
        'ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0',
        'ALTER TABLE users ADD COLUMN locked_until DATETIME',
        'ALTER TABLE users ADD COLUMN last_login_at DATETIME',
    ];

    for (const migration of ensureTenantColumns) {
        try {
            db.exec(migration);
        } catch {
            // already exists
        }
    }

    router.post('/signup', authLimiter, (req: Request, res: Response) => {
        try {
            const { email, password, name, teamName } = req.body as { email?: string; password?: string; name?: string; teamName?: string };

            if (!validateEmail(email) || !validatePassword(password) || !validateName(name)) {
                return res.status(400).json({ error: 'Valid email, name, and a password of at least 10 characters are required' });
            }

            const normalizedEmail = email.toLowerCase();
            const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;
            if (existing) {
                return res.status(409).json({ error: 'An account with this email already exists' });
            }

            const userId = `user-${randomUUID()}`;
            db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
                userId,
                normalizedEmail,
                createPasswordHash(password),
                name.trim(),
            );

            let teamId: string | null = null;
            let role: UserRole = 'Developer';

            if (typeof teamName === 'string' && teamName.trim().length >= 2) {
                teamId = `team-${randomUUID()}`;
                role = 'Admin';
                db.prepare('INSERT INTO teams (id, name, created_by) VALUES (?, ?, ?)').run(teamId, teamName.trim(), userId);
                db.prepare('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)').run(
                    `member-${randomUUID()}`,
                    teamId,
                    userId,
                    role,
                );
            }

            issueSession(db, req, res, { userId, teamId, role });
            return res.status(201).json(buildSessionResponse(db, userId, teamId));
        } catch (error) {
            console.error('Signup error:', error);
            return res.status(500).json({ error: 'Failed to sign up user' });
        }
    });

    router.post('/login', authLimiter, (req: Request, res: Response) => {
        try {
            const { email, password } = req.body as { email?: string; password?: string };

            if (!validateEmail(email) || typeof password !== 'string') {
                return res.status(400).json({ error: 'Valid email and password are required' });
            }

            const user = db.prepare(`
                SELECT id, email, name, password_hash, failed_login_attempts, locked_until
                FROM users
                WHERE email = ?
            `).get(email.toLowerCase()) as {
                id: string;
                email: string;
                name: string;
                password_hash: string;
                failed_login_attempts: number;
                locked_until: string | null;
            } | undefined;

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
                return res.status(423).json({ error: 'Account temporarily locked due to repeated failed login attempts' });
            }

            const { valid, needsUpgrade } = verifyPassword(password, user.password_hash);
            if (!valid) {
                registerFailedLogin(db, user.id);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (needsUpgrade) {
                db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(createPasswordHash(password), user.id);
            }

            clearFailedLoginState(db, user.id);

            const memberships = getMemberships(db, user.id);
            const activeTeam = memberships[0] ?? null;
            issueSession(db, req, res, {
                userId: user.id,
                teamId: activeTeam?.id ?? null,
                role: activeTeam?.role ?? 'Developer',
            });

            return res.json(buildSessionResponse(db, user.id, activeTeam?.id ?? null));
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Failed to log in' });
        }
    });

    router.post('/refresh', (req: Request, res: Response) => {
        try {
            const session = extractRefreshSession(db, req);
            if (!session) {
                clearAuthCookies(res, isSecureRequest(req));
                return res.status(401).json({ error: 'Refresh session is invalid or expired' });
            }

            issueSession(db, req, res, {
                userId: session.user_id,
                teamId: session.team_id,
                role: session.role,
                replaceSessionId: session.id,
            });

            return res.json(buildSessionResponse(db, session.user_id, session.team_id));
        } catch (error) {
            console.error('Refresh session error:', error);
            return res.status(500).json({ error: 'Failed to refresh session' });
        }
    });

    router.post('/logout', requireAuth, (req: Request, res: Response) => {
        try {
            const session = extractRefreshSession(db, req);
            revokeRefreshSession(db, session?.id ?? null);
            clearAuthCookies(res, isSecureRequest(req));
            return res.status(204).send();
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ error: 'Failed to log out' });
        }
    });

    router.get('/me', requireAuth, (req: Request, res: Response) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            return res.json(buildSessionResponse(db, userId, req.auth?.teamId ?? null));
        } catch (error) {
            console.error('Load current user error:', error);
            return res.status(500).json({ error: 'Failed to load current user' });
        }
    });

    router.get('/preferences', requireAuth, (req: Request, res: Response) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            return res.json(getUserPreferences(db, userId));
        } catch (error) {
            console.error('Load preferences error:', error);
            return res.status(500).json({ error: 'Failed to load preferences' });
        }
    });

    router.put('/preferences', requireAuth, (req: Request, res: Response) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const {
                theme_mode,
                density_mode,
                motion_reduction,
                desktop_notifications,
                auto_scale_workers,
            } = req.body as Partial<OperatorPreferences>;

            if (theme_mode && theme_mode !== 'dark' && theme_mode !== 'light') {
                return res.status(400).json({ error: 'theme_mode must be dark or light' });
            }

            const preferences = upsertUserPreferences(db, userId, {
                theme_mode,
                density_mode,
                motion_reduction,
                desktop_notifications,
                auto_scale_workers,
            });

            return res.json({ preferences });
        } catch (error) {
            console.error('Update preferences error:', error);
            return res.status(500).json({ error: 'Failed to update preferences' });
        }
    });

    router.get('/teams', requireAuth, (req: Request, res: Response) => {
        try {
            return res.json(getMemberships(db, req.auth!.userId));
        } catch (error) {
            console.error('List teams error:', error);
            return res.status(500).json({ error: 'Failed to list teams' });
        }
    });

    router.post('/teams/:teamId/invitations', requireAuth, requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const { teamId } = req.params as { teamId: string };
            const { email, role = 'Developer' } = req.body as { email?: string; role?: UserRole };

            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'A valid email is required' });
            }

            if (!['Admin', 'Developer', 'Viewer'].includes(role)) {
                return res.status(400).json({ error: 'Invalid invitation role' });
            }

            const invitationId = `invite-${randomUUID()}`;
            db.prepare('INSERT INTO team_invitations (id, team_id, email, role) VALUES (?, ?, ?, ?)').run(invitationId, teamId, email.toLowerCase(), role);
            return res.status(201).json({ id: invitationId, team_id: teamId, email: email.toLowerCase(), role, status: 'pending' });
        } catch (error) {
            console.error('Create invitation error:', error);
            return res.status(500).json({ error: 'Failed to create invitation' });
        }
    });

    router.get('/teams/:teamId/invitations', requireAuth, (req: Request, res: Response) => {
        try {
            const { teamId } = req.params as { teamId: string };
            const invitations = db.prepare('SELECT * FROM team_invitations WHERE team_id = ? ORDER BY created_at DESC').all(teamId);
            return res.json(invitations);
        } catch (error) {
            console.error('List invitations error:', error);
            return res.status(500).json({ error: 'Failed to list invitations' });
        }
    });

    router.post('/invitations/:id/accept', requireAuth, (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const invitation = db.prepare('SELECT * FROM team_invitations WHERE id = ?').get(id) as { team_id: string; role: UserRole; status: string } | undefined;

            if (!invitation || invitation.status !== 'pending') {
                return res.status(404).json({ error: 'Invitation not found or already handled' });
            }

            db.prepare('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)').run(
                `member-${randomUUID()}`,
                invitation.team_id,
                req.auth!.userId,
                invitation.role,
            );
            db.prepare('UPDATE team_invitations SET status = ? WHERE id = ?').run('accepted', id);

            return res.json({ id, status: 'accepted', team_id: invitation.team_id, role: invitation.role });
        } catch (error) {
            console.error('Accept invitation error:', error);
            return res.status(500).json({ error: 'Failed to accept invitation' });
        }
    });

    return router;
}
