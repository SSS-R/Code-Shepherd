import type { IncomingMessage, Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { ACCESS_COOKIE_NAME, parseCookies, verifyAccessToken } from './utils/authSecurity';

type RealtimeEventType = 'tasks.updated' | 'approvals.updated' | 'agents.updated' | 'workflows.updated' | 'conversations.updated' | 'connectors.updated';

interface RealtimeEvent {
    type: RealtimeEventType;
    payload: Record<string, unknown>;
    timestamp: string;
}

let wss: WebSocketServer | null = null;

function authenticateRequest(request: IncomingMessage) {
    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
    const cookies = parseCookies(request.headers.cookie);
    const cookieToken = cookies[ACCESS_COOKIE_NAME];
    return verifyAccessToken(bearerToken || cookieToken || '');
}

export function initializeRealtime(server: HttpServer): void {
    wss = new WebSocketServer({
        server,
        path: '/realtime',
        verifyClient: ({ req }, done) => {
            const payload = authenticateRequest(req);
            if (!payload) {
                done(false, 401, 'Unauthorized');
                return;
            }

            done(true);
        },
    });

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
