import { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  Database,
  Network,
  Rocket,
  ShieldAlert,
  Terminal,
  Cpu,
  RefreshCw,
} from 'lucide-react'
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
        <div className="metric-card severity-marker-secondary p-5 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Total Managed Agents</p>
            <Terminal size={18} className="text-on-surface-variant" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-[32px] font-bold text-on-surface lg:text-[48px] lg:leading-[56px]">{agents.length}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className="status-diamond success"></span> Registry Synchronized</div>
        </div>

        <div className="metric-card p-5 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Active Conversations</p>
            <Bot size={18} className="text-on-surface-variant" />
          </div>
          <div className="font-headline text-[32px] font-bold text-on-surface lg:text-[48px] lg:leading-[56px]">{stats.activeAgents}</div>
          <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className="status-diamond success"></span> Collaborative Threads Live</div>
        </div>

        <div className="metric-card severity-marker-tertiary p-5 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Pending Approvals</p>
            <ShieldAlert size={18} className="text-warning" />
          </div>
          <div className="font-headline text-[32px] font-bold text-warning lg:text-[48px] lg:leading-[56px]">{stats.pendingApprovals}</div>
          <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className="status-diamond warning"></span> Action Required</div>
        </div>

        <div className="metric-card p-5 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">System Uptime</p>
            <Activity size={18} className="text-on-surface-variant" />
          </div>
          <div className="flex items-end gap-3">
            <div className="font-headline text-[32px] font-bold text-on-surface lg:text-[48px] lg:leading-[56px]">99.98%</div>
            <RefreshCw size={16} className="mb-3 text-primary animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="mt-4 flex items-center gap-2 font-headline text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"><span className="status-diamond info"></span> Relay Integrity Stable</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

        <div className="surface-card-alt xl:col-span-8 flex min-h-[320px] flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Recent Activity <span className="text-[10px] font-mono text-on-surface-variant font-normal ml-2">24H CYCLE</span>
            </h3>
            <div className="hidden sm:flex gap-4">
              <div className="flex items-center gap-2">
                <span className="status-diamond success"></span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-diamond error"></span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Failure</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative group min-h-[220px]">
            {/* SVG Trends placeholder from Stitch markup */}
            <svg className="w-full h-full min-h-[250px]" preserveAspectRatio="none" viewBox="0 0 1000 300">
              <path className="opacity-80" d="M0,250 Q100,220 200,240 T400,180 T600,210 T800,140 T1000,160" fill="none" stroke="#7bdb80" strokeWidth="2"></path>
              <path className="opacity-10" d="M0,250 Q100,220 200,240 T400,180 T600,210 T800,140 T1000,160 L1000,300 L0,300 Z" fill="url(#grad-success)"></path>
              <path className="opacity-60" d="M0,280 Q150,270 300,285 T600,260 T900,275 T1000,265" fill="none" stroke="#ffb4ab" strokeWidth="2"></path>
              <defs>
                <linearGradient id="grad-success" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#7bdb80', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: '#7bdb80', stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
              <line stroke="currentColor" className="text-outline-variant/30" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="50" y2="50"></line>
              <line stroke="currentColor" className="text-outline-variant/30" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="150" y2="150"></line>
              <line stroke="currentColor" className="text-outline-variant/30" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="250" y2="250"></line>
            </svg>
            <div className="absolute bottom-[-20px] left-0 w-full flex justify-between text-[10px] font-mono text-on-surface-variant">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* Agent Presence Module */}
        <div className="surface-card-alt xl:col-span-4 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
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
                  {agent.status === 'online' ? (
                    <div className="absolute bottom-[-1px] right-[-1px] h-2.5 w-2.5 rotate-45 bg-success"></div>
                  ) : (
                    <div className="absolute bottom-[-1px] right-[-1px] h-2.5 w-2.5 rotate-45 bg-outline"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-headline text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface truncate">{agent.name}</span>
                    <span className={`font-headline text-[10px] font-semibold uppercase tracking-[0.14em] ${agent.status === 'online' ? 'text-success' : 'text-on-surface-variant'}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-surface-container-lowest mt-2 overflow-hidden">
                    <div className={`h-full ${agent.status === 'online' ? 'bg-secondary w-full' : 'bg-outline w-0 transition-all'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="shell-button shell-button-secondary focus-ring mt-4 w-full">
            View Registry ({agents.length})
          </button>
        </div>

        <div className="surface-card-alt xl:col-span-12 overflow-hidden pb-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-on-surface flex items-center gap-2">
              <Terminal size={18} className="text-tertiary" />
              Active Operator Sessions
            </h3>
            <div className="flex gap-2">
              <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {parallelSessions.length} Active Workflows
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest font-headline text-[10px] text-on-surface-variant uppercase tracking-[0.14em]">
                <tr>
                  <th className="px-6 py-3 font-medium">Task ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Assigned To</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {parallelSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs font-body text-on-surface-variant italic">
                      No active operator sessions.
                    </td>
                  </tr>
                ) : (
                  parallelSessions.map(session => (
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
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-widest">Inspect</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Heartbeat Footer */}
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

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 w-full bg-surface-container-low rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-surface-container-low rounded-md" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface-container-low rounded-md h-[400px]"></div>
        <div className="lg:col-span-4 bg-surface-container-low rounded-md h-[400px]"></div>
      </div>
    </div>
  )
}
