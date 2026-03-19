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
    <div className="min-h-screen bg-black text-white">
      <div className="shadow-overlay" />
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/6 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="glass-glow flex h-11 w-11 items-center justify-center rounded-2xl border border-[#4f9e97]/30 text-lg font-semibold text-[#6ee1c9]">
                AO
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gradient-primary">
                  AgentOps
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">Mobile command surface for AI coding agents</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-full px-4 py-2 flex items-center gap-3 border border-white/8">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-[#6ee1c9]' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-neutral-300">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="h-4 w-px bg-white/8" />
            <span className="rounded-full bg-[#4f9e97]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#6ee1c9] border border-[#4f9e97]/20">
              Phase 1
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 pb-28">
        {currentScreen === 'dashboard' ? (
          <Dashboard onViewAgent={(id) => { setSelectedAgentId(id); setCurrentScreen('agent-detail'); }} />
        ) : currentScreen === 'agent-detail' && selectedAgentId ? (
          <AgentDetail agentId={selectedAgentId} onBack={() => { setSelectedAgentId(null); setCurrentScreen('dashboard'); }} />
        ) : currentScreen === 'approvals' ? (
          <ApprovalQueue />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-0 right-0 z-30 px-4">
        <div className="mx-auto max-w-md glass rounded-full border border-white/8 px-3 py-2">
          <div className="flex gap-2">
            <NavButton
              icon="DA"
              label="Dashboard"
              isActive={currentScreen === 'dashboard'}
              onClick={() => setCurrentScreen('dashboard')}
            />
            <NavButton
              icon="AP"
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
      className={`flex-1 rounded-full py-3 flex flex-col items-center gap-1.5 transition-all duration-200 ${isActive
          ? 'bg-[#4f9e97]/14 text-[#6ee1c9] shadow-[0_0_24px_rgba(79,158,151,0.18)]'
          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'
        }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-black/30 text-xs font-bold tracking-[0.2em]">{icon}</span>
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </button>
  )
}

export default App
