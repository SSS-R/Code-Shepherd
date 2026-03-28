import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildAuthHeaders, loadSession } from '../../utils/authSession'

type GuideFeedback = 'up' | 'down' | null
type GuideConnectionState = 'connected' | 'fallback' | 'loading'

interface RelayMessageRecord {
    id: string
    sender_type: 'user' | 'agent' | 'system'
    content: string
    metadata?: Record<string, unknown>
    created_at: string
}

export interface ShepherdGuideMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    code?: string | null
    feedback?: GuideFeedback
}

interface ShepherdGuideContextValue {
    isOpen: boolean
    hasUnread: boolean
    unreadCount: number
    previewVisible: boolean
    previewMessage: ShepherdGuideMessage | null
    messages: ShepherdGuideMessage[]
    connectionState: GuideConnectionState
    isLoading: boolean
    isSending: boolean
    openGuide: () => void
    closeGuide: () => void
    dismissPreview: () => void
    sendMessage: (content: string) => Promise<void>
    submitFeedback: (messageId: string, feedback: Exclude<GuideFeedback, null>) => Promise<void>
}

const ShepherdGuideContext = createContext<ShepherdGuideContextValue | null>(null)
const GUIDE_AGENT_ID = 'shepherd-guide'

const defaultMessages: ShepherdGuideMessage[] = [
    {
        id: 'guide-hello',
        role: 'assistant',
        content: 'I can help with Code Shepherd screens, approvals, connectors, tasks, and troubleshooting. Ask product-specific questions and I will guide you inline.',
        timestamp: 'NOW',
        code: null,
    },
    {
        id: 'guide-code',
        role: 'assistant',
        content: 'For example, if you want to connect an agent, I can explain the adapter path and where to configure it.',
        timestamp: 'NOW',
        code: 'CONNECTOR TYPES\n- Native connector\n- MCP connector\n- Bridge connector\n- Direct session path\n- OpenClaw via MCP',
    },
]

const cannedResponses: Array<{ match: RegExp; response: string }> = [
    { match: /connect|connector|agent/i, response: 'To connect an agent, open Settings, register a connector, and confirm the adapter type. MCP and bridge connectors are the main paths in the current product model, and OpenClaw should be connected through MCP rather than treated as a separate guide model.' },
    { match: /approval|risk/i, response: 'Approvals appear both in the Approval Queue and in related context surfaces. High-risk actions should always keep thread context and audit trace together.' },
    { match: /task|kanban|board/i, response: 'The Task Board is your coordination surface. Ready, Active, Validation, and Action Required columns reflect operational state across agents.' },
    { match: /timeline|audit|log/i, response: 'Timeline / Audit Log is where state changes, approvals, reconnects, and failures are preserved as the product audit trail.' },
]

function formatTimestamp(value: string) {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()
}

function createLocalTimestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()
}

function mapRelayMessage(message: RelayMessageRecord): ShepherdGuideMessage {
    const code = typeof message.metadata?.code === 'string' ? message.metadata.code : null
    const feedback = message.metadata?.guide_feedback

    return {
        id: message.id,
        role: message.sender_type === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: formatTimestamp(message.created_at),
        code,
        feedback: feedback === 'up' || feedback === 'down' ? feedback : null,
    }
}

function buildFallbackReply(content: string): ShepherdGuideMessage {
    const matched = cannedResponses.find((entry) => entry.match.test(content))

    return {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        content: matched?.response ?? 'I can answer questions about Code Shepherd only. Ask about agents, connectors, approvals, inbox flows, tasks, settings, or troubleshooting.',
        timestamp: createLocalTimestamp(),
        code: /connect|connector/i.test(content)
            ? 'SETTINGS -> ADAPTER CONNECTORS -> ADD NEW CONNECTOR\nChoose connector type\nValidate transport\nConfirm trust state\nUse MCP for OpenClaw'
            : null,
        feedback: null,
    }
}

export function ShepherdGuideProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(true)
    const [hasUnread, setHasUnread] = useState(true)
    const [messages, setMessages] = useState<ShepherdGuideMessage[]>(defaultMessages)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [connectionState, setConnectionState] = useState<GuideConnectionState>('loading')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const lastAssistantIdRef = useRef<string | null>(null)

    const assistantMessages = useMemo(
        () => messages.filter((message) => message.role === 'assistant'),
        [messages],
    )
    const previewMessage = assistantMessages.at(-1) ?? null

    useEffect(() => {
        if (!previewVisible || isOpen) return
        const timer = window.setTimeout(() => setPreviewVisible(false), 8000)
        return () => window.clearTimeout(timer)
    }, [previewVisible, isOpen])

    useEffect(() => {
        let cancelled = false

        async function initializeGuide() {
            const session = loadSession()

            if (!session) {
                if (!cancelled) {
                    setConversationId(null)
                    setConnectionState('fallback')
                    setMessages(defaultMessages)
                    setIsLoading(false)
                }
                return
            }

            try {
                const ensureResponse = await fetch('http://localhost:3000/conversations/ensure', {
                    method: 'POST',
                    headers: buildAuthHeaders(),
                    body: JSON.stringify({
                        agent_id: GUIDE_AGENT_ID,
                        title: 'Shepherd Guide',
                    }),
                })

                if (!ensureResponse.ok) {
                    throw new Error('Failed to ensure guide conversation')
                }

                const ensured = await ensureResponse.json() as { conversation?: { id?: string } }
                const nextConversationId = ensured.conversation?.id ?? null

                if (!nextConversationId) {
                    throw new Error('Guide conversation id missing')
                }

                const messagesResponse = await fetch(`http://localhost:3000/conversations/${nextConversationId}/messages`, {
                    headers: buildAuthHeaders(),
                })

                if (!messagesResponse.ok) {
                    throw new Error('Failed to load guide messages')
                }

                const data = await messagesResponse.json() as { messages?: RelayMessageRecord[] }

                if (!cancelled) {
                    setConversationId(nextConversationId)
                    setMessages(data.messages?.length ? data.messages.map(mapRelayMessage) : defaultMessages)
                    setConnectionState('connected')
                    setIsLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setConversationId(null)
                    setConnectionState('fallback')
                    setMessages(defaultMessages)
                    setIsLoading(false)
                }
            }
        }

        void initializeGuide()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const lastAssistant = assistantMessages.at(-1)

        if (!lastAssistant) {
            return
        }

        if (isOpen) {
            lastAssistantIdRef.current = lastAssistant.id
            setHasUnread(false)
            return
        }

        if (!lastAssistantIdRef.current) {
            lastAssistantIdRef.current = lastAssistant.id
            return
        }

        if (lastAssistant.id !== lastAssistantIdRef.current) {
            lastAssistantIdRef.current = lastAssistant.id
            setHasUnread(true)
            setPreviewVisible(true)
        }
    }, [assistantMessages, isOpen])

    const openGuide = () => {
        setIsOpen(true)
        setPreviewVisible(false)
        setHasUnread(false)
        lastAssistantIdRef.current = previewMessage?.id ?? lastAssistantIdRef.current
    }

    const closeGuide = () => {
        setIsOpen(false)
    }

    const dismissPreview = () => {
        setPreviewVisible(false)
    }

    const sendMessage = async (content: string) => {
        const trimmed = content.trim()
        if (!trimmed) return

        if (connectionState !== 'connected' || !conversationId) {
            const now = createLocalTimestamp()
            const userMessage: ShepherdGuideMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: trimmed,
                timestamp: now,
            }

            setMessages((current) => [...current, userMessage, buildFallbackReply(trimmed)])
            return
        }

        setIsSending(true)

        try {
            const response = await fetch(`http://localhost:3000/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: buildAuthHeaders(),
                body: JSON.stringify({
                    content: trimmed,
                    target_agent_id: GUIDE_AGENT_ID,
                    message_type: 'text',
                    metadata: { source: 'shepherd-guide-ui' },
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to send guide message')
            }

            const data = await response.json() as { message?: RelayMessageRecord; reply?: RelayMessageRecord }
            const nextMessages = [data.message, data.reply].filter(Boolean).map((message) => mapRelayMessage(message as RelayMessageRecord))

            setMessages((current) => [...current, ...nextMessages])
        } catch {
            const now = createLocalTimestamp()
            const userMessage: ShepherdGuideMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: trimmed,
                timestamp: now,
            }

            setConnectionState('fallback')
            setConversationId(null)
            setMessages((current) => [...current, userMessage, buildFallbackReply(trimmed)])
        } finally {
            setIsSending(false)
        }
    }

    const submitFeedback = async (messageId: string, feedback: Exclude<GuideFeedback, null>) => {
        setMessages((current) => current.map((message) => (
            message.id === messageId
                ? { ...message, feedback }
                : message
        )))

        if (connectionState !== 'connected') {
            return
        }

        try {
            const response = await fetch(`http://localhost:3000/conversations/messages/${messageId}/feedback`, {
                method: 'PATCH',
                headers: buildAuthHeaders(),
                body: JSON.stringify({ feedback }),
            })

            if (!response.ok) {
                throw new Error('Failed to submit guide feedback')
            }

            const data = await response.json() as { message?: RelayMessageRecord }
            if (data.message) {
                setMessages((current) => current.map((message) => (
                    message.id === messageId
                        ? mapRelayMessage(data.message as RelayMessageRecord)
                        : message
                )))
            }
        } catch {
            // Keep optimistic state in the UI.
        }
    }

    const value = useMemo<ShepherdGuideContextValue>(() => ({
        isOpen,
        hasUnread,
        unreadCount: hasUnread ? 1 : 0,
        previewVisible,
        previewMessage,
        messages,
        connectionState,
        isLoading,
        isSending,
        openGuide,
        closeGuide,
        dismissPreview,
        sendMessage,
        submitFeedback,
    }), [isOpen, hasUnread, previewVisible, previewMessage, messages, connectionState, isLoading, isSending])

    return <ShepherdGuideContext.Provider value={value}>{children}</ShepherdGuideContext.Provider>
}

export function useShepherdGuide() {
    const context = useContext(ShepherdGuideContext)
    if (!context) {
        throw new Error('useShepherdGuide must be used inside ShepherdGuideProvider')
    }
    return context
}
