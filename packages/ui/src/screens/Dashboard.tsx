import { useState, useEffect } from 'react'
import ActiveWorkflows from '../components/ActiveWorkflows'

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

export default function Dashboard({ onViewAgent }: { onViewAgent?: (id: string) => void }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ activeAgents: 0, pendingApprovals: 0, totalSessions: 0 })

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/agents').then(res => res.json()),
      fetch('http://localhost:3000/approvals/pending').then(res => res.json())
    ]).then(([agentsData, approvalsData]) => {
      setAgents(agentsData)
      setStats({
        activeAgents: agentsData.filter((a: Agent) => a.status === 'online').length,
        pendingApprovals: approvalsData.length,
        totalSessions: agentsData.length
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="glass-glow rounded-[20px] px-6 py-7 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4f9e97]/20 bg-[#4f9e97]/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#6ee1c9]">
              TRUST LAYER
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Govern your agents with a <span className="text-gradient-primary">calm mobile control plane</span>
            </h2>
            <p className="text-sm leading-7 text-neutral-400 md:text-base">
              Live fleet visibility, pending approvals, and resumable workflows in one glassmorphic dashboard inspired by the Zenfa design language.
            </p>
          </div>
          <div className="surface-panel rounded-2xl px-5 py-4 md:min-w-64">
            <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">System pulse</div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{stats.activeAgents}</div>
                <div className="text-sm text-neutral-500">agents online now</div>
              </div>
              <div className="rounded-full border border-[#4f9e97]/20 bg-[#4f9e97]/10 px-3 py-1 text-xs font-semibold text-[#6ee1c9]">
                {stats.pendingApprovals} pending reviews
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Active Agents"
          value={stats.activeAgents}
          icon="AG"
          color="from-[#4f9e97]/12 to-[#6ee1c9]/6 border-[#4f9e97]/20"
        />
        <StatCard
          label="Pending"
          value={stats.pendingApprovals}
          icon="AP"
          color="from-yellow-500/14 to-transparent border-yellow-500/20"
        />
        <StatCard
          label="Sessions"
          value={stats.totalSessions}
          icon="TL"
          color="from-white/6 to-transparent border-white/10"
        />
      </div>

      {/* Agents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Registered Agents
          </h2>
          <div className="text-sm text-neutral-500">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="glass rounded-[20px] p-16 text-center animate-slide-up border border-dashed border-white/10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#4f9e97]/20 bg-[#4f9e97]/10 text-lg font-bold tracking-[0.3em] text-[#6ee1c9]">AG</div>
            <p className="text-xl font-semibold text-white mb-3">
              No agents registered yet
            </p>
            <p className="text-neutral-400 max-w-md mx-auto">
              Agents will appear here when they register with the relay server. Start an agent to see it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={index}
                onClick={() => onViewAgent?.(agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active Workflows Section */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-4">Active Workflows</h2>
        <ActiveWorkflows />
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: string
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`glass rounded-[20px] p-5 bg-gradient-to-br ${color} animate-fade-in`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs font-bold tracking-[0.25em] text-[#6ee1c9]">{icon}</div>
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">Live</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-neutral-500">{label}</div>
    </div>
  )
}

interface AgentCardProps {
  agent: Agent
  index: number
  onClick?: () => void
}

function AgentCard({ agent, index, onClick }: AgentCardProps) {
  const statusColor = agent.status === 'online' ? 'border-[#4f9e97]/40' : 'border-white/8'

  return (
    <div
      onClick={onClick}
      className={`glass rounded-[20px] p-5 border ${statusColor} transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_0_30px_rgba(79,158,151,0.12)] animate-slide-up cursor-pointer`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-1 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-black/40 text-xs font-bold tracking-[0.25em] text-[#6ee1c9]">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${agent.status === 'online' ? 'bg-[#6ee1c9] animate-pulse' : 'bg-neutral-600'
                }`} />
              <h3 className="text-lg font-bold text-white">
                {agent.name}
              </h3>
            </div>
            <p className="text-sm text-neutral-500 mb-3">
              ID: {agent.id}
            </p>
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-[#4f9e97]/10 text-[#6ee1c9] border border-[#4f9e97]/20"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.22em] border ${agent.status === 'online'
            ? 'bg-[#4f9e97]/10 text-[#6ee1c9] border-[#4f9e97]/20'
            : 'bg-white/[0.03] text-neutral-400 border-white/8'
            }`}>
            {agent.status}
          </div>
        </div>
      </div>
    </div>
  )
}
