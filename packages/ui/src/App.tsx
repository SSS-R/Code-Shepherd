import { useState, useEffect } from 'react'
import Dashboard from './screens/Dashboard'
import ApprovalQueue from './screens/ApprovalQueue'
import AgentDetail from './screens/AgentDetail'

type Screen = 'dashboard' | 'approvals' | 'agent-detail'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AgentOps
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Control Plane for AI Agents</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-slate-300">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {currentScreen === 'dashboard' ? (
          <Dashboard onViewAgent={(id) => { setSelectedAgentId(id); setCurrentScreen('agent-detail'); }} />
        ) : currentScreen === 'agent-detail' && selectedAgentId ? (
          <AgentDetail agentId={selectedAgentId} onBack={() => { setSelectedAgentId(null); setCurrentScreen('dashboard'); }} />
        ) : currentScreen === 'approvals' ? (
          <ApprovalQueue />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <NavButton
              icon="📊"
              label="Dashboard"
              isActive={currentScreen === 'dashboard'}
              onClick={() => setCurrentScreen('dashboard')}
            />
            <NavButton
              icon="🔔"
              label="Approvals"
              isActive={currentScreen === 'approvals'}
              onClick={() => setCurrentScreen('approvals')}
            />
          </div>
        </div>
      </nav>
    </div>
  )
}

interface NavButtonProps {
  icon: string
  label: string
  isActive: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${
        isActive 
          ? 'text-blue-400 scale-105' 
          : 'text-slate-400 hover:text-slate-300'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

export default App
