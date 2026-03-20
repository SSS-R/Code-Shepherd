import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { broadcastRealtimeEvent } from '../realtime';
import { requireAuth, requireRole } from '../middleware/auth';

type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done' | 'Failed';
type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

interface TaskRow {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    labels: string | null;
    blocked_by_task_id: string | null;
    assigned_agent_id: string | null;
    created_at: string;
    updated_at: string;
}

const VALID_STATUSES: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done', 'Failed'];
const VALID_PRIORITIES: TaskPriority[] = ['P0', 'P1', 'P2', 'P3'];

function mapTask(task: TaskRow) {
    return {
        ...task,
        labels: JSON.parse(task.labels || '[]') as string[],
    };
}

export function createTaskRoutes(db: Database): ReturnType<typeof require>['Router'] {
    const router = require('express').Router();
    router.use(requireAuth);

    db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Queued',
      priority TEXT NOT NULL DEFAULT 'P2',
      labels TEXT DEFAULT '[]',
      blocked_by_task_id TEXT,
      assigned_agent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blocked_by_task_id) REFERENCES tasks(id),
      FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
    )
  `);

    try {
        db.exec('ALTER TABLE tasks ADD COLUMN blocked_by_task_id TEXT');
    } catch (error) {
        // column already exists
    }

    router.get('/', (req: Request, res: Response) => {
        try {
            const tasks = (db.prepare('SELECT * FROM tasks WHERE team_id IS ? OR team_id = ? ORDER BY created_at DESC')
                .all(req.auth?.teamId ?? null, req.auth?.teamId ?? null) as TaskRow[]).map(mapTask);
            return res.json(tasks);
        } catch (error) {
            console.error('List tasks error:', error);
            return res.status(500).json({ error: 'Failed to list tasks' });
        }
    });

    router.post('/', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const {
                id,
                title,
                description,
                status = 'Queued',
                priority = 'P2',
                labels = [],
                blocked_by_task_id = null,
                assigned_agent_id = null,
            } = req.body as {
                id: string;
                title: string;
                description?: string;
                status?: TaskStatus;
                priority?: TaskPriority;
                labels?: string[];
                blocked_by_task_id?: string | null;
                assigned_agent_id?: string | null;
            };

            if (!id || !title) {
                return res.status(400).json({ error: 'id and title are required' });
            }

            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            if (!VALID_PRIORITIES.includes(priority)) {
                return res.status(400).json({ error: 'Invalid priority value' });
            }

            const stmt = db.prepare(`
        INSERT INTO tasks (id, title, description, status, priority, labels, blocked_by_task_id, assigned_agent_id, team_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(id, title, description || null, status, priority, JSON.stringify(labels), blocked_by_task_id, assigned_agent_id, req.auth?.teamId ?? null);

            const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow;
            broadcastRealtimeEvent('tasks.updated', { action: 'created', taskId: id });
            return res.status(201).json(mapTask(created));
        } catch (error) {
            console.error('Create task error:', error);
            return res.status(500).json({ error: 'Failed to create task' });
        }
    });

    router.patch('/:id', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const { title, description, status, priority, labels, blocked_by_task_id, assigned_agent_id } = req.body as {
                title?: string;
                description?: string | null;
                status?: TaskStatus;
                priority?: TaskPriority;
                labels?: string[];
                blocked_by_task_id?: string | null;
                assigned_agent_id?: string | null;
            };

            const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND (team_id IS ? OR team_id = ?)').get(id, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as TaskRow | undefined;
            if (!existing) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const nextStatus = status ?? existing.status;
            const nextPriority = priority ?? existing.priority;

            if (!VALID_STATUSES.includes(nextStatus)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            if (!VALID_PRIORITIES.includes(nextPriority)) {
                return res.status(400).json({ error: 'Invalid priority value' });
            }

            const stmt = db.prepare(`
        UPDATE tasks
        SET title = ?,
            description = ?,
            status = ?,
            priority = ?,
            labels = ?,
            blocked_by_task_id = ?,
            assigned_agent_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

            stmt.run(
                title ?? existing.title,
                description ?? existing.description,
                nextStatus,
                nextPriority,
                JSON.stringify(labels ?? JSON.parse(existing.labels || '[]')),
                blocked_by_task_id ?? existing.blocked_by_task_id,
                assigned_agent_id ?? existing.assigned_agent_id,
                id
            );

            const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow;
            broadcastRealtimeEvent('tasks.updated', { action: 'updated', taskId: id });
            return res.json(mapTask(updated));
        } catch (error) {
            console.error('Update task error:', error);
            return res.status(500).json({ error: 'Failed to update task' });
        }
    });

    router.delete('/:id', requireRole(['Admin']), (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
            const result = stmt.run(id);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            broadcastRealtimeEvent('tasks.updated', { action: 'deleted', taskId: id });
            return res.json({ id, message: 'Task deleted' });
        } catch (error) {
            console.error('Delete task error:', error);
            return res.status(500).json({ error: 'Failed to delete task' });
        }
    });

    return router;
}
