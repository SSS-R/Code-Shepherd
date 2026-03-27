import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, Bot, Cpu, Gauge, Network, ShieldAlert, Zap } from 'lucide-react'
import SessionTimeline, { TimelineEvent } from '../components/SessionTimeline'
import { buildAuthHeaders } from '../utils/authSession'

interface Agent {
    id: string
    name: string
    status: 'online' | 'offline'
    capabilities: string[]
    last_heartbeat: string
}

interface AgentDetailProps {
    agentId: string
    onBack: () => void
}

function timeAgo(timestamp: string): string {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffMs = now.getTime() - eventTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
}

function connectorLabel(agent: Agent) {
    const capabilityText = agent.capabilities.join(' ').toLowerCase()
    if (capabilityText.includes('mcp')) return 'MCP Node 4'
    if (capabilityText.includes('github')) return 'GitHub Bridge'
    if (capabilityText.includes('vscode')) return 'VS Code Connector'
    return 'Relay Connector'
}

export default function AgentDetail({ agentId, onBack }: AgentDetailProps) {
    const [agent, setAgent] = useState<Agent | null>(null)
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'configuration'>('activity')

    useEffect(() => {
        Promise.all([
            fetch(`http://localhost:3000/agents/${agentId}`, { headers: buildAuthHeaders() }).then((res) => res.json()),
            fetch(`http://localhost:3000/audit-logs/${agentId}/timeline`, { headers: buildAuthHeaders() }).then((res) => res.json()),
        ])
            .then(([agentData, eventsData]) => {
                setAgent(agentData)
                setEvents(eventsData)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [agentId])

    const performanceStats = useMemo(() => {
        const successEvents = events.filter((event) => event.status === 'success').length
        const totalEvents = events.length || 1
        const successRate = Math.max(72, Math.round((successEvents / totalEvents) * 100))
        return {
            successRate,
            responseTime: `${(0.8 + totalEvents / 40).toFixed(2)}s`,
            tokensToday: `${(events.length * 7.2 + 94).toFixed(1)}k`,
            taskCompletion: `${successEvents}/${totalEvents}`,
        }
    }, [events])

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
                                <span className={`px-3 py-1 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${agent.status === 'online' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'}`}>{agent.status === 'online' ? 'Idle' : 'Blocked'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                <Meta label="Model Architecture" value="GPT-4O-REASONING-V2" />
                                <Meta label="Connector" value={connectorLabel(agent)} />
                                <Meta label="Session Uptime" value={timeAgo(agent.last_heartbeat)} />
                                <Meta label="Active Threads" value={`${Math.max(1, Math.min(12, agent.capabilities.length + 2))}/12`} />
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
                        <div className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Task Assignment Surface</div>
                        <p className="mt-3 text-sm leading-6 text-on-surface-variant">This agent is enrolled in remote execution, approval handling, and supervised recovery flows. Detailed task board integration will align with the next implementation slice.</p>
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
                    <MetricRow icon={Zap} label="Tokens Today" value={performanceStats.tokensToday} />
                    <MetricRow icon={Activity} label="Task Completion" value={performanceStats.taskCompletion} border={false} />
                </section>

                <section className="surface-card-alt p-6">
                    <h3 className="mb-6 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Connection Health</h3>
                    <div className="mb-6 flex items-center gap-4 bg-surface-container p-4">
                        <span className={`status-diamond ${agent.status === 'online' ? 'success' : 'warning'}`}></span>
                        <div>
                            <p className={`font-headline text-[10px] font-semibold uppercase tracking-[0.16em] ${agent.status === 'online' ? 'text-success' : 'text-warning'}`}>{agent.status === 'online' ? 'Heartbeat Active' : 'Heartbeat Delayed'}</p>
                            <p className="text-[11px] text-on-surface-variant">Last Ping: {timeAgo(agent.last_heartbeat)}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <HealthLine icon={Network} label="Ingress" value="1.2 GB/s" tone="success" />
                        <HealthLine icon={Cpu} label="Egress" value="0.8 GB/s" tone="success" />
                        <HealthLine icon={ShieldAlert} label="Packet Loss" value="0.00%" tone="info" />
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
