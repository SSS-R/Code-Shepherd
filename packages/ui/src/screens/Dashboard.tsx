import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bot,
  Database,
  Network,
  Rocket,
  ShieldAlert,
  Terminal,
} from 'lucide-react'
import {
  AgentRecord,
  ApprovalRecord,
  AuditEvent,
  ConversationRecord,
  formatRelativeTime,
  ParallelSession,
  relayFetch,
} from '../utils/relay'

interface DashboardProps {
  onViewAgent?: (id: string) => void
}

export default function Dashboard({ onViewAgent }: DashboardProps) {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [conversations, setConversations] = useState<ConversationRecord[]>([])
  const [parallelSessions, setParallelSessions] = useState<ParallelSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [agentsData, approvalsData, auditData, conversationData, sessionsData] = await Promise.all([
          relayFetch<AgentRecord[]>('/agents'),
          relayFetch<ApprovalRecord[]>('/approvals/pending'),
          relayFetch<AuditEvent[]>('/audit-logs?limit=8'),
          relayFetch<ConversationRecord[]>('/conversations'),
          relayFetch<ParallelSession[]>('/operations/parallel-sessions').catch(() => []),
        ])

        if (cancelled) return

        setAgents(agentsData)
        setApprovals(approvalsData)
        setAuditEvents(auditData)
        setConversations(conversationData)
        setParallelSessions(sessionsData)
      } catch {
        if (!cancelled) {
          setAgents([])
          setApprovals([])
          setAuditEvents([])
          setConversations([])
          setParallelSessions([])
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

  const stats = useMemo(() => ({
    activeAgents: agents.filter((agent) => agent.status === 'online').length,
    pendingApprovals: approvals.length,
    activeConversations: conversations.filter((conversation) => conversation.status === 'active').length,
  }), [agents, approvals.length, conversations])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="animate-fade-in pb-10 pt-2 lg:pb-12">
      <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 font-headline text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Crystalline Architecture</p>
          <h1 className="font-headline text-[28px] font-bold uppercase tracking-[-0.02em] text-on-surface sm:text-[36px]">Control Plane</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">Operational pulse for cluster <span className="font-mono text-primary">SHEPHERD-ALPHA-09</span>. Unified communication, approvals, and active agent supervision in one command surface.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="shell-button shell-button-secondary focus-ring w-full sm:w-auto">
            Export Log
          </button>
          <button className="shell-button shell-button-primary focus-ring w-full sm:w-auto">
            <Rocket size={14} />
            Deploy Agent
          </button>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:mb-12 lg:gap-6">
        <MetricCard
          label="Total Managed Agents"
          value={String(agents.length)}
          note="Registry synchronized"
          icon={<Terminal size={18} className="text-on-surface-variant" />}
          tone="success"
        />
        <MetricCard
          label="Active Conversations"
          value={String(stats.activeConversations)}
          note="Collaborative threads live"
          icon={<Bot size={18} className="text-on-surface-variant" />}
          tone="success"
        />
        <MetricCard
          label="Pending Approvals"
          value={String(stats.pendingApprovals)}
          note="Action required"
          icon={<ShieldAlert size={18} className="text-warning" />}
          tone="warning"
        />
        <MetricCard
          label="Online Agents"
          value={String(stats.activeAgents)}
          note="Relay heartbeat stable"
          icon={<Activity size={18} className="text-on-surface-variant" />}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="surface-card-alt xl:col-span-8 flex min-h-[320px] flex-col overflow-hidden p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Recent Activity
            </h3>
            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{auditEvents.length} events loaded</span>
          </div>

          <div className="space-y-3">
            {auditEvents.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center text-center text-on-surface-variant">
                No audit activity has been recorded yet.
              </div>
            ) : auditEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 bg-surface-container px-4 py-4">
                <span className={`status-diamond ${event.status === 'failure' ? 'error' : event.status === 'pending' ? 'warning' : 'success'} mt-1`}></span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-headline text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{formatRelativeTime(event.timestamp)}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {event.agent_id ? `${event.agent_id} reported ${event.event_type.replace(/_/g, ' ')}.` : `System recorded ${event.event_type.replace(/_/g, ' ')}.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card-alt xl:col-span-4 p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface">Active Threads</h3>
            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Live ({agents.length})</span>
          </div>

          <div className="space-y-4 max-h-[310px] overflow-y-auto custom-scrollbar pr-2">
            {agents.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <Bot size={32} className="mx-auto text-outline mb-2" />
                <p className="text-xs uppercase tracking-widest text-outline">No Agents Registered</p>
              </div>
            ) : agents.map((agent) => (
              <div
                key={agent.id}
                className="flex cursor-pointer items-center gap-3 bg-surface-container p-3 transition-all hover:bg-surface-bright"
                onClick={() => onViewAgent?.(agent.id)}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center bg-surface-container-lowest text-on-surface-variant">
                    <Bot size={16} />
                  </div>
                  <div className={`absolute bottom-[-1px] right-[-1px] h-2.5 w-2.5 rotate-45 ${agent.status === 'online' ? 'bg-success' : 'bg-outline'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-headline text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface truncate">{agent.name}</span>
                    <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${agent.status === 'online' ? 'text-success' : 'text-on-surface-variant'}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-on-surface-variant">{formatRelativeTime(agent.last_heartbeat)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="shell-button shell-button-secondary focus-ring mt-4 w-full">
            View Registry ({agents.length})
          </button>
        </section>

        <section className="surface-card-alt xl:col-span-12 overflow-hidden pb-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface flex items-center gap-2">
              <Terminal size={18} className="text-tertiary" />
              Active Operator Sessions
            </h3>
            <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              {parallelSessions.length} Active Workflows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                <tr>
                  <th className="px-6 py-3 font-medium">Task ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Assigned To</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {parallelSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs font-body text-on-surface-variant italic">
                      No active operator sessions.
                    </td>
                  </tr>
                ) : parallelSessions.map((session) => (
                  <tr key={session.task_id} className="border-t border-outline-variant/15 hover:bg-surface-container transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-primary truncate max-w-[120px]">
                      {session.task_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-outline/20 text-on-surface uppercase font-bold tracking-tighter">
                        {session.terminal_status || 'RUNNING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-on-surface">
                      {session.assigned_agent_id || 'IDLE'}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate">
                      {session.title}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {formatRelativeTime(session.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="mt-12 flex flex-col gap-4 md:flex-row md:justify-between md:items-center border-t border-outline-variant/10 pt-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#7bdb80]"></div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest hidden sm:inline">Mainframe Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <Network size={14} className="text-outline" />
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest hidden sm:inline">Latency: <span className="text-secondary">Low</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={14} className="text-outline" />
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest hidden sm:inline">Relay Up</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-outline/50 uppercase tracking-[0.2em] break-all md:text-right">
          Secure Tunnel // 0xSHEP-442
        </div>
      </footer>
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string
  value: string
  note: string
  icon: ReactNode
  tone: 'success' | 'warning' | 'info'
}) {
  return (
    <div className="metric-card p-5 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
        {icon}
      </div>
      <div className={`font-headline text-[32px] font-bold lg:text-[48px] lg:leading-[56px] ${tone === 'warning' ? 'text-warning' : 'text-on-surface'}`}>{value}</div>
      <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        <span className={`status-diamond ${tone}`}></span>
        {note}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 w-full bg-surface-container-low rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 bg-surface-container-low rounded-md" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface-container-low rounded-md h-[400px]"></div>
        <div className="lg:col-span-4 bg-surface-container-low rounded-md h-[400px]"></div>
      </div>
    </div>
  )
}
