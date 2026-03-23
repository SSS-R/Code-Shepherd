import { useState, useEffect, ReactNode } from 'react'
import { ArrowRight, BellRing, Bot, CircleCheck, CircleX, LayoutDashboard, Rocket, Sparkles } from 'lucide-react'
import ActiveWorkflows from '../components/ActiveWorkflows'
import { buildAuthHeaders } from '../utils/authSession'

interface Agent {
    id: string
    name: string
    capabilities: string[]
    status: 'online' | 'offline'
    last_heartbeat: string
}

interface Stats {
    activeAgents: number
    pendingApprovals: number
    totalSessions: number
}

interface ParallelSession {
    task_id: string
    title: string
    assigned_agent_id: string | null
    terminal_status: string
}

export default function Dashboard({ onViewAgent }: { onViewAgent?: (id: string) => void }) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Stats>({ activeAgents: 0, pendingApprovals: 0, totalSessions: 0 })
    const [parallelSessions, setParallelSessions] = useState<ParallelSession[]>([])

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:3000/agents', { headers: buildAuthHeaders() }).then(res => res.json()),
            fetch('http://localhost:3000/approvals/pending', { headers: buildAuthHeaders() }).then(res => res.json()),
            fetch('http://localhost:3000/operations/parallel-sessions', { headers: buildAuthHeaders() }).then(res => res.json()).catch(() => [])
        ]).then(([agentsData, approvalsData, sessionsData]) => {
            setAgents(agentsData)
            setStats({
                activeAgents: agentsData.filter((a: Agent) => a.status === 'online').length,
                pendingApprovals: approvalsData.length,
                totalSessions: agentsData.length
            })
            setParallelSessions(sessionsData)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    if (loading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <section className="glass rounded-2xl p-6 md:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary-strong)]/20 bg-[var(--accent-primary-strong)]/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--accent-info)]">
                            <LayoutDashboard size={14} /> Command Center
                        </div>
                        <h2 className="font-headline text-[32px] font-bold tracking-tight text-[var(--text-primary)] md:text-[40px]">
                            Operational pulse for every connected agent cluster.
                        </h2>
                        <p className="max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                            The dashboard now follows the Stitch web direction: dense signal-first cards, cluster health metrics, live agent visibility, and immediate access to risky work.
                        </p>
                    </div>

                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                        <button className="btn-secondary rounded-xl px-4 py-3 text-sm font-medium">
                            Export Log
                        </button>
                        <button className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                            <Rocket size={16} /> Deploy Agent
                        </button>
                        <div className="surface-panel rounded-xl p-5 sm:col-span-2">
                            <div className="flex items-center justify-between gap-3 text-[13px] text-[var(--text-secondary)]">
                                <span>System pulse</span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-success)]/10 px-3 py-1 text-[12px] uppercase tracking-[0.16em] text-[var(--accent-success)]"><Sparkles size={12} /> Optimal state</span>
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-4">
                                <div>
                                    <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.activeAgents}</div>
                                    <div className="text-[13px] text-[var(--text-muted)]">agents online now</div>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[13px] font-medium text-[var(--accent-warning)]">
                                    <BellRing size={14} /> {stats.pendingApprovals} waiting
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Active Agents" value={stats.activeAgents} icon={<Bot size={18} />} borderClass="border-blue-500/20" />
                <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={<BellRing size={18} />} borderClass="border-amber-500/20" />
                <StatCard label="Tracked Sessions" value={stats.totalSessions} icon={<LayoutDashboard size={18} />} borderClass="border-violet-500/20" />
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Registered Agents</h3>
                    <div className="text-[13px] text-[var(--text-secondary)]">{agents.length} total</div>
                </div>

                {agents.length === 0 ? (
                    <div className="glass rounded-xl border border-dashed border-[var(--border-subtle)] p-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--accent-info)]">
                            <Bot size={26} />
                        </div>
                        <p className="text-[18px] font-semibold text-[var(--text-primary)]">No agents registered yet</p>
                        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Agents appear here once they connect to the relay.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {agents.map((agent, index) => (
                            <AgentCard key={agent.id} agent={agent} index={index} onClick={() => onViewAgent?.(agent.id)} />
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Active Workflows</h3>
                    <div className="text-[13px] text-[var(--text-secondary)]">Resume or inspect in progress flows</div>
                </div>
                <ActiveWorkflows />
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Parallel Sessions</h3>
                    <div className="text-[13px] text-[var(--text-secondary)]">Live task runtimes across multiple agents</div>
                </div>
                {parallelSessions.length === 0 ? (
                    <div className="glass rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-[13px] text-[var(--text-muted)]">No live parallel sessions detected.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {parallelSessions.map((session) => (
                            <div key={session.task_id} className="glass rounded-xl p-5 border border-[var(--border-subtle)]">
                                <div className="text-[15px] font-semibold text-[var(--text-primary)]">{session.title}</div>
                                <div className="mt-2 text-[13px] text-[var(--text-secondary)]">Task: {session.task_id}</div>
                                <div className="mt-1 text-[13px] text-[var(--text-secondary)]">Agent: {session.assigned_agent_id || 'unassigned'}</div>
                                <div className="mt-3 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[13px] font-medium text-[var(--accent-info)]">{session.terminal_status}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="glass rounded-xl p-8">
                <div className="h-4 w-28 rounded bg-[var(--border-subtle)]" />
                <div className="mt-4 h-8 w-3/4 rounded bg-[var(--border-subtle)]" />
                <div className="mt-3 h-4 w-2/3 rounded bg-[var(--border-subtle)]" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="glass rounded-xl p-5">
                        <div className="h-10 w-10 rounded-xl bg-[var(--border-subtle)]" />
                        <div className="mt-4 h-8 w-16 rounded bg-[var(--border-subtle)]" />
                        <div className="mt-2 h-4 w-28 rounded bg-[var(--border-subtle)]" />
                    </div>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="glass rounded-xl p-5">
                        <div className="h-5 w-32 rounded bg-[var(--border-subtle)]" />
                        <div className="mt-3 h-4 w-24 rounded bg-[var(--border-subtle)]" />
                        <div className="mt-5 h-10 w-full rounded bg-[var(--border-subtle)]" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, borderClass }: { label: string; value: number; icon: ReactNode; borderClass: string }) {
    return (
        <div className={`glass rounded-2xl border ${borderClass} p-5`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--accent-info)]">{icon}</div>
                <div className="text-[13px] text-[var(--text-muted)]">Live</div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="mt-1 text-[13px] text-[var(--text-secondary)]">{label}</div>
        </div>
    )
}

function AgentCard({ agent, index, onClick }: { agent: Agent; index: number; onClick?: () => void }) {
    const online = agent.status === 'online'

    return (
        <button
            onClick={onClick}
            className={`glass w-full rounded-2xl border-l-[3px] p-5 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--border-active)] ${online ? 'border-l-green-500' : 'border-l-slate-500'}`}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--accent-info)]">
                        <Bot size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            {online ? <CircleCheck size={16} className="text-[var(--accent-success)]" /> : <CircleX size={16} className="text-[var(--text-muted)]" />}
                            <h4 className="text-[15px] font-semibold text-[var(--text-primary)]">{agent.name}</h4>
                        </div>
                        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">ID: {agent.id}</p>
                    </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-[13px] font-medium ${online ? 'bg-green-500/10 text-[var(--accent-success)] border border-green-500/20' : 'bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'}`}>
                    {agent.status}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {agent.capabilities.map((capability) => (
                    <span key={capability} className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-1 text-[13px] text-[var(--text-secondary)]">
                        {capability}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--text-muted)]">
                <span>Last active: recent</span>
                <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]">View <ArrowRight size={14} /></span>
            </div>
        </button>
    )
}
