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
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* Absolute Grid Layout Wrapper */}
      <div className="grid grid-areas-layout grid-cols-layout grid-rows-layout h-screen w-screen overflow-hidden" 
           style={{ 
             display: 'grid', 
             gridTemplateAreas: '"header header" "sidebar main"',
             gridTemplateColumns: sidebarOpen ? '288px 1fr' : '0px 1fr',
             gridTemplateRows: '64px 1fr',
           }}>
        
        {/* Header Area */}
        <header style={{ gridArea: 'header' }} className="flex justify-between items-center px-4 lg:px-8 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm z-[100]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <button 
                className="p-2 text-outline hover:text-primary transition-colors focus:outline-none" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={24} />
              </button>
              <span className="text-xl font-bold text-primary-container tracking-[0.15em] uppercase font-headline hidden sm:block">Code Shepherd</span>
              <span className="text-lg font-bold text-primary-container tracking-widest uppercase font-headline sm:hidden">CS</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-8 h-16 ml-8">
              {['overview', 'network', 'resources'].map((tab) => (
                <button 
                  key={tab}
                  className={`${activeTopTab === tab ? 'text-primary border-b-2 border-primary' : 'text-outline/70 hover:text-on-surface'} h-full flex items-center px-1 text-[10px] font-bold uppercase tracking-widest transition-all`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2">
                {[Bell, Radio, Network].map((Icon, i) => (
                  <button key={i} className="p-2 text-outline hover:text-primary hover:bg-white/5 rounded-full transition-all">
                    <Icon size={18} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest leading-none mb-1">Status</p>
                  <p className="text-[10px] font-mono text-secondary flex items-center justify-end gap-1.5 leading-none font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    VERIFIED_OP
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full border border-primary/20 bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary shadow-lg">
                  {(session?.name || session?.userId || 'OP').slice(0, 2).toUpperCase()}
                </div>
              </div>
          </div>
        </header>

        {/* Sidebar Area */}
        <aside style={{ gridArea: 'sidebar' }} className={`
          bg-[#0d1117] border-r border-outline-variant/10 flex flex-col z-[90] transition-all duration-300 overflow-hidden
          ${!sidebarOpen ? 'w-0' : 'w-72 lg:w-64'}
        `}>
          <div className="p-6 mb-2 flex items-center gap-4 border-b border-outline-variant/5 shrink-0 whitespace-nowrap">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20 shadow-glow-primary">
              <Terminal size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] font-headline">Orchestrator</p>
              <p className="text-[9px] text-outline/60 font-mono mt-0.5">RELAY_ALPHA_01</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map(item => {
              const isActive = currentScreen === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentScreen(item.key)}
                  className={`
                    w-full text-left flex items-center px-4 py-3 gap-3.5 rounded-lg transition-all duration-200 group whitespace-nowrap
                    ${isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' 
                      : 'text-outline hover:bg-white/5 hover:text-on-surface'}
                  `}
                >
                  <span className={`${isActive ? 'text-primary' : 'text-outline group-hover:text-primary'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-outline-variant/10 bg-black/10 shrink-0">
             <div className="space-y-1">
              {[ {Icon: Database, label: 'Health'}, {Icon: BookOpen, label: 'Docs'} ].map((item, i) => (
                <a key={i} className="text-outline flex items-center px-4 py-2.5 gap-3 hover:text-on-surface hover:bg-white/5 rounded-md transition-all text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" href="#">
                  <item.Icon size={14} />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main style={{ gridArea: 'main' }} className="bg-surface overflow-y-auto custom-scrollbar relative">
           <div className="p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 max-w-[1600px] mx-auto min-h-full">
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
           </div>
        </main>
      </div>

      {/* Floating UI */}
      {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-10 left-10 w-12 h-12 bg-primary text-on-primary rounded-full shadow-glow-primary z-[200] lg:hidden flex items-center justify-center animate-bounce"
          >
            <Menu size={24} />
          </button>
      )}

      {/* Floating Hint */}
      <div className="hidden lg:flex fixed bottom-10 right-10 glass-panel border border-primary/20 px-6 py-3 rounded-full items-center gap-4 z-[200] shadow-glow-primary hover:scale-105 transition-all cursor-pointer">
        <div className="flex items-center gap-1.5">
            <kbd className="bg-primary/20 px-2.5 py-1 rounded text-[10px] font-mono border border-primary/30 text-primary uppercase font-bold">Ctrl</kbd>
            <span className="text-outline text-xs">+</span>
            <kbd className="bg-primary/20 px-2.5 py-1 rounded text-[10px] font-mono border border-primary/30 text-primary uppercase font-bold">K</kbd>
        </div>
        <div className="h-4 w-px bg-outline-variant/30"></div>
        <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Console</div>
      </div>
    </div>
  )
}

export default App
