import { useState, useEffect } from 'react'

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
    <div className="space-y-6 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Active Agents"
          value={stats.activeAgents}
          icon="🤖"
          color="from-blue-500/20 to-blue-600/20 border-blue-500/30"
        />
        <StatCard
          label="Pending"
          value={stats.pendingApprovals}
          icon="🔔"
          color="from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
        />
        <StatCard
          label="Sessions"
          value={stats.totalSessions}
          icon="📊"
          color="from-purple-500/20 to-purple-600/20 border-purple-500/30"
        />
      </div>

      {/* Agents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Registered Agents
          </h2>
          <div className="text-sm text-slate-400">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
          </div>
        </div>
        
        {agents.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center animate-slide-up">
            <div className="text-7xl mb-6">🤖</div>
            <p className="text-xl font-semibold text-white mb-3">
              No agents registered yet
            </p>
            <p className="text-slate-400 max-w-md mx-auto">
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
        <h2 className="text-xl font-bold text-white mb-4">Active Workflows</h2>
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
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${color} animate-fade-in`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

interface AgentCardProps {
  agent: Agent
  index: number
  onClick?: () => void
}

function AgentCard({ agent, index, onClick }: AgentCardProps) {
  const statusColor = agent.status === 'online' ? 'border-green-500' : 'border-slate-600'
  
  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl p-5 border-l-4 ${statusColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 animate-slide-up cursor-pointer`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              agent.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
            }`} />
            <h3 className="text-lg font-bold text-white">
              {agent.name}
            </h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            ID: {agent.id}
          </p>
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border ${
          agent.status === 'online'
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        }`}>
          {agent.status}
        </div>
      </div>
    </div>
  )
}
