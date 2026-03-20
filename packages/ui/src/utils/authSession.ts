export interface StoredSession {
    userId: string;
    teamId: string | null;
    role: 'Admin' | 'Developer' | 'Viewer';
    name?: string;
    email?: string;
}

const SESSION_KEY = 'agentops.session';

export function loadSession(): StoredSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) as StoredSession : null;
    } catch {
        return null;
    }
}

export function saveSession(session: StoredSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

export function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
    const session = loadSession();
    return {
        'Content-Type': 'application/json',
        ...(session ? {
            'x-user-id': session.userId,
            'x-team-id': session.teamId ?? '',
            'x-role': session.role,
        } : {}),
        ...(extra || {}),
    };
}
