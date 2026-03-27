import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  Bot,
  BookOpen,
  Database,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Terminal,
  Workflow,
  X,
  Radio,
  Network
} from 'lucide-react'
import Dashboard from './screens/Dashboard'
import ApprovalQueue from './screens/ApprovalQueue'
import AgentDetail from './screens/AgentDetail'
import KanbanBoard from './screens/KanbanBoard'
import ExecutionTimeline from './screens/ExecutionTimeline'
import Settings from './screens/Settings'
import Inbox from './screens/Inbox'
import AgentsOverview from './screens/AgentsOverview'
import OperatorProfile from './screens/OperatorProfile'
import { loadSession } from './utils/authSession'

type Screen = 'dashboard' | 'agents' | 'inbox' | 'approvals' | 'timeline' | 'settings' | 'profile' | 'kanban' | 'agent-detail'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const session = loadSession()

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('code-shepherd-theme') as 'dark' | 'light' | null
    const initialTheme = savedTheme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('code-shepherd-theme', theme)
  }, [theme])

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
    { key: 'dashboard' as const, label: 'Command Center', icon: <Terminal size={20} /> },
    { key: 'agents' as const, label: 'Agents', icon: <Bot size={20} /> },
    { key: 'inbox' as const, label: 'Inbox', icon: <Radio size={20} /> },
    { key: 'approvals' as const, label: 'Approval Queue', icon: <BellRing size={20} /> },
    { key: 'kanban' as const, label: 'Task Board', icon: <Workflow size={20} /> },
    { key: 'timeline' as const, label: 'Timeline', icon: <History size={20} /> },
    { key: 'settings' as const, label: 'Settings', icon: <SettingsIcon size={20} /> },
    { key: 'profile' as const, label: 'Profile', icon: <ShieldCheck size={20} /> },
  ]), [])

  const headerMeta = useMemo(() => {
    switch (currentScreen) {
      case 'dashboard':
        return { eyebrow: 'Control Plane', title: 'Command Center' }
      case 'inbox':
        return { eyebrow: 'Unified Communication', title: 'Communication Hub' }
      case 'agents':
        return { eyebrow: 'Unified Presence', title: 'Agents Overview' }
      case 'approvals':
        return { eyebrow: 'Remote Intervention', title: 'Approval Queue' }
      case 'kanban':
        return { eyebrow: 'Parallel Coordination', title: 'Mission Control' }
      case 'timeline':
        return { eyebrow: 'Auditability', title: 'Timeline / Audit Log' }
      case 'settings':
        return { eyebrow: 'Configuration', title: 'System Settings' }
      case 'profile':
        return { eyebrow: 'Operator Identity', title: 'Operator Profile' }
      case 'agent-detail':
        return { eyebrow: 'Agent View', title: 'Agent Detail' }
    }
  }, [currentScreen])

  return (
    <div className="app-shell min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary overflow-x-hidden">
      <div className={`relative z-10 min-h-screen lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[64px_minmax(0,1fr)]' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}>
        <aside className={`shell-panel shell-border fixed inset-y-0 left-0 z-40 flex ${sidebarOpen ? 'w-screen max-w-none sm:w-[280px] sm:max-w-[280px]' : 'w-screen max-w-none sm:w-[280px] sm:max-w-[280px]'} flex-col border-r border-t-0 border-l-0 border-b-0 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen ${sidebarCollapsed ? 'lg:w-[64px]' : 'lg:w-[240px]'} lg:max-w-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`border-b border-outline-variant/20 ${sidebarCollapsed ? 'px-3 py-6' : 'px-6 py-7'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
              <div className="flex h-11 w-11 items-center justify-center bg-surface-container-high text-primary">
                <Terminal size={20} />
              </div>
              <div className={sidebarCollapsed ? 'hidden' : 'block'}>
                <div className="font-headline text-sm font-bold uppercase tracking-[0.18em] text-primary">Code Shepherd</div>
                <div className="mt-1 font-headline text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">V2.4.0-STABLE</div>
              </div>
            </div>
          </div>

          <nav className={`custom-scrollbar flex-1 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'}`}>
            {navItems.map((item) => {
              const isActive = currentScreen === item.key
              return (
                <button
                  key={item.key}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setCurrentScreen(item.key)}
                  className={`focus-ring flex w-full items-center ${sidebarCollapsed ? 'justify-center min-h-12 px-2 py-3' : 'gap-3 min-h-12 px-4 py-3'} text-left transition-colors ${isActive ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                >
                  <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                  <span className={`${sidebarCollapsed ? 'hidden' : 'inline'} font-headline text-[11px] font-semibold uppercase tracking-[0.16em]`}>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className={`border-t border-outline-variant/20 ${sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
            {[{ Icon: Database, label: 'System Status' }, { Icon: BookOpen, label: 'Documentation' }].map((item) => (
              <a
                key={item.label}
                title={sidebarCollapsed ? item.label : undefined}
                className={`focus-ring flex items-center ${sidebarCollapsed ? 'justify-center min-h-12 px-2 py-3' : 'gap-3 min-h-12 px-4 py-3'} text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface`}
                href="#"
              >
                <item.Icon size={16} />
                <span className={`${sidebarCollapsed ? 'hidden' : 'inline'} font-headline text-[10px] font-semibold uppercase tracking-[0.16em]`}>{item.label}</span>
              </a>
            ))}
          </div>
        </aside>

        {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/45 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

        <div className="min-w-0">
          <header className="shell-panel shell-border sticky top-0 z-20 flex h-12 items-center justify-between border-x-0 border-t-0 px-4 sm:h-14 sm:px-6 lg:h-16 lg:px-10">
            <div className="flex min-w-0 items-center gap-4 lg:gap-6">
              <button className="focus-ring text-on-surface-variant lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Menu size={22} />
              </button>
              <button className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary lg:inline-flex" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Toggle sidebar rail">
                <LayoutDashboard size={18} />
              </button>
              <div className="min-w-0">
                <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{headerMeta.eyebrow}</p>
                <h1 className="truncate font-headline text-sm font-bold uppercase tracking-[0.12em] text-on-surface sm:text-base">{headerMeta.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary sm:inline-flex" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {[Bell, Radio, Network].map((Icon, index) => (
                <button key={index} className="focus-ring hidden h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary md:inline-flex">
                  <Icon size={18} />
                </button>
              ))}
              <div className="ml-2 flex items-center gap-3 border-l border-outline-variant/25 pl-3 sm:pl-4">
                <div className="hidden text-right sm:block">
                  <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Operator Status</p>
                  <p className="mt-1 flex items-center justify-end gap-2 font-mono text-[11px] text-on-surface">
                    <span className={`status-diamond ${isConnected ? 'success' : 'error'}`}></span>
                    {isConnected ? 'Relay Online' : 'Relay Offline'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center bg-surface-container-high font-headline text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {(session?.name || session?.userId || 'OP').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <main className="relative min-h-[calc(100vh-48px)] overflow-y-auto custom-scrollbar sm:min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-96px)]">
            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 2xl:px-16 2xl:py-12">
              {currentScreen === 'dashboard' ? (
                <Dashboard onViewAgent={(id) => { setSelectedAgentId(id); setCurrentScreen('agent-detail'); }} />
              ) : currentScreen === 'agents' ? (
                <AgentsOverview onViewAgent={(id) => { setSelectedAgentId(id); setCurrentScreen('agent-detail'); }} />
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
              ) : currentScreen === 'profile' ? (
                <OperatorProfile />
              ) : currentScreen === 'kanban' ? (
                <KanbanBoard />
              ) : null}
            </div>
          </main>

          <div className="shell-panel shell-border hidden h-8 items-center justify-between border-x-0 border-b-0 px-4 lg:flex lg:px-10">
            <div className="flex items-center gap-4 font-headline text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              <span className={`status-diamond ${isConnected ? 'success' : 'error'}`}></span>
              <span>{isConnected ? 'System Online' : 'System Offline'}</span>
              <span>Cluster Alpha</span>
            </div>
            <div className="font-mono text-[11px] text-on-surface-variant">Latency 24ms // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
