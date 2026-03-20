import { ReactNode, useState, useEffect } from 'react'
import { BellRing, History, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react'
import Dashboard from './screens/Dashboard'
import ApprovalQueue from './screens/ApprovalQueue'
import AgentDetail from './screens/AgentDetail'
import ActiveWorkflows from './components/ActiveWorkflows'
import KanbanBoard from './screens/KanbanBoard'
import ExecutionTimeline from './screens/ExecutionTimeline'
import Settings from './screens/Settings'

type Screen = 'dashboard' | 'approvals' | 'timeline' | 'settings' | 'kanban' | 'agent-detail'

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
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="shadow-overlay" />
      <header className="sticky top-0 z-20 border-b border-white/6 bg-[var(--bg-base)]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="surface-panel flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-blue-300">
                AO
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">AgentOps</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Command center for AI coding agents</p>
              </div>
            </div>
          </div>
          <div className="surface-panel rounded-full px-4 py-2 flex items-center gap-3 border border-white/8">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'status-online' : 'status-critical'}`} />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="h-4 w-px bg-white/8" />
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-500/20">
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
        ) : currentScreen === 'timeline' ? (
          <ExecutionTimeline />
        ) : currentScreen === 'settings' ? (
          <Settings />
        ) : currentScreen === 'kanban' ? (
          <KanbanBoard />
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/6 bg-[var(--bg-base)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-2">
          <div className="grid h-16 grid-cols-5 gap-1">
            <NavButton
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              isActive={currentScreen === 'dashboard'}
              onClick={() => setCurrentScreen('dashboard')}
            />
            <NavButton
              icon={<BellRing size={18} />}
              label="Approvals"
              isActive={currentScreen === 'approvals'}
              onClick={() => setCurrentScreen('approvals')}
            />
            <NavButton
              icon={<History size={18} />}
              label="Timeline"
              isActive={currentScreen === 'timeline'}
              onClick={() => setCurrentScreen('timeline')}
            />
            <NavButton
              icon={<LayoutDashboard size={18} />}
              label="Kanban"
              isActive={currentScreen === 'kanban'}
              onClick={() => setCurrentScreen('kanban')}
            />
            <NavButton
              icon={<SettingsIcon size={18} />}
              label="Settings"
              isActive={currentScreen === 'settings'}
              onClick={() => setCurrentScreen('settings')}
            />
          </div>
        </div>
      </nav>
    </div>
  )
}

interface NavButtonProps {
  icon: ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-full flex-col items-center justify-center gap-1.5 transition-all duration-200 ${isActive
        ? 'text-[var(--accent-primary)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      style={{ touchAction: 'manipulation' }}
    >
      {isActive && <span className="absolute top-0 h-0.5 w-12 rounded-full bg-[var(--accent-primary)]" />}
      <span>{icon}</span>
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  )
}

export default App
