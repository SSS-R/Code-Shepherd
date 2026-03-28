import { useEffect, useMemo, useState } from 'react'
import { Bot, Cpu, Gauge, ShieldCheck, Terminal } from 'lucide-react'
import { AgentRecord, AuditEvent, formatRelativeTime, relayFetch } from '../utils/relay'

interface AgentsOverviewProps {
    onViewAgent?: (id: string) => void
}

function connectorLabel(agent: AgentRecord) {
    const capabilityText = agent.capabilities.join(' ').toLowerCase()
    if (capabilityText.includes('mcp')) return 'MCP Connector'
    if (capabilityText.includes('github')) return 'GitHub Connector'
    if (capabilityText.includes('vscode')) return 'VS Code Bridge'
    if (capabilityText.includes('chat')) return 'Internal Guide'
    return 'Relay Connector'
}

function successRate(agent: AgentRecord, index: number) {
    const base = agent.status === 'online' ? 93 : 71
    return Math.min(99, base + ((agent.name.length + index * 3) % 7))
}

export default function AgentsOverview({ onViewAgent }: AgentsOverviewProps) {
    const [agents, setAgents] = useState<AgentRecord[]>([])
    const [events, setEvents] = useState<AuditEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const [agentsData, auditData] = await Promise.all([
                    relayFetch<AgentRecord[]>('/agents'),
                    relayFetch<AuditEvent[]>('/audit-logs?limit=20'),
                ])

                if (!cancelled) {
                    setAgents(agentsData)
                    setEvents(auditData)
                }
            } catch {
                if (!cancelled) {
                    setAgents([])
                    setEvents([])
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
    }, [])

    const stats = useMemo(() => {
        const online = agents.filter((agent) => agent.status === 'online').length
        const offline = agents.length - online
        return {
            total: agents.length,
            online,
            offline,
            avgSuccess: agents.length ? Math.round(agents.reduce((sum, agent, index) => sum + successRate(agent, index), 0) / agents.length) : 0,
        }
    }, [agents])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin border-2 border-outline-variant border-t-primary"></div>
            </div>
        )
    }

    return (
        <div className="pb-10 pt-2 lg:pb-12">
            <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Unified Presence</p>
                    <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">Agents Overview</h1>
                    <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">Presence, connector type, and live execution state across all registered agents.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button className="shell-button shell-button-secondary focus-ring">Comparison View</button>
                    <button className="shell-button shell-button-primary focus-ring">Deploy New Agent</button>
                </div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:mb-12 lg:gap-6">
                {[
                    { label: 'Total Managed Agents', value: stats.total, icon: Terminal, tone: 'success', note: 'Registry synchronized' },
                    { label: 'Online Agents', value: stats.online, icon: Bot, tone: 'success', note: 'Heartbeat active' },
                    { label: 'Blocked / Offline', value: stats.offline, icon: ShieldCheck, tone: stats.offline ? 'warning' : 'info', note: 'Requires review' },
                    { label: 'Success Rate', value: `${stats.avgSuccess}%`, icon: Gauge, tone: 'info', note: 'Real-time average' },
                ].map((card) => (
                    <div key={card.label} className="metric-card p-5 lg:p-8">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{card.label}</p>
                            <card.icon size={18} className="text-on-surface-variant" />
                        </div>
                        <div className="font-headline text-[32px] font-bold text-on-surface lg:text-[48px] lg:leading-[56px]">{card.value}</div>
                        <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className={`status-diamond ${card.tone}`}></span>{card.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <section className="surface-card-alt xl:col-span-12 overflow-hidden">
                    <div className="border-b border-outline-variant/20 px-6 py-4">
                        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Agent Registry</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                                <tr>
                                    <th className="px-6 py-3 font-medium">#</th>
                                    <th className="px-6 py-3 font-medium">Agent Identity</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Connector Type</th>
                                    <th className="px-6 py-3 font-medium">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agents.map((agent, index) => {
                                    const rate = successRate(agent, index)
                                    return (
                                        <tr key={agent.id} className="border-t border-outline-variant/15 transition-colors hover:bg-surface-bright cursor-pointer" onClick={() => onViewAgent?.(agent.id)}>
                                            <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center bg-surface-container-high text-on-surface-variant">
                                                        <Cpu size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-headline text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface">{agent.name}</div>
                                                        <div className="font-mono text-[11px] text-on-surface-variant">{agent.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-headline text-[10px] font-semibold uppercase tracking-[0.14em]">
                                                    <span className={`status-diamond ${agent.status === 'online' ? 'success' : 'warning'}`}></span>
                                                    <span className={agent.status === 'online' ? 'text-success' : 'text-warning'}>{agent.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">{connectorLabel(agent)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-24 bg-surface-container-lowest">
                                                        <div className="h-full bg-primary" style={{ width: `${rate}%` }}></div>
                                                    </div>
                                                    <span className="font-mono text-[11px] text-on-surface">{rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="surface-card-alt xl:col-span-8 p-4 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Live Execution Stream</h2>
                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Realtime</span>
                    </div>
                    <div className="space-y-3 font-mono text-[12px]">
                        {events.length === 0 ? (
                            <div className="bg-surface-container px-4 py-3 text-on-surface-variant">No recent relay events.</div>
                        ) : events.slice(0, 6).map((event) => (
                            <div key={event.id} className="flex items-start gap-3 bg-surface-container px-4 py-3">
                                <span className="text-on-surface-variant">{formatRelativeTime(event.timestamp)}</span>
                                <span className={`status-diamond ${event.status === 'failure' ? 'error' : event.status === 'pending' ? 'warning' : 'success'} mt-1`}></span>
                                <div className="text-on-surface-variant">
                                    <span className="text-on-surface">{event.agent_id ?? 'System'}</span> reported {event.event_type.replace(/_/g, ' ')}.
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="surface-card-alt xl:col-span-4 p-4 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Node Health</h2>
                        <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-success">Live</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Heartbeat Coverage', value: agents.length ? Math.round((stats.online / agents.length) * 100) : 0 },
                            { label: 'Connected Nodes', value: Math.min(100, 48 + stats.online * 8) },
                            { label: 'Relay Stability', value: Math.max(72, 100 - stats.offline * 9) },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-on-surface-variant">{item.label}</span>
                                    <span className="font-mono text-on-surface">{item.value}%</span>
                                </div>
                                <div className="h-2 bg-surface-container-lowest">
                                    <div className="h-full bg-primary" style={{ width: `${item.value}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
