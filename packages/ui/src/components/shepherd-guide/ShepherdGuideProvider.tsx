import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

export interface ShepherdGuideMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    code?: string | null
}

interface ShepherdGuideContextValue {
    isOpen: boolean
    hasUnread: boolean
    unreadCount: number
    previewVisible: boolean
    previewMessage: ShepherdGuideMessage | null
    messages: ShepherdGuideMessage[]
    openGuide: () => void
    closeGuide: () => void
    dismissPreview: () => void
    sendMessage: (content: string) => void
}

const ShepherdGuideContext = createContext<ShepherdGuideContextValue | null>(null)

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
        code: 'CONNECTOR TYPES\n- Native connector\n- MCP connector\n- Bridge connector\n- Direct session path',
    },
]

const cannedResponses: Array<{ match: RegExp; response: string }> = [
    { match: /connect|connector|agent/i, response: 'To connect an agent, open Settings, register a connector, and confirm the adapter type. MCP and bridge connectors are the main paths in the current product model.' },
    { match: /approval|risk/i, response: 'Approvals appear both in the Approval Queue and in related context surfaces. High-risk actions should always keep thread context and audit trace together.' },
    { match: /task|kanban|board/i, response: 'The Task Board is your coordination surface. Ready, Active, Validation, and Action Required columns reflect operational state across agents.' },
    { match: /timeline|audit|log/i, response: 'Timeline / Audit Log is where state changes, approvals, reconnects, and failures are preserved as the product audit trail.' },
]

export function ShepherdGuideProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [previewVisible, setPreviewVisible] = useState(true)
    const [hasUnread, setHasUnread] = useState(true)
    const [messages, setMessages] = useState<ShepherdGuideMessage[]>(defaultMessages)

    const previewMessage = messages.filter((message) => message.role === 'assistant').at(-1) ?? null

    useEffect(() => {
        if (!previewVisible || isOpen) return
        const timer = window.setTimeout(() => setPreviewVisible(false), 8000)
        return () => window.clearTimeout(timer)
    }, [previewVisible, isOpen])

    const openGuide = () => {
        setIsOpen(true)
        setPreviewVisible(false)
        setHasUnread(false)
    }

    const closeGuide = () => {
        setIsOpen(false)
    }

    const dismissPreview = () => {
        setPreviewVisible(false)
    }

    const sendMessage = (content: string) => {
        const trimmed = content.trim()
        if (!trimmed) return

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()
        const userMessage: ShepherdGuideMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: now,
        }

        const matched = cannedResponses.find((entry) => entry.match.test(trimmed))
        const assistantMessage: ShepherdGuideMessage = {
            id: `assistant-${Date.now() + 1}`,
            role: 'assistant',
            content: matched?.response ?? 'I can answer questions about Code Shepherd only. Ask about agents, connectors, approvals, inbox flows, tasks, settings, or troubleshooting.',
            timestamp: now,
            code: /connect|connector/i.test(trimmed)
                ? 'SETTINGS → ADAPTER CONNECTORS → ADD NEW CONNECTOR\nChoose connector type\nValidate transport\nConfirm trust state'
                : null,
        }

        setMessages((current) => [...current, userMessage, assistantMessage])
    }

    const value = useMemo<ShepherdGuideContextValue>(() => ({
        isOpen,
        hasUnread,
        unreadCount: hasUnread ? 1 : 0,
        previewVisible,
        previewMessage,
        messages,
        openGuide,
        closeGuide,
        dismissPreview,
        sendMessage,
    }), [isOpen, hasUnread, previewVisible, previewMessage, messages])

    return <ShepherdGuideContext.Provider value={value}>{children}</ShepherdGuideContext.Provider>
}

export function useShepherdGuide() {
    const context = useContext(ShepherdGuideContext)
    if (!context) {
        throw new Error('useShepherdGuide must be used inside ShepherdGuideProvider')
    }
    return context
}
