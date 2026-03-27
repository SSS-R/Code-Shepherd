import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Activity,
    Bot,
    Codesandbox,
    HelpCircle,
    History,
    Info,
    List,
    Paperclip,
    PlusSquare,
    Search,
    Send,
    ShieldAlert,
    Terminal,
} from 'lucide-react'
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

function formatTime(value?: string | null) {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getConversationTone(status: string, active: boolean) {
    const normalized = status.toUpperCase()
    if (active) return { badgeClass: 'text-success', diamond: 'success', containerClass: 'bg-surface-container' }
    if (normalized.includes('APPROVAL') || normalized.includes('WAITING') || normalized.includes('PENDING')) {
        return { badgeClass: 'text-warning', diamond: 'warning', containerClass: 'bg-surface-container-low' }
    }
    if (normalized.includes('BLOCK') || normalized.includes('ERROR')) {
        return { badgeClass: 'text-error', diamond: 'error', containerClass: 'bg-surface-container-low' }
    }
    return { badgeClass: 'text-on-surface-variant', diamond: 'info', containerClass: 'bg-surface-container-low' }
}

export default function Inbox({ initialAgentId = null }: InboxProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [draft, setDraft] = useState('')
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [mobileListOpen, setMobileListOpen] = useState(true)
    const session = loadSession()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
        [conversations, selectedConversationId],
    )

    const filteredConversations = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return conversations

        return conversations.filter((conversation) =>
            [conversation.agent_id, conversation.title, conversation.latest_message_preview, conversation.status]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(normalized),
        )
    }, [conversations, query])

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

        setMobileListOpen(false)

        fetch(`http://localhost:3000/conversations/${selectedConversationId}/messages`, { headers: buildAuthHeaders() })
            .then((res) => res.json())
            .then((data) => {
                setMessages(data.messages || [])
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            })
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
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_72px]">
            <section className={`${mobileListOpen ? 'flex' : 'hidden'} surface-card-alt border-r border-outline-variant/20 xl:flex xl:min-h-[calc(100vh-8rem)] xl:w-[280px] xl:flex-col`}>
                <div className="flex min-h-0 w-full flex-col">
                    <div className="border-b border-outline-variant/20 px-4 py-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="mb-1 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Unified Communication</p>
                                <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Active Sessions</h2>
                            </div>
                            <button className="focus-ring flex h-10 w-10 items-center justify-center bg-surface-container text-primary hover:bg-surface-bright">
                                <PlusSquare size={18} />
                            </button>
                        </div>

                        <label className="relative block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="focus-ring w-full bg-surface-container-lowest py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant"
                                placeholder="Filter sessions"
                                type="text"
                            />
                        </label>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3">
                        {filteredConversations.length === 0 ? (
                            <div className="px-3 py-10 text-center text-on-surface-variant">
                                <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em]">No Threads Found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isActive = selectedConversationId === conv.id
                                const tone = getConversationTone(conv.status, isActive)

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversationId(conv.id)}
                                        className={`focus-ring mb-3 w-full border-l-2 px-3 py-3 text-left transition-colors ${isActive ? 'border-primary bg-surface-container' : 'border-transparent bg-surface-container-low hover:bg-surface-container'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center bg-surface-container-highest text-on-surface-variant">
                                                <Bot size={18} />
                                                <span className={`status-diamond ${tone.diamond} absolute -bottom-1 -right-1`}></span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-start justify-between gap-2">
                                                    <span className={`font-headline text-[12px] font-semibold uppercase tracking-[0.08em] ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{conv.agent_id}</span>
                                                    <span className="font-mono text-[10px] text-on-surface-variant">{formatTime(conv.last_message_at) || '—'}</span>
                                                </div>
                                                <p className="truncate text-xs text-on-surface-variant">{conv.latest_message_preview || 'New initiative initialized'}</p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className={`status-diamond ${tone.diamond}`}></span>
                                                    <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.badgeClass}`}>{conv.status || 'System'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    <div className="border-t border-outline-variant/20 px-4 py-4">
                        <button className="shell-button shell-button-secondary focus-ring w-full">New Initiative</button>
                    </div>
                </div>
            </section>

            <section className={`${mobileListOpen ? 'hidden' : 'flex'} min-h-[70vh] flex-col bg-surface-container-lowest xl:flex`}>
                {selectedConversation ? (
                    <>
                        <div className="flex h-16 items-center justify-between border-b border-outline-variant/20 bg-surface px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-4">
                                <button className="focus-ring text-on-surface-variant xl:hidden" onClick={() => setMobileListOpen(true)}>
                                    <List size={18} />
                                </button>
                                <div className="flex h-10 w-10 items-center justify-center bg-surface-container-high text-primary">
                                    <Bot size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-headline text-sm font-bold uppercase tracking-[0.12em] text-primary">{selectedConversation.title}</div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="status-diamond success"></span>
                                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">{selectedConversation.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden items-center gap-3 sm:flex">
                                <button className="shell-button shell-button-secondary focus-ring min-h-10 px-4 py-2">Logs</button>
                                <button className="shell-button shell-button-primary focus-ring min-h-10 px-4 py-2">Export</button>
                            </div>
                        </div>

                        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                            {messages.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
                                    <Terminal size={40} className="mb-4" />
                                    <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em]">Awaiting Directives</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isUser = msg.sender_type === 'user'
                                    const isApproval = msg.message_type?.includes('approval')
                                    const isSystem = msg.sender_type === 'system'

                                    if (isUser) {
                                        return (
                                            <div key={msg.id} className="flex flex-row-reverse gap-4 animate-fade-in">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-surface-container-high font-headline text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                                    {(session?.name || session?.userId || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="max-w-2xl bg-primary/12 px-4 py-4">
                                                    <div className="mb-2 flex items-center justify-between gap-4">
                                                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Operator Directive</span>
                                                        <span className="font-mono text-[10px] text-on-surface-variant">{formatTime(msg.created_at)}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface">{msg.content}</p>
                                                </div>
                                            </div>
                                        )
                                    }

                                    if (isApproval) {
                                        return (
                                            <div key={msg.id} className="flex gap-4 animate-fade-in">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-warning/15 text-warning">
                                                    <ShieldAlert size={16} />
                                                </div>
                                                <div className="max-w-3xl bg-surface-container px-4 py-4">
                                                    <div className="mb-2 flex items-center justify-between gap-4">
                                                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-warning">Verification Required</span>
                                                        <span className="font-mono text-[10px] text-on-surface-variant">{formatTime(msg.created_at)}</span>
                                                    </div>
                                                    <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-on-surface">{msg.content}</p>
                                                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                                                        <div className="font-mono text-[11px] text-on-surface-variant">{msg.approval_id ? `Approval ${msg.approval_id.slice(0, 8)}…` : 'Approval request pending review'}</div>
                                                        <button className="shell-button shell-button-secondary focus-ring min-h-10 px-4 py-2">Decline Request</button>
                                                        <button className="shell-button shell-button-primary focus-ring min-h-10 px-4 py-2">Grant Permission</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={msg.id} className="flex gap-4 animate-fade-in">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-surface-container-high text-on-surface-variant">
                                                {isSystem ? <Terminal size={16} /> : <Bot size={16} />}
                                            </div>
                                            <div className="max-w-4xl space-y-4">
                                                <div className="bg-surface-container px-4 py-4">
                                                    <div className="mb-2 flex items-center justify-between gap-4">
                                                        <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${isSystem ? 'text-info' : 'text-success'}`}>{isSystem ? 'System Intervention' : `${selectedConversation.agent_id} Analysis`}</span>
                                                        <span className="font-mono text-[10px] text-on-surface-variant">{formatTime(msg.created_at)}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-4 sm:p-6">
                            <div className="surface-card shell-border overflow-hidden">
                                <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
                                    {[Paperclip, Terminal, Codesandbox].map((Icon, index) => (
                                        <button key={index} className="focus-ring flex h-8 w-8 items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary">
                                            <Icon size={15} />
                                        </button>
                                    ))}
                                    <div className="mx-1 h-4 w-px bg-outline-variant/30"></div>
                                    <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{selectedConversation.agent_id}</span>
                                    <span className="ml-auto font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">2 agents online</span>
                                </div>

                                <div className="flex items-end gap-3 px-3 py-3 sm:px-4">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                sendMessage()
                                            }
                                        }}
                                        className="focus-ring min-h-[52px] flex-1 resize-none bg-transparent px-2 py-3 text-sm text-on-surface placeholder:text-on-surface-variant"
                                        placeholder={`Type a directive for ${selectedConversation.agent_id}...`}
                                        rows={2}
                                    />
                                    <button onClick={sendMessage} disabled={!draft.trim()} className="shell-button shell-button-primary focus-ring h-[52px] w-[52px] p-0 disabled:opacity-40">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-on-surface-variant">
                        <Bot size={36} className="mb-5" />
                        <p className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.16em]">No Session Selected</p>
                        <p className="text-sm">Choose an active session from the left panel to continue remote supervision.</p>
                    </div>
                )}
            </section>

            <aside className="surface-card-alt hidden border-l border-outline-variant/20 xl:flex xl:w-[72px] xl:flex-col xl:items-center xl:py-6 xl:gap-4">
                {[Info, List, History, Activity].map((Icon, index) => (
                    <button key={index} className={`focus-ring flex h-11 w-11 items-center justify-center ${index === 0 ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                        <Icon size={18} />
                    </button>
                ))}
                <div className="mt-auto flex flex-col items-center gap-4">
                    <div className="h-12 w-px bg-outline-variant/30"></div>
                    <button className="focus-ring flex h-11 w-11 items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
                        <HelpCircle size={18} />
                    </button>
                </div>
            </aside>
        </div>
    )
}
