import { useEffect, useMemo, useState } from 'react'
import { Bot, MessageSquare, Send, ShieldAlert } from 'lucide-react'
import { buildAuthHeaders, loadSession } from '../utils/authSession'

interface Conversation {
    id: string
    agent_id: string
    title: string
    status: string
    latest_message_preview?: string | null
    last_message_at?: string | null
}

interface Message {
    id: string
    conversation_id: string
    sender_type: 'user' | 'agent' | 'system'
    sender_id: string
    message_type: string
    content: string
    approval_id?: string | null
    created_at: string
}

interface InboxProps {
    initialAgentId?: string | null
}

export default function Inbox({ initialAgentId = null }: InboxProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [draft, setDraft] = useState('')
    const [loading, setLoading] = useState(true)
    const session = loadSession()

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
        [conversations, selectedConversationId],
    )

    useEffect(() => {
        fetch('http://localhost:3000/conversations', { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then(async (data: Conversation[]) => {
                let nextConversations = data
                let nextSelected = data[0]?.id ?? null

                if (initialAgentId) {
                    const existing = data.find((conversation) => conversation.agent_id === initialAgentId)

                    if (existing) {
                        nextSelected = existing.id
                    } else {
                        const ensureRes = await fetch('http://localhost:3000/conversations/ensure', {
                            method: 'POST',
                            headers: buildAuthHeaders(),
                            body: JSON.stringify({ agent_id: initialAgentId, title: `Conversation with ${initialAgentId}` }),
                        })

                        if (ensureRes.ok) {
                            const ensured = await ensureRes.json()
                            nextConversations = [ensured.conversation, ...data]
                            nextSelected = ensured.conversation.id
                        }
                    }
                }

                setConversations(nextConversations)
                setSelectedConversationId(nextSelected)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [initialAgentId])

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([])
            return
        }

        fetch(`http://localhost:3000/conversations/${selectedConversationId}/messages`, { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then((data) => setMessages(data.messages || []))
            .catch(() => setMessages([]))
    }, [selectedConversationId])

    const sendMessage = async () => {
        if (!selectedConversation || !draft.trim()) return

        const res = await fetch(`http://localhost:3000/conversations/${selectedConversation.id}/messages`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({
                content: draft.trim(),
                target_agent_id: selectedConversation.agent_id,
                message_type: 'command',
                metadata: { issued_by_name: session?.name ?? session?.userId ?? 'dashboard-user' },
            }),
        })

        if (res.ok) {
            setDraft('')
            const refresh = await fetch(`http://localhost:3000/conversations/${selectedConversation.id}/messages`, { headers: buildAuthHeaders() })
            if (refresh.ok) {
                const data = await refresh.json()
                setMessages(data.messages || [])
            }
        }
    }

    if (loading) {
        return <div className="glass rounded-xl p-8 text-[15px] text-[var(--text-secondary)]">Loading inbox...</div>
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="glass rounded-xl p-4 md:p-5">
                <div className="mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                    <MessageSquare size={18} />
                    <h2 className="text-lg font-semibold">Inbox</h2>
                </div>

                <div className="space-y-3">
                    {conversations.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                            No conversations yet.
                        </div>
                    ) : conversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() => setSelectedConversationId(conversation.id)}
                            className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedConversationId === conversation.id ? 'border-blue-500/30 bg-blue-500/10' : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    <Bot size={16} /> {conversation.agent_id}
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">{conversation.status}</span>
                            </div>
                            <div className="mt-2 text-sm text-[var(--text-secondary)]">{conversation.title}</div>
                            <div className="mt-2 text-xs text-[var(--text-muted)]">{conversation.latest_message_preview || 'No messages yet'}</div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="glass rounded-xl p-4 md:p-6">
                {selectedConversation ? (
                    <>
                        <div className="mb-4 border-b border-[var(--border-subtle)] pb-4">
                            <h3 className="text-xl font-semibold text-[var(--text-primary)]">{selectedConversation.title}</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">Agent: {selectedConversation.agent_id}</p>
                        </div>

                        <div className="space-y-3">
                            {messages.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-6 text-sm text-[var(--text-secondary)]">
                                    No messages yet. Send the first instruction to this agent.
                                </div>
                            ) : messages.map((message) => {
                                const isUser = message.sender_type === 'user'
                                const isApproval = message.message_type === 'approval-request' || message.message_type === 'approval-decision'

                                return (
                                    <div
                                        key={message.id}
                                        className={`rounded-xl border p-4 ${isApproval ? 'border-amber-500/30 bg-amber-500/10' : isUser ? 'border-blue-500/30 bg-blue-500/10' : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'}`}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                                            <span className="inline-flex items-center gap-2">
                                                {isApproval && <ShieldAlert size={14} />}
                                                {message.sender_type} · {message.message_type}
                                            </span>
                                            <span>{new Date(message.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">{message.content}</div>
                                        {message.approval_id && (
                                            <div className="mt-3 text-xs text-[var(--text-secondary)]">Approval ID: {message.approval_id}</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                rows={3}
                                placeholder="Give the agent a command or ask a follow-up question"
                                className="surface-panel min-h-[96px] flex-1 rounded-xl px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                            />
                            <button onClick={() => void sendMessage()} className="btn-primary h-fit rounded-xl px-4 py-3 text-sm font-medium">
                                <span className="inline-flex items-center gap-2"><Send size={16} /> Send</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg border border-dashed border-[var(--border-subtle)] p-10 text-center text-sm text-[var(--text-secondary)]">
                        Select a conversation to inspect messages, approvals, and commands.
                    </div>
                )}
            </section>
        </div>
    )
}
