import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { broadcastRealtimeEvent } from '../realtime';
import { requireAuth, requireRole } from '../middleware/auth';

interface TaskRuntimeRow {
    task_id: string;
    worktree_path: string;
    terminal_session_id: string;
    terminal_status: 'idle' | 'ready' | 'active';
    created_at: string;
    updated_at: string;
}

function buildWorktreePath(taskId: string): string {
    return `./worktrees/${taskId}`;
}

function buildTerminalSessionId(taskId: string): string {
    return `terminal-${taskId}`;
}

export function createOperationsRoutes(db: Database): ReturnType<typeof require>['Router'] {
    const router = require('express').Router();
    router.use(requireAuth);

    db.exec(`
    CREATE TABLE IF NOT EXISTS task_runtime (
      task_id TEXT PRIMARY KEY,
      worktree_path TEXT NOT NULL,
      terminal_session_id TEXT NOT NULL,
      terminal_status TEXT NOT NULL DEFAULT 'ready',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

    router.post('/tasks/:id/provision', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id) as { id: string } | undefined;

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const worktree_path = buildWorktreePath(id);
            const terminal_session_id = buildTerminalSessionId(id);

            db.prepare(`
        INSERT INTO task_runtime (task_id, worktree_path, terminal_session_id, terminal_status)
        VALUES (?, ?, ?, 'ready')
        ON CONFLICT(task_id) DO UPDATE SET
          worktree_path = excluded.worktree_path,
          terminal_session_id = excluded.terminal_session_id,
          terminal_status = 'ready',
          updated_at = CURRENT_TIMESTAMP
      `).run(id, worktree_path, terminal_session_id);

            broadcastRealtimeEvent('tasks.updated', { action: 'provisioned', taskId: id });

            return res.json({
                task_id: id,
                worktree_path,
                terminal_session_id,
                terminal_status: 'ready',
            });
        } catch (error) {
            console.error('Provision task runtime error:', error);
            return res.status(500).json({ error: 'Failed to provision task runtime' });
        }
    });

    router.get('/tasks/:id/runtime', (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const runtime = db.prepare('SELECT * FROM task_runtime WHERE task_id = ?').get(id) as TaskRuntimeRow | undefined;

            if (!runtime) {
                return res.status(404).json({ error: 'Task runtime not found' });
            }

            return res.json(runtime);
        } catch (error) {
            console.error('Get task runtime error:', error);
            return res.status(500).json({ error: 'Failed to get task runtime' });
        }
    });

    router.post('/tasks/:id/terminal/activate', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const result = db.prepare(`
        UPDATE task_runtime
        SET terminal_status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE task_id = ?
      `).run(id);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Task runtime not found' });
            }

            broadcastRealtimeEvent('tasks.updated', { action: 'terminal_active', taskId: id });
            return res.json({ task_id: id, terminal_status: 'active' });
        } catch (error) {
            console.error('Activate terminal error:', error);
            return res.status(500).json({ error: 'Failed to activate terminal' });
        }
    });

    return router;
}
