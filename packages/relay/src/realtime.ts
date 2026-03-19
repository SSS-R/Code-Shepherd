import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

type RealtimeEventType = 'tasks.updated' | 'approvals.updated' | 'agents.updated' | 'workflows.updated';

interface RealtimeEvent {
    type: RealtimeEventType;
    payload: Record<string, unknown>;
    timestamp: string;
}

let wss: WebSocketServer | null = null;

export function initializeRealtime(server: HttpServer): void {
    wss = new WebSocketServer({ server, path: '/realtime' });

    wss.on('connection', (socket: WebSocket) => {
        socket.send(JSON.stringify({
            type: 'workflows.updated',
            payload: { connected: true },
            timestamp: new Date().toISOString(),
        } satisfies RealtimeEvent));
    });
}

export function broadcastRealtimeEvent(type: RealtimeEventType, payload: Record<string, unknown>): void {
    if (!wss) return;

    const message = JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
    } satisfies RealtimeEvent);

    for (const client of wss.clients) {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    }
}
