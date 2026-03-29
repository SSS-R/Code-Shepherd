import { buildAuthHeaders } from './authSession'

const relayEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

export const RELAY_BASE_URL = relayEnv?.VITE_RELAY_URL ?? 'http://localhost:3000'

export type ThemeMode = 'dark' | 'light'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface AgentRecord {
    id: string
    name: string
    capabilities: string[]
    connector_id?: string | null
    adapter_id?: string | null
    runtime_transport?: string | null
    status: 'online' | 'offline' | 'degraded' | 'connecting'
    last_heartbeat: string
    created_at?: string
}

export interface ApprovalRecord {
    id: string
    agent_id: string
    conversation_id?: string | null
    command_id?: string | null
    action_type: string
    summary: string | null
    action_details: Record<string, unknown>
    risk_level: RiskLevel
    risk_reason: string | null
    status: string
    decision?: string | null
    requested_at: string
    decided_at?: string | null
    diff?: string | null
    is_new_file?: boolean
}

export interface ConversationRecord {
    id: string
    agent_id: string
    task_id?: string | null
    title: string
    status: string
    latest_message_preview?: string | null
    last_message_at?: string | null
    participant_agent_ids?: string[]
    created_at: string
    updated_at: string
}

export interface MessageRecord {
    id: string
    conversation_id: string
    sender_type: 'user' | 'agent' | 'system'
    sender_id: string
    message_type: string
    content: string
    command_id?: string | null
    approval_id?: string | null
    metadata?: Record<string, unknown>
    created_at: string
}

export interface ConversationMessagesResponse {
    conversation: ConversationRecord
    messages: MessageRecord[]
}

export type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done' | 'Failed'
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export interface TaskRecord {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    labels: string[]
    blocked_by_task_id?: string | null
    assigned_agent_id: string | null
    created_at?: string
    updated_at?: string
}

export interface ConnectorRecord {
    id?: string
    connector_id: string
    connector_name: string
    adapter_kind: string
    transport: string
    trust_status: string
    scopes: string[]
    last_verified_at?: string | null
    revoked_at?: string | null
    connector_secret?: string
}

export interface PairingSessionResponse {
    pairing_code: string
    relay_url: string
    connector_id: string
    connector_name: string
    agent_id: string
    agent_name: string
    adapter_id: string
    agent_capabilities: string[]
    expires_at: string
    session_file?: string
    launch_command: string
}

export interface AgentModelOption {
    id: string
    label: string
    provider?: string
    default?: boolean
}

export interface AgentModelsResponse {
    agent_id: string
    adapter_id: string
    adapter_label: string
    description: string
    model_selection_mode: 'direct' | 'advisory'
    supports_custom_model: boolean
    launch_behavior: 'roundtrip' | 'handoff'
    models: AgentModelOption[]
}

export interface AuditEvent {
    id: number
    event_type: string
    event_details: Record<string, unknown>
    agent_id: string | null
    approval_id: string | null
    timestamp: string
    icon: string
    category: 'tool' | 'approval' | 'system'
    status: 'success' | 'failure' | 'pending'
}

export interface OperatorPreferences {
    theme_mode: ThemeMode
    density_mode: boolean
    motion_reduction: boolean
    desktop_notifications: boolean
    auto_scale_workers: boolean
}

export interface MeResponse {
    user: {
        id: string
        email: string | null
        name: string | null
        created_at: string | null
    }
    teams: Array<{ id: string; name: string; role: string }>
    activeTeam: { id: string; name: string; role: string } | null
    role: string
    preferences: OperatorPreferences
}

export interface RelayHealthResponse {
    status: string
    temporal: string
    agents: { count: number }
}

export interface ParallelSession {
    task_id: string
    title: string
    assigned_agent_id: string | null
    terminal_status: string
    worktree_path?: string
    terminal_session_id?: string
    updated_at?: string
}

export interface RealtimeEvent {
    type: 'tasks.updated' | 'approvals.updated' | 'agents.updated' | 'workflows.updated' | 'conversations.updated' | 'connectors.updated'
    payload: Record<string, unknown>
    timestamp: string
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
    const headers = new Headers(buildAuthHeaders())
    const extraHeaders = new Headers(extra)
    extraHeaders.forEach((value, key) => headers.set(key, value))
    return headers
}

let refreshPromise: Promise<void> | null = null

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`
        try {
            const errorBody = await response.json() as { error?: string }
            if (errorBody.error) {
                message = errorBody.error
            }
        } catch {
            // Ignore non-JSON error bodies.
        }
        throw new Error(message)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

async function attemptRefresh(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = fetch(`${RELAY_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: buildHeaders(),
        }).then(async (response) => {
            if (!response.ok) {
                throw new Error('Unable to refresh session')
            }
        }).finally(() => {
            refreshPromise = null
        })
    }

    return refreshPromise
}

export async function relayFetch<T>(path: string, init?: RequestInit, hasRetried = false): Promise<T> {
    const response = await fetch(`${RELAY_BASE_URL}${path}`, {
        ...init,
        headers: buildHeaders(init?.headers),
        credentials: 'include',
    })

    if (response.status === 401 && !hasRetried && !path.startsWith('/auth/')) {
        await attemptRefresh()
        return relayFetch<T>(path, init, true)
    }

    return parseResponse<T>(response)
}

export function createClientId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatRelativeTime(value?: string | null): string {
    if (!value) return 'Just now'

    const date = new Date(value)
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes <= 0) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
}

export function relayWsUrl(): string {
    const url = new URL(RELAY_BASE_URL)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/realtime'
    url.search = ''
    return url.toString()
}
