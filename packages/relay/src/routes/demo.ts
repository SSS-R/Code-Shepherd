import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';

export function createDemoRoutes(db: Database): ReturnType<typeof require>['Router'] {
    const router = require('express').Router();

    router.post('/seed', (req: Request, res: Response) => {
        try {
            const teamId = `team-demo-${randomUUID()}`;
            const userId = `user-demo-${randomUUID()}`;
            const agentId = `agent-demo-${randomUUID()}`;
            const taskId = `task-demo-${randomUUID()}`;
            const approvalId = `approval-demo-${randomUUID()}`;

            db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
                .run(userId, 'demo@agentops.dev', 'demo-password', 'Demo User');
            db.prepare('INSERT INTO teams (id, name, created_by) VALUES (?, ?, ?)')
                .run(teamId, 'Demo Team', userId);
            db.prepare('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)')
                .run(`member-${randomUUID()}`, teamId, userId, 'Admin');
            db.prepare('INSERT INTO agents (id, name, capabilities, status) VALUES (?, ?, ?, ?)')
                .run(agentId, 'Demo Agent', JSON.stringify(['file_write', 'command_execute']), 'online');
            db.prepare('INSERT INTO tasks (id, title, description, status, priority, labels, team_id, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                .run(taskId, 'Demo task', 'Review a seeded operational task', 'In Progress', 'P1', JSON.stringify(['demo', 'phase2']), teamId, agentId);
            db.prepare('INSERT INTO approvals (id, agent_id, action_type, summary, action_details, risk_level, risk_reason, status, team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
                .run(approvalId, agentId, 'file_write', 'Write 12 lines to src/demo.ts', JSON.stringify({ path: 'src/demo.ts' }), 'medium', 'Demo seeded approval', 'pending', teamId);
            db.prepare('INSERT INTO audit_logs (event_type, event_details, agent_id, approval_id, team_id) VALUES (?, ?, ?, ?, ?)')
                .run('approval_requested', JSON.stringify({ action_type: 'file_write', source: 'demo-seed' }), agentId, approvalId, teamId);

            return res.status(201).json({
                user: { id: userId, email: 'demo@agentops.dev', name: 'Demo User' },
                team: { id: teamId, name: 'Demo Team', role: 'Admin' },
                agent: { id: agentId, name: 'Demo Agent' },
                task: { id: taskId },
                approval: { id: approvalId },
            });
        } catch (error) {
            console.error('Demo seed error:', error);
            return res.status(500).json({ error: 'Failed to seed demo data' });
        }
    });

    return router;
}
