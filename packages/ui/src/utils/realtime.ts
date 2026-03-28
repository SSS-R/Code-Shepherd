import { useEffect, useMemo, useState } from 'react'
import { AuditEvent, RealtimeEvent, relayFetch, relayWsUrl } from './relay'

export interface NotificationItem {
    id: string
    title: string
    description: string
    tone: 'info' | 'success' | 'warning' | 'error'
    timestamp: string
    unread: boolean
}

function toneFromAudit(event: AuditEvent): NotificationItem['tone'] {
    if (event.status === 'failure') return 'error'
    if (event.status === 'pending') return 'warning'
    if (event.category === 'approval') return 'warning'
    return 'success'
}

function titleFromAudit(event: AuditEvent): string {
    return event.event_type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function descriptionFromAudit(event: AuditEvent): string {
    const details = event.event_details

    if (event.event_type === 'approval_requested') {
        return `${String(details.action_type ?? 'Action')} from ${event.agent_id ?? 'system'} is waiting for review.`
    }

    if (event.event_type === 'approval_decided') {
        return `Approval ${String(details.decision ?? 'update')} was recorded in the relay audit trail.`
    }

    if (event.event_type === 'agent_reply_received') {
        return `${event.agent_id ?? 'An agent'} replied in a tracked conversation.`
    }

    if (event.event_type === 'connector_trusted') {
        return `${String(details.connector_name ?? details.connector_id ?? 'Connector')} was trusted and is ready to use.`
    }

    return `Event recorded at ${new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
}

function auditToNotification(event: AuditEvent): NotificationItem {
    return {
        id: `audit-${event.id}`,
        title: titleFromAudit(event),
        description: descriptionFromAudit(event),
        tone: toneFromAudit(event),
        timestamp: event.timestamp,
        unread: false,
    }
}

function realtimeToNotification(event: RealtimeEvent): NotificationItem | null {
    if (event.type === 'workflows.updated' && event.payload.connected) {
        return null
    }

    const action = String(event.payload.action ?? 'updated')
    const entityId = String(
        event.payload.approvalId
        ?? event.payload.agentId
        ?? event.payload.taskId
        ?? event.payload.conversationId
        ?? event.payload.connectorId
        ?? action,
    )

    const titleMap: Record<RealtimeEvent['type'], string> = {
        'agents.updated': 'Agent Registry Update',
        'approvals.updated': 'Approval Queue Update',
        'tasks.updated': 'Task Board Update',
        'workflows.updated': 'Workflow Update',
        'conversations.updated': 'Conversation Update',
        'connectors.updated': 'Connector Update',
    }

    const tone: NotificationItem['tone'] =
        event.type === 'approvals.updated'
            ? action === 'updated' ? 'success' : 'warning'
            : event.type === 'connectors.updated' && action === 'revoked'
                ? 'error'
                : 'info'

    return {
        id: `rt-${event.type}-${entityId}-${event.timestamp}`,
        title: titleMap[event.type],
        description: `${action.replace(/\./g, ' ')} event received for ${entityId}.`,
        tone,
        timestamp: event.timestamp,
        unread: true,
    }
}

export function useRealtimeNotifications(enabled: boolean) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])

    useEffect(() => {
        if (!enabled) {
            setNotifications([])
            return
        }

        let cancelled = false

        const loadInitial = async () => {
            try {
                const events = await relayFetch<AuditEvent[]>('/audit-logs?limit=12')
                if (!cancelled) {
                    setNotifications(events.map(auditToNotification))
                }
            } catch {
                if (!cancelled) {
                    setNotifications([])
                }
            }
        }

        void loadInitial()

        return () => {
            cancelled = true
        }
    }, [enabled])

    useEffect(() => {
        if (!enabled) return

        const socket = new WebSocket(relayWsUrl())
        let reconnectTimer: number | null = null

        const connect = () => {
            socket.onmessage = (message) => {
                try {
                    const event = JSON.parse(message.data) as RealtimeEvent
                    const next = realtimeToNotification(event)
                    if (!next) return

                    setNotifications((current) => [next, ...current].slice(0, 20))
                } catch {
                    // Ignore malformed realtime events.
                }
            }
        }

        connect()

        socket.onclose = () => {
            reconnectTimer = window.setTimeout(() => {
                setNotifications((current) => current)
            }, 2000)
        }

        return () => {
            if (reconnectTimer) {
                window.clearTimeout(reconnectTimer)
            }
            socket.close()
        }
    }, [enabled])

    const unreadCount = useMemo(
        () => notifications.filter((notification) => notification.unread).length,
        [notifications],
    )

    const markAllRead = () => {
        setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))
    }

    return {
        notifications,
        unreadCount,
        markAllRead,
    }
}
