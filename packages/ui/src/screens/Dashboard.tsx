import { useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  capabilities: string[]
  status: 'online' | 'offline'
  last_heartbeat: string
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Registered Agents
        </h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
        </div>
      </div>
      
      {agents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-slide-up">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No agents registered yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Agents will appear here when they register with the relay server
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="glass rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'online' ? 'bg-success' : 'bg-offline'
                    }`} />
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {agent.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    ID: {agent.id}
                  </p>
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map((cap: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                  agent.status === 'online'
                    ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success-light'
                    : 'bg-offline/10 text-offline dark:bg-offline/20 dark:text-offline-light'
                }`}>
                  {agent.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
