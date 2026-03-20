import { randomUUID, createHash } from 'crypto';
import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';

function hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

export function createAuthRoutes(db: Database): ReturnType<typeof require>['Router'] {
    const router = require('express').Router();

    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
    ];

    for (const migration of ensureTenantColumns) {
        try {
            db.exec(migration);
        } catch {
            // already exists
        }
    }

    router.post('/signup', (req: Request, res: Response) => {
        try {
            const { email, password, name, teamName } = req.body as { email: string; password: string; name: string; teamName?: string };
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'email, password, and name are required' });
            }

            const userId = `user-${randomUUID()}`;
            db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
                .run(userId, email.toLowerCase(), hashPassword(password), name);

            let team = null as null | { id: string; name: string; role: string };
            if (teamName) {
                const teamId = `team-${randomUUID()}`;
                db.prepare('INSERT INTO teams (id, name, created_by) VALUES (?, ?, ?)').run(teamId, teamName, userId);
                db.prepare('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)')
                    .run(`member-${randomUUID()}`, teamId, userId, 'Admin');
                team = { id: teamId, name: teamName, role: 'Admin' };
            }

            return res.status(201).json({
                token: `demo-token-${userId}`,
                user: { id: userId, email: email.toLowerCase(), name },
                team,
            });
        } catch (error) {
            console.error('Signup error:', error);
            return res.status(500).json({ error: 'Failed to sign up user' });
        }
    });

    router.post('/login', (req: Request, res: Response) => {
        try {
            const { email, password } = req.body as { email: string; password: string };
            const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email.toLowerCase()) as { id: string; email: string; name: string; password_hash: string } | undefined;

            if (!user || user.password_hash !== hashPassword(password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const memberships = db.prepare(`
        SELECT teams.id, teams.name, team_members.role
        FROM team_members
        JOIN teams ON teams.id = team_members.team_id
        WHERE team_members.user_id = ?
      `).all(user.id) as Array<{ id: string; name: string; role: string }>;

            return res.json({
                token: `demo-token-${user.id}`,
                user: { id: user.id, email: user.email, name: user.name },
                teams: memberships,
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Failed to log in' });
        }
    });

    router.get('/teams', (req: Request, res: Response) => {
        try {
            const { userId } = req.query as { userId?: string };
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            const teams = db.prepare(`
        SELECT teams.id, teams.name, team_members.role
        FROM team_members
        JOIN teams ON teams.id = team_members.team_id
        WHERE team_members.user_id = ?
      `).all(userId);

            return res.json(teams);
        } catch (error) {
            console.error('List teams error:', error);
            return res.status(500).json({ error: 'Failed to list teams' });
        }
    });

    router.post('/teams/:teamId/invitations', (req: Request, res: Response) => {
        try {
            const { teamId } = req.params as { teamId: string };
            const { email, role = 'Developer' } = req.body as { email: string; role?: string };
            const invitationId = `invite-${randomUUID()}`;
            db.prepare('INSERT INTO team_invitations (id, team_id, email, role) VALUES (?, ?, ?, ?)')
                .run(invitationId, teamId, email.toLowerCase(), role);
            return res.status(201).json({ id: invitationId, team_id: teamId, email: email.toLowerCase(), role, status: 'pending' });
        } catch (error) {
            console.error('Create invitation error:', error);
            return res.status(500).json({ error: 'Failed to create invitation' });
        }
    });

    return router;
}
