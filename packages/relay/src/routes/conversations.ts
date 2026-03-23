import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import type { CommandRecord, ConversationRecord, MessageRecord, MessageType } from '@code-shepherd/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../realtime';

function createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapConversation(row: any): ConversationRecord {
    return {
        id: row.id,
        agent_id: row.agent_id,
        task_id: row.task_id ?? null,
        title: row.title,
        status: row.status,
        participant_agent_ids: row.participant_agent_ids ? JSON.parse(row.participant_agent_ids) : [row.agent_id],
        latest_message_preview: row.latest_message_preview ?? null,
        last_message_at: row.last_message_at ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapMessage(row: any): MessageRecord {
    return {
        id: row.id,
        conversation_id: row.conversation_id,
        sender_type: row.sender_type,
        sender_id: row.sender_id,
        message_type: row.message_type,
        content: row.content,
        command_id: row.command_id ?? null,
        approval_id: row.approval_id ?? null,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        created_at: row.created_at,
    };
}

export function ensureConversationForAgent(db: Database, input: { agentId: string; title?: string; taskId?: string | null; teamId?: string | null; }): ConversationRecord {
    db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      task_id TEXT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      participant_agent_ids TEXT,
      latest_message_preview TEXT,
      last_message_at DATETIME,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

    const existing = db.prepare(`
    SELECT * FROM conversations
    WHERE agent_id = ? AND task_id IS ? AND (team_id IS ? OR team_id = ?)
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(input.agentId, input.taskId ?? null, input.teamId ?? null, input.teamId ?? null) as any;

    if (existing) {
        return mapConversation(existing);
    }

    const id = createId('conversation');
    db.prepare(`
    INSERT INTO conversations (id, agent_id, task_id, title, status, participant_agent_ids, last_message_at, team_id)
    VALUES (?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, ?)
  `).run(
        id,
        input.agentId,
        input.taskId ?? null,
        input.title ?? `Conversation with ${input.agentId}`,
        JSON.stringify([input.agentId]),
        input.teamId ?? null,
    );

    const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
    return mapConversation(created);
}

export function appendConversationMessage(db: Database, input: {
    conversationId: string;
    senderType: 'user' | 'agent' | 'system';
    senderId: string;
    content: string;
    messageType: MessageType;
    commandId?: string | null;
    approvalId?: string | null;
    metadata?: Record<string, unknown>;
}): MessageRecord {
    db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      command_id TEXT,
      approval_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);

    const id = createId('message');
    db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_type, sender_id, message_type, content, command_id, approval_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        input.conversationId,
        input.senderType,
        input.senderId,
        input.messageType,
        input.content,
        input.commandId ?? null,
        input.approvalId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
    );

    db.prepare(`
    UPDATE conversations
    SET latest_message_preview = ?, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.content.slice(0, 200), input.conversationId);

    const inserted = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
    return mapMessage(inserted);
}

export function createConversationRoutes(db: Database) {
    const router = require('express').Router();
    router.use(requireAuth);

    db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      task_id TEXT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      participant_agent_ids TEXT,
      latest_message_preview TEXT,
      last_message_at DATETIME,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      command_id TEXT,
      approval_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      target_agent_id TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);

    router.get('/', (req: Request, res: Response) => {
        try {
            const rows = db.prepare(`
        SELECT * FROM conversations
        WHERE (team_id IS ? OR team_id = ?)
        ORDER BY COALESCE(last_message_at, updated_at) DESC
      `).all(req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any[];

            return res.json(rows.map(mapConversation));
        } catch (error) {
            console.error('List conversations error:', error);
            return res.status(500).json({ error: 'Failed to list conversations' });
        }
    });

    router.post('/ensure', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const { agent_id, title, task_id } = req.body as { agent_id?: string; title?: string; task_id?: string };

            if (!agent_id) {
                return res.status(400).json({ error: 'agent_id is required' });
            }

            const existing = db.prepare(`
        SELECT * FROM conversations
        WHERE agent_id = ? AND task_id IS ? AND (team_id IS ? OR team_id = ?)
        ORDER BY updated_at DESC
        LIMIT 1
      `).get(agent_id, task_id ?? null, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (existing) {
                return res.json({ conversation: mapConversation(existing), created: false });
            }

            const conversation = ensureConversationForAgent(db, {
                agentId: agent_id,
                title,
                taskId: task_id ?? null,
                teamId: req.auth?.teamId ?? null,
            });

            broadcastRealtimeEvent('conversations.updated', { action: 'created', conversationId: conversation.id, agentId: agent_id });
            return res.status(201).json({ conversation, created: true });
        } catch (error) {
            console.error('Ensure conversation error:', error);
            return res.status(500).json({ error: 'Failed to ensure conversation' });
        }
    });

    router.get('/:id/messages', (req: Request, res: Response) => {
        try {
            const conversation = db.prepare(`
        SELECT * FROM conversations WHERE id = ? AND (team_id IS ? OR team_id = ?)
      `).get(req.params.id, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }

            const messages = db.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
      `).all(req.params.id) as any[];

            return res.json({ conversation: mapConversation(conversation), messages: messages.map(mapMessage) });
        } catch (error) {
            console.error('Conversation messages error:', error);
            return res.status(500).json({ error: 'Failed to load conversation messages' });
        }
    });

    router.post('/:id/messages', requireRole(['Admin', 'Developer']), (req: Request, res: Response) => {
        try {
            const conversation = db.prepare(`
        SELECT * FROM conversations WHERE id = ? AND (team_id IS ? OR team_id = ?)
      `).get(req.params.id, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }

            const { content, target_agent_id, message_type, metadata } = req.body as {
                content?: string;
                target_agent_id?: string;
                message_type?: 'text' | 'command';
                metadata?: Record<string, unknown>;
            };

            if (!content || !target_agent_id) {
                return res.status(400).json({ error: 'content and target_agent_id are required' });
            }

            const commandId = createId('command');
            db.prepare(`
        INSERT INTO commands (id, conversation_id, target_agent_id, issued_by, content, status, metadata)
        VALUES (?, ?, ?, ?, ?, 'queued', ?)
      `).run(
                commandId,
                req.params.id,
                target_agent_id,
                req.auth?.userId ?? 'dashboard-user',
                content,
                metadata ? JSON.stringify(metadata) : null,
            );

            const message = appendConversationMessage(db, {
                conversationId: req.params.id,
                senderType: 'user',
                senderId: req.auth?.userId ?? 'dashboard-user',
                content,
                messageType: message_type ?? 'command',
                commandId,
                metadata,
            });

            appendConversationMessage(db, {
                conversationId: req.params.id,
                senderType: 'system',
                senderId: 'code-shepherd',
                content: `Command queued for ${target_agent_id}`,
                messageType: 'status',
                commandId,
                metadata: { target_agent_id },
            });

            const command = db.prepare('SELECT * FROM commands WHERE id = ?').get(commandId) as any;
            const mappedCommand: CommandRecord = {
                id: command.id,
                conversation_id: command.conversation_id,
                target_agent_id: command.target_agent_id,
                issued_by: command.issued_by,
                content: command.content,
                status: command.status,
                metadata: command.metadata ? JSON.parse(command.metadata) : undefined,
                created_at: command.created_at,
                updated_at: command.updated_at,
            };

            broadcastRealtimeEvent('conversations.updated', {
                action: 'message.created',
                conversationId: req.params.id,
                agentId: target_agent_id,
                commandId,
            });

            return res.status(201).json({ message, command: mappedCommand });
        } catch (error) {
            console.error('Create conversation message error:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    });

    router.post('/:id/replies', (req: Request, res: Response) => {
        try {
            const conversation = db.prepare(`
        SELECT * FROM conversations WHERE id = ? AND (team_id IS ? OR team_id = ?)
      `).get(req.params.id, req.auth?.teamId ?? null, req.auth?.teamId ?? null) as any;

            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }

            const { agent_id, content, message_type, command_id, metadata } = req.body as {
                agent_id?: string;
                content?: string;
                message_type?: 'text' | 'status' | 'artifact' | 'event';
                command_id?: string;
                metadata?: Record<string, unknown>;
            };

            if (!agent_id || !content) {
                return res.status(400).json({ error: 'agent_id and content are required' });
            }

            const message = appendConversationMessage(db, {
                conversationId: req.params.id,
                senderType: 'agent',
                senderId: agent_id,
                content,
                messageType: message_type ?? 'text',
                commandId: command_id ?? null,
                metadata,
            });

            if (command_id) {
                db.prepare(`
          UPDATE commands
          SET status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(command_id);
            }

            db.prepare(`
        INSERT INTO audit_logs (event_type, event_details, agent_id, team_id)
        VALUES ('agent_reply_received', ?, ?, ?)
      `).run(JSON.stringify({ conversation_id: req.params.id, command_id: command_id ?? null, message_type: message.message_type }), agent_id, req.auth?.teamId ?? null);

            broadcastRealtimeEvent('conversations.updated', {
                action: 'reply.received',
                conversationId: req.params.id,
                agentId: agent_id,
                commandId: command_id ?? null,
            });

            return res.status(201).json({ message });
        } catch (error) {
            console.error('Create agent reply error:', error);
            return res.status(500).json({ error: 'Failed to store agent reply' });
        }
    });

    return router;
}
