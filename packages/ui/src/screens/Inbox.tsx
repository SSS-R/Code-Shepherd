import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Activity,
    Bot,
    Codesandbox,
    Cpu,
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
import { loadSession } from '../utils/authSession'
import { AgentModelsResponse, AgentRecord, ConversationMessagesResponse, ConversationRecord, formatRelativeTime, MessageRecord, relayFetch } from '../utils/relay'

interface InboxProps {
    initialAgentId?: string | null
}

function formatTime(value?: string | null) {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getConversationTone(status: string, active: boolean) {
    const normalized = status.toUpperCase()
    if (active) return { badgeClass: 'text-success', diamond: 'success' }
    if (normalized.includes('APPROVAL') || normalized.includes('WAITING') || normalized.includes('PENDING')) {
        return { badgeClass: 'text-warning', diamond: 'warning' }
    }
    if (normalized.includes('BLOCK') || normalized.includes('ERROR')) {
        return { badgeClass: 'text-error', diamond: 'error' }
    }
    return { badgeClass: 'text-on-surface-variant', diamond: 'info' }
}

export default function Inbox({ initialAgentId = null }: InboxProps) {
    const [conversations, setConversations] = useState<ConversationRecord[]>([])
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<MessageRecord[]>([])
    const [draft, setDraft] = useState('')
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [mobileListOpen, setMobileListOpen] = useState(true)
    const [composeOpen, setComposeOpen] = useState(false)
    const [composeAgentId, setComposeAgentId] = useState(initialAgentId ?? '')
    const [composeTitle, setComposeTitle] = useState('')
    const [modelDrawerOpen, setModelDrawerOpen] = useState(false)
    const [agentModels, setAgentModels] = useState<Record<string, AgentModelsResponse>>({})
    const [selectedModelByAgent, setSelectedModelByAgent] = useState<Record<string, string>>({})
    const [customModelByAgent, setCustomModelByAgent] = useState<Record<string, string>>({})
    const session = loadSession()
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastMessageIdRef = useRef<string | null>(null)

    const isNearBottom = () => {
        const container = messagesContainerRef.current
        if (!container) {
            return true
        }

        return container.scrollHeight - container.scrollTop - container.clientHeight < 140
    }

    const scrollMessagesToBottom = (behavior: ScrollBehavior = 'auto') => {
        window.requestAnimationFrame(() => {
            const container = messagesContainerRef.current
            if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior })
                return
            }

            messagesEndRef.current?.scrollIntoView({ behavior })
        })
    }

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

    const selectedAgent = useMemo(
        () => agents.find((agent) => agent.id === selectedConversation?.agent_id) ?? null,
        [agents, selectedConversation],
    )

    const selectedAgentModels = selectedConversation ? agentModels[selectedConversation.agent_id] : undefined
    const selectedModelChoice = selectedConversation ? selectedModelByAgent[selectedConversation.agent_id] : undefined
    const customModelValue = selectedConversation ? customModelByAgent[selectedConversation.agent_id] ?? '' : ''

    const resolvedSelectedModel = useMemo(() => {
        if (!selectedConversation) {
            return undefined
        }

        const choice = selectedModelByAgent[selectedConversation.agent_id]
        if (!choice || choice === 'default' || choice === 'workspace-default') {
            return undefined
        }

        if (choice === 'custom') {
            const customValue = customModelByAgent[selectedConversation.agent_id]?.trim()
            return customValue || undefined
        }

        return choice
    }, [customModelByAgent, selectedConversation, selectedModelByAgent])

    const loadConversations = async (preferredAgentId?: string | null) => {
        const [conversationData, agentData] = await Promise.all([
            relayFetch<ConversationRecord[]>('/conversations'),
            relayFetch<AgentRecord[]>('/agents'),
        ])

        setConversations(conversationData)
        setAgents(agentData)

        if (preferredAgentId) {
            const existing = conversationData.find((conversation) => conversation.agent_id === preferredAgentId)
            if (existing) {
                setSelectedConversationId(existing.id)
                return
            }
        }

        setSelectedConversationId((current) => current && conversationData.some((conversation) => conversation.id === current) ? current : (conversationData[0]?.id ?? null))
    }

    useEffect(() => {
        let cancelled = false

        const initialize = async () => {
            try {
                await loadConversations(initialAgentId)
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void initialize()
        const interval = window.setInterval(() => {
            void loadConversations(null)
        }, 8000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [initialAgentId])

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([])
            lastMessageIdRef.current = null
            return
        }

        setMobileListOpen(false)
        setModelDrawerOpen(false)
        lastMessageIdRef.current = null

        let cancelled = false

        const loadMessages = async (forceScroll = false) => {
            try {
                const shouldStickToBottom = forceScroll || isNearBottom()
                const data = await relayFetch<ConversationMessagesResponse>(`/conversations/${selectedConversationId}/messages`)
                if (!cancelled) {
                    const nextMessages = data.messages || []
                    const newestMessageId = nextMessages[nextMessages.length - 1]?.id ?? null

                    setMessages(nextMessages)
                    if (forceScroll || shouldStickToBottom) {
                        scrollMessagesToBottom(forceScroll || newestMessageId !== lastMessageIdRef.current ? 'smooth' : 'auto')
                    }
                    lastMessageIdRef.current = newestMessageId
                }
            } catch {
                if (!cancelled) {
                    setMessages([])
                    lastMessageIdRef.current = null
                }
            }
        }

        void loadMessages(true)
        const interval = window.setInterval(() => {
            void loadMessages(false)
        }, 4000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [selectedConversationId])

    useEffect(() => {
        const agentId = selectedConversation?.agent_id
        if (!agentId || agentModels[agentId]) {
            return
        }

        let cancelled = false

        const loadModels = async () => {
            try {
                const response = await relayFetch<AgentModelsResponse>(`/agents/${agentId}/models`)
                if (cancelled) return

                setAgentModels((current) => ({ ...current, [agentId]: response }))
                const defaultModel = response.models.find((model) => model.default)?.id ?? response.models[0]?.id ?? 'default'
                setSelectedModelByAgent((current) => current[agentId] ? current : { ...current, [agentId]: defaultModel })
            } catch {
                if (!cancelled) {
                    setAgentModels((current) => ({
                        ...current,
                        [agentId]: {
                            agent_id: agentId,
                            adapter_id: selectedAgent?.adapter_id ?? 'command-runner',
                            adapter_label: selectedAgent?.name ?? agentId,
                            description: 'Runtime options unavailable.',
                            model_selection_mode: 'advisory',
                            supports_custom_model: true,
                            launch_behavior: 'roundtrip',
                            models: [{ id: 'default', label: 'Runtime Default', default: true }],
                        },
                    }))
                }
            }
        }

        void loadModels()

        return () => {
            cancelled = true
        }
    }, [agentModels, selectedAgent, selectedConversation])

    const sendMessage = async () => {
        if (!selectedConversation || !draft.trim()) return

        await relayFetch(`/conversations/${selectedConversation.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                content: draft.trim(),
                target_agent_id: selectedConversation.agent_id,
                message_type: 'command',
                metadata: {
                    issued_by_name: session?.name ?? session?.userId ?? 'dashboard-user',
                    selected_model: resolvedSelectedModel,
                    model_selection_mode: selectedAgentModels?.model_selection_mode,
                },
            }),
        })

        setDraft('')
        const data = await relayFetch<ConversationMessagesResponse>(`/conversations/${selectedConversation.id}/messages`)
        const nextMessages = data.messages || []
        setMessages(nextMessages)
        lastMessageIdRef.current = nextMessages[nextMessages.length - 1]?.id ?? null
        scrollMessagesToBottom('smooth')
        await loadConversations(selectedConversation.agent_id)
    }

    const createConversation = async () => {
        if (!composeAgentId.trim()) return

        const ensured = await relayFetch<{ conversation: ConversationRecord }>('/conversations/ensure', {
            method: 'POST',
            body: JSON.stringify({
                agent_id: composeAgentId.trim(),
                title: composeTitle.trim() || `Conversation with ${composeAgentId.trim()}`,
            }),
        })

        setComposeOpen(false)
        setComposeTitle('')
        await loadConversations(composeAgentId)
        setSelectedConversationId(ensured.conversation.id)
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="grid h-[calc(100vh-8rem)] min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_72px]">
            <section className={`${mobileListOpen ? 'flex' : 'hidden'} min-h-0 surface-card-alt border-r border-outline-variant/20 xl:flex xl:w-[280px] xl:flex-col`}>
                <div className="flex min-h-0 w-full flex-col">
                    <div className="border-b border-outline-variant/20 px-4 py-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="mb-1 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Unified Communication</p>
                                <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Active Sessions</h2>
                            </div>
                            <button className="focus-ring flex h-10 w-10 items-center justify-center bg-surface-container text-primary hover:bg-surface-bright" onClick={() => setComposeOpen((value) => !value)}>
                                <PlusSquare size={18} />
                            </button>
                        </div>

                        {composeOpen ? (
                            <div className="mb-4 space-y-3 bg-surface-container p-3">
                                <select value={composeAgentId} onChange={(event) => setComposeAgentId(event.target.value)} className="focus-ring w-full bg-surface-container-lowest px-3 py-3 text-sm text-on-surface">
                                    <option value="">Choose agent</option>
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                </select>
                                <input
                                    value={composeTitle}
                                    onChange={(event) => setComposeTitle(event.target.value)}
                                    className="focus-ring w-full bg-surface-container-lowest px-3 py-3 text-sm text-on-surface"
                                    placeholder="Optional title"
                                />
                                <button onClick={() => void createConversation()} className="shell-button shell-button-primary focus-ring w-full">Create Thread</button>
                            </div>
                        ) : null}

                        <label className="relative block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
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
                        ) : filteredConversations.map((conv) => {
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
                                                <span className="font-mono text-[10px] text-on-surface-variant">{formatTime(conv.last_message_at) || '-'}</span>
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
                        })}
                    </div>
                </div>
            </section>

            <section className={`${mobileListOpen ? 'hidden' : 'flex'} min-h-0 flex-col overflow-hidden bg-surface-container-lowest xl:flex`}>
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
                                        {resolvedSelectedModel ? <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Model: {resolvedSelectedModel}</span> : null}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden items-center gap-3 sm:flex">
                                <span className="text-xs text-on-surface-variant">{formatRelativeTime(selectedConversation.last_message_at)}</span>
                                <button onClick={() => setModelDrawerOpen((value) => !value)} className="shell-button shell-button-secondary focus-ring min-h-10 px-4 py-2">Model</button>
                                <button className="shell-button shell-button-secondary focus-ring min-h-10 px-4 py-2">Logs</button>
                            </div>
                        </div>

                        <div ref={messagesContainerRef} className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                            {messages.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
                                    <Terminal size={40} className="mb-4" />
                                    <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em]">Awaiting Directives</p>
                                </div>
                            ) : messages.map((msg) => {
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
                            })}
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
                                    <span className="ml-auto font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">{agents.filter((agent) => agent.status === 'online').length} agents online</span>
                                </div>

                                {modelDrawerOpen ? (
                                    <div className="border-b border-outline-variant/20 bg-surface-container px-4 py-4">
                                        <div className="mb-3 flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                            <Cpu size={14} />
                                            Runtime Model Routing
                                        </div>
                                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                            <div>
                                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Model Target</label>
                                                <select
                                                    value={selectedModelChoice ?? selectedAgentModels?.models.find((model) => model.default)?.id ?? 'default'}
                                                    onChange={(event) => setSelectedModelByAgent((current) => ({
                                                        ...current,
                                                        [selectedConversation.agent_id]: event.target.value,
                                                    }))}
                                                    className="focus-ring w-full bg-surface-container-lowest px-3 py-3 text-sm text-on-surface"
                                                >
                                                    {(selectedAgentModels?.models ?? [{ id: 'default', label: 'Runtime Default' }]).map((model) => (
                                                        <option key={model.id} value={model.id}>{model.label}</option>
                                                    ))}
                                                    {selectedAgentModels?.supports_custom_model ? <option value="custom">Custom Model ID</option> : null}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Custom Model</label>
                                                <input
                                                    value={customModelValue}
                                                    onChange={(event) => setCustomModelByAgent((current) => ({
                                                        ...current,
                                                        [selectedConversation.agent_id]: event.target.value,
                                                    }))}
                                                    disabled={selectedModelChoice !== 'custom'}
                                                    className="focus-ring w-full bg-surface-container-lowest px-3 py-3 text-sm text-on-surface disabled:opacity-50"
                                                    placeholder="Enter model id when needed"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs leading-5 text-on-surface-variant">
                                            {selectedAgentModels?.description ?? 'Choose the model routing hint for this agent.'}{' '}
                                            {selectedAgentModels?.model_selection_mode === 'advisory'
                                                ? 'This runtime treats the chosen model as a handoff hint.'
                                                : 'This runtime receives the selected model directly.'}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-end gap-3 px-3 py-3 sm:px-4">
                                    <textarea
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault()
                                                void sendMessage()
                                            }
                                        }}
                                        className="focus-ring min-h-[52px] flex-1 resize-none bg-transparent px-2 py-3 text-sm text-on-surface placeholder:text-on-surface-variant"
                                        placeholder={`Type a directive for ${selectedConversation.agent_id}...`}
                                        rows={2}
                                    />
                                    <button onClick={() => void sendMessage()} disabled={!draft.trim()} className="shell-button shell-button-primary focus-ring h-[52px] w-[52px] p-0 disabled:opacity-40">
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
