import { useEffect, useMemo, useState, useRef } from 'react'
import { Bot, Info, ShieldAlert, Paperclip, Terminal, Codesandbox, Search, Send, List, History, Activity, HelpCircle, PlusSquare, Filter } from 'lucide-react'
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
    const [query, setQuery] = useState('')
    const [mobileListOpen, setMobileListOpen] = useState(true)
    const session = loadSession()

    // Auto-scroll messages
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
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden xl:h-[calc(100vh-7rem)] xl:flex-row">
            {/* Left Panel: Agent Threads */}
            <section className={`${mobileListOpen ? 'flex' : 'hidden'} md:flex flex-col w-full xl:w-80 xl:min-w-80 border-r border-outline-variant/10 bg-surface-container-low z-10 transition-all`}>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-headline font-bold text-sm tracking-widest text-on-surface-variant uppercase">Active Threads</h2>
                        <button className="text-primary hover:bg-primary/10 p-1 rounded-sm transition-all">
                            <PlusSquare size={18} />
                        </button>
                    </div>
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-surface-container-lowest border-none text-xs rounded-sm pl-9 pr-4 py-2 focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-outline/50 outline-none"
                            placeholder="Filter agents..."
                            type="text"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="px-5 py-8 text-center opacity-60">
                            <span className="text-xs uppercase tracking-widest font-mono text-outline">No Threads Found</span>
                        </div>
                    ) : filteredConversations.map(conv => {
                        const isActive = selectedConversationId === conv.id;

                        // Infer status styling
                        let statusColor = 'bg-outline';
                        let glowClass = '';
                        let borderClass = 'border-outline-variant/10 hover:bg-surface-container-low/50';

                        if (isActive) {
                            statusColor = 'bg-secondary';
                            glowClass = 'shadow-[0_0_8px_#7bdb80]';
                            borderClass = 'bg-surface-container hover:bg-surface-container-high border-secondary';
                        } else if (conv.status.includes('PENDING') || conv.status.includes('WAITING') || conv.status.includes('APPROVAL')) {
                            statusColor = 'bg-tertiary';
                            glowClass = 'shadow-[0_0_8px_#fabc45]';
                            borderClass = 'border-outline-variant/10 hover:bg-surface-container-low/50';
                        } else if (conv.status.includes('ACTIVE') || conv.status.includes('RUNNING')) {
                            statusColor = 'bg-secondary';
                            glowClass = 'shadow-[0_0_8px_#7bdb80]';
                        }

                        return (
                            <div key={conv.id} className="px-3" onClick={() => setSelectedConversationId(conv.id)}>
                                <div className={`border-l-2 p-3 rounded-md mb-2 cursor-pointer transition-all relative group ${borderClass}`}>
                                    <div className="flex gap-3">
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-sm bg-surface-container-highest flex items-center justify-center ${isActive ? '' : 'grayscale opacity-70'}`}>
                                                <Bot size={20} className="text-outline" />
                                            </div>
                                            <span className={`absolute -bottom-1 -right-1 w-3 h-3 ${statusColor} rounded-full border-2 border-surface-container ${glowClass}`}></span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className={`text-xs font-bold font-headline truncate pr-2 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{conv.agent_id}</span>
                                                <span className="font-mono text-[9px] text-outline">
                                                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] truncate ${isActive ? 'text-on-surface-variant' : 'text-outline'}`}>
                                                {conv.latest_message_preview || 'New conversation'}
                                            </p>

                                            {conv.status && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1 ${isActive ? 'bg-secondary/10 text-secondary' : 'bg-outline/10 text-outline'}`}>
                                                        {isActive && <span className="w-1 h-1 bg-secondary rounded-full animate-pulse"></span>}
                                                        {conv.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Main Panel: Session Context */}
            <section className={`${mobileListOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-surface-container-lowest min-h-[60vh] xl:min-h-0`}>
                {selectedConversation ? (
                    <>
                        {/* Context Header */}
                        <div className="h-14 border-b border-outline-variant/10 flex items-center justify-between px-4 md:px-6 bg-surface flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <button className="md:hidden text-outline hover:text-primary transition-colors" onClick={() => setMobileListOpen(true)}>
                                    <List size={18} />
                                </button>
                                <div className="w-8 h-8 flex items-center justify-center rounded-sm bg-surface-container-high border border-outline-variant/30">
                                    <Bot size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h1 className="font-headline font-bold text-sm tracking-tight text-primary truncate max-w-[200px] sm:max-w-xs">{selectedConversation.title} <span className="text-outline font-normal text-xs ml-2 hidden sm:inline">/ Thread_{selectedConversation.id.substring(0, 6)}</span></h1>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                        <span className="text-[10px] text-secondary font-mono tracking-widest uppercase truncate">{selectedConversation.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-sm text-[11px] font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                                    <Search size={14} />
                                    <span className="hidden sm:inline">INSPECT</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Area: Console View */}
                        <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-surface-container-lowest">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <Terminal size={48} className="mb-4 text-outline" />
                                    <p className="font-mono text-xs text-outline uppercase tracking-widest">Awaiting Directives</p>
                                </div>
                            ) : messages.map((msg) => {
                                const isUser = msg.sender_type === 'user';
                                const isApproval = msg.message_type?.includes('approval');

                                if (isUser) {
                                    return (
                                        <div key={msg.id} className="flex gap-4 flex-row-reverse animate-fade-in">
                                            <div className="w-8 h-8 flex-shrink-0 bg-primary-container/20 border border-primary/30 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">{(session?.name || session?.userId || 'U').charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="max-w-2xl bg-primary-container/10 p-4 rounded-lg rounded-tr-none border border-primary/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Operator Directive</span>
                                                    <span className="font-mono text-[9px] text-outline opacity-50 ml-4">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    )
                                }

                                if (isApproval) {
                                    return (
                                        <div key={msg.id} className="flex gap-4 animate-fade-in">
                                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-tertiary/20 rounded-sm border border-tertiary/30">
                                                <ShieldAlert className="text-tertiary" size={16} />
                                            </div>
                                            <div className="max-w-2xl bg-tertiary/10 p-4 rounded-lg rounded-tl-none border border-tertiary/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest">Verification Required</span>
                                                    <span className="font-mono text-[9px] text-outline opacity-50 ml-4">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap mb-3">{msg.content}</p>
                                                {msg.approval_id && (
                                                    <div className="bg-surface-container px-3 py-2 rounded border border-outline-variant/20 flex items-center justify-between">
                                                        <span className="text-[10px] font-mono text-outline">ID: {msg.approval_id.slice(0, 8)}...</span>
                                                        <button className="text-[10px] font-bold text-tertiary uppercase tracking-widest hover:underline">Review Details</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }

                                // Standard Agent Message
                                return (
                                    <div key={msg.id} className="flex gap-4 animate-fade-in">
                                        <div className="w-8 h-8 flex-shrink-0 bg-surface-container-high rounded-sm border border-outline-variant/20 flex items-center justify-center">
                                            <Bot size={16} className="text-secondary" />
                                        </div>
                                        <div className="flex-1 max-w-4xl space-y-4">
                                            <div className="bg-surface-container-low p-4 rounded-lg rounded-tl-none border border-outline-variant/10">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">{selectedConversation.agent_id} Response</span>
                                                    <span className="font-mono text-[9px] text-outline opacity-50 ml-4">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Thread Input Anchor */}
                        <div className="p-4 md:p-6 pt-0 mt-auto bg-surface-container-lowest">
                            <div className="glass-panel border border-outline-variant/30 rounded-lg shadow-2xl overflow-hidden bg-surface-container-low relative z-10">
                                <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/10 bg-surface-container/50">
                                    <button className="p-1 text-outline hover:text-primary transition-colors"><Paperclip size={14} /></button>
                                    <button className="p-1 text-outline hover:text-primary transition-colors"><Terminal size={14} /></button>
                                    <button className="p-1 text-outline hover:text-primary transition-colors"><Codesandbox size={14} /></button>
                                    <div className="h-4 w-[1px] bg-outline-variant/20 mx-1"></div>
                                    <span className="text-[10px] text-outline uppercase font-mono hidden sm:inline">Agent Selection: </span>
                                    <span className="text-[10px] text-primary font-mono font-bold">{selectedConversation.agent_id}</span>
                                </div>
                                <div className="flex items-end p-3 gap-3">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                sendMessage()
                                            }
                                        }}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none text-on-surface placeholder:text-outline/40 outline-none max-h-32"
                                        placeholder={`Type a directive for ${selectedConversation.agent_id}...`}
                                        rows={1}
                                        style={{ height: draft ? 'auto' : '36px' }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!draft.trim()}
                                        className="w-10 h-10 bg-primary text-on-primary rounded-sm flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                    >
                                        <Send size={16} className={`${draft.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} transition-transform`} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-center pb-2">
                                <p className="text-[10px] text-outline/50 font-mono">CODE_SHEPHERD v1.0.4 • SECURE_TERMINAL_ENCRYPTED</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                        <div className="w-16 h-16 rounded-full border border-dashed border-outline-variant/30 flex items-center justify-center bg-surface-container-low mb-6 opacity-50">
                            <Bot className="text-outline" size={32} />
                        </div>
                        <button className="md:hidden mb-4 inline-flex items-center gap-2 rounded-sm border border-outline-variant/20 px-3 py-2 text-xs uppercase tracking-widest text-outline" onClick={() => setMobileListOpen(true)}>
                            <List size={14} /> Open Threads
                        </button>
                        <p className="text-sm text-outline font-headline tracking-widest uppercase mb-2">No Thread Selected</p>
                        <p className="text-xs font-mono text-outline/50">Intercept a signal from the left panel</p>
                    </div>
                )}
            </section>

            {/* Right Inspector Drawer (Minimized/Contextual) */}
            <aside className="hidden lg:flex w-14 border-l border-outline-variant/10 flex-col items-center py-6 gap-6 bg-surface-container-low z-10">
                <button className="p-2 text-primary bg-primary/10 rounded-sm hover:-translate-y-0.5 transition-transform"><Info size={18} /></button>
                <button className="p-2 text-outline hover:text-on-surface hover:-translate-y-0.5 transition-transform"><List size={18} /></button>
                <button className="p-2 text-outline hover:text-on-surface hover:-translate-y-0.5 transition-transform"><History size={18} /></button>
                <button className="p-2 text-outline hover:text-on-surface hover:-translate-y-0.5 transition-transform"><Activity size={18} /></button>

                <div className="mt-auto flex flex-col items-center gap-6">
                    <div className="w-1 h-12 bg-outline-variant/20 rounded-full"></div>
                    <button className="p-2 text-outline hover:text-on-surface hover:-translate-y-0.5 transition-transform"><HelpCircle size={18} /></button>
                </div>
            </aside>
        </div>
    )
}
