import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  Command,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Workflow,
  X,
} from 'lucide-react'
import Dashboard from './screens/Dashboard'
import ApprovalQueue from './screens/ApprovalQueue'
import AgentDetail from './screens/AgentDetail'
import KanbanBoard from './screens/KanbanBoard'
import ExecutionTimeline from './screens/ExecutionTimeline'
import Settings from './screens/Settings'
import Inbox from './screens/Inbox'
import { loadSession } from './utils/authSession'

type Screen = 'dashboard' | 'inbox' | 'approvals' | 'timeline' | 'settings' | 'kanban' | 'agent-detail'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const session = loadSession()

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark mode logic based on previous index.css
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false))
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [currentScreen])

  const navItems = useMemo(() => ([
    { key: 'dashboard' as const, label: 'Command Center', icon: <LayoutDashboard size={18} /> },
    { key: 'inbox' as const, label: 'Inbox', icon: <MessageSquare size={18} /> },
    { key: 'approvals' as const, label: 'Approval Queue', icon: <BellRing size={18} /> },
    { key: 'kanban' as const, label: 'Task Board', icon: <Workflow size={18} /> },
    { key: 'timeline' as const, label: 'Timeline', icon: <History size={18} /> },
    { key: 'settings' as const, label: 'Settings', icon: <SettingsIcon size={18} /> },
  ]), [])

  const currentTitle = navItems.find((item) => item.key === currentScreen)?.label ?? 'Code Shepherd'

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="shadow-overlay" />
      <div className="relative z-10 flex min-h-screen">
        <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between border-b border-[var(--border-subtle)] px-6 lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-primary-strong)] text-[var(--accent-primary-contrast)] shadow-[0_0_20px_rgba(88,166,255,0.18)]">
                <Command size={18} />
              </div>
              <div>
                <p className="font-headline text-base font-bold uppercase tracking-[0.18em] text-[var(--accent-primary-strong)]">Code Shepherd</p>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">orchestrator v1.0.4</p>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>

          <div className="flex h-[calc(100vh-4rem)] flex-col px-4 py-5">
            <div className="mb-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/80 px-4 py-3">
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">cluster memory</div>
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>42% used</span>
                <span className="text-[var(--accent-success)]">healthy</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                <div className="h-full w-[42%] rounded-full bg-[var(--accent-success)]" />
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <SidebarButton
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentScreen === item.key}
                  onClick={() => setCurrentScreen(item.key)}
                />
              ))}
            </nav>

            <div className="mt-auto space-y-4 px-2 pt-8">
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">system link</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{isConnected ? 'Relay Connected' : 'Relay Offline'}</p>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'status-online' : 'status-critical'}`} />
                </div>
              </div>
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]">
                <ShieldCheck size={16} />
                System Status
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-3 md:gap-4">
                <button className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-2 text-[var(--text-secondary)] lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                  <Menu size={18} />
                </button>
                <div>
                  <h1 className="font-headline text-lg font-bold tracking-tight text-[var(--text-primary)] md:text-xl">{currentTitle}</h1>
                  <p className="text-[12px] text-[var(--text-secondary)]">Unified control plane for active coding agents</p>
                </div>
              </div>

              <div className="hidden min-w-[260px] flex-1 items-center justify-center lg:flex">
                <div className="relative w-full max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search agents, approvals, and sessions"
                    className="app-input w-full pl-10 pr-4"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 md:flex">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'status-online' : 'status-critical'}`} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
                <button className="icon-button" aria-label="Notifications">
                  <Bell size={17} />
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="icon-button"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-xs font-semibold text-[var(--accent-primary-strong)]">
                  {(session?.name || session?.userId || 'OP').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <main className="relative z-10 flex-1 px-4 py-6 md:px-6 md:py-8">
            {currentScreen === 'dashboard' ? (
              <Dashboard onViewAgent={(id) => { setSelectedAgentId(id); setCurrentScreen('agent-detail'); }} />
            ) : currentScreen === 'inbox' ? (
              <Inbox initialAgentId={selectedAgentId} />
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
        </div>
      </div>
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

function SidebarButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all duration-200 ${isActive
        ? 'border-[var(--accent-primary-strong)]/30 bg-[var(--bg-surface-elevated)] text-[var(--accent-primary-strong)] shadow-[inset_2px_0_0_var(--accent-primary-strong)]'
        : 'border-transparent text-[var(--text-muted)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]'
        }`}
    >
      <span>{icon}</span>
      <span className="font-medium uppercase tracking-[0.14em]">{label}</span>
    </button>
  )
}

export default App
