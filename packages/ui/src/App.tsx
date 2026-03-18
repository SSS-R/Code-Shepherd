import { useState, useEffect } from 'react'
import Dashboard from './screens/Dashboard'
import ApprovalQueue from './screens/ApprovalQueue'

type Screen = 'dashboard' | 'approvals'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check connection to relay server
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-white/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AgentOps
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Control Plane for AI Agents</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-4 pb-24">
        {currentScreen === 'dashboard' ? (
          <Dashboard />
        ) : (
          <ApprovalQueue />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="glass fixed bottom-0 left-0 right-0 border-t border-white/20 dark:border-white/10">
        <div className="max-w-lg mx-auto flex">
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
      className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all duration-200 ${
        isActive 
          ? 'text-primary scale-105' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}

export default App
