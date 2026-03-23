import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  BookOpen,
  Database,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Search,
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
import { loadSession } from './utils/authSession'

type Screen = 'dashboard' | 'inbox' | 'approvals' | 'timeline' | 'settings' | 'kanban' | 'agent-detail'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const session = loadSession()

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

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
    { key: 'inbox' as const, label: 'Agents', icon: <Radio size={20} /> },
    { key: 'approvals' as const, label: 'Approval Queue', icon: <BellRing size={20} /> },
    { key: 'kanban' as const, label: 'Task Board', icon: <Workflow size={20} /> },
    { key: 'timeline' as const, label: 'Timeline', icon: <History size={20} /> },
    { key: 'settings' as const, label: 'Settings', icon: <SettingsIcon size={20} /> },
  ]), [])

  const activeTopTab = currentScreen === 'dashboard' ? 'overview' : currentScreen === 'timeline' ? 'network' : 'resources'

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-4 md:px-6 h-14 bg-[#10141a] border-b border-[#414752]/15">
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-outline hover:text-primary-container transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <span className="text-lg font-bold text-[#58a6ff] tracking-widest uppercase font-headline">Code Shepherd</span>
          </div>

          <div className="hidden md:flex items-center gap-6 h-14">
            <nav className="flex items-center gap-4 h-14">
              <button className={`${activeTopTab === 'overview' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b919d] hover:bg-[#1c2026]'} h-full flex items-center px-2 text-sm font-medium transition-all duration-150`}>
                Overview
              </button>
              <button className={`${activeTopTab === 'network' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b919d] hover:bg-[#1c2026]'} h-full flex items-center px-2 text-sm font-medium transition-all duration-150`}>
                Network
              </button>
              <button className={`${activeTopTab === 'resources' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b919d] hover:bg-[#1c2026]'} h-full flex items-center px-2 text-sm font-medium transition-all duration-150`}>
                Resources
              </button>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            <button className="p-2 text-outline hover:bg-[#1c2026] rounded-sm transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-outline hover:bg-[#1c2026] rounded-sm transition-colors">
              <Radio size={20} />
            </button>
            <button className="p-2 text-outline hover:bg-[#1c2026] rounded-sm transition-colors">
              <Network size={20} />
            </button>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary-container">
            {(session?.name || session?.userId || 'OP').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* SideNavBar overlay for mobile and tablets */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300" onClick={() => setSidebarOpen(false)} />}

      {/* SideNavBar */}
      <aside className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col pt-4 pb-8 w-64 bg-[#181c22] border-r border-[#414752]/15 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:translate-x-0 lg:shadow-none`}>
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-sm border border-outline-variant/20">
            <Terminal size={20} className="text-primary text-xl" />
          </div>
          <div>
            <p className="text-primary-container font-bold text-xs uppercase tracking-wider font-body">ORCHESTRATOR</p>
            <p className="text-[10px] text-outline font-mono">v1.0.4-stable</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = currentScreen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setCurrentScreen(item.key)}
                className={`w-full text-left flex items-center px-6 py-3 gap-3 transition-all duration-200 ${isActive
                  ? 'bg-surface-container text-primary-container border-l-2 border-primary-container'
                  : 'text-outline hover:bg-[#262a31] hover:text-[#f0f6fc] border-l-2 border-transparent'}`}
              >
                {item.icon}
                <span className="font-body text-xs font-medium uppercase tracking-wider">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant/10 pt-4 space-y-1">
          <a className="text-outline flex items-center px-6 py-2 gap-3 hover:text-[#f0f6fc] transition-all duration-200" href="#">
            <Database size={18} />
            <span className="font-body text-[10px] font-medium uppercase tracking-widest">System Status</span>
          </a>
          <a className="text-outline flex items-center px-6 py-2 gap-3 hover:text-[#f0f6fc] transition-all duration-200" href="#">
            <BookOpen size={18} />
            <span className="font-body text-[10px] font-medium uppercase tracking-widest">Documentation</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="relative mt-14 min-h-[calc(100vh-3.5rem)] overflow-x-hidden px-4 py-4 md:px-6 md:py-6 lg:ml-64 lg:px-8 lg:py-8 max-w-[calc(100vw-0px)] lg:max-w-[calc(100vw-16rem)]">
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

      {/* Floating Command Palette Hint - Global logic could go here */}
      <div className="hidden xl:flex fixed bottom-6 right-6 glass-panel border border-outline-variant/20 px-4 py-2 rounded-lg items-center gap-4 z-50">
        <div className="flex items-center gap-1">
          <kbd className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[10px] font-mono border border-outline-variant/30 text-primary-fixed">CTRL</kbd>
          <span className="text-outline text-xs">+</span>
          <kbd className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[10px] font-mono border border-outline-variant/30 text-primary-fixed">K</kbd>
        </div>
        <div className="h-4 w-px bg-outline-variant/30"></div>
        <div className="text-xs text-outline font-medium uppercase tracking-tighter">Command Search</div>
      </div>
    </div>
  )
}

export default App
