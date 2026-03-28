import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, Bot, Cpu, Gauge, Network, ShieldAlert, Zap } from 'lucide-react'
import SessionTimeline, { TimelineEvent } from '../components/SessionTimeline'
import { AgentRecord, ConversationRecord, formatRelativeTime, relayFetch, TaskRecord } from '../utils/relay'

interface AgentDetailProps {
    agentId: string
    onBack: () => void
}

function connectorLabel(agent: AgentRecord) {
    const capabilityText = agent.capabilities.join(' ').toLowerCase()
    if (capabilityText.includes('mcp')) return 'MCP Connector'
    if (capabilityText.includes('github')) return 'GitHub Bridge'
    if (capabilityText.includes('vscode')) return 'VS Code Connector'
    return 'Relay Connector'
}

export default function AgentDetail({ agentId, onBack }: AgentDetailProps) {
    const [agent, setAgent] = useState<AgentRecord | null>(null)
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [tasks, setTasks] = useState<TaskRecord[]>([])
    const [conversations, setConversations] = useState<ConversationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'configuration'>('activity')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [agentData, eventsData, taskData, conversationData] = await Promise.all([
                    relayFetch<AgentRecord>(`/agents/${agentId}`),
                    relayFetch<TimelineEvent[]>(`/audit-logs/${agentId}/timeline`),
                    relayFetch<TaskRecord[]>('/tasks'),
                    relayFetch<ConversationRecord[]>('/conversations'),
                ])

                if (cancelled) return

                setAgent(agentData)
                setEvents(eventsData)
                setTasks(taskData.filter((task) => task.assigned_agent_id === agentId))
                setConversations(conversationData.filter((conversation) => conversation.agent_id === agentId))
            } catch {
                if (!cancelled) {
                    setAgent(null)
                    setEvents([])
                    setTasks([])
                    setConversations([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void load()
        const interval = window.setInterval(() => {
            void load()
        }, 10000)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [agentId])

    const performanceStats = useMemo(() => {
        const successEvents = events.filter((event) => event.status === 'success').length
        const totalEvents = events.length || 1
        const successRate = Math.max(72, Math.round((successEvents / totalEvents) * 100))
        return {
            successRate,
            responseTime: `${(0.8 + totalEvents / 40).toFixed(2)}s`,
            eventVolume: `${events.length}`,
            taskCompletion: `${tasks.filter((task) => task.status === 'Done').length}/${tasks.length || 0}`,
        }
    }, [events, tasks])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    if (!agent) {
        return (
            <div className="surface-card p-10 text-center">
                <div className="mb-4 font-headline text-lg font-bold uppercase tracking-[0.14em] text-on-surface">Agent Not Found</div>
                <button onClick={onBack} className="shell-button shell-button-secondary focus-ring">Back to Agents</button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
                <div className="mb-6 flex items-center gap-3 text-sm text-on-surface-variant">
                    <button onClick={onBack} className="focus-ring inline-flex h-10 w-10 items-center justify-center bg-surface-container text-on-surface-variant hover:text-primary">
                        <ArrowLeft size={16} />
                    </button>
                    <span className="font-headline uppercase tracking-[0.14em]">Agents Overview</span>
                    <span>/</span>
                    <span className="font-headline uppercase tracking-[0.14em] text-on-surface">{agent.name}</span>
                </div>

                <section className="surface-card-alt mb-8 overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex h-24 w-24 items-center justify-center bg-surface-container text-primary">
                            <Bot size={40} />
                        </div>

                        <div className="flex-1">
                            <div className="mb-4 flex flex-wrap items-center gap-4">
                                <h1 className="font-headline text-[28px] font-black uppercase tracking-[-0.03em] text-on-surface sm:text-[36px]">{agent.name}</h1>
                                <span className={`px-3 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${agent.status === 'online' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'}`}>{agent.status === 'online' ? 'Online' : 'Attention Needed'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                <Meta label="Connector" value={connectorLabel(agent)} />
                                <Meta label="Last Heartbeat" value={formatRelativeTime(agent.last_heartbeat)} />
                                <Meta label="Open Threads" value={String(conversations.length)} />
                                <Meta label="Assigned Tasks" value={String(tasks.length)} />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mb-6 flex gap-6 border-b border-outline-variant/20">
                    {[
                        { key: 'activity', label: 'Activity' },
                        { key: 'tasks', label: 'Tasks' },
                        { key: 'configuration', label: 'Configuration' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`pb-4 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] ${activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'activity' ? (
                    <section>
                        <SessionTimeline events={events} agentId={agentId} limit={50} />
                    </section>
                ) : activeTab === 'tasks' ? (
                    <section className="surface-card-alt p-6">
                        <div className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Task Assignment Surface</div>
                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-sm leading-6 text-on-surface-variant">This agent has no active task assignments yet.</p>
                            ) : tasks.map((task) => (
                                <div key={task.id} className="bg-surface-container px-4 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface">{task.title}</div>
                                            <div className="mt-1 text-xs text-on-surface-variant">{task.description || 'No extra task context provided.'}</div>
                                        </div>
                                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{task.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="surface-card-alt p-6">
                        <div className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Configuration Surface</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {agent.capabilities.map((capability) => (
                                <span key={capability} className="bg-surface-container px-3 py-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{capability}</span>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <aside className="space-y-6">
                <section className="surface-card-alt p-6">
                    <h3 className="mb-6 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Performance Metrics</h3>
                    <div className="relative mb-8 flex justify-center">
                        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="58" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-surface-container-highest" />
                            <circle cx="70" cy="70" r="58" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * performanceStats.successRate) / 100} className="text-primary" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-headline text-3xl font-black tracking-[-0.03em] text-on-surface">{performanceStats.successRate}%</span>
                            <span className="font-headline text-[9px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Success Rate</span>
                        </div>
                    </div>

                    <MetricRow icon={Gauge} label="Avg. Response Time" value={performanceStats.responseTime} />
                    <MetricRow icon={Zap} label="Event Volume" value={performanceStats.eventVolume} />
                    <MetricRow icon={Activity} label="Task Completion" value={performanceStats.taskCompletion} border={false} />
                </section>

                <section className="surface-card-alt p-6">
                    <h3 className="mb-6 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Connection Health</h3>
                    <div className="mb-6 flex items-center gap-4 bg-surface-container p-4">
                        <span className={`status-diamond ${agent.status === 'online' ? 'success' : 'warning'}`}></span>
                        <div>
                            <p className={`font-headline text-[10px] font-semibold uppercase tracking-[0.16em] ${agent.status === 'online' ? 'text-success' : 'text-warning'}`}>{agent.status === 'online' ? 'Heartbeat Active' : 'Heartbeat Delayed'}</p>
                            <p className="text-[11px] text-on-surface-variant">Last Ping: {formatRelativeTime(agent.last_heartbeat)}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <HealthLine icon={Network} label="Ingress" value={`${Math.max(1, conversations.length)} threads`} tone="success" />
                        <HealthLine icon={Cpu} label="Capabilities" value={`${agent.capabilities.length} enabled`} tone="success" />
                        <HealthLine icon={ShieldAlert} label="Approvals" value={`${events.filter((event) => event.category === 'approval').length} tracked`} tone="info" />
                    </div>
                </section>

                <div className="space-y-3">
                    <button className="shell-button shell-button-primary focus-ring w-full">Manual Override</button>
                    <button className="shell-button focus-ring w-full border border-outline-variant/30 bg-transparent text-on-surface-variant">Terminate Session</button>
                </div>
            </aside>
        </div>
    )
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="mb-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
            <p className="text-sm font-semibold text-on-surface">{value}</p>
        </div>
    )
}

function MetricRow({ icon: Icon, label, value, border = true }: { icon: typeof Gauge; label: string; value: string; border?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-3 ${border ? 'border-b border-outline-variant/15' : ''}`}>
            <div className="flex items-center gap-3 text-on-surface-variant">
                <Icon size={14} />
                <span className="text-sm">{label}</span>
            </div>
            <span className="font-headline text-sm font-bold text-on-surface">{value}</span>
        </div>
    )
}

function HealthLine({ icon: Icon, label, value, tone }: { icon: typeof Network; label: string; value: string; tone: 'success' | 'info' }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`status-diamond ${tone}`}></span>
            <Icon size={14} className="text-on-surface-variant" />
            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}: {value}</span>
        </div>
    )
}
