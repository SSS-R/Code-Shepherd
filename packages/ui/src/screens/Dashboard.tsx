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
    <div className="animate-fade-in pb-12 pt-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-12 mt-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-1 uppercase">Command Center</h1>
          <p className="text-outline text-sm font-body">Operational pulse for cluster <span className="text-primary font-mono">SHEPHERD-ALPHA-09</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <button className="w-full sm:w-auto px-4 py-2 bg-surface-container text-primary text-xs font-medium uppercase tracking-widest rounded-sm border border-outline-variant/20 hover:bg-surface-container-high transition-all">
            Export Log
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-gradient-to-b from-primary-container to-primary text-on-primary-container text-xs font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <Rocket size={14} />
            Deploy Agent
          </button>
        </div>
      </div>

      {/* Metric Grid - More robust breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        <div className="premium-card p-5 rounded-lg severity-marker-secondary">
          <p className="text-[10px] font-mono text-on-surface-variant/80 font-bold uppercase tracking-widest mb-2">Total Agents</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-on-surface">{agents.length}</span>
            <span className="text-secondary text-[10px] font-mono font-bold">+12%</span>
          </div>
        </div>

        <div className="premium-card p-5 rounded-lg severity-marker-secondary">
          <p className="text-[10px] font-mono text-on-surface-variant/80 font-bold uppercase tracking-widest mb-2">Online Agents</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-on-surface">{stats.activeAgents}</span>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#7bdb80] animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 rounded-lg severity-marker-error">
          <p className="text-[10px] font-mono text-on-surface-variant/80 font-bold uppercase tracking-widest mb-2">Blocked Agents</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-error">0</span>
            <span className="text-outline text-[10px] font-mono italic">0.0% rate</span>
          </div>
        </div>

        <div className="premium-card p-5 rounded-lg severity-marker-tertiary">
          <p className="text-[10px] font-mono text-on-surface-variant/80 font-bold uppercase tracking-widest mb-2">Pending Approvals</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-tertiary">{stats.pendingApprovals}</span>
            <span className="text-outline text-[10px] font-mono italic">Action req.</span>
          </div>
        </div>

        <div className="premium-card p-5 rounded-lg border border-outline-variant/10">
          <p className="text-[10px] font-mono text-on-surface-variant/80 font-bold uppercase tracking-widest mb-2">Active Workflows</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-bold text-on-surface">{parallelSessions.length}</span>
            <RefreshCw size={14} className="text-primary animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        <div className="xl:col-span-8 bg-surface-container-low rounded-md p-4 sm:p-6 flex flex-col min-h-[320px] sm:min-h-[400px] overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Activity Trends <span className="text-[10px] font-mono text-outline font-normal ml-2">24H CYCLE</span>
            </h3>
            <div className="hidden sm:flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="text-[10px] text-outline uppercase tracking-widest">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error"></div>
                <span className="text-[10px] text-outline uppercase tracking-widest">Failure</span>
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
              <line stroke="#414752" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="50" y2="50"></line>
              <line stroke="#414752" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="150" y2="150"></line>
              <line stroke="#414752" strokeDasharray="4" strokeWidth="0.5" x1="0" x2="1000" y1="250" y2="250"></line>
            </svg>
            <div className="absolute bottom-[-20px] left-0 w-full flex justify-between text-[10px] font-mono text-outline">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* Agent Presence Module */}
        <div className="xl:col-span-4 bg-surface-container-low rounded-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">Agent Presence</h3>
            <span className="text-[10px] font-mono bg-surface-container px-2 py-0.5 rounded text-outline">LIVE ({agents.length})</span>
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
                className="flex items-center gap-3 p-3 bg-surface-container rounded transition-all hover:bg-surface-container-high cursor-pointer"
                onClick={() => onViewAgent?.(agent.id)}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-sm bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-outline">
                    <Bot size={16} />
                  </div>
                  {agent.status === 'online' ? (
                    <div className="absolute bottom-[-2px] right-[-2px] w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface-container p-[1px]"></div>
                  ) : (
                    <div className="absolute bottom-[-2px] right-[-2px] w-2.5 h-2.5 rounded-full bg-outline border-2 border-surface-container p-[1px]"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-on-surface truncate">{agent.name}</span>
                    <span className={`text-[9px] font-mono ${agent.status === 'online' ? 'text-secondary' : 'text-outline'}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-surface-container-lowest mt-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${agent.status === 'online' ? 'bg-secondary w-full' : 'bg-outline w-0 transition-all'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border border-outline-variant/10 text-[10px] font-mono text-outline uppercase tracking-widest hover:bg-surface-container transition-colors">
            View Registry ({agents.length})
          </button>
        </div>

        {/* Live Parallel Sessions as Incidents Replacement */}
        <div className="xl:col-span-12 bg-surface-container-low rounded-md overflow-hidden pb-4">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <Terminal size={18} className="text-tertiary" />
              Live Operator Sessions
            </h3>
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono uppercase tracking-widest border border-primary/20">
                {parallelSessions.length} Active Workflows
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest text-[10px] font-mono text-outline uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-medium">Task ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Assigned To</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {parallelSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs font-mono text-outline italic">
                      No active operator sessions.
                    </td>
                  </tr>
                ) : (
                  parallelSessions.map(session => (
                    <tr key={session.task_id} className="hover:bg-surface-container transition-colors group">
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
